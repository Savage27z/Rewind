"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Check, Copy } from "lucide-react";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="text-[12px] font-mono bg-white/[0.03] rounded-xl p-4 overflow-x-auto text-white/60 border border-white/[0.04] leading-relaxed">{code}</pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
      </button>
    </div>
  );
}

const TABS = ["Quick Start", "Mongoose", "REST API", "Events", "API Keys"] as const;

export default function DocsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Quick Start");

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center px-6 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex-shrink-0">
        <h1 className="text-[16px] font-semibold dark:text-white">SDK Documentation</h1>
      </header>

      <div className="p-6 max-w-3xl">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <LiquidButton key={t} size="sm" variant={tab === t ? "default" : "ghost"} onClick={() => setTab(t)}>
              <span className={`text-[12px] font-mono ${tab === t ? "text-[#b8c4ff]" : "text-white/40"}`}>{t}</span>
            </LiquidButton>
          ))}
        </div>

        {tab === "Quick Start" && (
          <div className="space-y-6">
            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">1. Get Your API Key</h2>
              <p className="text-[13px] text-white/40 mb-4">
                Go to the <a href="/dashboard/keys" className="text-[#b8c4ff] hover:underline">API Keys</a> page and create a new key. You'll see the full key only once — copy it immediately.
              </p>
              <CodeBlock code={`# Your API key looks like this:\nrw_abc123def456...`} />
            </GlassCard>

            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">2. Install the SDK</h2>
              <p className="text-[13px] text-white/40 mb-4">Copy the middleware file into your project, or call the REST API directly.</p>
              <CodeBlock code={`# Copy the middleware into your project\ncp sdk/middleware/mongoose.ts your-project/lib/rewind.ts`} />
            </GlassCard>

            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">3. Add to Your Schema</h2>
              <p className="text-[13px] text-white/40 mb-4">One line to start capturing every mutation.</p>
              <CodeBlock code={`import { rewindMiddleware } from './lib/rewind';

const userSchema = new Schema({ name: String, email: String });

userSchema.plugin(rewindMiddleware, {
  endpoint: '${typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}/api/chronos/ingest',
  tenantId: 'your-clerk-user-id',
  entityType: 'User',
});

const User = mongoose.model('User', userSchema);`} />
            </GlassCard>

            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">4. That's It</h2>
              <p className="text-[13px] text-white/40">
                Every <code className="text-[#b8c4ff] bg-white/[0.06] px-1.5 py-0.5 rounded text-[12px]">save()</code>,{" "}
                <code className="text-[#b8c4ff] bg-white/[0.06] px-1.5 py-0.5 rounded text-[12px]">findOneAndUpdate()</code>, and{" "}
                <code className="text-[#b8c4ff] bg-white/[0.06] px-1.5 py-0.5 rounded text-[12px]">findOneAndDelete()</code>{" "}
                is now captured as an immutable event. Open the dashboard to scrub through time, diff states, and investigate anomalies.
              </p>
            </GlassCard>
          </div>
        )}

        {tab === "Mongoose" && (
          <div className="space-y-6">
            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">Mongoose Middleware</h2>
              <p className="text-[13px] text-white/40 mb-4">
                The middleware hooks into Mongoose's <code className="text-[#b8c4ff] bg-white/[0.06] px-1.5 py-0.5 rounded text-[12px]">post</code> hooks to capture mutations automatically. No changes to your existing code required.
              </p>
              <h3 className="text-[13px] font-medium text-white/70 mb-2 mt-6">Options</h3>
              <div className="space-y-2">
                {[
                  { name: "endpoint", type: "string", required: true, desc: "Full URL to the Rewind ingest API" },
                  { name: "tenantId", type: "string", required: true, desc: "Your Clerk user ID (used for data isolation)" },
                  { name: "entityType", type: "string", required: false, desc: "Override entity type (defaults to model name)" },
                ].map((opt) => (
                  <div key={opt.name} className="flex items-start gap-3 px-3 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                    <code className="text-[12px] font-mono text-[#b8c4ff] whitespace-nowrap">{opt.name}</code>
                    <span className="text-[11px] font-mono text-white/20">{opt.type}</span>
                    {opt.required && <span className="text-[10px] font-mono text-amber-400/60 bg-amber-400/10 px-1.5 py-0.5 rounded">required</span>}
                    <span className="text-[12px] text-white/40 ml-auto">{opt.desc}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">Supported Operations</h2>
              <div className="space-y-2 mt-4">
                {[
                  { op: "document.save()", event: "CREATE or UPDATE", note: "Detects isNew for CREATE vs UPDATE" },
                  { op: "Model.findOneAndUpdate()", event: "UPDATE", note: "Captures full document after update" },
                  { op: "Model.findOneAndDelete()", event: "DELETE", note: "Captures document state before deletion" },
                ].map((item) => (
                  <div key={item.op} className="flex items-center gap-4 px-3 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                    <code className="text-[12px] font-mono text-white/70 w-[220px] flex-shrink-0">{item.op}</code>
                    <span className="text-[12px] font-mono text-emerald-400/70">{item.event}</span>
                    <span className="text-[11px] text-white/30 ml-auto">{item.note}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">Full Example</h2>
              <CodeBlock code={`import mongoose, { Schema } from 'mongoose';
import { rewindMiddleware } from './lib/rewind';

// Define your schema as normal
const orderSchema = new Schema({
  userId: String,
  items: [{ productId: String, quantity: Number, price: Number }],
  total: Number,
  status: { type: String, default: 'pending' },
});

// Add Rewind — one line
orderSchema.plugin(rewindMiddleware, {
  endpoint: '${typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}/api/chronos/ingest',
  tenantId: 'user_abc123',
  entityType: 'Order',
});

const Order = mongoose.model('Order', orderSchema);

// Now every operation is tracked:
const order = await Order.create({
  userId: 'user_456',
  items: [{ productId: 'prod_1', quantity: 2, price: 29.99 }],
  total: 59.98,
});
// → CREATE event captured

await Order.findOneAndUpdate(
  { _id: order._id },
  { status: 'shipped', total: 59.98 }
);
// → UPDATE event captured

await Order.findOneAndDelete({ _id: order._id });
// → DELETE event captured`} />
            </GlassCard>
          </div>
        )}

        {tab === "REST API" && (
          <div className="space-y-6">
            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">Direct REST Integration</h2>
              <p className="text-[13px] text-white/40 mb-4">
                For non-Mongoose applications (Prisma, Drizzle, raw SQL, etc.), send events directly to the ingest endpoint.
              </p>
              <CodeBlock code={`const REWIND_ENDPOINT = '${typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}/api/chronos/ingest';
const REWIND_API_KEY = 'rw_your_api_key_here';

async function trackMutation(
  entityType: string,
  entityId: string,
  eventType: 'CREATE' | 'UPDATE' | 'DELETE',
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  sequenceNumber: number
) {
  await fetch(REWIND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': REWIND_API_KEY,
    },
    body: JSON.stringify({
      entityType,
      entityId,
      eventType,
      payload: { before, after },
      sequenceNumber,
    }),
  });
}`} />
            </GlassCard>

            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">Prisma Example</h2>
              <CodeBlock code={`import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Wrap your Prisma operations
async function updateUser(id: string, data: any) {
  const before = await prisma.user.findUnique({ where: { id } });
  const after = await prisma.user.update({ where: { id }, data });

  await trackMutation('User', id, 'UPDATE', before, after, Date.now());

  return after;
}`} />
            </GlassCard>

            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">Authentication</h2>
              <p className="text-[13px] text-white/40 mb-4">
                The ingest endpoint accepts your API key via either header:
              </p>
              <CodeBlock code={`# Option 1: x-api-key header
curl -X POST /api/chronos/ingest \\
  -H "x-api-key: rw_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{ ... }'

# Option 2: Bearer token
curl -X POST /api/chronos/ingest \\
  -H "Authorization: Bearer rw_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{ ... }'`} />
            </GlassCard>
          </div>
        )}

        {tab === "Events" && (
          <div className="space-y-6">
            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">Event Schema</h2>
              <p className="text-[13px] text-white/40 mb-4">Every event sent to Rewind follows this structure:</p>
              <CodeBlock code={`{
  "entityType": "User",          // Type of entity (e.g. User, Order, Product)
  "entityId": "user_123",        // Unique ID for this entity
  "eventType": "UPDATE",         // CREATE | UPDATE | DELETE
  "payload": {
    "before": { "email": "old@example.com" },  // State before (optional)
    "after": { "email": "new@example.com" }    // State after (required for CREATE)
  },
  "sequenceNumber": 5,           // Monotonic counter per entity
  "causationId": "evt_abc",      // ID of causing event (optional)
  "metadata": {                  // Arbitrary metadata (optional)
    "source": "user-service",
    "requestId": "req_xyz"
  }
}`} />
            </GlassCard>

            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">Event Types</h2>
              <div className="space-y-2 mt-4">
                {[
                  { type: "CREATE", color: "text-emerald-400", desc: "Entity was created. payload.after is required — it becomes the initial state." },
                  { type: "UPDATE", color: "text-amber-400", desc: "Entity was modified. payload.before and payload.after represent the change. payload.after fields are merged into current state." },
                  { type: "DELETE", color: "text-red-400", desc: "Entity was deleted. payload.before captures the final state. Current state is cleared." },
                ].map((item) => (
                  <div key={item.type} className="px-3 py-3 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                    <code className={`text-[13px] font-mono font-semibold ${item.color}`}>{item.type}</code>
                    <p className="text-[12px] text-white/40 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">Sequence Numbers</h2>
              <p className="text-[13px] text-white/40 mb-2">
                Each entity should have a monotonically increasing sequence number. Rewind uses this to:
              </p>
              <ul className="space-y-1.5 text-[13px] text-white/40 list-disc list-inside">
                <li>Ensure deterministic state reconstruction during event replay</li>
                <li>Detect sequence gaps (missing events) as anomalies</li>
                <li>Order events that share the same timestamp</li>
              </ul>
              <p className="text-[12px] text-white/30 mt-3">
                Tip: Use <code className="text-[#b8c4ff] bg-white/[0.06] px-1 py-0.5 rounded text-[11px]">Date.now()</code> if you don't have a dedicated counter — it's monotonic enough for most use cases.
              </p>
            </GlassCard>
          </div>
        )}

        {tab === "API Keys" && (
          <div className="space-y-6">
            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">Managing API Keys</h2>
              <p className="text-[13px] text-white/40 mb-4">
                API keys authenticate your application when sending events to Rewind. Each key is scoped to your user account — events ingested with your key are only visible in your dashboard.
              </p>
              <div className="space-y-2">
                {[
                  { action: "Create", method: "POST", path: "/api/keys", body: '{ "label": "Production" }' },
                  { action: "List", method: "GET", path: "/api/keys", body: null },
                  { action: "Revoke", method: "DELETE", path: "/api/keys", body: '{ "keyId": "key_abc..." }' },
                ].map((item) => (
                  <div key={item.action} className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                    <span className="text-[12px] font-mono text-white/60 w-[60px]">{item.action}</span>
                    <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${item.method === "POST" ? "text-emerald-400 bg-emerald-400/10" : item.method === "DELETE" ? "text-red-400 bg-red-400/10" : "text-blue-400 bg-blue-400/10"}`}>{item.method}</span>
                    <code className="text-[12px] font-mono text-white/40">{item.path}</code>
                    {item.body && <code className="text-[11px] font-mono text-white/20 ml-auto">{item.body}</code>}
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-[14px] font-semibold text-white mb-2">Security</h2>
              <ul className="space-y-2 text-[13px] text-white/40 list-disc list-inside">
                <li>Keys are hashed with SHA-256 before storage — we never store the raw key</li>
                <li>The full key is shown only once at creation. Copy it immediately.</li>
                <li>Keys display a prefix (<code className="text-[#b8c4ff] bg-white/[0.06] px-1 py-0.5 rounded text-[11px]">rw_abc...</code>) for identification</li>
                <li>Revoked keys are immediately invalidated — no grace period</li>
                <li>Each key is scoped to your user account. Events ingested are isolated to your tenant.</li>
              </ul>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
