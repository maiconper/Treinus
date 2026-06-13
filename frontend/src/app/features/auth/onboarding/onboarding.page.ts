import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { FitnessLevel, FitnessGoal } from '../../../core/models';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: false,
})
export class OnboardingPage {
  step = 1; // 1=level, 2=goal, 3=days, 4=ready

  level: FitnessLevel | null = null;
  goal: FitnessGoal | null = null;
  days = [
    { key: 1, label: 'S', selected: false },
    { key: 2, label: 'T', selected: false },
    { key: 3, label: 'Q', selected: false },
    { key: 4, label: 'Q', selected: false },
    { key: 5, label: 'S', selected: false },
    { key: 6, label: 'S', selected: false },
    { key: 0, label: 'D', selected: false },
  ];

  levels = [
    { value: 'BEGINNER' as FitnessLevel, label: 'Iniciante', desc: 'Menos de 1 ano ou voltando depois de pausa', icon: 'leaf-outline', bg: '#EAF3DE', color: '#27500A' },
    { value: 'INTERMEDIATE' as FitnessLevel, label: 'Intermediário', desc: '1–3 anos, treinando com regularidade', icon: 'flame-outline', bg: '#FAEEDA', color: '#633806' },
    { value: 'ADVANCED' as FitnessLevel, label: 'Avançado', desc: 'Mais de 3 anos, domina os movimentos básicos', icon: 'trophy-outline', bg: '#FAECE7', color: '#993C1D' },
  ];

  goals = [
    { value: 'GAIN_MUSCLE' as FitnessGoal, label: 'Hipertrofia', desc: 'Ganhar massa muscular', icon: 'barbell-outline' },
    { value: 'MAINTAIN' as FitnessGoal, label: 'Força', desc: 'Ficar mais forte', icon: 'fitness-outline' },
    { value: 'LOSE_WEIGHT' as FitnessGoal, label: 'Emagrecimento', desc: 'Perder gordura', icon: 'walk-outline' },
    { value: 'ENDURANCE' as FitnessGoal, label: 'Saúde', desc: 'Qualidade de vida', icon: 'heart-outline' },
  ];

  constructor(
    private userService: UserService,
    private router: Router,
    private loading: LoadingController,
    private toast: ToastController,
  ) {}

  get selectedDaysCount(): number {
    return this.days.filter(d => d.selected).length;
  }

  get daysHint(): string {
    const n = this.selectedDaysCount;
    if (n === 0) return 'Selecione os dias em que você treina.';
    if (n <= 2) return `${n} dia${n > 1 ? 's' : ''} — ótimo para full body.`;
    if (n <= 4) return `${n} dias — ótimo para um programa PPL ou ABC.`;
    return `${n} dias — programa de alta frequência.`;
  }

  next() {
    if (this.step < 3) this.step++;
  }

  back() {
    if (this.step > 1) this.step--;
  }

  async finish() {
    const loader = await this.loading.create({ message: 'Configurando seu perfil...' });
    await loader.present();

    this.userService.completeOnboarding({
      fitnessLevel: this.level!,
      goal: this.goal!,
      availableDaysPerWeek: this.selectedDaysCount || 3,
    }).subscribe({
      next: () => {
        loader.dismiss();
        this.step = 4;
      },
      error: async () => {
        loader.dismiss();
        const t = await this.toast.create({ message: 'Erro ao salvar perfil. Tente novamente.', duration: 3000, color: 'danger' });
        t.present();
      },
    });
  }

  goToApp() {
    this.router.navigate(['/tabs/home']);
  }
}
