import { Component, Inject, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductCategory } from '@core/domain-classes/product-category';
import { ProductCategoryService } from '@core/services/product-category.service';
import { TranslationService } from '@core/services/translation.service';
import { environment } from '@environments/environment';
import { ToastrService } from 'ngx-toastr';
import { BaseComponent } from 'src/app/base.component';
import { SalesOrderService } from 'src/app/sales-order/sales-order.service';

@Component({
  selector: 'app-manage-product-category',
  templateUrl: './manage-product-category.component.html',
  styleUrls: ['./manage-product-category.component.scss']
})
export class ManageProductCategoryComponent extends BaseComponent implements OnChanges {
  isEdit: boolean = false;
  categoryImgSrc: any = null;
  isCategoryImageUpload = false;
  masterCategoryList: Array<any> = [];

  constructor(
    public dialogRef: MatDialogRef<ManageProductCategoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductCategory,
    private productCategoryService: ProductCategoryService,
    public translationService: TranslationService,
    private toastrService: ToastrService, private salesOrderService: SalesOrderService) {
    super(translationService);

    if (this.data.productCategoryUrl) {
      this.categoryImgSrc = `${environment.apiUrl}${this.data.productCategoryUrl}`;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      if (this.data.id) {        
        this.isEdit = true;
      }
    }
  }

  ngOnInit(): void {
    console.log(this.data);
    
    this.salesOrderService.getProductMainCategorList().subscribe((data: any) => {
      this.masterCategoryList = data.data;
    });

  }

  onCancel(): void {
    this.dialogRef.close();
  }

  saveCategory(): void {
    this.data.productCategoryUrl = this.categoryImgSrc;
    this.data.isImageChanged = this.isCategoryImageUpload;

    if (this.data.id) {
      this.productCategoryService.update(this.data).subscribe(c => {
        this.toastrService.success('Product Category Saved Successfully.');
        this.dialogRef.close(this.data);
      });
    } else {
      this.productCategoryService.add(this.data).subscribe(c => {
        this.toastrService.success('Product Category Saved Successfully.');
        this.dialogRef.close(this.data);
      });
    }
  }

  onCategoryImageSelect($event) {
    const fileSelected = $event.target.files[0];
    if (!fileSelected) {
      return;
    }
    const mimeType = fileSelected.type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(fileSelected);
    // tslint:disable-next-line: variable-name
    reader.onload = (_event) => {
      this.categoryImgSrc = reader.result;
      this.isCategoryImageUpload = true;
      $event.target.value = '';
    }
  }

  onCategoryImageRemove() {
    this.isCategoryImageUpload = true;
    this.categoryImgSrc = '';
  }
}

