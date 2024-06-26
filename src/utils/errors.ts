import { Response } from "express";
import { MongoServerError } from "mongodb";

export function handleErrors(error: unknown, res: Response) {
  console.error(error);

  if (error instanceof Error) {
    const { message } = error;

    if (error instanceof InvalidBodyError) {
      return res.status(400).json({ error: message });
    }

    if (error instanceof UnauthorizedError) {
      return res.status(401).json({ error: message });
    }

    if (error instanceof ForbiddenError) {
      return res.status(403).json({ error: message });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: message });
    }
  }

  if (error instanceof MongoServerError) {
    // Duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        error: error.errmsg,
      });
    }
  }

  return res.status(500).json({ error: "Server error" });
}

export class InvalidParamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidParamError";
  }
}

export class InvalidBodyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBodyError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
