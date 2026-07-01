import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Achievement } from '../models';

@Injectable({ providedIn: 'root' })
export class AchievementService {
  private url = `${environment.apiUrl}/achievements`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(this.url);
  }

  ack(): Observable<void> {
    return this.http.post<void>(`${this.url}/ack`, {});
  }
}
