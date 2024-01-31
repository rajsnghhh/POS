import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RewardsPointListsComponent } from './rewards-point-lists/rewards-point-lists.component';
import { AuthGuard } from '@core/security/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: RewardsPointListsComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RewardsPointRoutingModule { }
