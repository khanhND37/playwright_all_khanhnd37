import { expect, test } from "@core/fixtures";
import { AccountPage } from "@pages/dashboard/accounts";
import { CreatorPage } from "@pages/dashboard/creator";
import { SettingPage } from "@pages/shopbase_creator/dashboard/settings/settings";
import { SettingsAccountPage } from "@pages/shopbase_creator/dashboard/settings/account_page";
import { HivePage } from "@pages/hive/core";
import { HiveStorefrontTool } from "@pages/hive/hive_storefront_tool";
import { HiveBilling } from "@pages/hive/hive_billing";
import { ConfirmPlanPage } from "@pages/dashboard/package";

test.describe(`Choose package for shop Creator`, async () => {
  let settingsPackage: SettingsAccountPage;
  let settingPage: SettingPage;
  let hiveSFTool: HiveStorefrontTool;
  let hiveBilling: HiveBilling;
  let confirmPlanPage: ConfirmPlanPage;
  test.beforeEach(async ({ hiveSBase, conf, account }) => {
    const hivePage = new HivePage(hiveSBase, conf.suiteConf.hive_domain);
    const accountPage = new AccountPage(account, conf.suiteConf.domain);
    const creatorPage = new CreatorPage(account, conf.suiteConf.domain);
    hiveSFTool = new HiveStorefrontTool(hiveSBase, conf.suiteConf.hive_domain);
    hiveBilling = new HiveBilling(hiveSBase, conf.suiteConf.hive_domain);
    settingPage = new SettingPage(account, conf.suiteConf.domain);
    settingsPackage = new SettingsAccountPage(account, conf.suiteConf.domain);
    confirmPlanPage = new ConfirmPlanPage(account, conf.suiteConf.domain);

    // thực hiện clear shop
    await hiveSFTool.clearShopDataInHive(conf.suiteConf.shop_id);
    expect(await hivePage.getFlashMessage()).toContain("Publish message success");
    await accountPage.page.waitForTimeout(conf.suiteConf.time_out);

    //Hoàn thành survey tạo shop
    await accountPage.selectShopByName(conf.suiteConf.shop_name);
    await accountPage.addYourContact(
      conf.suiteConf.onboarding_data.store_coutry,
      conf.suiteConf.onboarding_data.per_location,
      conf.suiteConf.onboarding_data.phone_number,
    );
    await creatorPage.createCreatorStore(account, conf.suiteConf.onboarding_data);
    await settingsPackage.waitUtilNotificationIconAppear();
    const shopDomain = await accountPage.genLoc(accountPage.xpathShopDomain).innerText();
    expect(shopDomain).toContain(conf.suiteConf.shop_name);
  });

  test(`Verify setting comming soon trong Package setting @SB_SC_SBPKG_4`, async ({ hiveSBase, conf }) => {
    await test.step(`Setting Coming soon cho 1 package -> Truy cập trang hive
      -> Mở trang package detail -> Click checkbox Comming soon -> Click Update button`, async () => {
      await hiveSBase.goto(`https://${conf.suiteConf.hive_domain}/admin/app/package/${conf.caseConf.package_id}/edit`);
      const statusIsComingSoon = await hiveBilling.getStatusPackageIsComingSoon();
      if (statusIsComingSoon === "icheckbox_square-blue") {
        await hiveBilling.changeStatusPackageComingSoon();
      }
    });

    await test.step(`Login dashboard -> Click Setting -> Chọn session Account -> Click button Upgrade plan -> Verify package bị disable`, async () => {
      await settingsPackage.page.reload();
      await settingsPackage.navigateToMenu("Settings");
      await settingPage.openSectionSetting("Account");
      await settingsPackage.clickOnBtnWithLabel("Upgrade plan");
      await expect(
        confirmPlanPage.getLocatorBlockPackageComingSoon(conf.caseConf.activation_info.package_name),
      ).toBeVisible();
    });

    await test.step(`Vào lại trang hive, click checkbox Coming soon để off -> Quay lại dashboard -> Reload trang Pricing -> Verify package được disable Coming soon`, async () => {
      await hiveBilling.changeStatusPackageComingSoon();
      await settingsPackage.page.reload();
      await expect(
        confirmPlanPage.getLocatorBlockPackageComingSoon(conf.caseConf.activation_info.package_name),
      ).toBeHidden();
      await expect(
        confirmPlanPage.getLocatorBlockPackageEnable(conf.caseConf.activation_info.package_name),
      ).toBeVisible();
    });

    await test.step(`Thực hiện confirm plan package vừa được enable: Click vào button Choose this plan của 1 package`, async () => {
      await confirmPlanPage.chooseThisPlanPackage(conf.caseConf.activation_info);
      await settingsPackage.clickOnBtnWithLabel("Start plan");
      expect(await settingsPackage.page.innerText(settingPage.xpathToastMessage)).toContain("Confirm plan successfull");
    });
  });

  test(`Confirm plan khi shop đang trong free trial @SB_SC_SBPKG_2`, async ({ conf }) => {
    await test.step(`Click vào menu Setting > Chọn session Account > Click button Upgrade plan > kiểm tra hiển thị trang select package`, async () => {
      await settingsPackage.navigateToMenu("Settings");
      await settingPage.openSectionSetting("Account");
      await settingsPackage.clickOnBtnWithLabel("Upgrade plan");
      expect(await confirmPlanPage.isDBPageDisplay("Pick a plan for your store")).toBeTruthy();
    });

    await test.step(`Thực hiện confirm plan: Click vào button Choose this plan của 1 package`, async () => {
      await confirmPlanPage.chooseThisPlanPackage(conf.caseConf.activation_info);
      await settingsPackage.clickOnBtnWithLabel("Start plan");
      expect(await settingsPackage.page.innerText(settingPage.xpathToastMessage)).toContain("Confirm plan successfull");
    });

    await test.step(`Đi đến trang Setting >> Billings -> kiểm tra hiển thị Bill mới được tạo`, async () => {
      await settingsPackage.goto(`admin/settings/billing`);
      await expect(settingsPackage.genLoc(settingsPackage.xpathBill)).toBeHidden();
    });
  });

  test(`Upgrade / Downgrade khi shop đang có 1 package @SB_SC_SBPKG_1`, async ({ conf }) => {
    await test.step(`Click vào Setting menu > click chọn session Account`, async () => {
      await settingsPackage.navigateToMenu("Settings");
      await settingPage.openSectionSetting("Account");
      expect(await settingsPackage.isDBPageDisplay("Account")).toBeTruthy();
      expect(settingsPackage.page.url()).toContain(`${conf.suiteConf.domain}/admin/settings/account`);
    });

    await test.step(`Thực hiện confirm plan -> Mở trang Choose package -> Click vào button Choose this plan của 1 package ->Click button Confirm plan`, async () => {
      await settingsPackage.clickOnBtnWithLabel("Upgrade plan");
      await confirmPlanPage.chooseThisPlanPackage(conf.caseConf.activation_info);
      await settingsPackage.clickOnBtnWithLabel("Start plan");
      expect(await settingsPackage.page.innerText(settingPage.xpathToastMessage)).toContain("Confirm plan successfull");
    });

    await test.step(`Click btn Upgrade plan -> Click vào button Choose this plan của 1 package khác -> Click button Confirm plan`, async () => {
      await settingsPackage.waitUntilElementInvisible(settingPage.xpathToastMessage);
      await settingsPackage.navigateToMenu("Settings");
      await settingPage.openSectionSetting("Account");
      await settingsPackage.clickOnBtnWithLabel("Upgrade plan");
      await confirmPlanPage.chooseThisPlanPackage(conf.caseConf.activation_info_upgrade);
      await settingsPackage.clickOnBtnWithLabel("Confirm changes");
      expect(await settingsPackage.page.innerText(settingPage.xpathToastMessage)).toContain("Confirm plan successfull");
    });
  });
});
