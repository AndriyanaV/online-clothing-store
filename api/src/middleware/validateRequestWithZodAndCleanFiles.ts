import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { createErrorJson } from '../utils/responseWrapper';
import { z, ZodError } from 'zod';
import { ApiError } from '../types/common';
import { UploadPath } from '../types/uploadFiles';


export const validateRequestWithZodAndCleanFiles = (schema: z.ZodSchema, uploadSubfolder: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsedBody = schema.parse(req.body);
            req.body = parsedBody;
            next();
        } catch (error) {
            // Brisanje fajlova ako postoji upload
            const files = (req.files as Express.Multer.File[]) || [];
            const singleFile = (req.file as Express.Multer.File | undefined);

            const deleteFile = async (file: Express.Multer.File) => {
                const filePath = path.join(__dirname, '..', '..', 'uploads', uploadSubfolder, file.filename);
                try {
                    await fs.promises.unlink(filePath);
                    console.log(`Deleted uploaded file due to validation failure: ${filePath}`);
                } catch (err) {
                    console.error('Failed to delete uploaded file:', err);
                }
            };

            if (files.length > 0) {
                await Promise.all(files.map(deleteFile));
            } else if (singleFile) {
                await deleteFile(singleFile);
            }

            if (error instanceof ZodError) {
                const zodErrors: Array<ApiError> = error.errors.map(err => ({
                    msg: err.message,
                    type: 'validation_error',
                    path: err.path,
                    code: err.code
                }));
                res.status(400).json(createErrorJson(zodErrors));
            } else {
                res.status(500).json({
                    message: 'An unexpected error occurred',
                });
            }
        }
    };
};
