import { Router } from "express";
import { createPostController, listPostController } from "../controllers/post.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const postRouter = Router();

postRouter.get("/", requireAuth, listPostController);
postRouter.post("/", requireAuth, createPostController);
