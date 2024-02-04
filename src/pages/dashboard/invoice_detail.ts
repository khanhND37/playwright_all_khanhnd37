import { Page } from "@playwright/test";
import { SBPage } from "@pages/page";
import type { DataInvoiceDetail } from "@types";
import { removeCurrencySymbol } from "@core/utils/string";

export class InvoiceDetailPage extends SBPage {
  xpathTextStatusPayoutRequest = "(//div[preceding-sibling::button[normalize-space()='Download invoice']]/div)[1]";
  xpathHeadingInvoiceDetailPage = "//div[contains(@class, 'heading')]//h2[contains(text(), 'Invoice detail')]";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Go to invoice detail page by url and id's invoice
   */
  async goToInvoiceDetailWithId(invoiceId: string) {
    await this.page.goto(`https://${this.domain}/admin/balance/invoice/${invoiceId}`);
    await this.page.waitForSelector(this.xpathHeadingInvoiceDetailPage);
  }

  /**
   * Download file PDF from the page then return the path of the file
   * @param xpath
   */
  async downloadFile(xpath: string): Promise<string> {
    await this.page.waitForSelector(xpath);
    await this.genLoc(xpath).click();
    const download = await this.page.waitForEvent("download");
    return download.path();
  }

  /**
   * verify data with row name for invoice detail
   * @param rowName is name row that is get data
   * @param dataCompare is data in file spec that use to compare with data at row name
   */
  async verifyDataWithRowName(rowName: string, dataCompare: string) {
    const data = await this.getDataByRowLabel(rowName);
    let dataTrue = false;
    if (data === dataCompare) {
      dataTrue = true;
    }
    return dataTrue;
  }

  /**
   * verify amount for invoice detail
   * @param dataInvoiceDetail is object include type and amount_display, at invoice detail table
   */
  async verifyAmountInvoice(dataInvoiceDetail: DataInvoiceDetail) {
    let trueAmount = false;
    const amountActual = await this.getDataByRowLabel("Amount");
    if (amountActual.replace("$", "") === dataInvoiceDetail.amount_display) {
      trueAmount = true;
    }
    return trueAmount;
  }

  /**
   * verify date for invoice detail
   */
  async verifyDateInvoice() {
    let trueDate = false;
    const createdDateActual = await this.getDataByRowLabel("Created date");
    if (createdDateActual === "Today") {
      trueDate = true;
    }
    return trueDate;
  }

  /**
   * verify data with column name for transaction detail
   * @param columnName is name column that is get data
   * @param dataCompare is data in file spec that use to compare with data at column name
   */
  async verifyDataWithColumnName(columnName: string, dataCompare: string) {
    let dataTrue = false;
    const data = await this.getDataByColumnLabel(columnName, 1);
    if (data === dataCompare) {
      dataTrue = true;
    }
    return dataTrue;
  }

  /**
   * verify date with column name for transaction detail
   * @param dataLabel is column name
   */
  async verifyDateTransaction(dataLabel: string) {
    let dataTrue = false;
    const createDateActual = await this.getDataByColumnLabel(dataLabel, 1);
    if (
      createDateActual.includes("Just now") ||
      createDateActual.includes("minute") ||
      createDateActual.includes("minutes")
    ) {
      dataTrue = true;
    }
    return dataTrue;
  }

  /**
   * verify amount for invoice detail
   * @param dataInvoiceDetail is object include type and amount_display, at transaction table
   */
  async verifyAmountTransaction(dataInvoiceDetail: DataInvoiceDetail) {
    let dataAmount = false;
    let amountCompare;
    const amountActual = await this.getDataByColumnLabel("Amount", 1);
    if (dataInvoiceDetail.transactions_type === "IN") {
      amountCompare = dataInvoiceDetail.amount_display.replace("-", "");
    } else {
      amountCompare = dataInvoiceDetail.amount_display;
    }
    if (amountActual.replace("$", "") === amountCompare) {
      dataAmount = true;
    }
    return dataAmount;
  }

  /**
   * verify invoice is created with full data
   * @param dataInvoiceDetail is object include full data to verify invoice detail
   */
  async verifyInvoiceDetail(dataInvoiceDetail: DataInvoiceDetail): Promise<boolean> {
    let verifyDataInvoiceDetail = false;
    if (
      (await this.verifyDataWithRowName("Shop", dataInvoiceDetail.shop_name)) &&
      (await this.verifyDataWithRowName("Content", dataInvoiceDetail.content)) &&
      (await this.verifyDataWithRowName("Detail", dataInvoiceDetail.detail)) &&
      (await this.verifyDataWithRowName("Type", dataInvoiceDetail.type)) &&
      (await this.verifyAmountInvoice(dataInvoiceDetail)) &&
      (await this.verifyDateInvoice()) &&
      (await this.verifyDataWithColumnName("Type", dataInvoiceDetail.transactions_type)) &&
      (await this.verifyDataWithColumnName("Content", dataInvoiceDetail.transactions_content)) &&
      (await this.verifyAmountTransaction(dataInvoiceDetail)) &&
      (await this.verifyDataWithColumnName("Status", dataInvoiceDetail.transactions_status)) &&
      (await this.verifyDateTransaction("Date"))
    ) {
      verifyDataInvoiceDetail = true;
    }
    return verifyDataInvoiceDetail;
  }

  /**
   * At Invoice detail page, verify text content at row "Detail" for Invoice transaction fee
   * @param dataInvoiceDetail is is object include full data to verify invoice detail
   */
  async verifyTextDetailRowTransactionFee(dataInvoiceDetail: DataInvoiceDetail) {
    let content = false;
    const detailActual = await this.getDataByRowLabel("Detail");
    if (detailActual.includes(dataInvoiceDetail.detail)) {
      content = true;
    }
    return content;
  }

  /**
   * At Invoice detail page, verify text content at row "Detail" for Invoice
   * @param dataInvoiceDetail is is object include full data to verify invoice detail
   * @param text that's added with dataInvoiceDetail.detail to complete a string,
   *             then compare with a string got from row "Detail"
   */
  async verifyDetailRowWithText(dataInvoiceDetail: DataInvoiceDetail, text: string): Promise<boolean> {
    let content = false;
    const detailActual = await this.getDataByRowLabel("Detail");
    if (detailActual.replace(/\s/g, "") === (dataInvoiceDetail.detail + text).replace(/\s/g, "")) {
      content = true;
    }
    return content;
  }

  /**
   * At Invoice detail page, verify text content at row "Content" for Invoice transaction fee
   * @param dataInvoiceDetail is is object include full data to verify invoice detail
   * @param text that's added with dataInvoiceDetail.transactions_content to complete a string,
   *             then compare with a string got from row "Content"
   */
  async verifyContentColumnWithText(dataInvoiceDetail: DataInvoiceDetail, text: string): Promise<boolean> {
    let content = false;
    const contentActual = await this.getDataByColumnLabel("Content", 1);
    if (contentActual.replace(/\s/g, "") === (dataInvoiceDetail.transactions_content + text).replace(/\s/g, "")) {
      content = true;
    }
    return content;
  }

  /**
   * calculate total transaction fee for orders
   */
  async getTransactionFee(): Promise<number> {
    let invoiceAmount = 0;
    const count = await this.page.locator("//h4[contains(text(), 'Transaction')]//parent::div//tbody//tr").count();
    for (let i = 1; i <= count; i++) {
      const amount = (await this.getDataByColumnLabel("Amount", i)).replace(`$`, ``);
      const transactionAmountActual = parseFloat(amount);
      invoiceAmount += transactionAmountActual;
    }
    return invoiceAmount;
  }

  /**
   * At row "Amount", verify amount for invoice transaction fee
   */
  async verifyAmountRowTransactionFee() {
    let trueAmount = false;
    const amountActual = await this.getDataByRowLabel("Amount");
    const transactionFee = await this.getTransactionFee();
    if (parseFloat(amountActual.replace("$", "")) === Math.round(transactionFee * 100) / 100) {
      trueAmount = true;
    }
    return trueAmount;
  }

  /**
   * At column "Amount", verify amount for invoice transaction fee of current order
   * @param transactionFee calculated from current order
   * @param dataInvoiceDetail is object include full data to verify invoice detail
   */
  async verifyAmountColumnTransactionFee(
    dataInvoiceDetail: DataInvoiceDetail,
    transactionFee: string,
  ): Promise<boolean> {
    let dataAmount = false;
    let transactionFeeCompare;
    const getAmountTransFee = (await this.page.locator("//tbody//tr[1]//td[3]//span").textContent()).trim();
    const amountActual = removeCurrencySymbol(getAmountTransFee);
    if (dataInvoiceDetail.transactions_type === "OUT") {
      transactionFeeCompare = "-" + transactionFee;
    } else {
      transactionFeeCompare = transactionFee;
    }
    if (amountActual === transactionFeeCompare) {
      dataAmount = true;
    }
    return dataAmount;
  }

  /**
   * verify invoice transaction fee at Invoice detail page, that invoice is created after order is sucessfully
   * @param dataInvoiceDetail is object include full data to verify invoice detail
   * @param orderName is order's name
   * @param transactionFee is transaction fee
   */
  async verifyInvoiceDetailTransactionFee(
    dataInvoiceDetail: DataInvoiceDetail,
    orderName: string,
    transactionFee: string,
  ): Promise<boolean> {
    let verifyDataInvoiceDetailFee = false;
    const typeTransaction = (await this.page.locator("//tbody//tr[1]//td[1]//span").textContent()).trim();
    const contentTransaction = (await this.page.locator("//tbody//tr[1]//td[2]//span").textContent()).trim();
    if (
      (await this.verifyDataWithRowName("Shop", dataInvoiceDetail.shop_name)) &&
      (await this.verifyDataWithRowName("Content", dataInvoiceDetail.content)) &&
      (await this.verifyTextDetailRowTransactionFee(dataInvoiceDetail)) &&
      (await this.verifyDataWithRowName("Type", dataInvoiceDetail.type)) &&
      (await this.verifyAmountRowTransactionFee()) &&
      (await this.verifyDateInvoice()) &&
      typeTransaction === dataInvoiceDetail.transactions_type &&
      contentTransaction === (dataInvoiceDetail.transactions_content + orderName).trim() &&
      (await this.verifyAmountColumnTransactionFee(dataInvoiceDetail, transactionFee)) &&
      (await this.verifyDataWithColumnName("Status", dataInvoiceDetail.transactions_status))
    ) {
      verifyDataInvoiceDetailFee = true;
    }
    return verifyDataInvoiceDetailFee;
  }

  /**
   * verify invoice detail with add text for: row "Detail" and column "Content"
   * @param dataInvoiceDetail is object include full data to verify invoice detail
   * @param textDetailRow that's added with dataInvoiceDetail.detail to complete a string,
   *             then compare with a string got from row "Detail"
   * @param textContentColumn that's added with dataInvoiceDetail.transactions_content to complete a string,
   *             then compare with a string got from row "Content"
   */
  async verifyInvoiceDetailWithText(
    dataInvoiceDetail: DataInvoiceDetail,
    textDetailRow: string,
    textContentColumn: string,
  ): Promise<boolean> {
    let verifyDataInvoiceDetail = false;
    if (
      (await this.verifyDataWithRowName("Shop", dataInvoiceDetail.shop_name)) &&
      (await this.verifyDataWithRowName("Content", dataInvoiceDetail.content)) &&
      (await this.verifyDetailRowWithText(dataInvoiceDetail, textDetailRow)) &&
      (await this.verifyDataWithRowName("Type", dataInvoiceDetail.type)) &&
      (await this.verifyAmountInvoice(dataInvoiceDetail)) &&
      (await this.verifyDateInvoice()) &&
      (await this.verifyDataWithColumnName("Type", dataInvoiceDetail.transactions_type)) &&
      (await this.verifyContentColumnWithText(dataInvoiceDetail, textContentColumn)) &&
      (await this.verifyAmountTransaction(dataInvoiceDetail)) &&
      (await this.verifyDataWithColumnName("Status", dataInvoiceDetail.transactions_status)) &&
      (await this.verifyDateTransaction("Date"))
    ) {
      verifyDataInvoiceDetail = true;
    }
    return verifyDataInvoiceDetail;
  }
}
