import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CompanyProfile } from '@core/domain-classes/company-profile';
import { SalesOrder } from '@core/domain-classes/sales-order';
import { SalesOrderItem } from '@core/domain-classes/sales-order-item';
import { SecurityService } from '@core/security/security.service';
import { CustomRoundPipe } from '@shared/pipes/round.pipe';

@Component({
  selector: 'app-salesorder-thermal-invoice',
  templateUrl: './salesorder-thermal-invoice.component.html',
  styleUrls: ['./salesorder-thermal-invoice.component.scss']
})
export class SalesorderThermalInvoiceComponent implements OnInit, OnChanges {

  @Input() salesOrder: SalesOrder;
  salesOrderForThermalInvoice: SalesOrder;
  companyProfile: CompanyProfile;
  totalSavedPrice: any;
  salesData: any
  salesOrderItems: SalesOrderItem[];
  salesOrderReturnsItems: SalesOrderItem[];
  netBillAmount: any;
  carryBagItems: any = [];
  totalAmount: any;
  totalQuantity: any;
  currenTime: any;
  roundOff: any;
  totalCarryBagPrice: any;
  allOrderedItem: any;
  paymentMethodType: any;
  localStorageData: any;
  constructor(private securityService: SecurityService, private customRoundPipe: CustomRoundPipe) { }

  ngOnInit(): void {
    this.subScribeCompanyProfile();
    var d = new Date();
    this.currenTime = d.toLocaleTimeString();
    this.localStorageData = JSON.parse(localStorage.getItem('authObj'));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['salesOrder']) {
      this.salesOrder.totalQuantity = this.salesOrder.salesOrderItems.map(item => item.status == 0 ? item.quantity : (-1) * item.quantity).reduce((prev, next) => prev + next);
      this.salesOrderItems = this.salesOrder.salesOrderItems.filter(c => c.status == 0);
      this.allOrderedItem = this.salesOrder;
      this.orderType(this.allOrderedItem.salesOrderPayments[0]?.paymentMethod);
      this.salesOrderReturnsItems = this.salesOrder.salesOrderItems.filter(c => c.status == 1);
      this.salesOrderForThermalInvoice = this.salesOrder;
      this.salesData = this.salesOrder;
      this.salesOrder = null;
      this.carryBagItems = this.salesOrderItems.filter((x: any) => x.product.categoryId == "98f4e55a-5839-47a8-8ccc-3bfbbbe6017b")
      this.salesOrderItems = this.salesOrderItems.filter((x: any) => x.product.categoryId != "98f4e55a-5839-47a8-8ccc-3bfbbbe6017b")
    }
    setTimeout(() => {
      this.printInvoice();
    }, 1000);
    this.totalSavings(this.salesOrderItems, this.carryBagItems);
  }

  subScribeCompanyProfile() {
    this.securityService.companyProfile.subscribe(data => {
      this.companyProfile = data;
    });
  }

  orderType(method: any) {
    if (method == 0) {
      this.paymentMethodType = 'Cash'
    } else if (method == 1) {
      this.paymentMethodType = 'Cheque'
    } else if (method == 2) {
      this.paymentMethodType = 'Credit Card'
    } else if (method == 3) {
      this.paymentMethodType = 'COD'
    } else if (method == 4) {
      this.paymentMethodType = 'Other'
    } else if (method == 5) {
      this.paymentMethodType = 'Paytm & Online Payment'
    }

  }

  totalSavings(value: any, carryBag: any) {
    var savings = 0;
    var granttotalAmount = 0;
    var quantity = 0;
    var carrybagPrice = 0;
    // for (let item of value) {
    //   savings = savings + (item.product.mrp - item.unitPrice);
    //   granttotalAmount = granttotalAmount + ((item?.quantity * item?.unitPrice) - item.discount + item.taxValue)

    //   quantity = quantity + (item.quantity);
    // }

    for (let item of value) {
      const savings = parseFloat(this.customRoundPipe.transform(item.product.mrp - item.unitPrice));
      const subtotal = (item?.quantity * item?.unitPrice) - item.discount + item.taxValue;
      const roundedSubtotal = parseFloat(this.customRoundPipe.transform(subtotal));
      // savingsTotal = savingsTotal + savings;
      granttotalAmount = granttotalAmount + roundedSubtotal;
      quantity = quantity + item.quantity;
    }


    this.totalSavedPrice = savings;
    this.totalQuantity = quantity;
    this.totalAmount = granttotalAmount;

    let roundamount = Math.round(granttotalAmount)

    this.roundOff = roundamount - this.totalAmount;

    for (let data of carryBag) {
      carrybagPrice = carrybagPrice + data.unitPrice
    }
    this.totalCarryBagPrice = carrybagPrice;
    this.netBillAmount = roundamount + this.totalCarryBagPrice;

  }

  printInvoice() {
    let name = this.salesOrderForThermalInvoice.orderNumber;
    let printContents, popupWin;
    printContents = document.getElementById('salesOrderForThermalInvoice').innerHTML;
    popupWin = window.open('', '_blank', 'top=0,left=0,height=100%,width=auto');
    popupWin.document.open();
    popupWin.document.write(`
        <html>
          <head>
            <title>${name}</title>
            <style>
            @page { size: auto;  margin: 0mm;  margin-top:60px; }

            @media print {
              * {
                font-family: "Hind-Vadodara", sans-serif;
                -webkit-print-color-adjust: exact;
              }
            }
            tr{
              border: 1px solid #000;
              border-spacing: 2px;
            }
            table {
              border-collapse: collapse;
            }
            th, td {
              padding: 5px;
            }
            </style>
            <script>
            function loadHandler(){

            var is_chrome = function () { return Boolean(window.chrome); }
        if(is_chrome)
        {
           window.print();
           setTimeout(function(){window.close();}, 1000);
           //give them 10 seconds to print, then close
        }
        else
        {
           window.print();
           window.close();
        }
        }
        </script>
          </head>
      <body onload="loadHandler()">${printContents}</body>
        </html>
    `
    );
    popupWin.document.close();
  }

}
