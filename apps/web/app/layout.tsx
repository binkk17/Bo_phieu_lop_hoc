import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { SessionIdleLogout } from "../components/SessionIdleLogout";

export const metadata: Metadata = {
  title: "Diễn đàn lớp học",
  description: "Diễn đàn lớp học để góp ý, thảo luận, tối ưu hóa cho diễn đàn."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SessionIdleLogout />
        {children}
      </body>
    </html>
  );
}
