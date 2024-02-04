import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Resize text tự động cho preview, printfile", () => {
  let productId: number;
  let orderId: number;
  let lineItemId: number;
  let accessToken: string;
  let homePage;
  let printbase;

  test.beforeAll(async ({ conf, token, page }) => {
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_name,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;
    homePage = new SFHome(page, conf.suiteConf.domain);
    printbase = new PrintBasePage(page, conf.suiteConf.shop_domain);
  });
  test("[Shopbase] Check Preview resize text Product có các CO type Text field @TC_PB_PRB_RTPC_23", async ({
    page,
    conf,
  }) => {
    const productName = conf.caseConf.product_preview_text_field.name;
    conf.caseConf.product_preview_text_field.custom_options;

    await test.step(`Đi đến trang SF của shop > Search product`, async () => {
      await homePage.searchThenViewProduct(productName);
      await expect(page.locator(`//img[@alt='${productName}']']`)).toBeVisible();
    });
    await test.step(`Input text có độ dài > layer box: "Test text layer" > verify ảnh preview`, async () => {
      await printbase.inputCustomOptionSF(conf.caseConf.custom_option_info);
      await printbase.clickOnBtnPreviewSF();
      // chờ hiện đủ ảnh preview
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(10000);
    });

    expect(await page.locator("//img[@alt='Preview image']").screenshot()).toMatchSnapshot(`TC_PB_PRB_RTPC_23.png`, {
      threshold: 0.1,
    });
  });

  test("[Shopbase] Check Preview resize text Product có các CO type Radio @TC_PB_PRB_RTPC_29", async ({
    page,
    conf,
  }) => {
    const productName = conf.caseConf.product_preview_radio.name;

    await test.step(`Đi đến trang SF của shop > Search product`, async () => {
      await homePage.searchThenViewProduct(productName);
      await expect(page.locator(`//img[@alt='${productName}']']`)).toBeVisible();
    });
    await test.step(`Input text có độ dài > layer box: "Test text layer" > verify ảnh preview`, async () => {
      await printbase.inputCustomOptionSF(conf.caseConf.custom_option_info);
      await printbase.clickOnBtnPreviewSF();
    });
    // chờ hiện đủ ảnh preview
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(8000);
    expect(await page.locator("//img[@alt='Preview image']").screenshot()).toMatchSnapshot(`TC_PB_PRB_RTPC_29.png`, {
      threshold: 0.1,
    });
  });

  test("[Shopbase] Check Preview resize text Product có các CO type Droplist @TC_PB_PRB_RTPC_30", async ({
    page,
    conf,
  }) => {
    const productName = conf.caseConf.product_preview_droplist.name;

    await test.step(`
    Đi đến trang SF của shop > Search product
    `, async () => {
      await homePage.searchThenViewProduct(productName);
      await expect(page.locator(`//img[@alt='${productName}']']`)).toBeVisible();
    });
    await test.step(`Input text có độ dài > layer box: "Test text layer" > verify ảnh preview`, async () => {
      await printbase.inputCustomOptionSF(conf.caseConf.custom_option_info);
      await printbase.clickOnBtnPreviewSF();
      // chờ hiện đủ ảnh preview
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(8000);
      expect(await page.locator("//img[@alt='Preview image']").screenshot()).toMatchSnapshot(`TC_PB_PRB_RTPC_30.png`, {
        threshold: 0.1,
      });
    });
  });

  test("[Shopbase] Check Preview resize text Product có CO type Text area @TC_PB_PRB_RTPC_24", async ({
    page,
    conf,
  }) => {
    const productName = conf.caseConf.product.name;

    await test.step(`
    Đi đến trang SF của shop > Search product
    `, async () => {
      await homePage.searchThenViewProduct(productName);
      await expect(page.locator(`//img[@alt='${productName}']']`)).toBeVisible();
    });
    await test.step(`Input text có độ dài > layer box: "Test text layer" > verify ảnh preview`, async () => {
      await printbase.inputCustomOptionSF(conf.caseConf.custom_option_info);
      await printbase.clickOnBtnPreviewSF();
      // chờ hiện đủ ảnh preview
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(10000);
    });

    expect(await page.locator("//img[@alt='Preview image']").screenshot()).toMatchSnapshot(`TC_PB_PRB_RTPC_24.png`, {
      threshold: 0.1,
    });
  });

  test("[Shopbase] Check product có printfile có setting resize text đủ CO @TC_PB_PRB_RTPC_25", async ({
    page,
    conf,
    context,
  }) => {
    const checkout = new SFCheckout(page, conf.suiteConf.domain, "");
    const productName = conf.caseConf.product.name;
    const customOptionInfo = conf.caseConf.custom_option_info;
    const shippingInfo = conf.caseConf.shipping_info;
    const cardInfo = conf.caseConf.card_info;

    await test.step(`Đi đến store ngoài SF > search product`, async () => {
      await homePage.searchThenViewProduct(productName);
      await expect(page.locator(`//img[@alt='${productName}']']`)).toBeVisible();
    });
    await test.step(`Input Custom Option > check out product`, async () => {
      await printbase.inputCustomOptionSF(customOptionInfo);
      await printbase.clickOnBtnWithLabel("Add to cart");
      await printbase.clickOnBtnWithLabel("Checkout");
      await checkout.enterShippingAddress(shippingInfo);
      await checkout.continueToPaymentMethod();
      await checkout.completeOrderWithCardInfo(cardInfo);
      orderId = await checkout.getOrderIdBySDK();
    });

    await test.step(`Login dashboard > search order vừa checkout thành công > verify preview printfile`, async () => {
      await checkout.openOrderByAPI(orderId, accessToken);
      await printbase.previewPrintFile();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await page.locator("//a[normalize-space()='Preview']").click(),
      ]);
      const screenshot = await newPage.screenshot({
        path: "TC_PB_PRB_RTPC_25.png",
        fullPage: true,
      });
      expect(screenshot).toMatchSnapshot("TC_PB_PRB_RTPC_25.png", {
        threshold: 0.2,
      });
    });

    test(" [Shopbase] Add printfile trong order có setting resize text @TC_PB_PRB_RTPC_26", async ({
      page,
      conf,
      authRequest,
      context,
    }) => {
      const checkout = new SFCheckout(page, conf.suiteConf.domain, "");
      const shippingInfo = conf.suiteConf.shipping_info;
      const cardInfo = conf.suiteConf.card_info;

      await test.step(`Tạo product với Custom Option có setting resize text`, async () => {
        const body = conf.caseConf.product;
        const res = await authRequest.post(`https://${conf.suiteConf.domain}/admin/products.json`, {
          data: { product: body },
        });
        expect(res.status()).toBe(200);

        const resBody = await res.json();
        productId = resBody.product.id;
      });

      await test.step(`Click button View > input custom option > check out product`, async () => {
        const productName = conf.caseConf.product.title;
        await homePage.searchThenViewProduct(productName);
        await printbase.inputCustomOptionSF(conf.suiteConf.custom_option_info);
        await printbase.clickOnBtnWithLabel("Add to cart");
        await printbase.clickOnBtnWithLabel("Checkout");
        await checkout.enterShippingAddress(shippingInfo);
        await checkout.completeOrderWithCardInfo(cardInfo);
        orderId = await checkout.getOrderIdBySDK();
        lineItemId = await checkout.getLineItemIdBySDK();
      });

      await test.step(`Login admin > đi đến order detail vừa check out thành công > Add print file`, async () => {
        const artworks = conf.caseConf.artworks;
        const customOption = conf.caseConf.custom_options;
        const printFile = conf.caseConf.print_file;
        const isGenerateUnfulfillItem = conf.caseConf.is_generate_unfulfill_item;

        await checkout.openOrderByAPI(orderId, accessToken);
        await page.locator("//div[contains(text(),'Add print file')]").click();
        const res = await authRequest.post(
          `https://${conf.suiteConf.domain}/admin/pod_product/${productId}/artwork.json?type=print_file`,
          {
            data: {
              artworks: artworks,
              custom_options: customOption,
              print_file: printFile,
              is_generate_unfulfill_item: isGenerateUnfulfillItem,
              order_id: orderId,
              line_item_id: lineItemId,
            },
          },
        );
        expect(res.status()).toBe(200);
      });

      await test.step(`Verify ảnh preview của print file sau khi được render thành công`, async () => {
        const printFileLoc = "//span[contains(text(),'Print file has been generated')]";
        const isPrintFile = await page.locator(printFileLoc).isVisible();
        expect(isPrintFile).toEqual(true);
        await page.locator("(//div[@role='button']//button[@type='button'])[2]").click();
        const [newPage] = await Promise.all([
          context.waitForEvent("page"),
          await page.locator("//a[normalize-space()='Preview']").click(),
        ]);
        const screenshot = await newPage.screenshot({
          path: "TC_PB_PRB_RTPC_26.png",
          fullPage: true,
        });
        expect(screenshot).toMatchSnapshot("TC_PB_PRB_RTPC_26.png", {
          threshold: 0.1,
        });
      });
    });
  });
});
