import { Router } from "express";
import {
  createPostController,
  listPostController,
  postStreamController
} from "../controllers/post.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const postRouter = Router();

postRouter.get("/stream", requireAuth, postStreamController);
postRouter.get("/", requireAuth, listPostController);
postRouter.post("/", requireAuth, createPostController);
