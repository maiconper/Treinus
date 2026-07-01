import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { AlertController } from '@ionic/angular';
import { AchievementService } from '../../core/services/achievement.service';
import { Achievement, AchievementCategory } from '../../core/models';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  FREQUENCY: 'Frequência',
  CONSISTENCY: 'Consistência',
  RECORDS: 'Recordes',
  VOLUME: 'Volume',
  PROGRAMS: 'Programas',
  EXPLORATION: 'Exploração',
  RESILIENCE: 'Resiliência',
};

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.page.html',
  styleUrls: ['./achievements.page.scss'],
  standalone: false,
})
export class AchievementsPage implements OnInit {
  achievements: Achievement[] = [];

  constructor(
    private location: Location,
    private alert: AlertController,
    private achievementService: AchievementService,
  ) {}

  ngOnInit() {
    this.achievementService.getAll().subscribe({
      next: achievements => {
        this.achievements = achievements;
        if (achievements.some(a => a.isNew)) {
          this.achievementService.ack().subscribe();
        }
      },
    });
  }

  goBack() {
    this.location.back();
  }

  get categorizedAchievements(): { category: AchievementCategory; items: Achievement[] }[] {
    const groups: { category: AchievementCategory; items: Achievement[] }[] = [];
    for (const a of this.achievements) {
      let group = groups.find(g => g.category === a.category);
      if (!group) {
        group = { category: a.category, items: [] };
        groups.push(group);
      }
      group.items.push(a);
    }
    return groups;
  }

  categoryLabel(category: AchievementCategory): string {
    return CATEGORY_LABELS[category] ?? category;
  }

  async showAchievementDetail(a: Achievement) {
    const message = a.unlocked
      ? `${a.description} · Desbloqueado em ${this.formatDate(a.unlockedAt!)} · +${a.xpReward} XP`
      : a.description;

    const alert = await this.alert.create({
      header: a.name,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  private formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
