import { expect } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { test } from "@fixtures/odoo";
import { Settings } from "@pages/dashboard/settings";
import { PolicyPage } from "@pages/storefront/policy_page";

let dashboardPage: DashboardPage;
let shopDomain: string;
let settingPage: Settings;
let numberOfPolicies: number;
let numberOfVariableTemp: number;
let numberOfOptionShowText: number;

test.describe("Add Legal setting into store PB/PLB", () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    shopDomain = conf.suiteConf.domain;
    test.setTimeout(conf.suiteConf.time_out);
    dashboardPage = new DashboardPage(dashboard, shopDomain);
    settingPage = new Settings(dashboard, conf.suiteConf.domain);
    numberOfPolicies = conf.suiteConf.number_of_policies;
    numberOfVariableTemp = conf.suiteConf.number_of_variable_templates;
    numberOfOptionShowText = conf.suiteConf.number_of_option_show_text;
  });

  test(`@SB_NEWECOM_SP_38 [PB/PLB] Verify Legal page hiển thị trong store merchant với theme v3`, async ({ conf }) => {
    await test.step(`Click menu Settings`, async () => {
      await dashboardPage.navigateToMenu("Settings");
      expect(await settingPage.isTextVisible("Legal")).toBe(true);
    });

    await test.step(`Click Legal block`, async () => {
      await settingPage.clickMenu("Legal");
      await settingPage.isTextVisible("View on site");

      let i = 0;
      do {
        expect(await settingPage.isTextVisible(conf.caseConf.data[i].page)).toBe(true);

        // Open add custom text pop-up
        await settingPage.clickOnTextLinkWithLabel(conf.caseConf.data[i].title);

        // Verify hiển thị Add custom text pop-up tương ứng với Title
        await expect(settingPage.getTitleAddCustomText(conf.caseConf.data[i].title)).toBeVisible();

        // Verify hiển thị template variables đúng và đủ
        let j = 0;
        do {
          expect(await settingPage.isTextVisible(conf.caseConf.data[i].template_variables[j].variable)).toBe(true);
          j++;
        } while (j < numberOfVariableTemp);

        // Verify hiển thị textarea
        expect(await settingPage.isTextBoxExist(conf.caseConf.data[i].textarea)).toBe(true);

        // Verify hiển thị Estimated characters
        expect(await settingPage.isTextVisible(conf.caseConf.data[i].limit_text)).toBe(true);

        // Verify hiển thị select option show text on legal page
        let k = 0;
        do {
          await expect(settingPage.getLocatorShowText(conf.caseConf.data[i].select[k].option)).toBeEnabled();

          k++;
        } while (k < numberOfOptionShowText);

        // Close add custom text pop-up
        await settingPage.clickOnBtnWithLabel("Cancel");
        i++;
      } while (i < numberOfPolicies);
    });
  });

  test(`@SB_NEWECOM_SP_39 [PB/PLB] Verify Return policy khi merchant add customer text trong store mechant`, async ({
    conf,
    context,
  }) => {
    let SFPage;
    let policyPage: PolicyPage;
    let variables = "";
    const urlReturnPolicy = `https://${conf.suiteConf.domain}${conf.caseConf.path}`;

    await test.step(`Click Settings >  Legal `, async () => {
      await dashboardPage.navigateToMenu("Settings");
      await settingPage.clickMenu("Legal");
      //Reset custom text of Return policy
      await settingPage.clickOnTextLinkWithLabel("Add custom text to Return policy");
      await settingPage.inputTextAreaWithLabel("Return policy", "");
      await settingPage.clickOnBtnWithLabel("Save");
      await settingPage.isTextVisible("View on site");
      expect(await settingPage.isTextVisible("Return policy")).toBe(true);
    });

    await test.step(`Click button View on site tại section Return policy`, async () => {
      [SFPage] = await Promise.all([
        context.waitForEvent("page"),
        await settingPage.clickOnBtnWithLabel("View on site", 5),
      ]);
      policyPage = new PolicyPage(SFPage, shopDomain);

      await policyPage.page.waitForLoadState("networkidle");
      expect(await policyPage.isTextVisible("Return Policy", 2)).toBe(true);
      expect(policyPage.page.url()).toContain(urlReturnPolicy);
      SFPage.close();
    });

    await test.step(`Tại section Return policy: click "Add custom text to Return policy" >  Input custom text > Choose position to show this text : at the end > Click button Cancel > click button View on site `, async () => {
      await settingPage.clickOnTextLinkWithLabel("Add custom text to Return policy");
      expect(await settingPage.page.getAttribute(settingPage.txtAddCustomText, "maxlength")).toEqual(
        conf.suiteConf.max_length,
      );
      await settingPage.inputTextAreaWithLabel("Return policy", conf.caseConf.data[0].content);
      await settingPage.page.locator("select").selectOption(conf.caseConf.data[0].id_option);
      await settingPage.clickOnBtnWithLabel("Cancel");
      [SFPage] = await Promise.all([
        context.waitForEvent("page"),
        await settingPage.clickOnBtnWithLabel("View on site", 5),
      ]);

      policyPage = new PolicyPage(SFPage, shopDomain);
      await policyPage.page.waitForLoadState("networkidle");
      expect(await policyPage.isTextVisible("Return Policy", 2)).toBe(true);
      expect(policyPage.page.url()).toContain(urlReturnPolicy);
      expect(await policyPage.isElementExisted(policyPage.xpathCustomtext(conf.caseConf.data[0].content))).toBe(false);
      SFPage.close();
    });

    await test.step(`Tại section Return policy: click "Add custom text to Return policy" >  Input custom text > Choose position to show this text : at the end > Click button Save > click button View on site `, async () => {
      await settingPage.clickOnTextLinkWithLabel("Add custom text to Return policy");
      await settingPage.inputTextAreaWithLabel("Return policy", conf.caseConf.data[0].content);
      await settingPage.page.locator("select").selectOption(conf.caseConf.data[0].id_option);
      await settingPage.clickOnBtnWithLabel("Save");
      [SFPage] = await Promise.all([
        context.waitForEvent("page"),
        await settingPage.clickOnBtnWithLabel("View on site", 5),
      ]);
      policyPage = new PolicyPage(SFPage, shopDomain);
      await policyPage.page.waitForLoadState("networkidle");
      expect(await policyPage.isTextVisible("Return Policy", 2)).toBe(true);
      expect(policyPage.page.url()).toContain(urlReturnPolicy);
      expect(await policyPage.isElementExisted(policyPage.xpathCustomtext(conf.caseConf.data[0].content))).toBe(true);
      SFPage.close();
    });

    await test.step(`Tại section Return policy: click "Add custom text to Return policy" >  Input custom text > Choose position to show this text : at the beginning  > Click button Save > click button View on site `, async () => {
      await settingPage.clickOnTextLinkWithLabel("Add custom text to Return policy");
      await settingPage.inputTextAreaWithLabel("Return policy", conf.caseConf.data[1].content);
      await settingPage.page.locator("select").selectOption(conf.caseConf.data[1].id_option);
      await settingPage.clickOnBtnWithLabel("Save");
      [SFPage] = await Promise.all([
        context.waitForEvent("page"),
        await settingPage.clickOnBtnWithLabel("View on site", 5),
      ]);

      policyPage = new PolicyPage(SFPage, shopDomain);
      await policyPage.page.waitForLoadState("networkidle");
      expect(await policyPage.isTextVisible("Return Policy", 2)).toBe(true);
      expect(policyPage.page.url()).toContain(urlReturnPolicy);
      expect(await policyPage.isElementExisted(policyPage.xpathCustomtext(conf.caseConf.data[1].content))).toBe(true);
      SFPage.close();
    });

    await test.step(`Tại section Return policy: click "Add custom text to Return policy" >  Add template variables > Choose position to show this text :at the end > Click button Save > click button View on site `, async () => {
      await settingPage.clickOnTextLinkWithLabel("Add custom text to Return policy");
      let i = 0;
      do {
        variables += conf.caseConf.data[2].template_variable[i].variable + ",";
        i++;
      } while (i < numberOfVariableTemp);
      await settingPage.inputTextAreaWithLabel("Return policy", variables);
      await settingPage.page.locator("select").selectOption(conf.caseConf.data[2].id_option);
      await settingPage.clickOnBtnWithLabel("Save");
      [SFPage] = await Promise.all([
        context.waitForEvent("page"),
        await settingPage.clickOnBtnWithLabel("View on site", 5),
      ]);
      policyPage = new PolicyPage(SFPage, shopDomain);
      await policyPage.page.waitForLoadState("networkidle");
      expect(await policyPage.isTextVisible("Return Policy", 2)).toBe(true);
      expect(policyPage.page.url()).toContain(urlReturnPolicy);
      expect(await policyPage.isElementExisted(policyPage.xpathCustomtext(conf.caseConf.content))).toBe(true);
      SFPage.close();
    });
  });
});
