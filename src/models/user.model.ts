import { model, Document, Schema, ObjectId } from "mongoose";

export enum Role {
  ADMIN = "admin",
  USER = "user",
}

export interface IUser {
  email: string;
  password: string;
  name: string;
  is_admin: boolean;
  permissions?: string[];
  address?: string;
  address2?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  customers?: string[];
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export interface UserDocument extends IUser, Document {}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true, select: false },
  name: { type: String, required: true },
  is_admin: { type: Boolean, default: false },
  permissions: { type: [String], default: [] },
  address: { type: String },
  address2: { type: String },
  city: { type: String },
  postal_code: { type: String },
  phone: { type: String },
  customers: { type: [Schema.Types.ObjectId], ref: "Customer" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date },
});

UserSchema.index({ email: 1, deleted_at: 1 }, { unique: true });

const UserModel = model<UserDocument>("User", UserSchema, "User");

export default UserModel;
