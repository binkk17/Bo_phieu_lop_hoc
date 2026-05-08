"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "../../../components/PageShell";
import { getSessionUser } from "../../../lib/auth-client";
import { createHighInvite, registerHigh } from "../../../lib/api";
import styles from "./page.module.css";

export default function HighRegisterPage() {
  const router = useRouter();
  const [accountName, setAccountName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [personalCode, setPersonalCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [securityKey, setSecurityKey] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState("15");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSessionUser().then((session) => {
      if (!session) return;
      router.replace(session.me.role === "HIGH" ? "/admin" : "/home");
    });
  }, [router]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function handleCreateInvite() {
    setLoading(true);
    setMessage("");
    try {
      const ttl = Number(ttlMinutes);
      const data = await createHighInvite({
        securityKey,
        ttlMinutes: Number.isFinite(ttl) && ttl > 0 ? ttl : 15
      });
      setInviteToken(data.inviteToken);
      setMessage("Đã tạo mã mời HIGH một lần. Hãy dùng mã này để đăng ký.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tạo mã mời HIGH thất bại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setMessage("");
    try {
      await registerHigh({
        accountName,
        displayName: displayName || undefined,
        personalCode,
        password,
        confirmPassword,
        inviteToken
      });
      setMessage("Tạo tài khoản HIGH thành công. Vui lòng đăng nhập.");
      setPassword("");
      setConfirmPassword("");
      setInviteToken("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Đăng ký HIGH thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell title="Đăng ký tài khoản HIGH" description="" showMobileNav={false} centerContent>
      <div className={styles.form}>
        {message ? <p className={styles.message}>{message}</p> : null}
        <h1 className={styles.title}>Tạo tài khoản quyền cao</h1>
        <p className={styles.hint}>Dùng khóa bảo mật để tạo mã mời 1 lần, sau đó dùng mã mời để tạo HIGH.</p>

        <label className={styles.label}>Khóa bảo mật tạo mã mời</label>
        <input
          className={styles.input}
          type="password"
          value={securityKey}
          onChange={(e) => setSecurityKey(e.target.value)}
        />

        <label className={styles.label}>Thời hạn mã mời (phút)</label>
        <input className={styles.input} value={ttlMinutes} onChange={(e) => setTtlMinutes(e.target.value)} />

        <button type="button" className={styles.button} disabled={loading} onClick={handleCreateInvite}>
          Tạo mã mời HIGH
        </button>

        <label className={styles.label}>Mã mời HIGH (dùng 1 lần)</label>
        <input className={styles.input} value={inviteToken} onChange={(e) => setInviteToken(e.target.value)} />

        <label className={styles.label}>Tên tài khoản</label>
        <input className={styles.input} value={accountName} onChange={(e) => setAccountName(e.target.value)} />

        <label className={styles.label}>Tên người dùng</label>
        <input className={styles.input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />

        <label className={styles.label}>Mã cá nhân</label>
        <input className={styles.input} value={personalCode} onChange={(e) => setPersonalCode(e.target.value)} />

        <label className={styles.label}>Mật khẩu</label>
        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className={styles.label}>Nhập lại mật khẩu</label>
        <input
          className={styles.input}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button type="button" className={styles.button} disabled={loading} onClick={handleSubmit}>
          Tạo tài khoản HIGH
        </button>

        <Link href="/auth" className={styles.backLink}>
          Quay về đăng nhập
        </Link>
      </div>
    </PageShell>
  );
}
