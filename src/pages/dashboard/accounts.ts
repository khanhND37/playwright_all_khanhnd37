import { expect, Locator, Page, Response } from "@playwright/test";
import { SBPage } from "@pages/page";
import type { ConfigStore, OnboardingQuestion } from "@types";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { MailBox } from "@pages/thirdparty/mailbox";

export class AccountPage extends SBPage {
  emailLoc: Locator;
  pwdLoc: Locator;
  storeNameLoc: Locator;
  signInLoc: Locator;
  xpathTextFreeTrialSignUpPage = "//div[@class='unite-ui-login__title']/h1";
  xpathTitleAddYourContactPage = `//*[contains(text(),"Let's get to know each other")]`;
  xpathBtnStartFreeTrialLandingPage = "//div[@class='div-block-235']/a | //div[@class='div-block-3']/a";
  xpathTextSelectAShop = "//p[contains(@class,'text-select-shop')]";
  xpathTitleSignInPage = "//div[@class='unite-ui-login__main']//p[text()='Sign in']";
  xpathShopDomain = "(//p[@class='text-truncate font-12'])[1]";
  xpathCreateStoreSuccess = "//p[normalize-space()='Yay! Your store is ready to go!']";
  xpathNotify = "//header[contains(@class,'shopbase-sidebar')]//div[@class='in-app-notification']";
  xpathOTP = `//input[@placeholder="Enter OTP number"]`;
  xpathConfirmBtn = `//span[@class='text-white' and normalize-space()='Confirm']`;
  xpathButtonNoImport = `//span[normalize-space()="No thanks, I don't want to import"]`;
  xpathSelectShopTitle = `//p[normalize-space()='Select a shop']`;
  xpathAddNewShopBtn = `//button[@type='button' and normalize-space() = 'Add a new shop']`;
  xpathSurveyImport = ".survey-wrap__import-content";

  constructor(page: Page, domain: string) {
    super(page, domain);
    this.emailLoc = this.page.locator("[placeholder='example@email.com']");
    this.pwdLoc = this.page.locator("[placeholder='Password']");
    this.signInLoc = this.page.locator("button:has-text('Sign in')");
  }

  /**
   * Login to dashboard
   */
  async login({
    email = "",
    password = "",
    redirectToAdmin = true,
  }: {
    email?: string;
    password?: string;
    redirectToAdmin?: boolean;
  }) {
    if (redirectToAdmin) {
      try {
        await this.goToAdmin();
      } catch (e) {
        // Retry again if page is blank or can't load
        await this.goToAdmin();
      }
    }
    await this.emailLoc.fill(email);
    await this.pwdLoc.fill(password);
    await Promise.all([this.page.waitForNavigation(), this.signInLoc.click()]);
    await this.page.waitForLoadState("load");
  }

  async goToAdmin() {
    await this.page.goto(`https://${this.domain}/admin`, {
      timeout: 30 * 1000,
    });
    await this.page.waitForTimeout(5 * 1000);
  }

  /**
   * select shop by id
   * @param id if of shop
   */
  async selectShopByID(id: number) {
    await Promise.all([this.page.waitForNavigation(), this.page.locator(this.buildShopIdLocation(id)).click()]);
  }

  /**
   * select shop by name
   * @param name name of shop
   */
  async selectShopByName(name: string, waitForNavigation = true) {
    const actions: Promise<void | Response>[] = [this.page.locator(this.buildShopNameLocation(name)).click()];
    if (waitForNavigation) {
      actions.push(this.page.waitForNavigation());
    }
    await Promise.all(actions);
  }

  /**
   * select last shop
   */
  async selectLastShop() {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.locator(`(//span[@class="ui-login_domain-label"])[last()]`).click(),
    ]);
  }

  /**
   * change the language
   * @param language the language
   */
  async changeLanguage(language: string) {
    await this.page.locator("//div[@class='lang-select']").click();
    await this.page.locator(`//span[@class="s-dropdown-item"]//div[normalize-space()="${language}"]`).click();
    await this.page.waitForLoadState("load");
  }

  /**
   * add new shop
   * @param name name of shop
   */
  async addNewShop(name: string) {
    await this.page.locator("(//button[@type='button'])[1]").click();
    await this.page.locator("//input[@type='text']").fill(name);
    await this.page.locator("//button[@type='submit']").click();
    await this.page.waitForLoadState("load");
  }

  /**
   * Sign up an account
   * @param email email of account
   * @param password password of account
   * @param phoneNum phone number of account
   * @param storeName name of store
   * @param fName first name
   * @param lName last name
   * @param country country of shop
   * @param fbLink link on Facebook
   */
  async signUp(
    email: string,
    password: string,
    phoneNum: string,
    storeName: string,
    fName: string,
    lName: string,
    country: string,
    fbLink: string,
  ) {
    await this.page.locator("text=Sign up.").click();
    await this.page.locator("[placeholder='example@email.com']").fill(email);
    await this.page.locator("[placeholder='Password']").fill(password);
    await this.page.locator("[placeholder='Your shop name']").fill(storeName);
    await Promise.all([this.page.waitForNavigation(), this.page.locator("button:has-text('Sign up')").click()]);
    // fill information
    await this.page.locator("[placeholder='Enter your name']").fill(fName);
    await this.page.locator("[placeholder='Enter your last name']").fill(lName);
    await this.page.click("//input[@placeholder='Select Store country']");
    await this.page.fill(`//input[@placeholder="Select Store country"]`, country);
    await this.page.click(`//div[@placeholder="Select Store country"]/div/div[text()[normalize-space()="${country}"]]`);
    await this.page.click("//input[@placeholder='Select personal location']");
    await this.page.fill(`//input[@placeholder="Select personal location"]`, country);
    await this.page.click(
      `//div[@placeholder="Select personal location"]/div/div[text()[normalize-space()="${country}"]]`,
    );
    await this.page.locator("//input[@id='phone-number']").fill(phoneNum);
    await this.page.locator("[placeholder='www\\.facebook\\.com\\/shopbase']").fill(fbLink);
    await this.page.locator(`//button/span[normalize-space()="Next"]`).click();
    await this.page.locator("text=Others").click();
    await this.page.locator("text=$0 - $20,000 (I'm just getting started)").click();
    await this.page.locator("button:has-text('Next')").click();
    await this.page.waitForSelector(`//img[@alt="in-app-notification-bell"]`);
  }
  // private section

  private buildShopIdLocation(id: number) {
    return `(//li[@class="shopify"])[${id}]`;
  }

  private buildShopNameLocation(name: string) {
    return `(//span[normalize-space()="${name}"])[1]`;
  }

  /**
   * Sign up in case security
   * @param email Enter an email address
   * @param password Enter password
   * @param storeName Enter a store name
   * @param force true | false
   * if force == false -> email, password and store name is required
   * else -> email, password or store name can be null
   */
  async signUpSecurity(email: string, password: string, storeName: string, force: boolean) {
    if (!force || !email || !password || !storeName) {
      throw new Error("Your input is missing parameter(s)");
    } else {
      // go to "Sign up" page
      await this.page.goto(`https://${this.domain}/sign-up`);
      // fill information
      await this.page.locator("[placeholder='example\\@email\\.com']").fill(email);
      await this.page.locator("[placeholder='Password']").fill(password);
      await this.page.locator("[placeholder='Your shop name']").fill(storeName);
      // click "Sign up" button
      await this.page.locator("button:has-text('Sign up')").click();
    }
  }

  /**
   * Sign in in case security
   * @param email Enter an email address
   * @param password Enter password
   * @param force true | false
   * if force == false -> email, password and store name is required
   * else -> email, password or store name can be null
   */
  async signInSecurity(email: string, password: string, force: boolean) {
    if (!force || !email || !password) {
      throw new Error("Your input is missing parameter(s)");
    } else {
      // go to "Sign in" page
      await this.page.goto(`https://${this.domain}/sign-in`);
      // fill information
      await this.page.locator("[placeholder='example\\@email\\.com']").fill(email);
      await this.page.locator("[placeholder='Password']").fill(password);
      // click "Sign in" button
      await this.page.locator("button:has-text('Sign in')").click();
    }
  }

  /**
   * Add your contact khi tạo shop
   * @param storeCountry
   * @param perLocation
   * @param phoneNumber
   */
  async addYourContact(storeCountry: string, perLocation: string, phoneNumber: string) {
    await this.page
      .locator("//input[@placeholder='Select Store country' or @placeholder='Select store country']")
      .click();
    await this.page.locator(`(//div[@value="${storeCountry}"])[1]`).click();
    await this.page.locator("//input[@placeholder='Select personal location']").click();
    await this.page.locator(`(//div[@value="${perLocation}"])[2]`).click();
    await this.page.locator(`//input[@id="phone-number"]`).fill(phoneNumber);
    await this.page.locator("//span[normalize-space()='Next']").click();
  }

  /**
   * Chọn business, platform khi tạo shop
   * @param businessModel
   * @param industry
   * @param platform
   */
  async chooseBusinessModel(businessModel: string, industry: string, platform?: string) {
    // Because on dev & prod we have different choice text:
    const businessModelWithoutIng = businessModel.replace("ping", "");
    await this.page
      .locator(`//*[normalize-space()="${businessModel}" or normalize-space()="${businessModelWithoutIng}"]`)
      .first()
      .click();
    if (industry) {
      await this.page.locator(`//*[normalize-space()="${industry}"]`).first().click();
    }

    const btnNext = this.page.locator("//span[normalize-space()='Next']").first();
    const isButtonNextVisible = await btnNext.isVisible();
    if (isButtonNextVisible) {
      await btnNext.click();
    }

    if (platform) {
      await this.page.locator(`//span[normalize-space()="${platform}"]`).click();
    }
  }

  /**
   * Clear shop data
   * @param linkHive, shopID
   */
  async clearShopData(linkHive: string, shopID: string) {
    const response = await this.page.request.post(
      `https://${linkHive}/admin/qc-tools/clear-shop-data?shop_id=${shopID}`,
    );
    expect(response.status()).toBe(200);
  }

  /**
   * Choose business, platform when choose sell Physical Product
   * @param businessModel choose a bussiness model. Ex: General Dropshipping, Niche Dropshipping,...
   * @param platform choose a platform. Ex: I want a ShopBase store, I want a PrintBase store,...
   */
  async chooseBusinessModelPhysical(businessModel: string, platform: string) {
    await this.page.locator(`//p[normalize-space()="I sell Physical Product"]`).click();
    await this.page.locator(`//li[normalize-space()="${businessModel}"]`).click();
    await this.page.locator(`//span[normalize-space()="${platform}"]`).click();
    await this.page.locator(`(//span[@class="s-flex s-flex--align-center"])[1]`).click();
  }

  /**
   * Đăng nhập store mới: Login account shop base -> create a new shop
   * @param conf: Config store data
   * @param currentTime: time current
   */
  async createNewStore(conf: ConfigStore, currentTime: number) {
    await this.addNewShop(`${conf.name} + ${currentTime}`);
    await this.addYourContact(conf.store_coutry, conf.per_location, conf.phone_number);
    await this.chooseBusinessModelPhysical(conf.business_model, conf.platform);
  }

  /**
   * Đăng nhập store mới: Chọn Select another shop -> Add a new shop
   * @param name: name of store
   * @param businessModel: choose a bussiness model. Ex: General Dropshipping, Niche Dropshipping,...
   * @param platform: choose a platform. Ex: I want a ShopBase store, I want a PrintBase store,...
   */
  async signInNewStore(name: string, businessModel: string, platform: string) {
    await this.page.locator(`//p[@class="text-truncate font-12"]`).click();
    await this.page.locator(`//div[normalize-space()="Select another shop"]`).click();
    await this.addNewShop(name);
    await this.page.locator(`(//span[normalize-space()="Next"])[1]`).click();
    await this.chooseBusinessModelPhysical(businessModel, platform);
  }

  async signDashboard(businessModel: string, platform: string) {
    await this.chooseBusinessModelPhysical(businessModel, platform);
    await this.page.locator(`//button[normalize-space()="Take me to my store"]`).click();
    await this.page.waitForSelector("//ul[@class='nav nav-sidebar']");
    return new DashboardPage(this.page, this.domain);
  }

  /**
   * Add first store.
   * @param conf
   */
  async completeOnboardingSurveyFisrtStore(conf: ConfigStore) {
    await this.genLoc("[placeholder='Enter your name']").fill(conf.first_name);
    await this.genLoc("[placeholder='Enter your last name']").fill(conf.last_name);
    await this.page.click("//input[@placeholder='Select Store country']");
    await this.page.fill(`//input[@placeholder="Select Store country"]`, conf.store_coutry);
    await this.page.click(
      `//div[@placeholder="Select Store country"]/div/div[text()[normalize-space()="${conf.store_coutry}"]]`,
    );
    await this.page.click("//input[@placeholder='Select personal location']");
    await this.page.fill(`//input[@placeholder="Select personal location"]`, conf.store_coutry);
    await this.page.click(
      `//div[@placeholder="Select personal location"]/div/div[text()[normalize-space()="${conf.store_coutry}"]]`,
    );
    await this.genLoc("//input[@id='phone-number']").fill(conf.phone_number);
    await this.genLoc(`//button/span[normalize-space()="Next"]`).click();
    await this.page.waitForTimeout(2 * 1000);
    // chọn business model nếu user nằm trong fsw tạo shop creator
    const isBusinessModelVisible = await this.genLoc(
      "//div[contains(@class,'survey__your-type-content type')]/h1[normalize-space()='What is your business model?']",
    ).isVisible();
    if (isBusinessModelVisible) {
      await this.genLoc(`//p[normalize-space()="${conf.business_model}"]`).click();
    }
    await this.genLoc(`//li[normalize-space()="${conf.business_type}"]`).click();
    const isRevenueSelectionVisible = await this.genLoc(`//h3[contains(text(), 'monthly revenue')]`).isVisible();
    if (isRevenueSelectionVisible === true) {
      await this.genLoc(`//li[normalize-space()="${conf.monthly_revenue}"]`).click();
      await this.genLoc(`//button/span[normalize-space()="Next"]`).click();
    } else {
      await this.genLoc("//div[@class='survey__type-business-v3']//p").click();
      await this.genLoc(`//button/span[normalize-space()="Next"]`).click();
    }
    await this.page.waitForTimeout(3 * 1000);
    // chọn platform nếu step trước chọn business_type là PrintBase/General Dropshipping/Niche Dropshipping
    const isTitleChoosePlatformVisible = await this.genLoc("//div[@class='survey-step-title']").isVisible();
    if (isTitleChoosePlatformVisible) {
      await this.genLoc(`//span[normalize-space()="${conf.platform}"]`).click();
    }
    try {
      await this.waitResponseWithUrl("/signup/complete-survey", 3000);
    } catch {
      await this.genLoc("//button[normalize-space()='Take me to my store']").click();
    }
  }

  /**
   * check OTP when create new shop
   */
  async checkOTP(context, email: string) {
    const newTab = await context.newPage();
    const mailBox = new MailBox(newTab, this.domain);
    await mailBox.openMailDetailWithAPI(email, "Profile setting update confirmation");
    //wait to forward newest mail
    await mailBox.page.waitForTimeout(2 * 1000);
    const otp = await mailBox.page.locator(`//p[contains(text(), '${email}')]//parent::td//table//p`).innerText();
    await this.genLoc(this.xpathOTP).fill(otp);
    await this.genLoc(this.xpathConfirmBtn).click();
  }

  async inputShopNameAndClickBtnCreate(context, shopName: string, email: string) {
    await this.page.locator("//a[@id='create-shop']//input[@placeholder='Your shop name']").fill(shopName);
    await this.page.locator("//a[@id='create-shop']//button[@type='submit']").click({ delay: 2000 });
    try {
      await this.waitUntilElementVisible(this.xpathTitleAddYourContactPage);
    } catch (error) {
      //Check OTP
      const isPopupOTPVisible = await this.genLoc(this.xpathOTP).isVisible();
      if (isPopupOTPVisible) {
        await this.checkOTP(context, email);
      } else {
        await this.genLoc(`//button[contains(@class, 'close')]`).click();
        await this.genLoc(`//a[@id='create-shop']//button[@type='submit']`).click({ delay: 2000 });
        await this.waitUntilElementVisible(this.xpathTitleAddYourContactPage);
      }
    }
  }

  async inputAccountAndSignIn({ email = "", password = "" }: { email?: string; password?: string }) {
    await this.emailLoc.fill(email);
    await this.pwdLoc.fill(password);
    await Promise.all([this.page.waitForNavigation(), this.signInLoc.click()]);
    await this.page.waitForLoadState("load");
  }

  async inputAccountAndSignInNoWait({ email = "", password = "" }: { email?: string; password?: string }) {
    await this.emailLoc.fill(email);
    await this.pwdLoc.fill(password);
    await this.signInLoc.click();
  }

  async gotoAdmin() {
    await this.page.goto(`https://${this.domain}/admin`);
  }

  /**
   * kiểm tra xem các câu hỏi onboarding có hiển thị không
   * @param listOnboardingQuestion: danh sách câu hỏi onboarding
   * @param startIndex: index của câu hỏi muốn kiểm tra
   * @param numberOfQuestion: số lượng câu hỏi muốn kiểm tra
   * @returns true| false
   */
  async isListQuestionVisible(
    listOnboardingQuestion: OnboardingQuestion[],
    startIndex = 0,
    numberOfQuestion = listOnboardingQuestion.length,
  ): Promise<boolean> {
    for (let index = startIndex; index < numberOfQuestion; index++) {
      if ((await this.isTextVisible(listOnboardingQuestion[index].question)) === false) return false;
      for (let i = 0; i < listOnboardingQuestion[index].answers.length; i++) {
        if ((await this.isTextVisible(listOnboardingQuestion[index].answers[i])) === false) return false;
      }
    }
    return true;
  }

  /**
   * trả lời các câu hỏi trong màn onboarding question
   * @param answers: danh sách câu trả lời
   */
  async answerQuestionInOnboarding(answers: string[]) {
    for (let index = 0; index < answers.length; index++) {
      await this.page.waitForLoadState("networkidle");
      await this.clickElementWithLabel("li", answers[index]);
    }
  }

  /**
   * complete Survey New store
   * @param conf
   */
  async completeOnboardingSurveyNewStore(conf: ConfigStore) {
    await this.page.click("//input[@placeholder='Select Store country']");
    await this.page.fill(`//input[@placeholder="Select Store country"]`, conf.store_coutry);
    await this.page.click(
      `//div[@placeholder="Select Store country"]/div/div[text()[normalize-space()="${conf.store_coutry}"]]`,
    );
    await this.page.click("//input[@placeholder='Select personal location']");
    await this.page.fill(`//input[@placeholder="Select personal location"]`, conf.store_coutry);
    await this.page.click(
      `//div[@placeholder="Select personal location"]/div/div[text()[normalize-space()="${conf.store_coutry}"]]`,
    );
    await this.genLoc("//input[@id='phone-number']").fill(conf.phone_number);
    await this.genLoc(`//button/span[normalize-space()="Next"]`).click();
    await this.page.waitForTimeout(2 * 1000); //wait for page load
    const isBusinessTypeVisible = await this.genLoc(`//div[contains(@class, 'list-type-product')]`).isVisible();
    if (isBusinessTypeVisible) {
      await this.genLoc(`//p[normalize-space()="${conf.business_type}"]`).click();
    }
    const isBusinessModelVisible = await this.genLoc("//div[contains(@class,'survey__type-business')]").isVisible();
    if (isBusinessModelVisible) {
      await this.genLoc(`//li[normalize-space()="${conf.business_model}"]`).click();
    }
    const isRevenueSelectionVisible = await this.genLoc(`//h3[contains(text(), 'monthly revenue')]`).isVisible();
    if (isRevenueSelectionVisible) {
      await this.genLoc(`//li[normalize-space()="${conf.monthly_revenue}"]`).click();
      await this.genLoc(`//button/span[normalize-space()="Next"]`).click();
    }
    await this.page.waitForTimeout(3 * 1000); //wait for page load
    // chọn platform nếu step trước chọn business_type là PrintBase/General Dropshipping/Niche Dropshipping
    const isTitleChoosePlatformVisible = await this.genLoc("//div[@class='survey-step-title']").isVisible();
    if (isTitleChoosePlatformVisible) {
      await this.genLoc(`//span[normalize-space()="${conf.platform}"]`).click();
    }
    await this.page.waitForTimeout(3 * 1000); //wait for page load
    const isImportContentVisible = await this.genLoc(`//h1[contains(text(), 'Import content')]`).isVisible();
    if (isImportContentVisible) {
      await this.genLoc(`//span[normalize-space()="No thanks, I don't want to import"]`).click();
      try {
        await this.waitResponseWithUrl("/signup/complete-survey", 3000);
      } catch {
        await this.genLoc("//button[normalize-space()='Take me to my store']").click();
      }
    }
  }

  /**
   * Creat a new store
   */
  async createNewShop(context, email: string, password: string, storeName: string, conf: ConfigStore) {
    const timeStamp = Date.now();
    const shopName = storeName + timeStamp;
    //login
    await this.login({
      email: email,
      password: password,
    });
    await this.genLoc(this.xpathAddNewShopBtn).click();
    await this.inputShopNameAndClickBtnCreate(context, shopName, email);
    await this.completeOnboardingSurveyNewStore(conf);
  }

  async selectShopToImport(shopName: string, contents?: Array<string>) {
    await this.genLoc("//select").selectOption({ label: `${shopName}` });
    if (contents) {
      // uncheck all checkbox do default ticked all
      const countCheckbox = await this.page.locator("//span[@class='s-check']").count();
      for (let i = 0; i < countCheckbox; i++) {
        await this.page.click(`(//span[@class='s-check'])[${i + 1}]`);
      }
      // tick các option muốn chọn
      for (let i = 0; i < contents.length; i++) {
        await this.page.click(
          `//label[@class='s-checkbox' and descendant::span[normalize-space()='${contents[i]}']]//span[@class='s-check']`,
        );
      }
    }
  }
}
