import type { EtaStyleSettings } from "@types";
import { Page } from "@playwright/test";
import { WebBuilder } from "./web_builder";

export class WbBlockEtaPage extends WebBuilder {
  constructor(page: Page, domain?: string) {
    super(page, domain);
  }

  async handleFormEta(dashboard: Page, setting: EtaStyleSettings) {
    if (setting.icon) {
      await this.selectIcon("icon", setting.icon, false);
    }
    if (setting.color) {
      await this.page.click(`[data-widget-id="color"] .w-builder__widget--color .sb-popover__reference`);
      await this.settingColorsStyles({ preset: setting.color.preset });

      // Delay for image loading
      await dashboard.waitForTimeout(500);
    }
  }
}
