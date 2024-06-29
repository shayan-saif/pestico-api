import { Request, Response, Router } from "express";
import verifyToken from "@/middleware/auth";
import CustomerController from "@/controllers/customer.controller";

const router = Router();
const customerController = new CustomerController();

router.get("/", verifyToken, (req: Request, res: Response) =>
  customerController.getCustomers(req, res),
);

router.get("/:id", verifyToken, (req: Request, res: Response) =>
  customerController.getCustomer(req, res),
);

router.post("/", verifyToken, async (req: Request, res: Response) =>
  customerController.createCustomer(req, res),
);

router.patch("/:id", verifyToken, async (req: Request, res: Response) =>
  customerController.updateCustomer(req, res),
);

router.delete("/:id", verifyToken, async (req: Request, res: Response) =>
  customerController.deleteCustomer(req, res),
);

export default router;
