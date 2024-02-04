/**
 * Use: input data to edit tier in Hive shopbase
 */
export type ModifiedTier = {
  name?: string;
  threshold?: string;
  keep_threshold?: string;
  cycle?: string;
};

/**
 * Use: input reward data to edit a tier reward in Hive shopbase
 */
export type Reward = {
  ex_star?: string;
  reward_type?: string;
  cash_value?: string;
  gift_value?: string;
  gift_name?: string;
  file_path?: string;
  isAdd?: boolean;
  message: string;
};

/**
 * Use: get config tier by id in Hive shopbase
 */
export type ConfigTier = {
  name?: string;
  threshold: number;
  keep_threshold: number;
  cycle: number;
};

export type AllConfig = {
  level: number;
  cur_name: string;
  cur_threshold: number;
  cur_keep_threshold: number;
  cur_cycle: number;
  next_name: string;
  next_threshold: number;
  next_keep_threshold: number;
  next_cycle: number;
};

export type DataFilter = {
  name: string;
  value: string;
};
export type InfoProductDetail = {
  num_mockup?: number;
  num_artwork?: number;
  name_product?: string;
  sku?: string;
  quantity?: number;
  cost?: string;
  fulfillment_status?: string;
  personalize?: string;
  artwork_status?: string;
  purchase_status?: string;
};

export type InfoFulFill = {
  quantity: string;
  tracking_number: string;
  tracking_url: string;
  is_send_mail?: boolean;
};
