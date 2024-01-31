import { ResourceParameter } from './resource-parameter';
import { SalesOrderStatusEnum } from './sales-order-status';

export class SalesOrderResourceParameter extends ResourceParameter {
    orderNumber?: string = '';
    mobileNo?: string = '';
    customerName?: string = '';
    isAppOrderRequest?: string = '';
    isAdvanceOrderRequest?: string = '';
    sOCreatedDate?: Date;
    orderDeliveryStatus?: string = '';
    customerId?: string = '';
    fromDate?: any;
    toDate?: any;
    productId: string;
    isSalesOrderRequest: boolean = false;
    status?: SalesOrderStatusEnum = SalesOrderStatusEnum.All;
    productName?: string;
    counterName: string = '';
    productMainCategoryId: string = '';
}

// export class AllSalesOrderResourceParameter extends ResourceParameter {
//     customerName?: string = '';
//     sOCreatedDate?: Date;
//     BillId: string;
//     TotalQuantity: string;
//     Payment:string;
//     Total: string;
// }
