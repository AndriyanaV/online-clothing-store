import * as express from 'express';
import { Types } from "mongoose";


declare global {
  namespace Express {
    interface Request {
      /** Podaci specifični za JEDAN zahtev */
      customData?: {
        variationColor?: string;
        product_id?:Types.ObjectId;
        productName?: string;
      };
    }
  }
}

export {}