import { Request, Response } from "express";
import { ZodSchema } from "zod";
import { InvalidBodyError } from "@/utils/errors";

export function validateBody(request: Request, schema: ZodSchema) {
  const { body } = request;
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const errors = JSON.stringify(parsed.error.errors);
    throw new InvalidBodyError(errors);
  }

  return parsed.data;
}
