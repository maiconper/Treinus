import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';
import { ExerciseProgress, ExerciseProgressEntry, MuscleSetStat, ProgressSummary, TopExercise, WorkoutHistoryItem } from '../../core/models';

interface SessionPoint {
  sessionId: string;
  date: string;
  maxWeight: number;
  isPR: boolean;
  setsCount: number;
  dateLabel: string;
  dayNum: string;
}

interface ChartPoint {
  sessionId: string;
  maxWeight: number;
  isPR: boolean;
  cx: number;
  cy: number;
}

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

  // Evolução tab
  activeTab = 'resumo';
  exercisesDone: TopExercise[] = [];
  searchText = '';
  showSuggestions = false;
  selectedExercise: TopExercise | null = null;
  exerciseProgress: ExerciseProgress | null = null;
  exerciseLoading = false;
  exPeriod = 'all';
  readonly exPeriods = [
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: '6m', label: '6M' },
    { value: 'all', label: 'Tudo' },
  ];

  private readonly CL = 40; private readonly CR = 285;
  private readonly CT = 12; private readonly CB = 102;
  private readonly CW = 245; private readonly CH = 90;

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
    this.progressService.getExercisesDone().subscribe({
      next: data => { this.exercisesDone = data; },
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

  // --- Exercise evolution ---

  get filteredSuggestions(): TopExercise[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.exercisesDone.slice(0, 6);
    return this.exercisesDone.filter(e => e.exerciseName.toLowerCase().includes(q));
  }

  onExerciseSearch(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value;
    this.showSuggestions = true;
    if (this.selectedExercise) {
      this.selectedExercise = null;
      this.exerciseProgress = null;
    }
  }

  onSearchBlur() {
    setTimeout(() => { this.showSuggestions = false; }, 200);
  }

  selectExercise(ex: TopExercise) {
    this.selectedExercise = ex;
    this.searchText = ex.exerciseName;
    this.showSuggestions = false;
    this.loadExerciseProgress();
  }

  clearExercise() {
    this.selectedExercise = null;
    this.exerciseProgress = null;
    this.searchText = '';
    this.showSuggestions = false;
  }

  selectExPeriod(period: string) {
    if (this.exPeriod === period) return;
    this.exPeriod = period;
    this.loadExerciseProgress();
  }

  loadExerciseProgress() {
    if (!this.selectedExercise) return;
    this.exerciseLoading = true;
    this.exerciseProgress = null;
    this.progressService.getExerciseProgress(this.selectedExercise.exerciseId, this.exPeriod).subscribe({
      next: data => { this.exerciseProgress = data; this.exerciseLoading = false; },
      error: () => { this.exerciseLoading = false; },
    });
  }

  get sessionPoints(): SessionPoint[] {
    return this.groupBySession(this.exerciseProgress?.history ?? []);
  }

  get maxLoad(): number {
    return this.sessionPoints.reduce((max, p) => Math.max(max, p.maxWeight), 0);
  }

  get loadDelta(): number {
    const pts = this.sessionPoints;
    if (pts.length < 2) return 0;
    return Math.round((pts[pts.length - 1].maxWeight - pts[0].maxWeight) * 10) / 10;
  }

  get lastSessions(): SessionPoint[] {
    return [...this.sessionPoints].reverse().slice(0, 4);
  }

  get chartPoints(): ChartPoint[] {
    const pts = this.sessionPoints;
    if (!pts.length) return [];
    const weights = pts.map(p => p.maxWeight);
    let minW = Math.min(...weights), maxW = Math.max(...weights);
    if (minW === maxW) { minW -= 5; maxW += 5; }
    const range = maxW - minW;
    const n = pts.length;
    return pts.map((p, i) => ({
      sessionId: p.sessionId,
      maxWeight: p.maxWeight,
      isPR: p.isPR,
      cx: n === 1 ? (this.CL + this.CR) / 2 : this.CL + (i / (n - 1)) * this.CW,
      cy: this.CB - ((p.maxWeight - minW) / range) * this.CH,
    }));
  }

  get chartLinePath(): string {
    const pts = this.chartPoints;
    if (pts.length < 2) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(' ');
  }

  get chartYLabels(): Array<{ value: string; cy: number }> {
    const pts = this.sessionPoints;
    if (!pts.length) return [];
    const weights = pts.map(p => p.maxWeight);
    let minW = Math.min(...weights), maxW = Math.max(...weights);
    if (minW === maxW) { minW -= 5; maxW += 5; }
    const range = maxW - minW;
    const toCy = (w: number) => this.CB - ((w - minW) / range) * this.CH;
    const fmt = (w: number) => w % 1 === 0 ? `${w}` : `${w.toFixed(1)}`;
    return [
      { value: fmt(maxW), cy: toCy(maxW) },
      { value: fmt(Math.round((minW + maxW) / 2)), cy: toCy((minW + maxW) / 2) },
      { value: fmt(minW), cy: toCy(minW) },
    ];
  }

  get chartXLabels(): Array<{ label: string; cx: number }> {
    const pts = this.chartPoints;
    if (!pts.length) return [];
    const n = pts.length;
    const spts = this.sessionPoints;
    const indices = new Set([0, n - 1]);
    if (n > 4) { indices.add(Math.round(n / 3)); indices.add(Math.round(2 * n / 3)); }
    else if (n > 2) { indices.add(Math.round(n / 2)); }
    return [...indices].sort((a, b) => a - b).map(i => ({
      label: spts[i].dateLabel,
      cx: pts[i].cx,
    }));
  }

  private groupBySession(history: ExerciseProgressEntry[]): SessionPoint[] {
    if (!history?.length) return [];
    const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const map = new Map<string, SessionPoint>();
    for (const entry of history) {
      const sid = entry.sessionId;
      if (!map.has(sid)) {
        const d = new Date(entry.sessionStartedAt);
        map.set(sid, {
          sessionId: sid,
          date: entry.sessionStartedAt.substring(0, 10),
          maxWeight: 0, isPR: false, setsCount: 0,
          dateLabel: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
          dayNum: d.getDate().toString(),
        });
      }
      const p = map.get(sid)!;
      p.setsCount++;
      if (entry.weightKg > p.maxWeight) p.maxWeight = entry.weightKg;
      if (entry.personalRecord) p.isPR = true;
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
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
