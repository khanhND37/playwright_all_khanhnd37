import { expect, test } from "@core/fixtures";
import { ListingPage } from "@pages/dashboard/partner_dashboard";

/**
 * Code name: `TC_SB_MP_ML_34`
 * Description: Test case này để tạo listing thành công, search được listing vừa tạo và preview listing đó
 * Test case `TC_SB_MP_ML_34`:
      - Steps:
        - Login partner dashboard
        - Truy cập trang Create Listing
        - Điền thông tin vào các trường
        - Click Save changes và verify message tạo listing thành công
        - Quay về trang listing list và thực hiện search thành công listing vừa tạo
       */
test.describe("Create listing successfully @TS_SB_MP_ML", async () => {
  const verifyTitleNewTab = async ({ page, context, titleSelector, titleExpect }) => {
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      await page.locator(`//div[normalize-space()='Preview listing']`).click(),
    ]);
    await newPage.waitForLoadState("networkidle");
    await expect(await newPage.innerText(titleSelector)).toEqual(titleExpect);
    await newPage.close();
  };
  test("Create listing successfully @TC_SB_MP_ML_34", async ({ page, conf, context }) => {
    const listingPage = new ListingPage(page, conf.suiteConf.domain);
    await test.step("Login to the accounts page", async () => {
      const email = conf.suiteConf.username;
      const password = conf.suiteConf.password;
      await listingPage.goToSignInPage({ email: email, password: password });
    });

    //Go to listing list page
    await test.step("go to listing page partner dashboard", async () => {
      await listingPage.goToListingsPage(page);
    });

    //Go to create listing page
    await test.step("go to create listing page", async () => {
      await listingPage.goToCreateListingPage(page);
    });

    //Fill info listing and verify create listing successfully
    await test.step("fill info listing", async () => {
      await listingPage.fillInforListing(page, conf.caseConf.listing_data);
    });

    //Search successfully
    await test.step("search successfully", async () => {
      await listingPage.fillListingNameIntoSearchBar(page);
      const title = listingPage.listingName;
      await expect(page.locator(`//tbody//tr//td//span[normalize-space()="${title}"]`)).toBeVisible();
    });

    //Preview listing
    await test.step("Preview listing", async () => {
      const title = listingPage.listingName;
      await page.locator(`//tbody//td//span[normalize-space()="${title}"]`).click();
      page.waitForLoadState();
      await verifyTitleNewTab({
        page,
        context,
        linkSelector: `//div[normalize-space()='Preview listing`,
        titleSelector: `//div[contains(@class,'listing-detail')]//*[normalize-space()='${title}']`,
        titleExpect: title,
      });
    });
  });
});
