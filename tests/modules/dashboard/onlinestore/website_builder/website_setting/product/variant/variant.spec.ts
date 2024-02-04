import { WebBuilder } from "@pages/dashboard/web_builder";
import { expect, test } from "@fixtures/website_builder";
import { XpathNavigationButtons } from "@constants/web_builder";
import { WebsiteSetting } from "@pages/dashboard/website_setting";
import { verifyRedirectUrl } from "@utils/theme";
import { Environment } from "./variant";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { SFHome } from "@sf_pages/homepage";
import { Variant } from "@pages/dashboard/settings/variant";

test.describe("Setting website builder", () => {
  let suiteConf: Environment, webBuilder: WebBuilder, webSetting: WebsiteSetting, variant: Variant;
  test.beforeEach(async ({ dashboard, conf }) => {
    suiteConf = conf.suiteConf as Environment;
    webBuilder = new WebBuilder(dashboard, suiteConf.domain);
    webSetting = new WebsiteSetting(dashboard, suiteConf.domain);
    variant = new Variant(dashboard, suiteConf.domain);

    await webBuilder.openWebBuilder({ type: "site", id: suiteConf.theme_id, page: "product" });
    await dashboard.locator(XpathNavigationButtons["website"]).click();
    await webSetting.clickSettingCategory("Product");
  });

  test(`@SB_NEWECOM_WS_PDV_01 Verify Default variant selection`, async ({ dashboard, context, conf }) => {
    const caseConf = conf.caseConf;

    await test.step(`Chọn option "Do not select any variant"`, async () => {
      await webBuilder.selectDropDown("default_variant", "Do not select any variant");
      await webSetting.toggleByLabel("Hide selector when option has one value", "false");
      await webSetting.clickBtnSave();

      for (const st of caseConf.expected.step_1) {
        await webSetting.changeProductEntity(st.product_title);
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "?theme_preview_id",
          context,
        });
        await expect(storefront.locator(".variants-selector div.active")).toHaveCount(st.active_count);
      }
    });

    await test.step(`Chọn option "Auto choose the first variant"`, async () => {
      await webBuilder.selectDropDown("default_variant", "Auto choose the first variant");
      await webSetting.clearExcludedTag();
      await webSetting.clickBtnSave();

      for (const st of caseConf.expected.step_2) {
        await webSetting.changeProductEntity(st.product_title);
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "?theme_preview_id",
          context,
        });

        await expect(storefront.locator(".variants-selector div.active")).toHaveCount(st.active_count);
      }
    });

    await test.step(`Input giá trị cho "Exclude some option from auto section"`, async () => {
      await webBuilder.selectDropDown("default_variant", "Auto choose the first variant");
      await dashboard
        .locator(`${webBuilder.getSelectorByLabel("exclude_options")}//textarea`)
        .fill(caseConf.excluded_option);
      await dashboard.locator(XpathNavigationButtons["save"]).click();

      for (const st of caseConf.expected.step_3) {
        await webSetting.changeProductEntity(st.product_title);
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "?theme_preview_id",
          context,
        });

        await expect(storefront.locator(".variants-selector div.active")).toHaveCount(st.active_count);
      }
    });
  });

  test(`@SB_NEWECOM_WS_PDV_02 Verify button Hide selector when option has one value`, async ({
    dashboard,
    context,
    conf,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Turn on toggle Hide selector when option has one value`, async () => {
      //Pre-condition:
      await webBuilder.selectDropDown("default_variant", "Auto choose the first variant");
      await webSetting.clearExcludedTag();
      await dashboard.locator(`${webBuilder.getSelectorByLabel("exclude_options")}//textarea`).fill("test-excluded");

      await webSetting.toggleByLabel("Hide selector when option has one value", "true");
      await dashboard.locator(XpathNavigationButtons["save"]).click();

      for (const st of caseConf.expected.step_1) {
        await webSetting.changeProductEntity(st.product_title);
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "?theme_preview_id",
          context,
        });

        await expect(storefront.locator(".variants-selector div.button-layout")).toHaveCount(st.active_count);
      }
    });

    await test.step(`Turn off toggle Hide selector when option has one value`, async () => {
      await webSetting.toggleByLabel("Hide selector when option has one value", "false");
      await webSetting.clearExcludedTag();
      await webSetting.clickBtnSave();

      for (const st of caseConf.expected.step_2) {
        await webSetting.changeProductEntity(st.product_title);
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "?theme_preview_id",
          context,
        });

        await expect(storefront.locator(".variants-selector div.button-layout")).toHaveCount(st.active_count);
      }
    });
  });

  test(`@SB_NEWECOM_WS_PDV_03 Verify button "Only show available variant combination"`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Turn off toggle Only show available variant combination`, async () => {
      await webSetting.toggleByLabel("Only show available variant combination", "false");
      await webSetting.clickBtnSave();
      const expected = caseConf.expected.step_1;
      for (const ex of expected) {
        await webSetting.changeProductEntity(ex.product_title);
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "?theme_preview_id",
          context,
        });

        for (const variant of ex.variants) {
          await expect(storefront.locator(webSetting.getXpathVariantItem(variant))).toHaveCount(1);
        }
      }
    });
    await test.step(`Turn on toggle Only show available variant combination`, async () => {
      await webSetting.toggleByLabel("Only show available variant combination", "true");
      if (!(await dashboard.locator(XpathNavigationButtons["save"]).isDisabled())) {
        await dashboard.locator(XpathNavigationButtons["save"]).click();
      }
      const expected = caseConf.expected.step_2;
      for (const ex of expected) {
        await webSetting.changeProductEntity(ex.product_title);
        const storefront = await verifyRedirectUrl({
          page: dashboard,
          selector: XpathNavigationButtons["preview"],
          redirectUrl: "?theme_preview_id",
          context,
        });

        for (const cas of ex.cases) {
          await storefront.locator(webSetting.getXpathVariantItem(cas.on_click)).click();
          for (const variant of cas.variants) {
            await expect(storefront.locator(webSetting.getXpathVariantItem(variant))).toHaveCount(1);
          }
        }
      }
    });
  });

  test(`@SB_NEWECOM_WS_PDV_04 Verify chỉnh sửa các setting trong product variant hiển thị trên mobile`, async ({
    dashboard,
    conf,
    pageMobile,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;
    const productPage = new SFHome(pageMobile, conf.suiteConf.domain);

    await test.step(`Chọn option "Verify Default variant selection"`, async () => {
      await webBuilder.selectDropDown("default_variant", "Do not select any variant");
      await webSetting.toggleByLabel("Hide selector when option has one value", "false");
      await webSetting.clickBtnSave();
      for (const st of caseConf.expected.step_1) {
        await productPage.gotoProduct(st.product_handle);
        await expect(productPage.genLoc(".variants-selector div.active")).toHaveCount(st.active_count);
      }
    });

    await test.step(`Chọn option "Auto choose the first variant"`, async () => {
      await webBuilder.selectDropDown("default_variant", "Auto choose the first variant");
      await dashboard.locator(`${webBuilder.getSelectorByLabel("exclude_options")}//textarea`).fill("test-excluded");
      await webSetting.clearExcludedTag();
      await webSetting.clickBtnSave();

      for (const st of caseConf.expected.step_2) {
        await productPage.gotoProduct(st.product_handle);
        await expect(productPage.genLoc(".variants-selector div.active")).toHaveCount(st.active_count);
      }
    });

    await test.step(`Input giá trị cho "Exclude some option from auto section"`, async () => {
      await webBuilder.selectDropDown("default_variant", "Auto choose the first variant");
      await dashboard
        .locator(`${webBuilder.getSelectorByLabel("exclude_options")}//textarea`)
        .fill(caseConf.excluded_option);
      await webSetting.clearExcludedTag();
      await webSetting.clickBtnSave();
      for (const st of caseConf.expected.step_3) {
        await productPage.gotoProduct(st.product_handle);
        await expect(productPage.genLoc(".variants-selector div.active")).toHaveCount(st.active_count);
      }
    });

    await test.step(`Turn on toggle Hide selector when option has one value`, async () => {
      await webSetting.toggleByLabel("Hide selector when option has one value", "true");
      await webSetting.clearExcludedTag();
      await dashboard.locator(`${webBuilder.getSelectorByLabel("exclude_options")}//textarea`).fill("test-excluded");
      await webSetting.clickBtnSave();

      for (const st of caseConf.expected.step_4) {
        await productPage.gotoProduct(st.product_handle);
        await expect(productPage.genLoc(".variants-selector div.button-layout")).toHaveCount(st.active_count);
      }
    });

    await test.step(`Turn off toggle Hide selector when option has one value`, async () => {
      await webSetting.toggleByLabel("Hide selector when option has one value", "false");
      await webSetting.clearExcludedTag();
      await webSetting.clickBtnSave();

      for (const st of caseConf.expected.step_5) {
        await productPage.gotoProduct(st.product_handle);
        await expect(productPage.genLoc(".variants-selector div.button-layout")).toHaveCount(st.active_count);
      }
    });

    await test.step(`Turn off toggle Only show available variant combination`, async () => {
      await webSetting.toggleByLabel("Only show available variant combination", "false");
      await dashboard.locator(`${webBuilder.getSelectorByLabel("exclude_options")}//textarea`).fill("test-excluded-2");
      await dashboard.locator(`${webBuilder.getSelectorByLabel("exclude_options")}//textarea`).press("Enter");
      await webSetting.clickBtnSave();

      const expected = caseConf.expected.step_6;
      for (const ex of expected) {
        await productPage.gotoProduct(ex.product_handle);
        for (const variant of ex.variants) {
          await expect(productPage.genLoc(webSetting.getXpathVariantItem(variant))).toHaveCount(1);
        }
      }
    });

    await test.step(`Turn on toggle Only show available variant combination`, async () => {
      await webSetting.toggleByLabel("Only show available variant combination", "true");
      await dashboard.locator(`${webBuilder.getSelectorByLabel("exclude_options")}//textarea`).fill("test-excluded");
      await webSetting.clickBtnSave();

      const expected = caseConf.expected.step_7;
      for (const ex of expected) {
        await productPage.gotoProduct(ex.product_handle);
        for (const cas of ex.cases) {
          await productPage.genLoc(webSetting.getXpathVariantItem(cas.on_click)).click();
          for (const variant of cas.variants) {
            await expect(productPage.genLoc(webSetting.getXpathVariantItem(variant))).toHaveCount(1);
          }
        }
      }
    });
  });

  test(`@SB_NEWECOM_WS_PDV_05 Verify button "Enable Stick ATC" trên shop ecom`, async ({ dashboard, conf }) => {
    const xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    const frameLocator = xpathBlock.frameLocator;

    await test.step(`Turn on toggle "Enable Stick ATC"`, async () => {
      await webSetting.toggleByLabel("Enable Stick ATC", "true");
      if (!(await dashboard.locator(XpathNavigationButtons["save"]).isDisabled())) {
        await dashboard.locator(XpathNavigationButtons["save"]).click();
      }
      await dashboard.waitForLoadState("networkidle");
      await frameLocator.locator(variant.xpathQuickSetting).scrollIntoViewIfNeeded();
      await dashboard.locator(XpathNavigationButtons["styling"]).click();
      await dashboard.locator(XpathNavigationButtons["website"]).click();
      await webSetting.clickSettingCategory("Product");
      await expect(frameLocator.locator(variant.xpathStickyContainer)).toBeVisible();
    });

    await test.step(`Turn off toggle "Enable Stick ATC"`, async () => {
      await webSetting.toggleByLabel("Enable Stick ATC", "false");
      if (!(await dashboard.locator(XpathNavigationButtons["save"]).isDisabled())) {
        await dashboard.locator(XpathNavigationButtons["save"]).click();
      }
      await dashboard.waitForLoadState("networkidle");
      await frameLocator.locator(variant.xpathQuickSetting).scrollIntoViewIfNeeded();
      await dashboard.locator(XpathNavigationButtons["styling"]).click();
      await dashboard.locator(XpathNavigationButtons["website"]).click();
      await webSetting.clickSettingCategory("Product");
      await expect(frameLocator.locator(variant.xpathStickyContainer)).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_WS_PDV_06 Verify hiển thị các tooltips`, async ({ dashboard, cConf }) => {
    await test.step(`Từ Website setting > Click "Product" trên menu`, async () => {
      for (const ex of cConf.expected) {
        if (ex.id === "exclude_options") {
          await webBuilder.selectDropDown("default_variant", "Auto choose the first variant");
          await dashboard.getByPlaceholder("Separate options with comma").waitFor({ state: "visible" });
          let index = 1;
          for (const label of ex.labels) {
            await dashboard.locator(`(${variant.xpathTooltipLabelExcludeOption(ex.id)})[${index}]`).hover();
            await dashboard.locator(variant.xpathVisibleTooltipVariant(label)).isVisible();
            index++;
          }
        } else if (ex.id === "sticky_add_cart_enabled") {
          await variant.hoverStickyAtcInfoIcon();
          await expect(dashboard.locator(variant.xpathVisibleTooltipVariant(ex.label))).toBeVisible();
        } else {
          await dashboard.locator(variant.xpathTooltipLabel(ex.id)).hover();
          await expect(dashboard.locator(variant.xpathVisibleTooltipVariant(ex.label))).toBeVisible();
        }
      }
    });
  });
});
