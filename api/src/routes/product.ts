import express, { Router } from "express";
import { addProductBasicInfo, addProductVariationInfo, addProductVariationPics, updateProductBasicInfo } from "../controllers/productController";
import addColorAndNameToReqBody from "../middleware/addColorAndNameToReqBody";

const productRouter=  express.Router();

productRouter.post('/addProductBasicInfo',addProductBasicInfo);
productRouter.post('/addProductVariationInfo',addProductVariationInfo);
productRouter.post('/addProductVariationPics/:productId/:variationId', addColorAndNameToReqBody, addProductVariationPics)
productRouter.post("/updateProductBasicInfo/:productId", updateProductBasicInfo);


export default productRouter;