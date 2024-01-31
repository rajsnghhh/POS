import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VersionControlRoutingModule } from './version-control-routing.module';
import { VersionControlComponent } from './version-control.component';


@NgModule({
  declarations: [
    VersionControlComponent
  ],
  imports: [
    CommonModule,
    VersionControlRoutingModule
  ]
})
export class VersionControlModule { }
