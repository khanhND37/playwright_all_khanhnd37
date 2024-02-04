import { expect, test } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir } from "@utils/theme";
import { FrameLocator, Page } from "@playwright/test";
import { Sections } from "@pages/shopbase_creator/dashboard/sections";
import {
  selectCollectionPreview,
  clickSaveButton,
  clickPreviewSF,
  selectSizeCard,
  getStyle,
  verifyDropdownFilter,
  getXpathFilter,
  verifyTagFilter,
  verifyTabFilterInDrawer,
  checkFilterContainerVisible,
  selectProductInList,
  addFilterColor,
  addVendorToProduct,
  addProductToCollection,
  turnONOFToggleByLabel,
  xpathLabelPreview,
  xpathButtonFilterInDrawer,
  xpathTextProductNumber,
  xpathFiltersContainer,
  xpathButtonClearFilter,
  xpathButtonApplyFilter,
  xpathClearAll,
  xpathTagContainer,
  xpathCloseFilter,
  xpathShowFilterButton,
  xpathFiltersContainerTop,
  xpathSelectSorting,
  xpathSortSelected,
  xpathFirstProductInList,
  xpathShowSortingButton,
  xpathFilterInDashboard,
  xpathInputVendor,
  xpathHideProduct,
  xpathShowProduct,
  xpathTextClearAll,
  xpathPagination,
  xpathBlockProductListOnWB,
} from "./collection-util";
import { WbCollectionDetail } from "@pages/dashboard/wb_collection_detail";
import { PageSettingsData } from "@types";
import { CollectionAPI } from "@pages/api/dashboard/collection";

test.describe("Verify collection detail page", () => {
  let webBuilder: WebBuilder,
    section: Sections,
    xpathBlock: Blocks,
    frameLocator: FrameLocator,
    xpathBlockProductList: string,
    collectionUrl: string,
    buttonId: string,
    isDeletedFilterColor: boolean,
    isDeletedVendor: boolean,
    isHidedProduct: boolean,
    isRemovedProduct: boolean;
  let wbPage: WbCollectionDetail;
  let settingsData: PageSettingsData;
  let settingsDataPublish: PageSettingsData;

  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.theme_data);
      settingsData = response.settings_data as PageSettingsData;
    });
  });

  test.beforeEach(async ({ conf, dashboard, builder }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    wbPage = new WbCollectionDetail(dashboard, conf.suiteConf.domain);
    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    section = new Sections(dashboard, conf.suiteConf.domain);
    frameLocator = xpathBlock.frameLocator;
    xpathBlockProductList = `(//section[@component='${conf.suiteConf.component_name}'])[1]`;

    if (conf.suiteConf.case_access_dashboard_first.includes(conf.caseName)) {
      return;
    }

    await test.step("Update theme", async () => {
      if (!settingsData) {
        const response = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
        settingsData = response.settings_data as PageSettingsData;
      }

      //get publish theme data
      const responsePublish = await builder.pageSiteBuilder(conf.suiteConf.theme_id);
      settingsDataPublish = responsePublish.settings_data as PageSettingsData;

      //Update collection page data for publish theme
      settingsDataPublish.pages["collection"].default.elements = settingsData.pages["collection"].default.elements;
      await builder.updateSiteBuilder(conf.suiteConf.theme_id, settingsDataPublish);
    });

    await test.step(`Precond - vào page collection detail trong wb`, async () => {
      await wbPage.page.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${conf.suiteConf.theme_id}?page=${conf.suiteConf.page}`,
      );
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");
    });
  });

  test.afterEach(async ({ conf, context }, testInfo) => {
    if (testInfo.status === "failed") {
      const dashboardTab = await context.newPage();
      switch (conf.caseName) {
        case "SB_SC_SCWB_195":
          if (isDeletedFilterColor) {
            await addFilterColor(dashboardTab, conf.suiteConf.domain);
          }
          if (isDeletedVendor) {
            await dashboardTab.goto(`https://${conf.suiteConf.domain}/admin/products`);
            await dashboardTab.waitForLoadState("networkidle");
            await selectProductInList(dashboardTab, conf.caseConf.product_step_4);
            await addVendorToProduct(dashboardTab, conf.caseConf.vendor);
          }
          if (isHidedProduct) {
            await dashboardTab.goto(`https://${conf.suiteConf.domain}/admin/products`);
            await dashboardTab.waitForLoadState("networkidle");
            await selectProductInList(dashboardTab, conf.caseConf.product_step_6);
            await dashboardTab.locator(xpathShowProduct).waitFor();
            await dashboardTab.locator(xpathShowProduct).click();
            await dashboardTab.getByRole("button", { name: "Save changes" }).click();
            await expect(dashboardTab.locator("div.s-toast")).toContainText("Product was successfully saved!");
          }
          if (isRemovedProduct) {
            await dashboardTab.goto(`https://${conf.suiteConf.domain}/admin/products`);
            await dashboardTab.waitForLoadState("networkidle");
            await selectProductInList(dashboardTab, conf.caseConf.product_step_8);
            await addProductToCollection(dashboardTab, conf.caseConf.collection_name);
          }
          break;
      }
    }
  });

  test(`@SB_SC_SCWB_176 Collection detail page_Check chỉ hiển thị block product list trong trang collection detail, không add được vào các page khác`, async ({
    dashboard,
    context,
    conf,
    snapshotFixture,
  }) => {
    const page = dashboard;
    const caseConf = conf.caseConf;

    await test.step(`Mở insert panel: search Product list`, async () => {
      await page.waitForSelector(`//div[contains(@class, 'w-builder__header-left')]//button[@name='Insert']`);
      await page.locator(`//div[contains(@class, 'w-builder__header-left')]//button[@name='Insert']`).click();
      await page.locator("//input[@placeholder='Search']").click();
      await page.locator("//input[@placeholder='Search']").fill(caseConf.block_name);
      //expect khong tim thay block và hiển thị empty content
      await expect(
        page.locator("//div[contains(@class, 'w-builder__insert-previews--search-empty-content')]"),
      ).toBeVisible();
    });

    await test.step(`Click Page selector: mở Collection detail`, async () => {
      await page.waitForSelector(`//div[contains(@class, 'w-builder__header-left')]//button[@name='Pages']`);
      await page.locator(`//div[contains(@class, 'w-builder__header-left')]//button[@name='Pages']`).click();
      await expect(
        page.locator(
          `//div[contains(@class, 'is-active')]//div[contains(@class, 'w-builder__page-groups--item-label') and normalize-space()='${caseConf.page_name}']`,
        ),
      ).toBeVisible();
      await expect(frameLocator.locator(xpathBlockProductList)).toBeVisible();
    });

    await test.step(`Click mở block Product list`, async () => {
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();

      await snapshotFixture.verify({
        page: dashboard,
        selector: wbPage.xpathCD.widgetSideBar.xpathSidebar,
        snapshotName: `${process.env.ENV}-176-1-${caseConf.expected.snapshot_sidebar}`,
      });
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: `//div[@id='quick-settings']`,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-176-2-${caseConf.expected.snapshot_quick_setting}`,
      });
    });

    await test.step(`Click button preview trên header`, async () => {
      const [previewTab] = await Promise.all([
        context.waitForEvent("page"),
        await wbPage.page.click(xpathBlock.xpathButtonPreview),
      ]);
      await previewTab.waitForLoadState("domcontentloaded");
      await previewTab.waitForLoadState("networkidle");
      await expect(previewTab.locator(xpathBlockProductList)).toBeVisible();
    });
  });

  test(`@SB_SC_SCWB_178 Collection detail page_Check data block product list apply data current page, không phụ thuộc data source của container/section`, async ({
    dashboard,
    context,
    conf,
  }) => {
    const page = dashboard;
    const caseConf = conf.caseConf;
    const suiteConf = conf.suiteConf;

    await test.step(`Change preview collection http://joxi.ru/DrlLMoxtdOB0zr`, async () => {
      await selectCollectionPreview(page, frameLocator, caseConf.collection_first);
      await expect(page.locator(xpathLabelPreview)).toHaveText(`Preview: ${caseConf.collection_first}`);
      for (const product of caseConf.products_of_collection_first) {
        await expect(
          frameLocator.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
    });

    await test.step(`Click button preview trên header`, async () => {
      const [previewTab] = await Promise.all([
        context.waitForEvent("page"),
        await wbPage.page.click(xpathBlock.xpathButtonPreview),
      ]);
      await previewTab.waitForLoadState("domcontentloaded");
      await previewTab.waitForLoadState("networkidle");
      for (const product of caseConf.products_of_collection_first) {
        await expect(
          previewTab.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
    });

    await test.step(`Trong web builder, change preview collection `, async () => {
      await selectCollectionPreview(page, frameLocator, caseConf.collection_second);
      await expect(page.locator(xpathLabelPreview)).toHaveText(`Preview: ${caseConf.collection_second}`);
      const textNoProduct = frameLocator.locator(`//span[normalize-space()='${caseConf.text_no_products}']`);
      await expect(textNoProduct).toBeVisible();
      expect(await getStyle(textNoProduct, "font-size")).toEqual(caseConf.font_size);
      expect(await getStyle(textNoProduct, "font-weight")).toEqual(caseConf.font_weight);
      await expect(frameLocator.locator(xpathTextClearAll)).toBeVisible();
      expect(await getStyle(frameLocator.locator(xpathTextClearAll), "color")).toEqual(suiteConf.color_5.alpha_100);
    });

    await test.step(`Click button preview trên header`, async () => {
      const [previewTab] = await Promise.all([
        context.waitForEvent("page"),
        await wbPage.page.click(xpathBlock.xpathButtonPreview),
      ]);
      await previewTab.waitForLoadState("domcontentloaded");
      await previewTab.waitForLoadState("networkidle");
      await expect(previewTab.locator(`//span[normalize-space()='${caseConf.text_no_products}']`)).toBeVisible();
      await expect(previewTab.locator(xpathTextClearAll)).toBeVisible();
    });

    await test.step(`Trong web builder, change data source của section chứa block product list = collection 2`, async () => {
      const sidebarSelector = await webBuilder.getSidebarSelectorByName({
        sectionName: caseConf.section_name,
        sectionIndex: caseConf.section_index,
      });
      await page.locator("//button[@name='Layer']").click();
      await page.locator(sidebarSelector).click();
      await page.locator("#search-data-source").click();
      await page.waitForSelector(
        `//button[contains(@class,'sb-button--select sb-button--medium') and descendant::span[normalize-space()='Collection']]`,
      );
      await page
        .locator(
          `//button[contains(@class,'sb-button--select sb-button--medium') and descendant::span[normalize-space()='Collection']]`,
        )
        .click();
      await page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });
      await page.waitForSelector(
        `//div[contains(@class,'w-builder__search-data-source-result') and descendant::span[normalize-space()='${caseConf.collection_first}']]`,
      );
      await page
        .locator(
          `//div[contains(@class,'w-builder__search-data-source-result') and descendant::span[normalize-space()='${caseConf.collection_first}']]`,
        )
        .click();
      await page.waitForSelector(`[class="data-source-title connected"]:text-is('${caseConf.collection_first}')`);
      await expect(frameLocator.locator(`//span[normalize-space()='${caseConf.text_no_products}']`)).toBeVisible();
      await expect(frameLocator.locator(xpathTextClearAll)).toBeVisible();
    });
  });

  test(`@SB_SC_SCWB_179 Collection detail page_Check page detail của tất cả collection apply thay đổi khi edit page trong web builder`, async ({
    dashboard,
    context,
    conf,
  }) => {
    let productListId: string;
    const page = dashboard;
    const caseConf = conf.caseConf;
    const addBlock = caseConf.add_block;
    const xpathButton = `(//section[contains(@class,'section') and not(@selected-block-state)])[${addBlock.to.position.section}]//section[@component='button']`;
    const xpathProductList = `(//section[contains(@class,'section') and not(@selected-block-state)])[${addBlock.to.position.section}]//section[@component='product_list']`;

    await test.step(`Trong web builder, edit collection page: Add thêm block button vào ngay trên block product list -> Nhấn save`, async () => {
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await expect(frameLocator.locator(section.quickBarSelector)).toBeVisible();
      await clickSaveButton({ dashboard });
      buttonId = await frameLocator.locator(xpathButton).getAttribute("data-block-id");
    });

    await test.step(`Change preview collection`, async () => {
      await selectCollectionPreview(page, frameLocator, caseConf.collection_2);
      await expect(page.locator(xpathLabelPreview)).toHaveText(`Preview: ${caseConf.collection_2}`);
      await expect(frameLocator.locator(xpathButton)).toBeVisible();
      await expect(frameLocator.locator(xpathProductList)).toBeVisible();
      productListId = await frameLocator.locator(xpathProductList).getAttribute("data-block-id");
    });

    const sfTab = await context.newPage();
    await test.step(`Ngoài SF, nhập url của collection 1`, async () => {
      await sfTab.goto(`https://${conf.suiteConf.domain}/collections/collection-1`);
      await sfTab.waitForLoadState("domcontentloaded");
      await sfTab.waitForLoadState("networkidle");
      await expect(sfTab.locator(`//section[@data-block-id='${buttonId}']`)).toBeVisible();
      await expect(sfTab.locator(`//section[@data-block-id='${productListId}']`)).toBeVisible();
    });

    await test.step(`Ngoài SF, nhập url của collection 2`, async () => {
      await sfTab.goto(`https://${conf.suiteConf.domain}/collections/collection-2`);
      await sfTab.waitForLoadState("domcontentloaded");
      await sfTab.waitForLoadState("networkidle");
      await expect(sfTab.locator(`//section[@data-block-id='${buttonId}']`)).toBeVisible();
      await expect(sfTab.locator(`//section[@data-block-id='${productListId}']`)).toBeVisible();
    });
  });

  test(`@SB_SC_SCWB_180 Collection detail page_Check data của block product list apply thay đổi khi edit/delete/make unavailable collection trong dashboard`, async ({
    dashboard,
    context,
    conf,
    authRequest,
  }) => {
    const page = dashboard;
    const caseConf = conf.caseConf;
    const collectionsAPI = new CollectionAPI(conf.suiteConf.domain, authRequest);
    const collectionIds = [];
    const collectionTitle = [conf.caseConf.collection_name, conf.caseConf.collection_name_edited];

    await test.step(`Precondition: delete unwanted collections`, async () => {
      const collResponse = await collectionsAPI.getAll();
      const listCollections = collResponse.collections;
      for (const coll of listCollections) {
        if (collectionTitle.includes(coll.title)) {
          collectionIds.push(coll.id);
        }
      }
      if (collectionIds.length > 0) {
        for (const id of collectionIds) {
          await collectionsAPI.delete(id);
        }
      }
    });

    await test.step(`Vào dashboard > Collection: tạo mới A collection new gồm 3 product {A, B , C}; tick: Show on collection list page http://joxi.ru/Dr8b9yziDWgbG2`, async () => {
      await page.getByRole("link", { name: "Products", exact: true }).click();
      await page.getByRole("link", { name: "Collections" }).click();
      await page.getByRole("button", { name: "Create collection" }).click();
      await page.locator("label").filter({ hasText: "Manual" }).locator("span").first().click();
      await page.getByPlaceholder("e.g Summer collection, Under $100, Staff picks").click();
      await page.getByPlaceholder("e.g Summer collection, Under $100, Staff picks").fill(caseConf.collection_name);
      await page.getByRole("button", { name: "Save" }).click();
      await expect(page.locator("div.s-toast")).toContainText("Created collection successfully!");
      collectionUrl = page.url();
      await page.getByRole("button", { name: "Add product" }).isVisible();
      await page.getByRole("button", { name: "Add product" }).click();
      await page.waitForSelector(`//img[contains(@class,'sbase-spinner')]`, { state: "hidden" });
      for (const productName of caseConf.product_names) {
        await page.locator("//input[@placeholder='Search for product']").click();
        await page.locator("//input[@placeholder='Search for product']").fill(productName);
        await page.waitForSelector(
          `//div[@class='item' and descendant::div[@class='item-title' and normalize-space()='${productName}']]`,
        );
        await page
          .locator(
            `//div[@class='item' and descendant::div[@class='item-title' and normalize-space()='${productName}']]//label`,
          )
          .click();
      }
      await page.locator(`//div[contains(@class, 's-modal-footer')]//button[contains(@class, 'is-primary')]`).click();
      await expect(page.locator("div.s-toast")).toContainText("Select product successfully");
      do {
        await page.waitForSelector(`//div[contains(@class, 'product-page')]//button[contains(@class, 'is-primary')]`);
        await page.locator(`//div[contains(@class, 'product-page')]//button[contains(@class, 'is-primary')]`).click();
        await page.waitForSelector(`//img[contains(@class,'sbase-spinner')]`);
        await page.waitForSelector(`//img[contains(@class,'sbase-spinner')]`, { state: "hidden" });
      } while (
        await page
          .locator(`//div[contains(@class, 'product-page')]//button[contains(@class, 'is-primary')]`)
          .isVisible()
      );
      await expect(page.locator("div.have-product")).toBeVisible();
    });

    await test.step(`Customize theme > Collection detail: mở list collection preview`, async () => {
      await page.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${conf.suiteConf.theme_id}?page=${conf.suiteConf.page}`,
      );
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await expect(page.locator(xpathLabelPreview)).toHaveText(`Preview: ${caseConf.collection_name}`);
    });

    await test.step(`Chọn new collection`, async () => {
      for (const productName of caseConf.product_names) {
        await expect(
          frameLocator.locator(`(//div[contains(@class,'product-item')]//a[normalize-space()='${productName}'])[1]`),
        ).toBeVisible();
      }
    });

    await test.step(`Click button preview trên header`, async () => {
      const previewTab = await clickPreviewSF(dashboard, context, xpathBlock.xpathButtonPreview);
      for (const productName of caseConf.product_names) {
        await expect(
          previewTab.locator(`(//div[contains(@class,'product-item')]//a[normalize-space()='${productName}'])[1]`),
        ).toBeVisible();
      }
    });

    await test.step(`Vào dashboard > Collection > A Collection new: edit A collection new edited`, async () => {
      await page.goto(collectionUrl);
      await page.getByPlaceholder("e.g Summer collection, Under $100, Staff picks").click();
      await page
        .getByPlaceholder("e.g Summer collection, Under $100, Staff picks")
        .fill(caseConf.collection_name_edited);
      await page.getByRole("combobox").selectOption("created-desc");
      await expect(page.locator("div.s-toast")).toContainText("Collection order updated");
      await page.getByRole("button", { name: "Edit website SEO" }).click();
      await page
        .locator(
          `//div[contains(@class,'s-form-item') and descendant::label[normalize-space()='URL and handle']]//input`,
        )
        .click();
      await page
        .locator(
          `//div[contains(@class,'s-form-item') and descendant::label[normalize-space()='URL and handle']]//input`,
        )
        .fill(caseConf.collection_handle);
      await page.getByRole("button", { name: "Save" }).first().click();
      await expect(page.locator("div.s-toast")).toContainText("Saved collection!");
    });

    await test.step(`Customize theme > Collection detail: mở list collection preview`, async () => {
      await page.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${conf.suiteConf.theme_id}?page=${conf.suiteConf.page}`,
      );
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await selectCollectionPreview(page, frameLocator, caseConf.collection_name_edited);
      await expect(page.locator(xpathLabelPreview)).toHaveText(`Preview: ${caseConf.collection_name_edited}`);
    });

    await test.step(`Chọn A collection new edited`, async () => {
      for (const productName of caseConf.product_names) {
        await expect(
          frameLocator.locator(`(//div[contains(@class,'product-item')]//a[normalize-space()='${productName}'])[1]`),
        ).toBeVisible();
      }
    });

    await test.step(`Click button preview trên header`, async () => {
      const previewTab = await clickPreviewSF(dashboard, context, xpathBlock.xpathButtonPreview);
      for (const productName of caseConf.product_names) {
        await expect(
          previewTab.locator(`(//div[contains(@class,'product-item')]//a[normalize-space()='${productName}'])[1]`),
        ).toBeVisible();
      }
      await expect(previewTab.url()).toContain(`/${caseConf.collection_handle}`);
    });

    await test.step(`Xóa collection trong dashboard`, async () => {
      await page.goto(collectionUrl);
      await page.getByRole("button", { name: "Delete" }).click();
      await page.locator(`//div[contains(@class, 's-modal-footer')]//button[contains(@class, 'is-danger')]`).click();
      await expect(page.locator("div.s-toast")).toContainText(`Deleted collection ${caseConf.collection_name_edited}`);
    });

    await test.step(`Customize theme > Collection detail: mở list collection preview`, async () => {
      await page.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${conf.suiteConf.theme_id}?page=${conf.suiteConf.page}`,
      );
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await page.locator("div.w-builder__autocomplete").click();
      await page.locator("//input[@placeholder='Search collections']").click();
      await page.locator("//input[@placeholder='Search collections']").fill(caseConf.collection_name_edited);
      await page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });
      await expect(wbPage.page.locator(wbPage.xpathCD.widgetSideBar.xpathAllProductsSearchResult)).toBeVisible();
    });

    await test.step(`Ngoài SF, nhập URL của A collection new edited`, async () => {
      await page.goto(`https://${conf.suiteConf.domain}/collections/${caseConf.collection_handle}`);
      await page.locator("#v-progressbar").waitFor({ state: "detached" });
      await expect(page.locator(`(//div[normalize-space()='Page not found'])[1]`)).toBeVisible();
    });
  });

  test(`@SB_SC_SCWB_181 Collection detail page_Check hiển thị block Product list khi set 1 bộ data`, async ({
    dashboard,
    context,
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;

    await test.step(`Check hiển thị đủ các trường trên side bar của tab Design`, async () => {
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");

      await snapshotFixture.verify({
        page: dashboard,
        selector: wbPage.xpathCD.widgetSideBar.xpathSidebar,
        snapshotName: caseConf.expected.snapshot_design,
      });
    });

    await test.step(`Click tab Content`, async () => {
      await webBuilder.switchToTab("Content");
      await turnONOFToggleByLabel(wbPage.page, "Show Sorting", true);
      await turnONOFToggleByLabel(wbPage.page, "Show Filter", true);
      await clickSaveButton({ dashboard });
      await webBuilder.switchToTab("Content");

      await snapshotFixture.verify({
        page: dashboard,
        selector: wbPage.xpathCD.widgetSideBar.xpathSidebar,
        snapshotName: caseConf.expected.snapshot_content,
      });
    });

    await test.step(`Click edit collection filter here`, async () => {
      const [previewTab] = await Promise.all([
        context.waitForEvent("page"),
        await wbPage.page.locator(`//a[normalize-space()='Edit collection filter here']`).click(),
      ]);

      expect(previewTab.url()).toEqual(`https://${conf.suiteConf.domain}/admin/menus`);
    });

    await test.step(`Set 1 bộ data cho các filed, nhấn save`, async () => {
      await webBuilder.switchToTab("Design");
      await webBuilder.changeDesign(caseConf.styles);
      await clickSaveButton({ dashboard });

      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: "[component='product_list']",
        iframe: webBuilder.iframe,
        snapshotName: caseConf.expected.snapshot_column_product_list,
      });
    });

    await test.step(`Ngoài SF, nhập URL của collection 1`, async () => {
      const sfTab = await context.newPage();
      await sfTab.goto(`https://${conf.suiteConf.domain}/collections/${caseConf.collection_handle}`);
      await sfTab.waitForLoadState("networkidle");

      await snapshotFixture.verify({
        page: sfTab,
        selector: "[component='product_list']",
        snapshotName: caseConf.expected.snapshot_column_product_list_sf,
      });
    });

    await test.step(`Set lại styles default`, async () => {
      await webBuilder.changeDesign(caseConf.default_styles);
      await clickSaveButton({ dashboard });
    });
  });

  test(`@SB_SC_SCWB_182 Collection detail page_Check trường Size card và logic resize (với position của filter = In drawer)`, async ({
    conf,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Click mở block Product list`, async () => {
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
    });

    const layoutContainer = await frameLocator.locator(`(//div[contains(@class,'layout-grid--container')])[1]`);
    const productItem = await frameLocator.locator(`(//div[contains(@class,'product-card--assets')])[1]`);
    await test.step(`Set size card = Small; width = 100%`, async () => {
      await selectSizeCard(wbPage.page, "Small");
      await webBuilder.editSliderBar(caseConf.spacing.label, caseConf.spacing.value);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      await expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.small);
      await expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      await expect(await getStyle(layoutContainer, "width")).toEqual(caseConf.width_1120);
      await expect(await getStyle(productItem, "width")).toEqual(caseConf.width_item_product.small.width_block_1120);
    });

    await test.step(`Resize width block > 256px`, async () => {
      await webBuilder.settingWidthHeight("width", caseConf.set_width_700);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      await expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.small);
      await expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      await expect(await getStyle(productItem, "width")).toEqual(caseConf.width_item_product.small.width_block_700);
    });

    await test.step(`Resize width block < 256px`, async () => {
      await webBuilder.settingWidthHeight("width", caseConf.set_width_250);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      await expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.small);
      await expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      await expect(await getStyle(productItem, "width")).toEqual(caseConf.min_width_card.small);
    });

    await test.step(`Set size card = large; width = 100%`, async () => {
      await selectSizeCard(wbPage.page, "Large");
      await webBuilder.settingWidthHeight("width", caseConf.set_width_100);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      await expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.large);
      await expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      await expect(await getStyle(layoutContainer, "width")).toEqual(caseConf.width_1120);
      await expect(await getStyle(productItem, "width")).toEqual(caseConf.width_item_product.large.width_block_1120);
    });

    await test.step(`Resize width block > 352px`, async () => {
      await webBuilder.settingWidthHeight("width", caseConf.set_width_700);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      await expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.large);
      await expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      await expect(await getStyle(productItem, "width")).toEqual(caseConf.width_item_product.large.width_block_700);
    });

    await test.step(`Resize width block < 352px`, async () => {
      await webBuilder.settingWidthHeight("width", caseConf.set_width_250);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      await expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.large);
      await expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      await expect(await getStyle(productItem, "width")).toEqual(caseConf.min_width_card.large);
    });
  });

  test(`@SB_SC_SCWB_183 Collection detail page_Check trường Size card và logic resize (với position của filter = Left)`, async ({
    conf,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Click mở block Product list`, async () => {
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
    });

    const layoutContainer = frameLocator.locator(`(//div[contains(@class,'layout-grid--container')])[1]`);
    const productItem = frameLocator.locator(`(//div[contains(@class,'product-card--assets')])[1]`);
    const blockProductList = frameLocator.locator(xpathBlockProductList);
    await test.step(`Set size card = Small; width = 100%`, async () => {
      await selectSizeCard(wbPage.page, "Small");
      await webBuilder.editSliderBar(caseConf.spacing.label, caseConf.spacing.value);
      await webBuilder.selectDropDown("filter_position", "Left");
      await expect(frameLocator.locator(`//div[contains(@class,'filters__container left')]`)).toBeVisible();
      expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.small);
      expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      expect(await getStyle(blockProductList, "width")).toEqual(caseConf.width_1120);
      expect(await getStyle(productItem, "width")).toEqual(caseConf.width_item_product.small.width_block_1120);
    });

    await test.step(`Resize width block > 256px + size filter tab`, async () => {
      await webBuilder.settingWidthHeight("width", caseConf.set_width_700);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.small);
      expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      expect(await getStyle(productItem, "width")).toEqual(caseConf.width_item_product.small.width_block_700);
    });

    await test.step(`Resize width block < 256px + size filter tab`, async () => {
      await webBuilder.settingWidthHeight("width", caseConf.set_width_450);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.small);
      expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      expect(await getStyle(productItem, "width")).toEqual(caseConf.min_width_card.small);
    });

    await test.step(`Set size card = large; width = 100%`, async () => {
      await selectSizeCard(wbPage.page, "Large");
      await webBuilder.settingWidthHeight("width", caseConf.set_width_100);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.large);
      expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      expect(await getStyle(blockProductList, "width")).toEqual(caseConf.width_1120);
      expect(await getStyle(productItem, "width")).toEqual(caseConf.width_item_product.large.width_block_1120);
    });

    await test.step(`Resize width block > 352px + size filter tab`, async () => {
      await webBuilder.settingWidthHeight("width", caseConf.set_width_900);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.large);
      expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      expect(await getStyle(productItem, "width")).toEqual(caseConf.width_item_product.large.width_block_900);
    });

    await test.step(`Resize width block < 352px + size filter tab`, async () => {
      await webBuilder.settingWidthHeight("width", caseConf.set_width_600);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.large);
      expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      expect(await getStyle(productItem, "width")).toEqual(caseConf.min_width_card.large);
    });
  });

  test(`@SB_SC_SCWB_184 Collection detail page_Check trường Size card và logic resize (với position của filter = Top)`, async ({
    conf,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Click mở block Product list`, async () => {
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
    });

    const layoutContainer = frameLocator.locator(`(//div[contains(@class,'layout-grid--container')])[1]`);
    const productItem = frameLocator.locator(`(//div[contains(@class,'product-card--assets')])[1]`);
    const blockProductList = frameLocator.locator(xpathBlockProductList);
    await test.step(`Set size card = Small; width = 100%`, async () => {
      await selectSizeCard(wbPage.page, "Small");
      await webBuilder.editSliderBar(caseConf.spacing.label, caseConf.spacing.value);
      await webBuilder.selectDropDown("filter_position", "Top");
      await expect(
        frameLocator.locator(`(//div[contains(@class,'filters__container') and contains(@class, 'top')])[1]`),
      ).toBeVisible();
      expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.small);
      expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      expect(await getStyle(blockProductList, "width")).toEqual(caseConf.width_1120);
      expect(await getStyle(productItem, "width")).toEqual(caseConf.width_item_product.small.width_block_1120);
    });

    await test.step(`Resize width block > 256px`, async () => {
      await webBuilder.settingWidthHeight("width", caseConf.set_width_700);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.small);
      expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      expect(await getStyle(productItem, "width")).toEqual(caseConf.width_item_product.small.width_block_700);
    });

    await test.step(`Resize width block < 256px`, async () => {
      await webBuilder.settingWidthHeight("width", caseConf.set_width_250);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.small);
      expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      expect(await getStyle(productItem, "width")).toEqual(caseConf.min_width_card.small);
    });

    await test.step(`Set size card = large; width = 100%`, async () => {
      await selectSizeCard(wbPage.page, "Large");
      await webBuilder.settingWidthHeight("width", caseConf.set_width_100);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.large);
      expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      expect(await getStyle(layoutContainer, "width")).toEqual(caseConf.width_1120);
      expect(await getStyle(productItem, "width")).toEqual(caseConf.width_item_product.large.width_block_1120);
    });

    await test.step(`Resize width block > 352px`, async () => {
      await webBuilder.settingWidthHeight("width", caseConf.set_width_700);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.large);
      expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      expect(await getStyle(productItem, "width")).toEqual(caseConf.width_item_product.large.width_block_700);
    });

    await test.step(`Resize width block < 352px`, async () => {
      await webBuilder.settingWidthHeight("width", caseConf.set_width_250);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      expect(await getStyle(layoutContainer, "--min-width")).toEqual(caseConf.min_width_card.large);
      expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacing.value.number}px`);
      expect(await getStyle(productItem, "width")).toEqual(caseConf.min_width_card.large);
    });
  });

  test(`@SB_SC_SCWB_185 Collection detail page_Check trường spacing`, async ({ dashboard, context, conf }) => {
    const caseConf = conf.caseConf;

    await test.step(`Click mở block Product list`, async () => {
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
    });

    const layoutContainer = frameLocator.locator(`(//div[contains(@class,'layout-grid--container')])[1]`);
    const layoutContainerSf = frameLocator.locator(`(//div[contains(@class,'layout-grid--container')])[1]`);
    const [previewTab] = await Promise.all([
      context.waitForEvent("page"),
      await wbPage.page.click(xpathBlock.xpathButtonPreview),
    ]);
    await previewTab.waitForLoadState("networkidle");

    await test.step(`Set spacing là kí tự hợp lệ > 0 và < 32px`, async () => {
      for (const spacing of caseConf.spacings.step_2) {
        await webBuilder.editSliderBar(caseConf.spacings.label, spacing);
        await wbPage.page.waitForTimeout(1000);
        await clickSaveButton({ dashboard });
        expect(await getStyle(layoutContainer, "gap")).toEqual(`${spacing.number}px`);
        await previewTab.reload();
        await previewTab.waitForLoadState("networkidle");
        expect(await getStyle(layoutContainerSf, "gap")).toEqual(`${spacing.number}px`);
      }
    });

    await test.step(`Thay đổi data`, async () => {
      await webBuilder.editSliderBar(caseConf.spacings.label, caseConf.spacings.default);
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.other_collection);
      await clickSaveButton({ dashboard });
      expect(await getStyle(layoutContainer, "gap")).toEqual(`${caseConf.spacings.default.number}px`);
      await previewTab.reload();
      await previewTab.waitForLoadState("networkidle");
      expect(await getStyle(layoutContainerSf, "gap")).toEqual(`${caseConf.spacings.default.number}px`);
    });

    await test.step(`Set spacing là kí tự không hợp lệ(số < 0, số > 32, chữ cái)`, async () => {
      for (const spacing of caseConf.spacings.step_4) {
        await webBuilder.editSliderBar(caseConf.spacings.label, spacing);
        await wbPage.page.locator(wbPage.xpathCD.widgetSideBar.xpathSpacing).click();
        await wbPage.page.waitForTimeout(1000);
        await clickSaveButton({ dashboard });
        expect(await getStyle(layoutContainer, "gap")).toEqual(`${spacing.expected}px`);
        await previewTab.reload();
        await previewTab.waitForLoadState("networkidle");
        expect(await getStyle(layoutContainerSf, "gap")).toEqual(`${spacing.expected}px`);
      }
      await webBuilder.editSliderBar(caseConf.spacings.label, caseConf.spacings.default);
      await clickSaveButton({ dashboard });
    });
  });

  test(`@SB_SC_SCWB_186 Collection detail page_Check trường Pageload`, async ({
    dashboard,
    context,
    conf,
    snapshotFixture,
  }) => {
    test.setTimeout(600000);
    let sfTab: Page;
    let productNumber: number;
    const page = dashboard;
    const caseConf = conf.caseConf;
    const section = caseConf.section_index;
    const xpathProductItems = `(//div[contains(@class,'layout-grid--container')])[1]//div[contains(@class,'product-item')]`;
    const xPathSectionAfterSf = `(//section[contains(@class,'wb-builder__section--container')])[${section + 1}]`;
    const xPathPage2 = `(//div[contains(@class,'pagination')]//li[normalize-space()='2'])[1]`;

    for (const position of caseConf.filter_position) {
      await test.step(`Chọn page load = Infinite load`, async () => {
        await wbPage.page.reload();
        await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathLoadingWb);
        await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
        await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
        await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
        await webBuilder.switchToTab("Design");
        await webBuilder.selectDropDown("filter_position", position);
        await webBuilder.selectDropDown("page_load", "Infinite Load");

        // Wait do sau khi chọn value có chút delay rồi mới apply thành công
        await webBuilder.page.waitForTimeout(1000);
        productNumber = await frameLocator.locator(xpathProductItems).count();
        expect(productNumber).toEqual(caseConf.product_number_default);
      });

      await test.step(`Trong web builder, scroll xuống dưới 80%`, async () => {
        await webBuilder.scrollIntoViewInWebBuilder(frameLocator.locator(xpathProductItems).last(), false);
        await frameLocator.locator(webBuilder.xpathLoadSpinner).waitFor({ state: "detached" });
        await frameLocator
          .locator(`(${xpathProductItems})[${caseConf.product_number_default + 1}]`)
          .waitFor({ state: "visible" });
        productNumber = await frameLocator.locator(xpathProductItems).count();
        expect(productNumber).toEqual(caseConf.product_total);
        await clickSaveButton({ dashboard });
      });

      await test.step(`Ngoài SF, nhập URL của collection 4`, async () => {
        sfTab = await context.newPage();
        await sfTab.goto(`https://${conf.suiteConf.domain}/collections/${caseConf.collection_handle}`);
        await sfTab.waitForResponse(/theme.css/);
        productNumber = await sfTab.locator(xpathProductItems).count();
        expect(productNumber).toEqual(caseConf.product_number_default);
      });

      await test.step(`Ngoài SF, scroll xuống dưới quá 80%`, async () => {
        await sfTab.locator(xPathSectionAfterSf).evaluate(ele => {
          ele.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        await sfTab.locator(webBuilder.xpathLoadSpinner).waitFor({ state: "detached" });
        await sfTab
          .locator(`(${xpathProductItems})[${caseConf.product_number_default + 1}]`)
          .waitFor({ state: "visible" });
        productNumber = await sfTab.locator(xpathProductItems).count();
        expect(productNumber).toEqual(caseConf.product_total);
      });

      await test.step(`Trong web builder, chọn page load = Paging`, async () => {
        await page.reload();
        await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathLoadingWb);
        await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
        await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
        await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
        await webBuilder.switchToTab("Design");

        await webBuilder.selectDropDown("page_load", "Paging");
        await clickSaveButton({ dashboard });
        await wbPage.page.locator(wbPage.xpathCD.widgetSideBar.selectorBackButton).click();
        productNumber = await frameLocator.locator(xpathProductItems).count();
        expect(productNumber).toEqual(caseConf.product_number_default);
        await webBuilder.frameLocator.locator(xpathPagination).scrollIntoViewIfNeeded();
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: xpathPagination,
          iframe: webBuilder.iframe,
          snapshotName: `${process.env.ENV}-position-filter-${position}-${caseConf.expected.snapshot_pagination}`,
        });
      });

      await test.step(`Click chọn page 2`, async () => {
        await frameLocator.locator(xPathPage2).waitFor({ state: "visible" });
        await frameLocator.locator(xPathPage2).click();
        await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
        await dashboard.waitForTimeout(2000); //wait do page load cham
        productNumber = await frameLocator.locator(xpathProductItems).count();
        expect(productNumber).toEqual(caseConf.number_of_products_page_2);
      });

      await test.step(`Ngoài SF, nhập URL của collection 4`, async () => {
        await sfTab.reload();
        await sfTab.waitForResponse(/theme.css/);
        productNumber = await sfTab.locator(xpathProductItems).count();
        expect(productNumber).toEqual(caseConf.product_number_default);
        await sfTab.locator(xpathPagination).scrollIntoViewIfNeeded();
        await snapshotFixture.verify({
          page: sfTab,
          selector: xpathPagination,
          snapshotName: `${process.env.ENV}-position-filter-${position}-${caseConf.expected.snapshot_pagination_sf}`,
        });
      });

      await test.step(`Ngoài SF, Click chọn page 2`, async () => {
        await sfTab.locator(xPathPage2).click();
        await sfTab.locator("#v-progressbar").waitFor({ state: "visible" });
        await sfTab.locator("#v-progressbar").waitFor({ state: "detached" });
        await dashboard.waitForTimeout(2000); //wait do page load cham
        productNumber = await sfTab.locator(xpathProductItems).count();
        expect(productNumber).toEqual(caseConf.number_of_products_page_2);
        await sfTab.close();
      });
    }
  });

  test(`@SB_SC_SCWB_187 Collection detail page_Check UI filter, tag với filter position = Top`, async ({
    dashboard,
    conf,
  }) => {
    const caseConf = conf.caseConf;
    const suiteConf = conf.suiteConf;

    await test.step(`Chọn filter position = Top`, async () => {
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.selectDropDown("filter_position", "Top");
      await clickSaveButton({ dashboard });
      await expect(wbPage.page.locator(xpathLabelPreview)).toHaveText(`Preview: ${caseConf.collection_name}`);
    });

    await test.step(`Check UI các filter`, async () => {
      await expect(frameLocator.locator(xpathFiltersContainerTop)).toBeVisible();
      const xPathTextFilter = `${xpathFiltersContainerTop}//p[normalize-space()='Filter:']`;
      const sizeTextFilter = await getStyle(frameLocator.locator(xPathTextFilter), "font-size");
      const colorTextFilter = await getStyle(frameLocator.locator(xPathTextFilter), "color");
      expect(sizeTextFilter).toEqual(caseConf.fontsize_16);
      expect(colorTextFilter).toEqual(suiteConf.color_5.alpha_100);
      const sizeTextProducts = await getStyle(frameLocator.locator(xpathTextProductNumber), "font-size");
      const colorTextProducts = await getStyle(frameLocator.locator(xpathTextProductNumber), "color");
      expect(sizeTextProducts).toEqual(caseConf.fontsize_14);
      expect(colorTextProducts).toEqual(caseConf.color_text_products);
    });

    const xpathFilterColor = getXpathFilter("color", "top");
    const xpathDataFilterColor = getXpathFilter("color", "top", true);
    await test.step(`Click dropdown 1 filed`, async () => {
      await wbPage.page.locator(wbPage.xpathCD.widgetSideBar.selectorBackButton).click();
      await frameLocator.locator(xpathFilterColor).waitFor({ state: "visible" });
      await frameLocator.locator(xpathFilterColor).click();
      await frameLocator.locator(xpathDataFilterColor).waitFor({ state: "visible" });
      await verifyDropdownFilter({ frameLocator, caseConf, suiteConf }, "top");
    });

    await test.step(`Chọn tag dài & tag ngắn`, async () => {
      for (const color of caseConf.select_colors) {
        const xpathCheckbox = `(${xpathDataFilterColor}//div[normalize-space()='${color}']//span)[1]`;
        await frameLocator.locator(xpathCheckbox).click();
        await frameLocator.locator("#v-progressbar").waitFor({ state: "visible" });
        await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      }
      await wbPage.page.locator(wbPage.xpathCD.widgetSideBar.selectorBackButton).click();
      await frameLocator.locator(xpathFilterColor).click();
      await frameLocator.locator(xpathDataFilterColor).waitFor({ state: "hidden" });
      await verifyTagFilter({ frameLocator, caseConf, suiteConf });

      for (const product of caseConf.products_of_filter) {
        await expect(
          frameLocator.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
      await expect(frameLocator.locator(xpathTextProductNumber)).toContainText(
        `${caseConf.products_of_filter.length} Products`,
      );
    });
  });

  test(`@SB_SC_SCWB_188 Collection detail page_Check filter function với filter position = Top`, async ({
    dashboard,
    conf,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Chọn filter position = Top`, async () => {
      await wbPage.page.waitForLoadState("networkidle");
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.selectDropDown("filter_position", "Top");
      await clickSaveButton({ dashboard });
      await expect(wbPage.page.locator(xpathLabelPreview)).toHaveText(`Preview: ${caseConf.collection_name}`);
    });

    const xpathFilterColor = getXpathFilter("color", "top");
    const xpathDataFilterColor = getXpathFilter("color", "top", true);
    await test.step(`click dropdown Color`, async () => {
      await wbPage.page.locator(wbPage.xpathCD.widgetSideBar.selectorBackButton).click();
      await frameLocator.locator(xpathFilterColor).waitFor({ state: "visible" });
      await frameLocator.locator(xpathFilterColor).click();
      await frameLocator.locator(xpathDataFilterColor).waitFor({ state: "visible" });
      await expect(
        frameLocator.locator(`(${xpathDataFilterColor}//div[contains(@class,'base-checkbox')])[1]`),
      ).toBeVisible();
    });

    await test.step(`Chọn tag dài & tag ngắn`, async () => {
      for (const color of caseConf.select_colors) {
        const xpathCheckbox = `(${xpathDataFilterColor}//div[normalize-space()='${color}']//span)[1]`;
        await frameLocator.locator(xpathCheckbox).click();
        await frameLocator.locator("#v-progressbar").waitFor({ state: "visible" });
        await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      }
      await wbPage.page.locator(wbPage.xpathCD.widgetSideBar.selectorBackButton).click();
      await frameLocator.locator(xpathFilterColor).click();
      await frameLocator.locator(xpathDataFilterColor).waitFor({ state: "hidden" });
      for (const product of caseConf.products_of_filter) {
        await expect(
          frameLocator.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
      await expect(frameLocator.locator(xpathTextProductNumber)).toContainText(
        `${caseConf.products_of_filter.length} Products`,
      );
    });

    await test.step(`Click clear all`, async () => {
      await wbPage.page.locator(wbPage.xpathCD.widgetSideBar.selectorBackButton).click();
      await frameLocator.locator(xpathFilterColor).click();
      await frameLocator.locator(xpathClearAll).click();
      await frameLocator.locator("#v-progressbar").waitFor({ state: "visible" });
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await expect(frameLocator.locator(xpathTagContainer)).toBeHidden();
    });

    await test.step(`Trong web builder, đổi preview data`, async () => {
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.other_collection);
      for (const product of caseConf.products_of_other_collection) {
        await expect(
          frameLocator.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
      for (const filter of caseConf.filter_of_other_collection) {
        await expect(frameLocator.locator(getXpathFilter(filter, "top"))).toBeVisible();
      }
    });

    await test.step(`click dropdown Color`, async () => {
      await wbPage.page.locator(wbPage.xpathCD.widgetSideBar.selectorBackButton).click();
      await frameLocator.locator(xpathFilterColor).waitFor({ state: "visible" });
      await frameLocator.locator(xpathFilterColor).click();
      await frameLocator.locator(xpathDataFilterColor).waitFor({ state: "visible" });
      await expect(
        frameLocator.locator(`(${xpathDataFilterColor}//div[contains(@class,'color__container')])[1]`),
      ).toBeVisible();
    });
  });

  test(`@SB_SC_SCWB_189 Collection detail page_Check UI filter, tag với filter position = Left`, async ({
    dashboard,
    conf,
  }) => {
    const caseConf = conf.caseConf;
    const suiteConf = conf.suiteConf;

    await test.step(`Chọn filter position = Left`, async () => {
      await wbPage.page.waitForLoadState("networkidle");
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.selectDropDown("filter_position", "Left");
      await clickSaveButton({ dashboard });
      await expect(wbPage.page.locator(xpathLabelPreview)).toHaveText(`Preview: ${caseConf.collection_name}`);
      await expect(frameLocator.locator(`//div[contains(@class,'filters__container left')]`)).toBeVisible();
    });

    await test.step(`Check UI các filter`, async () => {
      const xPathTextFilter = `//div[contains(@class,'filters__container')]//p[normalize-space()='Filter']`;
      const sizeTextFilter = await getStyle(frameLocator.locator(xPathTextFilter), "font-size");
      const colorTextFilter = await getStyle(frameLocator.locator(xPathTextFilter), "color");
      expect(sizeTextFilter).toEqual(caseConf.fontsize_20);
      expect(colorTextFilter).toEqual(suiteConf.color_5.alpha_100);
      const sizeTextProducts = await getStyle(frameLocator.locator(xpathTextProductNumber), "font-size");
      const colorTextProducts = await getStyle(frameLocator.locator(xpathTextProductNumber), "color");
      expect(sizeTextProducts).toEqual(caseConf.fontsize_14);
      expect(colorTextProducts).toEqual(caseConf.color_text_products);
    });

    const xpathFilterColor = getXpathFilter("color", "left");
    const xpathDataFilterColor = getXpathFilter("color", "left", true);
    await test.step(`Click expand 1 filed`, async () => {
      await frameLocator.locator(xpathFilterColor).waitFor({ state: "visible" });
      await frameLocator.locator(`${xpathFilterColor}//div[contains(@class,'close')]`).click();
      await frameLocator.locator(xpathDataFilterColor).waitFor({ state: "visible" });
      await verifyDropdownFilter({ frameLocator, caseConf, suiteConf }, "left");
    });

    await test.step(`Chọn tag dài & tag ngắn`, async () => {
      for (const color of caseConf.select_colors) {
        const xpathCheckbox = `(${xpathDataFilterColor}//div[normalize-space()='${color}']//span)[1]`;
        await frameLocator.locator(xpathCheckbox).click();
        await frameLocator.locator("#v-progressbar").waitFor({ state: "visible" });
        await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      }
      await verifyTagFilter({ frameLocator, caseConf, suiteConf });
      for (const product of caseConf.products_of_filter) {
        await expect(
          frameLocator.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
      await expect(frameLocator.locator(xpathTextProductNumber)).toContainText(
        `${caseConf.products_of_filter.length} Products`,
      );
    });
  });

  test(`@SB_SC_SCWB_190 Collection detail page_Check filter function với filter position = Left`, async ({
    dashboard,
    context,
    conf,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Chọn filter position = Left`, async () => {
      await wbPage.page.waitForLoadState("networkidle");
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.selectDropDown("filter_position", "Left");
      await clickSaveButton({ dashboard });
      await expect(wbPage.page.locator(xpathLabelPreview)).toHaveText(`Preview: ${caseConf.collection_name}`);
      await expect(frameLocator.locator(`//div[contains(@class,'filters__container left')]`)).toBeVisible();
    });

    const xpathFilterColor = getXpathFilter("color", "left");
    const xpathDataFilterColor = getXpathFilter("color", "left", true);
    await test.step(`Click expand 1 filed`, async () => {
      await frameLocator.locator(xpathFilterColor).waitFor({ state: "visible" });
      await frameLocator.locator(`${xpathFilterColor}//div[contains(@class,'close')]`).click();
      await frameLocator.locator(xpathDataFilterColor).waitFor({ state: "visible" });
      await expect(
        frameLocator.locator(`(${xpathDataFilterColor}//div[contains(@class,'base-checkbox')])[1]`),
      ).toBeVisible();
    });

    await test.step(`Chọn tag dài & tag ngắn`, async () => {
      for (const color of caseConf.select_colors) {
        const xpathCheckbox = `(${xpathDataFilterColor}//div[normalize-space()='${color}']//span)[1]`;
        await frameLocator.locator(xpathCheckbox).click();
        await frameLocator.locator("#v-progressbar").waitFor({ state: "visible" });
        await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      }
      for (const product of caseConf.products_of_filter) {
        await expect(
          frameLocator.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
      await expect(frameLocator.locator(xpathTextProductNumber)).toContainText(
        `${caseConf.products_of_filter.length} Products`,
      );
    });

    const sfTab = await context.newPage();
    await test.step(`Untick 1 option`, async () => {
      await sfTab.goto(`https://${conf.suiteConf.domain}/collections/${caseConf.collection_handle}`);
      await sfTab.waitForLoadState("networkidle");
      await sfTab.locator(`${xpathFilterColor}//div[contains(@class,'close')]`).click();
      for (const color of caseConf.select_colors) {
        const xpathCheckbox = `(${xpathDataFilterColor}//div[normalize-space()='${color}']//span)[1]`;
        await sfTab.locator(xpathCheckbox).click();
        await sfTab.locator("#v-progressbar").waitFor({ state: "visible" });
        await sfTab.locator("#v-progressbar").waitFor({ state: "detached" });
      }
      for (const product of caseConf.products_of_filter) {
        await expect(
          sfTab.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
      await expect(sfTab.locator(xpathTextProductNumber)).toContainText(
        `${caseConf.products_of_filter.length} Products`,
      );

      const xpathCheckboxBlack = `(${xpathDataFilterColor}//div[normalize-space()='${caseConf.select_colors[1]}']//span)[1]`;
      await sfTab.locator(xpathCheckboxBlack).click();
      await sfTab.locator("#v-progressbar").waitFor({ state: "visible" });
      await sfTab.locator("#v-progressbar").waitFor({ state: "detached" });
      await expect(
        sfTab.locator(
          `(//div[contains(@class,'filter-result')]//div[normalize-space()="color: ${caseConf.select_colors[1]}"])[1]`,
        ),
      ).toBeHidden();
      for (const product of caseConf.products_of_black) {
        await expect(
          sfTab.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeHidden();
      }
    });

    await test.step(`Reload page`, async () => {
      await sfTab.reload();
      await sfTab.locator("#v-progressbar").waitFor({ state: "visible" });
      await sfTab.locator("#v-progressbar").waitFor({ state: "detached" });
      await expect(
        sfTab.locator(
          `(//div[contains(@class,'filter-result')]//div[normalize-space()="color: ${caseConf.select_colors[1]}"])[1]`,
        ),
      ).toBeHidden();
      for (const product of caseConf.products_of_black) {
        await expect(
          sfTab.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeHidden();
      }
    });

    await test.step(`Click clear all`, async () => {
      await frameLocator.locator(xpathClearAll).click();
      await frameLocator.locator("#v-progressbar").waitFor({ state: "visible" });
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await expect(frameLocator.locator(xpathTagContainer)).toBeHidden();
    });

    await test.step(`Trong web builder, đổi preview data`, async () => {
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.other_collection);
      for (const product of caseConf.products_of_other_collection) {
        await expect(
          frameLocator.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
      for (const filter of caseConf.filter_of_other_collection) {
        await expect(frameLocator.locator(getXpathFilter(filter, "left"))).toBeVisible();
      }
    });

    await test.step(`Click expand 1 filed`, async () => {
      await frameLocator.locator(xpathFilterColor).waitFor({ state: "visible" });
      await frameLocator.locator(`${xpathFilterColor}//div[contains(@class,'close')]`).click();
      await frameLocator.locator(xpathDataFilterColor).waitFor({ state: "visible" });
      await expect(
        frameLocator.locator(`(${xpathDataFilterColor}//div[contains(@class,'color__container')])[1]`),
      ).toBeVisible();
    });
  });

  test(`@SB_SC_SCWB_191 Collection detail page_Check UI filter, tag với filter position = In drawer`, async ({
    dashboard,
    conf,
  }) => {
    const caseConf = conf.caseConf;
    const suiteConf = conf.suiteConf;

    await test.step(`Chọn filter position = In drawer`, async () => {
      await wbPage.page.waitForLoadState("networkidle");
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.selectDropDown("filter_position", "In drawer");
      await clickSaveButton({ dashboard });
      await expect(wbPage.page.locator(xpathLabelPreview)).toHaveText(`Preview: ${caseConf.collection_name}`);
    });

    await test.step(`Check UI các filter`, async () => {
      await expect(frameLocator.locator(xpathButtonFilterInDrawer)).toBeVisible();
      const sizeTextProducts = await getStyle(frameLocator.locator(xpathTextProductNumber), "font-size");
      const colorTextProducts = await getStyle(frameLocator.locator(xpathTextProductNumber), "color");
      expect(sizeTextProducts).toEqual(caseConf.fontsize_14);
      expect(colorTextProducts).toEqual(caseConf.color_text_products);
    });

    await test.step(`Click button Filter`, async () => {
      await frameLocator.locator(xpathButtonFilterInDrawer).click();
      await frameLocator.locator(xpathFiltersContainer).waitFor();
      await expect(frameLocator.locator(xpathButtonClearFilter)).toBeVisible();
      await expect(frameLocator.locator(xpathButtonApplyFilter)).toBeVisible();
      await verifyTabFilterInDrawer({ frameLocator, caseConf, suiteConf });
    });

    const xpathFilterColor = getXpathFilter("color", "In drawer");
    const xpathDataFilterColor = getXpathFilter("color", "In drawer", true);
    await test.step(`Click expand 1 filed`, async () => {
      await frameLocator.locator(xpathFilterColor).waitFor({ state: "visible" });
      await frameLocator.locator(`${xpathFilterColor}//div[contains(@class,'close')]`).click();
      await frameLocator.locator(xpathDataFilterColor).waitFor({ state: "visible" });
      await verifyDropdownFilter({ frameLocator, caseConf, suiteConf }, "In drawer");
    });

    await test.step(`Chọn tag dài & tag ngắn -> Click Apply`, async () => {
      for (const color of caseConf.select_colors) {
        const xpathCheckbox = `(${xpathDataFilterColor}//div[normalize-space()='${color}']//span)[1]`;
        await frameLocator.locator(xpathCheckbox).click();
      }
      await frameLocator.locator(xpathButtonApplyFilter).click();
      await frameLocator.locator("#v-progressbar").waitFor({ state: "visible" });
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await verifyTagFilter({ frameLocator, caseConf, suiteConf });
      for (const product of caseConf.products_of_filter) {
        await expect(
          frameLocator.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
      await expect(frameLocator.locator(xpathTextProductNumber)).toContainText(
        `${caseConf.products_of_filter.length} Products`,
      );
    });
  });

  test(`@SB_SC_SCWB_192 Collection detail page_Check filter function với filter position = In drawer`, async ({
    dashboard,
    context,
    conf,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Chọn filter position = In drawer`, async () => {
      await wbPage.page.waitForLoadState("networkidle");
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.selectDropDown("filter_position", "In drawer");
      await clickSaveButton({ dashboard });
      await expect(wbPage.page.locator(xpathLabelPreview)).toHaveText(`Preview: ${caseConf.collection_name}`);
    });

    const xpathFilterColor = getXpathFilter("color", "In drawer");
    const xpathDataFilterColor = getXpathFilter("color", "In drawer", true);
    await test.step(`Click expand 1 filed`, async () => {
      await frameLocator.locator(xpathButtonFilterInDrawer).click();
      await frameLocator.locator(xpathFilterColor).waitFor({ state: "visible" });
      await frameLocator.locator(`${xpathFilterColor}//div[contains(@class,'close')]`).click();
      await frameLocator.locator(xpathDataFilterColor).waitFor({ state: "visible" });
      await expect(
        frameLocator.locator(`(${xpathDataFilterColor}//div[contains(@class,'base-checkbox')])[1]`),
      ).toBeVisible();
    });

    const sfTab = await context.newPage();
    await test.step(`Chọn tag dài & tag ngắn, nhấn apply`, async () => {
      for (const color of caseConf.select_colors) {
        const xpathCheckbox = `(${xpathDataFilterColor}//div[normalize-space()='${color}']//span)[1]`;
        await frameLocator.locator(xpathCheckbox).click();
      }
      await frameLocator.locator(xpathButtonApplyFilter).click();
      await frameLocator.locator("#v-progressbar").waitFor({ state: "visible" });
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      for (const product of caseConf.products_of_filter) {
        await expect(
          frameLocator.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
      await expect(frameLocator.locator(xpathTextProductNumber)).toContainText(
        `${caseConf.products_of_filter.length} Products`,
      );

      await sfTab.goto(`https://${conf.suiteConf.domain}/collections/${caseConf.collection_handle}`);
      await sfTab.waitForLoadState("networkidle");
      await sfTab.locator(xpathButtonFilterInDrawer).click();
      await sfTab.locator(`${xpathFilterColor}//div[contains(@class,'close')]`).click();
      for (const color of caseConf.select_colors) {
        const xpathCheckbox = `(${xpathDataFilterColor}//div[normalize-space()='${color}']//span)[1]`;
        await sfTab.locator(xpathCheckbox).click();
      }
      await sfTab.locator(xpathButtonApplyFilter).click();
      await sfTab.locator("#v-progressbar").waitFor({ state: "visible" });
      await sfTab.locator("#v-progressbar").waitFor({ state: "detached" });
      for (const product of caseConf.products_of_filter) {
        await expect(
          sfTab.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
      await expect(sfTab.locator(xpathTextProductNumber)).toContainText(
        `${caseConf.products_of_filter.length} Products`,
      );
    });

    await test.step(`Untick 1 option`, async () => {
      await sfTab.locator(xpathButtonFilterInDrawer).click();
      const xpathCheckboxBlack = `(${xpathDataFilterColor}//div[normalize-space()='${caseConf.select_colors[1]}']//span)[1]`;
      await sfTab.locator(xpathCheckboxBlack).click();
      await expect(
        sfTab.locator(
          `(//div[contains(@class,'filter-result')]//div[normalize-space()="color: ${caseConf.select_colors[1]}"])[1]`,
        ),
      ).toBeVisible();
      await expect(sfTab.locator(xpathTextProductNumber)).toContainText(
        `${caseConf.products_of_filter.length} Products`,
      );
    });

    await test.step(`Click Apply`, async () => {
      await sfTab.locator(xpathButtonApplyFilter).click();
      await sfTab.locator("#v-progressbar").waitFor({ state: "visible" });
      await sfTab.locator("#v-progressbar").waitFor({ state: "detached" });
      await expect(
        sfTab.locator(
          `(//div[contains(@class,'filter-result')]//div[normalize-space()="color: ${caseConf.select_colors[1]}"])[1]`,
        ),
      ).toBeHidden();
      for (const product of caseConf.products_of_black) {
        await expect(
          sfTab.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeHidden();
      }
    });

    await test.step(`Reload page`, async () => {
      await sfTab.reload();
      await sfTab.locator("#v-progressbar").waitFor({ state: "visible" });
      await sfTab.locator("#v-progressbar").waitFor({ state: "detached" });
      await expect(
        sfTab.locator(
          `(//div[contains(@class,'filter-result')]//div[normalize-space()="color: ${caseConf.select_colors[1]}"])[1]`,
        ),
      ).toBeHidden();
      for (const product of caseConf.products_of_black) {
        await expect(
          sfTab.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeHidden();
      }
    });

    await test.step(`Click clear all`, async () => {
      await sfTab.locator(xpathClearAll).click();
      await sfTab.locator("#v-progressbar").waitFor({ state: "visible" });
      await sfTab.locator("#v-progressbar").waitFor({ state: "detached" });
      await expect(sfTab.locator(xpathTagContainer)).toBeHidden();
    });

    await test.step(`Trong web builder, đổi preview data`, async () => {
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.other_collection);
      for (const product of caseConf.products_of_other_collection) {
        await expect(
          frameLocator.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
      await frameLocator.locator(xpathButtonFilterInDrawer).click();
      for (const filter of caseConf.filter_of_other_collection) {
        await expect(frameLocator.locator(getXpathFilter(filter, "In drawer"))).toBeVisible();
      }
    });

    await test.step(`Click expand 1 filed`, async () => {
      await frameLocator.locator(xpathFilterColor).waitFor({ state: "visible" });
      await frameLocator.locator(`${xpathFilterColor}//div[contains(@class,'close')]`).click();
      await frameLocator.locator(xpathDataFilterColor).waitFor({ state: "visible" });
      await expect(
        frameLocator.locator(`(${xpathDataFilterColor}//div[contains(@class,'color__container')])[1]`),
      ).toBeVisible();
    });

    await test.step(`Click tắt filter tab http://joxi.ru/EA4Ebz0t0Ne9qr`, async () => {
      await frameLocator.locator(xpathCloseFilter).click();
      await expect(frameLocator.locator(xpathFiltersContainer)).toBeHidden();
    });
  });

  test(`@SB_SC_SCWB_193 Collection detail page_Check trường Show sorting`, async ({ dashboard, context, conf }) => {
    const caseConf = conf.caseConf;

    await test.step(`On toggle Show sorting`, async () => {
      await wbPage.page.waitForLoadState("networkidle");
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
      await expect(frameLocator.locator(xpathSelectSorting)).toBeVisible();
      await expect(frameLocator.locator(xpathSortSelected)).toContainText(caseConf.first_sorting_of_collection);
    });

    const xpathFilterColor = getXpathFilter("color", "In drawer");
    const xpathDataFilterColor = getXpathFilter("color", "In drawer", true);
    await test.step(`Chọn filter cho các product `, async () => {
      await webBuilder.selectDropDown("filter_position", "In drawer");
      await clickSaveButton({ dashboard });
      await frameLocator.locator(xpathButtonFilterInDrawer).click();
      await frameLocator.locator(xpathFilterColor).waitFor({ state: "visible" });
      await frameLocator.locator(`${xpathFilterColor}//div[contains(@class,'close')]`).click();
      for (const color of caseConf.select_colors) {
        const xpathCheckbox = `(${xpathDataFilterColor}//div[normalize-space()='${color}']//span)[1]`;
        await frameLocator.locator(xpathCheckbox).click();
      }
      await frameLocator.locator(xpathButtonApplyFilter).click();
      await frameLocator.locator("#v-progressbar").waitFor({ state: "visible" });
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await expect(frameLocator.locator(`${xpathFirstProductInList}//a`)).toContainText(
        caseConf.first_product_of_filter,
      );
    });

    await test.step(`Click dropdown sorting`, async () => {
      const sortOptions = await frameLocator.locator(`${xpathSelectSorting}//option`).count();
      expect(sortOptions).toEqual(caseConf.total_sort_options);
    });

    await test.step(`Chọn lần lượt các option`, async () => {
      for (const option of caseConf.sort_options) {
        await frameLocator.getByRole("combobox").selectOption(option.value);
        await frameLocator.locator("#v-progressbar").waitFor({ state: "visible" });
        await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
        await expect(frameLocator.locator(`${xpathFirstProductInList}//a`)).toContainText(option.first_product);
      }
    });

    await test.step(`Trong web builder, đổi preview data`, async () => {
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.other_collection);
      for (const product of caseConf.products_of_other_collection) {
        await expect(
          frameLocator.locator(
            `(//div[contains(@class,'product-card__name') and descendant::a[normalize-space()='${product}']])[1]`,
          ),
        ).toBeVisible();
      }
      await expect(frameLocator.locator(xpathSortSelected)).toContainText(caseConf.first_sorting_of_other_collection);
    });

    const sfTab = await context.newPage();
    await test.step(`Nhấn save, check ngoài SF`, async () => {
      await sfTab.goto(`https://${conf.suiteConf.domain}/collections/${caseConf.collection_handle}`);
      await sfTab.waitForLoadState("networkidle");
      await expect(sfTab.locator(xpathSelectSorting)).toBeVisible();
      await expect(sfTab.locator(xpathSortSelected)).toContainText(caseConf.first_sorting_of_collection);
    });

    await test.step(`Trong web builder, click off toggle Show sorting`, async () => {
      await webBuilder.switchToTab("Content");
      await wbPage.page.locator(xpathShowSortingButton).click();
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      await expect(frameLocator.locator(xpathSelectSorting)).toBeHidden();
      await clickSaveButton({ dashboard });
    });

    await test.step(`Nhấn save, check ngoài SF`, async () => {
      await sfTab.reload();
      await expect(sfTab.locator(xpathSelectSorting)).toBeHidden();

      //Sau khi check tắt show sorting thì bật lại trả về  giá trị ban đầu
      await wbPage.page.locator(xpathShowSortingButton).click();
      await clickSaveButton({ dashboard });
    });
  });

  test(`@SB_SC_SCWB_194 Collection detail page_Check trường show filter`, async ({ conf }) => {
    let isShowFilter: string;
    const caseConf = conf.caseConf;

    await test.step(`Precond - Select collection 4 va chon block Product List`, async () => {
      await wbPage.page.waitForLoadState("networkidle");
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
    });

    const buttonShowFilter = wbPage.page.locator(xpathShowFilterButton);
    await test.step(`On toggle Show filter`, async () => {
      await webBuilder.switchToTab("Content");
      isShowFilter = await wbPage.page.locator(`${xpathShowFilterButton}//input`).inputValue();
      if (isShowFilter !== "true") {
        await buttonShowFilter.click();
      }
      await webBuilder.switchToTab("Design");
      for (const position of caseConf.position_filters) {
        await webBuilder.selectDropDown("filter_position", position);
        // Wait do sau khi chọn value có chút delay rồi mới apply thành công
        await webBuilder.page.waitForTimeout(1000);
        if (position === "Left") {
          await expect(frameLocator.locator(xpathFiltersContainer)).toBeVisible();
        } else {
          await expect(frameLocator.locator(xpathFiltersContainerTop)).toBeVisible();
        }
      }
    });
    await test.step(`Off toggle Show filter`, async () => {
      await webBuilder.switchToTab("Content");
      await buttonShowFilter.click();
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      await webBuilder.switchToTab("Design");
      for (const position of caseConf.position_filters) {
        await webBuilder.selectDropDown("filter_position", position);
        // Wait do sau khi chọn value có chút delay rồi mới apply thành công
        await webBuilder.page.waitForTimeout(1000);
        if (position === "Left") {
          await expect(frameLocator.locator(xpathFiltersContainer)).toBeHidden();
        } else {
          await expect(frameLocator.locator(xpathFiltersContainerTop)).toBeHidden();
        }
      }
    });
  });

  test(`@SB_SC_SCWB_195 Collection detail page_Check apply filter khi sửa collection filter trong dashboard`, async ({
    dashboard,
    context,
    conf,
  }) => {
    test.slow();
    const page = dashboard;
    const caseConf = conf.caseConf;

    await test.step(`Click edit collection filter here`, async () => {
      await page.getByRole("link", { name: "Online Store", exact: true }).click();
      await page.goto(`https://${conf.suiteConf.domain}/admin/menus`);
      await page.waitForLoadState("networkidle");
      expect(await page.locator(xpathFilterInDashboard).count()).toEqual(caseConf.number_filters);
    });

    await test.step(`Untick 1 filter option, nhấn save`, async () => {
      const xpathDeleteFilter = `//div[contains(@class,'navigation__collection-filter--item') and normalize-space()='${caseConf.delete_filter}']//button`;
      await page.locator(xpathDeleteFilter).waitFor();
      await page.locator(xpathDeleteFilter).click();
      await expect(page.locator("div.s-toast")).toContainText("Successfully saved filter");
      isDeletedFilterColor = true;
    });

    const dashboardTab = await context.newPage();
    await test.step(`Vào web builder > collection detail 1`, async () => {
      await page.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${conf.suiteConf.theme_id}?page=${conf.suiteConf.page}`,
      );
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await page.waitForLoadState("domcontentloaded");
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
      await checkFilterContainerVisible({ webBuilder, frameLocator, caseConf }, "color");

      await addFilterColor(dashboardTab, conf.suiteConf.domain);
      isDeletedFilterColor = false;
    });

    await test.step(`Dashboard > products > product D: edit product D`, async () => {
      await dashboardTab.goto(`https://${conf.suiteConf.domain}/admin/products`);
      await dashboardTab.waitForLoadState("networkidle");
      await selectProductInList(dashboardTab, caseConf.product_step_4);
      await dashboardTab.locator(xpathInputVendor).click();
      await dashboardTab.waitForTimeout(1 * 1000);
      await dashboardTab.locator(xpathInputVendor).fill("");
      await dashboardTab.getByRole("button", { name: "Save changes" }).click();
      await expect(dashboardTab.locator("div.s-toast")).toContainText("Product was successfully saved!");
      isDeletedVendor = true;
    });

    await test.step(`Vào web builder > collection detail 1`, async () => {
      await page.reload();
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await page.waitForLoadState("networkidle");
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
      await checkFilterContainerVisible({ webBuilder, frameLocator, caseConf }, "Brand");
    });

    await test.step(`Dashboard > products > product D: edit product D thêm lại vendor sau khi xóa`, async () => {
      await addVendorToProduct(dashboardTab, caseConf.vendor);
      isDeletedVendor = false;
    });

    await test.step(`Dashboard > products > product A: make unavailable`, async () => {
      await dashboardTab.goto(`https://${conf.suiteConf.domain}/admin/products`);
      await dashboardTab.waitForLoadState("networkidle");
      await selectProductInList(dashboardTab, caseConf.product_step_6);
      await dashboardTab.locator(xpathHideProduct).waitFor();
      await dashboardTab.locator(xpathHideProduct).click();
      await dashboardTab.getByRole("button", { name: "Save changes" }).click();
      await expect(dashboardTab.locator("div.s-toast")).toContainText("Product was successfully saved!");
      isHidedProduct = true;
    });

    await test.step(`Vào web builder > collection detail 1`, async () => {
      await page.reload();
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await page.waitForLoadState("networkidle");
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
      await checkFilterContainerVisible({ webBuilder, frameLocator, caseConf }, "size");
    });

    await test.step(`Dashboard > products > product A: make available`, async () => {
      await dashboardTab.locator(xpathShowProduct).waitFor();
      await dashboardTab.locator(xpathShowProduct).click();
      await dashboardTab.getByRole("button", { name: "Save changes" }).click();
      await expect(dashboardTab.locator("div.s-toast")).toContainText("Product was successfully saved!");
      isHidedProduct = false;
    });

    await test.step(`Dashboard > collection > collection 1: xóa product D có type = physical khỏi collection 1`, async () => {
      await dashboardTab.goto(`https://${conf.suiteConf.domain}/admin/products`);
      await dashboardTab.waitForLoadState("networkidle");
      await selectProductInList(dashboardTab, caseConf.product_step_8);
      await dashboardTab
        .locator(`//span[contains(@class,'tag-list-item') and normalize-space()='${caseConf.collection_name}']//a`)
        .click();
      await dashboardTab.getByRole("button", { name: "Save changes" }).click();
      await expect(dashboardTab.locator("div.s-toast")).toContainText("Product was successfully saved!");
      isRemovedProduct = true;
    });

    await test.step(`Vào web builder > collection detail 1`, async () => {
      await page.reload();
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await page.waitForLoadState("networkidle");
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchToTab("Design");
      await checkFilterContainerVisible({ webBuilder, frameLocator, caseConf }, "Type");
    });

    await test.step(`Dashboard > collection > collection 1: thêm lại product D có type = physical vào collection 1`, async () => {
      await addProductToCollection(dashboardTab, caseConf.collection_name);
      isRemovedProduct = false;
    });
  });

  test(`@SB_SC_SCWB_197 Collection detail page_Check block Product list trên mobile`, async ({
    dashboard,
    conf,
    pageMobile,
    snapshotFixture,
  }) => {
    test.slow();
    const page = dashboard;
    const caseConf = conf.caseConf;
    const blockProductList = frameLocator.locator(xpathBlockProductList);

    await test.step(`Trong web builder, switch device desktop sang mobile, set size card = small`, async () => {
      await selectCollectionPreview(wbPage.page, frameLocator, caseConf.collection_name);
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).waitFor({ state: "visible" });
      await frameLocator.locator(wbPage.xpathCD.iframeWB.blockComponent).click();
      await webBuilder.switchMobileBtn.click();
      await webBuilder.switchToTab("Design");
      await selectSizeCard(page, "Small");
      await clickSaveButton({ dashboard });
      await webBuilder.page.waitForTimeout(7000);

      expect(await blockProductList.getAttribute("style")).toContain("width: 100%");
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: xpathBlockProductListOnWB,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-197-1-product-list-WB-small.png`,
      });
    });

    await test.step(`View SF trên mobile`, async () => {
      await pageMobile.goto(`https://${conf.suiteConf.domain}/collections/${caseConf.collection_handle}`);
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(7000);
      await webBuilder.page.waitForLoadState("domcontentloaded");
      await expect(pageMobile.locator(xpathBlockProductListOnWB)).toBeVisible();
      await snapshotFixture.verify({
        page: pageMobile,
        selector: xpathBlockProductListOnWB,
        snapshotName: `${process.env.ENV}-197-1-product-list-SF-small.png`,
      });
    });

    await test.step(`Trong web builder, Set size card = large`, async () => {
      await selectSizeCard(page, "Large");
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(7000);
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: xpathBlockProductListOnWB,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-197-2-product-list-WB-large.png`,
      });
      await clickSaveButton({ dashboard });
    });

    await test.step(`View SF trên mobile`, async () => {
      await pageMobile.reload();
      await pageMobile.waitForLoadState("domcontentloaded");
      await webBuilder.page.waitForTimeout(7000);

      await snapshotFixture.verify({
        page: pageMobile,
        selector: xpathBlockProductListOnWB,
        snapshotName: `${process.env.ENV}-197-2-product-list-SF-large.png`,
      });
    });

    await test.step(`Set position block product list = Top/Left/Indrawer`, async () => {
      for (const position of caseConf.position_filters) {
        await webBuilder.selectDropDown("filter_position", position);
        // Wait do sau khi chọn value có chút delay rồi mới apply thành công
        await webBuilder.page.waitForTimeout(300);
        await expect(frameLocator.locator(xpathButtonFilterInDrawer)).toBeVisible();
      }

      await selectSizeCard(page, "Small");
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(300);
      await clickSaveButton({ dashboard });
    });
  });
});
