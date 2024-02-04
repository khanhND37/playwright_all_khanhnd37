import { ListingPage } from "@pages/dashboard/partner_dashboard";
import { expect, test } from "@core/fixtures";
import type { AffiliateCommission, DataSummary } from "@types";
import { AccountPage } from "@pages/dashboard/accounts";
import { Page } from "@playwright/test";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { HiveAffiliate } from "@pages/hive/hive_affiliate";
import { PartnerDashboardAPI } from "@pages/api/partner_dashboard_api";
import { getWeekToDateRange } from "@core/utils/datetime";

test.describe("Verify chức năng đăng kí ref qua luồng sign in khi user chưa có promoter", async () => {
  let emails: Array<string>;
  let fprCode: string;
  let summaryDataBefore: DataSummary;
  let email: string;
  let newPage: Page;
  let affiliatePage: ListingPage;
  let partnerPage: ListingPage;
  let todayDate: string;
  let accountPage: AccountPage;
  let newAccountPage: AccountPage;
  let hiveAffiliatePage: HiveAffiliate;
  let dashboardPage: DashboardPage;
  let randomStoreNameRef: string;
  let randomStoreNameNotRef: string;
  let partnerAPI: PartnerDashboardAPI;
  let data: AffiliateCommission;
  const env = process.env.ENV;

  test.beforeEach(async ({ page, conf, browser, hiveSBase, authUserAffiliateRequest, context }) => {
    if (env === "prodtest") {
      // skip on prodtest
      return;
    }
    affiliatePage = new ListingPage(page, conf.suiteConf.domain_sign_up);
    accountPage = new AccountPage(page, conf.suiteConf.domain_sign_up);
    dashboardPage = new DashboardPage(page, conf.suiteConf.domain_sign_up);
    todayDate = new Date().toISOString().slice(0, 10);
    randomStoreNameNotRef = `${conf.suiteConf.accounts_ref.store_name}_${Date.now()}0`;
    randomStoreNameRef = `${conf.suiteConf.accounts_ref.store_name}_${Date.now()}1`;
    emails = [];
    for (let i = 1; i <= 2; i++) {
      await page.goto(`https://${conf.suiteConf.domain_sign_up}`);
      email = await affiliatePage.signUpAffiliate(
        context,
        conf.suiteConf.new_account.password,
        conf.suiteConf.new_account.store_name,
        conf.suiteConf.mailinator,
      );
      emails.push(email);
      await affiliatePage.waitUntilElementVisible(accountPage.xpathTitleAddYourContactPage);
      await accountPage.completeOnboardingSurveyFisrtStore(conf.suiteConf.shop_data);
      await accountPage.page.waitForSelector(accountPage.xpathCreateStoreSuccess);
      await accountPage.page.goto(`https://${conf.suiteConf.accounts_domain}/logout`);
      await dashboardPage.waitUntilElementVisible(accountPage.xpathTitleSignInPage);
    }

    newPage = await browser.newPage();
    partnerPage = new ListingPage(newPage, conf.suiteConf.domain_partner);
    newAccountPage = new AccountPage(newPage, conf.suiteConf.accounts_domain);
    hiveAffiliatePage = new HiveAffiliate(hiveSBase, conf.suiteConf.hive_domain);
    partnerAPI = new PartnerDashboardAPI(conf.suiteConf.api, authUserAffiliateRequest);
    await newAccountPage.login({ email: conf.caseConf.username, password: conf.caseConf.password });
    await partnerPage.waitUntilElementVisible(newAccountPage.xpathSelectShopTitle);
    await partnerPage.goToPartnerDashboard();
    await partnerPage.goto(`/affiliate/${conf.caseConf.affiliate_module_path}`);
    await partnerPage.waitUntilElementVisible(partnerPage.xpathTextShareUniqueLink);
    await partnerPage.page.waitForTimeout(3 * 1000); //wait for page stable

    fprCode = await partnerPage.getFprCodeAffiliate();
    if (conf.caseConf.affiliate_module_path === "shopbase") {
      await partnerPage.page.locator(partnerPage.xpathTextYourCashback).scrollIntoViewIfNeeded();
      summaryDataBefore = await partnerPage.getDataSummaryOfPromoter();
    } else {
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      summaryDataBefore = await partnerPage.getDataSummaryOfPromoter();
    }
    await hiveAffiliatePage.goto("/admin/app/useraffiliatecashback/list");
  });

  // xóa user khỏi group affiliate sau khi đã chạy xong testcase
  test.afterEach(async ({ conf }) => {
    if (env === "prodtest") {
      // skip on prodtest
      return;
    }
    await hiveAffiliatePage.clearAffiliateGroup(conf.caseConf.affiliate_in_hive.affiliate_group_platform);
  });

  test(`[Shopbase] Verify chức năng đăng ký ref của promoter (đã join affiliate group) qua luồng sign in với user chưa có promoter Shopbase @SB_PN_PNAF_13`, async ({
    conf,
    context,
  }) => {
    if (env === "prodtest") {
      // skip on prodtest
      return;
    }
    test.slow();
    const week = getWeekToDateRange("");
    const startDate = new Date(week[0]);
    const endDate = new Date(week[1]);
    const sunday = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - 1) / 1000;
    const saturday = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 1, 23, 59, 59) / 1000;

    data = {
      page: conf.caseConf.data_api.page,
      limit: conf.caseConf.data_api.limit,
      type: conf.caseConf.data_api.type,
      startDate: sunday,
      endDate: saturday,
    };
    await test.step(`Kiểm tra không trở thành ref khi use chỉ sign in và chưa tạo shop`, async () => {
      await accountPage.goto(`${conf.suiteConf.url_sign_in}fpr=${fprCode}`);
      await accountPage.page.waitForTimeout(5 * 1000); //wait for page stable
      await accountPage.inputAccountAndSignIn({ email: emails[0], password: conf.suiteConf.accounts_ref.password });
      await expect(accountPage.genLoc(accountPage.xpathTextSelectAShop)).toHaveText("Select a shop");

      await partnerPage.page.reload();
      await partnerPage.page.locator(partnerPage.xpathTextYourCashback).scrollIntoViewIfNeeded();
      const summaryDataAfter = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataAfter.totalRef).toEqual(summaryDataBefore.totalRef);

      const dataRef = await partnerPage.searchAndGetDataRefShopBase(emails[0], conf.caseConf.status_2);
      expect(dataRef).toEqual("You have no rewards yet");
    });

    await test.step(`Kiểm tra trở thành ref khi user tạo thành công 1 shop (không cần phân biệt shop type nào)`, async () => {
      await accountPage.inputShopNameAndClickBtnCreate(
        context,
        randomStoreNameRef,
        emails[0],
        conf.suiteConf.mailinator,
      );
      await expect(accountPage.genLoc(accountPage.xpathTitleAddYourContactPage)).toHaveText(
        "Let's get to know each other",
      );
      await accountPage.goto(`https://${conf.suiteConf.accounts_domain}/logout`);

      for (let i = 0; i < 5; i++) {
        const totalRef = await partnerAPI.getTotalRefShopBaseInTime(data);
        if (totalRef === summaryDataBefore.totalRef + 1) {
          return totalRef;
        }
        await accountPage.page.waitForTimeout(1000);
      }

      await partnerPage.page.reload();
      await partnerPage.page.locator(partnerPage.xpathTextYourCashback).scrollIntoViewIfNeeded();
      const summaryDataAfter = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataAfter.totalRef).toEqual(summaryDataBefore.totalRef + 1);
      const dataRef = await partnerPage.searchAndGetDataRefShopBase(emails[0], conf.caseConf.status_1);
      expect(dataRef).toEqual(
        expect.objectContaining({
          user: emails[0],
          referDate: todayDate,
          qualifiedCashback: 0,
          holdCashback: 0,
        }),
      );
    });

    await test.step(`Kiểm tra trường hợp join link có param platform khác affiliate group của promoter`, async () => {
      await accountPage.goto(`${conf.suiteConf.url_sign_in}printbase=true&fpr=${fprCode}`);
      await accountPage.page.waitForTimeout(5 * 1000); //wait for page stable
      await accountPage.inputAccountAndSignIn({ email: emails[1], password: conf.suiteConf.accounts_ref.password });
      await accountPage.inputShopNameAndClickBtnCreate(
        context,
        randomStoreNameNotRef,
        emails[1],
        conf.suiteConf.mailinator,
      );
      await expect(accountPage.genLoc(accountPage.xpathTitleAddYourContactPage)).toHaveText(
        "Let's get to know each other",
      );

      await partnerPage.page.reload();
      await partnerPage.page.locator(partnerPage.xpathTextYourCashback).scrollIntoViewIfNeeded();
      const summaryDataAfter = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataAfter.totalRef).toEqual(summaryDataBefore.totalRef + 1);
      const dataRef = await partnerPage.searchAndGetDataRefShopBase(emails[1], conf.caseConf.status_2);
      expect(dataRef).toEqual("You have no rewards yet");

      // vào hive, thêm user vào affiliate group printbase
      await hiveAffiliatePage.filterUserAffiliateCashback("User Email", conf.caseConf.username);
      await hiveAffiliatePage.addAffiliatGroup(
        conf.caseConf.username,
        conf.caseConf.affiliate_in_hive.affiliate_group_platform,
        conf.caseConf.affiliate_in_hive.affiliate_group_name,
      );
      expect(await hiveAffiliatePage.getFlashMessage()).toContain("has been successfully updated.");

      // kiểm tra lại số liệu sb affiliate của promoter sau khi được thêm vào affiliate group printbase
      await partnerPage.page.reload();
      await partnerPage.page.locator(partnerPage.xpathTextYourCashback).scrollIntoViewIfNeeded();
      const summaryDataSBAfterJoinGroup = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataSBAfterJoinGroup.totalRef).toEqual(summaryDataBefore.totalRef + 1);
      const dataRefAfterJoinGroup = await partnerPage.searchAndGetDataRefShopBase(emails[1], conf.caseConf.status_2);
      expect(dataRefAfterJoinGroup).toEqual("You have no rewards yet");

      // kiểm tra lại số liệu pb affiliate của promoter sau khi được thêm vào affiliate group printbase
      await partnerPage.page.click(partnerPage.xpathSubModuleAffiliate(conf.caseConf.affiliate_module));
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      const dataRefPBAfterJoinGroup = await partnerPage.searchAndGetDataRefPrintBase(emails[1], conf.caseConf.status_2);
      expect(dataRefPBAfterJoinGroup).toEqual("You have no rewards yet");
    });
  });

  test(`[Printbase] Verify chức năng đăng ký ref của promoter (đã join affiliate group) qua luồng sign in với user chưa có promoter Printbase @SB_PN_PNAF_29`, async ({
    conf,
    context,
  }) => {
    if (env === "prodtest") {
      // skip on prodtest
      return;
    }
    test.slow();
    let startDate: number;
    let endDate: number;
    const currentDate = new Date();
    const currentDay = currentDate.getDate();

    if (currentDay >= 1 && currentDay <= 15) {
      // Thời gian 00:00:00 ngày 01 tháng này
      startDate = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0) / 1000;
      // Thời gian 23:59:59 ngày 15 tháng này
      endDate = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 15, 23, 59, 59) / 1000;
    } else {
      // Ngày cuối cùng của tháng
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      // Thời gian 00:00:00 ngày 16 tháng này
      startDate = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 16, 0, 0, 0) / 1000;
      // Thời gian 23:59:59 ngày cuối cùng tháng này
      endDate = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), lastDayOfMonth, 23, 59, 59) / 1000;
    }
    data = {
      userId: conf.caseConf.data_api.user_id,
      page: conf.caseConf.data_api.page,
      limit: conf.caseConf.data_api.limit,
      email: conf.caseConf.data_api.email,
      isSearch: conf.caseConf.data_api.is_search,
      platform: conf.caseConf.data_api.platform,
      startDate: startDate,
      endDate: endDate,
    };

    await test.step(`Kiểm tra không trở thành ref khi use chỉ sign in và chưa tạo shop`, async () => {
      await accountPage.goto(`${conf.suiteConf.url_sign_in}printbase=true&fpr=${fprCode}`);
      await accountPage.page.waitForTimeout(5 * 1000); //wait for page stable
      await accountPage.inputAccountAndSignIn({ email: emails[0], password: conf.suiteConf.accounts_ref.password });
      await expect(accountPage.genLoc(accountPage.xpathTextSelectAShop)).toHaveText("Select a shop");

      await partnerPage.page.reload();
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      const summaryDataAfter = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataAfter.totalRef).toEqual(summaryDataBefore.totalRef);

      const dataRef = await partnerPage.searchAndGetDataRefPrintBase(emails[0], conf.caseConf.status_2);
      expect(dataRef).toEqual("You have no rewards yet");
    });

    await test.step(`Kiểm tra trở thành ref khi user tạo thành công 1 shop (không cần phân biệt shop type nào)`, async () => {
      await accountPage.inputShopNameAndClickBtnCreate(
        context,
        randomStoreNameRef,
        emails[0],
        conf.suiteConf.mailinator,
      );
      await expect(accountPage.genLoc(accountPage.xpathTitleAddYourContactPage)).toHaveText(
        "Let's get to know each other",
      );
      await accountPage.goto(`https://${conf.suiteConf.accounts_domain}/logout`);

      for (let i = 0; i < 5; i++) {
        const totalRef = (await partnerAPI.getSummaryCommissionByApi(data)).totalRefInTime;
        if (totalRef === summaryDataBefore.totalRef + 1) {
          return totalRef;
        }
        await accountPage.page.waitForTimeout(1000);
      }

      await partnerPage.page.reload();
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      const summaryDataAfter = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataAfter.totalRef).toEqual(summaryDataBefore.totalRef + 1);

      const dataRef = await partnerPage.searchAndGetDataRefPrintBase(emails[0], conf.caseConf.status_1);
      expect(dataRef).toEqual(
        expect.objectContaining({
          user: emails[0],
          referDate: todayDate,
          qualifiedItemsGB: 0,
          holdItemsGB: 0,
          cashbackGB: 0,
          qualifiedItemsSB: 0,
          holdItemsSB: 0,
          cashbackSB: 0,
          totalCashback: 0,
        }),
      );
    });

    await test.step(`Kiểm tra trường hợp join link có param platform khác affiliate group của promoter`, async () => {
      await accountPage.goto(`${conf.caseConf.url_sign_in_another_param}fpr=${fprCode}`);
      await accountPage.page.waitForTimeout(5 * 1000); //wait for page stable
      await accountPage.inputAccountAndSignIn({ email: emails[1], password: conf.suiteConf.accounts_ref.password });
      await accountPage.inputShopNameAndClickBtnCreate(
        context,
        randomStoreNameNotRef,
        emails[1],
        conf.suiteConf.mailinator,
      );
      await expect(accountPage.genLoc(accountPage.xpathTitleAddYourContactPage)).toHaveText(
        "Let's get to know each other",
      );

      await partnerPage.page.reload();
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      const summaryDataAfter = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataAfter.totalRef).toEqual(summaryDataBefore.totalRef + 1);

      const dataRef = await partnerPage.searchAndGetDataRefPrintBase(emails[1], conf.caseConf.status_2);
      expect(dataRef).toEqual("You have no rewards yet");

      // vào hive, thêm user vào affiliate group printbase
      await hiveAffiliatePage.filterUserAffiliateCashback("User Email", conf.caseConf.username);
      await hiveAffiliatePage.addAffiliatGroup(
        conf.caseConf.username,
        conf.caseConf.affiliate_in_hive.affiliate_group_platform,
        conf.caseConf.affiliate_in_hive.affiliate_group_name,
      );
      expect(await hiveAffiliatePage.getFlashMessage()).toContain("has been successfully updated.");

      // kiểm tra lại số liệu pb affiliate của promoter sau khi được thêm vào affiliate group plusbase
      await partnerPage.page.reload();
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      const summaryDataAfterJoinGroup = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataAfterJoinGroup.totalRef).toEqual(summaryDataBefore.totalRef + 1);
      const dataRefAfterJoinGroup1 = await partnerPage.searchAndGetDataRefPrintBase(emails[1], conf.caseConf.status_2);
      expect(dataRefAfterJoinGroup1).toEqual("You have no rewards yet");

      // kiểm tra lại số liệu plb affiliate của promoter sau khi được thêm vào affiliate group plusbase
      await partnerPage.page.click(partnerPage.xpathSubModuleAffiliate(conf.caseConf.affiliate_module));
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      const dataRefAfterJoinGroup2 = await partnerPage.searchAndGetDataRefPrintBase(emails[1], conf.caseConf.status_2);
      expect(dataRefAfterJoinGroup2).toEqual("No data have been found in this date range");
    });
  });

  test(`[Plusbase] Verify chức năng đăng ký ref của promoter (đã join affiliate group) qua luồng sign in với user chưa có shop Plusbase @SB_PN_PNAF_62`, async ({
    conf,
    context,
  }) => {
    if (env === "prodtest") {
      // skip on prodtest
      return;
    }
    test.slow();
    await test.step(`Kiểm tra không trở thành ref khi use chỉ sign in và chưa tạo shop`, async () => {
      await accountPage.goto(`${conf.suiteConf.url_sign_in}plusbase=true&fpr=${fprCode}`);
      await accountPage.page.waitForTimeout(5 * 1000); //wait for page stable
      await accountPage.inputAccountAndSignIn({ email: emails[0], password: conf.suiteConf.accounts_ref.password });
      await expect(accountPage.genLoc(accountPage.xpathTextSelectAShop)).toHaveText("Select a shop");

      await partnerPage.page.reload();
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      const summaryDataAfter = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataAfter.totalRef).toEqual(summaryDataBefore.totalRef);

      const dataRef = await partnerPage.searchAndGetDataRefPlusBase(emails[0], conf.caseConf.status_2);
      expect(dataRef).toEqual("No data have been found in this date range");
    });

    await test.step(`Kiểm tra trở thành ref khi user tạo thành công 1 shop (không cần phân biệt shop type nào)`, async () => {
      await accountPage.inputShopNameAndClickBtnCreate(
        context,
        randomStoreNameRef,
        emails[0],
        conf.suiteConf.mailinator,
      );
      await expect(accountPage.genLoc(accountPage.xpathTitleAddYourContactPage)).toHaveText(
        "Let's get to know each other",
      );
      await accountPage.goto(`https://${conf.suiteConf.accounts_domain}/logout`);

      await partnerPage.page.reload();
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      const summaryDataAfter = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataAfter.totalRef).toEqual(summaryDataBefore.totalRef);

      const dataRef = await partnerPage.searchAndGetDataRefPlusBase(emails[0], conf.caseConf.status_1);
      expect(dataRef).toEqual("No data have been found in this date range");
    });

    await test.step(`Kiểm tra trường hợp join link có param platform khác affiliate group của promoter`, async () => {
      await accountPage.goto(`${conf.caseConf.url_sign_in_another_param}fpr=${fprCode}`);
      await accountPage.page.waitForTimeout(5 * 1000);
      await accountPage.inputAccountAndSignIn({ email: emails[1], password: conf.suiteConf.accounts_ref.password });
      await accountPage.inputShopNameAndClickBtnCreate(
        context,
        randomStoreNameNotRef,
        emails[1],
        conf.suiteConf.mailinator,
      );
      await expect(accountPage.genLoc(accountPage.xpathTitleAddYourContactPage)).toHaveText(
        "Let's get to know each other",
      );

      await partnerPage.page.reload();
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      const summaryDataAfter = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataAfter.totalRef).toEqual(summaryDataBefore.totalRef);

      const dataRef = await partnerPage.searchAndGetDataRefPlusBase(emails[1], conf.caseConf.status_2);
      expect(dataRef).toEqual("No data have been found in this date range");

      // vào hive, thêm user vào affiliate group plusbase
      await hiveAffiliatePage.filterUserAffiliateCashback("User Email", conf.caseConf.username);
      await hiveAffiliatePage.addAffiliatGroup(
        conf.caseConf.username,
        conf.caseConf.affiliate_in_hive.affiliate_group_platform,
        conf.caseConf.affiliate_in_hive.affiliate_group_name,
      );
      expect(await hiveAffiliatePage.getFlashMessage()).toContain("has been successfully updated.");

      // kiểm tra lại số liệu plb affiliate của promoter sau khi được thêm vào affiliate group printbase
      await partnerPage.page.reload();
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      const summaryDataAfterJoinGroup = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataAfterJoinGroup.totalRef).toEqual(summaryDataBefore.totalRef);
      const dataRefAfterJoinGroup1 = await partnerPage.searchAndGetDataRefPlusBase(emails[1], conf.caseConf.status_2);
      expect(dataRefAfterJoinGroup1).toEqual("No data have been found in this date range");

      // kiểm tra lại số liệu pb affiliate của promoter sau khi được thêm vào affiliate group printbase
      await partnerPage.page.click(partnerPage.xpathSubModuleAffiliate(conf.caseConf.affiliate_module));
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      const dataRefAfterJoinGroup2 = await partnerPage.searchAndGetDataRefPlusBase(emails[1], conf.caseConf.status_2);
      expect(dataRefAfterJoinGroup2).toEqual("You have no rewards yet");
    });
  });
});
