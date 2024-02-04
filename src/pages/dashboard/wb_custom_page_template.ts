import { WebBuilder } from "./web_builder";
import { ElementHandle, Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { ElementPosition } from "@types";

export class WBCustomProductPage extends WebBuilder {
  xpathTemplateOption = ".w-builder__page-select-list  .w-builder__page-select-list li [class=sb-pointer]";
  xpathToDBSTagTemplate = `//h3[normalize-space()='Page design']//following-sibling::div//span[@class="s-tag"]//span`;
  xpathToDBSelectTemplateWrapper = `//h3[ normalize-space()='Page design']//following-sibling::div[@class="m-t-ssm"]`;
  xpathToDBSTagTemplateButton = `${this.xpathToDBSelectTemplateWrapper}//span//following-sibling::a`;
  xpathToDBInputTemplate = `${this.xpathToDBSelectTemplateWrapper}//input[@placeholder="Search custom design"]`;
  xpathToWBInputTemplate = `//div[contains(@class, "w-builder__page-select-list")]//input`;
  xpathToDBSelectTemplateOptions = `${this.xpathToDBSelectTemplateWrapper}//span[contains(@class,"s-dropdown-item")]//span`;
  xpathToFigureTemplate = `(//div[contains(@class, "sb-relative sb-choose-template__wrap")]//figure)[1]`;
  xpathToFigureApplyButton = `//img[@alt = 'product page template']//following-sibling::figcaption//button`;
  xpathToToolTip = `//div[contains(@class, 'sb-tooltip') and @role='tooltip' and not(contains(@style, 'display'))]`;
  xpathToPopupFooterButtons = `//div[contains(@class, 'sb-popup__footer')]//button/span`;
  xpathToPopupContent = `//div[contains(@class, "sb-popup__body")]//div[@class="sb-text-body-medium"]`;
  xpathToTemplateSelectButton = ".w-builder__page-select .w-builder__header__auto-complete__label p";
  xpathToTemplateSelectPopover = `//div[@id="popover-select-template"]`;
  xpathToWBEditTemplateInput = `//div[contains(@class, 'w-builder__template-select__edit-popup')]//div[@class='sb-form']//input`;
  xpathToWBPopupSaveButton = `//div[contains(@class, 'sb-popup__footer')]//button[2]`;
  xpathToWBPopupCancelButton = `//div[contains(@class, 'sb-popup__footer')]//button[1]`;
  xpathToWBPopupCloseButton = `//div[contains(@class, 'w-builder__template-select__edit-popup')]//div[@class='sb-popup__header']//button`;
  xpathToPopupChooseTemplate = `.sb-choose-template-v2`;
  xpathToPopupErrorMessage = `.sb-form-item__message`;
  xpathToDBCreateTemplateInput = `.sb-popup__container input`;
  xpathToDBPopupCancelButton = `(//div[contains(@class, "sb-popup__footer")]//span)[1]`;
  xpathToDBPopupCreateButton = `(//div[contains(@class, "sb-popup__footer")]//span)[2]`;
  xpathToDBPopupCloseButton = `//div[contains(@class, 'sb-popup__header')]//button`;
  xpathToDBChooseTemplateFilter = `.sb-choose-template-v2__filter__search input`;
  xpathToDBFirstProduct = `//*[@id="products-results"]//tbody/tr[1]//td[2]//a`;
  xpathToDBProductList = `//*[@id="products-results"]//tbody`;
  xpathToDBProductViewButton = `//div[@class="action-bar__item"]//div[@role="button"]`;
  xpathToDBProductMultipleSFListOption = `//div[div[contains(@class,"storefront-search--input")]]//following-sibling::span`;
  xpathToDBPopupChooseTemplate = `.sb-popup__container`;
  xpathToWBPopupEditTemplate = `//div[contains(@class, 'w-builder__template-select__edit-popup')]//div[contains(@class ,"sb-popup__container")]`;
  xpathToWBUnassignedProduct = `//div[contains(@class, 'sb-selection-item__suffix')]//preceding-sibling::div[contains(@class, "sb-selection-item__label")]//div[contains(@class, "sb-tooltip__reference")]`;
  xpathToWBUnassignedProductWarnIcon = `//div[contains(@class, 'sb-selection-item__suffix')]`;
  xpathToWBProductOptionsWrapper = `//div[contains(@class,"sb-autocomplete__selection")]`;
  xpathToWBProductSelectButton = `(//p[contains(@class,"sb-selection-group-item")])[2]`;
  xpathToWBProductSelectButtonWarnIcon = `${this.xpathToWBProductSelectButton}//following-sibling::div//*[contains(@class,'sb-flex')]`;
  xpathToWBProgressBar = `#v-progressbar`;
  xpathToWBIFrame = `//iframe[@id="preview"]`;
  blocks: Blocks;
  otherPage: OtherPage;
  locatorPageDesignBlock = this.genLoc(".title-description").filter({ hasText: "Page design" });
  locatorMessagePageDesign = this.locatorPageDesignBlock.locator(".type-container");
  locatorHoverTemplateByName(templateName: string) {
    return `//span[@class='s-dropdown-item is-hovered']//span[normalize-space()='${templateName}']`;
  }
  saveChangeBtn = "//div[@class='row save-setting-content']//button[normalize-space()='Save changes']";
  exclamationMarkIcon = ".sb-tooltip__reference.focusing";
  hrefByTemplateId(id: number) {
    return `//a[contains(@href,'${id}')]`;
  }
  createNewDesignBtn = "//span[text()='Create new design']";

  constructor(page: Page, domain: string) {
    super(page, domain);
    this.blocks = new Blocks(page, domain);
    this.otherPage = new OtherPage(page, domain);
  }
  /**
   * Trả về xpath đến icon Delete theo template name
   * @param templateName: Tên template
   * @return xpath đến icon Delete
   */
  xpathToIconDelete(templateName: string) {
    return `//*[@id="popover-select-template"]//div[text()='${templateName}']/following-sibling::div/div[2]`;
  }

  /**
   * Trả về xpath đến icon Rename theo template name
   * @param templateName: Tên template
   * @return xpath đến icon Rename
   */
  xpathToIconRename(templateName: string) {
    return `//*[@id="popover-select-template"]//div[text()='${templateName}']/following-sibling::div/div[1]`;
  }

  /**
   * Trả về xpath đến Heading của popup
   * @param heading: Text của heading
   * @return xpath đến Heading của popup
   */
  xpathToPopupHeading(heading: string) {
    return `//div[@class='sb-popup__header']/div[@class='sb-text sb-text-medium']/div[normalize-space()='${heading}']`;
  }

  /**
   * Trả về xpath đến Product
   * @param title: Title của Product
   * @return xpath đến Product
   */
  xpathToWBProductOption(title: string) {
    return `//div[contains(@class,"sb-autocomplete__selection")]//div[contains(@class, "sb-tooltip__reference") and normalize-space()='${title}']`;
  }

  /**
   * Trả về xpath đến Product theo custom template
   * @param domain: Shop domain
   * @param themeId: Shop themeId
   * @param customDesign Custom design ID
   * @return xpath đến Product
   */
  xpathToWBProductByCustomTemplate(domain: string, themeId: number, customDesign: number) {
    return `https://${domain}/admin/builder/site/${themeId}?page=product&custom_design=${customDesign}`;
  }

  /**
   * Trả về xpath đến Home page
   * @param domain: Shop domain
   * @return xpath đến Home page
   */
  xpathToHomePage(domain: string) {
    return `https://${domain}`;
  }

  /**
   * Chuyển đến trang product admin
   * @param domain: shop domain
   */
  async gotoDBProductPage(domain: string) {
    await this.page.goto(`https://${domain}/admin/products`);
  }

  /**
   * Chuyển đến trang product detail
   * @param domain: shop domain
   * @param name: product name
   */
  async gotoSFNProductPage(domain: string, name: string) {
    await this.page.goto(`https://${domain}/products/${name}`);
  }

  /**
   * Chuyển đến trang product web builder
   * @param domain: shop domain
   */
  async gotoWBProductPage(domain: string, themeId: number) {
    await this.page.goto(`https://${domain}/admin/builder/site/${themeId}?page=product`);
    await this.page.waitForSelector(this.blocks.xpathPreviewLoadingScreen);
    await this.page.waitForSelector(this.blocks.xpathPreviewLoadingScreen, { state: "hidden" });
  }

  /**
   * Lấy text chứa trong các ElementHandle vào array
   * @return string array
   */
  async convertToTextArray(list: ElementHandle[]) {
    const convertedList = [];
    for (const element of list) {
      const text = await element.textContent();
      convertedList.push(text);
    }
    return convertedList;
  }

  /**
   * This function is used to create a custom design by name
   * @param name is the custom design's name
   */
  async createACustomDesignWithName(name: string) {
    await this.genLoc(this.createNewDesignBtn).click();
    await this.genLoc(this.xpathToFigureTemplate).hover();
    await this.genLoc(this.xpathToFigureApplyButton).click();
    await this.genLoc(this.xpathToDBCreateTemplateInput).fill(name);
    await this.genLoc(this.xpathToDBPopupCreateButton).click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * This function is used to open a tab of a section
   * @param selector
   * @param name
   * @param nameTab
   */
  async openSectionByNameTab(selector: ElementPosition, name: string, nameTab: string) {
    await this.selectParentBreadcrumb(selector, name);
    await this.switchToTab(nameTab);
  }
}
