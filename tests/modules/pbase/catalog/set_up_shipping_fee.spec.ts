import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { CatalogAPI } from "@pages/api/dashboard/catalog";
import { CatalogPage } from "@pages/dashboard/catalog";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { calculateProfit } from "../utils/profit";

test.describe("Merchant should be able set up shipping for the product base", async () => {
  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];

    test.beforeEach(async ({ dashboard, conf }) => {
      const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
      await dashboardPage.goto("admin/pod/catalog");
    });

    test.afterEach(async ({ authRequest, conf }) => {
      const catalogAPI = new CatalogAPI(conf.suiteConf.domain, authRequest);
      await catalogAPI.deleteSetUpShippingFee(authRequest, caseData.product.id);
    });

    test(`[Set up shipping fee] Merchant set up shipping fee với giá trị ${caseData.description} @${caseData.id}`, async ({
      dashboard,
      conf,
    }) => {
      const catalogPage = new CatalogPage(dashboard, conf.suiteConf.domain);
      const {
        country,
        qty,
        name: productName,
        sale_price: salePrice,
        base_cost: baseCost,
        markup_first: markupFirst,
        markup_add: markupAdd,
        shipping_rate: shippingRate,
        tab_base: tabBaseProduct,
      } = caseData.product as never;

      await test.step("Merchant chọn country United ", async () => {
        await catalogPage.chooseTabBaseProduct(tabBaseProduct, productName);
        await catalogPage.chooseSetUpShippingFee(productName);
        //- Hiển thị mô tả: Set the expected shipping fee that you intend to collect from your buyers
        await expect(
          dashboard.locator(
            `//p[contains(text(),'Set the expected shipping fee that you intend to collect from your buyers')]`,
          ),
        ).toBeVisible();
      });

      await test.step("Tại panel shipping fee hiển thị", async () => {
        await catalogPage.selectCountry(country);
        await catalogPage.inputInfoShipping(salePrice, markupFirst, markupAdd);
        const profitOneItem = await catalogPage.getProfitOneItem(shippingRate);
        const profitTwoItem = await catalogPage.getProfitTwoItem(shippingRate);
        const shippingFirstItem = await catalogPage.getShippingFirstItem(shippingRate);
        const shippingAddItem = await catalogPage.getShippingAddItem(shippingRate);

        //- Hiển thị đúng giá profit buy 1 item và buy 2 items
        //- Hiển thị button + Add Shipping Zone
        expect(removeCurrencySymbol(profitOneItem)).toEqual(
          calculateProfit(salePrice, baseCost, markupFirst, shippingFirstItem).toString(),
        );
        expect(removeCurrencySymbol(profitTwoItem)).toEqual(
          calculateProfit(
            salePrice * qty,
            baseCost * qty,
            markupFirst + markupAdd * (qty - 1),
            shippingFirstItem + shippingAddItem * (qty - 1),
          ).toString(),
        );
        await expect(dashboard.locator("//span[contains(text(),'Add Shipping Zone')]")).toBeVisible();
      });

      await test.step("Chọn save", async () => {
        await catalogPage.chooseSave();
        //- Save thành công, hiển thị Saved shipping fee successfully
        await expect(dashboard.locator(`//div[contains(text(),'Saved shipping fee successfully')]`)).toBeVisible();
      });
    });
  }
});
