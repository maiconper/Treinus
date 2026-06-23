import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ModalController, ToastController } from '@ionic/angular';
import { SessionService } from '../../../core/services/session.service';
import { ExerciseService } from '../../../core/services/exercise.service';
import { Exercise } from '../../../core/models';
import { ExercisePickerModal } from '../builder/exercise-picker.modal';

interface EntrySet {
  reps: number | null;
  weightKg: number | null;
}

interface EntryExercise {
  exerciseId: string;
  exerciseName: string;
  sets: EntrySet[];
}

@Component({
  selector: 'app-manual-register',
  templateUrl: './manual-register.page.html',
  styleUrls: ['./manual-register.page.scss'],
  standalone: false,
})
export class ManualRegisterPage implements OnInit {
  step: 'intro' | 'exercises' = 'intro';
  date = '';
  workoutId: string | null = null;
  programDayId: string | null = null;
  workoutName = 'Treino';
  saving = false;

  exercises: EntryExercise[] = [];
  allExercises: Exercise[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private sessionService: SessionService,
    private exerciseService: ExerciseService,
    private modalCtrl: ModalController,
    private toast: ToastController,
  ) {}

  ngOnInit() {
    const p = this.route.snapshot.queryParamMap;
    this.date = p.get('date') ?? '';
    this.workoutId = p.get('workoutId');
    this.programDayId = p.get('dayId');
    this.workoutName = p.get('workoutName') ?? '';

    this.exerciseService.list({ size: 200 }).subscribe(page => {
      this.allExercises = page.content;
    });
  }

  get formattedDate(): string {
    if (!this.date) return '';
    const [y, m, d] = this.date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  onWorkoutNameChange() {
    this.workoutId = null;
  }

  async openPicker() {
    const picker = await this.modalCtrl.create({
      component: ExercisePickerModal,
      componentProps: {
        allExercises: this.allExercises,
        initialAddedIds: this.exercises.map(e => e.exerciseId),
        onExerciseSelected: (exercise: Exercise) => this.addExercise(exercise),
      },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      handle: false,
    });
    await picker.present();
  }

  private async addExercise(exercise: Exercise): Promise<boolean> {
    this.exercises = [...this.exercises, {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [{ reps: null, weightKg: null }],
    }];
    return true;
  }

  removeExercise(i: number) {
    this.exercises = this.exercises.filter((_, idx) => idx !== i);
  }

  addSet(exIndex: number) {
    this.exercises[exIndex].sets.push({ reps: null, weightKg: null });
  }

  propagateFirstSet(exIndex: number) {
    const sets = this.exercises[exIndex].sets;
    if (sets.length < 2) return;
    const first = sets[0];
    for (let i = 1; i < sets.length; i++) {
      sets[i].reps = first.reps;
      sets[i].weightKg = first.weightKg;
    }
  }

  removeSet(exIndex: number, setIndex: number) {
    const ex = this.exercises[exIndex];
    if (ex.sets.length === 1) return;
    ex.sets = ex.sets.filter((_, i) => i !== setIndex);
  }

  get canRegister(): boolean {
    if (this.exercises.length === 0) return false;
    return this.exercises.every(ex =>
      ex.sets.every(s => s.reps !== null && s.reps > 0 && s.weightKg !== null && s.weightKg >= 0)
    );
  }

  register() {
    if (this.saving || !this.canRegister) return;
    this.saving = true;

    const exercisesPayload = this.exercises
      .filter(ex => ex.sets.some(s => s.reps !== null))
      .map(ex => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets
          .filter(s => s.reps !== null)
          .map(s => ({ reps: s.reps!, weightKg: s.weightKg ?? 0 })),
      }));

    this.sessionService.registerManual({
      date: this.date,
      name: this.workoutName || undefined,
      workoutId: this.workoutId ?? undefined,
      programDayId: this.programDayId ?? undefined,
      exercises: exercisesPayload.length > 0 ? exercisesPayload : undefined,
    }).subscribe({
      next: async session => {
        const t = await this.toast.create({
          message: 'Treino registrado com sucesso!',
          duration: 2000,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle-outline',
        });
        await t.present();
        this.router.navigate(['/tabs/progress', session.id], { replaceUrl: true });
      },
      error: async () => {
        this.saving = false;
        const t = await this.toast.create({
          message: 'Erro ao registrar treino. Tente novamente.',
          duration: 2500,
          position: 'bottom',
        });
        t.present();
      },
    });
  }

  goBack() {
    this.location.back();
  }
}
