import { test, expect } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { verifyRedirectUrl } from "@core/utils/theme";
import { XpathNavigationButtons } from "@constants/web_builder";
import { setVariableOnQuickbar } from "tests/modules/dashboard/onlinestore/website_builder/variable/variable-util";
import { Page } from "@playwright/test";
import { WbWebsitePages } from "@pages/dashboard/wb-website-page";
import { pressControl } from "@core/utils/keyboard";
test.describe("Verify function Policy page", () => {
  let dashboardPage: DashboardPage;
  let otherPage: OtherPage;
  let wbWebsitePages: WbWebsitePages;
  let section, sectionSetting, storefront, sectionSelector;

  test.beforeEach(async ({ dashboard, conf, token }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    otherPage = new OtherPage(dashboard, conf.suiteConf.domain);
    wbWebsitePages = new WbWebsitePages(dashboard, conf.suiteConf.domain);
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    otherPage.setAccessToken(shopToken);
    await dashboardPage.navigateToSubMenu("Online Store", "Pages");
    await dashboardPage.genLoc(otherPage.getXpathByTabName("Policy Pages")).click();
    await otherPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);
  });

  test.afterEach(async ({ conf }) => {
    let blockSetting, xpathSection;
    const sectionName = conf.suiteConf.add_blank_section.from.template;
    switch (conf.caseName) {
      case "SB_NEWECOM_NEPM_19":
        await wbWebsitePages.frameLocator.locator(wbWebsitePages.xpathBlockPolicies).click();
        blockSetting = conf.suiteConf.style_block_policy_default;
        await wbWebsitePages.setBackground("background", blockSetting.background);
        await wbWebsitePages.setBorder("border", blockSetting.border);
        await wbWebsitePages.setMarginPadding("padding", blockSetting.padding);
        await wbWebsitePages.titleBar.click({ delay: 500 });

        // check lại xpath section kéo vào trong step testcase, nếu nó còn tồn tại thì xóa
        await wbWebsitePages.genLoc(wbWebsitePages.xpathButtonLayer).click();
        xpathSection = await wbWebsitePages
          .genLoc(wbWebsitePages.getSidebarSelectorByName({ sectionName: sectionName }))
          .isVisible();
        if (xpathSection) {
          await wbWebsitePages.genLoc(wbWebsitePages.getSidebarSelectorByName({ sectionName: sectionName })).click();
          await wbWebsitePages.genLoc(wbWebsitePages.getXpathByText("Delete section")).click();
        }
        await wbWebsitePages.clickOnBtnWithLabel("Save");
        await expect(wbWebsitePages.toastMessage).toContainText("All changes are saved");
        break;

      case "SB_NEWECOM_NEPM_20":
        await wbWebsitePages.genLoc(wbWebsitePages.xpathButtonLayer).click();
        xpathSection = await wbWebsitePages
          .genLoc(wbWebsitePages.getSidebarSelectorByName({ sectionName: sectionName }))
          .isVisible();
        if (xpathSection) {
          await wbWebsitePages.genLoc(wbWebsitePages.getSidebarSelectorByName({ sectionName: sectionName })).click();
          await wbWebsitePages.genLoc(wbWebsitePages.getXpathByText("Delete section")).click();
          await wbWebsitePages.clickOnBtnWithLabel("Save");
          await expect(wbWebsitePages.toastMessage).toContainText("All changes are saved");
        }
        break;
    }
  });

  test(`@SB_NEWECOM_NEPM_17 Tab Policy Pages_Kiểm tra filter page theo status các page policy ở shop SB`, async ({
    conf,
  }) => {
    await test.step(`Precondition: edit page status bằng api`, async () => {
      const status = conf.caseConf.edit_policy_page;
      const result = await otherPage.editPolcyPageByApi(conf.caseConf.edit_policy_page);
      expect(result.visible_page).toEqual(
        expect.objectContaining({
          refund_policy: status.visible_page.refund_policy,
          shipping_policy: status.visible_page.shipping_policy,
          return_policy: status.visible_page.return_policy,
          terms_of_service: status.visible_page.terms_of_service,
          privacy_policy: status.visible_page.privacy_policy,
        }),
      );
    });

    await test.step(`Tại tab Policy Pages, chọn tab "Visible" ở phần filter `, async () => {
      await dashboardPage.genLoc(otherPage.getXpathFilterTab("Visible")).click();
      await dashboardPage.waitUtilSkeletonDisappear();
      const listPage = await otherPage.getAllPagePolicyDisplay();
      expect(listPage.length).toEqual(conf.caseConf.result_visible.length);
      for (let i = 0; i < listPage.length; i++) {
        expect(listPage[i].title).toEqual(conf.caseConf.result_visible[i]);
      }
    });

    await test.step(`Chọn tab "Hidden"`, async () => {
      await dashboardPage.genLoc(otherPage.getXpathFilterTab("Hidden")).click();
      await dashboardPage.waitUtilSkeletonDisappear();
      const listPage = await otherPage.getAllPagePolicyDisplay();
      expect(listPage.length).toEqual(conf.caseConf.result_hidden.length);
      for (let i = 0; i < listPage.length; i++) {
        expect(listPage[i].title).toEqual(conf.caseConf.result_hidden[i]);
      }
    });

    await test.step(`Chọn tab "All"`, async () => {
      await dashboardPage.genLoc(otherPage.getXpathFilterTab("All")).click();
      await dashboardPage.waitUtilSkeletonDisappear();
      const listPage = await otherPage.getAllPagePolicyDisplay();
      expect(listPage.length).toEqual(conf.caseConf.result_all.length);
      for (let i = 0; i < listPage.length; i++) {
        expect(listPage[i].title).toEqual(conf.caseConf.result_all[i]);
      }
    });
  });

  test(`@SB_NEWECOM_NEPM_18 Tab Policy Pages_Kiểm tra các action khi tích chọn các page policy ở shop SB`, async ({
    conf,
  }) => {
    await test.step(`Precondition: edit page status bằng api`, async () => {
      const status = conf.caseConf.edit_policy_page;
      const result = await otherPage.editPolcyPageByApi(conf.caseConf.edit_policy_page);
      expect(result.visible_page).toEqual(
        expect.objectContaining({
          refund_policy: status.visible_page.refund_policy,
          shipping_policy: status.visible_page.shipping_policy,
          return_policy: status.visible_page.return_policy,
          terms_of_service: status.visible_page.terms_of_service,
          privacy_policy: status.visible_page.privacy_policy,
        }),
      );
    });

    await test.step(`Tíck chọn vào check box bên cạnh field Page Title`, async () => {
      await otherPage.genLoc(otherPage.checkboxAllPages).click();
      const pageSelected = await otherPage.getAllPagePolicyDisplay();
      for (let i = 0; i < pageSelected.length; i++) {
        expect(pageSelected[i].selectable).toEqual(true);
      }
      const numberPageSelected = await otherPage.getNumberPageSelected();
      expect(numberPageSelected).toEqual(conf.caseConf.text_number_selected_page);
      await expect(otherPage.genLoc(otherPage.getXpathBtnTableHeader("More actions"))).toBeVisible();
      await expect(otherPage.genLoc(otherPage.getXpathBtnTableHeader("Select on all pages"))).toBeHidden();
    });

    await test.step(`Click dropdown list "More actions" `, async () => {
      await otherPage.genLoc(otherPage.getXpathBtnTableHeader("More actions")).click();
      for (const action of conf.caseConf.more_actions) {
        await expect(otherPage.optionButtonMoreActionByLabel(action)).toBeVisible();
      }
    });

    await test.step(`Chọn action "Hide Selected Pages"`, async () => {
      await otherPage.optionButtonMoreActionByLabel(conf.caseConf.more_actions[1]).click();
      const toastMessage = await otherPage.getTextOfToast("success");
      expect(toastMessage).toEqual(`Hide ${conf.caseConf.number_page} pages`);
      await otherPage.waitForToastDefaultHidden();
    });

    await test.step(`Click filter "Hidden"`, async () => {
      await otherPage.genLoc(otherPage.getXpathFilterTab("Hidden")).click();
      await otherPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);
      const pageInVisibleFilter = await otherPage.getAllPagePolicyDisplay();
      expect(pageInVisibleFilter.length).toEqual(conf.caseConf.pages.length);
      for (let i = 0; i < pageInVisibleFilter.length; i++) {
        expect(pageInVisibleFilter[i].title).toEqual(conf.caseConf.pages[i]);
      }
    });

    await test.step(` - Click filter All, tích chọn checkbox bên cạnh Page Title
    - Chọn action "Show Selected Pages"`, async () => {
      await otherPage.genLoc(otherPage.getXpathFilterTab("All")).click();
      await otherPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);
      await otherPage.genLoc(otherPage.checkboxAllPages).click();
      await otherPage.genLoc(otherPage.getXpathBtnTableHeader("More actions")).click();
      await otherPage.optionButtonMoreActionByLabel(conf.caseConf.more_actions[0]).click();
      const toastMessage = await otherPage.getTextOfToast("success");
      expect(toastMessage).toEqual(`Show ${conf.caseConf.number_page} pages`);
      await otherPage.waitForToastDefaultHidden();
    });

    await test.step(`Click tab "Visible"`, async () => {
      await otherPage.genLoc(otherPage.getXpathFilterTab("Visible")).click();
      await otherPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);
      const pageInVisibleFilter = await otherPage.getAllPagePolicyDisplay();
      expect(pageInVisibleFilter.length).toEqual(conf.caseConf.pages.length);
      for (let i = 0; i < pageInVisibleFilter.length; i++) {
        expect(pageInVisibleFilter[i].title).toEqual(conf.caseConf.pages[i]);
      }
    });

    await test.step(`Tích checkbox X page bất kì ở tab Visible, click More action, chọn Hide Selected Pages"`, async () => {
      for (const page of conf.caseConf.select_page) {
        for (let i = 0; i < page.title.length; i++) {
          await otherPage.getCheckboxPageByTitle(page.title[i]).click();
        }
        await otherPage.genLoc(otherPage.getXpathBtnTableHeader("More actions")).click();
        await otherPage.optionButtonMoreActionByLabel(conf.caseConf.more_actions[1]).click();
        if (page.title.length == 1) {
          expect(await otherPage.getTextOfToast("success")).toEqual(`Hide ${page.number_page_select} page`);
        } else {
          expect(await otherPage.getTextOfToast("success")).toEqual(`Hide ${page.number_page_select} pages`);
        }

        await otherPage.waitForToastDefaultHidden();
        for (let j = 0; j < page.title.length; j++) {
          await expect(otherPage.genLoc(otherPage.getxpathRowPageByTitle(page.title[j]))).toBeHidden();
        }
      }
    });

    await test.step(`Click filter Hidden, tích checkbox X page bất kì ở tab Visible, click More action, chọn Show Selected Pages`, async () => {
      await otherPage.genLoc(otherPage.getXpathFilterTab("Hidden")).click();
      await otherPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);
      for (const page of conf.caseConf.select_page) {
        for (let i = 0; i < page.title.length; i++) {
          await otherPage.getCheckboxPageByTitle(page.title[i]).click();
        }
        await otherPage.genLoc(otherPage.getXpathBtnTableHeader("More actions")).click();
        await otherPage.optionButtonMoreActionByLabel(conf.caseConf.more_actions[0]).click();
        if (page.title.length == 1) {
          expect(await otherPage.getTextOfToast("success")).toEqual(`Show ${page.number_page_select} page`);
        } else {
          expect(await otherPage.getTextOfToast("success")).toEqual(`Show ${page.number_page_select} pages`);
        }
        await otherPage.waitForToastDefaultHidden();
        for (let j = 0; j < page.title.length; j++) {
          await expect(otherPage.genLoc(otherPage.getxpathRowPageByTitle(page.title[j]))).toBeHidden();
        }
      }
      await otherPage.genLoc(otherPage.getXpathFilterTab("Visible")).click();
      await otherPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);
      const pageInVisibleFilter = await otherPage.getAllPagePolicyDisplay();
      expect(pageInVisibleFilter.length).toEqual(conf.caseConf.pages.length);
      for (let i = 0; i < pageInVisibleFilter.length; i++) {
        expect(pageInVisibleFilter[i].title).toEqual(conf.caseConf.pages[i]);
      }
    });
  });

  test(`@SB_NEWECOM_NEPM_19 Tab Policy Pages_Kiểm tra customize page policy`, async ({ dashboard, conf, context }) => {
    test.slow();
    const blockParagraph = wbWebsitePages.getSelectorByIndex(conf.caseConf.block_paragraph);
    const addSection = conf.suiteConf.add_blank_section;
    const sectionName = addSection.from.template;
    section = addSection.to.position.section;
    const expected = conf.caseConf.expected;

    await test.step(`Precondition: edit page status bằng api`, async () => {
      const status = conf.caseConf.edit_policy_page;
      const result = await otherPage.editPolcyPageByApi(conf.caseConf.edit_policy_page);
      expect(result.visible_page).toEqual(
        expect.objectContaining({
          shipping_policy: status.visible_page.shipping_policy,
          refund_policy: status.visible_page.refund_policy,
        }),
      );
    });

    await test.step(`Click btn Customize 1 page tại tab Policy Pages `, async () => {
      await otherPage.genLoc(otherPage.getXpathButtonCustomizeByTitle(conf.caseConf.pages[0].title)).click();
      await otherPage.genLoc(wbWebsitePages.overlay).waitFor({ state: "hidden" });
      await otherPage.genLoc("#v-progressbar").waitFor({ state: "detached" });

      await expect(wbWebsitePages.genLoc(wbWebsitePages.xpathTitlePageInNavBar)).toContainText(
        conf.caseConf.pages[0].title,
      );

      await expect(wbWebsitePages.frameLocator.locator(wbWebsitePages.xpathTitleBlockPolicies)).toContainText(
        conf.caseConf.pages[0].expected_title,
      );

      await expect(wbWebsitePages.frameLocator.locator(wbWebsitePages.xpathContentBlockPolicies)).toContainText(
        conf.caseConf.pages[0].expected_content,
      );
    });

    await test.step(`Add một block vào page và thực hiện edit `, async () => {
      await wbWebsitePages.dragAndDropInWebBuilder(addSection);

      sectionSetting = conf.caseConf.data.section;
      sectionSelector = wbWebsitePages.getSelectorByIndex({ section });

      await wbWebsitePages.insertSectionBlock({
        parentPosition: sectionSetting.dnd_block.parent_position,
        template: sectionSetting.dnd_block.template,
      });
      const blockSetting = conf.caseConf.data.blockSetting;
      await wbWebsitePages.selectOptionOnQuickBar("Edit text");
      await pressControl(wbWebsitePages.page, "A");
      await wbWebsitePages.frameLocator.locator(blockParagraph).type(conf.caseConf.input_content);
      await wbWebsitePages.setBackground("background", blockSetting.background);
      await wbWebsitePages.setBorder("border", blockSetting.border);
      await wbWebsitePages.titleBar.click({ delay: 500 });
      await wbWebsitePages.clickOnBtnWithLabel("Save");
      await expect(wbWebsitePages.toastMessage).toContainText("All changes are saved");

      const wbBlock = wbWebsitePages.frameLocator.locator(`${blockParagraph}//section`);
      const cssValue = await wbWebsitePages.getCSSValue(wbBlock);

      await expect(wbWebsitePages.frameLocator.locator(`${blockParagraph}//p`)).toHaveText(conf.caseConf.input_content);
      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: expected.background_color,
          boderBottomColor: expected.border.boder_bottom_color,
          boderBottomStyle: expected.border.boder_bottom_style,
          boderBottomWidth: expected.border.boder_bottom_width,
          boderTopColor: expected.border.boder_top_color,
          boderTopStyle: expected.border.boder_top_style,
          boderTopWidth: expected.border.boder_top_width,
          boderLeftColor: expected.border.boder_left_color,
          boderLeftStyle: expected.border.boder_left_style,
          boderLeftWidth: expected.border.boder_left_width,
          boderRightColor: expected.border.boder_right_color,
          boderRightStyle: expected.border.boder_right_style,
          boderRightWidth: expected.border.boder_right_width,
        }),
      );

      storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.locator("#v-progressbar").waitFor({ state: "detached" });
      await storefront.locator(sectionSelector).waitFor({ state: "visible" });

      const wbWebsitePagesPreview = new WbWebsitePages(storefront, conf.suiteConf.domain);
      const previewSF = storefront.locator(
        wbWebsitePages.getXpathBlockPageSF(conf.caseConf.input_content, "paragraph"),
      );
      const cssValuePreview = await wbWebsitePagesPreview.getCSSValue(previewSF);
      await expect(
        wbWebsitePagesPreview.genLoc(wbWebsitePages.getXpathBlockPageSF(conf.caseConf.input_content, "paragraph")),
      ).toHaveText(conf.caseConf.input_content);

      expect(cssValuePreview).toEqual(
        expect.objectContaining({
          backgroundColor: expected.background_color,
          boderBottomColor: expected.border.boder_bottom_color,
          boderBottomStyle: expected.border.boder_bottom_style,
          boderBottomWidth: expected.border.boder_bottom_width,
          boderTopColor: expected.border.boder_top_color,
          boderTopStyle: expected.border.boder_top_style,
          boderTopWidth: expected.border.boder_top_width,
          boderLeftColor: expected.border.boder_left_color,
          boderLeftStyle: expected.border.boder_left_style,
          boderLeftWidth: expected.border.boder_left_width,
          boderRightColor: expected.border.boder_right_color,
          boderRightStyle: expected.border.boder_right_style,
          boderRightWidth: expected.border.boder_right_width,
        }),
      );

      // verify block trong page policy trên SF
      await storefront.goto(`https://${conf.suiteConf.domain}/policies/${conf.caseConf.pages[0].handle}`);
      await storefront.waitForLoadState("load");
      const sfLoc = storefront.locator(wbWebsitePages.getXpathBlockPageSF(conf.caseConf.input_content, "paragraph"));
      const cssValueSF = await wbWebsitePagesPreview.getCSSValue(sfLoc);

      await expect(
        wbWebsitePagesPreview.genLoc(wbWebsitePages.getXpathBlockPageSF(conf.caseConf.input_content, "paragraph")),
      ).toHaveText(conf.caseConf.input_content);

      expect(cssValueSF).toEqual(
        expect.objectContaining({
          backgroundColor: expected.background_color,
          boderBottomColor: expected.border.boder_bottom_color,
          boderBottomStyle: expected.border.boder_bottom_style,
          boderBottomWidth: expected.border.boder_bottom_width,
          boderTopColor: expected.border.boder_top_color,
          boderTopStyle: expected.border.boder_top_style,
          boderTopWidth: expected.border.boder_top_width,
          boderLeftColor: expected.border.boder_left_color,
          boderLeftStyle: expected.border.boder_left_style,
          boderLeftWidth: expected.border.boder_left_width,
          boderRightColor: expected.border.boder_right_color,
          boderRightStyle: expected.border.boder_right_style,
          boderRightWidth: expected.border.boder_right_width,
        }),
      );

      await storefront.close();
    });

    await test.step(`Click vào block Policy`, async () => {
      await wbWebsitePages.frameLocator.locator(wbWebsitePages.xpathBlockPolicies).click();
      await expect(wbWebsitePages.quickBarButton("Hide")).toBeVisible();
      await expect(wbWebsitePages.quickBarButton("Delete")).toBeVisible();
      await expect(wbWebsitePages.quickBarButton("Duplicate")).toBeVisible();
      await expect(wbWebsitePages.genLoc(wbWebsitePages.getXpathByText("Delete block"))).toBeVisible();
    });

    await test.step(`Mở Layer, hover vào block Policy`, async () => {
      await wbWebsitePages.backToLayerBtn.click();
      await wbWebsitePages.expandCollapseLayer({
        sectionName: "Section",
        isExpand: true,
      });

      const blockLayerSelector = wbWebsitePages.getSidebarSelectorByName({
        sectionName: "Section",
        subLayerName: "Policies",
      });

      await wbWebsitePages.genLoc(blockLayerSelector).hover();
      await expect(wbWebsitePages.genLoc(wbWebsitePages.getXpathBtnHideInLayer(blockLayerSelector))).toBeVisible();
    });

    await test.step(`Click btn Exit.
    - vào trang detail một page khác.
    - Click btn Customize trong trang detail`, async () => {
      await wbWebsitePages.genLoc(XpathNavigationButtons["exit"]).click();
      await wbWebsitePages.page.waitForSelector(otherPage.buttonBackToListPages);
      await wbWebsitePages.genLoc(otherPage.buttonBackToListPages).click();
      await wbWebsitePages.page.waitForSelector(otherPage.getXpathPageByTitle(conf.caseConf.pages[1].title));
      await wbWebsitePages.genLoc(otherPage.getXpathPageByTitle(conf.caseConf.pages[1].title)).click();

      await wbWebsitePages.clickOnBtnWithLabel("Customize");
      await wbWebsitePages.genLoc(wbWebsitePages.overlay).waitFor({ state: "hidden" });
      await wbWebsitePages.genLoc("#v-progressbar").waitFor({ state: "detached" });

      await expect(wbWebsitePages.genLoc(wbWebsitePages.xpathTitlePageInNavBar)).toContainText(
        conf.caseConf.pages[1].title,
      );
      await expect(wbWebsitePages.frameLocator.locator(wbWebsitePages.xpathTitleBlockPolicies)).toContainText(
        conf.caseConf.pages[1].expected_title,
      );
      await expect(wbWebsitePages.frameLocator.locator(wbWebsitePages.xpathContentBlockPolicies)).toContainText(
        conf.caseConf.pages[1].expected_content,
      );

      const wbBlock = wbWebsitePages.frameLocator.locator(
        `${blockParagraph}//section//p[normalize-space()='${conf.caseConf.input_content}']`,
      );
      await expect(wbBlock).toBeHidden();
    });

    await test.step(`Edit style, content block Policy`, async () => {
      await wbWebsitePages.frameLocator.locator(wbWebsitePages.xpathBlockPolicies).click();
      const blockSetting = conf.caseConf.data.blockSetting;
      await wbWebsitePages.setBackground("background", blockSetting.background);
      await wbWebsitePages.setBorder("border", blockSetting.border);
      await wbWebsitePages.setMarginPadding("padding", blockSetting.padding);
      await wbWebsitePages.titleBar.click({ delay: 500 });
      const wbBlock = wbWebsitePages.frameLocator.locator(wbWebsitePages.xpathBlockPolicies);
      const cssValue = await wbWebsitePages.getCSSValue(wbBlock);

      expect(cssValue).toEqual(
        expect.objectContaining({
          backgroundColor: expected.background_color,
          boderBottomColor: expected.border.boder_bottom_color,
          boderBottomStyle: expected.border.boder_bottom_style,
          boderBottomWidth: expected.border.boder_bottom_width,
          boderTopColor: expected.border.boder_top_color,
          boderTopStyle: expected.border.boder_top_style,
          boderTopWidth: expected.border.boder_top_width,
          boderLeftColor: expected.border.boder_left_color,
          boderLeftStyle: expected.border.boder_left_style,
          boderLeftWidth: expected.border.boder_left_width,
          boderRightColor: expected.border.boder_right_color,
          boderRightStyle: expected.border.boder_right_style,
          boderRightWidth: expected.border.boder_right_width,
          paddingTop: expected.padding.padding_top,
          paddingBottom: expected.padding.padding_bottom,
          paddingLeft: expected.padding.padding_left,
          paddingRight: expected.padding.padding_right,
        }),
      );

      // verify block khi preview
      await wbWebsitePages.clickOnBtnWithLabel("Save");
      await expect(wbWebsitePages.toastMessage).toContainText("All changes are saved");
      storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });
      await storefront.locator("#v-progressbar").waitFor({ state: "detached" });
      await storefront.locator(sectionSelector).waitFor({ state: "visible" });

      const wbWebsitePagesPreview = new WbWebsitePages(storefront, conf.suiteConf.domain);
      const previewSF = storefront.locator(wbWebsitePages.xpathBlockPolicies);
      const cssValuePreview = await wbWebsitePagesPreview.getCSSValue(previewSF);

      expect(cssValuePreview).toEqual(
        expect.objectContaining({
          backgroundColor: expected.background_color,
          boderBottomColor: expected.border.boder_bottom_color,
          boderBottomStyle: expected.border.boder_bottom_style,
          boderBottomWidth: expected.border.boder_bottom_width,
          boderTopColor: expected.border.boder_top_color,
          boderTopStyle: expected.border.boder_top_style,
          boderTopWidth: expected.border.boder_top_width,
          boderLeftColor: expected.border.boder_left_color,
          boderLeftStyle: expected.border.boder_left_style,
          boderLeftWidth: expected.border.boder_left_width,
          boderRightColor: expected.border.boder_right_color,
          boderRightStyle: expected.border.boder_right_style,
          boderRightWidth: expected.border.boder_right_width,
          paddingTop: expected.padding.padding_top,
          paddingBottom: expected.padding.padding_bottom,
          paddingLeft: expected.padding.padding_left,
          paddingRight: expected.padding.padding_right,
        }),
      );

      // verify block trong page policy trên SF
      await storefront.goto(`https://${conf.suiteConf.domain}/policies/${conf.caseConf.pages[1].handle}`);
      await storefront.waitForLoadState("load");
      const sfLoc = storefront.locator(wbWebsitePages.xpathBlockPolicies);
      const cssValueSF = await wbWebsitePagesPreview.getCSSValue(sfLoc);

      expect(cssValueSF).toEqual(
        expect.objectContaining({
          backgroundColor: expected.background_color,
          boderBottomColor: expected.border.boder_bottom_color,
          boderBottomStyle: expected.border.boder_bottom_style,
          boderBottomWidth: expected.border.boder_bottom_width,
          boderTopColor: expected.border.boder_top_color,
          boderTopStyle: expected.border.boder_top_style,
          boderTopWidth: expected.border.boder_top_width,
          boderLeftColor: expected.border.boder_left_color,
          boderLeftStyle: expected.border.boder_left_style,
          boderLeftWidth: expected.border.boder_left_width,
          boderRightColor: expected.border.boder_right_color,
          boderRightStyle: expected.border.boder_right_style,
          boderRightWidth: expected.border.boder_right_width,
          paddingTop: expected.padding.padding_top,
          paddingBottom: expected.padding.padding_bottom,
          paddingLeft: expected.padding.padding_left,
          paddingRight: expected.padding.padding_right,
        }),
      );
      await storefront.close();
    });

    await test.step(`Xóa block khác block Policy trong page`, async () => {
      await wbWebsitePages.genLoc(XpathNavigationButtons["exit"]).click();
      await wbWebsitePages.page.waitForSelector(otherPage.buttonBackToListPages);
      await wbWebsitePages.genLoc(otherPage.buttonBackToListPages).click();
      await wbWebsitePages.page.waitForSelector(otherPage.getXpathPageByTitle(conf.caseConf.pages[0].title));
      await wbWebsitePages.genLoc(otherPage.getXpathPageByTitle(conf.caseConf.pages[0].title)).click();

      await wbWebsitePages.clickOnBtnWithLabel("Customize");
      await wbWebsitePages.genLoc(wbWebsitePages.overlay).waitFor({ state: "hidden" });
      await wbWebsitePages.genLoc("#v-progressbar").waitFor({ state: "detached" });
      const xpathBlockParagraph = wbWebsitePages.getXpathBlockPageSF(conf.caseConf.input_content, "paragraph");
      const blockLayerSelector = wbWebsitePages.getSidebarSelectorByName({
        sectionName: sectionName,
      });

      await wbWebsitePages.genLoc(blockLayerSelector).click();
      await wbWebsitePages.genLoc(wbWebsitePages.getXpathByText("Delete section")).click();
      await expect(wbWebsitePages.frameLocator.locator(xpathBlockParagraph)).toBeHidden();
      await expect(wbWebsitePages.frameLocator.locator(`(${xpathBlockParagraph}//ancestor::section)[1]`)).toBeHidden();

      await wbWebsitePages.clickOnBtnWithLabel("Save");
      await expect(wbWebsitePages.toastMessage).toContainText("All changes are saved");

      // verify không hiển thị section đã xóa khi preview
      storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });

      await storefront.waitForLoadState("load");
      await expect(storefront.locator(xpathBlockParagraph)).toBeHidden();
      await expect(storefront.locator(`(${xpathBlockParagraph}//ancestor::section)[1]`)).toBeHidden();

      // verify không hiển thị section đã xóa ở SF page policy
      await storefront.goto(`https://${conf.suiteConf.domain}/policies/${conf.caseConf.pages[0].handle}`);
      await storefront.waitForLoadState("load");

      await expect(storefront.locator(xpathBlockParagraph)).toBeHidden();
      await expect(storefront.locator(`(${xpathBlockParagraph}//ancestor::section)[1]`)).toBeHidden();
    });
  });

  test(`@SB_NEWECOM_NEPM_20 Tab Policy Pages_Kiểm tra gán biến page.title, page.description vào block text khi customize page policy`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const addSection = conf.suiteConf.add_blank_section;
    const indexSection = addSection.to.position.section;
    const dataVariable = conf.caseConf.data;

    await test.step(`Precondition: edit page status bằng api`, async () => {
      const status = conf.caseConf.edit_policy_page;
      const result = await otherPage.editPolcyPageByApi(conf.caseConf.edit_policy_page);
      expect(result.visible_page).toEqual(
        expect.objectContaining({
          refund_policy: status.visible_page.refund_policy,
        }),
      );
    });

    await test.step(`Click button Customize 1 page bất kì`, async () => {
      await otherPage.genLoc(otherPage.getXpathButtonCustomizeByTitle(conf.caseConf.page_title)).click();
      await otherPage.genLoc(wbWebsitePages.overlay).waitFor({ state: "hidden" });
      await otherPage.genLoc("#v-progressbar").waitFor({ state: "detached" });

      await expect(wbWebsitePages.genLoc(wbWebsitePages.xpathTitlePageInNavBar)).toContainText(
        conf.caseConf.page_title,
      );

      await expect(wbWebsitePages.frameLocator.locator(wbWebsitePages.xpathBlockPolicies)).toContainText(
        conf.caseConf.exp_content_title,
      );
    });

    await test.step(`- Add 1 block Heading vào page.
    - Click "Edit text" ở quick bar và chọn Get text from và chọn biến`, async () => {
      await wbWebsitePages.dragAndDropInWebBuilder(addSection);

      for (let i = 0; i < dataVariable.length; i++) {
        sectionSetting = conf.caseConf.section[0];

        await wbWebsitePages.dragAndDropInWebBuilder(sectionSetting.dnd_block);
        await wbWebsitePages.selectOptionOnQuickBar("Edit text");
        await pressControl(wbWebsitePages.page, "A");

        await setVariableOnQuickbar(
          conf.suiteConf,
          dashboard,
          conf.caseConf.source_type_section,
          dataVariable[i].variable,
        );
        await wbWebsitePages.backBtn.click({
          delay: 1000,
        });
        const blockSelector = wbWebsitePages.getSelectorByIndex({ section: indexSection, block: 1 });
        const text = await wbWebsitePages.frameLocator.locator(blockSelector).innerText();
        expect(text).toContain(dataVariable[i].value);
      }

      await wbWebsitePages.clickOnBtnWithLabel("Save");
      await expect(wbWebsitePages.toastMessage).toContainText("All changes are saved");

      // verify data block khi preview
      storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });

      expect(
        await storefront.innerText(wbWebsitePages.getXpathBlockTextVariable("heading", dataVariable[0].key)),
      ).toContain(dataVariable[0].value);
      expect(
        await storefront.innerText(wbWebsitePages.getXpathBlockTextVariable("heading", dataVariable[1].key)),
      ).toContain(dataVariable[1].value);

      // verify data source trong page policy ở SF
      await storefront.goto(`https://${conf.suiteConf.domain}/policies/${conf.caseConf.handle}`);
      await storefront.waitForLoadState("load");
      expect(
        await storefront.innerText(wbWebsitePages.getXpathBlockTextVariable("heading", dataVariable[0].key)),
      ).toContain(dataVariable[0].value);
      expect(
        await storefront.innerText(wbWebsitePages.getXpathBlockTextVariable("heading", dataVariable[1].key)),
      ).toContain(dataVariable[1].value);

      await storefront.close();
    });

    await test.step(`- Add 1 block Paragraph vào page.
    - Click "Edit text" ở quick bar và chọn Get text from và chọn biến`, async () => {
      for (let i = 0; i < dataVariable.length; i++) {
        sectionSetting = conf.caseConf.section[1];

        await wbWebsitePages.dragAndDropInWebBuilder(sectionSetting.dnd_block);
        await wbWebsitePages.selectOptionOnQuickBar("Edit text");
        await pressControl(wbWebsitePages.page, "A");

        await setVariableOnQuickbar(
          conf.suiteConf,
          dashboard,
          conf.caseConf.source_type_section,
          dataVariable[i].variable,
        );
        await wbWebsitePages.backBtn.click({
          delay: 1000,
        });
        const blockSelector = wbWebsitePages.getSelectorByIndex({ section: indexSection, block: 1 });
        expect(await wbWebsitePages.frameLocator.locator(blockSelector).innerText()).toContain(dataVariable[i].value);
      }
      await wbWebsitePages.clickOnBtnWithLabel("Save");
      await expect(wbWebsitePages.toastMessage).toContainText("All changes are saved");

      // verify data block khi preview
      storefront = await verifyRedirectUrl({
        page: dashboard,
        selector: XpathNavigationButtons["preview"],
        redirectUrl: "?theme_preview_id",
        context,
      });

      expect(
        await storefront.innerText(wbWebsitePages.getXpathBlockTextVariable("paragraph", dataVariable[0].key)),
      ).toContain(dataVariable[0].value);
      expect(
        await storefront.innerText(wbWebsitePages.getXpathBlockTextVariable("paragraph", dataVariable[1].key)),
      ).toContain(dataVariable[1].value);

      // verify data source trong page policy ở SF
      await storefront.goto(`https://${conf.suiteConf.domain}/policies/${conf.caseConf.handle}`);
      await storefront.waitForLoadState("load");
      expect(
        await storefront.innerText(wbWebsitePages.getXpathBlockTextVariable("paragraph", dataVariable[0].key)),
      ).toContain(dataVariable[0].value);
      expect(
        await storefront.innerText(wbWebsitePages.getXpathBlockTextVariable("paragraph", dataVariable[1].key)),
      ).toContain(dataVariable[1].value);
    });
  });

  test(`@SB_NEWECOM_NEPM_22 Tab Policy Pages_Kiểm tra preview page và view page ở SF với các page policy`, async ({
    conf,
    context,
  }) => {
    let preview: Page;
    await test.step(`Precondition: edit page status bằng api`, async () => {
      const status = conf.caseConf.edit_policy_page;
      const result = await otherPage.editPolcyPageByApi(conf.caseConf.edit_policy_page);
      expect(result.visible_page).toEqual(
        expect.objectContaining({
          shipping_policy: status.visible_page.shipping_policy,
          terms_of_service: status.visible_page.terms_of_service,
        }),
      );
    });

    for (const page of conf.caseConf.pages) {
      await test.step(`Tại tab Policy Pages, click icon Preview của page `, async () => {
        await otherPage.genLoc(otherPage.getXpathPageByTitle(page.title)).hover();
        [preview] = await Promise.all([
          context.waitForEvent("page"),
          otherPage.genLoc(otherPage.getPreviewButtonOfPage(page.title)).first().click(),
        ]);
        await preview.waitForLoadState("load");
        expect(preview.url()).toContain(`https://${conf.suiteConf.domain}/policies/${page.handle}`);

        // check xpath block policy chứa đoạn text
        await expect(preview.locator(wbWebsitePages.xpathTitleBlockPolicies)).toContainText(`${page.expected_title}`);
        await expect(preview.locator(wbWebsitePages.xpathContentBlockPolicies)).toContainText(
          `${page.expected_content}`,
        );
      });

      await test.step(`Truy cập page ở SF bằng url`, async () => {
        await preview.goto(`https://${conf.suiteConf.domain}/policies/${page.handle}`);
        await preview.waitForLoadState("load");

        // check xpath block policy chứa đoạn text
        await expect(preview.locator(wbWebsitePages.xpathTitleBlockPolicies)).toContainText(`${page.expected_title}`);
        await expect(preview.locator(wbWebsitePages.xpathContentBlockPolicies)).toContainText(
          `${page.expected_content}`,
        );
        await preview.close();
      });
    }
  });

  test(`@SB_NEWECOM_NEPM_25 Tab Policy Pages_Kiểm tra edit page thành công tại trang detail page policy shop SB`, async ({
    conf,
  }) => {
    await test.step(`Precondition: edit page status bằng api`, async () => {
      const status = conf.caseConf.edit_policy_page;
      const result = await otherPage.editPolcyPageByApi(conf.caseConf.edit_policy_page);
      expect(result.visible_page).toEqual(
        expect.objectContaining({
          terms_of_service: status.visible_page.terms_of_service,
        }),
      );
    });

    await test.step(` - Mở detail 1 page policy
  - Edit Seo&Social Sharing của Page
  - Click Save`, async () => {
      await dashboardPage.genLoc(otherPage.getXpathPageByTitle(conf.caseConf.page_title)).click();
      await dashboardPage
        .genLoc(otherPage.getTextboxOnPageDetail("Page title"))
        .fill(conf.caseConf.edit_seo.page_title);
      await dashboardPage.genLoc(otherPage.descriptionPageTextArea).fill(conf.caseConf.edit_seo.page_description);

      await dashboardPage.genLoc(otherPage.buttonSavePageDetail).click();
      expect(await otherPage.getTextOfToast("success")).toEqual(conf.caseConf.toast_success);

      const valueFieldPageTitle = await dashboardPage.getValueContent(otherPage.getTextboxOnPageDetail("Page title"));
      expect(valueFieldPageTitle).toEqual(conf.caseConf.edit_seo.page_title);

      const valueFieldPageDescription = await dashboardPage.getValueContent(otherPage.descriptionPageTextArea);
      expect(valueFieldPageDescription).toEqual(conf.caseConf.edit_seo.page_description);
    });

    await test.step(`- Tại trang detail page trong dashboard, chọn Page status = Hidden
  - Click Save
  - Back ra ngoài màn List tab Policy Page và filter Visible`, async () => {
      await otherPage.clickChangePageStatus("Hidden");
      await dashboardPage.genLoc(otherPage.buttonSavePageDetail).click();
      expect(await otherPage.getTextOfToast("success")).toEqual(conf.caseConf.toast_success);

      await dashboardPage.genLoc(otherPage.buttonBackToListPages).click();
      await dashboardPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);
      await dashboardPage.genLoc(otherPage.getXpathFilterTab("Hidden")).click();
      await dashboardPage.waitUtilSkeletonDisappear();
      await expect(dashboardPage.genLoc(otherPage.getXpathPageByTitle(conf.caseConf.page_title))).toBeVisible();
    });

    await test.step(`- Mở lại detail page trên
  - Chọn Page status = Visible
  - Click Save
  - Back ra ngoài màn List tab Policy Page và filter Visible`, async () => {
      await dashboardPage.genLoc(otherPage.getXpathPageByTitle(conf.caseConf.page_title)).click();
      await otherPage.clickChangePageStatus("Visible");
      await dashboardPage.genLoc(otherPage.buttonSavePageDetail).click();
      expect(await otherPage.getTextOfToast("success")).toEqual(conf.caseConf.toast_success);

      await dashboardPage.genLoc(otherPage.buttonBackToListPages).click();
      await dashboardPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);
      await dashboardPage.genLoc(otherPage.getXpathFilterTab("Visible")).click();
      await dashboardPage.waitUtilSkeletonDisappear();
      await expect(dashboardPage.genLoc(otherPage.getXpathPageByTitle(conf.caseConf.page_title))).toBeVisible();
    });
  });
});
