import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Product } from '@core/domain-classes/product';
import { ProductResourceParameter } from '@core/domain-classes/product-resource-parameter';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private myValue: string;
  constructor(private http: HttpClient) { }

  getProducts(    
    resourceParams: ProductResourceParameter
  ): Observable<HttpResponse<Product[]>> {
    const url = 'product';
    const customParams = new HttpParams()

      .set('fields', resourceParams.fields)
      .set('orderBy', resourceParams.orderBy)
      .set('pageSize', resourceParams.pageSize.toString())
      .set('skip', resourceParams.skip.toString())
      .set('searchQuery', resourceParams.searchQuery)
      .set('name', resourceParams.name)
      .set('id', resourceParams.id)
      .set('categoryId', resourceParams.categoryId ? resourceParams.categoryId : '')
      .set('unitId', resourceParams.unitId ? resourceParams.unitId : '')
      .set('barcode', resourceParams.barcode ? resourceParams.barcode : '')
      .set('code', resourceParams.code ? resourceParams.code : '')
      .set('brandId', resourceParams.brandId ? resourceParams.brandId : resourceParams.brandId)
      .set('productMainCategoryId', resourceParams.productMainCategoryId ? resourceParams.productMainCategoryId : '');
    console.log(resourceParams);

    return this.http.get<Product[]>(url, {
      params: customParams,
      observe: 'response',
    });

  }

  downloadProducts(
    resourceParams: ProductResourceParameter
  ): Observable<HttpResponse<Product[]>> {
    const url = 'product';
    const customParams = new HttpParams()
      .set('fields', resourceParams.fields)
      .set('orderBy', resourceParams.orderBy)
      .set('pageSize', 0)
      .set('skip', resourceParams.skip.toString())
      .set('searchQuery', resourceParams.searchQuery)
      .set('name', resourceParams.name)
      .set('id', resourceParams.id)
      .set('categoryId', resourceParams.categoryId ? resourceParams.categoryId : '')
      .set('unitId', resourceParams.unitId ? resourceParams.unitId : '')
      .set('barcode', resourceParams.barcode ? resourceParams.barcode : '')
      .set('code', resourceParams.code ? resourceParams.code : '')
      .set('brandId', resourceParams.brandId ? resourceParams.brandId : resourceParams.brandId);
    return this.http.get<Product[]>(url, {
      params: customParams,
      observe: 'response',
    });
  }

  getProudct(id: string): Observable<Product> {
    const url = `product/${id}`;
    return this.http.get<Product>(url);
  }

  addProudct(product: Product): Observable<Product> {
    const url = 'product';
    return this.http.post<Product>(url, product);
  }

  updateProudct(id: string, product: Product): Observable<Product> {
    const url = `product/${id}`;
    return this.http.put<Product>(url, product);
  }


  deleteProudct(id: string): Observable<void> {
    const url = `product/${id}`;
    return this.http.delete<void>(url);
  }


  downloadProductFile(): Observable<HttpResponse<Blob>> {
    const url = 'DownloadProductFile';

    // Set headers for file download
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<Blob>(url, {
      headers: headers,
      observe: 'response',
      responseType: 'blob' as 'json'
    });
  }

  getNonCSDCanteenDynamic(id: string): Observable<void> {
    const url = `GetNonCSDCanteen/${id}`;
    return this.http.get<void>(url);
  }

}

