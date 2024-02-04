import { test } from "@fixtures/theme";
import { CollectionPage } from "@pages/dashboard/collections";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { expect } from "@core/fixtures";
import { SFCollection } from "@sf_pages/collection";

test.describe("Sync product to collection @TS_SB_CL_SPC", async () => {
  const verifyDroplist = async (page, droplistData, xpathSelectOption): Promise<boolean> => {
    for (let i = 0; i < droplistData.length; i++) {
      const value = await page.locator(`(${xpathSelectOption})[${i + 1}]`).textContent();
      if (value.replace(/\n/g, "").trim() !== droplistData[i]) {
        return false;
      }
    }
    return true;
  };

  const verifyProductSortOnCollectionDetail = async (dashboard, productSortData, droplistData): Promise<boolean> => {
    for (let i = 0; i < productSortData.length; i++) {
      let value;
      if (droplistData === "Manual") {
        value = await dashboard.locator(`(//*[contains(@class,'product-table')]//a)[${i + 1}]`).textContent();
      } else {
        value = await dashboard
          .locator(`(//div[contains(@class,'product-table')]//div[@class='product-title'])[${i + 1}]`)
          .textContent();
      }
      if (value.replace(/\n/g, "").trim() !== productSortData[i]) {
        return false;
      }
    }
    return true;
  };

  const clickButtonSaveCollection = async (dashboard, collection): Promise<void> => {
    await collection.clickOnBtnWithLabel("Save");
    await dashboard.waitForSelector("//div[contains(@class,'s-toast')]//div[normalize-space()='Saved collection!']");
    await dashboard.waitForSelector("//div[contains(@class,'s-toast')]//div[normalize-space()='Saved collection!']", {
      state: "hidden",
    });
  };

  let collection: CollectionPage;

  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.time_out);
    collection = new CollectionPage(dashboard, conf.suiteConf.domain);
    await collection.gotoCollectionList();
    await collection.deleteAllCollection();
    await collection.waitForElementVisibleThenInvisible(collection.xpathToastMessage);
  });

  test("Check khi tạo collection manual thành công @SB_CL_SPC_01", async ({
    dashboard,
    conf,
    context,
    authRequest,
    snapshotFixture,
  }) => {
    const collectionBlankTitle = conf.caseConf.collection_blank_title;
    const collectionManual = conf.caseConf.collection_manual;
    const productTitle = conf.caseConf.product_title;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    await test.step(
      "Tại dashboard, đi đến màn Collections list > Click button Create collection > " + "Verify màn add collection",
      async () => {
        await collection.gotoCollectionList();
        await collection.clickOnBtnWithLabel("Create collection");
        const xpathBlockTitleDescription = "//div[@class='white-bg section-overview']";
        const xpathBlockCollectionConditions = "//div[@class='white-bg m-t section-overview']";
        const xpathBlockProductThumbnail = "//div[contains(@class,'section-overview product-thumbnail-rule')]";
        const xpathBlockSearchEngineListingPreview = "//section[@class='card search-engine']";
        const xpathBlockCollectionVisibility =
          "//div[contains(@class,'title-description')][child::h4[normalize-space()='Collection visibility']]";
        const xpathBlockCollectionImage =
          "//div[contains(@class,'title-description')][child::h4[normalize-space()='Collection image']]";
        const xpathBlockAddCollectionToNavigation =
          "//div[contains(@class,'title-description')][child::h4[normalize-space()='Add collection to navigation']]";

        await dashboard.waitForSelector("//div[@class='tox-edit-area']/iframe");
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathBlockTitleDescription,
          snapshotName: "block-title-description.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        await dashboard.waitForSelector("//button[normalize-space()='Add another condition']");
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathBlockCollectionConditions,
          snapshotName: "block-collection-type-conditions.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathBlockProductThumbnail,
          snapshotName: "block-product-thumbnail.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathBlockSearchEngineListingPreview,
          snapshotName: "block-search-engine-listing-preview.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathBlockCollectionVisibility,
          snapshotName: "block-collection-visibility.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        await dashboard.locator(xpathBlockAddCollectionToNavigation).scrollIntoViewIfNeeded();
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathBlockCollectionImage,
          snapshotName: "block-collection-image.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("Bỏ trống field Title > Chọn Collection type = Manual > Click button Save", async () => {
      await collection.createCollection(collectionBlankTitle);
      await expect(await dashboard.locator("//div[contains(@class,'description message-error')]//span")).toHaveText(
        collectionBlankTitle.message_error,
      );
      await collection.clickOnBtnWithLabel("Discard");
    });

    await test.step("Input Title > Chọn Collection type = Manual > Click button Save", async () => {
      await collection.createCollection(collectionManual);
      const xpathBlockProduct =
        "//div[contains(@class,'section-overview') and descendant::h4[normalize-space()='Products']]";
      await dashboard.locator(xpathBlockProduct).scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: dashboard,
        selector: xpathBlockProduct,
        snapshotName: "block-products.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click button Add product", async () => {
      await collection.clickOnBtnWithLabel("Add product");
      await dashboard.waitForSelector("//div[contains(@class,'item-list')]//div[@class='item']");
      const xpathPopupSelectProduct =
        "//div[@class='s-animation-content s-modal-content']//h2[normalize-space()='Select products']";
      expect(await dashboard.locator(xpathPopupSelectProduct).isVisible()).toBe(true);
    });

    await test.step("Search product > Check checkbox tại product > Click button Save", async () => {
      await collection.addProductToCollectionDetail(productTitle);
      const xpathBlockProductAfterAdd =
        "//div[contains(@class,'section-overview') and descendant::h4[normalize-space()='Products']]";
      await snapshotFixture.verify({
        page: dashboard,
        selector: xpathBlockProductAfterAdd,
        snapshotName: "block-products-after-add.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click button Refresh", async () => {
      const xpathBtnRefresh = "//button//span[normalize-space()='Refresh']";
      do {
        await collection.clickOnBtnWithLabel("Refresh");
        await dashboard.waitForSelector("//img[@class='sbase-spinner']");
        await dashboard.waitForSelector("//img[@class='sbase-spinner']", { state: "hidden" });
        // chờ 1 giây để sync product trong collection, xong click Refresh để check lại đã sync thành công hay chưa
        await dashboard.waitForTimeout(1000);
      } while (await dashboard.locator(xpathBtnRefresh).isVisible());
      const xpathBlockProductAfterRefresh =
        "//div[contains(@class,'section-overview') and descendant::h4[normalize-space()='Products']]";
      await snapshotFixture.verify({
        page: dashboard,
        selector: xpathBlockProductAfterRefresh,
        snapshotName: "block-products-after-refresh.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click button view product ngoài SF", async () => {
      const handleCollection = await collection.getCollectionHandle(collectionManual.collection_title, authRequest);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      const collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await SFPage.waitForSelector("//div[contains(@class,'collection-detail__product-image')]");
      await SFPage.waitForSelector("//img[@class='image sb-lazy loading']", { state: "hidden" });
      const collectionInfoSF = await collectionSF.getCollectionInfoByApi(
        authRequest,
        handleCollection,
        collectionManual,
      );
      expect(collectionInfoSF).toEqual(collectionManual);
      expect(await collectionSF.checkProductSyncToCollectionSF(productTitle)).toBe(true);
    });
  });

  test("Check khi tạo Automated collection thành công @SB_CL_SPC_02", async ({
    dashboard,
    conf,
    context,
    authRequest,
    snapshotFixture,
  }) => {
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const collectionBlankTitle = conf.caseConf.collection_blank_title;
    const collectionBlankConditions = conf.caseConf.collection_blank_conditions;
    const collectionAuto = conf.caseConf.collection_auto;
    const productTitle = conf.caseConf.product_title;
    await test.step(
      "Tại dashboard, đi đến màn Collections list > Click button Create collection > " +
        "Bỏ trống field Title > Chọn Collection type = Automated > Chọn Conditions > CLick button Save",
      async () => {
        await collection.gotoCollectionList();
        await collection.clickOnBtnWithLabel("Create collection");
        await collection.createCollection(collectionBlankTitle);
        await expect(await dashboard.locator("//div[contains(@class,'description message-error')]//span")).toHaveText(
          collectionBlankTitle.message_error,
        );
        await collection.clickOnBtnWithLabel("Discard");
      },
    );

    await test.step("Input [Title] > Chọn Collection type = Automated > Bỏ trống Conditions > Click button [Save]", async () => {
      await collection.createCollection(collectionBlankConditions);
      await expect(await dashboard.locator("//div[contains(@class,'description message-error')]//span")).toHaveText(
        collectionBlankConditions.message_error,
      );
      await collection.clickOnBtnWithLabel("Discard");
    });

    await test.step("Input [Title] > Chọn Collection type = Automated > Chọn  Conditions > Click button [Save]", async () => {
      await collection.createCollection(collectionAuto);
      const xpathBlockProduct =
        "//div[contains(@class,'section-overview') and descendant::h4[normalize-space()='Products']]";
      await dashboard.locator(xpathBlockProduct).scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: dashboard,
        selector: xpathBlockProduct,
        snapshotName: "block-products-auto.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Reload lại page > Check hiển thị block Products", async () => {
      do {
        // chờ 2 giây để sync product sang collection, back and access again để check hiển thị product trong collection
        await dashboard.waitForTimeout(2000);
        await collection.gotoCollectionDetail(collectionAuto.collection_title);
        await dashboard.locator("//table[@id='all-products']/thead/tr").scrollIntoViewIfNeeded();
      } while (await dashboard.locator("(//table[@id='all-products']/tbody/tr)[last()]").isHidden());
      expect(await collection.checkProductSyncToCollectionDetailPage(productTitle)).toBe(true);
    });

    await test.step("Click button view product ngoài SF", async () => {
      const handleCollection = await collection.getCollectionHandle(collectionAuto.collection_title, authRequest);
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      const collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await SFPage.waitForSelector("//div[contains(@class,'collection-detail__product-image')]");
      await SFPage.waitForSelector("//img[@class='image sb-lazy loading']", { state: "hidden" });
      const collectionInfoSF = await collectionSF.getCollectionInfoByApi(authRequest, handleCollection, collectionAuto);
      expect(collectionInfoSF).toEqual(collectionAuto);
      expect(await collectionSF.checkProductSyncToCollectionSF(productTitle)).toBe(true);
    });
  });

  test("Check các định dạng trong Description khi create collection @SB_CL_SPC_3", async ({
    dashboard,
    conf,
    context,
  }) => {
    const collectionDescription = conf.caseConf.collection_description;

    const descriptionFormat = conf.caseConf.description_format;
    const descriptionFormatShow = conf.caseConf.description_format_show;
    const descriptionBulletList = conf.caseConf.description_bullet_list;
    const descriptionNumberList = conf.caseConf.description_number_list;
    await test.step(
      "Tại dashboard, đi đến màn Collections list > Click button Create collection > " +
        "Input Title > Chọn Collection type = Manual > Click button Save",
      async () => {
        await collection.clickOnBtnWithLabel("Create collection");
        await collection.createCollection(collectionDescription);
      },
    );

    await test.step(
      "Tại [Description]:Chọn format > Chọn kiểu chữ> Chọn text color > " + "Input text > Click button [Save]",
      async () => {
        await collection.setFormatForDescriptionCollection(descriptionFormat);
        await clickButtonSaveCollection(dashboard, collection);
      },
    );

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      await SFPage.waitForSelector("//div[contains(@class,'collection-detail__product-image')]");
      expect(
        await SFPage.locator(`//h1//span[normalize-space()='${descriptionFormatShow.description}']`).isVisible(),
      ).toBe(true);
      const colorText = await SFPage.locator(
        `//h1//span[normalize-space()='${descriptionFormatShow.description}']`,
      ).getAttribute("style");
      expect(colorText).toContain(descriptionFormatShow.text_color);
      SFPage.close();
    });

    await test.step("Tại collection detail -> [Description]:Chọn kiểu danh sách > Click button Save", async () => {
      await collection.setFormatForDescriptionCollection(descriptionBulletList);
      await clickButtonSaveCollection(dashboard, collection);
    });

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      await SFPage.waitForLoadState("networkidle");
      expect(
        await SFPage.locator(`//ul//li//span[normalize-space()='${descriptionBulletList.description}']`).isVisible(),
      ).toBe(true);
      SFPage.close();
    });

    await test.step("Tại collection detail -> [Description]:Chọn kiểu number > Click button Save", async () => {
      await collection.setFormatForDescriptionCollection(descriptionNumberList);
      await clickButtonSaveCollection(dashboard, collection);
    });

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      await SFPage.waitForLoadState("networkidle");
      expect(
        await SFPage.locator(`//ol//li//span[normalize-space()='${descriptionNumberList.description}']`).isVisible(),
      ).toBe(true);
      SFPage.close();
    });
  });

  test(
    "Check hiển thị [Page tile] , [Meta description], [URL and handle] tại [Search engine listing preview]" +
      " khi create collection @SB_CL_SPC_4",
    async ({ dashboard, conf, context, authRequest }) => {
      const collectionHandle = conf.caseConf.collection_handle;
      const seoDetail = conf.caseConf.seo_detail;

      await test.step(
        "Tại dashboard, đi đến màn Collections list > Click button Create collection > " +
          "Input Title > Chọn Collection type = Manual > Click button Save",
        async () => {
          await collection.clickOnBtnWithLabel("Create collection");
          await collection.createCollection(collectionHandle);
        },
      );

      await test.step("Click btn [Edit website SEO]", async () => {
        await collection.clickOnBtnWithLabel("Edit website SEO");
        expect(await dashboard.locator("//label[normalize-space()= 'Page title']").isVisible()).toBe(true);
        expect(await dashboard.locator("//label[normalize-space()= 'Meta description']").isVisible()).toBe(true);
        expect(await dashboard.locator("//label[normalize-space()= 'URL and handle']").isVisible()).toBe(true);
      });

      await test.step(
        "Input các field: [Page title] > [Meta Description] Input [handle] > " + "Click btn[Save]",
        async () => {
          await collection.setSearchEngineListingPreviewOfCollection(seoDetail);
          await clickButtonSaveCollection(dashboard, collection);
        },
      );

      await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
        const handleCollection = await collection.getCollectionHandle(collectionHandle.collection_title, authRequest);
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
        await SFPage.waitForSelector("//div[contains(@class,'collection-detail__product-image')]");
        const urlAR = SFPage.url();
        expect(urlAR).toContain(handleCollection);
        SFPage.close();
      });
    },
  );

  test(" Verify hiển thị phần image của collection ở dashboard và SF khi create collection @SB_CL_SPC_5", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const collectionImage = conf.caseConf.collection_image;
    const imageInvalid = conf.caseConf.image_invalid;
    const imageCollection = conf.caseConf.image_collection;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    await test.step(
      "Tại dashboard, đi đến màn Collections list > Click button Create collection > " +
        "Input Title > Chọn Collection type = Manual > Click button Save",
      async () => {
        await collection.clickOnBtnWithLabel("Create collection");
        await collection.createCollection(collectionImage);
      },
    );

    await test.step(
      "Tại collection detail tại block [Collection image] > Upload [Collection image] " +
        "với định dạng khác png , jpg, jpge > Click [Save]",
      async () => {
        await collection.setImageForCollection(imageInvalid);
        await clickButtonSaveCollection(dashboard, collection);

        await dashboard.waitForSelector("//img[@class='img-responsive image__detail']");
        const xpathBlockCollectionImage =
          "//div[contains(@class,'title-description')][child::h4[contains(text(),'Collection image')]]";
        const xpathBlockAddCollectionToNavigation =
          "//div[contains(@class,'title-description')][child::" +
          "h4[normalize-space()='Add collection to navigation']]";
        await dashboard.locator(xpathBlockAddCollectionToNavigation).scrollIntoViewIfNeeded();
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathBlockCollectionImage,
          snapshotName: "collection-image-invalid.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      await SFPage.goto(`https://${conf.suiteConf.domain}/collections`);
      const xpathColection =
        `(//div[contains(@class,'collection-product-wrap') and ` +
        `descendant::h5[normalize-space()='${collectionImage.collection_title}']])[1]`;
      await SFPage.waitForSelector(
        `${xpathColection}//img[contains(@class,'image sb-lazy loading has-ratio product-image')]`,
      );
      await SFPage.waitForSelector(
        `${xpathColection}//img[contains(@class,'image sb-lazy loading has-ratio product-image')]`,
        { state: "hidden" },
      );
      await snapshotFixture.verify({
        page: SFPage,
        selector: xpathColection,
        snapshotName: "collection-image-invalid-SF.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      SFPage.close();
    });

    await test.step(
      "Tại collection detail tại block [Collection image] > Upload [Collection image] " +
        "với định dạng png , jpg, jpge > Click [Save]",
      async () => {
        await collection.editImageForCollection(imageCollection);
        await clickButtonSaveCollection(dashboard, collection);
        await dashboard.waitForSelector("//img[@class='img-responsive image__detail']");
        const xpathBlockCollectionImage =
          "//div[contains(@class,'title-description')][child::h4[contains(text(),'Collection image')]]";
        const xpathBlockAddCollectionToNavigation =
          "//div[contains(@class,'title-description')][child::" +
          "h4[normalize-space()='Add collection to navigation']]";
        await dashboard.locator(xpathBlockAddCollectionToNavigation).scrollIntoViewIfNeeded();
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathBlockCollectionImage,
          snapshotName: "collection-image-valid.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      await SFPage.goto(`https://${conf.suiteConf.domain}/collections`);
      const xpathColection =
        `(//div[contains(@class,'collection-product-wrap') and ` +
        `descendant::h5[normalize-space()='${collectionImage.collection_title}']])[1]`;
      await SFPage.waitForSelector(
        `${xpathColection}//img[contains(@class,'image sb-lazy loading has-ratio product-image')]`,
      );
      await SFPage.waitForSelector(
        `${xpathColection}//img[contains(@class,'image sb-lazy loading has-ratio product-image')]`,
        { state: "hidden" },
      );
      await waitForImageLoaded(SFPage, '(//div[@id="list-collections"]//img)[last()]');
      await SFPage.waitForLoadState("networkidle", { timeout: 9000 });
      await snapshotFixture.verify({
        page: SFPage,
        selector: xpathColection,
        snapshotName: "collection-image-valid-SF.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      SFPage.close();
    });
  });

  test("Check khi set Product thumbnail trong Dashboard khi create collection @SB_CL_SPC_6", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const collectionProductThumbnail = conf.caseConf.collection_product_thumbnail;

    const productThumbnailBlankValue = conf.caseConf.product_thumbnail_blank_value;
    const productThumbnailBlankName = conf.caseConf.product_thumbnail_blank_name;
    const productThumbnail = conf.caseConf.product_thumbnail;
    const productThumbnailAddOtherCondition = conf.caseConf.product_thumbnail_add_other_condition;
    const productThumbnailAddMaxCondition = conf.caseConf.product_thumbnail_add_max_condition;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    await test.step(
      "Tại dashboard, đi đến màn Collections list > Click button Create collection > " +
        "Input Title > Chọn Collection type = Manual > Click button Save",
      async () => {
        await collection.clickOnBtnWithLabel("Create collection");
        await collection.createCollection(collectionProductThumbnail);
        // wait for product sau khi tao sync trong db
        await collection.page.waitForTimeout(30000);
      },
    );

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      const xpathImageProduct =
        `//div[contains(@class,'collection-product-wrap') and descendant::` +
        `span[normalize-space()='${collectionProductThumbnail.product_title}']]`;
      const collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await collectionSF.waitResponseWithUrl("/assets/landing.css", 500000);
      if (
        await SFPage.locator(
          `${xpathImageProduct}//img[contains(@class,'image sb-lazy loading hover-secondary')]`,
        ).isVisible()
      ) {
        await SFPage.waitForSelector(
          `${xpathImageProduct}//img[contains(@class,'image sb-lazy loading hover-secondary')]`,
          { state: "hidden" },
        );
      }
      await SFPage.locator(
        `//span[normalize-space()='${collectionProductThumbnail.product_title}']`,
      ).scrollIntoViewIfNeeded();
      await snapshotFixture.verify({
        page: SFPage,
        selector: xpathImageProduct,
        snapshotName: "collection-image-product-SF-SB_CL_SPC_6.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      SFPage.close();
    });

    await test.step(
      "Tại collection detail tại block [Product thumbnail] > Nhập Option name >" + " Bỏ trống Option value",
      async () => {
        await collection.createCollection(productThumbnailBlankValue);
        await collection.clickOnBtnWithLabel("Save");
        await expect(
          await dashboard.locator("//div[@class='product-thumbnail-rule-item']//span[@class='required-input']"),
        ).toHaveText(productThumbnailBlankName.message_error);
      },
    );

    await test.step(
      "Tại collection detail tại block [Product thumbnail] > Nhập Option value >" + " Bỏ trống Option value",
      async () => {
        await collection.createCollection(productThumbnailBlankName);
        await collection.clickOnBtnWithLabel("Save");
        await expect(
          await dashboard.locator("//div[@class='product-thumbnail-rule-item']//span[@class='required-input']"),
        ).toHaveText(productThumbnailBlankName.message_error);
      },
    );

    await test.step(
      "Tại collection detail tại block [Product thumbnail] > Nhập Option value >" +
        " Nhập Option value > Click button Save > Click button [View] trên đầu trang",
      async () => {
        await collection.createCollection(productThumbnail);
        await collection.clickOnBtnWithLabel("Save");
        // wait for product sau khi tao sync trong db
        await collection.page.waitForTimeout(30000);
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
        const xpathImageProduct =
          `//div[contains(@class,'collection-product-wrap') and descendant::` +
          `span[normalize-space()='${collectionProductThumbnail.product_title}']]`;
        if (
          await SFPage.locator(
            `${xpathImageProduct}//img[contains(@class,'image sb-lazy loading hover-secondary')]`,
          ).isVisible()
        ) {
          await SFPage.waitForSelector(
            `${xpathImageProduct}//img[contains(@class,'image sb-lazy loading hover-secondary')]`,
            { state: "hidden" },
          );
        }
        await SFPage.locator(
          `//span[normalize-space()='${collectionProductThumbnail.product_title}']`,
        ).scrollIntoViewIfNeeded();
        await snapshotFixture.verify({
          page: SFPage,
          selector: xpathImageProduct,
          snapshotName: "collection-image-product-thumbnail-SF-SB_CL_SPC_6.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        SFPage.close();
      },
    );

    await test.step(
      "Tại collection detail tại block [Product thumbnail] > Nhập Option value >" +
        " Nhập Option value > Click button Add another condition > Nhập Option value > Nhập Option value > " +
        " Click button Save >  Click button [View] trên đầu trang",
      async () => {
        await collection.createCollection(productThumbnailAddOtherCondition);
        await collection.clickOnBtnWithLabel("Save");
        // wait for product sau khi tao sync trong db
        await collection.page.waitForTimeout(30000);
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
        const xpathImageProduct =
          `//div[contains(@class,'collection-product-wrap') and descendant::` +
          `span[normalize-space()='${collectionProductThumbnail.product_title}']]`;
        if (
          await SFPage.locator(
            `${xpathImageProduct}//img[contains(@class,'image sb-lazy loading hover-secondary')]`,
          ).isVisible()
        ) {
          await SFPage.waitForSelector(
            `${xpathImageProduct}//img[contains(@class,'image sb-lazy loading hover-secondary')]`,
            { state: "hidden" },
          );
        }
        await SFPage.locator(
          `//span[normalize-space()='${collectionProductThumbnail.product_title}']`,
        ).scrollIntoViewIfNeeded();
        await snapshotFixture.verify({
          page: SFPage,
          selector: xpathImageProduct,
          snapshotName: "collection-image-product-thumbnail-add-condition-SF-SB_CL_SPC_6.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        SFPage.close();
      },
    );

    await test.step(
      "Tại collection detail tại block [Product thumbnail] > " + "Click add 11 lần button Add another condition",
      async () => {
        await collection.createCollection(productThumbnailAddMaxCondition);
        await clickButtonSaveCollection(dashboard, collection);
        await expect(await dashboard.locator("//a[normalize-space()='Add another condition']").isVisible()).toBe(false);
      },
    );
  });

  test("Check Show ảnh đầu tiên của variant khi set Product thumbnail trong Dashboard @SB_CL_SPC_7", async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    const collectionProductThumbnail = conf.caseConf.collection_product_thumbnail;
    const productThumbnailImage = conf.caseConf.product_thumbnail_image;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const xpathImageProduct =
      `//div[contains(@class,'collection-product-wrap') and descendant::` +
      `span[normalize-space()='${collectionProductThumbnail.product_title}']]`;
    await test.step(
      "Tại dashboard, đi đến màn Collections list > Click button Create collection > " +
        "Input Title > Chọn Collection type = Manual > Click button Save",
      async () => {
        await collection.clickOnBtnWithLabel("Create collection");
        await collection.createCollection(collectionProductThumbnail);
      },
    );

    await test.step(
      "Tại collection detail tại block [Product thumbnail] > Nhập Option value >" +
        " Nhập Option value > Click button Save > Click button [View] trên đầu trang",
      async () => {
        await collection.createCollection(productThumbnailImage);
        await collection.clickOnBtnWithLabel("Save");
        await collection.waitForElementVisibleThenInvisible(collection.xpathToastMessage);
        // wait for product sau khi tao sync trong db
        await collection.page.waitForTimeout(30000);
        const [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
        if (
          await SFPage.locator(
            `${xpathImageProduct}//img[contains(@class,'image sb-lazy loading hover-secondary')]`,
          ).isVisible()
        ) {
          await SFPage.waitForSelector(
            `${xpathImageProduct}//img[contains(@class,'image sb-lazy loading hover-secondary')]`,
            { state: "hidden" },
          );
        }
        await SFPage.locator(
          `//span[normalize-space()='${collectionProductThumbnail.product_title}']`,
        ).scrollIntoViewIfNeeded();
        await waitForImageLoaded(SFPage, `(${xpathImageProduct}//img)[last()]`);
        await snapshotFixture.verify({
          page: SFPage,
          selector: xpathImageProduct,
          snapshotName: "collection-image-product-thumbnail-SF-SB_CL_SPC_7.png",
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        SFPage.close();
      },
    );

    await test.step("Hover vào product", async () => {
      const [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      await SFPage.reload();
      await SFPage.waitForLoadState("networkidle");
      if (
        await SFPage.locator(
          `${xpathImageProduct}//img[contains(@class,'image sb-lazy loading hover-secondary')]`,
        ).isVisible()
      ) {
        await SFPage.waitForSelector(
          `${xpathImageProduct}//img[contains(@class,'image sb-lazy loading hover-secondary')]`,
          { state: "hidden" },
        );
      }
      await SFPage.locator(
        `//span[normalize-space()='${collectionProductThumbnail.product_title}']`,
      ).scrollIntoViewIfNeeded();
      await waitForImageLoaded(SFPage, `(${xpathImageProduct}//img)[last()]`);
      const xpathHoverImage = `${xpathImageProduct}//div[contains(@class,'collection-image-container')]`;
      SFPage.locator(xpathHoverImage).hover();
      await snapshotFixture.verify({
        page: SFPage,
        selector: xpathImageProduct,
        snapshotName: "collection-image-hover-SF-SB_CL_SPC_7.png",
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("Verify hiển thị list product của collection theo khi sort list product @SB_CL_SPC_8", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const collectionAuto = conf.caseConf.collection_auto;
    const droplistData = conf.caseConf.droplist_sort;
    const productSort = conf.caseConf.product_sort;
    const sortDataSF = conf.caseConf.sort_on_sf;
    const productSortSF = conf.caseConf.product_sort_sf;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    let collectionSF: SFCollection;
    let SFPage;
    await test.step(
      "Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail >" +
        " Tại Products -> click vào droplist",
      async () => {
        await collection.clickOnBtnWithLabel("Create collection");
        await collection.createCollection(collectionAuto);
        await collection.gotoCollectionDetail(collectionAuto.collection_title);
        await collection.page.waitForSelector(collection.xpathDescriptionArea, { timeout: 9000 });
        expect(
          await verifyDroplist(
            dashboard,
            droplistData,
            "//div[contains(@class,'product-list-action')]//select//option",
          ),
        ).toBe(true);
      },
    );

    for (let i = 0; i < droplistData.length; i++) {
      await test.step("Chọn sort product > Click button Refesh > Click button Save", async () => {
        await collection.sortProductInCollection(droplistData[i]);
        while ((await collection.page.locator(collection.xpathProductLink).count()) < productSort[0].length) {
          await collection.page.reload();
          await collection.page.waitForLoadState("networkidle");
        }
        expect(await verifyProductSortOnCollectionDetail(dashboard, productSort[i], droplistData[i])).toBe(true);
      });

      await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
        [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
        collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
        const xpathSortCollection = "//div[@class='container collection-detail']//div[@class='row']";
        await SFPage.waitForLoadState("networkidle");
        await SFPage.waitForSelector("(//img[contains(@class,'image sb-lazy loading hover-secondary')])[1]", {
          state: "hidden",
        });
        await snapshotFixture.verify({
          page: SFPage,
          selector: xpathSortCollection,
          snapshotName: `sort-collection-${droplistData[i].replace(" ", "-")}-SF-SB_CL_SPC_8.png`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        expect(await verifyDroplist(SFPage, sortDataSF, "//select[@class='prefix-icon']//option")).toBe(true);
        expect(await collectionSF.verifyProductSortOnColectionSF(productSort[i])).toBe(true);
      });

      await test.step("Tại SF, Chọn sort", async () => {
        await collectionSF.sortProductOnCollection(sortDataSF[i], productSortSF[i]);
        SFPage.close();
      });
    }
  });

  test("Verify hiển thị thông tin chung của collection khi edit collection @SB_CL_SPC_9", async ({
    dashboard,
    conf,
    context,
    snapshotFixture,
  }) => {
    const collectionEdit = conf.caseConf.collection_edit;
    const collectionEditTitle = conf.caseConf.collection_edit_title;
    const productDelete = conf.caseConf.product_delete;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const threshold = conf.suiteConf.threshold;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;

    await test.step("Precondition: Create collection", async () => {
      await collection.clickOnBtnWithLabel("Create collection");
      await collection.createCollection(collectionEdit);
    });
    let collectionSF: SFCollection;
    let SFPage;
    const xpathPublishCollection = "//div[contains(@class,'publish-actions')]";
    const xpathCheckCollectionVisibility =
      "//div[contains(@class,'title-description')][child::" +
      "h4[normalize-space()='Collection visibility']]//span[@class='s-check']";
    const xpathTitleCollectionList =
      `//div[contains(@class,'collection-product-wrap')]` +
      `//h5[normalize-space()='${collectionEditTitle.collection_title}']`;
    const xpathTitleCollectionDetail = "//div[@class='container collection-detail']//h1";
    await test.step(
      "Tại dashboard, đi đến màn Collections list > Search collection > Open collection detail >" +
        " Edit title collection > Click button Save",
      async () => {
        await collection.gotoCollectionDetail(collectionEdit.collection_title);
        await collection.createCollection(collectionEditTitle);
        await clickButtonSaveCollection(dashboard, collection);
      },
    );

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await SFPage.waitForSelector("//div[@class='container collection-detail']//h1");
      await expect(await SFPage.locator(xpathTitleCollectionDetail)).toHaveText(collectionEditTitle.collection_title);
    });

    await test.step("Tại màn Collection detail > Click button Disable collection > Click button Save", async () => {
      await collection.clickOnBtnWithLabel("Disable collection");
      await dashboard.waitForSelector("//button[@class='s-button is-outline is-small is-loading']", {
        state: "hidden",
      });
      await snapshotFixture.verify({
        page: dashboard,
        selector: xpathPublishCollection,
        snapshotName: `disable-collection-SB_CL_SPC_9.png`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      await SFPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await SFPage.waitForSelector("(//img[contains(@class,'image sb-lazy loading hover-secondary')])[1]", {
        state: "hidden",
      });
      await expect(await SFPage.locator(xpathTitleCollectionList).isVisible()).toBe(false);
      SFPage.close();
    });

    await test.step(
      "Tại màn Collection detail > Click button Enable collection > Click button Save >" + " Check collection ngoài SF",
      async () => {
        await collection.clickOnBtnWithLabel("Enable collection");
        await dashboard.waitForSelector("//button[@class='s-button is-outline is-small is-loading']", {
          state: "hidden",
        });
        await snapshotFixture.verify({
          page: dashboard,
          selector: xpathPublishCollection,
          snapshotName: `enable-collection-SB_CL_SPC_9.png`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
        await SFPage.goto(`https://${conf.suiteConf.domain}/collections`);
        await SFPage.waitForSelector("//div[@class='container collection']//h1");
        await expect(await SFPage.locator(xpathTitleCollectionList).isVisible()).toBe(true);
        SFPage.close();
      },
    );

    await test.step(
      "Tại màn Collection detail > Tại block Collection visibility > uncheck Show on Collection List Page > " +
        "Click button Save > Check collection ngoài SF",
      async () => {
        await dashboard.locator(xpathCheckCollectionVisibility).uncheck();
        await clickButtonSaveCollection(dashboard, collection);
        [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
        collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
        await SFPage.waitForSelector("(//img[contains(@class,'image sb-lazy loading hover-secondary')])[1]", {
          state: "hidden",
        });
        await expect(await SFPage.locator(xpathTitleCollectionDetail)).toHaveText(collectionEditTitle.collection_title);
      },
    );

    await test.step("Tại màn SF, đi đến collection list page", async () => {
      await SFPage.goto(`https://${conf.suiteConf.domain}/collections`);
      await SFPage.waitForSelector("(//img[contains(@class,'image sb-lazy loading hover-secondary')])[1]", {
        state: "hidden",
      });
      await expect(await SFPage.locator(xpathTitleCollectionList).isVisible()).toBe(false);
      SFPage.close();
    });

    await test.step(
      "Tại màn Collection detail > Tại block Collection visibility > check Show on Collection List Page > " +
        "Click button Save > Check collection ngoài SF",
      async () => {
        await dashboard.locator(xpathCheckCollectionVisibility).check();
        await clickButtonSaveCollection(dashboard, collection);
        [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
        collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
        await SFPage.waitForSelector("(//img[contains(@class,'image sb-lazy loading hover-secondary')])[1]", {
          state: "hidden",
        });
        await expect(await SFPage.locator(xpathTitleCollectionDetail)).toHaveText(collectionEditTitle.collection_title);
      },
    );

    await test.step("Tại màn SF, đi đến collection list page", async () => {
      await SFPage.goto(`https://${conf.suiteConf.domain}/collections`);
      const xpathColection =
        `(//div[contains(@class,'collection-product-wrap') and ` +
        `descendant::h5[normalize-space()='${collectionEditTitle.collection_title}']])[1]`;
      await SFPage.waitForSelector(
        `${xpathColection}//img[contains(@class,'image sb-lazy loading has-ratio product-image')]`,
      );
      await SFPage.waitForSelector(
        `${xpathColection}//img[contains(@class,'image sb-lazy loading has-ratio product-image')]`,
        { state: "hidden" },
      );
      await expect(await SFPage.locator(xpathTitleCollectionList).isVisible()).toBe(true);
      SFPage.close();
    });

    await test.step(
      "Tại product list of Collection > Click btn x xóa product khỏi collection > Click Refresh >" +
        " Edit title collection > Click button Save",
      async () => {
        if (await collection.checkLocatorVisible("//button//span[normalize-space()='Refresh']")) {
          await collection.clickOnBtnWithLabel("Refresh");
          await dashboard.waitForSelector("//img[@class='sbase-spinner']");
          await dashboard.waitForSelector("//img[@class='sbase-spinner']", { state: "hidden" });
        }
        await collection.deleteProductInCollectionDetailPage(productDelete);
        expect(await collection.checkProductSyncToCollectionDetailPage(productDelete)).toBe(false);
      },
    );

    await test.step("Click [View] trên đầu trang > View collection ngoài SF", async () => {
      [SFPage] = await Promise.all([context.waitForEvent("page"), await collection.clickBtnViewCollection()]);
      collectionSF = new SFCollection(SFPage, conf.suiteConf.domain);
      await SFPage.waitForLoadState("networkidle");
      await SFPage.waitForSelector("(//img[contains(@class,'image sb-lazy loading hover-secondary')])[1]", {
        state: "hidden",
      });
      await expect(await collectionSF.checkProductSyncToCollectionSF(productDelete)).toBe(false);
      SFPage.close();
    });
  });
});
