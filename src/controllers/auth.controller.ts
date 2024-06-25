import { Request, Response } from "express";
import { validateBody } from "@/schemas";
import {
  LoginBody,
  RegisterBody,
  RegisterBodyType,
} from "@/schemas/auth.schema";
import { handleErrors } from "@/utils/errors";
import AuthService from "@/services/auth.service";
import { scope } from "@/utils/auth";
import UserService from "@/services/user.service";
import { DEFAULT_PERMISSIONS } from "@/config";

class AuthController {
  constructor(
    private authService = new AuthService(),
    private userService = new UserService(),
  ) {}

  public async verify(req: Request, res: Response) {
    try {
      const { userId } = req.decoded;
      const user = await this.userService.getUserById(userId);

      return res.status(200).json({
        user,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  @scope()
  public async register(req: Request, res: Response) {
    try {
      const registerBody: RegisterBodyType = validateBody(req, RegisterBody);
      const user = {
        ...registerBody,
        is_admin: false,
        permissions: DEFAULT_PERMISSIONS,
      };

      const createdUser = await this.authService.register(user);

      return res.status(201).json({
        message: "User registered successfully",
        user: createdUser,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  public async login(req: Request, res: Response) {
    try {
      const { email, password } = validateBody(req, LoginBody);

      const { user, token } = await this.authService.login(email, password);

      return res.status(200).json({
        message: "User logged in successfully",
        user,
        token,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }
}

export default AuthController;
