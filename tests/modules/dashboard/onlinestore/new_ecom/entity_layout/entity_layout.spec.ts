import { expect, test } from "@fixtures/website_builder";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";
import {
  Dev,
  SbNewecomNEP,
  SbNewecomNEP18,
  SbNewecomNEP19,
  SbNewecomNEP20,
  SbNewecomNEP21,
  SbNewecomNEP24,
  SbNewecomNEP3,
  SbNewecomNEP6,
  SbNewecomNEP7,
} from "./entity_layout";
import { CollectionPage } from "@pages/dashboard/collections";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir, verifyRedirectUrl } from "@core/utils/theme";
import { XpathNavigationButtons } from "@constants/web_builder";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { TemplateStorePage } from "@pages/storefront/template_store";
import { OnlineStorePage } from "@pages/dashboard/online_store";
import { EntityLayout } from "@pages/dashboard/entity_layout";

test.describe("Verify entity layout", async () => {
  let product: ProductPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ conf, page }) => {
    dashboardPage = new DashboardPage(page, conf.suiteConf.domain);
    product = new ProductPage(page, conf.suiteConf.domain);
  });

  test(`@SB_NEWECOM_NEP_3 Products_Kiểm tra hiển thị ui custom layout ở trang Edit product với các shop ecom thuộc user nằm trong fsw "web_builder_entity_layout"`, async ({
    cConf,
    conf,
    token,
    page,
  }) => {
    const caseConf = cConf as SbNewecomNEP3;
    const suiteConf = conf.suiteConf as Dev;
    const onlineStore = new OnlineStorePage(page, suiteConf.domain);
    const collection = new CollectionPage(page, suiteConf.domain);

    for (const shopData of suiteConf.shop_data) {
      dashboardPage = new DashboardPage(page, shopData.domain);
      const accessToken = (
        await token.getWithCredentials({
          domain: shopData.shop_name,
          username: suiteConf.username,
          password: suiteConf.password,
        })
      ).access_token;
      await dashboardPage.loginWithToken(accessToken);

      if (shopData.platform === "shopbase") {
        await test.step(`Navigation đến All product, click btn Add product`, async () => {
          await product.navigateToMenu("Products");
          await product.clickOnBtnWithLabel("Add product");
          await expect(product.genLoc(product.getXpathBlockWithTitle("Online store"))).toBeHidden();

          for (let i = 0; i < caseConf.blocks.length; i++) {
            await expect(product.genLoc(product.getXpathBlockWithTitle(caseConf.blocks[i]))).toBeVisible();
          }
        });
      }

      await test.step(`Mở detail một product`, async () => {
        switch (shopData.platform) {
          case "printbase":
            await product.navigateToMenu("Campaigns");
            await product.waitForElementVisibleThenInvisible(product.xpathTableLoad);
            await product.searchCampaign(caseConf.product_name);
            break;
          case "plusbase":
            await product.navigateToSubMenu("Dropship products", "All products");
            await product.waitForElementVisibleThenInvisible(product.xpathTableLoad);
            await product.searchProduct(caseConf.product_name);
            break;
          default:
            await product.navigateToMenu("Products");
            await product.waitForElementVisibleThenInvisible(product.xpathTableLoad);
            await product.searchProduct(caseConf.product_name);
        }
        await product.page.waitForSelector(product.xpathProduct.product.productTitle(caseConf.product_name));
        await product.genLoc(product.xpathProduct.product.productTitle(caseConf.product_name)).click();
        await product.waitForElementVisibleThenInvisible(product.xpathProductDetailLoading);
        const productTabs = await product.getProductTab();
        expect(productTabs.length).toEqual(caseConf.tabs.length);

        for (let i = 0; i < productTabs.length; i++) {
          expect(productTabs[i]).toEqual(caseConf.tabs[i]);
        }

        await expect(product.genLoc(product.getXpathBlockWithTitle("Online store"))).toBeHidden();
      });

      await test.step(`Click vào tab Design`, async () => {
        await product.genLoc(product.xpathDesignTab).click();
        const description = await product.page.innerText(product.xpathDesDesignTab);
        expect(description).toEqual(
          "Your product will automatically use the current website template's default layout. However, you can easily create a custom layout for each product to make it stand out!. Learn more.",
        );

        await expect(product.genLoc(product.getXpathBlockLayout("Default layout"))).toBeVisible();
        await expect(product.genLoc(product.xpathBtnWithLabel("Create a custom layout"))).toBeVisible();
        await expect(product.genLoc(product.getXpathStatusLayout("Default layout"))).toBeVisible();

        const imageLayoutDefault = await product.getImageBlockLayout("Default layout");
        await product.navigateToMenu("Online Store");
        const imageCurrentTheme = await onlineStore.getImageCurrentThemeDesktop();
        expect(imageLayoutDefault).toEqual(imageCurrentTheme);
      });

      await test.step(`Mở detail 1 collection `, async () => {
        await collection.gotoCollectionDetail(caseConf.collection_name, shopData.platform);
        await expect(product.genLoc(product.getXpathBlockWithTitle("Add collection to navigation"))).toBeHidden();
        await expect(product.genLoc(product.getXpathBlockWithTitle("Online store"))).toBeHidden();
      });
    }
  });
});

test.describe("Verify edit entity layout", async () => {
  test.slow();
  let product: ProductPage;
  let otherPage: OtherPage;
  let dashboardPage: DashboardPage;
  let blockPage: Blocks;
  let webBuilder: WebBuilder;
  let sectionSelector: string;
  let themes: ThemeEcom;
  let templateStore: TemplateStorePage;
  let entityLayout: EntityLayout;
  let templateId: number;
  let firstProduct: string;
  let section, sectionSetting, suiteConf, storefront;

  test.beforeEach(async ({ conf, dashboard, theme }, testInfo) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    product = new ProductPage(dashboard, conf.suiteConf.domain);
    blockPage = new Blocks(dashboard, conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    entityLayout = new EntityLayout(dashboard, conf.suiteConf.domain);

    suiteConf = conf.suiteConf;
    themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    await test.step(`Tại trang product detail, chọn tab Design và hover vào block Default layout`, async () => {
      await dashboardPage.navigateToMenu("Online Store");
      templateStore = new TemplateStorePage(dashboard);
      await themes.clickBtnByName("Browse templates");
      if (process.env.ENV === "prodtest") {
        await templateStore
          .genLoc(templateStore.xpath.buttons.applyTemplate(conf.suiteConf.hover))
          .scrollIntoViewIfNeeded();
        await templateStore.genLoc(templateStore.xpath.buttons.applyTemplate(conf.suiteConf.hover)).first().click();
      } else {
        await templateStore.searchTemplateNewUI(conf.suiteConf.hover, "wrapper");
        await templateStore.applyTemplate(conf.suiteConf.hover);
      }
      await templateStore.waitForToastMessageHide("Apply template successfully");
      const response = await theme.list();
      templateId = response[response.length - 1].id;
      await themes.publishTheme(conf.suiteConf.hover, templateId);
      const shopThemeId = response.find(shopTheme => shopTheme.active !== true);
      if (shopThemeId) {
        await theme.delete(shopThemeId.id);
      }
      await dashboardPage.navigateToMenu("Products");
      await product.makeAvailableOrUnavailableProduct("Make products available");
    });
  });

  test(`@SB_NEWECOM_NEP_4 Products_Kiểm tra edit layout default từ trang Edit product`, async ({
    dashboard,
    cConf,
    context,
    conf,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomNEP;
    otherPage = new OtherPage(dashboard, suiteConf.domain);
    await test.step(`Tại trang product detail, chọn tab Design và hover vào block Default layout`, async () => {
      await product.openDetailProduct(suiteConf.platform, caseConf.product_name);
      await product.genLoc(product.xpathDesignTab).click();
      await product.page.waitForLoadState("domcontentloaded");
      await product.page.hover(product.getXpathBlockLayout("Default layout"));
      await expect(product.genLoc(product.xpathBtnWithLabel("Customize"))).toBeVisible();
    });

    await test.step(`Click action Customize `, async () => {
      await product.clickOnBtnWithLabel("Customize");
      await product.genLoc(blockPage.overlay).waitFor({ state: "hidden" });
      await dashboard.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");

      await expect(product.genLoc(otherPage.pagePanelSelector)).toBeVisible();
      await expect(product.genLoc(product.xpathBtnWithLabel("Templates"))).toBeVisible();
      await expect(
        product.genLoc("//div[contains(@class,'sb-popover')]//p[@class='sb-selection-group-item']"),
      ).toContainText(caseConf.product_name);

      await expect(
        webBuilder.frameLocator.locator("//div[contains(@class,'block-heading')]//span[@value='product.title']"),
      ).toContainText(caseConf.product_name);
      const currentURL = webBuilder.page.url();

      expect(currentURL).toContain(`https://${suiteConf.domain}/admin/builder/site/${templateId}?page=product`);
    });

    await test.step(`Thực hiện edit layout default theo input data`, async () => {
      const blockSetting = caseConf.blockSetting;
      await webBuilder.frameLocator
        .locator("//div[contains(@class,'block-heading')]//span[@value='product.title']")
        .click();
      await webBuilder.setBorder("border", blockSetting.border);
      await webBuilder.setBackground("background", blockSetting.background);
      await webBuilder.editSliderBar("opacity", blockSetting.opacity);
      await webBuilder.setMarginPadding("padding", blockSetting.padding);

      await expect(product.genLoc(product.xpathBtnWithLabel("Save"))).toBeEnabled();
      // đợi một khoảng thời gian để block update đúng style đã setting
      await webBuilder.page.waitForTimeout(2000);

      const wbBlock = webBuilder.frameLocator.locator(entityLayout.xpathHeadingTitle);
      const cssValue = await entityLayout.getCSSValue(wbBlock);
      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: caseConf.expect.background_color,
          opacity: caseConf.expect.opacity,
          boderBottomColor: caseConf.expect.border.boder_bottom_color,
          boderBottomStyle: caseConf.expect.border.boder_bottom_style,
          boderBottomWidth: caseConf.expect.border.boder_bottom_width,
          boderTopColor: caseConf.expect.border.boder_top_color,
          boderTopStyle: caseConf.expect.border.boder_top_style,
          boderTopWidth: caseConf.expect.border.boder_top_width,
          boderLeftColor: caseConf.expect.border.boder_left_color,
          boderLeftStyle: caseConf.expect.border.boder_left_style,
          boderLeftWidth: caseConf.expect.border.boder_left_width,
          boderRightColor: caseConf.expect.border.boder_right_color,
          boderRightStyle: caseConf.expect.border.boder_right_style,
          boderRightWidth: caseConf.expect.border.boder_right_width,
          paddingTop: caseConf.expect.padding.padding_top,
          paddingBottom: caseConf.expect.padding.padding_bottom,
          paddingLeft: caseConf.expect.padding.padding_left,
          paddingRight: caseConf.expect.padding.padding_right,
        }),
      );
    });

    await test.step(`Save và click vào icon Preview on new tab`, async () => {
      await webBuilder.clickBtnNavigationBar("save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");

      storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.waitForLoadState("load");
      await storefront.waitForTimeout(5 * 1000);
      entityLayout = new EntityLayout(storefront, conf.suiteConf.domain);
      const previewSF = storefront.locator(entityLayout.xpathHeadingTitle);
      const cssValue = await entityLayout.getCSSValue(previewSF);
      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: caseConf.expect.background_color,
          opacity: caseConf.expect.opacity,
          boderBottomColor: caseConf.expect.border.boder_bottom_color,
          boderBottomStyle: caseConf.expect.border.boder_bottom_style,
          boderBottomWidth: caseConf.expect.border.boder_bottom_width,
          boderTopColor: caseConf.expect.border.boder_top_color,
          boderTopStyle: caseConf.expect.border.boder_top_style,
          boderTopWidth: caseConf.expect.border.boder_top_width,
          boderLeftColor: caseConf.expect.border.boder_left_color,
          boderLeftStyle: caseConf.expect.border.boder_left_style,
          boderLeftWidth: caseConf.expect.border.boder_left_width,
          boderRightColor: caseConf.expect.border.boder_right_color,
          boderRightStyle: caseConf.expect.border.boder_right_style,
          boderRightWidth: caseConf.expect.border.boder_right_width,
          paddingTop: caseConf.expect.padding.padding_top,
          paddingBottom: caseConf.expect.padding.padding_bottom,
          paddingLeft: caseConf.expect.padding.padding_left,
          paddingRight: caseConf.expect.padding.padding_right,
        }),
      );
    });

    await test.step(`Đi đến trang detail của product đó trên SF`, async () => {
      await storefront.goto(`https://${suiteConf.domain}/products/${caseConf.handle_product}`);
      await storefront.waitForLoadState("load");
      await storefront.waitForTimeout(5 * 1000);
      const sfLoc = storefront.locator(entityLayout.xpathHeadingTitle);
      const cssValue = await entityLayout.getCSSValue(sfLoc);
      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: caseConf.expect.background_color,
          opacity: caseConf.expect.opacity,
          boderBottomColor: caseConf.expect.border.boder_bottom_color,
          boderBottomStyle: caseConf.expect.border.boder_bottom_style,
          boderBottomWidth: caseConf.expect.border.boder_bottom_width,
          boderTopColor: caseConf.expect.border.boder_top_color,
          boderTopStyle: caseConf.expect.border.boder_top_style,
          boderTopWidth: caseConf.expect.border.boder_top_width,
          boderLeftColor: caseConf.expect.border.boder_left_color,
          boderLeftStyle: caseConf.expect.border.boder_left_style,
          boderLeftWidth: caseConf.expect.border.boder_left_width,
          boderRightColor: caseConf.expect.border.boder_right_color,
          boderRightStyle: caseConf.expect.border.boder_right_style,
          boderRightWidth: caseConf.expect.border.boder_right_width,
          paddingTop: caseConf.expect.padding.padding_top,
          paddingBottom: caseConf.expect.padding.padding_bottom,
          paddingLeft: caseConf.expect.padding.padding_left,
          paddingRight: caseConf.expect.padding.padding_right,
        }),
      );
    });

    await test.step(`Trên SF, mở detail một product khác cũng đang sử dụng layout default`, async () => {
      await storefront.goto(`https://${suiteConf.domain}/products/${caseConf.other_product.handle}`);
      await storefront.waitForLoadState("load");
      await storefront.waitForTimeout(5 * 1000);
      const sfLoc = storefront.locator(entityLayout.xpathHeadingTitle);
      const cssValue = await entityLayout.getCSSValue(sfLoc);

      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: caseConf.expect.background_color,
          opacity: caseConf.expect.opacity,
          boderBottomColor: caseConf.expect.border.boder_bottom_color,
          boderBottomStyle: caseConf.expect.border.boder_bottom_style,
          boderBottomWidth: caseConf.expect.border.boder_bottom_width,
          boderTopColor: caseConf.expect.border.boder_top_color,
          boderTopStyle: caseConf.expect.border.boder_top_style,
          boderTopWidth: caseConf.expect.border.boder_top_width,
          boderLeftColor: caseConf.expect.border.boder_left_color,
          boderLeftStyle: caseConf.expect.border.boder_left_style,
          boderLeftWidth: caseConf.expect.border.boder_left_width,
          boderRightColor: caseConf.expect.border.boder_right_color,
          boderRightStyle: caseConf.expect.border.boder_right_style,
          boderRightWidth: caseConf.expect.border.boder_right_width,
          paddingTop: caseConf.expect.padding.padding_top,
          paddingBottom: caseConf.expect.padding.padding_bottom,
          paddingLeft: caseConf.expect.padding.padding_left,
          paddingRight: caseConf.expect.padding.padding_right,
        }),
      );
    });
  });

  test(`@SB_NEWECOM_NEP_5 Products_Kiểm tra edit layout default từ trang customize theme trong web builder`, async ({
    dashboard,
    cConf,
    context,
    conf,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomNEP;
    await test.step(`Open page Product detail trong web builder`, async () => {
      const firstProduct = await product.getFirstProductAvailable();
      await webBuilder.openWebBuilder({ type: "site", id: templateId, page: "product" });
      await product.genLoc(blockPage.overlay).waitFor({ state: "hidden" });
      await dashboard.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");

      await expect(
        webBuilder.genLoc("//div[contains(@class,'sb-popover')]//p[@class='sb-selection-group-item']"),
      ).toContainText(firstProduct);
    });

    await test.step(`Thực hiện edit layout default theo input data`, async () => {
      const blockSetting = caseConf.blockSetting;
      await webBuilder.frameLocator
        .locator("//div[contains(@class,'block-heading')]//span[@value='product.title']")
        .click();
      await webBuilder.setBorder("border", blockSetting.border);
      await webBuilder.setBackground("background", blockSetting.background);
      await webBuilder.editSliderBar("opacity", blockSetting.opacity);
      await webBuilder.setMarginPadding("padding", blockSetting.padding);

      await expect(product.genLoc(product.xpathBtnWithLabel("Save"))).toBeEnabled();
      // đợi một khoảng thời gian để block update đúng style đã setting
      await webBuilder.page.waitForTimeout(2000);
      const wbBlock = webBuilder.frameLocator.locator(entityLayout.xpathHeadingTitle);
      const cssValue = await entityLayout.getCSSValue(wbBlock);

      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: caseConf.expect.background_color,
          opacity: caseConf.expect.opacity,
          boderBottomColor: caseConf.expect.border.boder_bottom_color,
          boderBottomStyle: caseConf.expect.border.boder_bottom_style,
          boderBottomWidth: caseConf.expect.border.boder_bottom_width,
          boderTopColor: caseConf.expect.border.boder_top_color,
          boderTopStyle: caseConf.expect.border.boder_top_style,
          boderTopWidth: caseConf.expect.border.boder_top_width,
          boderLeftColor: caseConf.expect.border.boder_left_color,
          boderLeftStyle: caseConf.expect.border.boder_left_style,
          boderLeftWidth: caseConf.expect.border.boder_left_width,
          boderRightColor: caseConf.expect.border.boder_right_color,
          boderRightStyle: caseConf.expect.border.boder_right_style,
          boderRightWidth: caseConf.expect.border.boder_right_width,
          paddingTop: caseConf.expect.padding.padding_top,
          paddingBottom: caseConf.expect.padding.padding_bottom,
          paddingLeft: caseConf.expect.padding.padding_left,
          paddingRight: caseConf.expect.padding.padding_right,
        }),
      );
    });

    await test.step(`Click button Save sau đó click vào icon Preview on new tab`, async () => {
      await webBuilder.clickBtnNavigationBar("save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });
      const SFUrl = storefront.url();
      await storefront.goto(`${SFUrl}`);
      await storefront.waitForLoadState("load");
      await storefront.waitForTimeout(5 * 1000);
      entityLayout = new EntityLayout(storefront, conf.suiteConf.domain);
      const previewSF = storefront.locator(entityLayout.xpathHeadingTitle);

      const cssValue = await entityLayout.getCSSValue(previewSF);
      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: caseConf.expect.background_color,
          opacity: caseConf.expect.opacity,
          boderBottomColor: caseConf.expect.border.boder_bottom_color,
          boderBottomStyle: caseConf.expect.border.boder_bottom_style,
          boderBottomWidth: caseConf.expect.border.boder_bottom_width,
          boderTopColor: caseConf.expect.border.boder_top_color,
          boderTopStyle: caseConf.expect.border.boder_top_style,
          boderTopWidth: caseConf.expect.border.boder_top_width,
          boderLeftColor: caseConf.expect.border.boder_left_color,
          boderLeftStyle: caseConf.expect.border.boder_left_style,
          boderLeftWidth: caseConf.expect.border.boder_left_width,
          boderRightColor: caseConf.expect.border.boder_right_color,
          boderRightStyle: caseConf.expect.border.boder_right_style,
          boderRightWidth: caseConf.expect.border.boder_right_width,
          paddingTop: caseConf.expect.padding.padding_top,
          paddingBottom: caseConf.expect.padding.padding_bottom,
          paddingLeft: caseConf.expect.padding.padding_left,
          paddingRight: caseConf.expect.padding.padding_right,
        }),
      );
    });

    await test.step(`Đi đến trang detail của một product bất kì đang sử dụng layout default trên SF shop`, async () => {
      await storefront.goto(`https://${suiteConf.domain}/products/${caseConf.handle_product}`);
      await storefront.waitForLoadState("load");
      await storefront.waitForTimeout(5 * 1000);
      const sfLoc = storefront.locator(entityLayout.xpathHeadingTitle);
      const cssValue = await entityLayout.getCSSValue(sfLoc);

      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: caseConf.expect.background_color,
          opacity: caseConf.expect.opacity,
          boderBottomColor: caseConf.expect.border.boder_bottom_color,
          boderBottomStyle: caseConf.expect.border.boder_bottom_style,
          boderBottomWidth: caseConf.expect.border.boder_bottom_width,
          boderTopColor: caseConf.expect.border.boder_top_color,
          boderTopStyle: caseConf.expect.border.boder_top_style,
          boderTopWidth: caseConf.expect.border.boder_top_width,
          boderLeftColor: caseConf.expect.border.boder_left_color,
          boderLeftStyle: caseConf.expect.border.boder_left_style,
          boderLeftWidth: caseConf.expect.border.boder_left_width,
          boderRightColor: caseConf.expect.border.boder_right_color,
          boderRightStyle: caseConf.expect.border.boder_right_style,
          boderRightWidth: caseConf.expect.border.boder_right_width,
          paddingTop: caseConf.expect.padding.padding_top,
          paddingBottom: caseConf.expect.padding.padding_bottom,
          paddingLeft: caseConf.expect.padding.padding_left,
          paddingRight: caseConf.expect.padding.padding_right,
        }),
      );
    });
  });

  test(`@SB_NEWECOM_NEP_6 Products_Kiểm tra preview layout default với các product khác nhau của shop`, async ({
    dashboard,
    cConf,
    context,
    snapshotFixture,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomNEP6;
    await test.step(`Precondition: unpublish một số product trong shop`, async () => {
      await product.makeAvailableOrUnavailableProduct("Make products unavailable", caseConf.products_unpublish);
      await product.genLoc(product.getXpathTabProductListPage("All")).click();
    });

    await test.step(`Mở tab Design trong detail môt product > hover vào block Default layout > click action Customize `, async () => {
      await product.openDetailProduct(suiteConf.platform, caseConf.product_name);
      await product.genLoc(product.xpathDesignTab).click();
      await product.page.waitForLoadState("domcontentloaded");
      await product.page.hover(product.getXpathBlockLayout("Default layout"));
      await product.clickOnBtnWithLabel("Customize");
      await product.genLoc(blockPage.overlay).waitFor({ state: "hidden" });
      await product.genLoc("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");
      await expect(product.genLoc(product.xpathBtnWithLabel("Templates"))).toBeVisible();
      await expect(
        product.genLoc("//div[contains(@class,'sb-popover')]//p[@class='sb-selection-group-item']"),
      ).toContainText(caseConf.product_name);
      await expect(
        webBuilder.frameLocator.locator("//div[contains(@class,'block-heading')]//span[@value='product.title']"),
      ).toHaveText(caseConf.product_name);
      const currentURL = webBuilder.page.url();
      expect(currentURL).toContain(`https://${suiteConf.domain}/admin/builder/site/${templateId}?page=product`);
    });

    await test.step(`Thực hiện edit layout default theo input data`, async () => {
      await webBuilder.insertSectionBlock({
        parentPosition: suiteConf.add_section.parent_position,
        template: suiteConf.add_section.template,
      });
      section = suiteConf.add_section.parent_position.section;
      sectionSetting = caseConf.data.section;
      sectionSelector = webBuilder.getSelectorByIndex({ section });

      await webBuilder.dragAndDropInWebBuilder(sectionSetting.dnd_block);
      const blockSetting = caseConf.data.blockSetting;
      await webBuilder.switchToTab("Design");
      await webBuilder.setBackground("background", blockSetting.background);
      await webBuilder.setBorder("border", blockSetting.border);
      await webBuilder.editSliderBar("opacity", blockSetting.opacity);
      await webBuilder.editSliderBar("border_radius", blockSetting.radius);
      await webBuilder.setShadow("box_shadow", blockSetting.shadow);
      await webBuilder.setMarginPadding("padding", blockSetting.padding);

      await webBuilder.page.waitForTimeout(5 * 1000);
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: caseConf.expect.snapshot_preview_settingdata,
      });
    });

    await test.step(`1. Nhập tên product unavailable vào ô search > 2. Xóa keyword đã nhập`, async () => {
      await webBuilder.genLoc("//div[contains(@class,'sb-popover')]//p[@class='sb-selection-group-item']").click();
      await webBuilder.searchProductPreview(caseConf.product_search.product_unavailable);
      await expect(
        webBuilder.genLoc(
          `//p[normalize-space()='Could not find any results for ${caseConf.product_search.product_unavailable}']`,
        ),
      ).toBeVisible();
      await expect(webBuilder.genLoc("//p[normalize-space()='Try search for something else']")).toBeVisible();
      await webBuilder.searchProductPreview("");
      await expect(webBuilder.genLoc("(//div[contains(@class,'sb-selection-item')])[1]")).toBeVisible();
    });

    await test.step(`Nhập tên product available vào ô search`, async () => {
      await webBuilder.searchProductPreview(caseConf.product_search.product_available);
      await webBuilder.page.waitForSelector(
        `(//div[contains(@class,'sb-selection-item')])[1]//div[contains(@class,'sb-tooltip__reference')][contains(text(),'${caseConf.product_search.product_available}')]`,
      );
      const countProduct = await webBuilder.genLoc("//div[contains(@class,'sb-selection-item--css-hovered')]").count();
      expect(countProduct).toEqual(1);
      await expect(
        webBuilder.genLoc(webBuilder.getXpathEntityInList(caseConf.product_search.product_available)),
      ).toBeVisible();
    });

    await test.step(`Chọn 1 product đang hiển thị`, async () => {
      await webBuilder.genLoc(webBuilder.getXpathEntityInList(caseConf.product_selected.name)).click();
      await expect(
        product.genLoc("//div[contains(@class,'sb-popover')]//p[@class='sb-selection-group-item']"),
      ).toContainText(`${caseConf.product_selected.name}`);
      await expect(
        webBuilder.frameLocator.locator("//div[contains(@class,'block-heading')]//span[@value='product.title']"),
      ).toContainText(caseConf.product_selected.name);
    });

    await test.step(`Thực hiện Save sau đó đi đến trang product detail của product đó ở storefront shop `, async () => {
      await webBuilder.clickBtnNavigationBar("save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");

      const storefront = await context.newPage();
      await storefront.goto(`https://${suiteConf.domain}/products/${caseConf.product_selected.handle}`);
      await storefront.waitForLoadState("load");

      await storefront.waitForTimeout(10 * 1000); // đợi hiện popup để tắt popup
      const popupShow = await storefront.locator(entityLayout.popup).isVisible();
      if (popupShow) {
        await storefront.locator(entityLayout.popupClose).click();
      }

      await storefront.waitForTimeout(3 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector: sectionSelector,
        snapshotName: caseConf.expect.snapshot_storefront_settingdata,
      });
    });
  });

  test(`@SB_NEWECOM_NEP_7 Products_Kiểm tra preview layout default trong trường hợp shop không có product available`, async ({
    cConf,
    token,
    context,
  }) => {
    test.slow();
    let productPage: ProductPage;
    const caseConf = cConf as SbNewecomNEP7;

    await test.step(`Precondition: unpublish một số product của shop`, async () => {
      await product.makeAvailableOrUnavailableProduct("Make products unavailable", caseConf.products_unpublish);
      firstProduct = await product.getFirstProductAvailable();
      await product.genLoc(product.getXpathTabProductListPage("All")).click();
    });

    await test.step(`Mở tab Design trong detail môt product đang unavailable > hover vào block Default layout > click action Customize`, async () => {
      await product.openDetailProduct(suiteConf.platform, caseConf.product_name);
      await product.genLoc(product.xpathDesignTab).click();
      await product.page.waitForLoadState("domcontentloaded");
      await product.page.hover(product.getXpathBlockLayout("Default layout"));
      await product.clickOnBtnWithLabel("Customize");
      await product.genLoc(blockPage.overlay).waitFor({ state: "hidden" });
      await product.genLoc("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");
      await expect(
        webBuilder.genLoc("//div[contains(@class,'sb-popover')]//p[@class='sb-selection-group-item']"),
      ).toContainText(firstProduct);

      await expect(
        webBuilder.frameLocator.locator("//div[contains(@class,'block-heading')]//span[@value='product.title']"),
      ).toHaveText(firstProduct);
    });

    await test.step(`Tại Navigation, click text Preview Product và nhập tên một product đang unavailable`, async () => {
      await webBuilder.genLoc("//div[contains(@class,'sb-popover')]//p[@class='sb-selection-group-item']").click();
      await webBuilder.searchProductPreview(caseConf.product_name);
      await expect(
        webBuilder.genLoc(`//p[normalize-space()='Could not find any results for ${caseConf.product_name}']`),
      ).toBeVisible();
    });

    await test.step(`1.Trong dashboard thực hiện mark available cho product trên sau đó vào lại page Product detail ở web builder
  2. Tìm và chọn  product trên`, async () => {
      const page = await context.newPage();
      productPage = new ProductPage(page, suiteConf.domain);
      const accessToken = (
        await token.getWithCredentials({
          domain: suiteConf.shop_name,
          username: suiteConf.username,
          password: suiteConf.password,
        })
      ).access_token;
      await page.goto(`https://${suiteConf.domain}/admin/products?x_key=${accessToken}`);
      await productPage.makeAvailableOrUnavailableProduct("Make products available", caseConf.products_unpublish);

      await webBuilder.page.reload();
      await webBuilder.genLoc(blockPage.overlay).waitFor({ state: "hidden" });
      await webBuilder.genLoc("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.genLoc("//div[contains(@class,'sb-popover')]//p[@class='sb-selection-group-item']").click();
      await webBuilder.searchProductPreview(caseConf.products_unpublish[0]);
      await expect(webBuilder.genLoc(webBuilder.getXpathEntityInList(caseConf.products_unpublish[0]))).toBeVisible();
    });

    await test.step(`Trong dashboard, mark unavailable cho all product, sau đó vào lại page Product detail ở web builder`, async () => {
      await productPage.makeAvailableOrUnavailableProduct("Make products unavailable");
      await webBuilder.page.reload();
      await webBuilder.genLoc(blockPage.overlay).waitFor({ state: "hidden" });
      await webBuilder.genLoc("#v-progressbar").waitFor({ state: "detached" });

      await expect(
        product.genLoc("//div[contains(@class,'sb-popover')]//p[@class='sb-selection-group-item']"),
      ).toContainText("Sample product");
      await expect(
        webBuilder.frameLocator.locator("//div[contains(@class,'block-heading')]//span[@value='product.title']"),
      ).toContainText("Sample product");
    });
  });

  test(`@SB_NEWECOM_NEP_18 Products_Kiểm tra apply 1 template từ màn hình preview template khi create custom layout`, async ({
    dashboard,
    cConf,
    context,
    conf,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomNEP18;
    const productData = caseConf.custom_layout_product;
    const expected = caseConf.expect;
    const style = caseConf.blockSetting;
    sectionSelector = entityLayout.xpathHeadingTitle;

    await test.step(`Precondition: unpublish một số product của shop`, async () => {
      await product.makeAvailableOrUnavailableProduct("Make products unavailable", caseConf.products_unpublish);
    });

    for (const prodLayout of productData) {
      await test.step(`Navigation đến tab Design trong trang detail product đã tạo ở precondition > click btn Create custome layout`, async () => {
        await product.gotoProductDetail(prodLayout.product_name);
        await product.page.waitForLoadState("domcontentloaded");
        await product.genLoc(product.xpathDesignTab).click();

        // nếu product  được chọn layout rồi thì xóa custom layout
        if (await product.genLoc(entityLayout.xpathCustomLayoutLive).isVisible()) {
          await product.page.hover(product.getXpathBlockLayout("Custom layout"));
          await product.genLoc(entityLayout.xpathMoreActionCustom).click();
          await product.genLoc(entityLayout.xpathBtnDeleteLayout).click();
          await product.genLoc(entityLayout.xpathConfirmDelete).click();
        }

        await product.genLoc(entityLayout.btnCreateCustomLayout).waitFor({ state: "visible" });
        await product.genLoc(entityLayout.btnCreateCustomLayout).click();

        // check hiển thị popup select template
        await expect(product.genLoc(entityLayout.popupChooseTemplate)).toBeVisible();
      });

      await test.step(`Click icon Preview > click btn "Apply this template" `, async () => {
        await templateStore.deleteValueAndCloseSearchBox("wrapper");
        await templateStore.page.getByRole("button", { name: "Your templates" }).click();
        await templateStore
          .genLoc(templateStore.xpath.buttons.applyTemplate(caseConf.template))
          .scrollIntoViewIfNeeded();
        await templateStore.previewTemplate(caseConf.template);
        await templateStore.genLoc(templateStore.xpathBtnApplyInPreview).click();
        await templateStore.waitForToastMessageHide("Apply template successfully");
        await product.page.locator("#v-progressbar").waitFor({ state: "detached" });
        await webBuilder.page.waitForLoadState("networkidle");

        await expect(
          webBuilder.genLoc(await entityLayout.getXpathPreviewProductByName(prodLayout.expect_product_template)),
        ).toBeVisible();
        await expect(webBuilder.genLoc(entityLayout.xpathIconSelectProduct)).toBeHidden();
      });

      await test.step(`Thực hiện edit layout > click btn Save`, async () => {
        //thực hiện change layout với product title, block heading: border : S, color 1, back ground : color 3
        await webBuilder.frameLocator.locator(`//span[@value='product.title']`).click();
        await webBuilder.setBackground("background", style.background);
        await webBuilder.setBorder("border", style.border);
        await webBuilder.page.waitForTimeout(1000); // đợi gen setting preview + load 2 lần

        const wbBlock = webBuilder.frameLocator.locator(sectionSelector);
        const cssValue = await entityLayout.getCSSValue(wbBlock);

        expect(cssValue).toEqual(
          expect.objectContaining({
            backgroundColor: expected.background_color,
            boderBottomColor: expected.border.boder_bottom_color,
            boderBottomStyle: expected.border.boder_bottom_style,
            boderBottomWidth: expected.border.boder_bottom_width,
            boderTopColor: expected.border.boder_top_color,
            boderTopStyle: expected.border.boder_top_style,
            boderTopWidth: expected.border.boder_top_width,
            boderLeftColor: expected.border.boder_left_color,
            boderLeftStyle: expected.border.boder_left_style,
            boderLeftWidth: expected.border.boder_left_width,
            boderRightColor: expected.border.boder_right_color,
            boderRightStyle: expected.border.boder_right_style,
            boderRightWidth: expected.border.boder_right_width,
          }),
        );

        await webBuilder.clickOnBtnWithLabel("Save");
        await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      });

      await test.step(`Click icon Preview on new tab`, async () => {
        storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "?theme_preview_id",
          context,
        });
        await storefront.locator("#v-progressbar").waitFor({ state: "detached" });
        await storefront.waitForLoadState("networkidle");
        await storefront.locator(sectionSelector).waitFor({ state: "visible" });
        await storefront.waitForSelector(entityLayout.xpathBtnAddToCart);

        const popupsShow = await storefront.locator(entityLayout.popup).isVisible();
        if (popupsShow) {
          await storefront.locator(entityLayout.popupClose).click();
        }
        entityLayout = new EntityLayout(storefront, conf.suiteConf.domain);
        const previewSF = storefront.locator(sectionSelector);
        const cssValue = await entityLayout.getCSSValue(previewSF);

        expect(cssValue).toEqual(
          expect.objectContaining({
            backgroundColor: expected.background_color,
            boderBottomColor: expected.border.boder_bottom_color,
            boderBottomStyle: expected.border.boder_bottom_style,
            boderBottomWidth: expected.border.boder_bottom_width,
            boderTopColor: expected.border.boder_top_color,
            boderTopStyle: expected.border.boder_top_style,
            boderTopWidth: expected.border.boder_top_width,
            boderLeftColor: expected.border.boder_left_color,
            boderLeftStyle: expected.border.boder_left_style,
            boderLeftWidth: expected.border.boder_left_width,
            boderRightColor: expected.border.boder_right_color,
            boderRightStyle: expected.border.boder_right_style,
            boderRightWidth: expected.border.boder_right_width,
          }),
        );
      });

      await test.step(`Click btn Exit`, async () => {
        await webBuilder.genLoc("//button[@name='Exit']").click();
        await product.page.waitForLoadState("networkidle");
        await product.genLoc(`//h1[text()='${prodLayout.product_name}']`).waitFor({ state: "visible" });

        await expect(webBuilder.genLoc(entityLayout.xpathCustomLayoutLive)).toBeVisible();
      });

      await test.step(`Hover vào block Default layout`, async () => {
        await product.page.hover(product.getXpathBlockLayout("Default layout"));
        await expect(product.genLoc(product.xpathBtnWithLabel("Customize"))).toBeVisible();
        await expect(product.genLoc(entityLayout.xpathDefaultMoreAction)).toBeVisible();
        await product.genLoc(entityLayout.xpathDefaultMoreAction).click();
        await expect(product.genLoc(entityLayout.xpathPublishAction)).toBeVisible();
      });

      await test.step(`Hover vào block Custom layout `, async () => {
        await product.page.hover(product.getXpathBlockLayout("Custom layout"));

        await expect(product.genLoc(await entityLayout.getXpathCustomByLayout("Custom layout"))).toBeVisible();
        await expect(product.genLoc(entityLayout.xpathMoreActionCustom)).toBeVisible();

        await product.genLoc(entityLayout.xpathMoreActionCustom).click();
        await expect(product.genLoc(entityLayout.xpathBtnDeleteLayout)).toBeVisible();
      });

      await test.step(`Đi đến trang detail product available trên SF`, async () => {
        if (prodLayout.is_available) {
          const [sfProduct] = await Promise.all([
            context.waitForEvent("page"),
            await dashboard.click(entityLayout.xpathPreviewProduct),
          ]);
          await sfProduct.waitForLoadState("networkidle");
          await sfProduct.locator("#v-progressbar").waitFor({ state: "detached" });
          await sfProduct.locator(sectionSelector).waitFor({ state: "visible" });
          await sfProduct.waitForSelector(entityLayout.xpathBtnAddToCart);

          //nếu show popup thì tắt
          const popupsShow = await storefront.locator(entityLayout.popup).isVisible();
          if (popupsShow) {
            await storefront.locator(entityLayout.popupClose).click();
          }
          const sfLoc = sfProduct.locator(sectionSelector);
          const cssValue = await entityLayout.getCSSValue(sfLoc);

          expect(cssValue).toEqual(
            expect.objectContaining({
              backgroundColor: expected.background_color,
              boderBottomColor: expected.border.boder_bottom_color,
              boderBottomStyle: expected.border.boder_bottom_style,
              boderBottomWidth: expected.border.boder_bottom_width,
              boderTopColor: expected.border.boder_top_color,
              boderTopStyle: expected.border.boder_top_style,
              boderTopWidth: expected.border.boder_top_width,
              boderLeftColor: expected.border.boder_left_color,
              boderLeftStyle: expected.border.boder_left_style,
              boderLeftWidth: expected.border.boder_left_width,
              boderRightColor: expected.border.boder_right_color,
              boderRightStyle: expected.border.boder_right_style,
              boderRightWidth: expected.border.boder_right_width,
            }),
          );
        }
      });
    }
  });

  test(`@SB_NEWECOM_NEP_19 Products_Kiểm tra apply 1 template từ popup select template khi create custom layout`, async ({
    dashboard,
    cConf,
    context,
    conf,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomNEP19;
    const productName = caseConf.product_name_custom;
    const template = caseConf.template;
    const style = caseConf.blockSetting;
    const expected = caseConf.expect;
    sectionSelector = entityLayout.xpathHeadingTitle;
    let cssValueDefault;

    await test.step(`Precondition: open Product Detail page trong WB và get style layout default`, async () => {
      await webBuilder.openWebBuilder({ type: "site", id: templateId, page: "product" });
      await product.genLoc(blockPage.overlay).waitFor({ state: "hidden" });
      await dashboard.locator("#v-progressbar").waitFor({ state: "detached" });

      storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.locator("#v-progressbar").waitFor({ state: "detached" });
      await storefront.waitForLoadState("networkidle");
      await storefront.locator(sectionSelector).waitFor({ state: "visible" });
      await storefront.waitForSelector(entityLayout.xpathBtnAddToCart);

      entityLayout = new EntityLayout(storefront, conf.suiteConf.domain);
      const previewSF = storefront.locator(sectionSelector);
      cssValueDefault = await entityLayout.getCSSValue(previewSF);
      await storefront.close();
      await webBuilder.genLoc(entityLayout.xpathBtnExit).click();
      const showExit = await webBuilder.page.getByRole("button", { name: "Leave" }).isVisible();
      if (showExit) {
        await webBuilder.page.getByRole("button", { name: "Leave" }).click();
      }
    });

    await test.step(`Navigation đến tab Design trong trang detail product đã tạo ở precondition > click btn Create custome layout và apply 1 template`, async () => {
      await product.gotoProductDetail(productName);
      await product.page.waitForLoadState("domcontentloaded");
      await product.genLoc(product.xpathDesignTab).click();
      const isCustomLayoutLiveVisible = await product.genLoc(entityLayout.xpathCustomLayoutLive).isVisible();

      //nếu product  được chọn layout rồi thì xóa custom layout
      if (isCustomLayoutLiveVisible) {
        await product.page.hover(product.getXpathBlockLayout("Custom layout"));
        await product.genLoc(entityLayout.xpathMoreActionCustom).click();
        await product.genLoc(entityLayout.xpathBtnDeleteLayout).click();
        await product.genLoc(entityLayout.xpathConfirmDelete).click();
      }

      await product.genLoc(entityLayout.btnCreateCustomLayout).waitFor({ state: "visible" });
      await product.genLoc(entityLayout.btnCreateCustomLayout).click();
      await expect(product.genLoc(entityLayout.popupChooseTemplate)).toBeVisible();
      await product.page.getByRole("button", { name: "Your templates" }).click();
      await templateStore.searchTemplateNewUI(template, "wrapper");
      await expect(product.genLoc(`[title='${template}']`)).toBeVisible();
      await templateStore.applyTemplate(template);
      await templateStore.waitForToastMessageHide("Apply template successfully");
      await product.page.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");

      await expect(webBuilder.genLoc(await entityLayout.getXpathPreviewProductByName(productName))).toBeVisible();
      await expect(webBuilder.genLoc(entityLayout.xpathIconSelectProduct)).toBeHidden();
    });

    await test.step(`Thực hiện edit layout > click btn Save`, async () => {
      //thực hiện change layout với product title, block heading: border : S, color 1, back ground : color 3
      await webBuilder.frameLocator.locator(`//span[@value='product.title']`).click();
      await webBuilder.setBackground("background", style.background);
      await webBuilder.setBorder("border", style.border);
      await webBuilder.page.waitForTimeout(1000); // đợi gen setting preview + load 2 lần
      await webBuilder.frameLocator.locator(sectionSelector).waitFor({ state: "visible" });
      const wbBlock = webBuilder.frameLocator.locator(sectionSelector);
      const cssValue = await entityLayout.getCSSValue(wbBlock);

      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: expected.background_color,
          boderBottomColor: expected.border.boder_bottom_color,
          boderBottomStyle: expected.border.boder_bottom_style,
          boderBottomWidth: expected.border.boder_bottom_width,
          boderTopColor: expected.border.boder_top_color,
          boderTopStyle: expected.border.boder_top_style,
          boderTopWidth: expected.border.boder_top_width,
          boderLeftColor: expected.border.boder_left_color,
          boderLeftStyle: expected.border.boder_left_style,
          boderLeftWidth: expected.border.boder_left_width,
          boderRightColor: expected.border.boder_right_color,
          boderRightStyle: expected.border.boder_right_style,
          boderRightWidth: expected.border.boder_right_width,
        }),
      );

      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
    });

    await test.step(`Click icon Preview on new tab`, async () => {
      storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.locator("#v-progressbar").waitFor({ state: "detached" });
      await storefront.waitForLoadState("networkidle");
      await storefront.locator(sectionSelector).waitFor({ state: "visible" });
      await storefront.waitForSelector(entityLayout.xpathBtnAddToCart);
      const popupsShow = await storefront.locator(entityLayout.popup).isVisible();
      if (popupsShow) {
        await storefront.locator(entityLayout.popupClose).click();
      }
      entityLayout = new EntityLayout(storefront, conf.suiteConf.domain);
      const previewSF = storefront.locator(sectionSelector);

      const cssValue = await entityLayout.getCSSValue(previewSF);
      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: expected.background_color,
          boderBottomColor: expected.border.boder_bottom_color,
          boderBottomStyle: expected.border.boder_bottom_style,
          boderBottomWidth: expected.border.boder_bottom_width,
          boderTopColor: expected.border.boder_top_color,
          boderTopStyle: expected.border.boder_top_style,
          boderTopWidth: expected.border.boder_top_width,
          boderLeftColor: expected.border.boder_left_color,
          boderLeftStyle: expected.border.boder_left_style,
          boderLeftWidth: expected.border.boder_left_width,
          boderRightColor: expected.border.boder_right_color,
          boderRightStyle: expected.border.boder_right_style,
          boderRightWidth: expected.border.boder_right_width,
        }),
      );
    });

    await test.step(`Click btn Exit`, async () => {
      await webBuilder.genLoc(entityLayout.xpathBtnExit).click();
      await product.page.waitForLoadState("networkidle");
      await product.genLoc(`//h1[text()='${caseConf.product_name_custom}']`).waitFor({ state: "visible" });

      await expect(webBuilder.genLoc(entityLayout.xpathCustomLayoutLive)).toBeVisible();
    });

    await test.step(`Open product không được custom layout với tab design`, async () => {
      await product.genLoc(product.xpathProduct.subMenu("All products")).click();
      await product.waitForElementVisibleThenInvisible(product.xpathTableLoad);
      await product.searchProduct(caseConf.product_default_layout);
      await product.page.waitForSelector(product.xpathProduct.product.productTitle(caseConf.product_default_layout));
      await product.genLoc(product.xpathProduct.product.productTitle(caseConf.product_default_layout)).click();
      await product.waitForElementVisibleThenInvisible(product.xpathProductDetailLoading);
      await product.genLoc(product.xpathDesignTab).click();
      await expect(webBuilder.genLoc(entityLayout.xpathCustomLayoutLive)).toBeHidden();
      await expect(webBuilder.genLoc(entityLayout.xpathDefaultLayoutLive)).toBeVisible();
    });

    await test.step(`Open Product ngoài SF`, async () => {
      const [sfProduct] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(entityLayout.xpathPreviewProduct),
      ]);
      await sfProduct.waitForLoadState("networkidle");
      await sfProduct.locator("#v-progressbar").waitFor({ state: "detached" });
      await sfProduct.locator(sectionSelector).waitFor({ state: "visible" });
      await sfProduct.waitForSelector(entityLayout.xpathBtnAddToCart);
      const popupsShow = await storefront.locator(entityLayout.popup).isVisible();
      if (popupsShow) {
        await storefront.locator(entityLayout.popupClose).click();
      }
      const sfLoc = sfProduct.locator(sectionSelector);
      const cssValue = await entityLayout.getCSSValue(sfLoc);

      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: cssValueDefault.backgroundColor,
          boderBottomColor: cssValueDefault.boderBottomColor,
          boderBottomStyle: cssValueDefault.boderBottomStyle,
          boderBottomWidth: cssValueDefault.boderBottomWidth,
          boderTopColor: cssValueDefault.boderTopColor,
          boderTopStyle: cssValueDefault.boderTopStyle,
          boderTopWidth: cssValueDefault.boderTopWidth,
          boderLeftColor: cssValueDefault.boderLeftColor,
          boderLeftStyle: cssValueDefault.boderLeftStyle,
          boderLeftWidth: cssValueDefault.boderLeftWidth,
          boderRightColor: cssValueDefault.boderRightColor,
          boderRightStyle: cssValueDefault.boderRightStyle,
          boderRightWidth: cssValueDefault.boderRightWidth,
        }),
      );
    });
  });

  test(`@SB_NEWECOM_NEP_20 Products_Kiểm tra customize Custom layout của 1 product`, async ({
    dashboard,
    cConf,
    context,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomNEP20;
    const productName = caseConf.product_name;
    const template = caseConf.template;
    const style = caseConf.blockSetting;
    const expected = caseConf.expect;
    sectionSelector = entityLayout.xpathHeadingTitle;

    await test.step(`Navigation đến trang detail một product đã có Custom layout > hover vào block Custom layout và chọn action Customize`, async () => {
      await product.gotoProductDetail(productName);
      await webBuilder.page.waitForLoadState("domcontentloaded");
      await product.genLoc(product.xpathDesignTab).click();
      const isCustomLayoutLiveHidden = await product.genLoc(entityLayout.xpathCustomLayoutLive).isHidden();

      if (isCustomLayoutLiveHidden) {
        //Thực hiện add custom layout
        await product.genLoc(entityLayout.btnCreateCustomLayout).click();
        await product.page.getByRole("button", { name: "Your templates" }).click();
        await templateStore.searchTemplateNewUI(template, "wrapper");
        await expect(product.genLoc(`[title='${template}']`)).toBeVisible();
        await templateStore.applyTemplate(template);
        await templateStore.waitForToastMessageHide("Apply template successfully");
      } else {
        await product.genLoc(entityLayout.xpathCustomLayoutLive).isVisible();
        await product.page.hover(product.getXpathBlockLayout("Custom layout"));
        await product.genLoc(await entityLayout.getXpathCustomByLayout("Custom layout")).click();
      }

      await product.genLoc(blockPage.overlay).waitFor({ state: "hidden" });
      await webBuilder.page.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");

      await expect(webBuilder.genLoc(await entityLayout.getXpathPreviewProductByName(productName))).toBeVisible();
      await expect(webBuilder.genLoc(entityLayout.xpathIconSelectProduct)).toBeHidden();
    });

    await test.step(`Thực hiện thay đổi layout của block bất kì > click btn Save`, async () => {
      //thực hiện change layout với product title, block heading: border : S, color 1, back ground : color 3
      await webBuilder.frameLocator.locator(sectionSelector).click();
      await webBuilder.setBackground("background", style.background);
      await webBuilder.setBorder("border", style.border);
      await webBuilder.page.waitForTimeout(1000); // đợi gen setting preview
      await webBuilder.clickOnBtnWithLabel("Save");

      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
    });

    await test.step(`Đi đến trang detail product trên SF shop`, async () => {
      await webBuilder.genLoc("//button[@name='Exit']").click();
      await product.genLoc(`//h1[text()='${productName}']`).waitFor({ state: "visible" });

      const [sfProduct] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(entityLayout.xpathPreviewProduct),
      ]);
      await sfProduct.waitForLoadState("networkidle");
      await sfProduct.locator("#v-progressbar").waitFor({ state: "detached" });
      await sfProduct.locator(sectionSelector).waitFor({ state: "visible" });
      await sfProduct.waitForSelector(entityLayout.xpathBtnAddToCart);
      //nếu show popup thì tắt
      const popupsShow = await sfProduct.locator(entityLayout.popup).isVisible();
      if (popupsShow) {
        await sfProduct.locator(entityLayout.popupClose).click();
      }

      const sfLoc = sfProduct.locator(sectionSelector);
      const cssValue = await entityLayout.getCSSValue(sfLoc);

      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: expected.background_color,
          boderBottomColor: expected.border.boder_bottom_color,
          boderBottomStyle: expected.border.boder_bottom_style,
          boderBottomWidth: expected.border.boder_bottom_width,
          boderTopColor: expected.border.boder_top_color,
          boderTopStyle: expected.border.boder_top_style,
          boderTopWidth: expected.border.boder_top_width,
          boderLeftColor: expected.border.boder_left_color,
          boderLeftStyle: expected.border.boder_left_style,
          boderLeftWidth: expected.border.boder_left_width,
          boderRightColor: expected.border.boder_right_color,
          boderRightStyle: expected.border.boder_right_style,
          boderRightWidth: expected.border.boder_right_width,
        }),
      );
    });
  });

  test(`@SB_NEWECOM_NEP_21 Products_Kiểm tra xóa Custom layout của 1 product`, async ({
    dashboard,
    cConf,
    context,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomNEP21;
    const productName = caseConf.product_name;
    sectionSelector = entityLayout.xpathHeadingTitle;
    const template = caseConf.template;
    const style = caseConf.blockSetting;
    const expected = caseConf.expect;

    await test.step(`Precondition: customize layout default and get style layout`, async () => {
      await product.gotoProductDetail(productName);
      await webBuilder.page.waitForLoadState("domcontentloaded");
      await product.genLoc(product.xpathDesignTab).click();

      await product.page.hover(product.getXpathBlockLayout("Default layout"));
      await product.clickOnBtnWithLabel("Customize");
      await product.genLoc(blockPage.overlay).waitFor({ state: "hidden" });
      await dashboard.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");

      await webBuilder.frameLocator.locator(`//span[@value='product.title']`).click();
      await webBuilder.setBackground("background", style.background);
      await webBuilder.setBorder("border", style.border);
      await webBuilder.editSliderBar("opacity", style.opacity);
      await webBuilder.editSliderBar("border_radius", style.radius);
      await webBuilder.setMarginPadding("padding", style.padding);
      await webBuilder.page.waitForTimeout(1000); // đợi gen setting preview
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
      await webBuilder.genLoc(entityLayout.xpathBtnExit).click();
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step(` Hover vào block Custom layout `, async () => {
      const isCustomLayoutLiveHidden = await product.genLoc(entityLayout.xpathCustomLayoutLive).isHidden();
      if (isCustomLayoutLiveHidden) {
        await product.genLoc(entityLayout.btnCreateCustomLayout).click();
        await product.page.getByRole("button", { name: "Your templates" }).click();
        await templateStore.searchTemplateNewUI(template, "wrapper");
        await templateStore.applyTemplate(template);
        await templateStore.waitForToastMessageHide("Apply template successfully");
        await webBuilder.page.waitForLoadState("networkidle");

        await webBuilder.genLoc(entityLayout.xpathBtnExit).click();
        await webBuilder.page.waitForLoadState("networkidle");
      }
      await product.page.hover(product.getXpathBlockLayout("Custom layout"));
      await expect(product.genLoc(await entityLayout.getXpathCustomByLayout("Custom layout"))).toBeVisible();
    });

    await test.step(`1. Click More action > click btn Delete2. Click button Cancel `, async () => {
      await product.genLoc(entityLayout.xpathMoreActionCustom).click();
      await product.genLoc(entityLayout.xpathBtnDeleteLayout).click();
      await expect(product.genLoc(entityLayout.popupDelete)).toBeVisible();

      await product.genLoc(entityLayout.xpathCancel).click();
      await expect(product.genLoc(entityLayout.popupDelete)).toBeHidden();
    });

    await test.step(`Vào lại trang detail product trên ở dashboard > chọn More action > chọn action Delete > chọn btn Delete trong popup`, async () => {
      await product.page.hover(product.getXpathBlockLayout("Custom layout"));
      await product.genLoc(entityLayout.xpathMoreActionCustom).click();
      await product.genLoc(entityLayout.xpathBtnDeleteLayout).click();
      await product.genLoc(entityLayout.popupDelete).isVisible();
      await product.genLoc(entityLayout.xpathConfirmDelete).click();

      await expect(product.genLoc(entityLayout.popupDelete)).toBeHidden();
      await expect(product.genLoc(entityLayout.xpathCustomLayoutLive)).toBeHidden();
      await expect(product.genLoc(entityLayout.xpathDefaultLayoutLive)).toBeVisible();
    });

    await test.step(`Đi đến trang detail product đó trên SF shop`, async () => {
      const [sfProduct] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(entityLayout.xpathPreviewProduct),
      ]);
      await sfProduct.locator("#v-progressbar").waitFor({ state: "detached" });
      await sfProduct.waitForLoadState("networkidle");
      await sfProduct.locator(sectionSelector).waitFor({ state: "visible" });
      await sfProduct.waitForSelector(entityLayout.xpathBtnAddToCart);
      await sfProduct.waitForTimeout(5 * 1000);

      const popupShow = await sfProduct.locator(entityLayout.popup).isVisible();
      if (popupShow) {
        await sfProduct.locator(entityLayout.popupClose).click();
      }
      const sfLoc = sfProduct.locator(sectionSelector);
      const cssValue = await entityLayout.getCSSValue(sfLoc);

      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: expected.background_color,
          opacity: expected.opacity,
          boderBottomColor: expected.border.boder_bottom_color,
          boderBottomStyle: expected.border.boder_bottom_style,
          boderBottomWidth: expected.border.boder_bottom_width,
          boderTopColor: expected.border.boder_top_color,
          boderTopStyle: expected.border.boder_top_style,
          boderTopWidth: expected.border.boder_top_width,
          boderLeftColor: expected.border.boder_left_color,
          boderLeftStyle: expected.border.boder_left_style,
          boderLeftWidth: expected.border.boder_left_width,
          boderRightColor: expected.border.boder_right_color,
          boderRightStyle: expected.border.boder_right_style,
          boderRightWidth: expected.border.boder_right_width,
          paddingTop: expected.padding.padding_top,
          paddingBottom: expected.padding.padding_bottom,
          paddingLeft: expected.padding.padding_left,
          paddingRight: expected.padding.padding_right,
          borderBottomLeftRadius: expected.border_radius.border_bottom_left_radius,
          borderBottomRightRadius: expected.border_radius.border_bottom_right_radius,
          borderTopLeftRadius: expected.border_radius.border_top_left_radius,
          borderTopRightRadius: expected.border_radius.border_top_right_radius,
        }),
      );
    });
  });

  test(`@SB_NEWECOM_NEP_24 Products_Kiểm tra change custom layout cho các product `, async ({
    dashboard,
    cConf,
    snapshotFixture,
    context,
  }) => {
    test.slow();
    const caseConf = cConf as SbNewecomNEP24;
    const productName = caseConf.product_name;
    sectionSelector = entityLayout.xpathHeadingTitle;
    const template = caseConf.template;
    const switchTemplate = caseConf.switch_template;

    await test.step(`Precondition: Apply 1 layout cho product `, async () => {
      await product.gotoProductDetail(productName);
      await webBuilder.page.waitForLoadState("domcontentloaded");
      await product.genLoc(product.xpathDesignTab).click();
      const isCustomLayoutLiveHidden = await product.genLoc(entityLayout.xpathCustomLayoutLive).isHidden();
      if (isCustomLayoutLiveHidden) {
        //Thực hiện add custom layout
        await product.genLoc(entityLayout.btnCreateCustomLayout).click();
        await product.page.getByRole("button", { name: "Your templates" }).click();
        await templateStore.searchTemplateNewUI(template, "wrapper");
        await expect(product.genLoc(`[title='${template}']`)).toBeVisible();
        await templateStore.applyTemplate(template);
        await templateStore.waitForToastMessageHide("Apply template successfully");
      } else {
        await product.page.hover(product.getXpathBlockLayout("Custom layout"));
        await product.genLoc(await entityLayout.getXpathCustomByLayout("Custom layout")).click();
      }
      await product.genLoc(blockPage.overlay).waitFor({ state: "hidden" });
      await webBuilder.page.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step(`Click Template ở Navigation -> Chọn template mới`, async () => {
      await dashboard.getByTestId("template").click();
      await product.page.getByRole("button", { name: "Your templates" }).click();
      await templateStore.searchTemplateNewUI(switchTemplate, "wrapper");
      await expect(product.genLoc(`[title='${switchTemplate}']`)).toBeVisible();
      await templateStore.applyTemplate(switchTemplate);
      await expect(templateStore.page.locator(".sb-popup__header")).toBeVisible();
      await templateStore.page.getByRole("button", { name: "Apply" }).nth(1).click();
      await expect(templateStore.page.locator(".sb-popup__header")).toBeHidden();

      await webBuilder.waitForElementVisibleThenInvisible(blockPage.getXpathByText("Template applied successfully"));
      await webBuilder.clickOnBtnWithLabel("Save");
      await expect(webBuilder.toastMessage).toContainText("All changes are saved");
    });

    await test.step(`Open SF với product vừa được change template`, async () => {
      const [sfProduct] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(webBuilder.xpathButtonPreview),
      ]);
      await sfProduct.locator("#v-progressbar").waitFor({ state: "detached" });
      await sfProduct.waitForLoadState("networkidle");
      await sfProduct.locator(sectionSelector).waitFor({ state: "visible" });

      await sfProduct.evaluate(() =>
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }),
      );
      await new Promise(resolve => setTimeout(resolve, 3 * 1000)); // Chờ 3 giây để nội dung tải thêm
      await sfProduct.evaluate(() =>
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }),
      );

      await sfProduct.waitForTimeout(5 * 1000); // đợi hiện popup để tắt popup
      const popupShow = await sfProduct.locator(entityLayout.popup).isVisible();
      if (popupShow) {
        await sfProduct.locator(entityLayout.popupClose).click();
      }

      await sfProduct.waitForTimeout(2 * 1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: sfProduct,
        selector: "//div[@id='wb-main']",
        snapshotName: `${process.env.ENV}-change-template.png`,
      });
    });
  });
});
