import { APIRequestContext, expect, Locator, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import { SFCart } from "@sf_pages/cart";
import { SFCheckout } from "./checkout";
import type { customOptionProductSF, DescriptionInsert, filterReview, VaraintProduct } from "@types";
import { waitForImageLoaded } from "@utils/theme";

export class SFProduct extends SBPage {
  xpathProductDivFirst =
    '(//div[contains(@class,"product-col")])[1] | (//div[contains(@class,"collection-product-wrap")])[1]';
  xpathSortList = '//div[@data-id="collection_page"]//select[contains(@class,"base-select")]';
  xpathProcessImage = "//div[@class='mt8 upload-progress']";
  xpathImageLoad =
    "(//div[@class='product-image-preview loading-spinner'] | //div[@class='product-image-preview']/following-sibling::div[@class='loading-spinner'])[1]";
  xpathIconLoadImage =
    "(//section[@data-id='product']//div[@class='product-image-preview loading-spinner' or @class='loading-spinner'] " +
    "| //section[@data-id='product']//img[@class='image sb-lazy loading base-picture__img' or contains(@class,'image sb-lazy loading')])[1]";
  xpathBtbClose = "//div[contains(@class,'modal__body__icon-close')]";
  xpathImageActive =
    "(//div[contains(@class,'media-gallery-carousel__slide-active')]//img | //div[contains(@class,'VueCarousel-slide-active')]//img)[1]";
  xpathAllCustomOption = "//div[@id='detail-contents']//div[@class='product-property product-custom-option mb16']";
  xpathProductVariant = ".product__variants";
  xpathTitleCustomerReview = "//h3[normalize-space()='CUSTOMER REVIEW']";
  filterRview = "//div[contains(@class,'rv-filter') or contains(@class,'block-review__filter-container')]//span";
  reviewCardGrid = "//div[contains(@class,'layout-grid-resize__item')]";
  xpathBaseSizeChart = "//div[contains(@class, 'modal__body__content')]//select";

  xpathImagePreviewFullSize = "//div[@class='product-image-preview']//img[@alt='Preview image']";
  xpathLoadCustom =
    "//div[contains(@class,'media-gallery-carousel__slide-active') or contains(@class,'VueCarousel-slide-active')]//div[@class='preview-overlay custom-options-loading']";
  xpathPopoverCrop = "//div[@id='modal-common']//div[@class='inside-modal__body popover-bottom__content relative']";
  xpathImageViewSF = "//div[@class='media-gallery-carousel mb12 product-slider media-gallery-carousel--loaded']";
  xpathImageThumbnail = "(//img[contains(@id,'image-')])";
  xpathBtnCrop = "//div[@id='modal-common']//button[contains(text(),'Crop')]";
  xpathBoxChooseFile = "//div[@class='upload-box-wrapper']";
  xpathZoomIn = "//div[@class='zoom-container w-100 mt20']//span[1]";
  xpathBtnCloseImageThumbnail = "//div[@class='thumbnail-media-zoom__close']";
  id: number;
  name: string;
  priceStorefront: number;
  quantity: number;
  priceDashboard: number;
  xpathProductDescription =
    "((//div[contains(@class, 'product_collapse')])[1]//parent::div)[1] | //div[@class='s-tabs']";
  xpathProductMockupSlide =
    "//div[contains(@class, 'VueCarousel thumbnail-carousel')] | //ul[contains(@class, 'media-gallery-carousel__thumbs')]";
  xpathDescriptionIframe = "//div[@class='product__description-html']//iframe";
  variantIBtn = "//div[@class='product__variant-button']//img";
  xpathProductMediaGallery = "(//div[contains(@class,'media-gallery')])[1]";
  productCustomOption = "//div[contains(@class,'product-custom-option')]/parent::div";
  xpathProductMockup =
    "//div[contains(@class, 'VueCarousel-slide relative thumbnail-carousel-slide')]//img " +
    "| //li[contains(@class, 'media-gallery-carousel__thumb pointer')]//img " +
    "| //li[contains(@class, 'list-style-none media-gallery-carousel__thumb')]//img";
  xpathCloseImageZoom = "//div[@class='thumbnail-media-zoom__close']";
  xpathProductImageGallery = "//div[@id='product-image-gallery']";
  xpathLineItemInCart = "//h1[normalize-space()='Cart']//parent::div//div[@class='product-cart-wrapper']";
  xpathProductSectionDetail = "//section[contains(@class,'product section')]//div[@class='row']";
  xpathIconloadVariant =
    "(//div[contains(@class,'product__variant-button')]//img[contains(@class,'image sb-lazy loading')])[1]";
  xpathTitleCollectionDetail = "//div[@class='container collection-detail']//h1";
  xpathCustomOptionSF = "//div[@class='product-property__field']";
  xpathProductExampleInCollection = '//div[@data-id="collection_page"]//a[@target="_blank"]';
  xpathDescription = "//div[@class='product__description-html']";
  xpathTrustBadgeImg = '//img[contains(@alt,"Trust badge")]';
  xpathBtnAddToCart = "//span[normalize-space()='Add to cart']";
  xpathVariantsSelector = "//div[contains(@class,'variants-selector')]";
  xpathImageMockupError =
    "(//div[contains(@class, 'VueCarousel-slide relative thumbnail-carousel-slide')]//img[@class= 'image sb-lazy error'] " +
    "| //li[contains(@class, 'media-gallery-carousel__thumb pointer')]//img[@class= 'image sb-lazy error'] " +
    "| //li[contains(@class, 'list-style-none media-gallery-carousel__thumb')]//img[@class= 'image sb-lazy error'])[1]";
  xpathProductMockupActive =
    "//div[contains(@class, 'VueCarousel-slide thumbnail-carousel-slide--active relative thumbnail-carousel-slide')]//img";
  xpathProductsIncart = "//div[contains(@class,'product-cart-wrapper')]";
  xpathBtnInSizeGuidePopup = "//div[contains(@class,'product__size-chart__tab__item')]";
  xpathBtnInch = "//div[normalize-space()='Inch']";
  xpathPriceOnSF =
    "(//*[following-sibling::span[contains(@class,'product__price')] or contains(@class,'product__price ')])[1]";
  xpathProductVendor = "//p[contains(@class,'product__vendor')]//a";
  xpathVideoUrlInMedia = '//div[@role="tabpanel"]/iframe';
  xpathThumbnailOfMedia = '//*[contains(@class, "thumbnail-carousel")]//img';
  xpathBtnNextImagePreview = "//div[@class='VueCarousel VueCarousel-button']//button[@aria-label='Next page']";
  xpathCustomOptionLoad = "//div[@class='preview-overlay custom-options-loading']";
  xpathButtonPreview = "//button[normalize-space()='Preview your design']";
  xpathClosePreview = "//div[@class='roller-modal__body']//div[@class='roller-modal__body__icon-close']";
  xpathPreview = "//div[@class='roller-modal__body']";
  xpathListCustomOption = ".product-property";
  increaseQtt = "(//div[contains(@class, 'button-quantity__layout-vertical__increase')])[1]";
  subTotal = "//h6[contains(@class, 'cart__subtotal-price')]";
  constDiscountInCart = "(//p[contains(@class,' product-cart__price')]//span)[1]";
  xpathUpsellQttStf = "//div[@class='upsell-quantity__discounts']";
  msgQttDiscountsStf = "//div[contains(@class, 'upsell-quantity__title')]";
  offerQttDicountsStf = "//div[@class='upsell-quantity__discount-text']";
  discountInCart = "//p[contains(@class, 'subtle cart-total-discount')]";
  xpathPreviewDesignButton = "//button//span[text()[normalize-space() = 'Preview your design']]";
  xpathEtaShippingTime = "//div[contains(@class,'eta-delivery')]//span[@class='text-bold']";
  xpathEtaShippingDestination = "//div[contains(@class,'eta-delivery')]//span[@class='eta-delivery__note']";
  xpathNameProduct = "//h1[contains(@class,'product__name-product')]";
  xpathLivePreviewV3 = {
    product: {
      galleryImage: "(//div[contains(@class,'media-gallery-wrapper')])[1]//img",
    },
  };
  xpathCloseCartDrawlIcon = "//div[contains(@class,'cart-drawer-icon-close')]";
  xpathVariantAndCOProduct =
    "(//div[contains(@class,'product__detail-contents')]//div[contains(@class,'product__variants product__variants-hover')]//parent::div)[1]";
  vendorLocator = this.page.locator("(//p[contains(@class, 'product__vendor')])//a");
  typeLocator = this.page.locator("//p[contains(text(), 'Type: ')]//a");
  xpathSizeGuideHyperlink = "//label[normalize-space()='Size Guide']";
  xpathLastProductInCart =
    "(//div[contains(@class, 'product-cart-wrapper')]/div[contains(@class, 'product-cart')])[last()]";
  xpathSiteNav = "//ul[contains(@class,'site-nav')]";
  xpathProductTags = "//p[contains(text(), 'Categories: ')]";
  xpathMiniCart = "//a[contains(@class, 'mini-cart')]";
  xpathLabelvariant = "//div[contains(@class,'product__variant-label')]//label";
  selectMainSF = ".layout-desktop";
  xpathBtnBuyWithPaypal = `[class$=paypal-product__button]`;
  xpathPageCheckoutLoadDisable = "#checkout-layout-loader[style*='display: none;']";
  xpathCheckoutLayout = "//*[@id='checkout-layout']";
  selectorCustomOptionmsg = '.product-custom-option [msg-invalid="true"]';
  suggestedAccessories = this.genLoc("[class=upsell-accessory-products__content]");
  singleAccessory = this.suggestedAccessories.locator("[class$=accessory-products__single]");
  quickviewUpsell = this.genLoc(".upsell-quick-view__container");
  variantsQuickview = this.quickviewUpsell.locator(".upsell-product-variants-wrapper");
  variantOptions = this.genLoc(".upsell-product-option");
  quickviewAddToCartBtn = this.quickviewUpsell.getByRole("button");
  widgetBestSeller = this.genLoc("[class*=widget_setting_best_seller]");
  bestSellerProducts = this.widgetBestSeller.locator("[class^=upsell-widget-product]");
  productSizeGuide = this.genLoc(".product__size-guide");
  closeQuickviewBtn = this.genLoc(".upsell-modal__close");
  quickviewSizeChart = this.genLoc(".qv-size-chart");
  quickviewSelectBase = this.genLoc(".upsell-select select");
  quickviewProductInfo = this.quickviewUpsell.locator(".upsell-quick-view__block-right");
  quickviewProductImg = this.quickviewUpsell.locator(".upsell-quick-view__block-left");
  footerSectionV2 = this.genLoc("footer.footer-section");
  quickviewSizeChartImg = ".qv-size-chart__image img";
  quickviewRecommended = this.quickviewUpsell.locator(".upsell-product-widget");
  quickviewRecommendedProducts = this.quickviewRecommended.locator(".upsell-widget-product");
  productCarouselQuickview = "#product-image-carousel";
  productImgCarouselQuickview = this.quickviewUpsell.locator("#product-image-carousel");
  thumbnailImg = this.productImgCarouselQuickview.locator(".product-slide-image");
  quickviewPreviewImg = this.quickviewUpsell.locator(".preview-image img");
  bundleOffer = this.genLoc("section[type=bundle]");
  bundleProductImg = this.bundleOffer.locator(".bundle__offer-image img");
  quickviewCustomOptions = this.quickviewUpsell.locator(".upsell-custom-option");
  customOptionTextarea = this.quickviewCustomOptions.locator("[class$=__textarea]");
  customOptionName = this.genLoc(".upsell-custom-option__label-name");
  validateMsg = ".upsell-msg-validate";
  cartDrawer = this.genLoc(".cart-drawer-container");
  productsCart = this.cartDrawer.locator("div.product-cart");
  productInfo = this.genLoc("#detail-contents");
  quickviewBundleOffer = this.quickviewUpsell.locator("section[type=bundle]");
  quickviewBundles = this.quickviewBundleOffer.locator(".bundle__offer-container");
  quickviewBundleProdImg = this.quickviewBundleOffer.locator(".bundle__offer-image img");
  bundleHeading = ".bundle__offer-heading";
  xpathPriceProductInCartDrawer = "//div[contains(@class, 'cart-drawer-wrapper')]//span";
  xpathProductDetailV3 = {
    price: `//section[@component="price"]//span[contains(@class,'price-span')]`,
    comparePrice: `//section[@component="price"]//span[contains(@class,'price-original')]`,
  };

  imageSizeChartByName(name: string) {
    return this.quickviewSizeChart.locator(`//img[contains(@src,'${name}')]`);
  }

  tabSizeChart = this.quickviewSizeChart.locator(".qv-size-chart__tab");
  tableSizeChart = this.quickviewSizeChart.locator(".qv-size-chart__table");
  xpathBlockRatingReview = "//div[contains(@class,'block-rating-rv hover-for-details')]";
  xpathVariantColor =
    "//div[contains(@class,'product__variants-wrapper') and descendant::span[contains(text(), 'Color')]]";
  xpathVariantStyle =
    "//div[contains(@class,'product__variants-wrapper') and descendant::span[contains(text(), 'Style')]]";
  xpathVariantSize =
    "//div[contains(@class,'product__variants-wrapper') and descendant::span[contains(text(), 'Size')]]";

  constructor(
    page: Page,
    domain: string,
    productName?: string,
    priceStorefront?: number,
    quantity?: number,
    id?: number,
  ) {
    super(page, domain);
    this.name = productName;
    this.quantity = quantity;
    this.priceStorefront = priceStorefront;
    this.id = id;
  }

  locatorVariant(variantValue: string): string {
    return `//button[contains(text(),'${variantValue}')]`;
  }

  // get xpath thumbnail image of product with index
  getXpathThumbnailWithIndex(index = "1") {
    return `(//li//img)[${index}]`;
  }

  xpathBtnSoldOut(productName: string) {
    return `(//*[normalize-space()='${productName}']//ancestor::div//span[normalize-space()='Sold out'])[1]`;
  }

  xpathProductImageInCart(productName: string) {
    return `//a[normalize-space()='${productName}']/ancestor::div[contains(@class,'cart-drawer-container')]//img`;
  }

  //get xpath of variant product at storefront
  getXpathValueVariantChoosen(variantLable: string) {
    return `//div[contains(@class, 'product__variant-label')]//span[normalize-space(text())='${variantLable}:']//following-sibling::label`;
  }

  xpathProductTag(tag: string) {
    return `//div[@class='product__info']//p[contains(@class,'label-link')]//a[normalize-space()='${tag}']`;
  }

  xpathProductOptionInCart(index = "last()") {
    return `(//div[contains(@class,'product-cart') and contains(@class,'details')]//p[contains(@class,'options')])[${index}]`;
  }

  xpathMsgChooseOption(option: string) {
    return `//span[contains(text(),'${option}')]/following-sibling::span[contains(@class,'msg-alert-choose-option')]`;
  }

  xpathMainImageZoom(index = 1): string {
    return `(//div[contains(@class,'swiper-zoom-container')]//img)[${index}]`;
  }

  xpathProductDescriptionSF(index = 1): string {
    return `(//div[contains(@class,'product__description')]//div[@class='product__description-html'])[${index}]`;
  }

  /**
   * get xpath SKU on SF
   * @param SKU
   */
  getXpathSKUOnSF(SKU: string): string {
    return `//p[normalize-space()='${SKU}']`;
  }

  getValueRadioOnSF(value: string): string {
    return `//div[contains(@class,'base-radio')]//input[@value='${value}'] | //label[contains(@class,'base-radio__label')]//input[@value='${value}']`;
  }

  async inputCoImageSF(customName: string, customValue: string) {
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent("filechooser"),
      this.xpathInputImage(customName).click(),
    ]);
    await fileChooser.setFiles(`./data/shopbase/${customValue}`);
  }

  async getProductPrice(priceType?: "price" | "compare at price") {
    if (priceType === "compare at price") {
      const price = await this.page
        .locator("//span[@class='product__price--original' or contains(@class,'product__price-original')]")
        .textContent();
      return Number(price.substring(1, 6).replace(",", "."));
    }
    return Number(
      (
        await this.page
          .locator(
            `(//*[following-sibling::span[contains(@class,'product__price')] or contains(@class,'product__price ')])[1]`,
          )
          .textContent()
      )
        .substring(1, 6)
        .replace(",", "."),
    );
  }

  //TODO dùng fixture + check response api cẩn thận trước khi dùng
  async loadProductInfoFromDashboard(request: APIRequestContext, productId?: number): Promise<number> {
    if (productId) {
      this.id = productId;
    }
    const res = await request.get(`https://${this.domain}/admin/products/${this.id}.json`).then(res => res.json());
    return (this.priceDashboard = Number(res.product.variants[0].price));
  }

  async inputQuantityProduct(quantity: number) {
    const xpathQ = this.page.locator("//div[@class='button-quantity' or @id='changeQuantityForm']//input");
    await xpathQ.focus();
    await this.waitAbit(1000);
    await xpathQ.fill(quantity.toString());
    await this.page.locator(`//h1[contains(@class,'product__name')]`).click();
  }

  async addProductToCart() {
    await this.page.locator("(//button[normalize-space()='Add to cart'])[1]").click({
      position: {
        x: 5,
        y: 5,
      },
    });
    if (this.name) {
      this.priceStorefront = Number(
        (
          await this.page
            .locator(
              `(//*[contains(@class,'product-cart__name')]//a[normalize-space()="${this.name}"]` +
                `/following::*[contains(@class,'product-cart__price')]//span)[1]`,
            )
            .textContent()
        ).substring(1),
      );
    }
    return new SFCart(this.page, this.domain);
  }

  async addToCart() {
    await this.page
      .locator(
        "(//div[@data-form='product']/child::div[2]/descendant::button[contains(@class, 'add-cart') or normalize-space()='Add to cart']" +
          " | //section//*[contains(@class, 'add-cart')]| //span[normalize-space()='Add to cart'])[1]",
      )
      .click();
    if (
      (await this.page
        .locator('//div[contains(@class,"options-warning") and not(contains(@style,"display: none"))]')
        .count()) > 0
    ) {
      for (let i = 1; i <= (await this.page.locator('//div[contains(@class,"option-item")]/div[1]').count()); i++) {
        await this.page.click(`(//div[contains(@class,"option-item")]/div[1])[${i}]`);
      }
      await this.addToCart();
    }
  }

  async navigateToCheckoutPageInCaseBoostUpsell() {
    await this.page.locator('button:has-text("CHECKOUT")').click();
    await expect(this.page.locator(this.xpathCheckoutLayout)).toBeVisible();
    const checkoutToken = this.page.url().toString().split("checkouts/")[1];
    if (checkoutToken) {
      return new SFCheckout(this.page, this.domain, checkoutToken);
    }
  }

  /**
   * redirect to checkout page
   */
  async navigateToCheckoutPage(byPass404Error = false) {
    await this.page
      .locator(
        `(//button[normalize-space()='Checkout'] | //span[normalize-space()='CHECKOUT' or normalize-space()='Checkout'])[1]`,
      )
      .click();
    try {
      await this.waitForCheckoutPageCompleteRender();
    } catch (e) {
      if (byPass404Error) {
        const xpath404Page = "//*[normalize-space()='404 Page Not Found']";
        const is404PageDisplayed = await this.page.isVisible(xpath404Page); // Sometimes it redirect to 404 page
        if (is404PageDisplayed) {
          await this.page.reload();
          await this.waitForCheckoutPageCompleteRender();
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
    const checkoutToken = this.page.url().toString().split("checkouts/")[1];
    return new SFCheckout(this.page, this.domain, checkoutToken);
  }

  async gotoCart() {
    await this.goto("/cart");
    await this.page.waitForLoadState("networkidle");
    return new SFCart(this.page, this.domain);
  }

  /**
   * select option group: droplist / picture choice / radio
   * @param groupName
   */
  async selectGroup(groupName: string) {
    const chooseGroup = groupName.split(",").map(item => item.trim());
    for (let i = 0; i < chooseGroup.length; i++) {
      const xpathGroupOptions = `(//input[@type = 'radio' and @value='${chooseGroup[i]}']//following-sibling::span)[1]`;
      if (await this.page.locator(xpathGroupOptions).isVisible()) {
        await this.page.click(xpathGroupOptions);
      } else {
        await this.genLoc("//select[@name='properties[Select]']").selectOption({ label: chooseGroup[i] });
      }
    }
  }

  /**
   * Input list custom option on SF screen
   * @param customOptionSF list include data custom option : type, value, custom name
   */
  async inputCustomAllOptionSF(customOptionSF: Array<customOptionProductSF>, groupName?: string) {
    if (groupName) {
      await this.selectGroup(groupName);
      await this.limitTimeWaitAttributeChange(this.xpathImageActive);
    }
    for (let i = 0; i < customOptionSF.length; i++) {
      await this.inputCustomOptionSF(customOptionSF[i]);
      await this.waitForElementVisibleThenInvisible(this.xpathLoadCustom);
    }
  }

  /**
   * Input all or any custom option on SF screen
   * @param customOptionSF : include data custom option : type, value, custom name
   */
  async inputCustomOptionSF(customOptionSF: customOptionProductSF, waitFont = false) {
    switch (customOptionSF.type) {
      case "Text field":
        if (waitFont === true) {
          //click, press A and delay to wait for loading font if any
          await this.page.click(
            `//div[contains(@class,'input-base') and` +
              ` descendant::*[normalize-space()='${customOptionSF.custom_name}']]//following-sibling::input`,
          );
          await this.page.keyboard.press("A");
          await this.page.keyboard.press("Enter", { delay: 2000 });
        }
        await this.page.fill(
          `//div[contains(@class,'input-base') and` +
            ` descendant::*[normalize-space()='${customOptionSF.custom_name}']]//following-sibling::input`,
          customOptionSF.value,
        );
        break;
      case "Text area":
        await this.page.fill(
          `//div[contains(@class,'textarea-base') and` +
            ` descendant::*[normalize-space()='${customOptionSF.custom_name}']]//following-sibling::textarea`,
          customOptionSF.value,
        );
        // Input thêm value 2 để text area có xuống dòng
        if (customOptionSF.value_2) {
          await this.page.keyboard.press("Enter");
          await this.page.keyboard.type(`${customOptionSF.value_2}`);
        }
        break;
      case "Radio":
        await this.verifyCheckedThenClick(
          `//label[normalize-space()='${customOptionSF.custom_name}']//parent::div//following-sibling::div` +
            `//span[normalize-space()='${customOptionSF.value}']//preceding-sibling::span`,
          true,
        );
        break;
      case "Image": {
        const [fileChooser] = await Promise.all([
          this.page.waitForEvent("filechooser"),
          this.page
            .locator(
              `(//div[parent::div[contains(@class,'product-property')]][descendant-or-self::*[normalize-space()='${customOptionSF.custom_name}']]//input[@type='file'] |
              //div[parent::div[contains(@class,'product-property')]][descendant-or-self::*[normalize-space()='${customOptionSF.custom_name}']]//label[@class='pointer input__container'])[1]`,
            )
            .click(),
        ]);
        await fileChooser.setFiles(`./data/shopbase/${customOptionSF.value}`);
        if (!customOptionSF.hide_popover_crop) {
          for (let i = 1; i <= 3; i++) {
            await this.clickBtnZoomInOrOut(1);
            await this.page.waitForTimeout(3000);
          }
          await this.page.click("//div[@id='modal-common']//button[contains(text(),'Crop')]");
        }
        await this.waitForElementVisibleThenInvisible("//div[contains(@class,'upload-progress')]");
        break;
      }
      case "Picture choice":
        await this.page.click(
          `//div[parent::div[contains(@class,'product-property')]] ` +
            `[descendant-or-self::*[normalize-space()='${customOptionSF.custom_name}']]` +
            `//div[@class='base-picture__value' and descendant::input[@value='${customOptionSF.value}']]`,
        );
        break;
      case "Picture choice folder show droplist":
        await this.page.selectOption(
          `//div[contains(@class,'select-box') and` +
            ` descendant::*[normalize-space()='${customOptionSF.custom_name}']]//select`,
          {
            label: `${customOptionSF.value}`,
          },
        );
        break;
      case "Picture choice group show thumbnail":
        await this.page.selectOption(
          `//div[contains(@class,'select-box') and` +
            ` descendant::*[normalize-space()='${customOptionSF.custom_name}']]//select`,
          {
            label: `${customOptionSF.folder_clipart}`,
          },
        );
        await this.page.click(
          `//div[parent::div[contains(@class,'product-property')]]` +
            ` [descendant-or-self::*[normalize-space()='${customOptionSF.folder_clipart}']]` +
            `//input[@value='${customOptionSF.value}']/following-sibling::span`,
        );
        break;
      case "Picture choice group show droplist":
        await this.page.selectOption(
          `//div[contains(@class,'select-box') and` +
            ` descendant::*[normalize-space()='${customOptionSF.custom_name}']]//select`,
          {
            label: `${customOptionSF.folder_clipart}`,
          },
        );
        await this.page.selectOption(
          `(//div[contains(@class,'select-box') and` +
            ` descendant::*[normalize-space()='${customOptionSF.folder_clipart}']]//select)[2]`,
          {
            label: `${customOptionSF.value}`,
          },
        );
        break;
      case "Checkbox":
        if (customOptionSF.value === "check") {
          await this.page.check(`(//span[@class='s-check pointer'])[1]`);
        } else {
          await this.page.uncheck(`(//span[@class='s-check pointer'])[1]`);
        }
        break;
      case "Select droplist v3":
        await this.page
          .locator(`//div[contains(@class,'custom-select') and @label='${customOptionSF.custom_name}']`)
          .click();
        await this.page.click(
          `//div[contains(@class,'options') and descendant::div[normalize-space()='${customOptionSF.value}']]`,
        );
        break;
      default:
        await this.page.selectOption(
          `//div[contains(@class,'select-box') and` +
            ` descendant::*[normalize-space()='${customOptionSF.custom_name}']]//select`,
          {
            label: `${customOptionSF.value}`,
          },
        );
        break;
    }
  }

  /**
   * Click close live preview
   * @param themesSetting : type of themes
   */
  async closePreview(themesSetting?: string) {
    if (themesSetting && themesSetting.toLowerCase() == "inside") {
      await this.page.click(
        "(//div[@class='inside-modal__body__icon-close absolute']|//div[@class='checkout-modal__body__icon-close'])",
      );
    } else if (themesSetting && themesSetting.toLowerCase() == "v3") {
      await this.page.click(
        "(//div[@class='outside-modal__body__icon-close absolute'] |//div[@class='checkout-modal__body__icon-close'])",
      );
    } else {
      await this.page.click(
        "(//div[@class='roller-modal__body__icon-close']|//div[@class='checkout-modal__body__icon-close'])",
      );
    }
    await this.page.waitForSelector("(//div[contains(@class,'inside-modal__body popover-bottom__content')])[1]", {
      state: "hidden",
    });
  }

  /*
   *get handle url on SF
   */
  async getHandleURLSF(): Promise<string> {
    return this.page.url();
  }

  /*
   *get title of product on storefront
   */
  async getProductTitle(): Promise<string> {
    return await this.page.textContent("//h1[contains(@class,'product__name')]");
  }

  // click btn Preview your design ngoài SF
  async clickOnBtnPreviewSF() {
    await this.page.waitForSelector(this.xpathButtonPreview);
    await this.page.click(this.xpathButtonPreview);
    // Chờ ảnh preview load xong
    await this.page.waitForTimeout(3000);
  }

  // Open collection page or type page or Tags page on storefront in product page detail
  async openCollectionOrTypeOrTagsPage(organization: string) {
    await this.genLoc(`//p[@class='mb12']//a[normalize-space()='${organization}']`).click();
  }

  //get Title Product trên các page collection, type, Tags
  async getTitleProductOnCollectionOrTypeOrTagsPage(): Promise<string> {
    return await this.getTextContent(
      "(//div[contains(@class,'text-align-left')]//span)[1]|(//a[@class=':hover-no-underline d-block']//span)[1]",
    );
  }

  // open popup size guide trên product page detail
  async openPopupSizeGuide() {
    await this.genLoc(`//div/label[normalize-space()='Size Guide']`).click();
  }

  //get title size guide của popup size guide
  async getTitleSizeGuide(): Promise<string> {
    return await this.getTextContent(
      "//div[@class='inside-modal__body popover-bottom__content relative' or 'roller-modal__body__content']//h3",
    );
  }

  /**
   * Check error message khi không chọn value product và click button add to cart
   * @param errMsg input data message error
   */
  async checkMsgAfterClickButtonAddToCart(errMsg: string) {
    await this.page.locator("(//button[normalize-space()='Add to cart'])[1]").click();
    await this.page.waitForSelector(`//span[2][contains(text(),"${errMsg}")]`);
  }

  /**
   * Select value cho product trước khi click button add to cart
   * @param variantProduct include data variant : size, color, style, quantity
   * @param ignoreSelectColor signal to select or not select color
   * @param ignoreSelectStyle signal to select or not select style
   * @param index index of product base
   */

  async selectValueProduct(
    variantProduct: VaraintProduct,
    ignoreSelectColor = false,
    ignoreSelectStyle = false,
    index = 0,
  ) {
    if (variantProduct.size) {
      await this.page
        .locator(`//div[contains(@class,'product__variant')]//button[normalize-space()='${variantProduct.size}']`)
        .click();
    }
    if (variantProduct.color && !ignoreSelectColor) {
      const xpathBtnColors = [
        "//button[contains(@class,'product__option--color-swatches')]",
        "//button[contains(@class,'product__option--color')]",
        "((//div[contains(@class,'product__variant-button')])[2])//button[contains(@class,'product__option')]",
      ];
      const xpathBtnColor = xpathBtnColors.join(" | ");
      const xpathLabel = "//span[normalize-space()='Color:']//following-sibling::label";
      for (let i = 1; i <= (await this.genLoc(xpathBtnColor).count()); i++) {
        const xpathChooseColor = `(${xpathBtnColor})[${i}]`;
        await this.page.click(xpathChooseColor);
        await this.page.waitForTimeout(200);
        if ((await this.page.textContent(xpathLabel)) === variantProduct.color) {
          break;
        }
      }
    }
    if (variantProduct.style && !ignoreSelectStyle) {
      const xpathProductBases = [
        `//div[contains(@class,'product__variant')]//button[normalize-space()='${variantProduct.style}']`,
        `(//div[contains(@class,'product__variant')]//img)[${index}]`,
        `//div[contains(@class,'product__variant')]//button[descendant-or-self::*[normalize-space()='${variantProduct.style}']]`,
        `(//div[contains(@class,'product__variant')]//button)[${index}]`,
      ];
      const xpathProductBasesT = xpathProductBases.join(" | ");
      await this.page.click(xpathProductBasesT);
    }
    if (variantProduct.quantity) {
      const xpathQ = this.page.locator("(//div[contains(@class,'quantity')])[1]//input[@type='number']");
      await xpathQ.focus();
      await xpathQ.fill(variantProduct.quantity.toString());
      await this.page.locator(`//h1[contains(@class,'product__name')]`).click();
    }
  }

  //get thông tin product trong cart
  async getInfoProductInCart(): Promise<string> {
    return await this.getTextContent("(//div//a[@class='h5']//parent::div//parent::div//p)[1]");
  }

  /**
   * Check error message khi không input value cho custom option và click button add to cart
   * @param errMsg input data message error
   */
  async checkErrMsgCustomOption(errMsg: string) {
    await this.page.locator("(//button[normalize-space()='Add to cart'])[1]").click();
    await this.page.waitForSelector(
      `(//div[@class='relative input-base' or 'textarea-base']//div[normalize-space()='${errMsg}'])[2]`,
    );
  }

  // Xóa product trong cart
  async deletePrductIncart() {
    await this.page.click("//div[contains(@class,'align-center')]//a[normalize-space()='Remove item']");
    await this.page.click("//button[normalize-space()='Remove item']");
  }

  //get image hiển thị của product
  async getAttributeImage(): Promise<string> {
    const linkMedia = this.page.getAttribute(
      "//div[@role='tabpanel']//img|//div[@class='product-cart__image aspect-ratio']//img",
      "src",
    );
    const media = (await linkMedia).substring((await linkMedia).lastIndexOf("@"));
    return media;
  }

  //get list imedia ngoài SF
  async getListMediaSF(): Promise<number> {
    let listMedia = null;
    const countImage = await this.page.locator("//span[@class='bg-cl-secondary d-block']//img").count();
    for (let i = 1; i <= countImage; i++) {
      const xpathMedia = this.page.locator(`(//span[@class='bg-cl-secondary d-block'])[${i}]//img`);
      const linkMedia = xpathMedia.getAttribute("src");
      const media = (await linkMedia).substring((await linkMedia).lastIndexOf("@") + 1);
      if (listMedia === null) {
        listMedia = media;
      } else {
        listMedia = listMedia + "," + media;
      }
    }
    return listMedia;
  }

  /**
   * Select value cho product trước khi click button add to cart
   * @param varaintProduct include data variant : size, color, style, quantity
   */

  async stickySelectValueProduct(varaintProduct: VaraintProduct) {
    if (varaintProduct.size) {
      await this.page.selectOption(`(//div[@class='product-dropdown options-dropdown w-100'])[1]//select//option`, {
        label: `${varaintProduct.size}`,
      });
    }
    if (varaintProduct.color) {
      await this.page.selectOption(`(//div[@class='product-dropdown options-dropdown w-100'])[3]//select//option`, {
        label: `${varaintProduct.color}`,
      });
    }
    if (varaintProduct.style) {
      await this.page.selectOption(`(//div[@class='product-dropdown options-dropdown w-100'])[2]//select//option`, {
        label: `${varaintProduct.style}`,
      });
    }
    if (varaintProduct.quantity) {
      const xpathQ = this.page.locator("//div[@class='quantity']//input[@type='number']");
      await xpathQ.focus();
      await xpathQ.fill(varaintProduct.quantity.toString());
      await this.page.locator(`//h1[contains(@class,'product__name')]`).click();
    }
    await this.page.locator("(//span[@class='w-100 h-100'])[2]//span[normalize-space()='Add to cart']").click();
  }

  /**
   *
   * Select variant product
   */
  async selectVariant(variant: string) {
    //select product variant
    await this.page.click(
      `//div[contains(@class,'product__variant')]` + `//button[descendant-or-self::*[normalize-space()='${variant}']]`,
    );
  }

  /**
   *
   * Add custom design text
   */
  async addCustomDesignText(text: string) {
    const xpath = this.page.locator(`//input[contains(@placeholder,"Please fill out this field")]`);
    await xpath.focus();
    await xpath.fill(text);
    await this.page.locator(`//h1[contains(@class,'product__name')]`).click();
  }

  /*
   *Select and check variant of product
   */
  async selectAndCheckVariant(variant: string, type: string) {
    const listValue = variant.split(",").map(item => item.trim());
    for (let i = 1; i <= listValue.length; i++) {
      const xpathBtnVariant =
        `(//span[normalize-space()='${type}']` + `//ancestor::div[contains(@class,'wrapper')]//button)[${i}]`;
      const xpathLabel = `//span[normalize-space()='${type}']//following-sibling::label`;
      await this.page.click(xpathBtnVariant);
      if ((await this.page.textContent(xpathLabel)) === variant) {
        break;
      }
    }
  }

  async getListC0SF(): Promise<Array<string>> {
    const arr = [];
    const countNameCO = await this.genLoc("//div[contains(@class,'product-custom-option')]//p").count();
    let getText = "";
    for (let i = 1; i <= countNameCO; i++) {
      getText = await this.getTextContent(`(//div[contains(@class,'product-custom-option')]//p)[${i}]`);
      arr.push(getText);
    }
    return arr;
  }

  async getProductSKUSF(): Promise<string> {
    return await this.page.textContent("//p[contains(@class, 'product__sku')] | //div[contains(@class, 'my8')]//p");
  }

  async countProductMedias(): Promise<number> {
    if (await this.page.isVisible('(//div[@class="VueCarousel-inner"])[2]')) {
      return await this.page.locator('(//div[@class="VueCarousel-inner"])[2]//img[1]').count();
    } else {
      return await this.page.locator('(//ul[contains(@class, "media-gallery-carousel__thumbs")])//img[1]').count();
    }
  }

  async getProductPriceSF(): Promise<string> {
    let price = (await this.page.locator("(//div[contains(@class,'product__price')])[1]").textContent())
      .substring(1)
      .split(" ")[0];
    if (!price) {
      price = (
        await this.page
          .locator(
            `(//*[following-sibling::span[contains(@class,'product__price')] or contains(@class,'product__price')])[1]`,
          )
          .textContent()
      ).substring(1);
    }
    return price;
  }

  async getPriceProductInCartDrawer(): Promise<string> {
    return (await this.page.locator(this.xpathPriceProductInCartDrawer).textContent()).substring(1);
  }

  async getProductComparePrice(): Promise<string> {
    return (await this.page.locator("//span[@class='product__price--original']").textContent()).substring(1);
  }

  async getProductVendorSF(): Promise<string> {
    await this.vendorLocator.waitFor({ state: "visible", timeout: 5000 });
    if (this.vendorLocator.isVisible()) {
      return await this.vendorLocator.textContent();
    }
    return "Don't have product vendor";
  }

  async getProductTypeSF(): Promise<string> {
    await this.typeLocator.waitFor({ state: "visible", timeout: 5000 });
    if (this.typeLocator.isVisible()) {
      return await this.typeLocator.textContent();
    }
    return "Don't have product type";
  }

  async getProductTagsSF(): Promise<string> {
    let tags = [];
    if (await this.page.locator(`(${this.xpathProductTags}//a)[last()]`).isVisible()) {
      tags = await this.page.locator(`${this.xpathProductTags}//a`).allTextContents();
    }
    return tags.join(",");
  }

  /**
   * get type of Media on storefront product page
   * @param description include data description inserted
   */

  async getMediaDescriptionSf(description: DescriptionInsert): Promise<string> {
    const urlObject = this.cloneObject<DescriptionInsert>(description);
    switch (description.field) {
      case "General":
        return await this.page.getAttribute(`${this.xpathDescription}//iframe`, "src");
      case "Embed":
        return await this.page.innerText(`${this.xpathDescription}//p`);
      case "Link":
        if (description.description_URL) {
          urlObject.description_URL = await this.page.locator(`${this.xpathDescription}//a`).getAttribute("href");
        }
        if (description.text_to_display) {
          urlObject.text_to_display = await this.page.locator(`${this.xpathDescription}//a`).innerText();
        }
        if (description.title_description) {
          urlObject.title_description = await this.page.locator(`${this.xpathDescription}//a`).getAttribute("title");
        }
        if (description.open_link_in) {
          urlObject.open_link_in = "Current window";
          const target = await this.page.locator(`${this.xpathDescription}//a`).getAttribute("target");
          if (target === "_blank") {
            urlObject.open_link_in = "New window";
          }
        }
        return JSON.stringify(urlObject);
    }
    return "";
  }

  /**
   * get src of Image on storefront product page
   */
  async getImageDescriptionSf(): Promise<string> {
    return await this.page.getAttribute("//div[@class='product__description-html']//img", "src");
  }

  /**
   * select base product on store front
   * @param baseProduct: số thứ tự base product
   */
  async selectBase(baseProduct: number) {
    if (baseProduct > 1) {
      await this.page.click(`(//div[contains(@class,'product__variant')]//img)[${baseProduct}]`);
    }
  }

  /**
   * Get Attribute Preview Image on storefront product page
   */
  async getAttibutePreviewImage(index = "1"): Promise<string> {
    return await this.page.getAttribute(`(//div[@class='product-image-preview']//img)[${index}]`, "src");
  }

  xpathVariantCampaign(variant: string): Locator {
    return this.genLoc(`//div[contains(@class,'product__variant')]//button[normalize-space()='${variant}']`);
  }

  xpathSalePriceCampaign(price: string): Locator {
    return this.genLoc(`//span[contains(@class,'product__price')][normalize-space()='${price}']`);
  }

  xpathPreviewImageCampSF(): Locator {
    return this.genLoc("(//img[@alt='Preview image'])[1]");
  }

  xpathInputImage(customName: string): Locator {
    return this.genLoc(
      `//div[parent::div[contains(@class,'product-property')]][descendant-or-self::*[normalize-space()='${customName}']]//input[@type='file']`,
    );
  }

  /**
   * Close popup crop
   * */
  async closePopoverCrop(themesSetting?: string) {
    if (themesSetting) {
      await this.page.click("//div[@class='inside-modal__body__icon-close absolute']");
    } else {
      await this.page.click("//div[@class='roller-modal__body__icon-close']");
    }
  }

  /**
   * Get Attribute image live instant
   *@param xpath
   */
  async getAttributeImageLiveInstant(xpath: string): Promise<string> {
    return await this.page.getAttribute(xpath, "src");
  }

  /**
   * limit the time to wait for attribute change
   *@param xpath
   */
  async limitTimeWaitAttributeChange(xpath: string, count = 10) {
    const imageOld = await this.getAttributeImageLiveInstant(xpath);
    let imageNew: string;
    let k = 0;
    do {
      await this.page.waitForTimeout(1000);
      imageNew = await this.getAttributeImageLiveInstant(xpath);
      k++;
    } while (imageNew === imageOld && k <= count);
  }

  /**
   * Click button zoom-in/zoom-out
   * @param index 1:zoom-in,2:zoom-out
   * */
  async clickBtnZoomInOrOut(index = 1) {
    await this.page.click(
      `(//div[contains(@class,'zoom-container')]//*[name()='svg' or contains(@class,'zoom-wrapper__icon')])[${index}]`,
    );
  }

  async waitForImagesDescriptionLoaded() {
    const xpathBlockProductDescription = "//div[@class='product__description-html']//img";
    const countProductDescription = await this.page.locator(xpathBlockProductDescription).count();
    for (let i = 0; i < countProductDescription; i++) {
      await waitForImageLoaded(this.page, `(${xpathBlockProductDescription})[${i + 1}]`);
    }
    await this.page.waitForTimeout(3000);
  }

  async waitForImagesMockupLoaded(): Promise<number> {
    const countImageMockup = await this.page.locator(this.xpathProductMockup).count();
    for (let i = 0; i < countImageMockup; i++) {
      await waitForImageLoaded(this.page, `(${this.xpathProductMockup})[${i + 1}]`);
    }
    await this.page.waitForTimeout(3000);
    return countImageMockup;
  }

  async waitForCLipartImagesLoaded() {
    await this.page.waitForTimeout(5000);
    const countClipartImages = await this.page.locator("//span[@class='wrapper-picture']//img").count();
    for (let i = 0; i < countClipartImages; i++) {
      await this.waitForElementVisibleThenInvisible(
        `(//div[@class='base-picture']//img[contains(@class,'loading base-picture__img')])[${i + 1}]`,
      );
    }
    await this.page.waitForTimeout(3000);
  }

  async verifyDescriptionCampaign(retry = 5) {
    let reCheck = true;
    let countCheck = 0;
    while (reCheck) {
      await this.waitUntilElementVisible(this.xpathProductDescription);
      try {
        await this.waitForImagesDescriptionLoaded();
        reCheck = false;
      } catch (e) {
        countCheck++;
        if (countCheck >= retry) {
          reCheck = false;
          continue;
        }
        await this.page.reload();
      }
    }
  }

  async clickBuyNow() {
    await this.clickOnBtnWithLabel("Buy Now");
  }

  //get property of camp
  xpathPropertyCamp(customName: string): Locator {
    return this.genLoc(
      `(//div[parent::div[contains(@class,'product-property')]][descendant-or-self::*[normalize-space()='${customName}']])[1]`,
    );
  }

  xpathVariantWithImage(index: number): string {
    return `(//div[contains(@class,'product__variant-button')]//img)[${index}]`;
  }

  xpathTitleProduct(productTitle: string): string {
    return `//h1[normalize-space()='${productTitle}']`;
  }

  xpathProductOnCollectionPage(productTitle: string, index = 1): string {
    return `(//div[contains(@class,'collection-detail__product-details')]//span[normalize-space()='${productTitle}'])[${index}]`;
  }

  /* count row, column table
   * @param numberTable la vị trí của table
   */
  async countLineSizeChart(countLine: "column" | "row"): Promise<number> {
    let xpathLine = "//table//tr";
    if (countLine === "column") {
      xpathLine = "//table//tr[1]//th";
    }
    return await this.page.locator(xpathLine).count();
  }

  async viewProductAgain(productName: string) {
    //search product
    while (await this.page.isHidden('//div[contains(@class,"search-modal")]//a[.="Cancel"]')) {
      await this.page.click("//header[not(contains(@class,'header-mobile'))]//a[contains(@class, 'search-icon')]", {
        timeout: 7000,
      });
      await this.page.waitForTimeout(1000);
    }
    await this.page.locator("//input[@type='search']").pressSequentially(productName, { delay: 100 });
    await this.page.waitForSelector("//div[contains(@class, 'search-modal__result')]");
    await this.page.locator("//input[@type='search']").press("Enter");
    //click product in search result
    await this.page.waitForSelector("(//div[contains(@class, 'product-grid')]//a)[1]", { timeout: 60000 });
    await this.page.click("(//div[contains(@class, 'product-grid')]//a)[1]", { timeout: 7000 });
  }

  //count image SF
  async countImageSF(): Promise<number> {
    return await this.page.locator("//img[ancestor::div/div[contains(@class,'thumbnail-carousel-slide')]]").count();
  }

  /** Get eta date from eta block
   * return ETA date string
   */
  async getEtaDateFromBlock(): Promise<string> {
    const xPath = `(//div[parent::div[contains(@class, 'eta-delivery')]]//span)[3]`;
    return await this.page.locator(xPath).textContent();
  }

  async compareEtaDateFromBlock(mode = "same_day"): Promise<boolean> {
    let regex: RegExp;
    switch (mode) {
      case "same_day":
        regex = new RegExp(`^[a-zA-Z]{3,} [\\d]{2}$`);
        break;
      case "diffrent_month":
        regex = new RegExp(`^[a-zA-Z]{3,} [\\d]{2} - [a-zA-Z]{3,} [\\d]{2}$`);
        break;
    }
    const eta = await this.getEtaDateFromBlock();
    return regex.test(eta);
  }

  /**
   * Click collection in the collection list
   * @param collectionName name of collection
   */
  async openCollectionInCollectionList(collectionName: string) {
    await this.page.click(`//div[@id="list-collections"]//a[normalize-space()="${collectionName}"]`);
  }

  /**
   * Choose variant by click image
   * @param index index of image in product's detail
   */
  async chooseVariantByClickImage(index: number) {
    await this.page.locator(`(//div[contains(@class,'product__image-gr')]/div//img)[${index}]`).click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Count variant of product by image
   * @returns number of variants by count image
   */
  async countImageVariant(): Promise<number> {
    return await this.page.locator("//div[contains(@class,'product__image-gr')]/div//img").count();
  }

  /**
   * Get discount in cart page
   * return <number> discount in cart page
   */
  async getDiscountInCart(): Promise<number> {
    const discountInCart = await this.page.locator("//p[contains(@class, 'subtle cart-total-discount')]").innerText();
    const discount = parseInt(discountInCart.replace(/[-$,]/g, "").split(".")[0], 10);
    return discount;
  }

  /**
   * Hàm click add accessory và chờ add thành công
   * @param name
   */
  async addAccessory(name: string): Promise<void> {
    await this.singleAccessory.filter({ hasText: name }).getByRole("button", { name: "Add" }).click();
  }

  /**
   * Hàm select variant color swatches trong quickview Upsell
   * @param color : là value của attribute style VD: style = background-color: rbg(0, 0, 0);
   */
  async selectColorSwatches(color: string): Promise<void> {
    const colorSwatches = this.variantOptions.and(this.genLoc(`[style='${color}']`));
    const colorSwatchesState = await colorSwatches.getAttribute("class");
    if (!colorSwatchesState.includes("active")) {
      await colorSwatches.click();
      await colorSwatches.and(this.genLoc("[class$=active]")).waitFor();
    }
  }

  /**
   * Hàm add to cart product từ các widget best seller, recent view ...
   * @param widget
   * @param name
   */
  async addToCartProductInWidget(widget: string, name: string): Promise<void> {
    switch (widget) {
      case "Best seller":
        await this.bestSellerProducts.filter({ hasText: name }).hover();
        await this.bestSellerProducts.filter({ hasText: name }).getByRole("button", { name: "Add to cart" }).waitFor();
        await this.bestSellerProducts.filter({ hasText: name }).getByRole("button", { name: "Add to cart" }).click();
        break;
      default:
        break;
    }
  }

  /**
   * Get tên img của thumbnail trong quickview
   * @returns
   */
  async getThumbnailImgNames(): Promise<string[]> {
    const imgNames = [];
    for (const img of await this.thumbnailImg.getByRole("img").all()) {
      const name = (await img.getAttribute("src")).split("@").pop();
      imgNames.push(name);
    }
    return imgNames;
  }

  /**
   * Hàm click vào product img ở bundle offer
   * @param productName
   */
  async clickImgOfProductInBundle(productName: string, isQuickview = false): Promise<void> {
    const bundle = isQuickview ? this.quickviewBundleProdImg : this.bundleProductImg;
    const productImg = bundle.and(this.genLoc(`[alt='${productName}']`));
    await productImg.hover();
    await productImg.locator("+.bundle__offer-quickview").click();
  }

  /**
   * get Content Filter Review
   */
  async getContentFilterReviewSF(): Promise<filterReview> {
    const filter = (await this.page.locator(this.filterRview).nth(0).textContent()).trim();
    const perPage = (await this.page.locator(this.filterRview).nth(1).textContent()).trim();
    const filterReview: filterReview = {
      filter: filter,
      per_page: perPage,
    };
    return filterReview;
  }

  /**
   * filter Review In WB
   * @param filtersReview
   */
  async filterReview(filtersReview: filterReview): Promise<void> {
    if (filtersReview.filter) {
      await this.page.locator(this.filterRview).nth(0).click();
      await this.page
        .locator(`(//div[contains(@class,'rv-select__options')]//div[normalize-space()='${filtersReview.filter}'])[1]`)
        .click();
    } else {
      await this.page.locator(this.filterRview).nth(1).click();
      await this.page
        .locator(
          `(//div[contains(@class,'rv-select__options')]//div[normalize-space()='${filtersReview.per_page}'])[1]`,
        )
        .click();
    }
  }

  /**
   * get Content Alert Warning In WB
   */
  async countRatingReviewsCard(index: number): Promise<number> {
    const xpathRatingReviewCard = `(${this.reviewCardGrid})[${index}]//div[contains(@class,'block-rating-rv__star') and @data-rating="1"]`;
    const rating = await this.page.locator(xpathRatingReviewCard).count();
    return rating;
  }

  /**
   *click Line Rating
   * @param lineRating
   */
  async clickLineRating(lineRating: "1 star" | "2 stars" | "3 stars" | "4 stars" | "5 stars"): Promise<void> {
    await this.page
      .locator(
        `//div[contains(@class,'items-center review-progress')] [ .//div[normalize-space()='${lineRating}']]//following-sibling::progress`,
      )
      .click();
  }

  /**
   * Get number of review of product in SF
   * @returns number of reviews display of block review in SF
   */
  async getNumberOfReviewsInSF(): Promise<number> {
    let numberOfReviews = await this.page
      .locator("//div[contains(@class,'block-rating-rv')]//div[contains(@class,'block-rating-rv__main')]")
      .textContent();
    numberOfReviews = numberOfReviews.slice(numberOfReviews.indexOf(")") + 1, numberOfReviews.length);
    numberOfReviews = numberOfReviews.replace(/\D/g, "");
    return parseInt(numberOfReviews);
  }

  /**
   *  Get average rating of review of product in SF
   * @returns average of review's rating display of block review in SF
   */
  async getAverageRatingReviewOfProduct(): Promise<number> {
    let ratingOfReviews = await this.page
      .locator("//div[contains(@class,'block-rating-rv')]//div[contains(@class,'block-rating-rv__main')]")
      .textContent();
    ratingOfReviews = ratingOfReviews.slice(ratingOfReviews.indexOf("(") + 1, ratingOfReviews.indexOf(")"));
    ratingOfReviews = ratingOfReviews.replace(/^\D+/g, "");
    ratingOfReviews = ratingOfReviews.slice(0, ratingOfReviews.search("/"));
    return parseFloat(ratingOfReviews);
  }
}
