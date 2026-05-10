"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageShell } from "../../components/PageShell";
import { PostComposer } from "../../components/PostComposer";
import { PostFeed } from "../../components/PostFeed";
import { createPost, listPosts, shouldDeferAuthRedirect } from "../../lib/api";
import { getSessionUser } from "../../lib/auth-client";
import { AppUser, PostItem } from "../../types/app";
import { usePostFeedAutoRefresh } from "../../hooks/usePostFeedAutoRefresh";
import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<AppUser | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [contentText, setContentText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const refreshPosts = useCallback(async () => {
    const postList = await listPosts();
    setPosts(postList);
  }, []);

  useEffect(() => {
    getSessionUser().then(async (session) => {
      if (!session) {
        if (shouldDeferAuthRedirect()) return;
        router.replace("/auth");
        return;
      }
      if (session.me.role === "HIGH") {
        router.replace("/admin");
        return;
      }

      setMe(session.me);
      await refreshPosts();
    });
  }, [router, refreshPosts]);

  usePostFeedAutoRefresh(!!me, refreshPosts);

  async function handleCreatePost() {
    if (!me) return;
    if (!contentText.trim() && !imageUrl.trim()) {
      setMessage("Bạn cần nhập text hoặc chọn hình ảnh.");
      return;
    }

    setLoading(true);
    try {
      await createPost({
        contentText: contentText.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined
      });
      await refreshPosts();
      setContentText("");
      setImageUrl("");
      setMessage("Gửi kiến nghị thành công.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không gửi được kiến nghị.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="Trang chủ kiến nghị"
      description="Diễn đàn lớp học để góp ý, thảo luận các vấn đề chung."
    >
      <PostComposer
        contentText={contentText}
        imageUrl={imageUrl}
        onChangeText={setContentText}
        onChangeImage={setImageUrl}
        onSubmit={handleCreatePost}
        loading={loading}
      />
      {me ? (
        <div className="app-section-gap">
          <PostFeed posts={posts} me={me} />
        </div>
      ) : (
        <section className="app-info-card">Đang tải dữ liệu...</section>
      )}
      {message ? (
        <p className={styles.message}>{message}</p>
      ) : null}
    </PageShell>
  );
}
