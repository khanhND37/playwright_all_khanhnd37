import { test, expect } from "@fixtures/website_builder";
import { BrowserContext, FrameLocator, Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { MailBox } from "@pages/thirdparty/mailbox";
import { MyProductPage } from "@pages/shopbase_creator/storefront/my_product";
import { MyAccountPage } from "@pages/shopbase_creator/storefront/my_accounts";

test.describe("Check module block digital download @SB_NEWECOM_DD", () => {
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

    // setting default data
    await webBuilder.openCustomizeTheme(dashboard, domain);
    await webBuilder.clickBtnNavigationBar("pages");
    await webBuilder.clickPageByName("Digital download");

    await webBuilder.removeExistBlock("rating", { section: 2, row: 1, column: 1, block: 3 });

    await webBuilder.clickSectionOnPage(await webBuilder.getSelectorByIndex({ section: 1 }));
    await webBuilder.setMarginPadding("padding", defaultSectionData.padding);

    const digitalSelector = webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 3 });
    await webBuilder.clickSectionOnPage(digitalSelector, {
      position: {
        x: 0,
        y: 0,
      },
    });
    await webBuilder.selectAlign("align_self", defaultData.align);
    await webBuilder.settingWidthHeight("width", defaultData.width);
    await webBuilder.setBackground("background", defaultData.background);
    await webBuilder.setBorder("border", defaultData.border);
    await dashboard.fill(webBuilder.xpathInputSlideBar("opacity"), defaultData.value_opacity);
    await webBuilder.editSliderBar("radius", defaultData.radius);
    await webBuilder.setMarginPadding("padding", defaultData.padding);
    await webBuilder.setMarginPadding("margin", defaultData.margin);
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

  test(`@SB_NEWECOM_DD_05 Verify resize width block Digital Download`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    // get selector digital download
    const digitalSelector = webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 3 });
    await test.step(`Vào Online stores > Design > Chọn Customize > Chọn button Page trên header > Chọn page Digital Download trong section Member pages > Click vào block Digital Download > Verify width block Digital Download`, async () => {
      // click session digital download
      await webBuilder.clickSectionOnPage(digitalSelector, {
        position: {
          x: 0,
          y: 0,
        },
      });
      await webBuilder.selectAlign("align_self", conf.caseConf.align);
      await webBuilder.settingWidthHeight("width", setMinWidth);
      expect(await blocks.getUnitOfField("width")).toEqual("Px");
      // click session digital download
      await webBuilder.clickSectionOnPage(digitalSelector, {
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
          snapshotName: conf.caseConf.min_width_snapshot_sf,
        },
        snapshotFixture,
      );
    });
    await test.step(`Verify Resize Block Digital Download`, async () => {
      await webBuilder.settingWidthHeight("width", defaultWidth);
      await webBuilder.clickSectionOnPage(digitalSelector, {
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
    await test.step(`Member đăng nhập vào tài khoản > Verify Digital Download page`, async () => {
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
      });
    });
  });

  test(`@SB_NEWECOM_DD_06 Verify page Digital Download trên SF sau khi setting trong dashboard`, async ({
    dashboard,
    context,
    snapshotFixture,
  }) => {
    const digitalSelector = webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 3 });
    await webBuilder.clickSectionOnPage(digitalSelector, {
      position: {
        x: 0,
        y: 0,
      },
    });

    for (let i = 0; i < settingsData.length; i++) {
      if (settingsData[i]) {
        await test.step(`Vào dashboard Online stores > Chọn Customize > Chọn button Page trên header > Chọn page Digital Download trong section Member pages > Setting block Digital Download > Verify block Digital Download  sau khi setting`, async () => {
          await webBuilder.selectAlign("align_self", settingsData[i].align);
          await webBuilder.settingWidthHeight("width", settingsData[i].width);
          await webBuilder.setBackground("background", settingsData[i].background);
          await webBuilder.setBorder("border", settingsData[i].border);
          await dashboard.fill(webBuilder.xpathInputSlideBar("opacity"), settingsData[i].value_opacity);
          await webBuilder.editSliderBar("radius", settingsData[i].value_radius);
          await webBuilder.setMarginPadding("padding", settingsData[i].padding);
          await webBuilder.setMarginPadding("margin", settingsData[i].margin);
        });
        await test.step(`Chọn Preview on new tab > Verify block Digital Download hiển thị ở màn preview`, async () => {
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
          });
        });
        await test.step(`Member sign in > My products > Verify page Digital Download hiển thị`, async () => {
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
          });
        });
      }
    }
  });

  test(`@SB_NEWECOM_DD_11 Verify setting page Digital Download`, async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const addSection = conf.caseConf.add_section;
    await test.step(`Vào Online stores > Design > Chọn Customize > Chọn button Page trên header > Chọn page Digital Download trong section Member pages > Insert block Count Down vào page, bên trên block Digital Download`, async () => {
      const digitalSelector = webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 2 });
      await webBuilder.clickSectionOnPage(digitalSelector, {
        position: {
          x: 0,
          y: 0,
        },
      });

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
    await test.step(`Thực hiện setting cho block Digital Download > Verify block Digital Download hiển thị trên trang preview và SF`, async () => {
      const newDigitalSelector = webBuilder.getSelectorByIndex({ section: 2, row: 1, column: 1, block: 4 });
      await webBuilder.clickSectionOnPage(newDigitalSelector, {
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
      await webBuilder.editSliderBar("radius", settingData.value_radius);
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
    await test.step(`Thực hiện setting block Header/ Footer > Verify block header/ footer hiển thị trên trang preview và SF && Verify SF page Digital Download trên desktop`, async () => {
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
});
