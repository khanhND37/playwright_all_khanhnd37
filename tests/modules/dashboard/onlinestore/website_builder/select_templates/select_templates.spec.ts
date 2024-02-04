import { loadData } from "@core/conf/conf";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";
import { test, expect } from "@fixtures/website_builder";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { DigitalProductPage } from "@pages/dashboard/digital_product";
import { Website } from "@pages/dashboard/website";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";

test.describe("Select page template feature @SB_WEB_BUILDER_SPT", () => {
  let dProAPI: ProductAPI;
  const productIds = [];
  const webBaseTemplates = [];
  const webBasePagesIds = [];
  const webBaseOfferIds = [];
  const applyTemplateIds = [];
  const linkedTemplateIds = [];
  const dataDrivenIds = [];
  let websitePageId;
  let appliedTemplateId;
  let linkedLibraryId;
  let linkedLibraryTitle;
  let createLibrary;
  let createTemplate;
  let authConfig;
  test.beforeAll(async ({ authRequest, builder, conf }) => {
    authConfig = {
      domain: conf.suiteConf.linked_shop,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    };
    createLibrary = conf.suiteConf.libs_data;
    createTemplate = conf.suiteConf.create_template_data;
    dProAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    const libSp = conf.suiteConf.lib_sp;
    await test.step("Create library in shop01 to link", async () => {
      const libInfo = await builder.createLibrary(libSp, authConfig);
      linkedLibraryId = libInfo.id;
      linkedLibraryTitle = libInfo.title;
    });

    await test.step("Create template test with type = page, offer for linked library", async () => {
      for (const spTemplate of conf.suiteConf.lib_sp_templates) {
        const templateInfo = await builder.createTemplateInLib(
          {
            ...createTemplate,
            title: spTemplate.title,
            type: spTemplate.type,
            page: spTemplate.page,
            library_id: linkedLibraryId,
          },
          authConfig,
        );
        linkedTemplateIds.push(templateInfo.id);
      }
    });

    await test.step("Link library in shop02", async () => {
      await builder.createLibraryLinked(linkedLibraryId);
      await builder.updateLinkedLib(linkedLibraryId, { status: conf.suiteConf.change_lib_status.off });
    });

    await test.step("Create products test by API", async () => {
      for (let i = 0; i < conf.suiteConf.create_products_data.length; i++) {
        const createInfo = conf.suiteConf.create_products_data[i];
        const productInfo = await dProAPI.createProduct(createInfo);
        productIds.push(productInfo.data.product.id);
      }
    });

    await test.step("Get Web base templates", async () => {
      const libDetail = await builder.libraryDetail(conf.suiteConf.web_base_id);
      const templates = libDetail.pages;
      templates.forEach(({ title: title, type: type, id: id }) => {
        if (type === "product") {
          webBaseTemplates.push(title);
          applyTemplateIds.push(id);
        } else if (type === "page") {
          webBasePagesIds.push(id);
        } else {
          webBaseOfferIds.push(id);
        }
      });
    });

    await test.step("Create offer page and apply a template", async () => {
      await builder.createOfferInDPro({
        offer_type: conf.suiteConf.offer_type,
        target_ids: [productIds[2]],
        recommend_ids: [productIds[0]],
      });
      const offerInfo = await builder.getDProOffer(productIds[2]);
      const offerId = offerInfo[0].id;
      await builder.applyTemplate({
        productId: offerId,
        templateId: webBaseOfferIds[1],
        type: conf.suiteConf.types[1],
      });
    });

    await test.step("Create website page test and apply a template", async () => {
      const pageInfo = await builder.createWebsitePage(conf.suiteConf.website_page);
      websitePageId = pageInfo.id;
      await builder.applyTemplate({
        productId: websitePageId,
        templateId: webBasePagesIds[0],
        type: conf.suiteConf.types[2],
      });
    });

    await test.step("Apply template for product 1", async () => {
      const info = await builder.applyTemplate({
        templateId: applyTemplateIds[0],
        productId: productIds[0],
        type: conf.suiteConf.types[0],
      });
      appliedTemplateId = info.id;
    });

    await test.step("Group up ids for data driven case", async () => {
      dataDrivenIds.push(productIds[0]);
      dataDrivenIds.push(productIds[2]);
      dataDrivenIds.push(websitePageId);
    });
  });

  test.afterAll(async ({ builder }) => {
    await test.step("Delete products after test", async () => {
      for (let i = 0; i < productIds.length; i++) {
        await dProAPI.deleteProduct(productIds);
      }
    });

    await test.step("Delete library after test", async () => {
      const libInfo = await builder.listLibrary({ action: "all" });
      for (const lib of libInfo) {
        if (lib.id !== 1) {
          !lib.is_linked ? await builder.deleteLibrary(lib.id) : await builder.deleteLibraryLinked(lib.id);
        }
      }
      await builder.deleteLibrary(linkedLibraryId, authConfig);
    });
  });

  test("Check hiển thị các templates khi click Design sales page @SB_WEB_BUILDER_SPT_7", async ({
    dashboard,
    builder,
    conf,
  }) => {
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    const dPro = new DigitalProductPage(dashboard, conf.suiteConf.domain);
    const libSpt7Ids = [];
    const spt7TemplateIds = [];
    const lib1Spt7 = conf.caseConf.create_templates.spt_7_1;
    const lib2Spt7 = conf.caseConf.create_templates.spt_7_2;
    await test.step("Pre-Condition: Create Library test for SPT_7", async () => {
      const testLibs = conf.caseConf.create_libs;
      for (const lib of testLibs) {
        const libInfo = await builder.createLibrary({
          ...createLibrary,
          title: createLibrary.title.replace("{title}", lib.title),
          description: createLibrary.description.replace("{description}", lib.description),
        });
        libSpt7Ids.push(libInfo.id);
      }
    });

    await test.step("Pre-Condition: Create templates for SPT-7_1", async () => {
      for (const temp of lib1Spt7) {
        const tempInfo = await builder.createTemplateInLib({
          ...createTemplate,
          title: temp.title,
          library_id: libSpt7Ids[1],
          tags: temp.tags,
        });
        spt7TemplateIds.push(tempInfo.id);
      }
    });

    await test.step("Pre-Condition: Create templates for SPT-7_2", async () => {
      for (const temp of lib2Spt7) {
        await builder.createTemplateInLib({
          ...createTemplate,
          title: temp.title,
          library_id: libSpt7Ids[0],
          tags: temp.tags,
        });
      }
    });

    await test.step("Pre-Condition: Unpublish page template 2 in SPT-7_1", async () => {
      await builder.updateTemplate(spt7TemplateIds[1], conf.suiteConf.change_lib_status.off);
    });

    await test.step("Go to digital product 1", async () => {
      await dashboardPage.goto(`${conf.suiteConf.product_path}/${productIds[0]}`);
    });

    await test.step("Product 1 click on Design sales page button", async () => {
      await dPro.selectActionDPro(conf.suiteConf.option);
    });

    await test.step("Verify open web builder in shop 1", async () => {
      await expect(dashboard).toHaveURL(new RegExp(`${conf.caseConf.expected_path}/${appliedTemplateId}`));
    });

    await test.step("Go to digital product 2", async () => {
      await dashboardPage.goto(`${conf.suiteConf.product_path}/${productIds[1]}`);
    });

    await test.step("Click on Design sales page button", async () => {
      await dPro.selectActionDPro(conf.suiteConf.option);
    });

    const popupLoc = ".sb-choose-template";
    await test.step("Verify open Select From Templates popup", async () => {
      await expect(dashboard.locator(popupLoc)).toBeVisible();
    });

    const expectedTemplates = webBaseTemplates.concat(conf.caseConf.addition_libs);
    await test.step("Verify templates order in Select from templates", async () => {
      for (let i = 0; i < expectedTemplates.length; i++) {
        const templatesLoc = `.sb-choose-template__wrap >> nth =${i}`;
        await expect(dashboard.locator(templatesLoc)).toContainText(expectedTemplates[i]);
      }
    });

    await test.step("Verify tags", async () => {
      for (const expectedResult of conf.caseConf.expected_tags) {
        const tagsContainer = `.sb-choose-template__template:has-text('${expectedResult.template}') .sb-choose-template__tags`;
        for (const tag of expectedResult.tags) {
          await expect(dashboard.locator(tagsContainer)).toContainText(tag);
        }
      }
    });

    await test.step("Verify no page template 2 in Select from templates", async () => {
      const templatesContainerLoc = ".sb-choose-template__templates";
      await expect(dashboard.locator(templatesContainerLoc)).not.toContainText(conf.caseConf.unpublished_template);
    });

    await test.step("Inactive Library after test", async () => {
      for (const id of libSpt7Ids) {
        await builder.updateLibrary(id, { status: conf.suiteConf.change_lib_status.off });
      }
    });
  });

  test("Check search and sort template trên popup Select from templates @SB_WEB_BUILDER_SPT_8", async ({
    dashboard,
    builder,
    conf,
  }) => {
    let libSpt8Id;
    const db = new DashboardPage(dashboard, conf.suiteConf.domain);
    const webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    const dPro = new DigitalProductPage(dashboard, conf.suiteConf.domain);
    const spt8 = conf.caseConf.create_lib;
    await test.step("Pre-Condition: Create test Library SPT_8", async () => {
      const libInfo = await builder.createLibrary({
        ...createLibrary,
        title: createLibrary.title.replace("{title}", spt8.title),
        description: createLibrary.description.replace("{description}", spt8.description),
      });
      libSpt8Id = libInfo.id;
    });

    await test.step("Pre-Condition: Create template for SPT-8", async () => {
      for (const temp of conf.caseConf.create_templates) {
        await builder.createTemplateInLib({
          ...createTemplate,
          title: temp.title,
          library_id: libSpt8Id,
          tags: temp.tags,
        });
      }
    });

    await test.step("Go to digital product test 2", async () => {
      await db.goto(`${conf.suiteConf.product_path}/${productIds[1]}`);
    });

    await test.step("Open Select from templates popup", async () => {
      await dPro.selectActionDPro(conf.suiteConf.option);
    });

    const searchData = conf.caseConf.search_data;
    await test.step("Enter more than 255 characters", async () => {
      await webBuilder.searchForTemplates(searchData.max_char.search_text);
    });

    const actualSearchResultLoc = ".sb-choose-template__body";
    await test.step("Verify search data", async () => {
      await expect(dashboard.locator(actualSearchResultLoc)).toContainText(searchData.max_char.expected);
    });

    await test.step("Clear key search", async () => {
      await webBuilder.searchForTemplates(searchData.clear_search);
    });

    const expectedTemplates = webBaseTemplates.concat(conf.caseConf.addition_libs);
    await test.step("Verify templates order in Select from templates", async () => {
      for (let i = 0; i < expectedTemplates.length; i++) {
        const templatesLoc = `.sb-choose-template__template >> nth =${i}`;
        await expect(dashboard.locator(templatesLoc)).toContainText(expectedTemplates[i]);
      }
    });

    await test.step("Search with special characters", async () => {
      await webBuilder.searchForTemplates(searchData.special_char.search_text);
    });

    await test.step("Verify search results", async () => {
      await expect(dashboard.locator(actualSearchResultLoc)).toContainText(
        searchData.special_char.expected[0] && searchData.special_char.expected[1],
      );
    });

    await test.step("Search with Vietnamese characters", async () => {
      await webBuilder.searchForTemplates(searchData.vn_char.search_text);
    });

    await test.step("Verify search results", async () => {
      await expect(dashboard.locator(actualSearchResultLoc)).toContainText(
        searchData.vn_char.expected[0] && searchData.vn_char.expected[1],
      );
    });

    await test.step("Search with partially matched template name or tag", async () => {
      await webBuilder.searchForTemplates(searchData.partially_match.search_text);
    });

    await test.step("Verify search results", async () => {
      await expect(dashboard.locator(actualSearchResultLoc)).toContainText(searchData.partially_match.expected);
    });

    await test.step("Inactive Library SPT_8 after test", async () => {
      await builder.updateLibrary(libSpt8Id, { status: conf.suiteConf.change_lib_status.off });
    });
  });

  test("Check filter template theo library trên popup Select from templates @SB_WEB_BUILDER_SPT_9", async ({
    dashboard,
    builder,
    conf,
  }) => {
    const defaultLibs = ["All libraries"];
    const extraLibs = [];
    const db = new DashboardPage(dashboard, conf.suiteConf.domain);
    const dPro = new DigitalProductPage(dashboard, conf.suiteConf.domain);
    const webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    const themes = new Website(dashboard, conf.suiteConf.domain);
    await test.step("Pre-condition: Active all libraries", async () => {
      await builder.updateLinkedLib(linkedLibraryId, { status: conf.suiteConf.change_lib_status.on });
    });

    await test.step("Pre-condition: Create libraries to get more than 20", async () => {
      await db.goto("/admin/themes");
      for (let i = 0; i < conf.caseConf.library_length; i++) {
        await themes.createLibrary(`SPT 9 #${i}`);
        await dashboard.waitForTimeout(1000); //Tạo chậm để lấy đúng thứ tự library trong filter
      }
    });

    await test.step("Go to digital product 2", async () => {
      await db.goto(`${conf.suiteConf.product_path}/${productIds[1]}`);
    });

    await test.step("Click Design sales page", async () => {
      await dPro.selectActionDPro(conf.suiteConf.option);
    });

    await test.step("Get list library filter default", async () => {
      const libInfo = await builder.listLibrary(conf.caseConf.libraries_page_1);
      for (const lib of libInfo) {
        defaultLibs.push(lib.title);
      }
    });

    await test.step("Open Library filter", async () => {
      await webBuilder.openFilters(conf.caseConf.filter_library);
    });

    const allLibrariesChecked = webBuilder
      .genLoc(".sb-choose-template-filter__library:has-text('All libraries') img")
      .isVisible();
    await test.step("Verify default Library filters", async () => {
      expect(allLibrariesChecked).toBeTruthy();
      for (let i = 0; i < defaultLibs.length; i++) {
        const libFilter = webBuilder.genLoc(`//div[contains(@class,'filter__library')][${i + 1}]`);
        await expect(libFilter).toHaveText(defaultLibs[i]);
      }
    });

    await test.step("Get list extra library", async () => {
      const libInfo = await builder.listLibrary(conf.caseConf.libraries_page_2);
      for (const lib of libInfo) {
        extraLibs.push(lib.title);
      }
    });

    const libFiltersContainer = webBuilder.genLoc(".sb-choose-template-filter >> nth=1");
    const extraLibEle = webBuilder.genLoc(`//div[normalize-space()='${extraLibs[0]}']`);
    await test.step("Scroll libraries filters to load more", async () => {
      await scrollUntilElementIsVisible({
        page: dashboard,
        scrollEle: libFiltersContainer,
        viewEle: extraLibEle,
      });
    });

    await test.step("Verify all extra libraries loaded ", async () => {
      for (let i = 0; i < extraLibs.length; i++) {
        const libFilter = webBuilder.genLoc(`//div[contains(@class,'filter__library')][${defaultLibs.length + i + 1}]`);
        await expect(libFilter).toHaveText(extraLibs[i]);
      }
    });

    await test.step("Select filters Web Base", async () => {
      await webBuilder.selectFilters(conf.caseConf.filter_data);
    });

    await test.step("Verify templates order in Select from templates", async () => {
      for (let i = 0; i < webBaseTemplates.length; i++) {
        const templatesLoc = `.sb-choose-template__wrap >> nth =${i}`;
        await expect(dashboard.locator(templatesLoc)).toContainText(webBaseTemplates[i]);
      }
    });

    await test.step("Select other library filter", async () => {
      await webBuilder.selectFilters({ library: linkedLibraryTitle });
    });

    const currentLibFilter = webBuilder.genLoc("button.sb-choose-template__library-btn");
    await test.step("Verify current filter", async () => {
      await expect(currentLibFilter).toHaveText(linkedLibraryTitle);
    });

    const actualFilterResult = webBuilder.genLoc(".sb-choose-template__body");
    await test.step("Verify filter results", async () => {
      await expect(actualFilterResult).toContainText(conf.caseConf.expected.filter_result);
    });
  });

  test("Check filter template theo tag trên popup Select from templates @SB_WEB_BUILDER_SPT_10", async ({
    dashboard,
    builder,
    conf,
  }) => {
    let spt10Id: number;
    const selectedTags = conf.caseConf.expected.selected_tags;
    const tagsAfterRemove = conf.caseConf.expected.tags_after_remove;
    const webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    const db = new DashboardPage(dashboard, conf.suiteConf.domain);
    const dPro = new DigitalProductPage(dashboard, conf.suiteConf.domain);
    await test.step("Pre-condition: Create library test SPT-10", async () => {
      const libInfo = await builder.createLibrary(conf.caseConf.create_lib);
      spt10Id = libInfo.id;
    });

    await test.step("Pre-condition: Create template ", async () => {
      for (const template of conf.caseConf.spt_10_templates) {
        await builder.createTemplateInLib({
          ...createTemplate,
          title: template.title,
          library_id: spt10Id,
          tags: template.tags,
        });
      }
    });

    await test.step("Go to digital product", async () => {
      await db.goto(`${conf.suiteConf.product_path}/${productIds[1]}`);
    });

    await test.step("Click Design sales page", async () => {
      await dPro.selectActionDPro(conf.suiteConf.option);
    });

    await test.step("Open tag filter", async () => {
      await webBuilder.openFilters(conf.caseConf.tag_filter);
    });

    const defaultTags = await builder.listTag(conf.caseConf.tags_page_1);
    await test.step("Verify default tags", async () => {
      for (let i = 0; i < defaultTags.length; i++) {
        const tagFilter = webBuilder.genLoc(`//label[contains(@class,'filter__tag')][${i + 1}]`);
        await expect(tagFilter).toHaveText(defaultTags[i]);
      }
    });

    const extraTags = await builder.listTag(conf.caseConf.tags_page_2);
    const loadMoreTag = webBuilder.genLoc(
      `//label[contains(@class,'filter__tag') and normalize-space()='${extraTags[0]}']`,
    );
    const tagScrollBar = webBuilder.genLoc("//div[contains(@class,'choose-template-filter__tags')]/parent::div");
    await test.step("Scroll drawer to load more tags", async () => {
      await scrollUntilElementIsVisible({ page: dashboard, scrollEle: tagScrollBar, viewEle: loadMoreTag });
    });

    await test.step("Verify extra tags", async () => {
      for (let i = 0; i < extraTags.length; i++) {
        const tagFilter = webBuilder.genLoc(`//label[contains(@class,'filter__tag')][${defaultTags.length + i + 1}]`);
        await expect(tagFilter).toHaveText(extraTags[i]);
      }
    });

    await test.step("Choose tag 1", async () => {
      await webBuilder.selectFilters(conf.caseConf.select_tags);
    });

    const templateLoc = `//div[contains(@class,'template__wrap')]`;
    const tagSelected = webBuilder.genLoc("//span[normalize-space()='Tag:']/parent::div");
    const tagCheckBox = webBuilder.genLoc(
      `//label[contains(@class,'filter__tag') and normalize-space()='${conf.caseConf.select_tags.tags[0]}']//span[@class='sb-check']`,
    );
    await test.step("Verify filter by tag success", async () => {
      const templatesCount = await dashboard.locator(templateLoc).count();
      await expect(tagSelected).toContainText(selectedTags[0]);
      for (let i = 0; i < templatesCount; i++) {
        const templateContainer = webBuilder.genLoc(`${templateLoc}[${i + 1}]`);
        await expect(templateContainer).toContainText(selectedTags[0]);
      }
      await webBuilder.openFilters(conf.caseConf.tag_filter);
      await expect(tagCheckBox).toBeChecked();
    });

    const searchTags = webBuilder.genLoc("(//div[contains(@class,'filter__input')])[2]//input");
    await test.step("Search and select tag filter", async () => {
      await searchTags.fill(conf.caseConf.search_tag);
    });

    const listTagsTest = await builder.listTag(conf.caseConf.search_tags_test);
    await test.step("Verify tags display", async () => {
      for (let i = 0; i < listTagsTest.length; i++) {
        const tagFilter = webBuilder.genLoc(`//label[contains(@class,'filter__tag')][${i + 1}]`);
        await expect(tagFilter).toContainText(listTagsTest[i]);
      }
    });

    await test.step("Select tag test 2 and test 3", async () => {
      await webBuilder.selectFilters(conf.caseConf.select_more_tags);
    });

    await test.step("Verify tags filter success", async () => {
      const templatesCount = await dashboard.locator(templateLoc).count();
      for (let i = 0; i < templatesCount; i++) {
        const templateContainer = await webBuilder.genLoc(`(${templateLoc})[${i + 1}]`);
        await expect(tagSelected).toContainText(selectedTags[i]);
        const expectedTags = `${selectedTags[0]}|${selectedTags[1]}|${selectedTags[2]}`;
        await expect(templateContainer).toHaveText(new RegExp(expectedTags));
      }
      await webBuilder.openFilters(conf.caseConf.tag_filter);
      await searchTags.fill(conf.caseConf.remove_searched_tag);
      for (const tag of selectedTags) {
        const tagCheckBox = webBuilder.genLoc(
          `//label[contains(@class,'filter__tag') and normalize-space()='${tag}']//span[@class='sb-check']`,
        );

        if (tagCheckBox.isHidden()) {
          await scrollUntilElementIsVisible({
            page: dashboard,
            scrollEle: tagScrollBar,
            viewEle: tagCheckBox,
          });
        }

        await expect(tagCheckBox).toBeChecked();
      }
    });

    await test.step("Remove filter test 2", async () => {
      await webBuilder.selectFilters(conf.caseConf.remove_tag);
    });

    await test.step("Verify tags filter success", async () => {
      const templatesCount = await dashboard.locator(templateLoc).count();
      for (let i = 0; i < templatesCount; i++) {
        const templateContainer = await webBuilder.genLoc(`(${templateLoc})[${i + 1}]`);
        await expect(tagSelected).toContainText(tagsAfterRemove[i]);
        const expectedTags = `${tagsAfterRemove[0]}|${tagsAfterRemove[1]}`;
        await expect(templateContainer).toHaveText(new RegExp(expectedTags));
      }
      await webBuilder.openFilters(conf.caseConf.tag_filter);
      for (const tag of tagsAfterRemove) {
        const tagCheckBox = webBuilder.genLoc(
          `//label[contains(@class,'filter__tag') and normalize-space()='${tag}']//span[@class='sb-check']`,
        );

        if (tagCheckBox.isHidden()) {
          await scrollUntilElementIsVisible({
            page: dashboard,
            scrollEle: tagScrollBar,
            viewEle: tagCheckBox,
          });
        }

        await expect(tagCheckBox).toBeChecked();
      }
    });

    await test.step("Inactive test Library", async () => {
      await builder.updateLibrary(spt10Id, { status: conf.suiteConf.change_lib_status.off });
    });
  });

  test("Check kết hợp search và filter các template @SB_WEB_BUILDER_SPT_11", async ({ dashboard, builder, conf }) => {
    const spt11Ids = [];
    const webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    const db = new DashboardPage(dashboard, conf.suiteConf.domain);
    const dPro = new DigitalProductPage(dashboard, conf.suiteConf.domain);
    const drivenCases = conf.caseConf.driven_cases;
    await test.step("Pre-condition: create test libraries", async () => {
      for (const lib of conf.caseConf.create_libs) {
        const libInfo = await builder.createLibrary({
          ...createLibrary,
          title: lib.title,
          description: lib.description,
        });
        spt11Ids.push(libInfo.id);
      }
    });

    await test.step("Pre-condition: Create template for libraries", async () => {
      const spt11Libs = conf.caseConf.create_templates;
      for (const template of spt11Libs.spt_11_1) {
        await builder.createTemplateInLib({
          ...createTemplate,
          title: template.title,
          library_id: spt11Ids[0],
          tags: template.tags,
        });
      }

      for (const template of spt11Libs.spt_11_2) {
        await builder.createTemplateInLib({
          ...createTemplate,
          title: template.title,
          library_id: spt11Ids[1],
          tags: template.tags,
        });
      }

      await builder.createTemplateInLib({
        ...createTemplate,
        title: spt11Libs.spt_11_3.title,
        library_id: spt11Ids[2],
      });
    });

    await test.step("Go to digital product 2", async () => {
      await db.goto(`${conf.suiteConf.product_path}/${productIds[1]}`);
    });

    await test.step("Click Design sales page", async () => {
      await dPro.selectActionDPro(conf.suiteConf.option);
    });

    for (const combineData of drivenCases.have_results) {
      await test.step("Enter key search and filters", async () => {
        await webBuilder.searchForTemplates(combineData.key_search);
        await webBuilder.selectFilters(combineData.filters);
      });

      await test.step("Verify search results", async () => {
        for (let i = 0; i < combineData.expected_result.length; i++) {
          const templateContainer = webBuilder.genLoc(`(//div[contains(@class,'template__wrap')])[${i + 1}]`);
          await expect(templateContainer).toContainText(combineData.expected_result[i]);
        }
      });

      await test.step("Remove all applied tags", async () => {
        await webBuilder.removeAllTags();
      });
    }

    for (const combineData of drivenCases.no_result) {
      await test.step("Enter key search and filters", async () => {
        await webBuilder.searchForTemplates(combineData.key_search);
        await webBuilder.selectFilters(combineData.filters);
      });

      await test.step("Verify search results", async () => {
        const templateContainer = webBuilder.genLoc("//div[contains(@class,'template__body')]");
        await expect(templateContainer).toContainText(combineData.expected_result);
      });

      await test.step("Remove all applied tags", async () => {
        await webBuilder.removeAllTags();
      });
    }

    await test.step("Inactive libraries after test", async () => {
      for (let i = 0; i < spt11Ids.length; i++) {
        await builder.updateLibrary(spt11Ids[i], { status: conf.suiteConf.change_lib_status.off });
      }
    });
  });

  test("Check preview, apply template @SB_WEB_BUILDER_SPT_21", async ({ dashboard, conf }) => {
    const dPro = new DigitalProductPage(dashboard, conf.suiteConf.domain);
    const webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    const unpublishedIndex = conf.caseConf.product_index.unpublished;
    const publishedIndex = conf.caseConf.product_index.published;
    const randomTemplate = webBuilder.genLoc(`//p[@title='${webBaseTemplates[0]}']/preceding-sibling::figure`);
    const previewBtn = webBuilder.genLoc(`//p[@title='${webBaseTemplates[0]}']/preceding-sibling::figure//a`);
    const applyBtn = webBuilder.genLoc(`//p[@title='${webBaseTemplates[0]}']/preceding-sibling::figure//button`);
    const templatePreviewName = webBuilder.genLoc("//div[contains(@class,'template-preview__header-center')]");
    const applyThisTemplateBtn = webBuilder.genLoc("//button[normalize-space()='Apply this template']");
    const desktopView = webBuilder.genLoc(
      "//div[contains(@class,'preview__header-right')]//*[local-name()='g' and @id='Icons/Devices/Desktop']",
    );
    const mobileView = webBuilder.genLoc(
      "//div[contains(@class,'preview__header-right')]//*[local-name()='g' and @id='Icons/Devices/Mobile']",
    );
    const backBtn = webBuilder.genLoc("//a[normalize-space()='Back to templates']");
    const toastMessage = webBuilder.genLoc("//div[contains(@class,'toast')]");
    const previewWebBuilder = dashboard.frameLocator("#preview").locator("#app");
    await test.step("Open select from templates popup of unpublished product", async () => {
      await dashboard.goto(
        `https://${conf.suiteConf.domain}/${conf.suiteConf.product_path}/${productIds[unpublishedIndex]}`,
      );
      await dPro.selectActionDPro(conf.suiteConf.option);
    });

    await test.step("Hover on a template", async () => {
      await randomTemplate.hover();
    });

    await test.step("Verify that Preview and Apply buttons appear", async () => {
      await expect(previewBtn && applyBtn).toBeVisible();
    });

    await test.step("Preview the template", async () => {
      await webBuilder.interactWithTemplate("Preview", webBaseTemplates[0]);
    });

    await test.step("Verify preview popup appears", async () => {
      await expect(templatePreviewName).toHaveText(webBaseTemplates[0]);
      await expect(backBtn && desktopView && mobileView && applyThisTemplateBtn).toBeVisible();
    });

    await test.step("Click Apply this template in preview popup", async () => {
      await applyThisTemplateBtn.click();
    });

    await test.step("Verify apply success and direct to web builder", async () => {
      await expect(toastMessage).toHaveText(conf.caseConf.expected.apply_message);
      await expect(previewWebBuilder).toBeVisible();
    });

    await test.step("Open select from templates popup of published product", async () => {
      await dashboard.goto(
        `https://${conf.suiteConf.domain}/${conf.suiteConf.product_path}/${productIds[publishedIndex]}`,
      );
      await dPro.selectActionDPro(conf.suiteConf.option);
    });

    await test.step("Hover on a template", async () => {
      await randomTemplate.hover();
    });

    await test.step("Verify that Preview and Apply buttons appear", async () => {
      await expect(previewBtn && applyBtn).toBeVisible();
    });

    await test.step("Preview the template", async () => {
      await webBuilder.interactWithTemplate("Preview", webBaseTemplates[0]);
    });

    await test.step("Verify preview popup appears", async () => {
      await expect(templatePreviewName).toHaveText(webBaseTemplates[0]);
      await expect(backBtn && desktopView && mobileView && applyThisTemplateBtn).toBeVisible();
    });

    await test.step("Click Back to template in preview popup", async () => {
      await backBtn.click();
    });

    await test.step("Verify back to select from templates popup", async () => {
      await expect(webBuilder.genLoc("#sb-choose-template__header")).toBeVisible();
    });

    await test.step("Apply template", async () => {
      await webBuilder.interactWithTemplate("Apply", webBaseTemplates[1]);
    });

    await test.step("Verify apply success and direct to web builder", async () => {
      await expect(toastMessage).toHaveText(conf.caseConf.expected.apply_message);
      await expect(previewWebBuilder).toBeVisible();
    });
  });

  const caseName = "SB_SWITCH_TEMPLATE";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach((data, i: number) => {
    test(`Check switch template với type = ${data.type} @${data.case}`, async ({ dashboard, builder }) => {
      const webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
      const webBuilderSFPreview = dashboard.frameLocator("#preview").locator("#app");
      const templatesBtn = webBuilder.genLoc("//button[contains(@class,'header-template-btn')]");
      const templatesTooltip = webBuilder.genLoc(" //div[@role='tooltip' and normalize-space()='Change template']");
      const templatesPopup = webBuilder.genLoc("#sb-choose-template__header");
      const firstTemplate = webBuilder.genLoc("(//div[contains(@class,'template__wrap')])[1]");
      const randomTemplate = webBuilder.genLoc(`(//div[contains(@class,'template__wrap')])[2]`);
      const previewBtn = webBuilder.genLoc(`(//div[contains(@class,'template__wrap')])[2]/figure//a`);
      const popupConfirm = webBuilder.genLoc("//div[contains(@class,'popup__container')]");
      const confirmCancelBtn = webBuilder.genLoc(
        "//div[contains(@class,'popup__container')]//button[normalize-space()='Cancel']",
      );
      const confirmApplyBtn = webBuilder.genLoc(
        "//div[contains(@class,'popup__container')]//button[normalize-space()='Apply']",
      );
      const backBtn = webBuilder.genLoc("//a[normalize-space()='Back to templates']");
      const previewTitle = webBuilder.genLoc("//div[contains(@class,'preview__header-center')]");
      const toggleDesktopBtn = webBuilder.genLoc(
        "//div[contains(@class,'preview__header-right')]//*[local-name()='g' and @id='Icons/Devices/Desktop']",
      );
      const toggleMobileBtn = webBuilder.genLoc(
        "//div[contains(@class,'preview__header-right')]//*[local-name()='g' and @id='Icons/Devices/Mobile']",
      );
      const toastMessage = webBuilder.genLoc("//div[contains(@class,'toast__message')]");
      await test.step("Active Linked library spt-sp", async () => {
        await builder.updateLinkedLib(linkedLibraryId, { status: conf.suiteConf.change_lib_status.on });
      });

      await test.step(`Open web builder type = ${data.type}`, async () => {
        await webBuilder.openWebBuilder({ type: data.type, id: dataDrivenIds[i] });
      });

      await test.step("Hover on Templates in web builder", async () => {
        await templatesBtn.hover();
      });

      await test.step("Verify tooltip", async () => {
        await expect(templatesTooltip).toBeVisible();
      });

      await test.step("Click on Templates", async () => {
        await webBuilder.clickBtnNavigationBar(conf.caseConf.button);
      });

      await test.step("Verify select from templates popup appear", async () => {
        await expect(templatesPopup).toBeVisible();
      });

      await test.step("Verify current template in position 1", async () => {
        const currentTitle = await webBuilder.genLoc("//span[@class='sb-text-body-emphasis']").innerText();
        await expect(firstTemplate).toContainText(conf.caseConf.expected.current && currentTitle);
      });

      const randomTemplateTitle = await webBuilder
        .genLoc("(//div[contains(@class,'template__wrap')])[2]//p")
        .innerText();
      await test.step("Hover on a template", async () => {
        await randomTemplate.hover();
      });

      await test.step("Preview the template", async () => {
        await previewBtn.click();
      });

      await test.step("Verify preview templates appears", async () => {
        await expect(backBtn && toggleDesktopBtn && toggleMobileBtn).toBeVisible();
        await expect(previewTitle).toHaveText(randomTemplateTitle);
      });

      await test.step("Apply template in preview screen", async () => {
        await webBuilder.actionInPreviewTemplate("Apply");
      });

      await test.step("Verify Popup confirm appears", async () => {
        await expect(popupConfirm).toBeVisible();
      });

      await test.step("Confirm cancel template", async () => {
        await confirmCancelBtn.click();
      });

      await test.step("Verify close the popup, nothing changes", async () => {
        await expect(popupConfirm && toastMessage).toBeHidden();
      });

      await test.step("Apply a template", async () => {
        await webBuilder.actionInPreviewTemplate("Apply");
      });

      await test.step("Confirm apply template", async () => {
        await confirmApplyBtn.click();
      });

      await test.step("Verify change template success", async () => {
        await expect(toastMessage).toContainText(conf.caseConf.expected.apply_message);
        await expect(webBuilderSFPreview).toBeVisible();
        await webBuilder.clickBtnNavigationBar(conf.caseConf.button);
        const currentTitle = await webBuilder.genLoc("//span[@class='sb-text-body-emphasis']").innerText();
        expect(currentTitle).toContain(randomTemplateTitle);
        await expect(firstTemplate).toContainText(conf.caseConf.expected.current && currentTitle);
      });

      const otherTemplateTitle = await webBuilder
        .genLoc("(//div[contains(@class,'template__wrap')])[3]//p")
        .innerText();
      await test.step("Click Apply on a template", async () => {
        await webBuilder.interactWithTemplate("Apply", otherTemplateTitle);
      });

      await test.step("Verify Popup confirm appears", async () => {
        await expect(popupConfirm).toBeVisible();
      });

      await test.step("Confirm cancel template", async () => {
        await confirmCancelBtn.click();
      });

      await test.step("Verify close the popup, nothing changes", async () => {
        await expect(popupConfirm && toastMessage).toBeHidden();
      });

      await test.step("Apply a template", async () => {
        await webBuilder.interactWithTemplate("Apply", otherTemplateTitle);
      });

      await test.step("Confirm apply template", async () => {
        await confirmApplyBtn.click();
      });

      await test.step("Verify change template success", async () => {
        await expect(toastMessage).toContainText(conf.caseConf.expected.apply_message);
        await expect(webBuilderSFPreview).toBeVisible();
        await webBuilder.clickBtnNavigationBar(conf.caseConf.button);
        const currentTitle = await webBuilder.genLoc("//span[@class='sb-text-body-emphasis']").innerText();
        expect(currentTitle).toBe(otherTemplateTitle);
        await expect(firstTemplate).toContainText(conf.caseConf.expected.current && currentTitle);
      });
    });
  });
});
