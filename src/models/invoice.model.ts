import { Document, model, Schema, Types } from "mongoose";

export enum Job {
  ANT = "ANT",
  BEDBUG = "BEDBUG",
  COCKROACH = "COCKROACH",
}

export interface IInvoice {
  description?: string;
  jobs: Job[];
  amount: number;
  service_date?: Date;
  payment_date?: Date;
  customer_id: Types.ObjectId;
  user_id: Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export interface InvoiceDocument extends IInvoice, Document {}

const InvoiceSchema: Schema = new Schema({
  description: { type: String },
  jobs: [{ type: String, enum: Object.values(Job) }],
  amount: { type: Number, required: true },
  service_date: { type: Date },
  payment_date: { type: Date },
  customer_id: { type: Schema.Types.ObjectId, ref: "Customer" },
  user_id: { type: Schema.Types.ObjectId, ref: "User" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date },
});

const InvoiceModel = model<InvoiceDocument>(
  "InvoiceDocument",
  InvoiceSchema,
  "InvoiceDocument",
);

export default InvoiceModel;
