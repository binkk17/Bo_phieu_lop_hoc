import { Request, Response } from "express";
import {
  consumeHighRegisterInvite,
  createHighRegisterInvite,
  getProfile,
  loginUser,
  refreshSession,
  registerHighUser,
  registerUser,
  revokeSessionById,
  updatePassword,
  updateProfile
} from "../services/auth.service.js";
import {
  createHighInviteSchema,
  loginSchema,
  registerHighSchema,
  registerSchema,
  updatePasswordSchema,
  updateProfileSchema
} from "../validators/auth.validator.js";
import { env } from "../config/env.js";

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

const highRegisterAttempts = new Map<string, { count: number; firstAt: number }>();
const HIGH_REGISTER_MAX_ATTEMPTS = 5;
const HIGH_REGISTER_WINDOW_MS = 10 * 60 * 1000;

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

function getThrottleKey(req: Request) {
  return req.ip || "unknown-ip";
}

function canAttemptHighRegister(key: string) {
  const now = Date.now();
  const info = highRegisterAttempts.get(key);
  if (!info) return true;
  if (now - info.firstAt > HIGH_REGISTER_WINDOW_MS) {
    highRegisterAttempts.delete(key);
    return true;
  }
  return info.count < HIGH_REGISTER_MAX_ATTEMPTS;
}

function markFailedHighRegisterAttempt(key: string) {
  const now = Date.now();
  const info = highRegisterAttempts.get(key);
  if (!info || now - info.firstAt > HIGH_REGISTER_WINDOW_MS) {
    highRegisterAttempts.set(key, { count: 1, firstAt: now });
    return;
  }
  highRegisterAttempts.set(key, { count: info.count + 1, firstAt: info.firstAt });
}

function clearFailedHighRegisterAttempts(key: string) {
  highRegisterAttempts.delete(key);
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
  return res.status(result.status).json(result.data);
}

export async function registerHighController(req: Request, res: Response) {
  const throttleKey = getThrottleKey(req);
  if (!canAttemptHighRegister(throttleKey)) {
    return res.status(429).json({ message: "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau." });
  }

  const parse = registerHighSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Dữ liệu đăng ký HIGH không hợp lệ." });
  }

  const inviteResult = await consumeHighRegisterInvite(parse.data.inviteToken);
  if ("message" in inviteResult) {
    markFailedHighRegisterAttempt(throttleKey);
    return res.status(inviteResult.status).json({ message: inviteResult.message });
  }

  clearFailedHighRegisterAttempts(throttleKey);
  const { confirmPassword: _ignore, inviteToken: _inviteToken, ...payload } = parse.data;
  const result = await registerHighUser(payload, {
    deviceId: getDeviceId(req),
    userAgent: getUserAgent(req),
    ipAddress: req.ip
  });
  if ("message" in result) {
    return res.status(result.status).json({ message: result.message });
  }
  return res.status(result.status).json(result.data);
}

export async function createHighInviteController(req: Request, res: Response) {
  if (!env.highRegisterSecret) {
    return res.status(503).json({ message: "Chưa cấu hình khóa bảo mật tạo mã mời HIGH." });
  }

  const throttleKey = getThrottleKey(req);
  if (!canAttemptHighRegister(throttleKey)) {
    return res.status(429).json({ message: "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau." });
  }

  const parse = createHighInviteSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Dữ liệu tạo mã mời HIGH không hợp lệ." });
  }

  if (parse.data.securityKey !== env.highRegisterSecret) {
    markFailedHighRegisterAttempt(throttleKey);
    return res.status(403).json({ message: "Khóa bảo mật không đúng." });
  }

  clearFailedHighRegisterAttempts(throttleKey);
  const ttlMinutes = parse.data.ttlMinutes ?? 15;
  const invite = await createHighRegisterInvite(ttlMinutes);
  return res.status(201).json(invite);
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
