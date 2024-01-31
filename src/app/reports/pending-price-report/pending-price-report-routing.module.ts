import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/security/auth.guard';
import { PendingPriceReportComponent } from './pending-price-report.component';

const routes: Routes = [
  {
    path: '',
    component: PendingPriceReportComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PendingPriceReportRoutingModule { }
