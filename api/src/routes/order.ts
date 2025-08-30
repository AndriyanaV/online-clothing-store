import express, { Router } from "express";
import {
  addOrder,
  cancelOrder,
  changeOrderStatus,
  getMyOrders,
  getOrders,
  softDeleteOrder,
} from "../controllers/orderController";
import authMiddleware from "../middleware/authMiddleware";

const orderRouter = express.Router();

orderRouter.post("/addOrder", authMiddleware, addOrder);

orderRouter.put("/changeOrderStatus/:orderId", changeOrderStatus);
orderRouter.put("/cancelOrder/:orderId", cancelOrder);

//Sorf delete order
orderRouter.patch("/softDeleteOrder/:orderId", softDeleteOrder);

orderRouter.get("/getOrders", getOrders);
orderRouter.get("/getMyOrders", authMiddleware, getMyOrders);

export default orderRouter;
