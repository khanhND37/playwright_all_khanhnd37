import { Page } from "@playwright/test";
import { SBPage } from "../page";
import { InfoEvent } from "@types";
import { cloneDeep } from "@utils/object";

export class GoogleTag extends SBPage {
  inputFillUrl = "//input[@id='domain-start-url']";
  xpathBtnConnect = "//button[normalize-space()='Connect']";
  xpathBtnContinue = "//button[normalize-space()='Continue']";
  xpathActionExpand = "//div[@class='api-call']";
  xpathEventDetail = "//div[@class='api-call api-call--expanded']";
  xpathClosePopupGoogleTag = "//i[@class='icon badge-header__icon']";
  xpathPopupConnect = "//span[normalize-space()='Connect Tag Assistant to your site']";
  xpathBtnDebug = `//button[normalize-space()='Debug "Live" version']`;

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Go to create google tag manager
   */
  async goToGoogleTag() {
    await this.page.goto("https://tagassistant.google.com/");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get title event
   * @param title:name of event
   * */
  getTitleByName(title: string) {
    return `(//div[@class="message-list__groups"]//span[normalize-space()="${title}"])[1]`;
  }

  /**
   * Get info event by name
   * @param paramName: info event
   * */
  getXpathInfoParamByName(paramName: string, index = 1) {
    return `(//span[normalize-space()="${paramName}"]//following-sibling::span)[${index}]`;
  }

  /**
   * Get all info event
   * @param dataEventList: return info event
   * */
  async getInfoEvent(dataEventList: InfoEvent): Promise<InfoEvent> {
    const eventList = cloneDeep(dataEventList);
    for (const param in eventList) {
      switch (param) {
        case "value":
          eventList.value = await this.page.locator(this.getXpathInfoParamByName("value")).textContent();
          break;
        case "shipping":
          eventList.shipping = await this.page.locator(this.getXpathInfoParamByName("shipping")).textContent();
          break;
        case "tax":
          eventList.tax = await this.page.locator(this.getXpathInfoParamByName("tax")).textContent();
          break;
        case "currency":
          eventList.currency = await this.page.locator(this.getXpathInfoParamByName("currency")).textContent();
          break;
        case "coupon":
          eventList.coupon = await this.page.locator(this.getXpathInfoParamByName("coupon")).textContent();
          break;
        case "items":
          for (let i = 0; i < eventList.items.length; i++) {
            const productItem = cloneDeep(eventList.items[i]);
            for (const paramItem in productItem) {
              switch (paramItem) {
                case "name":
                  productItem.name = await this.page.locator(this.getXpathInfoParamByName("name", i + 1)).textContent();
                  break;
                case "brand":
                  productItem.brand = await this.page
                    .locator(this.getXpathInfoParamByName("brand", i + 1))
                    .textContent();
                  break;
                case "variant":
                  productItem.variant = await this.page
                    .locator(this.getXpathInfoParamByName("variant", i + 1))
                    .textContent();
                  break;
                case "category":
                  productItem.category = await this.page
                    .locator(this.getXpathInfoParamByName("category", i + 1))
                    .textContent();
                  break;
                case "price":
                  productItem.price = await this.page
                    .locator(this.getXpathInfoParamByName("price", i + 1))
                    .textContent();
                  break;
                case "quantity":
                  productItem.quantity = Number(
                    await this.page.locator(this.getXpathInfoParamByName("quantity", i + 1)).textContent(),
                  );
                  break;
                case "discount":
                  productItem.discount = Number(
                    await this.page.locator(this.getXpathInfoParamByName("discount", i + 1)).textContent(),
                  );
                  break;
                case "item_variant":
                  productItem.item_variant = await this.page
                    .locator(this.getXpathInfoParamByName("item_variant", i + 1))
                    .textContent();
                  break;
                default:
                  eventList.items.push(productItem);
              }
            }
          }
          break;
      }
    }
    return eventList;
  }

  /**
   * Click event in google tag
   * @param eventName: info event
   * */
  async clickEventByName(eventName: string) {
    await this.page.click(this.getTitleByName(`${eventName}`));
    if (await this.page.locator(this.xpathActionExpand).isVisible()) {
      await this.page.click(this.xpathActionExpand);
      await this.page.waitForSelector(this.xpathEventDetail);
    }
  }
}
