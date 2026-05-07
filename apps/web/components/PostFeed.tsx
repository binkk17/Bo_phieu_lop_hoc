import { AppUser, PostItem } from "../types/app";
import styles from "./PostFeed.module.css";

type PostFeedProps = {
  posts: PostItem[];
  me: AppUser;
};

export function PostFeed({ posts, me }: PostFeedProps) {
  return (
    <section className="app-card">
      <h2 className={styles.title}>Danh sách kiến nghị</h2>
      <div className={styles.list}>
        {posts.map((post) => (
          <article key={post.id} className={styles.item}>
            {post.contentText ? <p>{post.contentText}</p> : null}
            {post.imageUrl ? (
              <a
                className={styles.imageLink}
                href={post.imageUrl}
                target="_blank"
                rel="noreferrer"
              >
                Xem hình ảnh
              </a>
            ) : null}
            <p className={styles.metaTime}>{new Date(post.createdAt).toLocaleString("vi-VN")}</p>
            {me.role === "HIGH" && post.user ? (
              <p className={styles.metaAuthor}>
                Người gửi: {post.user.displayName || "Không đặt tên"} ({post.user.personalCode})
              </p>
            ) : post.anonymousName ? (
              <p className={styles.metaAuthor}>Người gửi: {post.anonymousName}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
