import { expect } from "@playwright/test";
import { test } from "@fixtures/theme";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ReviewPage } from "@pages/dashboard/product_reviews";
import { BoostConvertInsidePage } from "@pages/dashboard/apps/boost_convert/boost_convert_inside";
import { BoostUpsellInsidePage } from "@pages/dashboard/apps/boost-upsell/boost-upsell-inside";
import { AppsAPI } from "@pages/api/apps";
import { SettingThemeAPI } from "@pages/api/themes_setting";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { loadData } from "@core/conf/conf";
import { PreferencesPage } from "@pages/dashboard/preference";
import { OnlineStoreDomainPage } from "@pages/dashboard/online_store_domains";
import { DashboardAPI } from "@pages/api/dashboard";
import { OnlineStorePage } from "@pages/dashboard/online_store";
import { AccountSettingAPI } from "@pages/api/account_setting";

test.describe("Permission Staff acc with theme v2", async () => {
  let accountSettingApi: AccountSettingAPI;
  let themeSettingAPI: SettingThemeAPI;
  let themeSetting: number;
  let pageStaff;
  let domain;
  let email;
  let password;
  let staffId;
  let moduleName;
  let conf;

  const generateRandomTitle = (): string => {
    const timestamp = new Date().getTime();
    return `test_${timestamp}`;
  };

  test.beforeEach(async ({ conf, theme, authRequest }) => {
    await test.step(`Edit permissions off staff acc`, async () => {
      themeSetting = conf.caseConf.themes_setting;
      domain = conf.suiteConf.domain;
      email = conf.suiteConf.staff.username;
      password = conf.suiteConf.staff.password;
      staffId = conf.suiteConf.staff_id;
      moduleName = conf.caseConf.modules.module_name;

      accountSettingApi = new AccountSettingAPI(domain, authRequest);
      themeSettingAPI = new SettingThemeAPI(theme);
      await themeSettingAPI.publishTheme(themeSetting);
      await accountSettingApi.editPermissions(staffId, false, moduleName);
    });
  });

  test(`@SB_SET_ACC_PMS_Aug23_134 Verify features "Product Reviews" when Staff have permission "Apps" Với theme V2`, async ({
    browser,
    conf,
    dashboard,
  }) => {
    pageStaff = await browser.newPage();
    const accountPageStaff = new DashboardPage(pageStaff, domain);
    const reviewPageStaff = new ReviewPage(pageStaff, domain);
    const reviewPageOwner = new ReviewPage(dashboard, domain);
    const dataProductReview = conf.caseConf.data_product_review;
    const title = generateRandomTitle();

    await test.step(`- Tại acc staff > go to Apps > select "Product Reviews" > select "Product groups" > Add "Product groups" với data > cilck btn "Save"`, async () => {
      await accountPageStaff.login({
        email: email,
        password: password,
      });

      await accountPageStaff.waitUtilNotificationIconAppear();
      await reviewPageStaff.gotoProductgroups();
      await reviewPageStaff.editProductGroupByIndex({
        title: title,
        groupProductBy: dataProductReview.group_product_by,
        value: dataProductReview.keyword,
      });
      await accountPageStaff.navigateToMenu("Product groups");
      const titleReviewPageStaff = reviewPageStaff.genLoc(await reviewPageStaff.getXpathTitleProductGroups(title));
      await expect(titleReviewPageStaff).toBeVisible();
    });

    await test.step(`- Tại acc owner > reload > go to Apps > select "Product Reviews" `, async () => {
      await reviewPageOwner.gotoProductgroups();
      const titleReviewPageOwner = reviewPageOwner.genLoc(await reviewPageStaff.getXpathTitleProductGroups(title));
      await expect(titleReviewPageOwner).toBeVisible();
    });
  });

  conf = loadData(__dirname, "PERMISSTION_BOOST_UPSELL_BOOST_CONVERT");
  for (let caseIndex = 0; caseIndex < conf.caseConf.data.length; caseIndex++) {
    const dataSetting = conf.caseConf.data[caseIndex];

    test(`@${dataSetting.case_id} ${dataSetting.case_name}`, async ({ browser, dashboard, authRequest }) => {
      pageStaff = await browser.newPage();
      const accountPageStaff = new DashboardPage(pageStaff, domain);
      const pagesStaff = new BoostConvertInsidePage(pageStaff, domain, authRequest);
      const pagesOwner = new BoostConvertInsidePage(dashboard, domain, authRequest);
      let displayTime;
      const stepName = conf.caseConf.step_name;

      await test.step(`- Tại acc staff > go to ${stepName} > select "Conversion Optimize" > select "Social Proof" > select "Settings"`, async () => {
        await accountPageStaff.login({
          email: email,
          password: password,
        });

        await accountPageStaff.waitUtilNotificationIconAppear();
        await pagesStaff.gotoSettingSocialProof();
      });

      await test.step(`- Edit setting "Social Proof" với data > click btn save`, async () => {
        displayTime = await pagesStaff.EditDisplayTimeSettingsSocialProof();
        const displayTimeStaff = await pagesStaff.getDataSettingSocialProof();
        expect(displayTime).toEqual(displayTimeStaff.settings.display.display_time);
      });

      await test.step(`- Tại acc owner > reload > go to ${stepName} > select "Conversion Optimize" > select "Social Proof" > select "Settings"`, async () => {
        const displayTimeOwner = await pagesOwner.getDataSettingSocialProof();
        expect(displayTime).toEqual(displayTimeOwner.settings.display.display_time);
      });
    });
  }

  conf = loadData(__dirname, "PERMISSTION_NAVIGATION");
  for (let caseIndex = 0; caseIndex < conf.caseConf.data.length; caseIndex++) {
    const dataSetting = conf.caseConf.data[caseIndex];
    test(`@${dataSetting.case_id} ${dataSetting.case_name}`, async ({ browser, conf, dashboard, authRequest }) => {
      pageStaff = await browser.newPage();
      const accountPageStaff = new OnlineStorePage(pageStaff, domain);
      const accountPageOwner = new OnlineStorePage(dashboard, domain);
      const pagesStaff = new DashboardAPI(domain, authRequest, pageStaff);
      const setFilters = conf.caseConf.set_filters;

      await test.step(`- Tại  acc staff > go to Navigation`, async () => {
        await accountPageStaff.login({
          email: email,
          password: password,
        });

        await accountPageStaff.waitUtilNotificationIconAppear();
        await accountPageStaff.navigateToSubMenu("Online Store", "Navigation");
      });

      await test.step(`- Tại acc staff >   Click "Add filter"> Add filter > Save`, async () => {
        await pagesStaff.setSearchFilter(setFilters);
        await accountPageStaff.page.reload();
        for (const product of setFilters.checked) {
          await expect(
            accountPageStaff.genLoc(accountPageStaff.getXpathFilterInNavigation(product.title)),
          ).toBeVisible();
        }
      });

      await test.step(`- Tại acc owner > reload >  go to Online Store > click "Navigation"`, async () => {
        await accountPageOwner.navigateToSubMenu("Online Store", "Navigation");
        for (const product of setFilters.checked) {
          await expect(
            accountPageOwner.genLoc(accountPageOwner.getXpathFilterInNavigation(product.title)),
          ).toBeVisible();
        }
      });
    });
  }

  conf = loadData(__dirname, "PERMISSTION_DOMAINS");
  for (let caseIndex = 0; caseIndex < conf.caseConf.data.length; caseIndex++) {
    const dataSetting = conf.caseConf.data[caseIndex];
    test(`@${dataSetting.case_id} ${dataSetting.case_name}`, async ({ browser, conf, dashboard }) => {
      pageStaff = await browser.newPage();
      const accountPageStaff = new DashboardPage(pageStaff, domain);
      const accountPageOwner = new DashboardPage(dashboard, domain);
      const pagesStaff = new OnlineStoreDomainPage(pageStaff, domain);
      const pagesOwner = new OnlineStoreDomainPage(dashboard, domain);
      const domainConnect = conf.caseConf.domain_connect;

      await test.step(`- Tại  acc staff > go to Domains`, async () => {
        await accountPageStaff.login({
          email: email,
          password: password,
        });

        await accountPageStaff.waitUtilNotificationIconAppear();
        await accountPageStaff.navigateToSubMenu("Online Store", "Domains");
      });

      await test.step(`- Tại acc staff > Click "Connect Existing Domain"> add Domain > Save`, async () => {
        await pagesStaff.page.click(pagesStaff.xpathRemoveDomain);
        await pagesStaff.clickOnBtnWithLabel("Remove");
        await pagesStaff.connectDomain(domainConnect);
        const shopDomainStaffAcc = await pagesStaff.genLoc(pagesStaff.xpathShopDomains(domainConnect));
        await expect(shopDomainStaffAcc).toBeVisible();
      });

      await test.step(`- Tại acc owner > reload >  go to Online Store > click "Domains"`, async () => {
        await accountPageOwner.navigateToSubMenu("Online Store", "Domains");
        const shopDomainOwner = await pagesOwner.genLoc(pagesOwner.xpathShopDomains(domainConnect));
        await expect(shopDomainOwner).toBeVisible();
      });
    });
  }

  test(`@SB_SET_ACC_PMS_Aug23_126 Verify Staff have permission "Preferences" Với theme V2`, async ({
    browser,
    dashboard,
    conf,
  }) => {
    pageStaff = await browser.newPage();
    const accountPageStaff = new DashboardPage(pageStaff, domain);
    const pagesStaff = new PreferencesPage(pageStaff, domain);
    const pagesOwner = new PreferencesPage(dashboard, domain);
    const reference = conf.caseConf.setting_reference;
    reference.title = generateRandomTitle();

    await test.step(`- Tại  acc staff > go to Preferences`, async () => {
      await accountPageStaff.login({
        email: email,
        password: password,
      });

      await accountPageStaff.waitUtilNotificationIconAppear();
      await pagesStaff.gotoPreferences();
    });

    await test.step(`- Tại acc staff > reload > go to Online Store > click "Preferences" > Edit "Preferences" > Save`, async () => {
      await pagesStaff.editInfoOnPreferencesPage(reference);
      expect(await pagesStaff.isToastMsgVisible("Saving success")).toEqual(true);
    });

    await test.step(`- Tại acc owner > reload >  go to Online Store > click "Preferences"`, async () => {
      await pagesOwner.gotoPreferences();
      const dataPreferences = await pagesOwner.getInfoOnPreferencesPage(reference);
      expect(reference.title).toEqual(dataPreferences.title);
    });
  });

  conf = loadData(__dirname, "PERMISSTION_DESIGN");
  for (let caseIndex = 0; caseIndex < conf.caseConf.data.length; caseIndex++) {
    const dataSetting = conf.caseConf.data[caseIndex];

    test(`@${dataSetting.case_id} ${dataSetting.case_name}`, async ({ browser, conf, dashboard }) => {
      pageStaff = await browser.newPage();
      const accountPageStaff = new DashboardPage(pageStaff, conf.suiteConf.domain);
      const accountPageOwner = new DashboardPage(dashboard, conf.suiteConf.domain);
      const designPageStaff = new ThemeEcom(pageStaff, conf.suiteConf.domain);
      const designPageOwner = new ThemeEcom(dashboard, conf.suiteConf.domain);
      const themePublic = conf.caseConf.theme_public;

      await test.step(` Tại  acc staff > go to Design`, async () => {
        await accountPageStaff.login({
          email: conf.suiteConf.staff.username,
          password: conf.suiteConf.staff.password,
        });

        await accountPageStaff.waitUtilNotificationIconAppear();
        await accountPageStaff.navigateToSubMenu("Online Store", "Design");
      });

      await test.step(`- Tại acc staff > reload > go to Online Store > click "Design" > click btn public theme`, async () => {
        await designPageStaff.publishTheme(themePublic);
        await designPageStaff.waitForElementVisibleThenInvisible(designPageStaff.xpathTextOfToast);
        const currentTemplateStaff = (await designPageStaff.genLoc(designPageStaff.currentTheme).textContent()).trim();
        expect(currentTemplateStaff).toEqual(themePublic);
      });

      await test.step(`- Tại acc owner > reload >  go to Online Store > click "Design"`, async () => {
        await accountPageOwner.navigateToSubMenu("Online Store", "Design");
        const currentTemplateOwner = (await designPageOwner.genLoc(designPageOwner.currentTheme).textContent()).trim();
        expect(currentTemplateOwner).toEqual(themePublic);
      });
    });
  }

  conf = loadData(__dirname, "PERMISSTION_BOOST_CONVERT");
  for (let caseIndex = 0; caseIndex < conf.caseConf.data.length; caseIndex++) {
    const dataSetting = conf.caseConf.data[caseIndex];
    test(`@${dataSetting.case_id} ${dataSetting.case_name}`, async ({ browser, dashboard, authRequest }) => {
      pageStaff = await browser.newPage();
      const accountPageStaff = new DashboardPage(pageStaff, domain);
      const pagesStaff = new BoostConvertInsidePage(pageStaff, domain, authRequest);
      const pagesOwner = new BoostConvertInsidePage(dashboard, domain, authRequest);
      let dataSetting;
      const stepName = conf.caseConf.step_name;

      await test.step(`- Tại acc staff > go to ${stepName} > select "Boost Convert" > select "Countdown Tools" > select "Realtime Visitors"`, async () => {
        await accountPageStaff.login({
          email: email,
          password: password,
        });

        await accountPageStaff.waitUtilNotificationIconAppear();
        await pagesStaff.gotoRealTimeVisitors();
      });

      await test.step(`- Edit setting "Realtime Visitors" với data > click btn save`, async () => {
        const random = Math.floor(Math.random() * 10000) + 1;
        dataSetting = await pagesStaff.editSettingRealTimeVisitors(random, random + 1);
        const dataSettingStaff = await pagesStaff.getDataSettingRealTimeVisitors();
        expect(dataSetting.randomForm).toEqual(dataSettingStaff.settings.number_random_from);
        expect(dataSetting.randomTo).toEqual(dataSettingStaff.settings.number_random_to);
      });

      await test.step(`- Tại acc owner > reload > go to ${stepName} > select "Boost Convert" > select "Countdown Tools" > select "Realtime Visitors"`, async () => {
        await pagesOwner.gotoRealTimeVisitors();
        const dataSettingOwner = await pagesOwner.getDataSettingRealTimeVisitors();
        expect(dataSetting.randomForm).toEqual(dataSettingOwner.settings.number_random_from);
        expect(dataSetting.randomTo).toEqual(dataSettingOwner.settings.number_random_to);
      });
    });
  }

  conf = loadData(__dirname, "PERMISSTION_BOOST_UPSELL");
  for (let caseIndex = 0; caseIndex < conf.caseConf.data.length; caseIndex++) {
    const dataSetting = conf.caseConf.data[caseIndex];
    test(`@${dataSetting.case_id} ${dataSetting.case_name}`, async ({ browser, conf, dashboard, authRequest }) => {
      pageStaff = await browser.newPage();
      const accountPageStaff = new DashboardPage(pageStaff, domain);
      const boostUpsellInsidePageStaff = new BoostUpsellInsidePage(pageStaff, domain);
      const appsApiStaff = new AppsAPI(domain, authRequest, pageStaff);
      const appsApiOwner = new AppsAPI(domain, authRequest, dashboard);
      const dataCreateOffer = conf.caseConf.data;
      const paramOffer = conf.caseConf.param_offer;
      const stepName = conf.caseConf.step_name;
      dataCreateOffer.offer_name = generateRandomTitle();

      await test.step(`- Tại acc staff > go to ${stepName} > select "Boost Upsell" > select "Upsell"`, async () => {
        await accountPageStaff.login({
          email: email,
          password: password,
        });

        await accountPageStaff.waitUtilNotificationIconAppear();
        await appsApiStaff.createNewUpsellOffer(dataCreateOffer);
        await boostUpsellInsidePageStaff.gotoListUpsellOffer();
      });

      await test.step(`- Click Create Offer > Tạo offer với data > Click "Submit offer"`, async () => {
        const dataOfferStaffAcc = await appsApiStaff.getListUpsellOffers({
          offer_types: paramOffer.offer_types,
          limit: paramOffer.limit,
        });
        expect(dataOfferStaffAcc[0].offer_name).toEqual(dataCreateOffer.offer_name);
      });

      await test.step(`- Tại acc owner > reload > go to ${stepName} > select "Boost Upsell" > select "Upsell"`, async () => {
        const dataOfferOwnerAcc = await appsApiOwner.getListUpsellOffers({
          offer_types: paramOffer.offer_types,
          limit: paramOffer.limit,
        });
        expect(dataOfferOwnerAcc[0].offer_name).toEqual(dataCreateOffer.offer_name);
      });
    });
  }
});
