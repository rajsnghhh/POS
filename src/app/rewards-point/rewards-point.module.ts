import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RewardsPointRoutingModule } from './rewards-point-routing.module';
import { RewardsPointListsComponent } from './rewards-point-lists/rewards-point-lists.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ManageRewardComponent } from './manage-reward/manage-reward.component';


@NgModule({
  declarations: [
    RewardsPointListsComponent,
    ManageRewardComponent
  ],
  imports: [
    CommonModule,
    RewardsPointRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatInputModule,
    MatMenuModule,
    MatDialogModule,
    TranslateModule
  ]
})
export class RewardsPointModule { }
