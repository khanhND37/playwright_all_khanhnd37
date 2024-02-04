import type { Page } from "@playwright/test";

/**
 * Wait for progress bar storefront detached
 * @param page
 * @param iframe
 */
export async function waitForProgressBarDetached(page: Page, iframe?: string) {
  const currentPage = iframe ? page.frameLocator(iframe) : page;
  await currentPage.locator("#v-progressbar").waitFor({ state: "detached" });
}
