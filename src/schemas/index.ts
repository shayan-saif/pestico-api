import { Request } from "express";
import { ZodSchema } from "zod";
import { InvalidBodyError } from "@/utils/errors";

export function validateQuery(request: Request, schema: ZodSchema) {
  const { query } = request;
  return validateData(schema, query);
}

export function validateBody(request: Request, schema: ZodSchema) {
  const { body } = request;
  return validateData(schema, body);
}

function validateData(schema: ZodSchema, data: any) {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    const errors = JSON.stringify(parsed.error.errors);
    throw new InvalidBodyError(errors);
  }

  return parsed.data;
}
