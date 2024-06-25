import { IUser } from "@/models/user.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Model, ObjectId } from "mongoose";
import UserService from "@/services/user.service";

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
}

export function scope(permission?: string, resource?: Model<any>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args[0];
      const res = args[1];
      const { userId } = req.decoded;
      const userService = new UserService();
      const user = await userService.getUserById(userId);

      // Check if the user is an admin
      if (user.is_admin) {
        return originalMethod.apply(this, args);
      }

      // Check if the user has the required permission
      if (
        resource &&
        permission &&
        user.permissions &&
        user.permissions.includes(permission)
      ) {
        const { _id: existingResourceId, user_id: existingUserId } =
          await resource.findById(req.params.id);
        const idSet: string[] = [
          existingResourceId?.toString(),
          existingUserId?.toString(),
        ];

        if (idSet.includes(userId)) {
          return originalMethod.apply(this, args);
        }
      }

      return res.status(403).json({
        message: "Unauthorized",
      });
    };
  };
}
