"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPanel } from "../../components/AuthPanel";
import { PageShell } from "../../components/PageShell";
import { login, register } from "../../lib/api";
import { getSessionUser } from "../../lib/auth-client";
import styles from "./page.module.css";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [accountName, setAccountName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [personalCode, setPersonalCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    const timer = window.setTimeout(() => {
      setMessage("");
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function handleAuthSubmit() {
    setLoading(true);
    setMessage("");
    try {
      const data =
        mode === "register"
          ? await register({
              accountName,
              displayName: displayName || undefined,
              personalCode,
              password,
              confirmPassword
            })
          : await login({ accountName, password });
      router.replace(data.user.role === "HIGH" ? "/admin" : "/home");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Xác thực thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="Diễn đàn lớp học"
      description=""
      showMobileNav={false}
      centerContent
    >
      <div>
        {message ? <p className={styles.message}>{message}</p> : null}
        <AuthPanel
          mode={mode}
          setMode={setMode}
          accountName={accountName}
          displayName={displayName}
          personalCode={personalCode}
          password={password}
          confirmPassword={confirmPassword}
          loading={loading}
          onChange={(field, value) => {
            if (field === "accountName") setAccountName(value);
            if (field === "displayName") setDisplayName(value);
            if (field === "personalCode") setPersonalCode(value);
            if (field === "password") setPassword(value);
            if (field === "confirmPassword") setConfirmPassword(value);
          }}
          onSubmit={handleAuthSubmit}
        />
      </div>
    </PageShell>
  );
}
