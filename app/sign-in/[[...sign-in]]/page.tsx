"use client";

import { SignIn } from "@clerk/nextjs";
import { AuroraBackground } from "@/components/ui/aurora-background";

export default function SignInPage() {
  return (
    <AuroraBackground className="!min-h-screen !items-center !justify-center" showRadialGradient>
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="material-symbols-outlined text-[#b8c4ff] text-[28px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            rowing
          </span>
          <span className="font-mono text-[18px] font-semibold lowercase tracking-tight text-white">
            rewind
          </span>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/20",
              headerTitle: "text-white",
              headerSubtitle: "text-white/50",
              socialButtonsBlockButton: "bg-white/[0.06] border-white/10 text-white hover:bg-white/10",
              socialButtonsBlockButtonText: "text-white",
              formFieldLabel: "text-white/70",
              formFieldInput: "bg-white/[0.06] border-white/10 text-white placeholder:text-white/30",
              footerActionLink: "text-[#b8c4ff] hover:text-[#d0d8ff]",
              formButtonPrimary: "bg-[#0e329f] hover:bg-[#1240c4] text-white",
              dividerLine: "bg-white/10",
              dividerText: "text-white/30",
              identityPreviewText: "text-white",
              identityPreviewEditButton: "text-[#b8c4ff]",
              formFieldAction: "text-[#b8c4ff]",
              footer: "hidden",
              internal: "text-white/60",
            },
          }}
        />
      </div>
    </AuroraBackground>
  );
}
