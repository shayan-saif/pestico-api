import { z } from "zod";
import { Category, Status } from "@/models/customer.model";

export const CreateBody = z
  .object({
    name: z.string().optional(),
    status: z.nativeEnum(Status).optional(),
    category: z.nativeEnum(Category).optional(),
    address: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    user_id: z.string().optional(),
    invoices_per_month: z.number().optional(),
    invoice_amount: z.number().optional(),
    updated_at: z.date().default(() => new Date()),
  })
  .strict();

export const UpdateBody = CreateBody.partial().strict();
