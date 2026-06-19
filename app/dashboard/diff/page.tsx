"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { GitCompare } from "lucide-react";

interface DiffChange {
  path: string;
  type: "addition" | "deletion" | "modification";
  before?: unknown;
  after?: unknown;
}

export default function DiffPage() {
  return <Suspense><DiffPageInner /></Suspense>;
}

function DiffPageInner() {
  const searchParams = useSearchParams();
  const [entityId, setEntityId] = useState(searchParams.get("entityId") || "");
  const [t1, setT1] = useState("");
  const [t2, setT2] = useState("");
  const [diff, setDiff] = useState<DiffChange[]>([]);
  const [stateBefore, setStateBefore] = useState<Record<string, unknown> | null>(null);
  const [stateAfter, setStateAfter] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runDiff = useCallback(async () => {
    if (!entityId || !t1 || !t2) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");
    try {
      const [diffRes, s1Res, s2Res] = await Promise.all([
        fetch(`/api/chronos/diff?entityId=${entityId}&t1=${encodeURIComponent(t1)}&t2=${encodeURIComponent(t2)}`),
        fetch(`/api/chronos/state?entityId=${entityId}&timestamp=${encodeURIComponent(t1)}`),
        fetch(`/api/chronos/state?entityId=${entityId}&timestamp=${encodeURIComponent(t2)}`),
      ]);
      const diffData = await diffRes.json();
      const s1 = await s1Res.json();
      const s2 = await s2Res.json();
      if (diffData.error) throw new Error(diffData.error);
      setDiff(diffData.diff || []);
      setStateBefore(s1.state || null);
      setStateAfter(s2.state || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to compute diff");
    }
    setLoading(false);
  }, [entityId, t1, t2]);

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center px-6 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex-shrink-0">
        <h1 className="text-[16px] font-semibold dark:text-white">Diff Viewer</h1>
      </header>

      <div className="p-6 space-y-6">
        <GlassCard>
          <h2 className="text-[13px] font-semibold text-white mb-4">Compare Two Points in Time</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1.5 block">Entity ID</label>
              <input type="text" value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="e.g. user_001" className="w-full px-3 py-2 text-[13px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none focus:border-[#b8c4ff]/30 text-white placeholder:text-white/20" />
            </div>
            <div>
              <label className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1.5 block">Timestamp 1 (Before)</label>
              <input type="datetime-local" value={t1} onChange={(e) => setT1(new Date(e.target.value).toISOString())} className="w-full px-3 py-2 text-[13px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none focus:border-[#b8c4ff]/30 text-white" />
            </div>
            <div>
              <label className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1.5 block">Timestamp 2 (After)</label>
              <input type="datetime-local" value={t2} onChange={(e) => setT2(new Date(e.target.value).toISOString())} className="w-full px-3 py-2 text-[13px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none focus:border-[#b8c4ff]/30 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <LiquidButton size="default" variant="default" onClick={runDiff} disabled={loading}>
              <GitCompare className="w-4 h-4 text-[#b8c4ff]" />
              <span className="text-[13px] text-white/70">{loading ? "Computing..." : "Compute Diff"}</span>
            </LiquidButton>
            {error && <span className="text-[13px] text-red-400">{error}</span>}
          </div>
        </GlassCard>

        {diff.length > 0 && (
          <GlassCard noPadding>
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-white">{diff.length} Change{diff.length !== 1 ? "s" : ""} Detected</h3>
              <div className="flex gap-3 text-[11px] font-mono">
                <span className="text-emerald-400">+{diff.filter((d) => d.type === "addition").length}</span>
                <span className="text-red-400">-{diff.filter((d) => d.type === "deletion").length}</span>
                <span className="text-amber-400">~{diff.filter((d) => d.type === "modification").length}</span>
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {diff.map((change, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                      change.type === "addition" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                      change.type === "deletion" ? "bg-red-500/20 text-red-400 border-red-500/20" :
                      "bg-amber-500/20 text-amber-400 border-amber-500/20"
                    }`}>{change.type.toUpperCase()}</span>
                    <span className="text-[13px] font-mono font-medium text-white">{change.path}</span>
                  </div>
                  <div className="flex gap-4 text-[12px] font-mono">
                    {change.before !== undefined && (
                      <div className="flex-1 bg-red-500/5 border border-red-500/10 rounded-xl p-2 text-red-400">- {JSON.stringify(change.before)}</div>
                    )}
                    {change.after !== undefined && (
                      <div className="flex-1 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2 text-emerald-400">+ {JSON.stringify(change.after)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {(stateBefore || stateAfter) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard noPadding>
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />State at T1
                </h3>
              </div>
              <pre className="p-5 text-[12px] font-mono overflow-x-auto text-white/60">{JSON.stringify(stateBefore, null, 2)}</pre>
            </GlassCard>
            <GlassCard noPadding>
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />State at T2
                </h3>
              </div>
              <pre className="p-5 text-[12px] font-mono overflow-x-auto text-white/60">{JSON.stringify(stateAfter, null, 2)}</pre>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
