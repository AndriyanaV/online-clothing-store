import mongoose from "mongoose";
import { Product } from "../types/product";
import { CareInstructions, CountryBrand, Material, ProductTag } from "../constants/product";
import { PRODUCT_VARIANT_KEY } from "./productVariant";
import { CATEGORY_KEY } from "./category";

const Schema = mongoose.Schema;

export const PRODUCT_KEY = 'Product';

const  ProductSchema= new Schema<Product>({
    category:{ type: mongoose.Schema.Types.ObjectId, ref: CATEGORY_KEY ,  required: true},
    name:{type: String, required: true, unique:true} ,
    description:{type:String, required:true},
    material: { type: String, enum: Object.values(Material), required:true},
    careInstructions: {  type: String, enum: Object.values(CareInstructions), required:true },
    countryBrand: {  type: String, enum: Object.values(CountryBrand), required:true },
    price:{type:Number, required:true},
    discountPrice:{type:Number, min: 0},
    productTag:[{  type: String, enum: Object.values(ProductTag) }],
    variations: [{ type: mongoose.Schema.Types.ObjectId, ref: PRODUCT_VARIANT_KEY }],  
},
{ timestamps: true })

const Product = mongoose.model(PRODUCT_KEY, ProductSchema);

export {Product}