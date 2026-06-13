import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, OnboardingRequest, UpdateProfileRequest } from '../models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private url = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.url}/me`).pipe(
      tap(user => this.auth.setUser(user))
    );
  }

  completeOnboarding(req: OnboardingRequest): Observable<User> {
    return this.http.post<User>(`${this.url}/me/onboarding`, req).pipe(
      tap(user => this.auth.setUser(user))
    );
  }

  updateProfile(req: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.url}/me/profile`, req).pipe(
      tap(user => this.auth.setUser(user))
    );
  }
}
