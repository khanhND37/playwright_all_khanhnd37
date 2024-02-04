import { Page } from "@playwright/test";
import { SBPage } from "../page";

export class GoogleMerchantCenter extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathWarningFeedAlready = "//div[text()[normalize-space()= 'An existing feed already uses that name']]";
  xpathHeaderFeedPage = "//div[contains(@class, 'primary-feeds-title')]";

  /**
   * Xpath of the feed name at Feeds page
   * @param feedName
   * @returns
   */
  getXpathFeedNameAtFeedsPage(feedName: string): string {
    return `//div[text()[normalize-space()='${feedName}']]`;
  }

  /**
   * get xpath number products of feed
   * @param feedName
   * @returns
   */
  getXpathNumberProductWithFeed(feedName: string): string {
    return `${this.getXpathFeedNameAtFeedsPage(
      feedName,
    )}//ancestor::div[contains(@class,"particle-table-row")]//number-of-products-cell`;
  }

  /**
   * Xpath label final attributes
   * @param finalAttributesLabel
   * @returns
   */
  xpathLableFinalAttributes(finalAttributesLabel: string): string {
    return `//span[text()[normalize-space()='${finalAttributesLabel}']]`;
  }

  /**
   * Go to create feed page
   */
  async goToCreateFeed() {
    await this.page.goto("https://merchants.google.com/mc/products/sources/createPrimaryFeed");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * At create feed page
   * Input at tab Basic information
   * @param region
   * @param langue
   */
  async inputBaseInfo(region: string, langue: string) {
    //choose target country
    await this.page.locator("//material-button[contains(@class, 'add-countries')]").click();
    await this.page.locator("//material-input[contains(@class, 'search-input')]//input").fill(region);
    await this.page.locator(`//picker-tree[@aria-label='${region}']`).click();
    await this.page.locator(`//footer//material-button[contains(@class, "btn-yes")]`).click();
    //choose langue
    await this.page.locator(`//material-dropdown-select[@debugid="languageSelect"]`).click();
    await this.page.locator(`//span[contains(text(), '${langue}')]//parent::material-select-dropdown-item`).click();
    //click btn Next
    await this.page.locator("//material-stepper-buttons//material-button[contains(@class, 'btn-yes')]").click();
  }

  /**
   * At create feed page
   * Input at tab Name and input method
   * @param feedName
   * @param method
   */
  async inputNameAndMethod(feedName: string, method: string) {
    await this.page.locator("//material-input//input").fill(feedName);
    await this.page.locator(`//material-radio//div[contains(text(),'${method}')]`).click();
    await this.page.locator("//material-button[contains(@class, 'btn-yes')]").click();
  }

  /**
   * At create feed page
   * Input at tab Setup
   * @param fileName
   * @param fileUrl
   */
  async inputSetupAndFinishCreateFeed(fileName: string, fileUrl: string) {
    await this.page.locator("//material-input[@debugid='fileName']//input").fill(fileName);
    await this.page.locator("//material-input[@debugid='file-url']//input").fill(fileUrl);
    await this.page.locator("//material-button[contains(@class, 'btn-yes')]").click();
    await this.page.url().includes("https://merchants.google.com/mc/products/sources/detail");
    await this.page.locator("//material-button[@debugid='fetch-button']").click();
    await Promise.all([
      this.page.waitForResponse(
        resp => resp.url().includes("/mc_feeds/_/rpc/DatasourceEntityService/FetchNow") && resp.status() === 200,
      ),
    ]);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Go to Feeds page
   */
  async goToFeeds() {
    await this.page.goto("https://merchants.google.com/mc/products/sources");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Go to product list by clicking feed name
   * @param feedName
   */
  async viewProductListWithFeedName(feedName: string) {
    await this.page
      .locator(
        `${this.getXpathFeedNameAtFeedsPage(
          feedName,
        )}//following-sibling::div[contains(@class, 'products-link-panel')]`,
      )
      .click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Go to product detail of the first product after filter feed with conditions
   * @param filterLabel
   * @param productTitle
   */
  async goToProductDetailWithFilter(filterLabel: string, productTitle: string) {
    //filter
    await this.page.locator("//material-button[@aria-label='Show filtering options']").click();
    await this.page.waitForSelector("//menu-item-groups");
    await this.page.locator(`//material-select-item[@aria-label='${filterLabel}']`).click();
    await this.page.locator("//label[contains(@class, 'input')]").fill(productTitle);
    await this.page.locator("//material-button[@aria-label='Apply filter']").click();
    //go to product detail
    const productLinkGmc = await this.page.locator("(//product-title-cell)[1]//a").getAttribute("href");
    await this.page.goto("https://merchants.google.com" + productLinkGmc);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * At product detail page
   * Get information of product at session `Regional attributes preview`
   * @param attributesPreviewLabel label of field need to get info
   * @returns
   */
  async getInfoAttributesPreviewCol(attributesPreviewLabel: string): Promise<string> {
    await this.page.waitForSelector(`//div[text()[normalize-space()='${attributesPreviewLabel}']]`);
    return this.getTextContent(
      `//acx-scorecard//div[text()[normalize-space()='${attributesPreviewLabel}']]/following-sibling::div`,
    );
  }

  /**
   * At product detail page
   * Get information of product at session `Final attributes`
   * @param finalAttributesLabel label of field need to get info
   * @returns
   */
  async getInfoFinalAttributesRaw(finalAttributesLabel: string): Promise<string> {
    return this.getTextContent(
      `${this.xpathLableFinalAttributes(finalAttributesLabel)}/parent::div/following-sibling::div`,
    );
  }

  /**
   * At product detail page
   * At session `Final attributes` -> `shipping`
   * Get information of product's shipping
   * @param labelRowShipping label of field need to get info
   * @returns
   */
  async getInforShippingFinalAttributesCol(labelRowShipping: string): Promise<string> {
    const xpathRow = await this.page.locator(
      `//div[@debugid="group-attribute"]//div[text()[normalize-space()='${labelRowShipping}']]//preceding-sibling::div`,
    );
    const colIndex = (await xpathRow.count()) + 1;
    const xpathData = `(//div[contains(@class, 'group-attribute-row ')]//div)[${colIndex}]`;
    return this.getTextContent(xpathData);
  }

  /**
   * Delete product feed with feed name
   * @param feedName
   */
  async deleteFeed(feedName: string) {
    await this.goToFeeds();
    await this.page.waitForSelector(this.getXpathFeedNameAtFeedsPage(feedName));
    await this.hoverThenClickElement(
      this.getXpathFeedNameAtFeedsPage(feedName),
      `${this.getXpathFeedNameAtFeedsPage(feedName)}/parent::mso-feeds-datasource-name/following-sibling::layer-icon`,
    );
    await this.page
      .locator(
        "//material-dialog[contains(@class, 'delete-primary-feed-confirmation')]//div[text()[normalize-space()='Remove']]",
      )
      .click();
    await Promise.all([
      this.page.waitForResponse(
        resp => resp.url().includes("/mc_feeds/_/rpc/UiPrimaryFeedService/Delete") && resp.status() === 200,
      ),
    ]);
    await this.page.waitForLoadState("load");
  }
}
