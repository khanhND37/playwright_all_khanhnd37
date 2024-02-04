import { Page } from "@playwright/test";
import { SFCheckout } from "@pages/storefront/checkout";
import { Card, ShippingAddress } from "@types";

export class CommissionPb extends SFCheckout {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }
  iframe = "#preview";
  frameLocator = this.page.frameLocator(this.iframe);
  xpathCP = {
    productPage: {
      quantity: `//input[contains(@class, 'quantity')]`,
      buynowBtn: `//span[normalize-space()='Buy Now' or normalize-space()='BUY NOW']`,
      variantOption: option => `//div[contains(@class,'option-item-wrap')]//span[normalize-space()='${option}']`,
    },
    thankyouPage: {
      confirmOrder: `//h2[normalize-space()='Your order is confirmed']`,
    },
    checkoutPage: {
      placeYourOrderBtn: `//span[contains(@class, 'place-order-button__label')]`,
      agreeTermOfServiceCheckbox: `//div[contains(@class, 'term-of-service')]//span[contains(@class, 'check')]`,
      countryOption: country => `//span[normalize-space()='${country}']`,
      stateOption: state => `//span[normalize-space()='${state}']`,
      zipcodeOption: zipcode => `//strong[normalize-space()='${zipcode}']`,
      shippingInfo: `//div[contains(@class,"customer-information--wb")]`,
      productImage: `//div[contains(@class, 'product-cart__image')]`,
    },
  };

  async enterShippingAdd(shippingAddress: ShippingAddress) {
    await this.emailLoc.fill(shippingAddress.email);
    await this.firstnameLoc.fill(shippingAddress.first_name);
    await this.lastnameLoc.fill(shippingAddress.last_name);
    await this.addLoc.fill(shippingAddress.address);
    try {
      await this.countryLoc.last().click({ timeout: 2000 });
    } catch (error) {
      await this.countryLoc.first().click();
    }
    await this.page.getByPlaceholder("Search").fill(shippingAddress.country);
    await this.genLoc(this.xpathCP.checkoutPage.countryOption(shippingAddress.country)).click();

    await this.provinceLoc.first().click();
    await this.page.getByPlaceholder("Search").fill(shippingAddress.state);
    await this.genLoc(this.xpathCP.checkoutPage.countryOption(shippingAddress.state)).click();

    await this.zipLoc.first().fill(shippingAddress.zipcode);
    try {
      await this.genLoc(this.xpathCP.checkoutPage.countryOption(shippingAddress.zipcode))
        .first()
        .click({ timeout: 2000 });
    } catch (error) {
      return;
    }
  }

  async checkout(customerInfo: ShippingAddress, cardInfo: Card) {
    await this.enterShippingAdd(customerInfo);
    await this.footerLoc.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(2 * 1000); //wait for Card visible
    await this.inputCardInfo(cardInfo.number, cardInfo.holder_name, cardInfo.expire_date, cardInfo.cvv);
    const checkboxAgreeLoc = this.genLoc(this.xpathCP.checkoutPage.agreeTermOfServiceCheckbox);
    const isCheckboxAgreeTermsVisible = await checkboxAgreeLoc.isVisible();
    if (isCheckboxAgreeTermsVisible == true) {
      const isCheckboxChecked = await checkboxAgreeLoc.isChecked();
      if (isCheckboxChecked == false) {
        await checkboxAgreeLoc.click();
      }
    }
    await this.page.waitForTimeout(1000); //wait for checkbox checked
    await this.genLoc(this.xpathCP.checkoutPage.placeYourOrderBtn).click();
  }
}
