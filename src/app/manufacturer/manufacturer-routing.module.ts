import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManufacturerListComponent } from './manufacturer-list/manufacturer-list.component';
import { AuthGuard } from '@core/security/auth.guard';


const routes: Routes = [
  {
    path: '',
    component: ManufacturerListComponent,
    data: { claimType: 'PRO_MANAGE_BRAND' },
    canActivate: [AuthGuard]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManufacturerRoutingModule { }
