import { JwtPayload } from "jsonwebtoken";
import { HydratedDocument } from "mongoose";
import { IUser } from "../src/models/user.model";

declare global {
  namespace Express {
    interface Request {
      decoded?: any | JwtPayload;
      user?: HydratedDocument<IUser>;
    }
  }
}
