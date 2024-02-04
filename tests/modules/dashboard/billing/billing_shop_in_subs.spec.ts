import { expect, test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { BillingPage } from "@pages/dashboard/billing";
import { addDays, addMinutes, formatDate, getUnixTime } from "@utils/datetime";
import { InvoicePage } from "@pages/dashboard/invoice";
import { InvoiceDetailPage } from "@pages/dashboard/invoice_detail";
import { BalancePage } from "@pages/dashboard/balance";

let domain: string;

let endFreeTrial;
let subscriptionExpired;
// let endFreeTrialAddDays;

let subscriptionExpiredDate;
let subscriptionExpiredDateUTC;

let periodStart;
let periodEnd;
// let isToday: boolean;

// let extendDay: string;

let invoiceContent: string;
let invoiceStatus: string;
let invoiceType: string;
let invoiceDetail: string;

let transactionContent: string;
let transactionStatus: string;
let transactionType: string;

test.describe("Billing Full Flow", () => {
  test.beforeEach(async ({ api, conf }) => {
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    test.setTimeout(conf.suiteConf.timeout);
    await test.step("Pre-condition - update shop status", async () => {
      //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
      if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
        return;
      }
      const data = conf.caseConf.data;

      if (data.request.data.end_free_trial_at != null || data.request.data.end_free_trial_at != undefined) {
        // endFreeTrialAddDays = data.request.data.end_free_trial_at;
        if (
          data.request.data.end_free_trial_at_minute != null ||
          data.request.data.end_free_trial_at_minute != undefined
        ) {
          endFreeTrial = getUnixTime(addMinutes(data.request.data.end_free_trial_at_minute)) / 1000;
          subscriptionExpired = getUnixTime(addMinutes(data.request.data.subscription_expired_at_minute)) / 1000;
          data.request.data.end_free_trial_at = endFreeTrial;
          data.request.data.subscription_expired_at = subscriptionExpired;
          // isToday = true;
        } else {
          endFreeTrial = getUnixTime(addDays(data.request.data.end_free_trial_at)) / 1000;
          subscriptionExpired = getUnixTime(addDays(data.request.data.subscription_expired_at)) / 1000;
          data.request.data.end_free_trial_at = endFreeTrial;
          data.request.data.subscription_expired_at = subscriptionExpired;
          // isToday = false;
        }
      }

      const response = await api.request(data);
      expect(response.ok).toBeTruthy();

      subscriptionExpiredDate = new Date(subscriptionExpired * 1000);
      subscriptionExpiredDateUTC = new Date(
        subscriptionExpiredDate.getTime() + subscriptionExpiredDate.getTimezoneOffset() * 60000,
      );
      periodStart = formatDate(subscriptionExpiredDateUTC, "MMM DD, YYYY");
      periodEnd = formatDate(addDays(30, subscriptionExpiredDateUTC), "MMM DD, YYYY");
    });
  });

  test("Kiểm tra Shop Khi retry charge subscription thành công - @SB_BAL_BILL_BFL_470", async ({
    dashboard,
    conf,
    context,
    api,
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = loadData(__dirname, "SB_BAL_BILL_BFL_470");
    const billingPage = new BillingPage(dashboard, conf.caseConf.domain);
    const invoicePage = new InvoicePage(dashboard, conf.caseConf.domain);
    //tren prod/prodlive k co quyen vao hive de charge + k su dung duoc tool
    if (process.env.ENV === "prodtest" || process.env.ENV === "prod") {
      return;
    }
    await test.step("Update subscription to charge", async () => {
      const data = conf.caseConf.data_update;
      if (data.request.data.end_free_trial_at != null || data.request.data.end_free_trial_at != undefined) {
        // endFreeTrialAddDays = data.request.data.end_free_trial_at;
        endFreeTrial = getUnixTime(addDays(data.request.data.end_free_trial_at)) / 1000;
        subscriptionExpired = getUnixTime(addDays(data.request.data.subscription_expired_at)) / 1000;
        data.request.data.end_free_trial_at = endFreeTrial;
        data.request.data.subscription_expired_at = subscriptionExpired;
      }
      const response = await api.request(data);
      expect(response.status).toEqual(conf.caseConf.data.response.status);

      subscriptionExpiredDate = new Date(subscriptionExpired * 1000);
      subscriptionExpiredDateUTC = new Date(
        subscriptionExpiredDate.getTime() + subscriptionExpiredDate.getTimezoneOffset() * 60000,
      );
    });

    await test.step("Verify thông tin của Bill vừa được tạo sau khi Confirm plan thành công", async () => {
      await dashboard.goto(`https://${conf.caseConf.domain}/admin/settings/billing`);
      await expect(dashboard.locator("//h2")).toHaveText("Billing");
      await billingPage.waitForBillingTable();

      expect(await billingPage.getDataByColumnLabel("Type", 1)).toEqual("Subscription fee");
      expect(await billingPage.getDataByColumnLabel("Name", 1)).toEqual(`${periodStart} - ${periodEnd}`);
      expect(await billingPage.getDataByColumnLabel("Amount", 1)).toEqual(conf.caseConf.price);

      const actualDate = await billingPage.getDataByColumnLabel("Created", 1);
      await expect(actualDate.includes("Just now") || actualDate.includes("minute") || actualDate.includes("minutes"))
        .toBeTruthy;
      expect(await billingPage.getDataByColumnLabel("Status", 1)).toContain("Paid");
    });

    await test.step(`Navigate đến trang Balance => Invoices`, async () => {
      await dashboard.goto(`https://${conf.caseConf.domain}/admin/balance/history`);
      await expect(dashboard.locator("//h1")).toHaveText("Invoices");
    });

    await test.step(`Filter invoice và domain`, async () => {
      domain = conf.caseConf.domain;
      const size = conf.caseConf.invoices.length;

      for (let i = 0; i < size; i++) {
        invoiceStatus = conf.caseConf.invoices[i].status;
        invoiceType = conf.caseConf.invoices[i].type;
        invoiceContent = conf.caseConf.invoices[i].content;
        invoiceDetail = conf.caseConf.invoices[i].detail;

        await invoicePage.clickOnBtnWithLabel("More filters");
        await invoicePage.selectFilterDomain(domain);

        //tạm để do chưa fix lỗi duplicate option
        await invoicePage.selectFilterInvoiceContentByValue("subscription_renew");
        await invoicePage.clickOnBtnWithLabel("Done");
        await dashboard.waitForLoadState("networkidle");

        await expect(invoicePage.genLoc("//table")).toBeVisible();
        await expect(
          invoicePage.genLoc("//div[contains(@class,'justify-content-around')]//span[@class='s-tag']"),
        ).toContainText(invoiceContent);

        const domainActual = await invoicePage.getDataByColumnLabel("Shop Domain", 1);
        expect(domainActual).toEqual(domain);

        const contentActual = await invoicePage.getDataByColumnLabel("Content", 1);
        expect(contentActual).toEqual(invoiceContent);

        let invoiceAmount: string;
        if (invoiceType === "OUT") {
          invoiceAmount = "-" + conf.caseConf.price;
        } else {
          invoiceAmount = conf.caseConf.price;
        }
        const amountActual = await invoicePage.getDataByColumnLabel("Amount", 1);
        expect(amountActual).toEqual(invoiceAmount);

        const statusActual = await invoicePage.getDataByColumnLabel("Status", 1);
        expect(statusActual).toEqual(invoiceStatus);

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
      }
    });

    let invoiceDetailPage: InvoiceDetailPage;
    await test.step(`Click vào invoice mới nhất`, async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator("(//table//tbody//tr)[1]").click(),
      ]);

      invoiceDetailPage = new InvoiceDetailPage(newPage, domain);
      await newPage.waitForLoadState("networkidle");
      await expect(newPage.locator("//h2")).toHaveText("Invoice detail");
    });

    await test.step(`Verify thông tin của Invoice`, async () => {
      const sizeInvoices = conf.caseConf.invoices.length;

      for (let i = 0; i < sizeInvoices; i++) {
        invoiceStatus = conf.caseConf.invoices[i].status;
        invoiceType = conf.caseConf.invoices[i].type;
        invoiceContent = conf.caseConf.invoices[i].content;
        invoiceDetail = conf.caseConf.invoices[i].detail;

        const shopName = domain.split(".")[0];
        const shopNameActual = await invoiceDetailPage.getDataByRowLabel("Shop");
        expect(shopName).toEqual(shopNameActual);

        const contentActual = await invoiceDetailPage.getDataByRowLabel("Content");
        expect(invoiceContent).toEqual(contentActual);

        periodStart = formatDate(subscriptionExpiredDateUTC, "MMM D, YYYY");
        periodEnd = formatDate(addDays(30, subscriptionExpiredDateUTC), "MMM D, YYYY");

        const detailActual = await invoiceDetailPage.getDataByRowLabel("Detail");
        expect(invoiceDetail.replace("{period_start}", periodStart).replace("{period_end}", periodEnd)).toEqual(
          detailActual.replaceAll("  ", " "),
        );

        const typeActual = await invoiceDetailPage.getDataByRowLabel("Type");
        expect(invoiceType).toEqual(typeActual);

        let invoiceAmount: string;
        if (invoiceType === "OUT") {
          invoiceAmount = "-" + conf.caseConf.price;
        } else {
          invoiceAmount = conf.caseConf.price;
        }
        const amountActual = await invoiceDetailPage.getDataByRowLabel("Amount");
        expect(invoiceAmount).toEqual(amountActual);

        const createdDateActual = await invoiceDetailPage.getDataByRowLabel("Created date");
        expect("Today").toEqual(createdDateActual);

        const sizeTransaction = conf.caseConf.invoices[i].transactions.length;

        for (let j = 0; i < sizeTransaction; i++) {
          transactionType = conf.caseConf.invoices[i].transactions[j].type;
          transactionContent = conf.caseConf.invoices[i].transactions[j].content;
          transactionStatus = conf.caseConf.invoices[i].transactions[j].status;

          const transactionTypeActual = await invoiceDetailPage.getDataByColumnLabel("Type", 1);
          expect(transactionType).toEqual(transactionTypeActual);

          const transactionContentActual = await invoiceDetailPage.getDataByColumnLabel("Content", 1);
          expect(transactionContent.replace("{period_start}", periodStart).replace("{period_end}", periodEnd)).toEqual(
            transactionContentActual.replaceAll("  ", " "),
          );

          let transactionAmount: string;
          if (invoiceType === "OUT") {
            transactionAmount = "-" + conf.caseConf.price;
          } else {
            transactionAmount = conf.caseConf.price;
          }
          const transactionAmountActual = await invoiceDetailPage.getDataByRowLabel("Amount");
          expect(transactionAmount).toEqual(transactionAmountActual);

          const transactionStatusActual = await invoiceDetailPage.getDataByColumnLabel("Status", 1);
          expect(transactionStatus).toEqual(transactionStatusActual);

          const transactionDateActual = await invoiceDetailPage.getDataByColumnLabel("Date", 1);
          await expect(
            transactionDateActual.includes("Just now") ||
              transactionDateActual.includes("minute") ||
              transactionDateActual.includes("minutes"),
          ).toBeTruthy();
        }
      }
    });
  });

  test("Verify Invoice charge subscription - @SB_BAL_BILL_BFL_473", async ({ dashboard, conf, context, api }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = loadData(__dirname, "SB_BAL_BILL_BFL_473");
    const invoicePage = new InvoicePage(dashboard, conf.caseConf.domain);
    const balancePage = new BalancePage(dashboard, conf.caseConf.domain);

    await test.step("Update subscription to charge", async () => {
      const data = conf.caseConf.data_update;
      if (data.request.data.end_free_trial_at != null || data.request.data.end_free_trial_at != undefined) {
        // endFreeTrialAddDays = data.request.data.end_free_trial_at;
        endFreeTrial = getUnixTime(addDays(data.request.data.end_free_trial_at)) / 1000;
        subscriptionExpired = getUnixTime(addDays(data.request.data.subscription_expired_at)) / 1000;
        data.request.data.end_free_trial_at = endFreeTrial;
        data.request.data.subscription_expired_at = subscriptionExpired;
      }
      const response = await api.request(data);
      expect(response.status).toEqual(conf.caseConf.data.response.status);

      subscriptionExpiredDate = new Date(subscriptionExpired * 1000);
      subscriptionExpiredDateUTC = new Date(
        subscriptionExpiredDate.getTime() + subscriptionExpiredDate.getTimezoneOffset() * 60000,
      );
    });

    // eslint-disable-next-line max-len
    await test.step(`Login vào Dash board của shop bất kỳ cùng user đang active, navigate Balance page => Invoice page`, async () => {
      await balancePage.goToBalance();
      await balancePage.clickOnBtnWithLabel("View invoices");
      await expect(dashboard.locator("//h1")).toHaveText("Invoices");
    });

    await test.step(`Filter invoice và domain`, async () => {
      domain = conf.caseConf.domain_data;
      const size = conf.caseConf.invoices.length;

      for (let i = 0; i < size; i++) {
        invoiceStatus = conf.caseConf.invoices[i].status;
        invoiceType = conf.caseConf.invoices[i].type;
        invoiceContent = conf.caseConf.invoices[i].content;
        invoiceDetail = conf.caseConf.invoices[i].detail;

        await invoicePage.clickOnBtnWithLabel("More filters");
        await invoicePage.selectFilterDomain(domain);

        //tạm để do chưa fix lỗi duplicate option
        await invoicePage.selectFilterInvoiceContentByValue("subscription_renew");
        await invoicePage.clickOnBtnWithLabel("Done");
        await dashboard.waitForLoadState("networkidle");

        await expect(invoicePage.genLoc("//table")).toBeVisible();
        await expect(
          invoicePage.genLoc("//div[contains(@class,'justify-content-around')]//span[@class='s-tag']"),
        ).toContainText(invoiceContent);
        //
        const domainActual = await invoicePage.getDataByColumnLabel("Shop Domain", 1);
        expect(domainActual).toEqual(domain);

        const contentActual = await invoicePage.getDataByColumnLabel("Content", 1);
        expect(contentActual).toEqual(invoiceContent);

        let invoiceAmount: string;
        if (invoiceType === "OUT") {
          invoiceAmount = "-" + conf.caseConf.price;
        } else {
          invoiceAmount = conf.caseConf.price;
        }
        const amountActual = await invoicePage.getDataByColumnLabel("Amount", 1);
        expect(amountActual).toEqual(invoiceAmount);

        const statusActual = await invoicePage.getDataByColumnLabel("Status", 1);
        expect(statusActual).toEqual(invoiceStatus);

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
      }
    });

    let invoiceDetailPage: InvoiceDetailPage;
    await test.step(`Click vào invoice mới nhất`, async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator("(//table//tbody//tr)[1]").click(),
      ]);

      invoiceDetailPage = new InvoiceDetailPage(newPage, domain);
      await newPage.waitForLoadState("networkidle");
      await expect(newPage.locator("//h2")).toHaveText("Invoice detail");
    });

    await test.step(`Kiểm tra trang Invoice detail`, async () => {
      const sizeInvoices = conf.caseConf.invoices.length;

      for (let i = 0; i < sizeInvoices; i++) {
        invoiceStatus = conf.caseConf.invoices[i].status;
        invoiceType = conf.caseConf.invoices[i].type;
        invoiceContent = conf.caseConf.invoices[i].content;
        invoiceDetail = conf.caseConf.invoices[i].detail;

        const shopName = domain.split(".")[0];
        const shopNameActual = await invoiceDetailPage.getDataByRowLabel("Shop");
        expect(shopName).toEqual(shopNameActual);

        const contentActual = await invoiceDetailPage.getDataByRowLabel("Content");
        expect(invoiceContent).toEqual(contentActual);

        periodStart = formatDate(subscriptionExpiredDateUTC, "MMM D, YYYY");
        periodEnd = formatDate(addDays(30, subscriptionExpiredDateUTC), "MMM D, YYYY");

        const detailActual = await invoiceDetailPage.getDataByRowLabel("Detail");
        expect(invoiceDetail.replace("{period_start}", periodStart).replace("{period_end}", periodEnd)).toEqual(
          detailActual.replaceAll("  ", " "),
        );

        const typeActual = await invoiceDetailPage.getDataByRowLabel("Type");
        expect(invoiceType).toEqual(typeActual);

        let invoiceAmount: string;
        if (invoiceType === "OUT") {
          invoiceAmount = "-" + conf.caseConf.price;
        } else {
          invoiceAmount = conf.caseConf.price;
        }
        const amountActual = await invoiceDetailPage.getDataByRowLabel("Amount");
        expect(invoiceAmount).toEqual(amountActual);

        const createdDateActual = await invoiceDetailPage.getDataByRowLabel("Created date");
        expect("Today").toEqual(createdDateActual);

        const sizeTransaction = conf.caseConf.invoices[i].transactions.length;

        for (let j = 0; i < sizeTransaction; i++) {
          transactionType = conf.caseConf.invoices[i].transactions[j].type;
          transactionContent = conf.caseConf.invoices[i].transactions[j].content;
          transactionStatus = conf.caseConf.invoices[i].transactions[j].status;

          const transactionTypeActual = await invoiceDetailPage.getDataByColumnLabel("Type", 1);
          expect(transactionType).toEqual(transactionTypeActual);

          const transactionContentActual = await invoiceDetailPage.getDataByColumnLabel("Content", 1);
          expect(transactionContent.replace("{period_start}", periodStart).replace("{period_end}", periodEnd)).toEqual(
            transactionContentActual.replaceAll("  ", " "),
          );

          let transactionAmount: string;
          if (invoiceType === "OUT") {
            transactionAmount = "-" + conf.caseConf.price;
          } else {
            transactionAmount = conf.caseConf.price;
          }
          const transactionAmountActual = await invoiceDetailPage.getDataByRowLabel("Amount");
          expect(transactionAmount).toEqual(transactionAmountActual);

          const transactionStatusActual = await invoiceDetailPage.getDataByColumnLabel("Status", 1);
          expect(transactionStatus).toEqual(transactionStatusActual);

          const transactionDateActual = await invoiceDetailPage.getDataByColumnLabel("Date", 1);
          await expect(
            transactionDateActual.includes("Just now") ||
              transactionDateActual.includes("minute") ||
              transactionDateActual.includes("minutes"),
          ).toBeTruthy();
        }

        const invoiceDetailFile = await invoiceDetailPage.downloadFile(
          "//button[normalize-space()='Download invoice']",
        );
        await dashboard.waitForLoadState("load");
        expect(invoiceDetailFile).not.toBeUndefined();
        expect(invoiceDetailFile).not.toBeNull();
      }
    });
  });
});
