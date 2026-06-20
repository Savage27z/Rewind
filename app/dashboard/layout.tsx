"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

const NAV = [
  { href: "/dashboard", icon: "dashboard", label: "Overview" },
  { href: "/dashboard/entities", icon: "database", label: "Entities" },
  { href: "/dashboard/diff", icon: "difference", label: "Diff" },
  { href: "/dashboard/anomalies", icon: "warning", label: "Anomalies" },
  { href: "/dashboard/branch", icon: "fork_right", label: "Branch" },
  { href: "/dashboard/investigate", icon: "search_insights", label: "Investigate" },
  { href: "/dashboard/keys", icon: "key", label: "API Keys" },
  { href: "/dashboard/settings", icon: "settings", label: "Settings" },
  { href: "/dashboard/profile", icon: "person", label: "Profile" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <AuroraBackground className="!h-screen !items-stretch !justify-stretch" showRadialGradient={true}>
      <div className="relative z-10 flex h-screen w-full overflow-hidden">
        {/* Sidebar — glass */}
        <aside className={`${collapsed ? "w-[68px]" : "w-[240px]"} flex-shrink-0 border-r border-white/[0.06] bg-white/[0.04] dark:bg-white/[0.02] backdrop-blur-2xl flex flex-col transition-all duration-300`}>
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-white/[0.06]">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="material-symbols-outlined text-[#0e329f] dark:text-[#b8c4ff] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>rowing</span>
              {!collapsed && <span className="font-mono text-[13px] font-semibold lowercase tracking-tight dark:text-white">rewind</span>}
            </Link>
            <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1 rounded hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-[18px] text-[#757684] dark:text-white/40">{collapsed ? "chevron_right" : "chevron_left"}</span>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
            {NAV.map((item) => {
              const active = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all duration-300 ${
                    active
                      ? "bg-white/[0.1] dark:bg-white/[0.08] text-[#0e329f] dark:text-[#b8c4ff] font-medium shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),0_0_12px_rgba(75,102,209,0.1)] border border-white/[0.1]"
                      : "text-[#444653] dark:text-white/50 hover:bg-white/[0.06] dark:hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${active ? "" : "opacity-70"}`}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom — user */}
          <div className="border-t border-white/[0.06] p-3">
            <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-7 h-7",
                  },
                }}
              />
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-[13px] font-medium dark:text-white truncate">My Workspace</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </AuroraBackground>
  );
}
