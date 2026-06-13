import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Session, StartSessionRequest, LogSetRequest, SkipExerciseRequest, SessionSummary } from '../models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private url = `${environment.apiUrl}/sessions`;
  private _active = new BehaviorSubject<Session | null>(null);
  activeSession$ = this._active.asObservable();

  constructor(private http: HttpClient) {}

  getCurrent(): Observable<Session> {
    return this.http.get<Session>(`${this.url}/current`).pipe(
      tap(s => this._active.next(s))
    );
  }

  get(id: string): Observable<Session> {
    return this.http.get<Session>(`${this.url}/${id}`);
  }

  start(req: StartSessionRequest): Observable<Session> {
    return this.http.post<Session>(`${this.url}/start`, req).pipe(
      tap(s => this._active.next(s))
    );
  }

  logSet(sessionId: string, exerciseId: string, req: LogSetRequest): Observable<Session> {
    return this.http.post<Session>(`${this.url}/${sessionId}/exercises/${exerciseId}/sets`, req).pipe(
      tap(s => this._active.next(s))
    );
  }

  skipExercise(sessionId: string, exerciseId: string, req: SkipExerciseRequest): Observable<Session> {
    return this.http.post<Session>(`${this.url}/${sessionId}/exercises/${exerciseId}/skip`, req).pipe(
      tap(s => this._active.next(s))
    );
  }

  finishSession(id: string): Observable<SessionSummary> {
    return this.http.post<SessionSummary>(`${this.url}/${id}/finish`, {}).pipe(
      tap(() => this._active.next(null))
    );
  }

  abandonSession(id: string): Observable<void> {
    return this.http.post<void>(`${this.url}/${id}/abandon`, {}).pipe(
      tap(() => this._active.next(null))
    );
  }
}
