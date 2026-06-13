export type ExerciseCategory =
  | 'CHEST' | 'BACK' | 'LEGS' | 'SHOULDERS' | 'ARMS'
  | 'CORE' | 'CARDIO' | 'FULL_BODY' | 'GLUTES' | 'CALVES'
  | 'FOREARMS' | 'NECK';

export type Equipment =
  | 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'CABLE' | 'BODYWEIGHT'
  | 'KETTLEBELL' | 'RESISTANCE_BAND' | 'SMITH_MACHINE' | 'OTHER';

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  category: ExerciseCategory;
  primaryMuscleGroup?: string;
  equipment?: Equipment;
  global: boolean;
  createdBy?: string;
  createdAt: string;
}

export interface CreateExerciseRequest {
  name: string;
  description?: string;
  category: ExerciseCategory;
  primaryMuscleGroup?: string;
  equipment?: Equipment;
}

export interface ExercisePage {
  content: Exercise[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
