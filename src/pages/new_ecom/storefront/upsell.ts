import { Page, FrameLocator, BrowserContext, Locator, APIRequestContext, expect } from "@playwright/test";
import { SBPage } from "@pages/page";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { waitForImageLoaded } from "@utils/theme";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FixtureApi } from "@types";

export class UpSell extends SBPage {
  api: FixtureApi;
  public imagePlaceholder = ".base-upsell-img-placeholder";
  public accessoryFirstItemImgPlaceholder = `.VueCarousel-slide:nth-child(1) .accessory-product__item:nth-child(1) ${this.imagePlaceholder}`;
  public accessoryFirstItemImg =
    ".VueCarousel-slide:nth-child(1) .accessory-product__item:not([style*='display: none;']) .accessory-product__image";
  public accessoryFirstItemImgWithAttrs =
    ".VueCarousel-slide:nth-child(1) .accessory-product__item:nth-child(1) .accessory-product__image img[data-loaded='true']";
  public accessoryFirstItemAddCart =
    ".VueCarousel-slide:nth-child(1) .accessory-product__item:nth-child(1) .accessory-product__action button";
  public accessoryNavigation = ".block-accessory__navigation";
  public accessoryTitle = ".accessory-product__title";
  public accessoryStorefront = ".block-accessory";
  public accessoryBlock = "[component='accessory']";
  public accessoryMsg = ".block-accessory__message";
  public accessoryLoadMoreBtn = ".VueCarousel-slide:nth-child(1) .accessory-product__show-more";
  public upsellBtnClose = "button.upsell-dialog__close";
  public quickViewAddCartBtn = ".quick-view-dialog__add-to-cart";
  public quickViewDialog = ":is(.quick-view-dialog, .bundle-dialog)";
  public quickViewTitle = `${this.quickViewDialog} .qv-product__content h4`;
  public quickViewVariants = `${this.quickViewDialog} .qv-product__variants`;
  public quickViewThumbnailCarousel = `${this.quickViewDialog} .qv-product__preview-carousel`;
  public quickViewThumbnailCarouselPrev = `${this.quickViewThumbnailCarousel} button.VueCarousel-navigation-prev`;
  public quickViewThumbnailCarouselNext = `${this.quickViewThumbnailCarousel} button.VueCarousel-navigation-next`;
  public quickViewThumbnails = `${this.quickViewDialog} .qv-product__slide-image`;
  public quickViewThumbnailActive = `${this.quickViewThumbnails}.is-active`;
  public quickViewImagePrimary = `${this.quickViewDialog} .qv-product__preview img`;
  public quickViewTextField = `${this.quickViewDialog} .product-property__field input`;
  public quickViewTextarea = `${this.quickViewDialog} .product-property__field textarea`;
  quickViewRadioBtn = this.genLoc(this.quickViewDialog)
    .locator(".product-property__field .radio-group")
    .locator("label.s-radio");
  public quickViewMsgCustomOption = `${this.quickViewDialog} .product-property__field .custom-options-warning[msg-invalid="true"]`;
  public quickViewSizeGuide = `${this.quickViewDialog} .qv-product__size-guide`;
  public quickViewSizeChartMobile = `${this.quickViewDialog} .qv-product .upsell-size-chart`;
  public quickViewSizeChartDesktop = `${this.quickViewDialog} .qv-product + .upsell-size-chart`;
  imgSizeChart = `${this.quickViewSizeChartDesktop} img`;
  public addMoreItemBlock = "[component='add-more-item']";
  public widgetBlock = ".block-upsell-widget";
  public bundleBlock = "[component=bundle]";
  public bundleNavigation = `${this.bundleBlock} .block-bundle__nav-item`;
  public bundleHeading = `${this.bundleBlock} .block-bundle__heading`;
  public addCartBlock = ".block[component='button'] .wb-button--add-cart__container .btn-area";
  public progressBar = "#v-progressbar";
  public app = "#app";
  public cartItemsBlock = ".block-cart-items";
  public cartItem = ".product-cart";
  cartDetail = "[class*=product-cart__details]";
  cartBadge = ".product-cart__badge";
  public cartDrawerOverlay = "[id='popup-overlay-default_cart_drawer']";
  public insideCartDrawer = "[id='default_cart_drawer']";
  public outsideCartDrawer = ".section:not([id='default_cart_drawer'])";
  public cartAlert = "section > .upsell-cart__alert";
  public discountPrice = ".block-cart-summary__offer-icon + .block-cart-summary__price";
  public cartTotalPrice = "[component='cart-summary'] h6.block-cart-summary__price";
  public incartBlock = ".upsell-cart__offer";
  productCard = ".slider__container .product-card--image";
  increaseQuantity = ".button-quantity-container .button-quantity__layout-vertical__increase";
  sectionsInSF = this.genLoc("section[data-section-id]");
  rowsInSF = this.genLoc("div[data-row-id]");
  columnsInSF = this.genLoc("div[data-column-id]");
  blocksInSF = this.genLoc("section[data-block-id]");
  popup = this.genLoc("section.section-popup:not([data-section-id*=cart_drawer]) ");
  popupCloseBtn = this.popup.locator(".close-popup-button");
  bundleContentAlign = this.genLoc(".block-bundle__container>div").nth(0);
  currentBundles = "[role=tabpanel][class$=active]";
  bundleImages = ".block-bundle__images";
  bundleImage = ".block-bundle__image";
  bundleListProduct = ".block-bundle__product";
  bundleProduct = ".block-bundle__product-name";
  bundlePrice = ".block-bundle__product-price";
  bundleTotalPrice = ".block-bundle__total-price+div div.p2";
  bundleDiscount = ".block-bundle__discount";
  bundleCheckbox = "label.block-bundle__checkbox";
  bundleNavigationBtn = ".block-bundle__nav-item";
  bundleOfferHeading = ".block-bundle__heading";
  imageShape = "div.flex:has(.block-bundle__image)";
  productRecommendTitle = ".upsell-recommended__title";
  btnQuantityAdd = ".block-qty-discount__add";

  customizeProductPopup = this.genLoc(".upsell-dialog__content");
  customizePopupTitle = this.customizeProductPopup.locator(".bundle-dialog__title");
  customizePopupAlert = this.customizeProductPopup.locator(".bundle-dialog__alert");
  customizePopupSlideImg = this.customizeProductPopup.locator(".bundle-dialog__image");
  customizePopupBundleTotalPrice = this.customizeProductPopup.locator(".bundle-dialog__price-total");
  customizePopupBundleOriginalPrice = this.customizeProductPopup.locator(".bundle-dialog__price-original");
  currentProdInPopup = this.genLoc(".bundle-dialog__products .qv-product:not([style*=none])");
  buttonMobileInPopup = this.genLoc(".bundle-dialog__bottom");
  prodImgInPopup = this.currentProdInPopup.locator(".qv-product__image");
  prodTitleInPopup = this.currentProdInPopup.locator(".qv-product__content h4");
  prodRatingInPopup = this.currentProdInPopup.locator("[name=review]");
  ratingStar = this.prodRatingInPopup.locator(".block-rating-rv__star");
  ratingText = this.prodRatingInPopup.locator(".block-rating-rv__main").locator(".block-rating-rv__text");
  prodPriceInPopup = this.currentProdInPopup.locator(".qv-product__price .p1");
  prodOriginalPriceInPopup = this.currentProdInPopup.locator(".qv-product__price .qv-product__price-original");
  prodVariantsInPopup = this.currentProdInPopup.locator(".qv-product__variants");
  bundleWarningMsgCustomOption = this.currentProdInPopup.locator(".product-property__field .custom-options-warning");
  seeItemDetails = this.currentProdInPopup.locator(".qv-product__description a");
  nextProductBtn = this.currentProdInPopup.getByRole("button", { name: "Next product" });
  nextProductBtnMobile = this.buttonMobileInPopup.getByRole("button", { name: "Next product" });
  quickViewAddAllBtn = this.currentProdInPopup.getByRole("button", { name: "Add all to cart" });
  quickViewAddAllBtnMobile = this.buttonMobileInPopup.getByRole("button", { name: "Add all to cart" });
  checkCircle = ".bundle-dialog__valid i";
  bundleImagePlaceholder = ".base-upsell-img-placeholder";
  productCart = this.genLoc("div.product-cart");
  productCartContent = this.productCart.locator("div.product-cart__details-large");
  productCartDetail = this.productCart.locator("[class*=product-cart__details]");
  productCartImg = this.productCart.locator(".product-cart__image-small");
  bundlesAnalytics = this.genLoc(".usell-analytics");
  prePurchaseCartPrice = ".pre-purchase-dialog__cart-price .p2";
  priceProduct = ".upsell-recommended__price .p2";
  rowPerPage = this.genLoc("[class=pagination__container] select");
  btnAccessories = ".accessory-product__action .btn-secondary";
  imageProduct = ".search-result__product--image > img";
  resultItemBlock = "div.search-result__product--name";
  collectionTabLink = "div.search-result ul li:nth-child(2)";
  resultProductItemArea = ".search-result__product--items";
  qtyItemBlock = "//div[@class='d-flex relative']";
  deleteIconQty = "form i";
  deleteIconSelector = "span.icon-delete";
  deleteIcon = "i.mdi-delete-outline";
  qtyMinOneInput = "#input-min-quantity-1";
  qtyValueOneInput = "#input-value-discount-1";
  qtyMinThreeInput = "#input-min-quantity-3";
  qtyValueThreeInput = "#input-value-discount-3";
  navigateStorefontBtn = ".create-offer-success__footer button span";
  bundleItemBlock = "div.bundle-shortcut div.product-card";
  errorClass = "div.message-red";
  selectedBundleBlock = "div.bundle-shortcut div.product-card div.product-card--selected";
  closeSelectedBundleBlockIcon = "div.bundle-shortcut div.recommend-products--item:nth-child(1) span.close-icon ";
  selectedTargetProduct = "div.target-item-container__title";
  discountCheckbox = "div.usell-discount input[type='checkbox']";
  clearSearchbarIcon = "div.upsell-home__search-result button.usell-product-search-remove";
  accessoriesItemBlock = "div.accessories-shortcut div.product-card";
  accessoriesEnableBtn = "div.accessories-shortcut div.card__body--enable-button";
  errorToastMessage = '.s-toast:has-text("Please select at least one product")';
  selectedAccessoriesProduct = "div.accessories-shortcut div.product-card div.product-card--selected";
  unSelectedProduct = "div.accessories-shortcut div.recommend-products--item:nth-child(1) span.close-icon";
  modalBody = ".s-modal-body";
  selectedProductAtModal = ".product-selected-inner .products-name";
  closeModalIcon = "button.s-modal-close";
  selectedProductModal = ".product-selector-modal";
  resultProductItem = "div.pre-purchase-shortcut div.product-card";
  emptySelectedItemElement = "div.s-toast";
  postPurchaseProduct = ".recommend-products  .selected-item-container__img-container";
  closeSelectedItemBtn = "div.pre-purchase-shortcut div.recommend-products--item:nth-child(1) span.close-icon ";
  resultItemPostPurchase = "div.post-purchase-shortcut div.product-card";
  closeSelectedItemBtnPostPurchase =
    "div.post-purchase-shortcut div.recommend-products--item:nth-child(1) span.close-icon ";
  targetProductModal = ".recommend-product__container .choose-product__container button";
  discountSectionAtOfferDetail = 'div.usell-discount input[type="checkbox"]';
  recommendModal = ".s-modal button.s-modal-close";
  quicklyBtnPostPurchase =
    ".post-purchase-shortcut .create-offer-success__content span:has-text('Quickly create another offer')";
  rightPostPurchaseBlock = ".post-purchase-shortcut .card__body--right";
  rightPrePurchaseBlock = ".pre-purchase-shortcut .card__body--right";
  quicklyBtnPrePurchase =
    ".pre-purchase-shortcut .create-offer-success__content span:has-text('Quickly create another offer')";

  originPriceProduct = ".upsell-recommended__price-original";
  public ctaButtonPrePurchase = ".wb-button--add-cart__primary:has-text('CTA BUTTON')";
  public prePurchaseDialog = ".pre-purchase-dialog__container";
  public prePurchaseBtnAddCart = ".upsell-recommended__actions button";
  public cartDrawerContainer = ".cart-drawer-container:nth-of-type(2)";
  public prePurchaseCart = ".pre-purchase-dialog__cart";
  public upsellRecommend = ".pre-purchase-dialog__recommend .upsell-recommended";
  public prePurchaseFirstItemImgWithAttrs =
    ".pre-purchase-dialog__container .pre-purchase-dialog__products .upsell-recommended:nth-child(1) img";
  public cartDrawerContainerImgWithAttrs =
    ".cart-drawer-container .cart-drawer-wrapper .product-cart-wrapper > div:nth-child(1) > .product-cart__image img";
  public productXpath = ".container div .block-cart-items .product-cart input";
  public offerDiscountXpath = ".container div .block-cart-summary .block-cart-summary__price:nth-of-type(1)";
  public productDXpath = ".container div .block-cart-items .product-cart input >> nth=0";
  public productSelectCustomOption = ".product-custom-option .custom-select";
  public productCustomOptionSelected = ".product-custom-option .custom-select .selected";
  public productSelectOptions = ".product-custom-option .custom-select .options";
  public blockCartIcon = "div.block-cart__icon";
  prePurchaseAddCartBtnByProductName(productName: string) {
    return `//a[text()='${productName}']//ancestor::div[contains(@class,'upsell-recommended')]/div[@class='upsell-recommended__actions']`;
  }
  inputQuantityProductByNameAtCart(productName: string) {
    return `//a[text()='${productName}']//ancestor::div[contains(@class,'product-cart__details-large')]//input`;
  }

  selectCustomOptionByProductName(productName: string) {
    return `//a[text()='${productName}']/following-sibling::div/a[text()='Select custom option']`;
  }

  hideCustomOptionByProductName(productName: string) {
    return `//a[text()='${productName}']/following-sibling::div/a[text()='Hide custom option']`;
  }

  inputCustomOptionByProductName(productName: string) {
    return `//a[text()='${productName}']/following-sibling::div//input`;
  }

  prePurchaseByProductName(productName: string) {
    return this.upsellRecommend + `:has-text('${productName}')`;
  }
  constructor(page: Page, domain?: string, api?: FixtureApi) {
    super(page, domain);
    this.api = api;
  }

  /**
   * Open product page from web builder
   * @param page
   * @param context
   * @returns
   */
  async gotoProductPage(page: Blocks, context: BrowserContext): Promise<Page> {
    const url = await page.frameLocator.locator("body").evaluate(el => {
      const state = JSON.parse(el.querySelector("#__INITIAL_STATE__").textContent);
      const url = new URL(`https://${state.host}${state.url}`);
      const params = new URLSearchParams(url.search);
      params.append("theme_preview_id", `${state.previewId}`);
      params.delete("preview");
      return `${url.origin}${url.pathname}?${params.toString()}`;
    });
    const storefront = await context.newPage();
    await storefront.goto(url);
    return storefront;
  }

  async waitForTrackingViewOfferBundle() {
    await this.page.waitForResponse(res => res.url().includes("products_v2.json") && res.status() === 200);
    await this.page.waitForResponse(res => res.url().includes("actions.json") && res.status() === 200);
  }

  /**
   * Open upsell offer từ dashboard
   * @param type
   * @param offerId
   */
  async openCrossSellOffer(type: string, offerId: number): Promise<void> {
    const db = new DashboardPage(this.page, this.domain);
    const submenu = db.genLoc(".sidebar-menu-spds").getByRole("listitem").filter({ hasText: "Cross-sell" });
    await db.navigateToMenu("Apps");
    await db.genLoc(".block .app-name").filter({ hasText: "Boost Upsell" }).click();
    await db.page.waitForURL(/boost-upsell/);
    await submenu.click();
    await submenu.getByRole("listitem").filter({ hasText: type }).click();
    await this.rowPerPage.selectOption("500");
    await db
      .genLoc(".offer-name")
      .getByRole("link")
      .and(db.genLoc(`[href*="${offerId}"]`))
      .click();
    await db.page.waitForURL(new RegExp(offerId.toString()));
  }

  /**
   * Hàm verify performance bundles offer
   * @param type: thông số cần check
   * @param expected : Giá trị mong muốn
   * @param timeout : thử cập nhật trong vòng bao lâu, mặc định là 60s
   */
  async verifyBundlesPerformance(
    type: "View" | "Sales" | "Checkout success" | "Conversion rate" | "Add to cart",
    expected: number,
    timeout = 65_000,
  ): Promise<void> {
    const softAssertion = expect.configure({ soft: true });
    const loc = this.bundlesAnalytics.getByRole("listitem").filter({ hasText: type });
    await softAssertion
      .poll(
        async () => {
          const offerText = await loc.innerText();
          if (!offerText.includes(`${expected}`)) {
            await this.page.reload();
            return false;
          } else {
            await expect(loc).toContainText(`${expected}`);
            return true;
          }
        },
        { timeout: timeout, intervals: [5_000, 10_000] },
      )
      .toBeTruthy();
  }

  /**
   * Tương tự hàm trên dùng để check analytics trong dashboard
   * @param type
   * @param expected
   * @param timeout
   */
  async verifyAnalyticsOfBoostUpsell(
    type: "Total sales" | "Total orders",
    expected: string,
    timeout = 65_000,
  ): Promise<void> {
    const softAssertion = expect.configure({ soft: true });
    const loc = this.genLoc(".analytic-db-layout .layout-item")
      .filter({
        has: this.page.getByRole("heading").filter({ hasText: type }),
      })
      .locator("h2");
    await softAssertion
      .poll(
        async () => {
          const analyticText = await loc.innerText();
          if (analyticText !== expected) {
            await this.page.reload();
            return false;
          } else {
            return true;
          }
        },
        { timeout: timeout, intervals: [5_000, 10_000] },
      )
      .toBeTruthy();
  }
  /**
   * Click add to cart button from accessories
   * @param page
   * @param context
   * @param upsell
   * @param isAddCart
   * @returns
   */
  async onAddProductFromQuickView(page: Blocks, context: BrowserContext, upsell: UpSell): Promise<Page> {
    const storefront = await this.gotoProductPage(page, context);
    await storefront.locator(upsell.accessoryFirstItemImgWithAttrs).waitFor({ state: "visible" });
    await waitForImageLoaded(storefront, upsell.accessoryFirstItemImg);
    await storefront.locator(upsell.accessoryFirstItemAddCart).click();
    await storefront.locator(upsell.quickViewAddCartBtn).click();
    await storefront.waitForSelector(upsell.quickViewDialog, { state: "detached" });
    return storefront;
  }

  /**
   * Get xpath heading widget
   * @param text
   */
  getXpathHeadingWidget(text: string): Locator {
    return this.page.getByRole("heading", { name: text });
  }

  /**
   * Get xpath product title widget
   * @param index
   * @param xpathParent
   */
  getXpathProductTitleWidget(index: number, xpathParent = ""): Locator {
    let rootSelector = this.widgetBlock;
    if (xpathParent) {
      rootSelector = `${xpathParent} ${rootSelector}`;
    }

    return this.genLoc(`${rootSelector} .VueCarousel-slide:nth-child(${index}) .product-card__name .name`);
  }

  /**
   * Hàm verify analytic upsell on onboarding upsell
   * @param type: thông số cần check
   * @param expected : Giá trị mong muốn
   */
  async verifyAnaOfOnboardingUpsell(
    type: "Total Sales from Upsells" | "Total Orders with Upsells" | "Average Order Items with Upsells",
    expected: number,
  ): Promise<void> {
    const loc = this.page.locator(`//p[normalize-space()='${type}']//preceding-sibling::h3`);
    const analyticText = await loc.innerText();
    const numberAnalytic = parseFloat(analyticText.replace("$", "").replace(",", ""));
    expect(numberAnalytic).toEqual(expected);
  }

  /**
   * Get selected product on onboarding upsell
   * @param title
   * @returns
   */
  getSelectedProduct(title: string): string {
    return `.recommend-products  .selected-item-container__img-container img[title^="${title}"]`;
  }

  /**
   * navigate to upsell dashboard page
   */
  async gotoUpsellDashboard() {
    await this.page.goto(`https://${this.domain}/admin/apps/boost-upsell/`);
    await this.page.waitForLoadState("load");
  }

  /**
   * handle search bar
   * @param searchText
   */
  async handleSearchBar(searchText = "") {
    await this.page.getByPlaceholder("Search the Product or Collection").click();
    await this.page.getByPlaceholder("Search the Product or Collection").fill(searchText);
    await this.page.getByPlaceholder("Search the Product or Collection").press("Enter");
  }

  /**
   * Get xpath product image widget
   * @param index
   * @param xpathParent
   */
  getXpathProductImageWidget(index: number, xpathParent = ""): string {
    let rootSelector = this.widgetBlock;
    if (xpathParent) {
      rootSelector = `${xpathParent} ${rootSelector}`;
    }

    return `${rootSelector} .VueCarousel-slide:nth-child(${index}) .product-card__wrap-img img`;
  }

  /**
   * Wait response show quickview
   * @param hasBundle
   */
  async waitResponseShowQuickview(hasBundle = false): Promise<void> {
    const promises = [this.waitResponseWithUrl("/api/recsys/co-bought.json")];
    if (hasBundle) {
      promises.push(this.waitResponseWithUrl("api/offers/products_v2.json"));
    }
    await Promise.all(promises);
  }

  /**
   * Wait for cart item visible
   */
  async waitCartItemVisible(): Promise<void> {
    await this.genLoc(`:nth-match(${this.outsideCartDrawer} ${this.cartItemsBlock} ${this.cartItem}, 1)`).waitFor({
      state: "visible",
    });
  }

  /**
   * Get selector image bunlde
   * @param indexSlide
   * @param indexImage
   * @param xpathParent
   * @returns
   */
  getSelectorImageBundle(indexSlide = 1, indexImage = 1, xpathParent = ""): string {
    let xpathImage = `${this.bundleBlock} .VueCarousel-slide:nth-child(${indexSlide}) .block-bundle__images div:nth-child(${indexImage}) .block-bundle__image`;
    if (xpathParent) {
      xpathImage = `${xpathParent} ${xpathImage}`;
    }

    return xpathImage;
  }

  /**
   * Get selector image bunlde
   * @param indexSlide
   * @param indexTitle
   * @param xpathParent
   * @returns
   */
  getSelectorProductTitleBundle(indexSlide = 1, indexTitle = 1, xpathParent = ""): string {
    let xpathProductTitle = `${this.bundleBlock} .VueCarousel-slide:nth-child(${indexSlide}) .block-bundle__product:nth-child(${indexTitle}) .block-bundle__product-name--normal`;
    if (xpathParent) {
      xpathProductTitle = `${xpathParent} ${xpathProductTitle}`;
    }

    return xpathProductTitle;
  }

  /**
   * Get selector heading in cart offer
   * @param index
   * @param xpathParent
   * @returns
   */
  getSelectorHeadingInCart(index: number, xpathParent = ""): string {
    let xpathItem = this.cartItemsBlock;
    if (xpathParent) {
      xpathItem = `${xpathParent} ${xpathItem}`;
    }

    return `:nth-match(${xpathItem} ${this.cartItem}, ${index}) + ${this.incartBlock} .upsell-cart__offer-message`;
  }

  /**
   * Get selector product title in cart offer
   * @param index
   * @param xpathParent
   * @returns
   */
  getSelectorPrdTitleInCart(index: number, xpathParent = ""): string {
    let xpathItem = this.cartItemsBlock;
    if (xpathParent) {
      xpathItem = `${xpathParent} ${xpathItem}`;
    }

    return `:nth-match(${xpathItem} ${this.cartItem}, ${index}) + ${this.incartBlock} .upsell-cart__offer-title`;
  }

  /**
   * Get selector product price in cart offer
   * @param index
   * @param isPriceOriginal
   * @param xpathParent
   * @returns
   */
  getSelectorPrdPriceInCart(index: number, isPriceOriginal = false, xpathParent = ""): string {
    let xpathItem = this.cartItemsBlock;
    if (xpathParent) {
      xpathItem = `${xpathParent} ${xpathItem}`;
    }

    const selector = `:nth-match(${xpathItem} ${this.cartItem}, ${index}) + ${this.incartBlock} .upsell-cart__offer-content`;
    if (isPriceOriginal) {
      return `${selector} span.upsell-cart__offer-price-original`;
    }

    return `${selector} span:not(.upsell-cart__offer-price-original)`;
  }

  /**
   * Get selector button add cart in cart offer
   * @param index
   * @param xpathParent
   * @returns
   */
  getSelectorAddCartInCart(index: number, xpathParent = ""): string {
    let xpathItem = this.cartItemsBlock;
    if (xpathParent) {
      xpathItem = `${xpathParent} ${xpathItem}`;
    }

    return `:nth-match(${xpathItem} ${this.cartItem}, ${index}) + ${this.incartBlock} .upsell-cart__offer-action .upsell-cart__offer-add-cart`;
  }

  /**
   * Get selector variant quickview
   * @param indexOption
   * @param indexVariant
   * @returns
   */
  getSelectorVariantQuickview(indexOption: number, indexVariant: number): string {
    return `${this.quickViewVariants} .upsell-product-options:nth-child(${indexOption}) .upsell-product-options__value:nth-child(${indexVariant})`;
  }

  /**
   * Get selector Block add more item
   * @param index
   * @returns
   */
  getSelectorAddMoreItem(index: number): string {
    return `:nth-match(${this.cartItemsBlock} ${this.cartItem} ${this.addMoreItemBlock}, ${index})`;
  }

  /**
   * Get name image from url
   * @param selector
   * @returns
   */
  async getNameImageFromUrl(selector: string): Promise<string> {
    return (await this.genLoc(selector).getAttribute("src")).split("@").pop();
  }

  /**
   * Click button add to cart from widget by index
   * @param index
   * @param xpathParent
   */
  async onClickAddCartFromWidget(index: number, xpathParent = ""): Promise<void> {
    let xpathItem = `${this.widgetBlock} .VueCarousel-slide:nth-child(${index})`;
    if (xpathParent) {
      xpathItem = `${xpathParent} ${xpathItem}`;
    }

    await this.genLoc(`${xpathItem} .product-card--assets`).hover();
    await this.genLoc(`${xpathItem} .product-card__btn .btn-area`).click();
  }

  /**
   * Click next thumbnail quickview
   */
  async onClickThumnailQuickview(): Promise<void> {
    await this.genLoc(`${this.quickViewThumbnailActive} + .qv-product__slide-image`).click({
      position: { x: 10, y: 10 },
    });
  }

  /**
   * Click button add cart in quickview
   */
  async onClickAddCartQuickview(): Promise<void> {
    await this.genLoc(`${this.quickViewDialog} ${this.quickViewAddCartBtn} button`).click();
  }

  /**
   * Click to image bundle
   * @param indexSlide
   * @param indexImage
   * @param xpathParent
   */
  async onClickImageBundle(indexSlide = 1, indexImage = 1, xpathParent = ""): Promise<void> {
    await this.genLoc(this.getSelectorImageBundle(indexSlide, indexImage, xpathParent)).click();
  }

  /**
   * Select variant bundle
   * @param index
   * @param value
   * @param xpathParent
   */
  async onSelectVariantBundle(indexSlide: number, index: number, value: string, xpathParent = ""): Promise<void> {
    let rootSelector = this.bundleBlock;
    if (xpathParent) {
      rootSelector = `${xpathParent} ${rootSelector}`;
    }

    await this.genLoc(
      `${rootSelector} .VueCarousel-slide:nth-child(${indexSlide}) .block-bundle__products .block-bundle__product:nth-child(${index}) .block-bundle__product-select select`,
    ).selectOption(value);
  }

  /**
   * Click button add cart bundle
   * @param indexSlide
   * @param xpathParent
   */
  async onClickAddCartBundle(indexSlide: number, xpathParent = ""): Promise<void> {
    let rootSelector = this.bundleBlock;
    if (xpathParent) {
      rootSelector = `${xpathParent} ${rootSelector}`;
    }

    await this.genLoc(
      `${rootSelector} .VueCarousel-slide:nth-child(${indexSlide}) .block-bundle__container button.block-bundle__button`,
    ).click();
  }

  /**
   * Click icon cart block
   */
  async onClickCartIcon(): Promise<void> {
    await this.genLoc(".block[component='cart'] .block-cart-property").click();
  }

  /**
   * Handle request api update offer
   * @param api
   * @param conf
   * @param data
   */
  async requestUpdateOffer(params: {
    api: APIRequestContext;
    shop_id: number;
    domain: string;
    id: number;
    data: Record<string, unknown>;
  }) {
    const response = await params.api.get(
      `https://${params.domain}/admin/offers/${params.id}.json?shop_id=${params.shop_id}`,
    );
    let jsonResponse = await response.json();
    jsonResponse = Object.assign({}, jsonResponse, params.data);
    await params.api.put(`https://${params.domain}/admin/offers/${params.id}.json?shop_id=${params.shop_id}`, {
      data: jsonResponse,
    });
  }

  /**
   * Click choose variant in quickview
   * @param indexOption
   * @param indexVariant
   */
  async onClickVariantQuickview(indexOption: number, indexVariant: number): Promise<void> {
    await this.genLoc(this.getSelectorVariantQuickview(indexOption, indexVariant)).click();
  }

  /**
   * Handle click increase or decrease qty in cart
   * @param index
   * @param value
   * @param xpathParent
   */
  async onClickQtyInCart(index: number, value = "0", xpathParent = ""): Promise<void> {
    let xpathItem = this.cartItemsBlock;
    if (xpathParent) {
      xpathItem = `${xpathParent} ${xpathItem}`;
    }

    await this.genLoc(`:nth-match(${xpathItem} ${this.cartItem}, ${index}) .product-cart__quantity input`).fill(value);
  }

  /**
   * Lấy giá trị total sales hoặc total orders trong dashboard analytics
   * @param type
   * @returns
   */
  async getAnalytics(type: "Total sales" | "Total orders"): Promise<number> {
    const loc = this.page
      .locator(".layout-item")
      .filter({ has: this.page.getByRole("heading", { name: type, exact: true }) })
      .locator(".line-chart")
      .getByRole("heading");
    let getText = await loc.innerText();
    let toNumber = parseFloat(getText.replace("$", ""));
    if (toNumber === 0) {
      await Promise.all([this.page.reload(), this.page.waitForResponse(/analytics.json/)]);
      getText = await loc.innerText();
      toNumber = parseFloat(getText.replace("$", ""));
    }
    return toNumber;
  }

  /**
   * Sometimes the product order is incorrect, so it is necessary to sort the positions before verify snapshot
   * Example: list product api response #5, #4 need sort order #4, #5
   * @param page
   * @param sectionId
   */
  async sortProductAccessories(page: Page | FrameLocator, sectionId: string) {
    const productTitle = await page
      .locator(`:nth-match(section[id="${sectionId}"] .accessory-product__item ${this.accessoryTitle}, 1)`)
      .textContent();
    if (productTitle.includes("#5 Summer")) {
      await page.locator("#app").evaluate(() => {
        const items = document.querySelector(".accessory-product__items");
        const nodes = items.childNodes;
        const nodesArr = [];
        for (const nodeIndex in nodes) {
          if (nodes[nodeIndex].nodeType == 1) {
            nodesArr.push(nodes[nodeIndex]);
          }
        }
        nodesArr.sort(() => -1);
        for (let nodeIndex = 0; nodeIndex < nodesArr.length; ++nodeIndex) {
          items.appendChild(nodesArr[nodeIndex]);
        }
        return Promise.resolve();
      });
    }
  }

  /**
   * Reload iframe when offer not show
   * @param page
   * @param selector
   */
  async reloadFrameWhenOfferNotShow(page: Blocks, selector: string) {
    try {
      await expect(async () => {
        await page.frameLocator.locator(selector).waitFor({ state: "visible" });
        return Promise.resolve();
      }).toPass({ timeout: 5000 });
    } catch (error) {
      await page.frameLocator.locator(this.app).evaluate(() => {
        window.location.reload();
        return Promise.resolve();
      });
      await page.frameLocator.locator(selector).waitFor({ state: "visible" });
      await page.frameLocator.locator(selector).click();
    }
  }
}
