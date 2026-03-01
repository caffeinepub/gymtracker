import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import Layout, { type ActiveTab } from "./components/Layout";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import AICoachPage from "./pages/AICoachPage";
import DashboardPage from "./pages/DashboardPage";
import LogWorkoutPage from "./pages/LogWorkoutPage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProgressPage from "./pages/ProgressPage";
import WorkoutPlanPage from "./pages/WorkoutPlanPage";

function AppContent() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  // Not logged in
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Loading profile (waiting for actor + query)
  if (profileLoading || !isFetched) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-lime/10 border border-lime/20 rounded-xl flex items-center justify-center animate-pulse-lime">
            <img
              src="/assets/generated/gymtracker-logo-transparent.dim_120x120.png"
              alt="GymTracker"
              className="w-7 h-7"
            />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 bg-muted" />
            <Skeleton className="h-2 w-24 bg-muted mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Onboarding (no profile yet)
  const showOnboarding = isAuthenticated && isFetched && profile === null;
  if (showOnboarding) {
    return <OnboardingPage onComplete={() => {}} />;
  }

  // Main app
  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "dashboard" && (
        <DashboardPage onTabChange={setActiveTab} />
      )}
      {activeTab === "log" && <LogWorkoutPage />}
      {activeTab === "progress" && <ProgressPage />}
      {activeTab === "coach" && <AICoachPage />}
      {activeTab === "plan" && <WorkoutPlanPage />}
    </Layout>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.14 0.007 260)",
            border: "1px solid oklch(0.22 0.01 260)",
            color: "oklch(0.97 0 0)",
            fontFamily: "Sora, sans-serif",
          },
        }}
      />
      <AppContent />
    </>
  );
}
