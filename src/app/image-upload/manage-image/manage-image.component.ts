import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Country } from '@core/domain-classes/country';
import { CommonService } from '@core/services/common.service';
import { CountryService } from '@core/services/country.service';
import { TranslationService } from '@core/services/translation.service';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';

@Component({
  selector: 'app-manage-image',
  templateUrl: './manage-image.component.html',
  styleUrls: ['./manage-image.component.scss']
})
export class ManageImageComponent extends BaseComponent implements OnInit {

  isEdit: boolean = false;
  productImgSrc: any = null;
  countryForm: UntypedFormGroup;
  constructor(
    public dialogRef: MatDialogRef<ManageImageComponent>,
    @Inject(MAT_DIALOG_DATA) public imageType: any,
    private toastrService: ToastrService,
    public commonService: CommonService,
    private fb: UntypedFormBuilder,
    public translationService: TranslationService) {
    super(translationService);
  }

  ngOnInit(): void {
    this.createForm();
  }

  createForm() {
    this.countryForm = this.fb.group({
      name: ['', Validators.required],
      loginimage: ['', Validators.required],
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
  onBannerImageSelect($event) {
    const fileSelected = $event.target.files[0];
    if (!fileSelected) {
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(fileSelected);
    reader.onload = (_event) => {
      this.productImgSrc = reader.result;
    }
  }

  saveCountry(): void {
    if (!this.countryForm.valid) {
      this.countryForm.markAllAsTouched();
      return;
    }

    let param = {
      name: this.countryForm.value.name,
      isImageChanged: true,
      imageUrlData: this.productImgSrc
    }

    if (this.imageType == 'Login') {
      this.commonService.addLoginImage(param).subscribe(data => {
        this.toastrService.success(this.translationService.getValue('Login Image added Successfully'));
        this.dialogRef.close();
      })
    } else if (this.imageType == 'Category') {
      this.commonService.addCategoryImage(param).subscribe(data => {
        this.toastrService.success(this.translationService.getValue('Category Image added Successfully'));
        this.dialogRef.close();
      })
    } else if (this.imageType == 'Banner') {
      this.commonService.addBannerImage(param).subscribe(data => {
        this.toastrService.success(this.translationService.getValue('Banner Image added Successfully'));
        this.dialogRef.close();
      })
    }

  }

}
