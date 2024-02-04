import { SBPage } from "@pages/page";
import { getStyle } from "@utils/css";
import { Locator, Page, expect } from "@playwright/test";
import { SnapshotFixture } from "@core/fixtures/snapshot-fixture";

export class ProductWidgets extends SBPage {
  public xpathBlockProductWidgetSameCollection = `//section[@type='products-from-same-collections']`;
  public xpathBlockRecentlyViewedAndFeaturedProduct = `//section[@type='recently-viewed-and-featured-products']`;
  public xpathBlockCartRecommendation = `//section[@type='cart-recommendations']`;
  public xpathSettingHeader = `//div[@class='header-editor']`;
  public xpathSettingProductNameSize = `//div[@class='prod-name']`;
  public xpathSettingProductPriceSize = `//div[@class='prod-price']`;
  public xpathSettingCallAction = `//div[@class='call-action']`;
  public xpathSectionProductNumber = `//section[contains(@class, 'prod-number')]`;
  public xpathBtnSave = `//div[@class='save-setting-fixed']//span[normalize-space() = 'Save']`;
  public xpathToggleWidget =
    "//h4[normalize-space() = 'widgetTitle']//ancestor::div[contains(@class, 'items-info')]//following-sibling::div[contains(@class, 'app_list__options')]//span[@class='s-check']";
  public xpathCustomizeWidget =
    "//h4[normalize-space() = 'widgetTitle']//ancestor::div[contains(@class, 'items-info')]//following-sibling::div[contains(@class, 'app_list__options')]//button";
  public xpathToggleAddCart = "//div[@class='add-cart-button']//span[@class='s-check']";
  public xpathCheckbox = "//label[@id='checkboxId']//span[@class='s-check']";
  public xpathNote = "//p[contains(@class, 'only-on-product-page')]";
  public xpathSpecificPages = "//div[@class='s-select select-option-prod']";
  public xpathSelected = "//button[contains(@class, 'btn-select-products')]";
  public xpathSelectAllIcon = "//span[contains(@class,'product-action--all')]//i[contains(@class, 'plus-circle')]";
  public xpathContinue = "//div[contains(@class, 'button-submit')]//button";
  public xpathCloseBtn = "//button[@class='s-modal-close is-large']";
  public xpathProductLoading = "(//div[@class='no-offer-search__box'])[1]";

  /**
   * Check Toggle is turn on/turn off, true = turn on, false = turn off
   * Check Checkbox is checked or not
   * @param selector
   */
  async isItemChecked(selector: string): Promise<boolean> {
    const isItemChecked = await this.genLoc(selector).isChecked();
    return isItemChecked;
  }

  /**
   * Switch Toggle turn on/off
   * @param widgetTitle title of widget
   * @param isOn true = turn on, false = turn off
   */
  async switchToggleWidget(widgetTitle: string, isOn: boolean) {
    const xpathToggle = this.xpathToggleWidget.replace("widgetTitle", widgetTitle);
    const toggleValue = await this.isItemChecked(xpathToggle);
    if (toggleValue != isOn) {
      await this.genLoc(xpathToggle).click();
    }
  }

  /**
   * Choose checkbox according to checkbox Id
   * @param checkboxId
   * @param isChecked true = checked, false = unchecked
   */
  async chooseCheckbox(checkboxId: string, isChecked: boolean) {
    const xpathCheckbox = this.xpathCheckbox.replace("checkboxId", checkboxId);
    const checkboxValue = await this.isItemChecked(xpathCheckbox);
    if (checkboxValue != isChecked) {
      await this.genLoc(xpathCheckbox).click();
    }
  }

  /**
   * Choose place Widget (Product page, Collection page, Cart page, Home page)
   * @param places
   */
  async choosePlaceWidget(places) {
    for (const place of places) {
      const isNoteVisible = await this.genLoc(this.xpathNote).isVisible();
      if (isNoteVisible == true) {
        await this.chooseSpecificProductPages(place?.specificPages);
      } else {
        if (place?.id == "checkProduct") {
          await this.chooseCheckbox(place?.id, place?.isOn);
          await this.chooseSpecificProductPages(place?.specificPages);
        }
        await this.chooseCheckbox(place?.id, place?.isOn);
      }
    }
  }

  /**
   * Choose Specific Product Pages (Collection or Product)
   * @param specificPages
   */
  async chooseSpecificProductPages(specificPages) {
    const xpathCheckbox = this.xpathCheckbox.replace("checkboxId", "specificProductPage");
    const checkboxValue = await this.isItemChecked(xpathCheckbox);
    if (checkboxValue != specificPages?.isOn) {
      await this.genLoc(xpathCheckbox).click();
    }
    await this.genLoc(`${this.xpathSpecificPages}//select`).selectOption(specificPages?.page);
    await this.genLoc(this.xpathSelected).click();
    await this.page.waitForSelector(this.xpathProductLoading, { state: "hidden" });
    const isSelectAllVisible = await this.genLoc(this.xpathSelectAllIcon).isVisible();
    if (isSelectAllVisible == true) {
      await this.genLoc(this.xpathSelectAllIcon).click();
      await this.genLoc(this.xpathContinue).click();
    } else {
      await this.genLoc(this.xpathCloseBtn).click();
    }
  }

  /**
   * Click Save button
   */
  async clickSaveBtn() {
    await this.page.waitForTimeout(300);
    if (await this.genLoc(this.xpathBtnSave).isVisible()) {
      await this.genLoc(this.xpathBtnSave).click();
      await this.page.waitForSelector("text='All changes were successfully saved'");
    }
  }

  /**
   * Get list product locator on widget
   * @param widgetType
   * @param page
   */
  async getProductLocOnWidget(widgetType: string, page: Page): Promise<Locator[]> {
    const productLocList = [];
    const productNameList = `//div[contains(@class, '${widgetType}')]//div[contains(@class, 'product__name')]//a`;
    const numberProductToShow = await this.genLoc(productNameList).count();
    for (let i = 1; i <= numberProductToShow; i++) {
      const productLoc = page.locator(
        `(//div[contains(@class, '${widgetType}')]//div[@class='upsell-widget-product upsell-relative'])[${i}]`,
      );
      productLocList.push(productLoc);
    }
    return productLocList;
  }

  /**
   * Change setting Product Widget
   * @param setting
   */
  async changeSetting(setting) {
    if (setting?.header) {
      await this.genLoc(`${this.xpathSettingHeader}//select`).selectOption(setting.header?.option);
      await this.genLoc(`${this.xpathSettingHeader}//div[contains(@class, 'textMessage')] //input`).fill(
        setting.header?.title,
      );
    }
    if (setting?.product_name_size) {
      await this.genLoc(`${this.xpathSettingProductNameSize}//select`).selectOption(setting.product_name_size);
    }
    if (setting?.product_price_size) {
      await this.genLoc(`${this.xpathSettingProductPriceSize}//select`).selectOption(setting.product_price_size);
    }
    if (setting?.call_action) {
      await this.genLoc(`${this.xpathSettingCallAction}//select`).selectOption(setting.call_action);
    }
    if (setting?.add_cart_button) {
      const toggleValue = await this.isItemChecked(this.xpathToggleAddCart);
      if (toggleValue != setting?.add_cart_button) {
        await this.genLoc(this.xpathToggleAddCart).click();
      }
    }
    if (setting?.number_product_to_show) {
      await this.genLoc(`${this.xpathSectionProductNumber}//select`)
        .first()
        .selectOption(setting.number_product_to_show);
    }
    if (setting?.max_product_slide) {
      await this.genLoc(`${this.xpathSectionProductNumber}//select`).last().selectOption(setting.max_product_slide);
    }
    if (setting?.place_widget) {
      await this.choosePlaceWidget(setting?.place_widget);
    }
  }

  /**
   * Verify Widget is visible correctly on SF according to setting on Dashboard
   * @param type type of widget
   * @param setting
   * @param snapshotFixture
   * @param page
   */
  async verifyProductWidgetVisibleCorrectly(
    type: string,
    setting,
    snapshotFixture: SnapshotFixture,
    page: Page,
  ): Promise<void> {
    const widgetType = type.replace("-", "_");
    const header = `//div[contains(@class, '${widgetType}')]//h2[normalize-space() = '${setting.header?.title}']`;
    const productNameList = `//div[contains(@class, '${widgetType}')]//div[contains(@class, 'product__name')]//a`;
    const productPriceList = `//div[contains(@class, '${widgetType}')]//div[contains(@class, 'product__prices')]//div`;
    const productActionList = `//div[contains(@class, '${widgetType}')]//div[contains(@class, 'product__action')]//button`;

    await this.genLoc(`//footer[contains(@class, 'footer-section')]`).scrollIntoViewIfNeeded();
    await this.genLoc(`//div[contains(@class, '${widgetType}')]`).waitFor({ state: "visible" });
    await this.genLoc(`//div[contains(@class, '${widgetType}')]`).scrollIntoViewIfNeeded();

    if (setting?.header) {
      const headerLoc = this.genLoc(header);
      const size = await getStyle(headerLoc, "font-size");
      expect(size).toEqual(setting?.header.option);
    }
    if (setting?.product_name_size) {
      const productName = this.genLoc(productNameList).first();
      const size = await getStyle(productName, "font-size");
      expect(size).toEqual(setting?.product_name_size);
    }
    if (setting?.product_price_size) {
      const productPrice = this.genLoc(productPriceList).first();
      const size = await getStyle(productPrice, "font-size");
      expect(size).toEqual(setting?.product_price_size);
    }
    if (setting?.call_action) {
      if (setting?.add_cart_button == true) {
        const productAction = this.genLoc(productActionList).first();
        const size = await getStyle(productAction, "font-size");
        expect(size).toEqual(setting?.call_action);
      }
    }
    if (setting?.add_cart_button) {
      const productAction = this.genLoc(productActionList).first();
      const isButtonVisible = await productAction.isVisible();
      expect(isButtonVisible).toEqual(setting?.add_cart_button);
    }
    if (setting?.number_product_to_show) {
      const numberProductToShow = await this.genLoc(productNameList).count();
      expect(numberProductToShow.toString()).toEqual(setting?.number_product_to_show);
    }
    if (setting?.max_product_slide) {
      await snapshotFixture.verify({
        page: page,
        selector: `//div[contains(@class, '${widgetType}')]//div[@class='VueCarousel AppCarousel']`,
        snapshotName: `product-widget-${type}-max-${setting?.max_product_slide}-slides-${process.env.ENV}.png`,
        screenshotOptions: {
          mask: await this.getProductLocOnWidget(widgetType, page),
        },
      });
    }
  }
}
