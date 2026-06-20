"use client";

import { useUser } from "@clerk/nextjs";
import { GlassCard } from "@/components/ui/glass-card";
import { Info } from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center px-6 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex-shrink-0">
        <h1 className="text-[16px] font-semibold dark:text-white">Settings</h1>
      </header>

      <div className="p-6 max-w-2xl space-y-6">
        <GlassCard>
          <h2 className="text-[14px] font-semibold text-white mb-4">Connection</h2>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1.5 block">DynamoDB Table</label>
              <div className="px-3 py-2 text-[13px] font-mono bg-white/[0.03] rounded-xl text-white/60 border border-white/[0.04]">RewindEvents</div>
            </div>
            <div>
              <label className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1.5 block">Region</label>
              <div className="px-3 py-2 text-[13px] font-mono bg-white/[0.03] rounded-xl text-white/60 border border-white/[0.04]">us-east-1</div>
            </div>
            <div>
              <label className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1.5 block">Tenant ID</label>
              <div className="px-3 py-2 text-[13px] font-mono bg-white/[0.03] rounded-xl text-white/60 border border-white/[0.04]">{user?.id || "—"}</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-[14px] font-semibold text-white mb-4">Engine Configuration</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-3 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
              <div>
                <p className="text-[13px] text-white/70">Snapshot Interval</p>
                <p className="text-[11px] text-white/30 font-mono">Automatic snapshot every N events per entity</p>
              </div>
              <span className="text-[13px] font-mono text-[#b8c4ff]">50 events</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
              <div>
                <p className="text-[13px] text-white/70">Write Velocity Threshold</p>
                <p className="text-[11px] text-white/30 font-mono">Triggers anomaly alert when exceeded</p>
              </div>
              <span className="text-[13px] font-mono text-[#b8c4ff]">200/min</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
              <div>
                <p className="text-[13px] text-white/70">DELETE Velocity Threshold</p>
                <p className="text-[11px] text-white/30 font-mono">Flags bulk deletes as anomalies</p>
              </div>
              <span className="text-[13px] font-mono text-[#b8c4ff]">50/min</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-[14px] font-semibold text-white mb-4">SDK Integration</h2>
          <p className="text-[13px] text-white/40 mb-4">Add the Rewind middleware to your Mongoose models to start capturing events.</p>
          <pre className="text-[12px] font-mono bg-white/[0.03] rounded-xl p-4 overflow-x-auto text-white/60 border border-white/[0.04]">{`import { rewindMiddleware } from '@rewind/sdk';

const schema = new Schema({ name: String, ... });
schema.plugin(rewindMiddleware, {
  endpoint: '${typeof window !== "undefined" ? window.location.origin : ""}/api/chronos/ingest',
  apiKey: 'rw_your-api-key',
});`}</pre>
        </GlassCard>

        <div className="flex items-start gap-2 px-1">
          <Info className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-white/20">Engine settings are configured at the infrastructure level. Contact your admin to modify thresholds.</p>
        </div>
      </div>
    </div>
  );
}
