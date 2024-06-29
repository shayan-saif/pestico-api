import { Types } from "mongoose";
import { Category, ICustomer, CustomerStatus } from "@/models/customer.model";
import { faker } from "@faker-js/faker";

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
