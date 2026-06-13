import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Workout, CreateWorkoutRequest, AddExerciseRequest, UpdateExerciseRequest
} from '../models';

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private url = `${environment.apiUrl}/workouts`;

  constructor(private http: HttpClient) {}

  list(): Observable<Workout[]> {
    return this.http.get<Workout[]>(this.url);
  }

  get(id: string): Observable<Workout> {
    return this.http.get<Workout>(`${this.url}/${id}`);
  }

  create(req: CreateWorkoutRequest): Observable<Workout> {
    return this.http.post<Workout>(this.url, req);
  }

  update(id: string, req: CreateWorkoutRequest): Observable<Workout> {
    return this.http.put<Workout>(`${this.url}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  addExercise(workoutId: string, req: AddExerciseRequest): Observable<Workout> {
    return this.http.post<Workout>(`${this.url}/${workoutId}/exercises`, req);
  }

  updateExercise(workoutId: string, exerciseId: string, req: UpdateExerciseRequest): Observable<Workout> {
    return this.http.patch<Workout>(`${this.url}/${workoutId}/exercises/${exerciseId}`, req);
  }

  removeExercise(workoutId: string, exerciseId: string): Observable<Workout> {
    return this.http.delete<Workout>(`${this.url}/${workoutId}/exercises/${exerciseId}`);
  }

  reorderExercises(workoutId: string, ids: string[]): Observable<Workout> {
    return this.http.put<Workout>(`${this.url}/${workoutId}/exercises/reorder`, ids);
  }
}
