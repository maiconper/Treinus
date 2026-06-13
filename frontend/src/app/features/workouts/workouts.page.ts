import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { WorkoutService } from '../../core/services/workout.service';
import { ProgramService } from '../../core/services/program.service';
import { UserService } from '../../core/services/user.service';
import { Workout, Program, ProgramWeek, ProgramDay, User } from '../../core/models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

const DAY_LABELS: Record<number, string> = {
  1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom',
};

@Component({
  selector: 'app-workouts',
  templateUrl: './workouts.page.html',
  styleUrls: ['./workouts.page.scss'],
  standalone: false,
})
export class WorkoutsPage implements OnInit {
  segment: 'workouts' | 'programs' = 'programs';
  user: User | null = null;
  workouts: Workout[] = [];
  presets: Workout[] = [];
  programs: Program[] = [];
  activeProgram: Program | null = null;

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
    private router: Router,
    private alert: AlertController,
    private actionSheet: ActionSheetController,
  ) {}

  ngOnInit() { this.load(); }
  ionViewWillEnter() { this.load(); }

  load() {
    this.loading = true;
    forkJoin({
      user: this.userService.getMe(),
      workouts: this.workoutService.list(),
      presets: this.workoutService.listPresets(),
      programs: this.programService.list(),
      active: this.programService.getActive().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ user, workouts, presets, programs, active }) => {
        this.user = user;
        this.workouts = workouts;
        this.presets = presets;
        this.programs = programs;
        this.activeProgram = active;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  // ── Programa ativo ─────────────────────────────────────────────────────────

  // TODO: lastWorkoutDate indica que ALGUM treino foi feito hoje, não que o treino do programa de hoje
  // foi concluído. Se o usuário trocar o treino do dia, o novo aparece como concluído incorretamente.
  // Solução correta: rastrear a sessão concluída por programDayId ou workoutId específico.
  get completedToday(): boolean {
    if (!this.user?.lastWorkoutDate) return false;
    const t = new Date();
    const local = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    return this.user.lastWorkoutDate === local;
  }

  get todayDow(): number {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  }

  get currentWeekNumber(): number {
    if (!this.activeProgram?.startedAt) return 1;
    const days = Math.floor((Date.now() - new Date(this.activeProgram.startedAt).getTime()) / 86400000);
    return Math.max(1, Math.min(Math.floor(days / 7) + 1, this.activeProgram.weeksCount));
  }

  get currentWeek(): ProgramWeek | undefined {
    return this.activeProgram?.weeks.find(w => w.weekNumber === this.currentWeekNumber);
  }

  get nextWeek(): ProgramWeek | undefined {
    return this.activeProgram?.weeks.find(w => w.weekNumber === this.currentWeekNumber + 1);
  }

  get todayDay(): ProgramDay | undefined {
    return this.currentWeek?.days.find(d => d.dayOfWeek === this.todayDow);
  }

  getWeekDay(week: ProgramWeek | undefined, dow: number): ProgramDay | undefined {
    return week?.days.find(d => d.dayOfWeek === dow);
  }

  abbrev(name: string | undefined): string {
    if (!name) return '';
    return name.split(/[\s·—–]/)[0];
  }

  getWorkoutForDay(day: ProgramDay | undefined): Workout | undefined {
    if (!day?.workoutId) return undefined;
    return this.workouts.find(w => w.id === day.workoutId);
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
        ...this.allWorkouts.map(w => ({
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
          text: 'Excluir', role: 'destructive',
          handler: () => {
            this.workoutService.delete(workout.id).subscribe({ next: () => this.load() });
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
        { name: 'weeksCount', type: 'number', placeholder: 'Número de semanas', value: '8' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Criar',
          handler: data => {
            if (!data.name?.trim()) return false;
            this.programService.create({ name: data.name, weeksCount: +data.weeksCount || 8 }).subscribe({
              next: p => this.router.navigate(['/tabs/workouts/programs', p.id]),
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
          text: 'Excluir', role: 'destructive',
          handler: () => {
            this.programService.delete(p.id).subscribe({ next: () => this.load() });
          },
        },
      ],
    });
    await a.present();
  }

  getProgramStatusColor(status: string): string {
    if (status === 'ACTIVE')    return 'var(--green)';
    if (status === 'COMPLETED') return 'var(--text3)';
    if (status === 'CANCELLED') return 'var(--text3)';
    return 'var(--amber)';
  }

  getProgramStatusLabel(status: string): string {
    if (status === 'ACTIVE')    return 'Ativo';
    if (status === 'COMPLETED') return 'Concluído';
    if (status === 'CANCELLED') return 'Cancelado';
    return 'Rascunho';
  }
}
