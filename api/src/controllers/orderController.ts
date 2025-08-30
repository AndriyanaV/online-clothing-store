import { Request, Response } from "express";
import { ApiResponse } from "../types/common";
import { createErrorJson, createSuccessJson } from "../utils/responseWrapper";
import {
  AddItemDto,
  AddOrderDto,
  ChangedPriceItem,
  Item,
  ItemDto,
  OrderDto,
  OrderFilter,
  OrderInfo,
  OrderResponseDto,
  OrderStatus,
} from "../types/order";
import { ProductVariant } from "../models/productVariant";
import { Product } from "../models/product";
import { Order } from "../models/order";
import { User } from "../models/user";
import { validateRequestWithZod } from "../middleware/validateRequestMiddleware";
import { addOrderBodySchema } from "../schemas/order/addOrder";
import {
  City,
  DeliveryStatus,
  PaymentMethod,
  PaymentStatus,
} from "../constants/order";
import mongoose from "mongoose";
import { jwtConfirmOrderExpiresInTime } from "../constants/common";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/externals/emailService";
import Stripe from "stripe";
import { changeOrderStatusBodySchema } from "../schemas/order/changeOrderstatus";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// export const addOrder = [
//   validateRequestWithZod(addOrderBodySchema),
//   async (
//     req: Request<{}, {}, AddOrderDto>,
//     res: Response<ApiResponse<null | string>>
//   ) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//       if (!req.customData?.userEmail || !req.customData?.userId) {
//         await session.abortTransaction();
//         session.endSession();
//         res
//           .status(400)
//           .json(createErrorJson([{ type: "order", msg: "User data missing" }]));
//         return;
//       }

//       const itemsToAdd = req.body.items;

//       const items: ItemDto[] = [];

//       for (let item of itemsToAdd) {
//         const itemToFind = await ProductVariant.findOneAndUpdate(
//           {
//             _id: item.variant_id, // ID dokumenta
//             sizes: {
//               $elemMatch: {
//                 // traži tačno taj element u nizu
//                 _id: item.item_id,
//                 stock: { $gte: item.quantity },
//               },
//             },
//           },
//           {
//             $inc: { "sizes.$.stock": -item.quantity }, // smanji stock
//           },
//           { new: true, session }
//         ).populate<{
//           product_id: { name: string; price: number; discountPrice?: number };
//         }>("product_id", "name price discountPrice");

//         console.log(itemToFind);

//         if (!itemToFind) {
//           // Ako bilo koji item nema dovoljno stock-a, rollback
//           await session.abortTransaction();
//           session.endSession();
//           res
//             .status(400)
//             .json(
//               createErrorJson([
//                 { type: "order", msg: "BE_not_enough_quantity" },
//               ])
//             );
//           return;
//         }

//         const product = itemToFind.product_id as any; // jer je populate

//         const unitPrice = product.discountPrice ?? product.price;

//         const sizeObj = itemToFind.sizes.find(
//           (s) => s._id?.toString() === item.item_id
//         );

//         let addedItem: ItemDto = {
//           item_id: item.item_id, // ovo je ID varijante
//           variant_id: item.variant_id,
//           quantity: item.quantity,
//           price: unitPrice * item.quantity,
//           name: product.name,
//           color: itemToFind.color,
//           size: sizeObj!.size,
//           image: itemToFind.images[0],
//         };

//         items.push(addedItem);
//       }

//       // Create token for confirming order
//       const expiresIn = jwtConfirmOrderExpiresInTime;

//       const confirmOrdertoken = jwt.sign(
//         { email: req.customData?.userEmail, UserId: req.customData?.userId },
//         JWT_SECRET,
//         { expiresIn }
//       );

//       //Create order
//       const newOrder = new Order({
//         user_id: req.customData?.userId,
//         firstName: req.body.firstName,
//         lastName: req.body.lastName,
//         phoneNumber: req.body.phoneNumber,
//         email: req.customData?.userEmail,
//         address: req.body.address,
//         city: req.body.city,
//         postCode: req.body.postCode,
//         paymentStatus: PaymentStatus.PENDING,
//         deliveryStatus: DeliveryStatus.PENDING,
//         items: items, // niz formiranih itema
//         confirmationToken: confirmOrdertoken,
//         totalPrice: items.reduce((sum, i) => sum + i.price, 0),
//       });

//       await newOrder.save({ session });

//       // 3️⃣ Commit transaction
//       await session.commitTransaction();
//       session.endSession();

//       res
//         .status(200)
//         .json(createSuccessJson("BE_order_created_successfully", null));
//     } catch (error: any) {
//       await session.abortTransaction();
//       session.endSession();
//       console.log(error);

//       res
//         .status(500)
//         .json(
//           createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
//         );
//     }
//   },
// ];

export const addOrder = [
  validateRequestWithZod(addOrderBodySchema),
  async (
    req: Request<{}, {}, AddOrderDto>,
    res: Response<ApiResponse<null | string | AddItemDto | OrderInfo>>
  ) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (!req.customData?.userEmail || !req.customData?.userId) {
        await session.abortTransaction();
        session.endSession();
        res
          .status(400)
          .json(createErrorJson([{ type: "order", msg: "User data missing" }]));
        return;
      }

      const itemsToAdd = req.body.items;
      const items: ItemDto[] = [];

      for (let item of itemsToAdd) {
        const itemToFind = await ProductVariant.findOneAndUpdate(
          {
            _id: item.variant_id,
            sizes: {
              $elemMatch: {
                _id: item.item_id,
                stock: { $gte: item.quantity },
              },
            },
          },
          {
            $inc: { "sizes.$.stock": -item.quantity },
          },
          { new: true, session }
        ).populate<{
          product_id: { name: string; price: number; discountPrice?: number };
        }>("product_id", "name price discountPrice");

        if (!itemToFind) {
          await session.abortTransaction();
          session.endSession();
          res
            .status(400)
            .json(
              createErrorJson(
                [{ type: "order", msg: "Not enough stock for item" }],
                item
              )
            );
          return;
        }

        const product = itemToFind.product_id as any;
        const unitPrice = product.discountPrice ?? product.price;

        // Check price - check forned price and evetually change from admin
        if (item.price && item.price !== unitPrice * item.quantity) {
          await session.abortTransaction();
          session.endSession();

          const changedItem: ChangedPriceItem = {
            item_id: item.item_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            oldPrice: item.price,
            newPrice: unitPrice * item.quantity,
          };
          res
            .status(400)
            .json(
              createErrorJson(
                [{ type: "order", msg: "Price change for item" }],
                changedItem
              )
            );
          return;
        }

        const sizeObj = itemToFind.sizes.find(
          (s) => s._id?.toString() === item.item_id
        );

        items.push({
          item_id: item.item_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: unitPrice * item.quantity,
          name: product.name,
          color: itemToFind.color,
          size: sizeObj!.size,
          image: itemToFind.images[0],
        });
      }

      const confirmOrdertoken = jwt.sign(
        { email: req.customData.userEmail, userId: req.customData.userId },
        JWT_SECRET,
        { expiresIn: jwtConfirmOrderExpiresInTime }
      );

      const newOrder = new Order({
        user_id: req.customData.userId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber,
        email: req.customData.userEmail,
        address: req.body.address,
        city: req.body.city,
        postCode: req.body.postCode,
        paymentStatus: PaymentStatus.PENDING,
        deliveryStatus: DeliveryStatus.PENDING,
        paymentMethod: req.body.paymentMethod,
        items,
        confirmationToken: confirmOrdertoken,
        totalPrice: items.reduce((sum, i) => sum + i.price, 0),
      });

      await newOrder.save({ session });

      const orderInfo: OrderInfo = {
        _id: newOrder._id.toString(),
        clientSecret: null,
      };

      let clientSecret: string | null = null;

      if (req.body.paymentMethod === PaymentMethod.CARD) {
        // kreiraj Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: newOrder.totalPrice * 100, // u centima
          currency: "usd", // ili RSD
          metadata: { orderId: newOrder._id.toString() },
        });
        clientSecret = paymentIntent.client_secret!;
        orderInfo.clientSecret = clientSecret;
      }

      await session.commitTransaction();
      session.endSession();

      res
        .status(200)
        .json(createSuccessJson("BE_order_created_successfully", orderInfo));
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      console.log(error);

      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
    }
  },
];

//Update order status
export const changeOrderStatus = [
  validateRequestWithZod(changeOrderStatusBodySchema),
  async (
    req: Request<{ orderId: string }, {}, OrderStatus>,
    res: Response<ApiResponse<OrderDto>>
  ) => {
    try {
      const id = req.params.orderId;
      const { deliveryStatus, paymentStatus } = req.body;

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        {
          ...(deliveryStatus && { deliveryStatus }),
          ...(paymentStatus && { paymentStatus }),
        },
        { new: true }
      );

      if (!updatedOrder) {
        res
          .status(400)
          .json(
            createErrorJson([{ type: "order", msg: "BE_order_not_found" }])
          );
        return;
      }

      const { _id, ...rest } = updatedOrder.toObject();
      const order = { _id: _id.toString(), ...rest };

      res
        .status(200)
        .json(createSuccessJson("BE_order_status_updated_sucessfully", order));
    } catch (error: any) {
      res
        .status(500)
        .json(
          createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
        );
      return;
    }
  },
];

//Cancel Order
export const cancelOrder = async (
  req: Request<{ orderId: string }, {}, {}>,
  res: Response<ApiResponse<null>>
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({ _id: req.params.orderId }).session(
      session
    );

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      res
        .status(404)
        .json(createErrorJson([{ type: "order", msg: "BE_order_not_found" }]));
      return;
    }

    // If already canceled
    if (
      order.paymentStatus === PaymentStatus.CANCELED &&
      order.deliveryStatus === DeliveryStatus.CANCELED
    ) {
      await session.abortTransaction();
      session.endSession();
      res
        .status(400)
        .json(
          createErrorJson([{ type: "order", msg: "BE_order_already_canceled" }])
        );
      return;
    }

    //Return stocks
    for (const item of order.items) {
      await ProductVariant.findOneAndUpdate(
        {
          _id: item.variant_id,
          "sizes._id": item.item_id, // dovoljno, nije ti potreban $elemMatch
        },
        {
          $inc: { "sizes.$.stock": item.quantity },
        },
        { new: true }
      );
    }

    order.paymentStatus = PaymentStatus.CANCELED;
    order.deliveryStatus = DeliveryStatus.CANCELED;

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .json(createSuccessJson("BE_order_canceled_successfully", null));
    return;
  } catch (error: any) {
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

export const softDeleteOrder = async (
  req: Request<{ orderId: string }, {}, {}>,
  res: Response<ApiResponse<null>>
) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId });

    if (!order) {
      res
        .status(404)
        .json(createErrorJson([{ type: "order", msg: "BE_order_not_found" }]));
      return;
    }

    if (!order.isActive) {
      res
        .status(400)
        .json(
          createErrorJson([{ type: "order", msg: "BE_order_already_inactive" }])
        );
      return;
    }

    order.isActive = false;
    await order.save();

    res
      .status(200)
      .json(createSuccessJson("BE_order_soft_deleted_successfully", null));
    return;
  } catch (error: any) {
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

//get all orders - admin panel
export const getOrders = async (
  req: Request<
    {},
    {},
    {},
    {
      deliveryStatus?: DeliveryStatus;
      paymentStatus?: PaymentStatus;
      paymentMethod?: PaymentMethod;
      city?: City;
      sortOption?: "asc" | "desc";
      sortBy?: "totalPrice" | "createdAt";
      page?: string;
      limit?: string;
    }

    //Pagnation
  >,
  res: Response<ApiResponse<OrderResponseDto>>
) => {
  try {
    const {
      deliveryStatus,
      paymentStatus,
      paymentMethod,
      city,
      sortOption = "desc",
      sortBy = "createdAt",
      page = "1",
      limit = "30",
    } = req.query;

    let orderFilter: OrderFilter = { isActive: true };
    if (deliveryStatus) orderFilter.deliveryStatus = deliveryStatus;
    if (paymentStatus) orderFilter.paymentStatus = paymentStatus;
    if (paymentMethod) orderFilter.paymentMethod = paymentMethod;
    if (city) orderFilter.city = city;

    //Pagination
    const pageNum = parseInt(req.query.page || "1");
    const limitNum = parseInt(req.query.limit || "30");
    const skip = (pageNum - 1) * limitNum;

    //Sort
    const sort: any = { createdAt: -1 };
    if (sortBy === "totalPrice" || sortBy === "createdAt") {
      sort[sortBy] = sortOption === "asc" ? 1 : -1;
    }

    const result = await Order.aggregate([
      { $match: orderFilter },
      {
        $facet: {
          orders: [{ $sort: sort }, { $skip: skip }, { $limit: limitNum }],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    // totalCount dolazi kao niz sa objektom { count: number }
    const totalCount = result[0].totalCount[0]?.count || 0;
    const orders = result[0].orders;
    const totalPages = Math.ceil(totalCount / limitNum);

    const getedOrders: OrderDto[] = orders.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
    }));

    const orderResponse: OrderResponseDto = {
      page: pageNum,
      total: totalCount,
      totalPages: totalPages,
      orders: getedOrders,
    };

    res
      .status(200)
      .json(createSuccessJson("BE_get_orders_success", orderResponse));
  } catch (error: any) {
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};

//get all orders - user orders
export const getMyOrders = async (
  req: Request<
    {},
    {},
    {},
    {
      deliveryStatus?: DeliveryStatus;
      paymentStatus?: PaymentStatus;
      paymentMethod?: PaymentMethod;

      sortOption?: "asc" | "desc";
      sortBy?: "totalPrice" | "createdAt";
      page?: string;
      limit?: string;
    }

    //Pagnation
  >,
  res: Response<ApiResponse<OrderResponseDto>>
) => {
  try {
    const userId = req.customData?.userId;

    if (!userId) {
      res
        .status(404)
        .json(createErrorJson([{ type: "order", msg: "BE_user_not_found" }]));
      return;
    }

    const {
      deliveryStatus,
      paymentStatus,
      paymentMethod,
      sortOption = "desc",
      sortBy = "createdAt",
      page = "1",
      limit = "30",
    } = req.query;

    let orderFilter: OrderFilter = { isActive: true, user: userId };
    if (deliveryStatus) orderFilter.deliveryStatus = deliveryStatus;
    if (paymentStatus) orderFilter.paymentStatus = paymentStatus;
    if (paymentMethod) orderFilter.paymentMethod = paymentMethod;

    //Pagination
    const pageNum = parseInt(req.query.page || "1");
    const limitNum = parseInt(req.query.limit || "30");
    const skip = (pageNum - 1) * limitNum;

    //Sort
    const sort: any = { createdAt: -1 };
    if (sortBy === "totalPrice" || sortBy === "createdAt") {
      sort[sortBy] = sortOption === "asc" ? 1 : -1;
    }

    const result = await Order.aggregate([
      { $match: orderFilter },
      {
        $facet: {
          orders: [{ $sort: sort }, { $skip: skip }, { $limit: limitNum }],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    // totalCount dolazi kao niz sa objektom { count: number }
    const totalCount = result[0].totalCount[0]?.count || 0;
    const orders = result[0].orders;
    const totalPages = Math.ceil(totalCount / limitNum);

    const getedOrders: OrderDto[] = orders.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
    }));

    const orderResponse: OrderResponseDto = {
      page: pageNum,
      total: totalCount,
      totalPages: totalPages,
      orders: getedOrders,
    };

    res
      .status(200)
      .json(createSuccessJson("BE_get_orders_success", orderResponse));
  } catch (error: any) {
    res
      .status(500)
      .json(
        createErrorJson([{ type: "general", msg: "BE_something_went_wrong" }])
      );
    return;
  }
};
