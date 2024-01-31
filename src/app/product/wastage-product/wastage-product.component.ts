import { Component, OnInit, ViewChild } from '@angular/core';
import { ProductDataSource } from '../product-list/product-datasource';
import { ProductService } from '../product.service';
import { ProductCategoryService } from '@core/services/product-category.service';
import { BrandService } from '@core/services/brand.service';
import { UnitConversationService } from 'src/app/unit-conversation/unit-conversation.service';
import { MatDialog } from '@angular/material/dialog';
import { TranslationService } from '@core/services/translation.service';
import { CommonDialogService } from '@core/common-dialog/common-dialog.service';
import { ToastrService } from 'ngx-toastr';
import { ProductResourceParameter } from '@core/domain-classes/product-resource-parameter';
import { Subject } from 'rxjs';
import { ProductCategory } from '@core/domain-classes/product-category';
import { ResponseHeader } from '@core/domain-classes/response-header';
import { Unit } from '@core/domain-classes/unit';
import { Brand } from '@core/domain-classes/brand';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { BaseComponent } from 'src/app/base.component';



@Component({
  selector: 'app-wastage-product',
  templateUrl: './wastage-product.component.html',
  styleUrls: ['./wastage-product.component.scss']
})
export class WastageProductComponent extends BaseComponent implements OnInit {

  dataSource: ProductDataSource;
  productResource: ProductResourceParameter;
  public filterObservable$: Subject<string> = new Subject<string>();
  productCategories: ProductCategory[] = [];
  allCategories: ProductCategory[] = [];
  units: Unit[] = [];
  brands: Brand[] = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns: string[] = ['name', 'brandName', 'categoryName', 'unitName', 'purchasePrice', 'salesPrice', 'mrp', 'warehouse'];
  searchColumns: string[] = ['name-search', 'brandName-search', 'categoryName-search', 'unitName-search', 'purchasePrice-search',
    'salesPrice-search', 'mrp-search', 'warehouse-search'];
  footerToDisplayed = ['footer'];



  constructor(
    private productService: ProductService,
    private productCategoryService: ProductCategoryService,
    private brandService: BrandService,
    private unitConversationService: UnitConversationService,
    private dialog: MatDialog,
    public translationService: TranslationService,
    private commonDialogService: CommonDialogService,
    private toastrService: ToastrService) {
    super(translationService);
    this.getLangDir();
    this.productResource = new ProductResourceParameter();
    this.productResource.pageSize = 15;
   }

  ngOnInit(): void {
    this.dataSource = new ProductDataSource(this.productService);
    this.dataSource.loadData(this.productResource);
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
  getBrands() {
    this.brandService.getAll().subscribe(b => this.brands = b);
  }

  getUnits() {
    this.unitConversationService.getUnitConversations().subscribe(units => {
      this.units = units;
    })
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

}
