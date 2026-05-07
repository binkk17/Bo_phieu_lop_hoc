import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  updatePasswordController,
  updateMeController
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.post("/refresh", refreshController);
authRouter.post("/logout", requireAuth, logoutController);
authRouter.get("/me", requireAuth, meController);
authRouter.patch("/me", requireAuth, updateMeController);
authRouter.patch("/me/password", requireAuth, updatePasswordController);
