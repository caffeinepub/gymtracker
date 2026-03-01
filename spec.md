# GymTracker

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- User authentication and individual profiles
- Profile setup form: fitness level (beginner/intermediate/advanced), age, weight (kg/lbs), height, and fitness goal (lose weight / build muscle / get fit)
- Exercise session logging: log individual exercises with name, sets, reps, and weight per session
- Weight tracking over time: log body weight with date, display history
- Progress photo upload: private per-user photos tied to a date/session
- AI assistant (rule-based chatbot): answers common fitness/gym questions and recommends workouts based on user profile data
- Pre-built workout plans generated based on fitness level and goal
- Dashboard showing recent sessions, current weight, and quick access to features

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
- User profile data model: principal-keyed, stores fitness level, age, weight, height, goal
- Exercise session data model: session date, list of exercises (name, sets, reps, weight used)
- Weight log data model: date + body weight entries per user
- Progress photo references: store blob storage IDs per user with date
- AI assistant logic: rule-based response engine using fitness level + goal + keyword matching to return advice and workout recommendations
- Pre-built workout plan data: beginner/intermediate/advanced plans for each goal (lose weight, build muscle, get fit)
- CRUD endpoints for profile, sessions, weight log, photos
- Query for AI chat response given user message + profile context

### Frontend (React)
- Onboarding/profile setup screen (shown on first login)
- Navigation: Dashboard, Log Workout, Progress, AI Assistant
- Dashboard: summary cards for last workout, current weight, streak
- Log Workout screen: add exercise entries (name, sets, reps, weight), save session
- Progress screen: weight chart over time, progress photo gallery (private)
- Photo upload UI tied to blob storage
- AI Assistant screen: chat interface, user types question, rule-based response displayed
- Workout Plan screen: displays recommended plan based on profile
