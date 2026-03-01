import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Layers,
  ListChecks,
  Target,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { WorkoutDay, WorkoutPlan } from "../backend.d";
import type {
  Variant_get_fit_lose_weight_build_muscle,
  Variant_intermediate_beginner_advanced,
} from "../backend.d";
import { useGetAllPlans, useGetRecommendedPlan } from "../hooks/useQueries";

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

const levelColors: Record<Variant_intermediate_beginner_advanced, string> = {
  beginner: "text-lime bg-lime/10 border-lime/20",
  intermediate: "text-orange bg-orange/10 border-orange/20",
  advanced:
    "text-destructive-foreground bg-destructive/10 border-destructive/20",
};

function DayCard({ day }: { day: WorkoutDay }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-lime/10 border border-lime/20 rounded-lg flex items-center justify-center">
            <Dumbbell className="w-3.5 h-3.5 text-lime" />
          </div>
          <span className="font-display font-bold text-sm">{day.day}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {day.exercises.length} exercises
          </span>
          {open ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-3 space-y-2">
              {day.exercises.map((ex) => (
                <div
                  key={`${ex.name}-${ex.sets}-${ex.reps}`}
                  className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                >
                  <span className="text-sm text-foreground font-medium">
                    {ex.name}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {ex.sets.toString()} sets × {ex.reps.toString()} reps
                    {ex.weightKg > 0 ? ` @ ${ex.weightKg}kg` : ""}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanView({
  plan,
  featured = false,
}: { plan: WorkoutPlan; featured?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${featured ? "border-lime/30 bg-card shadow-lime-glow-sm" : "border-border bg-card"}`}
    >
      {featured && (
        <div className="flex items-center gap-1.5 text-lime text-xs font-semibold mb-3">
          <Target className="w-3.5 h-3.5" />
          Your Recommended Plan
        </div>
      )}
      <h3 className="font-display font-black text-xl mb-2">{plan.name}</h3>
      <div className="flex gap-2 mb-5">
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${levelColors[plan.fitnessLevel]}`}
        >
          {levelLabels[plan.fitnessLevel]}
        </span>
        <span className="text-xs px-2.5 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-semibold">
          {goalLabels[plan.goal]}
        </span>
        <span className="text-xs px-2.5 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-semibold">
          {plan.days.length} days/week
        </span>
      </div>

      <div className="space-y-2">
        {plan.days.map((day) => (
          <DayCard key={day.day} day={day} />
        ))}
      </div>
    </div>
  );
}

export default function WorkoutPlanPage() {
  const { data: recommendedPlan, isLoading: planLoading } =
    useGetRecommendedPlan();
  const { data: allPlans = [], isLoading: allLoading } = useGetAllPlans();
  const [showAll, setShowAll] = useState(false);

  const otherPlans = allPlans.filter((p) => p.name !== recommendedPlan?.name);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl font-black text-foreground mb-1">
          Workout Plan
        </h1>
        <p className="text-muted-foreground text-sm">
          Your personalized training program
        </p>
      </motion.div>

      {/* Recommended plan */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {planLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48 bg-muted" />
            <Skeleton className="h-48 bg-muted rounded-2xl" />
          </div>
        ) : recommendedPlan ? (
          <PlanView plan={recommendedPlan} featured />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <ListChecks className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-bold text-sm mb-1">
              No plan assigned yet
            </p>
            <p className="text-muted-foreground text-xs">
              Ask your AI Coach for a workout recommendation
            </p>
          </div>
        )}
      </motion.div>

      {/* View all plans toggle */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Button
          variant="outline"
          onClick={() => setShowAll((p) => !p)}
          className="w-full border-border bg-card hover:bg-muted font-display font-bold py-5 rounded-xl"
        >
          <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
          {showAll ? "Hide All Plans" : `Browse All Plans (${allPlans.length})`}
          {showAll ? (
            <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        <AnimatePresence>
          {showAll && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-4"
            >
              {allLoading ? (
                <div className="space-y-4">
                  {[0, 1].map((i) => (
                    <Skeleton key={i} className="h-32 bg-muted rounded-2xl" />
                  ))}
                </div>
              ) : otherPlans.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">
                  No additional plans available
                </p>
              ) : (
                <div className="space-y-4">
                  {otherPlans.map((plan) => (
                    <PlanView key={plan.name} plan={plan} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
