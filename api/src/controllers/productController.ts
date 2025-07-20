import { uploadFiles } from "../middleware/uploadMilldeware";
import { validateRequestWithZodAndCleanFiles } from "../middleware/validateRequestWithZodAndCleanFiles";
import { ApiResponse } from "../types/common";
import { UploadPath, UploadType } from "../types/uploadFiles";
import { Request, Response } from 'express';
import { createErrorJson, createSuccessJson } from "../utils/responseWrapper";
import { validateRequestWithZod } from "../middleware/validateRequestMiddleware";
import { request } from "http";
import { Product } from "../models/product";
import { addProductBasicInfoBodySchema } from "../schemas/product/addProduct";
import { AddedProductInfo, ProductBasicInfoToAddDto, ProductVariantAddedDto, ProductVariantDto, ProductVariantToAdd } from "../types/product";
import { productVariantSchema } from "../schemas/product/addProductVariant";
import { ProductVariant } from "../models/productVariant";

// Podešavaš opcije za upload
const uploadOptions = {
  type: UploadType.MULTIPLE,
  uploadPath: UploadPath.PRODUCT,
  maxFileSize: 5 * 1024 * 1024, // npr 5MB
};


//Dodavanje basic podataka o proizvodu
export const addProductBadicInfo= [
    validateRequestWithZod(addProductBasicInfoBodySchema),
    async(
        req:Request<{},{}, ProductBasicInfoToAddDto>,
        res:Response<ApiResponse<AddedProductInfo>>
    )=>{
    try{

        const product= await Product.findOne({name:req.body.name})

        if (product) {
             res.status(400).json(createErrorJson([{ type: 'addProduct', msg: 'BE_product_already_exists' }]));
             return;
        }

        const newProduct = new Product({
                    category:req.body.category,
                    name: req.body.name,
                    description:req.body.description,
                    material:req.body.material,
                    careInstructions:req.body.careInstructions,
                    countryBrand:req.body.countryBrand,
                    price:req.body.price,
                    discountPrice:req.body.discountPrice,
                    productTag:req.body.productTag,
                    variations: []
            })

            await newProduct.save();

            console.log("Products main info sucessfully added");

            const id=newProduct._id.toString();

            const addedProductInfo = {
                _id: id,
                name:newProduct.name
            };


            res.status(200).json(createSuccessJson("BE_product_basic_info_added_successfully", addedProductInfo));
            return;

           
        }catch(error:any){
                    console.error(error);
                     res.status(500).json(createErrorJson([{ type: 'general', msg: 'BE_something_went_wrong' }]));
                     return;
            }

    }

]


export const addProductVariationInfo= [
    validateRequestWithZod(productVariantSchema),
    async(
        req:Request<{},{}, ProductVariantToAdd>,
        res:Response<ApiResponse<ProductVariantAddedDto>>
    )=>{
    try{
        
        const existingVariant = await ProductVariant.findOne({
            product_id: req.body.product_id,
            color: req.body.color,
            size: req.body.size,
        });

        if (existingVariant) {
             res.status(400).json(createErrorJson([{ type: 'addProductVariantInfo', msg: 'BE_product_variant_already_exists' }]));
             return;
        }

        const newProductVariant = new ProductVariant({
                    product_id:req.body.product_id,
                    color: req.body.color,
                    size: req.body.size, 
                    stock: req.body.stock,
                    isAvailable: req.body.isAvailable
            })

            await newProductVariant.save();

            console.log("Products variant info sucessfully added");

            const id=newProductVariant._id.toString();

            const addedProductVariantInfo = {
                _id: id,
                color:newProductVariant.color
               
            };


            res.status(200).json(createSuccessJson("BE_product_basic_info_added_successfully", addedProductVariantInfo));
            return;

           
        }catch(error:any){
                    console.error(error);
                     res.status(500).json(createErrorJson([{ type: 'general', msg: 'BE_something_went_wrong' }]));
                     return;
            }

    }

]