import { expect, test } from "@fixtures/website_builder";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { BlogPostPageDB } from "@pages/dashboard/blog_post_url";
import { BlogPage } from "@pages/dashboard/blog";
import { pressControl } from "@core/utils/keyboard";

test.describe("Automate testcase for entity blog posts(feature translation)", () => {
  let dashboardPage: TranslationDetail;
  let blogPage: BlogPage;
  let blogPostPageDB: BlogPostPageDB;
  let listBlogPost: string[];

  test.beforeEach("", async ({ dashboard, conf, cConf }) => {
    const suiteConf = conf.suiteConf;
    dashboardPage = new TranslationDetail(dashboard, suiteConf.domain);
    blogPostPageDB = new BlogPostPageDB(dashboard, suiteConf.domain);
    blogPage = new BlogPage(dashboard, suiteConf.domain);

    await test.step("Pre condition: Delete all languages and add new language", async () => {
      await dashboardPage.goToLanguageList();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLangList.titleLanguageList)).toBeVisible();
      await dashboardPage.removeAllLanguages();

      await dashboardPage.addLanguages([cConf.language_data.language]);
      await dashboardPage.waitUntilMessHidden();
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathLangList.languageItemByName(cConf.language_data.status, cConf.language_data.language),
        ),
      ).toBeVisible();
    });

    await test.step("Pre condition: Delete all blogs & blog posts", async () => {
      await blogPage.goToBlogPage();
      if (!(await blogPage.checkButtonVisible("Create blog post"))) {
        await blogPage.deleteBlogOrBlogPost("");
        await blogPage.goToBlogPostPage();
      }
    });

    await test.step(`Pre-condition: Add first blog and blog post`, async () => {
      await blogPostPageDB.inputBlogPostInfo(suiteConf.blog_post_info);
      await expect(blogPostPageDB.genLoc(".save-setting-content")).toBeVisible();
      await blogPostPageDB.createANewBlog(suiteConf.blog_info.title);
      await expect(blogPostPageDB.genLoc(blogPostPageDB.getXpathBlogSelected(suiteConf.blog_info.title))).toBeVisible();
      await blogPostPageDB.clickSaveBar();
      await expect(blogPostPageDB.genLoc(".s-alert__content span")).toHaveText(
        `${suiteConf.blog_post_info.title} was created`,
      );
      await blogPostPageDB.clickOnBreadcrumb();
    });

    await test.step(`Pre-condition: Add new blog posts`, async () => {
      for (const blogPostInfo of cConf.blog_post_info) {
        await blogPostPageDB.inputBlogPostInfo(blogPostInfo);
        await expect(blogPostPageDB.genLoc(".save-setting-content")).toBeVisible();
        await blogPostPageDB.clickSaveBar();
        await expect(blogPostPageDB.genLoc(".s-alert__content span")).toHaveText(`${blogPostInfo.title} was created`);
        await blogPostPageDB.clickOnBreadcrumb();
      }
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.rowBlogPost).first().waitFor({ state: "visible" });
      listBlogPost = await blogPage.getListBlogPost();
    });
  });

  test(`@SB_SET_TL_62 [DB - UI/UX] Kiểm tra màn translate detail của store data - Pages - Blog posts`, async ({
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;

    await test.step(`Click vào details của blog posts`, async () => {
      await dashboardPage.goToTranslationDetailScreen(
        caseConf.language_data.status,
        caseConf.language_data.language,
        caseConf.language_data.entity,
      );
      await expect(dashboardPage.genLoc(dashboardPage.xpathTD.translationTable.heading.fieldColumn)).toBeVisible();
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language),
        ),
      ).toBeVisible();
      await expect(
        dashboardPage.genLoc(
          dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(caseConf.language_data.language),
        ),
      ).toBeVisible();
    });

    await test.step(`Kiểm tra droplist pages`, async () => {
      const droplistEntities = await dashboardPage.getDropListPagesOptions();
      expect(droplistEntities).toEqual(expect.arrayContaining(dashboardPage.dropListPages));
    });

    await test.step(`Kiểm tra droplist Blog posts`, async () => {
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.entity.input(caseConf.language_data.placeholder_entity))
        .click();
      await dashboardPage.page.waitForTimeout(2 * 1000); //wait for droplist visible
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-translation-detail-blog-posts.png`,
      });
    });

    await test.step(`Thực hiện search keyword không tồn tại`, async () => {
      await dashboardPage.searchKey(conf.caseConf.invalid_value);
      await expect(dashboardPage.page.locator(dashboardPage.xpathTD.xpathNotFound)).toBeVisible();
    });

    await test.step(`Thực hiện search keyword có tồn tại`, async () => {
      await dashboardPage.searchKey(conf.caseConf.valid_value);
      const numberOfResult = await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown)
        .count();
      expect(numberOfResult).toEqual(2);
      for (let i = 1; i < numberOfResult; i++) {
        await expect(
          dashboardPage.page.locator(`(${dashboardPage.xpathTD.searchBar.valueOptionOnDropdown})[${i}]`),
        ).toContainText(conf.caseConf.valid_value);
      }
    });

    await test.step(`Kiểm tra các field`, async () => {
      for (const blogPost of caseConf.blog_post_info) {
        await dashboardPage.searchKey(blogPost.title);
        await expect(
          dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).first(),
        ).toHaveText(blogPost.title);
        await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).first().click();
        await dashboardPage.page.waitForTimeout(2 * 1000); //wait for content visible

        for (const showField of blogPost.show_field) {
          await expect(dashboardPage.page.locator(dashboardPage.xpathTD.blockName(showField))).toBeVisible();
        }
        for (const hideField of blogPost.hide_field) {
          await expect(dashboardPage.page.locator(dashboardPage.xpathTD.blockName(hideField))).toBeHidden();
        }
      }
    });

    await test.step(`Kiểm tra icon các bản dịch`, async () => {
      await dashboardPage.searchKey(conf.suiteConf.blog_post_info.title);
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).first().click();
      await dashboardPage.page.waitForTimeout(2 * 1000); //wait for content visible

      //Verify default
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-blog-posts-UI-default.png`,
      });

      //Verify UI manual
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.inputTextBoxWithLabel(caseConf.data_manual.field_name))
        .fill(caseConf.data_manual.value);
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-blog-posts-UI-manual.png`,
      });

      //Verify UI auto
      await dashboardPage.clickActionBtn("Auto translate");
      await dashboardPage.waitUntilElementVisible(
        dashboardPage.xpathTD.alertInProgress(caseConf.language_data.language),
      );
      await dashboardPage.waitForTranslationToComplete(caseConf.language_data.language);

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.iconTranslate(caseConf.field_name_check_auto_icon))
        .hover();
      await dashboardPage.page.waitForTimeout(1 * 1000); //wait for tooltip visible
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-blog-posts-UI-auto.png`,
      });

      //Verify UI outdate
      await blogPage.goToBlogPostPage();
      await blogPage.searchBlogOrBlogPost(conf.suiteConf.blog_post_info.title);
      await blogPage.genLoc(blogPage.xpathBlog.blog.blogList.blogTitle(conf.suiteConf.blog_post_info.title)).click();
      await blogPage.editBlogPost(caseConf.blog_post_info_edit);
      await dashboardPage.goToTranslationDetailScreen(
        caseConf.language_data.status,
        caseConf.language_data.language,
        caseConf.language_data.entity,
      );
      await dashboardPage.searchKey(caseConf.blog_post_info_edit.title);
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).first().click();

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.iconTranslate(caseConf.field_name_check_outdate_icon))
        .hover();
      await dashboardPage.page.waitForTimeout(1 * 1000); //wait for tooltip visible
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-blog-posts-UI-outdate.png`,
      });
    });

    await test.step(`Kiểm tra edit bản dịch`, async () => {
      //1. Thêm text vào text field - checked above
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.inputTextBoxWithLabel(
            caseConf.data_edit_more_characters.field_name_text,
          ),
        )
        .click();
      await pressControl(dashboardPage.page, "A");
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.inputTextBoxWithLabel(
            caseConf.data_edit_more_characters.field_name_text,
          ),
        )
        .fill(caseConf.data_edit_more_characters.value);
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();

      //2. Thêm text nhiều vào text editor
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.inputTextAreaWithLabel(
            caseConf.data_edit_more_characters.field_name_text_editor,
          ),
        )
        .frameLocator("//iframe")
        .locator("body")
        .click();
      await pressControl(dashboardPage.page, "A");
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.inputTextAreaWithLabel(
            caseConf.data_edit_more_characters.field_name_text_editor,
          ),
        )
        .frameLocator("//iframe")
        .locator("body")
        .pressSequentially(caseConf.data_edit_more_characters.value);

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-blog-posts-UI-more-characters.png`,
      });
    });
  });

  test(`@SB_SET_TL_98 [DB+SF - Function] Kiểm tra tính năng auto translate khi Enable Auto translate Pages - Blog posts`, async ({
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;
    let searchResult: string[];

    await test.step(`Enable auto translate ở Blog posts > Mở màn Blog Posts Translation > Mở droplist Blog posts `, async () => {
      await dashboardPage.goToLanguageDetail(caseConf.language_data.status, caseConf.language_data.language);
      await dashboardPage.switchToggleAutoTranslate("Pages", true);
      await dashboardPage.waitForElementVisibleThenInvisible(dashboardPage.xpathLangList.toastMessage);
      await dashboardPage.clickEntityDetail(caseConf.language_data.entity);
      await dashboardPage.page.waitForTimeout(3 * 1000); //wait for content visible
      await dashboardPage.waitForTranslationToComplete(caseConf.language_data.language);

      //Verify content đã được dịch
      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect
        .soft(transformedData)
        .toEqual(expect.arrayContaining(caseConf.blog_post_info[0].expected_result_translation));

      //Verify droplist blog posts
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.entity.input(caseConf.language_data.placeholder_entity))
        .click();
      searchResult = await dashboardPage.getEntitySearchResults();
      expect(searchResult.length).toEqual(listBlogPost.length);
      for (let i = 0; i < searchResult.length; i++) {
        expect(searchResult[i]).toEqual(listBlogPost[i]);
      }

      //verify SF
      const translatedBlogPostDataSF = (
        await blogPage.getBlogDataOnSF(conf.suiteConf.blog_info.handle, caseConf.language_data.language_locale)
      ).result.blog_posts[0];

      expect.soft(translatedBlogPostDataSF.title).toEqual(transformedData[0].target_value);

      await expect.soft(translatedBlogPostDataSF.body_html).toContain(transformedData[1].source_value);
      await expect.soft(translatedBlogPostDataSF.body_html).toContain(caseConf.translated_key);
      await expect.soft(translatedBlogPostDataSF.body_html).toContain(`to ${caseConf.language_data.language}`);

      expect.soft(translatedBlogPostDataSF.excerpt).toEqual(transformedData[2].target_value);
      expect.soft(translatedBlogPostDataSF.meta_title).toEqual(transformedData[3].target_value);
      expect.soft(translatedBlogPostDataSF.meta_description).toEqual(transformedData[4].target_value);
    });

    await test.step(`Thực hiện thêm / xóa Blog post tại dashboard > Mở màn Blog post Translation > Mở droplist`, async () => {
      // Add a new blog
      await blogPage.goToBlogPostPage();
      await blogPostPageDB.inputBlogPostInfo(caseConf.blog_post_info_2);
      await blogPostPageDB.clickSaveBar();
      await expect(blogPostPageDB.genLoc(".s-alert__content span")).toHaveText(
        `${caseConf.blog_post_info_2.title} was created`,
      );
      await blogPostPageDB.clickOnBreadcrumb();
      await blogPage.genLoc(blogPage.xpathBlog.blogPost.blogPostList.rowBlogPost).first().waitFor({ state: "visible" });
      listBlogPost = await blogPage.getListBlogPost();

      //Verify droplist blog posts
      await dashboardPage.goToTranslationDetailScreen(
        caseConf.language_data.status,
        caseConf.language_data.language,
        caseConf.language_data.entity,
      );
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.entity.input(caseConf.language_data.placeholder_entity))
        .click();
      searchResult = await dashboardPage.getEntitySearchResults();
      expect(searchResult.length).toEqual(listBlogPost.length);
      for (let i = 0; i < searchResult.length; i++) {
        expect(searchResult[i]).toEqual(listBlogPost[i]);
      }

      //Delete a blog post
      await blogPage.goToBlogPostPage();
      await blogPage.deleteBlogOrBlogPost(caseConf.blog_post_info_2.title);
      await blogPage.goToBlogPostPage();
      listBlogPost = await blogPage.getListBlogPost();

      //Verify droplist blog posts
      await dashboardPage.goToTranslationDetailScreen(
        caseConf.language_data.status,
        caseConf.language_data.language,
        caseConf.language_data.entity,
      );
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.entity.input(caseConf.language_data.placeholder_entity))
        .click();
      searchResult = await dashboardPage.getEntitySearchResults();
      expect(searchResult.length).toEqual(listBlogPost.length);
      for (let i = 0; i < searchResult.length; i++) {
        expect(searchResult[i]).toEqual(listBlogPost[i]);
      }
    });

    await test.step(`Thực hiện edit content Blog post A
  Mở màn Blog posts Translation của Blog post đã edit`, async () => {
      await blogPage.goToBlogPostPage();
      await blogPage.searchBlogOrBlogPost(caseConf.blog_post_info[0].title);
      await blogPage
        .genLoc(`(${blogPage.xpathBlog.blog.blogList.blogTitle(caseConf.blog_post_info[0].title)})[1]`)
        .click();
      await blogPage.editBlogPost(caseConf.blog_post_info_edit);
      await dashboardPage.goToTranslationDetailScreen(
        caseConf.language_data.status,
        caseConf.language_data.language,
        caseConf.language_data.entity,
      );
      await dashboardPage.searchKey(caseConf.blog_post_info_edit.title);
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).first().click();
      await dashboardPage.waitForTranslationAfterEditContent(caseConf.blog_post_info_edit.title);
      await dashboardPage.page.waitForTimeout(3 * 1000); //wait for content visible

      //Verify original content đã được update và đã được dịch
      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect
        .soft(transformedData)
        .toEqual(expect.arrayContaining(caseConf.blog_post_info_edit.expected_result_translation));

      //verify SF
      const translatedBlogPostDataSF = (
        await blogPage.getBlogDataOnSF(conf.suiteConf.blog_info.handle, caseConf.language_data.language_locale)
      ).result.blog_posts[0];

      expect.soft(translatedBlogPostDataSF.title).toEqual(transformedData[0].target_value);

      await expect.soft(translatedBlogPostDataSF.body_html).toContain(transformedData[1].source_value);
      await expect.soft(translatedBlogPostDataSF.body_html).toContain(caseConf.translated_key);
      await expect.soft(translatedBlogPostDataSF.body_html).toContain(`to ${caseConf.language_data.language}`);

      expect.soft(translatedBlogPostDataSF.excerpt).toEqual(transformedData[2].target_value);
      expect.soft(translatedBlogPostDataSF.meta_title).toEqual(transformedData[3].target_value);
      expect.soft(translatedBlogPostDataSF.meta_description).toEqual(transformedData[4].target_value);
    });

    await test.step(`Thực hiện edit bản dịch > save`, async () => {
      for (const field of caseConf.edit_manual_translate) {
        await dashboardPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: 0,
            fieldName: field.field_name,
          },
        });
      }
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();
      await dashboardPage.toastWithMessage(caseConf.toast_success).waitFor({ state: "hidden" });

      const data = await dashboardPage.getTranslationDetailData();
      for (let i = 0; i < data.length; i++) {
        expect.soft(data[i]).toEqual(
          expect.objectContaining({
            field: caseConf.edit_manual_translate[i].field_name,
            destination: expect.objectContaining({
              value: caseConf.edit_manual_translate[i].content,
            }),
          }),
        );
      }
      const transformedData = data.map(item => {
        return {
          target_value: item.destination.value,
        };
      });

      //verify SF
      const translatedBlogPostDataSF = (
        await blogPage.getBlogDataOnSF(conf.suiteConf.blog_info.handle, caseConf.language_data.language_locale)
      ).result.blog_posts[0];

      expect.soft(translatedBlogPostDataSF.title).toEqual(transformedData[0].target_value);
      expect.soft(translatedBlogPostDataSF.body_html).toEqual(transformedData[1].target_value);
      expect.soft(translatedBlogPostDataSF.excerpt).toEqual(transformedData[2].target_value);
      expect.soft(translatedBlogPostDataSF.meta_title).toEqual(transformedData[3].target_value);
      expect.soft(translatedBlogPostDataSF.meta_description).toEqual(transformedData[4].target_value);
    });

    await test.step(`Click Auto translate`, async () => {
      await dashboardPage.clickActionBtn("Auto translate");
      await dashboardPage.waitUntilElementVisible(
        dashboardPage.xpathTD.alertInProgress(caseConf.language_data.language),
      );
      await dashboardPage.waitForTranslationToComplete(caseConf.language_data.language);

      // verify bản dịch trong dashboard
      const data = await dashboardPage.getTranslationDetailData();
      for (let i = 0; i < data.length; i++) {
        expect.soft(data[i]).toEqual(
          expect.objectContaining({
            field: caseConf.edit_manual_translate[i].field_name,
            destination: expect.objectContaining({
              value: caseConf.edit_manual_translate[i].content,
            }),
          }),
        );
      }
      const transformedData = data.map(item => {
        return {
          source_value: item.source.value,
          target_value: item.destination.value,
        };
      });

      //verify SF
      const translatedBlogPostDataSF = (
        await blogPage.getBlogDataOnSF(conf.suiteConf.blog_info.handle, caseConf.language_data.language_locale)
      ).result.blog_posts[0];

      expect.soft(translatedBlogPostDataSF.title).toEqual(transformedData[0].target_value);
      expect.soft(translatedBlogPostDataSF.body_html).toEqual(transformedData[1].target_value);
      expect.soft(translatedBlogPostDataSF.excerpt).toEqual(transformedData[2].target_value);
      expect.soft(translatedBlogPostDataSF.meta_title).toEqual(transformedData[3].target_value);
      expect.soft(translatedBlogPostDataSF.meta_description).toEqual(transformedData[4].target_value);
    });

    await test.step(`Xóa Bản dịch manual > save
  Ra ngoài SF > chọn ngôn ngữ tiếng Việt >  Ra ngoài SF Blog A`, async () => {
      for (const field of caseConf.delete_translation) {
        await dashboardPage.fillTranslationDetail({
          inputDataType: field.input_data_type,
          inputData: field.content,
          searchCondition: {
            fieldIndex: 0,
            fieldName: field.field_name,
          },
        });
      }
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickOnBtnWithLabel("Save");
      await expect(dashboardPage.toastWithMessage(caseConf.toast_success)).toBeVisible();
      await dashboardPage.toastWithMessage(caseConf.toast_success).waitFor({ state: "hidden" });

      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-remove-translation-${conf.caseName}.png`,
      });

      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          source_value: item.source.value,
        };
      });

      //verify SF
      const translatedBlogPostDataSF = (
        await blogPage.getBlogDataOnSF(conf.suiteConf.blog_info.handle, caseConf.language_data.language_locale)
      ).result.blog_posts[0];

      expect.soft(translatedBlogPostDataSF.title).toEqual(transformedData[0].source_value);
      expect.soft(translatedBlogPostDataSF.body_html).toEqual(transformedData[1].source_value);
      expect.soft(translatedBlogPostDataSF.excerpt).toEqual(transformedData[2].source_value);
      expect.soft(translatedBlogPostDataSF.meta_title).toEqual(transformedData[3].source_value);
      expect.soft(translatedBlogPostDataSF.meta_description).toEqual(transformedData[4].source_value);
    });

    await test.step(`click btn auto translate`, async () => {
      await dashboardPage.clickActionBtn("Auto translate");
      await dashboardPage.waitUntilElementVisible(
        dashboardPage.xpathTD.alertInProgress(caseConf.language_data.language),
      );
      await dashboardPage.waitForTranslationToComplete(caseConf.language_data.language);

      // verify bản dịch trong dashboard
      const data = await dashboardPage.getTranslationDetailData();
      const transformedData = data.map(item => {
        return {
          field_name: item.field,
          source_value: item.source.value,
          source_type: item.source.type,
          target_value: item.destination.value,
          target_type: item.destination.type,
        };
      });
      expect
        .soft(transformedData)
        .toEqual(expect.arrayContaining(caseConf.blog_post_info_edit.expected_result_translation));

      //verify SF
      const translatedBlogPostDataSF = (
        await blogPage.getBlogDataOnSF(conf.suiteConf.blog_info.handle, caseConf.language_data.language_locale)
      ).result.blog_posts[0];

      expect.soft(translatedBlogPostDataSF.title).toEqual(transformedData[0].target_value);

      await expect.soft(translatedBlogPostDataSF.body_html).toContain(transformedData[1].source_value);
      await expect.soft(translatedBlogPostDataSF.body_html).toContain(caseConf.translated_key);
      await expect.soft(translatedBlogPostDataSF.body_html).toContain(`to ${caseConf.language_data.language}`);

      expect.soft(translatedBlogPostDataSF.excerpt).toEqual(transformedData[2].target_value);
      expect.soft(translatedBlogPostDataSF.meta_title).toEqual(transformedData[3].target_value);
      expect.soft(translatedBlogPostDataSF.meta_description).toEqual(transformedData[4].target_value);
    });
  });
});
