import { z } from "zod";
import { OrderStatus } from "../../types/order";
import { DeliveryStatus, PaymentStatus } from "../../constants/order";

export const changeOrderStatusBodySchema: z.ZodType<OrderStatus> = z
  .object({
    deliveryStatus: z.nativeEnum(DeliveryStatus),
    paymentStatus: z.nativeEnum(PaymentStatus),
  })
  .strict();
