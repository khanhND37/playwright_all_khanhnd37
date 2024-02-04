import { test, expect } from "@core/fixtures";
import { OrdersPage } from "@pages/dashboard/orders";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { FulfillmentPage } from "@pages/dashboard/fulfillment";
import { loadData } from "@core/conf/conf";
import { HivePlusHub } from "@pages/hive/hive_sbase_plushub";
import type { DataInvoiceDetail } from "@types";
import { BalancePage } from "@pages/dashboard/balance";

let orderNumber: string;
let orderID: number;
let reason: string;
let shopDomain: string;
let email: string;
let dashboardPage: DashboardPage;
let claimName: string;
let statusClaim: string;
let claimID: number;
let invoiceInfo: DataInvoiceDetail;

test.beforeAll(async ({ conf }) => {
  shopDomain = conf.suiteConf.domain;
  orderNumber = conf.suiteConf.order_number;
  orderID = conf.suiteConf.order_id;
  email = conf.suiteConf.username;
});

test.describe("Tạo Claim không thành công", async () => {
  test(`Verify tạo claim không thành công @SB_RLSBFF_PLH_CLA_4`, async ({ dashboard, conf }) => {
    const orderPage = new OrdersPage(dashboard, shopDomain);
    const fulfillmentPage = new FulfillmentPage(dashboard, shopDomain);
    await test.step("Vào order detail > Chọn button More actions > Chọn File a claim", async () => {
      await orderPage.goToOrderByOrderId(orderID);
      await orderPage.clickOnBtnWithLabel("More actions");
      await orderPage.clickElement("File a claim");
      expect(dashboard.url()).toContain("claims/new-claim");
    });

    await test.step("Bỏ tick các lineitem > Submit your claims", async () => {
      await fulfillmentPage.selectLineItem(1, false);
      await expect(dashboard.locator(fulfillmentPage.xpathBtnWithLabel("Submit your claim"))).toBeDisabled();
    });

    await test.step("Chọn line items > Không chọn reason > Click button Submit your claims", async () => {
      await fulfillmentPage.selectLineItem(1, true);
      await fulfillmentPage.clickOnBtnWithLabel("Submit your claim");
      expect(await fulfillmentPage.isToastMsgVisible("Claim must have reason")).toBeTruthy();
      await fulfillmentPage.page.reload();
    });

    await test.step("Chọn line items > Chọn Reason for claim là Product unacceptable/ Wrong items nhưng không upload file envidence", async () => {
      await fulfillmentPage.selectLineItem(1, true);
      await fulfillmentPage.selectReason("other");
      for (reason of conf.caseConf.list_reason) {
        await fulfillmentPage.selectReason(reason);
        await fulfillmentPage.clickButton("Submit your claim");
        if (reason === "product-unacceptable" || reason === "wrong-items") {
          expect(await fulfillmentPage.isToastMsgVisible("Evidence is required for Product issues")).toBeTruthy();
          await fulfillmentPage.waitForToastMessageHide("Evidence is required for Product issues");
        } else {
          expect(
            await fulfillmentPage.isToastMsgVisible(
              "You need to tell us about your problems by leaving the information",
            ),
          ).toBeTruthy();
          await fulfillmentPage.waitForToastMessageHide(
            "You need to tell us about your problems by leaving the information",
          );
        }
      }
    });
  });
});

test.describe("Tạo Claims thành công", async () => {
  const caseName = "SB_RLSBFF_PLH_CLA_5";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      description: caseDescription,
      prefer_solution: solution,
      reason_claim: reason,
      envidence: claimEnvidence,
    }) => {
      test(`${caseDescription} @${caseId}`, async ({ dashboard, page }) => {
        const orderPage = new OrdersPage(dashboard, shopDomain);
        const fulfillmentPage = new FulfillmentPage(dashboard, shopDomain);
        const hivePlusHub = new HivePlusHub(page, conf.suiteConf.hive_info.domain);
        const account = conf.suiteConf.hive_info.username;
        const password = conf.suiteConf.hive_info.password;
        await test.step(`Vào Orders detail > Cick button More actions > Chọn File a claim`, async () => {
          await orderPage.goToOrderByOrderId(orderID);
          await orderPage.clickOnBtnWithLabel("More actions");
          await orderPage.clickElement("File a claim");
          expect(dashboard.url()).toContain("claims/new-claim");
        });

        await test.step(`Chọn Preferred solution > Chọn line items > Nhập quantity> Chọn reason for claims > Nhập claim envidence > Click button"Submit your claim"`, async () => {
          await fulfillmentPage.selectOptionWithLabel(solution);
          await fulfillmentPage.selectLineItem(1, true);
          await fulfillmentPage.selectReason(reason);
          await fulfillmentPage.inputClaimEnvidence(claimEnvidence);
          await fulfillmentPage.clickButton("Submit your claim");
          await fulfillmentPage.navigateToMenuPlusHub("Claims");
          statusClaim = await fulfillmentPage.getStatusClaim(orderNumber);
          expect(statusClaim).toEqual("New");
          claimID = await fulfillmentPage.getClaimID(orderNumber);
        });

        await test.step(`Vào Hive > PlusHub > Claims > Verify data claims`, async () => {
          await hivePlusHub.loginToHiveShopBase({ account, password });
          await hivePlusHub.goToClaimDetail(claimID);
          const ownerEmail = await hivePlusHub.getOwnerEmail();
          expect(ownerEmail).toEqual(email);
          const claimType = await hivePlusHub.getDataTable(1, 1, 7);
          const sellerNote = await hivePlusHub.getDataTable(1, 1, 9);
          expect(claimType).toEqual(reason);
          expect(sellerNote).toEqual(claimEnvidence);
          const status = await hivePlusHub.getClaimStatus();
          expect(status).toEqual(statusClaim);
        });
      });
    },
  );
});

test.describe("Verify data claim sau khi thay đổi status", async () => {
  let balancePage: BalancePage;
  const caseName = "SB_RLSBFF_PLH_CLA_7";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      description: caseDescription,
      prefer_solution: solution,
      reason_claim: reason,
      envidence: claimEnvidence,
      new_status: newStatus,
    }) => {
      test(`${caseDescription} @${caseId}`, async ({ dashboard, page }) => {
        dashboardPage = new DashboardPage(dashboard, shopDomain);
        const orderPage = new OrdersPage(dashboard, shopDomain);
        const fulfillmentPage = new FulfillmentPage(dashboard, shopDomain);
        const hivePlusHub = new HivePlusHub(page, conf.suiteConf.hive_info.domain);

        const account = conf.suiteConf.hive_info.username;
        const password = conf.suiteConf.hive_info.password;

        await test.step(`Vào Orders detail > Click button More actions > Chọn File a claim > Tạo claims`, async () => {
          await orderPage.goToOrderByOrderId(orderID);
          await orderPage.clickOnBtnWithLabel("More actions");
          await orderPage.clickElement("File a claim");
          await fulfillmentPage.selectOptionWithLabel(solution);
          await fulfillmentPage.selectLineItem(1, true);
          await fulfillmentPage.selectReason(reason);
          await fulfillmentPage.inputClaimEnvidence(claimEnvidence);
          await fulfillmentPage.clickButton("Submit your claim");
          await fulfillmentPage.navigateToMenuPlusHub("Claims");
          statusClaim = await fulfillmentPage.getStatusClaim(orderNumber);
          expect(statusClaim).toEqual("New");
          claimName = await fulfillmentPage.getFirstClaim();
          claimID = await fulfillmentPage.getClaimID(orderNumber);
        });

        await test.step(`Vào Hive > PlusHub > Claims > Filter theo Claim ID > Chọn claim > Edit status claim > Click button Update`, async () => {
          await hivePlusHub.loginToHiveShopBase({ account, password });
          await hivePlusHub.goToClaimDetail(claimID);
          const ownerEmail = await hivePlusHub.getOwnerEmail();
          expect(ownerEmail).toEqual(email);
          await hivePlusHub.selectSolutionOrStatusClaim("Status", newStatus);
          if (newStatus == "Approved") {
            if (solution == "Refund") {
              await hivePlusHub.inputRefundAmount("1");
            }
            await hivePlusHub.clickBtnUpdate();
            page.on("dialog", async dialog => {
              expect(dialog.message()).toEqual("Are you sure you want to approve claim " + `${claimName}`);
              await dialog.accept();
            });
            await hivePlusHub.page.keyboard.press("Enter");
          } else {
            await hivePlusHub.clickBtnUpdate();
            expect(await hivePlusHub.getLocatorMessageUpdate().isVisible());
          }
        });

        await test.step(`Vào dashboard shopbase > Fulfillment > PlusHub > Claims > verify tab Claim`, async () => {
          dashboardPage = new DashboardPage(dashboard, shopDomain);
          await dashboardPage.navigateToMenu("Fulfillment");
          await dashboardPage.navigateToMenu("PlusHub");
          await fulfillmentPage.navigateToMenuPlusHub("Claims");
          await fulfillmentPage.navigateToClaimTab(newStatus);
          for (let i = 0; i < 2; i++) {
            if ((await fulfillmentPage.isTextVisible(claimName)) === false) {
              await fulfillmentPage.page.reload();
              await fulfillmentPage.navigateToClaimTab(newStatus);
            }
          }
          const claimInfo = await fulfillmentPage.getInfoClaims(claimName);
          expect(claimInfo).toContain(orderNumber);
          expect(claimInfo).toContain(solution);
          expect(claimInfo).toContain(newStatus);
          if (newStatus == "Approved") {
            if (solution == "Resend") {
              await dashboardPage.navigateToMenu("Orders");
              await orderPage.goToOrderByOrderId(orderID);
              expect(await orderPage.checkLocatorVisible(orderPage.xpathResendClaim)).toEqual(true);
            } else {
              balancePage = new BalancePage(dashboard, shopDomain);
              invoiceInfo = {
                domain: shopDomain,
                content: conf.suiteConf.invoice_info.content,
                amount: conf.suiteConf.invoice_info.amount,
                status: conf.suiteConf.invoice_info.status,
              };
              await balancePage.goto("admin/balance/history");
              await balancePage.page.waitForLoadState("networkidle");
              expect(await balancePage.isDBPageDisplay("Invoices")).toBeTruthy();
              expect(await balancePage.isInvoiceCreated(invoiceInfo)).toBeTruthy();
            }
          }
        });
      });
    },
  );
});
