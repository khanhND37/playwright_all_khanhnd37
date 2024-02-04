import { expect } from "@core/fixtures";
import { snapshotDir, verifyRedirectUrl, waitSelector } from "@core/utils/theme";
import { test } from "@fixtures/theme";
import { SFHome } from "@pages/storefront/homepage";
import type { ShopTheme, ThemeSection } from "@types";
import { loadData } from "@core/conf/conf";
import { Page } from "@playwright/test";

let shopTheme: ShopTheme;
test.beforeEach(({}, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
});

test.beforeEach(async ({ theme }) => {
  await test.step("Create theme by API", async () => {
    const res = await theme.create(3);
    shopTheme = await theme.publish(res.id);
  });

  await test.step("Remove shop theme not active", async () => {
    const res = await theme.list();
    const shopThemeId = res.find(shopTheme => shopTheme.active !== true);
    if (shopThemeId) {
      await theme.delete(shopThemeId.id);
    }
  });
});

let typePage: Page;
test.describe("Verify Feature product section in Storefront", () => {
  const confSettings = loadData(__dirname, "CHANGE_SETTINGS");
  for (let i = 0; i < confSettings.caseConf.data.length; i++) {
    const featureProduct = confSettings.caseConf.data[i];

    test(`@${featureProduct.case_id} ${featureProduct.description}`, async ({
      page,
      pageMobile,
      theme,
      snapshotFixture,
    }) => {
      if (featureProduct.expect.mobile) {
        typePage = pageMobile;
      } else typePage = page;

      const domain = confSettings.suiteConf.domain;
      const homePage = new SFHome(typePage, domain);

      if (!shopTheme) {
        const res = await theme.getPublishedTheme();
        shopTheme = await theme.single(res.id);
      }

      await test.step("Setting theme editor", async () => {
        shopTheme = await theme.addSection({
          addSection: featureProduct.input as unknown as Record<string, ThemeSection>,
          settingsData: shopTheme.settings_data,
          shopThemeId: shopTheme.id,
        });
      });

      await test.step("Open shop SF, check display Featured product", async () => {
        await homePage.gotoHomePage();
        if (featureProduct.expect.description_selector) {
          await typePage.locator(featureProduct.expect.description_selector).first().scrollIntoViewIfNeeded();
        }

        if (featureProduct.expect.name_snapshot) {
          await typePage.locator("[type='footer']").scrollIntoViewIfNeeded();
          if (featureProduct.expect.wait_selector) {
            await waitSelector(typePage, featureProduct.expect.wait_selector);
          }
          await typePage
            .locator("[type='featured-product']")
            .evaluate(ele => ele.scrollIntoView({ behavior: "instant", inline: "start" }));
          await snapshotFixture.verifyWithAutoRetry({
            page: typePage,
            snapshotName: featureProduct.expect.name_snapshot,
            selector: "[type='featured-product']",
            sizeCheck: true,
          });
        }

        if (featureProduct.expect.validate_customoption) {
          await typePage.waitForSelector("//span[normalize-space()='Add to cart']");
          await typePage.locator("//span[normalize-space()='Add to cart']").click();
          await expect(typePage.locator('.product-custom-option [msg-invalid="true"]')).toHaveText(
            "Please finish this field",
          );
          await typePage.locator(".product-custom-option input").fill("abc");
          await typePage.locator("//span[normalize-space()='Add to cart']").click();
          await typePage.waitForSelector('.cart-drawer-container h3:has-text("Your shopping cart")');
          await expect(typePage.locator(".product-cart__property")).toHaveText(
            `${featureProduct.expect.custom_option}`,
          );
        }

        if (featureProduct.expect.cart_slide) {
          await typePage.locator("//span[normalize-space()='Add to cart']").click();
          await typePage.waitForSelector('.cart-drawer-container h3:has-text("Your shopping cart")');
          await expect(typePage.locator(".product-cart__options")).toHaveText(`${featureProduct.expect.cart_slide}`);
        }

        if (featureProduct.expect.redirect_link) {
          await verifyRedirectUrl({
            page: typePage,
            selector: featureProduct.expect.selector,
            redirectUrl: featureProduct.expect.redirect_link,
            waitForElement: featureProduct.expect.wait_element,
          });
        }

        if (featureProduct.expect.expand_block) {
          if (featureProduct.being_collapse_block) {
            await typePage.waitForSelector(".triangle-bottom");
            await typePage.waitForSelector(featureProduct.being_collapse_block);
            await typePage.locator(featureProduct.being_collapse_block).click();
          }
          await typePage.waitForSelector(".triangle-top");
          await expect(typePage.locator(".triangle-top")).toHaveCount(1);
          await expect(typePage.locator(`${featureProduct.expect.expand_block}`)).toHaveText(
            `${featureProduct.page_content}`,
          );
        }

        if (featureProduct.expect.next_page_tab) {
          await typePage.locator(".tabs-nav li >> nth=1").click();
          await expect(typePage.locator(".tab-content .product__description-html >> nth=2")).toHaveText(
            featureProduct.expect.next_page_tab,
          );
        }

        if (featureProduct.expect.change_variant) {
          await typePage
            .locator(".product__variant-button button >> nth=1") //click on 2nd variant (size M)
            .click();
          await typePage.waitForSelector('.media-gallery-carousel--loaded div [data-loaded="true"]');
          await typePage.waitForSelector('.media-gallery-carousel--loaded li [data-loaded="true"]');
          await snapshotFixture.verifyWithAutoRetry({
            page: typePage,
            snapshotName: featureProduct.expect.change_variant,
            selector: '[type="featured-product"]',
            sizeCheck: true,
          });
        }

        if (featureProduct.expect.change_step2_variant) {
          await typePage
            .locator(
              ".product__image-gr-wrap >> nth=1", //click vao variant thu 2 (szM)
            )
            .click();
          await typePage.waitForSelector('.media-gallery-carousel--loaded div [data-loaded="true"]');
          await typePage.waitForSelector('.media-gallery-carousel--loaded li [data-loaded="true"]');
          await snapshotFixture.verifyWithAutoRetry({
            page: typePage,
            snapshotName: featureProduct.expect.change_step2_variant,
            selector: '[type="featured-product"]',
            sizeCheck: true,
          });
        }

        if (featureProduct.expect.click_variant_image) {
          await typePage.waitForSelector('.media-gallery-carousel--loaded li [data-loaded="true"] >> nth=2');
          await typePage.locator(".media-gallery-carousel__thumbs li >> nth=2").click();
          await expect(typePage.locator(".product__variant-label label >> nth=0")).toHaveText("M");
          await expect(typePage.locator(".product__variant-label label >> nth=1")).toHaveText("Red");
        }
      });
    });
  }
});
