import { HttpResponse } from '@angular/common/http';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Product } from '@core/domain-classes/product';
import { ProductResourceParameter } from '@core/domain-classes/product-resource-parameter';
import { Supplier } from '@core/domain-classes/supplier';
import { SupplierResourceParameter } from '@core/domain-classes/supplier-resource-parameter';
import { Tax } from '@core/domain-classes/tax';
import { Unit } from '@core/domain-classes/unit';
import { CommonService } from '@core/services/common.service';
import { TaxService } from '@core/services/tax.service';
import { TranslationService } from '@core/services/translation.service';
import { QuantitiesUnitPriceTaxPipe } from '@shared/pipes/quantities-unitprice-tax.pipe';
import { QuantitiesUnitPricePipe } from '@shared/pipes/quantities-unitprice.pipe';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/base.component';
import { ProductService } from 'src/app/product/product.service';
import { SupplierService } from 'src/app/supplier/supplier.service';
import { PurchaseOrderService } from '../purchase-order.service';
import { PurchaseOrder } from '@core/domain-classes/purchase-order';
import { DeliveryStatusEnum } from '@core/domain-classes/delivery-status-enum';
import { PurchaseOrderStatusEnum } from '@core/domain-classes/purchase-order-status';
import { PurchaseOrderItemTax } from '@core/domain-classes/purchase-order-item-tax';
import { PurchaseOrderItem } from '@core/domain-classes/purchase-order-item';
import { PurchaseOrderResourceParameter } from '@core/domain-classes/purchase-order-resource-parameter';
import { ResponseHeader } from '@core/domain-classes/response-header';
import { ClonerService } from '@core/services/clone.service';
import { UnitConversationService } from 'src/app/unit-conversation/unit-conversation.service';
import { UnitConversation } from '@core/domain-classes/unit-conversation';
import { Operators } from '@core/domain-classes/operator';
import { WarehouseService } from '@core/services/warehouse.service';
import { Warehouse } from '@core/domain-classes/warehouse';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-add-grn',
  templateUrl: './add-grn.component.html',
  styleUrls: ['./add-grn.component.scss'],
  viewProviders: [QuantitiesUnitPricePipe, QuantitiesUnitPriceTaxPipe],

})
export class AddGrnComponent extends BaseComponent {

  taxes$: Observable<Tax[]>;
  purchaseOrderForm: UntypedFormGroup;
  products: Product[] = [];
  suppliers: Supplier[] = [];
  warehouseList: Warehouse[] = [];
  supplierResource: SupplierResourceParameter;
  productResource: ProductResourceParameter;
  isLoading: boolean = false;
  isSupplierLoading: boolean = false;
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
  purchaseOrder: PurchaseOrder;
  isEdit: boolean = false;
  purchaseOrderRequestList: PurchaseOrder[] = [];
  purchaseOrderResource: PurchaseOrderResourceParameter;
  deliverStatus:any='3';
  showFileName:any;
  inavlidData:any;
  @ViewChild('editModal') editModal: TemplateRef<any>;


  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private supplierService: SupplierService,
    private toastrService: ToastrService,
    private purchaseOrderService: PurchaseOrderService,
    private router: Router,
    public translationService: TranslationService,
    private commonService: CommonService,
    private taxService: TaxService,
    private productService: ProductService,
    private route: ActivatedRoute,
    private quantitiesUnitPricePipe: QuantitiesUnitPricePipe,
    private quantitiesUnitPriceTaxPipe: QuantitiesUnitPriceTaxPipe,
    private warehouseService: WarehouseService,

  ) {
    super(translationService);
    this.getLangDir();
    this.supplierResource = new SupplierResourceParameter();
    this.productResource = new ProductResourceParameter();
    this.purchaseOrderResource = new PurchaseOrderResourceParameter();
    this.purchaseOrderResource.pageSize = 50;
    this.purchaseOrderResource.orderBy = 'poCreatedDate asc';
    this.purchaseOrderResource.isPurchaseOrderRequest = true;
  }

  ngOnInit(): void {
    this.unitConversationlist = [... this.route.snapshot.data['units']];
    this.warehouseList = [... this.route.snapshot.data['warehouses']];
    this.createPurchaseOrder();
    this.getPurchaseOrderRequest();
    this.supplierNameChangeValue();
    this.getPurchaseOrderRequestList();
  }



  getPurchaseOrderRequestList() {
    this.purchaseOrderService.getAllPurchaseOrder(this.purchaseOrderResource)
      .subscribe((resp: HttpResponse<PurchaseOrder[]>) => {
        if (resp && resp.headers) {
          const paginationParam = JSON.parse(
            resp.headers.get('X-Pagination')
          ) as ResponseHeader;
          this.purchaseOrderRequestList = [...resp.body];
        }
      });

  }


  getPurchaseOrderRequest() {
    this.sub$.sink = this.route.queryParamMap.pipe(
      map((params: ParamMap) => params.get('purchase-order-requestId')),
    ).subscribe(c => {
      if (c)
        this.getPurchaseOrderRequestById(c)
    });
  }

  getPurchaseOrderRequestById(id: string) {
    this.purchaseOrderService.getPurchaseOrderById(id)
      .subscribe((c: PurchaseOrder) => {
        if (c) {
          this.purchaseOrderForm.patchValue({
            filerSupplier: '',
            deliveryDate: c.deliveryDate,
            poCreatedDate: c.poCreatedDate,
            deliveryStatus: c.deliveryStatus,
            supplierId: c.supplierId,
            note: c.note,
            termAndCondition: c.termAndCondition
          });
          this.supplierResource.id = c.supplierId;
          this.supplierService.getSuppliers(this.supplierResource)
            .subscribe(resp => {
              if (resp && resp.headers) {
                this.suppliers = [...resp.body];
              }
            });

        }
      });
  }


  createPurchaseOrder() {
    this.route.data
      .pipe(
    )
      .subscribe((purchaseOrderData: { 'purchaseorder': PurchaseOrder }) => {
        this.purchaseOrder = purchaseOrderData.purchaseorder;
        if (this.purchaseOrder) {
          this.isEdit = true;
          this.purchaseOrderForm = this.fb.group({
            filerSupplier: [''],
            invoiceNo: [this.purchaseOrder.invoiceNo],
            purchasePaymentType:[this.purchaseOrder.purchasePaymentType],
            deliveryDate: [this.purchaseOrder.deliveryDate, [Validators.required]],
            poCreatedDate: [this.purchaseOrder.poCreatedDate, [Validators.required]],
            deliveryStatus: [this.purchaseOrder.deliveryStatus],
            supplierId: [this.purchaseOrder.supplierId, [Validators.required]],
            note: [this.purchaseOrder.note],
            termAndCondition: [this.purchaseOrder.termAndCondition],
          });
          this.getSuppliers();
        } else {
          this.isEdit = false;
          this.getSuppliers();
          this.purchaseOrderForm = this.fb.group({
            filerSupplier: [''],
            invoiceNo: [''],
            purchasePaymentType:['', [Validators.required]],
            deliveryDate: [new Date(), [Validators.required]],
            poCreatedDate: [new Date(), [Validators.required]],
            deliveryStatus: [1],
            supplierId: ['', [Validators.required]],
            fileDetails:['', [Validators.required]],
            note: [''],
            termAndCondition: [''],
          });
        }

      });
  }

  createPurchaseOrderItemPatch(index: number, purchaseOrderItem: PurchaseOrderItem) {
    const taxs = purchaseOrderItem.purchaseOrderItemTaxes.map(c => c.taxId);
    const formGroup = this.fb.group({
      productId: [purchaseOrderItem.productId, [Validators.required]],
      filterProductValue: [''],
      unitPrice: [purchaseOrderItem.unitPrice, [Validators.required]],
      quantity: [purchaseOrderItem.quantity, [Validators.required]],
      taxValue: [taxs],
      unitId: [purchaseOrderItem.unitId, [Validators.required]],
      warehouseId: [purchaseOrderItem.warehouseId],
      discountPercentage: [purchaseOrderItem.discountPercentage]
    });

    this.unitsMap[index] = this.unitConversationlist.filter(c => c.id == purchaseOrderItem.product.unitId || c.parentId == purchaseOrderItem.product.unitId);;
    this.taxsMap[index] = [... this.route.snapshot.data['taxs']];
    this.warehouseMap[index] = this.warehouseList;
    this.filterProductsMap[index.toString()] = [purchaseOrderItem.product];
    return formGroup;
  }

  createPurchaseOrderItem(index: number) {
    const formGroup = this.fb.group({
      productId: ['', [Validators.required]],
      filterProductValue: [''],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      taxValue: [null],
      unitId: ['', [Validators.required]],
      warehouseId: [''],
      discountPercentage: [0, [Validators.min(0)]]
    });
    this.taxsMap[index] = [... this.route.snapshot.data['taxs']];
    this.warehouseMap[index] = this.warehouseList;
    this.filterProductsMap[index.toString()] = [...this.route.snapshot.data['products']];
    return formGroup;
  }


  setUnitConversationForProduct(id: string, index: number) {
    this.unitsMap[index] = this.unitConversationlist.filter(c => c.id == id || c.parentId == id);
  }

  setWarehouseForProduct(id: string, index: number) {

    this.warehouseMap[index] = id  ? this.warehouseList.filter(c => c.id == id) : this.warehouseList;
  }


  supplierNameChangeValue() {
    this.sub$.sink = this.purchaseOrderForm.get('filerSupplier').valueChanges
      .pipe(
        tap(c => this.isSupplierLoading = true),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(c => {
          this.supplierResource.supplierName = c;
          this.supplierResource.id = null;
          return this.supplierService.getSuppliers(this.supplierResource);
        })
      ).subscribe((resp: HttpResponse<Supplier[]>) => {
        this.isSupplierLoading = false;
        if (resp && resp.headers) {
          this.suppliers = [...resp.body];
        }
      }, (err) => {
        this.isSupplierLoading = false;
      });
  }

  getSuppliers() {

    if (this.purchaseOrder) {
      this.supplierResource.id = this.purchaseOrder.supplierId;
    } else {
      this.supplierResource.supplierName = '';
      this.supplierResource.id = null;
    }
    this.supplierService.getSuppliers(this.supplierResource)
      .subscribe(resp => {
        if (resp && resp.headers) {
          this.suppliers = [...resp.body];
        }
      });
  }

  onPurchaseOrderSubmit() {

    if (!this.purchaseOrderForm.valid) {
      this.purchaseOrderForm.markAllAsTouched();
    } else {
      this.isLoading = true;

      var formValue = new FormData();
      if (this.showFileName != '') {
        formValue.append('fileDetails', this.showFileName, this.showFileName['name']);
        formValue.append('invoiceNo',this.purchaseOrderForm.get('invoiceNo').value);
        formValue.append('purchasePaymentType',this.purchaseOrderForm.get('purchasePaymentType').value);
        formValue.append('deliveryStatus',this.deliverStatus);
        formValue.append('deliveryDate', new Date(this.purchaseOrderForm.get('deliveryDate').value).toUTCString());
        formValue.append('poCreatedDate',new Date(this.purchaseOrderForm.get('poCreatedDate').value).toUTCString());
        formValue.append('isPurchaseOrderRequest','false');
        formValue.append('purchaseOrderStatus',PurchaseOrderStatusEnum.Not_Return.toString());
        formValue.append('supplierId',this.purchaseOrderForm.get('supplierId').value);
        formValue.append('note',this.purchaseOrderForm.get('note').value);
        formValue.append('termAndCondition',this.purchaseOrderForm.get('termAndCondition').value);
        }

        this.purchaseOrderService.uploadGRN(formValue)
          .subscribe((c: PurchaseOrder) => {
            this.isLoading = false;
             var statusValue:any=c.status;
            if(statusValue==false){
              this.inavlidData=c.data;
              this.modalService.open(this.editModal, { size: 'xl' });
            }else{
            this.toastrService.success(this.translationService.getValue('PURCHASE_ORDER_ADDED_SUCCESSFULLY'));
            this.router.navigate(['/purchase-order/list']);
            }
          }, (err) => {
            this.isLoading = false;
          });
    }
  }

  closeModal(){
    this.modalService.dismissAll();
    window.location.reload();
  }

  uploadFile(event: any) {
    const fileInput = event.target as HTMLInputElement;
    if(fileInput.files[0].type=='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'){
      this.showFileName = fileInput?.files[0];
    }else{
      this.toastrService.error('Please Upload the downloaded Excel File');
    }
  }

  buildPurchaseOrder() {

    const purchaseOrder: PurchaseOrder = {
      id: this.purchaseOrder ? this.purchaseOrder.id : '',
      orderNumber:'',
      PurchaseOrderPaymentStatus:'',
      PurchaseOrderReturnType:'',
      invoiceNo: this.purchaseOrderForm.get('invoiceNo').value,
      purchasePaymentType:this.purchaseOrderForm.get('purchasePaymentType').value,
      deliveryStatus: this.deliverStatus,
      deliveryDate: this.purchaseOrderForm.get('deliveryDate').value,
      isPurchaseOrderRequest: false,
      poCreatedDate: this.purchaseOrderForm.get('poCreatedDate').value,
      purchaseOrderStatus: PurchaseOrderStatusEnum.Not_Return,
      supplierId: this.purchaseOrderForm.get('supplierId').value,
      totalAmount: this.grandTotal,
      totalSaleAmount:0,
      batchNo:'',
      totalDiscount: this.totalDiscount,
      totalTax: this.totalTax,
      note: this.purchaseOrderForm.get('note').value,
      termAndCondition: this.purchaseOrderForm.get('termAndCondition').value,
      purchaseOrderItems: [],
    };
    return purchaseOrder;
  }

}
