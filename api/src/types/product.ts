import { Types } from "mongoose";
import { BaseColor, CareInstructions, CountryBrand, ExtendedColor, Material, ProductTag, Size } from "../constants/product";
import { Interface } from "readline";
import { string } from "zod";

export interface Product{
    _id?: Types.ObjectId,
    category:Types.ObjectId,
    subcategory:Types.ObjectId,
    name: string,
    description:string,
    material:Material,
    careInstructions:CareInstructions,
    countryBrand:CountryBrand,
    price:number,
    discountPrice?:number,
    variations:Array<Types.ObjectId>; 
    productTag?:ProductTag[]   
}

export interface ProductDto extends Omit<Product, '_id' >{
    _id:string
}

export interface AddedProductInfo extends Pick<ProductDto, '_id' | 'name'> {}

export interface ProductVariant{
    _id?: Types.ObjectId,
    product_id: Types.ObjectId,
    color:BaseColor | ExtendedColor,
    size:Size,
    images:string[],
    stock:number,
    isAvailable?:boolean,
    hasImages:boolean
}

 export interface ProductVariantDto extends  Omit<ProductVariant, '_id' >{
    _id:string
 }

export interface ProductBasicInfoToAddDto extends Omit<Product, '_id' | 'variations' | 'category' | 'subcategory'> {
    category:string,
    subcategory:string
    
}

export interface ProductVariantToAdd extends Omit<ProductVariant, '_id'  | 'images' | 'product_id' | 'hasImages'>{
  product_id:string
}


export interface ProductVariantAddedDto {
    _id:string,
    color:string
 }

export interface addProductVariantPicture {
    product_id:string,
    color:string,
    name:string
}

export type ValidateVariantInfoBeforeUpload = 
  Pick<Product, 'name'> & 
  Pick<ProductVariant, 'color'> & {
    product_id: string;
  };