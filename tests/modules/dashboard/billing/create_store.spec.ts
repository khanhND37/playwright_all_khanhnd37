import { expect, test } from "@core/fixtures";
import { addDays, formatDate } from "@core/utils/datetime";
import { DashboardAPI } from "@pages/api/dashboard";
import { AccountSetting } from "@pages/dashboard/account_setting";
import { BillingPage } from "@pages/dashboard/billing";
import { ConfirmPlanPage } from "@pages/dashboard/package";

let accountSetting, accountSetting2: AccountSetting;
let confirmPlanPage: ConfirmPlanPage;
let billingPage: BillingPage;
let dashboardApi: DashboardAPI;
let shopName, domainStoreNew, accessToken;
let IdNewStore;
let priceToPaid;
let textCompare;
let startNewCycle, endNewCycle;

/**
 * calculate cycle sub display on screen
 * @param freeTrialDays free trial days for the new store
 * @returns
 */
const cycleDisplayInvoiceDetailWithFreeTrial = async (freeTrialDays: number): Promise<string> => {
  startNewCycle = formatDate(addDays(freeTrialDays, new Date()), "MMM DD, YYYY");
  endNewCycle = formatDate(addDays(30, new Date(startNewCycle)), "MMM DD, YYYY");
  return startNewCycle + " to " + endNewCycle;
};

test.describe("Create store", async () => {
  test.afterEach(async ({ conf }) => {
    //close to clean store test after completed verify
    await accountSetting2.goToAccountSetting();
    await accountSetting2.closeStore(conf.suiteConf.password);
  });

  test("@SB_BAL_BILL_BFL_527 kiểm tra change plan khi shop chưa hết free trial", async ({
    conf,
    authRequest,
    dashboard,
    token,
  }) => {
    test.setTimeout(conf.suiteConf.time_out);
    await test.step(
      "Tại dashboard shop -> click icon Account, chọn 'Select another shop'" +
        "-> Tại list shop, click btn 'Add a new shop' -> Add thành công" +
        "-> Tại shop mới tạo, click btn 'Select a plan' -> click btn 'Upgrade plan' -> chọn plan bất kỳ" +
        "-> kiểm tra hiển thị tại Confirm plan page",
      async () => {
        shopName = `au-billing-${new Date().getTime()}`;
        domainStoreNew = shopName + conf.suiteConf.end_domain;
        accountSetting = new AccountSetting(dashboard, conf.suiteConf.domain);
        await accountSetting.createNewShop(
          conf.suiteConf.username,
          conf.suiteConf.password,
          shopName,
          conf.caseConf.shop,
          authRequest,
        );
        accountSetting2 = new AccountSetting(dashboard, domainStoreNew);
        dashboardApi = new DashboardAPI(domainStoreNew, authRequest, dashboard);
        confirmPlanPage = new ConfirmPlanPage(dashboard, domainStoreNew);
        billingPage = new BillingPage(dashboard, domainStoreNew);
        //get shop_id for the new store
        const shopToken = await token.getWithCredentials({
          domain: domainStoreNew,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
        accessToken = await shopToken.access_token;
        IdNewStore = await dashboardApi.getShopId(domainStoreNew, accessToken);
        // if run on env = prodtest: after create a new store
        // need to login again with domain prodlive because the new store is prodlive
        const envRun = process.env.ENV;
        if (envRun === "prodtest") {
          await accountSetting2.goto("https://accounts.shopbase.com/sign-in");
          await accountSetting2.page.fill('[id="email"]', conf.suiteConf.username);
          await accountSetting2.page.fill('[id="password"]', conf.suiteConf.password);
          await accountSetting2.page.locator('//button/span[normalize-space()="Sign in"]').click();
          await dashboard.waitForSelector('//div/p[text()="Select a shop"]');
          if (await accountSetting2.page.locator(`//a//span[normalize-space(text()) = '${shopName}']`).isVisible()) {
            await accountSetting2.page.click(`//a//span[normalize-space(text()) = '${shopName}']`);
            await accountSetting2.page.waitForSelector("(//div[contains(@class, 'in-app-notification')])[1]");
          }
        }
        await confirmPlanPage.gotoPickAPlan();
        priceToPaid = parseFloat(
          await confirmPlanPage.getPricePackageChoosen(conf.suiteConf.basic_plan, conf.suiteConf.time_plan_monthly),
        ).toFixed(2);
        //choose plan
        await confirmPlanPage.chooseTimePlanPackage(conf.suiteConf.basic_plan, conf.suiteConf.time_plan_monthly);
        startNewCycle = formatDate(addDays(14, new Date()), "MMM DD, YYYY");
        textCompare = `After the trial ends, you will pay $${priceToPaid} on ${startNewCycle} for the cycle from ${await cycleDisplayInvoiceDetailWithFreeTrial(
          14,
        )}.`;
        expect(textCompare === (await confirmPlanPage.getTextReviewSub("free_trial"))).toBeTruthy();
      },
    );

    await test.step("click btn 'Start plan'", async () => {
      await confirmPlanPage.clickConfirmPlan();
      await expect(confirmPlanPage.page.locator(confirmPlanPage.getXpathConfirmPlanSucess)).toBeVisible();
      //verify plan at invoice api
      const billing = await billingPage.getInvoiceBillingWithIndexByAPI(
        authRequest,
        conf.suiteConf.api,
        IdNewStore,
        0,
        accessToken,
      );
      expect(billing === undefined).toBe(true);
    });

    await test.step("Quay lại trang 'Pick a plan for your store' -> Click Btn 'Choose this plan' (plan bất kỳ)", async () => {
      await confirmPlanPage.gotoPickAPlan();
      priceToPaid = parseFloat(
        await confirmPlanPage.getPricePackageChoosen(conf.suiteConf.standard_plan, conf.suiteConf.time_plan_monthly),
      ).toFixed(2);
      await confirmPlanPage.chooseTimePlanPackage(conf.suiteConf.standard_plan, conf.suiteConf.time_plan_monthly);
      startNewCycle = formatDate(addDays(14, new Date()), "MMM DD, YYYY");
      textCompare = `After the trial ends, you will pay $${priceToPaid} on ${startNewCycle} for the cycle from ${await cycleDisplayInvoiceDetailWithFreeTrial(
        14,
      )}.`;
      expect(textCompare === (await confirmPlanPage.getTextReviewSub("free_trial"))).toBeTruthy();
    });

    await test.step("click btn 'Confirm changes'", async () => {
      await confirmPlanPage.clickConfirmPlan();
      await expect(confirmPlanPage.page.locator(confirmPlanPage.getXpathConfirmPlanSucess)).toBeVisible();
      //verify plan at invoice api
      const billing = await billingPage.getInvoiceBillingWithIndexByAPI(
        authRequest,
        conf.suiteConf.api,
        IdNewStore,
        0,
        accessToken,
      );
      expect(billing === undefined).toBe(true);
    });
  });
});
