import { Router, Request, Response } from "express";
import verifyToken from "@/middleware/auth";
import UserController from "@/controllers/user.controller";

const router = Router();
const userController = new UserController();

router.get("/", verifyToken, (req: Request, res: Response) =>
  userController.getUsers(req, res),
);

router.get("/:id", verifyToken, (req: Request, res: Response) =>
  userController.getUser(req, res),
);

router.patch("/:id", verifyToken, async (req: Request, res: Response) =>
  userController.updateUser(req, res),
);

router.delete("/:id", verifyToken, async (req: Request, res: Response) =>
  userController.deleteUser(req, res),
);

export default router;
