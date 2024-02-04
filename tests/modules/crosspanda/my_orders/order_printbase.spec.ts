import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { MyOrdersPage } from "@pages/crosspanda/my_orders";
import { HivePBase } from "@pages/hive/hivePBase";
import { loadData } from "@core/conf/conf";

let orderName: string;
let orderId: number;
let myOrdersPage: MyOrdersPage;
let hivePBasePage: HivePBase;
let hivePbDomain: string;
let messageMapProduct: string;
const orderData = {};
test.describe("POD Cross Panda", () => {
  const caseName = "DATA_ORDER";
  const suitConfLoad = loadData(__dirname, caseName);
  test.beforeEach(async ({ conf }) => {
    messageMapProduct = conf.suiteConf.message_map_product;
    test.setTimeout(conf.suiteConf.timeout);
  });

  suitConfLoad.caseConf.data.forEach(testCase => {
    test(`${testCase.title} - @${testCase.case_id}`, async ({ hivePBase, crossPanda, conf, authRequest }) => {
      hivePbDomain = conf.suiteConf.hive_pb_domain;
      hivePBasePage = new HivePBase(hivePBase, hivePbDomain);
      await test.step("Thực hiện checkout sản phẩm thành công > Vào Hive approved order vừa tạo", async () => {
        const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest);
        const productsCheckout = testCase.products_checkout;

        await checkoutAPI.createAnOrderWithCreditCard({
          productsCheckout: productsCheckout,
        });

        orderName = (await checkoutAPI.getOrderInfo(authRequest)).name;
        orderId = (await checkoutAPI.getOrderInfo(authRequest)).id;
        orderData[`${testCase.case_id}`] = {};
        orderData[`${testCase.case_id}`]["id"] = orderId;
        orderData[`${testCase.case_id}`]["name"] = orderName;
        await hivePBasePage.goToOrderDetail(orderId);
        await hivePBasePage.approveOrder();
        await expect(hivePBasePage.genLoc(hivePBasePage.xpathSuccessMessage)).toBeVisible();
      });

      await test.step("Vào Xpanda > Search order vừa được tạo", async () => {
        myOrdersPage = new MyOrdersPage(crossPanda, conf.suiteConf.crosspanda_domain);
        await myOrdersPage.gotoOrderAndSearchOrder(conf.suiteConf.domain, orderName);
        await myOrdersPage.mappingProduct(messageMapProduct);
      });

      await test.step("Vào Xpanda > Search order vừa được tạo", async () => {
        const productName = testCase.products_checkout[0].product_name;
        const productVariant = testCase.products_checkout[0].variant;
        const orderQuantity = testCase.products_checkout[0].quantity;
        myOrdersPage = new MyOrdersPage(crossPanda, conf.suiteConf.crosspanda_domain);
        await myOrdersPage.gotoOrderAndSearchOrder(conf.suiteConf.domain, orderName);
        const dataOrderCrossPandaTabName = testCase.data_order_cross_panda.tab_name;
        const dataOrderCrossPandaValue = testCase.data_order_cross_panda.value[0];
        for (let i = 0; i < dataOrderCrossPandaTabName.length; i++) {
          const tabName = dataOrderCrossPandaTabName[i];
          const value = Object.values(dataOrderCrossPandaValue)[i];
          expect(await myOrdersPage.countOrderCrossPandaInTab(tabName)).toEqual(value);
          if (value === 1) {
            await expect(await myOrdersPage.genLoc(myOrdersPage.getXpathOrderNoByOrderName(orderName))).toBeVisible();
            const productNameActual = (await myOrdersPage.genLoc(myOrdersPage.xpathProductTitle).textContent()).trim();
            const productVariantActual = (
              await myOrdersPage.genLoc(myOrdersPage.xpathProductVariant).textContent()
            ).trim();
            const quantityActual = parseInt(
              (await myOrdersPage.genLoc(myOrdersPage.xpathProductQuantity).textContent()).split(" ")[0].trim(),
            );
            expect(productNameActual).toEqual(productName);
            expect(productVariantActual).toEqual(productVariant);
            expect(quantityActual).toEqual(orderQuantity);
          }
        }
      });
      if (testCase.case_id == "SB_XPPOD_189") {
        const cancelQuantity = testCase.product_cancel[0].quantity;
        const productName = testCase.products_checkout[0].product_name;
        const productVariant = testCase.products_checkout[0].variant;
        const orderQuantity = testCase.products_checkout[0].quantity;
        await test.step("Customer Support > PBase Order > Search và mở detail order vừa được tạo > Thực hiện cancel order", async () => {
          await hivePBasePage.page.reload();
          await hivePBasePage.cancelOrderPbaseWithReason(
            testCase.product_field_cancel,
            orderId,
            testCase.product_cancel,
          );
          await expect(hivePBasePage.genLoc(hivePBasePage.xpathSuccessMessage)).toBeVisible();
        });

        await test.step("Vào Xpanda > Search order vừa được tạo", async () => {
          const remainingQuantity = orderQuantity - cancelQuantity;
          myOrdersPage = new MyOrdersPage(crossPanda, conf.suiteConf.crosspanda_domain);
          await myOrdersPage.gotoOrderAndSearchOrder(conf.suiteConf.domain, orderName);
          const dataOrderCrossPandaTabName = testCase.data_order_cross_panda.tab_name;
          const dataOrderCrossPandaValue = testCase.data_order_cross_panda.value[1];

          for (let i = 0; i < dataOrderCrossPandaTabName.length; i++) {
            const tabName = dataOrderCrossPandaTabName[i];
            const value = Object.values(dataOrderCrossPandaValue)[i];
            expect(await myOrdersPage.countOrderCrossPandaInTab(tabName)).toEqual(value);
            if (value === 1) {
              await expect(await myOrdersPage.genLoc(myOrdersPage.getXpathOrderNoByOrderName(orderName))).toBeVisible();
              const productNameActual = (
                await myOrdersPage.genLoc(myOrdersPage.xpathProductTitle).textContent()
              ).trim();
              const productVariantActual = (
                await myOrdersPage.genLoc(myOrdersPage.xpathProductVariant).textContent()
              ).trim();
              const quantityActual = parseInt(
                (await myOrdersPage.genLoc(myOrdersPage.xpathProductQuantity).textContent()).split(" ")[0].trim(),
              );
              expect(productNameActual).toEqual(productName);
              expect(productVariantActual).toEqual(productVariant);
              expect(quantityActual).toEqual(remainingQuantity);
            }
          }
        });
      }
    });
  });
});
