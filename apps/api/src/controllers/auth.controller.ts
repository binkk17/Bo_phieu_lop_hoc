import { Request, Response } from "express";
import {
  getProfile,
  loginUser,
  refreshSession,
  registerUser,
  revokeSessionById,
  updatePassword,
  updateProfile
} from "../services/auth.service.js";
import {
  loginSchema,
  registerSchema,
  updatePasswordSchema,
  updateProfileSchema
} from "../validators/auth.validator.js";

const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: true,
  path: "/"
};

const accessCookieOptions = {
  ...authCookieOptions,
  maxAge: 15 * 60 * 1000
};

const refreshCookieOptions = {
  ...authCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000
};

function getDeviceId(req: Request) {
  const value = req.headers["x-device-id"];
  if (typeof value === "string" && value.trim()) return value.trim();
  return "unknown-device";
}

function getUserAgent(req: Request) {
  const value = req.headers["user-agent"];
  return typeof value === "string" ? value : undefined;
}

function getCookieValue(cookieHeader: string | undefined, key: string) {
  if (!cookieHeader) return "";
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const matched = parts.find((part) => part.startsWith(`${key}=`));
  if (!matched) return "";
  return decodeURIComponent(matched.slice(`${key}=`.length));
}

export async function registerController(req: Request, res: Response) {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Dữ liệu đăng ký không hợp lệ." });
  }

  const { confirmPassword: _ignore, ...payload } = parse.data;
  const result = await registerUser(payload, {
    deviceId: getDeviceId(req),
    userAgent: getUserAgent(req),
    ipAddress: req.ip
  });
  if ("message" in result) {
    return res.status(result.status).json({ message: result.message });
  }
  res.cookie("auth_token", result.data.token, accessCookieOptions);
  res.cookie("refresh_token", result.data.refreshToken, refreshCookieOptions);
  return res.status(result.status).json(result.data);
}

export async function loginController(req: Request, res: Response) {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Dữ liệu đăng nhập không hợp lệ." });
  }

  const result = await loginUser(parse.data, {
    deviceId: getDeviceId(req),
    userAgent: getUserAgent(req),
    ipAddress: req.ip
  });
  if ("message" in result) {
    return res.status(result.status).json({ message: result.message });
  }
  res.cookie("auth_token", result.data.token, accessCookieOptions);
  res.cookie("refresh_token", result.data.refreshToken, refreshCookieOptions);
  return res.status(result.status).json(result.data);
}

export async function refreshController(req: Request, res: Response) {
  const refreshToken = getCookieValue(req.headers.cookie, "refresh_token");
  if (!refreshToken) {
    return res.status(401).json({ message: "Bạn cần đăng nhập lại." });
  }

  const result = await refreshSession(refreshToken, {
    deviceId: getDeviceId(req),
    userAgent: getUserAgent(req),
    ipAddress: req.ip
  });
  if ("message" in result) {
    res.clearCookie("auth_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/" });
    return res.status(result.status).json({ message: result.message });
  }

  res.cookie("auth_token", result.data.accessToken, accessCookieOptions);
  res.cookie("refresh_token", result.data.refreshToken, refreshCookieOptions);
  return res.status(200).json({ message: "Làm mới phiên thành công." });
}

export async function logoutController(req: Request, res: Response) {
  await revokeSessionById(req.auth?.sessionId);
  res.clearCookie("auth_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
  return res.status(200).json({ message: "Đăng xuất thành công." });
}

export async function meController(req: Request, res: Response) {
  const profile = await getProfile(String(req.auth?.userId));
  if (!profile) {
    return res.status(404).json({ message: "Không tìm thấy người dùng." });
  }
  return res.json(profile);
}

export async function updateMeController(req: Request, res: Response) {
  const parse = updateProfileSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Dữ liệu cập nhật không hợp lệ." });
  }

  const result = await updateProfile(String(req.auth?.userId), parse.data);
  if ("message" in result) {
    return res.status(result.status).json({ message: result.message });
  }
  return res.status(result.status).json(result.data);
}

export async function updatePasswordController(req: Request, res: Response) {
  const parse = updatePasswordSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Dữ liệu đổi mật khẩu không hợp lệ." });
  }

  const result = await updatePassword(
    String(req.auth?.userId),
    parse.data.currentPassword,
    parse.data.newPassword
  );
  if ("message" in result) {
    return res.status(result.status).json({ message: result.message });
  }
  return res.status(200).json({ message: "Đổi mật khẩu thành công." });
}
