import { EntityState } from './entity-state';

export interface Customer {
  id: string;
  customerName: string;
  contactPerson: string;
  email: string;
  mobileNo: string;
  OTP:string;
  Password:string;
  phoneNo: string;
  objectState?: EntityState;
  isDeleted?: boolean;
  isVerify?: boolean;
  isSendMail?: boolean;
  description: string;
  website: string;
  isVarified?: boolean;
  url?: string;
  imageUrl?: string;
  logo?: string;
  serviceNo?:string;
  aadharCard?:string;
  dependantCard?:string;
  category?:string
  customerProfile?: string;
  isUnsubscribe?: boolean;
  isImageUpload?: boolean;
  address?: string;
  countryName?: string;
  cityName?: string;
  countryId?: string;
  cityId?: string;
  isWalkIn?: boolean;
  pinCode?:number;
}
