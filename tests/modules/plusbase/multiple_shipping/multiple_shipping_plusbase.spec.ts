import { expect } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import type { Card, ProductTemplate } from "@types";
import { loadData } from "@core/conf/conf";
import { OdooService } from "@services/odoo";
import { test } from "@fixtures/odoo";
import { updateShippingFee } from "@core/utils/string";
import { isEqual } from "@core/utils/checkout";

let card: Card;

test.describe("Multiple shipping for PlusBase @TC_SB_PLB_MS_4", async () => {
  const caseName = "TC_SB_PLB_MS_4";
  const conf = loadData(__dirname, caseName);
  let shippingFeeCheckout: number;
  conf.caseConf.data.forEach(
    (
      {
        case_id: caseId,
        country_code: countryCode,
        total_line_ship: totalLineShip,
        product_to_add: productNameToAdd,
        shipping_checkout: shippingCheckout,
        shipping_for_product: shippingForProduct,
      },
      i: number,
    ) => {
      test(`Verify shipping method khi checkout product config nhiều shipping @${caseId} with case ${i}`, async ({
        conf,
        page,
        authRequest,
        odoo,
      }) => {
        const domain = conf.suiteConf.domain;
        const checkoutAPI = new CheckoutAPI(domain, authRequest, page);
        const emailBuyer = conf.suiteConf.email_buyer;
        const shippingAddress = conf.suiteConf.shipping_address;
        card = conf.suiteConf.card_info;
        const productId = conf.suiteConf.product_id;
        const shippingTypes: Array<string> = conf.suiteConf.shipping_types;
        const odooService = OdooService(odoo);
        const expectDataShipping = new Map<string, Array<number | string>>();

        await test.step(
          "Search product > Add to cart > checkout > Nhập infor customer >" + " Verify line ship hiển thị",
          async () => {
            // Get shipping fee and shipping time of product from Odoo

            const shippingGroupIds = [];
            const shippingTypeIds = await odooService.updateShippingTypeProductTemplate(productId, shippingTypes);
            const productTemplate: ProductTemplate = await odooService.getProductTemplatesById(productId);

            const deliveryCarriers = await odooService.getDeliveryCarriersByConditions({
              shippingTypeIds: shippingTypeIds,
            });
            for (const deliveryCarrier of deliveryCarriers) {
              const groupId = deliveryCarrier.x_delivery_carrier_group[0];
              if (shippingGroupIds.includes(groupId)) {
                continue;
              }
              shippingGroupIds.push(groupId);
            }

            const shippingGroups = await odooService.getDeliveryCarrierGroupsByConditions({
              ids: shippingGroupIds,
            });
            for await (const shippingGroup of shippingGroups) {
              // Get smallest shipping fee of shipping group by condition: shipping type, country code, weight

              const { deliveryCarrier: smlDeliveryCarrier, shipping: smlShippings } =
                await odooService.getSmallestDeliveryCarriersByConditions({
                  countryCode: countryCode,
                  shippingGroupName: shippingGroup.name,
                  weight: productTemplate.x_weight,
                  shippingTypes: shippingTypes,
                });

              // Get estimated delivery time of shipping method
              const est = smlDeliveryCarrier.x_estimated_delivery.replace("-", " - ").replaceAll(/  +/g, " ");

              // Get shipping fee first item of product
              const firstItem = updateShippingFee(smlShippings[0]);
              expectDataShipping.set(smlDeliveryCarrier.x_display_name_checkout, [firstItem, est]);
            }

            // caculate total shipping fee all product add to cart
            const products = [];
            shippingFeeCheckout = 0;

            for (let i = 0; i < productNameToAdd.length; i++) {
              const productName = productNameToAdd[i];
              const product = conf.suiteConf[productName];
              products.push(product);

              if (productNameToAdd.length > 1) {
                shippingFeeCheckout =
                  shippingFeeCheckout + Number(expectDataShipping.get(shippingForProduct[productName])[0]);
              }
            }

            // Add product to cart then checkout
            await checkoutAPI.addProductToCartThenCheckout(products);
            await checkoutAPI.updateCustomerInformation(emailBuyer, shippingAddress);
            const res = await checkoutAPI.getShippingMethodInfo(countryCode);

            // Verify shipping infomation on checkout page
            expect(totalLineShip).toEqual(res.length);
            for (let i = 0; i < res.length; i++) {
              const shippingGroupName = res[i].method_title.toString();
              const shippingFee = Number(res[i].amount.toFixed(2));
              const minShippingTime = res[i].min_only_shipping_time;
              const maxShippingTime = res[i].max_only_shipping_time;
              const actualShippingTime = `${minShippingTime} - ${maxShippingTime} business days`;

              if (productNameToAdd.length > 1) {
                expect(shippingFee).toEqual(Number(shippingFeeCheckout.toFixed(2)));
              } else {
                expect(shippingFee).toEqual(expectDataShipping.get(shippingGroupName)[0]);
              }
              expect(actualShippingTime).toEqual(expectDataShipping.get(shippingGroupName)[1]);
            }
          },
        );

        await test.step("Chọn shipping > Nhập thẻ thanh toán > Place Your Order > Verify màn thank you page", async () => {
          await checkoutAPI.selectShippingMethodByShippingGroupName(countryCode, shippingCheckout);
          await checkoutAPI.authorizedThenCreateStripeOrder(card);
          await checkoutAPI.getCheckoutInfo();
          const shippingDataThankYouPage = await checkoutAPI.getShippingInfoAfterCompleteOrder();
          if (productNameToAdd.length == 1) {
            expect(shippingDataThankYouPage.amount).toEqual(expectDataShipping.get(shippingCheckout)[0]);
          } else {
            expect(isEqual(shippingDataThankYouPage.amount, shippingCheckout, 0.1)).toBeTruthy();
          }
          const actualShippingTime = `${shippingDataThankYouPage.min_only_shipping_time} - ${shippingDataThankYouPage.max_only_shipping_time} business days`;
          expect(actualShippingTime).toEqual(expectDataShipping.get(shippingCheckout)[1]);
        });
      });
    },
  );
});
