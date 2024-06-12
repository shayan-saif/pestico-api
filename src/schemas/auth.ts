import { z } from "zod";
import { Role } from "@/models/user";

export const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string(),
  role: z.nativeEnum(Role),
  address: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  deleted_at: z.date().optional(),
});

export type RegisterType = z.infer<typeof RegisterBody>;

export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginType = z.infer<typeof LoginBody>;

export const UpdateBody = z.object({
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
});
