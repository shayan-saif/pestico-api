import { z } from "zod";
import { Role } from "@/models/user.model";

export const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string(),
  address: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
});

export type RegisterBodyType = z.infer<typeof RegisterBody>;

export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginBodyType = z.infer<typeof LoginBody>;
