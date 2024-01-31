import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ImageUploadRoutingModule } from './image-upload-routing.module';
import { ImageUploadComponent } from './image-upload.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { SharedModule } from '@shared/shared.module';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ManageImageComponent } from './manage-image/manage-image.component';


@NgModule({
  declarations: [
    ImageUploadComponent,
    ManageImageComponent
  ],
  imports: [
    CommonModule,
    ImageUploadRoutingModule,
    ReactiveFormsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    SharedModule,
    MatCardModule,
    MatPaginatorModule,
  ]
})
export class ImageUploadModule { }
