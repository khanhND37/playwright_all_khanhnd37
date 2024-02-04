import { Page } from "@playwright/test";
import { SBPage } from "@pages/page";

export class ListingPage extends SBPage {
  category: string;
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  // Open ShopBase Network page
  async goToShopBaseNetworkPage() {
    await this.goto("");
    await this.page.waitForLoadState("load");
  }

  /**
   * Search listing
   * @param listingName: key search
   */
  async searchListing(listingName: string) {
    const searchListing = "//input[@placeholder='Search for services']";
    await this.goto("/search");
    await this.page.locator(searchListing).fill(listingName);
    await this.page.locator(searchListing).press("Enter");
  }

  /**
   * Go to listing detail
   * @param listingName
   */
  async goToListingDetailPage(listingName: string) {
    await this.page.click(`//a[normalize-space()='${listingName}']`);
    await this.page.waitForLoadState("load");
  }

  /**
   * Get category name
   * @returns
   */
  async getCategory(): Promise<string> {
    return this.getTextContent("//span[@class='listing-detail__nav-category']");
  }

  /**
   * Get partner information: partner name
   * @returns
   */
  async getPartnerName(): Promise<string> {
    return this.getTextContent(
      "//div[@class = 'listing-detail__info--partner-info-name']"
    );
  }

  /**
   * Get partner information: partner avatar
   * @returns
   */
  async getPartnerAvatar(): Promise<string> {
    return this.page.getAttribute(
      "//img[@class='image-detail listing-detail__info--partner-avt']",
      "src"
    );
  }

  /**
   * Get listing infomation: name
   * @returns
   */
  async getListingName(): Promise<string> {
    return this.getTextContent("//div[@class = 'listing-detail__info--title']");
  }

  /**
   * Get url image listing
   * @returns
   */
  async getImage(): Promise<string[]> {
    const number = await this.page
      .locator("//div[@class='w-100 listing-detail__banner']//img")
      .count();
    const imageUrls = [];
    for (let i = 0; i < number; i++) {
      const imgUrl = await this.page.getAttribute(
        "(//div[@class='w-100 listing-detail__banner']//img)[" + (i + 1) + "]",
        "src"
      );
      imageUrls.push(imgUrl);
    }
    return imageUrls;
  }

  /**
   * Get text: At, Starting at, Less than, Between, and get price: from price, to price
   * @returns
   */
  async getPrice() {
    const result = {
      text: "",
      textPrice: "",
    };
    result.text = await this.getTextContent(
      "//div[@class='listing-detail__info--created-by']"
    );
    result.textPrice = await this.getTextContent(
      "//div[@class='listing-detail__info--price']"
    );
    return result;
  }

  /**
   * Get information listing: rating and total review
   * @returns
   */
  async getRate(): Promise<string> {
    return this.getTextContent(
      "//div[@class='listing-detail__info--partner-info-review']"
    );
  }
  async loadDataListingDetail(api: string, handle: string) {
    const res = await this.page.request
      .get(
        `${api}/v1/marketplace/listing/${handle}?user_id=0&preview=undefined`
      )
      .then((res) => res.json());
    return res;
  }

  /**
   * Open listing detail by url
   * @param handle
   */
  async goToListingDetailPageByUrl(handle: string) {
    await this.goto(`/listing/${handle}`);
    await this.page.waitForLoadState("load");
  }

  /**
   * Sign in account shopbase
   * @param email
   * @param password
   */
  async signInToContact(email: string, password: string) {
    await this.page.click("//button[normalize-space()='Sign in to contact']");
    await this.page.locator("//input[@type = 'text']").fill(email);
    await this.page.locator("//input[@type = 'password']").fill(password);
    await this.page.locator("//button[@type = 'submit']").click();
  }

  /**
   * Contact seller
   * @param description
   */
  async contactSeller(description: string) {
    await this.page.click("//button[normalize-space()='Contact seller']");
    await this.page.click("//div[@class='buttonLabel']");
    await this.page.click("//li[normalize-space()='All stores']");
    await this.page
      .locator("//div[@class='m-b-16']//descendant::textarea")
      .fill(description);
    await this.page.click("//button[@class='btn btn-primary']");
  }
}
