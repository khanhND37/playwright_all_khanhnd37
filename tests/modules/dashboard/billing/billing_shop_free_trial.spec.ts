import { expect, test } from "@core/fixtures";
import { ConfirmPlanPage } from "@pages/dashboard/package";
import { loadData } from "@core/conf/conf";
import { Page } from "@playwright/test";
import { BillingPage } from "@pages/dashboard/billing";
import { addDays, addMinutes, formatDate, getUnixTime } from "@utils/datetime";
import { InvoicePage } from "@pages/dashboard/invoice";
import { InvoiceDetailPage } from "@pages/dashboard/invoice_detail";

type ServiceName = {
  page: Page;
  packageName: string;
  title: string;
  value: string;
};
const xpathSticky = "//div[contains(@class,'section sticky-top')]";

let domain: string;

let endFreeTrial;
let subscriptionExpired;
let endFreeTrialAddDays;

let subscriptionExpiredDate;
let subscriptionExpiredDateUTC;

let periodStart;
let periodEnd;
let isToday: boolean;

let coupon: string;
let couponType: string;
let couponValue: number;
let priceAfterDiscount: string;

let invoiceContent: string;
let invoiceStatus: string;
let invoiceType: string;
let invoiceDetail: string;

let transactionContent: string;
let transactionStatus: string;
let transactionType: string;

const verifyServiceByPackageName = async (sv: ServiceName) => {
  if (sv.value != "") {
    const xpathPackage = `//div[@class='pricing'][descendant-or-self::div[normalize-space()='${sv.packageName}']]`;
    await expect(
      sv.page.locator(
        `${xpathPackage}//div[@class='price-body-no-sb']//span[normalize-space()='${sv.title}']/following-sibling::*`,
      ),
    ).toContainText(sv.value);
  }
};

test.describe("Billing Full Flow", () => {
  test.beforeEach(async ({ api, conf }) => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    test.setTimeout(conf.suiteConf.timeout);
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    await test.step("Pre-condition - update shop status", async () => {
      const data = conf.caseConf.data;

      if (data.request.data.end_free_trial_at != null || data.request.data.end_free_trial_at != undefined) {
        endFreeTrialAddDays = data.request.data.end_free_trial_at;
        if (
          data.request.data.end_free_trial_at_minute != null ||
          data.request.data.end_free_trial_at_minute != undefined
        ) {
          endFreeTrial = getUnixTime(addMinutes(data.request.data.end_free_trial_at_minute)) / 1000;
          subscriptionExpired = getUnixTime(addMinutes(data.request.data.subscription_expired_at_minute)) / 1000;
          data.request.data.end_free_trial_at = endFreeTrial;
          data.request.data.subscription_expired_at = subscriptionExpired;
          isToday = true;
        } else {
          endFreeTrial = getUnixTime(addDays(data.request.data.end_free_trial_at)) / 1000;
          subscriptionExpired = getUnixTime(addDays(data.request.data.subscription_expired_at)) / 1000;
          data.request.data.end_free_trial_at = endFreeTrial;
          data.request.data.subscription_expired_at = subscriptionExpired;
          isToday = false;
        }
      }

      const response = await api.request(data);
      expect(response.ok).toBeTruthy();

      subscriptionExpiredDate = new Date(subscriptionExpired * 1000);
      subscriptionExpiredDateUTC = new Date(
        subscriptionExpiredDate.getTime() + subscriptionExpiredDate.getTimezoneOffset() * 60000,
      );
      periodStart = formatDate(subscriptionExpiredDateUTC, "MMM DD, YYYY");
      periodEnd = formatDate(addDays(30, subscriptionExpiredDateUTC), "MMM DD, YYYY");
    });
  });

  test("Kiểm tra Activate plan với shop ShopBase chưa hết free-trial - @SB_BAL_BILL_BFL_448", async ({
    dashboard,
    conf,
    api,
  }) => {
    const data = loadData(__dirname, "SB_BAL_BILL_BFL_448");

    const confirmPlanPage = new ConfirmPlanPage(dashboard, conf.caseConf.domain);
    const billingPage = new BillingPage(dashboard, conf.caseConf.domain);

    await test.step("Login vào Dashboard của shop", async () => {
      await confirmPlanPage.waitUntilElementVisible("//div[contains(@class,'trial-box')]");
      const trialText = await confirmPlanPage.getTextContent(".trial-text");
      let expTrialText = conf.suiteConf.confirm_plan.time_left_in_your_trial;
      expTrialText = expTrialText.replace("{day_count}", endFreeTrialAddDays);
      expect(trialText.replace(/\s\s+/g, " ")).toEqual(expTrialText);
    });

    await test.step("Click button Select a plan", async () => {
      await confirmPlanPage.clickOnBtnWithLabel("Select a plan");
      await confirmPlanPage.waitForSettingAccountPage();
      await expect(await dashboard.locator("//button[normalize-space()='Upgrade plan']")).toBeVisible();
    });

    await test.step("click button Upgrade plan", async () => {
      await confirmPlanPage.clickOnBtnWithLabel("Upgrade plan");
      await confirmPlanPage.waitForPricingPage();
      await expect(dashboard.locator("//div[contains(@class,'pricing-page')]//h2")).toHaveText(
        conf.suiteConf.pricing.pick_a_plan_for_your_store,
      );
      await expect(dashboard.locator("//div[contains(@class,'pricing-page')]//h3")).toHaveText(
        conf.suiteConf.pricing.more_features,
      );
      const actText = await confirmPlanPage.getTextContent(
        "//div[contains(@class,'pricing-page')]//div[contains(@class,'text-normal')]",
      );

      let expText = conf.suiteConf.pricing.shopbase_isnt_your_thing;
      expText = expText.replace("{date}", formatDate(subscriptionExpired, "MMM D, YYYY"));
      expect(actText.replace(/\s\s+/g, " ")).toEqual(expText);
      await confirmPlanPage.waitForPackageGroup();

      for (let i = 0; i < data.caseConf.packages.length; i++) {
        const packageName = data.caseConf.packages[i].package_name;
        const price = data.caseConf.packages[i].price;
        const staffAccounts = data.caseConf.packages[i].staff_accounts;
        const transactionFee = data.caseConf.packages[i].transaction_fee;
        const domain = data.caseConf.packages[i].domain;

        const xpathPackage = `//div[@class='pricing'][descendant-or-self::div[normalize-space()='${packageName}']]`;
        await expect(await dashboard.locator(xpathPackage)).toBeVisible();
        await expect(
          dashboard.locator(
            xpathPackage + `//div[@class='pricing-header']//div[@class='price' or @class='price-free']`,
          ),
        ).toContainText(price.toString());

        for (const t of new Array<{ title: string; value: string }>(
          {
            title: "Staff accounts",
            value: staffAccounts.toString(),
          },
          {
            title: "Transaction fee:",
            value: transactionFee,
          },
          {
            title: "Domains:",
            value: domain.toString(),
          },
        )) {
          await verifyServiceByPackageName({
            page: dashboard,
            packageName: packageName,
            title: t.title,
            value: t.value,
          });
        }
      }
    });

    await test.step(`click button Choose this plan tại package bất kỳ - ${conf.caseConf.plan}`, async () => {
      await confirmPlanPage.choosePlan(conf.caseConf.plan);
      await confirmPlanPage.waitConfirmPlanPage();
      await expect(
        dashboard.locator(`${xpathSticky}//span[normalize-space()='Package:']/following-sibling::span`),
      ).toHaveText(conf.caseConf.plan + " - " + conf.caseConf.period);
      await expect(
        dashboard.locator(`${xpathSticky}//span[normalize-space()='Price:']/following-sibling::div//span`),
      ).toHaveText(conf.caseConf.price);

      const actualMsg = await confirmPlanPage.getTextContent(`(${xpathSticky}/p)[1]`);
      let expectedMsg = conf.suiteConf.confirm_plan.no_current_plan_charge_result.in_free_trial;

      periodStart = formatDate(subscriptionExpiredDate, "MMM D, YYYY");
      periodEnd = formatDate(addDays(30, subscriptionExpiredDate), "MMM D, YYYY");

      expectedMsg = expectedMsg
        .replace("{price_on_time}", conf.caseConf.price + " on " + periodStart)
        .replace("{period_start}", periodStart)
        .replace("{period_end}", periodEnd);

      expect(actualMsg.replace(/\s\s+/g, " ")).toEqual(expectedMsg);

      const textInformSafe = await confirmPlanPage.getTextContent(
        `${xpathSticky}/p[contains(@class,'text-samll text-gray400')]`,
      );
      expect(textInformSafe.replace(/\s\s+/g, " ")).toEqual(
        conf.suiteConf.confirm_plan.no_current_plan_charge_result.this_is_secure_by_128_bit,
      );
    });

    await test.step("Click Start plan", async () => {
      await confirmPlanPage.clickOnBtnWithLabel(conf.suiteConf.confirm_plan.start_plan);
      await dashboard.waitForSelector("//*[normalize-space()='Confirm plan successfully']");
      await confirmPlanPage.waitForPricingPage();
      await expect(dashboard.locator("//div[contains(@class,'s-alert__content')]")).toHaveText(
        `You are currently on the ${conf.caseConf.plan} plan and you are billed monthly.`,
      );
    });

    await test.step("Update subscription to charge", async () => {
      const data = conf.caseConf.data_update;
      if (data.request.data.end_free_trial_at != null || data.request.data.end_free_trial_at != undefined) {
        endFreeTrialAddDays = data.request.data.end_free_trial_at;
        endFreeTrial = getUnixTime(addDays(data.request.data.end_free_trial_at)) / 1000;
        subscriptionExpired = getUnixTime(addDays(data.request.data.subscription_expired_at)) / 1000;
        data.request.data.end_free_trial_at = endFreeTrial;
        data.request.data.subscription_expired_at = subscriptionExpired;
      }
      const response = await api.request(data);
      expect(response.status).toEqual(conf.caseConf.data.response.status);

      subscriptionExpiredDate = new Date(subscriptionExpired * 1000);
      subscriptionExpiredDateUTC = new Date(
        subscriptionExpiredDate.getTime() + subscriptionExpiredDate.getTimezoneOffset() * 60000,
      );
    });

    await test.step("Kiểm tra Bill mới được tạo", async () => {
      await dashboard.goto(`https://${conf.caseConf.domain}/admin/settings/billing`);
      await dashboard.waitForLoadState("load");
      await billingPage.waitForBillingTable();

      periodStart = formatDate(subscriptionExpiredDateUTC, "MMM D, YYYY");
      periodEnd = formatDate(addDays(30, subscriptionExpiredDateUTC), "MMM D, YYYY");

      expect(await billingPage.getDataByColumnLabel("Type", 1)).toEqual("Subscription fee");
      expect(await billingPage.getDataByColumnLabel("Name", 1)).toEqual(`${periodStart} - ${periodEnd}`);
      expect(await billingPage.getDataByColumnLabel("Amount", 1)).toEqual(conf.caseConf.price);

      const actualDate = await billingPage.getDataByColumnLabel("Created", 1);
      await expect(actualDate.includes("Just now") || actualDate.includes("minute") || actualDate.includes("minutes"))
        .toBeTruthy;
      expect(await billingPage.getDataByColumnLabel("Status", 1)).toContain("Paid");
    });
  });

  test("Kiểm tra Confirm plan thành công khi không apply coupon - @SB_BAL_BILL_BFL_456", async ({
    dashboard,
    conf,
  }) => {
    const data = loadData(__dirname, "SB_BAL_BILL_BFL_456");
    const confirmPlanPage = new ConfirmPlanPage(dashboard, conf.caseConf.domain);

    await test.step("Login vào dashboard, navigate đến trang Account => Compare plans", async () => {
      await confirmPlanPage.waitUntilElementVisible("//div[contains(@class,'trial-box')]");
      const trialText = await confirmPlanPage.getTextContent(".trial-text");
      let expTrialText = conf.suiteConf.confirm_plan.time_left_in_your_trial;
      if (endFreeTrialAddDays === 1) {
        expTrialText = expTrialText.replace("days", "day");
      }
      expTrialText = expTrialText.replace("{day_count}", endFreeTrialAddDays);
      expect(trialText.replace(/\s\s+/g, " ")).toEqual(expTrialText);

      await confirmPlanPage.clickOnBtnWithLabel("Select a plan");
      await confirmPlanPage.waitForSettingAccountPage();
      await expect(await dashboard.locator("//button[normalize-space()='Upgrade plan']")).toBeVisible();

      await confirmPlanPage.clickOnBtnWithLabel("Upgrade plan");
      await confirmPlanPage.waitForPricingPage();
      await expect(dashboard.locator("//div[contains(@class,'pricing-page')]//h2")).toHaveText(
        conf.suiteConf.pricing.pick_a_plan_for_your_store,
      );
      await expect(dashboard.locator("//div[contains(@class,'pricing-page')]//h3")).toHaveText(
        conf.suiteConf.pricing.more_features,
      );
      const actText = await confirmPlanPage.getTextContent(
        "//div[contains(@class,'pricing-page')]//div[contains(@class,'text-normal')]",
      );

      let expText = conf.suiteConf.pricing.shopbase_isnt_your_thing;
      if (isToday === true) {
        expText = expText.replace("{date}", "Today");
      } else {
        expText = expText.replace("{date}", formatDate(subscriptionExpired, "MMM D, YYYY"));
      }
      expect(actText.replace(/\s\s+/g, " ")).toEqual(expText);
      await confirmPlanPage.waitForPackageGroup();

      for (let i = 0; i < data.caseConf.packages.length; i++) {
        const packageName = data.caseConf.packages[i].package_name;
        const price = data.caseConf.packages[i].price;
        const staffAccounts = data.caseConf.packages[i].staff_accounts;
        const transactionFee = data.caseConf.packages[i].transaction_fee;
        const domain = data.caseConf.packages[i].domain;

        const xpathPackage = `//div[@class='pricing'][descendant-or-self::div[normalize-space()='${packageName}']]`;
        await expect(await dashboard.locator(xpathPackage)).toBeVisible();
        await expect(
          dashboard.locator(
            xpathPackage + `//div[@class='pricing-header']//div[@class='price' or @class='price-free']`,
          ),
        ).toContainText(price.toString());

        for (const t of new Array<{ title: string; value: string }>(
          {
            title: "Staff accounts",
            value: staffAccounts.toString(),
          },
          {
            title: "Transaction fee:",
            value: transactionFee,
          },
          {
            title: "Domains:",
            value: domain.toString(),
          },
        )) {
          await verifyServiceByPackageName({
            page: dashboard,
            packageName: packageName,
            title: t.title,
            value: t.value,
          });
        }
      }
    });

    await test.step(`Click button Choose this plan - ${conf.caseConf.plan}`, async () => {
      await confirmPlanPage.choosePlan(conf.caseConf.plan);
      await confirmPlanPage.waitConfirmPlanPage();
    });

    await test.step(`Kiểm tra cycle của subscription`, async () => {
      await expect(
        dashboard.locator(`${xpathSticky}//span[normalize-space()='Package:']/following-sibling::span`),
      ).toHaveText(conf.caseConf.plan + " - " + conf.caseConf.period);

      const actualMsg = await confirmPlanPage.getTextContent(`(${xpathSticky}/p)[1]`);
      let expectedMsg = conf.suiteConf.confirm_plan.no_current_plan_charge_result.in_free_trial;

      periodStart = formatDate(subscriptionExpiredDate, "MMM D, YYYY");
      periodEnd = formatDate(addDays(30, subscriptionExpiredDate), "MMM D, YYYY");

      if (isToday === true) {
        expectedMsg = expectedMsg
          .replace("{price_on_time}", conf.caseConf.price + " on " + "Today")
          .replace("{period_start}", "Today")
          .replace("{period_end}", periodEnd);
      } else {
        expectedMsg = expectedMsg
          .replace("{price_on_time}", conf.caseConf.price + " on " + periodStart)
          .replace("{period_start}", periodStart)
          .replace("{period_end}", periodEnd);
      }

      expect(actualMsg.replace(/\s\s+/g, " ")).toEqual(expectedMsg);

      const textInformSafe = await confirmPlanPage.getTextContent(
        `${xpathSticky}/p[contains(@class,'text-samll text-gray400')]`,
      );
      expect(textInformSafe.replace(/\s\s+/g, " ")).toEqual(
        conf.suiteConf.confirm_plan.no_current_plan_charge_result.this_is_secure_by_128_bit,
      );
    });

    await test.step(`Kiểm tra amount của subscription`, async () => {
      await expect(
        dashboard.locator(`${xpathSticky}//span[normalize-space()='Price:']/following-sibling::div//span`),
      ).toHaveText(conf.caseConf.price);
    });
  });

  test("Kiểm tra Apply coupon thỏa mãn điều kiện khi confirm plan - @SB_BAL_BILL_BFL_458", async ({
    dashboard,
    conf,
  }) => {
    const data = loadData(__dirname, "SB_BAL_BILL_BFL_458");
    const confirmPlanPage = new ConfirmPlanPage(dashboard, conf.caseConf.domain);

    await test.step("Login vào dashboard, navigate đến trang Account => Compare plans", async () => {
      await confirmPlanPage.waitUntilElementVisible("//div[contains(@class,'trial-box')]");
      const trialText = await confirmPlanPage.getTextContent(".trial-text");
      let expTrialText = conf.suiteConf.confirm_plan.time_left_in_your_trial;
      if (endFreeTrialAddDays === 1) {
        expTrialText = expTrialText.replace("days", "day");
      }
      expTrialText = expTrialText.replace("{day_count}", endFreeTrialAddDays);
      expect(trialText.replace(/\s\s+/g, " ")).toEqual(expTrialText);

      await confirmPlanPage.clickOnBtnWithLabel("Select a plan");
      await confirmPlanPage.waitForSettingAccountPage();
      await expect(await dashboard.locator("//button[normalize-space()='Upgrade plan']")).toBeVisible();

      await confirmPlanPage.clickOnBtnWithLabel("Upgrade plan");
      await confirmPlanPage.waitForPricingPage();
      await expect(dashboard.locator("//div[contains(@class,'pricing-page')]//h2")).toHaveText(
        conf.suiteConf.pricing.pick_a_plan_for_your_store,
      );
      await expect(dashboard.locator("//div[contains(@class,'pricing-page')]//h3")).toHaveText(
        conf.suiteConf.pricing.more_features,
      );
      const actText = await confirmPlanPage.getTextContent(
        "//div[contains(@class,'pricing-page')]//div[contains(@class,'text-normal')]",
      );

      let expText = conf.suiteConf.pricing.shopbase_isnt_your_thing;
      if (isToday === true) {
        expText = expText.replace("{date}", "Today");
      } else {
        expText = expText.replace("{date}", formatDate(subscriptionExpired, "MMM D, YYYY"));
      }
      expect(actText.replace(/\s\s+/g, " ")).toEqual(expText);
      await confirmPlanPage.waitForPackageGroup();

      for (let i = 0; i < data.caseConf.packages.length; i++) {
        const packageName = data.caseConf.packages[i].package_name;
        const price = data.caseConf.packages[i].price;
        const staffAccounts = data.caseConf.packages[i].staff_accounts;
        const transactionFee = data.caseConf.packages[i].transaction_fee;
        const domain = data.caseConf.packages[i].domain;

        const xpathPackage = `//div[@class='pricing'][descendant-or-self::div[normalize-space()='${packageName}']]`;
        await expect(await dashboard.locator(xpathPackage)).toBeVisible();
        await expect(
          dashboard.locator(
            xpathPackage + `//div[@class='pricing-header']//div[@class='price' or @class='price-free']`,
          ),
        ).toContainText(price.toString());

        for (const t of new Array<{ title: string; value: string }>(
          {
            title: "Staff accounts",
            value: staffAccounts.toString(),
          },
          {
            title: "Transaction fee:",
            value: transactionFee,
          },
          {
            title: "Domains:",
            value: domain.toString(),
          },
        )) {
          await verifyServiceByPackageName({
            page: dashboard,
            packageName: packageName,
            title: t.title,
            value: t.value,
          });
        }
      }
    });

    await test.step(`Click button Choose this plan - ${conf.caseConf.plan}`, async () => {
      await confirmPlanPage.choosePlan(conf.caseConf.plan);
      await confirmPlanPage.waitConfirmPlanPage();
    });

    await test.step(`Nhập coupon, click button Apply`, async () => {
      coupon = conf.caseConf.coupon;
      couponType = conf.caseConf.coupon_type;
      couponValue = conf.caseConf.coupon_value;

      await confirmPlanPage.inputCouponDiscount(coupon);
      await confirmPlanPage.clickOnBtnWithLabel(conf.suiteConf.confirm_plan.apply);

      const priceValue = parseFloat(conf.caseConf.price.replace("$", ""));

      if (couponType === "percentage") {
        priceAfterDiscount = "$" + (priceValue * (1 - couponValue / 100)).toFixed(2);
      } else {
        priceAfterDiscount = conf.caseConf.price;
      }

      await expect(
        dashboard.locator(
          xpathSticky +
            `//span[normalize-space()='Discount code:']/following-sibling::div//span[not(contains(@class,'icon'))]`,
        ),
      ).toHaveText(coupon);
      await expect(
        dashboard.locator(
          xpathSticky + `//span[normalize-space()='Price:']/following-sibling::div//span[contains(@class,'text-bold')]`,
        ),
      ).toHaveText(priceAfterDiscount);
      await expect(
        dashboard.locator(
          xpathSticky +
            `//span[normalize-space()='Price:']/following-sibling::div//span[contains(@class,'text-line-though')]`,
        ),
      ).toHaveText(conf.caseConf.price);

      const actualMsg = await confirmPlanPage.getTextContent(`(${xpathSticky}/p)[1]`);
      const applyCouponMsg = conf.suiteConf.confirm_plan.no_current_plan_charge_result.apply_coupon;
      let expectedMsg = conf.suiteConf.confirm_plan.no_current_plan_charge_result.in_free_trial;

      periodStart = formatDate(subscriptionExpiredDate, "MMM D, YYYY");
      periodEnd = formatDate(addDays(30, subscriptionExpiredDate), "MMM D, YYYY");

      if (isToday === true) {
        expectedMsg =
          applyCouponMsg +
          " " +
          expectedMsg
            .replace("{price_on_time}", priceAfterDiscount + " on " + "Today")
            .replace("{period_start}", "Today")
            .replace("{period_end}", periodEnd);
      } else {
        expectedMsg =
          applyCouponMsg +
          " " +
          expectedMsg
            .replace("{price_on_time}", priceAfterDiscount + " on " + periodStart)
            .replace("{period_start}", periodStart)
            .replace("{period_end}", periodEnd);
      }

      expect(actualMsg.replace(/\s\s+/g, " ")).toEqual(expectedMsg);
    });
  });

  test("Kiểm tra apply coupon Percentage khi Confirm plan - @SB_BAL_BILL_BFL_459", async ({ dashboard, conf, api }) => {
    const data = loadData(__dirname, "SB_BAL_BILL_BFL_459");
    const confirmPlanPage = new ConfirmPlanPage(dashboard, conf.caseConf.domain);

    await test.step("Login vào dashboard, navigate đến trang Account => Compare plans", async () => {
      await confirmPlanPage.waitUntilElementVisible("//div[contains(@class,'trial-box')]");
      const trialText = await confirmPlanPage.getTextContent(".trial-text");
      let expTrialText = conf.suiteConf.confirm_plan.time_left_in_your_trial;
      if (endFreeTrialAddDays === 1) {
        expTrialText = expTrialText.replace("days", "day");
      }
      expTrialText = expTrialText.replace("{day_count}", endFreeTrialAddDays);
      expect(trialText.replace(/\s\s+/g, " ")).toEqual(expTrialText);

      await confirmPlanPage.clickOnBtnWithLabel("Select a plan");
      await confirmPlanPage.waitForSettingAccountPage();
      await expect(await dashboard.locator("//button[normalize-space()='Upgrade plan']")).toBeVisible();

      await confirmPlanPage.clickOnBtnWithLabel("Upgrade plan");
      await confirmPlanPage.waitForPricingPage();
      await expect(dashboard.locator("//div[contains(@class,'pricing-page')]//h2")).toHaveText(
        conf.suiteConf.pricing.pick_a_plan_for_your_store,
      );
      await expect(dashboard.locator("//div[contains(@class,'pricing-page')]//h3")).toHaveText(
        conf.suiteConf.pricing.more_features,
      );
      const actText = await confirmPlanPage.getTextContent(
        "//div[contains(@class,'pricing-page')]//div[contains(@class,'text-normal')]",
      );

      let expText = conf.suiteConf.pricing.shopbase_isnt_your_thing;
      if (isToday === true) {
        expText = expText.replace("{date}", "Today");
      } else {
        expText = expText.replace("{date}", formatDate(subscriptionExpired, "MMM D, YYYY"));
      }
      expect(actText.replace(/\s\s+/g, " ")).toEqual(expText);
      await confirmPlanPage.waitForPackageGroup();

      for (let i = 0; i < data.caseConf.packages.length; i++) {
        const packageName = data.caseConf.packages[i].package_name;
        const price = data.caseConf.packages[i].price;
        const staffAccounts = data.caseConf.packages[i].staff_accounts;
        const transactionFee = data.caseConf.packages[i].transaction_fee;
        const domain = data.caseConf.packages[i].domain;

        const xpathPackage = `//div[@class='pricing'][descendant-or-self::div[normalize-space()='${packageName}']]`;
        await expect(await dashboard.locator(xpathPackage)).toBeVisible();
        await expect(
          dashboard.locator(
            xpathPackage + `//div[@class='pricing-header']//div[@class='price' or @class='price-free']`,
          ),
        ).toContainText(price.toString());

        for (const t of new Array<{ title: string; value: string }>(
          {
            title: "Staff accounts",
            value: staffAccounts.toString(),
          },
          {
            title: "Transaction fee:",
            value: transactionFee,
          },
          {
            title: "Domains:",
            value: domain.toString(),
          },
        )) {
          await verifyServiceByPackageName({
            page: dashboard,
            packageName: packageName,
            title: t.title,
            value: t.value,
          });
        }
      }
    });

    await test.step(`Click button Choose this plan - ${conf.caseConf.plan}`, async () => {
      await confirmPlanPage.choosePlan(conf.caseConf.plan);
      await confirmPlanPage.waitConfirmPlanPage();
    });

    await test.step(`Nhập coupon, click button Apply`, async () => {
      const coupon = conf.caseConf.coupon;
      await confirmPlanPage.inputCouponDiscount(coupon);
      await confirmPlanPage.clickOnBtnWithLabel(conf.suiteConf.confirm_plan.apply);

      await expect(
        dashboard.locator(
          xpathSticky +
            `//span[normalize-space()='Discount code:']/following-sibling::div//span[not(contains(@class,'icon'))]`,
        ),
      ).toHaveText(coupon);
    });

    await test.step(`Kiểm tra amount của subscription fee`, async () => {
      couponType = conf.caseConf.coupon_type;
      couponValue = conf.caseConf.coupon_value;

      const priceValue = parseFloat(conf.caseConf.price.replace("$", ""));

      if (couponType === "percentage") {
        priceAfterDiscount = "$" + (priceValue * (1 - couponValue / 100)).toFixed(2);
      } else {
        priceAfterDiscount = conf.caseConf.price;
      }

      await expect(
        dashboard.locator(
          xpathSticky + `//span[normalize-space()='Price:']/following-sibling::div//span[contains(@class,'text-bold')]`,
        ),
      ).toHaveText(priceAfterDiscount);
      await expect(
        dashboard.locator(
          xpathSticky +
            `//span[normalize-space()='Price:']/following-sibling::div//span[contains(@class,'text-line-though')]`,
        ),
      ).toHaveText(conf.caseConf.price);
    });

    await test.step(`Kiểm tra cycle của subscription`, async () => {
      const actualMsg = await confirmPlanPage.getTextContent(`(${xpathSticky}/p)[1]`);
      const applyCouponMsg = conf.suiteConf.confirm_plan.no_current_plan_charge_result.apply_coupon;
      let expectedMsg = conf.suiteConf.confirm_plan.no_current_plan_charge_result.in_free_trial;

      periodStart = formatDate(subscriptionExpiredDate, "MMM D, YYYY");
      periodEnd = formatDate(addDays(30, subscriptionExpiredDate), "MMM D, YYYY");

      if (isToday === true) {
        expectedMsg =
          applyCouponMsg +
          " " +
          expectedMsg
            .replace("{price_on_time}", priceAfterDiscount + " on " + "Today")
            .replace("{period_start}", "Today")
            .replace("{period_end}", periodEnd);
      } else {
        expectedMsg =
          applyCouponMsg +
          " " +
          expectedMsg
            .replace("{price_on_time}", priceAfterDiscount + " on " + periodStart)
            .replace("{period_start}", periodStart)
            .replace("{period_end}", periodEnd);
      }

      expect(actualMsg.replace(/\s\s+/g, " ")).toEqual(expectedMsg);
    });

    await test.step(`Click button Start Plan`, async () => {
      await confirmPlanPage.clickOnBtnWithLabel(conf.suiteConf.confirm_plan.start_plan);
      await dashboard.waitForSelector("//*[normalize-space()='Confirm plan successfully']");
      await confirmPlanPage.waitForPricingPage();
      await expect(dashboard.locator("//div[contains(@class,'s-alert__content')]")).toHaveText(
        `You are currently on the ${conf.caseConf.plan} plan and you are billed monthly.`,
      );
    });

    await test.step("Update subscription to charge", async () => {
      const data = conf.caseConf.data_update;
      if (data.request.data.end_free_trial_at != null || data.request.data.end_free_trial_at != undefined) {
        endFreeTrialAddDays = data.request.data.end_free_trial_at;
        endFreeTrial = getUnixTime(addDays(data.request.data.end_free_trial_at)) / 1000;
        subscriptionExpired = getUnixTime(addDays(data.request.data.subscription_expired_at)) / 1000;
        data.request.data.end_free_trial_at = endFreeTrial;
        data.request.data.subscription_expired_at = subscriptionExpired;
      }
      const response = await api.request(data);
      expect(response.status).toEqual(conf.caseConf.data.response.status);

      subscriptionExpiredDate = new Date(subscriptionExpired * 1000);
      subscriptionExpiredDateUTC = new Date(
        subscriptionExpiredDate.getTime() + subscriptionExpiredDate.getTimezoneOffset() * 60000,
      );
    });
  });

  test("Kiểm tra Bill và Invoice của subscription khi confirm plan thành công - @SB_BAL_BILL_BFL_461", async ({
    dashboard,
    conf,
    context,
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = loadData(__dirname, "SB_BAL_BILL_BFL_461");
    const confirmPlanPage = new ConfirmPlanPage(dashboard, conf.caseConf.domain);
    const billingPage = new BillingPage(dashboard, conf.caseConf.domain);
    const invoicePage = new InvoicePage(dashboard, conf.caseConf.domain);

    await test.step("Pre-condition - Confirm new plan", async () => {
      await dashboard.goto(`https://${conf.caseConf.domain}/admin/`);
      await expect(
        confirmPlanPage.genLoc(
          `//h2[text()[normalize-space()='${conf.suiteConf.pricing.your_trial_has_ended_choose_plan}']]`,
        ),
      ).toBeVisible();

      await confirmPlanPage.waitForPricingPage();
      await confirmPlanPage.waitForPackageGroup();

      await confirmPlanPage.choosePlan(conf.caseConf.plan);
      await confirmPlanPage.waitConfirmPlanPage();

      periodStart = formatDate(subscriptionExpiredDateUTC, "MMM DD, YYYY");
      periodEnd = formatDate(addDays(30, subscriptionExpiredDateUTC), "MMM DD, YYYY");

      await confirmPlanPage.clickOnBtnWithLabel(conf.suiteConf.confirm_plan.start_plan);
      await dashboard.waitForSelector("//*[normalize-space()='Confirm plan successfully']");
      await confirmPlanPage.waitForPricingPage();
      await expect(dashboard.locator("//div[contains(@class,'s-alert__content')]")).toHaveText(
        `You are currently on the ${conf.caseConf.plan} plan and you are billed monthly.`,
      );
    });

    await test.step("Login vào dashboard, navigate đến trang Setting => Billing", async () => {
      await dashboard.goto(`https://${conf.caseConf.domain}/admin/settings/billing`);
      await expect(dashboard.locator("//h2")).toHaveText("Billing");
    });

    await test.step("Tại bảng All bills,kiểm tra hiển thị các bill", async () => {
      await billingPage.waitForBillingTable();
    });

    await test.step(`Verify thông tin của Bill vừa được tạo sau khi Confirm plan thành công`, async () => {
      expect(await billingPage.getDataByColumnLabel("Type", 1)).toEqual("Subscription fee");
      expect(await billingPage.getDataByColumnLabel("Name", 1)).toEqual(`${periodStart} - ${periodEnd}`);
      expect(await billingPage.getDataByColumnLabel("Amount", 1)).toEqual(conf.caseConf.price);

      const actualDate = await billingPage.getDataByColumnLabel("Created", 1);
      await expect(actualDate.includes("Just now") || actualDate.includes("minute") || actualDate.includes("minutes"))
        .toBeTruthy;
      expect(await billingPage.getDataByColumnLabel("Status", 1)).toContain("Paid");
    });

    await test.step(`Navigate đến trang Balance => Invoices`, async () => {
      await dashboard.goto(`https://${conf.caseConf.domain}/admin/balance/history`);
      await expect(dashboard.locator("//h1")).toHaveText("Invoices");
    });

    await test.step(`Filter invoice và domain`, async () => {
      domain = conf.caseConf.domain;
      const size = conf.caseConf.invoices.length;

      for (let i = 0; i < size; i++) {
        invoiceStatus = conf.caseConf.invoices[i].status;
        invoiceType = conf.caseConf.invoices[i].type;
        invoiceContent = conf.caseConf.invoices[i].content;
        invoiceDetail = conf.caseConf.invoices[i].detail;

        await invoicePage.clickOnBtnWithLabel("More filters");
        await invoicePage.selectFilterDomain(domain);
        await invoicePage.selectFilterInvoiceContent(invoiceContent);
        await invoicePage.clickOnBtnWithLabel("Done");
        await dashboard.waitForLoadState("networkidle");

        await expect(invoicePage.genLoc("//table")).toBeVisible();
        await expect(
          invoicePage.genLoc("//div[contains(@class,'justify-content-around')]//span[@class='s-tag']"),
        ).toContainText(invoiceContent);

        const domainActual = await invoicePage.getDataByColumnLabel("Shop Domain", 1);
        expect(domainActual).toEqual(domain);

        const contentActual = await invoicePage.getDataByColumnLabel("Content", 1);
        expect(contentActual).toEqual(invoiceContent);

        let invoiceAmount: string;
        if (invoiceType === "OUT") {
          invoiceAmount = "-" + conf.caseConf.price;
        } else {
          invoiceAmount = conf.caseConf.price;
        }
        const amountActual = await invoicePage.getDataByColumnLabel("Amount", 1);
        expect(amountActual).toEqual(invoiceAmount);

        const statusActual = await invoicePage.getDataByColumnLabel("Status", 1);
        expect(statusActual).toEqual(invoiceStatus);

        const createDateActual = await invoicePage.getDataByColumnLabel("Created date", 1);
        await expect(
          createDateActual.includes("Just now") ||
            createDateActual.includes("minute") ||
            createDateActual.includes("minutes"),
        ).toBeTruthy();

        const latestTransactionDateActual = await invoicePage.getDataByColumnLabel("Latest transaction date", 1);
        await expect(
          latestTransactionDateActual.includes("Just now") ||
            latestTransactionDateActual.includes("minute") ||
            latestTransactionDateActual.includes("minutes"),
        ).toBeTruthy();
      }
    });

    let invoiceDetailPage: InvoiceDetailPage;
    await test.step(`Click vào invoice mới nhất`, async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator("(//table//tbody//tr)[1]").click(),
      ]);

      invoiceDetailPage = new InvoiceDetailPage(newPage, domain);
      await newPage.waitForLoadState("networkidle");
      await expect(newPage.locator("//h2")).toHaveText("Invoice detail");
    });

    await test.step(`Verify thông tin của Invoice`, async () => {
      const sizeInvoices = conf.caseConf.invoices.length;

      for (let i = 0; i < sizeInvoices; i++) {
        invoiceStatus = conf.caseConf.invoices[i].status;
        invoiceType = conf.caseConf.invoices[i].type;
        invoiceContent = conf.caseConf.invoices[i].content;
        invoiceDetail = conf.caseConf.invoices[i].detail;

        const shopName = domain.split(".")[0];
        const shopNameActual = await invoiceDetailPage.getDataByRowLabel("Shop");
        expect(shopName).toEqual(shopNameActual);

        const contentActual = await invoiceDetailPage.getDataByRowLabel("Content");
        expect(invoiceContent).toEqual(contentActual);

        periodStart = formatDate(subscriptionExpiredDateUTC, "MMM D, YYYY");
        periodEnd = formatDate(addDays(30, subscriptionExpiredDateUTC), "MMM D, YYYY");

        const detailActual = await invoiceDetailPage.getDataByRowLabel("Detail");
        expect(invoiceDetail.replace("{period_start}", periodStart).replace("{period_end}", periodEnd)).toEqual(
          detailActual.replaceAll("  ", " "),
        );

        const typeActual = await invoiceDetailPage.getDataByRowLabel("Type");
        expect(invoiceType).toEqual(typeActual);

        let invoiceAmount: string;
        if (invoiceType === "OUT") {
          invoiceAmount = "-" + conf.caseConf.price;
        } else {
          invoiceAmount = conf.caseConf.price;
        }
        const amountActual = await invoiceDetailPage.getDataByRowLabel("Amount");
        expect(invoiceAmount).toEqual(amountActual);

        const createdDateActual = await invoiceDetailPage.getDataByRowLabel("Created date");
        expect("Today").toEqual(createdDateActual);

        const sizeTransaction = conf.caseConf.invoices[i].transactions.length;

        for (let j = 0; i < sizeTransaction; i++) {
          transactionType = conf.caseConf.invoices[i].transactions[j].type;
          transactionContent = conf.caseConf.invoices[i].transactions[j].content;
          transactionStatus = conf.caseConf.invoices[i].transactions[j].status;

          const transactionTypeActual = await invoiceDetailPage.getDataByColumnLabel("Type", 1);
          expect(transactionType).toEqual(transactionTypeActual);

          const transactionContentActual = await invoiceDetailPage.getDataByColumnLabel("Content", 1);
          expect(transactionContent.replace("{period_start}", periodStart).replace("{period_end}", periodEnd)).toEqual(
            transactionContentActual.replaceAll("  ", " "),
          );

          let transactionAmount: string;
          if (invoiceType === "OUT") {
            transactionAmount = "-" + conf.caseConf.price;
          } else {
            transactionAmount = conf.caseConf.price;
          }
          const transactionAmountActual = await invoiceDetailPage.getDataByRowLabel("Amount");
          expect(transactionAmount).toEqual(transactionAmountActual);

          const transactionStatusActual = await invoiceDetailPage.getDataByColumnLabel("Status", 1);
          expect(transactionStatus).toEqual(transactionStatusActual);

          const transactionDateActual = await invoiceDetailPage.getDataByColumnLabel("Date", 1);
          await expect(
            transactionDateActual.includes("Just now") ||
              transactionDateActual.includes("minute") ||
              transactionDateActual.includes("minutes"),
          ).toBeTruthy();
        }
      }
    });
  });

  // eslint-disable-next-line max-len
  test("Kiểm tra charge subscription lần đầu với shop đã apply coupon khi confirm plan - @SB_BAL_BILL_BFL_468", async ({
    dashboard,
    conf,
    context,
  }) => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = loadData(__dirname, "SB_BAL_BILL_BFL_468");
    const confirmPlanPage = new ConfirmPlanPage(dashboard, conf.caseConf.domain);
    const billingPage = new BillingPage(dashboard, conf.caseConf.domain);
    const invoicePage = new InvoicePage(dashboard, conf.caseConf.domain);

    await test.step("Pre-condition - Confirm new plan", async () => {
      await dashboard.goto(`https://${conf.caseConf.domain}/admin/`);
      await expect(
        confirmPlanPage.genLoc(
          `//h2[text()[normalize-space()='${conf.suiteConf.pricing.your_trial_has_ended_choose_plan}']]`,
        ),
      ).toBeVisible();

      await confirmPlanPage.waitForPricingPage();
      await confirmPlanPage.waitForPackageGroup();

      await confirmPlanPage.choosePlan(conf.caseConf.plan);
      await confirmPlanPage.waitConfirmPlanPage();

      coupon = conf.caseConf.coupon;
      couponType = conf.caseConf.coupon_type;
      couponValue = conf.caseConf.coupon_value;

      await confirmPlanPage.inputCouponDiscount(coupon);
      await confirmPlanPage.clickOnBtnWithLabel(conf.suiteConf.confirm_plan.apply);

      const priceValue = parseFloat(conf.caseConf.price.replace("$", ""));

      if (couponType === "percentage") {
        priceAfterDiscount = "$" + (priceValue * (1 - couponValue / 100)).toFixed(2);
      } else {
        priceAfterDiscount = conf.caseConf.price;
      }

      await expect(
        dashboard.locator(
          xpathSticky +
            `//span[normalize-space()='Discount code:']/following-sibling::div//span[not(contains(@class,'icon'))]`,
        ),
      ).toHaveText(coupon);
      await expect(
        dashboard.locator(
          xpathSticky + `//span[normalize-space()='Price:']/following-sibling::div//span[contains(@class,'text-bold')]`,
        ),
      ).toHaveText(priceAfterDiscount);
      await expect(
        dashboard.locator(
          xpathSticky +
            `//span[normalize-space()='Price:']/following-sibling::div//span[contains(@class,'text-line-though')]`,
        ),
      ).toHaveText(conf.caseConf.price);

      periodStart = formatDate(subscriptionExpiredDateUTC, "MMM DD, YYYY");
      periodEnd = formatDate(addDays(30, subscriptionExpiredDateUTC), "MMM DD, YYYY");

      await confirmPlanPage.clickOnBtnWithLabel(conf.suiteConf.confirm_plan.start_plan);
      await dashboard.waitForSelector("//*[normalize-space()='Confirm plan successfully']");
      await confirmPlanPage.waitForPricingPage();
      await expect(dashboard.locator("//div[contains(@class,'s-alert__content')]")).toHaveText(
        `You are currently on the ${conf.caseConf.plan} plan and you are billed monthly.`,
      );
    });

    await test.step("Login vào dashboard, navigate đến trang Setting => Billing", async () => {
      await dashboard.goto(`https://${conf.caseConf.domain}/admin/settings/billing`);
      await expect(dashboard.locator("//h2")).toHaveText("Billing");
    });

    await test.step(`Kiểm tra bill mới được tạo`, async () => {
      await billingPage.waitForBillingTable();
      expect(await billingPage.getDataByColumnLabel("Type", 1)).toEqual("Subscription fee");
      expect(await billingPage.getDataByColumnLabel("Name", 1)).toEqual(`${periodStart} - ${periodEnd}`);
      expect(await billingPage.getDataByColumnLabel("Amount", 1)).toEqual(priceAfterDiscount);

      const actualDate = await billingPage.getDataByColumnLabel("Created", 1);
      await expect(actualDate.includes("Just now") || actualDate.includes("minute") || actualDate.includes("minutes"))
        .toBeTruthy;
      expect(await billingPage.getDataByColumnLabel("Status", 1)).toContain("Paid");
    });

    await test.step(`Navigate đến trang Balance => Invoices`, async () => {
      await dashboard.goto(`https://${conf.caseConf.domain}/admin/balance/history`);
      await expect(dashboard.locator("//h1")).toHaveText("Invoices");
    });

    await test.step(`Filter invoice và domain`, async () => {
      domain = conf.caseConf.domain;
      const size = conf.caseConf.invoices.length;

      for (let i = 0; i < size; i++) {
        invoiceStatus = conf.caseConf.invoices[i].status;
        invoiceType = conf.caseConf.invoices[i].type;
        invoiceContent = conf.caseConf.invoices[i].content;
        invoiceDetail = conf.caseConf.invoices[i].detail;

        await invoicePage.clickOnBtnWithLabel("More filters");
        await invoicePage.selectFilterDomain(domain);
        await invoicePage.selectFilterInvoiceContent(invoiceContent);
        await invoicePage.clickOnBtnWithLabel("Done");
        await dashboard.waitForLoadState("networkidle");

        await expect(invoicePage.genLoc("//table")).toBeVisible();
        await expect(
          invoicePage.genLoc("//div[contains(@class,'justify-content-around')]//span[@class='s-tag']"),
        ).toContainText(invoiceContent);

        const domainActual = await invoicePage.getDataByColumnLabel("Shop Domain", 1);
        expect(domainActual).toEqual(domain);

        const contentActual = await invoicePage.getDataByColumnLabel("Content", 1);
        expect(contentActual).toEqual(invoiceContent);

        let invoiceAmount: string;
        if (invoiceType === "OUT") {
          invoiceAmount = "-" + priceAfterDiscount;
        } else {
          invoiceAmount = priceAfterDiscount;
        }
        const amountActual = await invoicePage.getDataByColumnLabel("Amount", 1);
        expect(amountActual).toEqual(invoiceAmount);

        const statusActual = await invoicePage.getDataByColumnLabel("Status", 1);
        expect(statusActual).toEqual(invoiceStatus);

        const createDateActual = await invoicePage.getDataByColumnLabel("Created date", 1);
        await expect(
          createDateActual.includes("Just now") ||
            createDateActual.includes("minute") ||
            createDateActual.includes("minutes"),
        ).toBeTruthy();

        const latestTransactionDateActual = await invoicePage.getDataByColumnLabel("Latest transaction date", 1);
        await expect(
          latestTransactionDateActual.includes("Just now") ||
            latestTransactionDateActual.includes("minute") ||
            latestTransactionDateActual.includes("minutes"),
        ).toBeTruthy();
      }
    });

    let invoiceDetailPage: InvoiceDetailPage;

    await test.step(`Verify invoice Subscription fee collecting mới tạo`, async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator("(//table//tbody//tr)[1]").click(),
      ]);

      invoiceDetailPage = new InvoiceDetailPage(newPage, domain);
      await newPage.waitForLoadState("networkidle");
      await expect(newPage.locator("//h2")).toHaveText("Invoice detail");

      const sizeInvoices = conf.caseConf.invoices.length;

      for (let i = 0; i < sizeInvoices; i++) {
        invoiceStatus = conf.caseConf.invoices[i].status;
        invoiceType = conf.caseConf.invoices[i].type;
        invoiceContent = conf.caseConf.invoices[i].content;
        invoiceDetail = conf.caseConf.invoices[i].detail;

        const shopName = domain.split(".")[0];
        const shopNameActual = await invoiceDetailPage.getDataByRowLabel("Shop");
        expect(shopName).toEqual(shopNameActual);

        const contentActual = await invoiceDetailPage.getDataByRowLabel("Content");
        expect(invoiceContent).toEqual(contentActual);

        periodStart = formatDate(subscriptionExpiredDateUTC, "MMM D, YYYY");
        periodEnd = formatDate(addDays(30, subscriptionExpiredDateUTC), "MMM D, YYYY");

        const detailActual = await invoiceDetailPage.getDataByRowLabel("Detail");
        expect(invoiceDetail.replace("{period_start}", periodStart).replace("{period_end}", periodEnd)).toEqual(
          detailActual.replaceAll("  ", " "),
        );

        const typeActual = await invoiceDetailPage.getDataByRowLabel("Type");
        expect(invoiceType).toEqual(typeActual);

        let invoiceAmount: string;
        if (invoiceType === "OUT") {
          invoiceAmount = "-" + priceAfterDiscount;
        } else {
          invoiceAmount = priceAfterDiscount;
        }
        const amountActual = await invoiceDetailPage.getDataByRowLabel("Amount");
        expect(invoiceAmount).toEqual(amountActual);

        const createdDateActual = await invoiceDetailPage.getDataByRowLabel("Created date");
        expect("Today").toEqual(createdDateActual);

        const sizeTransaction = conf.caseConf.invoices[i].transactions.length;

        for (let j = 0; i < sizeTransaction; i++) {
          transactionType = conf.caseConf.invoices[i].transactions[j].type;
          transactionContent = conf.caseConf.invoices[i].transactions[j].content;
          transactionStatus = conf.caseConf.invoices[i].transactions[j].status;

          const transactionTypeActual = await invoiceDetailPage.getDataByColumnLabel("Type", 1);
          expect(transactionType).toEqual(transactionTypeActual);

          const transactionContentActual = await invoiceDetailPage.getDataByColumnLabel("Content", 1);
          expect(transactionContent.replace("{period_start}", periodStart).replace("{period_end}", periodEnd)).toEqual(
            transactionContentActual.replaceAll("  ", " "),
          );

          let transactionAmount: string;
          if (invoiceType === "OUT") {
            transactionAmount = "-" + priceAfterDiscount;
          } else {
            transactionAmount = priceAfterDiscount;
          }
          const transactionAmountActual = await invoiceDetailPage.getDataByRowLabel("Amount");
          expect(transactionAmount).toEqual(transactionAmountActual);

          const transactionStatusActual = await invoiceDetailPage.getDataByColumnLabel("Status", 1);
          expect(transactionStatus).toEqual(transactionStatusActual);

          const transactionDateActual = await invoiceDetailPage.getDataByColumnLabel("Date", 1);
          await expect(
            transactionDateActual.includes("Just now") ||
              transactionDateActual.includes("minute") ||
              transactionDateActual.includes("minutes"),
          ).toBeTruthy();
        }
      }
    });
  });
});
