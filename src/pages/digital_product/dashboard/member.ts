import { ProductPage } from "@pages/dashboard/products";
import type { InputMemberInfo, MemberInfo, MemberListInfo, OptionExportOld, Param, ProgressPopup } from "@types";

/**
 * @deprecated: use src/shopbase_creator/dashboard/ instead
 */
export class MemberPage extends ProductPage {
  /**
   * Get content if member list = empty
   * @param domainImg domain_image
   * @returns <object> data default in Member list screen: The store hasn't member
   */
  async getContentMemberEmpty(domainImg: string) {
    let img: string;
    img = await this.page.getAttribute("//span[@class='sb-table__empty-text']//img", "src");
    if (img.includes(domainImg)) {
      const images = img.split("/img/", 2);
      img = images[1].toString();
    }
    return {
      img: img,
      title: await this.page.innerText("//span[@class='sb-table__empty-text']//p[1]"),
      description: await this.page.innerText("//span[@class='sb-table__empty-text']//p[2]"),
    };
  }

  /**
   * Get fields into Member list page: The store has member
   * @returns <object> MemberListInfo: data default in Member list screen
   */
  async getMemberListInfo(): Promise<MemberListInfo> {
    return {
      title: await this.page.innerText("//div[contains(@class, 'sb-title')]"),
      btnImport: await this.genLoc("//button[normalize-space()='Import']").isVisible(),
      btnExport: await this.genLoc("//button[normalize-space()='Export']").isVisible(),
      btnAdd: await this.genLoc("//button[normalize-space()='Add member']").isVisible(),
      txtSearch: await this.genLoc("//input[@placeholder='Search members']").isVisible(),
      btnSort: await this.genLoc("//span[normalize-space()='Newest added']").isVisible(),
      btnFilter: await this.genLoc("//span[child::button[normalize-space()='Filter by products']]").isVisible(),
      titleColumn: (await this.page.innerText("//table[@class='sb-table__header sb-relative']/thead/tr")).replaceAll(
        "\n\t\n",
        ",",
      ),
      memberPage1: await this.genLoc("//tr[@class='sb-table__row']").count(),
    };
  }

  /**
   * Get member information at page 1
   * @param domainImg domain_image
   * @returns array<object> MemberInfo: Get member information at page 1
   */
  async getMemberInfo(domainImg: string): Promise<MemberInfo> {
    const total = await this.genLoc("//tr[@class='sb-table__row']").count();
    const memberInfo = [];
    for (let i = 1; i <= total; i++) {
      const info = {
        avatar: await this.page.getAttribute(`(//div[contains(@class,'image__container ')]/img)[${i}]`, "src"),
        name: await this.page.innerText(`(//div[child::div[contains(@class,'image__container ')]]//p)[${i}]`),
        email: await this.page.innerText(`(//td[@class='sb-table_1_column_2   '])[${i}]`),
        sale: (await this.page.innerText(`(//td[@class='sb-table_1_column_3   '])[${i}]`)).replaceAll(",", ""),
        addDate: await this.page.innerText(`(//td[@class='sb-table_1_column_4   '])[${i}]`),
        lastSignIn: await this.page.innerText(`(//td[@class='sb-table_1_column_5   '])[${i}]`),
      };
      if (info.avatar.includes(domainImg)) {
        const avatars = info.avatar.split("/img/", 2);
        info.avatar = avatars[1].toString();
      }
      memberInfo.push(info);
    }
    return memberInfo;
  }

  /**
   * Get data default when seller click button Add member
   * @returns <object> data default when seller click button Add member
   */
  async getDataDefaultInAddForm() {
    return {
      title: await this.page.innerText("//div[@class='sb-font sb-flex']"),
      firstName: await this.page.getAttribute("//parent::div[child::label[normalize-space()='First name']]", "class"),
      lastName: await this.page.getAttribute("//parent::div[child::label[normalize-space()='Last name']]", "class"),
      email: await this.page.getAttribute("//parent::div[child::label[normalize-space()='Email']]", "class"),
      note: await this.page.getAttribute("//parent::div[child::label[normalize-space()='Notes']]", "class"),
      tag: await this.page.getAttribute("//parent::div[child::label[normalize-space()='Tags']]", "class"),
      country: await this.page.innerText(
        "//div[child::label[normalize-space()='Country']]//span[@class='sb-button--label']",
      ),
      zipCode: await this.page.innerText(
        "//div[child::label[normalize-space()='Phone number']]//span[@class='sb-button--label']",
      ),
      btnAdd: await this.genLoc("//span[normalize-space()='Add member']").isEnabled(),
      btnCancel: await this.genLoc("//span[normalize-space()='Cancel']").isEnabled(),
    };
  }

  /**
   * Click btn Add member to navigate to add member page
   */
  async clickBtnAdd() {
    await this.genLoc("//button[normalize-space()='Add member']").click();
  }

  /**
   * Input member information to Add new a member
   * @param data
   */
  async inputMemberInfo(data: InputMemberInfo) {
    if (data.firstName) {
      await this.genLoc("//parent::div[child::label[normalize-space()='First name']]//input").fill(data.firstName);
    }
    if (data.lastName) {
      await this.genLoc("//parent::div[child::label[normalize-space()='Last name']]//input").fill(data.lastName);
    }
    await this.genLoc("//parent::div[child::label[normalize-space()='Email']]//input").fill(data.email);
    if (data.country) {
      await this.genLoc("//parent::div[child::label[normalize-space()='Country']]//button").click();
      await this.genLoc(`//li[normalize-space()='${data.country}']`).click();
    }
    if (data.zipCode) {
      await this.genLoc("//parent::div[child::label[normalize-space()='Phone number']]//button").click();
      await this.genLoc(`//li[normalize-space()='${data.zipCode}']`).click();
    }
    if (data.phone) {
      await this.genLoc("//parent::div[child::label[normalize-space()='Phone number']]//input").fill(data.phone);
    }
    if (data.note) {
      await this.genLoc("//parent::div[child::label[normalize-space()='Notes']]//textarea").fill(data.note);
    }
    if (data.tag) {
      await this.genLoc("//parent::div[child::label[normalize-space()='Tags']]//input").fill(data.tag);
    }
  }

  /**
   * Click btn: true = Add member; false = Cancel
   * @param isAdd
   */
  async clickBtnInAddForm(isAdd: boolean) {
    if (isAdd) {
      await this.genLoc("//button[normalize-space()='Add member']").click();
    } else {
      await this.genLoc("//button[normalize-space()='Cancel']").click();
    }
  }

  /**
   * Filter
   * @param name is product name
   */
  async selectProductToFilter(name: string) {
    if (await this.genLoc(`//main//div[normalize-space()='${name}'][2]`).isHidden()) {
      await this.genLoc(`//div[contains(@class,'item__label')]//div[normalize-space()='${name}'][2]`).click();
      await this.page.waitForLoadState("load");
    }
  }

  /**
   * Click btn Import
   */
  async clickBtnImport() {
    await this.genLoc("//button[normalize-space()='Import']").click();
  }

  /**
   * Get default data into Import popup
   * @returns <object> data default into Import popup
   */
  async getImportDefaultData() {
    return {
      title: await this.page.innerText("//div[@class='sb-popup__header']"),
      linkTempalate: await this.page.getAttribute("//a[normalize-space()='CSV template']", "href"),
      totalFileUploaded: await this.genLoc("//div[contains(@class,'sb-upload__file-item-name')]").count(),
      btnCancel: await this.genLoc("//button[normalize-space()='Cancel']").isVisible(),
      btnImport: await this.genLoc("//button[normalize-space()='Import members']").isDisabled(),
    };
  }

  /**
   * Get data in Import progress popup
   * @returns <object> data default in Import progress popup
   */
  async getImportProgressPopup(): Promise<ProgressPopup> {
    return {
      title: await this.page.innerText("//h4[@class='s-modal-title']"),
      content: (await this.page.innerText("(//div[@class='s-modal-body']/div)[1]")).replaceAll("\n", " "),
      btnClose: await this.genLoc("//button[normalize-space()='Close']").isEnabled(),
    };
  }

  /**
   * Input file and click btn Import
   * @param filePath is path file uploaded
   * @param isOverwrite is check/ uncheck checkbox Overwrite
   * @param btnName is button name: Cancel/ Import members
   */
  async importMember(filePath: string, isOverwrite: boolean, btnName: string) {
    await this.genLoc("//button[normalize-space()='Import']").click();
    if (isOverwrite) {
      await this.page.click("//span[normalize-space()='Overwrite existing members that have the same email']");
    }
    await this.page.setInputFiles("//input[@type='file' and @accept='.csv']", filePath);
    await this.genLoc(`//button[normalize-space()='${btnName}']`).click();
  }

  /**
   * Click button in Export popup
   * @param isExport have value: true = btn Export; false = btn Cancel
   */
  async clickBtnInExportPopup(isExport: boolean) {
    if (isExport) {
      await this.genLoc("//button[normalize-space()='Export members']").click();
    } else {
      await this.genLoc("//button[normalize-space()='Cancel']").click();
    }
  }

  /**
   * Click btn Export
   * Select options before export members
   * @param options select option to export member with type OptionExport
   */
  async selectOptionExportMember(options: OptionExportOld) {
    await this.genLoc("//button[normalize-space()='Export']").click();
    await this.genLoc(
      `//label[normalize-space()='Export']//following::span[normalize-space()='${options.option}']`,
    ).click();
    await this.genLoc(
      `//label[normalize-space()='Export as']//following::span[normalize-space()='${options.file}']`,
    ).click();
  }

  /**
   * Export members with condition
   * @param param
   * @param productName is product name
   * @param totalSelected is total product selected to filter
   * @param options select option to export member
   */
  async exportMember(param: Param, productName: string[], totalSelected: number, options: OptionExportOld) {
    if (param.keyword) {
      await this.genLoc("//input[@placeholder='Search members']").fill(param.keyword);
      await this.page.waitForLoadState("load");
      await this.selectOptionExportMember(options);
    } else if (productName && totalSelected) {
      await this.genLoc("//button[normalize-space()='Filter by products']").click();
      for (let i = 0; i < totalSelected; i++) {
        if (await this.genLoc(`//main//div[normalize-space()='${productName[i]}'][2]`).isHidden()) {
          await this.genLoc(
            `//div[contains(@class,'item__label')]//div[normalize-space()='${productName[i]}'][2]`,
          ).click();
          await this.page.waitForLoadState("load");
        }
      }
      await this.selectOptionExportMember(options);
    } else {
      await this.selectOptionExportMember(options);
    }
  }

  /**
   * Clear keyword in textbox search
   * @returns <number> keyword length after clearing
   */
  async clearKeyword(): Promise<number> {
    await this.genLoc("//input[@placeholder='Search members']").fill("");
    const keyword = await this.genLoc("//input[@placeholder='Search members']").inputValue();
    return keyword.length;
  }
}
