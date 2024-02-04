// Feature off

import { expect, test } from "@core/fixtures";
import { SettingShippingAPI } from "@pages/api/setting_shipping_api";
import { CheckoutAPI } from "@pages/api/checkout";
import { loadData } from "@core/conf/conf";

// verify shipping amount following shipping rate name
const verifyShippingMethod = (expShippingMethods, actShippingMethods) => {
  for (const expShippingMethod of expShippingMethods) {
    const actShippingMethod = actShippingMethods.find(
      // eslint-disable-next-line camelcase
      ({ method_title }) => method_title === expShippingMethod.method_title,
    );
    expect(actShippingMethod.amount).toBe(expShippingMethod.amount);
  }
};

test.describe("@TC_GP_DHSM Kiểm tra các cases không có shipping methods với General Profile", () => {
  const casesID = "TC_GP_DHSM"; // include cases TC_SB_SET_SP_SPR_7/ 8/ 9
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      case_step: caseStep,
      shipping_zones: payloadShippingZones,
      products_checkout: productCheckout,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ conf, authRequest }) => {
        const { domain, email, shipping_address } = conf.suiteConf as never;
        const checkoutAPI = new CheckoutAPI(domain, authRequest);
        const shippingSettingAPI = new SettingShippingAPI(domain, authRequest);

        await test.step(`Pre-condition`, async () => {
          // delete all existed shipping profile
          await shippingSettingAPI.deleteAllCustomProfile();
          await shippingSettingAPI.deleteAllZonesOfGeneralProfile();

          // create new shipping zone for General Profile
          const profileBody = await shippingSettingAPI.getGeneralProfileInfo();
          await shippingSettingAPI.updateShippingZones(profileBody, payloadShippingZones);
        });

        await test.step(`${caseStep}`, async () => {
          const actShippingMethods = await checkoutAPI.getShippingMethodOfCheckout(
            productCheckout,
            email,
            shipping_address,
          );
          // verify checkout don't have any shipping method
          expect(actShippingMethods.length).toEqual(0);
        });
      });
    },
  );
});

test.describe("@TC_CP_DHSM Kiểm tra các cases không có shipping methods với Custom profile", () => {
  const casesID = "TC_CP_DHSM"; // include cases TC_SB_SET_SP_SPR_10 -> 17
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      case_step: caseStep,
      shipping_profiles: shippingProfiles,
      products_checkout: productCheckout,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ conf, authRequest }) => {
        const { domain, email, shipping_address } = conf.suiteConf as never;
        const checkoutAPI = new CheckoutAPI(domain, authRequest);
        const shippingSettingAPI = new SettingShippingAPI(domain, authRequest);

        await test.step(`Pre-condition`, async () => {
          // delete all existed shipping profile
          await shippingSettingAPI.deleteAllCustomProfile();
          await shippingSettingAPI.deleteAllZonesOfGeneralProfile();

          // create new Shipping Profiles
          for (const shippingProfile of shippingProfiles) {
            await shippingSettingAPI.createShippingProfile(shippingProfile);
          }
        });

        await test.step(`${caseStep}`, async () => {
          const actShippingMethods = await checkoutAPI.getShippingMethodOfCheckout(
            productCheckout,
            email,
            shipping_address,
          );
          // verify checkout don't have any shipping method
          expect(actShippingMethods.length).toEqual(0);
        });
      });
    },
  );
});

test.describe("@TC_GP_HSM Kiểm tra các case có shipping methods với General Profile", () => {
  const casesID = "TC_GP_HSM"; // include cases TC_SB_SET_SP_SPR_18 -> 20
  const conf = loadData(__dirname, casesID);

  // for each data, will do tests
  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      case_step: caseStep,
      shipping_zones: payloadShippingZones,
      products_checkout: productCheckout,
      expected_shipping_methods: expShippingMethods,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ conf, authRequest }) => {
        const { domain, email, shipping_address } = conf.suiteConf as never;
        const checkoutAPI = new CheckoutAPI(domain, authRequest);
        const shippingSettingAPI = new SettingShippingAPI(domain, authRequest);

        await test.step(`Pre-condition`, async () => {
          // delete all existed shipping profile
          await shippingSettingAPI.deleteAllCustomProfile();
          await shippingSettingAPI.deleteAllZonesOfGeneralProfile();

          // create new shipping zone for General Profile
          const profileBody = await shippingSettingAPI.getGeneralProfileInfo();
          await shippingSettingAPI.updateShippingZones(profileBody, payloadShippingZones);
        });

        await test.step(`${caseStep}`, async () => {
          const actShippingMethods = await checkoutAPI.getShippingMethodOfCheckout(
            productCheckout,
            email,
            shipping_address,
          );
          verifyShippingMethod(expShippingMethods, actShippingMethods);
        });
      });
    },
  );
});

test.describe("@TC_CP_HSM Kiểm tra các case có shipping methods với Custom profile", () => {
  const casesID = "TC_CP_HSM"; // include cases TC_SB_SET_SP_SPR_21 -> 32
  const conf = loadData(__dirname, casesID);

  // for each data, will do tests
  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      case_step: caseStep,
      shipping_profiles: shippingProfiles,
      products_checkout: productCheckout,
      expected_shipping_methods: expShippingMethods,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ conf, authRequest }) => {
        const { domain, email, shipping_address } = conf.suiteConf as never;
        const checkoutAPI = new CheckoutAPI(domain, authRequest);
        const shippingSettingAPI = new SettingShippingAPI(domain, authRequest);

        await test.step(`Pre-condition`, async () => {
          // delete all existed shipping profile
          await shippingSettingAPI.deleteAllCustomProfile();
          await shippingSettingAPI.deleteAllZonesOfGeneralProfile();

          // create new Shipping Profiles
          for (const shippingProfile of shippingProfiles) {
            await shippingSettingAPI.createShippingProfile(shippingProfile);
          }
        });

        await test.step(`${caseStep}`, async () => {
          const actShippingMethods = await checkoutAPI.getShippingMethodOfCheckout(
            productCheckout,
            email,
            shipping_address,
          );
          verifyShippingMethod(expShippingMethods, actShippingMethods);
        });
      });
    },
  );
});

test.describe("@TC_CO_PPC Kiểm tra các case có Post-Purchase", () => {
  const casesID = "TC_CO_PPC"; // include cases TC_SB_SET_SP_SPR_36 -> 41, 47 -> 49
  const conf = loadData(__dirname, casesID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      case_step: caseStep,
      shipping_profiles: shippingProfiles,
      products_checkout: productsCheckout,
      product_ppc: productPPC,
      usell_id: uSellId,
      shipping_method_before_ppc: shippingBeforePPC,
      shipping_method_after_ppc: expShippingAfterPPC,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ conf, authRequest }) => {
        const { domain, email, shipping_address, card_info } = conf.suiteConf as never;
        const checkoutAPI = new CheckoutAPI(domain, authRequest);
        const shippingSettingAPI = new SettingShippingAPI(domain, authRequest);
        const shippingMethodName = shippingBeforePPC.method_title;

        await test.step(`Pre-condition`, async () => {
          // delete all existed shipping profile
          await shippingSettingAPI.deleteAllCustomProfile();
          await shippingSettingAPI.deleteAllZonesOfGeneralProfile();

          // create new Shipping Profiles
          for (const shippingProfile of shippingProfiles) {
            await shippingSettingAPI.createShippingProfile(shippingProfile);
          }
        });

        await test.step(`${caseStep}`, async () => {
          await checkoutAPI.addProductThenSelectShippingMethod(
            productsCheckout,
            email,
            shipping_address,
            shippingMethodName,
          );
          await checkoutAPI.activatePostPurchase();
          await checkoutAPI.authorizedThenCreateStripeOrder(card_info);
        });

        await test.step("Verify shipping method sau khi add PPC", async () => {
          await checkoutAPI.addPostPurchaseToCart(productPPC, uSellId);
          const actShippingAfterPPC = await checkoutAPI.getShippingInfoAfterCompleteOrder();
          // verify
          expect(actShippingAfterPPC.amount).toBe(expShippingAfterPPC.amount);
          expect(actShippingAfterPPC.method_title).toBe(expShippingAfterPPC.method_title);
        });
      });
    },
  );
});
