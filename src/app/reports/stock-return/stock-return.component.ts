import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { PurchaseOrderResourceParameter } from '@core/domain-classes/purchase-order-resource-parameter';
import { PurchaseOrderService } from 'src/app/purchase-order/purchase-order.service';
import { dateCompare } from '@core/services/date-range';
import { SupplierResourceParameter } from '@core/domain-classes/supplier-resource-parameter';
import { BaseComponent } from 'src/app/base.component';
import { TranslationService } from '@core/services/translation.service';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { SupplierService } from 'src/app/supplier/supplier.service';
import { HttpResponse } from '@angular/common/http';
import { Supplier } from '@core/domain-classes/supplier';
import { printDiv } from '../daily-grn-report/printDiv';


@Component({
  selector: 'app-stock-return',
  templateUrl: './stock-return.component.html',
  styleUrls: ['./stock-return.component.scss']
})
export class StockReturnComponent extends BaseComponent implements OnInit {

  purchaseOrderResource: PurchaseOrderResourceParameter;
  supplierResource: SupplierResourceParameter;

  searchForm: UntypedFormGroup;
  wasteDataSummery:any;
  returnDataSummery:any;
  expireDataSummery:any;
  totalExpireSummaryValue:any;
  totalWasteSummaryValue:any;
  totalReturnSummaryValue:any;
  suppliers:any;
  currentDate: Date= new Date();

  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private fb: UntypedFormBuilder,
    public translationService: TranslationService,
    private supplierService: SupplierService,

  ) {
    super(translationService);
    this.getLangDir();
    this.purchaseOrderResource = new PurchaseOrderResourceParameter();
    this.purchaseOrderResource.pageSize = 0;
    this.purchaseOrderResource.orderBy = 'poCreatedDate asc';
    this.purchaseOrderResource.isPurchaseOrderRequest = false;
    this.purchaseOrderResource.status = 1;
    this.supplierResource = new SupplierResourceParameter();
    this.supplierResource.pageSize=0;
   }

  ngOnInit(): void {
    this.createSearchFormGroup();
    this.getSupplierList();
    this. getSupplierByNameValue();
    this.getData();
  }

  getData(){
    this.purchaseOrderResource.PurchaseOrderReturnType = 'Wastage'
    this.purchaseOrderService.getAllWasteReturn(this.purchaseOrderResource).subscribe(wasteval=>{
    this.wasteDataSummery = wasteval.body;
    this.totalWasteSummary(wasteval.body);
    })
    this.purchaseOrderResource.PurchaseOrderReturnType = 'Return'
    this.purchaseOrderService.getAllWasteReturn(this.purchaseOrderResource).subscribe(returnval=>{
    this.returnDataSummery = returnval.body;
    this.totalReturnSummary(returnval.body);  
    })
    this.purchaseOrderResource.PurchaseOrderReturnType = 'Expire'
    this.purchaseOrderService.getAllWasteReturn(this.purchaseOrderResource).subscribe(expireval=>{
    this.expireDataSummery = expireval.body;
    this.totalExpireSummary(expireval.body);
    })
  }

  createSearchFormGroup(){
    this.searchForm= this.fb.group({
      fromDate:[''],
      toDate:[''],
      filterSupplierValue:[''],
      supplierId:['']
    },{
      validators: dateCompare()
    });
  }

  onSearch(){
    if( this.searchForm.valid){
     this.purchaseOrderResource.fromDate= this.searchForm.get('fromDate').value;
     this.purchaseOrderResource.toDate= this.searchForm.get('toDate').value;
     this.purchaseOrderResource.supplierId = this.searchForm.get('supplierId').value;
     this.getData();
    }
   }
 
   onClear(){
     this.searchForm.reset();
     this.purchaseOrderResource.fromDate= this.searchForm.get('fromDate').value;
     this.purchaseOrderResource.toDate= this.searchForm.get('toDate').value;
     this.purchaseOrderResource.supplierId = this.searchForm.get('supplierId').value;
     this.getData();
   }

  getSupplierByNameValue() {
    this.sub$.sink = this.searchForm.get('filterSupplierValue').valueChanges
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

  getSupplierList(){
    this.supplierService.getSuppliers(this.supplierResource)
      .subscribe(resp => {
        if (resp && resp.headers) {
          this.suppliers = [...resp.body];
        }
      });
  }

  totalExpireSummary(totalExpiresummery: any) {
    let totalExpireValue = 0
    for (let expire of totalExpiresummery) {
      totalExpireValue = totalExpireValue + expire.totalAmount;
    }
    this.totalExpireSummaryValue = totalExpireValue;

  }

  totalWasteSummary(totalwasteValue: any) {
    let totalWasteData = 0
    for (let waste of totalwasteValue) {
      totalWasteData = totalWasteData + waste.totalAmount;
    }
    this.totalWasteSummaryValue = totalWasteData;
  }

  totalReturnSummary(totalReturnValue: any) {
    let totalReturnData = 0
    for (let returnData of totalReturnValue) {
      totalReturnData = totalReturnData + returnData.totalAmount;
    }
    this.totalReturnSummaryValue = totalReturnData;
  }

  PrintBtnClick() {
    printDiv('registration');
  };

}
