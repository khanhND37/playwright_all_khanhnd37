import { expect, test } from "@core/fixtures";
import { addDays, addDayAndFormat, getUnixTime } from "@core/utils/datetime";
import { removeCurrencySymbol } from "@core/utils/string";
import { DashboardAPI } from "@pages/api/dashboard";
import { ConfirmPlanPage } from "@pages/dashboard/package";
import { TopupPage } from "@pages/dashboard/topup";
import { HiveBalance } from "@pages/hive/hive_balance";
import { AccountPage } from "@pages/dashboard/accounts";
import { LogBackPage } from "@pages/dashboard/log_back";
import { BalancePage } from "@pages/dashboard/balance";

const makeData = data => {
  data.end_free_trial_at = getUnixTime(addDays(data.end_free_trial_at)) / 1000;
  data.subscription_expired_at = getUnixTime(addDays(data.subscription_expired_at)) / 1000;

  return data;
};

test.describe("Activate plan without card in free trial", () => {
  let shopId,
    domain,
    hiveDomain,
    storeInfo,
    balanceAmountBefore,
    expectChargeAmt,
    methodTopup,
    topupAmount,
    gApi,
    endTrialFreeAt;
  let confirmPlanPage: ConfirmPlanPage;
  let dashboardAPI: DashboardAPI;
  let topupPage: TopupPage;
  let hiveBalance: HiveBalance;

  //call api to update store to status needed
  test.beforeEach(async ({ dashboard, conf, authRequest, hiveSBase }) => {
    gApi = conf.suiteConf.api;
    hiveDomain = conf.suiteConf.hive_domain;

    domain = conf.caseConf.domain;
    shopId = conf.caseConf.shop_id;
    methodTopup = conf.caseConf.method_topup;
    topupAmount = conf.caseConf.topup_amount;
    storeInfo = conf.caseConf.store_info;
    expectChargeAmt = conf.caseConf.package_price;
    endTrialFreeAt = storeInfo.end_free_trial_at;

    confirmPlanPage = new ConfirmPlanPage(dashboard, domain);
    topupPage = new TopupPage(dashboard, domain);
    dashboardAPI = new DashboardAPI(domain, authRequest);
    hiveBalance = new HiveBalance(hiveSBase, hiveDomain);

    await dashboardAPI.updateStoreStatus(gApi, storeInfo);

    // Wait 5 seconds to make sure the data has been processed
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await dashboard.waitForTimeout(5000);
    if (storeInfo.charge_sub) {
      await dashboard.waitForTimeout(5000);
    }

    await dashboard.reload();
  });

  test(`[Plusbase] Kiểm tra active plan cho store đang in free trial và chọn method top-up là Credit card @SB_ACT_PL_WC_37`, async ({
    conf,
  }) => {
    // charge available to zero
    await hiveBalance.chargeAvailableBalanceToZero(hiveDomain, shopId, conf.caseConf.info_charge_to_zero);
    await hiveBalance.page.close();

    await test.step(`Tại Homepage > Click Active your plan Tại Account page> Click Active my plan > Click button 'Start plan'`, async () => {
      await confirmPlanPage.startPlan();
      expect(await confirmPlanPage.isPopUpDisplayed("Top-up recommendation")).toBeTruthy();
    });

    await test.step(`Kiểm tra các giá trị hiển thị trên popup`, async () => {
      balanceAmountBefore = await dashboardAPI.getTotalBalance();
      const topupInfo = await confirmPlanPage.getInfoInTopupRecommend();
      const expectedEndFreeTrialAt = addDayAndFormat(endTrialFreeAt);

      expect(topupInfo.current_balance).toEqual(balanceAmountBefore.toFixed(2));
      expect(topupInfo.charge_amount).toEqual(expectChargeAmt);
      expect(topupInfo.end_free_trial_at).toEqual(expectedEndFreeTrialAt);
    });

    await test.step(`Click button 'Top-up' `, async () => {
      await confirmPlanPage.topUpButtonLoc.click();
      await expect(topupPage.topupHeaderLoc).toBeVisible();
    });

    await test.step(`Confirm top-up với credit card`, async () => {
      const topupAmtSuccess = await topupPage.topupToStoreByMethod(methodTopup, topupAmount);
      expect(Number(removeCurrencySymbol(topupAmtSuccess))).toEqual(topupAmount);
    });
  });
});

test.describe(`Charge failed`, () => {
  let shopId, domain, hiveDomain, storeInfo, gApi;
  let confirmPlanPage: ConfirmPlanPage;
  let dashboardAPI: DashboardAPI;
  let topupPage: TopupPage;
  let hiveBalance: HiveBalance;
  let balancePage: BalancePage;

  //call api to update store to status needed
  test.beforeEach(async ({ dashboard, conf, authRequest, hiveSBase }) => {
    gApi = conf.suiteConf.api;
    hiveDomain = conf.suiteConf.hive_domain;

    domain = conf.caseConf.domain;
    shopId = conf.caseConf.shop_id;
    storeInfo = conf.caseConf.store_info;

    confirmPlanPage = new ConfirmPlanPage(dashboard, domain);
    topupPage = new TopupPage(dashboard, domain);
    balancePage = new BalancePage(dashboard, domain);
    dashboardAPI = new DashboardAPI(domain, authRequest);
    hiveBalance = new HiveBalance(hiveSBase, hiveDomain);

    await dashboardAPI.updateStoreStatus(gApi, storeInfo);

    // Wait 5 seconds to make sure the data has been processed
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await dashboard.waitForTimeout(5000);
    if (storeInfo.charge_sub) {
      await dashboard.waitForTimeout(5000);
    }

    await dashboard.reload();
  });

  test(`[Plusbase] Kiểm tra store hết free trial và bị re-charge subscription fee không thành công khi
    available balance của store không đủ @SB_ACT_PL_WC_40`, async () => {
    await test.step(`Vào home page > Verify noti message `, async () => {
      await expect(confirmPlanPage.topUpButtonLoc).toBeVisible();
    });

    await test.step(`Click button Top-up`, async () => {
      await confirmPlanPage.topUpButtonLoc.click();
      await expect(topupPage.topupHeaderLoc).toBeVisible();
    });
  });

  test(`[Plusbase] Kiểm tra store hết free trial và bị re-charge subscription fee thành công khi
    available balance của store không đủ @SB_ACT_PL_WC_41`, async ({ conf, page }) => {
    await test.step(`Pre conditions`, async () => {
      //charge available to zero
      await hiveBalance.chargeAvailableBalanceToZero(hiveDomain, shopId, conf.caseConf.info_charge_to_zero);
      await hiveBalance.page.close();
    });

    await test.step(`Vào home page > Verify noti message `, async () => {
      await page.reload();
      await expect(confirmPlanPage.topUpButtonLoc).toBeVisible();
    });

    await test.step(`Click button Top-up > Chọn top-up bằng Credit card hoặc wire transfer`, async () => {
      await confirmPlanPage.topUpButtonLoc.click();
      await expect(topupPage.topupHeaderLoc).toBeVisible();

      await balancePage.selectPaymentMethod(conf.caseConf.payment_method);
      await balancePage.valueAmountTopUp(conf.caseConf.select_amount, conf.caseConf.amount_input);
      await balancePage.inputInfoMoneyTransfer(conf.caseConf.data_input_info_money_transfers);
      await balancePage.clickBtnConfirmTopUp();
      await expect(balancePage.topUpSuccessLoc).toContainText(conf.caseConf.banner_transfers_success);
    });
  });
});

test.describe("Activate plan without card after free trial", () => {
  let domain, methodTopup, topupAmount, data, hiveDomain, shopId;
  let confirmPlanPage: ConfirmPlanPage;
  let topupPage: TopupPage;
  let accountPage: AccountPage;

  //call api to update store to status needed
  test.beforeEach(async ({ dashboard, conf, api }) => {
    hiveDomain = conf.suiteConf.hive_domain;

    data = conf.caseConf.data;
    domain = conf.caseConf.domain;
    methodTopup = conf.caseConf.method_topup;
    topupAmount = conf.caseConf.topup_amount;
    shopId = conf.caseConf.shop_id;

    confirmPlanPage = new ConfirmPlanPage(dashboard, domain);
    accountPage = new AccountPage(dashboard, domain);
    topupPage = new TopupPage(dashboard, domain);

    if (data.request.data.end_free_trial_at) {
      data.request.data = makeData(data.request.data);
    }

    const response = await api.request(data);
    expect(response.ok).toBeTruthy();

    await dashboard.reload();
  });

  test(`[Plusbase] Kiểm tra active plan after free trial đối với country được support active without card,
  available balance của account lớn hơn subscription fee @SB_ACT_PL_WC_46`, async ({ conf }) => {
    await test.step(`Mở store dashboard > Verify hiển thị page Confirm plan và các giá trị tương ứng`, async () => {
      const hasActivatePlanButton = await confirmPlanPage.activatePlusBasePlanButtonLoc.isVisible();
      if (!hasActivatePlanButton) {
        await accountPage.selectShopByName(conf.caseConf.domain);
      }

      await expect(confirmPlanPage.activatePlusBasePlanButtonLoc).toBeVisible();

      await confirmPlanPage.activatePlusBasePlanButtonLoc.click();

      await expect(confirmPlanPage.confirmPlanHeaderLoc).toBeVisible();
      await expect(confirmPlanPage.startPlanButtonLoc).toBeVisible();
    });

    await test.step(`Nhập discount code > Click button Start plan`, async () => {
      const discountCode = conf.caseConf.discount_code;
      await confirmPlanPage.startPlan(true, discountCode);

      const shopNameLocator = await confirmPlanPage.getShopNameLocator(domain);
      await expect(shopNameLocator).toBeVisible();
      // expect(await confirmPlanPage.isToastMsgVisible("Activate plan successfully")).toBeTruthy();
    });
  });

  test(`[Plusbase] Kiểm tra active plan after free trial đối với country được support active without card,
  available balance của account nhỏ hơn subscription fee @SB_ACT_PL_WC_47`, async ({ conf, page, hiveSBase }) => {
    await test.step(`Pre conditions`, async () => {
      //charge available to zero
      const hiveBalance = new HiveBalance(hiveSBase, hiveDomain);
      await hiveBalance.chargeAvailableBalanceToZero(hiveDomain, shopId, conf.caseConf.info_charge_to_zero);
      await hiveBalance.page.close();
    });

    await test.step(`Mở store dashboard > Verify hiển thị page Confirm plan và các giá trị tương ứng`, async () => {
      const hasActivatePlanButton = await confirmPlanPage.activatePlusBasePlanButtonLoc.isVisible();
      if (!hasActivatePlanButton) {
        await accountPage.selectShopByName(conf.caseConf.domain);
      }

      await expect(confirmPlanPage.activatePlusBasePlanButtonLoc).toBeVisible();

      await confirmPlanPage.activatePlusBasePlanButtonLoc.click();
      await expect(confirmPlanPage.balanceInsufficientMsgLoc).toBeVisible();
      await expect(confirmPlanPage.topUpButtonV2Loc).toBeVisible();
    });

    await test.step(`Click button Top-up`, async () => {
      await confirmPlanPage.topUpButtonV2Loc.click();
      await expect(topupPage.topupHeaderLoc).toBeVisible();
    });

    await test.step(`Top up`, async () => {
      const topupAmtSuccess = await topupPage.topupToStoreByMethod(methodTopup, topupAmount);
      expect(Number(removeCurrencySymbol(topupAmtSuccess))).toEqual(topupAmount);

      await topupPage.cancelTopUpBtnLoc.click();

      await expect(confirmPlanPage.startPlanButtonLoc).toBeVisible();

      await confirmPlanPage.startPlan(true);

      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(5000);
      const shopNameLocator = await confirmPlanPage.getShopNameLocator(domain);
      await expect(shopNameLocator).toBeVisible();
      // expect(await confirmPlanPage.isToastMsgVisible("Activate plan successfully")).toBeTruthy();
    });
  });
});

test.describe("Logback store", () => {
  let accountPage: AccountPage;
  let logbackPage: LogBackPage;
  let topUpPage: TopupPage;
  let topupAmount;

  test(`[Plusbase] Kiểm tra log back to store với store đã end free trial và
    user region được support activate without card (Available sufficient) @SB_ACT_PL_WC_58`, async ({
    page,
    conf,
    api,
  }) => {
    await test.step(`Pre condition`, async () => {
      // call qc api to update store to status closed
      const data = conf.caseConf.data;
      if (data.request.data.end_free_trial_at) {
        data.request.data = makeData(data.request.data);
      }

      const response = await api.request(data);
      expect(response.ok).toBeTruthy();

      // Wait 5 seconds to make sure the data has been processed
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(5000);
      await page.reload();

      accountPage = new AccountPage(page, conf.caseConf.domain);
      logbackPage = new LogBackPage(page, conf.caseConf.domain);

      await accountPage.login({ email: conf.caseConf.username, password: conf.caseConf.password });
    });

    await test.step(`Tại select shop page- Mở shop đã bị close`, async () => {
      const hasLogBackButton = await logbackPage.logBackStoreButtonLoc.isVisible();
      if (!hasLogBackButton) {
        await accountPage.selectShopByName(conf.caseConf.domain);
      }
      await expect(logbackPage.logBackStoreButtonLoc).toBeVisible();
    });

    await test.step(`Click button 'Confirm'`, async () => {
      const logbackResult = await logbackPage.logBackStore(true);
      expect(logbackResult.is_success).toBeTruthy();
    });
  });

  test(`[Plusbase] Kiểm tra log back to store với store đã end free trial
    và user region được support activate without card (Available insufficient) @SB_ACT_PL_WC_59`, async ({
    page,
    conf,
    api,
    hiveSBase,
  }) => {
    await test.step(`Pre condition`, async () => {
      accountPage = new AccountPage(page, conf.caseConf.domain);
      logbackPage = new LogBackPage(page, conf.caseConf.domain);
      topUpPage = new TopupPage(page, conf.caseConf.domain);
      topupAmount = conf.caseConf.topup_amount;

      // charge available to zero
      const hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
      await hiveBalance.chargeAvailableBalanceToZero(
        conf.suiteConf.hive_domain,
        conf.caseConf.shop_id,
        conf.caseConf.info_charge_to_zero,
      );
      await hiveBalance.page.close();

      // call qc api to update store to status closed
      const data = conf.caseConf.data;
      if (data.request.data.end_free_trial_at) {
        data.request.data = makeData(data.request.data);
      }

      const response = await api.request(data);
      expect(response.ok).toBeTruthy();

      // Wait 5 seconds to make sure the data has been processed
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(5000);
      await page.reload();

      await accountPage.login({ email: conf.caseConf.username, password: conf.caseConf.password });
    });

    await test.step(`Tại select shop page- Mở shop đã bị close`, async () => {
      const hasLogBackButton = await logbackPage.logBackStoreButtonLoc.isVisible();
      if (!hasLogBackButton) {
        await accountPage.selectShopByName(conf.caseConf.domain);
      }
      await expect(logbackPage.logBackStoreButtonLoc).toBeVisible();

      const result = await logbackPage.logBackStore(true);

      await expect(result.is_balance_insufficient).toBeTruthy();
      await expect(logbackPage.topUpButtonLoc).toBeVisible();
    });

    await test.step(`Click button 'Top-up'`, async () => {
      await logbackPage.topUpButtonLoc.click();
      await expect(topUpPage.topupHeaderLoc).toBeVisible();
    });

    await test.step(`Top-up số tiền còn thiếu để charge subscription fee > Click top-up`, async () => {
      const topupAmtSuccess = await topUpPage.topupToStoreByMethod(conf.caseConf.method_topup, topupAmount);
      expect(Number(removeCurrencySymbol(topupAmtSuccess))).toEqual(topupAmount);

      await page.reload();
      await logbackPage.cancelButtonLoc.click();
      const result = await logbackPage.logBackStore(true);
      expect(result.is_success).toBeTruthy();
    });
  });
});
