import { expect, test } from "@core/fixtures";
import { ClipartPage } from "@pages/dashboard/clipart";
import { SFHome } from "@sf_pages/homepage";
import appRoot from "app-root-path";
import { loadData } from "@core/conf/conf";
import { SFProduct } from "@sf_pages/product";
import { Personalize } from "@pages/dashboard/personalize";
import { Campaign } from "@sf_pages/campaign";
import { waitForImageLoaded } from "@utils/theme";

test.beforeEach(async ({ conf }, testInfo) => {
  testInfo.snapshotSuffix = "";
  test.setTimeout(conf.suiteConf.time_out);
});

test.describe("Clipart folder for PrintBase", () => {
  test("Check hiển thị màn Clipart @SB_PRB_LB_CA_01", async ({ dashboard, conf, snapshotFixture }) => {
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const picture = conf.caseConf.picture;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const threshold = conf.suiteConf.threshold;

    await test.step("Đi đến màn Library > Clipart > Check hiển thị màn hình Clipart folder", async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.deleteAllClipartFolderOrGroup("folder");
      await snapshotFixture.verify({
        page: dashboard,
        selector: clipartPage.xpathPageClipart,
        snapshotName: picture.picture_clipart_folder,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Click tab Clipart groups > Check hiển thị Clipart group", async () => {
      await clipartPage.clickElementWithLabel("p", "Clipart groups");
      await clipartPage.deleteAllClipartFolderOrGroup("group");
      await snapshotFixture.verify({
        page: dashboard,
        selector: clipartPage.xpathPageClipart,
        snapshotName: picture.picture_clipart_group,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test(" [Create clipart folder] Check create folder thành công với field Name @SB_PRB_LB_CA_2", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const picture = conf.caseConf.picture;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const threshold = conf.suiteConf.threshold;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    const message = conf.caseConf.message;
    const productInfo = conf.caseConf.product_info;
    const layers = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_options;
    const pricingInfor = conf.caseConf.pricing_info;

    await test.step("Đi đến màn Library > Clipart > Check hiển thị màn hình Clipart folder", async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickOnBtnWithLabel("Create folder", 1);
      // wait list icon inline
      await clipartPage.page.waitForSelector(clipartPage.xpathIconInLineByName("300 Files"));
      await clipartPage.page.waitForSelector(clipartPage.xpathIconInLineByName(".PNG, .JPG"));
      await clipartPage.page.waitForSelector(clipartPage.xpathIconInLineByName("20 MB"));
      await clipartPage.removeLiveChat();
      await snapshotFixture.verify({
        page: dashboard,
        selector: clipartPage.xpathClipartDetail,
        snapshotName: picture.picture_clipart_folder_detail,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Bỏ trống trường Name, Chọn Group 01, Upload image > Click vào btn Save changes", async () => {
      await clipartPage.addNewClipartFolder(clipartFolderInfo[0]);
      await clipartPage.clickOnBtnWithLabel("Save changes", 1);
      for (let i = 0; i < clipartFolderInfo[0].images.length; i++) {
        await waitForImageLoaded(clipartPage.page, `(//div[@class='campaign-thumb-box']//img)[${i + 1}]`);
      }
      await clipartPage.checkMsgAfterCreated({
        errMsg: message.message_folder_name_null,
      });
    });

    await test.step(
      "- Nhập Name = Folder 01\n" +
        "- Chọn Group = Group 01\n" +
        "- Upload image Cliparts: image.png\n" +
        "- Click button Save changes",
      async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.clickOnBtnWithLabel("Create folder", 1);
        await clipartPage.addNewClipartFolder(clipartFolderInfo[1]);
        await clipartPage.clickOnBtnWithLabel("Save changes", 1);
        await clipartPage.waitForElementVisibleThenInvisible("//button[contains(@class, 'is-loading')]");
        await clipartPage.waitForElementVisibleThenInvisible(clipartPage.xpathLoadForm);
        for (let i = 0; i < clipartFolderInfo[1].images.length; i++) {
          await waitForImageLoaded(clipartPage.page, `(//div[@class='campaign-thumb-box']//img)[${i + 1}]`);
        }
        await clipartPage.waitForElementVisibleThenInvisible(clipartPage.xpathLoadForm);
        await dashboard.waitForSelector(clipartPage.xpathClipartDetail);
        await snapshotFixture.verify({
          page: dashboard,
          selector: clipartPage.xpathClipartDetail,
          snapshotName: picture.picture_clipart_folder_info,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("- Click button Create folder\n" + "- Nhập Name = Folder 01", async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickOnBtnWithLabel("Create folder", 1);
      await clipartPage.addNewClipartFolder(clipartFolderInfo[2]);
      await clipartPage.checkMsgAfterCreated({
        errMsg: message.message_folder_exist,
      });
    });

    await test.step(
      "-Đi đến màn Catalog > Apprel\n" +
        '- Chọn base "Unisex T-shirt"\n' +
        '- Click button "Create new campaign"\n' +
        '- Tại Front side -> click button "Add image"\n' +
        "- Chọn image = BD_2.png",
      async () => {
        await clipartPage.navigateToMenu("Campaigns");
        await clipartPage.deleteAllCampaign(conf.caseConf.password);
        await clipartPage.navigateToMenu("Catalog");
        await clipartPage.waitForElementVisibleThenInvisible(clipartPage.xpathPageCatalogLoad);
        await clipartPage.addBaseProducts(productInfo);
        await clipartPage.clickOnBtnWithLabel("Create new campaign");
        await clipartPage.addNewLayers(layers);
        await clipartPage.clickBtnExpand();
        await clipartPage.clickOnBtnWithLabel("Customize layer");
        await clipartPage.addCustomOptions(customOptions);
        await clipartPage.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: picture.picture_editor_campaign,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("Click btn Continue > Input title", async () => {
      await clipartPage.clickOnBtnWithLabel("Continue");
      await clipartPage.inputPricingInfo(pricingInfor);
      const campaignId = clipartPage.getCampaignIdInPricingPage();
      await clipartPage.clickOnBtnWithLabel("Launch");
      const isAvailable = await clipartPage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });
  });

  test("[Create clipart folder] Check create folder thành công với field Group @SB_PRB_LB_CA_3", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const picture = conf.caseConf.picture;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const threshold = conf.suiteConf.threshold;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;

    await test.step(
      "- Đi đến màn Library > Clipart: /admin/pod/clipart\n" +
        "- Nhập Name = Folder 02\n" +
        "- Bỏ trống field Group\n" +
        "- Upload image Cliparts: image.png\n" +
        "- Click button Save changes",
      async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.clickOnBtnWithLabel("Create folder", 1);
        await clipartPage.addNewClipartFolder(clipartFolderInfo[0]);
        await clipartPage.clickOnBtnWithLabel("Save changes", 1);
        await dashboard.waitForTimeout(6000);
        await snapshotFixture.verify({
          page: dashboard,
          selector: clipartPage.xpathClipartDetail,
          snapshotName: picture,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step(
      "- Đi đến màn Library > Clipart: /admin/pod/clipart\n" +
        "- Nhập Name = Folder 03\n" +
        "- Nhập Group = Group new\n" +
        '- Click link text: Create group "Group new"\n' +
        "- Upload image Cliparts: image.png\n" +
        "- Click button Save changes",
      async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.clickOnBtnWithLabel("Create folder", 1);
        await clipartPage.addNewClipartFolder(clipartFolderInfo[1]);
        await clipartPage.clickOnBtnWithLabel("Save changes", 1);
      },
    );

    await test.step("- Click tab Clipart groups\n" + "- Check hiển thị màn Clipart groups", async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart groups");
      await expect(dashboard.locator(clipartPage.getXpathWithLabel(clipartFolderInfo[1].group_name, 1))).toBeVisible();
    });
  });

  test("[Create clipart folder] Check create folder thành công với field Cliparts @SB_PRB_LB_CA_4", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const picture = conf.caseConf.picture;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const threshold = conf.suiteConf.threshold;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    const message = conf.caseConf.message;
    const drag = conf.caseConf.drag;

    await test.step(
      "- Đi đến màn Library > Clipart: /admin/pod/clipart\n" +
        "- Nhập Name = Folder 04\n" +
        "- Chọn Group = Group 01\n" +
        "- Bỏ trống trường Cliparts\n" +
        "- Click button Save changes",
      async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.clickOnBtnWithLabel("Create folder", 1);
        await clipartPage.addNewClipartFolder(clipartFolderInfo[0]);
        await clipartPage.clickOnBtnWithLabel("Save changes", 1);
        await clipartPage.checkMsgAfterCreated({
          errMsg: message.message_required,
        });
      },
    );

    await test.step("- Upload image trùng image đã upload", async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickOnBtnWithLabel("Create folder", 1);
      await clipartPage.addNewClipartFolder(clipartFolderInfo[1]);
      await clipartPage.checkMsgAfterCreated({
        errMsg: message.message_limit_size_image,
      });
    });

    await test.step("Edit name image", async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickOnBtnWithLabel("Create folder", 1);
      await clipartPage.addNewClipartFolder(clipartFolderInfo[2]);
      await clipartPage.clickOnBtnWithLabel("Save changes", 1);
      await dashboard.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: clipartPage.xpathClipartDetail,
        snapshotName: picture.picture_edit_image_name,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("- Kéo thả vị trí của các cliparts", async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickOnBtnWithLabel("Create folder", 1);
      await clipartPage.addNewClipartFolder(clipartFolderInfo[3]);
      await clipartPage.clickOnBtnWithLabel("Save changes", 1);
      await clipartPage.dragAndDrop({
        from: {
          selector: clipartPage.xpathPositionClipartImage(drag.index_from),
        },
        to: {
          selector: clipartPage.xpathPositionClipartImage(drag.index_to),
        },
      });
      await clipartPage.clickOnBtnWithLabel("Save changes", 1);
      await dashboard.waitForTimeout(3000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: clipartPage.xpathClipartDetail,
        snapshotName: picture.picture_drag,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Create clipart folder] Check create folder thành công khi upload Thumbnail @SB_PRB_LB_CA_5", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const picture = conf.caseConf.picture;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const threshold = conf.suiteConf.threshold;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    const productInfo = conf.caseConf.product_info;
    const layers = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_options;
    const pricingInfor = conf.caseConf.pricing_info;

    await test.step(
      "- Đi đến màn Library > Clipart: /admin/pod/clipart\n" +
        "- Nhập Name = Folder 09\n" +
        "- Chọn Group = Group 01\n" +
        "- Upload image Clipart : BD_1.png, BD_2.png, BD_3.png\n" +
        "- Tại Thumbnail, click Upload another one ở BD_1" +
        "- Upload image thumbnail\n" +
        "- Click button Save changes",
      async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        // delete clipart folder
        await clipartPage.deleteAllClipartFolderOrGroup("folder");
        // create clipart folder
        await clipartPage.clickOnBtnWithLabel("Create folder", 1);
        await clipartPage.addNewClipartFolder(clipartFolderInfo[0]);
        await clipartPage.clickOnBtnWithLabel("Save changes", 1);
        for (let i = 0; i < clipartFolderInfo[0].images.length; i++) {
          await waitForImageLoaded(clipartPage.page, `(//div[@class='campaign-thumb-box']//img)[${i + 1}]`);
        }
        await clipartPage.waitForElementVisibleThenInvisible(clipartPage.xpathLoadForm);
        await clipartPage.page.waitForSelector(clipartPage.xpathClipartDetail);
        await snapshotFixture.verify({
          page: dashboard,
          selector: clipartPage.xpathClipartDetail,
          snapshotName: picture.picture_clipart_folder_info,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step(
      "-Đi đến màn Catalog > Apprel\n" +
        '- Chọn base "Unisex T-shirt"\n' +
        '- Click button "Create new campaign"\n' +
        '- Tại Front side -> click button "Add image"\n' +
        "- Chọn image = BD_2.png" +
        "- Click icon Add Custom option\n" +
        "- Chọn Type = Picture choice\n" +
        "- Chọn Clipart Folder = Folder 04\n" +
        "- Chọn Target Layers = BD_2",
      async () => {
        await clipartPage.navigateToMenu("Catalog");
        await clipartPage.addBaseProducts(productInfo);
        await clipartPage.clickOnBtnWithLabel("Create new campaign");
        await clipartPage.addNewLayers(layers);
        await clipartPage.clickBtnExpand();
        await clipartPage.clickOnBtnWithLabel("Customize layer");
        await clipartPage.addCustomOptions(customOptions);
        await clipartPage.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          snapshotName: picture.picture_editor_campaign_add_custom_option,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("Click btn Continue > Input title", async () => {
      await clipartPage.clickOnBtnWithLabel("Continue");
      await clipartPage.inputPricingInfo(pricingInfor);
      const campaignId = clipartPage.getCampaignIdInPricingPage();
      await clipartPage.clickOnBtnWithLabel("Launch");
      const isAvailable = await clipartPage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
    });
  });

  test("[List folders] Check khi Assign group tại màn List folders @SB_PRB_LB_CA_6", async ({ dashboard, conf }) => {
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const actionClipart = conf.caseConf.action_clipart;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    await test.step(
      "- Đi đến màn Library > Clipart: /admin/pod/clipart\n" +
        "- Search và check chọn Folder: Folder 02\n" +
        '- Click button Action -> chọn "Assign Group"\n' +
        "- Chọn Group 01\n" +
        "- CLick button Assign",
      async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        // delete clipart folder
        await clipartPage.deleteAllClipartFolderOrGroup("folder");
        // create clipart folder
        await clipartPage.clickOnBtnWithLabel("Create folder", 1);
        await clipartPage.addNewClipartFolder(clipartFolderInfo);
        await clipartPage.clickOnBtnWithLabel("Save changes", 1);
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        // Assign group
        for (let i = 0; i < actionClipart.length; i++) {
          await clipartPage.searchClipartOrGroup(actionClipart[i].clipart_name);
          await clipartPage.actionWithClipart(actionClipart[i]);
          await clipartPage.isToastMsgVisible("Success");
          await expect(
            dashboard.locator(clipartPage.getXpathWithLabel(actionClipart[i].clipart_name, 2)),
          ).toBeVisible();
        }
      },
    );

    await test.step(
      "- CLick tab Clipart groups\n" +
        "- Search và chọn Group 01\n" +
        "- Open Group detail\n" +
        '- Check "Clipart folders"',
      async () => {
        await clipartPage.clickElementWithLabel("p", "Clipart groups");
        await clipartPage.openClipartGroupDetail(actionClipart[0].group_name);
        await expect(dashboard.locator(clipartPage.getXpathWithLabel(actionClipart[0].clipart_name, 2))).toBeVisible();
      },
    );
  });

  test("[List folders] Check khi Delete Clipart folders tại màn List folders @SB_PRB_LB_CA_7", async ({
    dashboard,
    conf,
  }) => {
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const actionClipart = conf.caseConf.action_clipart;
    await test.step(
      "- Đi đến màn Library > Clipart: /admin/pod/clipart\n" +
        "- Search và check chọn Folder: Folder 02\n" +
        "- Click button Action\n" +
        '- CLick button "Delete Clipart folders"\n' +
        "- Click button Delete",
      async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.searchClipartOrGroup(actionClipart[0].clipart_name);
        const countClipart = await clipartPage.countClipartByName(actionClipart[0].clipart_name);
        for (let i = 0; i < countClipart; i++) {
          await clipartPage.actionWithClipart(actionClipart[0]);
        }
        await clipartPage.isToastMsgVisible("Success");
        await expect(dashboard.locator(clipartPage.getXpathWithLabel(actionClipart[0].clipart_name, 2))).toBeHidden();
      },
    );
  });

  test("[Edit clipart folder] Check khi edit các field của clipart Folder @SB_PRB_LB_CA_8", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const picture = conf.caseConf.picture;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const threshold = conf.suiteConf.threshold;
    const currentFolder = conf.caseConf.current_folder;
    const imageAddMore = conf.caseConf.image_add_more;
    const imageThumbnailEdit = conf.caseConf.image_thumbnail_edit;
    const clipartFolderInfor = conf.caseConf.clipart_folder_infor;

    await test.step(
      "- Đi đến màn Library > Clipart: /admin/pod/clipart\n" +
        "- Search và check chọn Folder: Folder 09\n" +
        "- Open folder detail",
      async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        // Tao clipart folder
        await clipartPage.deleteAllClipartFolderOrGroup("folder");
        await clipartPage.clickOnBtnWithLabel("Create folder", 1);
        await clipartPage.addNewClipartFolder(currentFolder);
        await clipartPage.clickOnBtnWithLabel("Save changes", 1);
        // open clipart folder detail
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.openClipartFolderDetail(currentFolder.folder_name);
        await clipartPage.waitForElementVisibleThenInvisible(clipartPage.xpathLoadForm);
        await clipartPage.page.waitForSelector(clipartPage.xpathClipartDetail);
        const countImageClipart = await clipartPage.page.locator("//div[@class='campaign-thumb-box']//img").count();
        for (let i = 1; i <= countImageClipart; i++) {
          await waitForImageLoaded(clipartPage.page, `(//div[@class='campaign-thumb-box']//img)[${i}]`);
        }
        await snapshotFixture.verify({
          page: dashboard,
          selector: clipartPage.xpathClipartDetail,
          snapshotName: picture.picture_clipart_detail,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step(
      "- Edit title : Folder Edit\n" +
        "- Chọn Group = Group new\n" +
        '- Click icon Xóa "BD_1"\n' +
        "- Upload image Clipart :BD_5.png, BD_6.png, BD_7.png, BD_8.png, BD_9.png\n" +
        '- Tại Thumbnail, click Upload another one ở "BD_5"\n' +
        "- Click button Save changes",
      async () => {
        // edit clipart folder
        await clipartPage.addNewClipartFolder(clipartFolderInfor[0]);
        await clipartPage.deleteImageInClipartFolder(conf.caseConf.image_preview_delete);
        await clipartPage.addMoreClipart(imageAddMore);
        const pathFileImageThumbnail = appRoot + `/data/shopbase/${imageThumbnailEdit.image_thumbnail}`;
        await clipartPage.editImageThumbnailInClipartFolder(imageThumbnailEdit.image_preview, pathFileImageThumbnail);
        await clipartPage.clickOnBtnWithLabel("Save changes", 1);
        await clipartPage.waitForElementVisibleThenInvisible(clipartPage.xpathLoadForm);
        await clipartPage.page.waitForSelector(clipartPage.xpathClipartDetail);
        const countImageClipart = await clipartPage.page.locator("//div[@class='campaign-thumb-box']//img").count();
        for (let i = 1; i <= countImageClipart; i++) {
          await waitForImageLoaded(clipartPage.page, `(//div[@class='campaign-thumb-box']//img)[${i}]`);
        }
        await snapshotFixture.verify({
          page: dashboard,
          selector: clipartPage.xpathClipartDetail,
          snapshotName: picture.picture_clipart_folder_info,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
          sizeCheck: true,
        });
      },
    );
  });

  test("[Create clipart group] Check tạo clipart group thành công khi Select existing clipart folders @SB_PRB_LB_CA_9", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const picture = conf.caseConf.picture;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const threshold = conf.suiteConf.threshold;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    const productInfo = conf.caseConf.product_info;
    const layers = conf.caseConf.layers;
    const customOptions = conf.caseConf.custom_options;
    const pricingInfo = conf.caseConf.pricing_info;
    const groupInfo = conf.caseConf.groups;

    await test.step("Pre condition: ", async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.deleteAllClipartFolderOrGroup("folder");
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart groups");
      await clipartPage.deleteAllClipartFolderOrGroup("group");
      await clipartPage.addListClipart(clipartFolderInfo);
    });

    await test.step("Đi đến màn hình tạo group clipart > Tạo group clipart > Verify thông tin tương ứng", async () => {
      for (let i = 0; i < groupInfo.length; i++) {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.clickElementWithLabel("p", "Clipart groups");
        await clipartPage.clickOnBtnWithLabel("Create group", 1);
        await clipartPage.addGroupClipart(groupInfo[i]);
        if (groupInfo[i].message) {
          await clipartPage.checkMsgAfterCreated({
            errMsg: groupInfo[i].message,
          });
        }
        if (groupInfo[i].snapshot_name) {
          await clipartPage.removeLiveChat();
          await snapshotFixture.verify({
            page: dashboard,
            selector: clipartPage.xpathClipartDetail,
            snapshotName: groupInfo[i].snapshot_name,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        }
      }
    });

    await test.step(
      "- Đi đến màn Catalog > Apprel\n" +
        '- Chọn base "Unisex T-shirt" \n' +
        '- Click button "Create new campaign"\n' +
        '- Tại Front side -> click button "Add image"\n' +
        "- Chọn image = BD_2.png\n" +
        "- Click icon Add Custom option\n" +
        "- Chọn Type = Picture choice\n" +
        '- Tại block Cliparts, chọn "Show all clipart in a clipart Groups"\n' +
        '- Click vào textfield "Select a Clipart group"',
      async () => {
        await clipartPage.navigateToMenu("Catalog");
        await clipartPage.addBaseProducts(productInfo);
        await clipartPage.clickOnBtnWithLabel("Create new campaign");
        await clipartPage.addNewLayers(layers);
        await clipartPage.clickBtnExpand();
        await clipartPage.clickOnBtnWithLabel("Customize layer");
        await clipartPage.addCustomOptions(customOptions);
        await dashboard.click(clipartPage.xpathCustomOptionName("Picture choice"));
        await dashboard.waitForSelector(clipartPage.xpathCustomOptionPCDetail, { timeout: 3000 });
        await clipartPage.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          selector: clipartPage.xpathCustomOptionPCDetail,
          snapshotName: picture.picture_custom_option_detail,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        await clipartPage.clickOnBtnWithLabel("Continue");
        await clipartPage.inputPricingInfo(pricingInfo);
        await clipartPage.clickOnBtnWithLabel("Launch");
      },
    );
  });

  test("[Create clipart group] Check tạo clipart group thành công với Clipart folders khi Add new clipart folder @SB_PRB_LB_CA_10", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const picture = conf.caseConf.picture;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const threshold = conf.suiteConf.threshold;
    const groupClipart = conf.caseConf.groups;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;

    await test.step("Pre condition: Delete clipart", async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.deleteAllClipartFolderOrGroup("folder");
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart groups");
      await clipartPage.deleteAllClipartFolderOrGroup("group");
    });

    await test.step(
      "- Đi đến màn Library > Clipart: /admin/pod/clipart\n" +
        "- Click tab : Clipart groups\n" +
        "- Click button Create group\n" +
        "- Input Name \n" +
        '- Click "Add new clipart folder"',
      async () => {
        await clipartPage.addListGroupClipart(groupClipart);
        await snapshotFixture.verify({
          page: dashboard,
          selector: clipartPage.xpathPopupClipart,
          snapshotName: picture.picture_popup_clipart,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("Add clipart folder từ màn hình group clipart detail", async () => {
      for (let i = 0; i < clipartFolderInfo.length; i++) {
        if (clipartFolderInfo[i].is_add_more_clipart) {
          await clipartPage.clickOnBtnWithLabel("Add new clipart folder", 1);
        }
        await clipartPage.addNewClipartFolder(clipartFolderInfo[i], 2);
        await clipartPage.clickOnBtnWithLabel("Save changes", 3);
        await clipartPage.page.waitForLoadState("networkidle");
        if (clipartFolderInfo[i].message) {
          await clipartPage.checkMsgAfterCreated({
            errMsg: clipartFolderInfo[i].message,
          });
          await clipartPage.page.click(clipartPage.xpathIconClose);
        } else {
          await expect(
            dashboard.locator(clipartPage.getXpathClipartFolderByName(clipartFolderInfo[i].folder_name)),
          ).toBeVisible();
        }
      }
    });

    await test.step("Verify hiển thị clipart folder trong màn hình group detail", async () => {
      await clipartPage.clickOnBtnWithLabel("Save changes", 1);
      await dashboard.waitForTimeout(2000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: clipartPage.xpathClipartDetail,
        snapshotName: picture.picture_group_detail,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("[Group detail page] Check khi edit vaule của group @SB_PRB_LB_CA_11", async ({
    dashboard,
    page,
    conf,
    snapshotFixture,
  }) => {
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const picture = conf.caseConf.picture;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const threshold = conf.suiteConf.threshold;
    const pricingInfor = conf.caseConf.pricing_info;
    const homePage = new SFHome(page, conf.suiteConf.domain);
    const personalizeSFPage = new Personalize(page, conf.suiteConf.domain);
    const groupName = conf.caseConf.group_name;
    const customOptionName = conf.caseConf.custom_option_name;
    const clipartDelete = conf.caseConf.clipart_delete;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    const clipartFolderAdd = conf.caseConf.clipart_folder_add;
    const groupInfo = conf.caseConf.group_info;
    const campaignInfo = conf.caseConf.campaign_info;

    await test.step("Pre condition: Tạo campaign", async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.deleteAllClipartFolderOrGroup("folder");
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart groups");
      await clipartPage.deleteAllClipartFolderOrGroup("group");
      await clipartPage.addListClipart(clipartFolderInfo);
      await clipartPage.addListGroupClipart(groupInfo);
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart groups");
      await clipartPage.navigateToMenu("Catalog");
      const campaignId = await clipartPage.launchCamp(campaignInfo);
      const isAvailable = await clipartPage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
      expect(await clipartPage.isDBPageDisplay("Campaigns")).toBeTruthy();
    });

    await test.step(
      "- Đi đến màn Library > Clipart: /admin/pod/clipart\n" +
        "- Click tab : Clipart groups\n" +
        "- Search và chọn Group 02\n" +
        "- Open group detail\n" +
        "- Click icon delete Folder 05\n" +
        "- Click button Save changes",
      async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.clickElementWithLabel("p", "Clipart groups");
        await clipartPage.openClipartGroupDetail(groupName);
        await clipartPage.deleteFolderInGroupDetail(clipartDelete);
        await clipartPage.clickOnBtnWithLabel("Save changes", 1);
        await clipartPage.waitForElementVisibleThenInvisible(clipartPage.xpathLoadForm);
        await clipartPage.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          selector: clipartPage.xpathClipartDetail,
          snapshotName: picture.group_detail_delete_folder,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step(
      "- Đi đến màn All campaigns: /admin/pod/campaigns\n" +
        "- Search và chọn campaign:Campaign Group 20\n" +
        '- click button "Edit personalization"\n' +
        "- Click icon open CO - Picture choice",
      async () => {
        await clipartPage.navigateToSubMenu("Campaigns", "All campaigns");
        await clipartPage.openCustomOptionDetailInEditor(pricingInfor.title, customOptionName);
        await dashboard.waitForSelector(clipartPage.xpathCustomOptionPCDetail);
        await clipartPage.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          selector: clipartPage.xpathCustomOptionPCDetail,
          snapshotName: picture.picture_co_clipart_delete,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        await clipartPage.clickOnBtnWithLabel("Cancel");
        await clipartPage.clickOnBtnWithLabel("Leave page");
      },
    );

    await test.step("View campaign ngoài SF", async () => {
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(pricingInfor.title);
      await expect(dashboard.locator(clipartPage.getXpathWithLabel(clipartDelete, 1))).toBeHidden();
    });

    await test.step(
      "- Đi đến màn Library > Clipart: /admin/pod/clipart\n" +
        "- Click tab : Clipart groups\n" +
        "- Search và chọn Group 02\n" +
        "- Open group detail\n" +
        '- Click button "Add new cliparts folder"\n' +
        "- Nhập thông tin cliparts folder\n" +
        "- Click button Save changes",
      async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.clickElementWithLabel("p", "Clipart groups");
        await clipartPage.openClipartGroupDetail(groupName);
        await clipartPage.clickOnBtnWithLabel("Add new clipart folder");
        await clipartPage.addNewClipartFolder(clipartFolderAdd[0], 2);
        await clipartPage.clickOnBtnWithLabel("Save changes", 3);
        await clipartPage.clickOnBtnWithLabel("Save changes");
        await clipartPage.waitForElementVisibleThenInvisible(clipartPage.xpathLoadForm);
        await expect(
          dashboard.locator(clipartPage.getXpathWithLabel(clipartFolderAdd[0].folder_name, 1)),
        ).toBeVisible();
      },
    );

    await test.step(
      "- Đi đến màn All campaigns: /admin/pod/campaigns\n" +
        "- Search và chọn campaign:Campaign Group 20\n" +
        '- click button "Edit personalization"\n' +
        "- Click icon open CO - Picture choice",
      async () => {
        await clipartPage.navigateToSubMenu("Campaigns", "All campaigns");
        await clipartPage.searchWithKeyword(pricingInfor.title);
        await clipartPage.openCampaignDetail(pricingInfor.title);
        await clipartPage.clickOnBtnWithLabel("Edit campaign setting");
        await clipartPage.waitForElementVisibleThenInvisible(`(${clipartPage.xpathIconLoading})[1]`);
        await clipartPage.clickBtnExpand();
        await dashboard.click(clipartPage.xpathCustomOptionName(customOptionName));
        await dashboard.waitForSelector(clipartPage.xpathCustomOptionPCDetail);
        await clipartPage.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          selector: clipartPage.xpathCustomOptionPCDetail,
          snapshotName: picture.picture_co_clipart_addmore,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("View campaign ngoài SF", async () => {
      await homePage.gotoHomePage();
      await homePage.searchThenViewProduct(pricingInfor.title);
      expect(
        await personalizeSFPage.verifySelectOption(
          personalizeSFPage.getXpathOptionCOPictureChoiceByName(customOptionName),
          clipartFolderAdd[0].folder_name,
        ),
      ).toEqual(true);
    });
  });

  test("[Group detail page] Check khi Sort clipart folders in 1 group @SB_PRB_LB_CA_12", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const threshold = conf.suiteConf.threshold;
    const groupName = conf.caseConf.group_name;
    const sortClipartFolder = conf.caseConf.sort_clipart_folder;
    const campaignName = conf.caseConf.campaign_name;
    const customOptionName = conf.caseConf.custom_option_name;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    const groupInfo = conf.caseConf.group_info;
    const campaignInfo = conf.caseConf.campaign_info;

    await test.step("Pre condition: Tạo campaign", async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.deleteAllClipartFolderOrGroup("folder");
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart groups");
      await clipartPage.deleteAllClipartFolderOrGroup("group");
      await clipartPage.addListClipart(clipartFolderInfo);
      await clipartPage.addListGroupClipart(groupInfo);
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart groups");
      await clipartPage.navigateToMenu("Catalog");
      const campaignId = await clipartPage.launchCamp(campaignInfo);
      const isAvailable = await clipartPage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
      expect(await clipartPage.isDBPageDisplay("Campaigns")).toBeTruthy();
    });

    const listSort = sortClipartFolder.type.split(",").map(item => item.trim());
    for (let i = 0; i < listSort.length; i++) {
      await test.step("Đi đến màn Library > Clipart > Mở màn hình group detail > Sort folder > Click chọn:  sort type >  Click button Save", async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.clickElementWithLabel("p", "Clipart groups");
        await clipartPage.openClipartGroupDetail(groupName);
        await clipartPage.sortClipartFolder(listSort[i]);
        await clipartPage.clickOnBtnWithLabel("Save changes");
        await clipartPage.waitForElementVisibleThenInvisible(clipartPage.xpathLoadForm);
        await clipartPage.removeLiveChat();
        await snapshotFixture.verify({
          page: dashboard,
          selector: clipartPage.xpathClipartDetail,
          snapshotName: `${sortClipartFolder.picture_group_detail}[${i}].png`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });

      await test.step(
        "- Đi đến màn All campaigns: /admin/pod/campaigns\n" +
          "- Search và chọn campaign:  Campaign Group 02\n" +
          '- click button "Edit personalization"\n' +
          "- Click icon open CO - Picture choice",
        async () => {
          await clipartPage.navigateToSubMenu("Campaigns", "All campaigns");
          await clipartPage.openCustomOptionDetailInEditor(campaignName, customOptionName);
          await dashboard.waitForSelector(clipartPage.xpathCustomOptionPCDetail, { timeout: 5000 });
          await clipartPage.removeLiveChat();
          await snapshotFixture.verify({
            page: dashboard,
            selector: clipartPage.xpathCustomOptionPCDetail,
            snapshotName: `${sortClipartFolder.picture_co}[${i}].png`,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
          await clipartPage.clickOnBtnWithLabel("Cancel");
          await clipartPage.clickOnBtnWithLabel("Leave page");
        },
      );
    }
  });

  test("[List group] Check khi delete group tại màn List group @SB_PRB_LB_CA_13", async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
    const picture = conf.caseConf.picture_co;
    const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    const maxDiffPixels = conf.suiteConf.max_diff_pixels;
    const threshold = conf.suiteConf.threshold;
    const action = conf.caseConf.action_clipart;
    const campaignName = conf.caseConf.campaign_name;
    const customOptionName = conf.caseConf.custom_option_name;
    const groupClipartInfo = conf.caseConf.group_info;
    const clipartFolderInfo = conf.caseConf.clipart_folder_info;
    const campaignInfo = conf.caseConf.campaign_info;

    await test.step("Pre condition: Tạo campaign", async () => {
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.deleteAllClipartFolderOrGroup("folder");
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart groups");
      await clipartPage.deleteAllClipartFolderOrGroup("group");
      await clipartPage.removeLiveChat();
      await clipartPage.addListClipart(clipartFolderInfo);
      await clipartPage.addListGroupClipart(groupClipartInfo);
      await clipartPage.navigateToSubMenu("Library", "Clipart");
      await clipartPage.clickElementWithLabel("p", "Clipart groups");
      await clipartPage.navigateToMenu("Catalog");
      const campaignId = await clipartPage.launchCamp(campaignInfo);
      const isAvailable = await clipartPage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
      expect(isAvailable).toBeTruthy();
      expect(await clipartPage.isDBPageDisplay("Campaigns")).toBeTruthy();
    });

    await test.step(
      "- Đi đến màn Library > Clipart: /admin/pod/clipart\n" +
        "- Click tab : Clipart groups\n" +
        "- Search và chọn Group 02\n" +
        "- Click butotn Action\n" +
        "- Click Delete Cliparts groups\n" +
        "- Click button Delete",
      async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.clickElementWithLabel("p", "Clipart groups");
        await clipartPage.listActionWithClipart(action);
        await expect(
          dashboard.locator(
            `//a[contains(@class,'product-name')]//span[normalize-space()='${action[0].clipart_name}']`,
          ),
        ).toBeHidden();
      },
    );

    await test.step(
      "- Đi đến màn All campaigns: /admin/pod/campaigns\n" +
        "- Search và chọn campaign: Campaign Group 02\n" +
        '- click button "Edit personalization"\n' +
        "- Click icon open CO - Picture choice",
      async () => {
        await clipartPage.navigateToSubMenu("Campaigns", "All campaigns");
        await clipartPage.openCustomOptionDetailInEditor(campaignName, customOptionName);
        await dashboard.waitForTimeout(1000);
        await snapshotFixture.verify({
          page: dashboard,
          selector: clipartPage.xpathCustomOptionPCDetail,
          snapshotName: picture,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step(
      "- Đi đến màn All campaigns: /admin/pod/campaigns\n" +
        "- Search và chọn campaign: Campaign Group 02\n" +
        '- click button "Edit personalization"\n' +
        "- Click icon open CO - Picture choice",
      async () => {
        await dashboard.click(clipartPage.xpathIconBack);
        await clipartPage.checkMsgAfterCreated({
          errMsg: conf.caseConf.message,
        });
      },
    );
  });

  const confAddClipart = loadData(__dirname, "ADD_CLIPART_FOLDER_EDITOR");
  for (let i = 0; i < confAddClipart.caseConf.data.length; i++) {
    const caseData = confAddClipart.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_id}`, async ({ dashboard, conf, page, snapshotFixture }) => {
      const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
      const productInfo = caseData.product_info;
      const layers = caseData.layers;
      const customOptions = caseData.custom_options;
      const pricingInfo = caseData.pricing_info;
      const homePage = new SFHome(page, conf.suiteConf.domain);
      const campaignSFPage = new Campaign(page, conf.suiteConf.domain);
      const picture = caseData.picture;
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const threshold = conf.suiteConf.threshold;
      const groupClipartInfo = caseData.group_clipart_info;
      const personalizeSFPage = new Personalize(page, conf.suiteConf.domain);
      const clipartInfo = customOptions[0].clipart_info;
      const clipartEditInfo = caseData.clipart_edit_info;
      const imageClipart = caseData.image_clipart;
      const imageClipartAdd = caseData.image_clipart_add;
      const customOptionInfo = caseData.custom_option_info;
      const clipartName = caseData.clipart_name;

      await test.step("Pre condition: Delete clipart folder", async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.deleteAllClipartFolderOrGroup("folder");
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.clickElementWithLabel("p", "Clipart groups");
        await clipartPage.deleteAllClipartFolderOrGroup("group");
        await clipartPage.addListGroupClipart(groupClipartInfo);
        if (caseData.case_id == "SB_PRB_LB_CA_16") {
          await clipartPage.navigateToSubMenu("Library", "Clipart");
          await clipartPage.addListClipart(clipartEditInfo);
        }
        await clipartPage.navigateToMenu("Campaigns");
        await clipartPage.deleteAllCampaign(conf.suiteConf.password);
      });

      await test.step(
        "Đi tới màn Catalog > Add base product > Add layer và custom option cho base product" +
          '- Tại block Cliparts , chọn "Show all clipart in a clipart Folder"\n' +
          '- Click vào text field "Select a Clipart folder"\n' +
          '- Click button "Add a clipart folder"\n' +
          "- Nhập thông tin clipart folder\n" +
          "- Click button Save changes",
        async () => {
          await clipartPage.navigateToMenu("Catalog");
          await clipartPage.addBaseProducts(productInfo);
          await clipartPage.clickOnBtnWithLabel("Create new campaign");
          await clipartPage.addNewLayers(layers);
          await clipartPage.removeLiveChat();
          await clipartPage.clickBtnExpand();
          await clipartPage.clickOnBtnWithLabel("Customize layer");
          await clipartPage.addCustomOptions(customOptions);
          await dashboard.click(clipartPage.xpathCustomOptionName("Picture choice"));
          if (caseData.case_id == "SB_PRB_LB_CA_16") {
            await clipartPage.clickElementWithLabel("a", "Edit clipart folder");
            await dashboard.waitForSelector(clipartPage.xpathPopupEditClipart);
            await clipartPage.editClipartImageName(imageClipart, imageClipartAdd);
            await clipartPage.clickOnBtnWithLabel("Save changes", 2);
          }
          await dashboard.waitForSelector(clipartPage.xpathCustomOptionPCDetail);
          await clipartPage.removeLiveChat();
          await snapshotFixture.verify({
            page: dashboard,
            selector: clipartPage.xpathCustomOptionPCDetail,
            snapshotName: picture.picture_co_clipart_addmore,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        },
      );

      await test.step("Click btn Continue > Input title > Click btn Launch", async () => {
        await clipartPage.clickOnBtnWithLabel("Continue");
        await clipartPage.inputPricingInfo(pricingInfo);
        const campaignId = clipartPage.getCampaignIdInPricingPage();
        await clipartPage.clickOnBtnWithLabel("Launch");
        const isAvailable = await clipartPage.checkCampaignStatus(campaignId, ["available"], 30 * 60 * 1000);
        expect(isAvailable).toBeTruthy();
      });

      await test.step("View campaign ngoài SF > Verify hiển thị clipart", async () => {
        await homePage.gotoHomePage();
        await homePage.searchThenViewProduct(pricingInfo.title);
        await page.reload();
        await page.waitForSelector(clipartPage.xpathFolderPictureChoice);
        await campaignSFPage.waitForCLipartImagesLoaded();
        switch (caseData.case_id) {
          case "SB_PRB_LB_CA_16":
            await campaignSFPage.inputCustomAllOptionSF(customOptionInfo);
            await campaignSFPage.waitForCLipartImagesLoaded();
            await snapshotFixture.verify({
              page: page,
              selector: clipartPage.xpathGroupPictureChoice,
              snapshotName: picture.co_picture_choice_sf,
              snapshotOptions: {
                maxDiffPixelRatio: maxDiffPixelRatio,
                threshold: threshold,
                maxDiffPixels: maxDiffPixels,
              },
            });
            break;
          case "SB_PRB_LB_CA_15":
            for (let i = 0; i < clipartInfo.images.length - 1; i++) {
              expect(
                await personalizeSFPage.verifySelectOption(
                  personalizeSFPage.getXpathOptionCOPictureChoiceByName(customOptions[0].label),
                  clipartInfo.images[i],
                ),
              ).toEqual(true);
            }
            break;
          default:
            await snapshotFixture.verify({
              page: page,
              selector: clipartPage.xpathFolderPictureChoice,
              snapshotName: picture.co_picture_choice_sf,
              snapshotOptions: {
                maxDiffPixelRatio: maxDiffPixelRatio,
                threshold: threshold,
                maxDiffPixels: maxDiffPixels,
              },
            });
        }
      });

      await test.step("- Đi đến màn Library > Clipart: /admin/pod/clipart\n" + "- Click folder detail", async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.openClipartFolderDetail(clipartName);
        const countImageClipart = await clipartPage.page.locator("//div[@class='campaign-thumb-box']//img").count();
        for (let i = 1; i <= countImageClipart; i++) {
          await waitForImageLoaded(clipartPage.page, `(//div[@class='campaign-thumb-box']//img)[${i}]`);
        }
        await snapshotFixture.verify({
          page: dashboard,
          selector: clipartPage.xpathClipartDetail,
          snapshotName: picture.picture_folder_detail,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      });
    });
  }

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_id}`, async ({
      dashboard,
      conf,
      page,
      authRequest,
      snapshotFixture,
    }) => {
      const clipartPage = new ClipartPage(dashboard, conf.suiteConf.domain);
      const clipartFolderInfo = caseData.clipart_folder_info;
      const productInfo = caseData.product_info;
      const layers = caseData.layers;
      const customOptions = caseData.custom_options;
      const pricingInfo = caseData.pricing_info;
      const homePage = new SFHome(page, conf.suiteConf.domain);
      const namePC = caseData.name_picture_choice;
      const imageClipart = caseData.image_clipart;
      const imageClipartAdd = caseData.image_clipart_add;
      const picture = caseData.picture;
      const maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
      const maxDiffPixels = conf.suiteConf.max_diff_pixels;
      const threshold = conf.suiteConf.threshold;
      const customOptionInfo = caseData.custom_option_info;
      const productSF = new SFProduct(page, conf.suiteConf.domain);

      await test.step("Vào Catalog > Add base product > Add layer > Add custom option > Input title > Click btn Launch", async () => {
        await clipartPage.navigateToSubMenu("Library", "Clipart");
        await clipartPage.addListClipart(clipartFolderInfo);
        await clipartPage.navigateToMenu("Catalog");
        await clipartPage.addBaseProducts(productInfo);
        await clipartPage.clickOnBtnWithLabel("Create new campaign");
        await clipartPage.addNewLayers(layers);
        await clipartPage.clickBtnExpand();
        await clipartPage.clickOnBtnWithLabel("Customize layer");
        await clipartPage.addCustomOptions(customOptions);
        await clipartPage.clickOnBtnWithLabel("Continue");
        await clipartPage.inputPricingInfo(pricingInfo);
        await clipartPage.clickOnBtnWithLabel("Launch");
        const status = await clipartPage.getStatusOfFirstCampaign(authRequest, conf.suiteConf.domain);
        expect(status).toBeTruthy();
      });

      await test.step("View campaign ngoài SF > Verify clipart folder", async () => {
        await homePage.gotoHomePage();
        await homePage.searchThenViewProduct(pricingInfo.title);
        if (caseData.case_id === "SB_PRB_LB_CA_16" || caseData.case_id === "SB_PRB_LB_CA_17") {
          await productSF.inputCustomAllOptionSF(customOptionInfo);
          await productSF.clickOnBtnPreviewSF();
          await snapshotFixture.verify({
            page: page,
            selector: clipartPage.xpathPopupLivePreview(1),
            snapshotName: picture.picture_preview,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        } else {
          const listNamePC = namePC.split(",").map(item => item.trim());
          for (let i = 0; i < listNamePC.length; i++) {
            await expect(page.locator(clipartPage.xpathDroplistPictureChoice(listNamePC[i]))).toBeVisible();
          }
        }
      });

      if (caseData.case_id === "SB_PRB_LB_CA_15" || caseData.case_id === "SB_PRB_LB_CA_16") {
        await test.step(
          "- Đi đến màn All campaigns: /admin/pod/campaigns\n" +
            "- Search và chọn campaign: Campaign Group 02\n" +
            '- click button "Campaign folder PC image name"\n' +
            "- Click icon open = CO - Picture choice\n" +
            '- click "Edit clipart folder"\n' +
            '- Edit ảnh "Image 1" thành "Image 3 "\n' +
            "- Click button Save Changes \n" +
            "- Click button Save",
          async () => {
            await clipartPage.navigateToMenu("Campaigns");
            await clipartPage.openCustomOptionDetailInEditor(pricingInfo.title, customOptions[0].label);
            await clipartPage.clickElementWithLabel("a", "Edit clipart folder");
            await dashboard.waitForTimeout(2000);
            await clipartPage.editClipartImageName(imageClipart, imageClipartAdd);
            await clipartPage.clickOnBtnWithLabel("Save changes", 2);
            await clipartPage.clickOnBtnWithLabel("Cancel");
            await clipartPage.clickOnBtnWithLabel("Leave page");
          },
        );

        await test.step("View campaign ngoài SF", async () => {
          await homePage.gotoHomePage();
          await homePage.searchThenViewProduct(pricingInfo.title);
          if (caseData.case_id === "SB_PRB_LB_CA_16") {
            await productSF.inputCustomOptionSF(customOptionInfo[0]);
            await expect(page.locator(clipartPage.xpathValuePictureChoice(imageClipartAdd))).toBeVisible();
          } else {
            await expect(page.locator(clipartPage.xpathDroplistPictureChoice(imageClipartAdd))).toBeVisible();
          }
        });

        await test.step(
          "- Đi đến màn Library > Clipart: /admin/pod/clipart\n" +
            "- Search và chọn folder: Folder Thumbnail names\n" +
            "- Open folder detail",
          async () => {
            await clipartPage.navigateToSubMenu("Library", "Clipart");
            await clipartPage.openClipartFolderDetail(clipartFolderInfo[0].folder_name);
            await dashboard.waitForTimeout(2000);
            await snapshotFixture.verify({
              page: dashboard,
              selector: clipartPage.xpathClipartDetail,
              snapshotName: picture.picture_folder_detail,
              snapshotOptions: {
                maxDiffPixelRatio: maxDiffPixelRatio,
                threshold: threshold,
                maxDiffPixels: maxDiffPixels,
              },
            });
          },
        );
      }
    });
  }
});
