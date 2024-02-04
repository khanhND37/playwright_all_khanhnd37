import { Locator, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import type { ContactUsForm } from "@types";

export class ContactUsPage extends SBPage {
  nameLoc: Locator;
  emailLoc: Locator;
  phoneLoc: Locator;
  issueTypeLoc: Locator;
  issueReasonLoc: Locator;
  productLoc: Locator;
  ordNumLoc: Locator;
  msgLoc: Locator;
  btnSubmit: Locator;

  constructor(page: Page, domain: string) {
    super(page, domain);
    this.nameLoc = this.genLoc(`//input[@placeholder='Name'] | //input[@name='name']`);
    this.emailLoc = this.genLoc(`//input[@placeholder='Email*'] | //input[@name='email']`);
    this.phoneLoc = this.genLoc(`//input[@placeholder='Phone'] | //input[@name='phone']`);
    this.issueTypeLoc = this.genLoc(`//select[option[normalize-space()='I want to cancel my order']]`);
    this.issueReasonLoc = this.genLoc(`//option[contains(text(),'Choose reason')]//parent::select`);
    this.productLoc = this.genLoc(`//input[placeholder='Product/Collection link']`);
    this.ordNumLoc = this.genLoc(`//input[@name='order_number']`);
    this.msgLoc = this.genLoc(`//textarea[contains(@name,'message')] | //textarea[contains(@class,'textarea')]`);
    this.btnSubmit = this.genLoc(`button[type='submit']`);
  }

  popupConfirmCancelOrd = this.page.locator(`//div[contains(text(),'Are you sure you want to cancel this order.')]`);
  confirmCancelOrdSuccess = this.page.locator(`//div[contains(text(),'Your order has been successfully canceled.')]`);
  messageSuccess = this.page.locator(
    `//div[contains(text(),"Thanks for contacting us. We'll get back to you as soon as possible.")]`,
  );
  messageEmailError = this.page.locator(
    `//div[contains(text(),"Couldn't find any purchase orders associated with the email.")]`,
  );
  messageSuccessCancel = this.page.locator(
    `//div[contains(text(),"Thanks for submitting your cancel request. To complete the cancellation process, please check your email and confirm")]`,
  );

  defaultContactUsForm: ContactUsForm = {
    name: "tester",
    phone: "09123456789",
    issue_type: "Cancel",
    issue_reason: "Others",
    product_link: "shopbase.com",
    msg: "testing",
  };

  async fillFormContactUs(
    email: string,
    orderNum: string,
    issueType: string = this.defaultContactUsForm.issue_type,
    issueReason: string = this.defaultContactUsForm.issue_reason,
    contactUsInfo: ContactUsForm = this.defaultContactUsForm,
  ) {
    switch (issueType) {
      case "Cancel":
        issueType = "I want to cancel my order";
        break;
      case "Update":
        issueType = "I want to update my order";
        break;
      case "confirm order":
        issueType = "I have not received my confirmation email";
        break;
      case "shipment":
        issueType = "I have not received my order";
        break;
    }

    await this.page.waitForLoadState("networkidle");
    await this.nameLoc.fill(contactUsInfo.name);
    await this.emailLoc.fill(email);
    await this.phoneLoc.fill(contactUsInfo.phone);
    await this.issueTypeLoc.selectOption({ label: issueType });
    issueReason && (await this.issueReasonLoc.selectOption({ label: issueReason }));
    orderNum && (await this.ordNumLoc.fill(orderNum));
    await this.msgLoc.fill(contactUsInfo.msg);
    await this.btnSubmit.click();
  }

  async confirmCancelOrd() {
    await this.page.locator(`//button[normalize-space()='Yes, I want to cancel the order']`).click();
  }

  /**
   * Go to contact us
   */
  async goToContactUs(): Promise<void> {
    await this.page.goto(`https://${this.domain}/pages/contact-us`);
    await this.page.waitForLoadState("networkidle");
  }
}
