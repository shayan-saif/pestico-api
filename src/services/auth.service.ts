import UserModel, { IUser } from "@/models/user.model";
import { InvalidBodyError, UnauthorizedError } from "@/utils/errors";
import bcrypt from "bcryptjs";
import { hashPassword, signToken } from "@/utils/auth";
import { HydratedDocument } from "mongoose";

class AuthService {
  public async register(user: IUser): Promise<HydratedDocument<IUser>> {
    const { email, password } = user;

    const existingUser = await UserModel.findOne({ email, deleted_at: null });
    if (existingUser)
      throw new InvalidBodyError("User with that email already exists");

    const passwordHash = await hashPassword(password);
    const userWithPasswordHash = { ...user, password: passwordHash };

    const createdUserDocument = await UserModel.create(userWithPasswordHash);
    return createdUserDocument.toObject();
  }

  public async login(
    email: string,
    password: string,
  ): Promise<{
    user: IUser;
    token: string;
  }> {
    const existingUser = await UserModel.findOne({
      email,
      deleted_at: null,
    }).select("+password");

    const isPasswordMatch = bcrypt.compareSync(
      password,
      existingUser?.password ?? "",
    );

    if (!existingUser || !isPasswordMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = signToken(existingUser.id.toString());

    return { user: existingUser.$set("password", undefined), token };
  }
}

export default AuthService;
