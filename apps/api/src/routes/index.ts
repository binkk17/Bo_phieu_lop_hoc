import { Router } from "express";
import { authRouter } from "./auth.route.js";
import { postRouter } from "./post.route.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/posts", postRouter);
