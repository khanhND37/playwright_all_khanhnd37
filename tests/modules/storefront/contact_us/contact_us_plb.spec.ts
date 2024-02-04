import { expect } from "@playwright/test";
import { test } from "@fixtures/odoo";
import { DashboardPage } from "@pages/dashboard/dashboard";
import type { ShippingAddress } from "@types";
import { SFCheckout } from "@pages/storefront/checkout";
import { ContactUsPage } from "@pages/storefront/contact_us";
import { loadData } from "@core/conf/conf";
import { buildOrderTimelineMsg } from "@core/utils/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { MailBox } from "@pages/thirdparty/mailbox";

let orderName: string;
let orderId: number;
let shopDomain: string;
let plbToken: string;
let shippingAddress: ShippingAddress;
let checkout: SFCheckout;
let plbDashboardPage: DashboardPage;
let contactUsPage: ContactUsPage;
let totalTimeLine: number;
let mailBox: MailBox;

test.describe("Verify send email confirm order", async () => {
  test.beforeEach(async ({ page, conf, request }) => {
    test.setTimeout(conf.suiteConf.time_out);
    shopDomain = conf.suiteConf.domain;
    shippingAddress = conf.suiteConf.shipping_address;
    totalTimeLine = conf.suiteConf.total_time_line;
    plbDashboardPage = new DashboardPage(page, shopDomain);
    contactUsPage = new ContactUsPage(page, shopDomain);
    checkout = new SFCheckout(page, shopDomain, null, request);

    plbToken = await plbDashboardPage.getAccessToken({
      shopId: conf.suiteConf["shop_id"],
      userId: conf.suiteConf["user_id"],
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf["username"],
      password: conf.suiteConf["password"],
    });

    // checkout order
    const infoOrder = await checkout.createStripeOrder(
      conf.suiteConf.product_info.name,
      conf.suiteConf.product_info.quantity,
      conf.suiteConf.shipping_address,
      null,
    );
    orderName = infoOrder.orderName;
    orderId = Number(await checkout.getOrderIdBySDK());
  });
  const caseName = "SB_SF_CTPB_50";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(({ case_id: caseId, description: caseDescription, has_order_name: hasOrderName }) => {
    test(`@${caseId} ${caseDescription}`, async ({}) => {
      await test.step(`Tại field Issue type, Select  "I have not received order confirmation email", "I have not received order confirmation email"
    - Fill trường Order number
    - Nhập email giống email trong order
    - Thực hiện Submit form`, async () => {
        await contactUsPage.goToContactUs();
        let myOrderName = null;
        if (hasOrderName) {
          myOrderName = orderName;
        }
        await contactUsPage.fillFormContactUs(shippingAddress.email, myOrderName, "confirm order", null);
        await expect(contactUsPage.messageSuccess).toBeVisible();
      });
      await test.step(`  Đi  đến  order  detail  >  Verify  timeline  log  `, async () => {
        const orderPage = await checkout.openOrderByAPI(orderId, plbToken, "plusbase");
        const ordTimelineConfirm = buildOrderTimelineMsg(
          shippingAddress.first_name,
          shippingAddress.last_name,
          shippingAddress.email,
        ).timelineSendEmail;
        await expect(await orderPage.orderTimeLines(ordTimelineConfirm)).toBeVisible();
      });
      await test.step(`Login email của buyer > Verify email`, async () => {
        mailBox = await checkout.openMailBox(shippingAddress.email);
        await mailBox.openOrderConfirmationNotification(orderName);
        expect(await mailBox.isTextVisible(orderName)).toBeTruthy();
      });
    });
  });
});

test.describe("Verify sent email cancel order", async () => {
  test.beforeEach(async ({ page, conf, request }) => {
    test.setTimeout(conf.suiteConf.time_out);
    shopDomain = conf.suiteConf.domain;
    shippingAddress = conf.suiteConf.shipping_address;
    totalTimeLine = conf.suiteConf.total_time_line;
    plbDashboardPage = new DashboardPage(page, shopDomain);
    contactUsPage = new ContactUsPage(page, shopDomain);
    checkout = new SFCheckout(page, shopDomain, null, request);

    plbToken = await plbDashboardPage.getAccessToken({
      shopId: conf.suiteConf["shop_id"],
      userId: conf.suiteConf["user_id"],
      baseURL: conf.suiteConf["api"],
      username: conf.suiteConf["username"],
      password: conf.suiteConf["password"],
    });

    // checkout order
    const infoOrder = await checkout.createStripeOrder(
      conf.suiteConf.product_info.name,
      conf.suiteConf.product_info.quantity,
      conf.suiteConf.shipping_address,
      null,
    );
    orderName = infoOrder.orderName;
    orderId = Number(await checkout.getOrderIdBySDK());
  });
  test(`@SB_SF_CTPB_54 Verify sent request message và sent email khi chọn issue type "I want to cancel order"`, async ({
    conf,
  }) => {
    await test.step(`Tại field Issue type, Select  "I want to cancel order"-Select reason:"The price is too high/The shipping time is too long/I ordered a product multiple times and want to cancel the duplicate order/I checked the description and found out the product does not meet my/ Others"-   Fill   tất   cả   các   trường-   Thực   hiện   submit`, async () => {
      await contactUsPage.goToContactUs();
      await contactUsPage.fillFormContactUs(shippingAddress.email, orderName, "Cancel", conf.caseConf.issue_reason);
      await expect(contactUsPage.messageSuccessCancel).toBeVisible();
    });
    await test.step(`Login mail buyer > Verify email > Click" Cancel now"> Xác nhận cancel`, async () => {
      mailBox = await checkout.openMailBox(shippingAddress.email);
      await expect(async () => {
        contactUsPage = await mailBox.confirmCancelOrdInMailBox(orderName);
        await expect(contactUsPage.popupConfirmCancelOrd).toBeVisible();
        await contactUsPage.confirmCancelOrd();
        await expect(contactUsPage.confirmCancelOrdSuccess).toBeVisible();
      }).toPass();
    });
    await test.step(`Đi đến order detail > Verify status > Verify timeline log`, async () => {
      const orderPage = await checkout.openOrderByAPI(orderId, plbToken, "plusbase");
      await orderPage.reloadUntilOrdCapture("");
      const orderStatus = await orderPage.getOrderStatus();
      expect(orderStatus).toEqual("Voided");
      const ordTimelineConfirm = buildOrderTimelineMsg(
        shippingAddress.first_name,
        shippingAddress.last_name,
        shippingAddress.email,
      ).timelineCancelOrdPlbaseByContactUsForm;
      const ordTimelineSentMailCancel = buildOrderTimelineMsg(
        shippingAddress.first_name,
        shippingAddress.last_name,
        shippingAddress.email,
      ).timelineSentCancelMailPlbase;
      await expect(async () => {
        await orderPage.page.reload();
        await expect(await orderPage.orderTimeLines(ordTimelineConfirm)).toBeVisible();
        await expect(await orderPage.orderTimeLines(ordTimelineSentMailCancel)).toBeVisible();
      }).toPass();
    });
  });
});

test.describe("Verify validation field email, limit send email", async () => {
  test.beforeEach(async ({ conf, page }) => {
    shopDomain = conf.suiteConf.domain;
    shippingAddress = conf.suiteConf.shipping_address;
    contactUsPage = new ContactUsPage(page, shopDomain);
    totalTimeLine = conf.suiteConf.total_time_line;
  });
  const caseName = "SB_SF_CTPB_53";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    ({
      case_id: caseId,
      description: caseDescription,
      order_name: ordName,
      order_id: ordId,
      issue_reason: issueReason,
      issue_type: issueType,
    }) => {
      test(`@${caseId} ${caseDescription}`, async ({ page, dashboard, request }) => {
        checkout = new SFCheckout(page, shopDomain, null, request);
        const orderPage = new OrdersPage(dashboard, shopDomain);
        await test.step(`-Tại field Issue type, Select "I have not received order confirmation email","I have not received order confirmation email"
    -  Fill tất cả các trường
    -  Thực hiện Submit form`, async () => {
          await contactUsPage.goToContactUs();
          await contactUsPage.fillFormContactUs(shippingAddress.email, ordName, issueType, issueReason);
          await expect(contactUsPage.messageSuccess).toBeVisible();
        });
        await test.step(`Đi đến order detail > Verify timeline log`, async () => {
          await orderPage.goToOrderByOrderId(ordId);
          const ordTimelineConfirm = buildOrderTimelineMsg(
            shippingAddress.first_name,
            shippingAddress.last_name,
            shippingAddress.email,
          );
          if (issueType === "confirm order") {
            expect(await orderPage.countTimeLine(ordTimelineConfirm.timelineSendEmail)).toEqual(totalTimeLine);
          } else {
            expect(await orderPage.countTimeLine(ordTimelineConfirm.timeLineShippingConfirmation)).toEqual(
              totalTimeLine,
            );
          }
        });
        await test.step(`Login email của buyer > Verify email`, async () => {
          mailBox = await checkout.openMailBox(shippingAddress.email);
          expect(await mailBox.isTextVisible(orderName)).toBeFalsy();
        });
      });
    },
  );

  test(`@SB_SF_CTPB_52 Verify send email trong trường hợp select issues type = "I have not received order confirmation email" không fill-in Order number field,  email chưa có purchase order`, async ({
    conf,
  }) => {
    await test.step(`Tại field Issue type, Select  "I have not received order confirmation email"
  - Bỏ trống trường Order number
  - Nhập email chưa có purchase order
  - Fill các trường còn lại
  - Thực hiện submit form `, async () => {
      await contactUsPage.goToContactUs();
      await contactUsPage.fillFormContactUs(conf.caseConf.email_no_purchase, null, "confirm order", null);
      await expect(contactUsPage.messageEmailError).toBeVisible();
    });
  });
});
