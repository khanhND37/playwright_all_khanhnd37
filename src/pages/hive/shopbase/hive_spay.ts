import { Page } from "@playwright/test";
import { HivePage } from "../core";

export class HiveSpay extends HivePage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  async gotoOrderSpayDetailPage(orderId: number) {
    await this.page.goto(`https://${this.domain}/admin/app/checkoutdbentity-order/${orderId}/edit`);
    await this.page.waitForLoadState("load");
  }

  /**
   * This function cancels a specific order by clicking on the cancel button and confirming the
   * cancellation.
   */
  async cancelOrderSpay() {
    await this.page.click(`//a[contains(@class,'btn-danger') and normalize-space()='Cancel']`);
    this.page.on("dialog", dialog => dialog.accept());
    await this.page.click(`//button[contains(@class,'btn-danger') and normalize-space()='Cancel order']`);
    await this.page.waitForSelector(
      `//div[contains(@class,'alert-success') and contains(normalize-space(),'has been canceled.')]`,
    );
  }

  /**
   * This function refunds a specific item with a specified quantity in an online order.
   * @param refundInfo - An object containing information about the item to be refunded, including the
   * item name and quantity.
   */
  async refundOrderSpay(refundInfo: { item_name: string; quantity: number }) {
    await this.page.click(`//a[contains(@class,'btn-danger') and normalize-space()='Refund']`);
    const refundItemQuantity = this.page.locator(
      `//tr[child::td[contains(text(),'${refundInfo.item_name}')]]/descendant::div[contains(@class,'select-quantity')]`,
    );
    await refundItemQuantity.click();
    await this.page.click(
      `//div[contains(normalize-space(),'${refundInfo.quantity}') and child::span[contains(@class,'select2-match')]]`,
    );
    this.page.on("dialog", dialog => dialog.accept());
    await this.page.click(`//button[contains(@class,'btn-danger') and normalize-space()='Refund']`);
    await this.page.waitForSelector(
      `//div[contains(@class,'alert-success') and contains(normalize-space(),'has been refunded.')]`,
    );
  }
}
