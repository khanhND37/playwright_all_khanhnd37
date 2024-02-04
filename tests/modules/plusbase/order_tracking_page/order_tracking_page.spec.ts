/* eslint-disable max-len */
import { OrdersPage } from "@pages/dashboard/orders";
import { expect, test } from "@core/fixtures";
import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";
import { ThankYouPage } from "@pages/storefront/thankYou";
import { loadData } from "@core/conf/conf";

test.describe("plbase-order tracking page", async () => {
  const caseName = "TC_PLB_OTP_4";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.shipmentStatus.forEach(({ order_id: order_id }, i: number) => {
    test(`[PLB] Verify hiển thị link text " View tracking log" @TC_PLB_OTP_4 with order name ${i}`, async ({
      dashboard,
      conf,
      context,
    }) => {
      const domain = conf.suiteConf.cases.TC_PLB_OTP_4.domain;
      const ordersPage = new OrdersPage(dashboard, domain);
      const pageCommon = new SBPage(dashboard, domain);
      const thankYouPage = new ThankYouPage(dashboard, domain);

      let newPage: Page;

      await test.step("Đến trang order status page", async () => {
        await ordersPage.goToOrderByOrderId(order_id);
        (await thankYouPage.viewOrderStatusPageText()).isVisible();
        newPage = await pageCommon.clickElementAndNavigateNewTab(context, await thankYouPage.viewOrderStatusPageText());
      });

      await test.step("Check order tracking", async () => {
        await newPage.waitForSelector("//div[@class= 'fulfillment__to']");
        await expect(
          newPage.locator("//div[@class='fulfillment__tracking-number__info']//*[contains(text(),'Number')]"),
        ).toBeVisible();
        await expect(newPage.locator("//button/span[@class='fulfillment__copy']")).toBeVisible();
        await expect(newPage.locator("//span[@class='fulfillment__shipment-status']")).toBeVisible();
        await expect(newPage.locator("//span[text()[normalize-space()='View more']]")).toBeVisible();
        await expect(newPage.locator("//button[@class='s-button step__contact-us-button']")).toBeVisible();

        /***
         * verify color of shipment status Delivered = màu xanh
         */
        const shipmentStatus = thankYouPage.getShipmentStatus(newPage);
        const statusColor = thankYouPage.getStatusColor(newPage);
        if (
          (await shipmentStatus) === "Delivered" ||
          (await shipmentStatus) === "Ready For Pickup" ||
          (await shipmentStatus) === "Tracking Created" ||
          (await shipmentStatus) === "In transit"
        ) {
          expect(await statusColor).toBe("rgb(63, 188, 26)");
        } else if ((await shipmentStatus) === "Processing" || (await shipmentStatus) === "Synchronizing") {
          expect(await statusColor).toBe("rgb(212, 149, 2)");
        } else if ((await shipmentStatus) === "Undelivered") {
          expect(await statusColor).toBe("rgb(209, 27, 39)");
        }
      });

      await test.step("Check message trả về", async () => {
        const total = await thankYouPage.getTotalTrackingMessage(newPage);
        const trackingMessNum = await thankYouPage.getTrackingMessageNum(newPage);
        if (total > 5) {
          expect(trackingMessNum).toEqual(5);
        } else {
          expect(trackingMessNum).toEqual(total);
        }
      });

      await test.step("Check hiển thị 'view tracking log'", async () => {
        const shipmentStatus = await thankYouPage.getShipmentStatus(newPage);

        if (shipmentStatus != "Delivered") {
          await expect(newPage.locator("//a[text()[normalize-space()='View tracking log']]")).toBeVisible();

          const newPage2 = await pageCommon.clickElementAndNavigateNewTab(
            context,
            await thankYouPage.viewTrackingLogLink(newPage),
          );
          const title = await newPage2.url();
          await expect(title).toContain("t.17track.net");
        }
      });
    });
  });

  test("[PLB] Verify UI trang Thankyou/ Order status @TC_PLB_OTP_2", async ({ conf, context, dashboard }) => {
    const domain = conf.suiteConf.cases.TC_PLB_OTP_2.domain;
    const ordersPage = new OrdersPage(dashboard, domain);
    const pageCommon = new SBPage(dashboard, domain);
    const thankYouPage = new ThankYouPage(dashboard, domain);

    let newPage: Page;

    await test.step("Đến trang order status page", async () => {
      const orderId = conf.caseConf.order_id;
      await ordersPage.goToOrderByOrderId(orderId);
      (await thankYouPage.viewOrderStatusPageText()).isVisible();
      newPage = await pageCommon.clickElementAndNavigateNewTab(context, await thankYouPage.viewOrderStatusPageText());
    });

    await test.step("Check order tracking", async () => {
      await newPage.waitForSelector("//div[@class= 'fulfillment__to']");
      await expect(
        newPage.locator("//div[@class='fulfillment__tracking-number__info']//*[contains(text(),'Number')]"),
      ).toBeVisible();
      await expect(newPage.locator("//button/span[@class='fulfillment__copy']")).toBeVisible();
      await expect(newPage.locator("//span[@class='fulfillment__shipment-status']")).toBeVisible();
      await expect(newPage.locator("//span[text()[normalize-space()='View more']]")).toBeVisible();
      await expect(newPage.locator("//button[@class='s-button step__contact-us-button']")).toBeVisible();
      await expect(newPage.locator("//a[text()[normalize-space()='View tracking log']]")).not.toBeVisible();

      /***
       * verify color of shipment status Delivered = màu xanh
       */
      const shipmentStatus = thankYouPage.getShipmentStatus(newPage);
      const statusColor = thankYouPage.getStatusColor(newPage);
      if (
        (await shipmentStatus) === "Delivered" ||
        (await shipmentStatus) === "Ready For Pickup" ||
        (await shipmentStatus) === "Tracking Created" ||
        (await shipmentStatus) === "In transit"
      ) {
        expect(await statusColor).toBe("rgb(63, 188, 26)");
      } else if ((await shipmentStatus) === "Processing" || (await shipmentStatus) === "Synchronizing") {
        expect(await statusColor).toBe("rgb(212, 149, 2)");
      } else if ((await shipmentStatus) === "Undelivered") {
        expect(await statusColor).toBe("rgb(209, 27, 39)");
      }
    });

    await test.step("Check message trả về", async () => {
      const trackingStep = conf.caseConf.tracking_steps_Plb;
      const listContent = await thankYouPage.getContentTrackingStep(newPage, trackingStep.length);

      for (let i = 0; i < (await listContent).length; i++) {
        const contentUi = listContent[i];
        const stepData = trackingStep[i];
        const locationTS = stepData.location;
        let contenExpected = `${stepData.location}, ${stepData.message}`;

        if (locationTS === "") {
          contenExpected = stepData.message.trim();
        }
        await expect(contentUi).toEqual(contenExpected);
      }
    });

    await test.step("Verify khi click vào 'View more' và 'View less'", async () => {
      const total = await thankYouPage.getTotalTrackingMessage(newPage);
      const trackingMessNum = await thankYouPage.getTrackingMessageNum(newPage);
      if (total > 5) {
        expect(trackingMessNum).toEqual(5);
      } else {
        expect(trackingMessNum).toEqual(total);
      }
    });
  });
});
