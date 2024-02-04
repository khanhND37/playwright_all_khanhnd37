import { test } from "@fixtures/theme";
import { expect } from "@core/fixtures";
import { OnlineStorePage } from "@pages/dashboard/online_store";
import type { ShopTheme } from "@types";
import { loadData } from "@core/conf/conf";

let shopTheme: ShopTheme;
test.beforeEach(async ({ dashboard, conf }) => {
  const onlineStorePage = new OnlineStorePage(dashboard, conf.suiteConf["domain"]);
  await dashboard.goto(`https://${conf.suiteConf.domain}/admin/themes`);
  await onlineStorePage.clickCustomizePublishTheme();
});

test.describe("Check setting multiple template in Dashboard @TS_SB_OLS_THE_INS_DB_MULTIPLE_TEMPLATE", async () => {
  const conf = loadData(__dirname, "MULTIPLE_TEMPLATE");
  for (const multipleTemplate of conf.caseConf.data) {
    test(`${multipleTemplate.description} @${multipleTemplate.case_id}`, async ({ dashboard, authRequest, theme }) => {
      const onlineStorePage = new OnlineStorePage(dashboard, conf.suiteConf["domain"]);
      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      if (multipleTemplate.template_baseon_default) {
        await test.step("Check UI Create template popup", async () => {
          await test.step("Delete all template", async () => {
            const endpoint = `https://${conf.suiteConf.domain}/admin/themes/templates.json`;
            const rawThemeResponse = await authRequest.get(endpoint);
            expect(rawThemeResponse.ok()).toBeTruthy();
            const response = await rawThemeResponse.json();

            for (let i = 0; i < response.result.templates.length; i++) {
              const templateID = response.result.templates[i].id;
              const endpointDelete = `https://${conf.suiteConf.domain}/admin/themes/template/${templateID}.json?shop_theme_id=${shopTheme.id}`;
              const rawThemeResponse = await authRequest.delete(endpointDelete);
              expect(rawThemeResponse.ok()).toBeTruthy();
            }
            await dashboard.reload();
          });

          await dashboard.locator(onlineStorePage.xpathBtnSelectPages).click();
          await dashboard.locator(onlineStorePage.getXpathMultiplePage(multipleTemplate.page)).click();
          await dashboard.locator(onlineStorePage.btnCreateTemp).click();
          //verify header popup
          await expect(dashboard.locator(onlineStorePage.xpathHeaderPopup)).toHaveText("Create a template");
          //verify body popup
          await expect(dashboard.locator(onlineStorePage.xpathBodyPopup)).toHaveText(
            "Create a template to customize how content is displayed on your online store. " +
              "You can later assign this template to specific " +
              `${multipleTemplate.page}s in ${multipleTemplate.page} admin.`,
          );
          //verify fields
          await expect(dashboard.locator(onlineStorePage.getXpathFieldPopup(1))).toHaveText("Template Name");
          await expect(dashboard.locator(onlineStorePage.getXpathFieldPopup(2))).toHaveText("Based on");
          await dashboard.locator(onlineStorePage.btnCancel).click();
        });

        await test.step("Input existing name with the same name", async () => {
          await dashboard.locator(onlineStorePage.xpathBtnSelectPages).click();
          await dashboard.locator(onlineStorePage.btnCreateTemp).click();
          //click input field
          await dashboard.locator(onlineStorePage.xpathInputTempName).click();
          await dashboard.locator(onlineStorePage.xpathInputTempName).fill("Default");
          await dashboard.locator(onlineStorePage.btnDone).click();
          await expect(dashboard.locator(onlineStorePage.xpathUsernameFormMessage)).toHaveText(
            " Template name already exists. ",
          );
        });

        await test.step("Input template name > 25 characters => create successfully with 25 characters", async () => {
          await dashboard
            .locator(onlineStorePage.xpathInputTempName)
            .fill(`${multipleTemplate.template_baseon_default}`);
          await dashboard.locator(onlineStorePage.btnDone).click();
          const contentToastMess = await onlineStorePage.genLoc(onlineStorePage.xpathTextOfToast).textContent();
          expect(contentToastMess).toEqual("Template successfully created");
          await expect(await dashboard.locator(onlineStorePage.xpathTempTitle)).toHaveText(
            ` ${multipleTemplate.template_baseon_default.substring(0, multipleTemplate.template_character_limit)} `,
          );

          await test.step("Verify template display on template list", async () => {
            await dashboard.locator(onlineStorePage.xpathBtnSelectPages).click();
            await expect(await dashboard.locator(onlineStorePage.getXpathListTemp(multipleTemplate.index))).toHaveText(
              ` ${multipleTemplate.template_baseon_default.substring(0, multipleTemplate.template_character_limit)} `,
            );
          });

          await test.step("Check response API has created template", async () => {
            //get template list by API
            const endpoint = `https://${conf.suiteConf.domain}/admin/themes/templates.json`;
            const rawThemeResponse = await authRequest.get(endpoint);
            expect(rawThemeResponse.ok()).toBeTruthy();
            const response = await rawThemeResponse.json();
            //verify first template
            const template = response.result.templates[0];
            expect(
              template.title ===
                ` ${multipleTemplate.template_baseon_default.substring(
                  0,
                  multipleTemplate.template_character_limit,
                )} ` &&
                template.shop_theme_id === shopTheme.id &&
                template.page === multipleTemplate.page,
            );
          });
        });
      }

      if (multipleTemplate.edit_template) {
        await test.step("Verify UI edit template popup", async () => {
          await dashboard.locator(onlineStorePage.xpathBtnSelectPages).click();
          await dashboard.locator(onlineStorePage.getXpathMultiplePage(multipleTemplate.page)).click();
          await dashboard.locator(onlineStorePage.getXpathListTemp(multipleTemplate.index)).click();
          //click edit icon
          await dashboard.locator(onlineStorePage.xpathIconEditTemp).click();
          //verify header popup
          await expect(dashboard.locator(onlineStorePage.xpathHeaderPopup)).toHaveText("Edit template");
          //verify body popup
          await expect(dashboard.locator(onlineStorePage.xpathBodyPopup)).toHaveText(
            "A template helps you customize how content is displayed on your online store.",
          );
          //verify button
          await expect(dashboard.locator(onlineStorePage.btnCancel)).toHaveText("Cancel");
          await expect(dashboard.locator(onlineStorePage.btnDone)).toHaveText("Done");
          await dashboard.locator(onlineStorePage.btnCancel).click();
        });

        await test.step("Input existing name with the same name", async () => {
          await dashboard.locator(onlineStorePage.xpathBtnSelectPages).click();
          await dashboard.locator(onlineStorePage.getXpathListTemp(multipleTemplate.index)).click();
          await dashboard.click(onlineStorePage.xpathIconEditTemp);
          await dashboard.click(onlineStorePage.btnDone);
          await expect(dashboard.locator(onlineStorePage.xpathUsernameFormMessage)).toHaveText(
            " Template name already exists. ",
          );
        });

        await test.step("Leave the template name blank", async () => {
          await dashboard.locator(onlineStorePage.xpathInputTempName).fill("");
          await dashboard.click("text=Template Name");
          await expect(dashboard.locator(onlineStorePage.xpathUsernameFormMessage)).toHaveText(
            " Please fill in template name. ",
          );
        });

        await test.step("Input template name > 25 characters => edit successfully with 25 characters", async () => {
          await dashboard.locator(onlineStorePage.xpathInputTempName).fill(`${multipleTemplate.edit_template}`);
          await dashboard.click(onlineStorePage.btnDone);
          const contentToastMess = await onlineStorePage.genLoc(onlineStorePage.xpathTextOfToast).textContent();
          expect(contentToastMess).toEqual("Template successfully updated");
          //verify template name was updated
          await expect(await dashboard.locator(onlineStorePage.xpathTempTitle)).toHaveText(
            `${multipleTemplate.edit_template.substring(0, multipleTemplate.template_character_limit)}`,
          );
        });

        await test.step("Verify edited template display on template list", async () => {
          await dashboard.locator(onlineStorePage.xpathBtnSelectPages).click();
          await expect(dashboard.locator(onlineStorePage.getXpathListTemp(multipleTemplate.index))).toHaveText(
            `${multipleTemplate.edit_template.substring(0, multipleTemplate.template_character_limit)}`,
          );
        });

        await test.step("Check response API has edited template", async () => {
          //get template list by API
          const endpoint = `https://${conf.suiteConf.domain}/admin/themes/templates.json`;
          const rawThemeResponse = await authRequest.get(endpoint, {
            params: {
              shop_theme_id: shopTheme.id,
              page: multipleTemplate.page,
            },
          });
          expect(rawThemeResponse.ok()).toBeTruthy();
          const response = await rawThemeResponse.json();
          const template = response.result.templates[0];
          expect(
            template.shop_theme_id === shopTheme.id &&
              template.page === multipleTemplate.page &&
              template.title ===
                `${multipleTemplate.edit_template.substring(0, multipleTemplate.template_character_limit)}`,
          );
        });
      }

      if (multipleTemplate.template_baseon_your_template) {
        const onlineStorePage = new OnlineStorePage(dashboard, conf.suiteConf["domain"]);
        await test.step("Create & setup template", async () => {
          await dashboard.locator(onlineStorePage.xpathBtnSelectPages).click();
          await dashboard.locator(onlineStorePage.getXpathMultiplePage(multipleTemplate.page)).click();
          await dashboard.click(onlineStorePage.btnCreateTemp);
          await dashboard.click(onlineStorePage.xpathInputTempName);
          await dashboard
            .locator(onlineStorePage.xpathInputTempName)
            .fill(`${multipleTemplate.template_baseon_your_template}`);
          await dashboard.locator(onlineStorePage.xpathSelectTempList).click();
          await dashboard.locator(onlineStorePage.getXpathTempName(multipleTemplate.template)).click();
          await dashboard.locator(onlineStorePage.btnDone).click();
          //Add Countdown Timer section
          await test.step("Add Countdown Timer section", async () => {
            await dashboard.click(onlineStorePage.xpathbtnAddSection);
            await dashboard.click(onlineStorePage.getXpathTabNav("Global sections"));
            await dashboard.click(onlineStorePage.getXpathSectionName(multipleTemplate.section));
            await onlineStorePage.verifySave();
            //Verify created template display on template list
            await dashboard.locator(onlineStorePage.xpathBtnSelectPages).click();
            await expect(dashboard.locator(onlineStorePage.getXpathListTemp(multipleTemplate.index))).toHaveText(
              `${multipleTemplate.template_baseon_your_template}`,
            );
          });

          await test.step("Verify response API", async () => {
            //Get response API has Temp1 inside
            const endpoint = `https://${conf.suiteConf.domain}/admin/themes/templates.json`;
            const rawThemeResponse = await authRequest.get(endpoint);
            expect(rawThemeResponse.ok()).toBeTruthy();
            const response = await rawThemeResponse.json();
            const template = response.result.templates[0];
            expect(
              template.shop_theme_id === shopTheme.id &&
                template.page === multipleTemplate.page &&
                template.title ===
                  `${multipleTemplate.template_baseon_your_template.substring(
                    0,
                    multipleTemplate.template_character_limit,
                  )}`,
            );
          });
        });
      }

      if (multipleTemplate.delete_template) {
        await test.step("Check UI Delete template popup & cancel delete ", async () => {
          await dashboard.locator(onlineStorePage.xpathBtnSelectPages).click();
          await dashboard.locator(onlineStorePage.getXpathMultiplePage(multipleTemplate.page)).click();
          await dashboard.click(onlineStorePage.getXpathListTemp(multipleTemplate.index));
          //click delete icon
          await dashboard.click(onlineStorePage.xpathIconDeletTemp);
          //verify delete popup
          await expect(dashboard.locator(onlineStorePage.xpathHeaderPopup)).toHaveText("Delete template");
          await expect(dashboard.locator(onlineStorePage.xpathPopupConfirm)).toHaveText(
            `Template is assigned to 0 ${multipleTemplate.page}(s). This action cannot be undone.` +
              ` Are you sure you want to delete this template?`,
          );
          await expect(dashboard.locator(onlineStorePage.btnCancel)).toHaveText("Cancel");
          await expect(dashboard.locator(onlineStorePage.btnDelete)).toHaveText("Delete");
          //Cancel delete
          await dashboard.locator(onlineStorePage.btnCancel).click();
        });

        await test.step("Delete template", async () => {
          //Delete template
          await dashboard.locator(onlineStorePage.xpathBtnSelectPages).click();
          await dashboard.click(onlineStorePage.getXpathListTemp(multipleTemplate.index));
          await dashboard.click(onlineStorePage.xpathIconDeletTemp);
          await dashboard.click(onlineStorePage.btnDelete);
          const contentToastMess = await onlineStorePage.genLoc(onlineStorePage.xpathTextOfToast).textContent();
          expect(contentToastMess).toEqual("Template successfully deleted");
        });

        await test.step("Verify deleted template not display on template list", async () => {
          await dashboard.locator(onlineStorePage.xpathBtnSelectPages).click();
          expect(
            await dashboard.isHidden(
              `text=${multipleTemplate.delete_template.substring(0, multipleTemplate.template_character_limit)}]`,
            ),
          ).toBeTruthy();
        });
      }
    });
  }
});
