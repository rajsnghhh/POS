import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VersionControlComponent } from './version-control.component';

const routes: Routes = [{ path: '', component: VersionControlComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VersionControlRoutingModule { }
