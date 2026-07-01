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
