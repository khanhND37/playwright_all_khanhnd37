import { expect } from "@core/fixtures";
import { OrdersPage } from "@pages/dashboard/orders";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { HivePlusHub } from "@pages/hive/hive_sbase_plushub";
import { loadData } from "@core/conf/conf";
import { PlusHubAPI } from "@pages/api/dashboard/plushub";
import { OdooService } from "@services/odoo";
import { test } from "@fixtures/odoo";
import type { PurchaseOrderOdoo, StockPicking } from "@types";
import { ClaimsPlusBase } from "./claims_plusbase";
import { OcgLogger } from "@core/logger";

let orderID: number;
let shopTemplate: string;
let claimID: number;
let claimName: string;
const logger = OcgLogger.get();

test.beforeAll(async ({ conf }) => {
  shopTemplate = conf.suiteConf.domain;
  orderID = conf.suiteConf.order_id;
});

test.describe("Tạo Claims thành công", async () => {
  const caseName = "SB_RPLS_RCPSL_6";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      description: caseDescription,
      prefer_solution: solution,
      reason_claim: reason,
      envidence: claimEnvidence,
      new_status: newStatus,
      refund_amount: refundAmount,
    }) => {
      test(`@${caseId} ${caseDescription}`, async ({ authRequest, dashboard, page, odoo, conf, scheduler }) => {
        const orderPage = new OrdersPage(dashboard, shopTemplate);
        const fulfillmentPage = new FulfillmentPage(dashboard, shopTemplate);
        const hivePlusHub = new HivePlusHub(page, conf.suiteConf.hive_info.domain);
        const plusHubAPI = new PlusHubAPI(shopTemplate, authRequest);
        const odooService = OdooService(odoo);
        const account = conf.suiteConf.hive_info.username;
        const password = conf.suiteConf.hive_info.password;
        const orderNumber = conf.suiteConf.order_number;

        let scheduleData: ClaimsPlusBase;

        const rawDataJson = await scheduler.getData();

        if (rawDataJson) {
          scheduleData = rawDataJson as ClaimsPlusBase;
        } else {
          logger.info("Init default object");
          scheduleData = {
            poId: 0,
            claimId: 0,
            counts: 0,
          };

          logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
        }

        await test.step(`Vào Orders detail > Cick button More actions > Chọn File a claim`, async () => {
          if (!scheduleData.claimId) {
            await orderPage.goToOrderStoreTemplateByOrderId(orderID);
            await orderPage.clickOnBtnWithLabel("More actions");
            await orderPage.clickElement("File a claim");
            await fulfillmentPage.selectOptionWithLabel(solution);
            await fulfillmentPage.selectLineItem(1, true);
            await fulfillmentPage.selectReason(reason);
            await fulfillmentPage.inputClaimEnvidence(claimEnvidence);
            await fulfillmentPage.clickButton("Submit your claim");
            await fulfillmentPage.navigateToMenuPlusHub("Claims");
            const statusClaim = await fulfillmentPage.getStatusClaim(orderNumber);
            claimName = await fulfillmentPage.getFirstClaim();
            claimID = await fulfillmentPage.getClaimID(orderNumber);
            expect(statusClaim).toEqual("New");
          }
        });

        await test.step(`Vào Hive > PlusHub > Claims > Verify data claims`, async () => {
          if (!scheduleData.claimId) {
            await hivePlusHub.loginToHiveShopBase({ account, password });
            await hivePlusHub.goToClaimDetail(claimID);
            const ownerEmail = await hivePlusHub.getOwnerEmail();
            expect(ownerEmail).toEqual(conf.suiteConf.username);
            const claimType = await hivePlusHub.getDataTable(1, 1, 7);
            const sellerNote = await hivePlusHub.getDataTable(1, 1, 9);
            expect(claimType).toEqual(reason);
            expect(sellerNote).toEqual(claimEnvidence);
            const statusClaim = await hivePlusHub.getClaimStatus();
            expect(statusClaim).toEqual("New");
          }
        });

        await test.step(`Update status claim > Verify claim trong store template `, async () => {
          if (!scheduleData.claimId) {
            if (newStatus == "Cancel") {
              await plusHubAPI.cancelClaimByClaimId(claimID);

              // verify claim status
              const res = await plusHubAPI.getDataClaimByClaimId(claimID);
              expect(res.order_claim.status).toEqual("canceled");
            } else {
              await hivePlusHub.selectSolutionOrStatusClaim("Status", newStatus);
              if (newStatus == "Approved") {
                if (solution == "Refund") {
                  await hivePlusHub.inputRefundAmount(refundAmount);
                }
                await hivePlusHub.clickBtnUpdate();
                page.on("dialog", async dialog => {
                  expect(dialog.message()).toEqual("Are you sure you want to approve claim " + `${claimName}`);
                  await dialog.accept();
                });
                await hivePlusHub.page.keyboard.press("Enter");
                await hivePlusHub.page.waitForLoadState("networkidle");
              } else {
                await hivePlusHub.clickBtnUpdate();
                expect(await hivePlusHub.getLocatorMessageUpdate().isVisible()).toBeTruthy();
              }
            }
            scheduleData.claimId = claimID;
          }
        });

        await test.step(`Verify data claim trong store template và odoo`, async () => {
          const res = await plusHubAPI.getDataClaimByClaimId(scheduleData.claimId);
          res.order_claim.status.localeCompare(newStatus);
          res.order_claim.solution.localeCompare(solution);
          expect(res.order_claim_lines[0].reason).toEqual(reason);
          expect(res.order_claim_lines[0].claim_note).toEqual(claimEnvidence);
          let poId = 0;
          if (solution == "Resend") {
            await expect(async () => {
              const res = await plusHubAPI.getDataClaimByClaimId(scheduleData.claimId);
              const orderData = JSON.parse(res.order_claim.order_data);
              poId = orderData.po_id;
              expect(poId).toBeGreaterThan(0);
            }).toPass();

            logger.info("Clear scheduling");
            await scheduler.clear();

            if (!poId && scheduleData.counts < 4) {
              scheduleData.counts = scheduleData.counts + 1;
              await scheduler.setData(scheduleData);
              await scheduler.schedule({ mode: "later", minutes: 3 });
              // eslint-disable-next-line playwright/no-skipped-test
              test.skip();
              return;
            }

            logger.info("Clear scheduling");
            await scheduler.clear();

            await expect(async () => {
              const data: Array<PurchaseOrderOdoo> = await odoo.read("purchase.order", [poId], ["picking_ids"]);
              const pickingId = data[0].picking_ids[0];
              const state = await odooService.getStockPickingState(pickingId);
              expect(state).toEqual("done");
              const stockPicking: Array<StockPicking> = await odooService.getStockPickingsByConditions({
                state: ["assigned", "partially_available"],
                orderName: orderNumber,
                fields: ["state"],
              });
              expect(stockPicking[0].state).toEqual("assigned");
            }).toPass();
          }
        });
      });
    },
  );
});
