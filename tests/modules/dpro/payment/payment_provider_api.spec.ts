import { expect, test } from "@core/fixtures";
import { PaymentProviderAPI } from "@pages/api/dpro/payment_provider";
import { loadData } from "@core/conf/conf";

test.describe("Verify set up payment providers for shop creator", () => {
  let paymentProviderAPI: PaymentProviderAPI;

  test.beforeEach(async ({ conf, authRequest }) => {
    paymentProviderAPI = new PaymentProviderAPI(conf.suiteConf.domain, authRequest);
  });

  const dataCreatePaymentPass = loadData(__dirname, "DATA_CREATE_PAYMENT_PASS");
  for (let i = 0; i < dataCreatePaymentPass.caseConf.data.length; i++) {
    const dataPayment = dataCreatePaymentPass.caseConf.data[i];
    const providerInfo = dataPayment.payment;
    test(`${dataPayment.description} @${dataPayment.case_id}`, async () => {
      expect(await paymentProviderAPI.connectPaymentProvider(providerInfo)).toEqual(providerInfo);
    });
  }

  const dataCreatePaymentFail = loadData(__dirname, "DATA_CREATE_PAYMENT_FAIL");
  for (let i = 0; i < dataCreatePaymentFail.caseConf.data.length; i++) {
    const dataPayment = dataCreatePaymentFail.caseConf.data[i];
    test(`${dataPayment.description} @${dataPayment.case_id}`, async ({ authRequest, conf }) => {
      const paymentProviderAPI = new PaymentProviderAPI(conf.suiteConf.domain, authRequest);
      const errorMessage = await paymentProviderAPI.connectPaymentProvider(dataPayment.payment);
      expect(errorMessage).toEqual(dataPayment.error);
    });
  }

  const dataRemoveAccountPayment = loadData(__dirname, "DATA_REMOTE_ACCOUNT_PAYMENT");
  for (let i = 0; i < dataRemoveAccountPayment.caseConf.data.length; i++) {
    const dataPayment = dataRemoveAccountPayment.caseConf.data[i];
    test(`${dataPayment.description} @${dataPayment.case_id}`, async ({ authRequest, conf }) => {
      const paymentProviderAPI = new PaymentProviderAPI(conf.suiteConf.domain, authRequest);
      const providerId = await paymentProviderAPI.getProviderID(dataPayment.payment);
      expect(await paymentProviderAPI.deleteProvider(providerId)).toEqual(true);
    });
  }
});
