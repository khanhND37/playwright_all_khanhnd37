import { removeCurrencySymbol, roundingTwoDecimalPlaces } from "@core/utils/string";
import { APIRequestContext, expect, Page } from "@playwright/test";
import { calculateTax } from "@utils/checkout";
import type { Product } from "@types";
import { SBPage } from "@pages/page";

export class CheckoutCreatorAPI extends SBPage {
  request: APIRequestContext;
  checkoutToken: string;
  orderId: number;
  totalTax = 0;

  constructor(domain: string, request?: APIRequestContext, page?: Page, checkoutToken?: string) {
    super(page, domain);
    this.request = request;
    this.checkoutToken = checkoutToken;
  }

  /**
   * Calculate tax by line items and shipping
   * @param products
   * @returns total tax amount
   */
  async calculateTaxByLineItem(products: Array<Product>): Promise<number> {
    let taxAmountLineItem, itemPrice: number;
    for (const product of products) {
      const taxInfo = product.tax_info;
      if (!taxInfo) {
        continue;
      }
      if (product.variant_title) {
        itemPrice = await this.getItemPriceByVariant(product.variant_title);
      }
      if (!this.checkoutToken) {
        const price = await this.getTextContent(`//div[contains(@class,'variant-title-price')]//p[last()]`);
        itemPrice = Number(removeCurrencySymbol(price));
      }
      taxAmountLineItem = calculateTax(taxInfo, itemPrice);
      this.totalTax = this.totalTax + taxAmountLineItem;
    }
    return roundingTwoDecimalPlaces(this.totalTax);
  }

  /**
   * Get price of each line item by variant id
   * @param variantID
   * @returns line item price
   */
  async getItemPriceByVariant(variant: string) {
    const res = await this.request.get(
      `https://${this.domain}/api/checkout/order-status/${this.checkoutToken}/info.json`,
    );
    expect(res.status()).toBe(200);

    const resBody = await res.json();
    const productList = resBody.result.totals.items;

    // eslint-disable-next-line camelcase
    const itemPrice = productList.find(({ variant_title }) => variant_title === variant).total_line_with_discount_price;
    return itemPrice;
  }

  /**
   * Get total tax on thankyou page
   * @returns total tax amount
   */
  async getTotalTax() {
    const res = await this.request.get(
      `https://${this.domain}/api/checkout/order-status/${this.checkoutToken}/info.json`,
    );
    expect(res.status()).toBe(200);
    const resBody = await res.json();
    const totalTax = resBody.result.totals.total_tax;
    return totalTax;
  }
}
