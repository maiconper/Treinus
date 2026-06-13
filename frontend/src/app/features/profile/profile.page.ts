import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {
  user: User | null = null;

  constructor(
    private userService: UserService,
    private auth: AuthService,
    private router: Router,
    private alert: AlertController,
  ) {}

  ngOnInit() { this.load(); }
  ionViewWillEnter() { this.load(); }

  load() {
    this.userService.getMe().subscribe({ next: u => (this.user = u) });
  }

  get userInitials(): string {
    if (!this.user?.name) return '?';
    return this.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  get levelLabel(): string {
    const map: Record<string, string> = { BEGINNER: 'Iniciante', INTERMEDIATE: 'Intermediário', ADVANCED: 'Avançado' };
    return map[this.user?.fitnessLevel ?? ''] ?? '—';
  }

  get goalLabel(): string {
    const map: Record<string, string> = { LOSE_WEIGHT: 'Emagrecimento', GAIN_MUSCLE: 'Hipertrofia', MAINTAIN: 'Força', ENDURANCE: 'Saúde' };
    return map[this.user?.goal ?? ''] ?? '—';
  }

  async logout() {
    const a = await this.alert.create({
      header: 'Sair da conta?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Sair', role: 'destructive', handler: () => { this.auth.logout(); this.router.navigate(['/auth/welcome']); } },
      ],
    });
    await a.present();
  }
}
