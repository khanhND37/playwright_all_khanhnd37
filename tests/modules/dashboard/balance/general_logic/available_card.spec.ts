import { expect, test } from "@core/fixtures";
import { BalancePage } from "@pages/dashboard/balance";
import { InvoicePage } from "@pages/dashboard/invoice";
import { InvoiceDetailPage } from "@pages/dashboard/invoice_detail";
import { HiveBalance } from "@pages/hive/hive_balance";
import { loadData } from "@core/conf/conf";
import { TransactionPage } from "@pages/dashboard/transaction";
import { addDays, formatDate } from "@utils/datetime";
import { CheckoutAPI } from "@pages/api/checkout";
import { AccountSetting } from "@pages/dashboard/account_setting";
import { OrdersPage } from "@pages/dashboard/orders";
import { ConfirmPlanPage } from "@pages/dashboard/package";

let balancePage: BalancePage;
let invoicePage: InvoicePage;
let invoiceDetailPage: InvoiceDetailPage;
let hiveBalance: HiveBalance;
let transactionPage: TransactionPage;
let checkoutAPI: CheckoutAPI;
let accountSetting: AccountSetting;
let ordersPage: OrdersPage;
let confirmPlanPage: ConfirmPlanPage;
let idTopUpWireTransfer;
let getAmountUnavailable;
let checkoutInfo;
let totalPriceOrder;
let orderName;
let newPage;
let transactionFee;
let productsCheckout;
let refundInfo;
let orderId;
let refundAmount;
let refundFee;
let invoiceConditions, transactionConditions;
let source;
let invoiceInfo;
let transactionInfo;
let dateInvoiceFilter;
let dateTransactionFilter;
let filterConditionInvoice, filterConditionTransaction, filterTagInvoice, filterTagTransaction;
let availableToPayoutOld;
let startSub, endSub: string;
let invoiceChargeInfo, invoiceTopUpInfo;
let invoiceChargeFilter, filterChargeTag, invoiceTopUpFilter, filterTopUpTag;

// on the transaction table at the first line
// verify data at column: shop domain, invoice, status, created date, available date extended
const verifyTransactionData = async (
  inputDomain: string,
  inputContentInvoice: string,
  inputTransactionStatus: string,
  inputSource: string,
) => {
  await expect(await invoicePage.verifyDataWithColumnName("Shop Domain", inputDomain)).toBe(true);
  await expect(await invoicePage.verifyDataWithColumnName("Invoice", inputContentInvoice)).toBe(true);
  await expect(await invoicePage.verifyDataWithColumnName("Status", inputTransactionStatus)).toBe(true);
  await expect(await invoicePage.verifyDate("Created date")).toBe(true);
  await expect(await transactionPage.verifyContentCollapsed("Available date", inputSource, invoicePage)).toBe(true);
};

//format date and calculate cycle billing for plan monthly (30 days)
function dateSub() {
  const date = new Date();
  const dateUTC = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  startSub = formatDate(dateUTC, "MMMD,YYYY");
  endSub = formatDate(addDays(30, startSub), "MMMD,YYYY");
  return `${startSub}-${endSub}`;
}

test.describe("Manual top-up with Credit card ", async () => {
  const conf = loadData(__dirname, "CREDIT_CARD");
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      case_name: caseName,
      select_amount: selectAmount,
      amount_input: amountInput,
      invoice_filter: invoiceFilter,
      filter_tag: filterTag,
      invoice_info: invoiceInfo,
      banner_transfers_success: bannerTransfersSuccess,
      text_error: textError,
      message_error: messageError,
      filter_condition_transaction: filterConditionTransaction,
      source: source,
      filter_status: filterStatus,
    }) => {
      test(`@${caseId} ${caseName}`, async ({ dashboard, conf, context }) => {
        const balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
        invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
        transactionPage = new TransactionPage(dashboard, conf.suiteConf.domain);

        await test.step("Go to Balance page với link {{shop_domain}}/admin/balance -> click btn Top up", async () => {
          await balancePage.goToBalance();
          getAmountUnavailable = await balancePage.getValueUnavailableToPayout();
          await balancePage.clickOnBtnWithLabel("Top up");
        });

        await test.step("Tại section Top up amount -> select amount hoặc input amount bất kỳ tại field Other amount", async () => {
          await balancePage.valueAmountTopUp(selectAmount, amountInput);
          await expect(dashboard.locator(balancePage.xpathInputAmountTransfers)).toHaveValue(
            invoiceInfo.amount_display,
          );
          if (parseFloat(amountInput) < 5) {
            await expect(dashboard.locator(balancePage.xpathErrorMessageAutoTopup)).toContainText(textError);
          } else {
            await expect(dashboard.locator(balancePage.xpathErrorMessageAutoTopup)).toBeHidden();
          }
        });

        await test.step("Click button Confirm top up", async () => {
          await balancePage.clickBtnConfirmTopUp();
          if (parseFloat(amountInput) < 5) {
            await expect(dashboard.locator(balancePage.xpathToastDanger)).toContainText(messageError);
          } else {
            await expect(dashboard.locator(balancePage.xpathBannerSuccessWithAmount)).toContainText(
              bannerTransfersSuccess,
            );
          }
        });
        if (parseFloat(amountInput) > 5) {
          await test.step("Truy cập link {{shop_domain}}/admin/balance", async () => {
            await balancePage.goToBalance();
            await expect(
              await balancePage.verifyTopupToUnavailableToPayout(
                "Success",
                invoiceInfo.amount_display,
                getAmountUnavailable,
              ),
            ).toBe(true);
          });
          await test.step("-> CLick button View Invoices, thực hiện filter theo Content: Manual top-up", async () => {
            await balancePage.clickBtnViewTransactions();
            // Filter invoice and verify top-up at Invoice list
            await balancePage.filterWithConditionDashboard("More filters", filterConditionTransaction);
            await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTag);
            await transactionPage.clickNewestTransaction();
            //verify Transaction
            await verifyTransactionData(
              conf.suiteConf.domain,
              invoiceInfo.content,
              invoiceInfo.transactions_status,
              source,
            );
            await expect(await transactionPage.verifyAmountTransaction(invoiceInfo.amount_display)).toBe(true);
            await expect(
              await transactionPage.verifyContentCollapsed("Invoice", invoiceInfo.content, invoicePage),
            ).toBe(true);
            await balancePage.clearAllFilterDashboard("More filters");
            await balancePage.filterWithConditionDashboard("More filters", filterStatus);
            expect(await transactionPage.verifyBalanceTransaction(invoiceInfo.amount_display)).toBe(true);
          });

          await test.step("Truy cập link : {{shop_domain}}/admin/balance -> Click button View Invoices, thực hiện filter theo Content: Manual top-up -> verify Invoice", async () => {
            await balancePage.goToBalance();
            await balancePage.clickButtonViewInvoice();
            // Filter invoice and verify top-up at Invoice list
            await invoicePage.filterInvoiceWithConditions(invoiceFilter);
            await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTag);
            // verify Invoice at Invoice page
            expect(await invoicePage.verifyInvoice(invoiceInfo)).toBe(true);
          });
          await test.step("Kiểm tra Invoice detail bằng cách click text link Manual top-up via wire transfer tại Balance invoice page hoặc Source tại Balance transactions page -> kiểm tra Invoice detail", async () => {
            // Click on the newest invoice
            [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
            invoiceDetailPage = new InvoiceDetailPage(newPage, "");
            await expect(invoiceDetailPage.isDBPageDisplay("Invoice detail")).toBeTruthy();
            // Verify Invoice detail
            expect(await invoiceDetailPage.verifyInvoiceDetail(invoiceInfo)).toBe(true);
          });
        }
      });
    },
  );
});

test.describe("Manual top-up with Wire Tranfers", async () => {
  const conf = loadData(__dirname, "TOP_UP_WIRE_TRANSFER");
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      case_name: caseName,
      payment_method: paymentMethod,
      banner_transfers_success: bannerTransfersSuccess,
      data_input_info_money_transfers: dataInputInfoMoneyTransfer,
      select_amount: selectAmount,
      amount_input: amountInput,
      filter_condition: filterCondition,
      filter_tag: filterTag,
      before_invoice_info: beforeInvoiceInfo,
      status_topup_review: statusTopUpReview,
      filter_hive_balance: filterHiveBalance,
      after_invoice_info: afterInvoiceInfo,
      source: source,
      filter_status: filterStatus,
    }) => {
      test(`@${caseId} ${caseName}`, async ({ dashboard, conf, context, hiveSBase }) => {
        balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
        invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
        hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
        transactionPage = new TransactionPage(dashboard, conf.suiteConf.domain);
        await test.setTimeout(conf.suiteConf.time_out);
        await test.step(
          "Truy cập link : {{shop_domain}}/admin/balance" +
            "Tại Balance page, click button Top up" +
            "Nhập Other amount = $10" +
            "Chọn option Money transfer >> Chọn Bank Account",
          async () => {
            await balancePage.goToBalance();
            getAmountUnavailable = await balancePage.getValueUnavailableToPayout();
            await balancePage.clickOnBtnWithLabel("Top up");
            await balancePage.selectPaymentMethod(paymentMethod);
            idTopUpWireTransfer = await balancePage.getIdTopUpWireTransfer();
            await balancePage.valueAmountTopUp(selectAmount, amountInput);
            await expect(dashboard.locator(balancePage.xpathInputAmountTransfers)).toHaveValue(
              beforeInvoiceInfo.amount_display,
            );
          },
        );

        await test.step("Nhập lần lượt Account holder và Note (optional) -> Click button Confirm topup", async () => {
          await balancePage.inputInfoMoneyTransfer(dataInputInfoMoneyTransfer);
          await balancePage.clickBtnConfirmTopUp();
          await expect(dashboard.locator(balancePage.xpathBannerSuccessWithAmount)).toContainText(
            bannerTransfersSuccess,
          );
        });

        await test.step(
          "Kiểm tra hiển thị Manual topup tại Transaction:" +
            "- Truy cập link {{shop_domain}}/admin/balance -> CLick button View transactions",
          async () => {
            await balancePage.goToBalance();
            await expect(
              await balancePage.verifyTopupToUnavailableToPayout(
                beforeInvoiceInfo.status,
                beforeInvoiceInfo.amount_display,
                getAmountUnavailable,
              ),
            ).toBe(true);
            await balancePage.clickBtnViewTransactions();
            // Filter invoice and verify top-up at Invoice list
            await balancePage.filterWithConditionDashboard("More filters", filterCondition);
            await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTag);
            await transactionPage.clickNewestTransaction();
            //verify Transaction
            await verifyTransactionData(
              conf.suiteConf.domain,
              beforeInvoiceInfo.content,
              beforeInvoiceInfo.transactions_status,
              source,
            );
            await expect(await transactionPage.verifyAmountTransaction(beforeInvoiceInfo.amount_display)).toBe(true);
            await expect(
              await transactionPage.verifyContentCollapsed(
                "Invoice",
                beforeInvoiceInfo.content_transaction_collapse + idTopUpWireTransfer,
                invoicePage,
              ),
            ).toBe(true);
            await balancePage.clearAllFilterDashboard("More filters");
            expect(await transactionPage.verifyBalanceTransaction("", "Pending")).toBe(true);
          },
        );

        await test.step(
          "kiểm tra hiển thị Manual topup tại Invoice: " +
            "- Truy cập link: {{shop_domain}}/admin/balance -> CLick button View Invoice" +
            "-> filter theo store_name và invoice type",
          async () => {
            await balancePage.goToBalance();
            await balancePage.clickButtonViewInvoice();
            await balancePage.filterWithConditionDashboard("More filters", filterCondition);
            await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTag);
            expect(await invoicePage.verifyInvoice(beforeInvoiceInfo)).toBe(true);
          },
        );

        await test.step(
          "Kiểm tra Invoice detail bằng cách click text link 'Manual top-up via wire transfer'" +
            " tại Balance invoice page hoặc Source tại Balance transactions page -> kiểm tra Invoice detail",
          async () => {
            const [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
            invoiceDetailPage = new InvoiceDetailPage(newPage, "");
            await expect(newPage.locator(invoiceDetailPage.xpathHeadingInvoiceDetailPage)).toBeVisible();
            expect(
              await invoiceDetailPage.verifyInvoiceDetailWithText(beforeInvoiceInfo, "", idTopUpWireTransfer),
            ).toBe(true);
          },
        );

        await test.step(
          "Login hive thành công với account gmail beeketing" +
            " -> Truy cập link hive: {{hive_domain}}/admin/app/topuprequest/list " +
            "-> click button Filter, chọn Owner email -> input email đã nhập cho Topup -> click Filter",
          async () => {
            await hiveBalance.goToTopUpReviewPage();
            await hiveBalance.filter(filterHiveBalance.label, filterHiveBalance.value, filterHiveBalance.input_field);
            await expect(idTopUpWireTransfer).toEqual(await hiveBalance.getTopUpIdNewest());
            await expect(
              hiveBalance.verifyTopUpReviewIncludeFileAttack(dataInputInfoMoneyTransfer.is_attack_file),
            ).toBeTruthy();
          },
        );

        await test.step("tại Action, click button Approve / Refuse -> tại Alert confirm, click button OK", async () => {
          await hiveBalance.clickBtnActionTopUpReview(statusTopUpReview);
          expect(await hiveBalance.genLoc(hiveBalance.xpathAlertSuccess).isVisible());
        });

        await test.step(
          "Kiểm tra hiển thị Manual topup tại Transaction:" +
            "- Truy cập link {{shop_domain}}/admin/balance -> CLick button View transactions",
          async () => {
            await balancePage.goToBalance();
            await expect(
              await balancePage.verifyTopupToUnavailableToPayout(
                afterInvoiceInfo.status,
                afterInvoiceInfo.amount_display,
                getAmountUnavailable,
              ),
            ).toBe(true);
            await balancePage.clickBtnViewTransactions();
            // Filter invoice and verify top-up at Invoice list
            await balancePage.filterWithConditionDashboard("More filters", filterCondition);
            await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTag);
            await transactionPage.clickNewestTransaction();
            //verify Transaction
            await verifyTransactionData(
              conf.suiteConf.domain,
              afterInvoiceInfo.content,
              afterInvoiceInfo.transactions_status,
              source,
            );
            await expect(await transactionPage.verifyAmountTransaction(afterInvoiceInfo.amount_display)).toBe(true);
            await expect(
              await transactionPage.verifyContentCollapsed(
                "Invoice",
                beforeInvoiceInfo.content_transaction_collapse + idTopUpWireTransfer,
                invoicePage,
              ),
            ).toBe(true);
            await balancePage.clearAllFilterDashboard("More filters");
            if (afterInvoiceInfo.transactions_status === "Paid") {
              await balancePage.filterWithConditionDashboard("More filters", filterStatus);
            }
            expect(
              await transactionPage.verifyBalanceTransaction(
                afterInvoiceInfo.amount_display,
                afterInvoiceInfo.transactions_status,
              ),
            ).toBe(true);
          },
        );

        await test.step(
          "kiểm tra hiển thị Manual topup tại Invoice: " +
            "- Truy cập link: {{shop_domain}}/admin/balance -> CLick button View Invoice" +
            "-> filter theo store_name và invoice type",
          async () => {
            await balancePage.goToBalance();
            await balancePage.clickButtonViewInvoice();
            await balancePage.filterWithConditionDashboard("More filters", filterCondition);
            await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTag);
            expect(await invoicePage.verifyInvoice(afterInvoiceInfo)).toBe(true);
          },
        );

        await test.step(
          "Kiểm tra Invoice detail bằng cách click text link 'Manual top-up via wire transfer'" +
            " tại Balance invoice page hoặc Source tại Balance transactions page -> kiểm tra Invoice detail",
          async () => {
            [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
            invoiceDetailPage = new InvoiceDetailPage(newPage, "");
            await expect(newPage.locator(invoiceDetailPage.xpathHeadingInvoiceDetailPage)).toBeVisible();
            expect(await invoiceDetailPage.verifyInvoiceDetailWithText(afterInvoiceInfo, "", idTopUpWireTransfer)).toBe(
              true,
            );
          },
        );
      });
    },
  );
});

test.describe("Verify transaction fee for checkout", async () => {
  const conf = loadData(__dirname, "TRANS_FEE");
  test.setTimeout(conf.suiteConf.time_out);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      case_name: caseName,
      invoice_conditions: invoiceConditions,
      transaction_conditions: transactionConditions,
      filter_tag_invoice: filterTagInvoice,
      filter_tag_transaction: filterTagTransaction,
      invoice_info: invoiceInfo,
      products_checkout: productsCheckout,
      postPurchase: postPurchase,
      source: source,
    }) => {
      test(`@${caseId} ${caseName}`, async ({ dashboard, conf, authRequest, context }) => {
        checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest);
        balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
        accountSetting = new AccountSetting(dashboard, conf.suiteConf.domain);
        invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
        ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
        transactionPage = new TransactionPage(dashboard, conf.suiteConf.domain);
        await test.step("Pre-condition: thực hiện checkout thành công product / post purchase bất kỳ", async () => {
          //setting disable password storefront to checkout
          await balancePage.goto(`https://${conf.suiteConf.domain}/admin/themes`);
          await balancePage.page.waitForLoadState("networkidle");
          if (await balancePage.page.locator(balancePage.xpathBtnDisablePasswordSF).isVisible()) {
            await balancePage.page.locator(balancePage.xpathBtnDisablePasswordSF).click();
            await balancePage.page.waitForLoadState("networkidle");
          }
          await expect(balancePage.page.locator(balancePage.xpathBtnDisablePasswordSF)).toBeHidden();
          //excute: checkout product
          checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout, postPurchase });
          // get infos for current order
          orderName = checkoutInfo.order.name;
          totalPriceOrder = checkoutInfo.totals.total_price.toFixed(2);
          expect(checkoutInfo.order.financial_status).toEqual("authorized");
          //capture manual order
          await ordersPage.gotoOrderPage();
          await ordersPage.goToOrderDetailSBase(orderName);
          await ordersPage.captureOrder(totalPriceOrder.toString());
          //get transaction fee
          const transactionFeePercentage = await accountSetting.getTransactionFeeCurrentPackageByAPI(
            authRequest,
            conf.suiteConf.api,
            conf.suiteConf.shop_id,
          );
          transactionFee = ((transactionFeePercentage / 100) * totalPriceOrder).toFixed(2);
        });

        await test.step(
          "truy cập link: {{shop_domain}}/admin/balance -> CLick button View Transactions" +
            "=> kiểm tra transaction của Transaction fee được tạo",
          async () => {
            await balancePage.goToBalance();
            await balancePage.clickBtnViewTransactions();
            // Filter invoice and verify top-up at Invoice list
            await balancePage.filterWithConditionDashboard("More filters", transactionConditions);
            await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTagTransaction);
            await transactionPage.clickNewestTransaction();
            //verify Transaction
            await expect(await transactionPage.verifyAmountTransaction("-" + transactionFee)).toBe(true);
            await verifyTransactionData(
              conf.suiteConf.domain,
              invoiceInfo.content,
              invoiceInfo.transactions_status,
              source,
            );
            await expect(
              await transactionPage.verifyContentCollapsed(
                "Invoice",
                invoiceInfo.transactions_content + orderName,
                invoicePage,
              ),
            ).toBe(true);
            await balancePage.clearAllFilterDashboard("More filters");
            expect(await transactionPage.verifyBalanceTransaction("", "Pending")).toBe(true);
          },
        );

        await test.step(
          "truy cập link: {{shop_domain}}/admin/balance -> CLick button View Invoices " +
            "=> kiểm tra invoice của Transaction fee được tạo",
          async () => {
            await balancePage.goToBalance();
            await balancePage.clickButtonViewInvoice();
            await invoicePage.filterWithConditionDashboard("More filters", invoiceConditions);
            await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTagInvoice);
            //click the newest invoice to get value total transaction fee
            [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
            invoiceDetailPage = new InvoiceDetailPage(newPage, "");
            await expect(newPage.locator(invoiceDetailPage.xpathHeadingInvoiceDetailPage)).toBeVisible();
            const amountDisplay = await invoiceDetailPage.getTransactionFee();
            // verify Invoice at Invoice page
            expect(await invoicePage.verifyInvoiceTransactionFee(invoiceInfo, amountDisplay)).toBe(true);
          },
        );

        await test.step(
          "Kiểm tra Invoice detail bằng cách click text link 'Transaction fee collecting'" +
            " tại Balance invoice page hoặc Source tại Balance transactions page -> kiểm tra Invoice detail",
          async () => {
            expect(
              await invoiceDetailPage.verifyInvoiceDetailTransactionFee(invoiceInfo, orderName, transactionFee),
            ).toBe(true);
          },
        );
      });
    },
  );
});

test.describe("Verify transaction fee after refund", async () => {
  test("@SB_BAL_OLD_BL_38", async ({ dashboard, conf, authRequest, context }) => {
    test.setTimeout(conf.suiteConf.time_out);
    checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    accountSetting = new AccountSetting(dashboard, conf.suiteConf.domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    invoiceDetailPage = new InvoiceDetailPage(dashboard, conf.suiteConf.domain);
    ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
    transactionPage = new TransactionPage(dashboard, conf.suiteConf.domain);
    productsCheckout = conf.caseConf.products_checkout;
    refundInfo = conf.caseConf.refund_info;
    invoiceConditions = conf.caseConf.invoice_conditions;
    transactionConditions = conf.caseConf.transaction_conditions;
    filterTagInvoice = conf.caseConf.filter_tag_invoice;
    filterTagTransaction = conf.caseConf.filter_tag_transaction;
    invoiceInfo = conf.caseConf.invoice_info;
    source = conf.caseConf.source;

    await test.step(
      "Pre-conditions: Tạo order thành công -> Tại dashboard > order detail page, paid order thành công" +
        "-> Tại order detail page, click button Refund item -> input số lượng item muốn refund-> click btn Refund ${{value}}",
      async () => {
        //create order
        checkoutInfo = await checkoutAPI.createAnOrderWithCreditCard({ productsCheckout });
        //get order name and total price for current order
        orderName = checkoutInfo.order.name;
        orderId = checkoutInfo.order.id;
        totalPriceOrder = checkoutInfo.totals.total_price.toFixed(2);
        expect(checkoutInfo.order.financial_status).toEqual("authorized");
        //paid order
        await ordersPage.gotoOrderPage();
        await ordersPage.goToOrderDetailSBase(orderName);
        await ordersPage.captureOrder(totalPriceOrder.toString());
        //refund order
        await ordersPage.refundOrderAtOrderDetails(refundInfo);
        refundAmount = await ordersPage.getRefundAmountSBaseAtOrderDetail(orderId);
        //get transaction fee of the refund order
        const transactionFeePercentage = await accountSetting.getTransactionFeeCurrentPackageByAPI(
          authRequest,
          conf.suiteConf.api,
          conf.suiteConf.shop_id,
        );
        refundFee = ((transactionFeePercentage / 100) * refundAmount).toFixed(2);
      },
    );

    await test.step(
      "truy cập link: {{shop_domain}}/admin/balance -> CLick button View Transactions" +
        "=> kiểm tra transaction của Transaction fee được tạo",
      async () => {
        await balancePage.goToBalance();
        await balancePage.clickBtnViewTransactions();
        // Filter invoice and verify top-up at Invoice list
        await balancePage.filterWithConditionDashboard("More filters", transactionConditions);
        await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTagTransaction);
        await transactionPage.clickNewestTransaction();
        //verify Transaction
        await verifyTransactionData(
          conf.suiteConf.domain,
          invoiceInfo.content,
          invoiceInfo.transactions_status,
          source,
        );
        await expect(await transactionPage.verifyAmountTransaction(refundFee)).toBe(true);
        await expect(
          await transactionPage.verifyContentCollapsed(
            "Invoice",
            invoiceInfo.transactions_content + orderName,
            invoicePage,
          ),
        ).toBe(true);
        await balancePage.clearAllFilterDashboard("More filters");
        expect(await transactionPage.verifyBalanceTransaction("", "Pending")).toBe(true);
      },
    );

    await test.step(
      "Truy cập lại link : {{shop_domain}}/admin/balance " +
        "-> kiểm tra hiển thị Transaction fee collecting tại Invoice: CLick button View Invoice",
      async () => {
        await balancePage.goToBalance();
        await balancePage.clickButtonViewInvoice();
        await invoicePage.filterWithConditionDashboard("More filters", invoiceConditions);
        await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTagInvoice);
        //click the newest invoice to get value total transaction fee
        [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
        invoiceDetailPage = new InvoiceDetailPage(newPage, "");
        await expect(newPage.locator(invoiceDetailPage.xpathHeadingInvoiceDetailPage)).toBeVisible();
        const amountDisplay = await invoiceDetailPage.getTransactionFee();
        // verify Invoice at Invoice page
        expect(await invoicePage.verifyInvoiceTransactionFee(invoiceInfo, amountDisplay)).toBe(true);
      },
    );

    await test.step(
      "Kiểm tra Invoice detail bằng cách click text link 'Transaction fee collecting' tại" +
        " Balance invoice page hoặc Source tại Balance transactions page -> kiểm tra Invoice detail",
      async () => {
        expect(await invoiceDetailPage.verifyInvoiceDetailTransactionFee(invoiceInfo, orderName, refundFee)).toBe(true);
      },
    );
  });
});

test.describe("Negative auto top up", async () => {
  test.beforeEach(async ({ dashboard, authRequest, conf, hiveSBase }) => {
    // K run duoc tren prod, prodtest env do chua vao duoc hive
    if (process.env.ENV === "prod" || process.env.ENV === "prodtest") {
      return true;
    }
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    transactionPage = new TransactionPage(dashboard, conf.suiteConf.domain);
    await balancePage.autoTopUpByApi(authRequest, conf.suiteConf.domain);
    await hiveBalance.chargeAvailableBalanceToZero(
      conf.suiteConf.hive_domain,
      conf.suiteConf.shop_id,
      conf.caseConf.info_charge_to_zero,
    );
  });

  test("@SB_BAL_OLD_BL_11", async ({ conf, context }) => {
    test.setTimeout(conf.suiteConf.time_out);
    invoiceConditions = conf.caseConf.invoice_conditions;
    filterTagInvoice = conf.caseConf.filter_tag_invoice;
    invoiceInfo = conf.caseConf.invoice_info;
    if (process.env.ENV === "prod" || process.env.ENV === "prodtest") {
      return;
    }

    await test.step(
      "Login thành công hive với acc beeketing" +
        "-> Truy cập url: {{hive_domain}}/admin/app/shop/{{shop_id}}/charge-refund-fee" +
        "Tại Charge / Refund page -> thực hiện input data" +
        "-> Click button Charge / Refund",
      async () => {
        await hiveBalance.executeChargeOrRefundBalance(
          conf.suiteConf.hive_domain,
          conf.suiteConf.shop_id,
          conf.caseConf.info_charge,
        );
        expect(await hiveBalance.genLoc(hiveBalance.xpathAlertSuccess).isVisible());
      },
    );

    await test.step(
      "Kiểm tra hiển thị Auto topup tại Transaction:" +
        "- Truy cập link {{shop_domain}}/admin/balance -> CLick button View transactions",
      async () => {
        await balancePage.goToBalance();
        await balancePage.clickBtnViewTransactions();
        // Filter invoice and verify top-up at Invoice list
        await balancePage.filterWithConditionDashboard("More filters", invoiceConditions);
        await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTagInvoice);
        await transactionPage.clickNewestTransaction();
        //verify Transaction
        await verifyTransactionData(
          conf.suiteConf.domain,
          invoiceInfo.content,
          invoiceInfo.transactions_status,
          conf.caseConf.source,
        );
        await expect(await transactionPage.verifyAmountTransaction(invoiceInfo.amount_display)).toBe(true);
        await expect(
          await transactionPage.verifyContentCollapsed("Invoice", invoiceInfo.transactions_content, invoicePage),
        ).toBe(true);
        await balancePage.clearAllFilterDashboard("More filters");
        expect(await transactionPage.verifyBalanceTransaction(conf.caseConf.amount_charge)).toBe(true);
      },
    );

    await test.step(
      "kiểm tra hiển thị Auto topup tại Invoice" +
        "- Truy cập link : {{shop_domain}}/admin/balance -> CLick button View Invoices",
      async () => {
        await balancePage.goToBalance();
        await balancePage.clickButtonViewInvoice();
        await balancePage.filterWithConditionDashboard("More filters", invoiceConditions);
        await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTagInvoice);
        expect(await invoicePage.verifyInvoice(invoiceInfo)).toBe(true);
      },
    );

    await test.step("Kiểm tra Invoice detail bằng cách click text link 'Automatical top-up' tại Balance invoice page hoặc Source tại Balance transactions page -> kiểm tra Invoice detail", async () => {
      const [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
      invoiceDetailPage = new InvoiceDetailPage(newPage, "");
      await expect(invoiceDetailPage.isDBPageDisplay("Invoice detail")).toBeTruthy();
      expect(await invoiceDetailPage.verifyInvoiceDetail(invoiceInfo)).toBe(true);
    });
  });
});

test.describe("Verify request payout when available to payout < 50", async () => {
  test("@SB_BAL_OLD_BL_13 ", async ({ dashboard, conf }) => {
    const balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);

    await test.step(
      "-Truy cập balance page với url: {{shop_domain}}/admin/balance \n" +
        "-> Tại balance page > Section Payout -> click button Request payout\n" +
        "-> kiểm tra hiển thị",
      async () => {
        await balancePage.goToBalance();
        if ((await balancePage.getAvailableToPayout()) >= 50) {
          await balancePage.clickButtonRequestPayout();
          if ((await balancePage.getValueGeneralFoundingSource()) >= 50) {
            await expect(dashboard.locator(balancePage.xpathNamePopupRequestPayout)).toBeVisible();
            // Choose Funding Source and Payout method, then input Requested Amount
            await balancePage.requestPayout(
              conf.caseConf.source_name,
              conf.caseConf.payout_method,
              await balancePage.getValueGeneralFoundingSource(),
            );
          }
        } else {
          await balancePage.clickButtonRequestPayout();
          await expect(dashboard.locator(balancePage.xpathWarnPayoutLessMore50)).toContainText(
            conf.caseConf.warning_payout_less_more_50,
          );
        }
      },
    );
  });
});

test.describe("Verify request payout", async () => {
  const conf = loadData(__dirname, "PAYOUT");
  const timeCurrent = formatDate(new Date(), "MMMD,YYYY");
  test.setTimeout(conf.suiteConf.time_out);
  //for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      case_name: caseName,
      payout_review_info: payoutReviewInfo,
      invoice_review_info: invoiceReviewInfo,
      invoice_info: invoiceInfo,
      info_refund: infoRefund,
      info_request: infoRequest,
      payout_status_approve: payoutStatusApprove,
      reason_refuse: reasonRefuse,
      request_status_before: requestStatusBefore,
      request_status_after: requestStatusAfter,
      warn_request_more_50: warnRequestMore50,
      invoice_conditions: invoiceConditions,
      source: source,
    }) => {
      test(`@${caseId} ${caseName}`, async ({ dashboard, hiveSBase, authRequest, context, conf }) => {
        const balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
        const hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
        invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
        transactionPage = new TransactionPage(dashboard, conf.suiteConf.domain);
        if (process.env.ENV === "prod" || process.env.ENV === "prodtest") {
          return;
        }
        await test.step(
          "- Truy cập balance page với url: {{shop_domain}}/admin/balance" +
            "-> click button Request payout" +
            "-> Tại popup Request payout -> chọn Funding Source, Payout method -> Input Requested Amount" +
            "=> click button Send request",
          async () => {
            //check available to payout
            //if available to payout < 50 -> go to hive and refund
            await balancePage.goToBalance();
            if ((await balancePage.getAvailableToPayout()) < 50) {
              await hiveBalance.executeChargeOrRefundBalance(
                conf.suiteConf.hive_domain,
                conf.suiteConf.shop_id,
                infoRefund,
              );
            }
            await dashboard.reload();
            await balancePage.clickButtonRequestPayout();
            //check value general founding source
            // if value < 50 -> go to hive and refund
            if (
              (await balancePage.getValueGeneralFoundingSource()) < 50 ||
              (await balancePage.getValueGeneralFoundingSource()) < infoRequest.requested_amount
            ) {
              await hiveBalance.executeChargeOrRefundBalance(
                conf.suiteConf.hive_domain,
                conf.suiteConf.shop_id,
                infoRefund,
              );
              await dashboard.reload();
              await balancePage.clickButtonRequestPayout();
            }
            await expect(dashboard.locator(balancePage.xpathNamePopupRequestPayout)).toBeVisible();
            availableToPayoutOld = await balancePage.getAvailableToPayout();
            //excute request data
            await balancePage.requestPayout(
              infoRequest.source_name,
              infoRequest.payout_method,
              infoRequest.requested_amount,
            );
          },
        );

        if (parseFloat(infoRequest.requested_amount) < 50) {
          await expect(dashboard.locator(balancePage.xpathWarnRequestMore50)).toContainText(warnRequestMore50);
          await expect(dashboard.locator(balancePage.xpathBtnSendRequest)).toBeDisabled();
        } else {
          await dashboard.reload();
          expect(
            (await balancePage.getAvailableToPayout()) === availableToPayoutOld - infoRequest.requested_amount,
          ).toBeTruthy();

          await test.step("click button View request", async () => {
            await balancePage.clickButtonViewRequest();
            await dashboard.reload();
            expect(
              await balancePage.getPayoutInfoDashboardByApi(authRequest, conf.suiteConf.domain, payoutReviewInfo),
            ).toEqual(payoutReviewInfo);
          });

          await test.step(
            "- Truy cập link {{shop_domain}}/admin/balance -> CLick button View transactions" +
              "-> verify Transaction payout",
            async () => {
              await balancePage.goToBalance();
              await balancePage.clickBtnViewTransactions();
              // Filter invoice and verify top-up at Invoice list
              await balancePage.filterWithConditionDashboard("More filters", invoiceConditions);
              await transactionPage.clickNewestTransaction();
              //verify Transaction
              await verifyTransactionData(
                conf.suiteConf.domain,
                invoiceReviewInfo.content,
                invoiceReviewInfo.transactions_status,
                source,
              );
              await expect(await transactionPage.verifyAmountTransaction(invoiceReviewInfo.amount_display)).toBe(true);
              await expect(
                await transactionPage.verifyContentCollapsed(
                  "Invoice",
                  invoiceReviewInfo.transactions_content + timeCurrent,
                  invoicePage,
                ),
              ).toBe(true);
              await balancePage.clearAllFilterDashboard("More filters");
              expect(await transactionPage.verifyBalanceTransaction(invoiceReviewInfo.amount_display)).toBe(true);
            },
          );

          await test.step(
            "kiểm tra hiển thị Request payout tại Invoice:" +
              "- Truy cập link : {{shop_domain}}/admin/balance -> CLick button View Invoices",
            async () => {
              await balancePage.goToBalance();
              await balancePage.clickButtonViewInvoice();
              await invoicePage.filterWithConditionDashboard("More filters", invoiceConditions);
              await dashboard.waitForLoadState("load");
              expect(await invoicePage.verifyInvoice(invoiceReviewInfo)).toBe(true);
            },
          );

          await test.step(
            "Kiểm tra Invoice detail bằng cách click text link 'Pay out' tại Balance invoice page hoặc Source tại Balance transactions page" +
              "-> kiểm tra Invoice detail",
            async () => {
              [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
              invoiceDetailPage = new InvoiceDetailPage(newPage, "");
              await newPage.waitForSelector(invoiceDetailPage.xpathHeadingInvoiceDetailPage);
              await expect(newPage.locator(invoiceDetailPage.xpathTextStatusPayoutRequest)).toContainText(
                requestStatusBefore,
              );
              expect(
                await invoiceDetailPage.verifyInvoiceDetailWithText(invoiceReviewInfo, timeCurrent, timeCurrent),
              ).toBe(true);
            },
          );

          await test.step(
            "Truy cập hive: https://${hiveDomain}/admin/app/balancepayoutrequestv2/${payOutId}/refuse -> click btn Yes, Refuse" +
              "hoặc https://${hiveDomain}/admin/app/balancepayoutrequestv2/${payOutId}/approve -> btn Yes, Approve",
            async () => {
              balancePage.goToBalance();
              availableToPayoutOld = await balancePage.getAvailableToPayout();
              const payOutInfo = await balancePage.getPayOutIdByApi(authRequest, conf.suiteConf.domain);
              const payOutId = payOutInfo.id;
              if (payoutStatusApprove) {
                await hiveBalance.approvePayoutReview(conf.suiteConf.hive_domain, payOutId, payoutReviewInfo.amount);
              } else {
                await hiveBalance.refusePayoutReview(
                  conf.suiteConf.hive_domain,
                  payOutId,
                  payoutReviewInfo.amount,
                  reasonRefuse,
                );
              }
              await balancePage.goToBalance();
              if (payoutStatusApprove) {
                expect(availableToPayoutOld === (await balancePage.getAvailableToPayout())).toBeTruthy();
              } else {
                expect(
                  (await balancePage.getAvailableToPayout()) === availableToPayoutOld + infoRequest.requested_amount,
                ).toBeTruthy();
              }
            },
          );

          await test.step(
            "- Truy cập link : {{shop_domain}}/admin/balance -> CLick button View Invoices" +
              "-> Verify invoice payout",
            async () => {
              await balancePage.goToBalance();
              await balancePage.clickButtonViewInvoice();
              await invoicePage.filterWithConditionDashboard("More filters", invoiceConditions);
              await dashboard.waitForLoadState("load");
              expect(await invoicePage.verifyInvoice(invoiceInfo)).toBe(true);
            },
          );

          await test.step(
            "Kiểm tra Invoice detail bằng cách click text link 'Pay out' tại Balance invoice page hoặc Source tại Balance transactions page" +
              "-> kiểm tra Invoice detail page",
            async () => {
              [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
              invoiceDetailPage = new InvoiceDetailPage(newPage, "");
              await newPage.waitForSelector(invoiceDetailPage.xpathHeadingInvoiceDetailPage);
              if (payoutStatusApprove) {
                await expect(newPage.locator(invoiceDetailPage.xpathTextStatusPayoutRequest)).toContainText(
                  requestStatusAfter,
                );
              } else {
                await expect(newPage.locator(invoiceDetailPage.xpathTextStatusPayoutRequest)).toContainText(
                  requestStatusAfter,
                );
              }
              expect(await invoiceDetailPage.verifyInvoiceDetailWithText(invoiceInfo, timeCurrent, timeCurrent)).toBe(
                true,
              );
            },
          );
        }
      });
    },
  );
});

test.describe("Verify filter for invoice and transaction", async () => {
  test("@SB_BAL_OLD_BL_16", async ({ dashboard, conf }) => {
    test.setTimeout(300 * 1000);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    transactionPage = new TransactionPage(dashboard, conf.suiteConf.domain);
    dateInvoiceFilter = conf.caseConf.date_invoice_filter;
    filterTagInvoice = conf.caseConf.filter_tag_invoice;
    invoiceInfo = conf.caseConf.invoice_info;
    dateTransactionFilter = conf.caseConf.date_transaction_filter;
    filterTagTransaction = conf.caseConf.filter_tag_transaction;
    transactionInfo = conf.caseConf.transaction_info;
    filterConditionInvoice = conf.caseConf.filter_condition_invoice;
    filterConditionTransaction = conf.caseConf.filter_condition_transaction;

    await test.step(
      "- Truy cập link : {{shop_domain}}/admin/balance -> click button View Invoices\n" +
        "- tại Invoices list page -> click button More filter -> thực hiện filter theo điều kiện bất kỳ",
      async () => {
        await invoicePage.filterInvoiceWithDate(dateInvoiceFilter, filterConditionInvoice);
        await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTagInvoice);
        expect(await invoicePage.verifyInvoiceFilterWithDate(invoiceInfo)).toBe(true);
      },
    );

    await test.step(
      "- Truy cập lại link : {{shop_domain}}/admin/balance -> click button View Transactions\n" +
        "- tại Invoices list page -> click button More filter -> thực hiện filter theo điều kiện bất kỳ:",
      async () => {
        await transactionPage.filterTransactionWithDate(dateTransactionFilter, filterConditionTransaction);
        await expect(transactionPage.genLoc(transactionPage.xpathFilterTag)).toContainText(filterTagTransaction);
        await transactionPage.clickNewestTransaction();
        expect(await transactionPage.verifyTransactionFilterWithAllDate(invoicePage, transactionInfo)).toBe(true);
      },
    );
  });
});

test.describe("Auto top-up with Credit card = Available ", async () => {
  test.beforeEach(async ({ dashboard, conf, hiveSBase, authRequest }) => {
    // K run duoc tren prod, prodtest env do chua vao duoc hive
    if (process.env.ENV === "prod" || process.env.ENV === "prodtest") {
      return true;
    }
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    transactionPage = new TransactionPage(dashboard, conf.suiteConf.domain);
    await balancePage.autoTopUpByApi(authRequest, conf.suiteConf.domain);
    await hiveBalance.chargeAvailableBalanceToZero(
      conf.suiteConf.hive_domain,
      conf.suiteConf.shop_id,
      conf.suiteConf.reason_charge_to_zero,
    );
  });

  const caseId = "DATA_DRIVEN";
  const conf = loadData(__dirname, caseId);
  test.setTimeout(conf.suiteConf.time_out);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_name: caseName,
      case_id: caseId,
      amount_input: amountInput,
      value_balance_below: valueBalanceBelow,
      invoice_filter: invoiceFilter,
      filter_tag: filterTag,
      invoice_info: invoiceInfo,
      filter_condition: filterCondition,
      source: source,
      filter_status: filterStatus,
    }) => {
      test(`@${caseId} ${caseName}`, async ({ dashboard, context, conf }) => {
        if (process.env.ENV === "prod" || process.env.ENV === "prodtest") {
          return;
        }
        await test.step(
          "Truy cập link : {{shop_domain}}/admin/balance\n" +
            "Balance page -> Tại section Top-ups -> click checkbox Enable auto recharge = checked\n" +
            "- Input lần lượt giá trị vào 2 field:\n" +
            "+ Add $ {{value}} to your credit account\n" +
            "+ When my balance falls below {{value}}\n" +
            "- Click button Save changes",
          async () => {
            await balancePage.goToBalance();
            await balancePage.enableAutoTopUp(amountInput, valueBalanceBelow);
            if (amountInput < 10) {
              expect(await dashboard.innerText(balancePage.xpathErrorMessageAutoTopup)).toContain(
                "Please enter a valid amount",
              );
            } else {
              await expect(await dashboard.locator(balancePage.xpathToastSuccess)).toBeVisible();
            }
          },
        );

        if (amountInput > 10) {
          await test.step(
            "kiểm tra hiển thị Transaction của Auto topup thành công\n" +
              "Truy cập lại link : {{shop_domain}}/admin/balance, click button View transactions",
            async () => {
              await balancePage.goToBalance();
              await balancePage.clickBtnViewTransactions();
              // Filter invoice and verify top-up at Invoice list
              await balancePage.filterWithConditionDashboard("More filters", filterCondition);
              await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTag);
              await transactionPage.clickNewestTransaction();
              do {
                dashboard.reload();
                await transactionPage.clickNewestTransaction();
              } while (
                (await transactionPage.verifyContentCollapsed(
                  "Invoice",
                  invoiceInfo.transactions_content,
                  invoicePage,
                )) === false
              );
              //verify Transaction
              await verifyTransactionData(
                conf.suiteConf.domain,
                invoiceInfo.content,
                invoiceInfo.transactions_status,
                source,
              );
              await expect(await transactionPage.verifyAmountTransaction(invoiceInfo.amount_display)).toBe(true);
              await balancePage.clearAllFilterDashboard("More filters");
              if (invoiceInfo.transactions_status === "Paid") {
                await balancePage.filterWithConditionDashboard("More filters", filterStatus);
              }
              expect(
                await transactionPage.verifyBalanceTransaction(
                  invoiceInfo.amount_display,
                  invoiceInfo.transactions_status,
                ),
              ).toBe(true);
            },
          );

          await test.step(
            "kiểm tra hiển thị Invoice của Auto topup thành công\n" +
              "Truy cập lại link : {{shop_domain}}/admin/balance, click button View invoices",
            async () => {
              await balancePage.goToBalance();
              await balancePage.clickButtonViewInvoice();
              await invoicePage.filterInvoiceWithConditions(invoiceFilter);
              await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTag);
              await invoicePage.reloadForStatusUpdate(conf.caseConf.card_status);
              expect(await invoicePage.verifyInvoice(invoiceInfo)).toBe(true);
            },
          );

          await test.step(
            "Kiểm tra Invoice detail bằng cách click text link Automatical top-up " +
              "tại Balance invoice page hoặc Source tại Balance transactions page -> kiểm tra Invoice detail",
            async () => {
              const [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
              invoiceDetailPage = new InvoiceDetailPage(newPage, "");
              await expect(invoiceDetailPage.isDBPageDisplay("Invoice detail")).toBeTruthy();
              expect(await invoiceDetailPage.verifyInvoiceDetail(invoiceInfo)).toBe(true);
            },
          );
        }
      });
    },
  );
  test.afterEach(async ({ conf, authRequest }) => {
    // K run duoc tren prod, prodtest env do chua vao duoc hive
    if (process.env.ENV === "prod" || process.env.ENV === "prodtest") {
      return true;
    }
    await balancePage.autoTopUpByApi(authRequest, conf.suiteConf.domain);
  });
});

test.describe("Auto top up when Current available balance isn't enough money to charge sub", async () => {
  test.beforeEach(async ({ dashboard, conf, hiveSBase }) => {
    if (process.env.ENV === "prod" || process.env.ENV === "prodtest") {
      return true;
    }
    hiveBalance = new HiveBalance(hiveSBase, conf.suiteConf.hive_domain);
    confirmPlanPage = new ConfirmPlanPage(dashboard, conf.suiteConf.domain);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    invoiceDetailPage = new InvoiceDetailPage(dashboard, conf.suiteConf.domain);
    transactionPage = new TransactionPage(dashboard, conf.suiteConf.domain);
    invoiceChargeInfo = conf.caseConf.invoice_charge_info;
    invoiceChargeFilter = conf.caseConf.invoice_charge_filter;
    filterChargeTag = conf.caseConf.filter_charge_tag;
    invoiceTopUpInfo = conf.caseConf.invoice_topup_info;
    invoiceTopUpFilter = conf.caseConf.invoice_topup_filter;
    filterTopUpTag = conf.caseConf.filter_topup_tag;
    source = conf.caseConf.source;

    //update current plan is ShopBase Fulfillment
    await confirmPlanPage.choosePlanShopBaseFulfillment();

    //charge Current available balance to Zero
    await hiveBalance.chargeAvailableBalanceToZero(
      conf.suiteConf.hive_domain,
      conf.suiteConf.shop_id,
      conf.suiteConf.reason_charge_to_zero,
    );
  });

  test("@SB_BAL_OLD_BL_29", async ({ conf, context }) => {
    if (process.env.ENV === "prod" || process.env.ENV === "prodtest") {
      return;
    }
    test.setTimeout(conf.suiteConf.time_out);
    await test.step(
      "Truy cập thành công Choose plan page với url: {{domain_store}}/admin/pricing -> click button 'Choose this plan' tại plan Basic base (19$) " +
        "-> click button 'Confirm changes' -> kiểm tra hiển thị",
      async () => {
        await confirmPlanPage.chooseTimePlanPackage(conf.caseConf.plan, conf.caseConf.time_plan);
        await confirmPlanPage.clickConfirmPlan();
        expect(await confirmPlanPage.page.locator(confirmPlanPage.getXpathConfirmPlanSucess));
      },
    );

    await test.step(
      "kiểm tra hiển thị transaction của subcription" +
        "Truy cập lại link : {{shop_domain}}/admin/balance, click button View transactions",
      async () => {
        await balancePage.goToBalance();
        await balancePage.clickBtnViewTransactions();
        //filter Invoice charge subcription
        await invoicePage.filterInvoiceWithConditions(invoiceChargeFilter);
        await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterChargeTag);
        await transactionPage.clickNewestTransaction();
        //verify Transaction
        await verifyTransactionData(
          conf.suiteConf.domain,
          invoiceChargeInfo.content,
          invoiceChargeInfo.transactions_status,
          source,
        );
        await expect(await transactionPage.verifyAmountTransaction(invoiceChargeInfo.amount_display)).toBe(true);
        await expect(
          await transactionPage.verifyContentCollapsed("Invoice", invoiceChargeInfo.transactions_content, invoicePage),
        ).toBe(true);
      },
    );

    await test.step("Truy cập lại link : {{shop_domain}}/admin/balance -> kiểm tra hiển thị Subscription fee collecting tại Invoice: CLick button View Invoices", async () => {
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      //filter Invoice charge subcription
      await invoicePage.filterInvoiceWithConditions(invoiceChargeFilter);
      await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterChargeTag);
      expect(await invoicePage.verifyInvoice(invoiceChargeInfo)).toBe(true);
    });

    await test.step(
      "Kiểm tra Invoice detail bằng cách click text link 'Subscription fee collecting' tại Balance invoice page hoặc Source tại Balance transactions page" +
        " -> kiểm tra Invoice detail",
      async () => {
        const [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
        invoiceDetailPage = new InvoiceDetailPage(newPage, "");
        await expect(newPage.locator(invoiceDetailPage.xpathHeadingInvoiceDetailPage)).toBeVisible();
        expect(await invoiceDetailPage.verifyInvoiceDetailWithText(invoiceChargeInfo, dateSub(), dateSub())).toBe(true);
      },
    );

    await test.step(
      "kiểm tra hiển thị transaction của auto topup" +
        "Truy cập lại link : {{shop_domain}}/admin/balance, click button View transactions",
      async () => {
        await balancePage.goToBalance();
        await balancePage.clickBtnViewTransactions();
        //filter Invoice charge subcription
        await invoicePage.filterInvoiceWithConditions(invoiceTopUpFilter);
        await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTopUpTag);
        await transactionPage.clickNewestTransaction();
        //verify Transaction
        await verifyTransactionData(
          conf.suiteConf.domain,
          invoiceTopUpInfo.content,
          invoiceTopUpInfo.transactions_status,
          source,
        );
        await expect(await transactionPage.verifyAmountTransaction(invoiceTopUpInfo.amount_display)).toBe(true);
        await expect(
          await transactionPage.verifyContentCollapsed("Invoice", invoiceTopUpInfo.transactions_content, invoicePage),
        ).toBe(true);
        await balancePage.clearAllFilterDashboard("More filters");
        expect(await transactionPage.verifyBalanceTransaction(invoiceChargeInfo.amount_display)).toBe(true);
      },
    );

    await test.step("Truy cập lại link : {{shop_domain}}/admin/balance -> kiểm tra hiển thị Auto topup cho Charge sub tại Invoice: CLick button View Invoices", async () => {
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      //filter Invoice auto top up
      await invoicePage.filterInvoiceWithConditions(invoiceTopUpFilter);
      await expect(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(filterTopUpTag);
      expect(await invoicePage.verifyInvoice(invoiceTopUpInfo)).toBe(true);
    });

    await test.step(
      "Kiểm tra Invoice detail bằng cách click text link 'Automatical top-up' tại Balance invoice page hoặc Source tại Balance transactions page" +
        " -> kiểm tra Invoice detail",
      async () => {
        const [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
        invoiceDetailPage = new InvoiceDetailPage(newPage, "");
        await expect(newPage.locator(invoiceDetailPage.xpathHeadingInvoiceDetailPage)).toBeVisible();
        expect(await invoiceDetailPage.verifyInvoiceDetailWithText(invoiceTopUpInfo, dateSub(), dateSub())).toBe(true);
      },
    );

    //reset setting: disable password storefront after choose the package isn't fulfillment
    await balancePage.goto(`https://${conf.suiteConf.domain}/admin/themes`);
    await balancePage.page.waitForLoadState("networkidle");
    if (await balancePage.page.locator(balancePage.xpathBtnDisablePasswordSF).isVisible()) {
      await balancePage.page.locator(balancePage.xpathBtnDisablePasswordSF).click();
      await balancePage.page.waitForLoadState("networkidle");
    }
    await expect(balancePage.page.locator(balancePage.xpathBtnDisablePasswordSF)).toBeHidden();
  });
});
