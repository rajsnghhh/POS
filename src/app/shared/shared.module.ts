import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { HasClaimDirective } from './has-claim.directive';
import { PipesModule } from './pipes/pipes.module';
import { DragDropDirective } from './directives/drag-drop.directive';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AddReminderSchedulerComponent } from './add-reminder-scheduler/add-reminder-scheduler.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime-ex';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { QuantitiesUnitPricePipe } from './pipes/quantities-unitprice.pipe';
import { QuantitiesUnitPriceTaxPipe } from './pipes/quantities-unitprice-tax.pipe';
import { PurchaseOrderInvoiceComponent } from './purchase-order-invoice/purchase-order-invoice.component';
import { PaymentStatusPipe } from './pipes/purchase-order-paymentStatus.pipe';
import { SalesOrderInvoiceComponent } from './sales-order-invoice/sales-order-invoice.component';
import { InventorySourcePipe } from './pipes/inventory-source.pipe';
import { LangDirDirective } from './directives/lang-dire.directive';
import { SalesorderThermalInvoiceComponent } from './salesorder-thermal-invoice/salesorder-thermal-invoice.component';
import { CustomRoundPipe } from './pipes/round.pipe';

@NgModule({
  exports: [
    HasClaimDirective,
    PipesModule,
    TranslateModule,
    DragDropDirective,
    OverlayModule,
    QuantitiesUnitPricePipe,
    QuantitiesUnitPriceTaxPipe,
    PurchaseOrderInvoiceComponent,
    SalesOrderInvoiceComponent,
    SalesorderThermalInvoiceComponent,
    PaymentStatusPipe,
    InventorySourcePipe,
    LangDirDirective,
    CustomRoundPipe
  ],
  imports: [
    CommonModule,
    PipesModule,
    OverlayModule,
    NgxDocViewerModule,
    NgxExtendedPdfViewerModule,
    MatIconModule,
    TranslateModule,
    MatDialogModule,
    ReactiveFormsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTableModule
  ],
  declarations: [
    HasClaimDirective,
    DragDropDirective,
    AddReminderSchedulerComponent,
    QuantitiesUnitPricePipe,
    QuantitiesUnitPriceTaxPipe,
    PurchaseOrderInvoiceComponent,
    SalesOrderInvoiceComponent,
    PaymentStatusPipe,
    InventorySourcePipe,
    LangDirDirective,
    SalesorderThermalInvoiceComponent,
    CustomRoundPipe
  ],
})
export class SharedModule { }
