import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';
import { WorkoutService } from '../../../core/services/workout.service';
import { Workout, WorkoutExercise } from '../../../core/models';

const COUNTDOWN_SECONDS = 5;

@Component({
  selector: 'app-prepare-session',
  templateUrl: './prepare-session.page.html',
  styleUrls: ['./prepare-session.page.scss'],
  standalone: false,
})
export class PrepareSessionPage implements OnInit, OnDestroy {
  workout: Workout | null = null;
  loading = true;
  error = false;
  starting = false;
  countdownStarted = false;
  secondsLeft = COUNTDOWN_SECONDS;

  private workoutId!: string;
  private programDayId?: string;
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private sessionService: SessionService,
    private workoutService: WorkoutService,
  ) {}

  ngOnInit() {
    this.workoutId = this.route.snapshot.paramMap.get('workoutId')!;
    this.programDayId = this.route.snapshot.queryParamMap.get('programDayId') ?? undefined;

    this.workoutService.get(this.workoutId).subscribe({
      next: (w) => {
        this.workout = w;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  startWorkout() {
    this.countdownStarted = true;
    this.startCountdown();
  }

  cancel() {
    this.location.back();
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

  private startCountdown() {
    this.timer = setInterval(() => {
      this.secondsLeft--;
      if (this.secondsLeft <= 0) {
        this.beginSession();
      }
    }, 1000);
  }

  private beginSession() {
    if (this.starting) return;
    this.starting = true;
    if (this.timer) clearInterval(this.timer);
    this.sessionService
      .start({ workoutId: this.workoutId, programDayId: this.programDayId })
      .subscribe({
        next: (session) => this.router.navigate(['/session', session.id], { replaceUrl: true }),
        error: () => {
          this.starting = false;
        },
      });
  }
}
