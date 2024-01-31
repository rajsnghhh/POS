import { Component,Input, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { BrandService } from '@core/services/brand.service';
import { Observable } from 'rxjs';
import { Batch } from '@core/domain-classes/tax';
import { tap } from 'rxjs/operators';
import { TranslationService } from '@core/services/translation.service';
import { BaseComponent } from '../base.component';


@Component({
  selector: 'app-batch',
  templateUrl: './batch.component.html',
  styleUrls: ['./batch.component.scss']
})
export class BatchComponent extends BaseComponent implements OnInit {

  loading$: Observable<boolean>;
  batches: Batch[] = [
    { id:'1',
      batchno:'1'
    },
    { id:'2',
      batchno:'2'
    },
    { id:'3',
      batchno:'3'
    },
    { id:'4',
      batchno:'4'
    },
    { id:'5',
      batchno:'5'
    },
  ];
  

  batchForm: UntypedFormGroup;
  @Input() loading: boolean = false;
  displayedColumns: string[] = ['action','srNo', 'batchno'];

  constructor(
    private fb: UntypedFormBuilder,
    private brandService: BrandService,
    public translationService: TranslationService
    
  ) { 
    super(translationService);
    this.getLangDir();
  }

  ngOnInit(): void {
    this.loading$ = this.brandService.loaded$
    .pipe(
      tap(loaded => {
        if (!loaded) {
          //this.getBrands();
        }
      })
    )
  // this.brands$ = this.brandService.entities$
  
  this.createForm();
  }

  createForm() {
    this.batchForm = this.fb.group({
      batchno: ['', Validators.required]
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
