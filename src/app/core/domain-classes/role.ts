import { RoleClaim } from "./role-claim";
import { UserRoles } from "./user-roles";

export interface Role {
  id?: string;
  name?: string;
  userRoles?: UserRoles[];
  roleClaims?: RoleClaim[];
}

export interface Counter {
  status?: string;
  message?: string;
  statusCode?: number;
  data?: CounterData[]
}

export interface CounterData extends Counter {
  canteenLocationName?: string;
  id?: string;
}
