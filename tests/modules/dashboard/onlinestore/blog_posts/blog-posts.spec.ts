import { expect, test } from "@fixtures/website_builder";
import { snapshotDir, verifyRedirectUrl } from "@utils/theme";
import { BlogPage } from "@pages/dashboard/blog";
import { waitTimeout } from "@core/utils/api";

let maxDiffPixelRatio: number;
let threshold: number;
let maxDiffPixels: number;
let blogPage: BlogPage;
let snapshotName;
let themeCloneId;
let xpathSectionSF;
let xpathPostItemSF;

test.describe("Create blog and blog post", async () => {
  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
    maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    threshold = conf.suiteConf.threshold;
    maxDiffPixels = conf.suiteConf.max_diff_pixels;
    blogPage = new BlogPage(dashboard, conf.suiteConf.domain);
  });

  test("Kiểm tra giao diện tạo mới blog @SB_OLS_BL_BLG_ECOM_03", async ({ conf, snapshotFixture }) => {
    const blogInfo = conf.caseConf.blog_info;
    snapshotName = conf.caseConf.snapshot_name;

    await test.step("Pre condition: Delete blog", async () => {
      await blogPage.goToBlogPage();
      await blogPage.deleteBlogOrBlogPost(blogInfo.title);
    });

    await test.step(
      "- Đi đến màn Online store > Chọn Blog Posts\n" + "- Click button Manage blogs\n" + "- Click button Add blog",
      async () => {
        await blogPage.goToBlogPage();
        await blogPage.clickOnBtnWithLabel("Add blog");
        await blogPage.page.waitForSelector(blogPage.xpathPageBlogDetail);
        await blogPage.removeLiveChat();
        await snapshotFixture.verify({
          page: blogPage.page,
          selector: blogPage.xpathPageBlogDetail,
          snapshotName: `${process.env.ENV}-${snapshotName.add_new_blog_page}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step(
      "Kiểm tra giao diện sau khi Save thành công blog\n" +
        "   - Fill data vào các fileds\n" +
        "   - Click button save",
      async () => {
        await blogPage.createBlog(blogInfo);
        await blogPage.removeLiveChat();
        await blogPage.removeTextURLOnBlog();
        await snapshotFixture.verify({
          page: blogPage.page,
          selector: blogPage.xpathPageBlogDetail,
          snapshotName: `${process.env.ENV}-${snapshotName.blog_detail}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );
  });

  test("Kiểm tra giao diện tạo mới blog post trong dashboard @SB_OLS_BL_BLG_ECOM_01", async ({
    conf,
    snapshotFixture,
  }) => {
    snapshotName = conf.caseConf.snapshot_name;
    const blogPostInfo = conf.caseConf.blog_post_info;
    const blogInfo = conf.caseConf.blog_info;

    await test.step("Pre condition: Tạo mới blog", async () => {
      await blogPage.goToBlogPage();
      await blogPage.deleteBlogOrBlogPost(blogInfo[0].title);
      await blogPage.createListBlog(blogInfo);
      await blogPage.goToBlogPostPage();
      await blogPage.deleteBlogOrBlogPost(blogPostInfo.title);
    });

    await test.step(
      "Kiểm tra giao diện khởi tạo của màn hình Add blog post\n" +
        "   - Click button Add blog post\n" +
        "   - Kiểm tra giao diện Add blog post",
      async () => {
        await blogPage.goToBlogPostPage();
        if (await blogPage.checkButtonVisible("Create blog post")) {
          await blogPage.clickOnBtnWithLabel("Create blog post");
        } else {
          await blogPage.clickOnBtnWithLabel("Add blog post");
        }
        await blogPage.page.waitForSelector(blogPage.xpathPageBlogPostDetail);
        await blogPage.removeLiveChat();
        await waitTimeout(3000);
        await snapshotFixture.verify({
          page: blogPage.page,
          selector: blogPage.xpathPageBlogPostDetail,
          snapshotName: `${process.env.ENV}-${snapshotName.add_new_blog_post_page}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step(
      "Kiểm tra giao diện sau khi Save thành công blog post\n" +
        "   - Fill data vào các fileds\n" +
        "   - Click button save",
      async () => {
        await blogPage.goToBlogPostPage();
        await blogPage.createBlogPost(blogPostInfo);
        await blogPage.removeLiveChat();
        await blogPage.removeTextTimeVisibleOnBlog();
        await blogPage.removeTextURLOnBlog();
        await blogPage.page.waitForSelector(blogPage.xpathPageBlogPostDetail);
        await snapshotFixture.verify({
          page: blogPage.page,
          selector: blogPage.xpathPageBlogPostDetail,
          snapshotName: `${process.env.ENV}-${snapshotName.blog_post_detail}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );
  });
});

let blogPostInfo;
let blogInfo;

test.describe("Verify blog and blog post WB", async () => {
  test.beforeEach(async ({ conf, dashboard, theme }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
    maxDiffPixelRatio = conf.suiteConf.max_diff_pixel_ratio;
    threshold = conf.suiteConf.threshold;
    maxDiffPixels = conf.suiteConf.max_diff_pixels;
    blogPage = new BlogPage(dashboard, conf.suiteConf.domain);
    blogPostInfo = conf.caseConf.blog_post_info;
    blogInfo = conf.caseConf.blog_info;

    //Pre condition: Duplicate theme criadora
    const themeList = await theme.list();
    for (let i = 0; i < themeList.length; i++) {
      if (!themeList[i].active && themeList[i].id !== conf.suiteConf.theme_id.criadora) {
        await theme.delete(themeList[i].id);
      }
    }
    const response = await theme.duplicate(conf.suiteConf.theme_id.criadora);
    themeCloneId = response.id;
    await theme.publish(themeCloneId);

    //Pre condition: Delete and create blog and blog post
    if (blogInfo) {
      await blogPage.deleteListBlogOrBlogPost(blogInfo, "blog");
      await blogPage.createListBlog(blogInfo);
    }
    if (blogPostInfo) {
      await blogPage.deleteListBlogOrBlogPost(blogPostInfo, "blog post");
      await blogPage.createListBlogPost(blogPostInfo);
    }
  });

  test("@SB_OLS_BL_BLG_ECOM_10 - [Post list]Check hiển thị block Post list tại màn Blog", async ({
    conf,
    snapshotFixture,
    context,
  }) => {
    snapshotName = conf.caseConf.snapshot_name;

    test.slow();
    await test.step(" Đi đến Page Blog -> Check hiển thị block Post list", async () => {
      await blogPage.openWebBuilder({
        type: "site",
        id: themeCloneId,
        page: "blogs",
      });
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathPreviewLoadingScreen);
      await blogPage.searchBlogOnWebBuilder(conf.caseConf.blog_title);
      await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 4, block: 2 }), blogPage.iframe);
      await blogPage.switchToTab("Content");
      await blogPage.switchToggle("published", false);
      await blogPage.switchToggle("author", false);
      await blogPage.clickSaveButton();
      await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 2 }), blogPage.iframe);
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        iframe: blogPage.iframe,
        selector: blogPage.xpathSectionPostList,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_detail_wb}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step(
      "- Click vào block Post list\n" + "- Check hiển thị setting Content  của block Post list",
      async () => {
        await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 4, block: 2 }), blogPage.iframe);
        await blogPage.switchToTab("Design");
        await snapshotFixture.verify({
          page: blogPage.page,
          selector: blogPage.xpathSidebarSetting,
          snapshotName: `${process.env.ENV}-${snapshotName.slidebar_design_setting}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step(
      "- Click vào block Post list\n" + "- Check hiển thị setting Content  của block Post list",
      async () => {
        await blogPage.switchToTab("Content");
        await snapshotFixture.verify({
          page: blogPage.page,
          selector: blogPage.xpathSidebarSetting,
          snapshotName: `${process.env.ENV}-${snapshotName.slidebar_content_setting}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("- View blog hiển thị ngoài SF", async () => {
      const storefront = await verifyRedirectUrl({
        page: blogPage.page,
        selector: blogPage.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      const blogSF = new BlogPage(storefront, conf.suiteConf.domain);
      await storefront.locator(blogPage.xpathLoadSpinner).waitFor({ state: "detached" });
      await blogSF.waitResponseWithUrl("/assets/theme.css", 30000);
      await snapshotFixture.verify({
        page: storefront,
        selector: blogPage.xpathSectionPostList,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_detail_sf}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("@SB_OLS_BL_BLG_ECOM_11 - [Post list] Kiểm tra hiển thị post list khi Blog không có post nào", async ({
    conf,
    snapshotFixture,
    context,
  }) => {
    snapshotName = conf.caseConf.snapshot_name;

    await test.step(
      "- Đi đến Page Blog > Click block Post list\n" +
        "- Tại thanh search Preview > chọn Blog 1 post\n" +
        "- Check hiển thị post list",
      async () => {
        await blogPage.openWebBuilder({
          type: "site",
          id: themeCloneId,
          page: "blogs",
        });
        await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathPreviewLoadingScreen);
        await blogPage.searchBlogOnWebBuilder(blogInfo[0].title);
        await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 2 }), blogPage.iframe);
        await snapshotFixture.verifyWithAutoRetry({
          page: blogPage.page,
          iframe: blogPage.iframe,
          selector: blogPage.xpathSectionPostList,
          snapshotName: `${process.env.ENV}-${snapshotName.blog_post_detail_wb}`,
          combineOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("- View blog hiển thị ngoài SF", async () => {
      const storefront = await verifyRedirectUrl({
        page: blogPage.page,
        selector: blogPage.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      await storefront.locator(blogPage.xpathLoadSpinner).waitFor({ state: "detached" });
      expect(await storefront.locator(blogPage.xpathPostCart).count()).toBe(0);
    });
  });

  test("@SB_OLS_BL_BLG_ECOM_22 - [Post list] Kiểm tra khi setting Context của block Post List", async ({
    conf,
    snapshotFixture,
    context,
  }) => {
    snapshotName = conf.caseConf.snapshot_name;
    const contentSetting = conf.caseConf.content_setting;

    await test.step(
      "   - Đi đến Page Blog \n" +
        "   - Click vào block Post list\n" +
        "- Click tab Context, setting value:\n" +
        "+  Featured image = off\n" +
        "+ Pusblished time = off\n" +
        "+ Experpt = off\n" +
        "+ Author name = off\n" +
        "- Click button Save\n" +
        "- Check hiển thị tại màn Preview",
      async () => {
        await blogPage.openWebBuilder({
          type: "site",
          id: themeCloneId,
          page: "blogs",
        });
        await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathPreviewLoadingScreen);
        await blogPage.searchBlogOnWebBuilder(blogInfo[0].title);
        await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 4, block: 2 }), blogPage.iframe);
        await blogPage.changePostListContent(contentSetting);
        await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 2 }), blogPage.iframe);
        await snapshotFixture.verifyWithIframe({
          page: blogPage.page,
          iframe: blogPage.iframe,
          selector: blogPage.xpathSectionPostList,
          snapshotName: `${process.env.ENV}-${snapshotName.blog_post_detail_wb}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("- View blog hiển thị ngoài SF", async () => {
      const storefront = await verifyRedirectUrl({
        page: blogPage.page,
        selector: blogPage.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      await storefront.locator(blogPage.xpathLoadSpinner).waitFor({ state: "detached" });
      await snapshotFixture.verify({
        page: storefront,
        selector: blogPage.xpathSectionPostList,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_detail_sf}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("Tại Wb, click icon switch preview mobile", async () => {
      await blogPage.switchMobileBtn.click();
      await snapshotFixture.verifyWithIframe({
        page: blogPage.page,
        iframe: blogPage.iframe,
        selector: blogPage.xpathSectionPostList,
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_detail_wb_mobile}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });
  });

  test("@SB_OLS_BL_BLG_ECOM_24 - [Post list]Kiểm tra hiển thị khi setting Design cho block Post list", async ({
    conf,
    snapshotFixture,
    context,
  }) => {
    snapshotName = conf.caseConf.snapshot_name;
    const layouts = conf.caseConf.layouts;
    const contentSetting = conf.caseConf.content_setting;
    for (let i = 0; i < layouts.length; i++) {
      await test.step(
        "Đi đến màn Blog\n" +
          "Click vào block post list\n" +
          "Tại tab Design, setting value" +
          "- Click button Save\n" +
          "- Check hiển thị tại màn Preview",
        async () => {
          if (i === 0) {
            await blogPage.openWebBuilder({
              type: "site",
              id: themeCloneId,
              page: "blogs",
            });
            await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathPreviewLoadingScreen);
            await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 4, block: 2 }), blogPage.iframe);
            await blogPage.page.frameLocator("#preview").getByText(blogPostInfo[0].title).click();
            await blogPage.changePostListContent(contentSetting);
          }
          await blogPage.changePostListLayout(layouts[i]);
          await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 2 }), blogPage.iframe);
          await snapshotFixture.verifyWithIframe({
            page: blogPage.page,
            iframe: blogPage.iframe,
            selector: blogPage.xpathSectionPostList,
            snapshotName: `${process.env.ENV}-${i + 1}-${snapshotName.blog_post_detail_wb}`,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        },
      );

      await test.step("- View blog hiển thị ngoài SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: blogPage.page,
          selector: blogPage.xpathButtonPreview,
          redirectUrl: "?theme_preview_id",
          context,
        });

        await storefront.locator(blogPage.xpathLoadSpinner).waitFor({ state: "detached" });
        const blogSF = new BlogPage(storefront, conf.suiteConf.domain);
        await blogSF.waitResponseWithUrl("/assets/theme.css", 30000);
        await snapshotFixture.verify({
          page: storefront,
          selector: blogPage.xpathSectionPostList,
          snapshotName: `${process.env.ENV}-${i + 1}-${snapshotName.blog_post_detail_sf}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        await storefront.close();
      });
    }
  });

  test("@SB_OLS_BL_BLG_ECOM_12 - [Post list] Kiểm tra trường hợp resize frame của Post list khi được kéo vào trong website builder", async ({
    conf,
    snapshotFixture,
    context,
  }) => {
    snapshotName = conf.caseConf.snapshot_name;
    const contentSetting = conf.caseConf.content_setting;

    for (let i = 0; i < blogInfo.length; i++) {
      await test.step(
        "- Đi đến Page Blog > Click block Post list\n" +
          "- Tại thanh search Preview > chọn Blog\n" +
          "- click button Save\n" +
          "- Check hiển thị Post list tại màn preview",
        async () => {
          if (i === 0) {
            await blogPage.openWebBuilder({
              type: "site",
              id: themeCloneId,
              page: "blogs",
            });
          }
          await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathPreviewLoadingScreen);
          await blogPage.searchBlogOnWebBuilder(blogInfo[i].title);
          await blogPage.page.frameLocator("#preview").getByText(blogInfo[i].blog_post).click();
          if (i === 0) {
            await blogPage.changePostListContent(contentSetting);
          }
          await blogPage.frameLocator
            .locator(`(//*[contains(@class,'image sb-lazy loading pointer')])[1]`)
            .waitFor({ state: "detached" });
          await snapshotFixture.verifyWithIframe({
            page: blogPage.page,
            iframe: blogPage.iframe,
            selector: blogPage.xpathSectionPostList,
            snapshotName: `${i + 1}-${snapshotName.blog_post_detail_wb}`,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        },
      );

      await test.step("- View blog hiển thị ngoài SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: blogPage.page,
          selector: blogPage.xpathButtonPreview,
          redirectUrl: "?theme_preview_id",
          context,
        });

        const blogSF = new BlogPage(storefront, conf.suiteConf.domain);
        await storefront.locator(blogPage.xpathLoadSpinner).waitFor({ state: "detached" });
        await blogSF.waitResponseWithUrl("/assets/theme.css", 30000);
        await snapshotFixture.verify({
          page: storefront,
          selector: blogPage.xpathSectionPostList,
          snapshotName: `${i + 1}-${snapshotName.blog_post_detail_sf}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        await storefront.close();
      });
    }
  });

  test("@SB_OLS_BL_BLG_ECOM_23 - [Post list] Kiểm tra khi kéo thả block Post list vào page khác Blog page", async ({
    conf,
    snapshotFixture,
    context,
  }) => {
    snapshotName = conf.caseConf.snapshot_name;
    const layouts = conf.caseConf.layouts;
    const contentSetting = conf.caseConf.content_setting;
    const sectionSetting = conf.caseConf.add_blank_section;
    let storefront;
    let blogSF;

    /**Note : Case 23 cần blog có nhiều blog post nhưng để k mất time tạo nên chỉ tạo 1 lần,
     * khi nào cần tạo lại blog, blog post thì chỉ cần
     * sửa param blog > blog_info, blog_post > blog_post_info trong file json thôi
     */

    await test.step(
      "- Tại màn Home > Add thêm section\n" +
        "- Kéo thả block Post list vào section\n" +
        "- Click button Save\n" +
        "- Check hiển thị tại màn preview",
      async () => {
        await blogPage.openWebBuilder({
          type: "site",
          id: themeCloneId,
        });
        await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathPreviewLoadingScreen);
        await blogPage.dragAndDropInWebBuilder(sectionSetting);
        await blogPage.insertSectionBlock({
          parentPosition: conf.caseConf.add_block.parent_position,
          category: conf.caseConf.add_block.basics_cate,
          template: conf.caseConf.add_block.template,
          templateIndex: 1,
        });
        await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 3, block: 1 }), blogPage.iframe);
        await snapshotFixture.verifyWithIframe({
          page: blogPage.page,
          iframe: blogPage.iframe,
          selector: blogPage.getXpathPostList(),
          snapshotName: `${process.env.ENV}-${snapshotName.blog_post_default_wb}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step(
      "- Tại tab content của section > Click chọn Data source\n" +
        "- Click button Save\n" +
        "- Check hiển thị tại màn preview",
      async () => {
        await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 3 }), blogPage.iframe);
        await blogPage.selectDropDownDataSource("variable", {
          category: "Blog",
          source: conf.caseConf.title_blog,
        });
        await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 3, block: 1 }), blogPage.iframe);
        await blogPage.changePostListContent(contentSetting);
        await blogPage.clickSaveButton();
        await snapshotFixture.verifyWithIframe({
          page: blogPage.page,
          iframe: blogPage.iframe,
          selector: blogPage.getXpathPostList(),
          snapshotName: `${process.env.ENV}-${snapshotName.blog_post_detail_wb}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("click tab Design, check hiển thị", async () => {
      await blogPage.switchToTab("Design");
      await snapshotFixture.verify({
        page: blogPage.page,
        selector: blogPage.xpathSidebarSetting,
        snapshotName: `${process.env.ENV}-${snapshotName.slidebar_design_setting}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("click tab Content, check hiển thị", async () => {
      await blogPage.switchToTab("Content");
      await snapshotFixture.verify({
        page: blogPage.page,
        selector: blogPage.xpathSidebarSetting,
        snapshotName: `${process.env.ENV}-${snapshotName.slidebar_content_setting}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
    });

    await test.step("View màn Home page ngoài SF", async () => {
      storefront = await verifyRedirectUrl({
        page: blogPage.page,
        selector: blogPage.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      blogSF = new BlogPage(storefront, conf.suiteConf.domain);
      await storefront.locator(blogPage.xpathLoadSpinner).waitFor({ state: "detached" });
      await blogSF.waitResponseWithUrl("/assets/theme.css", 30000);
      await snapshotFixture.verify({
        page: storefront,
        selector: blogPage.getXpathPostList(),
        snapshotName: `${process.env.ENV}-${snapshotName.blog_post_detail_sf}`,
        snapshotOptions: {
          maxDiffPixelRatio: maxDiffPixelRatio,
          threshold: threshold,
          maxDiffPixels: maxDiffPixels,
        },
      });
      await storefront.close();
    });

    for (let i = 0; i < layouts.length; i++) {
      await test.step(
        "- Tại màn WB, setting Design value:\n" +
          "+ Layout = Grid,\n" +
          "+ Content Position = Vertical \n" +
          "+ Posts to show: 2\n" +
          "- Click button Save\n" +
          "- Check hiển thị tại màn preview",
        async () => {
          await blogPage.changePostListContent(contentSetting);
          await blogPage.changePostListLayout(layouts[i]);
          await blogPage.clickSaveButton();
          await snapshotFixture.verifyWithIframe({
            page: blogPage.page,
            iframe: blogPage.iframe,
            selector: blogPage.getXpathPostList(),
            snapshotName: `${i + 1}-${snapshotName.blog_post_detail_edit_wb}`,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        },
      );

      await test.step("View màn Home page ngoài SF", async () => {
        storefront = await verifyRedirectUrl({
          page: blogPage.page,
          selector: blogPage.xpathButtonPreview,
          redirectUrl: "?theme_preview_id",
          context,
        });

        blogSF = new BlogPage(storefront, conf.suiteConf.domain);
        await storefront.locator(blogPage.xpathLoadSpinner).waitFor({ state: "detached" });
        await blogSF.waitResponseWithUrl("/assets/theme.css", 30000);
        await snapshotFixture.verify({
          page: storefront,
          selector: blogPage.getXpathPostList(),
          snapshotName: `${i + 1}-${snapshotName.blog_post_detail_edit_sf}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        await storefront.close();
      });
    }
  });

  test("@SB_OLS_BL_BLG_ECOM_32 - [Post list] Kiểm tra khi kéo thả block Post list vào page khác Blog page có Lyout = Carousel", async ({
    conf,
    snapshotFixture,
    context,
  }) => {
    snapshotName = conf.caseConf.snapshot_name;
    const layouts = conf.caseConf.layouts;
    const contentSetting = conf.caseConf.content_setting;
    const sectionSetting = conf.caseConf.add_blank_section;

    /**Note : Case 32 cần blog có nhiều blog post nhưng để k mất time tạo nên chỉ tạo 1 lần,
     * khi nào cần tạo lại blog, blog post thì chỉ cần
     * sửa param blog > blog_info, blog_post > blog_post_info trong file json thôi
     */

    for (let i = 0; i < layouts.length; i++) {
      await test.step(
        "- Tại màn Home > Add thêm section\n" +
          "- Kéo thả block Post list vào section\n" +
          "- Tại tab content của section > Click chọn Data source = Blog 1\n" +
          "- Tại tab setting Design value của block:\n" +
          "- Click button Save\n" +
          "- Check hiển thị tại màn preview",
        async () => {
          await blogPage.openWebBuilder({
            type: "site",
            id: themeCloneId,
          });
          await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathPreviewLoadingScreen);
          await blogPage.dragAndDropInWebBuilder(sectionSetting);
          await blogPage.insertSectionBlock({
            parentPosition: conf.caseConf.add_block.parent_position,
            category: conf.caseConf.add_block.basics_cate,
            template: conf.caseConf.add_block.template,
          });
          await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 3 }), blogPage.iframe);
          await blogPage.selectDropDownDataSource("variable", {
            category: "Blog",
            source: conf.caseConf.title_blog,
          });
          await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 3, block: 1 }), blogPage.iframe);
          await blogPage.changePostListContent(contentSetting);
          await blogPage.changePostListLayout(layouts[i]);
          await snapshotFixture.verifyWithIframe({
            page: blogPage.page,
            iframe: blogPage.iframe,
            selector: blogPage.getXpathPostList(),
            snapshotName: `${process.env.ENV}-${i + 1}-${snapshotName.blog_post_detail_wb}`,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        },
      );

      if (i === 0) {
        await test.step("Click tab Design, kiểm tra hiển thị", async () => {
          await blogPage.page.getByText("Design", { exact: true }).click();
          await snapshotFixture.verify({
            page: blogPage.page,
            selector: blogPage.xpathSidebarSetting,
            snapshotName: `${process.env.ENV}-${snapshotName.slidebar_design_setting}`,
            snapshotOptions: {
              maxDiffPixelRatio: maxDiffPixelRatio,
              threshold: threshold,
              maxDiffPixels: maxDiffPixels,
            },
          });
        });
      }

      await test.step("View màn Home page ngoài SF", async () => {
        const storefront = await verifyRedirectUrl({
          page: blogPage.page,
          selector: blogPage.xpathButtonPreview,
          redirectUrl: "?theme_preview_id",
          context,
        });

        const blogSF = new BlogPage(storefront, conf.suiteConf.domain);
        await storefront.locator(blogPage.xpathLoadSpinner).waitFor({ state: "detached" });
        await blogSF.waitResponseWithUrl("/assets/theme.css", 30000);
        await snapshotFixture.verify({
          page: storefront,
          selector: blogPage.getXpathPostList(),
          snapshotName: `${process.env.ENV}-${i + 1}-${snapshotName.blog_post_detail_sf}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
        await storefront.close();
      });
    }
  });

  test("@SB_OLS_BL_BLG_ECOM_28 - [Post list] Kiểm tra khi setting Page load = Infinite load", async ({
    conf,
    context,
  }) => {
    let storefront;
    let blogSF: BlogPage;
    snapshotName = conf.caseConf.snapshot_name;
    const contentSetting = conf.caseConf.content_setting;
    const layoutInfiniteLoad = conf.caseConf.layout_infinite_load;
    const postShow = conf.caseConf.post_to_show;

    await test.step(
      "- Đi đến Page Blog \n" +
        "- Check hiển thị block Post list\n" +
        "- Setting value:\n" +
        "+ Page load = Infinite load\n" +
        "- Click button Save\n" +
        "- Check hiển thị tại màn preview",
      async () => {
        await blogPage.openWebBuilder({
          type: "site",
          id: themeCloneId,
          page: "blogs",
        });
        await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathPreviewLoadingScreen);
        await blogPage.searchBlogOnWebBuilder(conf.caseConf.title_blog);
        await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 4, block: 2 }), blogPage.iframe);
        await blogPage.changePostListContent(contentSetting);
        await blogPage.changePostListLayout(layoutInfiniteLoad);
        expect(await blogPage.countPostInList(4, 2)).toEqual(postShow);
      },
    );

    await test.step("Trong web builder, scroll xuống dưới 90%", async () => {
      await blogPage.scrollIntoViewInWebBuilder(
        blogPage.frameLocator.locator(
          blogPage.getSelectorByIndex({
            section: 5,
          }),
        ),
        false,
      );
      await blogPage.frameLocator.locator(`//div[contains(@class,'loading-spinner')]`).waitFor({ state: "detached" });
      await blogPage.frameLocator.locator(blogPage.getXpathPostCartItem(postShow + 1)).waitFor({ state: "visible" });
      expect(await blogPage.countPostInList(4, 2)).toBeGreaterThanOrEqual(postShow * 2);
    });

    await test.step("View Blog ngoài SF", async () => {
      storefront = await verifyRedirectUrl({
        page: blogPage.page,
        selector: blogPage.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      blogSF = new BlogPage(storefront, conf.suiteConf.domain);
      xpathSectionSF = blogSF.getSelectorByIndex({ section: 4 });
      xpathPostItemSF = blogSF.getXpathItemBlogPostBySection(xpathSectionSF);

      await storefront.locator(`//div[contains(@class,'loading-spinner')]`).waitFor({ state: "detached" });
      const postItem = await storefront.locator(xpathPostItemSF).count();
      expect(postItem).toEqual(postShow);
    });

    await test.step("Ngoài SF, scroll xuống dưới quá 80%", async () => {
      await storefront
        .locator(
          blogSF.getSelectorByIndex({
            section: 5,
          }),
        )
        .evaluate(ele => {
          ele.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      await storefront.locator(`//div[contains(@class,'loading-spinner')]`).waitFor({ state: "detached" });
      await storefront.locator(blogSF.getXpathPostCartItem(postShow + 1)).waitFor({ state: "visible" });
      const postItem = await storefront.locator(xpathPostItemSF).count();
      expect(postItem).toBeGreaterThanOrEqual(postShow * 2);
    });
  });

  test("@SB_OLS_BL_BLG_ECOM_34 - [Post list] Kiểm tra khi setting Page load = Paging", async ({ conf, context }) => {
    let storefront;
    let blogSF: BlogPage;
    snapshotName = conf.caseConf.snapshot_name;
    const contentSetting = conf.caseConf.content_setting;
    const layoutPaging = conf.caseConf.layout_paging;
    const postShow = conf.caseConf.post_to_show;

    await test.step(
      "- Đi đến Page Blog \n" +
        "- Check hiển thị block Post list\n" +
        "- Setting value:\n" +
        "+ Layout = Grid\n" +
        "+ Page load = Paging\n" +
        "+ Posts per load = 12\n" +
        "- Click button Save\n" +
        "- Check hiển thị tại màn preview",
      async () => {
        await blogPage.openWebBuilder({
          type: "site",
          id: themeCloneId,
          page: "blogs",
        });
        await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathPreviewLoadingScreen);
        await blogPage.searchBlogOnWebBuilder(conf.caseConf.title_blog);
        await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 4, block: 2 }), blogPage.iframe);
        await blogPage.changePostListContent(contentSetting);
        await blogPage.changePostListLayout(layoutPaging);
        await blogPage.clickSaveButton();
        expect(await blogPage.countPostInList(4, 2)).toEqual(postShow);
        await expect(blogPage.frameLocator.locator(blogPage.xpathPaging)).toBeVisible();
      },
    );

    await test.step("Trong Wb, click phân trang", async () => {
      await blogPage.clickOnElement(blogPage.getXpathPagingByIndex(2), blogPage.iframe);
      await blogPage.frameLocator.locator(`//div[contains(@class,'loading-spinner')]`).waitFor({
        state: "detached",
      });
      await blogPage.clickSaveButton();
      expect(await blogPage.countPostInList(4, 2)).toEqual(postShow);
    });

    await test.step("View Blog ngoài SF", async () => {
      storefront = await verifyRedirectUrl({
        page: blogPage.page,
        selector: blogPage.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      blogSF = new BlogPage(storefront, conf.suiteConf.domain);
      xpathSectionSF = blogSF.getSelectorByIndex({ section: 4 });
      xpathPostItemSF = blogSF.getXpathItemBlogPostBySection(xpathSectionSF);

      await storefront.locator(`//div[contains(@class,'loading-spinner')]`).waitFor({ state: "detached" });
      await blogSF.waitResponseWithUrl("/assets/theme.css", 30000);
      const postItem = await storefront.locator(xpathPostItemSF).count();
      expect(postItem).toEqual(postShow);
      await expect(await blogSF.page.locator(blogSF.xpathPaging)).toBeVisible();
    });

    await test.step("ngoài SF, click vào phân trang", async () => {
      await blogSF.clickOnElement(blogSF.getXpathPagingByIndex(2));
      await storefront.locator(`//div[contains(@class,'loading-spinner')]`).waitFor({ state: "detached" });
      await storefront.locator(blogSF.getXpathPostCartItem(postShow)).waitFor({ state: "visible" });
      const postItem = await storefront.locator(xpathPostItemSF).count();
      expect(postItem).toEqual(postShow);
    });
  });

  test("@SB_OLS_BL_BLG_ECOM_27 - [Post List]Kiểm tra hiển thị Post list khi setting Layout = Grid", async ({
    conf,
    snapshotFixture,
    context,
  }) => {
    snapshotName = conf.caseConf.snapshot_name;
    const contentSetting = conf.caseConf.content_setting;
    const layoutPaging = conf.caseConf.layout_paging;
    let storefront;
    let blogSF: BlogPage;

    await test.step(
      "- Đi đến Page Blog > Click block Post list\n" +
        "- Setting value:\n" +
        "+ Layout = Grid\n" +
        "+ Spacing = 24\n" +
        "+ Content Position : Vertical\n" +
        "- Click button Save\n" +
        "- Check hiển thị Post list tại màn preview",
      async () => {
        await blogPage.openWebBuilder({
          type: "site",
          id: themeCloneId,
          page: "blogs",
        });
        await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathPreviewLoadingScreen);
        await blogPage.clickOnElement(blogPage.getSelectorByIndex({ section: 4, block: 2 }), blogPage.iframe);
        await blogPage.changePostListContent(contentSetting);
        await blogPage.changePostListLayout(layoutPaging);
        await snapshotFixture.verifyWithIframe({
          page: blogPage.page,
          iframe: blogPage.iframe,
          selector: blogPage.xpathSectionPostList,
          snapshotName: `${process.env.ENV}-${snapshotName.blog_post_detail_wb}`,
          snapshotOptions: {
            maxDiffPixelRatio: maxDiffPixelRatio,
            threshold: threshold,
            maxDiffPixels: maxDiffPixels,
          },
        });
      },
    );

    await test.step("View Blog ngoài SF", async () => {
      storefront = await verifyRedirectUrl({
        page: blogPage.page,
        selector: blogPage.xpathButtonPreview,
        redirectUrl: "?theme_preview_id",
        context,
      });

      blogSF = new BlogPage(storefront, conf.suiteConf.domain);
      xpathSectionSF = blogSF.getSelectorByIndex({ section: 4 });
      xpathPostItemSF = blogSF.getXpathItemBlogPostBySection(xpathSectionSF);

      await storefront.locator(`//div[contains(@class,'loading-spinner')]`).waitFor({ state: "detached" });
      const postItem = await storefront.locator(xpathPostItemSF).count();
      expect(postItem).toEqual(layoutPaging.post_per_page);
      await expect(blogSF.page.locator(blogSF.xpathPaging)).toBeVisible();
    });
  });
});
