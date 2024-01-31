import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CommonDialogService } from '@core/common-dialog/common-dialog.service';
import { Brand } from '@core/domain-classes/brand';
import { Product } from '@core/domain-classes/product';
import { ProductCategory } from '@core/domain-classes/product-category';
import { ProductResourceParameter } from '@core/domain-classes/product-resource-parameter';
import { ResponseHeader } from '@core/domain-classes/response-header';
import { Unit } from '@core/domain-classes/unit';
import { BrandService } from '@core/services/brand.service';
import { ProductCategoryService } from '@core/services/product-category.service';
import { TranslationService } from '@core/services/translation.service';
import { UnitService } from '@core/services/unit.service';
import { environment } from '@environments/environment';
import { ToastrService } from 'ngx-toastr';
import { merge, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
import { UnitConversationService } from 'src/app/unit-conversation/unit-conversation.service';
import { ProductService } from '../product.service';
import { GenerateBarcodeComponent } from './generate-barcode/generate-barcode.component';
import { ProductDataSource } from './product-datasource';
import { HttpResponse } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';


@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent extends BaseComponent implements OnInit {
  dataSource: ProductDataSource;
  displayedColumns: string[] = ['action', 'imageUrl', 'name', 'productCode', 'brandName', 'categoryName', 'unitName', 'rackno', 'ordertime', 'purchasePrice', 'Margin', 'salesPrice', 'mrp', 'warehouse'];
  searchColumns: string[] = ['action-search', 'imageUrl-search', 'name-search', 'productCode-search', 'brandName-search', 'categoryName-search', 'unitName-search', 'rackNo-search', 'ordertime-search', 'purchasePrice-search', 'Margin-search',
    'salesPrice-search', 'mrp-search', 'warehouse-search'];
  footerToDisplayed = ['footer'];
  brands: Brand[] = [];
  allCategories: ProductCategory[] = [];
  productCategories: ProductCategory[] = [];
  units: Unit[] = [];
  isLoadingResults = true;
  productResource: ProductResourceParameter;
  product: Product;
  loading$: Observable<boolean>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  _nameFilter: string;
  _codeFilter: string;
  _brandFilter: string;
  _unitFilter: string;
  _categoryFilter: string;
  public filterObservable$: Subject<string> = new Subject<string>();
  baseUrl = environment.apiUrl;
  showFileName: any;
  fileInput: any;
  downloadProduct: any;
  setProductMainCategoryId: string;

  @ViewChild('closeButton') closeButton: ElementRef;

  public get CodeFilter(): string {
    return this._codeFilter;
  }
  public set CodeFilter(v: string) {
    this._codeFilter = v;
    const codeFilter = `code:${v}`;
    this.filterObservable$.next(codeFilter);
  }

  public get NameFilter(): string {
    return this._nameFilter;
  }

  public set NameFilter(v: string) {
    this._nameFilter = v;
    const nameFilter = `name:${v}`;
    this.filterObservable$.next(nameFilter);
  }

  public set BrandFilter(v: string) {
    this._brandFilter = v ? v : '';
    const brandFilter = `brandId:${this._brandFilter}`;
    this.filterObservable$.next(brandFilter);
  }
  public get BrandFilter(): string {
    return this._brandFilter;
  }

  public set UnitFilter(v: string) {
    this._unitFilter = v ? v : '';
    const unitFilter = `unitId:${this._unitFilter}`;
    this.filterObservable$.next(unitFilter);
  }
  public get UnitFilter(): string {
    return this._unitFilter;
  }

  public set CategoryFilter(v: string) {
    this._categoryFilter = v ? v : '';
    const categoryFilter = `categoryId:${this._categoryFilter}`;
    this.filterObservable$.next(categoryFilter);
  }
  public get CategoryFilter(): string {
    return this._categoryFilter;
  }

  constructor(
    private productService: ProductService,
    private productCategoryService: ProductCategoryService,
    private brandService: BrandService,
    private unitConversationService: UnitConversationService,
    private dialog: MatDialog,
    public translationService: TranslationService,
    private commonDialogService: CommonDialogService,
    private toastrService: ToastrService,
    private el: ElementRef) {
    super(translationService);
    this.getLangDir();
    this.productResource = new ProductResourceParameter();
    this.productResource.pageSize = 15;
    this.productResource.orderBy = 'createdDate asc';
    this.productResource.productMainCategoryId = '';

    if (localStorage.getItem('productskip')) {
      this.productResource.skip = Number(localStorage.getItem('productskip'));
    }

    // if (localStorage.getItem('nonCSDCanteensId') == 'f7c14269-2a89-4f89-0b8d-08dbde8dbe73') {
    //   this.productResource.productMainCategoryId = '06c71507-b6de-4d59-de84-08dbeb3c9568';
    // } else if (localStorage.getItem('nonCSDCanteensId') == 'edd642e5-66ec-4c96-ae21-d4d75c90f1dd') {
    //   this.productResource.productMainCategoryId = 'afc982ac-5e05-4633-99fb-08dbe76cdb9b';
    // }

  }

  ngOnInit(): void {
    this.dataSource = new ProductDataSource(this.productService);
    this.dataSource.loadData(this.productResource);
    this.productService.getNonCSDCanteenDynamic(localStorage.getItem('nonCSDCanteensId'))
      .subscribe((data: any) => {
        if (data && data.mainCategoryId !== null) {
          this.productResource.productMainCategoryId = data.mainCategoryId;
          this.dataSource.loadData(this.productResource);
        }
      });
    this.getResourceParameter();
    this.getBrands();
    this.getProductCategories();
    this.getUnits();
    this.sub$.sink = this.filterObservable$
      .pipe(
        debounceTime(1000),
        distinctUntilChanged())
      .subscribe((c) => {
        this.productResource.skip = 0;
        this.paginator.pageIndex = 0;
        const strArray: Array<string> = c.split(':');
        if (strArray[0] === 'name') {
          this.productResource.name = strArray[1];
        }
        if (strArray[0] === 'code') {
          this.productResource.code = strArray[1];
        }
        if (strArray[0] === 'unitId') {
          this.productResource.unitId = strArray[1];
        }
        if (strArray[0] === 'brandId') {
          this.productResource.brandId = strArray[1];
        }
        if (strArray[0] === 'categoryId') {
          this.productResource.categoryId = strArray[1];
        }
        this.dataSource.loadData(this.productResource);
      });
  }

  getResourceParameter() {
    this.sub$.sink = this.dataSource.responseHeaderSubject$
      .subscribe((c: ResponseHeader) => {
        if (c) {
          localStorage.setItem('productskip', c.skip.toString());
          this.productResource.pageSize = c.pageSize;
          this.productResource.skip = c.skip;
          this.productResource.totalCount = c.totalCount;
        }
      });
  }

  getProductCategories() {
    this.productCategoryService.getAllCategoriesForDropDown().subscribe(c => {
      this.productCategories = [...c];
      this.setDeafLevel();
    });
  }

  setDeafLevel(parent?: ProductCategory, parentId?: string) {
    const children = this.productCategories.filter(c => c.parentId == parentId);
    if (children.length > 0) {
      children.map((c, index) => {
        const object: ProductCategory = Object.assign({}, c, {
          deafLevel: parent ? parent.deafLevel + 1 : 0,
          index: (parent ? parent.index : 0) + index * Math.pow(0.1, c.deafLevel)
        })
        this.allCategories.push(object);
        this.setDeafLevel(object, object.id);
      });
    }
    return parent;
  }


  getBrands() {
    this.brandService.getAll().subscribe(b => this.brands = b);
  }

  getUnits() {
    this.unitConversationService.getUnitConversations().subscribe(units => {
      this.units = units;
    })
  }

  generateInvoice(po: Product) {
    this.product = po;

  }

  generateBarcode(product: Product): void {
    this.dialog.open(GenerateBarcodeComponent, {
      width: '110vh',
      direction: this.langDir,
      data: Object.assign({}, product)
    });
  }

  ngAfterViewInit() {

    if (localStorage.getItem('productskip')) {
      this.paginator.pageIndex = Number(localStorage.getItem('productskip')) / this.productResource.pageSize;
    }
    this.sub$.sink = this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);
    this.sub$.sink = merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap((c: any) => {
          this.productResource.skip = this.paginator.pageIndex * this.paginator.pageSize;
          this.productResource.pageSize = this.paginator.pageSize;
          this.productResource.orderBy = this.sort.active + ' ' + this.sort.direction;
          this.dataSource.loadData(this.productResource);
        })
      )
      .subscribe();
  }

  deleteProduct(product: Product) {
    this.commonDialogService
      .deleteConformationDialog(`${this.translationService.getValue('ARE_YOU_SURE_YOU_WANT_TO_DELETE')}?`)
      .subscribe((isTrue: boolean) => {
        if (isTrue) {
          this.sub$.sink = this.productService.deleteProudct(product.id)
            .subscribe(() => {
              this.toastrService.success(this.translationService.getValue('PRODUCT_DELETED_SUCCESSFULLY'));
              this.paginator.pageIndex = 0;
              this.dataSource.loadData(this.productResource);
            });
        }
      });
  }

  downloadProductsFormat() {
    this.productService.downloadProductFile().subscribe(
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

  onDownloadProduct() {
    this.productService.downloadProducts(this.productResource)
      .subscribe(data => {
        this.downloadProduct = data.body;

        let heading = [[
          this.translationService.getValue('PRODUCT_NAME'),
          this.translationService.getValue('PRODUCT_CODE'),
          this.translationService.getValue('BRAND'),
          this.translationService.getValue('CATEGORY'),
          this.translationService.getValue('UNIT'),
          this.translationService.getValue('RACK_NO'),
          this.translationService.getValue('PURCHASE_PRICE'),
          this.translationService.getValue('MARGIN'),
          this.translationService.getValue('SALES_PRICE'),
          this.translationService.getValue('MRP'),
          this.translationService.getValue('WAREHOUSE'),
        ]];

        let productDetails = [];
        this.downloadProduct.forEach((data: any) => {
          productDetails.push({
            'PRODUCT_NAME': data.name,
            'PRODUCT_CODE': data.code,
            'BRAND': data.brandName,
            'CATEGORY': data.categoryName,
            'UNIT': data.unitName,
            'RACK_NO': data.rackNo,
            'PURCHASE_PRICE': data.purchasePrice,
            'MARGIN': data.margin,
            'SALES_PRICE': data.salesPrice,
            'MRP': data.mrp,
            'WAREHOUSE': data.warehouseName,
          });
        });

        let workBook = XLSX.utils.book_new();
        XLSX.utils.sheet_add_aoa(workBook, heading);
        let workSheet = XLSX.utils.sheet_add_json(workBook, productDetails, { origin: "A2", skipHeader: true });
        XLSX.utils.book_append_sheet(workBook, workSheet, this.translationService.getValue('PRODUCT_LIST'));
        XLSX.writeFile(workBook, this.translationService.getValue('PRODUCT_LIST') + ".xlsx");
      });
  }


  onDownloadProductPdf() {
    this.productService.downloadProducts(this.productResource)
      .subscribe(data => {
        this.downloadProduct = data.body;

        // Get the current date and time
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString();
        const formattedTime = currentDate.toLocaleTimeString();

        let heading = [
          this.translationService.getValue('S NO'),
          this.translationService.getValue('PRODUCT_NAME'),
          this.translationService.getValue('Product Code'),
          this.translationService.getValue('BRAND'),
          this.translationService.getValue('CATEGORY'),
          this.translationService.getValue('UNIT'),
          this.translationService.getValue('Rack NO'),
          this.translationService.getValue('PURCHASE_PRICE'),
          this.translationService.getValue('Margin'),
          this.translationService.getValue('SALES_PRICE'),
          this.translationService.getValue('MRP'),
          this.translationService.getValue('WAREHOUSE'),
        ];


        const productDetailsValue = this.downloadProduct.map((data: any, index: number) => [
          index + 1,
          data.name,
          data.code,
          data.brandName,
          data.categoryName,
          data.unitName,
          data.rackNo,
          data.purchasePrice,
          data.margin,
          data.salesPrice,
          data.mrp,
          data.warehouseName
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
        const headerText = 'Product List';
        const headerWidth = doc.getStringUnitWidth(headerText) * 5;
        const centerX = (pageWidth - headerWidth) / 2;
        const centerY = 10; // Adjust the Y-coordinate based on your preference
        doc.text(headerText, centerX, centerY);


        const columnStyles = {};
        for (let i = 0; i < heading.length; i++) {
          if (i === 0) {
            columnStyles[i] = { cellWidth: 10 };
          } else if (i === 1) {
            columnStyles[i] = { cellWidth: 22 };
          } else if (i === 2) {
            columnStyles[i] = { cellWidth: 20 };
          } else if (i === 4) {
            columnStyles[i] = { cellWidth: 17 };
          } else if (i === 5) {
            columnStyles[i] = { cellWidth: 13 };
          } else if (i === 6) {
            columnStyles[i] = { cellWidth: 12 };
          } else if (i === 7) {
            columnStyles[i] = { cellWidth: 14 };
          } else if (i === 8) {
            columnStyles[i] = { cellWidth: 14 };
          }
          else if (i === 9) {
            columnStyles[i] = { cellWidth: 14 };
          }
          else {
            columnStyles[i] = { cellWidth: 19 };
          }
        }

        const options = {
          head: [heading],
          body: productDetailsValue,
          theme: 'grid',
          startY: 20,
          styles: { halign: 'center', fontSize: 8, font: 'customfont' },
          columnStyles: columnStyles,
          cellStyles: { 4: { cellWidth: 'wrap', valign: 'middle', halign: 'left', fontStyle: 'normal' } },
          margin: { top: 15, right: 5, bottom: 5, left: 5 },
        };

        (doc as any).autoTable(options);

        doc.save(this.translationService.getValue('PRODUCT_LIST') + '.pdf');
      });
  }

  uploadFile(event: any) {
    const fileInput = event.target as HTMLInputElement;
    console.log(fileInput.files);

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

  uploadProductFiles() {
    if (this.fileInput.files && this.fileInput.files.length > 0) {
      const file = this.fileInput.files[0];

      // Check if the file type is Excel
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
        file.type === 'application/vnd.ms-excel') { // .xls

        // const formData = new FormData();
        // formData.append('FileDetails', file);

        // this.inventoryService.uploadInventory(formData).subscribe(
        //   (response) => {
        //     console.log(response);

        //     if (response) {
        //       this.toastrService.success('File uploaded successfully');
        //       this.closeButton.nativeElement.click()
        //       this.showFileName = '';
        //       this.fileInput = [];
        //     } else {
        //       this.toastrService.error('Error uploading file:');
        //     }
        // },
        //   (error) => {
        //     this.toastrService.error('Error uploading file:');
        //   }
        // );
      } else {
        this.toastrService.warning('Invalid file type. Please upload an Excel file.');
      }
    } else {
      this.toastrService.warning('No file selected for upload');

    }
  }

}
