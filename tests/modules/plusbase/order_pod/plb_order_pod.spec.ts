/* eslint-disable max-len */
import { expect, test } from "@core/fixtures";
import { SFHome } from "@pages/storefront/homepage";
import { SFCheckout } from "@pages/storefront/checkout";
import { HivePBase } from "@pages/hive/hivePBase";
import type { OrderAfterCheckoutInfo, ShippingAddress } from "@types";
import { loadData } from "@core/conf/conf";

let orderName: string;
let orderId: number;
let shopDomain: string;
let shippingAddress: ShippingAddress;
let checkout: SFCheckout;
let hivePBase: HivePBase;
let hivePbDomain: string;
let hiveUsername: string;
let hivePasswd: string;
let infoOrder: OrderAfterCheckoutInfo;
let firstName: string;
let lastName: string;
let country: string;
let zipcode: string;
let email: string;

test.describe("Order POD in store Plusbase", async () => {
  const caseName = "SB_PLB_PODPL_PODPO_1";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(({ case_id: caseId, description: caseDescription, products: products }) => {
    test(`${caseDescription} with case code @${caseId}`, async ({ conf, page }) => {
      shopDomain = conf.suiteConf.domain_store;
      shippingAddress = conf.suiteConf.shipping_address;
      firstName = conf.suiteConf.shipping_address.first_name;
      lastName = conf.suiteConf.shipping_address.last_name;
      country = conf.suiteConf.shipping_address.country;
      zipcode = conf.suiteConf.shipping_address.zipcode;
      email = conf.suiteConf.shipping_address.email;
      test.setTimeout(conf.suiteConf.time_out);

      // Tạo order
      const homepage = new SFHome(page, shopDomain);
      await homepage.gotoHomePage();
      checkout = new SFCheckout(page, conf.suiteConf.domain_store);
      infoOrder = await checkout.createStripeOrderMultiProduct(
        shippingAddress,
        null,
        products,
        conf.suiteConf.card_info,
      );
      await checkout.addProductPostPurchase(null);

      orderId = infoOrder.orderId;
      orderName = infoOrder.orderName;

      // Hive pbase:
      hivePbDomain = conf.suiteConf.hive_info.domain;
      hiveUsername = conf.suiteConf.hive_info.username;
      hivePasswd = conf.suiteConf.hive_info.password;

      await test.step(`Customer Support > PBase Order > Vào order detail > Verify order information`, async () => {
        hivePBase = new HivePBase(page, hivePbDomain);
        await hivePBase.loginToHivePrintBase(hiveUsername, hivePasswd);
        await hivePBase.goToOrderDetail(orderId);
        const orderNameInHive = await hivePBase.getOrderName();
        expect(orderNameInHive).toContain(orderName);
        const infoShipping = await hivePBase.getShippingAdress();
        expect(infoShipping).toContain(firstName + " " + lastName);
        expect(infoShipping).toContain(country);
        expect(infoShipping).toContain(zipcode);
      });

      await test.step(`Verif order detail`, async () => {
        while ((await hivePBase.getNumberOfMockup()) == 0) {
          //Order detail hivepbase trên dev load chậm nên cần click Calculate để hiện order detail
          if (process.env.ENV == "dev") {
            await hivePBase.clickCalculate();
            await hivePBase.page.reload();
          }
        }
        if (products.length == 1) {
          const product = hivePBase.getLocatorProduct(products[0].quantity, products[0].name);
          await expect(product).toBeVisible();
        } else {
          const productPOD = products[0].name;
          const quantityPOD = products[0].quantity;
          const productDropship = products[1].name;
          const quantityDropship = products[1].quantity;

          const prodPOD = hivePBase.getLocatorProduct(quantityPOD, productPOD);
          await expect(prodPOD).toBeVisible();
          const prodDropship = hivePBase.getLocatorProduct(quantityDropship, productDropship);
          await expect(prodDropship).toBeHidden();
        }
      });

      await test.step(`Verify Time Line`, async () => {
        await expect(async () => {
          const inFoConfirm = hivePBase.getLocatorOrderConfirmEmail(firstName, lastName, email);
          await expect(inFoConfirm).toBeVisible();
        }).toPass({ intervals: [5_000, 10_000], timeout: 120_000 });
        await expect(async () => {
          const orderTimeline = await hivePBase.getLocatorOrderTimeLine(firstName, lastName);
          await expect(orderTimeline).toBeVisible();
        }).toPass({ intervals: [5_000, 10_000], timeout: 120_000 });
      });
    });
  });
});
