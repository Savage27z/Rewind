"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { ArrowRight, Activity, Database, AlertTriangle, Layers, Key, Terminal, Plug, Rocket } from "lucide-react";

interface Stats {
  totalEvents: number;
  totalEntities: number;
  anomalies: number;
  entityTypes: string[];
}

interface RecentEvent {
  eventId: string;
  entityId: string;
  entityType: string;
  eventType: string;
  timestamp: string;
}

function StatCard({ icon: Icon, label, value, href, color }: {
  icon: React.ElementType; label: string; value: string | number; href: string; color: string;
}) {
  return (
    <Link href={href}>
      <GlassCard className="group cursor-pointer hover:scale-[1.03]">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <ArrowRight className="w-4 h-4 text-white/20 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </div>
        <p className="text-[32px] font-display font-bold dark:text-white leading-none mb-1">{value}</p>
        <p className="text-[13px] text-[#757684] dark:text-white/40 font-mono uppercase tracking-wider">{label}</p>
      </GlassCard>
    </Link>
  );
}

function EventRow({ event }: { event: RecentEvent }) {
  const typeColors: Record<string, string> = {
    CREATE: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20",
    UPDATE: "bg-blue-500/20 text-blue-400 border border-blue-500/20",
    DELETE: "bg-red-500/20 text-red-400 border border-red-500/20",
  };

  return (
    <Link href={`/dashboard/entities/${event.entityId}`} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.04] transition-colors rounded-xl group">
      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${typeColors[event.eventType] || "bg-gray-500/20 text-gray-400"}`}>
        {event.eventType}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] dark:text-white truncate">
          <span className="text-white/30">{event.entityType}/</span>
          {event.entityId}
        </p>
      </div>
      <time className="text-[12px] font-mono text-white/30 tabular-nums flex-shrink-0">
        {new Date(event.timestamp).toLocaleTimeString()}
      </time>
      <ArrowRight className="w-4 h-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function OnboardingStep({ step, icon: Icon, title, description, action, done }: {
  step: number; icon: React.ElementType; title: string; description: string; action: React.ReactNode; done: boolean;
}) {
  return (
    <GlassCard className={`transition-all ${done ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-500/20" : "bg-[#b8c4ff]/15"}`}>
          {done ? (
            <span className="text-emerald-400 text-[18px]">✓</span>
          ) : (
            <span className="text-[#b8c4ff] text-[14px] font-mono font-bold">{step}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 text-[#b8c4ff]" />
            <h3 className="text-[14px] font-semibold text-white">{title}</h3>
          </div>
          <p className="text-[13px] text-white/40 mb-3">{description}</p>
          {!done && action}
        </div>
      </div>
    </GlassCard>
  );
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({ totalEvents: 0, totalEntities: 0, anomalies: 0, entityTypes: [] });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasKeys, setHasKeys] = useState(false);
  const [keysLoading, setKeysLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [entitiesRes, timelineRes, anomaliesRes] = await Promise.all([
          fetch("/api/chronos/entities"),
          fetch("/api/chronos/timeline?limit=20"),
          fetch("/api/chronos/anomalies"),
        ]);

        const entities = await entitiesRes.json();
        const timeline = await timelineRes.json();
        const anomalies = await anomaliesRes.json();

        const entityList = entities.items || [];
        const events = timeline.items || [];
        const anomalyList = anomalies.items || [];
        const types = [...new Set(entityList.map((e: { entityType: string }) => e.entityType))] as string[];

        setStats({
          totalEvents: events.length,
          totalEntities: entityList.length,
          anomalies: anomalyList.length,
          entityTypes: types,
        });
        setRecentEvents(events.slice(0, 10));
      } catch (err) { console.error("Dashboard load failed:", err); }
      setLoading(false);
    }

    async function checkKeys() {
      try {
        const res = await fetch("/api/keys");
        const data = await res.json();
        setHasKeys((data.keys || []).length > 0);
      } catch {}
      setKeysLoading(false);
    }

    load();
    checkKeys();
  }, []);

  const isEmpty = !loading && stats.totalEvents === 0;
  const showOnboarding = isEmpty && !keysLoading;

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex-shrink-0">
        <h1 className="text-[16px] font-semibold dark:text-white">Overview</h1>
        <LiquidButton size="sm" variant="default">
          <span className="font-mono text-[12px] font-bold tracking-widest uppercase dark:text-white/80 text-[#0e329f]">Rewind</span>
        </LiquidButton>
      </header>

      <div className="p-6 space-y-8">
        {showOnboarding ? (
          <>
            {/* Welcome */}
            <GlassCard className="!border-[#b8c4ff]/15 !shadow-[0_0_40px_rgba(75,102,209,0.08)]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#b8c4ff]/15 flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-6 h-6 text-[#b8c4ff]" />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-white mb-1">Welcome to Rewind</h2>
                  <p className="text-[14px] text-white/50 leading-relaxed">
                    Set up your project in 3 steps. Once connected, every database mutation will be captured
                    here — ready for time-travel debugging.
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Steps */}
            <div className="space-y-4">
              <OnboardingStep
                step={1}
                icon={Key}
                title="Create an API Key"
                description="Generate a secret key to authenticate your SDK with Rewind."
                done={hasKeys}
                action={
                  <Link href="/dashboard/keys">
                    <LiquidButton size="default" variant="default">
                      <Key className="w-4 h-4 text-[#b8c4ff]" />
                      <span className="text-[13px] text-white/70">Generate API Key</span>
                    </LiquidButton>
                  </Link>
                }
              />

              <OnboardingStep
                step={2}
                icon={Terminal}
                title="Install the SDK"
                description="Add the Rewind SDK to your project."
                done={false}
                action={
                  <pre className="text-[12px] font-mono bg-white/[0.03] rounded-xl p-3 text-white/60 border border-white/[0.04]">
                    npm install @rewind/sdk
                  </pre>
                }
              />

              <OnboardingStep
                step={3}
                icon={Plug}
                title="Connect your database"
                description="Add the middleware to your Mongoose models. Events will start flowing in automatically."
                done={false}
                action={
                  <pre className="text-[12px] font-mono bg-white/[0.03] rounded-xl p-3 text-white/60 border border-white/[0.04] overflow-x-auto">{`import { rewindMiddleware } from '@rewind/sdk';

const schema = new Schema({ name: String, ... });
schema.plugin(rewindMiddleware, {
  endpoint: '${typeof window !== "undefined" ? window.location.origin : ""}/api/chronos/ingest',
  apiKey: 'your-api-key',
});`}</pre>
                }
              />
            </div>

            {/* Demo data or waiting */}
            <GlassCard>
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <p className="text-[14px] text-white/50">Want to explore with sample data first?</p>
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await fetch("/api/seed-demo", { method: "POST" });
                      window.location.reload();
                    } catch {}
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#b8c4ff]/15 border border-[#b8c4ff]/20 text-[#b8c4ff] text-[13px] font-semibold hover:bg-[#b8c4ff]/25 transition-colors cursor-pointer"
                >
                  Load Demo Data
                </button>
                {hasKeys && (
                  <p className="text-[12px] text-white/30 mt-2 flex items-center gap-2">
                    <div className="spinner" style={{ width: 16, height: 16 }} />
                    Or waiting for your first real event...
                  </p>
                )}
              </div>
            </GlassCard>
          </>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Activity} label="Total Events" value={loading ? "—" : stats.totalEvents} href="/dashboard/entities" color="bg-[#0e329f]/20 text-[#b8c4ff]" />
              <StatCard icon={Database} label="Entities" value={loading ? "—" : stats.totalEntities} href="/dashboard/entities" color="bg-violet-500/20 text-violet-400" />
              <StatCard icon={AlertTriangle} label="Anomalies" value={loading ? "—" : stats.anomalies} href="/dashboard/anomalies" color="bg-amber-500/20 text-amber-400" />
              <StatCard icon={Layers} label="Entity Types" value={loading ? "—" : stats.entityTypes.length} href="/dashboard/entities" color="bg-emerald-500/20 text-emerald-400" />
            </div>

            {/* Recent Events */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-semibold dark:text-white">Recent Events</h2>
                <Link href="/dashboard/entities">
                  <LiquidButton size="sm" variant="default">
                    <span className="text-[12px] font-mono dark:text-white/60">View all</span>
                  </LiquidButton>
                </Link>
              </div>
              <GlassCard noPadding>
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="spinner" style={{ width: 32, height: 32 }} />
                    <p className="text-[13px] text-white/30 mt-2 font-mono">Loading events...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {recentEvents.map((event) => (
                      <EventRow key={event.eventId} event={event} />
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Entity Types */}
            {stats.entityTypes.length > 0 && (
              <div>
                <h2 className="text-[14px] font-semibold dark:text-white mb-4">Entity Types</h2>
                <div className="flex flex-wrap gap-2">
                  {stats.entityTypes.map((type) => (
                    <Link key={type} href={`/dashboard/entities?type=${type}`}>
                      <LiquidButton size="sm" variant="default">
                        <span className="text-[13px] font-mono dark:text-white/70">{type}</span>
                      </LiquidButton>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
