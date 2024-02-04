import { BlogPage } from "@pages/dashboard/blog";
import { BlogPostPageDB } from "@pages/dashboard/blog_post_url";
import { test } from "@fixtures/website_builder";
import { expect } from "@core/fixtures";
import { verifyRedirectUrl } from "@core/utils/theme";

test.describe(" Update URL setting for blogs : tạo blog lần đầu tiên  ", async () => {
  let blogPage: BlogPage;
  let blogPostDB: BlogPostPageDB;

  test.beforeEach(async ({ conf, dashboard }) => {
    blogPage = new BlogPage(dashboard, conf.suiteConf.domain);

    await test.step("Pre condition: Delete all blogs & blog posts", async () => {
      await blogPage.goToBlogPage();
      if (!(await blogPage.checkButtonVisible("Create blog post"))) {
        await blogPage.deleteBlogOrBlogPost("Blog");
        await blogPage.goToBlogPostPage();
      }
    });
  });

  test(`@SB_SC_LPC_BP_32 Verify tạo Blog post đầu tiên thành công`, async ({ conf, dashboard }) => {
    blogPostDB = new BlogPostPageDB(dashboard, conf.suiteConf.domain);
    const caseConf = conf.caseConf;

    await test.step(`- Input thông tin theo data để tạo Blog post  `, async () => {
      await blogPostDB.inputBlogPostInfo(caseConf.blog_post_info);
      await expect(blogPostDB.genLoc(".save-setting-content")).toBeVisible();
    });

    await test.step(`Create a new blog theo data -> Save`, async () => {
      await blogPostDB.createANewBlog(caseConf.blog_info.title);
      await expect(await blogPostDB.genLoc(blogPostDB.getXpathBlogSelected(caseConf.blog_info.title))).toBeVisible();
    });

    await test.step(`Click button Save tại side bar`, async () => {
      await blogPostDB.clickSaveBar();
      await expect(blogPostDB.genLoc(".s-alert__content span")).toHaveText(
        `${caseConf.blog_post_info.title} was created`,
      );
    });

    await test.step(`Click button Back posts`, async () => {
      await blogPostDB.clickOnBreadcrumb();
      await expect(blogPostDB.genLoc(blogPage.getXpathByText(caseConf.blog_post_info.title))).toBeVisible();
      await expect(blogPostDB.genLoc(blogPage.getXpathByText(caseConf.blog_info.title, "//span"))).toBeVisible();
    });

    await test.step(`Click Manage blogs `, async () => {
      await blogPage.goToBlogPage();
      await expect(blogPage.genLoc(blogPage.getXpathByText(caseConf.blog_info.title))).toBeVisible();
    });
  });

  test(`@SB_SC_LPC_BP_31 Verify tạo Blog post đầu tiên không thành công khi không tạo Blog`, async ({
    conf,
    dashboard,
  }) => {
    blogPostDB = new BlogPostPageDB(dashboard, conf.suiteConf.domain);
    const caseConf = conf.caseConf;

    await test.step(`- Input thông tin theo data để tạo Blog post   - Click button Save`, async () => {
      await blogPostDB.inputBlogPostInfo(caseConf.blog_post_info);
      await blogPostDB.clickSaveBar();
      await expect(blogPostDB.genLoc(".s-alert__description")).toHaveText(caseConf.expect);
    });
  });

  test(`@SB_SC_LPC_BP_30 Verify không assign blog cho blog post khi tạo Blog post đầu tiên`, async ({
    conf,
    dashboard,
  }) => {
    blogPostDB = new BlogPostPageDB(dashboard, conf.suiteConf.domain);
    const caseConf = conf.caseConf;

    await test.step(`Click button Add blog post `, async () => {
      await blogPage.clickOnBtnWithLabel("Create blog post");
      await expect(blogPage.genLoc(blogPostDB.xpathSelectBlogDroplist)).toBeHidden();
    });

    await test.step(`Click Create a new blog`, async () => {
      await blogPostDB.createANewBlog(caseConf.blog_info.title);
      await blogPostDB.clickOnTextLinkWithLabel("Create a new blog");
      await expect(blogPostDB.genLoc(".s-modal-wrapper")).toBeVisible();
    });
  });
});

test.describe(" Update URL setting for blogs : đã có sẵn ít nhất 1 blog ", async () => {
  let blogPage: BlogPage;
  let blogPostDB: BlogPostPageDB;

  test.beforeEach(async ({ conf, dashboard }) => {
    blogPage = new BlogPage(dashboard, conf.suiteConf.domain);
    blogPostDB = new BlogPostPageDB(dashboard, conf.suiteConf.domain);

    await test.step("Pre condition: Delete all blogs & blog posts & create a new blog ", async () => {
      await blogPage.goToBlogPage();
      if (!(await blogPage.checkButtonVisible("Create blog post"))) {
        await blogPage.deleteBlogOrBlogPost("Blog");
        await blogPage.goToBlogPostPage();
      }
      await blogPage.clickOnBtnWithLabel("Create blog post");
      await blogPostDB.createANewBlog("Blog test");
    });
  });

  test(`@SB_SC_LPC_BP_33 Verify tạo Blog post thứ 2 thành công khi không tạo Blog`, async ({ conf }) => {
    const caseConf = conf.caseConf;

    await test.step("Pre condition: Tạo mới blog", async () => {
      await blogPage.goToBlogPage();
      await blogPage.clickOnBtnWithLabel("Add blog");
      await blogPage.createBlog(caseConf.blog_info);
    });

    await test.step(`Input thông tin theo data để tạo Blog post  `, async () => {
      await blogPage.goToBlogPostPage();
      await blogPostDB.inputBlogPostInfo(caseConf.blog_post_info);
      await expect(blogPage.genLoc(".save-setting-content")).toBeVisible();
      await expect(blogPage.genLoc(blogPostDB.xpathBlogDroplistFirstOption)).toHaveText(`${caseConf.blog_info.title}`);
    });

    await test.step(`Click button Save tại side bar`, async () => {
      await blogPostDB.clickSaveBar();
      await expect(blogPostDB.genLoc(".s-alert__content span")).toHaveText(
        `${caseConf.blog_post_info.title} was created`,
      );
    });

    await test.step(`Click button Back posts`, async () => {
      await blogPostDB.clickOnBreadcrumb();
      await expect(blogPostDB.genLoc(blogPage.getXpathByText(caseConf.blog_post_info.title))).toBeVisible();
      await expect(blogPostDB.genLoc(blogPage.getXpathByText(caseConf.blog_info.title, "//span"))).toBeVisible();
    });
  });

  test(`@SB_SC_LPC_BP_35 Verify Url của blog sau khi tạo`, async ({ dashboard, context, conf }) => {
    test.slow();
    const caseConf = conf.caseConf;

    await test.step("Pre condition: Tạo mới blog", async () => {
      await blogPage.goToBlogPage();
      await blogPage.clickOnBtnWithLabel("Add blog");
      await blogPage.createBlog(caseConf.blog_info);
    });

    await test.step(`Open blog list > Preview Blog ngoài SF`, async () => {
      await blogPostDB.clickOnBreadcrumb();
      await blogPage.genLoc(blogPage.getXpathByText(caseConf.blog_info.title)).hover();
      await verifyRedirectUrl({
        page: dashboard,
        selector: blogPostDB.xpathIconEye(caseConf.blog_info.title),
        redirectUrl: caseConf.url_step1,
        context,
      });
    });

    await test.step(`Tại dashboad: tạo blog có name trùng với blog đã tạo theo data `, async () => {
      await blogPage.clickOnBtnWithLabel("Add blog");
      await blogPage.createBlog(caseConf.blog_info);
      await expect(blogPostDB.genLoc(".s-alert__content span")).toHaveText(`${caseConf.blog_info.title} was created`);
    });

    await test.step(`Preview Blog ngoài SF`, async () => {
      await verifyRedirectUrl({
        page: dashboard,
        selector: blogPostDB.xpathBtnView,
        redirectUrl: caseConf.url_step3,
        context,
      });
    });

    await test.step(`Tạp blog post có name trùng với blog đã tạo theo data > preview blog post ngoài SF`, async () => {
      await blogPage.goToBlogPostPage();
      await blogPostDB.inputBlogPostInfo(caseConf.blog_post_info);
      await blogPostDB.clickSaveBar();
      await blogPostDB.page.waitForSelector(".s-alert__content span");
      await verifyRedirectUrl({
        page: dashboard,
        selector: blogPostDB.xpathBtnView,
        redirectUrl: caseConf.url_step4,
        context,
      });
    });

    await test.step(`Tạo blog có name có đặc biệt theo data`, async () => {
      for (const data of caseConf.data_step5) {
        await blogPage.goToBlogPage();
        await blogPage.clickOnBtnWithLabel("Add blog");
        await blogPage.createBlog(data.blog_info);

        if (data.error_msg) {
          await expect(blogPostDB.genLoc(".s-alert__description")).toHaveText(data.error_msg);
        } else {
          await verifyRedirectUrl({
            page: dashboard,
            selector: blogPostDB.xpathBtnView,
            redirectUrl: data.url,
            context,
          });
        }
      }
    });
  });

  test(`@SB_SC_LPC_BP_34 Verify Url của blog post sau khi tạo`, async ({ dashboard, context, conf }) => {
    test.slow();
    const caseConf = conf.caseConf;

    await test.step("Pre condition: Tạo mới blog post ", async () => {
      await blogPage.goToBlogPostPage();
      await blogPostDB.inputBlogPostInfo(caseConf.blog_post_info);
      await blogPostDB.clickSaveBar();
      await blogPostDB.page.waitForSelector(".s-alert__content span");
    });

    await test.step(`Open blog list > Click vào title Blog post 01 `, async () => {
      await blogPostDB.clickOnBreadcrumb();
      await blogPage.genLoc(blogPage.getXpathByText(caseConf.blog_post_info.title)).hover();
      await verifyRedirectUrl({
        page: dashboard,
        selector: blogPostDB.xpathIconEye(caseConf.blog_post_info.title),
        redirectUrl: caseConf.url_step1,
        context,
      });
    });

    await test.step(`Tại dashboad: tạo blog post có name trùng với blog post đã tạo theo data `, async () => {
      await blogPostDB.inputBlogPostInfo(caseConf.blog_post_info);
      await blogPostDB.clickSaveBar();
      await expect(blogPostDB.genLoc(".s-alert__content span")).toHaveText(
        `${caseConf.blog_post_info.title} was created`,
      );
    });

    await test.step(`Preview Blog ngoài SF`, async () => {
      await verifyRedirectUrl({
        page: dashboard,
        selector: blogPostDB.xpathBtnView,
        redirectUrl: caseConf.url_step3,
        context,
      });
    });

    await test.step(`Tạo blog có name trùng với blog post theo data`, async () => {
      await blogPage.goToBlogPage();
      await blogPage.clickOnBtnWithLabel("Add blog");
      await blogPage.createBlog(caseConf.blog_info);
      await expect(blogPostDB.genLoc(".s-alert__content span")).toHaveText(`${caseConf.blog_info.title} was created`);
    });

    await test.step(`Preview Blog ngoài SF`, async () => {
      await verifyRedirectUrl({
        page: dashboard,
        selector: blogPostDB.xpathBtnView,
        redirectUrl: caseConf.url_step5,
        context,
      });
    });

    await test.step(`Tạo blog post có name có đặc biệt theo data`, async () => {
      for (const data of caseConf.data_step6) {
        await blogPage.goToBlogPostPage();
        await blogPostDB.inputBlogPostInfo(data.blog_post_info);
        await blogPostDB.clickSaveBar();
        await blogPostDB.page.waitForSelector(".s-alert__content span");

        if (data.error_msg) {
          await expect(blogPostDB.genLoc(".s-alert__description")).toHaveText(data.error_msg);
        } else {
          await verifyRedirectUrl({
            page: dashboard,
            selector: blogPostDB.xpathBtnView,
            redirectUrl: data.url,
            context,
          });
        }
      }
    });
  });
});
