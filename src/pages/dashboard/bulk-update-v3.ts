import { APIRequestContext, BrowserContext, Locator, Page, expect } from "@playwright/test";
import { ProductPage } from "./products";
import { ActionsName, AllActionItems } from "tests/modules/shopbase/product/bulk_update/bulk_update";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";

export class BulkUpdate extends ProductPage {
  request: APIRequestContext;
  context: BrowserContext;
  bulkUpdateHeader = this.genLoc("#page-header");
  bulkUpdateBody = this.genLoc(".sb-table__body-wrapper");
  emptyUpdates = this.bulkUpdateBody.locator(".sb-table__empty-block");
  bulkUpdateItems = this.bulkUpdateBody.getByRole("row");
  iconDone = this.page.getByRole("img").locator("[id*='Check-mark']");
  iconProcessing = this.genLoc(".sb-spinner");
  filterProductForm = this.genLoc(".bulk-form__condition").filter({ has: this.page.getByText("Filter products") });
  actionForm = this.genLoc(".bulk-form__condition").filter({ has: this.page.getByText("Action") });
  tooltipIcon = this.genLoc(".sb-text-heading").getByRole("img");
  productsMustMatch = this.filterProductForm.locator(".bulk-form__filter-product");
  variantsMustMatch = this.filterProductForm.locator(".bulk-form__filter-variant");
  variantCheckbox = this.variantsMustMatch.locator("label").filter({ has: this.page.getByRole("checkbox") });
  1;
  allConditions = this.genLoc(".choose-condition label").filter({
    has: this.page.getByRole("radio", { name: "All conditions" }),
  });
  anyCondition = this.genLoc(".choose-condition label").filter({
    has: this.page.getByRole("radio", { name: "Any condition" }),
  });
  filterRows = this.genLoc(".row").filter({ has: this.genLoc("[class=col-xs-11]") });
  filterType = this.genLoc("[class=sb-relative]").first().getByRole("button");
  filterCondition = this.genLoc("[class=sb-relative]").nth(1).getByRole("button");
  addActionPopup = this.genLoc(".modal-add-new-action .sb-popup__container");
  closePopupBtn = this.addActionPopup.getByRole("button").and(this.genLoc(".sb-popup__header-close"));
  dropdownSelectAction = this.addActionPopup.locator(".sb-popup__body").getByRole("button");
  addActionForm = this.genLoc(".bulk-form__add-action").filter({
    has: this.genLoc(".bulk-form__select-action").or(this.genLoc(".bulk-form__no-result")),
  });
  searchBarAction = this.addActionForm.getByRole("textbox");
  actionItems = this.genLoc(".sb-block-item__content").locator(".bulk-form__action-item");
  duplicateBtn = this.page.getByRole("img").filter({ has: this.genLoc("[id='Icons/Copy']") });
  removeBtn = this.page.getByRole("img").filter({ has: this.genLoc("[id='Icons/Trash']") });
  formNoResult = this.addActionForm.locator(".bulk-form__no-result");
  actionFormItem = this.genLoc(".sb-form-item");
  autocompleteItems = this.page.getByRole("tooltip").locator(".sb-selection-item");
  autocompleteAddNew = this.page.getByRole("tooltip").locator(".sb-autocomplete__addable-row");
  dropdownItems = this.page.getByRole("tooltip").getByRole("listitem");
  previewBulkUpdatePopup = this.genLoc(".modal-apply-bulk-update .sb-popup__container");
  filterPreview = this.previewBulkUpdatePopup.locator(".preview-filter");
  productMatchPreview = this.filterPreview.getByText(/Products that match/);
  filterProductPreview = this.productMatchPreview.locator("+ul").getByRole("listitem");
  variantMatchPreview = this.filterPreview.getByText(/Only variants that match/);
  filterVariantPreview = this.variantMatchPreview.locator("+ul").getByRole("listitem");
  actionPreview = this.previewBulkUpdatePopup.locator(".preview-action");
  actionItemsPreview = this.actionPreview.getByRole("listitem");
  sampleMatchingProducts = this.previewBulkUpdatePopup
    .locator(".preview-product .sb-table__body-wrapper")
    .getByRole("row");
  productColumnPreview = this.page.getByRole("cell").first();
  typeColumnPreview = this.page.getByRole("cell").nth(1);
  vendorColumnPreview = this.page.getByRole("cell").last();
  imgUploaded = this.genLoc("[class='sb-upload__dropzone'] img").filter({ hasNot: this.genLoc("g[id*=Plus]") });
  loadingState = this.bulkUpdateBody.locator(".sb-skeleton--table");
  backBtn = this.genLoc("#page-header")
    .getByRole("button")
    .filter({ has: this.genLoc("[id*=Back]") });

  constructor(page: Page, domain: string, request?: APIRequestContext, context?: BrowserContext) {
    super(page, domain);
    this.request = request;
    this.context = context;
  }
  /**
   * Get locator column theo page và tên column
   * @param page
   * @param column
   * @returns
   */
  getColumn(column: string): Locator {
    let index: number;
    switch (column) {
      case "Id":
      case "Product":
        index = 0;
        break;
      case "Filter":
      case "Type":
        index = 1;
        break;
      case "Update for":
      case "Vendor":
        index = 2;
        break;
      case "Action":
        index = 3;
        break;
      case "Number of updated products":
        index = 4;
        break;
      case "Updated at":
        index = 5;
        break;
      case "Status":
        index = 6;
        break;
    }
    return this.page.getByRole("cell").nth(index);
  }

  /**
   * Get locator của các field common trong action item Bulk update
   * @param type
   * @param header
   * @returns
   */
  getActionItemForm(
    type: "textbox" | "dropdown" | "toggle" | "autocomplete" | "upload" | "currency",
    header?: string,
  ): Locator {
    let loc: Locator;
    switch (type) {
      case "textbox":
      case "autocomplete":
        loc = header
          ? this.actionFormItem.filter({ has: this.page.getByText(header, { exact: true }) }).getByRole("textbox")
          : this.actionFormItem.getByRole("textbox");
        break;
      case "dropdown":
        loc = header
          ? this.actionFormItem.filter({ has: this.page.getByText(header) }).getByRole("button")
          : this.actionFormItem.getByRole("button");
        break;
      case "toggle":
        loc = this.actionFormItem.locator("label").filter({ has: this.page.getByRole("checkbox") });
        break;
      case "upload":
        loc = this.actionFormItem.locator("input[class=sb-upload__input]");
        break;
      case "currency":
        loc = header
          ? this.actionFormItem.filter({ has: this.page.getByText(header) }).getByRole("spinbutton")
          : this.actionFormItem.getByRole("spinbutton");
        break;
    }
    return loc;
  }

  /**
   * Get locator các action trong form
   * @param option
   * @returns
   */
  getActionOption(option: string): Locator {
    return this.addActionForm.getByRole("listitem").filter({ has: this.page.getByText(option, { exact: true }) });
  }

  /**
   * Get action header locator
   * @param action
   * @returns
   */
  getActionHeader(action: string): Locator {
    return this.genLoc("[class=col-xs-12]").filter({ has: this.page.getByText(action, { exact: true }) });
  }

  /**
   * Hàm xoá filter condition product hoặc variant theo số thứ tự
   * @param type: kiểu filter product
   * @param index: số thứ tự row filter product
   */
  async removeCondition({ type, index = 1 }: { type: "product" | "variant"; index: number }): Promise<void> {
    const filterRows =
      type === "product"
        ? this.productsMustMatch.locator(this.filterRows)
        : this.variantsMustMatch.locator(this.filterRows);
    await filterRows
      .nth(index - 1)
      .locator(this.removeBtn)
      .click();
  }

  /**
   * Remove an action in create an update screen
   * @param param0
   */
  async removeAction({ name, index = 1 }: { name: string; index?: number }): Promise<void> {
    await this.actionItems
      .filter({ has: this.getActionHeader(name) })
      .locator(this.removeBtn)
      .nth(index - 1)
      .click();
  }

  /**
   * Duplicate an action in create an update screen
   * @param param0
   */
  async duplicateAction({ name, index = 1 }: { name: string; index?: number }): Promise<void> {
    await this.actionItems
      .filter({ has: this.getActionHeader(name) })
      .locator(this.duplicateBtn)
      .nth(index - 1)
      .click();
  }

  /**
   * Add action Bulk update
   * @param action
   */
  async addNewAction(action: string): Promise<void> {
    if (await this.addActionPopup.isHidden()) {
      await this.actionForm.getByRole("button", { name: "Add action" }).click();
      await this.addActionPopup.waitFor();
    }
    if (await this.addActionForm.isHidden()) {
      await this.dropdownSelectAction.click();
    }
    await this.searchBarAction.clear();
    await this.getActionOption(action).click();
    await this.addActionPopup.getByRole("button", { name: "Add", exact: true }).click();
  }

  /**
   * Input keyword and get search results in add action popup
   * @param keyword
   */
  async searchAction(keyword: string): Promise<Locator[]> {
    await this.searchBarAction.clear();
    await this.searchBarAction.fill(keyword);
    const results = (await this.formNoResult.isVisible()) ? [this.formNoResult] : await this.actionItems.all();
    return results;
  }

  /**
   * Hàm set filter product/variant bulk update
   * @param param0
   */
  async setFilter(
    type: "product" | "variant",
    {
      row = 1,
      has,
      condition,
      value,
      add = false,
    }: {
      row: number;
      has: string;
      condition: string;
      value: string;
      add?: boolean;
    },
  ): Promise<void> {
    const section = type === "product" ? this.productsMustMatch : this.variantsMustMatch;
    const filterPosition = add
      ? section.locator(this.filterRows).nth(row - 1)
      : section.locator(this.filterRows).last();
    const filterTypeDropdown = filterPosition.locator(this.filterType);
    const filterConditionDropdown = filterPosition.locator(this.filterCondition);
    const inputValue = filterPosition.getByRole("textbox");
    const filterOptions = this.page.getByRole("tooltip").getByRole("listitem");
    if (type === "variant") {
      await this.variantCheckbox.setChecked(true);
    }
    if (add) {
      await section.getByRole("button", { name: "Add condition" }).click();
    }
    await filterTypeDropdown.click();
    await filterOptions.filter({ hasText: has }).click();
    await filterConditionDropdown.click();
    await filterOptions.filter({ hasText: condition }).click();
    await inputValue.fill(value);
  }

  /**
   * Hàm chọn match option cho filter
   * @param type
   * @param condition
   */
  async chooseMatchCondition(
    type: "product" | "variant",
    condition: "All conditions" | "Any condition",
  ): Promise<void> {
    const section = type === "product" ? this.productsMustMatch : this.variantsMustMatch;
    const matchOption =
      condition === "All conditions" ? section.locator(this.allConditions) : section.locator(this.anyCondition);
    await matchOption.setChecked(true);
  }

  /**
   * Hàm fill value action theo data
   * @param name
   * @param data
   */
  async completeActionData(name: ActionsName, data: AllActionItems): Promise<string[] | ""> {
    const index = typeof data.option_index !== "undefined" ? data.option_index - 1 : 0;
    const action = typeof data.action_index !== "undefined" ? data.action_index - 1 : 0;
    const actionItem = this.actionItems.filter({ has: this.getActionHeader(name) }).nth(action);
    const imgSrc = [];

    switch (name) {
      case "Find and replace text in description":
      case "Delete variant's option value":
        await actionItem.locator(this.getActionItemForm("textbox")).first().fill(data[name].option);
        await actionItem.locator(this.getActionItemForm("textbox")).last().fill(data[name].value);
        break;
      case "Add images to product media":
      case "Replace all product images by the uploaded ones":
        await actionItem.locator(this.getActionItemForm("upload")).setInputFiles(data[name]);
        await expect(this.imgUploaded).toHaveCount(data[name].length);
        await actionItem.locator(".sb-upload__dropzone-plus-button").waitFor();
        for (const img of await this.imgUploaded.all()) {
          const src = await img.getAttribute("src");
          imgSrc.push(src);
        }
        break;
      case "Replace tag": {
        await actionItem.locator(this.getActionItemForm("autocomplete", "Replace")).click();
        await actionItem.locator(this.getActionItemForm("autocomplete", "Replace")).fill(data[name].option);
        const selectOption = data.add
          ? this.autocompleteAddNew.filter({ has: this.page.getByText(data[name].option, { exact: true }) }).nth(index)
          : this.autocompleteItems.filter({ has: this.page.getByText(data[name].option, { exact: true }) }).nth(index);
        await selectOption.click();
        await actionItem.locator(this.getActionItemForm("textbox", "With")).fill(data[name].value);
        break;
      }
      case "Remove product type":
      case "Allow customer to purchase when product's out of stock":
        await actionItem.locator(this.getActionItemForm("toggle")).setChecked(data[name]);
        break;
      case "Change product type":
      case "Change product page design":
        {
          await actionItem.locator(this.getActionItemForm("autocomplete")).click();
          await scrollUntilElementIsVisible({
            page: this.page,
            viewEle: this.autocompleteItems
              .filter({ has: this.page.getByText(data[name], { exact: true }) })
              .nth(index),
            scrollEle: this.page.getByRole("tooltip"),
          });
          await actionItem.locator(this.getActionItemForm("autocomplete")).fill(data[name]);
          if (data.add) {
            await this.autocompleteAddNew
              .filter({ has: this.page.getByText(data[name], { exact: true }) })
              .nth(index)
              .click();
          }
          await this.autocompleteItems
            .filter({ has: this.page.getByText(data[name], { exact: true }) })
            .nth(index)
            .click();
        }
        break;
      case "Delete custom options":
        await actionItem.locator(this.getActionItemForm("dropdown", "existing options")).click();
        await this.dropdownItems.filter({ hasText: data[name].option }).click();
        await actionItem.locator(this.getActionItemForm("textbox", "Value")).fill(data[name].value);
        break;
      case "Increase price":
      case "Decrease price":
        await actionItem.locator(this.getActionItemForm("dropdown")).click();
        await this.dropdownItems.filter({ hasText: data[name].option }).click();
        await actionItem.locator(this.getActionItemForm("currency")).fill(data[name].value);
        break;
      case "Delete variant tag":
      case "Add variant tag":
      case "Replace variant tag":
      case "Add Pixel Id":
      case "Add Access token":
      case "Change product vendor":
        await actionItem.locator(this.getActionItemForm("textbox")).fill(data[name]);
        break;
      case "Change Inventory policy":
        await actionItem.locator(this.getActionItemForm("dropdown")).click();
        await this.dropdownItems.filter({ hasText: data[name] }).click();
        break;
      default:
        await actionItem.locator(this.getActionItemForm("textbox", "Option name")).fill(data[name].name);
        await actionItem.locator(this.getActionItemForm("textbox", "From value")).fill(data[name].from);
        await actionItem.locator(this.getActionItemForm("textbox", "To value")).fill(data[name].to);
        break;
    }
    return imgSrc;
  }

  /**
   * Get tên và link product detail tương ứng ở màn preview bulk update
   * @returns
   */
  async getSampleProductsLink(): Promise<{ name: string; link: string; description: string }[]> {
    const productsLink = [];
    for (const product of await this.sampleMatchingProducts.all()) {
      const name = await product.locator(this.productColumnPreview).innerText();
      const link = await product.getByRole("link").getAttribute("href");
      const newPage = await this.context.newPage();
      const productDetail = new ProductPage(newPage, this.domain);
      await newPage.goto(`https://${this.domain}${link}`);
      const description = await productDetail.descriptionBody.innerText();
      productsLink.push({ name: name, link: link.substring(1), description: description });
      await newPage.close();
    }
    return productsLink;
  }
}
