import { Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import { SFHome } from "@sf_pages/homepage";
import type { FormFieldSetting, FormStyleSettings } from "@types";

export class ContactFormPage extends SBPage {
  contactFormSelector = "div.w-100.block-form";
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Fill field on contact form
   * @param path xpath for field need to be filled
   * @param value
   */
  async fillField(path: string, value: string, type: "input" | "select" | "check" | "textarea" = "input") {
    const locator = this.genLoc(path).first();
    switch (type) {
      case "select":
        await locator.selectOption({ value: value });
        break;
      case "input":
      case "textarea":
        await locator.fill(value);
        break;
      case "check":
        await locator.check();
        break;
    }
  }

  /**
   * Wait for form submited by show alert message
   */
  async waitForFormSubmited(type: string) {
    switch (type) {
      case "message":
        await this.page.waitForSelector(".alert__message");
        break;
      case "coupon":
        await this.page.waitForSelector(".block-form__coupon");
        break;
      case "redirect":
        await this.page.waitForNavigation();
    }
  }

  /**
   *
   * @param pageName
   * @param inputFields
   * @param inputLocator
   * @param inputForm
   * @param option
   */
  async submitForm(
    inputFields: Array<string>,
    inputLocator: { [key: string]: string },
    inputForm: { [key: string]: string },
    option?: {
      pageName?: string;
      inputType?: { [key: string]: "input" | "select" | "check" };
      waitType?: "message" | "redirect" | "coupon";
    },
  ) {
    if (option?.pageName) {
      const sfHome = new SFHome(this.page, this.domain);
      await sfHome.gotoPage(option?.pageName);
      await this.page.waitForLoadState("networkidle");
    }
    for await (const input of inputFields) {
      await this.fillField(inputLocator[input], inputForm[input], option.inputType?.[input]);
    }
    await this.page.click(`//button[normalize-space()='Submit']`);
    const { waitType = "message" } = option;
    await this.waitForFormSubmited(waitType);
  }

  async getLocatorByPlaceholder(placeholder: string) {
    return this.genLoc(`//input[@placeholder="${placeholder}"]`);
  }

  /**
   * Get input locator by label
   * @param label
   * @param option
   * @returns
   */
  getInputLocatorByLabel(
    label: string,
    option?: { type?: "input" | "textarea" | "check" | "select"; optionValue?: string },
  ): string {
    let selector = ``;
    switch (option.type) {
      case "check":
        selector = `label[contains(normalize-space(), '${option.optionValue}')]`;
        break;
      default:
        selector = option.type || "input";
    }
    return `(//div[contains(@class, 'block-form')]//label[contains(normalize-space(), '${label}')]/following-sibling::div//${selector})[1]`;
  }

  /**
   * Get Fields and Input Locator
   * @param contentSettings
   * @param inputType
   * @param inputForm
   * @returns
   */
  getFieldsAndInputLocator(
    formSettings: FormStyleSettings,
    inputType: { [key: string]: "input" | "textarea" | "check" | "select" },
    input: { [key: string]: string },
    option?: {
      randomMail?: boolean;
    },
  ): {
    fields: Array<FormFieldSetting>;
    inputSelectors: { [key: string]: string };
    inputForm: { [key: string]: string };
  } {
    const inputSelectors = {};
    const inputForm = { ...input };
    const fields = formSettings.fields;
    for (const field of fields) {
      const label = field.label || field.name;
      const selector = this.getInputLocatorByLabel(label, {
        type: inputType[label],
        optionValue: input[label],
      });

      inputSelectors[label] = selector;
      if (option?.randomMail && field.name === "Email") {
        inputForm[label] = `test${Date.now()}@${inputForm[label].split("@")[1]}`;
      }
    }

    return {
      fields,
      inputSelectors,
      inputForm,
    };
  }

  /**
   * Get coupon code
   * @returns
   */
  async getCouponCode() {
    return await this.genLoc(".block-form__coupon-code").innerText();
  }
}
