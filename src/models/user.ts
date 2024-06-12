import { model, Document, Schema, ObjectId } from "mongoose";

export enum Role {
  ADMIN = "admin",
  USER = "user",
}

export interface IUser {
  email: string;
  password: string;
  name: string;
  role: Role;
  address?: string;
  address2?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  customers?: ObjectId[];
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

interface User extends IUser, Document {}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date },
});

UserSchema.index({ email: 1, deleted_at: 1 }, { unique: true });

const UserModel = model<User>("User", UserSchema, "User");

export default UserModel;
