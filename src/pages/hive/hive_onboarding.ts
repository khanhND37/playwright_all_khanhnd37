import { Locator, Page } from "@playwright/test";
import type { Content, ContentOnboard, ContentQuestion, OnboardFormData, OnboardItemFormData, Question } from "@types";
import { HivePage } from "./core";

const LanguageKey = {
  English: "en",
  Chinese: "zh-CN",
};

export class HiveOnboard extends HivePage {
  usernameInput: Locator;
  passwordInput: Locator;
  loginButton: Locator;

  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
    this.usernameInput = this.genLoc('[placeholder="Username"]');
    this.passwordInput = this.genLoc('[placeholder="Password"]');
    this.loginButton = page.locator("text=Log in");
  }

  xpathBtnAddNewOnboarding = "//div[@class='navbar-collapse']//i[@class='fa fa-plus-circle']";
  xpathOnboardingNameOnList =
    "(//table[contains(@class,'table table-bordered')]//tbody//td[contains(@class,'list-field-text')])[1]";
  xpathMessageSuccess = "//div[@class='alert alert-success alert-dismissable']";

  async clickBtnConfirm(buttonName: string) {
    await this.genLoc(`//button[normalize-space()='${buttonName}']`).click();
  }

  async filterOnboardingOnList(filterOption: string, filterValue: string): Promise<void> {
    await this.genLoc("//li[@class='dropdown sonata-actions']//i[@class='fa fa-filter']").click();
    await this.genLoc(`//ul[@class='dropdown-menu']//a[normalize-space()='${filterOption}']`).click();
    await this.page.fill(`//label[text()='${filterOption}']//parent::div//input[@class=' form-control']`, filterValue);
    await this.genLoc("//button[@class='btn btn-primary']//i").click();
  }

  /**go to onboard by url*/
  async navigateOnboard() {
    await this.goto(`admin/app/onboarding/list`);
    await this.page.waitForSelector("//div[@class='navbar-left']//span[text()='Onboarding List']");
  }

  /**get mảng text của một xpath bất kì
   * @param xpath cần lấy text
   * */
  async getAllText(xpath: string): Promise<string[]> {
    const locator = this.page.locator(xpath);
    const texts = await locator.evaluateAll(list => list.map(element => element.textContent.trim()));
    return texts;
  }

  /**click action any*/
  async clickAction(xpath: string) {
    await this.page.locator(xpath).click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /***
   * lấy value của ô input select
   * @param id của ô cần lấy giá trị
   * @value value giá trị của ô select cần lấy giá tr
   */
  async getValueSelectOption(id: string, value: string) {
    const xpathOption = `//select[@id="${id}"]//option[normalize-space()="${value}"]`;
    const result = await this.page.locator(xpathOption).getAttribute("value");
    return result;
  }

  /**
   * get value input select chuyển ngôn ngữ
   * */
  async getValueLanguage(): Promise<string> {
    const value = await this.page.locator(`//span[@id="select2-chosen-1"]`).textContent();
    return LanguageKey[`${value}`];
  }

  /**
   * chọn giá trị cho cần select
   * @param id id của ô cần select
   * @param value giá trị cần select
   * */
  async selectOptionTabContent(id: string, value: string) {
    await this.page.locator(`//ul[@id="${id}"]//li[normalize-space()="${value}"]`).click();
  }

  /**
   * fill data form add onboarding
   *
   * @param OnboardFormData data fill form edit|create onboard
   * */
  async fillOnboardFormData(data: OnboardFormData) {
    await this.fillInputData("Name", data.name);
    await this.fillInputData("Test Shop Id", data.shop_id);
    await this.selectData("Store Type", data.store_type);
    await this.selectData("Country", data.country);
    await this.fillInputData("Priority", data.priority);
    await this.page
      .locator(`//label[normalize-space()="Status"]/../div[@class="sonata-ba-field sonata-ba-field-standard-natural"]`)
      .click();
    const xpathOptionStatus = `//ul[@id="select2-results-4"]//div[normalize-space()="${data.status}"]`;
    await this.page.locator(xpathOptionStatus).click();

    //fill data tab general
    if (data.group_question) {
      await this.fillDataSegment(data.group_question.content_question, data.group_question.condition);
    }

    //fill data tab content
    await this.page.locator('//ul[@class="nav nav-tabs"]//li//a[normalize-space()="Content"]').click();
    await this.page.locator(`//div[@id="s2id_language-onboarding"]`).click();
    await this.selectOptionTabContent("select2-results-5", data.data_content["language"]);
    const language = await this.getValueSelectOption("language-onboarding", data.data_content["language"]);

    // nhập data onboarding 1 và onboarding 2
    for (let i = 0; i < 2; i++) {
      await this.page.locator(`//div[@class="select2-container onboarding-no"]`).click();
      await this.selectOptionTabContent("select2-results-6", `Onboarding_${i + 1}`);
      const tabOnboard = await this.getValueSelectOption("onboarding-no", `Onboarding_${i + 1}`);
      const pathBtnDelOnboard = `//div[@class="col-md-12 mt-10 list-items-${language}-${tabOnboard}"]//p[normalize-space()="X"]`;
      await this.deleteDataOnboard(pathBtnDelOnboard);
      await this.page
        .locator(
          `//div[@id="div-onboarding-${language}-${tabOnboard}"]//input[@name="${language}[${tabOnboard}][title]"]`,
        )
        .fill(data.data_content.onboard1.onboard_title);
      await this.fillDataOnboard(tabOnboard, language, data.data_content.onboard1.onboard_item_form_data);
    }
  }

  /**
   * fill data vào từng item onboard
   * @param tabItem :onboarding_1|onboarding_2
   * @param language english|china
   * @param data content onboard
   * */
  async fillDataOnboard(tabItem: string, language: string, data: OnboardItemFormData[]) {
    await this.page.locator(`(//div[@class="col-md-12 mt-10 list-items-${language}-${tabItem}"]//summary)[1]`).click();
    const numItemOnboard = data.length;
    for (let i = 0; i < numItemOnboard; i++) {
      await this.fillContentOnboardFormData(data[i], language, tabItem, i + 1);
      if (i != numItemOnboard - 1) {
        await this.page
          .locator(`//div[@id="div-onboarding-${language}-${tabItem}"]` + `//button[normalize-space()="Add New Item"]`)
          .click();
      }
    }
  }

  /**
   * xóa dữ liệu trước khi thêm
   * @param xpath của dữ liệu cần xóa
   * */
  async deleteDataOnboard(xpath: string) {
    const btnDeletes = await this.page.$$(xpath);
    const numBtnDelete = btnDeletes.length;
    if (numBtnDelete > 1) {
      for (let i = 1; i < numBtnDelete; i++) {
        await btnDeletes[i].click();
      }
    }
  }

  /** fill question in form onboard
   * @param dataQuestion
   * @param index vi tri
   * */
  async fillQuestionFormData(dataQuestion: Question, index: number) {
    const xpathSelectQuestion =
      `(((((((//div[@id="onboardingSegmentApp"]//div` +
      `[@class="col-xs-11 col-xs-offset-1 mb-15"])[${index}])` +
      `//div[@class="row mb-15"])[2])//div[@class="row mb-15"])[1])//select)[1]`;
    await this.page.locator(xpathSelectQuestion).selectOption({ label: dataQuestion["question"] });

    const xpathSelectCondition =
      `(((((((//div[@id="onboardingSegmentApp"]//div` +
      `[@class="col-xs-11 col-xs-offset-1 mb-15"])[${index}])` +
      `//div[@class="row mb-15"])[2])//div[@class="row mb-15"])[1])//select)[1]`;
    await this.page.locator(xpathSelectCondition).selectOption({ label: dataQuestion["condition"] });

    const xpathSelectAnswer =
      `(((((((//div[@id="onboardingSegmentApp"]//div` +
      `[@class="col-xs-11 col-xs-offset-1 mb-15"])[${index}])` +
      `//div[@class="row mb-15"])[2])//div[@class="row mb-15"])[1])//select)[1]`;
    await this.page.locator(xpathSelectAnswer).selectOption({ label: dataQuestion["answer"] });
  }

  /**fill data input
   * @param fieldName label of input
   * @param value value of input
   * */
  async fillInputData(fieldName: string, value: string) {
    if (value) {
      await this.page.locator(`//label[normalize-space()='${fieldName}']/../div/input`).fill(value);
    }
  }

  /**fill data into input select
   * @param fieldName label of input
   * @param value value of input
   * */
  async selectData(fieldName: string, value: string) {
    if (value) {
      const xpathFieldDeletes = `//label[normalize-space()="${fieldName}"]/../div//ul//li[@class="select2-search-choice"]//a`;
      const dataDeletes = await this.page.$$(xpathFieldDeletes);
      for (let j = 0; j < dataDeletes.length; j++) {
        await dataDeletes[j].click();
      }
      for (let i = 0; i < value.length; i++) {
        await this.page.locator(`//label[normalize-space()="${fieldName}"]/../div`).click();
        const storeType = value[i];
        await this.page.locator(`//li[@role="presentation"]//div[normalize-space()="${storeType}"]`).click();
      }
    }
  }

  /**
   *fill content onboarding
   * @param data info
   * @param language
   * @param indexOnboard
   * @param index
   * */
  async fillContentOnboardFormData(data: OnboardItemFormData, language: string, indexOnboard: string, index: number) {
    if (data.event) {
      await this.page
        .locator(
          `((//div[@class="col-md-12 mt-10 list-items-${language}-${indexOnboard}"]/div)[${index}])//` +
            `div[@class="select2-container onboarding-name"]`,
        )
        .click();
      await this.page.locator(`//li[@role="presentation"]//div[normalize-space()="${data.event}"]`).click();
    }
    await this.fillDataFormInputTabContent(language, indexOnboard, "title-onboarding", data.title, index);
    await this.fillDataFormInputTabContent(language, indexOnboard, "icon", data.icon, index);
    await this.fillDataFormInputTabContent(language, indexOnboard, "progress-bar-desc", data.progress_bar_desc, index);
    if (data.content) {
      await this.fillDataInputTabContent("content", data.content, language, indexOnboard, index);
    }
    if (data.content_after_done) {
      await this.fillDataInputTabContent("contentAfterDone", data.content_after_done, language, indexOnboard, index);
    }
  }
  async fillDataFormInputTabContent(
    language: string,
    indexOnboard: string,
    fieldName: string,
    content: string,
    index: number,
  ) {
    if (content) {
      await this.page
        .locator(`(//input[@name="${language}[${indexOnboard}][${fieldName}][]"])[${index}]`)
        .fill(content);
    }
  }

  /**
   *fill data content step in onboard
   *  @param nameContent
   *  @param data value of input
   *  @param language value input select language
   *  @param indexOnboard value input select onboard
   *  @param index
   * */
  async fillDataInputTabContent(
    nameContent: string,
    data: Content,
    language: string,
    indexOnboard: string,
    index: number,
  ) {
    for (let i = 0; i < Object.keys(data).length; i++) {
      let name;
      const key = Object.keys(data)[i];
      const value = data[`${key}`];
      switch (key) {
        case "title":
          name = "title-content";
          break;
        case "desc":
          name = "description-content";
          break;
        case "button":
          name = "buttom-content";
          break;
        case "secondary_button":
          name = "second-buttom-content";
          break;
        case "link1":
          name = "link-buttom-content";
          break;
        case "link2":
          name = "link-second-buttom-content";
          break;
        case "image":
          name = "image-content";
          break;
      }
      if (nameContent == "content") {
        await this.fillDataFormInputTabContent(language, indexOnboard, name, value, index);
      } else {
        await this.fillDataFormInputTabContent(language, indexOnboard, name + `-done`, value, index);
      }
    }
  }

  /**
   * fill info question
   *@param data
   * @param condition
   * */
  async fillDataSegment(data: ContentQuestion[], condition: string) {
    if (data) {
      const xpathButtonAdd = `//button[normalize-space()="Add a new group"]`;
      const xpathSelectOption = `//label[normalize-space()="Segment"]/../div//div[@id="onboardingSegmentApp"]/div[@class="row mb-15"]//select`;
      await this.page.locator(xpathSelectOption).selectOption({ label: `${condition}` });
      //xử lý logic add group condition
      const xpathRowBtbDelCondition = `//div[contains(text(),'of the following conditions match')]//button`;
      const groupConditions = await this.page.$$(xpathRowBtbDelCondition);
      const lengthGroupConditions = groupConditions.length;
      const isBtnDel = await this.page.locator(xpathRowBtbDelCondition).isVisible();
      if (isBtnDel) {
        for (let i = 0; i < lengthGroupConditions; i++) {
          await groupConditions[i].click();
        }
      }
      for (let j = 0; j < data.length; j++) {
        await this.page.locator(xpathButtonAdd).click();
        const selectOptionCondition = `((//div[@id="onboardingSegmentApp"]//div[contains(@class,"offset"]))[${
          j + 1
        }]/child::div)[1]//select[@class="form-control"]`;
        const xpathBtnAddCondition = `(//button[normalize-space()="Add a new condition"])[${j + 1}]`;
        const questionGroupItem = data[j].questions;
        await this.page.locator(selectOptionCondition).selectOption({ label: data[j].condition });
        for (let k = 0; k < questionGroupItem.length; k++) {
          if (k != questionGroupItem.length - 1) {
            await this.page.locator(xpathBtnAddCondition).click();
          }
          await this.fillQuestionFormData(questionGroupItem[k], k + 1);
        }
      }
    }
  }

  async filterFieldStatus(status: string) {
    const xpathBtnFilter = '//li[@class="dropdown sonata-actions"]';
    await this.page.locator(xpathBtnFilter).click();
    const xpathCheckBoxItem = `//li[@class="dropdown sonata-actions open"]//a[normalize-space()="Status"]`;
    await this.page.locator(xpathCheckBoxItem).click();
    await this.page.locator(`//div[@id="s2id_filter_status_value"]`).click();
    await this.page.locator(`//ul[@id="select2-results-3"]//li[normalize-space()="${status}"]`).click();
  }

  /**
   * lấy vị trị của của trường bâất kì
   * @param fieldName trường cần lấy index
   * */
  async getIndexByFieldName(fieldName: string): Promise<number> {
    const xpathFieldName = `//tr[@class="sonata-ba-list-field-header"]//th`;
    const dataFields = await this.getAllText(xpathFieldName);
    const index = dataFields.indexOf(`${fieldName}`);
    return index;
  }

  async getAllRecordByFieldDefault(status: string, fieldName: string): Promise<number> {
    let id;
    const index = await this.getIndexByFieldName(fieldName);
    const xpathRowIds =
      `//table[@class="table table-bordered table-striped table-hover sonata-ba-list"]` + `//tbody//td[1]//input`;
    const elmRowDefault = await this.page.locator(xpathRowIds);
    const arrObjectIds = await elmRowDefault.evaluateAll(list => list.map(element => element.getAttribute("value")));
    for (let i = 0; i < arrObjectIds.length; i++) {
      id = arrObjectIds[i];
      const xpathRowDefaule =
        `(//table[@class="table table-bordered table-striped table-hover sonata-ba-list"]` +
        `//tbody//td[@objectid="${id}"])[${index + 1}]`;
      let defaultResult = await this.page.locator(xpathRowDefaule).textContent();
      defaultResult = defaultResult.trim();
      if (defaultResult == "yes") {
        return id;
      }
    }
  }
  convertString(fieldName: string) {
    const words = fieldName.split(" ");
    for (let i = 0; i < words.length; i++) {
      if (i == 0) {
        words[0] = words[i][0].toLowerCase() + words[i].substring(1);
      } else {
        words[i] = words[i][0].toUpperCase() + words[i].substring(1);
      }
    }
    const textAfterConvert = words.join("");
    return textAfterConvert.replaceAll(" ", "");
  }

  async getDataTabGeneral(id: number, action: string, fieldNames: string[]): Promise<object> {
    const data = {};
    const xpathAction = `//td[@objectid="${id}"]//a[normalize-space()="${action}"]`;
    await this.clickAction(xpathAction);
    await this.page.locator(`//ul[@class="nav nav-tabs"]//li[normalize-space()="Content"]`).click();

    await this.page.locator(`//ul[@class="nav nav-tabs"]//li[normalize-space()="General"]`).click();
    for (let i = 0; i < fieldNames.length; i++) {
      const xpathFieldName =
        `//div[@class="tab-pane fade active in"]//table//tr//` + `th[normalize-space()="${fieldNames[i]}"]/../td`;
      let content = await this.page.locator(xpathFieldName).textContent();
      content = content.trim();
      const key = this.convertString(fieldNames[i]);
      data[`${key}`] = content;
    }
    return data;
  }
  async getDataFieldTabContent(
    eng: string,
    tabOnboard: string,
    fieldName: string,
    indexContent,
    indexField = 1,
  ): Promise<string> {
    const xpathFieldName =
      `((((//div[@class="col-md-12 mt-10 list-items-${eng}-${tabOnboard}"]/div)[${indexContent}]/` +
      `div//label[normalize-space()="${fieldName}"])[${indexField}])/../following-sibling::div)[1]/span`;
    let content = await this.page.locator(xpathFieldName).textContent();
    content = content.trim();
    return content;
  }

  /**
   * get data 1 onboarding
   * */
  async getDaTaTabContent(tabName: string): Promise<ContentOnboard> {
    await this.page.locator(`//ul[@class="nav nav-tabs"]//li[normalize-space()="Content"]`).click();
    const english = await this.getValueLanguage();
    await this.page.locator(`//div[@class="select2-container onboarding-no"]`).click();
    await this.selectOptionTabContent("select2-results-2", `${tabName}`);
    const tabOnboard = await this.getValueSelectOption("onboarding-no", `${tabName}`);
    const xpathTitle =
      `//div[@id="div-onboarding-${english}-${tabOnboard}"]//` + `div[@class="col-md-12 mt-10 fl-in"]//span`;
    let valueOnboardTitle = await this.page.locator(xpathTitle).textContent();
    valueOnboardTitle = valueOnboardTitle.trim();
    const xpathDataContentOnboard = `//div[@class="col-md-12 mt-10 list-items-${english}-${tabOnboard}"]/div`;
    const numContentOnboard = await this.page.locator(xpathDataContentOnboard).count();
    const arrItemOnboards = [];
    for (let i = 0; i < numContentOnboard; i++) {
      const itemOnboard = {};
      itemOnboard["event"] = await this.getDataFieldTabContent(english, tabOnboard, "Onboarding event:", i + 1);
      itemOnboard["title"] = await this.getDataFieldTabContent(english, tabOnboard, "Title:", i + 1);
      itemOnboard["icon"] = await this.getDataFieldTabContent(english, tabOnboard, "Icon:", i + 1);
      itemOnboard["progressBarDesc"] = await this.getDataFieldTabContent(
        english,
        tabOnboard,
        "Progress bar desc:",
        i + 1,
      );
      itemOnboard["content"] = {};
      itemOnboard["content"]["title"] = await this.getDataFieldTabContent(english, tabOnboard, "Title:", i + 1, 2);
      itemOnboard["content"].desc = await this.getDataFieldTabContent(english, tabOnboard, "Desc:", i + 1);
      itemOnboard["content"]["button"] = await this.getDataFieldTabContent(english, tabOnboard, "Button:", i + 1);
      itemOnboard["content"]["secondaryButton"] = await this.getDataFieldTabContent(
        english,
        tabOnboard,
        "Secondary-Button:",
        i + 1,
      );
      itemOnboard["content"]["link1"] = await this.getDataFieldTabContent(english, tabOnboard, "Link:", i + 1);
      itemOnboard["content"]["Image"] = await this.getDataFieldTabContent(english, tabOnboard, "Image:", i + 1);
      itemOnboard["content"]["link2"] = await this.getDataFieldTabContent(english, tabOnboard, "Link:", i + 1, 2);
      itemOnboard["contentAfterDone"] = {};
      itemOnboard["contentAfterDone"]["title"] = await this.getDataFieldTabContent(
        english,
        tabOnboard,
        "Title:",
        i + 1,
        3,
      );
      itemOnboard["contentAfterDone"]["desc"] = await this.getDataFieldTabContent(
        english,
        tabOnboard,
        "Desc:",
        i + 1,
        2,
      );
      itemOnboard["contentAfterDone"]["button"] = await this.getDataFieldTabContent(
        english,
        tabOnboard,
        "Button:",
        i + 1,
        2,
      );
      itemOnboard["contentAfterDone"]["secondaryButton"] = await this.getDataFieldTabContent(
        english,
        tabOnboard,
        "Secondary-Button:",
        i + 1,
        2,
      );
      itemOnboard["contentAfterDone"]["link1"] = await this.getDataFieldTabContent(
        english,
        tabOnboard,
        "Link:",
        i + 1,
        3,
      );
      itemOnboard["contentAfterDone"]["Image"] = await this.getDataFieldTabContent(
        english,
        tabOnboard,
        "Image:",
        i + 1,
        2,
      );
      itemOnboard["contentAfterDone"]["link2"] = await this.getDataFieldTabContent(
        english,
        tabOnboard,
        "Link:",
        i + 1,
        4,
      );
      arrItemOnboards.push(itemOnboard);
    }

    const data = {
      onboard_title: valueOnboardTitle,
      onboard_item_form_data: arrItemOnboards,
    };
    return data;
  }
}
