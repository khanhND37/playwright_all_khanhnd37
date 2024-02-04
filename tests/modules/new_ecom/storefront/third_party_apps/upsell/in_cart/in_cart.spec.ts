import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "@core/fixtures";
import { UpSell } from "@pages/new_ecom/storefront/upsell";
import { snapshotDir } from "@utils/theme";
import { CaseConf } from "@types";
import { SFUpSellAPI } from "@pages/new_ecom/storefront/apps/upsell/cross-sell";
import { CrossSellAPI } from "@pages/api/apps/upsell/cross-sell";
import { HttpMethods } from "@core/services";

async function verifyHighLowSuggest(upsell: UpSell, cConf: CaseConf) {
  for (let i = 0; i < cConf.data.length; i++) {
    const data = cConf.data[i];
    if (data.step === 1) {
      await test.step(`Ngoài SF, add product bất kì`, async () => {
        await upsell.genLoc(upsell.addCartBlock).click();
        await Promise.all([
          upsell.waitCartItemVisible(),
          upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
        ]);
      });
    } else {
      await test.step(`Add product ${data.step}`, async () => {
        await upsell.genLoc(upsell.getSelectorAddCartInCart(data.indexCart, upsell.outsideCartDrawer)).click();
        await expect(upsell.genLoc(upsell.quickViewDialog)).toBeVisible();
      });
      await test.step(`Add product ${data.step} với ${data.variant}`, async () => {
        if (data.step === 2) {
          await upsell.onClickVariantQuickview(1, 2);
        }

        const request = upsell.page.waitForRequest(
          request => request.url().includes("/api/checkout/next/cart.json") && request.method() === HttpMethods.Put,
        );
        await upsell.onClickAddCartQuickview();
        const requestAPI = await request;
        const responseAPI = await (await requestAPI.response()).json();
        expect(responseAPI.result.variant_title).toEqual(data.expected.product_variant);
      });
    }

    await test.step(`Mở Cart drawer/Cart page`, async () => {
      for (let j = 0; j < cConf.actions.length; j++) {
        const action = cConf.actions[j];
        let selector = "";
        if (action === "page") {
          selector = upsell.outsideCartDrawer;
        } else {
          selector = upsell.insideCartDrawer;
        }

        if (typeof data.expected.dom === "number") {
          await expect(upsell.genLoc(upsell.getSelectorHeadingInCart(data.expected.indexCart, selector))).toHaveCount(
            data.expected.dom,
          );
        } else {
          await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(data.expected.indexCart, selector))).toHaveText(
            data.expected.product_title,
          );
          await expect(
            upsell.genLoc(upsell.getSelectorPrdPriceInCart(data.expected.indexCart, false, selector)),
          ).toHaveText(data.expected.product_price);
        }

        if (action === "page") {
          await upsell.onClickCartIcon();
        } else {
          await upsell.genLoc(upsell.cartDrawerOverlay).click();
        }
      }
    });
  }
}

async function verifyProductCampaign(upsell: UpSell, api: APIRequestContext, cConf: CaseConf) {
  for (let i = 0; i < cConf.steps.length; i++) {
    const step = cConf.steps[i];
    await test.step(step.title, async () => {
      switch (step.action) {
        case "add_manual": {
          await upsell.genLoc(upsell.addCartBlock).click();
          await Promise.all([
            upsell.waitCartItemVisible(),
            upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
          ]);
          break;
        }
        case "add": {
          const cartToken = await upsell.page.evaluate(() => window.localStorage.getItem("cartToken"));
          await api.put(`https://${cConf.domain}/api/checkout/next/cart.json?cart_token=${cartToken}`, {
            data: {
              cartItem: { variant_id: cConf[`variant_id_${step.variant}`], qty: 1, properties: [] },
              from: "add-to-cart",
            },
          });
          await upsell.page.reload();
          await upsell.waitCartItemVisible();
          break;
        }
        case "cart": {
          for (let index = 0; index < step.cart_actions.length; index++) {
            const isCartPage = step.cart_actions[index] === "page";
            const selector = isCartPage ? upsell.outsideCartDrawer : upsell.insideCartDrawer;
            if (!isCartPage) {
              await upsell.onClickCartIcon();
            }

            if (typeof step.expected === "number") {
              const totalCart = await upsell.genLoc(`${selector} ${upsell.cartItemsBlock} ${upsell.cartItem}`).count();
              for (let j = 1; j <= totalCart; j++) {
                await expect(upsell.genLoc(upsell.getSelectorHeadingInCart(j))).toHaveCount(0);
              }
            } else {
              await expect(
                upsell.genLoc(`${selector} ${upsell.cartItemsBlock} ${upsell.cartItem} + ${upsell.incartBlock}`),
              ).toHaveCount(1);
              await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(3, upsell.outsideCartDrawer))).toHaveText(
                step.expected,
              );
            }

            if (!isCartPage) {
              await upsell.genLoc(upsell.cartDrawerOverlay).click();
            }
          }
          break;
        }
        case "add_from_in_cart": {
          await upsell.genLoc(upsell.getSelectorAddCartInCart(3, upsell.outsideCartDrawer)).click();
          for (let j = 1; j <= step.expected; j++) {
            await expect(
              upsell.genLoc(upsell.getSelectorVariantQuickview(step.expected[j].option, step.expected[j].variant)),
            ).toHaveClass(/is-active/);
          }
          break;
        }
        case "add_from_quickview": {
          if (step.sub_action) {
            await upsell.onClickVariantQuickview(3, 2);
          }
          await upsell.onClickAddCartQuickview();
          await upsell.waitResponseWithUrl("/api/offers/cart-recommend.json");
          if (typeof step.expected === "number") {
            const totalCart = await upsell
              .genLoc(`${upsell.outsideCartDrawer} ${upsell.cartItemsBlock} ${upsell.cartItem}`)
              .count();
            for (let j = 1; j <= totalCart; j++) {
              await expect(upsell.genLoc(upsell.getSelectorHeadingInCart(j))).toHaveCount(step.expected);
            }
          } else {
            await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(3, upsell.outsideCartDrawer))).toHaveText(
              step.expected,
            );
          }
        }
      }
    });
  }
}

test.describe("InCart Offer @TS_SB_WEB_BUILDER_LBA_ICB", () => {
  test.slow();

  let upsell: UpSell;
  let upsellSF: SFUpSellAPI;
  let apps: CrossSellAPI;

  test.beforeEach(async ({ page, conf, cConf, authRequest, api }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    upsell = new UpSell(page, conf.suiteConf.domain);
    upsellSF = new SFUpSellAPI(conf.suiteConf.domain, api);
    apps = new CrossSellAPI(conf.suiteConf.domain);
    if (cConf.active_offer && cConf.offer_ids) {
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: conf.suiteConf.domain,
        offer_ids: cConf.offer_ids,
        shop_id: conf.suiteConf.shop_id,
        status: true,
      });
      await upsellSF.requestPurgeCacheInCart();
    }
    await upsell.goto();
    await upsell.waitResponseWithUrl("/apps/assets/locales/en.json");
  });
  test.afterEach(async ({ authRequest, conf, cConf }) => {
    await test.step("After condition", async () => {
      if (cConf.offer_ids) {
        await apps.requestOnOffOffer({
          api: authRequest,
          domain: conf.suiteConf.domain,
          offer_ids: cConf.offer_ids,
          shop_id: conf.suiteConf.shop_id,
          status: false,
        });
      }
    });
  });

  test(`@SB_WEB_BUILDER_LBA_ICB_01 In-cart offer_Check UI của In-cart offer ở Cart page và Cart drawer`, async ({
    cConf,
  }) => {
    await test.step(`Ở ngoài SF, add target product`, async () => {
      await upsell.genLoc(upsell.addCartBlock).click();
    });
    for (let i = 0; i < 2; i++) {
      const title = i === 0 ? "page" : "drawer";
      await test.step(`Mở Cart ${title}, check hiển thị In-cart offer`, async () => {
        let selector = "";
        if (i === 0) {
          selector = upsell.outsideCartDrawer;
          await Promise.all([
            upsell.waitCartItemVisible(),
            upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
          ]);
        } else {
          selector = upsell.insideCartDrawer;
          await upsell.onClickCartIcon();
        }
        await expect(upsell.genLoc(upsell.getSelectorHeadingInCart(1, selector))).toHaveText(cConf.expected.heading);
        await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(1, selector))).toHaveText(
          cConf.expected.product_title,
        );
        await expect(upsell.genLoc(upsell.getSelectorPrdPriceInCart(1, false, selector))).toHaveText(
          cConf.expected.product_price,
        );
        await expect(upsell.genLoc(upsell.getSelectorAddCartInCart(1, selector))).toHaveClass(
          new RegExp(cConf.expected.button_class),
        );
      });
    }
  });

  test(`@SB_WEB_BUILDER_LBA_ICB_02 In-cart offer_Check hiển thị offer's message của In-cart offer`, async ({
    authRequest,
    conf,
    cConf,
  }) => {
    for (let i = 0; i < cConf.offer_ids.length; i++) {
      await upsell.requestUpdateOffer({
        api: authRequest,
        domain: conf.suiteConf.domain,
        shop_id: conf.suiteConf.shop_id,
        id: cConf.offer_ids[i],
        data: { enable_discount: true },
      });
      await apps.requestOnOffOffer({
        api: authRequest,
        domain: conf.suiteConf.domain,
        offer_ids: [cConf.offer_ids[i]],
        shop_id: conf.suiteConf.shop_id,
        status: true,
      });
      await upsellSF.requestPurgeCacheInCart();

      if (i === 0) {
        await test.step(`Mở store, add product bất kì`, async () => {
          await upsell.genLoc(upsell.addCartBlock).click();
        });
      } else {
        await upsell.page.reload();
      }

      for (let j = 0; j < cConf.actions.length; j++) {
        const action = cConf.actions[j];
        await test.step(`Mở Cart ${action.title}`, async () => {
          let selector = "";
          if (action.title === "page") {
            selector = upsell.outsideCartDrawer;
            await Promise.all([
              upsell.waitCartItemVisible(),
              upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
            ]);
          } else {
            selector = upsell.insideCartDrawer;
            await upsell.onClickCartIcon();
          }

          await expect(upsell.genLoc(upsell.getSelectorHeadingInCart(1, selector))).toHaveText(
            cConf.expected[i][`heading_${action.heading}`],
          );
          await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(1, selector))).toHaveText(
            cConf.expected[i].product_title,
          );
        });

        if (action.off_discount) {
          await test.step(`Turn off discount offer ${i + 1}`, async () => {
            await upsell.requestUpdateOffer({
              api: authRequest,
              domain: conf.suiteConf.domain,
              shop_id: conf.suiteConf.shop_id,
              id: cConf.offer_ids[i],
              data: { enable_discount: false },
            });
            await upsellSF.requestPurgeCacheInCart();

            await upsell.page.reload();
          });
        }
      }
    }
  });

  test(`@SB_WEB_BUILDER_LBA_ICB_03 In-cart offer_Check show offer đối với trường hợp Target product = All products và Recommend product = Specific products`, async ({
    cConf,
  }) => {
    for (let i = 0; i < cConf.data.length; i++) {
      const data = cConf.data[i];
      if (!data.title) {
        await test.step(`Ngoài SF, add product bất kì`, async () => {
          await upsell.genLoc(upsell.addCartBlock).click();
        });
        await test.step(`Mở Cart page`, async () => {
          await Promise.all([
            upsell.waitCartItemVisible(),
            upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
          ]);
          await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(1, upsell.outsideCartDrawer))).toHaveText(
            data.expected,
          );
        });
      } else {
        await test.step(`Add ${data.title}`, async () => {
          await upsell.genLoc(upsell.getSelectorAddCartInCart(1, upsell.outsideCartDrawer)).click();
          await upsell.onClickAddCartQuickview();
          await upsell.waitResponseWithUrl("/api/offers/cart-recommend.json");
          if (typeof data.expected === "number") {
            const totalCart = await upsell
              .genLoc(`${upsell.outsideCartDrawer} ${upsell.cartItemsBlock} ${upsell.cartItem}`)
              .count();
            for (let j = 1; j <= totalCart; j++) {
              await expect(upsell.genLoc(upsell.getSelectorHeadingInCart(j))).toHaveCount(data.expected);
            }
          } else {
            await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(1, upsell.outsideCartDrawer))).toHaveText(
              data.expected,
            );
          }
        });
      }
      await test.step(`Mở Cart drawer`, async () => {
        await upsell.onClickCartIcon();
        if (typeof data.expected === "number") {
          const totalCart = await upsell
            .genLoc(`${upsell.insideCartDrawer} ${upsell.cartItemsBlock} ${upsell.cartItem}`)
            .count();
          for (let i = 1; i <= totalCart; i++) {
            await expect(upsell.genLoc(upsell.getSelectorHeadingInCart(i))).toHaveCount(data.expected);
          }
        } else {
          await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(1, upsell.insideCartDrawer))).toHaveText(
            data.expected,
          );
        }
        await upsell.genLoc(upsell.cartDrawerOverlay).click();
      });
    }
  });

  test(`@SB_WEB_BUILDER_LBA_ICB_04 In-cart offer_Check show offer đối với trường hợp Target product = Specific products và Recommend product = Specific products`, async ({
    cConf,
  }) => {
    await verifyHighLowSuggest(upsell, cConf);
  });

  test(`@SB_WEB_BUILDER_LBA_ICB_05 In-cart offer_Check show offer đối với trường hợp Target product = Specific collections và Recommend product = Specific products`, async ({
    cConf,
  }) => {
    await verifyHighLowSuggest(upsell, cConf);
  });

  test(`@SB_WEB_BUILDER_LBA_ICB_06 In-cart offer_Check show offer đối với trường hợp Target product = All products và Recommend product = Specific by base category`, async ({
    authRequest,
    conf,
    cConf,
  }) => {
    await verifyProductCampaign(upsell, authRequest, Object.assign({}, cConf, { domain: conf.suiteConf.domain }));
  });

  test(`@SB_WEB_BUILDER_LBA_ICB_07 In-cart offer_Check show offer đối với trường hợp Target product = Specific products và Recommend product = Specific by base category`, async ({
    authRequest,
    cConf,
    conf,
  }) => {
    await verifyProductCampaign(upsell, authRequest, Object.assign({}, cConf, { domain: conf.suiteConf.domain }));
  });

  test(`@SB_WEB_BUILDER_LBA_ICB_08 In-cart offer_Check show offer đối với trường hợp Target product = Specific collections và Recommend product = Specific by base category`, async ({
    authRequest,
    cConf,
    conf,
  }) => {
    await verifyProductCampaign(upsell, authRequest, Object.assign({}, cConf, { domain: conf.suiteConf.domain }));
  });

  test(`@SB_WEB_BUILDER_LBA_ICB_09 In-cart offer_Check show offer đối với trường hợp trùng target product`, async ({
    cConf,
  }) => {
    await test.step(`Ngoài SF, add target product = product 1`, async () => {
      await upsell.genLoc(upsell.addCartBlock).click();
    });
    await test.step(`Mở Cart page/ Cart drawer`, async () => {
      for (let i = 0; i < cConf.actions.length; i++) {
        const action = cConf.actions[i];
        let selector = "";
        if (action === "page") {
          selector = upsell.outsideCartDrawer;
          await Promise.all([
            upsell.waitCartItemVisible(),
            upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
          ]);
        } else {
          selector = upsell.insideCartDrawer;
          await upsell.onClickCartIcon();
        }

        await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(1, selector))).toHaveText(
          cConf.expected.product_title_offer_2,
        );
        if (action === "drawer") {
          await upsell.genLoc(upsell.cartDrawerOverlay).click();
        }
      }
    });
    await test.step(`Add product 3`, async () => {
      await upsell.genLoc(upsell.getSelectorAddCartInCart(1, upsell.outsideCartDrawer)).click();
      await upsell.onClickAddCartQuickview();
      await upsell.waitResponseWithUrl("/api/offers/cart-recommend.json");
      await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(1, upsell.outsideCartDrawer))).toHaveText(
        cConf.expected.product_title_offer_1,
      );
    });
  });

  test(`@SB_WEB_BUILDER_LBA_ICB_10 In-cart offer_Check show recommend product đối với product đặc biệt`, async ({
    cConf,
  }) => {
    await test.step(`Ngoài SF, add target product = product 0`, async () => {
      await upsell.genLoc(upsell.addCartBlock).click();
    });
    await test.step(`Mở Cart page/ Cart drawer`, async () => {
      for (let i = 0; i < cConf.actions.length; i++) {
        const action = cConf.actions[i];
        let selector = "";
        if (action === "page") {
          selector = upsell.outsideCartDrawer;
          await Promise.all([
            upsell.waitCartItemVisible(),
            upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
          ]);
        } else {
          selector = upsell.insideCartDrawer;
          await upsell.onClickCartIcon();
        }

        await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(1, selector))).toHaveText(
          cConf.expected.product_title_unlisting,
        );
        if (action === "drawer") {
          await upsell.genLoc(upsell.cartDrawerOverlay).click();
        }
      }
    });
    await test.step(`Add product 1`, async () => {
      await upsell.genLoc(upsell.getSelectorAddCartInCart(1, upsell.outsideCartDrawer)).click();
      await upsell.onClickAddCartQuickview();
      await upsell.waitResponseWithUrl("/api/offers/cart-recommend.json");
      await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(1, upsell.outsideCartDrawer))).toHaveText(
        cConf.expected.product_title_custom_option_required,
      );
      await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(2, upsell.outsideCartDrawer))).toHaveText(
        cConf.expected.product_title_custom_option_optional,
      );
    });
    await test.step(`Add product 4`, async () => {
      await upsell.genLoc(upsell.getSelectorAddCartInCart(1, upsell.outsideCartDrawer)).click();
      await upsell.onClickAddCartQuickview();
      await expect(upsell.genLoc(upsell.quickViewTextField)).toHaveClass(/input-error/);
      await expect(upsell.genLoc(upsell.quickViewMsgCustomOption)).toHaveText(cConf.expected.msg_invalid);
    });
    for (let i = 0; i < cConf.custom_opions.length; i++) {
      const isRequired = cConf.custom_opions[i] === "required";
      const title = isRequired ? "Text field hợp lệ, add product" : "Add product 5";
      await upsell.page.pause();
      await test.step(title, async () => {
        if (isRequired) {
          await upsell.genLoc(upsell.quickViewTextField).fill("text");
        } else {
          await upsell.genLoc(upsell.getSelectorAddCartInCart(1, upsell.outsideCartDrawer)).click();
        }

        const [, requestAPI] = await Promise.all([
          upsell.onClickAddCartQuickview(),
          upsell.page.waitForRequest(
            request => request.url().includes("/api/checkout/next/cart.json") && request.method() === HttpMethods.Put,
          ),
        ]);
        const responseAPI = await (await requestAPI.response()).json();
        expect(responseAPI.result.product_title).toEqual(
          cConf.expected[`product_title_custom_option_${cConf.custom_opions[i]}`],
        );
      });
    }
  });

  test(`@SB_WEB_BUILDER_LBA_ICB_11 Check tính offer discount của In-cart offer`, async ({
    authRequest,
    conf,
    cConf,
  }) => {
    await upsell.requestUpdateOffer({
      api: authRequest,
      domain: conf.suiteConf.domain,
      shop_id: conf.suiteConf.shop_id,
      id: cConf.offer_ids[0],
      data: { enable_discount: true },
    });
    await upsellSF.requestPurgeCacheInCart();
    await test.step(`Ngoài SF, add target product = product 1`, async () => {
      await upsell.genLoc(upsell.addCartBlock).click();
      await Promise.all([upsell.waitCartItemVisible(), upsell.waitResponseWithUrl("/api/offers/cart-recommend.json")]);
      await expect(upsell.genLoc(upsell.getSelectorPrdTitleInCart(1, upsell.outsideCartDrawer))).toHaveText(
        cConf.expected.product_title,
      );
    });
    for (let i = 0; i < cConf.steps.length; i++) {
      const step = cConf.steps[i];
      await test.step(step.title, async () => {
        switch (step.action) {
          case "add": {
            await upsell.genLoc(upsell.getSelectorAddCartInCart(1, upsell.outsideCartDrawer)).click();
            await upsell.onClickAddCartQuickview();
            await upsell.waitResponseWithUrl("/api/offers/cart-recommend.json");
            break;
          }
          case "on":
          case "off": {
            await upsell.requestUpdateOffer({
              api: authRequest,
              domain: conf.suiteConf.domain,
              shop_id: conf.suiteConf.shop_id,
              id: cConf.offer_ids[0],
              data: { enable_discount: step.action === "on" },
            });
            await upsellSF.requestPurgeCacheInCart();
            const cartToken = await upsell.page.evaluate(() => window.localStorage.getItem("cartToken"));
            await expect(async () => {
              const response = await authRequest.get(
                `https://${conf.suiteConf.domain}/api/offers/discount.json?cart_token=${cartToken}`,
              );
              const json = await response.json();
              expect(json).toMatchObject({ has_discount: step.action === "on" });
            }).toPass({ timeout: 60000 });
            await upsell.page.reload();
            await Promise.all([
              upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
              upsell.waitResponseWithUrl("/api/offers/discount.json"),
            ]);
            break;
          }
          case "quantity": {
            await upsell.onClickQtyInCart(2, "2", upsell.outsideCartDrawer);
            await upsell.genLoc(`${upsell.outsideCartDrawer} ${upsell.cartTotalPrice}`).click();
            await upsell.waitResponseWithUrl("/api/offers/discount.json");
            break;
          }
          case "delete": {
            await upsell.onClickQtyInCart(1, "0", upsell.outsideCartDrawer);
            await Promise.all([
              await upsell.genLoc(`${upsell.outsideCartDrawer} ${upsell.cartTotalPrice}`).click(),
              upsell.waitResponseWithUrl("/api/offers/discount.json"),
            ]);
            break;
          }
        }
        if (step.verify_discount) {
          await expect(upsell.genLoc(upsell.cartAlert)).toHaveText(cConf.expected.cart_alert);
          await expect(upsell.genLoc(`${upsell.outsideCartDrawer} ${upsell.discountPrice}`)).toHaveText(
            cConf.expected.discount_price,
          );
        } else {
          await expect(upsell.genLoc(upsell.cartAlert)).toBeHidden();
          await expect(upsell.genLoc(`${upsell.outsideCartDrawer} ${upsell.discountPrice}`)).toBeHidden();
        }
      });
    }
  });

  test(`@SB_WEB_BUILDER_LBA_ICB_12 Check tính discount In-cart offer khi có nhiều offer`, async ({
    authRequest,
    conf,
    cConf,
  }) => {
    await test.step(`Add lần lượt target product và recommend product vào cart`, async () => {
      await upsell.requestUpdateOffer({
        api: authRequest,
        domain: conf.suiteConf.domain,
        shop_id: conf.suiteConf.shop_id,
        id: cConf.offer_ids[0],
        data: { enable_discount: true },
      });
      await upsellSF.requestPurgeCacheInCart();
      await upsell.genLoc(upsell.addCartBlock).click();
      await upsell.waitCartItemVisible();
      const cartToken = await upsell.page.evaluate(() => window.localStorage.getItem("cartToken"));
      await authRequest.put(`https://${conf.suiteConf.domain}/api/checkout/next/cart.json?cart_token=${cartToken}`, {
        data: { cartItem: { variant_id: cConf.variant_id, qty: 1, properties: [] }, from: "add-to-cart" },
      });
      await upsell.page.reload();
      await upsell.waitCartItemVisible();
      for (let i = 1; i <= 2; i++) {
        await upsell.genLoc(upsell.getSelectorAddCartInCart(i, upsell.outsideCartDrawer)).click();
        await upsell.onClickAddCartQuickview();
        await Promise.all([
          upsell.waitResponseWithUrl("/api/checkout/next/cart.json"),
          upsell.waitResponseWithUrl("/api/offers/cart-recommend.json"),
        ]);
      }
    });
    await test.step(`Check hiển thị discount của offer`, async () => {
      await expect(upsell.genLoc(upsell.cartAlert)).toHaveText(cConf.expected.cart_alert);
      await expect(upsell.genLoc(`${upsell.outsideCartDrawer} ${upsell.discountPrice}`)).toHaveText(
        cConf.expected.discount_price,
      );
    });
  });
});
