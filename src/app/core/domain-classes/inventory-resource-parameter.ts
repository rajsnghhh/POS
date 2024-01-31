import { ResourceParameter } from "./resource-parameter";

export class InventoryResourceParameter extends ResourceParameter {
    id?: string;
    productId?: string;
    stock: number;
    productName: string;
    brandName: string;
    supplierName: string;
    productCategoryName: string;
    productCode: string;
    productMainCategoryId: string;
}
