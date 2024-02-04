import { expect, test } from "@core/fixtures";
import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";
import { HiveFeatureSwitch } from "@pages/hive/hiveFeatureSwitch";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { DeliveryOrdersPage } from "@pages/odoo/delivery_orders";

test.describe("Check import tracking number @TS_SB_SBFF_IMP_TRK_TEMPL_PLB", async () => {
  let dataRecord: Array<string[]>;

  test(`Check trường hợp ngoài Feature Switch @SB_SBFF_IMP_TRK_TEMPL_PLB_8`, async ({ hiveSBase, conf, dashboard }) => {
    await test.step(`Setting feature switch disable cho user`, async () => {
      const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
      await hiveSB.goToFeatureSwitchList();
      const hiveFeature = new HiveFeatureSwitch(hiveSBase, conf.suiteConf.hive_domain);
      await hiveFeature.editFeatureSwitch(conf.suiteConf.feature_name);
      await hiveFeature.fillDisableUsers(conf.caseConf.user.id);
      await hiveFeature.clickUpdate();
    });
    await test.step(`Đi tới màn hình Fulfillment > PlusHub`, async () => {
      const toFulfillment = await new DashboardPage(dashboard, conf.caseConf.user.domain);
      await toFulfillment.login({
        email: conf.caseConf.user.username,
        password: conf.caseConf.user.password,
      });
      await toFulfillment.goToPlusHubFulfillment();
    });
    await test.step(`Check giao diện không có button import tracking`, async () => {
      await dashboard.waitForLoadState("domcontentloaded");
      await expect(dashboard.locator(`//button/span[text()[normalize-space()="Import tracking"]]`)).toHaveCount(0);
    });
  });

  test(`Check update thông tin tracking number, last mile, carrier @SB_SBFF_IMP_TRK_TEMPL_PLB_9`, async ({
    dashboard,
    conf,
    page,
  }) => {
    const fulfillment = new FulfillmentPage(dashboard, conf.suiteConf.domain);
    await test.step(`Đi tới màn hình Fulfillment > PlusHub`, async () => {
      const toFulfillment = new DashboardPage(dashboard, conf.suiteConf.domain);
      await toFulfillment.goToPlusHubFulfillment();
    });
    await test.step(`Import file thành công, có record update tracking number, last mile, carrier`, async () => {
      await fulfillment.importTracking(conf.caseConf.correct_file);
      await dashboard.waitForLoadState("domcontentloaded");
      await expect(dashboard.locator(`//div[text()[normalize-space()="${conf.caseConf.message}"]]`)).toBeVisible();
    });
    await test.step(`Login Odoo, Check record được update trong Delivery Orders`, async () => {
      const odoo = new DeliveryOrdersPage(page, conf.suiteConf.odoo_domain);
      await odoo.loginToOdoo(conf.suiteConf.odoo_account, conf.suiteConf.odoo_pass);
      await odoo.goToDeliveryOrders(conf.suiteConf.place);

      //check content
      dataRecord = await fulfillment.getContentOfRowInCSVFile(conf.caseConf.correct_file);
      await odoo.viewRecord(dataRecord[0][0]);
      const trackingNumber = await page.textContent(
        `//label[text()[normalize-space()="Tracking number"]]/parent::td/following-sibling::td`,
      );
      await expect(trackingNumber).toBe(dataRecord[0][1]);
      const lastMileTrackingNumber = await page.textContent(
        `//label[text()[normalize-space()="Last mile tracking number"]]/parent::td/following-sibling::td`,
      );
      await expect(lastMileTrackingNumber).toBe(dataRecord[0][2]);
      const trackingCarrier = await page.textContent(
        `//label[text()[normalize-space()="Tracking carrier"]]/parent::td/following-sibling::td`,
      );
      await expect(trackingCarrier).toBe(dataRecord[0][3]);
      const customerOrderNumber = await page.textContent(
        `//label[text()[normalize-space()="Customer order number"]]/parent::td/following-sibling::td`,
      );
      await expect(customerOrderNumber).toBe(dataRecord[0][4]);
      if (dataRecord[0][5] == "TRUE")
        await expect(
          page.locator(`//div[@name="x_is_delivered_us_warehouse"]/input[contains(@id, "checkbox-comp")]`),
        ).toBeChecked();
      else
        await expect(
          page.isChecked(`//div[@name="x_is_delivered_us_warehouse"]/input[contains(@id, "checkbox-comp")]`),
        ).toBeFalsy();

      // check log
      const mailUpdater = await page.textContent(`(//div[@class="o_Message_prettyBody"]/div/strong)[1]`);
      await expect(mailUpdater).toContain(conf.suiteConf.username);
      const trackingNumberLog = await page.textContent(`(//div[@class="o_Message_prettyBody"]/div/ul/li)[1]`);
      await expect(trackingNumberLog).toContain("Tracking number:");
      await expect(trackingNumberLog).toContain(`--> ${dataRecord[0][1]}`);
      const lastMileTrackingNumberLog = await page.textContent(`(//div[@class="o_Message_prettyBody"]/div/ul/li)[2]`);
      await expect(lastMileTrackingNumberLog).toContain("Last mile tracking number:");
      await expect(lastMileTrackingNumberLog).toContain(`--> ${dataRecord[0][2]}`);
      const trackingCarrierLog = await page.textContent(`(//div[@class="o_Message_prettyBody"]/div/ul/li)[3]`);
      await expect(trackingCarrierLog).toContain("Tracking carrier:");
      await expect(trackingCarrierLog).toContain(`--> ${dataRecord[0][3]}`);
      const customerOrderNumberLog = await page.textContent(`(//div[@class="o_Message_prettyBody"]/div/ul/li)[4]`);
      await expect(customerOrderNumberLog).toContain("Customer order number:");
      await expect(customerOrderNumberLog).toContain(`--> ${dataRecord[0][4]}`);
      const trackingDeliveryLog = await page.textContent(`(//div[@class="o_Message_prettyBody"]/div/ul/li)[5]`);
      await expect(trackingDeliveryLog).toContain("Tracking is delivered US Warehouse:");
      expect(trackingDeliveryLog).toContain(`--> ${dataRecord[0][5].toLowerCase()}`);
    });
  });

  test(
    "Không import được với format CSV đúng nhưng số lượng record lớn hơn 20.000 " + "@SB_SBFF_IMP_TRK_TEMPL_PLB_5",
    async ({ dashboard, conf, page }) => {
      const fulfillment = new FulfillmentPage(dashboard, conf.suiteConf.domain);
      await test.step("Đi tới màn hình Fulfillment > PlusHub", async () => {
        const toFulfillment = new DashboardPage(dashboard, conf.suiteConf.domain);
        await toFulfillment.goToPlusHubFulfillment();
      });
      await test.step(`Import file lớn hơn 20.000 records`, async () => {
        await fulfillment.importTracking(conf.caseConf.over_records_file);
        await dashboard.waitForLoadState("domcontentloaded");
      });
      await test.step(`Check hệ thống xử lý file lỗi`, async () => {
        await expect(dashboard.locator(`//div[text()[normalize-space()="${conf.caseConf.message}"]]`)).toBeVisible();
        const odoo = new DeliveryOrdersPage(page, conf.suiteConf.odoo_domain);
        await odoo.loginToOdoo(conf.suiteConf.odoo_account, conf.suiteConf.odoo_pass);
        await odoo.goToDeliveryOrders(conf.suiteConf.place);
        dataRecord = await fulfillment.getContentOfRowInCSVFile(conf.caseConf.over_records_file);
        await odoo.viewRecord(dataRecord[0][0]);
        const trackingNumber = await page.textContent(
          `//label[text()[normalize-space()="Tracking number"]]/parent::td/following-sibling::td`,
        );
        await expect(trackingNumber).not.toBe(dataRecord[0][1]);
        const lastMileTrackingNumber = await page.textContent(
          `//label[text()[normalize-space()="Last mile tracking number"]]/parent::td/following-sibling::td`,
        );
        await expect(lastMileTrackingNumber).not.toBe(dataRecord[0][2]);
        const trackingCarrier = await page.textContent(
          `//label[text()[normalize-space()="Tracking carrier"]]/parent::td/following-sibling::td`,
        );
        await expect(trackingCarrier).not.toBe(dataRecord[0][3]);
        const customerOrderNumber = await page.textContent(
          `//label[text()[normalize-space()="Customer order number"]]/parent::td/following-sibling::td`,
        );
        await expect(customerOrderNumber).not.toBe(dataRecord[0][4]);
      });
    },
  );

  test(`Import không thành công với format CSV bị sai do thừa cột trên header @SB_SBFF_IMP_TRK_TEMPL_PLB_1`, async ({
    dashboard,
    conf,
    page,
  }) => {
    const fulfillment = new FulfillmentPage(dashboard, conf.suiteConf.domain);
    await test.step(`Đi tới màn hình Fulfillment > PlusHub`, async () => {
      const toFulfillment = new DashboardPage(dashboard, conf.suiteConf.domain);
      await toFulfillment.goToPlusHubFulfillment();
    });
    await test.step(`Import file bị thừa cột như đã chuẩn bị`, async () => {
      await fulfillment.importTracking(conf.caseConf.redundant_header_file);
      await dashboard.waitForLoadState("domcontentloaded");
    });
    await test.step(`Check hệ thống xử lý`, async () => {
      await expect(dashboard.locator(`//div[text()[normalize-space()="${conf.caseConf.message}"]]`)).toBeVisible();
      const odoo = new DeliveryOrdersPage(page, conf.suiteConf.odoo_domain);
      await odoo.loginToOdoo(conf.suiteConf.odoo_account, conf.suiteConf.odoo_pass);
      await odoo.goToDeliveryOrders(conf.suiteConf.place);
      dataRecord = await fulfillment.getContentOfRowInCSVFile(conf.caseConf.redundant_header_file);
      await odoo.viewRecord(dataRecord[0][0]);
      const trackingNumber = await page.textContent(
        `//label[text()[normalize-space()="Tracking number"]]/parent::td/following-sibling::td`,
      );
      await expect(trackingNumber).not.toBe(dataRecord[0][1]);
      const lastMileTrackingNumber = await page.textContent(
        `//label[text()[normalize-space()="Last mile tracking number"]]/parent::td/following-sibling::td`,
      );
      await expect(lastMileTrackingNumber).not.toBe(dataRecord[0][2]);
      const trackingCarrier = await page.textContent(
        `//label[text()[normalize-space()="Tracking carrier"]]/parent::td/following-sibling::td`,
      );
      await expect(trackingCarrier).not.toBe(dataRecord[0][3]);
      const customerOrderNumber = await page.textContent(
        `//label[text()[normalize-space()="Customer order number"]]/parent::td/following-sibling::td`,
      );
      expect(customerOrderNumber).not.toBe(dataRecord[0][4]);
    });
  });

  test(
    `Import không thành công với format CSV bị sai do thừa cột dưới hàng value ` + `@SB_SBFF_IMP_TRK_TEMPL_PLB_3`,
    async ({ dashboard, conf, page }) => {
      const fulfillment = new FulfillmentPage(dashboard, conf.suiteConf.domain);
      await test.step(`Đi tới màn hình Fulfillment > PlusHub`, async () => {
        const toFulfillment = new DashboardPage(dashboard, conf.suiteConf.domain);
        await toFulfillment.goToPlusHubFulfillment();
      });
      await test.step(`Import file bị thừa cột như đã chuẩn bị`, async () => {
        await fulfillment.importTracking(conf.caseConf.redundant_value_file);
        await dashboard.waitForLoadState("domcontentloaded");
      });
      await test.step(`Check hệ thống xử lý`, async () => {
        await expect(dashboard.locator(`//div[text()[normalize-space()="${conf.caseConf.message}"]]`)).toBeVisible();
        const odoo = new DeliveryOrdersPage(page, conf.suiteConf.odoo_domain);
        await odoo.loginToOdoo(conf.suiteConf.odoo_account, conf.suiteConf.odoo_pass);
        await odoo.goToDeliveryOrders(conf.suiteConf.place);
        dataRecord = await fulfillment.getContentOfRowInCSVFile(conf.caseConf.redundant_value_file);
        await odoo.viewRecord(dataRecord[0][0]);
        const trackingNumber = await page.textContent(
          `//label[text()[normalize-space()="Tracking number"]]/parent::td/following-sibling::td`,
        );
        await expect(trackingNumber).not.toBe(dataRecord[0][1]);
        const lastMileTrackingNumber = await page.textContent(
          `//label[text()[normalize-space()="Last mile tracking number"]]/parent::td/following-sibling::td`,
        );
        await expect(lastMileTrackingNumber).not.toBe(dataRecord[0][2]);
        const trackingCarrier = await page.textContent(
          `//label[text()[normalize-space()="Tracking carrier"]]/parent::td/following-sibling::td`,
        );
        await expect(trackingCarrier).not.toBe(dataRecord[0][3]);
        const customerOrderNumber = await page.textContent(
          `//label[text()[normalize-space()="Customer order number"]]/parent::td/following-sibling::td`,
        );
        await expect(customerOrderNumber).not.toBe(dataRecord[0][4]);
      });
    },
  );

  test(`Check trường hợp trong fsw nhưng ngoài nhóm OPS @SB_SBFF_IMP_TRK_TEMPL_PLB_10`, async ({
    dashboard,
    conf,
    page,
  }) => {
    const fulfillment = new FulfillmentPage(dashboard, conf.caseConf.user.domain);
    await test.step(`Đi tới màn hình Fulfillment > PlusHub`, async () => {
      const toFulfillment = await new DashboardPage(dashboard, conf.caseConf.user.domain);
      await toFulfillment.login({
        email: conf.caseConf.user.username,
        password: conf.caseConf.user.password,
      });
      await toFulfillment.goToPlusHubFulfillment();
    });
    await test.step(`Import CSV file`, async () => {
      await fulfillment.importTracking(conf.caseConf.correct_file);
      await dashboard.waitForLoadState("domcontentloaded");
    });
    await test.step(`Check hệ thống xử lý`, async () => {
      await expect(dashboard.locator(`//div[text()[normalize-space()="${conf.caseConf.message}"]]`)).toBeVisible();
      const odoo = new DeliveryOrdersPage(page, conf.suiteConf.odoo_domain);
      await odoo.loginToOdoo(conf.suiteConf.odoo_account, conf.suiteConf.odoo_pass);
      await odoo.goToDeliveryOrders(conf.suiteConf.place);
      dataRecord = await fulfillment.getContentOfRowInCSVFile(conf.caseConf.correct_file);
      await odoo.viewRecord(dataRecord[0][0]);
      const trackingNumber = await page.textContent(
        `//label[text()[normalize-space()="Tracking number"]]/parent::td/following-sibling::td`,
      );
      await expect(trackingNumber).not.toBe(dataRecord[0][1]);
      const lastMileTrackingNumber = await page.textContent(
        `//label[text()[normalize-space()="Last mile tracking number"]]/parent::td/following-sibling::td`,
      );
      await expect(lastMileTrackingNumber).not.toBe(dataRecord[0][2]);
      const trackingCarrier = await page.textContent(
        `//label[text()[normalize-space()="Tracking carrier"]]/parent::td/following-sibling::td`,
      );
      await expect(trackingCarrier).not.toBe(dataRecord[0][3]);
      const customerOrderNumber = await page.textContent(
        `//label[text()[normalize-space()="Customer order number"]]/parent::td/following-sibling::td`,
      );
      await expect(customerOrderNumber).not.toBe(dataRecord[0][4]);
    });
  });
});
