import { APIRequestContext, expect } from "@playwright/test";
import type { DataBalance, DataInvoicePlb } from "@types";

export class BalanceUserAPI {
  domain: string;
  request: APIRequestContext;
  constructor(domain: string, request: APIRequestContext) {
    this.domain = domain;
    this.request = request;
  }

  /**
   * Get data of user's balance
   * @returns
   */
  async getDataBalance(): Promise<DataBalance> {
    const res = await this.request.get(`https://${this.domain}/admin/balance.json?fetch-bucket-details=true`);
    expect(res.status()).toBe(200);
    const dataBalance = await res.json();
    return dataBalance.balance;
  }

  /**
   * To update Enable ShopBase Payment payout to Shopbase balance
   * @param isEnable
   */
  async updateEnablePayoutSpay(isEnable = true) {
    const res = await this.request.put(`https://${this.domain}/admin/balance/settings.json`, {
      data: { spay_auto_payout: isEnable },
    });
    expect(res.status()).toBe(200);
  }

  /**
   *  Get data transaction
   * @param invoiceId is invoice id of order
   * @returns data invoice of order
   */
  async getDataTransaction(invoiceId: string): Promise<Array<DataInvoicePlb>> {
    const response = await this.request.get(
      `https://${this.domain}/admin/balance/invoices/${invoiceId}/transactions.json`,
    );
    expect(response.status()).toBe(200);
    const res = await response.json();
    return res.transactions;
  }

  /**
   * Retrieves the hold amount and date of a transaction.
   * @param invoiceId - The invoice ID for the transaction.
   * @param orderName - The name of the order associated with the transaction.
   * @param reasonHold - The reason for the hold.
   * @returns An object containing hold amount and date information.
   */
  async getHoldAmountAndDateOfTran(invoiceId: string, orderName: string, reasonHold: string) {
    // Retrieve a list of transactions for the given invoice
    const listTransaction = await this.getDataTransaction(invoiceId);

    let payoutDateTypeOut: string;
    let payoutDateTypeIn: string;
    let payoutDateProfit: string;
    let isInfinity: boolean;
    let holdAmount: number;

    // Iterate through the list of transactions
    for (const transaction of listTransaction) {
      if (transaction.details === `Order ${orderName} is on hold due to: ${reasonHold}`) {
        // Calculate the absolute value of the hold amount
        holdAmount = Math.abs(transaction.amount_cent);

        // Check the transaction type and set payout dates accordingly
        if (transaction.transaction_type === "charge_hold") {
          payoutDateTypeOut = transaction.available_at;
        } else if (transaction.transaction_type === "topup_with_hold") {
          // Check if the available date is set to "none" to determine if it's infinity
          isInfinity = JSON.parse(transaction.metadata).is_infinity;
          payoutDateTypeIn = transaction.available_at;
        }
      } else {
        // Set the payout date for non-hold transactions
        payoutDateProfit = transaction.available_at;
      }
    }

    // Create an object with the hold amount and date information
    const holdAmountAndDateOfTran = {
      holdAmount: holdAmount,
      payoutDateTypeOut: payoutDateTypeOut,
      isInfinity: isInfinity,
      payoutDateTypeIn: payoutDateTypeIn,
      payoutDateProfit: payoutDateProfit,
    };

    return holdAmountAndDateOfTran;
  }
}
