import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DailyGrnReportRoutingModule } from './daily-grn-report-routing.module';
import { DailyGrnReportComponent } from './daily-grn-report.component';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime-ex';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomRoundPipe } from '@shared/pipes/round.pipe';
import { SharedModule } from '@shared/shared.module';


@NgModule({
  declarations: [
    DailyGrnReportComponent,
    // CustomRoundPipe
  ],
  imports: [
    CommonModule,
    DailyGrnReportRoutingModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ]
})
export class DailyGrnReportModule { }
