import { AvailableLocale } from "./translation";

export type TranslationSettingApiRequest = {
  locale_code?: AvailableLocale;
};

export interface TranslationSettingApiResponse {
  data: TranslationSettingApiData;
  status: TranslationSettingApiStatus;
  success: boolean;
}

export interface TranslationSettingApiData {
  id: number;
  locale_code: string;
  locale_name: string;
  published: boolean;
  is_auto_translated: boolean;
  is_shop_template: boolean;
  data: TranslationSettingApiDatum[];
  shop_id: number;
  font: TranslationSettingApiDataFont;
  is_default: boolean;
  deleted_at: number;
  unlocked_at: number;
}

export interface TranslationSettingApiDatum {
  group: string;
  payment_type: string;
  is_auto_translate: boolean;
}

export interface TranslationSettingApiDataFont {
  heading: TranslationSettingApiHeading;
  paragraph: TranslationSettingApiParagraph;
}

export interface TranslationSettingApiHeading {
  font: TranslationSettingApiHeadingFont;
  h1: TranslationSettingApiH1;
  h2: TranslationSettingApiH1;
  h3: TranslationSettingApiH1;
  h4: TranslationSettingApiH1;
}

export interface TranslationSettingApiHeadingFont {
  name: string;
  variant: string;
}

export interface TranslationSettingApiH1 {
  font_size: number;
  line_height: number;
}

export interface TranslationSettingApiParagraph {
  font: TranslationSettingApiHeadingFont;
  p1: TranslationSettingApiH1;
  p2: TranslationSettingApiH1;
  p3: TranslationSettingApiH1;
}

export interface TranslationSettingApiStatus {
  all_pages_content: string;
  apps: string;
  online_store: string;
  products: string;
}

export interface TranslationSettingApiUpdateBody {
  id: number;
  published: boolean;
  data: TranslationSettingApiUpdateBodyDatum[];
}

export interface TranslationSettingApiUpdateBodyDatum {
  group: string;
  is_auto_translate: boolean;
}
