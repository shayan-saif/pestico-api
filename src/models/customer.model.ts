import { Document, model, Schema, Types } from "mongoose";

export enum CustomerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum Category {
  BUSINESS = "BUSINESS",
  HOMECALL = "HOMECALL",
}

export interface ICustomer {
  name: string;
  status: CustomerStatus;
  category: Category;
  address?: string;
  address2?: string;
  city?: string;
  postal_code?: string;
  invoices_per_month?: number;
  invoice_amount: number;
  user_id?: Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export interface CustomerDocument extends ICustomer, Document {}

const CustomerSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: [CustomerStatus.ACTIVE, CustomerStatus.INACTIVE],
    default: CustomerStatus.ACTIVE,
  },
  category: {
    type: String,
    enum: [Category.BUSINESS, Category.HOMECALL],
    default: Category.BUSINESS,
  },
  address: { type: String },
  address2: { type: String },
  city: { type: String },
  postal_code: { type: String },
  invoices_per_month: { type: Number, default: 1 },
  invoice_amount: { type: Number, required: true },
  user_id: { type: Schema.Types.ObjectId, ref: "User" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date },
});

CustomerSchema.index({ name: 1 }, { unique: true });

const CustomerModel = model<CustomerDocument>(
  "Customer",
  CustomerSchema,
  "Customer",
);

export default CustomerModel;
