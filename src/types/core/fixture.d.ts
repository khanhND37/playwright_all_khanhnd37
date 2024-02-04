import type { ReadStream } from "fs";
import type { Serializable } from "playwright-core/types/structs";
import type { APIRequestContext, Page } from "@playwright/test";
import type { DomainCredentials } from "@utils/token";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CaseConf = Record<string, any>;

export type Config = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suiteConf: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  caseConf: Record<string, any>;
  caseName: string;
  directory?: string;
  fileName?: string;
};

export type TestConfig = {
  user_id: number;
  shop_id: number;
  shop_name: string;
  username: string;
  password: string;
  device: string;
};

export type FixtureApiRequestOptions = {
  url: string;
  data?: string | Buffer | Serializable;
  failOnStatusCode?: boolean;
  form?: { [key: string]: string | number | boolean };
  headers?: { [key: string]: string };
  ignoreHTTPSErrors?: boolean;
  method?: string;
  multipart?: {
    [key: string]:
      | string
      | number
      | boolean
      | ReadStream
      | {
          name: string;
          mimeType: string;
          buffer: Buffer;
        };
  };
  params?: { [key: string]: string | number | boolean };
  timeout?: number;
};

export type FixtureApiRequestHook = (options: FixtureApiRequestOptions) => FixtureApiRequestOptions;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FixtureApiResponseHook = (response: any) => any;

export type FixtureApiOptions = {
  context?: APIRequestContext;
  parallel?: boolean;
  autoAuth?: boolean;
  conf?: FixtureIdDomainCredentials;
};

export type FixtureApiResponse<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shop_theme?: Record<string, unknown>;
  result?: Record<string, unknown>;
  status: number;
  ok: boolean;
  data: T;
};

export type FixtureApi = {
  request: <T>(testApiCase: TestApiCase, options?: FixtureApiOptions) => Promise<FixtureApiResponse<T>>;
  all: <T>(testApiCases: Array<TestApiCase>, options?: FixtureApiOptions) => Promise<Array<FixtureApiResponse<T>>>;
  middleware: {
    request: {
      list: Array<FixtureApiRequestHook>;
      use: (fn: FixtureApiRequestHook) => void;
    };
    response: {
      list: Array<FixtureApiResponseHook>;
      use: (fn: FixtureApiResponseHook) => void;
    };
  };
};

export type CronMode = "every" | "later";
export type FixtureScheduler = {
  setData: (data: Record<string, unknown>, options?: { skipDataCheck: boolean }) => Promise<void>;
  getData: () => Promise<Record<string, unknown>>;
  /* mode can be
   - "every" for multiple times run (every 3 minutes later)
   - "later" for one time run after X minutes (after 3 minutes)
    */
  schedule: ({ minutes: number, mode: CronMode }) => Promise<boolean>;
  clear: () => Promise<boolean>;
};

export type ToolFixture = {
  updateAutomated: () => Promise<void>;
};

export type AuthRequestWithExchangeFixture = {
  changeToken: () => Promise<APIRequestContext>;
};

export type MultipleStore = {
  getDashboardPage: (
    username: string,
    password: string,
    shopDomain: string,
    shopId: number,
    userId: number,
  ) => Promise<Page>;
  getAuthRequest: (
    username: string,
    password: string,
    shopDomain: string,
    shopId: number,
    userId: number,
  ) => Promise<APIRequestContext>;
};

export type ThemeSettingValue = string | number | boolean | object;

export type ThemeBlock = {
  type: string;
  id?: string;
  visible?: boolean;
  settings: Record<string, ThemeSettingValue>;
};

export type ThemeSection = {
  type: string;
  id?: string;
  visible?: boolean;
  settings: Record<string, ThemeSettingValue>;
  blocks: Array<ThemeBlock>;
};

export type ThemeFixed = {
  blocks: Array<ThemeBlock>;
  id?: string;
  settings: Record<string, ThemeSettingValue>;
  type: string;
};

export type ThemePage = Record<string, Array<ThemeSection>>;
export type ThemePageV3 = {
  default: Record<string, Array<ThemeSection>>;
};

export type ThemeSettingsData = {
  pages: Record<string, ThemePage | ThemePageV3>;
  fixed: Record<string, ThemeFixed>;
  settings: Record<string, ThemeSettingValue>;
  design?: Record<string, ThemeSettingValue>;
};

export type ShopTheme = {
  active?: boolean;
  id: number;
  theme_id: number;
  version_id: number;
  shop_id: number;
  name: string;
  settings_data: ThemeSettingsData;
};

export type ShopThemes = {
  shop_themes: Array<ShopTheme>;
};

export type Theme = {
  shop_theme: ShopTheme;
};

export type Themes = {
  shop_themes: Array<ShopTheme>;
};

export type UpdateSection = {
  shopThemeId: number;
  settingsData: ThemeSettingsData;
  updateSection: Record<string, ThemeSection | ThemeFixed | Record<string, ThemeSettingValue>>;
};

export type UpdateMultipleSections = {
  shopThemeId: number;
  settingsData: ThemeSettingsData;
  updateSections: Record<string, Array<ThemeSection> | ThemeFixed | Record<string, ThemeSettingValue>>;
};

export type AddSection = {
  settingsData: ThemeSettingsData;
  shopThemeId: number;
  addSection: Record<string, ThemeSection>;
};

export type BootstrapTheme = {
  id: number;
  shop_theme_id: number;
  version_id: number;
  cdn: Record<string, string>;
  handle: string;
  pages: Record<string, unknown>;
  settings: Record<string, unknown>;
  name: string;
  fixed: Record<string, unknown>;
  customized?: boolean;
  critical_css?: string;
  build_id?: number;
  next_theme_editor?: boolean;
  template?: Record<string, unknown>;
};

export type Bootstrap = {
  theme: BootstrapTheme;
  navigation: {
    page_locks: string[];
  };
};

export type FixtureThemeApi = {
  domain: (authConfig?: DomainCredentials) => Promise<string>;
  list: (authConfig?: DomainCredentials) => Promise<Array<ShopTheme>>;
  single: (shopThemeId: number, authConfig?: DomainCredentials) => Promise<ShopTheme>;
  create: (id: number, authConfig?: DomainCredentials) => Promise<ShopTheme>;
  duplicate: (id: number, authConfig?: DomainCredentials) => Promise<ShopTheme>;
  createEcom: (id: number, authConfig?: DomainCredentials) => Promise<ShopTheme>;
  applyTemplate: (id: number, authConfig?: DomainCredentials) => Promise<ShopTheme>;
  cloneTemplate: (id: number) => Promise<ShopTheme>;
  updateTheme: (
    shopThemeId: number,
    data: ThemeSettingsData | Record<string, string | number>,
    authConfig?: DomainCredentials,
  ) => Promise<ShopTheme>;
  update: (
    shopThemeId: number,
    data: ThemeSettingsData | Record<string, string | number>,
    authConfig?: DomainCredentials,
  ) => Promise<ShopTheme>;
  publish: (shopThemeId: number, authConfig?: DomainCredentials) => Promise<ShopTheme>;
  delete: (shopThemeId: number, authConfig?: DomainCredentials) => Promise<boolean>;
  getPublishedTheme: (authConfig?: DomainCredentials) => Promise<ShopTheme>;
  updateSection: (updateSection: UpdateSection, authConfig?: DomainCredentials) => Promise<ShopTheme>;
  updateThemeSettings: (updateSections: UpdateMultipleSections, authConfig?: DomainCredentials) => Promise<ShopTheme>;
  addSection: (addSection: AddSection, authConfig?: DomainCredentials) => Promise<ShopTheme>;
  getFirstIdOfTemplates: () => Promise<number>;
  getStoreId: () => Promise<number>;
  createTemplate: (templateData, authConfig?: DomainCredentials) => Promise<boolean>;
  updateTemplate: (addData) => Promise<boolean>;
  deleteTemplate: (templateId) => Promise<boolean>;
  getBootstrap: (shopThemeId?: number) => Promise<Bootstrap>;
  addTheme: (nameTheme: string) => Promise<ShopTheme>;
  getIdByNameTemplate: (nameTemplate: string, libId?: number) => Promise<number>;
};

export type TestApiCase = {
  url: string;
  method?: string;
  step?: string;
  request?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    headers?: Record<string, any>;
  };
  response?: {
    status: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
  };
  type?: "json" | "text";
};

export type FixtureTokenUser = {
  username: string;
  password: string;
};

export type FixtureTokenShop = {
  token?: string;
  domain?: string;
  userId?: number;
  shopId?: number;
};

export type FixtureDomainCredentials =
  | FixtureTokenUser
  | {
      domain?: string;
    };

export type FixtureIdDomainCredentials =
  | FixtureDomainCredentials
  | {
      userId?: number;
      shopId?: number;
    };

export type FixtureToken = {
  getUserToken: (options: FixtureTokenUser) => Promise<{ id: number; access_token: string }>;
  getShopToken: (options: FixtureTokenShop) => Promise<{ id: number; access_token: string }>;
  getWithCredentials: (options: FixtureDomainCredentials) => Promise<{ id: number; access_token: string }>;
  get: (options: FixtureIdDomainCredentials) => Promise<{ id: number; access_token: string }>;
};

export type TypeSearchOdoo = {
  model: string;
  args: Array<Array<string | number | boolean>>;
  offset?: number;
  limit?: number;
  order?: string;
};

export type TypeSearchReadOdoo = {
  model: string;
  args: Array<Array<string | number | boolean | Array<string | number>>>;
  fields?: Array<string>;
  offset?: number;
  limit?: number;
  order?: string;
};

export type CallActionResponse = {
  params: {
    message: string;
    sticky: boolean;
    title: string;
    type: string;
  };
  tag: string;
  type: string;
};

export type FixtureOdoo = {
  connect: () => Promise<{ uid: number; odoo: object }>;
  request: (
    model: string,
    method: string,
    args: Array<Array<Array<Array<string | number | boolean>> | number | Array<string>>>,
  ) => Promise<boolean | number | object | Array<object> | Array<number>>;
  searchRead: <T>(params: TypeSearchReadOdoo) => Promise<Array<T>>;
  search: (params: TypeSearchOdoo) => Promise<Array<number>>;
  read: <T>(model: string, ids: Array<number>, fields?: Array<string>) => Promise<Array<T>>;
  count: (model: string, args: Array<Array<string | number | boolean>>) => Promise<number>;
  create: (model: string, args: object) => Promise<number>;
  update: (model: string, id: number, args: object) => Promise<boolean>;
  updateMulti: (model: string, ids: Array<number>, args: object) => Promise<boolean>;
  delete: (model: string, ids: Array<number>) => Promise<boolean>;
  actionQuickDone: <T>(params: { args: number[]; model: string }) => Promise<Array<T>>;
  actionCheckAvailability: <T>(params: { args: number[]; model: string }) => Promise<Array<T>>;
  callAction: <T>(params: { args: number[]; model: string; action: string }) => Promise<Array<T>>;
  callActionV2: (params: { args: number[]; model: string; action: string }) => Promise<CallActionResponse>;
};

export type TemplateBuilder = {
  id: number;
  title: string;
  image: string;
  priority: number;
  status: number;
};

export type SectionBuilder = {
  id: number;
  title: string;
  type: string;
  priority: number;
  image: string;
  templates: Array<Templates>;
  store_types: Array<string>;
};

export type LibraryBuilder = {
  title: string;
  id: number;
  description: string;
  published: boolean;
  is_linked: boolean;
  blocks: Array<SectionBuilder>;
  sections: Array<SectionBuilder>;
  pages: Array<SectionBuilder>;
  custom_blocks: Array<SectionBuilder>;
  types: Array<TypeLibraryBuilder>;
  themes: Array<TemplateBuilder>;
};

export type LibrariesBuilder = {
  title: string;
  id: number;
  description: string;
  published?: boolean;
  is_linked?: boolean;
  library_id?: number;
  created_at: number;
  updated_at: number;
  shop_id: number;
  status: number;
};

export type CategoriesBuilder = {
  id: number;
  title: string;
  type: string;
  image?: string;
  priority?: number;
  library_id: number;
  shop_id: number;
  created_at: number;
  updated_at: number;
  library_name: string;
};

export type TypeLibraryBuilder = {
  id: number;
  name: string;
  handle: string;
};

export type CreateLibraryBuilder = {
  title: string;
  description?: string;
  types?: Array<string>;
  type?: Array<string>;
};

export type CreateCategoryBuilder = {
  title: string;
  metadata?: string;
  type: string;
  image?: string;
  priority?: number;
  library_id: number;
};

export type EditLibraryBuilder = CreateLibraryBuilder | { status: number };

export type CreateLibraryResponse = {
  id: number;
  title: string;
  description: string;
  type: Array<TypeLibraryBuilder>;
};

export type CreateCategoryResponse = {
  id: number;
  title: string;
  type: string;
  priority: number;
  library_id: number;
  shop_id: number;
  created_at: number;
  updated_at: number;
};

export type CreateTemplateBuilder = {
  title: string;
  type: string;
  page: string;
  library_id: number;
  image: string;
  tags?: string[];
};

export type CreateTemplateResponse = {
  id: number;
  title: string;
  library_id: number;
  tags: string[];
  status: number;
  created_at: number;
  updated_at: number;
  is_current_template: boolean;
};

export type ApplyTemplate = {
  templateId: number;
  productId: number;
  type: string;
};

export type ParamsGetListLibrary = {
  action: "all";
  paging?: number;
  status?: number;
  limit?: number;
  count?: boolean;
};

export type ParamsGetListTag = {
  count?: boolean;
  page_type?: string;
  limit?: number;
  page?: number;
  sort_field?: string;
  sort_direction?: string;
  search?: string;
};

export type CreatePageResponse = {
  handle: string;
  id: number;
  title: string;
};

export type PageWebBuilderInfo = {
  base_template_id: number;
  entity_id: number;
  id: number;
  image: string;
  page: string;
  settings_data: string;
  shop_id: number;
  status: number;
  title: string;
  type: string;
  variant: string;
};

export type SettingSectionWebBuilder = {
  pageId?: number;
  settingData: PageSettingsData;
  updateSettings: Array<Record<string, ThemeSettingValue>> | Record<string, ThemeSettingValue>;
  indexSection?: number;
};

export type FixtureWebBuilder = {
  domain: (authConfig?: DomainCredentials) => Promise<string>;
  getLastestLibraryID: (authConfig?: DomainCredentials) => Promise<number>;
  listCategory: (authConfig?: DomainCredentials) => Promise<Array<CategoriesBuilder>>;
  listLibrary: (params: ParamsGetListLibrary, authConfig?: DomainCredentials) => Promise<Array<LibrariesBuilder>>;
  listTag: (params?: ParamsGetListTag, authConfig?: DomainCredentials) => Promise<Array<string>>;
  libraryDetail: (id: number, authConfig?: DomainCredentials) => Promise<LibraryBuilder>;
  updateLibrary: (
    id: number,
    params: EditLibraryBuilder,
    authConfig?: DomainCredentials,
  ) => Promise<CreateLibraryResponse>;
  updateLinkedLib: (id: number, params: EditLibraryBuilder) => Promise<CreateLibraryResponse>;
  updateTemplate: (id: number, status: number, authConfig?: DomainCredentials) => Promise<CreateTemplateResponse>;
  applyTemplate: (params: ApplyTemplate, authConfig?: DomainCredentials) => Promise<PageWebBuilderInfo>;
  createLibrary: (params: CreateLibraryBuilder, authConfig?: DomainCredentials) => Promise<CreateLibraryResponse>;
  createCategoryByAPI: (
    params: CreateCategoryBuilder,
    authConfig?: DomainCredentials,
  ) => Promise<CreateCategoryResponse>;
  deleteLibrary: (id: number, authConfig?: DomainCredentials) => Promise<object>;
  createLibraryLinked: (id: number, authConfig?: DomainCredentials) => Promise<LibrariesBuilder>;
  deleteLibraryLinked: (id: number, authConfig?: DomainCredentials) => Promise<object>;
  createTemplateInLib: (
    params: CreateTemplateBuilder,
    authConfig?: DomainCredentials,
  ) => Promise<CreateTemplateResponse>;
  deleteAllTemplateOnLibrary: (id: number, authConfig?: DomainCredentials) => Promise<object>;
  createOfferInDPro: (params: CreateUpsellOffer) => Promise<CreateUpsellOfferResponse>;
  createWebsitePage: (title: string) => Promise<CreatePageResponse>;
  getDProOffer: (dProId: number) => Promise<Array<UpsellOffers>>;
  pageBuilder: (pageId: number) => Promise<PageBuilder>;
  pageSiteBuilder: (pageId: number) => Promise<PageBuilder | PageSiteBuilder | ShopTheme>;
  updatePageBuilder: (pageId: number, settingsData: PageSettingsData) => Promise<boolean>;
  getPageInfoByProductId: (ref_id: number, type: string, limit?: number) => Promise<PageWebBuilderInfo>;
  settingSections: (data: SettingSectionWebBuilder) => Promise<boolean>;
  updateSiteBuilder: (shopThemeId: number, settingsData: PageSettingsData | ThemeSettingsData) => Promise<boolean>;
  updateSiteSection: (pageName: string, themeId: number, indexOfSection: number, sectionData, builder) => Promise<void>;
  createComponent: (data: AddToLibrary, authConfig?: DomainCredentials) => Promise<ComponentResponse>;
  deleteCategory: (cateId: number, authConfig?: DomainCredentials) => Promise<boolean>;
  deleteComponent: (id: number, authConfig?: DomainCredentials) => Promise<boolean>;
  getListTagTemplateStore: (domain: string) => Promise<Tags>;
  getThemeTemplateStore: (domain: string, keyword?: string, tag?: string) => Promise<Templates>;
  getThemeTemplateInPopup: (
    domain: string,
    storeType: string,
    libraryIds?: string,
    keyword?: string,
    tag?: string,
  ) => Promise<Templates>;
  getShopLibThemeInfoInPopup: (
    domain: string,
    storeType: string,
    libraryIds?: string,
    keyword?: string,
    tag?: string,
  ) => Promise<YourTemplates>;
  getPageTemplateStore: (domain: string, payload?: Record<string, string>) => Promise<Templates>;
  getInforPageTemplate: (id: number, authConfig?: DomainCredentials) => Promise<CreateTemplateResponse>;
  getPageTemplateInPopup: (
    domain: string,
    storeType: string,
    type?: string,
    keyword?: string,
    tag?: string,
    libraryIds?: string,
  ) => Promise<Templates>;
  getPageTemplate: (id: number) => Promise<PageBuilder>;
  getShopLibPageInfoInPopup: (
    domain: string,
    storeType: string,
    type: string,
    libraryIds?: string,
    keyword?: string,
    tag?: string,
  ) => Promise<YourTemplates>;
  updateSettingCheckoutForm: (themeId: number, settingCheckoutForm: SettingCheckoutForm) => Promise<boolean>;
  getInfoCheckoutForm: (themeId: number) => Promise<WebBuilderPage>;
  setProductPageDesign: (
    productId: number,
    templateId: number,
    authConfig?: DomainCredentials,
  ) => Promise<PageWebBuilderInfo>;
};

export type UpsellOffers = {
  id: number;
  shop_id: number;
  activated: boolean;
  offer_type: string;
  offer_name: string;
  offer_title: string;
  offer_message: string;
  target_type: string;
  enable_discount: boolean;
  recommend_type: string;
  target_ids: Array<number>;
  recommend_ids: Array<number>;
  discount_data: string;
};

export type CreateUpsellOfferResponse = {
  success: boolean;
  message: string;
  id: number;
};

export type CreateUpsellOffer = {
  activated?: boolean;
  offer_type?: string;
  offer_name?: string;
  offer_title?: string;
  offer_message?: string;
  offer_success_message?: string;
  priority?: number;
  target_type?: string;
  enable_discount?: boolean;
  recommend_type?: string;
  target_ids?: Array<number>;
  recommend_ids?: Array<number>;
  discount_data?: string;
  condition?: Record<string, unknown>;
};

export type CTABtnSettings = {
  settings: Record<string, unknown>;
  app_code: string;
};

export type FixtureUpsellOffers = {
  listOffers: () => Promise<Array<UpsellOffers>>;
  createOffer: (params: CreateUpsellOffer) => Promise<CreateUpsellOfferResponse>;
  deleteAllOffers: (ids: number[]) => Promise<object>;
  settingsCTABtn: (settings: CTABtnSettings) => Promise<object>;
};

export type PageSiteBuilder = {
  id: number;
  pages: Array<number | string | boolean>;
  shop_id: number;
  settings_data: PageSiteSettingsData;
  preview_url: string;
};

export type PageBuilder = {
  id: number;
  pages: Array<number | string | boolean>;
  shop_id: number;
  settings_data: PageSettingsData;
  preview_url: string;
};

export type WebBuilderPage = {
  settings_data: WebBuilderSitePage;
};

export type WebBuilderSitePage = {
  pages: {
    [page: string]: {
      default: {
        elements: WebBuilderElement[];
      };
    };
  };
};

export type WebBuilderElement = {
  id: string;
  type: string;
  component: string;
  elements: WebBuilderElement[];
  settings: Record<string, ThemeSettingValue>;
  designs: Record<string, ThemeSettingValue>;
};

export type PageSiteSettingsData = {
  pages: {
    [page: string]: {
      designs: Record<string, ThemeSettingValue>;
      devices: Record<string, ThemeSettingValue>;
      sections: Array<Record<string, ThemeSettingValue>>;
      elements: Array<Record<string, ThemeSettingValue>>;
    };
  };
  designs: Record<string, ThemeSettingValue>;
};

export type PageSettingsData = {
  pages: {
    product: {
      [page: string]: {
        designs: Record<string, ThemeSettingValue>;
        devices: Record<string, ThemeSettingValue>;
        sections: Array<Record<string, ThemeSettingValue>>;
        elements: Array<Record<string, ThemeSettingValue>>;
      };
    };
  };
  designs: Record<string, ThemeSettingValue>;
};

export type ThemeInfo = {
  id?: number;
  name?: string;
  theme_id?: string;
  type?: string;
};

export type AddToLibrary = {
  title: string;
  type: string;
  component_type: string;
  library_id: number;
  category_id: number;
  settings_data: Record<string, unknown>;
  image: string;
  tags?: string[];
  store_types: string[];
};

export type ComponentResponse = {
  id: number;
  title: string;
  type: string;
  component_type: string;
  settings_data: unknown;
  image: string;
  status: number;
  priority: number;
  tags: string[];
  library_id: number;
  category_id: number;
  store_types: string[];
};

export type Templates = Array<Template>;

export type Template = {
  id: number;
  title: string;
  store_types?: Array<string>;
  tags: Array<string>;
  page?: string;
};

export type Tags = {
  default_store_type_tags: Array<string>;
  site_tags: Array<string>;
  tags: Array<string>;
};

export type YourTemplates = {
  templates: Templates;
  total_libraries: Array<Library>;
  total: number;
};

export type Library = {
  library_id: number;
  total: number;
  title?: string;
  link?: string;
  type?: string;
  status?: string;
  actions?: string;
};

export type ParamsOffer = {
  limit?: number;
  offer_types?:
    | "bundle"
    | "quantity"
    | "accessory"
    | "pre-purchase,post-purchase,in-cart"
    | "post-purchase"
    | "handpicked"
    | "in-cart";
  only_active?: boolean;
};

export type SettingCheckoutForm = {
  billing_address_layout?: {
    name: "Radio" | "Checkbox";
  };
  checkout_layout?: "one-page" | "multi-step";
  email_marketing?: "enable" | "disable" | "auto";
  enable_checkout_note?: true;
  enable_show_payment_trust_badges?: true;
  enable_show_paypal_express?: true;
  enable_social_id?: true;
  is_sticky_proceed_button?: true;
  require_account?: true;
  require_address_2?: "optional" | "required" | "hidden";
  require_company_name?: "optional" | "required" | "hidden";
  require_first_name?: true;
  require_shipping_phone?: "optional" | "required" | "hidden";
  shipping_layout?: "hide_eta" | "eta_processing" | "full_layout" | "eta_only";
  show_available_shipping_method?: false;
  show_order_value_on_button?: true;
  sms_marketing?: "enable" | "disable" | "auto";
  term_of_services?: "enable" | "hide" | "auto";
  tipping_layout?: "always_show" | "click_to_show" | "hide";
};
