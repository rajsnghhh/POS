import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BatchRoutingModule } from './batch-routing.module';
import { BatchComponent } from './batch.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { SharedModule } from '@shared/shared.module';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { BatchAssignComponent } from './batch-assign/batch-assign.component';
import { MatSelectModule } from '@angular/material/select';


@NgModule({
  declarations: [
    BatchComponent,
    BatchAssignComponent
  ],
  imports: [
    CommonModule,
    BatchRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    SharedModule,
    MatCardModule,
    MatPaginatorModule,
    MatTableModule,
    MatSelectModule
  ]
})
export class BatchModule { }
