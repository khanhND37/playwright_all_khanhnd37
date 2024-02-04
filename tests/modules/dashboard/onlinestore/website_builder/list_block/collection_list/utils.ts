import { expect, Locator, Page } from "@playwright/test";
import { XpathBlock } from "@constants/web_builder";
import { waitForImageLoaded } from "@utils/theme";
import { waitTimeout } from "@utils/api";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { BlockAlign, ButtonStyle, CollectionData, CollectionListStyle, LayoutData } from "./collection_list";
import { Color, WidthHeight } from "@types";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { SnapshotFixture } from "@core/fixtures/snapshot-fixture";

export const selector = {
  buttonLayout:
    "[data-widget-id=layout] button.sb-button--select,[data-widget-id=layout_mobile] button.sb-button--select",
  buttonSaveChange: ".w-builder__header-right span:has-text('Save')",
  toastSuccess: "text=i All changes are saved >> div",
  layoutOptions: ".w-builder__widget--layout div[class*=list-icon] span div[class*=item-icon]",
  btnSelectCollection: "//a[contains(@class, 'item-list__add-btn')]",
  popoverAddCollection: "[id=popover-add-collection]",
  chipColor: "//span[contains(@class, 'chip--color')]",
  colorNone: "//span[contains(@class, 'chip--none')]",
  buttonPreview: ":nth-match(.w-builder__header-right > span, 3) button",
  buttonLabelInput: "[data-widget-id=button_content_label] input",
  popoverEditCollection: "//div[@id='popover-edit-collection' and not(contains(@style, 'display: none'))]",
  xpathIconCollection: "//div[contains(@class,'sb-mb-medium')]//span[contains(@class,'sb-icon__default')]",
  xpathEditCollection: "//div[contains(@class,'item-list__action')]//div[@class='sb-flex sb-popover__reference']",
  xpathLayer: "//div[contains(@class, 'w-builder__header-left')]//button[@name='Layer']",
  xpathDeleteSection: "button span:text-is('Delete section')",
  xpathListCollection: "//div[contains(@class,'layout')]//div[contains(@class,'list-icon')]",
  collectionItem: title => `//div[contains(@class,'item-list')]//p[text()[contains(.,'${title}')]]`,
  buttonStyle: style => `//*[@id='widget-popover']//li[contains(.//label, '${style}')]`,
  popoverVisible: id => `//*[@id='${id}' and not(contains(@style, 'display: none'))]`,
  collectionTitle: id => `[block-id='${id}'] *[class*=content-text--head]`,
  contentWrap: id => `[block-id='${id}'] div[class*=content-wrap]`,
  xpathCollectionList: "//section[@component='collection_list']",
  xpathCollectionTitle: "//*[@value='collection.title']",
  collectionItemAction: (index, action) => {
    const actionIndex = {
      edit: 1,
      remove: 2,
      dnd: 3,
    };
    const itemXpath = `//div[contains(@class, 'item-list')] //div[contains(@class, 'sb-mb-medium') and .//div[contains(@class, 'item-list__image')]]`;
    const collectionItemByIndex = `(${itemXpath})[${index}]`;
    return `(${collectionItemByIndex} //div[contains(@class, 'item-list__action')])[${actionIndex[action]}]`;
  },
};

/**
 * wait iframe loaded after open wb, change page
 * @param dashboard
 */
export const waitIframeLoaded = async (dashboard: Page) => {
  const frameElement = await dashboard.locator("#preview").elementHandle();
  const frame = await frameElement.contentFrame();
  await frame.locator(XpathBlock.progressBar).waitFor({ state: "detached" });
};

/**
 * verify block with layout after resizing
 * @param webBuilder
 * @param snapshot
 * @param wbBlockSelector
 * @param layout
 * @param width
 * @constructor
 */
export const verifyBlockWithLayoutAfterResizing = async (
  webBuilder: WebBuilder,
  snapshot: SnapshotFixture,
  wbBlockSelector,
  layout: string,
  width: number,
) => {
  const widthHeight = {
    value: width,
    unit: "Px",
  };
  const block = new Blocks(webBuilder.page);
  await webBuilder.settingWidthHeight("width", widthHeight as WidthHeight, true);
  await expect(block.frameLocator.locator(wbBlockSelector)).toHaveCSS("width", `${width}px`);
  await block.clickBackLayer();
  await webBuilder.page.waitForTimeout(1000);
  await snapshot.verifyWithAutoRetry({
    page: webBuilder.page,
    iframe: webBuilder.iframe,
    snapshotName: `${process.env.ENV}-${layout}-${width}.png`,
    selector: wbBlockSelector,
  });
};

const pageTitle = {
  collection: "Collection detail",
  collections: "All collections",
};

/**
 * change page in wb
 * @param dashboard
 * @param page
 */
export const changePage = async (dashboard: Page, page: string) => {
  await dashboard.locator("(//button[@name='Pages'])").first().click();
  await dashboard
    .locator(`(//div[contains(@class,'w-builder__page-groups--item') and contains(.//div, '${pageTitle[page]}')])`)
    .first()
    .click();
  await waitIframeLoaded(dashboard);
};

/**
 * save change
 * @param dashboard
 */
export const saveChange = async (dashboard: Page) => {
  await dashboard.locator(selector.buttonSaveChange).first().click();
  await expect(dashboard.locator(selector.toastSuccess)).toBeVisible();
  await expect(dashboard.locator(selector.toastSuccess)).toBeHidden();
};

/**
 * add collection to block collection list with title
 * @param dashboard
 * @param collections
 */
export const addCollectionToBlock = async (dashboard: Page, collections: string[]) => {
  await dashboard.locator(selector.btnSelectCollection).click();
  await dashboard.locator(selector.popoverAddCollection).waitFor({ state: "visible" });
  const xpathInputCollection = `${selector.popoverAddCollection} input[class*='sb-input__input']`;
  for (const col of collections) {
    await dashboard.locator(xpathInputCollection).click();
    await dashboard.locator(xpathInputCollection).fill(col);
    const collectionItemSelector = `//div[contains(@class, 'sb-selection-item') and contains(.//div, '${col}')]`;
    await dashboard.locator(collectionItemSelector).first().waitFor({ state: "visible" });
    await dashboard.locator(collectionItemSelector).first().click();
  }
  await saveChange(dashboard);
};

/**
 * verify block on sf with screenshot
 * @param sfPage
 * @param snapshot
 * @param blockSelector
 * @param fileName
 */
export const previewBlockOnSf = async (sfPage: Page, snapshot: SnapshotFixture, blockSelector, fileName: string) => {
  await sfPage.locator(XpathBlock.progressBar).waitFor({ state: "detached" });
  await sfPage.locator(blockSelector).waitFor({ state: "visible" });
  await waitForImageLoaded(sfPage, blockSelector);
  await waitTimeout(5000); // wait for fade in animation
  await snapshot.verifyWithAutoRetry({
    page: sfPage,
    snapshotName: `${process.env.ENV}-${fileName}`,
    selector: blockSelector,
  });
};

/**
 * change design of block collection list (content + common)
 * @param webBuilder
 * @param data
 * @param isAllCollections
 */
export const changeDesign = async (webBuilder: WebBuilder, data: CollectionListStyle, isAllCollections = false) => {
  if (data.layout) {
    await changeLayout(webBuilder, data.layout.value, isAllCollections);
  }

  if (data.items_radius) {
    await webBuilder.editSliderBar(data.items_radius.id, data.items_radius.config);
  }

  if (data.content_size) {
    await webBuilder.size(data.content_size.id, data.content_size.size);
  }

  if (data.block_align) {
    await changeAlign(webBuilder, data.block_align);
  }

  if (data.content_color) {
    const { id, color } = data.content_color;
    await changeColor(webBuilder, color, id);
  }

  if (data.button_style) {
    await changeButtonStyle(webBuilder, data.button_style);
  }

  if (data.content_background) {
    const { id, value } = data.content_background;
    await changeColor(webBuilder, value.color, id);
  }

  await webBuilder.changeDesign(data);
  await webBuilder.titleBar.click({ delay: 200 });
};

/**
 * change setting layout of block collection list
 * @param webBuilder
 * @param layoutSetting
 */
export const settingLayout = async (webBuilder: WebBuilder, layoutSetting: LayoutData) => {
  if (layoutSetting.item_per_row) {
    await webBuilder.page.fill(
      "//label[normalize-space()='Item per row']//parent::div//following-sibling::div//input[contains(@class,'inner-append')]",
      layoutSetting.item_per_row,
    );
    await webBuilder.page.waitForTimeout(1000); //issue setting delay 0,5->1s
    await webBuilder.page.click("//label[normalize-space()='Item per row']");
  }
  if (layoutSetting.spacing) {
    await webBuilder.page.fill(
      "//label[normalize-space()='Spacing']//parent::div//following-sibling::div//input[contains(@class,'inner-append')]",
      layoutSetting.spacing,
    );
    await webBuilder.page.waitForTimeout(1000); //issue setting delay 0,5->1s
    await webBuilder.page.click("//label[normalize-space()='Spacing']");
  }
  if (layoutSetting.image_hight) {
    await webBuilder.page.click(
      `//label[normalize-space()='Image height']//parent::div//following-sibling::div//label[text()='${layoutSetting.image_hight}']`,
    );
  }
  if (layoutSetting.overlay) {
    await webBuilder.page.locator(`//label[normalize-space()='Overlay']//parent::div//following-sibling::div`).click();
    const popoverColor = selector.popoverVisible("widget-popover");
    await webBuilder.page.locator(`(${popoverColor})[2]`).waitFor({ state: "visible" });
    const chipLocator = webBuilder.page.locator(
      `(${popoverColor}${selector.chipColor})[${layoutSetting.overlay.preset}]`,
    );
    await chipLocator.click();
    await expect(chipLocator).toHaveClass(/active/);
    await webBuilder.page.locator(`//label[normalize-space()='Overlay']//parent::div//following-sibling::div`).click();
  }
};

/**
 * get position index by vertical / horizontal position
 * @param verticalPos
 * @param horizontalPos
 */
export const getPosition = (verticalPos, horizontalPos: string) => {
  const verticalIdx = { top: 1, middle: 2, bottom: 3 };
  const horizontalIdx = { left: 1, center: 2, right: 3 };
  return (verticalIdx[verticalPos] - 1) * 3 + horizontalIdx[horizontalPos];
};

/**
 * change color (content color, bg color, content bg color)
 * @param webBuilder
 * @param data
 * @param id
 */
export const changeColor = async (webBuilder: WebBuilder, data: Color | "none", id: string) => {
  await webBuilder.page.locator(`[data-widget-id=${id}] div[class*='sb-popover__reference']`).click();
  const popoverColor = selector.popoverVisible("widget-popover");
  await webBuilder.page.locator(popoverColor).waitFor({ state: "visible" });
  const chipColorSelector =
    data === "none"
      ? `(${popoverColor}${selector.colorNone})`
      : `(${popoverColor}${selector.chipColor})[${data.preset}]`;
  const chipLocator = webBuilder.page.locator(chipColorSelector);
  await chipLocator.click();
  await expect(chipLocator).toHaveClass(/active/);
  await webBuilder.page.locator(`[data-widget-id=${id}] div[class*='sb-popover__reference']`).click();
};

/**
 * change layout (mix, grid, slide, content outline) of block 'collection list'
 * @param webBuilder
 * @param layout
 * @param isAllCollection
 */
export const changeLayout = async (webBuilder: WebBuilder, layout: string, isAllCollection = false) => {
  const commonLayoutIndex = { grid: 0, slide: 1, mix: 2, brick: 3, content_outside: 4, image_text: 5 };
  const layoutIndex: { [key: string]: number } = isAllCollection ? { ...commonLayoutIndex } : { ...commonLayoutIndex };
  await webBuilder.page.locator(selector.buttonLayout).last().click();
  const optionsLocator = webBuilder.page.locator(selector.layoutOptions);
  await optionsLocator.first().waitFor({ state: "visible" });

  const index = layoutIndex[layout];
  await optionsLocator.nth(index).click();
  await webBuilder.page.locator(selector.buttonLayout).last().click();
};

/**
 * change button style (primary | secondary)
 * @param webBuilder
 * @param buttonStyle
 */
export const changeButtonStyle = async (webBuilder: WebBuilder, buttonStyle: ButtonStyle) => {
  const buttonSelector = `[data-widget-id='${buttonStyle.id}'] button`;
  await webBuilder.page.locator(buttonSelector).click();
  const xpathButtonStyle = selector.buttonStyle(buttonStyle.value);
  await webBuilder.page.locator(xpathButtonStyle).waitFor({ state: "visible" });
  await webBuilder.page.locator(xpathButtonStyle).click();
};

/**
 * change align
 * @param webBuilder
 * @param data
 */
export const changeAlign = async (webBuilder: WebBuilder, data: BlockAlign) => {
  const alignIndex: { [key: string]: number } = {
    left: 1,
    center: 2,
    right: 3,
  };
  await webBuilder.page.locator(`(//*[@data-widget-id='${data.id}']//button)[${alignIndex[data.value]}]`).click();
};

/**
 * edit content of collection in block
 * @param dashboard
 * @param data
 */
export const editCollectionItem = async (dashboard: Page, data: CollectionData) => {
  const popover = selector.popoverEditCollection;
  const fieldIndex = {
    sub_heading: 1,
    heading: 2,
    description: 3,
  };
  for (const [key, value] of Object.entries(data)) {
    if (!value) {
      continue;
    }
    const inputSelector = `(${popover} //input)[${fieldIndex[key]}]`;
    await dashboard.locator(inputSelector).fill(value);
    await dashboard.locator(inputSelector).press("Enter");
  }
};

/**
 * Drag and drop element step by step
 * Note: Must move from bottom to top
 * @param dashboard
 * @param selectorFrom
 * @param selectorTo
 * @param pixel
 */
// eslint-disable-next-line max-len
export const dragAndDropCollection = async (
  dashboard: Page,
  selectorFrom: string | Locator,
  selectorTo: string | Locator,
  pixel = 10,
) => {
  const coordinatesTo = { x: 0, y: 0 };
  const from = typeof selectorFrom === "string" ? dashboard.locator(selectorFrom) : selectorFrom;
  const to = typeof selectorTo === "string" ? dashboard.locator(selectorTo) : selectorTo;
  await from.hover();
  await dashboard.mouse.down();
  const fromBox = await from.boundingBox();
  const toBox = await to.boundingBox();
  coordinatesTo.x = toBox.x + toBox.width / 2;
  coordinatesTo.y = toBox.y - toBox.height / 2;

  let y = fromBox.y;
  if (fromBox.y < toBox.y) {
    while (y < coordinatesTo.y) {
      await dashboard.mouse.move(coordinatesTo.x, y, { steps: 2 });
      y += pixel;
    }
  } else {
    coordinatesTo.y = toBox.y;
    while (y > coordinatesTo.y) {
      await dashboard.mouse.move(coordinatesTo.x, y, { steps: 2 });
      y -= pixel;
    }
  }
  await dashboard.mouse.move(coordinatesTo.x, coordinatesTo.y, { steps: 2 });
  await dashboard.waitForTimeout(1000);
  await dashboard.mouse.up();
};
