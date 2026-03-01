import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob } from "../backend";
import type {
  AIResponse,
  ExerciseSession,
  ProgressPhoto,
  UserProfile,
  WeightEntry,
  WorkoutPlan,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export function useGetSessions() {
  const { actor, isFetching } = useActor();

  return useQuery<ExerciseSession[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSessions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: ExerciseSession) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addSession(session);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

// ─── Weight ──────────────────────────────────────────────────────────────────

export function useGetWeightHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<WeightEntry[]>({
    queryKey: ["weightHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWeightHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddWeightEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (weightKg: number) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addWeightEntry(weightKg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightHistory"] });
    },
  });
}

// ─── Progress Photos ─────────────────────────────────────────────────────────

export function useGetProgressPhotos() {
  const { actor, isFetching } = useActor();

  return useQuery<ProgressPhoto[]>({
    queryKey: ["progressPhotos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProgressPhotos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddProgressPhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bytes,
      note,
    }: {
      bytes: Uint8Array<ArrayBuffer>;
      note: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const blob = ExternalBlob.fromBytes(bytes);
      await actor.addProgressPhoto(blob, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressPhotos"] });
    },
  });
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export function useAskAI() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (message: string): Promise<AIResponse> => {
      if (!actor) throw new Error("Actor not available");
      return actor.askAI(message);
    },
  });
}

// ─── Workout Plans ───────────────────────────────────────────────────────────

export function useGetRecommendedPlan() {
  const { actor, isFetching } = useActor();

  return useQuery<WorkoutPlan | null>({
    queryKey: ["recommendedPlan"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getRecommendedPlan();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllPlans() {
  const { actor, isFetching } = useActor();

  return useQuery<WorkoutPlan[]>({
    queryKey: ["allPlans"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPlans();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInitializeWorkoutPlans() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.initializeWorkoutPlans();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendedPlan"] });
      queryClient.invalidateQueries({ queryKey: ["allPlans"] });
    },
  });
}
