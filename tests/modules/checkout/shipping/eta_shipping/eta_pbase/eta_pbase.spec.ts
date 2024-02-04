import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { PaymentMethod, SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";

const formatDateRange = (processingTimeFrom: number): string => {
  const processingDate = generateDate(processingTimeFrom);

  const processingMonth = new Intl.DateTimeFormat("en", { month: "short" }).format(processingDate);

  const processingDay = processingDate.getDate();
  const processingYear = processingDate.getFullYear();

  return `${processingMonth} ${processingDay}, ${processingYear}`;
};

const formatDateRangeThankyouPage = (from = 0, to = 0): string => {
  const startDate = generateDate(from);
  const endDate = generateDate(to);

  const startMonth = new Intl.DateTimeFormat("en", { month: "long" }).format(startDate);
  const endMonth = new Intl.DateTimeFormat("en", { month: "long" }).format(endDate);

  const startDay = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(startDate);
  const endDay = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(endDate);

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear !== endYear) {
    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
  }
};

const generateDate = (additionalDays: number): Date => {
  const newDate = new Date();

  // Helper function to check if a given date is a weekend (Saturday or Sunday)
  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  // Iterate through the additional days and skip weekends
  while (additionalDays > 0) {
    newDate.setDate(newDate.getDate() + 1);

    if (!isWeekend(newDate)) {
      additionalDays--;
    }
  }

  return newDate;
};

const generateExpectEtaOnCOPage = (min: number, max: number): string | null => {
  if (min === 0 && max === 0) {
    return null;
  }

  const etaTime =
    min === 0 ? `(${max} business days)` : max === 0 ? `(${min} business days)` : `(${min} - ${max} business days)`;
  return etaTime;
};

test.describe("Checkout success when apply free shipping maximum value", () => {
  const caseName = "ETA_PBASE_DRIVEN";
  const conf = loadData(__dirname, caseName);

  // for each data, will do tests
  conf.caseConf.forEach(
    ({ case_id: caseID, case_name: caseName, shipping_zones: shippingZones, customer_info: customerInfo }) => {
      test(`${caseName} @${caseID}`, async ({ page }) => {
        const domain = conf.suiteConf.domain;
        const product = conf.suiteConf.product;

        let productPage: SFProduct;
        const homepage = new SFHome(page, domain);
        const checkoutPage = new SFCheckout(page, domain);

        await test.step(`
          Ngoài SF > Chọn sản phẩm
          - Add product to cart > checkout page > Tại Information: chọn country= Vietnam
          - Tại block shipping method > Kiểm tra hiển thị eta time`, async () => {
          await homepage.gotoHomePage();
          productPage = await homepage.searchThenViewProduct(product[0].name);
          await productPage.addToCart();
          await productPage.navigateToCheckoutPage();
          await checkoutPage.enterShippingAddress(customerInfo);
          for (const rate of shippingZones[0].item_based_shipping_rate) {
            const xpathEtaShipping = checkoutPage.getXpathEtaShippingByMethod(rate.name);
            const actualETADelivery = await checkoutPage.getTextContent(xpathEtaShipping);
            const expectETADelivery = generateExpectEtaOnCOPage(rate.min_shipping_time, rate.max_shipping_time);
            expect(actualETADelivery).toEqual(expectETADelivery);
          }

          const etaProcessingTime = await checkoutPage.getTextContent(checkoutPage.xpathETAProcessingDelivery);
          const expectProcessingTime = formatDateRange(product[0].min_processing_time);
          expect(etaProcessingTime).toEqual(expectProcessingTime);
        });

        await test.step(`Check hiển thị tại thank you page sau khi order được tạo`, async () => {
          await checkoutPage.selectShippingMethod(shippingZones[0].item_based_shipping_rate[0].name);
          await checkoutPage.completeOrderWithMethod(PaymentMethod.STRIPE);
          await checkoutPage.page.waitForSelector(checkoutPage.xpathThankYou);
          const expectETAThankyouPage = formatDateRangeThankyouPage(
            shippingZones[0].item_based_shipping_rate[0].min_shipping_time + product[0].min_processing_time,
            shippingZones[0].item_based_shipping_rate[0].max_shipping_time + product[0].max_processing_time,
          );

          const actualETAThankyouPage = await checkoutPage.getTextContent(checkoutPage.xpathETADeliveryThankyouPage);

          expect(actualETAThankyouPage).toEqual(expectETAThankyouPage);
        });
      });
    },
  );
});
