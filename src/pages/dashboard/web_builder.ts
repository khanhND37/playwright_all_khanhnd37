/* eslint-disable indent */
import { SBPage } from "@pages/page";
import { BrowserContext, expect, FrameLocator, Locator, Page } from "@playwright/test";
import type {
  AddBlockSection,
  BackGround,
  BlackedText,
  Border,
  Bullet,
  Color,
  ColorStyles,
  DataSource,
  DnDLayerInSidebar,
  DnDTemplateFromPanel,
  DnDTemplateInPreview,
  ElementPosition,
  FiltersInfo,
  FilterStoreType,
  FormFieldSetting,
  FormStyleSettings,
  ImageNew,
  InsertPanelTemplateLoc,
  InsertTemplate,
  LayerInfo,
  LayerSettings,
  LayerStyles,
  LayoutContainer,
  Link,
  MarginPadding,
  NavigationButtons,
  NewDnDTemplateFromPanel,
  OpenWebBuilder,
  PointerResize,
  PreviewTemplateActions,
  ProductReviews,
  QuickBarOptions,
  QuickSettingsText,
  SaveTemplateInfo,
  SettingGeneral,
  SettingProductSearch,
  Shadow,
  Slider,
  StockCountDown,
  TabsAccordionStructure,
  TextAccordion,
  TextBlock,
  ThemeSettingValue,
  TimerCountDown,
  WidthHeight,
} from "@types";
import { WebsitePageStyle, XpathBlock, XpathLayer, XpathNavigationButtons, XPathWidget } from "@constants/web_builder";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";
import { waitForImageLoaded, waitSelector } from "@core/utils/theme";

export enum ClickType {
  SECTION = "section",
  ROW = "row",
  COLUMN = "column",
  BLOCK = "block",
}

const layoutSvg = {
  "Single column": "one-column",
  "1:1": "two-column",
  "1:1:1": "three-column",
  "1:2": "one-two",
  "2:1": "two-one",
  "1:2:1": "one-two-one",
  "1:1:2": "one-one-two",
  "2:1:1": "two-one-one",
  "1:1:1:1": "four-column",
};

export type SideBarDataWidgetId =
  | "position"
  | "align_self"
  | "width"
  | "background"
  | "border"
  | "opacity"
  | "border_radius"
  | "box_shadow"
  | "padding"
  | "margin"
  | "push_page_down"
  | "overlay"
  | "height"
  | "name";

export class WebBuilder extends SBPage {
  context: BrowserContext;
  iframe = "#preview";
  frameLocator = this.page.frameLocator(this.iframe);
  loadingScreen = this.genLoc(".w-builder__loading-screen");
  popOverXPath = "//div[contains(@class, 'sb-popover__popper') and not(contains(@style,'display: none;'))]";
  switchDesktopBtn = this.page.getByTestId("desktop");
  switchMobileBtn = this.page.getByTestId("mobile");
  sidebarContainer = this.genLoc("aside.w-builder__sidebar-wrapper");
  webFrontDesktopPreview = this.genLoc("div.w-builder__preview-desktop");
  webFrontMobilePreview = this.genLoc("div.w-builder__preview-mobile");
  visibleTooltip = this.genLoc("//div[@role='tooltip' and not(contains(@style, 'display: none;'))]");
  closeToastBtn = this.genLoc("span.sb-toast__close");
  toggleDeviceView = this.genLoc("div.w-builder__device-toggle");
  breadCrumb = this.frameLocator.locator("div#element-name[style*='visible']");
  sourceBreadcrumb = this.genLoc(".element-name__main");
  backBtn = this.genLoc(":nth-match(div.w-builder__tab-heading span, 2)");
  backToLayerBtn = this.genLoc("//div[contains(@class, 'w-builder__settings')]/div/span[1]");
  layerDetailLoc = "div.w-builder__settings";
  sidebarLoc = this.genLoc("aside.w-builder__sidebar-wrapper");
  previewMobileLoc = "div.w-builder__preview-mobile";
  sidebarTitle = ".w-builder__tab-heading--title";
  mainWb = ".w-builder__main";
  buttonShowLayer = this.genLoc("button[data-block-action='visible']");
  quickBarSetting = "[id=quick-settings]";
  quickBarLoc = "[class*='quick-settings--']";
  draggingGhost = this.genLoc("div[class*=insert-dragging-item]");
  layoutPopupLoc = "div.popper:not([style*='display: none;'])";
  columnSettingsBtn = "div[class*=quick-settings__item] svg";
  quickSettingsBlock = "[id=quick-settings][class*=block]";
  quickSettingsText = this.frameLocator.locator("[id=quick-settings][class*=text]");
  xpathPaynowLabelSideBar = "//input[@placeholder='Pay now']";
  overrideSiteStyles = "//div[normalize-space()='Override Site Styles']";
  pageStylesColors = this.genLoc("[data-tab=page] label:text-is('Colors')");
  pageStylesFonts = this.genLoc("[data-tab=page] label:text-is('Fonts')");
  pageStylesButtons = this.genLoc("[data-tab=page] label:text-is('Buttons')");
  colorInputField = this.genLoc("[class*=palette] input[maxlength]");
  pageStyleCss = this.frameLocator.locator("style#page-css");
  titleBar = this.genLoc(
    ".w-builder__settings, .w-builder__layers:not([style*=none]), .w-builder__styles-customize",
  ).locator("div.w-builder__tab-heading");
  applyHyperlinkBtn = this.frameLocator.locator("div[class*=quick-settings-link__apply] button");
  layerBar = this.genLoc("[class*=layers] [class*=tab-heading]");
  searchbarTemplate = this.page.getByRole("textbox", { name: "Search" });
  insertCateList = this.genLoc("[class$=insert-category-list]");
  insertPreview = this.genLoc("[class$=insert-previews]");
  cateInsertPanel = "[class*=category-name]";
  templatePreview = ":is([class$=basic-preview], [class$=template-wrapper])";
  templateContainer = this.genLoc("[class$=insert-template-container]:visible");
  closeInsertPanelBtn = this.genLoc("[class*=insert-previews] button:has([id*='Close'])");
  dropdownMenu = "[class*=dropdown-menu][data-dropdown-show=true]";
  saveTemplateBtn = this.genLoc("[class*=popup__footer][class*=button--primary]");
  storeTypeFilterBtn = this.genLoc("[class$=filter] button:has([id*=Store])");
  storeTypeFilterOption = this.genLoc("[class*=popover]:has(label[class*=sub-heading]) li");
  libraryFilterBtn = this.genLoc("[class$=filter] button:has([id$=Down])");
  libraryFilterOption = this.genLoc("[class$=filter-menu-item]");
  libraryFilterDropdown = this.genLoc("[class$=filter-menu]");
  searchEmpty = this.genLoc("[class$=search-empty-content]");
  addSectionPlaceHolder = this.frameLocator.locator("div.edit-indicator__drop-zone");
  removeBtn = this.genLoc("[data-action-remove]");
  webSettingTitle = this.genLoc(".w-builder__styles div.w-builder__insert-category-list-title");
  settingListTitle = this.genLoc(".w-builder__styles div.w-builder__tab-heading");
  xpathHeaderSaveBtn = ".w-builder__header-right .sb-button--primary >> text=Save";
  xpathSavedMessage = ".sb-toast__message";
  xpathButtonPreview = "//button[@name='Preview on new tab']";
  xpathTextColor =
    "//div[@data-widget-id='text_color']//span[contains(@class,'w-builder__chip w-builder__chip--color')]";
  xpathTabStyle = "//div[@class='w-builder__settings-list']";
  selectMainSF = ".main";
  productItem = "//section[@component='upsell-widget']//div[contains(@class,'product-item')]";
  selectMainPage = ".w-builder__preview";
  xpathAccountBarSF = "//div[contains(@class,'account-bar')]";
  xpathSidebarGeneral = "//div[@class='w-builder__styles-customize-settings']";
  xpathContainerPageSetting = "//div[contains(@class,'container setting-page')]";
  formScrollablePopoverSelector =
    "//div[contains(@id, 'sb-popover') and not(contains(@style, 'display: none'))]//div[contains(@class, 'w-builder__form-popover--scrollable')]";
  xpathVisibleTooltip =
    "//div[@role='tooltip' and @class = 'sb-tooltip sb-relative' and not(contains(@style, 'display: none;'))]";
  gridIcons = "(//div[@class='widget-icon__grid'])[1]";
  spacingLayout = "//label[contains(., 'Spacing')]/ancestor::div[2]";
  previewVerticalLayout = ".wb-content-selected .vertical[style]";
  previewHorizontalLayout = ".wb-content-selected .horizontal[style]";
  previewSelectedLayout = ".wb-content-selected[style]";
  toggleSwitchClipContent = "[data-widget-id='clipping_content'] input";
  wrapperBlock = ".wb-dnd-container .block-wrapper";
  styleContainerBlock = this.frameLocator.locator("[data-block-component='container'] .wb-dnd-container[style]");
  previewWebFront = this.genLoc("//div[@id='wb-main']");
  alignInSidebar = ":nth-match([label='Align'] .w-builder__widget--inline, 1)";
  sectionsInSidebar = "[section-index]";
  sectionsInPreview = "[class*=container][data-section-id]";
  columnsInPreview = "[data-column-id]";
  rowsInPreview = "[data-row-id]";
  rowsInSidebar = "[data-row-index]";
  columnsInSidebar = "[data-column-index]";
  emptyPageImage = ".wb-empty__image";
  emptyPageHeading = ".wb-empty__title";
  emptyPageDescription = ".wb-empty__description";
  oldBlankPage = ".w-builder__preview-overlay";
  childLayersInSidebar = "[class*=layer-child]";
  selectorFooterWB = '[data-block-component="pb-plb-footer"]';
  selectorFooterSF = '[component="pb-plb-footer"]';
  blocksInPreview = "section.block[component]";
  blocksInSidebar = ".w-builder__layer[data-id]";
  tagSection = "//div[normalize-space()='Tags (optional)']/parent::div/following-sibling::div//input";
  xpathMgInline = "[x-placement='bottom'] .sb-autocomplete__no-results span";
  xpathPopupHeader = ".sb-popup__header";
  btnAddLibrary = ".sb-autocomplete__addable-row-plus-icon";
  addLibrary = "[x-placement='bottom'] div .sb-text-body-medium";
  xpathCategoryWB = ".w-builder__insert-categories p";
  addSecionInPreview = "//div[contains(@class,'indicator--section')]";
  insertTemplatePreview = ".w-builder__insert-template-preview img";
  contentLayer = ".w-builder__layers-content p";
  insertCategory = ".w-builder__insert-category";
  btnxClose = "//label[contains(., 'Library')]/parent::*/following-sibling::div//*[@id='Path']";
  btnAddSection = "//span[normalize-space()='Add section']/parent::div";
  msgSaveSuccess = "text=i All changes are saved >> div";
  insertTemplate = ".w-builder__main .w-builder__insert-previews";
  insertFirstTemplateInfo = " .w-builder__insert-template-info .sb-p-medium a >> nth=0";
  templateActive = ".sb-tab-navigation__item--active";
  addBlockInSidebar = "//span[contains(., 'Add block')]/ancestor::div[4]";
  previewInsertFirstTemplate = ".w-builder__insert-template-preview img >> nth=0";
  editFirstTemplate = ".card-template__image--actions p:has-text('Edit') >> nth=0";
  layerLabel = ".w-builder__layer-label";
  inputTemplateReplace = "//label[contains(.,'Choose template to replace')]//following::div//input";
  resultSearch = "//div[contains(@class, 'sb-autocomplete__addable-row')]/following-sibling::div";
  xpathInputHelpText = "//div[contains(@class,'input-help-text')]";
  xpathInputHelpTextLearnMore = "//div[contains(@class,'input-help-text')]//a";
  xpathCookieBar = "//div[contains(@class,'cookie-bar') and not(contains(@class, 'cookie-bar__'))]";
  xpathEditFirstSocial = "(//div[contains(@class, 'widget-social__item-wrapper')])[1]//span[@class='w-builder']";
  addSocialBtn = "//label[contains(text(),'Add Social')]";
  headerMsg = "div.w-builder__header-message";
  iconPreview = ".w-builder__header-right [id='Icons/Eye']";
  websiteBuidlerPreview = "[id='app'] [id='website-builder']";
  addBlockWB = "//span[contains(., 'Add block')]/ancestor::div[4]";
  defaultLayoutSF = "[id='app'] .default-layout";
  wbFullHeight = this.previewWebFront.locator(".wb-preview__container");
  sectionSocial = "section .social";
  layerInSidebar = "div.w-builder__layer";
  buttonsInLayer = "[class*=element-action]";
  xpathPreviewLoadingScreen = ".w-builder__loading-screen";
  xpathCookiePageLink = "//div[contains(@class,'widget--link-item')]//div[contains(@class,'sb-popover__reference')]";
  selectorHeaderTabContent = ".w-builder__sidebar-content .w-builder__tab-heading--title";

  xPathSkeletonFontGroup = "//div[contains(@class, 'font-group__library')]//div[contains(@class, 'skeleton--item')]";
  xPathHiddenLayerIcon = "/following-sibling::div/div[contains(@class, 'action--not-visible')]";
  imageTemplateSaveAsFirst = ".card-template__image img >> nth=0";
  cardTemplateImageFirst = ".card-template__image >> nth=0";
  libraryColor = ".w-builder__color-group--library span >> nth=1";
  deleteTemplate = "//button[normalize-space()='Delete template']";
  cardTemplateInfo = "//div[contains(@class,'card-template__info')]//button";
  nameCardTemplate = ".card-template__info--name";
  btnEdit = "//li[normalize-space()='Edit info']";
  btnDelete = "//li[normalize-space()='Delete']";
  inputTemplateName = "[placeholder='Template name']";
  btnSaveCardTemplate = ".sb-popup__footer-button.sb-button--primary--medium";
  btnSaveIsLoading = ".sb-popup__footer-button.sb-button--primary--medium .sb-button--loading-state";
  hyperlinkReplateTemplate = "text=Replace existing template";
  nameTemplateReplace = "[placeholder='Name of template you want to replace']";
  optionSelectTemplate = "[x-placement='bottom'] .sb-selection-item";
  sectionLayerInSidebar = "//p[contains(@class,'w-builder__layer-label--section')]";
  saveTemplatePopup = this.genLoc("[class$=save-template]").locator(".sb-popup__container");
  addBlockBtn = this.page.locator(".indicator-block-content").filter({ hasText: "Add block" });
  selectedTemplate = this.frameLocator.locator(".wb-content-selected");
  tabSettings = this.genLoc("[id*=tab-navigation] [class*=item]");
  accordionIcon = this.genLoc("i.accordion__icon");
  moreAction = "//li[contains(text(), 'Keyboard shortcuts')]//ancestor::div[contains(@class,'sb-popover')]";
  shortCutInMoreAction = ".sb-dropdown-menu__item>>text=Keyboard shortcuts";
  keyboardShortcut = ".w-builder__keyboard-shortcut";
  closeKeyboardShortcut = ".w-builder__keyboard-shortcut-header button";
  layerSelector = ".w-builder__layer";
  btnInWB = "(//div[@data-block-component='button']//span)[1]";
  iconSelector = ".w-builder__element-action .w-builder__element-icon";
  buttonInPreview = "//div[@data-block-component='button']//span";
  blockIcon = "//div[contains(@class,'block-icon')]";
  blockHeading = "//div[contains(@class,'block-heading')]";
  btnDeleteInSidebar =
    "(//div[contains(@class,'w-builder__settings-remove')]//span[normalize-space()='Delete block'])[2]";
  imageBlock = "//section[@component='block_image']";
  emtyPage = this.frameLocator.locator(".wb-empty");
  blockHeadingInFirstSectionFirstColumn =
    "((//section)[1]//div[contains(@class,'wb-preview__column')])[1]//div[contains(@class,'block-heading')]";
  containerInPreviewWB = ".wb-preview__section--container";
  containerHorizontal = "(//div[contains(@class, 'container horizontal')])[2]/parent::div";
  previewSection = "//section[contains(@class, 'wb-preview__section')]";
  containerVertical = "(//div[contains(@class, 'container vertical')])[2]/parent::div";
  accordionExpandIcon = this.genLoc("i.accordion__icon");
  autocompletePopover = this.genLoc("[id*=popover]:not([style*=none]) [class*=autocomplete__selection]");
  addNewBtn = this.genLoc("div.sb-popover:not([style*='display: none']) [class$=addable-row]");
  templateTitle = this.genLoc("p[data-id]");
  htmlColorPicker = this.frameLocator.locator("#inputColorPicker");
  settingsTabContainer = this.genLoc("[class$=tab-navigation--inside]");
  variableGroups = this.genLoc("div[class*='group-options ']");
  colorSidebar = "div.color";
  popoverVariableOptions = this.genLoc(".popper:not([style*='display: none'])");
  xpathSidebar = "//div[contains(@class, 'w-builder__sidebar-content')]";
  xpathTitlePageTemplate = "(//div[@class='sb-relative']//p)[1]";
  xpathMainWebBuilder = "//div[contains(@class, 'w-builder__main')]";
  xpathToast = ".sb-toast__message";
  layoutResize = ".edit-indicator__resize";
  columnSpacing = ".wb-preview__gutter";
  spacingDot = ".wb-preview__gutter-dot";
  xpathBtnLearningCenter = ".w-builder__header-learning-center-btn svg";
  xpathHeaderWBRight = ".w-builder__header-right";
  xpathPopupLearningCenter = "div.sb-popup__body.sb-scrollbar.sb-text";
  headingLearningCenter = ".sb-popup.w-builder__learning-center div.heading > h3";
  sidebarPopupLearningCenter = "div.w-builder__learning-center--sidebar";
  stepInCardOnboarding = "div.post-card .post-card__step";
  searchOnboardingCard = ".w-builder__learning-center--content input";
  titleOnboardingCard = ".w-builder__learning-center--content p";
  msgEmptySearch = "div.empty-result h2";
  closeSearchBar = "//*[@id = 'Icons/Navigation/Close-(line)']/ancestor::button";
  iconCloseSearch = "//div[contains(@class,'input-search')]//*[@id = 'Icons/Navigation/Close-(line)']";
  imgCardLearning = ".sb-popup__body .post-card";
  buttonPractice = "(//div[@class='post-card']//img)[1]//parent::div//span[contains(text(),'Practice on editor')]";
  hyperlinkExploreMore = "a.explore-more-btn";
  popoverCardLearning = "div.w-builder__learning-center-popover";
  titleCardLearning = "div.w-builder__learning-center-popover .header-title";
  descriptionCardLearning = ".w-builder__learning-center-popover .description";
  buttonClosePopupLearning = "div .sb-popup__header-close span svg";
  insertPanel = this.genLoc(".w-builder__header").getByTestId("insert");
  paddingMarginResizeTooltip = ".resize-spacing__tooltip";
  layoutColumnPopover = ".wb-preview-layout-column__content";
  layoutColumnQuickBar = ".wb-preview-layout-column__popper";
  columnIcon = "[class$=column__icon]";

  beforeIndicatorResize = this.genLoc(".before:visible").locator(this.layoutResize);
  beforeAddIndicator = this.genLoc(".before:visible .edit-indicator-content");
  afterIndicatorResize = this.genLoc(".after:visible").locator(this.layoutResize);
  afterAddIndicator = this.genLoc(".after:visible .edit-indicator-content");
  beforeIndicatorResizeRow = this.genLoc(".edit-indicator--row.before").locator(this.layoutResize);
  beforeAddIndicatorRow = this.genLoc(".edit-indicator--row.before .edit-indicator-content");
  afterIndicatorResizeRow = this.genLoc(".edit-indicator--row.after").locator(this.layoutResize);
  afterAddIndicatorRow = this.genLoc(".edit-indicator--row.after .edit-indicator-content");
  popoverChooseTemplateOverlay = this.genLoc(".wb-preview-layout-column__fixed");
  rowNotAttrs = this.genLoc(".row:not([data-row-id])");
  addColPopper = this.genLoc(".popper").filter({ hasText: "You can only add maximum 4 columns per row" });
  emptyCol = this.genLoc("div.empty-column");
  xpathSelectedTagOnPageTemplate =
    "(//div[contains(@class, 'sb-template-tags')]//div[contains(@class, 'sb-text-caption')])[2]";
  autocompleteClearIcon = this.genLoc(".sb-autocomplete__clear-icon");
  xpathBlockPolicies = "//section[@component='policies']";
  xpathTitleBlockPolicies = `//span[@value="page.title"]`;
  xpathContentBlockPolicies = `//section[@component='policies']//div[@class="custom-code__content"]`;
  buttonShowMeArround = ".sb-button--primary.sb-button--medium.is-round";
  popupTourGuide = ".w-builder__onboarding.sb-p-large > div > div";
  buttonNextInCard = "button#tg-dialog-next-btn";
  buttonPreInCard = "button#tg-dialog-prev-btn";
  titleCard = "div.tg-dialog-title";
  descriptionCard = "//div[@class='tg-dialog-body']//p";
  cardOnboarding = "div.tg-dialog";
  onboardingCongratPopup = "div.sb-popup.w-builder__onboarding-congrat .sb-text";
  hyperLinkLearnMore = "//a[normalize-space()='Learn more']";
  buttonLetsDoIt = "div.w-builder__onboarding-congrat--content > button > span";
  buttonNoThanks = "//span[normalize-space()='No, thanks']";
  descriptionResetCard = "//div[@class='tg-dialog-body']//p";
  resetOnboarding = ".w-builder__header-reset-onboarding";
  closePopupOnboarding = "#tg-dialog-close-btn > svg";
  buttonNextInCardLearning = ".sb-p-medium > div:nth-child(2) .sb-button--primary--medium > span";
  buttonPreviousInCardLearning = ".sb-button--subtle--medium:nth-child(1) > span";
  bulletItem = this.genLoc(".widget-list [class*=w-builder__label]");
  layoutPresetPopover = this.genLoc(".popper__content:visible").filter({ hasText: "Layout preset" });
  xpathBlockStockCountDown = "//section[@component='stock-countdown']";
  xpathContentVisitorRandom = "//div[contains(@class,'block-visitors')]//p//span[@data-type='variable']";
  xpathContentStockCountdown = `${this.xpathBlockStockCountDown}//span[@data-type='variable']`;
  xpathBlockCheckout = `//*[@component='checkout-container' and not(contains(@class, 'hidden'))]/div`;
  xpathBlockCartItems = `//section[@component='cart-items' and not(contains(@class, 'hidden'))]/div`;
  xpathBreadcrumbContainer = `//div[@class='breadcrumb__container']`;
  xpathDroplistActionInBlockText = `//div[@class='popper wb-dropdown']`;
  xpathLayout = "//div[@data-widget-id='layout']//span//button";
  selectorDataSourceWidget = `//label[contains(text(), 'Data source')]/ancestor::div[contains(@class, 'w-builder__widget') or contains(@class, 'w-builder__source-detail')]//div[contains(@class, 'title')]`;
  xpathBlockRating = "//section[@component='product_rating' or @component='rating']";
  xpathBlockReviews = "//section[@component='product_reviews']";
  xpathCardLayout = `//div[@class="w-builder__popover--options-no-layout"]`;
  xpathPageSelectedInBlockHeadingOrParagraph =
    "//div[@class='quick-settings-link__value']//div[contains(@class,'wb-dropdown__select')]";
  xpathBlockCountTimer = "//section[@component='counter-timer']";
  xpathIconClose = "//div[contains(@class, 'close-icon')]";
  xpathDragInSidebar = "//span[contains(@class,'widget-list__drag')]";
  columnContainer = ".wb-preview__column--container";
  rowContainer = "[class*=row--container]";
  popupSaveTemplate = this.genLoc("div.sb-popup__container");
  popupDescription = this.popupSaveTemplate.locator(".sb-popup__body [class*=text-body]").first();
  xpathBtnLayout =
    "//span [ .//label[normalize-space()='Layout']]//div[contains(@class,'w-builder__widget--inline')]//button";
  xpathLayOut = "(//div[contains(@class,'w-builder__widget--layout')]//div[contains(@class,'list-icon')]//span)";
  alignItem = "div[class*=thickness-item]";
  xpathBorderSection = ".wb-content-selected .layer-selector>>nth=0";
  xpathIndicator = "[data-testid='selected'] .edit-indicator-content";
  xpathIndicatorColumn = ".wb-content-selected .edit-indicator-content";
  xpathInsert = "//*[contains(@class, 'w-builder__insert')]";
  columnLayout = ".wb-preview-layout-column__icon";
  toggleSwitch = ".sb-switch__switch";

  xpathBtnExit = "//button[@name='Exit']";
  TooltipExit = this.genLoc("//div[text()='Exit']");
  popupConfirm = this.genLoc(".sb-popup__container");
  previewIcon = this.genLoc("[name*='Preview']");
  previewTooltip = this.genLoc("//div[ text()=' Preview on new tab ']");
  toastHeader = ".w-builder__header-message";
  toastMessage = this.genLoc("div.sb-toast__message");
  xpathToastContainer = ".sb-toast__container";
  xpathSectionPreviewPage = this.genLoc("[class*='section']");
  xpathButtonSave = "//button[@name='Save']";

  countdownItem = `${this.xpathBlockCountTimer}//div[contains(@class,'countdown__item')]`;
  blockVisitor = "//div[contains(@class,'block-visitors')]";
  xpathToastAddNewSection = `//*[contains(text(), 'Section moved to header. It will now be visible on all pages in this store')]`;
  xpathToastAddNewBlock = `//*[contains(text(), 'Block moved to header. It will now be visible')]`;
  xpathDropdownOnGlobalSwitcher = `//div[contains(@class, 'custom-select')]`;
  selectorTitlePopupChooseLangugeCurrency = ".locale-currency-dropdown .currency-language-v2__title";
  xpathBlockGlobalSwitcher = `//div[contains(@class, 'action-label')]`;
  xpathBlockVideo = "//section[@component='video']";
  xpathForgotOrd = `//a[contains(text(),'I forgot my order number')]`;

  /**
   * This locator of youtube video with start time and end time
   * @param startAt is start time, match with Start at field
   * @param endAt is end time, match with End at field
   */
  xpathSourceVideoByTime(startAt: string, endAt: string) {
    return `//iframe[contains(@src,'start=${startAt}&end=${endAt}')]`;
  }

  xpathIconToolTipReview(label: string) {
    return `//*[normalize-space()='${label}']//*[local-name()='svg']`;
  }

  xpathBtnWithLabel(section: string) {
    return `//input[@type="checkbox" and ancestor::div[@data-widget-id='${section}']]`;
  }

  xpathLayoutIcon(sectionName: string): string {
    return `//p[contains(text(),'${sectionName}')]/ancestor::div[contains(@class, 'w-builder__layer-title')]//preceding-sibling::div//button`;
  }

  xpathLayoutBlock(sectionName: string, blockName): string {
    return `//p[contains(text(),'${sectionName}')]/ancestor::div[contains(@class, 'w-builder__layer-title')]//parent::div//following-sibling::div[contains(@class, 'w-builder__layer-child')]//p[contains(text(),'${blockName}')]`;
  }

  xpathTitlePagePreview(pageName: string) {
    return `//h2[normalize-space()='${pageName}']`;
  }
  xpathCoursePlayerMainContent(xpath?: string): string {
    return xpath
      ? `(${xpath}//div[contains(@class, 'menu-main__content')])[1]`
      : `(//div[contains(@class, 'menu-main__content')])[1]`;
  }

  xpathCoursePlayerSidebar(xpath?: string): string {
    return xpath
      ? `(${xpath}//div[contains(@class, 'course-player-sidebar__sections')])[1]`
      : `(//div[contains(@class, 'course-player-sidebar__sections')])[1]`;
  }

  xpathIconSmartOptimize(page: string): string {
    return `//div[contains(text(),'${page}')]/following-sibling::span//*[local-name()='svg']`;
  }

  xpathSelectPageSidebar(page: string): string {
    return `(//li[@data-select-label ='${page}'])[last()]`;
  }

  xpathSelectPageInWebfront(page: string): string {
    return `(//span[normalize-space() ='${page}'])`;
  }

  /**
   * Get locator trong tabs accordion
   * @param param0 : column và block muốn lấy loc
   * @param level : nằm ở nested level 1, 2
   * @returns
   */
  getLocInTabsAccordion(ele: string | Locator, { level, row, column, block }: TabsAccordionStructure): Locator {
    const sourceEle = typeof ele === "string" ? this.frameLocator.locator(ele) : ele;
    let loc: Locator;
    if (row) {
      loc = sourceEle
        .locator(`:nth-match([class*='row relative'], ${row})`)
        .filter({ has: this.genLoc(`.row[data-nested-level="${level}"]`) });
    }
    if (column) {
      loc = loc.locator(`.row[data-nested-level="${level}"]>.column`).nth(column - 1);
    }
    if (block) {
      loc = loc
        .locator("[data-block-component]")
        .filter({ hasNot: this.page.locator(`[data-nested-level="${level + 1}"]`) })
        .nth(block - 1);
    }
    return loc;
  }

  constructor(page: Page, domain?: string, context?: BrowserContext) {
    super(page, domain);
    this.context = context;
  }

  // ================== In Preview =======================
  //TODO: Webfront Preview method

  /**
   * Hàm click element trong WB đảm bảo hiển thị quickbar cả khi click nhanh quá.
   * @param ele
   * @param position
   */
  async clickElementInWB(ele: string | Locator, position = { x: 1, y: 1 }) {
    const target = typeof ele === "string" ? this.frameLocator.locator(ele) : ele;
    await target.click({ position: position });
    while (await this.frameLocator.locator(this.quickBarLoc).isHidden()) {
      await this.backBtn.click({ delay: 200 });
      await target.click({ position: position });
    }
  }

  /**
   * Hàm reload nếu vào page product hoặc các page khác mà cache data hiển thị page home hoặc web builder bị loading mãi
   * @param pageType: Nếu ko đúng page type mong muốn sẽ reload lại.
   * NOTE: Check page type bằng cách sau:
   * Vào web builder -> mở console -> window.document.querySelector("#preview").contentWindow.document.location.pathname
   * Mặc định Home path name = "/"
   * Mỗi page sẽ có 1 path name khác nhau khi mở wb ko đúng page mong muốn mà bị cache sẽ reload để hiển thị đúng
   */
  async reloadIfNotShow(pageType = "web builder"): Promise<void> {
    if (pageType === "web builder") {
      try {
        await this.loadingScreen.waitFor({ state: "hidden", timeout: 60000 });
      } catch (error) {
        await this.page.reload({ waitUntil: "networkidle" });
        await this.waitResponseWithUrl("/js/main.js");
        await this.loadingScreen.waitFor({ state: "hidden" });
      }
    } else {
      const currentPagePath = await this.frameLocator.locator("#app").evaluate(() => {
        const wbPathname = document.location.pathname;
        return wbPathname;
      });
      if (!currentPagePath.includes(pageType)) {
        await this.page.reload();
        await this.loadingScreen.waitFor();
        await this.loadingScreen.waitFor({ state: "hidden" });
        if (await this.frameLocator.locator(XpathBlock.progressBar).isVisible()) {
          await this.frameLocator.locator(XpathBlock.progressBar).waitFor({ state: "detached" });
        }
      }
    }
  }

  /**
   * click vào section tại side bar
   * @param sectionName
   */
  async clickOnSection(sectionName: string) {
    await this.genLoc(
      `(//p[contains(text(),'${sectionName}')]/ancestor::div[contains(@class, 'w-builder__layer-title')])`,
    )
      .first()
      .click();
  }

  /**
   *Get locator theo tên template ở insert panel
   * @param template
   * @param index
   * @returns
   */
  getTemplatePreviewByName(template: string, index = 1): Locator {
    return this.genLoc(
      `:nth-match([class*=insert-basic-preview]:has(p:text-is("${template}")),
      [class$=wrapper]:has([class$=info] p:text-is("${template}")) [class$=template-preview], ${index})`,
    );
  }

  /**
   * Get locator category theo tên
   * @param cateName
   * @returns
   */
  getCategoryByName(cateName: string): Locator {
    return this.genLoc("[class*=insert-categories] [class*=category]").filter({
      has: this.genLoc(`p:text-is("${cateName}")`),
    });
  }

  /**
   * Get locator button add block
   * @param param0
   * @returns
   */
  getAddBlockBtn({ section, column = 1 }: AddBlockSection): Locator {
    const sectionIndex = section - 1;
    const columnIndex = column - 1;
    return this.frameLocator
      .locator("section[class*=preview__section]")
      .nth(sectionIndex)
      .locator("[class*=preview__column]")
      .nth(columnIndex)
      .locator("[class*=indicator-block]")
      .filter({ hasText: "Add block" });
  }

  /**
   * Get locator button add section
   * @param param0
   * @returns
   */
  getAddSectionBtn({ section, position = "before" }: AddBlockSection): Locator {
    const index = section - 1;
    return this.frameLocator
      .locator("[class*=preview__section]:has([data-section-id][data-nested-level='0'])")
      .nth(index)
      .locator(`.${position}`)
      .filter({ hasText: "Add section" });
  }

  /**
   * get xpath input slide bar
   * @param selector
   */
  xpathInputSlideBar(selector: string): string {
    return `(//div[@data-widget-id='${selector}']//div[contains(@class,'w-builder__container--inline')]//input)[2]`;
  }

  /**
   * Get selector of section/column/block by index in preview
   * @param section
   * @param row
   * @param column
   * @param block
   */
  getSelectorByIndex({ section, row, column, block, repeated, type = "default" }: ElementPosition): string {
    const excludePopup = type === "exclude-popup" ? " and not(contains(@class, 'section-popup'))" : "";
    const excludeNested =
      type === "exclude-nested" ? " and not(ancestor::*[@data-nested-level='1' or @data-nested-level='2'])" : "";
    let selector = `(//section[contains(@class,'section') and not(@selected-block-state)${excludePopup}])[${section}]`;
    if (row) {
      selector = `(${selector}//div[contains(@class,'row relative')${excludeNested}])[${row}]`;
    }
    if (column) {
      selector = `(${selector}//div[contains(@class,'column') and contains(@style,'--gutter')${excludeNested}])[${column}]`;
    }
    if (block) {
      selector = `(${selector}//div[contains(@class,'wb-dnd-draggable-wrapper') and not(ancestor::*[@data-nested-level='1' or @data-nested-level="2"])])[${block}]`;
    }
    if (repeated) {
      selector = !repeated.block
        ? `${selector}//div[@repeated-item-index='${repeated.item}']`
        : `${selector}//div[@repeated-item-index='${repeated.item}']//div[@data-block-component][${repeated.block}]`;
    }
    return selector;
  }

  /**
   * Tách từ hàm dưới để get selector dạng string
   * @param id
   * @param type
   */
  getElementSelector(id: string, type: ClickType): string {
    const selector = {
      [ClickType.SECTION]: `[data-section-id="${id}"]`,
      [ClickType.ROW]: `[data-row-id="${id}"]`,
      [ClickType.COLUMN]: `[data-column-id="${id}"]`,
      [ClickType.BLOCK]: `[data-block-id="${id}"]`,
    };
    return selector[type];
  }

  /**
   * Tách từ hàm dưới để get element trong web builder bằng id
   * @param id
   * @param type
   * @returns
   */
  getElementById(id: string, type: ClickType): Locator {
    return this.frameLocator.locator(this.getElementSelector(id, type));
  }

  /**
   * Click section, row, column, block bằng id
   * @param id
   * @param type
   */
  async clickElementById(id: string, type: ClickType, position = { position: { x: 10, y: 5 } }) {
    const element = this.getElementById(id, type);
    await element.click(position);
    let selected = await this.frameLocator
      .locator(`.wb-content-selected ${this.getElementSelector(id, type)}`)
      .isVisible();
    while (!selected) {
      await this.backBtn.click();
      await element.click(position);
      selected = await this.frameLocator
        .locator(`.wb-content-selected ${this.getElementSelector(id, type)}`)
        .isVisible();
    }
  }

  /**
   * Resize block/section in preview
   * @param blockSelector
   * @param pointer: pointer to resize
   * @param resize (unit is pixel): the size you want to increase or decrease on the x-axis.
   * y-axis will automatically change according to
   */
  async resize(blockSelector: ElementPosition, pointer: PointerResize, resize: number) {
    const selector = this.getSelectorByIndex(blockSelector);
    await this.frameLocator.locator(selector).click();
    const resizeSelector = this.frameLocator.locator(`${selector}//div[@data-resize='${pointer}']`);
    const box = await resizeSelector.boundingBox();
    await resizeSelector.hover();
    await this.page.mouse.down();
    await this.page.mouse.move(box.x, box.y, { steps: 3 });
    let x = box.x + resize;
    if (box.x > resize) {
      x = resize;
    }

    await this.page.mouse.move(x, box.y, { steps: 3 });
    await this.page.mouse.up();
  }

  /**
   * Get resize pointer locator cuả layout section, row, column, spacing
   * @param position
   * @returns
   */
  getResizePointerLayout = (position: "top" | "bottom" | "left" | "right" | "spacing"): Locator => {
    let loc: Locator;
    switch (position) {
      case "top":
        loc = this.frameLocator.getByTestId("selected").and(this.page.locator(".before")).locator(this.layoutResize);
        break;
      case "bottom":
        loc = this.frameLocator.getByTestId("selected").and(this.page.locator(".after")).locator(this.layoutResize);
        break;
      case "left":
      case "right":
        loc = this.selectedTemplate.locator(`.column-resizer__${position}`);
        break;
      default:
        loc = this.selectedTemplate.locator(this.spacingDot).first();
        break;
    }
    return loc;
  };

  /**
   * Hàm resize section, row, column
   * @param element: layout cần resize ở webfront (section, row, column).
   * NOTE: resize spacing thì element phải là row.
   * @param width: là expected width sau khi resize spacing (px)
   * @param grid: là expected grid(2-10) sau khi resize column.
   * Max grid tuỳ vào số column mà thay đổi khi có 2 col, max grid = 10
   * @param height: là expected height sau khi resize section, row (px)
   */
  async resizeLayout({
    element,
    pointer,
    width,
    grid,
    height,
    beforeUp,
  }: {
    element: Locator;
    pointer: "top" | "bottom" | "left" | "right" | "spacing";
    width?: number;
    grid?: number;
    height?: number;
    beforeUp?: () => Promise<void>;
  }): Promise<void> {
    const pointerPosition = this.getResizePointerLayout(pointer);
    await element.click({ position: { x: 5, y: 5 } });
    await pointerPosition.scrollIntoViewIfNeeded();
    const startBox = await pointerPosition.boundingBox();
    let startX = startBox.x + startBox.width / 2;
    const startY = startBox.y + startBox.height / 2;
    await pointerPosition.hover();
    await this.page.mouse.down();

    //Resize cho spacing
    if (typeof width !== "undefined") {
      let currentWidth = await element
        .locator(this.columnSpacing)
        .first()
        .evaluate(ele => ele.clientWidth);
      while (currentWidth !== width) {
        startX = currentWidth < width ? startX + 2 : startX - 2;
        await this.page.mouse.move(startX, startY);
        currentWidth = await element
          .locator(this.columnSpacing)
          .first()
          .evaluate(ele => ele.clientWidth);
      }
    }

    //Resize cho column
    //NOTE: column width khi resize sẽ tính bằng grid chứ ko tính = Px (max width column = 12 grid)
    if (grid) {
      const oneGridPx = await this.selectedTemplate.evaluate(ele => {
        const spacing = getComputedStyle(ele).getPropertyValue("--gutter").replace("px", "");
        const parentWidth = ele.parentElement.clientWidth;
        return (parentWidth - parseInt(spacing)) / 12;
      });
      let columnStyle = await this.selectedTemplate.getAttribute("style");
      let match = columnStyle.match(/--width: calc\((\d+)|--width: (\d+%)/);
      let currentGrid = parseFloat(match[1]) || parseFloat(match[2]);
      currentGrid = currentGrid === 100 ? 12 : currentGrid;
      let retries = 0;
      while (Math.round(currentGrid) !== grid) {
        if (retries > 5) {
          break;
        }
        const distance = oneGridPx * (currentGrid - grid);
        const finalX = pointer === "left" ? startX + distance : startX - distance;
        await this.page.mouse.move(finalX, startY);
        columnStyle = await this.selectedTemplate.getAttribute("style");
        match = columnStyle.match(/--width: calc\((\d+|\d+%)/);
        currentGrid = parseFloat(match[1]) || parseFloat(match[2]);
        retries += 1;
      }
    }

    //Resize cho Section, row
    if (typeof height !== "undefined") {
      let currentHeight = await element.evaluate(ele => ele.clientHeight);
      while (currentHeight !== height) {
        const distance = height - currentHeight;
        await this.page.mouse.move(startX, startY + distance);
        currentHeight = await element.evaluate(ele => ele.clientHeight);
      }
    }

    if (typeof beforeUp === "function") {
      await beforeUp();
    }

    await this.page.mouse.up();
    await this.frameLocator.locator(this.quickBarLoc).waitFor();
  }

  /**
   * Get resizer locator của element đang đc select
   * @param type
   * @param position
   * @returns
   */
  getPaddingMarginResizer(type: "padding" | "margin", position: "left" | "right" | "top" | "bottom"): Locator {
    const ele =
      type === "padding"
        ? this.selectedTemplate.locator(`.is-${position}:not(.is-outside)`)
        : this.selectedTemplate.locator(`.is-${position}.is-outside`);
    return ele;
  }

  /**
   * Hàm hover vào padding/margin resizer ở webfront
   * @param type
   * @param position
   * @returns
   */
  async hoverPaddingMarginResizer(
    type: "padding" | "margin",
    position: "left" | "right" | "top" | "bottom",
  ): Promise<{ resizer: Locator; tooltip: string }> {
    const resizer = this.getPaddingMarginResizer(type, position);
    const resizerBox = await resizer.boundingBox();
    const startX = resizerBox.x + (resizerBox.width * 3) / 4;
    const startY = resizerBox.y + resizerBox.height / 4;
    await this.page.mouse.move(startX, startY);
    const currentValue = await resizer.locator(this.paddingMarginResizeTooltip).innerText();
    return {
      resizer,
      tooltip: currentValue,
    };
  }

  /**
   * Hàm edit padding margin bằng chuột ở webfront
   * @param element: là section, row, column cần edit
   * @param type
   * @param position
   * @param value: giá trị expected padding/margin (px) sau khi edit
   */
  async editPaddingMarginByMouseGesture({
    element,
    type,
    position,
    value,
  }: {
    element: Locator;
    type: "padding" | "margin";
    position: "left" | "right" | "top" | "bottom";
    value: number;
  }): Promise<void> {
    const resizer = this.getPaddingMarginResizer(type, position);
    const resizeTooltip = resizer.locator(this.paddingMarginResizeTooltip);
    await element.click({ position: { x: 5, y: 5 } });
    const resizeBox = await resizer.boundingBox();
    let currentValue = parseInt((await resizeTooltip.innerText()).replace("px", ""));
    const startX = resizeBox.x + (resizeBox.width * 3) / 4;
    const startY = resizeBox.y + resizeBox.height / 4;
    const distance = value - currentValue;
    const modifiedX = position === "left" ? startX + distance : startX - distance;
    const finalX = position === "top" || position === "bottom" ? startX : modifiedX;
    const finalY = position === "top" || position === "bottom" ? startY + distance : startY;
    await this.page.mouse.move(startX, startY, { steps: 2 });
    await this.page.mouse.down();
    while (currentValue !== value) {
      await this.page.mouse.move(finalX, finalY, { steps: 5 });
      currentValue = parseInt((await resizeTooltip.innerText()).replace("px", ""));
    }
    await this.page.mouse.up();
    await resizeTooltip.filter({ hasText: `${value}px` }).waitFor();
  }

  /**
   * Gen loc các nút trên quick bar settings
   * @param button
   * @returns
   */
  quickBarButton(button: QuickBarOptions): Locator {
    let btn: Locator;
    switch (button) {
      case "Delete":
      case "Bring forward":
      case "Bring backward":
      case "Move up":
      case "Move down":
      case "Move left":
      case "Move right":
      case "Hide":
      case "Duplicate":
      case "Save as template":
      case "Replace library":
      case "Add column":
        btn = this.frameLocator.getByRole("button").filter({ hasText: button });
        break;
      default:
        btn = this.frameLocator.getByRole("listitem").filter({ hasText: button });
        break;
    }
    return btn;
  }

  xpathDragDropInSetting(index = 1): string {
    return `(//div[@class='sb-tooltip__reference']//span[contains(@class,'w-builder__widget--list-drag')]//*[name()='svg']//*[name()='g'])[${index}]`;
  }

  /**
   * Select option on quick bar in preview
   * @param option
   */
  async selectOptionOnQuickBar(option: QuickBarOptions) {
    const popoverVisible = await this.frameLocator
      .locator(this.quickBarLoc)
      .locator(this.layoutPresetPopover)
      .isVisible();
    await this.frameLocator.locator(this.quickBarLoc).waitFor();
    const selectorOption = this.quickBarButton(option);
    await selectorOption.hover();
    if (option === "Add row" && popoverVisible) {
      return;
    } else {
      await selectorOption.click();
    }
    if (option === "Edit text") {
      await this.frameLocator.locator("[contenteditable=true]").waitFor();
      // Dừng trước khi step sau thực hiện action press
      await this.waitAbit(200);
    }
    if (option === "Add row" || option === "Add column") {
      const addedLayoutId = this.titleBar.getByRole("paragraph").getAttribute("data-id");
      return addedLayoutId;
    }
  }

  /**
   * Input text block in preview
   * @param position
   * @param text
   */
  async settingTextEditor(position: ElementPosition, text: string) {
    const blockSelector = this.getSelectorByIndex(position);
    await this.frameLocator.locator(blockSelector).click();
    await this.selectOptionOnQuickBar("Edit text");
    await this.frameLocator.locator(blockSelector).dblclick();
    await this.frameLocator.locator(blockSelector).click();
    await this.frameLocator.locator(blockSelector).type(text);
  }

  /**
   * Input text into text editor by penta click
   * @param selector
   * @param text
   */
  async inputTextEditor(selector: string, text: string) {
    await this.frameLocator.locator(selector).dblclick();
    await this.frameLocator.locator(selector).dblclick();
    await this.frameLocator.locator("//*[contains(@class,'quick-settings--text')]").waitFor();
    await this.frameLocator.locator("[contenteditable=true]").waitFor();
    await this.page.keyboard.press("Control+A");
    await this.page.keyboard.press("Backspace");
    await this.frameLocator.locator(selector).type(text);
  }

  /**
   * Input text in bullet or Toggle list
   * @param data
   */
  async inputTextBulletToggleList(data: TextAccordion) {
    const parentSelector = this.getSelectorByIndex(data.position);

    if (data.title) {
      for (const item of data.title) {
        const selector = `(${parentSelector}//div[@data-text-editor-child-id='title'])[${item.index}]`;
        await this.inputTextEditor(selector, item.text);
        await this.frameLocator.locator(parentSelector).click();
      }
    }
    if (data.paragraph) {
      for (const item of data.paragraph) {
        const selector = `(${parentSelector}//div[@data-text-editor-child-id='paragraph'])[${item.index}]`;
        const disableSelector = `(${parentSelector}//div[@data-text-editor-child-id='paragraph' and contains(@style,'display: none')])[${item.index}]`;
        const isDisable = await this.frameLocator.locator(disableSelector).count();
        if (isDisable) {
          await this.frameLocator
            .locator(`(${parentSelector}//span[contains(@class,'material-icons')])[${item.index}]`)
            .click();
        }
        await this.inputTextEditor(selector, item.text);
        await this.frameLocator.locator(parentSelector).click();
      }
    }
  }

  /**
   * Thêm block/section vào vị trí auto bằng cách click vào button Add block/Add section
   * @param data
   * @return data-id cuả block được add vào để tiện cho việc tương tác trên web front
   * if (data.parentPosition.block), add block template to auto point. else, add section template to auto point
   * if data.position is "undefine" or "Top", add element to 1st auto point. else, add element to 2nd auto point
   */
  async insertSectionBlock({
    parentPosition,
    position = "Top",
    template,
    category,
    templateIndex = 1,
  }: InsertTemplate) {
    let autoPointIndex: number;
    let templateType = "-section";
    if (parentPosition.block || parentPosition.column) {
      templateType = "block";
    }
    if (typeof position === "string") {
      autoPointIndex = position === "Bottom" ? 2 : 1;
    } else {
      autoPointIndex = position;
    }
    const parentSelector = this.getSelectorByIndex(parentPosition);
    const autoPoint = `(${parentSelector}//div[contains(@class,'indicator-${templateType}')])[${autoPointIndex}]`;
    const categorySelector = `//p[contains(@class,'insert-category-name') and normalize-space()='${category}']`;
    const templateSelector = `(//div[div[normalize-space()='${template}']][contains(@class,'insert-template-wrapper') or contains(@class,'insert-basic-preview')]/child::div[contains(@class,'insert-template-preview')  or contains(@class,'card')])[${templateIndex}]`;
    await this.frameLocator.locator(parentSelector).scrollIntoViewIfNeeded();
    const parentBox = await this.frameLocator.locator(parentSelector).boundingBox();
    if (templateType === "block") {
      await this.page.mouse.move(parentBox.x + parentBox.width / 2, parentBox.y + parentBox.height / 2);
    } else {
      while (await this.frameLocator.locator(autoPoint).isHidden()) {
        await this.frameLocator.locator(parentSelector).click({ position: { x: 5, y: 5 } });
        await this.frameLocator.locator(autoPoint).waitFor();
      }
    }
    await this.frameLocator.locator(parentSelector).hover();
    await this.frameLocator.locator(autoPoint).hover();
    await this.frameLocator.locator(autoPoint).click({ delay: 300 });
    if (category) {
      await this.genLoc(categorySelector).click();
    }
    if (await this.genLoc(templateSelector).isHidden()) {
      await scrollUntilElementIsVisible({
        page: this.page,
        viewEle: this.genLoc(templateSelector),
        scrollEle: this.templateContainer,
      });
      await waitForImageLoaded(this.page, `${this.templatePreview}:text-is('${template}')`);
    }
    await this.genLoc(templateSelector).click({ delay: 1000 });
    /**
     * Chia làm 2 loại toast 1 ở header footer khi kéo block vào có toast thông báo
     * 2 là các loại toast thông báo không add đc block theo rules
     */
    const [headerFooterToast, errorToast] = await Promise.all([
      this.toastMessage.filter({ hasText: /header|footer/ }).isVisible(),
      this.toastMessage.filter({ hasText: /can not add|can't add|Only some certain blocks/ }).isVisible(),
    ]);
    checkToast: if (headerFooterToast) {
      break checkToast;
    } else if (errorToast) {
      return;
    }

    await this.selectedTemplate.waitFor();
    const addedTemplateId = await this.templateTitle.filter({ hasText: template }).getAttribute("data-id");
    return addedTemplateId;
  }

  /**
   * Select breadcrumb trong parent list cuar block, column, row
   * @param selector là selector con của breadcrumb cần select VD: column -> select từ block
   * @param name tên parent breadcrumb muốn click
   */
  async selectParentBreadcrumb(selector: ElementPosition, name: string, index = 1): Promise<void> {
    let target = this.frameLocator.locator(this.getSelectorByIndex(selector));
    const parentBreadcrumb = this.breadCrumb.locator("[class$=element-name__item]", { hasText: name }).nth(index - 1);
    if (selector.tabs) {
      if (selector.tabs.name) {
        await target.getByRole("button", { name: selector.tabs.name }).click();
      }
      target = this.getLocInTabsAccordion(target, selector.tabs);
    }
    await target.hover({ position: { x: 5, y: 5 } });
    await this.breadCrumb.locator(".element-name__nav").click();
    await parentBreadcrumb.click();
    await this.titleBar.hover();
  }

  /**
   * Hàm click add block trong tabs accordion
   * @param inColumn
   */
  async clickAddBlockInTabsAccordion(
    block: string | Locator,
    { level, row, column }: TabsAccordionStructure,
  ): Promise<void> {
    const element = typeof block === "string" ? this.frameLocator.locator(block) : block;
    const col = element.locator(`:nth-match(.row[data-nested-level="${level}"], ${row})>.column`).nth(column - 1);
    await col.hover();
    await col.locator(".insert-block-indicator").click();
    await this.templateContainer.waitFor();
  }

  /**
   * Hàm select layout column
   * @param layout là value của attribute href trong thẻ use (ko lấy #)
   * (Tìm selector: [class$=column__icon] use[href])
   */
  async selectColumnLayout(layout: string, fromQuickbar?: boolean): Promise<void> {
    const preset = layout.includes("-") ? layout : layoutSvg[layout];
    const layoutPopover = this.frameLocator.locator(
      fromQuickbar ? this.layoutColumnQuickBar : this.layoutColumnPopover,
    );
    const layoutBtn = layoutPopover.locator(this.columnIcon).filter({ has: this.page.locator(`[href="#${preset}"]`) });
    await layoutBtn.click();
  }

  /**
   * Add row trên preview
   * @param layout: có thể truyền tên theo insert panel hoặc tên của attribute href tại thẻ use
   */
  async addRow({
    parentPosition,
    position = "Top",
    layout = "Single column",
    quickbar,
  }: InsertTemplate): Promise<void> {
    const selectRow = Object.assign(parentPosition, { column: 1 });
    const section = this.frameLocator.locator(this.getSelectorByIndex({ section: parentPosition.section }));
    await section.scrollIntoViewIfNeeded();
    const btnPosition = position === "Bottom" ? this.afterAddIndicatorRow : this.beforeAddIndicatorRow;
    const addRowBtn = this.selectedTemplate.locator(btnPosition);
    if ((await addRowBtn.isHidden()) || (await this.quickBarButton("Add row").isHidden())) {
      await this.selectParentBreadcrumb(selectRow, "Row");
    }
    if (!quickbar) {
      await addRowBtn.click();
    } else {
      await this.selectOptionOnQuickBar("Add row");
    }
    await this.selectColumnLayout(layout, quickbar);
  }

  /**
   * Add section trên preview khi section ở trạng thái selected
   * @param param0
   */
  async addSection({
    parentPosition,
    position = "Top",
    template,
    category,
    templateIndex = 1,
  }: InsertTemplate): Promise<void> {
    const section = parentPosition.section;
    const categorySelector = `//p[contains(@class,'insert-category-name') and normalize-space()='${category}']`;
    const addSectionBtnTop = this.frameLocator.locator(
      `//section[contains(@class,'section')][${section}]//div[contains(@class,'absolute before')]`,
    );
    const addSectionBtnBot = this.frameLocator.locator(
      `//section[contains(@class,'section')][${section}]//div[contains(@class,'absolute after')]`,
    );

    if (position === "Top") {
      await addSectionBtnTop.click();
    } else {
      await addSectionBtnBot.click();
    }
    await this.genLoc(categorySelector).click();
    await this.searchbarTemplate.fill(template);
    const templateSelector = `(//div[div[normalize-space()='${template}']][contains(@class,'insert-template-wrapper') or contains(@class,'insert-basic-preview')]/child::div[contains(@class,'insert-template-preview')  or contains(@class,'card')])[${templateIndex}]`;
    await this.genLoc(templateSelector).click();
  }

  /**
   * Hàm add column click btn (+) ở webfront
   * @param position: vị trí button
   */
  async addColumn({ element, position }: { element: Locator; position: "left" | "right" }): Promise<string> {
    await element.click({ position: { x: 5, y: 5 } });
    const addBtn =
      position === "left"
        ? this.selectedTemplate.locator(this.beforeAddIndicator)
        : this.selectedTemplate.locator(this.afterAddIndicator);
    await addBtn.click();
    const newColumnId = await this.templateTitle.filter({ hasText: "Column" }).getAttribute("data-id");
    return newColumnId;
  }

  /**
   * Edit spacing column
   * @param label
   * @param value
   * @param max
   */
  async editSpacing(label: string, value: number, max = 32) {
    const slider = this.genLoc(this.getSelectorByLabel(label)).locator(".sb-slider__runway");
    const sliderBtn = slider.locator(".sb-slider__button");
    const sliderBox = await slider.boundingBox();
    const spacingToWidthPercent = value / max;
    const position = {
      x: sliderBox.x + sliderBox.width * spacingToWidthPercent,
      y: sliderBox.y + sliderBox.height / 2,
    };
    await sliderBtn.hover();
    await this.page.mouse.down();
    await this.page.mouse.move(position.x, position.y, { steps: 2 });
    await this.page.mouse.up();
    await slider.locator(`.sb-slider__button[style*='${spacingToWidthPercent * 100}']`).waitFor();
    await this.selectedTemplate.locator(`.column[style*='gutter: ${value}px']`).first().waitFor();
  }

  /**
   * @deprecated: using new function dragAndDropInWebBuilder
   * Insert section/block from insert panel to preview by DnD
   * @param category
   * @param template
   * @param to
   * @param callBack
   * @param index
   */
  async dndTemplateFromInsertPanel({ category, template, to, callBack, index = 1 }: DnDTemplateFromPanel) {
    const templateSelector = `(//div[div[normalize-space()='${template}']][contains(@class,'insert-template-wrapper') or contains(@class,'insert-basic-preview')]/child::div[contains(@class,'insert-template-preview')  or contains(@class,'card')])[${index}]`;
    const toSelector = this.getSelectorByIndex(to.position);

    // Open insert panel and select category
    await this.genLoc(
      "//div[contains(@class,'w-builder__header')]//button[descendant::*[local-name()='g' and @id='Icons/Navigation/Plus-(line)']]",
    ).click();
    if (category) {
      await this.genLoc(
        `//div[@class='w-builder__insert-categories']//div[contains(@class,'items') and descendant::p[normalize-space()='${category}']]`,
      ).click();
    }
    // DnD section/block into preview
    const coordinatesTo = { x: 0, y: 0 };
    const fromLocator = this.page.locator(templateSelector);
    const toLocator = this.page.frameLocator(this.iframe).locator(toSelector);
    const iframe = await this.page.locator(this.iframe).boundingBox();
    let x = iframe.x;
    let y = iframe.y + iframe.height;

    await toLocator.scrollIntoViewIfNeeded();
    const toBox = await toLocator.boundingBox();
    coordinatesTo.x = typeof to.left !== "undefined" ? toBox.x + to.left : toBox.x + toBox.width / 2;
    coordinatesTo.y = typeof to.top !== "undefined" ? toBox.y + to.top : toBox.y + (toBox.height * 3) / 4;

    await this.searchbarTemplate.fill(template);
    await fromLocator.hover();
    await this.page.mouse.down();
    while (x < iframe.width / 2) {
      await this.page.mouse.move(x, y);
      x += 100;
    }
    // Nếu tạo độ x của điểm muốn thả nằm trong width của insert panel
    // thì cần kéo template ra giữa màn hình trước để đóng insert panel
    if (coordinatesTo.x > iframe.width / 2) {
      while (x + 100 < coordinatesTo.x) {
        await this.page.mouse.move(x, y);
        x += 100;
      }
    } else {
      while (x > coordinatesTo.x) {
        await this.page.mouse.move(x, y);
        x -= 100;
      }
    }
    while (y > coordinatesTo.y) {
      await this.page.mouse.move(x, y);
      y -= 100;
    }
    await this.page.mouse.move(coordinatesTo.x, coordinatesTo.y);
    if (typeof callBack === "function") {
      await callBack({ page: this.page, x: coordinatesTo.x, y: coordinatesTo.y });
    }
    await this.page.mouse.up();
  }

  /**
   * dnd block in preview
   * @param from
   * @param to
   * @param isHover
   * @param callBack
   */
  async dndTemplateInPreview({
    from,
    to,
    isHover = true,
    callBack = async () => {
      return null;
    },
  }: DnDTemplateInPreview) {
    const fromSelector = this.getSelectorByIndex(from.position);
    const toSelector = this.getSelectorByIndex(to.position);
    await this.dragAndDrop({
      from: {
        iframe: this.iframe,
        selector: fromSelector,
        top: 1,
        left: 1,
      },
      to: {
        iframe: this.iframe,
        selector: toSelector,
        top: to.top,
        left: to.left,
      },
      isHover: isHover,
      callBack,
    });
  }

  /**
   * Hàm scroll into view hỗ trợ drag and drop
   * @param locator
   * @param position
   */
  async scrollIntoViewInWebBuilder(locator: string | Locator, isBottom?: boolean): Promise<void> {
    const element = typeof locator === "string" ? this.frameLocator.locator(locator) : locator;
    await element.evaluate((ele, isBottom) => {
      let scrollBlock: ScrollLogicalPosition;
      const eleHeight = ele.getBoundingClientRect().height;
      /**
       * Viewport của wb = Viewport height - navigation bar (47.2)
       * Các block có height < 75% height của wb viewport thì sẽ đc scroll giữa màn (center)
       * Các block còn lại sẽ đc scroll đầu (start), cuối (end) tuỳ vào vị trí muốn thả block (isBottom)
       * Lấy đk 75% vì nếu block <= wb viewport mà scroll center thì sẽ khó thực hiện drag and drop
       */
      if (eleHeight < (window.screen.height - 47.2) * 0.75) {
        scrollBlock = "center";
      } else {
        scrollBlock = isBottom ? "end" : "start";
      }
      ele.scrollIntoView({ behavior: "instant", block: scrollBlock });
    }, isBottom);
  }

  /**
   * new function to dnd template from insert panel to preview
   * @param category
   * @param template
   * @param indexTemplate
   * @param position
   * @param isBottom
   * @param layout layout của column hoặc container container mà block đc kéo đến
   * @param callBack
   */
  async dragAndDropInWebBuilder({
    from: { category, template, indexTemplate = 1 },
    to: { position, isBottom = true, layout = "vertical", container, tabs, repeated },
    callBack,
  }: NewDnDTemplateFromPanel) {
    const coordinatesTo = { x: 0, y: 0 };
    const templateSelector = this.getTemplatePreviewByName(template, indexTemplate);
    const blockPlaceholder = this.frameLocator.locator("[class*=drop-placeholder]");
    let toSelector = position.section !== 0 ? this.getSelectorByIndex(position) : "#wb-main";
    /**
     * Case drag and drop vào trong block repeated sẽ check lại toSelector
     */
    if (repeated) {
      toSelector = !repeated.block
        ? `${toSelector}//div[@repeated-item-index='${repeated.item}']`
        : `${toSelector}//div[@repeated-item-index='${repeated.item}']//*[@data-block-component][${repeated.block}]`;
    }
    /**
     * Case drag and drop vào trong block tabs sẽ check lại toSelector
     */
    if (tabs) {
      toSelector = !tabs.block
        ? `((${toSelector}//*[contains(@class,'row') and @data-nested-level="${tabs.level}"])[${tabs.row}]/*[contains(@class, "column")])[${tabs.column}]`
        : `(((${toSelector}//*[contains(@class,'row') and @data-nested-level="${tabs.level}"])[${tabs.row}]/*[contains(@class, "column")])[${tabs.column}]//*[@data-block-component])[${tabs.block}]`;
    }
    await this.scrollIntoViewInWebBuilder(toSelector, isBottom);
    // Tính vị trí, width height của element muốn drop
    const iframeBox = await this.page.locator(this.iframe).boundingBox();
    const toBox = await this.frameLocator.locator(toSelector).boundingBox();
    /**
     * Check vị trí muốn thả:
     * Nếu ở dưới target block (isBottom = true) -> kéo đến vị trí = 90% target block height
     * Tương tự nếu ở trên -> kéo đến vị trí = 10% target block height
     */
    if (layout === "vertical") {
      coordinatesTo.x = toBox.x + toBox.width / 2;
      coordinatesTo.y = isBottom ? toBox.y + toBox.height * 0.9 : toBox.y + toBox.height * 0.1;
    } else {
      coordinatesTo.x = isBottom ? toBox.x + toBox.width * 0.9 : toBox.x + toBox.width * 0.1;
      coordinatesTo.y = toBox.y + toBox.height / 2;
    }
    /**
     * Phần này sẽ check placeholder mong muốn để khi thả đúng vào vị trí
     */
    // Placeholder case kéo tới trước/sau, trên dưới 1 section hoặc block
    let expectedPlaceHolder = isBottom
      ? this.frameLocator.locator(
          `${toSelector}/following-sibling::div[contains(@class,'drop-zone') or contains(@class,'drop-placeholder')]`,
        )
      : this.frameLocator.locator(
          `${toSelector}/preceding-sibling::div[contains(@class,'drop-zone') or contains(@class,'drop-placeholder')]`,
        );
    // Placeholder case kéo tới webbuilder rỗng ko có section nào
    expectedPlaceHolder = position.section === 0 ? this.addSectionPlaceHolder : expectedPlaceHolder;
    // Placeholder case kéo tới column rỗng chưa có block nào
    expectedPlaceHolder =
      (position.column && !position.block) || container
        ? this.frameLocator.locator(toSelector).locator("[class*=drop-placeholder]")
        : expectedPlaceHolder;
    // Case đặc biệt với block tabs
    if (tabs) {
      expectedPlaceHolder =
        tabs.column && !tabs.block
          ? this.frameLocator.locator(toSelector).locator("[class*=drop-placeholder]")
          : expectedPlaceHolder;
    }
    let insertPanelState = await this.genLoc(XpathNavigationButtons["insert"]).getAttribute("class");
    // Dùng while vì thỉnh thoảng click button insert panel ko ăn -> fail
    while (!insertPanelState.includes("is-active")) {
      await this.clickBtnNavigationBar("insert");
      insertPanelState = await this.genLoc(XpathNavigationButtons["insert"]).getAttribute("class");
      await this.genLoc(this.templatePreview).first().waitFor();
    }

    // Select category mong muốn
    if (category) {
      await this.getCategoryByName(category).click();
    }
    // Nếu template nằm trong phần lazy load -> scroll xuống để template hiển thị
    if (await templateSelector.isHidden()) {
      await scrollUntilElementIsVisible({
        page: this.page,
        scrollEle: this.insertPreview,
        viewEle: templateSelector,
      });
    }
    await waitForImageLoaded(this.page, `${this.templatePreview}:text-is('${template}')`);
    await templateSelector.hover();
    await this.page.mouse.down();
    await this.page.mouse.move(iframeBox.x, iframeBox.y, { steps: 2 });
    //Move đến giữa web builder để đóng insert panel
    await this.page.mouse.move(iframeBox.x + iframeBox.width / 2, iframeBox.y + iframeBox.height / 2, { steps: 2 });
    //Move tới vị trí giữa section, column, block truyền vào
    await this.page.mouse.move(coordinatesTo.x, toBox.y + toBox.height / 2, { steps: 2 });
    // Move tới vị trí cuối cùng dựa vào params isBottom
    await this.page.mouse.move(coordinatesTo.x, coordinatesTo.y, { steps: 2 });
    // Check nếu placeholder chưa xuất hiện thì tiếp tục move đến theo đúng hướng (dựa vào isBottom)
    let retries = 0;
    while (await expectedPlaceHolder.isHidden()) {
      if (retries > 30) {
        break;
      }
      await this.scrollIntoViewInWebBuilder(toSelector, isBottom);
      /**
       * Khi scroll có thể làm sai lệch toạ độ đã tính -> move từ từ (5px) đến khi hiển thị placeholder cần thả
       * Không tính lại bounding box vì dính case placeholder height lớn chỉ hiển thị 1 phần ở viewport
       */
      if (layout === "vertical") {
        await this.page.mouse.move(coordinatesTo.x, coordinatesTo.y, { steps: 2 });
        coordinatesTo.y = isBottom ? coordinatesTo.y + 5 : coordinatesTo.y - 5;
      } else {
        await this.page.mouse.move(coordinatesTo.x, coordinatesTo.y, { steps: 2 });
        coordinatesTo.x = isBottom ? coordinatesTo.x + 5 : coordinatesTo.x - 5;
      }
      retries += 1;
    }
    //Case auto kéo chính giữa hiển thị 2 placeholder (chỉ xảy ra khi kéo block)
    if (position.column || position.block) {
      const placeholderCount = await blockPlaceholder.count();
      if (placeholderCount > 1) {
        if (layout === "vertical") {
          coordinatesTo.y = isBottom ? coordinatesTo.y + 2 : coordinatesTo.y - 2;
        } else {
          coordinatesTo.x = isBottom ? coordinatesTo.x + 2 : coordinatesTo.x - 2;
        }
        await this.page.mouse.move(coordinatesTo.x, coordinatesTo.y, { steps: 2 });
      }
    }

    if (typeof callBack === "function") {
      await callBack({ page: this.page, x: coordinatesTo.x, y: coordinatesTo.y });
    }

    // need time stable before mouse up
    await this.waitAbit(500);
    await this.page.mouse.up();
    /**
     * Chia làm 2 loại toast 1 ở header footer khi kéo block vào có toast thông báo
     * 2 là các loại toast thông báo không add đc block theo rules
     */
    const [headerFooterToast, errorToast] = await Promise.all([
      this.toastMessage.filter({ hasText: /header|footer/ }).isVisible(),
      this.toastMessage.filter({ hasText: /can not add|can't add|Only some certain blocks/ }).isVisible(),
    ]);
    checkToast: if (headerFooterToast) {
      break checkToast;
    } else if (errorToast) {
      return;
    }

    // Chờ block, section được kéo thành công sẽ return ID
    await this.selectedTemplate.waitFor();
    const addedTemplateId = await this.templateTitle.filter({ hasText: template }).getAttribute("data-id");
    return addedTemplateId;
  }

  getLayerStatusInWebFrontPreview(data: ElementPosition) {
    const layerSelector = this.getSelectorByIndex(data);
    if (data.row || data.column || data.block) {
      return `${layerSelector}/parent::div`;
    } else {
      return layerSelector;
    }
  }

  /**
   * Hàm bôi đen text trong block Heading, paragraph....
   * @param block: block ở preview
   * @param text: sub string cần bôi đen
   * @param index: dùng với case bôi đen 1 chữ cái
   * NOTE: Debug bằng vscode có thể sai vì mất focus block về lại trạng thái quickbar Edit text khi click next step.
   * Chạy test bằng terminal thêm đuôi --debug sẽ chuẩn hơn ko bị mất focus
   */
  async blackedTextInBlock({ block, text, index }: TextBlock) {
    const blockLoc = this.frameLocator.locator(block);
    const fullText = await blockLoc.innerText();
    const startIndex = fullText.indexOf(text);
    await blockLoc.click();
    await this.selectOptionOnQuickBar("Edit text");
    await this.frameLocator.locator("[contenteditable]").waitFor();
    if (text) {
      for (let i = 0; i < startIndex; i++) {
        await this.page.keyboard.press("ArrowRight", { delay: 100 });
      }
      for (let i = 0; i < text.length; i++) {
        await this.page.keyboard.press("Shift+ArrowRight");
      }
    }
    if (index) {
      for (let i = 0; i < index; i++) {
        await this.page.keyboard.press("ArrowRight", { delay: 100 });
      }
      await this.page.keyboard.press("Shift+ArrowRight");
    }
  }

  /**
   * Get text đang được highlight
   * @param block: locator cần edit
   * @param index: vị trí cần di chuyển theo index
   */
  async getHighlightedText(selector: Locator, fullText: string): Promise<string> {
    const highlightedText = await selector.evaluate((ele, str: string) => {
      const selection = document.getSelection().getRangeAt(0);
      const startIndex = selection.startOffset;
      const endIndex = selection.endOffset;
      const text = str.substring(startIndex, endIndex);
      return text;
    }, fullText);
    return highlightedText;
  }

  /**
   * Hàm insert variable trên quickbar settings cho block text
   * @param type
   * @param option
   */
  async insertVariable(type: "Shop" | "Product", option: string) {
    await this.selectOptionOnQuickBar("Insert variable");
    await this.frameLocator.locator(`div[role=list] div:text-is('${type}')`).click();
    await this.frameLocator.locator(`div[class*=options--item]:text-is('${option}')`).click();
  }

  /**
   * Hàm click để bôi đen chính xác ở chữ cái mong muốn
   * @param selector : contenteditable element
   * @param index : vị trí của chữ cái cần click trong text
   */
  async clickToBlackedText({ selector, index, triple }: BlackedText) {
    const blockSelector = this.frameLocator.locator(selector);
    await blockSelector.click();
    await this.selectOptionOnQuickBar("Edit text");
    await this.frameLocator.locator("[contenteditable]").waitFor();
    for (let i = 0; i < index; i++) {
      await this.page.keyboard.press("ArrowRight", { delay: 50 });
    }
    const rect = await blockSelector.evaluate(() => {
      const wbRect = window.parent.document.querySelector("#preview").getBoundingClientRect();
      const range = document.getSelection().getRangeAt(0).cloneRange();
      const eleRect = range.getClientRects()[0];
      return { x: wbRect.x + eleRect.x + eleRect.width, y: wbRect.y + eleRect.y };
    });
    await this.page.mouse.move(rect.x, rect.y);
    if (triple) {
      await this.page.mouse.click(rect.x, rect.y, { clickCount: 3 });
    } else {
      await this.page.mouse.dblclick(rect.x, rect.y);
    }
  }

  /**
   * Hàm get align trong text editor quickbar
   * @param align
   * @returns
   */
  getAlignOption(align: "left" | "center" | "right"): Locator {
    const alignIndex = {
      left: 1,
      center: 2,
      right: 3,
    };
    return this.frameLocator.locator(`:nth-match(button[class*=dropdown-item]:has(svg), ${alignIndex[align]})`);
  }

  getQuickSettingsTextBtn(
    btnName:
      | "color"
      | "font"
      | "bold"
      | "italic"
      | "underline"
      | "strike"
      | "align"
      | "hyperlink"
      | "bullet"
      | "number"
      | "tag"
      | "variable",
    tabs?: boolean,
  ): Locator {
    const GroupIndex = {
      color: 0,
      font: 1,
      bold: 2,
      italic: 2,
      underline: 2,
      strike: 2,
      align: 2,
      hyperlink: 2,
      bullet: 3,
      number: 3,
      tag: 4,
      variable: 5,
    };
    const btnIndex = {
      color: 0,
      font: 0,
      bold: 0,
      italic: 1,
      underline: 2,
      strike: 3,
      align: 4,
      hyperlink: 5,
      bullet: 0,
      number: 1,
      tag: 0,
      variable: 0,
    };
    GroupIndex["font"] = tabs ? 0 : GroupIndex["font"];
    GroupIndex["bold"] = tabs ? 1 : GroupIndex["bold"];
    GroupIndex["italic"] = tabs ? 1 : GroupIndex["italic"];
    GroupIndex["variable"] = tabs ? 2 : GroupIndex["variable"];
    const button = this.quickSettingsText
      .getByRole("listitem")
      .nth(GroupIndex[btnName])
      .getByRole("button")
      .nth(btnIndex[btnName]);
    return button;
  }

  /**
   * HÀm edit quick settings text
   * NOTE: chưa edit được gradient color do ko thấy element trên DOM
   * @param data
   */
  async editQuickSettingsText(data: QuickSettingsText) {
    const isTab = typeof data.tabs === "undefined" ? false : data.tabs;
    await this.frameLocator.locator("[contenteditable=true]").waitFor();
    if (data.color) {
      await this.getQuickSettingsTextBtn("color", isTab).click();
      await this.frameLocator.locator(`:nth-match(button[class*=item--color], ${data.color.preset})`).click();
    }
    if (data.font_style) {
      // Nhanh quá làm click vào button ở dropdown mất quick setting
      await this.waitAbit(200);
      await this.getQuickSettingsTextBtn("font", isTab).click();
      await this.frameLocator.locator("[data-dropdown-show='true']").waitFor();
      await this.frameLocator
        .getByRole("listitem")
        .locator("[data-dropdown-action=textClass]")
        .getByRole("button", { name: data.font_style })
        .first()
        .click({ delay: 300 });
    }
    if (data.bold) {
      const btnStatus = await this.getQuickSettingsTextBtn("bold", isTab).getAttribute("class");
      if (btnStatus.includes("active") !== data.bold) {
        await this.getQuickSettingsTextBtn("bold", isTab).click();
      }
    }
    if (data.italic) {
      const btnStatus = await this.getQuickSettingsTextBtn("italic", isTab).getAttribute("class");
      if (btnStatus.includes("active") !== data.italic) {
        await this.getQuickSettingsTextBtn("italic", isTab).click();
      }
    }
    if (data.underline) {
      const btnStatus = await this.getQuickSettingsTextBtn("underline").getAttribute("class");
      if (btnStatus.includes("active") !== data.underline) {
        await this.getQuickSettingsTextBtn("underline", isTab).click();
      }
    }
    if (data.strike) {
      const btnStatus = await this.getQuickSettingsTextBtn("strike").getAttribute("class");
      if (btnStatus.includes("active") !== data.strike) {
        await this.getQuickSettingsTextBtn("strike").click();
      }
    }
    if (data.align) {
      const btnStatus = await this.getAlignOption(data.align).getAttribute("class");
      if (!btnStatus.includes("active")) {
        await this.getQuickSettingsTextBtn("align").click();
        await this.getAlignOption(data.align).click();
      }
    }
    if (data.hyperlink) {
      const startIndex = data.hyperlink.full_text.indexOf(data.hyperlink.text);
      for (let i = 0; i < startIndex; i++) {
        await this.page.keyboard.press("ArrowRight");
      }
      for (let i = 0; i < data.hyperlink.text.length; i++) {
        await this.page.keyboard.press("Shift+ArrowRight");
      }
      await this.getQuickSettingsTextBtn("hyperlink").click();
      if (data.hyperlink.remove) {
        await this.frameLocator.locator("[class*=quick-settings-link__value] input").first().click();
        await this.page.keyboard.press("Control+A");
        await this.page.keyboard.press("Backspace");
        await this.applyHyperlinkBtn.click();
      } else {
        await this.frameLocator.locator("input[type=url]").fill(data.hyperlink.url);
        await this.applyHyperlinkBtn.click();
      }
    }
    if (data.bullet_list) {
      const btnStatus = await this.getQuickSettingsTextBtn("bullet").getAttribute("class");
      if (btnStatus.includes("active") !== data.bullet_list) {
        await this.getQuickSettingsTextBtn("bullet").click();
      }
    }
    if (data.order_list) {
      const btnStatus = await this.getQuickSettingsTextBtn("number").getAttribute("class");
      if (btnStatus.includes("active") !== data.order_list) {
        await this.getQuickSettingsTextBtn("number").click();
      }
    }
    if (data.tag) {
      // Nhanh quá làm click vào button ở dropdown mất quick setting
      await this.waitAbit(200);
      const tagOpt = this.frameLocator.locator(`button[class*=dropdown-item]:text-is('${data.tag}')`);
      await this.getQuickSettingsTextBtn("tag").click();
      await tagOpt.click({ delay: 300 });
    }
    if (data.variable) {
      await this.getQuickSettingsTextBtn("variable", isTab).click();
      if (data.variable.shop) {
        const shopVariable = this.frameLocator.locator(this.variableGroups).filter({ hasText: "Shop" });
        await shopVariable.click();
        await shopVariable.locator(this.popoverVariableOptions).waitFor();
        await this.frameLocator
          .locator(`div[class*=options__item]:text-is("${data.variable.shop}")`)
          .click({ delay: 300 });
      }
      if (data.variable.product) {
        const productVariable = this.frameLocator.locator(this.variableGroups).filter({ hasText: "Product" });
        await productVariable.click();
        await productVariable.locator(this.popoverVariableOptions).waitFor();
        await this.frameLocator
          .locator(`div[class*=options__item]:text-is('${data.variable.product}')`)
          .click({ delay: 300 });
      }
      if (data.variable.profile) {
        const profileVariable = this.frameLocator.locator(this.variableGroups).filter({ hasText: "Profile" });
        await profileVariable.click();
        await profileVariable.locator(this.popoverVariableOptions).waitFor();
        await this.frameLocator
          .locator(`div[class*=options__item]:text-is("${data.variable.profile}")`)
          .click({ delay: 300 });
      }
      if (data.variable.page) {
        const pageVariable = this.frameLocator.locator(this.variableGroups).filter({ hasText: "Page" });
        await pageVariable.click();
        await pageVariable.locator(this.popoverVariableOptions).waitFor();
        await this.frameLocator
          .locator(`div[class*=options__item]:text-is('${data.variable.page}')`)
          .click({ delay: 300 });
      }
    }
    await this.waitAbit(500); // Hành động sau quá nhanh làm mất settings đã edit
  }

  /**
   * Copy text của các block trong webfront preview
   * @param selector
   * @param text
   */
  async copyTextFromBlock(selector: string | Locator, text?: string) {
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    const block = typeof selector === "string" ? this.frameLocator.locator(selector) : selector;
    await block.click();
    await this.selectOptionOnQuickBar("Edit text");
    await this.frameLocator.locator("[contenteditable=true]").waitFor();
    if (text) {
      const fullText = await block.innerText();
      const startIndex = fullText.indexOf(text);
      for (let i = 0; i < startIndex; i++) {
        await this.page.keyboard.press("ArrowRight");
      }
      for (let i = 0; i < text.length; i++) {
        await this.page.keyboard.press("Shift+ArrowRight");
      }
    } else {
      await this.page.keyboard.press(`${modifier}+KeyA`);
    }
    await this.page.keyboard.press(`${modifier}+KeyC`, { delay: 100 });
    await this.page.keyboard.press(`${modifier}+KeyC`, { delay: 100 });
    await this.backBtn.click();
  }

  /**
   * Paste text đã copy sang 1 block khác trong preview
   * @param selector
   */
  async pasteTextToBlock(selector: string | Locator) {
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    const block = typeof selector === "string" ? this.frameLocator.locator(selector) : selector;
    const blockClass = await block.getAttribute("class");
    if (!blockClass.includes("selected")) {
      await block.click();
    }
    await this.selectOptionOnQuickBar("Edit text");
    await this.frameLocator.locator("[contenteditable=true]").waitFor();
    await this.page.keyboard.press(`${modifier}+KeyA`);
    await this.page.keyboard.press(`${modifier}+KeyV`, { delay: 100 });
  }

  /**
   * Hàm add block, section to library
   * @param data
   */
  async saveAsTemplate(data: SaveTemplateInfo) {
    const getInputLocator = (fieldName: string): Locator => {
      return this.genLoc("[class*=form-item]").filter({ hasText: fieldName }).getByRole("textbox");
    };
    const templateName = getInputLocator("Template name");
    const chooseLibrary = getInputLocator("Library");
    const chooseCategory = getInputLocator("Category");
    const getStoreType = (type: string): Locator => {
      return this.genLoc("[class$=form-item]")
        .filter({ hasText: "Store type" })
        .locator("label")
        .filter({ hasText: type });
    };
    const tagsInput = getInputLocator("Tags");
    if (await this.saveTemplatePopup.isHidden()) {
      await this.selectOptionOnQuickBar("Save as template");
    }
    await templateName.fill(data.template_name);

    if (await chooseLibrary.isDisabled()) {
      const removeLibBtn = this.genLoc("[class*=form-item]")
        .filter({ hasText: "Library" })
        .locator("span[class*=icon]:not([style='display: none;']) [id*=Close]");
      await removeLibBtn.click();
      await this.autocompletePopover.waitFor();
    }
    await chooseLibrary.fill(data.library.title);
    if (data.library.new) {
      await this.addNewBtn.click();
    } else {
      const lib = this.genLoc("[data-select-label][class*= selection-item]").filter({ hasText: data.library.title });
      await lib.click();
    }
    await this.autocompletePopover.waitFor({ state: "hidden" });
    await expect(chooseLibrary).toBeDisabled();
    await this.waitAbit(500); //Lib có cate sẵn sẽ chọn cate bị nhảy chậm -> cần delay

    if (data.category) {
      if (await chooseCategory.isDisabled()) {
        const removeCateBtn = this.genLoc("[class*=form-item]")
          .filter({ hasText: "Category" })
          .locator("span[class*=suffix]:not([style='display: none;']) [id*=Close]");
        await removeCateBtn.click();
        await this.autocompletePopover.waitFor();
      }
      await chooseCategory.fill(data.category.title);
      if (data.category.new) {
        await this.addNewBtn.click();
      } else {
        const cate = this.genLoc("[data-select-label][class*= selection-item]").filter({
          hasText: data.category.title,
        });
        await cate.click();
      }
      await this.autocompletePopover.waitFor({ state: "hidden" });
      await expect(chooseCategory).toBeDisabled();
    }

    if (data.tags) {
      for (const tag of data.tags) {
        await tagsInput.fill(tag);
        await this.addNewBtn.click();
        await this.autocompletePopover.waitFor({ state: "hidden" });
      }
    }

    if (data.store_type) {
      for (const storeType of data.store_type) {
        const checkBox = getStoreType(storeType);
        const isChecked = await checkBox.isChecked();
        if (!isChecked) {
          await checkBox.click();
        }
      }
    }

    await this.saveTemplateBtn.click();
    await this.toastMessage.waitFor();
  }

  /**
   * Hàm get vị trí và width height của các visible ele trong Webfront preview
   * @param ele
   */
  async getBoundingBox(ele: Locator): Promise<{
    top: number;
    left: number;
    bottom: number;
    right: number;
    width: number;
    height: number;
    x: number;
    y: number;
  }> {
    const eleRect = await ele.evaluate(elem => {
      const frameRect = window.parent.document.getElementById("preview").getBoundingClientRect();
      const rect = elem.getBoundingClientRect();
      return {
        top: rect.top + frameRect.top,
        left: rect.left + frameRect.left,
        bottom: rect.left + frameRect.left + rect.height,
        right: rect.top + frameRect.top + rect.width,
        width: rect.width,
        height: rect.height,
        x: rect.x + frameRect.x,
        y: rect.y + frameRect.y,
      };
    });
    return eleRect;
  }

  /**
   * Hàm di chuyển các block manual trong WB theo x, y mong muốn
   * @param source
   * @param target
   * @param options: source/targetPosition là toạ độ của element bắt đầu với top, left = 0
   * NOTE: top, left = 0 -> sử dụng width, height để locate đúng toạ độ cần click và thả.
   */
  async dragBlockInWebBuilder(
    source: Locator,
    target: Locator,
    options?: {
      sourcePosition?: {
        x: number;
        y: number;
      };
      targetPosition?: {
        x: number;
        y: number;
      };
    },
  ): Promise<void> {
    await source.scrollIntoViewIfNeeded();
    const sourceBox = await source.boundingBox();
    let startX = sourceBox.x + sourceBox.width / 2,
      startY = sourceBox.y + sourceBox.height / 2;
    if (options.sourcePosition) {
      (startX = sourceBox.x + options.sourcePosition.x), (startY = sourceBox.y + options.sourcePosition.y);
    }
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();

    await target.scrollIntoViewIfNeeded();
    const targetBox = await target.boundingBox();
    let endX = targetBox.x + targetBox.width / 2,
      endY = targetBox.y + targetBox.height / 2;
    if (options.targetPosition) {
      (endX = targetBox.x + options.targetPosition.x), (endY = targetBox.y + options.targetPosition.y);
    }
    await this.page.mouse.move(endX, endY, { steps: 10 });
    await this.page.mouse.up();
  }

  // ====================== In Sidebar =============================
  getXpathSidebarSetting(widgetId: SideBarDataWidgetId): string {
    return `//div[@data-widget-id='${widgetId}']`;
  }

  async getSidebarSliderValue(dataWidgetId: string, label: string) {
    const xpath = `//div[@data-widget-id='${dataWidgetId}' and descendant::label[normalize-space()='${label}']]/descendant::input[@type='number' and contains(@class, 'sb-input__inner-append')]`;
    const rawValue = await this.genLoc(xpath).inputValue();
    return rawValue.trim();
  }

  async getSidebarInputValue(dataWidgetId: string) {
    const rawValue = await this.genLoc(
      `//div[@data-widget-id='${dataWidgetId}']//div[contains(@class, 'w-builder__widget--inline')]//input`,
    ).inputValue();
    return rawValue.trim();
  }

  /**
   *
   * @param option
   * @returns
   */
  getFilterOptionStoreTypeLocator = (option: string): Locator => {
    return this.genLoc(`label.sb-checkbox:has([class$=label]:text-is('${option}'))`);
  };

  /**
   *Hàm select filter store type
   * @param param0
   */
  async storeTypeFilter(data: FilterStoreType) {
    const ecomFilter = this.getFilterOptionStoreTypeLocator("E-commerce");
    const creatorFilter = this.getFilterOptionStoreTypeLocator("Creator");
    await this.storeTypeFilterBtn.click();
    if ((await ecomFilter.isChecked()) !== data.ecom) {
      if (await ecomFilter.isDisabled()) {
        await creatorFilter.click();
        await this.page.waitForResponse(/all.json/);
      }
      await ecomFilter.click();
      await this.page.waitForResponse(/all.json/);
    }
    if ((await creatorFilter.isChecked()) !== data.creator) {
      if (await creatorFilter.isDisabled()) {
        await ecomFilter.click();
        await this.page.waitForResponse(/all.json/);
      }
      await creatorFilter.click();
      await this.page.waitForResponse(/all.json/);
    }
    await this.storeTypeFilterBtn.click();
  }

  /**
   * Hàm select library filter trong insert panel
   * @param option
   */
  async chooseLibraryFilter(option: string) {
    const getLibraryFilter = (filter: string): Locator => {
      return this.genLoc(`[class*=filter-menu-item]:has(:text-is("${filter}"))`);
    };
    const selectFilter = getLibraryFilter(option);
    await this.libraryFilterBtn.click();
    await selectFilter.click();
    await this.page.waitForResponse(/all.json/);
  }

  /**
   * Chờ kết quả search load sau khi nhập key search vào insert panel
   */
  async waitForSearchResult() {
    const response = await this.page.waitForResponse(
      response => response.url().includes("component/all.json?page=1") && response.status() === 200,
    );
    const jsonRes = await response.json();
    const searchResults = jsonRes.result.templates;
    if (searchResults !== null) {
      const loaded = this.templateContainer.locator("div[style='display: none;']");
      if (await loaded.isVisible()) {
        await this.page.waitForResponse(
          response => response.url().includes("component/all.json?page=2") && response.status() === 200,
        );
      }
    }
    await this.genLoc("[class=sb-p-medium] .sb-skeleton__box").first().waitFor({ state: "hidden" });
  }

  /**
   * Remove search key ở insert panel
   */
  async removeSearchKey() {
    await this.searchbarTemplate.click();
    await this.page.keyboard.press("Control+A");
    await this.page.keyboard.press("Backspace");
  }

  /**
   * Get xpath element in sidebar by label
   * @param value widget's id
   * @private
   */
  getSelectorByLabel(value: string): string {
    if (/^[a-zA-Z_]+$/.test(value)) {
      value = `//div[@data-widget-id='${value}']`;
    }
    return value;
  }

  /**
   * Get xpath widget element in sidebar by widget label
   * @param value
   * @private
   */
  getWidgetSelectorByLabel(label: string): string {
    return `//label[normalize-space()='${label}']/ancestor::div[contains(@class, 'widget--label')]/following-sibling::div`;
  }

  /**
   * Get active settings tab
   */
  async getActiveTab() {
    return await this.genLoc("(//div[contains(@class,'sb-tab-navigation__item--active')]//div)[1]").innerText();
  }

  /**
   * Switch tab
   * @param label
   */
  async switchToTab(label: string) {
    const activeTab = await this.getActiveTab();
    if (label !== activeTab) {
      await this.genLoc("[class*='sb-tab-navigation__item']:visible")
        .filter({ has: this.page.getByText(label, { exact: true }) })
        .click();
    }
  }

  /**
   * Setting value in slider bar component
   * @param selector is a data-widget-id or a xpath of slider runway
   * @param value
   * @param iframe
   */
  async editSliderBar(selector: string, value: number | Slider, iframe?: string) {
    let percent: number;
    if (typeof value === "object") {
      percent = value.number;
      if (value.fill) {
        await this.genLoc(`[data-widget-id="${selector}"] .sb-slider + .sb-input input[type="number"]`).fill(
          percent.toString(),
        );
        if (await this.genLoc(`[data-widget-id="${selector}"] .w-builder__label`).isVisible()) {
          await this.genLoc(`[data-widget-id="${selector}"] .w-builder__label`).click({ delay: 200 });
        }
      }
    } else if (typeof value === "number") {
      percent = value;
      const frame = iframe ? this.page.frameLocator(iframe) : this.page;
      const ele = this.getSelectorByLabel(selector);
      const buttonAbsolute = `${ele}//div[contains(@class,'button sb-absolute') or contains(@class,'button absolute') or contains(@class,'picker')]`;
      const box = await frame.locator(ele).boundingBox();
      await frame.locator(buttonAbsolute).hover();
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + (box.width * percent) / 100, box.y, { steps: 5 });
      await this.page.mouse.up();
    }
    await this.page.mouse.up();
  }

  /**
   * Upload image to upload component for blocks only (Dpro update section, row, column background)
   * @param selector is a data-widget-id or a xpath
   * @param file
   */
  async uploadImage(selector: string, file: string, label?: string, gallery?: number): Promise<string> {
    const parentSelector =
      selector !== "thumbnail_image"
        ? this.getSelectorByLabel(selector)
        : `${this.popOverXPath}//div[contains(@class,'tab-panel') and not(contains(@style,'none'))]`;
    const trashIcon = `${parentSelector}//button[descendant::*[local-name()='g' and @id='Icons/Trash']]`;
    const dropZone = this.genLoc(`(${parentSelector}//div[contains(@class,'sb-upload__dropzone')])[1]`);
    await dropZone.hover();
    const isUploaded = await this.page.locator(trashIcon).count();
    if (isUploaded) {
      await this.genLoc(trashIcon).click();
    }
    if (gallery) {
      await dropZone.getByText("Select from gallery").click();
      await this.genLoc(".modal-library-image__list")
        .getByRole("img")
        .nth(gallery - 1)
        .click();
      await this.genLoc(".modal-library-image").getByRole("button").filter({ hasText: "Insert" }).click();
    } else {
      await this.page.setInputFiles(`${parentSelector}//input[@type='file']`, file);
      await this.page.waitForSelector(`${parentSelector}//div[contains(@class,'sb-spinner')]`, {
        state: "hidden",
      });
    }
    await dropZone.locator("img").waitFor();
    const imgUrl = await dropZone.locator("img").getAttribute("src");
    const sidebarBtn = this.genLoc(this.getSelectorByLabel(label)).locator(this.colorSidebar);
    if (await sidebarBtn.isHidden()) {
      return "";
    }

    try {
      await sidebarBtn.and(this.genLoc(`[style*="${imgUrl}"]`)).waitFor({ timeout: 10000 });
    } catch (error) {
      await this.getTabBackground("Color").click();
      await this.getTabBackground("Image").click();
      await sidebarBtn.and(this.genLoc(`[style*="${imgUrl}"]`)).waitFor({ timeout: 5000 });
    }
    return imgUrl;
  }

  /**
   * Hàm upload img mới cho section, row, column
   * @param param0
   * @returns
   */
  async uploadImageNew({ upload, gallery, source, remove }: ImageNew): Promise<string> {
    const currentTab = this.genLoc(this.popOverXPath).locator(".sb-tab-panel:visible");
    await currentTab.locator(".widget-image .select-variable-wrapper").click();
    if (upload) {
      const [fileChooser] = await Promise.all([
        this.page.waitForEvent("filechooser"),
        this.genLoc("#popover-select-media-variable").getByRole("listitem").filter({ hasText: "Upload" }).click(),
      ]);
      await fileChooser.setFiles(upload);
    }
    if (gallery) {
      await this.genLoc("#popover-select-media-variable")
        .getByRole("listitem")
        .filter({ hasText: "Select from gallery" })
        .click();
      await this.genLoc(".modal-library-image__list")
        .getByRole("img")
        .nth(gallery - 1)
        .click();
    }
    if (source) {
      await this.genLoc("#popover-select-media-variable")
        .getByRole("listitem")
        .filter({ hasText: source.cate })
        .hover();
      await this.genLoc("#select-variable-item-shop").getByText(source.value).click();
    }
    if (remove) {
      await this.genLoc("#popover-select-media-variable").getByRole("listitem", { name: "Remove" }).click();
    }
    const imgUrl = await currentTab
      .locator(".widget-image .select-variable-wrapper img.preview-upload")
      .getAttribute("src");
    return imgUrl;
  }

  /**
   * Upload video from path or add link
   * @param selector is a data-widget-id or a xpath
   * @param link
   */
  async uploadVideo(selector: string, link: string) {
    const parentSelector = this.getSelectorByLabel(selector);
    const isUploaded = await this.genLoc(`${parentSelector}//iframe`).isEnabled();
    if (isUploaded) {
      const media = this.page.locator("div.iframe-container");
      await media.hover({ position: { x: 1, y: 1 } });
      await this.genLoc(`(${parentSelector}//div[contains(@class,'sb-image__content')]//button)[1]`).click();
    } else {
      await this.genLoc(`${parentSelector}//a[normalize-space()='Add from URL']`).click();
    }
    await this.genLoc("//div[contains(@class,'sb-popup__body')]//input").fill(link);
    await this.genLoc(
      "//div[contains(@class,'sb-popup__footer')]//button[contains(@class,'sb-button--primary')]",
    ).click();
  }

  /**
   * Select value in dropdown value list
   * @param selector
   * @param value
   * @param index
   */
  async selectDropDown(selector: string, value: string | number, index = 1) {
    const parentSelector = this.getSelectorByLabel(selector);
    await this.genLoc(parentSelector)
      .getByRole("button")
      .nth(index - 1)
      .click();
    let option: Locator;
    if (selector.includes("shape") || selector === "expand_icon") {
      option =
        typeof value === "number"
          ? this.genLoc(this.popOverXPath)
              .locator("span[class*=select__item]")
              .nth(value - 1)
          : this.genLoc(this.popOverXPath).locator("span[class*=select__item]").locator(`span.icon-${value}`);
    } else {
      option =
        typeof value === "string" && this.genLoc(this.popOverXPath).getByRole("listitem").filter({ hasText: value });
    }
    await option.first().click();
    await this.waitAbit(300); //WB render chậm
  }

  /**
   * Select value in multi level menu
   * @param selector
   * @param children
   * @param index
   */
  async selectMultiLevelMenu(selector: string, children = [], index = 1) {
    const parentSelector = this.getSelectorByLabel(selector);
    await this.genLoc(`${parentSelector}//div[contains(@class,'popover__reference')][${index}]`).click();
    if (children.length) {
      let option = `${this.popOverXPath}//li[${children.shift()}]`;
      await this.genLoc(option).click();
      for await (const index of children) {
        option = `${option}//div[contains(@class,'menu__item')][${index}]`;
        await this.genLoc(option).click();
      }
    }
  }

  /**
   * Select value in align | segmented widget
   * @param selector
   * @param selection
   */
  async selectAlignSelf(selector: string, value: "left" | "center" | "right") {
    const alignMap = {
      left: 1,
      center: 2,
      right: 3,
    };
    const parentSelector = this.getSelectorByLabel(selector);
    await this.genLoc(`${parentSelector}//span[${alignMap[value]}]//span`).click();
  }

  /**
   * Select value in data source list
   * @param selector
   * @param selection
   */
  async selectDropDownDataSource(selector: string, { category, source, index = 0 }: DataSource, scroll = false) {
    if (!category) {
      return;
    }

    const parentSelector = this.getSelectorByLabel(selector);
    const xPathCategory = `(${parentSelector}//div[@id="search-data-source"])`;
    // // click to open popover
    await this.genLoc(xPathCategory).getByRole("button").click();

    // Nếu đã có source  -> click back
    if (await this.genLoc(this.popOverXPath).locator(".search-source").getByRole("textbox").isVisible()) {
      await this.genLoc(this.popOverXPath).locator(".search-source").getByRole("button").click();
    }

    // click to select data source category
    await this.genLoc(this.popOverXPath).getByRole("button", { name: category, exact: true }).click();

    if (!source) {
      return;
    }

    const xPathSource = `${this.popOverXPath}//div[contains(@class, 'list-search-result')]//span[normalize-space()='${source}']`;
    if (!scroll) {
      // search by value
      await this.genLoc(`${this.popOverXPath}//input[contains(@placeholder,'Search ${category.toLowerCase()}')]`).fill(
        source,
      );
      await this.genLoc(`${this.popOverXPath}//span[contains(@class, '--loading-dots')]`)
        .last()
        .waitFor({ state: "hidden" });
    } else {
      await scrollUntilElementIsVisible({
        page: this.page,
        viewEle: this.genLoc(xPathSource).nth(index),
        scrollEle: this.page.getByRole("tooltip").locator(".list-search-result"),
      });
    }
    // click to the result which have same text as value
    await this.genLoc(xPathSource).nth(index).click();

    // wait to it was applied
    await this.genLoc(xPathCategory).getByRole("button", { name: source }).waitFor({ state: "visible" });
    await this.waitAbit(500); //WB render chậm
  }

  async selectMultiple(selector: string, value: Array<string | number>, index = 1) {
    const parentSelector = this.getSelectorByLabel(selector);
    await this.genLoc(`(${parentSelector}//button)[${index}]`).click();
    for await (const item of value) {
      const option = `${this.popOverXPath}//label[normalize-space()='${item}']`;
      await this.genLoc(option).click();
    }
  }

  /**
   * Hàm select data source cho các block upsell hoặc block ko sử dụng widget variable
   * @param param0
   */
  async setBlockDataSource({ category = "Product", source, index = 0 }: DataSource): Promise<void> {
    let finalSource: string;
    const modalSelectSource = this.genLoc("div.modal-select-source .sb-popup__container");
    const popupSelectSource = this.genLoc("#popup-select-source");
    const sourceBtn = this.genLoc("[class*=source-detail]").locator("div[class*=reference__title]");
    await sourceBtn.click();
    await modalSelectSource.waitFor();
    await modalSelectSource.getByRole("button").and(this.genLoc(".label")).click();
    if (await popupSelectSource.locator(".search-source").getByRole("textbox").isVisible()) {
      await popupSelectSource.getByRole("button").click();
    }
    await popupSelectSource.locator(".list-source").getByRole("button", { name: category, exact: true }).click();
    if (source) {
      await popupSelectSource.locator(".list-search-result").waitFor();
      await popupSelectSource.getByRole("textbox").fill(source);
      await popupSelectSource
        .locator(".list-search-result")
        .locator(".sb-selection-item")
        .filter({ hasText: source })
        .nth(index)
        .click();
      finalSource = source;
    } else {
      finalSource = category;
    }
    await modalSelectSource.getByRole("button", { name: "Save" }).click({ delay: 500 });
    await sourceBtn.filter({ hasText: finalSource }).waitFor();
  }

  /**
   * Check or uncheck checkbox
   * @param label
   * @param isCheck
   */
  async checkCheckBox(label: string, isCheck: boolean) {
    const parentSelector = this.getSelectorByLabel(label);
    const spanSelector = `${parentSelector}//span[@class='sb-check']`;
    const status = await this.genLoc(spanSelector).isChecked();
    if (status !== isCheck) {
      await this.genLoc(spanSelector).click();
    }
  }

  /**
   * On/off toggle
   * @param selector
   * @param isOn
   */
  async switchToggle(selector: string | Locator, isOn: boolean, callback?: object) {
    let parentSelector: Locator;
    if (callback instanceof Function) {
      parentSelector = this.genLoc(callback(selector));
    } else {
      parentSelector = typeof selector === "string" ? this.genLoc(this.getSelectorByLabel(selector)) : selector;
    }
    const toggleBtn = parentSelector.locator("//label[contains(@class,'sb-switch__button')]");
    const currentValue = await toggleBtn.getByRole("checkbox").getAttribute("value");
    if (currentValue !== `${isOn}`) {
      await toggleBtn.click({ delay: 300 });
      await expect(async () => {
        return expect(toggleBtn.getByRole("checkbox")).toHaveAttribute("value", `${isOn}`);
      }).toPass({ timeout: 10000 });
      await this.waitAbit(200); //WB render chậm
    }
  }

  /**
   * get toggle value
   * @param selector
   */
  async getToggleValue(selector: string) {
    const parentSelector = this.getSelectorByLabel(selector);
    return await this.genLoc(`${parentSelector}//input`).getAttribute("value");
  }

  /**
   * get toggle value
   * @param selector
   * @param index
   */
  async hoverInfoIconByLabel(selector: string, index = 1) {
    const parentSelector = this.getSelectorByLabel(selector);
    await this.genLoc(`(${parentSelector}//span[contains(@aria-describedby,'sb-tooltip')])[${index}]`).hover();
  }

  /**
   * Input text in box component
   * @param selector
   * @param text
   */
  async inputTextBox(selector: string, text: string, index = 1) {
    const parentSelector = this.getSelectorByLabel(selector);
    const labelSelector = `(${parentSelector}//label)[${index}]`;
    const inputSelector = `(${parentSelector}//input[contains(@class,'__input') or contains(@class,'__inner-append')])[${index}]`;
    await this.genLoc(inputSelector).click({ delay: 200 });
    await this.genLoc(inputSelector).fill(text);
    if (await this.genLoc(labelSelector).isVisible()) {
      await this.genLoc(labelSelector).click({ delay: 200 });
    }

    await this.genLoc(".w-builder__settings .w-builder__tab-heading").dblclick({ delay: 100 }); //cần click ra 1 vùng bất kỳ để nhận value vừa nhập
  }

  /**
   * Input textarea in box component
   * @param selector
   * @param text
   */
  async inputTextarea(selector: string, text: string) {
    const parentSelector = this.getSelectorByLabel(selector);
    await this.genLoc(`${parentSelector}//textarea`).fill(text);
    await this.genLoc(".w-builder__settings .w-builder__tab-heading").dblclick({ delay: 100 }); //cần click ra 1 vùng bất kỳ để nhận value vừa nhập
  }

  /**
   * Select icon in icon component
   * @param selector
   * @param icon
   */
  async selectIcon(selector: string | Locator, icon: string, hasInput = true) {
    const excludeDisplayNone = "not(contains(@style,'display: none;'))";
    const parentSelector = typeof selector === "string" ? this.genLoc(this.getSelectorByLabel(selector)) : selector;
    if (icon === "none") {
      await this.genLoc(`//div[contains(@class,'icon-none')]`).click();
    } else {
      await parentSelector.locator("//div[contains(@class,'sb-popover__reference')]").click();

      if (hasInput) {
        await this.genLoc(this.popOverXPath).getByRole("textbox").fill(icon);
      }
      await this.genLoc(this.popOverXPath)
        .locator(`//div[contains(@class, 'sb-tab-panel') and ${excludeDisplayNone}]`)
        .locator("[class*=widget-icon__item]")
        .filter({ has: this.page.getByText(icon.toLowerCase(), { exact: true }) })
        .click();
    }
    await this.titleBar.click();
  }

  async selectButtonGroup(button: string, selector?: string) {
    selector = selector ? this.getSelectorByLabel(selector) : "";
    await this.genLoc(
      `${selector}//div[contains(@class,'sb-button-group')]//button[normalize-space()='${button}']`,
    ).click();
  }

  async setLayoutForContainer(selector: string, data: LayoutContainer) {
    const parentSelector = this.getSelectorByLabel(selector);
    await this.genLoc(parentSelector).click();
    const directionIndex = {
      Vertical: 2,
      Horizontal: 1,
    };
    const alignIndex = {
      Top: 1,
      Left: 1,
      Center: 2,
      Bottom: 3,
      Right: 3,
      SpaceDistribute: 4,
    };

    if (data.direction) {
      //set direction
      const directionButtonXpath = `(//label[contains(., "Direction")]/ancestor::div[2]//span//div//span)[${
        directionIndex[data.direction]
      }]`;
      await this.genLoc(directionButtonXpath).click();
      await waitSelector(this.page, `(${directionButtonXpath}//parent::div)[contains(@class, "active")]`);
    }

    if (data.align) {
      //set align
      const alignButtonXpath = `(//label[contains(., "Align")]/ancestor::div[2]//span//div//span)[${
        alignIndex[data.align]
      }]`;
      await this.genLoc(alignButtonXpath).click();
      await waitSelector(this.page, `(${alignButtonXpath}//parent::div)[contains(@class, "active")]`);
    }

    //set spacing
    if (data.align !== "SpaceDistribute") {
      if (typeof data.spacing !== "undefined") {
        await this.genLoc("(//input[contains(@class, 'sb-input__inner-append')])[1]").fill(data.spacing.toString());
      }
    }
  }

  /**
   * Setting data for list component or bullet component
   * @param selector
   * @param data
   */
  async settingListBullet(selector: string, data: Bullet) {
    const parentSelector = this.getSelectorByLabel(selector);
    if (data.add) {
      for (let i = 0; i < data.add; i++) {
        await this.genLoc(`${parentSelector}//button[normalize-space()='Add item']`).click();
      }
    }
    if (data.delete) {
      await this.genLoc(`(${parentSelector}//*[local-name()='g' and @id='Icons/Trash'])[${data.delete}]`).click();
    }
    if (data.icon) {
      await this.selectIcon(
        `(${parentSelector}//div[contains(@class,'widget-icon')])[${data.icon.item}]`,
        data.icon.iconName,
      );
    }
    if (data.move) {
      await this.dragAndDrop({
        from: { selector: `(${parentSelector}//div[contains(@class,'w-builder__list-drag')])[${data.move.from}]` },
        to: { selector: `(${parentSelector}//span[contains(@class,'w-builder__widget--list-drag')])[${data.move.to}]` },
      });
    }
  }

  async selectAlign(selector: string, value: "Left" | "Center" | "Right" | "Space distribute") {
    const parentSelector = this.getSelectorByLabel(selector);
    let index = 0;
    if (value === "Center") {
      index = 1;
    }
    if (value === "Right") {
      index = selector === "icon_position" ? 1 : 2;
    }
    if (value === "Space distribute") {
      index = 3;
    }
    await this.genLoc(parentSelector).locator("[class*=thickness-item]").nth(index).click();
  }

  /**
   * Setting width/height
   * @param selector is a data-widget-id or a xpath
   * @param data
   * @param isApplyChange
   */
  async settingWidthHeight(selector: string, data: WidthHeight, isApplyChange = false) {
    const parentSelector = this.getSelectorByLabel(selector);
    if (data.unit) {
      await this.selectDropDown(selector, data.unit);
      await this.waitAbit(200); //width, height thay đổi khi edit unit -> chờ edit
    }
    if (data.value) {
      await this.genLoc(`${parentSelector}//input`).isEnabled();
      await this.genLoc(`${parentSelector}//input`).fill(data.value.toString());
      await this.genLoc(`${parentSelector}//input`).press("Enter");
      await this.titleBar.click({ delay: 300 });
      if (isApplyChange) {
        await this.genLoc(`${parentSelector}//input`).blur();
      }
    }
  }

  /**
   * Move absolute button in the Palette
   * @param selector
   * @param percent
   */
  async settingPalette(selector: string, percent: { left: number; top: number }) {
    const palette = `${selector}//div[contains(@class,"white")]`;
    const buttonAbsolute = `${palette}/following-sibling::div//div[@class='sb-saturation-circle']`;
    const box = await this.page.locator(palette).boundingBox();
    await this.page.locator(buttonAbsolute).hover();
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + (box.width * percent.left) / 100, box.y + (box.height * percent.top) / 100);
    await this.page.mouse.up();
  }

  /**
   * Setting color
   * @param color:
   * color.preset is preset index
   * @param selector
   * @param closePopup
   */
  async color(color: Color, selector?: string, closePopup = true) {
    let parentSelector: string;
    let preset = this.genLoc(this.popOverXPath)
      .locator("[class$=widget--background], [class$='colors-chips']")
      .locator("span[class*='w-builder__chip']")
      .nth(color.preset - 1);
    let opacitySelector = `${this.popOverXPath}//div[contains(@class,'w-builder__opacity-slider')]`;
    const colorBarSelector = `${this.popOverXPath}//div[contains(@class,'sb-hue--horizontal')]`;
    const backgroundPopover = this.genLoc(`${this.popOverXPath}//label[normalize-space()='Background']`);

    // If (selector), click on selector to open popup
    if (selector) {
      preset = this.genLoc("#widget-popover:not([style*=none])>[class$=widget--color]")
        .locator("span[class*=w-builder__chip]")
        .nth(color.preset - 1);
      parentSelector = this.getSelectorByLabel(selector);
      await this.genLoc(parentSelector).locator("//div[contains(@class,' color')]").click();
    }
    // Setting preset
    if (color.preset) {
      await preset.click();
    }
    // Setting opacity
    if (typeof color.opacity !== "undefined") {
      const isActiveRainbow = await this.genLoc(
        `${this.popOverXPath}//span[contains(@class,'w-builder__chip--rainbow w-builder__chip--active')]`,
      ).isVisible();
      if (isActiveRainbow) {
        opacitySelector = `${this.popOverXPath}//div[contains(@class,'sb-sketch__alpha-wrap')]`;
      }
      await this.editSliderBar(opacitySelector, color.opacity);
    }
    // Setting color bar (in case preset is rainbow)
    if (typeof color.colorBar !== "undefined") {
      await this.editSliderBar(colorBarSelector, color.colorBar);
    }
    // Setting palette (in case preset is rainbow)
    if (typeof color.palette !== "undefined") {
      await this.settingPalette(this.popOverXPath, color.palette);
    }
    // Input hex (in case preset is rainbow)
    if (color.hexText) {
      await this.genLoc(this.popOverXPath).getByLabel("Color Picker").locator("input[type=text]").fill(color.hexText);
      if (await backgroundPopover.isVisible()) {
        await backgroundPopover.hover();
      }
    }
    // Input opacity (in case preset is rainbow)
    if (typeof color.opacityText !== "undefined") {
      await this.genLoc(this.popOverXPath)
        .getByLabel("Color Picker")
        .locator("input[type=number]")
        .fill(color.opacityText.toString());
    }
    // Click to close popup
    if (selector && closePopup) {
      await this.genLoc(parentSelector).locator("//div[contains(@class,' color')]").click();
    }
  }

  /**
   * Setting size
   * @param selector
   * @param size
   */
  async size(selector: string, size: string) {
    await this.genLoc(
      `${this.getSelectorByLabel(selector)}//div[contains(@class, size__thickness)]/span//label[text()='${size}']`,
    ).click();
  }

  /**
   * Setting color in web style/page style
   * @param data
   */
  async settingColorsStyles(data: ColorStyles) {
    const presetSelector = `//span[contains(@class,'w-builder__chip')][${data.preset}]`;
    await this.genLoc(presetSelector).click();
    if (data.palette) {
      const colorBarSelector = "//div[contains(@class,'sb-saturation--black-color')]";
      await this.settingPalette(colorBarSelector, data.palette);
    }
    if (typeof data.colorBar !== "undefined") {
      const colorBarSelector = "//div[contains(@class,'sb-hue--horizontal')]";
      await this.editSliderBar(colorBarSelector, data.colorBar);
    }
    if (data.hexText) {
      await this.genLoc("(//div[@class='w-builder__color-group']//input[@type='text'])[2]").fill(data.hexText);
    }
  }

  /**
   * Get tab trong settings background
   * @param tab: "Color" | "Image" | "Video"
   * @returns
   */
  getTabBackground = (tab: string): Locator => {
    return this.genLoc(this.popOverXPath).locator(
      `//div[contains(@class,'tab-navigation') and normalize-space()='${tab}']`,
    );
  };

  /**
   * Get tab active settings background
   * @returns
   */
  getActiveTabBackground = async (): Promise<string> => {
    const tabName = await this.genLoc(this.popOverXPath).locator("[class$=navigation__item--active]").innerText();
    return tabName;
  };

  /**
   * Setting background
   * @param label
   * @param data
   * @param index
   */
  async setBackground(label: string, data: BackGround, index = 1) {
    let imgUrl: string;
    const currentTab = "//div[contains(@class,'tab-panel') and not(contains(@style,'none'))]";
    const backgroundPopover = this.genLoc(`${this.popOverXPath}//label[normalize-space()='Background']`);
    const getToggleBtn = (btnName: string): Locator => {
      return this.page
        .locator(currentTab)
        .locator("[class$=align-center]")
        .filter({ has: this.page.locator("label", { hasText: btnName }) })
        .locator("label.sb-switch__button");
    };
    // Click mở edit background nếu popover chưa hiển thị
    if (await backgroundPopover.isHidden()) {
      await this.genLoc(`//div[contains(@data-widget-id,'${label}')]`)
        .locator("//div[contains(@class,'sb-pointer')]")
        .nth(index - 1)
        .or(this.genLoc(`//div[contains(@data-widget-id,'${label}')]`).getByRole("button"))
        .click();
    }
    // Mở tab color để edit
    if (typeof data.color !== "undefined") {
      await this.getTabBackground("Color").click();
      await this.genLoc(this.popOverXPath).locator(".sb-tab-panel").first().waitFor();
      await this.color(data.color);
    }
    // Mở tab image để edit
    if (typeof data.image !== "undefined") {
      await this.getTabBackground("Image").click();
      await this.genLoc(this.popOverXPath).locator(".sb-tab-panel").nth(1).waitFor();
      if (data.image.url) {
        imgUrl = await this.uploadImage(this.popOverXPath, data.image.url, label);
      }
      if (data.image.new) {
        imgUrl = await this.uploadImageNew(data.image.new);
      }
      if (data.image.gallery) {
        imgUrl = await this.uploadImage(this.popOverXPath, "", label, data.image.gallery);
      }
      if (data.image.size) {
        await this.selectDropDown(`(${this.popOverXPath}//div[@class='sb-relative'])[1]`, data.image.size);
      }
      if (data.image.position) {
        // Position 1-9
        const positionIndex = data.image.position - 1;
        await this.genLoc(this.popOverXPath).locator("ul[class$=position-select] li").nth(positionIndex).click();
      }
      if (data.image.overlay) {
        await this.color(data.image.overlay, currentTab);
      }
      if (typeof data.image.repeat !== "undefined") {
        await getToggleBtn("Repeat").setChecked(data.image.repeat);
      }
      if (typeof data.image.parallax !== "undefined") {
        await getToggleBtn("Parallax").setChecked(data.image.parallax);
      }
      await this.getTabBackground("Image").click();
    }
    // Mở tab video để edit
    if (typeof data.video !== "undefined") {
      await this.getTabBackground("Video").click();
      await this.genLoc(this.popOverXPath).locator(".sb-tab-panel").last().waitFor();
      if (data.video.url) {
        await this.page.getByPlaceholder("https://").click();
        await this.page.waitForTimeout(1 * 1000);
        await this.page.getByPlaceholder("https://").fill(data.video.url);
      }
      if (data.video.overlay) {
        await this.color(data.video.overlay, currentTab);
      }
      if (data.video.image) {
        await this.uploadImage("thumbnail_image", data.video.image);
      }
      if (typeof data.video.parallax !== "undefined") {
        await getToggleBtn("Parallax").setChecked(data.video.parallax);
      }
      await this.getTabBackground("Video").click();
    }
    await this.titleBar.first().click();
    if (imgUrl) {
      return imgUrl;
    }
  }

  /**
   * Setting border updated
   * @param label
   * @param data
   */
  async setBorder(label: string, data: Border) {
    await this.genLoc(
      `//div[contains(@data-widget-id,'${label}')]//button//span[contains(@class,'w-builder__chip')]`,
    ).click();
    const indexThickness = {
      none: 1,
      s: 2,
      m: 3,
      l: 4,
      custom: 5,
    };
    if (data.thickness) {
      await this.genLoc(`(${this.popOverXPath}//button)[${indexThickness[data.thickness]}]`).click();
    }
    if (data.size) {
      if (!data.size.fill) {
        await this.editSliderBar(
          `(${this.popOverXPath}//div[contains(@class,'sb-slider__runway')])[1]`,
          data.size.number,
        );
      } else {
        await this.page.fill(`${this.popOverXPath}//input[@max='24']`, data.size.number.toString());
      }
    }
    if (data.style) {
      await this.selectDropDown("//div[normalize-space()='style']/following-sibling::div", data.style);
    }
    if (data.side) {
      await this.selectDropDown("//div[normalize-space()='side']/following-sibling::div", data.side);
    }
    if (data.color) {
      await this.color(data.color);
    }
    await this.titleBar.click();
  }

  /**
   * Set shadow cho block theo update mới 27/3
   * @param data
   */
  async setShadow(label: string, data: Shadow): Promise<void> {
    const optionIndex = {
      none: 0,
      soft: 1,
      hard: 2,
    };
    const shadowOptions = this.genLoc(".widget-shadow__grid span[class*=grid-item]");
    const getShadowSize = (size: "S" | "M" | "L"): Locator => {
      return this.genLoc(this.popOverXPath)
        .locator(".widget-size__thickness")
        .locator("[class*=thickness-item]")
        .filter({ has: this.page.locator("label", { hasText: size }) });
    };
    const shadow = this.genLoc(this.getSelectorByLabel(label));
    const shadowPopover = this.genLoc(this.popOverXPath).locator(".widget-shadow");
    if (await shadowPopover.isHidden()) {
      await shadow.getByRole("button").click();
    }
    if (data.option) {
      await shadowOptions.nth(optionIndex[data.option]).click();
      await shadowOptions.nth(optionIndex[data.option]).and(this.genLoc("span.is-active")).waitFor();
    }
    if (data.size) {
      await getShadowSize(data.size).click();
    }
    if (data.direction) {
      await shadowPopover.locator(".widget-shadow__direction").getByRole("button").click();
      await this.genLoc(this.popOverXPath)
        .getByRole("listitem")
        .filter({ has: this.page.locator(`label:text-is("${data.direction}")`) })
        .click();
    }
    await expect(shadow.getByRole("button")).toHaveText(data.option);
    await this.titleBar.click();
  }

  /**
   * Setting margin or padding
   * @param label
   * @param data
   */
  async setMarginPadding(label: string, data: MarginPadding) {
    const topPercent = data.top / 2;
    const leftPercent = data.left / 2;
    const bottomPercent = data.bottom / 2;
    const rightPercent = data.right / 2;
    const getXpathRunway = (label: string): string => {
      return `${this.popOverXPath}//div[contains(@class,'sb-flex') and descendant::label[normalize-space()='${label}']]//div[contains(@class,'sb-slider__runway')]`;
    };
    const getXpathTextBox = (label: string): string => {
      return `${this.popOverXPath}//div[contains(@class,'sb-flex') and descendant::label[normalize-space()='${label}']]//input[@max='200']`;
    };
    const inputValueMarginPadding = async (position: string, value: string): Promise<void> => {
      const selector = getXpathTextBox(position);
      const expectedSliderValue = this.genLoc(getXpathRunway(position)).locator(
        `.sb-slider__button[style*="${parseInt(value) / 2}%"]`,
      );
      await this.page.locator(selector).fill(value);
      await expectedSliderValue.waitFor();
    };

    await this.genLoc(
      `//div[contains(@data-widget-id,'${label}')]//div[contains(@class,'sb-popover__reference')]`,
    ).click();
    if (!data.input) {
      if (typeof data.top !== "undefined") {
        await this.editSliderBar(getXpathRunway("top"), topPercent);
      }
      if (typeof data.left !== "undefined") {
        await this.editSliderBar(getXpathRunway("left"), leftPercent);
      }
      if (typeof data.bottom !== "undefined") {
        await this.editSliderBar(getXpathRunway("bottom"), bottomPercent);
      }
      if (typeof data.right !== "undefined") {
        await this.editSliderBar(getXpathRunway("right"), rightPercent);
      }
    } else {
      if (typeof data.top !== "undefined") {
        await inputValueMarginPadding("top", data.top.toString());
      }
      if (typeof data.left !== "undefined") {
        await inputValueMarginPadding("left", data.left.toString());
      }
      if (typeof data.bottom !== "undefined") {
        await inputValueMarginPadding("bottom", data.bottom.toString());
      }
      if (typeof data.right !== "undefined") {
        await inputValueMarginPadding("right", data.right.toString());
      }
    }
    await this.titleBar.click();
  }

  /**
   * Hàm get selector sidebar theo tên
   * @param data
   * @returns
   */
  getSidebarSelectorByName({ sectionName, subLayerName, sectionIndex = 1, subLayerIndex = 1 }: LayerInfo): string {
    const layerSelector = `(//div[contains(@class,'layer-title') and normalize-space()='${sectionName}'])[${sectionIndex}]`;
    let btnSelector = layerSelector;
    if (subLayerName) {
      btnSelector = `(${layerSelector}/parent::div/following-sibling::div//div[contains(@class,'title') and normalize-space()='${subLayerName}'])[${subLayerIndex}]`;
    }
    return btnSelector;
  }

  /**
   * Get selector of item in layer panel
   * @param position
   */
  getSidebarSelectorByIndex(position: ElementPosition): string {
    let selector = `//div[@section-index="${position.section - 1}"]`;
    if (position.row) {
      selector += `//div[@data-row-index="${position.row - 1}"]`;
    }
    if (position.column) {
      selector += `//div[@data-column-index="${position.column - 1}"]`;
    }
    if (position.block) {
      selector = `(${selector}//div[@data-id and contains(@class,'w-builder__layer')])[${position.block}]`;
    }
    return selector;
  }

  /**
   * Get element from sidebar by id
   * @param id
   * @returns
   */
  getElementFromSidebarById(id: string) {
    return this.page.getByTestId(id);
  }

  getLocOfChildLayers(layer: LayerInfo) {
    const parentLoc = this.getSidebarSelectorByName(layer);
    return `${parentLoc}/parent::div/parent::div`;
  }

  getArrowBtnOfLayer(data: LayerInfo) {
    const layerSelector = this.getSidebarSelectorByName(data);
    return `${layerSelector}/preceding-sibling::div/button`;
  }

  /**
   * Hàm mở setting cho section, row, column, block
   * @param data
   */
  async openLayerSettings(data: LayerInfo) {
    const selector = this.getSidebarSelectorByName(data);
    await this.page.click(selector);
  }

  /**
   * Hàm expand Section, row, column
   * @param data
   */
  async expandCollapseLayer(data: LayerInfo) {
    const btnSelector = this.getArrowBtnOfLayer(data);
    const layerStatus = await this.page
      .locator(`${btnSelector}/ancestor::div[2]/following-sibling::div`)
      .getAttribute("style");
    if ((layerStatus && data.isExpand) || (!layerStatus && !data.isExpand)) {
      await this.page.click(btnSelector);
    }
  }

  /**
   * Hàm ẩn hiện layer section, row, column, block ở sidebar
   * @param data
   */
  async hideOrShowLayerInSidebar(data: LayerInfo) {
    const layerSelector = this.getSidebarSelectorByName(data);
    const layerStatus = await this.genLoc(
      `${layerSelector}/following-sibling::div/descendant::button[contains(@class,'hidden')]`,
    ).isVisible();
    const eyeBtn = this.genLoc(`${layerSelector}/following-sibling::div//button[@data-block-action='visible']`);
    if (data.isHide !== layerStatus) {
      await this.page.hover(layerSelector, { position: { x: 5, y: 5 } });
      await eyeBtn.click();
      // Hover to layer title to see layer status
      await this.page.hover("//div[contains(@class,'tab-heading')]");
    }
  }

  /**
   * Hàm xoá section, row, block theo tên và index nếu có tên trùng
   * @param layer tên layer muốn xoá
   */
  async removeLayer(layer: LayerInfo) {
    const layerLoc = this.getSidebarSelectorByName(layer);
    if (await this.removeBtn.isHidden()) {
      await this.genLoc(layerLoc).click();
    }
    await this.removeBtn.click();
  }

  /**
   * Hàm xoá section, row, block hiện tại đang được chọn
   */
  async removeCurrentLayer() {
    const removeBtn = this.page.locator(".w-builder__settings-remove button");
    await removeBtn.click();
  }

  /**
   * Hàm click Navigation bar trong web builder
   * @param button: tên button
   */
  async clickBtnNavigationBar(button: NavigationButtons) {
    await this.genLoc(XpathNavigationButtons[button]).click();
  }

  /**
   * Get message locator cạnh nút undo/redo khi có thay đổi
   * @returns
   */
  headerMessage(): Locator {
    return this.page.locator("div.w-builder__header-message");
  }

  /**
   * Hàm kéo thả các layer (section, row, column, block) ở sidebar web builder
   * @param param0
   */
  async dndLayerInSidebar({ from, to, pixel = 10 }: DnDLayerInSidebar) {
    const layerFrom = this.getSidebarSelectorByName(from);
    await this.genLoc(layerFrom).hover();
    const dragBtn = `${layerFrom}/following-sibling::div//span[contains(@class,'drag-handle')]`;
    let selectorTo = this.getSidebarSelectorByName(to);
    if (to.isExpand) {
      selectorTo = `${selectorTo}/parent::div/parent::div`;
    }
    await this.dragAndDropStepByStep(dragBtn, selectorTo, pixel);
  }

  /**
   * Drag and drop element step by step
   * @param selectorFrom
   * @param selectorTo
   * @param pixel
   */
  async dragAndDropStepByStep(selectorFrom: string | Locator, selectorTo: string | Locator, pixel = 10) {
    const coordinatesTo = { x: 0, y: 0 };
    const from = typeof selectorFrom === "string" ? this.page.locator(selectorFrom) : selectorFrom;
    const to = typeof selectorTo === "string" ? this.page.locator(selectorTo) : selectorTo;
    await from.hover();
    await this.page.mouse.down();
    const fromBox = await from.boundingBox();
    const toBox = await to.boundingBox();
    coordinatesTo.x = toBox.x + toBox.width / 2;
    coordinatesTo.y = toBox.y + toBox.height;

    let y = fromBox.y;
    if (fromBox.y < toBox.y) {
      while (y < coordinatesTo.y) {
        await this.page.mouse.move(coordinatesTo.x, y, { steps: 2 });
        y += pixel;
      }
    } else {
      coordinatesTo.y = toBox.y;
      while (y > coordinatesTo.y) {
        await this.page.mouse.move(coordinatesTo.x, y, { steps: 2 });
        y -= pixel;
      }
    }
    await this.page.mouse.move(coordinatesTo.x, coordinatesTo.y, { steps: 2 });
    await this.page.mouse.up();
  }

  /**
   * Drag drop item in accordion
   * @param from
   * @param to
   * @param callBack
   */
  async dndItemInSidebar({ from, to }: DnDLayerInSidebar) {
    const dragBtn = `(${this.xpathDragInSidebar})[${from.sectionIndex}]`;
    const selectorTo = `(//*[contains(@class, 'widget-list__item')])[${to.sectionIndex}]`;
    await this.dragAndDrop({ from: { selector: dragBtn }, to: { selector: selectorTo }, isHover: true });
  }

  /**
   * Hàm chọn overflow section, row
   * @param option
   * @returns
   */
  async selectOverflow(option: "show" | "hide" | "scroll"): Promise<void> {
    const OverflowOption = {
      show: 1,
      hide: 2,
      scroll: 3,
    };
    const btn = this.genLoc(this.getSelectorByLabel("overflow_y"))
      .locator(".widget-size__thickness")
      .locator("[class*=thickness-item]")
      .nth(OverflowOption[option] - 1);
    await btn.click();
  }

  /**
   * Hàm sửa tab Settings của section/block
   * @param data
   */
  async changeContent(data: LayerSettings) {
    await this.switchToTab("Content");
    if (data.data_source) {
      if (data.data_source.type === "usell") {
        await this.setBlockDataSource(data.data_source.config);
      } else {
        await this.selectDropDownDataSource("variable", data.data_source.config);
      }
    }
    if (data.heading) {
      await this.switchToggle("show_heading", data.heading.is_on);
    }
    if (data.button_action) {
      await this.selectDropDown("button_action", data.button_action);
    }
    if (typeof data.content != "undefined") {
      await this.inputTextBox("name", data.content);
    }
    if (data.icon) {
      await this.selectIcon("icon", data.icon);
    }
    if (data.image) {
      await this.uploadImage("image", data.image);
    }
    if (data.all_text) {
      await this.inputTextBox("alt", data.all_text);
    }
    if (data.action) {
      await this.selectDropDown("link", data.action);
    }
    if (data.target_url) {
      await this.inputTextBox("link", data.target_url);
    }
    if (data.new_tab) {
      await this.switchToggle("link", data.new_tab.is_on);
    }
    if (data.expand_first) {
      await this.switchToggle("expand_first", data.expand_first);
    }
    if (data.form) {
      await this.handleForm(data.form);
    }
    await this.titleBar.click({ delay: 300 });
  }

  /**
   * Hàm edit style layer
   * @param data
   */
  async changeDesign(data: LayerStyles) {
    let imgUrl: string;
    if (await this.genLoc("[class*=tab-navigation]").getByText("Design").isVisible()) {
      await this.switchToTab("Design");
    }

    if (data.style) {
      const styleBtn = this.genLoc(`[data-widget-id='style'] button span:text('${data.style}')`);
      await styleBtn.click();
    }
    if (data.position) {
      await this.selectDropDown(data.position.label, data.position.type);
    }
    if (data.ratio) {
      await this.selectDropDown(data.ratio.label, data.ratio.type);
    }
    if (data.content_position) {
      await this.clickOnElement(
        `:nth-match([data-widget-id=content_position] [class*=position-select] li, ${data.content_position.position})`,
      );
    }
    if (data.align) {
      await this.selectAlign(data.align.label, data.align.type);
    }
    if (data.width) {
      if (data.width.label === "full_width") {
        await this.switchToggle(data.width.label, data.width.is_on);
      } else {
        await this.settingWidthHeight(data.width.label, data.width.value);
      }
      await this.titleBar.click();
    }
    if (data.height) {
      await this.settingWidthHeight(data.height.label, data.height.value);
    }
    if (data.background) {
      imgUrl = await this.setBackground(data.background.label, data.background.value);
      await this.titleBar.click();
    }
    if (data.border) {
      await this.setBorder(data.border.label, data.border.value);
      await this.titleBar.click();
    }
    if (data.opacity) {
      await this.editSliderBar(data.opacity.label, data.opacity.config);
    }
    if (data.shadow) {
      await this.setShadow(data.shadow.label, data.shadow.config);
      await this.titleBar.click();
    }
    if (data.color) {
      data.color.label === "brand_color"
        ? await this.switchToggle(data.color.label, data.color.is_on)
        : await this.color(data.color.value, data.color.label);
    }
    if (data.padding) {
      await this.setMarginPadding(data.padding.label, data.padding.value);
      await this.titleBar.click();
    }
    if (data.margin) {
      await this.setMarginPadding(data.margin.label, data.margin.value);
      await this.titleBar.click();
    }
    if (data.radius) {
      await this.editSliderBar(data.radius.label, data.radius.config);
    }
    if (data.spacing) {
      if (data.spacing.is_fill) {
        await this.editSliderBar(data.spacing.label, { fill: true, number: data.spacing.value });
      } else {
        await this.editSpacing(data.spacing.label, data.spacing.value);
      }
    }
    if (data.shape) {
      await this.selectDropDown(data.shape.label, data.shape.type);
    }
    if (data.content_align) {
      await this.selectAlign("content_align", data.content_align);
    }
    if (data.overflow) {
      await this.selectOverflow(data.overflow);
    }
    if (data.heading_align) {
      await this.selectAlign("tab_justify", data.heading_align);
    }
    if (data.expand_icon) {
      await this.selectDropDown("expand_icon", data.expand_icon);
    }
    if (data.icon_position) {
      await this.selectAlign("icon_position", data.icon_position);
    }
    if (data.accordion_spacing) {
      await this.genLoc(this.getSelectorByLabel("spacing"))
        .locator("[class*=thickness-item]")
        .filter({ hasText: data.accordion_spacing })
        .click();
    }
    if (typeof data.accordion_divider !== "undefined") {
      await this.switchToggle("show_divider", data.accordion_divider);
    }
    if (data.display_as) {
      await this.selectDropDown("mode", data.display_as);
    }
    await this.titleBar.click({ delay: 200 });
    if (imgUrl) {
      return imgUrl;
    }
  }

  /**
   * Hàm get tên toàn bộ section có trong template để so sánh thứ tự
   * @returns
   */
  async getAllSectionName() {
    const sectionNames = [];
    const sectionCount = await this.genLoc("//div[@class='w-builder__layer-child']/preceding-sibling::div//p").count();
    for (let i = 1; i <= sectionCount; i++) {
      const sectionName = await this.genLoc(
        `(//div[@class='w-builder__layer-child']/preceding-sibling::div//p)[${i}]`,
      ).innerText();
      sectionNames.push(sectionName.trim());
    }
    return sectionNames;
  }

  /**
   * Get tên tất cả category name ở insert panel
   * @returns
   */
  async getAllCateInsertPanel() {
    const cateNames = [];
    await this.genLoc(this.cateInsertPanel).first().waitFor();
    const cateCount = await this.genLoc(this.cateInsertPanel).count();
    for (let i = 1; i <= cateCount; i++) {
      const cateName = await this.genLoc(`:nth-match(${this.cateInsertPanel}, ${i})`).innerText();
      cateNames.push(cateName.trim());
    }
    return cateNames;
  }

  /**
   * Hàm get tên tất cả template block/section trong cate
   * @returns
   */
  async getAllTemplatePreview() {
    const templateNames = [];
    let templateCount = 0;
    while (templateCount == 0) {
      templateCount = await this.genLoc(this.templatePreview).count();
    }
    for (let i = 0; i < templateCount; i++) {
      const templateName = await this.genLoc(this.templatePreview).nth(i).textContent();
      templateNames.push(templateName.trim());
    }
    return templateNames;
  }

  /**
   * Hàm get tên tất cả library filter trong insert panel
   */
  async getAllLibraryFilters() {
    const filters = [];
    if (await this.libraryFilterDropdown.isHidden()) {
      await this.libraryFilterBtn.click();
    }
    const filterCount = await this.libraryFilterOption.count();
    for (let i = 1; i <= filterCount; i++) {
      const filterName = await this.genLoc(`:nth-match([class$=filter-menu-item], ${i})`).textContent();
      filters.push(filterName.trim());
    }
    return filters;
  }

  getXpathSibarWithLabel(label: string): Locator {
    return this.genLoc(`(//label[normalize-space()='${label}']//following::div//input)[1]`);
  }

  /**
   * Hàm dùng để điền giá trị vào các field trong sidebar
   * @param label
   * @param value
   */
  async inputFieldInSidebarWithLabel(label: string, value: string) {
    await this.getXpathSibarWithLabel(label).fill(value);
    await this.getXpathSibarWithLabel(label).press("Enter");
  }

  /**
   * Hàm dùng để lấy giá trị trong các field trong sidebar
   * @param label
   * @param value
   */
  async getValueFieldInSidebarWithLabel(label: string) {
    return await this.getXpathSibarWithLabel(label).inputValue();
  }

  /**
   * Hàm get template trong category theo tên và index
   * @param category
   * @param template: tên đầy đủ hoặc chứa 1 phần
   */
  templateInCategory({ category, template, index = 1 }: InsertPanelTemplateLoc): Locator {
    const templateLoc =
      category === "Basics"
        ? `:nth-match(div[class*='insert-basic-preview'] p:has-text('${template}'), ${index})`
        : `nth-match(div[class*='insert-template-wrapper']:has(p:has-text('${template}')), ${index})`;
    return this.genLoc(templateLoc);
  }

  /**
   * Hàm gen locator các nút preset color theo index từ 1
   * @param index
   * @returns
   */
  colorPresetBtn(index: number): Locator {
    return this.genLoc(`:nth-match([class*=palette] span[class*=color], ${index})`);
  }

  /**
   * Hàm hover section, row, column, block on side bar
   * @param data
   */
  async hoverLayer(data: LayerInfo, webBuilder: WebBuilder) {
    const selector = webBuilder.getSidebarSelectorByName(data);
    await webBuilder.genLoc(selector).hover({ position: { x: 1, y: 1 } });
  }

  getSidebarArea(name: "header" | "body" | "footer" | "sales page"): Locator {
    const locator =
      name === "sales page" ? this.genLoc(".w-builder__layers-content") : this.genLoc(`.w-builder__layers-${name}`);
    return locator;
  }

  // ================Select from templates popup ===============
  //TODO: Select template popup
  /**
   * Hàm dùng để search templates theo key search
   * @param searchKey
   */
  async searchForTemplates(searchKey: string) {
    await this.page.locator(".sb-choose-template-v2__filter__search .sb-icon >> nth=0").click();
    await this.page.fill("//div[contains(@class,'filter__search')]//input", searchKey);
  }

  /**
   * Hàm mở filters
   * @param filter
   */
  async openFilters(filter: "library" | "tag") {
    const selector =
      filter === "library" ? "#filtersEl button.sb-choose-template__library-btn" : "#filtersEl button:has-text('Tags')";
    await this.page.click(selector);
  }

  /**
   * Hàm select hoặc deselect filters
   * @param data
   */
  async selectFilters(data: FiltersInfo) {
    if (data.library) {
      const libraryFilter = this.genLoc(`//p[normalize-space()='${data.library}']`);
      const libraryOpened = await this.genLoc("//div[contains(@class,'filter__libraries')]").isVisible();
      if (!libraryOpened) {
        await this.page.click("//div[@id='filtersEl']//button[contains(@class,'template__library-btn')]");
      }
      if (libraryFilter.isHidden()) {
        await scrollUntilElementIsVisible({
          page: this.page,
          scrollEle: this.genLoc("//div[contains(@class,'filter__libraries')]/parent::div"),
          viewEle: libraryFilter,
        });
      }
      const isChecked = await this.genLoc(`//div[normalize-space()='${data.library}']//img`).isVisible();
      if (isChecked !== data.isSelect) {
        await libraryFilter.click();
      }
    }
    if (data.tags) {
      const tagsOpened = await this.genLoc("//div[contains(@class,'filter__tags')]").isVisible();
      if (!tagsOpened) {
        await this.page.click("//span[@class='sb-button--label' and normalize-space()='Tags']");
      }
      for (const tag of data.tags) {
        const tagFilter = this.genLoc(`//label[contains(@class,'filter__tag') and normalize-space()='${tag}']`);
        if (tagFilter.isHidden()) {
          await scrollUntilElementIsVisible({
            page: this.page,
            scrollEle: this.genLoc("//div[contains(@class,'choose-template-filter__tags')]/parent::div"),
            viewEle: tagFilter,
          });
        }
        const isChecked = await this.page
          .locator(`//label[contains(@class,'filter__tag') and normalize-space()='${tag}']//span[@class='sb-check']`)
          .isChecked();
        if (data.fill) {
          await this.page.fill("(//div[contains(@class,'filter__input')])[2]//input", tag);
        }
        if (isChecked !== data.isSelect) {
          await this.page.click(`//label[contains(@class,'filter__tag') and normalize-space()='${tag}']`);
        }
      }
      // Close tags filter after finished
      await this.page.click("//span[@class='sb-button--label' and normalize-space()='Tags']");
    }
  }

  /**
   * Click tag ở template để select tag filter
   * @param templateName
   * @param tag
   */
  async clickTagOnTemplate(templateName: string, tag: string) {
    await this.page.click(
      `//p[@title='${templateName}']/following::div[1]/descendant::div[contains(@class,'tag__caption') and normalize-space()='${tag}']`,
    );
  }

  /**
   * Hàm remove tất cả các tags đã được apply trước đó
   */
  async removeAllTags() {
    const tagsOpened = await this.genLoc("//div[contains(@class,'filter__tags')]").isVisible();
    if (!tagsOpened) {
      await this.page.click("//span[@class='sb-button--label' and normalize-space()='Tags']");
    }
    const tagsCount = await this.genLoc("//span[normalize-space()='Tag:']/following-sibling::div").count();
    for (let i = 0; i < tagsCount; i++) {
      await this.page.click(`(//span[normalize-space()='Tag:']/following-sibling::div/span)[${i + 1}]`);
    }
  }

  /**
   * Hàm tương tác với template trong popup Select from templates
   * @param action Hành động tương tác template
   * @param title Tên template
   */
  async interactWithTemplate(action: "Preview" | "Apply", title?: string) {
    const templateThumbnail = this.genLoc(`//p[@title='${title}']/preceding-sibling::figure`);
    const previewBtn = this.genLoc(`//p[@title='${title}']/preceding-sibling::figure//a`);
    const applyBtn = this.genLoc(`//p[@title='${title}']/preceding-sibling::figure//button`);
    await templateThumbnail.hover();
    const actionBtn = action === "Preview" ? previewBtn : applyBtn;
    await actionBtn.click();
  }

  /**
   * Hàm tương tác trong màn preview template
   * @param action
   */
  async actionInPreviewTemplate(action: PreviewTemplateActions) {
    switch (action) {
      case "Back":
        await this.genLoc(`//a[normalize-space()='${action} to templates']`).click();
        break;
      case "Desktop":
      case "Mobile":
        await this.page.getByTestId(action.toLowerCase()).click();
        break;
      case "Apply":
        await this.genLoc(`//button[normalize-space()='${action} this template']`).click();
        break;
    }
  }

  /**
   * Hàm mở web builder theo nhiều cách
   * @param type mở 3 loại web builder sale page/ offer/page
   * @param id khi mở sale page và offer page thì nhập product id, page nhập page id
   * @param productId
   * @param offer cần thiết khi mở từ offer
   * @param offerIndex vì tên offer ko đổi -> thêm index để tìm chính xác selector default pick offer đầu tiên
   * @param themeId shop theme id lấy ở extension
   * @param layout khi vào từ custom template -> đường dẫn là page, default sẽ là site
   */
  async openWebBuilder({
    type,
    id,
    productId,
    offer = "upsell",
    offerIndex = 1,
    page = "home",
    layout = "custom",
  }: OpenWebBuilder) {
    let openBtn: Locator;
    const upsellDesignOffer = this.genLoc(
      `(//div[@class='offers-group__container'])[${offerIndex}]//div[contains(@class,'offer__container')][1]//button[normalize-space()='Design offer']`,
    );
    const downsellDesignOffer = this.genLoc(
      `(//div[@class='offers-group__container'])[${offerIndex}]//div[contains(@class,'offer__container')][2]//button[normalize-space()='Design offer']`,
    );
    const templateType = layout === "custom" ? "page" : "site";
    switch (type) {
      case "sale page":
        openBtn = this.page.getByRole("button", { name: "Design Sales Page" });
        await this.goto(`/admin/creator/products/${id}`);
        break;
      case "offer":
        openBtn = offer === "upsell" ? upsellDesignOffer : downsellDesignOffer;
        await this.goto(`/admin/creator/products/${id}?tab=checkout`);
        break;
      case "page":
        openBtn = this.genLoc("//button[normalize-space()='Customize']");
        await this.goto(`/admin/pages/${id}`);
        break;
      case "ecom product custom":
        await this.goto(`/admin/builder/${templateType}/${id}?page=product&id=${productId}&isSbProduct=true`);
        return;
      case "site":
        await this.goto(`/admin/builder/site/${id}?page=${page}`);
        return;
    }
    await openBtn.click();
    await this.page.waitForSelector("//h4[normalize-space()='Layers']");
    if (type === "sale page") {
      // Make sure Webfront fully loaded
      await this.reloadIfNotShow();
    } else {
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * Tương tác với button trong popup confirm khi chưa save
   * @param button
   */
  async clickBtnInConfirmPopup(button: "Stay" | "Leave" | "x" | "Import" | "Discard") {
    const buttonXpath =
      button === "x" ? "//button[contains(@class,'popup__header-close')]" : `//button[normalize-space()='${button}']`;
    await this.page.click(buttonXpath);
  }

  /**
   * Get xpath
   * @param text
   * @param selector
   */
  getXpathByText(text: string, selector?: string, index = 1) {
    if (selector) {
      return `(${selector}//*[contains(text(),'${text}')])[${index}]`;
    } else return `(//*[contains(text(),'${text}')])[${index}]`;
  }

  /**
   * Get switch tab web/ page style
   * @param type
   */
  async switchTabWebPageStyle(type: "Web" | "Page") {
    const overrideBtn = this.genLoc(WebsitePageStyle["overrideStyle"]);
    // Open website or page style from header
    await this.genLoc(XpathNavigationButtons["styling"]).click();
    await this.genLoc("[class$=header-center]").hover(); // Hiển thị tooltip che mất 2 tab -> hover đi chỗ khác
    const overrideStyleStatus = await this.genLoc(WebsitePageStyle["overrideStyle"]).getAttribute("class");
    switch (type) {
      case "Web":
        if (overrideStyleStatus.includes("active")) {
          await overrideBtn.click();
        }
        await this.switchToTab("Website styles");
        break;
      case "Page":
        await this.switchToTab("Page styles");
        if (!overrideStyleStatus.includes("active")) {
          await overrideBtn.click();
        }
    }
  }

  /**
   * Select position icon in block button
   * @param position
   */
  async selectButtonIcon(position: string) {
    if (position.toLowerCase() == "none") {
      await this.genLoc(
        "//*[contains(@data-widget-id , 'icon_position')]//*[local-name()='g' and @id='Icons/Eye-Cross']",
      ).click();
    } else
      await this.genLoc(
        `//*[contains(@data-widget-id , 'icon_position')]//label[normalize-space() ='${position}']`,
      ).click();
  }

  /**
   * Count so row co trong 1 section on sidebar
   * @param sectionIndex
   * @returns
   */
  async countRowInSection(sectionIndex: number) {
    const rowCount = await this.genLoc(
      `(//div[contains(@class, 'w-builder__layer-child')])[${sectionIndex}]//p[normalize-space()='Row']`,
    ).count();
    return rowCount;
  }

  async clickOnElementInIframe(iframe: FrameLocator, selector: string): Promise<void> {
    await iframe.locator(selector).click({ position: { x: 1, y: 1 } });
  }

  /**
   * Click on a layer inside iframe (preview) base on its index
   * @param sectionIndex index of section inside iframe
   * @param blockIndex index of block inside section
   */
  clickOnLayerInIframe = async (sectionIndex = 1, blockIndex?: number) => {
    let selector = `(${XpathLayer.section})[${sectionIndex}]`;
    if (blockIndex) {
      selector = `(${selector}${XpathLayer.block})[${blockIndex}]`;
    }

    const locator = this.frameLocator.locator(selector);
    await locator.scrollIntoViewIfNeeded();
    await locator.click({ position: { x: 1, y: 1 } });
  };

  async hoverElementInIframe(iframe: FrameLocator, selector: string, dashboard: Page): Promise<void> {
    const box = await iframe.locator(selector).boundingBox();
    await dashboard.mouse.move(box.x + 2, box.y + 2);
  }

  hyperlinkText(text: string): Locator {
    return this.frameLocator.locator("a[target=_blank]").filter({ hasText: text });
  }

  /**
   * Ham customize publish theme tai dashboard
   * @param dashboard
   * @param domain
   */
  async openCustomizeTheme(dashboard: Page, domain: string) {
    await dashboard.goto(`https://${domain}/admin/themes/`);
    await dashboard
      .locator("//div[contains(@class,'sb-block-item__content')]//button[normalize-space()='Customize']")
      .first()
      .click();
    //wait icon loading hidden
    await dashboard.locator(".w-builder__preview-overlay").waitFor({ state: "hidden" });
  }

  /**
   * Setting type for Account block
   * @param index
   */
  async selectTypeOfAccountBar(index = 1) {
    const xpathValue = "(//span[@class='w-builder__widget--select-item'])";
    await this.page.click("//div[@data-widget-id='type']//div[contains(@class,'sb-popover__reference')]");
    await this.page.click(xpathValue + `[${index}]`);
  }

  /**
   * function get locator of item on list page
   * @param listName
   * @returns
   */
  itemOnPageList = (listName: string) => {
    return `//div[contains(., '${listName}')]/ancestor::div[contains(@class, 'w-builder__page-groups')]//div[contains(@class,'w-builder__page-groups--item-label')]`;
  };
  /**
   * function get xpath of group item
   * @param listName
   * @returns
   */
  groupItemXpath = (listName: string) => {
    return `//div[contains(., '${listName}')]/ancestor::div[contains(@class, 'w-builder__page-groups')]//div[@class='w-builder__page-groups--list']`;
  };
  /**
   * function get locator of button collape/expand of each list page
   * @param listName
   * @returns
   */
  collapseButtonXpath = (listName: string) => {
    return `//div[contains(., '${listName}')]/ancestor::div[contains(@class, 'w-builder__page-groups')]//button`;
  };

  /**
   * Add member pages for account block
   * @param pages
   */
  async addMemberPages(pages: string) {
    const listPage = pages.split(",").map(item => item.trim());
    await this.clickElementWithLabel("span", "Add member pages");
    await this.page.waitForTimeout(2000);
    for (let i = 0; i < listPage.length; i++) {
      await this.verifyCheckedThenClick(
        `//div[normalize-space()='${listPage[i]}']//ancestor::div[contains(@class,'sb-selection-item')]//label`,
        true,
      );
    }
    await this.clickOnBtnWithLabel("Apply");
  }

  /**
   * Remove member pages of account block
   * @param pages
   */
  async removeMemberPages(pages: string) {
    const listPage = pages.split(",").map(item => item.trim());
    for (let i = 0; i < listPage.length; i++) {
      await this.page.click(`(//div[normalize-space()='${listPage[i]}']//parent::div//*[name()='svg'])[2]`);
    }
  }

  /**
   * Duplicate member pages of account block
   * @param pages
   */
  async duplicateMemberPages(pages: string) {
    const listPage = pages.split(",").map(item => item.trim());
    for (let i = 0; i < listPage.length; i++) {
      await this.page.click(`(//div[normalize-space()='${listPage[i]}']//parent::div//*[name()='svg'])[1]`);
    }
  }

  /**
   * Setting product search block in tab setting
   * @param setting
   */
  async settingProductSearch(setting: SettingProductSearch) {
    let xpathIconItem;
    if (setting.type) {
      if (setting.type == "Search bar") {
        xpathIconItem = "icon-search-bar";
      } else {
        xpathIconItem = "icon-search-line";
      }
      await this.page.click("(//div[contains(@class,'sb-popover__reference')]//button)[1]");
      await this.page.click(
        `//span[contains(@class, 'widget-select__item')]//span[contains(@class, '${xpathIconItem}')]`,
      );
    }
    if (setting.size) {
      await this.genLoc(
        `//div[contains(@class, 'widget-size__thickness-item')]//label[normalize-space()='${setting.size}']`,
      ).click();
    }

    if (setting.icon) {
      await this.page.click("(//div[contains(@class,'sb-popover__reference')]//button)[2]");
      await this.page.click(`(//span[@class='widget-icon__item']//i[normalize-space()='${setting.icon}'])[1]`);
    }
    if (setting.placeholder) {
      await this.clearInPutData(
        "//label[normalize-space()='Placeholder']//ancestor::div[@data-widget-id='placeholder']//input[@type='string']",
      );
      await this.page.fill(
        "//label[normalize-space()='Placeholder']//ancestor::div[@data-widget-id='placeholder']//input[@type='string']",
        setting.placeholder,
      );
      await this.page.click(".w-builder .w-builder__settings-list");
      await this.page.waitForTimeout(1000);
    }
    if (setting.button) {
      await this.switchToTab("Content");
      const getStatus = await (
        await (await this.page.locator("//div[@data-widget-id='button']//input").elementHandle()).getProperty("checked")
      ).jsonValue();
      if (getStatus !== true) {
        await this.page.click("//div[@data-widget-id='button']//span[contains(@class,'sb-switch__switch')]");
        if (setting.button_label) {
          await this.clearInPutData("//div[@data-widget-id='button_label']//input[@type='string']");
          await this.page.fill("//div[@data-widget-id='button_label']//input[@type='string']", setting.button_label);
          await this.page.click("//div[@data-widget-id='button_label']//label");
        }
      } else {
        if (setting.button_label) {
          await this.clearInPutData("//div[@data-widget-id='button_label']//input[@type='string']");
          await this.page.fill("//div[@data-widget-id='button_label']//input[@type='string']", setting.button_label);
          await this.page.click("//div[@data-widget-id='button_label']//label");
        }
      }
    }
  }

  /**
   * Handle form data
   * @param setting
   */
  async handleForm(setting: FormStyleSettings) {
    if (setting.form_title) {
      await this.inputTextBox("form_title", setting.form_title);
    }

    if (setting.save_as) {
      await this.selectDropDown("save_as", setting.save_as);
    }

    if (setting.save_email) {
      await this.inputTextBox("save_email", setting.save_email);
    }

    if (setting.after_submit) {
      await this.selectDropDown("after_submit", setting.after_submit);
    }

    if (setting.coupon) {
      await this.inputTextBox("coupon", setting.coupon);
    }

    if (setting.submit_message) {
      await this.inputTextBox("submit_message", setting.submit_message);
    }

    if (setting.submit_url) {
      await this.inputTextBox("submit_url", setting.submit_url);
    }

    if (setting.button_label) {
      await this.inputTextBox("button_label", setting.button_label);
    }

    if (setting.opt_in_option) {
      await this.switchToggle("opt_in", setting.opt_in_option);
    }

    if (setting.fields) {
      await this.handleFields(setting.fields);
    }
  }

  getSelectorFormByName(name: string) {
    return `${this.getSelectorByLabel(
      "fields",
    )}//div[contains(@class, 'w-builder__form--item') and contains(normalize-space(), '${name}')][1]`;
  }

  getSelectorFormFieldByLabel(label: string) {
    return `//div[contains(@class, 'w-builder__form-popover')]//div[contains(@class, 'sb-form-item') and contains(normalize-space(), '${label}')]`;
  }

  async clickFormAction(name: string, action: string) {
    let selector;
    switch (action) {
      case "edit":
        selector = `${this.getSelectorFormByName(name)}/span[1]`;
        break;
      case "delete":
        selector = `${this.getSelectorFormByName(name)}/button[1]`;
        break;
    }
    if (selector) {
      await this.page.click(selector);
    }
  }

  async inputForm(label: string, text: string) {
    const elements = await this.genLoc(
      `${this.getSelectorFormFieldByLabel(label)}//input[@class='sb-input__input']`,
    ).elementHandles();
    for await (const element of elements) {
      if (!(await element.isVisible())) {
        continue;
      }
      await element.fill(text);
    }
  }

  async handleOptions(options: Array<string>, index = 1) {
    // count options
    const count = await this.genLoc(`${this.formScrollablePopoverSelector}/div`).count();
    const diff = options.length - count;

    // add options
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        await this.clickOnBtnWithLabel("Add option", index);
      }
    } else if (diff < 0) {
      // remove options
      for (let i = 0; i < Math.abs(diff); i++) {
        const locator = this.genLoc(`(${this.formScrollablePopoverSelector}/div//button)[1]`);
        if (!(await locator.isVisible())) {
          continue;
        }

        await locator.click();
      }
    }
    for await (const [index, option] of options.entries()) {
      const locator = this.genLoc(
        `(${this.formScrollablePopoverSelector}//label[contains(normalize-space(), 'Option ${
          index + 1
        }')]/following-sibling::div//input)[1]`,
      );
      if (!(await locator.isVisible())) {
        continue;
      }
      await locator.fill(option);
    }
  }

  async handleFields(fields: Array<FormFieldSetting>) {
    // Clear all field first
    const removeButtonSelector = `${this.getSelectorByLabel(
      "fields",
    )}//div[contains(@class, 'w-builder__form--item')]/button[1]`;
    for (const el of await this.genLoc(removeButtonSelector).elementHandles()) {
      await el.click();
    }

    // Update email field
    const emailField = fields.find(field => field.name === "Email");
    await this.clickFormAction(emailField.name, "edit");
    if (emailField.label) {
      await this.inputForm("Label", emailField.label);
    }
    if (emailField.placeholder) {
      await this.inputForm("Placeholder", emailField.placeholder);
    }
    await this.switchToTab("Content");
    let optionNum = 0;
    for await (const field of fields.filter(field => field.name !== "Email")) {
      await this.clickOnBtnWithLabel("Add field");
      await this.clickOnBtnWithLabel(field.name);
      await this.clickFormAction(field.name, "edit");
      if (field.label) {
        await this.inputForm("Label", field.label);
      }
      if (field.placeholder) {
        await this.inputForm("Placeholder", field.placeholder);
      }
      if (field.options) {
        optionNum++;
        await this.handleOptions(field.options, optionNum);
      }
      await this.switchToTab("Content");
    }
  }

  /**
   * Click icon website setting in website buider
   * */
  async clickIconWebsiteSetting() {
    await this.page.click("(//header//div[contains(@class,'w-builder__header-left')]//button)[5]");
    await this.page.waitForSelector("//h4[normalize-space()='Website Settings']");
  }

  /**
   * Choose category setting
   * @param categoryName name category setting
   * */
  async clickCategorySetting(categoryName: string) {
    await this.page.click(`//div[contains(@class,"w-builder__styles")]//p[normalize-space()="${categoryName}"]`);
  }

  /**
   * Edit setting general
   * @param infoSettingGeneral info edit: logo,favicon,description,title,password,script header,script body
   */
  async editGeneralSetting(infoSettingGeneral: SettingGeneral) {
    if (infoSettingGeneral.logo) {
      await this.genLoc(
        "//div[@data-widget-id='logo']//div[@class='sb-flex sb-pointer sb-popover__reference']",
      ).click();
      await this.page.setInputFiles(
        "//div[@id='widget-popover' and not(contains(@style,'none'))]//input[@type='file']",
        infoSettingGeneral.logo,
      );
      await this.waitForElementVisibleThenInvisible("//div[@class='sb-image__loading sb-absolute']");
      await this.genLoc(
        "//div[@data-widget-id='logo']//div[@class='sb-flex sb-pointer sb-popover__reference']",
      ).click();
    }
    if (infoSettingGeneral.favicon) {
      await this.genLoc(
        "//div[@data-widget-id='favicon']//div[@class='sb-flex sb-pointer sb-popover__reference']",
      ).click();
      await this.page.setInputFiles(
        "//div[@id='widget-popover' and not(contains(@style,'none'))]//input[@type='file']",
        infoSettingGeneral.favicon,
      );
      await this.waitForElementVisibleThenInvisible("//div[@class='sb-image__loading sb-absolute']");
      await this.genLoc(
        "//div[@data-widget-id='favicon']//div[@class='sb-flex sb-pointer sb-popover__reference']",
      ).click();
    }
    if (infoSettingGeneral.description) {
      await this.genLoc("//div[@data-widget-id='homepage_meta_desc']//input[@type='string']").fill(
        infoSettingGeneral.description,
      );
    }
    if (infoSettingGeneral.title) {
      await this.genLoc("//div[@data-widget-id='homepage_title']//input[@type='string']").fill(
        infoSettingGeneral.title,
      );
    }
    if (infoSettingGeneral.password) {
      await this.genLoc("//div[@data-widget-id='password']//input[@type='string']").fill(infoSettingGeneral.password);
    }
    if (infoSettingGeneral.enable_password) {
      await this.genLoc(
        "//div[@data-widget-id='enable_password']//span[@class='sb-switch__switch sb-relative is-default']",
      ).check();
    }
    if (infoSettingGeneral.additional_scripts_body) {
      await this.genLoc("//div[@data-widget-id='scripts_body']//textarea").fill(
        infoSettingGeneral.additional_scripts_body,
      );
    }
    if (infoSettingGeneral.additional_scripts_head) {
      await this.genLoc("//div[@data-widget-id='scripts_head']//textarea").fill(
        infoSettingGeneral.additional_scripts_head,
      );
    }
  }

  /**
   * Get xpath tab Setting by labelName
   * @param labelName
   *
   */
  xpathTitlePageSettingWithLabel(labelName: string): string {
    return `//div[@class='setting-page__title' and normalize-space()='${labelName}']`;
  }

  /**
   * click page in list page
   * @param name: page name
   * @returns void
   */
  async clickPageByName(name: string, index = 1): Promise<void> {
    await this.clickElementWithLabel("div", name, index);
    await this.genLoc(XpathBlock.overlay).waitFor({ state: "hidden" });
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * select product to preview after select
   * @param name: product name
   * @returns void
   */
  async selectProductPreviewByName(name: string): Promise<void> {
    await this.page.click("//div[contains(@class,'w-builder__autocomplete')]");

    const selectLocator = this.page.locator("//div[contains(@class,'w-builder__autocomplete__wrap')]");
    await selectLocator.waitFor({ state: "visible" });
    await selectLocator.locator('//input[@placeholder="Search products"]').fill(name);
    await selectLocator.locator("//div[contains(@class,'sb-autocomplete--loading-dots')]").waitFor({ state: "hidden" });

    await this.genLoc("div.sb-selection-item").filter({ hasText: name }).click();
    await this.page
      .frameLocator(XpathBlock.frameLocator)
      .locator(XpathBlock.progressBar)
      .waitFor({ state: "detached" });
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * click section page by selector
   * @param selector: xpath in section
   */
  async clickSectionOnPage(selector: string, option = {}, changeDesign = false): Promise<void> {
    await this.frameLocator.locator(selector).click(option);
    if (changeDesign) {
      await this.page.locator(`//div[contains(text(),"Design")]`).click();
    }
  }

  /**
   * get xpath block
   * @param name: component name
   */
  async getSelectorComponentByName(name: string, index = 1): Promise<string> {
    return `(//div[contains(@data-block-component,'${name}')])[${index}]`;
  }

  /**
   * Remove a layer inside iframe by click Delete on quickbar
   * @param section contain info of section
   */
  removeLayerInIframe = async (sectionIndex?: number, blockIndex?: number) => {
    if (!sectionIndex) {
      return;
    }

    await this.clickOnLayerInIframe(sectionIndex, blockIndex);
    await this.selectOptionOnQuickBar("Delete");
  };

  /**
   * remove exist block
   * @param component: component name, elementPosition: block position
   */
  async removeExistBlock(component: string, elementPosition: ElementPosition): Promise<void> {
    const componentXpath = await this.getSelectorComponentByName(component);
    try {
      await this.frameLocator.locator(componentXpath).waitFor({ state: "visible", timeout: 5000 });
    } catch (e) {
      return;
    }
    await this.clickSectionOnPage(this.getSelectorByIndex(elementPosition));
    await this.clickOnBtnWithLabel("Delete block");
  }

  /**
   * click Add block button from webfront
   * @param layer
   * @param sectionIndex
   * @param columnIndex
   */
  async clickAddBlockBtn(
    layer: "header" | "body" | "content" | "footer",
    sectionIndex: number,
    columnIndex = 1,
  ): Promise<string> {
    const id = await this.genLoc(`.w-builder__layers-${layer} [section-index="${sectionIndex - 1}"]`).getAttribute(
      "data-id",
    );
    await this.frameLocator.locator(`section[id="${id}"]`).hover();
    await this.frameLocator
      .locator(`section[id="${id}"] div.column`)
      .nth(columnIndex - 1)
      .hover();
    await this.frameLocator.locator(`section[id="${id}"] .indicator-block-content`).waitFor();
    await this.frameLocator.locator(`section[id="${id}"] .indicator-block-content`).click({ delay: 300 });
    const insertPanel = await this.page.waitForSelector("#website-builder .w-builder__insert-previews");
    await insertPanel.waitForElementState("stable");
    return id;
  }

  /**
   * Click section, row, column, block theo id
   * @param id : là value của attribute data-id heading title bên sidebar khi chọn 1 layer bất kỳ
   * @param position
   */
  async selectElementInPreviewById(id: string, position = { x: 1, y: 1 }): Promise<void> {
    const ele = this.frameLocator.locator(`[id='${id}'], [data-block-id='${id}']`);
    await ele.click({ position: position });
  }

  /**
   * Hàm search product trong droplist ở navigation page product detail web builder
   * @param productName : tên product cần tìm
   */
  async searchProductPreview(productName: string) {
    const xpathSearch = this.page.locator("//input[@placeholder='Search products']");
    const xpathLoading = await this.genLoc("(//span[@class='sb-mr-xs sb-autocomplete--loading-dots'])[1]").isVisible();
    await xpathSearch.focus();
    await xpathSearch.fill(productName);
    if (xpathLoading) {
      await this.waitUntilElementInvisible("(//span[@class='sb-mr-xs sb-autocomplete--loading-dots'])[1]");
    }
  }

  /**
   * Xóa keyword đã nhập ở thanh search page product detail web builder
   */
  async deleteKeySearch() {
    const xpathSearch = this.page.locator("//input[@placeholder='Search products']");
    await xpathSearch.focus();
    await this.page.keyboard.press("Control+A");
    await this.page.keyboard.press("Backspace");
  }

  /**
   * Get xpath của entity trong droplist product chọn để preview page product detail web builder
   * @param entityName : tên của entity, example: product name, collection name, ..
   * @returns
   */
  getXpathEntityInList(entityName: string): string {
    return `//div[contains(@aria-describedby,'sb-tooltip') and normalize-space()='${entityName}']`;
  }

  /**
   * Get xpath action tab content block button
   * @param action
   */
  getXpathActionBlockButton(action: string): string {
    return `//*[@data-select-label='${action}']`;
  }

  /**
   * Set variable for section
   * @param sectionIndex
   * @param sourceType : type of source - exp: Shop|Product|Collection|Blog|Blog post
   * @param sourceData : data of source - exp: product name, collection name
   */
  async setVariableForSection(options: {
    sectionName: string;
    sourceType: string;
    sourceData?: string;
    sectionIndex?: number;
    sectionFrameXpath?: string;
  }): Promise<void> {
    const { sectionName, sourceType, sourceData, sectionIndex, sectionFrameXpath } = options;
    if (sectionFrameXpath) {
      await this.frameLocator.locator(sectionFrameXpath).click({ position: { x: 1, y: 1 } });
    } else {
      await this.openLayerSettings({
        sectionName: sectionName,
        sectionIndex: sectionIndex,
      });
    }

    await this.switchToTab("Content");
    await this.page.locator("[id='search-data-source']").click();

    if (await this.page.locator(".search-source__search-bar button").isVisible()) {
      await this.page.locator(".search-source__search-bar button").click();
    }

    switch (sourceType) {
      case "Current page":
        await this.page.locator(`[class='list-source'] span:has-text('${sourceType}')`).click();
        await this.page.waitForSelector(`[id="search-data-source"] span:has-text('${sourceType}')`);
        break;
      case "Shop":
        await this.page.locator(`[class='list-source'] span:text-is('None')`).click();
        await this.page.waitForSelector(`[id="search-data-source"] span:text-is('None')`);
        break;
      case "Product":
      case "Collection":
      case "Blog":
      case "Blog post":
        await this.page.locator(`[class='list-source'] span:text-is('${sourceType}')`).click();
        if (sourceData) {
          await this.page.locator(".search-source__search-bar input").fill(`${sourceData}`);
          await this.page.locator(`.list-search-result .source-result-title:text-is('${sourceData}')`).click();
          await this.page.waitForSelector(`[class="data-source-title connected"]:text-is('${sourceData}')`);
        } else {
          await this.page.locator(`.list-search-result .source-result-title`).first().click();
          await this.page.waitForSelector(`[class="data-source-title connected"]`);
        }
        break;
    }

    if (sourceType == "Product") {
      await this.page.waitForSelector(".w-builder__widget--label label:text-is('Default variant')");
    }
  }

  /**
   * Edit link social in block social
   * @param label: label social
   * @param link: link social
   */
  async editSocialLink(label: string, link: Link): Promise<void> {
    const inputSocialLink = async (label, content) => {
      await this.page
        .locator(
          `//*[@id="widget-popover"]//label[contains(., '${label}')]/ancestor::div[2]//input[@class='sb-input__input']`,
        )
        .last()
        .click();
      await this.page
        .locator(
          `//*[@id="widget-popover"]//label[contains(., '${label}')]/ancestor::div[2]//input[@class='sb-input__input']`,
        )
        .last()
        .fill(content);
    };
    await inputSocialLink("Label", label);
    await inputSocialLink("Link", link.url);
    await this.page.click(".w-builder__settings .w-builder__tab-heading");
  }

  /**
   * Add link social in block social
   * @param label: label social
   * @param link: link social
   */
  async addSocialLink(label: string, link: Link): Promise<void> {
    const inputSocialLink = async (label, content) => {
      await this.page
        .locator(
          `//*[@id="widget-popover"]//label[contains(., '${label}')]/ancestor::div[2]//input[@class='sb-input__input']`,
        )
        .last()
        .click();
      await this.page
        .locator(
          `//*[@id="widget-popover"]//label[contains(., '${label}')]/ancestor::div[2]//input[@class='sb-input__input']`,
        )
        .last()
        .fill(content);
    };
    await inputSocialLink("Label", label);
    await inputSocialLink("Social link", link.url);
    await this.page.click(".w-builder__settings .w-builder__tab-heading");
  }

  getXpathDeleteSocial = (index: number): string => {
    return `(//div[contains(@class, 'widget-social__item-wrapper')])[${index}]//*[@id="Icons/Trash"]//ancestor::span`;
  };

  async selectIconAlign(value: "Left" | "Center" | "Right") {
    const parentSelector = "//div[@class='sb-flex sb-flex-align-center']";
    let index = 1;
    if (value === "Center") {
      index = 2;
    }
    if (value === "Right") {
      index = 3;
    }
    await this.genLoc(`(${parentSelector}//span)[${index}]`).click();
  }

  /**
   * Select page on page selector
   */
  async selectPageOnPageSelector(pageName: string) {
    await this.page.locator('header [name="Pages"]').click();
    await this.page.locator(`.w-builder__page-container .sb-text-caption:text-is('${pageName}')`).click();
  }

  /**
   * verify các option có hiển thị trên dropdown
   * @param options
   */
  async isDropdownItemsVisible(options: string[]): Promise<boolean> {
    let result: boolean;
    for (const option of options) {
      const xpath = `//*[@data-select-label="${option}"]`;
      result = await this.isElementExisted(xpath);
      if (result == false) {
        break;
      }
    }
    return result;
  }

  /**
   * Click save button and wait message on toast disappear
   */

  clickSaveButton = async (): Promise<void> => {
    await this.page.waitForTimeout(3 * 1000);
    const isSaveButtonEnabled = await this.genLoc("//button[normalize-space()='Save']").isEnabled({
      timeout: 3000,
    });
    if (isSaveButtonEnabled) {
      await this.clickBtnNavigationBar("save");
      await this.page.waitForSelector(this.msgSaveSuccess, { state: "visible" });
      await this.page.waitForSelector(this.msgSaveSuccess, { state: "hidden" });
    }
    await this.page.waitForTimeout(2 * 1000);
  };

  /**
   * Click save button on header
   * @param delay wait until message on header is disappear
   */
  clickSave = async (delay = true) => {
    const headerMessage = this.page.locator("div.w-builder__header-message");
    await headerMessage.getByText("Unsaved changes").waitFor();

    await this.page.locator(this.xpathHeaderSaveBtn).click();

    const savedNotify = headerMessage.getByText("All changes are saved");
    await savedNotify.waitFor();
    if (delay) {
      await savedNotify.waitFor({ state: "detached" });
    }
  };

  /**
   * Click Preview button
   *
   */
  clickPreview = async ({ context, dashboard }): Promise<Page> => {
    const [newTab] = await Promise.all([context.waitForEvent("page"), await dashboard.click(this.xpathButtonPreview)]);
    await this.page.waitForTimeout(2 * 1000);
    return newTab;
  };

  /**
   * Get Value of Toggle
   * @param label
   */
  async getValueToggle(label: string): Promise<string> {
    const parentSelector = this.getSelectorByLabel(label);
    const toggle = `${parentSelector}//label[contains(@class,'sb-switch__button')]`;
    const currentValue = await this.genLoc(`${toggle}//input`).getAttribute("value");
    return currentValue;
  }

  /** Change language on SF
   * @param language
   */
  async changeLanguageSf(language: string) {
    await this.page.locator(`[component="global-switcher"]`).scrollIntoViewIfNeeded();
    await this.page.locator(`[component="global-switcher"]`).click();
    await waitSelector(this.page, "div.locale-currency-dropdown");
    await this.page.locator("div.custom-select>>nth=1").click();
    await this.page
      .locator(`//div[contains(@class,'locale-currency-dropdown')]//div[contains(text(),'${language}')]`)
      .click();
    await this.page.locator(`div.locale-currency-dropdown .btn-primary`).click();
    await this.waitResponseWithUrl("apps/assets/locales");
    await this.waitForXpathState("div.action-label", "stable");
  }

  /**
   * Select page in action = go to page
   * @param selector
   * @param pages Là list các option page cần chọn để điều hướng (Home, All products, Product detail, Blog, ...)
   * @param pageDetail Nếu có page detail thì truyền (VD product detail có page detail là list các product)
   */
  async selectPageLink(selector: string, pages: string, pageDetail?: string) {
    const parentSelector = this.getSelectorByLabel("link");
    await this.genLoc(`${parentSelector}${selector}`).click();
    const buttonBack = await this.page.locator("div.w-builder__page-select-list button").count();
    if (buttonBack > 0) {
      await this.page.locator("div.w-builder__page-select-list button").click();
    }

    await this.genLoc(`(${this.popOverXPath}//li[@data-select-label ='${pages}'])[1]`).click();
    if (pageDetail) {
      await waitSelector(this.page, ".w-builder__page-select-list .widget-select__list");
      await this.genLoc(`(${this.popOverXPath}//input)[1]`).fill(pageDetail);
      await waitSelector(this.page, ".w-builder__page-select-list .widget-select__list");
      await this.genLoc(`(${this.popOverXPath}//li[@data-select-label ='${pageDetail}'])[1]`).click();
      await this.page.waitForSelector(
        `//span[contains(@class,'sb-button--label') and normalize-space() = '${pageDetail}']`,
      );
      await waitSelector(this.page, "(//span[contains(@class,'sb-button--label')])[2]");
    } else {
      await this.page.waitForSelector(`//span[contains(@class,'sb-button--label') and normalize-space() = '${pages}']`);
    }
    await this.page.locator(".w-builder__header .w-builder__header-center").click({ position: { x: 1, y: 1 } });
  }

  /**
   * Select page in action = go to page
   * @param selector
   * @param pages
   * @param pageDetail
   */
  async selectPageInWidgetLink(selector: string, pages: string, pageDetail?: string) {
    const parentSelector = this.getSelectorByLabel(selector);
    await this.genLoc(`(${parentSelector}//div[contains(@class,'sb-popover__reference')])[2]`).click();
    await this.genLoc(`(${this.popOverXPath}//input)[1]`).type(pages, { delay: 50 });
    await waitSelector(this.page, ".w-builder__page-select-list .widget-select__list");
    await this.genLoc(`(${this.popOverXPath}//li)[1]`).click();
    if (pageDetail) {
      await waitSelector(this.page, ".w-builder__page-select-list .widget-select__list");
      await this.genLoc(`(${this.popOverXPath}//input)[1]`).type(pageDetail, { delay: 50 });
      await waitSelector(this.page, ".w-builder__page-select-list .widget-select__list");
      await this.genLoc(`(${this.popOverXPath}//li[@data-select-label ='${pageDetail}'])[1]`).click();
      await this.page.waitForSelector(
        `//span[contains(@class,'sb-button--label') and normalize-space() = '${pageDetail}']`,
      );
    } else {
      await this.page.waitForSelector(`//span[contains(@class,'sb-button--label') and normalize-space() = '${pages}']`);
    }
    await this.page.locator(".w-builder__settings .w-builder__tab-heading").dblclick({ delay: 300 });
  }

  async reload() {
    await this.page.reload({ waitUntil: "load" });
    await this.page.locator(this.xpathPreviewLoadingScreen).waitFor({ state: "detached" });
    await this.page
      .frameLocator(XpathBlock.frameLocator)
      .locator(XpathBlock.progressBar)
      .waitFor({ state: "detached" });
  }

  async waitForToastMessageSwitchDeviceDisappear() {
    await expect
      .soft(this.page.locator("text=i Changes made on mobile will not apply on desktop >> div"))
      .toBeVisible();
    await this.page.waitForSelector("text=i Changes made on mobile will not apply on desktop >> div", {
      state: "hidden",
    });
  }

  async switchToMobile() {
    await this.switchMobileBtn.click();
    await this.waitForToastMessageSwitchDeviceDisappear();
  }

  /**
   * Select value in dropdown value list
   * @param selector
   * @param value
   * @param index
   */
  async changUpsellLayout(
    selector: string,
    layout: {
      type?: "Grid" | "Carousel";
      size?: "Small" | "Large";
      spacing?: number;
      slideNav?: boolean;
      arrows?: boolean;
    },
    closeAfterDone = false,
  ) {
    this.getSelectorByLabel(selector);
    // open dropdown selection
    await this.page.locator(this.xpathLayout).last().click();

    const popupLayoutSelect = `${XpathBlock.popover}${XPathWidget.upsellLayout}`;

    if (layout.type) {
      const layoutIndex = layout.type === "Grid" ? 0 : 1;
      const layoutSelector = `${popupLayoutSelect}//div[contains(@class, 'list-icon-2')]//span`;
      await this.page.locator(layoutSelector).nth(layoutIndex).click();
      // wait until slide nav and arrows selection is visible
      const slideNavSelector = this.getWidgetSelectorByLabel("Slide Nav");
      await this.page
        .locator(`${popupLayoutSelect}${slideNavSelector}`)
        .waitFor({ state: layout.type === "Grid" ? "hidden" : "visible" });
    }

    if (layout.size) {
      const selector = this.getWidgetSelectorByLabel("Size card");
      const layoutLocator = this.page.locator(`${popupLayoutSelect}${selector}`);
      await layoutLocator.getByText(layout.size).click();
      await layoutLocator.locator(`//div[contains(@class, 'active')]`).getByText(layout.size).waitFor();
    }

    if (layout.spacing >= 0) {
      const selector = this.getWidgetSelectorByLabel("Spacing");
      await this.page
        .locator(`(${popupLayoutSelect}${selector}//input[@type="number"])[2]`)
        .fill(layout.spacing.toString());
    }

    if (layout.type === "Carousel") {
      if (typeof layout.slideNav !== "undefined") {
        await this.switchToggle("Slide Nav", layout.slideNav, this.getWidgetSelectorByLabel);
      }

      if (typeof layout.arrows !== "undefined") {
        await this.switchToggle("Arrows", layout.arrows, this.getWidgetSelectorByLabel);
      }
    }

    // close dropdown selection
    if (closeAfterDone) {
      await this.page.locator(this.xpathLayout).click();
    }
  }

  genLocFrame(selector: string) {
    return this.frameLocator.locator(selector);
  }

  genLocFrameFirst(selector: string) {
    return this.frameLocator.locator(selector).first();
  }

  async selectPostToShow(selector: string, value: number | Slider, type?: string) {
    const parentSelector = this.getSelectorByLabel(selector);
    if (type === "Custom") {
      await this.genLoc(`${parentSelector}//span//span[contains(@class,'sb-pointer')]`).click();
      await this.editSliderBar(parentSelector, value);
    } else {
      await this.genLoc(`${parentSelector}//span//span[normalize-space()='${value}']`).click();
    }
  }
  getPreviewFrameLocator = (selector: string): Locator => {
    return this.page.frameLocator("#preview").locator(selector);
  };

  xpathBlockInPreviewWB(block?: string): string {
    return `//div[contains(@class, '${block}')]`;
  }

  /**
   * Click save và đi tới màn Preview hoặc Storefront
   * @param pageType
   * @param path
   * @returns
   */
  async clickSaveAndGoTo(pageType: "Preview" | "Storefront", sfPath = ""): Promise<Page> {
    await this.clickSave();
    if (pageType === "Preview") {
      return await this.clickPreview({ context: this.context, dashboard: this.page });
    } else {
      const sfPage = await this.context.newPage();
      await sfPage.goto(`https://${this.domain}/${sfPath}`, { waitUntil: "networkidle" });
      return sfPage;
    }
  }

  getXpathMenu(menuName: string): string {
    return (
      `(//ul[contains(@class,'menu') or contains(@class,'active treeview-menu') or contains(@class,'nav-sidebar')]` +
      `//li` +
      `//*[text()[normalize-space()='${menuName}']]` +
      `//ancestor::a` +
      `|(//span[following-sibling::*[normalize-space()='${menuName}']]//ancestor::a))[1]`
    );
  }

  /**
   * Navigate to menu in dashboard
   * @param menu:  menu name
   * */
  async navigateToMenu(menu: string): Promise<void> {
    await this.waitUtilNotificationIconAppear();
    const menuXpath = this.getXpathMenu(menu);
    await this.page.locator(menuXpath).click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * wait notification icon visible
   */
  async waitUtilNotificationIconAppear() {
    await this.page.waitForSelector(".icon-in-app-notification");
  }

  /**
   * Search page template and apply this template to page
   * @param tempName name of page template
   */
  async searchAndApplyPageTemplate(tempName: string) {
    await this.page.waitForLoadState("networkidle");
    await this.page.locator("//div[contains(@class,'b-choose-template-v2__filter__search')]//span[1]").click();
    await this.page.locator(`//input[@placeholder='Try "Pets, .."']`).click();
    await this.page.locator(`//input[@placeholder='Try "Pets, .."']`).fill(tempName);
    await this.page.waitForLoadState();
    const spinner = this.page.locator("//div[contains(@class, 'sb-spinner')]");
    await expect(spinner).toHaveCount(0);
    await expect(this.page.locator("//div[contains(@class, 'sb-relative sb-choose-template__wrap')]")).toHaveCount(1);
    await this.page.waitForSelector(`//img[@alt='${tempName}']`);
    await this.page.locator(`//img[@alt='${tempName}']`).hover();
    await this.page.locator("(//button//span[contains(text(),'Apply')])[1]").click();
  }

  /**
   * Change template page bằng template trong library
   * @param templateName: tên template trong library
   * */
  async changeTemplate(templateName: string): Promise<void> {
    await this.page.click(".w-builder__header-center button > span");
    await this.page.locator("#filtersEl .sb-choose-template-filter__search").first().click();
    await this.page.keyboard.press("Control+A");
    await this.page.keyboard.press("Backspace");
    await this.page.locator("#filtersEl .sb-choose-template-filter__search").first().fill(templateName);
    await this.page.locator(`(//img[@alt = '${templateName}']//parent::figure//a)[1]`).locator("..").hover();
    await this.page.locator(`//img[@alt = '${templateName}']//following-sibling::figcaption//button`).click();
    await this.page.locator(`//div[contains(@class, 'sb-popup__container')]//span[normalize-space()='Apply']`).click();
    await this.page.locator(this.xpathButtonSave).click();
    await this.page.waitForSelector(this.xpathToast, { state: "hidden" });
  }

  xpathImgCardOnboarding(index: number): string {
    return `(//div[@class='post-card']//img)[${index}]`;
  }

  /**
   * Reset empty elements by type
   * @param elements
   * @param type
   * @returns
   */
  setEmptyElementByType(
    elements: Array<Record<string, ThemeSettingValue>>,
    type: ClickType,
  ): Array<Record<string, ThemeSettingValue>> {
    elements.forEach(el => {
      if (el.type === type) {
        el.elements = [];
      }

      if (el.elements && (el.elements as Array<Record<string, ThemeSettingValue>>).length) {
        this.setEmptyElementByType(el.elements as Array<Record<string, ThemeSettingValue>>, type);
      }
    });

    return elements;
  }

  /**
   * Close page temmplate and back to wb
   */
  async closePageTemplate(): Promise<void> {
    await this.page.locator("//button[contains(@class, 'sb-choose-template-v2__close-btn')]//span").click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Input content to block HTML code
   * @param dropDownListMenuItem dropdownlist menu item
   * @param dropDownListSubMenuItem dropdownlist submenu item
   */
  async inputContentToBlockHtm(dropDownListMenuItem: string, dropDownListSubMenuItem: string) {
    await this.page.locator("//div[contains(@class, 'popover-select-variable-reference')]//span").click();
    await this.page
      .locator(`//div[contains(@class, 'sb-popover')]//div[contains(text(), '${dropDownListMenuItem}')]`)
      .click();
    await this.page
      .locator(`//div[contains(@id, 'select-text-variable-page')]//div[contains(text(), '${dropDownListSubMenuItem}')]`)
      .click();
  }

  /**
   * Thay đổi giá trị của slider bar bằng cách nhập input
   * @param label: label của field slider
   * @param value
   */
  async editSliderBarByInput(label: string, value: number) {
    const inputSelector = `//div[contains(@class,'sb-flex') and descendant::label[normalize-space()='${label}']]//input[@max and @min]`;
    await this.page.fill(inputSelector, value.toString());
  }

  async expandAllLayerItems() {
    const allSections = await this.genLoc("//div[@data-id and @page]").all();
    for (const section of allSections) {
      const layerChildLoc = section.locator("//div[contains(@class, 'w-builder__layer-child')]").first();
      const style = await layerChildLoc.getAttribute("style");
      if (style.includes("display: none")) {
        const arrowIcon = section.locator("//button[contains(@class, 'w-builder__element-icon')]").first();
        await arrowIcon.click();
      }
    }
  }

  /**
   * setting Stock Count Down
   * @param dataSetting
   */
  async settingStockCountDown(dataSetting: StockCountDown) {
    const xpathDropDownStockNumber = "[data-widget-id='type'] button";
    const xpathItemsDropDownStockNumber = `//ul[@class='widget-select__list']//li[@data-select-label='${dataSetting.stock_number}']`;
    const xpathInputFieldRange = `(//div[@data-widget-id='stock_number']//input[@type='number'])`;

    await this.switchToTab("Content");
    switch (dataSetting.stock_number) {
      case "Actual":
        await this.genLoc(xpathDropDownStockNumber).click();
        await this.genLoc(xpathItemsDropDownStockNumber).click();
        break;
      case "Random":
        await this.genLoc(xpathDropDownStockNumber).click();
        await this.genLoc(xpathItemsDropDownStockNumber).click();
        if (dataSetting.range.from) {
          await this.genLoc(xpathInputFieldRange + `[1]`).fill(dataSetting.range.from);
        }
        if (dataSetting.range.to) {
          await this.genLoc(xpathInputFieldRange + `[2]`).fill(dataSetting.range.to);
        }
        break;
    }
  }

  /**
   * select LayOut Of Countdown Timer
   * @param typeLayout
   */
  async selectLayOutOfCountdownTimer(typeLayout: TimerCountDown) {
    await this.switchToTab("Design");
    await this.genLoc(this.xpathBtnLayout).click();
    switch (typeLayout.layout) {
      case "Basic":
        await this.genLoc(this.xpathLayOut + "[1]").click();
        break;
      case "Double highlight":
        await this.genLoc(this.xpathLayOut + "[2]").click();
        break;
      case "Single highlight":
        await this.genLoc(this.xpathLayOut + "[3]").click();
        break;
    }
    await this.genLoc(this.xpathBtnLayout).click();
  }

  /**
   * get Xpath Visitor Counter
   * @param index
   * @returns
   */
  getXpathVisitorCounter(index = 1): string {
    return `(//section[@component='realtime-visitors'])[${index}]`;
  }

  /**
   * edit Content Visitor Counter in wb
   * @param randomForm
   * @param randomTo
   * @returns
   */
  async editContentVisitorCounter(randomForm: number, randomTo: number): Promise<void> {
    const xpathRandomVisitor = "(//div[@keyid='random_visitor']//input[@type='number'])";
    await this.switchToTab("Content");
    await this.page.locator(xpathRandomVisitor).nth(0).fill(randomForm.toString());
    await this.page.locator(xpathRandomVisitor).nth(1).fill(randomTo.toString());
  }

  /**
   * Hàm select page khi chọn action Go to page
   * @param selector
   * @param page
   */
  async selectPageActionGoToPage(selector: string, page: string) {
    const parentSelector = this.getSelectorByLabel(selector);
    await this.genLoc(`(${parentSelector}//div[contains(@class,'sb-popover__reference')])[2]`).click();
    await this.genLoc(`//li//div[normalize-space()='${page}']`).click();
  }

  /**
   * Hàm select các option trong droplist ở webfront khi gắn link cho text ở block Heading, Paragraph
   * @param option
   * @param index
   */
  async selectDroplistInBlockHeadingOrParagraph(option: string, index = 1) {
    await this.frameLocator.locator(`(//div[@class='popper wb-dropdown'])[${index}]`).click();
    await this.frameLocator
      .locator(`//div[contains(@class,'wb-dropdown__items')]//span[normalize-space()='${option}']`)
      .click();
  }

  /**
   * select LayOut Of Product Reviews
   * @param typeLayout
   */
  async selectLayOutOfProductReview(typeLayout: ProductReviews): Promise<void> {
    await this.switchToTab("Design");
    await this.genLoc(this.xpathBtnLayout).click();
    switch (typeLayout.layout) {
      case "Masonry":
        await this.genLoc(this.xpathLayOut + "[1]").click();
        break;
      case "Carousel single image - Using this layout can improve your webfront pagespeed":
        await this.genLoc(this.xpathLayOut + "[2]").click();
        break;
      case "List - Using this layout can improve your webfront pagespeed":
        await this.genLoc(this.xpathLayOut + "[3]").click();
        break;
      case "Carousel multiple images":
        await this.genLoc(this.xpathLayOut + "[4]").click();
        break;
    }
  }

  /**
   * Chọn block trong layer setting
   * @param sectionName
   * @param blockName
   * @param blockIndex
   */
  async openQuickBarSetting(sectionName: string, blockName: string, blockIndex: number) {
    await this.expandCollapseLayer({
      sectionName: sectionName,
      isExpand: true,
    });
    await this.openLayerSettings({
      sectionName: sectionName,
      subLayerName: blockName,
      subLayerIndex: blockIndex,
    });
  }

  /**
   * Hàm sử dụng tool SDK để setting data design và content của 1 element trong wb
   * @param elementPosition position of element want to edit
   * @param dataObject any data
   * NOTE: Trước khi dùng hàm cần click và chọn đúng tab cần edit
   */
  async settingDesignAndContentWithSDK(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataObject: Record<any, any>,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let wbSDK: any;
    await this.page.evaluate(
      data => {
        wbSDK.setData(data.dataObject);
      },
      { dataObject },
    );
    await this.waitAbit(500); // WB render
  }
  getIconDragSectionName(sectionName: string) {
    const section = this.getSectionName(sectionName);
    return `${section}//parent::*[contains(@class, 'w-builder__layer')]//*[contains(@class,'w-builder__drag-handle')]`;
  }

  getSectionName(sectionName: string, index = 1) {
    return `(//*[normalize-space() = "${sectionName}"])[${index}]`;
  }

  getIconSection(sectionName: string, type: "svg" | "path") {
    return `(//*[normalize-space() = "${sectionName}"]//*[local-name()='${type}'])[1]`;
  }

  /***
   * Get icon row, column, block
   * @param sectionName
   * @param rowColumnBlock is Row | Column | Name Block
   * @param type is "svg" | "path"
   * @param index
   */
  getIconRowColumnBlock(sectionName: string, rowColumnBlock: string, type: "svg" | "path", index = 1) {
    const section = this.getSectionName(sectionName);
    return `(${section}//parent::*[contains(@class, 'w-builder__layer')]//following-sibling::div//*[normalize-space() = "${rowColumnBlock}"]//*[local-name()='${type}'])[${index}]`;
  }

  async getXpathIconGreenGrey(color: "green" | "grey", sectionName: string, row?: boolean, column?: boolean) {
    const type = color === "green" ? "path" : "svg";
    if (row) {
      return await this.page.locator(this.getIconRowColumnBlock(sectionName, "Row", type));
    } else if (column) {
      return await this.page.locator(this.getIconRowColumnBlock(sectionName, "Column", type));
    } else return await this.page.locator(this.getIconSection(sectionName, type));
  }

  /**
   * click vào section tại side bar
   * @param sectionName
   * @param index
   * @param row "Row" | "Column"
   */
  async clickOnRowColumn(sectionName: string, row = true, index = 1) {
    const section = this.getSectionName(sectionName);
    const expandSection = await this.genLoc(
      `${section}//parent::*[contains(@class, 'w-builder__layer')]//following-sibling::div[contains(@class, 'w-builder__layer-child') and @style=""]`,
    ).isVisible();
    if (!expandSection) {
      await this.genLoc(`${section}//parent::*[contains(@class, 'w-builder__layer')]//button`).nth(0).click();
    }
    const type = row ? "Row" : "Column";
    await this.genLoc(
      `(${section}//parent::*[contains(@class, 'w-builder__layer')]//following-sibling::div//*[normalize-space() = "${type}"])[${index}]`,
    ).click();
  }

  /**
   * Hàm sử dụng tool SDK để get data design và content của 1 element trong wb
   * @param dataObject any data
   */
  async getDesignAndContentWithSDK() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let wbSDK: any;
    const data = await this.page.evaluate(() => {
      if (typeof wbSDK !== "undefined" && wbSDK !== null) {
        // Lấy dữ liệu từ wbSDK
        return wbSDK.getData();
      }
    });
    return data;
  }

  /**
   * select Option When Buyer Click Btn ATC
   * @param option
   */
  async selectOptionWhenBuyerClickBtnATC(option: "Go to cart page" | "Open cart drawer" | "Show notification") {
    await this.genLoc(
      "//div[@data-widget-id='click_add_cart'] [ .//label[normalize-space()='When buyer click Add to cart']]//button",
    ).click();
    await this.genLoc(`//div[contains(@class,'widget-select__search')]//label[normalize-space()='${option}']`).click();
  }

  /**
   * get Xpath Drag Btn Of Section
   * @param section
   * @returns
   */
  async getXpathDragBtnOfSection(section: string): Promise<string> {
    const layerFrom = this.getSidebarSelectorByName({ sectionName: section });
    await this.genLoc(layerFrom).hover();
    return `${layerFrom}/following-sibling::div//span[contains(@class,'drag-handle')]`;
  }
}
