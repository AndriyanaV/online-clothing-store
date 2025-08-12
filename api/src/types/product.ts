import { Types } from "mongoose";
import {
  BaseColor,
  CareInstructions,
  CountryBrand,
  ExtendedColor,
  Material,
  ProductTag,
  Size,
} from "../constants/product";
import { Interface } from "readline";
import { string } from "zod";

export interface Product {
  _id?: Types.ObjectId;
  category: Types.ObjectId;
  subcategory: Types.ObjectId;
  name: string;
  description: string;
  material: Material;
  careInstructions: CareInstructions;
  countryBrand: CountryBrand;
  price: number;
  discountPrice?: number;
  variations: Array<Types.ObjectId>;
  productTag?: ProductTag[];
  modelCode: string;
}

export interface ProductDto
  extends Omit<Product, "_id" | "category" | "subcategory" | "variations"> {
  _id: string;
  category: string;
  subcategory: string;
  variations: SizeInfoDto[];
}

export interface AddedProductInfo extends Pick<ProductDto, "_id" | "name"> {}

export interface SizeInfo {
  size: Size;
  stock: number;
  SKU: string;
}

export interface SizeInfoDto extends SizeInfo {
  isAvailable: boolean;
}

export interface ProductVariant {
  _id?: Types.ObjectId;
  product_id: Types.ObjectId;
  color: BaseColor | ExtendedColor;
  sizes: SizeInfo[];
  images: string[];
}

export interface ProductVariantDto extends Omit<ProductVariant, "_id"> {
  _id: string;
}

export interface ProductBasicInfoToAddDto
  extends Omit<Product, "_id" | "variations" | "category" | "subcategory"> {
  category: string;
  subcategory: string;
}

export interface VariantSizeInfo {
  _id: string;
  size: Size;
  stock: number;
  isAviable: boolean;
}

export interface SizeInfoToAdd extends Omit<SizeInfo, "SKU"> {}

export interface SizeInfoToUpdate extends SizeInfoToAdd {}

export interface ProductVariantToAdd
  extends Omit<
    ProductVariant,
    "_id" | "images" | "product_id" | "hasImages" | "sizes"
  > {
  product_id: string;
  sizes: SizeInfoToAdd[];
}

export interface ProductVariantAddedDto {
  _id: string;
}

export interface addProductVariantPicture {
  product_id: string;
  color: string;
  name: string;
}

export type ProductBasicInfoToUpdateDto = Omit<
  Partial<ProductBasicInfoToAddDto>,
  "modelCode"
>;

export interface ProductVariantToUpdateDto
  extends Omit<
    ProductVariantToAdd,
    "product_id" | "color" | "sizes" | "images" | "hasImages"
  > {
  sizes: SizeInfoToUpdate[];
}

export interface ProductBySku extends Omit<ProductVariantDto, "sizes"> {
  sizes: SizeInfoDto[];
}

export interface TagsToAdd {
  tags: ProductTag[];
}

export interface AvailableVariantColors {
  availableColors: (BaseColor | ExtendedColor)[];
}

export interface ProductFilter {
  material?: Material;
  discountPrice?: Object;
  price?: Object;
}

export interface VariationFilter {
  color?: BaseColor | ExtendedColor;
  sizes?: Object;
}
