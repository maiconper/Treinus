export type FitnessLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type FitnessGoal = 'LOSE_WEIGHT' | 'GAIN_MUSCLE' | 'MAINTAIN' | 'ENDURANCE';
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  fitnessLevel?: FitnessLevel;
  goal?: FitnessGoal;
  availableDaysPerWeek?: number;
  bodyWeightKg?: number;
  heightCm?: number;
  birthDate?: string;
  xp: number;
  streak: number;
  lastWorkoutDate?: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AuthResponse {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  onboardingCompleted: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface OnboardingRequest {
  fitnessLevel: FitnessLevel;
  goal: FitnessGoal;
  availableDaysPerWeek: number;
  bodyWeightKg?: number;
  heightCm?: number;
  birthDate?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  fitnessLevel?: FitnessLevel;
  goal?: FitnessGoal;
  availableDaysPerWeek?: number;
  bodyWeightKg?: number;
  heightCm?: number;
  birthDate?: string;
}
