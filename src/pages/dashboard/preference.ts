import { SBPage } from "@pages/page";
import type { InfoPreferences } from "@types";
import { cloneObject } from "@utils/object";

export class PreferencesPage extends SBPage {
  /**
   * Edit info Preferences
   * @param info edit Favicon,Homepage title,Homepage description,Additional scripts,Password
   * */
  async editInfoOnPreferencesPage(infoPreferences: InfoPreferences) {
    if (infoPreferences.favicon) {
      await this.page.click("//p[normalize-space()='Edit']");
      await this.page.setInputFiles(
        "//span[normalize-space()='Change image']//input[@type='file']",
        infoPreferences.favicon,
      );
    }
    if (infoPreferences.title) {
      await this.inputTextBoxWithLabel("Homepage title", infoPreferences.title);
    }
    if (infoPreferences.description) {
      await this.inputTextAreaWithLabel("Homepage description", infoPreferences.description);
    }
    if (infoPreferences.password) {
      await this.inputTextBoxWithLabel("Password", infoPreferences.password);
    }
    if (infoPreferences.enable_password) {
      await this.isTickBoxChecked({ textLabel: "Enable password" });
    }
    if (infoPreferences.additional_scripts_head) {
      await this.page.click("//p[normalize-space()='Head']");
      await this.page.click("//div[@class='ace_content']");
      await this.page.keyboard.press("Control+A");
      await this.page.keyboard.press("Backspace");
      await this.page
        .locator("//div[@id='ace-scripts-head']//textarea[@class='ace_text-input']")
        .fill(infoPreferences.additional_scripts_head);
    }
    if (infoPreferences.additional_scripts_body) {
      await this.page.click("//p[normalize-space()='Body']");
      await this.page.click("//div[@class='ace_content']");
      await this.page.keyboard.press("Control+A");
      await this.page.keyboard.press("Backspace");
      await this.page
        .locator("//div[@id='ace-scripts-body']//textarea[@class='ace_text-input']")
        .fill(infoPreferences.additional_scripts_body);
    }
    const displayBtnSave = await this.checkButtonVisible("Save");
    if (displayBtnSave) {
      await this.clickOnBtnWithLabel("Save");
      let i = 0;
      let saveSuccess;
      do {
        saveSuccess = await this.isToastMsgVisible("Saving success");
        await this.page.waitForTimeout(3000);
        i++;
      } while (i <= 10 && !saveSuccess);
    }
  }

  /**
   * get info preferences
   * @param infoPreferences: Password,Homepage description,Homepage title,Additional scripts
   * */
  async getInfoOnPreferencesPage(infoPreferences: InfoPreferences): Promise<InfoPreferences> {
    const dataOnPreferencesClone = cloneObject(infoPreferences) as InfoPreferences;
    dataOnPreferencesClone.favicon = infoPreferences.favicon;
    if (infoPreferences.title) {
      dataOnPreferencesClone.title = await this.page.inputValue(
        "((//label[normalize-space()='Homepage title']//parent::div)//following-sibling::*)//input[@type='text']",
      );
    }
    if (infoPreferences.description) {
      dataOnPreferencesClone.description = await this.page.inputValue(
        "((//label[normalize-space()='Homepage description']//parent::div)//following-sibling::*)//textarea",
      );
    }
    if (infoPreferences.password) {
      dataOnPreferencesClone.password = await this.page.inputValue(
        "//div[@id='password-protection']//input[@type='text']",
      );
    }
    if (infoPreferences.enable_password) {
      const valueFillEnablePassword = await this.page
        .locator("//div[@id='password-protection']//input[@type='checkbox']")
        .getAttribute("value");
      if (valueFillEnablePassword === "true") {
        dataOnPreferencesClone.enable_password = true;
      } else {
        dataOnPreferencesClone.enable_password = false;
      }
    }
    if (infoPreferences.additional_scripts_head) {
      await this.page.click("//p[normalize-space()='Head']");
      await this.page.waitForSelector("//div[@id='ace-scripts-head']//div[@class='ace_line']");
      dataOnPreferencesClone.additional_scripts_head = await this.getTextContent(
        "//div[@id='ace-scripts-head']//div[@class='ace_line']",
      );
    }
    if (infoPreferences.additional_scripts_body) {
      await this.page.click("//p[normalize-space()='Body']");
      await this.page.waitForSelector("//div[@id='ace-scripts-body']//div[@class='ace_line']");
      dataOnPreferencesClone.additional_scripts_body = await this.getTextContent(
        "//div[@id='ace-scripts-body']//div[@class='ace_line']",
      );
    }
    return dataOnPreferencesClone;
  }

  /**
   * goto Preferences iin online store
   */
  async gotoPreferences() {
    await this.page.goto(`https://${this.domain}/admin/preferences`);
    await this.page.waitForLoadState("load");
  }
}
