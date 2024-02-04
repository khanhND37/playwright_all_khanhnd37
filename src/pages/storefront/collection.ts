import { APIRequestContext, expect, Locator, Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import { SFProduct } from "@sf_pages/product";
import { waitForProgressBarDetached } from "@utils/storefront";
import type { CollectionValue, FilterSF, Products, SelectFiltersData } from "@types";

export class SFCollection extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  xpathProductList = "//div[contains(@id,'collection')]";
  xpathProductExampleInCollection = '//div[@data-id="collection_page"]//a[@target="_blank"]';
  xpathFirstProductInCollection =
    "(//div[contains(@class,'collection-detail')]//div[contains(@class,'product-details')])[1] | (//div[contains(@class,'collection-product')])[1]";
  xpathCollectionDetail = "//div[contains(@class,'container collection-detail')]";
  collectioHeaderSelector = ".collection-header";
  collectionEndSelector = ".collection-end";
  collectionSelect = ".collection-select select";
  productTitleSelector = ".product-col .collection-detail__product-details .title";
  paginationSelector = ".pagination";
  searchIconDesktop = ".header .search-icon";
  searchModal = ".search-modal";
  searchModalClose = ".search-modal__close";
  searchModalProductTitle = ".search-modal__title";
  searchSort = ".select-box select";
  searchPage = "[id='search']";
  checkboxes = ".s-checkbox";
  searching = `${this.searchPage} .searching`;
  collectionSort = this.genLoc(".collection-select--item select");
  leftFilters = this.genLoc(".collection-left-filters");
  onTopFilters = this.genLoc("div.base-multiselect");
  drawerFiltersBtn = this.genLoc(".collection-select--item.select-filter");
  inDrawerFilters = this.genLoc("div.filter-drawer__container");
  inDrawerFiltersSection = this.genLoc(".filter-collapse");
  filterTags = this.genLoc(".filter-tags .tag").filter({ has: this.genLoc(".icon-close") });
  productsInCollection = this.genLoc("div.product-col");
  productTitle = this.productsInCollection.locator(".title");
  productPrice = ".price";
  clearAllFiltersBtn = this.genLoc(".view-more-link").filter({ hasText: "Clear all" });
  noResult = this.page.getByRole("heading", { name: "No matching products found" });
  colorSwatches = ".filter-options--color-swatches label.s-checkbox";
  xIcon = ".filter-drawer-icon-close";

  async gotoProduct(name: string) {
    // await this.page.locator(`(//span[@title='${name}'])[1]`).click();
    await this.page.locator(`(//span[normalize-space()='${name}'])[1]`).click();
    // await expect(
    //   this.page.locator("(//span[contains(text(),'Add to cart')])[1]")
    // ).toBeVisible();
    await this.page.waitForNavigation();
    return new SFProduct(this.page, this.domain);
  }

  async loadMore() {
    await this.page.locator("(//footer[@role='contentinfo'])[1]").hover();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get collection info by api on storefront
   * @param authRequest is request context
   * @param collectionHandle is collection handle
   * @param collectionValue include collection info
   * @param accessToken is access token
   * @returns collection info
   */
  async getCollectionInfoByApi(
    authRequest: APIRequestContext,
    collectionHandle: string,
    collectionValue: CollectionValue,
    accessToken?: string,
  ): Promise<CollectionValue> {
    let response;
    let collectionUrl = `https://${this.domain}/api/catalog/next/collections.json?handles=${collectionHandle}`;
    if (accessToken) {
      collectionUrl = `https://${this.domain}/api/catalog/next/collections.json?handles=${collectionHandle}&access_token=${accessToken}`;
      response = await this.page.request.get(collectionUrl);
    } else {
      response = await authRequest.get(collectionUrl);
    }
    expect(response.ok()).toBeTruthy();
    const jsonResponse = await response.json();
    const collectionInfoApi = this.cloneObject<CollectionValue>(collectionValue, ["image_name"]);
    if (collectionInfoApi.collection_title) {
      collectionInfoApi.collection_title = jsonResponse.result.items[0].title;
    }
    if (collectionInfoApi.collection_description) {
      collectionInfoApi.collection_description = jsonResponse.result.items[0].description;
    }
    if (collectionInfoApi.meta_title) {
      collectionInfoApi.meta_title = jsonResponse.result.items[0].meta_title;
    }
    if (collectionInfoApi.meta_description) {
      collectionInfoApi.meta_description = jsonResponse.result.items[0].meta_description;
    }
    if (collectionInfoApi.sort_order) {
      collectionInfoApi.sort_order = jsonResponse.result.items[0].sort_order;
    }
    return collectionInfoApi;
  }

  /**
   * Collection info in SF
   * @param authRequest
   * @param handle
   * @returns
   */
  async getCollectionFiltersInfo(handle: string): Promise<FilterSF[]> {
    try {
      const res = await this.page.request.get(
        `https://${this.domain}/api/catalog/next/collections.json?handles=${handle}`,
      );
      const resJson = await res.json();
      return resJson.result.filters;
    } catch (error) {
      throw new Error("Get collection info failed!");
    }
  }

  /**
   * Check product sync to collection on storefront
   * @param productName is product name
   */
  async checkProductSyncToCollectionSF(productName: string): Promise<boolean> {
    for (let i = 0; i < productName.length; i++) {
      const xpathProduct = `(//div[contains(@class,'collection-detail')]//div[contains(@class,'product-details') and contains(normalize-space(),'${productName[i]}')])[1]`;
      const checkProductVisible = await this.page.locator(xpathProduct).isVisible({ timeout: 30000 });
      if (checkProductVisible === false) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check product sync to collection on storefront
   * @param productSortData is product sort data
   */
  async verifyProductSortOnColectionSF(productSortData: string): Promise<boolean> {
    for (let i = 0; i < productSortData.length; i++) {
      const value = await this.page
        .locator(
          `(//div[contains(@class,'collection-detail__product-details')]//span[contains(@class,'title d-block')])[${
            i + 1
          }]`,
        )
        .textContent();
      if (value.replace(/\n/g, "").trim() !== productSortData[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check product after sort on storefront
   * @param sortType is sort type
   * @param productSortData is product sort data
   */
  async sortProductOnCollection(sortType: string, productSortData: string) {
    if (sortType) {
      await this.page.selectOption("//select[contains(@class,'prefix-icon')]", {
        label: sortType,
      });
    }
    await this.verifyProductSortOnColectionSF(productSortData);
  }

  /**
   * Verify response product with DOM
   * @param sortField
   * @returns
   */
  async verifyResponseProductWithDom(
    sort?: { field: string; direction: string },
    products?: Array<unknown>,
  ): Promise<boolean> {
    let items = products as Products[];
    if (!items) {
      const res = await Promise.all([
        this.waitResponseWithUrl("/api/catalog/next/products.json"),
        waitForProgressBarDetached(this.page),
      ]);
      const resJson = await res[0].json();
      items = resJson.result.items;
    }

    if (sort) {
      items.sort((a: Products, b: Products) => {
        if (sort.direction === "desc") {
          return a[sort.field] > b[sort.field] ? -1 : 0;
        }

        return a[sort.field] > b[sort.field] ? 0 : -1;
      });
    }

    const titles = await this.genLoc(this.productTitleSelector).all();
    let isTruthy = false;
    for (let i = 0; i < titles.length; i++) {
      const textContent = await titles[i].textContent();
      if (textContent !== items[i].title) {
        isTruthy = false;
        break;
      }

      isTruthy = true;
    }
    return isTruthy;
  }

  /**
   * Set filter for Price
   * @param param0
   */
  async setPriceFilter(
    position: "Left sidebar" | "On top" | "In drawer",
    { from, to }: { from?: number; to?: number },
  ): Promise<void> {
    let filterSection: Locator;
    if (position === "On top") {
      filterSection = this.genLoc(".base-multiselect__content");
      await this.genLoc(".price-filter-select").getByRole("button").click();
    } else {
      filterSection = this.genLoc(".filter-collapse");
    }
    if (typeof from !== "undefined") {
      await filterSection.getByRole("spinbutton").and(this.genLoc("[name=min]")).fill(from.toString());
    }
    if (typeof to !== "undefined") {
      await filterSection.getByRole("spinbutton").and(this.genLoc("[name=max]")).fill(to.toString());
    }
  }

  /**
   * Get products title and price into array of string & number
   * @returns
   */
  async getProductsInfo(): Promise<Record<string, string | number>[]> {
    const productsData = [];
    for (const product of await this.productsInCollection.all()) {
      const title = await product.locator(".title").innerText();
      const price = parseFloat((await product.locator(".price").innerText()).replace("$", ""));
      productsData.push({ title: title, price: price });
    }
    return productsData;
  }

  /**
   * Set filters in collection SF
   * @param data
   */
  async setSearchFilter(data: SelectFiltersData): Promise<void> {
    let filterType: Locator;
    switch (data.position) {
      case "On top":
        filterType = this.onTopFilters;
        break;
      case "In drawer":
        filterType = this.inDrawerFilters;
        if (await this.inDrawerFilters.isHidden()) {
          await this.drawerFiltersBtn.click();
        }
        break;
      default:
        filterType = this.leftFilters;
        break;
    }
    if (data.price) {
      await this.setPriceFilter(data.position, data.price);
    }
    if (data.filters) {
      for (const filter of data.filters) {
        const index = !filter.index ? 0 : filter.index;
        if (data.position === "On top") {
          await this.genLoc(".base-multiselect").getByRole("button", { name: filter.cate }).click();
        }
        await filterType.locator(this.checkboxes).filter({ hasText: filter.name }).nth(index).setChecked(filter.check);
      }
    }
    if (data.position === "In drawer") {
      await filterType.getByRole("button", { name: "Apply" }).click();
    }
  }

  /**
   * Select color swatches filter
   * @param position: vị trí filter
   * @param options: các options cần tương tác
   * @param check: chỌn hoặc bỏ chọn filter
   */
  async selectColorSwatches({
    position,
    options,
    check = true,
  }: {
    position: "Left sidebar" | "On top" | "In drawer";
    options: string[];
    check: boolean;
  }): Promise<void> {
    let filterType: Locator;
    switch (position) {
      case "On top":
        filterType = this.onTopFilters;
        await filterType.and(this.genLoc(".filter-color")).getByRole("button").click();
        break;
      case "In drawer":
        filterType = this.inDrawerFilters;
        if (await this.inDrawerFilters.isHidden()) {
          await this.drawerFiltersBtn.click();
        }
        break;
      default:
        filterType = this.leftFilters;
        break;
    }
    for (const option of options) {
      await filterType
        .locator(this.colorSwatches)
        .filter({ has: this.genLoc(`#${option}`) })
        .setChecked(check);
    }
    if (position === "In drawer") {
      await filterType.getByRole("button", { name: "Apply" }).click();
    }
  }
}
