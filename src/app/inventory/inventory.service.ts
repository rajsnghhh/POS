import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Inventory } from '@core/domain-classes/inventory';
import { InventoryHistory } from '@core/domain-classes/inventory-history';
import { InventoryHistoryResourceParameter } from '@core/domain-classes/inventory-history-resource-parameter';
import { InventoryResourceParameter } from '@core/domain-classes/inventory-resource-parameter';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  constructor(private http: HttpClient) { }

  getInventories(
    resourceParams: InventoryResourceParameter
  ): Observable<HttpResponse<Inventory[]>> {
    const url = 'inventory';

    const customParams = new HttpParams()
      .set('Fields', resourceParams.fields)
      .set('OrderBy', resourceParams.orderBy)
      .set('PageSize', resourceParams.pageSize.toString())
      .set('Skip', resourceParams.skip.toString())
      .set('SearchQuery', resourceParams.searchQuery)
      .set('productName', resourceParams.productName ? resourceParams.productName : '')
      .set('supplierName', resourceParams.supplierName ? resourceParams.supplierName : '')
      .set('brandName', resourceParams.brandName ? resourceParams.brandName : '')
      .set('productCategoryName', resourceParams.productCategoryName ? resourceParams.productCategoryName : '')
      .set('productCode', resourceParams.productCode ? resourceParams.productCode : '')
      .set('productMainCategoryId', resourceParams.productMainCategoryId ? resourceParams.productMainCategoryId : '')


    return this.http.get<Inventory[]>(url, {
      params: customParams,
      observe: 'response',
    });

  }

  getInventoriesReport(
    resourceParams: InventoryResourceParameter
  ): Observable<HttpResponse<Inventory[]>> {
    const url = 'inventory';
    const customParams = new HttpParams()
      .set('Fields', resourceParams.fields)
      .set('OrderBy', resourceParams.orderBy)
      .set('PageSize', 0)
      .set('Skip', 0)
      .set('SearchQuery', resourceParams.searchQuery)
      .set('productName', resourceParams.productName ? resourceParams.productName : '')
      .set('supplierName', resourceParams.supplierName ? resourceParams.supplierName : '')
      .set('brandName', resourceParams.brandName ? resourceParams.brandName : '')
      .set('productMainCategoryId', resourceParams.productMainCategoryId ? resourceParams.productMainCategoryId : '')


    return this.http.get<Inventory[]>(url, {
      params: customParams,
      observe: 'response',
    });

  }

  clearInventory(data: any): Observable<any> {
    const url = 'CleanInventory';
    return this.http.post<any>(url, data);
  }

  addInventory(inventory: Inventory): Observable<Inventory> {
    const url = 'inventory';
    return this.http.post<Inventory>(url, inventory);
  }

  getInventoryHistories(
    resourceParams: InventoryHistoryResourceParameter
  ): Observable<HttpResponse<InventoryHistory[]>> {
    const url = 'inventory/history';
    const customParams = new HttpParams()
      .set('Fields', resourceParams.fields)
      .set('OrderBy', resourceParams.orderBy)
      .set('PageSize', resourceParams.pageSize.toString())
      .set('Skip', resourceParams.skip.toString())
      .set('SearchQuery', resourceParams.searchQuery)
      .set('productId', resourceParams.productId)

    return this.http.get<InventoryHistory[]>(url, {
      params: customParams,
      observe: 'response',
    });
  }

  uploadInventory(inventory: FormData): Observable<Inventory> {
    const url = 'UploadStockInventory';
    return this.http.post<Inventory>(url, inventory);
  }


  downloadInventory(): Observable<HttpResponse<Blob>> {
    const url = 'DownloadStockInventoryFile';

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

}
