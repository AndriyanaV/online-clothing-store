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
import verifyRoleMiddleware from "../middleware/verifyRoleMiddleware";
import { UserRole } from "../constants/user";

const orderRouter = express.Router();

orderRouter.use(authMiddleware);
orderRouter.post("/add-order", addOrder);
orderRouter.get("/get-my-orders", getMyOrders);

orderRouter.use("/protected/admin-only", verifyRoleMiddleware(UserRole.admin));

orderRouter.put("/protected/admin-only/change-order-status/:orderId", changeOrderStatus);
orderRouter.put("/protected/admin-only/cancel-order/:orderId", cancelOrder);

//Sorf delete order
orderRouter.patch("/protected/admin-only/soft-delete-order/:orderId", softDeleteOrder);

orderRouter.get("/protected/admin-only/get-orders", getOrders);


export default orderRouter;
