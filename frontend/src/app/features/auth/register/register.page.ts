import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private loading: LoadingController,
    private toast: ToastController,
  ) {}

  async submit() {
    if (this.form.invalid) return;
    const loader = await this.loading.create({ message: 'Criando conta...' });
    await loader.present();
    this.auth.register(this.form.value as any).subscribe({
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
        const t = await this.toast.create({ message: 'Erro ao criar conta. Tente novamente.', duration: 3000, color: 'danger' });
        t.present();
      },
    });
  }
}
