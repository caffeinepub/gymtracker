import { Button } from "@/components/ui/button";
import { Brain, Camera, Loader2, TrendingUp, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    icon: TrendingUp,
    title: "Track Every Rep",
    desc: "Log exercises, sets, reps, and weight across every session",
  },
  {
    icon: Camera,
    title: "Visual Progress",
    desc: "Upload progress photos and watch your transformation unfold",
  },
  {
    icon: Brain,
    title: "AI Coach",
    desc: "Get personalized workout plans and answers to your fitness questions",
  },
];

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.97 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.97 0 0) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow spot */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ background: "oklch(0.88 0.2 128)" }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-6 py-5">
        <img
          src="/assets/generated/gymtracker-logo-transparent.dim_120x120.png"
          alt="GymTracker"
          className="w-9 h-9"
        />
        <span className="font-display text-xl font-bold tracking-tight text-lime">
          GymTracker
        </span>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-xl w-full"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-lime/10 border border-lime/30 text-lime text-xs font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wider uppercase">
            <Zap className="w-3 h-3" />
            Your Gym Journey Starts Here
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-black text-foreground leading-[0.95] tracking-tight mb-6">
            Train Hard.
            <br />
            <span className="text-lime">Track Everything.</span>
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-md mx-auto">
            Log workouts, track your weight journey, upload progress photos, and
            get AI-powered advice — all in one place.
          </p>

          <Button
            onClick={() => login()}
            disabled={isLoggingIn}
            className="bg-lime text-primary-foreground hover:bg-lime-dim font-display font-bold text-base px-8 py-6 rounded-xl shadow-lime-glow hover:shadow-lime-glow transition-all duration-300 active:scale-95"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Get Started — It's Free
              </>
            )}
          </Button>

          <p className="text-muted-foreground text-xs mt-4">
            Secure login via Internet Identity — no email required
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full max-w-2xl"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-card border border-border rounded-xl p-5 text-left"
            >
              <div className="w-9 h-9 bg-lime/10 border border-lime/20 rounded-lg flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4 text-lime" />
              </div>
              <h3 className="font-display font-bold text-sm mb-1.5">
                {f.title}
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-muted-foreground text-xs">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-lime transition-colors"
        >
          Built with ♥ using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
