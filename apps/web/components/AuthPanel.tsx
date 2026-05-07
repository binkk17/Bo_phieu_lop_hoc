type AuthPanelProps = {
  mode: "login" | "register";
  setMode: (mode: "login" | "register") => void;
  accountName: string;
  displayName: string;
  personalCode: string;
  password: string;
  confirmPassword: string;
  onChange: (field: "accountName" | "displayName" | "personalCode" | "password" | "confirmPassword", value: string) => void;
  onSubmit: () => void;
  loading: boolean;
};

import { useState } from "react";
import styles from "./AuthPanel.module.css";

export function AuthPanel(props: AuthPanelProps) {
  const {
    mode,
    setMode,
    accountName,
    displayName,
    personalCode,
    password,
    confirmPassword,
    onChange,
    onSubmit,
    loading
  } = props;
  const [isSubmitPressed, setIsSubmitPressed] = useState(false);

  return (
    <section className={styles.panel}>
      <div className={styles.modeWrap}>
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`${styles.modeButton} ${mode === "login" ? styles.modeButtonActive : ""}`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`${styles.modeButton} ${mode === "register" ? styles.modeButtonActive : ""}`}
        >
          Đăng ký
        </button>
      </div>

      <label className={styles.label}>
        Tên tài khoản <span className={styles.required}>*</span>
      </label>
      <input
        value={accountName}
        onChange={(e) => onChange("accountName", e.target.value)}
        className={styles.input}
        placeholder="Tên tài khoản"
      />

      {mode === "register" ? (
        <>
          <label className={styles.label}>Tên người dùng</label>
          <input
            value={displayName}
            onChange={(e) => onChange("displayName", e.target.value)}
            className={styles.input}
            placeholder="Tên người dùng (có thể để trống)"
          />
        </>
      ) : null}
      {mode === "register" ? (
        <>
          <label className={styles.label}>
            Mã cá nhân <span className={styles.required}>*</span>
          </label>
          <input
            value={personalCode}
            onChange={(e) => onChange("personalCode", e.target.value)}
            className={styles.input}
            placeholder="Mã cá nhân"
          />
        </>
      ) : null}
      <label className={styles.label}>
        Mật khẩu <span className={styles.required}>*</span>
      </label>
      <input
        value={password}
        onChange={(e) => onChange("password", e.target.value)}
        className={styles.input}
        type="password"
        placeholder="Mật khẩu"
      />
      {mode === "login" ? <span className={styles.forgotPassword}>Quên mật khẩu?</span> : null}
      {mode === "register" ? (
        <>
          <label className={styles.label}>
            Nhập lại mật khẩu <span className={styles.required}>*</span>
          </label>
          <input
            value={confirmPassword}
            onChange={(e) => onChange("confirmPassword", e.target.value)}
            className={styles.input}
            type="password"
            placeholder="Nhập lại mật khẩu"
          />
        </>
      ) : null}
      <button
        onClick={onSubmit}
        disabled={loading}
        onPointerDown={() => setIsSubmitPressed(true)}
        onPointerUp={() => setIsSubmitPressed(false)}
        onPointerLeave={() => setIsSubmitPressed(false)}
        onPointerCancel={() => setIsSubmitPressed(false)}
        onContextMenu={(e) => e.preventDefault()}
        className={`${
          styles.submitButton
        } ${isSubmitPressed ? styles.submitButtonPressed : ""}`}
      >
        {mode === "login" ? "Đăng nhập" : "Đăng ký"}
      </button>
    </section>
  );
}
