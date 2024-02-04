import { Locator, Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { expect } from "@core/fixtures";
import { LayerStyles } from "@types";
import { OcgLogger } from "@core/logger";

export const defaultCustomizationServiceBlockStyle: LayerStyles = {
  position: {
    label: "position",
    type: "Auto",
  },
  align: {
    label: "align_self",
    type: "Center",
  },
  width: {
    label: "width",
    value: {
      unit: "%",
      value: 100,
    },
  },
  background: {
    label: "background",
    value: {
      color: {
        preset: 7,
      },
    },
  },
  border: {
    label: "border",
    value: {
      thickness: "none",
    },
  },
  opacity: {
    label: "opacity",
    config: {
      fill: true,
      number: 100,
    },
  },
  radius: {
    label: "border_radius",
    config: {
      fill: true,
      number: 0,
    },
  },
  shadow: {
    label: "box_shadow",
    config: {
      option: "none",
    },
  },
  padding: {
    label: "padding",
    value: {
      top: 0,
      left: 24,
      bottom: 0,
      right: 24,
      input: true,
    },
  },
  margin: {
    label: "margin",
    value: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      input: true,
    },
  },
};

export const defaultQuestionBlockStyle: LayerStyles = {
  position: {
    label: "position",
    type: "Auto",
  },
  align: {
    label: "align_self",
    type: "Center",
  },
  width: {
    label: "width",
    value: {
      unit: "%",
      value: 100,
    },
  },
  background: {
    label: "background",
    value: {
      color: {
        hexText: "#FFFFFF",
      },
    },
  },
  border: {
    label: "border",
    value: {
      thickness: "s",
      style: "Solid",
      side: "All",
      color: {
        hexText: "#FFFFFF",
      },
    },
  },
  opacity: {
    label: "opacity",
    config: {
      fill: true,
      number: 100,
    },
  },
  radius: {
    label: "border_radius",
    config: {
      fill: true,
      number: 0,
    },
  },
  shadow: {
    label: "box_shadow",
    config: {
      option: "none",
    },
  },
  padding: {
    label: "padding",
    value: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      input: true,
    },
  },
  margin: {
    label: "margin",
    value: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      input: true,
    },
  },
};

const logger = OcgLogger.get();

export class WbPageCustomizationService extends Blocks {
  xpathCustomizationServiceBlock = "//div[@data-block-component='customization-service']";
  xpathQuestionBlock = "//div[@data-block-component='product-question']";
  xpathSectionCustomizationServiceBlock = "//section[@component='customization-service']";
  xpathSectionQuestionBlock = "//section[@component='product-question']";
  xpathSFPreviewImage = "//div[contains(@class, 'customization-service__image')]//img";
  xpathElementSelector = "[id='element-name']";
  xpathResizerLeft = "//div[@class='resizer left']";
  xpathResizerRight = "//div[@class='resizer right']";

  xpathSidebarAligns = "//div[@data-widget-id='align_self']//div[contains(@class, 'widget-size__thickness-item')]";

  constructor(page: Page, domain?: string) {
    super(page, domain);
  }

  async clickCustomizationServiceBlock() {
    await this.frameLocator.locator(this.xpathCustomizationServiceBlock).click();
  }

  async clickQuestionBlock() {
    await this.frameLocator.locator(this.xpathQuestionBlock).click();
  }

  async getAllSections(): Promise<Locator[]> {
    return await this.frameLocator.locator("//section[@id]").all();
  }

  async openCustomizationServicePage() {
    await this.navigateToMenu("Online Store");
    await this.page.getByRole("button", { name: "Customize" }).first().click();
    await this.page.locator('button[name="Pages"]').click();
    await this.page.goto(`${this.page.url().toString()}?page=my_customization_service`);
    await this.loadingScreen.waitFor();
    await this.loadingScreen.waitFor({ state: "hidden" });
    await this.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
  }

  async removeAllSection(excludeSectionIds = []) {
    const excludeSectionIdMap = {};
    excludeSectionIds.forEach(item => (excludeSectionIdMap[item] = true));

    // Count number of block at the beginning
    const sections = await this.getAllSections();

    const needToRemoveSections = [];
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionId = await section.getAttribute("id");
      if (!excludeSectionIdMap[sectionId]) {
        needToRemoveSections.push(i);
      }
    }

    logger.info(`Need to remove sections: ${JSON.stringify(needToRemoveSections)}`);

    // Cleanup redundant section.
    if (needToRemoveSections.length > 0) {
      for (const removeIndex of needToRemoveSections) {
        const sectionParagraph = this.getSelectorByIndex({
          section: removeIndex + 1,
        });

        await this.clickOnElement(sectionParagraph, this.iframe);
        await this.changeContent({
          content: `tobe-removed-section-${removeIndex}`,
        });
      }
    }

    const isBackButtonVisible = await this.backBtn.isVisible();
    if (isBackButtonVisible) {
      await this.backBtn.click();
    }

    // Cleanup
    for (const removeIndex of needToRemoveSections) {
      await this.removeLayer({
        sectionName: `tobe-removed-section-${removeIndex}`,
      });
    }
  }

  async resetCustomizationServiceBlockSetting() {
    await this.changeDesign(defaultCustomizationServiceBlockStyle);

    // reset setting
    const isSaveButtonEnabled = await this.page.locator("//button[normalize-space()='Save']").isEnabled({
      timeout: 3000,
    });
    if (isSaveButtonEnabled) {
      await this.clickBtnNavigationBar("save");
      await expect(this.page.locator("text=i All changes are saved >> div")).toBeVisible();
      await this.page.waitForSelector("text=i All changes are saved >> div", { state: "hidden" });
    }
  }

  async resetQuestionBlockSetting() {
    await this.changeDesign(defaultQuestionBlockStyle);

    // reset setting
    const isSaveButtonEnabled = await this.page.locator("//button[normalize-space()='Save']").isEnabled({
      timeout: 3000,
    });
    if (isSaveButtonEnabled) {
      await this.clickBtnNavigationBar("save");
      await expect(this.page.locator("text=i All changes are saved >> div")).toBeVisible();
      await this.page.waitForSelector("text=i All changes are saved >> div", { state: "hidden" });
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
}
