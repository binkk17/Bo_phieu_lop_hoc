import { Request, Response } from "express";
import { createPost, listPosts } from "../services/post.service.js";
import { addPostStreamClient, emitPostCreated, removePostStreamClient } from "../services/post-stream.service.js";
import { createPostSchema } from "../validators/post.validator.js";

export async function createPostController(req: Request, res: Response) {
  const parse = createPostSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Noi dung gui len khong hop le." });
  }

  const post = await createPost({
    userId: String(req.auth?.userId),
    contentText: parse.data.contentText,
    imageUrl: parse.data.imageUrl
  });

  emitPostCreated({ postId: post.id });

  return res.status(201).json({
    id: post.id,
    message: "Gui kien nghi thanh cong."
  });
}

export async function listPostController(req: Request, res: Response) {
  const posts = await listPosts(req.auth!.role);
  return res.json({ data: posts });
}

export function postStreamController(req: Request, res: Response) {
  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  addPostStreamClient(clientId, res);
  res.write("retry: 3000\n\n");

  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
  }, 25_000);

  req.on("close", () => {
    clearInterval(keepAlive);
    removePostStreamClient(clientId);
  });
}
