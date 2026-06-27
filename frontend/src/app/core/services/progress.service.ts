import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProgressSummary, WorkoutHistory, WorkoutHistoryItem, ExerciseProgress } from '../models';
import { expand, reduce, takeWhile } from 'rxjs/operators';

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

  getAllHistory(): Observable<WorkoutHistoryItem[]> {
    return this.getHistory(0, 100).pipe(
      expand((res) =>
        res.number + 1 < res.totalPages
          ? this.getHistory(res.number + 1, 100)
          : [],
      ),
      takeWhile((res) => !!res.content, true),
      reduce(
        (acc: WorkoutHistoryItem[], res: WorkoutHistory) => acc.concat(res.content),
        [],
      ),
    );
  }

  getHistoryForDate(date: string): Observable<WorkoutHistoryItem[]> {
    const offsetMin = -new Date().getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    const zone = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
    const params = new HttpParams().set('date', date).set('zone', zone);
    return this.http.get<WorkoutHistoryItem[]>(`${this.url}/history`, { params });
  }

  getExerciseProgress(exerciseId: string): Observable<ExerciseProgress> {
    return this.http.get<ExerciseProgress>(`${this.url}/exercises/${exerciseId}`);
  }
}
