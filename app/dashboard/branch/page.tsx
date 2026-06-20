"use client";

import { useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { GitFork } from "lucide-react";

interface DiffChange {
  path: string;
  type: "addition" | "deletion" | "modification";
  before?: unknown;
  after?: unknown;
}

interface BranchResult {
  entityId: string;
  forkTimestamp: string;
  hypotheticalState: Record<string, unknown>;
  actualState: Record<string, unknown>;
  diff: DiffChange[];
}

export default function BranchPage() {
  const [entityId, setEntityId] = useState("");
  const [forkTimestamp, setForkTimestamp] = useState("");
  const [omitEventIds, setOmitEventIds] = useState("");
  const [syntheticJson, setSyntheticJson] = useState("");
  const [result, setResult] = useState<BranchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runBranch = useCallback(async () => {
    if (!entityId || !forkTimestamp) { setError("Entity ID and fork timestamp are required"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      let syntheticEvents;
      if (syntheticJson.trim()) syntheticEvents = JSON.parse(syntheticJson);
      const res = await fetch("/api/chronos/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId, forkTimestamp: new Date(forkTimestamp).toISOString(),
          omitEventIds: omitEventIds ? omitEventIds.split(",").map((s) => s.trim()) : undefined,
          syntheticEvents,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to branch reality"); }
    setLoading(false);
  }, [entityId, forkTimestamp, omitEventIds, syntheticJson]);

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center px-6 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex-shrink-0">
        <h1 className="text-[16px] font-semibold text-white flex items-center gap-2">
          <GitFork className="w-5 h-5 text-[#b8c4ff]" />
          Branch Reality
        </h1>
      </header>

      <div className="p-6 space-y-6">
        <GlassCard className="!border-violet-500/15 !shadow-[0_0_30px_rgba(139,92,246,0.08)]">
          <h2 className="text-[14px] font-semibold text-white mb-2">What-If Analysis</h2>
          <p className="text-[13px] text-white/50 leading-relaxed">
            Fork an entity&apos;s history at any point. Remove events that happened, inject synthetic ones, and see what the state would have been — without writing anything to the database.
          </p>
        </GlassCard>

        <GlassCard>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1.5 block">Entity ID</label>
                <input type="text" value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="e.g. user_001" className="w-full px-3 py-2 text-[13px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none focus:border-[#b8c4ff]/30 text-white placeholder:text-white/20" />
              </div>
              <div>
                <label className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1.5 block">Fork At</label>
                <input type="datetime-local" value={forkTimestamp} onChange={(e) => setForkTimestamp(e.target.value)} className="w-full px-3 py-2 text-[13px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none focus:border-[#b8c4ff]/30 text-white" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1.5 block">Omit Event IDs <span className="opacity-50">(comma-separated)</span></label>
              <input type="text" value={omitEventIds} onChange={(e) => setOmitEventIds(e.target.value)} placeholder="event_abc, event_def" className="w-full px-3 py-2 text-[13px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none focus:border-[#b8c4ff]/30 text-white placeholder:text-white/20" />
            </div>
            <div>
              <label className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1.5 block">Synthetic Events <span className="opacity-50">(JSON array)</span></label>
              <textarea value={syntheticJson} onChange={(e) => setSyntheticJson(e.target.value)} rows={4} className="w-full px-3 py-2 text-[13px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none focus:border-[#b8c4ff]/30 text-white resize-y placeholder:text-white/20" placeholder='[{"eventType":"UPDATE","timestamp":"...","payload":{...}}]' />
            </div>
            <div className="flex items-center gap-3">
              <LiquidButton size="default" variant="default" onClick={runBranch} disabled={loading}>
                <GitFork className="w-4 h-4 text-[#b8c4ff]" />
                <span className="text-[13px] text-white/70">{loading ? "Branching..." : "Branch Reality"}</span>
              </LiquidButton>
              {error && <span className="text-[13px] text-red-400">{error}</span>}
            </div>
          </div>
        </GlassCard>

        {result && (
          <div className="space-y-4">
            <h3 className="text-[14px] font-semibold text-white">{result.diff.length} difference{result.diff.length !== 1 ? "s" : ""} detected</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard noPadding>
                <div className="px-5 py-3 border-b border-white/[0.06]">
                  <h4 className="text-[13px] font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />Actual State
                  </h4>
                </div>
                <pre className="p-4 text-[12px] font-mono overflow-x-auto text-white/60">{JSON.stringify(result.actualState, null, 2)}</pre>
              </GlassCard>
              <GlassCard noPadding className="!border-violet-500/15">
                <div className="px-5 py-3 border-b border-violet-500/10">
                  <h4 className="text-[13px] font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />Hypothetical State
                  </h4>
                </div>
                <pre className="p-4 text-[12px] font-mono overflow-x-auto text-white/60">{JSON.stringify(result.hypotheticalState, null, 2)}</pre>
              </GlassCard>
            </div>

            {result.diff.length > 0 && (
              <GlassCard noPadding>
                <div className="px-5 py-3 border-b border-white/[0.06]">
                  <h4 className="text-[13px] font-semibold text-white">Differences</h4>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {result.diff.map((change, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-4">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                        change.type === "addition" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                        change.type === "deletion" ? "bg-red-500/20 text-red-400 border-red-500/20" :
                        "bg-amber-500/20 text-amber-400 border-amber-500/20"
                      }`}>{change.type.toUpperCase()}</span>
                      <span className="text-[13px] font-mono text-white/70">{change.path}</span>
                      {change.before !== undefined && <span className="text-[12px] font-mono text-red-400">was: {JSON.stringify(change.before)}</span>}
                      {change.after !== undefined && <span className="text-[12px] font-mono text-emerald-400">now: {JSON.stringify(change.after)}</span>}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
