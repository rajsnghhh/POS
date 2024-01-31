import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DownloadAppComponent } from './download-app.component';

const routes: Routes = [{ path: '', component: DownloadAppComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DownloadAppRoutingModule { }
