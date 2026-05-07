import { NextFunction, Request, Response } from "express";
import { validateSession, verifyToken } from "../services/auth.service.js";

function getTokenFromCookie(cookieHeader?: string) {
  if (!cookieHeader) return "";
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const matched = parts.find((part) => part.startsWith("auth_token="));
  if (!matched) return "";
  return decodeURIComponent(matched.slice("auth_token=".length));
}

function getCookieValue(cookieHeader: string | undefined, key: string) {
  if (!cookieHeader) return "";
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const matched = parts.find((part) => part.startsWith(`${key}=`));
  if (!matched) return "";
  return decodeURIComponent(matched.slice(`${key}=`.length));
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  const cookieToken = getTokenFromCookie(req.headers.cookie) || getCookieValue(req.headers.cookie, "auth_token");
  const token = bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập." });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Token không hợp lệ." });
  }

  const session = await validateSession(payload);
  if (!session) {
    return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn." });
  }

  req.auth = payload;
  return next();
}
