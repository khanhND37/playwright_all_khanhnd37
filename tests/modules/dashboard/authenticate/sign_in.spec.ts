import { expect, test } from "@core/fixtures";
import { AccountPage } from "@pages/dashboard/accounts";
import { loadData } from "@core/conf/conf";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { ProductPage } from "@pages/dashboard/products";

test.describe.parallel("Sign in and verify @TS_SB_DASHBOARD_AUTHEN_01", () => {
  const signInType = "normal";
  const conf = loadData(__filename, signInType);
  conf.caseConf.data.forEach(({ email: email, password: password, status: status, testcaseId: id }) => {
    test(`Sign in and verify in normal case @${id}`, async ({ page }) => {
      const accountPage = new AccountPage(page, conf.suiteConf.domain);

      await test.step(`Sign in in normal case @${id}`, async () => {
        await accountPage.signInSecurity(email, password, true);
      });

      await test.step(`Verify sign in status "${status}"`, async () => {
        await expect(page.locator("(//*[normalize-space()='" + status + "'])[1]")).toBeEnabled();
      });
    });
  });
});

test.describe.serial("Sign in and verify @TS_SB_DASHBOARD_AUTHEN_02", () => {
  const signInType = "security";
  const conf = loadData(__filename, signInType);
  conf.caseConf.data.forEach(
    ({ remainingTime: time, email: email, password: password, status: status, testcaseId: id }) => {
      test(`Sign in and verify in case security invalid password remaining ${time} time(s) @${id}`, async ({
        page,
      }) => {
        const accountPage = new AccountPage(page, conf.suiteConf.domain);

        await test.step(`Sign in in case security @${id}`, async () => {
          await accountPage.signInSecurity(email, password, true);
        });

        await test.step(`Verify sign in status "${status}"`, async () => {
          await expect(page.locator("(//*[normalize-space()='" + status + "'])[1]")).toBeEnabled();
        });
      });
    },
  );
});

test.describe("Verify login dashboard thanh công", () => {
  test("@TC_SB_AU_LGD_6 Login thành công", async ({ dashboard, conf }) => {
    await test.step("Verify sign in success", async () => {
      const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
      await dashboardPage.waitUtilNotificationIconAppear();
      await expect(dashboard.locator("//header[contains(@class,'ui-dashboard__header ')]")).toBeVisible();
    });
  });
});

test.describe("Verify add product thành công", () => {
  test("@SB_PRO_TEST_346 [Add product] Add product thành công khi fill thông tin cho tất cả các trường", async ({
    dashboard,
    conf,
  }) => {
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const productInfo = conf.caseConf.product_info;

    await test.step("Create product và verify thông tin product trong dashboard :1. Tại màn [All products] >Click btn[Add product]2. Input title theo data:3.Click button Save changes", async () => {
      await productPage.navigateToMenu("Products");
      await productPage.addNewProductWithData(productInfo);
      await productPage.page.waitForTimeout(1000);
      await expect(await productPage.isToastMsgVisible("Product was created successfully!")).toBeTruthy();
    });
  });
});
