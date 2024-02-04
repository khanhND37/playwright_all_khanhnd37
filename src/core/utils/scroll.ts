import type { ScrollUntilEleVisible } from "@types";
import { Page } from "@playwright/test";

/**
 * Hàm scroll đến khi thấy Ele (chưa load trong DOM, lazyload, ....)
 * @param scrollInfo.page: scroll cả page,
 * @param scrollInfo.scrollEle: màn cần scroll (filter, template,...)
 * @param scrollInfo.viewEle: Ele cần verify visible
 */
export const scrollUntilElementIsVisible = async (scrollInfo: ScrollUntilEleVisible) => {
  let retries = 0;
  if (scrollInfo.scrollEle) {
    const box = await scrollInfo.scrollEle.boundingBox();
    await scrollInfo.scrollEle.hover();
    while (!(await scrollInfo.viewEle.isVisible())) {
      await scrollInfo.page.mouse.wheel(box.y, box.y + box.height);
      retries += 1;
      if (retries > 10) {
        break;
      }
    }
  } else {
    while (!(await scrollInfo.viewEle.isVisible())) {
      await scrollInfo.page.mouse.wheel(0, 600);
      retries += 1;
      if (retries > 10) {
        break;
      }
    }
  }
};

/**
 * scroll to end of block by xpath
 * @param xpath: xpath
 * @param isScrollable: check is block can be scroll
 */
export const scrollToEndOfBlock = async (page: Page, xpath: string, frameXpath?: string, isScrollable?: boolean) => {
  const frame = frameXpath && frameXpath.length > 0 ? page.frameLocator(frameXpath) : page;
  const locator = frame.locator(xpath);
  await locator.waitFor({ state: "visible" });
  if (isScrollable) {
    const status = await locator.evaluate(e => e.clientHeight > 0 && e.clientHeight < e.scrollHeight);
    if (!status) {
      throw new Error("Can't scroll due client height is small than scroll height");
    }
  }
  await locator.evaluate(e => (e.scrollTop = e.scrollHeight));
};

/**
 * scroll to top of block by xpath
 * @param xpath: xpath
 */
export const scrollToTopOfBlock = async (page: Page, xpath: string, frameXpath?: string) => {
  const frame = frameXpath && frameXpath.length > 0 ? page.frameLocator(frameXpath) : page;
  const locator = frame.locator(xpath);
  await locator.waitFor({ state: "visible" });
  await locator.evaluate(e => (e.scrollTop = 0));
};
