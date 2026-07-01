export interface ProgressSummary {
  xp: number;
  level: number;
  xpInCurrentLevel: number;
  xpForCurrentLevel: number;
  streak: number;
  totalWorkouts: number;
  workoutsThisWeek: number;
  volumeThisWeek: number;
  volumeLastWeek: number;
  lastWorkoutDate?: string;
  totalSets: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  totalPersonalRecords: number;
}

export interface WorkoutHistoryItem {
  sessionId: string;
  workoutId: string;
  workoutName: string;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  totalSets: number;
  totalVolumeKg: number;
  xpEarned: number;
  newPersonalRecords: number;
}

export interface WorkoutHistory {
  content: WorkoutHistoryItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface MuscleSetStat {
  category: string;
  sets: number;
}

export interface TopExercise {
  exerciseId: string;
  exerciseName: string;
  timesPerformed: number;
}

export interface ExerciseProgressEntry {
  sessionId: string;
  sessionStartedAt: string;
  completedAt: string;
  reps: number;
  weightKg: number;
  personalRecord: boolean;
}

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  personalRecord?: number;
  totalSets: number;
  history: ExerciseProgressEntry[];
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface WeeklyVolume {
  weekStart: string;
  totalVolumeKg: number;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  category: string | null;
  weightKg: number;
  reps: number;
  achievedAt: string;
}
