import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { AuthPayload } from "../types/auth.js";
import { UserRole } from "../types/role.js";

type RegisterInput = {
  accountName: string;
  displayName?: string;
  personalCode: string;
  password: string;
};

type LoginInput = {
  accountName: string;
  password: string;
};

type SessionContext = {
  deviceId: string;
  userAgent?: string;
  ipAddress?: string;
};

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateAnonymousDisplayName() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NguoiDung_${suffix}`;
}

function signToken(payload: AuthPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
}

function randomRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getRefreshExpiryDate() {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}

async function writeAuditLog(args: {
  userId?: string;
  action: string;
  result: "SUCCESS" | "FAIL";
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: args.userId,
        action: args.action,
        result: args.result,
        deviceId: args.deviceId,
        userAgent: args.userAgent,
        ipAddress: args.ipAddress,
        metadata: args.metadata
      }
    });
  } catch {
    // Không làm hỏng luồng auth nếu ghi audit log lỗi.
  }
}

async function createFreshSession(user: { id: string; role: UserRole }, context: SessionContext) {
  await prisma.userSession.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() }
  });

  const refreshToken = randomRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      deviceId: context.deviceId,
      refreshTokenHash,
      expiresAt: getRefreshExpiryDate()
    }
  });
  const accessToken = signToken({ userId: user.id, role: user.role, sessionId: session.id });
  return { accessToken, refreshToken };
}

async function rotateRefreshToken(input: {
  refreshToken: string;
  deviceId: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  const refreshTokenHash = hashRefreshToken(input.refreshToken);
  const session = await prisma.userSession.findFirst({
    where: { refreshTokenHash, revokedAt: null },
    include: { user: true }
  });

  if (!session) {
    await writeAuditLog({
      action: "REFRESH_TOKEN",
      result: "FAIL",
      deviceId: input.deviceId,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      metadata: "Session không tồn tại hoặc đã bị thu hồi."
    });
    return { status: 401 as const, message: "Phiên đăng nhập không hợp lệ." };
  }

  if (session.deviceId !== input.deviceId) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() }
    });
    await writeAuditLog({
      userId: session.userId,
      action: "REFRESH_TOKEN",
      result: "FAIL",
      deviceId: input.deviceId,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      metadata: "DeviceId không khớp, thu hồi phiên."
    });
    return { status: 401 as const, message: "Thiết bị không hợp lệ." };
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() }
    });
    await writeAuditLog({
      userId: session.userId,
      action: "REFRESH_TOKEN",
      result: "FAIL",
      deviceId: input.deviceId,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      metadata: "Refresh token đã hết hạn."
    });
    return { status: 401 as const, message: "Phiên đăng nhập đã hết hạn." };
  }

  const nextRefreshToken = randomRefreshToken();
  await prisma.userSession.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashRefreshToken(nextRefreshToken),
      lastSeenAt: new Date(),
      expiresAt: getRefreshExpiryDate()
    }
  });

  const accessToken = signToken({ userId: session.userId, role: session.user.role, sessionId: session.id });
  await writeAuditLog({
    userId: session.userId,
    action: "REFRESH_TOKEN",
    result: "SUCCESS",
    deviceId: input.deviceId,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress
  });

  return { status: 200 as const, data: { accessToken, refreshToken: nextRefreshToken } };
}

function toPublicUser(user: {
  id: string;
  accountName: string;
  displayName: string | null;
  personalCode: string;
  role: UserRole;
}) {
  return {
    id: user.id,
    accountName: user.accountName,
    displayName: user.displayName,
    personalCode: user.personalCode,
    role: user.role
  };
}

export async function registerUser(input: RegisterInput, context: SessionContext) {
  const existingByCode = await prisma.user.findUnique({ where: { personalCode: input.personalCode } });
  const existingByAccount = await prisma.user.findUnique({ where: { accountName: input.accountName } });

  if (existingByCode) {
    return { status: 409 as const, message: "Mã cá nhân đã tồn tại." };
  }
  if (existingByAccount) {
    return { status: 409 as const, message: "Tên tài khoản đã tồn tại." };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      accountName: input.accountName,
      displayName: input.displayName?.trim() || generateAnonymousDisplayName(),
      personalCode: input.personalCode,
      passwordHash,
      role: "LOW"
    }
  });

  const { accessToken, refreshToken } = await createFreshSession(user, context);
  await writeAuditLog({
    userId: user.id,
    action: "REGISTER",
    result: "SUCCESS",
    deviceId: context.deviceId,
    userAgent: context.userAgent,
    ipAddress: context.ipAddress
  });
  return {
    status: 201 as const,
    data: { token: accessToken, refreshToken, user: toPublicUser(user) }
  };
}

export async function loginUser(input: LoginInput, context: SessionContext) {
  const user = await prisma.user.findUnique({
    where: { accountName: input.accountName }
  });
  if (!user) {
    await writeAuditLog({
      action: "LOGIN",
      result: "FAIL",
      deviceId: context.deviceId,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      metadata: "Không tìm thấy accountName."
    });
    return { status: 401 as const, message: "Sai thông tin đăng nhập." };
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    await writeAuditLog({
      userId: user.id,
      action: "LOGIN",
      result: "FAIL",
      deviceId: context.deviceId,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      metadata: "Sai mật khẩu."
    });
    return { status: 401 as const, message: "Sai thông tin đăng nhập." };
  }

  const { accessToken, refreshToken } = await createFreshSession(user, context);
  await writeAuditLog({
    userId: user.id,
    action: "LOGIN",
    result: "SUCCESS",
    deviceId: context.deviceId,
    userAgent: context.userAgent,
    ipAddress: context.ipAddress
  });

  return {
    status: 200 as const,
    data: { token: accessToken, refreshToken, user: toPublicUser(user) }
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return null;
  }
  return toPublicUser(user);
}

export async function updateProfile(userId: string, data: { displayName?: string }) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data
    });
    return { status: 200 as const, data: toPublicUser(user) };
  } catch {
    return { status: 409 as const, message: "Không cập nhật được thông tin." };
  }
}

export async function updatePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { status: 404 as const, message: "Không tìm thấy người dùng." };

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) return { status: 400 as const, message: "Mật khẩu hiện tại không đúng." };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });
  return { status: 200 as const, message: "Đổi mật khẩu thành công." };
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, env.jwtSecret) as AuthPayload;
  } catch {
    return null;
  }
}

export async function validateSession(payload: AuthPayload) {
  const session = await prisma.userSession.findFirst({
    where: {
      id: payload.sessionId,
      userId: payload.userId,
      revokedAt: null
    }
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;

  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() }
  });

  return session;
}

export async function refreshSession(refreshToken: string, context: SessionContext) {
  return rotateRefreshToken({
    refreshToken,
    deviceId: context.deviceId,
    userAgent: context.userAgent,
    ipAddress: context.ipAddress
  });
}

export async function revokeSessionById(sessionId?: string) {
  if (!sessionId) return;
  await prisma.userSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}
