import { expect, test } from "@core/fixtures";
import { snapshotDir } from "@core/utils/theme";
import { BlogPage } from "@pages/dashboard/blog";
import { Page } from "@playwright/test";

test.describe("Verify blog", async () => {
  let blogPage: BlogPage, preview: Page, blogInfo, blogPostInfo;
  test.beforeEach(async ({ conf, dashboard }) => {
    blogPage = new BlogPage(dashboard, conf.suiteConf.domain);
    blogInfo = conf.caseConf.blog_info;
    blogPostInfo = conf.caseConf.blog_post_info;

    await test.step(`Delete blog`, async () => {
      await blogPage.goToBlogPage();
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.checkboxAll).click();
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.checkboxBlog(conf.suiteConf.blog_default)).first().click();
      await blogPage.page.waitForTimeout(1000);
      const btnActionVisible = await blogPage.genLoc(blogPage.xpathActionButton).isVisible();
      if (btnActionVisible) {
        await blogPage.clickOnBtnWithLabel("Action");
        await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.btnDeleteBlog).click();
        await blogPage.clickButtonOnPopUpWithLabel("Delete");
        await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);
      }
    });

    await test.step(`Pre-condition: Delete blog post`, async () => {
      await blogPage.goToBlogPostPage();
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.checkboxAll).click();
      await blogPage
        .genLoc(blogPage.xpathBlog.blog.blogList.checkboxBlog(conf.suiteConf.blog_post_default))
        .first()
        .click();
      await blogPage.page.waitForTimeout(1000);

      const btnActionVisible = await blogPage.genLoc(blogPage.xpathActionButton).isVisible();
      if (btnActionVisible) {
        await blogPage.clickOnBtnWithLabel("Action");
        await blogPage
          .genLoc(blogPage.xpathBlog.blogPost.blogPostList.moreAction("Delete selected blog posts"))
          .click();
        await blogPage.clickButtonOnPopUpWithLabel("Delete");
        await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);
      }
    });

    if (conf.caseConf.preconditon_add_blog) {
      await test.step(`Precondition: add blog`, async () => {
        await blogPage.createListBlog(blogInfo);
        await blogPage.genLoc(blogPage.xpathBlog.blog.blogDetail.btnBack).click();
        await blogPage.page.waitForSelector(blogPage.xpathBlog.blog.blogList.pageHeading);
      });
    }
  });

  test(`@SB_BL_DCB_01 CreateBlog_Check tạo thành công blog khi input data hợp lệ tại toàn bộ các field`, async ({
    conf,
    context,
  }) => {
    for (const blogInfo of conf.caseConf.blog_info) {
      await test.step(`Truy cập màn blog > Nhập đầy đủ thông tin hợp lệ vào toàn bộ các field > Click btn Save`, async () => {
        await blogPage.goToBlogPage();
        await blogPage.clickOnBtnWithLabel("Add blog");
        await blogPage.createBlog(blogInfo);
      });

      await test.step(`Check hiển thị ngoài DB`, async () => {
        await blogPage.genLoc(blogPage.xpathBlog.blog.blogDetail.btnBack).click();
        await blogPage.page.waitForSelector(blogPage.xpathBlog.blog.blogList.pageHeading);
        await expect(blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(blogInfo.title))).toBeVisible();
        await expect(
          blogPage.genLoc(blogPage.xpathBlog.blog.blogList.commentType(blogInfo.title, blogInfo.comment_type)),
        ).toBeVisible();
      });

      await test.step(`Check hiển thị ngoài SF`, async () => {
        await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(blogInfo.title)).hover();
        [preview] = await Promise.all([
          context.waitForEvent("page"),
          blogPage.genLoc(blogPage.xpathBlog.blog.blogList.iconPreviewBlog(blogInfo.title)).click(),
        ]);
        await preview.waitForLoadState("load");
        expect(preview.url()).toContain(`https://${conf.suiteConf.domain}/blogs/${blogInfo.handle}`);
        await expect(preview.locator(blogPage.xpathBlog.storefront.title(blogInfo.title))).toBeVisible();
        await preview.close();
      });
    }
  });
  test(`@SB_BL_01 EditBlog_Check update blog thành công`, async ({ conf, context }) => {
    const editBlog = conf.caseConf.edit_blog;

    await test.step(`Truy cập màn hình Edit blog`, async () => {
      await blogPage.searchBlogOrBlogPost(blogInfo[0].title);
      await blogPage.genLoc(`(${blogPage.xpathBlog.blog.blogList.blogTitle(blogInfo[0].title)})[1]`).click();
      await blogPage.page.waitForSelector(blogPage.xpathBlog.blog.blogDetail.btnBack);
      const titleBlog = await blogPage.genLoc(blogPage.xpathBlog.blog.blogDetail.fieldInput("Title")).inputValue();
      expect(titleBlog).toEqual(blogInfo[0].title);
    });

    await test.step(`Update thông tin bất kỳ trên màn hình`, async () => {
      await blogPage.editBlog(editBlog);
      const dataBlog = await blogPage.getInfoBlog(conf.caseConf.edit_blog.comment_type);
      expect(dataBlog).toEqual(
        expect.objectContaining({
          title: editBlog.title,
          comment_type_radio: true,
          page_title: editBlog.page_title,
          meta_description: editBlog.meta_description,
          handle: editBlog.handle,
        }),
      );
    });

    await test.step(`Click button Save trên DB`, async () => {
      await blogPage.clickOnBtnWithLabel("Save");
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathProductDetailLoading);
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathLoadingButton);
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);
      const dataBlogAfter = await blogPage.getInfoBlog(conf.caseConf.edit_blog.comment_type);
      expect(dataBlogAfter).toEqual(
        expect.objectContaining({
          title: editBlog.title,
          comment_type_radio: true,
          page_title: editBlog.page_title,
          meta_description: editBlog.meta_description,
          handle: editBlog.handle,
        }),
      );
    });

    await test.step(`Check hiển thị trên màn quản lý blog: Title, Comment status, Last edited,`, async () => {
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogDetail.btnBack).click();
      await blogPage.page.waitForSelector(blogPage.xpathBlog.blog.blogList.pageHeading);
      await expect(blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(editBlog.title))).toBeVisible();
      await expect(
        blogPage.genLoc(blogPage.xpathBlog.blog.blogList.commentType(editBlog.title, editBlog.comment_type)),
      ).toBeVisible();
      await expect(blogPage.genLoc(blogPage.xpathBlog.blog.blogList.lastEdit(editBlog.title))).toHaveText("Just now");
    });

    await test.step(`Check hiển thị ngoài SF`, async () => {
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(editBlog.title)).hover();
      [preview] = await Promise.all([
        context.waitForEvent("page"),
        blogPage.genLoc(blogPage.xpathBlog.blog.blogList.iconPreviewBlog(editBlog.title)).click(),
      ]);
      await preview.waitForLoadState("load");
      expect(preview.url()).toContain(`https://${conf.suiteConf.domain}/blogs/${editBlog.handle}`);
      await expect(preview.locator(blogPage.xpathBlog.storefront.title(editBlog.title))).toBeVisible();
      await preview.close();
    });
  });

  test(`@SB_BL_2 ManageBlog_Check xóa thành công blog bất kỳ`, async ({ conf, context }) => {
    await test.step(`Add blog post thuộc blog muốn xóa`, async () => {
      await blogPage.createListBlogPost(blogPostInfo);
      await blogPage.goToBlogPage();
    });

    await test.step(`Chọn blog bất kỳ > Chọn action delete`, async () => {
      blogPage.genLoc(blogPage.xpathBlog.blog.blogList.checkboxBlog(blogInfo[0].title)).click();
      await blogPage.clickOnBtnWithLabel("Action");
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.btnDeleteBlog).click();
      await expect(blogPage.genLoc(blogPage.xpathBlog.blog.popupDeleteBlog.title(1))).toBeVisible();
      await expect(blogPage.genLoc(blogPage.xpathBlog.blog.popupDeleteBlog.description)).toBeVisible();
      await expect(blogPage.genLoc(blogPage.xpathCancelButton)).toBeVisible();
      await expect(blogPage.genLoc(blogPage.xpathDeleteButton)).toBeVisible();
    });

    await test.step(`Chọn button [Cancel] trên popup`, async () => {
      await blogPage.clickButtonOnPopUpWithLabel("Cancel");
      await expect(blogPage.genLoc(blogPage.xpathBlog.blog.popupDeleteBlog.title(1))).toBeHidden();
    });

    await test.step(`Chọn action delete > Chọn button [Delete] trên popup`, async () => {
      await blogPage.clickOnBtnWithLabel("Action");
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.btnDeleteBlog).click();
      await blogPage.clickButtonOnPopUpWithLabel("Delete");
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);
      await expect(blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(blogInfo[0].title))).toBeHidden();

      await blogPage.goToBlogPostPage();
      await blogPage.searchBlogOrBlogPost(blogPostInfo[0].title);
      await expect(blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(blogPostInfo[0].title))).toBeHidden();
    });

    await test.step(`Check hiển thị blog đã xóa ngoài SF`, async () => {
      const storefront = await context.newPage();
      const viewBlog = new BlogPage(storefront, conf.suiteConf.domain);
      await viewBlog.goto(`https://${conf.suiteConf.domain}/blogs/${blogInfo[0].handle}`);
      await viewBlog.page.waitForLoadState("load");
      await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.pageNotFound);
      await expect(viewBlog.genLoc(blogPage.xpathBlog.storefront.title(blogInfo[0].title))).toBeHidden();

      await viewBlog.goto(`https://${conf.suiteConf.domain}/blogs/${blogPostInfo[0].handle}`);
      await viewBlog.page.waitForLoadState("load");
      await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.pageNotFound);
      await expect(viewBlog.genLoc(blogPage.xpathBlog.storefront.title(blogPostInfo[0].title))).toBeHidden();
    });
  });
});

test.describe("Verify blog post", async () => {
  let blogPage: BlogPage, preview: Page, blogPostInfo, blogInfo;
  test.beforeEach(async ({ conf, dashboard }, testInfo) => {
    blogPage = new BlogPage(dashboard, conf.suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    blogPostInfo = conf.caseConf.blog_post_info;
    blogInfo = conf.caseConf.blog_info;

    await test.step(`Delete blog`, async () => {
      await blogPage.goToBlogPage();
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.checkboxAll).click();
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.checkboxBlog(conf.suiteConf.blog_default)).first().click();
      await blogPage.page.waitForTimeout(1000);
      const btnActionVisible = await blogPage.genLoc(blogPage.xpathActionButton).isVisible();
      if (btnActionVisible) {
        await blogPage.clickOnBtnWithLabel("Action");
        await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.btnDeleteBlog).click();
        await blogPage.clickButtonOnPopUpWithLabel("Delete");
        await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);
      }
    });

    await test.step(`Pre-condition: Delete blog post`, async () => {
      await blogPage.goToBlogPostPage();
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.checkboxAll).click();
      await blogPage
        .genLoc(blogPage.xpathBlog.blog.blogList.checkboxBlog(conf.suiteConf.blog_post_default))
        .first()
        .click();
      await blogPage.page.waitForTimeout(1000);

      const btnActionVisible = await blogPage.genLoc(blogPage.xpathActionButton).isVisible();
      if (btnActionVisible) {
        await blogPage.clickOnBtnWithLabel("Action");
        await blogPage
          .genLoc(blogPage.xpathBlog.blogPost.blogPostList.moreAction("Delete selected blog posts"))
          .click();
        await blogPage.clickButtonOnPopUpWithLabel("Delete");
        await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);
      }
    });

    await test.step(`Pre-condition: add blog`, async () => {
      await blogPage.createListBlog(conf.caseConf.blog_info);
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogDetail.btnBack).click();
      await blogPage.page.waitForSelector(blogPage.xpathBlog.blog.blogList.pageHeading);
    });

    if (conf.caseConf.preconditon_add_blog_post) {
      await test.step(`Add blog post`, async () => {
        await blogPage.createListBlogPost(blogPostInfo);
      });
    }
    await blogPage.goToBlogPostPage();
  });

  test(`@SB_BL_4 CreateBlogPost_Check tạo blog post thành công`, async ({ conf, context, snapshotFixture }) => {
    test.slow();
    for (const blogPostInfo of conf.caseConf.blog_post_info) {
      await test.step(`Nhập data vào các trường > click btn Save`, async () => {
        await blogPage.createBlogPost(blogPostInfo);
        await expect(blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostDetail.title_bar)).toHaveText(
          blogPostInfo.title,
        );
      });

      await test.step(`Back về trang Blog Post List`, async () => {
        await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostDetail.btnBack).click();
        await blogPage.page.waitForSelector(blogPage.xpathBlog.blogPost.blogPostList.pageHeading);
        await expect(blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(blogPostInfo.title))).toBeVisible();
        await expect(
          blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.blog(blogPostInfo.title, blogPostInfo.blog)),
        ).toBeVisible();
        await expect(
          blogPage.genLoc(
            blogPage.xpathBlog.blogPost.blogPostList.visibility(blogPostInfo.title, blogPostInfo.visibility),
          ),
        ).toBeVisible();
        await expect(
          blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.author(blogPostInfo.title, conf.suiteConf.author)),
        ).toBeVisible();
      });

      await test.step(`Mở SF blog post mới tạo`, async () => {
        await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.blogPostTitle(blogPostInfo.title)).hover();
        [preview] = await Promise.all([
          context.waitForEvent("page"),
          blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.iconPreviewBlogPost(blogPostInfo.title)).click(),
        ]);
        const blogPageSF = new BlogPage(preview, conf.suiteConf.domain);
        await blogPageSF.page.waitForLoadState("load");
        expect(blogPageSF.page.url()).toContain(`https://${conf.suiteConf.domain}/blogs/${blogPostInfo.handle}`);

        if (blogPostInfo.visibility === "Visible") {
          await expect(blogPageSF.genLoc(blogPage.xpathBlog.storefront.title(blogPostInfo.title))).toBeVisible();
          const authorAndTimeInSF = await blogPageSF.getAuthorAndTimeBlogPostThemeInside();
          expect(authorAndTimeInSF).toContain(`By ${conf.suiteConf.author}`);
          if (blogPostInfo.content) {
            const contentSF = await blogPageSF.getContentBlogPostThemeInsite();
            expect(contentSF).toEqual(blogPostInfo.content);
          }
          if (blogPostInfo.blog) {
            await expect(blogPageSF.genLoc(blogPage.xpathBlog.storefront.blogInBreadcrumbBlogPost)).toHaveText(
              blogPostInfo.blog,
            );
          }
          if (blogPostInfo.tags) {
            for (const tag of blogPostInfo.tags) {
              await expect(blogPageSF.genLoc(blogPage.xpathBlog.storefront.tag(tag))).toBeVisible();
            }
          }
          if (blogPostInfo.featured_image) {
            await blogPageSF.page.waitForTimeout(5 * 1000); // đợi load image
            await blogPageSF.hideElementPathBlogPostSFInside(); // che 1 phần thông tin blog post dính với image
            await blogPageSF.page.waitForTimeout(2000);
            await snapshotFixture.verifyWithAutoRetry({
              page: preview,
              selector: blogPage.xpathBlog.storefront.imageBlogPost,
              snapshotName: `${process.env.ENV} SB_BL_4.png`,
            });
          }
        } else {
          await blogPageSF.page.waitForSelector(blogPage.xpathBlog.storefront.pageNotFound);
          await expect(blogPageSF.genLoc(blogPage.xpathBlog.storefront.title(blogPostInfo.title))).toBeHidden();
        }
        await blogPageSF.page.close();
      });
    }
  });

  test(`@SB_BL_7 UpdateBlogPost_Check update blog post thành công`, async ({ conf, context, snapshotFixture }) => {
    test.slow();
    let status = "Hidden";
    const editBlogPost = conf.caseConf.edit_blog_post_info;
    for (let i = 0; i < editBlogPost.length; i++) {
      await test.step(`Update data tại all field`, async () => {
        await blogPage.searchBlogOrBlogPost(blogPostInfo[i].title);
        await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(blogPostInfo[i].title)).click();
        await blogPage.page.waitForSelector(blogPage.xpathBlog.blogPost.blogPostDetail.btnBack);
        await blogPage.editBlogPost(editBlogPost[i]);
        const titleBlogPost = await blogPage
          .genLoc(blogPage.xpathBlog.blog.blogDetail.fieldInput("Title"))
          .inputValue();
        expect(titleBlogPost).toEqual(editBlogPost[i].title);
        const radioBtnVisble = await blogPage
          .genLoc(blogPage.xpathBlog.blogPost.blogPostDetail.radioBtnVisibility("Visible"))
          .isChecked();
        if (radioBtnVisble) {
          status = "Visible";
        }
      });

      await test.step(`Back về trang blog post list`, async () => {
        await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostDetail.btnBack).click();
        await blogPage.page.waitForSelector(blogPage.xpathBlog.blogPost.blogPostList.pageHeading);
        await expect(blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(editBlogPost[i].title))).toBeVisible();
        await expect(
          blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.blog(editBlogPost[i].title, editBlogPost[i].blog)),
        ).toBeVisible();
        await expect(
          blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.visibility(editBlogPost[i].title, status)),
        ).toBeVisible();
        await expect(
          blogPage.genLoc(
            blogPage.xpathBlog.blogPost.blogPostList.author(editBlogPost[i].title, editBlogPost[i].author),
          ),
        ).toBeVisible();
      });

      await test.step(`Mở SF blog post vừa edit`, async () => {
        await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.blogPostTitle(editBlogPost[i].title)).hover();
        [preview] = await Promise.all([
          context.waitForEvent("page"),
          blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.iconPreviewBlogPost(editBlogPost[i].title)).click(),
        ]);
        const blogPageSF = new BlogPage(preview, conf.suiteConf.domain);
        await blogPageSF.page.waitForLoadState("load");
        expect(blogPageSF.page.url()).toContain(`https://${conf.suiteConf.domain}/blogs/${editBlogPost[i].handle}`);

        if (status === "Visible") {
          await expect(blogPageSF.genLoc(blogPage.xpathBlog.storefront.title(editBlogPost[i].title))).toBeVisible();

          const authorAndTimeInSF = await blogPageSF.getAuthorAndTimeBlogPostThemeInside();
          expect(authorAndTimeInSF).toContain(`By ${editBlogPost[i].author}`);
          if (editBlogPost[i].content) {
            const contentSF = await blogPageSF.getContentBlogPostThemeInsite();
            expect(contentSF).toEqual(editBlogPost[i].content);
          }
          if (editBlogPost[i].blog) {
            await expect(blogPageSF.genLoc(blogPage.xpathBlog.storefront.blogInBreadcrumbBlogPost)).toHaveText(
              editBlogPost[i].blog,
            );
          }
          if (editBlogPost[i].tags) {
            for (const tag of editBlogPost[i].tags) {
              await expect(blogPageSF.genLoc(blogPage.xpathBlog.storefront.tag(tag))).toBeVisible();
            }
          }
          if (editBlogPost[i].featured_image) {
            await blogPageSF.page.waitForTimeout(5 * 1000); // đợi load image
            await blogPageSF.hideElementPathBlogPostSFInside(); // che 1 phần thông tin blog post dính với image
            await blogPageSF.page.waitForTimeout(2000);
            await snapshotFixture.verifyWithAutoRetry({
              page: preview,
              selector: blogPage.xpathBlog.storefront.imageBlogPost,
              snapshotName: `${process.env.ENV}-${editBlogPost[i].title}-SB_BL_7.png`,
            });
          }
        } else {
          await blogPageSF.page.waitForSelector(blogPage.xpathBlog.storefront.pageNotFound);
          await expect(blogPageSF.genLoc(blogPage.xpathBlog.storefront.title(editBlogPost[i].title))).toBeHidden();
        }
        await blogPageSF.page.close();
      });
    }
  });

  test(`@SB_BL_8 ManageBlogPost_Check xóa thành công blog post bất kỳ`, async ({ conf, context }) => {
    await test.step(`Chọn blog bất kỳ > Click Action > Click "Delete selected blog post`, async () => {
      blogPage.genLoc(blogPage.xpathBlog.blog.blogList.checkboxBlog(blogPostInfo[0].title)).click();
      await blogPage.clickOnBtnWithLabel("Action");
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.moreAction("Delete selected blog posts")).click();
      await expect(blogPage.genLoc(blogPage.xpathBlog.blogPost.popupDeleteBlogPost.title(1))).toBeVisible();
      await expect(blogPage.genLoc(blogPage.xpathBlog.blogPost.popupDeleteBlogPost.description)).toBeVisible();
      await expect(blogPage.genLoc(blogPage.xpathCancelButton)).toBeVisible();
      await expect(blogPage.genLoc(blogPage.xpathDeleteButton)).toBeVisible();
    });

    await test.step(`Chọn button [Cancel] trên popup`, async () => {
      await blogPage.clickButtonOnPopUpWithLabel("Cancel");
      await expect(blogPage.genLoc(blogPage.xpathBlog.blogPost.popupDeleteBlogPost.title(1))).toBeHidden();
    });

    await test.step(`Click Action > Click "Delete selected blog post > Chọn button [Delete] trên popup`, async () => {
      await blogPage.clickOnBtnWithLabel("Action");
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.moreAction("Delete selected blog posts")).click();
      await blogPage.clickButtonOnPopUpWithLabel("Delete");
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);
      await expect(
        blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.blogPostTitle(blogPostInfo[0].title)),
      ).toBeHidden();
      await expect(
        blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.blogPostTitle(blogPostInfo[1].title)),
      ).toBeVisible();

      await blogPage.goToBlogPage();
      await blogPage.searchBlogOrBlogPost(blogInfo[0].title);
      await expect(blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(blogInfo[0].title))).toBeVisible();
    });

    await test.step(`Check hiển thị blog, blog post đã xóa ngoài SF`, async () => {
      const storefront = await context.newPage();
      const viewBlog = new BlogPage(storefront, conf.suiteConf.domain);
      await viewBlog.goto(`https://${conf.suiteConf.domain}/blogs/${blogPostInfo[0].handle}`);
      await viewBlog.page.waitForLoadState("load");
      await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.pageNotFound);
      await expect(viewBlog.genLoc(blogPage.xpathBlog.storefront.title(blogPostInfo[0].title))).toBeHidden();

      await viewBlog.goto(`https://${conf.suiteConf.domain}/blogs/${blogInfo[0].handle}`);
      await viewBlog.page.waitForLoadState("load");
      await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.title(blogInfo[0].title));
      await expect(
        viewBlog.genLoc(blogPage.xpathBlog.storefront.blogPostInBlogPage(blogPostInfo[0].title)),
      ).toBeHidden();
      await expect(
        viewBlog.genLoc(blogPage.xpathBlog.storefront.blogPostInBlogPage(blogPostInfo[1].title)),
      ).toBeVisible();
    });
  });

  test(`@SB_BL_10 ManageBlogPost_Check kết quả khi fillter theo điều kiện bất kỳ`, async ({ conf }) => {
    const filterTag = conf.caseConf.filter_tag;
    const filterVisibility = conf.caseConf.filter_visibility;
    const filterBlog = conf.caseConf.filter_blog;
    const filterTitles = conf.caseConf.filter_title;
    const filterImages = conf.caseConf.filter_image;
    const filterAuthor = conf.caseConf.filter_author;

    await test.step(`Chọn fillter Tags`, async () => {
      await blogPage.clickOnBtnWithLabel("Filter");
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.filterType(filterTag.type)).click();
      await blogPage.filterBlogPost(filterTag.type, filterTag.type_input, filterTag.value);
      const listBlogPost = await blogPage.getListBlogPost();
      for (let i = 0; i < listBlogPost.length; i++) {
        expect(listBlogPost[i]).toEqual(filterTag.expected[i]);
      }
    });

    await test.step(`Chọn fillter Visibility`, async () => {
      await blogPage.clickOnBtnWithLabel("Filter");
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.clearFilter(filterTag.type)).click();
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.filterType(filterVisibility[0].type)).click();
      for (const visibility of filterVisibility) {
        await blogPage.filterBlogPost(visibility.type, visibility.type_input, visibility.value);
        const listBlogPost = await blogPage.getListBlogPost();
        for (let i = 0; i < listBlogPost.length; i++) {
          expect(listBlogPost[i]).toEqual(visibility.expected[i]);
        }
        await blogPage.clickOnBtnWithLabel("Filter");
      }
    });

    await test.step(`Chọn fillter Title`, async () => {
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.clearFilter(filterVisibility[0].type)).click();
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.filterType(filterTitles[0].type)).click();
      for (const filterTitle of filterTitles) {
        await blogPage.filterBlogPost(
          filterTitle.type,
          filterTitle.type_input,
          filterTitle.value,
          filterTitle.text_input,
        );
        const listBlogPost = await blogPage.getListBlogPost();
        for (let i = 0; i < listBlogPost.length; i++) {
          expect(listBlogPost[i]).toEqual(filterTitle.expected[i]);
        }
        await blogPage.clickOnBtnWithLabel("Filter");
      }
    });

    await test.step(`Chọn fillter Blog`, async () => {
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.clearFilter(filterTitles[0].type)).click();
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.filterType(filterBlog.type)).click();
      await blogPage.filterBlogPost(filterBlog.type, filterBlog.type_input, filterBlog.value);
      const listBlogPost = await blogPage.getListBlogPost();
      for (let i = 0; i < listBlogPost.length; i++) {
        expect(listBlogPost[i]).toEqual(filterBlog.expected[i]);
      }
    });

    await test.step(`Chọn fillter Image`, async () => {
      await blogPage.clickOnBtnWithLabel("Filter");
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.clearFilter(filterBlog.type)).click();
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.filterType(filterImages[0].type)).click();
      for (const image of filterImages) {
        await blogPage.filterBlogPost(image.type, image.type_input, image.value);
        const listBlogPost = await blogPage.getListBlogPost();
        for (let i = 0; i < listBlogPost.length; i++) {
          expect(listBlogPost[i]).toEqual(image.expected[i]);
        }
        await blogPage.clickOnBtnWithLabel("Filter");
      }
    });

    await test.step(`Chọn fillter Author`, async () => {
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.clearFilter(filterImages[0].type)).click();
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.filterType(filterAuthor.type)).click();
      await blogPage.filterBlogPost(filterAuthor.type, filterAuthor.type_input, filterAuthor.value);
      const listBlogPost = await blogPage.getListBlogPost();
      for (let i = 0; i < listBlogPost.length; i++) {
        expect(listBlogPost[i]).toEqual(filterAuthor.expected[i]);
      }
    });
  });

  test(`@SB_BL_11 ManageBlogPost_Check kết quả khi thực hiện action bất kỳ`, async ({ conf, context }) => {
    test.slow();
    let viewBlog: BlogPage;
    await test.step(`Chọn blog post > Chọn action publish`, async () => {
      blogPage.genLoc(blogPage.xpathBlog.blog.blogList.checkboxBlog(blogPostInfo[0].title)).click();
      await blogPage.clickOnBtnWithLabel("Action");
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.moreAction("Publish selected blog posts")).click();
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);

      const storefront = await context.newPage();
      viewBlog = new BlogPage(storefront, conf.suiteConf.domain);
      await viewBlog.goto(`https://${conf.suiteConf.domain}/blogs/${blogPostInfo[0].handle}`);
      await viewBlog.page.waitForLoadState("load");
      await expect(viewBlog.genLoc(blogPage.xpathBlog.storefront.title(blogPostInfo[0].title))).toBeVisible();
    });

    await test.step(`Chọn blog post > Chọn action unpublish`, async () => {
      blogPage.genLoc(blogPage.xpathBlog.blog.blogList.checkboxBlog(blogPostInfo[1].title)).click();
      await blogPage.clickOnBtnWithLabel("Action");
      await blogPage
        .genLoc(blogPage.xpathBlog.blogPost.blogPostList.moreAction("Unpublish selected blog posts"))
        .click();
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);

      await viewBlog.goto(`https://${conf.suiteConf.domain}/blogs/${blogPostInfo[1].handle}`);
      await viewBlog.page.waitForLoadState("load");
      await expect(viewBlog.genLoc(blogPage.xpathBlog.storefront.title(blogPostInfo[1].title))).toBeHidden();
    });

    await test.step(` Chọn blog post > Chọn action add tags`, async () => {
      blogPage.genLoc(blogPage.xpathBlog.blog.blogList.checkboxBlog(blogPostInfo[0].title)).click();
      await blogPage.clickOnBtnWithLabel("Action");
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.moreAction("Add tags")).click();
      await blogPage.page.waitForSelector(
        blogPage.xpathBlog.blogPost.blogPostList.tagInMoreAction(conf.caseConf.add_tags[0]),
      );
      for (const tag of conf.caseConf.add_tags) {
        await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.tagInMoreAction(tag)).click();
      }
      await blogPage.clickButtonOnPopUpWithLabel("Apply changes");
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);

      await blogPage.searchBlogOrBlogPost(blogPostInfo[0].title);
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(blogPostInfo[0].title)).click();
      await blogPage.page.waitForSelector(blogPage.xpathBlog.blogPost.blogPostDetail.btnBack);
      for (const tag of conf.caseConf.add_tags) {
        await expect(blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostDetail.tag(tag))).toBeVisible();
      }

      await viewBlog.goto(`https://${conf.suiteConf.domain}/blogs/${blogPostInfo[0].handle}`);
      await viewBlog.page.waitForLoadState("load");
      await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.title(blogPostInfo[0].title));
      for (const tag of conf.caseConf.add_tags) {
        await expect(viewBlog.genLoc(blogPage.xpathBlog.storefront.tag(tag))).toBeVisible();
      }
    });

    await test.step(`Chọn blog post > Chọn action remove tags`, async () => {
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostDetail.btnBack).click();
      await blogPage.page.waitForSelector(blogPage.xpathBlog.blogPost.blogPostList.pageHeading);

      blogPage.genLoc(blogPage.xpathBlog.blog.blogList.checkboxBlog(blogPostInfo[0].title)).click();
      await blogPage.clickOnBtnWithLabel("Action");
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.moreAction("Remove tags")).click();
      await blogPage.page.waitForSelector(
        blogPage.xpathBlog.blogPost.blogPostList.tagInMoreAction(conf.caseConf.remove_tags[0]),
      );
      for (const tag of conf.caseConf.remove_tags) {
        await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.tagInMoreAction(tag)).click();
      }
      await blogPage.clickButtonOnPopUpWithLabel("Apply changes");
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);

      await blogPage.searchBlogOrBlogPost(blogPostInfo[0].title);
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(blogPostInfo[0].title)).click();
      await blogPage.page.waitForSelector(blogPage.xpathBlog.blogPost.blogPostDetail.btnBack);
      for (const tag of conf.caseConf.remove_tags) {
        await expect(blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostDetail.tag(tag))).toBeHidden();
      }

      await viewBlog.page.reload();
      await viewBlog.page.waitForLoadState("load");
      await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.title(blogPostInfo[0].title));
      for (const tag of conf.caseConf.remove_tags) {
        await expect(viewBlog.genLoc(blogPage.xpathBlog.storefront.tag(tag))).toBeHidden();
      }
    });
  });

  test(`@SB_BL_12 ManageCommentBlog_Check xóa thành công comment bất kỳ`, async ({ conf, context }) => {
    test.slow();
    let viewBlog: BlogPage;
    const comments = conf.caseConf.comments;
    const emails = [];

    await test.step(`Pre-condition: Add comment`, async () => {
      for (const comment of comments) {
        const storefront = await context.newPage();
        viewBlog = new BlogPage(storefront, conf.suiteConf.domain);
        await viewBlog.goto(`https://${conf.suiteConf.domain}/blogs/${comment.handle_blog_post}`);
        await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.title(comment.blog_post));
        const email = await viewBlog.writeCommentBlogPost(comment);
        emails.push(email);
        await viewBlog.page.close();
      }
    });

    for (let i = 0; i < 2; i++) {
      await test.step(`Chọn comment và click action delete comment `, async () => {
        await blogPage.goToManageComments();
        await blogPage.page.waitForSelector(
          blogPage.xpathBlog.manageComment.rowComment(emails[i], comments[i].comment, comments[i].blog_post),
        );
        await blogPage.page.waitForTimeout(1000);
        await blogPage
          .genLoc(
            blogPage.xpathBlog.manageComment.checkboxComment(emails[i], comments[i].comment, comments[i].blog_post),
          )
          .click();
        await blogPage.clickOnBtnWithLabel("Action");
        await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.moreAction("Delete comments")).click();
        await blogPage.clickButtonOnPopUpWithLabel("Delete");
        await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);
        await expect(
          blogPage.genLoc(
            blogPage.xpathBlog.manageComment.rowComment(emails[i], comments[i].comment, comments[i].blog_post),
          ),
        ).toBeHidden();

        // verify trong blog post detail
        await blogPage.goToBlogPostPage();
        await blogPage.searchBlogOrBlogPost(comments[i].blog_post);
        await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(comments[i].blog_post)).click();
        await blogPage.page.waitForSelector(blogPage.xpathBlog.blogPost.blogPostDetail.btnBack);
        await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostDetail.blockComment).scrollIntoViewIfNeeded();
        expect(
          await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostDetail.textNumberComment).innerText(),
        ).toContain(conf.caseConf.expected.show_number_comment_db);
        await expect(
          blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostDetail.emailWriteComment(emails[i])),
        ).toBeHidden();
      });

      if (comments[i].comment_status === "approved") {
        await test.step(`Mở blog post có chứa comment ngoài SF`, async () => {
          const storefront = await context.newPage();
          viewBlog = new BlogPage(storefront, conf.suiteConf.domain);
          await viewBlog.goto(`https://${conf.suiteConf.domain}/blogs/${comments[i].handle_blog_post}`);
          await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.title(comments[i].blog_post));
          await viewBlog.genLoc(blogPage.xpathBlog.storefront.blockComment).scrollIntoViewIfNeeded();
          const commentInfo = await viewBlog.getListCommentInSF();

          for (let i = 0; i < commentInfo.length; i++) {
            expect(commentInfo).toEqual(
              expect.objectContaining({
                username: conf.caseConf.expected.comment_info[i].username,
                comment: conf.caseConf.expected.comment_info[i].comment,
              }),
            );
          }
        });

        await test.step(`Mở blog page > Check hiển thị số lượng comment tại blog post`, async () => {
          await viewBlog.genLoc(blogPage.xpathBlog.storefront.blogInBreadcrumbBlogPost).click();
          await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.blogPostInBlogPage(comments[i].blog_post));
          await expect(
            viewBlog.genLoc(blogPage.xpathBlog.storefront.numberCommentInBlogPage(comments[i].blog_post)),
          ).toHaveText(conf.caseConf.expected.number_comment_sf);
        });
      }
    }
  });

  test(`@SB_BL_14 ManageCommentBlog_Check kết quả update staus khi thực hiện action bất kỳ`, async ({
    conf,
    context,
  }) => {
    test.slow();
    const emails = ["dpro1696953643@beeketing.net", "dpro1653643@beeketing.net"];
    let viewBlog: BlogPage;
    const comments = conf.caseConf.comments;
    await test.step(`Pre-condition: Add comment`, async () => {
      for (const comment of conf.caseConf.comments) {
        const storefront = await context.newPage();
        viewBlog = new BlogPage(storefront, conf.suiteConf.domain);
        await viewBlog.goto(`https://${conf.suiteConf.domain}/blogs/${comment.handle_blog_post}`);
        await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.title(comment.blog_post));
        const email = await viewBlog.writeCommentBlogPost(comment);
        emails.push(email);
        await viewBlog.page.close();
      }
    });

    await test.step(` Chọn comment bất kỳ > click Action > click Mask as spam`, async () => {
      await blogPage.goToManageComments();
      await blogPage.page.waitForSelector(
        blogPage.xpathBlog.manageComment.rowComment(emails[0], comments[0].comment, comments[0].blog_post),
      );
      await blogPage.page.waitForTimeout(1000);
      await blogPage
        .genLoc(blogPage.xpathBlog.manageComment.checkboxComment(emails[0], comments[0].comment, comments[0].blog_post))
        .click();
      await blogPage.clickOnBtnWithLabel("Action");
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.moreAction("Mark as spam")).click();
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);
      const status = await blogPage.getTextContent(
        blogPage.xpathBlog.manageComment.statusComment(emails[0], comments[0].comment, comments[0].blog_post),
      );
      expect(status).toEqual("Spam");

      // check status comment trong blog post detail
      await blogPage.goToBlogPostPage();
      await blogPage.searchBlogOrBlogPost(comments[0].blog_post);
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(comments[0].blog_post)).click();
      await blogPage.page.waitForSelector(blogPage.xpathBlog.blogPost.blogPostDetail.btnBack);
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostDetail.blockComment).scrollIntoViewIfNeeded();
      const statusInBlogPost = await blogPage.getTextContent(
        blogPage.xpathBlog.blogPost.blogPostDetail.statusComment(emails[0]),
      );
      expect(statusInBlogPost).toEqual("Spam");

      // check không hiện comment ở SF
      const storefront = await context.newPage();
      viewBlog = new BlogPage(storefront, conf.suiteConf.domain);
      await viewBlog.goto(`https://${conf.suiteConf.domain}/blogs/${comments[0].handle_blog_post}`);
      await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.title(comments[0].blog_post));
      await viewBlog.genLoc(blogPage.xpathBlog.storefront.blockComment).scrollIntoViewIfNeeded();
      await expect(viewBlog.genLoc(blogPage.xpathBlog.storefront.commentDetail(comments[0].comment))).toBeHidden();
    });

    await test.step(` Chọn comment bất kỳ > click Action > click Unmark as spam`, async () => {
      await blogPage.goToManageComments();
      await blogPage.page.waitForSelector(
        blogPage.xpathBlog.manageComment.rowComment(emails[0], comments[0].comment, comments[0].blog_post),
      );
      await blogPage.page.waitForTimeout(1000);
      await blogPage
        .genLoc(blogPage.xpathBlog.manageComment.checkboxComment(emails[0], comments[0].comment, comments[0].blog_post))
        .click();
      await blogPage.clickOnBtnWithLabel("Action");
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.moreAction("Unmark as spam")).click();
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);
      const status = await blogPage.getTextContent(
        blogPage.xpathBlog.manageComment.statusComment(emails[0], comments[0].comment, comments[0].blog_post),
      );
      expect(status).toEqual("Approved");

      // check status comment trong blog post detail
      await blogPage.goToBlogPostPage();
      await blogPage.searchBlogOrBlogPost(comments[0].blog_post);
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(comments[0].blog_post)).click();
      await blogPage.page.waitForSelector(blogPage.xpathBlog.blogPost.blogPostDetail.btnBack);
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostDetail.blockComment).scrollIntoViewIfNeeded();
      const statusInBlogPost = await blogPage.getTextContent(
        blogPage.xpathBlog.blogPost.blogPostDetail.statusComment(emails[0]),
      );
      expect(statusInBlogPost).toEqual("Approved");

      // check hiện comment ở SF
      await viewBlog.reload();
      await viewBlog.page.waitForLoadState("load");
      await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.title(comments[0].blog_post));
      await viewBlog.genLoc(blogPage.xpathBlog.storefront.blockComment).scrollIntoViewIfNeeded();
      await expect(viewBlog.genLoc(blogPage.xpathBlog.storefront.commentDetail(comments[0].comment))).toBeVisible();
    });

    await test.step(` Chọn comment bất kỳ > click Action > click Approve`, async () => {
      // verify không hiện comment pending ở SF trước khi approve comment
      await viewBlog.goto(`https://${conf.suiteConf.domain}/blogs/${comments[1].handle_blog_post}`);
      await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.title(comments[1].blog_post));
      await viewBlog.genLoc(blogPage.xpathBlog.storefront.blockComment).scrollIntoViewIfNeeded();
      await expect(viewBlog.genLoc(blogPage.xpathBlog.storefront.commentDetail(comments[1].comment))).toBeHidden();

      // Approve comment trong dashboard
      await blogPage.goToManageComments();
      await blogPage.page.waitForSelector(
        blogPage.xpathBlog.manageComment.rowComment(emails[1], comments[1].comment, comments[1].blog_post),
      );
      await blogPage.page.waitForTimeout(1000);
      await blogPage
        .genLoc(blogPage.xpathBlog.manageComment.checkboxComment(emails[1], comments[1].comment, comments[1].blog_post))
        .click();
      await blogPage.clickOnBtnWithLabel("Action");
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.moreAction("Approve")).click();
      await blogPage.waitForElementVisibleThenInvisible(blogPage.xpathToastMessage);
      const status = await blogPage.getTextContent(
        blogPage.xpathBlog.manageComment.statusComment(emails[1], comments[1].comment, comments[1].blog_post),
      );
      expect(status).toEqual("Approved");

      // check status comment trong blog post detail
      await blogPage.goToBlogPostPage();
      await blogPage.searchBlogOrBlogPost(comments[1].blog_post);
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(comments[1].blog_post)).click();
      await blogPage.page.waitForSelector(blogPage.xpathBlog.blogPost.blogPostDetail.btnBack);
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostDetail.blockComment).scrollIntoViewIfNeeded();
      const statusInBlogPost = await blogPage.getTextContent(
        blogPage.xpathBlog.blogPost.blogPostDetail.statusComment(emails[1]),
      );
      expect(statusInBlogPost).toEqual("Approved");

      // check hiện comment ở SF
      await viewBlog.reload();
      await viewBlog.page.waitForLoadState("load");
      await viewBlog.page.waitForSelector(blogPage.xpathBlog.storefront.title(comments[1].blog_post));
      await viewBlog.genLoc(blogPage.xpathBlog.storefront.blockComment).scrollIntoViewIfNeeded();
      await expect(viewBlog.genLoc(blogPage.xpathBlog.storefront.commentDetail(comments[1].comment))).toBeVisible();
    });
  });
});
