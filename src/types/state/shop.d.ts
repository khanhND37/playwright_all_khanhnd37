export type Shop = {
  id: number;
  access_token: string;
};

export type ShopResponse = Shop & {
  shop_id: number;
};
