import { Types } from "mongoose";
import { BaseColor, CareInstructions, CountryBrand, ExtendedColor, Material, ProductTag, Size } from "../constants/product";
import { Interface } from "readline";

export interface Product{
    _id?: Types.ObjectId,
    category:Types.ObjectId,
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
    isAvailable:boolean
}

 export interface ProductVariantDto extends  Omit<ProductVariant, '_id' >{
    _id:string
 }

export interface ProductBasicInfoToAddDto extends Omit<Product, '_id' | 'variations' | 'category' > {
    category:string,
    
}

export interface ProductVariantToAdd extends Omit<ProductVariant, '_id'  | 'images' | 'product_id'>{
  product_id:string
}


export interface ProductVariantAddedDto {
    _id:string,
    color:string
 }