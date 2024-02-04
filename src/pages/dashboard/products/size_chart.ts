import { APIRequestContext, Page, expect } from "@playwright/test";
import { DashboardPage } from "../dashboard";
import type { BodyAPIChartInSf, ChartResponseInSf, DataSizeChart, SizeChartInfo } from "@types";
import type { SizeChart } from "@types";

export class SizeChartPage extends DashboardPage {
  request: APIRequestContext;
  xpathSizeChartTitle = "(//div[contains(@class,'sb-flex sb-input')]//input)[1]";
  xpathUpdateButton = "//span[normalize-space()='Update']";
  xpathPageLoading = "(//div[@class='s-detail-loading'])[1]";
  xpathPageDetail = "#create-sizechart";
  xpathProductTag = "span.tag-list-item";
  xpathButtonSizeGuide = ".product__size-guide:has-text('Size Guide')";
  xpathProductVariant = ".product__variants";
  xpathShowSizeChart = ".product__size-chart > .inside-modal__body";
  xpathSizeChartImageLoaded = ".product__size-chart > .inside-modal__body  img";
  xpathAddImage = "div.s-upload > input[type=file]";
  xpathTitleProductDetail = "(//div[@class='add-product-page']//h1 | //h1)";

  constructor(page: Page, domain: string, request?: APIRequestContext) {
    super(page, domain);
    this.request = request;
  }

  xpathSizeChartName(sizeChartName: string) {
    return `//div[contains(text(),'${sizeChartName}')]`;
  }

  /**
   * Go to Size chart page
   */
  async gotoSizeChart(page = "admin/size-charts/") {
    await this.page.goto("https://" + (this.domain + "/" + `${page}`).replace(/([^:]\/)\/+/g, "$1"));
    await this.page.waitForLoadState("load");
  }

  /**
   * Click sizechart by name
   * @param sizechartsName name of the size chart
   */
  async searchAndChooseSizecharts(sizechartsName: string) {
    const xpathInputSearch =
      "//input[@placeholder='Search...' or @placeholder='Search size charts by tag or style name']";
    await this.page.locator(xpathInputSearch).fill(sizechartsName);
    await this.page.waitForSelector(this.xpathSizeChartName(sizechartsName));
    await this.page.locator(this.xpathSizeChartName(sizechartsName)).click();
  }

  /**
   * filter size-chart by name and delete size-chart searchable
   * @param sizechartsName name of the size chart
   */
  async searchAndDeleteSizecharts(sizechartsName: string) {
    const xpathInputSearch =
      "//input[@placeholder='Search...' or @placeholder='Search size charts by tag or style name']";
    await this.page.locator(xpathInputSearch).fill(sizechartsName);
    await this.page.keyboard.press("Enter");
    await this.waitForElementVisibleThenInvisible("//div[@class='s-loading-table']");
    await this.page.waitForSelector("//div[@id='table-sizechart']");
    if (await this.page.getByText(`Could not find any size chart matching ${sizechartsName}`).isVisible()) {
      return;
    }
    await this.page.getByRole("row", { name: "tag style" }).locator("span").first().click();
    await this.page.locator("//button[normalize-space()='Action']").click();
    await this.page.getByText("Delete selected size charts").click();
    await this.page.getByRole("button", { name: "Delete" }).click();
    await this.waitUntilElementInvisible(`(//p[@class= 'has-data' and normalize-space()='${sizechartsName}'])[1]`);
  }

  /**
   * add size chart with option value
   * @param sizeChartInfo struct of the size chart
   */
  async addSizeChartWithOption(sizeChartInfo: SizeChartInfo) {
    await this.clickOnBtnWithLabel("Create Size Chart");
    await this.waitForElementVisibleThenInvisible(this.xpathPageLoading);

    if (sizeChartInfo.style && sizeChartInfo.style.length) {
      await this.page.getByPlaceholder("Size chart style").fill(sizeChartInfo.style);
    }

    if (sizeChartInfo.image_url && sizeChartInfo.image_url.length) {
      await this.page.getByRole("link", { name: "Add image from URL" }).click();
      await this.page.getByPlaceholder("http://").click();
      await this.page.getByPlaceholder("http://").fill(sizeChartInfo.image_url);
      await this.page.getByRole("button", { name: "Add image" }).click();
    }

    if (sizeChartInfo.image_local && sizeChartInfo.image_local.length) {
      await this.page.setInputFiles(this.xpathAddImage, `${sizeChartInfo.image_local}`);
    }

    if (sizeChartInfo.description && sizeChartInfo.description.length) {
      await this.page.frameLocator('iframe[title="Rich Text Area"]').getByRole("paragraph").click();
      await this.page
        .frameLocator('iframe[title="Rich Text Area"]')
        .locator("#tinymce")
        .fill(sizeChartInfo.description);
    }

    if (sizeChartInfo.description_html && sizeChartInfo.description_html.length) {
      await this.page.getByRole("button", { name: "Source code" }).click();
      await this.page.locator('textarea[type="text"]').fill(sizeChartInfo.description_html);
      await this.page.getByTitle("Save").click();
    }

    if (!sizeChartInfo.description_option) {
      await this.clickOnBtnWithLabel("Save");
      return;
    }
    await this.page.waitForSelector('iframe[title="Rich Text Area"]');
    let needEnter = false;
    if (sizeChartInfo.description_option.text && sizeChartInfo.description_option.text.length) {
      await this.page.frameLocator('iframe[title="Rich Text Area"]').getByRole("paragraph").click();
      await this.page
        .frameLocator('iframe[title="Rich Text Area"]')
        .locator("#tinymce")
        .fill(sizeChartInfo.description_option.text);
      needEnter = true;
    }

    if (sizeChartInfo.description_option.image && sizeChartInfo.description_option.image.length) {
      if (needEnter) {
        await this.page.keyboard.press("Enter");
      }
      await this.page.getByRole("button", { name: "Insert/edit image" }).click();
      await this.page.getByRole("tab", { name: "Upload" }).click();
      await this.page.setInputFiles(
        "button:has-text('Browse for an image') > input[type=file]",
        `${sizeChartInfo.description_option.image}`,
      );
      await this.waitForElementVisibleThenInvisible('div[aria-label="Uploading image"]');
      let widthImage = "";
      do {
        widthImage = await this.page
          .locator(`//label[normalize-space()='Width']//following-sibling::input`)
          .inputValue();
        await this.page.waitForTimeout(1500);
      } while (!widthImage);
      await this.page.getByTitle("Save").click();
      needEnter = true;
    }

    if (sizeChartInfo.description_option.table && sizeChartInfo.description_option.table.row_column > 0) {
      if (needEnter) {
        await this.page.keyboard.press("Enter");
      }
      await this.page.getByRole("button", { name: "Table" }).click();
      await this.page.getByText("Table", { exact: true }).click();
      await this.page.locator(`div:nth-child(${sizeChartInfo.description_option.table.row_column})`).click();
      let index = 1;
      for (const val of sizeChartInfo.description_option.table.values) {
        const tagTd = this.page.frameLocator('iframe[title="Rich Text Area"]').locator(`(//td)[${index}]`);
        if (await tagTd.isVisible()) await tagTd.fill(val);
        index++;
      }
    }

    await this.clickOnBtnWithLabel("Save");
  }

  /**
   * Get total size type
   * @returns number of size type
   */
  async getColumnSizeType(): Promise<number> {
    await this.page.waitForLoadState("networkidle");
    return await this.page.locator("//span[contains(@class,'sb-flex')]//input").count();
  }

  /**
   * Get status of size chart
   * @param index : index of size chart
   * @returns
   */
  async getStatusSizeChart(index: number): Promise<string> {
    const value = await this.page
      .locator(`(//span[contains(@class,'sb-flex')]//input)[${index}]`)
      .getAttribute("value");
    return value;
  }

  /**
   * Click switch button of size type
   * @param numberOrder index of switch button of size type
   */
  async clickSwitchSizechartType(numberOrder: number) {
    await this.page.locator(`(//span[contains(@class, 'sb-switch')])[${numberOrder}]`).click();
  }

  /**
   * Get name of size chart
   * @returns name of size chart
   */
  async getSizeChartName(): Promise<string> {
    return await this.page.locator("(//input[contains(@class,'sb-input')])[1]").inputValue();
  }

  /**
   * Get danh sách size chart shopbase trong dashboard
   * @returns
   */
  async getListSizeChartsByAPI(): Promise<SizeChart[]> {
    const res = await this.request.get(`https://${this.domain}/admin/size-chart/count.json`);
    expect(res.status()).toBe(200);
    const result = await res.json();
    const numberItem = result.count;
    const listItem = [];
    const numberPage = Math.ceil(numberItem / 20);
    for (let i = 1; i <= numberPage; i++) {
      const res = await this.request.get(
        `https://${this.domain}/admin/size-chart/list.json?total=0&limit=20&page=${i}&search=`,
      );
      expect(res.status()).toBe(200);
      const result = await res.json();
      const items = result.data;
      listItem.push(...items);
    }
    return listItem;
  }

  /**
   * Create size chart shopbase bằng api
   * @param body
   * @returns
   */
  async addSizeChartByAPI(body: DataSizeChart): Promise<DataSizeChart> {
    const res = await this.request.post(`https://${this.domain}/admin/size-chart.json`, {
      data: body,
    });
    expect(res.ok()).toBeTruthy();
    const result = await res.json();
    return result;
  }

  /**
   * Edit size chart shopbase bằng api
   * @param body
   * @returns
   */
  async editSizeChartByAPI(body: DataSizeChart): Promise<DataSizeChart> {
    const res = await this.request.put(`https://${this.domain}/admin/size-chart/${body.id}.json`, {
      data: body,
    });
    expect(res.ok()).toBeTruthy();
    const result = await res.json();
    return result;
  }

  /**
   * Xóa cache size chart ở storefront
   * @param code
   * @param body
   * @returns
   */
  async deleteCacheAPIChartInSF(code: string, body: BodyAPIChartInSf): Promise<ChartResponseInSf> {
    const res = await this.request.post(`https://${this.domain}/api/pod-size-guide/next/chart.json?is_delete_cache=1`, {
      headers: {
        "x-lang": code,
      },
      data: body,
    });

    expect(res.ok()).toBeTruthy();
    return res.json();
  }
}
