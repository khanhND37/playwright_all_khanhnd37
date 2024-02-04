import { expect, test } from "@core/fixtures";

test.describe.parallel(`Test feature Revise Google Shopping on PB/PLB (Storefront)`, async () => {
  test(
    `Kiểm tra lưu thành công custom text trường hợp ` +
      `"Show this text [at the beginning] of this legal page" @TC_SB_PLB_RGS_4`,
    async ({ dashboard, conf }) => {
      let i = 0;
      do {
        await test.step(`Chọn Settings tại menu dashboard`, async () => {
          await dashboard
            .locator("(//*[contains(@href, '/admin/settings') or normalize-space()='Settings'])[1]")
            .click();
        });
        await test.step(`Chọn Legal trong màn hình settings`, async () => {
          await dashboard
            .locator("(//*[contains(@href, '/admin/settings/legal') or normalize-space()='Legal'])[1]")
            .click();
          await dashboard.waitForSelector("(//*[contains(text(),'View on site')])[1]");
        });
        await test.step(`Chọn 1 button add custom text`, async () => {
          const xpathButton = `(//a[normalize-space()='Add custom text to ${conf.caseConf.data[i].page_title}'])[1]`;
          await dashboard.locator(xpathButton).click();
        });
        await test.step(`Nhập nội dung cho custom text`, async () => {
          const xpathTextArea = `(//textarea[@placeholder='Enter your text'])[1]`;
          await dashboard.locator(xpathTextArea).fill("");
          await dashboard.locator(xpathTextArea).fill(conf.caseConf.data[i].content);
        });
        await test.step(`Chọn option "Show this text ${conf.caseConf.data[i].option} of this legal page`, async () => {
          await dashboard.locator("select").selectOption(conf.caseConf.data[i].id_option);
        });
        await test.step(`Bấm nút Save`, async () => {
          await dashboard.locator("(//button[normalize-space()='Save'])[1]").click();
        });
        await test.step(`Bấm nút View on site của legal page vừa update`, async () => {
          await dashboard.goto(`https://${conf.suiteConf.domain}${conf.caseConf.data[i].path}`);
          await expect(
            dashboard.locator(`(//*[contains(text(), '${conf.caseConf.data[i].content}')])[1]`),
          ).toBeVisible();
        });
        i++;
      } while (i < 4);
    },
  );

  test(
    `Kiểm tra lưu thành công custom text trường hợp ` +
      `"Show this text [at the end] of this legal page" @TC_SB_PLB_RGS_5`,
    async ({ dashboard, conf }) => {
      let i = 0;
      do {
        await test.step(`Chọn Settings tại menu dashboard`, async () => {
          await dashboard
            .locator("(//*[contains(@href, '/admin/settings') or normalize-space()='Settings'])[1]")
            .click();
        });
        await test.step(`Chọn Legal trong màn hình settings`, async () => {
          await dashboard
            .locator("(//*[contains(@href, '/admin/settings/legal') or normalize-space()='Legal'])[1]")
            .click();
          await dashboard.waitForSelector("(//*[contains(text(),'View on site')])[1]");
        });
        await test.step(`Chọn 1 button add custom text`, async () => {
          const xpathButton = `(//a[normalize-space()='Add custom text to ${conf.caseConf.data[i].page_title}'])[1]`;
          await dashboard.locator(xpathButton).click();
        });
        await test.step(`Nhập nội dung cho custom text`, async () => {
          const xpathTextArea = `(//textarea[@placeholder='Enter your text'])[1]`;
          await dashboard.locator(xpathTextArea).fill("");
          await dashboard.locator(xpathTextArea).fill(conf.caseConf.data[i].content);
        });
        await test.step(`Chọn option "Show this text ${conf.caseConf.data[i].option} of this legal page"`, async () => {
          await dashboard.locator("select").selectOption(conf.caseConf.data[i].id_option);
        });
        await test.step(`Bấm nút Save`, async () => {
          await dashboard.locator("(//button[normalize-space()='Save'])[1]").click();
        });
        await test.step(`Bấm nút View on site của legal page vừa update`, async () => {
          await dashboard.goto(`https://${conf.suiteConf.domain}${conf.caseConf.data[i].path}`);
          await expect(
            dashboard.locator(`(//*[contains(text(), '${conf.caseConf.data[i].content}')])[1]`),
          ).toBeVisible();
        });
        i++;
      } while (i < 4);
    },
  );

  test(`Kiểm tra nhập nội dung custom text @TC_SB_PLB_RGS_6`, async ({ dashboard, conf }) => {
    await test.step(`Chọn Settings tại menu dashboard`, async () => {
      await dashboard.locator("(//*[contains(@href, '/admin/settings') or normalize-space()='Settings'])[1]").click();
    });
    await test.step(`Chọn Legal trong màn hình settings`, async () => {
      await dashboard
        .locator("(//*[contains(@href, '/admin/settings/legal') or normalize-space()='Legal'])[1]")
        .click();
      await dashboard.waitForSelector("(//*[contains(text(),'View on site')])[1]");
    });
    await test.step(`Chọn 1 button add custom text`, async () => {
      const xpathButton = `(//a[normalize-space()='Add custom text to ${conf.caseConf.page_title}'])[1]`;
      await dashboard.locator(xpathButton).click();
    });
    await test.step(`Nhập nội dung cho custom text`, async () => {
      const xpathTextArea = `(//textarea[@placeholder='Enter your text'])[1]`;
      await dashboard.locator(xpathTextArea).fill("");
      await dashboard.locator(xpathTextArea).fill(conf.caseConf.content);
    });
    await test.step(`Chọn option "Show this text ${conf.caseConf.option} of this legal page"`, async () => {
      await dashboard.locator("select").selectOption(conf.caseConf.id_option);
    });
    await test.step(`Bấm nút Save`, async () => {
      await dashboard.locator("(//button[normalize-space()='Save'])[1]").click();
    });
    await test.step(`Bấm nút View on site của legal page vừa update`, async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}${conf.caseConf.path}`);
      await expect(dashboard.locator(`(//*[contains(text(), '${conf.caseConf.content}')])[1]`)).toBeVisible();
    });
  });

  test(`Kiểm tra support template variables trong custom text @TC_SB_PLB_RGS_7`, async ({ dashboard, conf }) => {
    let variables = "";
    let content = "";
    await test.step(`Chọn Settings tại menu dashboard`, async () => {
      await dashboard.locator("(//*[contains(@href, '/admin/settings') or normalize-space()='Settings'])[1]").click();
    });
    await test.step(`Chọn Legal trong màn hình settings`, async () => {
      await dashboard
        .locator("(//*[contains(@href, '/admin/settings/legal') or normalize-space()='Legal'])[1]")
        .click();
      await dashboard.waitForSelector("(//*[contains(text(),'View on site')])[1]");
    });
    await test.step(`Chọn 1 button add custom text`, async () => {
      const xpathButton = `(//a[normalize-space()='Add custom text to ${conf.caseConf.page_title}'])[1]`;
      await dashboard.locator(xpathButton).click();
    });
    await test.step(`Nhập nội dung cho custom text`, async () => {
      let i = 0;
      do {
        variables += " - " + conf.caseConf.data[i].variable;
        content += " - " + conf.caseConf.data[i].value;
        i++;
      } while (i < 6);
      const xpathTextArea = `(//textarea[@placeholder='Enter your text'])[1]`;
      await dashboard.locator(xpathTextArea).fill("");
      await dashboard.locator(xpathTextArea).fill(variables);
    });
    await test.step(`Chọn option "Show this text ${conf.caseConf.option} of this legal page"`, async () => {
      await dashboard.locator("select").selectOption(conf.caseConf.id_option);
    });
    await test.step(`Bấm nút Save`, async () => {
      await dashboard.locator("(//button[normalize-space()='Save'])[1]").click();
    });
    await test.step(`Bấm nút View on site của legal page vừa update`, async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}${conf.caseConf.path}`);
      await expect(dashboard.locator(`(//*[contains(text(), '${content}')])[1]`)).toBeVisible();
    });
  });
});
