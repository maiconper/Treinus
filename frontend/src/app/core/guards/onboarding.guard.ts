import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { map, catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OnboardingGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  canActivate() {
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/auth/welcome']);
      return of(false);
    }

    return this.userService.getMe().pipe(
      map(user => {
        if (!user.onboardingCompleted) {
          this.router.navigate(['/auth/onboarding']);
          return false;
        }
        return true;
      }),
      catchError(() => {
        this.auth.logout();
        this.router.navigate(['/auth/welcome']);
        return of(false);
      })
    );
  }
}
