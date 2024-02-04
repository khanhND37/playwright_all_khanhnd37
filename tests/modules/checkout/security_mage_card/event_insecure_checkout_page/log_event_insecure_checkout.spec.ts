import { expect, test } from "@core/fixtures";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { Card, DataGetLogEslatic, Product, ShippingAddressApi } from "@types";
import { DataGetLogEslaticSearch } from "./log_event_insecure_checkout";
import { LogEventInsecureConstant } from "../log_event_insecure_constant";

test.describe("Check log event insecure on Kibana", () => {
  let checkoutPage: SFCheckout, checkoutAPI: CheckoutAPI;
  let domain: string, prodInfo: Product[], shippingAddress: ShippingAddressApi, email: string;
  let cardInfo: Card, dataEslaticSearch: DataGetLogEslatic, log;
  let scheduleData: DataGetLogEslaticSearch;
  let isSchedule: boolean, scheduleTime: number, documentContent;
  let logContent: LogEventInsecureConstant;

  // const formCard = `
  //           <div
  //               class="content-box__row--spacing-v3 conte
  // nt-box__row content-box__row--spacing-vertical content-box__
  // row--secondary" id="stripe-stripe-credit-card-section-clone">
  //                   <form action="/action_page.php">
  //                       <input id="card-number" type="text" class="w-100 mb-8" placeholder="Card number"><br>
  //                       <input id="card-expired" type="text" class="w-100 mb-8" placeholder="Card expired date"><br>
  //                       <input id="card-holder-
  // name" type="text" class="w-100 mb-8" placeholder="Cardholder number"><br>
  //                       <input id="card-cvv" type="text" class="w-100" placeholder="CVV">
  //                   </form>
  //           </div><br>
  //           <button id="submit-payment" type="button" onclick="submitForm()">Submit Payment</button>
  //       `;

  test.beforeEach(async ({ conf, page, authRequest, scheduler }) => {
    domain = conf.suiteConf.domain;
    prodInfo = conf.suiteConf.product_info;
    shippingAddress = conf.suiteConf.shipping_address;
    email = conf.suiteConf.email;
    cardInfo = conf.suiteConf.card_info;
    scheduleTime = conf.suiteConf.schedule_time;
    dataEslaticSearch = conf.caseConf.data_get_log_eslatic;

    checkoutPage = new SFCheckout(page, domain);
    checkoutAPI = new CheckoutAPI(domain, authRequest, page);
    logContent = new LogEventInsecureConstant();

    //Get thông tin trước khi schedule từ database
    const rawDataJson = await scheduler.getData();
    if (rawDataJson) {
      scheduleData = rawDataJson as DataGetLogEslaticSearch;
      isSchedule = true;
    } else {
      scheduleData = {
        session_id: "",
      };
    }

    if (isSchedule) {
      return;
    }

    // Open checkout page
    await checkoutAPI.addProductToCartThenCheckout(prodInfo);
    await checkoutAPI.updateCustomerInformation(email, shippingAddress);
    await checkoutAPI.selectDefaultShippingMethod(shippingAddress.country_code);
    await checkoutAPI.openCheckoutPageByToken();
    await page.locator(checkoutPage.xpathFooterSF).scrollIntoViewIfNeeded();
    expect(await checkoutPage.genLoc(checkoutPage.xpathPayment).isVisible()).toBeTruthy();
    const sessionId = await page.evaluate(() => JSON.parse(window.localStorage.getItem("identical")).session_id);
    dataEslaticSearch.session_id = sessionId;
  });

  test(`@SB_SEC_CO_IS_MC_01 Kiểm tra log trên Kibana khi inject fake form tại checkout page, gửi data sang external qua xhr`, async ({
    page,
    scheduler,
  }) => {
    let injectCard;
    await test.step("Nhập script submitForm() để push data qua xhr", async () => {
      // Nếu isSchedule = true thì bỏ qua steps này
      if (isSchedule) {
        return;
      }

      // Inject script to checkout page
      injectCard = (documentContent: { formCard: string; scriptContent: string }) => {
        // Replace form card Stripe to another card
        const stripeDom = document.getElementById("stripe-stripe-credit-card-section");
        stripeDom.insertAdjacentHTML("afterend", documentContent.formCard);
        stripeDom.style.display = "none";
        const cardInjected = document.createElement(`script`);
        cardInjected.textContent = documentContent.scriptContent;
        document.body.appendChild(cardInjected);
      };
    });

    await test.step("Nhập card và click button Submit payment", async () => {
      // Nếu isSchedule = true thì bỏ qua steps này
      if (isSchedule) {
        return;
      }
      //Get data documentContent
      documentContent = {
        formCard: logContent.formCardInjected,
        scriptContent: logContent.scriptContentSendDataViaXHR,
      };

      //Inject form card
      await page.evaluate(injectCard, documentContent);

      // Send data to external via XHR
      await checkoutPage.inputCardInjected(cardInfo);
      await page.waitForResponse(response => response.url().includes("test-security") && response.status() === 200);

      // Lưu thông tin vào database
      scheduleData.session_id = dataEslaticSearch.session_id;
      await scheduler.setData(scheduleData);
      await scheduler.schedule({ mode: "later", minutes: scheduleTime });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
      return;
    });

    await test.step("Tại Kibana, kiểm tra log", async () => {
      // Get data schedule from database
      if (isSchedule) {
        dataEslaticSearch.session_id = scheduleData.session_id;
        await scheduler.clear();
      }
      //Verify log by reason call_external_domain
      log = await checkoutAPI.getLogOnEslaticSearchByReason(dataEslaticSearch, "call_external_domain");
      expect(log.reason).toEqual("call_external_domain");
      expect(log.action.params.method).toEqual("xhr");
      expect(await log.action.params.call_to.trim()).toEqual(dataEslaticSearch.external_domain);

      //Verify log by reason enter_credit_card
      log = await checkoutAPI.getLogOnEslaticSearchByReason(dataEslaticSearch, "enter_credit_card");
      expect(log.reason).toEqual("enter_credit_card");
      expect(log.action.params.internal_data).not.toEqual(cardInfo.number);
    });
  });

  test(`@SB_SEC_CO_IS_MC_02 Kiểm tra log trên Kibana khi inject fake form tại checkout page, gửi data sang external qua fetch`, async ({
    page,
    scheduler,
  }) => {
    let injectCard;
    await test.step("Nhập script submitForm() để push data qua xhr", async () => {
      // Nếu isSchedule = true thì bỏ qua steps này
      if (isSchedule) {
        return;
      }

      // Inject script to checkout page
      injectCard = (documentContent: { formCard: string; scriptContent: string }) => {
        // Replace form card Stripe to another card
        const stripeDom = document.getElementById("stripe-stripe-credit-card-section");
        stripeDom.insertAdjacentHTML("afterend", documentContent.formCard);
        stripeDom.style.display = "none";
        const cardInjected = document.createElement(`script`);
        cardInjected.textContent = documentContent.scriptContent;
        document.body.appendChild(cardInjected);
      };
    });

    await test.step("Nhập card và click button Submit payment", async () => {
      // Nếu isSchedule = true thì bỏ qua steps này
      if (isSchedule) {
        return;
      }

      //Get data documentContent
      documentContent = {
        formCard: logContent.formCardInjected,
        scriptContent: logContent.scriptContentSendDataViaFetch,
      };

      //Inject form card
      await page.evaluate(injectCard, documentContent);

      // Send data to external via XHR
      await checkoutPage.inputCardInjected(cardInfo);
      await page.waitForResponse(response => response.url().includes("test-security") && response.status() === 200);

      // Lưu thông tin vào database
      scheduleData.session_id = dataEslaticSearch.session_id;
      await scheduler.setData(scheduleData);
      await scheduler.schedule({ mode: "later", minutes: scheduleTime });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
      return;
    });

    await test.step("Tại Kibana, kiểm tra log", async () => {
      // Get data schedule from database
      if (isSchedule) {
        dataEslaticSearch.session_id = scheduleData.session_id;
        await scheduler.clear();
      }

      //Verify log by reason call_external_domain
      log = await checkoutAPI.getLogOnEslaticSearchByReason(dataEslaticSearch, "call_external_domain");
      expect(log.reason).toEqual("call_external_domain");
      expect(log.action.params.method).toEqual("fetch");
      expect(await log.action.params.call_to.trim()).toEqual(dataEslaticSearch.external_domain);

      //Verify log by reason enter_credit_card
      log = await checkoutAPI.getLogOnEslaticSearchByReason(dataEslaticSearch, "enter_credit_card");
      expect(log.reason).toEqual("enter_credit_card");
      expect(log.action.params.internal_data).not.toEqual(cardInfo.number);
    });
  });

  test(`@SB_SEC_CO_IS_MC_03 Kiểm tra log trên Kibana khi inject fake form tại checkout page, gửi data sang external qua fetch`, async ({
    page,
    scheduler,
  }) => {
    // Open websocket page
    const newPage = await page.context().newPage();
    await newPage.goto("https://test-security.shopbase.dev/socket");

    let injectCard;
    await test.step("Nhập script submitForm() để push data qua xhr", async () => {
      // Nếu isSchedule = true thì bỏ qua steps này
      if (isSchedule) {
        return;
      }

      // Inject script to checkout page
      injectCard = (documentContent: { formCard: string; scriptContent: string }) => {
        // Replace form card Stripe to another card
        const stripeDom = document.getElementById("stripe-stripe-credit-card-section");
        stripeDom.insertAdjacentHTML("afterend", documentContent.formCard);
        stripeDom.style.display = "none";
        const cardInjected = document.createElement(`script`);
        cardInjected.textContent = documentContent.scriptContent;
        document.body.appendChild(cardInjected);
      };
    });

    await test.step("Nhập card và click button Submit payment", async () => {
      // Nếu isSchedule = true thì bỏ qua steps này
      if (isSchedule) {
        return;
      }

      //Get data documentContent
      documentContent = {
        formCard: logContent.formCardInjected,
        scriptContent: logContent.scriptContentSendDataViaWS,
      };

      //Inject form card
      await page.evaluate(injectCard, documentContent);

      // Send data to external via XHR
      await checkoutPage.inputCardInjected(cardInfo);

      // Lưu thông tin vào database
      scheduleData.session_id = dataEslaticSearch.session_id;
      await scheduler.setData(scheduleData);
      await scheduler.schedule({ mode: "later", minutes: scheduleTime });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
      return;
    });

    await test.step("Tại Kibana, kiểm tra log", async () => {
      // Get data schedule from database
      if (isSchedule) {
        dataEslaticSearch.session_id = scheduleData.session_id;
        await scheduler.clear();
      }

      //Verify log by reason call_external_domain
      log = await checkoutAPI.getLogOnEslaticSearchByReason(dataEslaticSearch, "call_external_domain");
      expect(log.reason).toEqual("call_external_domain");
      expect(log.action.params.method).toEqual("websocket");
      expect(await log.action.params.call_to.trim()).toEqual(dataEslaticSearch.external_domain);

      //Verify log by reason enter_credit_card
      log = await checkoutAPI.getLogOnEslaticSearchByReason(dataEslaticSearch, "enter_credit_card");
      expect(log.reason).toEqual("enter_credit_card");
      expect(log.action.params.internal_data).not.toEqual(cardInfo.number);
    });
  });
});
