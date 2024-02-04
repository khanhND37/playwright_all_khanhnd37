import { BrowserContext, expect, FrameLocator, Locator, Page, Response } from "@playwright/test";
import type { CalculateProfitInfos, DragAndDropInfo, FilterCondition, ProfitInfos, SetAttribute } from "@types";
import { BoundingBox } from "@types";
import { OcgLogger } from "@core/logger";
import { appendParameterToURL } from "@utils/url";
import { waitForProgressBarDetached } from "@utils/storefront";
import { float } from "aws-sdk/clients/lightsail";

const logger = OcgLogger.get();

export class SBPage {
  page: Page;
  readonly domain: string;
  xpathToastMessage =
    "//div[@class='s-toast is-dark is-bottom' or @class = 's-toast is-danger is-bottom' or @class='s-toast is-success is-bottom']";
  xpathPopUpRetryProcess = "//div[@class='s-modal-body']//div";
  xpathLocatorIframe = "//body[@id='tinymce']";
  xpathNotFound =
    "//h2[contains(@class,'notfound-page__title') or contains(@class,'display')] | //div[contains(@class,'block-heading white') and normalize-space()='Page not found']";
  xpathUrl = "//div[@class='google__url']";
  xpathTitle = "//h1[@id='title-product']";
  xpathIconClose = "//button[@class='s-modal-close is-large']";
  selectorPopupContainer = ".sb-popup__container";
  xpathIconLoadImage =
    "(//section[@data-id='product']//div[@class='product-image-preview loading-spinner' or @class='loading-spinner'])[1] " +
    "| (//section[@data-id='product']//img[@class='image sb-lazy loading base-picture__img' or contains(@class,'image sb-lazy loading')])[1]";
  xpathClosePPCPopUp =
    "//div[contains(@class, 'post-purchase__close') or contains(@class, 'post-purchase-offer__close')]";
  xpathProductDetailLoading = "(//div[@class='s-detail-loading__body'])[1]";
  xpathAllCustomOptionSF = "//div[child::div[contains(@class,'product-property product-custom-option')]]";
  xpathGroupPictureChoice = "//div[contains(@class,'product-property product-custom-option')]";
  xpathLoadingButton = "(//button[contains(@class,'is-loading')])[1]";
  xpathTableLoad = "//div[@class='s-loading-table']";
  xpathLoadSpinner = "//div[contains(@class,'loading-spinner')]";
  xpathLoadingWb = `//div[contains(@class,'loading-screen')]`;
  xpathSigninMessage = ".unite-ui-switch__login .form-text p";
  xpathEmail = '[placeholder="example\\@email\\.com"]';
  getXpathDisablePasswordOnlineStore = "//div[contains(@class,'sb-alert__warning')]";
  xpathContentAlertInfo = "//div[contains(@class,'sb-alert__info')]//p";
  getXpathWarningPaymentMethod = "//div[contains(@class,'sb-alert__danger')]";
  getXpathBannerDisablePassword =
    "//span[@data-label='You cannot remove password protection while using the Fulfillment Only plan']";
  xpathIconLoading = "(//img[@class='sbase-spinner']| //div[@class='sb-image__loading sb-absolute'])[1]";
  xpathFooterSF = "(//div[@class='main__footer' or contains(@class,'checkout-footer--wb')])[1]";
  xpathTextOfToast =
    "//div[contains(@class, 'sb-toast__container--default')]//*[@class = 'sb-toast__message sb-text-body-emphasis sb-toast__message--pr12']";

  // xpath on CO page
  xpathCheckoutLayout = `//div[@id='checkout-layout']`;
  xpathPaymentMethodLabel = `//div[contains(@class,'payment-method-list')]//span[text()='Payment' or text()='Payment method']`;
  xpathShippingLabel = `//div[@class='layout-flex__item']//div[text()='Shipping'] | //span[text()='Shipping method']`;
  xpathItemListOrderSumary = `(//tr[@class='checkout-product'] | //div[contains(@class,'product-cart')])[1]`;
  xpathBlockReview = '//div[@class="block-review"]';
  xpathFillOrdName = `//input[@placeholder='Enter your order number']`;
  xpathFillEmail = `//input[@placeholder='Enter your email']`;
  xpathTrackingStep = `//ul[@class='timeline']//li`;

  xpath = {
    checkout: {
      detectOnePage: "//span[contains(@class,'breadcrumb') and normalize-space()='Checkout']",
      detectThreeStep:
        "(//button[contains(@class,'continue-button')] | (//div[contains(@class,'flex breadcrumb_text')]/span)[5] | (//li[@class='breadcrumb'])[4])[1]",
    },
  };

  /**
   * Xpath button with label
   * * @param labelName : name of button
   * @param index
   * @returns
   */
  xpathBtnWithLabel(labelName: string, index = 1): string {
    return `(//button[@aria-label='${labelName}' or normalize-space()='${labelName}' or child::*[normalize-space()='${labelName}']])[${index}]`;
  }

  constructor(page: Page, domain?: string) {
    this.page = page;
    this.domain = domain;
  }

  /**
   * Xpath image main of product on SF
   * * @param title : name of product
   * @returns
   */
  getXpathMainImageOnSF(title: string, index = 1) {
    return `(//div[@class='VueCarousel-inner']//div[contains(@class,'VueCarousel-slide-active')]//img[@alt='${title}'] | //div[@class='VueCarousel-inner']//div[contains(@class,'media-gallery-carousel__slide-active')]//img[@alt='${title}'])[${index}]`;
  }

  /**
   * popup live preview
   * @param index
   */
  xpathPopupLivePreview(index = 1): string {
    return `(//img[@alt='Preview image'])[${index}]`;
  }

  getXpathCustomOptionName(customOptionName: string): string {
    return `//div[contains(@class,'product-property product-custom-option')]//div[normalize-space()='${customOptionName}']`;
  }

  async goto(path = "", useRouter = false) {
    if (useRouter) {
      await this.page.evaluate(routerPath => {
        // eslint-disable-next-line
        return (window as any).registerPlugin().config.globalProperties.$router.push(`${routerPath}`);
      }, `/${path}`.replace(/([^:]\/)\/+/g, "$1"));
      await waitForProgressBarDetached(this.page);
      return;
    }

    let url = "https://" + (this.domain + "/" + path).replace(/([^:]\/)\/+/g, "$1");
    if (path.startsWith("http")) {
      url = path;
    }

    await this.page.goto(url);
    await this.page.waitForLoadState("load");
  }

  genLoc(selector: string) {
    return this.page.locator(selector);
  }

  genLocFirst(selector: string) {
    return this.page.locator(selector).first();
  }

  genFrame(selector: string) {
    return this.page.frameLocator(selector);
  }

  async getTextContent(locator: string, page = this.page): Promise<string> {
    return (await page.locator(locator).textContent()).trim();
  }

  // get text on input field
  async getValueContent(locator: string): Promise<string> {
    return (await this.page.locator(locator).inputValue()).trim();
  }

  /**
   * Wait for selector loading on page is detached
   * @param timeout
   */
  async waitForLoaderDetached(timeout = 3000) {
    await this.page.waitForSelector(`//div[@class='loader']`, {
      state: "detached",
      timeout: timeout,
    });
  }

  /**
   * Filter with condition on dashboard, for Orders, Invoice, Transaction, Product ...
   * Cover for case dashboard old UI and dashboard with SPDS
   * All filter
   * @param btnLabelFilters is label of button click to display filter
   * @param filterCondition
   */
  async filterWithConditionDashboard(btnLabelFilters: string, filterCondition: Array<FilterCondition>, index = 1) {
    await this.clickOnBtnWithLabel(btnLabelFilters, index);
    await this.page.waitForSelector(
      "//div[contains(@class,'sidebar-header') or contains(@class, 'sb-drawer__container')]//*[contains(text(), 'Filters')]",
    );
    for (const i of filterCondition) {
      const xpathParent = `(//*[normalize-space()='${i.field}']//ancestor::div[contains(@class, 's-collapse-item') or contains(@class, 'sb-collapse-item')])[1]`;
      //extend field to filter
      if (i.field) {
        await this.page.click(xpathParent);
      }
      // choose or input value
      // filter by choose radio button
      if (i.radio) {
        await this.page.locator(`${xpathParent}//span[normalize-space()="${i.radio}"]`).setChecked(true);
      }
      //filter by input text in textbox
      if (i.value_textbox) {
        await this.waitUntilElementVisible(`${xpathParent}//input[@type='text']`);
        await this.page.locator(`${xpathParent}//input[@type='text']`).fill(i.value_textbox);
      }
      //filter: wait for display dropdown menu and select value
      if (i.select_ddl_value) {
        const xpathSelectValueEnable = "//div[@role='tab']//following-sibling::div[@role='tabpanel']//select";
        await this.waitUntilElementVisible(xpathSelectValueEnable);
        await this.page.locator(xpathSelectValueEnable).selectOption({ label: i.select_ddl_value });
      }
      //filter: click and wait for display dropdown menu and select value
      // for UI with SPDS or the dropdown is not include "select option" tag
      if (i.select_ddl_value_spds) {
        await this.page.locator(`${xpathParent}//button`).click();
        await this.page
          .locator(
            `//div/li[contains(@class,'sb-select-menu__item')]/*[normalize-space(text())='${i.select_ddl_value_spds}']`,
          )
          .click();
      }
      //filter: input value textbox and click choose
      if (i.input_ddl_value) {
        const listValue = i.input_ddl_value.split(",").map(item => item.trim());
        for (let i = 0; i < listValue.length; i++) {
          await this.page.click(`${xpathParent}//input[@type='text']`);
          await this.page.waitForSelector(
            `${xpathParent}//div[contains(@class, 'dropdown-menu') and @style="display: none;"]`,
            { state: "hidden" },
          );
          await this.page.hover(`${xpathParent}//*[normalize-space(text())= '${listValue[i]}']`);
          await this.page.click(`${xpathParent}//*[normalize-space(text())= '${listValue[i]}']`);
        }
      }
      // filter by choose checkbox (one or more)
      if (i.checkbox_array) {
        for (const k of i.checkbox_array) {
          await this.page.locator(`(${xpathParent}//*[normalize-space()='${k.checkbox}'])[last()]`).click();
        }
      }

      //filter by input then select value
      if (i.input_then_select_array) {
        for (const data of i.input_then_select_array) {
          await this.page.locator(`${xpathParent}//input`).fill(data.input_then_select);
          await this.page.waitForSelector(`${xpathParent}//div[contains(@class, 'dropdown-content')]`);
          await this.page.click(
            `${xpathParent}//span[contains(@class, 'dropdown-item')]//span[normalize-space(text())='${data.input_then_select}']`,
          );
        }
      }
      if (i.field) {
        //collapse field to filter
        await this.page.click(
          `(//*[normalize-space()='${i.field}']//ancestor::div[contains(@class, 'sidebar-filter__item') or contains(@class, 'sb-collapse-item__title')])[1]`,
        );
      }
    }
    await this.page.click(
      `//button[contains(@class, 'button is-primary')]//span[contains(text(), 'Done')] | //button[contains(@class, 'sb-filter__button')]//span[contains(text(), 'Apply')]`,
    );
    await this.page.waitForLoadState("load");
  }

  /**
   * clear all filters in dashboard
   * @param btnLabelFilters
   */
  async clearAllFilterDashboard(btnLabelFilters: string) {
    await this.clickOnBtnWithLabel(btnLabelFilters);
    await this.page.waitForSelector(
      "//div[contains(@id,'new-sidebar-filter') or contains(@class, 'sb-drawer__container') or contains(@class,'sidebar-header')]//*[contains(text(), 'Filters')]",
    );
    await this.clickOnBtnWithLabel("Clear all filters");
    await this.page.click(
      "//div[contains(@class, 'footer')]//span[contains(text(), 'Apply') or contains(text(), 'Done')]",
    );
    await this.page.waitForLoadState("load");
  }

  /**
   * Click on any button with name of the button
   * @param labelName name of the button
   * @param index default value is 1 or as input
   */
  async clickOnBtnWithLabel(labelName: string, index = 1) {
    const xpath =
      `(//button[normalize-space()='${labelName}' or child::*[normalize-space()='${labelName}']] ` +
      ` | //span[normalize-space()='${labelName.toUpperCase()}'])[${index}]`;
    await this.page.waitForSelector(xpath, { timeout: 90000 });
    await this.page.locator(xpath).scrollIntoViewIfNeeded();
    await this.page.locator(xpath).hover();
    await this.page.click(xpath);
    if (
      await this.page
        .locator(
          `(//button[contains(@class, 'loading') and not(@disabled= 'disabled') and normalize-space()='${labelName}'])[${index}]`,
        )
        .isVisible()
    ) {
      await this.waitUntilElementInvisible(
        `(//button[contains(@class, 'loading') and normalize-space()='${labelName}'])[${index}]`,
      );
    }
  }

  /**
   * Click on any text link
   * @param labelName name of the button link that you what to click on
   * @param index default value is 1 or as input
   */
  async clickOnTextLinkWithLabel(labelName: string, index = 1) {
    const xpath = `(//a[normalize-space()='${labelName}'])[${index}]`;
    await this.page.locator(xpath).scrollIntoViewIfNeeded();
    await this.page.click(xpath);
  }

  /**
   * Click on any button link
   * @param labelName name of the button link that you what to click on
   * @param index default value is 1 or as input
   */
  async clickOnBtnLinkWithLabel(labelName: string, index = 1) {
    const xpath = `(//*[normalize-space()='${labelName}' and contains(@class, 'button')])[${index}]`;
    await this.page.locator(xpath).scrollIntoViewIfNeeded();
    await this.page.click(xpath);
  }

  // click on any button on a popup
  async clickButtonOnPopUpWithLabel(labelName: string, index = 1) {
    const xpath =
      `(//div[contains(@class, 'sb-popup__footer') or ` +
      `contains(@class, 's-modal-footer')]//button//span[normalize-space()='${labelName}'])[${index}]`;
    await this.page.locator(xpath).scrollIntoViewIfNeeded();
    await this.page.locator(xpath).click();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async inputTextBoxWithLabel(labelName: string, value: any, index = 1) {
    await this.page.locator(`(//input[preceding::*[text()[normalize-space()='${labelName}']]])[${index}]`).fill(value);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async inputTextAreaWithLabel(labelName: string, value: any) {
    await this.page
      .locator(`//label[contains(text(),'${labelName}')]//parent::*//following-sibling::*//textarea`)
      .fill(value);
  }

  async clickRadioButtonWithLabel(labelName: string, index = 1) {
    await this.page
      .locator(
        `(//span[contains(@class,'s-check')][following-sibling::*[text()[normalize-space()='${labelName}']]])[${index}] ` +
          `| (//input[following-sibling::span[contains(@class,'sb-check') and normalize-space()='${labelName}']])[${index}]` +
          `| (//span[contains(@class,'s-check')][following-sibling::span//*[text()[normalize-space()='${labelName}']]])[${index}]`,
      )
      .click();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async navigationWith(cb): Promise<any> {
    return Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), cb()]);
  }

  async waitUntilElementVisible(locator: string, timeout = 15000) {
    await expect(this.page.locator(locator)).toBeVisible({ timeout: timeout });
  }

  async waitUntilElementInvisible(locator: string) {
    await expect(this.page.locator(locator)).toBeHidden({ timeout: 20000 });
  }

  /**
   * Wait element in some milisecond before check is it visible or not
   * Only using this function when you have no choice. Prefer using isVisible() as normally
   * @param xpath element that you want to verify
   * @param timeout by default is 1000 milisecond
   * @returns boolean
   */
  async isElementVisibleWithTimeout(xpath: string, timeout = 1000): Promise<boolean> {
    const waitTime = new Promise(resolve => setTimeout(resolve, timeout));
    await waitTime;
    return await this.page.locator(xpath).isVisible();
  }

  async clickElementAndNavigateNewTab(context: BrowserContext, locator: Locator) {
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      locator.click(), // Opens a new tab
    ]);
    await newPage.waitForLoadState("load");

    return newPage;
  }

  /*
   * Input value in text field
   * @param parentXpath - parent xpath
   * @param labelName - label name
   * @param value - input text field
   * @param resOrder - index of xpath element
   */
  async inputFieldWithLabel(parentXpath = "", labelName: string, value: string, resOrder = 1) {
    return await this.genLoc(
      `(${parentXpath}//input[contains(@placeholder,'${labelName}') or contains(text(),'${labelName}')])[${resOrder}] ` +
        `| (${parentXpath}//textarea[contains(@placeholder,'${labelName}') or contains(text(),'${labelName}')])[${resOrder}]`,
    ).fill(value);
  }

  async clickOnFieldWithLabel(parentXpath: string, labelName: string, resOrder: number) {
    return await this.genLoc(
      `(${parentXpath}//input[contains(@placeholder,'${labelName}') or contains(text(),'${labelName}')])[${resOrder}]`,
    ).click();
  }

  async clickElementWithLabel(typeXpath: string, labelName: string, order = 1) {
    const xpath = `(//${typeXpath}[normalize-space()='${labelName}'])[${order}]`;
    await this.genLoc(xpath).scrollIntoViewIfNeeded();
    await this.page.click(xpath);
  }

  /*
   * Hover and click to element
   */
  async hoverThenClickElement(selectorToHover: string, selectorToClick: string) {
    await this.page.hover(selectorToHover);
    await this.page.click(selectorToClick);
  }

  async clickOnCheckboxWithLabel(labelName: string, index = 1) {
    const xpath = `(//span[normalize-space()='${labelName}']/preceding::span[@class='s-check'])[${index}]`;
    const ischecked = await this.isTickBoxChecked({ textLabel: labelName });
    if (!ischecked) {
      await this.genLoc(xpath).click();
    }
  }

  /**
   * Select option with option name
   * @param labelName Option name
   */
  async selectOptionWithLabel(labelName: string) {
    const xpath = `(//*[normalize-space()='${labelName}' or @value='${labelName}']//ancestor::*[contains(@class, 's-radio')])`;
    await this.page.waitForSelector(xpath);
    await this.genLoc(xpath).click();
  }

  async waitAbit(miliseconds: number) {
    await this.page.waitForTimeout(miliseconds);
  }

  /**
   * verify checkbox is checked or not. If checbox is not checked, click on checkbox
   * @param xpathCheckbox xpath of checkbox
   * @param isCheck expect status is true or false
   */
  async verifyCheckedThenClick(xpathCheckbox: string, isCheck: boolean) {
    const isStatus = await this.page.isChecked(xpathCheckbox);
    if (isStatus !== isCheck) {
      await this.page.check(xpathCheckbox);
    }
    const popup = await this.page
      .locator("//*[@id='create-product']//p[normalize-space()='Learn more about Custom Art service']")
      .isVisible();
    if (popup) {
      await this.page.click(
        "//*[@id='create-product']//p[normalize-space()='Learn more about Custom Art service']/following-sibling::button",
        { timeout: 9000 },
      );
    }
  }

  /**
   * Verify a checkbox/ a radio btn is being checked or not
   * @param options can check by text label or xpath of checkbox
   * @returns
   */
  async isTickBoxChecked(options: { textLabel?: string; xpathCheckbox?: string }): Promise<boolean> {
    let xpath: string;
    if (options.textLabel) {
      xpath = `//span[@class='s-check'][following-sibling::*[text()[normalize-space()='${options.textLabel}']]]`;
    }
    if (options.xpathCheckbox) {
      xpath = options.xpathCheckbox;
    }
    await this.page.locator(xpath).scrollIntoViewIfNeeded();
    return await this.page.isChecked(xpath);
  }

  /**
   * Verify current page is Thankyou page or not with timeout.
   * **Usage**
   * ```js
   * await isThankyouPage();
   * await isThankyouPage({ timeout: 3000 });
   * await checkout.isThankyouPage({ ignorePPC: true, timeout: 5000 })
   * ```
   * @returns
   */
  async isThankyouPage(
    options: {
      /**
       * Default undefined => close PPC pop-up if it's existed.
       */
      ignorePPC?: boolean;
      /**
       * Time to retry the assertion for. Default wait 5s.
       */
      timeout: number;
    } = { ignorePPC: false, timeout: 5000 },
  ): Promise<boolean> {
    await this.waitUntilElementInvisible(`//button[contains(@class, 'is-loading')]`);
    if (!options.ignorePPC && (await this.isElementExisted(this.xpathClosePPCPopUp))) {
      await this.closePostPurchase();
    }
    return await this.isElementVisibleWithTimeout(`//*[normalize-space()='Thank you!']`, options.timeout);
  }

  /**
   * Close PPC popup without ad any item
   */
  async closePostPurchase() {
    await this.page.waitForSelector(this.xpathClosePPCPopUp, { timeout: 5000 });
    if (await this.page.locator(this.xpathClosePPCPopUp).isVisible()) {
      await this.page.click(this.xpathClosePPCPopUp);
    }
    await expect(this.page.locator(this.xpathClosePPCPopUp)).toBeHidden({ timeout: 120000 });
  }

  /**
   * Verify toast message is displayed or not.
   * @returns
   */
  async isToastMsgVisible(message: string): Promise<boolean> {
    const xpath =
      `//div[@class='s-toast is-dark is-bottom' or @class = 's-toast is-danger is-bottom' ` +
      `or @class='s-toast is-success is-bottom']` +
      `//div[contains(text(),"${message}")]`;
    return await this.isElementExisted(xpath);
  }

  /**
   * Get text on tooltip
   */
  async getTextOnTooltip(selectorToHover: string, selectorToolTip: string) {
    await this.page.waitForSelector(selectorToHover);
    await this.page.locator(selectorToHover).hover();
    await this.page.waitForSelector(selectorToolTip);
    return await this.page.locator(selectorToolTip).textContent();
  }

  /**
   * Verify popup is displayed or not with title.
   * @returns
   */
  async isPopUpDisplayed(popUpTitle: string, index = 1): Promise<boolean> {
    const xpathTitle = `(//div[@class='sb-popup__header' or @class='s-modal-header']//*[contains(text(), '${popUpTitle}')])[${index}]`;
    await this.page.waitForSelector(xpathTitle);
    return this.page.locator(xpathTitle).isVisible();
  }

  /**
   * get data table by column and row
   * @param numberTable la vị trí của table
   * @param column la vị trí của cột
   * @param row la vị trí của hàng
   *  return data of table
   */
  async getDataTable(numberTable: number, column: number, row: number): Promise<string> {
    const xpath = `(//table/tbody)[${numberTable}]/tr[${column}]/td[${row}]`;
    return await this.genLoc(xpath).innerText();
  }

  /**
   * get data by column's label, default get the 1st row
   * @param label column's lable
   * @param rowIndex index of row
   * @returns
   */
  async getDataByColumnLabel(
    label: string,
    rowIndex = 1,
    xpathIndex = "last()",
    xpathChild = "//span",
  ): Promise<string> {
    let data: string;
    let i = 1;
    await this.page.waitForSelector(`//table//tr//th[normalize-space()='${label}']`);
    const xpathRow = this.page.locator(`//table//tr//th[normalize-space()='${label}']/preceding-sibling::th`);
    const colIndex = (await xpathRow.count()) + 1;
    const xpathData = `(//table/tbody//tr[${rowIndex}]//td[${colIndex}]${xpathChild})[${xpathIndex}]`;
    try {
      await this.page.locator(xpathData).isVisible();
    } catch (e) {
      await Promise.resolve();
    }
    do {
      data = await this.getTextContent(xpathData);
      i++;
      await this.page.waitForTimeout(500);
    } while (data === "" && i <= 10);
    return data;
  }

  /*
   * get data by row's label, default get the 1st column
   * param: label
   */
  async getDataByRowLabel(label: string): Promise<string> {
    let data: string;
    let i = 1;
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector("//h4[normalize-space()='Detail']//following-sibling::div[@class='d-flex']");
    const xpathTitle = `//div[@class='p-b' and normalize-space()='${label}']`;
    const xpathRow = `${xpathTitle}//preceding-sibling::div`;
    const row = this.page.locator(xpathRow);
    const rowIndex = (await row.count()) + 1;
    const xpathData = `(${xpathTitle}/../following-sibling::div//div)[${rowIndex}]`;
    await this.page.waitForSelector(xpathData);
    try {
      await this.page.locator(xpathData).isVisible();
    } catch (e) {
      await Promise.resolve();
    }
    do {
      data = await this.getTextContent(xpathData);
      i++;
    } while (data === "" && i <= 10);
    return data;
  }

  /** Drag and drop element
   * @param from
   * @param to
   * @param isHover
   * @param callBack
   */
  async dragAndDrop({ from, to, isHover = false, callBack }: DragAndDropInfo) {
    const coordinatesTo = { x: 0, y: 0 };
    const fromLocator = from.iframe
      ? this.page.frameLocator(from.iframe).locator(from.selector)
      : this.genLoc(from.selector);
    const toLocator = to.iframe ? this.page.frameLocator(to.iframe).locator(to.selector) : this.genLoc(to.selector);

    await toLocator.scrollIntoViewIfNeeded();
    const toBox = await toLocator.boundingBox();
    coordinatesTo.x = typeof to.left !== "undefined" ? toBox.x + to.left : toBox.x + toBox.width / 2;
    coordinatesTo.y = typeof to.top !== "undefined" ? toBox.y + to.top : toBox.y + toBox.height;

    await fromLocator.hover({ position: { x: 1, y: 1 } });
    await this.page.mouse.down();
    await this.page.mouse.move(coordinatesTo.x, coordinatesTo.y, { steps: 3 });
    if (isHover) {
      await toLocator.hover();
    }

    await this.page.waitForTimeout(500);

    if (typeof callBack === "function") {
      await callBack({ page: this.page, x: coordinatesTo.x, y: coordinatesTo.y });
    }
    await this.page.mouse.up();
  }

  /**
   * Locator preview by product line item
   * @param productName
   * @returns
   */
  async locatorPreviewPrintFile(productName: string) {
    return this.page.locator(
      `//div[contains(@class,'unfulfilled') and descendant::*[normalize-space()='${productName}']]//a[contains(text(),'Preview')]`,
    );
  }

  /**
   * Locator download by product line item
   * @param productName
   * @returns
   */
  async locatorDownloadPrintFile(productName: string) {
    return this.page.locator(
      `//div[contains(@class,'unfulfilled') and descendant::*[normalize-space()='${productName}']]//a[contains(text(),'Download')]`,
    );
  }

  /**
   * Locator edit by product line item
   * @param productName
   * @returns
   */
  async locatorEditPrintFile(productName: string) {
    return this.page.locator(
      `//div[contains(@class,'unfulfilled') and descendant::*[normalize-space()='${productName}']]//span[contains(text(),'Edit')]`,
    );
  }

  /**
   * Click take action by product line item
   * @param productName
   * @returns
   */
  async clickActivatePrintFile(productName: string) {
    await this.page
      .locator(
        `//div[contains(@class,'unfulfilled') and descendant::*[normalize-space()='${productName}']]//span[@class='s-icon is-small']`,
      )
      .click();
  }

  /**
   * Check locator is visible or not
   * @param selector is selector of element
   */
  async checkLocatorVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Click on element
   * @param selector is selector of element
   * @param iframe if selector is in other frame
   */
  async clickOnElement(selector: string, iframe?: string): Promise<void> {
    if (iframe) {
      const box = await this.page.frameLocator(iframe).locator(selector).boundingBox();
      await this.page
        .frameLocator(iframe)
        .locator(selector)
        .click({ position: { x: box.width - 5, y: box.height - 5 } });
      /**
       * Thay đổi click bottom right của element cover case element trong web builder
       *  -5 px để tránh case ko click được vào border của element.
       **/
    } else {
      await this.page.locator(selector).click({ delay: 200 });
    }
  }

  //Click on breadcrumb on dashboard
  async clickOnBreadcrumb() {
    await this.page.click("//ol[contains(@class,'s-breadcrumb')] | //button[contains(@class,'btn-back')]");
  }

  /**
   * Verify dashboard page display with
   * @param pageTitle page name
   * @returns boolean
   */
  async isDBPageDisplay(pageTitle: string, timeout = 3000): Promise<boolean> {
    let result = false;
    const xpath = [
      `(//h4[normalize-space()='${pageTitle}'])[1]`,
      `(//h2[normalize-space()='${pageTitle}'])[1]`,
      `(//h1[normalize-space()='${pageTitle}'])[1]`,
      `(//div[normalize-space()='${pageTitle}'])[1]`,
      `(//span[normalize-space()='${pageTitle}'])[1]`,
      `(//p[normalize-space()='${pageTitle}'])[1]`,
    ];
    const listResult = await Promise.all(
      xpath.map(item => {
        return this.isElementVisibleWithTimeout(item, timeout);
      }),
    );

    result = listResult.includes(true) ? true : false;
    return result;
  }

  /**
   * Verify is the Free trial box displayed on Homepage dashboard
   * @returns boolean
   */
  async isFreeTrialBoxDisplayed(timeout = 3000): Promise<boolean> {
    return await this.isElementVisibleWithTimeout(
      `//div[contains(@class, 'trial-box')
    or contains(@class, 'activation-subscription-bar')
    or contains(@class, 'activation-subscription-bar')]`,
      timeout,
    );
  }

  /**
   * Check a text content is visible
   * @param text
   * @returns
   */
  async isTextVisible(text: string, index = 1, timeout = 3000): Promise<boolean> {
    const xpath = `(//*[contains(text(),"${text}")])[${index}]`;
    return await this.isElementExisted(xpath, null, timeout);
  }

  /**
   * Check a text content is visible
   * @param parent
   * @param text
   * @param index
   * @param timeout
   * @returns
   */
  async isParentTextVisible(text: string, parent = "", index = 1, timeout = 3000): Promise<boolean> {
    const xpath = `(${parent}//*[contains(text(),"${text}")])[${index}]`;
    return await this.isElementExisted(xpath, null, timeout);
  }

  /**
   * Check a text content is visible
   * @param placeHolder
   * @returns
   */
  async isTextBoxExist(placeHolder: string, index = 1): Promise<boolean> {
    const xpath = `(//*[contains(@placeholder,"${placeHolder}")])[${index}]`;
    return await this.isElementExisted(xpath);
  }

  /**
   * caculate printbase profit
   * @param subtotal : not involve tax amount
   * @param tip
   * @param shippingFee
   * @param taxAmount
   * @param storeDiscount: Recent: only just handle for store discount,
   *                       Improve: need platform discount involved in
   * @param baseCost
   * @param designFee
   * @param paymentFeePercent
   * @param processingFeePercent
   * @returns order profit, payment fee and processing fee
   * @deprecated use function calculateProfitPrintbase
   */
  calculateProfitPbase(
    subtotal: number,
    tip: number,
    shippingFee: number,
    taxAmount: number,
    storeDiscount: number,
    baseCost: number,
    designFee: number,
    paymentFeePercent: number,
    processingFeePercent: number,
    markupShipping = 0,
  ): { paymentFee: number; processingFee: number; profit: number } {
    const paymentFee = (subtotal + tip + shippingFee + taxAmount - storeDiscount) * paymentFeePercent;
    const processingFee =
      (subtotal - baseCost - paymentFee - storeDiscount - designFee + tip + markupShipping) * processingFeePercent;
    const profit = subtotal - storeDiscount - baseCost - designFee - paymentFee - processingFee + tip + markupShipping;
    const ordFeesAndProfit = {
      paymentFee: paymentFee,
      processingFee: processingFee,
      profit: profit,
    };
    return ordFeesAndProfit;
  }

  /**
   * caculate order printbase profit
   * @returns order profit, payment fee and processing fee
   */

  calculateProfitPrintbase(infos: CalculateProfitInfos): ProfitInfos {
    const profitInfo = {
      payment_fee: 0,
      profit: 0,
      processing_fee: 0,
    };
    const subtotal = infos.sub_total;
    const tip = infos.tip;
    const taxAmount = infos.tax_amount;
    const storeDiscount = infos.store_discount;
    const paymentFeePercent = infos.payment_fee_percent;
    const designFee = infos.design_fee;
    const baseCost = infos.base_cost;
    const processingFeePercent = infos.processing_fee_percent;
    const shippingFee = infos.shipping_fee;
    const paymentFee = (subtotal + tip + shippingFee + taxAmount - storeDiscount) * paymentFeePercent;
    const processingFee = (subtotal - baseCost - paymentFee - storeDiscount - designFee + tip) * processingFeePercent;
    const profit = subtotal - storeDiscount - baseCost - designFee - paymentFee - processingFee + tip;
    profitInfo.payment_fee = paymentFee;
    profitInfo.processing_fee = processingFee;
    profitInfo.profit = profit;
    return profitInfo;
  }

  async calProfitSPayV2Order(orderAmount: number, processingRate = 0.035, extrafee = 0.3): Promise<number> {
    const paymentProcessingFee = orderAmount * processingRate + extrafee;
    return orderAmount - paymentProcessingFee;
  }

  /**
   * get all content of element
   * @param element
   */

  async getAllTextContents(element: string): Promise<Array<string>> {
    return await this.genLoc(element).allTextContents();
  }

  /**
   * @deprecated: use src/core/utils/object.ts instead
   */
  cloneObject<TReturnType>(sourceObject: object, excludeFields: string[] = []): TReturnType {
    excludeFields = excludeFields || [];
    const newObject = {} as TReturnType;
    for (const key in sourceObject) {
      if (Object.prototype.hasOwnProperty.call(sourceObject, key) && excludeFields.indexOf(key) < 0) {
        newObject[key] = sourceObject[key];
      }
    }
    return newObject;
  }

  /**
   * clear input data before fill in case input field have a value
   * @param selector element's xpath
   */

  async clearInPutData(selector: string) {
    await this.page.locator(selector).click();
    await this.page.fill(selector, "");
  }

  /**
   * clear input data before fill in case input field have a value
   * support locator have iframe; TinyMCE editor
   * @param locator locator of text-box
   */
  async clearTextBoxContent(locator: Locator) {
    let currentContent = await locator.textContent();
    await locator.click();
    while (currentContent) {
      // Try again to be sure
      await locator.fill("");
      currentContent = await locator.textContent();
    }
  }

  /**
   * Remove live chat on dashboard
   */
  async removeLiveChat(): Promise<void> {
    const xpathLiveChat = "//div[@id='crisp-chatbox']//span[child::span[@data-id='chat_closed']]";
    if (await this.page.locator(xpathLiveChat).isVisible()) {
      await this.page.waitForSelector(xpathLiveChat);
      const logger = OcgLogger.get();
      try {
        await this.page.evaluate(() => {
          document.querySelector("#crisp-chatbox").remove();
        });
        await this.waitUntilElementInvisible(xpathLiveChat);
      } catch (e) {
        logger.error("Error: ", e);
      }
    }
    await this.page.waitForTimeout(1000);
  }

  /**
   * Remove block Title Description in Product Details
   */
  async removeBlockTitleDescription(): Promise<void> {
    const xpathPage = "//main[contains(@class, 'unite-ui-dashboard__main')]/child::div";

    if (await this.page.locator(xpathPage).isVisible()) {
      await this.page.waitForSelector(xpathPage);
      const logger = OcgLogger.get();
      try {
        await this.page.evaluate(() => {
          document.querySelector(".title-description").remove();
        });
        await this.waitUntilElementInvisible(this.xpathLocatorIframe);
      } catch (e) {
        logger.error("Error: ", e);
      }
    }
  }

  /**
   * wait for element to be visible then invisible
   * wait 2s to check selector visiable
   * @param selector element's xpath
   */
  async waitForElementVisibleThenInvisible(selector: string): Promise<void> {
    for (let i = 0; i < 10; i++) {
      if (await this.page.locator(selector).isVisible({ timeout: 15000 })) {
        await this.page.waitForSelector(selector, { state: "hidden" });
        break;
      }
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Set attribute for element
   * @param data
   */
  async setAttribute(data: SetAttribute) {
    const frame = data.iframe ? this.page.frameLocator(data.iframe) : this.page;
    await frame.locator(data.selector).evaluate((element, data: SetAttribute) => {
      element.setAttribute(data.attributeName, data.attributeValue);
    }, data);
  }

  /**
   * Reload page until an element disable
   * @param selector xpath of the Element that you want to verify it visible or not
   * @param times times of reload
   */

  async reloadPageUntilConditionFailed(condition: boolean, times = 3) {
    for (let i = 0; i < times; i++) {
      await this.page.waitForTimeout(2000);
      if (condition) {
        await this.page.reload();
      } else {
        break;
      }
    }
  }

  /**
   * Get width/height of element
   * Support get element's size in iframe that width/height of element > width/height of screen
   * @param selector
   * @param iframe
   */
  getElementSize(selector: string, iframe?: string): Promise<{ width: number; height: number }> {
    return this.page
      .frameLocator(iframe)
      .locator(selector)
      .evaluate(async () => {
        return new Promise(resolve => {
          resolve({
            width: document.body.scrollWidth,
            height: document.body.scrollHeight,
          });
        });
      }) as Promise<{ width: number; height: number }>;
  }

  /**
   * Get Payment method which is displayed thank you page
   * @returns return payment method that displayed on thank you page
   */
  async getPaymentMethodOnThnkPage(): Promise<string> {
    const xpathPayment = `//h3[normalize-space()='Payment']//ancestor::div[contains(@class, 'section__column')]//li[@class='payment-method-list__item']//span`;
    return await this.getTextContent(xpathPayment);
  }

  /**
   * Close onboarding popup on dashboard
   */
  async closeOnboardingPopup(): Promise<void> {
    const xpathOnboardingPopup = "//div[contains(@class,'onboarding-popup')]";
    if (await this.page.locator(xpathOnboardingPopup).isVisible({ timeout: 3000 })) {
      const status = await this.page.locator(xpathOnboardingPopup).getAttribute("class");
      if (status.includes("active")) {
        await this.page.click(`${xpathOnboardingPopup}//div[@class='button-close']//i`);
      }
    }
  }

  /**
   * Remove logo on Storefront
   */
  async removeBarLogoOnStorefront(): Promise<void> {
    const xpathBarLogo =
      "//div[contains(@class,'s-flex--align-center')][child::div//div[@class='mbar__content__logo']]";
    await this.page.waitForSelector("//div[@class='mbar__content__logo']");
    const logger = OcgLogger.get();
    try {
      await this.page.evaluate(() => {
        document.querySelector(xpathBarLogo).remove();
      });
      await this.waitUntilElementInvisible(xpathBarLogo);
    } catch (e) {
      logger.error("Error: ", e);
    }
  }

  //Verify is error messsage displayed
  async isErrorTextDisplayed(message: string): Promise<boolean> {
    await this.waitUntilElementVisible("//div[@class='s-form-item__error']");
    return await this.page
      .locator(`//*[contains(@class, 's-form-item__error') and normalize-space()="${message}"]`)
      .isVisible();
  }

  /**
   *  Click on any button on a popup by class
   *  @param className class name of button
   */
  async clickButtonOnPopUpByClass(className: string, index = 1) {
    const xpath = `(//button[contains(@class,'${className}')])[${index}]`;
    await this.page.locator(xpath).click();
  }

  /**
   * wait for toast message hide
   * @param message
   */
  async waitForToastMessageHide(message: string): Promise<void> {
    const xpath =
      `//div[@class='s-toast is-dark is-bottom' or @class = 's-toast is-danger is-bottom' ` +
      `or @class='s-toast is-success is-bottom']` +
      `//div[contains(text(),'${message}')]`;
    await this.page.waitForSelector(xpath);
    await this.page.waitForSelector(xpath, { state: "hidden" });
  }

  /**
   * Wait for button is visible
   * @param labelName
   * @param index
   */
  async checkButtonVisible(labelName: string, index = 1): Promise<boolean> {
    await this.page.waitForTimeout(3000);
    return await this.page
      .locator(`(//button[normalize-space()='${labelName}'])[${index}]`)
      .isVisible({ timeout: 5000 });
  }

  /**
   * get text content from toast message after create something
   */
  async getTextOfToast(type: "success" | "danger") {
    if (type === "success") {
      await this.page.waitForSelector("//div[contains(@class, 'sb-toast__container--default')]");
      return await this.page.textContent(this.xpathTextOfToast);
    } else {
      await this.page.waitForSelector("//div[contains(@class, 'sb-toast__container--danger')]");
      return await this.page.textContent(
        "//div[contains(@class, 'sb-toast__container--danger')]//*[@class = 'sb-toast__message sb-text-body-emphasis sb-toast__message--pr12']",
      );
    }
  }

  /**
   * get XPath with label of element
   */
  getXpathWithLabel(label: string, index = 1, className = "") {
    const classCondition = className ? ` and @class = '${className}'` : "";
    return `(//*[normalize-space() = '${label}'${classCondition}])[${index}]`;
  }

  /**
   *Function to click icon ESC of message
   */
  clickESCMess() {
    this.page.click("//i[contains(@class,'s-icon-close')]");
  }

  /**
   * Get xpath by type xPath and class name
   * @param className
   * @param tag
   * @param index
   *
   */
  getXpathByTagNameAndClass(tag: string, className: string, index = 1): string {
    return `(//${tag}[@class='${className}'])[${index}]`;
  }

  // Clear all tracking event
  async clearTrackingEvent() {
    await this.page.evaluate(`window.sbTrackingLogs('reset')`);
  }

  /**
   * Wait state xpath
   * @param selector
   * @param state
   */
  async waitForXpathState(selector: string, state) {
    const wait = await this.page.waitForSelector(selector);
    return wait.waitForElementState(state);
  }

  /**
   * Check if alert with textlink visible
   * @param text Alert text
   * @param textLink - Text link
   * @param url - Url link
   */
  async isAlertWithLinkVisible(text: string, textLink: string, url: string, htmlTag = "div") {
    return await this.isElementVisibleWithTimeout(
      `//${htmlTag}[contains(text(), "${text}")]/a[text()[normalize-space()="${textLink}"] and @href = '${url}']`,
    );
  }

  /**
   * Close alert spds
   * @param index - Index of alert
   */
  async closeSbAlert(index = 0) {
    await this.page.locator(".sb-alert").nth(index).locator(".sb-alert__icon-close").click();
  }

  /**
   * Hàm convert dải màu từ mã Hex sang dạng RGB(r,g,b)
   * @param hex
   * @returns
   */
  convertHexToRGB(hex: string): string {
    return (hex = hex.replace("#", ""))
      .match(new RegExp("(.{" + hex.length / 3 + "})", "g"))
      .map(l => {
        return parseInt(hex.length % 2 ? l + l : l, 16);
      })
      .join(", ");
  }

  /**
   * Validate the existence of the element, return true or false with timeout
   * @param xpath
   * @param frameParent: in case xpath is in iframe
   * @param timeout
   */
  async isElementExisted(xpath: string, frameParent?: Page | FrameLocator | null, timeout = 3000): Promise<boolean> {
    try {
      if (frameParent) {
        try {
          await frameParent.locator(xpath).waitFor({ state: "visible", timeout: timeout });
        } catch (e) {
          return false;
        }
      } else {
        try {
          await this.page.waitForSelector(xpath, { timeout: timeout });
        } catch (e) {
          return false;
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * clear all cache for this page
   */
  async clearCachePage() {
    await this.page.evaluate(() => window.localStorage.clear());
    await this.page.evaluate(() => window.sessionStorage.clear());
  }

  /**
   * Mở product detail với handle
   * @param handle
   */
  async gotoProductDetail(handle: string): Promise<void> {
    await this.page.goto(`https://${this.domain}/products/${handle}`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * click on tab
   * @param tabName name of tab
   */
  async clickOnTab(tabName: string, tagName = "p") {
    const xpathTab = `//${tagName}[contains(text(),'${tabName}')]`;
    await this.page.waitForSelector(xpathTab);
    await this.page.locator(xpathTab).click();
    await this.page.waitForLoadState("networkidle");
  }

  waitResponseWithUrl(url: string, timeOut = 15000): Promise<Response> {
    return this.page.waitForResponse(response => response.url().includes(url) && response.status() === 200, {
      timeout: timeOut,
    });
  }

  async waitForResponseIfExist(url: string, timeout = 5000) {
    try {
      return await this.page.waitForResponse(response => response.url().includes(url) && response.status() === 200, {
        timeout: timeout,
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * click 'x' icon to close alert
   */
  async clickCloseAlert() {
    await this.page.locator(`//button[contains(@class,'sb-alert__icon-close')]`).click();
  }

  /**
   * remove text visible on blog
   */
  async removeTextTimeVisibleOnBlog(): Promise<void> {
    const xpathTime = "span[class='s-control-label'] span span";
    await this.page.waitForSelector(
      "//div[@class='blog-layout__item' and descendant::div[normalize-space()='Visibility']]",
    );
    if (await this.page.locator(xpathTime).isVisible()) {
      const logger = OcgLogger.get();
      try {
        await this.page.evaluate(() => {
          document.querySelector("span[class='s-control-label'] span span").remove();
        });
        await this.waitUntilElementInvisible(xpathTime);
      } catch (e) {
        logger.error("Error: ", e);
      }
    }
  }

  /**
   * remove text visible on blog
   */
  async removeTextURLOnBlog(): Promise<void> {
    const xpathURL = ".google__url";
    await this.page.waitForSelector(
      "//section[@class='card search-engine' and descendant::div[normalize-space()='Search engine listing preview']]",
    );
    if (await this.page.locator(xpathURL).isVisible()) {
      const logger = OcgLogger.get();
      try {
        await this.page.evaluate(() => {
          document.querySelector(".google__url").remove();
        });
        await this.waitUntilElementInvisible(xpathURL);
      } catch (e) {
        logger.error("Error: ", e);
      }
    }
  }

  /**
   * Return locator of toast with the content
   * @param text the content of toast
   * @returns locator of toast with the content
   */
  toastWithMessage(text: string) {
    return this.genLoc(`//div[contains(@class, "s-toast") and normalize-space()="${text}"]`);
  }

  /**
   * *Wait for events in storefront page completed
   * @param shopDomain
   * @param eventName: name of event to wait
   */

  async waitForEventCompleted(shopDomain: string, eventName: string, timeout = 60000) {
    await this.page.waitForResponse(
      response =>
        response.url().includes("/api/actions.json") &&
        response.status() === 200 &&
        response.request().method() === "POST" &&
        response.request().postData().includes(eventName) &&
        response.request().postData().includes(shopDomain),
      { timeout: timeout },
    );
  }

  getBoundingBoxCenter(box: BoundingBox): BoundingBox {
    const _x = box.x + box.width / 2;
    const _y = box.y + box.height / 2;

    return {
      x: _x,
      y: _y,
      width: box.width,
      height: box.height,
    };
  }

  async waitNetworkIdleWithoutThrow(timeout = 8000) {
    try {
      await this.page.waitForLoadState("networkidle", { timeout: timeout });
    } catch (e) {
      logger.info(`Got network idle err`);
    }
  }

  /**
   * Verify error message is visible or not
   * @param errorMsg
   * @returns boolean
   */
  async isErrorMsgVisible(errorMsg: string, timeout = 1000): Promise<boolean> {
    const xpathError = `//*[contains(@class,'sb-form-item__message') or contains(@class,'error') and normalize-space()='${errorMsg}']`;
    try {
      await this.page.waitForSelector(xpathError, { timeout: timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify current checkout layout page is one-page automatically
   * @returns true or false
   */
  async isThreeStepsCheckout(): Promise<boolean> {
    let timeOut;
    if (process.env.ENV != "prod") {
      timeOut = 6000;
    } else {
      timeOut = 3000;
    }
    await this.page.waitForSelector("(//div[contains(@class,'order-summary')])[1]");
    const is3StepsCheckout = await this.isElementExisted(this.xpath.checkout.detectThreeStep, null, timeOut);
    return is3StepsCheckout;
  }

  /**
   * Wait until checkout page is loaded completely
   */
  async waitForCheckoutPageCompleteRender() {
    await Promise.all([
      this.page.waitForSelector(this.xpathCheckoutLayout),
      this.page.waitForSelector(this.xpathItemListOrderSumary),
    ]);
    if (!(await this.isThreeStepsCheckout())) {
      await Promise.all([
        this.page.locator(this.xpathFooterSF).scrollIntoViewIfNeeded(),
        this.page.waitForSelector(this.xpathShippingLabel),
      ]);

      // for case haven't shipping method
      const isNotShippingMethod = await this.isTextVisible(
        "There are no shipping methods available for your cart or address",
      );
      if (isNotShippingMethod) {
        return;
      }
      await this.page.waitForSelector(this.xpathPaymentMethodLabel);
    }
  }

  /**
   * Find the index of a row in a table, based on the presence of a given column name.
   * @param tableIndex - The index of the table (if there are multiple tables on the page).
   * @param rowName - The name of the row to search for within the table.
   * @returns The index of the first row containing the specified column name, or 0 if not found.
   */
  async getIndexOfRow(tableIndex: number, rowName: string): Promise<number> {
    const rows = await this.page.locator(`(//table/tbody)[${tableIndex}]/tr`).count();
    let index = 0;

    for (let rowIndex = 1; rowIndex <= rows; rowIndex++) {
      const xpath = `((//table/tbody)[${tableIndex}]/tr)[${rowIndex}]`;
      const cellData = await this.getTextContent(xpath);

      if (cellData.includes(rowName)) {
        index = rowIndex;
        break;
      }
    }
    return index;
  }

  /**
   * Return the index of a column in a table, based on the title of the column
   * @param label - The title of the column
   * @param table - The xpath of table
   * @returns
   */
  async getIndexOfColumn(label: string, table = "") {
    return (await this.page.locator(`${table}//th[normalize-space()="${label}"]/preceding-sibling::th`).count()) + 1;
  }

  /**
   * reload page until find element
   * @param xpath - element needs to find
   * @param times - times reload page
   * @param xpathScroll - in cases need to scroll to another element to show element need to find
   */
  async reloadUntilElementExisted(xpath: string, times = 1, xpathScroll?: string, timeOutEachReload = 3000) {
    for (let i = 0; i < times; i++) {
      if (xpathScroll) {
        await this.page.locator(xpathScroll).scrollIntoViewIfNeeded();
      }
      if (await this.isElementExisted(xpath, null, timeOutEachReload)) {
        return;
      } else {
        await this.page.reload();
        // Set timeout to avoid reload too many times
        await this.page.waitForTimeout(2000);
      }
    }
    if (!(await this.isElementExisted(xpath))) {
      throw new Error("Not found element!");
    }
  }

  /**
   * Xpath link with label
   * * @param labelName : name of link
   * @param index
   * @returns
   */
  xpathLinkWithLabel(labelName: string, index = 1): string {
    return `(//a[normalize-space()='${labelName}'])[${index}]`;
  }

  /**
   *  calculator profit margin in SO detail
   * @param shippingFee
   * @param processingRate
   * @param productCost
   * @returns profit margin
   */
  async calculatorProfitMargin(
    shippingFee: float,
    processingRate: float,
    productCost: float,
    paymentRate = 0.03,
    sellingPrice?: float,
  ) {
    if (sellingPrice == null) {
      await this.page.waitForLoadState("load");
      const sellingPice = Math.trunc(productCost * 3);
      sellingPrice = sellingPrice = parseFloat((sellingPice + 0.99).toString());
    }
    const paymentFee = (sellingPrice + shippingFee) * paymentRate;
    const processingFee = (sellingPrice - productCost - paymentFee) * (processingRate / 100);
    const profitMargin = sellingPrice - productCost - processingFee - paymentFee;
    return profitMargin.toFixed(2);
  }

  /**
   * Go to url with param x_lange
   */
  async gotoENLang(path: string, xLang = "en-us") {
    let url = "https://" + (this.domain + "/" + path);
    if (path.startsWith("http")) {
      url = path;
    }
    url = appendParameterToURL(url, "x_lang", xLang);
    await this.page.goto(url);
    await this.page.waitForLoadState("load");
  }

  // Input email at Mailinator search box
  async inputEmailToOpenMailBox(email: string, times = 5) {
    const xpathLogoMailinator = "//div[@class='nav-logo']";
    await this.page.goto(`https://www.mailinator.com/v4/public/inboxes.jsp`);
    await this.page.waitForLoadState("domcontentloaded");
    await this.reloadUntilElementExisted(xpathLogoMailinator, times, null, 5000);
    await this.page.locator("//input[contains(@title, 'Use ANY Inbox you want')]").fill(email);
    await this.page.locator("//button[normalize-space()='GO']").click();
  }
}
