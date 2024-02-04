import { expect, test } from "@core/fixtures";
import { MKHome } from "@pages/shopbaseNetwork/homepage";
import type { Marketplace } from "@types";

test.describe("Verify homepage of shopbase network display @TC_SB_MP_HP_7", () => {
  test("Check hiển thị category ở ShopBase Network @TC_SB_MP_HP_7", async ({ page, conf }) => {
    const mkHome = new MKHome(page, conf.caseConf.domain);

    // open homepage
    await test.step("Open shopbase network", async () => {
      await mkHome.gotoShopBaseNetwork();
    });

    // verify collection display
    await test.step("verify collection display", async () => {
      await expect(page.locator(`//div[@class='carousel container market-place']`)).toBeVisible();
      await expect(page.locator(`//div//h1[normalize-space()='ShopBase Top Picks']`)).toBeVisible();
      await expect(
        page.locator(`//div[@class='carousel-wrapper']//button[@class='slick-arrow slick-prev']`),
      ).toBeVisible();
      await expect(
        page.locator(`//div[@class='carousel-wrapper']//button[@class='slick-arrow slick-next']`),
      ).toBeVisible();
    });

    //Verify số lượng listing hiển thị trong collection
    await test.step("verify total listing in collection display", async () => {
      const listing: Marketplace = await mkHome.getListing(conf.suiteConf.api, "Collection", "", conf.caseConf.limit);
      const totalListingDashboard = await page.locator("//div[@class='card-item']").count();

      //Verify số lượng listing hiển thị bằng với số lượng listing api trả về
      expect(listing.list.length).toEqual(totalListingDashboard);
    });

    //verify list category display
    await test.step("verify category display", async () => {
      const categories = [
        "All",
        "Performance marketing",
        "SEO services",
        "Email marketing",
        "Ads account provider",
        "Store design",
        "Fulfillment services",
        "Community",
      ];
      for (let i = 0; i < categories.length; i++) {
        await expect(page.locator(`(//button[contains(@class,'categories__item')])[${i + 1}]`)).toHaveText(
          categories[i],
        );
      }
    });

    //Verify hiển thị tất cả listing ở trang homepage
    await test.step("verify all listing display in homepage", async () => {
      const listing: Marketplace = await mkHome.getListing(conf.suiteConf.api, "All", "", conf.caseConf.limit);
      const listingDashboard = await page.locator("//div[@class='listing-item']").count();
      const listingApi = listing.list.length;
      expect(listingApi).toEqual(listingDashboard);

      for (let i = 0; i < listing.list.length; i++) {
        const partnerNameApi = listing.list[i].partner.first_name;
        const listingNameApi = listing.list[i].name;
        const xpathPosition = "(//div[@id='cat-listings-wrapper']/div)";

        //verify listing name of listing in homepage
        let listingNameActual = await page
          .locator(`${xpathPosition}[${i + 1}]//a[contains(@class,'description')]`)
          .innerText();
        if (listingNameActual.includes("...")) {
          listingNameActual = listingNameActual.replace("...", "");
        }
        expect(listingNameApi).toContain(listingNameActual.trim());

        //verify partner name of listing in homepage marketplace
        const partnerNameActual = await page
          .locator(`${xpathPosition}[${i + 1}]//p[@class='carousel__item__info__title']`)
          .innerText();
        expect(partnerNameApi).toContain(partnerNameActual.trim());
      }
    });
  });
});
