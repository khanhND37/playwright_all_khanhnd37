import { Page } from "@playwright/test";
import { PrintBasePage } from "@pages/dashboard/printbase";
import type { ActionClipart, ClipartFolder, GroupClipart } from "@types";

export class ClipartPage extends PrintBasePage {
  xpathPageClipart = "//div[@id='pod-clipart-folders']";
  xpathClipartDetail = "//div[@id='pod-clipart-folder-detail']";
  xpathPopupClipart = "//div[@class='s-modal-body']//div[@id='pod-clipart-folder-detail']";
  xpathBtnBackToListClipart = "//span[normalize-space()='Clipart folders']//parent::a";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * get xpath clipart folder by name
   */
  getXpathClipartFolderByName(clipartName: string): string {
    return `//a[normalize-space()='${clipartName}']`;
  }

  /**
   * xpath possition of image in clipart folder
   * @param index
   */
  xpathPositionClipartImage(index: string): string {
    return `(//tbody[contains(@class,'drag-clipart-container')]//div[@class='sort-symbol'])[${index}]`;
  }

  /**
   * Count clipart in list
   * @param nameClipart
   */
  async countClipartByName(nameClipart: string): Promise<number> {
    await this.page.waitForSelector("//div[contains(@class,'no-result') or @class='table-wrapper']");
    return this.page.locator(`//span[normalize-space()='${nameClipart}']//ancestor::tr`).count();
  }

  /**
   * count imgage in clipart folder
   */
  async countImageInClipart(): Promise<number> {
    await this.page.waitForSelector("//div[@class='container-upload-design section no-style']");
    return this.page.locator("//div[contains(@class,'image-in-table align-item-center')]//img").count();
  }

  xpathIconInLineByName(nameIcon: string): string {
    return `//tr[descendant::span[normalize-space()='${nameIcon}']]//td[contains(@class,'custom--align__middle')]`;
  }

  /**
   * Function delete img trong folder clipart
   * @param nameFolderClipart
   * @param index
   */
  async deleteImgInFolderClipart(nameFolderClipart: string, indexImg = "1", indexFolder = "1"): Promise<void> {
    await this.navigateToSubMenu("Library", "Clipart");
    await this.page.click(`(//span[normalize-space()='${nameFolderClipart}'])[${indexFolder}]`);
    await this.page.waitForSelector(`//h1[normalize-space()='${nameFolderClipart}']`);
    await this.page.click(`(//i[@class="mdi mdi-trash-can-outline mdi-18px"])[${indexImg}]`);
    await this.clickOnBtnWithLabel("Save changes");
  }

  /**
   * delete All Clipart Or Group By Name
   * @param nameGroupOrFolderClipart
   */
  async deleteCliparts(nameGroupOrFolderClipart: string, action: "Delete Clipart folders" | "Delete Clipart groups") {
    const xpathSelectAll = "//span[contains(@data-label,'Select all')]//label[@disabled='disabled']";
    await this.searchClipartOrGroup(nameGroupOrFolderClipart);
    if (!(await this.genLoc(xpathSelectAll).isVisible())) {
      await this.page.click("//span[contains(@data-label,'Select all')]//label//span[@class='s-check']");
      await this.page.click("//button[@class='s-button is-outline']");
      await this.page.click(`//div[@class='s-dropdown-content']//span[normalize-space()='${action}']`);
      await this.clickOnBtnWithLabel("Delete", 1);
      await this.waitUntilElementInvisible(
        "//div[@class='s-toast is-success is-bottom']//div[normalize-space()='Success']",
      );
    }
  }

  /**
   * Delete all clipart folders or groups
   */
  async deleteAllClipartFolderOrGroup(type: string) {
    await this.page.waitForSelector(
      `(//span[@data-label='Select all Clipart ${type}s']//label//input[@type='checkbox']//following-sibling::span)[1]`,
    );
    if (
      await this.genLoc(
        `//div[contains(@class,'no-result')]//div[contains(text(),'You have no ${type} yet')]`,
      ).isHidden()
    ) {
      await this.page.click(
        `(//span[@data-label='Select all Clipart ${type}s']//label//input[@type='checkbox']//following-sibling::span)[1]`,
      );
      await this.clickOnBtnWithLabel("Action", 1);
      await this.page.click(`//div[@class='s-dropdown-content']//span[normalize-space()='Delete Clipart ${type}s']`);
      await this.clickOnBtnWithLabel("Delete", 1);
      await this.waitUntilElementInvisible(
        "//div[@class='s-toast is-success is-bottom']//div[normalize-space()='Success']",
      );
      if (await this.page.locator(this.xpathToastMessage).isVisible()) {
        await this.waitUntilElementInvisible(this.xpathToastMessage);
      }
      await this.page.reload();
      await this.waitUntilElementVisible(
        `//div[contains(@class,'no-result')]//div[contains(text(),'You have no ${type} yet')]`,
      );
    }
  }

  /**
   * Delete or assign group for clipart folder
   * @param actionClipart
   */
  async actionWithClipart(actionClipart: ActionClipart) {
    const listFolder = actionClipart.clipart_name.split(">").map(item => item.trim());
    for (let i = 0; i < listFolder.length; i++) {
      await this.page.click(
        `(//span[normalize-space()='${listFolder[i]}']//ancestor::tr//label[@class='s-checkbox']//span)[1]`,
      );
    }
    await this.page.click("//button[@class='s-button is-outline']");
    await this.page.click(`//div[@class='s-dropdown-content']//span[normalize-space()='${actionClipart.action}']`);
    if (actionClipart.action === "Delete Clipart folders" || actionClipart.action === "Delete Clipart groups") {
      await this.clickOnBtnWithLabel("Delete", 1);
      await this.waitUntilElementInvisible(
        "//div[@class='s-toast is-success is-bottom']//div[normalize-space()='Success']",
      );
    } else {
      const xpathSelectClipart = `//span[@class='s-dropdown-item text-overflow']//span[normalize-space()='${actionClipart.group_name}']`;
      const xpathInputGroup =
        "//div[@id = 'clipart-list']//div[@class='s-input s-input--prefix s-input--suffix']//input";
      await this.page.click(xpathInputGroup);
      await this.clearInPutData(xpathInputGroup);
      await this.page.fill(xpathInputGroup, actionClipart.group_name);
      if (await this.page.isVisible(xpathSelectClipart)) {
        await this.page.click(xpathSelectClipart);
      } else {
        await this.page.click("//b[contains(text(),'Create group')]");
      }
      await this.clickOnBtnWithLabel("Assign", 1);
    }
  }

  /**
   * Search folder or group in list folder or group
   * @param name
   */
  async searchClipartOrGroup(name: string) {
    //search clipart folder
    await this.genLoc("[placeholder='Search by name']").fill(name);
    //Press Enter
    await this.genLoc("[placeholder='Search by name']").press("Enter");
    await this.page.waitForSelector("#all-products");
    await this.waitForElementVisibleThenInvisible("//div[@class='s-detail-loading__body']");
  }

  /**
   * Add new group clipart
   * @param groupClipart
   */
  async addGroupClipart(groupClipart: GroupClipart): Promise<void> {
    if (groupClipart.group_name) {
      await this.genLoc("//div[@class='s-form-item text-right']//input").fill(groupClipart.group_name);
    }
    if (groupClipart.action) {
      if (groupClipart.action === "Select existing clipart folders") {
        if (groupClipart.folder_name) {
          const listFolder = groupClipart.folder_name.split(",").map(item => item.trim());
          for (let i = 0; i < listFolder.length; i++) {
            await this.clickOnBtnWithLabel("Select existing clipart folders");
            await this.genLoc("[placeholder='Search for clipart folder']").fill(listFolder[i]);
            await this.genLoc("[placeholder='Search for clipart folder']").press("Enter");
            await this.page.click(
              `//div[normalize-space()='${listFolder[i]}']//parent::div[@class='item']//label//span[@class='s-check']`,
            );
            await this.clickOnBtnWithLabel("Save", 1);
          }
        }
      } else {
        await this.clickOnBtnWithLabel(groupClipart.action);
      }
    }
    if (groupClipart.action !== "Add new clipart folder") {
      await this.clickOnBtnWithLabel("Save changes");
      await this.waitForElementVisibleThenInvisible(this.xpathLoadForm);
    }
  }

  /**
   * Add list clipart folder
   * @param clipartInfos is list clipart folder
   * @param indexName
   * @param indexBtn
   */
  async addListClipart(clipartInfos: Array<ClipartFolder>, indexName = 1, indexBtn = 1) {
    for (let i = 0; i < clipartInfos.length; i++) {
      if (await this.page.locator(this.xpathIconClose).isVisible()) {
        await this.page.click(this.xpathIconClose);
      }
      await this.navigateToSubMenu("Library", "Clipart");
      if (clipartInfos[i].checkIsEdit == true) {
        await this.page.click(`(//span[normalize-space()='${clipartInfos[i].nameClipart}'])[1]`);
      } else {
        await this.clickOnBtnWithLabel("Create folder", 1);
      }
      await this.addNewClipartFolder(clipartInfos[i], indexName);
      await this.clickOnBtnWithLabel("Save changes", indexBtn);
      await this.page.waitForTimeout(2000);
      if (clipartInfos[i].message) {
        await this.checkMsgAfterCreated({
          errMsg: clipartInfos[i].message,
        });
      }
    }
  }

  /**
   * Add list group folder
   * @param groupCliparts
   */
  async addListGroupClipart(groupCliparts: Array<GroupClipart>) {
    for (let i = 0; i < groupCliparts.length; i++) {
      await this.navigateToSubMenu("Library", "Clipart");
      await this.clickElementWithLabel("p", "Clipart groups");
      await this.clickOnBtnWithLabel("Create group", 1);
      await this.addGroupClipart(groupCliparts[i]);
      if (groupCliparts[i].message) {
        await this.checkMsgAfterCreated({
          errMsg: groupCliparts[i].message,
        });
      }
      await this.waitForElementVisibleThenInvisible(this.xpathLoadForm);
      await this.page.waitForSelector("//div[@id='pod-clipart-folder-detail']");
    }
  }

  /**
   * delete folder in group detail
   * @param folderName
   */
  async deleteFolderInGroupDetail(folderName: string) {
    const listFolder = folderName.split(",").map(item => item.trim());
    for (let i = 0; i < listFolder.length; i++) {
      await this.page.click(
        `//table[contains(@class,'custom-table')]//td[normalize-space()='${listFolder[i]}']` +
          "//following-sibling::td//i[contains(@class,'mdi-trash-can-outline')]",
      );
    }
  }

  /**
   * Sort clipart folder
   * @param sortName
   */
  async sortClipartFolder(sortName: string) {
    await this.page.waitForSelector(
      "//div[@class='s-form-item__content']//label[contains(@class,'s-button s-dropdown-header')]",
    );
    await this.page.click("//div[@class='s-form-item__content']//label[contains(@class,'s-button s-dropdown-header')]");
    await this.page.click(`//span[contains(@class,'s-dropdown-item')]//span[normalize-space()='${sortName}']`);
  }

  async listActionWithClipart(action: Array<ActionClipart>) {
    for (let i = 0; i < action.length; i++) {
      await this.searchClipartOrGroup(action[i].clipart_name);
      await this.actionWithClipart(action[i]);
    }
  }

  async clickOnBtnEditClipartFolderByFolderName(folderName: string): Promise<void> {
    await this.genLoc(
      `//span[normalize-space()='${folderName}']//ancestor::label//following-sibling::div//div[2]//a`,
    ).click();
    await this.page.waitForSelector("//div[@class='s-animation-content s-modal-content']");
  }
}
