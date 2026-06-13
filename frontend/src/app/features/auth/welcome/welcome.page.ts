import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: false,
})
export class WelcomePage {
  constructor(private router: Router) {}

  goToRegister() { this.router.navigate(['/auth/register']); }
  goToLogin() { this.router.navigate(['/auth/login']); }
}
