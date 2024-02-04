import { SBPage } from "@pages/page";
import { DashboardPage } from "./dashboard";
import { Page } from "@playwright/test";

export class BundleV2PageSF extends SBPage {
  xpathProductNameOnProductPage = '[data-id="product"] .product__name';
  xpathTotalPrice = ".payment-due__price";
  xpathAtcButtonOnSF = '.bundle__offer-content [data-button="add-to-cart"] >> nth=0';
  xpathDiscountLineOnCheckoutPage = '//span[text()="Discount"]/ancestor::tr//span[@class="order-summary__emphasis"]';
  xpathSubtotalLineOnCheckoutPage = '//td[text()="Subtotal"]/ancestor::tr//span[@class="order-summary__emphasis"]';
  selectorBundleContentOnSF = ".bundle__offer-content";
  selectorVariantOnProductPage = ".bundle__offer-select-desktop select";
  selectorTotalPriceOnProductPage = ".bundle__offer-total-price--detail >> nth=0";
  selectorBundlePopupOnProductPage = ".upsell-quick-view__container";
  selectorContinueButtonOnPopup = ".bundle-popup__button-text span";
  selectorCustomOptionTextArea = ".upsell-custom-option__input-textarea";
  selectorClosePopup = ".upsell-modal__close";
  selectorAtcButtonOnPopup = ".upsell-quick-view__add-to-cart span";
  selectorCustomOptionOnCheckoutPage = ".checkout-product__description .word-break-all";
  selectorValidateMessOnPopup = ".upsell-msg-validate div";
  xpathImageProductOnPopup = "//div[contains(@class,'VueCarousel-slide product-slide-image')]";
  selectorBundleContainOnSF = ".bundle__offer-container";
  xpathSelectCountry = "//div[contains(@class,'field--half')]//input[@name='countries']";
  xpathCountryUK = "//div[@value='GB'and@tabindex]";
}

export class BundleV2PageDB extends DashboardPage {
  xpathSelectProductOnApp = '[type="button"] span:text-is("Select products")';
  xpathTextBoxBundleName = '//label[contains(.,"name")]/ancestor::div[2]//input';
  xpathCreateBundleButtonOnProductAdmin = '[type="button"] span:text-is("Create bundle")';
  xpathCreateBundleButtonOnApp = '[type="button"] span:text-is("Create a bundle")';
  xpathContinueCreateBundle = '[type="button"] span:text-is("Continue with selected products")';
  selectorToastCreateBundleSuccess = "text=Bundle was created successfully";
  xpathSubmitBundlebuttonOnApp = '[type="button"] span:text-is("Submit offer")';
  xpathBundleList = ".bundle-list-page";
  xpathFirstBundleOnList = ".bundle-list-page .offer-name span >> nth=0";
  xpathAddProductToBundleButton = 'ancestor::div[3]//i[contains(@class, "mdi-plus-circle-outline")]';
  xpathCheckboxDiscountOnProductAdmin =
    '//span[contains(., "Enable discount for this bundle")]/ancestor::label//span[@class="s-check"]';
  xpathTextBoxDiscountOnProductAdmin =
    '//span[contains(., "Enable discount for this bundle")]/ancestor::div[1]//input[@type="number"]';
  selectorBundleNameOnEditPopupProductAdmin = ".offer-name div";
  selectorBundleNameOnListApp = ".offer-name span";
  xpathEditBundleButtonOnProductAdmin = '[type="button"] span:text-is("Edit bundle")';
  selectorToastDeactivatedBundleSuccess = "text=Bundle was deactivated successfully";
  selectorBundleStatusOnApp = ".offer-status .is-danger";
  xpathMessageTextBoxOnProductAdmin = '[id="input-offer-message"]';
  xpathSaveBundleButtonOnProductAdmin = '[type="button"] span:text-is("Save changes")';
  selectorToastUpdateBundleSuccess = "text=Bundle was updated successfully";
  xpathHeadingEditBundleTab = '.offer-heading h2:text-is("Edit bundle")';
  xpathTextBoxBundleMessage = '//label[contains(.,"message")]/ancestor::div[2]//input';
  xpathChangeProductOnAppXpath = '[type="button"] span:text-is("Change products")';
  xpathSaveButton = '[type="button"] span:text-is("Save")';
  selectorDiscountTextBoxOnApp = ".usell-discount__type input";

  openBundleListPage(domain: string, page: Page) {
    page.goto(`https://${domain}/admin/apps/boost-upsell/cross-sell/bundle-offer/list`);
  }

  /**
   * Get product xpath in the bundle on app & SF
   * @param bundleName
   * @param productName
   * @returns
   */
  getProductXpathInBundle(bundleName: string, productName: string) {
    return `//*[contains(., "${bundleName}")]/ancestor::tr//a[@title="${productName}"]`;
  }

  /**
   * Get add product button to the bundle
   * @param productName
   * @returns
   */
  getAddProductButtonXpath(productName: string) {
    return `//div[text()="${productName}"]/${this.xpathAddProductToBundleButton}`;
  }

  /**
   * Get toggle active/deactive xpath on product admin
   * @param offerName
   * @returns
   */
  getToggleActiveBundleXpath(offerName: string) {
    return `//*[contains(., "${offerName}")]/ancestor::tr//span[@class="s-check"]`;
  }

  getStatusBundleOnList(offerName: string) {
    return `//*[contains(., "${offerName}")]/ancestor::tr//td[contains(@class,"offer-status")]//div`;
  }

  setTargetProductXpath(productName: string) {
    return `//p[contains(., "${productName}")]/ancestor::div[1]//span[text()='Set as target']`;
  }
}
