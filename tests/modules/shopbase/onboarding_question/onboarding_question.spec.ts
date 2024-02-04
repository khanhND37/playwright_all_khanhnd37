import { expect, test } from "@core/fixtures";
import { AccountPage } from "@pages/dashboard/accounts";
import type { OnboardingQuestion } from "@types";
import { DashboardPage } from "@pages/dashboard/dashboard";

let accountPage: AccountPage;
let listOnboardingQuestion: OnboardingQuestion[];
test.describe("Onboarding question when create store", async () => {
  test.beforeEach(async ({ conf }) => {
    test.setTimeout(conf.suiteConf.time_out);
  });

  test(`@SB_AU_AL_08 Verify tạo shop từ landing page shopbase trường hợp seller đã có SB account`, async ({
    conf,
    browser,
    context,
  }) => {
    // Vì khi tạo shop trên prodtest sẽ là env Prod nên skip
    if (process.env.ENV === "prodtest") {
      return;
    }
    //Mỗi lần chạy sẽ tạo store mới. Thread : https://ocgwp.slack.com/archives/C0S2ESHN2/p1705652348881569
    await test.step(`Từ landing page shopbase >
    Click Login > Login by SB account > Input shop name >  Click Create > Input general information > Click Next button`, async () => {
      const ctx = await browser.newContext();
      const newPage = await ctx.newPage();
      const currentTime = String(Math.floor(Date.now() / 1000));

      //Login acc
      newPage.goto(conf.suiteConf.url_sign_in);
      await newPage.waitForLoadState("networkidle");
      accountPage = new AccountPage(newPage, conf.suiteConf.url_sign_in);
      await accountPage.login({
        email: conf.suiteConf.username,
        password: conf.suiteConf.password,
        redirectToAdmin: false,
      });
      await accountPage.waitUntilElementVisible(accountPage.xpathSelectShopTitle);

      //Input store name > Create
      await accountPage.genLoc(accountPage.xpathAddNewShopBtn).click();
      await accountPage.inputShopNameAndClickBtnCreate(
        context,
        `${conf.caseConf.data[0].shop_name}_${currentTime}`,
        "",
      );

      //Input contact
      await accountPage.addYourContact(
        conf.suiteConf.onboarding_data.store_coutry,
        conf.suiteConf.onboarding_data.per_location,
        conf.suiteConf.onboarding_data.phone_number,
      );
      await accountPage.page.waitForLoadState("domcontentloaded");

      //Verify hiển thị list câu hỏi và các câu trả lời tương ứng
      expect(await accountPage.isTextVisible(conf.suiteConf.general_mode.title_onboarding_question)).toBe(true);
      listOnboardingQuestion = conf.suiteConf.general_mode.onboarding_question;
      expect(await accountPage.isListQuestionVisible(listOnboardingQuestion)).toBe(true);
    });

    await test.step(`Chọn câu trả lời cho từng câu hỏi > 
    Click button Next > Click button I want a ShopBase store > 
    Click button No thanks, I don't want to import`, async () => {
      //chọn câu trả lời cho các câu hỏi

      await accountPage.answerQuestionInOnboarding(conf.caseConf.data[0].answers);

      //click button next
      await accountPage.clickOnBtnWithLabel("Next");

      //Click button I want a ShopBase store
      await accountPage.clickOnBtnWithLabel("I want a ShopBase store");

      //Click button No thanks, I don't want to import
      await accountPage.page.click(accountPage.xpathButtonNoImport);

      //verify shop sau khi tạo
      await accountPage.page.waitForSelector(accountPage.xpathCreateStoreSuccess);
      await accountPage.page.waitForLoadState("networkidle");
      await accountPage.page.waitForSelector(accountPage.xpathNotify);
      const shopDomain = await accountPage.genLoc(accountPage.xpathShopDomain).innerText();
      expect(shopDomain).toContain(conf.caseConf.data[0].shop_name);
      const dashboard = new DashboardPage(accountPage.page, shopDomain);
      await dashboard.waitUtilNotificationIconAppear();

      //Verify logo shop
      expect(await dashboard.genLoc(dashboard.xpathLogoShop).getAttribute("src")).toContain(
        conf.caseConf.data[0].logo_shop,
      );

      //Verify hiển thị menu Products/ Fulfillment
      await dashboard.navigateToMenu("Products");
      expect(await dashboard.isSubMenuActived("All products")).toBe(true);
      await dashboard.navigateToMenu("Fulfillment");
      expect(await dashboard.isTextVisible("PrintHub")).toBe(true);
      expect(await dashboard.isTextVisible("PlusHub")).toBe(true);

      //Logout
      await dashboard.goto("/admin/logout");
      await dashboard.waitUntilElementVisible(accountPage.xpathTitleSignInPage);
    });

    await test.step(`Từ landing page shopbase > Click Login > Login by SB account > Input shop name > Click Create > Input general information > Click Next button`, async () => {
      const currentTime = String(Math.floor(Date.now() / 1000));

      //Login
      await accountPage.goto(conf.suiteConf.url_sign_in);
      await accountPage.waitUntilElementVisible(accountPage.xpathTitleSignInPage);
      await accountPage.login({
        email: conf.suiteConf.username,
        password: conf.suiteConf.password,
        redirectToAdmin: false,
      });
      await accountPage.waitUntilElementVisible(accountPage.xpathSelectShopTitle);

      //Input store name > Create
      await accountPage.genLoc(accountPage.xpathAddNewShopBtn).click();
      await accountPage.inputShopNameAndClickBtnCreate(
        context,
        `${conf.caseConf.data[1].shop_name}_${currentTime}`,
        "",
      );

      //Input contact
      await accountPage.addYourContact(
        conf.suiteConf.onboarding_data.store_coutry,
        conf.suiteConf.onboarding_data.per_location,
        conf.suiteConf.onboarding_data.phone_number,
      );
      await accountPage.page.waitForLoadState("domcontentloaded");

      //verify hiển thị các câu hỏi và câu trả lời
      expect(await accountPage.isTextVisible(conf.suiteConf.general_mode.title_onboarding_question)).toBe(true);
      listOnboardingQuestion = conf.suiteConf.general_mode.onboarding_question;
      expect(await accountPage.isListQuestionVisible(listOnboardingQuestion)).toBe(true);
    });

    await test.step(`Chọn câu trả lời cho từng câu hỏi > Click button Next > Click button I want a PlusBase store >`, async () => {
      //chọn câu trả lời
      await accountPage.answerQuestionInOnboarding(conf.caseConf.data[1].answers);

      //click button next
      await accountPage.clickOnBtnWithLabel("Next");

      //Click button I want a PlusBase store
      await accountPage.clickOnBtnWithLabel("I want a PlusBase store");

      //Verify shop sau khi tạo
      await accountPage.page.waitForSelector(accountPage.xpathCreateStoreSuccess);
      await accountPage.page.waitForLoadState("networkidle");
      await accountPage.page.waitForSelector(accountPage.xpathNotify);
      const shopDomain = await accountPage.genLoc(accountPage.xpathShopDomain).innerText();
      expect(shopDomain).toContain(conf.caseConf.data[1].shop_name);
      const dashboard = new DashboardPage(accountPage.page, shopDomain);
      await dashboard.waitUtilNotificationIconAppear();

      //Verify logo shop
      expect(await dashboard.genLoc(dashboard.xpathLogoShop).getAttribute("src")).toContain(
        conf.caseConf.data[1].logo_shop,
      );

      //Verify hiển thị menu Dropship products / POD products
      await dashboard.navigateToMenu("Dropship products");
      expect(await dashboard.isSubMenuActived("All products")).toBe(true);
      await dashboard.navigateToMenu("POD products");
      expect(await dashboard.isSubMenuActived("All campaigns")).toBe(true);

      //Logout
      await dashboard.goto("/admin/logout");
      await dashboard.waitUntilElementVisible(accountPage.xpathTitleSignInPage);
    });

    await test.step(`Từ landing page shopbase > Click Login > Login by SB account > Input shop name > Click Create > Input general information > Click Next button`, async () => {
      const currentTime = String(Math.floor(Date.now() / 1000));

      //Login
      await accountPage.goto(conf.suiteConf.url_sign_in);
      await accountPage.waitUntilElementVisible(accountPage.xpathTitleSignInPage);
      await accountPage.login({
        email: conf.suiteConf.username,
        password: conf.suiteConf.password,
        redirectToAdmin: false,
      });
      await accountPage.waitUntilElementVisible(accountPage.xpathSelectShopTitle);

      //Input store name > Create
      await accountPage.genLoc(accountPage.xpathAddNewShopBtn).click();
      await accountPage.inputShopNameAndClickBtnCreate(
        context,
        `${conf.caseConf.data[2].shop_name}_${currentTime}`,
        "",
      );

      //Input contact
      await accountPage.addYourContact(
        conf.suiteConf.onboarding_data.store_coutry,
        conf.suiteConf.onboarding_data.per_location,
        conf.suiteConf.onboarding_data.phone_number,
      );
      await accountPage.page.waitForLoadState("domcontentloaded");

      //Verify hiển thị list câu hỏi và các câu trả lời tương ứng
      expect(await accountPage.isTextVisible(conf.suiteConf.general_mode.title_onboarding_question)).toBe(true);
      listOnboardingQuestion = conf.suiteConf.general_mode.onboarding_question;
      expect(await accountPage.isListQuestionVisible(listOnboardingQuestion)).toBe(true);
    });
    await test.step(`Chọn câu trả lời cho từng câu hỏi > Click button Next`, async () => {
      //chọn câu trả lời

      await accountPage.answerQuestionInOnboarding(conf.caseConf.data[2].answers);

      //click button next
      await accountPage.clickOnBtnWithLabel("Next");

      //verify shop sau khi tạo
      await accountPage.page.waitForSelector(accountPage.xpathCreateStoreSuccess);
      await accountPage.page.waitForLoadState("networkidle");
      await accountPage.page.waitForSelector(accountPage.xpathNotify);
      const shopDomain = await accountPage.genLoc(accountPage.xpathShopDomain).innerText();
      expect(shopDomain).toContain(conf.caseConf.data[2].shop_name);
      const dashboard = new DashboardPage(accountPage.page, shopDomain);
      await dashboard.waitUtilNotificationIconAppear();

      //Verify logo
      expect(await dashboard.genLoc(dashboard.xpathLogoShop).getAttribute("src")).toContain(
        conf.caseConf.data[2].logo_shop,
      );

      //Verify hiển thị menu Campaigns
      await dashboard.navigateToMenu("Campaigns");
      expect(await dashboard.isSubMenuActived("All campaigns")).toBe(true);
    });
  });
});

test.describe("Onboarding question when create store from landing page PB/ PLB", async () => {
  test.beforeEach(async ({ conf }) => {
    test.setTimeout(conf.suiteConf.time_out);
  });

  test(`@SB_AU_AL_06 Verify tạo shop từ landing page plusbase trường hợp seller đã có SB account`, async ({
    conf,
    browser,
    context,
  }) => {
    // Vì khi tạo shop trên prodtest sẽ là env prod nên skip
    if (process.env.ENV === "prodtest") {
      return;
    }
    await test.step(`Từ Landing page printbase > Click Login > Login by SB account > Input shop name > Click Create`, async () => {
      const ctx = await browser.newContext();
      const newPage = await ctx.newPage();
      const currentTime = String(Math.floor(Date.now() / 1000));

      //Open landing page plusbase
      newPage.goto(conf.suiteConf.landing_page_plb_url);
      await newPage.waitForLoadState("networkidle");

      //Login acc
      accountPage = new AccountPage(newPage, conf.suiteConf.landing_page_plb_url);
      await accountPage.login({
        email: conf.suiteConf.username,
        password: conf.suiteConf.password,
        redirectToAdmin: false,
      });
      await accountPage.waitUntilElementVisible(accountPage.xpathSelectShopTitle);
      await accountPage.inputShopNameAndClickBtnCreate(
        context,
        `${conf.caseConf.data[0].shop_name}_${currentTime}`,
        "",
      );
    });

    await test.step(`Input general information > Click Next button `, async () => {
      //Input contact
      await accountPage.addYourContact(
        conf.suiteConf.onboarding_data.store_coutry,
        conf.suiteConf.onboarding_data.per_location,
        conf.suiteConf.onboarding_data.phone_number,
      );
      await accountPage.page.waitForLoadState("domcontentloaded");

      //Verify hiển thị list câu hỏi và các câu trả lời tương ứng
      expect(await accountPage.isTextVisible(conf.suiteConf.plusbase_mode.title_onboarding_question)).toBe(true);
      listOnboardingQuestion = conf.suiteConf.plusbase_mode.onboarding_question;
      expect(await accountPage.isListQuestionVisible(listOnboardingQuestion)).toBe(true);
    });

    await test.step(`Chọn câu trả lời cho từng câu hỏi > Click button Next`, async () => {
      //chọn câu trả lời
      await accountPage.answerQuestionInOnboarding(conf.caseConf.data[0].answers);

      //click button next
      await accountPage.clickOnBtnWithLabel("Next");

      //Verify shop sau khi tạo
      await accountPage.page.waitForSelector(accountPage.xpathCreateStoreSuccess);
      await accountPage.page.waitForLoadState("networkidle");
      await accountPage.page.waitForSelector(accountPage.xpathNotify);
      const shopDomain = await accountPage.genLoc(accountPage.xpathShopDomain).innerText();
      expect(shopDomain).toContain(conf.caseConf.data[0].shop_name);

      //Verify logo
      const dashboard = new DashboardPage(accountPage.page, shopDomain);
      await dashboard.waitUtilNotificationIconAppear();
      expect(await dashboard.genLoc(dashboard.xpathLogoShop).getAttribute("src")).toContain(
        conf.caseConf.data[0].logo_shop,
      );

      //Verify hiển thị menu Dropship products / POD products
      await dashboard.navigateToMenu("Dropship products");
      expect(await dashboard.isSubMenuActived("All products")).toBe(true);
      await dashboard.navigateToMenu("POD products");
      expect(await dashboard.isSubMenuActived("All campaigns")).toBe(true);
    });
  });

  test(`@SB_AU_AL_04 Verify tạo shop từ landing page printbase trường hợp seller đã có SB account`, async ({
    conf,
    browser,
    context,
  }) => {
    // Vì khi tạo shop trên prodtest sẽ là env prod nên skip
    if (process.env.ENV === "prodtest") {
      return;
    }
    await test.step(`Từ Landing page printbase > Click Login > Login by SB account > Input shop name > Click Create`, async () => {
      const ctx = await browser.newContext();
      const newPage = await ctx.newPage();
      const currentTime = String(Math.floor(Date.now() / 1000));

      //Open landing page plusbase
      newPage.goto(conf.suiteConf.landing_page_pb_url);
      await newPage.waitForLoadState("networkidle");

      //Login account
      accountPage = new AccountPage(newPage, conf.suiteConf.landing_page_pb_url);
      await accountPage.login({
        email: conf.suiteConf.username,
        password: conf.suiteConf.password,
        redirectToAdmin: false,
      });

      await accountPage.waitUntilElementVisible(accountPage.xpathSelectShopTitle);
      await accountPage.inputShopNameAndClickBtnCreate(
        context,
        `${conf.caseConf.data[0].shop_name}_${currentTime}`,
        "",
      );
    });

    await test.step(`Input general information > Click Next button `, async () => {
      //Input contact
      await accountPage.addYourContact(
        conf.suiteConf.onboarding_data.store_coutry,
        conf.suiteConf.onboarding_data.per_location,
        conf.suiteConf.onboarding_data.phone_number,
      );
      await accountPage.page.waitForLoadState("domcontentloaded");

      //Verify hiển thị title onboarding question
      expect(await accountPage.isTextVisible(conf.suiteConf.printbase_mode.title_onboarding_question)).toBe(true);
      listOnboardingQuestion = conf.suiteConf.printbase_mode.onboarding_question;
      expect(await accountPage.isListQuestionVisible(listOnboardingQuestion)).toBe(true);
    });

    await test.step(`Chọn câu trả lời cho từng câu hỏi > Click button Next`, async () => {
      //chọn câu trả lời
      await accountPage.answerQuestionInOnboarding(conf.caseConf.data[0].answers);

      //click button next
      await accountPage.clickOnBtnWithLabel("Next");

      //Verify shop sau khi tạo
      await accountPage.page.waitForSelector(accountPage.xpathCreateStoreSuccess);
      await accountPage.page.waitForLoadState("networkidle");
      await accountPage.page.waitForSelector(accountPage.xpathNotify);
      const shopDomain = await accountPage.genLoc(accountPage.xpathShopDomain).innerText();
      expect(shopDomain).toContain(conf.caseConf.data[0].shop_name);
      const dashboard = new DashboardPage(accountPage.page, shopDomain);
      await dashboard.waitUtilNotificationIconAppear();

      //Verify logo shop
      expect(await dashboard.genLoc(dashboard.xpathLogoShop).getAttribute("src")).toContain(
        conf.caseConf.data[0].logo_shop,
      );

      //Verify hiển thị menu Campaigns
      await dashboard.navigateToMenu("Campaigns");
      expect(await dashboard.isSubMenuActived("All campaigns")).toBe(true);
    });
  });
});
