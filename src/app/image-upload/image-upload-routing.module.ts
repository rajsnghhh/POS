import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImageUploadComponent } from './image-upload.component';
import { AuthGuard } from '@core/security/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: ImageUploadComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ImageUploadRoutingModule { }
