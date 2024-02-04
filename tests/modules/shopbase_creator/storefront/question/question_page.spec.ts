import { test, expect } from "@core/fixtures";
import { HomePage } from "@pages/dashboard/home_page";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir } from "@utils/theme";
import { FrameLocator } from "@playwright/test";

test.describe("Verify block button", () => {
  let webBuilder: WebBuilder, xpathBlock: Blocks, frameLocator: FrameLocator, xpathBlockQuestion: string;

  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    xpathBlock = new Blocks(dashboard, conf.suiteConf.domain);
    frameLocator = xpathBlock.frameLocator;
    xpathBlockQuestion = "//div[contains(@class,'product-questions-container')]";
  });

  test(`@SB_SC_LPC_QEP_01 Verify page question chỉ có tại shop creator`, async ({ dashboard, token, conf }) => {
    const page = dashboard;
    const caseConf = conf.caseConf;

    await test.step(` Tại droplist Member page ->  Verify hiển thị question pageVerify hiển thị question page`, async () => {
      await page.getByRole("link", { name: "Online Store" }).click();
      await page.getByRole("button", { name: "Customize", exact: true }).click();
      await page.locator('button[name="Pages"]').click();

      const locator = page.locator(
        `div.w-builder__page-groups--item-label:has-text("${caseConf.expected.text_content}")`,
      );
      await expect(locator).toBeVisible();
    });

    await test.step(`- Login vào các shop theo data 
  Tại droplist Member page ->  Verify hiển thị question page`, async () => {
      for (const shopData of caseConf.shop_data) {
        const homePage = new HomePage(page, shopData.domain);
        const accessToken = (
          await token.getWithCredentials({
            domain: shopData.shop_name,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;
        await homePage.loginWithToken(accessToken);

        await page.getByRole("link", { name: "Online Store" }).click();
        await page.getByRole("button", { name: "Customize", exact: true }).first().click();
        await page.locator('button[name="Pages"]').click();

        const locator = page.locator(
          `div.w-builder__page-groups--item-label:has-text("${caseConf.expected.text_content}")`,
        );
        await expect(locator).toBeHidden();
      }
    });
  });

  test(`@SB_SC_LPC_QEP_02 Verify block question ở trạng thái default`, async ({ dashboard, conf, snapshotFixture }) => {
    const page = dashboard;
    const caseConf = conf.caseConf;
    const section = caseConf.section_index;
    const block = caseConf.block_index;

    await test.step(`Tại side bar setting block -> tại tab Design -> Verify thông tin default hiển thị tạ các trường theo data product`, async () => {
      await page.getByRole("link", { name: "Online Store" }).click();
      await page.getByRole("button", { name: "Customize", exact: true }).first().click();
      await page.locator('button[name="Pages"]').click();

      await dashboard.goto(`${page.url().toString()}?page=${caseConf.page_name}`);
      await page.locator("#v-progressbar").waitFor({ state: "detached" });

      await page.locator("div.w-builder__autocomplete").click();
      await page.getByText(`${caseConf.product_no_question}`).nth(2).click();
      await page.locator("#v-progressbar").waitFor({ state: "detached" });

      const blockSelector = webBuilder.getSelectorByIndex({ section, block });
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      await frameLocator.locator(blockSelector).click();

      await snapshotFixture.verify({
        page: dashboard,
        selector: xpathBlock.xpathSidebar,
        snapshotName: caseConf.expected.snapshot_sidebar,
      });
    });

    await test.step(`Verify block question default ở preview`, async () => {
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: xpathBlockQuestion,
        iframe: webBuilder.iframe,
        snapshotName: caseConf.expected.snapshot_block,
      });
    });
  });

  test(`@SB_SC_LPC_QEP_04 Verify block khi thực hiện setting Align`, async ({ dashboard, conf, snapshotFixture }) => {
    const page = dashboard;
    const caseConf = conf.caseConf;
    const section = caseConf.section_index;
    const block = caseConf.block_index;

    await test.step(`Precond - vào page question trong wb. Chọn product có question`, async () => {
      await dashboard.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${caseConf.theme_id}?page=${caseConf.page_name}`,
      );
      await page.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");

      await page.locator("div.w-builder__autocomplete").click();
      await dashboard.locator("//input[@placeholder='Search products']").click();
      await dashboard.locator("//input[@placeholder='Search products']").fill(caseConf.product_name);
      await page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });

      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).isVisible();
      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).click();
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step(` Verify vị trí của block khi chọn align là option default`, async () => {
      const blockSelector = webBuilder.getSelectorByIndex({ section, block });
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      await frameLocator.locator(blockSelector).click();

      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector:
          "//div[contains(@class,'wb-preview__column--container') and descendant::div[contains(@class,'product-questions-container')]]",
        iframe: webBuilder.iframe,
        snapshotName: caseConf.expected.snapshot_block_left,
      });
    });

    await test.step(`Chọn Align option theo data`, async () => {
      const settingsBlock = caseConf.settings_block;
      const blockSelector = webBuilder.getSelectorByIndex({ section, block });
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      await frameLocator.locator(blockSelector).click();

      for (const settingBlock of settingsBlock) {
        await webBuilder.selectAlign("align_self", settingBlock.align);
        await dashboard.waitForLoadState("domcontentloaded");
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector:
            "//div[contains(@class,'wb-preview__column--container') and descendant::div[contains(@class,'product-questions-container')]]",
          iframe: webBuilder.iframe,
          snapshotName: caseConf.expected[`snapshot_block_${settingBlock.align.toLowerCase()}`],
        });
      }
    });
  });

  test(`@SB_SC_LPC_QEP_07 Verify block khi thực hiện setting back ground`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const page = dashboard;
    const caseConf = conf.caseConf;
    const section = caseConf.section_index;
    const block = caseConf.block_index;

    await test.step(`Precond - vào page question trong wb. Chọn product có question`, async () => {
      await dashboard.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${caseConf.theme_id}?page=${caseConf.page_name}`,
      );
      await page.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");

      await page.locator("div.w-builder__autocomplete").click();
      await dashboard.locator("//input[@placeholder='Search products']").click();
      await dashboard.locator("//input[@placeholder='Search products']").fill(caseConf.product_name);
      await page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });

      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).isVisible();
      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).click();
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step(`Click vào icon select color của back ground `, async () => {
      const blockSelector = webBuilder.getSelectorByIndex({ section, block });
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      await frameLocator.locator(blockSelector).click();

      await dashboard
        .locator(`//div[@data-widget-id='${caseConf.background.label}']//div[contains(@class,'sb-pointer')]`)
        .click();
      await snapshotFixture.verify({
        page: dashboard,
        selector: "//div[contains(@class,'w-builder__popover w-builder__widget--background')]",
        snapshotName: caseConf.expected.snapshot_widget_background,
      });
    });

    await test.step(`1. Thực hiện chọn màu theo data2.  Click vào icon Preview 3. SF: Tại màn My Product -> click vào product  Product có question  `, async () => {
      await webBuilder.setBackground(caseConf.background.label, caseConf.background.value);
      await webBuilder.page.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: xpathBlockQuestion,
        iframe: webBuilder.iframe,
        snapshotName: caseConf.expected.snapshot_block_background_red,
      });
    });

    await test.step(`Tại dashboard: 1. Thực hiện chọn  background theo data 2.  Click vào icon Preview 3. SF: Tại màn My Product -> click vào product  Product có question`, async () => {
      await webBuilder.setBackground(caseConf.background.label, caseConf.backgroundImage.value);
      await webBuilder.page.waitForLoadState("networkidle");
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: xpathBlockQuestion,
        iframe: webBuilder.iframe,
        snapshotName: caseConf.expected.snapshot_block_background_image,
      });
    });
  });

  test(`@SB_SC_LPC_QEP_13 Verify block khi thực hiện setting Padding`, async ({ dashboard, conf, snapshotFixture }) => {
    const page = dashboard;
    const caseConf = conf.caseConf;
    const section = caseConf.section_index;
    const block = caseConf.block_index;

    await test.step(`Precond - vào page question trong wb. Chọn product có question`, async () => {
      await dashboard.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${caseConf.theme_id}?page=${caseConf.page_name}`,
      );
      await page.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");

      await page.locator("div.w-builder__autocomplete").click();
      await dashboard.locator("//input[@placeholder='Search products']").click();
      await dashboard.locator("//input[@placeholder='Search products']").fill(caseConf.product_name);
      await page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });

      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).isVisible();
      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).click();
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step(`Click vào droplist tại Padding -> Verify thông tin hiển thị `, async () => {
      const blockSelector = webBuilder.getSelectorByIndex({ section, block });
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      await frameLocator.locator(blockSelector).click();

      await dashboard
        .locator(`//div[@data-widget-id='padding']//div[contains(@class,'w-builder__widget--inline')]`)
        .first()
        .click();
      await snapshotFixture.verify({
        page: dashboard,
        selector:
          "//div[contains(@class,'w-builder__popover w-builder__widget--spacing') and descendant::label[normalize-space()='Padding']]",
        snapshotName: caseConf.expected.snapshot_widget_padding,
      });
    });
    await test.step(`1. Thực hiện chọn input Padding theo data 2.  Click vào icon Preview 3. SF: Tại màn My Product -> click vào product  Product có question `, async () => {
      await dashboard
        .locator(`//div[@data-widget-id='padding']//div[contains(@class,'w-builder__widget--inline')]`)
        .first()
        .click();
      await webBuilder.setMarginPadding(caseConf.padding.label, caseConf.padding.value);
      await snapshotFixture.verify({
        page: dashboard,
        selector: "//div[@data-widget-id='padding']",
        snapshotName: caseConf.expected.snapshot_widget_padding_with_value,
      });
      // Wait do sau khi chọn value có chút delay rồi mới apply thành công
      await webBuilder.page.waitForTimeout(1000);
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector:
          "//section[contains(@class,'block') and descendant::div[contains(@class,'product-questions-container')]]",
        iframe: webBuilder.iframe,
        snapshotName: caseConf.expected.snapshot_block_with_padding,
      });
    });
  });

  test(`@SB_SC_LPC_QEP_14 Verify header, footer có trong page`, async ({ dashboard, conf, snapshotFixture }) => {
    await test.step(`1. Verrify header, footer hiển thị của page tại web builder 2 Click vào icon Preview -3. SF: Tại màn My Product -> click vào product  Product có question `, async () => {
      const page = dashboard;
      const caseConf = conf.caseConf;
      await dashboard.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${caseConf.theme_id}?page=${caseConf.page_name}`,
      );
      await page.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");

      await page.locator("div.w-builder__autocomplete").click();
      await dashboard.locator("//input[@placeholder='Search products']").click();
      await dashboard.locator("//input[@placeholder='Search products']").fill(caseConf.product_name);
      await page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });

      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).isVisible();
      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).click();

      await webBuilder.page.waitForLoadState("networkidle");
      await webBuilder.page.waitForLoadState("domcontentloaded");

      await snapshotFixture.verify({
        page: dashboard,
        selector: "//iframe[@id='preview']",
        snapshotName: caseConf.expected.snapshot_storefront,
      });
    });
  });

  test(`@SB_SC_LPC_QEP_15 Verify block khi thực hiện connect với product không có question`, async ({
    context,
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const page = dashboard;
    const caseConf = conf.caseConf;
    const section = caseConf.section_index;
    const block = caseConf.block_index;

    await test.step(`Precond - vào page question trong wb. Chọn product ko có question`, async () => {
      await dashboard.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${caseConf.theme_id}?page=${caseConf.page_name}`,
      );
      await page.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");

      await page.locator("div.w-builder__autocomplete").click();
      await dashboard.locator("//input[@placeholder='Search products']").click();
      await dashboard.locator("//input[@placeholder='Search products']").fill(caseConf.product_name);
      await page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });

      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).isVisible();
      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).click();
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step(`- Verify block question tại web builder khi entity đang chọn product theo data`, async () => {
      const blockSelector = webBuilder.getSelectorByIndex({ section, block });
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      await frameLocator.locator(blockSelector).click();

      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: xpathBlockQuestion,
        iframe: webBuilder.iframe,
        snapshotName: caseConf.expected.snapshot_block_default,
      });
    });

    await test.step(` Click vào icon Preview -> Verify thông tin của block khi preview`, async () => {
      const [previewTab] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(xpathBlock.xpathButtonPreview),
      ]);
      await previewTab.waitForLoadState("domcontentloaded");
      await previewTab.waitForLoadState("networkidle");
      await previewTab.waitForSelector(xpathBlockQuestion);
      await snapshotFixture.verify({
        page: previewTab,
        selector: xpathBlockQuestion,
        snapshotName: caseConf.expected.snapshot_block_default_storefront,
      });
    });
  });

  test(`@SB_SC_LPC_QEP_16 Verify block khi thực hiện connect với product có question`, async ({
    context,
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const page = dashboard;
    const caseConf = conf.caseConf;
    const section = caseConf.section_index;
    const block = caseConf.block_index;

    await test.step(`Precond - vào page question trong wb. Chọn product ko có question`, async () => {
      await dashboard.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${caseConf.theme_id}?page=${caseConf.page_name}`,
      );
      await page.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");

      await page.locator("div.w-builder__autocomplete").click();
      await dashboard.locator("//input[@placeholder='Search products']").click();
      await dashboard.locator("//input[@placeholder='Search products']").fill(caseConf.product_name);
      await page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });

      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).isVisible();
      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).click();
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step(`- Verify block question tại web builder khi  data source default chọn là Current page product  với product theo data`, async () => {
      const blockSelector = webBuilder.getSelectorByIndex({ section, block });
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      await frameLocator.locator(blockSelector).click();

      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: xpathBlockQuestion,
        iframe: webBuilder.iframe,
        snapshotName: caseConf.expected.snapshot_block_has_question,
      });
    });

    await test.step(` Click vào icon Preview -> Verify thông tin của block khi preview`, async () => {
      const [previewTab] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.click(xpathBlock.xpathButtonPreview),
      ]);
      await previewTab.waitForLoadState("domcontentloaded");
      await previewTab.waitForLoadState("networkidle");
      await previewTab.waitForSelector(xpathBlockQuestion);
      await snapshotFixture.verify({
        page: previewTab,
        selector: xpathBlockQuestion,
        snapshotName: caseConf.expected.snapshot_block_has_question_storefront,
      });
    });
  });

  test(`@SB_SC_LPC_QEP_18 Verify thông tin block khi thực hiện thay đổi data source cho section`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const page = dashboard;
    const caseConf = conf.caseConf;
    let selectData = "";

    await test.step(`Precond - vào page question trong wb. Chọn product ko có question`, async () => {
      await dashboard.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${caseConf.theme_id}?page=${caseConf.page_name}`,
      );
      await page.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");

      await page.locator("div.w-builder__autocomplete").click();
      await dashboard.locator("//input[@placeholder='Search products']").click();
      await dashboard.locator("//input[@placeholder='Search products']").fill(caseConf.product_name);
      await page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });

      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).isVisible();
      await page.locator(`//div[normalize-space()='${caseConf.product_name}'][2]`).click();
      await webBuilder.page.waitForLoadState("networkidle");

      const sidebarSelector = await webBuilder.getSidebarSelectorByName({
        sectionName: caseConf.section_name,
        sectionIndex: caseConf.section_index,
      });
      await page.locator(sidebarSelector).click();
    });

    for (const [key, category] of caseConf.categories.entries()) {
      await test.step(`Chọn lại source theo data -> Verify thông tin của block question`, async () => {
        await page.waitForLoadState("networkidle");
        await page.waitForLoadState("domcontentloaded");
        await page.locator("#search-data-source").click();
        if (key > 0) {
          if (
            await page
              .locator(`//div[contains(@class,'search-source')]//button[contains(@class,'btn-back')]`)
              .isHidden()
          ) {
            await page.locator("#search-data-source").click();
            await page.waitForSelector(`//div[contains(@class,'search-source')]//button[contains(@class,'btn-back')]`);
          }
          await page.locator(`//div[contains(@class,'search-source')]//button[contains(@class,'btn-back')]`).click();
        }

        await page.waitForSelector(
          `//button[contains(@class,'sb-button--select sb-button--medium') and descendant::span[normalize-space()='${category}']]`,
        );
        await page
          .locator(
            `//button[contains(@class,'sb-button--select sb-button--medium') and descendant::span[normalize-space()='${category}']]`,
          )
          .click();
        await page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });
        await page.waitForSelector(
          `//div[contains(@class,'list-search-result')]//div[contains(@class,'sb-selection-item')][1]`,
        );
        selectData = await page
          .locator(`//div[contains(@class,'list-search-result')]//div[contains(@class,'sb-selection-item')][1]`)
          .innerText();
        await page
          .locator(`//div[contains(@class,'list-search-result')]//div[contains(@class,'sb-selection-item')][1]`)
          .click();

        await page.waitForSelector(`[class="data-source-title connected"]:text-is('${selectData}')`);

        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: xpathBlockQuestion,
          iframe: webBuilder.iframe,
          snapshotName: caseConf.expected[`snapshot_block_question_source_${category.toLowerCase()}`],
        });
      });
    }
  });

  test(`@SB_SC_LPC_QEP_22 Verify không xóa, ẩn,duplicate và không insert được block question từ pannel`, async ({
    dashboard,
    conf,
  }) => {
    const page = dashboard;
    const caseConf = conf.caseConf;
    const section = caseConf.section_index;
    const block = caseConf.block_index;

    await test.step(`Precond - vào page question trong wb`, async () => {
      await dashboard.goto(
        `https://${conf.suiteConf.domain}/admin/builder/site/${caseConf.theme_id}?page=${caseConf.page_name}`,
      );
      await page.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step(`- Click button Insert trên thanh quick bar setting -> search block  Question -> Verify thông tin hiển thị `, async () => {
      await page.waitForSelector(`//div[contains(@class, 'w-builder__header-left')]//button[@name='Insert']`);
      await page.locator(`//div[contains(@class, 'w-builder__header-left')]//button[@name='Insert']`).click();
      await page.locator("//input[@placeholder='Search']").click();
      await page.locator("//input[@placeholder='Search']").fill(caseConf.block_name);
      await expect(
        page.locator("//div[contains(@class, 'w-builder__insert-previews--search-empty-content')]"),
      ).toBeVisible();
    });

    await test.step(`Click vào block Question >  Verify icon Hide để ẩn block`, async () => {
      await page.waitForSelector(`//div[contains(@class, 'w-builder__header-left')]//button[@name='Layer']`);
      await page.locator(`//div[contains(@class, 'w-builder__header-left')]//button[@name='Layer']`).click();
      const blockSelector = webBuilder.getSelectorByIndex({ section, block });
      await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
      await frameLocator.locator(blockSelector).click();
      await expect(page.locator(`//div[@id='quick-settings']//div[normalize-space()='Hide']`)).toBeHidden();
    });

    await test.step(`Verify icon Delete để xóa block`, async () => {
      await expect(page.locator(`//div[@id='quick-settings']//div[normalize-space()='Delete']`)).toBeHidden();
    });
  });
});
