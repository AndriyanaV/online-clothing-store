import { Types } from "mongoose";
import {
  DeliveryStatus,
  PaymentMethod,
  PaymentStatus,
} from "../constants/order";

export interface Order {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  postCode: string;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  items: Item[];
  totalPrice: number;
  paymentMethod: PaymentMethod;
  confirmationToken: string;
  isActive: boolean;
}

export interface Item {
  item_id: Types.ObjectId;
  variant_id: Types.ObjectId;
  quantity: number;
  price: number;
  name?: string;
  color: string;
  size: string;
  image: string;
}

export interface AddItemDto
  extends Omit<
    Item,
    "item_id" | "variant_id" | "color" | "size" | "name" | "price" | "image"
  > {
  item_id: string;
  variant_id: string;
  price: number;
}

export interface OrderDto extends Omit<Order, "_id"> {
  _id: string;
}

export interface ItemDto extends Omit<Item, "item_id" | "variant_id"> {
  item_id: string;
  variant_id: string;
}

export interface AddOrderDto
  extends Omit<
    Order,
    | "_id"
    | "user_id"
    | "email"
    | "paymentStatus"
    | "deliveryStatus"
    | "isActive"
    | "items"
    | "totalPrice"
    | "confirmationToken"
  > {
  items: AddItemDto[];
}

export type UpdateOrderDto = Partial<
  Pick<Order, "paymentStatus" | "deliveryStatus">
>;

export interface ChangedPriceItem extends Omit<AddItemDto, "price"> {
  newPrice: number;
  oldPrice: number;
}

export interface OrderInfo {
  _id: string;
  clientSecret: string | null;
}

export interface OrderStatus
  extends Partial<Pick<Order, "deliveryStatus" | "paymentStatus">> {}

export interface OrderFilter {
  deliveryStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  city?: string;
  isActive: boolean;
  user?: string;
}

export interface OrderResponseDto {
  page: number;
  total: number;
  totalPages: number;
  orders: OrderDto[];
}
