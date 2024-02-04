import { Page } from "@playwright/test";
import { expect, test } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";

export type verifyTemplate = {
  pageId?: number;
  siteId?: number;
  type: string;
  templateName: string;
  fontHead: string;
  fontPara: string;
};

export type openSaveTemplatePopup = {
  siteId?: number;
  type: string;
  fontHead?: string;
  fontPara?: string;
  openLayer?;
  color?: string;
};

export type dataSaveAsTemplate = {
  template_name?: string;
  library?: string;
  store_type?: string;
  tags?: string;
  preview_desktop?: string;
  preview_mobile?: string;
  preview_thumbnail?: string;
};
export const xpathActionFirst = "//button[normalize-space()='Actions']";
export const popupSaveAsTemplate = "#modal-save-as-template .sb-popup__container";
export const xpathSaveAsTemplateInAction = `(//*[@role='tooltip' and not(contains(@style, 'display: none'))])//li[normalize-space()='Save as template']`;
export const textBoxXpath = (field: string) => {
  return `//label[contains(., '${field}')]/parent::div//following-sibling::div//input`;
};

export const btnCancelPopupSaveAs = "//button[contains(normalize-space(), 'Cancel')]";
export const btnSavePopupSaveAs = "//button[contains(normalize-space(), 'Save')]";

export const deleteLibrary = async (builder, conf) => {
  const promies = [];
  const libraryData = await builder.listLibrary(conf.suiteConf.libraries_action);
  for (const library of libraryData) {
    if (library.shop_id === conf.suiteConf.shop_id) {
      promies.push(builder.deleteLibrary(library.id));
    }
  }
  if (promies.length > 0) {
    await Promise.all(promies);
  }
};

//set font template
export const setFont = async (dashboard, font) => {
  await dashboard.locator('//label[contains(., "Font")]/ancestor::div[2]//span').last().click();
  await dashboard.locator('[placeholder="Search"]').last().click();
  await dashboard.locator('[placeholder="Search"]').last().fill(font);
  await dashboard.click(".sb-popover__popper .w-builder__font-group--menu-font-item");
  await dashboard.locator(".sb-select-menu li").first().click();
};

//input template name & save
export const inputTemplateName = async (type: string, dashboard: Page, templateName: string) => {
  await test.step("Input template name", async () => {
    switch (type) {
      case "color":
        await dashboard.locator(textBoxXpath("Color name")).fill(templateName);
        break;
      case "font":
        await dashboard.locator(textBoxXpath("Font name")).fill(templateName);
        break;
      default:
        await dashboard.locator(textBoxXpath("Template name")).fill(templateName);
        break;
    }
    await dashboard.locator(".sb-popup__footer-button").last().click();
  });
};

//verify success message
export const verifySuccessMess = async (type, dashboard, cateName?) => {
  let successMess = "";
  switch (type) {
    case "section":
      successMess = `text='Save template successfully to Category ${cateName}.'`;
      break;
    case "block":
      successMess = `text='Save template successfully to Category ${cateName}.'`;
      break;
    case "page":
      successMess = "text=Save template successfully to Library";
      break;
    case "font":
      successMess = "text=Save this font preset to library successfully";
      break;
    case "color":
      successMess = "text=Save this color preset to library successfully";
      break;
  }
  await expect(dashboard.locator(successMess)).toBeVisible();
  await dashboard.locator(successMess).waitFor({ state: "hidden" });
};

//create category on save as template popup
export const createCate = async (dashboard: Page, cateName, icon) => {
  const autocompletePopover = dashboard.locator("[id*=popover]:not([style*=none]) [class*=autocomplete]");
  const chooseCategory = dashboard.locator(textBoxXpath("Category")).first();
  if (await chooseCategory.isDisabled()) {
    await dashboard
      .locator("[class*=form-item]")
      .filter({ hasText: "Category" })
      .locator("span[class*=suffix]:not([style='display: none;']) [id*=Close]")
      .click();
    await autocompletePopover.waitFor();
  }

  await chooseCategory.click();
  await expect(dashboard.locator('[x-placement="bottom"] .sb-autocomplete__no-results span')).toHaveText(
    "Type to create new",
  );
  await dashboard.locator(".sb-popup__header").last().click();
  await expect(dashboard.locator("//div[contains(@class, 'sb-form-item__message')]").last()).toHaveText(
    " Please input category ",
  );
  await chooseCategory.fill(cateName);
  await dashboard.locator(`text=Add "${cateName}"`).click();
  //choose icon
  await dashboard.locator("//button[@class='sb-button sb-w-100 sb-button sb-w-100']").click();
  await dashboard.locator(icon).click();
};

//verify not show template
export const verifyDisableTemplate = async (
  conf,
  dashboard,
  { pageId, siteId, type, templateName, fontHead, fontPara }: verifyTemplate,
) => {
  if (siteId) {
    await dashboard.goto(`https://${conf.suiteConf.domain}/admin/themes/builder/site/${siteId}`);
  } else {
    await dashboard.goto(`https://${conf.suiteConf.domain}/admin/builder/page/${pageId}`);
  }
  await dashboard.waitForSelector(".w-builder__preview-overlay");
  await dashboard.waitForSelector(".w-builder__preview-overlay", { state: "hidden" });
  switch (type) {
    case "section":
    case "block":
      //verify on web builder not show template
      await dashboard.locator('[id="Icons/Navigation/Plus-(line)"]').click();
      await expect(dashboard.locator(`.w-builder__insert-categories p:has-text('${templateName}')`)).toBeHidden();
      break;
    case "font":
      await dashboard.locator("//button[@name = 'Styling settings']").click();
      await dashboard.click(".sb-text-bold:has-text('Fonts')");
      await expect(
        dashboard.locator(`.w-builder__font-group__library .w-builder__font-group__library--font-heading`).first(),
      ).not.toHaveText(fontHead);
      await expect(
        dashboard.locator(`.w-builder__font-group__library .w-builder__font-group__library--font-paragraph`).first(),
      ).not.toHaveText(fontPara);
      break;
    case "color":
      await dashboard.locator("//button[@name = 'Styling settings']").click();
      await dashboard.click(".sb-text-bold:has-text('Colors')");
      await dashboard
        .locator(".w-builder__color-group--library .w-builder__color-group--library-content")
        .first()
        .hover();
      await expect(dashboard.locator('[x-placement="top"] .sb-text-caption').first()).not.toHaveText(templateName);
      break;
  }
};

//open popup tao template
export const openSaveTemplatePopup = async (
  dashboard,
  conf,
  { siteId, type, fontHead, fontPara, openLayer, color }: openSaveTemplatePopup,
) => {
  const domain = conf.suiteConf.domain;
  const webBuilder = new WebBuilder(dashboard, domain);
  let element;
  await test.step("Go to page", async () => {
    if (siteId) {
      //Go to web front by theme ID
      await dashboard.evaluate(siteId => {
        // eslint-disable-next-line
        return (window as any).router.push(`/themes/builder/site/${siteId}`);
      }, conf.suiteConf.theme_id);
    } else {
      //Go to web front by page ID
      await dashboard.evaluate(pageId => {
        // eslint-disable-next-line
        return (window as any).router.push(`/builder/page/${pageId}`);
      }, conf.suiteConf.page_id);
    }
    await webBuilder.loadingScreen.waitFor({ state: "visible" });
    await webBuilder.waitResponseWithUrl("https://fonts.googleapis.com/css?family");
    //wait font update
    await webBuilder.waitAbit(500);
  });

  switch (type) {
    case "section":
    case "block":
      await test.step("Open quick bar by section name", async () => {
        await webBuilder.expandCollapseLayer({
          sectionName: openLayer.sectionName,
          isExpand: true,
        });
        await webBuilder.openLayerSettings(openLayer);
        await webBuilder.selectOptionOnQuickBar("Save as template");
      });
      break;
    case "page":
      element = await dashboard.waitForSelector("div.w-builder__layers");
      await element.waitForElementState("stable");
      await dashboard.click(".w-builder__header .w-builder__header-more-action");
      await dashboard.click("text=Save this page as a template");
      break;
    case "font":
      element = await dashboard.waitForSelector("div.w-builder__layers");
      await element.waitForElementState("stable");
      await dashboard.locator("//button[@name = 'Styling settings']").click();
      await dashboard.click(".sb-text-bold:has-text('Fonts')");
      //setting for heading
      await setFont(dashboard, fontHead);
      //setting for paragraph
      await dashboard.locator('.w-builder__font-group button span:has-text("Paragraph")').click();
      await setFont(dashboard, fontPara);
      await dashboard.click("text= Save to library ");
      break;
    case "color":
      element = await dashboard.waitForSelector("div.w-builder__layers");
      await element.waitForElementState("stable");
      await dashboard.locator("//button[@name = 'Styling settings']").click();
      await dashboard.click(".sb-text-bold:has-text('Colors')");
      await dashboard.locator(".sb-mb-medium input").last().fill(color);
      await dashboard.locator("text=Color palette").first().click();
      await dashboard.click("text= Save to library");
      break;
  }
};

export const xpathActionByShopThemeName = (themeName: string) => {
  return `//div[contains(@class,"page-designs__current") and normalize-space()="${themeName}"]//ancestor::div[contains(@class,'sb-py-medium')]//div[@class='sb-relative']`;
};

export const publishTheme = async (dashboard, themeName) => {
  await dashboard.click(
    `//div[@class='page-designs__theme']//div[normalize-space()='${themeName}']//ancestor::div[contains(@class,'sb-py-medium')]//button[contains(normalize-space(),'Publish')]`,
  );
  await dashboard.click(".sb-popup button:has-text('Publish')");
  await dashboard.waitForSelector(
    `//div[text()='Current template']//ancestor::div[@class='sb-column-layout']//div[normalize-space()='${themeName}']`,
  );
  await dashboard.waitForTimeout(5000);
  await dashboard.locator(".sb-toast__message--pr12").waitFor({ state: "detached" });
};

export const removeFirstTheme = async dashboard => {
  const themeName = await dashboard.innerText(".page-designs__theme .page-designs__current:nth-child(1)");
  await dashboard.click(xpathActionByShopThemeName(themeName));
  await dashboard.click(
    "(//*[@id='page-designs-dropdown' and not(contains(@style, 'display: none'))])//li[normalize-space()='Remove']",
  );
  await dashboard.click(".sb-popup button:has-text('Remove')");
  await expect(dashboard.getByText("Remove template successfully")).toBeVisible();
};

export const customizeTheme = async (dashboard, label: string) => {
  const xpathThemeByLabel = `//div[@class='page-designs__theme']//div[normalize-space()='${label}']//ancestor::div[contains(@class,'sb-py-medium')]//button[contains(normalize-space(),'Customize')]`;
  await dashboard.click(xpathThemeByLabel);
};
export const uploadImgPreview = async (dashboard, label: string, filePath: string) => {
  await dashboard.setInputFiles(
    `//div[contains(@class,'upload-description') and child::p[(normalize-space()='${label}')]]//preceding-sibling::div[@class='upload-image']//input`,
    filePath,
  );
  await dashboard.waitForSelector(
    `//div[contains(@class,'upload-description') and child::p[(normalize-space()='${label}')]]//preceding-sibling::div[@class='upload-image']`,
    { timeout: 10000 },
  );
  await dashboard.locator("div.sb-image__loading").waitFor();
  await dashboard.locator("div.sb-image__loading").waitFor({ state: "hidden" });
};

export const getXpathInputPreview = (label: string) => {
  return `//div[contains(@class,'upload-description') and child::p[(normalize-space()='${label}')]]//preceding-sibling::div[@class='upload-image']//input`;
};

export const getXpathUploadFileBtn = (label: string) => {
  return `//div[contains(@class,'upload-description') and child::p[(normalize-space()='${label}')]]//preceding-sibling::div[@class='upload-image']//button`;
};

export const inputSaveAsTemplate = async (dashboard, dataInput: dataSaveAsTemplate) => {
  await dashboard.fill("//input[@placeholder='Template name']", dataInput.template_name);
  if (dataInput.library) {
    await dashboard.fill("//input[@placeholder='Choose library']", dataInput.library);
    await dashboard.click(
      `(//div[ @role="tooltip" and not(contains(@style, 'display: none'))]//div[normalize-space()='${dataInput.library}'])[last()]`,
    );
  }

  if (dataInput.tags) {
    for (const tag of dataInput.tags) {
      const xpathSpan = `//input[@value='${tag}']//following-sibling::span[@class='sb-check']`;
      const xpathInput = `//input[@value='${tag}']`;
      const isCheck = await dashboard.locator(xpathInput).isChecked();
      if (!isCheck) {
        await dashboard.locator(xpathSpan).click();
      }
    }
  }

  if (dataInput.store_type) {
    for (const store of dataInput.store_type) {
      const xpathSpan = `//input[@value='${store}']//following-sibling::span[@class='sb-check']`;
      const xpathInput = `//input[@value='${store}']`;
      const isCheck = await dashboard.locator(xpathInput).isChecked();
      if (!isCheck) {
        await dashboard.locator(xpathSpan).click();
      }
    }
  }
  if (dataInput.preview_desktop) {
    await uploadImgPreview(dashboard, "Desktop", dataInput.preview_desktop);
  }
  if (dataInput.preview_mobile) {
    await uploadImgPreview(dashboard, "Mobile", dataInput.preview_mobile);
  }
  if (dataInput.preview_thumbnail) {
    await uploadImgPreview(dashboard, "Thumbnail Library", dataInput.preview_thumbnail);
  }
};
