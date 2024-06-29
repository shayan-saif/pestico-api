import { Request, Response, Router } from "express";
import verifyToken from "@/middleware/auth";
import InvoiceController from "@/controllers/invoice.controller";

const router = Router();
const invoiceController = new InvoiceController();

router.get("/", verifyToken, (req: Request, res: Response) =>
  invoiceController.getInvoices(req, res),
);

router.get("/:id", verifyToken, (req: Request, res: Response) =>
  invoiceController.getInvoice(req, res),
);

router.post("/", verifyToken, async (req: Request, res: Response) =>
  invoiceController.createInvoice(req, res),
);

router.patch("/:id", verifyToken, async (req: Request, res: Response) =>
  invoiceController.updateInvoice(req, res),
);

router.delete("/:id", verifyToken, async (req: Request, res: Response) =>
  invoiceController.deleteInvoice(req, res),
);

export default router;
