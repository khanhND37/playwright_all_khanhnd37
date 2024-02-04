import { CheckoutAPI } from "@pages/api/checkout";
import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { addDays, calcInWeek, formatDate } from "@core/utils/datetime";

test.describe("Buyer should be able see process time and estimate delivery time", () => {
  test.beforeEach(async ({ conf, authRequest, page }) => {
    const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
    await checkoutAPI.addProductToCartThenCheckout(conf.suiteConf.product);
    await checkoutAPI.updateCustomerInformation(conf.suiteConf.email, conf.suiteConf.shipping_address);
    await checkoutAPI.selectDefaultShippingMethod(conf.suiteConf.shipping_address.country_code);
    await checkoutAPI.openCheckoutPageByToken();
  });

  test(
    "[Plusbase] Buyer checkout sản phẩm hiển thị đúng processding time và estimate delivery time " +
      "với order có nhiều item @TC_SB_PLB_ETAD-4",
    async ({ page, conf }) => {
      const { processing, estimate_to: estimateTo, estimate_from: estimateFrom } = conf.suiteConf.day_number as never;
      const checkout = new SFCheckout(page, conf.suiteConf.domain);
      const processingTime = addDays(processing);
      const processingTimeFormat = formatDate(processingTime, "MMMM D, YYYY");
      const estTimeFrom = calcInWeek(processingTime, estimateTo);
      const estTimeTo = calcInWeek(processingTime, estimateFrom);

      await test.step("Buyer checkout sản phẩm", async () => {
        // - Hiển thị processing time chính xác: Ready to ship as early
        // - Hiển thị thông tin: Standard Shipping 7 - 10 business days
        await expect(
          page.locator(`//span[contains(text(),'Ready to ship as early as')]/following-sibling::span`),
        ).toContainText(processingTimeFormat);
        await expect(page.locator(`//span[contains(text(),'(7 - 10 business days)')]`)).toBeVisible();
      });

      await test.step("Buyer complete order", async () => {
        await checkout.completeOrderWithMethod();
        // - Hiển thị processing time chính xác: Ready to ship as early as
        // - Hiển thị thông tin: Standard Shipping 7 - 10 business days
        // - Hiển thị thời gian thực tế của shipping time: Estimated delivery time
        await expect(
          page.locator(`//span[contains(text(),'Ready to ship as early as')]/following-sibling::span`),
        ).toContainText(processingTimeFormat);
        await expect(page.locator(`//p[contains(text(),'Standard Shipping (7 - 10 business days)')]`)).toBeVisible();
        await expect(
          page.locator(`//h3[contains(text(),'Estimated delivery time')]/following-sibling::p`),
        ).toContainText(`${formatDate(estTimeFrom, "MMMM DD")} - ${formatDate(estTimeTo, "MMMM DD, YYYY")}`);
      });

      await test.step("Reload lại trang Thank you page", async () => {
        await page.reload();
        // - Hiển thị processing time chính xác: Ready to ship as early as
        // - Hiển thị thông tin: Standard Shipping 7 - 10 business days
        // - Hiển thị thời gian thực tế của shipping time: Estimated delivery time
        await expect(
          page.locator(`//span[contains(text(),'Ready to ship as early as')]/following-sibling::span`),
        ).toContainText(processingTimeFormat);
        await expect(page.locator(`//p[contains(text(),'Standard Shipping (7 - 10 business days)')]`)).toBeVisible();
        await expect(
          page.locator(`//h3[contains(text(),'Estimated delivery time')]/following-sibling::p`),
        ).toContainText(`${formatDate(estTimeFrom, "MMMM DD")} - ${formatDate(estTimeTo, "MMMM DD, YYYY")}`);
      });
    },
  );
});
