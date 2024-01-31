import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { BrandService } from '@core/services/brand.service';
import { TranslationService } from '@core/services/translation.service';

@Component({
  selector: 'app-batch-assign',
  templateUrl: './batch-assign.component.html',
  styleUrls: ['./batch-assign.component.scss']
})
export class BatchAssignComponent implements OnInit {


  batchForm: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    private brandService: BrandService,
    public translationService: TranslationService
  ) { 
    
  }

  ngOnInit(): void {
    this.createForm();
  }

  createForm() {
    this.batchForm = this.fb.group({ 
      pname: ['', Validators.required],
      batchno: ['', Validators.required],
      packdate:[''],
      expdate:[''],
      purchaserate:[''],
      mrp:[''],
      percentage:[''],
      salerate:['']
    });
  }
  onCancel(): void {
    this.batchForm.reset();
  }

  saveBrand(): void {
    if (!this.batchForm.valid) {
      this.batchForm.markAllAsTouched();
      return;
    }
    // const brand: Brand = this.brandForm.value;
    // brand.imageUrlData = this.imgSrc;
    // brand.isImageChanged = this.isImageUpload;

    // if (this.data.id) {
    //   this.brandService.update(brand).subscribe(() => {
    //     this.toastrService.success(this.translationService.getValue('BRAND_SAVED_SUCCESSFULLY'));
    //     this.dialogRef.close();
    //   });
    // } else {
    //   this.brandService.add(brand).subscribe(() => {
    //     this.toastrService.success(this.translationService.getValue('BRAND_SAVED_SUCCESSFULLY'));
    //     this.dialogRef.close();
    //   });
    // }
  }

}
