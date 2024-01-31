import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginPageBanners } from '@core/domain-classes/product-category';
import { HttpClient } from '@microsoft/signalr';
import { EntityCollectionServiceBase, EntityCollectionServiceElementsFactory } from '@ngrx/data';


@Injectable({ providedIn: 'root' })
export class ImageUploadService extends EntityCollectionServiceBase<LoginPageBanners>  {

  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory,
    private httpClient: HttpClient) {
    super('LoginPageBanners', serviceElementsFactory);
  }

  // getSubCategories(id: string) {
  //   const customParams = new HttpParams()
  //     .set('Id', id)
  //   const url = `ProductCategories`;
  //   return this.httpClient.get<LoginPageBanners[]>(url, {
  //     params: customParams
  //   });
  // }

  // getFormulaTag(req: any): Observable<any> {
  //   const url = API_CONFIG.FORMULLA_TAG + req.toString();
  //   return this.HTTP.get(url);
  // }

  // getAllCategoriesForDropDown() {
  //   const customParams = new HttpParams()
  //   const url = `LoginPageBanners`;
  //   return this.httpClient.get<LoginPageBanners[]>(url, {
  //     params: customParams
  //   });
  // }
}