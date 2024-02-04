import { Locator, Page } from "@playwright/test";
import { CheckoutForm } from "./checkout";

export class MyCustomizationServicePage extends CheckoutForm {
  xpathOrderConfirmed = "//p[normalize-space()='Your order is confirmed']";
  xpathBtnAccessMyContent = "//button[normalize-space()='Access to my content']";
  xpathSectionCustomizationService = "//section[@component='customization-service']";
  xpathSectionMyProductQuestion = "//section[@component='product-question']";
  xpathBtnSubmitAnswer = "//button[normalize-space()='Submit answer']";
  xpathProductQuestionAnswerInput = "//input[contains(@class, 'product-questions__input')]";
  xpathBlockProductQuestion = "//div[contains(@class, 'product-questions--customization-service')]";
  xpathThankAfterSubmit = "//p[contains(@class, 'product-questions__thanks')]";
  xpathButtonSubmitQuestion = "//button[contains(@class, 'product-questions__primary-button')]";

  defaultCssButtonSubmitQuestion = {
    name: "background-color",
    value: "rgb(123, 221, 24)",
  };

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  getXpathSingleSelect(answer: string): string {
    return `//label[contains(@class, 's-radio') and normalize-space()='${answer}']`;
  }

  getXpathMultipleSelect(answer: string): string {
    return `//label[contains(@class, 's-checkbox') and normalize-space()='${answer}']`;
  }

  getXpathAnswerResult(answer: string): string {
    return `//div[contains(@class, 'product-questions__answer') and contains(normalize-space(), '${answer}')]`;
  }

  async checkoutProduct(productHandle: string, email: string) {
    await this.page.goto(`https://${this.domain}/products/${productHandle}`);

    await this.enterEmail(email);
    await this.enterCardNumber(this.defaultCardInfo.number);
    await this.enterExpireDate(this.defaultCardInfo.expire_date);
    await this.enterCVV(this.defaultCardInfo.cvv);
    await this.clickBtnCompleteOrder();
  }

  async removeCustomerToken() {
    await this.page.evaluate(() => {
      window.localStorage.removeItem("customerToken");
    });
  }

  async getAllSections(): Promise<Locator[]> {
    return await this.page.locator("//section[@id]").all();
  }
}
