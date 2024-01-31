import { HttpResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { PurchaseOrderPayment } from '@core/domain-classes/purchase-order-payment';
import { PurchaseOrderResourceParameter } from '@core/domain-classes/purchase-order-resource-parameter';
import { ResponseHeader } from '@core/domain-classes/response-header';
import { dateCompare } from '@core/services/date-range';
import { TranslationService } from '@core/services/translation.service';
import { CustomCurrencyPipe } from '@shared/pipes/custome-currency.pipe';
import { PaymentStatusPipe } from '@shared/pipes/purchase-order-paymentStatus.pipe';
import { UTCToLocalTime } from '@shared/pipes/utc-to-localtime.pipe';
import { merge, Observable } from 'rxjs';
import { BaseComponent } from 'src/app/base.component';
import { PendingPriceReportDataSource } from '../pending-price-report/pending-price-report.datasource'
import * as XLSX from 'xlsx';
import { PaymentMethodPipe } from '@shared/pipes/paymentMethod.pipe';
import { PendingPriceReportService } from './pending-price-report.service';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SupplierService } from 'src/app/supplier/supplier.service';
import { SupplierResourceParameter } from '@core/domain-classes/supplier-resource-parameter';
import { Supplier } from '@core/domain-classes/supplier';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';


@Component({
  selector: 'app-pending-price-report',
  templateUrl: './pending-price-report.component.html',
  styleUrls: ['./pending-price-report.component.scss'],
  providers:[UTCToLocalTime, CustomCurrencyPipe, PaymentStatusPipe,PaymentMethodPipe]

})
export class PendingPriceReportComponent extends BaseComponent implements OnInit {
  dataSource : PendingPriceReportDataSource;
  isData: boolean = false;
  isDeleted = false;
  purchaseOrderResource:PurchaseOrderResourceParameter;
  supplierResource: SupplierResourceParameter;

  searchForm: UntypedFormGroup;

  loading$: Observable<boolean>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  currentDate: Date= new Date();
  purchaseOrderPayments:any;
  suppliers:any;

  constructor(
    private pendingPriceReportservice: PendingPriceReportService,
    private fb: UntypedFormBuilder,
    private supplierService: SupplierService,
    private dialog: MatDialog,
    private utcToLocalTime: UTCToLocalTime,
    private customCurrencyPipe: CustomCurrencyPipe,
    private paymentStatusPipe: PaymentStatusPipe,
    public translationService: TranslationService,
    private paymentMethodPipe: PaymentMethodPipe) {
    super(translationService);
    this.getLangDir();
    this.purchaseOrderResource = new PurchaseOrderResourceParameter();
    this.purchaseOrderResource.pageSize=0;
    this.supplierResource = new SupplierResourceParameter();
    this.supplierResource.pageSize=0;
  }

  displayedColumns: string[] = ['supplierName', 'totalAmount', 'paidAmount', 'pendingAmount'];
  footerToDisplayed = ['footer']


  ngOnInit(): void {
    this.createSearchFormGroup();
    this.getSupplierList();
    this. getSupplierByNameValue();
    this.dataSource = new PendingPriceReportDataSource(this.pendingPriceReportservice);
    this.dataSource.loadData(this.purchaseOrderResource);
    this.getResourceParameter();
  }

  createSearchFormGroup(){
    this.searchForm= this.fb.group({
      fromDate:[''],
      toDate:[''],
      filterSupplierValue:[''],
      supplierId:['']
    },{
      validators: dateCompare()
    });
  }

  getSupplierByNameValue() {
    this.sub$.sink = this.searchForm.get('filterSupplierValue').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(c => {
          this.supplierResource.supplierName = c;
          return this.supplierService.getSuppliers(this.supplierResource);
        })
      ).subscribe((resp: HttpResponse<Supplier[]>) => {
        if (resp && resp.headers) {
          this.suppliers = [...resp.body];
        }
      }, (err) => {

      });
  }

  getSupplierList(){
    this.supplierService.getSuppliers(this.supplierResource)
      .subscribe(resp => {
        if (resp && resp.headers) {
          this.suppliers = [...resp.body];
        }
      });
  }

  onSearch(){
   if( this.searchForm.valid){
    this.purchaseOrderResource.fromDate= this.searchForm.get('fromDate').value;
    this.purchaseOrderResource.toDate= this.searchForm.get('toDate').value;
    this.purchaseOrderResource.supplierId = this.searchForm.get('supplierId').value;
    this.dataSource.loadData(this.purchaseOrderResource);
   }
  }

  onClear(){
    this.searchForm.reset();
    this.purchaseOrderResource.fromDate= this.searchForm.get('fromDate').value;
    this.purchaseOrderResource.toDate= this.searchForm.get('toDate').value;
    this.purchaseOrderResource.supplierId = this.searchForm.get('supplierId').value;
    this.dataSource.loadData(this.purchaseOrderResource);
  }

  getResourceParameter() {
    this.sub$.sink = this.dataSource.responseHeaderSubject$
      .subscribe((c: ResponseHeader) => {
        if (c) {
          this.purchaseOrderResource.pageSize = c.pageSize;
          this.purchaseOrderResource.skip = c.skip;
          this.purchaseOrderResource.totalCount = c.totalCount;
        }
      });
  }


  onDownloadReport(){
    this.pendingPriceReportservice.getAllPurchaseOrderPaymentReportExcel(this.purchaseOrderResource)
    .subscribe((c: HttpResponse<PurchaseOrderPayment[]>)=>{
     const purchaseOrderPayments= [...c.body];
      let heading=[[
      this.translationService.getValue('SUPPLIER_NAME'),
      this.translationService.getValue('TOTAL_AMOUNT'),
      this.translationService.getValue('PAID_AMOUNT'),
      this.translationService.getValue('PENDING_AMOUNT'),
    ]];

      let purchaseOrderPaymentReport= [];
      purchaseOrderPayments.forEach((purchaseOrderPayment: PurchaseOrderPayment)=>{
        purchaseOrderPaymentReport.push({
            'SUPPLIER_NAME': purchaseOrderPayment.supplierName,
            'TOTAL_AMOUNT': purchaseOrderPayment.totalAmount,
            'PAID_AMOUNT': purchaseOrderPayment.totalPaidAmount,
            'PENDING_AMOUNT': purchaseOrderPayment.pandingAmount,
          });
      });

      let workBook= XLSX.utils.book_new();
      XLSX.utils.sheet_add_aoa(workBook,heading);
      let workSheet= XLSX.utils.sheet_add_json(workBook, purchaseOrderPaymentReport, {origin: "A2", skipHeader:true });
      XLSX.utils.book_append_sheet(workBook,workSheet,this.translationService.getValue('PENDING_PRICE_REPORT'));
      XLSX.writeFile(workBook,this.translationService.getValue('PENDING_PRICE_REPORT') +".xlsx");
    });
  }
  onDownloadReportPdf() {
    this.pendingPriceReportservice.getAllPurchaseOrderPaymentReportExcel(this.purchaseOrderResource)
    .subscribe((c: HttpResponse<PurchaseOrderPayment[]>)=>{
     this.purchaseOrderPayments= [...c.body];
        // Get the current date and time
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString();
        const formattedTime = currentDate.toLocaleTimeString();

        let heading=[
          this.translationService.getValue('S NO'),
          this.translationService.getValue('SUPPLIER_NAME'),
          this.translationService.getValue('TOTAL_AMOUNT'),
          this.translationService.getValue('PAID_AMOUNT'),
          this.translationService.getValue('PENDING_AMOUNT'),
        ];

        const purchaseOrderReport = this.purchaseOrderPayments.map((purchaseOrderPayment: PurchaseOrderPayment, index: number) => [
          index + 1,
          purchaseOrderPayment.supplierName,
          purchaseOrderPayment.totalAmount,
          purchaseOrderPayment.totalPaidAmount,
          purchaseOrderPayment.pandingAmount,
        ]);

        // const totalAmount = this.purchaseOrderPayments.reduce((sum, order) => sum + order.totalAmount, 0);
        // const totalRow = [
        //   '', // Empty for the serial number
        //   '', // Empty for the date
        //   '', // Empty for the order number
        //   '', // Empty for the delivery date
        //   'Total', // Label for the supplier name (or any label you want)
        //   '', // Empty for the total discount
        //   '', // Empty for the total tax
        //   totalAmount.toFixed(2), // Display the total amount
        //   '', // Empty for the total paid amount
        //   '', // Empty for the payment status
        //   '', // Empty for the is return status
        // ];

        // purchaseOrderReport.push(totalRow);

        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });


        // Display the current date at the top left
        doc.text(`${formattedDate}`, 10, 10);

        // Display the current time at the top right
        const timeWidth = doc.getStringUnitWidth(formattedTime) * 5;
        const pageWidth = doc.internal.pageSize.width;
        doc.text(`${formattedTime}`, pageWidth - 10 - timeWidth, 10);

        // Display the header text in the middle
        const headerText = 'Pending Price Report';
        const headerWidth = doc.getStringUnitWidth(headerText) * 5;
        const centerX = (pageWidth - headerWidth) / 2;
        const centerY = 10; // Adjust the Y-coordinate based on your preference
        doc.text(headerText, centerX, centerY);


        const columnStyles = {};
        for (let i = 0; i < heading.length; i++) {
          if (i === 0) {
            columnStyles[i] = { cellWidth: 18 };
          } else if (i === 4) {
            columnStyles[i] = { cellWidth: 34 };
          } else if (i === 9) {
            columnStyles[i] = { cellWidth: 34 };
          }else if (i === 1) {
            columnStyles[i] = { cellWidth: 54 };
          }
          else {
            columnStyles[i] = { cellWidth: 32 };
          }
        }

        const options = {
          head: [heading],
          body: purchaseOrderReport,
          theme: 'grid',
          startY: 20,
          styles: { halign: 'center', fontSize: 8, font: 'customfont' },
          columnStyles: columnStyles,
          cellStyles: { 4: { cellWidth: 'wrap', valign: 'middle', halign: 'left', fontStyle: 'normal' } },
          margin: { top: 15, right: 5, bottom: 5, left: 5 },
        };

        (doc as any).autoTable(options);

        doc.save(this.translationService.getValue('PENDING_PRICE_REPORT') + '.pdf');
      });
  }



}
