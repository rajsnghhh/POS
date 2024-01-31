import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { CommonDialogService } from '@core/common-dialog/common-dialog.service';
import { TranslationService } from '@core/services/translation.service';
import { BaseComponent } from 'src/app/base.component';
import { ManageImageComponent } from './manage-image/manage-image.component';
import { BannerImage, CategoryImage, LoginImage } from '@core/domain-classes/image-upload';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '@core/services/common.service';
import { CommonError } from '@core/error-handler/common-error';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent extends BaseComponent implements OnInit {

  bannerImage: BannerImage[] = [];
  loginImage: LoginImage[] = [];
  categoryImage: CategoryImage[] = [];

  @Input() loading: boolean = false;

  displayedColumns: string[] = ['action', 'Name','images'];
  footerToDisplayed = ['footer'];
  baseUrl = environment.apiUrl;

  constructor(
    private dialog: MatDialog,
    private commonDialogService: CommonDialogService,
    public translationService: TranslationService,
    public toastrService:ToastrService,
    public commonService:CommonService
  ) {
    super(translationService);
    this.getLangDir();
  }

  ngOnInit(): void {
    this.getBannerImage();
    this.getCategoryImage();
    this.getLoginImage();
  }

  deleteBannerImage(deleteImage: any,bannerType:any): void {
    const areU = this.translationService.getValue('ARE_YOU_SURE_YOU_WANT_TO_DELETE');
    this.sub$.sink = this.commonDialogService.deleteConformationDialog(`${areU} ${bannerType} Image`)
      .subscribe(isTrue => {
        if (isTrue) {
          if(bannerType=='Banner'){
            this.commonService.delectBannerImage(deleteImage.id).subscribe(data=>{
            this.toastrService.success('Banner Image Deleted Successfully');
            this.getBannerImage();
            })
          }else if(bannerType=='Category'){
            this.commonService.delectCategoryImage(deleteImage.id).subscribe(data=>{
              this.toastrService.success('Category Image Deleted Successfully');
              this.getCategoryImage();
              })
          }else if(bannerType=='Login'){
            this.commonService.delectLoginImage(deleteImage.id).subscribe(data=>{
              this.toastrService.success('LogIn Banner Deleted Successfully');
              this.getLoginImage();
              })
          }
        }
      });
  }

  manageImage(bannerType: any): void {
   const dialogRef = this.dialog.open(ManageImageComponent, {
      width: '350px',
      direction:this.langDir,
      data:bannerType
    });
    this.sub$.sink = dialogRef.afterClosed()
    .subscribe(data => {
      this.getBannerImage();
      this.getCategoryImage();
      this.getLoginImage();
    });
  }

  getBannerImage(): void {
    this.loading = true;
    this.commonService.getBannerImage()
      .subscribe(data => {
        this.loading = false;
        let body:any=data
        this.bannerImage = body.data;
      });
  }
  getLoginImage(): void {
    this.loading = true;
    this.commonService.getLoginImage()
      .subscribe(data => {
        this.loading = false;
        let body:any=data
        this.loginImage = body.data;
      });
  }
  getCategoryImage(): void {
    this.loading = true;
    this.commonService.getCategoryImage()
      .subscribe(data => {
        this.loading = false;
        let body:any=data
        this.categoryImage = body.data;
      });
  }


}
