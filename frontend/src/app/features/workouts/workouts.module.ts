import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { WorkoutsPage } from './workouts.page';
import { WorkoutBuilderPage } from './builder/workout-builder.page';
import { ExerciseConfigModal } from './builder/exercise-config.modal';
import { ExercisePickerModal } from './builder/exercise-picker.modal';
import { ProgramDetailPage } from './programs/program-detail.page';
import { ManualRegisterPage } from './manual-register/manual-register.page';

const routes: Routes = [
  { path: '', component: WorkoutsPage },
  { path: 'builder', component: WorkoutBuilderPage },
  { path: 'builder/:id', component: WorkoutBuilderPage },
  { path: 'programs/:id', component: ProgramDetailPage },
  { path: 'register', component: ManualRegisterPage },
];

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [WorkoutsPage, WorkoutBuilderPage, ExerciseConfigModal, ExercisePickerModal, ProgramDetailPage, ManualRegisterPage],
})
export class WorkoutsPageModule {}
