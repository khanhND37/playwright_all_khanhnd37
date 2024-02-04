import { snapshotDir } from "@core/utils/theme";
import { test, expect } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { WebBuilderAPI } from "@pages/dashboard/web_builder_api";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";

test.describe("Onboarding Web Builder", () => {
  let webBuilder: WebBuilder;
  let webBuilderAPI: WebBuilderAPI;
  test.beforeEach(async ({ dashboard, conf, authRequest }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    const triggerCode = conf.caseConf.trigger_code;

    await test.step("Set data for page & go to page", async () => {
      webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
      webBuilderAPI = new WebBuilderAPI(conf.suiteConf.domain, authRequest);
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/builder/site/${conf.suiteConf.theme_criadora}`);
      await webBuilderAPI.statusTriggerCardOnboarding(triggerCode, "false");
      await webBuilder.waitResponseWithUrl("/api/checkout/next/cart.json");
    });
  });

  test(`@SB_PLB_OBD_60 [Web Builder] Verify bật ra popover ở góc phải màn hình khi user lần đầu thao tác với các chức năng/block phức tạp và quan trọng`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    const snapshot = caseConf.snapshot_name;
    const cardOnboarding = caseConf.card_onboarding;
    await test.step(`Đi đến màn Customize themes của WB`, async () => {
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathPreviewLoadingScreen);
      await expect(webBuilder.genLoc(webBuilder.xpathBtnLearningCenter)).toBeVisible();
    });

    await test.step(`Thực hiện action Insert`, async () => {
      await webBuilder.clickBtnNavigationBar("insert");
      await expect(webBuilder.genLoc(webBuilder.popoverCardLearning)).toBeVisible();
      const titleCardInPopover = await webBuilder.genLoc(webBuilder.titleCardLearning).textContent();
      expect(cardOnboarding[0].title).toEqual(titleCardInPopover);
      const descriptionCard = await webBuilder.genLoc(webBuilder.descriptionCardLearning).innerText();
      expect(descriptionCard).toContain(cardOnboarding[0].content);
      await expect(webBuilder.genLoc(webBuilder.buttonPreviousInCardLearning)).not.toBeVisible();
    });

    await test.step(`Click btn ? trên Header`, async () => {
      await webBuilder.genLoc(webBuilder.xpathBtnLearningCenter).click();
      await expect(webBuilder.genLoc(webBuilder.xpathPopupLearningCenter)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.xpathPopupLearningCenter,
        snapshotName: snapshot.learning_center,
      });
    });

    await test.step(`Click X trên popup`, async () => {
      await webBuilder.genLoc(webBuilder.buttonClosePopupLearning).click();
      await expect(webBuilder.genLoc(webBuilder.xpathPopupLearningCenter)).not.toBeVisible();
    });

    for (let i = 1; i < cardOnboarding.length; i++) {
      await test.step(`Click Next đến tính năng tiếp đến slide cuối`, async () => {
        await webBuilder.page.waitForSelector(webBuilder.popoverCardLearning, { state: "visible" });
        await webBuilder.page.getByRole("button", { name: "Next" }).click();
        const titleCard = webBuilder.genLoc(webBuilder.titleCardLearning);
        const descriptionCard = webBuilder.genLoc(webBuilder.descriptionCardLearning);
        await expect(titleCard).toHaveText(cardOnboarding[i].title);
        await expect(descriptionCard).toContainText(cardOnboarding[i].content);
        const statusButtonNext = webBuilder.genLoc(webBuilder.buttonNextInCardLearning);
        const statusButtonPre = webBuilder.genLoc(webBuilder.buttonPreviousInCardLearning);
        await expect(statusButtonNext).toHaveCSS("visibility", "visible");
        await expect(statusButtonPre).toHaveCSS("visibility", "visible");

        if (i === cardOnboarding.length - 1) {
          const ctaBtnDone = await webBuilder.genLoc(webBuilder.buttonNextInCardLearning).innerText();
          expect(ctaBtnDone).toEqual("Done");
        }
      });
    }

    await test.step(`Click Done`, async () => {
      await webBuilder.genLoc(webBuilder.buttonNextInCardLearning).click();
      await expect(webBuilder.genLoc(webBuilder.popoverCardLearning)).not.toBeVisible();
    });
  });

  test(`@SB_PLB_OBD_62 [Web Builder] Verify lần thứ hai thao tác với các chức năng/block phức tạp và quan trọng và đã xem hết các bước hướng dẫn ở lần đầu`, async ({
    conf,
    dashboard,
  }) => {
    const cardOnboarding = conf.caseConf.card_onboarding;
    const themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    await test.step(`Trigger lần đầu action Insert và xem hết các step trong popover hướng dẫn sử dụng`, async () => {
      await webBuilder.clickBtnNavigationBar("insert");
      for (let i = 0; i < cardOnboarding.length; i++) {
        await test.step(`Click Next đến tính năng tiếp đến slide cuối`, async () => {
          await webBuilder.genLoc(webBuilder.buttonNextInCardLearning).click();
        });
      }
      await webBuilder.clickBtnNavigationBar("exit");
    });

    await test.step(`Đi đến màn Customize themes của WB`, async () => {
      await themes.clickBtnByName("Customize", 1);
      await webBuilder.waitResponseWithUrl("/api/checkout/next/cart.json");
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathPreviewLoadingScreen);
      await expect(webBuilder.genLoc(webBuilder.xpathBtnLearningCenter)).toBeVisible();
      const onboardingWB = await webBuilderAPI.getOnboardingWB();
      const statusOnboarding = onboardingWB.result.show_onboarding;
      expect(statusOnboarding).toEqual(false);
    });

    await test.step(`Thực hiện action Insert block`, async () => {
      const addBlock = conf.caseConf.dnd_block;
      await webBuilder.dragAndDropInWebBuilder(addBlock);
      await expect(webBuilder.genLoc(webBuilder.popoverCardLearning)).not.toBeVisible();
    });
  });
});
