export type Market = {
  name: string;
  is_active: boolean;
  global_market_countries: Array<Country>;
  id?: number;
  currency?: string;
  exchange_rate?: number;
  rounding?: number;
  price_adjustment?: number;
  exchange_rate_auto?: number;
  is_multiple_currency?: boolean;
  is_primary?: boolean;
  is_rate_auto?: boolean;
  is_rounding?: boolean;
  shop_id?: number;
};

export type Country = {
  country_code: string;
  country_id: number;
  country_name: string;
  exchange_rate_auto?: number;
  is_rounding?: boolean;
  rounding?: number;
  price_adjustment?: number;
};

export type MarketResponse = {
  success: boolean;
  result: {
    id: number;
    name: string;
    shop_id: number;
    currency: string;
    exchange_rate: number;
    rounding: number;
    price_adjustment: number;
    is_active: boolean;
  };
};

export type GlobalMarketData = {
  CountryOrRegion: string;
  CurrencyAndPricing: string;
  Status: boolean;
};

export type MarketList = {
  success: boolean;
  result: Array<Market>;
};
