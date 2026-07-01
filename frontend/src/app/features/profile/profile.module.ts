import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ProfilePage } from './profile.page';
import { AchievementsPage } from './achievements.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      { path: '', component: ProfilePage },
      { path: 'achievements', component: AchievementsPage },
    ]),
  ],
  declarations: [ProfilePage, AchievementsPage],
})
export class ProfilePageModule {}
