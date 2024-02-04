/* eslint-disable playwright/no-element-handle */
import { SBPage } from "@pages/page";
import { Locator, Page } from "@playwright/test";
import { readDownloadFileCSV, readFileCSV } from "@helper/file";
import { MessageFormData } from "@types";

/**
 * @deprecated: Separate each page into POM in folder src/pages/hive/(printbase|shopbase)
 */
export type SocialProofFormData = {
  name?: string;
  displayTime?: string;
  waitingTime?: string;
  delayTime?: string;
  dataContent: SocialContentFormData[];
};
export type SocialContentFormData = {
  title?: string;
  content?: string;
  time?: string;
  image?: string;
  link?: string;
};
export class HiveNotification extends SBPage {
  usernameInput: Locator;
  passwordInput: Locator;
  loginButton: Locator;

  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
    this.usernameInput = this.genLoc('[placeholder="Username"]');
    this.passwordInput = this.genLoc('[placeholder="Password"]');
    this.loginButton = page.locator("text=Log in");
  }

  xpathBtnAddNew = "//div[@class='navbar-collapse']//i[@class='fa fa-plus-circle']";
  xpathBtnCreateAndClose = "//button[@name='btn_create_and_list']";
  xpathBtnOK = "//input[@value='OK' and @class = 'btn btn-small btn-primary']";
  xpathFilterDropdown = "//li[@class='dropdown sonata-actions open']//ul//li//a";
  xpathBtnFilter = "//li[contains(@class,'dropdown sonata-actions')]";
  xpathConfirmBody = "//div[@class='box-body']";
  xpathSuccessAlert = "//div[contains(@class,'alert-success')]";

  /**
   * go to social proof
   */
  async clickSocialProofMenu() {
    await this.page.waitForSelector("ul.sidebar-menu");
    await this.page.click("span:has-text('Notifications')");
    await this.page.waitForSelector(".treeview-menu.menu-open");
    await this.page.locator("aside >> text=Social Proof List").click();
    await this.page.waitForSelector("//span[text()='Social Proof List']");
  }

  /**
   * Kểm tra element có tồn tại không?
   * */
  async checkLocatorDisplay(path: string): Promise<boolean> {
    return await this.genLoc(`${path}`).isVisible();
  }

  /**
   * go to social proof by url
   */
  async navigateSocialProof() {
    await this.page.waitForSelector("ul.sidebar-menu");
    await this.goto(`admin/app/socialproof/list`);
    await this.page.waitForSelector("//div[@class='navbar-left']//span[text()='Social Proof List']");
  }

  /**
   * go to Message list by url
   */
  async navigateMessageList() {
    await this.page.waitForSelector("ul.sidebar-menu");
    await this.goto(`admin/message-list/list`);
    await this.page.waitForSelector("//div[@class='navbar-left']//span[text()='Message List']");
  }

  /**
   * Create new message
   * @param data Data of message
   */
  async createMessage(data: MessageFormData) {
    await this.page.waitForSelector("//div[@class='navbar-header']//a[text()='Create message']");
    await this.page.locator(`(//input[contains(@name,'shopDomains')])[1]`).fill(data.domain);
    const productDomain = await this.page.locator("(//input[contains(@name,'shopDomains')])[1]").inputValue();
    if (productDomain !== data.domain) return;
    await this.page.locator("(//input[contains(@name,'title')])[1]").fill(data.title);
    await this.page
      .frameLocator("//div[@id='cke_1_contents']//iframe")
      .locator("//body[contains(@class,'cke_editable')]")
      .fill(data.description);
    await this.page.locator("(//input[contains(@name,'timeToResponse')])[1]").fill(data.time_response);
    await this.page.locator("(//input[contains(@name,'timeToRemind')])[1]").fill(data.time_remind);
    await this.page.locator("(//input[contains(@name,'subject')])[1]").fill(data.subject);
    await this.page
      .frameLocator("//div[@id='cke_2_contents']//iframe")
      .locator("//body[contains(@class,'cke_editable')]")
      .fill(data.content);
    await this.page.locator("(//button[normalize-space()='Create and return to list'])[1]").click();
    await this.page.waitForLoadState("load");
  }

  /**
   * return value of message by row and collumn
   * @param row message's row
   * @param column message's column
   * @returns
   */
  async getMessageValue(row: number, column: number): Promise<string> {
    return await this.page
      .locator(`//div[contains(@class,'box-body')]//table[1]/tbody[1]/tr[${row}]/td[${column}]`)
      .textContent();
  }

  /**
   * Delete message by id
   * @param id id of message
   */
  async deleteMessageById(id: string, shopDomain: string) {
    await this.goto(`admin/message-list/${id}/edit`);
    const domain = await this.page.locator("(//input[contains(@name,'shop__domain')])[1]").getAttribute("value");
    if (domain.trim() == shopDomain) {
      await this.goto(`admin/message-list/${id}/delete`);
      await this.page.waitForSelector("//div[@class='box box-danger']");
      await this.page.locator("//button[normalize-space()='Yes, delete']").click();
      await this.page.waitForSelector("//div[contains(@class,'alert-success')]");
    } else return;
  }

  /** upload file */
  async uploadFile(typeFile: string, xpathFile: string, index = 1) {
    await this.page.setInputFiles(`(//input[@name="${typeFile}"])[${index}]`, xpathFile);
  }

  /**
   *  data in content social proof
   */
  async fillSocialProofContentForm(data: SocialContentFormData, index: number) {
    if (data.title) {
      await this.page.locator(`(//input[@name="data-title"])[${index}]`).fill(data.title);
    }
    if (data.content) {
      await this.page.locator(`(//input[@name="data-content"])[${index}]`).fill(data.content);
    }
    if (data.time) {
      await this.page.locator(`(//input[@name="data-time"])[${index}]`).fill(data.time);
    }
    if (data.link) {
      await this.page.locator(`(//input[@name='data-link'])[${index}]`).fill(data.link);
    }
    if (data.image) {
      await this.uploadFile("file", data.image, index);
      await this.page.locator(`//button[normalize-space()='Start Upload']`).click();
      await this.page.waitForSelector('//button[normalize-space()="Start Upload"]', { state: "hidden" });
    }
  }

  async changeCountRecordPerPage(countRecords: string) {
    await this.page.locator('//div[@class="select2-container per-page small"]').click();
    await this.page
      .locator(
        `//li[@class="select2-results-dept-0` +
          ` select2-result select2-result-selectable"]//div[normalize-space()="${countRecords}"]`,
      )
      .click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async changePage(page: string) {
    await this.page.locator(`//ul[@class="pagination"]//li//a[text()="${page}"]`);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async copyScript(id: string) {
    await this.page.locator(`//td[@objectid="${id.trim()}"]//a[normalize-space()="Copy script"]`).click();
    await this.page.waitForSelector('//div[@id="modal-script"]');
    await this.page.locator('//a[normalize-space()="Copy"]').click();
  }

  /**
   * fill data in social proof
   */
  async fillSocialProofFormData(data: SocialProofFormData) {
    if (data.name) {
      await this.page.locator('//form//label[normalize-space()="Name"]/..//input').fill(data.name);
    }
    if (data.displayTime) {
      await this.page.locator('//form//label[normalize-space()="Display time (s)"]/..//input').fill(data.displayTime);
    }
    if (data.waitingTime) {
      await this.page.locator('//form//label[normalize-space()="Waiting time (s)"]/..//input').fill(data.waitingTime);
    }
    if (data.delayTime) {
      await this.page.locator('//form//label[normalize-space()="Delay time (s)"]/..//input').fill(data.delayTime);
    }
    const countContent = data.dataContent.length;
    let countColumContent: number;
    for (let i = 0; i < countContent; i++) {
      const rows = await this.page.$$('//div[@class="form-group row"]');
      countColumContent = rows.length;
      if (i == countColumContent) {
        await this.page.locator(`//div[@class='add-new-data']//a[normalize-space()='Add new']`).click();
      }
      if (i > countColumContent) {
        await this.page.locator(`(a[normalize-space()="x"])[${countColumContent}]`).click();
      }
      await this.fillSocialProofContentForm(data.dataContent[i], i + 1);
    }
  }

  /**
   * click action in screen edit|create
   */
  async clickAction(xpath: string) {
    await this.page.locator(xpath).click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  async getAllText(xpath: string) {
    const textCheckBox = this.page.locator(xpath);
    const texts = await textCheckBox.evaluateAll(list => list.map(element => element.textContent.trim()));
    return texts;
  }

  async getIndexField(fieldName: string) {
    // const rowHeaderTable = this.page.locator('//tr[@class="sonata-ba-list-field-header"]//th');
    const title = await this.getAllText('//tr[@class="sonata-ba-list-field-header"]//th');
    const indexField = title.findIndex(e => {
      return e == fieldName;
    });
    return indexField;
  }

  async fillDataForFilter(field: string, value: string) {
    const xpathBtnFilter = '//li[@class="dropdown sonata-actions"]';
    const checkExistBtnFilter = await this.page.locator(xpathBtnFilter).isVisible();
    if (checkExistBtnFilter) {
      await this.page.locator(xpathBtnFilter).click();
      await this.page.waitForSelector('//li[@class="dropdown sonata-actions open"]');
    }
    const xpathCheckBoxItem = `//li[@class="dropdown sonata-actions open"]//a[normalize-space()="${field}"]`;
    await this.page.locator(xpathCheckBoxItem).click();

    const xpathInputField = `//label[normalize-space()="${field}"]/..//div[@class="col-sm-4"]//input[@type="text"]`;

    await this.page.waitForSelector(xpathInputField);
    await this.page.locator(xpathInputField).fill(value);
  }

  async getValueInput(field: string) {
    const xpathInputField = `//label[normalize-space()="${field}"]//parent::div//input`;
    return await this.page.locator(xpathInputField).inputValue();
  }

  async fillFormDataEdit(field, value, index: number) {
    const xpathInputFields = `(//label[normalize-space()="${field}"]//parent::div//input)[${index}]`;
    await this.page.locator(xpathInputFields).fill(value);
  }

  async getDataFiedById(id: string, fieldName: string) {
    const idSocial = id.trim();
    const indexField = (await this.getIndexField(fieldName)) + 1;
    const rowData = await this.page.locator(`//td[@objectid="${idSocial}"][${indexField}]`).textContent();
    return rowData.trim();
  }

  //**Download file */
  async downloadFile(xpath: string): Promise<string> {
    await this.page.waitForSelector(xpath);
    await this.genLoc(xpath).click();
    const download = await this.page.waitForEvent("download");
    return download.path();
  }

  //*check file download được và file tải lên có giống nhau không*/

  async checkDataInDownloadFile(xpath: string, index: number, value: string[], path: string): Promise<boolean> {
    const datFileCSV = await readFileCSV(path);
    const file = await this.downloadFile(xpath);
    const readFile = await readDownloadFileCSV(file, "\t", index);
    let checkDataOnCSV = false;
    for (let j = 0; j < datFileCSV.length; j++) {
      checkDataOnCSV = JSON.stringify([datFileCSV[j].join()]) == JSON.stringify(readFile[j]);
      if (checkDataOnCSV == false) {
        return checkDataOnCSV;
      }
    }
    return true;
  }

  //**chuyển file csv thành object tương ứng với mỗi cột là 1 key*/

  async convertDataInVariable(path: string, template: string[]): Promise<object> {
    const dataResults = {};
    for (let i = 0; i < template.length; i++) {
      dataResults[`${template[i]}`] = [];
    }
    const datFileCSV = await readFileCSV(path);
    for (let i = 0; i < datFileCSV.length; i++) {
      for (let j = 0; j < datFileCSV[i].length; j++) {
        dataResults[`${template[j]}`].push(datFileCSV[i][j]);
      }
    }
    return dataResults;
  }

  getXpathIdSocialProof(socialProofName: string): Locator {
    return this.genLoc(`${this.getXpathRowWithProofName(socialProofName)}/../td[2]`);
  }

  getXpathCheckboxWithValue(socialProofValue: string): Locator {
    return this.genLoc(`${this.getXpathRowWithProofName(socialProofValue)}/../td[1]//div`);
  }

  getXpathCellWithIndex(index: number): string {
    return `(//table[contains(@class,'sonata-ba-list')]//tbody//tr//td)[${index}]`;
  }

  getXpathRowWithProofName(socialProofValue: string): string {
    return `//table[contains(@class,'sonata-ba-list')]//tbody//tr//td[normalize-space()='${socialProofValue}']`;
  }
}
