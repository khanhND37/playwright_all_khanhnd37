import { expect } from "@core/fixtures";
import { test } from "@fixtures/upsell_offers";
import { SFHome } from "@pages/storefront/homepage";
import { SbBusAC, SbBusAC11 } from "./accessory";
import { SFCart } from "@pages/storefront/cart";
import { Accsessory } from "@pages/dashboard/accsessory";

test.describe("Accessory theme inside", async () => {
  let homepage: SFHome;
  let productDetail: Accsessory;
  let cart: SFCart;

  test(`@SB_BUS_AC_7 Check Add product trong accessory trường hợp product không có variant và custom option`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    homepage = new SFHome(page, conf.suiteConf.domain);
    productDetail = new Accsessory(page, conf.suiteConf.domain);
    cart = new SFCart(page, conf.suiteConf.domain);
    const caseConf = conf.caseConf as SbBusAC;

    await test.step(`Vào product page của product 9`, async () => {
      await homepage.gotoProduct(caseConf.target_product_handle);
      await productDetail.page.waitForSelector(productDetail.xpathAccessoryOnProductPage);
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productDetail.xpathAccessoryOnProductPage,
        snapshotName: "case_7_accessory_sf.png",
      });
    });

    await test.step(`Click button Add product 10 ở accessory`, async () => {
      await productDetail.genLoc(productDetail.xpathAccessoryBtnAdd()).click();
      await expect(productDetail.genLoc(productDetail.xpathAccessoryBtnAdded())).toBeVisible();
      await expect(productDetail.genLoc(productDetail.xpathAccessoryBtnAdded())).toBeDisabled();

      //    Mở cart drawer
      await productDetail.clickOnCartIconOnHeader();
      await expect(cart.productsInCart()).toContainText(caseConf.recommended_product);
    });
  });

  test(`@SB_BUS_AC_8 Check Add product trong accessory trường hợp product có nhiều variant`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    homepage = new SFHome(page, conf.suiteConf.domain);
    productDetail = new Accsessory(page, conf.suiteConf.domain);
    cart = new SFCart(page, conf.suiteConf.domain);
    const caseConf = conf.caseConf as SbBusAC;

    await test.step(`Vào product page của product 10, Click button Add tại product 11`, async () => {
      await homepage.gotoProduct(caseConf.target_product_handle);
      await productDetail.genLoc(productDetail.xpathAccessoryBtnAdd()).click();

      await expect(productDetail.genLoc(productDetail.selectorUpsellPopupOnProductPage)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productDetail.selectorUpsellPopupOnProductPage,
        snapshotName: "case_8_popup_sellect_variant_accessory_sf.png",
      });
    });

    await test.step(`Chọn variant > Add`, async () => {
      await productDetail.selectUpsellVariant(caseConf.recommended_product_variant);
      await productDetail.addUpsellProductToCart();
      await expect(productDetail.genLoc(productDetail.xpathAccessoryBtnAdded())).toBeVisible();
      await expect(productDetail.genLoc(productDetail.xpathAccessoryBtnAdded())).toBeDisabled();

      //    Mở cart drawer
      await productDetail.clickOnCartIconOnHeader();
      await expect(cart.productsInCart()).toContainText(caseConf.recommended_product);
      await expect(cart.productsInCart()).toContainText(caseConf.recommended_product_variant);
    });
  });

  test(`@SB_BUS_AC_11 Check chức năng Add product trong accessory trường hợp validate custom options của product`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    homepage = new SFHome(page, conf.suiteConf.domain);
    productDetail = new Accsessory(page, conf.suiteConf.domain);
    cart = new SFCart(page, conf.suiteConf.domain);
    const caseConf = conf.caseConf as SbBusAC11;

    await test.step(`Vào product page của product 19, Click button Add tại product 10`, async () => {
      await homepage.gotoProduct(caseConf.target_product_handle);
      await productDetail.genLoc(productDetail.xpathAccessoryBtnAdd()).click();
      await expect(productDetail.genLoc(productDetail.selectorUpsellPopupOnProductPage)).toBeVisible();
      await expect(productDetail.genLoc(productDetail.imageProductOnUpsellPopup)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: page,
        selector: productDetail.selectorUpsellPopupOnProductPage,
        snapshotName: "case_11_popup_custom_options_accessory_sf.png",
      });
    });

    await test.step(`Không nhập custom options > Add`, async () => {
      await productDetail.addUpsellProductToCart();
      await expect(productDetail.genLoc(productDetail.selectorValidateMessOnPopup)).toHaveText(caseConf.message_error);
    });

    await test.step(`Nhập custom options > Add`, async () => {
      await productDetail.genLoc(productDetail.selectorUpsellCustomOption).click();
      await productDetail.genLoc(productDetail.selectorUpsellCustomOption).fill(`${caseConf.fill_custom_option}`);
      await productDetail.addUpsellProductToCart();
      await expect(productDetail.genLoc(productDetail.xpathAccessoryBtnAdded())).toBeVisible();
      await expect(productDetail.genLoc(productDetail.xpathAccessoryBtnAdded())).toBeDisabled();
    });

    await test.step(`Verify các thông tin của product 14 trong cart`, async () => {
      await productDetail.clickOnCartIconOnHeader();
      await expect(cart.productsInCart()).toContainText(caseConf.recommended_product);
      await expect(cart.productsInCart()).toContainText(caseConf.recommended_product_pricing);
      const productInCartQuantity = await cart.getProductInCartQuantity(caseConf.recommended_product);
      await expect(productInCartQuantity).toEqual(caseConf.recommended_product_quantity);
      await expect(cart.productsInCart()).toContainText(caseConf.fill_custom_option);
    });

    await test.step(`Delete product 10 trong cart`, async () => {
      await cart.removeInCartProduct(caseConf.recommended_product);
      await expect(productDetail.genLoc(productDetail.xpathAccessoryBtnAdd())).toBeVisible();
    });
  });
});
