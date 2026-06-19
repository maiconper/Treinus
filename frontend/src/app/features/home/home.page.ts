import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { ProgramService } from '../../core/services/program.service';
import { SessionService } from '../../core/services/session.service';
import { WorkoutService } from '../../core/services/workout.service';
import { AuthService } from '../../core/services/auth.service';
import { User, Program, Session, Workout, WorkoutExercise } from '../../core/models';
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
  ) {}

  ngOnInit() {
    this.sessionSub = this.sessionService.activeSession$.subscribe(s => {
      this.activeSession = s;
    });
    this.load();
  }

  ngOnDestroy() { this.sessionSub?.unsubscribe(); }

  ionViewWillEnter() { this.load(); }

  load() {
    this.loading = true;
    this.sessionService.getCurrent().pipe(catchError(() => of(null))).subscribe();
    forkJoin({
      user: this.userService.getMe(),
      program: this.programService.getActive().pipe(catchError(() => of(null))),
      workouts: this.workoutService.list().pipe(catchError(() => of([]))),
      presets: this.workoutService.listPresets().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ user, program, workouts, presets }) => {
        this.user = user;
        this.activeProgram = program;
        this.workouts = workouts;
        this.presets = presets;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  // TODO: lastWorkoutDate indica que ALGUM treino foi feito hoje, não que o treino do programa de hoje
  // foi concluído. Se o usuário trocar o treino do dia, o novo aparece como concluído incorretamente.
  // Solução correta: rastrear a sessão concluída por programDayId ou workoutId específico.
  get completedToday(): boolean {
    if (!this.user?.lastWorkoutDate) return false;
    const t = this.today;
    const local = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    return this.user.lastWorkoutDate === local;
  }

  get todayWorkout() {
    if (!this.activeProgram) return null;
    const todayKey = this.today.getDay();
    for (const week of this.activeProgram.weeks) {
      const day = week.days.find(d => d.dayOfWeek === todayKey && !d.restDay);
      if (day) return day;
    }
    return null;
  }

  get todayWorkoutDetails(): Workout | undefined {
    const id = this.todayWorkout?.workoutId;
    if (!id) return undefined;
    return [...this.workouts, ...this.presets].find(w => w.id === id);
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
    return this.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  get formattedDate(): string {
    return this.today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
  }

  getDayStatus(key: number): 'done' | 'today' | 'rest' | 'workout' | '' {
    const todayKey = this.today.getDay();
    if (key === todayKey) return 'today';
    if (!this.activeProgram) return '';
    const day = this.activeProgram.weeks[0]?.days.find(d => d.dayOfWeek === key);
    if (!day) return '';
    if (day.restDay) return 'rest';
    return 'workout';
  }

  getDayIcon(key: number): string {
    const status = this.getDayStatus(key);
    if (status === 'done') return 'checkmark';
    if (!this.activeProgram) return '';
    const day = this.activeProgram.weeks[0]?.days.find(d => d.dayOfWeek === key);
    if (!day) return '';
    return day.restDay ? 'moon-outline' : 'barbell-outline';
  }

  editWorkout() {
    const workoutId = this.todayWorkout?.workoutId;
    if (workoutId) {
      this.router.navigate(['/tabs/workouts/builder', workoutId]);
    }
  }

  startWorkout() {
    if (this.activeSession) {
      this.router.navigate(['/session', this.activeSession.id]);
    } else if (this.todayWorkout?.workoutId) {
      this.sessionService.start({ workoutId: this.todayWorkout.workoutId }).subscribe(s => {
        this.router.navigate(['/session', s.id]);
      });
    }
  }

  goToPrograms() { this.router.navigate(['/tabs/workouts']); }
}
