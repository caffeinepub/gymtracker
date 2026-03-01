import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Loader2,
  Send,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { WorkoutPlan } from "../backend.d";
import { useAskAI } from "../hooks/useQueries";

interface ChatMessage {
  id: number;
  role: "user" | "ai";
  content: string;
  recommendedPlan?: WorkoutPlan;
}

const SUGGESTED_QUESTIONS = [
  "What workout should I do?",
  "How do I lose weight?",
  "Tips for beginners",
  "How much protein do I need?",
];

let msgId = 0;

function PlanCard({ plan }: { plan: WorkoutPlan }) {
  const [expanded, setExpanded] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null);

  return (
    <div className="mt-3 bg-background border border-lime/30 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div>
          <p className="font-display font-bold text-sm text-lime">
            {plan.name}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {plan.days.length} training days
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-lime" />
        ) : (
          <ChevronDown className="w-4 h-4 text-lime" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pb-4 pt-2 space-y-2">
              {plan.days.map((day) => (
                <div
                  key={day.day}
                  className="rounded-lg border border-border overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDay((prev) => (prev === day.day ? null : day.day))
                    }
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-card"
                  >
                    <span className="font-display font-bold text-xs">
                      {day.day}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {day.exercises.length} exercises
                    </span>
                  </button>
                  {openDay === day.day && (
                    <div className="px-3 pb-2 space-y-1 border-t border-border">
                      {day.exercises.map((ex) => (
                        <div
                          key={`${ex.name}-${ex.sets}-${ex.reps}`}
                          className="flex items-center justify-between py-1"
                        >
                          <span className="text-xs text-foreground/80 font-medium">
                            {ex.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {ex.sets.toString()} × {ex.reps.toString()}
                            {ex.weightKg > 0 ? ` @ ${ex.weightKg}kg` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AICoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: ++msgId,
      role: "ai",
      content:
        "Hey! I'm your AI Coach 🏋️. Ask me anything about training, nutrition, form, or just tell me your goals and I'll recommend the perfect workout plan for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const askAI = useAskAI();

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || askAI.isPending) return;

    const userMsg: ChatMessage = {
      id: ++msgId,
      role: "user",
      content: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const response = await askAI.mutateAsync(text.trim());

      const aiMsg: ChatMessage = {
        id: ++msgId,
        role: "ai",
        content: response.message,
        recommendedPlan: response.recommendedPlan,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: ++msgId,
        role: "ai",
        content: "Sorry, I ran into an issue. Please try again!",
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-4 shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lime/10 border border-lime/30 rounded-xl flex items-center justify-center animate-pulse-lime">
            <Brain className="w-5 h-5 text-lime" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-foreground leading-none">
              AI Coach
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Powered by smart fitness knowledge
            </p>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "ai"
                    ? "bg-lime/10 border border-lime/30"
                    : "bg-muted border border-border"
                }`}
              >
                {msg.role === "ai" ? (
                  <Zap className="w-3.5 h-3.5 text-lime" />
                ) : (
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-lime text-primary-foreground rounded-tr-sm font-medium"
                      : "bg-card border border-border text-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.recommendedPlan && (
                  <div className="w-full">
                    <PlanCard plan={msg.recommendedPlan} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {askAI.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-lime" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <Skeleton className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                <Skeleton className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                <Skeleton className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="shrink-0 pb-3">
          <p className="text-muted-foreground text-xs font-semibold mb-2 uppercase tracking-wider">
            Suggested
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => sendMessage(q)}
                disabled={askAI.isPending}
                className="bg-card border border-border hover:border-lime/40 hover:bg-lime/5 text-foreground/80 text-xs px-3 py-1.5 rounded-full font-medium transition-all disabled:opacity-50"
              >
                <Dumbbell className="w-3 h-3 inline-block mr-1.5 text-lime" />
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 flex gap-2 pt-2 border-t border-border">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your AI coach..."
          disabled={askAI.isPending}
          className="flex-1 bg-card border-border text-foreground placeholder:text-muted-foreground h-11 rounded-xl text-sm"
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || askAI.isPending}
          className="bg-lime text-primary-foreground hover:bg-lime-dim font-bold h-11 px-4 rounded-xl shadow-lime-glow-sm disabled:opacity-40"
        >
          {askAI.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
