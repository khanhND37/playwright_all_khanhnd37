import { SBPage } from "@pages/page";
import { expect, Page } from "@playwright/test";

export class PartnerDetailPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  // get Partner profile by API
  async getPartnerDetailByAPI(api: string, partnerId: string) {
    const response = await this.page.request.get(
      `${api}/v1/marketplace/partner-profile-sf?user_id=${partnerId}&preview=undefined`,
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }
}
