import { z } from "zod";

const registerBaseSchema = z.object({
  accountName: z.string().trim().min(3).max(50),
  displayName: z.string().trim().min(2).max(100).optional(),
  personalCode: z.string().trim().min(3).max(30),
  password: z.string().min(6).max(100),
  confirmPassword: z.string().min(6).max(100)
});

export const registerSchema = registerBaseSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu nhập lại không khớp.",
  path: ["confirmPassword"]
});

export const registerHighSchema = registerBaseSchema
  .extend({
    inviteToken: z.string().trim().min(20).max(300)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp.",
    path: ["confirmPassword"]
  });

export const createHighInviteSchema = z.object({
  securityKey: z.string().trim().min(1).max(200),
  ttlMinutes: z.number().int().min(1).max(60).optional()
});

export const loginSchema = z.object({
  accountName: z.string().trim().min(3).max(50),
  password: z.string().min(6).max(100)
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional()
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(6).max(100),
    newPassword: z.string().min(6).max(100),
    confirmNewPassword: z.string().min(6).max(100)
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu mới nhập lại không khớp.",
    path: ["confirmNewPassword"]
  });
