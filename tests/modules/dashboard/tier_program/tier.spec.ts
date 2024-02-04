import { expect, test } from "@core/fixtures";
import { OrdersPage } from "@pages/dashboard/orders";
import { TierProgramPage } from "@pages/dashboard/tier";
import { TierByAPI } from "@pages/dashboard/tier_api";
import { HivePBase } from "@pages/hive/hivePBase";
import { HiveSBaseOld } from "@pages/hive/hiveSBaseOld";
import { HiveTier } from "@pages/hive/hive_tier";
import { SFCheckout } from "@pages/storefront/checkout";
import type { ShortOrderAfterCheckoutInfo } from "@types";

test.describe("Tier program", async () => {
  test("Check update Tier star và Redeem star của User trên Dashboard Tier @SB_PN_TP_UTIER_DASHBOARD_24", async ({
    hivePBase,
    dashboard,
    page,
    conf,
    token,
    authRequest,
  }) => {
    let tierStars: number;
    let redeemStars: number;
    let orderCheckoutInfo: ShortOrderAfterCheckoutInfo;
    let orderPage: OrdersPage;
    const productCheckout = conf.suiteConf.products;
    const productRefund = conf.suiteConf.product_refund;
    const productCancel = conf.suiteConf.product_cancel;
    const baseRate = conf.suiteConf.base_rate;
    const tierProgramPage = new TierProgramPage(dashboard, conf.suiteConf.domain);
    const checkout = new SFCheckout(page, conf.suiteConf.domain);
    const tierAPI = new TierByAPI(conf.suiteConf.domain, authRequest);
    const hivePb = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
    const tokenObject = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = tokenObject.access_token;
    const result = await tierAPI.getTierDetailByAPI();

    await test.step("Vào Dashboard shop PB>Click menu góc trái > Chọn Checkout Printbase Tier Program", async () => {
      await dashboard.waitForSelector(".nav-sidebar");
      await tierProgramPage.gotoTierPage();
    });

    await test.step("Click menu góc trái > Chọn Checkout Printbase Tier Program", async () => {
      // verify tier stars before checking out a new order
      tierStars = await tierProgramPage.getTierStars();
      expect(tierStars).toEqual(result.data.user_tier.rank_coin ?? 0);

      // verify redeem stars before checking out a new order
      redeemStars = await tierProgramPage.getRedeemStars();
      expect(redeemStars).toEqual(result.data.user_tier.available_coin ?? 0);
    });

    await test.step("Checkout thành công product là Silver Base và Gold base", async () => {
      orderCheckoutInfo = await checkout.createOrderMultiProductOnePage(
        conf.suiteConf.customer_info,
        productCheckout,
        conf.suiteConf.card,
      );

      //verify order detail in dashboard
      orderPage = await checkout.openOrderPrintbaseByAPI(orderCheckoutInfo.orderId, accessToken);
      const actualTotalOrder = await orderPage.getTotalOrder();
      expect(actualTotalOrder.replace(",", ".")).toEqual(orderCheckoutInfo.totalSF);
      await dashboard.waitForLoadState("load");
    });

    await test.step("Vào dashboard > Click menu góc trái > Chọn Checkout Printbase Tier Program", async () => {
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await dashboard.waitForTimeout(conf.caseConf.time_out);
      await dashboard.reload();

      // verify tierstars and redeemstars after checking out successfully
      tierStars = await tierProgramPage.formualStarsAfterCheckout(
        tierStars,
        productCheckout,
        baseRate.silverbase,
        baseRate.goldbase,
      );
      redeemStars = await tierProgramPage.formualStarsAfterCheckout(
        redeemStars,
        productCheckout,
        baseRate.silverbase,
        baseRate.goldbase,
      );
      const newTier = await tierProgramPage.getTierStars();
      const newRedeem = await tierProgramPage.getRedeemStars();

      expect(newTier).toEqual(tierStars);
      expect(newRedeem).toEqual(redeemStars);
    });

    await test.step("Vào menu Customer Support> PBase orders>tìm kiếm order>click vào Order name", async () => {
      await hivePb.goToOrderDetail(orderCheckoutInfo.orderId);
    });

    await test.step("Click Approve order", async () => {
      await hivePb.clickCalculate();
      await hivePb.approveOrder();
      await hivePBase.waitForTimeout(conf.caseConf.time_out_hive);
      await hivePBase.reload();
    });

    await test.step("Click Refund > Input số lượng > click btn Refund", async () => {
      await hivePb.refundMultiProductPbase(orderCheckoutInfo.orderId, productRefund);
      //verify order status after refund
      await page.reload();
      const actualStatus = await checkout.getStatusOrder(true);
      expect(actualStatus).toEqual("Partially refunded");
    });

    await test.step("Vào dashboard > Click menu góc trái > Chọn Checkout Printbase Tier Program", async () => {
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await dashboard.waitForTimeout(conf.caseConf.time_out);
      await dashboard.reload(); //await tierProgramPage.gotoTierPage();

      const newTier = await tierProgramPage.getTierStars();
      const newRedeem = await tierProgramPage.getRedeemStars();
      tierStars = await tierProgramPage.formualStarsAfterRefund(
        tierStars,
        productRefund,
        baseRate.silverbase,
        baseRate.goldbase,
      );
      redeemStars = await tierProgramPage.formualStarsAfterRefund(
        redeemStars,
        productRefund,
        baseRate.silverbase,
        baseRate.goldbase,
      );

      expect(newTier).toEqual(tierStars);
      expect(newRedeem).toEqual(redeemStars);
    });

    await test.step("Vào Hive printbase>tìm kiếm order>click vào Order name>click Cancel", async () => {
      //goto cancel order page and complete cancel*/
      await hivePb.goToCancelPageAndCancelOrder(orderCheckoutInfo.orderId);
      //verify order status after cancel order **/
      await page.reload();
      const actualStatus = await checkout.getStatusOrder(false);
      expect(actualStatus).toEqual("Cancelled");
    });

    await test.step("Vào dashboard > Click menu góc trái > Chọn Checkout Printbase Tier Program", async () => {
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await dashboard.waitForTimeout(conf.caseConf.time_out);
      await dashboard.reload();
      const newTier = await tierProgramPage.getTierStars();
      const newRedeem = await tierProgramPage.getRedeemStars();

      tierStars = await tierProgramPage.formualStarsAfterRefund(
        tierStars,
        productCancel,
        baseRate.silverbase,
        baseRate.goldbase,
      );
      redeemStars = await tierProgramPage.formualStarsAfterRefund(
        redeemStars,
        productCancel,
        baseRate.silverbase,
        baseRate.goldbase,
      );

      expect(newTier).toEqual(tierStars);
      expect(newRedeem).toEqual(redeemStars);
    });
  });
  test("Check update Tier star và Redeem star của User trong Hive Shopbase @SB_PN_TP_UTIER_DASHBOARD_25", async ({
    hivePBase,
    hiveSBase,
    page,
    conf,
    token,
  }) => {
    let tierStar: number;
    let redeemStar: number;
    let orderId: number;
    let totalOrderSF: string;
    let orderCheckoutInfo: ShortOrderAfterCheckoutInfo;
    let orderPage: OrdersPage;
    const productCheckout = conf.suiteConf.products;
    const productRefund = conf.suiteConf.product_refund;
    const productCancel = conf.suiteConf.product_cancel;
    const baseRate = conf.suiteConf.base_rate;
    const starInput = conf.caseConf.stars_input;
    const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
    const userTierInHive = new HiveTier(hiveSBase, conf.suiteConf.hive_domain);
    const hivePb = new HivePBase(hivePBase, conf.suiteConf.hive_pb_domain);
    const checkout = new SFCheckout(page, conf.suiteConf.domain);
    const tierProgramPage = new TierProgramPage(page, conf.suiteConf.domain);

    const tokenObject = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    const accessToken = tokenObject.access_token;

    await test.step("Click menu Shop > Users >Tìm kiếm và click Edit user >verify thông tin User Tier", async () => {
      await hiveSB.goToUserDetail(conf.suiteConf.user_id);

      //get tier star,redeem star before editing
      tierStar = await userTierInHive.getTierStar();
      redeemStar = await userTierInHive.getRedeemStar();
    });

    await test.step("Input số lượng Tier star vào button + > click Update", async () => {
      //add star and update user/
      await userTierInHive.inputStar(starInput.add_star, starInput.label_tier);

      //verify tier star after editing
      tierStar += parseInt(starInput.add_star);
      const newTier = await userTierInHive.getTierStar();
      expect(newTier).toEqual(tierStar);
    });

    await test.step("Input số lượng Tier star vào button - > click Update", async () => {
      //add star and update user
      await userTierInHive.inputStar(starInput.sub_star, starInput.label_tier);

      //verify tier star after editing
      tierStar += parseInt(starInput.sub_star);
      const newTier = await userTierInHive.getTierStar();
      expect(newTier).toEqual(tierStar);
    });

    await test.step("Input số lượng Redeem star vào button + > click Update", async () => {
      //add star and update user
      await userTierInHive.inputStar(starInput.add_star, starInput.label_redeem);

      //verify redeem star after editing
      redeemStar += parseInt(starInput.add_star);
      const newRedeem = await userTierInHive.getRedeemStar();
      expect(newRedeem).toEqual(redeemStar);
    });

    await test.step("Input số lượng Redeem star vào button - > click Update", async () => {
      //add star and update user
      await userTierInHive.inputStar(starInput.sub_star, starInput.label_redeem);

      //verify redeem star after editing
      redeemStar += parseInt(starInput.sub_star);
      const newRedeem = await userTierInHive.getRedeemStar();
      expect(newRedeem).toEqual(redeemStar);
    });

    await test.step("Checkout thành công product là Silver Base và Gold base", async () => {
      orderCheckoutInfo = await checkout.createOrderMultiProductOnePage(
        conf.suiteConf.customer_info,
        productCheckout,
        conf.suiteConf.card,
      );
      totalOrderSF = orderCheckoutInfo.totalSF;
      orderId = orderCheckoutInfo.orderId;

      //verify order detail in dashboard
      orderPage = await checkout.openOrderPrintbaseByAPI(orderId, accessToken);
      const actualTotalOrder = await orderPage.getTotalOrder();
      expect(actualTotalOrder.replace(",", ".")).toEqual(totalOrderSF);
      await page.waitForLoadState("load");
    });

    await test.step("Vào Hive shopbase > verify thông tin User Tier", async () => {
      //go to user detail page
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(conf.caseConf.time_out);
      await hiveSBase.reload();

      //get new tier and new redeem after checking out
      tierStar = await tierProgramPage.formualStarsAfterCheckout(
        tierStar,
        productCheckout,
        baseRate.silverbase,
        baseRate.goldbase,
      );
      redeemStar = await tierProgramPage.formualStarsAfterCheckout(
        redeemStar,
        productCheckout,
        baseRate.silverbase,
        baseRate.goldbase,
      );

      expect(await userTierInHive.getTierStar()).toEqual(tierStar);
      expect(await userTierInHive.getRedeemStar()).toEqual(redeemStar);
    });

    await test.step("Click menu Customer Support >PBase orders > tìm kiếm order >click vào Order name", async () => {
      await hivePb.goToOrderDetail(orderId);
    });

    await test.step("Click Approve order", async () => {
      await hivePb.clickCalculate();
      await hivePb.approveOrder();
      await hivePBase.waitForTimeout(conf.caseConf.time_out_hive);
      await hivePBase.reload();
    });

    await test.step("Click Refund > Input số lượng > click btn Refund", async () => {
      //go to refund page
      //await hivePb.refundMultiProductPbase(orderId, productRefund);

      // verify order status after refund
      await page.reload();
      const actualStatus = await checkout.getStatusOrder(true);
      expect(actualStatus).toEqual("Partially refunded");
    });

    await test.step("Vào Hive shopbase > verify thông tin User Tier sau khi refund order", async () => {
      // go to user detail page
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(conf.caseConf.time_out);
      await hiveSBase.reload();

      // get new tier and new redeem after refunding
      tierStar = await tierProgramPage.formualStarsAfterRefund(
        tierStar,
        productRefund,
        baseRate.silverbase,
        baseRate.goldbase,
      );
      redeemStar = await tierProgramPage.formualStarsAfterRefund(
        redeemStar,
        productRefund,
        baseRate.silverbase,
        baseRate.goldbase,
      );

      expect(await userTierInHive.getTierStar()).toEqual(tierStar);
      expect(await userTierInHive.getRedeemStar()).toEqual(redeemStar);
    });

    await test.step("Vào Hive printbase >tìm kiếm order >click Cancel order", async () => {
      // goto cancel order page and complete cancel
      await hivePb.goToCancelPageAndCancelOrder(orderId);

      // verify order status after cancel order
      await page.reload();
      const actualStatus = await checkout.getStatusOrder(false);
      expect(actualStatus).toEqual("Cancelled");
    });

    await test.step("Vào Hive shopbase > verify thông tin User Tier sau khi cancel order", async () => {
      // go to user detail page
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(conf.caseConf.time_out);
      await hiveSBase.reload();

      //get new tier and new redeem after canceling
      tierStar = await tierProgramPage.formualStarsAfterRefund(
        tierStar,
        productCancel,
        baseRate.silverbase,
        baseRate.goldbase,
      );
      redeemStar = await tierProgramPage.formualStarsAfterRefund(
        redeemStar,
        productCancel,
        baseRate.silverbase,
        baseRate.goldbase,
      );
      const newTier = await userTierInHive.getTierStar();
      const newRedeem = await userTierInHive.getRedeemStar();
      expect(newTier).toEqual(tierStar);
      expect(newRedeem).toEqual(redeemStar);
    });
  });

  test(`Check redeem thành công một mốc Reward @SB_PN_TP_UTIER_DASHBOARD_27`, async ({
    hiveSBase,
    dashboard,
    conf,
    authRequest,
  }) => {
    let redeemStars: number;
    let rewardPrice: string;
    let rewardName: string;
    let tierStars: number;
    let tierName: string;
    let totalRequest: number;
    const tierProgramPage = new TierProgramPage(dashboard, conf.suiteConf.domain);
    const tierAPI = new TierByAPI(conf.suiteConf.domain, authRequest);
    const hiveSB = new HiveSBaseOld(hiveSBase, conf.suiteConf.hive_domain);
    const hiveTier = new HiveTier(hiveSBase, conf.suiteConf.domain);

    for (let i = 0; i < 2; i++) {
      await test.step(`Chọn button Reddem của bất kỳ Reward nào đang active`, async () => {
        //go to Checkout Tier Program Page
        await tierProgramPage.gotoTierPage();
        const result = await tierAPI.getTierDetailByAPI();
        //Verify redeem stars before redeem a reward
        redeemStars = await tierProgramPage.getRedeemStars();
        expect(redeemStars).toEqual(result.data.user_tier.available_coin);

        // get tier level,tier stars before redeem a reward
        tierName = await tierProgramPage.getTierName();
        tierStars = await tierProgramPage.getTierStars();
        //get list active rewards
        const rewardActive = await tierProgramPage.getRewardActive(redeemStars);
        const img = (await dashboard.getAttribute("(//div[@class='money-bag-icon'])[1]//img", "src")).split("/img/");
        if (img[1] !== conf.caseConf.icon_bag) {
          //go to hive shopbase > Redeem requests
          await hiveSB.gotoRedeemRequestPage();
          // get total request in Redeem request page before redeem
          totalRequest = await hiveTier.getTotalRequestByEmail(conf.suiteConf.username);
        }
        if (rewardActive.length > 0) {
          rewardName = await tierProgramPage.getRewardName();
          rewardPrice = await tierProgramPage.getRewardPrice();
          if (redeemStars < parseFloat(rewardPrice) * 2) {
            await hiveSB.goToUserDetail(conf.suiteConf.user_id);
            await hiveTier.inputStar(parseFloat(rewardPrice) * 2, conf.caseConf.label_redeem);
            redeemStars += parseFloat(rewardPrice) * 2;
          }
          await dashboard.locator("(//div[@class='button-redeem'])[1]//button").click();
        }
      });

      await test.step(`Click Confirm`, async () => {
        //click btn confirm
        const actualMsg = await tierProgramPage.getPopupCofirmRedeemInfo();
        expect(actualMsg).toEqual(`Do you confirm to redeem ${rewardPrice} stars for ${rewardName} ?`);
        await tierProgramPage.clickBtnConfirm();
        await dashboard.waitForSelector("//h4[normalize-space()='Success']");

        //get actual request when click redeem  reward
        const actualRequest = {
          email: conf.suiteConf.username,
          tierName: tierName,
          giftName: rewardName,
          status: "Under review",
        };

        //check balance after redeeming Cash reward successfully
        if (await dashboard.locator("//span[normalize-space()='See your balance']").isVisible()) {
          const actualAmount = await tierProgramPage.getBalanceAfterRedeem();
          expect(actualAmount).toEqual(rewardName);
        } else {
          await dashboard.locator("//span[normalize-space()='Close']").click();
          //check display request in hive redeeming Gift reward successfully
          await hiveSBase.reload();
          const newTotalRequest = await hiveTier.getTotalRequestByEmail(conf.caseConf.username);
          if (newTotalRequest == totalRequest + 1) {
            const getRequest = await hiveTier.getRequestInfoByEmail();
            expect(actualRequest).toEqual(
              expect.objectContaining({
                email: getRequest.email,
                tierName: getRequest.tierName,
                giftName: getRequest.giftName,
                status: getRequest.status,
              }),
            );
          }
        }
        // verify redeem stars after redeem reward
        const newRedeemObject = await tierAPI.getTierDetailByAPI();
        redeemStars = redeemStars - parseFloat(rewardPrice.replaceAll(",", ""));
        expect(newRedeemObject.data.user_tier.available_coin).toEqual(redeemStars);

        //verify tier stars after redeem reward
        expect(newRedeemObject.data.user_tier.rank_coin ?? 0).toEqual(tierStars);
      });
    }
  });
});
