export const offerButton = `//p[contains(text(),'Offer')]/ancestor::div[contains(@class, 'w-builder__layer-title')]/preceding-sibling::div//button`;
export const acceptOfferButton = `//p[contains(text(),'Accept offer')]/ancestor::div[contains(@class, 'w-builder__layer-title')]`;

export const optionOfferPage = `//div[contains(@class, 'w-builder__page-groups--item-label') and normalize-space(text()) = 'Offer page']`;
/**
 * Select product to preview in header webbuilder
 * @param dashboard
 * @param frameLocator
 * @param name
 */
export const selectProductPreview = async ({ dashboard, frameLocator, name }) => {
  await dashboard.locator("div.w-builder__autocomplete").click();
  await dashboard.locator("//input[@placeholder='Search products']").click();
  await dashboard.locator("//input[@placeholder='Search products']").fill(name);
  await dashboard.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });

  await dashboard.waitForSelector(`//div[normalize-space()='${name}'][2]`);
  await dashboard.locator(`//div[normalize-space()='${name}'][2]`).click();
  await frameLocator.locator("#v-progressbar").waitFor({ state: "visible" });
  await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
  await dashboard.waitForLoadState("networkidle");
};
