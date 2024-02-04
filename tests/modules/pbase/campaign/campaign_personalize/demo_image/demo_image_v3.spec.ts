import { expect, test } from "@fixtures/theme";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { Campaign } from "@sf_pages/campaign";
import { Personalize } from "@pages/dashboard/personalize";
import { SFCheckout } from "@sf_pages/checkout";
import { SFCart, SFCartv3 } from "@sf_pages/cart";
import { SFHome } from "@sf_pages/homepage";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { PrintBasePage } from "@pages/dashboard/printbase";

let campaignSF: Campaign;
let personalizePage: Personalize;
let cart: SFCart;
let SFPage;
let cartPageV3: SFCartv3;
let checkout: SFCheckout;
let SfHome: SFHome;
let printbasePage: PrintBasePage;
test.describe("Live preview campaigns", () => {
  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    printbasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    personalizePage = new Personalize(dashboard, conf.suiteConf.domain);
    test.setTimeout(conf.suiteConf.time_out);
  });

  test(`Verify hiển thị image product khi order với Campaign có personalize theme V3 @SB_PRB_PPB_18`, async ({
    context,
    snapshotFixture,
    conf,
  }) => {
    const checkoutInfo = conf.suiteConf.checkout_info;
    const testCase = conf.caseConf;
    const date = new Date();
    const envRun = process.env.ENV;
    const campaignsInfos = testCase.campaign_infos;
    const nameMail = `tester${date.getTime()}`;
    checkoutInfo.email = `tester${nameMail}@maildrop.cc`;
    const customOptionShowSF = testCase.custom_option_data_SF;
    const productName = campaignsInfos.pricing_info.title;

    await test.step(
      "Tại left menu, click Catalog, chọn base products -> click btn 'Create new campain'" +
        "Tạo preview với CO effect stroke: Tại Design & Personalization page " +
        "-> click button 'Add text' -> tại 'Text layer 1' -> input data, tại EFFECTS -> click + tại Stroke và input data" +
        "-> click button 'Add text' -> tại 'Text layer 2' -> input data, tại EFFECTS -> click + tại Curve và input data 1" +
        "-> click button 'Add text' -> tại 'Text layer 3' -> input data, tại EFFECTS -> click + tại Stroke / Curve và input data" +
        "- Click icon button 'Add group layer' -> add 2 group layer với tên: 'Group 1', 'Group 2' " +
        "-> add 'Text layer 1' vào 'Group 1' , add 'Text layer 2', 'Text layer 3' vào 'Group 2'" +
        "-> tại Custom options -> click button + -> input data ở drawer tương ứng cho từng CO-> click button Save",
      async () => {
        await printbasePage.navigateToMenu("Campaigns");
        await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
        const isProductVisible = await printbasePage.page
          .locator(await printbasePage.getXpathProductName(campaignsInfos.pricing_info.title))
          .isVisible({ timeout: 10000 });
        if (!isProductVisible) {
          await printbasePage.navigateToMenu("Catalog");
          const campainId = await printbasePage.launchCamp(campaignsInfos);
          const isAvailable = await printbasePage.checkCampaignStatus(
            campainId,
            ["available", "available with basic images"],
            30 * 60 * 1000,
          );
          expect(isAvailable).toBeTruthy();
        }
      },
    );
    await test.step("Open shop on SF > Search and seclect campaign name > Input all CO>CLick Buton Preview Your Design>", async () => {
      await printbasePage.navigateToMenu("Campaigns");
      await printbasePage.searchWithKeyword(campaignsInfos.pricing_info.title);
      await printbasePage.openCampaignDetail(campaignsInfos.pricing_info.title);
      [SFPage] = await Promise.all([context.waitForEvent("page"), personalizePage.openCampaignSF()]);
      cart = new SFCart(SFPage, conf.suiteConf.domain);
      campaignSF = new Campaign(SFPage, conf.suiteConf.domain);
      SfHome = new SFHome(SFPage, conf.suiteConf.domain);
      const variantProduct = testCase.variants;
      await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathImageLoad);
      if (variantProduct) {
        await campaignSF.selectValueProduct(variantProduct);
      }
      await campaignSF.inputCustomAllOptionSF(customOptionShowSF.custom_info, customOptionShowSF.name_group);
      await campaignSF.clickOnBtnWithLabel("Preview your design");
      await campaignSF.page.waitForSelector(`${campaignSF.xpathPopupLivePreview(1)}`);
      await campaignSF.limitTimeWaitAttributeChange(`${campaignSF.xpathPopupLivePreview(1)}`);
      await waitForImageLoaded(campaignSF.page, `${campaignSF.xpathPopupLivePreview(1)}`);

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
      await campaignSF.closePreview("v3");
    });

    await test.step(
      "Add to cart>Verify hiển thị image của line item trong drawer cart " + "->click product image",
      async () => {
        await campaignSF.addToCart();
        let xpathImagePreviewFullSize;
        cartPageV3 = new SFCartv3(SFPage, conf.suiteConf.domain);
        await campaignSF.isDBPageDisplay("YOUR SHOPPING CART");
        const imageInCartDraw = cartPageV3.getXpathImageProductInCartPageV3(productName, "small");
        if (envRun == "dev") {
          xpathImagePreviewFullSize = `(${campaignSF.xpathImagePreviewFullSize})[1]`;
        } else {
          xpathImagePreviewFullSize = `(${campaignSF.xpathImagePreviewFullSize})[2]`;
        }
        let checkCartVisible = await campaignSF.page.locator(imageInCartDraw).isVisible();
        if (!checkCartVisible) {
          await campaignSF.page.click(SfHome.xpathCartIcon);
        }
        await campaignSF.limitTimeWaitAttributeChange(imageInCartDraw, 50);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
        await waitForImageLoaded(campaignSF.page, imageInCartDraw);
        // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
        await campaignSF.page.waitForTimeout(3000);
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
        checkCartVisible = await campaignSF.page.locator(imageInCartDraw).isVisible();
        if (!checkCartVisible) {
          await campaignSF.page.click(SfHome.xpathCartIcon);
        }
        await campaignSF.page.click(imageInCartDraw);
        await campaignSF.waitUntilElementVisible(xpathImagePreviewFullSize);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
        await campaignSF.limitTimeWaitAttributeChange(xpathImagePreviewFullSize, 30);
        await waitForImageLoaded(campaignSF.page, xpathImagePreviewFullSize);
        // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
        await campaignSF.page.waitForTimeout(3000);
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
        const isBtnNextPeview = await campaignSF.page.locator(campaignSF.xpathBtnNextInPopupPreview).isVisible();
        if (isBtnNextPeview) {
          await campaignSF.page.click(campaignSF.xpathBtnNextInPopupPreview);
          await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[2]`, 30);
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
          await waitForImageLoaded(campaignSF.page, `(${campaignSF.xpathImagePreviewFullSize})[2]`);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(3000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: `(${campaignSF.xpathImagePreviewFullSize})[2]`,
            snapshotName: `${testCase.image.cart_draw.full_size}_${envRun}_next.png`,
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

    await test.step("Click button Go to cart > Verify hiển thị image của line item trong cart page click product image", async () => {
      await campaignSF.gotoCart();
      const imageInCart = `${cartPageV3.getXpathImageProductInCartPageV3(
        productName,
        "large",
      )} |${cartPageV3.getXpathImageProductInCartPageV3(productName, "medium")}`;
      await waitForImageLoaded(campaignSF.page, imageInCart);
      // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
      await campaignSF.page.waitForTimeout(3000);
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
      await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
      await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
      await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
      await waitForImageLoaded(campaignSF.page, `(${campaignSF.xpathImagePreviewFullSize})[1]`);

      // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
      await campaignSF.page.waitForTimeout(3000);
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
      const isBtnNextPeview = await campaignSF.page.locator(campaignSF.xpathBtnNextInPopupPreview).isVisible();
      if (isBtnNextPeview) {
        await campaignSF.page.click(campaignSF.xpathBtnNextInPopupPreview);
        await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[2]`, 30);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
        await waitForImageLoaded(campaignSF.page, `(${campaignSF.xpathImagePreviewFullSize})[2]`);

        // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
        await campaignSF.page.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `(${campaignSF.xpathImagePreviewFullSize})[2]`,
          snapshotName: `${testCase.image.cart_page.full_size}_${envRun}_next.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
          sizeCheck: true,
        });
      }
      await campaignSF.closePreview("v3");
    });

    await test.step(
      "Click button Checkout > Verify hiển thị image của line item trong checkout page" + +"click product image",
      async () => {
        checkout = new SFCheckout(SFPage, conf.suiteConf.domain);
        await cart.checkout();
        await cart.waitForElementVisibleThenInvisible(campaignSF.xpathPageCheckoutLoadDisable);
        await cart.page.waitForSelector(checkout.xpathOrderSummarySection);
        if (envRun == "dev") {
          const xpathImageDisplay = cartPageV3.getXpathImageProductInCartPageV3(productName, "small");
          await campaignSF.page.waitForSelector(xpathImageDisplay);
          await campaignSF.limitTimeWaitAttributeChange(xpathImageDisplay, 30);
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
          await waitForImageLoaded(campaignSF.page, xpathImageDisplay);
          await campaignSF.page.waitForTimeout(3000);
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
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
          await waitForImageLoaded(campaignSF.page, checkout.getXpathImageProductInCheckoutPage(productName));

          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(3000);
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
        await campaignSF.waitUntilElementVisible(`(${campaignSF.xpathImagePreviewFullSize})[1]`);
        await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
        await waitForImageLoaded(campaignSF.page, `(${campaignSF.xpathImagePreviewFullSize})[1]`);
        // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
        await campaignSF.page.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `(${campaignSF.xpathImagePreviewFullSize})[1]`,
          snapshotName: `${testCase.image.checkout_page.full_size}_${envRun}.png`,
          snapshotOptions: {
            maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
            threshold: conf.suiteConf.param_threshold,
            maxDiffPixels: conf.suiteConf.max_diff_pixels,
          },
          sizeCheck: true,
        });
        const isBtnNextPeview = await campaignSF.page.locator(campaignSF.xpathBtnNextInPopupPreview).isVisible();
        if (isBtnNextPeview) {
          await campaignSF.page.click(campaignSF.xpathBtnNextInPopupPreview);
          await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[2]`, 30);
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
          await waitForImageLoaded(campaignSF.page, `(${campaignSF.xpathImagePreviewFullSize})[2]`);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(3000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: `(${campaignSF.xpathImagePreviewFullSize})[2]`,
            snapshotName: `${testCase.image.checkout_page.full_size}_${envRun}_next.png`,
            snapshotOptions: {
              maxDiffPixelRatio: conf.suiteConf.max_diff_pixel_ratio,
              threshold: conf.suiteConf.param_threshold,
              maxDiffPixels: conf.suiteConf.max_diff_pixels,
            },
            sizeCheck: true,
          });
        }
        await campaignSF.closePreview("v3");
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
        await campaignSF.limitTimeWaitAttributeChange(cart.xpathImageInCartDraw, 30);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
        await waitForImageLoaded(campaignSF.page, cart.xpathImageInCartDraw);
        const imageRightInThankyouPage = cartPageV3.getXpathImageProductInCartPageV3(productName, "small");
        await campaignSF.limitTimeWaitAttributeChange(imageRightInThankyouPage, 30);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
        await waitForImageLoaded(campaignSF.page, imageRightInThankyouPage);

        // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
        await campaignSF.page.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: imageRightInThankyouPage,
          snapshotName: `${testCase.image.thankyou_page.demo_image}_right_${envRun}.png`,
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
        await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
        await waitForImageLoaded(campaignSF.page, `(${campaignSF.xpathImagePreviewFullSize})[1]`);
        // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
        await campaignSF.page.waitForTimeout(3000);
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

        const isBtnNextPeview = await campaignSF.page.locator(campaignSF.xpathBtnNextInPopupPreview).isVisible();
        if (isBtnNextPeview) {
          await campaignSF.page.click(campaignSF.xpathBtnNextInPopupPreview);
          await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[2]`, 30);
          await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
          await waitForImageLoaded(campaignSF.page, `(${campaignSF.xpathImagePreviewFullSize})[2]`);
          // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
          await campaignSF.page.waitForTimeout(3000);
          await snapshotFixture.verify({
            page: campaignSF.page,
            selector: `(${campaignSF.xpathImagePreviewFullSize})[2]`,
            snapshotName: `${testCase.image.thankyou_page.full_size}_${envRun}.png`,
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

    await test.step("reload lại trang thank you page->Kiểm tra hiển thị demo image", async () => {
      await campaignSF.page.reload();
      await campaignSF.page.waitForLoadState("networkidle");
      await checkout.page.waitForSelector(checkout.xpathOrderSummarySection);
      await campaignSF.limitTimeWaitAttributeChange(cart.xpathImageInCartDraw, 30);
      await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
      await waitForImageLoaded(campaignSF.page, cart.xpathImageInCartDraw);
      const imageRightInThankyouPage = cartPageV3.getXpathImageProductInCartPageV3(productName, "small");
      await campaignSF.limitTimeWaitAttributeChange(imageRightInThankyouPage, 30);
      await waitForImageLoaded(campaignSF.page, imageRightInThankyouPage);
      // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
      await campaignSF.page.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: campaignSF.page,
        selector: imageRightInThankyouPage,
        snapshotName: `${testCase.image.thankyou_page_reload.demo_image}_right_${envRun}.png`,
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
      await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[1]`, 30);
      await waitForImageLoaded(campaignSF.page, `(${campaignSF.xpathImagePreviewFullSize})[1]`);

      // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
      await campaignSF.page.waitForTimeout(3000);
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
      const isBtnNextPeview = await campaignSF.page.locator(campaignSF.xpathBtnNextInPopupPreview).isVisible();
      if (isBtnNextPeview) {
        await campaignSF.page.click(campaignSF.xpathBtnNextInPopupPreview);
        await campaignSF.limitTimeWaitAttributeChange(`(${campaignSF.xpathImagePreviewFullSize})[2]`, 30);
        await campaignSF.waitForElementVisibleThenInvisible(campaignSF.xpathIconLoading);
        await waitForImageLoaded(campaignSF.page, `(${campaignSF.xpathImagePreviewFullSize})[2]`);
        // chờ cho page ổn định rồi mới chụp ảnh giảm lỗi do verify image
        await campaignSF.page.waitForTimeout(3000);
        await snapshotFixture.verify({
          page: campaignSF.page,
          selector: `(${campaignSF.xpathImagePreviewFullSize})[2]`,
          snapshotName: `${testCase.image.thankyou_page_reload.full_size}_${envRun}_next.png`,
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
});
