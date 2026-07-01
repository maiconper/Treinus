import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';
import { MuscleSetStat, ProgressSummary, TopExercise, WorkoutHistoryItem } from '../../core/models';

const MUSCLE_LABELS: Record<string, string> = {
  CHEST: 'Peito',
  BACK: 'Costas',
  LEGS: 'Pernas',
  SHOULDERS: 'Ombros',
  ARMS: 'Braços',
  CORE: 'Core',
  CARDIO: 'Cardio',
  FULL_BODY: 'Corpo todo',
  GLUTES: 'Glúteos',
  CALVES: 'Panturrilhas',
  FOREARMS: 'Antebraços',
  NECK: 'Pescoço',
};

const MUSCLE_COLORS: Record<string, string> = {
  CHEST: '#f97316',
  BACK: '#3b82f6',
  LEGS: '#22c55e',
  SHOULDERS: '#a855f7',
  ARMS: '#ec4899',
  CORE: '#eab308',
  CARDIO: '#06b6d4',
  FULL_BODY: '#ef4444',
  GLUTES: '#f43f5e',
  CALVES: '#84cc16',
  FOREARMS: '#14b8a6',
  NECK: '#8b5cf6',
};

export type MusclePeriod = 'WEEK' | 'MONTH' | 'YEAR' | 'ALL';

export const MUSCLE_PERIOD_LABELS: Record<MusclePeriod, string> = {
  WEEK: 'Semana',
  MONTH: 'Mês',
  YEAR: 'Ano',
  ALL: 'Todos',
};

export interface PieSlice {
  path: string;
  color: string;
  label: string;
  sets: number;
  percentage: number;
}

@Component({
  selector: 'app-progress',
  templateUrl: './progress.page.html',
  styleUrls: ['./progress.page.scss'],
  standalone: false,
})
export class ProgressPage implements OnInit {
  summary: ProgressSummary | null = null;
  history: WorkoutHistoryItem[] = [];
  topExercises: TopExercise[] = [];
  muscleSlices: PieSlice[] = [];
  totalMusclesSets = 0;
  musclePeriod: MusclePeriod = 'MONTH';
  statsPeriod: MusclePeriod = 'ALL';
  readonly periods: MusclePeriod[] = ['WEEK', 'MONTH', 'YEAR', 'ALL'];
  readonly periodLabels = MUSCLE_PERIOD_LABELS;
  loading = true;
  hasMore = false;
  private page = 0;

  constructor(private progressService: ProgressService, private router: Router) {}

  ngOnInit() { this.load(); }
  ionViewWillEnter() { this.load(); }

  load() {
    this.loading = true;
    this.page = 0;
    this.loadSummary();
    this.progressService.getHistory(0).subscribe({
      next: h => {
        this.history = h.content;
        this.hasMore = h.number + 1 < h.totalPages;
      },
    });
    this.progressService.getTopExercises().subscribe({
      next: data => { this.topExercises = data; },
    });
    this.loadMuscleChart();
  }

  loadSummary() {
    this.progressService.getSummary(this.statsPeriod).subscribe({
      next: s => { this.summary = s; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  loadMuscleChart() {
    this.progressService.getSetsByMuscle(this.musclePeriod).subscribe({
      next: data => {
        this.totalMusclesSets = data.reduce((s, d) => s + d.sets, 0);
        this.muscleSlices = this.buildPieSlices(data);
      },
    });
  }

  selectPeriod(period: MusclePeriod) {
    if (this.musclePeriod === period) return;
    this.musclePeriod = period;
    this.loadMuscleChart();
  }

  selectStatsPeriod(period: MusclePeriod) {
    if (this.statsPeriod === period) return;
    this.statsPeriod = period;
    this.loadSummary();
  }

  loadMore() {
    this.page++;
    this.progressService.getHistory(this.page).subscribe({
      next: h => {
        this.history = [...this.history, ...h.content];
        this.hasMore = h.number + 1 < h.totalPages;
      },
    });
  }

  private buildPieSlices(data: MuscleSetStat[]): PieSlice[] {
    const total = data.reduce((s, d) => s + d.sets, 0);
    if (total === 0) return [];

    const cx = 100, cy = 100, r = 80, innerR = 52;
    let currentAngle = -Math.PI / 2;

    return data.map(d => {
      const fraction = d.sets / total;
      const angle = fraction * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const largeArc = angle > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);

      const path = [
        `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
        `L ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
        'Z',
      ].join(' ');

      return {
        path,
        color: MUSCLE_COLORS[d.category] ?? '#888',
        label: MUSCLE_LABELS[d.category] ?? d.category,
        sets: d.sets,
        percentage: Math.round(fraction * 100),
      };
    });
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)}h ${m % 60}min`;
  }

  formatDate(iso: string): { day: string; month: string } {
    const d = new Date(iso);
    return {
      day: d.getDate().toString(),
      month: d.toLocaleDateString('pt-BR', { month: 'short' }),
    };
  }

  openSession(h: WorkoutHistoryItem) {
    this.router.navigate(['/tabs/progress', h.sessionId]);
  }
}
