import { expect, test } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { SFHome } from "@pages/storefront/homepage";
import { Footer } from "@pages/storefront/footer";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { WbBlockFooter } from "@pages/dashboard/wb_footer";
import { TestInfo } from "@playwright/test";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ThemeDashboard } from "@pages/dashboard/theme";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";

let webBuilder: WebBuilder;
let blocks: Blocks;
let sfPage: SFHome;
let footer: WbBlockFooter;
let footerSf: Footer;
let snapshotOptions;
let numberOfSupportPage: number;
let numberOfPolicyPage: number;
let dashboardPage: DashboardPage;
let themePage: ThemeDashboard;
let shopDomain: string;

const scrName = (testInfo: TestInfo, fileName: string): string => {
  return `${process.env.ENV}-${testInfo.title.split(" ")[0].substring(1)}-${fileName}`;
};

test.describe("Block footer PB/PLB", () => {
  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    expect(testInfo).toBeTruthy();
    shopDomain = conf.suiteConf.domain;
    dashboardPage = new DashboardPage(dashboard, shopDomain);
    await dashboardPage.navigateToSubMenu("Online Store", "Design");
    themePage = new ThemeDashboard(dashboard, shopDomain);
    await themePage.clickOnBtnWithLabel("Customize");
    webBuilder = new WebBuilder(dashboard, shopDomain);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    footer = new WbBlockFooter(webBuilder.page);
    await webBuilder.page.locator(webBuilder.oldBlankPage).waitFor({ state: "hidden" });

    snapshotOptions = conf.suiteConf.snapshot_options;
    await webBuilder.page.click(webBuilder.getArrowBtnOfLayer({ sectionName: "Footer" }));
    await webBuilder.page.click(webBuilder.getSidebarSelectorByName({ sectionName: "Footer", subLayerName: "Footer" }));
  });

  test(`@SB_NEWECOM_BF_63 Verify hiển thị các page theo từng sub menu trong block Footer`, async ({ conf }) => {
    const footerLinks = conf.caseConf.footer_links;

    await test.step(`Verify hiển thị content trong Footer`, async () => {
      await webBuilder.switchToTab("Content");

      //Pre-condition: on toggle Show heading store info
      const isShowHeading = await footer.getToggleValue("show_heading_store_info");
      if (isShowHeading == "false") {
        await webBuilder.switchToggle("show_heading_store_info", true);
        await webBuilder.clickBtnNavigationBar("save");
        await webBuilder.page.waitForLoadState("load");
      }

      //Verify hiển thị 3 column Store information, Support, Policies ở footer
      expect(await footer.isElementExisted(footer.xpathTextFooter("Store information"), webBuilder.frameLocator)).toBe(
        true,
      );
      expect(await footer.isElementExisted(footer.xpathTextFooter("Support"), webBuilder.frameLocator)).toBe(true);
      expect(await footer.isElementExisted(footer.xpathTextFooter("Policies"), webBuilder.frameLocator)).toBe(true);
      for (const page of footerLinks) {
        expect(await footer.isElementExisted(footer.xpathTextFooter(page.title), webBuilder.frameLocator)).toBe(true);
      }
    });

    await test.step(`Click button "Preview on new tab" > verify Footer của shop`, async () => {
      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.bringToFront();

      sfPage = new SFHome(previewPage, conf.suiteConf.domain);

      //Verify hiển thị 3 column Store information, Support, Policies ở footer
      expect(await sfPage.isTextVisible("Store information")).toBe(true);
      expect(await sfPage.isTextVisible("Support")).toBe(true);
      expect(await sfPage.isTextVisible("Policies")).toBe(true);
      for (const page of footerLinks) {
        expect(await sfPage.isTextVisible(page.title)).toBe(true);
      }
    });

    await test.step(`Click vào từng page trong từng sub menu`, async () => {
      numberOfSupportPage = await sfPage.getNumberOfPage("Support");
      numberOfPolicyPage = await sfPage.getNumberOfPage("Policies");
      const pages = conf.caseConf.footer_links;
      let countValid = 0;
      for (let i = 0; i < numberOfSupportPage; i++) {
        await sfPage.openFooterPage(pages[i].title);
        await sfPage.page.waitForURL(new RegExp(".*/pages/.*"));

        const pageUrl = sfPage.page.url();
        const url = new URL(pageUrl);
        if (url.pathname === `/pages/${pages[i].handle}`) {
          countValid++;
        }
        await sfPage.page.goBack();
      }
      expect(countValid).toEqual(numberOfSupportPage);
      countValid = 0;
      for (let i = 0; i < numberOfPolicyPage; i++) {
        await sfPage.openFooterPage(pages[i + numberOfSupportPage].title);
        await sfPage.page.waitForURL(new RegExp(".*/policies/.*"));

        const pageUrl = sfPage.page.url();
        const url = new URL(pageUrl);
        if (url.pathname === `/policies/${pages[i + numberOfSupportPage].handle}`) {
          countValid++;
        }
        await sfPage.page.goBack();
      }
      expect(countValid).toEqual(numberOfPolicyPage);
      sfPage.page.close();
      await webBuilder.switchToggle("show_heading_store_info", false);
    });
  });

  test(`@SB_NEWECOM_BF_65 Verify Style Content color setting cho tất cả content của block Footer`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }, testInfo) => {
    await test.step(`Click Footer `, async () => {
      await webBuilder.switchToTab("Content");

      //Reset data
      //Xóa các social item được sinh ra khi chạy các test case trước đó
      const settingsLoc = webBuilder.page.locator(webBuilder.layerDetailLoc);
      while ((await settingsLoc.locator(WbBlockFooter.socialLinkItems).count()) > 4) {
        await settingsLoc
          .locator(WbBlockFooter.socialLinkItems)
          .last()
          .locator(WbBlockFooter.selectorActionSoical)
          .nth(2)
          .click();
        // click save
        await webBuilder.clickSaveButton();
      }

      //Reset data: off toggle show heading store infor
      const isShowHeading = await footer.getToggleValue("show_heading_store_info");
      if (isShowHeading == "true") {
        await webBuilder.switchToggle("show_heading_store_info", false);
        await webBuilder.clickBtnNavigationBar("save");
        await webBuilder.page.waitForLoadState("load");
      }

      //Reset copy right về default value
      const copyrightText = await footer.getCopyrightText();
      if (copyrightText != conf.suiteConf.default_data.copyright_text) {
        await webBuilder.inputTextBox("copyright_text", conf.suiteConf.default_data.copyright_text);
        await webBuilder.clickBtnNavigationBar("save");
        await webBuilder.page.waitForLoadState("load");
      }

      //Reset custom text về default value
      const customText = await footer.getSettingCustomText();
      if (customText != conf.suiteConf.default_data.custom_text) {
        await webBuilder.inputTextarea("custom_text", conf.suiteConf.default_data.custom_text);
        await webBuilder.clickBtnNavigationBar("save");
        await webBuilder.page.waitForLoadState("load");
      }

      await webBuilder.switchToTab("Design");
      await webBuilder.page.waitForLoadState("load");
      //Reset về default color
      await blocks.showPopoverColors("color");
      await webBuilder.color({
        preset: conf.suiteConf.default_data.color,
      });

      await webBuilder.clickSaveButton();
      await webBuilder.waitUntilElementInvisible(webBuilder.msgSaveSuccess);
      await webBuilder.page.waitForLoadState("domcontentloaded");
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        selector: webBuilder.layerDetailLoc,
        snapshotName: scrName(testInfo, conf.caseConf.screen_shot.default_color_wb_settings),
        combineOptions: snapshotOptions,
        sizeCheck: true,
      });
    });

    await test.step(`Verify Content color`, async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        iframe: webBuilder.iframe,
        selector: WbBlockFooter.selectorFooterWB,
        snapshotName: scrName(testInfo, conf.caseConf.screen_shot.default_color_wb_preview),
        combineOptions: snapshotOptions,
        sizeCheck: true,
      });
    });

    await test.step(`Thay đổi màu content > verify màu content trong Footer`, async () => {
      await blocks.showPopoverColors("color");
      await webBuilder.color({
        preset: conf.caseConf.color,
      });

      await webBuilder.clickSaveButton();
      await webBuilder.page.waitForLoadState("domcontentloaded");
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        iframe: webBuilder.iframe,
        selector: WbBlockFooter.selectorFooterWB,
        snapshotName: scrName(testInfo, conf.caseConf.screen_shot.color_changed_wb_preview),
        combineOptions: snapshotOptions,
        sizeCheck: true,
      });
    });

    await test.step(`Mở Store Front > verify Footer của shop`, async () => {
      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState();
      await previewPage.bringToFront();
      await previewPage.waitForLoadState("domcontentloaded");
      sfPage = new SFHome(previewPage, conf.suiteConf.domain);
      await sfPage.page.locator(sfPage.xpathLoadSpinner).waitFor({ state: "detached" });
      await sfPage.page.evaluate(() => {
        window.scrollBy(0, document.body.scrollHeight);
      });
      await sfPage.page.waitForLoadState("domcontentloaded");
      await sfPage.page.locator(Footer.selectorFooter).scrollIntoViewIfNeeded();
      await sfPage.waitUntilElementVisible(Footer.selectorFooter);
      await snapshotFixture.verifyWithAutoRetry({
        page: previewPage,
        selector: Footer.selectorFooter,
        snapshotName: scrName(testInfo, conf.caseConf.screen_shot.color_changed_sf_preview),
        combineOptions: snapshotOptions,
        sizeCheck: true,
      });
      await previewPage.close();

      //Reset về màu cũ
      await blocks.showPopoverColors("color");
      await webBuilder.color({
        preset: conf.suiteConf.default_data.color,
      });

      // click save
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.page.waitForLoadState("load");
    });
  });

  test(`@SB_NEWECOM_BF_70 Verify hiển thị text ở menu Store information sau khi setting field Custom text`, async ({
    conf,
  }) => {
    let customText: string;
    let newCustomText: string;
    await test.step(`Mở Store Front > verify text ở menu Store information`, async () => {
      await webBuilder.switchToTab("Content");
      //get custom text ở WB
      customText = await footer.getSettingCustomText();
      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState();
      await previewPage.bringToFront();
      const footerSf = new Footer(previewPage);
      expect(await footerSf.isTextVisible(customText)).toBe(true);
      await previewPage.close();
    });

    await test.step(`Click vào field Custom text > Add text -> Save`, async () => {
      newCustomText =
        customText === conf.suiteConf.default_data.custom_text
          ? conf.caseConf.custom_text
          : conf.suiteConf.default_data.custom_text;

      await webBuilder.inputTextarea("custom_text", newCustomText);
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.page.waitForLoadState("load");
      expect(await footer.isElementExisted(footer.xpathTextFooter(newCustomText), webBuilder.frameLocator)).toBe(true);
    });

    await test.step(`Mở Store Front > verify text ở menu Store information`, async () => {
      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState();
      await previewPage.bringToFront();
      const footerSf = new Footer(previewPage);
      expect(await footerSf.isTextVisible(newCustomText)).toBe(true);
      await previewPage.close();
    });
  });

  test(`@SB_NEWECOM_BF_73 Verify social bar sau khi add thêm field social`, async ({
    conf,
    snapshotFixture,
  }, testInfo) => {
    //Reset về default color
    await webBuilder.switchToTab("Design");
    await webBuilder.page.waitForLoadState("load");
    await blocks.showPopoverColors("color");
    await webBuilder.color({
      preset: conf.suiteConf.default_data.color,
    });

    await webBuilder.clickSaveButton();
    await webBuilder.switchToTab("Content");

    //Reset data
    //Xóa các social item được sinh ra khi chạy các test case trước đó
    const settingsLoc = webBuilder.page.locator(webBuilder.layerDetailLoc);
    while ((await settingsLoc.locator(WbBlockFooter.socialLinkItems).count()) > 4) {
      await settingsLoc
        .locator(WbBlockFooter.socialLinkItems)
        .last()
        .locator(WbBlockFooter.selectorActionSoical)
        .nth(2)
        .click();

      // click save
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.page.waitForLoadState("load");
    }

    await test.step(`ở sections: Footer > ở menu Store information > verify hiển thị icon social bar`, async () => {
      //Reset data: off toggle show heading store infor
      const isShowHeading = await footer.getToggleValue("show_heading_store_info");
      if (isShowHeading == "true") {
        await webBuilder.switchToggle("show_heading_store_info", false);
        await webBuilder.clickBtnNavigationBar("save");
        await webBuilder.page.waitForLoadState("load");
      }

      // Reset copy right về default value
      const copyrightText = await footer.getCopyrightText();
      if (copyrightText != conf.suiteConf.default_data.copyright_text) {
        await webBuilder.inputTextBox("copyright_text", conf.suiteConf.default_data.copyright_text);
        await webBuilder.clickBtnNavigationBar("save");
        await webBuilder.page.waitForLoadState("load");
      }

      //Reset custom text về default value
      const customText = await footer.getSettingCustomText();
      if (customText != conf.suiteConf.default_data.custom_text) {
        await webBuilder.inputTextarea("custom_text", conf.suiteConf.default_data.custom_text);
        await webBuilder.clickBtnNavigationBar("save");
        await webBuilder.page.waitForLoadState("load");
      }
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        selector: webBuilder.layerDetailLoc,
        snapshotName: scrName(testInfo, conf.caseConf.screen_shot.default_social_settings),
        combineOptions: snapshotOptions,
        sizeCheck: true,
      });
    });

    await test.step(`Click Add social `, async () => {
      await settingsLoc.locator("button", { hasText: "Add social" }).click();
      await expect(footer.getInputSocialLocator()).toHaveAttribute("placeholder", "https://");
    });

    await test.step(`ở Social Link nhập link`, async () => {
      await footer.inputAddSocialLink(conf.caseConf.social_links.link_1);
      await settingsLoc.locator("button", { hasText: "Add social" }).click();
      await footer.page.waitForLoadState("domcontentloaded");
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        selector: webBuilder.layerDetailLoc,
        snapshotName: scrName(testInfo, conf.caseConf.screen_shot.social_link_added),
        combineOptions: snapshotOptions,
        sizeCheck: true,
      });
    });

    await test.step(`Click Edit > click save `, async () => {
      await footer.clickEditSocialLink({ last: true });
      await footer.inputAddSocialLink(conf.caseConf.social_links.link_2);
      await footer.applyEditSocialLink();
      await footer.page.waitForLoadState("networkidle");
      await footer.page.evaluate(() => {
        window.scrollBy(0, document.body.scrollHeight);
      });
      await snapshotFixture.verifyWithAutoRetry({
        page: webBuilder.page,
        iframe: webBuilder.iframe,
        selector: WbBlockFooter.selectorFooterWB,
        snapshotName: scrName(testInfo, conf.caseConf.screen_shot.social_link_changed_wb_preview),
        combineOptions: snapshotOptions,
        sizeCheck: true,
      });
      await webBuilder.clickSaveButton();
      await webBuilder.waitUntilElementInvisible(webBuilder.msgSaveSuccess);
      await webBuilder.page.waitForLoadState("domcontentloaded");
    });

    await test.step(` Click button "Preview on new tab" > verify hiển thị icon social bar ở Footer`, async () => {
      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);

      await previewPage.waitForLoadState();
      await previewPage.bringToFront();
      await previewPage.waitForLoadState("domcontentloaded");
      sfPage = new SFHome(previewPage, conf.suiteConf.domain);
      await sfPage.page.locator(sfPage.xpathLoadSpinner).waitFor({ state: "detached" });

      await sfPage.page.evaluate(() => {
        window.scrollBy(0, document.body.scrollHeight);
      });

      await sfPage.page.waitForLoadState("domcontentloaded");
      await sfPage.page.locator(Footer.selectorFooter).scrollIntoViewIfNeeded();
      await sfPage.waitUntilElementVisible(Footer.selectorFooter);
      await snapshotFixture.verifyWithAutoRetry({
        page: previewPage,
        selector: Footer.selectorFooter,
        snapshotName: scrName(testInfo, conf.caseConf.screen_shot.social_link_changed_sf_preview),
        combineOptions: snapshotOptions,
        sizeCheck: true,
      });
    });

    await test.step(`Click vào icon`, async () => {
      const [socialPage] = await Promise.all([
        sfPage.page.waitForEvent("popup"),
        await sfPage.page.locator(Footer.selectorFooter).locator(Footer.socialItem).last().click(),
      ]);

      expect(socialPage.url().startsWith(conf.caseConf.social_links.link_2)).toBe(true);
      await socialPage.close();
    });
  });

  test(`@SB_NEWECOM_BF_80 Verify hiển thị Copyright text khi setting field Copyright text`, async ({ conf }) => {
    let copyrightText: string;
    let newCopyrightText: string;
    await test.step(`Mở SF > Verify text ở block Copy right text`, async () => {
      //Get copyright text ở WB
      await webBuilder.switchToTab("Content");
      copyrightText = await footer.getCopyrightText();
      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState();
      await previewPage.bringToFront();

      const footerSf = new Footer(previewPage);
      expect(await footerSf.isTextVisible(copyrightText)).toBe(true);
      await previewPage.close();
    });

    await test.step(`Click vào tab Content > Nhập vào field Copyright text`, async () => {
      if (copyrightText === conf.suiteConf.default_data.copyright_text) {
        newCopyrightText = conf.caseConf.copyright_text;
      } else {
        newCopyrightText = conf.suiteConf.default_data.copyright_text;
      }
      await webBuilder.inputTextBox("copyright_text", newCopyrightText);
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.page.waitForLoadState("load");
      expect(await footer.isElementExisted(footer.xpathTextFooter(newCopyrightText), webBuilder.frameLocator)).toBe(
        true,
      );
    });

    await test.step(`Click Preview`, async () => {
      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);

      await previewPage.waitForLoadState();
      await previewPage.bringToFront();

      const footerSf = new Footer(previewPage);
      expect(await footerSf.isTextVisible(newCopyrightText)).toBe(true);
      await previewPage.close();
    });
  });

  test(`@SB_NEWECOM_BF_81 Verify ẩn hiện heading Store information bằng toggle Show store information heading`, async ({
    conf,
  }) => {
    await test.step(`Click vào tab Content >toggle Show store information heading: off`, async () => {
      await webBuilder.switchToTab("Content");
      const isShowHeading = await footer.getToggleValue("show_heading_store_info");
      if (isShowHeading == "true") {
        await webBuilder.switchToggle("show_heading_store_info", false);
        await webBuilder.clickBtnNavigationBar("save");
        await webBuilder.page.waitForLoadState("load");
      }
    });

    await test.step(`Click Preview`, async () => {
      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);

      await previewPage.waitForLoadState();
      await previewPage.bringToFront();
      const footerSf = new Footer(previewPage);
      const headings = await footerSf.getAllHeadings();
      expect(headings.includes(conf.caseConf.default_heading)).toEqual(
        conf.suiteConf.default_data.show_heading_store_info,
      );

      await previewPage.close();
    });

    await test.step(`Ở tab Content > bật toggle Show store information heading`, async () => {
      await webBuilder.switchToggle("show_heading_store_info", true);
      // need to wait due to webbuilder debounce update
      await blocks.waitAbit(200);
      const footerPreview = webBuilder.frameLocator.locator(WbBlockFooter.selectorFooterWB);
      const footerSf = new Footer(webBuilder.page);
      const headings = await footerSf.getAllHeadings(footerPreview);
      expect(headings.includes(conf.caseConf.default_heading)).toEqual(true);
    });

    await test.step(`Click Save > Click Preview`, async () => {
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.page.waitForLoadState("load");

      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState();
      await previewPage.bringToFront();
      const footerSf = new Footer(previewPage);
      const headings = await footerSf.getAllHeadings();
      expect(headings.includes(conf.caseConf.default_heading)).toEqual(true);
      await previewPage.close();

      //Reset data
      await webBuilder.switchToggle("show_heading_store_info", false);
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.page.waitForLoadState("load");
    });
  });

  test(`@SB_NEWECOM_BF_82 Verify block DCMA report, Global switcher, Payment method accept`, async ({
    conf,
    context,
    snapshotFixture,
  }, testInfo) => {
    const newPage = await context.newPage();
    sfPage = new SFHome(newPage, conf.suiteConf.domain);
    footerSf = new Footer(newPage);
    await test.step(`Mở SF > ở block footer: verify block Global switcher. Payment method accept`, async () => {
      await sfPage.gotoHomePage();
      await sfPage.page.waitForLoadState("domcontentloaded");
      await sfPage.page.evaluate(() => {
        window.scrollBy(0, document.body.scrollHeight);
      });
      await sfPage.page.locator(Footer.paymentIcons).scrollIntoViewIfNeeded();
      await sfPage.waitUntilElementVisible(Footer.paymentIcons);
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: Footer.paymentIcons,
        snapshotName: scrName(testInfo, conf.caseConf.screen_shot.block_payment_icons),
        combineOptions: snapshotOptions,
        sizeCheck: true,
      });
    });

    await test.step(`Ở block footer: Click vào global switcher`, async () => {
      await sfPage.page.locator(sfPage.xpathBlockGlobalSwitcher).click();
      await sfPage.page.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithAutoRetry({
        page: sfPage.page,
        selector: Footer.selectorGlobalSwitcher,
        snapshotName: scrName(testInfo, conf.caseConf.screen_shot.switcher_action),
        combineOptions: snapshotOptions,
        sizeCheck: true,
      });
      await sfPage.clickOnBtnWithLabel("Cancel");
      await sfPage.page.waitForSelector(sfPage.selectorTitlePopupChooseLangugeCurrency, { state: "hidden" });
    });

    await test.step(`Choose Country/Currency, Language > Click Done`, async () => {
      await sfPage.chooseCountryAndLanguageOnSF(conf.caseConf.selected_language);
      await sfPage.page.waitForLoadState("load");
      await scrollUntilElementIsVisible({
        page: sfPage.page,
        scrollEle: sfPage.page.locator(Footer.selectorFooter),
        viewEle: sfPage.page.locator(Footer.selectorFooter),
      });

      await expect(async () => {
        expect(await sfPage.isTextVisible("| Español (ES) | USD")).toBe(true);
      }).toPass();
      const blockSupport = conf.caseConf.block_support;
      for (const support of blockSupport) {
        expect(await footerSf.isTextVisible(support)).toBe(true);
      }
      const blockPolicy = conf.caseConf.block_policies;
      for (const policy of blockPolicy) {
        expect(await footerSf.isTextVisible(policy)).toBe(true);
      }
    });
  });
});
