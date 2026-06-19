"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);
  const radiusRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!glowRef.current) return;
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      glowRef.current.style.setProperty("--x", `${x}%`);
      glowRef.current.style.setProperty("--y", `${y}%`);
      if (radiusRef.current < 220) {
        radiusRef.current += 5;
        glowRef.current.style.setProperty("--radius", `${radiusRef.current}px`);
      }
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <div className={isDark ? "dark" : ""}>
      {/* Hero */}
      <main className="min-h-screen bg-[#f5f3ef] dark:bg-[#0A0A0A] relative flex flex-col justify-between p-6 md:p-12 overflow-hidden transition-colors duration-300">
        <div
          ref={glowRef}
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: `radial-gradient(circle at var(--x, 50%) var(--y, 50%), ${isDark ? "rgba(75,102,209,0.15)" : "rgba(75,102,209,0.25)"} 0%, transparent var(--radius, 0px))`,
            transition: "background 0.3s ease-out",
          }}
        />

        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className={`absolute inset-0 w-full h-full object-cover object-center animate-[heroImageFloat_1.4s_cubic-bezier(0.16,1,0.3,1)_0.2s_both] saturate-0 ${
              isDark
                ? "mix-blend-screen invert brightness-[1.4] contrast-[1.2]"
                : "mix-blend-multiply brightness-[1.25] contrast-[1.1]"
            }`}
            src="/assets/hero-video.mp4"
          />
          <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-[#f5f3ef]/40 via-transparent to-[#f5f3ef] dark:from-[#0A0A0A]/50 dark:via-transparent dark:to-[#0A0A0A]" />
        </div>

        {/* Nav */}
        <nav className="relative z-50 flex justify-between items-center w-full max-w-[1440px] mx-auto animate-[heroFadeUp_1s_cubic-bezier(0.16,1,0.3,1)_both]">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <span className="material-symbols-outlined text-[#0e329f] dark:text-[#b8c4ff] font-bold transition-transform group-hover:-rotate-12" style={{ fontVariationSettings: "'FILL' 1" }}>rowing</span>
            <span className="font-mono text-[13px] font-semibold lowercase tracking-tight dark:text-white">rewind</span>
          </Link>
          <div className="hidden md:flex backdrop-blur-[12px] bg-[rgba(226,226,226,0.5)] dark:bg-[rgba(30,31,30,0.5)] p-1 rounded-full border border-[#c5c5d5]/30 dark:border-white/10 gap-1">
            <a className="px-4 py-1.5 rounded-full text-[16px] text-[#444653] dark:text-white/60 hover:text-[#1b1c1a] dark:hover:text-white transition-all" href="#how-it-works">How It Works</a>
            <a className="px-4 py-1.5 rounded-full text-[16px] text-[#444653] dark:text-white/60 hover:text-[#1b1c1a] dark:hover:text-white transition-all" href="#features">Features</a>
            <a className="px-4 py-1.5 rounded-full text-[16px] text-[#444653] dark:text-white/60 hover:text-[#1b1c1a] dark:hover:text-white transition-all" href="#">SDK</a>
            <a className="px-4 py-1.5 rounded-full text-[16px] text-[#444653] dark:text-white/60 hover:text-[#1b1c1a] dark:hover:text-white transition-all" href="#">Docs</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <span className="material-symbols-outlined dark:text-white">{isDark ? "light_mode" : "dark_mode"}</span>
            </button>
            <Show when="signed-out">
              <SignInButton mode="redirect">
                <button className="hidden md:flex items-center text-[16px] text-[#444653] dark:text-white/60 hover:text-[#1b1c1a] dark:hover:text-white transition-colors cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <button className="hidden md:flex items-center gap-1 text-[16px] text-[#0e329f] dark:text-[#b8c4ff] font-semibold group cursor-pointer">
                  Get Started
                  <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">north_east</span>
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="hidden md:flex items-center gap-1 text-[16px] text-[#0e329f] dark:text-[#b8c4ff] font-semibold group">
                Dashboard
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">north_east</span>
              </Link>
              <UserButton />
            </Show>
            <button className="md:hidden p-2 dark:text-white relative z-[60]" onClick={() => setMenuOpen(!menuOpen)}>
              <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-[#fbf9f5]/95 dark:bg-[#0A0A0A]/95 backdrop-blur-2xl md:hidden flex flex-col p-8 pt-24 gap-8">
            <div className="flex flex-col gap-6">
              {["How It Works", "Features", "SDK", "Docs"].map((item) => (
                <a key={item} className="font-display text-[40px] dark:text-white" href="#" onClick={() => setMenuOpen(false)}>{item}</a>
              ))}
            </div>
            <div className="mt-auto">
              <Link href="/dashboard" className="w-full bg-[#1b1c1a] dark:bg-white text-[#fbf9f5] dark:text-[#0A0A0A] py-5 rounded-full flex justify-between items-center px-8">
                <span className="text-[18px] font-bold">Open Dashboard</span>
                <span className="material-symbols-outlined">north_east</span>
              </Link>
            </div>
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-20 w-full max-w-[1440px] mx-auto mt-auto pb-8 md:pb-0">
          <div className="flex flex-col md:flex-row items-end justify-between gap-12">
            <div className="w-full md:w-auto">
              <div className="mb-4">
                <h1 className="font-display text-[48px] md:text-[86px] leading-[0.85] tracking-[-0.04em] uppercase md:normal-case dark:text-white font-bold animate-[heroFadeUp_1s_cubic-bezier(0.16,1,0.3,1)_0.15s_both] opacity-0">
                  Rewind
                </h1>
                <h2 className="font-display text-[48px] md:text-[86px] leading-[0.85] tracking-[-0.04em] uppercase md:normal-case font-bold animate-[heroFadeUp_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_both] opacity-0" style={{ WebkitTextStroke: `1.5px ${isDark ? "#fbf9f5" : "#1b1c1a"}`, color: "transparent" }}>
                  Your Data
                </h2>
              </div>
              <p className="font-mono text-[13px] text-[#757684] dark:text-white/40 uppercase tracking-widest flex items-center gap-2 animate-[heroFadeUp_1s_cubic-bezier(0.16,1,0.3,1)_0.5s_both] opacity-0">
                <span className="w-8 h-[1px] bg-[#c5c5d5] dark:bg-white/20" />
                time-travel debugging for your database
              </p>
            </div>
            <div className="max-w-md w-full flex flex-col gap-8 md:text-left">
              <p className="text-[18px] text-[#1b1c1a]/80 dark:text-white/70 font-light leading-relaxed animate-[heroFadeUp_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_both] opacity-0">
                Every database mutation, captured as an immutable event. Scrub through time, diff any two moments, and reconstruct state at any millisecond.
              </p>
              <Link href="/dashboard" className="w-full md:w-fit px-10 py-5 bg-[#1b1c1a] dark:bg-white text-[#fbf9f5] dark:text-[#0A0A0A] rounded-full flex items-center justify-center gap-4 group transition-all hover:scale-[1.02] active:scale-95 shadow-xl animate-[heroFadeUp_1s_cubic-bezier(0.16,1,0.3,1)_0.5s_both] opacity-0">
                <span className="text-[18px] font-bold">Open Dashboard</span>
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">north_east</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#c5c5d5]/30 dark:via-white/10 to-transparent" />
      </main>

      {/* How It Works */}
      <Section id="how-it-works" label="01 // PROCESS" title="How Rewind Works" subtitle="Underneath the hood, Rewind leverages a log-structured temporal engine designed for millisecond-level precision." techText={["SYSTEM_CLOCK::TEMPORAL_QUERY_RECEPTOR", "REPL_LAG: 0.00ms"]} techAlign="right">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <FeatureCard icon="history" title="Immutable Event Stream" desc="Every database change is stored as a permanent event, not just a state update. We preserve the &quot;why&quot; and &quot;when&quot; behind every single row modification." code="EVENT_LOG_STRICT: TRUE" delay={1} />
          <FeatureCard icon="schedule" title="Point-in-Time Reconstruction" desc="Rebuild your entire database state at any specific millisecond. Traverse history with our virtual snapshotting engine without performance overhead." code="RECON_LATENCY: < 12ms" delay={2} />
          <FeatureCard icon="difference" title="Deterministic Diffing" desc="Instantly compare any two moments in history to identify mutations with bit-by-bit precision. Visualize changes across your schema in real-time." code="DIFF_HASH: SHA-256" delay={3} />
        </div>
      </Section>

      {/* Features */}
      <Section id="features" label="02 // CAPABILITIES" title="Engineered for Precision" subtitle="Advanced temporal primitives for high-stakes data environments." techText={["MODULE_TRC :: TELEMETRY_STREAM", "STATUS: ACTIVE"]} techAlign="left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <FeatureCard icon="monitoring" title="Real-time Telemetry" desc="Observe every mutation as it happens with microsecond resolution." code="TRC_ID: 0x882F" delay={1} small />
          <FeatureCard icon="fork_right" title="Branching States" desc="Fork your database state at any point in history for sandboxed experimentation." code="BRNCH_ID: ALPHA_7" delay={2} small />
          <FeatureCard icon="api" title="Temporal API" desc="Programmatic access to your data's timeline via a high-performance GraphQL interface." code="ENDPOINT: /V1/TIMELINE" delay={3} small />
          <FeatureCard icon="layers" title="Zero-Copy Snapshots" desc="Create instant, space-efficient restore points without performance degradation." code="SNAP_TYPE: COW_REF" delay={4} small />
        </div>
      </Section>
    </div>
  );
}

function Section({ id, label, title, subtitle, techText, techAlign, children }: {
  id: string; label: string; title: string; subtitle: string;
  techText: string[]; techAlign: "left" | "right"; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      className="min-h-screen bg-[#fbf9f5] dark:bg-[#0A0A0A] relative py-24 md:py-32 overflow-hidden transition-colors duration-300"
      style={{
        backgroundSize: "40px 40px",
        backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)",
      }}
    >
      <div className={`absolute top-0 ${techAlign === "right" ? "right-0" : "left-0"} p-8 font-mono text-[13px] text-[#757684]/20 dark:text-white/10 pointer-events-none hidden md:block`}>
        {techText.map((t) => <p key={t}>{t}</p>)}
      </div>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        <div className="mb-20 md:mb-32">
          <div className={`flex items-center gap-4 mb-6 transition-all duration-800 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}>
            <span className="font-mono text-[11px] tracking-widest text-[#0e329f] dark:text-[#b8c4ff] px-3 py-1 border border-[#0e329f]/20 dark:border-[#b8c4ff]/20 rounded-full bg-[#0e329f]/5 font-bold">{label}</span>
            <div className="h-[1px] flex-grow bg-[#c5c5d5]/30 dark:bg-white/10" />
          </div>
          <h2 className={`font-display text-[48px] md:text-[64px] leading-tight dark:text-white max-w-2xl font-bold transition-all duration-800 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            {title}
          </h2>
          <p className={`text-[18px] text-[#444653] dark:text-white/50 max-w-xl mt-6 transition-all duration-800 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            {subtitle}
          </p>
        </div>
        {children}
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#c5c5d5]/30 dark:via-white/10 to-transparent" />
    </section>
  );
}

function FeatureCard({ icon, title, desc, code, delay, small }: {
  icon: string; title: string; desc: string; code: string; delay: number; small?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`group backdrop-blur-[24px] bg-white/60 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.08] p-8 rounded-2xl transition-all duration-500 hover:shadow-2xl hover:shadow-[#0e329f]/10 ${
        visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.92]"
      }`}
      style={{ transitionDelay: `${delay * 100}ms` }}
    >
      <div className={`${small ? "mb-6" : "mb-8"} w-12 h-12 flex items-center justify-center rounded-full bg-[#f0eeea] dark:bg-white/5 border border-[#c5c5d5]/30 dark:border-white/10 text-[#0e329f] dark:text-[#b8c4ff] group-hover:bg-[#0e329f] group-hover:text-white transition-all duration-300`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className={`font-display ${small ? "text-[24px] mb-3" : "text-[28px] mb-4"} dark:text-white font-semibold`}>{title}</h3>
      <p className={`text-[16px] text-[#444653] dark:text-white/60 leading-relaxed ${small ? "mb-6" : "mb-6"}`}>{desc}</p>
      <div className="pt-4 border-t border-[#c5c5d5]/20 dark:border-white/5 font-mono text-[13px] text-[#757684] dark:text-white/30 uppercase tracking-widest">
        {code}
      </div>
    </div>
  );
}
