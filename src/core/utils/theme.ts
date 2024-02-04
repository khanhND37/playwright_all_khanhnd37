import { expect, Page } from "@playwright/test";
import type { NavigationPage } from "@types";
import { waitForProgressBarDetached } from "@utils/storefront";

/**
 * Config snapshot director
 */
export const snapshotDir = (filename): string => {
  return process.env.ENV === "local" ? `${filename}-snapshots-local` : `${filename}-snapshots`;
};

/**
 * Verify navigation page after click on element (button, text link, image link...)
 * Open new tab if input context
 * @param page
 * @param selector
 * @param context
 * @param redirectUrl
 * @param waitForElement
 * @param popupConfirm
 */
export const verifyRedirectUrl = async ({
  page,
  selector,
  context,
  redirectUrl,
  waitForElement,
  popupConfirm,
}: NavigationPage): Promise<Page> => {
  let currentTab = page;
  if (!redirectUrl) {
    redirectUrl = currentTab.url().split("?")[0];
  }
  await currentTab.locator(selector).first().hover();
  if (context) {
    const page404 = page
      .locator("//h2[contains(@class,'notfound-page__title') or contains(@class,'display')]")
      .or(page.locator("//div[contains(@class,'block-heading white') and normalize-space()='Page not found']"));
    const [newTab] = await Promise.all([context.waitForEvent("page"), currentTab.locator(selector).first().click()]);
    currentTab = newTab;
    await currentTab.waitForLoadState("networkidle");
    if (await page404.isVisible()) {
      await page.reload();
      await currentTab.waitForResponse(/theme.css/);
    }
  } else {
    await currentTab.locator(selector).first().click();
    await waitForProgressBarDetached(currentTab);
    if (popupConfirm) {
      await currentTab.locator(`//span[contains(text(), 'Leave')]`).click();
    }
  }

  if (waitForElement) {
    await currentTab.waitForSelector(waitForElement);
  }

  const actualUrl = currentTab.url();
  expect(actualUrl).toContain(redirectUrl);
  return currentTab;
};

/**
 * Verify number of selectors
 * @param page
 * @param selector
 * @param number
 */
export const verifyCountSelector = async (page: Page, selector: string, number: number) => {
  const count = await page.locator(selector).count();
  expect(count).toEqual(number);
};

/**
 Generate gmail by date time
 */
export const generateEmail = (): string => {
  const timestamp = new Date().getTime();
  return `shopbase${timestamp}@gmail.com`;
};

/**
 * Wait load selector
 * @param page
 * @param selector
 */
export const waitSelector = async (page: Page, selector: string) => {
  const element = await page.waitForSelector(selector);
  await page.locator(selector).scrollIntoViewIfNeeded();
  await element.waitForElementState("stable");
};

/**
 * Verify screenshot of carousel image
 * @param page
 * @param snapshotName
 * @param selectorImage
 * @param selectorSection
 */
export const verifyCarouselWithSnapshot = async (
  page: Page,
  snapshotName: string,
  selectorImage: string,
  selectorSection: string,
) => {
  await page.locator(selectorImage).scrollIntoViewIfNeeded();
  const isThumbnailImage = await page.locator(selectorImage).count();
  if (isThumbnailImage > 0) {
    await waitForImageLoaded(page, selectorImage);
  }
  const sliderInner = await page.waitForSelector(`${selectorSection} .VueCarousel-inner`);
  await sliderInner.waitForElementState("stable");
  expect(await page.locator(selectorSection).screenshot()).toMatchSnapshot(snapshotName, {
    maxDiffPixelRatio: 0.05,
  });
};

/**
 * Wait for image loaded successfully.
 * Selector can be an img tag or a parent selector containing img tags
 * @param page
 * @param selector
 * @param iframe
 */
export const waitForImageLoaded = async (page: Page, selector: string, iframe?: string, throwErr = true) => {
  try {
    const selectorList: string[] = [];
    const frame = iframe ? page.frameLocator(iframe) : page;

    if (selector.includes("img")) {
      selectorList.push(selector);
    } else {
      if (selector.includes("/")) {
        await frame.locator(selector).scrollIntoViewIfNeeded({
          timeout: 10 * 1000,
        });
        const count = await frame.locator(`${selector}//img`).count();
        for (let i = 0; i < count; i++) {
          selectorList.push(`(${selector}//img)[${i + 1}]`);
        }
      } else {
        const count = await frame.locator(`${selector} img`).count();
        for (let i = 0; i < count; i++) {
          selectorList.push(`${selector} img >> nth=${i}`);
        }
      }
    }
    for (const locator of selectorList) {
      if (await frame.locator(locator).isVisible()) {
        await frame.locator(locator).scrollIntoViewIfNeeded();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await frame.locator(locator).evaluate((image: any) => {
          return image.complete || new Promise(f => (image.onload = f));
        });
      }
    }
  } catch (e) {
    if (throwErr) {
      throw e;
    }

    return;
  }
};

/**
 * Wait for image loading class hidden.
 * @param page
 * @param selector
 * @param iframe
 */
export const waitForImageLoadingClassHidden = async (page: Page, selector: string, iframe?: string) => {
  const frame = iframe ? page.frameLocator(iframe) : page;
  await frame.locator(selector).locator(`//img[contains(@class, 'loading')]`).waitFor({ state: "hidden" });
};

/**
 * dragAndDropElement
 * drag and drop element to any location
 */
export const dragAndDropElement = async (page: Page, selector: string, location: { x: number; y: number }) => {
  const element = await page.waitForSelector(selector);
  await element.hover();
  await page.mouse.down();
  await page.mouse.move(location.x, location.y);
  await element.hover();
  /* eslint-disable */
  await page.waitForTimeout(500);
  await page.mouse.up();
};

/**
 * Get element computed style by property
 * @param {Page} page
 * @param {string} selector
 * @param {string} property
 * @returns {Promise<string>}
 */
export const getElementComputedStyle = async (page: Page, selector: string, property: string) => {
  const element = await page.waitForSelector(selector);
  return element.evaluate((el, { property }) => window.getComputedStyle(el).getPropertyValue(property), {
    property,
  });
};
