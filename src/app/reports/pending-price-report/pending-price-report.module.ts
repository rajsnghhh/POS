import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PendingPriceReportRoutingModule } from './pending-price-report-routing.module';
import { PendingPriceReportComponent } from './pending-price-report.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime-ex';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';


@NgModule({
  declarations: [
    PendingPriceReportComponent
  ],
  imports: [
    PendingPriceReportRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    MatCheckboxModule,
    MatDividerModule,
    MatDialogModule,
    MatAutocompleteModule
  ]
})
export class PendingPriceReportModule { }
