import { z } from "zod";
import { AddItemDto, AddOrderDto, Item } from "../../types/order";
import { objectIdRegex } from "../../constants/common";
import { City, PaymentMethod, postalCodesByCity } from "../../constants/order";

export const AddedItemsBodySchema: z.ZodType<AddItemDto> = z.object({
  item_id: z.string().regex(objectIdRegex, "Invalid MongoDB ObjectId"), // validacija ObjectId-a kao string
  variant_id: z.string().regex(objectIdRegex, "Invalid MongoDB ObjectId"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be a positive number"),
  // name: z.string().optional(),
  // color: z.string(),
  // size: z.string(),
});

export const addOrderBodySchema: z.ZodType<AddOrderDto> = z
  .object({
    firstName: z.string().max(30),
    lastName: z.string().max(30),
    phoneNumber: z
      .string()
      .regex(/^(?:\+381|0)(6\d|1\d)\d{6,7}$/, "Invalid Serbian phone number"),
    address: z.string().max(30),
    city: z.nativeEnum(City),
    postCode: z.string().regex(/^\d{5}$/, "Postal code must be 5 digits"), //For Serbia
    paymentMethod: z.nativeEnum(PaymentMethod),
    items: z.array(AddedItemsBodySchema),
    // totalPrice: z.number().nonnegative(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const { city, postCode } = data;
    if (!postalCodesByCity[city].includes(postCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Postal code doesn't match the selected city",
        path: ["postCode"],
      });
    }
  });
