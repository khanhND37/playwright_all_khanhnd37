import { expect, test } from "@fixtures/website_builder";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import type { FormStyleSettings, LayerStyles, PageResponse, PageWebBuilderInfo, QuickBarOptions } from "@types";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";
import { FrameLocator, Page } from "@playwright/test";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { ContactFormPage } from "@sf_pages/contact_form";
import { SFCheckout } from "@pages/storefront/checkout";
import { MailBox } from "@pages/thirdparty/mailbox";
import { CustomersPage } from "@pages/dashboard/customers";
import { SaleChannelAPI } from "@pages/api/dashboard/sale_channel";
import { WbBlockFormPage } from "@pages/dashboard/wb_block_form";

let wbBlockFormPage: WbBlockFormPage;
let dashboardPage: DashboardPage;
let otherPage: OtherPage;
let pageTitle: string;
let pageResp: PageResponse;
let accessToken: string;
let pageBuilderResp: PageWebBuilderInfo;
let webPageStyle: WebPageStyle;
let frameLocator: FrameLocator;
let blockPage: Blocks;
let quickBarButtons: Array<QuickBarOptions>;
let designSettings: LayerStyles;
let formSettings: FormStyleSettings;
let domain: string;
let page: Page;
let pageSf: Page;
let time: number;
let contactFormPage: ContactFormPage;
let customerPage: CustomersPage;
let saleChannelApi: SaleChannelAPI;
test.describe("Check module block form @SB_NEWECOM_BF", () => {
  test.beforeAll(async ({ conf, token, browser }) => {
    domain = conf.suiteConf.domain;
    const context = await browser.newContext();
    page = await context.newPage();
    pageSf = await context.newPage();
    await page.bringToFront();
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken;
    dashboardPage = new DashboardPage(page, domain);
    await dashboardPage.loginWithToken(accessToken);
    wbBlockFormPage = new WbBlockFormPage(page, domain);
    otherPage = new OtherPage(page, domain);
    webPageStyle = new WebPageStyle(page, domain);
    blockPage = new Blocks(page, domain);
    frameLocator = blockPage.frameLocator;
    quickBarButtons = conf.suiteConf.quick_bar_buttons;
    contactFormPage = new ContactFormPage(pageSf, domain);
    customerPage = new CustomersPage(page, domain);

    otherPage.setAccessToken(accessToken);
  });
  test.beforeEach(async ({ conf, builder }) => {
    page.bringToFront();
    time = Date.now();
    pageTitle = `${conf.suiteConf.page_title}-${time}`;
    designSettings = conf.caseConf.design_settings;
    formSettings = conf.caseConf.form_settings;
    if (formSettings.save_email) {
      formSettings.save_email = `${time}${formSettings.save_email}`;
    }
    pageResp = await otherPage.createPage({
      title: pageTitle,
      publish: true,
      is_show_in_search: true,
    });

    pageBuilderResp = await builder.applyTemplate({
      productId: pageResp.id,
      templateId: conf.suiteConf.template_id,
      type: "page",
    });
    await otherPage.editPage({ template: pageBuilderResp.variant }, pageResp.id);

    await test.step("Vào dashboard > Online Store > chọn Pages > Add new page > Customize", async () => {
      await webPageStyle.openWebBuilder({ type: "page", id: pageResp.id });
      await frameLocator.locator(blockPage.overlay).waitFor({ state: "hidden" });
      await frameLocator.locator(blockPage.progressBar).waitFor({ state: "detached" });
    });

    await test.step("ở Header bar > click Insert > Kéo block Form vào khu vực Page", async () => {
      await wbBlockFormPage.dragAndDropInWebBuilder({
        from: {
          category: "Basics",
          template: "Form",
        },
        to: {
          position: conf.suiteConf.position,
          isBottom: false,
        },
      });

      for await (const button of quickBarButtons) {
        const buttonVisible = await wbBlockFormPage.quickBarButton(button).isVisible();
        await expect(async () => {
          expect(buttonVisible).toBeTruthy();
        }).toPass();
      }
    });
  });
  test.afterEach(async () => {
    await otherPage.deletePage(pageResp.id);
  });
  test("Verify block Form được add vào Web Builder @SB_NEWECOM_BF_7", async ({ conf, snapshotFixture }) => {
    await test.step("Tạo Form > save > click icon Preview on new tab", async () => {
      await wbBlockFormPage.doSetting(designSettings, formSettings, true);
      const [formPage] = await Promise.all([
        wbBlockFormPage.page.waitForEvent("popup"),
        await wbBlockFormPage.clickBtnNavigationBar("preview"),
      ]);

      await expect(async () => {
        await formPage.bringToFront();
        await contactFormPage.page.reload();
        await contactFormPage.isTextVisible("Submit");
      }).toPass();

      contactFormPage = new ContactFormPage(formPage, domain);
      await snapshotFixture.verify({
        page: formPage,
        selector: contactFormPage.contactFormSelector,
        snapshotName: `${conf.caseConf.screen_shot}_${process.env.ENV}.png`,
        snapshotOptions: { maxDiffPixelRatio: 0.1 },
      });

      const { fields, inputSelectors, inputForm } = contactFormPage.getFieldsAndInputLocator(
        formSettings,
        conf.caseConf.input_type,
        conf.caseConf.input_form,
      );
      for await (const field of fields) {
        const label = field.label || field.name;
        if (field.placeholder) {
          const placeholder = await contactFormPage.genLoc(inputSelectors[label]).getAttribute("placeholder");
          expect(placeholder).toBe(field.placeholder);
        }
      }

      await contactFormPage.submitForm(
        fields.map(field => field.label || field.name),
        inputSelectors,
        inputForm,
        { inputType: conf.caseConf.input_type },
      );

      expect(await contactFormPage.isTextVisible(formSettings.submit_message)).toBeTruthy();
    });
  });
  test("Verify lưu audience data và gửi form qua email khi settings field Save form as chọn option Save lead and send email với form type Contact form @SB_NEWECOM_BF_14", async ({
    conf,
  }) => {
    await test.step("Vào tab Settings > ở field Save form as chọn option Save lead and send email", async () => {
      await wbBlockFormPage.doSetting(designSettings, formSettings, true);
    });

    await test.step("Click button Save > mở SF, đi đến trang đã config form > nhập thông tin > submit", async () => {
      await expect(async () => {
        await pageSf.bringToFront();
        const { fields, inputSelectors, inputForm } = contactFormPage.getFieldsAndInputLocator(
          formSettings,
          conf.caseConf.input_type,
          conf.caseConf.input_form,
        );
        await contactFormPage.page.reload();
        await contactFormPage.isTextVisible("Submit");
        await contactFormPage.submitForm(
          fields.map(field => field.label || field.name),
          inputSelectors,
          inputForm,
          { pageName: pageResp.handle, inputType: conf.caseConf.input_type },
        );
      }).toPass();

      expect(await contactFormPage.isTextVisible(formSettings.submit_message)).toBeTruthy();
    });

    await test.step("Mở email > verify file gửi qua mail", async () => {
      const sfCheckoutPage = new SFCheckout(page, domain);
      await sfCheckoutPage.openMailBox(formSettings.save_email);
      const mailBoxPage = new MailBox(page, domain);
      expect(mailBoxPage.hasLastestMailWithTitle(conf.caseConf.mail_title)).toBeTruthy();
    });
  });

  test("Verify hiển thị dòng code sau khi form được lưu thành công khi filed After submit chọn option Show coupon code @SB_NEWECOM_BF_16", async ({
    conf,
  }) => {
    await test.step("Vào tab Settings > ở filed After submit chọn option Show coupon code", async () => {
      await wbBlockFormPage.doSetting(designSettings, formSettings, true);
    });

    await test.step("Click button Save > mở SF, đi đến trang đã config form > nhập thông tin > submit", async () => {
      const { fields, inputSelectors, inputForm } = contactFormPage.getFieldsAndInputLocator(
        formSettings,
        conf.caseConf.input_type,
        conf.caseConf.input_form,
      );

      await expect(async () => {
        await pageSf.bringToFront();
        await contactFormPage.page.reload();
        await contactFormPage.isTextVisible("Submit");
        await contactFormPage.submitForm(
          fields.map(field => field.label || field.name),
          inputSelectors,
          inputForm,
          { pageName: pageResp.handle, inputType: conf.caseConf.input_type, waitType: "coupon" },
        );
      }).toPass();

      expect(await contactFormPage.getCouponCode()).toEqual(formSettings.coupon);
    });
  });

  test("Verify submit form khi setting After submit = Redirect to a URL @SB_NEWECOM_BF_17", async ({ conf }) => {
    await test.step("Vào tab Settings > ở filed After submit chọn option Redirect to a URL", async () => {
      await wbBlockFormPage.doSetting(designSettings, formSettings, true);
    });

    await test.step("Click button Save > mở SF, đi đến trang đã config form > nhập thông tin > submit", async () => {
      const { fields, inputSelectors, inputForm } = contactFormPage.getFieldsAndInputLocator(
        formSettings,
        conf.caseConf.input_type,
        conf.caseConf.input_form,
      );
      await expect(async () => {
        await contactFormPage.page.reload();
        await contactFormPage.isTextVisible("Submit");
        await contactFormPage.submitForm(
          fields.map(field => field.label || field.name),
          inputSelectors,
          inputForm,
          { pageName: pageResp.handle, inputType: conf.caseConf.input_type, waitType: "redirect" },
        );
      }).toPass();

      await contactFormPage.page.waitForURL(formSettings.submit_url);
      expect(contactFormPage.page.url()).toEqual(formSettings.submit_url);
    });
  });

  test("Verify send data Contact form lên sales channel Klaviyo @SB_NEWECOM_BF_19", async ({ conf, authRequest }) => {
    const { fields, inputSelectors, inputForm } = contactFormPage.getFieldsAndInputLocator(
      formSettings,
      conf.caseConf.input_type,
      conf.caseConf.input_form,
      {
        randomMail: true,
      },
    );

    // Setting klavyio
    saleChannelApi = new SaleChannelAPI(domain, authRequest);
    const saleChannels = await saleChannelApi.getSaleChannels({ marketing_type: "marketing_email" });
    for await (const saleChannel of saleChannels) {
      const data = conf.caseConf[saleChannel.code];
      if (!data) continue;
      await saleChannelApi.updateSaleChannel(saleChannel.id, { id: data.id, key: data.key });
    }

    await test.step("Mở form trên storefront > nhập thông tin > submit", async () => {
      await wbBlockFormPage.doSetting(designSettings, formSettings, true);
      await expect(async () => {
        await contactFormPage.page.reload();
        await contactFormPage.isTextVisible("Submit");
        await contactFormPage.submitForm(
          fields.map(field => field.label || field.name),
          inputSelectors,
          inputForm,
          { pageName: pageResp.handle, inputType: conf.caseConf.input_type },
        );
      }).toPass();
    });

    await test.step("Vào dashboard shop merchant > Contacts > search contacts theo email vừa submit", async () => {
      await customerPage.gotoCustomerList();
      await customerPage.searchContacts(inputForm.Email);
      expect(await customerPage.isCustomerExist(inputForm.Email)).toBeTruthy();
      await customerPage.switchToTab("Subscribers");
      expect(await customerPage.isCustomerExist(inputForm.Email)).toBeTruthy();
    });

    await test.step("Vào Klavyio > Audience > All contacts > Kiểm tra thông tin Customer được sync lên Audience", async () => {
      await expect(async () => {
        const members = await saleChannelApi.getKlavyioMembersByEmail({
          email: inputForm.Email,
          token: conf.caseConf["klaviyo"].key,
          revision: conf.caseConf["klaviyo"].revision,
        });
        expect(members.length).toBeGreaterThan(0);
      }).toPass();
    });
  });
});
