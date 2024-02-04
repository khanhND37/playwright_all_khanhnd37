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

test.describe("Add custom text to legal pages into store PB", () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    shopDomain = conf.suiteConf.domain;
    dashboardPage = new DashboardPage(dashboard, shopDomain);
    settingPage = new Settings(dashboard, conf.suiteConf.domain);
    numberOfPolicies = conf.suiteConf.number_of_policies;
    numberOfVariableTemp = conf.suiteConf.number_of_variable_templates;
  });

  test(`@SB_NEWECOM_SP_35 [PB] Verify Add custom text khi Customize các pages legal`, async ({ conf, context }) => {
    let SFPage;
    let policyPage: PolicyPage;

    await test.step(`Vào dashboard shop PB > Online Store > Pages > chọn page legal > Click link 'Add custom text' > Input custom text > Choose position to show this text> Click button Save > click button View on site `, async () => {
      await dashboardPage.navigateToMenu("Settings");
      await settingPage.clickMenu("Legal");
      await settingPage.isTextVisible("View on site");
      let i = 0;
      do {
        //Xóa custom text
        await settingPage.clickOnTextLinkWithLabel(conf.caseConf.data[i].title);
        await settingPage.inputTextAreaWithLabel(conf.caseConf.data[i].page, "");
        await settingPage.clickOnBtnWithLabel("Save");

        //Input custom text
        await settingPage.clickOnTextLinkWithLabel(conf.caseConf.data[i].title);
        expect(await settingPage.page.getAttribute(settingPage.txtAddCustomText, "maxlength")).toEqual(
          conf.suiteConf.max_length,
        );
        await settingPage.inputTextAreaWithLabel(conf.caseConf.data[i].page, conf.caseConf.data[i].content);
        await settingPage.page.locator("select").selectOption(conf.caseConf.data[i].id_option);
        await settingPage.clickOnBtnWithLabel("Save");

        // View policy on SF khi add custom text
        [SFPage] = await Promise.all([
          context.waitForEvent("page"),
          await settingPage.clickOnBtnWithLabel("View on site", i + 1),
        ]);
        policyPage = new PolicyPage(SFPage, shopDomain);
        await policyPage.page.waitForLoadState("networkidle");
        await expect(async () => {
          expect(await policyPage.isTextVisible(conf.caseConf.data[i].title_policy, 2)).toBe(true);
        }).toPass();
        expect(policyPage.page.url()).toContain(`https://${conf.suiteConf.domain}${conf.caseConf.data[i].path}`);
        await expect(async () => {
          expect(await policyPage.isElementExisted(policyPage.xpathCustomtext(conf.caseConf.data[i].content))).toBe(
            true,
          );
        }).toPass();
        SFPage.close();
        i++;
      } while (i < numberOfPolicies);
    });
  });

  test(`@SB_NEWECOM_SP_36 [PB] Verify Add custom text sử dụng template variables khi Customize các pages legal`, async ({
    context,
    conf,
  }) => {
    let SFPage;
    let policyPage: PolicyPage;

    await test.step(`Vào dashboard shop PB > Online Store > Pages > chọn page legal > Click link 'Add custom text' >Input Template variables> Click Save > CLick View on site`, async () => {
      await dashboardPage.navigateToMenu("Settings");
      await settingPage.clickMenu("Legal");
      await settingPage.isTextVisible("View on site");
      let i = 0;
      do {
        //Xóa custom text
        let variables = "";
        await settingPage.clickOnTextLinkWithLabel(conf.caseConf.data[i].title);
        await settingPage.inputTextAreaWithLabel(conf.caseConf.data[i].page, "");
        await settingPage.clickOnBtnWithLabel("Save");

        // Open add custom text pop-up
        await settingPage.clickOnTextLinkWithLabel(conf.caseConf.data[i].title);

        // Verify hiển thị template variables đúng và đủ
        let j = 0;
        do {
          expect(await settingPage.isTextVisible(conf.caseConf.data[i].template_variables[j].variable)).toBe(true);
          variables += conf.caseConf.data[i].template_variables[j].variable + ",";
          j++;
        } while (j < numberOfVariableTemp);

        //Add template variables to legal
        await settingPage.inputTextAreaWithLabel(conf.caseConf.data[i].page, variables);
        await settingPage.page.locator("select").selectOption(conf.caseConf.data[i].id_option);
        await settingPage.clickOnBtnWithLabel("Save");

        //Click button View on site
        [SFPage] = await Promise.all([
          context.waitForEvent("page"),
          await settingPage.clickOnBtnWithLabel("View on site", i + 1),
        ]);

        //View policy page on SF
        policyPage = new PolicyPage(SFPage, shopDomain);
        await policyPage.page.waitForLoadState("networkidle");
        await expect(async () => {
          expect(await policyPage.isTextVisible(conf.caseConf.data[i].title_policy, 2)).toBe(true);
        }).toPass();
        expect(policyPage.page.url()).toContain(`https://${conf.suiteConf.domain}${conf.caseConf.data[i].path}`);
        await expect(async () => {
          expect(await policyPage.isElementExisted(policyPage.xpathCustomtext(conf.caseConf.content))).toBe(true);
        }).toPass();
        SFPage.close();

        i++;
      } while (i < numberOfPolicies);
    });
  });
});
