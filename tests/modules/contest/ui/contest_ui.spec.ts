import { expect, test } from "@core/fixtures";
import { ContestPage } from "@pages/dashboard/contest";
import { BrowserContext, Page } from "@playwright/test";
import { HiveContest } from "@pages/hive/hive_contest";
import { addDays, formatDate, getUnixTime } from "@utils/datetime";
import { loadData } from "@core/conf/conf";

//convert color hex to rgb
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
}

const verifyContentContest = async (page: Page, element: string, setting) => {
  await expect(await page.locator(element)).toContainText(setting.message);
  const style = await page.locator(element).getAttribute("style");
  expect(style).toContain(`color: ${hexToRgb(setting.color)};`);
  expect(style).toContain(`font-size: ${setting.size}px;`);
};
const verifyLinkHadPrize = async (page: Page, context: BrowserContext, element: string, setting) => {
  await expect(await page.locator(element)).toContainText("Show me how to receive the prize");
  const style = await page.locator(element).getAttribute("style");
  expect(style).toContain(`color: ${hexToRgb(setting.color)};`);
  expect(style).toContain(`font-size: ${setting.size}px;`);
  await verifyOpenLink(page, context, element, setting.message);
};

const verifyLearnMoreBtn = async (page: Page, context: BrowserContext, element: string, btnSetting) => {
  await expect(page.locator(element)).toHaveText("Learn more");
  const style = await page.locator(element).getAttribute("style");

  expect(style).toContain(`background: ${hexToRgb(btnSetting.primary_color)}`);
  expect(style).toContain(`border-color: ${hexToRgb(btnSetting.primary_color)};`);
  expect(style).toContain(`color: ${hexToRgb(btnSetting.secondary_color)}`);
  expect(style).toContain(`font-size: ${btnSetting.size}px;`);
  await verifyOpenLink(page, context, element, btnSetting.link);
};
const verifyOpenLink = async (page: Page, context: BrowserContext, element: string, expectLink: string) => {
  const [linkOpened] = await Promise.all([context.waitForEvent("page"), await page.locator(element).click()]);
  expect(linkOpened.url()).toContain(expectLink);
  await linkOpened.close();
};

const waitAndReloadPage = async (page: Page) => {
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(3000);
  await page.reload({ waitUntil: "load" });
  await page.locator("//span[normalize-space()='Home']").click();
};
const verifyPrize = async (page: Page, prizes) => {
  for (let i = 0; i < prizes.length; i++) {
    const point = await page
      .locator(`//div[@class='check-point-item'][${i + 1}]//div[@class='check-point']`)
      .textContent();
    expect(point.replace("points", "").replace("$", "").replace("sold items", "").replace(",", "").trim()).toEqual(
      prizes[i].threshold.toString(),
    );
    await expect(
      page.locator(`//div[@class='check-point-item'][${i + 1}]//p[contains(@class,'text-bold')]`),
    ).toHaveText(prizes[i].prize);
  }
};

test.describe("Test UI Contest @TS_SB_PN_TP2", async () => {
  let hiveContest: HiveContest;
  test.beforeEach(async ({ hiveSBase, conf }) => {
    await test.step("Pre-condition: Disable all Contest", async () => {
      hiveContest = new HiveContest(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSBase.goto(`https://${conf.suiteConf.hive_domain}/admin/contest/list`);
      await hiveContest.disableAllContest();
    });
  });

  const data = loadData(__dirname, "DATA_DRIVEN");

  for (let i = 0; i < data.caseConf.data.length; i++) {
    const caseData = data.caseConf.data[i];
    test(`${caseData.description} - @${caseData.case_id}`, async ({ context, dashboard, token, conf }) => {
      const accessToken = (
        await token.getWithCredentials({
          domain: caseData.domain,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        })
      ).access_token;

      const domain = caseData.domain;
      const contestPage = new ContestPage(dashboard, domain);

      let startDate = formatDate(getUnixTime(addDays(2)) / 1000, "DD/MM/YYYY");
      let endDate = formatDate(getUnixTime(addDays(20)) / 1000, "DD/MM/YYYY");
      //delete contest if existed
      await hiveContest.deleteContest(caseData.contest_logic.contest_name);
      await test.step(`Tạo Contest thành công:`, async () => {
        await hiveContest.genLoc("(//i[@class='fa fa-plus-circle'])[1]").click();
        await hiveContest.inputContestName(caseData.contest_logic.contest_name);
        await hiveContest.selectShopType(caseData.contest_logic.shop_type);
        await hiveContest.selectRegion(caseData.contest_logic.region);
        await hiveContest.selectStartTime(startDate);
        await hiveContest.selectEndTime(endDate);
        await hiveContest.inputMetrics(caseData.contest_logic.metrics, caseData.contest_logic.shop_type);
        await hiveContest.inputPrizes(caseData.contest_logic.prizes);
        await hiveContest.genLoc("//a[@class='changer-tab'][normalize-space()='Config UI']").click();
        await hiveContest.configUIPreContest(caseData.contest_ui.pre_contest);
        await hiveContest.configUIInContest(caseData.contest_ui.in_contest);
        await hiveContest.configUIAfterContest(caseData.contest_ui.after_contest);
        await hiveContest.clickOnBtnWithLabel("Create");
        await expect(hiveContest.genLoc("//div[@class='alert alert-success alert-dismissable']")).toContainText(
          "has been successfully created.",
        );
      });
      await test.step(`Enable contest`, async () => {
        await hiveContest.genLoc("//a[@class='changer-tab'][normalize-space()='Config Logic']").click();
        await hiveContest.enableContest(true);
        await hiveContest.clickOnBtnWithLabel("Update and close");
        await expect(hiveContest.genLoc("//div[@class='alert alert-success alert-dismissable']")).toContainText(
          "has been successfully updated.",
        );
      });
      await test.step(`Verify Nội dung Pre-contest `, async () => {
        await contestPage.clearCacheOfContest(accessToken);
        await waitAndReloadPage(dashboard);
        await verifyContentContest(dashboard, ".contest-subtitle", caseData.contest_ui.pre_contest.message_header);
        await verifyContentContest(dashboard, ".contest-main-title", caseData.contest_ui.pre_contest.message_subtext);
        await verifyLearnMoreBtn(
          dashboard,
          context,
          ".btn-contest-learn-more",
          caseData.contest_ui.pre_contest.learn_more_btn,
        );
        await expect(dashboard.locator(".countdown")).toBeVisible();
      });
      await test.step(`Đổi ngày bắt đầu contest trc ngày hiện tại`, async () => {
        await hiveContest.goto(`/admin/contest/list`);
        await hiveContest.searchAndEnableContest(caseData.contest_logic.contest_name, false);
        await hiveContest.clickOnBtnWithLabel("Update");

        startDate = formatDate(getUnixTime(addDays(-10)) / 1000, "DD/MM/YYYY");
        await hiveContest.selectStartTime(startDate);
        await hiveContest.enableContest(true);
        await hiveContest.clickOnBtnWithLabel("Update and close");
        await expect(hiveContest.genLoc("//div[@class='alert alert-success alert-dismissable']")).toContainText(
          "has been successfully updated.",
        );
      });
      await test.step(`Verify In-contest Content`, async () => {
        await contestPage.clearCacheOfContest(accessToken);
        await waitAndReloadPage(dashboard);
        await verifyPrize(dashboard, caseData.contest_logic.prizes);
        await verifyContentContest(
          dashboard,
          "#shopbase-contest-wrapper .content-right p.text-bold",
          caseData.contest_ui.in_contest.message_header,
        );

        const content = await contestPage.getAllTextContents("#shopbase-contest-wrapper .content-right p.p-s12");
        expect(content.at(0).trim()).toContain(`Keep going. Sell more`);
        expect(content.at(0).trim()).toContain(`to win the next prize.`);
        expect(content.at(1).trim()).toEqual(`${startDate} - ${endDate}`);

        const [learnMore] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.locator(".new-ui-content a.inline").click(),
        ]);
        expect(learnMore.url()).toContain(caseData.contest_ui.in_contest.learn_more_link);
        await learnMore.close();
      });
      await test.step(`Đổi ngày kết thúc contest là ngày quá khứ`, async () => {
        await hiveContest.goto(`/admin/contest/list`);
        await hiveContest.searchAndEnableContest(caseData.contest_logic.contest_name, false);
        await hiveContest.clickOnBtnWithLabel("Update");
        endDate = formatDate(getUnixTime(addDays(-2)) / 1000, "DD/MM/YYYY");
        await hiveContest.selectEndTime(endDate);
        await hiveContest.enableContest(true);
        await hiveContest.clickOnBtnWithLabel("Update and close");
        await expect(hiveContest.genLoc("//div[@class='alert alert-success alert-dismissable']")).toContainText(
          "has been successfully updated.",
        );
      });
      await test.step(`Verify After-contest Content`, async () => {
        await contestPage.clearCacheOfContest(accessToken);
        await waitAndReloadPage(dashboard);
        if (await contestPage.genLoc("#contest-result .no-gift-container").isVisible()) {
          await verifyContentContest(
            dashboard,
            "#contest-result .no-gift-container .contest-main-title span",
            caseData.contest_ui.after_contest.no_prize.message_header,
          );
          await verifyContentContest(
            dashboard,
            "#contest-result .no-gift-container p",
            caseData.contest_ui.after_contest.no_prize.message_subtext,
          );
        } else {
          await verifyContentContest(
            dashboard,
            "#contest-result .gift-container .contest-main-title",
            caseData.contest_ui.after_contest.had_prize.message_header,
          );
          await verifyContentContest(
            dashboard,
            "#contest-result .gift-container .contest-main-title span",
            caseData.contest_ui.after_contest.had_prize.message_subtext,
          );
          await verifyLinkHadPrize(
            dashboard,
            context,
            "#contest-result .gift-container p.text-center a",
            caseData.contest_ui.after_contest.had_prize.link,
          );
          await expect(dashboard.locator("//ul[@class-='info-gift']")).toBeVisible();
          const boxColor = await dashboard.locator("//ul[@class-='info-gift']//li[1]").getAttribute("style");
          expect(boxColor).toContain(`background: ${hexToRgb(caseData.contest_ui.after_contest.had_prize.box_color)}`);
        }
        await hiveContest.searchAndEnableContest(caseData.contest_logic.contest_name, false);
        await hiveContest.clickOnBtnWithLabel("Update");
      });
    });
  }
});
