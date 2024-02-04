import { expect, test } from "@core/fixtures";
import { SFProduct } from "@pages/storefront/product";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Add new product", () => {
  let productSF;
  let homepage;
  test.beforeEach(async ({ page, conf }) => {
    productSF = new SFProduct(page, conf.suiteConf.suiteConf["domain"]);
    homepage = new SFHome(page, conf.suiteConf["domain"]);
  });
  test(`Verify product type/tag/colletion của product ngoài SF @TC_SB_PRO_PPD_35`, async ({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const organization = conf.caseConf.organization;
    await test.step(`View product ngoài SF> click vào các organization và
     verify product hiển thị trong page`, async () => {
      for (let i = 0; i < organization.length; i++) {
        await homepage.searchThenViewProduct(conf.caseConf.title);
        await productSF.openCollectionOrTypeOrTagsPage(organization[i]);
        expect(await productSF.getTitleProductOnCollectionOrTypeOrTagsPage()).toEqual(conf.caseConf.title);
      }
    });
  });

  test(`Verify hiển thị popup size guide của product ngoài SF @TC_SB_PRO_PPD_37`, async ({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    await test.step(`View product ngoài SF> click vào button size guide và
    Verify hiển thị popup size guide của product`, async () => {
      await homepage.searchThenViewProduct(conf.caseConf.title);
      await productSF.openPopupSizeGuide();
      expect(await productSF.getTitleSizeGuide()).toEqual(conf.caseConf.title_size_guide);
    });
  });

  test(`Verify Add to cart product tại product page khi select value và không select value @TC_SB_PRO_PPD_38`, async ({
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);

    //errMsg : lấy ra error Message từ file config errorMessage
    const errMsg = conf.caseConf.errorMessage;
    await test.step(`View product ngoài SF> không chọn value và click vào button Add to cart,
    Verify message hiển thị`, async () => {
      await homepage.searchThenViewProduct(conf.caseConf.title);
      for (let i = 0; i < errMsg.length; i++) {
        await productSF.checkMsgAfterClickButtonAddToCart(errMsg[i]);
      }

      await test.step(`click chọn value và click button Add to cart, Verify thông tin trong cart`, async () => {
        await productSF.selectValueProduct(conf.caseConf.value_add_to_cart_info);
        await productSF.addToCart();
        expect(await productSF.getInfoProductInCart()).toEqual(conf.caseConf.value_validate);
      });
    });
  });
  test(` Verify error message khi add to cart product và không input data cho custom option @TC_SB_PRO_PPD_45`, async ({
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    for (let i = 0; i < conf.caseConf.title.length; i++) {
      await test.step(`View product ngoài SF> Không input data cho custom option -> Click button Add to cart,
    Verify error message hiển thị`, async () => {
        await homepage.searchThenViewProduct(conf.caseConf.title[i]);
        await productSF.checkErrMsgCustomOption(conf.caseConf.errorMessage[i]);
      });
    }
  });

  test(`Verify custom option có type là Text File/Text Area của product ngoài product page @TC_SB_PRO_PPD_40`, async ({
    conf,
  }) => {
    test.setTimeout(conf.suiteConf.timeout);
    //customOptionValue01 : lấy ra list custom option info từ file config custom_option_value_01
    const customOptionValue01 = conf.caseConf.custom_option_value_01;
    //customOptionValue02 : lấy ra list custom option info từ file config custom_option_value_02
    const customOptionValue02 = conf.caseConf.custom_option_value_02;
    for (let i = 0; i < conf.caseConf.title.length; i++) {
      await test.step(`Input value không đúng cho custom option và Verify error message hiển thị`, async () => {
        await homepage.searchThenViewProduct(conf.caseConf.title[i]);
        await productSF.inputCustomOptionSF(customOptionValue01[i]);
        await productSF.checkErrMsgCustomOption(conf.caseConf.errorMessage[i]);
      });

      await test.step(`Input value đúng cho custom option và
    Verify custom thông tin custom option trong cart`, async () => {
        await productSF.inputCustomOptionSF(customOptionValue02[i]);
        await productSF.addToCart;
        expect(await productSF.getInfoProductInCart()).toEqual(conf.caseConf.custom_option_validate[i]);
        await productSF.deletePrductIncart();
      });
    }
  });
  test(`Verify custom option có type là Image của product ngoài product page @TC_SB_PRO_PPD_42`, async ({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    //customOptionValue : lấy ra list custom option info từ file config custom_option_value
    const customOptionValue = conf.caseConf.custom_option_value;
    await test.step(`View product ngoài SF > Input value đúng cho custom option > click button add to card và
    Verify custom thông tin custom option trong cart`, async () => {
      await homepage.searchThenViewProduct(conf.caseConf.title);
      await productSF.inputCustomOptionSF(customOptionValue);
      await productSF.addToCart();
      expect(await productSF.getInfoProductInCart()).toEqual(conf.caseConf.custom_option_validate);
    });
  });

  test(`Verify custom option có type là Radio,
   Droplist,Picture choice của product ngoài product page @TC_SB_PRO_PPD_43`, async ({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    //customOptionValue : lấy ra list custom option info từ file config custom_option_value
    const customOptionValue = conf.caseConf.custom_option_value;
    for (let i = 0; i < conf.caseConf.title.length; i++) {
      await test.step(`View product ngoài SF> input value cho custom option -> Click button Add to cart,
      Verify thông tin hiển thị trong cart`, async () => {
        await homepage.searchThenViewProduct(conf.caseConf.title[i]);
        await productSF.inputCustomOptionSF(customOptionValue[i]);
        await productSF.addToCart();
        expect(await productSF.getInfoProductInCart()).toEqual(conf.caseConf.custom_option_validate[i]);
        await productSF.deletePrductIncart();
      });
    }
  });

  test(`Verify hiển thị product image khi product có variant
  được add image hoặc không add image @TC_SB_PRO_PPD_55`, async ({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    for (let i = 0; i < conf.caseConf.title.length; i++) {
      await test.step(`View product ngoài SF> Verify product image hiển thị`, async () => {
        await homepage.searchThenViewProduct(conf.caseConf.title[i]);
        expect(await productSF.getAttributeImage()).toEqual(conf.caseConf.image_product_validate[i]);
      });

      await test.step(`Select varaint của product > Verify product image hiển thị`, async () => {
        await productSF.selectValueProduct(conf.caseConf.varaint_product[i]);
        expect(await productSF.getAttributeImage()).toEqual(conf.caseConf.image_variant_validate[i]);
      });
    }
  });

  test(`Verify hiển thị image của product khi
  Setting trong theme chọn Only from the variant group @TC_SB_PRO_PPD_58`, async ({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const varaintProduct = conf.caseConf.varaint_product;
    await test.step(`View product ngoài SF> select varaint của prodcut và Verify product image hiển thị`, async () => {
      await homepage.searchThenViewProduct(conf.caseConf.title);
      for (let i = 0; i < varaintProduct.length; i++) {
        await productSF.selectValueProduct(varaintProduct[i]);
        expect(await productSF.getListMediaSF()).toEqual(conf.caseConf.image_validate[i]);
      }
    });
  });

  test(`Verify sticky button khi product có nhiều hơn 2 option @TC_SB_PRO_PPD_53`, async ({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const stickyValue = conf.caseConf.sticky_value;
    await test.step(`Click icon view product ngoài SF > Sticky Select các value của product > Click button Add to cart.
    Verify thông tin cart`, async () => {
      await homepage.searchThenViewProduct(conf.caseConf.title);
      await productSF.stickySelectValueProduct(stickyValue);
      await productSF.addToCart();
      expect(await productSF.getInfoProductInCart()).toEqual(conf.caseConf.custom_option_validate);
    });
  });

  test(`Verify custom option có type là Image của product ngoài product page @TC_SB_PRO_PPD_63`, async ({ conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const varaintProduct = conf.caseConf.variant_product;
    await test.step(`View product khoogn có varaint ngoài SF > Click button Add to cart >
    Verify ảnh thumb của product hiển thị trong cart`, async () => {
      await homepage.searchThenViewProduct(conf.caseConf.title);
      await productSF.addToCart();
      expect(await productSF.getAttributeImage()).toEqual(conf.caseConf.image_validate_01);
      await productSF.deletePrductIncart();
    });

    await test.step(`View product có variant và được add image ngoài SF > Click chọn variant > Add to cart.
    Verify ảnh thumb của product hiển thị trong cart.`, async () => {
      for (let i = 0; i < conf.caseConf.product.length; i++) {
        await homepage.searchThenViewProduct(conf.caseConf.product[i]);
        await productSF.selectValueProduct(varaintProduct[i]);
        await productSF.addToCart();
        expect(await productSF.getAttributeImage()).toEqual(conf.caseConf.image_validate_02[i]);
        await productSF.deletePrductIncart();
      }
    });
  });
});
