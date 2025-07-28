import { UPLOADS_FIELD } from "../constants/uploads"
import { UploadFilesOptions, UploadPath } from "../types/uploadFiles"
import { Request } from "express";
import path from 'path';
import fs from 'fs';
import multer from 'multer';

export const getFullUploadPath= (req:Request, options:UploadFilesOptions) => {

        try{
            const  uploadPath = options.uploadPath;
              
            let fullPath= path.join(UPLOADS_FIELD, uploadPath);

            // Ako je proizvod – dodaj name i color iz body-ja
            if (uploadPath === UploadPath.PRODUCT) {
                  // console.log("podaci koje vidim")
                  // console.log(req.app.locals.sharedData.productName)
                  const productName = req.app.locals.sharedData.productName?.toString().replace(/\s+/g, '_') || 'unknown_product';
                  const color = req.app.locals.sharedData.variantColor?.toString().replace(/\s+/g, '_') || 'unknown_color';

                  fullPath = path.join(fullPath, productName, color);
            }

            //Kreiraj direktorijum ako on ne posotji jos uvek
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
        }

        return fullPath;
    } catch(error){
            throw new Error('BE_SOMETHING_WENT_WRONG')
        }

    
    }           
            
export const checkFileType= (file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const filetypes = /jpeg|jpg|png|jfif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('FE_upload_image_files_only'));
  }

}


