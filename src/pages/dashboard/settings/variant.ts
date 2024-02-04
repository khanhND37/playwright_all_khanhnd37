import { WebBuilder } from "@pages/dashboard/web_builder";

export class Variant extends WebBuilder {
  public xpathStickyContainer = ".sticky__container";
  public xpathQuickSetting = "#quick-settings";

  public xpathTooltipLabel = label => {
    return `${this.getSelectorByLabel(label)}//label[contains(@class, 'tooltip')]`;
  };

  public xpathTooltipLabelExcludeOption = label => {
    return `${this.getSelectorByLabel(label)}//div[contains(@class, 'label')]/span`;
  };

  public xpathVisibleTooltipVariant = label => {
    return `//div[@class='sb-tooltip__content sb-text-caption' and contains(normalize-space(), '${label}')]`;
  };

  async hoverStickyAtcInfoIcon() {
    await this.genLoc(
      "//div[@data-widget-id='sticky_add_cart_enabled']//span[contains(@class, 'w-builder__tooltip')]",
    ).hover();
  }
}
