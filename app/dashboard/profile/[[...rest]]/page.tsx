"use client";

import { useUser } from "@clerk/nextjs";
import { UserProfile } from "@clerk/nextjs";

export default function ProfilePage() {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-14 flex items-center px-6 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex-shrink-0">
        <h1 className="text-[16px] font-semibold dark:text-white">Profile</h1>
      </header>

      <div className="p-6 flex justify-center">
        {!isLoaded ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined text-[40px] text-white/20 animate-spin">progress_activity</span>
          </div>
        ) : isSignedIn ? (
          <UserProfile
            appearance={{
              elements: {
                footer: "hidden",
                badge: "hidden",
                userProfile: "shadow-none",
              },
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
