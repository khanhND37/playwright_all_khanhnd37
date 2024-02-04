import { expect, test } from "@core/fixtures";
import { HomePage } from "@pages/dashboard/home_page";
import { HiveWidgetPage } from "@pages/hive/hive_widget_v2";
import type { SbHmWg3 } from "./dashboard_widget_package";

test.describe("Dashboard widget package", async () => {
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

  test(`Check điều kiện hiển thị widget theo package @SB_HM_WG_3`, async ({ page, cConf, token, context, conf }) => {
    test.slow();
    widgetIds = [];
    const currentTime = Math.floor(Date.now() / 1000);
    const caseConf = cConf as SbHmWg3;

    await test.step(`Tạo thành công widget config package khác nhau`, async () => {
      for (const widgetData of caseConf.widgets) {
        await hiveWidgetPage.clickAddNewButton();

        // fill content tab logic
        widgetData.tabs.logic.name = `${widgetData.tabs.logic.name} ${currentTime}`;
        await hiveWidgetPage.fillDataTabLogic(widgetData.tabs.logic);

        // Switch tab
        await hiveWidgetPage.switchTab("Config UI");

        // fill content tab ui
        const tabUIData = widgetData.tabs.ui;
        tabUIData.title = `${tabUIData.title} ${currentTime}`;
        await hiveWidgetPage.fillDataTabUIWidget(tabUIData);

        expect(await hiveWidgetPage.getFlashMessage()).toContain(cConf.message_success);

        widgetId = await hiveWidgetPage.getWidgetId();
        widgetIds.push(widgetId);
        await hiveWidgetPage.navigateToWidgetListPage();
      }
    });

    await test.step(`Login dashboard shop > kiểm tra hiển thị widget ở home page`, async () => {
      for (const shopData of caseConf.shops) {
        const homePage = new HomePage(page, shopData.domain);
        const accessToken = (
          await token.getWithCredentials({
            domain: shopData.shop_name,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;

        const widgetIdsFromAPI = await homePage.clearCacheOfWidget(shopData.domain, accessToken, shopData.param);

        let found = false;
        for (const widgetData of caseConf.widgets) {
          for (const packageWidget of widgetData.tabs.logic.packages) {
            if (packageWidget === shopData.package) {
              found = true;
              break;
            }
          }
        }

        if (found) {
          // check nếu clear cache lần đầu mà response không có id của các widget đã tạo thì tiếp tục clear cache
          for (let i = 0; i < 10; i++) {
            for (const element of widgetIds) {
              const foundID = widgetIdsFromAPI.find(widgetIdFromAPI => widgetIdFromAPI === element);
              if (typeof foundID === "undefined") {
                await homePage.page.waitForTimeout(3 * 1000);
                await homePage.clearCacheOfWidget(shopData.domain, accessToken, shopData.param);
              }
            }
          }

          await homePage.loginWithToken(accessToken);
          await homePage.waitUtilNotificationIconAppear();

          for (const widgetData of caseConf.widgets) {
            const configUIWidget = widgetData.tabs.ui;

            // verify widget basic
            if (configUIWidget.widget_type === "basic") {
              await homePage.page.waitForSelector(homePage.xpathBlockWidgetWithTitle("basic", configUIWidget.title));
              const widgetInfo = await homePage.getWidgetInfoTypeBasic(configUIWidget.title);
              expect(widgetInfo).toEqual(
                expect.objectContaining({
                  desciption: configUIWidget.description,
                  primaryButtonText: configUIWidget.primary_button.text,
                  primaryButtonLink: configUIWidget.primary_button.link,
                  secondaryButtonText: configUIWidget.secondary_button.text,
                  secondaryButtonLink: configUIWidget.secondary_button.link,
                  image: true,
                }),
              );
              // click primary btn
              const [newPage] = await Promise.all([
                context.waitForEvent("page"),
                await homePage
                  .genLoc(homePage.getXpathValueWidgetWithFieldClass("basic", configUIWidget.title, "primary-button"))
                  .click(),
              ]);
              expect(newPage.url()).toContain(configUIWidget.primary_button.link);
              await newPage.close();
              // click secondary btn
              const [newPageSec] = await Promise.all([
                context.waitForEvent("page"),
                await homePage
                  .genLoc(homePage.getXpathValueWidgetWithFieldClass("basic", configUIWidget.title, "secondary-button"))
                  .click(),
              ]);
              expect(newPageSec.url()).toContain(configUIWidget.secondary_button.link);
              await newPageSec.close();
            }
            // verify widget center
            else if (configUIWidget.widget_type === "center") {
              await homePage.page.waitForSelector(homePage.xpathBlockWidgetWithTitle("center", configUIWidget.title));
              const widgetInfo = await homePage.getWidgetInfoTypeCenter(configUIWidget.title);
              expect(widgetInfo).toEqual(
                expect.objectContaining({
                  desciption: configUIWidget.description,
                  primaryButtonText: configUIWidget.primary_button.text,
                  primaryButtonLink: configUIWidget.primary_button.link,
                  image: true,
                }),
              );
              // click primary btn
              const [newPage] = await Promise.all([
                context.waitForEvent("page"),
                await homePage
                  .genLoc(homePage.getXpathValueWidgetWithFieldClass("center", configUIWidget.title, "primary-button"))
                  .click(),
              ]);

              expect(newPage.url()).toContain(configUIWidget.primary_button.link);
              await newPage.close();
            }
            // verify widget list
            else if (configUIWidget.widget_type === "list") {
              await homePage.page.waitForSelector(homePage.xpathBlockWidgetWithTitle("list", configUIWidget.title));
              const widgetInfo = await homePage.getWidgetInfoTypeList(configUIWidget.title);

              expect(widgetInfo.description).toEqual(configUIWidget.description);
              // verify thông tin của từng widget nhỏ trong widget list
              for (let i = 0; i < widgetInfo.subList.length; i++) {
                expect(widgetInfo.subList[i]).toEqual(
                  expect.objectContaining({
                    titleList: configUIWidget.childs[i].title,
                    descriptionList: configUIWidget.childs[i].descripition,
                    imageURL: configUIWidget.childs[i].image_url,
                  }),
                );
                // click vào cả block widget > check mở đúng link
                const [newPage] = await Promise.all([
                  context.waitForEvent("page"),
                  await homePage
                    .genLoc(
                      `(${homePage.getXpathValueWidgetWithFieldClass(
                        "list",
                        configUIWidget.title,
                        "list-sub-item s-flex",
                      )})[${i + 1}]`,
                    )
                    .click(),
                ]);
                expect(newPage.url()).toContain(configUIWidget.childs[i].link);
                await newPage.close();
              }
            }
          }
        }
        // verify không hiển thị widget ở shop không thỏa mãn điều kiện package
        else {
          await homePage.loginWithToken(accessToken);
          await homePage.waitUtilNotificationIconAppear();
          for (const widgetData of caseConf.widgets) {
            const configUIWidget = widgetData.tabs.ui;
            await expect(
              homePage.genLoc(homePage.xpathBlockWidgetWithTitle(configUIWidget.widget_type, configUIWidget.title)),
            ).toBeHidden();
          }
        }

        await homePage.logoutAccount();
      }
    });
  });
});
