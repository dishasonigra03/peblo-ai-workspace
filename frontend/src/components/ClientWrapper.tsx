"use client";

import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { useUiStore } from "@/store/useUiStore";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const initTheme = useUiStore((state) => state.initTheme);
  const fetchMe = useAuthStore((state) => state.fetchMe);

  useEffect(() => {
    initTheme();
    fetchMe();
  }, [initTheme, fetchMe]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "glass-panel text-foreground border-card-border",
          style: {
            background: "var(--card)",
            color: "var(--foreground)",
            border: "1px solid var(--card-border)",
            borderRadius: "8px",
          },
        }}
      />
      {children}
    </>
  );
}
