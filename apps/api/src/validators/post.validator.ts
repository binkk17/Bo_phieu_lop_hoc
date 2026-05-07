import { z } from "zod";

export const createPostSchema = z
  .object({
    contentText: z.string().trim().max(1000).optional(),
    imageUrl: z.string().trim().url().optional()
  })
  .refine((data) => Boolean(data.contentText || data.imageUrl), {
    message: "Can co noi dung text hoac hinh anh."
  });
