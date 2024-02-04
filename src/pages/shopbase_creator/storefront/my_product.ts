import { SBPage } from "@pages/page";
import { Download, Locator, Page } from "@playwright/test";

export class MyProductPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  // My product
  xpathSelectedSorting = "//section[@component='my-products']//select//option[@data-selected='true']";
  xpathProductName = "//section[@component='my-products']//h5[contains(@class, 'digital-product__name')]";

  xpathMyProductsList = "//div[@id = 'list-digital-products']";
  xpathProductType = "//div[@class = 'digital-product--type']";
  private xpathAccountDropdown = "//div[contains(@class, 'menu-item--avatar')]";
  private xpathLogoutOption = "//p[normalize-space()='Log out']";
  xpathSignInBtn = "//button[normalize-space()='Sign in']";
  xpathInputEmail = "//div//input[@type='email']";
  xpathInputPassword = "//div//input[@type='password']";
  xpathLessonItem = "//div[contains(@class, 'dp-video-course__main__sidebar__sections__lectures__item')]";
  xpathCompleteButton = "//div[contains(@class,'menu-btn')]//a[contains(@class,'btn-primary')]";
  xpathPreviewButton =
    "//button[normalize-space() = 'Previous lesson' and contains(@class, 'dp-video-course__menu__right__prev-btn')]";
  xpathNextButton =
    "//button[normalize-space() = 'Next lesson'and contains(@class, 'dp-video-course__menu__right__next-btn')]";
  private xpathBackToList = "//span[normalize-space() = 'Back to My Products']";
  private xpathAllProductBtn = "//p[normalize-space() = 'All products']";
  xpathCompleteCourse = "//div[contains(text(), 'Congratulations! You have completed')]";
  xpathBtnDownload = "(//button[normalize-space() = 'Download'])[1]";
  xpathMyAvatar = "//div[contains(@class, 'menu-item--avatar')]";
  xpathHeaderAllProduct = "//div[normalize-space() = 'All products']";
  xpathHeaderMyProduct = "//h1[normalize-space() = 'My products']";
  private xpathMyProductMenu = "//p[normalize-space() = 'My products']";
  xpathImageLessonMedia = "//div[contains(@class, 'dp-video-course__main__content')]//img";
  xpathCompleteProgress = "//div[contains(@class,'sidebar')]//div[contains(@class,'mini-paragraph')]//p";
  xpathBtnViewOrtherProduct = "//button[normalize-space() = 'View other products']";
  xpathBtnNextLesson = "//button[normalize-space() = 'Next lesson']";
  xpathCreateAccountBtn = "//div[contains(@class,'login-template')]//button//span";
  xpathErrorMessage = "//div[contains(@class,'login')]//p[contains(@class,'error-message')]";
  xpathAreaSchedule = "//div[@id='page-region']|//div[@id='screen-wrapper']";
  xpathMessage = "//span[contains(@class,'notification__message')]";
  // Course player
  xpathCoursePlayer = "(//div[contains(@class, 'course-player-block')])[1]";
  xpathProgressBar = "#v-progressbar";
  xpathCoursePlayerMainContent =
    "((//div[contains(@class, 'course-player-block')])[1]//div[contains(@class, 'menu-main__content')])[1]";
  xpathCoursePlayerSidebar =
    "((//div[contains(@class, 'course-player-block')])[1]//div[contains(@class, 'course-player-sidebar__sections')])[1]";

  async getCurrentSortingValue(): Promise<string> {
    const currentSortValue = await this.genLoc(this.xpathSelectedSorting).textContent();
    return currentSortValue.trim();
  }

  /**
   * Get all product name appear in My Product block
   */
  async getProductNames(): Promise<string[]> {
    const productNameLocs = await this.genLoc(this.xpathProductName).all();
    const productNames = [];
    for (const productNameLoc of productNameLocs) {
      let productName = await productNameLoc.textContent();
      productName = productName.trim();
      productNames.push(productName);
    }

    return productNames;
  }

  /**
   * sign in to storefront digital
   * @param email
   * @param pass
   */
  async login(email: string, pass: string) {
    await this.page.goto(`https://${this.domain}/sign-in`);
    await this.page.waitForSelector(this.xpathSignInBtn);
    await this.genLoc(this.xpathInputEmail).fill(email);
    await this.genLoc(this.xpathInputPassword).fill(pass);
    await Promise.all([this.page.waitForNavigation(), this.genLoc(this.xpathSignInBtn).click()]);
    await this.page.waitForLoadState("load");
  }

  /**
   * go to sign in page
   */
  async gotoSignInPage() {
    await this.page.goto(`https://${this.domain}/sign-in`);
    await this.page.waitForLoadState("networkidle");
  }

  async goToMyProductPage() {
    await this.page.goto(`https://${this.domain}/my-products`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Input data: email, password and click btn Sign in
   * @param email
   * @param pass
   */
  async inputAndClickSignIn(email: string, pass: string) {
    await this.genLoc(this.xpathInputEmail).fill(email);
    await this.genLoc("//input[@name='password']").fill(pass);
    await this.genLoc(this.xpathSignInBtn).click();
  }

  /**
   * log out
   */
  async logOut() {
    await this.genLoc(this.xpathAccountDropdown).click();
    await this.genLoc(this.xpathLogoutOption).click();
  }

  /**
   *select option of sort product
   * @param option Recently enrolled | Recently accessed | Alphabet A-Z | Alphabet Z-A
   * @param waitForResponse
   */
  async selectSortOption(option: string, waitForResponse = false) {
    await this.page.locator("//select").selectOption({ label: `${option}` });
    if (waitForResponse) {
      await this.page.waitForResponse(
        response => response.url().includes(`products.json`) && response.status() === 200,
        {
          timeout: 5 * 1000,
        },
      );
    }
    await this.page.waitForTimeout(2 * 1000);
  }

  /**
   * click to name of product to open sales page
   */
  async clickOpenSalesPage(productName: string) {
    const xpathProductCard = `//*[normalize-space() = '${productName}']//ancestor::div[contains(@class,'relative product-card')]`;
    for (let i = 0; i < 20; i++) {
      if ((await this.page.locator(xpathProductCard).isVisible()) === false) {
        await this.page.goto(`https://${this.domain}`);
        await this.page.waitForResponse(
          response => response.url().includes("api/actions.json") && response.status() === 200,
        );
      } else {
        break;
      }
    }
    await this.page.click(xpathProductCard);
    await this.page.waitForSelector(this.getXpathWithLabel("Email address"));
  }

  /**
   * click to product card on my product list to open content detail
   * @param productName
   */
  async clickOpenContent(productName: string) {
    await this.genLoc(`//*[normalize-space() = '${productName}']/parent::div`).click();
    await this.page.reload();
    await Promise.all([
      await this.genLoc(this.xpathProgressBar).waitFor({ state: "detached" }),
      await this.page.waitForResponse(
        response => response.url().includes("/assets/theme.css") && response.status() === 200,
      ),
    ]);
  }

  async completeCourse() {
    const numberOfLesson = await this.page.locator(`${this.xpathLessonItem}`).count();
    for (let i = 1; i <= numberOfLesson; i++) {
      await this.page.click(`(${this.xpathLessonItem})[${i}]`);
      await this.page.click(this.xpathCompleteButton);
    }
  }

  async completePartOfCourse(numberOfLesson: number) {
    for (let i = 1; i <= numberOfLesson; i++) {
      await this.page.click(`(${this.xpathLessonItem})[${i}]`);
      await this.page.click(this.xpathCompleteButton);
    }
  }

  async clickToBackMyProduct() {
    await this.page.click(this.xpathBackToList);
    await this.page.waitForSelector(this.xpathMyProductsList);
    await this.page.reload();
  }

  /**
   * open content of lesson with input lesson name
   * @param chapterName
   * @param lessonName
   */
  async selectLesson(chapterName: string, lessonName: string) {
    const xpathLessonName = `//div[normalize-space() = '${chapterName}']//ancestor::div[2]//p[normalize-space() = '${lessonName}']`;
    await this.page.click(xpathLessonName);
  }

  /**
   * Download file from content of digital download
   * @return the path of the file
   */
  async downloadFileDigitalDownload(): Promise<Download> {
    await this.page.click(this.xpathBtnDownload);
    const download = await this.page.waitForEvent("download");
    return download;
  }

  async clickMyProductMenu() {
    await this.page.click(this.xpathMyProductMenu);
    await this.page.waitForSelector(this.xpathHeaderMyProduct);
  }

  async clickBtnComplete() {
    await this.page.click(this.xpathCompleteButton);
  }

  async clickBtnPreviewLesson() {
    await this.page.click(this.xpathPreviewButton);
  }

  async clickToOpenAllProduct() {
    await this.page.click(this.xpathAllProductBtn);
    await this.page.waitForSelector(this.xpathHeaderAllProduct);
  }

  async collapseChapter(chapterName: string) {
    await this.page.click(this.getXpathCollapseChapter(chapterName));
  }

  /**
   * click first product in my product page
   */
  async goToFirstProductDetail(): Promise<void> {
    await this.page.locator("(//a[contains(@href,'/my-products/')])[1]").click();
    await this.page.waitForLoadState("networkidle");
  }

  getXpathTitleWithIndex(index: string): string {
    return `(//h5[contains(@class, 'digital-product--name')])[${index}]`;
  }

  getXpathProgressProduct(productName: string): string {
    return `//h5[normalize-space() = '${productName}']/parent::div//div[contains(@class, 'digital-product__complete')]`;
  }

  getXpathTitlePreview(title: string): Locator {
    return this.genLoc(
      `//p[@class = 'dp-video-course__main__content__info__title' and normalize-space() = '${title}']`,
    );
  }

  getXpathCollapseChapter(chapterName: string): string {
    return `//div[contains(@class,'sections__item__title') and normalize-space() = '${chapterName}']`;
  }

  getXpathLessonFocused(lessonTitle: string): Locator {
    return this.genLoc(`//p[contains(@class, 'has-text-weight-bold') and normalize-space() = '${lessonTitle}']`);
  }
}
