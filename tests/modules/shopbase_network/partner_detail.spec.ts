import { expect, test } from "@core/fixtures";
import { PartnerDetailPage } from "@pages/shopbaseNetwork/partner_detail";
import { ListingPage } from "@pages/shopbaseNetwork/listing";
import type { partnerInfo } from "@types";
import { convertUnixToDate } from "@core/utils/datetime";

test.describe("Partner detail on SB Network @TS_SB_MP_PD", async () => {
  const getPartnerDetailOnNewTab = async ({
    page,
    context,
    conf,
    nameLocator,
    imageLocator,
    imageAttribute,
    ratingLocator,
    reviewLocator,
    createDateLocator,
    countryLocator,
    languageLocator,
    aboutLocator,
    listingLocator,
  }) => {
    const [partnerPage] = await Promise.all([
      context.waitForEvent("page"),
      await page
        .locator(
          `//div[@class='listing-detail__info--partner-info-name'
          and normalize-space()='${conf.caseConf.partner_name}']`,
        )
        .click(),
    ]);

    await partnerPage.waitForLoadState("networkidle");
    const name = await partnerPage.innerText(nameLocator);
    const avatar = await partnerPage.getAttribute(imageLocator, imageAttribute);
    const rating = await partnerPage.innerText(ratingLocator);
    const review = await partnerPage.innerText(reviewLocator);
    const createDate = await partnerPage.innerText(createDateLocator);
    const country = await partnerPage.innerText(countryLocator);
    const language = await partnerPage.innerText(languageLocator);
    const about = await partnerPage.innerText(aboutLocator);
    const listing = await partnerPage.locator(listingLocator).count();

    const partnerDetailInfo: partnerInfo = {
      name: name,
      avatar: avatar,
      rating: rating,
      review: review,
      createDate: createDate,
      country: country,
      language: language,
      about: about,
      listing: listing,
    };
    return partnerDetailInfo;
  };

  test("Verify partner info @TC_SB_MP_PD_1", async ({ page, context, conf }) => {
    const partnerDetailPage = new PartnerDetailPage(page, conf.suiteConf.domain);
    const result = await partnerDetailPage.getPartnerDetailByAPI(conf.suiteConf.api, conf.suiteConf.user_id);
    const listingPage = new ListingPage(page, conf.suiteConf.domain);

    await test.step("open Shopbase Network and go to listing detail page ", async () => {
      await listingPage.goToShopBaseNetworkPage();
      await listingPage.searchListing(conf.caseConf.listing_name);
      await listingPage.goToListingDetailPage(conf.caseConf.listing_name);
    });

    // verify partner info
    await test.step("verify partner info", async () => {
      const partnerDetailInfo = await getPartnerDetailOnNewTab({
        page,
        context,
        conf,
        nameLocator: "//h3[@class='partner-profile__name partner-profile-heading']",
        imageLocator: "//div[@class='partner-profile__avatar']//child::img",
        imageAttribute: "src",
        ratingLocator: "//span[@class='partner-profile__rating-point']",
        reviewLocator: "//span[@class='partner-profile__rating-review']",
        createDateLocator: "//figure[normalize-space()='Member since']//following-sibling::p",
        countryLocator: "//figure[normalize-space()='Country']//following-sibling::p",
        languageLocator: "//figure[normalize-space()='Language support']//following-sibling::p",
        aboutLocator: "//div[@class='partner-profile__about-description']",
        listingLocator: "//div[@id='listingWrapper']//div[@class='row']/div",
      });
      // verify partner name
      expect(partnerDetailInfo.name).toEqual(result.partner_profile.first_name);
      // verify partner avatar
      expect(partnerDetailInfo.avatar).toEqual(result.partner_profile.image);
      // verify partner rating trung binh
      expect(partnerDetailInfo.rating).toEqual(result.summary_data_review.average.toFixed(1));
      expect(partnerDetailInfo.review).toEqual("(" + result.summary_data_review.total + " reviews)");
      // verify thoi gian tao partner profile
      expect(partnerDetailInfo.createDate).toEqual(convertUnixToDate(result.partner_profile.created_at));
      // verify partner country
      expect(partnerDetailInfo.country).toEqual(result.partner_profile.country);
      // verify partner language
      expect(partnerDetailInfo.language.replaceAll(", ", ",")).toEqual(result.partner_profile.support_language);
      // verify listing of partner
      expect(partnerDetailInfo.listing).toEqual(result.partner_listing.length);
    });
  });
});
