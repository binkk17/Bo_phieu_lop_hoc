import { ChangeEvent, useRef, useState } from "react";

type PostComposerProps = {
  contentText: string;
  imageUrl: string;
  onChangeText: (value: string) => void;
  onChangeImage: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
};
import styles from "./PostComposer.module.css";

export function PostComposer(props: PostComposerProps) {
  const { contentText, imageUrl, onChangeText, onChangeImage, onSubmit, loading } = props;
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isSubmitPressed, setIsSubmitPressed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleChangeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFileName("");
      onChangeImage("");
      return;
    }
    setSelectedFileName(file.name);
    const dataUrl = await fileToDataUrl(file);
    onChangeImage(dataUrl);
  }

  function handleClearImage() {
    setSelectedFileName("");
    onChangeImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <section className="app-card">
      <h2 className={styles.title}>Gửi kiến nghị</h2>
      <textarea
        value={contentText}
        onChange={(e) => onChangeText(e.target.value)}
        rows={4}
        placeholder="Nhập nội dung text..."
        className={`${styles.field} ${styles.textarea}`}
      />
      <div className={styles.fileRow}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChangeFile}
          className={`${styles.field} ${styles.input} ${styles.fileInput}`}
        />
        {imageUrl || selectedFileName ? (
          <button type="button" className={styles.clearButton} onClick={handleClearImage} aria-label="Xóa hình đã chọn">
            X
          </button>
        ) : null}
      </div>
      <p className={styles.fileHint}>{selectedFileName || (imageUrl ? "Đã chọn hình ảnh." : "Chọn hình ảnh (tùy chọn)")}</p>
      <button
        onClick={onSubmit}
        disabled={loading}
        onPointerDown={() => setIsSubmitPressed(true)}
        onPointerUp={() => setIsSubmitPressed(false)}
        onPointerLeave={() => setIsSubmitPressed(false)}
        onPointerCancel={() => setIsSubmitPressed(false)}
        onContextMenu={(e) => e.preventDefault()}
        className={`${styles.submitButton} ${isSubmitPressed ? styles.submitButtonPressed : ""}`}
      >
        Gửi
      </button>
    </section>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Không đọc được tệp hình ảnh."));
    reader.readAsDataURL(file);
  });
}
