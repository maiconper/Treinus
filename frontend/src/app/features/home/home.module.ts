import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { HomePage } from './home.page';
import { IconComponent } from '../../shared/icon/icon.component';

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild([{ path: '', component: HomePage }]), IconComponent],
  declarations: [HomePage],
})
export class HomePageModule {}
