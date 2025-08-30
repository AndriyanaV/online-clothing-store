import { z } from "zod";
import { UpdateOrderDto } from "../../types/order";
import { DeliveryStatus, PaymentStatus } from "../../constants/order";

export const addOrderBodySchema: z.ZodType<UpdateOrderDto> = z
  .object({
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    deliveryStatus: z.nativeEnum(DeliveryStatus).optional(),
  })
  .strict();
