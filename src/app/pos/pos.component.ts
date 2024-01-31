import { HttpResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormArray,
  UntypedFormBuilder,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Customer } from '@core/domain-classes/customer';
import { CustomerResourceParameter } from '@core/domain-classes/customer-resource-parameter';
import { DeliveryStatusEnum } from '@core/domain-classes/delivery-status-enum';
import { Operators } from '@core/domain-classes/operator';
import { Product, ProductPackage } from '@core/domain-classes/product';
import { ProductResourceParameter } from '@core/domain-classes/product-resource-parameter';
import { SalesOrder } from '@core/domain-classes/sales-order';
import { SalesOrderItem } from '@core/domain-classes/sales-order-item';
import { SalesOrderItemTax } from '@core/domain-classes/sales-order-item-tax';
import { SalesOrderStatusEnum } from '@core/domain-classes/sales-order-status';
import { Tax } from '@core/domain-classes/tax';
import { UnitConversation } from '@core/domain-classes/unit-conversation';
import { ClonerService } from '@core/services/clone.service';
import { TranslationService } from '@core/services/translation.service';
import { environment } from '@environments/environment';
import { QuantitiesUnitPriceTaxPipe } from '@shared/pipes/quantities-unitprice-tax.pipe';
import { QuantitiesUnitPricePipe } from '@shared/pipes/quantities-unitprice.pipe';
import { IDetect } from 'ngx-barcodeput';
import { ToastrService } from 'ngx-toastr';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
} from 'rxjs/operators';
import { BaseComponent } from '../base.component';
import { CustomerService } from '../customer/customer.service';
import { ProductService } from '../product/product.service';
import { SalesOrderService } from '../sales-order/sales-order.service';
import Swal from 'sweetalert2';
import { PaymentMethod } from '@core/domain-classes/payment-method';
import { PurchaseOrderPaymentService } from '../purchase-order/purchase-order-payment.service';
import { SalesOrderPayment } from '@core/domain-classes/sales-order-payment';
import { SalesOrderPaymentService } from '../sales-order/sales-order-payment.service';
import { CustomRoundPipe } from '@shared/pipes/round.pipe';


@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss'],
  viewProviders: [QuantitiesUnitPricePipe, QuantitiesUnitPriceTaxPipe, CustomRoundPipe],
})
export class PosComponent
  extends BaseComponent
  implements OnInit, AfterViewInit {
  salesOrderForm: UntypedFormGroup;
  products: Product[] = [];
  filterProducts: Product[] = [];
  filterPackage: ProductPackage[] = [];
  customers: Customer[] = [];
  customerResource: CustomerResourceParameter;
  productResource: ProductResourceParameter;
  isLoading: boolean = false;
  isCustomerLoading: boolean = false;
  filterProductsMap: { [key: string]: Product[] } = {};
  unitsMap: { [key: string]: UnitConversation[] } = {};
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
  baseUrl = environment.apiUrl;
  isFromScanner = false;
  partyOrderChecked: boolean = false;
  setMainCategoryId: any;
  counterIdValue = JSON.parse(localStorage.getItem('authObj')).counterId.toString();

  @ViewChild('filterValue') filterValue: ElementRef;
  get salesOrderItemsArray(): UntypedFormArray {
    return <UntypedFormArray>this.salesOrderForm.get('salesOrderItems');
  }

  salesOrderForThermalInvoice: SalesOrder;
  salesOrderItems: SalesOrderItem[];
  vegetablesOrderItems: any;
  othersOrderItems: any;
  paymentMethodslist: PaymentMethod[] = [];
  paymentselect: any = 0;
  paymentsForm: any = {
    id: '',
    salesOrderId: '',
    paymentDate: new Date(),
    referenceNumber: '',
    amount: '',
    note: '',
    paymentMethod: ''
  };

  constructor(
    private fb: UntypedFormBuilder,
    private customerService: CustomerService,
    private toastrService: ToastrService,
    private salesOrderService: SalesOrderService,
    private router: Router,
    private productService: ProductService,
    private route: ActivatedRoute,
    private quantitiesUnitPricePipe: QuantitiesUnitPricePipe,
    private quantitiesUnitPriceTaxPipe: QuantitiesUnitPriceTaxPipe,
    public translationService: TranslationService,
    private clonerService: ClonerService,
    private purchaseOrderPaymentService: PurchaseOrderPaymentService,
    private salesOrderPaymentService: SalesOrderPaymentService,
    private customRoundPipe: CustomRoundPipe,

  ) {
    super(translationService);
    this.getLangDir();
    this.customerResource = new CustomerResourceParameter();
    this.productResource = new ProductResourceParameter();
  }

  ngOnInit(): void {
    this.unitConversationlist = [...this.route.snapshot.data['units']];
    this.createSalesOrder();
    this.getProducts();
    this.getAllData();
    this.customerNameChangeValue();
    this.getNewSalesOrderNumber();
    this.paymentMethodsList();
    this.salesOrderForm.get('filterProductValue').setValue('');
  }

  ngAfterViewInit(): void {
    this.filterValue.nativeElement.focus();
  }

  getAllData() {
    this.productService.getProducts(this.productResource).subscribe(data => {
      this.filterPackage = data.body.filter((x: any) => x.categoryId == "98f4e55a-5839-47a8-8ccc-3bfbbbe6017b");
      // this.filterProductsMap[currentIndex.toString()] = [...data.body];
    })
  }
  paymentMethodsList() {
    this.sub$.sink = this.purchaseOrderPaymentService.getPaymentMethod()
      .subscribe(f => this.paymentMethodslist = [...f]
      );
  }

  createSalesOrder() {
    this.route.data
      .pipe()
      .subscribe((salesOrderData: { salesorder: SalesOrder }) => {
        this.salesOrder = salesOrderData.salesorder;
        this.isEdit = false;
        this.getCustomers();
        this.salesOrderForm = this.fb.group({
          orderNumber: ['', [Validators.required]],
          filerCustomer: [''],
          deliveryDate: [new Date(), [Validators.required]],
          soCreatedDate: [new Date(), [Validators.required]],
          deliveryStatus: [1],
          customerId: ['', [Validators.required]],
          note: [''],
          counterId: [JSON.parse(localStorage.getItem('authObj')).counterId],
          termAndCondition: [''],
          salesOrderItems: this.fb.array([]),
          filterProductValue: [''],
        });
      });
  }

  setUnitConversationForProduct(id: string, index: number) {
    this.unitsMap[index] = this.unitConversationlist.filter(
      (c) => c.id == id || c.parentId == id
    );
  }

  onSelectionChange(unitId: any, index: number, isFromUI = true) {
    const productId =
      this.salesOrderItemsArray.controls[index].get('productId').value;
    const product = this.filterProducts.find((c) => c.id === productId);
    const unit = this.unitConversationlist.find((c) => c.id === unitId);
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
      });
    } else {
      this.salesOrderItemsArray.controls[index].patchValue({
        unitPrice: product.salesPrice,
      });
    }

  }

  onAddAnotherProduct(index: any) {

    this.salesOrderItemsArray.push(
      this.createSalesOrderItem(this.salesOrderItemsArray.length, index)
    );
    // this.purchaseOrderItemsArray.push(this.createPurchaseOrderItem(this.purchaseOrderItemsArray.length));
  }

  // handleTab(event: KeyboardEvent, index: any) {
  //   if (event.key === 'Tab') {
  //     event.preventDefault();
  //     this.onAddAnotherProduct(index);
  //   }
  // }


  // onProductSelectionChange(productId: any, index: number, isFromUI = true) {
  //   // console.log(this.filterProducts);
  //   const product = this.filterProducts.find((c: Product) => c.id === productId);
  //   // console.log(product);

  //   // const product = this.filterProductsMap[index].find((c: Product) => c.id === productId);

  //   if (product) {
  //     this.setUnitConversationForProduct(product.unitId, index);

  //     // if (isFromUI) {
  //     //   this.salesOrderItemsArray.controls[index].get('filterProductValue').patchValue('');
  //     // } else {
  //     //   this.salesOrderItemsArray.controls[index].get('productId').patchValue(productId);
  //     // }
  //   }
  //   this.salesOrderItemsArray.controls[index].patchValue({
  //     unitPrice: product.purchasePrice,
  //     mrp: product.mrp,
  //     margin: product.margin,
  //     salesPrice: ((product.purchasePrice * product.margin) / 100 + product.purchasePrice),
  //     unitId: product.unitId,
  //     stock: product.stock,
  //     warehouseId: product.warehouseId
  //   });
  //   if (product.productTaxes.length) {
  //     this.salesOrderItemsArray.controls[index].patchValue({
  //       taxValue: product.productTaxes.map(c => c.taxId)
  //     });
  //   }
  //   this.getAllTotal();
  // }


  onProductSelect(product: Product, index: number) {


    if (this.partyOrderChecked) {
      let salesOrderItems: SalesOrderItem[] =
        this.salesOrderForm.get('salesOrderItems').value;

      const existingProductIndex = salesOrderItems.findIndex(
        (c) => c.productId == product.id
      );
      let newIndex = existingProductIndex;
      if (existingProductIndex >= 0) {

        let iteamToUpdate = salesOrderItems[existingProductIndex];
        this.salesOrderItemsArray
          .at(existingProductIndex)
          .get('quantity')
          .patchValue(iteamToUpdate.quantity + 1);
      } else {
        newIndex = this.salesOrderItemsArray.length;
        this.salesOrderItemsArray.push(
          this.createSalesOrderItem(this.salesOrderItemsArray.length, product)
        );
      }
      this.setUnitConversationForProduct(product.unitId, newIndex);
      this.getAllTotal();
      this.filterValue.nativeElement.focus();
    }

    else {
      if (+product.stock > 0) {
        let salesOrderItems: SalesOrderItem[] =
          this.salesOrderForm.get('salesOrderItems').value;

        const existingProductIndex = salesOrderItems.findIndex(
          (c) => c.productId == product.id
        );
        let newIndex = existingProductIndex;
        if (existingProductIndex >= 0) {

          let iteamToUpdate = salesOrderItems[existingProductIndex];
          this.salesOrderItemsArray
            .at(existingProductIndex)
            .get('quantity')
            .patchValue(iteamToUpdate.quantity + 1);

        } else {
          newIndex = this.salesOrderItemsArray.length;
          this.salesOrderItemsArray.push(
            this.createSalesOrderItem(this.salesOrderItemsArray.length, product)
          );
        }
        this.setUnitConversationForProduct(product.unitId, newIndex);
        this.getAllTotal();
        this.filterValue.nativeElement.focus();
        const salesOrderItem = this.salesOrderItemsArray.value;
        const filterProducts = this.filterProducts;


        // Iterate through each item in the sales order items
        for (const orderItem of salesOrderItem) {
          // Find the corresponding product in the filterProducts array
          const matchingProduct = filterProducts.find(product => product.id === orderItem.productId);

          // Check if a matching product is found
          if (matchingProduct) {
            // Convert quantity and stock to numbers before comparison
            const orderQuantity = Number(orderItem.quantity);
            const productStock = Number(matchingProduct.stock);
            if (orderQuantity > productStock) {
              orderItem.quantity = productStock
              this.salesOrderItemsArray
                .at(existingProductIndex)
                .get('quantity')
                .patchValue(productStock);
              this.toastrService.warning('Product is no more available in the stock');
            }

            // Ensure quantity is below or equal to stock value
            // orderItem.quantity = Math.min(orderQuantity, productStock);
          } else {
            console.error(`Product with productId ${orderItem.productId} not found in filterProducts.`);
          }
        }

        // Now, this.salesOrderItemsArray.value has updated quantities respecting stock values.

      } else {
        this.toastrService.warning('Product is Out of Stock');
      }
    }
  }


  createSalesOrderItem(index: number, product: Product) {
    const taxs = product.productTaxes?.map((c) => c.taxId);
    const formGroup = this.fb.group({
      productId: [product.id],
      warehouseId: [product.warehouseId],
      unitPrice: [product.salesPrice, [Validators.required, Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(0)]],
      taxValue: [taxs],
      unitId: [product.unitId, [Validators.required]],
      discountPercentage: [0, [Validators.min(0)]],
      productName: [product.name],
      stock: [product.stock],

    });
    this.unitsMap[index] = this.unitConversationlist.filter(
      (c) => c.id == product.unitId || c.parentId == product.unitId
    );
    this.taxsMap[index] = [...this.route.snapshot.data['taxs']];
    return formGroup;
  }

  public onDetected(event: IDetect) {
    if (event?.type == 'scanner') {
      this.isFromScanner = true;
    } else {
      this.isFromScanner = false;
    }
  }

  getProducts() {
    // if (localStorage.getItem('nonCSDCanteensId') == 'f7c14269-2a89-4f89-0b8d-08dbde8dbe73') {
    //   this.productResource.productMainCategoryId = '06c71507-b6de-4d59-de84-08dbeb3c9568';
    // } else if (localStorage.getItem('nonCSDCanteensId') == 'edd642e5-66ec-4c96-ae21-d4d75c90f1dd') {
    //   this.productResource.productMainCategoryId = 'afc982ac-5e05-4633-99fb-08dbe76cdb9b';
    // }

    this.productService.getNonCSDCanteenDynamic(localStorage.getItem('nonCSDCanteensId'))
      .subscribe((data: any) => {
        if (data && data.mainCategoryId !== null) {
          this.setMainCategoryId = data.mainCategoryId

          this.productResource.productMainCategoryId = data.mainCategoryId;
        }

      });


    this.sub$.sink = this.salesOrderForm
      .get('filterProductValue')
      .valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((c) => {
          if (this.isFromScanner) {
            this.productResource.barcode = c;
          } else {
            this.productResource.name = c;
          }
          this.productResource.pageSize = 0;

          return this.productService.getProducts(this.productResource);

        })
      )
      .subscribe(
        (resp: HttpResponse<Product[]>) => {
          if (resp && resp.headers) {
            if (this.isFromScanner) {
              this.isFromScanner = false;
              if (resp.body.length == 1) {
                let showQuantity = this.salesOrderItemsArray.value.find((x: any) => x.productId == resp.body[0].id)
                if (showQuantity?.quantity === resp?.body[0]?.stock && !this.partyOrderChecked) {
                  this.toastrService.warning('Product is no more available in the stock');
                } else {
                  this.toastrService.success('Product Added Successfully');
                }

                this.onProductSelect(
                  this.clonerService.deepClone<Product>(resp.body[0]),
                  null
                );
              } else {
                this.toastrService.warning('Product not found');
              }
              this.productResource.barcode = '';
              this.salesOrderForm.get('filterProductValue').patchValue('');
            } else {
              this.filterProducts = this.clonerService.deepClone<Product[]>(
                resp.body.filter((x: any) => x.categoryId != "98f4e55a-5839-47a8-8ccc-3bfbbbe6017b")
              );
            }
          }
        },
        (err) => {
          this.isFromScanner = false;
        }
      );

  }

  getAllTotal() {
    let salesOrderItems = this.salesOrderForm.get('salesOrderItems').value;
    this.totalBeforeDiscount = 0;
    this.grandTotal = 0;
    this.totalDiscount = 0;
    this.totalTax = 0;
    if (salesOrderItems && salesOrderItems.length > 0) {
      salesOrderItems.forEach((so) => {
        if (so.unitPrice && so.quantity) {
          const totalBeforeDiscount =
            this.totalBeforeDiscount +
            parseFloat(
              this.quantitiesUnitPricePipe.transform(so.quantity, so.unitPrice)
            );
          this.totalBeforeDiscount = parseFloat(this.customRoundPipe.transform(parseFloat(totalBeforeDiscount.toFixed(2))));


          const gradTotal =
            this.grandTotal +
            parseFloat(
              this.quantitiesUnitPricePipe.transform(
                so.quantity,
                so.unitPrice,
                so.discountPercentage,
                so.taxValue,
                this.taxsMap[0]
              )
            );
          // this.grandTotal = parseFloat(gradTotal.toFixed(2));
          this.grandTotal = parseFloat(this.customRoundPipe.transform(parseFloat(gradTotal.toFixed(2))));

          const totalTax =
            this.totalTax +
            parseFloat(
              this.quantitiesUnitPriceTaxPipe.transform(
                so.quantity,
                so.unitPrice,
                so.discountPercentage,
                so.taxValue,
                this.taxsMap[0]
              )
            );
          this.totalTax = parseFloat(totalTax.toFixed(2));
          const totalDiscount =
            this.totalDiscount +
            parseFloat(
              this.quantitiesUnitPriceTaxPipe.transform(
                so.quantity,
                so.unitPrice,
                so.discountPercentage
              )
            );
          this.totalDiscount = parseFloat(totalDiscount.toFixed(2));
        }
      });
    }
  }

  onUnitPriceChange() {
    this.getAllTotal();
  }

  onQuantityChange(salesOrderItem: any) {

    this.getAllTotal();

    if (!this.partyOrderChecked) {

      if (salesOrderItem.value.productId == "e3ba9af6-bd61-4046-8d59-08dbebe9ff39") {
        let checkStock1: any = this.filterPackage.find((x: any) => x.id == salesOrderItem.value.productId)

        if (salesOrderItem.value.quantity > checkStock1.stock) {
          this.toastrService.warning('Product is no more available in the stock')
          salesOrderItem.value.quantity = checkStock1.stock
        }
      } else {
        const checkStock = this.filterProducts.find((x: any) => x.id == salesOrderItem.value.productId)
        if (salesOrderItem.value.quantity > checkStock.stock) {
          this.toastrService.warning('Product is no more available in the stock')
          salesOrderItem.value.quantity = checkStock.stock
        }
      }

      let salesOrderItems: SalesOrderItem[] =
        this.salesOrderForm.get('salesOrderItems').value;

      const existingProductIndex = salesOrderItems.findIndex(
        (c) => c.productId == salesOrderItem.value.productId
      );

      this.salesOrderItemsArray
        .at(existingProductIndex)
        .get('quantity')
        .patchValue(salesOrderItem.value.quantity);

    }

  }

  quantityCheck(e: any, salesOrderItem: any) {
    this.onQuantityChange(salesOrderItem)

  }

  onDiscountChange() {
    this.getAllTotal();
  }

  onTaxSelectionChange() {
    this.getAllTotal();
  }

  onRemoveSalesOrderItem(index: number) {
    this.salesOrderItemsArray.removeAt(index);
    this.getAllTotal();
  }

  getNewSalesOrderNumber() {
    this.salesOrderService.getNewSalesOrderNumber().subscribe((salesOrder) => {
      if (!this.salesOrder) {
        this.salesOrderForm.patchValue({
          orderNumber: salesOrder.orderNumber,
        });
      }
    });
  }

  customerNameChangeValue() {
    this.sub$.sink = this.salesOrderForm
      .get('filerCustomer')
      .valueChanges.pipe(
        tap((c) => (this.isCustomerLoading = true)),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((c) => {
          this.customerResource.customerName = c;
          this.customerResource.id = null;
          return this.customerService.getCustomers(this.customerResource);
        })
      )
      .subscribe(
        (resp: HttpResponse<Customer[]>) => {
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
        },
        (err) => {
          this.isCustomerLoading = false;
        }
      );
  }

  getCustomers() {
    if (this.salesOrder) {
      this.customerResource.id = this.salesOrder.customerId;
    } else {
      this.customerResource.customerName = '';
      this.customerResource.id = null;
    }
    this.customerService
      .getCustomers(this.customerResource)
      .subscribe((resp) => {
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

  getWalkinCustomer() {
    this.customerService.getWalkInCustomer().subscribe((c) => {
      if (c) {
        this.customers.push(c);
        this.salesOrderForm.get('customerId').setValue(c.id);
      }
    });
  }

  onSaveAndNew() {
    this.onSalesOrderSubmit(true);
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
              this.router.navigate(['/pos']);
              this.ngOnInit();
            } else {
              this.paymentsForm.salesOrderId = c.id;
              this.paymentsForm.amount = Math.round(c.totalAmount);
              this.paymentsForm.paymentMethod = this.paymentselect;
              this.saveSalesOrderPayment(c);
              //this.router.navigate(['/sales-order/list']);
            }
          });
      }
    }
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

  saveSalesOrderPayment(c: any): void {
    const salesOrderpayment: SalesOrderPayment = this.paymentsForm;
    this.salesOrderPaymentService.addSalesOrderPayments(salesOrderpayment).subscribe(() => {
      this.getSalesOrderById(c.id);
    });
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


  reloadCurrentRoute() {
    let currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  buildSalesOrder() {
    const salesOrder: SalesOrder = {
      id: this.salesOrder ? this.salesOrder.id : '',
      orderNumber: this.salesOrderForm.get('orderNumber').value,
      deliveryDate: this.salesOrderForm.get('deliveryDate').value,
      deliveryStatus: DeliveryStatusEnum.UnDelivery,
      isSalesOrderRequest: false,
      utrNo: '',
      mobileNo: '',
      offlineMode: '',
      onlineOffline: '',
      counterId: this.counterIdValue,
      soCreatedDate: this.salesOrderForm.get('soCreatedDate').value,
      salesOrderStatus: SalesOrderStatusEnum.Not_Return,
      customerId: this.salesOrderForm.get('customerId').value,
      totalAmount: this.grandTotal,
      totalDiscount: this.totalDiscount,
      totalTax: this.totalTax,
      note: this.salesOrderForm.get('note').value,
      termAndCondition: this.salesOrderForm.get('termAndCondition').value,
      salesOrderItems: [],
      IsAdvanceOrderRequest: this.partyOrderChecked,
      deliveryCharges: 0,
      isAppOrderRequest: false,
      productMainCategoryId: this.setMainCategoryId
    };

    if (localStorage.getItem('nonCSDCanteensId') == 'f7c14269-2a89-4f89-0b8d-08dbde8dbe73') {
      salesOrder.productMainCategoryId = '06c71507-b6de-4d59-de84-08dbeb3c9568';
    } else if (localStorage.getItem('nonCSDCanteensId') == 'edd642e5-66ec-4c96-ae21-d4d75c90f1dd') {
      salesOrder.productMainCategoryId = 'afc982ac-5e05-4633-99fb-08dbe76cdb9b';
    }

    const salesOrderItems = this.salesOrderForm.get('salesOrderItems').value;
    if (salesOrderItems && salesOrderItems.length > 0) {
      salesOrderItems.forEach((so) => {
        salesOrder.salesOrderItems.push({
          discount: parseFloat(
            this.quantitiesUnitPriceTaxPipe.transform(
              so.quantity,
              so.unitPrice,
              so.discountPercentage
            )
          ),
          discountPercentage: so.discountPercentage,
          productId: so.productId,
          unitId: so.unitId,
          quantity: so.quantity,
          warehouseId: so.warehouseId,
          taxValue: parseFloat(
            this.quantitiesUnitPriceTaxPipe.transform(
              so.quantity,
              so.unitPrice,
              so.discountPercentage,
              so.taxValue,
              this.taxsMap[0]
            )
          ),
          unitPrice: parseFloat(so.unitPrice),
          salesOrderItemTaxes: so.taxValue
            ? [
              ...so.taxValue.map((element) => {
                const salesOrderItemTaxes: SalesOrderItemTax = {
                  taxId: element,
                };
                return salesOrderItemTaxes;
              }),
            ]
            : [],
        });
      });
    }
    return salesOrder;
  }

  onSalesOrderList() {
    this.router.navigate(['/']);
  }

  checkPartyOrder() {
    const partyRadio = document.getElementById('party') as HTMLInputElement;

    if (partyRadio.checked) {
      this.partyOrderChecked = true
    }

    else if (this.partyOrderChecked == true && this.salesOrderItemsArray.value.length > 0) {
      partyRadio.checked = true
      Swal.fire({
        title: "Selected products will be removed !",
        showCancelButton: true,
        confirmButtonText: "Ok"
      }).then((result) => {
        if (result.isConfirmed) {
          this.salesOrderItemsArray.clear();
          this.partyOrderChecked = false
          partyRadio.checked = false
        } else if (result.isDenied) {
          this.partyOrderChecked = true
          partyRadio.checked = true
        }
      });
    }

    else {
      this.partyOrderChecked = false
    }

  }

}
