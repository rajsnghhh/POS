import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/security/auth.guard';
import { DailyGrnReportComponent } from './daily-grn-report.component';

const routes: Routes = [
  {
    path: '',
    component: DailyGrnReportComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DailyGrnReportRoutingModule { }
