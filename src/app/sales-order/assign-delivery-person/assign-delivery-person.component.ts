import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PaymentMethod } from '@core/domain-classes/payment-method';
import { SalesOrder } from '@core/domain-classes/sales-order';
import { DeliveryDetails, SalesOrderPayment } from '@core/domain-classes/sales-order-payment';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';
import { PurchaseOrderPaymentService } from 'src/app/purchase-order/purchase-order-payment.service';
import { SalesOrderPaymentService } from '../sales-order-payment.service';
import { User } from '@core/domain-classes/user';
import { UserResource } from '@core/domain-classes/user-resource';
import { UserDataSource } from 'src/app/user/user-list/user-datasource';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { RoleService } from 'src/app/role/role.service';



@Component({
  selector: 'app-assign-delivery-person',
  templateUrl: './assign-delivery-person.component.html',
  styleUrls: ['./assign-delivery-person.component.scss']
})
export class AssignDeliveryPersonComponent extends BaseComponent implements OnInit {
  paymentMethodslist: PaymentMethod[] = [];
  paymentsForm: UntypedFormGroup;
  isReceiptDeleted = false;
  users: User[] = [];
  userResource: UserResource;
  dataSource: UserDataSource;
  userData:any;
  previousData:any;

  constructor(
    private roleService: RoleService,
    public dialogRef: MatDialogRef<AssignDeliveryPersonComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SalesOrder,
    private salesOrderPaymentService: SalesOrderPaymentService,
    private purchaseOrderPaymentService: PurchaseOrderPaymentService,
    private toastrService: ToastrService,
    private fb: UntypedFormBuilder,
    public translationService: TranslationService) {
    super(translationService);
    this.getLangDir();
    this.userResource = new UserResource();
    this.userResource.pageSize = 100;
  }

  ngOnInit(): void {
    this.getUser();
    this.createForm();
    this.previousData=this.data
    if (this.data.id) {
     this.paymentsForm.get('deliveryPersonId').setValue(this.previousData.assignDeliveryPersonId);
    }
  }

  getUser() {
    let userResource="f1944eef-0c32-49fb-8f06-e5281a3bf61b"
    this.roleService.getRoleUsers(userResource).pipe(
      catchError(() => of([])))
      .subscribe(resp => {
        this.userData=resp;
      });
  }

  createForm() {
    this.paymentsForm = this.fb.group({
      deliveryPersonId: [0, Validators.required],
      salesOrderId:[this.data.id]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

   saveSalesOrderPayment(): void {
    if (!this.paymentsForm.valid) {
      this.paymentsForm.markAllAsTouched();
      return;
    }
    const deliveryDetails: DeliveryDetails = this.paymentsForm.value;
    if (this.data.id) {
      this.salesOrderPaymentService.assignDeliveryPerson(deliveryDetails).subscribe(() => {
        this.toastrService.success('Delivery assign Successfully');
        this.dialogRef.close(true);
      });
    }
  }

}
