"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  themeColor?: string;
  href?: string;
  noPadding?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, themeColor, href, noPadding, ...props }, ref) => {
    const cardContent = (
      <div
        ref={ref}
        style={
          themeColor
            ? ({ "--theme-color": themeColor } as React.CSSProperties)
            : undefined
        }
        className={cn(
          "group relative rounded-2xl overflow-hidden",
          "bg-white/[0.04] dark:bg-white/[0.03]",
          "backdrop-blur-xl",
          "border border-white/[0.08] dark:border-white/[0.06]",
          "shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.1),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.06)]",
          "dark:shadow-[0_0_8px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.15),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.08),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.04)]",
          "transition-all duration-500 ease-in-out",
          "hover:shadow-[0_0_20px_rgba(75,102,209,0.1),0_4px_16px_rgba(0,0,0,0.1),inset_1px_1px_2px_-0.5px_rgba(255,255,255,0.15)]",
          "dark:hover:shadow-[0_0_30px_rgba(75,102,209,0.08),0_4px_20px_rgba(0,0,0,0.2),inset_1px_1px_2px_-0.5px_rgba(255,255,255,0.1)]",
          "hover:border-white/[0.12] dark:hover:border-white/[0.1]",
          "hover:scale-[1.01]",
          !noPadding && "p-5",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-white/[0.02] dark:from-white/[0.03] dark:to-transparent pointer-events-none rounded-2xl" />
        <div className="relative z-10">{children}</div>
      </div>
    );

    if (href) {
      return (
        <a href={href} className="block">
          {cardContent}
        </a>
      );
    }

    return cardContent;
  }
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
