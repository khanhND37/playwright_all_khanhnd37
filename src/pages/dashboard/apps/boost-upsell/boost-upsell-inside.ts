import { DashboardPage } from "@pages/dashboard/dashboard";
import { Page } from "@playwright/test";
import { OfferDetail } from "@types";

export class BoostUpsellInsidePage extends DashboardPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathDetailPage = {
    summaryItems: "//div[contains(@class, 'section-sumary')]//li",
  };

  upsellOfferTypes = ".up-sell-types";
  targetUpsellOffer = ".up-sell-target-product";
  recommendUpsellOffer = ".up-sell-recommend-product";
  async gotoOfferDetail(offerId: number) {
    await this.page.goto(`https://${this.domain}/admin/apps/boost-upsell/up-sell/offer/${offerId}`);
    await this.page.waitForLoadState("networkidle");
  }

  async getOfferDetail(): Promise<OfferDetail> {
    const summaryItems = await this.genLoc(this.xpathDetailPage.summaryItems).all();

    const offerDetail: OfferDetail = {};
    for (const summaryItem of summaryItems) {
      const content = (await summaryItem.textContent()).trim();

      let flag = "Sales: $";
      if (content.startsWith(flag)) {
        offerDetail.sale = parseFloat(content.replace(flag, ""));
        continue;
      }

      flag = "Views:";
      if (content.startsWith(flag)) {
        offerDetail.view = parseInt(content.replace(flag, ""));
        continue;
      }

      flag = "Add to cart: ";
      if (content.startsWith(flag)) {
        offerDetail.add_to_cart = parseInt(content.replace(flag, ""));
        continue;
      }

      flag = "Conversion rate: ";
      if (content.startsWith(flag)) {
        offerDetail.conversion_rate = parseFloat(content.replace(flag, "").replace("%", ""));
        continue;
      }

      flag = "Checkout success: ";
      if (content.startsWith(flag)) {
        offerDetail.checkout_success = parseInt(content.replace(flag, ""));
      }
    }

    return offerDetail;
  }

  /**
   * goto List Upsell Offer in boost upsell
   */
  async gotoListUpsellOffer() {
    await this.page.goto(`https://${this.domain}/admin/apps/boost-upsell/up-sell/list`);
    await this.page.waitForLoadState("networkidle");
  }
}
