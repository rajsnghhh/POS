import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StockReturnComponent } from './stock-return.component';
import { AuthGuard } from '@core/security/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: StockReturnComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StockReturnRoutingModule { }
