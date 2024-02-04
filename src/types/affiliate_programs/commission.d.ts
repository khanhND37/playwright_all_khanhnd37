export type CommissionAPIResponse = {
  list: Record<string, CommissionDetail>;
  total_qualified_item: number;
  total_hold_item: number;
  total_cashback: number;
  total_ref_user: number;
  total_click: number;
  quantity_ref_user_in_time: number;
  success: boolean;
  message: string;
};

export type CommissionDetail = {
  id: number;
  name: string;
  email: string;
  signup_date: number;
  gold_base_data: GoldBaseData;
  silver_base_data: GoldBaseData;
  plus_base_data: PlusBaseData;
  plus_base_data_sorted: PlusBaseDataSorted[];
  total_cashback_user: number;
  is_ref_date: Date;
};

export type GoldBaseData = {
  qualified_item: number;
  hold_item: number;
  cashback: number;
};

export type PlusBaseData = {
  "Gold Base": GoldBaseData;
  "Silver Base": GoldBaseData;
};

export type PlusBaseDataSorted = {
  plus_base_group_name: string;
  plus_base_group_id: number;
  qualified_item: number;
  hold_item: number;
  cashback: number;
};
