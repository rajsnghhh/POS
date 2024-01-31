import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Inventory } from '@core/domain-classes/inventory';
import { InventoryResourceParameter } from '@core/domain-classes/inventory-resource-parameter';
import { ResponseHeader } from '@core/domain-classes/response-header';
import { TranslationService } from '@core/services/translation.service';
import { merge, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap, switchMap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
import { InventoryService } from '../inventory.service';
import { ManageInventoryComponent } from '../manage-inventory/manage-inventory.component';
import { InventoryDataSource } from './inventory-datasource';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Supplier } from '@core/domain-classes/supplier';
import { UntypedFormControl } from '@angular/forms';
import { SupplierService } from 'src/app/supplier/supplier.service';
import * as XLSX from 'xlsx';
import { SalesOrderService } from 'src/app/sales-order/sales-order.service';


@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class InventoryListComponent extends BaseComponent implements OnInit {
  dataSource: InventoryDataSource;
  displayedColumns: string[] = ['action', 'category', 'productName', 'productCode', 'brandName', 'manufactureName', 'supplierName', 'openStock', 'stock', 'unit', 'stockAmount', 'averagePurchasePrice', 'averageSalesPrice', 'Margin', 'salesPrice', 'closeStock'];
  columnsToDisplay: string[] = ["footer"];
  inventoryResource: InventoryResourceParameter;
  supplierNameControl: UntypedFormControl = new UntypedFormControl();

  loading$: Observable<boolean>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('closeButton') closeButton: ElementRef;
  supplierList$: Observable<Supplier[]>;

  _productCategoryFilter: string;
  _productNameFilter: string;
  _productCodeFilter: string;
  _brandNameFilter: string;
  _unitNameFilter: string;
  _supplierFilter: string;
  downloadInventoryData: any;
  loaderSpinner: any = false;
  setMainCategoryId: any;

  expandedElement: Inventory = null;
  showFileName: any;
  fileInput: any;

  public filterObservable$: Subject<string> = new Subject<string>();

  public get ProductCategoryFilter(): string {
    return this._productCategoryFilter;
  }

  public set ProductCategoryFilter(v: string) {
    this._productCategoryFilter = v;
    const categoryNameFilter = `productCategoryName##${v}`;
    this.filterObservable$.next(categoryNameFilter);
  }

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

  public get ProductCodeFilter(): string {
    return this._productCodeFilter;
  }

  public set ProductCodeFilter(v: string) {
    this._productCodeFilter = v;
    const codeFilter = `productCode##${v}`;
    this.filterObservable$.next(codeFilter);
  }

  public get SupplierFilter(): string {
    return this._supplierFilter;
  }

  public set SupplierFilter(v: string) {
    this._supplierFilter = v;
    const supplierFilter = `supplierName:${v}`;
    this.filterObservable$.next(supplierFilter);
  }

  // public get UnitNameFilter(): string {
  //   return this._unitNameFilter;
  // }
  // public set UnitNameFilter(v: string) {
  //   this._unitNameFilter = v;
  //   const unitnameFilter = `unitName##${v}`;
  //   this.filterObservable$.next(unitnameFilter);
  // }

  constructor(
    private inventoryService: InventoryService,
    private cd: ChangeDetectorRef,
    public translationService: TranslationService,
    private salesOrderService: SalesOrderService,
    private dialog: MatDialog,
    private supplierService: SupplierService,
    private toastrService: ToastrService,
    private http: HttpClient, private el: ElementRef) {
    super(translationService);
    this.getLangDir();
    this.inventoryResource = new InventoryResourceParameter();
    this.inventoryResource.pageSize = 50;
    this.inventoryResource.orderBy = 'productName asc'
  }

  ngOnInit(): void {
    this.salesOrderService.getNonCSDCanteenDynamic(localStorage.getItem('nonCSDCanteensId'))
      .subscribe((data: any) => {
        if (data && data.mainCategoryId !== null) {
          this.setMainCategoryId = data.mainCategoryId

          this.inventoryResource.productMainCategoryId = data.mainCategoryId;
          this.dataSource.loadData(this.inventoryResource);
        }

      });

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
        } else if (strArray[0] === 'productCategoryName') {
          this.inventoryResource.productCategoryName = escape(strArray[1]);
        } else if (strArray[0] === 'productCode') {
          this.inventoryResource.productCode = escape(strArray[1]);
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


  supplierNameControlOnChange() {
    this.supplierList$ = this.supplierNameControl.valueChanges.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      switchMap(c => {
        return this.supplierService.getSuppliersForDropDown(c);
      })
    );
  }

  addInventory(inventory: Inventory) {
    const dialogRef = this.dialog.open(ManageInventoryComponent, {
      width: '600px',
      direction: this.langDir,
      data: Object.assign({}, inventory)
    });
    dialogRef.afterClosed().subscribe((data: boolean) => {
      if (data) {
        this.dataSource.loadData(this.inventoryResource);
      }
    })
  }

  downloadInventory() {
    this.inventoryService.downloadInventory().subscribe(
      (response: HttpResponse<Blob>) => {
        const contentDispositionHeader = response.headers.get('Content-Disposition');
        const filename = contentDispositionHeader ? contentDispositionHeader.split(';')[1].trim().split('=')[1] : 'filename.xlsx';

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


  uploadFile(event: any) {
    const fileInput = event.target as HTMLInputElement;
    this.showFileName = fileInput?.files[0]?.name
  }


  triggerFileInput() {
    this.fileInput = this.el.nativeElement.querySelector('[type="file"]');

    if (this.fileInput) {
      this.fileInput.click();
    } else {
      console.error('File input element not found');
    }
  }


  clearInventory() {
    let data = {}
    this.inventoryService.clearInventory(data).subscribe(data => {
      this.toastrService.success(
        this.translationService.getValue('Stock Cleared Successfully ')
      );
      this.dataSource.loadData(this.inventoryResource);
    })
  }


  uploadInventoryFiles() {

    if (this.fileInput.files && this.fileInput.files.length > 0) {
      const file = this.fileInput.files[0];

      // Check if the file type is Excel
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
        file.type === 'application/vnd.ms-excel') { // .xls

        const formData = new FormData();
        formData.append('FileDetails', file);
        this.loaderSpinner = true;
        this.inventoryService.uploadInventory(formData).subscribe(
          (response) => {

            if (response) {
              this.loaderSpinner = false;
              this.toastrService.success('File uploaded successfully');
              this.closeButton.nativeElement.click()
              this.showFileName = '';
              this.fileInput = [];
              this.dataSource.loadData(this.inventoryResource);
            } else {
              this.loaderSpinner = false;
              this.toastrService.error('Error uploading file:');
            }
          },
          (error) => {
            this.loaderSpinner = false;
            this.toastrService.error('Error uploading file:');
          }
        );
      } else {
        this.toastrService.warning('Invalid file type. Please upload an Excel file.');
      }
    } else {
      this.toastrService.warning('No file selected for upload');

    }

  }

  onDownloadInventory() {
    this.inventoryResource.productMainCategoryId = this.setMainCategoryId;
    this.dataSource.loadData(this.inventoryResource);
    this.inventoryResource.pageSize = 0;
    this.inventoryService.getInventories(this.inventoryResource)
      .subscribe(data => {
        this.downloadInventoryData = data.body;

        let heading = [[
          this.translationService.getValue('S No.'),
          this.translationService.getValue('Category'),
          this.translationService.getValue('PRODUCT_NAME'),
          this.translationService.getValue('PRODUCT_CODE'),
          this.translationService.getValue('Brand Name'),
          this.translationService.getValue('Manufacturer'),
          this.translationService.getValue('Supplier Name'),
          this.translationService.getValue('Opening Stock'),
          this.translationService.getValue('Stock'),
          this.translationService.getValue('Unit'),
          this.translationService.getValue('Total Stock Amount'),
          this.translationService.getValue('MRP'),
          this.translationService.getValue('Purchase Price'),
          this.translationService.getValue('Margin'),
          this.translationService.getValue('Sales Price'),
          this.translationService.getValue('Closing Stock'),

        ]];

        let inventoryDetails = [];
        this.downloadInventoryData.forEach((data: any, i) => {
          inventoryDetails.push({
            'S No.': i + 1,
            'Category': data?.productCategoryName,
            'PRODUCT_NAME': data.productName,
            'PRODUCT_CODE': data?.productCode,
            'Brand Name': data.brandName,
            'Manufacturer': data?.manufacturerName,
            'Supplier Name': data.supplierName,
            'Opening Stock': data.openingStock,
            'Stock': data.stock,
            'Unit': data.unitName,
            'Total Stock Amount': data.totalStockAmount,
            'MRP': data?.mrp,
            'Purchase Price': data?.purchasePrice,
            'Margin': data?.margin,
            'Sales Price': data?.salePrice,
            'Closing Stock': data.closingStock,

          });
        });

        let workBook = XLSX.utils.book_new();
        XLSX.utils.sheet_add_aoa(workBook, heading);
        let workSheet = XLSX.utils.sheet_add_json(workBook, inventoryDetails, { origin: "A2", skipHeader: true });
        XLSX.utils.book_append_sheet(workBook, workSheet, this.translationService.getValue('Inventory List'));
        XLSX.writeFile(workBook, this.translationService.getValue('Inventory List') + ".xlsx");
      });
  }
}
