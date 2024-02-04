import { expect, test } from "@core/fixtures";
import { SettingPage } from "@pages/shopbase_creator/dashboard/settings/settings";

test.describe(`Verify setting for shop Creator`, async () => {
  let settingPage: SettingPage;
  test.beforeEach(async ({ dashboard, conf }) => {
    settingPage = new SettingPage(dashboard, conf.suiteConf.domain);
  });

  test(`Verify các section trong setting @SB_SC_SCS_2`, async ({ conf }) => {
    await test.step(`Verify thông tin section name, description, url của các section trong Settings page`, async () => {
      await settingPage.waitUtilNotificationIconAppear();
      await settingPage.navigateToMenu("Settings");
      const getSectionInfo = await settingPage.getSectionInfoOnSecttingPage();
      expect(getSectionInfo).toEqual(conf.caseConf.sections);
    });
    await test.step(`Mở 1 url của 1 module tồn tại trong shop creator -> Verify error message hiển thị`, async () => {
      await settingPage.goto(`${conf.caseConf.domain}/${conf.caseConf.session_not_exist}`);
      const page404Locator = settingPage.genLoc(settingPage.xpathPage404);
      await page404Locator.isVisible();
    });
  });
});
