import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProgressSummary, WorkoutHistory, ExerciseProgress } from '../models';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private url = `${environment.apiUrl}/progress`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<ProgressSummary> {
    return this.http.get<ProgressSummary>(`${this.url}/summary`);
  }

  getHistory(page = 0, size = 20): Observable<WorkoutHistory> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<WorkoutHistory>(`${this.url}/history`, { params });
  }

  getExerciseProgress(exerciseId: string): Observable<ExerciseProgress> {
    return this.http.get<ExerciseProgress>(`${this.url}/exercises/${exerciseId}`);
  }
}
