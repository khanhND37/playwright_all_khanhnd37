import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { SFCheckout } from "@pages/storefront/checkout";
import { SFHome } from "@pages/storefront/homepage";
import { DashboardAPI } from "@pages/api/dashboard";
import { SFProduct } from "@pages/storefront/product";

type MyObject = { min_shipping_time: number; max_shipping_time: number };
const findMinMaxValues = (arr: MyObject[]): { min: number; max: number } => {
  if (arr.length === 0) {
    throw new Error("Array is empty");
  }

  let minA = arr[0].min_shipping_time;
  let maxB = arr[0].max_shipping_time;

  for (const obj of arr) {
    // Tìm giá trị nhỏ nhất của key 'min_shipping_time'
    if (obj.min_shipping_time < minA) {
      minA = obj.min_shipping_time;
    }

    // Tìm giá trị lớn nhất của key 'max_shipping_time'
    if (obj.max_shipping_time > maxB) {
      maxB = obj.max_shipping_time;
    }
  }

  return { min: minA, max: maxB };
};

const formatDateRange = (from = 0, to = 0): string => {
  const startDate = generateDate(from);
  const endDate = generateDate(to);

  const startMonth = new Intl.DateTimeFormat("en", { month: "short" }).format(startDate);
  const endMonth = new Intl.DateTimeFormat("en", { month: "short" }).format(endDate);

  const startDay = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(startDate);
  const endDay = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(endDate);

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  let isTheSameYear: boolean;

  if (startYear === endYear) {
    isTheSameYear = true;
  }
  if (from === 0 && to === 0) {
    return;
  }

  if (isTheSameYear) {
    if (from === 0) {
      return `${endMonth} ${endDay}`;
    }
    if (to === 0) {
      return `${startMonth} ${startDay}`;
    }
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  } else {
    if (from === 0) {
      return `${endMonth} ${endDay}, ${endYear}`;
    }
    if (to === 0) {
      return `${startMonth} ${startDay}, ${startYear}`;
    }
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
  const caseName = "ETA_SBASE_DRIVEN";
  const conf = loadData(__dirname, caseName);

  // for each data, will do tests
  conf.caseConf.forEach(({ case_id: caseID, case_name: caseName, shipping_zones: shippingZones }) => {
    test(`${caseName} @${caseID}`, async ({ authRequest, page }) => {
      const domain = conf.suiteConf.domain;
      const product = conf.suiteConf.product;
      const customerInfo = conf.suiteConf.customer_info;
      const shippingZonesReset = conf.suiteConf.shipping_zones_reset;

      let productPage: SFProduct;
      const homepage = new SFHome(page, domain);
      const checkoutPage = new SFCheckout(page, domain);
      const dashboardAPI = new DashboardAPI(domain, authRequest);

      await test.step(`Pre-conditon`, async () => {
        // Reset ETA shipping time to 0
        await dashboardAPI.changeShippingZoneInfo(shippingZonesReset[0]);

        // Set ETA shipping time
        await dashboardAPI.changeShippingZoneInfo(shippingZones[0]);
      });

      await test.step(`Ngoài SF > Chọn sản phẩm > Tại product page > Kiểm tra hiển thị eta time`, async () => {
        await homepage.gotoHomePage();
        productPage = await homepage.searchThenViewProduct(product[0].name);

        // Get actual ETA delivery time
        const actualEtaDeliveryDay = await productPage.getTextContent(productPage.xpathEtaShippingTime);
        const actualEtaDeliveryZone = await productPage.getTextContent(productPage.xpathEtaShippingDestination);
        const actualEtaDelivery = `${actualEtaDeliveryDay} ${actualEtaDeliveryZone.trim()}`;

        // Generate Estimate delivery tine
        const expectMinMaxShippingTime = findMinMaxValues(shippingZones[0].price_based_shipping_rate);
        const expectEtaDeliveryDay = formatDateRange(expectMinMaxShippingTime.min, expectMinMaxShippingTime.max);
        let expectEtaDelivery = `${expectEtaDeliveryDay} (Delivery to United States)`;
        if (process.env.ENV == "dev") {
          expectEtaDelivery = `${expectEtaDeliveryDay} (Delivery to Singapore)`;
        }

        expect(actualEtaDelivery).toEqual(expectEtaDelivery);
      });

      await test.step(`
        - Add product to cart > checkout page > Tại Information: chọn country= Vietnam
        - Tại block shipping method >  Kiểm tra hiển thị eta time`, async () => {
        await productPage.addToCart();
        await productPage.navigateToCheckoutPage();
        await checkoutPage.enterShippingAddress(customerInfo);
        for (const rate of shippingZones[0].price_based_shipping_rate) {
          const xpathEtaShipping = checkoutPage.getXpathEtaShippingByMethod(rate.name);
          const actualETADelivery = await checkoutPage.getTextContent(xpathEtaShipping);
          const expectETADelivery = generateExpectEtaOnCOPage(rate.min_shipping_time, rate.max_shipping_time);
          expect(actualETADelivery).toEqual(expectETADelivery);
        }
      });
    });
  });
});
