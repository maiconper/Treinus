import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';
import { ExerciseProgress, ExerciseProgressEntry, HeatmapDay, MuscleSetStat, PersonalRecord, ProgressSummary, TopExercise, WeeklyVolume, WorkoutHistoryItem } from '../../core/models';

interface WeeklyVolumeBar {
  weekStart: string;
  totalVolumeKg: number;
  barX: number;
  barY: number;
  barW: number;
  barH: number;
  monthLabel: string;
  isCurrentWeek: boolean;
}

interface HeatmapCell {
  date: string;
  count: number;
  col: number;
  row: number;
  isToday: boolean;
}

interface HeatmapMonthLabel {
  label: string;
  col: number;
}

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
  topExPeriod: MusclePeriod = 'ALL';

  // Personal records
  prList: PersonalRecord[] = [];
  prCategory = '';

  // Weekly volume
  weeklyVolumeWeeks = 12;
  weeklyVolumeBars: WeeklyVolumeBar[] = [];
  weeklyVolumeMaxKg = 0;
  weeklyVolumeAvgKg = 0;

  // Heatmap
  heatmapMonths = 6;
  heatmapCells: HeatmapCell[] = [];
  heatmapMonthLabels: HeatmapMonthLabel[] = [];
  heatmapSvgWidth = 0;
  heatmapTrainedDays = 0;
  private heatmapData: HeatmapDay[] = [];
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
    this.loadTopExercises();
    this.loadHeatmap();
    this.loadPersonalRecords();
    this.loadWeeklyVolume();
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

  loadTopExercises() {
    this.progressService.getTopExercises(3, this.topExPeriod).subscribe({
      next: data => { this.topExercises = data; },
    });
  }

  selectTopExPeriod(period: MusclePeriod) {
    if (this.topExPeriod === period) return;
    this.topExPeriod = period;
    this.loadTopExercises();
  }

  loadPersonalRecords() {
    this.progressService.getPersonalRecords().subscribe({
      next: data => { this.prList = data; },
    });
  }

  get prAvailableCategories(): string[] {
    return [...new Set(this.prList.map(p => p.category).filter((c): c is string => !!c))];
  }

  get filteredPrList(): PersonalRecord[] {
    if (!this.prCategory) return this.prList;
    return this.prList.filter(p => p.category === this.prCategory);
  }

  muscleLabel(category: string | null): string {
    return category ? (MUSCLE_LABELS[category] ?? category) : '';
  }

  formatPrDate(dateStr: string): string {
    const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const [, m, d] = dateStr.split('-').map(Number);
    return `${d} ${MONTHS[m - 1]}`;
  }

  loadHeatmap() {
    this.progressService.getHeatmap(this.heatmapMonths).subscribe({
      next: data => { this.heatmapData = data; this.buildHeatmap(); },
    });
  }

  selectHeatmapMonths(months: number) {
    if (this.heatmapMonths === months) return;
    this.heatmapMonths = months;
    this.loadHeatmap();
  }

  loadWeeklyVolume() {
    this.progressService.getWeeklyVolume(this.weeklyVolumeWeeks).subscribe({
      next: data => this.buildWeeklyVolumeBars(data),
    });
  }

  selectWeeklyVolumeWeeks(weeks: number) {
    if (this.weeklyVolumeWeeks === weeks) return;
    this.weeklyVolumeWeeks = weeks;
    this.loadWeeklyVolume();
  }

  private buildWeeklyVolumeBars(data: WeeklyVolume[]) {
    if (!data.length) { this.weeklyVolumeBars = []; this.weeklyVolumeMaxKg = 0; this.weeklyVolumeAvgKg = 0; return; }

    const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const LEFT = 38, RIGHT = 295, BOTTOM = 105, CHART_H = 95;
    const n = data.length;
    const step = (RIGHT - LEFT) / n;
    const barW = Math.min(step * 0.65, 16);
    const maxVol = Math.max(...data.map(d => d.totalVolumeKg));
    this.weeklyVolumeMaxKg = maxVol;

    const nonZero = data.filter(d => d.totalVolumeKg > 0);
    this.weeklyVolumeAvgKg = nonZero.length > 0
      ? Math.round(nonZero.reduce((s, d) => s + d.totalVolumeKg, 0) / nonZero.length)
      : 0;

    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setHours(0, 0, 0, 0);
    const currentWeekStr = monday.toISOString().substring(0, 10);

    let lastMonth = -1;
    this.weeklyVolumeBars = data.map((d, i) => {
      const barH = maxVol > 0 ? Math.max((d.totalVolumeKg / maxVol) * CHART_H, d.totalVolumeKg > 0 ? 2 : 0) : 0;
      const barX = LEFT + i * step + (step - barW) / 2;
      const month = parseInt(d.weekStart.substring(5, 7), 10) - 1;
      let monthLabel = '';
      if (month !== lastMonth) { monthLabel = MONTHS_PT[month]; lastMonth = month; }
      return {
        weekStart: d.weekStart,
        totalVolumeKg: d.totalVolumeKg,
        barX,
        barY: BOTTOM - barH,
        barW,
        barH,
        monthLabel,
        isCurrentWeek: d.weekStart === currentWeekStr,
      };
    });
  }

  get weeklyVolumeYLabels(): Array<{ label: string; cy: number }> {
    const max = this.weeklyVolumeMaxKg;
    if (!max) return [];
    const fmt = (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v).toString();
    return [
      { label: fmt(max), cy: 10 },
      { label: fmt(max / 2), cy: 57 },
    ];
  }

  private buildHeatmap() {
    const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().substring(0, 10);

    const start = new Date(today);
    start.setMonth(start.getMonth() - this.heatmapMonths);
    const dow = start.getDay(); // 0=Sun
    start.setDate(start.getDate() + (dow === 0 ? -6 : 1 - dow)); // align to Monday

    const dayMap = new Map(this.heatmapData.map(d => [d.date, d.count]));
    const cells: HeatmapCell[] = [];
    const labels: HeatmapMonthLabel[] = [];
    let d = new Date(start);
    let dayOffset = 0;
    let lastLabelMonth = -1;

    while (d <= today) {
      const dateStr = d.toISOString().substring(0, 10);
      const col = Math.floor(dayOffset / 7);
      const row = dayOffset % 7;

      cells.push({ date: dateStr, count: dayMap.get(dateStr) ?? 0, col, row, isToday: dateStr === todayStr });

      if (row === 0) {
        const month = d.getMonth();
        if (month !== lastLabelMonth) {
          labels.push({ label: MONTHS_PT[month], col });
          lastLabelMonth = month;
        }
      }

      d.setDate(d.getDate() + 1);
      dayOffset++;
    }

    const numWeeks = cells.length > 0 ? cells[cells.length - 1].col + 1 : 0;
    this.heatmapCells = cells;
    this.heatmapMonthLabels = labels;
    this.heatmapSvgWidth = 24 + numWeeks * 13;
    this.heatmapTrainedDays = this.heatmapData.length;
  }

  get heatmapMaxCount(): number {
    return this.heatmapCells.reduce((m, c) => Math.max(m, c.count), 0);
  }

  heatmapCellColor(cell: HeatmapCell): string {
    if (cell.count === 0) return 'var(--ice-track)';
    if (this.heatmapMaxCount >= 2 && cell.count === this.heatmapMaxCount) return 'var(--volt)';
    if (cell.count === 1) return 'var(--ice-1)';
    if (cell.count === 2) return 'var(--ice-2)';
    if (cell.count === 3) return 'var(--ice-3)';
    return 'var(--ice-4)';
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
