import { HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Params } from '@angular/router';
import { CompanyProfile } from '@core/domain-classes/company-profile';
import { SalesOrder } from '@core/domain-classes/sales-order';
import { SalesOrderItem } from '@core/domain-classes/sales-order-item';
import { SecurityService } from '@core/security/security.service';
import { ClonerService } from '@core/services/clone.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';
import { SalesOrderService } from '../sales-order.service';
import { CustomRoundPipe } from '@shared/pipes/round.pipe';

@Component({
  selector: 'app-sales-order-detail',
  templateUrl: './sales-order-detail.component.html',
  styleUrls: ['./sales-order-detail.component.scss'],
  providers: [CustomRoundPipe]
})
export class SalesOrderDetailComponent extends BaseComponent {

  currentDate: Date = new Date();
  quantitesErrormsg: string = '';
  errorMsg: string = '';
  companyProfile: CompanyProfile;
  isLoading = false;
  vegetablesOrderItems: any;
  othersOrderItems: any;
  totalAmount: number = 0;
  salesOrder: SalesOrder = null;
  salesOrderItems: SalesOrderItem[];
  salesOrderReturnsItems: SalesOrderItem[];
  salesOrderForInvoice: SalesOrder;
  salesOrderForThermalInvoice: SalesOrder;
  constructor(
    private salesOrderService: SalesOrderService,
    private routes: ActivatedRoute,
    private clonerService: ClonerService,
    private toastrService: ToastrService,
    private location: Location,
    private securityService: SecurityService,
    private customRoundPipe: CustomRoundPipe,
    public translationService: TranslationService) {
    super(translationService);

  }

  ngOnInit(): void {
    this.getCustomerOrderById();
    this.subScribeCompanyProfile();
  }

  getCustomerOrderById() {
    this.sub$.sink = this.routes.params.subscribe((c: Params) => {
      this.getSalesOrderById(c['id']);
    });
  }

  subScribeCompanyProfile() {
    this.securityService.companyProfile.subscribe(data => {
      this.companyProfile = data;
    });
  }

  getSalesOrderById(id: string) {
    this.isLoading = true;
    this.salesOrderService.getSalesOrderById(id)
      .subscribe((c: SalesOrder) => {
        this.salesOrder = this.clonerService.deepClone<SalesOrder>(c);

        this.salesOrder.totalQuantity = this.salesOrder?.salesOrderItems?.map(item => item.status == 1 ? -1 * item.quantity : item.quantity).reduce((prev, next) => prev + next);
        this.salesOrderItems = this.salesOrder?.salesOrderItems.filter(c => c.status == 0);
        console.log( this.salesOrderItems);
        


        this.salesOrderItems.forEach(salesItem => {
          if (salesItem.status === 0) {
            this.totalAmount += (salesItem.product.mrp * salesItem.quantity) - (salesItem?.quantity * salesItem?.unitPrice) - salesItem.discount + salesItem.taxValue;
          }
        });

        this.vegetablesOrderItems = this.salesOrderItems.filter((x: any) => x.product.productCategory.name == "VEGETABLES");
        this.othersOrderItems = this.salesOrderItems.filter((x: any) => x.product.productCategory.name != "VEGETABLES");
        this.othersOrderItems.sort((a: any, b: any) => {
          if (b.product.productCategory.name < a.product.productCategory.name) return 1;
          if (b.product.productCategory.name > a.product.productCategory.name) return -1;
          else {
            if (b.product.productCategory.name < a.product.productCategory.name) return 1;
            if (b.product.productCategory.name > a.product.productCategory.name) return -1;
            return 0
          }
        });

        this.salesOrderItems = [];

        for (let data of this.vegetablesOrderItems) {
          this.salesOrderItems.push(data)
        }
        for (let data of this.othersOrderItems) {
          this.salesOrderItems.push(data)
        }


        this.salesOrderReturnsItems = this.salesOrder?.salesOrderItems.filter(c => c.status == 1);
        this.isLoading = false;
      }, (err) => {
        this.isLoading = false;
      });
  }

  generateInvoice() {
    let soForInvoice = this.clonerService.deepClone<SalesOrder>(this.salesOrder);
    soForInvoice.salesOrderItems.map(c => {
      c.unitName = c.unitConversation?.name;
      return c;
    })
    soForInvoice.salesOrderItems = this.salesOrderItems;
    this.salesOrderForInvoice = soForInvoice;
  }

  generateThermalInvoice() {
    let soForInvoice = this.clonerService.deepClone<SalesOrder>(this.salesOrder);
    soForInvoice.salesOrderItems.map(c => {
      c.unitName = c.unitConversation?.name;
      return c;
    })
    soForInvoice.salesOrderItems = this.salesOrderItems;
    this.salesOrderForThermalInvoice = soForInvoice;
  }

  // calulateTax() {
  //   const totalQuantity = this.purchaseOrder.totalQuantity;
  //   const unitPrice = this.purchaseOrder.pricePerUnit;;
  //   const tax = this.purchaseOrder.tax;
  //   const totalAmountWithTax = totalQuantity * unitPrice;
  //   let totalAmount = 0;
  //   if (tax && tax !== 0) {
  //     totalAmount = totalAmountWithTax + (totalAmountWithTax * tax) / 100;
  //     totalAmount = parseFloat(totalAmount.toFixed(2));
  //   } else {
  //     if (totalAmountWithTax) {
  //       totalAmount = totalAmountWithTax;
  //     } else {
  //       totalAmount = 0;
  //     }
  //   }
  //   return totalAmount;
  // }

  // downloadAttachment(attachement: PurchaseOrderAttachment) {
  //   this.sub$.sink = this.purchaseOrderService.downloadAttachment(attachement.id)
  //     .subscribe(
  //       (event) => {
  //         if (event.type === HttpEventType.Response) {
  //           this.downloadFile(event, attachement.name);
  //         }
  //       },
  //       (error) => {
  //         this.toastrService.error(this.translationService.getValue('ERROR_WHILE_DOWNLOADING_DOCUMENT'));
  //       }
  //     );
  // }

  private downloadFile(data: HttpResponse<Blob>, name: string) {
    const downloadedFile = new Blob([data.body], { type: data.body.type });
    const a = document.createElement('a');
    a.setAttribute('style', 'display:none;');
    document.body.appendChild(a);
    a.download = name;
    a.href = URL.createObjectURL(downloadedFile);
    a.target = '_blank';
    a.click();
    document.body.removeChild(a);
  }

  cancel() {
    this.location.back();
  }
}
