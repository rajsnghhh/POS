import { animate, state, style, transition, trigger } from '@angular/animations';
import { HttpResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { CommonDialogService } from '@core/common-dialog/common-dialog.service';
import { Customer } from '@core/domain-classes/customer';
import { Product } from '@core/domain-classes/product';
import { ProductResourceParameter } from '@core/domain-classes/product-resource-parameter';
import { ResponseHeader } from '@core/domain-classes/response-header';
import { SalesOrder } from '@core/domain-classes/sales-order';
import { SalesOrderResourceParameter } from '@core/domain-classes/sales-order-resource-parameter';
import { ClonerService } from '@core/services/clone.service';
import { dateCompare } from '@core/services/date-range';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, merge, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
import { CustomerService } from 'src/app/customer/customer.service';
import { ProductService } from 'src/app/product/product.service';
import { AddSalesOrderPaymentComponent } from 'src/app/sales-order/add-sales-order-payment/add-sales-order-payment.component';
import { SalesOrderDataSource } from 'src/app/sales-order/sales-order-datasource';
import { SalesOrderService } from 'src/app/sales-order/sales-order.service';
import { ViewSalesOrderPaymentComponent } from 'src/app/sales-order/view-sales-order-payment/view-sales-order-payment.component';
import * as XLSX from 'xlsx';
import { PaymentStatusPipe } from '@shared/pipes/purchase-order-paymentStatus.pipe';
import { UTCToLocalTime } from '@shared/pipes/utc-to-localtime.pipe';
import { CustomCurrencyPipe } from '@shared/pipes/custome-currency.pipe';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-sales-order-report',
  templateUrl: './sales-order-report.component.html',
  styleUrls: ['./sales-order-report.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  providers: [UTCToLocalTime, CustomCurrencyPipe, PaymentStatusPipe]
})
export class SalesOrderReportComponent extends BaseComponent implements OnInit {
  dataSource: SalesOrderDataSource;
  salesOrders: SalesOrder[] = [];
  displayedColumns: string[] = ['action', 'soCreatedDate', 'orderNumber', 'deliveryDate', 'customerName', 'customerNo', 'totalDiscount', 'totalTax', 'totalAmount', 'totalPaidAmount', 'paymentStatus', 'status'];
  filterColumns: string[] = ['action-search', 'soCreatedDate-search', 'orderNumber-search', 'deliverDate-search', 'customer-search', 'customerNo-search', 'totalAmount-search', 'totalDiscount-search', 'totalTax-search', 'totalPaidAmount-search', 'paymentStatus-search', 'status-search'];
  footerToDisplayed: string[] = ['footer'];
  isLoadingResults = true;
  salesOrderResource: SalesOrderResourceParameter;
  loading$: Observable<boolean>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  _customerFilter: string;
  _customerNumberFilter: string;

  _orderNumberFilter: string;
  customerNameControl: UntypedFormControl = new UntypedFormControl();
  customerList$: Observable<Customer[]>;
  expandedElement: SalesOrder | null;
  public filterObservable$: Subject<string> = new Subject<string>();
  salesOrderForInvoice: SalesOrder;
  searchForm: UntypedFormGroup;
  products: Product[] = [];
  productResource: ProductResourceParameter;
  currentDate: Date = new Date();
  master_category: any = '';
  disabled_master_category: any;
  masterCategoryList: Array<any> = [];
  setProductMainCategoryId: any;
  public get CustomerFilter(): string {
    return this._customerFilter;
  }

  public set CustomerFilter(v: string) {
    this._customerFilter = v;
    const customerFilter = `customerName:${v}`;
    this.filterObservable$.next(customerFilter);
  }

  public get OrderNumberFilter(): string {
    return this._orderNumberFilter;
  }

  public set OrderNumberFilter(v: string) {
    this._orderNumberFilter = v;
    const orderNumberFilter = `orderNumber:${v}`;
    this.filterObservable$.next(orderNumberFilter);
  }
  public get CustomerNumberFilter(): string {
    return this._customerNumberFilter;
  }

  public set CustomerNumberFilter(v: string) {
    this._customerNumberFilter = v;
    const customerNumberFilter = `mobileNo:${v}`;
    this.filterObservable$.next(customerNumberFilter);
  }

  constructor(
    private salesOrderService: SalesOrderService,
    private customerService: CustomerService,
    private cd: ChangeDetectorRef,
    private commonDialogService: CommonDialogService,
    private toastrService: ToastrService,
    private router: Router,
    public translationService: TranslationService,
    private dialog: MatDialog,
    private clonerService: ClonerService,
    private fb: UntypedFormBuilder,
    private productService: ProductService,
    public utcToLocalTime: UTCToLocalTime,
    private customCurrencyPipe: CustomCurrencyPipe,
    private paymentStatusPipe: PaymentStatusPipe
  ) {
    super(translationService);
    this.getLangDir();
    this.productResource = new ProductResourceParameter();
    this.salesOrderResource = new SalesOrderResourceParameter();
    this.salesOrderResource.pageSize = 50;
    this.salesOrderResource.orderBy = 'soCreatedDate asc'
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

          this.salesOrderResource.productMainCategoryId = this.setProductMainCategoryId
          this.dataSource.loadData(this.salesOrderResource);
        } else {
          this.setProductMainCategoryId = 'afc982ac-5e05-4633-99fb-08dbe76cdb9b';
          this.master_category = 'afc982ac-5e05-4633-99fb-08dbe76cdb9b';
          this.disabled_master_category = ''

          this.salesOrderResource.productMainCategoryId = this.setProductMainCategoryId
          this.dataSource.loadData(this.salesOrderResource);
        }

      })

    this.customerNameControlOnChange();
    this.createSearchFormGroup();
    this.getProductByNameValue();
    this.getProducts();
    this.dataSource = new SalesOrderDataSource(this.salesOrderService);
    this.dataSource.loadData(this.salesOrderResource);
    this.getResourceParameter();
    this.sub$.sink = this.filterObservable$
      .pipe(
        debounceTime(1000),
        distinctUntilChanged())
      .subscribe((c) => {
        this.salesOrderResource.skip = 0;
        this.paginator.pageIndex = 0;
        const strArray: Array<string> = c.split(':');
        if (strArray[0] === 'customerName') {
          this.salesOrderResource.customerName = strArray[1];
        } else if (strArray[0] === 'mobileNo') {
          this.salesOrderResource.mobileNo = strArray[1];
        } else if (strArray[0] === 'orderNumber') {
          this.salesOrderResource.orderNumber = strArray[1];
        }
        this.dataSource.loadData(this.salesOrderResource);
      });
  }

  addPayment(salesOrder: SalesOrder): void {
    const dialogRef = this.dialog.open(AddSalesOrderPaymentComponent, {
      width: '100vh',
      direction: this.langDir,
      data: Object.assign({}, salesOrder)
    });
    dialogRef.afterClosed().subscribe((isAdded: boolean) => {
      if (isAdded) {
        this.dataSource.loadData(this.salesOrderResource);
      }
    })
  }

  setProductMainCategoryID(e: any) {
    this.setProductMainCategoryId = e
    this.salesOrderResource.productMainCategoryId = this.setProductMainCategoryId
    this.dataSource.loadData(this.salesOrderResource);
  }

  isSelectDisabled(): boolean {
    return !!this.disabled_master_category;
  }

  createSearchFormGroup() {
    this.searchForm = this.fb.group({
      fromDate: [''],
      toDate: [''],
      filterProductValue: [''],
      productId: ['']
    }, {
      validators: dateCompare()
    });
  }

  onSearch() {
    if (this.searchForm.valid) {
      this.salesOrderResource.fromDate = this.searchForm.get('fromDate').value;
      this.salesOrderResource.toDate = this.searchForm.get('toDate').value;
      this.salesOrderResource.productId = this.searchForm.get('productId').value;
      this.dataSource.loadData(this.salesOrderResource);
    }
  }


  onClear() {
    this.searchForm.reset();
    this.salesOrderResource.fromDate = this.searchForm.get('fromDate').value;
    this.salesOrderResource.toDate = this.searchForm.get('toDate').value;
    this.salesOrderResource.productId = this.searchForm.get('productId').value;
    this.dataSource.loadData(this.salesOrderResource);
  }

  getProductByNameValue() {
    this.sub$.sink = this.searchForm.get('filterProductValue').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(c => {
          this.productResource.name = c;
          return this.productService.getProducts(this.productResource);
        })
      ).subscribe((resp: HttpResponse<Product[]>) => {
        if (resp && resp.headers) {
          this.products = [...resp.body];
        }
      }, (err) => {

      });
  }

  getProducts() {
    this.productResource.name = '';
    return this.productService.getProducts(this.productResource)
      .subscribe((resp: HttpResponse<Product[]>) => {
        if (resp && resp.headers) {
          this.products = [...resp.body];
        }
      }, (err) => {

      });;
  }


  onDetailSalesOrder(salesOrder: SalesOrder) {
    this.router.navigate(['/sales-order', salesOrder.id]);
  }

  customerNameControlOnChange() {
    this.customerList$ = this.customerNameControl.valueChanges.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      switchMap(c => {
        return this.customerService.getCustomersForDropDown('CustomerName', c);
      })
    );
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    this.sub$.sink = merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap((c: any) => {
          this.salesOrderResource.skip = this.paginator.pageIndex * this.paginator.pageSize;
          this.salesOrderResource.pageSize = this.paginator.pageSize;
          this.salesOrderResource.orderBy = this.sort.active + ' ' + this.sort.direction;
          this.dataSource.loadData(this.salesOrderResource);
        })
      )
      .subscribe();
  }

  getResourceParameter() {
    this.sub$.sink = this.dataSource.responseHeaderSubject$
      .subscribe((c: ResponseHeader) => {
        if (c) {
          this.salesOrderResource.pageSize = c.pageSize;
          this.salesOrderResource.skip = c.skip;
          this.salesOrderResource.totalCount = c.totalCount;
        }
      });
  }

  toggleRow(element: SalesOrder) {
    this.expandedElement = this.expandedElement === element ? null : element;
    this.cd.detectChanges();
  }


  deleteSalesOrder(salesOrder: SalesOrder) {
    this.commonDialogService.deleteConformationDialog(this.translationService.getValue('ARE_YOU_SURE_YOU_WANT_TO_DELETE'))
      .subscribe((isYes) => {
        if (isYes) {
          this.salesOrderService.deleteSalesOrder(salesOrder.id).subscribe(() => {
            this.toastrService.success(this.translationService.getValue('SALES_ORDER_DELETED_SUCCESSFULLY'))
            this.dataSource.loadData(this.salesOrderResource);
          });
        }
      });
  }


  viewPayment(salesOrder: SalesOrder) {
    const dialogRef = this.dialog.open(ViewSalesOrderPaymentComponent, {
      data: Object.assign({}, salesOrder), direction: this.langDir,
    });
    dialogRef.afterClosed().subscribe((isAdded: boolean) => {
      if (isAdded) {
        this.dataSource.loadData(this.salesOrderResource);
      }
    })
  }

  onSaleOrderReturn(saleOrder: SalesOrder) {
    this.router.navigate(['sales-order-return', saleOrder.id]);
  }


  generateInvoice(so: SalesOrder) {
    let soForInvoice = this.clonerService.deepClone<SalesOrder>(so);
    const getCustomerRequest = this.customerService.getCustomer(so.customerId);
    const getSalesOrderItems = this.salesOrderService.getSalesOrderItems(so.id);
    forkJoin({ getCustomerRequest, getSalesOrderItems }).subscribe(response => {
      soForInvoice.customer = response.getCustomerRequest;
      soForInvoice.salesOrderItems = response.getSalesOrderItems;
      this.salesOrderForInvoice = soForInvoice;
    });
  }

  onDownloadReport() {

    this.salesOrderResource.productMainCategoryId = this.setProductMainCategoryId
    this.dataSource.loadData(this.salesOrderResource);
    this.salesOrderService.getAllSalesOrderExcel(this.salesOrderResource)
      .subscribe((c: HttpResponse<SalesOrder[]>) => {
        this.salesOrders = [...c.body];
        let heading = [[
          this.translationService.getValue('CREATED_DATE'),
          this.translationService.getValue('ORDER_NUMBER'),
          this.translationService.getValue('DELIVERY_DATE'),
          this.translationService.getValue('CUSTOMER_NAME'),
          this.translationService.getValue('Customer No.'),
          this.translationService.getValue('TOTAL_DISCOUNT'),
          this.translationService.getValue('TOTAL_TAX'),
          this.translationService.getValue('TOTAL_AMOUNT'),
          this.translationService.getValue('TOTAL_PAID_AMOUNT'),
          this.translationService.getValue('PAYMENT_STATUS'),
          this.translationService.getValue('IS_RETURN')
        ]];

        let salesOrderReport = [];
        this.salesOrders.forEach((salesOrder: SalesOrder) => {
          salesOrderReport.push({
            'CREATED_DATE': this.utcToLocalTime.transform(salesOrder.soCreatedDate, 'shortDate'),
            'ORDER_NUMBER': salesOrder.orderNumber,
            'DELIVERY_DATE': this.utcToLocalTime.transform(salesOrder.deliveryDate, 'shortDate'),
            'CUSTOMER_NAME': salesOrder.customerName,
            'Customer No': salesOrder.mobileNo,
            'TOTAL_DISCOUNT': this.customCurrencyPipe.transform(salesOrder.totalDiscount),
            'TOTAL_TAX': this.customCurrencyPipe.transform(salesOrder.totalTax),
            'TOTAL_AMOUNT': this.customCurrencyPipe.transform(salesOrder.totalAmount),
            'TOTAL_PAID_AMOUNT': this.customCurrencyPipe.transform(salesOrder.totalPaidAmount),
            'PAYMENT_STATUS': this.paymentStatusPipe.transform(salesOrder.paymentStatus),
            'IS_RETURN': salesOrder.status == 1 ? 'True' : 'False'
          });
        });

        let workBook = XLSX.utils.book_new();
        XLSX.utils.sheet_add_aoa(workBook, heading);
        let workSheet = XLSX.utils.sheet_add_json(workBook, salesOrderReport, { origin: "A2", skipHeader: true });
        XLSX.utils.book_append_sheet(workBook, workSheet, this.translationService.getValue('SALES_ORDER_REPORT'));
        XLSX.writeFile(workBook, this.translationService.getValue('SALES_ORDER_REPORT') + ".xlsx");
      });
  }

  onDownloadReportPdf() {

    this.salesOrderResource.productMainCategoryId = this.setProductMainCategoryId
    this.dataSource.loadData(this.salesOrderResource);
    this.salesOrderService.getAllSalesOrderExcel(this.salesOrderResource)
      .subscribe((c: HttpResponse<SalesOrder[]>) => {
        this.salesOrders = [...c.body];
        // Get the current date and time
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString();
        const formattedTime = currentDate.toLocaleTimeString();

        let heading = [
          this.translationService.getValue('SLNO'),
          this.translationService.getValue('CREATED_DATE'),
          this.translationService.getValue('ORDER_NUMBER'),
          this.translationService.getValue('DELIVERY_DATE'),
          this.translationService.getValue('CUSTOMER_NAME'),
          this.translationService.getValue('Customer No.'),
          this.translationService.getValue('TOTAL_DISCOUNT'),
          this.translationService.getValue('TOTAL_TAX'),
          this.translationService.getValue('TOTAL_AMOUNT'),
          this.translationService.getValue('TOTAL_PAID_AMOUNT'),
          this.translationService.getValue('PAYMENT_STATUS'),
          this.translationService.getValue('IS_RETURN')
        ];

        const salesOrderReport = this.salesOrders.map((salesOrder: SalesOrder, index: number) => [
          index + 1,
          this.utcToLocalTime.transform(salesOrder.soCreatedDate, 'shortDate'),
          salesOrder.orderNumber,
          this.utcToLocalTime.transform(salesOrder.deliveryDate, 'shortDate'),
          salesOrder.customerName,
          salesOrder.mobileNo,
          salesOrder.totalDiscount,
          salesOrder.totalTax,
          salesOrder.totalAmount,
          salesOrder.totalPaidAmount,
          this.paymentStatusPipe.transform(salesOrder.paymentStatus),
          salesOrder.status == 1 ? 'True' : 'False'
        ]);

        const totalAmount = this.salesOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalRow = [
          '', // Empty for the serial number
          '', // Empty for the date
          '', // Empty for the order number
          '', // Empty for the delivery date
          'Total', // Label for the supplier name (or any label you want)
          '', // Empty for the total discount
          '',
          '', // Empty for the total tax
          totalAmount.toFixed(2), // Display the total amount
          '', // Empty for the total paid amount
          '', // Empty for the payment status
          '', // Empty for the is return status
        ];

        salesOrderReport.push(totalRow);

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
        const headerText = 'Sales Order Report';
        const headerWidth = doc.getStringUnitWidth(headerText) * 5;
        const centerX = (pageWidth - headerWidth) / 2;
        const centerY = 10; // Adjust the Y-coordinate based on your preference
        doc.text(headerText, centerX, centerY);


        const columnStyles = {};
        for (let i = 0; i < heading.length; i++) {
          if (i === 0) {
            columnStyles[i] = { cellWidth: 8 };
          } else if (i === 4) {
            columnStyles[i] = { cellWidth: 18 };
          } else if (i === 9) {
            columnStyles[i] = { cellWidth: 14 };
          }
          else {
            columnStyles[i] = { cellWidth: 18 };
          }
        }

        const options = {
          head: [heading],
          body: salesOrderReport,
          theme: 'grid',
          startY: 20,
          styles: { halign: 'center', fontSize: 8, font: 'customfont' },
          columnStyles: columnStyles,
          cellStyles: { 4: { cellWidth: 'wrap', valign: 'middle', halign: 'left', fontStyle: 'normal' } },
          margin: { top: 15, right: 5, bottom: 5, left: 5 },
        };

        (doc as any).autoTable(options);

        doc.save(this.translationService.getValue('SALES_ORDER_REPORT') + '.pdf');
      });
  }

}
