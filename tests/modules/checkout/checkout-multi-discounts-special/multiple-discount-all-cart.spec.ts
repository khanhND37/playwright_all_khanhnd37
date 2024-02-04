import { expect, test } from "@fixtures/website_builder";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { SFCartv3 } from "@pages/storefront/cart";
import { loadData } from "@core/conf/conf";
import { SFApps } from "@pages/storefront/apps";
import { SFCheckout } from "@pages/storefront/checkout";

let domain: string;
let homePage: SFHome;
let productPage: SFProduct;
let cartPage: SFCartv3;
let checkoutPage: SFCheckout;
let i: number, offerDiscount;
let appPage: SFApps;

test.describe("Verify SF all cart with multiple discount", async () => {
  const casesID = "SB_CHECKOUT_FLOW_CART";
  const conf = loadData(__filename, casesID);

  test.beforeEach(async ({ conf, page }) => {
    domain = conf.suiteConf.domain;
    homePage = new SFHome(page, domain);
    productPage = new SFProduct(page, domain);
    cartPage = new SFCartv3(page, domain);
    checkoutPage = new SFCheckout(page, domain);
    appPage = new SFApps(page, domain);
  });

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      products_checkout: productCheckout,
      discount_code: discountCodes,
      expect_offer_discount: expectOfferDiscount,
    }) => {
      test(`@${caseID} ${caseName}`, async ({}) => {
        await test.step(`Lên storefront của shop
        - Add product vào cart
        - Tại upsell offer pre-purchase: Add product upsell
        - Tại upsell offer in-cart: Add product upsell
        - Tại upsell offer bundle: Add product upsell
        - Mở CART DRAWER`, async () => {
          await homePage.gotoHomePage();
          await homePage.searchThenClickToViewProduct(productCheckout[0]);
          await appPage.addAllBundlesToCart;
          await productPage.addToCart();
          await appPage.addPrePurchaseProductToCart(productCheckout[1]);
          await productPage.gotoCart();
          cartPage.inCartOfferRecommendedProduct(productCheckout[2]);
          await homePage.genLoc(homePage.xpathCartIcon).click();

          // verify offer discount in cart drawer
          offerDiscount = cartPage.getPriceInCart("Offer discount");
          expect(offerDiscount).toEqual(expectOfferDiscount);
        });

        await test.step(`Kiểm tra discount ở cart page`, async () => {
          await cartPage.page.click(cartPage.xpathIconCloseCartDrawer);

          // verify offer discount in cart page
          offerDiscount = cartPage.getPriceInCart("Offer discount");
          expect(offerDiscount).toEqual(expectOfferDiscount);
        });

        await test.step(`Di chuyển tới checkout page
        - Nhập discount
        Quay lại cart page
        - Kiểm tra hiển thị discount`, async () => {
          await cartPage.checkout();
          for (i = 0; i < discountCodes.length; i++) {
            await checkoutPage.applyDiscountCode(discountCodes[i]);
          }
          await productPage.gotoCart();

          // verify offer discount in cart page
          offerDiscount = cartPage.getPriceInCart("Offer discount");
          expect(offerDiscount).toEqual(expectOfferDiscount);
        });

        await test.step(`Kiểm tra discount ở cart page`, async () => {
          // verify discount code after apply in cart page
          for (i = 0; i < discountCodes.length; i++) {
            const isDiscountCodeVisible = await cartPage.isTextVisible(discountCodes[i]);
            expect(isDiscountCodeVisible).toBeTruthy();
          }
        });

        await test.step(`Kiểm tra discount ở cart drawer`, async () => {
          // verify discount code after apply in cart drawer
          for (i = 0; i < discountCodes.length; i++) {
            const isDiscountCodeVisible = await cartPage.isTextVisible(discountCodes[i]);
            expect(isDiscountCodeVisible).toBeTruthy();
          }
        });
      });
    },
  );
});
