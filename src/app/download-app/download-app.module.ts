import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DownloadAppRoutingModule } from './download-app-routing.module';
import { DownloadAppComponent } from './download-app.component';


@NgModule({
  declarations: [
    DownloadAppComponent
  ],
  imports: [
    CommonModule,
    DownloadAppRoutingModule
  ]
})
export class DownloadAppModule { }
