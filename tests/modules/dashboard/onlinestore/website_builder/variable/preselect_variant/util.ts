import { expect } from "@fixtures/website_builder";
import { XpathNavigationButtons } from "@constants/web_builder";

const xpathDataSourceProduct =
  "//button[contains(@class,'sb-button--select sb-button--medium') and descendant::span[normalize-space()='Product']]";
const xpathPopupSearchSource =
  "//*[@id='widget-popover' and not(contains(@style,'display: none'))]//div[@class='search-source']";
const xpathButtonSelectDefaultVariant =
  "//div[contains(@class, 'w-builder__widget--label') and label[contains(@class, 'w-builder__label') and normalize-space(text()) = 'Default variant']]/following-sibling::div";

export const settingWebBuilder = async ({ conf, caseConfig, dashboard, webBuilder, blocks, index }) => {
  await dashboard.waitForTimeout(3000);
  await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.dnd_blank_section);
  await webBuilder.changeContent(conf.suiteConf.section_name);
  // kéo block button
  await webBuilder.dragAndDropInWebBuilder(conf.caseConf.add_block);
  //setup content button
  await blocks.switchToTab("Content");
  await dashboard
    .locator(
      `//div[contains(@class, 'w-builder__widget--label') and label[contains(@class, 'w-builder__label') and normalize-space(text()) = 'Label']]/parent::div/following-sibling::div//input`,
    )
    .fill("Add to cart");
  await dashboard.waitForTimeout(500);
  await dashboard
    .locator(
      `//div[contains(@class, 'w-builder__widget--label') and label[normalize-space(text()) = 'Action']]/following-sibling::div`,
    )
    .click({ delay: 500 });
  await dashboard
    .locator(`//ul[contains(@class, 'widget-select__list')]//li[@value='add_to_cart']`)
    .click({ delay: 500 });
  await dashboard.waitForTimeout(500); //chờ button được apply setting
  //setup data source for section
  await blocks.clickBackLayer();
  await blocks.clickSectionInSidebar("header", 0);
  if (
    await dashboard
      .locator(
        `//label[contains(text(), 'Data source')]/ancestor::div[contains(@class, 'w-builder__widget--label')]/following-sibling::div//span[contains(text(), "${caseConfig.setup_web_builder.products[index]}")]`,
      )
      .isHidden()
  ) {
    await dashboard.click(`#search-data-source`, { delay: 500 });
    await dashboard.click(xpathDataSourceProduct, { delay: 500 });
    await dashboard.click(
      `(//div[contains(@class,'list-search-result')]//div[@data-select-label and descendant::span[normalize-space(text()) = "${caseConfig.setup_web_builder.products[index]}"]])[1]`,
      { delay: 1000 },
    );
  }
  await dashboard.click(xpathButtonSelectDefaultVariant, { delay: 500 });
  //select product variant
  await dashboard
    .locator(
      `${xpathPopupSearchSource}//div[contains(@class, 'w-builder__search-data-source-result') and descendant::div[contains(text(), '${caseConfig.setup_web_builder.variant}')]]`,
    )
    .click({ delay: 500 });
  await dashboard.waitForTimeout(1000); //chờ bên webfront update variant
  //set websetting
  await webBuilder.clickIconWebsiteSetting();
  await webBuilder.clickCategorySetting("Product");
  await dashboard
    .locator(
      `//label[normalize-space(text()) = 'Default variant selection']/ancestor::div[contains(@class, 'sb-flex sb-flex-justify-space-between')]/following-sibling::div//button`,
    )
    .click({ delay: 500 });
  await dashboard.waitForSelector(
    `//ul[contains(@class, 'widget-select__list')]//li[label[normalize-space(text()) = '${caseConfig.setup_web_builder.websetting}']]`,
  );
  await dashboard
    .locator(
      `//ul[contains(@class, 'widget-select__list')]//li[label[normalize-space(text()) = '${caseConfig.setup_web_builder.websetting}']]`,
    )
    .click({ delay: 500 });
  //save
  await dashboard.locator(XpathNavigationButtons["save"]).click({ delay: 500 });
  await dashboard.waitForSelector("text='All changes are saved'");
};

export const goToPagePreview = async ({ conf, caseConfig, dashboard, blocks, context, index }) => {
  const [previewTab] = await Promise.all([
    context.waitForEvent("page"),
    await dashboard.click(blocks.xpathButtonPreview),
  ]);
  await previewTab.waitForLoadState("networkidle");
  await previewTab.locator(`(//div[contains(@class, 'wb-button--add-cart__primary')])[1]`).click();
  await previewTab
    .locator(`//div[@id='variant-selector-popup']//span[@class='price-span']`)
    .waitFor({ state: "visible", timeout: 5000 });
  await previewTab.locator(`//button[@id='variant-selector-popup-atc']`).click();
  switch (caseConfig.preview_add_to_card.expect[index]) {
    case "add_card_success": {
      await previewTab
        .locator(`//button[@id='variant-selector-popup-atc' and contains(@class, 'loading-spinner')]`)
        .waitFor({ state: "visible", timeout: 5000 });
      await previewTab
        .locator(`//button[@id='variant-selector-popup-atc' and contains(@class, 'loading-spinner')]`)
        .waitFor({ state: "hidden", timeout: 5000 });
      await previewTab.locator("#v-progressbar").waitFor({ state: "detached", timeout: 5000 });
      await previewTab.waitForLoadState("networkidle");
      const actualUrl = await previewTab.url().toString();
      await previewTab.waitForSelector(`//h3//span[text()='Your cart']`);
      await expect.soft(actualUrl).toEqual(`https://${conf.suiteConf.domain}/cart`);
      break;
    }
    case "require_input": {
      await expect
        .soft(
          previewTab.locator(
            `(//div[@id='variant-selector-popup']//div[@class='outside-modal__body popover-bottom__content relative']//div[@msg-invalid='true'])[1]`,
          ),
        )
        .toBeVisible({ timeout: 5000 });
      break;
    }
  }
  await previewTab.close();
};

export const goToPageStorefront = async ({ conf, caseConfig, context, index }) => {
  const url = new URL(`https://${conf.suiteConf.domain}/products/livingston-demilune-console-umber`);
  const params = new URLSearchParams(url.search);
  params.append("theme_preview_id", `${conf.suiteConf.theme_id}`);
  params.delete("preview");
  const storefront = await context.newPage();
  await storefront.goto(`${url.origin}${url.pathname}?${params.toString()}`);
  await storefront.waitForLoadState("networkidle");
  await storefront.click(`(//div[contains(@class, 'wb-button--add-cart__primary')])[1]`);
  await storefront
    .locator(`//div[@id='variant-selector-popup']//span[@class='price-span']`)
    .waitFor({ state: "visible", timeout: 5000 });
  await storefront.locator(`//button[@id='variant-selector-popup-atc']`).click();
  switch (caseConfig.preview_add_to_card.expect[index]) {
    case "add_card_success": {
      await storefront
        .locator(`//button[@id='variant-selector-popup-atc' and contains(@class, 'loading-spinner')]`)
        .waitFor({ state: "visible", timeout: 5000 });
      await storefront
        .locator(`//button[@id='variant-selector-popup-atc' and contains(@class, 'loading-spinner')]`)
        .waitFor({ state: "hidden", timeout: 5000 });
      await storefront.locator("#v-progressbar").waitFor({ state: "detached", timeout: 5000 });
      await storefront.waitForLoadState("networkidle");
      const actualUrl = await storefront.url().toString();
      await storefront.waitForSelector(`//h3//span[text()='Your cart']`);
      await expect.soft(actualUrl).toEqual(`https://${conf.suiteConf.domain}/cart`);
      break;
    }
    case "require_input": {
      await expect
        .soft(
          storefront.locator(
            `(//div[@id='variant-selector-popup']//div[@class='outside-modal__body popover-bottom__content relative']//div[@msg-invalid='true'])[1]`,
          ),
        )
        .toBeVisible({ timeout: 5000 });
      break;
    }
  }
  await storefront.close();
};
