import { Request, Response } from "express";
import { ZodSchema } from "zod";
import { InvalidBodyError } from "@/utils/errors";

export function validateBody<T>(request: Request, schema: ZodSchema<T>) {
  const { body } = request;
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const errors = JSON.stringify(parsed.error.errors);
    console.log(errors);
    throw new InvalidBodyError(errors);
  }

  return parsed.data;
}
