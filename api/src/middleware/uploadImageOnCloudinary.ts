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
  cloud_name: "dv4at17dh",
  api_key: "388418436247862",
  api_secret: "zTAYtzonzW6pRWAlP4Y_FfFtr2Y",
});

export const uploadFilesOnCloudianry = (
  options: UploadFilesOptions,
  onErrorCb?: () => void
) => {
  // Kreiramo Cloudinary storage
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      // Folder se može proslediti iz options ili req.body
      let folder = "my_uploads"; // osnovni folder

      if (options.uploadPath === UploadPath.PRODUCT) {
        // dodaj productName i variationColor ako postoje
        const productName = req.customData?.productName || "unknown_product";
        const variationColor =
          req.customData?.variationColor || "default_color";
        folder += `/${productName}/${variationColor}`;
      } else if (options.uploadPath === UploadPath.CATEGORY) {
        // dodaj category_name i eventualno subcategory_name
        const categoryName =
          req.customData?.cateogory_name || "unknown_category";
        folder += `/${categoryName}`;

        if (req.customData?.subcategory_name) {
          folder += `/${req.customData.subcategory_name}`;
        }
      }
      return {
        folder,
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
        checkFileType(file, cb); //  validacija formata
      } catch (err: any) {
        cb(err);
      }
    },
  });

  // Biramo single ili multiple upload
  const uploadMiddleware =
    options.type === UploadType.MULTIPLE
      ? upload.array(UPLOADS_FIELD, 30)
      : upload.array(UPLOADS_FIELD, 1);

  // Middleware koji hvata greške
  return (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware(req, res, async (err) => {
      if (err as Error) {
        console.error("Error during file upload:", err.message);
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

      // req.files sada sadrži Cloudinary objekte sa URL-ovima
      console.log(`Uploaded ${req.files ? req.files.length : 0} images.`);
      next();
    });
  };
};
