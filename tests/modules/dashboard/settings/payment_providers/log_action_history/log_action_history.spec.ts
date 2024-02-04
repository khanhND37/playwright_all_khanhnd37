import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { PaymentProviders } from "@pages/api/payment_providers";
import { PaymentProviderPage } from "@pages/dashboard/payment_providers";

async function verifyActivityLog(paymentAPI, paymentPage, response) {
  for (let i = 0; i < 30; i++) {
    const result = await paymentAPI.getThe1stLogActivityPayment();
    if (result.detail === response.detail) {
      expect(result.action).toEqual(response.action);
      break;
    }
    //Doi activity log duoc insert vao
    await paymentPage.page.waitForTimeout(200);
  }
}

test.describe("Check log of actions with Third-party providers and Custom methods", async () => {
  let paymentPage: PaymentProviderPage;
  let paymentAPI: PaymentProviders;
  let infoPayment;
  const casesID = "ACTIVITY_LOG_3RD_CUS";
  const conf = loadData(__dirname, casesID);
  test.beforeEach(async ({ conf, authRequest, dashboard }) => {
    const { domain } = conf.suiteConf as never;
    //clear all method
    paymentAPI = new PaymentProviders(domain, authRequest);
    paymentPage = new PaymentProviderPage(dashboard, domain);
    await paymentAPI.removeAllPaymentMethod();
  });

  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      payment_method: paymentMethod,
      info_register: infoRegister,
      info_update: infoUpdate,
      response: response,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ conf, authRequest }) => {
        const { domain } = conf.suiteConf as never;
        const paymentAPI = new PaymentProviders(domain, authRequest);
        await test.step("Check log khi Merchant create cổng", async () => {
          await paymentAPI.createAPaymentMethod(paymentMethod, infoRegister);
          //check log
          await verifyActivityLog(paymentAPI, paymentPage, response.create);
        });

        await test.step("Check log khi Merchant edit cổng", async () => {
          infoPayment = await paymentAPI.getAPaymentMethodBody(paymentMethod);
          //dung de update lai du thong tin cho acc payment
          await paymentAPI.updateAccount(infoPayment);
          //update title cua acc payment
          infoPayment.title = infoUpdate.title;
          await paymentAPI.updateAccount(infoPayment);
          //check log
          await verifyActivityLog(paymentAPI, paymentPage, response.update);
        });

        await test.step("Check log khi Merchant deactive cổng", async () => {
          const paymentID = infoPayment.id;
          await paymentAPI.changePaymentMethodStatus(paymentID, paymentMethod, false);
          //check log
          await verifyActivityLog(paymentAPI, paymentPage, response.deactive);
        });

        await test.step("Check log khi Merchant reactive cổng", async () => {
          const paymentID = infoPayment.id;
          await paymentAPI.changePaymentMethodStatus(paymentID, paymentMethod, true);
          //check log
          await verifyActivityLog(paymentAPI, paymentPage, response.reactive);
        });

        await test.step("Check log khi Merchant delete cổng", async () => {
          const paymentID = infoPayment.id;
          await paymentAPI.deletePaymentProvider(paymentID);
          //check log
          await verifyActivityLog(paymentAPI, paymentPage, response.delete);
        });
      });
    },
  );
});

test.describe("Check log of actions for Payment Provider ", async () => {
  let paymentAPI: PaymentProviders;
  let paymentPage: PaymentProviderPage;
  let infoPayment;

  test.beforeEach(async ({ conf, authRequest, dashboard }) => {
    const { domain } = conf.suiteConf as never;
    //clear all method
    paymentAPI = new PaymentProviders(domain, authRequest);
    paymentPage = new PaymentProviderPage(dashboard, domain);
    await paymentAPI.removeAllPaymentMethod();
  });

  test(`Check log with SPay @SB_SET_ACC_ACT_LOG_PP_07`, async ({ conf }) => {
    const paymentMethod = conf.caseConf.payment_method;
    const infoUpdate = conf.caseConf.info_update;
    const response = conf.caseConf.response;

    await test.step(`Bật Spay`, async () => {
      await paymentAPI.changeShopbasePaymentStatus();
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.active);
    });

    await test.step("Check log khi Merchant edit Customer billing statement", async () => {
      infoPayment = await paymentAPI.getAPaymentMethodBody(paymentMethod);
      infoPayment.statement_descriptor = infoUpdate.statement_descriptor;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant edit Payout statement descriptor", async () => {
      infoPayment = await paymentAPI.getAPaymentMethodBody(paymentMethod);
      infoPayment.title = infoUpdate.title;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step(`Tắt SPay`, async () => {
      const paymentID = infoPayment.id;
      await paymentAPI.changePaymentMethodStatus(paymentID, paymentMethod, false);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.deactive);
    });
  });

  test(`Check log with SMP @SB_SET_ACC_ACT_LOG_PP_08`, async ({ conf }) => {
    const paymentMethod = conf.caseConf.payment_method;
    const infoUpdate = conf.caseConf.info_update;
    const response = conf.caseConf.response;

    await test.step(`Bật SMP`, async () => {
      await paymentAPI.changeShopbasePaymentStatus();
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.active);
    });

    await test.step("Check log khi Merchant edit Customer billing statement", async () => {
      infoPayment = await paymentAPI.getAPaymentMethodBody(paymentMethod);
      infoPayment.statement_descriptor = infoUpdate.statement_descriptor;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant on EU payment", async () => {
      infoPayment = await paymentAPI.getAPaymentMethodBody(paymentMethod);
      infoPayment.enable_sub_payment_method = infoUpdate.enable_sub_payment_method;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant off sub payment", async () => {
      infoPayment = await paymentAPI.getAPaymentMethodBody(paymentMethod);
      infoPayment.payment_method_types = infoUpdate.payment_method_types_off;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant on sub payment", async () => {
      infoPayment = await paymentAPI.getAPaymentMethodBody(paymentMethod);
      infoPayment.payment_method_types = infoUpdate.payment_method_types_on;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant on hide cardhold", async () => {
      infoPayment = await paymentAPI.getAPaymentMethodBody(paymentMethod);
      infoPayment.is_cardholder_name_hidden = infoUpdate.on_cardholder_name_hidden;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant off hide cardhold", async () => {
      infoPayment = await paymentAPI.getAPaymentMethodBody(paymentMethod);
      infoPayment.is_cardholder_name_hidden = infoUpdate.off_cardholder_name_hidden;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant chọn Submit dispute automatically", async () => {
      await paymentAPI.updateSubmitDispute("auto");
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.dispute);
    });

    await test.step("Check log khi Merchant bỏ chọn Submit dispute automatically", async () => {
      await paymentAPI.updateSubmitDispute("manual");
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.dispute);
    });

    await test.step(`Tắt SMP`, async () => {
      const paymentID = infoPayment.id;
      await paymentAPI.changePaymentMethodStatus(paymentID, paymentMethod, false);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.deactive);
    });
  });

  test(`Check log with PayPal @SB_SET_ACC_ACT_LOG_PP_09`, async ({ conf }) => {
    const paymentMethod = conf.caseConf.payment_method;
    const infoRegister = conf.caseConf.info_register;
    const infoUpdate = conf.caseConf.info_update;
    const response = conf.caseConf.response;

    await test.step("Check log khi Merchant create cổng", async () => {
      await paymentAPI.createAPaymentMethod(paymentMethod, infoRegister);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.create);
    });

    await test.step("Check log khi Merchant edit cổng", async () => {
      infoPayment = await paymentAPI.getAPaymentMethodBody(paymentMethod);
      //dung de update lai du thong tin cho acc payment
      await paymentAPI.updateAccount(infoPayment);
      infoPayment.title = infoUpdate.title;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.rename);
    });

    await test.step("Check log khi Merchant enable Express checkout", async () => {
      infoPayment = await paymentAPI.getAPaymentMethodBody(paymentMethod);
      infoPayment.enable_express_checkout = infoUpdate.enable_express_checkout;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant deactive cổng", async () => {
      const paymentID = infoPayment.id;
      await paymentAPI.changePaymentMethodStatus(paymentID, paymentMethod, false);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.deactive);
    });

    await test.step("Check log khi Merchant reactive cổng", async () => {
      const paymentID = infoPayment.id;
      await paymentAPI.changePaymentMethodStatus(paymentID, paymentMethod, true);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.reactive);
    });

    await test.step("Check log khi Merchant enable PayPal smart button", async () => {
      await paymentAPI.updatePayPalSettingPayment(infoUpdate.is_enable_paypal_smart_button);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update_setting);
    });

    await test.step("Check log khi Merchant chọn 'Redirect to PayPal.com' PayPal smart button", async () => {
      await paymentAPI.updatePayPalSettingPayment(infoUpdate.enter_payment_info);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update_setting);
    });

    await test.step("Check log khi Merchant disable PayPal smart button", async () => {
      await paymentAPI.updatePayPalSettingPayment(infoUpdate.is_enable_paypal_smart_button);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update_setting);
    });

    await test.step("Check log khi Merchant enable BNPL", async () => {
      await paymentAPI.updatePayPalSettingPayment(infoUpdate.enable_paypal_paylater);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update_setting);
    });

    await test.step("Check log khi Merchant disable BNPL", async () => {
      await paymentAPI.updatePayPalSettingPayment(infoUpdate.disable_paypal_paylater);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update_setting);
    });

    await test.step("Check log khi Merchant enable Order Info", async () => {
      await paymentAPI.updatePayPalSettingPayment(infoUpdate.is_enable_tracking);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update_setting);
    });

    await test.step("Check log khi Merchant enable option of Order Info", async () => {
      await paymentAPI.updatePayPalSettingPayment(infoUpdate.enabled_order_info);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update_setting);
    });

    await test.step("Check log khi Merchant disable Order Info", async () => {
      await paymentAPI.updatePayPalSettingPayment(infoUpdate.is_disable_tracking);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update_setting);
    });

    await test.step("Check log khi Merchant update Brand name", async () => {
      await paymentAPI.updatePayPalSettingPayment(infoUpdate.brand_name);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update_setting);
    });

    await test.step("Check log khi Merchant delete cổng", async () => {
      const paymentID = infoPayment.id;
      await paymentAPI.deletePaymentProvider(paymentID);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.delete);
    });
  });

  test(`Check log with Stripe @SB_SET_ACC_ACT_LOG_PP_10`, async ({ conf }) => {
    const paymentMethod = conf.caseConf.payment_method;
    const infoRegister = conf.caseConf.info_register;
    const infoUpdate = conf.caseConf.info_update;
    const paymentSetting = conf.caseConf.payment_setting;
    const response = conf.caseConf.response;

    await test.step("Check log khi Merchant create cổng", async () => {
      await paymentAPI.createAPaymentMethod(paymentMethod, infoRegister);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.create);
    });

    await test.step("Check log khi Merchant edit cổng", async () => {
      infoPayment = await paymentAPI.getAPaymentMethodBody(paymentMethod);
      //dung de update lai du thong tin cho acc payment
      await paymentAPI.updateAccount(infoPayment);
      infoPayment.title = infoUpdate.title;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.rename);
    });

    await test.step("Check log khi Merchant deactive cổng", async () => {
      const paymentID = infoPayment.id;
      await paymentAPI.changePaymentMethodStatus(paymentID, paymentMethod, false);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.deactive);
    });

    await test.step("Check log khi Merchant reactive cổng", async () => {
      const paymentID = infoPayment.id;
      await paymentAPI.changePaymentMethodStatus(paymentID, paymentMethod, true);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.reactive);
    });

    await test.step("Check log khi Merchant enable EU payment", async () => {
      infoPayment.provider_options.enable_sub_payment_method = infoUpdate.enable_sub_payment_method_on;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant enable sub payment method of EU payment", async () => {
      infoPayment.provider_options.payment_method_types = infoUpdate.payment_method_types_eu;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant disable sub payment method of EU payment", async () => {
      infoPayment.provider_options.payment_method_types = infoUpdate.payment_method_types_off;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant disable EU payment", async () => {
      infoPayment.provider_options.enable_sub_payment_method = infoUpdate.enable_sub_payment_method_off;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant enable BNPL", async () => {
      infoPayment.provider_options.enable_pay_now_pay_later_method = infoUpdate.enable_pay_now_pay_later_method_on;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant enable sub payment method of BNPL", async () => {
      infoPayment.provider_options.payment_method_types = infoUpdate.payment_method_types_bnpl;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant disable sub payment method of BNPL", async () => {
      infoPayment.provider_options.payment_method_types = infoUpdate.payment_method_types_off;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant disable BNPL", async () => {
      infoPayment.provider_options.enable_pay_now_pay_later_method = infoUpdate.enable_pay_now_pay_later_method_off;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant update statement", async () => {
      infoPayment.provider_options.statement_descriptor = infoUpdate.statement_descriptor;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant delete statement", async () => {
      infoPayment.provider_options.statement_descriptor = infoRegister.statement_descriptor;
      await paymentAPI.updateAccount(infoPayment);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update);
    });

    await test.step("Check log khi Merchant add Customer billing statement of Stripe", async () => {
      await paymentAPI.updateSettingPaymentAccount(paymentSetting.payment_code, paymentSetting.statement_descriptor);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update_setting);
    });

    await test.step("Check log khi Merchant edit Customer billing statement of Stripe", async () => {
      paymentSetting.statement_descriptsor = infoUpdate.statement_descriptor;
      await paymentAPI.updateSettingPaymentAccount(paymentSetting.payment_code, infoUpdate.statement_descriptor);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update_setting);
    });

    await test.step("Check log khi Merchant enable Hide cardholder of Stripe", async () => {
      paymentSetting.is_cardholder_name_hidden = infoUpdate.is_cardholder_name_hidden_on;
      await paymentAPI.updateSettingPaymentAccount(
        paymentSetting.payment_code,
        infoUpdate.is_cardholder_name_hidden_on,
      );
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update_setting);
    });

    await test.step("Check log khi Merchant disable Hide cardholder of Stripe", async () => {
      paymentSetting.is_cardholder_name_hidden = infoUpdate.is_cardholder_name_hidden_off;
      await paymentAPI.updateSettingPaymentAccount(
        paymentSetting.payment_code,
        infoUpdate.is_cardholder_name_hidden_off,
      );
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.update_setting);
    });

    await test.step("Check log khi Merchant delete cổng", async () => {
      const paymentID = infoPayment.id;
      await paymentAPI.deletePaymentProvider(paymentID);
      //check log
      await verifyActivityLog(paymentAPI, paymentPage, response.delete);
    });
  });

  test(`Check log when enable Test gateway @SB_SET_ACC_ACT_LOG_PP_21`, async ({ conf }) => {
    const paymentMethod = conf.caseConf.payment_method;
    const infoRegister = conf.caseConf.info_register;
    const response = conf.caseConf.response;

    await test.step(`
    Pre condition
    - On rotation
    - Active 1 cổng stripe
    - Bật Spay`, async () => {
      await paymentAPI.changePaymentRotationStatus(true);
      await paymentAPI.createAPaymentMethod(paymentMethod, infoRegister);
      await paymentAPI.changeShopbasePaymentStatus();
    });

    await test.step(`Enable Test gateway`, async () => {
      infoPayment = await paymentAPI.getAPaymentMethodBody(paymentMethod);
      const idPayment = infoPayment.id;
      await paymentAPI.changeTestGatewayStatus(idPayment, true);
      //Checklog
      await verifyActivityLog(paymentAPI, paymentPage, response);
    });
  });

  test(`Check log when off Payment rotation @SB_SET_ACC_ACT_LOG_PP_32`, async ({ conf }) => {
    const paymentMethod = conf.caseConf.payment_method;
    const infoRegister = conf.caseConf.info_register;
    const response = conf.caseConf.response;

    await test.step(`
    Pre condition
    - On rotation
    - Active 1 cổng stripe
    - Bật Spay`, async () => {
      await paymentAPI.changePaymentRotationStatus(true);
      await paymentAPI.createAPaymentMethod(paymentMethod, infoRegister);
      await paymentAPI.changeShopbasePaymentStatus();
    });

    await test.step(`Off payment rotation`, async () => {
      await paymentAPI.changePaymentRotationStatus(false);
      //check log
      for (let i = 0; i < 30; i++) {
        const result = await paymentAPI.getLogActivityPayment(2);
        for (const activityLog of result) {
          if (response.includes(activityLog)) {
            expect(result).toEqual(response);
          }
        }
        await paymentPage.page.reload();
      }
    });
  });
});
