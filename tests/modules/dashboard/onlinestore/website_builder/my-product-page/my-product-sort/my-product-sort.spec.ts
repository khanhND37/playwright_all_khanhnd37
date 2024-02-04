import { test } from "@core/fixtures";
import { expect } from "@playwright/test";
import { WbMyProductPage } from "@pages/dashboard/wb-my-product-page";
import { SbNewecomMp53 } from "./my-product-sort";
import { MyProductPage } from "@pages/shopbase_creator/storefront/my_product";

test.describe("Verify sorting của my product page", () => {
  let wbPage: WbMyProductPage;

  test.beforeEach(async ({ dashboard, conf }) => {
    test.slow();
    wbPage = new WbMyProductPage(dashboard, conf.suiteConf.domain);

    await test.step(`Pre-condition: Login vào shop creator, vào web builder, chọn page My product`, async () => {
      await wbPage.openMyProductPage();
    });
  });

  test(`@SB_NEWECOM_MP_53 Verify setting sorting`, async ({ context, conf }) => {
    const caseConf = conf.caseConf as SbNewecomMp53;
    await test.step(`Verify default sorting `, async () => {
      const currentSort = caseConf.first_sort;

      // Verify sorting
      const currentSortingValue = await wbPage.getCurrentSortingValue();
      expect(currentSortingValue).toEqual(currentSort.expect_select_sort_value);

      // Verify product
      const productNames = await wbPage.getProductNames();
      // Using JSON.stringify to compare both value and ordering of product
      expect(JSON.stringify(productNames)).toEqual(JSON.stringify(currentSort.products));
    });

    await test.step(`Preview ngoài SF`, async () => {
      const currentSort = caseConf.first_sort;

      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await wbPage.page.click(wbPage.xpathButtonPreview),
      ]);
      const sfPage = new MyProductPage(sfTab, conf.suiteConf.domain);

      // Verify sorting
      const currentSortingValue = await sfPage.getCurrentSortingValue();
      expect(currentSortingValue).toEqual(currentSort.expect_select_sort_value);

      // Verify product
      const productNames = await sfPage.getProductNames();
      expect(JSON.stringify(productNames)).toEqual(JSON.stringify(currentSort.products));

      await sfTab.close();
    });

    await test.step(`Select option sort Alphabet A-Z`, async () => {
      const currentSort = caseConf.second_sort;

      // Select sorting
      await wbPage.selectSortOption(currentSort.sort_value);

      // Verify sorting
      const currentSortingValue = await wbPage.getCurrentSortingValue();
      expect(currentSortingValue).toEqual(currentSort.expect_select_sort_value);

      // Verify product
      const productNames = await wbPage.getProductNames();
      expect(JSON.stringify(productNames)).toEqual(JSON.stringify(currentSort.products));
    });

    await test.step(`Preview ngoài SF`, async () => {
      const currentSort = caseConf.second_sort;

      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await wbPage.page.click(wbPage.xpathButtonPreview),
      ]);

      const sfPage = new MyProductPage(sfTab, conf.suiteConf.domain);

      // Select sorting
      await sfPage.selectSortOption(currentSort.sort_value);

      // Verify sorting
      const currentSortingValue = await sfPage.getCurrentSortingValue();
      expect(currentSortingValue).toEqual(currentSort.expect_select_sort_value);

      // Verify product
      const productNames = await sfPage.getProductNames();
      expect(JSON.stringify(productNames)).toEqual(JSON.stringify(currentSort.products));

      await sfTab.close();
    });

    await test.step(`Select option sort Alphabet Z-A`, async () => {
      const currentSort = caseConf.third_sort;

      // Select sorting
      await wbPage.selectSortOption(currentSort.sort_value);

      // Verify sorting
      const currentSortingValue = await wbPage.getCurrentSortingValue();
      expect(currentSortingValue).toEqual(currentSort.expect_select_sort_value);

      // Verify product
      const productNames = await wbPage.getProductNames();
      expect(JSON.stringify(productNames)).toEqual(JSON.stringify(currentSort.products));
    });

    await test.step(`Preview ngoài SF`, async () => {
      const currentSort = caseConf.third_sort;

      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await wbPage.page.click(wbPage.xpathButtonPreview),
      ]);

      const sfPage = new MyProductPage(sfTab, conf.suiteConf.domain);

      // Select sorting
      await sfPage.selectSortOption(currentSort.sort_value);

      // Verify sorting
      const currentSortingValue = await sfPage.getCurrentSortingValue();
      expect(currentSortingValue).toEqual(currentSort.expect_select_sort_value);

      // Verify product
      const productNames = await sfPage.getProductNames();
      expect(JSON.stringify(productNames)).toEqual(JSON.stringify(currentSort.products));

      await sfTab.close();
    });

    await test.step(`Select option sort Recently accessed`, async () => {
      const currentSort = caseConf.fourth_sort;

      // Select sorting
      await wbPage.selectSortOption(currentSort.sort_value);

      // Verify sorting
      const currentSortingValue = await wbPage.getCurrentSortingValue();
      expect(currentSortingValue).toEqual(currentSort.expect_select_sort_value);

      // Verify product
      const productNames = await wbPage.getProductNames();
      expect(JSON.stringify(productNames)).toEqual(JSON.stringify(currentSort.products));
    });

    await test.step(`Preview ngoài SF`, async () => {
      const currentSort = caseConf.fourth_sort;

      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await wbPage.page.click(wbPage.xpathButtonPreview),
      ]);

      const sfPage = new MyProductPage(sfTab, conf.suiteConf.domain);

      // Select sorting
      await sfPage.selectSortOption(currentSort.sort_value);

      // Verify sorting
      const currentSortingValue = await sfPage.getCurrentSortingValue();
      expect(currentSortingValue).toEqual(currentSort.expect_select_sort_value);

      // Verify product
      const productNames = await sfPage.getProductNames();
      expect(JSON.stringify(productNames)).toEqual(JSON.stringify(currentSort.products));

      await sfTab.close();
    });
  });
});
