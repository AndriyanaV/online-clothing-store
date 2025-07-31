import mongoose from "mongoose";
import { ProductVariant } from "../types/product";
import { PRODUCT_KEY } from "./product";
import { BaseColor, ExtendedColor, Size } from "../constants/product";
import { boolean, number, string } from "zod";

const Schema = mongoose.Schema;

export const PRODUCT_VARIANT_KEY = "ProductVariant";

const productVariantSchema = new Schema<ProductVariant>(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    color: {
      type: String,
      enum: [...Object.values(BaseColor), ...Object.values(ExtendedColor)],
      required: true,
    },
    size: {
      type: String,
      enum: Object.values(Size),
      required: true,
    },
    images: [{ type: String }],
    stock: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
    hasImages: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ProductVariant = mongoose.model(
  PRODUCT_VARIANT_KEY,
  productVariantSchema
);

export { ProductVariant };
