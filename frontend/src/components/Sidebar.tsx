"use client";

import React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotesStore } from "@/store/useNotesStore";
import { useUiStore } from "@/store/useUiStore";
import {
  FileText,
  BarChart3,
  Search,
  Archive,
  Tag as TagIcon,
  Sun,
  Moon,
  LogOut,
  FolderOpen,
  X,
  Menu,
} from "lucide-react";

interface SidebarProps {
  currentTab: "dashboard" | "workspace";
  setCurrentTab: (tab: "dashboard" | "workspace") => void;
}

export default function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen } = useUiStore();
  const {
    notes,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    isArchivedView,
    setIsArchivedView,
  } = useNotesStore();

  // Compute unique tag list from all notes in memory
  const allTags = Array.from(
    new Set(notes.flatMap((note) => note.tags.map((tag) => tag.name)))
  ).sort();

  return (
    <>
      {/* Mobile Sidebar Menu Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-card-border rounded-xl text-foreground cursor-pointer shadow-md"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static top-0 left-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar px-4 py-6 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0`}
      >
        <div className="space-y-6 overflow-y-auto pr-1">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 px-2">
            <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-lg shadow-md">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              PEBLO
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => {
                setCurrentTab("dashboard");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                currentTab === "dashboard"
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:bg-card-border/20 hover:text-foreground"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentTab("workspace");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                currentTab === "workspace"
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:bg-card-border/20 hover:text-foreground"
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              Notes Workspace
            </button>
          </nav>

          <hr className="border-sidebar-border" />

          {/* Search Inputs */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted px-2">
              Search & Filters
            </label>
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-card-border rounded-xl bg-card text-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>

          {/* View Selection: Active vs Archive */}
          <div className="space-y-1.5">
            <button
              onClick={() => setIsArchivedView(false)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !isArchivedView
                  ? "bg-card border border-card-border text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Active Notes
              </span>
            </button>
            <button
              onClick={() => setIsArchivedView(true)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isArchivedView
                  ? "bg-card border border-card-border text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Archive className="h-3.5 w-3.5" />
                Archived Notes
              </span>
            </button>
          </div>

          {/* Tags List */}
          {allTags.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted px-2 flex items-center justify-between">
                <span>Tags</span>
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-[9px] lowercase text-accent hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </label>
              <div className="space-y-1">
                {allTags.map((tagName) => (
                  <button
                    key={tagName}
                    onClick={() =>
                      setSelectedTag(selectedTag === tagName ? null : tagName)
                    }
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-all text-left cursor-pointer ${
                      selectedTag === tagName
                        ? "bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/10"
                        : "text-muted hover:text-foreground hover:bg-card-border/10 border border-transparent"
                    }`}
                  >
                    <TagIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{tagName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User profile details & toggles */}
        <div className="space-y-4 pt-4 border-t border-sidebar-border">
          {/* User profile card */}
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center font-bold text-sm text-white uppercase shadow-sm">
              {user?.name?.slice(0, 2) || "US"}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-muted truncate">{user?.email}</p>
            </div>
          </div>

          {/* Settings actions */}
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              onClick={toggleTheme}
              className="p-2 border border-card-border rounded-xl bg-card hover:bg-card-border/20 text-foreground cursor-pointer transition-all flex items-center justify-center grow gap-1.5 text-xs font-semibold"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-yellow-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Dark</span>
                </>
              )}
            </button>

            <button
              onClick={logout}
              className="p-2 border border-card-border rounded-xl bg-card hover:bg-red-500/10 hover:text-red-500 text-muted cursor-pointer transition-all flex items-center justify-center grow gap-1.5 text-xs font-semibold"
              title="Logout session"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
