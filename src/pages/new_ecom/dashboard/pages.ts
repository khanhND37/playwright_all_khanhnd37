import type { ListPageResponse, PageResponse, ResponsePolicyPage } from "@types";
import { expect, type Locator } from "@playwright/test";
import type { PageSettings, PageListItem, PolicyPage, PolicyPageDetail } from "./page";
import { ProductPage } from "@pages/dashboard/products";
import { pressControl } from "@core/utils/keyboard";

export class OtherPage extends ProductPage {
  public inputTitleSelector = '[placeholder="Page Title"]';
  public textValidateCreateNewPageSelector = ".sb-form-item--error .sb-form-item__message";
  public pageFormSelector = ".sb-form";
  public popupSelectTemplateSelector = "//div[contains(@class,'library-templates')]";
  public imageTemplateSelector = ".sb-choose-template__templates img";
  public buttonBackToListPages = "#page-header >> .sb-btn-back";
  public buttonApplyTemplateSelector = ".sb-choose-template__templates button";
  public buttonCloseChooseTemplate = ".sb-choose-template__close-btn";

  public buttonExitWebBuilderSelector = ".w-builder__header-exit-btn";

  public toastWebBuilderXPath = "//div[contains(@class,'toast')]";

  public searchInPageList = ".sb-filter__search input";
  public emptyPageSelector = ".sb-table__empty-text";

  public currentPopUp = ".sb-popup .sb-popup__container";
  public checkboxAllPages = ".sb-table__header-wrapper .sb-check";
  public tableHeader = ".sb-table__header-wrapper";
  public tooltipPageTitle = ".sb-form-item__message";
  public buttonSavePageDetail = '.actions__container button:has-text("Save")';
  public buttonCancelPageDetail = '.actions__container button:has-text("Cancel")';
  public dropListAddTag = ".sb-autocomplete__addable-row";
  public tagLabel = '[for="tags"]';
  public iconOfFieldTags = ".sb-autocomplete .sb-tag > span";
  public descriptionPageTextArea = '[placeholder="Page description"]';
  public xpathTextAreaFrame = "//iframe[contains(@id,'tiny-vue')]";
  public xpathAreaDescription = "//body[contains(@class,'content-body')]";
  public toastDefaultXPath = "//div[contains(@class, 'sb-toast__container--default')]";
  public dropDownMoreActionSelector = ".sb-dropdown-menu >> nth=1";
  public customizeButtonOnPageDetail = `//div[contains(@class, 'sb-block-item__content')]//span[contains(text(), 'Customize')]`;
  //Page selector
  public pagePanelSelector = ".w-builder__header-left .sb-ml-xs";
  public filterShopTypeSelector = ".w-builder__pages--shop-type .sb-button--label";
  public viewMoreButtonSelector = ".w-builder__page-groups--list .w-builder__page-groups--view-more";
  public pagePanelContentSelector = ".w-builder__main .w-builder__sidebar-content";
  public pageItemNameXpath = ".w-builder__page-groups--item .sb-text-caption";
  public btnSavePage = "//button[contains(@class, 'sb-button')]//span[contains(text(), 'Save')]";
  public popupHeader = ".sb-popup__header";
  public popupMessage = ".sb-popup__body";

  private accessToken: string;
  private path = "admin/pages";
  buttonAddNewPageSelector = ".sb-button--primary >> text='Add new page'";
  private buttonCloseCreateNewPageSelector = ".sb-popup__header-close";
  private buttonConfirmCreateNewPageSelector = ".sb-popup__footer-container > .sb-button--primary";

  private popupOverlay = "//div[contains(@class, 'sb-popup__wrapper') and contains(@class, 'sb-popup--overlay')]";
  selectorOtherPageContent = "(//div[contains(@class, 'wb-builder__row--container')])[3]";
  xpathBtnDesignSalePage = "button:has-text('Design sales page')";
  xpathTabCheckout = ".digital-product--tab .sb-tab-navigation__item:has-text('Checkout')";
  xpathBtnCheckoutDesign = "//p[contains(., 'Customize the checkout form')]/ancestor::div[1]//button";
  xpathSearchPage = "[placeholder='Search pages']";
  xpathPages = "//h4[normalize-space()='Pages']";
  xpathSkeletonTable = "//div[@class='sb-skeleton__table']";
  textDesInListTabPolicy = ".setting-page__block-desc";
  xpathTabNavFilter = "//div[contains(@id,'tab-navigation') and descendant::div[normalize-space()='All']]";
  textDesInListTabWP = ".sb-text-body-medium.sb-text-neutral-600";
  xpathPopupDisclaimer = "//div[contains(@class,'s-modal-content')]";
  xpathPageTable = "//table[contains(@class,'table-hover')]";
  xpathPageNotFound = "//h2[normalize-space()='Page not found']";
  xpathLearnMore = "//a[contains(normalize-space(),'Learn more.')]";
  xpathContentDMCAPage = `//section[@component="heading"]//span[normalize-space()="Intellectual property claim"]`;

  /* API calls */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   *
   * @param visible 1 visible, -1 invisible, 0 | undefined all
   * @returns
   */
  async getTotalPages(visible?: 0 | 1 | -1, totalIncluded?: boolean): Promise<ListPageResponse> {
    const params = {
      total: totalIncluded || false,
      order_by: "title",
      order_direction: "asc",
      visibility: "",
      limit: 30,
    };
    switch (visible) {
      case 1:
        params.visibility = "true";
        break;
      case -1:
        params.visibility = "fase";
        break;
    }
    const options = {
      headers: {
        "X-ShopBase-Access-Token": this.accessToken,
      },
      params,
      failOnStatusCode: true,
    };

    const response = await this.page.request.get(`https://${this.domain}/${this.path}.json`, options);

    const { total, pages } = await response.json();
    return { total, pages };
  }

  async createPage(pagePayload): Promise<PageResponse> {
    const payload = {
      page: pagePayload,
    };

    const options = {
      headers: {
        "X-ShopBase-Access-Token": this.accessToken,
      },
      failOnStatusCode: true,
      data: payload,
    };

    const response = await this.page.request.post(`https://${this.domain}/${this.path}.json`, options);
    const { page } = await response.json();
    return page as PageResponse;
  }

  async editPage(pagePayload: { title?: string; template?: string }, pageID: number): Promise<PageResponse> {
    try {
      const payload = {
        page: pagePayload,
      };

      const options = {
        headers: {
          "X-ShopBase-Access-Token": this.accessToken,
        },
        failOnStatusCode: true,
        data: payload,
      };

      const response = await this.page.request.put(`https://${this.domain}/${this.path}/${pageID}.json`, options);
      const { page } = await response.json();
      return page as PageResponse;
    } catch (e) {
      throw Error("Edit page fail");
    }
  }

  async deletePage(pageId: number): Promise<boolean> {
    const options = {
      headers: {
        "X-ShopBase-Access-Token": this.accessToken,
      },
      failOnStatusCode: true,
    };

    const response = await this.page.request.delete(`https://${this.domain}/${this.path}/${pageId}.json`, options);

    const { success } = await response.json();
    return success as boolean;
  }

  async deleteAllPages(): Promise<void> {
    const options = {
      headers: {
        "X-ShopBase-Access-Token": this.accessToken,
      },
      params: {
        total: true,
      },
    };

    // Recursively delete all pages since API get pages can only get total of 50 pages 😓
    let currentIteration = 0;
    const maxIterations = 100;

    while (currentIteration < maxIterations) {
      const response = await this.page.request.get(`https://${this.domain}/${this.path}.json`, options);

      const { pages, total } = await response.json();

      if (!total || !pages || !pages.filter(p => (p.page_type = null || !p.is_from_shop_template)).length) {
        break;
      }

      for (const { id } of pages.filter(p => (p.page_type = null || !p.is_from_shop_template))) {
        await this.deletePage(id);
      }

      currentIteration++;
    }
  }

  /* Methods */
  async goToUrlPath(): Promise<void> {
    await this.goto(this.path);
  }

  async waitForToastDefaultHidden(): Promise<void> {
    await this.page.waitForSelector(this.toastDefaultXPath, { state: "hidden" });
  }

  async waitForToastWebBuilderHidden(): Promise<void> {
    await this.page.waitForSelector(this.toastWebBuilderXPath, { state: "hidden" });
  }

  async openAddNewPagePopup(): Promise<void> {
    await this.genLoc(this.buttonAddNewPageSelector).click();
  }

  async closeAddNewPagePopup({ elementClickSelector = null } = {}): Promise<void> {
    if (elementClickSelector) {
      await this.page.locator(elementClickSelector).click({
        position: {
          x: 20,
          y: 20,
        },
      });
      return;
    }
    await this.genLoc(this.buttonCloseCreateNewPageSelector).click();
  }

  async fillAddNewPagePopup(title: string): Promise<void> {
    await this.genLoc(this.inputTitleSelector).first().fill(title);
  }

  async confirmAddNewPagePopup(): Promise<void> {
    await this.genLoc(this.buttonConfirmCreateNewPageSelector).click();
  }

  getXpathButtonCustomizeByTitle(pageName: string) {
    return `//a[contains(., "${pageName}")]/ancestor::tr//button >> nth=1`;
  }

  getDuplicateButtonOfPage(pageName: string) {
    return `//a[contains(., "${pageName}")]/ancestor::tr//button >> nth=2`;
  }

  getButtonDeleteOfPage(pageName: string) {
    return `//a[contains(., "${pageName}")]/ancestor::tr//button >> nth=3`;
  }

  getButtonOfPopup(index: number) {
    return `.sb-popup__container button >> nth=${index}`;
  }

  getPreviewButtonOfPage(pageName: string) {
    return `//a[contains(., "${pageName}")]/ancestor::tr//button[1]`;
  }

  getCustomizeButtonOfPage(pageName: string) {
    return `//a[contains(., "${pageName}")]/ancestor::tr//button >> nth=1`;
  }

  getTextboxOnPageDetail(field: string) {
    return `//label[contains(., "${field}")]/ancestor::div[contains(@class, 'sb-form-item')]//input[@class]`;
  }

  getTextAreaOnPageDetail() {
    return this.page.frameLocator(this.xpathTextAreaFrame).locator(`//body[@id="tinymce"]`);
  }

  getPageNameByOrdering(order: number) {
    return this.genLoc(`//div[contains(@class, 'sb-table__body-wrapper')]//tr[${order}]//a`);
  }

  xpathPageByName(name: string) {
    return `//tr[contains(@class, 'row-page-list')]//a[contains(text(), '${name}')]`;
  }

  getCheckboxPageByTitle(title: string) {
    return this.genLoc(`//tr[contains(normalize-space(), '${title}')]/td[1]`).first();
  }

  getPageURLByTitle(title: string) {
    return this.page.locator(`.cell`, { hasText: title }).locator(".page-url").first().innerText();
  }

  getActionOfPages(index: number) {
    return `[x-placement] .sb-dropdown-menu li >> nth=${index}`;
  }

  getTabOnPage(index: number) {
    return `.sb-tab-navigation .sb-tab-navigation__item >> nth=${index}`;
  }

  async isElementHasClass(el: Locator, className: string) {
    const classes = await el.getAttribute("class");
    return classes.split(" ").includes(className);
  }

  private async getPageAtRow(row: Locator): Promise<PageListItem> {
    await row.hover();
    const allBtns = await row.locator(".sb-button").count();

    let btnDuplicate: Locator, btnDelete: Locator, btnPreview: Locator;

    for (let j = 0; j < allBtns; j++) {
      const btn = row.locator(".sb-button").nth(j);
      const tooltipId = await btn.getAttribute("aria-describedby");
      if (!tooltipId) {
        continue;
      }

      const tooltipContent = (await this.page.locator(`#${tooltipId}`).nth(0).innerText()).trim();
      switch (tooltipContent) {
        case "Duplicate":
          btnDuplicate = btn;
          break;
        case "Delete":
          btnDelete = btn;
          break;
        case "Preview":
          btnPreview = btn;
          break;
      }
    }

    const btnCustomize = row.locator("//button[span[contains(text(), 'Customize')]]");
    return {
      title: await row.locator("a").innerText(),
      handle: await row.locator(".page-url").innerText(),
      selectable: !(await row.locator("//input[@type='checkbox']").getAttribute("disabled")),
      customizable: !(await this.isElementHasClass(btnCustomize, "is-disabled")),
      duplicatable: !(await this.isElementHasClass(btnDuplicate, "is-disabled")),
      removable: !(await this.isElementHasClass(btnDelete, "is-disabled")),
      previewable: !(await this.isElementHasClass(btnPreview, "is-disabled")),
      elements: {
        btnCustomize,
        btnDelete,
        btnDuplicate,
        btnPreview,
      },
      actions: {
        clickPreview: async () => {
          await row.hover();
          await btnPreview.click();
        },
      },
    };
  }

  async getAllPagesDisplayed(): Promise<PageListItem[]> {
    const xpathRow = ".sb-table__row.row-page-list";

    const result = [];
    await this.page.waitForSelector(xpathRow);

    const totalRow = await this.page.locator(xpathRow).count();
    for (let i = 0; i < totalRow; i++) {
      const row = this.page.locator(xpathRow).nth(i);
      result.push(await this.getPageAtRow(row));
    }
    return result;
  }

  async getPageDisplayedInList(handle: string): Promise<PageListItem> {
    const xpathRow = ".sb-table__row.row-page-list";
    return this.getPageAtRow(
      this.page.locator(xpathRow, {
        has: this.page.locator("span", { hasText: handle }),
      }),
    );
  }

  async isPageExistedInOldList(title: string): Promise<boolean> {
    const selector = ".sb-table__row.row-page-list";
    await this.page.locator(selector).first().waitFor({ state: "visible" });
    return (await this.page.locator(selector).locator("a", { hasText: title }).first().count()) > 0;
  }

  async isPopupCustomizeVisible(title: string): Promise<boolean> {
    return (await this.page.locator("div", { hasText: `Add custom text to ${title}` }).count()) > 0;
  }

  async clickBtnPopupCustomize(text: string): Promise<void> {
    await this.page.locator("button", { hasText: text }).click();
  }

  async getCustomizedTextSetting(): Promise<PageSettings> {
    const popup = this.page.locator(".sb-popup__wrapper.sb-popup--overlay").locator(".sb-popup__container");

    const input = popup.locator("textarea");
    const btnPosition = popup.locator("span", { hasText: "Show this text" }).locator("..").locator("button");

    return {
      customText: await input.inputValue(),
      position: (await btnPosition.innerText()).trim(),
      elements: {
        input,
        btnPosition,
      },
    };
  }

  async setCustomizeTextSetting(text: string, position?: "beginning" | "end"): Promise<void> {
    const popup = await this.getCustomizedTextSetting();

    await popup.elements.input.fill(text);

    if (!position) {
      return;
    }
    await popup.elements.btnPosition.click();
    await this.page.locator("li", { hasText: `at the ${position}` }).click();
  }

  /**
   * Action click `More action` button while select pages
   */
  async clickButtonMoreActions() {
    // Ignore mobile button -> 2nd button
    await this.clickOnBtnWithLabel("More actions", 2);
  }

  /**
   * Action change page status on page detail
   * @param value Label of option
   */
  async clickChangePageStatus(value: string) {
    this.page.locator(`//label[contains(@class, 'sb-radio')]`, { hasText: value }).first().click();
  }

  /**
   * Action choose option on more action's dropdown
   * @param label option text
   * @returns
   */
  optionButtonMoreActionByLabel(label: string) {
    return this.genLoc(
      `//div[contains(@id, 'sb-popover') and not(contains(@style, 'display: none'))]//li[contains(., '${label}')]`,
    ).first();
  }

  getXpathTabActiveInList(tabName: string): string {
    return `//div[normalize-space()='${tabName}']//ancestor::div[contains(@class,'sb-tab-navigation__item--active')]`;
  }

  getXpathByTabName(tabName: string): string {
    return `//div[normalize-space() = '${tabName}']//ancestor::div[contains(@class,'sb-tab-navigation__item')]`;
  }

  async getTextDescriptionInPageTab(tab?: string): Promise<string> {
    if (tab === "Policy") {
      return await this.page.innerText(this.textDesInListTabPolicy);
    } else {
      return await this.page.innerText(this.textDesInListTabWP);
    }
  }
  async getAllPagePolicyDisplay(): Promise<PageListItem[]> {
    const xpathRow = ".sb-table__row.row-page-list";
    const totalRow = await this.page.locator(xpathRow).count();
    const pages = [];

    for (let i = 1; i <= totalRow; i++) {
      let customizable = false;
      let selectable = false;
      const pageTitle = await this.page.innerText(`//div[contains(@class, 'sb-table__body-wrapper')]//tr[${i}]//a`);
      const handle = await this.page.innerText(
        `//div[contains(@class, 'sb-table__body-wrapper')]//tr[${i}]//span[@class='page-url']`,
      );
      const xpatBtnCustomizeVisible = await this.genLoc(
        `(//button[span[contains(text(), 'Customize')]])[${i}]`,
      ).isVisible();
      if (xpatBtnCustomizeVisible) {
        customizable = true;
      }
      const xpathCheckboxVisible = await this.genLoc(`(//tr)[${i}]//input[@type='checkbox']`).isVisible();
      if (xpathCheckboxVisible) {
        selectable = true;
      }

      const page = {
        title: pageTitle,
        handle: handle,
        customizable: customizable,
        selectable: selectable,
      };
      pages.push(page);
    }
    return pages;
  }

  getXpathPageByTitle(title: string): string {
    return `//a[normalize-space()='${title}']`;
  }

  getXpathFieldNameOrDescriptionInDetailPage(text: string) {
    return `(//div[normalize-space()='${text}'])[last()]`;
  }

  getXpathVariable(variable: string): string {
    return `(//div[contains(@class,'sb-block-item__content')]//span[normalize-space()='${variable}'])[last()]`;
  }

  getXpathFilterTab(filterName: string): string {
    return `(//div[contains(@class,'sb-tab-navigation')]//div[normalize-space()='${filterName}'])[last()]`;
  }

  /**
   * Edit thông tin policy page detail
   * @param pagePayload
   * @returns
   */
  async editPolcyPageByApi(pagePayload: PolicyPage): Promise<ResponsePolicyPage> {
    try {
      const options = {
        headers: {
          "X-ShopBase-Access-Token": this.accessToken,
          "Content-Type": "application/json; charset=utf-8",
        },
        failOnStatusCode: true,
        data: JSON.stringify(pagePayload),
      };

      const response = await this.page.request.put(`https://${this.domain}/admin/setting/legal.json`, options);
      expect(response.ok()).toBeTruthy();
      const page = await response.json();
      return page;
    } catch (e) {
      throw Error("Edit page fail");
    }
  }

  getXpathBtnTableHeader(btnName: string): string {
    return `//div[contains(@class,'sb-group-button-desktop')]//span[normalize-space()='${btnName}']`;
  }

  getxpathRowPageByTitle(title: string): string {
    return `//a[normalize-space()='${title}']//ancestor::tr[@class='sb-table__row row-page-list']`;
  }

  async getNumberPageSelected(): Promise<string> {
    return await this.page.innerText("//span[contains(@class,'sb-table-selected-count--desktop')]");
  }

  /**
   * Search and view detail page by name
   * @param pageName name of the page
   */
  async searchAndViewDetailPage(pageName: string) {
    await this.page.locator("//input[@placeholder='Search pages']").fill(pageName);
    await this.page.waitForLoadState("networkidle");
    await this.page.locator(`//a[normalize-space()='${pageName}']`).click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get page's content
   * @returns page content
   */
  async getPageContent(): Promise<string> {
    const pageContent = await this.page
      .frameLocator('//iframe[@class="tox-edit-area__iframe"]')
      .locator("//body//p")
      .textContent();
    return pageContent;
  }

  /**
   * Get number of pages in each page
   * @returns number of pages in each page
   */
  async countPages(): Promise<number> {
    const numberOfPage = await this.page.locator("//tbody//td[@class='page-description']").count();
    return numberOfPage;
  }

  /**
   * Return page's name by index
   * @param index index of page
   * @returns
   */
  async getPageName(index: number): Promise<string> {
    const pageName = (
      await this.page.locator(`(//tbody//td[@class='page-description']//a)[${index}]`).textContent()
    ).trim();
    return pageName;
  }

  /**
   * Get list policy page
   * @returns list policy page
   */
  async getAllPolicyPages(): Promise<PageListItem[]> {
    const xpathRow = ".sb-table__row.row-page-list";
    await this.page.waitForSelector(xpathRow);
    const policyPages = [];
    const totalRow = await this.page.locator(xpathRow).count();

    //get policy page tại mỗi dòng
    for (let i = 0; i < totalRow; i++) {
      const row = this.page.locator(xpathRow).nth(i);
      let policyPage = {};
      await row.hover();
      const allBtns = await row.locator(".sb-button").count();

      let btnPreview: Locator;

      for (let j = 0; j < allBtns; j++) {
        const btn = row.locator(".sb-button").nth(j);
        const tooltipId = await btn.getAttribute("aria-describedby");
        if (!tooltipId) {
          continue;
        }

        const tooltipContent = (await this.page.locator(`#${tooltipId}`).nth(0).innerText()).trim();
        switch (tooltipContent) {
          case "Preview":
            btnPreview = btn;
            break;
        }
      }

      const btnCustomize = row.locator("//button[span[contains(text(), 'Customize')]]");
      policyPage = {
        title: await row.locator("a").innerText(),
        handle: await row.locator(".page-url").innerText(),
        customizable: !(await this.isElementHasClass(btnCustomize, "is-disabled")),
        previewable: !(await this.isElementHasClass(btnPreview, "is-disabled")),
        elements: {
          btnCustomize,
          btnPreview,
        },
        actions: {
          clickPreview: async () => {
            await row.hover();
            await btnPreview.click();
          },
        },
      };
      policyPages.push(policyPage);
    }
    return policyPages;
  }

  /**
   * Hàm lọc và sắp xếp các phàn tử mảng B có handle trùng với handle trong phàn tử mảng A
   * @param A
   * @param B
   * @returns
   */
  async filterArray(A: PageListItem[], B: PageListItem[]): Promise<PageListItem[]> {
    // Lưu trữ danh sách các handle trong mảng A
    const handleSet = new Set(A.map(item => item.handle));

    // Lọc các phần tử của mảng B có giá trị handle nằm trong handleSet
    const filteredB = B.filter(item => handleSet.has(item.handle));

    // Sắp xếp lại các phần tử của mảng B theo thứ tự của các phần tử tương ứng trong mảng A
    const result = A.map(itemA => filteredB.find(itemB => itemB.handle === itemA.handle));

    return result;
  }

  /**
   * get page data on SF
   * @param pageHandle
   * @param locale exp: "vi-vn"; "vi-us"....
   * @returns
   */
  async getPageDataOnSF(pageHandle: string, locale: string) {
    let options = {};
    let pageData;
    options = {
      headers: {
        "X-Lang": locale,
      },
    };
    const res = await this.page.request.get(`https://${this.domain}/api/pages/next/${pageHandle}.json`, options);
    if (res.ok()) {
      pageData = await res.json();
      return pageData;
    }
    return Promise.reject("Get page data failed");
  }

  /**
   * get page policy data on SF
   * @param pageHandle
   * @param languageCode exp: "vi"; "de"....
   * @param locale exp: "vi-vn"; "de-vn"....
   * @returns
   */
  async getPagePolicyDataOnSF(pageHandle: string, languageCode: string, locale: string) {
    let options = {};
    options = {
      headers: {
        "X-Lang": locale,
      },
    };
    const res = await this.page.request.get(
      `https://${this.domain}/api/pages/next/policy/${pageHandle}.json?lang=${languageCode}`,
      options,
    );
    if (res.ok()) {
      return await res.json();
    }
    return Promise.reject("Get page data failed");
  }

  /**
   * Edit thông tin policy page detail
   * @param pageInfo
   */
  async editPolicyPage(pageInfo: PolicyPageDetail) {
    await this.goto(`admin/pages/${pageInfo.handle}`);
    if (pageInfo.content) {
      await this.page.waitForSelector(
        "//div[contains(@class,'tox-editor-container')]//div[@class='tox-editor-header']",
      );
      await this.page.waitForSelector(this.xpathTextAreaFrame);
      await this.getTextAreaOnPageDetail().click();
      await pressControl(this.page, "A");
      await this.page.keyboard.press("Backspace");
      await this.getTextAreaOnPageDetail().fill(pageInfo.content);
    }
    if (pageInfo.seo) {
      if (pageInfo.seo.page_title) {
        await this.genLoc(this.getTextboxOnPageDetail("Page title")).click();
        await pressControl(this.page, "A");
        await this.page.keyboard.press("Backspace");
        await this.genLoc(this.getTextboxOnPageDetail("Page title")).fill(pageInfo.seo.page_title);
      }
      if (pageInfo.seo.meta_description) {
        await this.genLoc(this.descriptionPageTextArea).click();
        await pressControl(this.page, "A");
        await this.page.keyboard.press("Backspace");
        await this.genLoc(this.descriptionPageTextArea).fill(pageInfo.seo.meta_description);
      }
    }
    if (pageInfo.visible_page) {
      await this.clickChangePageStatus("Visible");
    }
    await this.genLoc(this.buttonSavePageDetail).click();
    await this.waitForElementVisibleThenInvisible(this.xpathTextOfToast);
  }
}
