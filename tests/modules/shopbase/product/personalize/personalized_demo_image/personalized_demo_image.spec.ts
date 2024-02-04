import { expect, test } from "@fixtures/theme";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import { ProductPage } from "@pages/dashboard/products";
import { Campaign } from "@sf_pages/campaign";
import { Personalize } from "@pages/dashboard/personalize";
import { SFCheckout } from "@sf_pages/checkout";
import { SFCart, SFCartv3 } from "@sf_pages/cart";
import { MailBox } from "@pages/thirdparty/mailbox";
import { SFHome } from "@sf_pages/homepage";
import { defaultSnapshotOptions } from "@constants/visual_compare";

let productPage: ProductPage;
let campaignSF: Campaign;
let personalizePage: Personalize;
let cart: SFCart;
let SFPage;
let cartPageV3: SFCartv3;
let checkout: SFCheckout;
let mailBoxPage: MailBox;
let ordername: string;
let SfHome: SFHome;

test.describe("Live preview campaigns", () => {
  const caseName = "PRODUCT_HAS_DEMO_IMAGE";
  const conf = loadData(__dirname, caseName);
  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
    test.setTimeout(conf.suiteConf.time_out);
  });

  conf.caseConf.data.forEach(testCase => {
    test(`${testCase.case_name} @${testCase.case_id}`, async ({ context, snapshotFixture, dashboard, theme }) => {
      const checkoutInfo = conf.suiteConf.checkout_info;
      const date = new Date();
      const envRun = process.env.ENV;
      const nameMail = `tester${date.getTime()}`;
      checkoutInfo.email = `tester${nameMail}@maildrop.cc`;
      const productInfo = testCase.product_all_info;
      const imagePreview = testCase.image_preview;
      const layerList = testCase.layers;
      const customOptions = testCase.custom_option_info;
      const customOptionShowSF = testCase.custom_option_data_SF;
      const conditionalLogicInfo = testCase.conditional_logic_info;
      const productName = productInfo.title;
      const groupInfos = testCase.group_infos;
      const layersGroupInfos = testCase.layers_group_infos;
      const customGroupInfos = testCase.custom_group_infos;
      const buttonClickOpenEditor = testCase.btn_open_editor;
      await test.step("Setting theme", async () => {
        const listTheme = await theme.list();
        const themeId = listTheme.find(shopTheme => shopTheme.name == testCase.theme_name);
        await theme.publish(themeId.id);
      });

      await test.step(
        "- Tại Left menu, click Products > Click btn Add product > Input title, image prod -> thực hiện tạo product thành công" +
          "- Tạo preview với CO effect stroke:" +
          " + tại product detail, click button 'Create Preview Image'" +
          "-> Upload image bất kỳ" +
          "-> click button 'Add text' -> tại 'Text layer 1'-> input data, tại EFFECTS -> click + tại Curve và input data" +
          "-> tại Custom options -> click button" +
          "-> click button Save",
        async () => {
          await productPage.navigateToMenu("Products");
          await productPage.searchProduct(productName);
          await productPage.deleteProduct(conf.suiteConf.password);
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMessage);
          await personalizePage.addProductAndAddConditionLogicCO(
            productInfo,
            imagePreview,
            layerList,
            customOptions,
            conditionalLogicInfo,
            buttonClickOpenEditor,
            groupInfos,
            layersGroupInfos,
            customGroupInfos,
          );
          if (await personalizePage.checkButtonVisible("Cancel")) {
            await personalizePage.clickOnBtnWithLabel("Cancel");
            await personalizePage.page.reload();
            await dashboard.waitForLoadState("networkidle");
            await expect(dashboard.locator(productPage.xpathImagePreview)).toBeVisible();
            await expect(dashboard.locator(productPage.xpathCustomizeGroupProductDetail)).toBeVisible();
          }
        },
      );

      await test.step("Open shop on SF > Search and seclect campaign name > Input all CO>CLick Buton Preview Your Design>", async () => {
        [SFPage] = await Promise.all([context.waitForEvent("page"), personalizePage.clickViewProductSF]);
        cart = new SFCart(SFPage, conf.suiteConf.domain);
        campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
        SfHome = new SFHome(SFPage, conf.suiteConf.domain);
        if (testCase.theme_name == "Inside" || testCase.theme_name == "Roller") {
          await campaignSF.waitResponseWithUrl("/assets/landing.css", 90000);
        }
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
        await campaignSF.inputCustomAllOptionSF(customOptionShowSF.custom_info, customOptionShowSF.name_group);
        if (testCase.case_id != "SB_PRB_PRB_PRO_SBP_14") {
          await campaignSF.clickOnBtnWithLabel("Preview your design");
          await campaignSF.page.waitForSelector(`${campaignSF.xpathPopupLivePreview(1)}`);
          await campaignSF.limitTimeWaitAttributeChange(`${campaignSF.xpathPopupLivePreview(1)}`);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(3000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: campaignSF.xpathPopupLivePreview(1),
            snapshotName: `${testCase.image.preview}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
            sizeCheck: true,
          });
          await campaignSF.closePreview(testCase.themes_setting);
        } else {
          await expect(campaignSF.page.locator(campaignSF.xpathBtnWithLabel("Preview your design"))).toBeHidden();
        }
      });

      await test.step(
        "Add to cart>Verify hiển thị image của line item trong drawer cart " + "->click product image",
        async () => {
          await campaignSF.addToCart();
          let imageInCartDraw;
          let xpathImagePreviewFullSize;
          if (testCase.theme_name == "Inside" || testCase.theme_name == "Roller") {
            await campaignSF.page.waitForSelector(cart.xpathCartContent);
            imageInCartDraw = cart.xpathImageInCartDraw;
            xpathImagePreviewFullSize = `(${campaignSF.xpathImagePreviewFullSize})[1]`;
          } else {
            cartPageV3 = new SFCartv3(SFPage, conf.suiteConf.domain);
            const isDisplayCart = await campaignSF.isDBPageDisplay("YOUR SHOPPING CART");
            if (!isDisplayCart) {
              await campaignSF.page.click(SfHome.xpathCartIcon);
            }
            imageInCartDraw = cartPageV3.getXpathImageProductInCartPageV3(productName, "small");
            xpathImagePreviewFullSize = `(${campaignSF.xpathImagePreviewFullSize})[2]`;
            if (envRun == "dev" && testCase.case_id == "SB_PRB_PRB_PRO_SBP_18") {
              xpathImagePreviewFullSize = `(${campaignSF.xpathImagePreviewFullSize})[1]`;
            }
          }
          await campaignSF.limitTimeWaitAttributeChange(imageInCartDraw, 30);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: imageInCartDraw,
            snapshotName: `${testCase.image.cart_draw.demo_image}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });
          if (!(await campaignSF.page.locator(imageInCartDraw).isVisible())) {
            await campaignSF.page.click(SfHome.xpathCartIcon);
          }
          await campaignSF.page.click(imageInCartDraw);
          if (testCase.case_id != "SB_PRB_PRB_PRO_SBP_14") {
            await campaignSF.waitUntilElementVisible(xpathImagePreviewFullSize);
            await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
            await campaignSF.limitTimeWaitAttributeChange(xpathImagePreviewFullSize, 30);
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: xpathImagePreviewFullSize,
              snapshotName: `${testCase.image.cart_draw.full_size}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
          } else {
            await expect(campaignSF.page.locator(`(${campaignSF.xpathImagePreviewFullSize})[1]`)).toBeHidden();
          }
        },
      );

      await test.step("Click button Go to cart > Verify hiển thị image của line item trong cart page click product image", async () => {
        await campaignSF.gotoCart();
        let imageInCart;
        if (testCase.theme_name == "Inside" || testCase.theme_name == "Roller") {
          imageInCart = cart.getXpathImageProductInCartPage(productName);
        } else {
          imageInCart = `${cartPageV3.getXpathImageProductInCartPageV3(
            productName,
            "large",
          )} |${cartPageV3.getXpathImageProductInCartPageV3(productName, "medium")}`;
        }
        // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
        await campaignSF.page.waitForTimeout(5000);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: imageInCart,
          snapshotName: `${testCase.image.cart_page.demo_image}_${envRun}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
          sizeCheck: true,
        });
        await campaignSF.page.click(imageInCart);
        if (testCase.case_id != "SB_PRB_PRB_PRO_SBP_14") {
          await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
          await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
          await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: `(${campaignSF.xpathImagePreviewFullSize})[1]`,
            snapshotName: `${testCase.image.cart_page.full_size}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });
          await campaignSF.closePreview(testCase.themes_setting);
        } else {
          await expect(campaignSF.page.locator(`(${campaignSF.xpathImagePreviewFullSize})[1]`)).toBeHidden();
        }
      });

      await test.step(
        "Click button Checkout > Verify hiển thị image của line item trong checkout page" + +"click product image",
        async () => {
          checkout = new SFCheckout(SFPage, conf.suiteConf.domain);
          await cart.checkout();
          await cart.waitForElementVisibleThenInvisible(campaignSF.xpathPageCheckoutLoadDisable);
          await cart.page.waitForSelector(checkout.xpathOrderSummarySection);
          if (envRun == "dev" && testCase.case_id == "SB_PRB_PRB_PRO_SBP_18") {
            const xpathImageDisplay = cartPageV3.getXpathImageProductInCartPageV3(productName, "small");
            await campaignSF.page.waitForSelector(xpathImageDisplay);
            await campaignSF.limitTimeWaitAttributeChange(xpathImageDisplay, 30);
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: xpathImageDisplay,
              snapshotName: `${testCase.image.checkout_page.demo_image}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
            await campaignSF.page.hover(xpathImageDisplay);
            await campaignSF.page.locator(xpathImageDisplay).click();
          } else {
            await campaignSF.page.waitForSelector(checkout.getXpathImageProductInCheckoutPage(productName));
            await campaignSF.limitTimeWaitAttributeChange(checkout.getXpathImageProductInCheckoutPage(productName), 30);
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: checkout.getXpathImageProductInCheckoutPage(productName),
              snapshotName: `${testCase.image.checkout_page.demo_image}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
            await campaignSF.page.hover(checkout.xpathImageThumbnailInCheckoutPage);
            await campaignSF.page.locator(checkout.xpathImageThumbnailInCheckoutPage).click();
          }
          if (testCase.case_id != "SB_PRB_PRB_PRO_SBP_14") {
            await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
            await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
            await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: campaignSF.xpathImagePreviewFullSize,
              snapshotName: `${testCase.image.checkout_page.full_size}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
            await campaignSF.closePreview(testCase.themes_setting);
          } else {
            await expect(campaignSF.page.locator(`(${campaignSF.xpathImagePreviewFullSize})[1]`)).toBeHidden();
          }
        },
      );

      await test.step(
        "Thực hiện các step checkout > Verify hiển thị image của line item trong Thankyou page" +
          "-> click product image",
        async () => {
          await checkout.enterShippingAddress(checkoutInfo);
          await checkout.continueToPaymentMethod();
          await checkout.completeOrderWithMethod();
          await expect(checkout.thankyouPageLoc).toBeVisible({ timeout: 10000 });
          ordername = await checkout.getOrderName();
          if (testCase.theme_name === "Inside" || testCase.theme_name === "Roller") {
            await campaignSF.limitTimeWaitAttributeChange(cart.xpathImageInCartDraw, 30);
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: cart.xpathImageInCartDraw,
              snapshotName: `${testCase.image.thankyou_page.demo_image}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
            await campaignSF.page.hover(checkout.xpathImageThumbnailInCheckoutPage);
            await campaignSF.page.click(checkout.xpathImageThumbnailInCheckoutPage);
            if (testCase.case_id != "SB_PRB_PRB_PRO_SBP_14") {
              await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
              await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
              await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
              // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
              await campaignSF.page.waitForTimeout(5000);
              await snapshotFixture.verify({
                page: campaignSF.page,
                selector: checkout.getXpathImageProductInCheckoutPage(productName),
                snapshotName: `${testCase.image.thankyou_page.full_size}_${envRun}.png`,
                snapshotOptions: {
                  maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                  threshold: conf.suiteConf.param_threshold,
                  maxDiffPixels: conf.suiteConf.max_diff_pixels,
                },
                sizeCheck: true,
              });
            } else {
              await expect(campaignSF.page.locator(`(${campaignSF.xpathImagePreviewFullSize})[1]`)).toBeHidden();
            }
          } else {
            await campaignSF.limitTimeWaitAttributeChange(cart.xpathImageInCartDraw, 30);
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: cart.xpathImageInCartDraw,
              snapshotName: `${testCase.image.thankyou_page.demo_image_left}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
            const imageRightInThankyouPage = cartPageV3.getXpathImageProductInCartPageV3(productName, "small");
            await campaignSF.limitTimeWaitAttributeChange(imageRightInThankyouPage, 30);
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: imageRightInThankyouPage,
              snapshotName: `${testCase.image.thankyou_page.demo_image_right}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
            await campaignSF.page.hover(imageRightInThankyouPage);
            await campaignSF.page.click(imageRightInThankyouPage);
            if (testCase.case_id != "SB_PRB_PRB_PRO_SBP_14") {
              await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
              await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
              await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
              // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
              await campaignSF.page.waitForTimeout(5000);
              await snapshotFixture.verify({
                page: campaignSF.page,
                selector: `(${campaignSF.xpathImagePreviewFullSize})[1]`,
                snapshotName: `${testCase.image.thankyou_page.full_size}_${envRun}.png`,
                snapshotOptions: {
                  maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                  threshold: conf.suiteConf.param_threshold,
                  maxDiffPixels: conf.suiteConf.max_diff_pixels,
                },
                sizeCheck: true,
              });
            } else {
              await expect(campaignSF.page.locator(campaignSF.xpathImagePreviewFullSize)).toBeHidden();
            }
          }
        },
      );

      await test.step("reload lại trang thank you page->Kiểm tra hiển thị demo image", async () => {
        await campaignSF.page.reload();
        await campaignSF.page.waitForLoadState("networkidle");
        await checkout.page.waitForSelector(checkout.xpathOrderSummarySection);
        if (testCase.theme_name === "Inside" || testCase.theme_name === "Roller") {
          await campaignSF.limitTimeWaitAttributeChange(checkout.xpathImageThumbnailInCheckoutPage, 30);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: cart.xpathImageInCartDraw,
            snapshotName: `${testCase.image.thankyou_page_reload.demo_image}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });
          await campaignSF.page.hover(checkout.xpathImageThumbnailInCheckoutPage);
          await campaignSF.page.click(checkout.xpathImageThumbnailInCheckoutPage);
          if (testCase.case_id != "SB_PRB_PRB_PRO_SBP_14") {
            await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
            await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
            await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: checkout.getXpathImageProductInCheckoutPage(productName),
              snapshotName: `${testCase.image.thankyou_page_reload.full_size}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
          } else {
            await expect(campaignSF.page.locator(`(${campaignSF.xpathImagePreviewFullSize})[1]`)).toBeHidden();
          }
        } else {
          await campaignSF.limitTimeWaitAttributeChange(cart.xpathImageInCartDraw, 30);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: cart.xpathImageInCartDraw,
            snapshotName: `${testCase.image.thankyou_page_reload.demo_image_left}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });
          const imageRightInThankyouPage = cartPageV3.getXpathImageProductInCartPageV3(productName, "small");
          await campaignSF.limitTimeWaitAttributeChange(imageRightInThankyouPage, 30);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: imageRightInThankyouPage,
            snapshotName: `${testCase.image.thankyou_page_reload.demo_image_right}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });
          await campaignSF.page.hover(imageRightInThankyouPage);
          await campaignSF.page.click(imageRightInThankyouPage);
          if (testCase.case_id != "SB_PRB_PRB_PRO_SBP_14") {
            await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
            await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
            await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: `(${campaignSF.xpathImagePreviewFullSize})[1]`,
              snapshotName: `${testCase.image.thankyou_page_reload.full_size}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
          } else {
            await expect(campaignSF.page.locator(`(${campaignSF.xpathImagePreviewFullSize})[1]`)).toBeHidden();
          }
        }
      });
      if (testCase.case_id == "SB_PRB_PRB_PRO_SBP_06") {
        await test.step("Open mail confirm order > Verify hiển thị image của line item trong mai click product image", async () => {
          mailBoxPage = await checkout.openMailBox(checkoutInfo.email);
          await mailBoxPage.page.waitForLoadState("networkidle");
          await mailBoxPage.openOrderConfirmationNotification(ordername);
          const imageInOrderComfirm = await mailBoxPage.getImageOnOrderConfrimationMail(productName);
          await mailBoxPage.goto(imageInOrderComfirm);
          await mailBoxPage.page.waitForLoadState("domcontentloaded");
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await mailBoxPage.page.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: mailBoxPage.page,
            snapshotName: `${testCase.image.mail_order.demo_image}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });
        });
      }
    });
  });

  const confImage = loadData(__dirname, "SETTING_DEMO_IMAGE");
  for (let i = 0; i < confImage.caseConf.data.length; i++) {
    const demoImage = confImage.caseConf.data[i];

    test(`${demoImage.case_name} @${demoImage.case_id}`, async ({ dashboard, snapshotFixture, theme, context }) => {
      const checkoutInfo = conf.suiteConf.checkout_info;
      const date = new Date();
      const envRun = process.env.ENV;
      const nameMail = `tester${date.getTime()}`;
      checkoutInfo.email = `tester${nameMail}@maildrop.cc`;
      const productInfo = demoImage.product_all_info;
      const imagePreview = demoImage.image_preview;
      const layerList = demoImage.layers;
      const customOptions = demoImage.custom_option_info;
      const customOptionShowSF = demoImage.custom_option_data_SF;
      const conditionalLogicInfo = demoImage.conditional_logic_info;
      const productName = productInfo.title;
      const groupInfos = demoImage.group_infos;
      const layersGroupInfos = demoImage.layers_group_infos;
      const customGroupInfos = demoImage.custom_group_infos;
      const buttonClickOpenEditor = demoImage.btn_open_editor;

      await test.step("Pre condition: Setting theme", async () => {
        const listTheme = await theme.list();
        const themeId = listTheme.find(shopTheme => shopTheme.name == demoImage.theme_name);
        await theme.publish(themeId.id);
      });

      await test.step(
        "Pre condition:" +
          "- Tại Left menu, click Products > Click btn Add product > Input title, image prod -> thực hiện tạo product thành công" +
          "- Tạo preview với CO effect stroke:" +
          " + tại product detail, click button 'Create Preview Image'" +
          "-> Upload image bất kỳ" +
          "-> click button 'Add text' -> tại 'Text layer 1'-> input data, tại EFFECTS -> click + tại Curve và input data" +
          "-> tại Custom options -> click button" +
          "-> click button Save",
        async () => {
          await productPage.navigateToMenu("Products");
          await productPage.searchProduct(productName);
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathProductDetailLoading);
          await productPage.page.waitForSelector(
            "(//div[@class = 'product-name'] | //table[@id='all-products']//td[@class='no-product'] " +
              "| //p[normalize-space() = 'Could not find any products matching'])[1]",
          );
          const isProductVisible = await dashboard
            .locator(`(//*[normalize-space() = '${productName}'])[1]`)
            .isVisible({ timeout: 10000 });
          if (!isProductVisible) {
            await productPage.navigateToMenu("Products");
            await personalizePage.addProductAndAddConditionLogicCO(
              productInfo,
              imagePreview,
              layerList,
              customOptions,
              conditionalLogicInfo,
              buttonClickOpenEditor,
              groupInfos,
              layersGroupInfos,
              customGroupInfos,
            );
            if (await personalizePage.checkButtonVisible("Cancel")) {
              await personalizePage.clickOnBtnWithLabel("Cancel");
              await personalizePage.page.reload();
              await dashboard.waitForLoadState("networkidle");
              await expect(dashboard.locator(productPage.xpathImagePreview)).toBeVisible();
              await expect(dashboard.locator(productPage.xpathCustomizeGroupProductDetail)).toBeVisible();
            }
          }
        },
      );

      await test.step("Open shop on SF > Search and seclect product > Input all CO>CLick Buton Preview Your Design>", async () => {
        await productPage.gotoProductDetail(productName);
        [SFPage] = await Promise.all([context.waitForEvent("page"), await productPage.clickViewProductSF()]);
        cart = new SFCart(SFPage, conf.suiteConf.domain);
        campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
        SfHome = new SFHome(SFPage, conf.suiteConf.domain);
        if (demoImage.theme_name == "Inside" || demoImage.theme_name == "Roller") {
          campaignSF.page.reload();
          await campaignSF.waitResponseWithUrl("/assets/landing.css", 90000);
        }
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
        await campaignSF.inputCustomAllOptionSF(customOptionShowSF.custom_info, customOptionShowSF.name_group);
        await campaignSF.clickOnBtnWithLabel("Preview your design");
        await campaignSF.page.waitForSelector(`${campaignSF.xpathPopupLivePreview(1)}`);
        await campaignSF.limitTimeWaitAttributeChange(`${campaignSF.xpathPopupLivePreview(1)}`);
        await waitForImageLoaded(SFPage, campaignSF.xpathPopupLivePreview(1));
        // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
        await campaignSF.page.waitForTimeout(8000);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: campaignSF.xpathPopupLivePreview(1),
          snapshotName: `${demoImage.image.preview}_${envRun}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
            threshold: defaultSnapshotOptions.threshold,
            maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
          },
          sizeCheck: true,
        });
        await campaignSF.closePreview(demoImage.themes_setting);
      });

      await test.step(
        "Add to cart>Verify hiển thị image của line item trong drawer cart " + "->click product image",
        async () => {
          await campaignSF.addToCart();
          let imageInCartDraw;
          let xpathImagePreviewFullSize;
          if (demoImage.theme_name == "Inside" || demoImage.theme_name == "Roller") {
            await campaignSF.page.waitForSelector(cart.xpathCartContent);
            imageInCartDraw = cart.xpathImageInCartDraw;
            xpathImagePreviewFullSize = `(${campaignSF.xpathImagePreviewFullSize})[1]`;
            await campaignSF.limitTimeWaitAttributeChange(`${imageInCartDraw}//img`, 30);
          } else {
            cartPageV3 = new SFCartv3(SFPage, conf.suiteConf.domain);
            const isDisplayCart = await campaignSF.isDBPageDisplay("YOUR SHOPPING CART");
            if (!isDisplayCart) {
              await campaignSF.page.click(SfHome.xpathCartIcon);
            }
            imageInCartDraw = cartPageV3.getXpathImageProductInCartPageV3(productName, "small");
            xpathImagePreviewFullSize = `(${campaignSF.xpathImagePreviewFullSize})[2]`;
            await campaignSF.limitTimeWaitAttributeChange(imageInCartDraw, 30);
          }
          await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
          await waitForImageLoaded(SFPage, imageInCartDraw);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(8000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: imageInCartDraw,
            snapshotName: `${demoImage.image.cart_draw.demo_image}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });
          if (!(await campaignSF.page.locator(imageInCartDraw).isVisible())) {
            await campaignSF.page.click(SfHome.xpathCartIcon);
          }
          await campaignSF.page.click(imageInCartDraw);
          await campaignSF.waitUntilElementVisible(xpathImagePreviewFullSize);
          await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
          await campaignSF.limitTimeWaitAttributeChange(xpathImagePreviewFullSize, 30);
          await waitForImageLoaded(SFPage, xpathImagePreviewFullSize);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: xpathImagePreviewFullSize,
            snapshotName: `${demoImage.image.cart_draw.full_size}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });
        },
      );

      await test.step("Click button Go to cart > Verify hiển thị image của line item trong cart page click product image", async () => {
        await campaignSF.gotoCart();
        let imageInCart;
        if (demoImage.theme_name == "Inside" || demoImage.theme_name == "Roller") {
          imageInCart = cart.getXpathImageProductInCartPage(productName);
        } else {
          imageInCart = `${cartPageV3.getXpathImageProductInCartPageV3(
            productName,
            "large",
          )} | ${cartPageV3.getXpathImageProductInCartPageV3(productName, "medium")}`;
        }
        await waitForImageLoaded(SFPage, imageInCart);
        // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
        await campaignSF.page.waitForTimeout(8000);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: imageInCart,
          snapshotName: `${demoImage.image.cart_page.demo_image}_${envRun}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
          sizeCheck: true,
        });
        await campaignSF.page.click(imageInCart);
        await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
        await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
        await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
        await waitForImageLoaded(SFPage, `(${campaignSF.xpathImagePreviewFullSize})[1]`);
        // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
        await campaignSF.page.waitForTimeout(8000);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `(${campaignSF.xpathImagePreviewFullSize})[1]`,
          snapshotName: `${demoImage.image.cart_page.full_size}_${envRun}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
          sizeCheck: true,
        });
        await campaignSF.closePreview(demoImage.themes_setting);
      });

      await test.step(
        "Click button Checkout > Verify hiển thị image của line item trong checkout page" + +"click product image",
        async () => {
          checkout = new SFCheckout(SFPage, conf.suiteConf.domain);
          await cart.checkout();
          await cart.waitForElementVisibleThenInvisible(campaignSF.xpathPageCheckoutLoadDisable);
          await cart.page.waitForSelector(checkout.xpathOrderSummarySection);
          if (demoImage.theme_name === "Inside" || demoImage.theme_name === "Roller") {
            await campaignSF.page.waitForSelector(checkout.getXpathImageProductInCheckoutPage(productName));
            await campaignSF.limitTimeWaitAttributeChange(checkout.getXpathImageProductInCheckoutPage(productName), 30);
            await waitForImageLoaded(SFPage, checkout.getXpathImageProductInCheckoutPage(productName));
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(8000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: checkout.getXpathImageProductInCheckoutPage(productName),
              snapshotName: `${demoImage.image.checkout_page.demo_image}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
            await campaignSF.page.hover(checkout.xpathImageThumbnailInCheckoutPage);
            await campaignSF.page.locator(checkout.xpathImageThumbnailInCheckoutPage).click();
          } else {
            const xpathImageDisplay = cartPageV3.getXpathImageProductInCartPageV3(productName, "small");
            await campaignSF.page.waitForSelector(xpathImageDisplay);
            await campaignSF.limitTimeWaitAttributeChange(xpathImageDisplay, 30);
            await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: xpathImageDisplay,
              snapshotName: `${demoImage.image.checkout_page.demo_image}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
            await campaignSF.page.hover(xpathImageDisplay);
            await campaignSF.page.locator(xpathImageDisplay).click();
          }
          await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
          await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
          await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
          await waitForImageLoaded(SFPage, `(${campaignSF.xpathImagePreviewFullSize})[1]`);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(8000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: `(${campaignSF.xpathImagePreviewFullSize})[1]`,
            snapshotName: `${demoImage.image.checkout_page.full_size}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });
          await campaignSF.closePreview(demoImage.themes_setting);
        },
      );

      await test.step(
        "Thực hiện các step checkout > Verify hiển thị image của line item trong Thankyou page" +
          "-> click product image",
        async () => {
          await checkout.enterShippingAddress(checkoutInfo);
          await checkout.continueToPaymentMethod();
          await checkout.completeOrderWithMethod();
          await expect(checkout.thankyouPageLoc).toBeVisible({ timeout: 10000 });
          ordername = await checkout.getOrderName();
          if (demoImage.theme_name === "Inside" || demoImage.theme_name === "Roller") {
            await campaignSF.limitTimeWaitAttributeChange(checkout.getXpathImageProductInCheckoutPage(productName), 30);
            await waitForImageLoaded(SFPage, checkout.getXpathImageProductInCheckoutPage(productName));
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: checkout.getXpathImageProductInCheckoutPage(productName),
              snapshotName: `${demoImage.image.thankyou_page.demo_image}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
            await campaignSF.page.hover(checkout.xpathImageThumbnailInCheckoutPage);
            await campaignSF.page.click(checkout.xpathImageThumbnailInCheckoutPage);
            await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
            await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
            await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
            await waitForImageLoaded(SFPage, `(${campaignSF.xpathImagePreviewFullSize})[1]`);
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: `(${campaignSF.xpathImagePreviewFullSize})[1]`,
              snapshotName: `${demoImage.image.thankyou_page.full_size}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
          } else {
            const imageRightInThankyouPage = cartPageV3.getXpathImageProductInCartPageV3(productName, "small");
            await campaignSF.limitTimeWaitAttributeChange(imageRightInThankyouPage, 30);
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: imageRightInThankyouPage,
              snapshotName: `${demoImage.image.thankyou_page.demo_image_right}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
            await campaignSF.page.hover(imageRightInThankyouPage);
            await campaignSF.page.click(imageRightInThankyouPage);
            await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
            await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
            await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
            // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
            await campaignSF.page.waitForTimeout(5000);
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: `(${campaignSF.xpathImagePreviewFullSize})[1]`,
              snapshotName: `${demoImage.image.thankyou_page.full_size}_${envRun}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
                threshold: conf.suiteConf.param_threshold,
                maxDiffPixels: conf.suiteConf.max_diff_pixels,
              },
              sizeCheck: true,
            });
          }
        },
      );

      await test.step("Reload lại trang thank you page->Kiểm tra hiển thị demo image", async () => {
        await campaignSF.page.reload();
        await campaignSF.page.waitForLoadState("networkidle");
        await checkout.page.waitForSelector(checkout.xpathOrderSummarySection);
        if (demoImage.theme_name === "Inside" || demoImage.theme_name === "Roller") {
          await checkout.page.waitForSelector(checkout.getXpathImageProductInCheckoutPage(productName));
          await checkout.page.waitForSelector(checkout.getXpathImageProductInContentBlock(productName));
          await campaignSF.limitTimeWaitAttributeChange(checkout.getXpathImageProductInCheckoutPage(productName), 30);
          await campaignSF.limitTimeWaitAttributeChange(`${cart.xpathImageInCartDraw}//img`, 30);
          await waitForImageLoaded(SFPage, checkout.getXpathImageProductInCheckoutPage(productName));

          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          //image order summary
          await campaignSF.page.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: checkout.getXpathImageProductInCheckoutPage(productName),
            snapshotName: `${demoImage.image.thankyou_page_reload.demo_image_order_summary}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });

          await campaignSF.page.hover(checkout.xpathImageThumbnailInCheckoutPage);
          await campaignSF.page.click(checkout.xpathImageThumbnailInCheckoutPage);
          await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
          await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
          await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
          await waitForImageLoaded(SFPage, `(${campaignSF.xpathImagePreviewFullSize})[1]`);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: `(${campaignSF.xpathImagePreviewFullSize})[1]`,
            snapshotName: `${demoImage.image.thankyou_page_reload.full_size}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });
        } else {
          const imageRightInThankyouPage = cartPageV3.getXpathImageProductInCartPageV3(productName, "small");
          await campaignSF.limitTimeWaitAttributeChange(imageRightInThankyouPage, 30);
          await waitForImageLoaded(SFPage, imageRightInThankyouPage);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: imageRightInThankyouPage,
            snapshotName: `${demoImage.image.thankyou_page_reload.demo_image_right}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });
          await campaignSF.page.hover(imageRightInThankyouPage);
          await campaignSF.page.click(imageRightInThankyouPage);
          await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
          await campaignSF.waitForElementVisibleThenInvisible(productPage.xpathIconLoading);
          await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
          await waitForImageLoaded(SFPage, `(${campaignSF.xpathImagePreviewFullSize})[1]`);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(5000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: `(${campaignSF.xpathImagePreviewFullSize})[1]`,
            snapshotName: `${demoImage.image.thankyou_page_reload.full_size}_${envRun}.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });
        }
      });
    });
  }
});
