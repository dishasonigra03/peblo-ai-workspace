"use client";

import React, { useState, useEffect, useRef } from "react";
import { useNotesStore, Note } from "@/store/useNotesStore";
import {
  Pin,
  Archive,
  Trash2,
  Share2,
  Sparkles,
  Tag as TagIcon,
  X,
  Plus,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Check,
  Globe,
  Copy,
  Eye,
  Edit,
  Columns,
  Loader2,
  PlusCircle,
  FileText,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";

export default function WorkspaceView() {
  const {
    notes,
    activeNote,
    loading,
    saving,
    fetchNotes,
    setActiveNote,
    createNote,
    updateNote,
    deleteNote,
    generateAISummary,
    aiLoading,
    aiResult,
    clearAIResult,
    isArchivedView,
    searchQuery,
    selectedTag,
  } = useNotesStore();

  // Local editor state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newTag, setNewTag] = useState("");
  const [editMode, setEditMode] = useState<"edit" | "preview" | "split">("split");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // References to prevent infinite loops during saving
  const lastSavedTitle = useRef("");
  const lastSavedContent = useRef("");

  // Load all notes on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Sync editor with selected note
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      lastSavedTitle.current = activeNote.title;
      lastSavedContent.current = activeNote.content;
      setShowShareModal(false);
    } else {
      setTitle("");
      setContent("");
      setShowShareModal(false);
      setShowAiPanel(false);
    }
  }, [activeNote?.id]);

  // Debounced auto-save logic
  useEffect(() => {
    if (!activeNote) return;

    // Check if changes exist compared to what we last saved
    if (title === lastSavedTitle.current && content === lastSavedContent.current) {
      return;
    }

    const timer = setTimeout(async () => {
      lastSavedTitle.current = title;
      lastSavedContent.current = content;
      await updateNote(activeNote.id, { title, content });
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [title, content, activeNote?.id, updateNote]);

  const handleCreateNote = async () => {
    const newNote = await createNote("Untitled Note", "", selectedTag ? [selectedTag] : []);
    if (newNote) {
      toast.success("Note created successfully!");
    } else {
      toast.error("Failed to create note.");
    }
  };

  const handleDelete = async (noteId: string) => {
    if (confirm("Are you sure you want to permanently delete this note?")) {
      const success = await deleteNote(noteId);
      if (success) {
        toast.success("Note deleted.");
      } else {
        toast.error("Failed to delete note.");
      }
    }
  };

  const handleTogglePin = async () => {
    if (!activeNote) return;
    const nextPinState = !activeNote.is_pinned;
    const updated = await updateNote(activeNote.id, { is_pinned: nextPinState });
    if (updated) {
      toast.success(nextPinState ? "Note pinned to top." : "Note unpinned.");
    }
  };

  const handleToggleArchive = async () => {
    if (!activeNote) return;
    const nextArchiveState = !activeNote.is_archived;
    const updated = await updateNote(activeNote.id, { is_archived: nextArchiveState });
    if (updated) {
      toast.success(nextArchiveState ? "Note moved to archive." : "Note restored from archive.");
      // Unselect note since it leaves the current filter view
      setActiveNote(null);
    }
  };

  const handleToggleShare = async () => {
    if (!activeNote) return;
    const nextPublicState = !activeNote.is_public;
    const updated = await updateNote(activeNote.id, { is_public: nextPublicState });
    if (updated) {
      toast.success(nextPublicState ? "Note is now public." : "Note is now private.");
    }
  };

  const handleCopyShareLink = () => {
    if (!activeNote?.share_id) return;
    const shareUrl = `${window.location.origin}/shared/${activeNote.share_id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Public link copied to clipboard!");
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote || !newTag.trim()) return;

    const tagToAdd = newTag.trim().toLowerCase();
    const currentTagNames = activeNote.tags.map((t) => t.name);

    if (currentTagNames.includes(tagToAdd)) {
      setNewTag("");
      return;
    }

    const updatedTags = [...currentTagNames, tagToAdd];
    const updated = await updateNote(activeNote.id, { tags: updatedTags });
    if (updated) {
      setNewTag("");
      toast.success(`Tag #${tagToAdd} added.`);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!activeNote) return;
    const currentTagNames = activeNote.tags.map((t) => t.name);
    const updatedTags = currentTagNames.filter((t) => t !== tagToRemove);
    const updated = await updateNote(activeNote.id, { tags: updatedTags });
    if (updated) {
      toast.success(`Tag #${tagToRemove} removed.`);
    }
  };

  const handleTriggerAI = async () => {
    if (!activeNote) return;
    if (!content.trim()) {
      toast.error("Please add content to the note first so the AI can summarize it.");
      return;
    }
    setShowAiPanel(true);
    toast.loading("Generating AI insights...", { id: "ai-toast" });
    const result = await generateAISummary(activeNote.id);
    if (result) {
      toast.success("AI insights loaded successfully!", { id: "ai-toast" });
    } else {
      toast.error("Failed to generate AI insights.", { id: "ai-toast" });
    }
  };

  const handleApplyAITitle = async () => {
    if (!activeNote || !aiResult?.suggested_title) return;
    setTitle(aiResult.suggested_title);
    // Explicit save trigger
    lastSavedTitle.current = aiResult.suggested_title;
    await updateNote(activeNote.id, { title: aiResult.suggested_title });
    toast.success("AI suggested title applied.");
  };

  const handleInsertAISummary = async () => {
    if (!activeNote || !aiResult?.summary) return;
    const prefixSummary = `> **AI Summary**: ${aiResult.summary}\n\n${content}`;
    setContent(prefixSummary);
    lastSavedContent.current = prefixSummary;
    await updateNote(activeNote.id, { content: prefixSummary });
    toast.success("AI summary prepended to note.");
  };

  const handleInsertAIActionItems = async () => {
    if (!activeNote || !aiResult?.action_items.length) return;
    const checklistStr = aiResult.action_items
      .map((item) => `- [ ] ${item}`)
      .join("\n");
    const suffixChecklist = `${content}\n\n### AI Extracted Actions\n${checklistStr}`;
    setContent(suffixChecklist);
    lastSavedContent.current = suffixChecklist;
    await updateNote(activeNote.id, { content: suffixChecklist });
    toast.success("AI actions appended to note.");
  };

  return (
    <div className="flex-grow flex h-full overflow-hidden relative">
      {/* 1. Middle Column: Notes List */}
      <section className="w-80 border-r border-card-border bg-card/20 flex flex-col shrink-0">
        <div className="p-4 border-b border-card-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <span>{isArchivedView ? "Archived" : "Workspace"}</span>
            <span className="px-2 py-0.5 rounded-full bg-card-border/30 text-[10px] text-muted font-semibold">
              {notes.length}
            </span>
          </h2>
          <button
            onClick={handleCreateNote}
            className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-all cursor-pointer flex items-center justify-center"
            title="Create new note"
          >
            <PlusCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Selected parameters tag alert bar */}
        {selectedTag && (
          <div className="px-4 py-2 bg-indigo-500/5 text-indigo-400 text-xs font-medium border-b border-card-border flex justify-between items-center">
            <span className="truncate">Tag: #{selectedTag}</span>
            <button onClick={() => useNotesStore.getState().setSelectedTag(null)}>
              <X className="h-3 w-3 hover:text-white" />
            </button>
          </div>
        )}

        {/* List items */}
        <div className="flex-grow overflow-y-auto divide-y divide-card-border/40 p-2 space-y-1">
          {loading && notes.length === 0 ? (
            // Skeleton loaders
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 space-y-2.5 animate-pulse">
                <div className="h-4 bg-card-border/30 rounded w-3/4" />
                <div className="h-3 bg-card-border/30 rounded w-5/6" />
                <div className="h-2 bg-card-border/30 rounded w-1/2" />
              </div>
            ))
          ) : notes.length === 0 ? (
            <div className="text-center py-20 px-4">
              <FileText className="h-10 w-10 text-muted mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-muted">No notes found</p>
              <button
                onClick={handleCreateNote}
                className="mt-4 text-xs font-semibold text-accent hover:underline flex items-center gap-1 mx-auto cursor-pointer"
              >
                Create note now
              </button>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setActiveNote(note)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  activeNote?.id === note.id
                    ? "bg-accent/10 border border-accent/20"
                    : "hover:bg-card-border/10 border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <h3 className="text-sm font-bold text-foreground truncate flex-grow">
                    {note.title || "Untitled Note"}
                  </h3>
                  {note.is_pinned && (
                    <Pin className="h-3.5 w-3.5 text-indigo-400 shrink-0 rotate-45" />
                  )}
                </div>
                <p className="text-xs text-muted line-clamp-2 mt-1">
                  {note.content.replace(/[#*`>-]/g, "").substring(0, 80) || "Empty note"}
                </p>
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {note.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.id}
                      className="px-1.5 py-0.5 rounded text-[9px] bg-card-border/40 text-muted font-semibold"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {note.is_public && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 font-semibold flex items-center gap-0.5">
                      <Globe className="h-2 w-2" />
                      public
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 2. Main Area: Editor / Preview */}
      <section className="flex-grow flex flex-col h-full bg-background overflow-hidden">
        {activeNote ? (
          <>
            {/* Metadata Bar & Actions Header */}
            <header className="p-4 border-b border-card-border flex flex-wrap gap-y-3 justify-between items-center bg-card/30">
              <div className="flex items-center gap-3">
                {/* Auto-save notification indicator */}
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  {saving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
                      <span>Saving changes...</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>All changes saved</span>
                    </>
                  )}
                </div>
              </div>

              {/* Toolbar button icons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePin}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    activeNote.is_pinned
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      : "border border-card-border text-muted hover:text-foreground hover:bg-card-border/20"
                  }`}
                  title={activeNote.is_pinned ? "Unpin Note" : "Pin Note"}
                >
                  <Pin className={`h-4 w-4 ${activeNote.is_pinned ? "rotate-45" : ""}`} />
                </button>

                <button
                  onClick={handleToggleArchive}
                  className={`p-2 rounded-xl border border-card-border text-muted hover:text-foreground hover:bg-card-border/20 transition-all cursor-pointer`}
                  title={activeNote.is_archived ? "Restore note" : "Archive Note"}
                >
                  <Archive className="h-4 w-4" />
                </button>

                {/* Sharing trigger */}
                <div className="relative">
                  <button
                    onClick={() => setShowShareModal(!showShareModal)}
                    className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeNote.is_public
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "border border-card-border text-muted hover:text-foreground hover:bg-card-border/20"
                    }`}
                    title="Public share link settings"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="text-xs font-semibold hidden sm:inline">Share</span>
                  </button>

                  {/* Share Popover modal */}
                  {showShareModal && (
                    <div className="absolute right-0 mt-2.5 w-72 glass-panel p-4 rounded-2xl shadow-xl z-50 space-y-3.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-indigo-400" />
                          Share to Web
                        </h4>
                        <button onClick={() => setShowShareModal(false)}>
                          <X className="h-4.5 w-4.5 text-muted hover:text-foreground cursor-pointer" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Public Link Visibility</span>
                        <button
                          onClick={handleToggleShare}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg cursor-pointer transition-all ${
                            activeNote.is_public
                              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                              : "bg-accent text-accent-foreground hover:bg-accent/90"
                          }`}
                        >
                          {activeNote.is_public ? "Revoke Share" : "Publish Note"}
                        </button>
                      </div>

                      {activeNote.is_public && activeNote.share_id && (
                        <div className="space-y-2">
                          <p className="text-[10px] text-muted leading-relaxed">
                            Anyone with this URL can view the rendered note markdown.
                          </p>
                          <div className="flex items-center gap-1.5 bg-card-border/20 p-1.5 rounded-lg border border-card-border">
                            <input
                              type="text"
                              readOnly
                              value={`${window.location.origin}/shared/${activeNote.share_id}`}
                              className="text-[10px] text-foreground bg-transparent select-all focus:outline-none flex-grow truncate px-1"
                            />
                            <button
                              onClick={handleCopyShareLink}
                              className="p-1 text-muted hover:text-foreground hover:bg-card-border/50 rounded transition-all cursor-pointer"
                              title="Copy URL"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Gemini AI assistant button */}
                <button
                  onClick={handleTriggerAI}
                  className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-500/25"
                  title="Generate summaries & checklists"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-semibold hidden sm:inline">AI Analysis</span>
                </button>

                <hr className="h-5 border-l border-card-border mx-1" />

                <button
                  onClick={() => handleDelete(activeNote.id)}
                  className="p-2 border border-card-border text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                  title="Delete Note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* Note Title Input */}
            <div className="px-6 pt-4 shrink-0 bg-background">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Note"
                className="w-full text-2xl font-extrabold text-foreground bg-transparent placeholder-card-border focus:outline-none"
              />
            </div>

            {/* Tags Pills Row */}
            <div className="px-6 py-2 shrink-0 flex flex-wrap items-center gap-2 bg-background border-b border-card-border/50 pb-4">
              <div className="flex items-center gap-1 text-muted text-xs mr-2 font-medium">
                <TagIcon className="h-3.5 w-3.5 text-indigo-400" />
                <span>Tags:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {activeNote.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-card-border/30 text-foreground"
                  >
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.name)}
                      className="text-muted hover:text-red-500 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {/* Add new tag inline form */}
                <form onSubmit={handleAddTag} className="inline-flex">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      className="pl-2 pr-6 py-0.5 border border-card-border/60 rounded-full text-xs bg-transparent text-foreground placeholder-muted w-20 focus:w-28 focus:border-accent focus:outline-none transition-all duration-300"
                    />
                    <button
                      type="submit"
                      className="absolute right-1 text-muted hover:text-accent cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Editor Workspace Mode Tabs */}
            <div className="px-6 py-2 bg-card/10 shrink-0 border-b border-card-border flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 border border-card-border rounded-xl p-0.5 bg-card">
                <button
                  onClick={() => setEditMode("edit")}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                    editMode === "edit" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setEditMode("preview")}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                    editMode === "preview" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => setEditMode("split")}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                    editMode === "split" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                >
                  <Columns className="h-3.5 w-3.5" />
                  Split View
                </button>
              </div>
              <span className="text-[10px] text-muted hidden md:inline">
                Supports Markdown formatting
              </span>
            </div>

            {/* Editor Content split views */}
            <div className="flex-grow flex overflow-hidden">
              {/* Write Side */}
              {(editMode === "edit" || editMode === "split") && (
                <div className={`h-full flex-grow flex flex-col ${editMode === "split" ? "w-1/2 border-r border-card-border" : "w-full"}`}>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start typing your note here (supports Markdown)..."
                    className="flex-grow w-full p-6 text-sm bg-transparent text-foreground placeholder-muted focus:outline-none resize-none overflow-y-auto leading-relaxed font-mono"
                  />
                </div>
              )}

              {/* Render Preview Side */}
              {(editMode === "preview" || editMode === "split") && (
                <div className={`h-full flex-grow overflow-y-auto p-6 bg-card/5 ${editMode === "split" ? "w-1/2" : "w-full"}`}>
                  <div className="markdown-body">
                    {content.trim() ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    ) : (
                      <p className="text-muted italic text-sm">Note content is empty.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty Workspace Onboarding State */
          <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
            <div className="glass-panel max-w-sm p-8 rounded-3xl shadow-sm border border-card-border flex flex-col items-center">
              <div className="p-4 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-3xl shadow-lg shadow-indigo-500/20 text-white mb-6 animate-bounce">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No Note Selected</h3>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                Choose an existing note from the sidebar listing or create a new document to start drafting.
              </p>
              <button
                onClick={handleCreateNote}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-accent text-accent-foreground font-semibold hover:bg-accent/90 cursor-pointer shadow-md shadow-accent/25 transition-all text-sm"
              >
                <Plus className="h-4.5 w-4.5" />
                Create New Note
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. Collapsible AI Insights Panel Drawer */}
      {showAiPanel && activeNote && (
        <aside className="w-80 border-l border-card-border bg-card/90 backdrop-blur-md flex flex-col shrink-0 z-20 shadow-xl transition-all duration-300 absolute right-0 top-0 h-full md:static">
          <div className="p-4 border-b border-card-border flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
              Gemini AI Insights
            </h3>
            <button
              onClick={() => {
                setShowAiPanel(false);
                clearAIResult();
              }}
              className="p-1 hover:bg-card-border/30 rounded-lg text-muted hover:text-foreground cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-6">
            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                <p className="text-xs text-muted animate-pulse">Running Gemini models...</p>
              </div>
            ) : aiResult ? (
              <div className="space-y-6">
                {/* Proposed Title Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Suggested Title</h4>
                  <div className="p-3 bg-card border border-card-border rounded-xl">
                    <p className="text-sm font-bold text-foreground">{aiResult.suggested_title}</p>
                    <button
                      onClick={handleApplyAITitle}
                      className="mt-2 text-xs font-semibold text-accent hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      Apply suggested title
                    </button>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Summary</h4>
                  <div className="p-3 bg-card border border-card-border rounded-xl space-y-2">
                    <p className="text-xs text-foreground leading-relaxed">{aiResult.summary}</p>
                    <button
                      onClick={handleInsertAISummary}
                      className="text-xs font-semibold text-accent hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      Insert summary to note
                    </button>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Action Items</h4>
                  <div className="p-3 bg-card border border-card-border rounded-xl space-y-3">
                    {aiResult.action_items.length === 0 ? (
                      <p className="text-xs text-muted italic">No action items extracted.</p>
                    ) : (
                      <ul className="space-y-2">
                        {aiResult.action_items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-foreground leading-normal">
                            <Check className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {aiResult.action_items.length > 0 && (
                      <button
                        onClick={handleInsertAIActionItems}
                        className="text-xs font-semibold text-accent hover:underline flex items-center gap-0.5 pt-1 border-t border-card-border/50 w-full text-left cursor-pointer"
                      >
                        Append tasks checklist to note
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 px-4">
                <Sparkles className="h-10 w-10 text-muted mx-auto mb-3 opacity-40 animate-pulse" />
                <p className="text-xs text-muted leading-relaxed">
                  Trigger Gemini AI insights from the top panel of your active note workspace to generate summary analysis.
                </p>
                <button
                  onClick={handleTriggerAI}
                  className="mt-5 w-full py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold rounded-xl border border-indigo-500/10 transition-all cursor-pointer"
                >
                  Generate Insights Now
                </button>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
