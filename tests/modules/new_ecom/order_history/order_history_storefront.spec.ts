import { expect, test } from "@core/fixtures";
import { SignInStorefrontInfo } from "./order_history_storefront";
import { xpathPagination } from "../storefront/pages/collection_detail/collection-util";
import { SingInSignOut as SignInSignOut } from "@pages/storefront/sign_in_sign_out";

test.describe("Verify luồng order history theme NE", async () => {
  let domain: string;
  let myAccount: SignInSignOut;
  let accSignInStorefrontInfo1, accSignInStorefrontInfo2: SignInStorefrontInfo;

  test.beforeEach(async ({ conf }) => {
    domain = conf.suiteConf.domain;
    accSignInStorefrontInfo1 = {
      domain: domain,
      email: conf.caseConf.data_login_no_order.email,
      password: conf.caseConf.data_login_no_order.password,
    };
    accSignInStorefrontInfo2 = {
      domain: domain,
      email: conf.caseConf.data_login_has_orders.email,
      password: conf.caseConf.data_login_has_orders.password,
    };
  });
  test(`@SB_NEWECOM_OH_3 Kiểm tra mục order history hiển thị rỗng, phân trang`, async ({ page }) => {
    myAccount = new SignInSignOut(page, domain);

    await test.step("Login storefront with account which has no order to verify order history", async () => {
      await myAccount.loginWithPassword(accSignInStorefrontInfo1.email, accSignInStorefrontInfo1.password);
      await myAccount.goToMyProfile();
      await myAccount.goToOrderHistory();
      // Check that there are no orders displayed in the order history
      await myAccount.page.waitForSelector(myAccount.xpathOrderHistoryGrid);
      await myAccount.page.waitForLoadState("domcontentloaded");
      expect(await myAccount.checkLocatorVisible(myAccount.xpathNoOrderInOrderHistoryText)).toBe(true);
    });

    await test.step("Logout storefront to login another account", async () => {
      await myAccount.genLoc(myAccount.xpathIconAvatar).click();
      await myAccount.clickMenuItemAtAvtIcon("Log out");
      await expect(myAccount.genLoc(myAccount.xpathSignInPage)).toBeVisible();
    });

    await test.step(`Login storefront with account which has lots of orders to verify order history, check:
    - Display pagination
    - First and middle page have 10 orders in one page
    - At first page, icon back is disabled
    - At middle page, icon back and next are enabled
    - At final page, icon next is disabled
    - Can switch pages by pagination`, async () => {
      await myAccount.loginWithPassword(accSignInStorefrontInfo2.email, accSignInStorefrontInfo2.password);
      await myAccount.goToMyProfile();
      await myAccount.goToOrderHistory();
      // Check that there are orders displayed in the order history
      await myAccount.page.waitForSelector(myAccount.xpathOrderHistoryGrid);
      await myAccount.page.waitForLoadState("domcontentloaded");
      expect(await myAccount.checkLocatorVisible(myAccount.xpathHaveOrderInOrderHistory)).toBe(true);
      // Check that displayed pagination
      await expect(myAccount.genLoc(xpathPagination)).toBeVisible();
      // count number of order in chosing page from pagination
      expect(await myAccount.countOrdersInOrderHistoryPage(1)).toBe(10);
      expect(await myAccount.countOrdersInOrderHistoryPage(2)).toBe(10);
      expect(await myAccount.countOrdersInOrderHistoryPage(3)).not.toBe(10);
    });
  });
});
