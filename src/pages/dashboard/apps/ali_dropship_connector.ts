import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";
export class ADCPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }
  xpathTableMapping = `//div[@class='mapping-table s-section s-pb0']`;
  xpathCheckBoxByTitle(title: string) {
    return `//div[@class='product-content' and descendant::*[contains(text(),'${title}')]]//span[@class='s-check']`;
  }
  xpathFieldInputVariant(className: string, index = 1) {
    return `(//td[contains(@class,'${className}')]//input[@type='text'])[${index}]`;
  }
  xpathBntEditProductByTitle(title: string) {
    return `//div[@class='buttons' and preceding-sibling::div[descendant::*[contains(text(),'${title}')]]]`;
  }

  /**
   * Go to import list on ADC
   */
  async goToImportList(): Promise<void> {
    await this.page.goto(`https://${this.domain}/admin/apps/alidropcon/import-list`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Go to manage order
   */
  async goToManageOrder(): Promise<void> {
    await this.page.goto(`https://${this.domain}/admin/apps/alidropcon/fulfill-orders`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Add links product aliexpress to import
   *  @param productLink
   */
  async addLinkToImport(productLinks: Array<string>): Promise<void> {
    for (let i = 0; i < productLinks.length; i++) {
      await this.clickOnBtnWithLabel("Import");
      await this.inputFieldWithLabel("", "Please enter the URL of products on AliExpress", productLinks[i]);
      await this.clickOnBtnWithLabel("Import", 2);
      await this.waitUntilElementInvisible(`//button[contains(@class, 'is-loading')]`);
    }
  }

  /**
   * import product to store
   */
  async importToStore(): Promise<void> {
    await this.page.click(`//label[following-sibling::div[descendant::*[contains(text(),'Showing')]]]`);
    await this.clickElementWithLabel("div", "Import to Store");
    await this.page.waitForSelector(this.getXpathWithLabel("Edit product on ShopBase"));
  }

  /**
   *  remove tất cả product trang import list
   */
  async removeAllProductFromList(): Promise<void> {
    if (await this.isTextVisible("Showing")) {
      await this.page.click("//label[following-sibling::div[descendant::*[contains(text(),'Showing')]]]");
      await this.clickElementWithLabel("div", "Remove from list");
      await this.clickButtonOnPopUpByClass("delete");
    }
  }

  /**
   * Change tab Produt, Description, Images
   * @param title of product
   * @param description of product
   */
  async changeProductInfor(
    tab: "Product" | "Description" | "Images",
    title?: string,
    description?: string,
  ): Promise<void> {
    await this.clickOnTab(tab);
    switch (tab) {
      case "Product":
        await this.genLoc("//input[@placeholder='Change title']").fill(title);
        break;
      case "Description":
        await this.genLoc('//div[@class="ui-box product-property-main"]').fill(description);
        break;
      case "Images":
        await this.clickCheckboxImage(3);
        break;
    }
    await this.clickOnTab(tab);
    await this.waitForElementVisibleThenInvisible(`(//*[contains(text(),"Saved successfully")])`);
  }

  /**
   * Change price cho từng variants product ADC
   * @param price of variants
   */
  async changePriceVariant(dataPrice: Array<string>): Promise<void> {
    await this.clickOnTab("Variants");
    for (let i = 0; i <= dataPrice.length - 1; i++) {
      await this.page.fill(this.xpathFieldInputVariant("price", i + 1), dataPrice[i]);
    }
  }

  /**
   * Change all price variants product ADC
   * @param price of variants
   */
  async changeAllPriceVariant(price: Array<string>): Promise<void> {
    await this.clickOnTab("Variants");
    await this.clickElementWithLabel("span", "Change all price", 1);
    await this.clickElementWithLabel("span", "Set new price", 1);
    await this.inputFieldWithLabel("", "Set new price to apply all", `${price}`);
    await this.clickOnBtnWithLabel("Apply");
  }

  /**
   * Change variant name, price, compare price variants product ADC
   * @param price of variants
   */
  async changeLineVariant(dataVariants: Array<string>, titleClass: Array<string>): Promise<void> {
    await this.clickOnTab("Variants");
    for (let i = 0; i < dataVariants.length; i++) {
      await this.page.fill(this.xpathFieldInputVariant(titleClass[i]), dataVariants[i]);
    }
  }

  /**
   * Click checkbox image import ADC
   */
  async clickCheckboxImage(index = 1): Promise<void> {
    return await this.page.click(`(//span[normalize-space()='']/preceding::span[@class='s-check'])[${index}]`);
  }

  /**
   * map product with link Ali
   * @param linkAli
   */
  async mapProduct(linkAli: string): Promise<void> {
    await this.page.click(`(//span[contains(text(),'Missing info')])[1]`);
    await this.page.click(`(//span[contains(text(),'Map Product')])[1]`);
    await this.page.fill(`//input[@placeholder="Enter new product link here"]`, linkAli);
    await this.clickOnBtnWithLabel("Import");
    await this.waitUntilElementInvisible(`//button[contains(@class, 'is-loading')]`);
  }

  /**
   * Select option product
   * @param data
   */
  async selectOptionMap(data: { option: string; index: number }): Promise<void> {
    await this.page
      .locator(`(//select[option[normalize-space()='${data.option}']])[${data.index}]`)
      .selectOption({ label: data.option });
    await this.page.waitForSelector(this.xpathTableMapping);
  }
}
