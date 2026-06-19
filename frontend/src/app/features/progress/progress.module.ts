import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ProgressPage } from './progress.page';
import { SessionDetailPage } from './session-detail.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      { path: '', component: ProgressPage },
      { path: ':id', component: SessionDetailPage },
    ]),
  ],
  declarations: [ProgressPage, SessionDetailPage],
  providers: [DecimalPipe],
})
export class ProgressPageModule {}
