import { test, expect } from "@fixtures/website_builder";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { verifyRedirectUrl } from "@utils/theme";
import { BrowserContext } from "@playwright/test";

test.describe("Page management", () => {
  let otherPage: OtherPage;
  let dashboardPage: DashboardPage;

  let accessToken: string;
  let context: BrowserContext;
  const addTags = async tag => {
    await otherPage.genLoc(otherPage.getTextboxOnPageDetail("Tags")).click();
    await otherPage.genLoc(otherPage.getTextboxOnPageDetail("Tags")).fill(tag);
    await otherPage.genLoc(otherPage.dropListAddTag).click();
    await otherPage.waitAbit(500);
    await otherPage.genLoc(otherPage.tagLabel).click();
  };

  test.beforeAll(async ({ token, conf, browser }) => {
    context = await browser.newContext();
    const page = await context.newPage();
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken;
    dashboardPage = new DashboardPage(page, conf.suiteConf.domain);
    otherPage = new OtherPage(page, conf.suiteConf.domain);
    otherPage.setAccessToken(accessToken);
    await dashboardPage.loginWithToken(accessToken);

    await otherPage.deleteAllPages();
  });

  test.afterEach(async () => {
    await otherPage.deleteAllPages();
  });

  // 🚧 Feature chưa được làm, khi nào làm thì fill code vào đây
  // test("Check data default của Page management khi tạo shop @SB_NE_PAGE_MANAGEMENT_1", async () => {
  // });

  test("Check add new page @SB_NEWECOM_PM_2", async ({ conf }) => {
    const caseConf = conf.caseConf;
    await test.step("Click button add new page", async () => {
      await otherPage.goToUrlPath();
      await otherPage.openAddNewPagePopup();
      await expect(otherPage.genLoc(otherPage.popupSelectTemplateSelector)).toBeVisible();
    });

    await test.step("Apply 1 page template", async () => {
      await verifyRedirectUrl({
        page: otherPage.page,
        selector: otherPage.buttonApplyTemplateSelector,
        redirectUrl: `https://${conf.suiteConf.domain}/admin/pages`,
      });
    });

    await test.step("Bỏ trống Page title Click icon back bên cạnh Add page", async () => {
      await verifyRedirectUrl({
        page: otherPage.page,
        selector: otherPage.buttonBackToListPages,
        redirectUrl: `https://${conf.suiteConf.domain}/admin/pages`,
      });
    });

    await test.step("Click button Add new page > Apply 1 page template > Điền page title trung với Page đã có > Click Save", async () => {
      await otherPage.createPage({ title: caseConf.pre_conditions.page_title });
      await otherPage.openAddNewPagePopup();
      await verifyRedirectUrl({
        page: otherPage.page,
        selector: otherPage.buttonApplyTemplateSelector,
        redirectUrl: `https://${conf.suiteConf.domain}/admin/pages/new`,
      });

      await otherPage.fillAddNewPagePopup(caseConf.pre_conditions.page_title);
      await verifyRedirectUrl({
        page: otherPage.page,
        selector: otherPage.btnSavePage,
        redirectUrl: `https://${conf.suiteConf.domain}/admin/builder/page/`,
        waitForElement: otherPage.buttonExitWebBuilderSelector,
      });
    });

    await test.step("Click 'Exit' > Vào màn page list > Click button Add new page > Apply 1 page template > Điền page title có chữ, số và kí tự đặc biệt <= 255", async () => {
      await otherPage.genLoc(otherPage.buttonExitWebBuilderSelector).first().click();
      await otherPage.genLoc(otherPage.buttonBackToListPages).first().click();
      await otherPage.openAddNewPagePopup();
      await verifyRedirectUrl({
        page: otherPage.page,
        selector: otherPage.buttonApplyTemplateSelector,
        redirectUrl: `https://${conf.suiteConf.domain}/admin/pages/new`,
      });
      await otherPage.fillAddNewPagePopup(caseConf.data.add_page_title_less_equal_than_255);
      await verifyRedirectUrl({
        page: otherPage.page,
        selector: otherPage.btnSavePage,
        redirectUrl: `https://${conf.suiteConf.domain}/admin/builder/page/`,
        waitForElement: otherPage.buttonExitWebBuilderSelector,
      });
    });

    await test.step("Click 'Exit' > Vào màn page list > Click button Add new page > Apply 1 page template > Điền page title có chữ, số và kí tự đặc biệt > 255", async () => {
      await otherPage.genLoc(otherPage.buttonExitWebBuilderSelector).first().click();
      await otherPage.genLoc(otherPage.buttonBackToListPages).first().click();
      await otherPage.openAddNewPagePopup();
      await verifyRedirectUrl({
        page: otherPage.page,
        selector: otherPage.buttonApplyTemplateSelector,
        redirectUrl: `https://${conf.suiteConf.domain}/admin/pages/new`,
      });
      await otherPage.fillAddNewPagePopup(caseConf.data.add_page_title_larger_than_255);
      await otherPage.clickOnBtnWithLabel("Save");
      const textValidateLocator = otherPage.genLoc(otherPage.textValidateCreateNewPageSelector).first();
      await expect(textValidateLocator).toHaveText(caseConf.expects.text_length_validate);
    });
  });

  test("Check customize page @SB_NEWECOM_PM_3", async ({ conf }) => {
    const caseConf = conf.caseConf;

    const pageTitleApplyTemplate = caseConf.pre_conditions.page_apply_template_title;
    const pageTitleNotApplyTemplate = caseConf.pre_conditions.page_not_apply_template_title;

    await otherPage.createPage({ title: pageTitleApplyTemplate });
    await otherPage.createPage({ title: pageTitleNotApplyTemplate });

    await test.step("Click customize & choose template for page", async () => {
      await otherPage.goToUrlPath();
      await otherPage.genLoc(otherPage.getXpathButtonCustomizeByTitle(pageTitleApplyTemplate)).click();

      const popSelectTemplate = otherPage.genLoc(otherPage.popupSelectTemplateSelector);
      await expect(popSelectTemplate).toBeVisible();

      await otherPage.genLoc(otherPage.imageTemplateSelector).first().hover();
      await otherPage.genLoc(otherPage.buttonApplyTemplateSelector).first().click();

      const toastLocator = otherPage.genLoc(otherPage.toastWebBuilderXPath);
      await expect(toastLocator).toHaveText(caseConf.expects.text_apply_template_success);
    });

    await test.step("Click WebBuilder exit button", async () => {
      await otherPage.page.waitForLoadState("networkidle");
      await otherPage.waitForToastWebBuilderHidden();

      await verifyRedirectUrl({
        page: otherPage.page,
        selector: otherPage.buttonExitWebBuilderSelector,
        waitForElement: "id=page-header",
        redirectUrl: `https://${conf.suiteConf.domain}/admin/pages`,
        popupConfirm: false,
      });
      return;
    });

    await test.step("Click customize & check chosen template", async () => {
      await otherPage.goToUrlPath();
      await otherPage.genLoc(otherPage.getXpathButtonCustomizeByTitle(pageTitleApplyTemplate)).click();
      await expect(otherPage.genLoc(otherPage.popupSelectTemplateSelector)).toBeHidden();
    });

    await test.step("Click customize page 2", async () => {
      await otherPage.goToUrlPath();
      await otherPage.genLoc(otherPage.getXpathButtonCustomizeByTitle(pageTitleNotApplyTemplate)).click();
      await expect(otherPage.genLoc(otherPage.popupSelectTemplateSelector)).toBeVisible();
    });
  });

  test("Check duplicate page @SB_NEWECOM_PM_4", async ({ conf, builder }) => {
    const caseConf = conf.caseConf;

    await test.step("Precondition: create page & assign template for page", async () => {
      // create page 1
      const response = await otherPage.createPage(caseConf.data.add_page);

      // assign template for page
      await builder.applyTemplate({
        productId: response.id,
        templateId: conf.suiteConf.template_id,
        type: "page",
      });
    });

    await test.step(`Tại Page management, click icon "Duplicate" của Page 1`, async () => {
      await otherPage.goToUrlPath();
      await otherPage.genLoc(otherPage.getDuplicateButtonOfPage(caseConf.data.add_page.title)).click();
      await otherPage.page.waitForLoadState("networkidle");
      const text = await otherPage.getPageNameByOrdering(1).innerText();
      const textExp = `${caseConf.data.add_page.title} (copy)`;
      expect(text).toEqual(textExp);
    });

    await test.step("Click mở Detail của Page 1 (copy)", async () => {
      await otherPage.getPageNameByOrdering(1).click();

      await verifyRedirectUrl({
        page: otherPage.page,
        selector: otherPage.customizeButtonOnPageDetail,
        redirectUrl: `https://${conf.suiteConf.domain}/admin/builder/page/`,
        waitForElement: otherPage.buttonExitWebBuilderSelector,
      });

      await test.step("Click mở Detail của Page 1 (copy)", async () => {
        await otherPage.genLoc(otherPage.buttonExitWebBuilderSelector).first().click();
        await otherPage.genLoc(otherPage.buttonBackToListPages).first().click();
        await otherPage
          .genLoc(otherPage.getCustomizeButtonOfPage(`${caseConf.data.add_page.title} (copy)`))
          .first()
          .hover();
        const [newTab] = await Promise.all([
          otherPage.page.waitForEvent("popup"),
          await otherPage
            .genLoc(otherPage.getPreviewButtonOfPage(`${caseConf.data.add_page.title} (copy)`))
            .first()
            .click(),
        ]);
        await newTab.waitForLoadState("networkidle");
        await expect(newTab.locator(`//input[@placeholder='Your name']`).first()).toBeVisible();
      });
    });
  });

  test("Check delete page @SB_NEWECOM_PM_5", async ({ conf }) => {
    const dashboard = otherPage.page;
    const caseConf = conf.caseConf;
    for (const pageTitle of caseConf.pre_conditions.add_page_titles) {
      await otherPage.createPage({
        title: pageTitle,
      });
    }
    await otherPage.goToUrlPath();

    await test.step(`CLick icon "Delete" của Page 2`, async () => {
      await dashboard.locator(otherPage.getButtonDeleteOfPage(caseConf.pre_conditions.add_page_titles[1])).click();

      const popupTitle = await otherPage.genLoc(otherPage.popupHeader).innerText();
      const popupMessage = await otherPage.genLoc(otherPage.popupMessage).innerText();

      expect(popupTitle).toEqual(caseConf.expects.popup_title);
      expect(popupMessage).toEqual(caseConf.expects.popup_message);
    });

    await test.step("Click button Cancel/ icon X", async () => {
      await dashboard.locator(otherPage.getButtonOfPopup(1)).click();
    });

    await test.step(`CLick icon "Delete" của Page 2`, async () => {
      await dashboard.locator(otherPage.getButtonDeleteOfPage(caseConf.pre_conditions.add_page_titles[1])).click();

      const popupTitle = await otherPage.genLoc(otherPage.popupHeader).innerText();
      const popupMessage = await otherPage.genLoc(otherPage.popupMessage).innerText();

      expect(popupTitle).toEqual(caseConf.expects.popup_title);
      expect(popupMessage).toEqual(caseConf.expects.popup_message);
    });

    await test.step(`Click button "Delete"`, async () => {
      await dashboard.locator(otherPage.getButtonOfPopup(2)).click();
      const toastDefaultSelector = otherPage.genLoc(otherPage.toastDefaultXPath);
      await expect(toastDefaultSelector).toHaveText(caseConf.expects.toast_message_deleted_1_page);
    });

    await test.step(`Tick chọn vào check box bên cạnh Title > Click chọn actions "Delete"`, async () => {
      await otherPage.getCheckboxPageByTitle(caseConf.pre_conditions.add_page_titles[0]).click();
      await otherPage.getCheckboxPageByTitle(caseConf.pre_conditions.add_page_titles[2]).click();
      await otherPage.clickButtonMoreActions();

      // Ignore mobile button -> 2nd button
      await otherPage.clickElementWithLabel("li", "Delete pages", 2);

      const popupTitle = await otherPage.genLoc(otherPage.popupHeader).innerText();
      const popupMessage = await otherPage.genLoc(otherPage.popupMessage).innerText();

      expect(popupTitle).toEqual(caseConf.expects.popup_title_multiple);
      expect(popupMessage).toEqual(caseConf.expects.popup_message_multiple);
      // Click delete
      await dashboard.locator(otherPage.getButtonOfPopup(2)).click();
      const toastDefaultSelector = otherPage.genLoc(otherPage.toastDefaultXPath).first();
      await expect(toastDefaultSelector).toHaveText(caseConf.expects.toast_message_deleted_2_page);
    });
  });

  test("Check preview page @SB_NEWECOM_PM_6", async ({ conf, builder }) => {
    const caseConf = conf.caseConf;
    const dashboard = otherPage.page;

    const pageIds = [];
    for (const pageTitle of caseConf.pre_conditions.add_page_titles) {
      const pageData = (await otherPage.createPage({ title: pageTitle })).id;
      pageIds.push(pageData);
    }

    await test.step("Click preview", async () => {
      await otherPage.goToUrlPath();
      await dashboard.locator(otherPage.getCustomizeButtonOfPage(caseConf.pre_conditions.add_page_titles[0])).hover();
      const pageUrl = await otherPage.getPageURLByTitle(caseConf.pre_conditions.add_page_titles[0]);
      await verifyRedirectUrl({
        page: dashboard,
        selector: otherPage.getPreviewButtonOfPage(caseConf.pre_conditions.add_page_titles[0]),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}${pageUrl}`,
      });
    });

    //assign template for page 2
    await builder.applyTemplate({
      productId: pageIds[1], // id of page, not product
      templateId: conf.suiteConf.template_id,
      type: "page",
    });

    await test.step("Preview page 2 - template applied", async () => {
      await otherPage.goToUrlPath();
      await dashboard.locator(otherPage.getCustomizeButtonOfPage(caseConf.pre_conditions.add_page_titles[1])).hover();
      const pageUrl = await otherPage.getPageURLByTitle(caseConf.pre_conditions.add_page_titles[1]);
      //preview page apply true template, preview has header
      await verifyRedirectUrl({
        page: dashboard,
        selector: otherPage.getPreviewButtonOfPage(caseConf.pre_conditions.add_page_titles[1]),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}${pageUrl}`,
        waitForElement: ".wb-builder",
      });
    });
  });

  test("Check edit page successfully @SB_NEWECOM_PM_7", async ({ conf }) => {
    const caseConf = conf.caseConf;
    const dashboard = otherPage.page;

    for (const pageTitle of caseConf.pre_conditions.add_page_titles) {
      await otherPage.createPage({ title: pageTitle });
    }

    await test.step(`Click mở Detail của Page 1`, async () => {
      await otherPage.goToUrlPath();
      await otherPage.getPageNameByOrdering(1).click();
    });
    await test.step(`- Xóa title của Page- Click Save`, async () => {
      await dashboard.locator(otherPage.getTextboxOnPageDetail("Title")).fill("");
      await dashboard.locator(otherPage.buttonSavePageDetail).click();
      await expect(dashboard.locator(otherPage.tooltipPageTitle).first()).toHaveText(caseConf.expects.empty_page_title);
    });
    await test.step(`- Nhập title page chứa chữ, số và kí tự đặc biệt- Click Save`, async () => {
      await dashboard.locator(otherPage.getTextboxOnPageDetail("Title")).fill(caseConf.data.edit_title);

      await dashboard.locator(otherPage.buttonSavePageDetail).click();
      const toastText = await otherPage.getTextOfToast("success");
      expect(toastText).toEqual(caseConf.expects.toast_success);
    });
    await test.step(`- Nhập tag vào textbox tag- Click ,- Click Save`, async () => {
      //validate tags
      for (const tag of caseConf.data.tags) {
        await addTags(tag);
      }

      await dashboard.locator(otherPage.buttonSavePageDetail).click();
      const toastText = await otherPage.getTextOfToast("success");
      expect(toastText).toEqual(caseConf.expects.toast_success);
      await dashboard.waitForSelector(otherPage.buttonSavePageDetail, { state: "detached" });
    });
    await test.step(`- Click bỏ bớt tag- Click Save`, async () => {
      await dashboard.locator(otherPage.iconOfFieldTags).last().click();
      await dashboard.locator(otherPage.buttonSavePageDetail).click();
      const toastText = await otherPage.getTextOfToast("success");
      expect(toastText).toEqual(caseConf.expects.toast_success);
      await dashboard.waitForSelector(otherPage.buttonSavePageDetail, { state: "detached" });
    });
    await test.step(`- Edit URL - Click Save`, async () => {
      await dashboard.locator(otherPage.getTextboxOnPageDetail("URL")).fill(caseConf.data.url);

      await dashboard.locator(otherPage.buttonSavePageDetail).click();
      const toastText = await otherPage.getTextOfToast("success");
      expect(toastText).toEqual(caseConf.expects.toast_success);
    });
    await test.step(`Back lại màn Page management`, async () => {
      await otherPage.goToUrlPath();
    });
    await test.step(`Open Page#456 ngoài SF`, async () => {
      //verify page on page list
      await otherPage.goToUrlPath();
      await expect(otherPage.getPageNameByOrdering(1)).toHaveText(caseConf.data.edit_title);
      expect(await otherPage.getPageURLByTitle(caseConf.data.edit_title)).toEqual(`/pages/${caseConf.data.url}`);

      await dashboard.locator(otherPage.getCustomizeButtonOfPage(caseConf.data.edit_title)).hover();
      //verify preview page
      const newPage = await verifyRedirectUrl({
        page: dashboard,
        selector: otherPage.getPreviewButtonOfPage(caseConf.data.edit_title),
        context,
        redirectUrl: `https://${conf.suiteConf.domain}/pages/${caseConf.data.url}`,
      });

      newPage.close();
    });
    await test.step(`- Mở detail Page 3- Edit URL của Page 3 trùng với URL của page khác`, async () => {
      await otherPage.goToUrlPath();
      await otherPage.getPageNameByOrdering(2).click();

      // edit URL match with old URL
      await dashboard.locator(otherPage.getTextboxOnPageDetail("URL")).fill(caseConf.data.url);

      await dashboard.locator(otherPage.buttonSavePageDetail).click();
      const toastText = await otherPage.getTextOfToast("success");
      expect(toastText).toEqual(caseConf.expects.toast_success);

      //verify page on page list
      await otherPage.goToUrlPath();
      const pageItemLocator = otherPage.getPageNameByOrdering(2);
      await expect(pageItemLocator).toHaveText(caseConf.pre_conditions.add_page_titles[1]);

      const pageItemUrlLocator = await otherPage.getPageURLByTitle(caseConf.pre_conditions.add_page_titles[1]);
      expect(pageItemUrlLocator).toEqual(`/pages/${caseConf.data.url}-1`);

      await dashboard.locator(otherPage.getCustomizeButtonOfPage(caseConf.pre_conditions.add_page_titles[1])).hover();
      //verify preview page
      const newPage = await verifyRedirectUrl({
        page: dashboard,
        selector: otherPage.getPreviewButtonOfPage(caseConf.pre_conditions.add_page_titles[1]),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/pages/${caseConf.data.url}-1`,
      });
      newPage.close();
    });
    await test.step(`- Chọn Page status = Visible- Click Save-  Mở page ngoài SF`, async () => {
      await otherPage.goToUrlPath();
      await otherPage.getPageNameByOrdering(2).click();
      await otherPage.clickChangePageStatus("Visible");
      await dashboard.locator(otherPage.buttonSavePageDetail).click();
      const toastText = await otherPage.getTextOfToast("success");
      expect(toastText).toEqual(caseConf.expects.toast_success);

      await otherPage.goToUrlPath();
      await dashboard.locator(otherPage.getCustomizeButtonOfPage(caseConf.pre_conditions.add_page_titles[1])).hover();
      const newPage = await verifyRedirectUrl({
        page: dashboard,
        selector: otherPage.getPreviewButtonOfPage(caseConf.pre_conditions.add_page_titles[1]),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/pages/${caseConf.data.url}-1`,
      });
      newPage.close();
    });
    await test.step(`- Edit Seo&Social Sharing của Page- Click Save- Mở page ntgoài SF`, async () => {
      await otherPage.goToUrlPath();
      await otherPage.getPageNameByOrdering(2).click();
      await dashboard.locator(otherPage.getTextboxOnPageDetail("Page title")).fill(caseConf.data.seo_title);
      await dashboard.locator(otherPage.descriptionPageTextArea).fill(caseConf.data.seo_description);
      await dashboard.locator(otherPage.buttonSavePageDetail).click();
      const toastText = await otherPage.getTextOfToast("success");
      expect(toastText).toEqual(caseConf.expects.toast_success);

      await otherPage.goToUrlPath();
      await dashboard.locator(otherPage.getCustomizeButtonOfPage(caseConf.pre_conditions.add_page_titles[1])).hover();
      await verifyRedirectUrl({
        page: dashboard,
        selector: otherPage.getPreviewButtonOfPage(caseConf.pre_conditions.add_page_titles[1]),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}/pages/${caseConf.data.url}-1`,
      });
    });
  });

  test("Check edit page not successfully @SB_NEWECOM_PM_8", async ({ conf }) => {
    const caseConf = conf.caseConf;
    const dashboard = otherPage.page;

    await otherPage.createPage({
      title: caseConf.pre_conditions.page_title,
    });

    await test.step(`Click mở Detail của Page 1`, async () => {
      await otherPage.goToUrlPath();
      await otherPage.getPageNameByOrdering(1).click();
      await dashboard.waitForLoadState("networkidle");
    });
    await test.step(`- Edit page name - Click Cancel`, async () => {
      await dashboard.locator(otherPage.getTextboxOnPageDetail("Title")).fill(`${caseConf.data.page_title_edit}`);
      await dashboard.locator(otherPage.buttonCancelPageDetail).click();
      const inputTitle = await dashboard.inputValue(otherPage.getTextboxOnPageDetail("Title"));
      expect(inputTitle).toEqual(caseConf.pre_conditions.page_title);
    });
    await test.step(`- Edit page name - Reload lại page`, async () => {
      await otherPage.goToUrlPath();
      await otherPage.getPageNameByOrdering(1).click();

      await dashboard.locator(otherPage.getTextboxOnPageDetail("Title")).fill(`${caseConf.data.page_title_edit_2}`);
      //reload page
      await dashboard.reload();
      await dashboard.waitForSelector(otherPage.pageFormSelector);
      const inputTitle = await dashboard.inputValue(otherPage.getTextboxOnPageDetail("Title"));
      expect(inputTitle).toEqual(caseConf.pre_conditions.page_title);
    });
  });

  test("Check cac Action voi selected page @SB_NEWECOM_PM_9", async ({ conf }) => {
    const caseConf = conf.caseConf;
    const dashboard = otherPage.page;

    await test.step("Precondition: Create page", async () => {
      const pageNumbers = Array(caseConf.pre_conditions.number_of_pages)
        .fill(0)
        .map((_, i) => i + 1);

      for (const pageNumber of pageNumbers) {
        await otherPage.createPage({
          title: `Page ${pageNumber}`,
        });
      }
      await otherPage.goToUrlPath();
    });

    await otherPage.goToUrlPath();

    const buttonMoreActionsDesktop = dashboard.locator(`${otherPage.tableHeader} button >> nth=1`);
    const buttonSelectOnAllPagesDesktop = dashboard.locator(`${otherPage.tableHeader} button >> nth=2`);
    await test.step(`Tick chọn vào check box bên cạnh Title`, async () => {
      await dashboard.locator(otherPage.checkboxAllPages).click();
      await dashboard.waitForLoadState();
      //verify number of page
      const textItemsSelectedDesktop = await dashboard
        .locator(`${otherPage.tableHeader} .sb-table-selected-count--desktop`)
        .innerText();
      expect(textItemsSelectedDesktop).toEqual(`${caseConf.pre_conditions.number_per_page} items selected`);

      await expect(buttonMoreActionsDesktop).toHaveText(caseConf.expects.button_more_actions);

      //verify Selecton all page action
      await expect(buttonSelectOnAllPagesDesktop).toHaveText(caseConf.expects.link_select_all_pages);
    });
    await test.step(`Click "Select on all page"`, async () => {
      await buttonSelectOnAllPagesDesktop.click();
      await expect(buttonSelectOnAllPagesDesktop).toHaveText(caseConf.expects.link_clear_all);
      await buttonSelectOnAllPagesDesktop.click();
      await dashboard.locator(otherPage.checkboxAllPages).click();
    });
    await test.step(`Click dropdown list "More actions" `, async () => {
      await otherPage.clickButtonMoreActions();
      for await (const button of caseConf.expects.buttons) {
        await expect(otherPage.optionButtonMoreActionByLabel(button)).toBeVisible();
      }
    });
    await test.step(`Chọn action "Publish Selected Pages"`, async () => {
      await otherPage.optionButtonMoreActionByLabel(caseConf.expects.buttons[0]).click();
      const toastText = await otherPage.getTextOfToast("success");
      expect(toastText).toEqual(`Show ${conf.caseConf.pre_conditions.number_per_page} pages`);
      await otherPage.waitForToastDefaultHidden();
    });
    await test.step(`Click tab "Visible"`, async () => {
      await dashboardPage.clickElementWithLabel("div", "Visible");
      const { pages } = await otherPage.getTotalPages(1);
      expect(pages.length).toEqual(conf.caseConf.pre_conditions.number_per_page);
    });
    await test.step(`Click preview page đầu tiên trong list page được visible`, async () => {
      const firstPageVisible = await otherPage.getPageNameByOrdering(1).innerText();
      await dashboard.locator(otherPage.getCustomizeButtonOfPage(firstPageVisible)).hover();
      const newPage = await verifyRedirectUrl({
        page: dashboard,
        selector: otherPage.getPreviewButtonOfPage(firstPageVisible),
        context: context,
        redirectUrl: `https://${conf.suiteConf.domain}${await otherPage.getPageURLByTitle(firstPageVisible)}`,
        waitForElement: `text=${firstPageVisible}`,
      });
      newPage.close();
    });
    await test.step(`Dashboard > Page > click tab "All"`, async () => {
      await dashboardPage.clickElementWithLabel("div", "All");
      const { pages } = await otherPage.getTotalPages(0);
      expect(pages.length).toEqual(conf.caseConf.pre_conditions.number_per_page);
    });
    await test.step(`- Tick chọn vào check box bên cạnh Title- Click "Select on all page"- Chọn action "Unpublish Selected Pages"`, async () => {
      await dashboard.locator(otherPage.checkboxAllPages).click();
      await dashboard.waitForLoadState();
      await otherPage.clickButtonMoreActions();
      await otherPage.optionButtonMoreActionByLabel(caseConf.expects.buttons[1]).click();
      const toastText = await otherPage.getTextOfToast("success");
      expect(toastText).toEqual(`Hide ${conf.caseConf.pre_conditions.number_per_page} pages`);
      await otherPage.waitForToastDefaultHidden();
    });
    await test.step(`Click tab "Hidden"`, async () => {
      await dashboardPage.clickElementWithLabel("div", "Hidden");
      const { pages } = await otherPage.getTotalPages(-1);
      expect(pages.length).toEqual(conf.caseConf.pre_conditions.number_per_page);
    });
    await test.step(`Click preview page đầu tiên trong list page bị hidden`, async () => {
      const firstPageVisible = await otherPage.getPageNameByOrdering(1).innerText();
      await dashboard.locator(otherPage.getCustomizeButtonOfPage(firstPageVisible)).hover();
      const newPage = await context.newPage();
      await newPage.goto(`https://${conf.suiteConf.domain}${await otherPage.getPageURLByTitle(firstPageVisible)}`);
      await newPage.waitForSelector("//span[contains(text(),'Page not found')]");
      newPage.close();
    });
    await test.step(`Dashboard > Page > click tab "All"`, async () => {
      await dashboardPage.clickElementWithLabel("div", "All");
      const { pages } = await otherPage.getTotalPages();
      expect(pages.length).toEqual(conf.caseConf.pre_conditions.number_per_page);
    });
    await test.step(`- Tick chọn vào check box bên cạnh Title- Click "Select on all page"- Chọn action "Delete Pages"`, async () => {
      await dashboard.locator(otherPage.checkboxAllPages).click();
      await dashboard.waitForLoadState();
      await otherPage.clickButtonMoreActions();
      await otherPage.optionButtonMoreActionByLabel(caseConf.expects.buttons[2]).click();
    });
    await test.step(`Click confirm delete`, async () => {
      await dashboard.locator(otherPage.getButtonOfPopup(2)).click();
      const toastText = await otherPage.getTextOfToast("success");
      expect(toastText).toEqual(`Deleted ${conf.caseConf.pre_conditions.number_per_page} pages`);
      await otherPage.waitForToastDefaultHidden();
    });
    await test.step(`Check All page`, async () => {
      const { pages } = await otherPage.getTotalPages();
      expect(pages.filter(p => !p.is_from_shop_template).length).toEqual(
        conf.caseConf.pre_conditions.number_of_pages - conf.caseConf.pre_conditions.number_per_page,
      );
    });
  });

  test(`@SB_NEWECOM_PM_11 Check search page ở page management`, async ({ conf }) => {
    const caseConf = conf.caseConf;
    const dashboard = otherPage.page;

    await test.step("Precondition: create page & assign template for page", async () => {
      for (const pageData of caseConf.add_page) {
        await otherPage.createPage({
          title: pageData.title,
          tags: pageData.tags,
        });
      }
    });

    await test.step("Search in page list", async () => {
      await otherPage.goToUrlPath();

      for (const searchKey of caseConf.search_text) {
        // Ignore case `Nhập keyword match page tag tại Search box trong Page management`
        /// TODO remove this logic after production release
        if (searchKey.search === "yoga") {
          continue;
        }

        await test.step(searchKey.name, async () => {
          await dashboard.locator(otherPage.searchInPageList).fill(searchKey.search);
          // Wait for debounce search
          await dashboard.waitForTimeout(500);

          if (searchKey.result) {
            await otherPage.page.waitForSelector(".sb-table");
            const pageNameLocator = otherPage.getPageNameByOrdering(1);
            const keyName = await pageNameLocator.innerText();
            expect(keyName).toEqual(searchKey.result);
          }
          if (searchKey.no_result) {
            await expect(dashboard.locator(otherPage.emptyPageSelector)).toBeVisible();
          }
        });
      }
    });
  });
});
