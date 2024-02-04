/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { removeCurrencySymbol } from "@core/utils/string";
import { ProductAPI } from "@pages/api/product";
import { SettingShippingAPI } from "@pages/api/setting_shipping_api";
import { SFCart } from "@pages/storefront/cart";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";

// Verify shipping fee when apply free shipping cap value in checkout page and order detail
const verifyShippingFee = (actualShippingFee, expectShippingFee) => {
  if (actualShippingFee.newShippingValue === "Free" && actualShippingFee.shippingValInOrdSummary === "Free") {
    actualShippingFee.newShippingValue = 0;
    actualShippingFee.shippingValInOrdSummary = 0;
  }
  expect(Number(actualShippingFee.newShippingValue)).toEqual(expectShippingFee);
  expect(Number(actualShippingFee.shippingValInOrdSummary)).toEqual(expectShippingFee);
};

test.describe("Checkout shipping with countries", () => {
  let domain: string;
  let shippingApi: SettingShippingAPI;
  let checkout: SFCheckout;

  const caseName = "CASE_COUNTRY";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      case_description: caseDescription,
      shipping_zone_info: shippingZoneInfo,
      product_info: product,
      shipping_infos: shippingInfos,
    }) => {
      test(`${caseDescription} @${caseID}`, async ({ page, conf, authRequest }) => {
        await test.step(`Pre-condition`, async () => {
          //Define variable
          domain = conf.suiteConf.domain;

          shippingApi = new SettingShippingAPI(domain, authRequest);
          checkout = new SFCheckout(page, domain);
        });

        // Cmt because of cache issue when delete or create shipping zone
        // await test.step(`Tại dashboard: Setting > Shipping > Add shipping zone - Thực hiện tạo shipping zone mới- Click Done`, async () => {
        //   const shippingZoneBeforeAdd = await shippingApi.getListShippingZoneID();
        //   await shippingApi.addShippingZone(shippingZoneInfo);
        //   // expect that shipping zone is created
        //   const shippingZoneAfterAdd = await shippingApi.getListShippingZoneID();
        //   expect(shippingZoneAfterAdd.length).toEqual(shippingZoneBeforeAdd.length + 1);
        // });

        await test.step(`Tại SF:- Add product vào cart và di chuyển đến trang checkout- Điền shipping address - Chọn shipping method- Chọn payment method- Click Complete/Place your order`, async () => {
          for (const shippingInfo of shippingInfos) {
            //Use for loop to create 3 order with 3 shipping address
            await checkout.addProductToCartThenInputShippingAddress(product, shippingInfo.customer_info);
            await checkout.completeOrderWithMethod();

            //Verify shipping info on thankyou page
            const shipping = await checkout.getShippingInfoOnThankyouPage();
            expect(await checkout.isThankyouPage()).toBe(true);
            expect(Number(shipping.amount)).toEqual(shippingZoneInfo.price_based_shipping_rate[0].price);
            expect(shipping.method_title).toEqual(shippingZoneInfo.price_based_shipping_rate[0].name);
          }
        });
      });
    },
  );
});

test.describe("Checkout shipping with several zone", () => {
  let domain: string;
  let shippingApi: SettingShippingAPI;
  let checkout: SFCheckout;

  const caseName = "CASE_SEVERAL_ZONES";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      case_description: caseDescription,
      shipping_zone_info: shippingZoneInfo,
      product_info: product,
      shipping_infos: shippingInfos,
    }) => {
      test(`${caseDescription} @${caseID}`, async ({ browser, conf, authRequest }) => {
        await test.step(`Pre-condition`, async () => {
          //Define variable
          domain = conf.suiteConf.domain;
          shippingApi = new SettingShippingAPI(domain, authRequest);
        });

        // Cmt because of cache issue when delete or create shipping zone
        // await test.step(`Tại dashboard: Setting > Shipping > Add shipping zone - Thực hiện tạo shipping zone mới- Click Done`, async () => {
        //   const shippingZoneBeforeAdd = await shippingApi.getListShippingZoneID();
        //   for (const zone of shippingZoneInfo) {
        //     await shippingApi.addShippingZone(zone);
        //   }
        //   // expect that shipping zone is created
        //   const shippingZoneAfterAdd = await shippingApi.getListShippingZoneID();
        //   expect(shippingZoneAfterAdd.length).toEqual(shippingZoneBeforeAdd.length + shippingZoneInfo.length);
        // });

        await test.step(`Tại SF:- Add product vào cart và di chuyển đến trang checkout- Điền shipping address - Chọn shipping method - Kiểm tra shipping rate`, async () => {
          for (const shippingInfo of shippingInfos) {
            const context = await browser.newContext();
            const page = await context.newPage();
            checkout = new SFCheckout(page, domain);
            //Use for loop to create 3 order with 3 shipping address
            await checkout.addProductToCartThenInputShippingAddress(product, shippingInfo.customer_info);
            await checkout.shippingSessionInBreadcrumbLoc.click();

            //Verify shipping info on checkout page
            await checkout.verifyShippingMethodOnPage([shippingInfo.shipping_method]);
            const shippingRateFee = await checkout.getShippingFeeByRateName(shippingInfo.shipping_method.method_title);
            const shippingFeeOnOrdSummary = await checkout.getShippingFeeOnOrderSummary();
            if (shippingZoneInfo.price_based_shipping_rate) {
              expect(Number(shippingRateFee)).toEqual(shippingZoneInfo.price_based_shipping_rate[0].price);
              expect(Number(removeCurrencySymbol(shippingFeeOnOrdSummary))).toEqual(
                shippingZoneInfo.price_based_shipping_rate[0].price,
              );
            }
            if (shippingZoneInfo.weight_based_shipping_rate) {
              expect(Number(shippingRateFee)).toEqual(shippingZoneInfo.weight_based_shipping_rate[0].price);
              expect(Number(removeCurrencySymbol(shippingFeeOnOrdSummary))).toEqual(
                shippingZoneInfo.weight_based_shipping_rate[0].price,
              );
            }
            await page.close();
          }
        });
      });
    },
  );
});

test.describe("Checkout shipping zone with many rate ", () => {
  let domain: string;
  let shippingValue: number | string;
  let shippingApi: SettingShippingAPI;
  let productPage: SFProduct;
  let checkout: SFCheckout;
  let homePage: SFHome;
  let cartPage: SFCart;
  let shippingInfo;

  const caseName = "CASE_SEVERAL_RATES";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      case_description: caseDescription,
      shipping_zone_info: shippingZoneInfo,
      customer_info: customerInfo,
      shipping_infos: shippingInfos,
    }) => {
      test(`${caseDescription} @${caseID}`, async ({ page, conf, authRequest }) => {
        await test.step(`Pre-condition`, async () => {
          //Define variable
          domain = conf.suiteConf.domain;

          shippingApi = new SettingShippingAPI(domain, authRequest);
          productPage = new SFProduct(page, domain);
          checkout = new SFCheckout(page, domain);
          homePage = new SFHome(page, domain);
          cartPage = new SFCart(page, domain);
        });

        // Cmt because of cache issue when delete or create shipping zone
        // await test.step(`Tại dashboard: Setting > Shipping > Add shipping zone - Thực hiện tạo shipping zone mới- Click Done`, async () => {
        //   //Add shipping zone
        //   const shippingZoneBeforeAdd = await shippingApi.getListShippingZoneID();
        //   await shippingApi.addShippingZone(shippingZoneInfo);

        //   // expect that shipping zone is created
        //   const shippingZoneAfterAdd = await shippingApi.getListShippingZoneID();
        //   expect(shippingZoneAfterAdd.length).toEqual(shippingZoneBeforeAdd.length + 1);
        // });

        await test.step(`Tại SF:
          Thực hiện add product với quantity khác nhau vào cart
          - Add product vào cart và di chuyển đến trang checkout
          - Điền shipping address
          - Kiểm tra hiển thị các shipping method`, async () => {
          for (let i = 0; i < shippingInfos.length; i++) {
            //Use for loop to create re-fill cart 3 time with 3 diferent product quantity
            await homePage.gotoHomePage();
            productPage = await homePage.searchThenViewProduct(shippingInfos[i].product_name);
            await productPage.inputQuantityProduct(shippingInfos[i].product_quantity);
            await productPage.addProductToCart();
            await productPage.navigateToCheckoutPage();

            //In first time adding product to cart , will enter shipping address.
            //In the next time, will click shipping session in breadcrumb
            if (i === 0) {
              await checkout.enterShippingAddress(customerInfo);
            } else {
              await checkout.shippingSessionInBreadcrumbLoc.click();
            }

            //Verify shipping info on checkout page
            await checkout.verifyShippingMethodOnPage(shippingInfos[i].shipping_method);

            //Change product 3 time. in the last time will break loop to complete order
            if (i === shippingInfos.length - 1) {
              break;
            }
            //Go to cart page and remove cart
            await checkout.goto(`/cart`);
            await cartPage.removeInCartProduct(shippingInfos[i].product_name);
          }
        });

        await test.step(`Chọn các shipping method và kiểm tra shipping value trên order summary`, async () => {
          for (const shippingMethod of shippingInfos[shippingInfos.length - 1].shipping_method) {
            //use for loop to select diferent shipping methods
            const shipping = await checkout.selectAndGetShippingInfoWithMethod(shippingMethod.method_title, true);

            if (shippingZoneInfo.price_based_shipping_rate) {
              //if method is price based
              //find shipping rate by method title
              const shippingRate = shippingZoneInfo.price_based_shipping_rate.find(
                ({ name }) => name === shippingMethod.method_title,
              ).price;
              //verify shipping fee
              verifyShippingFee(shipping, shippingRate);
            }

            if (shippingZoneInfo.weight_based_shipping_rate) {
              //if method is weight based
              //find shipping rate by method title
              const shippingRate = shippingZoneInfo.weight_based_shipping_rate.find(
                ({ name }) => name === shippingMethod.method_title,
              ).price;
              //verify shipping fee
              verifyShippingFee(shipping, shippingRate);
            }

            //set shipping value for next step
            shippingValue = shipping.shippingValInOrdSummary;
          }
        });
        await test.step(`
          - Chọn payment method
          - Click complete/Place your order`, async () => {
          //Complete order
          await checkout.continueToPaymentMethod();
          await checkout.completeOrderWithMethod();

          //Verify shipping fee on order summary
          const shippingFeeOnOrdSummary = await checkout.getShippingFeeOnOrderSummary();
          expect(shippingFeeOnOrdSummary).toEqual(shippingValue);
        });
      });
    },
  );
});

test.describe("Checkout shipping with discount ", () => {
  test(`[Price base] Setting shipping zone với nhiều rate và kiểm tra sự thay đổi rate ngoài Storefront khi apply discount @SB_SET_SP_5`, async ({
    page,
    conf,
    authRequest,
  }) => {
    let domain, shippingZoneInfo, customerInfo, product, discountInfo, shippingMethod;
    let shippingApi: SettingShippingAPI;
    let productPage: SFProduct;
    let checkout: SFCheckout;
    let homePage: SFHome;

    await test.step(`Pre-condition`, async () => {
      //Define variable
      shippingZoneInfo = conf.caseConf.shipping_zone_info;
      shippingMethod = conf.caseConf.shipping_method;
      customerInfo = conf.caseConf.customer_info;
      discountInfo = conf.caseConf.discount_info;
      product = conf.caseConf.product_info;
      domain = conf.suiteConf.domain;

      shippingApi = new SettingShippingAPI(domain, authRequest);
      productPage = new SFProduct(page, domain);
      checkout = new SFCheckout(page, domain);
      homePage = new SFHome(page, domain);
    });

    // Cmt because of cache issue when delete or create shipping zone
    // await test.step(`Tại dashboard:
    //   Setting > Shipping > Add shipping zone
    //   - Thực hiện tạo shipping zone mới
    //   - Click Done`, async () => {
    //   //Add shipping zone
    //   const shippingZoneBeforeAdd = await shippingApi.getListShippingZoneID();
    //   await shippingApi.addShippingZone(shippingZoneInfo);

    //   // expect that shipping zone is created
    //   const shippingZoneAfterAdd = await shippingApi.getListShippingZoneID();
    //   expect(shippingZoneAfterAdd.length).toEqual(shippingZoneBeforeAdd.length + 1);
    // });

    await test.step(`Tại SF:
      - Add product vào cart và di chuyển đến trang checkout
      - Điền shipping address
      - Chọn shipping method`, async () => {
      await homePage.gotoHomePage();
      productPage = await homePage.searchThenViewProduct(product.name);
      await productPage.inputQuantityProduct(product.quantity);
      await productPage.addProductToCart();
      await productPage.navigateToCheckoutPage();
      await checkout.enterShippingAddress(customerInfo);
      await checkout.verifyShippingMethodOnPage(shippingMethod);
    });

    await test.step(`
      - Thực hiện apply discount code
      - Kiểm tra lại shipping method được apply`, async () => {
      for (const discount of discountInfo) {
        //Use for loop to apply discount code and verify shipping method
        await checkout.applyDiscountCode(discount.discount_code);
        await checkout.verifyShippingMethodOnPage(discount.shipping_method, {}, "Pricebase");
      }
    });
  });
});

test.describe("Checkout shipping with PPC", () => {
  //Create new variable
  let shippingApi: SettingShippingAPI;
  let productPage: SFProduct;
  let checkout: SFCheckout;
  let homePage: SFHome;

  let expectShippingFee: number;
  let domain: string;

  const caseName = "CASE_SHIPPING_PPC";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      case_id: caseID,
      product_info: product,
      product_ppc: productPPC,
      customer_info: customerInfo,
      shipping_method: shippingMethod,
      case_description: caseDescription,
      shipping_zone_info: shippingZoneInfo,
    }) => {
      test(`${caseDescription} @${caseID}`, async ({ page, conf, authRequest }) => {
        await test.step(`Pre-condition`, async () => {
          //Define variable
          domain = conf.suiteConf.domain;

          shippingApi = new SettingShippingAPI(domain, authRequest);
          productPage = new SFProduct(page, domain);
          checkout = new SFCheckout(page, domain);
          homePage = new SFHome(page, domain);
        });

        // Cmt because of cache issue when delete or create shipping zone
        // await test.step(`Tại dashboard: Setting > Shipping > Add shipping zone - Thực hiện tạo shipping zone mới- Click Done`, async () => {
        //   const shippingZoneBeforeAdd = await shippingApi.getListShippingZoneID();
        //   await shippingApi.addShippingZone(shippingZoneInfo);
        //   // expect that shipping zone is created
        //   const shippingZoneAfterAdd = await shippingApi.getListShippingZoneID();
        //   expect(shippingZoneAfterAdd.length).toEqual(shippingZoneBeforeAdd.length + 1);
        // });

        await test.step(`Tại SF:
          - Add product vào cart và di chuyển đến trang checkout
          - Điền shipping address
          - Chọn  shipping method
          - Kiểm tra shipping rate`, async () => {
          await homePage.gotoHomePage();
          productPage = await homePage.searchThenViewProduct(product.name);
          await productPage.inputQuantityProduct(product.quantity);
          await productPage.addProductToCart();
          await productPage.navigateToCheckoutPage();
          await checkout.enterShippingAddress(customerInfo);

          //Verify shipping method
          await checkout.verifyShippingMethodOnPage(shippingMethod);
        });

        await test.step(`
          - Chọn shipping method
          - Chọn paymnet methoid
          - Nhập Payment info
          - Click Complete/Place your order`, async () => {
          //Select shipping method and complete order
          await checkout.selectAndGetShippingInfoWithMethod(shippingMethod[0].method_title, true);
          await checkout.continueToPaymentMethod();
          await checkout.completeOrderWithMethod();
          await expect(checkout.thankyouPageLoc).toBeVisible();
        });

        await test.step(`- Tại màn hình PPC > add ppc item:
        - Kiểm tra shipping value tại màn thankyou page`, async () => {
          //Add PPC item
          await checkout.addProductPostPurchase(productPPC);
          await checkout.completePaymentForPostPurchaseItem();
          await expect(checkout.getLocatorProdNameInOrderSummary(productPPC)).toBeVisible();

          //Get shipping fee on order summary and verify
          const shippingFee = await checkout.getShippingFeeOnOrderSummary();
          if (shippingZoneInfo.price_based_shipping_rate) {
            //if price base shipping rate > then expect shipping fee = pricebase shipping rate amount
            expectShippingFee = shippingZoneInfo.price_based_shipping_rate[0].price;
          }
          if (shippingZoneInfo.weight_based_shipping_rate) {
            //if weight base shipping rate > then expect shipping fee = weightbase shipping rate amount
            expectShippingFee = shippingZoneInfo.weight_based_shipping_rate[0].price;
          }
          if (shippingZoneInfo.item_based_shipping_rate) {
            //if item base shipping rate > then expect shipping fee = first item price + additional item price
            expectShippingFee =
              shippingZoneInfo.item_based_shipping_rate[0].first_item_price +
              shippingZoneInfo.item_based_shipping_rate[0].additional_item_price;
          }
          expect(Number(shippingFee)).toEqual(expectShippingFee);
        });
      });
    },
  );
});

test.describe("Shipping zone have many rate item base", () => {
  let domain, shippingZoneInfo, customerInfo, shippingInfos, products;
  let shippingApi: SettingShippingAPI;
  let productAPI: ProductAPI;
  let checkout: SFCheckout;

  test(`[Item base] Setting shipping zone với nhiều rate và kiểm tra sự thay đổi rate ngoài Storefront @SB_SET_SP_8`, async ({
    browser,
    conf,
    authRequest,
  }) => {
    //Set timeout for test case
    test.setTimeout(300000);

    await test.step(`Pre-condition`, async () => {
      //Define variable
      shippingZoneInfo = conf.caseConf.shipping_zone_info;
      shippingInfos = conf.caseConf.shipping_infos;
      customerInfo = conf.caseConf.customer_info;
      products = conf.caseConf.products;
      domain = conf.suiteConf.domain;

      shippingApi = new SettingShippingAPI(domain, authRequest);
      productAPI = new ProductAPI(domain, authRequest);

      for (const product of products) {
        //Update product info: sku, type, tag, vendor
        await productAPI.updateProductInfo(product);
      }
    });

    // Cmt because of cache issue when delete or create shipping zone
    // await test.step(`Tại dashboard: Setting > Shipping > Add shipping zone - Thực hiện tạo shipping zone mới- Click Done`, async () => {
    //   const shippingZoneBeforeAdd = await shippingApi.getListShippingZoneID();
    //   await shippingApi.addShippingZone(shippingZoneInfo);

    //   // expect that shipping zone is created
    //   const shippingZoneAfterAdd = await shippingApi.getListShippingZoneID();
    //   expect(shippingZoneAfterAdd.length).toEqual(shippingZoneBeforeAdd.length + 1);
    // });

    await test.step(`Tại SF:
      Thực hiện add lần lượt product với quantity khác nhau vào cart
      - Add product vào cart và di chuyển đến trang checkout
      - Điền shipping address
      - Kiểm tra hiển thị các shipping method`, async () => {
      for (const shippingInfo of shippingInfos) {
        //Use for loop to create new cart many times with different product
        const context = await browser.newContext();
        const page = await context.newPage();
        checkout = new SFCheckout(page, domain);
        await checkout.addProductToCartThenInputShippingAddress(shippingInfo.product_info, customerInfo);
        await checkout.shippingSessionInBreadcrumbLoc.click();

        //Verify shipping info on checkout page
        await checkout.verifyShippingMethodOnPage(shippingInfo.shipping_method);
        const actShippingValue = await checkout.getShippingFeeOnOrderSummary();
        expect(Number(actShippingValue)).toEqual(shippingInfo.shipping_method[0].rate);

        //Close page to create new cart page
        await page.close();
      }
    });
  });
});

test.describe(`Checkout shipping item base`, async () => {
  let domain: string;
  let shippingApi: SettingShippingAPI;
  let checkout: SFCheckout;
  let homePage: SFHome;
  let productPage: SFProduct;
  let productAPI: ProductAPI;

  const caseName = "CASE_ITEM_BASE";
  const conf = loadData(__dirname, caseName);
  // for each data, will do tests
  conf.caseConf.data.forEach(
    ({
      shipping_zone_info: shippingZoneInfo,
      case_description: caseDescription,
      shipping_method: shippingMethod,
      customer_info: customerInfo,
      product_info: products,
      case_id: caseID,
    }) => {
      test(`${caseDescription} @${caseID}`, async ({ page, conf, authRequest }) => {
        await test.step(`Pre-condition`, async () => {
          //Define variable
          domain = conf.suiteConf.domain;

          shippingApi = new SettingShippingAPI(domain, authRequest);
          productAPI = new ProductAPI(domain, authRequest);
          productPage = new SFProduct(page, domain);
          checkout = new SFCheckout(page, domain);
          homePage = new SFHome(page, domain);

          for (const product of products) {
            //Update product info: sku, type, tag, vendor
            await productAPI.updateProductInfo(product);
          }
        });

        // Cmt because of cache issue when delete or create shipping zone
        // await test.step(`Tại dashboard: Setting > Shipping > Add shipping zone - Thực hiện tạo shipping zone mới- Click Done`, async () => {
        //   //Add shipping zone
        //   const shippingZoneBeforeAdd = await shippingApi.getListShippingZoneID();
        //   await shippingApi.addShippingZone(shippingZoneInfo);

        //   // expect that shipping zone is created
        //   const shippingZoneAfterAdd = await shippingApi.getListShippingZoneID();
        //   expect(shippingZoneAfterAdd.length).toEqual(shippingZoneBeforeAdd.length + 1);
        // });

        await test.step(`Tại SF:
          - Add product vào cart và di chuyển đến trang checkout
          - Điền shipping address
          - Kiểm tra hiển thị các shipping method`, async () => {
          for (const product of products) {
            //add many product to cart
            await homePage.gotoHomePage();
            productPage = await homePage.searchThenViewProduct(product.name);
            await productPage.inputQuantityProduct(product.quantity);
            await productPage.addProductToCart();
          }
          //Navigate to checkout page
          await productPage.navigateToCheckoutPage();
          await checkout.enterShippingAddress(customerInfo);

          //Verify shipping info on checkout page
          const shippingExp = await checkout.verifyShippingMethodOnPage(shippingMethod);
          expect(shippingExp).toEqual(true);
        });
      });
    },
  );
});

// test.describe("Delete all shipping zone", () => {
//   test(`Delete all shipping zone @SB_CASE_DELETE`, async ({ conf, authRequest }) => {
//     await test.step(`Delete`, async () => {
//       //Define variable
//       const domain = conf.suiteConf.domain;

//       const shippingApi = new SettingShippingAPI(domain, authRequest);

//       // delete all shipping zone
//       await shippingApi.deleteAllShippingZone();

//       // expect that shipping zone is empty
//       const shippingZoneAfterDelete = await shippingApi.getListShippingZoneID();
//       expect(shippingZoneAfterDelete.length).toEqual(0);
//     });
//   });
// });
