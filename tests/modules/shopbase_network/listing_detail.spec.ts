import { expect, test } from "@core/fixtures";
import { ListingPage } from "@pages/shopbaseNetwork/listing";

test.describe("Verify listing detail", async () => {
  test("Verify screen listing detail @TC_SB_MP_LD_1", async ({ page, conf }) => {
    const listingDetail = new ListingPage(page, conf.suiteConf.domain);
    const api = conf.suiteConf.api;
    const handle = conf.caseConf.handle;
    await test.step("open shopbase network and go to listing detail page", async () => {
      const listingName = conf.caseConf.listingName;
      await listingDetail.goToShopBaseNetworkPage();
      await listingDetail.searchListing(listingName);
      await listingDetail.goToListingDetailPage(listingName);
    });

    await test.step("verify category", async () => {
      const categoryName = await listingDetail.getCategory();
      const result = await listingDetail.loadDataListingDetail(api, handle);
      expect(categoryName).toEqual(result.data.category.name);
    });

    await test.step("verify partner information", async () => {
      const avatar = await listingDetail.getPartnerAvatar();
      const partner = await listingDetail.getPartnerName();
      const result = await listingDetail.loadDataListingDetail(api, handle);
      expect(avatar).toEqual(result.data.partner.image);
      expect(partner).toEqual(result.data.partner.first_name);
    });

    await test.step("verify listing information", async () => {
      const listingName = await listingDetail.getListingName();
      const images: Array<string> = await listingDetail.getImage();
      const price = await listingDetail.getPrice();
      const text = await listingDetail.getRate();
      const result = await listingDetail.loadDataListingDetail(api, handle);
      const avgRate = await result.data.review_info.average_rate;
      const totalReview = result.data.review_info.total;
      if (totalReview == 0) {
        //No review
        expect(text).toEqual("No review yet");
      } else if (totalReview == 1) {
        // 1 review
        expect(text).toEqual(`${avgRate} (${totalReview} review)`);
      } else {
        // >1 review
        expect(text).toEqual(`${avgRate} (${totalReview} reviews)`);
      }
      expect(images.length).toEqual(result.data.images.length);
      for (let i = 0; i < result.data.images.length; i++) {
        const imageUrl = images[i];
        expect(imageUrl).toEqual(result.data.images[i].url);
      }
      expect(listingName).toEqual(result.data.name);
      const fromPrice = result.data.from_price;
      const toPrice = result.data.to_price;
      const onePrice = result.data.is_one_price;
      if (onePrice) {
        // one price
        expect(price.text).toEqual("At");
        expect(price.textPrice).toEqual(`$${fromPrice}`);
      } else {
        if (fromPrice > 0 && toPrice == 0) {
          // from_price
          expect(price.text).toEqual("Starting at");
          expect(price.textPrice).toEqual(`$${fromPrice}`);
        }
        if (fromPrice == 0 && toPrice > 0) {
          // to_price
          expect(price.text).toEqual("Less than");
          expect(price.textPrice).toEqual(`$${toPrice}`);
        }
        if (fromPrice > 0 && toPrice > 0) {
          // from_price - to_price
          expect(price.text).toEqual("Between");
          expect(price.textPrice).toEqual(`$${fromPrice} - $${toPrice}`);
        }
      }
    });
  });

  test("Verify button Sign in to contact @TC_SB_MP_LD_6", async ({ page, conf }) => {
    const listingDetail = new ListingPage(page, conf.suiteConf.domain);
    const handle = conf.caseConf.handle;
    await test.step("open listing detail by url and sign in account to contact", async () => {
      const email = conf.caseConf.username;
      const password = conf.caseConf.password;
      await listingDetail.goToListingDetailPageByUrl(handle);
      await listingDetail.signInToContact(email, password);
    });

    await test.step("contact partner", async () => {
      await listingDetail.contactSeller(conf.caseConf.description);
      await expect(page.locator("//div[@class = 'listing-detail__info--lastContact']")).toHaveText(
        "You contacted this seller just now",
      );
    });
  });
});
