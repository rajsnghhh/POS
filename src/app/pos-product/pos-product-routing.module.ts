import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PosProductComponent } from './pos-product.component';
import { SalesOrderUnitResolver } from './sales-order-unit-resolve';
import { SaleOrderWarehouseResolver } from './sale-order-warehouse.resolve';
import { SalesOrderTaxResolver } from './sales-order-tax-resolve';
import { ProductsResolver } from '@core/services/products.resolve';
import { AuthGuard } from '@core/security/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: PosProductComponent,
    data: { claimType: ['POS_POS']},
    canActivate: [AuthGuard],
    resolve: {
      'units': SalesOrderUnitResolver,
      'warehouses': SaleOrderWarehouseResolver,
      'taxs': SalesOrderTaxResolver,
      'products': ProductsResolver
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PosProductRoutingModule { }
