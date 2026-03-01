import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  // Integrate Authorization (RBAC)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Integrate Blob Storage
  include MixinStorage();

  // Types
  public type UserProfile = {
    fitnessLevel : { #beginner; #intermediate; #advanced };
    age : Nat;
    weightKg : Float;
    heightCm : Float;
    goal : { #lose_weight; #build_muscle; #get_fit };
  };

  type Exercise = {
    name : Text;
    sets : Nat;
    reps : Nat;
    weightKg : Float;
  };

  type ExerciseSession = {
    date : Int;
    exercises : [Exercise];
  };

  type WeightEntry = {
    date : Int;
    weightKg : Float;
  };

  type ProgressPhoto = {
    date : Int;
    blob : Storage.ExternalBlob;
    note : ?Text;
  };

  type WorkoutDay = {
    day : Text;
    exercises : [Exercise];
  };

  type WorkoutPlan = {
    name : Text;
    fitnessLevel : { #beginner; #intermediate; #advanced };
    goal : { #lose_weight; #build_muscle; #get_fit };
    days : [WorkoutDay];
  };

  type AIResponse = {
    message : Text;
    recommendedPlan : ?WorkoutPlan;
  };

  module WeightEntry {
    public func compare(entry1 : WeightEntry, entry2 : WeightEntry) : Order.Order {
      Int.compare(entry1.date, entry2.date);
    };
  };

  // Persistent Storage
  let profiles = Map.empty<Principal, UserProfile>();
  let sessions = Map.empty<Principal, List.List<ExerciseSession>>();
  let weightLogs = Map.empty<Principal, List.List<WeightEntry>>();
  let photos = Map.empty<Principal, List.List<ProgressPhoto>>();
  let workoutPlans = List.empty<WorkoutPlan>();

  // Profile Management - Required Interface
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profiles.add(caller, profile);
  };

  // Exercise Sessions
  public shared ({ caller }) func addSession(session : ExerciseSession) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add workout sessions");
    };
    let userSessions = switch (sessions.get(caller)) {
      case (null) { List.empty<ExerciseSession>() };
      case (?s) { s };
    };
    userSessions.add(session);
    sessions.add(caller, userSessions);
  };

  public query ({ caller }) func getSessions() : async [ExerciseSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get workout sessions");
    };
    switch (sessions.get(caller)) {
      case (null) { [] };
      case (?s) { s.toArray() };
    };
  };

  // Weight Log
  public shared ({ caller }) func addWeightEntry(weightKg : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add weight entries");
    };
    let entry = {
      date = Time.now();
      weightKg;
    };
    let userWeightLogs = switch (weightLogs.get(caller)) {
      case (null) { List.empty<WeightEntry>() };
      case (?w) { w };
    };
    userWeightLogs.add(entry);
    weightLogs.add(caller, userWeightLogs);
  };

  public query ({ caller }) func getWeightHistory() : async [WeightEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get weight history");
    };
    switch (weightLogs.get(caller)) {
      case (null) { [] };
      case (?w) { w.toArray().sort() };
    };
  };

  // Progress Photos
  public shared ({ caller }) func addProgressPhoto(blob : Storage.ExternalBlob, note : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add progress photos");
    };
    let photo = {
      date = Time.now();
      blob;
      note;
    };
    let userPhotos = switch (photos.get(caller)) {
      case (null) { List.empty<ProgressPhoto>() };
      case (?p) { p };
    };
    userPhotos.add(photo);
    photos.add(caller, userPhotos);
  };

  public query ({ caller }) func getProgressPhotos() : async [ProgressPhoto] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get progress photos");
    };
    switch (photos.get(caller)) {
      case (null) { [] };
      case (?p) { p.toArray() };
    };
  };

  // AI Assistant
  public shared ({ caller }) func askAI(message : Text) : async AIResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can use AI assistant");
    };

    let profile = switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?p) { p };
    };

    let lowerMsg = message.toLower();

    if (lowerMsg.contains(#text "beginner workout")) {
      return {
        message = "As a beginner, focus on full-body workouts with basic exercises. Aim for 3 sets of 10-12 reps.";
        recommendedPlan = getPlan("Beginner Full Body");
      };
    };

    if (lowerMsg.contains(#text "nutrition")) {
      return {
        message = "Nutrition is key to fitness. Focus on balanced meals with protein, healthy fats, and complex carbs.";
        recommendedPlan = null;
      };
    };

    if (lowerMsg.contains(#text "motivation")) {
      return {
        message = "Stay consistent, set achievable goals, and track your progress. Remember, results take time!";
        recommendedPlan = null;
      };
    };

    {
      message = "How can I assist you with your fitness journey?";
      recommendedPlan = null;
    };
  };

  func getPlan(name : Text) : ?WorkoutPlan {
    workoutPlans.values().find(func(plan) { plan.name == name });
  };

  // Workout Plans
  public query ({ caller }) func getAllPlans() : async [WorkoutPlan] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get workout plans");
    };
    workoutPlans.toArray();
  };

  public shared ({ caller }) func getRecommendedPlan() : async ?WorkoutPlan {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get workout plans");
    };

    let profile = switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?p) { p };
    };

    workoutPlans.values().find(func(plan) { plan.fitnessLevel == profile.fitnessLevel and plan.goal == profile.goal });
  };

  public shared ({ caller }) func initializeWorkoutPlans() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can initialize workout plans");
    };

    workoutPlans.clear();

    let beginnerPlan : WorkoutPlan = {
      name = "Beginner Full Body";
      fitnessLevel = #beginner;
      goal = #get_fit;
      days = [
        {
          day = "Monday";
          exercises = [
            { name = "Squats"; sets = 3; reps = 12; weightKg = 0 },
            { name = "Push Ups"; sets = 3; reps = 12; weightKg = 0 },
            { name = "Lunges"; sets = 3; reps = 12; weightKg = 0 },
          ];
        },
        {
          day = "Wednesday";
          exercises = [
            { name = "Deadlifts"; sets = 3; reps = 12; weightKg = 0 },
            { name = "Bench Press"; sets = 3; reps = 12; weightKg = 0 },
            { name = "Plank"; sets = 3; reps = 60; weightKg = 0 },
          ];
        },
        {
          day = "Friday";
          exercises = [
            { name = "Overhead Press"; sets = 3; reps = 12; weightKg = 0 },
            { name = "Rows"; sets = 3; reps = 12; weightKg = 0 },
            { name = "Bicep Curls"; sets = 3; reps = 12; weightKg = 0 },
          ];
        },
      ];
    };

    let advancePlan : WorkoutPlan = {
      name = "Advanced Push Pull Legs";
      fitnessLevel = #advanced;
      goal = #build_muscle;
      days = [
        {
          day = "Monday";
          exercises = [
            { name = "Bench Press"; sets = 5; reps = 5; weightKg = 80 },
            { name = "Incline Dumbbell Press"; sets = 4; reps = 8; weightKg = 32 },
            { name = "Tricep Dips"; sets = 4; reps = 10; weightKg = 0 },
          ];
        },
        {
          day = "Wednesday";
          exercises = [
            { name = "Deadlifts"; sets = 5; reps = 5; weightKg = 120 },
            { name = "Pull Ups"; sets = 4; reps = 8; weightKg = 0 },
            { name = "Barbell Rows"; sets = 4; reps = 10; weightKg = 45 },
          ];
        },
        {
          day = "Friday";
          exercises = [
            { name = "Squats"; sets = 5; reps = 5; weightKg = 100 },
            { name = "Leg Press"; sets = 4; reps = 12; weightKg = 180 },
            { name = "Calf Raises"; sets = 4; reps = 15; weightKg = 50 },
          ];
        },
      ];
    };

    workoutPlans.add(beginnerPlan);
    workoutPlans.add(advancePlan);
  };
};
