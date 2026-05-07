"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearPendingReloginReason, logout, SESSION_ENDED_EVENT, shouldDeferAuthRedirect } from "../lib/api";
import styles from "./SessionIdleLogout.module.css";

const IDLE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL_MS = 10 * 1000;

export function SessionIdleLogout() {
  const pathname = usePathname();
  const lastActiveAtRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [reason, setReason] = useState<"idle" | "other_device">("idle");

  useEffect(() => {
    if (pathname === "/auth") {
      if (shouldDeferAuthRedirect()) {
        setReason("other_device");
        setSessionExpired(true);
      }
      return;
    }

    const markActive = () => {
      if (sessionExpired) return;
      lastActiveAtRef.current = Date.now();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markActive();
      }
    };

    const events: Array<keyof WindowEventMap> = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart", "focus"];
    events.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const handleSessionEnded = (event: Event) => {
      if (pathname === "/auth") return;
      const customEvent = event as CustomEvent<{ reason?: string }>;
      if (customEvent.detail?.reason === "other_device") {
        setReason("other_device");
        setSessionExpired(true);
        isLoggingOutRef.current = true;
      }
    };
    window.addEventListener(SESSION_ENDED_EVENT, handleSessionEnded as EventListener);

    const timer = window.setInterval(async () => {
      if (isLoggingOutRef.current) return;
      const idleMs = Date.now() - lastActiveAtRef.current;
      if (idleMs < IDLE_LIMIT_MS) return;

      isLoggingOutRef.current = true;
      try {
        await logout();
      } catch {
        // Ignore errors and still require re-login.
      }
      setReason("idle");
      setSessionExpired(true);
    }, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      events.forEach((eventName) => window.removeEventListener(eventName, markActive));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(SESSION_ENDED_EVENT, handleSessionEnded as EventListener);
    };
  }, [pathname, sessionExpired]);

  if (!sessionExpired) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Phiên đăng nhập đã hết hạn">
      <div className={styles.modal}>
        <p className={styles.title}>
          {reason === "other_device"
            ? "Tài khoản đang đăng nhập trên thiết bị khác."
            : "Cần đăng nhập lại"}
        </p>
        <button
          type="button"
          className={styles.confirmButton}
          onClick={() => {
            clearPendingReloginReason();
            window.location.replace("/auth");
          }}
        >
          Xác nhận
        </button>
      </div>
    </div>
  );
}
