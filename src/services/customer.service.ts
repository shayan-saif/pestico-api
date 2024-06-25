import {
  FilterQuery,
  HydratedDocument,
  isValidObjectId,
  Types,
} from "mongoose";
import CustomerModel, {
  CustomerDocument,
  ICustomer,
} from "@/models/customer.model";
import { InvalidBodyError, NotFoundError } from "@/utils/errors";

class CustomerService {
  public async getCustomers(
    filter?: FilterQuery<CustomerDocument>,
  ): Promise<HydratedDocument<ICustomer>[]> {
    return CustomerModel.find(filter ?? {});
  }

  public async getCustomerById(
    id?: string | Types.ObjectId,
  ): Promise<HydratedDocument<ICustomer>> {
    if (!isValidObjectId(id)) {
      throw new InvalidBodyError("Invalid id");
    }

    const existingCustomer = await CustomerModel.findById(id);

    if (!existingCustomer) {
      throw new NotFoundError("Customer not found");
    }

    return existingCustomer.toObject();
  }

  public async updateCustomer(
    id: string,
    update: Partial<ICustomer>,
  ): Promise<HydratedDocument<ICustomer>> {
    if (!isValidObjectId(id)) {
      throw new InvalidBodyError("Invalid id");
    }

    const updatedCustomer = await CustomerModel.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!updatedCustomer) {
      throw new NotFoundError("Customer not found");
    }

    return updatedCustomer.toObject();
  }

  public async deleteCustomer(
    id: string,
  ): Promise<HydratedDocument<ICustomer>> {
    if (!isValidObjectId(id)) {
      throw new InvalidBodyError("Invalid id");
    }

    const deletedCustomer = await CustomerModel.findByIdAndUpdate(
      id,
      { deleted_at: new Date() },
      { new: true },
    );

    if (!deletedCustomer) {
      throw new NotFoundError("Customer not found");
    }

    return deletedCustomer.toObject();
  }
}

export default CustomerService;
