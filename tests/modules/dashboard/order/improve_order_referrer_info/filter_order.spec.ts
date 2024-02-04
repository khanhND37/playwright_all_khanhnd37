import { expect, test } from "@fixtures/theme";
import { OrdersPage } from "@pages/dashboard/orders";
import { DashboardPage } from "@pages/dashboard/dashboard";

test.describe("filter order with UTM", () => {
  let orderPage: OrdersPage;
  let dashboardPage: DashboardPage;
  test.beforeEach(async ({ conf, dashboard }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
  });

  test(`@SB_ANA_IMP_ORD_REF_20  Filter order include 5 params of UTM (source, medium, campaign, term, content)`, async ({
    dashboard,
    conf,
  }) => {
    await test.step("Open dashboard >> Click Orders", async () => {
      await dashboardPage.navigateToMenu("Orders");
      orderPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      expect(await orderPage.isDBPageDisplay("Orders")).toBeTruthy();
    });

    await test.step(
      "Click button More filters" +
        "+ Click source >> fill cpc_s_oct2021" +
        "+ Click medium >> fill cpc_m_oct2021" +
        "+ Click campaign>> fill cpc_n_oct2021" +
        "+ Click term >> fill cpc_t_oct2021" +
        "+ Click content >> fill cpc_c_181004",
      async () => {
        await orderPage.clickButtonMoreFilters();
        await orderPage.page.waitForSelector(orderPage.xpathFiltersLabelInMoreFilter);
        const dataFilter = conf.caseConf.data_filter;
        for (const data of dataFilter) {
          await orderPage.filterOrderSbase(data);
        }
        await orderPage.clickButtonApplyOnFilter();
        await orderPage.waitForElementVisibleThenInvisible(orderPage.xpathFiltersLabelInMoreFilter);
        const numOrder = await orderPage.page.locator(orderPage.xpathItemOrder).count();
        for (let i = 1; i <= numOrder; i++) {
          await orderPage.page.locator(`(${orderPage.xpathItemOrder})[${i}]`).click();
          await orderPage.page.waitForSelector(orderPage.xpathSectionOrder);
          await orderPage.openViewFullSecssion();
          const infoUTM = await orderPage.getInfoUTMParameters(conf.caseConf.Info_utm_parameters);
          expect(infoUTM).toMatchObject(conf.caseConf.Info_utm_parameters);
          await orderPage.page.goBack({ waitUntil: "networkidle" });
        }
      },
    );
  });
});
