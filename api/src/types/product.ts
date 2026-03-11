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
  subcategory: Types.ObjectId[];
  name: string;
  description: string;
  material: Material;
  careInstructions: CareInstructions;
  countryBrand: CountryBrand;
  price: number;
  discountPrice?: number;
  productTag?: ProductTag[];
  modelCode: string;
  isActive: boolean;
}

export interface ProductDto
  extends Omit<Product, "_id" | "category" | "subcategory" | "isActive"> {
  _id: string;
  category: string;
  subcategory: string[];
}

export interface AddedProductInfo extends ProductDto {
  isActive: boolean;
}

export interface UpdatedProductInfo extends ProductDto {
  isActive: boolean;
}

export interface SizeInfo {
  size: Size;
  stock: number;
  SKU: string;
  _id?: Types.ObjectId;
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
  cloudinaryIds: string[];
  isActive: boolean;
}

export interface ProductVariantDto
  extends Omit<ProductVariant, "_id" | "cloudinaryIds" | "product_id"> {
  _id: string;
  product_id: string;
}

export interface ProductBasicInfoToAddDto
  extends Omit<Product, "_id" | "category" | "subcategory"> {
  category: string;
  subcategory: string[];
}

export interface VariantSizeInfo {
  _id: string;
  size: Size;
  stock: number;
  isAviable: boolean;
}

export interface SizeInfoToAdd extends Omit<SizeInfo, "SKU" | "_id"> {}

export interface SizeInfoToUpdate extends SizeInfoToAdd {}

export interface ProductVariantToAdd
  extends Omit<
    ProductVariant,
    "_id" | "images" | "product_id" | "sizes" | "cloudinaryIds"
  > {
  product_id: string;
  sizes: SizeInfoToAdd[];
}

export interface ProductVariantAddedDto extends ProductVariantDto {}

export interface ProductVariantUpdatedDto extends ProductVariantDto {}

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
    | "product_id"
    | "color"
    | "sizes"
    | "images"
    | "hasImages"
    | "isActive"
    | "cloudinaryIds"
  > {
  sizes: SizeInfoToUpdate[];
  isActive?: boolean;
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
  isActive: Boolean;
}

export interface VariationFilter {
  color?: BaseColor | ExtendedColor;
  size?: string;
  images: Object;
  isActive: boolean;
}

export interface ProductsResponseDto {
  page: number;
  totalPages: number;
  total: number;
  products: ProductDto[];
}
