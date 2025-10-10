import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types/common";
import {
  UploadFilesOptions,
  UploadPath,
  UploadType,
} from "../types/uploadFiles";
import multer from "multer";
import { checkFileType } from "../utils/uploadUtils";
import { UPLOADS_FIELD } from "../constants/uploads";
import { createErrorJson } from "../utils/responseWrapper";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadFilesOnCloudinary = (
  options: UploadFilesOptions,
  onErrorCb?: () => void
) => {
  // We are creating Cloudinary storage
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      // Folder can be passed from options or req.body
      let folder = "my_uploads"; // basic folder

      // Here we use the custom data provided by the previous middleware
      // to configure Cloudinary folder structure
      if (options.uploadPath === UploadPath.PRODUCT) {
        folder += "/product";
        // add productName and variationColor if they exist - for product variation image upload
        const productName = (req.customData?.productName || "unknown_product")
          .trim()
          .replace(/\s+/g, "_");
        const variationColor = (
          req.customData?.variationColor || "default_color"
        )
          .trim()
          .replace(/\s+/g, "_");
        folder += `/${productName}/${variationColor}`;
      } else if (options.uploadPath === UploadPath.CATEGORY) {
        folder += "/category";
        // add category_name and possibly subcategory_name
        const categoryName = (
          req.customData?.cateogory_name || "unknown_category"
        )
          .trim()
          .replace(/\s+/g, "_");
        folder += `/${categoryName}`;

        if (req.customData?.subcategory_name) {
          folder += `/${req.customData.subcategory_name}`;
        }
      }

      //custom filename
      //Without this, Cloudinary will generate the file name automatically.
      // const generatedName = Date.now() + "-" + file.originalname;

      return {
        folder,
        // public_id: generatedName,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 1200, height: 1200, crop: "limit" }],
      };
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: options.maxFileSize },
    fileFilter: (req, file, cb) => {
      try {
        checkFileType(file, cb); //  format validation
      } catch (err: any) {
        cb(err);
      }
    },
  });

  // We choose single or multiple upload
  const uploadMiddleware =
    options.type === UploadType.MULTIPLE
      ? upload.array(UPLOADS_FIELD, 10)
      : upload.array(UPLOADS_FIELD, 1);

  // Middleware that catches errors
  return (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware(req, res, async (err) => {
      if (err as Error) {
        console.error("Error during file upload:", err);
        if (onErrorCb) onErrorCb();

        res
          .status(400)
          .json(
            createErrorJson([
              { type: "upload", msg: err.message || "BE_something_went_wrong" },
            ])
          );
        return;
      }

      // req.files now contains Cloudinary objects with URLs
      console.log(`Uploaded ${req.files ? req.files.length : 0} images.`);
      next();
    });
  };
};
