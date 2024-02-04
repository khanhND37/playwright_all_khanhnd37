import { expect } from "@core/fixtures";
import type { DataInvoice, DataInvoiceDetail } from "@types";
import { InvoicePage } from "@pages/dashboard/invoice";
import { InvoiceDetailPage } from "@pages/dashboard/invoice_detail";

/**
 * verify content invoice at Invoice page
 * @param invoicePage is call to class InvoicePage at file ./src/page/dashboard/balance_billing.ts
 * @param dataInvoice is an object include data content for an invoice
 */
export const verifyInvoice = async (invoicePage: InvoicePage, dataInvoice: DataInvoice) => {
  const shopDomainActual = await invoicePage.getDataByColumnLabel("Shop Domain", 1);
  const contentActual = await invoicePage.getDataByColumnLabel("Content", 1);
  const statusActual = await invoicePage.getDataByColumnLabel("Status", 1);

  let invoiceAmount: string;
  if (dataInvoice.type === "OUT") {
    invoiceAmount = "-$" + dataInvoice.amount_display;
  } else {
    invoiceAmount = "$" + dataInvoice.amount_display;
  }

  const amountActual = await invoicePage.getDataByColumnLabel("Amount", 1);
  expect(amountActual).toEqual(invoiceAmount);

  const createDateActual = await invoicePage.getDataByColumnLabel("Created date", 1);
  await expect(
    createDateActual.includes("Just now") ||
      createDateActual.includes("minute") ||
      createDateActual.includes("minutes"),
  ).toBeTruthy();

  const latestTransactionDateActual = await invoicePage.getDataByColumnLabel("Latest transaction date", 1);
  await expect(
    latestTransactionDateActual.includes("Just now") ||
      latestTransactionDateActual.includes("minute") ||
      latestTransactionDateActual.includes("minutes"),
  ).toBeTruthy();

  expect(dataInvoice).toEqual(
    expect.objectContaining({
      domain: shopDomainActual,
      content: contentActual,
      status: statusActual,
    }),
  );
};

/**
 * verify content invoice: detail and transaction at Invoice detail page
 * @param invoiceDetailPage is call to class InvoiceDetailPage at file ./src/page/dashboard/balance_billing.ts
 * @param dataInvoiceDetail is an object include data content for an invoice detail page
 */
export const verifyInvoiceDetail = async (
  invoiceDetailPage: InvoiceDetailPage,
  dataInvoiceDetail: DataInvoiceDetail,
) => {
  //Verify Detail table
  const contentActual = await invoiceDetailPage.getDataByRowLabel("Content");
  const detailActual = await invoiceDetailPage.getDataByRowLabel("Detail");
  const typeActual = await invoiceDetailPage.getDataByRowLabel("Type");
  const shopNameActual = await invoiceDetailPage.getDataByRowLabel("Shop");

  let invoiceAmount: string;
  if (dataInvoiceDetail.type === "OUT") {
    invoiceAmount = "-$" + dataInvoiceDetail.amount_display;
  } else {
    invoiceAmount = "$" + dataInvoiceDetail.amount_display;
  }

  const amountActual = await invoiceDetailPage.getDataByRowLabel("Amount");
  expect(invoiceAmount).toEqual(amountActual);

  const createdDateActual = await invoiceDetailPage.getDataByRowLabel("Created date");
  expect("Today").toEqual(createdDateActual);

  //Verify Transaction table
  const transactionTypeActual = await invoiceDetailPage.getDataByColumnLabel("Type", 1);
  const transactionContentActual = await invoiceDetailPage.getDataByColumnLabel("Content", 1);
  const transactionStatusActual = await invoiceDetailPage.getDataByColumnLabel("Status", 1);

  let transactionAmount: string;
  if (dataInvoiceDetail.transactions_type === "OUT") {
    transactionAmount = "-$" + dataInvoiceDetail.amount_display;
  } else {
    transactionAmount = "$" + dataInvoiceDetail.amount_display;
  }

  const transactionAmountActual = await invoiceDetailPage.getDataByColumnLabel("Amount", 1);
  expect(transactionAmount).toEqual(transactionAmountActual);

  const transactionDateActual = await invoiceDetailPage.getDataByColumnLabel("Date", 1);
  await expect(
    transactionDateActual.includes("Just now") ||
      transactionDateActual.includes("minute") ||
      transactionDateActual.includes("minutes"),
  ).toBeTruthy();

  expect(dataInvoiceDetail).toEqual(
    expect.objectContaining({
      content: contentActual,
      detail: detailActual,
      type: typeActual,
      shop_name: shopNameActual,
      transactions_type: transactionTypeActual,
      transactions_content: transactionContentActual,
      transactions_status: transactionStatusActual,
    }),
  );
};
