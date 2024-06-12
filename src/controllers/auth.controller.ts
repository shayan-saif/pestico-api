import { Router, Request, Response } from "express";
import UserModel, { Role } from "@/models/user";
import { validateBody } from "@/schemas";
import { RegisterBody } from "@/schemas/auth";
import { handleErrors, InvalidBodyError } from "@/utils/errors";
import bcrypt from "bcryptjs";
import { redactPassword } from "@/utils/auth";

class AuthController {
  public async register(req: Request, res: Response) {
    try {
      const body = validateBody(req, RegisterBody);
      const { email, password } = body;

      const existingUser = await UserModel.findOne({ email, deleted_at: null });
      if (existingUser)
        throw new InvalidBodyError("User with that email already exists");

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = { ...body, password: passwordHash };

      const createdUserDocument = await UserModel.create(user);
      const createdUser = redactPassword(createdUserDocument.toObject());

      return res.status(201).json({
        message: "User registered successfully",
        user: createdUser,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }
}

export default AuthController;
