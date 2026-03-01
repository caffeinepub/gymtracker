import { useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Dumbbell,
  LayoutDashboard,
  ListChecks,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export type ActiveTab = "dashboard" | "log" | "progress" | "coach" | "plan";

interface LayoutProps {
  children: ReactNode;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const tabs: { id: ActiveTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "log", label: "Log", icon: Dumbbell },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "coach", label: "AI Coach", icon: Brain },
  { id: "plan", label: "Plan", icon: ListChecks },
];

export default function Layout({
  children,
  activeTab,
  onTabChange,
}: LayoutProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/generated/gymtracker-logo-transparent.dim_120x120.png"
              alt="GymTracker"
              className="w-7 h-7"
            />
            <span className="font-display font-bold text-base text-lime">
              GymTracker
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="max-w-2xl mx-auto px-2 flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-1 relative transition-colors duration-200 ${
                  isActive
                    ? "text-lime"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={tab.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-lime rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
