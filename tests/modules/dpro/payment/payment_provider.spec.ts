import { expect, test } from "@core/fixtures";
import { PaymentProviderPage } from "@pages/dashboard/digital_payment";
import { DigitalProductPage } from "@pages/dashboard/digital_product";

test.describe("Kiểm tra connect payment provider UI", () => {
  let paymentProviderPage: PaymentProviderPage;
  let digitalProductPage: DigitalProductPage;
  let publicKey;
  let secretKey;

  test.beforeEach(async ({ conf, dashboard }) => {
    test.setTimeout(conf.suiteConf.time_out);
    paymentProviderPage = new PaymentProviderPage(dashboard, conf.suiteConf.domain);
    digitalProductPage = new DigitalProductPage(dashboard, conf.suiteConf.domain);
    await paymentProviderPage.navigateToMenu("Settings");
    await paymentProviderPage.goto("admin/creator/settings/payments");
    publicKey = conf.caseConf.public_key;
    secretKey = conf.caseConf.secret_key;
  });

  test(`Verify UI của màn provider, Add new Stripe account, add new Paypal account @SB_SC_SCS_3`, async () => {
    await test.step(`Chọn "Setting" trên Menu > Chọn "Payment provider"`, async () => {
      await expect(digitalProductPage.genLoc("(//div[normalize-space() = 'Stripe'])[1]/parent::div")).toBeVisible();
      await expect(digitalProductPage.genLoc("(//div[normalize-space() = 'Paypal'])[1]/parent::div")).toBeVisible();
    });

    await test.step(`Click button "Add a new account" trong block Stripe`, async () => {
      await paymentProviderPage.openAddNewPayment("Stripe");
      await expect(digitalProductPage.genLoc("//div[normalize-space() = 'Add new Stripe account']")).toBeVisible();
      await expect(
        digitalProductPage.genLoc(
          "//div[normalize-space() = 'Use API Keys to connect' and @class= 'sb-form-item__content sb-relative']",
        ),
      ).toBeVisible();
      await expect(
        digitalProductPage.genLoc(
          "//label[normalize-space() = '* Account Name']/parent::div//input[@class = 'sb-input__input']",
        ),
      ).toBeVisible();
      await expect(digitalProductPage.genLoc("//button[normalize-space() = 'Add account']")).toBeVisible();
    });

    await test.step(`Back về màn "Payment provider" > Click button "Activate with API key"`, async () => {
      await paymentProviderPage.goto("admin/creator/settings/payments");
      await paymentProviderPage.openAddNewPayment("Paypal");
      await expect(digitalProductPage.genLoc("//div[normalize-space() = 'Add new PayPal account']")).toBeVisible();
      await expect(
        digitalProductPage.genLoc(
          "//label[normalize-space() = '* Account Name']/parent::div//input[@class = 'sb-input__input']",
        ),
      ).toBeVisible();
      await expect(
        digitalProductPage.genLoc(
          "//label[normalize-space() = '* Client ID']/parent::div//input[@class = 'sb-input__input']",
        ),
      ).toBeVisible();
      await expect(
        digitalProductPage.genLoc(
          "//label[normalize-space() = '* Client Secret Key']/parent::div//input[@class = 'sb-input__input']",
        ),
      ).toBeVisible();
      await expect(digitalProductPage.genLoc("//button[normalize-space() = 'Add account']")).toBeVisible();
    });
  });

  test(`[Stripe] Kiểm tra active cổng Stripe với API key @SB_SC_SCS_5`, async () => {
    await test.step(`Click button "Add a new account" > Tích chọn Use API Keys to connect`, async () => {
      await paymentProviderPage.openAddNewPayment("Stripe");
      await paymentProviderPage.selectAPIKeyOption();
      await expect(paymentProviderPage.genLoc("//div[normalize-space() = '* Public Key']")).toBeVisible();
      await expect(paymentProviderPage.genLoc("//div[normalize-space() = '* Secret Key']")).toBeVisible();
    });

    await test.step(`Nhập Public Key > Click button Save`, async () => {
      for (let i = 0; i < publicKey.length; i++) {
        await paymentProviderPage.inputPaymentKey(
          publicKey[i].public_key,
          publicKey[i].secret_key,
          publicKey[i].account_name,
        );
        await paymentProviderPage.clickAddAccount();
        if (publicKey[i].err_msg) {
          await digitalProductPage.checkMsgAfterCreated({ errMsg: publicKey[i].err_msg });
        } else if (publicKey[i].toast_msg) {
          expect(await digitalProductPage.getTextOfToast(publicKey[i].type_msg)).toEqual(publicKey[i].toast_msg);
        } else {
          await expect(
            paymentProviderPage.genLoc(
              `//span[normalize-space() = '${publicKey[i].account_name}']
            /parent::div//div[contains(@class, 'circle-green')]`,
            ),
          ).toBeVisible();
        }
      }
    });

    await test.step(`Nhập Secret Key > Click button Save`, async () => {
      await paymentProviderPage.openAddNewPayment("Stripe");
      await paymentProviderPage.selectAPIKeyOption();
      for (let i = 0; i < secretKey.length; i++) {
        await paymentProviderPage.inputPaymentKey(
          secretKey[i].public_key,
          secretKey[i].secret_key,
          secretKey[i].account_name,
        );
        await paymentProviderPage.clickAddAccount();
        if (secretKey[i].err_msg) {
          await digitalProductPage.checkMsgAfterCreated({ errMsg: `${secretKey[i].err_msg}` });
        } else if (secretKey[i].toast_msg) {
          expect(await digitalProductPage.getTextOfToast(secretKey[i].type_msg)).toEqual(secretKey[i].toast_msg);
        } else {
          await expect(
            paymentProviderPage.genLoc(
              `//span[normalize-space() = '${secretKey[i].account_name}']
            /parent::div//div[contains(@class, 'circle-green')]`,
            ),
          ).toBeVisible();
        }
      }
    });
  });

  test(`[Stripe] Kiểm tra edit thông tin Stripe account @SB_SC_SCS_6`, async ({ conf }) => {
    const name = conf.caseConf.account;
    await test.step(`Click expand Stripe Account "Stripe-test-1" `, async () => {
      await paymentProviderPage.expandGatewayEditingForm(name);
      await expect(
        paymentProviderPage.genLoc(
          `//div[normalize-space()='${name}']/ancestor::div[4]//div[normalize-space() = '* Public Key']`,
        ),
      ).toBeVisible();
      await expect(
        paymentProviderPage.genLoc(
          `//div[normalize-space()='${name}']/ancestor::div[4]//div[normalize-space() = '* Secret Key']`,
        ),
      ).toBeVisible();
    });

    await test.step(`Tại block Edit Stripe nhập Public Key > Click button Save`, async () => {
      for (let i = 0; i < publicKey.length; i++) {
        await paymentProviderPage.editPublicKey(publicKey[i].public_key);
        await paymentProviderPage.clicktoSave();
        if (publicKey[i].err_msg) {
          await digitalProductPage.checkMsgAfterCreated({ errMsg: `${publicKey[i].err_msg}` });
        } else {
          expect(await digitalProductPage.getTextOfToast(publicKey[i].type_msg)).toEqual(publicKey[i].toast_msg);
        }
      }
    });

    await test.step(`Tại block Edit Stripe nhập Secret Key > Click button Save`, async () => {
      for (let i = 0; i < publicKey.length; i++) {
        await paymentProviderPage.editSecretKey(secretKey[i].secret_key);
        await paymentProviderPage.clicktoSave();
        if (secretKey[i].err_msg) {
          await digitalProductPage.checkMsgAfterCreated({ errMsg: `${secretKey[i].err_msg}` });
        } else {
          expect(await digitalProductPage.getTextOfToast(secretKey[i].type_msg)).toEqual(publicKey[i].toast_msg);
        }
      }
    });
  });

  test(`[Stripe] Kiểm tra deactive Stripe Account đã Active @SB_SC_SCS_7`, async ({ conf }) => {
    const name = conf.caseConf.account_1;
    await test.step(`Click expand Stripe Account "Stripe-test-1"`, async () => {
      await paymentProviderPage.expandGatewayEditingForm(name);
      await expect(
        paymentProviderPage.genLoc(
          `//div[normalize-space()='${name}']/ancestor::div[4]//div[normalize-space() = '* Public Key']`,
        ),
      ).toBeVisible();
      await expect(
        paymentProviderPage.genLoc(
          `//div[normalize-space()='${name}']/ancestor::div[4]//div[normalize-space() = '* Secret Key']`,
        ),
      ).toBeVisible();
    });

    await test.step(`Tại block Edit Stripe nhập Public Key > Click button Deactive`, async () => {
      await paymentProviderPage.clicktoDeactive();
      expect(await digitalProductPage.getTextOfToast(conf.caseConf.type_msg)).toEqual(conf.caseConf.toast_msg);
      await expect(
        paymentProviderPage.genLoc(
          `//span[normalize-space() = '${name}']
        /parent::div//div[contains(@class, 'circle-grey')]`,
        ),
      ).toBeVisible();
    });

    await test.step(`Tại block Edit Stripe nhập Secret Key > Click button Deactive`, async () => {
      await paymentProviderPage.expandGatewayEditingForm(conf.caseConf.account_2);
      await paymentProviderPage.clicktoDeactive();
      expect(await digitalProductPage.getTextOfToast(conf.caseConf.type_msg)).toEqual(conf.caseConf.toast_msg);
      await expect(
        paymentProviderPage.genLoc(
          `//span[normalize-space() = '${conf.caseConf.account_2}']
        /parent::div//div[contains(@class, 'circle-grey')]`,
        ),
      ).toBeVisible();
    });
  });

  test(`[Stripe] Kiểm tra Reactive Stripe Account đã Deactive @SB_SC_SCS_8`, async ({ conf }) => {
    const name = conf.caseConf.account_1;
    await test.step(`Click expand Stripe Account "Stripe-test-2"`, async () => {
      await paymentProviderPage.expandGatewayEditingForm(name);
      await expect(
        paymentProviderPage.genLoc(
          `//div[normalize-space()='${name}']/ancestor::div[4]//div[normalize-space() = '* Public Key']`,
        ),
      ).toBeVisible();
      await expect(
        paymentProviderPage.genLoc(
          `//div[normalize-space()='${name}']/ancestor::div[4]//div[normalize-space() = '* Secret Key']`,
        ),
      ).toBeVisible();
    });

    await test.step(`Tại block Edit Stripe nhập Public Key > Click button Save`, async () => {
      for (let i = 0; i < publicKey.length; i++) {
        await paymentProviderPage.editPublicKey(publicKey[i].public_key);
        await paymentProviderPage.clicktoActive();
        if (publicKey[i].err_msg) {
          await digitalProductPage.checkMsgAfterCreated({ errMsg: `${publicKey[i].err_msg}` });
        } else {
          expect(await digitalProductPage.getTextOfToast(publicKey[i].type_msg)).toEqual(publicKey[i].toast_msg);
        }
      }
      await paymentProviderPage.expandGatewayEditingForm(name);
      await expect(
        paymentProviderPage.genLoc(
          `//span[normalize-space() = '${conf.caseConf.account_1}']
        /parent::div//div[contains(@class, 'circle-green')]`,
        ),
      ).toBeVisible();
    });

    await test.step(`Tại block Edit Stripe nhập Secret Key > Click button Save`, async () => {
      await paymentProviderPage.expandGatewayEditingForm(conf.caseConf.account_2);
      for (let i = 0; i < publicKey.length; i++) {
        await paymentProviderPage.editSecretKey(secretKey[i].secret_key);
        await paymentProviderPage.clicktoActive();
        if (secretKey[i].err_msg) {
          await digitalProductPage.checkMsgAfterCreated({ errMsg: `${secretKey[i].err_msg}` });
        } else {
          expect(await digitalProductPage.getTextOfToast(publicKey[i].type_msg)).toEqual(publicKey[i].toast_msg);
        }
      }
      await paymentProviderPage.expandGatewayEditingForm(conf.caseConf.account_2);
      await expect(
        paymentProviderPage.genLoc(
          `//span[normalize-space() = '${conf.caseConf.account_2}']
        /parent::div//div[contains(@class, 'circle-green')]`,
        ),
      ).toBeVisible();
    });
  });

  test(`[Stripe] Remove Stripe account thành công @SB_SC_SCS_9`, async ({ conf }) => {
    await test.step(`Tại block Stripe, Click button Remove account`, async () => {
      const listAccount = conf.caseConf.account;
      for (let i = 0; i < listAccount.length; i++) {
        await paymentProviderPage.expandGatewayEditingForm(listAccount[i].account);
        await paymentProviderPage.removeProvider();
        expect(await digitalProductPage.getTextOfToast(listAccount[i].type_msg)).toEqual(listAccount[i].toast_msg);
        await expect(paymentProviderPage.genLoc(`//div[normalize-space() = '${listAccount[i].account}']`)).toBeHidden();
      }
    });
  });

  test(`[Paypal] Kiểm tra active gateway Paypal với API key @SB_SC_SCS_10`, async ({}) => {
    await test.step(`Click button "Activate with API key"`, async () => {
      await paymentProviderPage.openAddNewPayment("Paypal");
      await paymentProviderPage.clickTestMode();
      await expect(paymentProviderPage.genLoc("//div[normalize-space() = '* Client ID']")).toBeVisible();
      await expect(paymentProviderPage.genLoc("//div[normalize-space() = '* Client Secret Key']")).toBeVisible();
    });

    await test.step(`Nhập Client ID > Click button Save`, async () => {
      for (let i = 0; i < publicKey.length; i++) {
        await paymentProviderPage.inputPaymentKey(
          publicKey[i].client_id,
          publicKey[i].client_secret_key,
          publicKey[i].account_name,
        );
        await paymentProviderPage.clickAddAccount();
        if (publicKey[i].err_msg) {
          await digitalProductPage.checkMsgAfterCreated({ errMsg: publicKey[i].err_msg });
        } else if (publicKey[i].toast_msg) {
          expect(await digitalProductPage.getTextOfToast(publicKey[i].type_msg)).toEqual(publicKey[i].toast_msg);
        } else {
          await expect(
            paymentProviderPage.genLoc(
              `(//span[normalize-space() = '${publicKey[i].account_name}']
            /parent::div//div[contains(@class, 'circle-green')])[1]`,
            ),
          ).toBeVisible();
        }
      }
    });

    await test.step(`Nhập Client Secret Key > Click button Save`, async () => {
      await paymentProviderPage.openAddNewPayment("Paypal");
      await paymentProviderPage.clickTestMode();
      for (let i = 0; i < publicKey.length; i++) {
        await paymentProviderPage.inputPaymentKey(
          secretKey[i].client_id,
          secretKey[i].client_secret_key,
          secretKey[i].account_name,
        );
        await paymentProviderPage.clickAddAccount();
        if (secretKey[i].err_msg) {
          await digitalProductPage.checkMsgAfterCreated({ errMsg: secretKey[i].err_msg });
        } else if (secretKey[i].toast_msg) {
          expect(await digitalProductPage.getTextOfToast(secretKey[i].type_msg)).toEqual(secretKey[i].toast_msg);
        } else {
          await expect(
            paymentProviderPage.genLoc(
              `(//span[normalize-space() = '${secretKey[i].account_name}']
            /parent::div//div[contains(@class, 'circle-green')])[1]`,
            ),
          ).toBeVisible();
        }
      }
    });
  });

  test(`[Paypal] Kiểm tra edit thông tin Paypal Account @SB_SC_SCS_11`, async ({ conf }) => {
    const name = conf.caseConf.account_1;
    await test.step(`Click expand Paypal Account "Paypal-test-1"`, async () => {
      await paymentProviderPage.expandGatewayEditingForm(name);
      await expect(
        paymentProviderPage.genLoc(
          `//div[normalize-space()='${name}']/ancestor::div[4]//div[normalize-space() = '* Client ID']`,
        ),
      ).toBeVisible();
      await expect(
        paymentProviderPage.genLoc(
          `//div[normalize-space()='${name}']/ancestor::div[4]//div[normalize-space() = '* Client Secret Key']`,
        ),
      ).toBeVisible();
    });

    await test.step(`Nhập Client ID > Click button Save`, async () => {
      for (let i = 0; i < publicKey.length; i++) {
        await paymentProviderPage.editPublicKey(publicKey[i].client_id);
        await paymentProviderPage.clicktoSave();
        if (publicKey[i].err_msg) {
          await digitalProductPage.checkMsgAfterCreated({ errMsg: `${publicKey[i].err_msg}` });
        } else if (publicKey[i].toast_msg) {
          expect(await digitalProductPage.getTextOfToast(publicKey[i].type_msg)).toEqual(publicKey[i].toast_msg);
        }
      }
    });

    await test.step(`Nhập Client Secret Key > Click buttonSave`, async () => {
      await paymentProviderPage.expandGatewayEditingForm(name);
      for (let i = 0; i < secretKey.length; i++) {
        await paymentProviderPage.editSecretKey(secretKey[i].client_secret_key);
        await paymentProviderPage.clicktoSave();
        if (secretKey[i].err_msg) {
          await digitalProductPage.checkMsgAfterCreated({ errMsg: `${secretKey[i].err_msg}` });
        } else if (publicKey[i].toast_msg) {
          expect(await digitalProductPage.getTextOfToast(publicKey[i].type_msg)).toEqual(publicKey[i].toast_msg);
        }
      }
    });
  });

  test(`[Paypal] Kiểm tra Deactive Paypal gateway @SB_SC_SCS_12`, async ({ conf }) => {
    const name = conf.caseConf.account_1;
    await test.step(`Click expand Paypal Account "Paypal-test-1"`, async () => {
      await paymentProviderPage.expandGatewayEditingForm(name);
      await expect(
        paymentProviderPage.genLoc(
          `//div[normalize-space()='${name}']/ancestor::div[4]//div[normalize-space() = '* Client ID']`,
        ),
      ).toBeVisible();
      await expect(
        paymentProviderPage.genLoc(
          `//div[normalize-space()='${name}']/ancestor::div[4]//div[normalize-space() = '* Client Secret Key']`,
        ),
      ).toBeVisible();
    });

    await test.step(`Nhập Client ID > Click button Deactive`, async () => {
      await paymentProviderPage.clicktoDeactive();
      expect(await digitalProductPage.getTextOfToast(conf.caseConf.type_msg)).toEqual(conf.caseConf.toast_msg);
      await expect(
        paymentProviderPage.genLoc(
          `//span[normalize-space() = '${conf.caseConf.account_1}']
        /parent::div//div[contains(@class, 'circle-grey')]`,
        ),
      ).toBeVisible();
    });

    await test.step(`Nhập Client Secret Key > Click button Deactive`, async () => {
      await paymentProviderPage.expandGatewayEditingForm(conf.caseConf.account_2);
      await paymentProviderPage.clicktoDeactive();
      expect(await digitalProductPage.getTextOfToast(conf.caseConf.type_msg)).toEqual(conf.caseConf.toast_msg);
      await expect(
        paymentProviderPage.genLoc(
          `//span[normalize-space() = '${conf.caseConf.account_1}']
        /parent::div//div[contains(@class, 'circle-grey')]`,
        ),
      ).toBeVisible();
    });
  });

  test(`[Paypal]Kiểm tra Reactivate PayPal gateway khi bỏ trống các field @SB_SC_SCS_13`, async ({ conf }) => {
    const name = conf.caseConf.account_1;
    await test.step(`Click expand Paypal Account "Paypal-test-1"`, async () => {
      await paymentProviderPage.expandGatewayEditingForm(name);
      await expect(
        paymentProviderPage.genLoc(
          `//div[normalize-space()='${name}']/ancestor::div[4]//div[normalize-space() = '* Client ID']`,
        ),
      ).toBeVisible();
      await expect(
        paymentProviderPage.genLoc(
          `//div[normalize-space()='${name}']/ancestor::div[4]//div[normalize-space() = '* Client Secret Key']`,
        ),
      ).toBeVisible();
    });

    await test.step(`Nhập Client ID > Click button Deactive`, async () => {
      for (let i = 0; i < publicKey.length; i++) {
        await paymentProviderPage.editPublicKey(publicKey[i].client_id);
        await paymentProviderPage.clicktoActive();
        if (publicKey[i].err_msg) {
          await digitalProductPage.checkMsgAfterCreated({ errMsg: `${publicKey[i].err_msg}` });
        } else if (publicKey[i].toast_msg) {
          expect(await digitalProductPage.getTextOfToast(publicKey[i].type_msg)).toEqual(publicKey[i].toast_msg);
        }
      }
      await expect(
        paymentProviderPage.genLoc(
          `//span[normalize-space() = '${conf.caseConf.account_1}']
        /parent::div//div[contains(@class, 'circle-green')]`,
        ),
      ).toBeVisible();
    });

    await test.step(`Nhập Client Secret > Click button Deactive`, async () => {
      await paymentProviderPage.expandGatewayEditingForm(conf.caseConf.account_2);
      for (let i = 0; i < secretKey.length; i++) {
        await paymentProviderPage.editSecretKey(secretKey[i].client_secret_key);
        await paymentProviderPage.clicktoActive();
        if (secretKey[i].err_msg) {
          await digitalProductPage.checkMsgAfterCreated({ errMsg: `${secretKey[i].err_msg}` });
        } else if (publicKey[i].toast_msg) {
          expect(await digitalProductPage.getTextOfToast(publicKey[i].type_msg)).toEqual(publicKey[i].toast_msg);
        }
      }
      await expect(
        paymentProviderPage.genLoc(
          `//span[normalize-space() = '${conf.caseConf.account_2}']
        /parent::div//div[contains(@class, 'circle-green')]`,
        ),
      ).toBeVisible();
    });
  });

  test(`[Paypal] Kiểm tra remove account thành công @SB_SC_SCS_14`, async ({ conf }) => {
    await test.step(`Tại block Paypal, Click button Remove account`, async () => {
      const listAccount = conf.caseConf.account;
      for (let i = 0; i < listAccount.length; i++) {
        await paymentProviderPage.expandGatewayEditingForm(listAccount[i].account);
        await paymentProviderPage.removeProvider();
        expect(await digitalProductPage.getTextOfToast(listAccount[i].type_msg)).toEqual(listAccount[i].toast_msg);
        await expect(paymentProviderPage.genLoc(`//div[normalize-space() = '${listAccount[i].account}']`)).toBeHidden();
      }
    });
  });
});
