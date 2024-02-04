import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";
import type { ProductVariant } from "../../types/core/pages";
import { waitForImageLoaded } from "@utils/theme";

export class VariantDetailPage extends SBPage {
  variantsList: string;
  duplicateButton: string;
  variantOptions: string;
  variantMedias: string;
  variantPricing: string;
  variantInventory: string;
  variantShipping: string;
  variantTag: string;
  deleteVariantButton: string;
  saveButton: string;
  messageSuccess: string;

  xpathMediaUnselect =
    "(//div[@id='variant-select-image-modal']//div[@class='wrapper']/div[not(@class='img m-sm selected')])[last()]";

  constructor(page: Page, domain: string) {
    super(page, domain);
    this.variantsList = "//div[contains(@class,'title-description variant')]";
    this.duplicateButton = "//button[normalize-space()='Duplicate']";
    this.variantOptions = "//div[contains(@class, 'title-description') and contains(normalize-space(), 'Options')]";
    this.variantMedias = "//div[contains(@class, 'title-description') and contains(normalize-space(), 'Medias')]";
    this.variantPricing = "//div[contains(@class, 'title-description') and contains(normalize-space(), 'Pricing')]";
    this.variantInventory = "//div[contains(@class, 'title-description') and contains(normalize-space(), 'Inventory')]";
    this.variantShipping = "//div[contains(@class, 'title-description') and contains(normalize-space(), 'Shipping')]";
    this.variantTag = "//div[contains(@class, 'title-description') and contains(normalize-space(), 'Variant Tag')]";
    this.deleteVariantButton = "//button[normalize-space()='Delete variant']";
    this.saveButton = "//button[normalize-space()='Save']";
    this.messageSuccess = "//div[text()='Variant has been updated successfully!']";
  }

  /**
   * I fill variant tag
   * @param tag the value of tag
   */
  async fillVariantTag(tag: string) {
    const variantTagField = "//input[@placeholder='track-id-xxxx']";
    await this.page.waitForSelector(variantTagField);
    await this.page.fill(variantTagField, tag);
  }

  /**
   * I click save the changes
   */
  async saveChanges() {
    await this.page.click(this.saveButton);
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * I back to the product
   */
  async backToProduct() {
    await this.page.click("//a[normalize-space()='Back to product']");
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(3000);
  }

  /**
   * I edit variant with this info
   * @param variantInfo the info of variant
   */
  async editVariantInfo(variantInfo: ProductVariant) {
    if (variantInfo.value_size) {
      await this.page.fill(
        "(//label[text()='Size']/parent::div)/following-sibling::div//input",
        variantInfo.value_size,
      );
    }
    if (variantInfo.value_color) {
      await this.page.fill(
        "(//label[text()='Color']/parent::div)/following-sibling::div//input",
        variantInfo.value_color,
      );
    }
    if (variantInfo.value_style) {
      await this.page.fill(
        "(//label[text()='Style']/parent::div)/following-sibling::div//input",
        variantInfo.value_style,
      );
    }
    if (variantInfo.media_url) {
      await this.addMedia({ url: variantInfo.media_url });
    }
    if (variantInfo.media_upload) {
      await this.addMedia({ upload: variantInfo.media_upload });
    }
    if (variantInfo.media_select) {
      await this.addMedia({ select: variantInfo.media_select });
    }
    if (variantInfo.price) {
      await this.page.fill("//input[@id='price']", variantInfo.price);
    }
    if (variantInfo.compare_at_price) {
      await this.page.fill("//input[@id='compare_price']", variantInfo.compare_at_price);
    }
    if (variantInfo.cost_per_item) {
      await this.page.fill("//input[@id='cost_price']", variantInfo.cost_per_item);
    }
    if (variantInfo.sku) {
      await this.page.fill("//input[@id='sku']", variantInfo.sku);
    }
    if (variantInfo.bar_code) {
      await this.page.fill("//input[@id='barcode']", variantInfo.bar_code);
    }
    if (variantInfo.inventory_policy) {
      await this.page.selectOption("//div[normalize-space()='Inventory policy']/following-sibling::div//select", {
        label: variantInfo.inventory_policy,
      });
    }
    if (variantInfo.quantity) {
      await this.page.fill("//input[@id='quantity']", variantInfo.quantity);
    }
    if (variantInfo.allowOverselling) {
      await this.page.click(
        `//label[normalize-space()="Allow customers to purchase this product when it's out of stock"]`,
      );
    }
    if (variantInfo.weight) {
      await this.page.fill("(//input[@maxlength='20'])[last()]", variantInfo.weight);
    }
    if (variantInfo.weightUnit) {
      await this.page.selectOption(
        "//p[normalize-space()='Weight']/following-sibling::div//select",
        variantInfo.weightUnit,
      );
    }
    if (variantInfo.variant_tag) {
      await this.fillVariantTag(variantInfo.variant_tag);
    }
    await this.saveChanges();
  }

  /**
   * I add media for variant
   * @param param0 the method to add media for variant
   */
  async addMedia({ url, upload, select }: { url?: string; upload?: string; select?: string }) {
    if (url) {
      await this.page.click("//a[normalize-space()='Add media from URL']");
      await this.page.waitForSelector("//input[@id='url']", { timeout: 15000 });
      await this.page.fill("//input[@id='url']", url);
      await this.page.click("//button[normalize-space()='Add media']");
    }
    if (upload) {
      await this.page.setInputFiles("//input[@type='file']", upload);
      let i = 0;
      do {
        await this.page.waitForTimeout(1000);
        i++;
      } while (
        (await this.page.locator("//div[@class='img m-sm']//div[@class='spinner-css']//img").isVisible()) ||
        i < 11
      );
    }
    if (select == "yes") {
      await this.page.click("//a[normalize-space()='Select product media']");
      await waitForImageLoaded(this.page, `${this.xpathMediaUnselect}//img`);
      await this.page.click(this.xpathMediaUnselect);
      if (await this.page.locator("//button[normalize-space()='Done']").isVisible()) {
        await this.page.click("//button[normalize-space()='Done']");
      }
      await this.page.click("//div[@id='variant-select-image-modal']//button[normalize-space()='Save']");
    }
  }

  /**
   * I unselect media in product
   */
  async unselectMediaInProduct() {
    await this.page.click("//a[normalize-space()='Select product media']");
    await this.page.click(
      "(//div[@id='variant-select-image-modal']//div[@class='wrapper']/div[@class='img m-sm selected'])[last()]",
    );
    if (await this.page.locator("//button[normalize-space()='Done']").isVisible()) {
      await this.page.click("//button[normalize-space()='Done']");
    }
    await this.page.click("//div[@id='variant-select-image-modal']//button[normalize-space()='Save']");
  }

  /**
   * Select variant on Variant detail page
   * @param variantName the name of variant
   * @param index the index of variant
   */
  async selectVariantOnVariantDetailPage(variantName: string, index = 1) {
    await this.page.click(`(//div[@class='row variant-info']//a[normalize-space() = '${variantName}'])[${index}]`);
    await this.page.waitForLoadState("networkidle");
  }
}
