import { verifyRedirectUrl, waitSelector } from "@core/utils/theme";
import { expect, Locator, Page } from "@playwright/test";
import { ClickType, WebBuilder } from "@pages/dashboard/web_builder";
import { SnapshotFixture } from "@core/fixtures/snapshot-fixture";
import type {
  ButtonSettings,
  DateTime,
  DnDSlideshow,
  DnDTabAccordionItem,
  EditLayoutSlideshow,
  EditSlideShowContent,
  EditSlideshowMedia,
  EditTabsAccordionHeading,
  ElementPosition,
  MenuItem,
  DnDMenuItem,
  PointerResize,
  ResizeBlock,
  SlideshowStyles,
  TabsLayout,
  TimePicker,
  settingShape,
  LayoutMenu,
} from "@types";

export { ClickType };

export class Blocks extends WebBuilder {
  frameLocator = this.page.frameLocator("#preview");
  popover = "#widget-popover:not([style*=display])";
  xpathButtonPreview = ":nth-match(.w-builder__header-right > span, 3) button";
  xpathButtonSave = ".w-builder__header-right .sb-button--primary >> text=Save";
  xpathPreviewSpinner = ".w-builder__preview-overlay";
  xpathPreviewLoadingScreen = ".w-builder__loading-screen";
  xpathToast = ".sb-toast__message";
  xpathDataId = ".w-builder__tab-heading [data-id]";
  xpathInputSearchIcon = "[class*='widget-icon__search'] input[type='text']";
  xpathNoIconFound = `${this.popover} label:not(.sb-text-sub-heading)`;
  xpathIconSelected = "[class*=widget-icon--selected] i.material-icons";
  xpathAttrsDataBlock = "[data-block-id]";
  overlay = "//div[contains(@class,'w-builder__preview-overlay')]";
  xpathAddSection = ".wb-empty__button";
  sidebar = "#website-builder .w-builder__sidebar-wrapper";
  emailAddress = "[placeholder='Your email address']";
  lastNamePlaceholder = "[placeholder='Your last name']";
  blockButton = "//button[contains(@class, 'btn-primary')]";
  bodySF = "//body[@data-sf]";
  xpathButtonPages = "//div[contains(@class,'header-left')]/child::span[@class='sb-ml-xs']//button";
  xpathButtonLayer = "//button[@name='Layer']";
  xpathLayerContent = "div.w-builder__layers-content";
  xpathWidgetLayout = "[data-widget-id='layout']";
  xpathSettingMenu = ".widget-layout-menu__settings";
  xpathSelectLayoutMenu = "//div[@class='widget-layout-menu__select']";
  xpathWidgetLayoutMenu = ".widget-layout-menu > span > .sb-popover__reference button";
  xpathPopoverLayoutMenu = `${this.xpathSelectLayoutMenu}//ancestor::div[@class='w-builder__popover']`;
  xpathDirectionMenu = `${this.xpathSettingMenu} button`;
  xpathFullWidthMenu = `${this.xpathSettingMenu} .sb-switch`;
  xpathHighLightMenu = ".widget-menu--highlight-action";
  xpathSelectedMenu = ".menu__item--selected-main-menu";
  xpathListMenu = ".menu__list-item > li";
  xpathSubMenu = ".sub-lv1 > li";
  xpathSubNestedMenu = ".sub-lv2 > li";
  xpathSubMenuSidebar = ".w-builder__layer-child";
  xpathWidgetMenu = ".widget-menu";
  widgetLayoutXpath = '[data-widget-id="layout"] .w-builder__widget--layout >> nth=0';
  layoutGridOnPopup = '[id="widget-popover"] .item-icon >> nth=0';
  layoutSlideOnPopup = '[id="widget-popover"] .item-icon >> nth=1';
  xpathBtnAddItem = ".add-item-indicator";
  breadCrumbList = "[id='element-name'] .element-name__item";
  xpathFirstBreadcrumbOnWB = '//*[@component="bread_crumb"]/ancestor::section >> nth=0';
  quickSetting = "#quick-settings";
  xpathHeaderBar = "div.w-builder__header-center";
  titleProduct = "[value*='title']";
  buttonSlideshow = "//span[normalize-space()='BUY COLLECTION ALL']";
  menuLink = ".main-menu-label";
  productCard = ".product-item";
  xpathEntityHeader =
    "//div[contains(@class, 'w-builder__header-center')]//*[contains(text(), 'All collections') or contains(text(), 'Preview')]";
  textboxInputSpacing =
    '//label[contains(.,"Spacing")]/ancestor::div[2]//input[contains(@class,"sb-input__inner-append")]';
  labelHour = "//label[contains(text(),'Hours')]";
  xpathSidebar = "//div[contains(@class,'w-builder__settings-list')]";
  iconDeleteItem = "(//*[@data-widget-id='accordions']//span)[1]";
  xpathCheckoutFormBlock = "[data-block-component=checkout_form]";
  xpathPaynowLabelPreview = "//button[contains(@class,'paynow btn-primary')]//span";
  xpathCheckboxTermsofServices = "//div[@data-widget-id='accept_policy']//span[@class='sb-check']";
  progressBar = "#v-progressbar";
  xpathDatePicker = "//div[@class='w-builder__widget--datetime']";
  xpathCurrentDay = "//div[contains(@class,'sb-date-picker__weekday--active')]";
  xpathNextDay = "//div[contains(@class,'sb-date-picker__weekday--active')]/following-sibling::div[1]";
  xpathFistDayOfWeek =
    "//div[contains(@class,'sb-date-picker__weekday--active')]/parent::div//following-sibling::div[1]//child::div[1]";
  xpathLastDayOfWeek = "//div[contains(@class, 'sb-date-picker__weekday--active')]//parent::div/div[last()]";
  xpathTimePicker = "//div[contains(@class,'s-date-editor--time')]";
  xpathStyleSettingbar = ".w-builder .w-builder__settings-list";
  youtubeVideo = "//div[@id='player']";
  xpathIconVideo = "[data-widget-id=media] label+span span[class*=tooltip]";
  xpathIconAltText = "[data-widget-id=alt_text] label+span span[class*=tooltip]";
  xpathIconAutoplay = "[data-widget-id=auto_play] label+span span[class*=tooltip]";
  videoTooltip = "//div[@tooltip='Support video from Youtube, Vimeo.']";
  altTextTooltip = "//div[@tooltip='Describe the video to make it accessible for customers using screen readers.']";
  autoplayTooltip =
    "//div[@tooltip='To maintain user experience and comply with Google policy, autoplay will mute video by default. This setting only works by previewing on the storefront!']";
  buttonCancelAddVideo = "//div[contains(@class,'sb-popup__footer')]//button[contains(@class,'sb-button--default')]";
  thumnailImageVideo = "//div[@class='w-builder__widget--background']";
  buttonRemoveInSidebar = ".w-builder__settings-remove button";
  videoIframe = "div.iframe-container";
  blockVideo = "//div[@data-block-type='video']";
  videoDefaultIframe = "iframe.media-iframe";
  buttonRemoveVideo = "(//div[@data-widget-id='media']//div[contains(@class,'sb-image__content')]//button)[2]";
  imageOnSF = "(//div[contains(@class, 'block-image')]//img)[1]";
  blockImage = "//div[contains(@class, 'block-image')]";
  linkImage = `${this.blockImage}//a`;
  buttonOnSF = "(//div[contains(@class, 'btn-primary')])[1]";
  blockRating = "[data-block-component='rating']";
  popupSelectIcon = '//div[@class="widget-select"]';
  iconStarRounded = '(//span[@class="widget-select__item"])[2]';
  iconHeart = '(//span[@class="widget-select__item"])[3]';
  blockBullet = "//div[@data-block-type='bullet']";
  iconDeleteItemBullet = "(//div[@class='sb-pointer sb-flex']//span)[1]";
  slideInSidebar = this.genLoc("[data-widget-id=slides] [class*='widget--label'] label:has-text('Slide')");
  addSlideBtn = this.genLoc("[data-widget-id=slides] button:has(:text-is('Add slide'))");
  autoplayToggleBtn = this.genLoc("[data-widget-id=autoplay] span[class*=switch]");
  pauseOnHoverToggleBtn = this.genLoc("[data-widget-id=pause_on_hover] span[class*=switch]");
  slideSettingsPopover = this.genLoc(`${this.popover} [class*=slideshow--item-settings]`);
  pageSearch = this.genLoc(`${this.popover} [class$=page-select-list] input`);
  slideshowPagination = this.frameLocator.locator("[role=tablist]");
  paginationDot = this.frameLocator.locator("button[class*=pagination]");
  slideshowVideo = this.frameLocator.locator("[class=video-iframe]");
  slideshowVideoIframe = this.frameLocator.locator("[class=video-iframe--content]");
  imgUploaded = this.genLoc(`${this.popover} .sb-upload__dropzone img`);
  headingTitleTab = "//*[contains(@class, 'w-builder__tab-heading--title')]";
  //Template store
  chooseTemplate = ".templates .sb-choose-template__template";
  listTemplate = "//*[contains(@class, 'sb-choose-template__templates')]";
  messageNoTemplate = ".templates .sb-text-body-emphasis";
  txtSearch = "#__layout .sb-choose-template-filter__search";
  textWB = "(//*[@component='heading'])[2]";
  secondSlideShow = `(//*[@role="tablist"]//button)[2]`;
  btnAddTemplatePreview = `//*[contains(@class, 'template-preview__header-right')]//button[contains(@class, 'sb-button--primary')]`;
  closePopupPreview = `//*[contains(@class, 'section-popup is-selected')]//div[contains(@class, 'close-popup-button__line')]`;
  btnBackPreview = "#__layout .template-preview__header-left--back";
  popupTemplate = ".sb-popup--overlay .sb-popup__container";
  overlayPopup = ".sb-popup .sb-popup--overlay";
  filterTemplate = "#__layout .sb-choose-template__filter";
  previewDesktop = "#website-builder .w-builder__preview-desktop";
  logoutTempStore = "//*[contains(@class, 'sb-popup__header')]//span[normalize-space()= 'Logout']";
  previewTemplate = "#preview-template";
  previewWb = "#preview";
  xpathNavigation = "//div[contains(@class,'w-builder__header-center')]";
  resizer = ".resizers .resizer";
  storefrontMain = "#wb-main";
  contentCopy = "//*[contains(@class, 'w-builder__widget--label')]//label[normalize-space() = 'Content']";
  xpathTextColor =
    "//div[@data-widget-id='btn_color']//span[contains(@class,'w-builder__chip w-builder__chip--color')]";
  xPathWbSection = "(//section/div[contains(@class, 'wb-preview__section--container')])";
  // storefront
  xPathSfnSection = "//section[contains(@class, 'wb-builder__section--container')]";
  xPathSfnQuantityDiscountAddButton = "//div[contains(@class, 'block-qty-discount__item-right')]";
  xPathSfnRemoveItemInCart = "//a[contains(@class, 'product-cart__remove')]";
  xPathCartQuantity = "//div[contains(@class, 'product-cart__quantity')]";
  xPathCartDiscount = "//span[contains(@class, 'summary__price')]";
  xPathCartDrawer = "//section[@data-section-id='default_cart_drawer']";
  xPathIconCartDrawer = "//section[@component='cart']//div[contains(@class, 'cart__icon')]";
  xPathIconCloseCartDrawer = "//div[contains(@class, 'close-popup-button__line')]";

  xPathCheckoutButton = "//a//span[normalize-space()='Checkout']";

  xPathCustomOptionError = "//div[contains(@class, 'custom-options-warning') and not(@style='display: none;')]";
  alignOptions = "div.widget-size__thickness-item";
  dataSource = this.genLoc("[class$=source-detail]")
    .locator("[class*=widget--inline]")
    .locator("[class*=reference__title]");
  missingSourceMessage = ".validate-source-msg";
  blockBundle = "[component=bundle]";
  bundleHeading = ".block-bundle__heading";
  bundleContentAlign = this.genLoc(".block-bundle__container div.flex").filter({
    has: this.genLoc(this.bundleHeading),
  });
  bundleTotalPriceLabel = ".block-bundle__total-price";
  bundleTotalPrice = ".p2.text-color-4";
  bundlePrice = ".block-bundle__product-price";
  bundleLabel = ".block-bundle__product-name--normal";
  bundleProductName = ".block-bundle__product-name";
  bundleImages = ".block-bundle__images";
  bundleImage = ".block-bundle__image";
  imageShape = this.genLoc("div.flex").filter({ has: this.genLoc(".block-bundle__image") });
  bundleSubText = ".block-bundle__discount";
  bundleDivider = ".divider";
  bundleImagePlaceholder = ".base-upsell-img-placeholder";
  menuDropdownVisible = ".menu__dropdown.show";
  megaMenuVisible = ".menu__mega.show";
  bundleNavigation = this.genLoc(".block-bundle__nav").locator("[class*=nav-item]");
  activeTab = this.genLoc("[id*=tab-navigation] [class$=item--active]");
  layoutDesktop = ".layout-full-width>>nth=1";
  tabsHeading = this.genLoc(".tabs__headings-wrapper");
  accordionHeading = this.genLoc(".accordion__heading");
  tabsLayout = this.genLoc("div.tabs");
  tabsLayoutType = this.genLoc("[class*=tab-layout--type]");
  tabsAccordionItem = this.genLoc("section.section");
  blockTabs = this.genLoc("[component=tabs]");
  blockAccordion = this.genLoc("[component=accordion]");
  accordionItemGroup = this.genLoc(".accordion__item--group");
  tabsIcon = this.genLoc(".tabs__heading-icon");
  accordionIcon = this.genLoc("[class$=material-icons]");
  textEditor = this.frameLocator.locator("[contenteditable=true]");
  blankHeading = this.genLoc("p[data-placeholder]");
  variable = this.genLoc("span[data-type='variable']");
  dataLv1 = this.genLoc("[data-nested-level='1']");
  tabLayoutWidgets = this.genLoc("[class$=tab-layout]>div");
  spinner = "//div[contains(@class,'loading-screen')]";
  popMobile = ".layout-mobile .section-popup.is-selected";
  sourceConnected = this.genLoc(".is-source-connected");
  blockHTMLCode = this.genLoc("[data-block-component=custom_code]");
  blockParagraph = this.genLoc("[data-block-component=paragraph]");
  textImportMenu = this.genLoc(".import-data__content span.import-data__label");
  linkImportMenu = this.genLoc(".import-data__content a.import-data__label");
  iconCloseMenu = this.genLoc(
    "//*[not(contains(@style, 'display: none')) and (@id = 'widget-menu-popover') ]//*[contains(@class, 'sb-popover__icon-close')]",
  );
  carouselDot = "button[class='VueCarousel-dot']";
  xpathLabel = "//*[contains(@class,'sb-button--label')]";
  xpathInput = "//input";
  closePopupSF = ".section-popup.is-selected .close-popup-button";
  sectionFirst = ".default-layout section>>nth=0";
  sectionAccessories = "[component='accessory']";
  sectionSF =
    "//div[@id='wb-main']/section[@data-section-id and not (contains(@class,'middle d-block') or contains(@class,'right middle'))]";
  xpathBlockInInsertPanel(blockName) {
    return `//p[normalize-space()='${blockName}']/ancestor::div[contains(@class,'w-builder__insert-basic-preview')]`;
  }
  slideBackgroundImg = this.genLoc(".slideshow__background-image");
  slidePadding = this.genLoc(".slideshow__wrapper-content");

  // Selector in language editor
  droplistSelectPage = "#search-section select>>nth=0";
  droplistSelectType = "#search-section select>>nth=1";
  droplistSelectLanguage = "#search-section select>>nth=2";
  listOptionPage = "(//*[@id='search-section']//select)[1]//option";
  tableKeyValue = ".locale-editor table";
  pageLanguageEditor = ".locale-editor";
  txtSearchKey = "#search-section input";
  tabHeading = ".tabs__heading>>nth=0";
  btnAddCartSticky = "#product_page .sticky__product-quantity button";
  globalSwitcher = "[component='global-switcher']";
  cartEmpty = ".cart-empty__text";
  btnLocaleRoller = "#roller-section-footer .locale-currency-button";
  optionManual = "[value='manual']";
  addMoreItem = "[type= 'add-more-item']";
  footerMenu = "[type= 'footer-menu']";
  textReview = ".rv-widget__first-write-review";
  currencyLanguageInside = ".footer-section .currency-language";
  keyFraseFirst = ".table-data>>nth=0";
  alertError = ".s-alert";
  recordKeyPhrase = "tbody tr";
  linkFilterLanguage = ".s-alert a";
  uploadFile = "(//button[normalize-space() = 'Upload file'])[1]//following-sibling::input";
  thumbVideo = ".block-video .block-video__image";
  enterEmail = "[placeholder='Enter your email']";
  containerStf = "//section[@component='container']";
  xpathSetLayout = `${this.xpathWidgetLayout} .w-builder__widget--layout > span`;
  imgBackground = ".w-builder__widget--background img";
  imgBackgroundVideo = ".w-builder__widget--background button .color";

  // block trustpilot
  blockTrustPilot = ".trustpilot-widget";
  typeTrustPilot = ".widget-trust-pilot__type button";
  imageTrustPilot = ".tp-widget-wrapper svg>>nth=0";

  // block toggle
  xpathIconExpand = "//div[contains(@class,'toggle-list__item')]//span[contains(@class,'material-icons')]";
  xpathBlockToggleList = "//section[@component='toggle-list']";
  xpathBtnAddItemToggle = "//button[ .//span[normalize-space()='Add item']]";

  //block video
  xpathDurationByLabelName(labelName: string) {
    return `//label[normalize-space()='${labelName}']/ancestor::div[@settings-type='block']//input`;
  }
  /**
   * Get selector of menu item on SF
   * @param item
   */
  getSelectorMenuItemOnSF(item: MenuItem) {
    let selector = `(//div[@class='menu']/ul/li)[${item.menu}]`;
    if (item.subMenu) {
      selector = `(${selector}/ul/li)[${item.subMenu}]`;
    }
    if (item.megaMenu) {
      selector = `(${selector}/ul/li)[${item.megaMenu}]`;
    }
    return selector;
  }

  /**
   * Get xpath collapse icon
   * @param icon
   * @returns
   */
  getXpathCollapseIcon(icon: string) {
    if (icon) {
      return `//*[local-name()='svg' and @data-name='${icon}']`;
    }

    return `//*[local-name()='svg' and @data-name]`;
  }

  /**
   * Get xpath layout menu active
   * @param layout
   * @param active
   * @returns
   */
  getXpathLayoutMenuAction(layout: "text" | "hamburger", active = false) {
    return `${this.xpathSelectLayoutMenu}//span[contains(@class, 'layout-${layout}')${
      active ? 'and contains(@class, "layout-text-active")' : ""
    }]`;
  }

  /**
   * lấy đơn vị của các field tren side bar
   * @param field
   * @returns
   */
  async getUnitOfField(field: string) {
    return this.page.locator(`[data-widget-id='${field}'] .sb-button--label`).innerText();
  }

  buttonLogin = "//*[contains(@class, 'header__desktop')]//*[normalize-space()= 'Login']";
  buttonLogout = "//*[contains(@class, 'header__desktop')]//span[normalize-space()= 'Logout']";
  messageLogin = ".unite-ui-switch__login .form-text p";
  buttonGetStarted = "//*[contains(@class, 'header__desktop')]//*[normalize-space()= 'Get started']//span";
  activeTabSideBar = "div.sb-tab-navigation__item--active div";
  ghost = ".wb-dnd-ghost";
  addMenuItem = "p.widget-menu__add-item";

  /**
   * add Block By Search
   * @param blockName
   * @returns
   */
  async addBlockByName(blockName: string) {
    const frameLocator = this.page.frameLocator("#preview");
    await frameLocator.locator(".empty-column").hover();
    await frameLocator.locator("text=Add block").first().click();
    await this.page.getByPlaceholder("Search").click();
    await this.page.getByPlaceholder("Search").fill(blockName);
    await this.page
      .getByRole("complementary")
      .locator("div")
      .filter({ hasText: `Store type E-commerceCreator All libraries Web Base All libraries ${blockName}` })
      .locator("img")
      .click();
  }

  async clickSaveAndVerifyPreview(
    {
      context,
      dashboard,
      savedMsg = "All changes are saved",
      snapshotName = "",
      handleWaitFor = null,
      onlyClickSave = false,
      isNextStep = false,
      selector = "",
    },
    snapshotFixture?: SnapshotFixture,
  ) {
    await dashboard.click(this.xpathButtonSave);
    await expect(dashboard.locator("div.w-builder__header-message")).toContainText(savedMsg);
    await dashboard.waitForSelector(this.xpathToast, { state: "hidden" });
    if (onlyClickSave) {
      return;
    }

    const [newTab] = await Promise.all([context.waitForEvent("page"), await dashboard.click(this.xpathButtonPreview)]);

    await newTab.waitForLoadState("networkidle");
    if (typeof handleWaitFor === "function") {
      await handleWaitFor(newTab);
    }

    const xpath = selector ? selector : ".main";
    if (snapshotFixture && snapshotName) {
      await snapshotFixture.verifyWithAutoRetry({
        page: newTab,
        selector: xpath,
        snapshotName: snapshotName,
      });
    }

    if (isNextStep) {
      return newTab;
    }
    await newTab.close();
  }

  async clickSaveAndVerifyPreviewMemberPage(
    { dashboard, block, savedMsg, snapshotName, onlyClickSave = false, isNextStep = false },
    snapshotFixture: SnapshotFixture,
    snapshotOptions?: { maxDiffPixelRatio: number },
    selector?: string,
  ) {
    await dashboard.click(this.xpathButtonSave);
    await expect(dashboard.locator("div.w-builder__header-message")).toContainText(savedMsg);
    await dashboard.waitForSelector(this.xpathToast, { state: "hidden" });
    if (onlyClickSave) {
      return;
    }

    const [newTab] = await Promise.all([
      block.page.waitForEvent("popup"),
      await block.clickBtnNavigationBar("preview"),
    ]);
    await newTab.waitForLoadState();
    await newTab.bringToFront();
    if (snapshotName) {
      if (snapshotOptions) {
        await snapshotFixture.verify({
          page: newTab,
          selector: selector,
          snapshotName: snapshotName,
          snapshotOptions: snapshotOptions,
        });
      } else {
        await snapshotFixture.verify({
          page: newTab,
          selector: selector,
          snapshotName: snapshotName,
        });
      }
    }

    if (isNextStep) {
      return newTab;
    }
    await newTab.close();
  }

  getAttrsDataId(): Promise<string> {
    return this.genLoc(this.xpathDataId).getAttribute("data-id");
  }

  getXpathLinkIcon(blockId: string): string {
    return `[data-block-id="${blockId}"] a`;
  }

  getXpathPresetColor(index: number): string {
    return `:nth-match(.w-builder__widget--color .w-builder__colors-chips .w-builder__chip--color, ${index})`;
  }

  getXpathPresetBgColor(index: number): string {
    return `:nth-match(.w-builder__widget--background .w-builder__colors-chips .w-builder__chip--color, ${index})`;
  }

  getXpathIconByIndex(index: number): string {
    return `:nth-match(.widget-icon__item, ${index})`;
  }

  async showPopoverColors(widgetValue: string): Promise<void> {
    await this.page.click(`[data-widget-id="${widgetValue}"] .w-builder__widget--color .sb-popover__reference`);
  }

  async showPopoverSelect(widgetValue: string): Promise<void> {
    await this.page.click(`//div[@data-widget-id='${widgetValue}']//div[contains(@class,'sb-popover__reference')]`);
  }

  async clickQuickSettingByLabel(label: string, dom = "div"): Promise<void> {
    await this.frameLocator
      .locator(`//span[contains(text(), '${label}')]//ancestor::${dom}[contains(@class,'quick-settings__item')]`)
      .click();
  }

  async clickQuickSettingByButtonPosition(position: number, dom = "div"): Promise<void> {
    await this.frameLocator
      .locator(`(//ancestor::${dom}[contains(@class,'quick-settings__item')][1])[${position}]`)
      .click();
  }

  async clickRemoveFromSidebar(): Promise<void> {
    await this.page.click(".w-builder__settings-remove button");
  }

  async clickBackLayer(): Promise<void> {
    await this.page.click(".w-builder__tab-heading .sb-icon");
  }

  async hideWebBuilderHeader(): Promise<void> {
    await this.page.click(".sb-sticky.w-builder__header");
  }

  /**
   * Click section on sidebar
   */
  async clickSectionInSidebar(area: string, i: number): Promise<void> {
    await this.page.click(
      `//div[@class='w-builder__layers-${area}']//div[@section-index=${i}]//p[contains(@class,'section')]`,
    );
  }

  productName(): string {
    const timestamp = new Date().getTime();
    return `product template ${timestamp}`;
  }

  /**
   * Get xpath of title or paragraph block accordion in section
   * @param option
   * @param indexSection
   * @param indexBlock
   */
  getXpathToggleList({ option, indexSection = 1, indexBlock = 1 }) {
    return `((//section[contains(@class,'block')])[${indexSection}]//*[@data-text-editor-child-id='${option}'])[${indexBlock}]`;
  }

  /**
   * Get xpath section in Header/Body/Footer
   * @param area
   * @param i
   */
  getSectionInArea(area: string, i?: number) {
    return `//div[@class='w-builder__layers-${area}']//div[@class='sb-w-100']/div[${i}]`;
  }

  /**
   * Get xpath to count item in block accordion
   * @param time
   */
  async getTimePreview(time: DateTime): Promise<string> {
    return await this.frameLocator
      .locator(`//div[@class='countdown']//span[contains(text(),'${time}')]//preceding-sibling::span`)
      .innerText();
  }

  async getTimeSF(page, time: DateTime): Promise<string> {
    return await page
      .locator(`//div[@class='countdown']//span[contains(text(),'${time}')]//preceding-sibling::span`)
      .innerText();
  }

  getXpathItem(section: number) {
    return `(//section[contains(@class,'block')])[${section}]//div[contains(@class,'toggle-list__item')]`;
  }

  getXpathSideBarWithIndex(index: number) {
    return `//div[@class ='w-builder__layers-footer']//div[@class ='sb-w-100 sb-tooltip__reference']/div[${index}]`;
  }

  getXpathCurrentTime(time: TimePicker) {
    return `//div[contains(text(),'${time}')]/parent::div//li[contains(@class,'active')]`;
  }

  getLastIndexTimePicker(time: TimePicker) {
    return `//div[contains(text(),'${time}')]/parent::div//li[last()]`;
  }

  getFirstIndexTimePicker(time: TimePicker) {
    return `//div[contains(text(),'${time}')]/parent::div//li[1]`;
  }

  getNextTimePicker(time: TimePicker) {
    return `//div[contains(text(),'${time}')]/parent::div//li[contains(@class,'active')]//following-sibling::li[1]`;
  }

  /**
   * Hàm fill text vào block Heading, paragraph ....
   * @param block
   * @param text
   */
  async fillTextBlock(block: Locator, text: string): Promise<void> {
    await block.dblclick();
    const inputField = this.frameLocator.locator("[contenteditable=true]");
    await inputField.waitFor();
    await this.page.keyboard.press("Control+A");
    if (typeof text !== undefined) {
      await inputField.type(text);
    }
    await this.backBtn.click();
  }
  // ===================== Block Slideshow ==========================
  //NOTE: Các hàm dùng cho block slideshow
  /**
   * Hàm get button, input field để check value của các style trong block slideshow
   * @param style
   * @returns
   */
  getSlideshowStylesValueLocator(style: SlideshowStyles): Locator {
    const styleSelector = {
      layout: "[data-widget-id=layout] button",
      filled_color: "[data-widget-id=filled_color] span[class*=chip] .color",
      content_position: "[data-widget-id=content_position] [label=Position]",
      position: "[data-widget-id=position] button",
      align: "[data-widget-id=align_self] [class*=container]",
      width_value: "[data-widget-id=width] input",
      width_unit: "[data-widget-id=width] button",
      height_value: "[data-widget-id=height] input",
      height_unit: "[data-widget-id=height] button",
      background: "[data-widget-id=background] div.color",
      border: "[data-widget-id=border] button[class*=select]",
      opacity: "[data-widget-id=opacity] input[class$=append]",
      radius: "[data-widget-id=border_radius] input[class$=append]",
      shadow: "[data-widget-id=box_shadow] button",
      padding: "[data-widget-id=padding] input",
      margin: "[data-widget-id=margin] input",
    };
    const styleLoc = this.genLoc(styleSelector[style]);
    return styleLoc;
  }

  /**
   * Get selector toggle button layout settings
   * @param setting
   * @returns
   */
  getSlideshowLayoutSettingToggleBtn(
    setting: "Slide Nav" | "Arrows" | "Show items partially" | "Flip content" | "Loop",
  ): Locator {
    const settingSelector = this.genLoc(
      `[class$=layout-slideshow-item]:has(label:text-is('${setting}')) label[class*=switch__button]`,
    );
    return settingSelector;
  }

  /**
   * Get selector 2 layout block slideshow
   * @param layout
   * @returns
   */
  getSlideshowLayoutBtn(layout: "Full" | "Split"): Locator {
    const index = layout === "Full" ? 1 : 2;
    const layoutSelector = this.genLoc(`:nth-match([class$=layout-slideshow-select] svg, ${index})`);
    return layoutSelector;
  }

  /**
   * Hàm change layout style và các settings bên trong của block slideshow
   * @param data
   * NOTE: Toggle btn bị ngược nên thay vì dùng isChecked -> check attribute
   */
  async changeLayoutStyle(data: EditLayoutSlideshow): Promise<void> {
    const layoutPopover = this.genLoc(`${this.popover}:has-text('Layout')`);
    if (await layoutPopover.isHidden()) {
      await this.getSlideshowStylesValueLocator("layout").click();
    }
    if (data.layout) {
      const selectLayout = this.getSlideshowLayoutBtn(data.layout);
      await selectLayout.click();
      await this.waitAbit(300); //WB render chậm
    }
    if (data.navigation) {
      const navigationStatus = await this.getSlideshowLayoutSettingToggleBtn("Slide Nav").getAttribute("class");
      if (data.navigation.is_on !== navigationStatus.includes("active")) {
        await this.getSlideshowLayoutSettingToggleBtn("Slide Nav").click();
        await this.waitAbit(300); //WB render chậm
      }
    }
    if (data.arrows) {
      const arrowsStatus = await this.getSlideshowLayoutSettingToggleBtn("Arrows").getAttribute("class");
      if (data.arrows.is_on !== arrowsStatus.includes("active")) {
        await this.getSlideshowLayoutSettingToggleBtn("Arrows").click();
        await this.waitAbit(300); //WB render chậm
      }
    }
    if (data.show_partially) {
      const showPartiallyStatus = await this.getSlideshowLayoutSettingToggleBtn("Show items partially").getAttribute(
        "class",
      );
      if (data.show_partially.is_on !== showPartiallyStatus.includes("active")) {
        await this.getSlideshowLayoutSettingToggleBtn("Show items partially").click();
        await this.waitAbit(300); //WB render chậm
      }
    }
    if (data.flip_content) {
      const flipContentStatus = await this.getSlideshowLayoutSettingToggleBtn("Flip content").getAttribute("class");
      if (data.flip_content.is_on !== flipContentStatus.includes("active")) {
        await this.getSlideshowLayoutSettingToggleBtn("Flip content").click();
        await this.waitAbit(300); //WB render chậm
      }
    }
    await this.getSlideshowStylesValueLocator("layout").click();
  }

  getSlideInSidebar(slide: number): string {
    return `[data-widget-id=slides] [class*='container--inline']:has(label:text-is('Slide ${slide}'))`;
  }

  getSlideInLivePreviewByIndex(slide: number): Locator {
    return this.frameLocator.locator(`:nth-match(#slideshow [role=tabpanel] ,${slide})`);
  }

  getPaginationInLivePreviewByIndex(slide: number): Locator {
    return this.frameLocator.locator(`:nth-match(button[class*=pagination], ${slide})`);
  }

  getArrowInLivePreview(arrow: "Previous" | "Next"): Locator {
    return this.frameLocator.locator(`[aria-label='${arrow} page']`);
  }

  getResizerInLivePreview(position: PointerResize): Locator {
    return this.frameLocator.locator(`[class*=selected] [data-resize=${position}]:visible`);
  }

  /**
   * Hàm resize block đến x, y cố định
   * @param block
   * @param data.at_position: những điểm anchor có thể resize
   * @param data.to_specific_point: là khoảng cách move từ vị trí resize đến vị trí muốn dừng
   * VD resizer ở x=0, y=0 -> resize tăng width truyền x = 600 -> Tăng/giảm 600px phụ thuộc vào resizer position.
   */
  async resizeBlock(block: Locator, data: ResizeBlock): Promise<void> {
    let x: number, y: number;
    await this.scrollIntoViewInWebBuilder(block);
    const blockBox = await block.boundingBox();
    const resizePoint = this.getResizerInLivePreview(data.at_position);
    const blockType = await block.getAttribute("data-block-component");
    const blockStatus = await block.getAttribute("class");
    if (blockType === "container" || blockType === "tabs" || blockType === "accordion") {
      x = blockBox.width - 5;
      y = 5;
    } else {
      x = blockBox.width / 2;
      y = blockBox.height / 2;
    }
    if (!blockStatus.includes("selected")) {
      await block.click({ position: { x: x, y: y } });
    }
    await this.scrollIntoViewInWebBuilder(resizePoint);
    const box = await resizePoint.boundingBox();
    const startX = Math.round(box.x + box.width / 2);
    const startY = Math.round(box.y + box.height / 2);
    const endX = !data.to_specific_point.x ? startX : Math.round(startX + data.to_specific_point.x),
      endY = !data.to_specific_point.y ? startY : Math.round(startY + data.to_specific_point.y);
    await resizePoint.hover();
    await this.page.mouse.down();
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.move(endX, endY, { steps: 5 });
    await this.page.mouse.up();
  }

  getSlideLayoutInLivePreview(slide = 1): Locator {
    return this.frameLocator.locator(`:nth-match(#slideshow [class*=layout], ${slide})`);
  }

  /**
   * Get content của block slideshow ở live preview
   * @param type
   * @param slide
   * @returns
   */
  getContentTypeInLivePreview(type: "sub-heading" | "heading" | "description", slide = 1): Locator {
    return this.frameLocator.locator(`:nth-match([role=tabpanel], ${slide}) [class$="s ${type}"]`);
  }

  getContentLocInLivePreview(slide = 1): Locator {
    return this.frameLocator.locator(`:nth-match(#slideshow .slideshow__content, ${slide})`);
  }

  /**
   * Get button của block slideshow ở live preview
   * @param button
   * @param slide
   * @returns
   */
  getButtonInLivePreview(button: "primary" | "secondary", slide = 1): Locator {
    return this.frameLocator
      .getByRole("tabpanel")
      .nth(slide - 1)
      .locator(`[class$=btn-${button}] span`);
  }

  /**
   * Chuyển tab khi edit slide (bao gồm cả Image/Video trong tab Background)
   * @param tab
   */
  async switchTabEditSlideSettings(tab: "Content" | "Button" | "Media" | "Image" | "Video"): Promise<void> {
    const tabSelector = this.genLoc(`${this.popover} [class*=tab-navigation__item]:has(div:text-is('${tab}'))`);
    const tabStatus = await tabSelector.getAttribute("class");
    if (!tabStatus.includes("active")) {
      await tabSelector.click();
    }
  }

  /**
   * Get input content locator của slideshow
   * @param type
   * @returns
   */
  getSlideContent(type: "Sub heading" | "Heading" | "Description"): Locator {
    return this.genLoc(`${this.popover} .sb-tab:not([style*=none]) [class$=align-center]`)
      .filter({ has: this.genLoc(`label:text-is('${type}')`) })
      .locator("input");
  }

  /**
   * Hàm edit tab content block slideshow
   * @param data
   */
  async editSlideshowContent(data: EditSlideShowContent): Promise<void> {
    if (typeof data.sub_heading !== undefined) {
      await this.getSlideContent("Sub heading").fill(data.sub_heading);
    }
    if (typeof data.heading !== undefined) {
      await this.getSlideContent("Heading").fill(data.heading);
    }
    if (typeof data.description !== undefined) {
      await this.getSlideContent("Description").fill(data.description);
    }
    await this.page.locator(this.popover).locator("[class*=navigation__item]", { hasText: "Content" }).click();
  }

  getSlideSettingsButton(action: "duplicate" | "settings" | "remove", slide = 1): Locator {
    const selectSlide = `:nth-match([class$=label]:has(label:text('Slide')), ${slide})`;
    const buttonSelector = {
      duplicate: `${selectSlide}~[class$=widget-list__item] .sb-p-xs[class$=element-icon]`,
      settings: `${selectSlide}~[class$=widget-list__item] [class$= slideshow-item]`,
      remove: `${selectSlide}~[class$=widget-list__item] [class*=element-icon]:has([id$=Trash])`,
    };
    return this.genLoc(buttonSelector[action]);
  }

  /**
   * Hàm edit slide settings
   * @param action
   * @param isOn
   */
  async selectSlideSettings(action: "duplicate" | "settings" | "remove", slide = 1): Promise<void> {
    await this.getSlideSettingsButton(action, slide).click();
  }

  /**
   * Get phần chứa các settings của button 1, 2 trong tab Button slideshow settings
   * @param button
   * @returns
   */
  getButtonContainerSettings(button: 1 | 2): string {
    return `:nth-match(${this.popover} [class*=btn-group], ${button})`;
  }

  /**
   * Get locator của các settings trong edit slideshow settings.
   * @param button: button 1 hoặc button 2
   * @param label: label của toggle button cần tương tác
   */
  getToggleBtn(button: 1 | 2, label?: "Open in new tab"): Locator {
    const buttonGroup = this.getButtonContainerSettings(button);
    const toggleBtn = label
      ? `${buttonGroup}>div:has(label:text-is('${label}')) [class*=switch__button]`
      : `${buttonGroup}>div:has(label:text-is('Button ${button}')) [class*=switch__button]`;
    return this.genLoc(toggleBtn);
  }

  /**
   * Get Locator của input field button label dùng để đổi label button
   * @param button
   * @returns
   */
  getButtonLabel(button: 1 | 2): Locator {
    const buttonGroup = this.getButtonContainerSettings(button);
    return this.genLoc(`${buttonGroup} input[type=string]`);
  }

  /**
   * Get Locator của input field (extra khi chọn action)
   * @param button
   * @returns
   */
  getButtonInputText(button: 1 | 2): Locator {
    const buttonGroup = this.getButtonContainerSettings(button);
    return this.genLoc(`${buttonGroup} [class*=link] input[type=text]`);
  }
  /**
   * Hàm edit tab button của slide trong block slideshow
   * @param data
   */
  async editSlideShowButton(data: ButtonSettings): Promise<void> {
    await this.switchTabEditSlideSettings("Button");
    let pageDropdown: Locator;
    const buttonGroup = this.getButtonContainerSettings(data.button);
    const buttonLabel = this.getButtonLabel(data.button);
    const buttonAction = this.genLoc(`${buttonGroup} [class*=widget--link]>div`)
      .filter({ has: this.page.getByText("Action", { exact: true }) })
      .getByRole("button");
    const buttonInputText = this.getButtonInputText(data.button);
    const buttonActionExtra = this.genLoc(`${buttonGroup} [class*=link-item] button`);
    const toggleBtn = this.getToggleBtn(data.button);
    const newTabToggleBtn = this.getToggleBtn(data.button, "Open in new tab");
    const btnStatus = await toggleBtn.getAttribute("class");
    //K biết dev code kiểu gì mà nó bị ngược on thì isChecked=false => check attribute
    if (data.is_on !== btnStatus.includes("active")) {
      await toggleBtn.click();
    }
    if (typeof data.label !== "undefined") {
      await buttonLabel.fill(data.label);
      await expect(buttonLabel).toHaveValue(data.label);
    }
    if (data.action) {
      const selectExtraOption = this.genLoc(this.popover)
        .getByRole("listitem")
        .filter({ has: this.page.getByText(data.action, { exact: true }) });
      await buttonAction.click();
      await selectExtraOption.click();
      switch (data.action) {
        case "Open a link":
        case "Make a call":
        case "Send email to":
        case "Copy to clipboard":
          await buttonInputText.click();
          await buttonInputText.fill(data.input_text);
          await expect(buttonInputText).toHaveValue(data.input_text);
          break;
        case "Go to page":
        case "Go to section":
        case "Open a pop-up": {
          const selectAdditionOption = this.genLoc(
            `:nth-match(${this.popover} [data-select-label='${data.select.option}'], ${data.select.index})`,
          );
          await buttonActionExtra.click();
          if (data.select.label == "page") {
            pageDropdown = this.page
              .locator(this.popover)
              .locator("[class$=link-item]")
              .filter({ has: this.page.locator("label:text-is('Page')") })
              .locator("button");
            await this.pageSearch.fill(data.select.option);
          }
          await selectAdditionOption.click();
          await expect(pageDropdown).toHaveText(data.select.option);
          break;
        }
      }
      if (typeof data.new_tab !== "undefined") {
        const newTabStatus = await newTabToggleBtn.getAttribute("class");
        if (data.new_tab !== newTabStatus.includes("active")) {
          await newTabToggleBtn.click();
        }
      }
    }
    await this.page
      .locator(this.popover)
      .locator("[class*=navigation__item]", { hasText: "Button" })
      .click({ delay: 500 });
    await this.waitAbit(500); // WB update lâu
  }

  /**
   * Hàm edit tab Media slideshow
   * @param data
   */
  async editSlideshowMedia(data: EditSlideshowMedia) {
    const getImgSettings = (option: "Size" | "Position" | "Overlay" | "Repeat") => {
      return this.page
        .locator(this.popover)
        .locator("[class^=sb-tab-panel]:not([style]) div[class$=align-center]")
        .filter({ has: this.page.locator(`label:text-is("${option}")`) });
    };
    const repeatToggleBtn = getImgSettings("Repeat").locator("label.sb-switch__button");
    await this.switchTabEditSlideSettings("Media");
    if (data.image) {
      await this.switchTabEditSlideSettings("Image");
      const repeatStatus = await repeatToggleBtn.getAttribute("class");
      if (data.image.file) {
        await this.uploadImage("thumbnail_image", data.image.file);
      }

      if (typeof data.image.size !== "undefined") {
        await this.page.locator(`${this.popover} [class^=sb-flex]:has(label:text-is('Size'))~div button`).click();
        await this.page
          .locator("[id*=sb-popover]:not([style*=none])")
          .locator("div.sb-select-menu li[class$=menu__item]")
          .locator(`label:text-is('${data.image.size}')`)
          .click();
      }
      if (typeof data.image.position !== "undefined") {
        await this.clickOnElement(
          `:nth-match(${this.popover} [class^=sb-flex]:has(label:text-is('Position'))~ul li, ${data.image.position})`,
        );
      }
      if (data.image.overlay) {
        await this.color(data.image.overlay, `${this.popover} [class^=sb-flex]:has(label:text-is('Overlay'))~div`);
      }
      if (data.image.repeat !== repeatStatus.includes("active")) {
        await repeatToggleBtn.click();
      }
    }
    if (data.video) {
      const inputVideoUrl = this.genLoc(this.popover)
        .locator("[class^=sb-flex]:has(label:text-is('Video URL'))~div")
        .locator("input");
      await this.switchTabEditSlideSettings("Video");
      await inputVideoUrl.click({ delay: 200 });
      await inputVideoUrl.fill(data.video.url);
      if (data.video.image) {
        await this.uploadImage("thumbnail_image", data.image.file);
      }
      if (data.video.overlay) {
        await this.color(data.video.overlay, `${this.popover} [class^=sb-flex]:has(label:text-is('Overlay'))~div`);
      }
    }
    await this.page.locator(this.popover).locator("[class*=navigation__item]", { hasText: "Media" }).click();
    await this.waitAbit(300); // WB update lâu
  }

  /**
   * Hàm drag and drop các slide trong block slideshow ở sidebar settings
   * @param param0
   */
  async dndSlideshow({ from, to, pixel = 10 }: DnDSlideshow): Promise<void> {
    const getDragBtn = (): string => {
      const selectSlide = `:nth-match([class$=label]:has(label:text('Slide')), ${from.slide})`;
      return `${selectSlide}~[class$=list__item] [class$=element-icon]:has([id$=Drag])`;
    };
    const dragBtn = getDragBtn();
    const toSelector = this.getSlideInSidebar(to.slide);
    await this.dragAndDropStepByStep(dragBtn, toSelector, pixel);
  }

  //template store
  getOptionColor(hex: string, color: string) {
    return `//*[@style = 'background-color: ${hex};']//following-sibling::div[normalize-space() = '${color}']`;
  }

  getOptionFont(font: string, style: string) {
    return `//*[normalize-space() = '${font}']//following-sibling::div[normalize-space() = '${style}']`;
  }

  getXpathButtonText(button: string, index?: number) {
    const i = index ? index : 1;
    return `(//button[normalize-space() = '${button}'])[${i}]`;
  }

  getMessAddTempSucc(template: string) {
    return `//*[contains(@class,'sb-alert__success')]//div[normalize-space() = '${template} was added to your store']`;
  }
  getMessAddTempFail(mess: string) {
    return `//*[normalize-space() = '${mess}' and contains(@class,'sb-toast__message')]`;
  }

  getOptionAddPage(option: string) {
    return `//*[contains(@class,'sb-popup__container')]//span[normalize-space() = '${option}']`;
  }

  getDroplistColorFont(index: number) {
    return `#__layout .template-preview__dropdown>>nth=${index}`;
  }

  getXpathByText(text: string, selector?: string): string {
    return super.getXpathByText(text, selector);
  }

  /**
   * Count number of block in section in Preview WebFront
   * @param section
   */
  async countBlockInPreview({ section = 1 }: ElementPosition): Promise<number> {
    return await this.frameLocator
      .locator(
        `(//section[contains(@class,'section')])[${section}]//div[contains(@class,'wb-dnd-draggable-wrapper') and not(contains(@class,'hidden'))]`,
      )
      .count();
  }

  /**
   * Count number of block in section in Layer panel
   * @param position
   */
  async countBlockInLayerPanel(position: ElementPosition): Promise<number> {
    const parentSelector = this.getSidebarSelectorByIndex(position);
    if (!position.column) {
      return await this.page.locator(`${parentSelector}//div[@data-column-index]//div[@data-id]`).count();
    }
    return await this.page.locator(`${parentSelector}//div[@data-id]`).count();
  }

  /**
   * Menu item in sidebar locator
   * @param menuItem
   */
  menuItemInSideBarLoc(menuItem?: MenuItem): Locator {
    let selector = "//div[@menu-index]";
    if (menuItem) {
      const parentSelector = this.getSelectorMenu(menuItem);
      selector = menuItem.subMenu
        ? `${parentSelector}//div[@mega-menu-index]`
        : `${parentSelector}//div[@sub-menu-index]`;
    }
    return this.genLoc(selector);
  }

  /**
   * Get locator action with menu item in sidebar
   * @param menuItem
   * @param action
   * @returns
   */
  getLocatorActionWithItem(menuItem: MenuItem, action: "Add sub item" | "Item setting" | "Remove item"): Locator {
    const selector = this.getSelectorMenuItem(menuItem);
    let actionKey: string;
    switch (action) {
      case "Add sub item":
        actionKey = "add-sub-item";
        break;
      case "Item setting":
        actionKey = "item-setting";
        break;
      default:
        actionKey = "remove-item";
    }
    return this.genLoc(`${selector}//*[@data-item-action='${actionKey}']`);
  }

  /**
   * Select action with menu item in sidebar
   * @param menuItem
   * @param action
   */
  async selectActionWithItem(menuItem: MenuItem, action: "Add sub item" | "Item setting" | "Remove item") {
    const menuLocaltor = this.getSelectorMenuItem(menuItem);
    const actionLocaltor = this.getLocatorActionWithItem(menuItem, action);
    await this.genLoc(menuLocaltor).hover();
    await actionLocaltor.hover();
    await actionLocaltor.click();
  }

  /**
   * Dnd các menu items của menu trong sidebar
   * @param param0
   */
  async dndMenuItemInSidebar({ from, to, pixel = 10 }: DnDMenuItem) {
    const dragBtn = `${this.getSelectorMenuItem(from)}${this.xpathDragInSidebar}`;
    const toSelector = this.getSelectorMenuItem(to);
    await this.dragAndDropStepByStep(dragBtn, toSelector, pixel);
  }

  /**
   * Change layout menu
   * @param data
   */
  async onChangeLayoutMenu(data: LayoutMenu) {
    await this.genLoc(this.getSelectorByLabel("layout")).getByRole("button").click();
    await this.genLoc(this.popover).waitFor();
    if (data.layout) {
      await this.genLoc(`${this.popover} .layout-${data.layout}`).click();
      await this.genLoc(`${this.popover} .layout-${data.layout}-active`).waitFor();
    }

    if (data.direction) {
      await this.selectDropDown(this.getWidgetSelectorByLabel("Direction"), data.direction);
    }

    if (typeof data.spacing !== "undefined") {
      await this.editSliderBar(this.getWidgetSelectorByLabel("Spacing"), data.spacing);
    }

    if (typeof data.full_width !== "undefined") {
      await this.switchToggle(this.getWidgetSelectorByLabel("Mega menu full width"), data.full_width);
    }

    await this.titleBar.click({ delay: 300 });
  }

  /**
   * Get selector of menu (include sub item)
   * @param menuItem
   */
  getSelectorMenu(menuItem: MenuItem) {
    let selector = `//div[@menu-index='${menuItem.menu - 1}']`;
    if (menuItem.subMenu) {
      selector += `//div[@sub-menu-index='${menuItem.subMenu - 1}']`;
    }
    if (menuItem.megaMenu) {
      selector += `//div[@mega-menu-index='${menuItem.megaMenu - 1}']`;
    }
    return selector;
  }

  /**
   * Get selector of menu item
   * @param menuItem
   */
  getSelectorMenuItem(menuItem: MenuItem) {
    const parentSelector = this.getSelectorMenu(menuItem);
    return `(${parentSelector}//div)[1]`;
  }

  /**
   * Collapse or expand menu item in Sidebar
   * @param menuItem
   * @param isCollapse
   */
  async collapseOrExpandMenuItem(menuItem: MenuItem, isCollapse = false) {
    const selector = this.getSelectorMenuItem(menuItem);
    const isCollapsed = await this.page.locator(`${selector}${this.getXpathCollapseIcon("collapse")}`).isVisible();
    if (isCollapsed !== isCollapse) {
      await this.page.locator(`${selector}${this.getXpathCollapseIcon("")}`).click();
    }
  }

  getSelectorInWidgetMenu(label: string, selector = "") {
    return `//div[@id='widget-menu-popover' and not(contains(@style,'display: none;'))]//div[contains(@class,'widget--label') and descendant::label[normalize-space()='${label}']]//following-sibling::*[local-name()="div" or local-name()="span"]${selector}`;
  }

  getSelectorInWidgetLink(label: string) {
    return `//div[@id='widget-menu-popover' and not(contains(@style,'display: none;'))]//div[contains(@class,'w-builder__widget--link')]//div[contains(@class,'sb-flex-align-center') and descendant::label[normalize-space()='${label}']]`;
  }

  /**
   * Select value in a autocomplete
   * @param selector
   * @param value. ex: "All products" or "Product detail > Product 1"
   * @param index
   */
  async selectAutoComplete(selector: string, value: string, index = 1) {
    const parentSelector = this.getSelectorByLabel(selector);
    await this.genLoc(`(${parentSelector}//button)[${index}]`).click();
    const popOverXPath = "//div[@id='widget-popover' and not(contains(@style,'display: none;'))]";
    const valueList = value.split(">");
    for (let i = 0; i < valueList.length; i++) {
      await this.page.locator(`${popOverXPath}//input`).fill(valueList[i]);
      await this.waitForXpathState(`${popOverXPath}//ul`, "stable");
      await this.page.locator(`(${popOverXPath}//li)[${index}]`).click({ delay: 200 });
      await this.waitAbit(300); //WB render chậm
    }
  }

  /**
   * Set color and shape block social in side bar
   * @param settingshape
   */
  async setColorAndShape(settingshape: settingShape) {
    //set color
    const toggleBtn = await this.genLoc("//div[@class='w-builder__widget--switch']//label");
    const btnStatus = await toggleBtn.getAttribute("class");
    if (settingshape.brand_color == "ON" && !btnStatus.includes("active")) {
      await this.genLoc(".sb-switch__switch").click();
      await this.genLoc("[data-widget-id=custom_color]").waitFor({ state: "hidden" });
    }
    if (settingshape.brand_color == "OFF" && btnStatus.includes("active")) {
      await this.genLoc(".sb-switch__switch").click();
      await this.genLoc("[data-widget-id=custom_color]").waitFor();
    }
    //set shape
    await this.page.locator("//div[@data-widget-id='shape']//button//span").last().click();
    let index = 1;
    if (settingshape.shape === "None") {
      index = 1;
    }
    if (settingshape.shape === "Square") {
      index = 2;
    }
    if (settingshape.shape === "Round") {
      index = 3;
    }
    if (settingshape.shape === "Circle") {
      index = 4;
    }
    await this.genLoc(`(//*[@id='widget-popover']//span[@class='widget-select__item'])[${index}]`).click();
  }

  /**
   * Get xpath of page title on page selector
   * @param pageTitle
   */
  getXpathPageSelector(pageTitle: string) {
    return this.genLoc(".w-builder__page-groups--item").filter({
      has: this.page.getByText(pageTitle, { exact: true }),
    });
  }

  /**
   * verify preview
   * @param snapshotName
   * @param needSave
   * @returns
   */
  async verifyPreview(snapshotFixture: SnapshotFixture, snapshotName, needSave = true) {
    if (needSave) {
      await this.page.locator(".w-builder__header-right span:has-text('Save')").first().click();
      await expect(this.page.locator("text=i All changes are saved >> div")).toBeVisible();
      await this.page.waitForSelector("text=i All changes are saved >> div", { state: "hidden" });
      await this.page.waitForSelector("text=i Changes made on mobile will not apply on desktop >> div", {
        state: "hidden",
      });
    }
    await snapshotFixture.verify({
      page: this.page,
      selector: '[id="app"] [id="website-builder"]',
      snapshotName: snapshotName,
    });
  }

  /**
   * verify store front next
   * @param context
   * @param snapshotName
   * @returns
   */
  async verifySfn(snapshotFixture: SnapshotFixture, context, snapshotName) {
    const storefront = await verifyRedirectUrl({
      page: this.page,
      selector: '.w-builder__header-right [id="Icons/Eye"]',
      redirectUrl: `https://${this.domain}`,
      waitForElement: "section .variants-selector",
      context,
    });
    await snapshotFixture.verify({
      page: storefront,
      selector: '[id="app"] .default-layout',
      snapshotName: snapshotName,
    });
    await storefront.close();
  }

  /***
   * Ssearch data ở màn chọn template
   * @param dataSearch
   */
  async searchTemplate(dataSearch: string) {
    await this.page.locator(`//input[@placeholder='Try "Pets, .."']//preceding-sibling::span`).click();
    await this.page.keyboard.press("Control+A");
    await this.page.keyboard.press("Backspace");
    await this.page.locator(`//input[@placeholder='Try "Pets, .."']`).type(dataSearch);
    await this.page.waitForResponse(
      response => response.url().includes("/admin/themes/builder/template") && response.status() === 200,
    );
    await waitSelector(this.page, this.listTemplate);
  }

  /***
   * Show all data ở màn chọn template
   */
  async showAllTemplate() {
    await this.page.locator(`//input[@placeholder='Try "Pets, .."']`).click();
    await this.page.keyboard.press("Control+A");
    await this.page.keyboard.press("Backspace");
    await this.page.waitForResponse(
      response => response.url().includes("/admin/themes/builder/template") && response.status() === 200,
    );
    await waitSelector(this.page, this.listTemplate);
  }

  /**
   * SỬa heading title của tabs/accordion
   * @param block: block tabs/accordion
   * @param tab: thứ tự tab cần sửa
   * @param title: text muốn sửa ("" = xoá title)
   */
  async editTabsAccordionTitle(block: Locator, tab: number, title: string): Promise<void> {
    const inputField = this.frameLocator.locator("[contenteditable]");
    await block
      .getByRole("button")
      .or(this.page.locator("[class*=accordion__item]"))
      .nth(tab - 1)
      .dblclick();
    await inputField.waitFor();
    await this.page.keyboard.press("Control+A");
    if (typeof title !== undefined) {
      await inputField.type(title);
    }
    await this.titleBar.click();
    await this.quickSettingsText.waitFor({ state: "hidden" });
  }

  /**
   * Lấy locator các nút edit heading trong tab Content của block tabs/accordion
   * @param item
   * @param action
   * @returns
   */
  getBtnTabsAccordionHeading({
    item,
    button,
  }: {
    item: number;
    button?: "settings" | "duplicate" | "delete" | "drag";
  }): Locator {
    const actionBtn = {
      settings: "div.sb-icon",
      duplicate: "Copy",
      delete: "Trash",
      drag: "Drag",
    };
    const headingItem = this.genLoc(this.getSelectorByLabel("headings"))
      .locator("div[class*=mb-medium]")
      .filter({ has: this.page.getByText(`Item ${item}`, { exact: true }) });
    if (button) {
      const ele =
        button === "settings"
          ? headingItem.locator(actionBtn["settings"])
          : headingItem.locator("span.sb-icon").filter({ has: this.page.locator(`[id*=${actionBtn[button]}]`) });
      return ele;
    } else {
      return this.genLoc(this.getSelectorByLabel("headings"))
        .locator("div[class*=mb-medium]")
        .locator("[class$=widget--label]")
        .filter({ hasText: `Item ${item}` });
    }
  }

  /**
   * Hàm edit layout ở sidebar cho block tabs
   * @param data
   */
  async editLayoutTabs(data: TabsLayout): Promise<void> {
    const layoutType = {
      "Text only": 0,
      Block: 1,
      Folder: 2,
    };
    if (await this.genLoc(this.popOverXPath).locator("[class$=widget--tab-layout]").isHidden()) {
      await this.genLoc(this.getSelectorByLabel("tab_layout")).getByRole("button").click();
    }
    if (data.layout_type) {
      await this.genLoc(this.popOverXPath).locator(this.tabsLayoutType).nth(layoutType[data.layout_type]).click();
    }
    if (data.shape) {
      await this.selectDropDown(`${this.popover} [class*=space-between]:has-text("shape") .widget-select`, data.shape);
    }
    if (typeof data.underline !== "undefined") {
      await this.switchToggle(`${this.popover} [class*=space-between]:has-text("underline")`, data.underline);
    }
    await this.genLoc(this.getSelectorByLabel("tab_layout")).getByRole("button").click({ delay: 500 });

    if (data.active_color) {
      await this.color(data.active_color, `[class$=tab-layout]>div:has-text("Active Color")`);
    }
    if (data.active_text) {
      await this.color(data.active_text, `[class$=tab-layout]>div:has-text("Active Text")`);
    }
  }

  /**
   * Get locator các field trong layout của tabs
   * @param name
   * @returns
   */
  getTabsLayoutField(name: "shape" | "underline"): Locator {
    return this.genLoc(this.popover).locator("[class*=space-between]").filter({ hasText: name });
  }

  /**
   * Get Locator của icon heading accordion
   * @param heading: Heading title
   * @param position
   * @returns
   */
  getAccordionHeadingIcon(block: Locator, heading: string, position?: "left" | "right"): Locator {
    const IconXpath = {
      left: "preceding-sibling",
      right: "following-sibling",
    };
    const ele = position
      ? block.locator(".accordion__heading").filter({ hasText: heading }).locator(`//${IconXpath[position]}::i`)
      : block.locator(".accordion__heading").filter({ hasText: heading });
    return ele;
  }

  /**
   * Get locator của xpath current template
   * @param template
   * @returns
   */
  getXpathCurrentTemplate(template: string) {
    return `//p[contains(normalize-space(), 'Current page template') and contains(normalize-space(), '${template}')]`;
  }

  /**
   * Dnd các heading items của tabs/accordion trong sidebar
   * @param param0
   */
  async dndTabAccordionItemInSidebar({ from, to, pixel = 10 }: DnDTabAccordionItem) {
    const dragBtn = this.getBtnTabsAccordionHeading({ item: from.item, button: "drag" });
    const toSelector = this.getBtnTabsAccordionHeading({ item: to.item });
    await this.dragAndDropStepByStep(dragBtn, toSelector, pixel);
  }

  /**
   * Edit heading của tabs accordion
   * @param selector selector của heading cần edit
   * @param title title muốn sửa
   * @param data các option khác font, decoration....
   */
  async editTabsAccordionHeading(selector: string | Locator, data: EditTabsAccordionHeading): Promise<void> {
    const ele = typeof selector === "string" ? this.frameLocator.locator(selector) : selector;
    if (await this.textEditor.isHidden()) {
      await ele.dblclick({ delay: 500 });
      await this.textEditor.waitFor();
    }
    await this.page.keyboard.press("Control+A", { delay: 500 });
    //Settings style ở quick bar
    if (data.edit_quickbar) {
      await this.editQuickSettingsText(data.edit_quickbar);
    }
    //Edit title
    if (typeof data.title !== "undefined") {
      if (data.title === "") {
        await this.page.keyboard.press("Backspace");
      } else {
        await this.textEditor.pressSequentially(data.title, { delay: 100 });
      }
    }
    await this.backBtn.click();
    await this.textEditor.waitFor({ state: "hidden" });
    await this.quickSettingsText.waitFor({ state: "hidden" });
  }

  /**
   * Select menu in popup import menu
   * @param value is name menu want to select
   * @param index
   */
  async selectMenuItem(value: string, index = 0) {
    await this.genLoc(".sb-popup__body .sb-button--select").click();
    const option = this.genLoc(`#import-data-popover [data-select-label='${value}']>>nth=${index}`);
    await option.click();
  }

  /**
   * Hàm click add block trong repeated content
   * @param selector
   * @param item
   */
  async clickAddBlockInRepeatedContent(selector: Locator, item: number): Promise<void> {
    const col = selector.locator(`div[class='flex repeated-content__item'][repeated-item-index='${item}']`);
    await col.hover();
    await col.locator(".insert-block-indicator").click({ delay: 200 });
    await this.templateContainer.or(this.searchEmpty).waitFor();
  }

  getXpathItemRC(item: number) {
    return `div[class='flex repeated-content__item'][repeated-item-index='${item}']`;
  }

  /**
   * Lấy locator các nút edit item trong tab Content của block Repeated content
   * @param item
   * @param action
   * @returns
   */
  getBtnRepeatedItem({ item, button }: { item: number; button?: "settings" | "delete" | "drag" }): Locator {
    const actionBtn = {
      settings: "div.sb-icon",
      delete: "Trash",
      drag: "Drag",
    };
    const headingItem = this.genLoc(this.getSelectorByLabel("repeated_items"))
      .locator("div[class*=mb-medium]")
      .filter({ has: this.page.getByText(`Item ${item}`, { exact: true }) });
    if (button) {
      const ele =
        button === "settings"
          ? headingItem.locator(actionBtn["settings"])
          : headingItem.locator("span.sb-icon").filter({ has: this.page.locator(`[id*=${actionBtn[button]}]`) });
      return ele;
    } else {
      return this.genLoc(this.getSelectorByLabel("repeated_items"))
        .locator("div[class*=mb-medium]")
        .locator("[class$=widget--label]")
        .filter({ hasText: `Item ${item}` });
    }
  }

  /**
   * Dnd các items của repeated content trong sidebar
   * @param param0
   */
  async dndRepeatedItemInSidebar({ from, to, pixel = 10 }: DnDTabAccordionItem) {
    const dragBtn = this.getBtnRepeatedItem({ item: from.item, button: "drag" });
    const toSelector = this.getBtnRepeatedItem({ item: to.item });
    await this.dragAndDropStepByStep(dragBtn, toSelector, pixel);
  }

  /**
   * Lấy selector của breadcrumb
   * @param name
   * @param index
   */
  getSelectorBreadcrumb(name: string, index = 0): string {
    return `[id="element-name"] span:has-text("${name}") >> nth=${index}`;
  }

  getSelectorPreBreadcrumb(): string {
    return '[id="element-name"] .element-name__nav.pre';
  }

  /**
   * Lấy xpath của item trên quick bar
   * @param name
   */
  getQuickBarItemSelector(name: string) {
    return `//button[contains(@class,'quick-settings__item') and descendant::div[text()='${name}']]`;
  }

  /**
   * Set autoplay cho block
   * @param index: None:1, 3s: 2; 5s: 3; 10s: 4
   *
   */

  async selectAutoplay(index: number): Promise<void> {
    const selector = this.getWidgetSelectorByLabel("Autoplay");
    await this.page.locator(`${selector}` + `//span[${index}]`).click();
  }

  /**
   * Get xpath slider của popover
   * @param label: label của field slider
   */
  getXpathSlider(label: string) {
    return `//label[normalize-space()='${label}']//parent::div[contains(@class,'w-builder__widget--label')]//following-sibling::div[contains(@class, 'w-builder__widget--inline')]//div[contains(@class, 'sb-slider__bar')]`;
  }

  /**
   * get Xpath Row Data
   * @param title
   * @returns
   */
  getXpathRowData(title: string): string {
    return `//tr [ .//div[@title="${title}"]]`;
  }

  /***
   * Get xpath locale of global switcher
   * @param language
   */
  getXpathLocale(language: string) {
    return `.locale-dropdown p:has-text('${language}')`;
  }

  /***
   * Get xpath locale of global switcher of theme roller
   * @param language
   */
  getXpathLocaleRoller(language: string) {
    return `.locale-dropdown__item__name:has-text('${language}')`;
  }

  /***
   * Get xpath locale of global switcher of theme inside
   * @param language
   */
  getXpathLocaleInside(language: string) {
    return `.currency-dropdown__item__name:has-text('${language}')`;
  }

  /**
   * Download file CSV from the page then return the name of the file
   * @param xpath
   */
  async downloadFile(xpath: string): Promise<string> {
    await this.page.waitForSelector(xpath);
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.page.locator(xpath).click()]);
    return download.suggestedFilename();
  }

  /***
   * Get xpath image type trustpilot
   * @param type
   */
  getXpathImageType(type: string) {
    return `img[alt="${type}"]`;
  }

  /***
   * Get xpath block trustpilot in SF
   * @param index start = 0
   */
  getXpathBlockTrustPilot(index: number) {
    return `.tp-widget-wrapper svg>>nth=${index}`;
  }

  /***
   * Get xpath iframe block trustpilot in SF
   * @param index start = 0
   */
  getIframeTrustPilot(index: number) {
    return `section iframe>>nth=${index}`;
  }

  /**
   * Hàm đếm số lượng item trong block menu
   * @returns
   */
  async countItemMenu(): Promise<number> {
    return await this.genLoc("//div[@menu-index]").count();
  }

  /**
   * Hàm select action của button trong block Slideshow ử sidebar
   * @param action
   * @param button
   * @param page
   * @param index
   */
  async selectPageBtnSlideshow(action: string, button: 1 | 2, page: string, index = 1) {
    const buttonGroup = this.getButtonContainerSettings(button);
    await this.genLoc(`${buttonGroup} [class*=widget--link]>div:has(label:text-is('Action')) button`).click();
    await this.genLoc(this.popover)
      .filter({ hasNot: this.genLoc(".w-builder__slideshow--item-settings") })
      .locator(`[data-select-label='${action}']`)
      .click();
    await this.genLoc(`${buttonGroup} [class*=link-item] button`).click();
    await this.pageSearch.fill(page);
    await this.genLoc(`:nth-match(${this.popover} [data-select-label='${page}'], ${index})`).click();
  }

  /**
   * Hàm select page trong block menu
   * @param page
   */
  async selectPageInBlockMenu(page: string) {
    await this.page.getByRole("button", { name: "Select" }).click();
    await this.waitAbit(2000);
    const popoverIsInvisible = await this.genLoc(
      "//div[@id='widget-popover' and not(contains(@style,'display: none;'))]",
    ).isHidden();
    if (popoverIsInvisible) {
      await this.page.getByRole("button", { name: "Select" }).click();
      await this.page.waitForSelector("//div[@id='widget-popover' and not(contains(@style,'display: none;'))]");
    }
    await this.genLoc("//div[contains(@class,'w-builder__page-select-list')]//input[@placeholder='Search']").fill(page);
    await this.page.waitForSelector(`//li[@data-select-label="${page}"]`);
    await this.genLoc(`//li[@data-select-label="${page}"]`).click();
  }

  /**
   * get Width Height Block
   * (This function can retrieve the width or height of a block, including various types such as auto, %, px, and more.)
   * @param page
   * @param idBlock
   * @param dimensions
   * @returns
   */
  async getWidthHeightBlock(page: Page, idBlock: string, dimensions: "width" | "height"): Promise<string> {
    const themeCss = await page.evaluate(() => document.getElementById("critical-page-css").textContent);
    const blockCssRegex = new RegExp(`\\[data-block-id="${idBlock}"\\]\\{([^}]+)\\}`, "g");
    const valueBlockCss = blockCssRegex.exec(themeCss);
    const dimensionsRegex = dimensions === "width" ? /width\s*:\s*([^;]+)[^;]*;[^;]*$/ : /height\s*:\s*([^;]+)/;
    const dimensionsMatch = valueBlockCss[1].match(dimensionsRegex);
    const dimensionsValue = dimensionsMatch && dimensionsMatch[1] ? dimensionsMatch[1].trim() : null;
    return dimensionsValue;
  }
}
