import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManufacturerRoutingModule } from './manufacturer-routing.module';
import { ManufacturerListComponent } from './manufacturer-list/manufacturer-list.component';
import { ManufacturerListPresentationComponent } from './manufacturer-list-presentation/manufacturer-list-presentation.component';
import { ManageManufacturerComponent } from './manage-manufacturer/manage-manufacturer.component';


@NgModule({
  declarations: [
    ManufacturerListComponent,
    ManufacturerListPresentationComponent,
    ManageManufacturerComponent
  ],
  imports: [
    CommonModule,
    ManufacturerRoutingModule
  ]
})
export class ManufacturerModule { }
