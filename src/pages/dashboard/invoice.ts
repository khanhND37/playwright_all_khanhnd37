import { Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import type { DataInvoice, FilterCondition, InvoiceFilter } from "@types";
import { removeCurrencySymbol } from "@core/utils/string";

export class InvoicePage extends SBPage {
  xpathFilterTag = "(//div[contains(@class,'justify-content-around')]//span[@class='s-tag'])[1]";
  xpathLastestInvoiceAmount = '//tr[1]/td/span[@class="amount_red"]';

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /*
   * Open collapse in sidebar menu More filter
   * Param: Collapse item name
   */
  async openCollapse(name: string) {
    const xpathCollapse = `//p[@class='title' and normalize-space()='${name}']`;
    await this.page.locator(xpathCollapse).click();
  }

  /*
   * Select domain from filter sidebar menu
   * param: store domain
   */
  async selectFilterDomain(domain: string) {
    // eslint-disable-next-line max-len
    const xpathCheckboxDomain = `//input[@type='checkbox']//following-sibling::span[child::div[normalize-space()='${domain}']]`;
    await this.openCollapse("Shop Domain");
    await this.waitUntilElementVisible(xpathCheckboxDomain);
    await this.verifyCheckedThenClick(xpathCheckboxDomain, true);
  }

  /*
   * Select invoice content from filter sidebar menu
   * param: invoice content
   */
  async selectFilterInvoiceContent(invoiceContent: string) {
    await this.openCollapse("Invoice");
    const ddlInvoiceContent = "//div[@role='tab']//following-sibling::div[@role='tabpanel']//select";
    await this.waitUntilElementVisible(ddlInvoiceContent);
    await this.page.locator(ddlInvoiceContent).selectOption({ label: invoiceContent });
  }

  /*
   * Select invoice content from filter sidebar menu
   * param: invoice content
   */
  async selectFilterInvoiceContentByValue(invoiceContentValue: string) {
    await this.openCollapse("Invoice");
    const ddlInvoiceContent = "//div[@role='tab']//following-sibling::div[@role='tabpanel']//select";
    await this.waitUntilElementVisible(ddlInvoiceContent);
    await this.page.locator(ddlInvoiceContent).selectOption({ value: invoiceContentValue });
  }

  /**
   * Select invoice content from filter sidebar menu
   * Use in case filter with subscription fee, because filter has two options "Subscription fee collecting"
   * param: value of the option and shop domain
   */
  async selectFilterInvoiceContentByValueAndDomain(invoiceContentValue: string, shopDomain: string, status?: string) {
    const xpathCheckboxDomain = `//input[@type='checkbox']//following-sibling::span[child::div[normalize-space()='${shopDomain}']]`;
    const ddlInvoiceContent = "//div[@role='tab']//following-sibling::div[@role='tabpanel']//select";
    const xpathCheckboxStatus = `//label[contains(@class,'checkbox')]//span[contains(text(),'${status}')]`;
    await this.clickOnBtnWithLabel("More filters");
    await this.page.waitForSelector("//div[contains(@id,'new-sidebar-filter')]//p[contains(text(), 'Filters')]");
    await this.selectCheckBoxWithLabel(xpathCheckboxDomain, "Shop Domain");
    await this.openCollapse("Invoice");
    await this.waitUntilElementVisible(ddlInvoiceContent);
    await this.page.locator(ddlInvoiceContent).selectOption({ value: invoiceContentValue });
    if (status) {
      await this.selectCheckBoxWithLabel(xpathCheckboxStatus, "Status");
    }
    await this.clickOnBtnWithLabel("Done");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * select checkbox condition with label
   * @param label that's user choose for filter condition
   * @param xpath is xpath of filter condition label
   */
  async selectCheckBoxWithLabel(xpath: string, label: string) {
    await this.openCollapse(label);
    await this.waitUntilElementVisible(xpath);
    await this.verifyCheckedThenClick(xpath, true);
    await this.openCollapse(label);
  }

  /**
   * Filter invoices with conditions( not include Date )
   * @param invoiceFilter that's object include data input for filter
   */
  async filterInvoiceWithConditions(invoiceFilter: InvoiceFilter) {
    // eslint-disable-next-line max-len
    const xpathCheckboxDomain = `//input[@type='checkbox']//following-sibling::span[child::div[normalize-space()='${invoiceFilter.domain}']]`;
    const xpathCheckboxStatus = `//label[contains(@class,'checkbox')]//span[contains(text(),'${invoiceFilter.status}')]`;

    await this.clickOnBtnWithLabel("More filters");
    await this.page.waitForSelector("//div[contains(@id,'new-sidebar-filter')]//p[contains(text(), 'Filters')]");
    if (invoiceFilter.domain) {
      await this.selectCheckBoxWithLabel(xpathCheckboxDomain, "Shop Domain");
    }

    if (invoiceFilter.invoice) {
      await this.openCollapse("Invoice");
      const ddlInvoiceContent = "//div[@role='tab']//following-sibling::div[@role='tabpanel']//select";
      await this.waitUntilElementVisible(ddlInvoiceContent);
      await this.page.locator(ddlInvoiceContent).selectOption({ label: invoiceFilter.invoice });
      await this.openCollapse("Invoice");
    }

    if (invoiceFilter.status) {
      await this.selectCheckBoxWithLabel(xpathCheckboxStatus, "Status");
    }

    if (invoiceFilter.amount && invoiceFilter.value_amount) {
      await this.openCollapse("Amount");
      await this.clickRadioButtonWithLabel(invoiceFilter.amount);
      await this.page
        .locator(
          `(//*[text()[normalize-space()='${invoiceFilter.amount}']]//parent::label)//following-sibling::div//input`,
        )
        .fill(invoiceFilter.value_amount);
      await this.openCollapse("Amount");
    }

    await this.clickOnBtnWithLabel("Done");
    await this.page.waitForLoadState("networkidle");
  }

  /***
   * Filter invoice with date
   * @param invoiceFilter that's object include data input for filter
   *                      format input from_date and to_date: "YYYY-MM-DD"
   */
  async filterInvoiceWithDate(invoiceFilter: InvoiceFilter, filterCondition: Array<FilterCondition>) {
    await this.goto(
      `/admin/balance/history?created_at_min=${invoiceFilter.from_date}&created_at_max=${invoiceFilter.to_date}`,
    );
    await this.filterWithConditionDashboard("More filters", filterCondition);
  }

  /*
   * Get index of column with column name
   * param: column name
   */
  async getIndexOfColumn(columnName: string): Promise<number> {
    let i = 1;
    let index: number;

    try {
      const xpathHead = "//table//thead";
      await this.page.waitForSelector(xpathHead);
      const xpathColumnTitleAll = "//table//thead//th//span";
      const countColumn = await this.genLoc(xpathColumnTitleAll).count();

      for (let i = 1; i <= countColumn; i++) {
        const xpathColumnTitle = `(//table//thead//th//span)[${i}]`;
        await this.page.waitForSelector(xpathColumnTitle);
        const columnPresent = await this.getTextContent(xpathColumnTitle);

        if (columnPresent === columnName) {
          index = i;
          break;
        }
      }
    } catch (e) {
      if (i <= 5) {
        await this.page.reload({ waitUntil: "networkidle" });
        i++;
      }
    }
    return index;
  }

  /*
   * get data by column label
   * param: label, rowIndex
   */
  async getDataByColumnLabel(label: string, rowIndex: number): Promise<string> {
    let data;
    let i = 1;
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector("//table//tbody");
    await this.page.waitForTimeout(3 * 1000); // wait list transaction load xong
    const xpathRow = await this.page.locator(`//table//tr//th[normalize-space()='${label}']/preceding-sibling::th`);
    const colIndex = (await xpathRow.count()) + 1;
    const xpathData = `(//table/tbody//tr[${rowIndex}]//td[${colIndex}]//span)[1]`;

    try {
      await this.page.locator(xpathData).isVisible();
    } catch (e) {
      await Promise.resolve();
    }

    do {
      data = await this.getTextContent(xpathData);
      i++;
      await this.page.waitForTimeout(500);
    } while (data === "" && i <= 10);
    return data;
  }

  /*
   * get data by column label
   * param: label, rowIndex
   */
  async getDataByRowLabel(label: string): Promise<string> {
    let data;
    let i = 1;
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForSelector("//h4[normalize-space()='Detail']//following-sibling::div[@class='d-flex']");
    const xpathRow = await this.page.locator(
      `//div[@class='p-b' and normalize-space()='${label}']//preceding-sibling::div`,
    );
    const rowIndex = (await xpathRow.count()) + 1;
    const xpathData = `(${xpathRow}/../following-sibling::div//div)[${rowIndex}]`;
    await this.page.waitForSelector(xpathData);
    do {
      data = await this.getTextContent(xpathData);
      i++;
    } while (data === "" && i <= 10);
    return data;
  }

  /**
   * click the newest invoice
   */
  async clickNewestInvoice() {
    await this.page.waitForSelector("(//table//tbody//tr//td//span)[2]");
    await this.page.locator("(//table//tbody//tr//td//span)[2]").hover();
    await this.page.click("(//table//tbody//tr//td//span)[2]");
    await this.page.waitForLoadState("load");
  }

  /**
   * verify data with column name
   * @param columnName is name column that is get data
   * @param dataCompare is data in file spec that use to compare with data at column name
   */
  async verifyDataWithColumnName(columnName: string, dataCompare: string, rowIndex = 1) {
    let dataVerify = false;
    const data = await this.getDataByColumnLabel(columnName, rowIndex);
    if (data === dataCompare) {
      dataVerify = true;
    }
    return dataVerify;
  }

  /**
   * verify amount at invoice
   * @param dataInvoice is object include type and amount_display
   */
  async verifyAmount(dataInvoice: DataInvoice) {
    let trueAmount = false;
    const amountActual = await this.getDataByColumnLabel("Amount", 1);
    if (amountActual.replace("$", "") === dataInvoice.amount_display) {
      trueAmount = true;
    }
    return trueAmount;
  }

  /**
   * verify date with column name
   * @param dateLabel is column name
   */
  async verifyDate(dateLabel: string) {
    let verifyDate = false;
    const createDateActual = await this.getDataByColumnLabel(dateLabel, 1);
    if (
      createDateActual.includes("Just now") ||
      createDateActual.includes("minute") ||
      createDateActual.includes("minutes")
    ) {
      verifyDate = true;
    }
    return verifyDate;
  }

  /**
   * verify invoice is created with full data
   * @param dataInvoice is object include full data to verify invoice
   */
  async verifyInvoice(dataInvoice: DataInvoice): Promise<boolean> {
    let verifyDataInvoice = false;
    if (
      (await this.verifyDataWithColumnName("Shop Domain", dataInvoice.domain)) &&
      (await this.verifyDataWithColumnName("Content", dataInvoice.content)) &&
      (await this.verifyAmount(dataInvoice)) &&
      (await this.verifyDataWithColumnName("Status", dataInvoice.status)) &&
      (await this.verifyDate("Created date")) &&
      (await this.verifyDate("Latest transaction date"))
    ) {
      verifyDataInvoice = true;
    }
    return verifyDataInvoice;
  }

  /**
   * verify invoice after filter invoice with condition include datetime
   * @param dataInvoice is object include full data to verify invoice
   */
  async verifyInvoiceFilterWithDate(dataInvoice: DataInvoice): Promise<boolean> {
    let verifyDataInvoice = false;
    if (
      (await this.verifyDataWithColumnName("Shop Domain", dataInvoice.domain)) &&
      (await this.verifyDataWithColumnName("Content", dataInvoice.content)) &&
      (await this.verifyAmount(dataInvoice)) &&
      (await this.verifyDataWithColumnName("Status", dataInvoice.status)) &&
      (await this.verifyDataWithColumnName("Created date", dataInvoice.created_date)) &&
      (await this.verifyDataWithColumnName("Latest transaction date", dataInvoice.latest_transaction_date))
    ) {
      verifyDataInvoice = true;
    }
    return verifyDataInvoice;
  }

  /**
   * verify transaction fee for all orders that's to be created in current day
   * @param invoiceAmountDisplay is value that calculated
   */
  async verifyAmountTransactionFee(invoiceAmountDisplay: number) {
    let equalAmount = false;
    const amountActual = (await this.getDataByColumnLabel("Amount", 1)).replace("$", "");
    if (parseFloat(amountActual) === invoiceAmountDisplay) {
      equalAmount = true;
    }
    return equalAmount;
  }

  /**
   * verify invoice transaction fee at Invoice page, that invoice is created after order is sucessfully
   * @param dataInvoice is object include full data to verify invoice
   * @param invoiceDisplay is total fee for all orders
   */
  async verifyInvoiceTransactionFee(dataInvoice: DataInvoice, invoiceDisplay: number): Promise<boolean> {
    let verifyDataInvoiceFee = false;
    if (
      (await this.verifyDataWithColumnName("Shop Domain", dataInvoice.domain)) &&
      (await this.verifyDataWithColumnName("Content", dataInvoice.content)) &&
      (await this.verifyAmountTransactionFee(Math.round(invoiceDisplay * 100) / 100)) &&
      (await this.verifyDataWithColumnName("Status", dataInvoice.status))
    ) {
      verifyDataInvoiceFee = true;
    }
    return verifyDataInvoiceFee;
  }

  /**
   *  reload page until status invoice is updated
   * @param statusCard
   */
  async reloadForStatusUpdate(statusCard: "Declined" | "Available") {
    let status;
    let i = 0;

    if (statusCard === "Declined") {
      do {
        i += 1;
        await this.page.reload();
        status = await this.getDataByColumnLabel("Status", 1);
      } while (status != "Void" && i < 10);
    } else {
      do {
        i += 1;
        await this.page.reload();
        status = await this.getDataByColumnLabel("Status", 1);
      } while (status != "Success" && i < 10);
    }
  }

  /**
   * get thông tin on log invoice
   * @param columName tên các cột của log invoice
   * @returns
   */
  async getInforInvoice(columName: string): Promise<string> {
    return await this.getDataByColumnLabel(columName, 1);
  }

  /**
   * Go to invoices list page
   * @param domain of the store
   */
  async goToInvoicesList(domain: string) {
    await this.page.goto(`https://${domain}/admin/balance/history`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Go to invoices list of the shop with filter by invoice type = subscription_first
   * @param shopId id of shop
   */
  async goToSubscriptionInvoices(shopId: number) {
    await this.page.goto(
      `https://${this.domain}/admin/balance/history?page=1&limit=30&invoice_type=subscription_first&order_by=id%20Desc&shop_ids=${shopId}`,
    );
    const billingHistory = await this.page.locator("//th[normalize-space()='Content']").isVisible();
    if (billingHistory) {
      await this.page.waitForSelector('//th[normalize-space()="Content"]');
    }
  }

  /**
   * get amount in Invoice detail with type
   * @param type of invoice
   * @param content of invoice
   */
  async getInvoiceWithType(type: string, content: string): Promise<string> {
    return removeCurrencySymbol(
      await this.getTextContent(
        `//td[child::span[normalize-space()='${type}']]//following-sibling::td//span[contains(text(),'${content}')]/following::span[1]`,
      ),
    );
  }
}
