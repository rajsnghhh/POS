import { HttpResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Customer } from '@core/domain-classes/customer';
import { CustomerResourceParameter } from '@core/domain-classes/customer-resource-parameter';
import { DeliveryStatusEnum } from '@core/domain-classes/delivery-status-enum';
import { Product } from '@core/domain-classes/product';
import { ProductResourceParameter } from '@core/domain-classes/product-resource-parameter';
import { SalesOrder } from '@core/domain-classes/sales-order';
import { SalesOrderItem } from '@core/domain-classes/sales-order-item';
import { SalesOrderItemTax } from '@core/domain-classes/sales-order-item-tax';
import { SalesOrderStatusEnum } from '@core/domain-classes/sales-order-status';
import { Tax } from '@core/domain-classes/tax';
import { Unit } from '@core/domain-classes/unit';
import { CommonService } from '@core/services/common.service';
import { TaxService } from '@core/services/tax.service';
import { TranslationService } from '@core/services/translation.service';
import { QuantitiesUnitPriceTaxPipe } from '@shared/pipes/quantities-unitprice-tax.pipe';
import { QuantitiesUnitPricePipe } from '@shared/pipes/quantities-unitprice.pipe';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap, tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
import { CustomerService } from 'src/app/customer/customer.service';
import { ProductService } from 'src/app/product/product.service';
import { UnitConversationService } from 'src/app/unit-conversation/unit-conversation.service';
import { UnitConversation } from '@core/domain-classes/unit-conversation';
import { Operators } from '@core/domain-classes/operator';
import { Warehouse } from '@core/domain-classes/warehouse';
import { CustomRoundPipe } from '@shared/pipes/round.pipe';
import { SalesOrderService } from '../sales-order/sales-order.service';
import { PaymentMethod } from '@core/domain-classes/payment-method';
import { PurchaseOrderPaymentService } from '../purchase-order/purchase-order-payment.service';
import { ClonerService } from '@core/services/clone.service';
import { FormControl } from '@angular/forms';
import { environment } from '@environments/environment';
import { SalesOrderPayment } from '@core/domain-classes/sales-order-payment';
import { SalesOrderPaymentService } from '../sales-order/sales-order-payment.service';

@Component({
  selector: 'app-pos-product',
  templateUrl: './pos-product.component.html',
  styleUrls: ['./pos-product.component.scss'],
  viewProviders: [QuantitiesUnitPricePipe, QuantitiesUnitPriceTaxPipe, CustomRoundPipe]
})

export class PosProductComponent extends BaseComponent {
  salesOrderForThermalInvoice: SalesOrder;
  salesOrderItems: SalesOrderItem[];
  vegetablesOrderItems: any;
  othersOrderItems: any;
  taxes$: Observable<Tax[]>;
  salesOrderForm: UntypedFormGroup;
  products: Product[] = [];
  customers: Customer[] = [];
  warehouseList: Warehouse[] = [];
  customerResource: CustomerResourceParameter;
  productResource: ProductResourceParameter;
  isLoading: boolean = false;
  isCustomerLoading: boolean = false;
  filterProductsMap: { [key: string]: Product[] } = {};
  unitsMap: { [key: string]: UnitConversation[] } = {};
  warehouseMap: { [key: string]: Warehouse[] } = {};
  unitConversationlist: UnitConversation[] = [];
  taxsMap: { [key: string]: Tax[] } = {};
  totalBeforeDiscount: number = 0;
  totalAfterDiscount: number = 0;
  totalDiscount: number = 0;
  grandTotal: number = 0;
  totalTax: number = 0;
  timeoutclear: any;
  salesOrder: SalesOrder;
  isEdit: boolean = false;
  setProductMainCategoryId: any;
  disabled_master_category: any;
  paymentMethodslist: PaymentMethod[] = [];
  paymentselect: any = 0;
  masterCategoryList: Array<any> = [];
  master_category: any = '';
  baseUrl = environment.apiUrl;

  productCtrl = new FormControl();
  paymentsForm: any = {
    id: '',
    salesOrderId: '',
    paymentDate: new Date(),
    referenceNumber: '',
    amount: '',
    note: '',
    paymentMethod: ''
  };

  filteredProducts: Observable<Product[]>;

  get salesOrderItemsArray(): UntypedFormArray {
    return <UntypedFormArray>this.salesOrderForm.get('salesOrderItems');
  }

  constructor(
    private fb: UntypedFormBuilder,
    private customerService: CustomerService,
    private toastrService: ToastrService,
    private salesOrderService: SalesOrderService,
    private router: Router,
    private taxService: TaxService,
    private productService: ProductService,
    private route: ActivatedRoute,
    private quantitiesUnitPricePipe: QuantitiesUnitPricePipe,
    private quantitiesUnitPriceTaxPipe: QuantitiesUnitPriceTaxPipe,
    public translationService: TranslationService,
    private customRoundPipe: CustomRoundPipe,
    private unitConversationService: UnitConversationService,
    private purchaseOrderPaymentService: PurchaseOrderPaymentService,
    private clonerService: ClonerService,
    private salesOrderPaymentService: SalesOrderPaymentService,
  ) {
    super(translationService);
    this.getLangDir();
    this.customerResource = new CustomerResourceParameter();
    this.productResource = new ProductResourceParameter();
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
        } else {
          this.setProductMainCategoryId = 'afc982ac-5e05-4633-99fb-08dbe76cdb9b';
          this.master_category = 'afc982ac-5e05-4633-99fb-08dbe76cdb9b'
          this.disabled_master_category = ''
          // this.productResource.productMainCategoryId = this.setProductMainCategoryId;
          // this.getProducts(data);
        }
        this.getProductByBarCodeValue();

      });

    this.unitConversationlist = [... this.route.snapshot.data['units']];
    this.warehouseList = [... this.route.snapshot.data['warehouses']];
    // this.getSalesOrderById();
    this.createSalesOrder();
    this.customerNameChangeValue();
    this.getNewSalesOrderNumber();
    this.getTaxes();
    this.paymentMethodsList();

    this.salesOrderItemsArray.controls.forEach((x, i) => {
      this.filteredProducts = x.get('productCtrl').valueChanges
        .pipe(
          startWith(''),
          map(product => product ? this._filterProducts(product, i) : this.filterProductsMap[0].slice())
        );
    })

  }


  setProductMainCategoryID(e: any) {
    this.setProductMainCategoryId = e
    // this.productResource.productMainCategoryId = this.setProductMainCategoryId;
    // this.getProducts(e);
    // return this.productService.getProducts(this.productResource);
  }

  isSelectDisabled(): boolean {
    return !!this.disabled_master_category;
  }

  onTabClick(): void {
    // Check if there's only one option and set the input value
    if (this.filteredProducts[0]?.length === 1) {
      const productId = this.filteredProducts[0].id;
      this.onProductSelectionChange(productId, 0);
    }
  }

  displayFn(options: Product[]): (id: String) => string {
    return (id: String) => {
      const correspondingOption = Array.isArray(options) ? options.find(option => option.id === id) : null;
      return correspondingOption ? correspondingOption.name : '';
    }
  }

  private _filterProducts(value: string, index: any): Product[] {
    const filterValue = value.trim().toLowerCase();
    return this.filterProductsMap[index].filter(product => product.name.trim().toLowerCase().indexOf(filterValue) === 0 || product.code.trim().toLowerCase().indexOf(filterValue) === 0);
  }

  getTaxes() {
    this.taxes$ = this.taxService.entities$;
  }

  handleTab(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      this.onAddAnotherProduct();
    }
  }

  paymentMethodsList() {
    this.sub$.sink = this.purchaseOrderPaymentService.getPaymentMethod()
      .subscribe(f => this.paymentMethodslist = [...f]
      );
  }

  createSalesOrder() {
    this.route.data
      .pipe(
    )
      .subscribe((salesOrderData: { 'salesorder': SalesOrder }) => {
        this.salesOrder = salesOrderData.salesorder;
        if (this.salesOrder) {
          this.isEdit = true;
          this.salesOrderForm = this.fb.group({
            orderNumber: [this.salesOrder.orderNumber, [Validators.required]],
            filerCustomer: [''],
            deliveryDate: [this.salesOrder.deliveryDate, [Validators.required]],
            soCreatedDate: [this.salesOrder.soCreatedDate, [Validators.required]],
            deliveryStatus: [this.salesOrder.deliveryStatus],
            customerId: [this.salesOrder.customerId, [Validators.required]],
            note: [this.salesOrder.note],
            filterBarCodeValue: [''],
            counterId: [JSON.parse(localStorage.getItem('authObj')).counterId],
            termAndCondition: [this.salesOrder.termAndCondition],
            isAppOrderRequest: false,
            isAdvanceOrderRequest: false,
            salesOrderItems: this.fb.array([])
          });
          this.salesOrder.salesOrderItems.forEach(c => {
            this.salesOrderItemsArray.push(this.createSalesOrderItemPatch(this.salesOrderItemsArray.length, c));
          });
          this.getCustomers();
          this.getAllTotal();
        }
        else {
          this.isEdit = false;
          this.getCustomers();
          this.salesOrderForm = this.fb.group({
            orderNumber: ['', [Validators.required]],
            filerCustomer: [''],
            deliveryDate: [new Date(), [Validators.required]],
            soCreatedDate: [new Date(), [Validators.required]],
            deliveryStatus: [1],
            counterId: [JSON.parse(localStorage.getItem('authObj')).counterId],
            customerId: ['', [Validators.required]],
            note: [''],
            filterBarCodeValue: [''],
            termAndCondition: [''],
            salesOrderItems: this.fb.array([])
          });
          this.salesOrderItemsArray.push(this.createSalesOrderItem(this.salesOrderItemsArray.length));
        }
      });
  }

  getProductByBarCodeValue() {
    this.sub$.sink = this.salesOrderForm.get('filterBarCodeValue').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(c => {

          if (c) {
            this.productResource.barcode = c;
            this.productResource.productMainCategoryId = this.setProductMainCategoryId
            console.log(this.productResource);

            return this.productService.getProducts(this.productResource);
          } {
            return of([]);
          }
        })
      ).subscribe((resp: HttpResponse<Product[]>) => {
        if (resp && resp.headers) {
          if (resp.body.length == 1) {

            if (this.salesOrderItemsArray.length == 1) {
              if (!this.salesOrderItemsArray.controls[0].get('productId').value) {
                this.onRemoveSalesOrderItem(0);
              }
            }

            const productId = (resp.body[0] as Product).id;
            let purchaseOrderItems: SalesOrderItem[] = this.salesOrderItemsArray.value;
            var existingProductIndex = purchaseOrderItems.findIndex(c => c.productId == productId);

            if (existingProductIndex >= 0) {
              let iteamToUpdate = purchaseOrderItems[existingProductIndex];
              this.salesOrderItemsArray.at(existingProductIndex).get('quantity').patchValue(iteamToUpdate.quantity + 1)
            } else {
              this.onAddAnotherProduct();
              const currentIndex = this.salesOrderItemsArray.length - 1;
              this.filterProductsMap[currentIndex.toString()] = [...resp.body];
              this.onProductSelectionChange(productId, currentIndex, false);
            }
            this.getAllTotal();
          } else {
            this.toastrService.warning('Product not found');
          }
          this.productResource.barcode = '';
          this.salesOrderForm.get('filterBarCodeValue').patchValue('');
        }
      }, (err) => {

      });
  }

  onAddAnotherProduct() {
    this.salesOrderItemsArray.push(this.createSalesOrderItem(this.salesOrderItemsArray.length));
    this.salesOrderItemsArray.controls.forEach((x, i) => {
      this.filteredProducts = x.get('productCtrl').valueChanges
        .pipe(
          startWith(''),
          map(product => product ? this._filterProducts(product, i) : this.filterProductsMap[0].slice())
        );
    })
  }

  createSalesOrderItemPatch(index: number, salesOrderItem: SalesOrderItem) {
    const taxs = salesOrderItem.salesOrderItemTaxes.map(c => c.taxId);
    const formGroup = this.fb.group({
      productCtrl: [''],
      productId: [salesOrderItem.productId, [Validators.required]],
      filterProductValue: [''],
      unitPrice: [salesOrderItem.unitPrice, [Validators.required]],
      purPrice: [''],
      quantity: [salesOrderItem.quantity, [Validators.required]],
      taxValue: [taxs],
      unitId: [salesOrderItem.unitId, [Validators.required]],
      warehouseId: [salesOrderItem.warehouseId],
      stock: [salesOrderItem.stock],
      discountPercentage: [salesOrderItem.discountPercentage]
    });
    this.unitsMap[index] = this.unitConversationlist.filter(c => c.id == salesOrderItem.product.unitId || c.parentId == salesOrderItem.product.unitId);
    this.taxsMap[index] = [... this.route.snapshot.data['taxs']];
    this.warehouseMap[index] = this.warehouseList;
    this.filterProductsMap[index.toString()] = [salesOrderItem.product];

    this.filteredProducts = this.salesOrderItemsArray.controls[index].get('productCtrl').valueChanges
      .pipe(
        startWith(''),
        map(product => product ? this._filterProducts(product, index) : this.filterProductsMap[index].slice())
      );


    return formGroup;
  }

  createSalesOrderItem(index: number) {
    const formGroup = this.fb.group({
      productCtrl: [''],
      productId: ['', [Validators.required]],
      filterProductValue: [''],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      purPrice: [''],
      quantity: [1, [Validators.required, Validators.min(0)]],
      stock: [''],
      taxValue: [null],
      unitId: ['', [Validators.required]],
      warehouseId: [''],
      discountPercentage: [0, [Validators.min(0)]]
    });
    // this.unitsMap[index] = [... this.route.snapshot.data['units']];
    // this.taxsMap[index] = [... this.route.snapshot.data['taxs']];
    this.warehouseMap[index] = this.warehouseList;

    this.filterProductsMap[index.toString()] = [...this.route.snapshot.data['products']];

    // console.log(this.filterProductsMap[index.toString()].filter((x: any) => x.code.includes('1111')));
    this.getProductByNameValue(formGroup, index);
    return formGroup;
  }


  getProductByNameValue(formGroup: UntypedFormGroup, index: number) {
    if (this.salesOrder) {
      this.getProducts(index);
    }

    this.sub$.sink = formGroup.get('filterProductValue').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        // switchMap(c => {
        //   this.productResource.name = c;
        //   return this.productService.getProducts(this.productResource);
        // })
      ).subscribe((resp: HttpResponse<Product[]>) => {
        if (resp && resp.headers) {
          this.filterProductsMap[index.toString()] = [...resp.body];
        }
      }, (err) => {

      });

  }

  getAllTotal() {
    let salesOrderItems = this.salesOrderForm.get('salesOrderItems').value;
    this.totalBeforeDiscount = 0;
    this.grandTotal = 0;
    this.totalDiscount = 0;
    this.totalTax = 0;
    if (salesOrderItems && salesOrderItems.length > 0) {
      salesOrderItems.forEach(so => {
        if (so.unitPrice && so.quantity) {
          // const totalBeforeDiscount = this.totalBeforeDiscount + parseFloat(this.quantitiesUnitPricePipe.transform(so.quantity, so.unitPrice));
          const totalBeforeDiscount = parseFloat(this.customRoundPipe.transform(this.totalBeforeDiscount + parseFloat(this.quantitiesUnitPricePipe.transform(so.quantity, so.unitPrice))));

          this.totalBeforeDiscount = parseFloat(totalBeforeDiscount.toFixed(2));
          // const gradTotal = this.grandTotal + parseFloat(this.quantitiesUnitPricePipe.transform(so.quantity, so.unitPrice, so.discountPercentage, so.taxValue, this.taxsMap[0]));
          const gradTotal = parseFloat(this.customRoundPipe.transform(this.grandTotal + parseFloat(this.quantitiesUnitPricePipe.transform(so.quantity, so.unitPrice, so.discountPercentage, so.taxValue, this.taxsMap[0]))));
          this.grandTotal = parseFloat(gradTotal.toFixed(2));
          const totalTax = this.totalTax + parseFloat(this.quantitiesUnitPriceTaxPipe.transform(so.quantity, so.unitPrice, so.discountPercentage, so.taxValue, this.taxsMap[0]));
          this.totalTax = parseFloat(totalTax.toFixed(2));
          const totalDiscount = this.totalDiscount + parseFloat(this.quantitiesUnitPriceTaxPipe.transform(so.quantity, so.unitPrice, so.discountPercentage));
          this.totalDiscount = parseFloat(totalDiscount.toFixed(2));
        }
      })
    }
  }

  onUnitPriceChange() {
    this.getAllTotal();
  }
  onQuantityChange(salesOrderItem: any, index: any) {
    let errorDisplayed = false;

    salesOrderItem.valueChanges.pipe(
      debounceTime(300) // Adjust the debounce time as needed
    ).subscribe(value => {
      if (value.stock < value.quantity) {
        this.toastrService.warning(this.translationService.getValue('Qty should not be more than stock'));
        errorDisplayed = true;
        this.salesOrderItemsArray.controls[index].patchValue({
          quantity: value.stock
        });
      } else if (value.stock >= value.quantity) {
        errorDisplayed = false; // Reset the flag if the condition is no longer met
      }
    });

    this.getAllTotal();
  }
  onDiscountChange() {
    this.getAllTotal();
  }
  onTaxSelectionChange() {
    this.getAllTotal();
  }

  onRemoveSalesOrderItem(index: number) {
    this.salesOrderItemsArray.removeAt(index);
    this.salesOrderItemsArray.controls.forEach((c: UntypedFormGroup, index: number) => {
      const productId = c.get('productId').value;
      if (productId) {
        this.salesOrder.salesOrderItems.map(pi => {
          if (pi.product.id === productId) {
            if (this.products.find(c => c.id === productId)) {
              this.getProducts(index);
            } else {
              this.getProducts(index, productId);
            }
          }
        });
      } else {
        this.getProducts(index);
      }
    });

    this.getAllTotal();
  }

  getProducts(index: number, productId?: string) {
    // if (this.products.length === 0 || productId) {
    //   this.productResource.name = '';
    //   this.productResource.id = productId ? productId : '';
    //    this.productResource.productMainCategoryId = this.setProductMainCategoryId;
    //   this.productService.getProducts(this.productResource)
    //     .subscribe((resp: HttpResponse<Product[]>) => {
    //       this.products = [...resp.body];
    //       this.filterProductsMap[index.toString()] = [...resp.body];
    //     }, (err) => {
    //     });
    // } else {
    //   this.filterProductsMap[index.toString()] = [...this.products];
    // }

  }

  setUnitConversationForProduct(id: string, index: number) {
    this.unitsMap[index] = this.unitConversationlist.filter(c => c.id == id || c.parentId == id);
  }

  onSelectionChange(unitId: any, index: number, isFromUI = true) {

    // const productCtrl = this.salesOrderItemsArray.controls[index].get('productCtrl').value;

    const productId = this.salesOrderItemsArray.controls[index].get('productId').value;
    const product = this.filterProductsMap[index].find(c => c.id === productId);
    const unit = this.unitConversationlist.find(c => c.id === unitId);
    let price = 0;

    if (unit.value) {
      switch (unit.operator) {
        case Operators.Plush:
          price = product.salesPrice + parseFloat(unit.value);
          break;
        case Operators.Minus:
          price = product.salesPrice - parseFloat(unit.value);
          break;
        case Operators.Multiply:
          price = product.salesPrice * parseFloat(unit.value);
          break;
        case Operators.Divide:
          price = product.salesPrice / parseFloat(unit.value);
          break;
      }
      this.salesOrderItemsArray.controls[index].patchValue({
        unitPrice: price,
        purPrice: product.purchasePrice,

      });

    } else {
      this.salesOrderItemsArray.controls[index].patchValue({
        purPrice: product.purchasePrice,
        unitPrice: product.salesPrice,
        warehouseId: product.warehouseId
      });
    }
  }


  onProductSelectionChange(productId: any, index: number, isFromUI = true) {


    let product = this.filterProductsMap[index].find((c: Product) => c.id === productId);
    console.log(product);


    if (product.stock == 0 || product.stock < 1) {
      this.toastrService.warning('Product is no longer available in stock')
    } else {
      this.setUnitConversationForProduct(product.unitId, index);
      if (isFromUI) {
        this.salesOrderItemsArray.controls[index].patchValue({
          filterProductValue: '',
          unitPrice: ''
        });
      } else {
        this.salesOrderItemsArray.controls[index].patchValue({
          productId: productId
        });
      }

      this.salesOrderItemsArray.controls[index].patchValue({
        unitPrice: product.salesPrice,
        unitId: product.unitId,
        warehouseId: product.warehouseId,
        stock: product.stock,
        purPrice: product.purchasePrice
      });

      if (product.productTaxes.length) {
        this.salesOrderItemsArray.controls[index].patchValue({
          taxValue: product.productTaxes.map(c => c.taxId)
        });
      }
      this.salesOrderItemsArray.controls[index].get('productId').setValue(productId)

      this.getAllTotal();
    }


  }

  getNewSalesOrderNumber() {
    this.salesOrderService.getNewSalesOrderNumber().subscribe(salesOrder => {
      if (!this.salesOrder) {
        this.salesOrderForm.patchValue({
          orderNumber: salesOrder.orderNumber
        });
      }
    });
  }


  customerNameChangeValue() {
    this.sub$.sink = this.salesOrderForm.get('filerCustomer').valueChanges
      .pipe(
        tap(c => this.isCustomerLoading = true),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(c => {
          this.customerResource.customerName = c;
          this.customerResource.id = null;
          return this.customerService.getCustomers(this.customerResource);
        })
      ).subscribe((resp: HttpResponse<Customer[]>) => {
        this.isCustomerLoading = false;
        if (resp && resp.headers) {
          this.customers = [...resp.body];
          const walkInCustomer = this.customers.find((c) => c.isWalkIn);
          if (!walkInCustomer) {
            this.getWalkinCustomer();
          } else {
            this.salesOrderForm.get('customerId').setValue(walkInCustomer.id);
          }
        }
      }, (err) => {
        this.isCustomerLoading = false;
      });
  }

  getWalkinCustomer() {
    this.customerService.getWalkInCustomer().subscribe((c) => {
      if (c) {
        this.customers.push(c);
        this.salesOrderForm.get('customerId').setValue(c.id);
      }
    });
  }

  getCustomers() {

    if (this.salesOrder) {
      this.customerResource.id = this.salesOrder.customerId;
    } else {
      this.customerResource.customerName = '';
      this.customerResource.id = null;
    }
    this.customerService.getCustomers(this.customerResource)
      .subscribe(resp => {
        if (resp && resp.headers) {
          this.customers = [...resp.body];
          const walkInCustomer = this.customers.find((c) => c.isWalkIn);
          if (!walkInCustomer) {
            this.getWalkinCustomer();
          } else {
            this.salesOrderForm.get('customerId').setValue(walkInCustomer.id);
          }
        }
      });
  }

  onSalesOrderSubmit(isSaveAndNew = false) {
    if (!this.salesOrderForm.valid) {
      this.salesOrderForm.markAllAsTouched();
    } else {
      const salesOrder = this.buildSalesOrder();
      let salesOrderItems = this.salesOrderForm.get('salesOrderItems').value;
      if (salesOrderItems && salesOrderItems.length == 0) {
        this.toastrService.error(
          this.translationService.getValue('PLEASE_SELECT_ATLEASE_ONE_PRODUCT')
        );
      } else {
        this.salesOrderService
          .addSalesOrder(salesOrder)
          .subscribe((c: SalesOrder) => {
            this.toastrService.success(
              this.translationService.getValue('SALES_ORDER_ADDED_SUCCESSFULLY')
            );
            if (isSaveAndNew) {
              this.router.navigate(['/pos-product']);
              this.ngOnInit();
            } else {
              this.paymentsForm.salesOrderId = c.id;
              this.paymentsForm.amount = Math.round(c.totalAmount);
              this.paymentsForm.paymentMethod = this.paymentselect;
              this.saveSalesOrderPayment(c);
            }
          });
      }
    }
  }

  saveSalesOrderPayment(c: any): void {
    const salesOrderpayment: SalesOrderPayment = this.paymentsForm;
    this.salesOrderPaymentService.addSalesOrderPayments(salesOrderpayment).subscribe(() => {
      this.getSalesOrderById(c.id);
    });
  }

  getSalesOrderById(id: string) {
    this.isLoading = true;
    this.salesOrderService.getSalesOrderById(id)
      .subscribe((c: SalesOrder) => {
        this.salesOrder = this.clonerService.deepClone<SalesOrder>(c);
        this.salesOrder.totalQuantity = this.salesOrder?.salesOrderItems?.map(item => item.status == 1 ? -1 * item.quantity : item.quantity).reduce((prev, next) => prev + next);
        this.salesOrderItems = this.salesOrder?.salesOrderItems.filter(c => c.status == 0);

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
        this.generateThermalInvoice();

        this.isLoading = false;
        setTimeout(function () {
          window.location.reload();
        }, 3000);
      }, (err) => {
        this.isLoading = false;
      });

  }

  buildSalesOrder() {
    const salesOrder: SalesOrder = {
      deliveryCharges: 0,
      id: this.salesOrder ? this.salesOrder.id : '',
      orderNumber: this.salesOrderForm.get('orderNumber').value,
      deliveryDate: this.salesOrderForm.get('deliveryDate').value,
      deliveryStatus: DeliveryStatusEnum.UnDelivery,
      isSalesOrderRequest: false,
      utrNo: '',
      mobileNo: '',
      offlineMode: '',
      onlineOffline: '',
      isAdvanceOrderRequest: false,
      isAppOrderRequest: false,
      counterId: JSON.parse(localStorage.getItem('authObj')).counterId,
      soCreatedDate: this.salesOrderForm.get('soCreatedDate').value,
      salesOrderStatus: SalesOrderStatusEnum.Not_Return,
      customerId: this.salesOrderForm.get('customerId').value,
      totalAmount: this.grandTotal,
      totalDiscount: this.totalDiscount,
      totalTax: this.totalTax,
      note: this.salesOrderForm.get('note').value,
      termAndCondition: this.salesOrderForm.get('termAndCondition').value,
      salesOrderItems: [],
      productMainCategoryId: this.setProductMainCategoryId,
      paymentMethod: this.paymentselect

    };
    console.log(salesOrder);


    const salesOrderItems = this.salesOrderForm.get('salesOrderItems').value;
    if (salesOrderItems && salesOrderItems.length > 0) {
      salesOrderItems.forEach(so => {
        console.log(so);


        salesOrder.salesOrderItems.push(
          {
            discount: parseFloat(this.quantitiesUnitPriceTaxPipe.transform(so.quantity, so.unitPrice, so.discountPercentage)),
            discountPercentage: so.discountPercentage,
            productId: so.productId,
            unitId: so.unitId,
            warehouseId: so.warehouseId,
            quantity: so.quantity,
            stock: so.stock,
            taxValue: parseFloat(this.quantitiesUnitPriceTaxPipe.transform(so.quantity, so.unitPrice, so.discountPercentage, so.taxValue, this.taxsMap[0])),
            unitPrice: parseFloat(so.unitPrice),
            totalSalesPrice: parseFloat(this.customRoundPipe.transform(so.quantity * parseFloat(so.unitPrice))),
            totalPurPrice: parseFloat(this.customRoundPipe.transform(so.quantity * parseFloat(so.purPrice))),
            salesOrderItemTaxes: so.taxValue ? [
              ...so.taxValue.map(element => {
                const salesOrderItemTaxes: SalesOrderItemTax = {
                  taxId: element
                };
                return salesOrderItemTaxes;
              })
            ] : []
          }
        )
      })
    }
    return salesOrder;
  }

  onSalesOrderList() {
    this.router.navigate(['/sales-order/list']);
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

}



