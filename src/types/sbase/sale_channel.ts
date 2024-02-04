export type SaleChannel = {
  id: number;
  code: string;
};

export type KlavyioMember = {
  attributes: {
    email: string;
    first_name: string;
    image: string;
    last_name: string;
  };
  id: string;
};

export type GoogleAdsConversions = {
  id?: string;
  label?: string;
  conversion_goal?: string;
};
export type GoogleAds = {
  ga_enhanced_ecommerce?: boolean;
  gads_conversions?: Array<GoogleAdsConversions>;
  migrates?: {
    from_preference_setting?: boolean;
  };
  enable_ga_remarketing?: boolean;
  ga_remarketing_target?: string;
};
