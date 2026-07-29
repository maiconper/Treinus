import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActiveSessionPage } from './active/active-session.page';
import { PostWorkoutPage } from './finish/post-workout.page';
import { PrepareSessionPage } from './prepare/prepare-session.page';
import { IconComponent } from '../../shared/icon/icon.component';

const routes: Routes = [
  { path: 'prepare/:workoutId', component: PrepareSessionPage },
  { path: ':id', component: ActiveSessionPage },
  { path: ':id/finish', component: PostWorkoutPage },
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes), IconComponent],
  declarations: [ActiveSessionPage, PostWorkoutPage, PrepareSessionPage],
})
export class SessionModule {}
