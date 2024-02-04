import { test } from "@fixtures/website_builder";
import { snapshotDir } from "@utils/theme";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { expect } from "@playwright/test";
import { MultipleSF } from "@sf_pages/multiple_storefronts";
import { StorefrontInfo } from "@types";
import { InvoicePage } from "@pages/dashboard/invoice";

let dashboardPage: DashboardPage,
  multipleSF: MultipleSF,
  storefrontInfo: StorefrontInfo,
  invoicePage: InvoicePage,
  settingData,
  expectData,
  storefrontName,
  priceToPaid;

test.describe("Verify create new storefronts", () => {
  test.beforeEach(async ({ dashboard, conf, authRequest }, testInfo) => {
    test.slow();
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    multipleSF = new MultipleSF(dashboard, conf.suiteConf.domain, authRequest);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    settingData = conf.caseConf.data;
    expectData = conf.caseConf.expect;

    await test.step(`Pre-condition: Đi đến màn quản lý storefronts`, async () => {
      await dashboardPage.goto(`https://${conf.suiteConf.domain}/admin/storefronts`);
    });
  });

  const createNewStorefront = async ({ dashboard, conf }) => {
    storefrontName = multipleSF.generateNameStorefront();
    await multipleSF.createNewStorefront(storefrontName);
    //verify hiển thị popup chọn template
    await expect(dashboard.locator(multipleSF.xpathPopupChooseTemplate)).toBeVisible();
    await multipleSF.applyTemplate(settingData.template_name);
    //verify tên storefront được hiển thị
    await expect(dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}${multipleSF.xpathHeading}//h3`)).toHaveText(
      storefrontName,
    );
    //Sau 60s tạo storefront, verify button Activate được enable
    await expect(async () => {
      await expect(
        multipleSF.genLoc(`${multipleSF.getXpathStorefrontList(2)}${multipleSF.xpathButtonActivate}`),
      ).toBeEnabled();
    }).toPass({ timeout: conf.suiteConf.timeout });
  };

  test(`@SB_NEWECOM_MSF_MSFL_166 [Charge] [gói tháng] [extra sf] [đủ balance] thời gian storefront con từ ngày active đến ngày kết thúc cycle store gốc <30 ngày`, async ({
    dashboard,
    conf,
  }) => {
    await test.step(`Pre-condition: Click Add new tạo 1 storefront-> Config để thời gian storefront con từ ngày active đến ngày kết thúc cycle store gốc <30 ngày`, async () => {
      await createNewStorefront({ dashboard, conf });
      const expectExpriredDate = await multipleSF.configDateToXDays(settingData.days_expired);
      storefrontInfo = {
        subscription_expired_at: expectExpriredDate,
      };
      await multipleSF.updateStorefrontInfo(storefrontInfo);
    });

    await test.step(`Click button Activate`, async () => {
      await multipleSF.actionWithStorefront(storefrontName, "Activate");
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      //verify first month
      const priceFirstMonthText = await multipleSF.genLoc(multipleSF.storefrontPrice).first().textContent();
      const priceToPaidDisplay = parseFloat(priceFirstMonthText.match(/\$\s?(\d+\.\d+)/)[1]);
      priceToPaid = await multipleSF.calculatePriceToPaid(settingData.price_storefront, settingData.days_expired);
      expect(priceToPaidDisplay).toEqual(priceToPaid);
      //verify following month
      const priceFollowingMonthText = await multipleSF.genLoc(multipleSF.storefrontPrice).last().textContent();
      const priceFollowingMonth = parseFloat(priceFollowingMonthText.match(/\$\s?(\d+)/)[1]);
      expect(priceFollowingMonth).toEqual(parseFloat(settingData.price_storefront));
    });

    await test.step(`Click Activate`, async () => {
      await multipleSF.genLoc(multipleSF.xpathPopup).getByRole("button", { name: "Activate" }).click();
      await expect(multipleSF.genLoc(multipleSF.headerPaymentPopup)).toBeVisible();
      const total = parseFloat((await multipleSF.genLoc(multipleSF.totalPrice).textContent()).replace("$", ""));
      expect(total).toEqual(priceToPaid);
      await multipleSF.page.getByRole("button", { name: "Pay now" }).click();
      await multipleSF.waitResponseWithUrl("/invoices.json");
      await expect(multipleSF.genLoc(multipleSF.getXpathStatusStf(storefrontName, "Trial"))).not.toBeVisible();
    });

    await test.step(`Kiểm tra billing và invoice được tạo`, async () => {
      const storefrontId = await multipleSF.getStorefrontId(storefrontName);
      await invoicePage.goToSubscriptionInvoices(storefrontId);
      const invoice = await multipleSF.genLoc(multipleSF.xpathInvoice).first().textContent();
      expect(invoice).toContain(storefrontName);
      const content = await multipleSF.genLoc(multipleSF.xpathInvoice).nth(1).textContent();
      expect(content).toEqual(expectData.content);
      const amount = await multipleSF.genLoc(multipleSF.xpathAmount).first().textContent();
      const formattedString = "-$" + priceToPaid.toFixed(2);
      expect(amount).toEqual(formattedString);
    });
  });

  test(`@SB_NEWECOM_MSF_MSFL_169 [Charge] [gói tháng] [extra sf] [đủ balance] thời gian storefront con từ ngày active đến ngày kết thúc cycle store gốc =30 ngày`, async ({
    dashboard,
    conf,
  }) => {
    await test.step(`Pre-condition: Click Add new tạo 1 storefront-> Config để thời gian storefront con từ ngày active đến ngày kết thúc cycle store gốc =30 ngày`, async () => {
      await createNewStorefront({ dashboard, conf });
      await expect(
        multipleSF.genLoc(`${multipleSF.getXpathStorefrontList(2)}${multipleSF.xpathButtonActivate}`),
      ).toBeEnabled();
      const expectExpriredDate = await multipleSF.configDateToXDays(settingData.days_expired);
      storefrontInfo = {
        subscription_expired_at: expectExpriredDate,
      };
      await multipleSF.updateStorefrontInfo(storefrontInfo);
    });

    await test.step(`Click button Activate`, async () => {
      await multipleSF.actionWithStorefront(storefrontName, "Activate");
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      //verify first month
      const priceFirstMonthText = await multipleSF.genLoc(multipleSF.storefrontPrice).first().textContent();
      const priceFirstMonth = parseFloat(priceFirstMonthText.match(/\$(\d+(\.\d+)?)/)[1]);
      expect(priceFirstMonth).toEqual(parseFloat(settingData.price_storefront));
      //verify following month
      const priceFollowingMonthText = await multipleSF.genLoc(multipleSF.storefrontPrice).last().textContent();
      const priceFollowingMonth = parseFloat(priceFollowingMonthText.match(/\$(\d+(\.\d+)?)/)[1]);
      expect(priceFollowingMonth).toEqual(parseFloat(settingData.price_storefront));
    });

    await test.step(`Click Activate`, async () => {
      await multipleSF.genLoc(multipleSF.xpathPopup).getByRole("button", { name: "Activate" }).click();
      await expect(multipleSF.genLoc(multipleSF.headerPaymentPopup)).toBeVisible();
      const total = parseFloat((await multipleSF.genLoc(multipleSF.totalPrice).textContent()).replace("$", ""));
      expect(total).toEqual(settingData.price_storefront);
      await multipleSF.page.getByRole("button", { name: "Pay now" }).click();
      await multipleSF.waitResponseWithUrl("/invoices.json");
      await expect(multipleSF.genLoc(multipleSF.getXpathStatusStf(storefrontName, "Trial"))).not.toBeVisible();
    });

    await test.step(`Kiểm tra billing và invoice được tạo`, async () => {
      const storefrontId = await multipleSF.getStorefrontId(storefrontName);
      await invoicePage.goToSubscriptionInvoices(storefrontId);
      const invoice = await multipleSF.genLoc(multipleSF.xpathInvoice).first().textContent();
      expect(invoice).toContain(storefrontName);
      const content = await multipleSF.genLoc(multipleSF.xpathInvoice).nth(1).textContent();
      expect(content).toEqual(expectData.content);
      const amount = await multipleSF.genLoc(multipleSF.xpathAmount).first().textContent();
      const formattedString = "-$" + settingData.price_storefront.toFixed(2);
      expect(amount).toEqual(formattedString);
    });
  });

  test(`@SB_NEWECOM_MSF_MSFL_167 [Charge] [gói tháng] [extra sf] [đủ balance] thời gian storefront con từ ngày active đến ngày kết thúc cycle store gốc >30 ngày`, async ({
    dashboard,
    conf,
  }) => {
    await test.step(`Pre-condition: Click Add new tạo 1 storefront-> Config để thời gian storefront con từ ngày active đến ngày kết thúc cycle store gốc >30 ngày`, async () => {
      await createNewStorefront({ dashboard, conf });
      await expect(
        multipleSF.genLoc(`${multipleSF.getXpathStorefrontList(2)}${multipleSF.xpathButtonActivate}`),
      ).toBeEnabled();
      const expectExpriredDate = await multipleSF.configDateToXDays(settingData.days_expired);
      storefrontInfo = {
        subscription_expired_at: expectExpriredDate,
      };
      await multipleSF.updateStorefrontInfo(storefrontInfo);
    });

    await test.step(`Click button Activate`, async () => {
      await multipleSF.actionWithStorefront(storefrontName, "Activate");
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      //verify first month
      const priceFirstMonthText = await multipleSF.genLoc(multipleSF.storefrontPrice).first().textContent();
      const priceFirstMonth = parseFloat(priceFirstMonthText.match(/\$(\d+(\.\d+)?)/)[1]);
      expect(priceFirstMonth).toEqual(parseFloat(settingData.price_storefront));
      //verify following month
      const priceFollowingMonthText = await multipleSF.genLoc(multipleSF.storefrontPrice).last().textContent();
      const priceFollowingMonth = parseFloat(priceFollowingMonthText.match(/\$(\d+(\.\d+)?)/)[1]);
      expect(priceFollowingMonth).toEqual(parseFloat(settingData.price_storefront));
    });

    await test.step(`Click Activate`, async () => {
      await multipleSF.genLoc(multipleSF.xpathPopup).getByRole("button", { name: "Activate" }).click();
      await expect(multipleSF.genLoc(multipleSF.headerPaymentPopup)).toBeVisible();
      const total = parseFloat((await multipleSF.genLoc(multipleSF.totalPrice).textContent()).replace("$", ""));
      expect(total).toEqual(settingData.price_storefront);
      await multipleSF.page.getByRole("button", { name: "Pay now" }).click();
      await multipleSF.waitResponseWithUrl("/invoices.json");
      await expect(multipleSF.genLoc(multipleSF.getXpathStatusStf(storefrontName, "Trial"))).not.toBeVisible();
    });

    await test.step(`Kiểm tra billing và invoice được tạo`, async () => {
      const storefrontId = await multipleSF.getStorefrontId(storefrontName);
      await invoicePage.goToSubscriptionInvoices(storefrontId);
      const invoice = await multipleSF.genLoc(multipleSF.xpathInvoice).first().textContent();
      expect(invoice).toContain(storefrontName);
      const content = await multipleSF.genLoc(multipleSF.xpathInvoice).nth(1).textContent();
      expect(content).toEqual(expectData.content);
      const amount = await multipleSF.genLoc(multipleSF.xpathAmount).first().textContent();
      const formattedString = "-$" + settingData.price_storefront.toFixed(2);
      expect(amount).toEqual(formattedString);
    });
  });
});
