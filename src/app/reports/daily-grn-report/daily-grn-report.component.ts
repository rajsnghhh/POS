import { Component, OnInit } from '@angular/core';
import { ProductPurchaseReportDataSource } from '../product-purchase-report/product-purchase-report.datasource';
import { PurchaseOrderResourceParameter } from '@core/domain-classes/purchase-order-resource-parameter';
import { PurchaseOrderService } from 'src/app/purchase-order/purchase-order.service';
import { PurchaseOrderItem } from '@core/domain-classes/purchase-order-item';
import { PurchaseOrderDataSource } from 'src/app/purchase-order/purchase-order-list/purchase-order-datasource';
import { BaseComponent } from 'src/app/base.component';
import { TranslationService } from '@core/services/translation.service';
import { ResponseHeader } from '@core/domain-classes/response-header';
import { SalesOrderResourceParameter } from '@core/domain-classes/sales-order-resource-parameter';
import { SalesOrderService } from 'src/app/sales-order/sales-order.service';
import { printDiv } from './printDiv';
import { CustomRoundPipe } from '@shared/pipes/round.pipe';


@Component({
  selector: 'app-daily-grn-report',
  templateUrl: './daily-grn-report.component.html',
  styleUrls: ['./daily-grn-report.component.scss'],
  providers: [CustomRoundPipe]

})
export class DailyGrnReportComponent extends BaseComponent implements OnInit {

  currentDate: Date = new Date();
  dataSource: PurchaseOrderDataSource;
  salesOrderResource: SalesOrderResourceParameter;
  purchaseOrderResource: PurchaseOrderResourceParameter;
  purchaseOrderItems: PurchaseOrderItem[] = [];
  creditPurchaseItems: any;
  cashTotalValue: number = 0;
  creditCardTotalValue: number = 0;
  PaytmAndOnlinePayment: number = 0;
  chequeTotalValue: number = 0;
  deliveryTotalValue: number = 0;
  totalPurchaseData: any;
  cashPurchaseItems: any;
  saleDataSummary: any = [];
  wasteDataSummery: any;
  returnDataSummery: any;
  expireDataSummery: any;
  totalSaleSummaryValue: any;
  totalWasteSummaryValue: any;
  totalReturnSummaryValue: any;
  totalExpireSummaryValue: any;
  masterCategoryList: Array<any> = [];

  totalCashPurchaseAmount: any;
  totalCashSalesAmount: any;
  totalCreditPurchaseAmount: any;
  totalCreditSalesAmount: any;
  master_category: any = 'afc982ac-5e05-4633-99fb-08dbe76cdb9b';
  summaryDate: any = this.currentDate;
  TodaysDate: any;
  totalvegDetails: any;
  totalDeliveryDetails: any;
  vegTotalAmount: number = 0;
  vegPurchaseTotalAmount: number = 0;
  otherTotalAmount: number = 0;
  otherPurchaseTotalAmount: number = 0;
  bakeryTotalAmount: number = 0;
  bakeryPurchasePrice: number = 0;

  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private salesOrderService: SalesOrderService,
    private customRoundPipe: CustomRoundPipe,
    public translationService: TranslationService,
  ) {
    super(translationService);
    this.purchaseOrderResource = new PurchaseOrderResourceParameter();
    this.purchaseOrderResource.pageSize = 0;
    this.purchaseOrderResource.orderBy = 'poCreatedDate asc';
    this.purchaseOrderResource.isPurchaseOrderRequest = false;
    this.purchaseOrderResource.status = 2;

    this.salesOrderResource = new SalesOrderResourceParameter();
    this.salesOrderResource.pageSize = 0;
    this.salesOrderResource.orderBy = 'soCreatedDate asc';
    this.salesOrderResource.isSalesOrderRequest = false;

  }

  ngOnInit(): void {
    this.salesOrderService.getProductMainCategorList()
      .subscribe((data: any) => {
        this.masterCategoryList = data.data;
      });
    this.TodaysDate = this.formatDate(this.currentDate)
    this.dayWiseData(this.TodaysDate, this.master_category, this.currentDate);
  }

  searchFilter() {
    this.dayWiseData(this.summaryDate, this.master_category, new Date(this.summaryDate));
  }

  dayWiseData(dateValue, master_category, currentDate) {
    this.salesOrderResource.fromDate = dateValue;
    this.salesOrderResource.toDate = dateValue;
    this.salesOrderResource.productMainCategoryId = master_category;

    this.purchaseOrderResource.fromDate = currentDate;
    this.purchaseOrderResource.toDate = currentDate;
    this.purchaseOrderResource.status = 2;
    this.purchaseOrderResource.productMainCategoryId = master_category;
    this.purchaseOrderService.getAllPurchaseOrder(this.purchaseOrderResource)
      .subscribe((c: any) => {
        console.log(c);

        this.totalPurchaseData = c.body;

        if (this.master_category == 'afc982ac-5e05-4633-99fb-08dbe76cdb9b') {
          this.creditPurchaseItems = this.totalPurchaseData.filter((x: any) => x.purchasePaymentType == "Credit" && x.supplierId != "e7ccb254-6397-4294-5e7f-08dbfd80c92b");
          this.cashPurchaseItems = this.totalPurchaseData.filter((x: any) => x.purchasePaymentType == "Cash" && x.supplierId != "e7ccb254-6397-4294-5e7f-08dbfd80c92b");
        } else {
          this.creditPurchaseItems = this.totalPurchaseData.filter((x: any) => x.purchasePaymentType == "Credit" && x.supplierId == "e7ccb254-6397-4294-5e7f-08dbfd80c92b");
          this.cashPurchaseItems = this.totalPurchaseData.filter((x: any) => x.purchasePaymentType == "Cash" && x.supplierId == "e7ccb254-6397-4294-5e7f-08dbfd80c92b");
        }


        // console.log(this.totalPurchaseData, this.totalPurchaseData.filter((x: any) => x.supplierId == "e7ccb254-6397-4294-5e7f-08dbfd80c92b"));

        this.totalCashCount(this.cashPurchaseItems);
        this.totalCreditCount(this.creditPurchaseItems);
      })

    this.salesOrderService.getBakeryData(this.salesOrderResource).subscribe(data => {
      let bekeryValue: any = data.body;
      this.bakeryPurchasePrice = bekeryValue.purAmount;
      this.bakeryTotalAmount = bekeryValue.totalAmount;

      this.salesOrderResource.fromDate = dateValue;
      this.salesOrderResource.toDate = dateValue;
      this.salesOrderService.getAllSaleSummary(this.salesOrderResource).subscribe(data => {
        this.saleDataSummary = [];
        let allsummay: any = data.body;
        for (let val of allsummay) {
          if (val.counterName == 'App') {/*  && this.master_category == 'afc982ac-5e05-4633-99fb-08dbe76cdb9b' */

            val.totalAmount = val.totalAmount - this.deliveryTotalValue;/* - this.bakeryTotalAmount */
          }
          this.saleDataSummary.push(val);
        }

        this.totalSaleSummary(this.saleDataSummary);
      })
    })

    this.salesOrderService.getDeliveryData(this.salesOrderResource).subscribe(data => {
      this.totalDeliveryDetails = data.body

      this.deliveryTotalValue = this.totalDeliveryDetails.totalAmount

    })

    this.salesOrderService.getVegetableData(this.salesOrderResource).subscribe(data => {
      this.totalvegDetails = data.body;
      this.vegTotalAmount = this.totalvegDetails.totalAmount;
      this.vegPurchaseTotalAmount = this.totalvegDetails.purAmount;
      this.otherTotalAmount = this.totalvegDetails.otherTotalAmount;
      this.otherPurchaseTotalAmount = this.totalvegDetails.otherPurAmount;

      this.otherTotalAmount = this.otherTotalAmount - this.bakeryTotalAmount;

      this.otherTotalAmount = this.otherTotalAmount - this.deliveryTotalValue
      this.otherPurchaseTotalAmount = this.otherPurchaseTotalAmount - this.bakeryPurchasePrice;
      this.otherPurchaseTotalAmount = this.otherPurchaseTotalAmount - this.deliveryTotalValue;

      this.salesOrderResource.fromDate = new Date(this.salesOrderResource.fromDate);
      this.salesOrderResource.toDate = new Date(this.salesOrderResource.toDate);

      this.salesOrderService.getDailyTotalReport(this.salesOrderResource).subscribe(data => {
        this.cashTotalValue = 0
        this.creditCardTotalValue = 0
        this.PaytmAndOnlinePayment = 0

        let response: any = data.body;
        console.log(response);


        const cashTransaction = response.data.find(transaction => transaction.paymentMethod === 'Cash');
        const creditCardTransaction = response.data.find(transaction => transaction.paymentMethod === 'CreditCard');
        console.log(creditCardTransaction);

        const chequeTransaction = response.data.find(transaction => transaction.paymentMethod === 'Cheque');
        const paytmAndOnlineTransaction = response.data.find(transaction => transaction.paymentMethod === 'PaytmAndOnlinePayment');


        if (cashTransaction) {
          this.cashTotalValue = cashTransaction.totalAmount;
          this.cashTotalValue = this.cashTotalValue - this.deliveryTotalValue
        } if (creditCardTransaction) {
          this.creditCardTotalValue = creditCardTransaction.totalAmount;
        } if (chequeTransaction) {
          this.chequeTotalValue = chequeTransaction.totalAmount;
        } if (paytmAndOnlineTransaction) {
          this.PaytmAndOnlinePayment = paytmAndOnlineTransaction.totalAmount;
        }

        // this.cashTotalValue = response.totalAmount;
        // this.cashTotalValue = this.cashTotalValue - this.bakeryTotalAmount
      })
    })





    this.purchaseOrderResource.PurchaseOrderReturnType = 'Wastage'
    this.purchaseOrderResource.status = 1;
    this.purchaseOrderService.getAllWasteReturn(this.purchaseOrderResource).subscribe(wasteval => {
      this.wasteDataSummery = wasteval.body;
      this.totalWasteSummary(wasteval.body);
    })
    this.purchaseOrderResource.PurchaseOrderReturnType = 'Return'
    this.purchaseOrderService.getAllWasteReturn(this.purchaseOrderResource).subscribe(returnval => {
      this.returnDataSummery = returnval.body;
      this.totalReturnSummary(returnval.body);
    })
    this.purchaseOrderResource.PurchaseOrderReturnType = 'Expire'
    this.purchaseOrderService.getAllWasteReturn(this.purchaseOrderResource).subscribe(expireval => {
      this.expireDataSummery = expireval.body;
      this.totalExpireSummary(expireval.body);
    })
  }

  totalExpireSummary(totalExpiresummery: any) {
    let totalExpireValue = 0
    for (let expire of totalExpiresummery) {
      totalExpireValue = totalExpireValue + expire.totalAmount;
    }
    this.totalExpireSummaryValue = totalExpireValue;

  }

  // totalSaleSummary(totalsalesummery: any) {
  //   let totalSaleValue = 0
  //   for (let sale of totalsalesummery) {

  //     totalSaleValue = totalSaleValue + sale.totalAmount;
  //   }
  //   this.totalSaleSummaryValue = totalSaleValue;

  // }

  totalSaleSummary(totalsalesummery: any) {
    let totalSaleValue = 0;

    for (let sale of totalsalesummery) {
      const roundedTotalAmount = parseFloat(this.customRoundPipe.transform(sale.totalAmount));
      totalSaleValue = totalSaleValue + roundedTotalAmount;
    }

    this.totalSaleSummaryValue = totalSaleValue;
  }


  totalWasteSummary(totalwasteValue: any) {
    let totalWasteData = 0
    for (let waste of totalwasteValue) {
      totalWasteData = totalWasteData + waste.totalAmount;
    }
    this.totalWasteSummaryValue = totalWasteData;
  }

  totalReturnSummary(totalReturnValue: any) {
    let totalReturnData = 0
    for (let returnData of totalReturnValue) {
      totalReturnData = totalReturnData + returnData.totalAmount;
    }
    this.totalReturnSummaryValue = totalReturnData;

  }

  totalCashCount(cashData: any) {
    let totalpurchase = 0;
    let totalsale = 0
    for (let cash of cashData) {
      totalpurchase = totalpurchase + cash.totalAmount;
      totalsale = totalsale + cash.totalSaleAmount;
    }
    this.totalCashPurchaseAmount = totalpurchase;
    this.totalCashSalesAmount = totalsale
  }

  totalCreditCount(creditData: any) {
    let totalpurchase = 0;
    let totalsale = 0
    for (let credit of creditData) {
      totalpurchase = totalpurchase + credit.totalAmount;
      totalsale = totalsale + credit.totalSaleAmount;
    }
    this.totalCreditPurchaseAmount = totalpurchase;
    this.totalCreditSalesAmount = totalsale
  }

  PrintBtnClick() {
    printDiv('registration');
  };

  formatDate(date) {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;

    return [year, month, day].join('-');
  }

}
