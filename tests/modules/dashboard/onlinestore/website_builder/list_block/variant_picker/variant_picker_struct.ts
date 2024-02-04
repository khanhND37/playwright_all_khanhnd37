import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";

export class BlockVariantPicker extends Blocks {
  needDelBlock = true;

  /**
   * delelete Block variant picker
   * @returns
   */
  async delBlock() {
    if (!this.needDelBlock) {
      return;
    }
    await this.page.frameLocator("#preview").getByText("Style: Premium Quilt").first().click();
    await this.page.frameLocator("#preview").locator("#quick-settings > ul > li:nth-child(3) > div > button").click();
    await this.page.getByRole("button", { name: "Save" }).click();
  }
}
