import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../notification.service';
import { CommonService } from '@core/services/common.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslationService } from '@core/services/translation.service';
import { BaseComponent } from 'src/app/base.component';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { CustomerResourceParameter } from '@core/domain-classes/customer-resource-parameter';
import { CustomerService } from 'src/app/customer/customer.service';

@Component({
  selector: 'app-add-push-notification',
  templateUrl: './add-push-notification.component.html',
  styleUrls: ['./add-push-notification.component.scss']
})
export class AddPushNotificationComponent extends BaseComponent implements OnInit {

  notificationForm: UntypedFormGroup;
  isLoading = false;
  @ViewChild('select') select: MatSelect;
  customerResource: CustomerResourceParameter;


  allSelected = false;
  customers: any;

  constructor(private fb: UntypedFormBuilder,
    private notificationService: NotificationService,
    private commonService: CommonService,
    private toastrService: ToastrService,
    private route: Router,
    private customerService: CustomerService,
    private activatedRoute: ActivatedRoute,
    public translationService: TranslationService) {
    super(translationService);
    this.getLangDir();
    this.customerResource = new CustomerResourceParameter();

  }

  ngOnInit(): void {
    this.createNotificationForm();
    this.getCustomers();
  }

  createNotificationForm() {
    this.notificationForm = this.fb.group({
      title: ['', [Validators.required]],
      body: ['', [Validators.required]],
      deviceToken:['']
    });
  }

  getCustomers() {

    this.customerService
      .getCustomers(this.customerResource)
      .subscribe((resp) => {
        if (resp && resp.headers) {
          this.customers = [...resp.body];
        }
      });
  }

  createNotification() {
    if (this.notificationForm.valid) {
  
      console.log(this.select.value.filter(function (el) {return el != null;}).toString().replace(null, ''));

      let payload={
        title:this.notificationForm.value.title,
        body:this.notificationForm.value.body,
        deviceToken:this.select.value.filter(function (el) {return el != null;}).toString().replace(null, '')
      }
      this.notificationService.addPushNotification(payload).subscribe(data => {
        console.log(data);
        this.toastrService.success('Push Notification Added Successfully');
      })

    } else {
      this.markFormGroupTouched(this.notificationForm);
    }
  }

  private markFormGroupTouched(formGroup: UntypedFormGroup) {
    (<any>Object).values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control.controls) {
        this.markFormGroupTouched(control);
      }
    });
  }

  toggleAllSelection() {
    if (this.allSelected) {
      this.select.options.forEach((item: MatOption) => item.select());
    } else {
      this.select.options.forEach((item: MatOption) => item.deselect());
    }
  }
  optionClick() {
    let newStatus = true;
    this.select.options.forEach((item: MatOption) => {
      if (!item.selected) {
        newStatus = false;
      }
    });
    this.allSelected = newStatus;
  }

}
