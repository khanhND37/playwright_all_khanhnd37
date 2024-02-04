import { DashboardPage } from "@pages/dashboard/dashboard";
import { Page } from "@playwright/test";

export class SettingGeneralPage extends DashboardPage {
  public FormLabel = {
    customerEmail: "Customer Email",
  };

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathProductPreferences = "//div[normalize-space()='Product preferences']";
  xpathInputValueProductPreferences =
    "//div[@id='productPreferences']//div[@class='s-form-item__content']//label//input[@value='false']";
  xpathMessageSaveChange = "//div[@class='s-toast is-dark is-bottom']//div";
  xpathBlockProductPreferences = "//div[@id='productPreferences']//div[@class='row']";
  xpathInputAddress = "//input[@placeholder='Enter address']";
  xpathInputCity = "//input[@placeholder='Enter city']";
  xpathInputZipCode = "//input[@placeholder='Enter postal code']";
  xpathProductPreferencesDes =
    "//div//p[normalize-space()='Choose how your product be reviewed once it has first order.']";
  xpathProductPreferencesLink = "//a[contains(normalize-space(),'more about our policy')]";
  xpathAllowCheckBox =
    "//span[normalize-space()='Allow PlusBase to change product information if needed.']//preceding-sibling::span";

  async selectOptionProductPreferences(optionName: string) {
    await this.genLoc(
      `//div[@id='productPreferences']//form[@class='s-form']//span[normalize-space()='${optionName}']`,
    ).click();
  }

  /**
   * Edit customer email on dashboard
   */
  async editCustomerEmail(email: string) {
    await this.fillFormInput(this.FormLabel.customerEmail, email);
    await this.clickButtonOnSaveBar("save");
  }

  async fillFormInput(label: string, value: string) {
    await this.page.fill(`//label[normalize-space()='${label}']//ancestor::div[@class='s-form-item']//input`, value);
  }

  /**
   * Fill required infomation to save Setting
   */
  async fillRequiredInfo(address: string, city: string, zipCode: string) {
    await this.page.locator(this.xpathInputAddress).fill(address);
    await this.page.locator(this.xpathInputCity).fill(city);
    await this.page.locator(this.xpathInputZipCode).fill(zipCode);
  }
}
