import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { DefaultGetProductAPIParam } from "@constants";
import { Page } from "@playwright/test";
import { MyProductPage } from "@pages/shopbase_creator/storefront/my_product";

test.describe("Preview content from dashboard", () => {
  let productPage: ProductPage;
  let productAPI: ProductAPI;
  let productSf: MyProductPage;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    const productListData = conf.caseConf.product_list;
    for (const productItem of productListData) {
      await productAPI.createProduct(productItem.product_body);
      await productPage.navigateToMenu("Products");
      await productPage.clickTitleProduct(productItem.product_body.product.title);
      await productPage.page.waitForSelector(productPage.xpathBackScreen);
      const requestContent = productItem.request_content;
      const fileUploaded = productItem.files_uploaded;
      const schedule = productItem.schedule;
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

      if (fileUploaded) {
        await productPage.navigateToMenu("Products");
        await productPage.clickTitleProduct(productItem.product_body.product.title);
        await productPage.switchTab("Content");
        for (const fileItem of fileUploaded) {
          await productPage.uploadFileOrMedia(fileItem.block, fileItem.file_path, fileItem.file);
        }
      }

      if (schedule) {
        await productPage.navigateToMenu("Products");
        await productPage.clickTitleProduct(productItem.product_body.product.title);
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
  });

  test(`preview_product - View content của product với các status và pricing limit @SB_SC_SCP_13`, async ({
    conf,
    context,
  }) => {
    let productId: string;
    //FT Support multiple pricing options and limit product access đang chưa được bật và outdate
    // await test.step(`Click button "con mắt" của product "Product access limit"
    // > Click button "View content"`, async () => {
    //   await productPage.clickTitleProduct("Product access limit");
    //   productId = await productPage.getDigitalProductID();
    //   // await productPage.switchTab("Pricing");
    //   // await productPage.clickTogglePricing("Access limit");
    //   await productPage.clickSaveBar();
    //   await productPage.navigateToMenu("Products");
    //   const [sfTab] = await Promise.all([
    //     context.waitForEvent("page"),
    //     await productPage.clickToViewSF("Product access limit", "Preview content as member"),
    //   ]);
    //   productSf = new MyProductPage(sfTab, conf.suiteConf.domain);
    //   await expect(productSf.genLoc(productSf.getXpathWithLabel("This course has no content yet."))).toBeVisible();
    //   expect(sfTab.url()).toEqual(
    //     `https://${conf.suiteConf.domain}/my-products
    //courses/${productId}?digest=&preview_course=true&hasQuestion=false`,
    //   );
    // });

    await test.step(`Click button "con mắt" của product "Product unpublished"
    > Click button View content"`, async () => {
      await productPage.clickTitleProduct("Product unpublished");
      await productPage.page.waitForSelector(productPage.xpathBackScreen);
      productId = await productPage.getDigitalProductID();
      await productPage.navigateToMenu("Products");
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickToViewSF("Product unpublished", "Preview content as member"),
      ]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain_sf);
      await expect(productSf.genLoc(productSf.getXpathWithLabel("Product unpublished"))).toBeVisible();
      expect(sfTab.url()).toEqual(
        `https://${conf.suiteConf.domain_sf}/my-products/downloads/${productId}?digest=&preview_course=true&hasQuestion=false`,
      );
    });

    await test.step(`Thay đổi status của product thành published
    > Click button "con mắt" của product "Product published"
    > Click button "View content"`, async () => {
      await productPage.clickTitleProduct("Product unpublished");
      await productPage.page.waitForSelector(productPage.xpathBackScreen);
      productId = await productPage.getDigitalProductID();
      await productPage.clickOnBtnWithLabel("Publish");
      await productPage.navigateToMenu("Products");
      const [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickToViewSF("Product unpublished", "Preview content as member"),
      ]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain_sf);
      await expect(productSf.genLoc(productSf.getXpathWithLabel("Product unpublished"))).toBeVisible();
      expect(sfTab.url()).toEqual(
        `https://${conf.suiteConf.domain_sf}/my-products/downloads/${productId}?digest=&preview_course=true&hasQuestion=false`,
      );
    });
  });

  test(`View content product với 3 type online course, digital download, coaching session từ list all product @SB_SC_SCP_14`, async ({
    conf,
    context,
  }) => {
    let productId: string;
    let productPreviewUrl: string;
    let sfTab: Page;

    await test.step(`Click button "con mắt" của product "Product online course"
    > Click button "Preview content as member"`, async () => {
      await productPage.clickTitleProduct("Product online course");
      await productPage.page.waitForSelector(productPage.xpathBackScreen);
      productId = await productPage.getDigitalProductID();
      await productPage.navigateToMenu("Products");
      [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickToViewSF("Product online course", "Preview content as member"),
      ]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain_sf);
      productPreviewUrl = `https://${conf.suiteConf.domain_sf}/my-products/courses/${productId}?digest=&preview_course=true&hasQuestion=false`;
      await expect(productSf.getXpathLessonFocused("Test lesson 1")).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Mở link content "{{domain}}/my-products/courses/{{product-id}}?token={{shopbase_token}} trong tab mới`, async () => {
      await sfTab.goto(productPreviewUrl);
      await expect(productSf.getXpathLessonFocused("Test lesson 1")).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Click button "con mắt" của product "Product digital download" > Click button "Preview content as member"`, async () => {
      await productPage.clickTitleProduct("Product digital download");
      await productPage.page.waitForSelector(productPage.xpathBackScreen);
      productId = await productPage.getDigitalProductID();
      await productPage.navigateToMenu("Products");
      [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickToViewSF("Product digital download", "Preview content as member"),
      ]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain_sf);
      productPreviewUrl = `https://${conf.suiteConf.domain_sf}/my-products/downloads/${productId}?digest=&preview_course=true&hasQuestion=false`;
      await expect(productSf.genLoc(productSf.getXpathWithLabel("Digital download"))).toBeVisible();
      await expect(productSf.genLoc(productSf.getXpathWithLabel("1 file"))).toBeVisible();
      await expect(productSf.genLoc(productSf.xpathBtnDownload)).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Mở link content "{{domain}}/my-products/downloads/{{product-id}}?token={{shopbase_token}}" trong tab mới`, async () => {
      await sfTab.goto(productPreviewUrl);
      await expect(productSf.genLoc(productSf.getXpathWithLabel("Digital download"))).toBeVisible();
      await expect(productSf.genLoc(productSf.getXpathWithLabel("1 file"))).toBeVisible();
      await expect(productSf.genLoc(productSf.xpathBtnDownload)).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Click button "con mắt" của product "Product coaching session" > Click button "Preview content as member"`, async () => {
      await productPage.clickTitleProduct("Product coaching session");
      await productPage.page.waitForSelector(productPage.xpathBackScreen);
      productId = await productPage.getDigitalProductID();
      await productPage.navigateToMenu("Products");
      [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickToViewSF("Product coaching session", "Preview content as member"),
      ]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain_sf);
      productPreviewUrl = `https://${conf.suiteConf.domain_sf}/my-products/coaching/${productId}?digest=&preview_course=true&hasQuestion=false`;
      await expect(sfTab.frameLocator("//iframe").locator(productSf.xpathAreaSchedule)).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Mở link content {{domain}}/my-products/coaching/{{product-id}}?token={{shopbase_token}} trong tab mới`, async () => {
      await expect(sfTab.frameLocator("//iframe").locator(productSf.xpathAreaSchedule)).toBeVisible();
    });
  });

  test(`View content product online course, digital download và coaching session @SB_SC_SCP_57`, async ({
    conf,
    context,
  }) => {
    let productId: string;
    let sectionId: number;
    let productPreviewUrl: string;
    let sfTab: Page;

    await test.step(`Mở product detail của product "Product online course"
    > Click button "Preview content as member"`, async () => {
      await productPage.clickTitleProduct("Product online course");
      await productPage.page.waitForSelector(productPage.xpathBackScreen);
      productId = await productPage.getDigitalProductID();
      [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickToViewFromDetail("Preview content as member"),
      ]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain_sf);
      productPreviewUrl = `https://${conf.suiteConf.domain_sf}/my-products/courses/${productId}?digest=&preview_course=true&hasQuestion=false`;
      await expect(productSf.getXpathLessonFocused("Test lesson 1")).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Mở link {{domain}}/my-products/courses/{{product-id}}?token={{shopbase_token}} trong một tab mới`, async () => {
      await sfTab.goto(productPreviewUrl);
      await expect(productSf.getXpathLessonFocused("Test lesson 1")).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Mở detail của "Test lesson 2" > Click button "Preview"`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.clickTitleProduct("Product online course");
      await productPage.switchTab("Content");
      await productPage.openChapterDetail("Test chapter 1");
      [sfTab] = await Promise.all([context.waitForEvent("page"), await productPage.clickOnBtnWithLabel("Preview")]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain_sf);
      sectionId = await productPage.getSectionID();
      productPreviewUrl = `https://${conf.suiteConf.domain_sf}/my-products/courses/${productId}?digest=&preview_course=true&section_id=${sectionId}`;
      await expect(productSf.getXpathLessonFocused("Test lesson 1")).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Mở link {{domain}}/my-products/courses/{{product-id}}/sections/{{section_id}}/lectures/{{lecture_id}}?token={{shopbase_token}} trong một tab mới`, async () => {
      await sfTab.goto(productPreviewUrl);
      await expect(productSf.getXpathLessonFocused("Test lesson 1")).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Mở detail của 1 lecture bất kì > Click button "Preview"`, async () => {
      await productPage.clickBackScreen();
      await productPage.openLessonDetail("Test chapter 1", "Test lesson 2");
      [sfTab] = await Promise.all([context.waitForEvent("page"), await productPage.clickOnBtnWithLabel("Preview")]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain_sf);
      productPreviewUrl = `https://${conf.suiteConf.domain_sf}/my-products/courses/${productId}?digest=&preview_course=true`;
      await expect(productSf.getXpathLessonFocused("Test lesson 2")).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Click sang lecture khác -> check hiển thị url page`, async () => {
      await productSf.selectLesson("Test chapter 1", "Test lesson 3");
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Thực hiện hoàn thành một lesson của product`, async () => {
      await productSf.clickBtnComplete();
      expect(await productSf.getTextContent(productSf.xpathCompleteProgress)).toEqual("33% complete");
    });

    await test.step(`Mở product detail của product "Product digital download"
    > Click button "Preview content as member"`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.clickTitleProduct("Product digital download");
      await productPage.page.waitForSelector(productPage.xpathBackScreen);
      productId = await productPage.getDigitalProductID();
      [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickToViewFromDetail("Preview content as member"),
      ]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain_sf);
      productPreviewUrl = `https://${conf.suiteConf.domain_sf}/my-products/downloads/${productId}?digest=&preview_course=true&hasQuestion=false`;
      await expect(productSf.genLoc(productSf.getXpathWithLabel("Digital download"))).toBeVisible();
      await expect(productSf.genLoc(productSf.getXpathWithLabel("1 file"))).toBeVisible();
      await expect(productSf.genLoc(productSf.xpathBtnDownload)).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Mở link {{domain}}/my-products/downloads/{{product-handle}}?token={{shopbase_token}} trong một tab mới`, async () => {
      await sfTab.goto(productPreviewUrl);
      await expect(productSf.genLoc(productSf.getXpathWithLabel("Digital download"))).toBeVisible();
      await expect(productSf.genLoc(productSf.getXpathWithLabel("1 file"))).toBeVisible();
      await expect(productSf.genLoc(productSf.xpathBtnDownload)).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Mở product detail của product "Product coaching session" > Click button "Preview content as member"`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.clickTitleProduct("Product coaching session");
      await productPage.page.waitForSelector(productPage.xpathBackScreen);
      productId = await productPage.getDigitalProductID();
      [sfTab] = await Promise.all([
        context.waitForEvent("page"),
        await productPage.clickToViewFromDetail("Preview content as member"),
      ]);
      productSf = new MyProductPage(sfTab, conf.suiteConf.domain_sf);
      productPreviewUrl = `https://${conf.suiteConf.domain_sf}/my-products/coaching/${productId}?digest=&preview_course=true&hasQuestion=false`;
      await expect(sfTab.frameLocator("//iframe").locator(productSf.xpathAreaSchedule)).toBeVisible();
      expect(sfTab.url()).toEqual(productPreviewUrl);
    });

    await test.step(`Mở link {{domain}}/my-products/coaching/{{product-id}}?token={{shopbase_token}} trong một tab mới`, async () => {
      await expect(sfTab.frameLocator("//iframe").locator(productSf.xpathAreaSchedule)).toBeVisible();
    });
  });

  //FT Support multiple pricing options and limit product access đang chưa được bật và out date
  // test(`View content của product đã được setting access limit và các status khác nhau @SB_SC_SCP_58`, async ({
  //   conf,
  //   context,
  // }) => {
  //   let productId: string;
  //   await test.step(`Mở product detail của product "Product access limit"`
  //  `> Click button "View content"`, async () => {
  //     await productPage.clickTitleProduct("Product access limit");
  //     productId = await productPage.getDigitalProductID();
  //     await productPage.switchTab("Pricing");
  //     await productPage.clickTogglePricing("Access limit");
  //     await productPage.clickSaveBar();
  //     const [sfTab] = await Promise.all([
  //       context.waitForEvent("page"),
  //       await productPage.clickToViewFromDetail("Preview content as member"),
  //     ]);
  //     productSf = new MyProductPage(sfTab, conf.suiteConf.domain);
  //     await expect(productSf.genLoc(productSf.getXpathWithLabel("This course has no content yet."))).toBeVisible();
  //     expect(sfTab.url()).toEqual(
  //       `https://${conf.suiteConf.domain}/my-products/courses/${productId}?preview_course=true`,
  //     );
  //   });

  //   await test.step(`Thực hiện view content của "Product access limit" 2 lần`, async () => {
  //     const [sfTab] = await Promise.all([
  //       context.waitForEvent("page"),
  //       await productPage.clickToViewFromDetail("Preview content as member"),
  //     ]);
  //     productSf = new MyProductPage(sfTab, conf.suiteConf.domain);
  //     await expect(productSf.genLoc(productSf.getXpathWithLabel("This course has no content yet."))).toBeVisible();
  //     expect(sfTab.url()).toEqual(
  //       `https://${conf.suiteConf.domain}/my-products/courses/${productId}?preview_course=true`,
  //     );
  //   });

  //   await test.step(`Mở product detail của product "Product published" > Click button "View content"`, async () => {
  //     await productPage.clickBackScreen();
  //     await productPage.clickTitleProduct("Product published");
  //     productId = await productPage.getDigitalProductID();
  //     const [sfTab] = await Promise.all([
  //       context.waitForEvent("page"),
  //       await productPage.clickToViewFromDetail("Preview content as member"),
  //     ]);
  //     productSf = new MyProductPage(sfTab, conf.suiteConf.domain);
  //     await expect(productSf.genLoc(productSf.getXpathWithLabel("This course has no content yet."))).toBeVisible();
  //     expect(sfTab.url()).toEqual(
  //       `https://${conf.suiteConf.domain}/my-products/courses/${productId}?preview_course=true`,
  //     );
  //   });

  //   await test.step(`Mở product detail của product "Product unpublished"
  // `> Click button "View content"`, async () => {
  //     await productPage.clickBackScreen();
  //     await productPage.clickTitleProduct("Product unpublished");
  //     productId = await productPage.getDigitalProductID();
  //     const [sfTab] = await Promise.all([
  //       context.waitForEvent("page"),
  //       await productPage.clickToViewFromDetail("Preview content as member"),
  //     ]);
  //     productSf = new MyProductPage(sfTab, conf.suiteConf.domain);
  //     await expect(productSf.genLoc(productSf.getXpathWithLabel("0 file"))).toBeVisible();
  //     expect(sfTab.url()).toEqual(
  //       `https://${conf.suiteConf.domain}/my-products/downloads/${productId}?preview_course=true`,
  //     );
  //   });
  // });
});
