import { test } from "@fixtures/website_builder";
import { snapshotDir } from "@utils/theme";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { expect } from "@playwright/test";
import { MultipleSF } from "@sf_pages/multiple_storefronts";
import { StorefrontInfo } from "@types";
import { InvoicePage } from "@pages/dashboard/invoice";

let dashboardPage: DashboardPage,
  multipleSF: MultipleSF,
  endSubDate,
  storefrontInfo: StorefrontInfo,
  invoicePage: InvoicePage;

test.describe("Verify create new storefronts", () => {
  test.beforeEach(async ({ dashboard, conf, authRequest }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    multipleSF = new MultipleSF(dashboard, conf.suiteConf.domain, authRequest);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);

    await test.step(`Pre-condition: Đi đến màn quản lý storefronts`, async () => {
      await dashboardPage.goto(`https://${conf.suiteConf.domain}/admin/storefronts`);
    });
  });

  test(`@SB_NEWECOM_MSF_MSFL_165 [Phase 2] Verify không bị tính phí cho multi storefront khi chưa vượt quá storefront limit của package`, async ({
    dashboard,
    conf,
  }) => {
    await test.step(`Config postman để store gốc và các store con đến chu kì charge tiền của store gốc -> Kiểm tra billing và invoice được tạo`, async () => {
      endSubDate = new Date().getTime();
      storefrontInfo = {
        subscription_expired_at: endSubDate,
      };
      await multipleSF.genLoc(multipleSF.storefrontName).first().click();
      await multipleSF.page.waitForLoadState("networkidle");
      await multipleSF.updateStorefrontInfo(storefrontInfo);
      await dashboard.reload();
    });

    await test.step(`Kiểm tra billing và invoice được tạo`, async () => {
      for (let i = 0; i < conf.caseConf.storefronts.length; i++) {
        const storefrontId = conf.caseConf.storefronts[i].stf_id;
        await invoicePage.goToSubscriptionInvoices(storefrontId);
        const historyInvoice = await multipleSF.genLoc(multipleSF.noHistoryInvoice).textContent();
        expect(historyInvoice).toEqual(conf.caseConf.no_history_invoice);
        await multipleSF.page.reload();
      }
    });
  });
});
