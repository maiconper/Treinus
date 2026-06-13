import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private userService: UserService,
    private router: Router,
    private loading: LoadingController,
    private toast: ToastController,
  ) {}

  async submit() {
    if (this.form.invalid) return;
    const loader = await this.loading.create({ message: 'Entrando...' });
    await loader.present();
    this.auth.login(this.form.value as any).subscribe({
      next: res => {
        loader.dismiss();
        if (!res.onboardingCompleted) {
          this.router.navigate(['/auth/onboarding']);
        } else {
          this.router.navigate(['/tabs/home']);
        }
      },
      error: async () => {
        loader.dismiss();
        const t = await this.toast.create({ message: 'Email ou senha incorretos.', duration: 3000, color: 'danger' });
        t.present();
      },
    });
  }
}
