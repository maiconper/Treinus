import { ExerciseCategory, Equipment } from './exercise.model';

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  equipment?: Equipment;
  orderIndex: number;
  plannedSets: number;
  plannedRepsMin?: number;
  plannedRepsMax?: number;
  plannedWeightKg?: number;
  restSeconds?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  userId: string;
  preset: boolean;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkoutRequest {
  name: string;
  description?: string;
}

export interface AddExerciseRequest {
  exerciseId: string;
  plannedSets: number;
  plannedRepsMin?: number;
  plannedRepsMax?: number;
  plannedWeightKg?: number;
  restSeconds?: number;
  notes?: string;
}

export interface UpdateExerciseRequest {
  plannedSets?: number;
  plannedRepsMin?: number;
  plannedRepsMax?: number;
  plannedWeightKg?: number;
  restSeconds?: number;
  notes?: string;
}
