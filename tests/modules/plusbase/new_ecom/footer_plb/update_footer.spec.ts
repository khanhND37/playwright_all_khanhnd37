import { expect, test } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Footer } from "@pages/storefront/footer";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { WbBlockFooter } from "@pages/dashboard/wb_footer";

let webBuilder: WebBuilder;
let blocks: Blocks;
let footer: WbBlockFooter;

test.describe("Update block footer PLB", () => {
  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    expect(testInfo).toBeTruthy();
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    footer = new WbBlockFooter(webBuilder.page);

    //Reset data to default value
    await webBuilder.openCustomizeTheme(dashboard, conf.suiteConf.domain);
    await webBuilder.page.waitForLoadState("networkidle");
    await webBuilder.page.click(webBuilder.getArrowBtnOfLayer({ sectionName: "Footer" }));
    await webBuilder.page.click(webBuilder.getSidebarSelectorByName({ sectionName: "Footer", subLayerName: "Footer" }));
    await webBuilder.switchToTab("Content");
    await webBuilder.switchToggle("show_phone", false);
    if ((await footer.getToggleValue("show_alternative_label")) === "true") {
      await webBuilder.inputTextBox("alternative_address_label", "");
    }
    await webBuilder.inputTextBox("default_address_label", "");
    await webBuilder.switchToggle("show_alternative_label", false);
    // save
    await dashboard.locator(blocks.xpathButtonSave).click();
    await dashboard.waitForSelector("text='All changes are saved'");
  });

  test(`@SB_NEWECOM_BF_86 [PLB] Verify footer SF sau khi merchant ẩn/hiện default phone number với theme v3`, async ({
    conf,
  }) => {
    await test.step(`Click menu Online Store > Design > Customize theme v3 > Click Footer trong section Footer > Click tab Content`, async () => {
      const isShowHeading = await footer.getToggleValue("show_heading_store_info");
      expect(isShowHeading).toEqual("true");
      const isShowPhoneNumber = await footer.getToggleValue("show_phone");
      expect(isShowPhoneNumber).toEqual("false");
      expect(await footer.isElementExisted(footer.xpathTextFooter(conf.caseConf.phone), webBuilder.frameLocator)).toBe(
        false,
      );
    });

    await test.step(`Toggle "Show phone number": off > Click Preview `, async () => {
      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState();
      await previewPage.bringToFront();
      await previewPage.goto(`${previewPage.url()}`, { waitUntil: "networkidle" });
      const footerSf = new Footer(previewPage);
      const headings = await footerSf.getAllHeadings();
      expect(headings.includes(conf.caseConf.default_heading)).toEqual(true);
      expect(await footerSf.isTextVisible(conf.caseConf.phone)).toBe(false);
      await previewPage.close();
    });

    await test.step(`Ở tab Content > on toggle Show phone number : on > Click Save > Click Preview`, async () => {
      await webBuilder.switchToggle("show_phone", true);
      await webBuilder.clickSaveButton();
      expect(await footer.isElementExisted(footer.xpathTextFooter(conf.caseConf.phone), webBuilder.frameLocator)).toBe(
        true,
      );

      //verify SF
      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState();
      await previewPage.bringToFront();
      await previewPage.goto(`${previewPage.url()}`, { waitUntil: "networkidle" });
      await previewPage.waitForLoadState("networkidle");
      const footerSf = new Footer(previewPage);
      expect(await footerSf.isTextVisible(conf.caseConf.phone)).toBe(true);
      await previewPage.close();
    });
  });

  test(`@SB_NEWECOM_BF_87 [PB/PLB] Verify footer SF sau khi merchant edit alternative address block ( theme v3)`, async ({
    conf,
  }) => {
    await test.step(`Click menu Online Store >  Design >  Customize theme v3 > Click Footer  trong section Footer >  Click tab Content > Click on Alternative address link`, async () => {
      const isShowHeading = await footer.getToggleValue("show_heading_store_info");
      expect(isShowHeading).toEqual("true");
      const isShowAlternativeAdd = await footer.getToggleValue("show_alternative_label");
      expect(isShowAlternativeAdd).toEqual("false");
      const [generalPage] = await Promise.all([
        footer.page.waitForEvent("popup"),
        await footer.clickOnTextLinkWithLabel("alternative address"),
      ]);
      await generalPage.waitForLoadState("networkidle");
      expect(generalPage.url()).toEqual(`https://${conf.suiteConf.domain}/admin/settings/general`);

      await generalPage.close();
    });

    await test.step(`Input into textbox Default address label`, async () => {
      expect(await footer.isElementExisted(footer.getSelectorByLabel("default_address_label"))).toBe(true);
      await webBuilder.inputTextBox("default_address_label", conf.caseConf.default_address_label);
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.page.waitForLoadState("load");
      expect(
        await footer.isElementExisted(
          footer.xpathTextFooter(conf.caseConf.default_address_label),
          webBuilder.frameLocator,
        ),
      ).toBe(true);

      expect(
        await footer.isElementExisted(footer.xpathTextFooter(conf.caseConf.default_address), webBuilder.frameLocator),
      ).toBe(true);

      //preview
      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState();
      await previewPage.bringToFront();
      await previewPage.goto(`${previewPage.url()}`, { waitUntil: "networkidle" });
      await previewPage.waitForLoadState("networkidle");
      const footerSf = new Footer(previewPage);
      expect(await footerSf.isTextVisible(conf.caseConf.default_address_label)).toBe(true);
      expect(await footerSf.isTextVisible(conf.caseConf.default_address)).toBe(true);

      await previewPage.close();
    });

    await test.step(`Toggle Show Alternative Address : off`, async () => {
      expect(await footer.isElementExisted(footer.getSelectorByLabel("alternative_address_label"))).toBe(false);
      expect(
        await footer.isElementExisted(
          footer.xpathTextFooter(conf.caseConf.alternative_address_label),
          webBuilder.frameLocator,
        ),
      ).toBe(false);
      expect(
        await footer.isElementExisted(
          footer.xpathTextFooter(conf.caseConf.alternative_address),
          webBuilder.frameLocator,
        ),
      ).toBe(false);

      //preview
      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState();
      await previewPage.bringToFront();
      await previewPage.goto(`${previewPage.url()}`, { waitUntil: "networkidle" });
      await previewPage.waitForLoadState("networkidle");
      const footerSf = new Footer(previewPage);
      expect(await footerSf.isTextVisible(conf.caseConf.alternative_address_label)).toBe(false);
      expect(await footerSf.isTextVisible(conf.caseConf.alternative_address)).toBe(false);
      await previewPage.close();
    });

    await test.step(`Toggle Show Alternative Address : on`, async () => {
      await webBuilder.switchToggle("show_alternative_label", true);
      expect(await footer.isElementExisted(footer.getSelectorByLabel("alternative_address_label"))).toBe(true);
    });

    await test.step(`Input into textbox Alternative address label`, async () => {
      await webBuilder.inputTextBox("alternative_address_label", conf.caseConf.alternative_address_label);
      await webBuilder.clickBtnNavigationBar("save");
      await webBuilder.page.waitForLoadState("load");
      expect(
        await footer.isElementExisted(
          footer.xpathTextFooter(conf.caseConf.alternative_address_label),
          webBuilder.frameLocator,
        ),
      ).toBe(true);

      expect(
        await footer.isElementExisted(
          footer.xpathTextFooter(conf.caseConf.alternative_address),
          webBuilder.frameLocator,
        ),
      ).toBe(true);
    });

    await test.step(`Lưu thay đổi >  View  SF`, async () => {
      //preview
      const [previewPage] = await Promise.all([
        webBuilder.page.waitForEvent("popup"),
        await webBuilder.clickBtnNavigationBar("preview"),
      ]);
      await previewPage.waitForLoadState();
      await previewPage.bringToFront();
      await previewPage.goto(`${previewPage.url()}`, { waitUntil: "networkidle" });
      await previewPage.waitForLoadState("networkidle");
      const footerSf = new Footer(previewPage);
      expect(await footerSf.isTextVisible(conf.caseConf.alternative_address_label)).toBe(true);
      expect(await footerSf.isTextVisible(conf.caseConf.alternative_address)).toBe(true);
      await previewPage.close();
    });
  });
});
