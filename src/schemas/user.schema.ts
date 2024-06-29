import { z } from "zod";
import { Types } from "mongoose";

export const StringQuery = z.object({
  name: z.string().optional(),
  is_admin: z.coerce.boolean().optional(),
  deleted_at: z.coerce.boolean().optional(),
});

export const UpdateBody = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    name: z.string().optional(),
    address: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    phone: z.string().optional(),
    customers: z
      .array(z.string().transform((val) => new Types.ObjectId(val)))
      .optional(),
    updated_at: z.date().default(() => new Date()),
  })
  .strict();
