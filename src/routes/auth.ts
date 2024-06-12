import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { LoginBody, RegisterBody, UpdateBody } from "@/schemas/auth";
import UserModel, { Role } from "@/models/user";
import { validateBody } from "@/schemas";
import {
  handleErrors,
  InvalidBodyError,
  NotFoundError,
  UnauthorizedError,
} from "@/utils/errors";
import { redactPassword, signToken } from "@/utils/auth";
import verifyToken from "@/middleware/auth";
import AuthController from "@/controllers/auth.controller";

const router = Router();
const authController = new AuthController();

router.post("/register", verifyToken, async (req: Request, res: Response) => {
  const { user } = req;
  console.log(user);
  if (!user || user.role !== Role.ADMIN)
    return res.status(403).json({ error: "Unauthorized" });

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
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const body = validateBody(req, LoginBody);
    const { email, password } = body;

    const existingUser = await UserModel.findOne({ email, deleted_at: null });
    if (!existingUser)
      throw new NotFoundError("User with that email not found");

    const isPasswordMatch = bcrypt.compareSync(password, existingUser.password);

    if (!isPasswordMatch) {
      throw new UnauthorizedError("Invalid password");
    }

    const user = redactPassword(existingUser.toObject());
    const token = signToken(user);

    return res.status(200).json({
      message: "User logged in successfully",
      token,
    });
  } catch (error) {
    handleErrors(error, res);
  }
});

router.put("/:id", verifyToken, async (req: Request, res: Response) => {
  const { user } = req;
  const { id } = req.params;

  try {
    if (!user) {
      throw new UnauthorizedError("Unauthorized");
    }

    const body = validateBody(req, UpdateBody);
    const {
      email,
      password,
      name,
      address,
      address2,
      city,
      postal_code,
      phone,
      customers,
      updated_at,
    } = body;

    if (user.role !== Role.ADMIN) {
      if (user._id !== id || email || customers)
        throw new UnauthorizedError("Unauthorized");
    }

    if (email) {
      const isEmailTaken = await UserModel.findOne({ email, deleted_at: null });
      if (isEmailTaken) {
        throw new InvalidBodyError("Email is already taken");
      }
    }

    let passwordHash;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      {
        email,
        password: passwordHash,
        name,
        address,
        address2,
        city,
        postal_code,
        phone,
        updated_at,
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundError("User not found");
    }

    return res.status(200).json({
      message: "User updated successfully",
      user: redactPassword(updatedUser.toObject()),
    });
  } catch (error) {
    handleErrors(error, res);
  }
});

export default router;
