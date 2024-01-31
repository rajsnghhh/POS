import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Brand } from '@core/domain-classes/brand';
import { Product } from '@core/domain-classes/product';
import { ProductCategory } from '@core/domain-classes/product-category';
import { Tax } from '@core/domain-classes/tax';
import { Unit } from '@core/domain-classes/unit';
import { Warehouse } from '@core/domain-classes/warehouse';
import { BrandService } from '@core/services/brand.service';
import { ProductCategoryService } from '@core/services/product-category.service';
import { TaxService } from '@core/services/tax.service';
import { TranslationService } from '@core/services/translation.service';
import { UnitService } from '@core/services/unit.service';
import { WarehouseService } from '@core/services/warehouse.service';
import { environment } from '@environments/environment';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';
import { UnitConversationService } from 'src/app/unit-conversation/unit-conversation.service';
import { ProductService } from '../product.service';
import { Supplier } from '@core/domain-classes/supplier';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { SupplierService } from 'src/app/supplier/supplier.service';
import { Subject } from '@microsoft/signalr';
import { HttpResponse } from '@angular/common/http';
import { SupplierResourceParameter } from '@core/domain-classes/supplier-resource-parameter';



@Component({
  selector: 'app-manage-product',
  templateUrl: './manage-product.component.html',
  styleUrls: ['./manage-product.component.scss']
})
export class ManageProductComponent extends BaseComponent implements OnInit {
  productForm: UntypedFormGroup;
  supplierNameControl: UntypedFormControl = new UntypedFormControl();
  public filterObservable$: Subject<string> = new Subject<string>();


  units: Unit[] = [];
  productCategories: ProductCategory[] = [];
  allCategories: ProductCategory[] = [];
  supplierResource: SupplierResourceParameter;

  taxes: Tax[] = [];
  brands: Brand[] = [];
  warehouses: Warehouse[] = [];
  isLoading = false;
  orderTime: boolean = false;
  productImgSrc: any = null;
  isProductImageUpload = false;
  qrCodeImgSrc: any = null;
  isQrCodeUpload = false;
  salesPriceValue: any;
  suppliers: any;
  manufacturerList: any;

  constructor(
    private fb: UntypedFormBuilder,
    private supplierService: SupplierService,
    private unitService: UnitConversationService,
    private productCategoryService: ProductCategoryService,
    private taxService: TaxService,
    private productService: ProductService,
    private brandService: BrandService,
    private warehouseService: WarehouseService,
    private toastrService: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public translationService: TranslationService) {
    super(translationService);
    this.getLangDir();
    this.supplierResource = new SupplierResourceParameter();
    this.supplierResource.pageSize = 0;
  }

  ngOnInit(): void {
    this.createProductForm();
    this.getSupplierList();
    this.getManufactureList();
    this.getSupplierByNameValue();
    this.getManufacturerByNameValue();
    this.getUnits();
    this.getProductCategories();
    this.getTaxes();
    this.getBrands();
    this.getBrandByNameValue();
    this.getWarehouse();
    this.activatedRoute.data.subscribe((data: { product: Product }) => {
      if (data && data.product) {
        this.productForm.patchValue(data.product);
        if (data.product.productUrl) {
          this.productImgSrc = `${environment.apiUrl}${data.product.productUrl}`;
        }
        if (data.product.qrCodeUrl) {
          this.qrCodeImgSrc = `${environment.apiUrl}${data.product.qrCodeUrl}`;
        }
        const productTaxIds = data.product.productTaxes.map(c => c.taxId);
        this.productForm.get('productTaxIds').patchValue(productTaxIds);
        this.orderTime = this.productForm.value.isProductOrderTime;
      }
    });

    this.salesPriceValue = Math.round(this.productForm.value.salesPrice);

  }

  getSupplierByNameValue() {
    this.sub$.sink = this.productForm.get('filterSupplierValue').valueChanges
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

  getManufacturerByNameValue() {
    this.sub$.sink = this.productForm.get('filterManufactureValue').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(c => {
          this.supplierResource.searchQuery = c;
          return this.supplierService.getManufacturer(this.supplierResource);
        })
      ).subscribe((resp: HttpResponse<any[]>) => {
        if (resp && resp.headers) {
          this.manufacturerList = [...resp.body];
        }
      }, (err) => {

      });
  }

  getBrandByNameValue() {
    this.sub$.sink = this.productForm.get('filterBrandValue').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(c => {
          this.supplierResource.searchQuery = c;
          return this.supplierService.getBrand(this.supplierResource);
        })
      ).subscribe((resp: HttpResponse<any[]>) => {
        if (resp && resp.headers) {
          this.brands = [...resp.body];
        }
      }, (err) => {

      });
  }



  getSupplierList() {
    this.supplierService.getSuppliers(this.supplierResource)
      .subscribe(resp => {
        if (resp && resp.headers) {
          this.suppliers = [...resp.body];
        }
      });
  }

  getManufactureList() {
    this.supplierService.getManufacturer(this.supplierResource)
      .subscribe(resp => {
        if (resp && resp.headers) {
          this.manufacturerList = [...resp.body];
        }
      });
  }

  getBrands() {
    //this.brandService.getAll().subscribe(b => this.brands = b);

    this.supplierService.getBrand(this.supplierResource)
      .subscribe(resp => {
        if (resp && resp.headers) {
          this.brands = [...resp.body];
        }
      });

  }

  createProductForm() {
    this.productForm = this.fb.group({
      id: [''],
      name: ['', [Validators.required]],
      brandId: ['', [Validators.required]],
      code: [''],
      barcode: ['', [Validators.required]],
      hsnCode: [''],
      skuCode: [''],
      skuName: [''],
      description: [''],
      productTaxIds: [],
      productUrlData: [],
      qRCodeUrlData: [''],
      unitId: ['', [Validators.required]],
      purchasePrice: ['', [Validators.required]],
      salesPrice: [],
      mrp: ['', [Validators.required]],
      margin: ['', [Validators.required]],
      categoryId: ['', [Validators.required]],
      warehouseId: ['eebec3a0-755a-49e5-8b76-e41477e13b1a'],
      orderEndTime: [''],
      orderStartTime: [''],
      isProductOrderTime: [''],
      rackNo: [''],
      filterSupplierValue: [''],
      filterManufactureValue: [''],
      filterBrandValue: [''],
      minQty: ['', []],
      isLoose: [false],
      supplierId: [''],
      manufacturerId: ['']
    });

    this.productForm.get('barcode').valueChanges.subscribe((barcodeValue) => {
      this.productForm.get('code').setValue(barcodeValue, { emitEvent: false });
    });

    this.productForm.get('isLoose').valueChanges.subscribe(() => {
      const minQtyControl = this.productForm.get('minQty');
      if (minQtyControl) {
        if (this.productForm.get('isLoose').value) {
          minQtyControl.setValidators([Validators.required, this.minGreaterThanZeroValidator]);
        } else {
          minQtyControl.clearValidators();
        }
        minQtyControl.updateValueAndValidity();
      }
    });

    // this.productForm.get('isLoose').valueChanges.subscribe(() => {
    //   this.productForm.get('minQty').setValidators(this.getMinQtyValidators())
    //   this.productForm.get('minQty').updateValueAndValidity();
    // })

  }

  isLooseCheckbox(e: any) {
    if (e.target.checked == false) {
      this.productForm.get('minQty').setValue('');
    }
  }



  minGreaterThanZeroValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const value = control.value;
    if (value !== undefined && (isNaN(value) || value <= 0)) {
      return { 'minGreaterThanZero': true };
    }
    return null;
  }

  getUnits() {
    this.unitService.getAllBaseUnit().subscribe(units => {
      this.units = units;
    })
  }

  getWarehouse() {
    this.warehouseService.getAll().subscribe(warehouses => {
      this.warehouses = warehouses;
    })
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

  getTaxes() {
    this.taxService.getAll().subscribe(c => this.taxes = c);
  }

  onProductSubmit() {
    if (this.productForm.valid) {
      console.log(true);

      let product: Product = this.productForm.value;
      const taxIds: string[] = this.productForm.get('productTaxIds').value;
      if (taxIds) {
        product.productTaxes = taxIds.map(c => {
          return {
            taxId: c,
            productId: product.id
          }
        });
      }
      product.isProductImageUpload = this.isProductImageUpload;
      product.isQrCodeUpload = this.isQrCodeUpload;
      product.productUrlData = this.productImgSrc;
      product.qRCodeUrlData = this.qrCodeImgSrc;
      product.isProductOrderTime = this.orderTime;


      if (!product.id) {
        this.isLoading = true;
        this.productService
          .addProudct(product)
          .subscribe((c) => {
            this.isLoading = false;
            this.toastrService.success(this.translationService.getValue('PRODUCT_SAVED_SUCCESSFULLY'));
            this.router.navigate(['/products']);
          }, () => this.isLoading = false);
      } else {
        this.isLoading = true;
        this.productService
          .updateProudct(product.id, product)
          .subscribe((c) => {
            this.isLoading = false;
            this.toastrService.success(this.translationService.getValue('PRODUCT_SAVED_SUCCESSFULLY'));
            this.router.navigate(['/products']);
          }, () => this.isLoading = false);
      }
    } else {
      console.log(false);

      this.productForm.markAllAsTouched();
    }
  }

  onProductImageSelect($event) {
    const fileSelected = $event.target.files[0];
    if (!fileSelected) {
      return;
    }
    const mimeType = fileSelected.type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(fileSelected);
    // tslint:disable-next-line: variable-name
    reader.onload = (_event) => {
      this.productImgSrc = reader.result;
      this.isProductImageUpload = true;
      $event.target.value = '';
    }
  }

  onProductImageRemove() {
    this.isProductImageUpload = true;
    this.productImgSrc = '';
  }

  onQRCodeSelect($event) {
    const fileSelected = $event.target.files[0];
    if (!fileSelected) {
      return;
    }
    const mimeType = fileSelected.type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(fileSelected);
    // tslint:disable-next-line: variable-name
    reader.onload = (_event) => {
      this.qrCodeImgSrc = reader.result;
      this.isQrCodeUpload = true;
      $event.target.value = '';
    }
  }

  onQRCodeRemove() {
    this.isQrCodeUpload = true;
    this.qrCodeImgSrc = '';
  }

  changePurchasePrice(event: any) {
    let pRate = event.target.value;
    if (pRate == '') {
      pRate = 0
    }
    let marginvalue = this.productForm.value.margin
    if (marginvalue) {
      if (pRate && marginvalue) {
        this.salesPriceValue = Math.round(Number(pRate) + (pRate * (marginvalue / 100)));
      }
    } else {
      marginvalue = 0;
      this.salesPriceValue = Math.round(Number(pRate) + (pRate * (marginvalue / 100)));
    }
  }
  changeMargin(e: any) {
    let margin = e.target.value;

    if (margin == '') {
      margin = 0;
    }

    if (this.productForm.value.purchasePrice) {
      this.salesPriceValue = Math.round((this.productForm.value.purchasePrice + (this.productForm.value.purchasePrice * (margin / 100))))
    }
  }

}
