import { expect, test } from "@fixtures/website_builder";
import { snapshotDir } from "@utils/theme";
import { WebBuilderAPI } from "@pages/dashboard/web_builder_api";
import { WBCustomProductPage } from "@pages/dashboard/wb_custom_page_template";
import { SBPage } from "@pages/page";
import { ProductAPI } from "@pages/api/product";
import { ClickType, WebBuilder } from "@pages/dashboard/web_builder";

let webBuilderAPI: WebBuilderAPI;
let pomWB: WBCustomProductPage;
let sbPage: SBPage;
let caseConf, suiteConf, domain, theme, design;
let productAPI: ProductAPI;
let webBuilder: WebBuilder;
let iconBlockId, headingBlockId;

test.describe("Verify Custom Layout Product Page @SB_NEWECOM_NEP", () => {
  test.beforeAll(async ({ authRequest, conf }) => {
    webBuilderAPI = new WebBuilderAPI(conf.suiteConf.domain, authRequest);
  });

  test.beforeEach(async ({ conf, dashboard, authRequest }, testInfo) => {
    caseConf = conf.caseConf;
    suiteConf = conf.suiteConf;
    domain = suiteConf.domain;
    theme = suiteConf.theme_id;
    design = suiteConf.deleted_template.title;
    sbPage = new SBPage(dashboard, conf.suiteConf.domain);
    productAPI = new ProductAPI(domain, authRequest);
    webBuilder = new WebBuilder(dashboard, suiteConf.domain);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    pomWB = new WBCustomProductPage(dashboard, conf.suiteConf.domain);
    let ids = [];

    await test.step(`Pre-condition: Set up page design of product to Default to run case 105 and 106`, async () => {
      await productAPI.updateProduct(suiteConf.update_product);
    });

    await test.step("Before each 1: Rename template for case 113", async () => {
      const renamedTemplate = conf.suiteConf.renamed_template;
      await webBuilderAPI.renameProductTemplate(renamedTemplate.id, { title: renamedTemplate.title });
    });

    await test.step("Pre-condition: Delete template existed for case 111 and 114", async () => {
      const templates = await webBuilderAPI.getListTemplate({
        page: 1,
        type: "theme",
        entity_ids: suiteConf.theme_id,
        page_handle: "product",
        is_included_custom_page: true,
      });

      const deletedTemplate = templates.result.pages.filter(template => {
        return template.title === design[0] || template.title === design[1] || template.title === design[2];
      });

      ids = deletedTemplate.map(deletedTemplate => deletedTemplate.id);
      if (ids.length !== 0) {
        for (let i = 0; i < design.length; i++) {
          await webBuilderAPI.deleteProductTemplate(ids[i]);
        }
      }
    });
  });

  test.afterEach(async ({ dashboard }) => {
    if (iconBlockId && headingBlockId) {
      const blockId = iconBlockId;
      const headingId = headingBlockId;
      iconBlockId = 0;
      headingBlockId = 0;
      await dashboard.goto(
        pomWB.xpathToWBProductByCustomTemplate(suiteConf.domain, suiteConf.theme_id, suiteConf.edited_template.id),
      );
      await dashboard.waitForSelector(pomWB.blocks.xpathPreviewLoadingScreen);
      await dashboard.waitForSelector(pomWB.blocks.xpathPreviewLoadingScreen, { state: "hidden" });
      await dashboard.locator(pomWB.xpathToWBProgressBar).waitFor({ state: "detached" });
      await webBuilder.getElementById(blockId, ClickType.BLOCK).click();
      await webBuilder.selectOptionOnQuickBar("Delete");
      await webBuilder.getElementById(headingId, ClickType.BLOCK).click();
      await webBuilder.selectOptionOnQuickBar("Delete");
      await dashboard.locator(webBuilder.xpathButtonSave).click();
      await webBuilder.toastMessage.waitFor({ state: "visible" });
    }
  });

  test(`@SB_NEWECOM_NEP_106 - [Custom Layout Product Page]Product Admin_Check search custom design`, async ({
    dashboard,
  }) => {
    await test.step(`Truy cập {domain}/admin/product -> Click product 1`, async () => {
      await pomWB.gotoDBProductPage(domain);
      await dashboard.locator(pomWB.xpathToDBFirstProduct).click();
      await expect(dashboard.locator(pomWB.xpathToDBSTagTemplate)).toHaveText(caseConf.default_template);
    });

    await test.step(`Click vào select Custom design`, async () => {
      await dashboard.locator(pomWB.xpathToDBSTagTemplateButton).click();
      await dashboard.locator(pomWB.xpathToDBInputTemplate).click();
      const templateList = await pomWB.convertToTextArray(await dashboard.$$(pomWB.xpathToDBSelectTemplateOptions));
      expect(templateList.sort().toString().replace(/\s/g, "")).toEqual(
        caseConf.list_custom_design_title.sort().toString().replace(/\s/g, ""),
      );
    });

    await test.step(`Nhập data search không tồn tại`, async () => {
      await dashboard.locator(pomWB.xpathToDBInputTemplate).fill(caseConf.sample_input.unListed);
      await sbPage.waitResponseWithUrl(caseConf.search_url);
      await expect(dashboard.locator(pomWB.xpathToDBSelectTemplateOptions).first()).toBeHidden();
    });

    for await (const step of caseConf.similar_step) {
      await test.step(step.title, async () => {
        await dashboard.locator(pomWB.xpathToDBInputTemplate).fill(caseConf.sample_input[step.input]);
        await sbPage.waitResponseWithUrl(caseConf.search_url);
        const templateList = await pomWB.convertToTextArray(await dashboard.$$(pomWB.xpathToDBSelectTemplateOptions));
        expect(templateList.sort().toString().replace(/\s/g, "")).toEqual(
          caseConf[step.list_to_compare].sort().toString().replace(/\s/g, ""),
        );
      });
    }
  });

  test(`@SB_NEWECOM_NEP_109 - [Custom Layout Product Page]Webbuilder_Check search custom design`, async ({
    dashboard,
  }) => {
    await test.step(`Click vào Page name`, async () => {
      await pomWB.gotoWBProductPage(domain, theme);
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await expect(dashboard.locator(pomWB.xpathToTemplateSelectPopover)).toBeVisible();
      const templateList = await pomWB.convertToTextArray(await dashboard.$$(pomWB.xpathTemplateOption));
      expect(templateList.sort().toString().replace(/\s/g, "")).toEqual(
        caseConf.list_custom_design_title.sort().toString().replace(/\s/g, ""),
      );
      await expect(dashboard.getByText(caseConf.create_new_design)).toBeVisible();
    });

    await test.step(`Nhập data search không tồn tại`, async () => {
      await dashboard.locator(pomWB.xpathToWBInputTemplate).fill(caseConf.sample_input.unListed);
      await expect(dashboard.getByText(caseConf.not_found)).toBeVisible();
    });

    for await (const step of caseConf.similar_step) {
      await test.step(step.title, async () => {
        await dashboard.locator(pomWB.xpathToWBInputTemplate).fill(caseConf.sample_input[step.input]);
        await sbPage.waitResponseWithUrl(caseConf.search_url);
        const templateList = await pomWB.convertToTextArray(await dashboard.$$(pomWB.xpathTemplateOption));
        expect(templateList.sort().toString().replace(/\s/g, "")).toEqual(
          caseConf[step.list_to_compare].sort().toString().replace(/\s/g, ""),
        );
      });
    }
  });

  test(`@SB_NEWECOM_NEP_110 [Custom Layout Product Page]Webbuilder_Create custom design_Check create new design không thành công`, async ({
    dashboard,
  }) => {
    await test.step(`Click vào Page name`, async () => {
      await pomWB.gotoWBProductPage(domain, theme);
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await expect(dashboard.locator(pomWB.xpathToTemplateSelectPopover)).toBeVisible();
      const templateList = await pomWB.convertToTextArray(await dashboard.$$(pomWB.xpathTemplateOption));
      expect(templateList.sort().toString().replace(/\s/g, "")).toEqual(
        caseConf.list_custom_design_title.sort().toString().replace(/\s/g, ""),
      );
      await expect(dashboard.getByText(caseConf.create_new_design)).toBeVisible();
    });

    await test.step(`Click vào Create new design 1`, async () => {
      await dashboard.getByText(caseConf.create_new_design).click();
    });

    await test.step(`Chọn 1 template bất kì -> Click button Apply 1`, async () => {
      await dashboard.locator(pomWB.xpathToFigureTemplate).hover();
      await dashboard.locator(pomWB.xpathToFigureApplyButton).click();
      await expect(dashboard.locator(pomWB.xpathToDBPopupChooseTemplate).first()).toBeVisible();
      await expect(dashboard.getByText(caseConf.popup_heading)).toBeVisible();
    });

    await test.step(`Click Cancel`, async () => {
      await dashboard.locator(pomWB.xpathToDBPopupCancelButton).click();
      await expect(dashboard.locator(pomWB.xpathToPopupChooseTemplate)).toBeHidden();
    });

    await test.step(`Click vào Create new design 2`, async () => {
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await dashboard.getByText(caseConf.create_new_design).click();
    });

    await test.step(`Chọn 1 template bất kì -> Click button Apply 2`, async () => {
      await dashboard.locator(pomWB.xpathToFigureTemplate).hover();
      await dashboard.locator(pomWB.xpathToFigureApplyButton).click();
      await expect(dashboard.locator(pomWB.xpathToDBPopupChooseTemplate).first()).toBeVisible();
      await expect(dashboard.getByText(caseConf.popup_heading)).toBeVisible();
    });

    await test.step(`Click icon close popup`, async () => {
      await dashboard.locator(pomWB.xpathToDBPopupCloseButton).click();
      await expect(dashboard.locator(pomWB.xpathToPopupChooseTemplate)).toBeHidden();
    });

    await test.step(`Click vào Create new design 3`, async () => {
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await dashboard.getByText(caseConf.create_new_design).click();
    });

    await test.step(`Chọn 1 template bất kì -> Click button Apply 3`, async () => {
      await dashboard.locator(pomWB.xpathToFigureTemplate).hover();
      await dashboard.locator(pomWB.xpathToFigureApplyButton).click();
      await expect(dashboard.locator(pomWB.xpathToDBPopupChooseTemplate).first()).toBeVisible();
      await expect(dashboard.getByText(caseConf.popup_heading)).toBeVisible();
    });

    await test.step(`Để trống tên của custom design -> click button Create`, async () => {
      await dashboard.locator(pomWB.xpathToDBPopupCreateButton).click();
      await expect(dashboard.locator(pomWB.xpathToPopupErrorMessage)).toHaveText(caseConf.validation_messages.empty);
    });

    await test.step(`Nhập text > 25 kí tự`, async () => {
      await dashboard.locator(pomWB.xpathToDBCreateTemplateInput).fill(caseConf.sample_input.greater_then_max);
      await dashboard.locator(pomWB.xpathToDBPopupCreateButton).click();
      await expect(dashboard.locator(pomWB.xpathToPopupErrorMessage)).toHaveText(
        caseConf.validation_messages.greater_then_max,
      );
    });

    await test.step(`Nhập text = tên đã tồn tại`, async () => {
      await dashboard.locator(pomWB.xpathToDBCreateTemplateInput).fill(caseConf.sample_input.duplicated);
      await dashboard.locator(pomWB.xpathToDBPopupCreateButton).click();
      await pomWB.waitForElementVisibleThenInvisible(sbPage.xpathToastMessage);
    });
  });

  test(`@SB_NEWECOM_NEP_112 - [Custom Layout Product Page]Webbuilder_Create custom design_Check rename custom design không thành công`, async ({
    dashboard,
  }) => {
    await test.step(`Click vào Page name`, async () => {
      await pomWB.gotoWBProductPage(domain, theme);
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
    });

    await test.step(`Click vào icon rename`, async () => {
      await dashboard.getByText(suiteConf.renamed_template.title).hover();
      await dashboard.locator(pomWB.xpathToIconRename(suiteConf.renamed_template.title)).hover();
      await dashboard.locator(pomWB.xpathToIconRename(suiteConf.renamed_template.title)).click();
      await dashboard.waitForSelector(pomWB.xpathToPopupHeading(caseConf.rename_heading));
      await expect(dashboard.locator(pomWB.xpathToWBEditTemplateInput)).toHaveValue(suiteConf.renamed_template.title);
      const footerButtons = dashboard.locator(pomWB.xpathToPopupFooterButtons);

      for (let i = 0; i < (await footerButtons.count()); i++) {
        const btn = footerButtons.nth(i);
        await expect(btn).toHaveText(caseConf.footer_buttons[i]);
      }
    });

    await test.step(`Click cancel`, async () => {
      await dashboard.locator(pomWB.xpathToWBPopupCancelButton).click();
      await dashboard.locator(pomWB.xpathToWBPopupEditTemplate).isHidden();
    });

    await test.step(`Click vào Product page -> hover vào custom design -> click icon Rename 1`, async () => {
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await expect(dashboard.locator(pomWB.xpathToTemplateSelectPopover)).toBeVisible();
      const customDesign = dashboard.getByText(suiteConf.renamed_template.title);
      await expect(customDesign).toBeVisible();
      await customDesign.hover();
      await dashboard.locator(pomWB.xpathToIconRename(suiteConf.renamed_template.title)).click();
      await dashboard.waitForSelector(pomWB.xpathToPopupHeading(caseConf.rename_heading));
      await expect(dashboard.locator(pomWB.xpathToWBEditTemplateInput)).toHaveValue(suiteConf.renamed_template.title);
      const footerButtons = dashboard.locator(pomWB.xpathToPopupFooterButtons);

      for (let i = 0; i < (await footerButtons.count()); i++) {
        const btn = footerButtons.nth(i);
        await expect(btn).toHaveText(caseConf.footer_buttons[i]);
      }
    });

    await test.step(`Click icon close popup`, async () => {
      await dashboard.locator(pomWB.xpathToWBPopupCloseButton).click();
      await dashboard.locator(pomWB.xpathToWBPopupEditTemplate).isHidden();
    });

    await test.step(`Click vào Product page -> hover vào custom design -> click icon Rename 2`, async () => {
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await expect(dashboard.locator(pomWB.xpathToTemplateSelectPopover)).toBeVisible();
      const customDesign = dashboard.getByText(suiteConf.renamed_template.title);
      await expect(customDesign).toBeVisible();
      await customDesign.hover();
      await dashboard.locator(pomWB.xpathToIconRename(suiteConf.renamed_template.title)).click();
      await dashboard.waitForSelector(pomWB.xpathToPopupHeading(caseConf.rename_heading));
      await expect(dashboard.locator(pomWB.xpathToWBEditTemplateInput)).toHaveValue(suiteConf.renamed_template.title);
      const footerButtons = dashboard.locator(pomWB.xpathToPopupFooterButtons);

      for (let i = 0; i < (await footerButtons.count()); i++) {
        const btn = footerButtons.nth(i);
        await expect(btn).toHaveText(caseConf.footer_buttons[i]);
      }
    });

    await test.step(`Ở field Name your design, xóa tên, để trống field -> click button Save`, async () => {
      await dashboard.locator(pomWB.xpathToWBEditTemplateInput).fill(caseConf.sample_input.empty);
      await dashboard.locator(pomWB.xpathToWBPopupSaveButton).click();
      await expect(dashboard.locator(pomWB.xpathToPopupErrorMessage)).toHaveText(
        `${caseConf.validation_messages.empty}`,
      );
    });

    await test.step(`Nhập tên > 25 kí tự`, async () => {
      await dashboard.locator(pomWB.xpathToWBEditTemplateInput).fill(caseConf.sample_input.greater_then_max);
      await dashboard.locator(pomWB.xpathToWBPopupSaveButton).click();
      await expect(dashboard.locator(pomWB.xpathToPopupErrorMessage)).toHaveText(
        `${caseConf.validation_messages.greater_then_max}`,
      );
    });

    await test.step(`Nhập text trùng tên đã tồn tại`, async () => {
      await dashboard.locator(pomWB.xpathToWBEditTemplateInput).fill(caseConf.sample_input.duplicated);
      await dashboard.locator(pomWB.xpathToWBPopupSaveButton).click();
      await pomWB.waitForElementVisibleThenInvisible(sbPage.xpathToastMessage);
    });
  });

  test(`@SB_NEWECOM_NEP_113 - [Custom Layout Product Page]Webbuilder_Create custom design_Check rename custom design thành công`, async ({
    dashboard,
  }) => {
    await test.step(`Click vào Page name`, async () => {
      await pomWB.gotoWBProductPage(domain, theme);
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
    });

    await test.step(`Click vào icon rename`, async () => {
      await dashboard.getByText(suiteConf.renamed_template.title).hover();
      await dashboard.locator(pomWB.xpathToIconRename(suiteConf.renamed_template.title)).hover();
      await dashboard.locator(pomWB.xpathToIconRename(suiteConf.renamed_template.title)).click();
      await dashboard.waitForSelector(pomWB.xpathToPopupHeading(caseConf.rename_heading));
      await expect(dashboard.locator(pomWB.xpathToWBEditTemplateInput)).toHaveValue(suiteConf.renamed_template.title);
      const footerButtons = dashboard.locator(pomWB.xpathToPopupFooterButtons);

      for (let i = 0; i < (await footerButtons.count()); i++) {
        const btn = footerButtons.nth(i);
        await expect(btn).toHaveText(caseConf.footer_buttons[i]);
      }
    });

    await test.step(`Nhập tên hợp lệ -> Click button Save`, async () => {
      await dashboard.locator(pomWB.xpathToWBEditTemplateInput).fill(caseConf.sample_input.rename_input);
      await dashboard.locator(pomWB.xpathToWBPopupSaveButton).click();
      await dashboard.locator(pomWB.xpathToWBPopupEditTemplate).isHidden();
    });

    await test.step(`Click vào Product page`, async () => {
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await expect(dashboard.locator(pomWB.xpathToTemplateSelectPopover)).toBeVisible();
      const templateList = await pomWB.convertToTextArray(await dashboard.$$(pomWB.xpathTemplateOption));
      expect(templateList.sort().toString().replace(/\s/g, "")).toEqual(
        caseConf.new_list_custom_design_title.sort().toString().replace(/\s/g, ""),
      );
    });

    await test.step(`Truy cập {domain}/admin/product -> Click product A`, async () => {
      await pomWB.gotoDBProductPage(domain);
      await dashboard.locator(pomWB.xpathToDBFirstProduct).click();
      await expect(dashboard.locator(pomWB.xpathToDBSTagTemplate)).toHaveText(caseConf.default_template);
    });

    await test.step(`Click vào select Custom design`, async () => {
      (await dashboard.waitForSelector(pomWB.xpathToDBSTagTemplateButton)).click();
      (await dashboard.waitForSelector(pomWB.xpathToDBInputTemplate)).click();
      const templateList = await pomWB.convertToTextArray(await dashboard.$$(pomWB.xpathToDBSelectTemplateOptions));
      expect(templateList.sort().toString().replace(/\s/g, "")).toEqual(
        caseConf.new_list_custom_design_title.sort().toString().replace(/\s/g, ""),
      );
    });
  });

  test(`@SB_NEWECOM_NEP_114 - [Custom Layout Product Page]Webbuilder_Create custom design_Check delete custom design`, async ({
    dashboard,
  }) => {
    await test.step(`Pre-condition: Create 'Delete template' template`, async () => {
      await webBuilderAPI.createProductTemplate({
        title: design[0],
        page: "product",
        type: "theme",
        template_id: suiteConf.template_id,
        multiple: true,
      });
    });

    await test.step(`Click vào Page name`, async () => {
      await pomWB.gotoWBProductPage(domain, theme);
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
    });

    await test.step(`Click vào icon delete`, async () => {
      await dashboard.getByText(design[0]).hover();
      await dashboard.locator(pomWB.xpathToIconDelete(design[0])).hover();
      await dashboard.locator(pomWB.xpathToIconDelete(design[0])).click();
      await dashboard.waitForSelector(pomWB.xpathToPopupHeading(caseConf.popup_heading));
      await expect(dashboard.locator(pomWB.xpathToPopupContent)).toHaveText(caseConf.popup_body);

      const footerButtons = dashboard.locator(pomWB.xpathToPopupFooterButtons);
      for (let i = 0; i < (await footerButtons.count()); i++) {
        const btn = footerButtons.nth(i);
        await expect(btn).toHaveText(caseConf.footer_buttons[i]);
      }
    });

    await test.step(`Click cancel`, async () => {
      await dashboard.locator(pomWB.xpathToWBPopupCancelButton).click();
      await dashboard.locator(pomWB.xpathToWBPopupEditTemplate).isHidden();
    });

    await test.step(`Click vào Product page -> hover vào custom design -> click icon Delete 1`, async () => {
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await expect(dashboard.locator(pomWB.xpathToTemplateSelectPopover)).toBeVisible();
      const customDesign = dashboard.getByText(design[0]);
      await expect(customDesign).toBeVisible();
      await customDesign.hover();

      // click icon Delete 1
      await dashboard.locator(pomWB.xpathToIconDelete(design[0])).click();
      await dashboard.waitForSelector(pomWB.xpathToPopupHeading(caseConf.popup_heading));
      await expect(dashboard.locator(pomWB.xpathToPopupContent)).toHaveText(caseConf.popup_body);

      const footerButtons = dashboard.locator(pomWB.xpathToPopupFooterButtons);
      for (let i = 0; i < (await footerButtons.count()); i++) {
        const btn = footerButtons.nth(i);
        await expect(btn).toHaveText(caseConf.footer_buttons[i]);
      }
    });

    await test.step(`Click icon close popup`, async () => {
      await dashboard.locator(pomWB.xpathToWBPopupCloseButton).click();
      await dashboard.locator(pomWB.xpathToWBPopupEditTemplate).isHidden();
    });

    await test.step(`Click vào Product page -> hover vào custom design -> click icon Delete 2`, async () => {
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await expect(dashboard.locator(pomWB.xpathToTemplateSelectPopover)).toBeVisible();

      const customDesign = dashboard.getByText(design[0]);
      await expect(customDesign).toBeVisible();
      await customDesign.hover();

      // click vao icon delete
      await dashboard.locator(pomWB.xpathToIconDelete(design[0])).click();
      await dashboard.waitForSelector(pomWB.xpathToPopupHeading(caseConf.popup_heading));
      await expect(dashboard.locator(pomWB.xpathToPopupContent)).toHaveText(caseConf.popup_body);

      const footerButtons = dashboard.locator(pomWB.xpathToPopupFooterButtons);
      for (let i = 0; i < (await footerButtons.count()); i++) {
        const btn = footerButtons.nth(i);
        await expect(btn).toHaveText(caseConf.footer_buttons[i]);
      }
    });

    await test.step(`Click button Delete`, async () => {
      await dashboard.locator(pomWB.xpathToWBPopupSaveButton).click();
      await dashboard.locator(pomWB.xpathToWBPopupEditTemplate).isHidden();
    });

    await test.step(`Click vào Product page`, async () => {
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await expect(dashboard.locator(pomWB.xpathToTemplateSelectPopover)).toBeVisible();
      const templateList = await pomWB.convertToTextArray(await dashboard.$$(pomWB.xpathTemplateOption));
      expect(templateList.sort().toString().replace(/\s/g, "")).toEqual(
        caseConf.new_list_custom_design_title.sort().toString().replace(/\s/g, ""),
      );
    });

    await test.step(`Truy cập {domain}/admin/product -> Click product A`, async () => {
      await pomWB.gotoDBProductPage(domain);
      await dashboard.locator(pomWB.xpathToDBFirstProduct).click();
      await expect(dashboard.locator(pomWB.xpathToDBSTagTemplate)).toHaveText(caseConf.default_template);
    });

    await test.step(`Click vào select Custom design`, async () => {
      (await dashboard.waitForSelector(pomWB.xpathToDBSTagTemplateButton)).click();
      (await dashboard.waitForSelector(pomWB.xpathToDBInputTemplate)).click();
      const templateList = await pomWB.convertToTextArray(await dashboard.$$(pomWB.xpathToDBSelectTemplateOptions));
      expect(templateList.sort().toString().replace(/\s/g, "")).toEqual(
        caseConf.new_list_custom_design_title.sort().toString().replace(/\s/g, ""),
      );
    });
  });

  test(`@SB_NEWECOM_NEP_115 - [Custom Layout Product Page]Webbuilder_Switch custom design_Check switch custom design ở bên trong webbuilder`, async ({
    dashboard,
    snapshotFixture,
    context,
  }) => {
    await test.step(`Click vào product 6`, async () => {
      await pomWB.gotoWBProductPage(domain, theme);
      await dashboard.locator(pomWB.xpathToWBProductSelectButton).click();
      const listOfUnassignedProduct = await pomWB.convertToTextArray(
        await dashboard.$$(pomWB.xpathToWBUnassignedProduct),
      );

      expect(listOfUnassignedProduct.sort().toString().replace(/\s/g, "")).toEqual(
        caseConf.list_product_not_assigned_to_default_template.sort().toString().replace(/\s/g, ""),
      );
    });

    await test.step(`Click vào Page name`, async () => {
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await expect(dashboard.locator(pomWB.xpathToTemplateSelectPopover)).toBeVisible();
      const templateList = await pomWB.convertToTextArray(await dashboard.$$(pomWB.xpathTemplateOption));
      expect(templateList.sort().toString().replace(/\s/g, "")).toEqual(
        caseConf.list_custom_design_title.sort().toString().replace(/\s/g, ""),
      );
    });

    await test.step(`Chọn custom design được assign cho product 5`, async () => {
      await dashboard.getByText(caseConf.product_5.template).click();
      const productName = (await dashboard.locator(pomWB.xpathToWBProductSelectButton).textContent()).trim();
      expect(productName).toEqual(caseConf.product_name);
      await dashboard.waitForSelector(pomWB.xpathToWBProductSelectButtonWarnIcon);
    });

    await test.step(`Click vào list chọn product`, async () => {
      await dashboard.locator(pomWB.xpathToWBProductSelectButton).click();
      const listOfUnassignedProduct = await pomWB.convertToTextArray(
        await dashboard.$$(pomWB.xpathToWBUnassignedProduct),
      );

      expect(listOfUnassignedProduct.sort().toString().replace(/\s/g, "")).toEqual(
        caseConf.list_product_not_assigned_to_template_halloween.sort().toString().replace(/\s/g, ""),
      );
    });

    await test.step(`Chọn product 5`, async () => {
      await dashboard.locator(pomWB.xpathToWBProductOption(caseConf.product_5.title)).click();
      await dashboard.locator(pomWB.xpathToWBProgressBar).waitFor({ state: "detached" });
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: pomWB.xpathToWBIFrame,
        snapshotName: caseConf.snapshot_config.web_builder_pic,
      });
    });

    await test.step(`Click vào Page name -> Chọn custom design ko được assign cho product`, async () => {
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await dashboard.getByText(caseConf.trendie_design).click();
      await dashboard.locator(pomWB.xpathToWBProgressBar).waitFor({ state: "detached" });
      await dashboard.waitForSelector(pomWB.xpathToWBProductSelectButtonWarnIcon);

      const [previewPage] = await Promise.all([
        context.waitForEvent("page"),
        pomWB.blocks.clickBtnNavigationBar("preview"),
      ]);
      await snapshotFixture.verifyWithAutoRetry({
        page: previewPage,
        snapshotName: caseConf.snapshot_config.web_front_pic,
      });
    });
  });

  test(`@SB_NEWECOM_NEP_105 - [Custom Layout Product Page]Product Admin_Check UI block page design khi store đã có custom design`, async ({
    dashboard,
    context,
  }) => {
    const designDefault = caseConf.design_title[0];
    const selectDesign = caseConf.design_title[1];

    await test.step(`Truy cập {domain}/admin/product`, async () => {
      await pomWB.gotoDBProductPage(domain);
    });

    await test.step(`Click vào product 1, check block Page design bên cột phải`, async () => {
      await dashboard.locator(pomWB.xpathToDBFirstProduct).click();
      await expect(pomWB.locatorMessagePageDesign.filter({ hasText: caseConf.message })).toBeVisible();
      await dashboard.locator(pomWB.xpathToDBSTagTemplateButton).click();
      await dashboard.locator(pomWB.xpathToDBInputTemplate).click();
      expect((await dashboard.locator(pomWB.xpathToDBSelectTemplateOptions).first().textContent()).trim()).toEqual(
        designDefault,
      );
      await expect(dashboard.locator(pomWB.locatorHoverTemplateByName(designDefault))).toBeVisible();
    });

    await test.step(`Click chọn 1 custom desgin`, async () => {
      await dashboard.locator(pomWB.xpathToDBSelectTemplateOptions).filter({ hasText: selectDesign }).click();
      await expect(dashboard.locator(pomWB.xpathToDBSTagTemplateButton)).toBeVisible();
      await expect(dashboard.locator(pomWB.xpathToDBInputTemplate)).toBeHidden();
      expect(await dashboard.locator(pomWB.xpathToDBSTagTemplate).textContent()).toEqual(selectDesign);
    });

    await test.step(`Click button Save changes`, async () => {
      await dashboard.locator(pomWB.saveChangeBtn).click();
      await expect(dashboard.locator(pomWB.saveChangeBtn)).toBeHidden();
      expect(await dashboard.locator(pomWB.xpathToDBSTagTemplate).textContent()).toEqual(selectDesign);
      await expect(dashboard.locator(pomWB.xpathToDBSTagTemplateButton)).toBeVisible();
      await expect(dashboard.locator(pomWB.hrefByTemplateId(suiteConf.custom_design_id))).toBeAttached();
      await expect(dashboard.locator(pomWB.hrefByTemplateId(suiteConf.custom_design_id_default))).not.toBeAttached();
    });

    await test.step(`Click text link [Go to web builder]`, async () => {
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        pomWB.locatorMessagePageDesign.getByRole("link", { name: "Go to website builder" }).click(),
      ]);
      const urlCustomDesign = `https://${domain}/admin/builder/site/${theme}?page=product`;
      expect(newTab.url()).toContain(urlCustomDesign);
      await newTab.waitForSelector(pomWB.blocks.xpathPreviewLoadingScreen);
      await newTab.waitForSelector(pomWB.blocks.xpathPreviewLoadingScreen, { state: "hidden" });
      const designTitle = (await newTab.locator(pomWB.xpathToTemplateSelectButton).textContent()).trim();
      const productName = (await newTab.locator(pomWB.xpathToWBProductSelectButton).textContent()).trim();
      expect(designTitle).toEqual(caseConf.design_title_WB);
      expect(productName).toEqual(caseConf.product_name);
      await expect(newTab.locator(pomWB.exclamationMarkIcon)).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_NEP_111 - [Custom Layout Product Page]Webbuilder_Create custom design_Check create new design thành công`, async ({
    dashboard,
  }) => {
    const editData = caseConf.setup_section;
    const defaultData = caseConf.default_section;
    const sectionName = caseConf.section_name;
    const sectionInfo = caseConf.section_info;

    await test.step(`Click vào Page name`, async () => {
      await pomWB.gotoWBProductPage(domain, theme);
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
    });

    await test.step(`Click vào [Create new design] -> Chọn 1 template bất kì -> Click button Apply -> Nhập tên hợp lệ: Quickly custom-> Click button Create`, async () => {
      await pomWB.createACustomDesignWithName(design[1]);
      await expect(dashboard.locator(pomWB.xpathToTemplateSelectButton)).toContainText(design[1]);
    });

    await test.step(`Setting data của custom design mới tạo`, async () => {
      await pomWB.openSectionByNameTab(sectionInfo, sectionName, "Design");
      await pomWB.settingDesignAndContentWithSDK(editData);
    });

    await test.step(`Click button Exit`, async () => {
      await dashboard.locator(pomWB.otherPage.buttonExitWebBuilderSelector).click();
      await pomWB.clickBtnInConfirmPopup("Leave");
    });

    await test.step(`Click vào Page name`, async () => {
      await pomWB.gotoWBProductPage(domain, theme);
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
    });

    await test.step(`Ở page Product page, click Page name, chọn custom design mới tạo: Quickly custom`, async () => {
      await dashboard.getByText(design[1]).click();
      await dashboard.waitForLoadState("domcontentloaded");
      await pomWB.openSectionByNameTab(sectionInfo, sectionName, "Design");
      const data = await pomWB.getDesignAndContentWithSDK();
      expect(data).toMatchObject(defaultData);
    });

    await test.step(`Click vào [Create new design]-> Chọn 1 template bất kì -> Click button Apply-> Nhập tên hợp lệ: Happy day -> Click button Create`, async () => {
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await pomWB.createACustomDesignWithName(design[2]);
      const designTitle = (await dashboard.locator(pomWB.xpathToTemplateSelectButton).textContent()).trim();
      expect(designTitle).toContain(design[2]);
    });

    await test.step(`Setting data của custom design mới tạo`, async () => {
      await pomWB.openSectionByNameTab(sectionInfo, sectionName, "Design");
      await pomWB.settingDesignAndContentWithSDK(editData);
    });

    await test.step(`Click button Save -> Click button Exit`, async () => {
      await pomWB.clickSaveButton();
      await dashboard.locator(pomWB.otherPage.buttonExitWebBuilderSelector).click();
    });

    await test.step(`Back lai WB -> Ở page Product page, click Page name, chọn custom design: Happy day mới tạo`, async () => {
      await pomWB.gotoWBProductPage(domain, theme);
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await dashboard.getByText(design[2]).click();
      await dashboard.waitForLoadState("domcontentloaded");
      await pomWB.openSectionByNameTab(sectionInfo, sectionName, "Design");
      const data = await pomWB.getDesignAndContentWithSDK();
      expect(data).toMatchObject(editData);
    });
  });

  test(`@SB_NEWECOM_NEP_116 - [Custom Layout Product Page]Webbuilder_Check edit custom design`, async ({
    dashboard,
    snapshotFixture,
  }) => {
    await test.step(`Click vào Page name`, async () => {
      await pomWB.gotoWBProductPage(domain, theme);
      await dashboard.locator(pomWB.xpathToTemplateSelectButton).click();
      await dashboard.waitForSelector(pomWB.xpathToTemplateSelectPopover);
    });

    await test.step(`Click chọn 1 custom desgin`, async () => {
      await dashboard.getByText(caseConf.design_product_1).click();
      await dashboard.waitForSelector(pomWB.xpathToWBProductSelectButtonWarnIcon);
      await dashboard.locator(pomWB.xpathToWBProgressBar).waitFor({ state: "detached" });
      await expect(dashboard.locator(pomWB.xpathToTemplateSelectButton)).toHaveText(caseConf.template_heading);
    });

    await test.step(`Thực hiện edit custom design -> Save`, async () => {
      iconBlockId = await webBuilder.dragAndDropInWebBuilder(caseConf.section.icon_block);
      headingBlockId = await webBuilder.dragAndDropInWebBuilder(caseConf.section.heading_block);

      await dashboard.locator(webBuilder.xpathButtonSave).click();
      await webBuilder.toastMessage.waitFor({ state: "visible" });
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: pomWB.xpathToWBIFrame,
        snapshotName: caseConf.snapshot_config.template_wf,
      });
    });

    await test.step(`Ngoài SF, mở product 1`, async () => {
      await pomWB.gotoSFNProductPage(domain, caseConf.product_1);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: caseConf.snapshot_config.product1_sf,
      });
    });

    await test.step(`Ngoài SF,mở product 2/ product 3`, async () => {
      await pomWB.gotoSFNProductPage(domain, caseConf.product_2);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        snapshotName: caseConf.snapshot_config.product2_sf,
      });
    });
  });

  test(`@SB_NEWECOM_NEP_117 - [Custom Layout Product Page]Webbuilder_Check view product đối với shop có bật multiple storefront`, async ({
    dashboard,
    snapshotFixture,
    context,
  }) => {
    await test.step(`Truy cập {domain}/admin/product`, async () => {
      await pomWB.gotoDBProductPage(suiteConf.domain);
    });

    await test.step(`Click vào Product 1 -> click button View`, async () => {
      await dashboard.locator(pomWB.xpathToDBProductList).getByText(caseConf.product_1).click();
      await dashboard.locator(pomWB.xpathToDBProductViewButton).click();
      const templateList = await pomWB.convertToTextArray(
        await dashboard.$$(pomWB.xpathToDBProductMultipleSFListOption),
      );
      expect(templateList.sort().toString().replace(/\s/g, "")).toEqual(
        caseConf.list_sf.sort().toString().replace(/\s/g, ""),
      );
    });

    await test.step(`Chọn storefront: custom-design1.myshopbase.net (1)`, async () => {
      const [productPage] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.locator(pomWB.xpathToDBProductMultipleSFListOption).getByText(caseConf.list_sf[0]).click(),
      ]);
      await snapshotFixture.verifyWithAutoRetry({
        page: productPage,
        snapshotName: caseConf.snapshot_config.custom_design_1_product1,
      });

      await productPage.close();
      const homePage = await context.newPage();
      await homePage.goto(pomWB.xpathToHomePage(caseConf.list_sf[0]));
      await snapshotFixture.verifyWithAutoRetry({
        page: homePage,
        snapshotName: caseConf.snapshot_config.custom_design_1_homepage,
      });
      await homePage.close();
    });

    await test.step(`Chọn storefront: au-custom-design.myshopbase.net (1)`, async () => {
      await dashboard.locator(pomWB.xpathToDBProductViewButton).click();
      const [productPage] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.locator(pomWB.xpathToDBProductMultipleSFListOption).getByText(caseConf.list_sf[1]).click(),
      ]);
      await snapshotFixture.verifyWithAutoRetry({
        page: productPage,
        snapshotName: caseConf.snapshot_config.au_custom_design_product1,
      });

      await productPage.close();
      const homePage = await context.newPage();
      await homePage.goto(pomWB.xpathToHomePage(caseConf.list_sf[1]));
      await snapshotFixture.verifyWithAutoRetry({
        page: homePage,
        snapshotName: caseConf.snapshot_config.au_custom_design_homepage,
      });
      await homePage.close();
    });

    await test.step(`Click vào Product 4 -> click button View`, async () => {
      await pomWB.gotoDBProductPage(domain);
      await dashboard.locator(pomWB.xpathToDBProductList).getByText(caseConf.product_4).click();
      await dashboard.locator(pomWB.xpathToDBProductViewButton).click();
    });

    await test.step(`Chọn storefront: custom-design1.myshopbase.net (2)`, async () => {
      const [productPage] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.locator(pomWB.xpathToDBProductMultipleSFListOption).getByText(caseConf.list_sf[0]).click(),
      ]);
      await snapshotFixture.verifyWithAutoRetry({
        page: productPage,
        snapshotName: caseConf.snapshot_config.custom_design_1_product4,
      });

      await productPage.close();
      const homePage = await context.newPage();
      await homePage.goto(pomWB.xpathToHomePage(caseConf.list_sf[0]));
      await snapshotFixture.verifyWithAutoRetry({
        page: homePage,
        snapshotName: caseConf.snapshot_config.custom_design_1_homepage,
      });
      await homePage.close();
    });

    await test.step(`Chọn storefront: au-custom-design.myshopbase.net (2)`, async () => {
      await dashboard.locator(pomWB.xpathToDBProductViewButton).click();
      const [productPage] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard.locator(pomWB.xpathToDBProductMultipleSFListOption).getByText(caseConf.list_sf[1]).click(),
      ]);
      await snapshotFixture.verifyWithAutoRetry({
        page: productPage,
        snapshotName: caseConf.snapshot_config.au_custom_design_product4,
      });

      await productPage.close();
      const homePage = await context.newPage();
      await homePage.goto(pomWB.xpathToHomePage(caseConf.list_sf[1]));
      await snapshotFixture.verifyWithAutoRetry({
        page: homePage,
        snapshotName: caseConf.snapshot_config.au_custom_design_homepage,
      });
      await homePage.close();
    });
  });
});
