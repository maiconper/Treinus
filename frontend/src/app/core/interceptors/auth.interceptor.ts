import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshing = false;
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.accessToken;
    const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !req.url.includes('/auth/')) {
          return this.handle401(req, next);
        }
        return throwError(() => err);
      })
    );
  }

  private handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.refreshing) {
      return this.tokenSubject.pipe(
        filter(t => t !== null),
        take(1),
        switchMap(token =>
          next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
        )
      );
    }

    this.refreshing = true;
    this.tokenSubject.next(null);

    return this.auth.refresh().pipe(
      switchMap(res => {
        this.refreshing = false;
        this.tokenSubject.next(res.accessToken);
        return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } }));
      }),
      catchError(err => {
        this.refreshing = false;
        this.auth.logout();
        this.router.navigate(['/auth/welcome']);
        return throwError(() => err);
      })
    );
  }
}
