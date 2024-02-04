import { SBPage } from "@pages/page";
import type { AttributeEvetnCIO } from "@/types/customer_io";

export class EventCIO extends SBPage {
  /**
   * open and login customer io page
   * @param email
   * @param password
   */
  async loginCustomerIo(email: string, password: string) {
    await this.page.goto(`https://fly.customer.io/login`);
    await this.genLoc("//input[@placeholder='you@company.com']").fill(email);
    await Promise.all([this.page.waitForNavigation(), this.genLoc('button:has-text("Log in to Customer.io")').click()]);
    await this.genLoc('input[name="password"]').fill(password);
    await Promise.all([this.page.waitForNavigation(), this.genLoc('button:has-text("Log in to Customer.io")').click()]);
  }

  /**
   * Select workspaces customer io
   * @param workspaces
   */
  async selectWorkspaces(workspaces: string) {
    await this.genLoc("//span[contains(@class,'nav-workspace-dropdown-trigger')]").click();
    await this.genLoc(`(//span[normalize-space()='${workspaces}'])[1]`).click();
    await this.page.reload();
  }

  /**
   * Select module in sidebar customer io
   * @param module
   */
  async selectModule(module: string) {
    await Promise.all([
      this.page.waitForNavigation(),
      this.genLoc(`(//span[normalize-space()='${module}'])[1]`).click(),
    ]);
  }

  /**
   * Filter event
   * @param activityType
   * @param eventName
   */
  async addFilterEvent(activityType: string, eventName: string) {
    await this.genLoc("text=Add Filter").click();
    await this.genLoc("//span[text()='All']").click();
    await this.genLoc('input[role="combobox"]').fill(activityType);
    await this.genLoc(`li[role="alert"]:has-text("${activityType}")`).click();
    await this.genLoc('div[role="button"]:has-text("any")').click();
    await this.genLoc('[placeholder="Find or specify an attribute…"]').fill(eventName);
    await this.genLoc('[placeholder="Find or specify an attribute…"]').press("Enter");
  }

  /**
   * Get attribute event
   * @param name
   * @param email
   * @returns hàm này return 1 obj chứa các thông tin của 1 event
   */
  async getAttributeEvent(name: string, email: string): Promise<AttributeEvetnCIO> {
    let productPricingType = "";
    let pageTemplateId = "";
    let sectionId = "";
    let sectionName = "";
    let lectureName = "";
    let lectureId = "";

    const createdAt = await this.page.innerText(
      `(((//a[normalize-space()='${name}'])[1]|(//a[normalize-space()='${email}'])[1])//ancestor::tr//descendant::td//span[@class='ember-view']//span)[1]`,
    );
    await this.genLoc(
      `(((//a[normalize-space()='${name}'])[1]|(//a[normalize-space()='${email}'])[1])` +
        `//ancestor::tr//descendant::td[text()='Event'])[1]`,
    ).click();

    let productIdStr = await this.page.innerText(
      "//span[text()='product_id']//ancestor::li/span[@class='string fs-mask']",
    );
    productIdStr = productIdStr.replaceAll('"', "");

    let productName = await this.page.innerText(
      "//span[text()='product_name']//ancestor::li/span[@class='string fs-mask']",
    );
    productName = productName.replaceAll('"', "");

    let productType = await this.page.innerText(
      "//span[text()='product_type']//ancestor::li/span[@class='string fs-mask']",
    );
    productType = productType.replaceAll('"', "");

    const isProductPricingTypeVisible = await this.genLoc("//span[text()='product_pricing_type']").isVisible();
    if (isProductPricingTypeVisible) {
      productPricingType = await this.page.innerText(
        "//span[text()='product_pricing_type']//ancestor::li/span[@class='string fs-mask']",
      );
      productPricingType = productPricingType.replaceAll('"', "");
    }
    const isPageTemplateIdVisible = await this.genLoc("//span[text()='page_template_id']").isVisible();
    if (isPageTemplateIdVisible) {
      pageTemplateId = await this.page.innerText(
        "//span[text()='page_template_id']//ancestor::li/span[@class='string fs-mask']",
      );
      pageTemplateId = pageTemplateId.replaceAll('"', "");
    }
    const isSectionIdVisible = await this.genLoc("//span[text()='section_id']").isVisible();
    if (isSectionIdVisible) {
      sectionId = await this.page.innerText("//span[text()='section_id']//ancestor::li/span[@class='string fs-mask']");
      sectionId = sectionId.replaceAll('"', "");
    }
    const isSectionNameVisible = await this.genLoc("//span[text()='section_name']").isVisible();
    if (isSectionNameVisible) {
      sectionName = await this.page.innerText(
        "//span[text()='section_name']//ancestor::li/span[@class='string fs-mask']",
      );
      sectionName = sectionName.replaceAll('"', "");
    }
    const isLectureNameVisible = await this.genLoc("//span[text()='lecture_name']").isVisible();
    if (isLectureNameVisible) {
      lectureName = await this.page.innerText(
        "//span[text()='lecture_name']//ancestor::li/span[@class='string fs-mask']",
      );
      lectureName = lectureName.replaceAll('"', "");
    }
    const isLectureIdVisible = await this.genLoc("//span[text()='lecture_id']").isVisible();
    if (isLectureIdVisible) {
      lectureId = await this.page.innerText("//span[text()='lecture_id']//ancestor::li/span[@class='string fs-mask']");
      lectureId = lectureId.replaceAll('"', "");
    }

    return {
      createdAt: createdAt,
      productId: productIdStr,
      productType: productType,
      productName: productName,
      productPricingType: productPricingType,
      pageTemplateId: pageTemplateId,
      sectionId: sectionId,
      sectionName: sectionName,
      lectureName: lectureName,
      lectureId: lectureId,
    };
  }

  /**
   * Clear filter
   */
  async clearFilter() {
    await this.genLoc("//button[normalize-space()='Clear Filter']").click();
  }
}
