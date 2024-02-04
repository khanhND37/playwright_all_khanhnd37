import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { DefaultGetProductAPIParam } from "@constants";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { MyProductPage } from "@pages/shopbase_creator/storefront/my_product";
import { PaymentProviderAPI } from "@pages/api/dpro/payment_provider";

test.describe("Preview content from dashboard", () => {
  let productPage: ProductPage;
  let productAPI: ProductAPI;
  let orderPage: OrderPage;
  let providerId: string;
  let paymentProviderAPI: PaymentProviderAPI;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const providerInfo = conf.suiteConf.payment;
    paymentProviderAPI = new PaymentProviderAPI(conf.suiteConf.domain, authRequest);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    orderPage = new OrderPage(dashboard, conf.suiteConf.domain);
    providerId = await paymentProviderAPI.getProviderID(providerInfo);
    const productListData = conf.caseConf.product_list;
    for (const productItem of productListData) {
      await productAPI.createProduct(productItem.product_body);
      await productPage.navigateToMenu("Products");
      await productPage.clickTitleProduct(productItem.product_body.product.title);
      const requestContent = productItem.request_content;
      const fileUploaded = productItem.files_uploaded;
      const schedule = productItem.schedule;
      const media = productItem.media;

      if (requestContent) {
        const productId = await productPage.getDigitalProductID();
        for (const contentItem of requestContent) {
          const lessonRequest = contentItem.request_lesson;
          const chapterRequest = contentItem.request_chapter;
          chapterRequest.product_id = parseInt(productId);
          const chapterResponse = await productAPI.createChapter(chapterRequest);
          const chapterId = chapterResponse.id;
          for (const lessonItem of lessonRequest) {
            lessonItem.product_id = parseInt(productId);
            lessonItem.lecture.product_id = parseInt(productId);
            lessonItem.lecture.section_id = chapterId;
            await productAPI.createLesson(chapterId, lessonItem);
          }
        }
        if (media) {
          //reload after create lesson with api
          await productPage.page.reload();
          await productPage.switchTab("Content");
          for (const mediaItem of media) {
            await productPage.openLessonDetail(mediaItem.chapter_name, mediaItem.lesson_name);
            await productPage.page.waitForTimeout(2 * 1000);
            await productPage.uploadFileOrMedia(mediaItem.type_file, mediaItem.path_file);
            await productPage.waitForUpload();
            await productPage.waitForMedia();
            await productPage.clickBackScreen();
          }
        }
      }

      if (fileUploaded) {
        await productPage.switchTab("Content");
        for (const fileItem of fileUploaded) {
          await productPage.uploadFileOrMedia(fileItem.type_file, fileItem.file_path, fileItem.product_type);
          await productPage.waitForUpload();
        }
      }

      if (schedule) {
        await productPage.inputSchedule(schedule.schedule_type, schedule.schedule);
        await productPage.clickSaveBar();
      }
    }
    await productPage.navigateToMenu("Products");
  });

  test.afterEach(async () => {
    const products = await productAPI.getProducts(DefaultGetProductAPIParam);
    const productIds = products.data.map(item => item.id);
    await productAPI.deleteProduct(productIds);
    await paymentProviderAPI.deleteProvider(providerId);
  });

  test(`Kiểm tra duplicate product với các type product @SB_SC_SCP_60`, async ({ conf }) => {
    const productList = conf.caseConf.product_list;
    let duplicateProduct: string;
    for (const productItem of productList) {
      await test.step(`Mở màn hình product detail > Click button "..." > Chọn action "Duplicate"`, async () => {
        await productPage.navigateToMenu("Products");
        await productPage.clickTitleProduct(productItem.product_body.product.title);
        await productPage.selectMoreActionOnProdDetail("Duplicate");
        expect(await productPage.getTextOfToast("success")).toEqual(
          "Product is being duplicated. Please wait for a while",
        );
      });

      await test.step(`Click "Products" trên menu bar > Xác nhận trạng thái duplicate của product`, async () => {
        await productPage.navigateToMenu("Products");
        duplicateProduct = `Copy of ${productItem.product_body.product.title}`;
        await expect(productPage.genLoc(productPage.getXpathProductName(duplicateProduct))).toBeVisible();
        expect(await productPage.getTextContent(productPage.getXpathStatusOnProductList(duplicateProduct))).toEqual(
          "unpublished",
        );
      });

      await test.step(`So sánh thông tin product detail của product duplicate với product gốc`, async () => {
        await productPage.clickTitleProduct(duplicateProduct);

        if (productItem.request_content) {
          await productPage.switchTab("Content");
          for (const lessonItem of productItem.request_content[0].request_lesson) {
            const chapter = productItem.request_content[0].request_chapter;
            await expect(productPage.getXpathLesson(chapter.title, lessonItem.lecture.title)).toBeVisible();
          }
        }

        if (productItem.files_uploaded) {
          await productPage.switchTab("Content");
          for (const fileItem of productItem.files_uploaded) {
            await expect(productPage.getXpathAttachmentName(fileItem.file_name)).toBeVisible();
          }
        }

        if (productItem.schedule) {
          expect(await productPage.genLoc(productPage.xpathInputSchedule).inputValue()).toEqual(
            productItem.schedule.schedule,
          );
        }

        if (productItem.media) {
          await productPage.switchTab("Content");
          await productPage.openLessonDetail("Test chapter 1", "Test lesson 1");
          await expect(productPage.genLoc(productPage.xpathMedia)).toBeVisible();
        }
      });
    }
  });

  test(`Verify offer upsell tại product mới sau khi thực hiện duplicate product gốc @SB_SC_SCP_63`, async ({
    context,
    conf,
  }) => {
    const pricing = conf.caseConf.pricing;
    const productName = conf.caseConf.product_list[0].product_body.product.title;
    const productDuplicate = `Copy of ${productName}`;
    await productPage.navigateToMenu("Products");
    await productPage.clickTitleProduct(productName);
    await productPage.switchTab("Pricing");
    await productPage.page.waitForSelector(productPage.xpathPricingType);
    await productPage.settingPricingTab(pricing.type, pricing.title, pricing.value);
    await productPage.page.waitForSelector(productPage.xpathToastMsg);

    const productOffers = conf.caseConf.products_offer;
    for (const offerItem of productOffers) {
      await productPage.switchTab("Checkout");
      await productPage.clickBtnAddUpsell(offerItem.button_text);
      await productPage.searchAndSelectProductUpsell(offerItem.product_upsell_name);
      await productPage.clickBtnOnPopup(offerItem.button_save);
      await productPage.clickBtnSelectProductDownSell(offerItem.product_upsell_name);
      await productPage.searchAndSelectProductUpsell(offerItem.product_downsell_name);
      await productPage.clickBtnOnPopup(offerItem.button_save);
      await productPage.clickSaveGeneral();
    }

    await test.step(`Mở màn hình product detail > Click button "..." > Chọn action "Duplicate"`, async () => {
      await productPage.selectMoreActionOnProdDetail("Duplicate");
      expect(await productPage.getTextOfToast("success")).toEqual(
        "Product is being duplicated. Please wait for a while",
      );
    });

    await test.step(`Tại màn list : product Search Copy of product A  ->click vào product để mở detail
  Tại tab checkout Verify offer của product`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.clickTitleProduct(productDuplicate);
      await productPage.switchTab("Checkout");
      for (const offerItem of productOffers) {
        await expect(productPage.getXpathOfferWithName(offerItem.product_upsell_name)).toBeVisible();
        await expect(productPage.getXpathOfferWithName(offerItem.product_downsell_name)).toBeVisible();
      }
    });

    await test.step(`Verify status của list offer upsell `, async () => {
      for (const offerItem of productOffers) {
        expect(await productPage.getStatusOffer(offerItem.product_upsell_name)).toEqual("Inactive");
      }
    });

    await test.step(`Click toggle turn on product của Product Upsell 01 -> Verify thông tin hiển thị `, async () => {
      await productPage.clickToggleStatusUpsell("Product Upsell 01");
      await expect(productPage.genLoc(productPage.xpathHeaderPopUp)).toBeVisible();
    });

    await test.step(`Thực hiện design offer theo data -> Click button save `, async () => {
      await productPage.applyDesignOffer(conf.caseConf.button_name, conf.suiteConf.theme_name);
      //wait để active offer upsell tiếp theo không hiển thị popup apply theme
      await productPage.page.waitForTimeout(3 * 1000);
      expect(await productPage.getStatusOffer("Product Upsell 01")).toEqual("Active");
    });

    await test.step(`Thực hiện turn on all product offer trong list`, async () => {
      for (const offerItem of productOffers) {
        const popup = await productPage.genLoc(productPage.xpathHeaderPopUp).isVisible();
        if ((await productPage.getStatusOffer(offerItem.product_upsell_name)) === "Inactive") {
          await productPage.clickToggleStatusUpsell(offerItem.product_upsell_name);
          if (popup) {
            await productPage.clickBtnOnPopup("Cancel");
          }
        }

        if ((await productPage.getStatusOffer(offerItem.product_downsell_name)) === "Inactive") {
          await productPage.clickToggleStatusUpsell(offerItem.product_downsell_name);
          if (popup) {
            await productPage.clickBtnOnPopup("Cancel");
          }
        }
        expect(await productPage.getStatusOffer(offerItem.product_downsell_name)).toEqual("Active");
        expect(await productPage.getStatusOffer(offerItem.product_upsell_name)).toEqual("Active");
      }
      await productPage.clickSaveGeneral();
    });

    await test.step(`Thực hiện pushlish product : Copy Product A
    thực hiện checkout product A  -> Checkout các product upsell  theo data
    -> Verify thông tin hiển thị tại màn thankyou page`, async () => {
      await productPage.clickOnBtnWithLabel("Publish");
      const upsellCheckout = conf.caseConf.data_checkout;
      for (const checkoutItem of upsellCheckout) {
        await productPage.navigateToMenu("Products");
        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          await productPage.clickToViewSF(productDuplicate, "Preview sales page"),
        ]);
        const checkoutPage = new CheckoutForm(sfTab, conf.suiteConf.domain);
        await checkoutPage.enterEmail(conf.caseConf.email);
        await checkoutPage.completeOrderWithMethod("Stripe");
        await expect(checkoutPage.genLoc(checkoutPage.xpathBtnAccectProdUpsell)).toBeVisible();
        for (let i = 0; i < checkoutItem.accept_reject_product_upsell.length; i++) {
          await checkoutPage.acceptOrRejectProdUpsell(checkoutItem.accept_reject_product_upsell[i]);
          await expect(checkoutPage.genLoc(checkoutPage.xpathBtnLoading)).toBeHidden();
        }
        await expect(checkoutPage.genLoc(checkoutPage.xpathThankYouPageHeader)).toBeVisible();

        //veriy line item on order
        await productPage.navigateToMenu("Orders");
        await orderPage.openNewestOrder();
        const productCheckout = checkoutItem.products_checkout;
        for (const productItem of productCheckout) {
          const xpathProductUpsell = orderPage.getLocatorProductOrder(productItem);
          await expect(xpathProductUpsell).toBeVisible();
        }
      }
    });
  });

  test(`Kiểm tra duplicate chapter/lesson của product online course @SB_SC_SCP_62`, async ({ conf }) => {
    const attachments = conf.caseConf.attachments;
    const lessonData = conf.caseConf.lesson_list;
    const productName = conf.caseConf.product_list[0].product_body.product.title;
    const chapterDuplicate = "Copy of Chapter 1";
    await productPage.clickTitleProduct(productName);
    await productPage.switchTab("Content");
    await productPage.openLessonDetail(attachments.chapter_name, attachments.lesson_name);
    for (const fileItem of attachments.files_uploaded) {
      await productPage.uploadFileOrMedia(fileItem.type_file, fileItem.file_path);
      await productPage.waitForUpload();
    }
    await productPage.clickBackScreen();

    await test.step(`Click button "..." của "Chapter 1" > Chọn action "Duplicate"`, async () => {
      await productPage.getXpathActionChapterOrLesson("more_actions", "Chapter 1").click();
      await productPage.selectActionOfChapterOrLesson("Duplicate");
      expect(await productPage.getTextOfToast("success")).toEqual(
        "Chapter is being duplicated. Please wait for a while",
      );
      await expect(productPage.genLoc(productPage.getXpathWithLabel(chapterDuplicate))).toBeVisible();
      expect(await productPage.getXpathActionChapterOrLesson("status", chapterDuplicate).textContent()).toEqual(
        " Unpublished ",
      );
    });

    await test.step(`So sánh thông tin chapter detail của chapter duplicate với chapter gốc`, async () => {
      await productPage.clickToExpandChapter(chapterDuplicate);
      await expect(productPage.getXpathLesson(chapterDuplicate, "Lesson 1")).toBeVisible();
      await expect(productPage.getXpathLesson(chapterDuplicate, "Lesson 2")).toBeVisible();
      await expect(productPage.getXpathLesson(chapterDuplicate, "Lesson 3")).toBeVisible();
    });

    await test.step(`Click button "..." của lần lượt các lesson trong test data > Chọn action "Duplicate"`, async () => {
      for (const lessonItem of lessonData) {
        await productPage.getXpathActionChapterOrLesson("more_actions", "Chapter 1", lessonItem).click();
        await productPage.selectActionOfChapterOrLesson("Duplicate");
        await expect(productPage.genLoc(productPage.getXpathWithLabel(`Copy of ${lessonItem}`))).toBeVisible();
        expect(
          await productPage.getXpathActionChapterOrLesson("status", "Chapter 1", `Copy of ${lessonItem}`).textContent(),
        ).toEqual(" Unpublished ");
      }
    });

    await test.step(`So sánh thông tin lesson detail của lesson duplicate với lesson gốc`, async () => {
      for (const lessonItem of lessonData) {
        await productPage.openLessonDetail("Chapter 1", `Copy of ${lessonItem}`);
        if (lessonItem === "Lesson 2") {
          await expect(productPage.genLoc(productPage.xpathMedia)).toBeVisible();
          for (const fileItem of attachments.files_uploaded) {
            await expect(productPage.getXpathAttachmentName(fileItem.file_name)).toBeVisible();
          }
        } else if (lessonItem === "Lesson 1") {
          await expect(productPage.genLoc(productPage.xpathMedia)).toBeVisible();
        }
        await productPage.clickBackScreen();
      }
    });
  });

  test(`Verify Lesson khi thực hiện các action: view, delete, pushlished, unpushlished, share, duplicate @SB_SC_SCP_77`, async ({
    conf,
    context,
  }) => {
    const productName = conf.caseConf.product_list[0].product_body.product.title;
    const chapter = conf.caseConf.product_list[0].request_content[0].request_chapter;
    const lesson = conf.caseConf.product_list[0].request_content[0].request_lesson[0].lecture;
    const lessonPreview = conf.caseConf.product_list[0].request_content[0].request_lesson[1].lecture;
    const actionList = conf.caseConf.action_list;
    let productId: string;
    let productSf: MyProductPage;

    await test.step(`Tại Lesson_01 click vào icon con mắt -> Verify thông tin hiển thị`, async () => {
      await productPage.clickTitleProduct(productName);
      productId = await productPage.getDigitalProductID();
      await productPage.switchTab("Content");
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.getXpathActionChapterOrLesson("view", chapter.title, lesson.title).click(),
      ]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain);
      const productPreviewUrl = `https://${conf.suiteConf.domain}/my-products/courses/${productId}?preview_course=true`;
      await expect(productSf.getXpathLessonFocused(lesson.title)).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Tại Lesson_01 click vào icon menu -> Verify thông tin hiển thị`, async () => {
      await productPage.getXpathActionChapterOrLesson("more_actions", chapter.title, lesson.title).click();
      await expect(productPage.getXpathOptionWithLabel("Unpublish")).toBeVisible();
      await expect(productPage.getXpathOptionWithLabel("Share")).toBeVisible();
      await expect(productPage.getXpathOptionWithLabel("Duplicate")).toBeVisible();
      await expect(productPage.getXpathOptionWithLabel("Delete")).toBeVisible();
      //click lần 2 để close dropdown
      await productPage.getXpathActionChapterOrLesson("more_actions", chapter.title, lesson.title).click();
    });

    await test.step(`Thực hiện click vào các option theo data- > Verify thông tin hiển thị Lesson_01 và Lesson_02`, async () => {
      for (const actionItem of actionList) {
        await productPage.getXpathActionChapterOrLesson("more_actions", chapter.title, lesson.title).click();
        await productPage.selectActionOfChapterOrLesson(actionItem);
        switch (actionItem) {
          case "Unpublish":
            expect(await productPage.getTextOfToast("success")).toEqual("Unpublished lesson successfully.");
            expect(
              await productPage.getXpathActionChapterOrLesson("status", chapter.title, lesson.title).textContent(),
            ).toEqual(" Unpublished ");
            await expect(productPage.genLoc(productPage.xpathToastMsg)).not.toBeVisible();
            break;
          case "Share":
            expect(await productPage.getTextOfToast("success")).toEqual("Copied lesson URL to clipboard.");
            break;
          case "Duplicate":
            await expect(productPage.genLoc(productPage.getXpathWithLabel(`Copy of ${lesson.title}`))).toBeVisible();
            expect(
              await productPage
                .getXpathActionChapterOrLesson("status", chapter.title, `Copy of ${lesson.title}`)
                .textContent(),
            ).toEqual(" Unpublished ");
            break;
          case "Delete":
            await expect(productPage.genLoc(productPage.getXpathWithLabel(lesson.title))).not.toBeVisible();
            break;
        }
      }
    });

    await test.step(`1. Thực hiện checkout Product A ngoài SF ->Login vào màn My product của buyer -> Click vào Product A để mở detail
    2. Verify thông tin của Lesson_01 và Lesson_02 hiển thị`, async () => {
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickToViewFromDetail("Preview content as member"),
      ]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain);
      const productPreviewUrl = `https://${conf.suiteConf.domain}/my-products/courses/${productId}?preview_course=true`;
      await expect(productSf.getXpathLessonFocused(lesson.title)).not.toBeVisible();
      await expect(productSf.getXpathLessonFocused(lessonPreview.title)).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });
  });

  test(`Verify chapter khi thực hiện các action: view, delete, pushlished, unpushlished, share, duplicate @SB_SC_SCP_71`, async ({
    context,
    conf,
  }) => {
    const productName = conf.caseConf.product_list[0].product_body.product.title;
    const chapter = conf.caseConf.product_list[0].request_content[0].request_chapter;
    const lesson = conf.caseConf.product_list[0].request_content[0].request_lesson[0].lecture;
    const actionList = conf.caseConf.action_list;
    let productId: string;
    let productSf: MyProductPage;

    await test.step(`Tại Chapter 01 click vào icon con mắt -> Verify thông tin hiển thị`, async () => {
      await productPage.clickTitleProduct(productName);
      productId = await productPage.getDigitalProductID();
      await productPage.switchTab("Content");
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.getXpathActionChapterOrLesson("view", chapter.title).click(),
      ]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain);
      const productPreviewUrl = `https://${conf.suiteConf.domain}/my-products/courses/${productId}?preview_course=true`;
      await expect(productSf.getXpathLessonFocused(lesson.title)).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Tại section_01 click vào icon menu -> Verify thông tin hiển thị`, async () => {
      await productPage.getXpathActionChapterOrLesson("more_actions", chapter.title).click();
      await expect(productPage.getXpathOptionWithLabel("Unpublish")).toBeVisible();
      await expect(productPage.getXpathOptionWithLabel("Share")).toBeVisible();
      await expect(productPage.getXpathOptionWithLabel("Duplicate")).toBeVisible();
      await expect(productPage.getXpathOptionWithLabel("Delete")).toBeVisible();
      //click lần 2 để close dropdown
      await productPage.getXpathActionChapterOrLesson("more_actions", chapter.title).click();
    });

    await test.step(`Thực hiện click vào các option theo data- > Verify thông tin hiển thị Chapter 01 và Chapter 02`, async () => {
      for (const actionItem of actionList) {
        await productPage.getXpathActionChapterOrLesson("more_actions", chapter.title).click();
        await productPage.selectActionOfChapterOrLesson(actionItem);
        switch (actionItem) {
          case "Unpublish":
            expect(await productPage.getTextOfToast("success")).toEqual("Unpublished chapter successfully.");
            expect(await productPage.getXpathActionChapterOrLesson("status", chapter.title).textContent()).toEqual(
              " Unpublished ",
            );
            await expect(productPage.genLoc(productPage.xpathToastMsg)).not.toBeVisible();
            break;
          case "Share":
            expect(await productPage.getTextOfToast("success")).toEqual("Copied chapter URL to clipboard.");
            break;
          case "Duplicate":
            await expect(productPage.genLoc(productPage.getXpathWithLabel(`Copy of ${chapter.title}`))).toBeVisible();
            expect(
              await productPage.getXpathActionChapterOrLesson("status", `Copy of ${chapter.title}`).textContent(),
            ).toEqual(" Unpublished ");
            break;
          case "Delete":
            await expect(productPage.genLoc(productPage.getXpathWithLabel(chapter.title))).not.toBeVisible();
            break;
        }
      }
    });

    await test.step(`Click button "..." của "Product A" > Click "Preview content as member" > Verify thông tin hiển thị`, async () => {
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickToViewFromDetail("Preview content as member"),
      ]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain);
      const productPreviewUrl = `https://${conf.suiteConf.domain}/my-products/courses/${productId}?preview_course=true`;
      await expect(productSf.getXpathLessonFocused(chapter.title)).not.toBeVisible();
      await expect(productSf.getXpathLessonFocused("Test lesson 3: Xpath and element")).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });
  });
});
