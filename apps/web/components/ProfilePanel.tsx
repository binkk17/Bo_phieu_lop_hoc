import { useState } from "react";
import { AppUser } from "../types/app";
import styles from "./ProfilePanel.module.css";

type ProfilePanelProps = {
  user: AppUser;
  editDisplayName: string;
  onChangeDisplayName: (value: string) => void;
  onUpdate: () => void;
  loading: boolean;
};

export function ProfilePanel(props: ProfilePanelProps) {
  const {
    user,
    editDisplayName,
    onChangeDisplayName,
    onUpdate,
    loading
  } = props;
  const [isSavePressed, setIsSavePressed] = useState(false);

  return (
    <section className="app-card">
      <p className={styles.metaText}>Tài khoản: {user.accountName}</p>
      <p className={styles.metaText}>Mã cá nhân: {user.personalCode}</p>
      <input
        value={editDisplayName}
        onChange={(e) => onChangeDisplayName(e.target.value)}
        className={styles.displayNameInput}
        placeholder="Tên người dùng"
      />
      <div className={styles.actions}>
        <button
          onClick={onUpdate}
          disabled={loading}
          onPointerDown={() => setIsSavePressed(true)}
          onPointerUp={() => setIsSavePressed(false)}
          onPointerLeave={() => setIsSavePressed(false)}
          onPointerCancel={() => setIsSavePressed(false)}
          onContextMenu={(e) => e.preventDefault()}
          className={`${styles.saveButton} ${isSavePressed ? styles.saveButtonPressed : ""}`}
        >
          Lưu thông tin
        </button>
      </div>
    </section>
  );
}
