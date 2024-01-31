import { Component, OnInit } from '@angular/core';
import { DashboardStaticatics } from '@core/domain-classes/dashboard-staticatics';
import { DashboardService } from '../dashboard.service';
import { SalesOrderService } from 'src/app/sales-order/sales-order.service';
import { SalesOrderResourceParameter } from '@core/domain-classes/sales-order-resource-parameter';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  dashboardStaticatics: DashboardStaticatics;
  master_category: any = '';
  masterCategoryList: Array<any> = [];
  setProductMainCategoryId: any;
  disabled_master_category: any;
  totalDeliveryDetails: any;
  salesOrderResource: SalesOrderResourceParameter;
  deliveryTotalValue: number = 0;


  constructor(private dashboardService: DashboardService, private salesOrderService: SalesOrderService) {
    this.dashboardStaticatics = {
      totalPurchase: 0,
      totalSales: 0,
      totalSalesReturn: 0,
      totalPurchaseReturn: 0
    };
  }

  ngOnInit(): void {
    this.salesOrderService.getProductMainCategorList().subscribe((data: any) => {
      this.masterCategoryList = data.data;
    });

    this.salesOrderService.getNonCSDCanteenDynamic(localStorage.getItem('nonCSDCanteensId'))
      .subscribe((data: any) => {

        if (data && data.mainCategoryId !== null) {
          this.setProductMainCategoryId = data.mainCategoryId;
          this.master_category = this.setProductMainCategoryId
          this.disabled_master_category = this.setProductMainCategoryId
        } else {

          this.setProductMainCategoryId = 'afc982ac-5e05-4633-99fb-08dbe76cdb9b';
          this.master_category = 'afc982ac-5e05-4633-99fb-08dbe76cdb9b';
          this.disabled_master_category = ''

        }

        this.getDashboardStaticatics();
        this.getDeliveryData();


      });


  }

  
  getDashboardStaticatics() {
    const queryParams = {
      productMainCategoryId: this.setProductMainCategoryId
    };

    this.dashboardService.getDashboardStaticatics(queryParams)
      .subscribe((c: DashboardStaticatics) => {
        this.dashboardStaticatics = c;
      })

  }

  getDeliveryData() {
    this.salesOrderResource = new SalesOrderResourceParameter();

    this.salesOrderResource.pageSize = 0;
    this.salesOrderResource.productMainCategoryId = this.setProductMainCategoryId;

    this.salesOrderService.getDeliveryData(this.salesOrderResource).subscribe(data => {
      this.totalDeliveryDetails = data.body

      this.deliveryTotalValue = this.totalDeliveryDetails.totalAmount
      console.log(this.deliveryTotalValue);

    })
  }

  setProductMainCategoryID(e: any) {
    this.setProductMainCategoryId = e
    this.getDashboardStaticatics()
    this.getDeliveryData();

  }

  isSelectDisabled(): boolean {
    return !!this.disabled_master_category;
  }



}
