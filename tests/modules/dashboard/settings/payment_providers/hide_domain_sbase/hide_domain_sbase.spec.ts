import { expect, test } from "@core/fixtures";
import { DomainAPI } from "@pages/api/domain";
import { SettingPaymentAPI } from "@pages/api/setting_payment";

test.describe("Kiểm tra tính năng add proxy domain", async () => {
  let domainID: number;
  let paymentAccess: Array<string>;
  test.beforeEach(async ({ conf, authRequest }) => {
    const { domain, shop_id } = conf.suiteConf as never;
    const domainPage = new DomainAPI(domain, authRequest);
    const shopDomain = await domainPage.getProxyDomain(shop_id);
    domainID = shopDomain.domain_id;

    const settingPaymentAPI = new SettingPaymentAPI(domain, authRequest);
    paymentAccess = await settingPaymentAPI.getAllPaymentMethodName();
  });

  test(`[Dashboard] Kiểm tra add thành công proxy domain @SB_SB_SF_HD_4`, async ({ conf, authRequest }) => {
    // prepaid data for
    const { domain, shop_id: shopID } = conf.suiteConf as never;
    const settingPaymentAPI = new SettingPaymentAPI(domain, authRequest);

    await test.step(`
    Tại dashboard
    - Setting > Payment provider
    - Connected domain > Add a domain > Choose domain > Click Save`, async () => {
      await settingPaymentAPI.deleteConnectedDomain(domainID, shopID);
      // delete all existed card shield domain
      const resInfo = await settingPaymentAPI.addCardShieldDomain(domainID, shopID);
      expect(resInfo.status).toBe(200);
    });

    await test.step(`Click icon expand > Verify payment gateway được sử dụng proxy domain`, async () => {
      const listDomain = await settingPaymentAPI.getCardShieldInfo(shopID);
      const domainStatus = listDomain[0].status;
      const gatewaySPDomain = await settingPaymentAPI.getListMethodID(shopID);

      expect(domainStatus).toEqual("active");
      expect(gatewaySPDomain).toEqual(paymentAccess);
    });
  });

  test(`[Dashboard] Kiểm tra chỉ add được 1 proxy domain @SB_SB_SF_HD_7`, async ({ conf, authRequest }) => {
    await test.step(`
    Tại dashboard
    - Setting > Payment provider
    - Connected domain > Add a domain > Choose domain > Click Save`, async () => {
      const { domain, shop_id } = conf.suiteConf as never;
      const settingPaymentAPI = new SettingPaymentAPI(domain, authRequest);
      const resInfo = await settingPaymentAPI.addCardShieldDomain(domainID, shop_id);
      const message = resInfo.body.error;
      expect(message).toContain(`invalid proxy payment method request`);
    });
  });

  test(`[Dashboard] Kiểm tra remove proxy domain thành công @SB_SB_SF_HD_11`, async ({ conf, authRequest }) => {
    await test.step(`
    Tại dashboard
    - Setting > Payment provider - Connected domain > Remove domain - Confirm remove domain`, async () => {
      const { domain, shop_id: shopID } = conf.suiteConf as never;
      const settingPaymentAPI = new SettingPaymentAPI(domain, authRequest);
      const deleteAPIStatus = await settingPaymentAPI.deleteConnectedDomain(domainID, shopID);
      expect(deleteAPIStatus).toEqual(200);
    });
  });
});
