import { expect, test } from "@fixtures/website_builder";
import { snapshotDir } from "@utils/theme";
import { AppsAPI } from "@pages/api/apps";
import { CrossSellAPI } from "@pages/api/apps/upsell/cross-sell";
import { SFCheckout } from "@pages/storefront/checkout";
import { CheckoutAPI } from "@pages/api/checkout";
import { OrderAPI } from "@pages/api/order";
import { BoostUpsellInsidePage } from "@pages/dashboard/apps/boost-upsell/boost-upsell-inside";
import { Page } from "@playwright/test";

test.describe("@SB_SF_UPOP Verify post purchase offer", () => {
  let appsAPI: AppsAPI;
  let apps: CrossSellAPI;
  let suiteConf, caseConf, checkoutSF, data, offerIds, handle;
  let postpurchaseA,
    postpurchaseB,
    postpurchaseC,
    postpurchaseD,
    postpurchaseE,
    postpurchaseF,
    postpurchaseI,
    postpurchaseJ;
  let checkoutAPI: CheckoutAPI;
  let orderAPI: OrderAPI;
  let upsell: BoostUpsellInsidePage;

  test.beforeEach(async ({ page, conf, authRequest, dashboard }, testInfo) => {
    const domain = conf.suiteConf.domain;
    appsAPI = new AppsAPI(domain, authRequest);
    apps = new CrossSellAPI(domain, conf.suiteConf.shop_id, authRequest);
    caseConf = conf.caseConf;
    suiteConf = conf.suiteConf;
    offerIds = suiteConf.offer_ids;
    handle = caseConf.data.product_handle;
    data = suiteConf.checkout;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    checkoutSF = new SFCheckout(page, suiteConf.domain);
    checkoutAPI = new CheckoutAPI(suiteConf.domain, authRequest, page);
    orderAPI = new OrderAPI(conf.suiteConf.domain, authRequest);
    upsell = new BoostUpsellInsidePage(page, conf.suiteConf.domain);

    //Deactive all offers
    await apps.requestOnOffOffer({
      api: authRequest,
      domain: suiteConf.domain,
      shop_id: suiteConf.shop_id,
      offer_ids: offerIds,
      status: false,
    });

    postpurchaseA = checkoutSF.blockProductOnPPCV2ByName("product A");
    postpurchaseB = checkoutSF.blockProductOnPPCV2ByName("product B");
    postpurchaseC = checkoutSF.blockProductOnPPCV2ByName("product C");
    postpurchaseD = checkoutSF.blockProductOnPPCV2ByName("product D");
    postpurchaseE = checkoutSF.blockProductOnPPCV2ByName("product E");
    postpurchaseF = checkoutSF.blockProductOnPPCV2ByName("product F");
    postpurchaseI = checkoutSF.blockProductOnPPCV2ByName("product I");
    postpurchaseJ = checkoutSF.blockProductOnPPCV2ByName("product J");

    await dashboard.goto(`https://${suiteConf.domain}/admin/apps/boost-upsell`);
  });

  async function completeOrderByProductName(page: Page, productName: string) {
    await page.goto(`https://${suiteConf.domain}/products/${productName}`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await page.waitForURL(/\/checkouts/);
    await expect(page.locator(checkoutSF.xpathProductCartV2).first()).toBeVisible();
    await checkoutSF.completeOrderThemeV2(data);
    await expect(page.getByText("Thank you!").first()).toBeVisible();
  }

  test("@SB_SF_UPOP_02 Check ppc khi có 2 offer cùng target", async ({ page, authRequest }) => {
    //Do phải thực hiện 2 lần checkout liên tiếp + mạng lag nên thi thoảng time chạy >2.5m nên thêm slow để stable)
    test.slow();
    await test.step("Pre-condition: Activate offer", async () => {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: suiteConf.domain,
        shop_id: suiteConf.shop_id,
        offer_ids: [offerIds[0], offerIds[1]],
        status: true,
      });
    });

    await test.step("Complete order với product F", async () => {
      await completeOrderByProductName(page, handle[0]);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseB).toBeVisible();
      await expect(postpurchaseC).toBeVisible();
      await expect(postpurchaseA).toBeHidden();
      await expect(postpurchaseF).toBeHidden();
    });

    await test.step("Click button X", async () => {
      await page.locator(checkoutSF.xpathClosePPCPopUp).click();
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeHidden();
      await page.reload();
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeHidden();
    });

    await test.step("Complete order với product A", async () => {
      await completeOrderByProductName(page, handle[1]);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
    });

    await test.step("Click No,thanks", async () => {
      await page.locator(checkoutSF.xpathPPCV2).getByText("No thanks, I'll pass").first().click();
      await expect(postpurchaseD).toBeVisible();
      await expect(postpurchaseE).toBeVisible();
      await expect(postpurchaseA).toBeHidden();
      await expect(postpurchaseF).toBeHidden();
    });

    await test.step("Click No,thanks", async () => {
      await page.locator(checkoutSF.xpathPPCV2).getByText("No thanks, I'll pass").first().click();
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeHidden();
    });
  });

  test("@SB_SF_UPOP_3 Check ppc khi có discount", async ({ authRequest, page }) => {
    await test.step("Pre-condition: Activate offer", async () => {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: suiteConf.domain,
        shop_id: suiteConf.shop_id,
        offer_ids: [offerIds[1]],
        status: true,
      });
    });

    await test.step("Complete order với product target (product A)", async () => {
      await completeOrderByProductName(page, handle);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseD.getByText(caseConf.data.discount)).toBeVisible();
      await expect(postpurchaseE.getByText(caseConf.data.discount)).toBeVisible();
    });
  });

  test("@SB_SF_UPOP_4 Check ppc khi ko có discount", async ({ authRequest, page }) => {
    await test.step("Pre-condition: Activate offer", async () => {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: suiteConf.domain,
        shop_id: suiteConf.shop_id,
        offer_ids: [offerIds[2]],
        status: true,
      });
    });

    await test.step("Complete order với product target bất kỳ (product F)", async () => {
      await completeOrderByProductName(page, handle);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseA.getByText(caseConf.data.discount)).toBeHidden();
      await expect(postpurchaseB.getByText(caseConf.data.discount)).toBeHidden();
      await expect(postpurchaseC.getByText(caseConf.data.discount)).toBeHidden();
      await expect(postpurchaseD.getByText(caseConf.data.discount)).toBeHidden();
    });

    await test.step("Add to order product A on PPC popup", async () => {
      await postpurchaseA.getByText("Add to order").click();
      await expect(
        page
          .locator(checkoutSF.blockProductOnCheckoutPage)
          .filter({ hasText: "product A" })
          .getByText(caseConf.data.price),
      ).toBeVisible();
    });
  });

  test("@SB_SF_UPOP_5 Check ppc khi có recommend là specific collections", async ({ page, authRequest }) => {
    test.slow();
    await test.step("Pre-condition: Activate offer", async () => {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: suiteConf.domain,
        shop_id: suiteConf.shop_id,
        offer_ids: [offerIds[6], offerIds[7]],
        status: true,
      });
    });

    await test.step("Complete order với product A", async () => {
      await completeOrderByProductName(page, handle[0]);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseA).toBeHidden();
      await expect(postpurchaseB.getByText(caseConf.data.discount[0])).toBeVisible();
      await expect(postpurchaseC.getByText(caseConf.data.discount[0])).toBeVisible();
      await expect(postpurchaseD.getByText(caseConf.data.discount[0])).toBeVisible();
      await expect(postpurchaseE.getByText(caseConf.data.discount[0])).toBeVisible();
    });

    await test.step("Add to order product B với discount 20% on PPC popup", async () => {
      await postpurchaseB.getByText("Add to order").click();
      await expect(
        page
          .locator(checkoutSF.blockProductOnCheckoutPage)
          .filter({ hasText: "product B" })
          .getByText(caseConf.data.price[0]),
      ).toBeVisible();
    });

    await test.step("Complete order với product E, D", async () => {
      await page.goto(`https://${suiteConf.domain}/products/${handle[1]}`);
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "Add to cart" }).first().click();
      await page.waitForURL(/\/checkouts/);
      await completeOrderByProductName(page, handle[2]);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseA.getByText(caseConf.data.discount[1])).toBeVisible();
      await expect(postpurchaseB.getByText(caseConf.data.discount[1])).toBeVisible();
      await expect(postpurchaseC.getByText(caseConf.data.discount[1])).toBeVisible();
      await expect(postpurchaseD.getByText(caseConf.data.discount[1])).toBeVisible();
      await expect(postpurchaseE.getByText(caseConf.data.discount[1])).toBeVisible();
      await expect(postpurchaseE.getByRole("option").filter({ hasText: "M" })).toBeAttached();
      await expect(postpurchaseE.getByRole("option").filter({ hasText: "L" })).toBeAttached();
      await expect(postpurchaseE.getByRole("option").filter({ hasText: "S" })).not.toBeAttached();
    });

    await test.step("Add to order product E với discount 50% on PPC popup", async () => {
      await postpurchaseE.getByText("Add to order").click();
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeHidden();
      await expect(
        page
          .locator(checkoutSF.blockProductOnCheckoutPage)
          .filter({ hasText: "product E" })
          .getByText(caseConf.data.price[1]),
      ).toBeVisible();
      expect(await checkoutSF.getTotalOnOrderSummary()).toEqual(caseConf.data.order_summary);
    });
  });

  test("@SB_SF_UPOP_6 Check ppc khi có recommend là same collections với nhiều target products và có discount", async ({
    page,
    authRequest,
  }) => {
    test.slow();
    const number = caseConf.data.quantity_product;
    await test.step("Pre-condition: Activate offer", async () => {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: suiteConf.domain,
        shop_id: suiteConf.shop_id,
        offer_ids: [offerIds[8]],
        status: true,
      });
    });

    await test.step("Complete order với product D", async () => {
      await completeOrderByProductName(page, handle[0]);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseD).toBeHidden();
      await expect(postpurchaseA.getByText(caseConf.data.discount)).toBeVisible();
      await expect(postpurchaseB.getByText(caseConf.data.discount)).toBeVisible();
      await expect(postpurchaseC.getByText(caseConf.data.discount)).toBeVisible();
      await expect(postpurchaseE.getByText(caseConf.data.discount)).toBeVisible();
    });

    await test.step("Add to cart product B on PPC popup", async () => {
      await postpurchaseB.getByText("Add to order").click();
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeHidden();
      await expect(
        page
          .locator(checkoutSF.blockProductOnCheckoutPage)
          .filter({ hasText: "product B" })
          .getByText(caseConf.data.price),
      ).toBeVisible();
    });

    await test.step("Complete order với product J không thuộc collection nào", async () => {
      await completeOrderByProductName(page, handle[1]);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseJ).toBeHidden();
      expect(await page.locator(checkoutSF.blockProductOnPPCV2).count()).toBe(number);
      await expect(
        page.locator(checkoutSF.blockProductOnPPCV2).first().getByText(caseConf.data.discount),
      ).toBeVisible();
    });
  });

  test("@SB_SF_UPOP_7 Check ppc khi có recommend là same collections với nhiều target products và ko có discount", async ({
    page,
    authRequest,
  }) => {
    const productsNameAct = [];
    const number = caseConf.data.quantity_product;
    const productsNameExp = caseConf.data.productsName;
    await test.step("Pre-condition: Activate offer", async () => {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: suiteConf.domain,
        shop_id: suiteConf.shop_id,
        offer_ids: [offerIds[3]],
        status: true,
      });
    });

    await test.step("Complete order với product F", async () => {
      await completeOrderByProductName(page, handle);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseF).toBeHidden();
      expect(await page.locator(checkoutSF.blockProductOnPPCV2).count()).toBe(number);

      for (let i = 0; i < number; i++) {
        productsNameAct.push(await page.locator(checkoutSF.productNameOnPPCV2).nth(i).textContent());
        await expect(page.locator(checkoutSF.blockProductOnPPCV2).nth(i).getByText(caseConf.data.price)).toBeVisible();
      }

      //Hàm so sánh 2 mảng là cha-con của nhau
      const isSubArray = productsNameAct.every(element => productsNameExp.includes(element));
      expect(isSubArray).toBe(true);
    });
  });

  test("@SB_SF_UPOP_9 Check ppc khi có recommend với automated rules (most revelant) và có discount", async ({
    page,
    authRequest,
  }) => {
    const numberExp = caseConf.data.quantity_product;
    const numberAct = await page.locator(checkoutSF.blockProductOnPPCV2).count();
    await test.step("Pre-condition: Activate offer", async () => {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: suiteConf.domain,
        shop_id: suiteConf.shop_id,
        offer_ids: [offerIds[9]],
        status: true,
      });
    });

    await test.step("Complete order với product A", async () => {
      await completeOrderByProductName(page, handle);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseA).toBeHidden();
      expect(numberAct).toBeLessThanOrEqual(numberExp);
      for (let i = 0; i < numberAct; i++) {
        await expect(page.locator(checkoutSF.blockProductOnPPCV2).nth(i).getByText(caseConf.data.price)).toBeVisible();
      }
    });
  });

  test("@SB_SF_UPOP_14 Check ppc khi deactive offer", async ({ page }) => {
    await test.step("Complete order với product target bất kỳ (product F)", async () => {
      await completeOrderByProductName(page, handle);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeHidden();
    });
  });

  test("@SB_SF_UPOP_17 Check order với item add từ ppc + không add từ ppc", async ({ page, authRequest }) => {
    test.slow();
    let orderID;
    await test.step("Pre-condition: Activate offer", async () => {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: suiteConf.domain,
        shop_id: suiteConf.shop_id,
        offer_ids: [offerIds[4]],
        status: true,
      });
    });

    await test.step("Complete order với product C", async () => {
      await completeOrderByProductName(page, handle);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseB).toBeVisible();
      await expect(postpurchaseB.getByText(caseConf.data.discount)).toBeHidden();
    });

    await test.step("Add to cart với product B", async () => {
      await postpurchaseB.getByText("Add to order").click();
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeHidden();
      await expect(
        page
          .locator(checkoutSF.blockProductOnCheckoutPage)
          .filter({ hasText: "product B" })
          .getByText(caseConf.data.price),
      ).toBeVisible();
      expect(await checkoutSF.getTotalOnOrderSummary()).toEqual(caseConf.data.order_summary);
    });

    await test.step("Complete order với product C", async () => {
      await completeOrderByProductName(page, handle);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(await page.locator(checkoutSF.PPCTimerV2)).toBeVisible();
      await expect(postpurchaseB).toBeVisible();
      await expect(postpurchaseB.getByText(caseConf.data.discount)).toBeHidden();
    });

    await test.step("Click No,thanks", async () => {
      await page.locator(checkoutSF.xpathPPCV2).getByText("No thanks, I'll pass").first().click();
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeHidden();
      const checkoutToken = await checkoutSF.getCheckoutToken();
      checkoutAPI = new CheckoutAPI(suiteConf.domain, authRequest, page, checkoutToken);
      orderID = await checkoutAPI.getOrderIDByAPI();
      await expect(async () => {
        const object = await orderAPI.getOrderInfo(orderID);
        expect(await object.statusOrder).toEqual("paid");
        expect(await object.subtotal).toEqual(caseConf.data.subtotal_price);
      }).toPass({ intervals: [1000], timeout: 60000 });
    });
  });

  test("@SB_SF_UPOP_18 Check ppc với product bị unlisting, sold out", async ({ page, authRequest }) => {
    await test.step("Pre-condition: Activate offer", async () => {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: suiteConf.domain,
        shop_id: suiteConf.shop_id,
        offer_ids: [offerIds[5]],
        status: true,
      });
    });

    await test.step("Complete order với product C", async () => {
      await completeOrderByProductName(page, handle);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseA).toBeVisible();
      await expect(postpurchaseI).toBeHidden();
      expect(await page.locator(checkoutSF.blockProductOnPPCV2).count()).toBe(caseConf.data.quantity_product);
    });
  });

  test("@SB_SF_UPOP_19 Check performance của offer post-purchase", async ({ page, authRequest }) => {
    test.slow(); // Update performance có thể lâu
    let res1, res2, res3;
    await test.step("Pre-condition: Activate offer and get performance before checkout offer", async () => {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: suiteConf.domain,
        shop_id: suiteConf.shop_id,
        offer_ids: [offerIds[10], offerIds[11], offerIds[12]],
        status: true,
      });
    });

    //exp1: là performance của offer setup không show recommend product đã purchase
    const exp1 = await appsAPI.getPerformanceOfferById(offerIds[10], caseConf.data.number_sale[0]);
    //exp2: là performance của offer setup show recommend product đã purchase
    const exp2 = await appsAPI.getPerformanceOfferById(offerIds[11], caseConf.data.number_sale[1]);
    //exp3: là performance của offer setup show recommend product là target product
    const exp3 = await appsAPI.getPerformanceOfferById(offerIds[12], caseConf.data.number_sale[2]);

    await test.step("Complete order với product A", async () => {
      await completeOrderByProductName(page, caseConf.data.product_handle[0]);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseA).toBeHidden();
      await expect(postpurchaseB).toBeVisible();
    });

    await test.step("Add to order product B", async () => {
      await postpurchaseB.getByText("Add to order").click();
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeHidden();
    });

    await test.step("Complete order với product B,E", async () => {
      await page.goto(`https://${suiteConf.domain}/products/${handle[1]}`);
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "Add to cart" }).first().click();
      await page.waitForURL(/\/checkouts/);
      await completeOrderByProductName(page, handle[3]);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseB).toBeVisible();
      await expect(postpurchaseE).toBeVisible();
      await expect(postpurchaseF).toBeVisible();
    });

    await test.step("Add to order với product B", async () => {
      await postpurchaseB.getByText("Add to order").click();
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeHidden();
    });

    await test.step("Complete order với product D,E", async () => {
      await page.goto(`https://${suiteConf.domain}/products/${handle[2]}`);
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "Add to cart" }).first().click();
      await page.waitForURL(/\/checkouts/);
      await completeOrderByProductName(page, handle[3]);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseE).toBeHidden();
      await expect(postpurchaseD).toBeVisible();
      await expect(postpurchaseC).toBeHidden();
    });

    await test.step("Add to order với product D", async () => {
      await postpurchaseD.getByText("Add to order").click();
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeHidden();
    });

    await test.step("Verify performance của các offer", async () => {
      // Verify performance của offer setup không cho show product recommend đã purchase
      await expect(async () => {
        res1 = await appsAPI.getPerformanceOffer(offerIds[10]);
        expect(res1).toMatchObject(exp1);
      }).toPass({ intervals: [1000], timeout: 120_000 });

      //Verify performance của offer setup cho show recommend product đã purchase
      await expect(async () => {
        res2 = await appsAPI.getPerformanceOffer(offerIds[11]);
        expect(res2).toMatchObject(exp2);
      }).toPass({ intervals: [1000], timeout: 120_000 });

      //Verify performace của offer setup recommend product là target product
      await expect(async () => {
        res3 = await appsAPI.getPerformanceOffer(offerIds[12]);
        expect(res3).toMatchObject(exp3);
      }).toPass({ intervals: [1000], timeout: 120_000 });
    });
  });

  test("@SB_SF_UPOP_20 Check giao diện offer PPC khi tạo mới", async ({ page }) => {
    await test.step("Open create offer screen", async () => {
      await page.goto(`https://${suiteConf.domain}/admin/apps/boost-upsell/up-sell/offer/0`);
      await expect(page.getByRole("heading", { name: "Create offer" })).toBeVisible();
      await page.locator(upsell.upsellOfferTypes).getByText("Post-purchase").click();

      //Verify giao diện block target product
      await expect(page.locator(upsell.targetUpsellOffer).getByText("All products")).toBeChecked();
      await expect(page.locator(upsell.targetUpsellOffer).getByText("Specific products")).not.toBeChecked();
      await expect(page.locator(upsell.targetUpsellOffer).getByText("Specific collections")).not.toBeChecked();

      //Verify giao diện block recommend product
      await expect(page.locator(upsell.recommendUpsellOffer).getByText("Specific products")).toBeChecked();
      await expect(
        page
          .locator(upsell.recommendUpsellOffer)
          .filter({ hasText: "Specific products" })
          .getByText(caseConf.data.checkbox_content),
      ).not.toBeChecked();
      await expect(page.locator(upsell.recommendUpsellOffer).getByText("Specific collections")).not.toBeChecked();
      await page.locator(upsell.recommendUpsellOffer).getByText("Specific collections").click();
      await expect(page.locator(upsell.recommendUpsellOffer).getByText("Specific products")).not.toBeChecked();
      await expect(
        page
          .locator(upsell.recommendUpsellOffer)
          .filter({ hasText: "Specific collections" })
          .getByText(caseConf.data.checkbox_content),
      ).not.toBeChecked();
      await expect(
        page.locator(upsell.recommendUpsellOffer).getByText("Same collection with target products"),
      ).not.toBeChecked();
      await page.locator(upsell.recommendUpsellOffer).getByText("Same collection with target products").click();
      await expect(
        page
          .locator(upsell.recommendUpsellOffer)
          .filter({ hasText: "Same collection with target products" })
          .getByText(caseConf.data.checkbox_content),
      ).toBeHidden();
      await expect(
        page.locator(upsell.recommendUpsellOffer).getByText("Most relevant products using automated rules"),
      ).not.toBeChecked();
      await page.locator(upsell.recommendUpsellOffer).getByText("Most relevant products using automated rules").click();
      await expect(
        page
          .locator(upsell.recommendUpsellOffer)
          .filter({ hasText: "Most relevant products using automated rules" })
          .getByText(caseConf.data.checkbox_content),
      ).toBeHidden();
      await expect(
        page
          .locator(upsell.recommendUpsellOffer)
          .getByText("Offering the same product that customers has just purchased for post-purchase upsell"),
      ).not.toBeChecked();
      await page
        .locator(upsell.recommendUpsellOffer)
        .getByText("Offering the same product that customers has just purchased for post-purchase upsell")
        .click();
      await expect(page.locator(upsell.recommendUpsellOffer).getByText(caseConf.data.helptext)).toBeVisible();
    });
  });
  test("@SB_SF_UPOP_22 Check ppc khi có recommend là Offering the same product that customers has just purchased for post-purchase upsell với target = Specific products", async ({
    page,
    authRequest,
  }) => {
    await test.step("Pre-condition: Activate offer", async () => {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: suiteConf.domain,
        shop_id: suiteConf.shop_id,
        offer_ids: [offerIds[13]],
        status: true,
      });
    });

    await test.step("Complete order với product A,E,F", async () => {
      await page.goto(`https://${suiteConf.domain}/products/${handle[0]}`);
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "Add to cart" }).first().click();
      await page.waitForURL(/\/checkouts/);
      await page.goto(`https://${suiteConf.domain}/products/${handle[1]}`);
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "Add to cart" }).first().click();
      await page.waitForURL(/\/checkouts/);
      await completeOrderByProductName(page, handle[2]);
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeVisible();
      await expect(postpurchaseA).toBeVisible();
      await expect(postpurchaseE).toBeVisible();
      await expect(postpurchaseE.getByRole("option").filter({ hasText: "M" })).toBeAttached();
      await expect(postpurchaseE.getByRole("option").filter({ hasText: "L" })).toBeAttached();
      await expect(postpurchaseE.getByRole("option").filter({ hasText: "S" })).not.toBeAttached();
      await expect(postpurchaseE.getByRole("option").filter({ hasText: "XL" })).not.toBeAttached();
      await expect(postpurchaseB).toBeHidden();
      await expect(postpurchaseF).toBeHidden();
      await expect(postpurchaseA.getByText(caseConf.data.discount)).toBeVisible();
    });

    await test.step("Add to order với product A", async () => {
      await postpurchaseA.getByText("Add to order").click();
      await expect(page.locator(checkoutSF.xpathPPCV2)).toBeHidden();
      await expect(
        page
          .locator(checkoutSF.blockProductOnCheckoutPage)
          .filter({ hasText: "product A" })
          .nth(1)
          .getByText(caseConf.data.price),
      ).toBeVisible();
    });
  });
});
