import { expect, test } from "@core/fixtures";
import { buildMsgRiskLevelDetails } from "@core/utils/checkout";
import { removeCurrencySymbol } from "@core/utils/string";
import { PaymentProviders } from "@pages/api/payment_providers";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";
import { RiskLevelInfo } from "@types";
test.describe("Kiểm tra risk level details", async () => {
  let dashboardPage: DashboardPage;
  let paymentProvidersAPI: PaymentProviders;
  let paymentProvidersPage: PaymentProviderPage;
  let domain: string, infoRiskLevelR2: RiskLevelInfo, infoRiskLevelR5: RiskLevelInfo, infoRiskLevelR4: RiskLevelInfo;
  let newPage, shopId: number, userId: number, disputeRateR2: string, disputeRateR4: string, disputeRateR5: string;
  let riskLevel: string, shippingPerformance: string, fulfillmentPerformance: string, msgRiskLevelDetails;

  test("@SB_RLS_HR_73 Kiểm tra risk level details", async ({ dashboard, authRequest, conf }) => {
    domain = conf.suiteConf.domain;
    shopId = conf.suiteConf.shop_id;
    userId = conf.suiteConf.user_id;
    infoRiskLevelR2 = conf.suiteConf.risk_level_R2;
    infoRiskLevelR4 = conf.suiteConf.risk_level_R4;
    infoRiskLevelR5 = conf.suiteConf.risk_level_R5;

    dashboardPage = new DashboardPage(dashboard, domain);
    paymentProvidersAPI = new PaymentProviders(domain, authRequest);
    paymentProvidersPage = new PaymentProviderPage(dashboard, domain);

    // Update risk level to R4
    await paymentProvidersAPI.updateDataRiskLevel(shopId, userId, "R4", infoRiskLevelR4);

    // Open Payment providers page
    await dashboardPage.navigateToMenu("Settings");
    await dashboardPage.navigateToSectionInSettingPage("Payment providers");
    await dashboard.locator(paymentProvidersPage.xpathBlockSpay).click();

    await test.step("Click link View details tại block Shopbase Payment", async () => {
      //Kiểm tra risk level hiện tại tại block Shopbase payment
      expect((await dashboard.locator(paymentProvidersPage.xpathRiskLevel).textContent()).trim()).toEqual("R4");
      expect(await paymentProvidersPage.isTextVisible("View details")).toBeTruthy();

      // Click popup risk level details
      await dashboard.locator(paymentProvidersPage.xpathViewDetailsRiskLevel).click();
      expect(await paymentProvidersPage.isTextVisible("ShopBase Payment risk level")).toBeTruthy();
      expect(await paymentProvidersPage.isTextVisible("Current Risk Level")).toBeTruthy();

      // Verify current risk level (R4)
      expect(await paymentProvidersPage.isTextVisible("ShopBase Payment risk level")).toBeTruthy();
      riskLevel = (await dashboard.locator(paymentProvidersPage.xpathRiskLevelInPopup).textContent()).trim();
      expect(riskLevel).toEqual("R4");

      // Verify dispute rate
      disputeRateR4 = Number(
        removeCurrencySymbol((await dashboard.locator(paymentProvidersPage.xpathDisputeRate).textContent()).trim()),
      ).toFixed(2);
      expect(disputeRateR4).toEqual(`${(infoRiskLevelR4.dispute_spay_rate * 100).toFixed(2)}`);

      // Verify shipping performance
      shippingPerformance = (
        await dashboard.locator(paymentProvidersPage.xpathShippingPerformance).textContent()
      ).trim();
      expect(shippingPerformance).toEqual("Good");

      // Verify fulfillment performance
      fulfillmentPerformance = (
        await dashboard.locator(paymentProvidersPage.xpathFulfillmentPerformance).textContent()
      ).trim();
      expect(fulfillmentPerformance).toEqual("Good");

      // Verify link help docs Learn more
      const [pageHelpDocs] = await Promise.all([
        dashboard.context().waitForEvent("page"),
        dashboard.locator(paymentProvidersPage.xpathLearnMore).click(),
      ]);
      expect(pageHelpDocs.url()).toContain("help.shopbase.com/en/article/shopbase-marketplace-payments-policy");
    });

    await test.step("Click button Got it trong popup Risk profile history", async () => {
      // Close popup Risk level details
      await dashboard.getByText("Got it").click();
      await expect(dashboard.locator(paymentProvidersPage.xpathRiskLevelInPopup)).toBeHidden({ timeout: 2000 });
    });

    await test.step("Update database để dispute rate < 0.5%", async () => {
      // Update bảng user_spay_risk_level
      await paymentProvidersAPI.updateDataRiskLevel(shopId, userId, "R5", infoRiskLevelR5);

      // Get msg risk level details
      msgRiskLevelDetails = buildMsgRiskLevelDetails(infoRiskLevelR4, infoRiskLevelR5);
    });

    await test.step(`- Reload lại trang Payment providers
    - Reopen popup Risk profile history
    - Click Expand tại node Risk Profile revised from R4 > R5
    - Re-click expand tại node Risk Profile revised from R4 > R5`, async () => {
      await dashboard.reload();
      await dashboard.locator(paymentProvidersPage.xpathBlockSpay).click();
      await dashboard.locator(paymentProvidersPage.xpathViewDetailsRiskLevel).click();

      // Kiểm tra risk level hiện tại (R5)
      riskLevel = (await dashboard.locator(paymentProvidersPage.xpathRiskLevelInPopup).textContent()).trim();
      expect(riskLevel).toEqual("R5");

      // Verify dispute rate
      disputeRateR5 = Number(
        removeCurrencySymbol((await dashboard.locator(paymentProvidersPage.xpathDisputeRate).textContent()).trim()),
      ).toFixed(2);
      expect(disputeRateR5).toEqual(`${(infoRiskLevelR5.dispute_spay_rate * 100).toFixed(2)}`);

      // Verify shipping performance
      shippingPerformance = (
        await dashboard.locator(paymentProvidersPage.xpathShippingPerformance).textContent()
      ).trim();
      expect(shippingPerformance).toEqual("Good");
      // Verify fulfillment performance
      fulfillmentPerformance = (
        await dashboard.locator(paymentProvidersPage.xpathFulfillmentPerformance).textContent()
      ).trim();
      expect(fulfillmentPerformance).toEqual("Good");

      // Kiểm tra log thay đổi risk level
      expect(await paymentProvidersPage.isTextVisible("Risk Profile History")).toBeTruthy();
      await dashboard.locator(paymentProvidersPage.xpathExpandRiskLevel).first().click();
      expect(await paymentProvidersPage.isTextVisible("Risk Profile revised from R4 → R5")).toBeTruthy();
      expect(await paymentProvidersPage.isTextVisible(msgRiskLevelDetails.msgChangeDisputeRate)).toBeTruthy();

      // Re-click expand tại node Risk Profile revised from R4 > R5: Khong hiển thị Risk level details
      await dashboard.locator(paymentProvidersPage.xpathExpandRiskLevel).first().click();
      expect(await paymentProvidersPage.isTextVisible("Risk Profile revised from R4 → R5")).toBeTruthy();
      expect(await paymentProvidersPage.isTextVisible(msgRiskLevelDetails.msgChangeDisputeRate)).toBeFalsy();
    });

    await test.step("Update database để thay đổi chỉ số fulfillment performance và shipping performance", async () => {
      // Update bảng user_spay_risk_level
      await paymentProvidersAPI.updateDataRiskLevel(shopId, userId, "R2", infoRiskLevelR2);

      // Get msg risk level details
      msgRiskLevelDetails = buildMsgRiskLevelDetails(infoRiskLevelR5, infoRiskLevelR2);
    });

    await test.step("Tại Settings > Payment providers > Block Shopbase Payment: Reopen popup Risk profile history", async () => {
      // Kiểm tra risk level details khi chuyển từ R5 > R2
      await dashboard.reload();
      await dashboard.locator(paymentProvidersPage.xpathBlockSpay).click();
      await dashboard.locator(paymentProvidersPage.xpathViewDetailsRiskLevel).click();

      // Kiểm tra risk level hiện tại (R2)
      riskLevel = (await dashboard.locator(paymentProvidersPage.xpathRiskLevelInPopup).textContent()).trim();
      expect(riskLevel).toEqual("R2");

      // Verify dispute rate
      disputeRateR2 = Number(
        removeCurrencySymbol((await dashboard.locator(paymentProvidersPage.xpathDisputeRate).textContent()).trim()),
      ).toFixed(2);
      expect(disputeRateR2).toEqual(`${(infoRiskLevelR2.dispute_spay_rate * 100).toFixed(2)}`);
      // Verify shipping performance
      shippingPerformance = (
        await dashboard.locator(paymentProvidersPage.xpathShippingPerformance).textContent()
      ).trim();
      expect(shippingPerformance).toEqual("Poor");
      // Verify fulfillment performance
      fulfillmentPerformance = (
        await dashboard.locator(paymentProvidersPage.xpathFulfillmentPerformance).textContent()
      ).trim();
      expect(fulfillmentPerformance).toEqual("Poor");

      // Kiểm tra log thay đổi risk level
      await dashboard.locator(paymentProvidersPage.xpathExpandRiskLevel).first().click();
      expect(await paymentProvidersPage.isTextVisible("Risk Profile revised from R5 → R2")).toBeTruthy();
      expect(await paymentProvidersPage.isTextVisible(`Shipping Performance: Good → Poor`)).toBeTruthy();
      expect(await paymentProvidersPage.isTextVisible(`Fulfillment Performance: Good → Poor`)).toBeTruthy();

      //Verify link text Previous 21 days Average Shipping Time
      expect(await paymentProvidersPage.isTextVisible(msgRiskLevelDetails.msgAvgShippingTime)).toBeTruthy();
      [newPage] = await Promise.all([
        dashboard.context().waitForEvent("page"),
        dashboard.getByText(msgRiskLevelDetails.msgAvgShippingTime).first().click(),
      ]);
      expect(newPage.url()).toContain(`${domain}/admin/orders`);

      //Verify link text Order delivered/ order tracking moved ratio
      expect(await paymentProvidersPage.isTextVisible(msgRiskLevelDetails.msgDeliveryTackingMovedRatio)).toBeTruthy();
      [newPage] = await Promise.all([
        dashboard.context().waitForEvent("page"),
        dashboard.getByText(msgRiskLevelDetails.msgDeliveryTackingMovedRatio).first().click(),
      ]);
      expect(newPage.url()).toContain(`${domain}/admin/orders`);

      // Verify link text (Previous 21 days Average Fulfillment Time: 30.62 days)
      expect(await paymentProvidersPage.isTextVisible(msgRiskLevelDetails.msgAvgFulfillmentTime)).toBeTruthy();
      [newPage] = await Promise.all([
        dashboard.context().waitForEvent("page"),
        dashboard.getByText(msgRiskLevelDetails.msgAvgFulfillmentTime).first().click(),
      ]);
      expect(newPage.url()).toContain(`${domain}/admin/orders`);

      // Verify link text Order tracking moved/ total order ratio
      expect(
        await paymentProvidersPage.isTextVisible(msgRiskLevelDetails.msgTrackingMovedTotalOrderRatio),
      ).toBeTruthy();
      [newPage] = await Promise.all([
        dashboard.context().waitForEvent("page"),
        dashboard.getByText(msgRiskLevelDetails.msgTrackingMovedTotalOrderRatio).first().click(),
      ]);
      expect(newPage.url()).toContain(`${domain}/admin/orders`);

      // Re-click expand tại node Risk Profile revised from R5 > R2
      await dashboard.locator(paymentProvidersPage.xpathExpandRiskLevel).first().click();
      await dashboard.getByText(msgRiskLevelDetails.msgAvgShippingTime).isHidden();
    });
  });
});
