import type {
  FixtureThemeApi,
  SettingMarketingConsent,
  ShopTheme,
  ThemeSettingsData,
  ThemeSettingValue,
  ThemeInfo,
  TippingInfo,
} from "@types";

export enum Section {
  checkout_layout_and_user_interface = "checkout-layout-and-user-interface",
  checkout_account_and_forms = "checkout-account-and-forms",
  checkout_legal_and_payments = "checkout-legal-and-payments",
}

export class SettingThemeAPI {
  theme: FixtureThemeApi;

  constructor(theme: FixtureThemeApi) {
    this.theme = theme;
  }

  /**
   * Get theme ID of the theme is active
   * @returns
   */
  async getIdOfCurrentTheme(): Promise<number> {
    const currentThemeDataOnList = await this.theme.getPublishedTheme();
    return currentThemeDataOnList.id;
  }

  /**
   * Get data new theme create
   * @returns
   */
  async getIdShopThemeNew(theme: ThemeInfo): Promise<ShopTheme> {
    const themeInfo = await this.theme.create(theme.id);
    return themeInfo;
  }

  /**
   * Get data new all theme create
   * @returns
   */
  async creatThemes(themes: Array<ThemeInfo>): Promise<Array<ShopTheme>> {
    const themeInfos = [];
    for (let i = 0; i < themes.length; i++) {
      const themeInfo = await this.getIdShopThemeNew(themes[i]);
      themeInfos.push(themeInfo);
    }
    return themeInfos;
  }

  /**
   * active theme to use
   * @param shopThemeId id theme to use
   */
  async publishTheme(shopThemeId: number): Promise<ShopTheme> {
    const themePublishInfo = await this.theme.publish(shopThemeId);
    return themePublishInfo;
  }

  /**
   * Get data new all theme create
   * @returns
   */
  async getIdShopThemeByName(themes: Array<ShopTheme>, themeName: string): Promise<number> {
    const themeInfo = themes.find(theme => {
      return theme.name === themeName;
    });
    return themeInfo.id;
  }

  /**
   * Get list theme
   * @returns
   */
  async getListTheme(): Promise<Array<ShopTheme>> {
    const themeInfo = await this.theme.list();
    return themeInfo;
  }

  /**
   * delete list theme
   * @returns
   */
  async deleteThemes(): Promise<void> {
    const listThemeInfo = await this.getListTheme();
    for (let i = 0; i < listThemeInfo.length; i++) {
      if (!listThemeInfo[i].active) {
        await this.theme.delete(listThemeInfo[i].id);
      }
    }
  }

  /**
   * Get data setting of shop theme by theme ID
   * @param themeId
   * @returns shop_them.settings_data
   */
  async getDataThemeSettingByID(themeId: number): Promise<ThemeSettingsData> {
    const shopThemeData = await this.theme.single(themeId);
    const dataThemeSetting = shopThemeData.settings_data;
    return dataThemeSetting;
  }

  /**
   * Get data setting of active theme
   * @returns shop_them.settings_data
   */
  async getDataThemeSetting(): Promise<ThemeSettingsData> {
    const themeId = await this.getIdOfCurrentTheme();
    const dataThemeSetting = await this.getDataThemeSettingByID(themeId);
    return dataThemeSetting;
  }

  /**
   * Split theme info through themeId | data setting theme
   * @param currentThemeInfo themeID | bodyDataTheme.shop_theme | undefined -> will update the active theme
   * @returns themeId, dataSettingCheckout
   */
  async splitThemeInfoForEditor(
    currentThemeInfo?: ShopTheme | number,
  ): Promise<{ themeId: number; dataSettingTheme: ThemeSettingsData }> {
    let dataSettingTheme: ThemeSettingsData;
    let themeId: number;
    if (!currentThemeInfo) {
      themeId = await this.getIdOfCurrentTheme();
      dataSettingTheme = await this.getDataThemeSettingByID(themeId);
    } else if (typeof currentThemeInfo === "number") {
      themeId = currentThemeInfo;
      dataSettingTheme = await this.getDataThemeSettingByID(themeId);
    } else {
      themeId = currentThemeInfo.id;
      dataSettingTheme = currentThemeInfo.settings_data;
    }
    return { themeId, dataSettingTheme: dataSettingTheme };
  }

  /**
   * Edit checkout layout
   * @param layout
   *        "one-page" : one page checkout
   *        "multi-step": 3-steps checkout
   * @param currentThemeInfo themeID | bodyDataTheme.shop_theme | undefined -> will update the active theme
   * @returns
   */
  async editCheckoutLayout(
    layout: "one-page" | "multi-step",
    currentThemeInfo?: ShopTheme | number,
  ): Promise<ShopTheme> {
    const themeData = await this.splitThemeInfoForEditor(currentThemeInfo);
    const dataSetting = themeData.dataSettingTheme.pages.checkout.default.find(
      section => section.type == Section.checkout_layout_and_user_interface,
    );
    dataSetting.settings.checkout_layout = layout;

    const newThemeInfo = await this.theme.update(themeData.themeId, themeData.dataSettingTheme);
    return newThemeInfo;
  }

  /**
   * Setting option customer account
   * @param accountStatus
   * @param currentThemeInfo themeID | bodyDataTheme.shop_theme | undefined -> will update the active theme
   * @returns
   */
  async editCheckoutCustomerAccount(
    accountStatus: "optional" | "disabled",
    currentThemeInfo?: ShopTheme | number,
  ): Promise<ShopTheme> {
    const themeData = await this.splitThemeInfoForEditor(currentThemeInfo);
    const dataSetting = themeData.dataSettingTheme.pages.checkout.default.find(
      section => section.type == Section.checkout_account_and_forms,
    );
    dataSetting.settings.require_account = accountStatus;

    const newThemeInfo = await this.theme.update(themeData.themeId, themeData.dataSettingTheme);
    return newThemeInfo;
  }

  /**
   * Setting checkout form optional
   * @param options
   * @param currentThemeInfo themeID | bodyDataTheme.shop_theme | undefined -> will update the active theme
   * @returns
   */
  async editCheckoutFormOptions(
    options: {
      fullName?: "Require last name only" | "Require first and last name";
      companyName?: "hidden" | "optional" | "required";
      addressLine2?: "hidden" | "optional" | "required";
      phoneNumber?: "hidden" | "optional" | "required";
      tipping?: TippingInfo;
    },
    currentThemeInfo?: ShopTheme | number,
  ): Promise<ShopTheme> {
    const themeData = await this.splitThemeInfoForEditor(currentThemeInfo);
    const dataSetting = themeData.dataSettingTheme.pages.checkout.default.find(
      section => section.type == Section.checkout_account_and_forms,
    );
    const settingsTheme = dataSetting.settings;

    if (options.fullName) {
      if (options.fullName == "Require last name only") {
        settingsTheme.require_first_name = false;
      } else {
        settingsTheme.require_first_name = true;
      }
    }
    if (options.companyName) {
      settingsTheme.require_company_name = options.companyName;
    }
    if (options.addressLine2) {
      settingsTheme.require_address_2 = options.addressLine2;
    }
    if (options.phoneNumber) {
      settingsTheme.require_shipping_phone = options.phoneNumber;
    }
    if (options.tipping) {
      settingsTheme.enable_show_tipping_options = options.tipping.enabled;
      settingsTheme.is_old_layout_tipping = options.tipping.is_old_layout;
    }

    const newThemeInfo = await this.theme.update(themeData.themeId, themeData.dataSettingTheme);
    return newThemeInfo;
  }

  /**
   * Use the shipping address as the billing address by default
   * @param asShippingAddress
   * @param currentThemeInfo themeID | bodyDataTheme.shop_theme | undefined -> will update the active theme
   * @returns new setting theme
   */
  async editCheckoutBillingAddress(
    asShippingAddress: boolean,
    currentThemeInfo?: ShopTheme | number,
  ): Promise<ShopTheme> {
    const themeData = await this.splitThemeInfoForEditor(currentThemeInfo);
    const dataSetting = themeData.dataSettingTheme.pages.checkout.default.find(
      section => section.type == Section.checkout_account_and_forms,
    );
    dataSetting.settings.enable_ship_address_as_billing_address = asShippingAddress;

    const newThemeInfo = await this.theme.update(themeData.themeId, themeData.dataSettingTheme);
    return newThemeInfo;
  }

  /**
   * Setting show shipping method: Show all methods or just show one default
   * @param showAll
   * @param currentThemeInfo themeID | bodyDataTheme.shop_theme | undefined -> will update the active theme
   * @returns
   */
  async editCheckoutShippingMethod(showAll: boolean, currentThemeInfo?: ShopTheme | number): Promise<ShopTheme> {
    const themeData = await this.splitThemeInfoForEditor(currentThemeInfo);
    const dataSetting = themeData.dataSettingTheme.pages.checkout.default.find(
      section => section.type == Section.checkout_account_and_forms,
    );
    dataSetting.settings.show_available_shipping_method = showAll;

    const newThemeInfo = await this.theme.update(themeData.themeId, themeData.dataSettingTheme);
    return newThemeInfo;
  }

  /**
   * on|off Checkout Note
   * @param allowCustomerNote: default turn on
   * @param currentThemeInfo themeID | bodyDataTheme.shop_theme | undefined -> will update the active theme
   * @returns
   */
  async editCheckoutCheckoutNote(allowCustomerNote = true, currentThemeInfo?: ShopTheme | number): Promise<ShopTheme> {
    const themeData = await this.splitThemeInfoForEditor(currentThemeInfo);
    const dataSetting = themeData.dataSettingTheme.pages.checkout.default.find(
      section => section.type == Section.checkout_account_and_forms,
    );
    dataSetting.settings.enable_checkout_note = allowCustomerNote;

    const newThemeInfo = await this.theme.update(themeData.themeId, themeData.dataSettingTheme);
    return newThemeInfo;
  }

  /**
   * Setting Tipping display
   * @param options
   *        showTipping: show tipping option or not?
   *        tippingLayout: Buyer will Click to show or Always show Tipping?
   * @param currentThemeInfo themeID | bodyDataTheme.shop_theme | undefined -> will update the active theme
   * @returns
   */
  async editCheckoutTipping(
    options: {
      showTipping?: boolean;
      tippingLayout?: "Click to show" | "Always show";
    },
    currentThemeInfo?: ShopTheme | number,
  ): Promise<ShopTheme> {
    const themeData = await this.splitThemeInfoForEditor(currentThemeInfo);
    const dataSetting = themeData.dataSettingTheme.pages.checkout.default.find(
      section => section.type == Section.checkout_account_and_forms,
    );
    const settingsTheme = dataSetting.settings;

    if (options.showTipping !== undefined) {
      settingsTheme.enable_show_tipping_options = options.showTipping;
    }

    if (options.tippingLayout == "Always show") {
      settingsTheme.is_old_layout_tipping = false;
    } else if (options.tippingLayout == "Click to show") {
      settingsTheme.is_old_layout_tipping = true;
    }

    const newThemeInfo = await this.theme.update(themeData.themeId, themeData.dataSettingTheme);
    return newThemeInfo;
  }

  /**
   * For editCheckoutLegal(), just update data payload
   * @param settingsThemeData
   * @param termAgreement
   * @returns
   */
  updateDataSettingTermAgreement(
    settingsThemeData: Record<string, ThemeSettingValue>,
    termAgreement?: {
      showToS?: boolean;
      optionsConfirm?: "Auto confirmation" | "Manual confirmation";
    },
  ) {
    if (termAgreement.showToS !== undefined) {
      settingsThemeData.show_term_of_service = termAgreement.showToS;
    }
    if (termAgreement.optionsConfirm) {
      if (termAgreement.optionsConfirm == "Auto confirmation") {
        settingsThemeData.auto_confirm_term_of_service = true;
      } else {
        settingsThemeData.auto_confirm_term_of_service = false;
      }
    }
    return settingsThemeData;
  }

  /**
   * For editCheckoutLegal(), just update data payload
   * @param settingsThemeData
   * @param mktConsent
   * @returns
   */
  updateDataSettingMarketingConsent(
    settingsThemeData: Record<string, ThemeSettingValue>,
    mktConsent?: SettingMarketingConsent,
  ) {
    if (mktConsent.emailMkt) {
      if (mktConsent.emailMkt.showCheckbox !== undefined) {
        settingsThemeData.enable_show_email_marketing_consent_checkbox = mktConsent.emailMkt.showCheckbox;
      }
      if (mktConsent.emailMkt.preCheck !== undefined) {
        settingsThemeData.enable_pre_check_email_marketing_consent_checkbox = mktConsent.emailMkt.preCheck;
      }
    }
    if (mktConsent.smsMkt) {
      if (mktConsent.smsMkt.showCheckbox !== undefined) {
        settingsThemeData.enable_show_sms_marketing_consent_checkbox = mktConsent.smsMkt.showCheckbox;
      }
      if (mktConsent.smsMkt.preCheck !== undefined) {
        settingsThemeData.enable_pre_check_sms_marketing_consent_checkbox = mktConsent.smsMkt.preCheck;
      }
    }
    return settingsThemeData;
  }

  /**
   * Edit Checkout Legal
   * @param options
   * @param currentThemeInfo themeID | bodyDataTheme.shop_theme | undefined -> will update the active theme
   * @returns
   */
  async editCheckoutLegal(
    options: {
      termAgreement?: {
        showToS?: boolean;
        optionsConfirm?: "Auto confirmation" | "Manual confirmation";
      };
      marketingConsent?: SettingMarketingConsent;
    },
    currentThemeInfo?: ShopTheme | number,
  ): Promise<ShopTheme> {
    const themeData = await this.splitThemeInfoForEditor(currentThemeInfo);
    const dataSetting = themeData.dataSettingTheme.pages.checkout.default.find(
      section => section.type == Section.checkout_legal_and_payments,
    );
    const settingsTheme = dataSetting.settings;

    if (options.termAgreement) {
      this.updateDataSettingTermAgreement(settingsTheme, options.termAgreement);
    }
    if (options.marketingConsent) {
      this.updateDataSettingMarketingConsent(settingsTheme, options.marketingConsent);
    }

    const newThemeInfo = await this.theme.update(themeData.themeId, themeData.dataSettingTheme);
    return newThemeInfo;
  }

  /**
   * Enable Paypal Express Btn
   * @param showBtn
   * @returns
   */
  async enablePaypalExpressBtn(showBtn = true, currentThemeInfo?: ShopTheme | number): Promise<ShopTheme> {
    const dataTheme = await this.splitThemeInfoForEditor(currentThemeInfo);
    const dataSetting = dataTheme.dataSettingTheme.pages.checkout.default.find(
      section => section.type == Section.checkout_legal_and_payments,
    );
    dataSetting.settings.enable_show_paypal_express = showBtn;

    const newThemeInfo = await this.theme.update(dataTheme.themeId, dataTheme.dataSettingTheme);
    return newThemeInfo;
  }
}
