import { test, expect } from "@core/fixtures";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { AllProductStorefront } from "@pages/shopbase_creator/storefront/all_product";

test.describe("verify UI stater template cho product", async () => {
  let currentPage: AllProductStorefront;
  test.beforeEach(async ({ page, conf }) => {
    currentPage = new AllProductStorefront(page, conf.suiteConf.domain);
  });

  test(`@SB_SC_SCSF_SCSFC_41 Verify UI của product tại màn checkout`, async ({ conf }) => {
    const { product_info: productInfo } = conf.caseConf;
    await test.step(`Tại màn hình check out -> Verify thông tin hiển thị  của product`, async () => {
      await currentPage.goto();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.waitForSelector(
        "(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]",
      );
      await currentPage.page.click(`(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]`);
      await currentPage.page.waitForURL(new RegExp("products/the-complete-2023-web-development-bootcamp"));
      const productName = await currentPage
        .genLoc("//div[@class='w-100 h-100 break-words block-heading white-space-pre-wrap']")
        .first()
        .textContent();
      const productDescription = await currentPage.getTextContent("//div[@class='custom-code__content'][1]");
      await currentPage.page.waitForSelector("//div[@class='block-image w-100 h-100']");
      const productThumbnail = currentPage.genLoc("//div[@class='block-image w-100 h-100']");
      const paymentMethod = currentPage.genLoc("//div[@class='payment-methods__container']");
      const emailField = currentPage.genLoc("//div[@class='input-base--wrapper']").first();
      const discountField = currentPage.genLoc("//input[@placeholder='Discount code']").first();
      const pricing = currentPage
        .genLoc("//div[@class='total-price flex justify-space-between items-center px-16 py-12']")
        .first();
      expect(productName.trim()).toBe(productInfo.product_title);
      expect(productDescription).toBe(productInfo.product_desc);
      await expect(productThumbnail).toBeVisible();
      await expect(paymentMethod).toBeVisible();
      await expect(emailField).toBeVisible();
      await expect(discountField).toBeVisible();
      await expect(pricing).toBeVisible();
    });
  });

  test(`@SB_SC_SCSF_SCSFC_43 Verify ảnh thumb của product khi thực hiện check out product ngoài SF`, async ({
    conf,
    dashboard,
  }) => {
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const { product_info: productInfo } = conf.caseConf;

    await test.step(`Tại màn hình check out -> Verify ảnh thumb của product `, async () => {
      await currentPage.goto();
      // await currentPage.gotoHomePage();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.waitForSelector(
        "(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]",
      );
      await currentPage.page.click(`(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]`);
      await currentPage.page.waitForURL(new RegExp("products/the-complete-2023-web-development-bootcamp"));
      await currentPage.page.waitForSelector("//div[@class='block-image w-100 h-100']/div/img");
      const srcImage = await currentPage.genLoc("//div[@class='block-image w-100 h-100']/div/img").getAttribute("src");
      expect(srcImage).toEqual(productInfo.product_image);
    });

    await test.step(`Tại dashboard: Products -> Sreach product The Complete 2023 Web Development Bootcamp -> click vào product -> tại General -> thumbnail image -> Thực hiện xóa image -> Click button Save `, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.waitUtilSkeletonDisappear();
      await productPage.searchProduct("The Complete 2023 Web Development Bootcamp");
      await productPage.clickTitleProduct("The Complete 2023 Web Development Bootcamp");
      await productPage.waitUtilSkeletonDisappear();
      await productPage.clickButtonDeleteImage();
      const isDeletedImage = await productPage.checkButtonVisible("Upload file");
      expect(isDeletedImage).toEqual(true);
    });

    await test.step(`Ngoài SF: Tại màn all collections -> click vào product The Complete 2023 Web Development Bootcamp -> Tại màn hình check out -> Verify ảnh thumb của product `, async () => {
      // await currentPage.page.waitForTimeout(4000);
      // await currentPage.gotoHomePage();
      await currentPage.goto();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.waitForSelector(
        "(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]",
      );
      await currentPage.page.click(`(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]`);
      await currentPage.page.waitForURL(new RegExp("products/the-complete-2023-web-development-bootcamp"));
      await currentPage.page.waitForSelector("//div[@class='block-image w-100 h-100']/div/img");
      const srcImage = await currentPage.genLoc("//div[@class='block-image w-100 h-100']/div/img").getAttribute("src");
      expect(srcImage).toContain("data:image/png");
    });

    await test.step(`Tại dashboard: Products -> Sreach product The Complete 2023 Web Development Bootcamp -> click vào product -> tại General -> thumbnail image -> Thực hiện add image theo data -> Click button Save `, async () => {
      await productPage.page.getByPlaceholder("Paste your URL here").click();
      await productPage.page.getByPlaceholder("Paste your URL here").fill(productInfo.product_image);
      await productPage.page.getByRole("button", { name: "Add", exact: true }).click();
      await productPage.page.waitForSelector(productPage.xpathImageProductDetail);
      const imgSrc = await productPage.genLoc(productPage.xpathImageProductDetail).getAttribute("src");
      expect(imgSrc).toEqual(productInfo.product_image);
    });

    await test.step(`Ngoài SF: Tại màn all collections -> click vào product The Complete 2023 Web Development Bootcamp -> Tại màn hình check out -> Verify ảnh thumb của product `, async () => {
      // await currentPage.page.waitForTimeout(1500);
      // await currentPage.page.reload();
      // // await currentPage.page.waitForLoadState('networkidle');
      // await currentPage.page.waitForTimeout(4000);
      await currentPage.goto();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.reload();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.waitForSelector(
        "(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]",
      );
      await currentPage.page.click(`(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]`);
      await currentPage.page.waitForURL(new RegExp("products/the-complete-2023-web-development-bootcamp"));
      await currentPage.page.waitForSelector("//div[@class='block-image w-100 h-100']/div/img");
      const srcImage = await currentPage.genLoc("//div[@class='block-image w-100 h-100']/div/img").getAttribute("src");
      expect(srcImage).toEqual(productInfo.product_image);
    });
  });

  test(`@SB_SC_SCSF_SCSFC_44 Verrify description của product khi thực hiện checkout product ngoài SF`, async ({
    conf,
    dashboard,
  }) => {
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const { product_info: productInfo } = conf.caseConf;
    const xpathDescriptionSF = "//div[@class='custom-code__content'][1]";

    await test.step(`Tại màn hình check out -> Verify description của product `, async () => {
      await currentPage.goto();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.waitForSelector(
        "(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]",
      );
      await currentPage.page.click(`(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]`);
      await currentPage.page.waitForURL(new RegExp("products/the-complete-2023-web-development-bootcamp"));
      await currentPage.page.waitForSelector(xpathDescriptionSF);
      const productDes = await currentPage.getTextContent(xpathDescriptionSF);
      expect(productDes).toEqual(productInfo.product_desc);
    });

    await test.step(`Tại dashboard: Products -> Sreach product The Complete 2023 Web Development Bootcamp -> click vào product -> tại General -> Thực hiện xóa description -> Click button Save `, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.waitUtilSkeletonDisappear();
      await productPage.searchProduct("The Complete 2023 Web Development Bootcamp");
      await productPage.clickTitleProduct("The Complete 2023 Web Development Bootcamp");
      await productPage.waitUtilSkeletonDisappear();
      await productPage.page
        .frameLocator("(//iframe[@title = 'Rich Text Area'])[1]")
        .locator("//body[contains(@class,'content-body')]")
        .fill("");
      await productPage.page.click(productPage.xpathSaveButton);
      await productPage.page.waitForSelector(productPage.xpathToastMsg);
      const toastMessageContent = await productPage.getTextContent(productPage.xpathToastMsg);
      const productDescription = await productPage.page
        .frameLocator("(//iframe[@title = 'Rich Text Area'])[1]")
        .locator("//body[contains(@class,'content-body')]")
        .textContent();
      expect(toastMessageContent).toEqual("Update product successfully");
      expect(productDescription).toEqual("");
    });

    await test.step(`Ngoài SF: Tại màn all collections -> click vào product The Complete 2023 Web Development Bootcamp -> Tại màn hình check out -> Verify description của product `, async () => {
      // fill your code here
      await currentPage.goto();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.waitForSelector(
        "(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]",
      );
      // await currentPage.page.waitForTimeout(4000);
      await currentPage.page.click(`(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]`);
      await currentPage.page.waitForURL(new RegExp("products/the-complete-2023-web-development-bootcamp"));
      // await currentPage.page.waitForSelector(xpathDescriptionSF);
      // const productDes = await currentPage.getTextContent(xpathDescriptionSF);
      await expect(currentPage.genLoc(xpathDescriptionSF)).toBeHidden();
    });

    await test.step(`Tại dashboard: Products -> Sreach product The Complete 2023 Web Development Bootcamp -> click vào product -> tại General-> Thực hiện add description theo data -> Click button Save `, async () => {
      // fill your code here
      await productPage.page
        .frameLocator("(//iframe[@title = 'Rich Text Area'])[1]")
        .locator("//body[contains(@class,'content-body')]")
        .fill(productInfo.product_desc);
      await productPage.page.click(productPage.xpathSaveButton);
      await productPage.page.waitForSelector(productPage.xpathToastMsg);
      const toastMessageContent = await productPage.getTextContent(productPage.xpathToastMsg);
      expect(toastMessageContent).toEqual("Update product successfully");
    });

    await test.step(`Ngoài SF: Tại màn all collections -> click vào product The Complete 2023 Web Development Bootcamp -> Tại màn hình check out -> Verify description của product `, async () => {
      await currentPage.goto();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.waitForSelector(
        "(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]",
      );
      // await currentPage.page.waitForTimeout(4000);
      await currentPage.page.click(`(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]`);
      await currentPage.page.waitForURL(new RegExp("products/the-complete-2023-web-development-bootcamp"));
      await currentPage.page.waitForSelector(xpathDescriptionSF);
      const productDes = await currentPage.getTextContent(xpathDescriptionSF);
      await expect(productDes).toEqual(productInfo.product_desc);
    });
  });

  test(`@SB_SC_SCSF_SCSFC_45 Verify Name của product khi thực hiện checkout product ngoài SF`, async ({
    conf,
    dashboard,
  }) => {
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const { product_info: productInfo } = conf.caseConf;
    const xpathNameProduct = "//div[contains(@class,'block-heading')]";

    await test.step(`Tại màn hình check out -> Verify name của product `, async () => {
      await currentPage.goto();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.waitForSelector(
        "(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]",
      );
      await currentPage.page.click(`(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]`);
      await currentPage.page.waitForURL(new RegExp("products/the-complete-2023-web-development-bootcamp"));
      const productName = await currentPage.genLoc(xpathNameProduct).first().textContent();
      expect(productName).toEqual(productInfo.product_title);
    });

    await test.step(`Tại dashboard: Products -> Sreach product The Complete 2023 Web Development Bootcamp -> click vào product -> tại General-> Thực hiện edit name của product theo data -> Click button Save `, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.waitUtilSkeletonDisappear();
      await productPage.searchProduct("The Complete 2023 Web Development Bootcamp");
      await productPage.clickTitleProduct("The Complete 2023 Web Development Bootcamp");
      await productPage.waitUtilSkeletonDisappear();
      await productPage.inputTitleProduct(conf.caseConf.update_title);
      await productPage.page.click(productPage.xpathSaveButton);
      await productPage.page.waitForSelector(productPage.xpathToastMsg);
      const toastMessageContent = await productPage.getTextContent(productPage.xpathToastMsg);
      expect(toastMessageContent).toEqual("Update product successfully");
    });

    await test.step(`Ngoài SF: Tại màn all collections -> click vào product The Complete 2023 Web Development Bootcamp -> Tại màn hình check out -> Verify name của product `, async () => {
      // fill your code here
      await currentPage.goto();
      await currentPage.page.waitForLoadState("networkidle");
      // wait for update title product in collection
      await currentPage.page.reload();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.waitForSelector(`(//a[normalize-space()='${conf.caseConf.update_title}'])[1]`);
      // await currentPage.page.waitForTimeout(4000);
      await currentPage.page.click(`(//a[normalize-space()='${conf.caseConf.update_title}'])[1]`);
      await currentPage.page.waitForURL(new RegExp("products/the-complete-2023-web-development-bootcamp"));
      const productName = await currentPage
        .genLoc("//div[@class='w-100 h-100 break-words block-heading white-space-pre-wrap']")
        .first()
        .textContent();
      expect(productName).toEqual(conf.caseConf.update_title);
    });
  });

  test(`@SB_SC_SCSF_SCSFC_46 Verify checkout product thành công khi sử dụng các template khác nhau`, async ({
    dashboard,
    conf,
  }) => {
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const { user_email: userEmail, product_info: productInfo } = conf.caseConf;

    await test.step(`Tại màn hình check out -> nhập các thông tin checkout theo data -> Click button Pay now`, async () => {
      await currentPage.goto();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.waitForSelector(`(//a[normalize-space()=${productInfo.product_title}])[1]`);
      await currentPage.page.click(`(//a[normalize-space()=${productInfo.product_title}])[1]`);
      await currentPage.page.waitForURL(new RegExp("products/the-complete-2023-web-development-bootcamp"));
      await currentPage.page.waitForSelector('//input[@placeholder="Your email address"]');
      await currentPage.page.getByPlaceholder("Your email address").click();
      await currentPage.page.getByPlaceholder("Your email address").fill(userEmail);
      await currentPage.page.frameLocator("#stripe-frame-form-wrapper").getByPlaceholder("Card number").click();
      await currentPage.page
        .frameLocator("#stripe-frame-form-wrapper")
        .getByPlaceholder("Card number")
        .fill("4111 1111 1111 1111");
      await currentPage.page.frameLocator("#stripe-frame-form-wrapper").getByPlaceholder("MM / YY").click();
      await currentPage.page.frameLocator("#stripe-frame-form-wrapper").getByPlaceholder("MM / YY").fill("09 / 30");
      await currentPage.page.frameLocator("#stripe-frame-form-wrapper").getByPlaceholder("CVV").click();
      await currentPage.page.frameLocator("#stripe-frame-form-wrapper").getByPlaceholder("CVV").fill("123");
      await currentPage.page.getByRole("button", { name: "Pay now" }).click();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.waitForSelector(
        '//div[contains(@class,"block-paragraph") and contains(normalize-space(),"Thank you")]',
      );
      const thankYouElement = currentPage.page.locator(
        '//div[contains(@class,"block-paragraph") and contains(normalize-space(),"Thank you")]',
      );
      await expect(thankYouElement).toBeVisible();
    });

    await test.step(`Tại dashboard: Products -> Sreach product The Complete 2023 Web Development Bootcamp -> click vào product -> Click buton Design sales page -> add theme cho product theo data `, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.waitUtilSkeletonDisappear();
      await productPage.searchProduct("The Complete 2023 Web Development Bootcamp");
      await productPage.clickTitleProduct("The Complete 2023 Web Development Bootcamp");
      await productPage.page.getByRole("button", { name: "Design Sales Page" }).click();
      await productPage.page.waitForURL(new RegExp("admin/builder/page"));
      await productPage.page.waitForLoadState("networkidle");
      await productPage.page.getByRole("button", { name: "Templates" }).click();
      await productPage.page.waitForLoadState("networkidle");
      await productPage.page.getByRole("textbox", { name: 'Try "Ebook"' }).click();
      await productPage.page.getByRole("textbox", { name: 'Try "Ebook"' }).fill("Language course");
      // wait for debouce search
      await productPage.page.waitForTimeout(2000);
      await productPage.page.waitForSelector('//div[@class="sb-relative sb-choose-template__wrap"]//figure');
      await productPage.page.hover('//div[@class="sb-relative sb-choose-template__wrap"]//figure');
      // await productPage.page.waitForTimeout(7000);
      await productPage
        .genLoc("//div[@class='sb-choose-template__template']//figure//button[normalize-space()='Apply']")
        .first()
        .click();
      await productPage
        .genLoc(
          '//div[@class="sb-popup__footer-container sb-w-100 sb-flex sb-justify-space-between"]//button[normalize-space()="Apply"]',
        )
        .click();
      await productPage.page.waitForLoadState("networkidle");
      await productPage.page.getByRole("button", { name: "Save" }).click();
      await productPage.page.waitForSelector(
        "//div[normalize-space()='All changes are saved' and contains(@class,'toast__message')]",
      );
      const toastMessage = productPage.genLoc(
        "//div[normalize-space()='All changes are saved' and contains(@class,'toast__message')]",
      );
      await expect(toastMessage).toContainText("All changes are saved");
    });

    await test.step(`Ngoài SF: Tại màn all collections -> click vào product The Complete 2023 Web Development Bootcamp -> Tại màn hình check out -> Verify theme của product `, async () => {
      await currentPage.goto();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.waitForSelector(
        "(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]",
      );
      // await currentPage.page.waitForTimeout(4000);
      await currentPage.page.click(`(//a[normalize-space()='The Complete 2023 Web Development Bootcamp'])[1]`);
      await currentPage.page.waitForURL(new RegExp("products/the-complete-2023-web-development-bootcamp"));
      const titleTheme = await currentPage
        .genLoc("//div[contains(@class,'block-heading')]//span[normalize-space()='Online, Connect with Others']")
        .textContent();
      expect(titleTheme).toContain("Online, Connect with Others");
    });

    await test.step(`nhập các thông tin checkout theo data -> Click button Pay now`, async () => {
      await currentPage.page.waitForSelector('//input[@placeholder="Your email address"]');
      await currentPage.page.getByPlaceholder("Your email address").click();
      await currentPage.page.getByPlaceholder("Your email address").fill(userEmail);
      await currentPage.page.frameLocator("#stripe-frame-form-wrapper").getByPlaceholder("Card number").click();
      await currentPage.page
        .frameLocator("#stripe-frame-form-wrapper")
        .getByPlaceholder("Card number")
        .fill("4111 1111 1111 1111");
      await currentPage.page.frameLocator("#stripe-frame-form-wrapper").getByPlaceholder("MM / YY").click();
      await currentPage.page.frameLocator("#stripe-frame-form-wrapper").getByPlaceholder("MM / YY").fill("09 / 30");
      await currentPage.page.frameLocator("#stripe-frame-form-wrapper").getByPlaceholder("CVV").click();
      await currentPage.page.frameLocator("#stripe-frame-form-wrapper").getByPlaceholder("CVV").fill("123");
      await currentPage.page.getByRole("button", { name: "Pay now" }).click();
      await currentPage.page.waitForLoadState("networkidle");
      await currentPage.page.waitForSelector(
        '//div[contains(@class,"block-paragraph") and contains(normalize-space(),"Thank you")]',
      );
      const thankYouElement = currentPage.page.locator(
        '//div[contains(@class,"block-paragraph") and contains(normalize-space(),"Thank you")]',
      );
      await expect(thankYouElement).toBeVisible();
    });
  });

  test(`@SB_SC_SCSF_SCSFC_42 Verify product apply stater template`, async ({ dashboard, conf, context }) => {
    const productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    const { product_info: productInfo } = conf.caseConf;

    await test.step(`- Tại dashboard Product A -> Click vào design sales page -> Verify thông tin hiển thị`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.waitUtilSkeletonDisappear();
      await productPage.page.getByRole("button", { name: "Add product" }).click();
      await productPage.page.locator("div").filter({ hasText: "Title 0 / 255" }).getByRole("textbox").first().click();
      await productPage.page
        .locator("div")
        .filter({ hasText: "Title 0 / 255" })
        .getByRole("textbox")
        .first()
        .fill(productInfo.product_title);
      await productPage.page.getByRole("button", { name: "Add product" }).click();
      await productPage.page.getByRole("button", { name: "Preview" }).click();
      const [salePage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.page
          .getByRole("tooltip", { name: "Preview sales page Preview content as member" })
          .getByText("Preview sales page")
          .click(),
      ]);
      await salePage.waitForLoadState("networkidle");
      const productName = await salePage.locator('//div[contains(@class,"block-heading")]').first().textContent();
      const emailField = salePage.locator("//div[normalize-space()='Email address']").first();
      const pricing = salePage
        .locator("//div[@class='total-price flex justify-space-between items-center px-16 py-12']")
        .first();
      const srcImage = await salePage.locator("//div[@class='block-image w-100 h-100']/div/img").getAttribute("src");
      const xpathDescriptionSF = "//div[@class='custom-code__content'][1]";
      const paymentMethodProvider = salePage.locator('//div[contains(@class,"payment-methods__container")]');
      expect(srcImage).toContain("data:image/png");
      expect(productName).toContain(productInfo.product_title);
      await expect(emailField).toBeVisible();
      await expect(pricing).toBeVisible();
      await expect(salePage.locator(xpathDescriptionSF)).toBeHidden();
      // free product
      await expect(paymentMethodProvider).toBeHidden();
    });

    await test.step(`Tại dashboard: Online store -> Design -> thực hiện customize theme Neubrutalism -> chọn Product detail page -> Thực hiện update các thông tin tại product detail theo data -> click button Save page`, async () => {
      await productPage.navigateToMenu("Online Store");
      // await productPage.page.waitForLoadState("networkidle");
      await productPage.page.getByRole("button", { name: "Customize", exact: true }).click();
      await productPage.page.waitForURL(new RegExp("admin/builder/site"));
      await productPage.page.locator('button[name="Pages"]').click();
      await productPage.page.getByText("Product detail").click();
      await productPage.page.waitForLoadState("networkidle");
      await productPage.page
        .frameLocator("#preview")
        .locator('//div[contains(@class,"checkout-form__container")]')
        .click();
      await productPage.genLoc('//div[contains(@class,"sb-tab-navigation__item")][1]').click();
      await productPage.genLoc('(//label[normalize-space()="Paynow label"]//following::div//input)[1]').click();
      await productPage
        .genLoc('(//label[normalize-space()="Paynow label"]//following::div//input)[1]')
        .fill("Mua ngay");
      await productPage.genLoc('(//label[normalize-space()="Paynow label"]//following::div//input)[1]').press("Enter");
      const checkboxTermValue = await productPage.page
        .locator("(//label[contains(@class, 'sb-checkbox')]//input)[1]")
        .inputValue();
      if (checkboxTermValue === "true") {
        await productPage.genLoc('(//label[contains(@class,"sb-checkbox")]//span[@class="sb-check"])[1]').click();
      }
      // wait for button enabel
      await productPage.page.waitForTimeout(1000);
      const isSaveButtonEnabled = await productPage.page.locator("//button[normalize-space()='Save']").isEnabled({
        timeout: 3000,
      });
      if (isSaveButtonEnabled) {
        await productPage.page.getByRole("button", { name: "Save" }).click();
      }
      await productPage.page.waitForSelector("//div[contains(@class,'toast__message')]");
      const toastMessage = productPage.genLoc("//div[contains(@class,'toast__message')]");
      await expect(toastMessage).toContainText("All changes are saved");
    });

    await test.step(`Tại màn hình web-builder: click button preview -> veify thông tin hiển thị`, async () => {
      // fill your code here
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.page.locator('button[name="Preview on new tab"]').click(),
      ]);
      await newPage.waitForLoadState("networkidle");
      await newPage.waitForSelector("//button[contains(@class,'paynow')]");
      const textButtonPay = await newPage.locator("//button[contains(@class,'paynow')]").textContent();
      expect(textButtonPay).toContain("Mua ngay");
      await expect(
        newPage.locator('//span[normalize-space()="I accept the Terms of Services and Privacy Policy"]').first(),
      ).toBeHidden();
    });

    await test.step(`Tại màn hình web-builder: thực hiện chọn template Language Course cho product -> Click button preview -> Verify thông tin hiển thị`, async () => {
      await productPage.page.getByRole("button", { name: "Templates" }).click();
      // await productPage.page.waitForLoadState('networkidle');
      await productPage.page.getByRole("textbox", { name: 'Try "Ebook"' }).click();
      await productPage.page.getByRole("textbox", { name: 'Try "Ebook"' }).fill("Language course");
      // wait for debounce
      await productPage.page.waitForTimeout(2000);
      await productPage.page.waitForSelector('//div[@class="sb-relative sb-choose-template__wrap"]//figure');
      await productPage.page.hover('//div[@class="sb-relative sb-choose-template__wrap"]//figure');
      await productPage
        .genLoc("//div[@class='sb-choose-template__template']//figure//button[normalize-space()='Apply']")
        .first()
        .click();
      await productPage
        .genLoc(
          '//div[@class="sb-popup__footer-container sb-w-100 sb-flex sb-justify-space-between"]//button[normalize-space()="Apply"]',
        )
        .click();
      await productPage.page.waitForLoadState("networkidle");
      await productPage.page.getByRole("button", { name: "Save" }).click();
      await productPage.page.waitForSelector(
        "//div[normalize-space()='All changes are saved' and contains(@class,'toast__message')]",
      );
      const toastMessage = productPage.genLoc(
        "//div[normalize-space()='All changes are saved' and contains(@class,'toast__message')]",
      );
      await expect(toastMessage).toContainText("All changes are saved");
      const [newPreviewPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.page.locator('button[name="Preview on new tab"]').click(),
      ]);
      await newPreviewPage.waitForLoadState("networkidle");
      await newPreviewPage.waitForSelector(
        "//div[contains(@class,'block-heading')]//span[normalize-space()='Online, Connect with Others']",
      );
      const headerTemplate = await newPreviewPage
        .locator("//div[contains(@class,'block-heading')]//span[normalize-space()='Online, Connect with Others']")
        .textContent();
      expect(headerTemplate).toContain("Online, Connect with Others");
      await expect(newPreviewPage.getByRole("button", { name: "Pay now" })).toBeVisible();
    });

    await test.step(`Tại màn hình web-builder: Thực hiện update các thông tin tại product detail theo data -> click button Save page -> Click button preview`, async () => {
      // reload page again to update preview section
      await productPage.page.reload();
      await productPage.page
        .frameLocator("#preview")
        .locator('//div[contains(@class,"checkout-form__container")]')
        .click();
      await productPage.genLoc('//div[contains(@class,"sb-tab-navigation__item")][1]').click();
      await productPage.genLoc('(//label[normalize-space()="Paynow label"]//following::div//input)[1]').click();
      await productPage
        .genLoc('(//label[normalize-space()="Paynow label"]//following::div//input)[1]')
        .fill("Mua ngay");
      await productPage.genLoc('(//label[normalize-space()="Paynow label"]//following::div//input)[1]').press("Enter");
      const checkboxTermValue = await productPage.page
        .locator("(//label[contains(@class, 'sb-checkbox')]//input)[1]")
        .inputValue();
      if (checkboxTermValue === "true") {
        await productPage.genLoc('(//label[contains(@class,"sb-checkbox")]//span[@class="sb-check"])[1]').click();
      }
      await productPage.page.getByRole("button", { name: "Save" }).click();
      await productPage.page.waitForSelector("//div[contains(@class,'toast__message')]");
      const toastMessage = await productPage.genLoc("//div[contains(@class,'toast__message')]").textContent();
      const [newPreviewPage] = await Promise.all([
        context.waitForEvent("page"),
        productPage.page.locator('button[name="Preview on new tab"]').click(),
      ]);
      await newPreviewPage.waitForSelector("//button[contains(@class,'paynow')]");
      const textButtonPay = await newPreviewPage.locator("//button[contains(@class,'paynow')]").textContent();
      expect(toastMessage).toContain("All changes are saved");
      expect(textButtonPay).toContain("Mua ngay");
      await expect(
        newPreviewPage.locator('//span[normalize-space()="I accept the Terms of Services and Privacy Policy"]').first(),
      ).toBeHidden();
    });
  });
});
