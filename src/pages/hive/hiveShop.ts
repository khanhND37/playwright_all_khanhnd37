import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";
import { Page } from "@playwright/test";
import { HiveShop as HiveShopObject } from "@types";

export class HiveShop extends HiveSBaseOld {
  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
  }

  /**
   * Click dropdown Actions
   * Click button submit Reset quotas Import Product
   */
  async resetQuotaImportProduct() {
    await this.page.click("//li[@class='dropdown sonata-actions']//a[contains(text(),'Actions')]");
    await this.page.click("//li//a[contains(text(),'Reset quotas Import Product')]");
    await this.page.click("//form[@id='form-reset-quota']//button[@id='resetBtn']");
    await this.genLoc("text=Yes, Reset for this shop").click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Edit info shop
   * @param value value edit
   */
  async chooseDataEdit(value: string) {
    await this.page
      .locator(
        `//table[@class="table table-bordered table-striped table-hover sonata-ba-list"]//a[contains(text(),"${value}")]`,
      )
      .click();
  }

  /**
   * Reset quantity shop any
   * @param shopDomain list shop need reset quantity product clone
   * */

  async resetProductQuantity(shopDomain: string[]) {
    for (let i = 0; i < shopDomain.length; i++) {
      await this.goto("/admin/app/shop/list");
      await this.filterShop("Domain", shopDomain[i]);
      await this.chooseDataEdit(shopDomain[i]);
      await this.resetQuotaImportProduct();
    }
  }

  async goToFrozenShopByUserId(userId: number) {
    await this.page.goto(
      `https://${this.domain}/admin/app/shop/list?filter%5Bstatus%5D%5Bvalue%5D=frozen&filter%5Buser__id%5D%5Bvalue%5D=${userId}&filter%5B_per_page%5D=256`,
    );
    await this.page.waitForLoadState("load");
  }

  async getShopInTable(): Promise<HiveShopObject[]> {
    const hiveShops: HiveShopObject[] = [];
    const shopIdDoms = await this.page.locator("//tr//td[2]").all();
    const shopDomainDoms = await this.page.locator("//tr//td[3]").all();

    for (let i = 0; i < shopIdDoms.length; i++) {
      const rawShopId = await shopIdDoms[i].textContent();
      const rawShopDomain = await shopDomainDoms[i].textContent();

      hiveShops.push({
        id: rawShopId.trim(),
        domain: rawShopDomain.trim(),
      });
    }

    return hiveShops;
  }
}
