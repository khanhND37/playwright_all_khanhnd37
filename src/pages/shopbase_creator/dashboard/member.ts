import { Locator, Page } from "@playwright/test";
import { DashboardPage } from "@pages/dashboard/dashboard";
import type { Member, MemberDetail, MemberDetailImageAndDescription } from "@types";

export class MemberPage extends DashboardPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }
  xpathIconSearch = "//div[@class='sb-flex sb-input__body']//span[contains(@class,'sb-flex sb-input__prefix')]";
  xpathPlaceHolderSearch = "//div[@class='sb-flex sb-input__body']//input[@placeholder='Search members']";
  xpathSearchMember = "//div[contains(@class,'sb-input')]//input";
  xpathTitlePage = "//div[@id='page-header']//div[@class='sb-title-ellipsis sb-flex-grow']";
  xpathBtnImport = "//div[@class='sb-flex sb-group-button']//button[normalize-space()='Import']";
  xpathBtnExport = "//div[@class='sb-flex sb-group-button']//button[normalize-space()='Export']";
  xpathBtnSort = "//div[@class='sb-relative sb-ml-small']//span[@class='sb-button--label']";
  xpathBtnFilter = "//span[child::button[normalize-space()='Filter by products']]";
  xpathImageEmpty = "//span[@class='sb-table__empty-text']//img";
  xpathTitleEmpty = "//span[@class='sb-table__empty-text']//p[1]";
  xpathDescriptionEmpty = "//span[@class='sb-table__empty-text']//p[2]";
  xpathAddMemberPage = "//div[@class='template__zen-lead sb-w-100']";
  xpathMessage = "(//div[@class='sb-toast__message sb-text-body-emphasis sb-toast__message--pr12'])[1]";
  xpathIconBack = "//div[@id='page-header']//button[contains(@class,'sb-btn-back')]//span";
  xpathLoading = "(//span[@class='sb-mr-xs sb-autocomplete--loading-dots'])[1]";
  xpathLoadingPage = "//div[@class='sb-skeleton__mobile']";
  xpathColumnMember = "//thead//span[normalize-space()='Name']";
  xpathPopup = "//div[contains(@class,'sb-popup__container')]";
  xpathButtonImport = "//div[@class='sb-popup']//span[normalize-space()='Import members']";
  xpathIconWaring = "//div[contains(@class,'sb-popup__body')]//span[contains(@class,'sb-alert__icon-alert-embedded')]";
  xpathMessageOnPopup = "//div[contains(@class,'sb-popup__container')]//p";
  xpathRow = "//tr[@class='sb-table__row']";
  xpathProductAccess = "//div[normalize-space()='Product access']";
  xpathProductFilter = "//div[contains(@class,'sb-text-body-medium')]";
  xpathBtnDelete = "//button//span[normalize-space()='Delete']";
  xpathBtnGrantAccess = "//div[@class='digital-product-enroll']//button//span";
  xpathProdAccess = "(//tr[@class='sb-table__row'])[1]//span//p";
  xpathProgress = "(//tr[@class='sb-table__row']//td)[3]//span";
  xpathDate = "(//tr[@class='sb-table__row']//td)[4]//div";
  xpathIconDelete =
    "(//div[@class='sb-block-item__wrap full-border']//button[contains(@class,'sb-button--subtle--small')]//span)[1]";
  xpathEmail = "(//div[contains(@class,'contact__info')]//p)[1]";
  xpathTitlePopup = "//div[contains(@class,'sb-popup__container')]//div[@class='sb-text sb-text-medium']//div";
  xpathDescriptionPopup = "//div[contains(@class,'sb-popup__body')]//div[contains(@class,'sb-text-body')]";
  xpathBtnCancel = "//button[contains(@class,'sb-button--default--medium')]//span";
  xpathBtnPopup =
    "//div[contains(@class,'sb-popup__container')]//button[contains(@class,'sb-button--danger--medium')]//span";
  xpathSkeleton = "//div[@class='sb-skeleton__box']";
  xpathProduct = "//span//div[contains(@class,'sb-text-body-medium')]";
  xpathItemPrice = "//div//p[contains(@class,'order__item__price')]";
  xpathItemTime = "//div//p[contains(@class,'order__item__time')]";
  xpathItemName = "//div//a[contains(@class,'order__item__content__header__txt')]";
  xpathOrderName = "//div[@class='sb-flex-direction-column']//p[contains(@class,'order__item__title')]";
  xpathBtnEdit = "//div[contains(@class,'_sidebar__contact__tag')]//p";
  xpathSearchProduct = "//input[@placeholder='Search products']";
  xpathNotes = "//label[normalize-space()='Notes']//parent::div//following-sibling::div//textarea";
  xpathSortMember = "//div[contains(@class,'sb-select-menu')]//label";
  xpathSearchProductField = "//input[@placeholder='Search product']";
  xpathMemberName = "//p[contains(@class,'member__name')]/strong";
  xpathPhoneMember = "(//div[contains(@class,'contact__info')]//p)[2]";

  getLocatorMessage(label: string, message: string): Locator {
    return this.genLoc(
      `//label[normalize-space()='${label}']//parent::div//following-sibling::div//div[normalize-space()='${message}']`,
    );
  }

  getLocatorLabel(index: number): Locator {
    return this.genLoc(`(//div[@class='sb-form']//div[contains(@class,'sb-form-item')]//label)[${index}]`);
  }

  getLocatorFilterTag(productName: string): Locator {
    return this.genLoc(
      `//div[@class='sb-filter__tag']//div[contains(@class,'sb-tag__caption')][normalize-space()='${productName}']`,
    );
  }

  getLocatorProductName(productName: string): Locator {
    return this.genLoc(
      `//div[contains(@class,'sb-table__body-wrapper')]//p[contains(@class,'digital-product--member')][normalize-space()='${productName}']`,
    );
  }

  async clickButtonOnPopup(buttonName: string): Promise<void> {
    await this.genLoc(`//div[@class='sb-popup']//span[normalize-space()='${buttonName}']`).click();
  }

  async selectSortMember(option: string): Promise<void> {
    await this.genLoc(this.xpathBtnSort).click();
    await this.genLoc(`${this.xpathSortMember}[normalize-space()='${option}']`).click();
  }
  /**
   * Get member information at page 1
   * @returns array<object> MemberInfo: Get member information at page 1
   */
  async getMemberDataInTable(): Promise<Member[]> {
    const total = await this.genLoc("//tr[@class='sb-table__row']").count();
    const members: Array<Member> = [];
    for (let i = 1; i <= total; i++) {
      const urlImg = await this.page.getAttribute(`(//div[contains(@class,'image__container ')]/img)[${i}]`, "src");
      const arrUrl = urlImg.split("/img/");
      const imageID = arrUrl[arrUrl.length - 1];
      const member = {
        avatar: imageID,
        name: await this.page.innerText(`(//tr[contains(@class,'sb-table__row')])[${i}]//td[2]//p`),
        email: await this.page.innerText(`(//tr[contains(@class,'sb-table__row')])[${i}]//td[3]//p`),
        addDate: await this.page.innerText(`(//tr[contains(@class,'sb-table__row')])[${i}]//td[4]`),
        lastSignIn: await this.page.innerText(`(//tr[contains(@class,'sb-table__row')])[${i}]//td[5]`),
      };
      members.push(member);
    }
    return members;
  }

  async getMemberByName(keyword: string): Promise<Member[]> {
    const members = await this.getMemberDataInTable();
    return members.filter(member => member.name === keyword);
  }

  getXpathInputWithLabel(label: string): string {
    return `//label[normalize-space()='${label}']//parent::div//following-sibling::div//input`;
  }

  async fillMemberForm(member: MemberDetail): Promise<void> {
    if (member.first_name) {
      await this.genLoc(this.getXpathInputWithLabel("First name")).fill(member.first_name);
    }
    if (member.last_name) {
      await this.genLoc(this.getXpathInputWithLabel("Last name")).fill(member.last_name);
    }
    if (member.country) {
      const exitCountry = await this.page
        .locator("(//label[normalize-space()='Country']//parent::div//following-sibling::div//span)[4]")
        .isVisible();
      if (exitCountry) {
        await this.page
          .locator("(//label[normalize-space()='Country']//parent::div//following-sibling::div//span)[4]")
          .click();
      }
      await this.genLoc(this.getXpathInputWithLabel("Country")).fill(member.country);
    }
    if (member.phone) {
      await this.genLoc(this.getXpathInputWithLabel("Phone number")).fill(member.phone);
    }
    if (member.note) {
      await this.genLoc(this.xpathNotes).fill(member.note);
    }
    if (member.tags) {
      await this.genLoc(this.getXpathInputWithLabel("Tags")).fill(member.tags);
    }
    if (member.email) {
      await this.genLoc(this.getXpathInputWithLabel("Email")).fill(member.email);
    }
    if (member.not_send_email) {
      await this.genLoc("//label[contains(@class,'sb-checkbox')]//span[@class='sb-check']").click();
    }
  }

  async clickButtonCreateMemberPage(buttonName: string): Promise<void> {
    await this.page.click(`//div[@id='page-header']//button//span[normalize-space()='${buttonName}']`);
  }

  async GetFilterProductName(): Promise<string[]> {
    const products: Array<string> = [];
    const count = await this.genLoc(this.xpathProductFilter).count();
    for (let i = 1; i <= count; i++) {
      const productName = await this.getTextContent(`(${this.xpathProductFilter})[${i}]`);
      products.push(productName);
    }
    return products;
  }

  async clickPOnProductFilter(productName: string): Promise<void> {
    await this.genLoc(`${this.xpathProductFilter}[normalize-space()='${productName}']`).click();
  }

  async openMemberDetail(index: number): Promise<void> {
    await this.genLoc(`(${this.xpathRow})[${index}]`).click();
  }

  async clickButtonOnMembersPage(buttonName: string): Promise<void> {
    await this.page.click(`//div[contains(@class,'sb-group-button')]//button[normalize-space()='${buttonName}']`);
  }

  async inputFileImportMember(filePath: string, isOverwrite: boolean): Promise<void> {
    if (isOverwrite) {
      await this.page.click("//span[normalize-space()='Overwrite existing members that have the same email']");
    }
    await this.page.setInputFiles("//input[@type='file' and @accept='.csv']", filePath);
  }

  async inputExportMember(exportType: string, exportAs: string): Promise<void> {
    if (exportType === "current_page") {
      await this.genLoc(`//div[contains(@class,'sb-popup__container')]//span[@for='${exportType}']`).click();
    }
    if (exportAs === "plain_csv") {
      await this.genLoc(`//div[contains(@class,'sb-popup__container')]//span[@for='${exportAs}']`).click();
    }
  }

  async getMessage(): Promise<string> {
    return await this.getTextContent(this.xpathMessage);
  }

  async getEmailMember(): Promise<string> {
    return await this.getTextContent(this.xpathEmail);
  }

  async getImgAndDesMemberDetail(): Promise<MemberDetailImageAndDescription> {
    const urlImgAvatar = await this.page.getAttribute(`//div[contains(@class,'member__avatar')]//img`, "src");
    const arrUrlAvatar = urlImgAvatar.split("/img/");
    const urlImgLastActivity = await this.page.getAttribute(
      `(//div[contains(@class,'member__profile__summary')]//img)[1]`,
      "src",
    );
    const arrUrlLastActivity = urlImgLastActivity.split("/img/");
    const urlImgSales = await this.page.getAttribute(
      `(//div[contains(@class,'member__profile__summary')]//img)[2]`,
      "src",
    );
    const arrUrlSales = urlImgSales.split("/img/");
    const urlImgOrders = await this.page.getAttribute(
      `(//div[contains(@class,'member__profile__summary')]//img)[3]`,
      "src",
    );
    const arrUrlOrders = urlImgOrders.split("/img/");
    const urlProductAccessEmpty = await this.page.getAttribute(`//span[@class='sb-table__empty-text']//img`, "src");
    const arrUrlProductAccessEmpty = urlProductAccessEmpty.split("/img/");
    const urlRecentOrdersEmpty = await this.page.getAttribute(
      `//div[contains(@class,'sb-mt-large sb-mb-large')]//img`,
      "src",
    );
    const arrUrlRecentOrderEmpty = urlRecentOrdersEmpty.split("/img/");
    const image = {
      imageAvatar: arrUrlAvatar[arrUrlAvatar.length - 1],
      imageLastActivity: arrUrlLastActivity[arrUrlLastActivity.length - 1],
      imageSales: arrUrlSales[arrUrlSales.length - 1],
      imageOrders: arrUrlOrders[arrUrlOrders.length - 1],
      imageProductAccessEmpty: arrUrlProductAccessEmpty[arrUrlProductAccessEmpty.length - 1],
      descriptionProductAccessEmpty: await this.getTextContent("//span[@class='sb-table__empty-text']//p"),
      imageRecentOrderEmpty: arrUrlRecentOrderEmpty[arrUrlRecentOrderEmpty.length - 1],
      descriptionOrderEmpty: await this.getTextContent("//div[contains(@class,'sb-mt-large sb-mb-large')]//p"),
    };
    return image;
  }

  async openMemberDetailWithFullName(fullName: string) {
    await this.page.locator(`(//p[@class="overflow-text" and normalize-space()="${fullName}"])[1]`).click();
  }

  getXpathBlockWithLabel(label: string): Locator {
    return this.genLoc(`//div[normalize-space()='${label}']//ancestor::div[@class='sb-block sb-mb-large sb-w-100']`);
  }

  getXpathProductOnPopUp(productName: string): Locator {
    return this.genLoc(
      `//div[normalize-space()="${productName}" and @class="sb-text-body-medium sb-tooltip__reference"]`,
    );
  }

  getXpathBtnDeleteAccess(productName: string): Locator {
    return this.genLoc(`//p[normalize-space() = '${productName}']/ancestor::tr//button`);
  }

  async navigateToMemberPage(): Promise<void> {
    if (await this.genLoc(this.getXpathMenu("Contacts")).isVisible()) {
      await this.navigateToMenu("Contacts");
    } else {
      await this.navigateToMenu("Members");
    }
  }
}
