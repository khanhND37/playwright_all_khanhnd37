import { removeCurrencySymbol } from "@core/utils/string";
import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";

export class EditOrderPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  async navigateToEditOrderPage() {
    await this.page.locator("//span[contains(., 'More action')]").click();
    await this.page.locator("//span[@class='s-dropdown-item']//span[normalize-space()='Edit order']").click();
  }

  async navigateToOrderPageByAPI(orderId: number) {
    await this.goto(`/admin/orders/${orderId}/edited`);
    await this.waitUntilElementVisible("//div[text()='Unfulfilled']");
  }

  async editOrderByAdjustingQty(productName: string, quantity: number) {
    await this.page.waitForSelector(
      `(//div[normalize-space()='${productName}']/following::button//span[normalize-space()="Adjust quantity"])[1]`,
    );
    await this.page.waitForTimeout(5000);
    await this.page
      .locator(
        `(//div[normalize-space()='${productName}']/following::button//span[normalize-space()="Adjust quantity"])[1]`,
      )
      .click();
    await this.genLoc("//div[contains(@class,'sb-popup__container sb-absolute')]//input").fill(quantity.toString());
    await this.genLoc("//button//span[normalize-space()='Confirm']").click();
    await this.page.waitForSelector("//span[contains(@class,'sb-badge__success')]");
  }

  async clickRemoveItemFromOrder(productName: string) {
    await this.genLoc(
      `(//div[normalize-space()='${productName}']/following::button[normalize-space()='Remove item'])[1]`,
    ).click();
  }

  /**
   * Calculate amount to collect in cases adjust quantity of certain product
   * NOTE: not applying for change variant
   * @param qtyBeforeEdit
   * @param qtyAfterEdit
   * @param productPrice
   * @returns
   */
  calculateAmountToCollect(qtyBeforeEdit: number, qtyAfterEdit: number, productPrice: number) {
    if (qtyAfterEdit > qtyBeforeEdit) {
      return (qtyAfterEdit - qtyBeforeEdit) * productPrice;
    }
    return 0;
  }

  calculateChangesAmount(qtyBeforeEdit: number, qtyAfterEdit: number, productPrice: number) {
    return (qtyAfterEdit - qtyBeforeEdit) * productPrice;
  }

  async getOriginalProductQuantity(productName: string): Promise<string> {
    return this.getTextContent(
      `//div[normalize-space()='${productName}']/following::div[contains(text(),'Origin quantity')]`,
    );
  }

  async getProductPriceAndQty(productName: string) {
    return this.getTextContent(
      `(//div[normalize-space()='${productName}']/following::div[contains(@class,'edit-line__quantity')]//div)[1]`,
    );
  }

  async getOrderInfoInPaymentBlock(fieldName: "Subtotal" | "Tax" | "Shipping" | "Total" | "Paid by customer") {
    return removeCurrencySymbol(
      await this.getTextContent(
        `(//div[normalize-space()='${fieldName}']/parent::div[@class='row sb-mb-medium']//div)[last()]`,
      ),
    );
  }

  async getChangesAmountInSummaryBlock(fieldName: "Updated total" | "Paid by customer" | "Amount to collect") {
    return removeCurrencySymbol(
      await this.getTextContent(`(//div[normalize-space()='${fieldName}']/following-sibling::div)[last()]`),
    );
  }

  async sendInvoice() {
    await this.page.check(".sb-check");
    await Promise.all([this.clickOnBtnWithLabel("Send invoice"), this.page.waitForNavigation()]);
  }

  async updateOrder() {
    await Promise.all([this.clickOnBtnWithLabel("Update order"), this.page.waitForNavigation()]);
  }

  /**
   * allow change specific product in the order to another product
   * @param fromProduct
   * @param toProduct
   * @param toVariant
   */
  async editOrderByChangeVariant(fromProduct: string, toProduct: string, toVariant: string) {
    const changeVariantBtn = `
    (//div[normalize-space()='${fromProduct}']/following::button[normalize-space()='Change variant'])[1]`;
    // click btn Change variant
    await this.waitUntilElementVisible(changeVariantBtn);
    await this.page.click(changeVariantBtn);

    // search thenn select new product
    await this.genLoc(
      "//div[@class='sb-input sb-relative sb-input--medium']//input[@placeholder='Search product']",
    ).fill(toProduct);
    await this.page.keyboard.press("Enter");
    await this.page.waitForSelector(
      `//div[contains(@class,'edit-line__custom_auto_complete') and normalize-space()='${toProduct}']`,
      { timeout: 8000 },
    );
    await this.genLoc(
      `//div[contains(@class,'edit-line__custom_auto_complete') and normalize-space()='${toProduct}']`,
    ).click();
    await this.genLoc(`//div[@class='row edit-line__variants']//span[normalize-space()='${toVariant}']`).click();

    // click btn Confirm
    await this.clickOnBtnWithLabel("Confirm");
    await this.page.waitForSelector(`//div[normalize-space()='${toProduct}']`);
  }
}
