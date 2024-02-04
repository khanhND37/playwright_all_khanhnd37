import { HivePage } from "./core";

export class HiveAffiliate extends HivePage {
  /**
   * Xóa promoter khỏi group affiliate
   * @param affiliateType là loại affiliate: shopbase, printbase, plusbase
   */
  async clearAffiliateGroup(affiliateType: string) {
    switch (affiliateType) {
      case "shopbase":
        await this.page.click(
          "(//span[@id='select2-chosen-2']//parent::a[@class='select2-choice'])//abbr[@class='select2-search-choice-close']",
        );
        break;
      case "printbase":
        await this.page.click(
          "(//span[@id='select2-chosen-3']//parent::a[@class='select2-choice'])//abbr[@class='select2-search-choice-close']",
        );
        break;
      case "plusbase":
        await this.page.click(
          "(//span[@id='select2-chosen-4']//parent::a[@class='select2-choice'])//abbr[@class='select2-search-choice-close']",
        );
        break;
    }
    // await this.page.keyboard.press("Backspace");
    await this.genLoc("//button[normalize-space()='Update']").click();
  }

  /**
   * Filter user ở màn User affiliate cashback list
   * @param label là option filter
   * @param value là giá trị khi filter
   */
  async filterUserAffiliateCashback(label: string, value: string) {
    const filter = "//a[@class='dropdown-toggle sonata-ba-action']";
    const optionFilter = `//li[child::a[normalize-space()='${label}']]`;
    const btnFilter = "(//button[@placeholder='Filter' or normalize-space()='Filter'])[1]";
    const xpathValue = `//div[contains(@class,'form-group')][child::label[normalize-space()='${label}']]//div[@class='col-sm-4']`;

    await this.genLoc(filter).click();
    await this.genLoc(optionFilter).click();
    await this.genLoc(filter).click();
    await this.genLoc(`${xpathValue}/input`).fill(value);
    await this.genLoc(btnFilter).click();
    await this.page.waitForLoadState();
  }

  /**
   * Thêm user vào 1 affiliate group
   * @param email là email của user
   * @param affiliateType là loại affiliate: shopbase, printbase, plusbase
   * @param affiliateGroupName tên group affiliate
   */
  async addAffiliatGroup(email: string, affiliateType: string, affiliateGroupName: string) {
    await this.genLoc(`//a[normalize-space()='${email}']`).click();
    switch (affiliateType) {
      case "shopbase":
        await this.genLoc("#select2-chosen-2").click();
        break;
      case "printbase":
        await this.genLoc("#select2-chosen-3").click();
        break;
      case "plusbase":
        await this.genLoc("#select2-chosen-4").click();
        break;
    }
    await this.genLoc(`//div[@class='select2-result-label' and normalize-space()="${affiliateGroupName}"]`).click();
    await this.genLoc("//button[normalize-space()='Update']").click();
  }

  /**
   * @param value is color trade mark: yellow, black, red, green
   * @returns xpath of color trade mark
   */
  async xpathColorTradeMark(value: "yellow" | "black" | "red" | "green") {
    return `//input[@value="${value}"]`;
  }
}
