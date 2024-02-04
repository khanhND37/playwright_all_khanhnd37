import { expect, test } from "@core/fixtures";

test.describe.parallel(`Test feature Revise Google Shopping on PB/PLB (Dashboard)`, async () => {
  test(`Kiểm tra giao diện màn hình Legal settings có thêm button Add custom text @TC_SB_PLB_RGS_1`, async ({
    dashboard,
    conf,
  }) => {
    await test.step(`Chọn Settings tại menu dashboard`, async () => {
      await dashboard.locator("(//*[contains(@href, '/admin/settings') or normalize-space()='Settings'])[1]").click();
    });
    await test.step(`Chọn Legal trong màn hình settings`, async () => {
      await dashboard
        .locator("(//*[contains(@href, '/admin/settings/legal') or normalize-space()='Legal'])[1]")
        .click();
      await dashboard.waitForSelector("(//*[contains(text(),'View on site')])[1]");
    });
    await test.step(`Kiểm tra button "Add custom text"`, async () => {
      let i = 0;
      do {
        const xpathButton = `(//a[normalize-space()='${conf.caseConf.data[i].title}'])[1]`;
        expect(await dashboard.locator(xpathButton).count()).toBeGreaterThan(0);

        // Open add custom text pop-up
        await dashboard.locator(xpathButton).click();

        // Verify hien thi Add custom text pop-up tuong ung voi Title
        await expect(dashboard.locator(`(//p[normalize-space()='${conf.caseConf.data[i].title}'])[1]`)).toBeVisible();

        // Verify hien thi template variables dung va du
        let j = 0;
        do {
          await expect(
            dashboard.locator(
              `(//span[normalize-space()='` + conf.caseConf.data[i].template_variables[j].variable + `'])[1]`,
            ),
          ).toBeVisible();
          j++;
        } while (j < 6);

        // Verify hien thi textarea
        await expect(
          dashboard.locator(`(//textarea[@placeholder='${conf.caseConf.data[i].textarea}'])[1]`),
        ).toBeVisible();

        // Verify hien thi Estimated characters
        await expect(
          dashboard.locator(`(//small[contains(text(),'${conf.caseConf.data[i].limit_text}')])[1]`),
        ).toBeVisible();

        // Verify hien thi select option show text on legal page
        let k = 0;
        do {
          await expect(
            dashboard.locator(`(//select/option[normalize-space()='${conf.caseConf.data[i].select[k].option}'])[1]`),
          ).toBeEnabled();
          k++;
        } while (k < 2);

        // Close add custom text pop-up
        await dashboard.locator("//button[normalize-space()='Cancel']").click();
        i++;
      } while (i < 4);
    });
  });
});
