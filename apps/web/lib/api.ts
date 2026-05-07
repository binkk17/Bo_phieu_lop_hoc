import { AppUser, AuthResponse, PostItem } from "../types/app";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const DEVICE_ID_KEY = "forum_device_id";
const PENDING_RELOGIN_REASON_KEY = "forum_pending_relogin_reason";
export const SESSION_ENDED_EVENT = "app:session-ended";

type SessionEndedReason = "idle" | "other_device" | "unauthorized";

type RegisterPayload = {
  accountName: string;
  displayName?: string;
  personalCode: string;
  password: string;
  confirmPassword: string;
};

type LoginPayload = {
  accountName: string;
  password: string;
};

type PostPayload = {
  contentText?: string;
  imageUrl?: string;
};

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data.message || "Yêu cầu thất bại.");
  }
  return data as T;
}

function emitSessionEnded(reason: SessionEndedReason) {
  if (typeof window === "undefined") return;
  if (reason === "other_device") {
    window.sessionStorage.setItem(PENDING_RELOGIN_REASON_KEY, reason);
  }
  window.dispatchEvent(new CustomEvent(SESSION_ENDED_EVENT, { detail: { reason } }));
}

export function shouldDeferAuthRedirect() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(PENDING_RELOGIN_REASON_KEY) === "other_device";
}

export function clearPendingReloginReason() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_RELOGIN_REASON_KEY);
}

function getDeviceId() {
  if (typeof window === "undefined") return "server-device";
  const stored = window.localStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;
  const generated = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

function withBaseHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers);
  merged.set("x-device-id", getDeviceId());
  return merged;
}

async function tryRefreshSession() {
  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: withBaseHeaders()
  });
  if (res.ok) {
    return true;
  }

  if (res.status === 401) {
    let reason: SessionEndedReason = "unauthorized";
    try {
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      const message = String(data?.message || "");
      if (
        message.includes("không hợp lệ") ||
        message.includes("hết hạn") ||
        message.includes("thiết bị")
      ) {
        reason = "other_device";
      }
    } catch {
      reason = "unauthorized";
    }
    emitSessionEnded(reason);
  }

  return false;
}

async function fetchWithAuthRetry(input: RequestInfo | URL, init?: RequestInit) {
  const first = await fetch(input, {
    ...init,
    credentials: "include",
    headers: withBaseHeaders(init?.headers)
  });
  if (first.status !== 401) return first;

  const refreshed = await tryRefreshSession();
  if (!refreshed) return first;

  return fetch(input, {
    ...init,
    credentials: "include",
    headers: withBaseHeaders(init?.headers)
  });
}

export function getStoredToken() {
  return "";
}

export function setStoredToken(_token: string) {}

export function clearStoredToken() {}

export async function register(payload: RegisterPayload) {
  const res = await fetchWithAuthRetry(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return parseResponse<AuthResponse>(res);
}

export async function login(payload: LoginPayload) {
  const res = await fetchWithAuthRetry(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return parseResponse<AuthResponse>(res);
}

export async function logout() {
  const res = await fetchWithAuthRetry(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST"
  });
  return parseResponse<{ message: string }>(res);
}

export async function getMe() {
  const res = await fetchWithAuthRetry(`${API_BASE_URL}/api/auth/me`);
  return parseResponse<AppUser>(res);
}

export async function updateMe(data: { displayName?: string }) {
  const res = await fetchWithAuthRetry(`${API_BASE_URL}/api/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseResponse<AppUser>(res);
}

export async function updateMyPassword(
  data: { currentPassword: string; newPassword: string; confirmNewPassword: string }
) {
  const res = await fetchWithAuthRetry(`${API_BASE_URL}/api/auth/me/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return parseResponse<{ message: string }>(res);
}

export async function createPost(payload: PostPayload) {
  const res = await fetchWithAuthRetry(`${API_BASE_URL}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return parseResponse<{ id: string; message: string }>(res);
}

export async function listPosts() {
  const res = await fetchWithAuthRetry(`${API_BASE_URL}/api/posts`, {
    cache: "no-store"
  });
  const data = await parseResponse<{ data: PostItem[] }>(res);
  return data.data;
}
