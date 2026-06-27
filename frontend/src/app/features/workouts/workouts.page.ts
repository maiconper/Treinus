import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { WorkoutService } from '../../core/services/workout.service';
import { ProgramService } from '../../core/services/program.service';
import { UserService } from '../../core/services/user.service';
import { ProgressService } from '../../core/services/progress.service';
import {
  Workout,
  Program,
  ProgramWeek,
  ProgramDay,
  User,
  WorkoutHistoryItem,
} from '../../core/models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

const DAY_LABELS: Record<number, string> = {
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
  7: 'Dom',
};

interface TimelineDay {
  globalIndex: number;
  weekNumber: number;
  dayOfWeek: number;
  date: Date;
  day?: ProgramDay;
  sessions: WorkoutHistoryItem[];
}

@Component({
  selector: 'app-workouts',
  templateUrl: './workouts.page.html',
  styleUrls: ['./workouts.page.scss'],
  standalone: false,
})
export class WorkoutsPage implements OnInit {
  @ViewChild('weekStrip') weekStripRef?: ElementRef<HTMLElement>;

  segment: 'workouts' | 'programs' = 'workouts';
  user: User | null = null;
  workouts: Workout[] = [];
  presets: Workout[] = [];
  programs: Program[] = [];
  activeProgram: Program | null = null;
  todaySessions: WorkoutHistoryItem[] = [];
  allHistory: WorkoutHistoryItem[] = [];
  timelineDays: TimelineDay[] = [];
  viewedWeekNumber = 1;
  private _todayGlobalIndex = 0;
  private scrollRaf = false;

  get allWorkouts(): Workout[] {
    return [...this.workouts, ...this.presets];
  }
  loading = true;

  readonly allDays = [1, 2, 3, 4, 5, 6, 7];
  readonly dayLabels = DAY_LABELS;

  constructor(
    private workoutService: WorkoutService,
    private programService: ProgramService,
    private userService: UserService,
    private progressService: ProgressService,
    private router: Router,
    private alert: AlertController,
    private actionSheet: ActionSheetController,
  ) {}

  ngOnInit() {
    this.load();
  }
  ionViewWillEnter() {
    this.load();
  }

  get todayIso(): string {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }

  load() {
    this.loading = true;
    forkJoin({
      user: this.userService.getMe(),
      workouts: this.workoutService.list(),
      presets: this.workoutService.listPresets(),
      programs: this.programService.list(),
      active: this.programService.getActive().pipe(catchError(() => of(null))),
      todaySessions: this.progressService
        .getHistoryForDate(this.todayIso)
        .pipe(catchError(() => of([]))),
      history: this.progressService
        .getAllHistory()
        .pipe(catchError(() => of([] as WorkoutHistoryItem[]))),
    }).subscribe({
      next: ({ user, workouts, presets, programs, active, todaySessions, history }) => {
        this.user = user;
        this.workouts = workouts;
        this.presets = presets;
        this.programs = programs;
        this.activeProgram = active;
        this.todaySessions = todaySessions;
        this.allHistory = history;
        this.buildTimeline();
        this.loading = false;
        setTimeout(() => this.scrollToToday());
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private toIso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private buildTimeline() {
    this.timelineDays = [];

    const sessionsByDate = new Map<string, WorkoutHistoryItem[]>();
    for (const s of this.allHistory) {
      const d = new Date(s.startedAt);
      const iso = this.toIso(d);
      if (!sessionsByDate.has(iso)) sessionsByDate.set(iso, []);
      sessionsByDate.get(iso)!.push(s);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Program anchor date (for week number lookups in programDayMap)
    let programStart: Date | null = null;
    if (this.activeProgram?.startedAt) {
      programStart = new Date(this.activeProgram.startedAt);
      programStart.setHours(0, 0, 0, 0);
    }

    // Timeline start: minimum of program start and earliest session
    let startDate: Date = programStart ? new Date(programStart) : new Date(today);

    if (this.allHistory.length > 0) {
      const earliest = new Date(
        Math.min(...this.allHistory.map((s) => new Date(s.startedAt).getTime())),
      );
      earliest.setHours(0, 0, 0, 0);
      if (earliest < startDate) startDate = new Date(earliest);
    }

    if (this.allHistory.length === 0 && !this.activeProgram) return;

    // Align startDate to Monday of its week
    const startDow = startDate.getDay();
    startDate.setDate(startDate.getDate() - (startDow === 0 ? 6 : startDow - 1));

    // Determine end: last program week end, or today (whichever is later)
    let endDate = new Date(today);
    if (this.activeProgram?.weeks?.length && programStart) {
      const lastWeekNum = Math.max(...this.activeProgram.weeks.map((w) => w.weekNumber));
      const programEnd = new Date(programStart);
      programEnd.setDate(programStart.getDate() + lastWeekNum * 7 - 1);
      if (programEnd > endDate) endDate = programEnd;
    }

    // Program day lookup keyed by PROGRAM week number (relative to programStart)
    const programDayMap = new Map<string, ProgramDay>();
    if (this.activeProgram) {
      for (const week of this.activeProgram.weeks) {
        for (const day of week.days) {
          programDayMap.set(`${week.weekNumber}-${day.dayOfWeek}`, day);
        }
      }
    }

    this._todayGlobalIndex = Math.floor(
      (today.getTime() - startDate.getTime()) / 86400000,
    );
    this.viewedWeekNumber = this.currentWeekNumber;

    const cur = new Date(startDate);
    while (cur <= endDate) {
      const iso = this.toIso(cur);
      const daysSince = Math.floor((cur.getTime() - startDate.getTime()) / 86400000);
      const timelineWeek = Math.floor(daysSince / 7) + 1;
      const jsDay = cur.getDay();
      const dow = jsDay === 0 ? 7 : jsDay;
      const sessions = sessionsByDate.get(iso) ?? [];

      // Look up program day using PROGRAM week (days since programStart)
      let programDay: ProgramDay | undefined;
      if (programStart) {
        const daysSinceProgram = Math.floor((cur.getTime() - programStart.getTime()) / 86400000);
        if (daysSinceProgram >= 0) {
          const programWeek = Math.floor(daysSinceProgram / 7) + 1;
          programDay = programDayMap.get(`${programWeek}-${dow}`);
        }
      }

      if (programDay !== undefined || sessions.length > 0) {
        this.timelineDays.push({
          globalIndex: daysSince,
          weekNumber: timelineWeek,
          dayOfWeek: dow,
          date: new Date(cur),
          day: programDay,
          sessions,
        });
      }

      cur.setDate(cur.getDate() + 1);
    }
  }

  private scrollToToday() {
    const strip = this.weekStripRef?.nativeElement;
    const todayEl = strip?.querySelector<HTMLElement>('.day-cell.is-today');
    if (!strip || !todayEl) return;
    strip.scrollLeft =
      todayEl.offsetLeft - strip.clientWidth / 2 + todayEl.clientWidth / 2;
    this.updateViewedWeek();
  }

  onStripScroll() {
    if (this.scrollRaf) return;
    this.scrollRaf = true;
    requestAnimationFrame(() => {
      this.updateViewedWeek();
      this.scrollRaf = false;
    });
  }

  private updateViewedWeek() {
    const strip = this.weekStripRef?.nativeElement;
    if (!strip) return;
    const centerX = strip.scrollLeft + strip.clientWidth / 2;
    let closestWeek = this.viewedWeekNumber;
    let closestDist = Infinity;
    for (const cell of Array.from(
      strip.querySelectorAll<HTMLElement>('.day-cell'),
    )) {
      const center = cell.offsetLeft + cell.offsetWidth / 2;
      const dist = Math.abs(center - centerX);
      if (dist < closestDist) {
        closestDist = dist;
        closestWeek = Number(cell.dataset['week']);
      }
    }
    this.viewedWeekNumber = closestWeek;
  }

  get todayGlobalIndex(): number {
    return this._todayGlobalIndex;
  }

  // ── Programa ativo ─────────────────────────────────────────────────────────

  get todayDow(): number {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  }

  get currentWeekNumber(): number {
    if (!this.activeProgram?.startedAt) return 1;
    const days = Math.floor(
      (Date.now() - new Date(this.activeProgram.startedAt).getTime()) /
        86400000,
    );
    return Math.max(
      1,
      Math.min(Math.floor(days / 7) + 1, this.activeProgram.weeksCount),
    );
  }

  get currentWeek(): ProgramWeek | undefined {
    return this.activeProgram?.weeks.find(
      (w) => w.weekNumber === this.currentWeekNumber,
    );
  }

  get nextWeek(): ProgramWeek | undefined {
    return this.activeProgram?.weeks.find(
      (w) => w.weekNumber === this.currentWeekNumber + 1,
    );
  }

  get todayDay(): ProgramDay | undefined {
    return this.currentWeek?.days.find((d) => d.dayOfWeek === this.todayDow);
  }

  get isTodayWorkoutDone(): boolean {
    const id = this.todayDay?.workoutId;
    if (!id) return false;
    return this.todaySessions.some((s) => s.workoutId === id);
  }

  getWeekDay(
    week: ProgramWeek | undefined,
    dow: number,
  ): ProgramDay | undefined {
    return week?.days.find((d) => d.dayOfWeek === dow);
  }

  get viewedMonthLabel(): string {
    const day = this.timelineDays.find(
      (d) => d.weekNumber === this.viewedWeekNumber,
    );
    if (!day) return '';
    return day.date
      .toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '')
      .toUpperCase();
  }

  abbrev(name: string | undefined): string {
    if (!name) return '';
    return name.split(/[\s·—–]/)[0];
  }

  getWorkoutForDay(day: ProgramDay | undefined): Workout | undefined {
    if (!day?.workoutId) return undefined;
    return [...this.workouts, ...this.presets].find(
      (w) => w.id === day.workoutId,
    );
  }

  estimatedMinutes(w: Workout): number {
    const secs = w.exercises.reduce((total, ex) => {
      const rest = ex.restSeconds ?? 60;
      return total + ex.plannedSets * (45 + rest);
    }, 0);
    const rounded = Math.round(secs / 60 / 5) * 5;
    return rounded || 30;
  }

  formatReps(ex: {
    plannedSets: number;
    plannedRepsMin?: number;
    plannedRepsMax?: number;
  }): string {
    const { plannedSets: sets, plannedRepsMin: min, plannedRepsMax: max } = ex;
    if (min && max && min !== max) return `${sets}×${min}–${max}`;
    if (min) return `${sets}×${min}`;
    return `${sets} séries`;
  }

  async onDayClick(d: TimelineDay) {
    if (d.globalIndex >= this.todayGlobalIndex) return;
    if (d.sessions.length === 0 && (!d.day || d.day.restDay)) return;

    const date = d.date;
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const sessions = d.sessions;

    if (sessions.length === 0) {
      const workoutName = this.getWorkoutForDay(d.day)?.name ?? '';
      const a = await this.alert.create({
        header: 'Nenhum treino registrado',
        message: workoutName
          ? `Nenhum treino registrado neste dia. Gostaria de registrar "${workoutName}"?`
          : 'Nenhum treino registrado neste dia. Gostaria de registrar um treino?',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Registrar treino',
            handler: () => {
              this.router.navigate(['/tabs/workouts/register'], {
                queryParams: {
                  date: iso,
                  dayId: d.day?.id ?? null,
                  workoutId: d.day?.workoutId ?? null,
                  workoutName,
                },
              });
            },
          },
        ],
      });
      await a.present();
      return;
    }

    if (sessions.length === 1) {
      this.router.navigate(['/tabs/progress', sessions[0].sessionId]);
      return;
    }

    const sheet = await this.actionSheet.create({
      header: 'Treinos do dia',
      buttons: [
        ...sessions.map((s) => ({
          text: `${s.workoutName} · ${this.formatTime(s.startedAt)}`,
          handler: () => {
            this.router.navigate(['/tabs/progress', s.sessionId]);
          },
        })),
        {
          text: 'Registrar outro treino',
          icon: 'add-circle-outline',
          handler: () => {
            this.router.navigate(['/tabs/workouts/register'], {
              queryParams: {
                date: iso,
                dayId: d.day?.id ?? null,
                workoutId: d.day?.workoutId ?? null,
                workoutName: '',
              },
            });
          },
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  goToHistory(sessionId: string) {
    this.router.navigate(['/tabs/progress', sessionId]);
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDuration(seconds: number): string {
    const m = Math.round(seconds / 60);
    return m < 60
      ? `${m} min`
      : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
  }

  editTodayWorkout() {
    if (this.todayDay?.workoutId) {
      this.router.navigate(['/tabs/workouts/builder', this.todayDay.workoutId]);
    }
  }

  startWorkout(day: ProgramDay) {
    if (day.workoutId) {
      this.router.navigate(['/tabs/workouts/builder', day.workoutId]);
    }
  }

  // ── Treinos avulsos ────────────────────────────────────────────────────────

  async onAddWorkout() {
    const sheet = await this.actionSheet.create({
      header: 'Adicionar treino',
      buttons: [
        {
          text: 'Criar novo treino',
          icon: 'add-circle-outline',
          handler: () => this.createWorkout(),
        },
        {
          text: 'Selecionar existente',
          icon: 'list-outline',
          handler: () => this.pickExistingWorkout(),
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  createWorkout() {
    this.router.navigate(['/tabs/workouts/builder']);
  }

  private async pickExistingWorkout() {
    if (this.allWorkouts.length === 0) {
      const t = await this.alert.create({
        header: 'Sem treinos disponíveis',
        message: 'Crie um treino primeiro.',
        buttons: ['OK'],
      });
      await t.present();
      return;
    }

    const sheet = await this.actionSheet.create({
      header: 'Selecionar treino',
      buttons: [
        ...this.allWorkouts.map((w) => ({
          text: w.name,
          handler: () => this.openWorkout(w),
        })),
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  openWorkout(w: Workout) {
    this.router.navigate(['/tabs/workouts/builder', w.id]);
  }

  async deleteWorkout(workout: Workout, event: Event) {
    event.stopPropagation();
    const a = await this.alert.create({
      header: 'Excluir treino?',
      message: `"${workout.name}" será removido permanentemente.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.workoutService
              .delete(workout.id)
              .subscribe({ next: () => this.load() });
          },
        },
      ],
    });
    await a.present();
  }

  // ── Programas ──────────────────────────────────────────────────────────────

  async createProgram() {
    const a = await this.alert.create({
      header: 'Novo programa',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nome do programa' },
        {
          name: 'weeksCount',
          type: 'number',
          placeholder: 'Número de semanas',
          value: '8',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Criar',
          handler: (data) => {
            if (!data.name?.trim()) return false;
            this.programService
              .create({ name: data.name, weeksCount: +data.weeksCount || 8 })
              .subscribe({
                next: (p) =>
                  this.router.navigate(['/tabs/workouts/programs', p.id]),
              });
            return true;
          },
        },
      ],
    });
    await a.present();
  }

  openProgram(p: Program) {
    this.router.navigate(['/tabs/workouts/programs', p.id]);
  }

  async deleteProgram(p: Program, event: Event) {
    event.stopPropagation();
    const a = await this.alert.create({
      header: 'Excluir programa?',
      message: `"${p.name}" será removido permanentemente.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.programService
              .delete(p.id)
              .subscribe({ next: () => this.load() });
          },
        },
      ],
    });
    await a.present();
  }

  getProgramStatusColor(status: string): string {
    if (status === 'ACTIVE') return 'var(--green)';
    if (status === 'COMPLETED') return 'var(--text3)';
    if (status === 'CANCELLED') return 'var(--text3)';
    return 'var(--amber)';
  }

  getProgramStatusLabel(status: string): string {
    if (status === 'ACTIVE') return 'Ativo';
    if (status === 'COMPLETED') return 'Concluído';
    if (status === 'CANCELLED') return 'Cancelado';
    return 'Rascunho';
  }
}
