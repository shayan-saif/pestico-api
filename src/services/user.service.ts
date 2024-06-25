import { isValidObjectId, HydratedDocument } from "mongoose";
import UserModel, { IUser, UserDocument } from "@/models/user.model";
import { InvalidBodyError, NotFoundError } from "@/utils/errors";
import { hashPassword } from "@/utils/auth";

class UserService {
  public async getUserById(id: string): Promise<HydratedDocument<IUser>> {
    if (!isValidObjectId(id)) {
      throw new InvalidBodyError("Invalid id");
    }

    const existingUser = await UserModel.findById(id);

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    return existingUser.toObject();
  }

  public async getUsers(): Promise<HydratedDocument<IUser>[]> {
    return UserModel.find();
  }

  public async updateUser(
    id: string,
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

    const updatedUser = await UserModel.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!updatedUser) {
      throw new NotFoundError("User not found");
    }

    return updatedUser.toObject();
  }

  public async deleteUser(id: string): Promise<HydratedDocument<IUser>> {
    if (!isValidObjectId(id)) {
      throw new InvalidBodyError("Invalid id");
    }

    const deletedUser = await UserModel.findByIdAndUpdate(
      id,
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