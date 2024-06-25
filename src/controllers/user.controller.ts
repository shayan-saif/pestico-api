import { Request, Response } from "express";
import { handleErrors, UnauthorizedError } from "@/utils/errors";
import UserService from "@/services/user.service";
import { scope } from "@/utils/auth";
import { validateBody } from "@/schemas";
import { UpdateBody } from "@/schemas/user.schema";
import UserModel from "@/models/user.model";

class UserController {
  constructor(private userService = new UserService()) {}

  @scope("user:read", UserModel)
  public async getUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const user = await this.userService.getUserById(userId);

      return res.status(200).json({
        user,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  @scope()
  public async getUsers(_req: Request, res: Response) {
    try {
      const users = await this.userService.getUsers();

      return res.status(200).json({
        users,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  @scope("user:update", UserModel)
  public async updateUser(req: Request, res: Response) {
    try {
      const updateBody = validateBody(req, UpdateBody);
      const { userId } = req.decoded;
      const { is_admin: isAdmin } = await this.userService.getUserById(userId);
      const { id: userUpdateId } = req.params;

      if (!isAdmin && updateBody.customers) {
        throw new UnauthorizedError("Only admins may update customers");
      }

      const updatedUser = await this.userService.updateUser(
        userUpdateId,
        updateBody,
      );

      return res.status(201).json({
        message: "User updated",
        user: updatedUser,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  @scope()
  public async deleteUser(req: Request, res: Response) {
    try {
      const { userId } = req.decoded;
      const { id: userDeleteId } = req.params;

      const deletedUser = await this.userService.deleteUser(userDeleteId);

      return res.status(200).json({
        message: "User deleted",
        user: deletedUser,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }
}

export default UserController;
