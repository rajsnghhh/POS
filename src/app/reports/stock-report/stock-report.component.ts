import { animate, state, style, transition, trigger } from '@angular/animations';
import { HttpResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Inventory } from '@core/domain-classes/inventory';
import { InventoryResourceParameter } from '@core/domain-classes/inventory-resource-parameter';
import { ResponseHeader } from '@core/domain-classes/response-header';
import { Supplier } from '@core/domain-classes/supplier';
import { TranslationService } from '@core/services/translation.service';
import { CustomCurrencyPipe } from '@shared/pipes/custome-currency.pipe';
import { merge, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap, switchMap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
import { InventoryDataSource } from 'src/app/inventory/inventory-list/inventory-datasource';
import { InventoryService } from 'src/app/inventory/inventory.service';
import { SupplierService } from 'src/app/supplier/supplier.service';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SalesOrderService } from 'src/app/sales-order/sales-order.service';

@Component({
  selector: 'app-stock-report',
  templateUrl: './stock-report.component.html',
  styleUrls: ['./stock-report.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  providers: [CustomCurrencyPipe]
})
export class StockReportComponent extends BaseComponent implements OnInit {
  dataSource: InventoryDataSource;
  displayedColumns: string[] = ['action', 'category', 'productName', 'productCode', 'brandName', 'manufactureName', 'supplierName', 'stock', 'stockAmount', 'unit', 'averagePurchasePrice', 'averageSalesPrice', 'Margin', 'salesPrice'];
  columnsToDisplay: string[] = ["footer"];
  inventoryResource: InventoryResourceParameter;
  supplierNameControl: UntypedFormControl = new UntypedFormControl();
  loading$: Observable<boolean>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  supplierList$: Observable<Supplier[]>;
  _productNameFilter: string;
  _brandNameFilter: string;
  _supplierFilter: string;
  inventories: any;
  master_category: any = '';
  disabled_master_category: any;
  masterCategoryList: Array<any> = [];
  setProductMainCategoryId: any;

  expandedElement: Inventory = null;

  public filterObservable$: Subject<string> = new Subject<string>();

  public get ProductNameFilter(): string {
    return this._productNameFilter;
  }

  public set ProductNameFilter(v: string) {
    this._productNameFilter = v;
    const nameFilter = `productName##${v}`;
    this.filterObservable$.next(nameFilter);
  }

  public get BrandNameFilter(): string {
    return this._brandNameFilter;
  }

  public set BrandNameFilter(v: string) {
    this._brandNameFilter = v;
    const brandFilter = `brandName##${v}`;
    this.filterObservable$.next(brandFilter);
  }
  public get SupplierFilter(): string {
    return this._supplierFilter;
  }

  public set SupplierFilter(v: string) {
    this._supplierFilter = v;
    const supplierFilter = `supplierName:${v}`;
    this.filterObservable$.next(supplierFilter);
  }

  constructor(
    private inventoryService: InventoryService,
    private cd: ChangeDetectorRef,
    private supplierService: SupplierService,
    private dialog: MatDialog,
    private salesOrderService: SalesOrderService,
    public translationService: TranslationService,
    private customCurrencyPipe: CustomCurrencyPipe) {
    super(translationService);
    this.getLangDir();
    this.inventoryResource = new InventoryResourceParameter();
    this.inventoryResource.pageSize = 50;
    this.inventoryResource.orderBy = 'productName asc'
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

          this.inventoryResource.productMainCategoryId = this.setProductMainCategoryId
          this.dataSource.loadData(this.inventoryResource);
        } else {
          this.setProductMainCategoryId = 'afc982ac-5e05-4633-99fb-08dbe76cdb9b';
          this.master_category = 'afc982ac-5e05-4633-99fb-08dbe76cdb9b';
          this.disabled_master_category = ''

          this.inventoryResource.productMainCategoryId = this.setProductMainCategoryId
          this.dataSource.loadData(this.inventoryResource);
        }

      })

    this.supplierNameControlOnChange();
    this.dataSource = new InventoryDataSource(this.inventoryService);
    this.dataSource.loadData(this.inventoryResource);
    this.getResourceParameter();
    this.sub$.sink = this.filterObservable$
      .pipe(
        debounceTime(1000),
        distinctUntilChanged())
      .subscribe((c) => {
        this.inventoryResource.skip = 0;
        this.paginator.pageIndex = 0;
        const strArray: Array<string> = c.split('##');
        const strArray2: Array<string> = c.split(':');

        if (strArray[0] === 'productName') {
          this.inventoryResource.productName = escape(strArray[1]);
        } else if (strArray[0] === 'brandName') {
          this.inventoryResource.brandName = strArray[1];
        } else if (strArray2[0] === 'supplierName') {
          this.inventoryResource.supplierName = strArray2[1];
        }
        this.dataSource.loadData(this.inventoryResource);
      });
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);
    this.sub$.sink = merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap(() => {
          this.inventoryResource.skip = this.paginator.pageIndex * this.paginator.pageSize;
          this.inventoryResource.pageSize = this.paginator.pageSize;
          this.inventoryResource.orderBy = this.sort.active + ' ' + this.sort.direction;
          this.dataSource.loadData(this.inventoryResource);
        })
      )
      .subscribe();
  }

  setProductMainCategoryID(e: any) {
    this.setProductMainCategoryId = e
    this.inventoryResource.productMainCategoryId = this.setProductMainCategoryId
    this.dataSource.loadData(this.inventoryResource);
  }

  isSelectDisabled(): boolean {
    return !!this.disabled_master_category;
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

  getResourceParameter() {
    this.sub$.sink = this.dataSource.responseHeaderSubject$
      .subscribe((c: ResponseHeader) => {
        if (c) {
          this.inventoryResource.pageSize = c.pageSize;
          this.inventoryResource.skip = c.skip;
          this.inventoryResource.totalCount = c.totalCount;
        }
      });
  }

  toggleRow(element: Inventory) {
    this.expandedElement = this.expandedElement === element ? null : element;
    this.cd.detectChanges();
  }


  onDownloadReport() {
    this.inventoryResource.productMainCategoryId = this.setProductMainCategoryId
    this.dataSource.loadData(this.inventoryResource);
    this.inventoryService.getInventoriesReport(this.inventoryResource)
      .subscribe((c: HttpResponse<Inventory[]>) => {
        const inventories = [...c.body];
        let heading = [[
          this.translationService.getValue('S No.'),
          this.translationService.getValue('Category'),
          this.translationService.getValue('PRODUCT_NAME'),
          this.translationService.getValue('PRODUCT_CODE'),
          this.translationService.getValue('BRAND_NAME'),
          this.translationService.getValue('Manufacturer'),
          this.translationService.getValue('SUPPLIER_NAME'),
          this.translationService.getValue('STOCK'),
          this.translationService.getValue('Total Stock Amount'),
          this.translationService.getValue('UNIT'),
          this.translationService.getValue('MRP'),
          this.translationService.getValue('Purchase Price'),
          this.translationService.getValue('Margin'),
          this.translationService.getValue('Sales Price'),

        ]];

        let inventoryReport = [];
        inventories.forEach((inventory: Inventory, i) => {

          inventoryReport.push({
            'S No.': i + 1,
            'Category': inventory?.productCategoryName,
            'PRODUCT_NAME': inventory.productName,
            'PRODUCT_CODE': inventory?.productCode,
            'BRAND_NAME': inventory.brandName,
            'Manufacturer': inventory?.manufacturerName,
            'SUPPLIER_NAME': inventory.supplierName,
            'STOCK': `${inventory.stock}`,
            'Total Stock Amount': inventory?.totalStockAmount,
            'UNIT': `${inventory.unitName}`,
            'MRP': inventory?.mrp,
            'Purchase Price': inventory?.purchasePrice,
            'Margin': inventory?.margin,
            'Sales Price': inventory?.salePrice,

          });
        });

        let workBook = XLSX.utils.book_new();
        XLSX.utils.sheet_add_aoa(workBook, heading);
        let workSheet = XLSX.utils.sheet_add_json(workBook, inventoryReport, { origin: "A2", skipHeader: true });
        XLSX.utils.book_append_sheet(workBook, workSheet, this.translationService.getValue('STOCK_REPORT'));
        XLSX.writeFile(workBook, this.translationService.getValue('STOCK_REPORT') + ".xlsx");
      });
  }

  onDownloadReportPdf() {
    this.inventoryResource.productMainCategoryId = this.setProductMainCategoryId
    this.dataSource.loadData(this.inventoryResource);
    this.inventoryService.getInventoriesReport(this.inventoryResource)
      .subscribe((c: HttpResponse<Inventory[]>) => {
        this.inventories = [...c.body];

        // Get the current date and time
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString();
        const formattedTime = currentDate.toLocaleTimeString();

        const heading = [
          this.translationService.getValue('S NO.'),
          this.translationService.getValue('Category'),
          this.translationService.getValue('PRODUCT_NAME'),
          this.translationService.getValue('PRODUCT_CODE'),
          this.translationService.getValue('BRAND_NAME'),
          this.translationService.getValue('Manufacturer'),
          this.translationService.getValue('SUPPLIER_NAME'),
          this.translationService.getValue('STOCK'),
          this.translationService.getValue('UNIT'),
          this.translationService.getValue('MRP'),
          this.translationService.getValue('Purchase Price'),
          this.translationService.getValue('Margin'),
          this.translationService.getValue('Sales Price'),
        ];


        const purchaseOrderReport = this.inventories.map((inventory: Inventory, index: number) => [
          index + 1,
          inventory?.productCategoryName,
          inventory.productName,
          inventory?.productCode,
          inventory.brandName,
          inventory?.manufacturerName,
          inventory.supplierName,
          inventory.stock,
          inventory.unitName,
          inventory?.mrp,
          inventory?.purchasePrice,
          inventory?.margin,
          inventory?.salePrice
        ]);

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
        const headerText = 'Stock Report';
        const headerWidth = doc.getStringUnitWidth(headerText) * 5;
        const centerX = (pageWidth - headerWidth) / 2;
        const centerY = 10; // Adjust the Y-coordinate based on your preference
        doc.text(headerText, centerX, centerY);


        const columnStyles = {};
        for (let i = 0; i < heading.length; i++) {
          if (i === 0) {
            columnStyles[i] = { cellWidth: 10 };
          } else if (i === 4) {
            columnStyles[i] = { cellWidth: 15 };
          } else if (i === 9) {
            columnStyles[i] = { cellWidth: 15 };
          }
          else {
            columnStyles[i] = { cellWidth: 16 };
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

        doc.save(this.translationService.getValue('STOCK_REPORT') + '.pdf');
      });
  }


}

