import { HivePage } from "@pages/hive/core";

export class HiveSizeChart extends HivePage {
  xpathSizeChart = {
    fieldDescriptionHtml: `//div[contains(@id,'descriptionHtml')]`,
    fieldDescriptionInc: `//div[contains(@id,'descriptionInc')]`,
  };
  /**
   * Apply size chart in hive pbase
   * @param sizeCharName
   */
  async applySizeChart(sizeCharName: string) {
    const xpathLabelSizeChart =
      "((//label[contains(text(),'Size chart')]//ancestor::div[@class='sonata-ba-collapsed-fields'])[2]//div[@class='select2-container']//span)[1]";
    await this.page.click(xpathLabelSizeChart);
    await this.page.fill("(//label[normalize-space()='Size chart']//following-sibling::input)[2]", sizeCharName);
    await this.page.click(
      `(//label[normalize-space()='Size chart']//following-sibling::input)[2]//parent::div//following-sibling::ul//span[normalize-space()='${sizeCharName}']`,
    );
  }

  /**
   * Hàm get content description của size chart trong hive
   * @returns
   */
  async getDescriptionSizeChart(): Promise<{ descriptionHtml: string; descriptionInc: string }> {
    const rowDescriptionHtml = this.page.locator(this.xpathSizeChart.fieldDescriptionHtml);
    const rowDescriptionInc = this.page.locator(this.xpathSizeChart.fieldDescriptionInc);
    const data = {
      descriptionHtml: rowDescriptionHtml.frameLocator("//iframe").locator("body").innerHTML(),
      descriptionInc: rowDescriptionInc.locator("//textarea").first().inputValue(),
    };
    const sourceData = await Promise.all(Object.values(data));
    return {
      descriptionHtml: sourceData[0],
      descriptionInc: sourceData[1],
    };
  }
}
