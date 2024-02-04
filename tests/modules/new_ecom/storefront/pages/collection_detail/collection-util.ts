import { Page, BrowserContext, Locator } from "@playwright/test";
import { FrameLocator } from "@playwright/test";
import { expect } from "@fixtures/website_builder";
export const xpathBlockProductListOnWB = '[component="product_list"]';
export const xpathLabelPreview = "//div[contains(@class, 'w-builder__header__auto-complete__label')]//p";
export const xpathButtonFilterInDrawer = "(//button[contains(@class,'btn-filter')])[1]";
export const xpathTextProductNumber = "(//p[contains(@class,'collection-heading__sort-result')])[1]";
export const xpathClearAll = "(//span[contains(@class,'clear-all')])[1]";
export const xpathTagContainer = `(//div[contains(@class,'filter-result__container')])[1]`;
export const xpathButtonSave = ".w-builder__header-right .sb-button--primary >> text=Save";
export const xpathToast = ".sb-toast__message";
export const xpathFiltersResult = `(//div[contains(@class,'filter-result__container')])[1]`;
export const xpathTagFilter = `(${xpathFiltersResult}//div[contains(@class,'filter-result')])[1]`;
export const xpathFiltersContainer = "(//div[contains(@class,'filters__container')])[1]";
export const xpathButtonClearFilter =
  "//div[contains(@class,'actions__container')]//button[normalize-space()='Clear all']";
export const xpathButtonApplyFilter = "//div[contains(@class,'actions__container')]//button[normalize-space()='Apply']";
export const xpathCloseFilter = "//div[contains(@class,'title__container')]//*[name()='svg']";
export const xpathShowFilter =
  "(//div[contains(@class,'w-builder__widget') and descendant::label[normalize-space()='Show Filter']])[1]";
export const xpathShowFilterButton = `${xpathShowFilter}//div[contains(@class,'w-builder__widget--switch')]`;
export const xpathFiltersContainerTop = `(//div[contains(@class,'filters-container-top')])[1]`;
export const xpathSelectSorting = "(//div[contains(@class,'select-sort')])[1]//select";
export const xpathSortSelected = `${xpathSelectSorting}//option[@data-selected="true"]`;
export const xpathFirstProductInList = `(//div[contains(@class,'product-card__name')])[1]`;
export const xpathShowSorting =
  "(//div[contains(@class,'w-builder__widget') and descendant::label[normalize-space()='Show Sorting']])[1]";
export const xpathShowSortingButton = `${xpathShowSorting}//div[contains(@class,'w-builder__widget--switch')]`;
export const xpathFilterInDashboard = "//div[contains(@class,'navigation__collection-filter--name')]";
export const xpathInputVendor = `//input[@placeholder="Nikola's Electrical Supplies"]`;
export const xpathSearchProduct = "//input[@placeholder='Search products']";
export const xpathHideProduct = "//button[normalize-space()='Hide product']";
export const xpathShowProduct = "//button[normalize-space()='Show product']";
export const xpathSearchForCollection = "//input[@placeholder='Search for collections']";
export const xpathLayoutContainer = `(//div[contains(@class,'layout-grid--container')])[1]`;
export const xpathTextClearAll = `//span[normalize-space()='Clear all']`;
export const xpathPagination = `(//div[contains(@class,'pagination')])[1]`;
export const xpathRemoveBlock = `//div[contains(@class,'w-builder__settings-remove')]//button`;
export const xpathOptionCollection = `//span[contains(@class, 's-dropdown-item')]//span`;

export const selectCollectionPreview = async (dashboard: Page, frameLocator: FrameLocator, name: string) => {
  let collectionTitle: string;
  do {
    await dashboard.locator("div.w-builder__autocomplete").click();
    await dashboard.locator("//input[@placeholder='Search collections']").click();
    await dashboard.locator("//input[@placeholder='Search collections']").fill(name);
    await dashboard.locator("span.sb-autocomplete--loading-dots").first().waitFor({ state: "detached" });

    await dashboard.waitForSelector(`//div[normalize-space()='${name}'][2]`);
    await dashboard.locator(`//div[normalize-space()='${name}'][2]`).click();
    await frameLocator.locator("#v-progressbar").waitFor({ state: "visible" });
    await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
    await dashboard.waitForLoadState("networkidle");
    collectionTitle = await frameLocator.locator("//span[@value='collection.title']").innerText();
  } while (collectionTitle !== name);
};

export const clickSaveButton = async ({ dashboard }) => {
  const saveButton = await dashboard
    .locator("//button[normalize-space()='Save' and not(contains(@disabled,'disabled'))]")
    .count();
  if (saveButton > 0) {
    await dashboard.click(xpathButtonSave);
    await dashboard.waitForSelector(xpathToast, { state: "visible" });
    await dashboard.waitForSelector(xpathToast, { state: "hidden" });
  }
};
export const clickPreviewSF = async (dashboard: Page, context: BrowserContext, xpathPreview: string) => {
  const [previewTab] = await Promise.all([context.waitForEvent("page"), await dashboard.click(xpathPreview)]);
  await previewTab.waitForLoadState("domcontentloaded");
  await previewTab.locator("#v-progressbar").waitFor({ state: "detached" });
  return previewTab;
};

/**
 * Select Size card of product list block
 * @param page: Page
 * @param value: exp: Small or Large
 */
export const selectSizeCard = async (page: Page, value: string) => {
  let index = 1;
  if (value === "Large") {
    index = 2;
  }
  await page.locator(`(//div[@data-widget-id='size_card']//span)[${index}]`).click();
};

/**
 * Get style value of element by property name
 * @param locator: Locator
 * @param property: Property name exp: width|height|gap|...
 */
export const getStyle = async (locator: Locator, property: string): Promise<string> => {
  return locator.evaluate((el, property) => window.getComputedStyle(el).getPropertyValue(property), property);
};

/**
 * Get xpath filter of collection
 * @param filter: filter name
 * @param getDataFilterContainer: true if want to get xpath of data filter container
 */
export const getXpathFilter = (filter: string, positionFilter: string, getDataFilterContainer = false): string => {
  let xpathFilter = "";
  if (positionFilter === "top") {
    xpathFilter = `(//div[contains(@class,'filter__container') and descendant::span[normalize-space()='${filter}']])[1]`;
    return getDataFilterContainer ? `${xpathFilter}//div[contains(@class,'data__container')]` : xpathFilter;
  }

  xpathFilter = `(//div[contains(@class,'filter__container') and descendant::p[normalize-space()='${filter}']])[1]`;
  return getDataFilterContainer ? `${xpathFilter}//div[contains(@class,'filter__container--content')]` : xpathFilter;
};

/**
 * Verify styles include width, overflow, color checkbox, color label in dropdown filter
 * Used for case SB_SC_SCWB_187, SB_SC_SCWB_189
 */
export const verifyDropdownFilter = async ({ frameLocator, caseConf, suiteConf }, positionFilter: string) => {
  const xpathDataFilterColor = getXpathFilter("color", positionFilter, true);
  if (positionFilter === "top") {
    const overflow = await getStyle(frameLocator.locator(xpathDataFilterColor), "overflow");
    expect(overflow).toEqual("auto");
  }
  const width = await getStyle(frameLocator.locator(xpathDataFilterColor), "width");
  const colorLabelCheckbox = await getStyle(
    frameLocator.locator(`(${xpathDataFilterColor}//span[@class='filter-checkbox-label'])[1]`),
    "color",
  );
  const colorCheckbox = await getStyle(
    frameLocator.locator(`(${xpathDataFilterColor}//span[contains(@class,'s-check')])[1]`),
    "border-color",
  );
  expect(width).toEqual(caseConf.width_container_filter);
  expect(colorLabelCheckbox).toEqual(suiteConf.color_5.alpha_100);
  expect(colorCheckbox).toEqual(suiteConf.color_5.alpha_20);
};

/**
 * Verify styles include max width, background, border color, color label in tag filter
 * Used for case SB_SC_SCWB_187, SB_SC_SCWB_189, SB_SC_SCWB_191
 */
export const verifyTagFilter = async ({ frameLocator, caseConf, suiteConf }) => {
  const maxWidth = await getStyle(frameLocator.locator(xpathTagFilter), "max-width");
  const backgroundColor = await getStyle(frameLocator.locator(xpathTagFilter), "background-color");
  const borderColor = await getStyle(frameLocator.locator(xpathTagFilter), "border-color");
  const colorLabel = await getStyle(
    frameLocator.locator(`(${xpathTagFilter}//div[contains(@class,'filter-result__title')])[1]`),
    "color",
  );
  expect(maxWidth).toEqual(caseConf.max_width_tag);
  expect(backgroundColor).toEqual(suiteConf.color_5.alpha_4);
  expect(borderColor).toEqual(suiteConf.color_5.alpha_12);
  expect(colorLabel).toEqual(suiteConf.color_5.alpha_100);
};

/**
 * Verify styles include max width, position, right in filter tab type "in drawer"
 * Verify background and text color of apply and clear button
 * Used for case SB_SC_SCWB_191
 */
export const verifyTabFilterInDrawer = async ({ frameLocator, caseConf, suiteConf }) => {
  //Filter tab
  const width = await getStyle(frameLocator.locator(xpathFiltersContainer), "width");
  const position = await getStyle(frameLocator.locator(xpathFiltersContainer), "position");
  const right = await getStyle(frameLocator.locator(xpathFiltersContainer), "right");
  expect(width).toEqual(caseConf.width_tab_filters);
  expect(position).toEqual("fixed");
  expect(right).toEqual("0px");

  //Button Clear all
  const backgroundColorClear = await getStyle(frameLocator.locator(xpathButtonClearFilter), "background-color");
  const colorLabelClear = await getStyle(frameLocator.locator(xpathButtonClearFilter), "color");
  expect(backgroundColorClear).toEqual(suiteConf.color_1.alpha_100);
  expect(colorLabelClear).toEqual(suiteConf.color_5.alpha_100);

  //Button Apply
  const backgroundColorApply = await getStyle(frameLocator.locator(xpathButtonApplyFilter), "background-color");
  const colorLabelApply = await getStyle(frameLocator.locator(xpathButtonApplyFilter), "color");
  expect(backgroundColorApply).toEqual(suiteConf.color_5.alpha_100);
  expect(colorLabelApply).toEqual(suiteConf.color_1.alpha_100);
};

/**
 * Get xpath product on product list screen in dashboard
 * @param name: product name
 */
export const getXpathProductInList = (name: string): string => {
  return `(//a[descendant::div[contains(@class,'product-name') and normalize-space()='${name}']])[1]`;
};

/**
 * verify filters container is visible and check a filter to be hidden
 * @param ignoreFilter: filter name to be hidden
 */
export const checkFilterContainerVisible = async ({ webBuilder, frameLocator, caseConf }, ignoreFilter = "") => {
  for (const position of caseConf.position_filters) {
    await webBuilder.selectDropDown("filter_position", position);
    // Wait do sau khi chọn value có chút delay rồi mới apply thành công
    await webBuilder.page.waitForTimeout(1000);
    if (position === "Left") {
      await expect(frameLocator.locator(xpathFiltersContainer)).toBeVisible();
    } else {
      await expect(frameLocator.locator(xpathFiltersContainerTop)).toBeVisible();
    }
    if (ignoreFilter) {
      const xpathFilter = getXpathFilter(ignoreFilter, position);
      await expect.soft(frameLocator.locator(xpathFilter)).toBeHidden();
    }
  }
};

/**
 * select block in web builder
 */
export const selectBlockWb = async ({ webBuilder, frameLocator }, section: number, block: number) => {
  const blockSelector = webBuilder.getSelectorByIndex({ section, block });
  await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
  await frameLocator.locator(blockSelector).click();
};

/**
 * select product in product list in dashboard
 */
export const selectProductInList = async (dashboard: Page, product: string) => {
  await dashboard.locator(xpathSearchProduct).click();
  await dashboard.locator(xpathSearchProduct).fill(product);
  await dashboard.keyboard.press("Enter");
  const xpathProduct = getXpathProductInList(product);
  await dashboard.locator(xpathProduct).waitFor();
  await dashboard.locator(xpathProduct).click();
  await dashboard.waitForLoadState("networkidle");
};

/**
 * Get xpath product on product list screen in dashboard
 * @param dashboard: Page
 * @param frameLocator: FrameLocator
 * @param blockId: id of block
 */
export const deleteBlockById = async (dashboard: Page, frameLocator: FrameLocator, blockId: string) => {
  const blockSelector = `//div[contains(@class,'wb-dnd-draggable-wrapper') and descendant::section[@data-block-id='${blockId}']]`;
  await frameLocator.locator(blockSelector).waitFor({ state: "visible" });
  await frameLocator.locator(blockSelector).click();
  await dashboard.locator(xpathRemoveBlock).click();
  await clickSaveButton({ dashboard });
};

/**
 * Add filter color in dashboard
 * @param dashboard: Page
 * @param domain: string
 */
export const addFilterColor = async (dashboard: Page, domain: string) => {
  await dashboard.goto(`https://${domain}/admin/menus`);
  await dashboard.waitForLoadState("networkidle");
  await dashboard.getByRole("button", { name: "Add filter" }).click();
  await dashboard.locator("label").filter({ hasText: "Color" }).locator("span").first().click();
  await dashboard.getByRole("button", { name: "Save" }).click();
  await expect(dashboard.locator("div.s-toast")).toContainText("Successfully saved filter");
};

/**
 * Add vendor to product in dashboard
 * @param dashboard: Page
 * @param vendor: string
 */
export const addVendorToProduct = async (dashboard: Page, vendor: string) => {
  await dashboard.locator(xpathInputVendor).click();
  await dashboard.locator(xpathInputVendor).fill(vendor);
  await dashboard.getByRole("button", { name: "Save changes" }).click();
  await expect(dashboard.locator("div.s-toast")).toContainText("Product was successfully saved!");
};

/**
 * Add vendor to product in dashboard
 * @param dashboard: Page
 * @param collection: string
 */
export const addProductToCollection = async (dashboard: Page, collection: string) => {
  await dashboard.locator(xpathSearchForCollection).click();
  await dashboard.locator(xpathSearchForCollection).fill(collection);
  await dashboard.locator(`${xpathOptionCollection}[contains(text(), '${collection}')]`).first().click();
  await dashboard.getByRole("button", { name: "Save changes" }).click();
  await expect(dashboard.locator("div.s-toast")).toContainText("Product was successfully saved!");
};

/**
 * Turn on /off Toglle with label in Tab content
 * @param dasboard :Page
 * @param label: string
 * @param status : boolean
 */
export const turnONOFToggleByLabel = async (dasboard: Page, label: string, status: boolean) => {
  const xpathInputByLabel = `//div[@label ='${label}']//input`;
  const xpathSpanByLabel = `//div[@label ='${label}']//span[contains(@class, 'is-default')]`;
  await dasboard.locator(xpathInputByLabel).isVisible({ timeout: 10000 });
  const isCheck = await dasboard.locator(xpathInputByLabel).isChecked();
  if (status == !isCheck) {
    await dasboard.locator(xpathSpanByLabel).click();
  }
};
