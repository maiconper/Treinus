import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  ToastController,
} from '@ionic/angular';
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
  timelineDays: TimelineDay[] = [];
  viewedWeekNumber = 1;
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
    private toast: ToastController,
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
    }).subscribe({
      next: ({ user, workouts, presets, programs, active, todaySessions }) => {
        this.user = user;
        this.workouts = workouts;
        this.presets = presets;
        this.programs = programs;
        this.activeProgram = active;
        this.todaySessions = todaySessions;
        this.buildTimeline();
        this.loading = false;
        setTimeout(() => this.scrollToToday());
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private buildTimeline() {
    this.timelineDays = [];
    this.viewedWeekNumber = this.currentWeekNumber;
    if (!this.activeProgram) return;
    const todayIdx = this.todayGlobalIndex;
    const today = new Date();
    const weeks = [...this.activeProgram.weeks].sort(
      (a, b) => a.weekNumber - b.weekNumber,
    );
    for (const week of weeks) {
      for (const dow of this.allDays) {
        const globalIndex = (week.weekNumber - 1) * 7 + (dow - 1);
        const date = new Date(today);
        date.setDate(today.getDate() + (globalIndex - todayIdx));
        this.timelineDays.push({
          globalIndex,
          weekNumber: week.weekNumber,
          dayOfWeek: dow,
          date,
          day: week.days.find((d) => d.dayOfWeek === dow),
        });
      }
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
    return (this.currentWeekNumber - 1) * 7 + (this.todayDow - 1);
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

  onDayClick(d: TimelineDay) {
    if (d.globalIndex >= this.todayGlobalIndex) return;
    if (!d.day || d.day.restDay) return;
    const date = d.date;
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    this.progressService.getHistoryForDate(iso).subscribe({
      next: async (sessions) => {
        if (!Array.isArray(sessions) || sessions.length === 0) {
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
                      dayId: d.day!.id,
                      workoutId: d.day!.workoutId ?? null,
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
                    dayId: d.day!.id,
                    workoutId: d.day!.workoutId ?? null,
                    workoutName: '',
                  },
                });
              },
            },
            { text: 'Cancelar', role: 'cancel' },
          ],
        });
        await sheet.present();
      },
      error: (err) => {
        console.error('[onDayClick] erro ao buscar sessões:', err);
        this.showToast('Erro ao carregar treinos deste dia.');
      },
    });
  }

  private async showToast(message: string) {
    const t = await this.toast.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await t.present();
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
