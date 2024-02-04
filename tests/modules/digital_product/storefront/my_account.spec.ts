import { expect, test } from "@core/fixtures";
import { MyAccountPage } from "@pages/shopbase_creator/storefront/my_accounts";

test.describe("Verify buyer sign in My product screen @SB_DP_SF_SP", async () => {
  let myAccount: MyAccountPage;
  test.beforeEach(async ({ conf, page }) => {
    myAccount = new MyAccountPage(page, conf.suiteConf.domain);
    await myAccount.login(conf.suiteConf.username, conf.suiteConf.password);
    await expect(myAccount.genLoc(myAccount.xpathMessage)).toBeHidden();
  });

  test(`Verify luồng Edit profile @SB_DP_SF_SP_6`, async ({ conf }) => {
    await test.step("Click avatar > chọn My profile", async () => {
      await myAccount.genLoc(myAccount.xpathAvatar).click();
      await myAccount.openMenuItemPage(conf.caseConf.menu_item);
      await expect(myAccount.genLoc(myAccount.xpathEditAvatar)).toHaveText("Edit avatar");
      await expect(myAccount.genLoc(`(${myAccount.xpathProfile})[1]`)).toHaveText("First name");
      await expect(myAccount.genLoc(`(${myAccount.xpathProfile})[2]`)).toHaveText("Last name");
      await expect(myAccount.genLoc(`(${myAccount.xpathProfile})[3]`)).toHaveText("Email address");
      await expect(myAccount.genLoc(myAccount.xpathBtnSaveChange)).toBeDisabled();
    });

    await test.step("Nhập trường Email -> Verify thông tin", async () => {
      await expect(myAccount.genLoc(myAccount.xpathInputProfileEmail)).toBeDisabled();
    });

    await test.step("Nhập các trường: first, last name, upload image", async () => {
      for (let i = 0; i < conf.caseConf.data.length; i++) {
        const data = conf.caseConf.data[i];
        await myAccount.inputProfile(data.first_name, data.last_name, data.file_path);
        const btnSaveChange = await myAccount.genLoc(myAccount.xpathBtnSaveChange).isEnabled();
        if (btnSaveChange) {
          await myAccount.genLoc(myAccount.xpathBtnSaveChange).click();
          await expect(myAccount.genLoc(myAccount.xpathMessage)).toHaveText(data.message);
          await expect(myAccount.genLoc(myAccount.xpathMessage)).toBeHidden();
          const userName = await myAccount.genLoc(myAccount.xpathUsername).innerText();
          expect(userName).toEqual(`${data.first_name} ${data.last_name}`);
        } else {
          await expect(myAccount.genLoc(myAccount.xpathMessage)).toHaveText(data.message);
          await expect(myAccount.genLoc(myAccount.xpathMessage)).toBeHidden();
        }
      }
    });
  });
});
