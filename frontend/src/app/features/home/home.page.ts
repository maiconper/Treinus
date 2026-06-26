import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { ProgramService } from '../../core/services/program.service';
import { SessionService } from '../../core/services/session.service';
import { WorkoutService } from '../../core/services/workout.service';
import { AuthService } from '../../core/services/auth.service';
import { ProgressService } from '../../core/services/progress.service';
import {
  User,
  Program,
  Session,
  Workout,
  WorkoutExercise,
  WorkoutHistoryItem,
  WorkoutHistory,
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
        program,
        workouts,
        presets,
        todaySessions,
        weekHistory,
      }) => {
        this.user = user;
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

  private toBackendDay(jsDay: number): number {
    return jsDay === 0 ? 7 : jsDay;
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
    // Simplified: based on started weeks
    return 4;
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
    return this.today.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
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

  editWorkout() {
    const workoutId = this.todayWorkout?.workoutId;
    if (workoutId) {
      this.router.navigate(['/tabs/workouts/builder', workoutId]);
    }
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
      this.sessionService
        .start({ workoutId: this.todayWorkout.workoutId })
        .subscribe((s) => {
          this.router.navigate(['/session', s.id]);
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
