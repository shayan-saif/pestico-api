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
    return CustomerModel.find({
      deleted_at: null,
      ...filter,
    });
  }

  public async getCustomerById(
    id?: string | Types.ObjectId,
  ): Promise<HydratedDocument<ICustomer>> {
    if (!isValidObjectId(id)) {
      throw new InvalidBodyError("Invalid id");
    }

    const existingCustomer = await CustomerModel.findOne({
      _id: id,
      deleted_at: null,
    });

    if (!existingCustomer) {
      throw new NotFoundError("Customer not found");
    }

    return existingCustomer.toObject();
  }

  public async createCustomer(
    customer: ICustomer,
  ): Promise<HydratedDocument<ICustomer>> {
    const newCustomer = await CustomerModel.create(customer);
    return newCustomer.toObject();
  }

  public async updateCustomer(
    id: string,
    update: Partial<ICustomer>,
  ): Promise<HydratedDocument<ICustomer>> {
    if (!isValidObjectId(id)) {
      throw new InvalidBodyError("Invalid id");
    }

    const updatedCustomer = await CustomerModel.findOneAndUpdate(
      {
        _id: id,
        deleted_at: null,
      },
      update,
      {
        new: true,
      },
    );

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

    const deletedCustomer = await CustomerModel.findOneAndUpdate(
      {
        _id: id,
        deleted_at: null,
      },
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
