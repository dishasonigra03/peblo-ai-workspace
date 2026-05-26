"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { FileText, Sparkles, Share2, BarChart3, Search, Shield, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-background min-h-screen relative overflow-hidden flex flex-col justify-between">
      {/* Background radial glow */}
      <div className="absolute top-[-25%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-500/10 blur-[130px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            PEBLO
          </span>
        </div>
        <nav className="flex items-center gap-4">
          {mounted && token ? (
            <>
              <span className="text-sm text-muted hidden md:inline">Logged in as {user?.name}</span>
              <Link
                href="/notes"
                className="px-4 py-2 text-sm font-semibold rounded-xl text-accent-foreground bg-accent hover:bg-accent/90 transition-all cursor-pointer"
              >
                Open Workspace
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-muted hover:text-foreground transition-all">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-semibold rounded-xl text-accent-foreground bg-accent hover:bg-accent/90 transition-all cursor-pointer"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="z-10 flex-grow flex flex-col justify-center items-center px-6 py-12 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by Gemini 1.5 Flash
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
          The AI-Powered Workspace for{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Your Thoughts and Notes
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-muted max-w-2xl mb-10 leading-relaxed">
          Create beautiful documents, organize ideas with intuitive tags, generate instant summaries, extract action items, and share public links in seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            href={mounted && token ? "/notes" : "/signup"}
            className="px-8 py-3.5 text-base font-semibold rounded-xl text-accent-foreground bg-accent hover:bg-accent/90 shadow-lg shadow-accent/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {mounted && token ? "Go to Notes" : "Start Writing Free"}
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 text-base font-semibold rounded-xl text-foreground bg-card border border-card-border hover:bg-card-border/30 transition-all cursor-pointer"
          >
            Sign In to Workspace
          </Link>
        </div>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="glass-panel p-6 rounded-2xl shadow-sm hover:translate-y-[-2px] transition-all duration-300">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Gemini AI Assistant</h3>
            <p className="text-sm text-muted leading-relaxed">
              Summarize articles, extract key items checklist, and receive suggested note titles automatically using Google Gemini.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl shadow-sm hover:translate-y-[-2px] transition-all duration-300">
            <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl w-fit mb-4">
              <Share2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Instant Public Sharing</h3>
            <p className="text-sm text-muted leading-relaxed">
              Generate unique, private share keys to publish notes to the web instantly. Revoke access with a single click.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl shadow-sm hover:translate-y-[-2px] transition-all duration-300">
            <div className="p-3 bg-fuchsia-500/10 text-fuchsia-400 rounded-xl w-fit mb-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Insights Dashboard</h3>
            <p className="text-sm text-muted leading-relaxed">
              Track total documents, most frequently used tags, total AI generations count, and weekly activity charts.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="z-10 py-8 border-t border-card-border w-full max-w-7xl mx-auto px-6 text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} PEBLO. Built for the PEBLO Full Stack Developer Challenge. All rights reserved.
      </footer>
    </div>
  );
}
