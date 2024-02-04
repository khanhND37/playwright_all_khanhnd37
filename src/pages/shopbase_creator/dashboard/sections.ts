import { SBPage } from "@pages/page";

export class Sections extends SBPage {
  headerSaveTemplatePopupSelector = ".sb-popup__header div div";
  sectionNameXpath = "//div[@class='w-builder__layer-child']/preceding-sibling::div//p";
  columnLayoutXpath = "//*[contains(@class,'p8')]/ancestor::div[2]";
  webfrontSelector = '[id="app"] [id="website-builder"]';
  elementSelector = '[id="element-name"]';
  parentBreadcrumbSelector = '[id="element-name"] .pointer';
  quickBarSelector = '[id="quick-settings"]';
  fullWidthSection = ".layout-full-width";
  quickBarSection = ".quick-settings--section";
  quickBarRow = ".quick-settings--row";
  quickBarColumn = ".quick-settings--column";
  quickBarBlock = ".quick-settings--block";
  addBlockButtonSelector = "text=Add block";
  insertPanelPreviewSelector = ".w-builder .w-builder__insert-previews";
  insertPanelButton =
    "//div[contains(@class,'w-builder__header')]//button[descendant::*[local-name()='g' and @id='Icons/Navigation/Plus-(line)']]";
  settingTabSection = ".sb-tab--inside .sb-tab-navigation__item >> nth=1";
  headerSelector = ".sb-sticky.w-builder__header";
  selectorSection = "section.section";
  nameElement = "#element-name span";
  iconSection = "svg.w-builder__layer-icon--section g";

  getQuickBarXpath(option: string) {
    return `//div[@id='quick-settings']//*[contains(@class,'quick-settings__item') and descendant::span[normalize-space()='${option}']]`;
  }

  getColumnLayoutSelector(layoutIndex: number) {
    return `.inline-block .popper svg >> nth=${layoutIndex}`;
  }

  /**
   * Get row selector on store front by section index
   * @param sectionIndex
   * @returns
   */
  getRowSelectorOnSF(sectionIndex: number) {
    return `//section[contains(@class,'wb-builder__section--container')][${sectionIndex}]//*[contains(@class,'row')]`;
  }
}
