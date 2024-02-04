import { expect, test } from "@core/fixtures";
import { ContestPage } from "@pages/dashboard/contest";
import { SFCheckout } from "@sf_pages/checkout";
import { addDays, formatDate, getUnixTime } from "@utils/datetime";
import { HiveContest } from "@pages/hive/hive_contest";
import { HivePBase } from "@pages/hive/hivePBase";

test.describe("Full flow contest PrintBase @TS_SB_PN_TP1", async () => {
  let hiveContest: HiveContest;
  let hivePrPage: HivePBase;

  test(`[PrinBase] Verify In-contest and After contest PrintBase metric Points @SB_HP_CT_CT_Auto_10`, async ({
    dashboard,
    hivePBase,
    conf,
  }) => {
    let pointContest: number, expPoints: number;
    let orderID1, orderID3;
    const domain = conf.caseConf.domain;
    const baseRate = conf.suiteConf.base_rate;
    const domainHive = conf.suiteConf.hive_pb_domain;

    const checkout = new SFCheckout(dashboard, domain, "");
    const contestPage = new ContestPage(dashboard, domain);
    hivePrPage = new HivePBase(hivePBase, domainHive);
    let endDate;

    const calculatePointContests = async (baseProduct: string, quantity: number): Promise<number> => {
      let point: number;
      switch (baseProduct) {
        case "Silver Base":
          point = baseRate.silverbase * quantity;
          break;
        case "Gold Base":
          point = baseRate.goldbase * quantity;
          break;
      }
      return point;
    };

    const order1 = conf.caseConf.orders[0];
    const order2 = conf.caseConf.orders[1];
    const order3 = conf.caseConf.orders[2];

    await test.step(`Create Order 1 - Silver Base:`, async () => {
      await checkout.createStripeOrder(
        order1.product,
        order1.quantity.toString(),
        conf.suiteConf.customer_info,
        order1.discount.code,
        conf.suiteConf.card_info,
        order1.productQtyClass,
        order1.options,
      );
      orderID1 = await checkout.getOrderIdBySDK();
      expPoints = await calculatePointContests(order1.baseProduct, order1.quantity);
    });
    await test.step(`Enable Contest:`, async () => {
      await hiveContest.searchAndEnableContest(conf.caseConf.contest_name, true);
      expPoints = expPoints + (await contestPage.getPointContest());
    });
    await test.step(`Create Order 2 - Silver Base:`, async () => {
      await checkout.createStripeOrder(
        order2.product,
        order2.quantity.toString(),
        conf.suiteConf.customer_info,
        order2.discount.code,
        conf.suiteConf.card_info,
        order2.productQtyClass,
        order2.options,
      );
      await checkout.getOrderIdBySDK();
      expPoints = expPoints + (await calculatePointContests(order2.baseProduct, order2.quantity));
    });
    await test.step(`Create Order 3 - Gold Base:`, async () => {
      await checkout.createStripeOrder(
        order3.product,
        order3.quantity.toString(),
        conf.suiteConf.customer_info,
        order3.discount.code,
        conf.suiteConf.card_info,
        order3.productQtyClass,
        order3.options,
      );
      orderID3 = await checkout.getOrderIdBySDK();
      expPoints = await calculatePointContests(order3.baseProduct, order3.quantity);
    });

    await test.step(`Thay đổi thời gian kết thúc ngay tại thời điểm hiện tại- Today:`, async () => {
      await hiveContest.goto(`/admin/contest/list`);
      await hiveContest.searchAndEnableContest(conf.caseConf.contest_logic.contest_name, false);
      await hiveContest.clickOnBtnWithLabel("Update");
      endDate = formatDate(getUnixTime() / 1000, "DD/MM/YYYY hh:mm");
      await hiveContest.selectEndTime(endDate);
      await hiveContest.enableContest(true);
      await hiveContest.clickOnBtnWithLabel("Update and close");
      await expect(hiveContest.genLoc("//div[@class='alert alert-success alert-dismissable']")).toContainText(
        "has been successfully updated.",
      );
    });
    await test.step(`Edit thời gian kết thúc contest là Today+30`, async () => {
      await hiveContest.goto(`/admin/contest/list`);
      await hiveContest.searchAndEnableContest(conf.caseConf.contest_logic.contest_name, false);
      await hiveContest.clickOnBtnWithLabel("Update");
      endDate = formatDate(getUnixTime(addDays(30)) / 1000, "DD/MM/YYYY");
      await hiveContest.selectEndTime(endDate);
      await hiveContest.enableContest(true);
      await hiveContest.clickOnBtnWithLabel("Update and close");
      await expect(hiveContest.genLoc("//div[@class='alert alert-success alert-dismissable']")).toContainText(
        "has been successfully updated.",
      );
    });
    const refundInfo = conf.caseConf.refund_info;
    await test.step(`Đăng nhập dashboard shop PrintBase. Tại trang Home page -> Check hiển thị màn in-contest`, async () => {
      pointContest = await contestPage.getPointContest();
    });
    await test.step(`Cancel Order 1`, async () => {
      await hivePrPage.goToCancelPageAndCancelOrder(orderID1, order1.quantity);
      expPoints = expPoints - (await calculatePointContests(order1.baseProduct, order1.quantity));
    });

    await test.step(`Refund Order 3`, async () => {
      await hivePrPage.goToRefundPage(orderID3);
      await hivePrPage.inputInformationOfOrderToRefund(refundInfo);
      await hivePrPage.clickBtnRefund();
    });

    await test.step(`Wait 10 phút. Đăng nhập dashboard shop PrintBase. Tại trang Home page -> Check hiển thị tăng giá trị thanh progress bar`, async () => {
      await dashboard.reload();
      const newPointContest = await contestPage.getPointContest();
      expect(newPointContest).toEqual(expPoints);
    });

    await test.step(`Wait 10 phút. Đăng nhập dashboard shop PrintBase. Tại trang Home page -> Check hiển thị tăng giá trị thanh progress bar`, async () => {
      let expectPointContest: number;
      const baseProduct = await contestPage.getPointOrder();
      const quantity = await contestPage.getQuantity();
      if (baseProduct == "Silver Base") {
        expectPointContest = pointContest + baseRate.silverbase * quantity;
      } else if (baseProduct == "Gold Base") {
        expectPointContest = pointContest + baseRate.goldbase * quantity;
      }
      await dashboard.waitForTimeout(conf.suiteConf.timeout);
      await dashboard.goto(`https://${domain}/admin/`);
      const newPointContest = await contestPage.getPointContest();

      expect(newPointContest).toEqual(expectPointContest);
    });
    await test.step(`Vào hive, off contest đang chạy`, async () => {
      await hiveContest.searchAndEnableContest(conf.caseConf.contest_name, false);
    });
  });
});
