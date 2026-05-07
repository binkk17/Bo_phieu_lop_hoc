"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "../../components/PageShell";
import { shouldDeferAuthRedirect, updateMyPassword } from "../../lib/api";
import { getSessionUser } from "../../lib/auth-client";
import styles from "./page.module.css";

export default function PasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitPressed, setIsSubmitPressed] = useState(false);

  useEffect(() => {
    getSessionUser().then((session) => {
      if (!session) {
        if (shouldDeferAuthRedirect()) return;
        router.replace("/auth");
        return;
      }
    });
  }, [router]);

  async function handleUpdatePassword() {
    setLoading(true);
    try {
      const result = await updateMyPassword({
        currentPassword,
        newPassword,
        confirmNewPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không đổi được mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell title="Đổi mật khẩu" description="Chỉnh sửa mật khẩu.">
      <section className={`app-card ${styles.formCard}`}>
        <input
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={styles.input}
          placeholder="Mật khẩu hiện tại(*)"
          type="password"
        />
        <input
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={styles.input}
          placeholder="Mật khẩu mới(*)"
          type="password"
        />
        <input
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          className={styles.input}
          placeholder="Nhập lại mật khẩu mới(*)"
          type="password"
        />
        <button
          onClick={handleUpdatePassword}
          disabled={loading}
          onPointerDown={() => setIsSubmitPressed(true)}
          onPointerUp={() => setIsSubmitPressed(false)}
          onPointerLeave={() => setIsSubmitPressed(false)}
          onPointerCancel={() => setIsSubmitPressed(false)}
          onContextMenu={(e) => e.preventDefault()}
          className={`${styles.submitButton} ${isSubmitPressed ? styles.submitButtonPressed : ""}`}
        >
          Cập nhật mật khẩu
        </button>
      </section>
      {message ? <p className={styles.message}>{message}</p> : null}
    </PageShell>
  );
}
