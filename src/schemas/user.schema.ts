import { z } from "zod";
import { ObjectId } from "mongoose";

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
    customers: z.array(z.string()).optional(),
    updated_at: z.date().default(() => new Date()),
  })
  .strict();
