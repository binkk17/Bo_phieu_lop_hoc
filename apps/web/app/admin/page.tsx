"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "../../components/PageShell";
import { PostComposer } from "../../components/PostComposer";
import { PostFeed } from "../../components/PostFeed";
import { createPost, listPosts, shouldDeferAuthRedirect } from "../../lib/api";
import { getSessionUser } from "../../lib/auth-client";
import { AppUser, PostItem } from "../../types/app";

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<AppUser | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [contentText, setContentText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getSessionUser().then(async (session) => {
      if (!session) {
        if (shouldDeferAuthRedirect()) return;
        router.replace("/auth");
        return;
      }

      setMe(session.me);
      if (session.me.role !== "HIGH") {
        setMessage("Bạn không có quyền vào trang quản trị.");
        return;
      }

      const postList = await listPosts();
      setPosts(postList);
    });
  }, [router]);

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
      const postList = await listPosts();
      setPosts(postList);
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
    <PageShell title="Quản lý cấp cao" description="">
      {me?.role === "HIGH" ? (
        <>
          <PostComposer
            contentText={contentText}
            imageUrl={imageUrl}
            onChangeText={setContentText}
            onChangeImage={setImageUrl}
            onSubmit={handleCreatePost}
            loading={loading}
          />
          <div className="app-section-gap">
            <PostFeed posts={posts} me={me} />
          </div>
        </>
      ) : (
        <section className="app-info-card">
          {message || "Đang kiểm tra quyền truy cập..."}
        </section>
      )}
    </PageShell>
  );
}
