import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Exercise {
    name: string;
    reps: bigint;
    sets: bigint;
    weightKg: number;
}
export interface CustomWorkoutPlan {
    id: string;
    days: Array<WorkoutDay>;
    name: string;
}
export interface ExerciseSession {
    date: bigint;
    exercises: Array<Exercise>;
}
export interface WorkoutDay {
    day: string;
    exercises: Array<Exercise>;
}
export interface WorkoutPlan {
    fitnessLevel: Variant_intermediate_beginner_advanced;
    days: Array<WorkoutDay>;
    goal: Variant_get_fit_lose_weight_build_muscle;
    name: string;
}
export interface AIResponse {
    recommendedPlan?: WorkoutPlan;
    message: string;
}
export interface ProgressPhoto {
    blob: ExternalBlob;
    date: bigint;
    note?: string;
}
export interface WeightEntry {
    date: bigint;
    weightKg: number;
}
export interface UserProfile {
    age: bigint;
    fitnessLevel: Variant_intermediate_beginner_advanced;
    heightCm: number;
    goal: Variant_get_fit_lose_weight_build_muscle;
    weightKg: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_get_fit_lose_weight_build_muscle {
    get_fit = "get_fit",
    lose_weight = "lose_weight",
    build_muscle = "build_muscle"
}
export enum Variant_intermediate_beginner_advanced {
    intermediate = "intermediate",
    beginner = "beginner",
    advanced = "advanced"
}
export interface backendInterface {
    addProgressPhoto(blob: ExternalBlob, note: string | null): Promise<void>;
    addSession(session: ExerciseSession): Promise<void>;
    addWeightEntry(weightKg: number): Promise<void>;
    askAI(message: string): Promise<AIResponse>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteCustomPlan(id: string): Promise<void>;
    getAllPlans(): Promise<Array<WorkoutPlan>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomPlans(): Promise<Array<CustomWorkoutPlan>>;
    getProgressPhotos(): Promise<Array<ProgressPhoto>>;
    getRecommendedPlan(): Promise<WorkoutPlan | null>;
    getSessions(): Promise<Array<ExerciseSession>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeightHistory(): Promise<Array<WeightEntry>>;
    initializeWorkoutPlans(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCustomPlan(plan: CustomWorkoutPlan): Promise<void>;
}
