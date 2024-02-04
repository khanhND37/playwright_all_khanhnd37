import { expect } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Page } from "@playwright/test";

const xpathButtonPreview = ":nth-match(.w-builder__header-right > span, 3) button";
const xpathButtonSave = ".w-builder__header-right .sb-button--primary >> text=Save";
const xpathToast = ".sb-toast__message";

/**
 * Add block into web builder
 */
export const addBlockIntoWB = async (
  suiteConf,
  dashboard: Page,
  blockInfo: { block_name: string },
  section: number,
) => {
  const domain = suiteConf.domain;
  const webBuilder = new WebBuilder(dashboard, domain);
  const blockTemplate = {
    from: {
      category: "Basics",
      template: blockInfo.block_name,
    },
    to: {
      position: {
        section: section,
        column: 1,
      },
      isBottom: false,
    },
  };
  await webBuilder.dragAndDropInWebBuilder(blockTemplate);
};

/**
 * Click icon save
 */
export const clickSaveButton = async ({ dashboard }) => {
  await dashboard.click(xpathButtonSave);
  await expect(dashboard.locator("div.w-builder__header-message")).toContainText("All changes are saved");
  await dashboard.waitForSelector(xpathToast, { state: "hidden" });
};

/**
 * Click preview button
 */
export const clickPreviewButton = async ({ context, dashboard }) => {
  const [previewTab] = await Promise.all([context.waitForEvent("page"), await dashboard.click(xpathButtonPreview)]);
  return previewTab;
};

/**
 * Set variable on Quickbar
 * @param dataType: exp: shop|product|collection|page|blog|blog post
 * @param variableOption: exp: shop name|shop domain...
 */
export const setVariableOnQuickbar = async (suiteConf, dashboard: Page, dataType: string, variableOption: string) => {
  const domain = suiteConf.domain;
  const webBuilder = new WebBuilder(dashboard, domain);
  await webBuilder.frameLocator.locator("[class*='is-chevron'] span:text-is('Get text from')").click();
  if (dataType == "Blog post") {
    await webBuilder.frameLocator.locator("//div[./div[text()='Blog Post']]").click();
  } else {
    await webBuilder.frameLocator.locator(`//div[./div[text()='${dataType}']]`).click();
  }
  await webBuilder.frameLocator
    .locator(`div[class*=quick-settings__group-options__item]:text-is("${variableOption}")`)
    .click({ delay: 1000 });
};

/**
 * Set variable on Sidebar with widget type = image
 * @param widget: widget name on sidebar
 * @param dataType: exp: shop|product|collection|page|blog|blog post
 * @param variableFields: variable option
 * @
 */
export const setVariableTypeImage = async (
  dashboard: Page,
  widget: string,
  dataType: string,
  variableFields: string,
) => {
  await dashboard.locator(`[data-widget-id=${widget}] .w-builder__choose-variable-icon`).click();
  await dashboard.locator(`[class*='select-source-list'] label:text-is('Get image from ${dataType}')`).hover();
  await dashboard.locator(`[id='select-variable-item-${dataType}'] div:has-text("${variableFields}")`).last().click();
};

/**
 * Set variable on Sidebar with widget type = text
 * @param widget: widget name on side bar
 * @param dataType: exp: shop|product|collection|page|blog|blog post
 * @param variableFields: variable option
 */
export const setVariableTypeText = async (
  dashboard: Page,
  widget: string,
  dataType: string,
  variableFields: string,
) => {
  await dashboard.locator(`[data-widget-id=${widget}] .w-builder__choose-variable-icon`).click();
  await dashboard.locator(`[id='popover-select-text-variable'] div:text-is('Get text from ${dataType}')`).click();
  if (dataType == "blog post") {
    await dashboard.locator(`[id='select-text-variable-blog_post'] div:text-is("${variableFields}")`).click();
  } else {
    await dashboard.locator(`[id='select-text-variable-${dataType}'] div:text-is("${variableFields}")`).click();
  }
};

/**
 * Add first blank section
 */
export const addNewSection = async (dashboard: Page, suiteConf) => {
  const domain = suiteConf.domain;
  const webBuilder = new WebBuilder(dashboard, domain);
  await dashboard.locator('header [name="Layer"]').click();
  await webBuilder.openLayerSettings({
    sectionName: "Single column",
    sectionIndex: 1,
  });
  await webBuilder.insertSectionBlock({
    parentPosition: {
      section: 1,
    },
    position: "Bottom",
    category: "Basics",
    template: "Single column",
  });
};

/**
 * Remove first section
 */
export const removeFirstSection = async (dashboard: Page, suiteConf) => {
  const domain = suiteConf.domain;
  const webBuilder = new WebBuilder(dashboard, domain);
  await dashboard.locator('header [name="Layer"]').click();

  await webBuilder.openLayerSettings({
    sectionName: "Section",
    sectionIndex: 1,
  });
  await dashboard.locator("button span:text-is('Delete section')").click();
};

export const addBlockIntoElement = async (parentXpath: string, blockName: string, suiteConf, dashboard) => {
  const domain = suiteConf.domain;
  const webBuilder = new WebBuilder(dashboard, domain);
  await webBuilder.frameLocator.locator(parentXpath).hover();
  await webBuilder.frameLocator
    .locator('//div[@data-block-component="container"]//span[contains(text(), "Add block")]')
    .click({ delay: 1000 });
  await dashboard.locator('[placeholder="Search"]').click();
  await dashboard.locator('[placeholder="Search"]').fill(blockName);
  await dashboard
    .locator(`//p[contains(text(), "${blockName}")]/ancestor::div[@class="w-builder__insert-basic-preview"]`)
    .click();
};
