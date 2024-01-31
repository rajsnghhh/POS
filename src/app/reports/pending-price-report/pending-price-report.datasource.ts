import { DataSource } from '@angular/cdk/table';
import { HttpResponse } from '@angular/common/http';
import { ResponseHeader } from '@core/domain-classes/response-header';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { PurchaseOrderResourceParameter } from '@core/domain-classes/purchase-order-resource-parameter';
import { PurchaseOrderPayment } from '@core/domain-classes/purchase-order-payment';
import { PendingPriceReportService } from '../pending-price-report/pending-price-report.service';

export class PendingPriceReportDataSource implements DataSource<PurchaseOrderPayment> {
  private _purchaseOrderSubject$ = new BehaviorSubject<PurchaseOrderPayment[]>([]);
  private _responseHeaderSubject$ = new BehaviorSubject<ResponseHeader>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public loading$ = this.loadingSubject.asObservable();
  private _count: number = 0;
  sub$: Subscription;

  public get count(): number {
    return this._count;
  }
  public responseHeaderSubject$ = this._responseHeaderSubject$.asObservable();

  constructor(
    private pendingPriceReportService : PendingPriceReportService) {

  }

  connect(): Observable<PurchaseOrderPayment[]> {
    this.sub$ = new Subscription();
    return this._purchaseOrderSubject$.asObservable();
  }

  disconnect(): void {
    this._purchaseOrderSubject$.complete();
    this.loadingSubject.complete();
    this.sub$.unsubscribe();
  }

  loadData(purchaseOrderResource: PurchaseOrderResourceParameter) {
    this.loadingSubject.next(true);
    this.sub$ = this.pendingPriceReportService.getAllPurchaseOrderPaymentReport(purchaseOrderResource)
      .pipe(
        catchError(() => of([])),
        finalize(() => this.loadingSubject.next(false)))
      .subscribe((resp: HttpResponse<PurchaseOrderPayment[]>) => {
        if (resp && resp.headers) {
          const paginationParam = JSON.parse(
            resp.headers.get('X-Pagination')
          ) as ResponseHeader;
          this._responseHeaderSubject$.next(paginationParam);
          const purchaseOrders = [...resp.body];
          this._count = purchaseOrders.length;
          this._purchaseOrderSubject$.next(purchaseOrders);
        }
      });
  }
}
