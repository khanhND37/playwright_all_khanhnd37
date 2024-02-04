import { expect, test } from "@core/fixtures";
import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";
import { HiveMarket } from "@pages/hive/hiveMarket";
import { Topup } from "@pages/dashboard/topup";
import { loadData } from "@core/conf/conf";
import { BalancePage } from "@pages/dashboard/balance";
import { Mailinator } from "@helper/mailinator";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { getShopToken } from "@core/utils/token";
import { http } from "@core/utils/service";
import { AccessTokenHeaderName } from "@core/constant";
import { Tools } from "@helper/tools";
import { getMailinatorInstanceWithProxy } from "@utils/mail";

let tools: Tools;
let hive: HiveSBaseOld;
let marketPage: HiveMarket;
let topupPage: Topup;

test.describe("Test create new market", () => {
  const caseID = "SET_MAR";
  const conf = loadData(__dirname, caseID);
  let alertShop: number;
  let mail: Mailinator;
  let valueCharge: number;

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      case_create: create,
      region_code: regionCode,
      payment_methods: payMethods,
      user_id: userID,
      default_methods: defMethod,
      negative: negative,
      alert: alert,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ hiveSBase, page, conf, request }) => {
        hive = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
        const shops: Array<string> = conf.suiteConf.accounts;
        await hive.goToMarketList();
        marketPage = new HiveMarket(hiveSBase, conf.suiteConf.hive_domain);

        if (create) {
          await marketPage.page.locator("((//td[3])[contains(@class, 'list-field-text')])[last()]").isVisible();
          const getRegions = await marketPage.page
            .locator("(//td[3])[contains(@class, 'list-field-text')]")
            .allTextContents();
          const regions = [];
          for (let a = 0; a < getRegions.length; a++) regions.push(getRegions[a].trim());
          if (regions.includes(regionCode)) {
            await marketPage.clickDelete(regionCode);
            await marketPage.confirmDelete();
          }
          expect(await marketPage.page.locator(`//td[normalize-space()="${regionCode}"]`).count()).toEqual(0);
          await marketPage.addNewMarket();
        } else {
          await marketPage.clickEdit(regionCode);
        }

        await test.step("Tạo market va set balance cua user", async () => {
          await marketPage.chooseRegion(regionCode);
          await marketPage.chooseEnable();
          let userIDs = "";
          for (let i = 0; i < userID.length; i++) userIDs += userID[i] + ",";
          await marketPage.fillUserID(userIDs);
          await marketPage.openTabBalanceSetting();
          for (let i = 0; i < payMethods.length; i++) await marketPage.chooseTopupMethods(payMethods[i]["name"]);
          await marketPage.chooseDefaultMethod(defMethod.display_name);
          await marketPage.fillNegativeThreshold(negative);
          await marketPage.fillAlertThreshold(alert);
          await marketPage.clickCreateAndReturnToList();

          for (let i = 0; i < shops.length; i++) {
            const resetAlert = await request.post(
              `https://${shops[i]["shop_domain"]}/admin/qc-tools/global-market.json`,
              {
                data: {
                  user_id: userID[i],
                  action: "clear_balance_setting",
                },
              },
            );
            expect(resetAlert.status()).toBe(200);
            const clearCache = await request.post(
              `https://${shops[i]["shop_domain"]}/admin/qc-tools/global-market.json`,
              {
                data: {
                  user_id: userID[i],
                  action: "clear_cache_auto_topup",
                },
              },
            );
            expect(clearCache.status()).toBe(200);

            await hive.goToChargeRefundFee(shops[i]["shop_id"]);
            await hive.page.click("//div[@id='s2id_form_invoice_type']/a");
            await hive.page.click("//div[normalize-space()='Charge']");
            const balance = parseFloat(
              (
                await hive.page
                  .locator("//td[normalize-space()='Current available balance']//following-sibling::td")
                  .textContent()
              ).replace("$", ""),
            );
            valueCharge = balance - shops[i]["balance"] + parseFloat(negative) / 100;
            await hive.page.fill("//input[@id='form_invoice_value']", `-${valueCharge}`);
            await hive.page.fill("//input[@id='form_reason']", (Math.random() + 1).toString(30).substring(7));
            await hive.page.fill("//input[@id='form_note']", (Math.random() + 1).toString(30).substring(7));
            await hive.page.click("//button[@id='form_save']");
          }
        });

        await test.step("Go to Dashboard of Merchant", async () => {
          for (let acc = 0; acc < shops.length; acc++) {
            const dash = new DashboardPage(page, shops[acc]["domain"]);
            dash.login({ email: shops[acc]["username"], password: shops[acc]["password"] });
            const balance = new BalancePage(page, shops[acc]["domain"]);
            await balance.goToBalance();

            const defaultAlert = await (
              await (await balance.page.locator("//select").elementHandle()).getProperty("value")
            ).jsonValue();
            await balance.goToBalance();
            if (alert == "") {
              alertShop = conf.suiteConf.default_alert;
              expect(parseFloat(defaultAlert)).toBe(alertShop / 100);
            } else {
              alertShop = parseFloat(alert);
              expect(parseFloat(defaultAlert)).toBe(alertShop / 100);
            }
            const balanceValue = parseFloat(
              (
                await balance.getTextContent(
                  "//h4[text()='Current available balance']/parent::div/following-sibling::h4",
                )
              ).slice(1),
            );
            if (alertShop > balanceValue) {
              await expect(balance.page.locator("//span[contains(@class,'alert__title')]")).toBeVisible();
              expect(await balance.page.locator("//span[contains(@class,'alert__title')]").textContent()).toBe(
                conf.suiteConf.bannerAlert,
              );
            }

            topupPage = new Topup(page, shops[acc]["domain"]);
            await topupPage.goToTopUpPage();
            await topupPage.clickWireTransfer();
            expect(await topupPage.page.locator("//div[@id='bank-account']/div[1]/div[1]").textContent()).toBe(
              defMethod.key,
            );
            expect(await topupPage.page.locator("//div[@id='bank-account']/div[1]/div[2]").textContent()).toBe(
              defMethod.value,
            );

            const paymentMethods = await topupPage.page
              .locator("//p/following-sibling::div[1]/select/option")
              .allTextContents();
            const methods = [];
            const actualMethods = [];
            for (let i = 0; i < payMethods.length; i++) methods.push(payMethods[i]["display_name"]);
            for (let a = 0; a < paymentMethods.length; a++) actualMethods.push(paymentMethods[a].trim());
            expect(actualMethods).toEqual(expect.arrayContaining(methods));
            await topupPage.page.click(`//p[text()="${shops[acc]["domain"]}"]`);
            await topupPage.page.click("//div[text()='Logout']");
            await topupPage.page.waitForSelector("//p[text()='Sign in']");
          }
        });

        await test.step("Check mail auto topup and alert", async () => {
          mail = await getMailinatorInstanceWithProxy(page);
          await mail.accessMail(shops[0]["mail"]);
          await expect(mail.allMail).toContainText(conf.suiteConf.subjectTopup);
          await expect(mail.allMail).toContainText(conf.suiteConf.subjectAlert);
        });
      });
    },
  );
});

test.describe("Test Market settings @SB_SB_HIVE_GLO_MAR", async () => {
  test.beforeEach(async ({ hiveSBase, conf }) => {
    hive = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
    await hive.goToMarketList();
    marketPage = new HiveMarket(hiveSBase, conf.suiteConf.hive_domain);
  });

  test("Check the list of Market Settings @SB_SB_HIVE_GLO_MAR_86", async ({ hiveSBase }) => {
    await test.step("Compare the columns of list", async () => {
      expect(await hiveSBase.locator("//thead").screenshot()).toMatchSnapshot("market-list-header.png");
    });
  });

  test("Check không tạo được market trùng region @SB_SB_HIVE_GLO_MAR_90", async ({ conf }) => {
    const noMarketBefore = await marketPage.page.locator("(//td[3])[contains(@class, 'list-field-text')]").count();
    await test.step("Tạo market trùng region với market đã có", async () => {
      await marketPage.addNewMarket();
      await marketPage.chooseRegion(conf.caseConf.region_code);
      await marketPage.chooseApprove();
      await marketPage.openTabBalanceSetting();
      await marketPage.page.locator("//label[contains(@for,'balanceSettings_default_method')]").isVisible();
      const methods = conf.caseConf.payment_methods;
      for (let i = 0; i < Object.keys(methods).length; i++) await marketPage.chooseTopupMethods(methods[i].name);
      await marketPage.chooseDefaultMethod(conf.caseConf.default_methods);
      await marketPage.clickCreate();
    });
    await expect(marketPage.page.locator("//div[contains(@class, 'alert')]")).toBeVisible();
    await marketPage.page.click("//a[@href='/admin/app/marketsetting/list']");
    await marketPage.page.waitForSelector("(//td[3])[contains(@class, 'list-field-text')]");
    const noMarketAfter = await marketPage.page.locator("(//td[3])[contains(@class, 'list-field-text')]").count();
    expect(noMarketBefore).toEqual(noMarketAfter);
  });

  test("Check User bị frozen store khi quá số lần nạp tiền tự động thất bại @SB_SB_HIVE_GLO_MAR_94", async ({
    page,
    conf,
    request,
  }) => {
    const account = conf.caseConf.account;
    tools = new Tools();
    await test.step("Auto topup cho User thất bại (6 lần)", async () => {
      for (let i = 0; i < 6; i++) {
        await tools.updateTopUpPending(account.shop_domain, account.user_id, request);
      }
    });

    await test.step("Đăng nhập vào dashboard của user, store bi frozen", async () => {
      const dash = new DashboardPage(page, account.domain);
      dash.login({ email: account.username, password: account.password });
      await expect(dash.page.locator("//h3")).toContainText(conf.caseConf.title_bar);
      // set precondition for run later
      const login = await request.post(`${conf.suiteConf.api}/v1/auth/credentials`, {
        data: {
          username: account.username,
          password: account.password,
        },
      });
      expect(login.status()).toBe(200);
      const userToken: string = await login.body().then(b => {
        const data = JSON.parse(b.toString());
        return data.access_token;
      });
      const selectShop = await getShopToken(conf.suiteConf.api, {
        userId: account.user_id,
        token: userToken,
        domain: account.domain,
      });
      const body = conf.caseConf.profile_body_api;
      const declinedBody = conf.caseConf.declined_profile_body_api;
      const updateProfile = await http.put(
        `${conf.suiteConf.api}/v1/user/profile?user_id=${account.user_id}&shop_id=${account.shop_id}`,
        {
          body: { body },
          headers: {
            [AccessTokenHeaderName]: selectShop.access_token,
          },
        },
      );
      expect(updateProfile.status).toBe(200);
      await dash.page.goto(`${account.domain}/admin/balance`);
      const declinedCard = await http.put(
        `${conf.suiteConf.api}/v1/user/profile?user_id=${account.user_id}&shop_id=${account.shop_id}`,
        {
          body: { declinedBody },
          headers: {
            [AccessTokenHeaderName]: selectShop.access_token,
          },
        },
      );
      expect(declinedCard.status).toBe(200);
    });
  });

  test("Check không edit được market trùng region @SB_SB_HIVE_GLO_MAR_97", async ({ page, conf }) => {
    await test.step("Edit market thành trùng region", async () => {
      await marketPage.clickEdit(conf.caseConf.region_code_old);
      await marketPage.chooseRegion(conf.caseConf.region_code_dupplicate);
      if (!(await marketPage.page.locator("//input[contains(@id,'approved')]").isChecked()))
        await marketPage.chooseApprove();
      await marketPage.openTabBalanceSetting();
      await marketPage.page.locator("//label[contains(@for,'balanceSettings_default_method')]").isVisible();
      const times = await marketPage.page.locator("//a[@class='select2-search-choice-close']").count();
      for (let i = times; i > 0; i--) {
        await marketPage.page.click(`(//a[@class='select2-search-choice-close'])[${i}]`);
      }
      const methods = conf.caseConf.payment_methods_new;
      for (let i = 0; i < Object.keys(methods).length; i++) {
        await marketPage.chooseTopupMethods(methods[i].name);
      }
      await marketPage.chooseDefaultMethod(conf.caseConf.default_methods_new);
      await marketPage.clickUpdate();
      await expect(marketPage.page.locator("//div[contains(@class, 'alert-danger')]")).toBeVisible();
    });

    await test.step("Đăng nhập vào dashboard của user, check payment methods ở Topup", async () => {
      const accounts = conf.suiteConf.accounts;
      for (let acc = 0; acc < accounts.length; acc++) {
        const dash = new DashboardPage(page, accounts[acc]["domain"]);
        dash.login({ email: accounts[acc]["username"], password: accounts[acc]["password"] });

        topupPage = new Topup(page, accounts[acc]["domain"]);
        await topupPage.goToTopUpPage();
        await topupPage.clickWireTransfer();

        const keyDefault = await topupPage.page.locator("//div[@id='bank-account']/div[1]/div[1]").textContent();
        expect(keyDefault).toBe(conf.caseConf.payment_methods_old[0].key);

        const paymentMethods = await topupPage.page
          .locator("//p/following-sibling::div[1]/select/option")
          .allTextContents();
        const expectedMethods = conf.caseConf.payment_methods_old;
        const methods = [];
        const actualMethods = [];
        for (let i = 0; i < Object.keys(expectedMethods).length; i++) {
          methods.push(expectedMethods[i].display_name);
        }
        for (let a = 0; a < paymentMethods.length; a++) {
          actualMethods.push(paymentMethods[a].trim());
        }
        expect(actualMethods).toEqual(expect.arrayContaining(methods));
        await page.click(`//p[text()="${accounts[acc].dashboard_domain}"]`);
        await page.click("//div[text()='Logout']");
        await page.waitForSelector("//p[text()='Sign in']");
      }
    });
  });
});
