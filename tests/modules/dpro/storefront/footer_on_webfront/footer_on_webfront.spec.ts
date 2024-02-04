import { expect, test } from "@core/fixtures";
import { SFHome } from "@sf_pages/homepage";
import { MyProductPage } from "@pages/shopbase_creator/storefront/my_product";
import { SettingsAccountPage } from "@pages/shopbase_creator/dashboard/settings/account_page";

test.describe("Build footer on webfront for ShopBase Creator", () => {
  let storefront: SFHome;
  test.beforeEach(async ({ conf, page }) => {
    storefront = new SFHome(page, conf.suiteConf.domain);
  });

  test(`Verify thông tin footer trên các trang tại webfront @SB_DP_DPSF_LPS_6`, async ({ conf, page }) => {
    const yearAndShopName = "© 2022 • " + conf.suiteConf.shop_name;
    const contact = "• Contact us at " + conf.suiteConf.username;
    await test.step(`Verify footer tại màn All product`, async () => {
      await storefront.gotoAllCollection();
      const getFooterInfo = await storefront.getFooterInfo();
      expect(getFooterInfo).toEqual(
        expect.objectContaining({
          yearAndShopName: yearAndShopName,
          contact: contact,
          termsConditions: "Terms & Conditions",
          privacyPolicy: "Privacy Policy",
        }),
      );
    });

    await test.step(`Verify footer tại màn My product`, async () => {
      const myProductPage = new MyProductPage(page, conf.suiteConf.domain);
      await myProductPage.login(conf.suiteConf.username, conf.suiteConf.password);
      const getFooterInfo = await storefront.getFooterInfo();
      expect(getFooterInfo).toEqual(
        expect.objectContaining({
          yearAndShopName: yearAndShopName,
          contact: contact,
          termsConditions: "Terms & Conditions",
          privacyPolicy: "Privacy Policy",
        }),
      );
    });

    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const data = conf.caseConf.data[i];
      await test.step(`${data.description}`, async () => {
        await storefront.openMenu(data.button);
        const getFooterInfo = await storefront.getFooterInfo();
        expect(getFooterInfo).toEqual(
          expect.objectContaining({
            yearAndShopName: yearAndShopName,
            contact: contact,
            termsConditions: "Terms & Conditions",
            privacyPolicy: "Privacy Policy",
          }),
        );
      });
    }

    await test.step(`Verify footer tại màn resetPassword`, async () => {
      await storefront.openResetPasswordScreen(conf.caseConf.button_reset_password);
      const getFooterInfo = await storefront.getFooterInfo();
      expect(getFooterInfo).toEqual(
        expect.objectContaining({
          yearAndShopName: yearAndShopName,
          contact: contact,
          termsConditions: "Terms & Conditions",
          privacyPolicy: "Privacy Policy",
        }),
      );
    });
  });

  test(`Moblie_Verify UI footer cho các trang trên webfront của store ShopBase Creator @SB_DP_DPSF_LPS_8`, async ({
    conf,
    pageMobile,
  }) => {
    const storefront = new SFHome(pageMobile, conf.suiteConf.domain);
    const yearAndShopName = "© 2022 • " + conf.suiteConf.shop_name;
    const contact = "Contact us at " + conf.suiteConf.username;
    await test.step(`Verify footer tại màn All product`, async () => {
      await storefront.gotoAllCollection();
      const getFooterInfo = await storefront.getFooterInfo();
      expect(getFooterInfo).toEqual(
        expect.objectContaining({
          yearAndShopName: yearAndShopName,
          contact: contact,
          termsConditions: "Terms & Conditions",
          privacyPolicy: "Privacy Policy",
        }),
      );
    });

    await test.step(`Verify footer tại màn My product`, async () => {
      const myProductPage = new MyProductPage(pageMobile, conf.suiteConf.domain);
      await myProductPage.login(conf.suiteConf.username, conf.suiteConf.password);
      const getFooterInfo = await storefront.getFooterInfo();
      expect(getFooterInfo).toEqual(
        expect.objectContaining({
          yearAndShopName: yearAndShopName,
          contact: contact,
          termsConditions: "Terms & Conditions",
          privacyPolicy: "Privacy Policy",
        }),
      );
    });

    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const data = conf.caseConf.data[i];
      await test.step(`${data.description}`, async () => {
        await storefront.genLoc(storefront.xpathAvatarMobile).click();
        await storefront.openMenuOnMobile(data.button);
        const getFooterInfo = await storefront.getFooterInfo();
        expect(getFooterInfo).toEqual(
          expect.objectContaining({
            yearAndShopName: yearAndShopName,
            contact: contact,
            termsConditions: "Terms & Conditions",
            privacyPolicy: "Privacy Policy",
          }),
        );
      });
    }

    await test.step(`Verify footer tại màn resetPassword`, async () => {
      await storefront.openResetPasswordScreen(conf.caseConf.button_reset_password);
      const getFooterInfo = await storefront.getFooterInfo();
      expect(getFooterInfo).toEqual(
        expect.objectContaining({
          yearAndShopName: yearAndShopName,
          contact: contact,
          termsConditions: "Terms & Conditions",
          privacyPolicy: "Privacy Policy",
        }),
      );
    });
  });

  test(`Verify contact khi thay đổi email trong dashboard @SB_DP_DPSF_LPS_10`, async ({ conf, dashboard }) => {
    const settings = new SettingsAccountPage(dashboard, conf.suiteConf.domain);

    await test.step(`Edit email customer trong dashboard -> Verify contact của footer ngoài SF`, async () => {
      await settings.goto("/admin/settings/general");
      await settings.editCustomerEmail(conf.caseConf.email_edit);
      await storefront.page.waitForTimeout(30 * 1000);
      await storefront.gotoAllCollection();
      await storefront.page.reload();
      expect(await storefront.getContactOnFooter()).toEqual("• Contact us at " + conf.caseConf.email_edit);
    });

    await settings.goto("/admin/settings/general");
    await settings.editCustomerEmail(conf.caseConf.email);
  });

  test(`Verify thông tin khi click vào link Terms&Conditions và Privacy Policy @SB_DP_DPSF_LPS_11`, async ({
    conf,
  }) => {
    await test.step(
      "Login onshop -> Tại màn My product -> Click vào link link Terms&Conditions" + "Verify thông tin hiển thị",
      async () => {
        for (let i = 0; i < conf.caseConf.page.length; i++) {
          await storefront.gotoAllCollection();
          await storefront.openFooterPage(conf.caseConf.page[i]);
          expect(storefront.getPageUrl()).toEqual(`https://${conf.suiteConf.domain}/${conf.caseConf.page_validate[i]}`);
        }
      },
    );
  });
});
