import multer from 'multer';
import { NextFunction, Request, Response } from 'express';
import { UploadFilesOptions, UploadType } from '../types/uploadFiles';
import { checkFileType, getFullUploadPath } from '../utils/uploadUtils';
import { UPLOADS_FIELD } from '../constants/uploads';
import { createErrorJson } from '../utils/responseWrapper';

export const uploadFiles= (options: UploadFilesOptions, onErrorCb?: () => void)=> {

    const storage= multer.diskStorage({
        destination: (req: Request, file, cb) =>{
            try{
                const fullUploadPath = getFullUploadPath(req, options);
                console.log(`Uploading file to: ${fullUploadPath}`);
                cb(null, fullUploadPath);

            }catch(error:any){
                console.error('Error in destination path:', error);
                cb(error, file.destination);
            }
        },
        filename: (req:Request, file, cb) => {
            const generatedName = Date.now() + '-' + file.originalname;
            console.log('Generated filename:', generatedName);
            cb(null, generatedName);
        }

    })

    const upload = multer({
    storage,
    limits: { fileSize: options.maxFileSize }, // Limiti za veličinu datoteke
    fileFilter: function (req, file, cb) {
      console.log(`Processing file for upload: ${file.path}`);
      checkFileType(file, cb);
    },
  });

  // Upload 
  const uploadMiddleware = options.type === UploadType.MULTIPLE
    // Multiple
    ? upload.array(UPLOADS_FIELD, 30)
    // Single
    : upload.array(UPLOADS_FIELD, 1);


    // Vraćamo middleware koji hvata greške
  return (req: Request, res: Response, next: NextFunction) => {

    return uploadMiddleware(req, res, async (err) => {
      if (err as Error) {
        console.error('Error during file upload:', err.message); // Log error
        
        res.status(400).json(createErrorJson([{ type: 'upload', msg: err.message || 'BE_something_went_wrong' }]));
        return;
      }
      console.log(`Uploaded ${req.files ? req.files.length : 0} images.`);

      next(); // Ako nema grešaka, idemo na sledeći middleware
    });
  };


}