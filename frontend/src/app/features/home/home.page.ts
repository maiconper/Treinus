import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { UserService } from '../../core/services/user.service';
import { ProgramService } from '../../core/services/program.service';
import { SessionService } from '../../core/services/session.service';
import { WorkoutService } from '../../core/services/workout.service';
import { AuthService } from '../../core/services/auth.service';
import { ProgressService } from '../../core/services/progress.service';
import {
  User,
  Program,
  ProgramDay,
  ProgramWeek,
  Session,
  Workout,
  WorkoutExercise,
  WorkoutHistoryItem,
  WorkoutHistory,
  ProgressSummary,
} from '../../core/models';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  user: User | null = null;
  summary: ProgressSummary | null = null;
  activeProgram: Program | null = null;
  activeSession: Session | null = null;
  workouts: Workout[] = [];
  presets: Workout[] = [];
  todaySessions: WorkoutHistoryItem[] = [];
  weekDoneDays = new Set<number>();
  today = new Date();
  loading = true;
  private sessionSub?: Subscription;

  weekDays = [
    { label: 'S', key: 1 },
    { label: 'T', key: 2 },
    { label: 'Q', key: 3 },
    { label: 'Q', key: 4 },
    { label: 'S', key: 5 },
    { label: 'S', key: 6 },
    { label: 'D', key: 0 },
  ];

  constructor(
    private userService: UserService,
    private programService: ProgramService,
    private sessionService: SessionService,
    private workoutService: WorkoutService,
    private auth: AuthService,
    private router: Router,
    private progressService: ProgressService,
    private actionSheet: ActionSheetController,
    private alertCtrl: AlertController,
  ) {}

  ngOnInit() {
    this.sessionSub = this.sessionService.activeSession$.subscribe((s) => {
      this.activeSession = s;
    });
    this.load();
  }

  ngOnDestroy() {
    this.sessionSub?.unsubscribe();
  }

  ionViewWillEnter() {
    this.load();
  }

  get todayIso(): string {
    const t = this.today;
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }

  private getWeekBounds(): { start: Date; end: Date } {
    const day = this.today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(this.today);
    monday.setDate(this.today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  }

  load() {
    this.loading = true;
    this.sessionService
      .getCurrent()
      .pipe(catchError(() => of(null)))
      .subscribe();
    forkJoin({
      user: this.userService.getMe(),
      summary: this.progressService.getSummary().pipe(catchError(() => of(null))),
      program: this.programService.getActive().pipe(catchError(() => of(null))),
      workouts: this.workoutService.list().pipe(catchError(() => of([]))),
      presets: this.workoutService.listPresets().pipe(catchError(() => of([]))),
      todaySessions: this.progressService
        .getHistoryForDate(this.todayIso)
        .pipe(catchError(() => of([]))),
      weekHistory: this.progressService
        .getHistory(0, 14)
        .pipe(
          catchError(() =>
            of({
              content: [],
              totalElements: 0,
              totalPages: 0,
              number: 0,
              size: 0,
            } as WorkoutHistory),
          ),
        ),
    }).subscribe({
      next: ({
        user,
        summary,
        program,
        workouts,
        presets,
        todaySessions,
        weekHistory,
      }) => {
        this.user = user;
        this.summary = summary;
        this.activeProgram = program;
        this.workouts = workouts;
        this.presets = presets;
        this.todaySessions = todaySessions;
        const { start, end } = this.getWeekBounds();
        const fromHistory = weekHistory.content
          .filter((s) => {
            const d = new Date(s.startedAt);
            return d >= start && d <= end;
          })
          .map((s) => new Date(s.startedAt).getDay());
        this.weekDoneDays = new Set([
          ...fromHistory,
          ...(todaySessions.length > 0 ? [this.today.getDay()] : []),
        ]);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get todayProgramWeek(): ProgramWeek | null {
    if (!this.activeProgram?.startedAt) return null;
    const start = new Date(this.activeProgram.startedAt);
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const todayDay = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    const daysDiff = Math.floor((todayDay.getTime() - startDay.getTime()) / 86_400_000);
    const weekNumber = Math.floor(daysDiff / 7) + 1;
    return this.activeProgram.weeks.find(w => w.weekNumber === weekNumber) ?? null;
  }

  get todayDayNumber(): number {
    if (!this.activeProgram?.startedAt || !this.todayProgramWeek) return 0;
    const startBackendDay = this.toBackendDay(new Date(this.activeProgram.startedAt).getDay());
    const todayKey = this.toBackendDay(this.today.getDay());
    const currentWeekNum = this.todayProgramWeek.weekNumber;
    // offset within a program week relative to the start day (0 = start day, 1 = next day, ..., 6 = last day)
    const todayOffset = (todayKey - startBackendDay + 7) % 7;
    let count = 0;
    for (const week of this.activeProgram.weeks) {
      if (week.weekNumber > currentWeekNum) break;
      for (const d of week.days) {
        if (d.restDay) continue;
        const dayOffset = (d.dayOfWeek - startBackendDay + 7) % 7;
        if (week.weekNumber < currentWeekNum || dayOffset <= todayOffset) {
          count++;
        }
      }
    }
    return count;
  }

  private toBackendDay(jsDay: number): number {
    return jsDay === 0 ? 7 : jsDay;
  }

  get todayWorkoutLetter(): string {
    if (!this.todayProgramWeek || !this.todayWorkout) return '';
    const trainingDays = [...this.todayProgramWeek.days]
      .filter((d) => !d.restDay)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    const idx = trainingDays.findIndex((d) => d.id === this.todayWorkout!.id);
    return idx >= 0 ? String.fromCharCode(65 + idx) : '';
  }

  formatVolume(kg: number | undefined): string {
    if (!kg) return '0kg';
    if (kg >= 1000) {
      const tons = kg / 1000;
      return `${tons % 1 === 0 ? tons.toFixed(0) : tons.toFixed(1)}t`;
    }
    return `${Math.round(kg)}kg`;
  }

  get todayWorkout() {
    if (!this.activeProgram) return null;
    const todayKey = this.toBackendDay(this.today.getDay());
    for (const week of this.activeProgram.weeks) {
      const day = week.days.find((d) => d.dayOfWeek === todayKey && !d.restDay);
      if (day) return day;
    }
    return null;
  }

  get isTodayRestDay(): boolean {
    if (!this.activeProgram) return false;
    const todayKey = this.toBackendDay(this.today.getDay());
    for (const week of this.activeProgram.weeks) {
      const day = week.days.find((d) => d.dayOfWeek === todayKey && d.restDay);
      if (day) return true;
    }
    return false;
  }

  get todayProgramDay() {
    if (!this.activeProgram) return null;
    const todayKey = this.toBackendDay(this.today.getDay());
    for (const week of this.activeProgram.weeks) {
      const day = week.days.find((d) => d.dayOfWeek === todayKey);
      if (day) return day;
    }
    return null;
  }

  get isTodayWorkoutDone(): boolean {
    const id = this.todayWorkout?.workoutId;
    if (!id) return false;
    return this.todaySessions.some((s) => s.workoutId === id);
  }

  get todayWorkoutDetails(): Workout | undefined {
    const id = this.todayWorkout?.workoutId;
    if (!id) return undefined;
    return [...this.workouts, ...this.presets].find((w) => w.id === id);
  }

  get tomorrowWorkout() {
    if (!this.activeProgram) return null;
    const tomorrowKey = this.toBackendDay((this.today.getDay() + 1) % 7);
    for (const week of this.activeProgram.weeks) {
      const day = week.days.find(
        (d) => d.dayOfWeek === tomorrowKey && !d.restDay,
      );
      if (day) return day;
    }
    return null;
  }

  get tomorrowWorkoutDetails(): Workout | undefined {
    const id = this.tomorrowWorkout?.workoutId;
    if (!id) return undefined;
    return [...this.workouts, ...this.presets].find((w) => w.id === id);
  }

  estimatedMinutes(w: Workout): number {
    const secs = w.exercises.reduce((total, ex) => {
      const rest = ex.restSeconds ?? 60;
      return total + ex.plannedSets * (45 + rest);
    }, 0);
    const rounded = Math.round(secs / 60 / 5) * 5;
    return rounded || 30;
  }

  formatReps(ex: WorkoutExercise): string {
    const { plannedSets: sets, plannedRepsMin: min, plannedRepsMax: max } = ex;
    if (min && max && min !== max) return `${sets}×${min}–${max}`;
    if (min) return `${sets}×${min}`;
    return `${sets} séries`;
  }

  get programPercent(): number {
    if (!this.activeProgram) return 0;
    const trainingDays = ([] as ProgramDay[])
      .concat(...this.activeProgram.weeks.map((w) => w.days))
      .filter((d) => !d.restDay);
    if (!trainingDays.length) return 0;
    const done = trainingDays.filter((d) => d.completed).length;
    return Math.round((done / trainingDays.length) * 100);
  }

  get greeting(): string {
    const h = this.today.getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  get firstName(): string {
    return this.user?.name?.split(' ')[0] ?? '';
  }

  get userInitials(): string {
    if (!this.user?.name) return '?';
    return this.user.name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  get formattedDate(): string {
    const weekday = this.today
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '');
    const day = this.today.getDate();
    const month = this.today
      .toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '');
    return `${weekday} · ${day} ${month}`.toUpperCase();
  }

  getDayStatus(key: number): 'done' | 'today' | 'rest' | 'upcoming' | '' {
    if (this.weekDoneDays.has(key)) return 'done';
    if (key === this.today.getDay()) return 'today';
    if (this.activeProgram && this.isFutureDay(key)) {
      const day = this.activeProgram.weeks[0]?.days.find(
        (d) => d.dayOfWeek === this.toBackendDay(key),
      );
      if (day?.restDay) return 'rest';
      if (day) return 'upcoming';
    }
    return '';
  }

  private isFutureDay(key: number): boolean {
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.indexOf(key) > order.indexOf(this.today.getDay());
  }

  async openRestDayOptions() {
    const sheet = await this.actionSheet.create({
      header: 'Dia de descanso',
      buttons: [
        {
          text: 'Adicionar treino ao programa',
          icon: 'barbell-outline',
          handler: () => { this.openRestDayWorkoutPicker(); },
        },
        {
          text: 'Registrar treino feito',
          icon: 'checkmark-circle-outline',
          handler: () => {
            this.router.navigate(['/tabs/workouts/register'], {
              queryParams: { date: this.todayIso },
            });
          },
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async openRestDayWorkoutPicker() {
    const allWorkouts = [...this.workouts, ...this.presets];
    if (!allWorkouts.length) return;
    const sheet = await this.actionSheet.create({
      header: 'Selecionar treino',
      buttons: [
        ...this.workouts.map((w) => ({
          text: w.name,
          handler: () => { this.assignWorkoutToRestDay(w.id); },
        })),
        ...this.presets.map((w) => ({
          text: `${w.name} ★`,
          handler: () => { this.assignWorkoutToRestDay(w.id); },
        })),
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async openNoWorkoutOptions() {
    const buttons: any[] = [];

    if (this.activeProgram && this.todayProgramWeek) {
      buttons.push({
        text: 'Adicionar treino ao programa',
        icon: 'barbell-outline',
        handler: () => { this.openNoWorkoutPicker(); },
      });
    }

    buttons.push(
      {
        text: 'Registrar treino feito',
        icon: 'checkmark-circle-outline',
        handler: () => {
          this.router.navigate(['/tabs/workouts/register'], {
            queryParams: { date: this.todayIso },
          });
        },
      },
      {
        text: 'Iniciar treino livre',
        icon: 'play-outline',
        handler: () => { this.router.navigate(['/tabs/workouts']); },
      },
      { text: 'Cancelar', role: 'cancel' },
    );

    const sheet = await this.actionSheet.create({
      header: 'O que deseja fazer?',
      buttons,
    });
    await sheet.present();
  }

  private async openNoWorkoutPicker() {
    const allWorkouts = [...this.workouts, ...this.presets];
    if (!allWorkouts.length) return;
    const sheet = await this.actionSheet.create({
      header: 'Selecionar treino',
      buttons: [
        ...this.workouts.map((w) => ({
          text: w.name,
          handler: () => { this.addWorkoutToToday(w.id); },
        })),
        ...this.presets.map((w) => ({
          text: `${w.name} ★`,
          handler: () => { this.addWorkoutToToday(w.id); },
        })),
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private addWorkoutToToday(workoutId: string) {
    const programId = this.activeProgram?.id;
    const weekId = this.todayProgramWeek?.id;
    const todayKey = this.toBackendDay(this.today.getDay());
    if (!programId || !weekId) return;
    this.programService.addDay(programId, weekId, { dayOfWeek: todayKey, workoutId, restDay: false })
      .subscribe(() => this.load());
  }

  private assignWorkoutToRestDay(workoutId: string) {
    const programId = this.activeProgram?.id;
    const weekId = this.todayProgramWeek?.id;
    const dayId = this.todayProgramDay?.id;
    if (!programId || !weekId || !dayId) return;
    this.programService.updateDay(programId, weekId, dayId, { workoutId, restDay: false })
      .subscribe(() => this.load());
  }

  async openWorkoutOptions() {
    const sheet = await this.actionSheet.create({
      header: 'Treino de hoje',
      buttons: [
        {
          text: 'Editar',
          icon: 'pencil-outline',
          handler: () => {
            const workoutId = this.todayWorkout?.workoutId;
            if (workoutId) this.router.navigate(['/tabs/workouts/builder', workoutId]);
          },
        },
        {
          text: 'Substituir',
          icon: 'swap-horizontal-outline',
          handler: () => { this.openSubstituteSheet(); },
        },
        {
          text: 'Remover',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => { this.confirmRemoveWorkout(); },
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async openSubstituteSheet() {
    const allWorkouts = [...this.workouts, ...this.presets];
    if (!allWorkouts.length) return;

    const sheet = await this.actionSheet.create({
      header: 'Selecionar treino',
      buttons: [
        ...this.workouts.map(w => ({
          text: w.name,
          handler: () => { this.applySubstitution(w.id); },
        })),
        ...this.presets.map(w => ({
          text: `${w.name} ★`,
          handler: () => { this.applySubstitution(w.id); },
        })),
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private applySubstitution(workoutId: string) {
    const programId = this.activeProgram?.id;
    const weekId = this.todayProgramWeek?.id;
    const dayId = this.todayWorkout?.id;
    if (!programId || !weekId || !dayId) return;
    this.programService.updateDay(programId, weekId, dayId, { workoutId, restDay: false })
      .subscribe(() => this.load());
  }

  private async confirmRemoveWorkout() {
    const alert = await this.alertCtrl.create({
      header: 'Remover treino?',
      message: 'O treino de hoje será removido do programa.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Remover',
          role: 'destructive',
          handler: () => {
            const programId = this.activeProgram?.id;
            const weekId = this.todayProgramWeek?.id;
            const dayId = this.todayWorkout?.id;
            if (!programId || !weekId || !dayId) return;
            this.programService.removeDay(programId, weekId, dayId)
              .subscribe(() => this.load());
          },
        },
      ],
    });
    await alert.present();
  }

  openTomorrowWorkout() {
    const workoutId = this.tomorrowWorkout?.workoutId;
    if (workoutId) {
      this.router.navigate(['/tabs/workouts/builder', workoutId]);
    }
  }

  startWorkout() {
    if (this.activeSession) {
      this.router.navigate(['/session', this.activeSession.id]);
    } else if (this.todayWorkout?.workoutId) {
      this.router.navigate(['/session/prepare', this.todayWorkout.workoutId], {
        queryParams: { programDayId: this.todayWorkout.id },
      });
    }
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

  goToPrograms() {
    this.router.navigate(['/tabs/workouts']);
  }
}
