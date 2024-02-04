import { expect, test } from "@core/fixtures";
import { Dev, SbWebBuilderLpCSP05 } from "./customization-service-page";
import { isContainCustomizationServicePage, openPageSelector, ShopInfo } from "./customization-service-page.util";

test.describe("Verify sự xuất hiện của customization service page", () => {
  test(`@SB_WEB_BUILDER_LP_CSP_05 Verify page customization service chỉ xuất hiện ở shop creator, không xuất hiện ở các shop type khác (shopbase, printbase, plusbase)`, async ({
    page,
    conf,
    token,
  }) => {
    test.slow();
    const caseConf = conf.caseConf as SbWebBuilderLpCSP05;
    const suiteConf = conf.suiteConf as Dev;

    await test.step(`Login vào shop creator, vào web builder, click vào page selector`, async () => {
      const shopInfo: ShopInfo = {
        domain: caseConf.shop_creator.shop_domain,
        email: caseConf.shop_creator.email,
        password: caseConf.shop_creator.password,
      };
      await openPageSelector(page, token, shopInfo);

      // Verify have page customization service page
      const memberPagesLocator =
        "//div[contains(@class, 'w-builder__page-groups--heading') and normalize-space()='Member pages']/following-sibling::div//div[contains(@class, 'w-builder__page-groups--item')]";
      const exist = await isContainCustomizationServicePage(page, memberPagesLocator);

      expect(exist).toEqual(true);
    });

    await test.step(`Login vào shop shopbase, vào web builder, click vào page selector`, async () => {
      // logout first
      await page.goto(`https://${suiteConf.accounts_domain}/logout`);

      const shopInfo: ShopInfo = {
        domain: caseConf.shop_shopbase.shop_domain,
        email: caseConf.shop_shopbase.email,
        password: caseConf.shop_shopbase.password,
      };
      await openPageSelector(page, token, shopInfo);

      // Verify don't have page customization service
      const pageLocators = "//div[contains(@class, 'w-builder__page-groups--item')]";
      const exist = await isContainCustomizationServicePage(page, pageLocators);

      expect(exist).toEqual(false);
    });

    await test.step(`Login vào shop printbase, vào web builder, click vào page selector`, async () => {
      // logout first
      await page.goto(`https://${suiteConf.accounts_domain}/logout`);

      const shopInfo: ShopInfo = {
        domain: caseConf.shop_printbase.shop_domain,
        email: caseConf.shop_printbase.email,
        password: caseConf.shop_printbase.password,
      };
      await openPageSelector(page, token, shopInfo);

      // Verify don't have page customization service
      const pageLocators = "//div[contains(@class, 'w-builder__page-groups--item')]";
      const exist = await isContainCustomizationServicePage(page, pageLocators);

      expect(exist).toEqual(false);
    });

    await test.step(`Login vào shop plusbase, vào web builder, click vào page selector`, async () => {
      // logout first
      await page.goto(`https://${suiteConf.accounts_domain}/logout`);

      const shopInfo: ShopInfo = {
        domain: caseConf.shop_plusbase.shop_domain,
        email: caseConf.shop_plusbase.email,
        password: caseConf.shop_plusbase.password,
      };
      await openPageSelector(page, token, shopInfo);

      // Verify don't have page customization service
      const pageLocators = "//div[contains(@class, 'w-builder__page-groups--item')]";
      const exist = await isContainCustomizationServicePage(page, pageLocators);

      expect(exist).toEqual(false);
    });
  });
});
