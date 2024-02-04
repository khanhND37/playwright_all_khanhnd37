import { ListingPage } from "@pages/dashboard/partner_dashboard";
import { expect, test } from "@core/fixtures";
import type { AffiliateCommission, DataSummary } from "@types";
import { AccountPage } from "@pages/dashboard/accounts";
import { Page } from "@playwright/test";
import { convertDate, getWeekToDateRange } from "@core/utils/datetime";
import { PartnerDashboardAPI } from "@pages/api/partner_dashboard_api";
import { HiveAffiliate } from "@pages/hive/hive_affiliate";

test.describe("Verify chức năng đăng kí ref thành công của promoter", async () => {
  let fprCode: string;
  let summaryDataBefore: DataSummary;
  let email: string;
  let newPage: Page;
  let affiliatePage: ListingPage;
  let partnerPage: ListingPage;
  let todayDate: string;
  let accountPage: AccountPage;
  let newAccountPage: AccountPage;
  let partnerAPI: PartnerDashboardAPI;
  let data: AffiliateCommission;
  let hiveAffiliatePage: HiveAffiliate;
  const env = process.env.ENV;
  test.beforeEach(async ({ page, conf, browser, hiveSBase, authUserAffiliateRequest }) => {
    if (env === "prodtest") {
      // skip on prodtest
      return;
    }
    affiliatePage = new ListingPage(page, conf.suiteConf.domain_sign_up);
    accountPage = new AccountPage(page, conf.suiteConf.domain_sign_up);
    todayDate = new Date().toISOString().slice(0, 10);

    newPage = await browser.newPage();
    partnerPage = new ListingPage(newPage, conf.suiteConf.domain_partner);
    newAccountPage = new AccountPage(newPage, conf.suiteConf.accounts_domain);
    partnerAPI = new PartnerDashboardAPI(conf.suiteConf.api, authUserAffiliateRequest);
    hiveAffiliatePage = new HiveAffiliate(hiveSBase, conf.suiteConf.hive_domain);
    // đăng nhập account shopbase >> đi đến trang partner dashboard -> get giá trị fprCode theo từng module affiliate
    await newAccountPage.login({ email: conf.caseConf.username, password: conf.caseConf.password });
    await partnerPage.waitUntilElementVisible(newAccountPage.xpathSelectShopTitle);
    await partnerPage.goToPartnerDashboard();
    await partnerPage.goto(`/affiliate/${conf.caseConf.affiliate_module_path}`);
    await partnerPage.waitUntilElementVisible(partnerPage.xpathTextShareUniqueLink);
    await partnerPage.page.waitForTimeout(2 * 1000); //wait for page stable

    fprCode = await partnerPage.getFprCodeAffiliate();
    if (conf.caseConf.affiliate_module_path === "shopbase") {
      await partnerPage.page.locator(partnerPage.xpathTextYourCashback).scrollIntoViewIfNeeded();
      summaryDataBefore = await partnerPage.getDataSummaryOfPromoter();
    } else {
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
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

  test(`[Shopbase] Verify chức năng đăng ký ref của promoter (đã join affiliate group) qua luồng sign up @SB_PN_PNAF_12`, async ({
    conf,
    context,
  }) => {
    if (env === "prodtest") {
      // skip on prodtest
      return;
    }
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

    await test.step(`Verify trường hợp join đúng link affiliate có fpr code và tạo shop`, async () => {
      if (conf.caseConf.env === "prod") {
        await accountPage.goto(`${conf.caseConf.landing_page}${fprCode}`);
        accountPage.page.locator(accountPage.xpathBtnStartFreeTrialLandingPage).last().click();
        await expect(accountPage.genLoc(accountPage.xpathTextFreeTrialSignUpPage)).toHaveText(
          "Start your free 14-day trial of ShopBase",
        );
        email = await affiliatePage.signUpAffiliate(
          context,
          conf.caseConf.accounts_ref.password,
          conf.caseConf.accounts_ref.store_name,
          conf.suiteConf.mailinator,
        );
        await expect(accountPage.genLoc(accountPage.xpathTitleAddYourContactPage)).toHaveText(
          "Let's get to know each other",
        );
      } else if (conf.caseConf.env === "dev") {
        await accountPage.page.goto(`${conf.caseConf.url_sign_up}?fpr=${fprCode}`);
        email = await affiliatePage.signUpAffiliate(
          context,
          conf.caseConf.accounts_ref.password,
          conf.caseConf.accounts_ref.store_name,
          conf.suiteConf.mailinator,
        );
        await expect(accountPage.genLoc(accountPage.xpathTitleAddYourContactPage)).toHaveText(
          "Let's get to know each other",
        );
      }

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
      if (conf.caseConf.env == "prod") {
        expect(summaryDataAfter).toEqual(
          expect.objectContaining({
            totalClick: summaryDataBefore.totalClick + 1,
            totalRef: summaryDataBefore.totalRef + 1,
          }),
        );
      } else {
        expect(summaryDataAfter).toEqual(
          expect.objectContaining({
            totalClick: summaryDataBefore.totalClick,
            totalRef: summaryDataBefore.totalRef + 1,
          }),
        );
      }
      const dataRef = await partnerPage.searchAndGetDataRefShopBase(email, conf.caseConf.status_1);
      expect(dataRef).toEqual(
        expect.objectContaining({
          user: email,
          referDate: todayDate,
          qualifiedCashback: 0,
          holdCashback: 0,
        }),
      );
    });

    await test.step(`Verify trường hợp join link có param platform khác affiliate group của promoter`, async () => {
      await accountPage.page.goto(`${conf.caseConf.url_sign_up}?printbase=true&fpr=${fprCode}`);
      const email = await affiliatePage.signUpAffiliate(
        context,
        conf.caseConf.accounts_ref.password,
        conf.caseConf.accounts_ref.store_name,
        conf.suiteConf.mailinator,
      );
      await expect(accountPage.genLoc(accountPage.xpathTitleAddYourContactPage)).toHaveText(
        "Let's get to know each other",
      );
      await partnerPage.page.reload();
      await partnerPage.page.locator(partnerPage.xpathTextYourCashback).scrollIntoViewIfNeeded();
      const summaryDataAfter = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataAfter.totalRef).toEqual(summaryDataBefore.totalRef + 1);
      const dataRef = await partnerPage.searchAndGetDataRefShopBase(email, conf.caseConf.status_2);
      expect(dataRef).toEqual("You have no rewards yet");

      // vào hive, thêm user vào affiliate group printbase
      await hiveAffiliatePage.filterUserAffiliateCashback("User Email", conf.caseConf.username);
      await hiveAffiliatePage.addAffiliatGroup(
        conf.caseConf.username,
        conf.caseConf.affiliate_in_hive.affiliate_group_platform,
        conf.caseConf.affiliate_in_hive.affiliate_group_name,
      );
      const message = await hiveAffiliatePage.getFlashMessage();
      expect(message).toContain("has been successfully updated.");

      // kiểm tra lại số liệu sb affiliate, pb affiliate của promoter sau khi được thêm vào affiliate group printbase
      await partnerPage.page.reload();
      await partnerPage.page.locator(partnerPage.xpathTextYourCashback).scrollIntoViewIfNeeded();
      const summaryDataSBAfterJoinGroup = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataSBAfterJoinGroup.totalRef).toEqual(summaryDataBefore.totalRef + 1);
      const dataRefAfterJoinGroup = await partnerPage.searchAndGetDataRefShopBase(email, conf.caseConf.status_2);
      expect(dataRefAfterJoinGroup).toEqual("You have no rewards yet");

      await partnerPage.page.click(partnerPage.xpathSubModuleAffiliate(conf.caseConf.affiliate_module));
      await partnerPage.page.click("//p[text()='Cashback report']");
      const dataRefPBAfterJoinGroup = await partnerPage.searchAndGetDataRefPrintBase(email, conf.caseConf.status_2);
      expect(dataRefPBAfterJoinGroup).toEqual("You have no rewards yet");
    });
  });

  test(`[Printbase] Verify chức năng đăng ký ref của promoter (đã join affiliate group) qua luồng sign up @SB_PN_PNAF_28`, async ({
    conf,
    context,
  }) => {
    if (env === "prodtest") {
      // skip on prodtest
      return;
    }
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

    await test.step(`Verify trường hợp join đúng link affiliate có fpr code và tạo shop`, async () => {
      if (conf.caseConf.env === "prod") {
        await accountPage.page.goto(`${conf.caseConf.landing_page}${fprCode}`);
        const [signUpPage] = await Promise.all([
          accountPage.page.context().waitForEvent("page"),
          accountPage.page.click(accountPage.xpathBtnStartFreeTrialLandingPage),
        ]);
        const affiliatePage = new ListingPage(signUpPage, conf.suiteConf.domain_sign_up);
        await expect(signUpPage.locator(accountPage.xpathTextFreeTrialSignUpPage)).toHaveText(
          "Start your free 14-day trial of PrintBase",
        );
        email = await affiliatePage.signUpAffiliate(
          context,
          conf.caseConf.accounts_ref.password,
          conf.caseConf.accounts_ref.store_name,
          conf.suiteConf.mailinator,
        );
        await expect(signUpPage.locator(accountPage.xpathTitleAddYourContactPage)).toHaveText(
          "Let's get to know each other",
        );
        await signUpPage.close();
      } else if (conf.caseConf.env === "dev") {
        await accountPage.page.goto(`${conf.caseConf.url_sign_up}?printbase=true&fpr=${fprCode}`);
        email = await affiliatePage.signUpAffiliate(
          context,
          conf.caseConf.accounts_ref.password,
          conf.caseConf.accounts_ref.store_name,
          conf.suiteConf.mailinator,
        );
        await expect(accountPage.genLoc(accountPage.xpathTitleAddYourContactPage)).toHaveText(
          "Let's get to know each other",
        );
      }

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
      if (conf.caseConf.env == "prod") {
        expect(summaryDataAfter).toEqual(
          expect.objectContaining({
            totalClick: summaryDataBefore.totalClick + 1,
            totalRef: summaryDataBefore.totalRef + 1,
          }),
        );
      } else {
        expect(summaryDataAfter).toEqual(
          expect.objectContaining({
            totalClick: summaryDataBefore.totalClick,
            totalRef: summaryDataBefore.totalRef + 1,
          }),
        );
      }

      const dataRef = await partnerPage.searchAndGetDataRefPrintBase(email, conf.caseConf.status_1);
      expect(dataRef).toEqual(
        expect.objectContaining({
          user: email,
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

    await test.step(`Verify trường hợp join link có param platform khác affiliate group của promoter`, async () => {
      await accountPage.page.goto(`${conf.caseConf.url_sign_up}?fpr=${fprCode}`);
      const email = await affiliatePage.signUpAffiliate(
        context,
        conf.caseConf.accounts_ref.password,
        conf.caseConf.accounts_ref.store_name,
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
      const dataRef = await partnerPage.searchAndGetDataRefPrintBase(email, conf.caseConf.status_2);
      expect(dataRef).toEqual("You have no rewards yet");

      // vào hive, thêm user vào affiliate group shopbase
      await hiveAffiliatePage.filterUserAffiliateCashback("User Email", conf.caseConf.username);
      await hiveAffiliatePage.addAffiliatGroup(
        conf.caseConf.username,
        conf.caseConf.affiliate_in_hive.affiliate_group_platform,
        conf.caseConf.affiliate_in_hive.affiliate_group_name,
      );
      const message = await hiveAffiliatePage.getFlashMessage();
      expect(message).toContain("has been successfully updated.");

      // kiểm tra lại số liệu sb affiliate, pb affiliate của promoter sau khi được thêm vào affiliate group shopbase
      await partnerPage.page.reload();
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      const summaryDataPBAfterJoinGroup = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataPBAfterJoinGroup.totalRef).toEqual(summaryDataAfter.totalRef);
      const dataRefPBAfterJoinGroup = await partnerPage.searchAndGetDataRefPrintBase(email, conf.caseConf.status_2);
      expect(dataRefPBAfterJoinGroup).toEqual("You have no rewards yet");

      await partnerPage.page.click(partnerPage.xpathSubModuleAffiliate(conf.caseConf.affiliate_module));
      await partnerPage.page.locator(partnerPage.xpathTextYourCashback).scrollIntoViewIfNeeded();
      const dataRefAfterJoinGroup = await partnerPage.searchAndGetDataRefShopBase(email, conf.caseConf.status_2);
      expect(dataRefAfterJoinGroup).toEqual("You have no rewards yet");
    });
  });

  test(`[Plusbase] Verify chức năng đăng ký ref của promoter (đã join affiliate group) qua luồng sign up @SB_PN_PNAF_61`, async ({
    conf,
    context,
  }) => {
    if (env === "prodtest") {
      // skip on prodtest
      return;
    }
    const toDay = Date.now();
    // convert thời gian cycle hiện tại từ 00:00:00 UTC ngày 1 của tháng hiện tại  23:59:59 UTC ngày cuối cùng của tháng
    const date = new Date();
    const firstDay = Date.UTC(date.getFullYear(), date.getMonth(), 1, 0, 0, 0) / 1000;
    const lastDay = Date.UTC(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59) / 1000;
    data = {
      userId: conf.caseConf.data_api.user_id,
      page: conf.caseConf.data_api.page,
      limit: conf.caseConf.data_api.limit,
      email: conf.caseConf.data_api.email,
      isSearch: conf.caseConf.data_api.is_search,
      platform: conf.caseConf.data_api.platform,
      startDate: firstDay,
      endDate: lastDay,
    };

    await test.step(`Verify trường hợp join đúng link affiliate có fpr code và tạo shop`, async () => {
      if (conf.caseConf.env === "prod") {
        await accountPage.page.goto(`${conf.caseConf.landing_page}${fprCode}`);
        const [signUpPage] = await Promise.all([
          accountPage.page.context().waitForEvent("page"),
          accountPage.page.click(accountPage.xpathBtnStartFreeTrialLandingPage),
        ]);
        const affiliatePage = new ListingPage(signUpPage, conf.suiteConf.domain_sign_up);
        await expect(signUpPage.locator(accountPage.xpathTextFreeTrialSignUpPage)).toHaveText(
          "Start your free 14-day trial of PlusBase",
        );
        email = await affiliatePage.signUpAffiliate(
          context,
          conf.caseConf.accounts_ref.password,
          conf.caseConf.accounts_ref.store_name,
          conf.suiteConf.mailinator,
        );
        await expect(signUpPage.locator(accountPage.xpathTitleAddYourContactPage)).toHaveText(
          "Let's get to know each other",
        );
        await signUpPage.close();
      } else if (conf.caseConf.env === "dev") {
        await accountPage.page.goto(`${conf.caseConf.url_sign_up}?plusbase=true&fpr=${fprCode}`);
        email = await affiliatePage.signUpAffiliate(
          context,
          conf.caseConf.accounts_ref.password,
          conf.caseConf.accounts_ref.store_name,
          conf.suiteConf.mailinator,
        );
        await expect(accountPage.page.locator(accountPage.xpathTitleAddYourContactPage)).toHaveText(
          "Let's get to know each other",
        );
      }

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
      if (conf.caseConf.env == "prod") {
        expect(summaryDataAfter).toEqual(
          expect.objectContaining({
            totalClick: summaryDataBefore.totalClick + 1,
            totalRef: summaryDataBefore.totalRef + 1,
          }),
        );
      } else {
        expect(summaryDataAfter).toEqual(
          expect.objectContaining({
            totalClick: summaryDataBefore.totalClick,
            totalRef: summaryDataBefore.totalRef + 1,
          }),
        );
      }

      const dataRef = await partnerPage.searchAndGetDataRefPlusBase(email, conf.caseConf.status_1);
      expect(dataRef).toEqual(
        expect.objectContaining({
          user: email,
          referDate: convertDate(toDay, true),
          qualifiedItemsStarBase: 0,
          holdItemsStarBase: 0,
          totalCashback: 0,
        }),
      );
    });

    await test.step(`Verify trường hợp join link có param platform khác affiliate group của promoter`, async () => {
      await accountPage.page.goto(`${conf.caseConf.url_sign_up}?printbase=true&fpr=${fprCode}`);
      const email = await affiliatePage.signUpAffiliate(
        context,
        conf.caseConf.accounts_ref.password,
        conf.caseConf.accounts_ref.store_name,
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
      const dataRef = await partnerPage.searchAndGetDataRefShopBase(email, conf.caseConf.status_2);
      expect(dataRef).toEqual("No data have been found in this date range");

      // vào hive, thêm user vào affiliate group plusbbase
      await hiveAffiliatePage.filterUserAffiliateCashback("User Email", conf.caseConf.username);
      await hiveAffiliatePage.addAffiliatGroup(
        conf.caseConf.username,
        conf.caseConf.affiliate_in_hive.affiliate_group_platform,
        conf.caseConf.affiliate_in_hive.affiliate_group_name,
      );
      const message = await hiveAffiliatePage.getFlashMessage();
      expect(message).toContain("has been successfully updated.");

      // kiểm tra lại số liệu pb affiliate, plb affiliate của promoter sau khi được thêm vào affiliate group plusbase
      await partnerPage.page.reload();
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      const summaryDataPLBAfterJoinGroup = await partnerPage.getDataSummaryOfPromoter();
      expect(summaryDataPLBAfterJoinGroup.totalRef).toEqual(summaryDataAfter.totalRef);
      const dataRefPLBAfterJoinGroup = await partnerPage.searchAndGetDataRefPlusBase(email, conf.caseConf.status_2);
      expect(dataRefPLBAfterJoinGroup).toEqual("No data have been found in this date range");

      await partnerPage.page.click(partnerPage.xpathSubModuleAffiliate(conf.caseConf.affiliate_module));
      await partnerPage.page.click(partnerPage.xpathTabCashbackReport);
      await partnerPage.waitUntilElementVisible(partnerPage.xpathTableCashbackReport);
      const dataRefPBAfterJoinGroup = await partnerPage.searchAndGetDataRefPlusBase(email, conf.caseConf.status_2);
      expect(dataRefPBAfterJoinGroup).toEqual("You have no rewards yet");
    });
  });
});
