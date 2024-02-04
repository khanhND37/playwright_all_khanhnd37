import { BlogPage } from "./blog";
import { Page } from "@playwright/test";
import type { BlogInfo } from "@types";
import { waitForImageLoaded } from "@core/utils/theme";
import { pressControl } from "@core/utils/keyboard";

export class BlogPostPageDB extends BlogPage {
  xpathSelectBlogDroplist = "//div[@class='type-container' and descendant::label[normalize-space()='Blog']]//select";
  xpathBlogDroplistFirstOption =
    "(//div[@class='type-container' and descendant::label[normalize-space()='Blog']]//option)[1]";
  xpathBtnView = "(//*[child::*[text()[normalize-space()='View']]])[1]";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathIconEye(blogName: string): string {
    return `(//div[contains(@class,'type-container') and descendant::div[normalize-space() = '${blogName}']]//i[contains(@class,'mdi-eye')])[1]`;
  }

  /**
   * get xpath blog selected on blog post detail
   */
  getXpathBlogSelected(option: string): string {
    return `//div[@class='type-container' and descendant::label[normalize-space()='Blog']]//select[normalize-space()='${option}']`;
  }

  /**
   * Create a new blog on blog posts page
   */
  async createANewBlog(blogtitle: string) {
    await this.clickOnTextLinkWithLabel("Create a new blog");
    await this.page.waitForSelector(`//div[@class="s-modal-wrapper"]`);
    await this.page.fill(`//div[@class="s-modal-wrapper"]//input[@id='alt-input']`, blogtitle);
    await this.genLoc(`//div[@class="s-modal-wrapper"]//span[contains(text(),'Save')]`).click();
    await this.page.waitForSelector(`//div[@class="s-modal-wrapper"]`, { state: "hidden" });
  }

  /**
   * input a new blog post info
   * @param blogInfo is information of blog post
   */
  async inputBlogPostInfo(blogInfo: BlogInfo) {
    if (await this.checkButtonVisible("Create blog post")) {
      await this.clickOnBtnWithLabel("Create blog post");
    } else {
      await this.clickOnBtnWithLabel("Add blog post");
    }
    if (blogInfo.title) {
      await this.page.fill(
        "//div[@class='type-container' and descendant::label[normalize-space()='Title']]//input",
        blogInfo.title,
      );
    }
    if (blogInfo.content) {
      await this.page.waitForSelector(
        "//div[contains(@class,'tox-editor-container')]//div[@class='tox-editor-header']",
      );
      await this.page.waitForSelector("//iframe[contains(@id,'tiny-vue')]");
      await this.page
        .frameLocator("//iframe[contains(@id,'tiny-vue')]")
        .locator("//body[@id='tinymce']")
        .fill(blogInfo.content);
    }
    if (blogInfo.excerpt) {
      await this.clickOnBtnWithLabel("Add Excerpt");
      await this.page
        .locator("//textarea[contains(@class,'s-textarea__inner blog-post__excerpt')]")
        .fill(blogInfo.excerpt);
    }
    if (blogInfo.visibility) {
      await this.clickRadioButtonWithLabel(blogInfo.visibility);
    }
    if (blogInfo.featured_image) {
      await this.page.setInputFiles("//input[@type='file']", blogInfo.featured_image);
      await this.page.waitForSelector("//div[@class='card__section']//img");
      await waitForImageLoaded(this.page, "//div[@class='card__section']//img");
      await this.page.waitForSelector("//a[normalize-space()='Edit Alt text']");
    }
    if (blogInfo.author) {
      await this.genLoc(
        "//div[@class='type-container' and descendant::label[normalize-space()='Author']]//select",
      ).selectOption(blogInfo.author);
    }
    if (blogInfo.blog) {
      await this.genLoc(
        "//div[@class='type-container' and descendant::label[normalize-space()='Blog']]//select",
      ).selectOption(blogInfo.blog);
    }
    if (blogInfo.seo) {
      await this.genLoc("//button[normalize-space()='Edit website SEO']").click();
      if (blogInfo.page_title) {
        await this.genLoc(this.xpathBlog.blog.blogDetail.fieldInput("Page title")).click();
        await pressControl(this.page, "A");
        await this.page.keyboard.press("Backspace");
        await this.page.fill(this.xpathBlog.blog.blogDetail.fieldInput("Page title"), blogInfo.page_title);
      }
      if (blogInfo.meta_description) {
        await this.genLoc(this.xpathBlog.blog.blogDetail.textarea("Meta description")).click();
        await pressControl(this.page, "A");
        await this.page.keyboard.press("Backspace");
        await this.page.fill(this.xpathBlog.blog.blogDetail.textarea("Meta description"), blogInfo.meta_description);
      }
      if (blogInfo.handle) {
        await this.page.fill(this.xpathBlog.blog.blogDetail.fieldInput("URL and handle"), blogInfo.handle);
      }
    }
  }

  /**
   * Click save button and wait message on toast disappear
   */
  async clickSaveBar() {
    await this.clickOnBtnWithLabel("Save", 1);
    await this.waitForElementVisibleThenInvisible(this.xpathToastMessage);
  }
}
