"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Plus, ChevronRight, SearchSlash } from "lucide-react";

interface Investigation {
  investigationId: string;
  title: string;
  createdBy: string;
  createdAt: string;
  pinnedTimestamps: unknown[];
  annotations: unknown[];
}

export default function InvestigatePage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/chronos/investigate")
      .then((r) => r.json())
      .then((data) => setInvestigations(data.items || []))
      .catch(() => setInvestigations([]))
      .finally(() => setLoading(false));
  }, []);

  const createInvestigation = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/chronos/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      const data = await res.json();
      setInvestigations((prev) => [data, ...prev]);
      setNewTitle("");
      setShowCreate(false);
    } catch {}
    setCreating(false);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex-shrink-0">
        <h1 className="text-[16px] font-semibold dark:text-white">Investigations</h1>
        <LiquidButton size="sm" variant="default" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 text-[#b8c4ff]" />
          <span className="text-[12px] text-white/70">New</span>
        </LiquidButton>
      </header>

      <div className="p-6 space-y-4">
        {showCreate && (
          <GlassCard className="!border-[#b8c4ff]/15">
            <div className="flex gap-3">
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Investigation title..." className="flex-1 px-3 py-2 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none focus:border-[#b8c4ff]/30 text-white placeholder:text-white/20" onKeyDown={(e) => e.key === "Enter" && createInvestigation()} />
              <LiquidButton size="default" variant="default" onClick={createInvestigation} disabled={creating}>
                <span className="text-[13px] text-white/70">{creating ? "Creating..." : "Create"}</span>
              </LiquidButton>
            </div>
          </GlassCard>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined text-[40px] text-white/20 animate-spin">progress_activity</span>
          </div>
        ) : investigations.length === 0 ? (
          <div className="text-center py-12">
            <SearchSlash className="w-12 h-12 text-white/15 mx-auto mb-3" />
            <p className="text-[16px] text-white/40">No investigations yet</p>
            <p className="text-[13px] text-white/20 mt-1">Create one to start pinning timestamps and collaborating</p>
          </div>
        ) : (
          investigations.map((inv) => (
            <Link key={inv.investigationId} href={`/dashboard/investigate/${inv.investigationId}`}>
              <GlassCard className="cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[16px] font-semibold text-white mb-1">{inv.title}</h3>
                    <div className="flex items-center gap-4 text-[12px] font-mono text-white/30">
                      <span>by {inv.createdBy}</span>
                      <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                      <span>{inv.pinnedTimestamps.length} pinned</span>
                      <span>{inv.annotations.length} notes</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </GlassCard>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
