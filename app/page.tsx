"use client";

import { useEffect, useRef, useState, createContext, useContext } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

const ThemeContext = createContext(true);

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
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

  const bg = isDark ? "bg-[#0A0A0A]" : "bg-[#f5f3ef]";
  const text = isDark ? "text-white" : "text-[#1b1c1a]";
  const textMuted = isDark ? "text-white/60" : "text-[#444653]";
  const textFaint = isDark ? "text-white/40" : "text-[#757684]";
  const textAccent = isDark ? "text-[#b8c4ff]" : "text-[#0e329f]";
  const borderColor = isDark ? "border-white/[0.08]" : "border-black/[0.06]";
  const lineColor = isDark ? "via-white/10" : "via-[#c5c5d5]/30";

  return (
    <ThemeContext.Provider value={isDark}>
      <div className={`${isDark ? "" : ""} transition-colors duration-300`}>
        {/* Hero */}
        <main className={`min-h-screen ${bg} relative flex flex-col justify-between p-6 md:p-12 overflow-hidden transition-colors duration-300`}>
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
            <div className={`absolute inset-0 z-20 pointer-events-none bg-gradient-to-b ${isDark ? "from-[#0A0A0A]/50 via-transparent to-[#0A0A0A]" : "from-[#f5f3ef]/40 via-transparent to-[#f5f3ef]"}`} />
          </div>

          {/* Nav */}
          <nav className="relative z-50 flex justify-between items-center w-full max-w-[1440px] mx-auto animate-[heroFadeUp_1s_cubic-bezier(0.16,1,0.3,1)_both]">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <span className={`material-symbols-outlined ${textAccent} font-bold transition-transform group-hover:-rotate-12`} style={{ fontVariationSettings: "'FILL' 1" }}>rowing</span>
              <span className={`font-mono text-[13px] font-semibold lowercase tracking-tight ${text}`}>rewind</span>
            </Link>
            <div className={`hidden md:flex backdrop-blur-[12px] ${isDark ? "bg-[rgba(30,31,30,0.5)] border-white/10" : "bg-[rgba(226,226,226,0.5)] border-[#c5c5d5]/30"} p-1 rounded-full border gap-1`}>
              <a className={`px-4 py-1.5 rounded-full text-[16px] ${textMuted} hover:${text} transition-all`} href="#how-it-works">How It Works</a>
              <a className={`px-4 py-1.5 rounded-full text-[16px] ${textMuted} hover:${text} transition-all`} href="#features">Features</a>
              <a className={`px-4 py-1.5 rounded-full text-[16px] ${textMuted} hover:${text} transition-all`} href="https://github.com/Savage27z/Rewind" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"} transition-colors`}>
                <span className={`material-symbols-outlined ${text}`}>{isDark ? "light_mode" : "dark_mode"}</span>
              </button>
              <Show when="signed-out">
                <SignInButton mode="redirect">
                  <button className={`hidden md:flex items-center text-[16px] ${textMuted} transition-colors cursor-pointer`}>
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="redirect">
                  <button className={`hidden md:flex items-center gap-1 text-[16px] ${textAccent} font-semibold group cursor-pointer`}>
                    Get Started
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">north_east</span>
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link href="/dashboard" className={`hidden md:flex items-center gap-1 text-[16px] ${textAccent} font-semibold group`}>
                  Dashboard
                  <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">north_east</span>
                </Link>
                <UserButton />
              </Show>
              <button className={`md:hidden p-2 ${text} relative z-[60]`} onClick={() => setMenuOpen(!menuOpen)}>
                <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
              </button>
            </div>
          </nav>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className={`fixed inset-0 z-50 ${isDark ? "bg-[#0A0A0A]/95" : "bg-[#f5f3ef]/95"} backdrop-blur-2xl md:hidden flex flex-col p-8 pt-24 gap-8`}>
              <div className="flex flex-col gap-6">
                {["How It Works", "Features"].map((item) => (
                  <a key={item} className={`font-display text-[40px] ${text}`} href="#" onClick={() => setMenuOpen(false)}>{item}</a>
                ))}
              </div>
              <div className="mt-auto">
                <Link href="/dashboard" className={`w-full ${isDark ? "bg-white text-[#0A0A0A]" : "bg-[#1b1c1a] text-[#fbf9f5]"} py-5 rounded-full flex justify-between items-center px-8`}>
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
                  <h1 className={`font-display text-[48px] md:text-[86px] leading-[0.85] tracking-[-0.04em] uppercase md:normal-case ${text} font-bold animate-[heroFadeUp_1s_cubic-bezier(0.16,1,0.3,1)_0.15s_both] opacity-0`}>
                    Rewind
                  </h1>
                  <h2 className="font-display text-[48px] md:text-[86px] leading-[0.85] tracking-[-0.04em] uppercase md:normal-case font-bold animate-[heroFadeUp_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_both] opacity-0" style={{ WebkitTextStroke: `1.5px ${isDark ? "#fbf9f5" : "#1b1c1a"}`, color: "transparent" }}>
                    Your Data
                  </h2>
                </div>
                <p className={`font-mono text-[13px] ${textFaint} uppercase tracking-widest flex items-center gap-2 animate-[heroFadeUp_1s_cubic-bezier(0.16,1,0.3,1)_0.5s_both] opacity-0`}>
                  <span className={`w-8 h-[1px] ${isDark ? "bg-white/20" : "bg-[#c5c5d5]"}`} />
                  time-travel debugging for your database
                </p>
              </div>
              <div className="max-w-md w-full flex flex-col gap-8 md:text-left">
                <p className={`text-[18px] ${isDark ? "text-white/70" : "text-[#1b1c1a]/80"} font-light leading-relaxed animate-[heroFadeUp_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_both] opacity-0`}>
                  Every database mutation, captured as an immutable event. Scrub through time, diff any two moments, and reconstruct state at any millisecond.
                </p>
                <Link href="/dashboard" className={`w-full md:w-fit px-10 py-5 ${isDark ? "bg-white text-[#0A0A0A]" : "bg-[#1b1c1a] text-[#fbf9f5]"} rounded-full flex items-center justify-center gap-4 group transition-all hover:scale-[1.02] active:scale-95 shadow-xl animate-[heroFadeUp_1s_cubic-bezier(0.16,1,0.3,1)_0.5s_both] opacity-0`}>
                  <span className="text-[18px] font-bold">Open Dashboard</span>
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">north_east</span>
                </Link>
              </div>
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${lineColor} to-transparent`} />
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

        {/* Footer */}
        <Footer />
      </div>
    </ThemeContext.Provider>
  );
}

function Section({ id, label, title, subtitle, techText, techAlign, children }: {
  id: string; label: string; title: string; subtitle: string;
  techText: string[]; techAlign: "left" | "right"; children: React.ReactNode;
}) {
  const isDark = useContext(ThemeContext);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      className="min-h-screen relative py-24 md:py-32 overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "#0A0A0A" : "#f5f3ef",
      }}
    >
      <div className="absolute inset-0" style={{
        backgroundSize: "40px 40px",
        backgroundImage: `linear-gradient(to right, ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} 1px, transparent 1px), linear-gradient(to bottom, ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} 1px, transparent 1px)`,
      }} />
      <div className={`absolute top-0 ${techAlign === "right" ? "right-0" : "left-0"} p-8 font-mono text-[13px] ${isDark ? "text-white/10" : "text-[#757684]/20"} pointer-events-none hidden md:block`}>
        {techText.map((t) => <p key={t}>{t}</p>)}
      </div>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        <div className="mb-20 md:mb-32">
          <div
            className="flex items-center gap-4 mb-6"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-40px)",
              transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <span className={`font-mono text-[11px] tracking-widest ${isDark ? "text-[#b8c4ff] border-[#b8c4ff]/20" : "text-[#0e329f] border-[#0e329f]/20"} px-3 py-1 border rounded-full bg-[#0e329f]/5 font-bold`}>{label}</span>
            <div className={`h-[1px] flex-grow ${isDark ? "bg-white/10" : "bg-[#c5c5d5]/30"}`} />
          </div>
          <h2
            className={`font-display text-[48px] md:text-[64px] leading-tight ${isDark ? "text-white" : "text-[#1b1c1a]"} max-w-2xl font-bold`}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(40px)",
              transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s",
            }}
          >
            {title}
          </h2>
          <p
            className={`text-[18px] ${isDark ? "text-white/50" : "text-[#444653]"} max-w-xl mt-6`}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(40px)",
              transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s",
            }}
          >
            {subtitle}
          </p>
        </div>
        {children}
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${isDark ? "via-white/10" : "via-[#c5c5d5]/30"} to-transparent`} />
    </section>
  );
}

function FeatureCard({ icon, title, desc, code, delay, small }: {
  icon: string; title: string; desc: string; code: string; delay: number; small?: boolean;
}) {
  const isDark = useContext(ThemeContext);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const baseShadow = isDark
    ? "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.2)"
    : "inset 0 1px 0 0 rgba(255,255,255,0.8), 0 4px 24px rgba(0,0,0,0.04)";
  const hoverShadow = isDark
    ? "inset 0 1px 0 0 rgba(255,255,255,0.1), 0 8px 40px rgba(75,102,209,0.25), 0 0 60px rgba(75,102,209,0.1)"
    : "inset 0 1px 0 0 rgba(255,255,255,0.9), 0 8px 40px rgba(75,102,209,0.15), 0 0 60px rgba(75,102,209,0.05)";

  return (
    <div
      ref={ref}
      className="group p-8 rounded-2xl border cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backdropFilter: "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        background: isDark
          ? "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)",
        borderColor: hovered
          ? (isDark ? "rgba(184,196,255,0.25)" : "rgba(14,50,159,0.2)")
          : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"),
        boxShadow: hovered ? hoverShadow : baseShadow,
        opacity: visible ? 1 : 0,
        transform: visible
          ? (hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)")
          : "translateY(30px) scale(0.95)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay * 0.12}s, transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, border-color 0.3s ease`,
      }}
    >
      <div
        className={`${small ? "mb-6" : "mb-8"} w-12 h-12 flex items-center justify-center rounded-full border group-hover:bg-[#0e329f] group-hover:text-white transition-all duration-300`}
        style={{
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(14,50,159,0.06)",
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(197,197,213,0.4)",
          color: isDark ? "#b8c4ff" : "#0e329f",
        }}
      >
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className={`font-display ${small ? "text-[24px] mb-3" : "text-[28px] mb-4"} font-semibold`} style={{ color: isDark ? "#ffffff" : "#1b1c1a" }}>{title}</h3>
      <p className={`text-[16px] leading-relaxed ${small ? "mb-6" : "mb-6"}`} style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#444653" }}>{desc}</p>
      <div className="pt-4 font-mono text-[13px] uppercase tracking-widest" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(197,197,213,0.3)"}`, color: isDark ? "rgba(255,255,255,0.35)" : "#757684" }}>
        {code}
      </div>
    </div>
  );
}

function Footer() {
  const isDark = useContext(ThemeContext);

  return (
    <footer className={`${isDark ? "bg-[#050505] text-white" : "bg-[#f0eeea] text-[#1b1c1a]"} relative overflow-hidden transition-colors duration-300`}>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundSize: "40px 40px", backgroundImage: "linear-gradient(to right, rgba(128,128,128,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.5) 1px, transparent 1px)" }} />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        {/* CTA Banner */}
        <div className={`py-20 md:py-32 border-b ${isDark ? "border-white/[0.08]" : "border-black/[0.08]"}`}>
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
            <div>
              <p className={`font-mono text-[11px] tracking-widest ${isDark ? "text-[#b8c4ff]" : "text-[#0e329f]"} mb-4 uppercase`}>Start debugging smarter</p>
              <h2 className="font-display text-[40px] md:text-[56px] leading-[0.9] font-bold max-w-lg">
                Ready to rewind<br />your data?
              </h2>
            </div>
            <Show when="signed-out">
              <SignUpButton mode="redirect">
                <button className={`px-10 py-5 ${isDark ? "bg-white text-[#0A0A0A]" : "bg-[#1b1c1a] text-white"} rounded-full flex items-center gap-4 group transition-all hover:scale-[1.02] active:scale-95 shadow-xl cursor-pointer`}>
                  <span className="text-[18px] font-bold">Get Started Free</span>
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">north_east</span>
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className={`px-10 py-5 ${isDark ? "bg-white text-[#0A0A0A]" : "bg-[#1b1c1a] text-white"} rounded-full flex items-center gap-4 group transition-all hover:scale-[1.02] active:scale-95 shadow-xl`}>
                <span className="text-[18px] font-bold">Open Dashboard</span>
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">north_east</span>
              </Link>
            </Show>
          </div>
        </div>

        {/* Footer Grid */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className={`material-symbols-outlined ${isDark ? "text-[#b8c4ff]" : "text-[#0e329f]"} text-[20px]`} style={{ fontVariationSettings: "'FILL' 1" }}>rowing</span>
              <span className="font-mono text-[13px] font-semibold lowercase tracking-tight">rewind</span>
            </div>
            <p className={`text-[14px] ${isDark ? "text-white/40" : "text-[#444653]"} leading-relaxed`}>
              Time-travel debugging<br />for your database.
            </p>
          </div>
          <div>
            <p className={`font-mono text-[11px] tracking-widest ${isDark ? "text-white/30" : "text-[#757684]"} uppercase mb-4`}>Product</p>
            <ul className="space-y-3">
              <li><a href="#how-it-works" className={`text-[14px] ${isDark ? "text-white/60 hover:text-white" : "text-[#444653] hover:text-[#1b1c1a]"} transition-colors`}>How It Works</a></li>
              <li><a href="#features" className={`text-[14px] ${isDark ? "text-white/60 hover:text-white" : "text-[#444653] hover:text-[#1b1c1a]"} transition-colors`}>Features</a></li>
              <li><Link href="/dashboard" className={`text-[14px] ${isDark ? "text-white/60 hover:text-white" : "text-[#444653] hover:text-[#1b1c1a]"} transition-colors`}>Dashboard</Link></li>
              <li><Link href="/dashboard/keys" className={`text-[14px] ${isDark ? "text-white/60 hover:text-white" : "text-[#444653] hover:text-[#1b1c1a]"} transition-colors`}>API Keys</Link></li>
            </ul>
          </div>
          <div>
            <p className={`font-mono text-[11px] tracking-widest ${isDark ? "text-white/30" : "text-[#757684]"} uppercase mb-4`}>Resources</p>
            <ul className="space-y-3">
              <li><a href="https://github.com/Savage27z/Rewind" target="_blank" rel="noopener noreferrer" className={`text-[14px] ${isDark ? "text-white/60 hover:text-white" : "text-[#444653] hover:text-[#1b1c1a]"} transition-colors`}>GitHub</a></li>
            </ul>
          </div>
          <div>
            <p className={`font-mono text-[11px] tracking-widest ${isDark ? "text-white/30" : "text-[#757684]"} uppercase mb-4`}>Built With</p>
            <ul className="space-y-3">
              <li><span className={`text-[14px] ${isDark ? "text-white/60" : "text-[#444653]"}`}>Next.js 16</span></li>
              <li><span className={`text-[14px] ${isDark ? "text-white/60" : "text-[#444653]"}`}>AWS DynamoDB</span></li>
              <li><span className={`text-[14px] ${isDark ? "text-white/60" : "text-[#444653]"}`}>Vercel</span></li>
              <li><span className={`text-[14px] ${isDark ? "text-white/60" : "text-[#444653]"}`}>TypeScript</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`py-6 border-t ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"} flex flex-col md:flex-row items-center justify-between gap-4`}>
          <p className={`font-mono text-[12px] ${isDark ? "text-white/20" : "text-[#757684]"}`}>&copy; 2026 Rewind. Built for the h01 Hackathon.</p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/Savage27z/Rewind" target="_blank" rel="noopener noreferrer" className={`text-[12px] ${isDark ? "text-white/20 hover:text-white/50" : "text-[#757684] hover:text-[#1b1c1a]"} transition-colors font-mono`}>GitHub</a>
            <a href="https://devpost.com" target="_blank" rel="noopener noreferrer" className={`text-[12px] ${isDark ? "text-white/20 hover:text-white/50" : "text-[#757684] hover:text-[#1b1c1a]"} transition-colors font-mono`}>Devpost</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
