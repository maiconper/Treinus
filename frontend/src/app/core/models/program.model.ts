export type ProgramStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface ProgramDay {
  id: string;
  dayOfWeek: number;
  workoutId?: string;
  workoutName?: string;
  restDay: boolean;
}

export interface ProgramWeek {
  id: string;
  weekNumber: number;
  name?: string;
  days: ProgramDay[];
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  userId: string;
  weeksCount: number;
  status: ProgramStatus;
  startedAt?: string;
  endedAt?: string;
  weeks: ProgramWeek[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramRequest {
  name: string;
  description?: string;
  weeksCount: number;
}

export interface AddWeekRequest {
  weekNumber: number;
  name?: string;
}

export interface AddDayRequest {
  dayOfWeek: number;
  workoutId?: string;
  restDay: boolean;
}
