import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { WorkoutService } from '../../core/services/workout.service';
import { ProgramService } from '../../core/services/program.service';
import { Workout, Program } from '../../core/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-workouts',
  templateUrl: './workouts.page.html',
  styleUrls: ['./workouts.page.scss'],
  standalone: false,
})
export class WorkoutsPage implements OnInit {
  segment: 'workouts' | 'programs' = 'workouts';
  workouts: Workout[] = [];
  programs: Program[] = [];
  loading = true;

  constructor(
    private workoutService: WorkoutService,
    private programService: ProgramService,
    private router: Router,
    private alert: AlertController,
  ) {}

  ngOnInit() { this.load(); }
  ionViewWillEnter() { this.load(); }

  load() {
    this.loading = true;
    forkJoin({
      workouts: this.workoutService.list(),
      programs: this.programService.list(),
    }).subscribe({
      next: ({ workouts, programs }) => {
        this.workouts = workouts;
        this.programs = programs;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  createWorkout() {
    this.router.navigate(['/tabs/workouts/builder']);
  }

  openWorkout(w: Workout) {
    this.router.navigate(['/tabs/workouts/builder', w.id]);
  }

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
    return 'var(--amber)'; // DRAFT
  }

  getProgramStatusLabel(status: string): string {
    if (status === 'ACTIVE')    return 'Ativo';
    if (status === 'COMPLETED') return 'Concluído';
    if (status === 'CANCELLED') return 'Cancelado';
    return 'Rascunho'; // DRAFT
  }
}
