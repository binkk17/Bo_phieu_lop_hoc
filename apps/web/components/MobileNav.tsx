"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "../lib/api";
import styles from "./MobileNav.module.css";

const items = [
  { id: "home", href: "/home", label: "Trang chủ" },
  { id: "profile", href: "/profile", label: "Hồ sơ" },
  { id: "change-password", href: "/password", label: "Đổi mật khẩu" }
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pressedId, setPressedId] = useState<string | null>(null);

  async function handleConfirmLogout() {
    try {
      await logout();
    } finally {
      router.replace("/auth");
      setShowLogoutConfirm(false);
    }
  }

  return (
    <nav className={styles.nav}>
      {items.map((item) => {
        const isHomeGroup = item.href === "/home" && (pathname === "/home" || pathname === "/admin");
        const active = pathname === item.href || isHomeGroup;
        return (
          <Link
            key={item.id}
            href={item.href}
            onPointerDown={() => setPressedId(item.id)}
            onPointerUp={() => setPressedId(null)}
            onPointerLeave={() => setPressedId(null)}
            onPointerCancel={() => setPressedId(null)}
            className={`${styles.link} ${active ? styles.linkActive : ""} ${
              pressedId === item.id ? styles.linkPressed : ""
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onPointerDown={() => setPressedId("logout")}
        onPointerUp={() => setPressedId(null)}
        onPointerLeave={() => setPressedId(null)}
        onPointerCancel={() => setPressedId(null)}
        onClick={() => setShowLogoutConfirm(true)}
        className={`${styles.linkButton} ${pressedId === "logout" ? styles.linkPressed : ""}`}
      >
        Đăng xuất
      </button>
      {showLogoutConfirm ? (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Xác nhận đăng xuất">
          <div className={styles.modal}>
            <p className={styles.modalText}>Bạn có muốn đăng xuất không?</p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setShowLogoutConfirm(false)}>
                Hủy
              </button>
              <button type="button" className={styles.confirmButton} onClick={handleConfirmLogout}>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
