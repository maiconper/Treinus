import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { ProgramService } from '../../../core/services/program.service';
import { WorkoutService } from '../../../core/services/workout.service';
import { Program, ProgramWeek, ProgramDay, Workout } from '../../../core/models';
import { forkJoin } from 'rxjs';

const DAY_NAMES: Record<number, string> = {
  1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom',
};

@Component({
  selector: 'app-program-detail',
  templateUrl: './program-detail.page.html',
  styleUrls: ['./program-detail.page.scss'],
  standalone: false,
})
export class ProgramDetailPage implements OnInit {
  programId!: string;
  program: Program | null = null;
  workouts: Workout[] = [];
  presets: Workout[] = [];
  loading = true;
  programName = '';
  readonly allDays = [1, 2, 3, 4, 5, 6, 7];

  private collapsedWeeks = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private programService: ProgramService,
    private workoutService: WorkoutService,
    private actionSheet: ActionSheetController,
    private alert: AlertController,
    private toast: ToastController,
  ) {}

  ngOnInit() {
    this.programId = this.route.snapshot.paramMap.get('id')!;
    this.load();
    this.loadWorkouts();
  }

  ionViewWillEnter() {
    this.loadWorkouts();
  }

  private loadWorkouts() {
    forkJoin({
      workouts: this.workoutService.list(),
      presets: this.workoutService.listPresets(),
    }).subscribe(({ workouts, presets }) => {
      this.workouts = workouts;
      this.presets = presets;
    });
  }

  load() {
    this.loading = true;
    this.programService.get(this.programId).subscribe({
      next: p => { this.program = p; this.programName = p.name; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  get canEdit(): boolean {
    return this.program?.status === 'DRAFT' || this.program?.status === 'ACTIVE';
  }

  goBack() {
    this.router.navigate(['/tabs/workouts']);
  }

  toggleWeek(weekId: string) {
    if (this.collapsedWeeks.has(weekId)) this.collapsedWeeks.delete(weekId);
    else this.collapsedWeeks.add(weekId);
  }

  isExpanded(weekId: string): boolean {
    return !this.collapsedWeeks.has(weekId);
  }

  getDayName(d: number): string {
    return DAY_NAMES[d] ?? '—';
  }

  getDay(week: ProgramWeek, dayOfWeek: number): ProgramDay | undefined {
    return week.days.find(d => d.dayOfWeek === dayOfWeek);
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Ativo', COMPLETED: 'Concluído', CANCELLED: 'Cancelado', DRAFT: 'Rascunho',
    };
    return map[status] ?? status;
  }

  getStatusColor(status: string): string {
    if (status === 'ACTIVE')    return 'var(--green)';
    if (status === 'COMPLETED') return 'var(--text3)';
    if (status === 'CANCELLED') return 'var(--text3)';
    return 'var(--amber)';
  }

  private async showSaved(msg = 'Salvo') {
    const t = await this.toast.create({
      message: msg,
      duration: 1500,
      position: 'bottom',
      cssClass: 'toast-saved',
    });
    await t.present();
  }

  saveName() {
    const trimmed = this.programName.trim();
    if (!trimmed || trimmed === this.program?.name) return;
    this.programService.update(this.programId, { name: trimmed })
      .subscribe(p => { this.program = p; this.showSaved(); });
  }

  addWeek() {
    if (!this.program) return;
    const nextNum = (this.program.weeks?.length ?? 0) + 1;
    this.programService.addWeek(this.programId, { weekNumber: nextNum })
      .subscribe(p => { this.program = p; this.showSaved('Semana adicionada'); });
  }

  async removeWeek(week: ProgramWeek, event: Event) {
    event.stopPropagation();
    const a = await this.alert.create({
      header: `Remover Semana ${week.weekNumber}?`,
      message: 'Todos os dias dessa semana serão removidos.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Remover', role: 'destructive',
          handler: () => {
            this.programService.removeWeek(this.programId, week.id)
              .subscribe(p => { this.program = p; });
          },
        },
      ],
    });
    await a.present();
  }

  async configDay(week: ProgramWeek, dayOfWeek: number) {
    if (!this.canEdit) return;
    const existing = this.getDay(week, dayOfWeek);

    if (!existing) {
      await this.showEmptyDaySheet(week, dayOfWeek);
    } else {
      await this.showExistingDaySheet(week, dayOfWeek, existing);
    }
  }

  private async showEmptyDaySheet(week: ProgramWeek, dayOfWeek: number) {
    const sheet = await this.actionSheet.create({
      header: `${this.getDayName(dayOfWeek)} — Semana ${week.weekNumber}`,
      buttons: [
        {
          text: 'Criar treino',
          icon: 'add-circle-outline',
          handler: () => { this.router.navigate(['/tabs/workouts/builder']); },
        },
        {
          text: 'Selecionar do catálogo',
          icon: 'list-outline',
          handler: () => { this.selectWorkoutForDay(week, dayOfWeek, undefined); },
        },
        {
          text: 'Descanso',
          icon: 'moon-outline',
          handler: () => {
            this.programService.addDay(this.programId, week.id, { dayOfWeek, restDay: true })
              .subscribe(p => { this.program = p; this.showSaved(); });
          },
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async showExistingDaySheet(week: ProgramWeek, dayOfWeek: number, existing: ProgramDay) {
    const sheet = await this.actionSheet.create({
      header: `${this.getDayName(dayOfWeek)} — Semana ${week.weekNumber}`,
      buttons: [
        {
          text: 'Alterar treino',
          icon: 'swap-horizontal-outline',
          handler: () => { this.selectWorkoutForDay(week, dayOfWeek, existing); },
        },
        {
          text: 'Descanso',
          icon: 'moon-outline',
          handler: () => {
            this.programService.updateDay(this.programId, week.id, existing.id, { restDay: true })
              .subscribe(p => { this.program = p; this.showSaved(); });
          },
        },
        {
          text: 'Remover dia',
          role: 'destructive',
          handler: () => {
            this.programService.removeDay(this.programId, week.id, existing.id)
              .subscribe(p => { this.program = p; this.showSaved('Dia removido'); });
          },
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async selectWorkoutForDay(week: ProgramWeek, dayOfWeek: number, existing: ProgramDay | undefined) {
    const allWorkouts = [...this.workouts, ...this.presets];

    if (allWorkouts.length === 0) {
      const t = await this.toast.create({
        message: 'Nenhum treino disponível. Crie um treino primeiro.',
        duration: 2000,
        position: 'bottom',
      });
      await t.present();
      return;
    }

    const makeHandler = (w: Workout) => () => {
      const req = { workoutId: w.id, restDay: false };
      const obs = existing
        ? this.programService.updateDay(this.programId, week.id, existing.id, req)
        : this.programService.addDay(this.programId, week.id, { dayOfWeek, ...req });
      obs.subscribe(p => { this.program = p; this.showSaved(); });
    };

    const userButtons = this.workouts.map(w => ({ text: w.name, handler: makeHandler(w) }));
    const presetButtons = this.presets.map(w => ({ text: `${w.name} ★`, handler: makeHandler(w) }));

    const sheet = await this.actionSheet.create({
      header: 'Selecionar treino',
      buttons: [
        ...userButtons,
        ...presetButtons,
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async startProgram() {
    const a = await this.alert.create({
      header: 'Iniciar programa?',
      message: 'Se houver outro programa ativo, ele será cancelado.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Iniciar',
          handler: () => {
            this.programService.start(this.programId)
              .subscribe(p => { this.program = p; });
          },
        },
      ],
    });
    await a.present();
  }

  async finishProgram() {
    const a = await this.alert.create({
      header: 'Concluir programa?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Concluir',
          handler: () => {
            this.programService.finish(this.programId)
              .subscribe(p => { this.program = p; });
          },
        },
      ],
    });
    await a.present();
  }
}
