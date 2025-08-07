import mongoose from "mongoose";
import { ProductVariant, SizeInfo } from "../types/product";
import { PRODUCT_KEY } from "./product";
import { BaseColor, ExtendedColor, Size } from "../constants/product";
import { boolean, number, string } from "zod";

const Schema = mongoose.Schema;

export const PRODUCT_VARIANT_KEY = "ProductVariant";

const SizeInfoSchema = new Schema<SizeInfo>({
  size: { type: String, enum: Object.values(Size), required: true },
  // isAvailable: { type: Boolean, required: true },
  stock: { type: Number, required: true },
});

const productVariantSchema = new Schema<ProductVariant>(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    color: {
      type: String,
      enum: [...Object.values(BaseColor), ...Object.values(ExtendedColor)],
      required: true,
    },
    sizes: {
      type: [SizeInfoSchema],
      required: true,
    },
    images: [{ type: String }],
    hasImages: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ProductVariant = mongoose.model(
  PRODUCT_VARIANT_KEY,
  productVariantSchema
);

export { ProductVariant };
