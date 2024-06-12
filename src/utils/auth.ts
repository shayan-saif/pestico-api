import { IUser } from "@/models/user";
import jwt from "jsonwebtoken";

export function redactPassword(user: IUser) {
  return Object.assign({}, user, { password: undefined });
}

export function signToken(user: IUser) {
  return jwt.sign(user, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });
}
