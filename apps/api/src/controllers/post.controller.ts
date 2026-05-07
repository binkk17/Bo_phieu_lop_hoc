import { Request, Response } from "express";
import { createPost, listPosts } from "../services/post.service.js";
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

  return res.status(201).json({
    id: post.id,
    message: "Gui kien nghi thanh cong."
  });
}

export async function listPostController(req: Request, res: Response) {
  const posts = await listPosts(req.auth!.role);
  return res.json({ data: posts });
}
