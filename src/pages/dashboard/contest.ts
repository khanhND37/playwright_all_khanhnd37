import { SBPage } from "@pages/page";
import { expect, Page } from "@playwright/test";

export class ContestPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Get Data Contest from API Data Contest
   * @return <string> the data of the contest
   */
  async loadDataContest(accessToken: string) {
    const response = await this.page.request.get(
      `https://${this.domain}/admin/contest.json?access_token=${accessToken}`,
      {
        headers: {
          "X-ShopBase-Access-Token": accessToken,
        },
      },
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Get Contest Name
   * @return <string> the name of the contest
   */
  async getNameInContest(): Promise<string> {
    return await this.getTextContent(`//p[@class="text-bold s-mb16"]`);
  }

  /**
   * Get Contest Points
   * @return <number> the points of the contest
   */
  async getPointContest(): Promise<number> {
    const pointContest = await this.getTextContent(`//p[@class="p-s14 color-4D5"]//b`);
    return parseFloat(pointContest.replace(/,/g, ""));
  }

  /**
   * Get Base Product of product from order just checked out
   * @return <string> the base product
   */
  async getPointOrder(): Promise<string> {
    await this.page.locator(`(//div[@class="d-flex"]//a)[1]`).click();
    const xpathOder = this.page.locator(
      `//span[@class="product-group-tooltip is-medium is-dark is-top is-dark s-tooltip"]`,
    );
    return await xpathOder.getAttribute("data-label");
  }

  /**
   * Get Quantity product from order just checked out
   * @return <number> quantity product
   */
  async getQuantity(): Promise<number> {
    const quantity = await this.getTextContent(`(//span[@class="unfulfilled-card__quantity"])[2]`);
    return parseFloat(quantity.replace(/,/g, ""));
  }

  async isVisibleInContest(): Promise<boolean> {
    return await this.page.locator("#shopbase-contest-wrapper .on-contest").isVisible();
  }

  async isVisibleAfterContest(): Promise<boolean> {
    return await this.page.locator("#contest-result").isVisible();
  }
  /**
   * Clear cache of contest on dashboard
   *
   */
  async clearCacheOfContest(accessToken: string) {
    const res = await this.page.request.get(`https://${this.domain}/admin/contest.json?no_cache=true`, {
      headers: {
        "X-ShopBase-Access-Token": accessToken,
      },
    });
    expect(res.status()).toBe(200);
  }
}
