import type { FormFieldSetting, FormStyleSettings, LayerStyles } from "@types";
import { Page } from "@playwright/test";
import { WebBuilder } from "./web_builder";

export class WbBlockFormPage extends WebBuilder {
  constructor(page: Page, domain?: string) {
    super(page, domain);
  }

  /**
   * Handle form data
   * @param setting
   */
  async handleForm(setting: FormStyleSettings) {
    if (setting.form_title) {
      await this.inputTextBox("form_title", setting.form_title);
    }

    if (setting.save_as) {
      await this.selectDropDown("save_as", setting.save_as);
    }

    if (setting.save_email) {
      await this.inputTextBox("save_email", setting.save_email);
    }

    if (setting.after_submit) {
      await this.selectDropDown("after_submit", setting.after_submit);
    }

    if (setting.coupon) {
      await this.inputTextBox("coupon", setting.coupon);
    }

    if (setting.submit_message) {
      await this.inputTextBox("submit_message", setting.submit_message);
    }

    if (setting.submit_url) {
      await this.inputTextBox("submit_url", setting.submit_url);
    }

    if (setting.button_label) {
      await this.inputTextBox("button_label", setting.button_label);
    }

    if (setting.send_contact?.length) {
      await this.selectMultiple("send_contact", setting.send_contact);
    }

    if (setting.opt_in_option) {
      await this.switchToggle("opt_in", setting.opt_in_option);
    }

    if (setting.fields) {
      await this.handleFields(setting.fields);
    }
  }

  getSelectorFormByName(name: string) {
    return `${this.getSelectorByLabel(
      "fields",
    )}//div[contains(@class, 'w-builder__form--item') and contains(normalize-space(), '${name}')][1]`;
  }

  getSelectorFormFieldByLabel(label: string) {
    return `//div[contains(@class, 'w-builder__form-popover')]//div[contains(@class, 'sb-form-item') and contains(normalize-space(), '${label}')]`;
  }

  async clickFormAction(name: string, action: string) {
    let selector;
    switch (action) {
      case "edit":
        selector = `${this.getSelectorFormByName(name)}/span[1]`;
        break;
      case "delete":
        selector = `${this.getSelectorFormByName(name)}/button[1]`;
        break;
    }
    if (selector) {
      await this.page.click(selector);
    }
  }

  async inputForm(label: string, text: string) {
    const elements = await this.genLoc(
      `${this.getSelectorFormFieldByLabel(label)}//input[@class='sb-input__input']`,
    ).elementHandles();
    for await (const element of elements) {
      if (!(await element.isVisible())) {
        continue;
      }
      await element.fill(text);
    }
  }

  async handleOptions(options: Array<string>, index = 1) {
    // count options
    const count = await this.genLoc(`${this.formScrollablePopoverSelector}/div`).count();
    const diff = options.length - count;

    // add options
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        await this.clickOnBtnWithLabel("Add option", index);
      }
    } else if (diff < 0) {
      // remove options
      for (let i = 0; i < Math.abs(diff); i++) {
        const locator = this.genLoc(`(${this.formScrollablePopoverSelector}/div//button)[1]`);
        if (!(await locator.isVisible())) {
          continue;
        }

        await locator.click();
      }
    }
    for await (const [index, option] of options.entries()) {
      const locator = this.genLoc(
        `(${this.formScrollablePopoverSelector}//label[contains(normalize-space(), 'Option ${
          index + 1
        }')]/following-sibling::div//input)[1]`,
      );
      if (!(await locator.isVisible())) {
        continue;
      }
      await locator.fill(option);
    }
  }

  async handleFields(fields: Array<FormFieldSetting>) {
    // Clear all field first
    const removeButtonSelector = `${this.getSelectorByLabel(
      "fields",
    )}//div[contains(@class, 'w-builder__form--item')]/button[1]`;
    for (const el of await this.genLoc(removeButtonSelector).elementHandles()) {
      await el.click();
    }

    // Update email field
    const emailField = fields.find(field => field.name === "Email");
    await this.clickFormAction(emailField.name, "edit");
    if (emailField.label) {
      await this.inputForm("Label", emailField.label);
    }
    if (emailField.placeholder) {
      await this.inputForm("Placeholder", emailField.placeholder);
    }
    await this.switchToTab("Content");
    let optionNum = 0;
    for await (const field of fields.filter(field => field.name !== "Email")) {
      await this.clickOnBtnWithLabel("Add field");
      await this.clickOnBtnWithLabel(field.name);
      await this.clickFormAction(field.name, "edit");
      if (field.label) {
        await this.inputForm("Label", field.label);
      }
      if (field.placeholder) {
        await this.inputForm("Placeholder", field.placeholder);
      }
      if (field.options) {
        optionNum++;
        await this.handleOptions(field.options, optionNum);
      }
      await this.switchToTab("Content");
    }
  }

  async doSetting(designSettings: LayerStyles, formSettings: FormStyleSettings, save = false) {
    await this.changeDesign(designSettings);
    await this.switchToTab("Content");
    await this.handleForm(formSettings);
    // For sure cache is loaded
    await this.waitAbit(1000);
    if (save) {
      await this.clickBtnNavigationBar("save");
      await this.page.waitForLoadState("networkidle");
    }
  }
}
