import {
  FilterQuery,
  HydratedDocument,
  isValidObjectId,
  Types,
} from "mongoose";
import UserModel, { IUser, UserDocument } from "@/models/user.model";
import { InvalidBodyError, NotFoundError } from "@/utils/errors";
import { hashPassword } from "@/utils/auth";

class UserService {
  public async getUsers(
    filter?: FilterQuery<UserDocument>,
  ): Promise<HydratedDocument<IUser>[]> {
    return UserModel.find({
      deleted_at: null,
      ...filter,
    });
  }

  public async getUserById(
    id?: string | Types.ObjectId,
  ): Promise<HydratedDocument<IUser>> {
    if (!isValidObjectId(id)) {
      throw new InvalidBodyError("Invalid id");
    }

    const existingUser = await UserModel.findOne({
      _id: id,
      deleted_at: null,
    });

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    return existingUser.toObject();
  }

  public async updateUser(
    id: string | Types.ObjectId,
    update: Partial<IUser>,
  ): Promise<HydratedDocument<IUser>> {
    if (!isValidObjectId(id)) {
      throw new InvalidBodyError("Invalid id");
    }

    if (update.email) {
      const isEmailTaken = await UserModel.findOne({
        email: update.email,
        deleted_at: null,
      });
      if (isEmailTaken) {
        throw new InvalidBodyError("Email is already taken");
      }
    }

    if (update.password) {
      update.password = await hashPassword(update.password);
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      {
        _id: id,
        deleted_at: null,
      },
      update,
      {
        new: true,
      },
    );

    if (!updatedUser) {
      throw new NotFoundError("User not found");
    }

    return updatedUser.toObject();
  }

  public async deleteUser(
    id: string | Types.ObjectId,
  ): Promise<HydratedDocument<IUser>> {
    if (!isValidObjectId(id)) {
      throw new InvalidBodyError("Invalid id");
    }

    const deletedUser = await UserModel.findOneAndUpdate(
      {
        _id: id,
        deleted_at: null,
      },
      { deleted_at: new Date() },
      { new: true },
    );

    if (!deletedUser) {
      throw new NotFoundError("User not found");
    }

    return deletedUser.toObject();
  }
}

export default UserService;
