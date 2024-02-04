import { getStyle } from "@core/utils/css";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";

export class WbWebsitePages extends Blocks {
  xpathTitlePageInNavBar = "//span[contains(@class,'w-builder__header-title-btn')]";

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

  getXpathBtnHideInLayer(layerSelector: string): string {
    return `${layerSelector}//parent::div//button[@data-block-action="visible"]`;
  }

  getXpathBlockPageSF(textInput: string, blockName: string): string {
    return `//*[text()='${textInput}']//ancestor::section[@component='${blockName}']`;
  }

  getXpathBlockTextVariable(blockName: string, variable: string): string {
    return `//section[@component='${blockName}']//span[@value='${variable}']`;
  }
}
