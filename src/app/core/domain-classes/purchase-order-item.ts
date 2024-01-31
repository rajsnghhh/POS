import { Product } from "./product";
import { PurchaseOrderItemTax } from "./purchase-order-item-tax";
import { PurchaseOrderStatusEnum } from "./purchase-order-status";
import { UnitConversation } from "./unit-conversation";

export interface PurchaseOrderItem {
  id?: string;
  productId: string;
  purchaseOrderId?: string;
  unitPrice: number;
  mrp:number;
  margin:number;
  expDate:string;
  salesPrice:number;
  quantity: number;
  taxValue: number;
  discount: number;
  stock:number;
  product?: Product;
  unitId?:string;
  discountPercentage: number;
  status?: PurchaseOrderStatusEnum;
  unitName?: string;
  purchaseOrderNumber?: string;
  poCreatedDate?: Date;
  supplierName?: string;
  purchaseOrderItemTaxes: PurchaseOrderItemTax[];
  productName?: string;
  warehouseId?:string; 
  warehouseName?:string; 
  unitConversation?: UnitConversation;
}
