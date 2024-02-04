import { expect, test } from "@core/fixtures";
import { HomePage } from "@pages/dashboard/home_page";
import { SettingPage } from "@pages/shopbase_creator/dashboard/settings/settings";

test.describe(`Tạo Coupon`, async () => {
  test(`Verify các setting khi tạo Coupon @SB_SC_SCS_1`, async ({ dashboard, token, conf }) => {
    const settingPage = new SettingPage(dashboard, conf.suiteConf.domain);
    const discountType = conf.caseConf.creator_discount_type;

    await test.step(`Merchant khi truy cập module Marketing & Sale > Coupon
    -> click button Create Coupon-> Verify list Coupon Type `, async () => {
      await settingPage.navigateToMenu("Marketing & Sales");
      await settingPage.genLoc(settingPage.xpathBtnCreateCoupon).click();
      await expect(settingPage.genLoc("//span[normalize-space()='Specific collections']")).toBeHidden();
      expect((await settingPage.genLoc(settingPage.xpathCouponPercentage).innerText()).trim()).toEqual(
        discountType.percentage,
      );
      expect((await settingPage.genLoc(settingPage.xpathCouponFixedAmount).innerText()).trim()).toEqual(
        discountType.fixed_amount,
      );
    });

    await test.step(`Mở shop loại khác Creator: Merchant khi truy cập module Discounts
    -> click button Create discount -> click Coupon Type`, async () => {
      const caseConf = conf.caseConf;
      for (const shopData of caseConf.shop_data) {
        const homePage = new HomePage(dashboard, shopData.domain);
        const accessToken = (
          await token.getWithCredentials({
            domain: shopData.shop_name,
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          })
        ).access_token;
        await homePage.loginWithToken(accessToken);
        await settingPage.navigateToMenu("Marketing & Sales");
        await settingPage.navigateToMenu("Discounts");
        await settingPage
          .genLoc("//div[contains(@class,'discount-action-bar')]//span[normalize-space()='Create discount']")
          .click();
        await expect(settingPage.genLoc("//span[normalize-space()='Specific collections']")).toBeVisible();
        for (let i = 0; i < caseConf.discount_type.length; i++) {
          expect(
            (await settingPage.genLoc(`(//div[contains(@class,'s-select')]//option)[${i + 1}]`).innerText()).trim(),
          ).toEqual(caseConf.discount_type[i]);
        }
      }
    });
  });
});
