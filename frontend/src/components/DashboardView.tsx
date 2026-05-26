"use client";

import React, { useEffect, useState } from "react";
import api from "@/utils/api";
import { FileText, Sparkles, Tag, BarChart3, Clock, ArrowRight, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { Note } from "@/store/useNotesStore";

// Dynamically import Recharts to prevent server-side rendering (SSR) window errors
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const AreaChart = dynamic(() => import("recharts").then((mod) => mod.AreaChart), {
  ssr: false,
});
const Area = dynamic(() => import("recharts").then((mod) => mod.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false,
});

interface TagStat {
  name: string;
  count: number;
}

interface ActivityStat {
  date: string;
  count: number;
}

interface AnalyticsData {
  total_notes: number;
  recently_edited: Note[];
  most_used_tags: TagStat[];
  ai_usage_count: number;
  weekly_activity: ActivityStat[];
}

interface DashboardViewProps {
  onSelectNote: (note: Note) => void;
  setCurrentTab: (tab: "dashboard" | "workspace") => void;
}

export default function DashboardView({ onSelectNote, setCurrentTab }: DashboardViewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/dashboard/analytics");
        setData(response.data);
      } catch (err: any) {
        setError("Failed to fetch analytics statistics.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleEditNote = (note: Note) => {
    onSelectNote(note);
    setCurrentTab("workspace");
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-accent animate-spin" />
          <span className="text-sm text-muted animate-pulse">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 text-center">
        <div className="glass-panel max-w-sm p-6 rounded-2xl border border-red-500/10 text-red-500">
          <p className="text-sm">{error || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  // Format activity data date labels for chart: YYYY-MM-DD -> MMM DD (e.g. May 26)
  const chartData = data.weekly_activity.map((item) => {
    const date = new Date(item.date);
    const dayLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    return {
      date: dayLabel,
      activity: item.count,
    };
  });

  return (
    <div className="flex-grow overflow-y-auto px-6 py-8 md:px-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Productivity Analytics
          </h1>
          <p className="text-sm text-muted">
            Workspace summary, tags distribution, and document activity statistics.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card 1: Total Notes */}
          <div className="glass-panel p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total Notes</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{data.total_notes}</h3>
            </div>
          </div>

          {/* Card 2: AI Usage */}
          <div className="glass-panel p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">AI Insights</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{data.ai_usage_count}</h3>
            </div>
          </div>

          {/* Card 3: Active Tags */}
          <div className="glass-panel p-6 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-fuchsia-500/10 text-fuchsia-400 rounded-xl">
              <Tag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Unique Tags</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{data.most_used_tags.length}</h3>
            </div>
          </div>
        </div>

        {/* Middle row: Activity Chart + Tags distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Chart Card */}
          <div className="glass-panel p-6 rounded-2xl shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-base font-bold text-foreground">Weekly Activity Summary</h3>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="var(--muted)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--card-border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="activity"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorActivity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tag Breakdown Card */}
          <div className="glass-panel p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Tag className="h-4.5 w-4.5 text-violet-400" />
                <h3 className="text-base font-bold text-foreground">Most Used Tags</h3>
              </div>
              {data.most_used_tags.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-muted">No tags defined yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.most_used_tags.map((tag) => {
                    const maxCount = Math.max(...data.most_used_tags.map((t) => t.count), 1);
                    const percentage = (tag.count / maxCount) * 100;
                    return (
                      <div key={tag.name} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-foreground">{tag.name}</span>
                          <span className="text-muted">{tag.count} notes</span>
                        </div>
                        <div className="w-full bg-card-border/30 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row: Recently Edited Notes */}
        <div className="glass-panel p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-fuchsia-400" />
              <h3 className="text-base font-bold text-foreground">Recently Edited Notes</h3>
            </div>
          </div>
          {data.recently_edited.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-muted">No notes found. Create your first note to start writing!</p>
            </div>
          ) : (
            <div className="divide-y divide-card-border/50">
              {data.recently_edited.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleEditNote(note)}
                  className="py-3 flex items-center justify-between hover:bg-card-border/10 px-2 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex-grow min-w-0 pr-4">
                    <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors truncate">
                      {note.title}
                    </p>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {note.content.substring(0, 100) || "Empty note"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:flex gap-1">
                      {note.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-card-border/30 text-muted"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
