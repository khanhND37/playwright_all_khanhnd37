import { Locator, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import type { ActivationInfo, StorePlanInfo } from "@types";
import { addDays, formatDate } from "@core/utils/datetime";
import { removeCurrencySymbol } from "@core/utils/string";
import type { TopUpReconmendInfo } from "@types";

export class ConfirmPlanPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  confirmPlanHeaderLoc = this.page.locator(`//h2[normalize-space()='Confirm plan']`);
  getXpathConfirmPlanSucess =
    "//div[contains(@class, 'is-success')]//div[text()[normalize-space()= 'Confirm plan successfully']]";
  topUpButtonLoc = this.page.locator(`//button[span[normalize-space()='Top up']]`);
  activatePbPlanButtonLoc = this.page.locator(`//button[span[normalize-space()='Activate PrintBase plan']]`);
  activatePlusBasePlanButtonLoc = this.page.locator(`//button[span[normalize-space()='Activate PlusBase plan']]`);
  startPlanButtonLoc = this.page.locator(`//button[span[normalize-space()='Start plan']]`);
  xpathHigherPlan =
    '//div[@class="position-relative" and descendant::button[@disabled="disabled"]]/following-sibling::div//div[contains(@class,"title")]';
  xpathHigherPlanAmount = `${this.xpathHigherPlan}//following-sibling::div[@class="price"]/span[@class="number price"]`;
  xpathLowerPlan =
    '//div[@class="position-relative" and descendant::button[@disabled="disabled"]]/preceding-sibling::div//div[contains(@class,"title")]';
  xpathLowerPlanAmount = `${this.xpathLowerPlan}//following-sibling::div[@class="price"]/span[@class="number price"]`;
  xpathCurrentPlanAmount =
    '//div[@class="position-relative" and descendant::button[@disabled="disabled"]]//span[@class="number price"]';
  getXpathPopupCapcha = "//div[@class='s-modal-header']//h4[normalize-space()='Verify your account']";
  getXpathPricingPlan = "//div[@class='pricing-page']";

  balanceInsufficientMsgLoc = this.page.locator(
    `//p[normalize-space()="You don't have enough balance for this payment. Please topup to Shopbase Balance in order to keep going."]`,
  );

  topUpButtonV2Loc = this.page.locator(`//button[span[normalize-space()='Top-up']]`);

  async waitForPackageGroup() {
    await this.page.waitForSelector(".pricing-list");
  }
  async waitForPricingPage() {
    await this.page.waitForSelector(".pricing-page");
  }

  getLocatorBlockPackageComingSoon(packageName: string): Locator {
    return this.genLoc(
      `//div[normalize-space()='${packageName}']//ancestor::div[@class='pricing forCreator isComingSoon']`,
    );
  }

  getLocatorBlockPackageEnable(packageName: string): Locator {
    return this.genLoc(`//div[normalize-space()='${packageName}']//ancestor::div[@class='pricing forCreator']`);
  }

  /**
   * get price of the plan choosen
   * @param plan
   * @returns
   */
  async getPricePackageChoosen(plan: string, timePlan?: string): Promise<string> {
    if (timePlan) {
      //get time plan is active
      const timePlanActive = await this.page
        .locator("//div[contains(@class, 'period-wrapper')]//div[contains(@class, 'active')]")
        .textContent();
      //choose time plan if it's not active
      if (!timePlanActive.includes(timePlan)) {
        await this.page.click("//div[contains(@class, 'period-wrapper')]//div[not(contains(@class, 'active'))]");
      }
    }
    if (timePlan === "Annually") {
      const text = await this.page
        .locator(`//div[contains(@class, 'title') and text()[normalize-space()='${plan}']]/following-sibling::div[4]`)
        .textContent();
      return text.split("billed")[0].replace("$", "");
    } else {
      return await this.page
        .locator(
          `//div[contains(@class, 'title') and text()[normalize-space()='${plan}']]/following-sibling::div//span[@class="number price"]`,
        )
        .textContent();
    }
  }

  /**
   * get the price need to pay that's diplay at Confirm plan page
   * @returns price
   */
  async getPriceDisplayToPaid(): Promise<string> {
    return (
      await this.page.locator("//span[text()[normalize-space() = 'Price:']]/following-sibling::div//span").textContent()
    )
      .replace("$", "")
      .replace(/(\n|\t)/g, "")
      .replace(/\s+/g, "")
      .trim();
  }

  xpathTextReviewPayAndSub1 =
    "(//h4[text()[normalize-space()='Review your subscription']]//following-sibling::p//span)[1]";

  xpathTextReviewPayAndSubFreeTrial =
    "(//h4[text()[normalize-space()='Review your subscription']]//following-sibling::p)[1]";

  /**
   * get text Review your subcription
   * input anytext for statusShop if the store is create new or in free_trial days
   * @param statusShop (suggest text: "free_trial")
   */
  async getTextReviewSub(statusShop?: "free_trial"): Promise<string> {
    if (statusShop) {
      return (await this.page.locator(this.xpathTextReviewPayAndSubFreeTrial).textContent())
        .replace(/(\n|\t)/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    } else {
      return (await this.page.locator(this.xpathTextReviewPayAndSub1).textContent())
        .replace(/(\n|\t)/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  /**
   * Go to Pick a plan for your store page on Dashboard
   */
  async gotoPickAPlan() {
    await this.goto("/admin/pricing");
    await this.isDBPageDisplay("Pick a plan for your store");
  }

  /**
   * Choose plan for your store what store is activated a plan
   * Check if the plan is already chosen click confirm changes button for confirmation
   * check if haven't plan chosen, choose a Plan
   * @param plan is plan name
   * @param discount
   */
  async choosePlan(plan: string, discount?: string) {
    const xpathBtn = `//div[normalize-space()='${plan}']//parent::div[@class='pricing-header']//following-sibling::div[@class='pricing-cta']//button`;
    await this.page.waitForSelector(xpathBtn);
    const countBtnCurrentPlan = await this.genLoc(
      `//button[descendant::span[normalize-space()='Current plan']]`,
    ).count();
    let packageActive = "";
    if (countBtnCurrentPlan > 0) {
      packageActive = await this.genLoc(
        "//div[@class='pricing' and descendant::button[descendant::span[normalize-space()='Current plan']]]" +
          "/div[@class='pricing-header']/div[contains(@class,'title')]",
      ).textContent();
    }
    if (!packageActive.includes(plan)) {
      await this.page.waitForSelector(xpathBtn);
      await this.genLoc(xpathBtn).click();
    }
    if (countBtnCurrentPlan > 0) {
      await this.page.waitForLoadState("load");
      if (discount) {
        await this.page.locator(`//input[@placeholder='Discount']`).fill(discount);
        await this.page.click(`//button[span[normalize-space()='Apply']]`);
      }
      await this.genLoc("button:has-text('Confirm changes')").click();
    }
  }

  /**
   * Choose a plan on Pick a plan page
   * @param packageName name of the package that you want to choose
   * @param period Monthly | Annually
   */
  async chooseThisPlanPackage(activationInfo: ActivationInfo) {
    switch (activationInfo.package_period) {
      case "Annually":
        await this.page.click("//div[contains(text(),'Annually')]");
        break;
      default:
        await this.page.click("//div[contains(text(),'Monthly')]");
    }
    await this.genLoc(
      `//div[normalize-space()='${activationInfo.package_name}']//parent::div//following-sibling::div//button`,
    ).click();
  }

  /**
   * Verify is information in confirm plan correctly
   * @param activationInfo Information of the active plan that you choose
   * @returns boolean
   */
  async isConfirmPlanInfoCorrectly(activationInfo: ActivationInfo): Promise<boolean> {
    const arrResult = [];
    const strPackage = await this.getTextContent(`//span[normalize-space()='Package:']
    //ancestor::div[contains(@class, 'justify-space-between')]//span[contains(@class, 'text-right')]`);
    const strPrice = removeCurrencySymbol(
      await this.getTextContent(`//span[normalize-space()='Price:']
    //ancestor::div[contains(@class, 'justify-space-between')]//span[contains(@class, 'text-right')]`),
    );
    let result = true;
    const formatStrCycleEnd = formatDate(new Date(activationInfo.end_date), "MMM D, YYYY");
    const strCycleStart = await this.getTextContent(
      `(//*[contains(text(), 'After the trial ends') or contains(text(), 'trial is extend')]//span[normalize-space()='${activationInfo.start_date}'])[1]`,
    );
    const strCycleEnd = await this.getTextContent(
      `//*[contains(text(), 'After the trial ends') or contains(text(), 'trial is extend')]//span[normalize-space()='${formatStrCycleEnd}']`,
    );

    //validate package name
    if (activationInfo.package_name) {
      arrResult.push(strPackage.includes(activationInfo.package_name));
    }
    //validate package period
    if (activationInfo.package_period) {
      arrResult.push(strPackage.includes(activationInfo.package_period));
    }
    //validate package discount
    if (activationInfo.discount_code) {
      const strDiscount = await this.getTextContent(
        `(//span[normalize-space()='Discount code:']//ancestor::div[contains(@class, 'space-between')]//span)[2]`,
      );
      arrResult.push(strDiscount === activationInfo.discount_code);
    }
    //validate package price
    if (activationInfo.discount_value) {
      let packagePrice: number;
      switch (activationInfo.discount_type) {
        case "percentage":
          packagePrice =
            Math.abs(activationInfo.package_price) -
            (Math.abs(activationInfo.package_price) * activationInfo.discount_value) / 100;
          break;
        case "free_trial":
          packagePrice = Math.abs(activationInfo.package_price);
          break;
      }
      arrResult.push(parseFloat(strPrice) === packagePrice);
    } else {
      arrResult.push(parseFloat(strPrice) === Math.abs(activationInfo.package_price));
    }
    //validate startdate
    if (activationInfo.start_date) {
      arrResult.push(strCycleStart === activationInfo.start_date);
    }
    //validate end date
    if (formatStrCycleEnd) {
      arrResult.push(strCycleEnd === formatStrCycleEnd);
    }

    for (let i = 0; i < arrResult.length; i++) {
      if (!arrResult[i]) {
        result = false;
        break;
      }
    }
    return result;
  }

  /**
   * choose the effective time for store's plan
   * It works for all case, includes case: Start plan for store is Free trial
   * @param plan is plan user chose
   * @param timePlan is the effective time for store's plan, can be "Monthly" or "Annually"
   */
  async chooseTimePlanPackage(plan: string, timePlan: string, coupon?: string) {
    const xpathBtnChoosePlan = `//div[@class='pricing' and descendant::div[normalize-space()='${plan}']]//button`;

    //get current plan
    const currentPlan = await this.getCurrentPlanWithTimePlan();

    // go to pick a plan
    await this.gotoPickAPlan();
    await this.page.waitForSelector(xpathBtnChoosePlan);

    //get time plan active
    const timePlanActive = await this.page
      .locator("//div[contains(@class, 'period-wrapper')]//div[contains(@class, 'active')]")
      .textContent();
    if (!timePlanActive.includes(timePlan)) {
      await this.page.click("//div[contains(@class, 'period-wrapper')]//div[not(contains(@class, 'active'))]");
    }

    const choosePlan = plan + " / " + timePlan;
    //choose plan
    if (currentPlan.replace("Yearly", "Annually") != choosePlan) {
      await this.page.waitForSelector(xpathBtnChoosePlan);
      await this.genLoc(xpathBtnChoosePlan).click();
      await this.page.waitForLoadState("load");
      if (coupon) {
        await this.genLoc("//input[contains(@placeholder,'Discount')]").fill(coupon);
        await this.genLoc("//button[contains(@class, 'button-discount')]").click();
      }
    } else {
      Promise.reject(`This plan is chose for your store !!!`);
    }
  }

  /**
   * click button confirm plan
   * It works for all case, includes case: Start plan for store is Free trial
   */
  async clickConfirmPlan() {
    await this.genLoc("//button[contains(@class, 'button-start')]").click();
    await this.page.waitForNavigation();
  }

  /**
   * Switch to ShopBase Fulfillment Service Only
   * Click button for choosing ShopBase Fulfillment Service Only
   * Click confirm changes button for confirmation
   */
  async choosePlanShopBaseFulfillment() {
    let currentPlan;
    if ((await this.getCurrentPlanWithTimePlan()).includes("Fulfillment Only")) {
      Promise.resolve();
    } else {
      do {
        await this.gotoPickAPlan();
        await this.clickOnBtnWithLabel("Yes, I want this option");
        await this.clickOnBtnWithLabel("Confirm new plan");
        await this.clickOnBtnWithLabel("Confirm changes");
        await this.page.waitForURL(`https://${this.domain}/admin/settings/account`, { waitUntil: "networkidle" });
        currentPlan = await this.getCurrentPlanWithTimePlan();
      } while (!currentPlan.includes("Fulfillment Only"));
    }
  }

  /**
   * Calculate next payment when period = Monthly
   * @param freeTrialInfo
   * @returns
   */
  async calculateNextPaymentDate(
    freeTrialInfo: StorePlanInfo,
    activationInfo: ActivationInfo,
  ): Promise<ActivationInfo> {
    const normalSubExpiredDate = new Date(freeTrialInfo.subscription_expired_at * 1000);
    const normalSubExpiredDateUTC = new Date(
      normalSubExpiredDate.getTime() + normalSubExpiredDate.getTimezoneOffset() * 60000,
    );

    if (activationInfo.discount_type === "free_trial") {
      activationInfo.start_date = formatDate(
        addDays(activationInfo.discount_value, normalSubExpiredDateUTC),
        "MMM DD, YYYY",
      );
      activationInfo.end_date = formatDate(
        addDays(activationInfo.discount_value + 30, normalSubExpiredDateUTC),
        "MMM DD, YYYY",
      );
    } else {
      activationInfo.start_date = formatDate(normalSubExpiredDateUTC, "MMM DD, YYYY");
      activationInfo.end_date = formatDate(addDays(30, normalSubExpiredDateUTC), "MMM DD, YYYY");
    }
    return activationInfo;
  }

  /**
   wait for all element Confirm Package Page visible
   */
  async waitConfirmPlanPage() {
    await this.page.waitForSelector("//div[@class='confirm-plan-page']");
    const billingInfo = this.genLoc("//div[@class='section'][child::*[normalize-space()='Billing information']]");
    await this.page.waitForSelector("//div[@class='section'][child::*[normalize-space()='Billing information']]");

    if (await billingInfo.isVisible()) {
      await this.page.waitForSelector("//div[contains(@class,'billing-information-view')]");
      await this.page.waitForSelector("//button[normalize-space()='Replace credit card']");
    } else {
      await this.page.waitForSelector("//div[@class='braintree-card-form']");
      await this.page.waitForSelector("//h4[normalize-space()='Billing address']");
    }
    await this.page.waitForSelector("//div[contains(@class,'text-left')]//button[normalize-space()='Cancel']");
    await this.page.waitForSelector("//div[contains(@class,'section sticky-top')]");
  }

  /**
   * get data of Invoice by label
   */
  async getDataInvoiceByLabel(label: string, rowIndex: number): Promise<string> {
    const xpathRow = await this.page.locator(
      `//table//thead//tr//th[normalize-space()='${label}']/preceding-sibling::th`,
    );
    const colIndex = (await xpathRow.count()) + 1;
    return await this.getTextContent(`(//table/tbody//tr[${rowIndex}]//td[${colIndex}]//span)[last()]`);
  }

  async waitForFulfillmentPackage() {
    await this.page.waitForSelector(".pricing-fulfilment");
  }

  async waitForSettingAccountPage() {
    await this.page.waitForSelector("//div[contains(@class,'setting-account-page')]");
  }

  /**
   * Get store's current plan with the effective time
   * @returns plan : string
   */
  async getCurrentPlanWithTimePlan(): Promise<string> {
    await this.goto("/admin/settings/account");
    await this.page.waitForSelector(".group-title");
    await this.page.waitForSelector("//p[text()='Current plan']//following-sibling::p");
    const plan = await this.page.locator("//p[text()='Current plan']//following-sibling::p").textContent();
    return plan;
  }

  /**
   * Get store's current plan without the effective time
   * @returns current plan : string
   */
  async getCurrentPlan(): Promise<string> {
    this.getCurrentPlanWithTimePlan();
    const plan = (await this.page.locator("//p[text()='Current plan']//following-sibling::p").textContent())
      .trim()
      .split("/");
    return plan[0].trim();
  }

  /*
   * Select Period in Package screen
   * Value: Monthly / Yearly
   */
  async selectPeriod(period: string) {
    await this.page.click(`//div[@class="period-wrapper"]/div[normalize-space()="${period}"]`);
  }

  /*
   * Input discount coupon in Confirm plan screen
   * coupon: String
   */
  async inputCouponDiscount(coupon: string) {
    await this.page.locator("//input[@placeholder='Discount']").fill(coupon);
  }

  /**
   * click to open confirm plan page when open store
   */
  async openConfirmPlanPage() {
    await this.page.click(`//button[span[normalize-space()='Activate My Plan']]`);
  }

  /**
   * start a plan for new pb/plb store
   * @param isAfterFreeTrial
   * @param discount if discount is blank > active plan without discount
   * @return charge amount after apply discount or not
   */
  async startPlan(isAfterFreeTrial = false, discount?: string): Promise<void> {
    if (!isAfterFreeTrial) {
      await this.page.goto(`https://${this.domain}/admin/settings/account`);
      await this.page.waitForSelector('//h1[text()="Account"]');

      // Auto nhanh quá nên cần timeout nếu không sẽ bị về flow cũ
      await this.page.waitForTimeout(3000);
      await this.page.click(`//button[span[normalize-space()='Activate My Plan']]`);
    }

    const xpathStartPlan = `//button[span[normalize-space()='Start plan']]`;

    await this.page.waitForSelector(xpathStartPlan);
    if (discount) {
      await this.page.locator(`//input[@placeholder='Discount']`).fill(discount);
      await this.page.click(`//button[span[normalize-space()='Apply']]`);
    }
    await this.page.click(xpathStartPlan);
  }

  /**
   * Get balance, charge sub amount, end free trial date in popup top up confirmation
   * @returns balance, charge sub amount, end free trial
   */
  async getInfoInTopupRecommend(): Promise<TopUpReconmendInfo> {
    const currentBalanceString = await this.getTextContent(`//strong[contains(text(),'Your current balance')]`);
    let currentBalance = currentBalanceString.split(":")[1];
    currentBalance = removeCurrencySymbol(currentBalance.trim());
    const packagePrice = await this.getTextContent(`//span[@class='text-bold package-price']`);
    const endFreeTrialAt = await this.getTextContent(`//span[@class='text-bold end_trial_at']`);

    return {
      current_balance: currentBalance,
      charge_amount: removeCurrencySymbol(packagePrice),
      end_free_trial_at: endFreeTrialAt,
    };
  }

  async getShopNameLocator(shopName: string): Promise<Locator> {
    return this.page.locator(`//p[text()="${shopName}"]`);
  }
}
