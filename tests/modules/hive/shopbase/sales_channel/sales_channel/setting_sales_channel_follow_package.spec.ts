import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { MarketingAndSales } from "@pages/dashboard/marketing_and_sales";
import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";
import { HiveSalesChannel } from "../../../../../../src/pages/hive/hiveSalesChannel";

test.describe("Verify setting sales channel follow package @SB_MAR_SALES_SC_CUS_TRACK_IDENTIFY", () => {
  const logOut = `//a[@href='/admin/logout']`;
  const logInTitle = `//div[@class='unite-ui-login__title']`;
  const fullDescription = `//input[contains(@id,"_description") and contains(@name,"[description]")]`;
  const shortDescriptionField = `//input[contains(@id,"_short_description")]`;
  const actualDescription = `//a[text()[normalize-space()="Learn more."]]//parent::p`;
  let shortDescription: string;
  let description: string;

  test(`Check hiển thị Sale channels khi chọn Approve @SB_MAR_SALES_SC_CUS_TRACK_IDENTIFY_1`, async ({
    hiveSBase,
    dashboard,
    conf,
  }) => {
    await test.step(`Đăng nhập Hive, truy cập theo đường dẫn Sales Channel > Sales Channel`, async () => {
      const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSB.goToSalesChannelList();
    });
    await test.step(`Edit Sales Channel, setting là Approve trong tab Info và lưu lại`, async () => {
      const hiveSalesChannel = await new HiveSalesChannel(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSalesChannel.editSalesChannel(conf.caseConf.sales_channel_name);
      shortDescription = await hiveSBase.getAttribute(shortDescriptionField, "value");
      description = await hiveSBase.getAttribute(fullDescription, "value");
      await hiveSalesChannel.checkEnable(false);
      await hiveSalesChannel.clearPackage();
      await hiveSalesChannel.checkApprove(true);
      await hiveSalesChannel.saveSaleChannel();
    });
    await test.step(`Đăng nhập vào Dasboard và truy cập theo đường dẫn
      Marketing & Sales > Sales channels`, async () => {
      const saleChannel = await new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await saleChannel.gotoMenuMarketingAndSales();
      await dashboard.waitForSelector(`//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]`);
      await expect(
        dashboard.locator(
          `//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//parent::div//parent::div//parent::a`,
        ),
      ).not.toHaveClass(/channel-disabled/);
      const sDescription = await dashboard
        .locator(`(//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//following-sibling::p)[1]`)
        .textContent();
      expect(sDescription).toBe(shortDescription);
    });
    await test.step(`Click vào Sale channel vừa chỉnh sửa`, async () => {
      await dashboard.click(`//a/div/div/p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]`);
      await dashboard.waitForSelector(actualDescription);
      await expect(dashboard.locator(actualDescription)).toContainText(description);
    });
  });

  test(`Check hiển thị Sale channels khi chỉ chọn Enable, không nhập User IDs trên Hive
  @SB_MAR_SALES_SC_CUS_TRACK_IDENTIFY_2`, async ({ hiveSBase, dashboard, conf }) => {
    await test.step(`Đăng nhập Hive, truy cập theo đường dẫn Sales Channel > Sales Channel`, async () => {
      const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSB.goToSalesChannelList();
    });
    await test.step(
      `Edit Sales Channel, setting là Enable trong tab Info,` + `không nhập User IDs và lưu lại`,
      async () => {
        const hiveSalesChannel = await new HiveSalesChannel(hiveSBase, conf.suiteConf.hive_domain);
        await hiveSalesChannel.editSalesChannel(conf.caseConf.sales_channel_name);
        shortDescription = await hiveSBase.getAttribute(shortDescriptionField, "value");
        await hiveSalesChannel.checkEnable(true);
        await hiveSalesChannel.clearUserID();
        await hiveSalesChannel.clearPackage();
        await hiveSalesChannel.checkApprove(false);
        await hiveSalesChannel.saveSaleChannel();
      },
    );
    await test.step(`Đăng nhập vào Dasboard và truy cập theo đường dẫn
    Marketing & Sales > Sales channels`, async () => {
      const saleChannel = await new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await saleChannel.gotoMenuMarketingAndSales();
      await dashboard.waitForSelector(`//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]`);
      await expect(
        dashboard.locator(
          `//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//parent::div//parent::div//parent::a`,
        ),
      ).toHaveClass(/channel-disabled/);
      const sDescription = await dashboard
        .locator(`(//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//following-sibling::p)[1]`)
        .textContent();
      expect(sDescription).toBe(shortDescription);
      await expect(
        dashboard.locator(`//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//parent::div`),
      ).toContainText(conf.caseConf.sales_channel_status);
    });
  });

  test(`Check hiển thị Sale channels khi chỉ chọn Enable, có nhập User IDs trên Hive
  @SB_MAR_SALES_SC_CUS_TRACK_IDENTIFY_3`, async ({ hiveSBase, dashboard, conf }) => {
    await test.step(`Đăng nhập Hive, truy cập theo đường dẫn Sales Channel > Sales Channel`, async () => {
      const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSB.goToSalesChannelList();
    });
    await test.step(`Edit Sales Channel, setting là Enable trong tab Info, nhập User IDs và lưu lại`, async () => {
      const hiveSalesChannel = await new HiveSalesChannel(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSalesChannel.editSalesChannel(conf.caseConf.sales_channel_name);
      shortDescription = await hiveSBase.getAttribute(shortDescriptionField, "value");
      description = await hiveSBase.getAttribute(fullDescription, "value");
      await hiveSalesChannel.checkEnable(true);
      await hiveSalesChannel.fillUserIDs(conf.caseConf.user_id);
      await hiveSalesChannel.clearPackage();
      await hiveSalesChannel.checkApprove(false);
      await hiveSalesChannel.saveSaleChannel();
    });
    await test.step(`Đăng nhập vào Dasboard với user được nhập ID và truy cập theo đường dẫn
    Marketing & Sales > Sales channels`, async () => {
      const saleChannel = await new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await saleChannel.gotoMenuMarketingAndSales();
      await dashboard.waitForSelector(`//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]`);
      await expect(
        dashboard.locator(
          `//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//parent::div//parent::div//parent::a`,
        ),
      ).not.toHaveClass(/channel-disabled/);
      const sDescription = await dashboard
        .locator(`(//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//following-sibling::p)[1]`)
        .textContent();
      expect(sDescription).toBe(shortDescription);
    });
    await test.step(`Click vào Sale channel vừa chỉnh sửa`, async () => {
      await dashboard.click(`//a/div/div/p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]`);
      await dashboard.waitForSelector(actualDescription);
      await expect(dashboard.locator(actualDescription)).toContainText(description);
    });
  });

  test(`Check hiển thị Sale channels khi không chọn Approve và không chọn Enable trên Hive
  @SB_MAR_SALES_SC_CUS_TRACK_IDENTIFY_4`, async ({ hiveSBase, dashboard, conf }) => {
    await test.step(`Đăng nhập Hive, truy cập theo đường dẫn Sales Channel > Sales Channel`, async () => {
      const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSB.goToSalesChannelList();
    });
    await test.step(
      `Edit Sales Channel, setting là không chọn Approve và Enable trong tab Info,` + `rồi lưu lại`,
      async () => {
        const hiveSalesChannel = await new HiveSalesChannel(hiveSBase, conf.suiteConf.hive_domain);
        await hiveSalesChannel.editSalesChannel(conf.caseConf.sales_channel_name);
        await hiveSalesChannel.checkEnable(false);
        await hiveSalesChannel.clearUserID();
        await hiveSalesChannel.clearPackage();
        await hiveSalesChannel.checkApprove(false);
        await hiveSalesChannel.saveSaleChannel();
      },
    );
    await test.step(`Đăng nhập vào Dasboard và truy cập theo đường dẫn
    Marketing & Sales > Sales channels`, async () => {
      const saleChannel = await new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await saleChannel.gotoMenuMarketingAndSales();
      await expect(
        dashboard.locator(
          `//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//parent::div//parent::div//parent::a`,
        ),
      ).not.toBeVisible();
    });
  });

  test(`Check hiển thị Sale channels theo package/platform khi chọn Approve trên Hive
  @SB_MAR_SALES_SC_CUS_TRACK_IDENTIFY_5`, async ({ hiveSBase, dashboard, conf }) => {
    const dashboards = await new DashboardPage(dashboard, conf.caseConf.domain);

    await test.step(`Đăng nhập Hive, truy cập theo đường dẫn Sales Channel > Sales Channel`, async () => {
      const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSB.goToSalesChannelList();
    });
    await test.step(`Edit Sales Channel, chọn Package và Approve trong tab Info, lưu lại`, async () => {
      const hiveSalesChannel = await new HiveSalesChannel(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSalesChannel.editSalesChannel(conf.caseConf.sales_channel_name);
      shortDescription = await hiveSBase.getAttribute(shortDescriptionField, "value");
      description = await hiveSBase.getAttribute(fullDescription, "value");
      await hiveSalesChannel.checkEnable(false);
      await hiveSalesChannel.clearPackage();
      await hiveSalesChannel.selectPackage(conf.caseConf.package);
      await hiveSalesChannel.checkApprove(true);
      await hiveSalesChannel.saveSaleChannel();
    });
    await test.step(`Đăng nhập vào Dasboard với user đang sử dụng gói khác và truy cập theo đường dẫn
    Marketing & Sales > Sales channels`, async () => {
      const saleChannels = await new MarketingAndSales(dashboard, conf.caseConf.domain);
      await saleChannels.gotoMenuMarketingAndSales();
      await expect(
        dashboard.locator(
          `//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//parent::div//parent::div//parent::a`,
        ),
      ).not.toBeVisible();
      await dashboard.click(`//p[text()="${conf.caseConf.domain}"]`);
      await dashboard.click(logOut);
      await dashboard.waitForSelector(logInTitle);
    });
    await test.step(`Đăng nhập vào Dasboard với user đang sử dụng đúng gói và truy cập theo đường dẫn
    Marketing & Sales > Sales channels`, async () => {
      await dashboards.login({
        email: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      const saleChannel = await new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await saleChannel.gotoMenuMarketingAndSales();
      await dashboard.waitForSelector(`//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]`);
      await expect(
        dashboard.locator(
          `//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//parent::div//parent::div//parent::a`,
        ),
      ).not.toHaveClass(/channel-disabled/);
      const sDescription = await dashboard
        .locator(`(//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//following-sibling::p)[1]`)
        .textContent();
      expect(sDescription).toBe(shortDescription);
    });
    await test.step(`Click vào Sale channel vừa chỉnh sửa`, async () => {
      await dashboard.click(`//a/div/div/p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]`);
      await dashboard.waitForSelector(actualDescription);
      await expect(dashboard.locator(actualDescription)).toContainText(description);
    });
  });

  test(`Check hiển thị Sale channels theo package/platform khi chỉ chọn Enable, không nhập User IDs trên Hive
  @SB_MAR_SALES_SC_CUS_TRACK_IDENTIFY_6`, async ({ hiveSBase, dashboard, conf }) => {
    const dashboards = await new DashboardPage(dashboard, conf.caseConf.domain);

    await test.step(`Đăng nhập Hive, truy cập theo đường dẫn Sales Channel > Sales Channel`, async () => {
      const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSB.goToSalesChannelList();
    });
    await test.step(
      `Edit Sales Channel, chọn Package, setting Enable trong tab Info,` + ` không nhập User IDs và lưu lại`,
      async () => {
        const hiveSalesChannel = await new HiveSalesChannel(hiveSBase, conf.suiteConf.hive_domain);
        await hiveSalesChannel.editSalesChannel(conf.caseConf.sales_channel_name);
        shortDescription = await hiveSBase.getAttribute(shortDescriptionField, "value");
        await hiveSalesChannel.checkEnable(true);
        await hiveSalesChannel.clearUserID();
        await hiveSalesChannel.clearPackage();
        await hiveSalesChannel.selectPackage(conf.caseConf.package);
        await hiveSalesChannel.checkApprove(false);
        await hiveSalesChannel.saveSaleChannel();
      },
    );
    await test.step(`Đăng nhập vào Dasboard với user đang sử dụng gói khác và truy cập theo đường dẫn
      Marketing & Sales > Sales channels`, async () => {
      const saleChannel = await new MarketingAndSales(dashboard, conf.caseConf.domain);
      await saleChannel.gotoMenuMarketingAndSales();
      await expect(
        dashboard.locator(
          `//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//parent::div//parent::div//parent::a`,
        ),
      ).not.toBeVisible();
      await dashboard.click(`//p[text()="${conf.caseConf.domain}"]`);
      await dashboard.click(logOut);
      await dashboard.waitForSelector(logInTitle);
    });
    await test.step(`Đăng nhập vào Dasboard với user đang sử dụng đúng gói và truy cập theo đường dẫn
    Marketing & Sales > Sales channels`, async () => {
      await dashboards.login({
        email: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      const saleChannel = await new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await saleChannel.gotoMenuMarketingAndSales();
      await dashboard.waitForSelector(`//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]`);
      await expect(
        dashboard.locator(
          `//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//parent::div//parent::div//parent::a`,
        ),
      ).toHaveClass(/channel-disabled/);
      const sDescription = await dashboard
        .locator(`(//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//following-sibling::p)[1]`)
        .textContent();
      expect(sDescription).toBe(shortDescription);
      await expect(
        dashboard.locator(`//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//parent::div`),
      ).toContainText(conf.caseConf.sales_channel_status);
    });
  });

  test(`Check hiển thị Sale channels theo package/platform khi chỉ chọn Enable, có nhập User IDs trên Hive
  @SB_MAR_SALES_SC_CUS_TRACK_IDENTIFY_7`, async ({ hiveSBase, dashboard, conf }) => {
    const dashboards = await new DashboardPage(dashboard, conf.caseConf.domain);

    await test.step(`Đăng nhập Hive, truy cập theo đường dẫn Sales Channel > Sales Channel`, async () => {
      const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSB.goToSalesChannelList();
    });
    await test.step(
      `Edit Sales Channel, chọn Package, setting Enable trong tab Info, ` + `nhập User IDs và lưu lại`,
      async () => {
        const hiveSalesChannel = await new HiveSalesChannel(hiveSBase, conf.suiteConf.hive_domain);
        await hiveSalesChannel.editSalesChannel(conf.caseConf.sales_channel_name);
        shortDescription = await hiveSBase.getAttribute(shortDescriptionField, "value");
        description = await hiveSBase.getAttribute(fullDescription, "value");
        await hiveSalesChannel.checkEnable(true);
        await hiveSalesChannel.fillUserIDs(conf.caseConf.user_id);
        await hiveSalesChannel.clearPackage();
        await hiveSalesChannel.selectPackage(conf.caseConf.package);
        await hiveSalesChannel.checkApprove(false);
        await hiveSalesChannel.saveSaleChannel();
      },
    );
    await test.step(`Đăng nhập vào Dasboard với user đã nhập ID và đang sử dụng gói khác, truy cập theo đường dẫn
      Marketing & Sales > Sales channels`, async () => {
      const saleChannel = await new MarketingAndSales(dashboard, conf.caseConf.domain);
      await saleChannel.gotoMenuMarketingAndSales();
      await expect(
        dashboard.locator(
          `//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//parent::div//parent::div//parent::a`,
        ),
      ).not.toBeVisible();
      await dashboard.click(`//p[text()="${conf.caseConf.domain}"]`);
      await dashboard.click(logOut);
      await dashboard.waitForSelector(logInTitle);
    });
    await test.step(`Đăng nhập vào Dasboard với user đã nhập ID và đang sử dụng đúng gói, truy cập theo đường dẫn
    Marketing & Sales > Sales channels`, async () => {
      await dashboards.login({
        email: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      const saleChannel = await new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await saleChannel.gotoMenuMarketingAndSales();
      await dashboard.waitForSelector(`//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]`);
      await expect(
        dashboard.locator(
          `//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//parent::div//parent::div//parent::a`,
        ),
      ).not.toHaveClass(/channel-disabled/);
      const sDescription = await dashboard
        .locator(`(//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//following-sibling::p)[1]`)
        .textContent();
      expect(sDescription).toBe(shortDescription);
    });
    await test.step(`Click vào Sale channel vừa chỉnh sửa`, async () => {
      await dashboard.click(`//a/div/div/p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]`);
      await dashboard.waitForSelector(actualDescription);
      await expect(dashboard.locator(actualDescription)).toContainText(description);
    });
  });

  test(`Check hiển thị Sale channels theo package/platform khi không chọn Approve và không chọn Enable trên Hive
  @SB_MAR_SALES_SC_CUS_TRACK_IDENTIFY_8`, async ({ hiveSBase, dashboard, conf }) => {
    await test.step(`Đăng nhập Hive, truy cập theo đường dẫn Sales Channel > Sales Channel`, async () => {
      const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSB.goToSalesChannelList();
    });
    await test.step(
      `Edit Sales Channel, chọn Package, ` + `không chọn Approve và Enable trong tab Info và lưu lại`,
      async () => {
        const hiveSalesChannel = await new HiveSalesChannel(hiveSBase, conf.suiteConf.hive_domain);
        await hiveSalesChannel.editSalesChannel(conf.caseConf.sales_channel_name);
        await hiveSalesChannel.checkEnable(false);
        await hiveSalesChannel.clearUserID();
        await hiveSalesChannel.clearPackage();
        await hiveSalesChannel.selectPackage(conf.caseConf.package);
        await hiveSalesChannel.checkApprove(false);
        await hiveSalesChannel.saveSaleChannel();
      },
    );
    await test.step(`Đăng nhập vào Dasboard với user đang sử dụng đúng gói, truy cập theo đường dẫn
    Marketing & Sales > Sales channels`, async () => {
      const saleChannel = await new MarketingAndSales(dashboard, conf.suiteConf.domain);
      await saleChannel.gotoMenuMarketingAndSales();
      await expect(
        dashboard.locator(
          `//p[text()[normalize-space()="${conf.caseConf.sales_channel_name}"]]//parent::div//parent::div//parent::a`,
        ),
      ).not.toBeVisible();
    });
  });
});
