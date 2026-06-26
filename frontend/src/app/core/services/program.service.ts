import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Program, CreateProgramRequest, AddWeekRequest, AddDayRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ProgramService {
  private url = `${environment.apiUrl}/programs`;

  constructor(private http: HttpClient) {}

  list(): Observable<Program[]> {
    return this.http.get<Program[]>(this.url);
  }

  getActive(): Observable<Program | null> {
    return this.http.get<Program | null>(`${this.url}/active`);
  }

  get(id: string): Observable<Program> {
    return this.http.get<Program>(`${this.url}/${id}`);
  }

  create(req: CreateProgramRequest): Observable<Program> {
    return this.http.post<Program>(this.url, req);
  }

  start(id: string): Observable<Program> {
    return this.http.post<Program>(`${this.url}/${id}/start`, {});
  }

  finish(id: string): Observable<Program> {
    return this.http.post<Program>(`${this.url}/${id}/finish`, {});
  }

  repeat(id: string): Observable<Program> {
    return this.http.post<Program>(`${this.url}/${id}/repeat`, {});
  }

  addWeek(programId: string, req: AddWeekRequest): Observable<Program> {
    return this.http.post<Program>(`${this.url}/${programId}/weeks`, req);
  }

  addDay(programId: string, weekId: string, req: AddDayRequest): Observable<Program> {
    return this.http.post<Program>(`${this.url}/${programId}/weeks/${weekId}/days`, req);
  }

  update(id: string, req: { name: string; description?: string }): Observable<Program> {
    return this.http.put<Program>(`${this.url}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  removeWeek(programId: string, weekId: string): Observable<Program> {
    return this.http.delete<Program>(`${this.url}/${programId}/weeks/${weekId}`);
  }

  removeDay(programId: string, weekId: string, dayId: string): Observable<Program> {
    return this.http.delete<Program>(`${this.url}/${programId}/weeks/${weekId}/days/${dayId}`);
  }

  updateDay(programId: string, weekId: string, dayId: string,
            req: { workoutId?: string; restDay: boolean }): Observable<Program> {
    return this.http.put<Program>(`${this.url}/${programId}/weeks/${weekId}/days/${dayId}`, req);
  }
}
