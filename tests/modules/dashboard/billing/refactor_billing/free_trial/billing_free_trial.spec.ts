import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { ConfirmPlanPage } from "@pages/dashboard/package";
import { BalancePage } from "@pages/dashboard/balance";
import type { ActivationInfo, DataInvoiceDetail, StorePlanInfo } from "@types";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Tools } from "@helper/tools";
import { SFHome } from "@pages/storefront/homepage";
import { BillingPage } from "@pages/dashboard/billing";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { InvoicePage } from "@pages/dashboard/invoice";
import { InvoiceDetailPage } from "@pages/dashboard/invoice_detail";
import { AccountSetting } from "@pages/dashboard/account_setting";
import { addDays, formatDate } from "@core/utils/datetime";

let balancePage: BalancePage;
let confirmPlanPage: ConfirmPlanPage;
let dashboardPage: DashboardPage;
let sfHome: SFHome;
let invoiceInfo: DataInvoiceDetail;
let freeTrialInfo: StorePlanInfo;
let freeTrialInfoClean: StorePlanInfo;
let activationInfo: ActivationInfo;
let tools: Tools;
let api: string;
let activationInfoDate: ActivationInfo;
let billingPage: BillingPage;
let invoicePage: InvoicePage;
let invoiceDetailPage: InvoiceDetailPage;
let accountSettingPage: AccountSetting;
let newPage;
let invoiceConditions;
let invoiceInfoDetail;
let transactionConditions;
let startNewCycle, endNewCycle, endSubDate, cycleBill;
let priceToPaid, priceApplyCoupon, priceCharge;
let textCompare;
let storePlanInfo;
let infoCurrentInvoiceBilling;
let invoiceId;
let invoiceInfoData;

/**
 * calculate cycle sub display on screen
 * @param freeTrialDays free trial days for the new store
 * @returns
 */
const cycleDisplayInvoiceDetailWithFreeTrial = async (
  freeTrialDays: number,
  inputFormatDate: string,
): Promise<string> => {
  startNewCycle = formatDate(addDays(freeTrialDays, new Date()), inputFormatDate);
  endNewCycle = formatDate(addDays(30, new Date(startNewCycle)), inputFormatDate);
  return startNewCycle + " to " + endNewCycle;
};

test.describe("Billing free trial shopbase", () => {
  test.beforeEach(async ({ dashboard, page, conf, request }) => {
    confirmPlanPage = new ConfirmPlanPage(dashboard, conf.suiteConf.domain);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    billingPage = new BillingPage(dashboard, conf.suiteConf.domain);
    invoiceDetailPage = new InvoiceDetailPage(dashboard, conf.suiteConf.domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    sfHome = new SFHome(page, conf.suiteConf.domain);
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    test.setTimeout(conf.suiteConf.time_out);
    api = conf.suiteConf.api;
    invoiceInfo = {
      domain: conf.suiteConf.domain,
      content: conf.caseConf.invoice_info.content,
      amount: conf.caseConf.invoice_info.amount,
      status: conf.caseConf.invoice_info.status,
    };
    activationInfo = conf.caseConf.activation_info;
    freeTrialInfo = {
      id: conf.suiteConf.shop_id,
      status: conf.caseConf.free_trial_info.status,
      payment_status: conf.caseConf.free_trial_info.payment_status,
      end_free_trial_at: conf.caseConf.free_trial_info.end_free_trial_at,
      subscription_expired_at: conf.caseConf.free_trial_info.subscription_expired_at,
      end_free_trial_at_minute: conf.caseConf.free_trial_info.end_free_trial_at_minute,
      package_id: conf.caseConf.free_trial_info.package_id,
      created_at: conf.caseConf.free_trial_info.created_at,
    };

    freeTrialInfoClean = {
      id: conf.suiteConf.shop_id,
      status: conf.suiteConf.free_trial_info_clean.status,
      payment_status: conf.suiteConf.free_trial_info_clean.payment_status,
      end_free_trial_at: conf.suiteConf.free_trial_info_clean.end_free_trial_at,
      subscription_expired_at: conf.suiteConf.free_trial_info_clean.subscription_expired_at,
      end_free_trial_at_minute: conf.suiteConf.end_free_trial_at_minute,
      package_id: conf.suiteConf.free_trial_info_clean.package_id,
      created_at: conf.caseConf.free_trial_info.created_at,
    };

    //clean data before run test case
    tools = new Tools();
    const response = await tools.updateFreeTrialDate(api, request, freeTrialInfoClean);
    expect(response).toBe(200);

    //setup free trial day
    if (freeTrialInfo) {
      const response = await tools.updateFreeTrialDate(api, request, freeTrialInfo);
      expect(response).toBe(200);
    }

    //clear cache and open new page
    await dashboardPage.clearCachePage();
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    await dashboardPage.login({ email: conf.suiteConf.username, password: conf.suiteConf.password });

    //calculate next payment date
    activationInfoDate = await confirmPlanPage.calculateNextPaymentDate(freeTrialInfo, activationInfo);

    if (conf.caseConf.free_trial_info.end_free_trial_at === 0) {
      activationInfo.start_date = "Today";
    } else {
      activationInfo.start_date = activationInfoDate.start_date;
    }
    activationInfo.end_date = activationInfoDate.end_date;
  });

  test("Kiểm tra Activate plan với shop ShopBase đã hết free-trial và chưa confirm plan @SB_BAL_BILL_BFL_447", async () => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    await test.step(`Login vào Dashboard của shop`, async () => {
      expect(
        await dashboardPage.isDBPageDisplay("Your trial has ended, please choose a plan to continue"),
      ).toBeTruthy();
    });

    await test.step("Click vào button Choose this plan bất kỳ", async () => {
      await confirmPlanPage.chooseThisPlanPackage(activationInfo);
      expect(await confirmPlanPage.isDBPageDisplay("Confirm plan")).toBeTruthy();
      expect(await confirmPlanPage.isConfirmPlanInfoCorrectly(activationInfo)).toBeTruthy();
    });

    await test.step("Click Start plan", async () => {
      await confirmPlanPage.clickOnBtnWithLabel("Start plan");
      await confirmPlanPage.waitUntilElementInvisible(confirmPlanPage.getXpathPopupCapcha);
      await confirmPlanPage.waitUntilElementVisible(confirmPlanPage.getXpathPricingPlan);
      expect(await confirmPlanPage.isDBPageDisplay("Pick a plan for your store")).toBeTruthy();
    });

    await test.step(`Navigate đến trang Balance => click "View invoices"`, async () => {
      await balancePage.goto("admin/balance/history");
      expect(await balancePage.isDBPageDisplay("Invoices")).toBeTruthy();
    });

    await test.step("Kiểm tra Invoices mới được tạo", async () => {
      expect(await balancePage.isInvoiceCreated(invoiceInfo)).toBeTruthy();
    });

    await test.step("Open Storefront", async () => {
      await sfHome.gotoAllCollection();
      expect(await sfHome.isHomepageUnavailable()).toBeFalsy();
    });
  });

  test("Kiểm tra Activate plan với shop ShopBase chưa hết free-trial @SB_BAL_BILL_BFL_448", async () => {
    await test.step(`Login vào Dashboard của shop`, async () => {
      await dashboardPage.goto("admin");
      expect(await dashboardPage.isFreeTrialBoxDisplayed(5000)).toBeTruthy();
    });

    await test.step(`Click button Select a plan- Redirect đến Settings => Account page - Click Btn "Upgrade plan"- Click Btn "Choose this plan"=> Click Btn "Start plan"`, async () => {
      await dashboardPage.clickOnBtnWithLabel("Select a plan");
      if (!(await dashboardPage.isDBPageDisplay("Account"))) {
        await dashboardPage.clickOnBtnWithLabel("Select a plan");
      }
      expect(dashboardPage.isDBPageDisplay("Account")).toBeTruthy();
      await dashboardPage.clickOnBtnWithLabel("Upgrade plan");

      expect(await confirmPlanPage.isDBPageDisplay("Pick a plan for your store")).toBeTruthy();
      await confirmPlanPage.chooseThisPlanPackage(activationInfo);

      expect(await confirmPlanPage.isDBPageDisplay("Confirm plan")).toBeTruthy();
      expect(await confirmPlanPage.isConfirmPlanInfoCorrectly(activationInfo)).toBeTruthy();

      await dashboardPage.clickOnBtnWithLabel("Start plan");
      await confirmPlanPage.waitUntilElementInvisible(confirmPlanPage.getXpathPopupCapcha);
      await confirmPlanPage.waitUntilElementVisible(confirmPlanPage.getXpathPricingPlan);
      expect(await confirmPlanPage.isToastMsgVisible("Confirm plan successfully")).toBeTruthy();
    });

    await test.step("Đi đến trang Balance  > View invoices", async () => {
      await balancePage.goto("admin/balance/history");
      expect(await balancePage.isDBPageDisplay("Invoices")).toBeTruthy();
      expect(await balancePage.isInvoiceCreated(invoiceInfo)).toBeTruthy();
    });
  });

  test("Kiểm tra hoạt động của shop khi chọn Fulfillment plan @SB_BAL_BILL_BFL_450", async ({
    dashboard,
    conf,
    snapshotFixture,
    context,
  }) => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    const picture = conf.caseConf.picture;
    invoiceConditions = conf.caseConf.invoice_conditions;
    invoiceInfoDetail = conf.caseConf.invoice_info_detail;
    transactionConditions = conf.caseConf.transaction_conditions;
    await test.step("Login vào dashboard, navigate đến trang Account => Compare plans", async () => {
      await dashboardPage.goto("admin/pricing");
      expect(
        await dashboardPage.isDBPageDisplay("Your trial has ended, please choose a plan to continue"),
      ).toBeTruthy();
    });

    await test.step("Click vào button Choose this plan bất kỳ", async () => {
      await confirmPlanPage.chooseThisPlanPackage(activationInfo);
      expect(await confirmPlanPage.isDBPageDisplay("Confirm plan")).toBeTruthy();
      expect(await confirmPlanPage.isConfirmPlanInfoCorrectly(activationInfo)).toBeTruthy();
    });

    await test.step(`click button "Start plan"`, async () => {
      await dashboardPage.clickOnBtnWithLabel("Start plan");
      await confirmPlanPage.waitUntilElementInvisible(confirmPlanPage.getXpathPopupCapcha);
      await confirmPlanPage.waitUntilElementVisible(confirmPlanPage.getXpathPricingPlan);
      expect(await dashboardPage.isToastMsgVisible("Confirm plan successfully")).toBeTruthy();
      expect(await confirmPlanPage.isDBPageDisplay("Pick a plan for your store")).toBeTruthy();
    });

    await test.step("Đi đến trang Billing (url: {{domain}}/admin/settings/billing)  > Kiểm tra billing được tạo", async () => {
      await billingPage.goto("admin/settings/billing");
      const currentDatePlan = await billingPage.getCurrentDatePlan();
      expect(currentDatePlan).toEqual(activationInfo.start_date + " - " + activationInfo.end_date);
    });

    await test.step(`Kiểm tra hiển thị Manual topup tại Transaction:
- Truy cập link {{shop_domain}}/admin/balance -> CLick button View transactions > click btn "More filters", filter theo "Subscription fee collecting" (value = subscription_first)`, async () => {
      await balancePage.goToBalance();
      await balancePage.clickBtnViewTransactions();
      await balancePage.filterWithConditionDashboard("More filters", transactionConditions);
      //verify Transaction
      await expect(await invoicePage.verifyDataWithColumnName("Shop Domain", conf.suiteConf.domain)).toBe(true);
      await expect(await invoicePage.verifyDataWithColumnName("Invoice", invoiceInfoDetail.content)).toBe(true);
      await expect(await invoicePage.verifyDataWithColumnName("Status", invoiceInfoDetail.transactions_status)).toBe(
        true,
      );
    });

    await test.step(`Navigate đến trang Balance => click "View invoices" > click btn "More filters", filter theo "Subscription fee collecting" (value = subscription_first) > Click mở Invoice detail, verify invoice detail`, async () => {
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      await invoicePage.filterWithConditionDashboard("More filters", invoiceConditions);
      //click the newest invoice to get value total transaction fee
      [newPage] = await Promise.all([context.waitForEvent("page"), await invoicePage.clickNewestInvoice()]);
      invoiceDetailPage = new InvoiceDetailPage(newPage, "");
      await expect(newPage.locator(invoiceDetailPage.xpathHeadingInvoiceDetailPage)).toBeVisible();
      const amountDisplay = await invoiceDetailPage.getTransactionFee();
      // verify Invoice at Invoice page
      expect(await invoicePage.verifyInvoiceTransactionFee(invoiceInfoDetail, amountDisplay)).toBe(true);
    });

    await test.step("Vào Online Store > Verify hiển thị banner disable password", async () => {
      await dashboardPage.navigateToMenu("Online Store");
      await snapshotFixture.verify({
        page: dashboard,
        selector: dashboardPage.getXpathDisablePasswordOnlineStore,
        snapshotName: picture.picture_online_store,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Vào Online Store > Preferences > Verify hiển thị checkbox Enable password", async () => {
      await dashboardPage.navigateToSubMenu("Online Store", "Preferences");
      await snapshotFixture.verify({
        page: dashboard,
        selector: balancePage.getXpathBannerDisablePassword,
        snapshotName: picture.picture_preferences,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });

    await test.step("Vào Settings > Payment providers > Verify hiển thị payments method", async () => {
      await dashboardPage.goto("admin/settings/payments");
      await snapshotFixture.verify({
        page: dashboard,
        selector: dashboardPage.getXpathWarningPaymentMethod,
        snapshotName: picture.picture_payment_method,
        snapshotOptions: {
          maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
          threshold: defaultSnapshotOptions.threshold,
          maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
        },
      });
    });
  });

  test(`Kiểm tra Confirm plan thành công khi không apply coupon @SB_BAL_BILL_BFL_456`, async () => {
    await test.step(`Login vào dashboard, navigate đến trang Account => Compare plans https://"domain"/admin/pricing`, async () => {
      await dashboardPage.goto("admin/pricing");
      expect(await dashboardPage.isDBPageDisplay("Pick a plan for your store")).toBeTruthy();
    });

    await test.step(`Click button Choose this plan`, async () => {
      await confirmPlanPage.chooseThisPlanPackage(activationInfo);
      expect(await confirmPlanPage.isDBPageDisplay("Confirm plan")).toBeTruthy();
    });

    await test.step(`Kiểm tra cycle + amount của subscription`, async () => {
      expect(await confirmPlanPage.isConfirmPlanInfoCorrectly(activationInfo)).toBeTruthy();
    });
  });

  test(`Kiểm tra Confirm plan  khi apply coupon không thỏa mãn điều kiện @SB_BAL_BILL_BFL_457`, async () => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest") {
      return;
    }
    await test.step(`Login vào dashboard, navigate đến trang Account => Compare plans https://"domain"/admin/pricing`, async () => {
      await dashboardPage.goto("admin/pricing");
      expect(await dashboardPage.isDBPageDisplay("Pick a plan for your store")).toBeTruthy();
    });

    await test.step(`Click button Choose this plan `, async () => {
      await confirmPlanPage.chooseThisPlanPackage(activationInfo);
      expect(await confirmPlanPage.isDBPageDisplay("Confirm plan")).toBeTruthy();
    });

    await test.step(`Nhập coupon không thỏa mãn điều kiện của shop`, async () => {
      await confirmPlanPage.inputCouponDiscount("datatest100day");
      await confirmPlanPage.clickOnBtnWithLabel("Apply");
      expect(await confirmPlanPage.isErrorTextDisplayed("Invalid or expired code.")).toBeTruthy();
    });

    await test.step(`Click Start Plan`, async () => {
      await confirmPlanPage.clickOnBtnWithLabel("Start plan");
      expect(await confirmPlanPage.isErrorTextDisplayed("Please click to Apply to validate your coupon.")).toBeTruthy();
    });

    await test.step(`Nhập coupon thỏa mãn điều kiện của shop`, async () => {
      await confirmPlanPage.inputCouponDiscount(activationInfo.discount_code);
      await confirmPlanPage.clickOnBtnWithLabel("Apply");
      await confirmPlanPage.waitUntilElementInvisible(confirmPlanPage.xpathBtnWithLabel("Apply"));
      expect(await confirmPlanPage.isConfirmPlanInfoCorrectly(activationInfo)).toBeTruthy();
    });
  });

  test(`Kiểm tra Confirm plan thành công khi apply coupon Freetrial @SB_BAL_BILL_BFL_460`, async () => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest") {
      return;
    }
    await test.step(`Login vào dashboard, navigate đến trang Account => Compare plans https://"domain"/admin/pricing`, async () => {
      await dashboardPage.goto("admin/pricing");
      expect(await dashboardPage.isDBPageDisplay("Pick a plan for your store")).toBeTruthy();
    });

    await test.step(`Click button Choose this plan`, async () => {
      await confirmPlanPage.chooseThisPlanPackage(activationInfo);
      expect(await confirmPlanPage.isDBPageDisplay("Confirm plan")).toBeTruthy();
    });

    await test.step(`Nhập coupon , click button Apply`, async () => {
      await confirmPlanPage.inputCouponDiscount(activationInfo.discount_code);
      await confirmPlanPage.clickOnBtnWithLabel("Apply");
      expect(await confirmPlanPage.isConfirmPlanInfoCorrectly(activationInfo)).toBeTruthy();
    });

    await test.step(`Click button Start Plan`, async () => {
      await confirmPlanPage.clickOnBtnWithLabel("Start plan");
      await confirmPlanPage.waitUntilElementInvisible(confirmPlanPage.getXpathPopupCapcha);
      await confirmPlanPage.waitUntilElementVisible(confirmPlanPage.getXpathPricingPlan);
      expect(await dashboardPage.isToastMsgVisible("Confirm plan successfully")).toBeTruthy();
    });
  });
});

test.describe("Billing free trial apply coupon", () => {
  test.beforeEach(async ({ dashboard, conf, request }) => {
    confirmPlanPage = new ConfirmPlanPage(dashboard, conf.suiteConf.domain);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    billingPage = new BillingPage(dashboard, conf.suiteConf.domain);
    invoiceDetailPage = new InvoiceDetailPage(dashboard, conf.suiteConf.domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    accountSettingPage = new AccountSetting(dashboard, conf.suiteConf.domain);
    tools = new Tools();
    test.setTimeout(conf.suiteConf.time_out);
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }

    await test.step("Clean store's date then push free trial info for this store", async () => {
      freeTrialInfo = {
        id: conf.suiteConf.shop_id,
        status: conf.caseConf.free_trial_info.status,
        payment_status: conf.caseConf.free_trial_info.payment_status,
        end_free_trial_at: conf.caseConf.free_trial_info.end_free_trial_at,
        subscription_expired_at: conf.caseConf.free_trial_info.subscription_expired_at,
        end_free_trial_at_minute: conf.caseConf.free_trial_info.end_free_trial_at_minute,
        package_id: conf.caseConf.free_trial_info.package_id,
        created_at: conf.caseConf.free_trial_info.created_at,
      };

      freeTrialInfoClean = {
        id: conf.suiteConf.shop_id,
        status: conf.suiteConf.free_trial_info_clean.status,
        payment_status: conf.suiteConf.free_trial_info_clean.payment_status,
        end_free_trial_at: conf.suiteConf.free_trial_info_clean.end_free_trial_at,
        subscription_expired_at: conf.suiteConf.free_trial_info_clean.subscription_expired_at,
        end_free_trial_at_minute: conf.suiteConf.end_free_trial_at_minute,
        package_id: conf.suiteConf.free_trial_info_clean.package_id,
        created_at: conf.caseConf.free_trial_info.created_at,
      };

      //clean data before run test case
      const response = await tools.updateFreeTrialDate(conf.suiteConf.api, request, freeTrialInfoClean);
      expect(response).toBe(200);

      //setup free trial day
      if (freeTrialInfo) {
        const response = await tools.updateFreeTrialDate(conf.suiteConf.api, request, freeTrialInfo);
        expect(response).toBe(200);
      }

      //clear cache and open new page
      await dashboardPage.clearCachePage();
      dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
      await dashboardPage.login({ email: conf.suiteConf.username, password: conf.suiteConf.password });
    });
  });

  test("@SB_BAL_BILL_BFL_496 Apply coupon later cho new subscription khi shop đang free trial và đã confirm plan với Shopbase", async ({
    conf,
    dashboard,
    authRequest,
  }) => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    await test.step(
      "Tại Account page -> tại 'Save your coupon for the next charge', input coupon vào text filed 'Coupon Code'" +
        "-> click Apply",
      async () => {
        await accountSettingPage.goToAccountSetting();
        if (await accountSettingPage.genLoc(accountSettingPage.xpathTextboxCoupon).isHidden()) {
          return;
        } else {
          await accountSettingPage.applyCouponForNextCharge(conf.caseConf.coupon);
          expect(await accountSettingPage.genLoc(accountSettingPage.xpathTextErrorDiscount).textContent()).toEqual(
            conf.caseConf.text_error,
          );
        }
      },
    );

    await test.step(
      "Go to 'Pick a plan for your store' page -> Click button Choose this plan" +
        "-> choose plan khác cho store (Monthly plan)",
      async () => {
        await confirmPlanPage.gotoPickAPlan();
        priceToPaid = parseFloat(
          await confirmPlanPage.getPricePackageChoosen(conf.suiteConf.basic_plan, conf.suiteConf.time_plan_monthly),
        ).toFixed(2);
        await confirmPlanPage.gotoPickAPlan();
        await confirmPlanPage.chooseTimePlanPackage(conf.suiteConf.basic_plan, conf.suiteConf.time_plan_monthly);
        startNewCycle = formatDate(addDays(2, new Date()), "MMM DD, YYYY");
        textCompare = `After the trial ends, you will pay $${priceToPaid} on ${startNewCycle} for the cycle from ${await cycleDisplayInvoiceDetailWithFreeTrial(
          2,
          "MMM DD, YYYY",
        )}.`;
        expect(await confirmPlanPage.getTextReviewSub("free_trial")).toEqual(textCompare);
      },
    );

    await test.step("Click Confirm changes", async () => {
      await confirmPlanPage.clickConfirmPlan();
      await expect(confirmPlanPage.page.locator(confirmPlanPage.getXpathConfirmPlanSucess)).toBeVisible();
    });

    await test.step(
      "Account page -> tại 'Save your coupon for the next charge', input coupon vào text filed 'Coupon Code'" +
        "-> click Apply",
      async () => {
        await accountSettingPage.goToAccountSetting();
        await accountSettingPage.applyCouponForNextCharge(conf.caseConf.coupon);
        expect(await accountSettingPage.genLoc(accountSettingPage.xpathInfoDiscount).textContent()).toEqual(
          conf.caseConf.info_discount,
        );
      },
    );

    await test.step(
      "- Sử dụng qc-tool để update billling pending" +
        "- Đi đến trang Billing (url: {{domain}}/admin/settings/billing) > Kiểm tra billing được tạo",
      async () => {
        endSubDate = new Date().getTime();
        priceApplyCoupon = (priceToPaid * (100 - conf.caseConf.discount_value)) / 100;
        //apply tool for charge
        storePlanInfo = {
          id: conf.suiteConf.shop_id,
          end_free_trial_at: endSubDate,
          subscription_expired_at: endSubDate,
          charge_sub: true,
        };

        await tools.updateStorePlan(conf.suiteConf.api, authRequest, storePlanInfo);
        await dashboard.reload();
        await billingPage.goToBilling(conf.suiteConf.domain);
        await billingPage.genLoc(billingPage.xpathAllBillsLabel).isVisible();
        //get data invoice 0
        infoCurrentInvoiceBilling = await billingPage.getInvoiceBillingWithIndexByAPI(
          authRequest,
          conf.suiteConf.api,
          conf.suiteConf.shop_id,
          0,
        );
        priceCharge = (await infoCurrentInvoiceBilling.amount).toFixed(2);
        expect(priceApplyCoupon.toFixed(2)).toEqual(priceCharge);
      },
    );

    await test.step("Go to invoice detail page (url link: https://${this.domain}/admin/balance/invoice/${invoiceId})", async () => {
      invoiceInfoData = conf.caseConf.invoice_info;
      invoiceId = await infoCurrentInvoiceBilling.id;
      await invoiceDetailPage.goToInvoiceDetailWithId(invoiceId);
      cycleBill = (await cycleDisplayInvoiceDetailWithFreeTrial(2, "MMM D, YYYY")).replace("to", "-");
      //verify Invoice detail
      invoiceInfo = {
        shop_name: conf.suiteConf.shop_name,
        content: invoiceInfoData.content,
        amount_display: "-" + priceCharge,
        type: invoiceInfoData.type,
        detail: invoiceInfoData.detail,
        transactions_type: invoiceInfoData.transactions_type,
        transactions_content: invoiceInfoData.transactions_content,
        transactions_status: invoiceInfoData.transactions_status,
      };
      expect(await invoiceDetailPage.verifyInvoiceDetailWithText(invoiceInfo, cycleBill, cycleBill)).toBeTruthy();
    });

    await test.step("Quay lại Account page -> tại 'Save your coupon for the next charge' -> Check hiển thị", async () => {
      await dashboard.reload();
      await accountSettingPage.goToAccountSetting();
      expect(await accountSettingPage.genLoc(accountSettingPage.xpathInfoDiscount).isHidden()).toBe(true);
    });
  });
});
