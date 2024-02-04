import { Locator, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import type { CreatorData } from "@types";

export class CreatorPage extends SBPage {
  xpathMsgRemindLogin = "//div[@class='unite-ui-login-typo-body']";
  xpathMsgRemindEnterStoreName = "//p[@class='warning font-12 m-t-sm']";
  xpathBtnNext = "//button[normalize-space()='Next']";
  xpathLogo = "//img[@class='background-right']";
  xpathLoginTitle = "//div[@class='unite-ui-login__title']//h1";
  xpathLabelCoutryStore = "//label[normalize-space()='Your store country']";
  xpathScreenAddYourContact = "(//div[@class='row'])[1]";
  xpathShopName = "(//p[@class='text-truncate font-12'])[1]";
  xpathFreeTrialText = "//p[@class='trial-text s-mb16']";
  xpathSelectAnotherShop =
    "(//div[contains(@class,'user-menu-redirect')]//div[normalize-space()='Select another shop'])[last()]";
  xpathLogout = "(//div[normalize-space()='Logout'])[last()]";
  xpathSignin = "//p[normalize-space()='Sign in']";
  xpathSignupInSigninScreen = "//a[@class='text-decoration-none']";
  xpathWelcome = "//h2[contains(text(),'Welcome to ShopBase Creator')]";
  xpathTitleSelectShop = "//p[normalize-space()='Select a shop']";
  xpathSelectAnotherShopEnvProd =
    "(//div[contains(@class,'dropdown-menu')]//div[normalize-space()='Select another shop'])[last()]";
  xpathTitleChooseBusinessModel = "//h1[normalize-space()='What is your business model?']";
  xpathSellDigitalProducts = "//p[normalize-space()='I sell Digital Products']";
  xpathButtonSaveBio = "//button[contains(@class, 'sb-button-save')]";
  xpathToastSuccessBio = "//div[contains(text(),'Save successfully')]";
  xpathInputSocialLinkBio = "//input[@placeholder='Enter social link']";
  xpathButtonDeleteSocialLinkBio = "//button[contains(@class, 'only-icon--medium')]";
  xpathInputAvatarBio = "//input[contains(@class, 'sb-upload__input')]";
  xpathAvatarBio = "//img[@class='sb-w-100 sb-h-100']";
  xpathAvatarUploadBio = "(//div[contains(@class, 'sb-upload')])[1]";
  xpathAvatarActionBarBio = "//div[contains(@class, 'image__content')]";
  xpathLibraryList = "//div[@class='page-designs__library']";
  xpathLibraryDetail = "//div[normalize-space()='Library detail' and contains(@class,'sb-title-ellipsis')]";
  xpathBtnDesign = "(//a[@href='/admin/themes'])[1]";
  xpathBtnCreateLib = "span:has-text('Create a library')";
  xpathPopup = ".sb-popup__container";
  xpathInputLibName = "input[placeholder='Library name']";
  xpathInputLibDescription = "textarea[placeholder='Type your description here']";
  xpathBtnSaveDisable = "button.is-primary[disabled='disabled']";
  xpathBtnSaveLib = "span:has-text('Save library')";
  xpathDisableInputName = "//input[@placeholder='Library name' and @disabled='disabled']";
  xpathDisableInputDes = "//textarea[@placeholder='Type your description here' and @disabled='disabled']";
  xpathBtnClose = ".sb-popup__header-close";
  xpathBtnDiscard = ".sb-popup__footer-button.sb-button--default";
  xpathBtnDelete = ".sb-popup__footer-button.sb-button--danger";
  xpathBtnLinkLib = "span:has-text('Link a library')";
  xpathBtnSave = ".sb-popup__footer-button.sb-button--primary";
  xpathNavigation = ".w-builder header";
  xpathBtnInsert = "//button[@name='Insert']";
  xpathSelectLib = ".w-builder__insert-previews .sb-button--label:has-text('All libraries')";
  xpathListLib = ".w-builder__insert-previews--filter-menu p";
  xpathBtnAddCate = ".category-header button";
  xpathPopupAddCate = ".sb-popup__header h2";
  xpathInputCateName = "[placeholder='Enter category name']";
  xpathBtnIcon = ".sb-popup__body button";
  xpathExpandCate = ".sb-tab-panel[style=''] .sb-collapse-item--visible";
  xpathTablistName = ".collapse-item-category p.text-bold";
  xpathCardTemplate = "div.card-template";
  xpathListSearchLib = "//div[@x-placement='bottom']//div[contains(@class,'sb-text-body-medium')]";
  contentWebTemplate = ".library-details-empty>>nth=0";
  xpathBtnSaveWB = "button[name='Save'][disabled='disabled']";

  emailLoc: Locator;
  pwdLoc: Locator;
  storeNameLoc: Locator;
  signInLoc: Locator;

  constructor(page: Page, domain: string) {
    super(page, domain);
    this.emailLoc = this.page.locator('[placeholder="example\\@email\\.com"]');
    this.pwdLoc = this.page.locator('[placeholder="Password"]');
    this.signInLoc = this.page.locator('button:has-text("Sign in")');
  }

  /**
   * Xpath to get selector of menu item level 1
   * @param label
   */
  xpathQuickBarActionGetTextLinkMenuLv1(label: string): string {
    return `div[role=list] div:text-is('${label}')`;
  }

  /**
   * Xpath to get selector of menu item level 2
   * @param label
   */
  xpathQuickBarActionGetTextLinkMenuLv2(label: string): string {
    return `div[class*=options__item]:text-is('${label}')`;
  }

  /**
   * Login account shopbase to create SB Creator store
   * @param email: Enter an email account SB
   * @param password: Enter password
   */
  async loginCreator(page: Page, username: string, password: string): Promise<void> {
    await this.emailLoc.fill(username);
    await this.pwdLoc.fill(password);
    await Promise.all([page.waitForNavigation(), this.signInLoc.click()]);
    await page.waitForLoadState("load");
  }

  /**
   * Enter info in add your contact screen
   * @param first_name: enter your first name
   * @param last_name: enter your last name
   * @param store_coutry: your store country
   * @param per_location: your personal location
   */
  async addYourContact(page: Page, conf: CreatorData): Promise<void> {
    await page.locator('[placeholder="Enter your name"]').fill(conf.first_name);
    await page.locator('[placeholder="Enter your last name"]').fill(conf.last_name);
    await page.locator("//input[@placeholder='Select Store country']").click();
    await page.locator(`(//div[@value='${conf.store_coutry}'])[1]`).click();
    await page.locator("//input[@placeholder='Select personal location']").click();
    await page.locator(`(//div[@value='${conf.per_location}'])[2]`).click();
    await page.locator('[placeholder="098 4533888"]').fill(conf.phone_number);
  }

  /**
   * Sign up Shopbase Creator store
   * @param email: enter an email account SB. Ex: thupham
   * @param domain_email: enter an domain email account SB. Ex: @beeketing.net
   * @param password: enter an password account SB
   * @param shop_name: enter shop name
   * @param rando: random sequence of characters
   */
  async signUpCreatorStore(page: Page, conf: CreatorData, rando: string): Promise<void> {
    await page.locator('[placeholder="example\\@email\\.com"]').fill(`${conf.email}+${rando}${conf.domain_email}`);
    await page.locator('[placeholder="Password"]').fill(conf.password);
    await page.locator('[placeholder="Your shop name"]').fill(`${conf.shop_name} ${rando}`);
    await page.locator('button:has-text("Sign up")').click();
  }

  /**
   * Enter shop name -> Click Submit to create new shop
   * @param shop_name: enter shop name
   * @param rando: random sequence of characters
   */
  async createNewShop(page: Page, conf: CreatorData, rando: string): Promise<void> {
    await page.locator('[placeholder="Your shop name"]').fill(`${conf.shop_name} ${rando + 1}`);
    await page.locator(`//span[normalize-space()="Create"]`).click();
    await page.waitForLoadState("load");
  }

  /**
   * Click button Add a new shop -> Enter shop name -> Click Submit to add new shop
   * @param name: enter a new shop name
   */
  async addNewShop(page: Page, name: string): Promise<void> {
    await page.locator("//span[normalize-space()='Add a new shop']").click();
    await page.locator("//input[@type='text']").fill(name);
    await page.locator("//button[@type='submit']").click();
    await page.waitForLoadState("load");
  }

  /**
   * Choose option to create Creator Store
   * @param sell_bussiness: choose bussiness model to sell. Ex: I sell Digital Product
   * @param creator_content: choose content want to sell first. Ex: Online Course, Coaching 1-1, Ebook,...
   */
  async createCreatorStore(page: Page, conf: CreatorData): Promise<void> {
    await page.locator(`//p[normalize-space()="${conf.sell_bussiness}"]`).click();
    await page.locator(`//li[normalize-space()="${conf.creator_content}"]`).click();
    await page.locator(`//button[normalize-space()="Next"]`).click();
    await page.waitForLoadState("networkidle");
  }

  /**
   * Enter info in add your contact screen
   * @param store_coutry: your store country
   * @param per_location: your personal location
   */
  async addContact(page: Page, conf: CreatorData): Promise<void> {
    await page.locator(this.getXpathWithLabel("Select Store country")).click();
    await page.locator(`(//div[@value='${conf.store_coutry}'])[1]`).click();
    await page.locator(this.getXpathWithLabel("Select personal location")).click();
    await page.locator(`(//div[@value='${conf.per_location}'])[2]`).click();
    await page.locator('[placeholder="098 4533888"]').fill(conf.phone_number);
  }

  getXpathStepCustomShop(step: number): string {
    return `//p[contains(text(), '${step} of 3')]`;
  }

  getXpathWithLabel(label: string): string {
    return `//input[@placeholder='${label}']`;
  }

  /**
   * Get xpath of library list
   * @param index
   */
  getXpathLibrarySelector(index?: number): string {
    const lbItem = "//div[contains(@class,'page-designs__library--item')]";
    const xpath = index ? `${lbItem}[${index}]` : lbItem;
    return xpath;
  }

  /**
   * Get xpath button of library list
   * @param index, action
   */
  getXpathAction(action: string, index?: number): string {
    return `//div[@class='page-designs__library--item'][${index}]//button[normalize-space()='${action}']`;
  }

  /**
   * Get xpath tab template
   * @param tab
   */
  getXpathTabTemplate(
    tab: "Web templates" | "Page templates" | "Section templates" | "Block templates" | "Style",
  ): string {
    return `//div[contains(@class,'sb-tab-navigation__item') and descendant::div[normalize-space()='${tab}']]`;
  }
  /**
   * Get xpath library name
   * @param index
   */

  getXpathLibName(index: number): string {
    return `//div[contains(@class,'page-designs__library--item')][${index}]//span[@class='sb-text-bold library-info']`;
  }

  /**
   * Get xpath library name
   * @param index
   */
  getXpathLibDescription(index: number): string {
    return `//div[contains(@class,'page-designs__library--item')][${index}]//div[@class='page-designs__library--description']`;
  }

  /**
   * Get xpath action of category
   * @param index
   */
  getXpathActionCate(index = 0): string {
    return `.category-actions span[type='secondary']>>nth=${index}`;
  }

  /**
   * Get xpath choose category
   * @param name
   */
  getXpathChooseCate(name: string): string {
    return `.sb-selection  .sb-tooltip__reference:has-text('${name}')`;
  }

  /**
   * Get xpath choose category section in library details
   * @param name
   */
  getXpathSelectSectionCate(name: string): string {
    return `//div[contains(@class,'collapse-item-category') and descendant::p[normalize-space()='${name}']]`;
  }
}
