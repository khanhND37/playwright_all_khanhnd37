import { APIRequestContext, Locator, Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { expect } from "@core/fixtures";
import type { BackGround, PopupStyle } from "@types";
import {
  ButtonContentSetting,
  InsertButtonWithSetting,
  LayerStyles,
  PopupContentSetting,
  PopupSettings,
  PopupStylePosition,
} from "@types";
import { getStyle } from "@utils/css";
import { OcgLogger } from "@core/logger";
import { pressControl } from "@utils/keyboard";

const logger = OcgLogger.get();
const defaultPopupStyleSetting: PopupStyle = {
  position: {
    position: 5,
  },
  overlay: 24,
  width: {
    label: "width",
    value: {
      unit: "Px",
      value: 500,
    },
  },
  height: {
    label: "height",
    value: {
      unit: "Auto",
      value: 0,
    },
  },
  background: {
    label: "background",
    value: {
      color: {
        preset: 6,
        hexText: "#FFFFFF",
      },
    },
  },
  border: {
    label: "border",
    value: {
      thickness: "none",
    },
  },
  radius: {
    label: "radius",
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
      top: 24,
      left: 24,
      bottom: 24,
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

const defaultPopupContentSetting: PopupContentSetting = {
  name: "Popup",
  icon: "popup",
  trigger: {
    type: "Delay",
    value: 0,
  },
  close_button: "line",
  customer_trigger: {
    type: "All Customers",
  },
};

export class WbPopUp extends Blocks {
  xpathLayer = "//p[contains(@class, 'w-builder__layer-label--section')]";
  xpathLayerUnderFooters =
    "//div[contains(@class, 'w-builder__layers-footer')]//p[contains(@class, 'w-builder__layer-label--section')]";
  xpathLayerPopup = "//p[contains(@class, 'w-builder__layer-label--section') and contains(normalize-space(), 'Popup')]";
  xpathLayerPopupOuter = "//div[@section-index and contains(normalize-space(), 'Popup')]";
  xpathLayerPopupHideShowAction =
    "(//div[@section-index and contains(normalize-space(), 'Popup')]//div[contains(@class, 'w-builder__element-action')]//button)[1]";

  xpathWbSectionPopup = "//section[contains(@class, 'section-popup')  and not(@id='default_cart_drawer')]";
  xpathWbDivSectionPopup =
    "//section[contains(@class, 'section-popup') and not(contains(@id, 'cart_drawer'))]//div[contains(@class, 'section--container')]";
  xpathWbSections = "//section[contains(@class, 'wb-preview__section')]";
  xpathWbOverlay = "//div[contains(@class, 'popup-overlay') and not(@id='popup-overlay-default_cart_drawer')]";

  xpathButtonDeleteBlock = "//div[contains(@class, 'w-builder__settings-remove')]//button";

  xpathPopup = {
    onlineStore: {
      templates: {
        customizeButton: templateName =>
          `//div[@class='page-designs__theme']/div[contains(normalize-space(), '${templateName}')]//button[normalize-space()='Customize']`,
        templateIdBlock: templateName =>
          `//div[@class='page-designs__theme']/div[contains(normalize-space(), '${templateName}')]//div[contains(@class, 'page-designs__theme--info')]/div[2]`,
        publishBtn: templateId =>
          `//div[@class='page-designs__theme']/div[contains(normalize-space(), '${templateId}')]//button[contains(normalize-space(),'Publish')]`,
      },
      popupPublish: {
        popupContainer: `//div[contains(@class, 'popup__container')]//div[contains(text(),'Publish template')]`,
        publishBtn: `//button[contains(@class, 'popup__footer-button')]//span[contains(normalize-space(),'Publish')]`,
      },
    },
    popup: {
      section: "//section[contains(@class, 'section-popup')  and not(@id='default_cart_drawer')]",
      buttonOnPopup: (label: string) =>
        `//div[contains(@class, 'btn-primary') and contains(normalize-space(), '${label}')]`,
      closeButton: {
        inline: "//section[contains(@class, 'popup-selected')]//div[contains(@class, 'close-popup-button__line')]",
      },
      videoBackground: `//div[contains(@class,'video-iframe--overlay')]`,
      parallax: `//div[contains(@class,'bg-parallax__container')]`,
      overlay: `//div[contains(@class, 'popup-overlay')]`,
      videoIframe: `//div[@class="video-iframe"]`,
    },
    sidebar: {
      backIcon: `//div[contains(@class, 'w-builder__tab-heading')]//span[contains(@class, 'sb-icon')]`,
      button: {
        labelInput: "//div[@data-widget-id='title']//input[@type='string']",
        action: "//div[@data-widget-id='link']//span[@class='sb-button--label']",
      },
      background: {
        popover: `//div[@class="w-builder__popover w-builder__widget--background"]`,
        loadingImage: `//div[@class="sb-spinner sb-relative sb-spinner--small"]`,
      },
      tabContent: {
        triggerTooltipIcon: `//div[@data-widget-id="trigger"]//span[contains(@class, 'w-builder__tooltip')]`,
        triggerTooltipContent: `//label[contains(@class, 'w-builder__tooltip-label') and contains(text(), 'When do popups open?')]//parent::div`,
        triggerTooltipDropdown: `//div[@data-widget-id="trigger"]//button`,
        delay: `//div[@data-widget-id="delay"]//div[contains(@class, 'w-builder__container--inline')]`,
        pagescroll: `//div[@data-widget-id="page_scroll"]//div[contains(@class, 'w-builder__container--inline')]`,
        customerTriggerTooltipIcon: `//div[@data-widget-id="customer"]//span[contains(@class, 'w-builder__tooltip')]`,
        customerTriggerTooltipContent: `//*[contains(@class, 'w-builder__tooltip-label') and contains(text(), 'Who will see this popup?')]//parent::div`,
        customerTriggerTooltipDropdown: `//div[@data-widget-id="customer"]//button`,
        afterLeave: `//div[@data-widget-id="after_leave"]//div[contains(@class, 'w-builder__container--inline')]`,
        afterLeaveDropdown: `//div[@data-widget-id="after_leave"]//div[contains(@class, 'w-builder__container--inline')]//button`,
        returningTime: `//div[@data-widget-id="returning_time"]//div[contains(@class, 'w-builder__container--inline')]`,
      },
    },
  };

  constructor(page: Page, domain?: string) {
    super(page, domain);
  }

  async openWb() {
    await this.navigateToMenu("Online Store");
    await this.page.getByRole("button", { name: "Customize" }).first().click();
    await this.loadingScreen.waitFor();
    await this.loadingScreen.waitFor({ state: "hidden" });
    await this.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
    await this.page.locator('button[name="Pages"]').click();
  }

  async openTemplate(templateName: string) {
    const customizeButtonLoc = this.genLoc(this.xpathPopup.onlineStore.templates.customizeButton(templateName)).first();
    const isVisible = await customizeButtonLoc.isVisible();
    if (isVisible) {
      // need check visible, because sometime theme is published
      await customizeButtonLoc.click();
      await this.loadingScreen.waitFor();
      await this.loadingScreen.waitFor({ state: "hidden" });
      await this.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await this.page.locator('button[name="Pages"]').click();
    } else {
      await this.page.getByRole("button", { name: "Customize" }).first().click();
    }
  }

  async clickOnButtonOnPopup(buttonLabel: string) {
    await this.genLocFrame(this.xpathPopup.popup.buttonOnPopup(buttonLabel)).first().click();
  }

  async openWbAndClickPopup() {
    await this.openWb();

    // Click on section popup
    await this.clickOnSectionPopup();

    // Wait for popup appear
    await expect(this.frameLocator.locator(this.xpathWbSectionPopup)).toBeVisible();
  }

  async resetDefaultPopupStyle(saveSetting = true) {
    await this.setPopUpDesign(defaultPopupStyleSetting);
    if (saveSetting) {
      await this.clickSaveButton();
    }
  }

  async clickOnSectionPopup() {
    await this.clickBtnNavigationBar("layer");

    const popupLocatorContainTextPopup = this.genLoc(this.xpathLayerPopup).first();
    const isPopupVisible = await popupLocatorContainTextPopup.isVisible();
    logger.info(`clickOnSectionPopup- isPopupVisible: ${isPopupVisible}`);

    if (isPopupVisible) {
      // Popup name contains popup
      await popupLocatorContainTextPopup.click();
    } else {
      // Click on last element if no element name contains popup
      const numberOfLayer = await this.genLoc(this.xpathLayer).count();
      logger.info(`== numberOfLayer: ${numberOfLayer}`);
      await this.genLoc(this.xpathLayer)
        .nth(numberOfLayer - 1)
        .click();
    }
  }

  async clickOnSectionPopupByName(name: string) {
    await this.clickBtnNavigationBar("layer");

    const popupLoc = this.genLoc(
      `//p[contains(@class, 'w-builder__layer-label--section') and contains(normalize-space(), '${name}')]`,
    );
    await popupLoc.click();
  }

  async resetDefaultPopupContent(saveSetting = true) {
    await this.setPopupContentSetting(defaultPopupContentSetting);
    if (saveSetting) {
      await this.clickSaveButton();
    }
  }

  async setPopUpDesign(popupStyle: PopupStyle) {
    await this.switchToTab("Design");
    if (popupStyle.position) {
      await this.setupPosition(popupStyle.position);
    }

    if (popupStyle.overlay !== undefined) {
      await this.editSliderBar("overlay", {
        fill: true,
        number: popupStyle.overlay,
      });
    }

    const layerStyles: LayerStyles = {};

    if (popupStyle.width) {
      layerStyles.width = popupStyle.width;
    }

    if (popupStyle.height) {
      layerStyles.height = popupStyle.height;
    }

    if (popupStyle.background) {
      layerStyles.background = popupStyle.background;
    }

    if (popupStyle.border) {
      layerStyles.border = popupStyle.border;
    }

    if (popupStyle.radius) {
      layerStyles.radius = popupStyle.radius;
    }

    if (popupStyle.shadow) {
      layerStyles.shadow = popupStyle.shadow;
    }

    if (popupStyle.padding) {
      layerStyles.padding = popupStyle.padding;
    }

    if (popupStyle.margin) {
      layerStyles.margin = popupStyle.margin;
    }

    await this.changeDesign(layerStyles);
  }

  async setPopupContentSetting(contentSetting: PopupContentSetting) {
    // Switch to content tab
    await this.switchToTab("Content");

    if (contentSetting.icon) {
      await this.selectIcon("icon", "popup", false);
    }

    if (contentSetting.close_button) {
      // Click on close button dropdown
      await this.genLoc(`//div[@data-widget-id='close_button']//button//span[contains(@class,'sb-icon')]`)
        .first()
        .click();
      const buttonIndexes = {
        none: 0,
        line: 1,
        ellipse: 2,
        rectangle: 3,
      };

      // Choose button
      const buttonIndex = buttonIndexes[contentSetting.close_button];
      await this.genLoc(
        `//div[contains(@class, 'sb-popover__popper') and not(contains(@style,'display: none;'))]//span[contains(@class, 'widget-select__item')]`,
      )
        .nth(buttonIndex)
        .click();
    }

    const triggerSetting = contentSetting.trigger;
    if (triggerSetting) {
      await this.selectDropDown("trigger", triggerSetting.type);
      if (triggerSetting.type === "Delay") {
        if (triggerSetting.value || triggerSetting.value === 0) {
          logger.info(`Trigger delay value: ${triggerSetting.value}`);
          await this.editSliderBar("delay", {
            fill: true,
            number: triggerSetting.value,
          });
        }
      }
      if (triggerSetting.type === "Page scroll") {
        if (triggerSetting.value || triggerSetting.value === 0) {
          logger.info(`Trigger page scroll value: ${triggerSetting.value}`);
          await this.editSliderBar("page_scroll", {
            fill: true,
            number: triggerSetting.value,
          });
        }
      }
    }

    const customerTrigger = contentSetting.customer_trigger;
    if (customerTrigger) {
      await this.selectDropDown("customer", customerTrigger.type);

      if (customerTrigger.after_leave) {
        await this.selectDropDown("after_leave", customerTrigger.after_leave);
      }

      if (customerTrigger.returning_time) {
        await this.editSliderBar("returning_time", {
          fill: true,
          number: customerTrigger.returning_time,
        });
      }
    }

    await this.changeContent({
      content: contentSetting?.name,
    });
  }

  async setupPosition(positionSetting: PopupStylePosition) {
    const positionIndex = positionSetting.position - 1;
    await this.page.locator("ul[class$=position-select] li").nth(positionIndex).click();

    if (positionSetting.push_page_down !== undefined) {
      await this.switchToggle("push_page_down", positionSetting.push_page_down);
    }
  }

  async getSectionZIndexes(sectionsLocator: Locator[]) {
    const sectionIndexs = [];
    let popupZIndex = 0;
    for (const section of sectionsLocator) {
      const zIndex = await getStyle(section, "z-index");

      let realzIndex = 0;
      if (zIndex === "auto") {
        realzIndex = 0;
      } else {
        realzIndex = parseInt(zIndex);
      }

      const sectionClasses = await section.getAttribute("class");
      if (sectionClasses.includes("section-popup")) {
        popupZIndex = realzIndex;
      } else {
        sectionIndexs.push(realzIndex);
      }
    }

    return {
      popupZIndex: popupZIndex,
      sectionZIndexes: sectionIndexs,
    };
  }

  async getSectionsUnderFooterLayerGroup(): Promise<string[]> {
    const sectionUnderFooterLocs = await this.genLoc(this.xpathLayerUnderFooters).all();

    const sections = [];
    for (let i = 0; i < sectionUnderFooterLocs.length; i++) {
      const section = sectionUnderFooterLocs[i];
      const text = await section.textContent();
      sections.push(text.trim());
    }

    logger.info(`Footer sections: ${JSON.stringify(sections)}`);
    return sections;
  }

  async deleteAllExistingPopup() {
    await this.clickBtnNavigationBar("layer");

    const xpathPopup =
      "//div[@class='w-builder__layers-footer']//div[@data-id and contains(normalize-space(), 'Popup')]";
    let existPopup = await this.genLoc(xpathPopup).first().isVisible();
    while (existPopup) {
      await this.clickBtnNavigationBar("layer");
      await this.genLoc(xpathPopup).first().click();
      await this.genLoc(this.xpathButtonDeleteBlock).click();
      existPopup = await this.genLoc(xpathPopup).first().isVisible();
    }
  }

  async deleteAllExistingButton(buttonNames: string[]) {
    for (const buttonName of buttonNames) {
      const xpathButton = `//section[contains(@class, 'block') and normalize-space()='${buttonName}']`;
      const isButtonExist = await this.genLocFrame(xpathButton).isVisible();
      if (isButtonExist) {
        await this.genLocFrame(xpathButton).click();
        await this.genLoc(this.xpathButtonDeleteBlock).click();
      }
    }
  }

  async insertPopups(popups: PopupSettings[]): Promise<string[]> {
    logger.info(`Start insert ${popups.length} popup`);
    const popupId = [];
    for (const popup of popups) {
      await this.clickBtnNavigationBar("layer");
      // Insert popup to wb
      await this.insertSectionBlock({
        parentPosition: {
          section: 4,
        },
        position: "Top",
        category: "Basics",
        template: "Popup",
      });

      popupId.push(await this.getAttrsDataId());

      // Setting content
      if (popup.content) {
        await this.setPopupContentSetting(popup.content);
      }

      // Setting style
      if (popup.style) {
        await this.setPopUpDesign(popup.style);
      }

      const xpathAddBlock = `//div[contains(@class, 'insert-block-indicator__container')]`;

      if (popup.paragraph) {
        // Hover to center popup
        const selectedPopupXpath = "//section[contains(@class, 'popup-selected')]";
        const parentBox = await this.genLocFrame(selectedPopupXpath).boundingBox();
        await this.page.mouse.move(parentBox.x + parentBox.width / 2, parentBox.y + parentBox.height / 2);

        // Click insert button
        await this.genLocFrame(xpathAddBlock).last().click();

        // Select category
        const category = "Basics";
        const categorySelector = `//p[contains(@class,'insert-category-name') and normalize-space()='${category}']`;
        await this.genLoc(categorySelector).click();

        // Select paragraph
        const template = "Paragraph";
        const templateIndex = 1;
        const templateSelector = `(//div[div[normalize-space()='${template}']][contains(@class,'insert-template-wrapper') or contains(@class,'insert-basic-preview')]/child::div[contains(@class,'insert-template-preview')  or contains(@class,'card')])[${templateIndex}]`;

        await this.searchbarTemplate.fill("Paragraph");
        await this.genLoc(templateSelector).click();
        await this.selectOptionOnQuickBar("Edit text");
        await pressControl(this.page, "A");
        await this.page.keyboard.press("Backspace");
        await this.page.waitForTimeout(1 * 1000);
        await this.page.keyboard.type(popup.paragraph);
      }

      if (popup.button) {
        // Hover to center popup
        const selectedPopupXpath = "//section[contains(@class, 'popup-selected')]";
        const parentBox = await this.genLocFrame(selectedPopupXpath).boundingBox();
        await this.page.mouse.move(parentBox.x + parentBox.width / 2, parentBox.y + parentBox.height / 2);

        // Click insert button
        await this.genLocFrame(xpathAddBlock).last().click();

        // Select category
        const category = "Basics";
        const categorySelector = `//p[contains(@class,'insert-category-name') and normalize-space()='${category}']`;
        await this.genLoc(categorySelector).click();

        // Select paragraph
        const template = "Button";
        const templateIndex = 1;
        const templateSelector = `(//div[div[normalize-space()='${template}']][contains(@class,'insert-template-wrapper') or contains(@class,'insert-basic-preview')]/child::div[contains(@class,'insert-template-preview')  or contains(@class,'card')])[${templateIndex}]`;

        await this.searchbarTemplate.fill("Button");
        await this.genLoc(templateSelector).click();
        await this.switchToTab("Content");
        await this.setButtonContentSetting({
          label: popup.button.label,
          action: popup.button.action,
        });
      }

      // Click back to close popup
      await this.genLoc(this.xpathPopup.sidebar.backIcon).click();
    }
    return popupId;
  }

  async insertButton(buttonSettings: InsertButtonWithSetting[]) {
    for (const buttonSetting of buttonSettings) {
      await this.insertSectionBlock({
        parentPosition: {
          section: buttonSetting.position.section,
          row: buttonSetting.position.row,
          column: buttonSetting.position.column,
        },
        position: "Top",
        category: "Basics",
        template: "Button",
      });

      await this.switchToTab("Content");

      await this.setButtonContentSetting({
        label: buttonSetting.contentSetting.label,
        action: buttonSetting.contentSetting.action,
        popup: buttonSetting.contentSetting.popup,
      });
    }
  }

  async setButtonContentSetting(setting: ButtonContentSetting) {
    if (setting.label) {
      await this.inputTextBox("title", setting.label);
    }

    if (setting.action) {
      const xpathAction = `//div[contains(@class,'w-builder__widget--link')]//div[contains(@class,'sb-flex-align-center') and descendant::label[normalize-space()='Action']]`;
      await this.selectDropDown(xpathAction, setting.action);
    }

    if (setting.popup) {
      const xpathPopup = `//div[contains(@class,'w-builder__widget--link')]//div[contains(@class,'sb-flex-align-center') and descendant::label[normalize-space()='Popup']]`;
      await this.selectDropDown(xpathPopup, setting.popup);
    }

    await this.titleBar.click({ delay: 300 });
  }

  async clickOnBackgroundSetting() {
    const backgroundPopover = this.genLoc(`${this.popOverXPath}//label[normalize-space()='Background']`);

    // Click mở edit background nếu popover chưa hiển thị
    if (await backgroundPopover.isHidden()) {
      await this.genLoc(`//div[contains(@data-widget-id,'background')]//button`).click();
    }
  }

  /**
   * Hàm upload img mới cho section, row, column
   * @param param0
   * @returns
   */
  async uploadImageBackground(data: BackGround): Promise<void> {
    await this.clickOnBackgroundSetting();
    await this.getTabBackground("Image").click();
    await this.genLoc(this.popOverXPath).locator(".sb-tab-panel").nth(1).waitFor();
    await this.genLoc(`//span[contains(@class, 'choose-variable-icon')]`).click();
    if (data.image.new.upload) {
      const [fileChooser] = await Promise.all([
        this.page.waitForEvent("filechooser"),
        this.genLoc("#popover-select-media-variable").locator(`//li[normalize-space()='Upload']`).click(),
      ]);
      await fileChooser.setFiles(data.image.new.upload);
    }
    if (data.image.new.gallery) {
      this.genLoc("#popover-select-media-variable").locator(`//li[normalize-space()='Select from gallery']`).click();
      await this.genLoc(".modal-library-image__list")
        .getByRole("img")
        .nth(data.image.new.gallery - 1)
        .click();
      await this.genLoc(`//button[normalize-space()='Insert']//span`).click();
    }
    await this.genLoc(this.xpathPopup.sidebar.background.loadingImage).waitFor({ state: "hidden" });
  }

  async publishTemplate(authRequest: APIRequestContext, templateId: number) {
    const endpoint = `https://${this.domain}/admin/themes/${templateId}.json`;
    const rawThemeResponse = await authRequest.put(endpoint, {
      data: {
        id: templateId,
        active: true,
        need_response: true,
      },
    });
    expect(rawThemeResponse.ok()).toBeTruthy();
  }

  async publishTemplateById(templateId: number) {
    const publishBtnLoc = this.genLoc(this.xpathPopup.onlineStore.templates.publishBtn(templateId));
    await publishBtnLoc.click();
    await expect(this.genLoc(this.xpathPopup.onlineStore.popupPublish.popupContainer)).toBeVisible();
    await this.genLoc(this.xpathPopup.onlineStore.popupPublish.publishBtn).click();
    await this.genLoc(this.xpathPopup.onlineStore.popupPublish.popupContainer).waitFor({ state: "hidden" });
  }

  async getTemplateIdInListTemplate(name: string): Promise<number> {
    const templateBlockLoc = this.genLoc(this.xpathPopup.onlineStore.templates.templateIdBlock(name)).first();
    const isTemplateBlockVisible = await templateBlockLoc.isVisible();
    if (!isTemplateBlockVisible) {
      return 0;
    }

    const rawId = await templateBlockLoc.innerText();
    const match = rawId.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }
}
