import { SBPage } from "@pages/page";
import { MailBox } from "@pages/thirdparty/mailbox";
import { Locator, Page } from "@playwright/test";
import type { DataRefPrintBaseOrPlusBase, ListingData, ValueEachOfGroup } from "@types";
import type { DataRefShopBase, DataSummary } from "@types";

export class ListingPage extends SBPage {
  emailLoc: Locator;
  pwdLoc: Locator;
  signInLoc: Locator;
  listingName: string;
  listingNamePreview: string;

  xpathTableCashbackReport = "//div[@class='s-tab-item']";
  xpathTabCashbackReport = "//div[contains(@class,'affiliate-tier-tab-conten')]//p[text()='Cashback report']";
  xpathTextYourCashback = "//h4[contains(text(),'Your Cashback')]";
  xpathTextShareUniqueLink = "//h4[contains(text(), 'Share your unique link')]";
  xpathLoading = "//div[@class='s-detail-loading__body']";
  xpathOTP = `//input[@placeholder="Enter OTP number"]`;
  xpathConfirmBtn = `//span[@class='text-white' and normalize-space()='Confirm']`;
  xpathTitleAddYourContactPage = "//section[@class='survey']//h1";

  constructor(page: Page, domain: string) {
    super(page, domain);
    this.emailLoc = this.page.locator('//input[@id="email"]');
    this.pwdLoc = this.page.locator('//input[@id="password"]');
    this.signInLoc = this.page.locator('//button[normalize-space()="Sign in"]');
    this.listingName = "";
    this.listingNamePreview = "";
  }

  xpathSubModuleAffiliate(platform: string): string {
    return `//span[normalize-space()='${platform}']`;
  }
  /**
   * Go to select store page
   * @param email
   * @param password
   */
  async goToSignInPage({ email = "", password = "" }: { email: string; password: string }) {
    await this.page.goto(`https://${this.domain}/admin`);
    await this.emailLoc.fill(email);
    await this.pwdLoc.fill(password);
    await Promise.all([this.page.waitForNavigation(), this.signInLoc.click()]);
    await this.page.locator('//div[@class="s-dropdown-trigger"]').click();
    await this.page.locator('//div[@class="m-t"]//div[normalize-space()="Partner Dashboard"]').click();
  }

  //Go to listing page
  async goToListingsPage(page: Page) {
    await page
      .locator(`//span[contains(@class,'unite-ui-dashboard') and normalize-space()='ShopBase Network']`)
      .click();
  }

  //Go to create listing page
  async goToCreateListingPage(page: Page) {
    await page.locator('//div//button[normalize-space()="Create listing"]').click();
  }

  /**
   * Fill info listing
   * @param title
   * @param category
   * @param image
   * @param fromPrice
   * @param toPrice
   * @param description
   */
  async fillInforListing(page: Page, conf: ListingData) {
    const currentTime = Math.floor(Date.now() / 1000);
    await page
      .locator('//div[@class="sb-flex"]//*[@placeholder="Ex: I will help you optimize marketing performance"]')
      .fill(conf.title + currentTime);
    await page
      .locator('//div//label[normalize-space()="Category"]//following::span[normalize-space()="Please select"]')
      .click();
    await page.locator(`//div[contains(@class,"sb-select-menu")]//li[normalize-space()="${conf.category}"]`).click();

    if (conf.image.filePath) {
      await page.setInputFiles("input[type='file']", conf.image.filePath);
    }

    await page
      .locator('//div[@class="price-from-to"]//*[normalize-space()="From"]//following-sibling::div//input')
      .fill(conf.fromPrice);
    await page
      .locator('//div[@class="price-from-to"]//*[normalize-space()="To"]//following-sibling::div//input')
      .fill(conf.toPrice);

    await page.waitForSelector("[title='Rich Text Area']");
    await page.frameLocator("[title='Rich Text Area']").locator("#tinymce").type(conf.description);
    await page.locator('//button[normalize-space()="Save changes"]').click();

    //Verify message create listing successfully
    await page.waitForSelector(
      `//div[contains(@class,'s-toast')]//div[normalize-space()='Create Listing Successfully']`,
    );
    this.listingName = await this.getTextContent(`//div[@id='page-header']//div[@class='sb-font sb-flex']`);

    //Back to listing list page
    await page.locator('//span[normalize-space()="ShopBase Network"]').click();
  }

  //Fill listing infor
  async fillListingNameIntoSearchBar(page: Page) {
    if (this.listingName) {
      await page
        .locator('//div[@class="sb-filter__search sb-flex"]//input[@placeholder="Search by listing name"]')
        .fill(this.listingName);
    }
  }

  /**
   * Go to partner dashboard
   */
  async goToPartnerDashboard() {
    await this.page.locator('//div[@class="s-dropdown-trigger"]').click();
    await this.page.waitForTimeout(2 * 1000); //wait for dropdown visible
    await Promise.all([
      this.page.waitForNavigation(),
      this.genLoc('//div[@class="m-t"]//div[normalize-space()="Partner Dashboard"]').click(),
    ]);
    await this.page.waitForTimeout(2 * 1000); //wait for page redirect successfully
  }

  /**
   * Get fpr code
   * @returns <string> fpr code
   */
  async getFprCodeAffiliate(): Promise<string> {
    return await this.genLoc("//input[@placeholder='type your custom link']").inputValue();
  }

  /**
   * Đăng kí tài khoản shopbase từ link affiliate có fpr code
   * @param password
   * @param storeName
   * @param mail mailinator nhận chuyển tiếp thư từ mail đăng ký shop
   * @returns
   */
  async signUpAffiliate(context, password: string, storeName: string, forwardMail: string): Promise<string> {
    const timeStamp = Date.now();
    const email = `vananhnguyen1+${timeStamp}@beeketing.net`;
    const store = storeName + timeStamp;
    // fill information
    await this.genLoc('[placeholder="example\\@email\\.com"]').fill(email);
    await this.genLoc('[placeholder="Password"]').fill(password);
    await this.genLoc('[placeholder="Your shop name"]').fill(store);
    // click "Sign up" button
    await this.genLoc('button:has-text("Sign up")').click();
    try {
      await this.waitUntilElementVisible(this.xpathTitleAddYourContactPage);
    } catch (error) {
      //Check OTP
      const isPopupOTPVisible = await this.genLoc(this.xpathOTP).isVisible();
      if (isPopupOTPVisible) {
        const newTab = await context.newPage();
        const mailBox = new MailBox(newTab, this.domain);
        //wait to forward newest mail
        await mailBox.page.waitForTimeout(2 * 1000);
        await mailBox.openMailDetailWithAPI(forwardMail, "Profile setting update confirmation");
        const otp = await mailBox.page.locator(`//p[contains(text(), '${email}')]//parent::td//table//p`).innerText();

        await this.genLoc(this.xpathOTP).fill(otp);
        await this.genLoc(this.xpathConfirmBtn).click();
      } else {
        await this.genLoc(`//button[contains(@class, 'close')]`).click();
        await this.genLoc('button:has-text("Sign up")').click();
        await this.waitUntilElementInvisible("//h4[normalize-space()='Verify your account']");
        await this.waitUntilElementVisible(this.xpathTitleAddYourContactPage);
      }
    }
    return email;
  }

  /**
   * Get data summary of promoter
   * @returns hàm này return 1 object chứa total click, total ref, total qualified cashback, total hold cashback,
   * total hold item, total qualified item, total cashback
   */
  async getDataSummaryOfPromoter(): Promise<DataSummary> {
    const dataSummary: DataSummary = {
      totalClick: 0,
      totalRef: 0,
      totalQualifiedCashback: 0,
      totalHoldCashback: 0,
      totalQualifiedItems: 0,
      totalHoldItem: 0,
      totalCashback: 0,
    };

    dataSummary.totalClick = Number(await this.page.innerText("//p[text()='Clicks']//preceding-sibling::p"));
    dataSummary.totalRef = Number(await this.page.innerText("//p[text()='Referred users']//preceding-sibling::p"));

    const isTotalQualifiedCashbackVisible = await this.genLoc("//p[text()='Qualified Cashback']").isVisible();
    if (isTotalQualifiedCashbackVisible) {
      dataSummary.totalQualifiedCashback = Number(
        await this.page.innerText("//p[text()='Qualified Cashback']//preceding-sibling::p"),
      );
    }

    const isTotalHoldCashbackVisible = await this.genLoc("//p[text()='Hold Cashback']").isVisible();
    if (isTotalHoldCashbackVisible) {
      dataSummary.totalHoldCashback = Number(
        await this.page.innerText("//p[text()='Hold Cashback']//preceding-sibling::p"),
      );
    }

    const isTotalQualifiedItemsVisible = await this.genLoc(
      "//div[contains(@class,'stats-info')]//p[text()='Qualified items']",
    ).isVisible();
    if (isTotalQualifiedItemsVisible) {
      dataSummary.totalQualifiedItems = Number(
        await this.page.innerText("//p[text()='Qualified items']//preceding-sibling::p"),
      );
    }

    const isTotalHoldItemVisible = await this.genLoc(
      "//div[contains(@class,'stats-info')]//p[text()='Hold items']",
    ).isVisible();
    if (isTotalHoldItemVisible) {
      dataSummary.totalHoldItem = Number(await this.page.innerText("//p[text()='Hold items']//preceding-sibling::p"));
    }

    const isTotalCashbackVisible = await this.genLoc(
      "//div[contains(@class,'stats-info')]//p[text()='Cashback']",
    ).isVisible();
    if (isTotalCashbackVisible) {
      dataSummary.totalCashback = Number(await this.page.innerText("//p[text()='Cashback']//preceding-sibling::p"));
    }

    return dataSummary;
  }

  /**
   * Search and get data of referee shopbase affiliate
   * @param email là user email referee đã đăng kí tài khoản shopbase
   * @param status truyền vào 1 trong 2 giá trị, status = true trong trường hợp user sign up trở thành ref,
   * status = false khi user sign up không thành ref
   * @returns hàm này return object DataRefShopBase nếu user sign up trở thành ref.
   * Nếu user sign up không trở thành ref thì return message không tồn tại email khi search
   */
  async searchAndGetDataRefShopBase(email: string, status: boolean): Promise<DataRefShopBase | string> {
    await this.genLoc("//input[@placeholder='Search by email']").fill(email);
    await this.page.keyboard.press("Enter");
    if (status) {
      return {
        user: await this.page.innerText("//div[@class='profit-statistic-table-slot name user-email']"),
        referDate: await this.page.innerText("(//div[@class='profit-statistic-table-slot data text-right s-mr16'])[1]"),
        qualifiedCashback: Number(
          await this.page.innerText("(//div[@class='profit-statistic-table-slot data text-right s-mr16'])[2]"),
        ),
        holdCashback: Number(
          await this.page.innerText("(//div[@class='profit-statistic-table-slot data text-right s-mr16'])[3]"),
        ),
      };
    } else {
      return await this.page.innerText("//div[@class='not-found-data text-center']//p");
    }
  }

  /**
   * Search and get data of referee printbase affiliate
   * @param email là user email referee đã đăng kí tài khoản shopbase
   * @param status truyền vào 1 trong 2 giá trị, status = true trong trường hợp user sign up trở thành ref,
   * status = false khi user sign up không thành ref
   * @returns hàm này return object DataRefPrintBaseOrPlusBase nếu user sign up trở thành ref.
   * Nếu user sign up không trở thành ref thì return message không tồn tại email khi search
   */
  async searchAndGetDataRefPrintBase(email: string, status: boolean): Promise<DataRefPrintBaseOrPlusBase | string> {
    await this.genLoc("//input[@placeholder='Search by email']").fill(email);
    await this.page.keyboard.press("Enter");
    const xpathGroupNameIndex3 = "(//table[@class='table plusbase-table']//th)[3]//p";
    const xpathGroupNameIndex4 = "(//table[@class='table plusbase-table']//th)[4]//p";
    if (status) {
      const groupIndex3 = (await this.page.innerText(xpathGroupNameIndex3)).toUpperCase();
      const groupIndex4 = (await this.page.innerText(xpathGroupNameIndex4)).toUpperCase();
      const dataCashbackReport1 = {
        user: await this.page.innerText("//p[contains(@class,'ref-email')]"),
        referDate: await this.page.innerText("((//table[@class='table plusbase-table']//tbody//tr)[2]//td)[2]//p"),
        qualifiedItemsGB: (await this.getValueCashbackGroup(3)).qualifiedItems,
        holdItemsGB: (await this.getValueCashbackGroup(3)).holdItems,
        cashbackGB: (await this.getValueCashbackGroup(3)).cashback,
        qualifiedItemsSB: (await this.getValueCashbackGroup(4)).qualifiedItems,
        holdItemsSB: (await this.getValueCashbackGroup(4)).holdItems,
        cashbackSB: (await this.getValueCashbackGroup(4)).cashback,
        totalCashback: Number(
          await this.page.innerText("((//table[@class='table plusbase-table']//tbody//tr)[2]//td)[5]"),
        ),
      };

      const dataCashbackReport2 = {
        user: await this.page.innerText("//p[contains(@class,'ref-email')]"),
        referDate: await this.page.innerText("((//table[@class='table plusbase-table']//tbody//tr)[2]//td)[2]"),
        qualifiedItemsGB: (await this.getValueCashbackGroup(4)).qualifiedItems,
        holdItemsGB: (await this.getValueCashbackGroup(4)).holdItems,
        cashbackGB: (await this.getValueCashbackGroup(4)).cashback,
        qualifiedItemsSB: (await this.getValueCashbackGroup(3)).qualifiedItems,
        holdItemsSB: (await this.getValueCashbackGroup(3)).holdItems,
        cashbackSB: (await this.getValueCashbackGroup(3)).cashback,
        totalCashback: Number(
          await this.page.innerText("((//table[@class='table plusbase-table']//tbody//tr)[2]//td)[5]"),
        ),
      };

      if (groupIndex3 === "GOLD BASE" && groupIndex4 === "SILVER BASE") {
        return dataCashbackReport1;
      } else if (groupIndex3 === "SILVER BASE" && groupIndex4 === "GOLD BASE") {
        return dataCashbackReport2;
      }
    } else {
      return await this.page.innerText("//div[@class='not-found-data text-center']//p");
    }
  }

  /**
   * Search and get data of referee plusbase affiliate
   * @param email là user email referee đã đăng kí tài khoản shopbase
   * @param status truyền vào 1 trong 2 giá trị, status = true trong trường hợp user sign up trở thành ref,
   * status = false khi user sign up không thành ref
   * @returns hàm này return object DataRefPrintBaseOrPlusBase nếu user sign up trở thành ref.
   * Nếu user sign up không trở thành ref thì return message không tồn tại email khi search
   */
  async searchAndGetDataRefPlusBase(email: string, status: boolean): Promise<DataRefPrintBaseOrPlusBase | string> {
    await this.genLoc("//input[@placeholder='Search by email']").fill(email);
    await this.page.keyboard.press("Enter");
    if (status) {
      const dataCashbackReport = {
        user: await this.page.innerText("//p[contains(@class,'ref-email')]"),
        referDate: await this.page.innerText("((//table[@class='table plusbase-table']//tbody//tr)[2]//td)[2]//p"),
        qualifiedItemsStarBase: (await this.getValueCashbackGroup(3)).qualifiedItems,
        holdItemsStarBase: (await this.getValueCashbackGroup(3)).holdItems,
        totalCashback: Number(
          await this.page.innerText("((//table[@class='table plusbase-table']//tbody//tr)[2]//td)[4]"),
        ),
      };
      return dataCashbackReport;
    } else {
      return await this.page.innerText("//div[@class='not-found-data text-center']//p");
    }
  }

  /**
   * Get các giá trị {qualified items, hold items, cashback} theo group của từng referee
   * @param columnIndex
   * @returns hàm này return obj ValueEachOfGroup
   */
  async getValueCashbackGroup(columnIndex: number): Promise<ValueEachOfGroup> {
    const xpathColumnInTableCashbackReport = `((//table[@class='table plusbase-table']//tbody//tr)[2]//td)[${columnIndex}]`;
    let cashback = 0;
    const qualifiedItems = Number(
      await this.page.innerText(`${xpathColumnInTableCashbackReport}//p[contains(@class,'qualified-item')]`),
    );
    const holdItems = Number(
      await this.page.innerText(`${xpathColumnInTableCashbackReport}//p[contains(@class,'hold-item')]`),
    );
    const xpathCashbackGroup = await this.genLoc(
      `${xpathColumnInTableCashbackReport}//p[contains(@class,'cashback')]`,
    ).isVisible();
    if (xpathCashbackGroup) {
      cashback = Number(
        await this.page.innerText(`${xpathColumnInTableCashbackReport}//p[contains(@class,'cashback')]`),
      );
    }
    return {
      qualifiedItems: qualifiedItems,
      holdItems: holdItems,
      cashback: cashback,
    };
  }
}
