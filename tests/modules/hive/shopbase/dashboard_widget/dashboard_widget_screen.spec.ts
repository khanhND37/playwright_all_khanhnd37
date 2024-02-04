import { expect, test } from "@core/fixtures";
import { HiveWidgetPage } from "@pages/hive/hive_widget";
import { HomePage } from "@pages/dashboard/home_page";

test.describe("Dashboard widget screen", async () => {
  let hiveWidgetPage: HiveWidgetPage;
  let widgetIds: Array<number>;
  let widgetId: number;

  test.beforeEach(async ({ hiveSBase, conf }) => {
    hiveWidgetPage = new HiveWidgetPage(hiveSBase, conf.suiteConf.hive_domain);
    await hiveWidgetPage.navigateToMenu(hiveWidgetPage.menu.tool, hiveWidgetPage.subMenu.dashboardWidget);
  });

  test.afterEach(async () => {
    for (const item of widgetIds) {
      await hiveWidgetPage.deleteWidgetInList(item);
    }
  });
  test(`Check điều kiện hiển thị widget theo screen @SB_HM_WG_1`, async ({ dashboard, conf, cConf, token }) => {
    const homePage = new HomePage(dashboard, conf.suiteConf.domain);
    const currentTime = Math.floor(Date.now() / 1000);
    widgetIds = [];
    for (const widgetData of cConf.widget_data) {
      widgetData.logic_widget.name = `${widgetData.logic_widget.name} ${currentTime}`;
      widgetData.ui_widget.title = `${widgetData.ui_widget.title} ${currentTime}`;
      const widgetUIData = widgetData.ui_widget;

      await test.step(`Tạo thành công widget config Screen khác nhau`, async () => {
        await hiveWidgetPage.clickAddNewButton();
        await hiveWidgetPage.fillDataTabLogic(widgetData.logic_widget);
        await hiveWidgetPage.switchTab("Config UI");
        await hiveWidgetPage.fillDataTabUI(widgetData.ui_widget);

        expect(await hiveWidgetPage.getFlashMessage()).toContain(cConf.message_success);
        await hiveWidgetPage.navigateToWidgetListPage();
        widgetId = await hiveWidgetPage.getWidgetId(widgetData.logic_widget.name);
        widgetIds.push(widgetId);
      });

      await test.step(`Login dashboard shop > kiểm tra hiển thị widget ở home page`, async () => {
        const accessToken = (
          await token.getWithCredentials({
            domain: conf.suiteConf.shop_name,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;

        const widgetIdsFromAPI = await homePage.clearCacheOfWidget(
          conf.suiteConf.domain,
          accessToken,
          widgetData.param,
        );

        for (let i = 0; i < 30; i++) {
          const foundID = widgetIdsFromAPI.find(widgetIdFromAPI => widgetIdFromAPI === widgetId);
          if (typeof foundID === "undefined") {
            await homePage.page.waitForTimeout(3 * 1000);
            await homePage.clearCacheOfWidget(conf.suiteConf.domain, accessToken, widgetData.param);
          }
        }

        await homePage.page.reload();

        if (widgetData.logic_widget.screen === "ShopBase Home") {
          await homePage.page.waitForSelector(homePage.xpathBlockWidgetWithTitle("basic", widgetData.ui_widget.title));
          const widgetInfo = await homePage.getWidgetInfoTypeBasic(widgetData.ui_widget.title);

          expect(widgetInfo).toEqual(
            expect.objectContaining({
              desciption: widgetUIData.description,
              primaryButtonText: widgetUIData.primary_btn_text,
              primaryButtonLink: widgetUIData.primary_btn_link,
              secondaryButtonText: widgetUIData.secondary_btn_text,
              secondaryButtonLink: widgetUIData.secondary_btn_link,
              image: widgetUIData.image.status,
            }),
          );
        } else {
          await expect(
            homePage.genLoc(homePage.xpathBlockWidgetWithTitle("basic", widgetData.ui_widget.title)),
          ).toBeHidden();
        }
      });

      await test.step(`Mở app PrintHub > kiểm tra hiển thị widget ở các module trong app`, async () => {
        await homePage.navigateToSubMenu("Fulfillment", "PrintHub");
        expect(await homePage.isDBPageDisplay("Welcome to PrintHub!")).toBeTruthy();

        for (const page of conf.caseConf.modules) {
          await homePage.navigateToMenu(page.module);
          if (widgetData.logic_widget.screen === "ShopBase Home") {
            await expect(
              homePage.genLoc(homePage.xpathBlockWidgetWithTitle("basic", widgetData.ui_widget.title)),
            ).toBeHidden();
          } else {
            await homePage.page.waitForSelector(
              homePage.xpathBlockWidgetWithTitle("basic", widgetData.ui_widget.title),
            );
            const widgetInfo = await homePage.getWidgetInfoTypeBasic(widgetData.ui_widget.title);

            await expect(
              homePage.genLoc(homePage.xpathBlockWidgetWithTitle("basic", widgetData.ui_widget.title)),
            ).toBeVisible();
            expect(widgetInfo).toEqual(
              expect.objectContaining({
                desciption: widgetUIData.description,
                primaryButtonText: widgetUIData.primary_btn_text,
                primaryButtonLink: widgetUIData.primary_btn_link,
                secondaryButtonText: widgetUIData.secondary_btn_text,
                secondaryButtonLink: widgetUIData.secondary_btn_link,
                image: widgetUIData.image.status,
              }),
            );
          }
        }
        await homePage.goto(`admin`);
      });
    }
  });
});
