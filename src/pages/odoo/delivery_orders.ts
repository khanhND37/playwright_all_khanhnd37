import { LogInOdooPage } from "./log_in";

export class DeliveryOrdersPage extends LogInOdooPage {
  /**
   * I will view record
   * @param id id of the order
   */
  async viewRecord(id: string) {
    await this.page.click(`//button/span[text()[normalize-space()="Filters"]]`);
    await this.page.click(`//button[text()[normalize-space()="Add Custom Filter"]]`);
    await this.page.selectOption(
      `//button[text()[normalize-space()="Add Custom Filter"]]/following-sibling::div[1]/select[1]`,
      "id",
    );
    await this.page.fill(
      `//button[text()[normalize-space()="Add Custom Filter"]]/following-sibling::div[1]/span/input`,
      id,
    );
    await this.page.click(`//button[text()[normalize-space()="Apply"]]`);
    await this.page.click(`//tbody/tr[1]/td[3]`);
  }
}
