import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { CommonDialogService } from '@core/common-dialog/common-dialog.service';
import { Customer } from '@core/domain-classes/customer';
import { ResponseHeader } from '@core/domain-classes/response-header';
import { SalesOrder } from '@core/domain-classes/sales-order';
import { SalesOrderResourceParameter } from '@core/domain-classes/sales-order-resource-parameter';
import { ClonerService } from '@core/services/clone.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, merge, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
import { CustomerService } from 'src/app/customer/customer.service';
import { AddSalesOrderPaymentComponent } from '../add-sales-order-payment/add-sales-order-payment.component';
import { SalesOrderDataSource } from '../sales-order-datasource';
import { SalesOrderService } from '../sales-order.service';
import { ViewSalesOrderPaymentComponent } from '../view-sales-order-payment/view-sales-order-payment.component';
import { AssignDeliveryPersonComponent } from '../assign-delivery-person/assign-delivery-person.component';
import { OrderStatusComponent } from '../order-status/order-status.component';
import { dateCompare } from '@core/services/date-range';
import { UTCToLocalTime } from '@shared/pipes/utc-to-localtime.pipe';
import { DatePipe } from '@angular/common';
import { CommonService } from '@core/services/common.service';
import * as XLSX from 'xlsx';
import { PaymentStatusPipe } from '@shared/pipes/purchase-order-paymentStatus.pipe';
import { CustomRoundPipe } from '@shared/pipes/round.pipe';

@Component({
  selector: 'app-sales-order-list',
  templateUrl: './sales-order-list.component.html',
  styleUrls: ['./sales-order-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  providers: [UTCToLocalTime, DatePipe, PaymentStatusPipe, CustomRoundPipe]

})
export class SalesOrderListComponent extends BaseComponent implements OnInit {
  dataSource: SalesOrderDataSource;
  salesOrderDetailsValue: any;
  counterForm: UntypedFormGroup;
  salesOrders: SalesOrder[] = [];
  displayedColumns: string[] = ['action', 'orderNumber', 'soCreatedDate', 'customerName', 'customerNo', 'orderedFrom', 'totalAmount', 'totalPaidAmount', 'deliveryDate', 'deliveryPerson', 'deliveryStatus', 'orderType', 'paymentStatus'];/*, 'appweb', 'totalDiscount', 'totalTax', 'status' */
  filterColumns: string[] = ['action-search', 'orderNumber-search', 'soCreatedDate-search', 'customerName-search', 'customerNo-search', 'orderedFrom-search', 'totalAmount-search', 'totalPaidAmount-search', 'deliverDate-search', 'deliveryPerson-search', 'deliveryStatus-search', 'orderType-search', 'paymentStatus-search'];/*, 'appweb-search', 'totalDiscount-search', 'totalTax-search','status-search' */
  footerToDisplayed: string[] = ['footer'];
  isLoadingResults = true;
  salesOrderResource: SalesOrderResourceParameter;
  loading$: Observable<boolean>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  _customerFilter: string;
  _orderFromFilter: string;
  _deliveryStatusFilter: string;

  _orderTypeFilter: string;
  allSalesOrderedDetails: Array<any> = []
  counterWiseSaleDetails: Array<any> = []

  @ViewChild('invoiceContent') invoiceContent: ElementRef;
  @ViewChild('invoiceCounter') invoiceCounter: ElementRef;

  @ViewChild('closeButtonCounter') closeButtonCounter: ElementRef;

  _orderNumberFilter: string;
  _customerNumberFilter: string;
  _counterNameFilter: string
  _createDateFilter: string;
  customerNameControl: UntypedFormControl = new UntypedFormControl();
  orderFromControl: UntypedFormControl = new UntypedFormControl();
  deliveryStatusFromControl: UntypedFormControl = new UntypedFormControl();

  orderTypeControl: UntypedFormControl = new UntypedFormControl();
  counterList: Array<any> = [];
  totalQtySum: number = 0;
  totalAmtSum: number = 0;
  totalQtySumCounter: number = 0;
  totalAmtSumCounter: number = 0;
  counterObject: any;
  downloadSO: any;
  cancelStatus: any;
  remarksValue: any = '';
  masterCategoryList: Array<any> = [];
  totalDeliveryDetails: any;
  deliveryTotalValue: number = 0;
  checkAppBilling: any

  customerList$: Observable<Customer[]>;
  expandedElement: SalesOrder | null;
  public filterObservable$: Subject<string> = new Subject<string>();
  salesOrderForInvoice: SalesOrder;

  public get OrderTypeFilter(): string {
    return this._orderTypeFilter;
  }
  public set OrderTypeFilter(v: string) {
    var orderFrom = ''
    if (v == 'Advance') {
      orderFrom = 'true'
    } else if (v == 'Current') {
      orderFrom = 'false'
    }
    this._orderTypeFilter = v;
    const _orderTypeFilter = `isAdvanceOrderRequest:${orderFrom}`;
    this.filterObservable$.next(_orderTypeFilter);
  }

  @ViewChild('rowElement') rowElement: ElementRef;

  public get OrderFromFilter(): string {
    return this._orderFromFilter;
  }
  public set OrderFromFilter(v: string) {
    var orderFrom = ''
    if (v == 'App') {
      orderFrom = 'true'
    } else if (v == 'Counter') {
      orderFrom = 'false'
    }
    this._orderFromFilter = v;
    const orderfromFilter = `isAppOrderRequest:${orderFrom}`;
    this.filterObservable$.next(orderfromFilter);
  }
  public get DeliveryStatusFilter(): string {
    return this._deliveryStatusFilter;
  }
  public set DeliveryStatusFilter(v: string) {
    this._deliveryStatusFilter = v;
    const deliveryStatusFilter = `orderDeliveryStatus:${v}`;
    this.filterObservable$.next(deliveryStatusFilter);
  }

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

  public get CounterNameFilter(): string {
    return this._counterNameFilter;
  }

  public set CounterNameFilter(v: string) {
    this._counterNameFilter = v;
    const counterNameFilter = `counterName:${v}`;
    this.filterObservable$.next(counterNameFilter);
  }

  public get CreateDateFilter(): string {
    return this._createDateFilter;
  }

  public set CreateDateFilter(v: string) {
    this._createDateFilter = v;
    const createDateFilter = `soCreatedDate:${v}`;
    this.filterObservable$.next(createDateFilter);
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
    private utcToLocalTime: UTCToLocalTime,
    private paymentStatusPipe: PaymentStatusPipe,
    private fb: UntypedFormBuilder,
    private datePipe: DatePipe,
    private commonService: CommonService,
    private customRoundPipe: CustomRoundPipe,
    private clonerService: ClonerService) {
    super(translationService);
    this.getLangDir();
    this.salesOrderResource = new SalesOrderResourceParameter();
    this.salesOrderResource.pageSize = 50;
    this.salesOrderResource.orderBy = 'soCreatedDate asc';
  }

  ngOnInit(): void {

    this.getCounterList();

    const authStr = localStorage.getItem('authObj');
    // if (localStorage.getItem('nonCSDCanteensId') == 'f7c14269-2a89-4f89-0b8d-08dbde8dbe73') {
    //   this.salesOrderResource.productMainCategoryId = '06c71507-b6de-4d59-de84-08dbeb3c9568';
    // } else if (localStorage.getItem('nonCSDCanteensId') == 'edd642e5-66ec-4c96-ae21-d4d75c90f1dd') {
    //   this.salesOrderResource.productMainCategoryId = 'afc982ac-5e05-4633-99fb-08dbe76cdb9b';
    // }

    this.salesOrderService.getProductMainCategorList()
      .subscribe((data: any) => {
        this.masterCategoryList = data.data;
      });

    this.salesOrderService.getNonCSDCanteenDynamic(localStorage.getItem('nonCSDCanteensId'))
      .subscribe((data: any) => {
        if (data && data.mainCategoryId !== null) {
          this.salesOrderResource.productMainCategoryId = data.mainCategoryId;
          this.dataSource.loadData(this.salesOrderResource);
        }
      });

    if (authStr) {
      const authObj = JSON.parse(authStr);
      // console.log(authObj.id);


      if (authObj && authObj.counter) {
        this.counterObject = authObj.counter;
        // console.log(this.counterObject);
        if (authObj.id == "4b352b37-332a-40c6-ab05-e38fcf109719" && authObj.counter) {
          this.salesOrderResource.counterName = '';
          // this.salesOrderResource.isAppOrderRequest = 'true';

        } else if (authObj.id != "4b352b37-332a-40c6-ab05-e38fcf109719" && authObj.counter) {
          this.salesOrderResource.counterName = this.counterObject.counterName;

        } else {
          this.salesOrderResource.counterName = '';

        }

      }
    }

    this.customerNameControlOnChange();

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
        } else if (strArray[0] === 'orderNumber') {
          this.salesOrderResource.orderNumber = strArray[1];
        } else if (strArray[0] === 'mobileNo') {
          this.salesOrderResource.mobileNo = strArray[1];
        } else if (strArray[0] === 'counterName') {
          this.salesOrderResource.counterName = strArray[1];
        } else if (strArray[0] === 'isAppOrderRequest') {
          this.salesOrderResource.isAppOrderRequest = strArray[1];
        } else if (strArray[0] === 'isAdvanceOrderRequest') {
          this.salesOrderResource.isAdvanceOrderRequest = strArray[1];
        } else if (strArray[0] === 'soCreatedDate') {
          this.salesOrderResource.sOCreatedDate = new Date(strArray[1]);
        } else if (strArray[0] === 'orderDeliveryStatus') {
          this.salesOrderResource.orderDeliveryStatus = strArray[1];
        }
        this.dataSource.loadData(this.salesOrderResource);
      });


    this.counterForm = this.fb.group({
      fromDate: [this.setDate(), Validators.required],
      toDate: [this.setDate(), Validators.required],
      master_category: ['', Validators.required],
      counter: [this.counterObject ? this.counterObject.counterName : '', Validators.required],
      appBilling: ['']
    });
  }

  setDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm: any = today.getMonth() + 1; // Months start at 0!
    let dd: any = today.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    return yyyy + '-' + mm + '-' + dd
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
    this.salesOrderDetailsValue = salesOrder;
    // this.commonDialogService.deleteConformationDialog(this.translationService.getValue('Are you want to Cancel this Sales Order'))
    //   .subscribe((isYes) => {
    //     if (isYes) {
    //       this.salesOrderService.deleteSalesOrder(salesOrder.id).subscribe(() => {
    //         this.toastrService.success(this.translationService.getValue('SALES_ORDER_DELETED_SUCCESSFULLY'))
    //         this.dataSource.loadData(this.salesOrderResource);
    //       });
    //     }
    //   });
  }

  cancelSave() {
    if (this.remarksValue != '') {
      let param = {
        salesOrderId: this.salesOrderDetailsValue.id,
        cancelReason: this.remarksValue
      }
      this.salesOrderService.cancelSalesOrder(param).subscribe(data => {
        console.log(data);
        if (data?.id) {
          this.salesOrderService.deleteSalesOrder(this.salesOrderDetailsValue.id).subscribe(() => {
            this.toastrService.success(this.translationService.getValue('SALES_ORDER_DELETED_SUCCESSFULLY'))
            this.dataSource.loadData(this.salesOrderResource);
          });
        }

      })


    } else {
      this.toastrService.error(this.translationService.getValue('Remarks is Mandatory'))
    }

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
  addDeliveryPerson(salesOrder: SalesOrder) {
    const dialogRef = this.dialog.open(AssignDeliveryPersonComponent, {
      width: '80vh',
      direction: this.langDir,
      data: Object.assign({}, salesOrder)
    });
    dialogRef.afterClosed().subscribe((isAdded: boolean) => {
      if (isAdded) {
        this.dataSource.loadData(this.salesOrderResource);
      }
    })
  }
  changeOrderStatus(salesOrder: SalesOrder) {
    const dialogRef = this.dialog.open(OrderStatusComponent, {
      width: '90vh',
      direction: this.langDir,
      data: Object.assign({}, salesOrder)
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


  getAllSalesOrder() {
    this.salesOrderService.getAllSalesOrder(this.salesOrderResource).subscribe(
      (res: any) => {
        this.allSalesOrderedDetails = res.body.map((order: any) => (
          {
            id: order.id,
            orderNumber: order.orderNumber,
            soCreatedDate: order.soCreatedDate,
            counterName: order.counterName,
            billId: order.billNo,
            totalQuantity: order.quantity,
            paymentMethod: order.paymentMethod,
            totalAmount: order.totalAmount
            // Add more fields as needed
          }));
        this.totalQtySum = this.calculateTotalQtySum(res.body)
        this.totalAmtSum = this.calculateTotalAmtSum(res.body)

      },
      (error: any) => {
        // Handle errors here
        console.error('Error fetching sales orders', error);
      }
    );
  }

  calculateTotalQtySum(orders: any[]): number { return orders.reduce((sum, order) => sum + order.quantity, 0); }
  calculateTotalAmtSum(orders: any[]): number { return orders.reduce((sum, order) => sum + order.totalAmount, 0); }


  printInvoice() {
    const printContent = this.invoiceContent.nativeElement.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Invoice</title>
          
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  getCounterList() {
    this.sub$.sink = this.commonService.getCounter().subscribe((res: any) => {
      this.counterList = res.data;
      // console.log(this.counterList);
    });
  }

  closeButtonCounters() {
    this.closeButtonCounter.nativeElement.click()

    window.location.reload()
    this.counterForm.reset();
    this.counterWiseSaleDetails = []
  }

  checkAppBill(appTrue: any) {
    this.checkAppBilling = appTrue.target.checked;
    if (this.checkAppBilling == false) {
      this.deliveryTotalValue = 0;

    }
  }

  showCounterList() {

    if (this.counterForm.valid) {

      this.salesOrderResource.fromDate = this.datePipe.transform(new Date(this.counterForm.get('fromDate').value), 'EEE MMM dd yyyy');
      this.salesOrderResource.toDate = this.datePipe.transform(new Date(this.counterForm.get('toDate').value), 'EEE MMM dd yyyy')
      // this.utcToLocalTime.transform(this.counterForm.get('toDate').value, 'shortDate');  

      this.salesOrderResource.productMainCategoryId = this.counterForm.get('master_category').value;

      this.salesOrderResource.counterName = this.counterForm.get('counter').value;
      this.salesOrderResource.isAppOrderRequest = this.counterForm.value.appBilling ? this.counterForm.value.appBilling : false
      this.salesOrderResource.pageSize=0

      if (this.checkAppBilling == true) {
        this.salesOrderResource.productMainCategoryId = this.counterForm.get('master_category').value
        this.salesOrderService.getDeliveryData(this.salesOrderResource).subscribe(data => {
          this.totalDeliveryDetails = data.body;
          this.deliveryTotalValue = this.totalDeliveryDetails.totalAmount
        })
      }

      this.salesOrderService.getCounterSalesOrder(this.salesOrderResource).subscribe(
        (res: any) => {

          this.counterWiseSaleDetails = res.body.map((order: any) => (
            {
              id: order.id,
              orderNumber: order.orderNumber,
              soCreatedDate: order.soCreatedDate,
              counterName: order.counterName,
              billId: order.billNo,
              totalQuantity: order.quantity,
              paymentMethod: order.paymentMethod,
              totalAmount: order.totalAmount,
              // Add more fields as needed
            }));
          this.totalQtySumCounter = this.calculateTotalQtySumCounter(res.body)
          this.totalAmtSumCounter = this.calculateTotalAmtSumCounter(res.body)

          // console.log(this.allSalesOrderedDetails);
        },
        (error: any) => {
          // Handle errors here
          console.error('Error fetching sales orders', error);
        }
      );
    }

  }


  calculateTotalQtySumCounter(orders: any[]): number { return orders.reduce((sum, order) => sum + order.quantity, 0); }
  // calculateTotalAmtSumCounter(orders: any[]): number { return orders.reduce((sum, order) => sum + order.totalAmount, 0); }

  calculateTotalAmtSumCounter(orders: any[]): number {
    const totalAmountSum = orders.reduce((sum, order) => sum + this.roundOrderTotalAmount(order.totalAmount), 0);
    return totalAmountSum;
  }

  private roundOrderTotalAmount(totalAmount: number): number {
    // Use the customRoundPipe or any other rounding logic here
    return parseFloat(this.customRoundPipe.transform(totalAmount));
  }


  printCounterInvoice() {
    const printContent = this.invoiceCounter.nativeElement.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Invoice</title>
          
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  timeConvertUTCtoIST(data: any) {
    var dateUTC: any = new Date(data);
    var dateUTC = dateUTC.getTime()
    var dateIST = new Date(dateUTC);
    dateIST.setHours(dateIST.getHours() - 5);
    dateIST.setMinutes(dateIST.getMinutes() - 30);

    return dateIST
  }

  onDownloadSO() {
    this.salesOrderResource.pageSize = 0;
    this.salesOrderService.getAllSalesOrder(this.salesOrderResource)
      .subscribe(data => {
        this.downloadSO = data.body;
        let heading = [[
          this.translationService.getValue('Order From'),
          this.translationService.getValue('Created Date'),
          this.translationService.getValue('Order Number'),
          this.translationService.getValue('Counter Name'),
          this.translationService.getValue('Delivery Date'),
          this.translationService.getValue('Delivery Person'),
          this.translationService.getValue('Delivery Status'),
          this.translationService.getValue('Order Type'),
          this.translationService.getValue('Customer Name'),
          this.translationService.getValue('Customer No'),
          this.translationService.getValue('Total Amount'),
          this.translationService.getValue('Total Discount'),
          this.translationService.getValue('Total Tax'),
          this.translationService.getValue('Total Paid Amount'),
          this.translationService.getValue('Payment Status'),
          this.translationService.getValue('Is Return'),
        ]];

        let SODetails = [];
        this.downloadSO.forEach((data: any) => {
          SODetails.push({
            'Order From': data.isAppOrderRequest ? 'App' : 'Counter',
            'Created Date': this.utcToLocalTime.transform(data.soCreatedDate, 'shortDate'),
            'Order Number': data.orderNumber,
            'Counter Name': data.counterName,
            'Delivery Date': this.utcToLocalTime.transform(data.deliveryDate, 'shortDate'),
            'Delivery Person': data.assignDeliveryPerson,
            'Delivery Status': data.orderDeliveryStatus,
            'Order Type': data.isAdvanceOrderRequest ? 'Advance' : 'Current',
            'Customer Name': data.customerName,
            'Customer No': data.mobileNo,
            'Total Amount': data.totalAmount,
            'Total Discount': data.totalDiscount,
            'Total Tax': data.totalTax,
            'Total Paid Amount': data.totalPaidAmount,
            'Payment Status': this.paymentStatusPipe.transform(data.paymentStatus),
            'Is Return': data.status == 1 ? 'Yes' : 'No',
          });
        });

        let workBook = XLSX.utils.book_new();
        XLSX.utils.sheet_add_aoa(workBook, heading);
        let workSheet = XLSX.utils.sheet_add_json(workBook, SODetails, { origin: "A2", skipHeader: true });
        XLSX.utils.book_append_sheet(workBook, workSheet, this.translationService.getValue('Sales Order List'));
        XLSX.writeFile(workBook, this.translationService.getValue('Sales Order List') + ".xlsx");
      });
  }
}
