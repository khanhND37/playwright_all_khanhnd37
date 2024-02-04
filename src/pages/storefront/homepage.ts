import { expect, Locator, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import { SFCollection } from "@sf_pages/collection";
import { GlobalCurrency } from "@pages/storefront/global_currency";
import { SFProduct } from "./product";
import type { SocialContentFormData } from "@types";
import { waitSelector } from "@core/utils/theme";
import { removeCurrencySymbol } from "@core/utils/string";

export type Footer = {
  yearAndShopName: string;
  contact: string;
  termsConditions: string;
  privacyPolicy: string;
};

export class SFHome extends SBPage {
  xpathFullPage = ".default-layout";
  xpathBlankPage = ".blank";
  xpathMain = "main.main-content";
  xpathCartDrawer = ".cart-drawer";
  xpathLoginPage = ".login-template";
  xpathHeaderMenuHome = "[data-dropdown-rel='home page']";
  xpathCartDrawerContainer = `${this.xpathCartDrawer} .cart-drawer-container`;
  xpathCartDrawerProduct = `${this.xpathCartDrawerContainer} .product-cart`;
  xpathCartDrawerClose = `${this.xpathCartDrawer} .cart-drawer-icon-close`;
  xpathHeaderSection = ".header-section";
  xpathHeaderLogoText = ".header .logo-text";
  xpathFooterSection = ".footer-section";
  xpathFooterCopyright = ".footer-copyright p";
  xpathLoadingImage = "//img[contains(@class,'loading')]";
  xpathProductDetail = "//div[@id='detail-contents']";
  xpathCartIcon =
    "(//a[@class='cart-icon'] | //a[contains(@class,'mini-cart')]|//div[contains(@class,'block-cart__icon')])";
  xpathAvatarMobile = "//div[contains(@class,'avatar-mobile flex')]";
  xpathFooterInfo = "//div[@class='footer-section']//div[contains(@class,'section-footer')]";
  xpathCloseSocialProof = "//a[@class='close sb-toast-close']";
  xpathSocialProofToast = "//div[@class='sb-toast-item item-display-bottom-left sb-animation']";
  xpathTitleWebsite = "//head//title";
  xpathMetaDescription = "//meta[@name='description']";
  xpathAnnouncementBar = "section[type='announcement-bar']";
  xpathHeader = "section[type='header']";
  xpathFooter = "section[type='footer-content']";
  xpathSlideShow = "section[type='slideshow']";
  xpathFeaturedCollection = "section[type='featured-collection']";
  xpathCollectionList = "section[type='collection-list']";
  xpathFeaturedProduct = "section[type='featured-product']";
  xpathRichText = "section[type='rich-text']";
  xpathMainContent = "//main[@role='main']";
  xpathPriceOnProductPage = "//div[contains (@class, 'product__price')]";
  xpathButtonAddtocart = "//button[@id='add-to-cart']";
  xpathCartGoalMessage = "//div[contains (@class, 'cart-goal__motivational-message')]";
  xpathCurrencyLanguage = `${this.xpathFooterSection} .currency-language_action`;
  xpathCurrencyLanguageRoller = "//div[contains (@class, 'locale-currency-button')]";
  xpathLanguageList = "//div[@class='locale-dropdown__content']";
  xpathCurrencyList = "//div[@class='currency-dropdown__content']";
  xpathCurrencyLanguageModal = ".modal-select-currency-language";
  xpathSearching = "//p[contains(@class, 'searching')]";
  xpathClosePopUpCenter =
    "(//section[contains(@class,'center middle section-popup')]//div[contains(@class,'close-popup-button')])[last()]";
  notFoundTitle = this.genLoc(".notfound-page").locator("[class*=__title]");
  notFoundText = this.genLoc(".notfound-page").locator("[class*=__text]");
  continueShoppingBtn = this.genLoc(".notfound-page").locator("[class*=notfound-page__btn]");
  xpathBlockGlobalSwitcher = `//div[contains(@class, 'action-label')]`;
  selectorTitlePopupChooseLangugeCurrency = ".locale-currency-dropdown .currency-language-v2__title";
  xpathDropdownOnGlobalSwitcher = `//div[contains(@class, 'custom-select')]`;
  xpathSearchBlockIcon = `[component="search"] .block-search__input i`;
  xpathSearchBar = `input.block-search__input`;
  xpathProductCard = `//div[contains(@class, 'product-item')]//*[contains(@class, 'title')]`;
  xpathGalleryBlock = `[component="media"]`;
  xpathProductListBlock = `[component="product_list"]`;
  buttonATCOnVariantPopup = `//button[@id="variant-selector-popup-atc"]`;
  breadcrumbCheckOut = `//span[contains(@class, 'breadcrumb_link--item') and contains(text(), 'Checkout')]`;
  imgCountryOfGlobalSwitcher = `//section[@component="global-switcher"]//img`;
  xpathPopupPreSelectVariant = `//div[@id="variant-selector-popup__content"]`;
  xpathSearchSuggestion = `//div[contains(@class,'absolute search-suggestion')]`;
  xpathSection = sectionIndex => `//section[contains(@class,'wb-builder__section--container')][${sectionIndex}]`;
  xpathButtonCheckout = "//button[@name='checkout'] | //span[normalize-space()='Checkout']";
  xpathStickyBtnCart = "//div[@id='sticky-add-cart']//button[normalize-space()='Add to cart']";
  notiMessATCSucces = "//span[contains(@class,'notification__message')]";
  xpathMiniCart = "//div[contains(@class,'relative cart-drawer-wrapper')]";
  cartDrawer = "//section[@data-section-id='default_cart_drawer']";
  xpathOverlay = `//div[contains(@class,'popover-bottom__overlay')]`;
  xpathBlockPrice = `//div[contains(@class, 'product__price')]`;
  orderItemOnCheckOutPage = `//*[@component="order-item"] | //div[contains(@class,'order-items')]`;
  layoutGridBlockProductWidget = "//div[contains(@class,'layout-grid--container')]";
  blockUpsellWidget = "//section[@component='upsell-widget']";
  slideNavigation = `${this.blockUpsellWidget}//div[@class='VueCarousel-pagination']`;
  arrow = `${this.blockUpsellWidget}//button[contains(@class,'navigation-button')]`;
  productCartName = `${this.blockUpsellWidget}//div[contains(@class,'product-card__name')]`;
  xpathSwitchCurrencyLanguageV2 = `//div[contains(@class,'currency-language_action')]`;

  xpathGlobalSwitcher = {
    xpathCountrySelected: `//div[contains(@class, 'selected ')]//img[contains(@class,'country-flag')]//following-sibling::div`,
    xpathPopupGlobalSwitcher: `//div[contains(@class, 'locale-currency-dropdown')]`,
    xpathLanguageOrCurrencySelected: index =>
      `(//div[contains(@class, 'selected ')]//div[contains(@class, 'break-words')])[${index}]`,
    xpathSaveButton: `//div[contains(@class, 'justify-end')]//button`,
  };

  //switch store currency for theme v2
  async selectStorefrontCurrencyV2(country: string, theme = "roller") {
    switch (theme) {
      case "roller": {
        await this.page.locator("//div[contains(@class,'locale-currency-button')]").click();
        if (
          await this.isElementExisted(
            `//span[contains(text(), '${country}') and contains(@class, 'currency-dropdown__item__code')]`,
            null,
            5000,
          )
        ) {
          await this.page
            .locator(`//span[contains(text(), '${country}') and contains(@class, 'currency-dropdown__item__code')]`)
            .click();
          await this.page.locator("//button[normalize-space()='Done']").click();
          await this.page.waitForSelector(
            `//div[contains(@class,'locale-currency-button') and contains(., '${country}')]`,
          );
        }
        break;
      }
      case "inside": {
        await this.page.locator("//div[contains(@class,'currency-language relative')]").click();
        if (
          await this.isElementExisted(
            `//span[contains(text(), '${country}') and contains(@class, 'currency-dropdown__item__name')]`,
            null,
            5000,
          )
        ) {
          await this.page
            .locator(`//span[contains(text(), '${country}') and contains(@class, 'currency-dropdown__item__name')]`)
            .click();
          await this.page.locator("//button[normalize-space()='select']").click();
          await this.page.waitForLoadState();
          await this.page.waitForSelector(
            `//div[contains(@class,'currency-language relative') and contains(., '${country}')]`,
          );
        }
        break;
      }
    }
  }

  /**
   * Select currency and country at popup Global switcher in SF themes NE
   * @param currency
   * @param country
   */
  async selectStorefrontCurrencyNE(currency: string, country?: string) {
    if (await this.isElementExisted(this.xpathClosePopUpCenter)) {
      await this.page.locator(this.xpathClosePopUpCenter).click();
    }
    await this.page.locator("(//div[contains(@class,'currency-language')])[1]").click();
    if (country) {
      await this.page.locator("//div[@class='custom-select w-100 relative text-align-left p3']").first().click();
      await this.page.locator(`//div[@class='flex items-center']//div[contains(text(), '${country}')]`).last().click();
    }
    await this.page.locator("//div[@class='custom-select w-100 relative text-align-left p3']").last().click();
    if (await this.isElementExisted(`//div[contains(text(), '${currency}')]`)) {
      await this.page.locator(`//div[contains(text(), '${currency}')]`).last().click();
    } else {
      throw new Error(`Not found ${currency} in currency dropdown list`);
    }
    await this.page.locator("//button[normalize-space()='Save']").click();
    await this.page.waitForLoadState();
  }

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  async gotoHomePage(path = "") {
    await this.goto(path);
    await this.page.waitForLoadState("networkidle");
  }

  async gotoProduct(handle: string) {
    await this.goto(`/products/${handle}`);
    await this.page.waitForLoadState("networkidle");
  }

  async gotoCollection(handle: string) {
    await this.goto(`collections/${handle}`);
    await this.page.waitForLoadState("networkidle");
  }

  async gotoProductWithCollection(collectionHandle: string, productHandle: string) {
    await this.goto(`collections/${collectionHandle}/products/${productHandle}`);
  }

  async gotoPage(handle: string) {
    await this.goto(`pages/${handle}`);
  }

  async gotoCart() {
    await this.goto("/cart");
    await this.page.waitForResponse(
      response => response.url().includes("/api/checkout/next/cart.json") && response.status() === 200,
    );
  }

  async gotoCheckout() {
    await this.page.waitForSelector(this.xpathButtonCheckout);
    await this.page.click(this.xpathButtonCheckout);
    if (this.page.isVisible("#checkout-layout-loader[style*='display: none;']")) {
      await this.page.waitForSelector("#checkout-layout-loader[style*='display: none;']", { state: "hidden" });
    } else {
      await this.page.waitForSelector('//input[@placeholder="Discount code"]');
    }
  }

  async gotoAllCollection() {
    await this.goto(`/collections/all/`);
    await this.page.waitForLoadState("load");
    return new SFCollection(this.page, this.domain);
  }

  async searchThenClickToViewProduct(productName: string): Promise<number> {
    let searchLoc = this.genLoc(`input[placeholder='Search']`);
    if (!(await searchLoc.isVisible())) {
      searchLoc = this.genLoc(
        "//input[@placeholder='Enter keywords...' or @placeholder='What are you looking for?' or @placeholder='Search products']",
      );
      await this.goto("/search");
    }
    await this.page.waitForLoadState("networkidle"); //vi khi dang fill textbox page bi reload lai nen textbox bi trong => doi trang on dinh load het
    await searchLoc.click();
    await searchLoc.fill(productName);
    await searchLoc.press("Enter");
    await this.page.waitForLoadState("networkidle");
    await expect(this.genLoc(this.xpathSearching)).toBeHidden();
    // Wait for css transition complete
    await this.page.waitForTimeout(2 * 1000);

    await this.page.locator(`(//*[text()="${productName}"]//ancestor::a)[1]`).click();
    await this.page.waitForSelector("(//div[contains(@class,'product__price')])[1]");
    const actualProdPrice = Number(
      removeCurrencySymbol(
        (await this.page.locator(`(//div[contains(@class,'product__price')])[1]`).textContent()).substring(1),
      ),
    );
    return actualProdPrice;
  }

  async searchThenViewProduct(productName: string, productOption?: string): Promise<SFProduct> {
    await this.searchThenClickToViewProduct(productName);
    if (productOption) {
      await this.page.locator(`//div[@class='product__variant-button']//button[text()='${productOption}']`).click();
    }

    const actualProdPrice = Number(
      (await this.page.locator(`(//div[contains(@class,'product__price')])[1]`).textContent()).substring(1),
    );

    const initialStateObj = await this.page.evaluate(() => window["__INITIAL_STATE__"]);
    let productObj;
    if (initialStateObj) {
      productObj = initialStateObj["product"];
    }
    let productId = 0;
    if (productObj) {
      productId = productObj.product.id as number;
    } else {
      const rawObj = await this.page.locator("#__INITIAL_STATE__").textContent();
      productId = JSON.parse(rawObj).product.product.id as number;
    }
    if (
      await this.page
        .locator("(//img[@class='image sb-lazy loading base-picture__img'])[1]")
        .isVisible({ timeout: 3000 })
    ) {
      await this.waitForElementVisibleThenInvisible("(//img[@class='image sb-lazy loading base-picture__img'])[1]");
    }
    return new SFProduct(this.page, this.domain, productName, actualProdPrice, 0, productId);
  }

  async searchThenVerifyProductPrice(productName: string, originPrice: number, globalCurrency: GlobalCurrency) {
    await this.searchThenViewProduct(productName);

    const actualProdPrice = Number(await this.page.locator("//div[@class = 'product__price h4']").textContent());
    expect(actualProdPrice == globalCurrency.calculateExpectedProdPrice(originPrice)).toBeTruthy();
  }

  async waitShopAvailable() {
    await this.page.waitForSelector("//*[@class='header-section']");
    await this.page.waitForSelector("//main[@role='main']");
  }

  /**
   * Enter customer email to Klaviyo sign up form on Storefront
   * @param email
   */
  async enterCustomerEmailToKlaviyoSignUpForm(email: string) {
    await this.page.locator('[placeholder="Email"]').fill(email);
    await this.page.locator('[data-testid="klaviyo-form-ScatNB"] >> text=Sign up').click();
  }

  /**
   * Click on Cart icon on Header
   */
  async clickOnCartIconOnHeader() {
    await this.page.click(this.xpathCartIcon);
    await this.page.waitForLoadState("load");
  }

  /**
   * Go to product detail on SF by handle
   */
  async gotoProductDetailByHandle(handle: string, productName: string) {
    await this.goto(`/products/${handle}`);
    await this.page.waitForLoadState("networkidle");
    return new SFProduct(this.page, this.domain, productName);
  }

  /**
   * open Reset password screen
   */
  async openResetPasswordScreen(button: string) {
    await this.page.click(`//a[normalize-space()='${button}']`);
    await this.page.waitForSelector("//p[normalize-space()='Reset password']");
  }

  /**
   * Open menu on my product screen
   */
  async openMenu(menu: string) {
    await this.page.click("//div[contains(@class,'svg-container menu-item--avatar')]");
    await this.page.click(`//p[normalize-space()='${menu}']`);
    await this.page.waitForLoadState("load");
  }

  /**
   * get contact on footer webfront
   */
  async getContactOnFooter() {
    const contact = await this.getTextContent("(//div[@class='flex justify-center section-footer'])[2]");
    return contact;
  }

  /**
   * open Terms&Conditions and Privacy Policy page
   */
  async openFooterPage(pageName: string) {
    await this.page.click(`//div//a[normalize-space()='${pageName}']`);
  }

  /**
   * get info Terms&Conditions and Privacy Policy page
   */
  getPageUrl() {
    return this.page.url();
  }

  //Verify storefront Homepage is visible or not
  async isHomepageUnavailable(): Promise<boolean> {
    await this.page.waitForLoadState("load");
    return await this.page.locator("//div[@id='page_error']").isVisible();
  }

  /**
   * Search product in the store with product's name
   * @param productName name of product
   */
  async searchProduct(productName: string) {
    let searchLoc: Locator;
    if (await this.page.locator(`input[placeholder='Search']`).isVisible()) {
      searchLoc = this.page.locator(`input[placeholder='Search']`);
      await searchLoc.click();
    } else {
      searchLoc = this.page.locator(
        "//input[@placeholder='Enter keywords...' or @placeholder='What are you looking for?' or @placeholder='Search products']",
      );
      await this.goto(`/search`);
    }
    await this.page.waitForLoadState("networkidle"); //vi khi dang fill textbox page bi reload lai nen textbox bi trong => doi trang on dinh load het
    await searchLoc.fill(productName);
    await searchLoc.press("Enter");
    await this.page.waitForTimeout(3000);
  }

  /**
   * View product detail with product's name
   * @param productName name of product
   * @param index index of the product in list
   */
  async viewProduct(productName: string, index = "1") {
    await this.page.locator(`(//*[text()="${productName}"]//ancestor::a)[${index}]`).click();
    return new SFProduct(this.page, this.domain);
  }

  async getFooterInfo(): Promise<Footer> {
    const yearAndShopName = await this.page.innerText(`(${this.xpathFooterInfo})[1]`);
    const replaceYear = yearAndShopName.replace("\n", " ");
    const replaceYearAndShopName = replaceYear.replace("\n", " ");
    const contact = await this.page.innerText(`(${this.xpathFooterInfo})[2]`);
    const replaceContact = contact.replace("\n", " ");
    const terms = await this.page.innerText(`(${this.xpathFooterInfo}//a)[1]`);
    const policy = await this.page.innerText(`(${this.xpathFooterInfo}//a)[2]`);
    const footer = {
      yearAndShopName: replaceYearAndShopName,
      contact: replaceContact,
      termsConditions: terms,
      privacyPolicy: policy,
    };
    return footer;
  }

  async openMenuOnMobile(menu: string): Promise<void> {
    await this.page.click(`//ul[contains(@class,'mobile-nav-menu')]//a[normalize-space()='${menu}']`);
  }

  async getSocialProof(): Promise<SocialContentFormData> {
    const data = {
      content: "",
      title: "",
      time: "",
      link: "",
    };
    data.content = await this.genLoc('//div[@class="sb-toast-content"]//p[@class="sb-toast-text"]').textContent();
    data.title = await this.genLoc("//div[@class='sb-toast-content']//h5[@class='sb-toast-title']").textContent();
    data.time = await this.genLoc("//div[@class='sb-toast-content']//p[@class='sb-toast-time']").textContent();
    data.link = await this.genLoc("//div[@class='sb-toast-content']//a").getAttribute("href");
    return data;
  }

  /**
   * Hide all img tag when verify snapshot
   */
  async visiblityHideAllImg(): Promise<void> {
    await this.page.evaluate(() => {
      const images = document.getElementsByTagName("img");
      for (let i = 0; i < images.length; i++) {
        images[i].style.visibility = "hidden";
        // Because "visibility: hidden" still retains the height, set it to 10px to reduce the height
        images[i].style.height = "10px";
      }
      return Promise.resolve();
    });
  }

  /**
   * Select variant by title
   * @param options is list option value of 1 variant
   */
  async selectVariantOptions(options: Array<string>) {
    for (const value of options) {
      await this.page
        .locator(
          `//div[contains(@class,'variants-selector')]//div[contains(@class,'button-layout')] //span[normalize-space()='${value}']`,
        )
        .click();
    }
  }

  /**
   * get số lượng link page ở footer tương ứng với từng block
   * @param block: string Support | Policies
   * return số lượng link page
   */
  async getNumberOfPage(block: string): Promise<number> {
    const xpath = this.page.locator(`//strong[contains(text(),'${block}')]/following-sibling::a`);
    return await xpath.count();
  }

  /**
   * Select language on store front
   * @param language: ngôn ngữ muốn chọn
   * @param theme: theme của store
   * @param langSymbol: ký hiệu của ngôn ngữ vừa chọn
   */
  async selectStorefrontLanguage(language: string, theme = "roller", langSymbol?: string) {
    switch (theme) {
      case "roller": {
        await this.page.locator("//div[contains(@class,'locale-currency-button')]").click();
        if (
          await this.isElementExisted(
            `//span[contains(text(), '${language}') and contains(@class, 'currency-dropdown__item__code')]`,
            null,
            5000,
          )
        ) {
          await this.page
            .locator(`//span[contains(text(), '${language}') and contains(@class, 'currency-dropdown__item__code')]`)
            .click();
          await this.page.locator("//button[normalize-space()='Done']").click();
          await this.page.waitForSelector(
            `//div[contains(@class,'locale-currency-button') and contains(., '${langSymbol}')]`,
          );
        }
        break;
      }
      case "inside": {
        await this.page.locator("//div[contains(@class,'currency-language relative')]").click();
        if (
          await this.isElementExisted(
            `//span[contains(text(), '${language}') and contains(@class, 'currency-dropdown__item__name')]`,
            null,
            5000,
          )
        ) {
          await this.page
            .locator(`//span[contains(text(), '${language}') and contains(@class, 'currency-dropdown__item__name')]`)
            .click();
          await this.page.locator("//button[normalize-space()='select']").click();
          await this.page.waitForLoadState();
          await this.page.waitForSelector(
            `//div[contains(@class,'currency-language relative') and contains(., '${langSymbol}')]`,
          );
        }
        break;
      }
      case "new-ecom":
        await this.page.locator("(//div[contains(@class,'currency-language')])[1]").click();
        await this.genLoc(`(//h4[contains(text(),'Language')]/following-sibling::div//div)[2]`).click({ delay: 2000 });
        await this.clickElementWithLabel("div", language);
        await this.clickOnBtnWithLabel("Save");
        break;
    }
  }

  async xpathOptionIsChoosed(option: string) {
    return `//div[contains(@class, 'selected ')]//div[contains(@class, 'break-words') and contains(text(), '${option}')]`;
  }

  /**
   * Set country, language, currency block global switcher on SF
   * @param option
   */
  async chooseCountryAndLanguageOnSF(option: { country?: string; language?: string; currency?: string }) {
    const preXpathOptionOnDropdown = "//div[contains(@class, 'items')]";
    await this.page.locator(this.xpathBlockGlobalSwitcher).click({ timeout: 5000 });
    await waitSelector(this.page, this.selectorTitlePopupChooseLangugeCurrency);

    if (option.language) {
      await this.page.locator(`${this.xpathDropdownOnGlobalSwitcher} >> nth = 1`).click();
      await this.page
        .locator(`${preXpathOptionOnDropdown}//div[contains(text(), '${option.language}')]`)
        .last()
        .click();
      await waitSelector(this.page, await this.xpathOptionIsChoosed(option.language));
    }
    if (option.country) {
      await this.page.locator(this.xpathDropdownOnGlobalSwitcher).first().click();
      await this.page.locator(`${preXpathOptionOnDropdown}//div[contains(text(), '${option.country}')]`).last().click();
    }
    if (option.currency) {
      await this.page.locator(this.xpathDropdownOnGlobalSwitcher).last().click();
      await this.page
        .locator(`${preXpathOptionOnDropdown}//div[contains(text(), '${option.currency}')]`)
        .last()
        .click();
    }
    await this.page.locator(this.xpathGlobalSwitcher.xpathSaveButton).last().click({ delay: 1000 });
    await this.page.waitForSelector(this.selectorTitlePopupChooseLangugeCurrency, { state: "hidden" });
    await this.page.waitForLoadState("networkidle");
    if (option.currency) {
      await expect(this.page.locator(this.xpathBlockGlobalSwitcher)).toContainText(option.currency);
    }
    if (option.language) {
      await expect(this.page.locator(this.xpathBlockGlobalSwitcher)).toContainText(option.language);
    }
  }

  /**
   * xpath ATC Product
   * @returns
   */
  xpathATCProduct(product: string): string {
    return `//div[contains(@class,'product-col')] [ ./span[normalize-space()='${product}']]//span[normalize-space()='Add to cart']`;
  }

  /**
   * aTC Product In Collection
   * @param product
   */
  async aTCProductInCollection(product: string) {
    await this.genLoc(
      `//div[contains(@class,'product-item')] [ .//h2[normalize-space()='${product}']]//div[contains(@class,'product-card--assets')]`,
    ).hover();
    await this.genLoc(
      `//div[contains(@class,'product-item')] [ .//h2[normalize-space()='${product}']]//span[normalize-space()='Add to cart']`,
    ).click();
    await this.clickOnBtnWithLabel("Add to cart");
  }

  /**
   * xpath Item Product In Cart
   * @param product
   * @returns
   */
  xpathItemProductInMiniCart(product: string): string {
    return `//div[contains(@class,'absolute cart-drawer-container')]//a[normalize-space()='${product}']`;
  }

  /**
   * xpath Item Product In Cart Drawer
   * @param product
   * @returns
   */
  xpathItemProductInCartDrawer(product: string): string {
    return `${this.cartDrawer}//a[normalize-space()='${product}']`;
  }

  /**
   * xpath item Soldout Product
   * @param product
   * @returns
   */
  xpathItemSoldoutProduct(product: string): string {
    return `//section[@component='upsell-widget']//div[contains(@class,'product-item')] [ .//h3[normalize-space()='${product}']]//div[contains(@class,'item-sold-out')]`;
  }
}
