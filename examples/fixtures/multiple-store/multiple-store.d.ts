export interface MultipleDashboard {
  email_scheduler: string;
  cases: Cases;
}

export interface Cases {
  TC_MULTIPLE_DASHBOARD_01: TcMultipleDashboard01;
}

export interface TcMultipleDashboard01 {
  shops: Shop[];
}

export interface Shop {
  username: string;
  password: string;
  shop_domain: string;
  shop_id: number;
  user_id: number;
}
