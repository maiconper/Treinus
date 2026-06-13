import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { OnboardingPage } from './onboarding.page';

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild([{ path: '', component: OnboardingPage }])],
  declarations: [OnboardingPage],
})
export class OnboardingPageModule {}
