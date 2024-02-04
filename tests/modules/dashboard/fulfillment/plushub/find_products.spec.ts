import { expect } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { OdooService } from "@services/odoo";
import { test } from "@fixtures/odoo";
import { PlusHubPage } from "@pages/dashboard/plushub";
import { PlusHubAPI } from "@pages/api/dashboard/plushub";
import type { OrderLine, Quotation, SaleOrderLinesDB } from "@types";
import { loadData } from "@core/conf/conf";

let domain: string;
let cancelReasonId: number;
let odooService = OdooService(null);
let dashboardPage: DashboardPage;
let plusHubPage: PlusHubPage;
let plusHubAPI: PlusHubAPI;
let productName: string;
let msgRequestSuccess: string;
let linkRequest: string;
let quotationId: number;

test.beforeAll(async ({ conf, odoo }) => {
  domain = conf.suiteConf.domain;
  cancelReasonId = conf.suiteConf.cancel_reason_id;
  odooService = OdooService(odoo);
  msgRequestSuccess = `Request products successfully. We will send you the details via email ${conf.suiteConf.username}`;
});

test.beforeEach(async ({ dashboard, authRequest, conf }) => {
  dashboardPage = new DashboardPage(dashboard, domain);
  plusHubPage = new PlusHubPage(dashboardPage.page, domain);
  plusHubAPI = new PlusHubAPI(domain, authRequest);
  productName = conf.caseConf.product_name;
  linkRequest = conf.caseConf.url_request;
});

test.describe("Find Products", async () => {
  test("@SB_RLSBFF_PLH_FPR_6 Verify data hiển thị trong màn SO detail sau khi request và sau khi báo giá", async ({
    conf,
    odoo,
  }) => {
    const dataSaleOrder = conf.caseConf.data_sale_order;
    const response = await plusHubAPI.getListQuotation(linkRequest);
    if (response.result.length > 0) {
      if (["draft", "sent"].includes(response.result[0].state.trim())) {
        const quotationId = response.result[0].id;
        await odooService.cancelQuotation(quotationId, conf.caseConf.reason_cancel_id);
      }
    }
    await test.step("Vào Fulfillment > PlusHub > Find products > Click button Request product > Nhập link request > Send request", async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await dashboardPage.navigateToMenu("Find products");
      await plusHubPage.requestFindProduct(linkRequest);
      expect(await plusHubPage.isDBPageDisplay(msgRequestSuccess)).toBeTruthy();
    });

    await test.step("Click vào product > Verify hiển thị trong SO detail", async () => {
      await plusHubPage.page.reload({ waitUntil: "networkidle" });
      quotationId = (await plusHubAPI.getListQuotation(linkRequest)).result[0].id;
      await plusHubPage.goToRequestDetail(quotationId);
      const dataQuotation: Quotation = await plusHubPage.getDataQuotation();
      expect(dataQuotation.quotation_status).toEqual("Processing");
      expect(dataQuotation.url_request).toEqual(conf.caseConf.url_request);
    });

    await test.step("Vào odoo > Sales > Search SO > Edit SO", async () => {
      await odooService.updateQuotationAndQuickSentQuotation(quotationId, dataSaleOrder, true, false, true);
      const state: Array<Quotation> = await odoo.read("sale.order", [quotationId], ["state"]);
      expect(state[0].state).toEqual("sent");
    });

    await test.step(" Vào store merchant > Fulfillment > PlusHub > Find product > tab Available > Verify data hiển thị", async () => {
      await plusHubPage.page.reload();
      const dataQuotation: Quotation = await plusHubPage.getDataQuotation();
      expect(dataQuotation.quotation_status).toEqual("Available");
      expect(dataQuotation.url_request).toEqual(linkRequest);
      expect(dataQuotation.product_name).toEqual(productName);
      expect(dataQuotation.price).toEqual(conf.caseConf.price);
      expect(dataQuotation.processing_time).toEqual(`${dataSaleOrder.x_estimated_delivery} days`);
      expect(dataQuotation.expiration_date).toEqual(conf.caseConf.expire_date);
    });
  });

  test("@SB_RLSBFF_PLH_FPR_7 Verify data hiển thị trong màn SO detail sau khi cancel Quotation", async ({
    authRequest,
  }) => {
    const fulfillmentPage = new FulfillmentPage(dashboardPage.page, domain);
    const plusHubAPI = new PlusHubAPI(domain, authRequest);
    let quotationId: number;
    await test.step("Vào Fulfillment > PlusHub > Find products > Click button Request product > Nhập link request > Send request", async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await dashboardPage.navigateToMenu("Find products");
      await plusHubPage.requestFindProduct(linkRequest);
      expect(await plusHubPage.isDBPageDisplay(msgRequestSuccess)).toBeTruthy();
    });

    await test.step("Mở SO vừa request > Click button cancel request > Verify SO status", async () => {
      await plusHubPage.page.reload({ waitUntil: "networkidle" });
      quotationId = (await plusHubAPI.getListQuotation(linkRequest)).result[0].id;
      await plusHubPage.goToRequestDetail(quotationId);
      const dataQuotation: Quotation = await plusHubPage.getDataQuotation();
      expect(dataQuotation.quotation_status).toEqual("Processing");
      await plusHubPage.clickOnBtnWithLabel("Cancel request");
      expect(await plusHubPage.isDBPageDisplay("Cancel quotation successfully")).toBeTruthy();
      await fulfillmentPage.navigateToMenuPlusHub("Find products");
      const response = await plusHubAPI.getListQuotation(dataQuotation.quotation_name);
      expect(response.count.no_result).toEqual(1);

      //clear data quotation after run test
      await odooService.unlinkQuotation(quotationId);
    });

    await test.step("Vào Fulfillment > PlusHub > Find products > Click button Request product > Nhập link request > Send request", async () => {
      await plusHubPage.requestFindProduct(linkRequest);
      expect(await plusHubPage.isDBPageDisplay(msgRequestSuccess)).toBeTruthy();
    });

    await test.step("Vào odoo > Sales > Search SO > Cancel SO > Verify quotation trên store merchant", async () => {
      await plusHubPage.page.reload({ waitUntil: "networkidle" });
      quotationId = (await plusHubAPI.getListQuotation(linkRequest)).result[0].id;
      await plusHubPage.goToRequestDetail(quotationId);
      let dataQuotation: Quotation = await plusHubPage.getDataQuotation();
      quotationId = dataQuotation.id;
      await odooService.cancelQuotation(quotationId, cancelReasonId);
      await plusHubPage.page.reload();
      dataQuotation = await plusHubPage.getDataQuotation();
      expect(dataQuotation.quotation_status).toEqual("Canceled");
      expect(
        await plusHubPage.page.locator(plusHubPage.getXpathAction("Cancel request")).getAttribute("class"),
      ).toContain("disabled");

      //clear data quotation after run test
      await odooService.unlinkQuotation(quotationId);
    });
  });

  test("@SB_RLSBFF_PLH_FPR_8 Verify data hiển thị trong màn SO detail với quotation có status là Expired", async ({
    conf,
    odoo,
    authRequest,
  }) => {
    const plusHubAPI = new PlusHubAPI(domain, authRequest);
    let dataQuotationBeforeUpdate: Quotation;
    const quotationExpired = conf.suiteConf.quotation_expired;

    await test.step("Vào Odoo > Edit SO > Vào store merchant > Fulfillment > PlusHub > Find products > tab Expired > Verify data hiển thị", async () => {
      await odoo.update("sale.order", quotationExpired, { validity_date: conf.caseConf.validity_date[0] });
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await dashboardPage.navigateToMenu("Find products");
      await plusHubPage.goToRequestDetail(quotationExpired);
      dataQuotationBeforeUpdate = await plusHubPage.getDataQuotation();
      expect(dataQuotationBeforeUpdate.quotation_status).toEqual("Available");
      await odoo.update("sale.order", quotationExpired, { validity_date: conf.caseConf.validity_date[1] });
      const response = await plusHubAPI.getListQuotation(conf.suiteConf.quotation_name[0]);
      expect(response.count.expired).toEqual(1);
    });

    await test.step("Vào SO detail > Verify data hiển thị trong SO detail", async () => {
      await plusHubPage.page.reload();
      const dataQuotationAfterUpdate: Quotation = await plusHubPage.getDataQuotation();
      expect(dataQuotationBeforeUpdate.id).toEqual(dataQuotationAfterUpdate.id);
      expect(dataQuotationAfterUpdate.quotation_status).toEqual("Expired");
      expect(dataQuotationBeforeUpdate.price).toEqual(dataQuotationAfterUpdate.price);
      expect(dataQuotationBeforeUpdate.url_request).toEqual(dataQuotationAfterUpdate.url_request);
      expect(dataQuotationBeforeUpdate.product_name).toEqual(dataQuotationAfterUpdate.product_name);
      expect(dataQuotationBeforeUpdate.processing_time).toEqual(dataQuotationAfterUpdate.processing_time);
      expect(
        await plusHubPage.isDBPageDisplay(
          "This quotation has reached expiration date. Please renew this quotation in order to take further actions.",
        ),
      ).toBeTruthy();
    });
  });

  test("@SB_RLSBFF_PLH_FPR_11 Verify result sau khi search quotation trong màn find product list", async ({ conf }) => {
    const quotationName = conf.suiteConf.quotation_name;
    const dataQuotations = conf.caseConf.data;
    await test.step("Vào Fulfillment > PlusHub > Find products > tab All > search quotation theo quotation name", async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await dashboardPage.navigateToMenu("Find products");
      for (const dataQuotation of dataQuotations) {
        await plusHubPage.clickOnTab(dataQuotation.tab, "div");
        await plusHubPage.searchQuotation(quotationName[dataQuotation.index_quotation_name]);
        const status = await plusHubPage.getTextContent(plusHubPage.xpathStatusFirstRequest);
        expect(status).toEqual(dataQuotation.quotation_status);
        expect(await plusHubPage.isTextVisible(`${dataQuotation.tab} (1)`)).toBeTruthy();
      }
    });

    await test.step("Search quotation không tồn tại", async () => {
      await plusHubPage.searchQuotation(quotationName[conf.caseConf.index_quotation_name]);
      expect(await plusHubPage.isTextVisible(`There is no request yet`)).toBeTruthy();
    });
  });

  test("@SB_RLSBFF_PLH_FPR_18 Verify hiển thị các action trong quotation detail", async ({ conf }) => {
    const tabs = conf.caseConf.tabs;
    await test.step("Vào Fulfillment > PlusHub > Find products > Chọn tab > Mở quotation detail", async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await dashboardPage.navigateToMenu("Find products");
      for (const tab of tabs) {
        await plusHubPage.clickOnTab(tab, "div");
        await plusHubPage.clickOnElement(plusHubPage.xpahtFirstRequest);
        switch (tab) {
          case "Submitted request":
            expect(await plusHubPage.isTextVisible("Cancel request")).toEqual(true);
            break;
          case "Quotation created":
            expect(await plusHubPage.isTextVisible("Request update")).toEqual(true);
            expect(await plusHubPage.isTextVisible("Import to store")).toEqual(true);
            break;
          case "Needs update":
            expect(
              await plusHubPage.page.locator(plusHubPage.getXpathAction("Request update")).getAttribute("class"),
            ).toContain("disabled");
            expect(
              await plusHubPage.page.locator(plusHubPage.getXpathAction("Import to store")).getAttribute("class"),
            ).toContain("disabled");
            break;
          case "Expired":
            expect(await plusHubPage.isTextVisible("Renew request")).toEqual(true);
            break;
          default:
            expect(
              await plusHubPage.page.locator(plusHubPage.getXpathAction("Cancel request")).getAttribute("class"),
            ).toContain("disabled");
            break;
        }
        await plusHubPage.clickOnTextLinkWithLabel("Request list");
      }
    });
  });

  test("@SB_RLSBFF_PLH_FPR_22 Verify quotation sau khi thực hiện Renew request thành công với quotation expired", async ({
    conf,
    odoo,
  }) => {
    const response = await plusHubAPI.getListQuotation(linkRequest);
    if (response.result.length > 0) {
      if (["draft", "sent"].includes(response.result[0].state.trim())) {
        const quotationId = response.result[0].id;
        await odooService.cancelQuotation(quotationId, cancelReasonId);
      }
    }
    await test.step("Prepare data: Tạo SO expired", async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await dashboardPage.navigateToMenu("Find products");
      await plusHubPage.requestFindProduct(linkRequest);
      expect(await plusHubPage.isDBPageDisplay(msgRequestSuccess)).toBeTruthy();
      await plusHubPage.page.reload({ waitUntil: "networkidle" });
      quotationId = (await plusHubAPI.getListQuotation(linkRequest)).result[0].id;
      await plusHubPage.goToRequestDetail(quotationId);
      const dataQuotation: Quotation = await plusHubPage.getDataQuotation();
      quotationId = dataQuotation.id;
      await odooService.updateQuotationAndQuickSentQuotation(
        quotationId,
        conf.caseConf.data_sale_order,
        true,
        false,
        true,
      );
      const state: Array<Quotation> = await odoo.read("sale.order", [quotationId], ["state"]);
      expect(state[0].state).toEqual("sent");
    });

    await test.step("Vào Fulfillment > PlusHub > Find products > Search SO expired > Vào SO detail > Click button Renew request", async () => {
      await plusHubPage.page.reload();
      await plusHubPage.clickOnBtnWithLabel("Renew request");
      expect(await plusHubPage.isTextVisible("When confirm renew request for this quotation")).toBeTruthy();
    });

    await test.step("Click Confirm > Verify quotation status", async () => {
      await plusHubPage.clickOnBtnLinkWithLabel("Confirm");
      await plusHubPage.page.waitForLoadState("networkidle");
      await plusHubPage.page.reload();
      const dataQuotationBeforeUpdate = await plusHubPage.getDataQuotation();
      expect(dataQuotationBeforeUpdate.quotation_status).toEqual("Updating");
    });

    await test.step("Vào Odoo > Sales > Search SO > Update quotation > Quay lại shop dashboard, verify SO detail", async () => {
      // update quotation: validity_date, status
      await odoo.update("sale.order", quotationId, { validity_date: conf.caseConf.validity_date[1] });
      await odoo.update("sale.order", quotationId, { x_status: "complete" });

      //reload plushub page, verify quotation status
      await plusHubPage.page.reload();
      const dataQuotationAfterUpdate = await plusHubPage.getDataQuotation();
      expect(dataQuotationAfterUpdate.quotation_status).toEqual("Available");

      //clear data quotation after run test
      await odooService.cancelQuotation(quotationId, cancelReasonId);
      await odooService.unlinkQuotation(quotationId);
    });
  });

  test("@SB_RLSBFF_PLH_FPR_23 Verify quotation sau khi thực hiện Renew request không thành công với quotation expired", async ({
    conf,
    odoo,
  }) => {
    const response = await plusHubAPI.getListQuotation(linkRequest);
    if (response.result.length > 0) {
      if (["draft", "sent"].includes(response.result[0].state.trim())) {
        const quotationId = response.result[0].id;
        await odooService.cancelQuotation(quotationId, cancelReasonId);
      }
    }
    await test.step("Prepare data: Tạo SO expired", async () => {
      await dashboardPage.navigateToMenu("Fulfillment");
      await dashboardPage.navigateToMenu("PlusHub");
      await dashboardPage.navigateToMenu("Find products");
      await plusHubPage.requestFindProduct(linkRequest);
      expect(await plusHubPage.isDBPageDisplay(msgRequestSuccess)).toBeTruthy();
      await plusHubPage.page.reload({ waitUntil: "networkidle" });
      quotationId = (await plusHubAPI.getListQuotation(linkRequest)).result[0].id;
      await plusHubPage.goToRequestDetail(quotationId);
      const dataQuotation: Quotation = await plusHubPage.getDataQuotation();
      quotationId = dataQuotation.id;
      await odooService.updateQuotationAndQuickSentQuotation(
        quotationId,
        conf.caseConf.data_sale_order,
        true,
        false,
        true,
      );
      const state: Array<Quotation> = await odoo.read("sale.order", [quotationId], ["state"]);
      expect(state[0].state).toEqual("sent");
    });

    await test.step("Vào Fulfillment > PlusHub > Find products > Search SO expired > Vào SO detail > Click button Renew request", async () => {
      await plusHubPage.page.reload();
      await plusHubPage.clickOnBtnWithLabel("Renew request");
      expect(await plusHubPage.isTextVisible("When confirm renew request for this quotation")).toBeTruthy();
    });

    await test.step("Click Confirm > Verify quotation status", async () => {
      await plusHubPage.clickOnBtnLinkWithLabel("Confirm");
      await plusHubPage.page.waitForLoadState("networkidle");
      await plusHubPage.page.reload();
      const dataQuotationBeforeUpdate = await plusHubPage.getDataQuotation();
      expect(dataQuotationBeforeUpdate.quotation_status).toEqual("Updating");
    });

    await test.step("Vào Odoo > Thực hiện cancel quotation > Quay lại shop dashboard, verify SO detail", async () => {
      // cancel quotation, update status
      await odooService.cancelQuotation(quotationId, cancelReasonId);
      await odoo.update("sale.order", quotationId, { x_status: "complete" });

      //reload plushub page, verify quotation status
      await plusHubPage.page.reload();
      const dataQuotationAfterUpdate = await plusHubPage.getDataQuotation();
      expect(dataQuotationAfterUpdate.quotation_status).toEqual("Canceled");

      //clear data quotation after run test
      await odooService.unlinkQuotation(quotationId);
    });
  });
});

test.describe("Find Products", async () => {
  const caseName = "SB_RLSBFF_PLH_FPR_9";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      description: caseDescription,
      unit_price: unitPrices,
      x_quote_based_on: xQuoteBasedOn,
      url_request: urlRequest,
    }) => {
      test(`${caseDescription} @${caseId}`, async ({ conf, authRequest, token, odoo }) => {
        const plusHubAPI = new PlusHubAPI(domain, authRequest);
        let dataQuotation: Quotation;
        const dataConfig = new Map<number, number>();

        await test.step("Vào Fulfillment > PlusHub > Find products > Click button Request product > Nhập link request > Send request", async () => {
          await dashboardPage.navigateToMenu("Fulfillment");
          await dashboardPage.navigateToMenu("PlusHub");
          await dashboardPage.navigateToMenu("Find products");
          await plusHubPage.requestFindProduct(urlRequest);
          expect(await plusHubPage.isDBPageDisplay(msgRequestSuccess)).toBeTruthy();
        });

        await test.step("Vào Odoo > Sales > Thực hiện báo giá cho quotation vừa request", async () => {
          await plusHubPage.page.reload({ waitUntil: "networkidle" });
          quotationId = (await plusHubAPI.getListQuotation(urlRequest)).result[0].id;
          await plusHubPage.goToRequestDetail(quotationId);
          dataQuotation = await plusHubPage.getDataQuotation();
          await odooService.updateQuotationAndQuickSentQuotationPlushub(
            dataQuotation.id,
            conf.suiteConf.product_template_id,
            true,
            false,
            true,
            xQuoteBasedOn,
            unitPrices,
          );
          const state: Array<Quotation> = await odoo.read("sale.order", [dataQuotation.id], ["state"]);
          expect(state[0].state).toEqual("sent");

          // get data order line from odoo
          const dataOrderLine: Array<OrderLine> = await odoo.read("sale.order", [dataQuotation.id], ["order_line"]);

          // get data sale order line from odoo
          const saleOrderLines: Array<SaleOrderLinesDB> = await odoo.read(
            "sale.order.line",
            dataOrderLine[0].order_line,
            ["price_unit", "product_id"],
          );

          // set data config for verify
          for (const saleOrderLine of saleOrderLines) {
            dataConfig.set(saleOrderLine.product_id[0], saleOrderLine.price_unit);
          }
        });

        await test.step("Vào store merchant > Fulfillment > PlusHub > Find products > tab Available > Click vào SO > Verify data hiển thị ", async () => {
          const user = await token.getUserToken({
            username: conf.suiteConf.username,
            password: conf.suiteConf.password,
          });

          const dataQuotationOnDB: Array<SaleOrderLinesDB> = await plusHubAPI.getDataQuotation(
            dataQuotation.id,
            user.access_token,
          );

          for (let i = 1; i < dataQuotationOnDB.length; i++) {
            if (xQuoteBasedOn) {
              // Nếu khi báo giá tích quotation base on thì tất cả các line lấy giá của line đầu tiên
              const [firstPrice] = dataConfig.values();
              expect(dataQuotationOnDB[i].price_unit).toEqual(firstPrice);
            } else {
              expect(dataQuotationOnDB[i].price_unit).toEqual(dataConfig.get(dataQuotationOnDB[i].product_id));
            }
          }

          //clear data after run test case
          await odooService.cancelQuotation(dataQuotation.id, cancelReasonId);
          await odooService.unlinkQuotation(dataQuotation.id);
        });
      });
    },
  );
});
