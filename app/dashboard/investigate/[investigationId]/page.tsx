"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { ArrowLeft, Pin, MessageSquare, Clock } from "lucide-react";

interface PinnedTimestamp {
  label: string;
  timestamp: string;
  entityId?: string;
}

interface Annotation {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

interface Investigation {
  investigationId: string;
  title: string;
  createdBy: string;
  createdAt: string;
  pinnedTimestamps: PinnedTimestamp[];
  annotations: Annotation[];
}

export default function InvestigationDetailPage() {
  const params = useParams();
  const investigationId = params.investigationId as string;
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPin, setNewPin] = useState({ label: "", timestamp: "", entityId: "" });
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    fetch(`/api/chronos/investigate?id=${investigationId}`)
      .then((r) => r.json())
      .then((data) => setInvestigation(data))
      .catch(() => setInvestigation(null))
      .finally(() => setLoading(false));
  }, [investigationId]);

  const addPin = useCallback(async () => {
    if (!investigation || !newPin.label || !newPin.timestamp) return;
    const updated = {
      ...investigation,
      pinnedTimestamps: [...investigation.pinnedTimestamps, { ...newPin, timestamp: new Date(newPin.timestamp).toISOString() }],
    };
    await fetch("/api/chronos/investigate", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updated, investigationId,  }),
    });
    setInvestigation(updated);
    setNewPin({ label: "", timestamp: "", entityId: "" });
  }, [investigation, investigationId, newPin]);

  const addNote = useCallback(async () => {
    if (!investigation || !newNote.trim()) return;
    const annotation: Annotation = { id: Date.now().toString(36), text: newNote, author: "anonymous", createdAt: new Date().toISOString() };
    const updated = { ...investigation, annotations: [...investigation.annotations, annotation] };
    await fetch("/api/chronos/investigate", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updated, investigationId,  }),
    });
    setInvestigation(updated);
    setNewNote("");
  }, [investigation, investigationId, newNote]);

  if (loading) return <div className="flex-1 flex items-center justify-center"><span className="material-symbols-outlined text-[40px] text-white/20 animate-spin">progress_activity</span></div>;
  if (!investigation) return <div className="flex-1 flex items-center justify-center"><p className="text-white/40">Investigation not found</p></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center gap-3 px-6 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex-shrink-0">
        <Link href="/dashboard/investigate" className="text-white/40 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-[16px] font-semibold text-white">{investigation.title}</h1>
        <span className="text-[12px] font-mono text-white/30 ml-auto">Created {new Date(investigation.createdAt).toLocaleDateString()}</span>
      </header>

      <div className="p-6 space-y-8">
        {/* Pinned Timestamps */}
        <div>
          <h2 className="text-[14px] font-semibold text-white mb-4 flex items-center gap-2">
            <Pin className="w-4 h-4 text-[#b8c4ff]" />Pinned Timestamps
          </h2>
          {investigation.pinnedTimestamps.length > 0 && (
            <div className="space-y-2 mb-4">
              {investigation.pinnedTimestamps.map((pin, i) => (
                <GlassCard key={i}>
                  <div className="flex items-center gap-4">
                    <Clock className="w-4 h-4 text-[#b8c4ff] flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-white">{pin.label}</p>
                      <p className="text-[12px] font-mono text-white/30">{new Date(pin.timestamp).toLocaleString()}</p>
                    </div>
                    {pin.entityId && (
                      <Link href={`/dashboard/entities/${pin.entityId}`} className="text-[12px] font-mono text-[#b8c4ff] hover:underline">{pin.entityId}</Link>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
          <GlassCard className="!border-dashed !border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" value={newPin.label} onChange={(e) => setNewPin((p) => ({ ...p, label: e.target.value }))} placeholder="Label" className="px-3 py-2 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none text-white placeholder:text-white/20" />
              <input type="datetime-local" value={newPin.timestamp} onChange={(e) => setNewPin((p) => ({ ...p, timestamp: e.target.value }))} className="px-3 py-2 text-[13px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none text-white" />
              <input type="text" value={newPin.entityId} onChange={(e) => setNewPin((p) => ({ ...p, entityId: e.target.value }))} placeholder="Entity ID (optional)" className="px-3 py-2 text-[13px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none text-white placeholder:text-white/20" />
            </div>
            <div className="mt-3">
              <LiquidButton size="sm" variant="default" onClick={addPin}>
                <Pin className="w-3 h-3 text-[#b8c4ff]" />
                <span className="text-[12px] text-white/70">Pin Timestamp</span>
              </LiquidButton>
            </div>
          </GlassCard>
        </div>

        {/* Annotations */}
        <div>
          <h2 className="text-[14px] font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#b8c4ff]" />Notes
          </h2>
          {investigation.annotations.length > 0 && (
            <div className="space-y-2 mb-4">
              {investigation.annotations.map((note) => (
                <GlassCard key={note.id}>
                  <p className="text-[14px] text-white/80 mb-2">{note.text}</p>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-white/30">
                    <span>{note.author}</span>
                    <span>{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..." className="flex-1 px-3 py-2 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none text-white placeholder:text-white/20" onKeyDown={(e) => e.key === "Enter" && addNote()} />
            <LiquidButton size="default" variant="default" onClick={addNote}>
              <span className="text-[12px] text-white/70">Add Note</span>
            </LiquidButton>
          </div>
        </div>
      </div>
    </div>
  );
}
