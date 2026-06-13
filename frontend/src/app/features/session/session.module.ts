import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActiveSessionPage } from './active/active-session.page';
import { PostWorkoutPage } from './finish/post-workout.page';

const routes: Routes = [
  { path: ':id', component: ActiveSessionPage },
  { path: ':id/finish', component: PostWorkoutPage },
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [ActiveSessionPage, PostWorkoutPage],
})
export class SessionModule {}
