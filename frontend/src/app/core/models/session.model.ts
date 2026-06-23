export type SessionStatus = 'ACTIVE' | 'FINISHED' | 'ABANDONED';
export type SessionExerciseStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface SessionSet {
  id: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  recordedAt: string;
  personalRecord?: boolean;
}

export interface SessionExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  status: SessionExerciseStatus;
  skipReason?: string;
  plannedSets?: number;
  plannedRepsMin?: number;
  plannedRepsMax?: number;
  restSeconds?: number;
  sets: SessionSet[];
}

export interface Session {
  id: string;
  userId: string;
  workoutId: string;
  workoutName: string;
  status: SessionStatus;
  startedAt: string;
  finishedAt?: string;
  notes?: string;
  totalVolumeKg?: number;
  xpEarned?: number;
  exercises: SessionExercise[];
}

export interface StartSessionRequest {
  workoutId?: string;
  programDayId?: string;
  notes?: string;
}

export interface ManualSetEntry {
  reps: number;
  weightKg: number;
}

export interface ManualExerciseEntry {
  exerciseId: string;
  sets: ManualSetEntry[];
}

export interface ManualSessionRequest {
  workoutId?: string;
  programDayId?: string;
  name?: string;
  date: string; // YYYY-MM-DD
  exercises?: ManualExerciseEntry[];
}

export interface LogSetRequest {
  reps: number;
  weightKg: number;
}

export interface SkipExerciseRequest {
  reason?: string;
}

export interface SessionSummary {
  sessionId: string;
  workoutName: string;
  durationSeconds: number;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  xpEarned: number;
  newPersonalRecords: number;
  exercises: SessionExercise[];
}
