import { z } from "zod";
import { Job } from "@/models/invoice.model";

export const CreateBody = z
  .object({
    description: z.string().optional(),
    jobs: z.array(z.nativeEnum(Job)),
    amount: z.number(),
    service_date: z.string().optional().transform(val => val ? new Date(val) : undefined),
    payment_date: z.string().optional().transform(val => val ? new Date(val) : undefined),
    customer_id: z.string(),
    user_id: z.string(),
    updated_at: z.date().default(() => new Date()),
  })
  .strict();

export const UpdateBody = CreateBody.omit({ customer_id: true, user_id: true }).partial().strict();
