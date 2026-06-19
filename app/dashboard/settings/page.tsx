"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [snapshotInterval, setSnapshotInterval] = useState("50");
  const [velocityThreshold, setVelocityThreshold] = useState("200");
  const [deleteThreshold, setDeleteThreshold] = useState("50");
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

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
              <div className="px-3 py-2 text-[13px] font-mono bg-white/[0.03] rounded-xl text-white/60 border border-white/[0.04]">playground</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-[14px] font-semibold text-white mb-4">Snapshot Configuration</h2>
          <div>
            <label className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1.5 block">Snapshot Interval (events)</label>
            <input type="number" value={snapshotInterval} onChange={(e) => setSnapshotInterval(e.target.value)} className="w-full px-3 py-2 text-[13px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none focus:border-[#b8c4ff]/30 text-white" />
            <p className="text-[11px] text-white/30 mt-1">Create a snapshot every N events per entity for faster reconstruction</p>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-[14px] font-semibold text-white mb-4">Anomaly Detection</h2>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1.5 block">Write Velocity Threshold (events/min)</label>
              <input type="number" value={velocityThreshold} onChange={(e) => setVelocityThreshold(e.target.value)} className="w-full px-3 py-2 text-[13px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none focus:border-[#b8c4ff]/30 text-white" />
            </div>
            <div>
              <label className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-1.5 block">DELETE Velocity Threshold (events/min)</label>
              <input type="number" value={deleteThreshold} onChange={(e) => setDeleteThreshold(e.target.value)} className="w-full px-3 py-2 text-[13px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none focus:border-[#b8c4ff]/30 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-[14px] font-semibold text-white mb-4">SDK Integration</h2>
          <p className="text-[13px] text-white/40 mb-4">Quick start: install the Rewind SDK and add the middleware to your Mongoose models.</p>
          <pre className="text-[12px] font-mono bg-white/[0.03] rounded-xl p-4 overflow-x-auto text-white/60 border border-white/[0.04]">{`import { rewindMiddleware } from '@rewind/sdk';

const schema = new Schema({ name: String, ... });
schema.plugin(rewindMiddleware, {
  endpoint: '/api/chronos/ingest',
  tenantId: 'your-tenant-id',
});`}</pre>
        </GlassCard>

        <LiquidButton size="lg" variant="default" onClick={handleSave}>
          {saved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4 text-[#b8c4ff]" />}
          <span className="text-[14px] text-white/70">{saved ? "Saved" : "Save Settings"}</span>
        </LiquidButton>
      </div>
    </div>
  );
}
