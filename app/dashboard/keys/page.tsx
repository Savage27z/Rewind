"use client";

import { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff } from "lucide-react";

interface ApiKey {
  keyId: string;
  prefix: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  raw?: string;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKeyRaw, setNewKeyRaw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const loadKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/keys");
      const data = await res.json();
      setKeys(data.keys || []);
    } catch { setError("Failed to load API keys"); }
    setLoading(false);
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const createKey = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel || "Default" }),
      });
      const data = await res.json();
      setNewKeyRaw(data.raw);
      setNewLabel("");
      setShowCreate(false);
      loadKeys();
    } catch {}
    setCreating(false);
  };

  const deleteKey = async (keyId: string) => {
    await fetch("/api/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId }),
    });
    setKeys((prev) => prev.filter((k) => k.keyId !== keyId));
  };

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex-shrink-0">
        <h1 className="text-[16px] font-semibold dark:text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-[#b8c4ff]" />
          API Keys
        </h1>
        <LiquidButton size="sm" variant="default" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 text-[#b8c4ff]" />
          <span className="text-[12px] text-white/70">New Key</span>
        </LiquidButton>
      </header>

      <div className="p-6 max-w-2xl space-y-6">
        {/* New key revealed */}
        {newKeyRaw && (
          <GlassCard className="!border-emerald-500/20 !shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-white mb-1">API Key Created</h3>
                <p className="text-[12px] text-white/40 mb-3">Copy this key now — you won&apos;t be able to see it again.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 text-[13px] font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/80 overflow-x-auto">
                    {showKey ? newKeyRaw : `${newKeyRaw.slice(0, 7)}${"•".repeat(32)}`}
                  </code>
                  <button onClick={() => setShowKey(!showKey)} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => copyKey(newKeyRaw)} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Create form */}
        {showCreate && (
          <GlassCard className="!border-[#b8c4ff]/15">
            <h3 className="text-[14px] font-semibold text-white mb-3">Create API Key</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Key label (e.g. Production, Dev)"
                className="flex-1 px-3 py-2 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none focus:border-[#b8c4ff]/30 text-white placeholder:text-white/20"
                onKeyDown={(e) => e.key === "Enter" && createKey()}
              />
              <LiquidButton size="default" variant="default" onClick={createKey} disabled={creating}>
                <span className="text-[13px] text-white/70">{creating ? "Creating..." : "Create"}</span>
              </LiquidButton>
            </div>
          </GlassCard>
        )}

        {/* Keys list */}
        <div>
          <h2 className="text-[14px] font-semibold text-white mb-4">Your Keys</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner" style={{ width: 40, height: 40 }} />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[40px] text-red-400/40">error</span>
              <p className="text-[14px] text-red-400/60 mt-2">{error}</p>
            </div>
          ) : keys.length === 0 ? (
            <GlassCard>
              <div className="text-center py-6">
                <Key className="w-10 h-10 text-white/15 mx-auto mb-3" />
                <p className="text-[14px] text-white/40">No API keys yet</p>
                <p className="text-[12px] text-white/20 mt-1">Create one to start sending events</p>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => (
                <GlassCard key={key.keyId}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Key className="w-4 h-4 text-[#b8c4ff] flex-shrink-0" />
                      <div>
                        <p className="text-[14px] font-medium text-white">{key.label}</p>
                        <div className="flex items-center gap-3 text-[12px] font-mono text-white/30">
                          <span>{key.prefix}•••••••••</span>
                          <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                          {key.lastUsedAt && <span>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => deleteKey(key.keyId)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* SDK Usage */}
        <GlassCard>
          <h2 className="text-[14px] font-semibold text-white mb-4">Quick Start</h2>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-2">1. Install the SDK</p>
              <pre className="text-[12px] font-mono bg-white/[0.03] rounded-xl p-3 text-white/60 border border-white/[0.04]">npm install @rewind/sdk</pre>
            </div>
            <div>
              <p className="text-[11px] font-mono text-white/30 uppercase tracking-wider mb-2">2. Add to your Mongoose models</p>
              <pre className="text-[12px] font-mono bg-white/[0.03] rounded-xl p-3 text-white/60 border border-white/[0.04] overflow-x-auto">{`import { rewindMiddleware } from '@rewind/sdk';

const schema = new Schema({ name: String, ... });
schema.plugin(rewindMiddleware, {
  endpoint: '${typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}/api/chronos/ingest',
  apiKey: 'your-api-key-here',
});`}</pre>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
