import { getStyle } from "@core/utils/css";
import { WebBuilder } from "@pages/dashboard/web_builder";

export class EntityLayout extends WebBuilder {
  xpathCustomLayoutLive = "//p[contains(normalize-space(),'Custom layout')]/span[normalize-space()='Live']";
  xpathDefaultLayoutLive = "//p[contains(normalize-space(),'Default layout')]/span[normalize-space()='Live']";
  xpathMoreActionCustom =
    "//p[contains(normalize-space(),'Custom layout')]/preceding-sibling::figure//button[contains(@class,'more-action')]";
  xpathDefaultMoreAction =
    "//p[contains(normalize-space(),'Default layout')]/preceding-sibling::figure//button[contains(@class,'more-action')]";
  xpathPublishAction = "//p[contains(normalize-space(),'Publish')]";
  xpathCancel = "//button[normalize-space()='Cancel']";
  popupDelete = ".s-modal-card";
  xpathBtnDeleteLayout = "//p[contains(normalize-space(),'Delete')]";
  xpathConfirmDelete = "//button[normalize-space()='Delete']";
  btnCreateCustomLayout = ".create-custom-layout";
  popupChooseTemplate = ".sb-choose-template__templates";

  xpathIconSelectProduct = "//p[@class='sb-selection-group-item']/following-sibling::span";
  xpathBtnAddToCart = ".wb-button--add-cart__primary .btn-primary";
  popup = "section.section-popup.is-selected";
  popupClose = "section.section-popup.is-selected .close-popup-button";
  xpathBtnExit = "//button[@name='Exit']";
  xpathPreviewProduct = "//a[@class='s-button is-outline is-small']";
  xpathHeadingTitle = '//span[@value="product.title"]//ancestor::section[@component="heading"]';
  xpathBtnTemplate = "//h5[contains(text(),'Templates')]//ancestor::button";
  xpathColumnProductWB =
    '//span[@value="product.title"]//ancestor::div[contains(@class,"column flex direction-column")]';
  xpathColumnProductSF =
    "//span[@value=\"product.title\"]//ancestor::div[contains(@class,'wb-builder__column--container')]";

  /**
   * Get xpath template preview product by name
   * @param name
   */
  async getXpathPreviewProductByName(name: string): Promise<string> {
    return `//h5[contains(@class,'w-builder__header-label') and contains(text(),'${name}')]`;
  }

  /**
   * Get xpath Customize button  by layout
   * @param layout
   */
  async getXpathCustomByLayout(layout: string): Promise<string> {
    return `//p[contains(normalize-space(),'${layout}')]/preceding-sibling::figure//button[contains(normalize-space(),'Customize')]`;
  }

  /**
   * Get style layout block
   * @param locator
   * @returns
   */
  async getCSSValue(locator): Promise<object> {
    const backgroundColor = await getStyle(locator, "background-color");
    const opacity = await getStyle(locator, "opacity");

    const boderBottomColor = await getStyle(locator, "border-bottom-color");
    const boderBottomStyle = await getStyle(locator, "border-bottom-style");
    const boderBottomWidth = await getStyle(locator, "border-bottom-width");

    const boderTopColor = await getStyle(locator, "border-top-color");
    const boderTopStyle = await getStyle(locator, "border-top-style");
    const boderTopWidth = await getStyle(locator, "border-top-width");

    const boderLeftColor = await getStyle(locator, "border-left-color");
    const boderLeftStyle = await getStyle(locator, "border-left-style");
    const boderLeftWidth = await getStyle(locator, "border-left-width");

    const boderRightColor = await getStyle(locator, "border-right-color");
    const boderRightStyle = await getStyle(locator, "border-right-style");
    const boderRightWidth = await getStyle(locator, "border-right-width");

    const paddingTop = await getStyle(locator, "padding-top");
    const paddingBottom = await getStyle(locator, "padding-bottom");
    const paddingLeft = await getStyle(locator, "padding-left");
    const paddingRight = await getStyle(locator, "padding-right");

    const borderBottomLeftRadius = await getStyle(locator, "border-bottom-left-radius");
    const borderBottomRightRadius = await getStyle(locator, "border-bottom-right-radius");
    const borderTopLeftRadius = await getStyle(locator, "border-top-left-radius");
    const borderTopRightRadius = await getStyle(locator, "border-top-right-radius");

    return {
      backgroundColor: backgroundColor,
      opacity: opacity,
      boderBottomColor: boderBottomColor,
      boderBottomStyle: boderBottomStyle,
      boderBottomWidth: boderBottomWidth,
      boderTopColor: boderTopColor,
      boderTopStyle: boderTopStyle,
      boderTopWidth: boderTopWidth,
      boderLeftColor: boderLeftColor,
      boderLeftStyle: boderLeftStyle,
      boderLeftWidth: boderLeftWidth,
      boderRightColor: boderRightColor,
      boderRightStyle: boderRightStyle,
      boderRightWidth: boderRightWidth,
      paddingTop: paddingTop,
      paddingBottom: paddingBottom,
      paddingLeft: paddingLeft,
      paddingRight: paddingRight,
      borderBottomLeftRadius: borderBottomLeftRadius,
      borderBottomRightRadius: borderBottomRightRadius,
      borderTopLeftRadius: borderTopLeftRadius,
      borderTopRightRadius: borderTopRightRadius,
    };
  }
}
