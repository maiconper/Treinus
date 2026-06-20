import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { SessionService } from '../../../core/services/session.service';
import { ExerciseService } from '../../../core/services/exercise.service';
import { Session, SessionExercise, Exercise } from '../../../core/models';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-active-session',
  templateUrl: './active-session.page.html',
  styleUrls: ['./active-session.page.scss'],
  standalone: false,
})
export class ActiveSessionPage implements OnInit, OnDestroy {
  session: Session | null = null;
  currentExerciseIndex = 0;
  reps = 10;
  weight = 0;
  restSeconds = 0;
  restRunning = false;
  private restTimer?: Subscription;
  private timerSub?: Subscription;
  elapsedSeconds = 0;
  infoExpanded = false;
  private exerciseInfoMap = new Map<string, Exercise>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private exerciseService: ExerciseService,
    private alert: AlertController,
    private loading: LoadingController,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.sessionService.get(id).subscribe((s) => {
      this.session = s;
      this.resetInputsForCurrentExercise();
      this.loadExerciseInfo(s);
    });
    this.timerSub = interval(1000).subscribe(() => this.elapsedSeconds++);
  }

  ngOnDestroy() {
    this.timerSub?.unsubscribe();
    this.restTimer?.unsubscribe();
  }

  get currentExercise(): SessionExercise | null {
    return this.session?.exercises[this.currentExerciseIndex] ?? null;
  }

  get progress(): number {
    if (!this.session) return 0;
    const total = this.session.exercises.length;
    return total ? (this.currentExerciseIndex / total) * 100 : 0;
  }

  get completedSets(): number {
    return this.currentExercise?.sets.length ?? 0;
  }

  get plannedSets(): number {
    return this.currentExercise?.plannedSets ?? 3;
  }

  get isExerciseDone(): boolean {
    return (
      this.completedSets >= this.plannedSets ||
      this.currentExercise?.status === 'SKIPPED'
    );
  }

  get isLastExercise(): boolean {
    return (
      this.currentExerciseIndex === (this.session?.exercises.length ?? 1) - 1
    );
  }

  get pendingExerciseCount(): number {
    if (!this.session) return 0;
    return this.session.exercises.filter(
      (ex) => ex.status !== 'SKIPPED' && ex.status !== 'COMPLETED',
    ).length;
  }

  get formattedTime(): string {
    const m = Math.floor(this.elapsedSeconds / 60);
    const s = this.elapsedSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  get restDisplay(): string {
    const m = Math.floor(this.restSeconds / 60);
    const s = this.restSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  startRest(seconds = 90) {
    this.restTimer?.unsubscribe();
    this.restSeconds = seconds;
    this.restRunning = true;
    this.restTimer = interval(1000).subscribe(() => {
      if (this.restSeconds > 0) {
        this.restSeconds--;
      } else {
        this.restRunning = false;
        this.restTimer?.unsubscribe();
      }
    });
  }

  adjustRest(delta: number) {
    this.restSeconds = Math.max(0, this.restSeconds + delta);
  }

  decWeight() {
    this.weight = Math.max(0, this.weight - 2.5);
  }
  decReps() {
    this.reps = Math.max(1, this.reps - 1);
  }

  async logSet() {
    if (!this.session || !this.currentExercise) return;
    const loader = await this.loading.create({
      spinner: 'crescent',
      duration: 500,
    });
    await loader.present();
    this.sessionService
      .logSet(this.session.id, this.currentExercise.id, {
        reps: this.reps,
        weightKg: this.weight,
      })
      .subscribe({
        next: (s) => {
          this.session = s;
          this.startRest(this.currentExercise?.restSeconds ?? 90);
        },
      });
  }

  async skipExercise() {
    if (!this.session || !this.currentExercise) return;
    const a = await this.alert.create({
      header: 'Pular exercício?',
      inputs: [
        { name: 'reason', type: 'text', placeholder: 'Motivo (opcional)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Pular',
          handler: (data) => {
            this.sessionService
              .skipExercise(this.session!.id, this.currentExercise!.id, {
                reason: data.reason,
              })
              .subscribe((s) => {
                this.session = s;
                this.nextExercise();
              });
          },
        },
      ],
    });
    await a.present();
  }

  nextExercise() {
    if (!this.session) return;
    if (this.currentExerciseIndex < this.session.exercises.length - 1) {
      this.currentExerciseIndex++;
      this.restTimer?.unsubscribe();
      this.restRunning = false;
      this.restSeconds = 0;
      this.infoExpanded = false;
      this.resetInputsForCurrentExercise();
    }
  }

  prevExercise() {
    if (this.currentExerciseIndex > 0) {
      this.currentExerciseIndex--;
      this.infoExpanded = false;
      this.resetInputsForCurrentExercise();
    }
  }

  private loadExerciseInfo(s: Session) {
    s.exercises.forEach((ex) => {
      if (!this.exerciseInfoMap.has(ex.exerciseId)) {
        this.exerciseService.get(ex.exerciseId).subscribe((info) => {
          this.exerciseInfoMap.set(ex.exerciseId, info);
        });
      }
    });
  }

  get currentExerciseInfo(): Exercise | null {
    const id = this.currentExercise?.exerciseId;
    return id ? (this.exerciseInfoMap.get(id) ?? null) : null;
  }

  toggleInfo(event: Event) {
    event.stopPropagation();
    this.infoExpanded = !this.infoExpanded;
  }

  private resetInputsForCurrentExercise() {
    const ex = this.currentExercise;
    this.reps = ex?.plannedRepsMax ?? ex?.plannedRepsMin ?? 10;
    this.weight = 0;
  }

  async finish() {
    if (!this.session) return;
    const pending = this.pendingExerciseCount;
    const message =
      pending > 0
        ? `Você ainda tem ${pending} exercício${pending > 1 ? 's' : ''} não concluído${pending > 1 ? 's' : ''}. Deseja finalizar mesmo assim?`
        : undefined;
    const a = await this.alert.create({
      header: 'Finalizar treino?',
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: pending > 0 ? 'Finalizar mesmo assim' : 'Finalizar',
          handler: () => {
            this.sessionService
              .finishSession(this.session!.id)
              .subscribe((summary) => {
                this.router.navigate(['/session', this.session!.id, 'finish'], {
                  state: { summary },
                });
              });
          },
        },
      ],
    });
    await a.present();
  }

  async abandon() {
    if (!this.session) return;
    const a = await this.alert.create({
      header: 'Abandonar treino?',
      message: 'O progresso desta sessão será perdido.',
      buttons: [
        { text: 'Continuar treinando', role: 'cancel' },
        {
          text: 'Abandonar',
          role: 'destructive',
          handler: () => {
            this.sessionService
              .abandonSession(this.session!.id)
              .subscribe(() => {
                this.router.navigate(['/tabs/home']);
              });
          },
        },
      ],
    });
    await a.present();
  }
}
