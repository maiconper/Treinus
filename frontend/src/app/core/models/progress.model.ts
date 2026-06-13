export interface ProgressSummary {
  xp: number;
  streak: number;
  totalWorkouts: number;
  workoutsThisWeek: number;
  volumeThisWeek: number;
  volumeLastWeek: number;
  lastWorkoutDate?: string;
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
}

export interface WorkoutHistory {
  content: WorkoutHistoryItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
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
