import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  ImageIcon,
  Loader2,
  Minus,
  Plus,
  Scale,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  useAddProgressPhoto,
  useAddWeightEntry,
  useGetProgressPhotos,
  useGetWeightHistory,
} from "../hooks/useQueries";

function WeightTab() {
  const { data: weights = [], isLoading } = useGetWeightHistory();
  const addWeight = useAddWeightEntry();
  const [newWeight, setNewWeight] = useState("");

  const sortedWeights = [...weights].sort(
    (a, b) => Number(a.date) - Number(b.date),
  );

  const chartData = sortedWeights.map((w) => ({
    date: new Date(Number(w.date) / 1_000_000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    weight: w.weightKg,
  }));

  const latestWeight =
    sortedWeights.length > 0
      ? sortedWeights[sortedWeights.length - 1].weightKg
      : null;
  const prevWeight =
    sortedWeights.length > 1
      ? sortedWeights[sortedWeights.length - 2].weightKg
      : null;
  const diff =
    latestWeight !== null && prevWeight !== null
      ? latestWeight - prevWeight
      : null;

  const handleAddWeight = async () => {
    const val = Number.parseFloat(newWeight);
    if (Number.isNaN(val) || val <= 0) {
      toast.error("Enter a valid weight");
      return;
    }
    try {
      await addWeight.mutateAsync(val);
      toast.success("Weight logged!");
      setNewWeight("");
    } catch {
      toast.error("Failed to log weight");
    }
  };

  return (
    <div className="space-y-5">
      {/* Current weight card */}
      <div className="bg-card border border-border rounded-xl p-5">
        {isLoading ? (
          <Skeleton className="h-16 bg-muted" />
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
                Current Weight
              </p>
              <p className="font-display text-4xl font-black text-foreground">
                {latestWeight !== null ? `${latestWeight.toFixed(1)}` : "—"}
                <span className="text-lg text-muted-foreground font-normal ml-1">
                  kg
                </span>
              </p>
            </div>
            {diff !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
                  diff < 0
                    ? "bg-lime/10 text-lime"
                    : diff > 0
                      ? "bg-destructive/10 text-destructive-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {diff < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : diff > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
                {diff > 0 ? "+" : ""}
                {diff.toFixed(1)} kg
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      {!isLoading && chartData.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="font-display font-bold text-sm mb-4">
            Weight Over Time
          </p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.22 0.01 260)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "oklch(0.52 0.015 260)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "oklch(0.52 0.015 260)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.14 0.007 260)",
                    border: "1px solid oklch(0.22 0.01 260)",
                    borderRadius: "8px",
                    fontSize: 12,
                    color: "oklch(0.97 0 0)",
                  }}
                  itemStyle={{ color: "oklch(0.88 0.2 128)" }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="oklch(0.88 0.2 128)"
                  strokeWidth={2.5}
                  dot={{ fill: "oklch(0.88 0.2 128)", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: "oklch(0.88 0.2 128)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Log new weight */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="font-display font-bold text-sm mb-4">Log Weight</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label
              htmlFor="newWeight"
              className="text-xs text-muted-foreground mb-1.5 block"
            >
              Weight (kg)
            </Label>
            <Input
              id="newWeight"
              type="number"
              min="30"
              max="300"
              step="0.1"
              placeholder={latestWeight?.toString() ?? "75.0"}
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddWeight()}
              className="bg-background border-border text-foreground h-11 rounded-xl"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAddWeight}
              disabled={addWeight.isPending}
              className="bg-lime text-primary-foreground hover:bg-lime-dim font-display font-bold h-11 px-5 rounded-xl shadow-lime-glow-sm"
            >
              {addWeight.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Weight history list */}
      {!isLoading && sortedWeights.length > 0 && (
        <div>
          <p className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
            History
          </p>
          <div className="space-y-2">
            {[...sortedWeights]
              .reverse()
              .slice(0, 10)
              .map((entry) => {
                const date = new Date(Number(entry.date) / 1_000_000);
                return (
                  <div
                    key={entry.date.toString()}
                    className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Scale className="w-4 h-4 text-orange" />
                      <span className="text-sm text-muted-foreground">
                        {date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <span className="font-display font-bold text-foreground">
                      {entry.weightKg.toFixed(1)} kg
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotosTab() {
  const { data: photos = [], isLoading } = useGetProgressPhotos();
  const addPhoto = useAddProgressPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const sortedPhotos = [...photos].sort(
    (a, b) => Number(b.date) - Number(a.date),
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Simulate progress feedback
      const interval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 15, 90));
      }, 200);

      await addPhoto.mutateAsync({
        bytes,
        note: note.trim() || null,
      });

      clearInterval(interval);
      setUploadProgress(100);

      toast.success("Progress photo uploaded! 📸");
      setNote("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Failed to upload photo. Try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-5">
      {/* Upload section */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="font-display font-bold text-sm mb-4">
          Upload Progress Photo
        </p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Note (optional)
            </Label>
            <Textarea
              placeholder="Feeling stronger today..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl resize-none h-16 text-sm"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-lime text-primary-foreground hover:bg-lime-dim font-display font-bold py-5 rounded-xl shadow-lime-glow-sm"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Choose Photo
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Photos grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Camera className="w-4 h-4 text-muted-foreground" />
          <p className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
            Progress Gallery ({sortedPhotos.length})
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-square bg-muted rounded-xl" />
            ))}
          </div>
        ) : sortedPhotos.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-bold text-sm mb-1">No photos yet</p>
            <p className="text-muted-foreground text-xs">
              Upload your first progress photo to start tracking
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sortedPhotos.map((photo, i) => {
              const date = new Date(Number(photo.date) / 1_000_000);
              const dateStr = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              return (
                <motion.div
                  key={photo.date.toString()}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative group rounded-xl overflow-hidden bg-card border border-border aspect-square"
                >
                  <img
                    src={photo.blob.getDirectURL()}
                    alt={`Logged on ${dateStr}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-xs font-semibold text-foreground">
                      {dateStr}
                    </p>
                    {photo.note && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {photo.note}
                      </p>
                    )}
                  </div>
                  {/* Always-visible date badge */}
                  <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {dateStr}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl font-black text-foreground mb-1">
          Progress
        </h1>
        <p className="text-muted-foreground text-sm">
          Track your weight and body transformation
        </p>
      </motion.div>

      <Tabs defaultValue="weight">
        <TabsList className="w-full bg-muted rounded-xl p-1 h-11">
          <TabsTrigger
            value="weight"
            className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs font-semibold text-sm"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Weight
          </TabsTrigger>
          <TabsTrigger
            value="photos"
            className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs font-semibold text-sm"
          >
            <Camera className="w-4 h-4 mr-2" />
            Photos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weight" className="mt-5">
          <WeightTab />
        </TabsContent>
        <TabsContent value="photos" className="mt-5">
          <PhotosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
