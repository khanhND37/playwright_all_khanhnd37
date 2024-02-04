import { HiveOnboard } from "@pages/hive/hive_onboarding";
import { expect, test } from "@core/fixtures";

test.describe("Verify feature onboarding homepage ", () => {
  let hiveOnboard: HiveOnboard;
  test.afterEach(async ({ cConf }) => {
    // Delete onboarding
    await hiveOnboard.navigateOnboard();
    const isContainDataEdit = "data_edit" in cConf;
    if (isContainDataEdit) {
      await hiveOnboard.clickActionByName(cConf.data_edit.name, "Delete");
    } else {
      await hiveOnboard.clickActionByName(cConf.data_create_onboarding.name, "Delete");
    }
    await hiveOnboard.clickBtnConfirm(cConf.btn_confirm);
    await expect(hiveOnboard.genLoc(hiveOnboard.xpathMessageSuccess)).toBeVisible();
  });

  test("Verify khi thực hiện update|create onboard thành công @SB_HSB_OB_OHP_4", async ({ conf, hiveSBase }) => {
    hiveOnboard = new HiveOnboard(hiveSBase, conf.suiteConf.hive_domain);
    const dataCreateOnboarding = conf.caseConf.data_create_onboarding;
    await test.step("Create onboarding data > click btn Create", async () => {
      await hiveOnboard.navigateOnboard();
      await hiveOnboard.genLoc(hiveOnboard.xpathBtnAddNewOnboarding).click();
      await hiveOnboard.fillOnboardFormData(dataCreateOnboarding);
      await hiveOnboard.clickOnButton("Create and return to list");
      await expect(hiveOnboard.genLoc(hiveOnboard.xpathMessageSuccess)).toBeVisible();
      await hiveOnboard.filterOnboardingOnList(conf.caseConf.filter_option, dataCreateOnboarding.name);
      await expect(hiveOnboard.genLoc(hiveOnboard.xpathOnboardingNameOnList)).toHaveText(dataCreateOnboarding.name);
    });

    await test.step("Edit Onboarding vừa tạo > click btn Edit", async () => {
      await hiveOnboard.clickActionByName(dataCreateOnboarding.name, "Edit");
      await hiveOnboard.fillOnboardFormData(conf.caseConf.data_edit);
      await hiveOnboard.clickOnButton("Update and close");
      await expect(hiveOnboard.genLoc(hiveOnboard.xpathMessageSuccess)).toBeVisible();
    });
  });
});
