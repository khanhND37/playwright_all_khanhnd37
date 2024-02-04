import { test } from "@core/fixtures";
import { loadData } from "@core/conf/conf";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { SFCheckout } from "@pages/storefront/checkout";

test.describe("Test data driven @TC_CHECK_1", async () => {
  const caseName = "TC_CHECK_1";
  const conf = loadData(__dirname, caseName);
  test(`Enter multiple card number`, async ({ page }) => {
    const homepage = new SFHome(page, conf.suiteConf["domain"]);
    let productPage: SFProduct;
    let checkout: SFCheckout;

    // TODO check lại camelCase và xem sao ko cho vào config
    const customerInfo = {
      email: "tester@maildrop.cc",
      firstName: "AutoTester",
      lastName: "Nguyen",
      address: "1600 W Loop S",
      country: "United States",
      state: "Texas",
      city: "Houston",
      zipcode: "77027",
      phoneNumber: "505-646-2276",
    };

    await test.step("buyer open homepage", async () => {
      await homepage.gotoHomePage();
    });

    await test.step("add product to cart", async () => {
      productPage = await homepage.searchThenViewProduct("yonex");
      await productPage.addProductToCart();
      checkout = await productPage.navigateToCheckoutPage();
    });
    //TODO hinh nhu code cho nay chua dung` ham moi' nhat nen kha' dai`
    await test.step("input customer information", async () => {
      await checkout.inputEmail(customerInfo.email);
      await checkout.inputFirstName(customerInfo.firstName);
      await checkout.inputLastName(customerInfo.lastName);
      await checkout.inputLastName(customerInfo.lastName);
      await checkout.inputAddress(customerInfo.address);
      await checkout.selectCountry(customerInfo.country);
      await checkout.selectStateOrProvince(customerInfo.state);
      await checkout.inputCity(customerInfo.city);
      await checkout.inputZipcode(customerInfo.zipcode);
      await checkout.inputPhoneNumber(customerInfo.phoneNumber);
      await checkout.clickBtnContinueToShippingMethod();
    });

    await test.step("select shipping method then verify shipping rate", async () => {
      await checkout.selectShippingMethod("");
      await checkout.continueToPaymentMethod();
    });

    for (const { card_number: cardNumber, card_holder_name: cardHolderName, expire_date: expireDate, cvv: CVV } of conf
      .caseConf["data"]) {
      await test.step("input payment information", async () => {
        await checkout.inputCardInfoAndCompleteOrder(cardNumber, cardHolderName, expireDate, CVV);
      });
    }
  });
});
