import { expect, test } from "@core/fixtures";
import { ListingPage } from "@pages/dashboard/partner_dashboard";

/**
 * Code name: `TC_SB_MP_ML_5`
 * Description: Test case này để verify trang listing list
 * Test case `TC_SB_MP_ML_34`:
      - Steps:
        - Login partner dashboard
        - Truy cập trang Listing list
        - Verify các cột thông tin của 1 listing
       */
test.describe("Verify listing list page @SB_MP_ML", () => {
  //Pre-condition : Login to Partner Dashboard - Open Listing list page
  test.beforeEach(async ({ page, conf }) => {
    const listingPage = new ListingPage(page, conf.suiteConf.domain);
    await test.step("Login to the accounts page", async () => {
      await listingPage.goToSignInPage({
        email: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
    });
    await test.step("go to listing page partner dashboard", async () => {
      await listingPage.goToListingsPage(page);
    });
  });

  test("Verify hiển thị các cột của listing trong trang manage listing @TC_SB_MP_ML_5", async ({ page }) => {
    await expect(page.locator(`//table//span[normalize-space()="Listing"]`)).toBeVisible();
    await expect(page.locator(`//table//span[normalize-space()="Status"]`)).toBeVisible();
    await expect(page.locator(`//table//span[normalize-space()="Category"]`)).toBeVisible();
    await expect(page.locator(`//table//span[normalize-space()="Created at"]`)).toBeVisible();
    await expect(page.locator(`//table//span[normalize-space()="Views"]`)).toBeVisible();
    await expect(page.locator(`//table//span[normalize-space()="Leads"]`)).toBeVisible();
  });
});
