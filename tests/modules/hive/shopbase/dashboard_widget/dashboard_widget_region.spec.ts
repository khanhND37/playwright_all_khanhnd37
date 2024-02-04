import { expect, test } from "@core/fixtures";
import { HomePage } from "@pages/dashboard/home_page";
import { HiveWidgetPage } from "@pages/hive/hive_widget";

test.describe("Dashboard widget region", async () => {
  test.setTimeout(600 * 1000);
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
  test(`Check điều kiện hiển thị widget theo region @SB_HM_WG_2`, async ({ page, cConf, token }) => {
    widgetIds = [];
    for (const widgetData of cConf.widget_data) {
      const currentTime = Math.floor(Date.now() / 1000);
      widgetData.logic_widget.name = `${widgetData.logic_widget.name} ${currentTime}`;
      widgetData.ui_widget.title = `${widgetData.ui_widget.title} ${currentTime}`;
      const widgetUIData = widgetData.ui_widget;

      await test.step(`Tạo thành công widget config Screen khác nhau`, async () => {
        await hiveWidgetPage.clickAddNewButton();
        await hiveWidgetPage.fillDataTabLogic(widgetData.logic_widget);
        await hiveWidgetPage.switchTab("Config UI");
        await hiveWidgetPage.fillDataTabUIBasicWidget(widgetData.ui_widget);

        expect(await hiveWidgetPage.getFlashMessage()).toContain(cConf.message_success);
        await hiveWidgetPage.navigateToWidgetListPage();
        widgetId = await hiveWidgetPage.getWidgetId(widgetData.logic_widget.name);
        widgetIds.push(widgetId);
      });

      await test.step(`Login dashboard shop > kiểm tra hiển thị widget ở home page`, async () => {
        for (const shopData of cConf.accounts) {
          const homePage = new HomePage(page, shopData.domain);
          const accessToken = (
            await token.getWithCredentials({
              domain: shopData.shop_name,
              username: shopData.username,
              password: shopData.password,
            })
          ).access_token;

          const widgetIdsFromAPI = await homePage.clearCacheOfWidget(shopData.domain, accessToken, shopData.param);
          await homePage.loginWithToken(accessToken);
          await homePage.waitUtilNotificationIconAppear();

          for (const regionWidget of widgetData.logic_widget.regions) {
            if (regionWidget.region === shopData.region) {
              for (let i = 0; i < 30; i++) {
                const foundID = widgetIdsFromAPI.find(widgetIdFromAPI => widgetIdFromAPI === widgetId);
                if (typeof foundID === "undefined") {
                  await homePage.page.waitForTimeout(3 * 1000);
                  await homePage.clearCacheOfWidget(shopData.domain, accessToken, shopData.param);
                }
              }
              await homePage.page.reload();
              await homePage.page.waitForSelector(
                homePage.xpathBlockWidgetWithTitle("basic", widgetData.ui_widget.title),
              );
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
          }
          await homePage.logoutAccount();
        }
      });
    }
  });
});
