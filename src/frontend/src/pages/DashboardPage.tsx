import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  Calendar,
  ChevronRight,
  Dumbbell,
  Flame,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import type {
  Variant_get_fit_lose_weight_build_muscle,
  Variant_intermediate_beginner_advanced,
} from "../backend.d";
import type { ActiveTab } from "../components/Layout";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { useGetSessions } from "../hooks/useQueries";
import { useGetWeightHistory } from "../hooks/useQueries";

interface DashboardPageProps {
  onTabChange: (tab: ActiveTab) => void;
}

function calcStreak(sessions: { date: bigint }[]): number {
  if (!sessions.length) return 0;

  const now = Date.now();
  const dayMs = 86400000;

  const days = new Set(
    sessions.map((s) => {
      const d = new Date(Number(s.date) / 1_000_000);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }),
  );

  let streak = 0;
  let checkDay = new Date(now);
  checkDay.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    if (days.has(checkDay.getTime())) {
      streak++;
      checkDay = new Date(checkDay.getTime() - dayMs);
    } else if (i === 0) {
      // Skip today if no session yet today
      checkDay = new Date(checkDay.getTime() - dayMs);
    } else {
      break;
    }
  }

  return streak;
}

const levelLabels: Record<Variant_intermediate_beginner_advanced, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const goalLabels: Record<Variant_get_fit_lose_weight_build_muscle, string> = {
  lose_weight: "Lose Weight",
  build_muscle: "Build Muscle",
  get_fit: "Get Fit",
};

export default function DashboardPage({ onTabChange }: DashboardPageProps) {
  const { data: profile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const { data: sessions = [], isLoading: sessionsLoading } = useGetSessions();
  const { data: weights = [], isLoading: weightsLoading } =
    useGetWeightHistory();

  const recentSessions = [...sessions]
    .sort((a, b) => Number(b.date) - Number(a.date))
    .slice(0, 3);

  const latestWeight = weights.length
    ? [...weights].sort((a, b) => Number(b.date) - Number(a.date))[0].weightKg
    : (profile?.weightKg ?? null);

  const streak = calcStreak(sessions);

  const stats = [
    {
      label: "Sessions",
      value: sessions.length.toString(),
      icon: Dumbbell,
      color: "text-lime",
      bg: "bg-lime/10",
    },
    {
      label: "Curr. Weight",
      value: latestWeight ? `${latestWeight.toFixed(1)} kg` : "—",
      icon: TrendingUp,
      color: "text-orange",
      bg: "bg-orange/10",
    },
    {
      label: "Day Streak",
      value: `${streak} ${streak === 1 ? "day" : "days"}`,
      icon: Flame,
      color: "text-lime",
      bg: "bg-lime/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {profileLoading ? (
          <Skeleton className="h-10 w-48 bg-muted" />
        ) : (
          <div>
            <p className="text-muted-foreground text-sm font-medium mb-1">
              Welcome back 👋
            </p>
            <h1 className="font-display text-3xl font-black text-foreground">
              Athlete
            </h1>
            {profile && (
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-lime/10 text-lime border border-lime/20 px-2.5 py-0.5 rounded-full font-semibold">
                  {levelLabels[profile.fitnessLevel]}
                </span>
                <span className="text-xs bg-orange/10 text-orange border border-orange/20 px-2.5 py-0.5 rounded-full font-semibold">
                  {goalLabels[profile.goal]}
                </span>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-4 shadow-card-depth"
          >
            {sessionsLoading || weightsLoading ? (
              <Skeleton className="h-8 w-full bg-muted" />
            ) : (
              <>
                <div
                  className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center mb-2`}
                >
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="font-display font-black text-xl leading-none text-foreground">
                  {stat.value}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {stat.label}
                </p>
              </>
            )}
          </div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <h2 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={() => onTabChange("log")}
            className="w-full justify-between bg-lime text-primary-foreground hover:bg-lime-dim font-display font-bold py-6 rounded-xl shadow-lime-glow text-sm"
          >
            <span className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Log Today's Workout
            </span>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => onTabChange("progress")}
              className="justify-between border-border bg-card hover:bg-muted py-5 rounded-xl font-display font-bold text-sm"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange" />
                Log Weight
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onTabChange("coach")}
              className="justify-between border-border bg-card hover:bg-muted py-5 rounded-xl font-display font-bold text-sm"
            >
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-lime" />
                AI Coach
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Recent sessions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
            Recent Sessions
          </h2>
          <button
            type="button"
            onClick={() => onTabChange("log")}
            className="text-xs text-lime hover:text-lime-dim font-semibold"
          >
            View All
          </button>
        </div>

        {sessionsLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full bg-muted rounded-xl" />
            ))}
          </div>
        ) : recentSessions.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-bold text-sm mb-1">
              No sessions yet
            </p>
            <p className="text-muted-foreground text-xs">
              Log your first workout to get started
            </p>
            <Button
              onClick={() => onTabChange("log")}
              className="mt-4 bg-lime text-primary-foreground hover:bg-lime-dim font-display font-bold text-sm px-5 py-2 rounded-lg"
            >
              Log Workout
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => {
              const date = new Date(Number(session.date) / 1_000_000);
              const dayStr = date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              const sessionKey = session.date.toString();
              return (
                <div
                  key={sessionKey}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-lime/10 border border-lime/20 rounded-lg flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-lime" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-foreground">
                      {session.exercises.length} exercise
                      {session.exercises.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-muted-foreground text-xs">{dayStr}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {session.exercises
                        .map((e) => e.name)
                        .join(", ")
                        .slice(0, 30)}
                      {session.exercises.map((e) => e.name).join(", ").length >
                      30
                        ? "…"
                        : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
