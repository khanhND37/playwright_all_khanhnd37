import { expect, test } from "@core/fixtures";
import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";

test.describe("Feature update package for Creator shop", async () => {
  test(`Verify setting comming soon trong Package setting @TC_SB_DP_DB_PAK_1`, async ({
    hiveSBase,
    dashboard,
    conf,
  }) => {
    const packageName = conf.caseConf.package_name;
    const settingHiveSbase = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);

    await test.step(`Setting Coming soon cho 1 package:
    - Truy cập trang hive
    - Mở trang package detail
    - Click checkbox Comming soon
    - Click Update button`, async () => {
      const hiveDomain = conf.suiteConf.hive_domain;
      await hiveSBase.goto(`https://${hiveDomain}/admin/app/package/80/edit`);
      await settingHiveSbase.changeStatusPackageComingSoon();
    });

    await test.step(`Login dashboard,
    - Click Setting
    - Chọn session Account
    - Click button Upgrade plan
    - Verify package bị disable`, async () => {
      await dashboard.goto(`https:${conf.suiteConf.domain}/admin/settings/account`);
      await dashboard.locator("//span[normalize-space()='Upgrade plan']").click();
      await expect(dashboard).toHaveURL("https://" + conf.suiteConf.domain + "/admin/pricing");
      await dashboard.reload();
      const comingSoon = await dashboard.getAttribute(
        `//div[child::div[@class='pricing-header']//child::div[normalize-space()='${packageName}']]`,
        "class",
      );
      expect(comingSoon).toEqual(conf.caseConf.class_coming_soon);
      await expect(
        dashboard.locator(`//div[@class='${comingSoon}']//child::div[normalize-space()='${packageName}']`),
      ).toBeVisible();
    });

    await test.step(`Vào lại trang hive, click checkbox Coming soon để off`, async () => {
      await settingHiveSbase.changeStatusPackageComingSoon();
    });

    await test.step(`Quay lại dashboard,
    - Reload trang Pricing
    - Verify package được enable`, async () => {
      await dashboard.reload();
      await expect(dashboard).toHaveURL("https://" + conf.suiteConf.domain + "/admin/pricing");
      const comingSoon = await dashboard.getAttribute(
        `//div[child::div[@class='pricing-header']//child::div[normalize-space()='${packageName}']]`,
        "class",
      );
      expect(comingSoon).toEqual(conf.caseConf.class_not_coming_soon);
      await expect(
        dashboard.locator(`//div[@class='${comingSoon}']//child::div[normalize-space()='${packageName}']`),
      ).toBeVisible();
    });
  });
});
