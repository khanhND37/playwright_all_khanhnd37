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

    await test.step("Set data for page & go to page", async () => {
      webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
      webBuilderAPI = new WebBuilderAPI(conf.suiteConf.domain, authRequest);
      //Go to web front by page ID
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/builder/site/${conf.suiteConf.theme_criadora}`);
      await webBuilderAPI.resetOnboarding();
      await webBuilder.waitResponseWithUrl("/api/checkout/next/cart.json");
    });
  });

  test(`@SB_PLB_OBD_55 [Web Builder] Verify bật ra popover lựa chọn xem quick tour với user lần đầu vào WB, xem tất cả các bước trong tour guide shop ShopBase`, async ({
    dashboard,
    conf,
    snapshotFixture,
    context,
  }) => {
    const snapshot = conf.caseConf.snapshot_name;
    const dataCard = conf.caseConf.card_onboarding;
    await test.step(`Đi đến màn Customize themes của WB shop SB`, async () => {
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathPreviewLoadingScreen);
      await expect(webBuilder.genLoc(webBuilder.xpathBtnLearningCenter)).toBeVisible();
      const onboardingWB = await webBuilderAPI.getOnboardingWB();
      const statusOnboarding = onboardingWB.result.show_onboarding;
      expect(statusOnboarding).toEqual(true);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.popupTourGuide,
        snapshotName: snapshot.pop_up_tour_guide,
      });
    });

    await test.step(`Chọn Show me around`, async () => {
      await webBuilder.genLoc(webBuilder.buttonShowMeArround).click();
      const statusButtonNext = webBuilder.genLoc(webBuilder.buttonNextInCard);
      await expect(statusButtonNext).toHaveCSS("visibility", "visible");
      const statusButtonPre = webBuilder.genLoc(webBuilder.buttonPreInCard);
      await expect(statusButtonPre).toHaveCSS("visibility", "hidden");
      const titleCard = await webBuilder.genLoc(webBuilder.titleCard).innerText();
      const descriptionCard = await webBuilder.genLoc(webBuilder.descriptionCard).innerText();
      expect(titleCard).toEqual(dataCard[0].title);
      expect(descriptionCard).toEqual(dataCard[0].content);
    });

    for (let i = 1; i < dataCard.length; i++) {
      await test.step(`Click Next đến tính năng tiếp theo của tour guide`, async () => {
        await webBuilder.page.waitForSelector(webBuilder.cardOnboarding, { state: "visible" });
        await webBuilder.page.getByRole("button", { name: "Next" }).click();
        const titleCard = webBuilder.genLoc(webBuilder.titleCard);
        const descriptionCard = webBuilder.genLoc(webBuilder.descriptionCard);
        await expect(titleCard).toHaveText(dataCard[i].title);
        await expect(descriptionCard).toContainText(dataCard[i].content);
        const statusButtonNext = webBuilder.genLoc(webBuilder.buttonNextInCard);
        const statusButtonPre = webBuilder.genLoc(webBuilder.buttonPreInCard);
        await expect(statusButtonNext).toHaveCSS("visibility", "visible");
        await expect(statusButtonPre).toHaveCSS("visibility", "visible");

        if (i === dataCard.length - 1) {
          const ctaBtnDone = await webBuilder.genLoc(webBuilder.buttonNextInCard).innerText();
          expect(ctaBtnDone).toEqual("Done");
        }
      });
    }

    await test.step(`Click Previous đến slide đầu tiên`, async () => {
      for (let i = 1; i < dataCard.length; i++) {
        await webBuilder.genLoc(webBuilder.buttonPreInCard).click();
      }
      const statusButtonNext = webBuilder.genLoc(webBuilder.buttonNextInCard);
      await expect(statusButtonNext).toHaveCSS("visibility", "visible");
      const statusButtonPre = webBuilder.genLoc(webBuilder.buttonPreInCard);
      await expect(statusButtonPre).toHaveCSS("visibility", "hidden");
      const titleCard = await webBuilder.genLoc(webBuilder.titleCard).innerText();
      const descriptionCard = await webBuilder.genLoc(webBuilder.descriptionCard).innerText();
      expect(titleCard).toEqual(dataCard[0].title);
      expect(descriptionCard).toEqual(dataCard[0].content);
    });

    await test.step(`Click Next đến các tính năng tiếp theo của tour guide`, async () => {
      for (let i = 1; i < dataCard.length; i++) {
        await webBuilder.genLoc(webBuilder.buttonNextInCard).click();
      }
      const ctaBtnDone = await webBuilder.genLoc(webBuilder.buttonNextInCard).innerText();
      expect(ctaBtnDone).toEqual("Done");
    });

    await test.step(`Chọn Done`, async () => {
      await webBuilder.genLoc(webBuilder.buttonNextInCard).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.onboardingCongratPopup,
        snapshotName: snapshot.congrat_onboarding_popup,
      });
    });

    await test.step(`Click Learn more`, async () => {
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        await webBuilder.genLoc(webBuilder.hyperLinkLearnMore).click(),
      ]);
      await newTab.waitForLoadState();
      expect(newTab.url()).toContain(conf.caseConf.url_learn_more);
    });

    await test.step(`Click btn Let's do it!`, async () => {
      await webBuilder.genLoc(webBuilder.buttonLetsDoIt).click();
      await expect(webBuilder.genLoc(webBuilder.onboardingCongratPopup)).not.toBeVisible();
    });
  });

  test(`@SB_PLB_OBD_59 [Web Builder] Verify bật ra popover lựa chọn xem quick tour với user lần đầu vào WB, không hoàn thành đủ các bước trong tour guide`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const caseConf = conf.caseConf;
    const snapshot = caseConf.snapshot_name;
    const themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    await test.step(`Đi đến màn Customize themes của WB`, async () => {
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathPreviewLoadingScreen);
      await expect(webBuilder.genLoc(webBuilder.xpathBtnLearningCenter)).toBeVisible();
      const onboardingWB = await webBuilderAPI.getOnboardingWB();
      const statusOnboarding = onboardingWB.result.show_onboarding;
      expect(statusOnboarding).toEqual(true);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: webBuilder.popupTourGuide,
        snapshotName: snapshot.pop_up_tour_guide,
      });
    });

    await test.step(`Chọn No, thanks`, async () => {
      await webBuilder.genLoc(webBuilder.buttonNoThanks).click();
      await expect(webBuilder.genLoc(webBuilder.popupTourGuide)).not.toBeVisible();
      const descriptionCard = webBuilder.genLoc(webBuilder.descriptionResetCard);
      await expect(descriptionCard).toHaveText(caseConf.reset_onboarding_card);
      const ctaBtnDone = await webBuilder.genLoc(webBuilder.buttonNextInCard).innerText();
      expect(ctaBtnDone).toEqual("Got it");
      await expect(webBuilder.genLoc(webBuilder.cardOnboarding)).toBeVisible();
    });

    await test.step(`Chọn got it`, async () => {
      await webBuilder.page.waitForSelector(webBuilder.cardOnboarding, { state: "visible" });
      await webBuilder.page.getByRole("button", { name: "Got it" }).click();
      await expect(webBuilder.genLoc(webBuilder.cardOnboarding)).not.toBeVisible();
    });

    await test.step(`Exit WB -> Sau đấy vào lại WB`, async () => {
      await webBuilder.clickBtnNavigationBar("exit");
      await themes.clickBtnByName("Customize", 1);
      await webBuilder.waitResponseWithUrl("/api/checkout/next/cart.json");
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathPreviewLoadingScreen);
    });

    await test.step(`Click phần More -> Chọn Reset onboarding`, async () => {
      await webBuilder.clickBtnNavigationBar("more");
      await webBuilder.genLoc(webBuilder.resetOnboarding).click();
      const onboardingWB = await webBuilderAPI.getOnboardingWB();
      const statusOnboarding = onboardingWB.result.show_onboarding;
      expect(statusOnboarding).toEqual(false);
      await expect(webBuilder.genLoc(webBuilder.popupTourGuide)).toBeVisible();
    });

    await test.step(`Click Show me arround`, async () => {
      await webBuilder.genLoc(webBuilder.buttonShowMeArround).click();
      const statusButtonNext = webBuilder.genLoc(webBuilder.buttonNextInCard);
      await expect(statusButtonNext).toHaveCSS("visibility", "visible");
      const statusButtonPre = webBuilder.genLoc(webBuilder.buttonPreInCard);
      await expect(statusButtonPre).toHaveCSS("visibility", "hidden");
    });

    await test.step(`Click x close popover -> Chọn got it`, async () => {
      await webBuilder.page.waitForSelector(webBuilder.closePopupOnboarding, { state: "visible" });
      await webBuilder.genLoc(webBuilder.closePopupOnboarding).click();
      const ctaBtnDone = await webBuilder.genLoc(webBuilder.buttonNextInCard).innerText();
      expect(ctaBtnDone).toEqual("Got it");
      await webBuilder.page.getByRole("button", { name: "Got it" }).click();
      await expect(webBuilder.genLoc(webBuilder.cardOnboarding)).not.toBeVisible();
    });

    await test.step(`Click phần More -> Chọn Reset onboarding`, async () => {
      await webBuilder.clickBtnNavigationBar("more");
      await webBuilder.genLoc(webBuilder.resetOnboarding).click();
      const onboardingWB = await webBuilderAPI.getOnboardingWB();
      const statusOnboarding = onboardingWB.result.show_onboarding;
      expect(statusOnboarding).toEqual(false);
      await expect(webBuilder.genLoc(webBuilder.popupTourGuide)).toBeVisible();
    });

    await test.step(`Click Show me arround`, async () => {
      await webBuilder.genLoc(webBuilder.buttonShowMeArround).click();
      const statusButtonNext = webBuilder.genLoc(webBuilder.buttonNextInCard);
      await expect(statusButtonNext).toHaveCSS("visibility", "visible");
      const statusButtonPre = webBuilder.genLoc(webBuilder.buttonPreInCard);
      await expect(statusButtonPre).toHaveCSS("visibility", "hidden");
    });

    await test.step(`Exit WB -> Sau đấy vào lại WB`, async () => {
      await webBuilder.page.waitForSelector(webBuilder.cardOnboarding, { state: "visible" });
      await webBuilder.genLoc(webBuilder.closePopupOnboarding).click();
      await webBuilder.page.getByRole("button", { name: "Got it" }).click();
      await webBuilder.clickBtnNavigationBar("exit");
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathPreviewLoadingScreen);
      await themes.clickBtnByName("Customize", 1);
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathPreviewLoadingScreen);
      await expect(webBuilder.genLoc(webBuilder.popupTourGuide)).not.toBeVisible();
    });
  });
});
