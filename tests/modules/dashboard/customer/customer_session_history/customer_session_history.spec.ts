import { test } from "@fixtures/theme";
import { loadData } from "@core/conf/conf";
import { OrdersPage } from "@pages/dashboard/orders";
import { SFCheckout } from "@sf_pages/checkout";
import { Page } from "@playwright/test";
import { Config, ProductValue, SecssionDetail } from "@types";
import { ProductPage } from "@pages/dashboard/products";
import { expect } from "@core/fixtures";
import { CustomersPage } from "@pages/dashboard/customers";

let handleProduct;
let cardInfo;
let shippingInfo;
let timeStamp;
let customerPage: CustomersPage;
let orderId;
test.describe("Customer's session history", () => {
  const goToPage = async (domain: string, checkoutPage: SFCheckout, handleProduct: string, linkUTM: string) => {
    await checkoutPage.page.goto(handleProduct + linkUTM);
    await checkoutPage.waitForEventCompleted(domain, "view_page");
  };

  const recreateProduct = async (dashboard: Page, conf: Config, productInfo: ProductValue): Promise<string> => {
    const product = new ProductPage(dashboard, conf.suiteConf.domain);
    await product.navigateToMenu("Products");
    await product.searchProduct(productInfo.title);
    await product.waitForElementVisibleThenInvisible(product.xpathProductDetailLoading);
    await product.page.waitForSelector(
      "(//div[@class = 'product-name'] | //table[@id='all-products']//td[@class='no-product'] " +
        "| //p[normalize-space() = 'Could not find any products matching'])[1]",
    );
    const isProductVisible = await dashboard
      .locator(`(//*[normalize-space() = '${productInfo.title}'])[1]`)
      .isVisible({ timeout: 10000 });
    if (!isProductVisible) {
      await product.addNewProductWithData(productInfo);
    }
    await product.gotoProductDetail(productInfo.title);
    return dashboard.locator("//div[@class='google__url']").textContent();
  };

  const verifyFullSessionCustomerDetail = async (orderPage: OrdersPage, session: SecssionDetail) => {
    await expect(
      orderPage.page.locator(orderPage.xpathPopupFullSession + orderPage.xpathOrderSourceIdentifier),
    ).toHaveText(session.source_identifier);
    await expect(
      orderPage.page.locator(`(${orderPage.xpathPopupFullSession}${orderPage.xpathOrderReferringSite})[1]`),
    ).toHaveText(session.referring_site);

    await expect(
      orderPage.page.locator(orderPage.xpathPopupFullSession + orderPage.xpathFirstPageVisited),
    ).toContainText(session.first_page_visited);
    await expect(orderPage.page.locator(orderPage.xpathPopupFullSession + orderPage.xpathOrderUtmSource)).toHaveText(
      session.utm_source,
    );
    await expect(orderPage.page.locator(orderPage.xpathPopupFullSession + orderPage.xpathOrderUtmMedium)).toHaveText(
      session.utm_medium,
    );
    await expect(orderPage.page.locator(orderPage.xpathPopupFullSession + orderPage.xpathOrderUtmCampaign)).toHaveText(
      session.utm_campaign,
    );
    await expect(orderPage.page.locator(orderPage.xpathPopupFullSession + orderPage.xpathOrderUtmTerm)).toHaveText(
      session.utm_term,
    );
    await expect(orderPage.page.locator(orderPage.xpathPopupFullSession + orderPage.xpathOrderUtmContent)).toHaveText(
      session.utm_content,
    );
  };

  const verifyViewSessionOrder = async (orderPage: OrdersPage, session: SecssionDetail) => {
    await expect(orderPage.page.locator(orderPage.xpathOrderSourceIdentifier)).toHaveText(session.source_identifier);
    await expect(orderPage.page.locator(`(${orderPage.xpathOrderReferringSite})[1]`)).toHaveText(
      session.referring_site,
    );

    await expect(orderPage.page.locator(orderPage.xpathFirstPageVisited)).toContainText(session.first_page_visited);
    await expect(orderPage.page.locator(orderPage.xpathOrderUtmSource)).toHaveText(session.utm_source);
    await expect(orderPage.page.locator(orderPage.xpathOrderUtmMedium)).toHaveText(session.utm_medium);
    await expect(orderPage.page.locator(orderPage.xpathOrderUtmCampaign)).toHaveText(session.utm_campaign);
    await expect(orderPage.page.locator(orderPage.xpathOrderUtmTerm)).toHaveText(session.utm_term);
    await expect(orderPage.page.locator(orderPage.xpathOrderUtmContent)).toHaveText(session.utm_content);
  };

  test.beforeEach(({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.setTimeout(conf.suiteConf.timeout);
    test.setTimeout(conf.suiteConf.timeout);
    customerPage = new CustomersPage(dashboard, conf.suiteConf.domain);
    (cardInfo = conf.suiteConf.card_info),
    (shippingInfo = conf.suiteConf.customer_info),
    (timeStamp = Math.floor(Date.now() / 1000));
  });

  const confCustomerUTM = loadData(__dirname, "CUSTOMER UTM");
  for (let i = 0; i < confCustomerUTM.caseConf.data.length; i++) {
    const customerUTM = confCustomerUTM.caseConf.data[i];
    /**(Note: Case social auto k thể login được vào FB hoặc zalo nên chỉ sử dụng được bằng link utm
     * > qe cần check thêm case manual khi click link ở trong FB/Zalo)
     */
    test(`@${customerUTM.case_id} ${customerUTM.description}`, async ({ page, conf, dashboard }) => {
      const ordersPage = new OrdersPage(dashboard, conf.suiteConf.domain);
      let domain;
      const linkUTM = customerUTM.linkUTM;
      if (customerUTM.is_multi_sf) {
        domain = conf.suiteConf.domain_multi_sf;
      } else {
        domain = conf.suiteConf.domain;
      }
      const checkout = new SFCheckout(page, domain);

      const secssionDetail = customerUTM.data_session_detail;
      shippingInfo.email = timeStamp + "@mailinator.com";
      shippingInfo.last_name = timeStamp.toString();

      await test.step(`Precondition:Checkout product thành công với thông tin Shipping address ${shippingInfo.email}`, async () => {
        handleProduct = await recreateProduct(dashboard, conf, customerUTM.product);
        const productLink = "https://" + domain + "/products/" + handleProduct.split("/").pop().trim();
        await goToPage(domain, checkout, productLink, linkUTM);
        await checkout.checkoutProductWithUsellNoVerify(shippingInfo, cardInfo);
        orderId = (await checkout.getOrderIdBySDK()).toString();
      });

      await test.step(
        "- Tại dashboard, đi đến màn Contacts\n" + "- Open customer\n" + "- Tại block Last session, kiểm tra hiển thị",
        async () => {
          //Analytics phải sau 1p mới call data nên em phải chờ 1p
          await dashboard.waitForTimeout(60000);
          await customerPage.gotoCustomerDetailByEmail(shippingInfo.email);
          let checkNoData;
          do {
            await dashboard.waitForTimeout(3000);
            await dashboard.reload();
            await dashboard.waitForSelector(
              "//*[(contains(@class,'text-bold') or @class='s-flex--fill s-heading') and normalize-space()='UTM parameters']",
            );
            checkNoData = await dashboard
              .locator(
                "//div[contains(@id,'sb-collapse-content') and descendant::div[normalize-space()='UTM parameters']]//p[normalize-space()='No data']",
              )
              .isVisible({ timeout: 10000 });
          } while (checkNoData);
          await verifyViewSessionOrder(ordersPage, secssionDetail);
        },
      );

      await test.step("- Click button View full session, kiểm tra hiển thị", async () => {
        await dashboard.click(customerPage.xpathLinkWithLabel("View all sessions"));
        await customerPage.clickOnBtnWithLabel("View full session");
        await verifyFullSessionCustomerDetail(ordersPage, secssionDetail);
      });

      await test.step(
        " ĐI đến màn Order detail vừa tạo, tại Conversion summary, click view detail\n" + "- Click View full sections",
        async () => {
          await ordersPage.openViewSecssionOrder(orderId);
          await verifyViewSessionOrder(ordersPage, secssionDetail);
        },
      );
    });
  }
});
