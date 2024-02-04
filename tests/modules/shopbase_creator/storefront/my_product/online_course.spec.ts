import { DefaultGetProductAPIParam } from "@constants";
import { expect, test } from "@core/fixtures";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { CreatorCheckoutAPI } from "@pages/shopbase_creator/storefront/checkout_api";
import { MyProductPage } from "@pages/shopbase_creator/storefront/my_product";

test.describe(`Kiểm tra chức năng My product Page`, async () => {
  let productPage: ProductPage;
  let productAPI: ProductAPI;
  let checkoutAPI: CreatorCheckoutAPI;
  let myProductPage: MyProductPage;
  let orderPage: OrderPage;
  let productDataList;
  let sfTab;

  test.beforeEach(async ({ dashboard, conf, authRequest, context }) => {
    test.setTimeout(conf.suiteConf.time_out);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    orderPage = new OrderPage(dashboard, conf.suiteConf.domain);

    //Create product with api
    productDataList = conf.suiteConf.product_request;
    for (const productItem of productDataList) {
      const productResponse = await productAPI.createProduct(productItem.product_body);
      await productPage.navigateToMenu("Products");
      await productPage.clickTitleProduct(productItem.product_body.product.title);
      const requestContent = productItem.request_content;
      const productId = await productPage.getDigitalProductID();

      if (requestContent) {
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
      }

      const productsCheckout = conf.suiteConf.products_checkout;
      const variantId = productResponse.data.product.variant_offers[0].variant_id;
      await productPage.navigateToMenu("Products");
      productsCheckout.cartItem.variant_id = variantId;
      const customerInfo = conf.suiteConf.customer_info;
      checkoutAPI = new CreatorCheckoutAPI(conf.suiteConf.domain, authRequest);
      await checkoutAPI.createAnOrderCreator(productsCheckout, customerInfo);
      await productPage.navigateToMenu("Orders");
      await orderPage.waitForFirstOrderStatus("paid");
    }

    //Login to acc user
    sfTab = await context.newPage();
    myProductPage = new MyProductPage(sfTab, conf.suiteConf.domain);
    await myProductPage.login(conf.suiteConf.member_email, conf.suiteConf.member_password);
  });

  test.afterEach(async () => {
    const products = await productAPI.getProducts(DefaultGetProductAPIParam);
    const productIds = products.data.map(item => item.id);
    await productAPI.deleteProduct(productIds);
  });

  test(`my_product_detail - course - Kiểm tra hoàn thành khóa học khi click button Complete and Continue @SB_SC_SCSF_SCSP_53`, async ({
    conf,
  }) => {
    const config = conf.caseConf;
    const media = config.media;
    await productPage.navigateToMenu("Products");
    await productPage.clickTitleProduct(config.product_lesson);
    await productPage.switchTab("Content");
    await productPage.openLessonDetail(config.chapter_final, config.lesson_final);
    await productPage.uploadFileOrMedia(media.type_file, media.path_file);
    await productPage.waitForMedia();

    await test.step(`Click lesson cuối cùng của chapter cuối cùng ở sidebar.`, async () => {
      await myProductPage.clickOpenContent(config.product_lesson);
      await myProductPage.selectLesson(config.chapter_final, config.lesson_final);
      await expect(myProductPage.genLoc(myProductPage.xpathImageLessonMedia)).toBeVisible();
    });

    await test.step(`Click button Complete and Continue.`, async () => {
      await myProductPage.clickBtnComplete();
      await expect(myProductPage.genLoc(myProductPage.xpathCompleteButton)).toBeVisible();
      expect(await myProductPage.getTextContent(myProductPage.xpathCompleteProgress)).toEqual("17% complete");
    });

    await test.step(`1. Collapse chapter 2 -> click vào lesson cuối cùng của chapter 1 -> click btn Complete and Continue
    2. Collapse chapter 1 -> click btn Previous lesson khi đang ở lesson đầu tiên của chapter 2`, async () => {
      await myProductPage.selectLesson("Test chapter 1", "Test lesson 3");
      await myProductPage.clickBtnComplete();
      await expect(
        myProductPage.getXpathTitlePreview("Take good care of day-to-day listings, inventory, orders & more."),
      ).toBeVisible();
      await myProductPage.collapseChapter("Test chapter 1");
      await myProductPage.clickBtnPreviewLesson();
      await expect(myProductPage.getXpathTitlePreview("Test lesson 3")).toBeVisible();
    });

    await test.step(`Thực hiện complete hết tất cả các lesson:
    1.Lần lượt click button Complete and Continue của từng lesson chưa được hoàn thành đến khi tất cả các lesson của khóa học đều được đánh dấu là hoàn thành -> Kiểm tra hiển thị màn Complete course.
    2. Click button: View other products`, async () => {
      await myProductPage.completePartOfCourse(4);
      await expect(myProductPage.genLoc(myProductPage.xpathCompleteCourse)).toBeVisible();
      await myProductPage.genLoc(myProductPage.xpathBtnViewOrtherProduct).click();
      await expect(myProductPage.genLoc(myProductPage.xpathHeaderMyProduct)).toBeVisible();
    });

    await test.step(`Click vào 1 lesson ở sidebar:
    1. Vào lại detail course trên -> click lesson đầu tiên của chapter đầu tiên
    2. Click lesson cuối cùng của chapter cuối cùng
    3. Click lesson bất kì khác lesson đầu tiên của chapter đầu tiên và lesson cuối cùng của chapter cuối cùng`, async () => {
      await myProductPage.clickOpenContent(config.product_lesson);
      const lessonList = config.view_lesson;
      for (const lessonItem of lessonList) {
        await myProductPage.selectLesson(lessonItem.chapter_title, lessonItem.lesson_title);
        if (lessonItem.previous === true) {
          await expect(myProductPage.genLoc(myProductPage.xpathPreviewButton)).toBeVisible();
        } else if (lessonItem.next == true) {
          await expect(myProductPage.genLoc(myProductPage.xpathNextButton)).toBeVisible();
        } else {
          await expect(myProductPage.genLoc(myProductPage.xpathPreviewButton)).toBeVisible();
          await expect(myProductPage.genLoc(myProductPage.xpathNextButton)).toBeVisible();
        }
      }
    });
  });
});
