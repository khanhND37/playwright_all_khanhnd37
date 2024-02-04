import { Locator } from "@playwright/test";

export type AvailableLocale =
  | "af"
  | "sq"
  | "am"
  | "ar"
  | "hy"
  | "as"
  | "ay"
  | "az"
  | "bm"
  | "eu"
  | "be"
  | "bn"
  | "bho"
  | "bs"
  | "bg"
  | "ca"
  | "ceb"
  | "zh-CN"
  | "zh-TW"
  | "co"
  | "hr"
  | "cs"
  | "da"
  | "dv"
  | "doi"
  | "nl"
  | "en"
  | "eo"
  | "et"
  | "ee"
  | "fil"
  | "fi"
  | "fr"
  | "fy"
  | "gl"
  | "ka"
  | "de"
  | "el"
  | "gn"
  | "gu"
  | "ht"
  | "ha"
  | "haw"
  | "he"
  | "hi"
  | "hmn"
  | "hu"
  | "is"
  | "ig"
  | "ilo"
  | "id"
  | "ga"
  | "it"
  | "ja"
  | "jv"
  | "kn"
  | "kk"
  | "km"
  | "rw"
  | "gom"
  | "ko"
  | "kri"
  | "ku"
  | "ckb"
  | "ky"
  | "lo"
  | "la"
  | "lv"
  | "ln"
  | "lt"
  | "lg"
  | "lb"
  | "mk"
  | "mai"
  | "mg"
  | "ms"
  | "ml"
  | "mt"
  | "mi"
  | "mr"
  | "mni-Mtei"
  | "lus"
  | "mn"
  | "my"
  | "ne"
  | "no"
  | "ny"
  | "or"
  | "om"
  | "ps"
  | "fa"
  | "pl"
  | "pt"
  | "pa"
  | "qu"
  | "ro"
  | "ru"
  | "sm"
  | "sa"
  | "gd"
  | "nso"
  | "sr"
  | "st"
  | "sn"
  | "sd"
  | "si"
  | "sk"
  | "sl"
  | "so"
  | "es"
  | "su"
  | "sw"
  | "sv"
  | "tl"
  | "tg"
  | "ta"
  | "tt"
  | "te"
  | "th"
  | "ti"
  | "ts"
  | "tr"
  | "tk"
  | "ak"
  | "uk"
  | "ur"
  | "ug"
  | "uz"
  | "vi"
  | "cy"
  | "xh"
  | "yi"
  | "yo"
  | "zu";

export type Language = {
  locale_code?: string;
  locale_name?: string;
  published?: boolean;
  is_auto_translated?: boolean;
  data?: Datum[];
  shop_id?: number;
  font?: WelcomeFont;
  is_default?: boolean;
  status?: string;
  deleted_at?: number;
  is_auto_renew?: boolean;
  unlocked_at?: number;
  id?: number;
  last_id?: number;
};

export type Datum = {
  group?: string;
  is_auto_translate?: boolean;
};

export type WelcomeFont = {
  heading?: Heading;
  paragraph?: Paragraph;
};

export type Heading = {
  font?: HeadingFont;
  h1?: H1;
  h2?: H1;
  h3?: H1;
  h4?: H1;
};

export type HeadingFont = {
  name?: string;
  variant?: string;
};

export type H1 = {
  font_size?: number;
  line_height?: number;
};

export type Paragraph = {
  font?: HeadingFont;
  p1?: H1;
  p2?: H1;
  p3?: H1;
};

export type LanguageSetting = {
  language_settings: Array<Language>;
};

export type ResponeLanguageList = {
  result: Array<Language>;
};

export type TranslationDetailDropListPage = {
  group: string;
  items: string[];
};

/**
 * @description Data of translation detail screen
 * You must provide correct search condition to get correct row
 *
 * fieldName: name of field in table
 * sourceLanguageValue: value of source language in table
 * fieldIndex: index of field in table, after filter by fieldName and sourceLanguageValue
 * inputData: data to fill in destination language
 * inputDataType: type of input data, can be text or html
 *
 * For example, with data like this:
 * Field Name | English     | German
 * ---------------------------------
 * Title       | Product 01 | ---
 * Description | Product 01 | ---
 * ---------------------------------
 *
 * With title is normal input field, you should provide data like this:
 * {
 *    searchCondition: {
 *      fieldName: "Title",
 *      fieldIndex: 0,
 *      sourceLanguageValue: "Product 01",
 *    },
 *    inputData: "Product 01 - TRANSLATED",
 *   inputDataType: "text",
 * }
 *
 * With html field, you should provide data like this:
 * {
 *   searchCondition: {
 *    fieldName: "Description",
 *    fieldIndex: 0,
 *    sourceLanguageValue: "Product 01",
 *   },
 *  inputData: "<p>Product 01 - TRANSLATED</p>",
 *  inputDataType: "html",
 */
export type TranslationDetailProductSearchData = {
  searchCondition: {
    fieldName: string;
    sourceLanguageValue?: string;
    fieldIndex?: number;
  };

  inputData: string;
  inputDataType: "text" | "html";
};

export type TranslationDetailTableData = {
  index: number;
  field: string;
  locator: Locator;
  source: {
    type: string;
    value: string;
    locator: Locator;
  };
  destination: {
    type: "text" | "tiny_mce" | "tiptap";
    value: string;
    locator: Locator;
  };
};

export type TranslationBootstrapItem = {
  name: string;
  value: string;
};

export type TranslationBootstrapGroup = {
  group: string;
  items: TranslationBootstrapItem[];
};

export type TranslationBootstrapData = Record<string, TranslationBootstrapGroup[]>;

export type TranslationBootstrapRequest = {
  themePreviewId?: number;
  localeCode?: string;
};
export type TranslateText = {
  q: string[];
  source: string;
  target: string;
};
