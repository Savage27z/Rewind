"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Search, ChevronRight } from "lucide-react";

interface Entity {
  entityId: string;
  entityType: string;
  createdAt: string;
  lastEventAt: string;
}

export default function EntitiesPage() {
  return <Suspense><EntitiesPageInner /></Suspense>;
}

function EntitiesPageInner() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/chronos/entities")
      .then((r) => r.json())
      .then((data) => setEntities(data.items || []))
      .catch(() => setError("Failed to load entities"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = entities.filter((e) => {
    if (typeFilter && e.entityType !== typeFilter) return false;
    if (search && !e.entityId.toLowerCase().includes(search.toLowerCase()) && !e.entityType.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const types = [...new Set(entities.map((e) => e.entityType))];

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex-shrink-0">
        <h1 className="text-[16px] font-semibold dark:text-white">Entities</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search entities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none focus:border-[#b8c4ff]/30 text-white placeholder:text-white/30 w-[240px] backdrop-blur-sm"
          />
        </div>
      </header>

      <div className="p-6">
        {/* Type filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link href="/dashboard/entities">
            <LiquidButton size="sm" variant={!typeFilter ? "default" : "ghost"}>
              <span className={`text-[12px] font-mono ${!typeFilter ? "text-[#b8c4ff]" : "text-white/40"}`}>All ({entities.length})</span>
            </LiquidButton>
          </Link>
          {types.map((t) => (
            <Link key={t} href={`/dashboard/entities?type=${t}`}>
              <LiquidButton size="sm" variant={typeFilter === t ? "default" : "ghost"}>
                <span className={`text-[12px] font-mono ${typeFilter === t ? "text-[#b8c4ff]" : "text-white/40"}`}>{t} ({entities.filter((e) => e.entityType === t).length})</span>
              </LiquidButton>
            </Link>
          ))}
        </div>

        {/* Table */}
        <GlassCard noPadding>
          <div className="hidden md:grid grid-cols-[1fr_120px_180px_180px_40px] gap-4 px-5 py-3 border-b border-white/[0.06] text-[11px] font-mono text-white/30 uppercase tracking-wider">
            <span>Entity ID</span>
            <span>Type</span>
            <span>Created</span>
            <span>Last Event</span>
            <span />
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-[40px] text-red-400/40">error</span>
              <p className="text-[14px] text-red-400/60 mt-2">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-[40px] text-white/15">search_off</span>
              <p className="text-[14px] text-white/40 mt-2">No entities found</p>
            </div>
          ) : (
            filtered.map((entity) => (
              <Link
                key={entity.entityId}
                href={`/dashboard/entities/${entity.entityId}`}
                className="block md:grid md:grid-cols-[1fr_120px_180px_180px_40px] gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-all border-b border-white/[0.03] last:border-0 items-center group"
              >
                <div className="flex items-center justify-between md:block">
                  <span className="text-[14px] font-mono text-white truncate">{entity.entityId}</span>
                  <span className="text-[12px] font-mono text-[#b8c4ff] bg-[#b8c4ff]/10 px-2 py-0.5 rounded-md w-fit border border-[#b8c4ff]/10 md:hidden">{entity.entityType}</span>
                </div>
                <span className="text-[12px] font-mono text-[#b8c4ff] bg-[#b8c4ff]/10 px-2 py-0.5 rounded-md w-fit border border-[#b8c4ff]/10 hidden md:inline">{entity.entityType}</span>
                <span className="text-[12px] font-mono text-white/30 tabular-nums hidden md:block">{new Date(entity.createdAt).toLocaleString()}</span>
                <span className="text-[12px] font-mono text-white/30 tabular-nums mt-1 md:mt-0 block">{new Date(entity.lastEventAt).toLocaleString()}</span>
                <ChevronRight className="w-4 h-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />
              </Link>
            ))
          )}
        </GlassCard>
      </div>
    </div>
  );
}
