"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { AlertTriangle, AlertCircle, Info, ShieldCheck } from "lucide-react";

interface Anomaly {
  anomalyId: string;
  timestamp: string;
  type: string;
  severity: string;
  entityType?: string;
  entityId?: string;
  message: string;
  details?: Record<string, unknown>;
}

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/chronos/anomalies")
      .then((r) => r.json())
      .then((data) => setAnomalies(data.items || []))
      .catch(() => setError("Failed to load anomalies"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? anomalies : anomalies.filter((a) => a.severity === filter);

  const severityIcon: Record<string, React.ElementType> = { critical: AlertCircle, warning: AlertTriangle, info: Info };
  const severityGlow: Record<string, string> = {
    critical: "border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]",
    warning: "border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]",
    info: "border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]",
  };
  const severityText: Record<string, string> = {
    critical: "text-red-400",
    warning: "text-amber-400",
    info: "text-blue-400",
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex-shrink-0">
        <h1 className="text-[16px] font-semibold dark:text-white">Anomalies</h1>
        <div className="flex items-center gap-2">
          {["all", "critical", "warning", "info"].map((f) => (
            <LiquidButton key={f} size="sm" variant={filter === f ? "default" : "ghost"} onClick={() => setFilter(f)}>
              <span className={`text-[12px] font-mono capitalize ${filter === f ? "text-[#b8c4ff]" : "text-white/40"}`}>
                {f} {f !== "all" && `(${anomalies.filter((a) => a.severity === f).length})`}
              </span>
            </LiquidButton>
          ))}
        </div>
      </header>

      <div className="p-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined text-[40px] text-white/20 animate-spin">progress_activity</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[40px] text-red-400/40">error</span>
            <p className="text-[14px] text-red-400/60 mt-2">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="w-12 h-12 text-emerald-400/30 mx-auto mb-3" />
            <p className="text-[16px] text-white/40">No anomalies detected</p>
          </div>
        ) : (
          filtered.map((anomaly) => {
            const Icon = severityIcon[anomaly.severity] || Info;
            return (
              <GlassCard key={anomaly.anomalyId} className={`!border ${severityGlow[anomaly.severity] || ""}`}>
                <div className="flex items-start gap-4">
                  <Icon className={`w-6 h-6 mt-0.5 flex-shrink-0 ${severityText[anomaly.severity] || "text-white/40"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${severityText[anomaly.severity]}`}>{anomaly.severity}</span>
                      <span className="text-[11px] font-mono text-white/30">{anomaly.type}</span>
                      <time className="text-[11px] font-mono text-white/30 ml-auto tabular-nums">{new Date(anomaly.timestamp).toLocaleString()}</time>
                    </div>
                    <p className="text-[14px] font-medium text-white mb-2">{anomaly.message}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {anomaly.entityType && <span className="text-[11px] font-mono text-white/30">Type: {anomaly.entityType}</span>}
                      {anomaly.entityId && (
                        <Link href={`/dashboard/entities/${anomaly.entityId}`} className="text-[11px] font-mono text-[#b8c4ff] hover:underline">{anomaly.entityId}</Link>
                      )}
                    </div>
                    {anomaly.details && (
                      <pre className="mt-3 text-[11px] font-mono text-white/30 bg-white/[0.03] rounded-xl p-2 overflow-x-auto border border-white/[0.04]">{JSON.stringify(anomaly.details, null, 2)}</pre>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
