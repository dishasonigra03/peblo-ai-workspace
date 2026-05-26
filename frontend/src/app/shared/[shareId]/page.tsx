"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Calendar, Tag, AlertTriangle, ArrowLeft, Globe } from "lucide-react";
import Link from "next/link";

interface NoteTag {
  id: string;
  name: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  tags: NoteTag[];
}

export default function SharedNotePage() {
  const params = useParams();
  const shareId = params.shareId as string;

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedNote = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/shared/${shareId}`);
        setNote(response.data);
      } catch (err: any) {
        const msg = err.response?.data?.detail || "This note could not be retrieved.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedNote();
    }
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-sm text-muted animate-pulse">Loading public note...</span>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center px-6 text-center">
        <div className="glass-panel max-w-md p-8 rounded-2xl flex flex-col items-center shadow-lg border border-red-500/10">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted mb-6 leading-relaxed">
            {error || "This note does not exist, or has been marked private by the author."}
          </p>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-accent-foreground bg-accent hover:bg-accent/90 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to PEBLO
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(note.updated_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-[-25%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-500/5 blur-[130px] pointer-events-none" />

      {/* Reader header */}
      <header className="z-10 border-b border-card-border w-full py-4 px-6 bg-card/60 backdrop-blur-md sticky top-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold tracking-wider text-muted uppercase">
              Public Note Viewer
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-card-border hover:bg-card-border/30 rounded-xl text-xs font-semibold text-foreground transition-all cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" />
            Create Your Own
          </Link>
        </div>
      </header>

      {/* Main Content Reader */}
      <main className="z-10 flex-grow max-w-4xl w-full mx-auto px-6 py-12">
        <article className="glass-panel p-8 md:p-12 rounded-3xl shadow-sm border border-card-border">
          {/* Note Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight">
            {note.title}
          </h1>

          {/* Note Metadata */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted pb-6 mb-8 border-b border-card-border">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span>Updated {formattedDate}</span>
            </div>
            {note.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 ml-0 md:ml-4">
                <Tag className="h-3.5 w-3.5 text-indigo-400" />
                {note.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/10"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Render Markdown Content */}
          <div className="markdown-body text-foreground">
            {note.content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
            ) : (
              <p className="text-muted italic">This note is empty.</p>
            )}
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="z-10 py-8 border-t border-card-border text-center text-[10px] text-muted">
        Shared via <span className="font-bold text-foreground">PEBLO AI Notes Workspace</span>
      </footer>
    </div>
  );
}
