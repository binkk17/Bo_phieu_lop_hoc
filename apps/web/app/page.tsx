"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser } from "../lib/auth-client";
import { shouldDeferAuthRedirect } from "../lib/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    getSessionUser().then((session) => {
      if (!session) {
        if (shouldDeferAuthRedirect()) return;
        router.replace("/auth");
        return;
      }
      router.replace(session.me.role === "HIGH" ? "/admin" : "/home");
    });
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
      <p className="text-sm text-slate-500">Đang chuyển hướng...</p>
    </main>
  );
}
