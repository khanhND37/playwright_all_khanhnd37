import { SBPage } from "@pages/page";
import { Page, Locator } from "@playwright/test";
import type { PlbProductCatalog } from "@types";
import { removeCurrencySymbol } from "@core/utils/string";

export class ProductCatalogPlusBase extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathCtaText = `//p[@class="cta-text"]`;
  xpathProductCard = `//div[@class="flex-1 cursor-pointer"]`;

  xpathImageProductCatalog(): Locator {
    return this.genLoc(`(//div[@class="rounded-md popup-catalog__carousel--main-image"])[1]`);
  }

  /**
   * search product catalog on landing page
   * @param product is product name
   */
  async searchProductCatalog(product: string) {
    const xpathSearch = '[placeholder="Search by product name"]';
    await this.genLoc(xpathSearch).fill(product);
    await this.genLoc(xpathSearch).press("Enter");
    await this.page.waitForSelector(`(//span[contains(text(),"Filter result")])[1]`);
  }

  /**
   * Get price with lable: "Selling price"| "Profit margin" | "Product cost"
   * @param lable is lable of price
   * @returns price
   */
  async getPriceWithLable(lable: "Selling price" | "Profit margin" | "Product cost", index = 1): Promise<number> {
    const price = await this.genLoc(`(//div[preceding-sibling::div[text()='${lable}']]//div)[${index}]`)
      .innerText()
      .then(text => removeCurrencySymbol(text));
    return Number(price);
  }

  /**
   * Open popup detail product catalog
   */
  async openPopupProductCatalog(productName: string) {
    const xpath = `//div[contains(text(),'${productName}')]`;
    await this.genLoc(xpath).scrollIntoViewIfNeeded();
    await this.page.click(xpath);
    await this.page.waitForSelector(`(//*[contains(text(),"Start selling this product")])[1]`);
  }

  /**
   * get data product catalog on pop-up detail
   * @returns data product catalog
   */
  async getDataProductCatalog(): Promise<PlbProductCatalog> {
    const count = await this.page.locator(`//div[@class="max-w-full inline-block"]//button`).count();
    const dataProductCatalog: PlbProductCatalog = {
      variants: [],
      name: "",
      base_cost: 0,
      selling_price: 0,
      profit_margin: 0,
      first_item: 0,
      additional_item: 0,
    };
    for (let i = 0; i < count; i++) {
      const variantOption = await this.page
        .locator(`(//div[@class="max-w-full inline-block"]//button)[${i + 1}]`)
        .innerText();
      dataProductCatalog.variants.push(variantOption);
    }

    dataProductCatalog.name = await this.page
      .locator(`//div[contains(@class, "popup-catalog__info--product-name")]`)
      .innerText();

    let i = 0;
    while (
      (dataProductCatalog.profit_margin === 0 ||
        dataProductCatalog.selling_price === 0 ||
        dataProductCatalog.base_cost === 0 ||
        dataProductCatalog.first_item === 0) &&
      i < 5
    ) {
      dataProductCatalog.profit_margin = await this.getPriceWithLable("Profit margin");
      dataProductCatalog.base_cost = await this.getPriceWithLable("Product cost", 2);
      dataProductCatalog.selling_price = await this.getPriceWithLable("Selling price");
      dataProductCatalog.first_item = Number(
        removeCurrencySymbol(await this.page.locator(`(//span[@class="font-bold ctl-grey-70"])[1]`).innerText()),
      );
      i++;
    }

    dataProductCatalog.additional_item = Number(
      removeCurrencySymbol(await this.page.locator(`(//span[@class="font-bold ctl-grey-70"])[2]`).innerText()),
    );

    return dataProductCatalog;
  }
}
