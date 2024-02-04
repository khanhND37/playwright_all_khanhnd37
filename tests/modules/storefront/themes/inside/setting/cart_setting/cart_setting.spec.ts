import { test } from "@fixtures/theme";
import type { ShopTheme, ThemeSettingValue } from "@types";
import { SFHome } from "@sf_pages/homepage";
import { expect } from "@core/fixtures";
import { verifyRedirectUrl, snapshotDir } from "@core/utils/theme";
import type { Page } from "@playwright/test";
import { loadData } from "@core/conf/conf";

let shopTheme: ShopTheme;

test.beforeAll(async ({ theme }) => {
  await test.step("Get shop theme id", async () => {
    if (!shopTheme) {
      const res = await theme.getPublishedTheme();
      shopTheme = await theme.single(res.id);
    }
  });
});

test.beforeEach(({}, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
});

let typePage: Page;
const cleanCartDrawer = async (typePage: Page) => {
  await typePage.locator("[data-section='header'] .mini-cart").click();
  await typePage.locator(".cart-drawer-container .product-cart__remove").click();
  await typePage.locator(".cart-drawer-icon-close").click();
  await expect(typePage.locator(".cart-drawer")).toBeHidden();
};

test.describe("Verify cart setting on SF @TS_INS_SF_CART_SETTING", async () => {
  const conf = loadData(__dirname, "CART_SETTING");
  for (const cartSetting of conf.caseConf.data) {
    test(`@${cartSetting.case_id} ${cartSetting.description}`, async ({ page, pageMobile, theme }) => {
      typePage = page;
      if (cartSetting.expect.mobile) {
        typePage = pageMobile;
      }

      const domain = conf.suiteConf.domain;
      const homePage = new SFHome(typePage, domain);

      if (cartSetting.input) {
        await test.step("Setting theme setting", async () => {
          for (const setting of cartSetting.input) {
            shopTheme = await theme.updateSection({
              updateSection: setting as unknown as Record<string, Record<string, ThemeSettingValue>>,
              settingsData: shopTheme.settings_data,
              shopThemeId: shopTheme.id,
            });
          }
        });
      }

      await test.step("Open SF, check display Cart setting", async () => {
        if (cartSetting.expect.product_page) {
          await homePage.gotoProduct(cartSetting.expect.product_page.product_handle);
          await typePage.waitForLoadState("networkidle");

          if (cartSetting.open_cartdrawer) {
            await typePage.locator(".product__form span:has-text('Add to cart')").click();
            if (cartSetting.expect.product_page.sticky_button) {
              await typePage.reload({ waitUntil: "networkidle" });
              await typePage.locator(".site-footer__below").scrollIntoViewIfNeeded();
              await typePage.locator(cartSetting.expect.product_page.sticky_button).click();
            }
            if (cartSetting.expect.product_page.icon_cart_draw) {
              await typePage.locator(cartSetting.expect.product_page.icon_cart_draw).click();
            }
            await typePage
              .locator(".product-cart__quantity .button-quantity__layout-vertical__increase >> nth=0")
              .click();
            await expect(typePage.locator(".product-cart__name a")).toHaveText(
              cartSetting.expect.product_page.product_name,
            );
          }

          if (cartSetting.expect.product_page.redirect_link) {
            await verifyRedirectUrl({
              page: typePage,
              selector: cartSetting.expect.product_page.redirect_link.redirect_selector,
              redirectUrl: cartSetting.expect.product_page.redirect_link.redirect_url,
              waitForElement: cartSetting.expect.product_page.redirect_link.wait_element,
            });
            if (cartSetting.expect.product_page.product_price) {
              await expect(
                typePage.locator(`${cartSetting.expect.product_page.redirect_link.wait_element}`),
              ).toHaveText(cartSetting.expect.product_page.product_price);
            } else {
              await expect(
                typePage.locator(`${cartSetting.expect.product_page.redirect_link.wait_element}`),
              ).toHaveText(cartSetting.expect.product_page.product_name);
            }
          }
        }

        if (cartSetting.expect.home_page) {
          if (cartSetting.expect.home_page.featured_product) {
            await homePage.gotoHomePage();
            await typePage.waitForResponse(/theme.css/);
            await cleanCartDrawer(typePage);
            if (cartSetting.expect.home_page.featured_product.redirect_link) {
              await verifyRedirectUrl({
                page: typePage,
                selector: cartSetting.expect.home_page.featured_product.redirect_link.redirect_selector,
                redirectUrl: cartSetting.expect.home_page.featured_product.redirect_link.redirect_url,
                waitForElement: cartSetting.expect.home_page.featured_product.redirect_link.wait_element,
              });
            }
            //verify product on cart drawer
            if (cartSetting.open_cartdrawer) {
              await typePage.locator(".product__form .btn-add-cart").click();
              const waitBtn = await page.waitForSelector(".product__form span:has-text('Add to cart')");
              await waitBtn.waitForElementState("stable");
              if (cartSetting.expect.home_page.featured_product.icon_cart_draw) {
                await typePage.locator(cartSetting.icon_cart_draw).click();
              }
              await expect(typePage.locator(".product-cart__name a")).toHaveText(
                cartSetting.expect.home_page.featured_product.product_name,
              );
            }
          }

          if (cartSetting.expect.home_page.featured_collection) {
            await homePage.gotoHomePage();
            await typePage.waitForResponse(/theme.css/);
            await cleanCartDrawer(typePage);
            await typePage
              .locator(".featured-collection")
              .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "center" }));
            await typePage
              .locator(
                `.collection-product-wrap` +
                  `:has(span[title='${cartSetting.expect.home_page.featured_collection.product_name}'])`,
              )
              .hover();
            if (cartSetting.expect.home_page.featured_collection.redirect_link) {
              await verifyRedirectUrl({
                page: typePage,
                selector: cartSetting.expect.home_page.featured_collection.redirect_link.redirect_selector,
                redirectUrl: cartSetting.expect.home_page.featured_collection.redirect_link.redirect_url,
                waitForElement: cartSetting.expect.home_page.featured_collection.redirect_link.wait_element,
              });
            }
            //verify product on cart drawer
            if (cartSetting.open_cartdrawer) {
              await typePage
                .locator(".featured-collection")
                .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "center" }));
              await typePage.locator(".featured-collection .collection-product-wrap >> nth=0").hover();
              await typePage.locator(".featured-collection span:has-text('Add to cart') >> nth=0").click();
              if (cartSetting.expect.home_page.featured_collection.icon_cart_draw) {
                await typePage.locator(cartSetting.icon_cart_draw).click();
              }
              await expect(typePage.locator(".product-cart__name a")).toHaveText(
                cartSetting.expect.home_page.featured_collection.product_name,
              );
            }
          }

          if (cartSetting.expect.home_page.app_widget) {
            await homePage.gotoHomePage();
            await typePage.waitForResponse(/theme.css/);
            await cleanCartDrawer(typePage);
            const productName = await typePage
              .locator(`${cartSetting.expect.home_page.app_widget.type_app} .upsell-color-product-name >> nth=1`)
              .innerText();
            await typePage.locator(".upsell-widget-product >> nth=1").hover();
            await typePage
              .locator(`${cartSetting.expect.home_page.app_widget.type_app} span:has-text('ADD TO CART') >> nth=1`)
              .click();
            //verify product on cart drawer
            if (cartSetting.expect.home_page.app_widget.icon_cart_draw) {
              await typePage.locator(cartSetting.icon_cart_draw).click();
            }
            await expect(typePage.locator(".product-cart__name a")).toHaveText(productName);
          }
        }

        if (cartSetting.expect.cart_page) {
          await homePage.gotoCart();
          if (cartSetting.expect.cart_page.cart_empty_selector) {
            await expect(typePage.locator(cartSetting.expect.cart_page.cart_empty_selector)).toBeVisible();
            //verify cart draw
            await typePage.locator("[data-section='header'] .mini-cart").click();
            await expect(typePage.locator(cartSetting.expect.cart_page.cart_draw_empty_selector)).toBeVisible();
          }

          if (cartSetting.expect.cart_page.cart_goal_selector) {
            for (const setting of cartSetting.input) {
              if (setting.cart_goal) {
                if (setting.cart_goal.cart_goal_enable == true) {
                  await expect(typePage.locator(cartSetting.expect.cart_page.cart_goal_selector)).toHaveText(
                    setting.cart_goal.cart_goal_reach_message,
                  );
                  //verify cart draw
                  await typePage.locator(cartSetting.icon_cart_draw).click();
                  await expect(typePage.locator(cartSetting.expect.cart_page.cart_draw_goal_selector)).toHaveText(
                    setting.cart_goal.cart_goal_reach_message,
                  );
                } else {
                  await expect(typePage.locator(cartSetting.expect.cart_page.cart_goal_selector)).toBeHidden();
                  //verify cart draw
                  await typePage.locator(cartSetting.icon_cart_draw).click();
                  await expect(typePage.locator(cartSetting.expect.cart_page.cart_draw_goal_selector)).toBeHidden();
                }
              }
            }
          }
        }

        if (cartSetting.expect.gotocart_button) {
          await verifyRedirectUrl({
            page: typePage,
            selector: cartSetting.expect.gotocart_button.redirect_link.redirect_selector,
            redirectUrl: cartSetting.expect.gotocart_button.redirect_link.redirect_url,
            waitForElement: cartSetting.expect.gotocart_button.redirect_link.wait_element,
          });
          //verify trust badge image
          if (cartSetting.expect.gotocart_button.verify_image) {
            await expect(typePage.locator(".banner-trust img[data-srcset]")).toHaveAttribute(
              "data-srcset",
              new RegExp(cartSetting.expect.gotocart_button.verify_image),
            );
          }
        }
      });
    });
  }
});
