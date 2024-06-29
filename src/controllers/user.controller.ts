import { Request, Response } from "express";
import { ForbiddenError, handleErrors } from "@/utils/errors";
import UserService from "@/services/user.service";
import { scope } from "@/utils/auth";
import { validateBody, validateQuery } from "@/schemas";
import { StringQuery, UpdateBody } from "@/schemas/user.schema";
import { IUser } from "@/models/user.model";
import { HydratedDocument, Types } from "mongoose";

class UserController {
  constructor(private userService = new UserService()) {}

  @scope()
  public async getUsers(req: Request, res: Response) {
    try {
      const query = validateQuery(req, StringQuery);

      let users: HydratedDocument<IUser>[];

      users = await this.userService.getUsers({
        ...query,
        deleted_at: query.deleted_at ? { $exists: true } : null,
        name: { $regex: new RegExp(query.name, "i") },
      });

      return res.status(200).json({
        users,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  @scope("user:read")
  public async getUser(req: Request, res: Response) {
    try {
      const isAdmin = req.user?.is_admin ?? false;
      const requestingUserId = req.user?._id;
      const userId = new Types.ObjectId(req.params.id);

      let user: HydratedDocument<IUser>;

      if (isAdmin || requestingUserId?.equals(userId)) {
        user = await this.userService.getUserById(userId);
      } else {
        throw new ForbiddenError("You are not authorized to view this user");
      }

      return res.status(200).json({
        user,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  @scope("user:update")
  public async updateUser(req: Request, res: Response) {
    try {
      const updateBody = validateBody(req, UpdateBody);
      const requestingUserId = req.user?._id;
      const isAdmin = req.user?.is_admin ?? false;
      const { id: userUpdateId } = req.params;

      if (!isAdmin) {
        if (requestingUserId && !requestingUserId.equals(userUpdateId)) {
          throw new ForbiddenError(
            "You are not authorized to update this user",
          );
        }

        const validFields = UpdateBody.omit({
          customers: true,
        })
          .strict()
          .safeParse(updateBody);

        if (!validFields.success) {
          throw new ForbiddenError("Only admins may update these fields");
        }
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
      const requestingUserId = req.user?._id;
      const isAdmin = req.user?.is_admin ?? false;
      const { id: userDeleteId } = req.params;

      if (!isAdmin) {
        if (requestingUserId && !requestingUserId.equals(userDeleteId)) {
          throw new ForbiddenError(
            "You are not authorized to delete this user",
          );
        }
      }

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
