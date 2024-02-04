import { snapshotDir } from "@core/utils/theme";
import { test, expect } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { WebBuilderAPI } from "@pages/dashboard/web_builder_api";

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
      await webBuilder.waitResponseWithUrl("/api/checkout/next/cart.json");
    });
  });

  test(`@SB_PLB_OBD_62 [Web Builder] Verify lần thứ hai thao tác với các chức năng/block phức tạp và quan trọng và đã xem hết các bước hướng dẫn ở lần đầu`, async ({
    conf,
  }) => {
    await test.step(`Đi đến màn Customize themes của WB`, async () => {
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

  test(`@SB_PLB_OBD_63 [Web Builder] Verify hiển thị Learning center`, async ({ conf, dashboard, snapshotFixture }) => {
    const snapshot = conf.caseConf.snapshot_name;
    await test.step(`Đi đến màn Customize themes của WB`, async () => {
      await webBuilder.waitForElementVisibleThenInvisible(webBuilder.xpathPreviewLoadingScreen);
      await expect(webBuilder.genLoc(webBuilder.xpathBtnLearningCenter)).toBeVisible();
    });

    await test.step(`Verify icon Open Learning Center in Header`, async () => {
      await snapshotFixture.verify({
        page: dashboard,
        selector: webBuilder.xpathHeaderWBRight,
        snapshotName: snapshot.icon_open_learning_center,
      });
    });

    await test.step(`Click icon ?`, async () => {
      await webBuilder.genLoc(webBuilder.xpathBtnLearningCenter).click();
      await expect(webBuilder.genLoc(webBuilder.xpathPopupLearningCenter)).toBeVisible();
    });

    await test.step(`Verify open popup Learning Center in Web Builder`, async () => {
      const headingPopupLearning = await webBuilder.genLoc(webBuilder.headingLearningCenter).textContent();
      expect(headingPopupLearning).toEqual("Learning Center");
      const getListCardOnboading = await webBuilderAPI.getListCardOnboarding();
      const cardOnboading = getListCardOnboading.result.data.length;
      const listCardInPopup = await webBuilder.genLoc(webBuilder.stepInCardOnboarding).count();
      expect(cardOnboading).toEqual(listCardInPopup);
      await snapshotFixture.verify({
        page: dashboard,
        selector: webBuilder.sidebarPopupLearningCenter,
        snapshotName: snapshot.sidebar_popup_learning_center,
      });
    });
  });

  test(`@SB_PLB_OBD_64 [Web Builder] Verify chức năng Search trong Learning center`, async ({ conf }) => {
    await test.step(`Đi đến WB -> Click ? ở góc phải màn hình để show popup Learning center -> Chọn Getting started`, async () => {
      await webBuilder.genLoc(webBuilder.xpathBtnLearningCenter).click();
      await expect(webBuilder.genLoc(webBuilder.xpathPopupLearningCenter)).toBeVisible();
      const getListCardOnboading = await webBuilderAPI.getListCardOnboarding();
      const cardOnboading = getListCardOnboading.result.data.length;
      const listCardInPopup = await webBuilder.genLoc(webBuilder.stepInCardOnboarding).count();
      expect(cardOnboading).toEqual(listCardInPopup);
    });

    const dataSearch = conf.caseConf.data_search;
    for (let i = 0; i < dataSearch.length; i++) {
      const dataSetting = dataSearch[i];
      await test.step(`${dataSetting.description}`, async () => {
        await webBuilder.genLoc(webBuilder.searchOnboardingCard).fill(dataSetting.data);
        await webBuilder.page.waitForResponse(
          response =>
            response.url().includes("/admin/themes/builder/onboarding/learning.json?search=") &&
            response.status() === 200,
        );
        if (dataSetting.expect.card) {
          expect(await webBuilder.genLoc(webBuilder.stepInCardOnboarding).count()).toEqual(
            dataSetting.expect.card.length,
          );

          const cardName = await webBuilder.genLoc(webBuilder.titleOnboardingCard).first().innerText();
          expect(cardName).toEqual(dataSetting.expect.card[0].name);
        }
        if (dataSetting.expect.message) {
          const msgEmtyResult = await webBuilder.genLoc(webBuilder.msgEmptySearch).textContent();
          expect(msgEmtyResult).toContain(dataSetting.expect.message);
        }
      });

      await test.step(`Click vào icon x trên Search bar`, async () => {
        await webBuilder.genLoc(webBuilder.iconCloseSearch).click();
        await webBuilder.page.waitForResponse(
          response =>
            response.url().includes("/admin/themes/builder/onboarding/learning.json?search=&page=1") &&
            response.status() === 200,
        );
        const getListCardOnboading = await webBuilderAPI.getListCardOnboarding();
        const cardOnboading = getListCardOnboading.result.data.length;
        const listCardInPopup = await webBuilder.genLoc(webBuilder.stepInCardOnboarding).count();
        expect(cardOnboading).toEqual(listCardInPopup);
      });
    }
  });
  test(`@SB_PLB_OBD_65 [Web Builder] Verify trạng thái card trong Learning center khi hover vào`, async ({
    dashboard,
    snapshotFixture,
    conf,
    context,
  }) => {
    const getListCardOnboading = await webBuilderAPI.getListCardOnboarding();
    await test.step(`Đi đến WB -> Click ? ở góc phải màn hình để show popup Learning center -> Chọn Getting started`, async () => {
      await webBuilder.genLoc(webBuilder.xpathBtnLearningCenter).click();
      await expect(webBuilder.genLoc(webBuilder.xpathPopupLearningCenter)).toBeVisible();
      const cardOnboading = getListCardOnboading.result.data.length;
      const listCardInPopup = await webBuilder.genLoc(webBuilder.stepInCardOnboarding).count();
      expect(cardOnboading).toEqual(listCardInPopup);
    });

    await test.step(`Hover vào 1 card`, async () => {
      await webBuilder.genLoc(webBuilder.imgCardLearning).first().hover();
      await snapshotFixture.verify({
        page: dashboard,
        selector: webBuilder.xpathImgCardOnboarding(1),
        snapshotName: conf.caseConf.snapshot_hover_card,
      });
    });

    await test.step(`Click Explore more`, async () => {
      const url = getListCardOnboading.result.data[0].reference.match(/^(.*?)(?:\?|#|$)/)[1];
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        await webBuilder.genLoc(webBuilder.hyperlinkExploreMore).first().click(),
      ]);
      await newTab.waitForLoadState();
      expect(newTab.url()).toContain(url);
    });

    await test.step(`Click Practice on editor`, async () => {
      const cardName = getListCardOnboading.result.data[0].title;
      await webBuilder.genLoc(webBuilder.imgCardLearning).first().hover();
      await webBuilder.genLoc(webBuilder.buttonPractice).click();
      await expect(webBuilder.genLoc(webBuilder.xpathPopupLearningCenter)).not.toBeVisible();
      await expect(webBuilder.genLoc(webBuilder.popoverCardLearning)).toBeVisible();
      const titleCardInPopover = await webBuilder.genLoc(webBuilder.titleCardLearning).first().textContent();
      expect(cardName).toEqual(titleCardInPopover);
    });

    await test.step(`Click Close Learning Center`, async () => {
      await webBuilder.genLoc(webBuilder.xpathBtnLearningCenter).click();
      await expect(webBuilder.genLoc(webBuilder.xpathPopupLearningCenter)).toBeVisible();
      await webBuilder.genLoc(webBuilder.buttonClosePopupLearning).click();
      await expect(webBuilder.genLoc(webBuilder.xpathPopupLearningCenter)).not.toBeVisible();
    });
  });
});
