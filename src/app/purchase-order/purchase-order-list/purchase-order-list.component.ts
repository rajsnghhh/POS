import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { CommonDialogService } from '@core/common-dialog/common-dialog.service';
import { PurchaseOrder } from '@core/domain-classes/purchase-order';
import { PurchaseOrderResourceParameter } from '@core/domain-classes/purchase-order-resource-parameter';
import { ResponseHeader } from '@core/domain-classes/response-header';
import { Supplier } from '@core/domain-classes/supplier';
import { ClonerService } from '@core/services/clone.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, merge, Observable, Subject } from 'rxjs';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
import { SupplierService } from 'src/app/supplier/supplier.service';
import { AddPurchaseOrderPaymentsComponent } from '../add-purchase-order-payments/add-purchase-order-payments.component';
import { PurchaseOrderService } from '../purchase-order.service';
import { ViewPurchaseOrderPaymentComponent } from '../view-purchase-order-payment/view-purchase-order-payment.component';
import { PurchaseOrderDataSource } from './purchase-order-datasource';
import { InventoryService } from 'src/app/inventory/inventory.service';
import * as XLSX from 'xlsx';
import { UTCToLocalTime } from '@shared/pipes/utc-to-localtime.pipe';
import { PaymentStatusPipe } from '@shared/pipes/purchase-order-paymentStatus.pipe';

@Component({
  selector: 'app-purchase-order-list',
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  providers: [UTCToLocalTime,PaymentStatusPipe]

})

export class PurchaseOrderListComponent extends BaseComponent {
  dataSource: PurchaseOrderDataSource;
  purchaseOrders: PurchaseOrder[] = [];
  displayedColumns: string[] = ['action', 'poCreatedDate', 'orderNumber', 'deliveryDate','invoiceno', 'supplierName', 'totalDiscount', 'totalTax', 'totalAmount', 'totalPaidAmount', 'paymentStatus', 'status'];
  filterColumns: string[] = ['action-search', 'poCreatedDate-search', 'orderNumber-search', 'deliverDate-search', 'invoiceno-search','supplier-search', 'totalAmount-search', 'totalDiscount-search', 'totalTax-search', 'totalPaidAmount-search', 'paymentStatus-search', 'status-search'];
  footerToDisplayed: string[] = ['footer'];
  isLoadingResults = true;
  purchaseOrderResource: PurchaseOrderResourceParameter;
  loading$: Observable<boolean>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  _supplierFilter: string;
  _orderNumberFilter: string;
  supplierNameControl: UntypedFormControl = new UntypedFormControl();
  supplierList$: Observable<Supplier[]>;
  expandedElement: PurchaseOrder | null;
  public filterObservable$: Subject<string> = new Subject<string>();
  downloadGRN:any;

  purchaseOrderForInvoice: PurchaseOrder;
  public get SupplierFilter(): string {
    return this._supplierFilter;
  }

  public set SupplierFilter(v: string) {
    this._supplierFilter = v;
    const supplierFilter = `supplierName:${v}`;
    this.filterObservable$.next(supplierFilter);
  }

  public get OrderNumberFilter(): string {
    return this._orderNumberFilter;
  }

  public set OrderNumberFilter(v: string) {
    this._orderNumberFilter = v;
    const orderNumberFilter = `orderNumber:${v}`;
    this.filterObservable$.next(orderNumberFilter);
  }

  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private inventoryService: InventoryService,
    private supplierService: SupplierService,
    private utcToLocalTime: UTCToLocalTime,
    private paymentStatusPipe: PaymentStatusPipe,
    private cd: ChangeDetectorRef,
    private commonDialogService: CommonDialogService,
    private toastrService: ToastrService,
    private router: Router,
    public translationService: TranslationService,
    private dialog: MatDialog,
    private clonerService: ClonerService) {
    super(translationService);
    this.getLangDir();
    this.purchaseOrderResource = new PurchaseOrderResourceParameter();
    this.purchaseOrderResource.pageSize = 50;
    this.purchaseOrderResource.orderBy = 'poCreatedDate asc';
    this.purchaseOrderResource.isPurchaseOrderRequest = false;
  }

  ngOnInit(): void {
    this.supplierNameControlOnChange();
    this.dataSource = new PurchaseOrderDataSource(this.purchaseOrderService);
    this.dataSource.loadData(this.purchaseOrderResource);
    this.getResourceParameter();
    this.sub$.sink = this.filterObservable$
      .pipe(
        debounceTime(1000),
        distinctUntilChanged())
      .subscribe((c) => {
        this.purchaseOrderResource.skip = 0;
        this.paginator.pageIndex = 0;
        const strArray: Array<string> = c.split(':');
        if (strArray[0] === 'supplierName') {
          this.purchaseOrderResource.supplierName = strArray[1];
        } else if (strArray[0] === 'orderNumber') {
          this.purchaseOrderResource.orderNumber = strArray[1];
        }
        this.dataSource.loadData(this.purchaseOrderResource);
      });
  }

  supplierNameControlOnChange() {
    this.supplierList$ = this.supplierNameControl.valueChanges.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      switchMap(c => {
        return this.supplierService.getSuppliersForDropDown(c);
      })
    );
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    this.sub$.sink = merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap((c: any) => {
          this.purchaseOrderResource.skip = this.paginator.pageIndex * this.paginator.pageSize;
          this.purchaseOrderResource.pageSize = this.paginator.pageSize;
          this.purchaseOrderResource.orderBy = this.sort.active + ' ' + this.sort.direction;
          this.dataSource.loadData(this.purchaseOrderResource);
        })
      )
      .subscribe();
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

  toggleRow(element: PurchaseOrder) {
    this.expandedElement = this.expandedElement === element ? null : element;
    this.cd.detectChanges();
  }

  poChangeEvent(purchaseOrder: PurchaseOrder) {
    this.toggleRow(purchaseOrder);
  }


  deletePurchaseOrder(purchaseOrder: PurchaseOrder) {
    this.commonDialogService.deleteConformationDialog(this.translationService.getValue('ARE_YOU_SURE_YOU_WANT_TO_DELETE'))
      .subscribe((isYes) => {
        if (isYes) {
          this.purchaseOrderService.deletePurchaseOrder(purchaseOrder.id).subscribe(() => {
            this.toastrService.success(this.translationService.getValue('PURCHASE_ORDER_DELETED_SUCCESSFULLY'))
            this.dataSource.loadData(this.purchaseOrderResource);
          });
        }
      });
  }

  addPayment(purchaseOrder: PurchaseOrder): void {
    const dialogRef = this.dialog.open(AddPurchaseOrderPaymentsComponent, {
      width: '100vh',
      direction:this.langDir,
      data: Object.assign({}, purchaseOrder)
    });
    dialogRef.afterClosed().subscribe((isAdded: boolean) => {
      if (isAdded) {
        this.dataSource.loadData(this.purchaseOrderResource);
      }
    })
  }

  viewPayment(purchaseOrder: PurchaseOrder) {
    const dialogRef = this.dialog.open(ViewPurchaseOrderPaymentComponent, {
      data: Object.assign({}, purchaseOrder), direction:this.langDir,
    });
    dialogRef.afterClosed().subscribe((isAdded: boolean) => {
      if (isAdded) {
        this.dataSource.loadData(this.purchaseOrderResource);
      }
    })
  }

  downloadInventory() {
    this.inventoryService.downloadInventory().subscribe(
      (response: HttpResponse<Blob>) => {
        const contentDispositionHeader = response.headers.get('Content-Disposition');
        const filename = contentDispositionHeader ? contentDispositionHeader.split(';')[1].trim().split('=')[1] : 'GRN.xlsx';

        const downloadLink = document.createElement('a');
        const url = window.URL.createObjectURL(response.body);

        downloadLink.href = url;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(url);
      },
      (error) => {
        console.error('Error in downloading file', error);
      }
    );

  }



  OnPurchaseOrderReturn(purchaseOrder: PurchaseOrder) {
    this.router.navigate(['/purchase-order-return', purchaseOrder.id]);
  }

  generateInvoice(po: PurchaseOrder) {
    let poForInvoice = this.clonerService.deepClone<PurchaseOrder>(po);
    const getSupplierRequest = this.supplierService.getSupplier(po.supplierId);
    const getPurchaseOrderItems = this.purchaseOrderService.getPurchaseOrderItems(po.id);
    forkJoin({ getSupplierRequest, getPurchaseOrderItems }).subscribe(response => {
      poForInvoice.supplier = response.getSupplierRequest;
      poForInvoice.purchaseOrderItems = response.getPurchaseOrderItems;
      this.purchaseOrderForInvoice = poForInvoice;
    });
  }

  onDownloadGRN() {
    this.purchaseOrderResource.pageSize = 0;
    this.purchaseOrderService.getAllPurchaseOrder(this.purchaseOrderResource)
      .subscribe(data => {
        this.downloadGRN = data.body;

        let heading = [[
          this.translationService.getValue('Created Date'),
          this.translationService.getValue('Order Number'),
          this.translationService.getValue('Delivery Date'),
          this.translationService.getValue('Invoice No'),
          this.translationService.getValue('Supplier Name'),
          this.translationService.getValue('Total Amount'),
          this.translationService.getValue('Total Discount'),
          this.translationService.getValue('Total Tax'),
          this.translationService.getValue('Total Paid Amount'),
          this.translationService.getValue('Payment Status'),
          this.translationService.getValue('Is Return'),
        ]];

        let GRNDetails = [];
        this.downloadGRN.forEach((data: any) => {
          GRNDetails.push({
            'Created Date': this.utcToLocalTime.transform(data.poCreatedDate,'shortDate'),
            'Order Number': data.orderNumber,
            'Delivery Date': this.utcToLocalTime.transform(data.deliveryDate,'shortDate'),
            'Invoice No': data.invoiceNo,
            'Supplier Name': data.supplierName,
            'Total Amount': data.totalAmount,
            'Total Discount': data.totalDiscount,
            'Total Tax': data.totalTax,
            'Total Paid Amount': data.totalAmount,
            'Payment Status': this.paymentStatusPipe.transform(data.paymentStatus),
            'Is Return': data.status == 1 ? 'Yes' : 'No',
          });
        });

        let workBook = XLSX.utils.book_new();
        XLSX.utils.sheet_add_aoa(workBook, heading);
        let workSheet = XLSX.utils.sheet_add_json(workBook, GRNDetails, { origin: "A2", skipHeader: true });
        XLSX.utils.book_append_sheet(workBook, workSheet, this.translationService.getValue('GRN List'));
        XLSX.writeFile(workBook, this.translationService.getValue('GRN List') + ".xlsx");
      });
  }
}

