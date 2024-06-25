import { Router, Request, Response } from "express";
import verifyToken from "@/middleware/auth";
import AuthController from "@/controllers/auth.controller";

const router = Router();
const authController = new AuthController();

router.get("/", verifyToken, (req: Request, res: Response) =>
  authController.verify(req, res),
);

router.post("/register", verifyToken, (req: Request, res: Response) =>
  authController.register(req, res),
);

router.post("/login", async (req: Request, res: Response) =>
  authController.login(req, res),
);

export default router;
