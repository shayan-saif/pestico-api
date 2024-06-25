import { Request, Response } from "express";
import { ForbiddenError, handleErrors } from "@/utils/errors";
import { scope } from "@/utils/auth";
import { validateBody } from "@/schemas";
import { UpdateBody } from "@/schemas/customer.schema";
import CustomerService from "@/services/customer.service";
import { HydratedDocument, Types } from "mongoose";
import { ICustomer } from "@/models/customer.model";

class CustomerController {
  constructor(private customerService = new CustomerService()) {}

  @scope("customer:read")
  public async getCustomers(req: Request, res: Response) {
    try {
      const requestingUser = req.user;
      let customers: HydratedDocument<ICustomer>[];

      if (requestingUser?.is_admin) {
        customers = await this.customerService.getCustomers({});
      } else {
        customers = await this.customerService.getCustomers({
          user_id: requestingUser?._id,
        });
      }

      return res.status(200).json({
        customers,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  @scope("customer:read")
  public async getCustomer(req: Request, res: Response) {
    try {
      const isAdmin = req.user?.is_admin ?? false;
      const requestingUserId = req.user?._id;
      const customerId = new Types.ObjectId(req.params.id);

      const customer = await this.customerService.getCustomerById(customerId);

      if (!isAdmin && !requestingUserId?.equals(customer.user_id)) {
        throw new ForbiddenError(
          "You are not authorized to view this customer",
        );
      }

      return res.status(200).json({
        customer,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  @scope("customer:update")
  public async updateCustomer(req: Request, res: Response) {
    try {
      const updateBody = validateBody(req, UpdateBody);
      const requestingUserId = req.user?._id;
      const isAdmin = req.user?.is_admin ?? false;
      const { id: customerUpdateId } = req.params;

      const recordToUpdate =
        await this.customerService.getCustomerById(customerUpdateId);

      if (!isAdmin) {
        if (
          requestingUserId &&
          !requestingUserId.equals(recordToUpdate.user_id)
        ) {
          throw new ForbiddenError(
            "You are not authorized to update this customer",
          );
        }

        const validFields = UpdateBody.omit({
          status: true,
          category: true,
          user_id: true,
          invoices_per_month: true,
          invoice_amount: true,
        })
          .strict()
          .safeParse(updateBody);

        if (!validFields.success) {
          throw new ForbiddenError("Only admins may update these fields");
        }
      }

      const updatedCustomer = await this.customerService.updateCustomer(
        customerUpdateId,
        updateBody,
      );

      return res.status(201).json({
        message: "Customer updated",
        customer: updatedCustomer,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  @scope()
  public async deleteCustomer(req: Request, res: Response) {
    try {
      const { id: customerDeleteId } = req.params;

      const deletedCustomer =
        await this.customerService.deleteCustomer(customerDeleteId);

      return res.status(200).json({
        message: "Customer deleted",
        customer: deletedCustomer,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }
}

export default CustomerController;
