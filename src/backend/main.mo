import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Float "mo:core/Float";
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


// Migrate state on upgrades

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

  public type Exercise = {
    name : Text;
    sets : Nat;
    reps : Nat;
    weightKg : Float;
  };

  public type ExerciseSession = {
    date : Int;
    exercises : [Exercise];
  };

  public type WeightEntry = {
    date : Int;
    weightKg : Float;
  };

  public type ProgressPhoto = {
    date : Int;
    blob : Storage.ExternalBlob;
    note : ?Text;
  };

  public type WorkoutDay = {
    day : Text;
    exercises : [Exercise];
  };

  public type WorkoutPlan = {
    name : Text;
    fitnessLevel : { #beginner; #intermediate; #advanced };
    goal : { #lose_weight; #build_muscle; #get_fit };
    days : [WorkoutDay];
  };

  public type CustomWorkoutPlan = {
    id : Text;
    name : Text;
    days : [WorkoutDay];
  };

  public type AIResponse = {
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
  let customPlans = Map.empty<Principal, List.List<CustomWorkoutPlan>>();

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

    // Workout Plan Advice
    if (lowerMsg.contains(#text "workout") or lowerMsg.contains(#text "plan") or lowerMsg.contains(#text "exercise") or lowerMsg.contains(#text "routine")) {
      // Find best fit plan
      let matchingPlan = switch (workoutPlans.values().find(func(plan) { plan.fitnessLevel == profile.fitnessLevel and plan.goal == profile.goal })) {
        case (?plan) { ?plan };
        case (null) {
          findNextBestPlan(profile.fitnessLevel, profile.goal);
        };
      };

      let personalizedMessage = personalizedWorkoutMessage(profile, matchingPlan);
      return {
        message = personalizedMessage;
        recommendedPlan = matchingPlan;
      };
    };

    // Nutrition Advice
    if (lowerMsg.contains(#text "nutrition") or lowerMsg.contains(#text "protein") or lowerMsg.contains(#text "food")) {
      let proteinIntake = profile.weightKg * 1.8;
      let nutritionMessage = personalizedNutritionMessage(profile, proteinIntake);
      return {
        message = nutritionMessage;
        recommendedPlan = null;
      };
    };

    // Motivation
    if (lowerMsg.contains(#text "motivat") or lowerMsg.contains(#text "struggle") or lowerMsg.contains(#text "hard")) {
      let motivationMessage = personalizedMotivationMessage(profile.fitnessLevel, profile.goal);
      return {
        message = motivationMessage;
        recommendedPlan = null;
      };
    };

    {
      message = "How can I assist you with your fitness journey?";
      recommendedPlan = null;
    };
  };

  func findNextBestPlan(level : { #beginner; #intermediate; #advanced }, goal : { #lose_weight; #build_muscle; #get_fit }) : ?WorkoutPlan {
    let allPlans = workoutPlans.toArray();
    let sameGoalPlan = allPlans.find(func(p) { p.goal == goal });
    switch (sameGoalPlan) {
      case (?plan) { ?plan };
      case (null) {
        let sameLevelPlan = allPlans.find(func(p) { p.fitnessLevel == level });
        switch (sameLevelPlan) {
          case (?plan) { ?plan };
          case (null) { if (allPlans.size() > 0) { ?allPlans[0] } else { null } };
        };
      };
    };
  };

  func personalizedWorkoutMessage(profile : UserProfile, plan : ?WorkoutPlan) : Text {
    let levelText = switch (profile.fitnessLevel) {
      case (#beginner) { "beginner" };
      case (#intermediate) { "intermediate" };
      case (#advanced) { "advanced" };
    };

    let goalText = switch (profile.goal) {
      case (#lose_weight) { "losing weight" };
      case (#build_muscle) { "building muscle" };
      case (#get_fit) { "getting fit" };
    };

    let baseMessage = "Based on your profile as a " # levelText # " aiming for " # goalText # ", I recommend ";

    switch (plan) {
      case (null) { baseMessage # "starting with full-body workouts 3-4 times per week, focusing on major muscle groups." };
      case (?p) { baseMessage # "the " # p.name # " plan, which is tailored to your fitness level and goal." };
    };
  };

  func personalizedNutritionMessage(profile : UserProfile, proteinIntake : Float) : Text {
    let goalMessage = switch (profile.goal) {
      case (#lose_weight) {
        "focus on higher protein intake, maintaining a calorie deficit, and including both cardio and strength training in your routine.";
      };
      case (#build_muscle) {
        "aim for a slight calorie surplus, prioritize progressive overload in your workouts, and ensure adequate protein intake.";
      };
      case (#get_fit) {
        "maintain a balanced diet, include diverse exercises, and focus on consistency for long-term results.";
      };
    };

    "Nutrition is crucial for your fitness journey. As a " # fitnessLevelToText(profile.fitnessLevel) # ", you should " # goalMessage # " Aim for around " # proteinIntake.toText() # " grams of protein per day based on your weight. Stay hydrated, get enough sleep, and remember that consistency is key.";
  };

  func personalizedMotivationMessage(level : { #beginner; #intermediate; #advanced }, goal : { #lose_weight; #build_muscle; #get_fit }) : Text {
    let levelMessage = switch (level) {
      case (#beginner) { "start slow, stay consistent, and focus on building healthy habits." };
      case (#intermediate) { "keep pushing your limits, vary your routines, and set specific goals to stay motivated." };
      case (#advanced) { "challenge yourself, track progress, and remember that ongoing effort leads to sustained results." };
    };

    let goalMessage = switch (goal) {
      case (#lose_weight) { "combine calorie deficit in your diet with regular exercise. Progress may be slow, but every small step counts." };
      case (#build_muscle) { "focus on progressive overload in workouts and get adequate protein. Muscle growth takes 4-8 weeks to become noticeable." };
      case (#get_fit) { "diversify workouts, maintain consistency, and celebrate small milestones. Fitness is a lifestyle, not a sprint." };
    };

    "Staying motivated can be tough, but reminding yourself of your reasons helps during hard times. " # levelMessage # " Remember, " # goalMessage # " Tracking your progress and celebrating victories keeps you engaged.";
  };

  func fitnessLevelToText(level : { #beginner; #intermediate; #advanced }) : Text {
    switch (level) {
      case (#beginner) { "beginner" };
      case (#intermediate) { "intermediate" };
      case (#advanced) { "advanced" };
    };
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

  // Custom User Plans
  public shared ({ caller }) func saveCustomPlan(plan : CustomWorkoutPlan) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save custom plans");
    };
    let userPlans = switch (customPlans.get(caller)) {
      case (null) { List.empty<CustomWorkoutPlan>() };
      case (?p) { p };
    };
    let plansArray = userPlans.toArray();
    let filteredPlans = plansArray.filter(func(p) { p.id != plan.id });
    let filteredList = List.fromArray<CustomWorkoutPlan>(filteredPlans);
    userPlans.clear();
    userPlans.addAll(filteredList.values());
    userPlans.add(plan);
    customPlans.add(caller, userPlans);
  };

  public shared ({ caller }) func deleteCustomPlan(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete custom plans");
    };
    switch (customPlans.get(caller)) {
      case (null) { Runtime.trap("Custom plans not found") };
      case (?userPlans) {
        let filteredPlans = userPlans.toArray().filter(func(p) { p.id != id });
        let filteredList = List.fromArray<CustomWorkoutPlan>(filteredPlans);
        customPlans.add(caller, filteredList);
      };
    };
  };

  public query ({ caller }) func getCustomPlans() : async [CustomWorkoutPlan] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get custom plans");
    };
    switch (customPlans.get(caller)) {
      case (null) { [] };
      case (?userPlans) { userPlans.toArray() };
    };
  };
};
