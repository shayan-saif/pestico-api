import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import UserService from "@/services/user.service";

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
}

export function scope(permission?: string) {
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
      req.user = user;

      if (
        user.is_admin ||
        (permission &&
          user.permissions &&
          user.permissions.includes(permission))
      ) {
        return originalMethod.apply(this, args);
      }

      return res.status(403).json({
        message: "Unauthorized",
      });
    };
  };
}
