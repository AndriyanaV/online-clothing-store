import mongoose from "mongoose";
import { Item, Order } from "../types/order";
import { DeliveryStatus, PaymentStatus } from "../constants/order";
import { boolean } from "zod";

const Schema = mongoose.Schema;

export const ORDER_KEY = "Order";

const ItemSchema = new Schema<Item>(
  {
    item_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ProductVariant",
    },
    variant_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ProductVariant",
    },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    name: { type: String },
    size: { type: String },
    color: { type: String },
    image: { type: String },
  },
  { _id: false } // ne kreira _id za svaki item, opcionalno
);

const OrderSchema = new Schema<Order>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postCode: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    deliveryStatus: {
      type: String,
      enum: Object.values(DeliveryStatus),
      default: DeliveryStatus.PENDING,
    },
    items: { type: [ItemSchema], required: true },
    totalPrice: { type: Number, required: true },
    confirmationToken: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Order = mongoose.model(ORDER_KEY, OrderSchema);

export { Order };
