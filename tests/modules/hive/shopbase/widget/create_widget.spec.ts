import { HiveWidgetPage } from "@pages/hive/hive_widget";
import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { HomePage } from "@pages/dashboard/home_page";

test.describe("Create widget ShopBase @TS_SB", async () => {
  let hiveWidgetPage: HiveWidgetPage;
  let widgetId: number;

  test.beforeEach(async ({ hiveSBase, conf }) => {
    hiveWidgetPage = new HiveWidgetPage(hiveSBase, conf.suiteConf.hive_domain);
    await hiveWidgetPage.navigateToMenu(hiveWidgetPage.menu.tool, hiveWidgetPage.subMenu.dashboardWidget);
  });

  test.afterEach(async () => {
    await hiveWidgetPage.deleteWidgetInList(widgetId);
  });

  const data = loadData(__dirname, "DATA_DRIVEN_CREATE_WIDGET_AND_VERIFY_IN_DASHBOARD");
  for (let i = 0; i < data.caseConf.data.length; i++) {
    const caseData = data.caseConf.data[i];

    test(`${caseData.description} - @${caseData.case_id}`, async ({ conf, token, page, context }) => {
      test.slow();
      const currentTime = Math.floor(Date.now() / 1000);
      caseData.logic_widget.name = `${caseData.logic_widget.name} ${currentTime}`;

      await test.step(`Click tab Config Logic -> Nhập valid thông tin`, async () => {
        await hiveWidgetPage.navigateToCreateWidget();
        await hiveWidgetPage.fillDataTabLogic(caseData.logic_widget);
      });

      await test.step(`Click tab Config UI, hoàn thành thông tin tạo widget và kiểm tra hiển thị widget ở dashboard`, async () => {
        await hiveWidgetPage.switchTab("Config UI");
        const dataItem = caseData.ui_widget;
        dataItem.title = `${dataItem.title} ${currentTime}`;
        switch (caseData.widget_type) {
          case "basic":
            await hiveWidgetPage.fillDataTabUIBasicWidget(dataItem);
            break;
          case "center":
            await hiveWidgetPage.configUICenterWidget(dataItem);
            break;
          case "list":
            await hiveWidgetPage.configUIListWidget(dataItem);
            break;
        }
        const message = await hiveWidgetPage.getFlashMessage();
        expect(message).toContain(caseData.message_success);

        //Verify display widget just create in dashboard list
        await hiveWidgetPage.navigateToWidgetListPage();
        widgetId = await hiveWidgetPage.getWidgetId(caseData.logic_widget.name);

        //Verify display widget in dashboard
        // for (let j = 0; j < data.caseConf.shops.length; j++) {
        for (const shopData of data.caseConf.shops) {
          // const homePageLogin = new HomePage(page, data.caseConf.shops[j].domain);
          const homePageLogin = new HomePage(page, shopData.domain);

          const accessToken = (
            await token.getWithCredentials({
              // domain: data.caseConf.shops[j].shop_name,
              domain: shopData.shop_name,
              username: conf.suiteConf.username,
              password: conf.suiteConf.password,
            })
          ).access_token;

          const widgetIdsFromAPI = await homePageLogin.clearCacheOfWidget(
            // data.caseConf.shops[j].domain,
            shopData.domain,
            accessToken,
            // data.caseConf.shops.param,
            shopData.param,
          );

          for (let z = 0; z < 30; z++) {
            const foundID = widgetIdsFromAPI.find(widgetIdFromAPI => widgetIdFromAPI === widgetId);
            if (typeof foundID === "undefined") {
              await homePageLogin.page.waitForTimeout(3 * 1000);
              await homePageLogin.clearCacheOfWidget(
                // data.caseConf.shops[j].domain,
                shopData.domain,
                accessToken,
                // data.caseConf.shops.param,
                shopData.param,
              );
              break;
            }
          }

          await homePageLogin.loginWithToken(accessToken);
          await homePageLogin.waitUtilNotificationIconAppear();

          if (caseData.widget_type === "basic") {
            await homePageLogin.page.waitForSelector(homePageLogin.xpathBlockWidgetWithTitle("basic", dataItem.title));
            const widgetInfo = await homePageLogin.getWidgetInfoTypeBasic(dataItem.title);
            expect(widgetInfo).toEqual(
              expect.objectContaining({
                desciption: dataItem.description,
                primaryButtonText: dataItem.primary_btn_text,
                primaryButtonLink: dataItem.primary_btn_link,
                secondaryButtonText: dataItem.secondary_btn_text,
                secondaryButtonLink: dataItem.secondary_btn_link,
                image: dataItem.image.status,
              }),
            );

            const [page1] = await Promise.all([
              context.waitForEvent("page"),
              await homePageLogin
                .genLoc(homePageLogin.getXpathValueWidgetWithFieldClass("basic", dataItem.title, "primary-button"))
                .click(),
            ]);
            expect(page1.url()).toContain(dataItem.primary_btn_link);
            await page1.close();

            const [page2] = await Promise.all([
              context.waitForEvent("page"),
              await homePageLogin
                .genLoc(homePageLogin.getXpathValueWidgetWithFieldClass("basic", dataItem.title, "secondary-button"))
                .click(),
            ]);
            expect(page2.url()).toContain(dataItem.secondary_btn_link);
            await page2.close();
          } else if (caseData.widget_type === "center") {
            await homePageLogin.page.waitForSelector(homePageLogin.xpathBlockWidgetWithTitle("center", dataItem.title));
            const widgetInfo = await homePageLogin.getWidgetInfoTypeCenter(dataItem.title);
            expect(widgetInfo).toEqual(
              expect.objectContaining({
                desciption: dataItem.description,
                primaryButtonText: dataItem.primary_btn_text,
                primaryButtonLink: dataItem.primary_btn_link,
                image: dataItem.image.status,
              }),
            );

            const [page1] = await Promise.all([
              context.waitForEvent("page"),
              await homePageLogin
                .genLoc(homePageLogin.getXpathValueWidgetWithFieldClass("center", dataItem.title, "primary-button"))
                .click(),
            ]);
            expect(page1.url()).toContain(dataItem.primary_btn_link);
            await page1.close();
          } else if (caseData.widget_type === "list") {
            await homePageLogin.page.waitForSelector(homePageLogin.xpathBlockWidgetWithTitle("list", dataItem.title));
            const widgetInfo = await homePageLogin.getWidgetInfoTypeList(dataItem.title);
            for (let i = 0; i < widgetInfo.subList.length; i++) {
              expect(widgetInfo.subList[i]).toEqual(
                expect.objectContaining({
                  titleList: dataItem.sub_list[i].title_list,
                  descriptionList: dataItem.sub_list[i].description_list,
                  imageURL: dataItem.sub_list[i].image_url,
                }),
              );

              const [page1] = await Promise.all([
                context.waitForEvent("page"),
                await homePageLogin
                  .genLoc(
                    `(${homePageLogin.getXpathValueWidgetWithFieldClass(
                      "list",
                      dataItem.title,
                      "list-sub-item s-flex",
                    )})[${i + 1}]`,
                  )
                  .click(),
              ]);
              expect(page1.url()).toContain(dataItem.sub_list[i].link_list);
              await page1.close();
            }
            expect(widgetInfo.description).toEqual(dataItem.description);
          }
          await homePageLogin.logoutAccount();
        }
      });
    });
  }

  test(`Verify luồng tạo widget Upsell @SB_HP_WG_DB_US_1`, async ({ hiveSBase, conf, account }) => {
    const currentTime = Math.floor(Date.now() / 1000);
    let accountPage: AccountPage;

    await test.step(`Click tab Config Logic -> Nhập valid thông tin.
    Click tab Config UI -> Nhập valid thông tin. Click btn Create`, async () => {
      await hiveWidget.navigateToCreateWidget(hiveSBase);
      await hiveWidget.configLogic(hiveSBase, conf.caseConf.logic_widget, currentTime);
      await hiveWidget.chooseWidgetType(hiveSBase, conf.caseConf.ui_widget);
      await hiveWidget.configUIUpsellWidget(hiveSBase, conf.caseConf.ui_widget, currentTime);
      await hiveSBase.locator(`//button[@name="btn_create_and_edit"]`).click();

      //Verify display message when create successfully
      const message = await hiveSBase.locator(`//div[@class="alert alert-success alert-dismissable"]`).innerText();
      expect(message).toContain(conf.caseConf.message_success);

      //Back về màn Dashboard Widget List
      await hiveSBase.locator(`//a[normalize-space()="Dashboard Widget List"]`).click();

      //Verify display widget just create in dashboard list
      const nameWidget = await hiveSBase.locator(`(//a[@class="sonata-link-identifier"])[1]`).innerText();
      expect(nameWidget).toEqual(`${conf.caseConf.logic_widget.name} + ${currentTime}`);
    });

    await test.step(`Đăng nhập vào store thỏa mãn điều kiện widget`, async () => {
      accountPage = new AccountPage(account, conf.suiteConf.accounts_domain);
      await accountPage.createNewStore(conf.caseConf.data as unknown as ConfigStore, currentTime);
      await account.locator("//span[normalize-space()='Take me to my store']").click();
      await account.waitForSelector(".nav-sidebar");
      const shopDomainDb = await account.innerText("//p[@class='text-truncate font-12']");
      const shopName =
        `${`${conf.caseConf.data.name}`.replaceAll(" ", "-")}` + `${-currentTime}.${conf.caseConf.data.env_domain}`;
      expect(shopDomainDb).toEqual(shopName);

      //verify title
      const title = await account
        .locator(`((//div[@class="widget-dashboard widget-dashboard-basic-type"])[1]//h5)[1]`)
        .innerText();
      expect(title).toEqual(`${conf.caseConf.ui_widget.title} + ${currentTime}`);

      //verify description
      const description = await account
        .locator(`((//div[@class="widget-dashboard widget-dashboard-basic-type"])[1]//p)[1]`)
        .innerText();
      expect(description).toEqual(conf.caseConf.ui_widget.description);

      //verify primary button text
      const priBtnText = await account
        .locator(`((//div[@class="widget-dashboard-cta s-flex align-items-center"])[1]//a)[1]`)
        .innerText();
      expect(priBtnText).toEqual(conf.caseConf.ui_widget.primary_btn_text);

      //verify secondary button text
      const secondBtnText = await account
        .locator(`(//div[contains(@class, 'align-items-center')][1]//a)[4]`)
        .innerText();
      expect(secondBtnText).toEqual(conf.caseConf.ui_widget.secondary_btn_text);
    });

    await test.step(`Click button Primary Button`, async () => {
      await account.locator(`((//div[@class="widget-dashboard-cta s-flex align-items-center"])[1]//a)[1]`).click();
      const urlPricingPage = await account.url().toString();
      const shopName =
        `${`${conf.caseConf.data.name}`.replaceAll(" ", "-")}` + `${-currentTime}.${conf.caseConf.data.env_domain}`;
      const urlPricingExpected = `${`https://`}${shopName}${`/admin/pricing`}`;
      expect(urlPricingPage).toContain(urlPricingExpected);
      const annualPackage = await account.locator(`//div[@class="period active"]`).innerText();
      expect(annualPackage).toContain(conf.caseConf.annual_package);
    });

    await test.step(`Click sang tab Package Monthly`, async () => {
      await account.locator(`//div[normalize-space()="Monthly"]`).click();
      const monthlyPackage = await account.locator(`//div[@class="period active"]`).innerText();
      expect(monthlyPackage).not.toContain(conf.caseConf.annual_package);
    });

    await test.step(`Quay về trang Home -> đi đến trang Pricing bằng cách -> Click vào Settings
    -> Click vào session Account -> Click mục Upgrade plan -> Chọn tab Annual package`, async () => {
      await hiveWidget.navigateToPricingPage(account);
      const annualPackage = await account.locator(`//div[@class="period active"]`).innerText();
      expect(annualPackage).toContain(conf.caseConf.annual_package);
    });

    await test.step(`Thực hiện confirm plan gói Basic Base (yearly)
    1. Click button Choose this plan package Basic Base (yearly)
    2. Click button Start Plan`, async () => {
      await account
        .locator(
          `//div[normalize-space()="Basic Base"]/parent::div//following-sibling::div//` +
            `span[contains(text(),'Choose this plan')]`,
        )
        .click();

      const priceNew = await account
        .locator(`//span[normalize-space()="Price:"]//following-sibling::div//span[@class="text-bold text-right"]`)
        .innerText();
      const priceSale = Number(removeCurrencySymbol(priceNew));

      const price = await account
        .locator(
          `//span[normalize-space()="Price:"]//following-sibling::div//span[@class="text-line-though text-gray200"]`,
        )
        .innerText();
      const priceDefault = Number(removeCurrencySymbol(price));

      const priceExpect = priceDefault - priceDefault * conf.caseConf.sale;
      expect(priceExpect).toEqual(priceSale);
      await account.locator(`//button[normalize-space()="Start plan"]`).click();
      await expect(
        account.locator(
          `(//div[normalize-space()="You are currently on the Basic Base plan and you are billed annually."])[3]`,
        ),
      ).toBeVisible();

      await test.step(`Click Home menu`, async () => {
        await account.locator(`//span[@class="unite-ui-dashboard__aside--text" and normalize-space()="Home"]`).click();
        await expect(
          account.locator(`//h5[normalize-space()="${conf.caseConf.ui_widget.title} + ${currentTime}"]`),
        ).not.toBeVisible();
      });

      await test.step(`Đăng nhập 1 store khác thoả mãn điều kiện hiển thị widget
    1. Click widget
    2. thực hiện confirm plan gói Standard Base (Yearly)
    3. Check Balance`, async () => {
        await accountPage.signInNewStore(
          String(`${currentTime} 1`),
          conf.caseConf.data.business_model,
          conf.caseConf.data.platform,
        );
        await account.locator("//span[normalize-space()='Take me to my store']").click();
        await account.waitForSelector(".nav-sidebar");
        await account.locator(`((//div[@class="widget-dashboard-cta s-flex align-items-center"])[1]//a)[1]`).click();
        await account
          .locator(
            `//div[normalize-space()="Standard Base"]/parent::div//following-sibling::div//` +
              `span[contains(text(),'Choose this plan')] `,
          )
          .click();

        const priceNew = await account
          .locator(`//span[normalize-space()="Price:"]//following-sibling::div//span[@class="text-bold text-right"]`)
          .innerText();
        const priceSale = Number(removeCurrencySymbol(priceNew));

        const price = await account
          .locator(
            `//span[normalize-space()="Price:"]//following-sibling::div//span[@class="text-line-though text-gray200"]`,
          )
          .innerText();
        const priceDefault = Number(removeCurrencySymbol(price));

        const priceExpect = priceDefault - priceDefault * conf.caseConf.sale;
        expect(priceExpect).toEqual(priceSale);
        await account.locator(`//button[normalize-space()="Start plan"]`).click();
        await expect(
          account.locator(
            `(//div[normalize-space()="You are currently on the Standard Base plan and you are billed annually."])[3]`,
          ),
        ).toBeVisible();
      });

      await test.step(`Đăng nhập 1 store khác thoả mãn điều kiện hiển thị widget
    1. Click widget
    2. thực hiện confirm plan gói Standard Base (Yearly)
    3. Check Balance`, async () => {
        await accountPage.signInNewStore(
          String(`${currentTime} 2`),
          conf.caseConf.data.business_model,
          conf.caseConf.data.platform,
        );
        await account.locator("//span[normalize-space()='Take me to my store']").click();
        await account.waitForSelector(".nav-sidebar");
        await account.locator(`((//div[@class="widget-dashboard-cta s-flex align-items-center"])[1]//a)[1]`).click();
        await account
          .locator(
            `//div[normalize-space()="Pro Base"]/parent::div//following-sibling::div//` +
              `span[contains(text(),'Choose this plan')] `,
          )
          .click();

        const priceNew = await account
          .locator(`//span[normalize-space()="Price:"]//following-sibling::div//span[@class="text-bold text-right"]`)
          .innerText();
        const priceSale = Number(removeCurrencySymbol(priceNew));

        const price = await account
          .locator(
            `//span[normalize-space()="Price:"]//following-sibling::div//span[@class="text-line-though text-gray200"]`,
          )
          .innerText();
        const priceDefault = Number(removeCurrencySymbol(price));

        const priceExpect = priceDefault - priceDefault * conf.caseConf.sale;
        expect(priceExpect).toEqual(priceSale);
        await account.locator(`//button[normalize-space()="Start plan"]`).click();
        await expect(
          account.locator(
            `(//div[normalize-space()="You are currently on the Pro Base plan and you are billed annually."])[3]`,
          ),
        ).toBeVisible();
      });
    });
  });
});
