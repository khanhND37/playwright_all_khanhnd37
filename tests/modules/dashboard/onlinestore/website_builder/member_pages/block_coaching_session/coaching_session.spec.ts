import { test } from "@fixtures/website_builder";
import { expect } from "@core/fixtures";
import { BrowserContext, FrameLocator, Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { MailBox } from "@pages/thirdparty/mailbox";
import { MyProductPage } from "@pages/shopbase_creator/storefront/my_product";
import { MyAccountPage } from "@pages/shopbase_creator/storefront/my_accounts";
import { DigitalProductPage } from "@pages/dashboard/digital_product";

test.describe("Check module block coaching session @SB_NEWECOM_CS", () => {
  let domain: string;
  let webBuilder: WebBuilder;
  let settingsData;
  let messageSave: string;
  let blocks: Blocks;
  let customerEmail: string;
  let customer: string;
  let setMinWidth;
  let defaultWidth;
  let ctx: BrowserContext;
  let newPage: Page;
  let mailBoxPage: MailBox;
  let myAccountPage: MyAccountPage;
  let frameLocator: FrameLocator;
  let blockSelector: string;
  let section: number;
  let block: number;
  let settingData;
  let defaultData;
  let defaultSectionData;
  let settingSectionData;
  let myProductpage: MyProductPage;
  let dproductPage: DigitalProductPage;

  test.beforeEach(async ({ context, browser, conf, dashboard, page, snapshotFixture }) => {
    domain = conf.suiteConf.domain;
    webBuilder = new WebBuilder(dashboard, domain);
    settingsData = conf.caseConf.data_settings;
    settingData = conf.caseConf.data_setting;
    messageSave = conf.caseConf.message_save;
    blocks = new Blocks(dashboard, domain);
    customerEmail = conf.caseConf.customer_email;
    customer = conf.caseConf.customer;
    setMinWidth = conf.caseConf.set_min_width;
    defaultWidth = conf.caseConf.set_default_width;
    ctx = await browser.newContext();
    newPage = await ctx.newPage();
    mailBoxPage = new MailBox(page, domain);
    myAccountPage = new MyAccountPage(page, domain);
    frameLocator = blocks.frameLocator;
    defaultData = conf.suiteConf.data_default;
    settingSectionData = conf.caseConf.data_setting_section;
    defaultSectionData = conf.suiteConf.data_default_section;
    dproductPage = new DigitalProductPage(dashboard, conf.suiteConf.domain);

    // setting default data
    await webBuilder.openCustomizeTheme(dashboard, domain);
    await webBuilder.clickBtnNavigationBar("pages");
    await webBuilder.clickPageByName("Coaching session");

    await webBuilder.removeExistBlock("rating", { section: 2, row: 1, column: 1, block: 1 });

    await webBuilder.clickSectionOnPage(await webBuilder.getSelectorByIndex({ section: 1 }));
    await webBuilder.setMarginPadding("padding", defaultSectionData.padding);

    await webBuilder.clickSectionOnPage(
      await webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 3 }),
      {
        position: {
          x: 0,
          y: 0,
        },
      },
    );
    await webBuilder.settingWidthHeight("width", defaultData.width);
    await webBuilder.selectAlign("align_self", defaultData.align);
    await webBuilder.setBackground("background", defaultData.background);
    await webBuilder.setBorder("border", defaultData.border);
    await dashboard.fill(webBuilder.xpathInputSlideBar("opacity"), defaultData.value_opacity);
    await webBuilder.setMarginPadding("padding", defaultData.padding);
    await webBuilder.setMarginPadding("margin", defaultData.margin);

    await webBuilder.clickSectionOnPage(
      await webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 3 }),
    );

    await blocks.clickSaveAndVerifyPreview(
      {
        context,
        dashboard,
        savedMsg: messageSave,
        snapshotName: "",
        onlyClickSave: true,
      },
      snapshotFixture,
    );
  });

  test(`@SB_NEWECOM_CS_05 Verify resize width block Coaching session`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const sectionSelector = webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 3 });
    await test.step(`Vào Online stores > Theme > Chọn Customize > Chọn button Page trên header > Chọn page Coaching session trong section Member pages > Click vào block Coaching session > Verify width block Coaching session`, async () => {
      // click session coaching session
      await webBuilder.clickSectionOnPage(sectionSelector);
      await webBuilder.settingWidthHeight("width", setMinWidth);
      await webBuilder.clickSectionOnPage(sectionSelector);

      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: messageSave,
          snapshotName: conf.caseConf.min_width_snapshot_sf,
        },
        snapshotFixture,
      );
    });

    await test.step(`Verify Resize Block Coaching session`, async () => {
      await webBuilder.clickSectionOnPage(sectionSelector, {
        position: {
          x: 0,
          y: 0,
        },
      });
      await webBuilder.settingWidthHeight("width", defaultWidth);
      await webBuilder.clickSectionOnPage(sectionSelector, {
        position: {
          x: 0,
          y: 0,
        },
      });
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: messageSave,
          snapshotName: conf.caseConf.snapshot_sf,
        },
        snapshotFixture,
      );
    });

    await test.step(`Member đăng nhập vào tài khoản > Verify Coaching session page`, async () => {
      await myAccountPage.gotoSignInPage();
      await myAccountPage.sendCode(customerEmail);
      await mailBoxPage.openMailBox(customerEmail);
      newPage = await mailBoxPage.openVerifyEmailThenSignIn(customer);
      const myProductpage = new MyProductPage(newPage, domain);
      await myProductpage.goToMyProductPage();
      await myProductpage.goToFirstProductDetail();
      await snapshotFixture.verify({
        page: newPage,
        selector: webBuilder.selectMainSF,
        snapshotName: conf.caseConf.main_snapshot_sf,
        snapshotOptions: {
          maxDiffPixelRatio: 0.015,
        },
      });
    });
  });

  test(`@SB_NEWECOM_CS_06 Verify page Coaching session trên SF sau khi setting trong dashboard`, async ({
    dashboard,
    context,
    snapshotFixture,
  }) => {
    const coachingSelector = webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 3 });
    await webBuilder.clickSectionOnPage(coachingSelector, {
      position: {
        x: 0,
        y: 0,
      },
    });

    for (let i = 0; i < settingsData.length; i++) {
      if (settingsData[i]) {
        await test.step(`Vào dashboard Online stores > Chọn Customize > Chọn button Page trên header > Chọn page Coaching session trong section Member pages > Setting block Coaching session > Verify block Coaching session  sau khi setting`, async () => {
          await webBuilder.selectAlign("align_self", settingsData[i].align);
          await webBuilder.settingWidthHeight("width", settingsData[i].width);
          await webBuilder.setBackground("background", settingsData[i].background);
          await webBuilder.setBorder("border", settingsData[i].border);
          await dashboard.fill(webBuilder.xpathInputSlideBar("opacity"), settingsData[i].value_opacity);
          await webBuilder.setMarginPadding("padding", settingsData[i].padding);
          await webBuilder.setMarginPadding("margin", settingsData[i].margin);
        });

        await test.step(`Chọn Preview on new tab > Verify block Coaching session hiển thị ở màn preview`, async () => {
          const newTab = await blocks.clickSaveAndVerifyPreview(
            {
              context,
              dashboard,
              savedMsg: messageSave,
              snapshotName: "",
              isNextStep: true,
            },
            snapshotFixture,
          );

          await dashboard.waitForLoadState("networkidle");
          await snapshotFixture.verify({
            page: newTab,
            selector: webBuilder.selectMainSF,
            snapshotName: settingsData[i].snapshot_sf,
            snapshotOptions: {
              maxDiffPixelRatio: 0.015,
            },
          });
        });

        await test.step(`Member sign in > My products > Vào product "Coaching session 1" >  Verify page Coaching session hiển thị`, async () => {
          if (i < 1) {
            await myAccountPage.gotoSignInPage();
            await myAccountPage.sendCode(customerEmail);
            await mailBoxPage.openMailBox(customerEmail);
            newPage = await mailBoxPage.openVerifyEmailThenSignIn(customer);
          }
          const myProductpage = new MyProductPage(newPage, domain);
          await myProductpage.goToMyProductPage();
          await myProductpage.goToFirstProductDetail();
          await snapshotFixture.verify({
            page: newPage,
            selector: webBuilder.selectMainSF,
            snapshotName: settingsData[i].main_snapshot_sf,
            snapshotOptions: {
              maxDiffPixelRatio: 0.015,
            },
          });
        });
      }
    }
  });

  test(`@SB_NEWECOM_CS_12 Verify setting page Coaching session`, async ({
    dashboard,
    context,
    conf,
    snapshotFixture,
  }) => {
    const addSection = conf.caseConf.add_section;

    await test.step(`Vào Online stores > Theme > Chọn Customize > Chọn button Page trên header > Chọn page Coaching session trong section Member pages > Insert block Count Down vào page, bên trên block Coaching session`, async () => {
      const coachingSelector = webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 2 });
      await webBuilder.clickSectionOnPage(coachingSelector);

      section = block = 1;
      blockSelector = webBuilder.getSelectorByIndex({ section, block });

      await blocks.clickBackLayer();
      await webBuilder.dragAndDropInWebBuilder(addSection.block);
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });

      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: messageSave,
          snapshotName: conf.caseConf.step_1_snapshot_sf,
        },
        snapshotFixture,
      );
    });

    await test.step(`Thực hiện setting cho block Count down > Verify block count down hiển thị trên trang preview và SF`, async () => {
      const countdownSelector = webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 1 });
      await webBuilder.clickSectionOnPage(countdownSelector);
      await webBuilder.selectAlign("align_self", settingData.align);
      await webBuilder.setBackground("background", settingData.background);
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: messageSave,
          snapshotName: conf.caseConf.step_2_snapshot_sf,
        },
        snapshotFixture,
      );
    });

    await test.step(`Thực hiện setting cho block Coaching session > Verify block Coaching session hiển thị trên trang preview và SF`, async () => {
      const newCoachingSelector = webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 4 });
      await webBuilder.clickSectionOnPage(newCoachingSelector, {
        position: {
          x: 0,
          y: 0,
        },
      });

      await webBuilder.selectAlign("align_self", settingData.align);
      await webBuilder.settingWidthHeight("width", settingData.width);
      await webBuilder.setBackground("background", settingData.background);
      await webBuilder.setBorder("border", settingData.border);
      await dashboard.fill(webBuilder.xpathInputSlideBar("opacity"), settingData.value_opacity);
      await webBuilder.setMarginPadding("padding", settingData.padding);
      await webBuilder.setMarginPadding("margin", settingData.margin);
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: messageSave,
          snapshotName: conf.caseConf.step_3_snapshot_sf,
        },
        snapshotFixture,
      );
    });

    await test.step(`Thực hiện setting block Header/ Footer > Verify block header/ footer hiển thị trên trang preview và SF && Verify SF page Coaching session trên desktop`, async () => {
      await webBuilder.clickSectionOnPage(await webBuilder.getSelectorByIndex({ section: 1 }));
      await webBuilder.setMarginPadding("padding", settingSectionData.padding);
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: messageSave,
          snapshotName: conf.caseConf.step_4_snapshot_sf,
        },
        snapshotFixture,
      );
    });
  });

  test(`@SB_NEWECOM_CS_08 Verify setting schedule, logic work schedule hiển thị trên SF`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Vào Product detail trên dasboard > Setting scheduling > Save`, async () => {
      await dproductPage.gotogoToDigitalProduct(conf.caseConf.product_id);
      await dashboard
        .locator('[placeholder="https://calendly.com/yourname/coach"]')
        .fill(`${conf.caseConf.schedule_link}`);
      await dproductPage.clickOnBtnWithLabel("Save");
      expect(await dproductPage.isTextVisible(conf.caseConf.save_product_message, 1)).toEqual(true);
    });

    await test.step(`Member login vào acc > vào product detail > Verify block schedule hiển thị`, async () => {
      await myAccountPage.gotoSignInPage();
      await myAccountPage.sendCode(customerEmail);
      await mailBoxPage.openMailBox(customerEmail);
      newPage = await mailBoxPage.openVerifyEmailThenSignIn(customer);
      myProductpage = new MyProductPage(newPage, domain);
      await myProductpage.goToMyProductPage();
      await myProductpage.goToFirstProductDetail();
      await snapshotFixture.verify({
        page: newPage,
        selector: webBuilder.selectMainSF,
        snapshotName: conf.caseConf.step_1_snapshot_sf,
        snapshotOptions: {
          maxDiffPixelRatio: 0.015,
        },
      });
    });

    await test.step(`Vào Product detail trên dasboard lần 2 > Setting scheduling > Save`, async () => {
      await dashboard
        .locator('[placeholder="https://calendly.com/yourname/coach"]')
        .fill(`${conf.caseConf.schedule_link_2}`);
      await dproductPage.clickOnBtnWithLabel("Save");
      expect(await dproductPage.isTextVisible(conf.caseConf.save_product_message, 1)).toEqual(true);
    });

    await test.step(`Member login vào acc > vào product detail > Verify block schedule hiển thị`, async () => {
      await myProductpage.goToMyProductPage();
      await myProductpage.goToFirstProductDetail();
      await snapshotFixture.verify({
        page: newPage,
        selector: webBuilder.selectMainSF,
        snapshotName: conf.caseConf.step_2_snapshot_sf,
        snapshotOptions: {
          maxDiffPixelRatio: 0.015,
        },
      });

      // reset schedule
      await dashboard
        .locator('[placeholder="https://calendly.com/yourname/coach"]')
        .fill(`${conf.caseConf.empty_schedule_link}`);
      await dproductPage.clickOnBtnWithLabel("Save");
      expect(await dproductPage.isTextVisible(conf.caseConf.save_product_message, 1)).toEqual(true);
    });
  });
});
