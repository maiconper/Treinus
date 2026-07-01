import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProgressSummary, WorkoutHistory, WorkoutHistoryItem, ExerciseProgress, MuscleSetStat, TopExercise, HeatmapDay, PersonalRecord, WeeklyVolume } from '../models';
import { expand, reduce, takeWhile } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private url = `${environment.apiUrl}/progress`;

  constructor(private http: HttpClient) {}

  getSummary(period: string = 'ALL'): Observable<ProgressSummary> {
    const params = new HttpParams().set('period', period);
    return this.http.get<ProgressSummary>(`${this.url}/summary`, { params });
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

  getSetsByMuscle(period: string = 'ALL'): Observable<MuscleSetStat[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<MuscleSetStat[]>(`${this.url}/sets-by-muscle`, { params });
  }

  getTopExercises(limit = 3, period = 'ALL'): Observable<TopExercise[]> {
    const params = new HttpParams().set('limit', limit).set('period', period);
    return this.http.get<TopExercise[]>(`${this.url}/top-exercises`, { params });
  }

  getExercisesDone(): Observable<TopExercise[]> {
    return this.http.get<TopExercise[]>(`${this.url}/exercises-done`);
  }

  getPersonalRecords(): Observable<PersonalRecord[]> {
    return this.http.get<PersonalRecord[]>(`${this.url}/personal-records`);
  }

  getHeatmap(months = 6): Observable<HeatmapDay[]> {
    const params = new HttpParams().set('months', months);
    return this.http.get<HeatmapDay[]>(`${this.url}/heatmap`, { params });
  }

  getWeeklyVolume(weeks = 12): Observable<WeeklyVolume[]> {
    const params = new HttpParams().set('weeks', weeks);
    return this.http.get<WeeklyVolume[]>(`${this.url}/weekly-volume`, { params });
  }

  getExerciseProgress(exerciseId: string, period = 'all'): Observable<ExerciseProgress> {
    const params = new HttpParams().set('period', period);
    return this.http.get<ExerciseProgress>(`${this.url}/exercises/${exerciseId}`, { params });
  }
}
