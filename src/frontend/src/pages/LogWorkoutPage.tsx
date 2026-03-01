import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Dumbbell, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddSession, useGetSessions } from "../hooks/useQueries";

interface ExerciseRow {
  id: number;
  name: string;
  sets: string;
  reps: string;
  weightKg: string;
}

let rowIdCounter = 0;

function newRow(): ExerciseRow {
  return { id: ++rowIdCounter, name: "", sets: "3", reps: "10", weightKg: "0" };
}

export default function LogWorkoutPage() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [exercises, setExercises] = useState<ExerciseRow[]>([newRow()]);

  const addSession = useAddSession();
  const { data: sessions = [], isLoading: sessionsLoading } = useGetSessions();

  const addExercise = () => {
    setExercises((prev) => [...prev, newRow()]);
  };

  const removeExercise = (id: number) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const updateExercise = (
    id: number,
    field: keyof ExerciseRow,
    value: string,
  ) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };

  const handleSave = async () => {
    const valid = exercises.filter((e) => e.name.trim());
    if (!valid.length) {
      toast.error("Add at least one exercise with a name");
      return;
    }

    const dateMs = new Date(`${date}T12:00:00`).getTime();

    try {
      await addSession.mutateAsync({
        date: BigInt(dateMs * 1_000_000),
        exercises: valid.map((e) => ({
          name: e.name.trim(),
          sets: BigInt(Number.parseInt(e.sets) || 1),
          reps: BigInt(Number.parseInt(e.reps) || 1),
          weightKg: Number.parseFloat(e.weightKg) || 0,
        })),
      });

      toast.success("Session saved! 💪");
      setExercises([newRow()]);
      setDate(today);
    } catch {
      toast.error("Failed to save session. Try again.");
    }
  };

  const recentSessions = [...sessions]
    .sort((a, b) => Number(b.date) - Number(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl font-black text-foreground mb-1">
          Log Workout
        </h1>
        <p className="text-muted-foreground text-sm">
          Record your exercises for this session
        </p>
      </motion.div>

      {/* Log form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-card-depth"
      >
        {/* Date picker */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-lime/10 border border-lime/20 rounded-lg flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-lime" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Session Date
            </p>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-foreground font-display font-bold text-sm border-none outline-none focus:ring-0 p-0"
            />
          </div>
        </div>

        <div className="border-t border-border mb-5" />

        {/* Exercise label row */}
        <div className="grid grid-cols-12 gap-2 mb-2 px-1">
          <p className="col-span-5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Exercise
          </p>
          <p className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
            Sets
          </p>
          <p className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
            Reps
          </p>
          <p className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
            kg
          </p>
          <p className="col-span-1" />
        </div>

        {/* Exercise rows */}
        <div className="space-y-2">
          <AnimatePresence>
            {exercises.map((ex) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-12 gap-2 items-center"
              >
                <Input
                  className="col-span-5 bg-background border-border text-foreground placeholder:text-muted-foreground h-9 rounded-lg text-sm"
                  placeholder="Bench Press"
                  value={ex.name}
                  onChange={(e) =>
                    updateExercise(ex.id, "name", e.target.value)
                  }
                />
                <Input
                  className="col-span-2 bg-background border-border text-foreground text-center h-9 rounded-lg text-sm"
                  type="number"
                  min="1"
                  value={ex.sets}
                  onChange={(e) =>
                    updateExercise(ex.id, "sets", e.target.value)
                  }
                />
                <Input
                  className="col-span-2 bg-background border-border text-foreground text-center h-9 rounded-lg text-sm"
                  type="number"
                  min="1"
                  value={ex.reps}
                  onChange={(e) =>
                    updateExercise(ex.id, "reps", e.target.value)
                  }
                />
                <Input
                  className="col-span-2 bg-background border-border text-foreground text-center h-9 rounded-lg text-sm"
                  type="number"
                  min="0"
                  step="0.5"
                  value={ex.weightKg}
                  onChange={(e) =>
                    updateExercise(ex.id, "weightKg", e.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() => removeExercise(ex.id)}
                  className="col-span-1 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors h-9"
                  aria-label="Remove exercise"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add exercise */}
        <button
          type="button"
          onClick={addExercise}
          className="mt-4 flex items-center gap-2 text-lime hover:text-lime-dim text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Exercise
        </button>

        <div className="border-t border-border mt-5 mb-5" />

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={addSession.isPending}
          className="w-full bg-lime text-primary-foreground hover:bg-lime-dim font-display font-bold py-5 rounded-xl shadow-lime-glow text-sm"
        >
          {addSession.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Session
            </>
          )}
        </Button>
      </motion.div>

      {/* Session history */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Session History
        </h2>

        {sessionsLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full bg-muted rounded-xl" />
            ))}
          </div>
        ) : recentSessions.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No sessions logged yet
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => {
              const date = new Date(Number(session.date) / 1_000_000);
              const dayStr = date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={session.date.toString()}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-display font-bold text-sm">{dayStr}</p>
                    <span className="text-xs bg-lime/10 text-lime px-2 py-0.5 rounded-full font-semibold">
                      {session.exercises.length} exercises
                    </span>
                  </div>
                  <div className="space-y-1">
                    {session.exercises.slice(0, 4).map((ex) => (
                      <div
                        key={`${ex.name}-${ex.sets}-${ex.reps}`}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-foreground/80 font-medium">
                          {ex.name}
                        </span>
                        <span className="text-muted-foreground">
                          {ex.sets.toString()} × {ex.reps.toString()}
                          {ex.weightKg > 0 ? ` @ ${ex.weightKg}kg` : ""}
                        </span>
                      </div>
                    ))}
                    {session.exercises.length > 4 && (
                      <p className="text-muted-foreground text-xs">
                        +{session.exercises.length - 4} more
                      </p>
                    )}
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
