import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

export interface ExerciseConfig {
  sets: number;
  reps: number;
  weightKg: number | null;
}

@Component({
  selector: 'app-exercise-config-modal',
  templateUrl: './exercise-config.modal.html',
  styleUrls: ['./exercise-config.modal.scss'],
  standalone: false,
})
export class ExerciseConfigModal {
  @Input() exerciseName = '';
  @Input() initialSets   = 3;
  @Input() initialReps   = 10;
  @Input() initialWeight: number | null = null;

  sets: number     = 3;
  reps: number     = 10;
  weightKg: number | null = null;

  constructor(private modal: ModalController) {}

  ngOnInit() {
    this.sets     = this.initialSets;
    this.reps     = this.initialReps;
    this.weightKg = this.initialWeight;
  }

  decSets()   { if (this.sets > 1) this.sets--; }
  incSets()   { this.sets++; }
  decReps()   { if (this.reps > 1) this.reps--; }
  incReps()   { this.reps++; }

  confirm() {
    this.modal.dismiss({ sets: this.sets, reps: this.reps, weightKg: this.weightKg || null } as ExerciseConfig, 'confirm');
  }

  dismiss() { this.modal.dismiss(null, 'cancel'); }
}
