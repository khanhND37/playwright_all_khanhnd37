import { expect, test } from "@core/fixtures";
import { ActivityHistory } from "@pages/dashboard/activity_history";
import { BalancePage } from "@pages/dashboard/balance";
import { formatDate } from "@core/utils/datetime";
import { AccountSetting } from "@pages/dashboard/account_setting";
import { loadData } from "@core/conf/conf";
import { DashboardPage } from "../../../../../../src/pages/dashboard/dashboard";

test.describe("Test release for Activity Log SB_SET_ACC_ACT_LOG", () => {
  let shopTimeZone;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    new DashboardPage(dashboard, conf.suiteConf.domain);
    const res = await authRequest.get(conf.suiteConf.shop_info_api);
    const shopTest = await res.json();
    shopTimeZone = shopTest.shop.iana_timezone;
  });

  const caseID = "ACT_LOG";
  const conf = loadData(__dirname, caseID);
  let activityPage: ActivityHistory;
  let balance: BalancePage;
  let account: AccountSetting;
  let timeActivity;
  let timeActivityUpdate;
  const shopName = `shop${new Date().getMonth()}${new Date().getDate()}${new Date().getSeconds()}`;

  //get and format for the current time with timezone is time zone of this store
  function getTimeActivity(): string {
    return formatDate(new Date().toLocaleString("en-US", { timeZone: shopTimeZone }), "MMM D, YYYY hh:mm A");
  }

  // excute add 1 minutes for the current time
  function addMinutes(): number {
    const datetime = new Date();
    return datetime.setMinutes(datetime.getMinutes() - 1);
  }

  //format date for time of function addMinutes()
  function getTimeActivityUpdate(): string {
    return formatDate(
      new Date(addMinutes()).toLocaleString("en-US", { timeZone: shopTimeZone }),
      "MMM D, YYYY hh:mm A",
    );
  }

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      case_step: caseStep,
      category: category,
      activity: activity,
      details: details,
      more_info: moreInfo,
      card: card,
      shop: shop,
      payout_email: payoutEmail,
      staff_email: staffEmail,
      card_new: cardNew,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ dashboard, conf }) => {
        await test.step(`${caseStep}`, async () => {
          switch (caseID) {
            case "SB_SET_ACC_ACT_LOG_1":
              balance = new BalancePage(dashboard, conf.suiteConf.domain);
              await balance.goToBalance();
              await balance.clickEnablePayoutToSBBalance();
              timeActivity = getTimeActivity();
              timeActivityUpdate = getTimeActivityUpdate();
              await balance.clickSaveChanges();
              break;
            case "SB_SET_ACC_ACT_LOG_2":
              balance = new BalancePage(dashboard, conf.suiteConf.domain);
              await balance.goToBalance();
              await balance.clickEnableAutoRecharge();
              timeActivity = getTimeActivity();
              timeActivityUpdate = getTimeActivityUpdate();
              await balance.clickSaveChanges();
              break;
            case "SB_SET_ACC_ACT_LOG_3":
              balance = new BalancePage(dashboard, conf.suiteConf.domain);
              await balance.goToBalance();
              await balance.clickReplaceCreditCard();
              await balance.addCreditCard(card);
              timeActivity = getTimeActivity();
              timeActivityUpdate = getTimeActivityUpdate();
              break;
            case "SB_SET_ACC_ACT_LOG_4":
              account = new AccountSetting(dashboard, conf.suiteConf.domain);
              await account.goToAccountSetting();
              await account.deleteAllStaffAccount(conf.suiteConf.password);
              await account.addStaffAccountThenDelete(staffEmail, conf.suiteConf.password);
              timeActivity = getTimeActivity();
              timeActivityUpdate = getTimeActivityUpdate();
              break;
            case "SB_SET_ACC_ACT_LOG_5":
              account = new AccountSetting(dashboard, conf.suiteConf.domain);
              await account.confirmPlan(conf.suiteConf.domain);
              timeActivity = getTimeActivity();
              timeActivityUpdate = getTimeActivityUpdate();
              break;
            case "SB_SET_ACC_ACT_LOG_6":
              account = new AccountSetting(dashboard, conf.suiteConf.domain);
              await account.createNewShop(conf.suiteConf.username, conf.suiteConf.password, shopName, shop);
              await account.activePlan(`${shopName}.${conf.suiteConf.server_domain}`);
              timeActivity = getTimeActivity();
              timeActivityUpdate = getTimeActivityUpdate();
              break;
            case "SB_SET_ACC_ACT_LOG_9":
              account = new AccountSetting(dashboard, conf.suiteConf.domain);
              await account.updateProfile(conf.suiteConf.password);
              timeActivity = getTimeActivity();
              timeActivityUpdate = getTimeActivityUpdate();
              break;
            case "SB_SET_ACC_ACT_LOG_11":
              balance = new BalancePage(dashboard, conf.suiteConf.domain);
              await balance.goToBalance();
              await balance.updatePayoutAccount(payoutEmail);
              timeActivity = getTimeActivity();
              timeActivityUpdate = getTimeActivityUpdate();
              break;
            default:
              return "The case is not exist";
          }
        });

        await test.step(`Truy cập Setting > Account > Activity history`, async () => {
          if (caseID == "SB_SET_ACC_ACT_LOG_6") {
            activityPage = new ActivityHistory(dashboard, `${shopName}.${conf.suiteConf.server_domain}`);
          } else {
            activityPage = new ActivityHistory(dashboard, conf.suiteConf.domain);
          }
          await activityPage.goToActivityHistory();
          await activityPage.filterActivity(category, activity);
          await activityPage.waitAbit(2000);
          await expect(dashboard.locator("(//tr/td[1]/div/span)[1]")).toContainText(conf.suiteConf.username);
          await expect(dashboard.locator("(//tr/td[2]/div/span)[1]")).toContainText(category);
          await expect(dashboard.locator("(//tr/td[3]/div/span)[1]")).toContainText(activity);
          await expect(dashboard.locator("(//tr/td[4]/div/span)[1]")).toContainText(details);
          expect(
            `${timeActivity} ${timeActivityUpdate}`.includes(await dashboard.textContent("(//tr/td[5]/div/span)[1]")),
          ).toBe(true);
        });

        await test.step(`Click expand the detail of the activity`, async () => {
          await activityPage.clickViewDetail(activity);
          const info: Array<string> = moreInfo;
          info.forEach(async value => {
            await expect(dashboard.locator("(//code)[1]")).toContainText(value);
          });
          expect((await activityPage.genLoc("(//code)[1]").textContent()).split(",").length).toBe(info.length);
          if (caseID == "SB_SET_ACC_ACT_LOG_3") {
            await balance.goToBalance();
            await balance.clickReplaceCreditCard();
            await balance.addCreditCard(cardNew);
          }
        });
      });
    },
  );

  test(`Log Account: Close store @SB_SET_ACC_ACT_LOG_7`, async ({ dashboard, conf, browser }) => {
    let closeTime: string;
    let reopenTime: string;
    let closeTimeUpdate: string;
    let reopenTimeUpdate: string;
    let newPage;

    await test.step(`Truy cập Settings > Account, rồi close va reopen store`, async () => {
      account = new AccountSetting(dashboard, conf.suiteConf.domain);
      await account.goToAccountSetting();
      await account.closeStore(conf.suiteConf.password);
      closeTime = getTimeActivity();
      closeTimeUpdate = getTimeActivityUpdate();
      await account.page.close();
      const context = await browser.newContext();
      newPage = await context.newPage();
      const newAccount = new AccountSetting(newPage, conf.suiteConf.domain);
      await newAccount.goto("/admin");
      await newAccount.reopenStore(conf.suiteConf.username, conf.suiteConf.password, "sign-in");
      reopenTime = getTimeActivity();
      reopenTimeUpdate = getTimeActivityUpdate();
    });

    await test.step(`Truy cập Setting > Account > Activity history`, async () => {
      activityPage = new ActivityHistory(newPage, conf.suiteConf.domain);
      await activityPage.goToActivityHistory();
      await activityPage.filterActivity(conf.caseConf.category, conf.caseConf.activity.close);
      await activityPage.waitAbit(2000);
      await expect(newPage.locator("(//tr/td[1]/div/span)[1]")).toContainText(conf.suiteConf.username);
      await expect(newPage.locator("(//tr/td[2]/div/span)[1]")).toContainText(conf.caseConf.category);
      await expect(newPage.locator("(//tr/td[3]/div/span)[1]")).toContainText(conf.caseConf.activity.close);
      await expect(newPage.locator("(//tr/td[4]/div/span)[1]")).toContainText(conf.caseConf.details.close);
      expect(`${closeTime} ${closeTimeUpdate}`.includes(await newPage.textContent("(//tr/td[5]/div/span)[1]"))).toBe(
        true,
      );

      await activityPage.filterActivity(conf.caseConf.category, conf.caseConf.activity.reopen);
      await activityPage.waitAbit(2000);
      await expect(newPage.locator("(//tr/td[1]/div/span)[1]")).toContainText(conf.suiteConf.username);
      await expect(newPage.locator("(//tr/td[2]/div/span)[1]")).toContainText(conf.caseConf.category);
      await expect(newPage.locator("(//tr/td[3]/div/span)[1]")).toContainText(conf.caseConf.activity.reopen);
      await expect(newPage.locator("(//tr/td[4]/div/span)[1]")).toContainText(conf.caseConf.details.reopen);
      expect(`${reopenTime} ${reopenTimeUpdate}`.includes(await newPage.textContent("(//tr/td[5]/div/span)[1]"))).toBe(
        true,
      );
    });
  });
});
