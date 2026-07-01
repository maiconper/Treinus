import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ProfilePage } from './profile.page';
import { AchievementsPage } from './achievements.page';
import { IconComponent } from '../../shared/icon/icon.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    IconComponent,
    RouterModule.forChild([
      { path: '', component: ProfilePage },
      { path: 'achievements', component: AchievementsPage },
    ]),
  ],
  declarations: [ProfilePage, AchievementsPage],
})
export class ProfilePageModule {}
