import { DefaultGetProductAPIParam } from "@constants";
import { expect, test } from "@core/fixtures";
import { OrderPage } from "@pages/shopbase_creator/dashboard/order";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { CheckoutForm } from "@pages/shopbase_creator/storefront/checkout";
import { MyProductPage } from "@pages/shopbase_creator/storefront/my_product";

test.describe(`Kiểm tra chức năng My product Page`, async () => {
  let productPage: ProductPage;
  let productAPI: ProductAPI;
  let checkoutPage: CheckoutForm;
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
    productDataList = conf.suiteConf.products;
    for (let i = 0; i < productDataList.length; i++) {
      await productAPI.createProduct(productDataList[i]);
    }
    await productPage.navigateToMenu("Products");

    if (conf.caseConf.checkout === true) {
      // checkout with each product
      for (let i = 0; i < productDataList.length; i++) {
        sfTab = await context.newPage();
        myProductPage = new MyProductPage(sfTab, conf.suiteConf.domain);
        checkoutPage = new CheckoutForm(sfTab, conf.suiteConf.domain);
        await myProductPage.goto("/collections/all");
        await myProductPage.clickOpenSalesPage(productDataList[i].product.title);
        await checkoutPage.enterEmail("phuongnguyen4@beeketing.net");
        await checkoutPage.clickBtnCompleteOrder();
      }
      await orderPage.navigateToMenu("Orders");
      await orderPage.waitForFirstOrderStatus("paid");

      //Login to acc user
      await myProductPage.login(conf.suiteConf.member_email, conf.suiteConf.member_password);
    }
  });

  test.afterEach(async () => {
    const products = await productAPI.getProducts(DefaultGetProductAPIParam);
    const productIds = products.data.map(item => item.id);
    await productAPI.deleteProduct(productIds);
  });

  test(`[My product] Kiểm tra UI UX trang My product @SB_SC_SCSF_SCSP_9`, async ({ conf }) => {
    const userAcc = conf.caseConf.account;

    await test.step(`Kiểm tra thông tin trên trang My product`, async () => {
      await myProductPage.goto("/my-products");
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("My products"))).toBeVisible();
      for (let i = 0; i < productDataList.length; i++) {
        await expect(
          myProductPage.genLoc(myProductPage.getXpathWithLabel(`${productDataList[i].product.title}`)),
        ).toBeVisible();
      }
      expect(await myProductPage.genLoc(myProductPage.xpathProductType).count()).toEqual(productDataList.length);
    });

    await test.step(`Đăng nhập lại bằng account buyer chưa mua prodouct nào > Click "My product" trên Menu`, async () => {
      await myProductPage.logOut();
      await myProductPage.login(userAcc.member_email, userAcc.member_password);
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("Explore all products"))).toBeVisible();
    });

    await test.step(`Buyer thực hiện check out với product "Test my product page" > Đi vào trang My product`, async () => {
      await myProductPage.goto("/collections/all");
      await myProductPage.clickOpenSalesPage(conf.caseConf.product.title);
      await checkoutPage.enterEmail("ocg@beeketing.net");
      await checkoutPage.clickBtnCompleteOrder();
      await productPage.goto("/admin/creator/orders");
      await orderPage.waitForFirstOrderStatus("paid");
      await myProductPage.goto("/my-products");
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel(conf.caseConf.product.title))).toBeVisible();
    });

    await test.step(`Thực hiện xóa product "Test my product page" trong dashboard
    > Kiểm tra số lượng product ở trang My product của member vừa bị xóa product`, async () => {
      const products = await productAPI.getProducts(DefaultGetProductAPIParam);
      const productIds = products.data.map(item => item.id);
      await productAPI.deleteProduct(productIds);
      await myProductPage.goto("/my-products");
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("Explore all products"))).toBeVisible();
    });
  });

  test(`[My product] Kiểm tra chức năng sort product trên trang My product @SB_SC_SCSF_SCSP_10`, async ({
    conf,
    snapshotFixture,
  }) => {
    const sortOption = conf.caseConf.sort_by;
    await test.step(`Mở màn hình My products`, async () => {
      await myProductPage.goto("/my-products");
      await expect(myProductPage.genLoc(myProductPage.getXpathWithLabel("My products"))).toBeVisible();
      expect(await myProductPage.genLoc("//select").inputValue()).toEqual("created_at:desc");
      await snapshotFixture.verify({
        page: sfTab,
        selector: myProductPage.xpathMyProductsList,
        snapshotName: conf.caseConf.picture,
      });
    });

    await test.step(`Trên menu bar, click dropdown button "Sort" > Select lần lượt các option sort`, async () => {
      for (let i = 0; i < sortOption.length; i++) {
        await myProductPage.selectSortOption(sortOption[i].selected_sort);
        const productSort = sortOption[i].product_sorted;
        for (let j = 0; j < productSort.length; j++) {
          expect(await myProductPage.getTextContent(myProductPage.getXpathTitleWithIndex(`${j + 1}`))).toEqual(
            productSort[j].product_name,
          );
        }
      }
    });
  });

  test(`[My product] Kiểm tra thông tin trên một Online course products card @SB_SC_SCSF_SCSP_11`, async ({ conf }) => {
    await test.step(`Click button My products trên header> Verify thông tin trên một Online course products card`, async () => {
      expect(
        await myProductPage.getTextContent(myProductPage.getXpathProgressProduct("Digital Product Online Course")),
      ).toEqual("0% complete");
    });

    await test.step(`Chọn 1 product mà member chưa hoàn thành lecture nào, seller thực hiện edit course (VD: thêm lecture)`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.clickTitleProduct("Digital Product Online Course");
      const productId = await productPage.getDigitalProductID();
      conf.caseConf.request_chapter.product_id = parseInt(productId);
      conf.caseConf.request_lesson.lecture.product_id = parseInt(productId);
      const chapterResponse = await productAPI.createChapter(conf.caseConf.request_chapter);
      const chapterId = chapterResponse.id;
      conf.caseConf.request_lesson.lecture.section_id = chapterId;
      await productAPI.createLesson(chapterId, conf.caseConf.request_lesson);
      expect(
        await myProductPage.getTextContent(myProductPage.getXpathProgressProduct("Digital Product Online Course")),
      ).toEqual("0% complete");
    });

    await test.step(`Verify thông tin progress bar của course ở trang My product`, async () => {
      expect(
        await myProductPage.getTextContent(myProductPage.getXpathProgressProduct("Digital Product Online Course")),
      ).toEqual("0% complete");
    });

    await test.step(`Chọn 1 product mà member đã hoàn thành khoá học, seller thực hiện edit course (VD: thêm lecture)`, async () => {
      await myProductPage.clickOpenContent("Digital Product Online Course");
      await myProductPage.completeCourse();
      const productId = await productPage.getDigitalProductID();
      conf.caseConf.request_chapter.product_id = parseInt(productId);
      conf.caseConf.request_lesson.lecture.product_id = parseInt(productId);
      const chapterResponse = await productAPI.createChapter(conf.caseConf.request_chapter);
      const chapterId = chapterResponse.id;
      conf.caseConf.request_lesson.lecture.section_id = chapterId;
      await productAPI.createLesson(chapterId, conf.caseConf.request_lesson);
      await myProductPage.clickToBackMyProduct();
      await test.step(`Verify thông tin progress bar của course ở trang My product`, async () => {
        expect(
          await myProductPage.getTextContent(myProductPage.getXpathProgressProduct("Digital Product Online Course")),
        ).toEqual("50% complete");
      });
    });

    await test.step(`Chọn 1 product mà member đang trong quá trình học, seller thực hiện edit course (VD: thêm lecture) đó`, async () => {
      await myProductPage.clickOpenContent("Digital Product Online Course");
      await myProductPage.completeCourse();
      const productId = await productPage.getDigitalProductID();
      conf.caseConf.request_chapter.product_id = parseInt(productId);
      conf.caseConf.request_lesson.lecture.product_id = parseInt(productId);
      const chapterResponse = await productAPI.createChapter(conf.caseConf.request_chapter);
      const chapterId = chapterResponse.id;
      conf.caseConf.request_lesson.lecture.section_id = chapterId;
      await productAPI.createLesson(chapterId, conf.caseConf.request_lesson);
      await myProductPage.clickToBackMyProduct();
      await test.step(`Verify thông tin progress bar của course ở trang My product`, async () => {
        expect(
          await myProductPage.getTextContent(myProductPage.getXpathProgressProduct("Digital Product Online Course")),
        ).toEqual("67% complete");
      });
    });
  });

  test(`Verify preview product Online course @SB_SC_SCSF_SCSP_23`, async ({ conf, context }) => {
    await productPage.navigateToMenu("Products");
    await productPage.clickTitleProduct("Digital Product Online Course");
    const lessonRequest = conf.caseConf.request_lessons;
    const productId = await productPage.getDigitalProductID();
    conf.caseConf.request_chapter.product_id = parseInt(productId);
    const chapterResponse = await productAPI.createChapter(conf.caseConf.request_chapter);
    const chapterId = chapterResponse.id;
    for (const chapterItem of lessonRequest) {
      chapterItem.lecture.product_id = parseInt(productId);
      chapterItem.lecture.section_id = chapterId;
      await productAPI.createLesson(chapterId, chapterItem);
    }
    let numberOfLesson: number;

    await test.step(`Click option Preview content as member của product "Digital Product Online Course" > Click vào lecture đầu tiên`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.clickToViewSF("Digital Product Online Course", "Preview content as member");
      const [newPage] = await Promise.all([context.waitForEvent("page")]);
      myProductPage = new MyProductPage(newPage, conf.suiteConf.domain);
      await myProductPage.genLoc(`(${myProductPage.xpathLessonItem})[1]`).click();
      await expect(myProductPage.genLoc(myProductPage.xpathCompleteButton)).toBeVisible();
    });

    await test.step(`Click các lecture lần lượt từ lecture thứ 2`, async () => {
      numberOfLesson = await myProductPage.genLoc(`${myProductPage.xpathLessonItem}`).count();
      for (let i = 2; i <= numberOfLesson; i++) {
        await myProductPage.genLoc(`(${myProductPage.xpathLessonItem})[${i}]`).click();
        await expect(myProductPage.genLoc(myProductPage.xpathCompleteButton)).toBeVisible();
        await expect(myProductPage.genLoc(myProductPage.xpathPreviewButton)).toBeVisible();
      }
    });

    await test.step(`Click lại lecture đầu tiên, click btn Complete and Continue lần lượt các lecture còn lại`, async () => {
      await myProductPage.completeCourse();
      await expect(myProductPage.genLoc(myProductPage.xpathCompleteCourse)).toBeVisible();
    });

    await test.step(`Click lại vào các lecture`, async () => {
      for (let i = 1; i <= numberOfLesson; i++) {
        await myProductPage.genLoc(`(${myProductPage.xpathLessonItem})[${i}]`).click();
        if (i === 1) {
          await expect(myProductPage.genLoc(myProductPage.xpathNextButton)).toBeVisible();
        } else if (i === numberOfLesson) {
          await expect(myProductPage.genLoc(myProductPage.xpathPreviewButton)).toBeVisible();
        } else {
          await expect(myProductPage.genLoc(myProductPage.xpathNextButton)).toBeVisible();
          await expect(myProductPage.genLoc(myProductPage.xpathPreviewButton)).toBeVisible();
        }
      }
    });
  });

  test(`[Online course] Kiểm tra next/previous đúng lesson khi course có chapter trống đứng giữa 2 chapter @SB_SC_SCSF_SCSP_21`, async ({
    conf,
  }) => {
    await productPage.navigateToMenu("Products");
    await productPage.clickTitleProduct("Digital Product Online Course");
    const lessonRequest = conf.caseConf.request_lessons;
    const chapterRequest = conf.caseConf.request_chapters;
    const productId = await productPage.getDigitalProductID();
    chapterRequest.product_id = parseInt(productId);
    for (const chapterItem of chapterRequest) {
      chapterItem.product_id = parseInt(productId);
      if (
        chapterItem.title === "Chapter 1: Playwright for beginner" ||
        chapterItem.title === "Chapter 4: How to config CI/CD"
      ) {
        const chapterResponse = await productAPI.createChapter(chapterItem);
        const chapterId = chapterResponse.id;
        for (const lessonItem of lessonRequest) {
          lessonItem.lecture.product_id = parseInt(productId);
          lessonItem.lecture.section_id = chapterId;
          await productAPI.createLesson(chapterId, lessonItem);
        }
      } else {
        await productAPI.createChapter(chapterItem);
      }
    }

    await test.step(`Ở sidebar, click vào lesson cuối cùng của chapter Section 2`, async () => {
      await myProductPage.clickOpenContent("Digital Product Online Course");
      await myProductPage.selectLesson("Chapter 1: Playwright for beginner", "Lesson 4: Compare expect with api");
      await expect(myProductPage.getXpathTitlePreview("Lesson 4: Compare expect with api")).toBeVisible();
    });

    await test.step(`Click button Complete and Continue`, async () => {
      await myProductPage.clickBtnComplete();
      await expect(myProductPage.getXpathTitlePreview("Lesson 1: Async/Await")).toBeVisible();
    });

    await test.step(`Click btn Previous lesson`, async () => {
      await myProductPage.clickBtnPreviewLesson();
      await expect(myProductPage.getXpathTitlePreview("Lesson 4: Compare expect with api")).toBeVisible();
    });

    await test.step(`Ở side bar, click vào lesson cuối cùng của course -> click vào btn Previouse lesson`, async () => {
      await myProductPage.selectLesson("Chapter 4: How to config CI/CD", "Lesson 4: Compare expect with api");
      const lessonVerify = conf.caseConf.lessons_verify;
      for (let i = lessonVerify; i > 0; i--) {
        await myProductPage.clickBtnPreviewLesson();
        await expect(myProductPage.getXpathTitlePreview(lessonVerify[i])).toBeVisible();
      }
    });
  });
});
