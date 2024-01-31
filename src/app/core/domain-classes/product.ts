import { ProductTax } from "./product-tax";
import { Unit } from "./unit";
import { UnitConversation } from "./unit-conversation";

export interface Product {
    reduce(arg0: (a: any, b: any) => any): unknown;
    id?: string;
    name: string;
    code: string;
    barcode: string;
    hsnCode: string;
    skuCode: string;
    skuName: string;
    description: string;
    productUrl: string;
    qrCodeUrl: string;
    unitId: string;
    purchasePrice: number;
    salesPrice: number;
    mrp: number;
    margin:number;
    categoryId: string;
    productUrlData: string;
    isProductImageUpload: boolean;
    qRCodeUrlData: string;
    isQrCodeUpload: boolean;
    productTaxes: ProductTax[];
    unit?: UnitConversation;
    categoryName?: string;
    unitName?: string;
    warehouseId?: string;
    orderStartTime: string;
    orderEndTime: string;
    isProductOrderTime: boolean;
    rackNo: string;
    stock: number
}

export interface ProductPackage {
    id?: string;
    name: string;
    code: string;
    barcode: string;
    hsnCode: string;
    skuCode: string;
    skuName: string;
    description: string;
    productUrl: string;
    qrCodeUrl: string;
    unitId: string;
    purchasePrice: number;
    salesPrice: number;
    mrp: number;
    categoryId: string;
    productUrlData: string;
    isProductImageUpload: boolean;
    qRCodeUrlData: string;
    isQrCodeUpload: boolean;
    productTaxes: ProductTax[];
    unit?: UnitConversation;
    categoryName?: string;
    unitName?: string;
    warehouseId?: string;
    orderStartTime: string;
    orderEndTime: string;
    isProductOrderTime: boolean;
    rackNo: string
}

