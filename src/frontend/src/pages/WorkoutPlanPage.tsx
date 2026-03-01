import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Layers,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { CustomWorkoutPlan, WorkoutDay, WorkoutPlan } from "../backend.d";
import type {
  Variant_get_fit_lose_weight_build_muscle,
  Variant_intermediate_beginner_advanced,
} from "../backend.d";
import {
  useDeleteCustomPlan,
  useGetAllPlans,
  useGetCustomPlans,
  useGetRecommendedPlan,
  useSaveCustomPlan,
} from "../hooks/useQueries";

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

// ─── Form Types ───────────────────────────────────────────────────────────────

interface ExerciseFormData {
  _id: string;
  name: string;
  sets: string;
  reps: string;
  weightKg: string;
}

interface DayFormData {
  _id: string;
  day: string;
  exercises: ExerciseFormData[];
}

interface PlanFormData {
  name: string;
  days: DayFormData[];
}

function emptyExercise(): ExerciseFormData {
  return {
    _id: crypto.randomUUID(),
    name: "",
    sets: "3",
    reps: "10",
    weightKg: "0",
  };
}

function emptyDay(): DayFormData {
  return { _id: crypto.randomUUID(), day: "", exercises: [emptyExercise()] };
}

function emptyPlan(): PlanFormData {
  return { name: "", days: [emptyDay()] };
}

function planToFormData(plan: CustomWorkoutPlan): PlanFormData {
  return {
    name: plan.name,
    days: plan.days.map((d) => ({
      _id: crypto.randomUUID(),
      day: d.day,
      exercises: d.exercises.map((e) => ({
        _id: crypto.randomUUID(),
        name: e.name,
        sets: e.sets.toString(),
        reps: e.reps.toString(),
        weightKg: e.weightKg.toString(),
      })),
    })),
  };
}

// ─── Custom Plan Form Dialog ──────────────────────────────────────────────────

function CustomPlanDialog({
  open,
  onClose,
  existingPlan,
}: {
  open: boolean;
  onClose: () => void;
  existingPlan?: CustomWorkoutPlan;
}) {
  const [form, setForm] = useState<PlanFormData>(() =>
    existingPlan ? planToFormData(existingPlan) : emptyPlan(),
  );

  const savePlan = useSaveCustomPlan();

  function updatePlanName(value: string) {
    setForm((prev) => ({ ...prev, name: value }));
  }

  function updateDayName(dayIdx: number, value: string) {
    setForm((prev) => {
      const days = prev.days.map((d, i) =>
        i === dayIdx ? { ...d, day: value } : d,
      );
      return { ...prev, days };
    });
  }

  function addDay() {
    setForm((prev) => ({ ...prev, days: [...prev.days, emptyDay()] }));
  }

  function removeDay(dayIdx: number) {
    setForm((prev) => ({
      ...prev,
      days: prev.days.filter((_, i) => i !== dayIdx),
    }));
  }

  function addExercise(dayIdx: number) {
    setForm((prev) => {
      const days = prev.days.map((d, i) =>
        i === dayIdx
          ? { ...d, exercises: [...d.exercises, emptyExercise()] }
          : d,
      );
      return { ...prev, days };
    });
  }

  function removeExercise(dayIdx: number, exIdx: number) {
    setForm((prev) => {
      const days = prev.days.map((d, i) =>
        i === dayIdx
          ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) }
          : d,
      );
      return { ...prev, days };
    });
  }

  function updateExercise(
    dayIdx: number,
    exIdx: number,
    field: keyof ExerciseFormData,
    value: string,
  ) {
    setForm((prev) => {
      const days = prev.days.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              exercises: d.exercises.map((e, j) =>
                j === exIdx ? { ...e, [field]: value } : e,
              ),
            }
          : d,
      );
      return { ...prev, days };
    });
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Plan name is required");
      return;
    }
    if (form.days.length === 0) {
      toast.error("Add at least one training day");
      return;
    }
    for (const day of form.days) {
      if (!day.day.trim()) {
        toast.error("Every day needs a name");
        return;
      }
      if (day.exercises.length === 0) {
        toast.error(`Add at least one exercise to "${day.day}"`);
        return;
      }
      for (const ex of day.exercises) {
        if (!ex.name.trim()) {
          toast.error("Every exercise needs a name");
          return;
        }
      }
    }

    const plan: CustomWorkoutPlan = {
      id: existingPlan?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      days: form.days.map((d) => ({
        day: d.day.trim(),
        exercises: d.exercises.map((e) => ({
          name: e.name.trim(),
          sets: BigInt(Math.max(1, Number.parseInt(e.sets) || 1)),
          reps: BigInt(Math.max(1, Number.parseInt(e.reps) || 1)),
          weightKg: Number.parseFloat(e.weightKg) || 0,
        })),
      })),
    };

    try {
      await savePlan.mutateAsync(plan);
      toast.success(existingPlan ? "Plan updated!" : "Plan created!");
      onClose();
    } catch {
      toast.error("Failed to save plan. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display font-black text-xl">
            {existingPlan ? "Edit Plan" : "Create Custom Plan"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Plan name */}
          <div className="space-y-1.5">
            <Label htmlFor="plan-name" className="text-sm font-semibold">
              Plan Name
            </Label>
            <Input
              id="plan-name"
              placeholder="e.g. My Push Pull Legs"
              value={form.name}
              onChange={(e) => updatePlanName(e.target.value)}
              className="bg-background border-border"
            />
          </div>

          {/* Days */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Training Days</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addDay}
                className="text-lime hover:text-lime hover:bg-lime/10 h-8 px-3 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Day
              </Button>
            </div>

            {form.days.map((day, dayIdx) => (
              <div
                key={day._id}
                className="border border-border rounded-xl p-4 space-y-3 bg-background/50"
              >
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Monday, Push Day, Day 1"
                    value={day.day}
                    onChange={(e) => updateDayName(dayIdx, e.target.value)}
                    className="bg-background border-border text-sm flex-1"
                  />
                  {form.days.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDay(dayIdx)}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Exercises */}
                <div className="space-y-2">
                  {day.exercises.map((ex, exIdx) => (
                    <div key={ex._id} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Exercise name"
                          value={ex.name}
                          onChange={(e) =>
                            updateExercise(
                              dayIdx,
                              exIdx,
                              "name",
                              e.target.value,
                            )
                          }
                          className="bg-background border-border text-sm flex-1"
                        />
                        {day.exercises.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExercise(dayIdx, exIdx)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Sets
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="3"
                            value={ex.sets}
                            onChange={(e) =>
                              updateExercise(
                                dayIdx,
                                exIdx,
                                "sets",
                                e.target.value,
                              )
                            }
                            className="bg-background border-border text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Reps
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="10"
                            value={ex.reps}
                            onChange={(e) =>
                              updateExercise(
                                dayIdx,
                                exIdx,
                                "reps",
                                e.target.value,
                              )
                            }
                            className="bg-background border-border text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Weight (kg)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.5}
                            placeholder="0"
                            value={ex.weightKg}
                            onChange={(e) =>
                              updateExercise(
                                dayIdx,
                                exIdx,
                                "weightKg",
                                e.target.value,
                              )
                            }
                            className="bg-background border-border text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addExercise(dayIdx)}
                    className="text-lime hover:text-lime hover:bg-lime/10 h-7 px-2 text-xs font-semibold w-full border border-dashed border-lime/30"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Exercise
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={savePlan.isPending}
            className="border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={savePlan.isPending}
            className="bg-lime text-background hover:bg-lime/90 font-bold"
          >
            {savePlan.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : existingPlan ? (
              "Update Plan"
            ) : (
              "Create Plan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Custom Plan Card ─────────────────────────────────────────────────────────

function CustomPlanCard({
  plan,
  onEdit,
}: {
  plan: CustomWorkoutPlan;
  onEdit: (plan: CustomWorkoutPlan) => void;
}) {
  const deletePlan = useDeleteCustomPlan();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleDelete() {
    try {
      await deletePlan.mutateAsync(plan.id);
      toast.success("Plan deleted");
      setConfirmDelete(false);
    } catch {
      toast.error("Failed to delete plan");
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Card header */}
        <div className="px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-display font-black text-base truncate">
              {plan.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {plan.days.length} training{" "}
              {plan.days.length === 1 ? "day" : "days"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(plan)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmDelete(true)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center justify-between px-5 py-2.5 border-t border-border bg-muted/40 hover:bg-muted transition-colors text-xs text-muted-foreground"
          aria-expanded={expanded}
        >
          <span>{expanded ? "Hide days" : "Show days"}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border px-5 py-4 space-y-2">
                {plan.days.map((day) => (
                  <DayCard key={day.day} day={day} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display font-black">
              Delete Plan?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{plan.name}</span>?
            This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={deletePlan.isPending}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deletePlan.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
            >
              {deletePlan.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkoutPlanPage() {
  const { data: recommendedPlan, isLoading: planLoading } =
    useGetRecommendedPlan();
  const { data: allPlans = [], isLoading: allLoading } = useGetAllPlans();
  const { data: customPlans = [], isLoading: customLoading } =
    useGetCustomPlans();
  const [showAll, setShowAll] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CustomWorkoutPlan | undefined>(
    undefined,
  );

  const otherPlans = allPlans.filter((p) => p.name !== recommendedPlan?.name);

  function handleEdit(plan: CustomWorkoutPlan) {
    setEditingPlan(plan);
  }

  function closeDialog() {
    setCreateOpen(false);
    setEditingPlan(undefined);
  }

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

      {/* My Custom Plans */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="space-y-4"
      >
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-xl text-foreground">
              My Plans
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Build and manage your own workout plans
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-lime text-background hover:bg-lime/90 font-bold text-sm h-9 px-4 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Plan
          </Button>
        </div>

        {/* Plans list */}
        {customLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-20 bg-muted rounded-2xl" />
            ))}
          </div>
        ) : customPlans.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
            <div className="w-10 h-10 bg-lime/10 border border-lime/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-5 h-5 text-lime" />
            </div>
            <p className="font-display font-bold text-sm mb-1">
              No custom plans yet
            </p>
            <p className="text-muted-foreground text-xs mb-4">
              Create your first plan tailored exactly to your needs
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              variant="outline"
              className="border-lime/30 text-lime hover:bg-lime/10 hover:text-lime text-sm font-bold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Your First Plan
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {customPlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <CustomPlanCard plan={plan} onEdit={handleEdit} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </motion.div>

      {/* Create / Edit dialog */}
      <CustomPlanDialog
        open={createOpen || !!editingPlan}
        onClose={closeDialog}
        existingPlan={editingPlan}
      />
    </div>
  );
}
