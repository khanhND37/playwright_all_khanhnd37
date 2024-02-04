import { SBPage } from "../page";
import type { BalanceValue, CreditCard, DataInvoiceDetail } from "@types";
import type { AccountInfo, ReviewPayoutInfo, ProfileInfo, TransferFundsInfo } from "@types";
import { APIRequestContext, expect, Locator, Page } from "@playwright/test";
import path from "path";
import appRoot from "app-root-path";

export class BalancePage extends SBPage {
  xpathToastSuccess = "//div[contains(@class, 'toast')]//div[contains(text(), 'Setting was saved successfully')]";
  xpathToastDanger = "//div[contains(@class, 'toast is-danger')]//div";
  xpathErrorMessageAutoTopup = "//div[contains(@class, 'form-item__error')]";
  xpathWarnPayoutLessMore50 = "(//div[contains(@class, 'text-red')]//span)[3]";
  xpathWarnRequestMore50 = "//p[contains(@class, 'type--subdued')]//following-sibling::p";
  xpathNamePopupRequestPayout = "(//div[contains(@class, 's-modal-wrapper')]//h4)[1]";
  xpathBtnSendRequest = "//button[normalize-space()='Send request']";
  xpathBlockPayout =
    "//div[@class='setting-page__block-title' and normalize-space()='Payout']//ancestor::div[@class='row m-t-lg']";
  xpathBtnConnectWithPayoneer = "//div[@id='payoneer-account']//button[@class='s-button is-default']//img";
  xpathClickHereInSignUpPayoneerPage = "//div[@class='notification']//div[text()='Click Here!']";
  xpathBtnDeletePayoneerAccount = "//button[descendant::i[@class='mdi mdi-delete icon-unlink']]";
  xpathTitlePopupDeleteAccPayoneer = "//div[@class='s-modal-body']//p";
  xpathBtnCancelInPopupDelete = "//div[@class='s-modal-footer__footer-actions']//span[normalize-space()='Cancel']";
  xpathEmailPayoneer = "//div[@id='payoneer-account']//input[@class='s-input__inner']";
  xpathInputAmountTransfers = "//div[@id='inputSuggestNumber']//input";
  xpathBannerSuccessWithAmount = "(//div[@id='topupSuccess']//p)[1]";
  xpathIsConnectedPayoneer = "//div[@id='payoneer-account']//input[@disabled='disabled']";
  xpathMessageRequestPayoutSuccess = "//div[contains(text(), 'Your request is successfully sent')]";
  xpathSectionPayoutAcc =
    "(//div[normalize-space(text())='Payout']//parent::div//following-sibling::div)[2]//div[contains(@class, 'section')]";

  xpathLoadingAccPayoneer = "//div[@id='payoneer-account']//button[contains(@class, 'is-loading')]";
  xpathTitlePopupLocalBankAcc = "//h3[normalize-space(text()) = 'Local bank account details']";
  xpathEmailLocalBankAcc = "//label[@for='email']/parent::div//following-sibling::div";
  xpathBtnDisablePasswordSF = "//button[normalize-space()='Disable password']";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  topUpSuccessLoc = this.page.locator(this.xpathBannerSuccessWithAmount);

  /**
   * I go to balance page
   */
  async goToBalance() {
    await this.page.goto(`https://${this.domain}/admin/balance`);
    await this.page.waitForSelector('//h2[text()="Balance"]');
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * I edit enable payout to shopbase balance
   */
  async clickEnablePayoutToSBBalance() {
    await this.page.click('//label/span/p[text()="Enable payout to ShopBase Balance"]');
  }

  /**
   * I save the changes
   */
  async clickSaveChanges() {
    await this.page.click('(//button/span[normalize-space()="Save changes"])[1]');
    await this.page.waitForSelector('//div[text()="Setting was saved successfully"]');
  }

  /**
   * I edit enable auto recharge
   */
  async clickEnableAutoRecharge() {
    await this.page.click('//label/span[normalize-space()="Enable auto recharge"]');
  }

  /**
   * I open credit card popup
   */
  async clickReplaceCreditCard() {
    await this.page.click('//button/span[normalize-space()="Replace credit card"]');
    await this.page.waitForSelector('//iframe[@id="braintree-hosted-field-cvv"]');
  }

  /**
   * I add credit card
   */
  async addCreditCard(card: CreditCard) {
    await this.page
      .frameLocator('//iframe[@id="braintree-hosted-field-number"]')
      .locator('//input[@id="credit-card-number"]')
      .fill(card.cardNumber);
    await this.page
      .frameLocator('//iframe[@id="braintree-hosted-field-expirationDate"]')
      .locator('//input[@id="expiration"]')
      .fill(card.expires);
    await this.page
      .frameLocator('//iframe[@id="braintree-hosted-field-cvv"]')
      .locator('//input[@id="cvv"]')
      .fill(card.cvc);
    await this.page.locator('//input[@id="cpf_firstname"]').fill(card.firstName);
    await this.page.locator('//input[@id="cpf_lastname"]').fill(card.lastName);
    await this.page.locator('//input[@id="asf_address"]').fill(card.address);
    await this.page.locator('//input[@id="asf_city"]').fill(card.city);
    await this.page.locator('//input[@id="asf_country"]').fill(card.country);
    await this.page.locator(`//div[text()[normalize-space()="${card.country}"]]`).click();
    await this.page.locator('//input[@id="asf_postCode"]').fill(card.zipCode);
    await this.page.locator('//button/span[normalize-space()="Save"]').click();
    await this.page.waitForSelector('//div[text()="Credit card was saved successfully!"]');
  }

  /**
   * I update payout account
   * @param email email of payout account
   */
  async updatePayoutAccount(email: string) {
    await this.page.click('//div[contains(text(),"Paypal account")]//following-sibling::button');
    await this.page.fill('//div[contains(text(),"Paypal account")]//following-sibling::div//input', email);
    await this.page.click('//div[contains(text(),"Paypal account")]//following-sibling::button');
    await this.page.waitForSelector('//div[text()="Setting was saved successfully"]');
    await this.page.click('//div[contains(text(),"PingPong account")]//following-sibling::button');
    await this.page.fill('//div[contains(text(),"PingPong account")]//following-sibling::div//input', email);
    await this.page.click('//div[contains(text(),"PingPong account")]//following-sibling::button');
    await this.page.waitForSelector('//div[text()="Setting was saved successfully"]');
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * click button Add account details
   */
  async clickButtonAddAccountDetail() {
    await this.page.click("//span[normalize-space()='Add account details']");
    await this.page.waitForLoadState("load");
  }

  /**
   * select option for dropdown with label name
   * @param label field name need select option
   * @param value option name need select
   */
  async selectElement(label: string, value: string) {
    await this.genLoc(
      `//label[normalize-space()='${label}']//parent::div//following-sibling::div//select
      | //p[normalize-space()='${label}']//parent::div//following-sibling::div//select`,
    ).selectOption({ label: value });
  }

  /**
   * input value for field name on popup Add account detail of Local bank account
   * @param label field name need input value
   * @param value data need input to field
   */
  async fillValue(label: string, value: string) {
    await this.page.fill(`//label[normalize-space()='${label}']//parent::div//following-sibling::div//input`, value);
  }

  /**
   * Add account detail of payment method Local bank account
   * @param accountInfo info of account need input to create account detail for local bank account
   */
  async inputAccountDetailWithData(accountInfo: AccountInfo) {
    //input data into any field or all field on add Local bank account detail popup
    if (accountInfo.bank_country) {
      await this.selectElement("Bank Country", accountInfo.bank_country);
    }
    if (accountInfo.bank_account_currency) {
      await this.selectElement("Bank account currency", accountInfo.bank_account_currency);
    }
    if (accountInfo.bank_account_type) {
      await this.page.click(`//span[normalize-space()='${accountInfo.bank_account_type}']`);
    }
    if (accountInfo.email) {
      await this.fillValue("Email", accountInfo.email);
    }
    if (accountInfo.head_phone && accountInfo.phone) {
      await this.selectElement("Phone", accountInfo.head_phone);
      await this.fillValue("Phone", accountInfo.phone);
    }
    if (accountInfo.select_country) {
      await this.selectElement("Select country", accountInfo.select_country);
    }
    if (accountInfo.state) {
      await this.selectElement("State", accountInfo.select_country);
    }
    if (accountInfo.zip_code) {
      await this.fillValue("Zip/Postal code", accountInfo.zip_code);
    }
    if (accountInfo.street) {
      await this.fillValue("Street and number", accountInfo.street);
    }
    if (accountInfo.address_details) {
      await this.fillValue("More address details (optional)", accountInfo.address_details);
    }
    if (accountInfo.city) {
      await this.fillValue("City/Town", accountInfo.city);
    }
    if (accountInfo.bank_name) {
      await this.fillValue("Bank name", accountInfo.bank_name);
    }
    if (accountInfo.account_name) {
      await this.fillValue("Account Holder Name", accountInfo.account_name);
    }
    if (accountInfo.account_number) {
      await this.fillValue("Account Number", accountInfo.account_number);
    }
    if (accountInfo.swift) {
      await this.fillValue("SWIFT/BIC", accountInfo.swift);
    }
    if (accountInfo.iban) {
      await this.fillValue("IBAN", accountInfo.iban);
    }
  }

  /**
   * Click checkbox confirm data on popup add account detail
   */
  async clickCheckboxConfirm() {
    await this.verifyCheckedThenClick("//span[contains(text(),'I confirm')]", true);
  }

  /**
   * Check message after create account detail fail or success
   * @param message input data message success
   * @param errMsg input data message error
   */
  async checkMsgAfterCreated({ message, errMsg }: { message?: string; errMsg?: string }) {
    if (message) {
      await this.page.waitForSelector(`//*[contains(text(),"${message}")]`);
    }
    if (errMsg) {
      try {
        await this.page.waitForSelector(`//*[contains(text(),"${errMsg}")]`);
      } catch (e) {
        await this.page.waitForSelector(`//*[contains(text(),'${errMsg}')]`);
      }
    }
  }

  /**
   * delete account detail of payment method local bank account
   */
  async deleteAccount(fieldDelete?: string) {
    if (fieldDelete === "Paypal" || fieldDelete === "PingPong") {
      await this.page.click(`//div[normalize-space(text()) = '${fieldDelete} account:']//following-sibling::button`);
      await this.page.click(
        `//div[normalize-space(text()) = '${fieldDelete} account:']//following-sibling::div//input[@type="email"]`,
      );
      await this.page.keyboard.press("Control+A");
      await this.page.keyboard.press("Delete");
      await this.page.click(`//div[normalize-space(text()) = '${fieldDelete} account:']//following-sibling::button`);
      await this.waitUntilElementInvisible(this.xpathToastSuccess);
      await this.page.waitForLoadState("networkidle");
    } else {
      await this.page.click("//i[contains(@class,'trash-can-outline')]");
      await this.page.click("//span[normalize-space()='Confirm']");
    }
  }

  /**
   * click button Request payout
   */
  async clickButtonRequestPayout() {
    await this.page.click("//span[normalize-space()='Request payout']");
    await this.page.waitForLoadState("load");
  }

  /**
   * click button View request
   */
  async clickButtonViewRequest() {
    await this.page.click("//span[normalize-space()='View requests']");
    await this.page.waitForSelector("//h1[normalize-space()='Payout requests']");
  }

  /**
   * click button Cancel on popup
   */
  async clickCancelOnPopup() {
    await this.page.click("//div[contains(@class,'animation-content')]//button[normalize-space()='Cancel']");
  }

  /**
   * input amount popup request payout
   */
  async inputAmount(requestAmount: string) {
    await this.page.fill("//input[@placeholder='Enter amount to request payout']", requestAmount);
  }

  /**
   * request payout
   */
  async requestPayout(sourceName: string, paymentName: string, requestAmount: number) {
    await this.page.click(`//b[normalize-space()='${sourceName}']//ancestor::label//span[@class='s-check']`);
    await this.page.click(`//span[normalize-space()='${paymentName}']//ancestor::label//span[@class='s-check']`);
    await this.page.fill("//input[@placeholder='Enter amount to request payout']", requestAmount.toString());
    const xpath = "//button[normalize-space()='Send request']";
    if (await this.page.locator(xpath).isEnabled()) {
      await this.clickOnBtnWithLabel("Send request");
      await this.page.waitForSelector(this.xpathMessageRequestPayoutSuccess);
    }
  }

  /**
   * get data of log payout review on dashboard, to verify pay out info
   * @param authRequest is the request to get the ID
   * @param domain is the domain of the shop
   * @param reviewPayoutInfo  data from config contain payout info (amount, status..)
   * @returns
   */
  async getPayoutInfoDashboardByApi(
    authRequest: APIRequestContext,
    domain: string,
    reviewPayoutInfo: ReviewPayoutInfo,
  ) {
    const response = await authRequest.get(`https://${domain}/admin/balance/payout.json?page=1`);
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    const payoutInfoApi = this.cloneObject<ReviewPayoutInfo>(reviewPayoutInfo);

    payoutInfoApi.amount = jsonResponse.payouts[0].amount;
    payoutInfoApi.status = jsonResponse.payouts[0].status;
    payoutInfoApi.method = jsonResponse.payouts[0].method;

    return payoutInfoApi;
  }

  /**
   * get pay out id by api
   * @param authRequest is the request to get the ID
   * @param domain is the domain of the shop
   */
  async getPayOutIdByApi(authRequest: APIRequestContext, domain: string) {
    const response = await authRequest.get(`https://${domain}/admin/balance/payout.json?page=1`);
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    const payoutInfoApi = jsonResponse.payouts[0];

    return payoutInfoApi;
  }

  /**
   * Click button back to Balance screen
   */
  async clickButtonBack() {
    await this.page.click("//ol[@class='s-breadcrumb']");
    await this.page.waitForLoadState("load");
  }

  /**
   * Click button View invoice
   */
  async clickButtonViewInvoice() {
    await this.clickOnBtnWithLabel("View invoices");
    await this.page.waitForSelector("//table//tr//th//span[contains(text(), 'Shop Domain')]");
  }

  async isInvoiceCreated(invoiceInfo: DataInvoiceDetail) {
    const xpathRowInvoice = `(//span[normalize-space()='${invoiceInfo.domain}']//ancestor::tr[@class='cursor-pointer' and
    //span[normalize-space()='${invoiceInfo.content}'] and
    //span[normalize-space()='${invoiceInfo.status}'] and
    //span[contains(text(), 'minutes ago') or contains(text(), 'Just now')]])[1]`;
    return await this.page.locator(xpathRowInvoice).isVisible();
  }

  /**
   * go to Add funds page
   */
  async goToAddFundsPage() {
    await this.page.goto(`https://${this.domain}/admin/topUp`);
    await this.page.waitForSelector('//h2[contains(text(),"Add funds")]');
  }

  /**
   * select a payment method
   * @param paymentMethodLabel is label radio button that is selected
   */
  async selectPaymentMethod(paymentMethodLabel: string) {
    await this.page.click(`(//span[contains(text(),'${paymentMethodLabel}')])//ancestor::label`);
  }

  /**
   * Choose or input amount for Top-up at section Top up amount
   * @param selectAmount that true is user select amount at blocks, false is user input amount at field Other amount
   * @param amountInput that is value amount
   */
  async valueAmountTopUp(selectAmount: boolean, amountInput: string) {
    if (selectAmount) {
      await this.page.click(`(//div[contains(@class,'block-top-up')]//div[contains(text(),'$${amountInput}')])[1]`);
    } else {
      await this.page.locator(this.xpathInputAmountTransfers).fill(amountInput);
      await this.page.click("//h2[contains(text(), 'Add funds')]");
    }
  }

  /**
   * Get id for top up wire transfers from dashboard
   * @returns idTopUpWireTransfer
   */
  async getIdTopUpWireTransfer(): Promise<string> {
    const idTopUpWireTransfer = await (
      await (
        await this.page.locator(`//div[contains(@class, 'input-group--append is-disabled')]//input`).elementHandle()
      ).getProperty("value")
    ).jsonValue();
    return idTopUpWireTransfer;
  }

  /**
   * choose and push file when click text "Attack file"
   * @param pathFile go to the file need to push
   */
  async attackFile(pathFile: string) {
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent("filechooser"),
      await this.page.click("(//a//following-sibling::input[@type='file'])[2]"),
    ]);
    await fileChooser.setFiles(path.join(appRoot + pathFile));
  }

  /**
   * input info for Top up manual with Wire Transfers
   * @param transferFundsInfo is object includes full data for Wire Transfers
   */
  async inputInfoMoneyTransfer(transferFundsInfo: TransferFundsInfo) {
    await this.selectElement("Select a preferred account to transfer funds", transferFundsInfo.transfer_funds);
    if (await this.page.locator("//label[@for ='account_holder']").isVisible()) {
      await this.inputTextBoxWithLabel("Account holder", transferFundsInfo.account_holder);
    }
    if (
      await this.page
        .locator("//div[contains(@class, 'account-holder') and not(@style='display: none;')]//label[@for ='email']")
        .isVisible()
    ) {
      await this.inputTextBoxWithLabel("Account email", transferFundsInfo.account_email);
    }
    if (
      await this.page
        .locator(
          "//div[contains(@class, 'account-holder') and not(@style='display: none;')]//label[@for ='account_email']",
        )
        .isVisible()
    ) {
      await this.inputFieldWithLabel(
        "//div[not(@style='display: none;') and @class='account-holder']",
        "johndoe@gmail.com",
        transferFundsInfo.account_email,
      );
    }
    if (await this.page.locator("//label[@for ='transactionId']").isVisible()) {
      await this.inputTextBoxWithLabel("Transaction ID", transferFundsInfo.transaction_id);
    }
    if (await this.page.locator("//label[contains(text(), 'Note (optional)')]").isVisible()) {
      await this.inputTextAreaWithLabel("Note (optional)", transferFundsInfo.note);
    }
    if (transferFundsInfo.is_attack_file) {
      this.attackFile(transferFundsInfo.path_file);
    }
  }

  /**
   * click button Confirm top up
   */
  async clickBtnConfirmTopUp() {
    await this.clickOnBtnWithLabel("Confirm top up");
  }

  /**
   * click button View transaction
   */
  async clickBtnViewTransactions() {
    await this.clickOnBtnWithLabel("View transactions");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * tick checkbox "Enable auto recharge" and input values
   * @param amountInput is value amount input for auto top up
   * @param valueBalanceBelow if available balance is smaller valueBalanceBelow, the system will be auto top up
   */
  async enableAutoTopUp(amountInput: string, valueBalanceBelow: string) {
    await this.page.click("//span[contains(text(),'Enable auto recharge')]//parent::label");
    if (await this.page.locator("//span[contains(text(), 'The allowed minimum amount is $10.')]").isVisible()) {
      await this.page
        .locator(
          "//span[contains(text(), 'Add') or contains(text(), 'to your credit account')]//following-sibling::div//input",
        )
        .fill(amountInput);
      await this.page.selectOption(
        "//span[contains(text(), 'When my balance falls below')]//following-sibling::div//select",
        valueBalanceBelow,
      );
    } else {
      await Promise.reject("Error: Checkbox 'Enable auto recharge' is checked");
    }
    if (parseFloat(amountInput) >= 10) {
      await this.page.click("(//button//span[contains(text(),'Save changes')])[1]");
      await this.page.waitForLoadState("load");
    } else {
      await this.page.waitForSelector(
        "(//button[contains(@class, 'is-disabled')]//span[contains(text(),'Save changes')])[1]",
      );
    }
  }

  /**
   * disable checkbox "Enable auto recharge" by API
   * @param domain is shop domain
   * @param request call to API
   */
  async autoTopUpByApi(request: APIRequestContext, domain: string, autoRecharge = false) {
    const res = await request.put(`https://${domain}/admin/balance/settings.json`, {
      data: { auto_recharge: autoRecharge },
    });
    if (!res.ok()) {
      return Promise.reject("Error: Update shop domain");
    }
  }

  /**
   * update profile to credit card is declined or available
   * @param request call to API
   * @param domainApi is domain api of environment
   * @param userId is id of account user
   * @param shopId is id store
   * @param profileInfo is data input to update profile
   */
  async updateToCardDeclinedOrAvailableByAPI(
    request: APIRequestContext,
    domainApi: string,
    userId: string,
    shopId: string,
    profileInfo: ProfileInfo,
    email: string,
  ) {
    const res = await request.put(`${domainApi}/v1/user/profile?user_id=${userId}&shop_id=${shopId}`, {
      data: {
        id: parseInt(userId),
        shop_id: parseInt(shopId),
        email: email,
        first_name: profileInfo.first_name,
        last_name: profileInfo.last_name,
        phone_user: profileInfo.phone_user,
        calling_code: profileInfo.calling_code,
        birthday: profileInfo.birthday,
        country: profileInfo.country,
        address: profileInfo.address,
        social_platform: profileInfo.social_platform,
        personal_website: profileInfo.personal_website,
      },
    });
    if (!res.ok()) {
      return Promise.reject("Check your all data again, please");
    }
  }

  /**
   * I will direct to topup page
   */
  async clickTopup() {
    await this.page.click(`//button/span[text()[normalize-space()="Top up"]]`);
  }

  async getAvailableToPayout(): Promise<number> {
    const valueAvailablePayout = parseFloat(
      (
        await this.page
          .locator("(//span[contains(text(), 'Available to payout')]//parent::div)//following-sibling::h4")
          .textContent()
      )
        .replace(`$`, ``)
        .replace(`,`, ``),
    );
    return valueAvailablePayout;
  }

  async getValueGeneralFoundingSource(): Promise<number> {
    const valueGeneral = parseFloat(
      (await this.page.locator("//b[contains(text(), 'General')]//following-sibling::p").textContent())
        .replace(`$`, ``)
        .replace(` available payout`, ``),
    );
    return valueGeneral;
  }

  async loginPayoneerAccount(email: string, password: string) {
    await this.genLoc("//div[@class='logInForm']//input[@name='username']").fill(email);
    await this.genLoc("//div[@class='logInForm']//input[@name='password']").fill(password);
    await this.genLoc("//div[@class='logInForm']//button[@type='submit']").click();
  }

  async getEmailAccountConnect(): Promise<string> {
    return await this.genLoc(this.xpathEmailPayoneer).inputValue();
  }

  async deleteAccountPayoneer() {
    await this.genLoc(this.xpathBtnDeletePayoneerAccount).click();
    await this.genLoc("//div[@class='s-animation-content s-modal-content']//span[normalize-space()='Confirm']").click();
  }

  async connectAccountPayoneer(email: string, password: string) {
    const [signUpPage] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.page.locator(this.xpathBtnConnectWithPayoneer).click(),
    ]);
    const [signInPage] = await Promise.all([
      signUpPage.waitForEvent("popup"),
      signUpPage.locator(this.xpathClickHereInSignUpPayoneerPage).click(),
    ]);
    await signInPage.locator("//div[@class='logInForm']//input[@name='username']").fill(email);
    await signInPage.locator("//div[@class='logInForm']//input[@name='password']").fill(password);
    await signInPage.locator("//div[@class='logInForm']//button[@type='submit']").click();
  }

  getXpathPayoutMethod(payoutMethod: string): Locator {
    return this.genLoc(`//span[normalize-space()='${payoutMethod}']//ancestor::label[@class='s-radio']`);
  }

  getXpathBalanceWithLabel(label: string): string {
    return `//*[normalize-space()='${label}']//ancestor::div[@class='flex-space-between']/h4`;
  }

  async getBalanceInfo(): Promise<BalanceValue> {
    const currentAvailableBalance = (
      await this.page.innerText(this.getXpathBalanceWithLabel("Current available balance"))
    ).replace("$", "");
    const availableToPayout = (await this.page.innerText(this.getXpathBalanceWithLabel("Available to payout"))).replace(
      "$",
      "",
    );
    const total = (
      await this.page.innerText("//h3[normalize-space()='Total']//ancestor::div[@class='flex-space-between']/h3")
    ).replace("$", "");
    const balanceValue = {
      currentAvailableBalance: Number(currentAvailableBalance),
      availableToPayout: Number(availableToPayout),
      total: Number(total),
    };
    return balanceValue;
  }

  /**
   * get value Unavailable to payout at Balance page
   * @returns
   */
  async getValueUnavailableToPayout(): Promise<string> {
    return (await this.getTextContent(await this.getXpathBalanceWithLabel("Unavailable to payout")))
      .replace("$", "")
      .replace(",", "");
  }

  /**
   * verify unavailable to payout at Balance page after excute topup
   * @param amount
   * @param balanceCompare
   * @returns
   */
  async verifyTopupToUnavailableToPayout(
    statusTopup: "In Review" | "Success" | "Void",
    amount: string,
    balanceCompare: string,
  ): Promise<boolean> {
    let equalAmount = false;
    const valueUnavailable = await this.getValueUnavailableToPayout();
    if (
      (statusTopup === "In Review" && parseFloat(balanceCompare) === parseFloat(valueUnavailable)) ||
      (statusTopup === "Void" && parseFloat(balanceCompare) === parseFloat(valueUnavailable)) ||
      (statusTopup === "Success" &&
        parseFloat(balanceCompare) + parseFloat(amount) === parseFloat(await this.getValueUnavailableToPayout()))
    ) {
      equalAmount = true;
    }
    return equalAmount;
  }
}
