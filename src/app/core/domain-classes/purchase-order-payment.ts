import { PurchaseOrder } from "./purchase-order";

export class PurchaseOrderPayment{
      id:number;
      purchaseOrderId:number;
      orderNumber?: string;
      purchaseOrder: PurchaseOrder;
      paymentDate:Date;
      referenceNumber:string;
      supplierName:string;
      amount:number;
     //PaymentMethod PaymentMethod { get; set; }
      note:string;
      attachmentUrl:string;
      attachmentData:string;
      paymentMethod?: string;
      pandingAmount?:string;
      totalAmount?:string;
      totalPaidAmount?:string;
}
