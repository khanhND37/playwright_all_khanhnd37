import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { DefaultGetProductAPIParam } from "@constants";

test.describe(`Verify create new product and edit digital product with 3 type`, () => {
  let productPage: ProductPage;
  let productAPI: ProductAPI;
  let productInfo;
  let sectionInfo;
  let lectureInfo;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    test.setTimeout(conf.suiteConf.timeout);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    productInfo = conf.caseConf.product;
    sectionInfo = conf.caseConf.section;
    lectureInfo = conf.caseConf.lecture;
    await productPage.navigateToMenu("Products");
    await productPage.openAddProductScreen();
  });

  test.afterEach(async () => {
    const products = await productAPI.getProducts(DefaultGetProductAPIParam);
    const productIds = products?.data?.map(item => item.id) || [];
    await productAPI.deleteProduct(productIds);
  });

  test(`Verify chức năng Add product @SB_SC_SCP_34`, async ({ conf }) => {
    const productTitle = conf.caseConf.product_title;
    const productHandle = conf.caseConf.product_handle;
    const productType = conf.caseConf.product_types;
    const productSuccess = conf.caseConf.product_success;

    await test.step(`Chọn menu [Products] > chọn [All products].Click "Add product".`, async () => {
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Title"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("URL and handle"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Online course"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Coaching session"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Digital download"))).toBeVisible();
    });

    await test.step(`Add "Title" cho product Click button "Add product"`, async () => {
      for (let i = 0; i < productTitle.length; i++) {
        await productPage.addNewProduct(productTitle[i].title, productTitle[i].product_type);
        if (productTitle[i].err_msg) {
          await productPage.checkMsgAfterCreated(productTitle[i].err_msg);
        } else {
          await expect(productPage.genLoc(productPage.xpathGeneralTab)).toBeVisible();
        }
      }
    });

    await test.step(`Trên trang product list, click "Add product" - Input "Product title"
    - Input "URL and handle" - Click button "Add product"`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.openAddProductScreen();
      await productPage.addNewProduct(productHandle.title, productHandle.product_type, productHandle.handle);
      //verify product name, general tab after create product
      await expect(productPage.genLoc(productPage.xpathGeneralTab)).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel(productHandle.title))).toBeVisible();

      //verify product with api response
      const productId = await productPage.getDigitalProductID();
      const productDetailResponse = await productAPI.getProduct(parseInt(productId));
      const productResponse = productDetailResponse?.data?.products[0];
      const productVerifyData = {
        title: productResponse.product.title,
        handle: productResponse.product.handle,
        product_type: productResponse.product.product_type,
      };
      expect(productVerifyData).toEqual(productHandle);
    });

    await test.step(`Trên trang product list, click "Add product"- Input "Product title"
    - Select "Product type"- Click button "Add product"`, async () => {
      for (let i = 0; i < productType.length; i++) {
        await productPage.navigateToMenu("Products");
        await productPage.openAddProductScreen();
        await productPage.addNewProduct(productType[i].title, productType[i].product_type, productType[i].handle);
        //verify product name, general tab after create product
        await expect(productPage.genLoc(productPage.xpathGeneralTab)).toBeVisible();
        await expect(productPage.genLoc(productPage.getXpathWithLabel(productType[i].title))).toBeVisible();

        //verify product with api response
        const productId = await productPage.getDigitalProductID();
        const productDetailResponse = await productAPI.getProduct(parseInt(productId));
        const productResponse = productDetailResponse?.data?.products[0];
        const productVerifyData = {
          title: productResponse.product.title,
          handle: productResponse.product.handle,
          product_type: productResponse.product.product_type,
        };
        expect(productVerifyData).toEqual(productType[i]);
      }
    });

    await test.step(`Trên trang product list, click "Add product"- Input "Title" cho product
    - Click button "Cancel" add product`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.openAddProductScreen();
      await productPage.inputProductTitle(productSuccess.title);
      await productPage.clickCancelButton();
      await expect(productPage.genLoc(productPage.xpathAllProductsHeader)).toBeVisible();
    });

    await test.step(`Trên trang product list, click "Add product"- Input "Title" cho product
    - Click button "Add product"`, async () => {
      await productPage.navigateToMenu("Products");
      await productPage.openAddProductScreen();
      await productPage.addNewProduct(productSuccess.title, productSuccess.product_type, productSuccess.handle);
      //verify product name, general tab after create product
      await expect(productPage.genLoc(productPage.xpathGeneralTab)).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel(productSuccess.title))).toBeVisible();

      //verify product with api response
      const productId = await productPage.getDigitalProductID();
      const productDetailResponse = await productAPI.getProduct(parseInt(productId));
      const productResponse = productDetailResponse?.data?.products[0];
      const productVerifyData = {
        title: productResponse.product.title,
        handle: productResponse.product.handle,
        product_type: productResponse.product.product_type,
      };
      expect(productVerifyData).toEqual(productSuccess);
    });
  });

  test(`[General tab] Verify block Thumbnail image @SB_SC_SCP_39`, async ({ conf }) => {
    const thumbnailUpload = conf.caseConf.thumbnail_upload;
    const thumbnailLink = conf.caseConf.thumbnail_link;
    await test.step(`Mở product detail > chọn tab "General"Verify UI của block Thumbnail image`, async () => {
      await productPage.addNewProduct(productInfo.title, productInfo.product_type);
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Thumbnail image"))).toBeVisible();
    });

    await test.step(`Click vào "Upload or drop file"`, async () => {
      for (let i = 0; i < thumbnailUpload.length; i++) {
        await productPage.uploadThumbnailProduct(thumbnailUpload[i].file_path);
        if (thumbnailUpload[i].err_msg) {
          await productPage.checkMsgAfterCreated(thumbnailUpload[i].err_msg);
        } else {
          await expect(productPage.genLoc(productPage.xpathImageProductDetail)).toBeVisible();
        }
      }
    });

    await test.step(`Chọn "Embed external link"`, async () => {
      for (let i = 0; i < thumbnailLink.length; i++) {
        await productPage.clickButtonDeleteImage();
        await productPage.uploadThumbnailProduct(thumbnailLink[i].file_path, thumbnailLink[i].file);
        if (thumbnailLink[i].err_msg) {
          await productPage.checkMsgAfterCreated(thumbnailLink[i].err_msg);
        } else {
          await expect(productPage.genLoc(productPage.xpathImageProductDetail)).toBeVisible();
        }
      }
    });
  });

  test(`Verify các trường Title, Description, Status của chapter @SB_SC_SCP_44`, async ({ conf }) => {
    const sectionTitle = conf.caseConf.section_title;
    const sectionDescription = conf.caseConf.section_description;
    const sectionStatus = conf.caseConf.section_status;

    await test.step(`Click button "Add chapter"`, async () => {
      await productPage.addNewProduct(productInfo.title, productInfo.product_type, productInfo.handle);
      await productPage.switchTab("Content");
      await productPage.clickAddSection();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Add chapter"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Title"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Description"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Status"))).toBeVisible();
    });

    await test.step(`Input trường "Title" cho chapter. Click "Save" chapter.`, async () => {
      for (let i = 0; i < sectionTitle.length; i++) {
        await productPage.inputSectionOrLectureInfo(
          sectionTitle[i].title,
          sectionTitle[i].description,
          sectionTitle[i].status,
        );
        await productPage.clickSaveBar();
        if (sectionTitle[i].err_msg) {
          await productPage.checkMsgAfterCreated(sectionTitle[i].err_msg);
        } else {
          await expect(
            productPage.genLoc(productPage.getXpathWithLabel("How to create an online course with ShopBase Creator?")),
          ).toBeVisible();
          await productPage.clickAddSection();
        }
      }
    });

    await test.step(`Input trường "Description" cho chapter. Click "Save" chapter.`, async () => {
      for (let i = 0; i < sectionDescription.length; i++) {
        await productPage.inputSectionOrLectureInfo(
          sectionDescription[i].title,
          sectionDescription[i].description,
          sectionDescription[i].status,
        );
        await productPage.clickSaveBar();
        await expect(
          productPage.genLoc(productPage.getXpathWithLabel("How to create an online course with ShopBase Creator?")),
        ).toBeVisible();
        await productPage.clickAddSection();
      }
    });

    await test.step(`Check block "Status" của chapter. Click "Save" chapter.`, async () => {
      for (let i = 0; i < sectionStatus.length; i++) {
        await productPage.inputSectionOrLectureInfo(
          sectionStatus[i].title,
          sectionStatus[i].description,
          sectionStatus[i].status,
        );
        await productPage.clickSaveBar();
        await expect(
          productPage.genLoc(productPage.getXpathWithLabel("How to create an online course with ShopBase Creator?")),
        ).toBeVisible();
        await productPage.clickAddSection();
      }
    });
  });

  test(`	Verify các trường Title, Notes, Description, Status của lesson của product online course trong Content tab @SB_SC_SCP_47`, async ({
    conf,
  }) => {
    const lectureTitle = conf.caseConf.lecture_title;
    const lectureStatus = conf.caseConf.lecture_status;

    await test.step(`Click "Add lecture".`, async () => {
      await productPage.addNewProduct(productInfo.title, productInfo.product_type, productInfo.handle);
      await productPage.switchTab("Content");
      await productPage.clickAddSection();
      await productPage.inputSectionOrLectureInfo(sectionInfo.title, sectionInfo.description, sectionInfo.status);
      await productPage.clickSaveBar();
      expect(await productPage.getTextOfToast("success")).toEqual("Added chapter successfully!");
      await productPage.clickAddLecture(sectionInfo.title);
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Title"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Status"))).toBeVisible();
    });

    await test.step(`Input trường "Title" cho lecture. Click "Save" lecture.`, async () => {
      for (let i = 0; i < lectureTitle.length; i++) {
        await productPage.inputSectionOrLectureInfo(
          lectureTitle[i].title,
          lectureTitle[i].description,
          lectureTitle[i].status,
        );
        if (lectureTitle[i].err_msg) {
          await productPage.checkMsgAfterCreated(lectureTitle[i].err_msg);
        } else {
          await productPage.clickSaveBar();
          expect(await productPage.getTextOfToast("success")).toEqual("Added lesson successfully!");
          await productPage.clickBackScreen();
          await productPage.clickAddLecture(sectionInfo.title);
        }
      }
    });

    await test.step(`Check block "Status" của lecture. Click "Save" lecture.`, async () => {
      for (let i = 0; i < lectureStatus.length; i++) {
        await productPage.inputSectionOrLectureInfo(
          lectureStatus[i].title,
          lectureStatus[i].text,
          lectureStatus[i].status,
        );
        await productPage.clickSaveBar();
        expect(await productPage.getTextOfToast("success")).toEqual("Added lesson successfully!");
        await productPage.clickBackScreen();
        await productPage.clickAddLecture(sectionInfo.title);
      }
    });
  });

  test(`Verify action upload file Image mục add media cho lesson của product online course trong Content tab @SB_SC_SCP_48`, async ({
    conf,
  }) => {
    const medias = conf.caseConf.media;
    const mediasLink = conf.caseConf.media_link;

    await test.step(`Click vào "Upload file" > Upload file"`, async () => {
      await productPage.addNewProduct(productInfo.title, productInfo.product_type, productInfo.handle);
      await productPage.switchTab("Content");
      await productPage.clickAddSection();
      await productPage.inputSectionOrLectureInfo(sectionInfo.title, sectionInfo.description, sectionInfo.status);
      await productPage.clickSaveBar();
      await productPage.clickAddLecture(sectionInfo.title);
      for (let i = 0; i < medias.length; i++) {
        await productPage.inputSectionOrLectureInfo(lectureInfo.title, lectureInfo.description, lectureInfo.status);
        await productPage.uploadFileOrMedia(medias[i].type_file, medias[i].path_file);
        await productPage.clickSaveBar();
        if (medias[i].err_msg) {
          expect(await productPage.getTextOfToast("danger")).toEqual(medias[i].err_msg);
          await productPage.clickBackScreen();
          await productPage.clickAddLecture(sectionInfo.title);
        } else {
          await productPage.waitForMedia();
          await productPage.clickBackScreen();
          await productPage.clickAddLecture(sectionInfo.title);
        }
      }
    });

    await test.step(`Chọn "Embed external link" Click button "Save" lecture`, async () => {
      for (let i = 0; i < mediasLink.length; i++) {
        await productPage.inputSectionOrLectureInfo(lectureInfo.title, lectureInfo.description, lectureInfo.status);
        await productPage.uploadFileOrMedia(mediasLink[i].type_file, mediasLink[i].path_file);
        if (mediasLink[i].msg) {
          await productPage.clickSaveBar();
          expect(await productPage.getTextOfToast("success")).toEqual(mediasLink[i].msg);
          await productPage.clickBackScreen();
          await productPage.clickAddLecture(sectionInfo.title);
        } else {
          expect(await productPage.getTextOfToast("danger")).toEqual(mediasLink[i].err_msg);
          await productPage.clickSaveBar();
        }
      }
    });

    await test.step(`Click button "Delete" ở ảnh vừa upload`, async () => {
      await productPage.clickBackScreen();
      await productPage.clickAddLecture(sectionInfo.title);
      await productPage.inputSectionOrLectureInfo(lectureInfo.title, lectureInfo.description, lectureInfo.status);
      await productPage.uploadFileOrMedia(
        conf.caseConf.upload_success.type_file,
        conf.caseConf.upload_success.path_file,
      );
      await productPage.waitForMedia();
      await productPage.clickSaveBar();
      await productPage.clickButtonDeleteMedia();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("or drop your files here"))).toBeVisible();
    });
  });

  test(`Verify trường section title của product digital download trong Content tab @SB_SC_SCP_51`, async ({ conf }) => {
    await test.step(`Input trường "Title".Click "Save".`, async () => {
      const files = conf.caseConf.files;
      await productPage.addNewProduct(productInfo.title, productInfo.product_type, productInfo.handle);
      for (let i = 0; i < sectionInfo.length; i++) {
        await productPage.switchTab("Content");
        await productPage.inputSectionOrLectureInfo(
          sectionInfo[i].title,
          sectionInfo[i].description,
          sectionInfo[i].status,
          sectionInfo[i].type,
        );
        await productPage.uploadFileOrMedia(files.type_file, files.path_file, files.type_product);
        await productPage.clickSaveBar();
      }
    });
  });

  test(`Verify action upload file trong block Attachments của product digital download trong Content tab @SB_SC_SCP_52`, async ({
    conf,
  }) => {
    const medias = conf.caseConf.media;
    const mediasLink = conf.caseConf.media_link;
    const editFile = conf.caseConf.edit_file;

    await test.step(`Click vào "Upload file" Click button "Save" lecture`, async () => {
      await productPage.addNewProduct(productInfo.title, productInfo.product_type, productInfo.handle);
      await productPage.genLoc(productPage.xpathToastMsg).isHidden();
      await productPage.switchTab("Content");
      await productPage.inputContentInfo(sectionInfo.title);
      for (let i = 0; i < medias.length; i++) {
        await productPage.uploadDigitalDownload(medias[i].type_file, medias[i].path_file);
        //expect file uploaded hiển thị trong list file and progress popover
        if (medias[i].err_msg) {
          await productPage.checkMsgAfterCreated(medias[i].err_msg);
        } else {
          await expect(productPage.genLoc(productPage.getXpathWithLabel("Uploading media"))).toBeEnabled();
          await expect(productPage.getXpathAttachmentName(medias[i].file_name)).toBeVisible();
          await expect(productPage.getXpathFileOnPopOver(medias[i].file_name)).toBeVisible();
          await productPage.waitForUpload();
        }
      }
      await productPage.clickSaveBar();
    });

    await test.step(`Chọn "Embed external link" Click button "Save"`, async () => {
      for (let i = 0; i < mediasLink.length; i++) {
        await productPage.uploadDigitalDownload(mediasLink[i].type_file, mediasLink[i].path_file);
        const fileName = mediasLink[i].file_name;
        await expect(productPage.getXpathAttachmentName(fileName)).toBeVisible();
        await productPage.clickSaveBar();
      }
    });

    await test.step(`Click button "Edit" trong file uploaded list > Edit file name`, async () => {
      for (const fileItem of editFile) {
        await productPage.editFileName(fileItem.file_name, fileItem.new_name);
        await productPage.clickSaveBar();
        if (fileItem.new_name === "") {
          await productPage.checkMsgAfterCreated(fileItem.err_msg);
        } else {
          await expect(productPage.getXpathAttachmentName(fileItem.new_name)).toBeVisible();
        }
      }
    });

    await test.step(`Click button "Delete" trong file uploaded list`, async () => {
      const fileDeleted = conf.caseConf.delete_file;
      await productPage.deleteFile(fileDeleted);
      await expect(productPage.getXpathBtnDeleteAttachment(fileDeleted)).toBeDisabled();
    });
  });

  test(`Verify action thay đổi status trong block Status của product digital download trong Content tab @SB_SC_SCP_53`, async ({
    conf,
  }) => {
    const sectionEdit = conf.caseConf.section_edit;

    await test.step(`Mở tab "Content"`, async () => {
      await productPage.addNewProduct(productInfo.title, productInfo.product_type, productInfo.handle);
      await productPage.switchTab("Content");
      await expect(productPage.getXpathTabTitle("Content")).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Heading (optional)"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Attachments"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Status"))).toBeVisible();
    });

    await test.step(`Xác nhận hiển thị của block status`, async () => {
      await expect(productPage.getXpathInputWithValue("published")).toBeVisible();
      await expect(productPage.getXpathInputWithValue("unpublished")).toBeVisible();
    });

    await test.step(`Create section với status = published`, async () => {
      await productPage.switchTab("Content");
      await productPage.inputContentInfo(sectionInfo.title, sectionInfo.status);
      await productPage.uploadDigitalDownload(sectionInfo.type_file, sectionInfo.path_file);
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Uploading media"))).toBeEnabled();
      await productPage.waitForUpload();
      await productPage.clickSaveBar();
      await expect(productPage.getXpathInputWithValue("published")).toBeChecked();
    });

    await test.step(`Thay đổi status thành unpublished`, async () => {
      await productPage.switchTab("Content");
      await productPage.inputContentInfo(sectionEdit.title, sectionEdit.status);
      await productPage.clickSaveBar();
      await expect(productPage.getXpathInputWithValue("unpublished")).toBeChecked();
    });
  });

  test(`Verify block Scheduling của product coaching session trong General tab @SB_SC_SCP_41`, async ({
    conf,
    context,
  }) => {
    await productPage.addNewProduct(productInfo.title, productInfo.product_type, productInfo.handle);
    await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMsg);
    await expect(productPage.genLoc(productPage.getXpathWithLabel("Scheduling"))).toBeVisible();

    await test.step(`Click product "test coaching scheduling" để view product detail > Check option default của Scheduling ở tab General`, async () => {
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Embed booking calendar"))).toBeVisible();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("Custom calendar link"))).toBeVisible();
      await expect(
        productPage.genLoc("//*[normalize-space() = 'Embed booking calendar']/parent::div//input[@value='embed']"),
      ).toBeVisible();
    });

    await test.step(`Input link schedule hợp lệ của các bên thứ 3 -> View product trên StoreFront`, async () => {
      const dataInputLinkSchedule = conf.caseConf.data_input_link_schedule;
      for (const data of dataInputLinkSchedule) {
        await productPage.inputSchedule(data.schedule_type, data.schedule);
        await productPage.clickSaveBar();
        expect(await productPage.getTextOfToast("success")).toEqual("Update product successfully");
        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          await productPage.clickToViewFromDetail("Preview content as member"),
        ]);
        await expect(
          sfTab.frameLocator("//iframe").locator("//div[@id='page-region']|//div[@id='screen-wrapper']"),
        ).toBeVisible();
      }
    });

    await test.step(`Input link schedule không phải là các link: calendly, savvycal, youcanbook.me:
      1. Nhập link vào textbox -> click btn Save ở Save bar. > kiểm tra hiển thị link đã insert trước đó ở textbox Custom caledar link.
      2. Trên SF, vào lại màn My product, member click vào product coaching session trên > click btn Schedule now`, async () => {
      const dataInputNotLinkSchedule = conf.caseConf.data_input_not_link_schedule;
      for (const data of dataInputNotLinkSchedule) {
        await productPage.inputSchedule(data.schedule_type, data.schedule);
        await productPage.clickSaveBar();
        expect(await productPage.getTextOfToast("success")).toEqual("Update product successfully");
        expect(
          await productPage
            .genLoc(
              "//*[normalize-space() = 'Embed booking calendar']/parent::div//div[contains(@class,'input__body')]//input",
            )
            .inputValue(),
        ).toEqual(data.link);

        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          await productPage.clickToViewFromDetail("Preview content as member"),
        ]);
        await expect(sfTab.locator(productPage.getXpathWithLabel("Schedule now"))).toBeVisible();

        const [sfTabNew] = await Promise.all([
          context.waitForEvent("page"),
          await sfTab.locator("//a[normalize-space()='Schedule now']").click(),
        ]);
        if (data.third_service === true) {
          expect(sfTabNew.url()).toContain(data.link);
        } else {
          expect(sfTabNew.url()).toEqual("chrome-error://chromewebdata/");
        }
      }
    });

    await test.step(`Select Custom calendar link -> Input link schedule -> View product trên StoreFront`, async () => {
      const dataInputLinkCustom = conf.caseConf.data_input_link_custom_calendar;
      for (const data of dataInputLinkCustom) {
        await productPage.inputSchedule(data.schedule_type, data.schedule);
        await productPage.clickSaveBar();
        expect(await productPage.getTextOfToast("success")).toEqual("Update product successfully");
        const [sfTab] = await Promise.all([
          context.waitForEvent("page"),
          await productPage.clickToViewFromDetail("Preview content as member"),
        ]);
        await expect(sfTab.locator(productPage.getXpathWithLabel("Schedule now"))).toBeVisible();
      }
    });
  });

  test(`Verify action upload Video mục add media cho lesson của product online course trong Content tab @SB_SC_SCP_49`, async ({
    conf,
  }) => {
    const medias = conf.caseConf.media;
    const mediasLink = conf.caseConf.media_link;

    await test.step(`Click vào "Upload or drop file". Upload Video. Click button "Save" lecture`, async () => {
      await productPage.addNewProduct(productInfo.title, productInfo.product_type, productInfo.handle);
      await productPage.switchTab("Content");
      await productPage.clickAddSection();
      await productPage.inputSectionOrLectureInfo(sectionInfo.title, sectionInfo.description, sectionInfo.status);
      await productPage.clickSaveBar();
      await productPage.clickAddLecture(sectionInfo.title);
      for (let i = 0; i < medias.length; i++) {
        await productPage.inputSectionOrLectureInfo(lectureInfo.title, lectureInfo.description, lectureInfo.status);
        await productPage.clickSaveBar();
        await expect(productPage.genLoc(productPage.getXpathWithLabel("Edit lesson"))).toBeVisible();
        await productPage.uploadFileOrMedia(medias[i].type_file, medias[i].path_file);
        if (medias[i].err_msg) {
          expect(await productPage.getTextOfToast("danger")).toEqual(medias[i].err_msg);
          await productPage.clickBackScreen();
          await productPage.clickAddLecture(sectionInfo.title);
        } else {
          await productPage.waitForUpload();
          await productPage.waitForMedia();
          await productPage.clickBackScreen();
          await productPage.clickAddLecture(sectionInfo.title);
        }
      }
    });

    await test.step(`Chọn "Embed external link". Click button "Save" lecture`, async () => {
      for (let i = 0; i < mediasLink.length; i++) {
        await productPage.inputSectionOrLectureInfo(lectureInfo.title, lectureInfo.description, lectureInfo.status);
        await productPage.uploadFileOrMedia(mediasLink[i].type_file, mediasLink[i].path_file);
        if (mediasLink[i].msg) {
          await productPage.clickSaveBar();
          expect(await productPage.getTextOfToast("success")).toEqual(mediasLink[i].msg);
          await productPage.clickBackScreen();
          await productPage.clickAddLecture(sectionInfo.title);
        } else {
          expect(await productPage.getTextOfToast("danger")).toEqual(mediasLink[i].err_msg);
          await productPage.clickSaveBar();
        }
      }
    });

    await test.step(`Click button "Delete" ở video vừa upload`, async () => {
      await productPage.clickBackScreen();
      await productPage.clickAddLecture(sectionInfo.title);
      await productPage.inputSectionOrLectureInfo(lectureInfo.title, lectureInfo.description, lectureInfo.status);
      await productPage.clickSaveBar();
      await productPage.uploadFileOrMedia(
        conf.caseConf.upload_success.type_file,
        conf.caseConf.upload_success.path_file,
      );
      await productPage.waitForMedia();
      await productPage.clickButtonDeleteMedia();
      await expect(productPage.genLoc(productPage.getXpathWithLabel("or drop your files here"))).toBeVisible();
    });

    await test.step(`Click vào "Upload or drop file". Upload Video. Click button "Back"`, async () => {
      await productPage.clickBackScreen();
      await productPage.clickAddLecture(sectionInfo.title);
      await productPage.inputSectionOrLectureInfo(lectureInfo.title, lectureInfo.description, lectureInfo.status);
      await productPage.clickSaveBar();
      await productPage.uploadFileOrMedia(
        conf.caseConf.upload_success.type_file,
        conf.caseConf.upload_success.path_file,
      );
      await productPage.clickBackScreen();
      await expect(productPage.genLoc(productPage.xpathCompletePopup)).toBeVisible();
    });
  });

  test(`Verify block Search engine listing preview của General tab @SB_SC_SCP_40`, async ({ conf }) => {
    const productData = conf.caseConf.products;
    const pageTitle = conf.caseConf.page_titles;
    const metaDescription = conf.caseConf.meta_descriptions;

    await test.step(`Input trường "Page title" trong Search engine listing preview:
      a. Check giá trị default
      b. Input "Page title" > 70 ký tự.
      c. Input "Page title" chứa ký tự đặc biệt: "Special %$^*(@#&) _0-"
      d. Delete toàn bộ text trong trường "Page title"
        Click button "Save" product`, async () => {
      for (const productItem of productData) {
        await productPage.addNewProduct(productItem.title, productItem.product_type);
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMsg);
        expect(
          await productPage.page.getAttribute(productPage.getXpathInputWithLabel("Page title"), "placeholder"),
        ).toEqual(productItem.title);
        for (const titleItem of pageTitle) {
          await productPage.inputPageTitle(titleItem.title);
          await productPage.clickSaveBar();
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMsg);
          if (titleItem.max_length_msg) {
            expect((await productPage.getXpathMsgCharacter("Page title").textContent()).trim()).toEqual(
              titleItem.max_length_msg,
            );
          } else {
            if (titleItem.title === "") {
              expect(await productPage.genLoc(productPage.getXpathInputWithLabel("Page title")).inputValue()).toEqual(
                productItem.title,
              );
            } else {
              expect(await productPage.genLoc(productPage.getXpathInputWithLabel("Page title")).inputValue()).toEqual(
                titleItem.title,
              );
            }
          }
        }
        await productPage.navigateToMenu("Products");
        await productPage.openAddProductScreen();
      }
    });

    await test.step(`Input trường "Meta description" trong Search engine listing preview:
    //   a. Input > 320 ký tự
    //   b. Delete toàn bộ text
    //   c. Input chứa ký tự đặc biệt: "Special %$^*(@#&) _0-"
    //   Click button "Save" product`, async () => {
      for (const productItem of productData) {
        await productPage.navigateToMenu("Products");
        await productPage.clickTitleProduct(productItem.title);
        for (const desItem of metaDescription) {
          await productPage.inputMetaDescription(desItem.description);
          await productPage.clickSaveBar();
          await productPage.waitForElementVisibleThenInvisible(productPage.xpathToastMsg);
          if (desItem.max_length_msg) {
            expect((await productPage.getXpathMsgCharacter("Meta description").textContent()).trim()).toEqual(
              desItem.max_length_msg,
            );
          } else {
            expect(await productPage.genLoc(productPage.xpathTextMetaDescription).inputValue()).toEqual(
              desItem.description,
            );
          }
        }
      }
    });
  });
});
