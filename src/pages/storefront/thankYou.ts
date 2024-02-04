import { SBPage } from "@pages/page";
import { Locator, Page } from "@playwright/test";

export class ThankYouPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  async viewOrderStatusPageText() {
    return await this.page.locator("//*[text()[normalize-space()='View order status page']]");
  }

  async viewTrackingLogLink(page: Page) {
    return await page.locator("//a[text()[normalize-space()='View tracking log']]");
  }
  async clickMoreAction() {
    return await this.page.locator("//*[text()[normalize-space()='More actions']]").click();
  }

  async getColorShipmentStatus(element: Locator) {
    const color = await element.evaluate(el => {
      return window.getComputedStyle(el).getPropertyValue("color");
    });
    return color;
  }

  async getShipmentStatus(page: Page) {
    const statusLocator = page.locator("//span[@class='fulfillment__shipment-status']");
    const status = (await statusLocator.textContent()).trim();
    return status;
  }

  async getStatusColor(page: Page) {
    const status = page.locator("//span[@class='fulfillment__shipment-status']");
    const statusColor = status.evaluate(el => {
      return window.getComputedStyle(el).getPropertyValue("color");
    });

    return statusColor;
  }

  async clickViewMoreBtn(page: Page) {
    await page.locator("//span[text()[normalize-space()='View more']]").scrollIntoViewIfNeeded();
    await (await page.waitForSelector("//span[text()[normalize-space()='View more']]")).click();

    await page.waitForSelector("//span[text()='View less']");
  }
  async getTotalTrackingMessage(page: Page) {
    this.clickViewMoreBtn(page);
    const total = await page.locator("//ul[@class= 'timeline']/li/div[@class= 'timeline-item__wrapper']").count();
    return total;
  }
  async getTrackingMessageNum(page: Page) {
    const viewalessBtn = await page.waitForSelector("//span[text()='View less']");

    await viewalessBtn.click();

    await page.waitForSelector("//span[text()[normalize-space()='View more']]");

    const trackingMessNum = await page.locator("//ul[@class= 'timeline']/li").count();
    return trackingMessNum;
  }

  async getContentTrackingStep(page: Page, trackingStepNum: number) {
    this.clickViewMoreBtn(page);
    let countNum: number;
    do {
      const contentTrackingStep = await page.locator(
        "//div[@class='content-box__wrapper']//ul[@class='timeline']//li[@class = 'timeline-item']",
      );
      countNum = await contentTrackingStep.count();
    } while (countNum != trackingStepNum);

    const listContent: string[] = [];
    for (let i = 1; i <= countNum; i++) {
      const content = await page.locator(
        "(//li[@class = 'timeline-item']//div[@class='timeline-item__content'])[" + i + "]",
      );

      const text = await content.textContent();
      listContent.push(text.trim());
    }
    return listContent;
  }
}
