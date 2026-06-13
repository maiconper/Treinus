import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models';

const TOKEN_KEY = 'treinus_access_token';
const REFRESH_KEY = 'treinus_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private url = `${environment.apiUrl}/auth`;
  private _user = new BehaviorSubject<User | null>(null);
  user$ = this._user.asObservable();

  constructor(private http: HttpClient) {}

  get accessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  get currentUser(): User | null {
    return this._user.value;
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.url}/register`, req).pipe(
      tap(res => this.saveTokens(res))
    );
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.url}/login`, req).pipe(
      tap(res => this.saveTokens(res))
    );
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    return this.http.post<AuthResponse>(`${this.url}/refresh`, { refreshToken }).pipe(
      tap(res => this.saveTokens(res))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this._user.next(null);
  }

  setUser(user: User): void {
    this._user.next(user);
  }

  private saveTokens(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
  }
}
