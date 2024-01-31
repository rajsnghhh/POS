import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/security/auth.guard';
import { BatchComponent } from './batch.component';
import { BatchAssignComponent } from './batch-assign/batch-assign.component';

const routes: Routes = [
  {
    path: '',
    component: BatchComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'batch-assign',
    component: BatchAssignComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BatchRoutingModule { }
