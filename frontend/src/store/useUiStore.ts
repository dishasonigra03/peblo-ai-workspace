import { create } from "zustand";

interface UiState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: "dark", // default to dark mode for modern dark theme first
  sidebarOpen: true,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleTheme: () => {
    const nextTheme = get().theme === "light" ? "dark" : "light";
    set({ theme: nextTheme });
    if (typeof window !== "undefined") {
      localStorage.setItem("peblo_theme", nextTheme);
      const root = window.document.body;
      if (nextTheme === "dark") {
        root.classList.add("dark-theme");
      } else {
        root.classList.remove("dark-theme");
      }
    }
  },

  initTheme: () => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("peblo_theme") as "light" | "dark" | null;
      const themeToUse = savedTheme || "dark"; // Default is dark theme
      set({ theme: themeToUse });
      const root = window.document.body;
      if (themeToUse === "dark") {
        root.classList.add("dark-theme");
      } else {
        root.classList.remove("dark-theme");
      }
    }
  },
}));
