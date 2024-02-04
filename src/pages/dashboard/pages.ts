import { SBPage } from "@pages/page";

export class PagesInOnlineStore extends SBPage {
  // ====== in Dashboard ========
  addPageButton = "span:has-text('Add page') >>nth=0";
  previewIcon = "//a[descendant::span[normalize-space()='View']]";
  searchBar = "input[placeholder='Search pages']";
  checkboxSelectAll = "span.s-check >> nth=0";
  breadcrumb = ".s-breadcrumb a";
  reviewWidget = "div.rv-widget__listing-body";

  // ========== on Storefront ============
  pageContent = "[class='content']";

  async xpathQuestion(question: string) {
    return this.page.locator(`//div[text()='${question}']`);
  }
  async xpathAnswer(answer: string) {
    return this.page.locator(`//p[normalize-space()='${answer}']`);
  }
  async navigateToFAQsdetail() {
    await (await this.page.waitForSelector(`//span[normalize-space()='Pages']`)).click();
    await this.page.click("//a[normalize-space()='FAQs']");
  }
  /*
   * Add question and answer in FAQs page detail
   * @param heading - question
   * @param content - answer
   * @param isEnableContent: check if content is enabled
   */
  async addQuestionAndAnswer(heading: string, content: string, isEnableContent: boolean) {
    await this.page.click(`//span[text()='Accordion']`);
    await this.page.locator(`//label[text()='Heading']//following-sibling::input`).fill(heading);
    await this.page.locator(`//label[text()='Content']//following-sibling::textarea`).fill(content);
    // Choose content enable or disable
    if (isEnableContent) {
      await this.page.click(`//span[contains(text(),'Enable default content')]//preceding-sibling::div`);
    }
    await this.page.click(`//button[@class='tox-button']`);
  }
  async waitForEditorRender() {
    await this.page
      .frameLocator(`//iframe[@class='tox-edit-area__iframe']`)
      .locator(`(//div[@class='sb-accordion mceNonEditable'])[1]`)
      .waitFor();
    // wait for tinymce to finish initializing due to no DOM changed or event emitted found
    return await this.page.waitForLoadState("networkidle");
  }
  /*
   * Focus on question
   * @param heading
   */
  async focusQuestion(heading: string) {
    return await this.page
      .frameLocator(`//iframe[@class='tox-edit-area__iframe']`)
      .locator(`(//div[@class='sb-accordion mceNonEditable' and descendant::div[text()='${heading}']])[1]`)
      .click({ position: { x: 0, y: 0 } });
  }
  /*
   * Delete question
   * @param heading
   * @return {Promise<void>}
   */
  async deleteQuestion(heading: string) {
    await this.focusQuestion(heading);
    return await this.page.keyboard.press("Delete");
  }

  async loseFocus() {
    return await this.page.click(`//label[text()='Content']`);
  }
  async savePage(msg: string) {
    await this.loseFocus();
    await this.page.click(`//div[@class='row save-setting-content']//button[normalize-space()='Save']`);
    await this.page.waitForSelector(`//div[text()='${msg}']`);
  }

  /**
   * Nhập thông tin (title, description, status) cho page tại page detail
   */
  async inputPageInfo({
    title,
    description,
    status,
    url,
    template,
    createRedirect = false,
  }: {
    title?: string;
    description?: string;
    status?: "Visible" | "Hidden";
    url?: string;
    createRedirect?: boolean;
    template?: string;
  }) {
    if (typeof title !== "undefined") {
      await this.page.locator(`[placeholder="e.g. Contact us, Sizing chart, FAQs"]`).fill(title);
    }
    if (typeof description !== "undefined") {
      await this.page.waitForSelector("[title='Rich Text Area']");
      await this.page.frameLocator(".tox-edit-area iframe").locator("#tinymce").fill(description);
    }
    if (status) {
      const index = status === "Visible" ? 1 : 2;
      await this.page.locator(`.type-container div:nth-child(${index}) .s-radio .s-check`).click();
    }
    if (url) {
      await this.page.locator(`text=Edit website SEO`).click();
      await this.page.locator(`//div[@class="s-input-group__prepend"]//following-sibling::input`).fill(url);

      if (createRedirect) {
        await this.page.locator(`//label[@class="s-checkbox"]//span[@class="s-check"]`).click();
      }
    }
    if (template) {
      const dropdown =
        "//div[@class='order-layout__item' and descendant::div[@class='s-heading' and normalize-space()='Template']]//select";
      await this.page.selectOption(dropdown, template);
    }
  }

  /**
   * Click Delete button ở page detail
   */
  async deletePage() {
    await this.page.locator("button:has-text('Delete')").click();
    await this.page.locator(".s-modal button:has-text('Delete')").click();
  }

  /**
   * Đếm số lượng page trong list
   */
  async countNumberOfPage(title?: string): Promise<number> {
    const listPagesSelector = title ? `td.page-description a:has-text("${title}")` : "td.page-description";
    return await this.page.locator(listPagesSelector).count();
  }

  /**
   * Click mở page detail
   */
  async openPage(title: string, index = 1) {
    await this.page.click(`(//td[@class='page-description']//a[normalize-space()='${title}'])[${index}]`);
  }

  /**
   * Thực hiện action với các pages được chọn
   * @param action
   */
  async actionWithSelectedPages(action: "Delete pages" | "Publish selected pages" | "Unpublish selected pages") {
    await this.genLoc("button.s-button").filter({ hasText: "Action" }).click();
    await this.page.click(`div.s-dropdown-menu span:has-text("${action}")`);
    if (action == "Delete pages") {
      await this.page.click("div.s-modal button.is-danger");
      await this.page.waitForSelector("div.s-modal.is-active", { state: "hidden" });
    }
  }
}
