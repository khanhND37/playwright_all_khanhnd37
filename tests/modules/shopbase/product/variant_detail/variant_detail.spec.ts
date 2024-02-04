import { test } from "@core/fixtures";
import { waitForImageLoaded } from "@utils/theme";
import { ProductPage } from "@pages/dashboard/products";
import { VariantDetailPage } from "@pages/dashboard/variant_detail";
import { expect } from "@playwright/test";
import { loadData } from "@core/conf/conf";
import { prepareFile } from "@helper/file";
import { SFProduct } from "@pages/storefront/product";

let quantityOfVariant: number;
let variant: VariantDetailPage;
let product: ProductPage;
test.describe("Check variant detail", async () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    await test.step(`Create product and edit variant`, async () => {
      product = new ProductPage(dashboard, conf.suiteConf.domain);
      await product.goToProductList();
      variant = new VariantDetailPage(dashboard, "");
      await product.addNewProductWithData(conf.suiteConf.product_info);
      await product.page.waitForSelector(product.xpathToastMessage);
      await product.page.waitForSelector(product.xpathToastMessage, { state: "hidden" });
      await product.addVariants(conf.suiteConf.product_variant);
      await product.page.waitForSelector(product.xpathToastMessage);
      await product.page.waitForSelector(product.xpathToastMessage, { state: "hidden" });
      quantityOfVariant = await product.countQuantityOfVariant();
      await product.clickEditVariant();
      await variant.page.waitForSelector(variant.variantOptions);
    });
  });

  test(`Kiểm tra hiển thị trong variant detail @SB_PRO_VAD_11`, async ({ dashboard, conf, snapshotFixture }) => {
    await test.step(`Verify hien thi cua variant detail`, async () => {
      await snapshotFixture.verify({
        page: dashboard,
        selector: variant.variantOptions,
        snapshotName: conf.caseConf.options_screen_screenshot,
      });
      await snapshotFixture.verify({
        page: dashboard,
        selector: variant.variantMedias,
        snapshotName: conf.caseConf.medias_screen_screenshot,
      });
      await snapshotFixture.verify({
        page: dashboard,
        selector: variant.variantInventory,
        snapshotName: conf.caseConf.inventory_screen_screenshot,
      });
      await snapshotFixture.verify({
        page: dashboard,
        selector: variant.variantPricing,
        snapshotName: conf.caseConf.pricing_screen_screenshot,
      });
      await snapshotFixture.verify({
        page: dashboard,
        selector: variant.variantShipping,
        snapshotName: conf.caseConf.shipping_screen_screenshot,
      });
      await snapshotFixture.verify({
        page: dashboard,
        selector: variant.variantTag,
        snapshotName: conf.caseConf.tag_screen_screenshot,
      });
      expect(await variant.page.locator(variant.variantsList).count()).toEqual(quantityOfVariant);
      await expect(variant.page.locator(variant.duplicateButton)).toBeVisible();
      await expect(variant.page.locator(variant.deleteVariantButton)).toBeVisible();
      await expect(variant.page.locator(variant.saveButton)).toBeVisible();
    });
  });

  test(`Kiểm tra edit variant thành công @SB_PRO_VAD_12`, async ({ context, conf }) => {
    await test.step(`Chỉnh sửa các thông tin ở các fields: Options, Medias, Pricing, Inventory, Shipping, Variant tag va Save change`, async () => {
      await variant.editVariantInfo(conf.caseConf.product_variant);
      await expect(variant.page.locator(variant.messageSuccess)).toBeVisible();
    });
    await test.step(`View variant ngoài storefront`, async () => {
      await variant.backToProduct();
      const [newPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductOnSF()]);
      await newPage.waitForSelector("(//span[contains(text(), 'Size:')]/parent::div)/following-sibling::div");
      await expect(
        newPage.locator("(//span[contains(text(), 'Size:')]/parent::div)/following-sibling::div"),
      ).toContainText(conf.caseConf.product_variant.value_size);
    });
  });

  test(`Kiểm tra duplicate variant @SB_PRO_VAD_21`, async ({ context, conf }) => {
    await test.step(`Click duplicate button`, async () => {
      await variant.page.click(variant.duplicateButton);
      await expect(variant.page.locator("//h1[normalize-space()='Duplicate a variant']")).toBeVisible();
    });
    await test.step(`Thay đổi value của Options then Click save button`, async () => {
      await variant.page.fill(
        "//label[text()='Size']/parent::div/following-sibling::div//input",
        conf.caseConf.new_size,
      );
      await variant.page.fill(
        "//label[text()='Color']/parent::div/following-sibling::div//input",
        conf.caseConf.new_color,
      );
      await variant.saveChanges();
      await expect(variant.page.locator("//div[text()='Variant has been added successfully!']")).toBeVisible();
      expect(await variant.page.locator(variant.variantsList).count()).toEqual(quantityOfVariant + 1);
    });
    await test.step(`View variant ngoài storefront`, async () => {
      await variant.backToProduct();
      const [newPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductOnSF()]);
      await newPage.waitForSelector("(//span[contains(text(), 'Size:')]/parent::div)/following-sibling::div");
      await expect(
        newPage.locator("(//span[contains(text(), 'Size:')]/parent::div)/following-sibling::div"),
      ).toContainText(conf.caseConf.new_size);
    });
  });

  test(`Kiểm tra delete variant @SB_PRO_VAD_22`, async () => {
    await test.step(`click button delete variant và xác nhận xóa variant`, async () => {
      await variant.page.click(variant.deleteVariantButton);
      await variant.clickOnBtnWithLabel("Delete");
      await expect(variant.page.locator("//div[text()='Your variant has been deleted!']")).toBeVisible();
      await product.waitUntilElementVisible("//h3[text()='Variant options']");
      expect(await product.countQuantityOfVariant()).toEqual(quantityOfVariant - 1);
    });
  });
});

test.describe("Verify variant tag @VAR_TAG", () => {
  const conf = loadData(__dirname, "VAR_TAG");
  test.setTimeout(conf.suiteConf.timeout);
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const tagCase = conf.caseConf.data[i];
    test(`@${tagCase.case_id} : ${tagCase.case_name}`, async ({ dashboard, conf }) => {
      await test.step("Create product and variants or edit variant", async () => {
        product = new ProductPage(dashboard, conf.suiteConf.domain);
        await product.goToProductList();
        if (tagCase.case_id == "SB_PRO_VAD_2") {
          await product.addNewProductWithData(tagCase.product_info);
          await product.addVariants(conf.suiteConf.product_variant);
          await product.clickEditVariant();
          variant = new VariantDetailPage(dashboard, "");
        } else {
          await product.searchProduct(tagCase.product_name);
          await product.chooseProduct(tagCase.product_name);
          await product.clickEditVariant();
          variant = new VariantDetailPage(dashboard, "");
        }
      });

      await test.step(`${tagCase.case_step}`, async () => {
        await variant.fillVariantTag(tagCase.variant_tag);
        await variant.saveChanges();
        await expect(variant.page.locator(variant.messageSuccess)).toBeVisible();
        await variant.backToProduct();
        const variantTagCol =
          (await product.page.locator("//th[normalize-space()='Variant Tag']//preceding-sibling::th").count()) + 1;
        const variantTagValue = `//table[@id='all-variants']//tr[descendant::span[contains(@class,'image__wrapper')]]/td[${variantTagCol}]`;
        for (let i = 1; i <= (await product.page.locator(variantTagValue).count()); i++) {
          if (tagCase.case_id == "SB_PRO_VAD_4") {
            expect((await product.page.locator(`(${variantTagValue})[${i}]`).textContent()).trim()).toBe(
              tagCase.variant_tag,
            );
          } else {
            if (i == 1) {
              expect((await product.page.locator(`(${variantTagValue})[${i}]`).textContent()).trim()).toBe(
                tagCase.variant_tag,
              );
            } else {
              expect((await product.page.locator(`(${variantTagValue})[${i}]`).textContent()).trim()).not.toBe(
                tagCase.variant_tag,
              );
            }
          }
        }
      });
    });
  }
});

test.describe("Verify media @VAR_MEDIA", () => {
  const conf = loadData(__dirname, "VAR_MEDIA");
  test.setTimeout(conf.suiteConf.timeout);
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const mediaCase = conf.caseConf.data[i];
    test(`@${mediaCase.case_id} : ${mediaCase.case_name}`, async ({ dashboard, conf, context }) => {
      product = new ProductPage(dashboard, conf.suiteConf.domain);

      await test.step(`Go to product list > choose product`, async () => {
        await product.goToProductList();
        await product.searchProduct(mediaCase.product_name);
        await product.chooseProduct(mediaCase.product_name);
        await product.page.waitForSelector(product.xpathDescriptionFrame, { timeout: 120000 });
        if (
          (await product.countProductMedia()) == 500 &&
          mediaCase.case_id != "SB_PRO_VAD_16" &&
          mediaCase.case_id != "SB_PRO_VAD_13"
        ) {
          await product.deleteLastImage();
          await product.page.reload({ waitUntil: "networkidle" });
        }
      });

      await test.step(`Edit media in variant detail`, async () => {
        await product.waitForElementVisibleThenInvisible("(//div[@class='s-detail-loading__body'])[1]");
        await product.page.waitForSelector("//div[contains(@class,'section-image')]");
        await product.clickEditVariant();
        variant = new VariantDetailPage(dashboard, "");
        if ((await product.countProductMedia()) == 500) {
          await variant.unselectMediaInProduct();
          await variant.saveChanges();
          await variant.page.waitForSelector(variant.xpathToastMessage);
          await variant.page.waitForSelector(variant.xpathToastMessage, { state: "hidden" });
        }
        if (mediaCase.success) {
          await test.step("Verify variant have 500 images", async () => {
            if (mediaCase.media_url) {
              await variant.addMedia({ url: mediaCase.media_url });
            }
            if (mediaCase.media_upload) {
              await variant.addMedia({ upload: mediaCase.media_upload });
            }
            if (mediaCase.media_select) {
              await variant.addMedia({ select: mediaCase.media_select });
            }
            await variant.saveChanges();
            await expect(variant.page.locator(variant.messageSuccess)).toBeVisible();
            await variant.closeOnboardingPopup();
            await variant.backToProduct();
            expect(await variant.getTextContent("(//table[@id='all-variants']//img)[1]/preceding-sibling::div")).toBe(
              mediaCase.max_image_quantity,
            );
          });
        } else {
          await test.step("Verify add media failed", async () => {
            switch (mediaCase.case_id) {
              case "SB_PRO_VAD_16":
                await variant.page.click("//a[normalize-space()='Add media from URL']");
                await expect(variant.page.locator("//p[normalize-space()='Add media from URL']")).toBeHidden();
                break;
              case "SB_PRO_VAD_17":
                await prepareFile(mediaCase.s3_path, mediaCase.file_path);
                await variant.addMedia({ upload: mediaCase.file_path });
                await expect(
                  variant.page.locator(
                    "//span[contains(text(),'This file is too large. The allowed size is under 20 MB.')]",
                  ),
                ).toBeVisible();
                break;
              case "SB_PRO_VAD_18":
                await variant.addMedia({ upload: mediaCase.file_path });
                await expect(
                  variant.page.locator(
                    "//span[contains(text(),'There is a file that we don’t support this file type. Please try again with PNG, JPG, JPEG, GIF, WEBP')]",
                  ),
                ).toBeVisible();
                break;
              case "SB_PRO_VAD_19":
                await variant.addMedia({ url: mediaCase.media_url });
                await expect(
                  variant.page.locator("//p[contains(text(),'is not a valid media file type')]"),
                ).toBeVisible();
                break;
              case "SB_PRO_VAD_20":
                await variant.addMedia({ url: mediaCase.media_url });
                await expect(
                  variant.page.locator(
                    `//p[contains(text(),"Can't connect to the image hosting. Please review it or download the image to device then try again.")]`,
                  ),
                ).toBeVisible();
                break;
            }
          });
        }
      });

      if (
        mediaCase.case_id == "SB_PRO_VAD_13" ||
        mediaCase.case_id == "SB_PRO_VAD_14" ||
        mediaCase.case_id == "SB_PRO_VAD_15"
      ) {
        await test.step(`Verify variant in SF`, async () => {
          const [newPage] = await Promise.all([context.waitForEvent("page"), product.clickViewProductOnSF()]);
          const productSF = new SFProduct(newPage, conf.suiteConf.domain);
          await waitForImageLoaded(productSF.page, `(${productSF.xpathThumbnailOfMedia})[1]`);
          await productSF.page.waitForSelector(`(${productSF.xpathTrustBadgeImg})[1]`, { timeout: 90000 });
          expect(await productSF.page.locator(productSF.xpathThumbnailOfMedia).count()).toBe(
            conf.suiteConf.maximize_media,
          );
        });
      }
    });
  }
});
