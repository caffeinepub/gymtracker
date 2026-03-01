import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, Cpu, Dumbbell, Flame, Loader2, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Variant_get_fit_lose_weight_build_muscle,
  Variant_intermediate_beginner_advanced,
} from "../backend.d";
import {
  useInitializeWorkoutPlans,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";

interface OnboardingPageProps {
  onComplete: () => void;
}

const fitnessLevels = [
  {
    value: Variant_intermediate_beginner_advanced.beginner,
    label: "Beginner",
    desc: "Just getting started",
    icon: "🌱",
  },
  {
    value: Variant_intermediate_beginner_advanced.intermediate,
    label: "Intermediate",
    desc: "6+ months experience",
    icon: "💪",
  },
  {
    value: Variant_intermediate_beginner_advanced.advanced,
    label: "Advanced",
    desc: "2+ years training",
    icon: "🏆",
  },
];

const goals = [
  {
    value: Variant_get_fit_lose_weight_build_muscle.lose_weight,
    label: "Lose Weight",
    desc: "Burn fat and get leaner",
    icon: Flame,
  },
  {
    value: Variant_get_fit_lose_weight_build_muscle.build_muscle,
    label: "Build Muscle",
    desc: "Gain strength and size",
    icon: Dumbbell,
  },
  {
    value: Variant_get_fit_lose_weight_build_muscle.get_fit,
    label: "Get Fit",
    desc: "Improve overall fitness",
    icon: Cpu,
  },
];

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState(0);
  const [fitnessLevel, setFitnessLevel] =
    useState<Variant_intermediate_beginner_advanced>(
      Variant_intermediate_beginner_advanced.beginner,
    );
  const [goal, setGoal] = useState<Variant_get_fit_lose_weight_build_muscle>(
    Variant_get_fit_lose_weight_build_muscle.get_fit,
  );
  const [age, setAge] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");

  const saveProfile = useSaveCallerUserProfile();
  const initPlans = useInitializeWorkoutPlans();

  const handleSubmit = async () => {
    if (!age || !weightKg || !heightCm) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await saveProfile.mutateAsync({
        fitnessLevel,
        goal,
        age: BigInt(Number.parseInt(age, 10)),
        weightKg: Number.parseFloat(weightKg),
        heightCm: Number.parseFloat(heightCm),
      });

      await initPlans.mutateAsync();
      onComplete();
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const isPending = saveProfile.isPending || initPlans.isPending;

  const slideVariants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.97 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.97 0 0) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-8 blur-[100px] pointer-events-none"
        style={{ background: "oklch(0.88 0.2 128)" }}
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <img
            src="/assets/generated/gymtracker-logo-transparent.dim_120x120.png"
            alt="GymTracker"
            className="w-8 h-8"
          />
          <span className="font-display text-lg font-bold text-lime">
            GymTracker
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-lime" : "bg-border"
              } ${i === step ? "w-8" : "w-4"}`}
            />
          ))}
        </div>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h1 className="font-display text-4xl font-black mb-2">
                  Welcome, Athlete.
                </h1>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Let's set up your profile so we can build the perfect workout
                  plan for you.
                </p>

                <div className="space-y-3 mb-8">
                  <p className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">
                    What's your fitness level?
                  </p>
                  {fitnessLevels.map((level) => (
                    <button
                      type="button"
                      key={level.value}
                      onClick={() => setFitnessLevel(level.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                        fitnessLevel === level.value
                          ? "border-lime bg-lime/10 shadow-lime-glow-sm"
                          : "border-border bg-card hover:border-muted-foreground/40"
                      }`}
                    >
                      <span className="text-2xl">{level.icon}</span>
                      <div>
                        <p className="font-display font-bold text-sm">
                          {level.label}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {level.desc}
                        </p>
                      </div>
                      {fitnessLevel === level.value && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-lime" />
                      )}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => setStep(1)}
                  className="w-full bg-lime text-primary-foreground hover:bg-lime-dim font-display font-bold py-6 rounded-xl shadow-lime-glow"
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h1 className="font-display text-4xl font-black mb-2">
                  What's your goal?
                </h1>
                <p className="text-muted-foreground mb-8">
                  We'll tailor your workout plan to match your objective.
                </p>

                <div className="space-y-3 mb-8">
                  {goals.map((g) => (
                    <button
                      type="button"
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                        goal === g.value
                          ? "border-lime bg-lime/10 shadow-lime-glow-sm"
                          : "border-border bg-card hover:border-muted-foreground/40"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          goal === g.value ? "bg-lime/20" : "bg-muted"
                        }`}
                      >
                        <g.icon
                          className={`w-5 h-5 ${goal === g.value ? "text-lime" : "text-muted-foreground"}`}
                        />
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm">
                          {g.label}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {g.desc}
                        </p>
                      </div>
                      {goal === g.value && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-lime" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(0)}
                    className="flex-1 border-border py-6 rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-lime text-primary-foreground hover:bg-lime-dim font-display font-bold py-6 rounded-xl shadow-lime-glow"
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h1 className="font-display text-4xl font-black mb-2">
                  Your stats
                </h1>
                <p className="text-muted-foreground mb-8">
                  This helps us track your progress and give better
                  recommendations.
                </p>

                <div className="space-y-5 mb-8">
                  <div>
                    <Label
                      htmlFor="age"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block"
                    >
                      Age (years)
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min="13"
                      max="100"
                      placeholder="25"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="weight"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block"
                    >
                      Weight (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      min="30"
                      max="300"
                      step="0.1"
                      placeholder="75.0"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="height"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block"
                    >
                      Height (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      min="100"
                      max="250"
                      placeholder="175"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-border py-6 rounded-xl"
                    disabled={isPending}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex-1 bg-lime text-primary-foreground hover:bg-lime-dim font-display font-bold py-6 rounded-xl shadow-lime-glow"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Start Training
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
