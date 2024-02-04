import { expect, test } from "@fixtures/website_builder";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation/translation-detail";
import { BlogPostPageDB } from "@pages/dashboard/blog_post_url";
import { BlogPage } from "@pages/dashboard/blog";
import { pressControl } from "@core/utils/keyboard";

test.describe("Automate testcase for entity blogs(feature translation)", () => {
  let dashboardPage: TranslationDetail;
  let blogPage: BlogPage;
  let blogPostPageDB: BlogPostPageDB;
  let listBlog: string[];

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

    await test.step("Pre condition: Add blogs", async () => {
      await blogPage.goToBlogPage();
      for (const blogInfo of cConf.blog_info) {
        await blogPage.clickOnBtnWithLabel("Add blog");
        await blogPage.createBlog(blogInfo);
        await blogPage.clickOnBreadcrumb();
      }
      listBlog = await blogPage.getListBlog();
      if (cConf.blog_post_info) {
        await blogPage.goToBlogPostPage();
        await blogPostPageDB.inputBlogPostInfo(cConf.blog_post_info);
        await blogPostPageDB.clickSaveBar();
      }
    });
  });

  test(`@SB_SET_TL_61 [DB - UI/UX] Kiểm tra màn translate detail của store data - Pages - Blogs`, async ({
    snapshotFixture,
    conf,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;

    await test.step(`Click vào details của blogs`, async () => {
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

    await test.step(`Kiểm tra droplist Blog`, async () => {
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.entity.input(caseConf.language_data.placeholder_entity))
        .click();
      await dashboardPage.page.waitForTimeout(2 * 1000); //wait for droplist visible
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-list-blogs-case-${conf.caseName}.png`,
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
      for (const blog of caseConf.blog_info) {
        await dashboardPage.searchKey(blog.title);
        await expect(
          dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).first(),
        ).toHaveText(blog.title);
        await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).first().click();

        for (const showField of blog.show_field) {
          await expect(dashboardPage.page.locator(dashboardPage.xpathTD.blockName(showField))).toBeVisible();
        }
        for (const hideField of blog.hide_field) {
          await expect(dashboardPage.page.locator(dashboardPage.xpathTD.blockName(hideField))).toBeHidden();
        }
      }
    });

    await test.step(`Kiểm tra icon các bản dịch`, async () => {
      await dashboardPage.searchKey(conf.suiteConf.blog_info.title);
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).first().click();

      //Verify default
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-blogs-UI-default.png`,
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
        snapshotName: `${process.env.ENV}-blogs-UI-manual.png`,
      });

      //Verify UI auto
      await dashboardPage.clickActionBtn("Auto translate");
      await expect(
        dashboardPage.genLoc(dashboardPage.xpathTD.alertInProgress(caseConf.language_data.language)),
      ).toBeVisible();
      await dashboardPage.page.waitForSelector(
        dashboardPage.xpathTD.alertTransSuccess(caseConf.language_data.language),
      );

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.iconTranslate(caseConf.field_name_check_auto_icon))
        .hover();
      await dashboardPage.page.waitForTimeout(1 * 1000); //wait for tooltip visible
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-blogs-UI-auto.png`,
      });

      //Verify UI outdate
      await blogPage.goToBlogPage();
      await blogPage.searchBlogOrBlogPost(conf.suiteConf.blog_info.title);
      await blogPage
        .genLoc(`(${blogPage.xpathBlog.blog.blogList.blogTitle(conf.suiteConf.blog_info.title)})[1]`)
        .click();
      await blogPage.editBlog(caseConf.blog_info_edit);
      await blogPostPageDB.clickSaveBar();
      await dashboardPage.goToTranslationDetailScreen(
        caseConf.language_data.status,
        caseConf.language_data.language,
        caseConf.language_data.entity,
      );
      await dashboardPage.searchKey(caseConf.blog_info_edit.title);
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).first().click();

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.iconTranslate(caseConf.field_name_check_outdate_icon))
        .hover();
      await dashboardPage.page.waitForTimeout(1 * 1000); //wait for tooltip visible
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-blogs-UI-outdate.png`,
      });
    });

    await test.step(`Kiểm tra edit bản dịch`, async () => {
      //1. Thêm text vào text field - checked above
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.inputTextBoxWithLabel(caseConf.data_edit_more_characters.field_name),
        )
        .click();
      await pressControl(dashboardPage.page, "A");
      await dashboardPage.page
        .locator(
          dashboardPage.xpathTD.translationTable.inputTextBoxWithLabel(caseConf.data_edit_more_characters.field_name),
        )
        .fill(caseConf.data_edit_more_characters.value);

      await dashboardPage.page
        .locator(dashboardPage.xpathTD.translationTable.heading.fieldColumnByValue(conf.suiteConf.default_language))
        .click();
      await dashboardPage.clickBtnSave();
      await snapshotFixture.verify({
        page: dashboardPage.page,
        selector: dashboardPage.xpathTD.sectionEditLanguage,
        snapshotName: `${process.env.ENV}-blogs-UI-more-characters.png`,
      });
    });
  });

  test(`@SB_SET_TL_96 [DB+SF - Function] Kiểm tra tính năng auto translate khi Enable Auto translate Pages - Blogs`, async ({
    conf,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;

    let searchResult: string[];

    await test.step(`Enable auto translate ở Blogs > Mở màn Blogs Translation > Mở droplist Blogs `, async () => {
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
      expect(transformedData).toEqual(expect.arrayContaining(caseConf.blog_info[0].expected_result_translation));

      //Verify droplist blogs
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.entity.input(caseConf.language_data.placeholder_entity))
        .click();
      searchResult = await dashboardPage.getEntitySearchResults();
      expect(searchResult.length).toEqual(listBlog.length);
      for (let i = 0; i < searchResult.length; i++) {
        expect(searchResult[i]).toEqual(listBlog[i]);
      }

      //verify SF
      const translatedBlogDataSF = (
        await blogPage.getBlogDataOnSF(caseConf.blog_info[0].handle, caseConf.language_data.language_locale)
      ).result.blog_posts[0].blog;

      expect.soft(translatedBlogDataSF.title).toEqual(transformedData[0].target_value);
      expect(translatedBlogDataSF.meta_title).toEqual(transformedData[1].target_value);
      expect(translatedBlogDataSF.meta_description).toEqual(transformedData[2].target_value);
    });

    await test.step(`Thực hiện thêm / xóa Blogs tại dashboard > Mở màn Blogs Translation > Mở droplist`, async () => {
      // Add a new blog
      await blogPage.goToBlogPage();
      await blogPage.clickOnBtnWithLabel("Add blog");
      await blogPage.createBlog(caseConf.blog_info_2);
      await blogPage.clickOnBreadcrumb();
      listBlog = await blogPage.getListBlog();

      //Verify droplist blogs
      await dashboardPage.goToTranslationDetailScreen(
        caseConf.language_data.status,
        caseConf.language_data.language,
        caseConf.language_data.entity,
      );
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.entity.input(caseConf.language_data.placeholder_entity))
        .click();
      searchResult = await dashboardPage.getEntitySearchResults();
      expect(searchResult.length).toEqual(listBlog.length);
      for (let i = 0; i < searchResult.length; i++) {
        expect(searchResult[i]).toEqual(listBlog[i]);
      }

      //Delete a blog
      await blogPage.goToBlogPage();
      await blogPage.deleteBlogOrBlogPost(caseConf.blog_info_2.title);
      await blogPage.goToBlogPage();
      listBlog = await blogPage.getListBlog();

      //Verify droplist blogs
      await dashboardPage.goToTranslationDetailScreen(
        caseConf.language_data.status,
        caseConf.language_data.language,
        caseConf.language_data.entity,
      );
      await dashboardPage.page
        .locator(dashboardPage.xpathTD.searchBar.entity.input(caseConf.language_data.placeholder_entity))
        .click();
      searchResult = await dashboardPage.getEntitySearchResults();
      expect(searchResult.length).toEqual(listBlog.length);
      for (let i = 0; i < searchResult.length; i++) {
        expect(searchResult[i]).toEqual(listBlog[i]);
      }
    });

    await test.step(`Thực hiện edit content Blog A
  Mở màn Blogs Translation của Blog đã edit`, async () => {
      await blogPage.goToBlogPage();
      await blogPage.searchBlogOrBlogPost(caseConf.blog_info[0].title);
      await blogPage.genLoc(`(${blogPage.xpathBlog.blog.blogList.blogTitle(caseConf.blog_info[0].title)})[1]`).click();
      await blogPage.editBlog(caseConf.blog_info_edit);
      await blogPostPageDB.clickSaveBar();
      await dashboardPage.goToTranslationDetailScreen(
        caseConf.language_data.status,
        caseConf.language_data.language,
        caseConf.language_data.entity,
      );
      await dashboardPage.searchKey(caseConf.blog_info_edit.title);
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).first().click();
      await dashboardPage.page.waitForTimeout(3 * 1000); //wait for content visible
      await dashboardPage.waitForTranslationAfterEditContent(caseConf.blog_info_edit.title);

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
      expect(transformedData).toEqual(expect.arrayContaining(caseConf.blog_info_edit.expected_result_translation));

      //verify SF
      const translatedBlogDataSF = (
        await blogPage.getBlogDataOnSF(conf.caseConf.blog_info_edit.handle, caseConf.language_data.language_locale)
      ).result.blog_posts[0].blog;

      expect.soft(translatedBlogDataSF.title).toEqual(transformedData[0].target_value);
      expect(translatedBlogDataSF.meta_title).toEqual(transformedData[1].target_value);
      expect(translatedBlogDataSF.meta_description).toEqual(transformedData[2].target_value);
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
      // verify bản dịch trong dashboard
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
      const originalBlogDataSF = (
        await blogPage.getBlogDataOnSF(conf.caseConf.blog_info_edit.handle, conf.suiteConf.default_language_locale)
      ).result.blog_posts[0].blog;

      expect(originalBlogDataSF.title).toEqual(transformedData[0].source_value);

      const translatedBlogDataSF = (
        await blogPage.getBlogDataOnSF(conf.caseConf.blog_info_edit.handle, caseConf.language_data.language_locale)
      ).result.blog_posts[0].blog;

      expect.soft(translatedBlogDataSF.title).toEqual(transformedData[0].target_value);
      expect.soft(translatedBlogDataSF.meta_title).toEqual(transformedData[1].target_value);
      expect.soft(translatedBlogDataSF.meta_description).toEqual(transformedData[2].target_value);
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
      const translatedBlogDataSF = (
        await blogPage.getBlogDataOnSF(conf.caseConf.blog_info_edit.handle, caseConf.language_data.language_locale)
      ).result.blog_posts[0].blog;

      expect.soft(translatedBlogDataSF.title).toEqual(transformedData[0].target_value);
      expect(translatedBlogDataSF.meta_title).toEqual(transformedData[1].target_value);
      expect(translatedBlogDataSF.meta_description).toEqual(transformedData[2].target_value);
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

      await dashboardPage.searchKey(caseConf.blog_info_edit.title);
      await dashboardPage.page.locator(dashboardPage.xpathTD.searchBar.valueOptionOnDropdown).first().click();
      await dashboardPage.page.waitForTimeout(3 * 1000); //wait for content visible

      const data = await dashboardPage.getTranslationDetailData();
      for (let i = 0; i < data.length; i++) {
        expect.soft(data[i]).toEqual(
          expect.objectContaining({
            field: caseConf.delete_translation[i].field_name,
            destination: expect.objectContaining({
              value: caseConf.delete_translation[i].content,
            }),
          }),
        );
      }
      const transformedData = data.map(item => {
        return {
          source_value: item.source.value,
        };
      });

      //verify SF
      const translatedBlogDataSF = (
        await blogPage.getBlogDataOnSF(conf.caseConf.blog_info_edit.handle, caseConf.language_data.language_locale)
      ).result.blog_posts[0].blog;

      expect.soft(translatedBlogDataSF.title).toEqual(transformedData[0].source_value);
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
      expect(transformedData).toEqual(expect.arrayContaining(caseConf.blog_info_edit.expected_result_translation));

      //verify SF
      const translatedBlogDataSF = (
        await blogPage.getBlogDataOnSF(conf.caseConf.blog_info_edit.handle, caseConf.language_data.language_locale)
      ).result.blog_posts[0].blog;

      expect.soft(translatedBlogDataSF.title).toEqual(transformedData[0].target_value);
      expect(translatedBlogDataSF.meta_title).toEqual(transformedData[1].target_value);
      expect(translatedBlogDataSF.meta_description).toEqual(transformedData[2].target_value);
    });
  });
});
