import { Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import type { DataInvoice, FilterCondition, TransactionFilter } from "@types";
import { InvoicePage } from "./invoice";

export class TransactionPage extends SBPage {
  xpathFilterTag = "(//div[contains(@class,'justify-content-around')]//span[@class='s-tag'])[1]";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Filter invoices with conditions( not include Date )
   * @param transactionFilter that's object include data input for filter
   */
  async filterTransactionWithConditions(invoicePage: InvoicePage, transactionFilter: TransactionFilter) {
    // eslint-disable-next-line max-len
    const xpathCheckboxDomain = `//input[@type='checkbox']//following-sibling::span[child::div[normalize-space()='${transactionFilter.domain}']]`;
    const xpathCheckboxStatus = `//label[contains(@class,'checkbox')]//span[contains(text(),'${transactionFilter.status}')]`;

    await this.clickOnBtnWithLabel("More filters");
    await this.page.waitForSelector("//div[contains(@id,'new-sidebar-filter')]//p[contains(text(), 'Filters')]");
    if (transactionFilter.domain) {
      await invoicePage.selectCheckBoxWithLabel(xpathCheckboxDomain, "Shop Domain");
    }

    if (transactionFilter.invoice) {
      await invoicePage.openCollapse("Invoice");
      const ddlInvoiceContent = "//div[@role='tab']//following-sibling::div[@role='tabpanel']//select";
      await invoicePage.waitUntilElementVisible(ddlInvoiceContent);
      await invoicePage.page.locator(ddlInvoiceContent).selectOption({ label: transactionFilter.invoice });
      await invoicePage.openCollapse("Invoice");
    }

    if (transactionFilter.status) {
      await invoicePage.selectCheckBoxWithLabel(xpathCheckboxStatus, "Status");
    }

    if (transactionFilter.amount && transactionFilter.value_amount) {
      await invoicePage.openCollapse("Amount");
      await this.clickRadioButtonWithLabel(transactionFilter.amount);
      await this.page
        .locator(
          `(//*[text()[normalize-space()='${transactionFilter.amount}']]//parent::label)//following-sibling::div//input`,
        )
        .fill(transactionFilter.value_amount);
      await invoicePage.openCollapse("Amount");
    }

    if (transactionFilter.source) {
      await invoicePage.openCollapse("Source");
      await this.page.click("//input[contains(@placeholder, 'Search the source name')]");
      await this.page.click(
        `//div[contains(@class, 'dropdown-menu')]//span[contains(text(), '${transactionFilter.source}')]`,
      );
      await invoicePage.openCollapse("Source");
    }

    await this.clickOnBtnWithLabel("Done");
    await this.page.waitForLoadState("networkidle");
  }

  /***
   * Filter invoice with date
   * @param invoiceFilter that's object include data input for filter
   *                      format input from_date and to_date: "YYYY-MM-DD"
   */
  async filterTransactionWithDate(transactionFilter: TransactionFilter, filterCondition: Array<FilterCondition>) {
    if (
      transactionFilter.created_from_date &&
      transactionFilter.created_to_date &&
      !transactionFilter.available_from_date &&
      !transactionFilter.available_to_date
    ) {
      await this.goto(
        `/admin/balance/transactions?created_at_min=${transactionFilter.created_from_date}
        &created_at_max=${transactionFilter.created_to_date}`,
      );
    } else if (
      !transactionFilter.created_from_date &&
      !transactionFilter.created_to_date &&
      transactionFilter.available_from_date &&
      transactionFilter.available_to_date
    ) {
      await this.goto(
        `/admin/balance/transactions?available_at_min=${transactionFilter.available_from_date}
        &available_at_max=${transactionFilter.available_to_date}`,
      );
    } else if (
      transactionFilter.created_from_date &&
      transactionFilter.created_to_date &&
      transactionFilter.available_from_date &&
      transactionFilter.available_to_date
    ) {
      await this.goto(
        `/admin/balance/transactions?created_at_min=${transactionFilter.created_from_date}
        &created_at_max=${transactionFilter.created_to_date}&available_at_min=${transactionFilter.available_from_date}
        &available_at_max=${transactionFilter.available_to_date}`,
      );
    }
    await this.filterWithConditionDashboard("More filters", filterCondition);
  }
  /**
   * click the newest transaction
   */
  async clickNewestTransaction() {
    const xpath = "(//table//tbody//tr//td//div)[1]";
    await this.page.waitForSelector(xpath);
    await this.page.locator(xpath).click();
  }

  /**
   * verify content that's collapsed after use function clickNewestTransaction() to open it
   * @param columnName is name column that is get data
   * @param dataCompare is data in file spec that use to compare with data at column name
   */
  async verifyContentCollapsed(columnName: string, dataCompare: string, invoicePage: InvoicePage): Promise<boolean> {
    let dataVerify = false;
    const data = (await invoicePage.getDataByColumnLabel(columnName, 2)).replace(/\s/g, "");
    if (data.includes(dataCompare.replace(/\s/g, ""))) {
      dataVerify = true;
    }
    return dataVerify;
  }

  /**
   * verify transaction after filter transaction with condition include created date and available date
   * @param dataInvoice is object include full data to verify invoice
   */
  async verifyTransactionFilterWithAllDate(invoicePage: InvoicePage, dataInvoice: DataInvoice): Promise<boolean> {
    let verifyDataInvoice = false;
    if (
      (await invoicePage.verifyDataWithColumnName("Shop Domain", dataInvoice.domain)) &&
      (await invoicePage.verifyDataWithColumnName("Invoice", dataInvoice.content)) &&
      (await invoicePage.verifyAmount(dataInvoice)) &&
      (await invoicePage.verifyDataWithColumnName("Balance", dataInvoice.balance)) &&
      (await invoicePage.verifyDataWithColumnName("Status", dataInvoice.status)) &&
      (await invoicePage.verifyDataWithColumnName("Created date", dataInvoice.created_date)) &&
      (await invoicePage.verifyDataWithColumnName("Available date", dataInvoice.available_date)) &&
      (await this.verifyContentCollapsed("Invoice", dataInvoice.invoice_collapsed, invoicePage)) &&
      (await this.verifyContentCollapsed("Available date", dataInvoice.source_collapsed, invoicePage))
    ) {
      verifyDataInvoice = true;
    }
    return verifyDataInvoice;
  }

  /**
   * verify amount transaction at column "Amount"
   * @param amountTransaction
   */
  async verifyAmountTransaction(amountTransaction: string, rowIndex = 1): Promise<boolean> {
    let equalAmount = false;
    const amountActual = (await this.getDataByColumnLabel("Amount", rowIndex)).replace("$", "");
    if (parseFloat(amountActual) === parseFloat(amountTransaction)) {
      equalAmount = true;
    }
    return equalAmount;
  }

  /**
   * verify value at column "Balance" in Transactions page
   * @param amountPast input value the past balance that's need to compare
   * @param balanceTransaction that's amount input to topup
   * @param status that's status of invoice
   * @returns
   */
  async verifyBalanceTransaction(balanceTransaction: string, status?: string): Promise<boolean> {
    let equalAmount = false;
    const amountActual = (await this.getDataByColumnLabel("Balance", 1)).replace("$", "").replace(",", "");
    const amountPast = (await this.getDataByColumnLabel("Balance", 2)).replace("$", "").replace(",", "");
    if (
      (parseFloat(amountPast) + parseFloat(balanceTransaction)).toFixed(2) === parseFloat(amountActual).toFixed(2) ||
      (status === "Pending" && amountActual === "-") ||
      (status === "Failed" && amountActual === "-")
    ) {
      equalAmount = true;
    }
    return equalAmount;
  }
}
