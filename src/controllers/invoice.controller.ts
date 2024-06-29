import { Request, Response } from "express";
import { ForbiddenError, handleErrors } from "@/utils/errors";
import { scope } from "@/utils/auth";
import { validateBody } from "@/schemas";
import { HydratedDocument, Types } from "mongoose";
import { IInvoice } from "@/models/invoice.model";
import InvoiceService from "@/services/invoice.service";
import { CreateBody, UpdateBody } from "@/schemas/invoice.schema";

class InvoiceController {
  constructor(private invoiceService = new InvoiceService()) {}

  @scope("invoice:read")
  public async getInvoices(req: Request, res: Response) {
    try {
      const requestingUser = req.user;
      let invoices: HydratedDocument<IInvoice>[];

      if (requestingUser?.is_admin) {
        invoices = await this.invoiceService.getInvoices();
      } else {
        invoices = await this.invoiceService.getInvoices({
          user_id: requestingUser?._id,
        });
      }

      return res.status(200).json({
        invoices,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  @scope("invoice:read")
  public async getInvoice(req: Request, res: Response) {
    try {
      const isAdmin = req.user?.is_admin ?? false;
      const requestingUserId = req.user?._id;
      const invoiceId = new Types.ObjectId(req.params.id);

      const invoice = await this.invoiceService.getInvoiceById(invoiceId);

      if (!isAdmin && !requestingUserId?.equals(invoice.user_id)) {
        throw new ForbiddenError(
          "You are not authorized to view this invoice",
        );
      }

      return res.status(200).json({
        invoice,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  @scope()
  public async createInvoice(req: Request, res: Response) {
    try {
      const newInvoice = validateBody(req, CreateBody);

      const createdInvoice = await this.invoiceService.createInvoice(newInvoice);

      return res.status(201).json({
        message: "Invoice created",
        invoice: createdInvoice,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }


  @scope()
  public async updateInvoice(req: Request, res: Response) {
    try {
      const updateBody = validateBody(req, UpdateBody);
      const { id: invoiceUpdateId } = req.params;

      const updatedInvoice = await this.invoiceService.updateInvoice(
        invoiceUpdateId,
        updateBody,
      );

      return res.status(201).json({
        message: "Invoice updated",
        invoice: updatedInvoice,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  @scope()
  public async deleteInvoice(req: Request, res: Response) {
    try {
      const { id: invoiceDeleteId } = req.params;

      const deletedInvoice =
        await this.invoiceService.deleteInvoice(invoiceDeleteId);

      return res.status(200).json({
        message: "Invoice deleted",
        invoice: deletedInvoice,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }
}

export default InvoiceController;
