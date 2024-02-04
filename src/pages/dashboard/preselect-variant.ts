import { WebBuilder } from "@pages/dashboard/web_builder";

export class PreselectVariant extends WebBuilder {
  xpathDataSourceProduct = "//span[normalize-space()='Product']//parent::button";
  xpathPopupSearchSource =
    "//*[@id='widget-popover' and not(contains(@style,'display: none'))]//div[@class='search-source']";
  xpathButtonSelectDefaultVariant =
    "//div[contains(@class, 'w-builder__widget--label') and label[contains(@class, 'w-builder__label') and normalize-space(text()) = 'Default variant']]/following-sibling::div";
  xpathChooseDataSource =
    "//div[contains(@class,'w-builder__widget--label') and contains(normalize-space(),\"Data source\")]//following-sibling::div[@id='search-data-source']";
  xpathItemVariant = `(${this.xpathPopupSearchSource}//div[contains(@class, 'w-builder__search-data-source-result') and not(contains(@class, 'variant-selected'))])`;
  xPathActiveOption =
    "//div[contains(@class, 'variants-selector')]//div[contains(@class, 'option-item-wrap')]//div[contains(@class, 'button-layout') and contains(@class, 'active')]";
  xpathCurrenOption =
    "//label[contains(text(), 'Data source')]/ancestor::div[contains(@class, 'w-builder__widget--label')]/following-sibling::div//span[contains(@class, 'data-source-title')]";
  xpathTooltip =
    "//div[contains(@class, 'w-builder__widget--label') and label[contains(@class, 'w-builder__label') and normalize-space(text()) = 'Default variant']]//span[contains(@class, 'w-builder__tooltip')]";
  xpathInputSearchVariant = "//input[@placeholder='Search variant']";

  xpath = {
    buttons: {
      addToCart: index => `(//div[contains(@class, 'wb-button--add-cart__primary')])[${index}]`,
    },
  };

  /**
   * get xpath product item trong  popover
   * @param productName
   */
  getXpathProductItem(productName): string {
    return `//div[contains(@class,'list-search-result')]//div[@data-select-label and descendant::span[normalize-space(text()) = '${productName}']][1]`;
  }

  /**
   * choose datasource product i WB
   * @param productName
   */

  async chooseDataSourceProduct(productName: string): Promise<void> {
    await this.page.locator(this.xpathChooseDataSource).click();
    await this.page.locator(this.xpathDataSourceProduct).click();
    await this.page.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });
    await this.page.locator(this.getXpathProductItem(productName)).click();
  }

  /**
   * select variant option in popover default variant on Wb
   * @param option
   */
  async chooseVariantDefault(option: string): Promise<void> {
    const xpathOptionVariant = `${this.xpathPopupSearchSource}//div[contains(@class, 'w-builder__search-data-source-result') and descendant::div[contains(text(), '${option}')]]`;
    await this.page.locator(xpathOptionVariant).click();
  }

  /**
   * get xpath variant on popover
   * @param option
   */
  getXpathOptionVariant(option: string): string {
    return `${this.xpathPopupSearchSource}//div[contains(@class, 'w-builder__search-data-source-result') and descendant::div[contains(text(), '${option}')]]`;
  }
}
