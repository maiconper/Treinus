import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('../features/home/home.module').then(m => m.HomePageModule),
      },
      {
        path: 'workouts',
        loadChildren: () => import('../features/workouts/workouts.module').then(m => m.WorkoutsPageModule),
      },
      {
        path: 'progress',
        loadChildren: () => import('../features/progress/progress.module').then(m => m.ProgressPageModule),
      },
      {
        path: 'profile',
        loadChildren: () => import('../features/profile/profile.module').then(m => m.ProfilePageModule),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
