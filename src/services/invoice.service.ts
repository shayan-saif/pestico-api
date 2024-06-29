import {
  FilterQuery,
  HydratedDocument,
  isValidObjectId,
  Types,
} from "mongoose";
import InvoiceModel, {
  InvoiceDocument,
  IInvoice,
} from "@/models/invoice.model";
import { InvalidBodyError, NotFoundError } from "@/utils/errors";

class InvoiceService {
  public async getInvoices(
    filter?: FilterQuery<InvoiceDocument>,
  ): Promise<HydratedDocument<IInvoice>[]> {
    return InvoiceModel.find({
      deleted_at: null,
      ...filter,
    });
  }

  public async getInvoiceById(
    id?: string | Types.ObjectId,
  ): Promise<HydratedDocument<IInvoice>> {
    if (!isValidObjectId(id)) {
      throw new InvalidBodyError("Invalid id");
    }

    const existingInvoice = await InvoiceModel.findOne({
      _id: id,
      deleted_at: null,
    });

    if (!existingInvoice) {
      throw new NotFoundError("Invoice not found");
    }

    return existingInvoice.toObject();
  }

  public async createInvoice(
    invoice: IInvoice,
  ): Promise<HydratedDocument<IInvoice>> {
    const newInvoice = await InvoiceModel.create(invoice);
    return newInvoice.toObject();
  }

  public async updateInvoice(
    id: string,
    update: Partial<IInvoice>,
  ): Promise<HydratedDocument<IInvoice>> {
    if (!isValidObjectId(id)) {
      throw new InvalidBodyError("Invalid id");
    }

    const updatedInvoice = await InvoiceModel.findOneAndUpdate(
      {
        _id: id,
        deleted_at: null,
      },
      update,
      {
        new: true,
      },
    );

    if (!updatedInvoice) {
      throw new NotFoundError("Invoice not found");
    }

    return updatedInvoice.toObject();
  }

  public async deleteInvoice(
    id: string,
  ): Promise<HydratedDocument<IInvoice>> {
    if (!isValidObjectId(id)) {
      throw new InvalidBodyError("Invalid id");
    }

    const deletedInvoice = await InvoiceModel.findOneAndUpdate(
      {
        _id: id,
        deleted_at: null,
      },
      { deleted_at: new Date() },
      { new: true },
    );

    if (!deletedInvoice) {
      throw new NotFoundError("Invoice not found");
    }

    return deletedInvoice.toObject();
  }
}

export default InvoiceService;
