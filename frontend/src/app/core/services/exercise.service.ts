import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Exercise, ExercisePage, CreateExerciseRequest, ExerciseCategory, Equipment } from '../models';

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private url = `${environment.apiUrl}/exercises`;

  constructor(private http: HttpClient) {}

  list(params?: { category?: ExerciseCategory; equipment?: Equipment; page?: number; size?: number }): Observable<ExercisePage> {
    let p = new HttpParams();
    if (params?.category) p = p.set('category', params.category);
    if (params?.equipment) p = p.set('equipment', params.equipment);
    if (params?.page != null) p = p.set('page', params.page);
    if (params?.size != null) p = p.set('size', params.size);
    return this.http.get<ExercisePage>(this.url, { params: p });
  }

  get(id: string): Observable<Exercise> {
    return this.http.get<Exercise>(`${this.url}/${id}`);
  }

  createCustom(req: CreateExerciseRequest): Observable<Exercise> {
    return this.http.post<Exercise>(this.url, req);
  }

  createGlobal(req: CreateExerciseRequest): Observable<Exercise> {
    return this.http.post<Exercise>(`${this.url}/global`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
