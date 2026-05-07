"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "../../components/PageShell";
import { ProfilePanel } from "../../components/ProfilePanel";
import { shouldDeferAuthRedirect, updateMe } from "../../lib/api";
import { getSessionUser } from "../../lib/auth-client";
import { AppUser } from "../../types/app";
import styles from "./page.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<AppUser | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getSessionUser().then((session) => {
      if (!session) {
        if (shouldDeferAuthRedirect()) return;
        router.replace("/auth");
        return;
      }
      setMe(session.me);
      setEditDisplayName(session.me.displayName || "");
    });
  }, [router]);

  async function handleUpdateProfile() {
    if (!me) return;
    setLoading(true);
    try {
      const data = await updateMe({ displayName: editDisplayName });
      setMe(data);
      setMessage("Cập nhật thông tin thành công.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không cập nhật được.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell title="Hồ sơ" description="Thông tin tài khoản.">
      {me ? (
        <ProfilePanel
          user={me}
          editDisplayName={editDisplayName}
          onChangeDisplayName={setEditDisplayName}
          onUpdate={handleUpdateProfile}
          loading={loading}
        />
      ) : (
        <section className={styles.loadingCard}>Đang tải thông tin...</section>
      )}
      {message ? <p className={styles.message}>{message}</p> : null}
    </PageShell>
  );
}
