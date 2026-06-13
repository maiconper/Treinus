import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ProgressPage } from './progress.page';

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild([{ path: '', component: ProgressPage }])],
  declarations: [ProgressPage],
  providers: [DecimalPipe],
})
export class ProgressPageModule {}
