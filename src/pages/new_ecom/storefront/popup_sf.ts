import { expect, Locator, Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { OcgLogger } from "@core/logger";
import { getStyle } from "@utils/css";
import { PopupSfLocators } from "@types";

const logger = OcgLogger.get();

export class PopupSfPage extends Blocks {
  xpathSfSectionPopup = "//section[contains(@class, 'section-popup') and not(contains(@id, 'cart_drawer'))]";
  xpathWbSections = "//section[contains(@class, 'wb-preview__section')]";
  xpathWbOverlay = "//div[contains(@class, 'popup-overlay') and not(contains(@id, 'cart_drawer'))]";
  xpathButtonClosePopup =
    "//div[contains(@class, 'close-popup-button__wrapper')]//div[contains(@class, 'close-popup-button')]";

  xpathP = {
    popup: {
      popupById: popupId => `//section[@id='${popupId}']`,
      overlay: `//div[contains(@class, 'popup-overlay')]`,
      overlayPopupHaveId: popupId => `//div[@id='popup-overlay-${popupId}']`,
      containText: text => `//section[contains(@class, 'section-popup') and contains(normalize-space(), '${text}')]`,
      buttonHaveText: text =>
        `//section[contains(@class, 'section-popup') and contains(normalize-space(), '${text}')]//div[contains(@class, 'btn-primary') and normalize-space() = '${text}']`,

      closePopupHaveText: text =>
        `//section[contains(@class, 'section-popup') and contains(normalize-space(), '${text}')]//div[contains(@class, 'close-popup-button__line')]`,
      closePopupById: popupId => `//section[@id='${popupId}']//div[contains(@class, 'close-popup-button__line')]`,
    },
    button: {
      scrollpoint: `//section[@component="button" and normalize-space()='10% page']//span`,
      buttonHaveText: text => `//section[@component="button" and normalize-space()='${text}']//span`,
    },
  };

  constructor(page: Page, domain?: string) {
    super(page, domain);
  }

  getXpathPopupContainText(text: string): string {
    return `//section[contains(@class, 'section-popup') and normalize-space()='${text}']`;
  }

  async getCssPopupContainText(text: string, property: string): Promise<string> {
    const popupLoc = this.genLoc(this.getXpathPopupContainText(text));
    return getStyle(popupLoc, property);
  }

  getViewportWidth(): number {
    logger.info(`Viewport width: ${this.page.viewportSize().width}`);
    return this.page.viewportSize().width;
  }

  getViewportHeight(): number {
    logger.info(`Viewport height: ${this.page.viewportSize().height}`);
    return this.page.viewportSize().height;
  }

  async openStorefront() {
    await this.page.goto(`https://${this.domain}?date=${new Date()}`);
    const startTime = new Date().getTime();
    await this.page.waitForLoadState("networkidle");
    logger.info(`Time since last wait networkidle: ${new Date().getTime() - startTime}`);
  }

  /**
   * Round value contain px to a fixed number
   * Example: roundRawValueContainPx('1.922px') ~> 1.9px
   * @param rawValueContainPx:  raw value contain px
   * @param decimal: number of decimal want to round, default is 1
   * */
  roundRawValueContainPx(rawValueContainPx: string, decimal = 1) {
    const removedPxValue = rawValueContainPx.replace("px", "");
    const parsedValue = parseFloat(removedPxValue);
    return `${parsedValue.toFixed(decimal)}px`;
  }
  async removeExitPageTime() {
    await this.page.evaluate(() => {
      window.localStorage.removeItem("exit_page_time");
    });
  }

  async setExitPageTime(value) {
    await this.page.evaluate(() => {
      window.localStorage.setItem("exit_page_time", value);
    });
  }

  async waitForPopupDisplayed(timeout: number): Promise<void> {
    // Need wait here because popup  will appear after x second
    await this.page.waitForTimeout(timeout);
    // Wait util popup loaded
    await expect(this.genLoc(this.xpathP.popup.overlay).last()).toHaveClass(
      /popup-overlay is-selected positive-opacity/,
    );
  }

  async waitPopupLoaded() {
    // We use this expectation as condition to wait popup loaded
    await expect(this.genLoc(`//div[contains(@class, 'popup-overlay')]`).first()).toHaveClass(/.popup-overlay./);
  }

  async getCurrentLocalStorage() {
    return await this.page.evaluate(() => {
      return JSON.stringify(window.localStorage);
    });
  }

  async clickOutsidePopup() {
    await this.page.evaluate(() => {
      const x = window.screen.width / 2;
      const y = window.screen.height / 4;
      const ev = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
        screenX: x,
        screenY: y,
      });

      const el = document.elementFromPoint(x, y);
      el.dispatchEvent(ev);
    });
  }

  async getPopupLocs(textContent: string, triggerButtonText?: string): Promise<PopupSfLocators> {
    const popupLoc = this.genLoc(
      `//section[contains(@class, 'section-popup') and contains(normalize-space(), '${textContent}')]`,
    ).first();
    const popupId = await popupLoc.getAttribute("data-section-id");
    const overlayLoc = this.genLoc(`//div[@id='popup-overlay-${popupId}']`);
    const closeButtonLoc = this.genLoc(
      `//section[contains(@class, 'section-popup') and contains(normalize-space(), '${textContent}')]//div[contains(@class, 'close-popup-button__line')]`,
    ).first();
    let triggerButtonLoc: Locator = null;

    if (triggerButtonText) {
      triggerButtonLoc = this.genLoc(
        `//section[@component='button' and contains(normalize-space(), '${triggerButtonText}')]`,
      ).first();
    }

    return {
      popup: popupLoc,
      overlay: overlayLoc,
      closeButton: closeButtonLoc,
      triggerButton: triggerButtonLoc,
    };
  }

  async getOverlayValue(overlayLoc: Locator) {
    const overlayStyles = await overlayLoc.getAttribute("style");
    const opacityMatch = overlayStyles.match(/opacity:\s*([^;]+)/);
    if (opacityMatch && opacityMatch.length > 1) {
      return parseFloat(opacityMatch[1]);
    }

    return -1;
  }

  async isClickError(locator: Locator) {
    try {
      await locator.click({
        timeout: 2000,
      });

      return false;
    } catch (e) {
      return true;
    }
  }
}
