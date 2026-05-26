import { create } from "zustand";
import api from "@/utils/api";

export interface Tag {
  id: string;
  name: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  is_archived: boolean;
  is_pinned: boolean;
  is_public: boolean;
  share_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface AIGeneration {
  id: string;
  note_id: string;
  summary: string;
  action_items: string[];
  suggested_title: string;
  created_at: string;
}

interface NotesState {
  notes: Note[];
  activeNote: Note | null;
  loading: boolean;
  saving: boolean;
  searchQuery: string;
  selectedTag: string | null;
  isArchivedView: boolean;
  aiLoading: boolean;
  aiResult: AIGeneration | null;
  fetchNotes: () => Promise<void>;
  fetchNoteById: (id: string) => Promise<Note | null>;
  createNote: (title?: string, content?: string, tags?: string[]) => Promise<Note | null>;
  updateNote: (id: string, fields: Partial<Omit<Note, "tags"> & { tags: string[] }>) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;
  generateAISummary: (id: string) => Promise<AIGeneration | null>;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string | null) => void;
  setIsArchivedView: (archived: boolean) => void;
  setActiveNote: (note: Note | null) => void;
  clearAIResult: () => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  activeNote: null,
  loading: false,
  saving: false,
  searchQuery: "",
  selectedTag: null,
  isArchivedView: false,
  aiLoading: false,
  aiResult: null,

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchNotes();
  },

  setSelectedTag: (tag) => {
    set({ selectedTag: tag });
    get().fetchNotes();
  },

  setIsArchivedView: (archived) => {
    set({ isArchivedView: archived, selectedTag: null }); // Clear selected tag when toggling archive
    get().fetchNotes();
  },

  setActiveNote: (note) => {
    set({ activeNote: note, aiResult: null });
  },

  clearAIResult: () => set({ aiResult: null }),

  fetchNotes: async () => {
    set({ loading: true });
    try {
      const { searchQuery, selectedTag, isArchivedView } = get();
      const params: any = {
        is_archived: isArchivedView,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery;
      }
      if (selectedTag) {
        params.tag = selectedTag;
      }
      const response = await api.get("/notes", { params });
      set({ notes: response.data, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  fetchNoteById: async (id) => {
    set({ loading: true });
    try {
      const response = await api.get(`/notes/${id}`);
      set({ activeNote: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({ loading: false });
      return null;
    }
  },

  createNote: async (title = "Untitled Note", content = "", tags = []) => {
    set({ loading: true });
    try {
      const response = await api.post("/notes", { title, content, tags });
      const newNote = response.data;
      set((state) => ({
        notes: [newNote, ...state.notes],
        activeNote: newNote,
        loading: false,
      }));
      return newNote;
    } catch (err) {
      set({ loading: false });
      return null;
    }
  },

  updateNote: async (id, fields) => {
    set({ saving: true });
    try {
      const response = await api.patch(`/notes/${id}`, fields);
      const updatedNote = response.data;
      
      set((state) => {
        const updatedNotes = state.notes.map((n) => (n.id === id ? updatedNote : n));
        
        // Re-sort notes in memory to maintain order: pinned first, then updated_at descending
        const sortedNotes = [...updatedNotes].sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) {
            return a.is_pinned ? -1 : 1;
          }
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });

        return {
          notes: sortedNotes,
          activeNote: state.activeNote?.id === id ? updatedNote : state.activeNote,
          saving: false,
        };
      });
      return updatedNote;
    } catch (err) {
      set({ saving: false });
      return null;
    }
  },

  deleteNote: async (id) => {
    set({ loading: true });
    try {
      await api.delete(`/notes/${id}`);
      set((state) => {
        const updatedNotes = state.notes.filter((n) => n.id !== id);
        const nextActive = state.activeNote?.id === id ? null : state.activeNote;
        return {
          notes: updatedNotes,
          activeNote: nextActive,
          loading: false,
        };
      });
      return true;
    } catch (err) {
      set({ loading: false });
      return false;
    }
  },

  generateAISummary: async (id) => {
    set({ aiLoading: true, aiResult: null });
    try {
      const response = await api.post(`/notes/${id}/generate-summary`);
      set({ aiResult: response.data, aiLoading: false });
      return response.data;
    } catch (err) {
      set({ aiLoading: false });
      return null;
    }
  },
}));
