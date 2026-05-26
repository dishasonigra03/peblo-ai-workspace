"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotesStore, Note } from "@/store/useNotesStore";
import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import WorkspaceView from "@/components/WorkspaceView";
import { Loader2 } from "lucide-react";

export default function NotesPage() {
  const router = useRouter();
  const { token, initialized } = useAuthStore();
  const { setActiveNote } = useNotesStore();
  const [currentTab, setCurrentTab] = useState<"dashboard" | "workspace">("workspace");

  useEffect(() => {
    // Redirect unauthenticated user to login once session is initialized
    if (initialized && !token) {
      router.push("/login");
    }
  }, [token, initialized, router]);

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setCurrentTab("workspace");
  };

  // Wait for session hydration from localStorage
  if (!initialized || (initialized && !token)) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-accent animate-spin" />
          <span className="text-sm text-muted animate-pulse">Initializing PEBLO workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* App Navigation Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Workspace Frame */}
      <main className="flex-grow flex flex-col h-full overflow-hidden relative">
        {currentTab === "dashboard" ? (
          <DashboardView onSelectNote={handleSelectNote} setCurrentTab={setCurrentTab} />
        ) : (
          <WorkspaceView />
        )}
      </main>
    </div>
  );
}
