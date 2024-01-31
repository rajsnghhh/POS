import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SalesOrder } from '@core/domain-classes/sales-order';
import { BaseComponent } from 'src/app/base.component';
import { RoleService } from 'src/app/role/role.service';
import { SalesOrderPaymentService } from '../sales-order-payment.service';
import { PurchaseOrderPaymentService } from 'src/app/purchase-order/purchase-order-payment.service';
import { ToastrService } from 'ngx-toastr';
import { TranslationService } from '@core/services/translation.service';
import { DeliveryDetails } from '@core/domain-classes/sales-order-payment';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-order-status',
  templateUrl: './order-status.component.html',
  styleUrls: ['./order-status.component.scss']
})
export class OrderStatusComponent extends BaseComponent implements OnInit {

  orderStatus: any = [
    { status: 'Order Placed' },
    { status: 'Shipped' },
    { status: 'Out for Delivery' },
    { status: 'Delivered' },
  ]
  currentStatus: any = 0;
  orderForm: UntypedFormGroup;
  queryParam: any;


  constructor(
    public dialogRef: MatDialogRef<OrderStatusComponent>,
    private roleService: RoleService,
    @Inject(MAT_DIALOG_DATA) public data: SalesOrder,
    private salesOrderPaymentService: SalesOrderPaymentService,
    private purchaseOrderPaymentService: PurchaseOrderPaymentService,
    private toastrService: ToastrService,
    private fb: UntypedFormBuilder,
    public translationService: TranslationService) {
    super(translationService);
    this.getLangDir();
  }

  previousData: any = this.data;

  ngOnInit(): void {
    this.changeindexStatus();
    this.createForm();
  }

  changeindexStatus() {
    if (this.data.id) {
      for (const { index, value } of this.orderStatus.map((value, index) => ({ index, value }))) {
        if(value.status==this.previousData.orderDeliveryStatus){
          this.currentStatus=index;
        }
      }
    }
    if (this.currentStatus == 0) {
      this.queryParam = 'Order Placed'
    } else if (this.currentStatus == 1) {
      this.queryParam = 'Shipped'
    } else if (this.currentStatus == 2) {
      this.queryParam = 'Out for Delivery'
    } else if (this.currentStatus == 3) {
      this.queryParam = 'Delivered'
    }

  }

  statusChange(status: any, index: any) {
    this.currentStatus = index;
    this.queryParam = status.status;
    this.createForm();
  }

  createForm() {
    this.orderForm = this.fb.group({
      orderDeliveryStatus: [this.queryParam],
      salesOrderId: [this.data.id]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  orderStatusSave() {
    const deliveryDetails: DeliveryDetails = this.orderForm.value;
    if (this.data.id) {
      this.salesOrderPaymentService.assignDeliveryPerson(deliveryDetails).subscribe(() => {
        this.toastrService.success('Order Status Changed Successfully');
        this.dialogRef.close(true);
      });
    }
  }
}
