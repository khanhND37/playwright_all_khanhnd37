import { test, expect } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";

test.describe("Feature bulk update variant", async () => {
  let shopDomain: string;
  let productPage: ProductPage;
  let homePage: SFHome;
  let timeOut: number;
  let productPageSf: SFProduct;

  test.beforeEach(async ({ dashboard, conf }) => {
    shopDomain = conf.suiteConf.domain;
    timeOut = conf.suiteConf.time_out;
    productPage = new ProductPage(dashboard, shopDomain);
  });

  test(`[PlusBase] Verify error message khi merchant update các variant option trùng nhau @SB_PLB_BUV_10`, async ({
    conf,
  }) => {
    await test.step(`Vào Products > All products> Click chọn product`, async () => {
      const product = conf.caseConf.product;
      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.searchProduct(product);
      await productPage.chooseProduct(product);
    });

    await test.step(`Edit variant name, sau đó click button Save`, async () => {
      await productPage.clickOnBtnWithLabel("Edit");
      await productPage.editVariantProduct(conf.caseConf.firstVariant, conf.caseConf.secondVariant);
      await expect(productPage.isTextVisible("Variant name cannot be duplicated")).toBeTruthy();
      await expect(productPage.page.locator(productPage.xpathBtnWithLabel("Save"))).toBeDisabled();
    });

    await test.step(`Edit variant value, sau đó out focus`, async () => {
      await productPage.clickOnBtnWithLabel("Edit");
      await productPage.locatorVariantOption(conf.caseConf.thirdValue).fill(conf.caseConf.firstValue);
      await productPage.locatorVariantOption(conf.caseConf.secondValue).click();
      await expect(productPage.isTextVisible("Variant name cannot be duplicated")).toBeTruthy();
      await expect(productPage.page.locator(productPage.xpathBtnWithLabel("Save", 2))).toBeDisabled();
    });
  });

  test(`[PlusBase] Verify variant của product sau sau khi update variant name @SB_PLB_BUV_3`, async ({
    conf,
    context,
  }) => {
    const product = conf.caseConf.product;
    const oldVariant = conf.caseConf.oldVariantName;
    const newVariant = conf.caseConf.newVariantName;

    await test.step(`Vào Products > Mở product detail`, async () => {
      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.searchProduct(product);
      await productPage.chooseProduct(product);

      //Reset variant value

      if (await productPage.isTextVisible(newVariant, 1, timeOut)) {
        await productPage.clickOnBtnWithLabel("Edit");
        await productPage.editVariantProduct(newVariant, oldVariant);
        await productPage.clickOnBtnWithLabel("Save changes");
        expect(await productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
        await productPage.waitForToastMessageHide("Product was successfully saved!");
      }
    });

    await test.step(`Sửa variant name "Color": Nhập variant vào textbox Variant name > Click button"Save"`, async () => {
      await productPage.clickOnBtnWithLabel("Edit");
      await productPage.editVariantProduct(oldVariant, newVariant);
      await productPage.clickOnBtnWithLabel("Save changes");
      expect(await productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
    });

    await test.step(`Mở storefront > Vào product detail page > Verify variants của product `, async () => {
      const [newPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductOnSF()]);
      homePage = new SFHome(newPage, shopDomain);
      expect(await homePage.isTextVisible(newVariant)).toBeTruthy();
    });
  });

  test(`[PlusBase] Verify variant của product sau sau khi update variant value @SB_PLB_BUV_4`, async ({
    conf,
    context,
  }) => {
    const product = conf.caseConf.product;
    const oldColor = conf.caseConf.oldColor;
    const newColor = conf.caseConf.newColor;
    const oldSize = conf.caseConf.oldSize;
    const newSize = conf.caseConf.newSize;

    await test.step(`Vào Products > Mở product detail`, async () => {
      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.searchProduct(product);
      await productPage.chooseProduct(product);

      //Reset variant value
      if (await productPage.isTextVisible(newColor, 1, timeOut)) {
        await productPage.clickOnBtnWithLabel("Edit");
        await productPage.editVariantProduct(newColor, oldColor);
        await productPage.clickOnBtnWithLabel("Save changes");
        expect(await productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
        await productPage.waitForToastMessageHide("Product was successfully saved!");
      }

      if (await productPage.isTextVisible(newSize, 1, timeOut)) {
        await productPage.clickOnBtnWithLabel("Edit", 2);
        await productPage.editVariantProduct(newSize, oldSize);
        await productPage.clickOnBtnWithLabel("Save changes");
        expect(await productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
        await productPage.waitForToastMessageHide("Product was successfully saved!");
      }
    });

    await test.step(`Sửa variant value > Click button"Save"`, async () => {
      await productPage.clickOnBtnWithLabel("Edit");
      await productPage.editVariantProduct(oldColor, newColor);
      await productPage.clickOnBtnWithLabel("Edit", 2);
      await productPage.editVariantProduct(oldSize, newSize);
      await productPage.clickOnBtnWithLabel("Save changes");
      expect(await productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
    });

    await test.step(`Mở storefront > Vào product detail page > Verify variants của product `, async () => {
      const [newPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductOnSF()]);
      homePage = new SFHome(newPage, shopDomain);
      expect(await homePage.isTextVisible(newColor)).toBeTruthy();
      expect(await homePage.isTextVisible(newSize)).toBeTruthy();
    });
  });

  test(`[PlusBase] Verify variant của product sau khi update variant với product đã được mapping size chart @SB_PLB_BUV_9`, async ({
    conf,
    context,
  }) => {
    const product = conf.caseConf.product;
    const firstColor = conf.caseConf.firstColor;
    const secondColor = conf.caseConf.secondColor;
    const firstNewColor = conf.caseConf.firstNewColor;
    const secondNewColor = conf.caseConf.secondNewColor;

    await test.step(`Vào Product > All products > Mở product detail > Verify block Variant options Size`, async () => {
      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.searchProduct(product);
      await productPage.chooseProduct(product);

      //Reset variant value

      if (await productPage.isTextVisible(firstNewColor, 1, timeOut)) {
        await productPage.clickOnBtnWithLabel("Edit");
        await productPage.editVariantProduct(firstNewColor, firstColor);
        await productPage.clickOnBtnWithLabel("Save changes");
        expect(await productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
        await productPage.waitForToastMessageHide("Product was successfully saved!");
      }

      if (await productPage.isTextVisible(secondNewColor, 1, timeOut)) {
        await productPage.clickOnBtnWithLabel("Edit");
        await productPage.editVariantProduct(secondNewColor, secondColor);
        await productPage.clickOnBtnWithLabel("Save changes");
        expect(await productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
        await productPage.waitForToastMessageHide("Product was successfully saved!");
      }

      //Verify block Variant options Size
      await productPage.clickOnBtnWithLabel("Edit", 2);
      for (const size of conf.caseConf.listSize) {
        await expect(productPage.locatorVariantOption(size)).toBeDisabled();
      }
    });

    await test.step(`Edit variant value của option Color > click button "Save" > Click button "Save changes"`, async () => {
      await productPage.clickOnBtnWithLabel("Edit");
      await productPage.editVariantProduct(firstColor, firstNewColor);
      await productPage.clickOnBtnWithLabel("Edit");
      await productPage.editVariantProduct(secondColor, secondNewColor);
      await productPage.clickOnBtnWithLabel("Save changes");
      expect(await productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
    });

    await test.step(`Mở storefront > Vào product detail page > Verify variants của product`, async () => {
      const [newPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductOnSF()]);
      productPageSf = new SFProduct(newPage, shopDomain);
      await productPageSf.page.waitForLoadState("networkidle");
      expect(await productPageSf.isTextVisible(firstNewColor)).toBeTruthy();
      await productPageSf.page.click(`(${productPageSf.variantIBtn})[2]`);
      await productPageSf.page.waitForLoadState("networkidle");
      expect(await productPageSf.isTextVisible(secondNewColor)).toBeTruthy();
      for (const size of conf.caseConf.listSize) {
        expect(await productPageSf.isElementExisted(productPageSf.locatorVariant(size))).toBeTruthy();
      }
    });
  });

  test(`[PlusBase] Verify variant trong combo sau khi update variant option @SB_PLB_BUV_6`, async ({
    conf,
    context,
  }) => {
    const product = conf.caseConf.product;
    const oldVariantValue = conf.caseConf.oldValue;
    const newVariantValue = conf.caseConf.newValue;
    const color = conf.caseConf.color;

    // eslint-disable-next-line max-len
    await test.step(`Vào Products > Mở product detail > Edit variant value M > click button "Save" > Click button " Save changes"`, async () => {
      await productPage.navigateToMenu("Dropship products");
      await productPage.navigateToMenu("All products");
      await productPage.searchProduct(product);
      await productPage.chooseProduct(product);

      //Reset variant value
      if (await productPage.isTextVisible(newVariantValue, 1, timeOut)) {
        await productPage.clickOnBtnWithLabel("Edit", 2);
        await productPage.editVariantProduct(newVariantValue, oldVariantValue);
        await productPage.clickOnBtnWithLabel("Save changes");
        expect(await productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
        await productPage.waitForToastMessageHide("Product was successfully saved!");
      }

      // Edit variant value
      await productPage.clickOnBtnWithLabel("Edit", 2);
      await productPage.editVariantProduct(oldVariantValue, newVariantValue);
      await productPage.clickOnBtnWithLabel("Save changes");
      expect(await productPage.isToastMsgVisible("Product was successfully saved!")).toBeTruthy();
      await productPage.waitForToastMessageHide("Product was successfully saved!");
    });

    await test.step(`Verify list variants`, async () => {
      for (const variant of conf.caseConf.listVariant) {
        await expect(productPage.page.locator(`//li[normalize-space()='${variant}']`)).toBeVisible();
      }
    });

    await test.step(`Verify variant trong combo`, async () => {
      await productPage.clickIconEditVariant("Set combo Size");
      await expect(productPage.page.locator(`//p[normalize-space()='${color} / ${newVariantValue}']`)).toBeVisible();
    });

    await test.step(`Mở storefront > Vào product detail page > Verify variants của product`, async () => {
      await productPage.clickBackProductDetail();
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.page.locator(productPage.xpathViewProduct).click(),
      ]);
      homePage = new SFHome(newPage, shopDomain);
      for (const variant of conf.caseConf.listVariant) {
        await expect(homePage.isTextVisible(variant)).toBeTruthy();
      }
    });
  });
});
