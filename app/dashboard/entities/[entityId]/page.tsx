"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { ArrowLeft, Sparkles, FileDown, GitCompare } from "lucide-react";

interface TimelineEvent {
  eventId: string;
  entityId: string;
  entityType: string;
  eventType: string;
  timestamp: string;
  sequenceNumber: number;
  payload: { before?: Record<string, unknown>; after?: Record<string, unknown> };
}

interface DiffChange {
  path: string;
  type: "addition" | "deletion" | "modification";
  before?: unknown;
  after?: unknown;
}

export default function EntityDetailPage() {
  const params = useParams();
  const entityId = params.entityId as string;
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [scrubTime, setScrubTime] = useState<string | null>(null);
  const [scrubState, setScrubState] = useState<Record<string, unknown> | null>(null);
  const [diff, setDiff] = useState<DiffChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState("");
  const scrubberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const timelineRes = await fetch(`/api/chronos/timeline?tenantId=playground&entityId=${entityId}&limit=200`);
        const timeline = await timelineRes.json();
        const items = (timeline.items || []).sort((a: TimelineEvent, b: TimelineEvent) => a.timestamp.localeCompare(b.timestamp));
        setEvents(items);
        if (items.length > 0) setSelectedEvent(items[items.length - 1]);
      } catch {}
      setLoading(false);
    }
    load();
  }, [entityId]);

  const handleScrub = useCallback(async (timestamp: string) => {
    setScrubTime(timestamp);
    try {
      const res = await fetch(`/api/chronos/state?entityId=${entityId}&timestamp=${timestamp}`);
      const data = await res.json();
      setScrubState(data.state || null);
    } catch {}
  }, [entityId]);

  const handleDiff = useCallback(async (t1: string, t2: string) => {
    try {
      const res = await fetch(`/api/chronos/diff?entityId=${entityId}&t1=${t1}&t2=${t2}`);
      const data = await res.json();
      setDiff(data.diff || []);
    } catch {}
  }, [entityId]);

  const handleExplain = useCallback(async (event: TimelineEvent) => {
    setExplaining(true);
    setExplanation("");
    try {
      const res = await fetch("/api/chronos/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId, eventId: event.eventId, tenantId: "playground" }),
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            text += line.slice(6);
            setExplanation(text);
          }
        }
      }
    } catch {}
    setExplaining(false);
  }, [entityId]);

  const handleScrubberClick = useCallback((e: React.MouseEvent) => {
    if (!scrubberRef.current || events.length < 2) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(pct * (events.length - 1));
    const ev = events[idx];
    setSelectedEvent(ev);
    handleScrub(ev.timestamp);
  }, [events, handleScrub]);

  const typeColors: Record<string, string> = {
    CREATE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
    UPDATE: "bg-blue-500/20 text-blue-400 border-blue-500/20",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/20",
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="material-symbols-outlined text-[40px] text-white/20 animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/entities" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-[16px] font-mono font-semibold text-white">{entityId}</h1>
          {events[0] && (
            <span className="text-[12px] font-mono text-[#b8c4ff] bg-[#b8c4ff]/10 px-2 py-0.5 rounded-md border border-[#b8c4ff]/10">{events[0].entityType}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/chronos/export?entityId=${entityId}&format=json`}>
            <LiquidButton size="sm" variant="default">
              <FileDown className="w-3 h-3 text-white/60" />
              <span className="text-[11px] font-mono text-white/60">JSON</span>
            </LiquidButton>
          </a>
          <a href={`/api/chronos/export?entityId=${entityId}&format=csv`}>
            <LiquidButton size="sm" variant="default">
              <FileDown className="w-3 h-3 text-white/60" />
              <span className="text-[11px] font-mono text-white/60">CSV</span>
            </LiquidButton>
          </a>
        </div>
      </header>

      {/* Timeline Scrubber */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-[11px] font-mono text-white/30 uppercase tracking-wider">Timeline</span>
          <span className="text-[11px] font-mono text-white/30">{events.length} events</span>
          {scrubTime && (
            <span className="text-[11px] font-mono text-[#b8c4ff] ml-auto">{new Date(scrubTime).toLocaleString()}</span>
          )}
        </div>
        <div ref={scrubberRef} className="relative h-10 cursor-pointer group" onClick={handleScrubberClick}>
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-[2px] bg-white/10 rounded-full" />
          {events.map((ev, i) => {
            const pct = events.length <= 1 ? 50 : (i / (events.length - 1)) * 100;
            const isSelected = selectedEvent?.eventId === ev.eventId;
            const dotColor = ev.eventType === "CREATE" ? "bg-emerald-500" : ev.eventType === "DELETE" ? "bg-red-500" : "bg-blue-500";
            return (
              <button
                key={ev.eventId}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all ${dotColor} ${isSelected ? "w-4 h-4 ring-2 ring-[#b8c4ff] ring-offset-2 ring-offset-zinc-900 z-10 shadow-[0_0_12px_rgba(184,196,255,0.4)]" : "w-2.5 h-2.5 hover:w-3.5 hover:h-3.5 opacity-60 hover:opacity-100"}`}
                style={{ left: `${pct}%` }}
                onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); handleScrub(ev.timestamp); }}
              />
            );
          })}
        </div>
        {events.length >= 2 && (
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-mono text-white/20">{new Date(events[0].timestamp).toLocaleDateString()}</span>
            <span className="text-[10px] font-mono text-white/20">{new Date(events[events.length - 1].timestamp).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Event List */}
        <div className="w-[340px] border-r border-white/[0.06] overflow-y-auto flex-shrink-0 bg-white/[0.01]">
          <div className="p-3">
            {events.map((ev) => (
              <button
                key={ev.eventId}
                onClick={() => { setSelectedEvent(ev); handleScrub(ev.timestamp); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-all ${
                  selectedEvent?.eventId === ev.eventId
                    ? "bg-white/[0.08] border border-white/[0.1] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.05),0_0_12px_rgba(75,102,209,0.08)]"
                    : "hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${typeColors[ev.eventType] || ""}`}>{ev.eventType}</span>
                  <span className="text-[11px] font-mono text-white/30 ml-auto tabular-nums">#{ev.sequenceNumber}</span>
                </div>
                <time className="text-[11px] font-mono text-white/30 tabular-nums">{new Date(ev.timestamp).toLocaleString()}</time>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {selectedEvent && (
            <>
              {/* Event Info */}
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-semibold text-white">Event Details</h3>
                  <LiquidButton size="sm" variant="default" onClick={() => handleExplain(selectedEvent)} disabled={explaining}>
                    <Sparkles className="w-3.5 h-3.5 text-[#b8c4ff]" />
                    <span className="text-[12px] text-white/70">{explaining ? "Thinking..." : "Explain with AI"}</span>
                  </LiquidButton>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div><span className="text-white/30">Event ID:</span> <span className="font-mono text-white/70">{selectedEvent.eventId}</span></div>
                  <div><span className="text-white/30">Type:</span> <span className={`font-mono font-bold ${selectedEvent.eventType === "CREATE" ? "text-emerald-400" : selectedEvent.eventType === "DELETE" ? "text-red-400" : "text-blue-400"}`}>{selectedEvent.eventType}</span></div>
                  <div><span className="text-white/30">Sequence:</span> <span className="font-mono text-white/70">#{selectedEvent.sequenceNumber}</span></div>
                  <div><span className="text-white/30">Timestamp:</span> <span className="font-mono text-white/70">{new Date(selectedEvent.timestamp).toISOString()}</span></div>
                </div>
              </GlassCard>

              {/* AI Explanation */}
              {explanation && (
                <GlassCard className="!border-[#b8c4ff]/15">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#b8c4ff]" />
                    <h3 className="text-[13px] font-semibold text-[#b8c4ff]">AI Explanation</h3>
                  </div>
                  <p className="text-[14px] text-white/60 leading-relaxed whitespace-pre-wrap">{explanation}</p>
                </GlassCard>
              )}

              {/* Payload */}
              <GlassCard noPadding>
                <div className="px-5 py-3 border-b border-white/[0.06]">
                  <h3 className="text-[14px] font-semibold text-white">Payload</h3>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEvent.payload.before && (
                    <div>
                      <span className="text-[11px] font-mono text-red-400 uppercase tracking-wider mb-2 block">Before</span>
                      <pre className="text-[12px] font-mono bg-white/[0.03] p-3 rounded-xl overflow-x-auto text-white/60 border border-white/[0.04]">{JSON.stringify(selectedEvent.payload.before, null, 2)}</pre>
                    </div>
                  )}
                  {selectedEvent.payload.after && (
                    <div>
                      <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider mb-2 block">After</span>
                      <pre className="text-[12px] font-mono bg-white/[0.03] p-3 rounded-xl overflow-x-auto text-white/60 border border-white/[0.04]">{JSON.stringify(selectedEvent.payload.after, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* State at this point */}
              {scrubState && (
                <GlassCard noPadding>
                  <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold text-white">Reconstructed State</h3>
                    <span className="text-[11px] font-mono text-white/30">at {scrubTime && new Date(scrubTime).toLocaleString()}</span>
                  </div>
                  <pre className="p-5 text-[12px] font-mono overflow-x-auto text-white/60">{JSON.stringify(scrubState, null, 2)}</pre>
                </GlassCard>
              )}

              {/* Quick Diff */}
              {events.length >= 2 && selectedEvent && (
                <div className="flex items-center gap-3">
                  <LiquidButton size="default" variant="default" onClick={() => {
                    const idx = events.findIndex((e) => e.eventId === selectedEvent.eventId);
                    if (idx > 0) handleDiff(events[idx - 1].timestamp, selectedEvent.timestamp);
                  }}>
                    <GitCompare className="w-4 h-4 text-white/60" />
                    <span className="text-[13px] text-white/70">Diff with previous</span>
                  </LiquidButton>
                  <Link href={`/dashboard/diff?entityId=${entityId}`}>
                    <LiquidButton size="default" variant="default">
                      <span className="text-[13px] text-[#b8c4ff]">Open Diff Viewer</span>
                    </LiquidButton>
                  </Link>
                </div>
              )}

              {/* Inline Diff Results */}
              {diff.length > 0 && (
                <GlassCard noPadding>
                  <div className="px-5 py-3 border-b border-white/[0.06]">
                    <h3 className="text-[14px] font-semibold text-white">Diff ({diff.length} changes)</h3>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {diff.map((change, i) => (
                      <div key={i} className="px-5 py-3 flex items-center gap-4">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                          change.type === "addition" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                          change.type === "deletion" ? "bg-red-500/20 text-red-400 border-red-500/20" :
                          "bg-amber-500/20 text-amber-400 border-amber-500/20"
                        }`}>{change.type.toUpperCase()}</span>
                        <span className="text-[13px] font-mono text-white/70">{change.path}</span>
                        {change.before !== undefined && <span className="text-[12px] font-mono text-red-400 line-through">{JSON.stringify(change.before)}</span>}
                        {change.after !== undefined && <span className="text-[12px] font-mono text-emerald-400">{JSON.stringify(change.after)}</span>}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
