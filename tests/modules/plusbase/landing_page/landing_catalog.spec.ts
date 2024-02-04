import { test } from "@fixtures/theme";
import { expect, Page } from "@playwright/test";
import { verifyRedirectUrl } from "@utils/theme";
import { loadData } from "@core/conf/conf";

/**
 * Verify image load in carousel image
 * @param page
 * @param snapshotName
 * @param selectorImage
 * @param selectorSection
 */
const verifyCarouselWithSnapshot = async (
  page: Page,
  snapshotName: string,
  selectorImage: string,
  selectorSection: string,
) => {
  await page.locator(selectorImage).scrollIntoViewIfNeeded();
  const isThumbnailImage = await page.locator(selectorImage).count();
  if (isThumbnailImage > 0) {
    const img = page.locator(selectorImage);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await img.evaluate((image: any) => image.complete || new Promise(f => (image.onload = f)));
  }
  const imgInner = await page.waitForSelector(`${selectorSection} .VueCarousel-inner`);
  await imgInner.waitForElementState("stable");
  expect(await page.locator(selectorSection).screenshot()).toMatchSnapshot(snapshotName, {
    maxDiffPixelRatio: 0.05,
  });
};

/**
 * Search product in catalog
 * @param xpathSearch
 * @param nameProduct
 * @param page
 */
const searchProduct = async (xpathSearch: string, nameProduct: string, page: Page) => {
  await page.fill(xpathSearch, nameProduct);
  await page.locator("#all-categories").click();
  await expect(page.locator(`.catalog-products-view__products div>>text=${nameProduct}`)).toHaveCount(1);
  await page.locator(`.catalog-products-view__products div>>text=${nameProduct}`).click();
};

test.describe("Verify catalog landing page @TS_PL_CATALOG_LANDING", async () => {
  const caseName = "TC_PL_CATALOG_LANDING";
  const conf = loadData(__dirname, caseName);
  const textDescription = ".popup-catalog__content-left .product-catalog__description span >> nth=0";
  const imgDescription = ".popup-catalog__content-left .product-catalog__description img >> nth=0";
  const catalogShipping = ".plusbase-catalog .popup-catalog__shipping";
  const catalogImg = ".plusbase-catalog .popup-catalog__carousel";
  const catalogInfo = ".popup-catalog__content-right .popup-catalog__info";
  const catalogPrice = ".popup-catalog__content-right .popup-catalog__price";
  const iconNextCarousel = "[aria-label='Next page']";
  const iconPrevCarousel = "[aria-label='Previous page']";
  const imgCarouselActive = ".popup-catalog__carousel--main .VueCarousel-slide-active img";
  const thumnailFirst = ".popup-catalog__carousel--slide img >> nth=0";
  const thumnailCenter = ".popup-catalog__carousel--slide img >> nth=2";
  const thumnailActive = ".popup-catalog__carousel--thumb .VueCarousel-slide-active";

  test.beforeEach(({}, testInfo) => {
    testInfo.snapshotSuffix = "";
  });

  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const product = conf.caseConf.data[i];
    test(`${product.description} @${product.id}`, async ({ page, context, snapshotFixture }) => {
      const { carousel, description, variants, ships, buttons } = product.action;
      await test.step("Open landing catalog page", async () => {
        await page.goto(conf.suiteConf.domain);
        await page.waitForLoadState("networkidle");
        await page.locator("a:has-text('Catalog')").click();
      });

      await test.step("Open popup product detail", async () => {
        await searchProduct(".sb-filter__search input", product.action.name_product, page);
        await expect(page.locator(".popup-catalog__info--product-name")).toHaveText(product.action.name_product);
      });

      await test.step("Verify image product in popup product detail", async () => {
        let img;
        if (carousel) {
          // Wait image load finish => Screenshot image product
          const thumnail = carousel.icon_next ? thumnailCenter : thumnailFirst;
          img = page.locator(thumnail);
          await img.evaluate(image => image.complete || new Promise(f => (image.onload = f)));
          await snapshotFixture.verify({
            page: page,
            selector: catalogImg,
            snapshotName: carousel.name_snapshot,
          });

          // Click next thumbnail image
          if (carousel.icon_next) {
            await page.locator(iconNextCarousel).click();
            await page.locator(thumnailActive).click();
            await verifyCarouselWithSnapshot(page, carousel.icon_next.name_snapshot, imgCarouselActive, catalogImg);
          }

          // Click prev thumbnail image
          if (carousel.icon_prev) {
            await page.locator(iconPrevCarousel).click();
            await page.locator(thumnailCenter).click();
            await verifyCarouselWithSnapshot(page, carousel.icon_prev.name_snapshot, imgCarouselActive, catalogImg);
          }
        }

        //Verify description product
        if (description) {
          await expect(page.locator(textDescription)).toHaveCount(1);
          await page.locator(imgDescription).scrollIntoViewIfNeeded();
          await snapshotFixture.verify({
            page: page,
            selector: imgDescription,
            snapshotName: description.name_snapshot,
          });
        }

        //Verify catalog image, infor, price, shipping when change variant
        if (variants) {
          for (let index = 0; index < variants.length; index++) {
            const variant = variants[index];
            if (variant.select_variant) {
              for (let i = 0; i < variant.select_variant.length; i++) {
                let element = await page.waitForSelector(
                  `.popup-catalog__info .popup-catalog__info--variant-option-active >> nth = 0`,
                );
                await element.waitForElementState("stable");
                await page.locator(`.popup-catalog__info button>>text=${variant.select_variant[i].value}`).click();
                element = await page.waitForSelector(
                  `.popup-catalog__info .popup-catalog__info--variant-option-active >> nth = ${i}`,
                );
                await element.waitForElementState("stable");
              }
            }
            // Screenshot name + variant product after select variant
            await snapshotFixture.verify({
              page: page,
              selector: catalogInfo,
              snapshotName: variant.name_snapshot.info,
            });

            // Screenshot price product after select variant
            await snapshotFixture.verify({
              page: page,
              selector: catalogPrice,
              snapshotName: variant.name_snapshot.price,
            });

            // Screenshot shipping fee product after select variant
            await snapshotFixture.verify({
              page: page,
              selector: catalogShipping,
              snapshotName: variant.name_snapshot.shipping,
            });

            // Screenshot img product after select variant
            if (variant.name_snapshot.img) {
              await verifyCarouselWithSnapshot(page, variant.name_snapshot.img, imgCarouselActive, catalogImg);
            }
          }
        }

        //Verify ship fee when change address
        if (ships) {
          await page.locator(catalogShipping).scrollIntoViewIfNeeded();
          for (const ship of ships) {
            await page.selectOption(".popup-catalog__content-right .popup-catalog__shipping--select", {
              label: `${ship.value}`,
            });
            await snapshotFixture.verify({
              page: page,
              selector: catalogShipping,
              snapshotName: ship.name_snapshot,
            });
          }
        }

        //Verify click button start selling this product
        if (buttons) {
          await verifyRedirectUrl({
            page: page,
            selector: `.popup-catalog .popup-catalog__bottom a>>text=${buttons.name_label}`,
            context: context,
            redirectUrl: buttons.redirect,
          });
        }
      });
    });
  }
});
