import { test, expect } from "@core/fixtures";
import { HomePage } from "@pages/dashboard/home_page";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir } from "@utils/theme";
import { FrameLocator } from "@playwright/test";
import { XpathNavigationButtons } from "@constants/web_builder";
import { acceptOfferButton, offerButton, optionOfferPage, selectProductPreview } from "./offer-page-util";

test.describe("Verify block button", () => {
  let webBuilder: WebBuilder, blocks: Blocks, themeId: number, frameLocator: FrameLocator;

  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    const suiteConf = conf.suiteConf;
    webBuilder = new WebBuilder(dashboard, suiteConf.domain);
    blocks = new Blocks(dashboard, suiteConf.domain);
    frameLocator = blocks.frameLocator;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    themeId = suiteConf.theme_id;
    if (!["SB_SC_LPC_OFP_01", "SB_SC_LPC_OFP_05"].includes(conf.caseName)) {
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "offer" });
      await dashboard.locator("#v-progressbar").waitFor({ state: "detached" });
      await dashboard.waitForLoadState("networkidle");
    }
  });

  test(`@SB_SC_LPC_OFP_01 Verify page offer chỉ có tại shop creator`, async ({ dashboard, conf, token }) => {
    const suiteConf = conf.suiteConf;

    await test.step(`Tại droplist  Creator pages `, async () => {
      await webBuilder.openWebBuilder({ type: "site", id: themeId });
      await dashboard.locator("#v-progressbar").waitFor({ state: "detached" });
      await dashboard.waitForLoadState("networkidle");
      await dashboard.locator(XpathNavigationButtons["pages"]).click();
      await expect(await dashboard.locator(optionOfferPage)).toBeVisible();
    });

    await test.step(`Tại droplist  E-commerce pages `, async () => {
      for (const shopData of suiteConf.shop_data) {
        const homePage = new HomePage(dashboard, shopData.domain);
        const accessToken = (
          await token.getWithCredentials({
            domain: shopData.shop_name,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;
        await homePage.loginWithToken(accessToken);
        webBuilder = new WebBuilder(dashboard, shopData.domain);
        await webBuilder.openWebBuilder({ type: "site", id: shopData.theme_id });
        await dashboard.locator("#v-progressbar").waitFor({ state: "detached" });
        await dashboard.waitForLoadState("networkidle");
        await dashboard.locator(XpathNavigationButtons["pages"]).click();
        await expect(await dashboard.locator(optionOfferPage)).toBeHidden();
      }
    });
  });

  test(`@SB_SC_LPC_OFP_02 Verify UI default offer page`, async ({ dashboard, conf, snapshotFixture }) => {
    await test.step(`Click page offer page`, async () => {
      await snapshotFixture.verify({
        page: dashboard,
        selector: `//header[contains(@class, 'w-builder__header')]`,
        snapshotName: `${conf.caseName}-check-tool-bar.png`,
      });

      await dashboard.locator(offerButton).click();
      await snapshotFixture.verify({
        page: dashboard,
        selector: `//div[contains(@class, 'w-builder__layers-content')]`,
        snapshotName: `${conf.caseName}-layer-content.png`,
      });
    });

    await test.step(`Check trạng thái default tab Content block Accept offer`, async () => {
      await dashboard.locator(acceptOfferButton).click();
      await blocks.switchToTab("Content");
      await expect(
        await dashboard.locator(`//div[@data-widget-id='accept_offer_label']/child::div`).getAttribute("value"),
      ).toEqual(conf.caseConf.accept_offer_label);
      await expect(
        await dashboard.locator(`//div[@data-widget-id='reject_offer_label']/child::div`).getAttribute("value"),
      ).toEqual(conf.caseConf.reject_offer_label);
    });

    await test.step(`Check trạng thái default tab Design block Accept offer`, async () => {
      await blocks.switchToTab("Design");
      await snapshotFixture.verify({
        page: dashboard,
        selector: `//div[contains(@class, 'w-builder__settings-layer')]`,
        snapshotName: `${conf.caseName}-accept-offer-design-setting.png`,
      });
    });
  });

  test(`@SB_SC_LPC_OFP_03 Verify hiển thị UI default template offer page trong WB`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`click Preview Product Offer > chọn product`, async () => {
      await selectProductPreview({ dashboard, frameLocator, name: caseConf.product_1 });
      await expect(dashboard.locator(`//div[@class='list-variants mb-16']`)).toBeHidden();

      await selectProductPreview({ dashboard, frameLocator, name: caseConf.product_2 });
      let actualOptions = await frameLocator
        .locator(`//div[@class='list-variants mb-16']//div[contains(@class, 'base-radio')]`)
        .count();
      await expect(actualOptions).toEqual(3);

      await selectProductPreview({ dashboard, frameLocator, name: caseConf.product_3 });
      actualOptions = await frameLocator
        .locator(
          `//div[@class='list-variants mb-16']//div[contains(@class, 'variants--select')]//div[contains(@class, 'options')]`,
        )
        .count();
      await expect(actualOptions).toEqual(7);
    });

    await test.step(`Click icon Preview on SF`, async () => {
      for (let i = 1; i <= 3; i++) {
        await selectProductPreview({ dashboard, frameLocator, name: caseConf[`product_${i}`] });
        const [previewTab] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(blocks.xpathButtonPreview),
        ]);
        await previewTab.waitForLoadState("networkidle");
        switch (i) {
          case 1: {
            await expect(dashboard.locator(`//div[@class='list-variants mb-16']`)).toBeHidden();
            break;
          }
          case 2: {
            await expect(
              await frameLocator
                .locator(`//div[@class='list-variants mb-16']//div[contains(@class, 'base-radio')]`)
                .count(),
            ).toEqual(3);
            break;
          }
          case 3: {
            await expect(
              await frameLocator
                .locator(
                  `//div[@class='list-variants mb-16']//div[contains(@class, 'variants--select')]//div[contains(@class, 'options')]`,
                )
                .count(),
            ).toEqual(7);
            break;
          }
        }
        previewTab.close();
      }
    });
  });

  test(`@SB_SC_LPC_OFP_04 Verify hiển thị UI default offer page trên mobile trong WB`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const caseConf = conf.caseConf;

    await test.step(`Click Preview Product Offer > chọn product`, async () => {
      await dashboard.locator(XpathNavigationButtons["mobile"]).click();

      await selectProductPreview({ dashboard, frameLocator, name: caseConf.product_1 });
      await expect(dashboard.locator(`//div[@class='list-variants mb-16']`)).toBeHidden();

      await selectProductPreview({ dashboard, frameLocator, name: caseConf.product_2 });
      let actualOptions = await frameLocator
        .locator(`//div[@class='list-variants mb-16']//div[contains(@class, 'base-radio')]`)
        .count();
      await expect(actualOptions).toEqual(3);

      await selectProductPreview({ dashboard, frameLocator, name: caseConf.product_3 });
      actualOptions = await frameLocator
        .locator(
          `//div[@class='list-variants mb-16']//div[contains(@class, 'variants--select')]//div[contains(@class, 'options')]`,
        )
        .count();
      await expect(actualOptions).toEqual(7);
    });

    await test.step(`Click icon Preview on SF`, async () => {
      for (let i = 1; i <= 3; i++) {
        await selectProductPreview({ dashboard, frameLocator, name: caseConf[`product_${i}`] });
        const [previewTab] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(blocks.xpathButtonPreview),
        ]);
        await previewTab.waitForLoadState("networkidle");
        switch (i) {
          case 1: {
            await expect(dashboard.locator(`//div[@class='list-variants mb-16']`)).toBeHidden();
            break;
          }
          case 2: {
            await expect(
              await frameLocator
                .locator(`//div[@class='list-variants mb-16']//div[contains(@class, 'base-radio')]`)
                .count(),
            ).toEqual(3);
            break;
          }
          case 3: {
            await expect(
              await frameLocator
                .locator(
                  `//div[@class='list-variants mb-16']//div[contains(@class, 'variants--select')]//div[contains(@class, 'options')]`,
                )
                .count(),
            ).toEqual(7);
            break;
          }
        }
        previewTab.close();
      }
    });
  });

  test(`@SB_SC_LPC_OFP_05 Verify product upsell với default offer page`, async ({ conf, context }) => {
    const storefront = await context.newPage();

    await test.step(`Ra ngoài SF check out product test offer page `, async () => {
      await storefront.goto(`https://${conf.suiteConf.domain}/products/product-test-offer-1`);
      await storefront.waitForLoadState("networkidle");
      await storefront
        .locator(`//div[contains(@class, 'checkout-form__container')]//input[@placeholder='Your email address']`)
        .fill(conf.caseConf.email);
      await storefront
        .frameLocator("#stripe-frame-form-wrapper")
        .locator('[placeholder="Card number"]')
        .fill(conf.caseConf.card_info.number);
      await storefront
        .frameLocator("#stripe-frame-form-wrapper")
        .locator('[placeholder="MM / YY"]')
        .fill(conf.caseConf.card_info.expire_date);
      await storefront
        .frameLocator("#stripe-frame-form-wrapper")
        .locator('[placeholder="CVV"]')
        .fill(conf.caseConf.card_info.cvv);
      await storefront.locator(`//button[contains(@class, 'paynow')]`).click();
      await storefront.locator("#v-progressbar").waitFor({ state: "visible" });
      await storefront.locator("#v-progressbar").waitFor({ state: "hidden" });
      await storefront.waitForLoadState("networkidle");
      await expect(
        await storefront
          .locator(
            `//div[@class='list-variants mb-16']//div[contains(@class, 'variants--select')]//div[contains(@class, 'options')]`,
          )
          .count(),
      ).toEqual(7);
    });

    await test.step(`Click Yes! Upgrade My Order Now `, async () => {
      storefront.locator(`//button[contains(@class, 'btn-primary')]`).click();
      await storefront.locator("#v-progressbar").waitFor({ state: "visible" });
      await storefront.locator("#v-progressbar").waitFor({ state: "hidden" });
      await storefront.waitForLoadState("networkidle");
      await expect(storefront.locator(`//div[@class='list-variants mb-16']`)).toBeHidden();
    });

    await test.step(`Chọn 1 pricing > Click Yes! Upgrade My Order Now `, async () => {
      storefront.locator(`//button[contains(@class, 'btn-primary')]`).click();
      await storefront.locator("#v-progressbar").waitFor({ state: "visible" });
      await storefront.locator("#v-progressbar").waitFor({ state: "hidden" });
      await storefront.waitForLoadState("networkidle");
      await expect(
        await storefront
          .locator(
            `//div[@class='list-variants mb-16']//div[contains(@class, 'variants--select')]//div[contains(@class, 'options')]`,
          )
          .count(),
      ).toEqual(7);
    });

    await test.step(`Chọn 1 pricing > Click Yes! Upgrade My Order Now `, async () => {
      storefront.locator(`//button[contains(@class, 'btn-primary')]`).click();
      await storefront.locator("#v-progressbar").waitFor({ state: "visible" });
      await storefront.locator("#v-progressbar").waitFor({ state: "hidden" });
      await storefront.waitForLoadState("networkidle");
      const itemsCount = await storefront.locator(`//div[contains(@class, 'order-items--wb')]//a[@class='']`).count();
      for (let i = 1; i <= itemsCount; i++) {
        await expect(
          await storefront.locator(`(//div[contains(@class, 'order-items--wb')]//a[@class=''])[${i}]`).textContent(),
        ).toEqual(conf.caseConf.expect_products[i - 1]);
      }
    });
  });
});
