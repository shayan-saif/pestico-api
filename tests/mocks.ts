import { Types } from "mongoose";
import { Category, ICustomer, CustomerStatus } from "@/models/customer.model";
import { faker } from "@faker-js/faker";
import { IInvoice } from "@/models/invoice.model";

export function buildMockCustomer(
  userId: Types.ObjectId,
  override: Record<string, string> = {},
): ICustomer {
  return {
    name: faker.company.name(),
    status: CustomerStatus.ACTIVE,
    category: Category.BUSINESS,
    address: faker.location.streetAddress(),
    address2: faker.location.secondaryAddress(),
    city: faker.location.city(),
    postal_code: faker.location.zipCode(),
    user_id: userId,
    invoice_amount: faker.number.float({
      min: 1,
      max: 1000,
      fractionDigits: 2,
    }),
    ...override,
  };
}

export function buildMockInvoice(
  userId: Types.ObjectId,
  customerId: Types.ObjectId,
  override: Record<string, string> = {},
): IInvoice {
  return {
    description: faker.lorem.sentence(),
    jobs: [],
    amount: faker.number.float({
      min: 1,
      max: 1000,
      fractionDigits: 2,
    }),
    customer_id: customerId,
    user_id: userId,
    ...override,
  };
}
