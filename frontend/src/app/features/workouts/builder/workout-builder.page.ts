import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { ExerciseConfigModal, ExerciseConfig } from './exercise-config.modal';
import { ExercisePickerModal } from './exercise-picker.modal';
import { WorkoutService } from '../../../core/services/workout.service';
import { ExerciseService } from '../../../core/services/exercise.service';
import { SessionService } from '../../../core/services/session.service';
import { Exercise, Workout, WorkoutExercise } from '../../../core/models';

const MUSCLE_GROUPS = [
  { label: 'Peito',    category: 'CHEST' },
  { label: 'Costas',   category: 'BACK' },
  { label: 'Ombros',   category: 'SHOULDERS' },
  { label: 'Tríceps',  category: 'ARMS' },
  { label: 'Bíceps',   category: 'ARMS' },
  { label: 'Pernas',   category: 'LEGS' },
  { label: 'Glúteos',  category: 'GLUTES' },
  { label: 'Core',     category: 'CORE' },
];

@Component({
  selector: 'app-workout-builder',
  templateUrl: './workout-builder.page.html',
  styleUrls: ['./workout-builder.page.scss'],
  standalone: false,
})
export class WorkoutBuilderPage implements OnInit {
  step = 1;
  workoutId: string | null = null;
  workout: Workout | null = null;
  isNew = true;

  // Step 1
  name = '';
  selectedGroups: string[] = [];
  muscleGroups = MUSCLE_GROUPS;
  saving = false;

  // Step 2
  allExercises: Exercise[] = [];
  expandedIds = new Set<string>();
  private exerciseMap = new Map<string, Exercise>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workoutService: WorkoutService,
    private exerciseService: ExerciseService,
    private sessionService: SessionService,
    private modalCtrl: ModalController,
  ) {}

  ngOnInit() {
    this.workoutId = this.route.snapshot.paramMap.get('id');
    this.isNew = !this.workoutId;

    if (this.workoutId) {
      this.step = 2;
      this.workoutService.get(this.workoutId).subscribe(w => {
        this.workout = w;
        this.name = w.name;
      });
    }

    this.loadExercises();
  }

  private loadExercises() {
    this.exerciseService.list({ size: 100 }).subscribe(page => {
      this.allExercises = page.content;
      this.exerciseMap = new Map(page.content.map(e => [e.id, e]));
    });
  }

  toggleGroup(category: string) {
    const i = this.selectedGroups.indexOf(category);
    if (i >= 0) this.selectedGroups.splice(i, 1);
    else this.selectedGroups.push(category);
  }

  isGroupSelected(category: string): boolean {
    return this.selectedGroups.includes(category);
  }

  get estimatedDuration(): string {
    const exercises = this.workout?.exercises ?? [];
    if (exercises.length === 0) return null as any;
    const totalSets = exercises.reduce((sum, e) => sum + e.plannedSets, 0);
    // ~40s per set + 90s rest between sets + 60s transition per exercise
    const seconds = totalSets * 130 + exercises.length * 60;
    const minutes = Math.round(seconds / 60 / 5) * 5; // round to nearest 5 min
    return `~${minutes} min`;
  }

  nextStep() {
    if (!this.name.trim()) return;
    this.saving = true;
    this.workoutService.create({ name: this.name.trim() }).subscribe({
      next: w => {
        this.workout = w;
        this.workoutId = w.id;
        this.saving = false;
        this.step = 2;
      },
      error: () => { this.saving = false; },
    });
  }

  async openExercisePicker() {
    if (!this.workout) return;
    const picker = await this.modalCtrl.create({
      component: ExercisePickerModal,
      componentProps: {
        allExercises: this.allExercises,
        initialAddedIds: this.workout.exercises.map(e => e.exerciseId),
        onExerciseSelected: (exercise: Exercise) => this.openConfigAndAdd(exercise),
      },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      handle: false,
    });
    await picker.present();
    const { data } = await picker.onWillDismiss<{ added: number }>();
    if (data?.added && this.workoutId) {
      this.workoutService.get(this.workoutId).subscribe(w => { this.workout = w; });
    }
  }

  private async openConfigAndAdd(exercise: Exercise): Promise<boolean> {
    if (!this.workout) return false;
    const modal = await this.modalCtrl.create({
      component: ExerciseConfigModal,
      componentProps: { exerciseName: exercise.name },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      handle: false,
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<ExerciseConfig>();
    if (role !== 'confirm' || !data) return false;
    return new Promise(resolve => {
      this.workoutService.addExercise(this.workout!.id, {
        exerciseId: exercise.id,
        plannedSets: data.sets,
        plannedRepsMin: data.reps,
        plannedRepsMax: data.reps,
        plannedWeightKg: data.weightKg ?? undefined,
      }).subscribe({ next: () => resolve(true), error: () => resolve(false) });
    });
  }

  async editExercise(ex: WorkoutExercise) {
    if (!this.workout) return;
    const modal = await this.modalCtrl.create({
      component: ExerciseConfigModal,
      componentProps: {
        exerciseName:  ex.exerciseName,
        initialSets:   ex.plannedSets,
        initialReps:   ex.plannedRepsMin ?? 10,
        initialWeight: ex.plannedWeightKg ?? null,
      },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      handle: false,
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<ExerciseConfig>();
    if (role !== 'confirm' || !data) return;
    this.workoutService.updateExercise(this.workout.id, ex.id, {
      plannedSets: data.sets,
      plannedRepsMin: data.reps,
      plannedRepsMax: data.reps,
      plannedWeightKg: data.weightKg ?? undefined,
    }).subscribe(w => { this.workout = w; });
  }

  removeExercise(ex: WorkoutExercise) {
    if (!this.workout) return;
    this.workoutService.removeExercise(this.workout.id, ex.id).subscribe(w => { this.workout = w; });
  }

  finish() {
    this.router.navigate(['/tabs/workouts']);
  }

  startWorkout() {
    if (!this.workoutId) return;
    this.sessionService.start({ workoutId: this.workoutId }).subscribe(session => {
      this.router.navigate(['/session', session.id]);
    });
  }

  get hasExercises(): boolean {
    return (this.workout?.exercises.length ?? 0) > 0;
  }

  getCategoryColor(category: string): string {
    const map: Record<string, string> = {
      CHEST: '#5B8DEF', BACK: '#A78BFA', LEGS: '#34D399', SHOULDERS: '#F59E0B',
      ARMS: '#F97316', CORE: '#EC4899', GLUTES: '#8B5CF6', CARDIO: '#06B6D4',
    };
    return map[category] ?? '#94A3B8';
  }

  toggleExpand(id: string, event: Event) {
    event.stopPropagation();
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  getExerciseInfo(exerciseId: string): Exercise | null {
    return this.exerciseMap.get(exerciseId) ?? null;
  }

  getEquipmentLabel(equipment: string): string {
    const map: Record<string, string> = {
      BARBELL: 'Barra', DUMBBELL: 'Halteres', MACHINE: 'Máquina',
      CABLE: 'Cabo', BODYWEIGHT: 'Peso corporal', KETTLEBELL: 'Kettlebell',
      RESISTANCE_BAND: 'Elástico', SMITH_MACHINE: 'Smith', OTHER: 'Cardio',
    };
    return map[equipment] ?? equipment;
  }

  getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      CHEST: 'Peito', BACK: 'Costas', LEGS: 'Pernas', SHOULDERS: 'Ombros',
      ARMS: 'Braços', CORE: 'Core', GLUTES: 'Glúteos', CARDIO: 'Cardio',
      FULL_BODY: 'Corpo todo', CALVES: 'Panturrilha', FOREARMS: 'Antebraço', NECK: 'Pescoço',
    };
    return map[category] ?? category;
  }

  goBack() {
    if (this.step === 2 && this.isNew) {
      this.step = 1;
    } else {
      this.router.navigate(['/tabs/workouts']);
    }
  }
}
