import { test } from "@fixtures/website_builder";
import { expect, FrameLocator, Page } from "@playwright/test";
import { ClickType, WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import type { Snapshot } from "./collection_list";
import { CollectionAPI } from "@pages/api/dashboard/collection";
import { XpathBlock } from "@constants/web_builder";
import { SFHome } from "@sf_pages/homepage";
import { clickPreviewButton } from "../../variable/variable-util";
import { waitTimeout } from "@utils/api";
import {
  addCollectionToBlock,
  changeButtonStyle,
  changeColor,
  changeDesign,
  changeLayout,
  changePage,
  dragAndDropCollection,
  editCollectionItem,
  getPosition,
  previewBlockOnSf,
  selector,
  settingLayout,
  verifyBlockWithLayoutAfterResizing,
} from "./utils";
import { getStyle } from "tests/modules/new_ecom/storefront/pages/collection_detail/collection-util";
import { loadData } from "@core/conf/conf";
import { WebBuilderCollectionList } from "@pages/dashboard/wb_collection_list";
import { ShopTheme } from "@types";

test.describe("Verify block Collection list ", () => {
  test.slow();
  let domain,
    collectionApi: CollectionAPI,
    webBuilder: WebBuilder,
    duplicatedTheme: ShopTheme,
    themeId,
    block: Blocks,
    frameLocator: FrameLocator,
    snapshot: Snapshot,
    newBlockId,
    newBlockSelector;

  test.beforeEach(async ({ dashboard, theme, conf, authRequest }, testInfo) => {
    const {
      block_data: { section_index: sectionIdx, block_index: blockIdx },
    } = conf.suiteConf;

    domain = conf.suiteConf.domain;

    webBuilder = new WebBuilder(dashboard, domain);
    block = new Blocks(dashboard, domain);
    snapshot = conf.caseConf.expect?.snapshot || {};
    frameLocator = block.frameLocator;
    newBlockSelector = webBuilder.getSelectorByIndex({ section: sectionIdx, block: blockIdx });
    collectionApi = new CollectionAPI(domain, authRequest);

    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    await test.step("Duplicate and publish theme", async () => {
      duplicatedTheme = await theme.duplicate(conf.suiteConf.site_id);
      themeId = duplicatedTheme.id;
      await theme.publish(themeId);
    });

    await test.step("Open WB", async () => {
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "home" });
      await webBuilder.loadingScreen.waitFor();
      await webBuilder.loadingScreen.waitFor({ state: "hidden" });
      await webBuilder.frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
    });

    if (conf.caseName != "SB_SC_SCWB_211") {
      await test.step("Dnd block collection list vào section", async () => {
        await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.dnd_block);
        await frameLocator.locator(newBlockSelector).click();
        newBlockId = await block.getAttrsDataId();
        newBlockSelector = `section[block-id='${newBlockId}']`;
      });
    }
  });

  test.afterEach(async ({ theme, conf }) => {
    await test.step("Restore data theme", async () => {
      const listTemplate = [];
      const currentTheme = await theme.getPublishedTheme();
      if (currentTheme.id !== conf.suiteConf.site_id) {
        await theme.publish(conf.suiteConf.site_id);
      }
      const listTheme = await theme.list();
      listTheme.forEach(template => {
        if (!template.active) {
          listTemplate.push(template.id);
        }
      });
      if (listTemplate.length > 0) {
        for (const template of listTemplate) {
          if (template !== conf.suiteConf.site_id) {
            await theme.delete(template);
          }
        }
      }
    });
  });

  test(`@SB_SC_SCWB_213 Collection list_Check block Collection list trên mobile`, async ({
    pageMobile,
    conf,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step(`Precondition: add collection cho block collection list`, async () => {
      await webBuilder.page.locator("[id$='Mobile']").click();
      await webBuilder.switchToTab("Content");
      await expect(dashboard.locator(selector.btnSelectCollection)).toBeVisible();
      await addCollectionToBlock(dashboard, conf.caseConf.collection_name);
    });

    await test.step(`Set 1 bộ data cho block collection list `, async () => {
      await webBuilder.switchToTab("Design");
      await changeDesign(webBuilder, conf.caseConf.data.style);
      await webBuilder.clickSaveButton();
      await webBuilder.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: `[block-id='${newBlockId}']`,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-${snapshot.mobile_preview}`,
      });
    });

    await test.step(`View SF trên mobile`, async () => {
      const homePage = new SFHome(pageMobile, domain);
      await homePage.gotoHomePage();
      await waitForImageLoaded(pageMobile, newBlockSelector);
      await waitTimeout(1000); // wait for fade in animation
      await snapshotFixture.verifyWithAutoRetry({
        page: homePage.page,
        selector: newBlockSelector,
        snapshotName: `${process.env.ENV}-${snapshot.mobile_sf}`,
      });
    });
  });

  test(`@SB_SC_SCWB_212 Collection list_Check data của block collection list apply thay đổi khi edit/delete/make unavailable collection trong dashboard`, async ({
    dashboard,
    context,
    conf,
  }) => {
    test.slow();
    let collection;
    //add collection cho block collection list
    await test.step(`Precondition: add collection cho block collection list`, async () => {
      await webBuilder.switchToTab("Content");
      await expect(dashboard.locator(selector.btnSelectCollection)).toBeVisible();
      await addCollectionToBlock(dashboard, conf.caseConf.collection_name);
    });

    await test.step(`Vào dashboard > Collection: tạo mới collection 5 gồm 3 product {A, B , C}; tick: Show on collection list page http://joxi.ru/Dr8b9yziDWgbG2`, async () => {
      const payload = conf.caseConf.data.collection_payload;
      const { custom_collection: customCollection } = await collectionApi.create(JSON.stringify(payload));
      collection = customCollection;
      expect(collection.title).toEqual(payload.custom_collection.title);
    });

    await test.step(`Select collection 5 cho block collection list`, async () => {
      await webBuilder.switchToTab("Content");
      await expect(dashboard.locator(selector.btnSelectCollection)).toBeVisible();
      await addCollectionToBlock(dashboard, [collection.title]);
    });

    await test.step(`Click button preview trên header`, async () => {
      const sfPage = await clickPreviewButton({ context, dashboard });
      await sfPage.locator(XpathBlock.progressBar).waitFor({ state: "detached" });
      await sfPage.locator(newBlockSelector).waitFor({ state: "visible" });
      await expect(sfPage.locator(selector.collectionTitle(newBlockId)).last()).toHaveText(collection.title);
      await sfPage.close();
    });

    await test.step(`Vào dashboard > Collection > Collection 5: edit collection 5`, async () => {
      const { update_collection: newCollection } = conf.caseConf.data;
      Object.assign(collection, newCollection);
      const updatePayload = {
        custom_collection: collection,
        is_create_redirect: false,
      };
      const { custom_collection: customCollection } = await collectionApi.update(collection.id, updatePayload);
      collection = customCollection;
      expect(collection?.title || "").toEqual(newCollection.title);
      expect(collection?.body_html || "").toEqual(newCollection.body_html);
    });

    await test.step(`Customize theme > Collection list block`, async () => {
      await dashboard.reload();
      await dashboard.locator(block.overlay).waitFor({ state: "hidden" });
      await frameLocator.locator(newBlockSelector).click();
      await webBuilder.switchToTab("Content");
      await expect(dashboard.locator(selector.collectionItem(collection.title))).toBeVisible();
    });

    await test.step(`Click button preview trên header`, async () => {
      const sfPage = await clickPreviewButton({ context, dashboard });
      await sfPage.locator(XpathBlock.progressBar).waitFor({ state: "detached" });
      await sfPage.locator(newBlockSelector).waitFor({ state: "visible" });
      await expect(sfPage.locator(selector.collectionTitle(newBlockId)).last()).toHaveText(collection.title);
      await sfPage.close();
    });

    await test.step(`Xóa collection trong dashboard`, async () => {
      await collectionApi.delete(collection.id);
    });

    await test.step(`Customize theme > Collection list block`, async () => {
      await dashboard.reload();
      await dashboard.locator(block.overlay).waitFor({ state: "hidden" });
      await frameLocator.locator(newBlockSelector).waitFor({ state: "visible" });
      await expect(frameLocator.locator(selector.collectionTitle(newBlockId)).last()).toHaveText(
        conf.caseConf.expect.last_collection_title,
      );
    });

    await test.step(`Click button preview trên header`, async () => {
      const sfPage = await clickPreviewButton({ context, dashboard });
      await sfPage.locator(XpathBlock.progressBar).waitFor({ state: "detached" });
      await sfPage.locator(newBlockSelector).waitFor({ state: "visible" });
      await expect
        .soft(sfPage.locator(selector.collectionTitle(newBlockId)).last())
        .toHaveText(conf.caseConf.expect.last_collection_title);
      await sfPage.close();
    });
  });

  test(`@SB_SC_SCWB_211 Collection list_Check block collection list tại trang all collection`, async ({
    dashboard,
    context,
    conf,
    snapshotFixture,
  }) => {
    let sfPage: Page;
    let blockId, newBlockSelector;

    const domain = conf.suiteConf.domain;
    const webBuilder = new WebBuilderCollectionList(dashboard, domain);
    const block = new Blocks(dashboard, domain);
    const snapshot = conf.caseConf.expect?.snapshot || {};
    const { style, collection } = conf.caseConf.data;

    await test.step(`Open trang All collection `, async () => {
      await changePage(dashboard, "collections");
      await webBuilder.page.locator(selector.xpathLayer).click();
      await webBuilder.frameLocator.locator(selector.xpathCollectionList).click();
      blockId = await block.getAttrsDataId();
      newBlockSelector = webBuilder.getElementById(blockId, ClickType.BLOCK);
      await expect(dashboard.locator(webBuilder.sidebarTitle)).toHaveText("Collection list");
    });

    await test.step(`Mở tab design`, async () => {
      await webBuilder.switchToTab("Design");
      await webBuilder.page.locator(selector.buttonLayout).last().click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: selector.xpathListCollection,
        snapshotName: `${process.env.ENV}-${snapshot.layout}`,
      });
      await webBuilder.page.locator(selector.buttonLayout).last().click();
    });

    await test.step(`Set 1 bộ data cho block collection list tại trang All collections`, async () => {
      await changeDesign(webBuilder, style, true);
      await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe, false);
      await webBuilder.backBtn.click();
      await webBuilder.page.waitForTimeout(5000);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: `[block-id='${blockId}']`,
        snapshotName: `${process.env.ENV}-${snapshot.wb_preview}`,
        iframe: webBuilder.iframe,
      });
    });

    await test.step(`Nhấn save, click preview button`, async () => {
      await webBuilder.clickSaveButton();
      sfPage = await clickPreviewButton({ context, dashboard });
      await previewBlockOnSf(sfPage, snapshotFixture, `[block-id='${blockId}']`, `${snapshot.sf_preview}`);
    });

    await test.step(`Click 1 collection trên trang all collection`, async () => {
      await sfPage.locator(`//h2[contains(text(), '${collection}')]`).first().click();
      await sfPage.locator(XpathBlock.progressBar).waitFor({ state: "detached" });
      const collectionTitle = await sfPage.locator(selector.xpathCollectionTitle).first().textContent();
      expect(collectionTitle).toEqual(collection);
      await sfPage.close();
    });

    await test.step(`Dashboard: Switch device desktop sang mobile`, async () => {
      await webBuilder.page.locator("[id$='Mobile']").click();
      await webBuilder.frameLocator.locator(selector.xpathCollectionList).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.page.waitForTimeout(3000);
      await webBuilder.page.locator(selector.buttonLayout).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: selector.xpathListCollection,
        snapshotName: `${process.env.ENV}-${snapshot.layout_mobile}`,
      });
    });
  });

  test(`@SB_SC_SCWB_210 Collection list_Check block collection list với 1 bộ data common`, async ({
    dashboard,
    context,
    conf,
    snapshotFixture,
  }) => {
    //add collection cho block collection list
    await test.step(`Precondition: add collection cho block collection list`, async () => {
      await webBuilder.switchToTab("Content");
      await expect(dashboard.locator(selector.btnSelectCollection)).toBeVisible();
      await addCollectionToBlock(dashboard, conf.caseConf.collection_name);
    });

    await test.step(`Set 1 bộ data cho các filed, nhấn save`, async () => {
      await webBuilder.switchToTab("Design");
      await changeDesign(webBuilder, conf.caseConf.data.common_style);
      await webBuilder.clickSaveButton();
      await webBuilder.backBtn.click();
      await webBuilder.page.waitForTimeout(1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: `[block-id='${newBlockId}']`,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-${snapshot.dashboard_common_style}`,
      });
    });

    await test.step(`Nhấn save, click preview button`, async () => {
      const sfPage = await clickPreviewButton({ context, dashboard });
      await previewBlockOnSf(sfPage, snapshotFixture, newBlockSelector, snapshot.common_style);
    });
  });

  test(`@SB_SC_SCWB_209 Collection list_Check trường content button`, async ({ dashboard, context, conf }) => {
    const buttonLabel = conf.caseConf.data.button_content;
    await test.step(`thêm button content`, async () => {
      await webBuilder.switchToTab("Content");
      await expect(dashboard.locator(selector.btnSelectCollection)).toBeVisible();
      await webBuilder.inputTextBox("button_content_label", buttonLabel);
      await expect(frameLocator.locator(`[block-id='${newBlockId}'] button`).first()).toBeVisible();
      await webBuilder.switchToTab("Design");
    });

    const { button_styles: buttonStyles, style } = conf.caseConf.data;
    for (const key of buttonStyles) {
      await test.step(`Chọn button = ${key}`, async () => {
        await changeButtonStyle(webBuilder, style[key]);
        const classBtnAttribute = await frameLocator
          .locator(`[block-id='${newBlockId}'] button`)
          .first()
          .getAttribute("class");
        await expect(classBtnAttribute).toContain(conf.caseConf.expect.class[key]);
      });

      await test.step(`Nhấn save, click preview button`, async () => {
        await webBuilder.clickSaveButton();
        const sfPage = await clickPreviewButton({ context, dashboard });
        await sfPage.locator(XpathBlock.progressBar).waitFor({ state: "detached" });
        await sfPage.locator(newBlockSelector).waitFor({ state: "visible" });
        const classAttribute = await sfPage.locator(`[block-id='${newBlockId}'] button`).first().getAttribute("class");
        await expect(classAttribute).toContain(conf.caseConf.expect.class[key]);
        await sfPage.close();
      });
    }

    await test.step(`set button content về default`, async () => {
      await webBuilder.switchToTab("Content");
      await expect(dashboard.locator(selector.btnSelectCollection)).toBeVisible();
      await webBuilder.inputTextBox("button_content_label", "");
      await frameLocator.locator(`[block-id='${newBlockId}'] button`).first().waitFor({ state: "hidden" });
      await webBuilder.clickSaveButton();
    });
  });

  test(`@SB_SC_SCWB_208 Collection list_Check trường Content background`, async ({ dashboard, context, conf }) => {
    const xpathContentBackground = `(//section[@data-block-id='${newBlockId}']//div[contains(@class,'relative')])[1]`;
    const data = conf.caseConf.data;
    await test.step(`Chọn content background = color 1`, async () => {
      await webBuilder.switchToTab("Design");
      await changeColor(webBuilder, data.color_1.color, data.widget_id);
      await webBuilder.page.waitForTimeout(1000);
      const contentBackground = await getStyle(frameLocator.locator(xpathContentBackground), "--content-background");
      expect(contentBackground).toEqual(data.color_1.expect);
    });

    await test.step(`Nhấn save, click preview button`, async () => {
      await webBuilder.clickSaveButton();
      const sfPage = await clickPreviewButton({ context, dashboard });
      const contentBackground = await getStyle(sfPage.locator(xpathContentBackground), "--content-background");
      expect(contentBackground).toEqual(data.color_1.expect);
      await sfPage.close();
    });

    await test.step(`Chọn content background = none`, async () => {
      await changeColor(webBuilder, data.none.color, data.widget_id);
      await webBuilder.page.locator("//button[normalize-space()='Save']").isEnabled();
      await webBuilder.page.waitForTimeout(1000);
      const contentBackground = await getStyle(frameLocator.locator(xpathContentBackground), "--content-background");
      expect(contentBackground).toEqual(data.none.expect);
    });

    await test.step(`Nhấn save, click preview button`, async () => {
      await webBuilder.clickSaveButton();
      const sfPage = await clickPreviewButton({ context, dashboard });
      const contentBackground = await getStyle(sfPage.locator(xpathContentBackground), "--content-background");
      expect(contentBackground).toEqual(data.none.expect);
      await sfPage.close();
    });

    await test.step(`Chọn layout = Content outside, không set content background`, async () => {
      await changeLayout(webBuilder, "content_outside");
      await webBuilder.page.waitForTimeout(1000);
      const marginContent = await getStyle(
        frameLocator.locator(
          `(//section[@data-block-id='${newBlockId}']//div[contains(@class,'content-wrap--size-small')])[1]`,
        ),
        "margin-top",
      );
      expect(marginContent).toEqual(data.margin_content_outside);
    });

    await test.step(`Nhấn save, click preview button`, async () => {
      await webBuilder.clickSaveButton();
      const sfPage = await clickPreviewButton({ context, dashboard });
      const marginContent = await getStyle(
        sfPage.locator(
          `(//section[@data-block-id='${newBlockId}']//div[contains(@class,'content-wrap--size-small')])[1]`,
        ),
        "margin-top",
      );
      expect(marginContent).toEqual(data.margin_content_outside);
      await sfPage.close();
    });
  });

  test(`@SB_SC_SCWB_207 Collection list_Check trường Content color`, async ({ dashboard, context, conf }) => {
    const { id, color } = conf.caseConf.data.content_color;
    const xpathContentColor = `section[data-block-id='${newBlockId}'] .content-container`;
    await test.step(`Chọn content color = color 2`, async () => {
      await webBuilder.switchToTab("Design");
      await changeColor(webBuilder, color, id);
      await webBuilder.page.waitForTimeout(2000);
      const contentColor = await getStyle(frameLocator.locator(xpathContentColor).first(), "--content-color");
      expect(contentColor).toEqual(conf.caseConf.data.content_color.expect);
    });

    await test.step(`Nhấn save, click preview button`, async () => {
      await webBuilder.clickSaveButton();
      const sfPage = await clickPreviewButton({ context, dashboard });
      const contentColor = await getStyle(sfPage.locator(xpathContentColor).first(), "--content-color");
      expect(contentColor).toEqual(conf.caseConf.data.content_color.expect);
      await sfPage.close();
    });

    await test.step(`Chọn content color = none`, async () => {
      await changeColor(webBuilder, "none", id);
      await webBuilder.page.waitForTimeout(2000);
      await webBuilder.page.locator("//button[normalize-space()='Save']").isEnabled();
      const contentColor = await getStyle(frameLocator.locator(xpathContentColor).first(), "--content-color");
      expect(contentColor).toEqual(conf.caseConf.data.expect_color_none);
    });

    await test.step(`Nhấn save, click preview button`, async () => {
      await webBuilder.clickSaveButton();
      const sfPage = await clickPreviewButton({ context, dashboard });
      const contentColor = await getStyle(sfPage.locator(xpathContentColor).first(), "--content-color");
      expect(contentColor).toEqual(conf.caseConf.data.expect_color_none);
      await sfPage.close();
    });
  });

  test(`@SB_SC_SCWB_206 Collection list_Check trường content position`, async ({ conf, dashboard, context }) => {
    const { horizontal_positions: horizonPositions, vertical_positions: verticalPositions } = conf.caseConf.data;
    for (const vPos of verticalPositions) {
      for (const hPos of horizonPositions) {
        await webBuilder.switchToTab("Design");
        const re = new RegExp(`content-wrap--${vPos}-${hPos}`);
        await test.step(`Chọn content position = ${vPos}-${hPos}`, async () => {
          await webBuilder.changeDesign({ content_position: { position: getPosition(vPos, hPos) } });
          await webBuilder.clickSaveButton();
          await expect(frameLocator.locator(selector.contentWrap(newBlockId)).first()).toHaveClass(re);
        });
        await test.step(`Click preview button`, async () => {
          const sfPage = await clickPreviewButton({ context, dashboard });
          await expect(sfPage.locator(selector.contentWrap(newBlockId)).first()).toHaveClass(re);
          await sfPage.close();
        });
      }
    }
  });

  test(`@SB_SC_SCWB_205 Collection list_Check trường Heading size của block collection list`, async ({
    conf,
    dashboard,
    context,
  }) => {
    const { sizes, widget_id: widgetId } = conf.caseConf.data;
    for (const size of sizes) {
      const re = new RegExp(`${conf.caseConf.expect.class[size]}`);
      await test.step(`Set heading size = ${size}`, async () => {
        await webBuilder.switchToTab("Design");
        await webBuilder.size(widgetId, size.toUpperCase());
        await expect(frameLocator.locator(selector.collectionTitle(newBlockId)).first()).toHaveClass(re);
      });

      await test.step(`Nhấn save, click preview button`, async () => {
        await webBuilder.clickSaveButton();
        const sfPage = await clickPreviewButton({ context, dashboard });
        await expect(sfPage.locator(selector.collectionTitle(newBlockId)).first()).toHaveClass(re);
        await sfPage.close();
      });
    }
  });

  test(`@SB_SC_SCWB_204 Collection list_Check setting Item radius cho block collection list`, async ({
    dashboard,
    conf,
    context,
  }) => {
    await test.step(`Set radius là kí tự hợp lệ > 0 và < 32px`, async () => {
      await webBuilder.switchToTab("Design");
      for (const data of conf.caseConf.data.item_radius_valid) {
        await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
        await webBuilder.editSliderBar(data.id, data.config);
        await webBuilder.page.waitForTimeout(1000); //wait cho data update
        await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
        await webBuilder.clickSaveButton();
        const sfPage = await clickPreviewButton({ context, dashboard });
        await sfPage.locator(newBlockSelector).waitFor();
        const radiusSF = await getStyle(
          sfPage.locator(`(//section[@data-block-id='${newBlockId}']//div[contains(@class,'relative')])[1]`),
          "--items-radius",
        );
        expect(radiusSF).toEqual(data.expect);
        await sfPage.close();
      }
    });

    await test.step(`Set spacing là kí tự không hợp lệ(số < 0, số > 280, chữ cái)`, async () => {
      const data = conf.caseConf.item_radius_no_valid;
      await frameLocator.locator(newBlockSelector).click();
      await webBuilder.switchToTab("Design");
      await webBuilder.editSliderBar(data.id, data.config);
      await webBuilder.page.waitForTimeout(1000);
      await webBuilder.page.locator("//label[normalize-space()='Item radius']").click();
      const inputLocator = dashboard.locator(
        `[data-widget-id="${data.id}"] .sb-slider + .sb-input input[type="number"]`,
      );
      await expect(inputLocator).toHaveValue(conf.caseConf.expect.max_value.toString());
    });
  });

  test(`@SB_SC_SCWB_203 Collection list_Check resize block collection list với các layout`, async ({
    conf,
    snapshotFixture,
  }) => {
    test.slow();
    const {
      block_data: { section_index: sectionIdx, block_index: blockIdx },
    } = conf.suiteConf;
    const wbnewBlockSelector = webBuilder.getSelectorByIndex({ section: sectionIdx, block: blockIdx });

    for (const data of conf.caseConf.step_data) {
      await test.step(`${data.description}`, async () => {
        await frameLocator.locator(newBlockSelector).click();
        await webBuilder.switchToTab("Design");
        await changeLayout(webBuilder, data.layout);
        await webBuilder.page.waitForTimeout(1000); // cho WB update css
        await waitForImageLoaded(webBuilder.page, wbnewBlockSelector, webBuilder.iframe);
        await webBuilder.clickSaveButton();
        await verifyBlockWithLayoutAfterResizing(
          webBuilder,
          snapshotFixture,
          wbnewBlockSelector,
          data.layout,
          data.resize,
        );
      });
    }
  });

  test(`@SB_SC_SCWB_202 Collection list_Check trường Layout của block collection list`, async ({
    dashboard,
    context,
    snapshotFixture,
  }) => {
    await test.step(`Open popup layout`, async () => {
      await webBuilder.switchToTab("Design");
      await webBuilder.page.locator(selector.buttonLayout).first().click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: selector.xpathListCollection,
        snapshotName: "list-6-layout.png",
      });
      await webBuilder.page.locator(selector.buttonLayout).first().click();
    });

    const layouts = ["grid", "slide", "mix", "brick", "content_outside", "image_text"];
    for (const layout of layouts) {
      await test.step(`Set 1 bộ data với layout = ${layout}: Check hiển thị collection list block`, async () => {
        await changeLayout(webBuilder, layout);
      });

      await test.step(`Nhấn save, click preview button`, async () => {
        await webBuilder.page.waitForTimeout(1000);
        await webBuilder.clickSaveButton();
        const sfPage = await clickPreviewButton({ context, dashboard });
        await previewBlockOnSf(sfPage, snapshotFixture, newBlockSelector, snapshot[`layout_${layout}`]);
        await sfPage.close();
      });
    }
  });

  test(`@SB_SC_SCWB_200 Collection list_Check select collection tại tab content của block collection list`, async ({
    dashboard,
    conf,
  }) => {
    const xpathInputCollection = `${selector.popoverAddCollection} input[class*='sb-input__input']`;
    await test.step(`Click mở tab content`, async () => {
      await webBuilder.switchToTab("Content");
      await expect(dashboard.locator(selector.btnSelectCollection)).toBeVisible();
    });

    await test.step(`Click button select collection`, async () => {
      await dashboard.locator(selector.btnSelectCollection).click();
      await expect(dashboard.locator(selector.popoverAddCollection)).toBeVisible();
    });

    await test.step(`Nhập vào search box kí tự không match với collection nào `, async () => {
      await dashboard.locator(xpathInputCollection).click();
      await dashboard.locator(xpathInputCollection).fill(conf.caseConf.data.no_match_title);
      await expect(dashboard.locator(`//div[contains(.//span, 'No search result')]`).first()).toBeVisible();
    });

    await test.step(`Nhập vào search box kí tự có match với collection  `, async () => {
      const title = conf.caseConf.data.match_title;
      await dashboard.locator(xpathInputCollection).fill(title);
      for (const collection of conf.caseConf.collection_list) {
        const collectionItemSelector = `//div[contains(@class, 'sb-selection-item') and contains(.//div, '${collection}')]`;
        await expect(dashboard.locator(collectionItemSelector).first()).toBeVisible();
      }
    });

    await test.step(`Select các collection cho collection list`, async () => {
      await dashboard.locator(selector.btnSelectCollection).click();
      await addCollectionToBlock(dashboard, ["Collection 1"]);
      await expect(dashboard.locator(selector.xpathIconCollection).first()).toBeVisible();
      await expect(dashboard.locator(selector.xpathIconCollection).last()).toBeVisible();
      await expect(dashboard.locator(selector.xpathEditCollection)).toBeVisible();
    });
  });

  test(`@SB_SC_SCWB_199 Collection list_Check setting Button label tại tab content của block collection list`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const { new_label: newLabel } = conf.caseConf.data;
    const buttonLabelSelector = `[block-id='${newBlockId}'] button p`;

    await test.step(`Edit button label`, async () => {
      await webBuilder.switchToTab("Content");
      await webBuilder.inputTextBox("button_content_label", newLabel);
      await expect(frameLocator.locator(buttonLabelSelector).first()).toHaveText(newLabel);
    });

    await test.step(`Nhấn save, click preview button`, async () => {
      await webBuilder.clickSaveButton();
      const sfPage = await clickPreviewButton({ context, dashboard });
      await expect(sfPage.locator(buttonLabelSelector).first()).toHaveText(newLabel);
      await sfPage.close();
    });

    await test.step(`Trong dashboard, sửa button label = rỗng`, async () => {
      await frameLocator.locator(newBlockSelector).click();
      await webBuilder.switchToTab("Content");
      await webBuilder.inputTextBox("button_content_label", "");
      await frameLocator.locator(buttonLabelSelector).first().waitFor({ state: "hidden" });
    });

    await test.step(`Nhấn save, click preview button`, async () => {
      await webBuilder.clickSaveButton();
      const sfPage = await clickPreviewButton({ context, dashboard });
      await sfPage.locator(buttonLabelSelector).first().waitFor({ state: "hidden" });
      await sfPage.close();
    });
  });

  test(`@SB_SC_SCWB_198 Collection list_Check trạng thái default khi add mới block collection list`, async ({
    dashboard,
    snapshotFixture,
    context,
  }) => {
    await test.step(`Tại web builder, add block collection list, check hiển thị default data trên web front`, async () => {
      await dashboard.waitForTimeout(3000);
      await webBuilder.backBtn.click();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: `[block-id='${newBlockId}']`,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-${snapshot.default}`,
      });
    });

    await test.step(`Check hiển thị default các field trên side bar`, async () => {
      await frameLocator.locator(`[block-id='${newBlockId}']`).click();
      await block.switchToTab("Design");
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: block.xpathSidebar,
        snapshotName: `${process.env.ENV}-${snapshot.tab_settings}`,
      });
    });

    await test.step(`Nhấn save, click preview button`, async () => {
      await webBuilder.clickSaveButton();
      const sfPage = await clickPreviewButton({ context, dashboard });
      await previewBlockOnSf(sfPage, snapshotFixture, newBlockSelector, snapshot.sf_default);
      await sfPage.close();
    });
  });

  test(`@SB_SC_SCWB_201 Collection list_Check edit, delete, dnd collection trong block collection list`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const { valid_collection_data: validData, invalid_collection_data: invalidData } = conf.caseConf.data;
    const contentFieldSelector = (index, field) =>
      `(//section[@block-id='${newBlockId}']//*[contains(@class, '${field}')])[${index}]`;
    newBlockSelector = `[block-id='${newBlockId}']`;

    await test.step(`Precondition : Add collection vào block `, async () => {
      await webBuilder.switchToTab("Content");
      await expect(dashboard.locator(selector.btnSelectCollection)).toBeVisible();
      await addCollectionToBlock(dashboard, conf.caseConf.collection_name);
    });

    await test.step(`Click button edit của collection 1`, async () => {
      const itemActionSelector = selector.collectionItemAction(1, "edit");
      await dashboard.locator(itemActionSelector).first().click();
      await expect(dashboard.locator(selector.popoverEditCollection)).toBeVisible();
    });

    await test.step(`Edit các field trong popup với số kí tự hợp lệ`, async () => {
      await editCollectionItem(dashboard, validData);
      await expect(frameLocator.locator(contentFieldSelector(1, "sub-head"))).toHaveText(validData.sub_heading);
      await expect(frameLocator.locator(contentFieldSelector(1, "content-text--head"))).toHaveText(validData.heading);
      await expect(frameLocator.locator(contentFieldSelector(1, "content-text--desc"))).toHaveText(
        validData.description,
      );
    });

    await test.step(`Edit các field trong popup với số kí tự lớn hơn số kí tự cho phép`, async () => {
      await editCollectionItem(dashboard, invalidData);
      await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
      await webBuilder.clickSaveButton();
      await webBuilder.backBtn.click();
      await webBuilder.waitForResponseIfExist("/assets/theme.css", 7000);
      await webBuilder.page.waitForTimeout(1000);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: newBlockSelector,
        snapshotName: `${process.env.ENV}-${snapshot.invalid_data}`,
        iframe: webBuilder.iframe,
      });
    });

    await test.step(`Click button delete của collection 2`, async () => {
      await frameLocator.locator(newBlockSelector).click();
      await webBuilder.switchToTab("Content");
      const itemIndex = 2;
      await webBuilder.switchToTab("Content");
      const itemActionSelector = selector.collectionItemAction(itemIndex, "remove");
      await dashboard.locator(itemActionSelector).first().click();
      await expect(dashboard.locator(selector.collectionItem("Collection 2"))).toBeHidden();
      await expect(frameLocator.locator(contentFieldSelector(itemIndex, "content-text--head"))).toHaveText(
        conf.caseConf.expect.heading_after_delete,
      );
    });

    await test.step(`DnD vị trí collection 3 và collection 4`, async () => {
      const { from_idx: fromIdx, to_idx: toIdx } = conf.caseConf.data.dnd_collection;
      await dashboard.waitForTimeout(2000);
      const itemListSelector = `//div[contains(@class,'item-list')]`;
      await expect(dashboard.locator(`//div[contains(@class, 'w-builder__list-drag')]`).first()).toBeVisible();
      const from = `(${itemListSelector} //div[contains(@class,'w-builder__list-drag')] //span)[${fromIdx}]`;
      const to = `(${itemListSelector} //div[contains(@class,'w-builder__list-drag')] //span)[${toIdx}]`;
      await dragAndDropCollection(dashboard, from, to, 2); // chưa stable cần tìm sol
      await expect(frameLocator.locator(selector.collectionTitle(newBlockId)).last()).toHaveText(
        conf.caseConf.expect.last_item_after_dnd,
      );
    });
  });

  const conf = loadData(__dirname, "DATA_SETTING_LAYOUT_DEFAULT");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_name}`, async ({ snapshotFixture, dashboard }) => {
      for (const layout of caseData.layouts) {
        await test.step(`Select layout = Brick / Image-text cho collection theo data`, async () => {
          if (layout.mobile === "mobile") {
            await webBuilder.switchMobileBtn.click();
          }
          await changeLayout(webBuilder, layout.layout);
          await webBuilder.page.locator("//div[contains(@class,'widget--layout')]").first().click();
          await snapshotFixture.verify({
            page: dashboard,
            selector: `//div[contains(@class,'widget--layout')]//div[@class='sb-my-small']`,
            snapshotName: `setting-layout-${layout.layout}.png`,
          });
          await webBuilder.page.locator("//div[contains(@class,'widget--layout')]").first().click();
        });
      }
      for (const spacing of caseData.data_setting_spacing) {
        await test.step(`Input spacing theo data `, async () => {
          await webBuilder.page.locator("//div[contains(@class,'widget--layout')]").first().click();
          await settingLayout(webBuilder, spacing);
          const inputLocator = dashboard
            .locator("(//div[contains(@class,'w-builder__widget--layout')]//input[@type='number'])")
            .first();
          await expect(inputLocator).toHaveValue(caseData.max_value.toString());
          await webBuilder.page.locator("//div[contains(@class,'widget--layout')]").first().click();
        });
      }
    });
  }

  test(`@SB_WEB_BUILDER_LB_NCL_02 Collection list_Check trường Layout = brick của block collection list`, async ({
    dashboard,
    conf,
    snapshotFixture,
    context,
  }) => {
    let sfPage: Page;

    await test.step(`Verify Block collection list khi không select collection`, async () => {
      const data = conf.caseConf.data_setting_layout_no_collection;
      await webBuilder.switchToTab("Design");
      await changeLayout(webBuilder, "brick");
      await webBuilder.page.locator(selector.buttonLayout).click();
      await settingLayout(webBuilder, data.layout_setting);
      await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
      await webBuilder.page.waitForTimeout(1000);
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: `[block-id='${newBlockId}']`,
        snapshotName: "brick_no_collection.png",
        iframe: webBuilder.iframe,
      });
    });

    const dataSetting = conf.caseConf.data;
    for (const data of dataSetting) {
      await test.step(`${data.description}`, async () => {
        //add collection cho block collection list
        await webBuilder.switchToTab("Content");
        await expect(dashboard.locator(selector.btnSelectCollection)).toBeVisible();
        await addCollectionToBlock(dashboard, [data.collection_name]);
        // Set bộ data cho layout
        await webBuilder.switchToTab("Design");
        await frameLocator.locator(newBlockSelector).click();
        await webBuilder.page.locator(selector.buttonLayout).click();
        const optionsLocator = webBuilder.page.locator(selector.layoutOptions);
        await optionsLocator.first().waitFor({ state: "visible" });
        await settingLayout(webBuilder, data.layout_setting);
        await webBuilder.clickSaveButton();
        await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
        await webBuilder.page.waitForTimeout(1000);
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: `[block-id='${newBlockId}']`,
          snapshotName: data.snapshot.wb_preview,
          iframe: webBuilder.iframe,
        });
      });

      await test.step(`Nhấn save, click preview button`, async () => {
        sfPage = await clickPreviewButton({ context, dashboard });
        await previewBlockOnSf(sfPage, snapshotFixture, `[block-id='${newBlockId}']`, data.snapshot.sf_preview);
        await sfPage.close();
      });

      await test.step(`Open SF`, async () => {
        const newTab = await context.newPage();
        await newTab.goto(`https://${conf.suiteConf.domain}/?theme_preview_id=${conf.suiteConf.site_id}`);
        await newTab.waitForLoadState("networkidle");
        await snapshotFixture.verify({
          page: newTab,
          selector: `[block-id='${newBlockId}']`,
          snapshotName: data.snapshot.sf_preview,
        });
        await newTab.close();
      });
    }
  });

  test(`@SB_WEB_BUILDER_LB_NCL_03 Collection list_Check trường Layout = Image & Text của block collection list`, async ({
    dashboard,
    snapshotFixture,
    conf,
    context,
  }) => {
    let sfPage: Page;
    await test.step(`- Verify Block collection list khi không select collection`, async () => {
      const data = conf.caseConf.data_setting_layout_no_collection;
      await webBuilder.switchToTab("Design");
      await changeLayout(webBuilder, "image_text");
      await webBuilder.page.locator(selector.buttonLayout).click();
      await settingLayout(webBuilder, data.layout_setting);
      await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
      await webBuilder.page.waitForTimeout(1000);
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: `[block-id='${newBlockId}']`,
        snapshotName: "image_text_no_collection.png",
        iframe: webBuilder.iframe,
      });

      const dataSetting = conf.caseConf.data;
      for (const data of dataSetting) {
        await test.step(`${data.description}`, async () => {
          //add collection cho block collection list
          await webBuilder.switchToTab("Content");
          await expect(dashboard.locator(selector.btnSelectCollection)).toBeVisible();
          await addCollectionToBlock(dashboard, [data.collection_name]);
          // Set bộ data cho layout
          await webBuilder.switchToTab("Design");
          await frameLocator.locator(newBlockSelector).click();
          await webBuilder.page.locator(selector.buttonLayout).click();
          const optionsLocator = webBuilder.page.locator(selector.layoutOptions);
          await optionsLocator.first().waitFor({ state: "visible" });
          await settingLayout(webBuilder, data.layout_setting);
          await webBuilder.clickSaveButton();
          await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
          await webBuilder.page.waitForTimeout(1000);
          await snapshotFixture.verifyWithIframe({
            page: dashboard,
            selector: `[block-id='${newBlockId}']`,
            snapshotName: data.snapshot.wb_preview,
            iframe: webBuilder.iframe,
          });
        });

        await test.step(`Nhấn save, click preview button`, async () => {
          sfPage = await clickPreviewButton({ context, dashboard });
          await previewBlockOnSf(sfPage, snapshotFixture, `[block-id='${newBlockId}']`, data.snapshot.sf_preview);
          await sfPage.close();
        });

        await test.step(`Open SF`, async () => {
          const newTab = await context.newPage();
          await newTab.goto(`https://${conf.suiteConf.domain}/?theme_preview_id=${conf.suiteConf.site_id}`);
          await newTab.waitForLoadState("networkidle");
          await snapshotFixture.verify({
            page: newTab,
            selector: `[block-id='${newBlockId}']`,
            snapshotName: data.snapshot.sf_preview,
          });
          await newTab.close();
        });
      }
    });
  });

  const dataSettingLayout = loadData(__dirname, "DATA_SETTING_LAYOUT_MOBILE");
  for (let i = 0; i < dataSettingLayout.caseConf.data.length; i++) {
    const caseData = dataSettingLayout.caseConf.data[i];
    test(`${caseData.description} @${caseData.case_name}`, async ({ snapshotFixture, dashboard, pageMobile }) => {
      await webBuilder.switchToTab("Content");
      await expect(dashboard.locator(selector.btnSelectCollection)).toBeVisible();
      await addCollectionToBlock(dashboard, caseData.collection_name);

      await test.step(` Set 1 bộ data layout cho block collection list `, async () => {
        await webBuilder.switchMobileBtn.click();
        await webBuilder.switchToTab("Design");
        await changeLayout(webBuilder, caseData.layout);
        await webBuilder.page.locator("//div[contains(@class,'widget--layout')]").first().click();
        await settingLayout(webBuilder, caseData.layout_setting);
        await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
        await webBuilder.clickSaveButton();
        await webBuilder.page.waitForTimeout(1000);
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: `[block-id='${newBlockId}']`,
          snapshotName: caseData.snapshot.wb_preview,
          iframe: webBuilder.iframe,
        });
      });

      await test.step(`View SF trên mobile`, async () => {
        const homePage = new SFHome(pageMobile, domain);
        await homePage.gotoHomePage();
        await waitForImageLoaded(pageMobile, newBlockSelector);
        await waitTimeout(1000); // wait for fade in animation
        await snapshotFixture.verify({
          page: homePage.page,
          selector: newBlockSelector,
          snapshotName: caseData.snapshot.sf_preview,
        });
      });
    });
  }

  test(`@SB_WEB_BUILDER_LB_NCL_05 Collection list_Check block Collection list trên mobile với setting layout = Grid`, async ({
    pageMobile,
    snapshotFixture,
    conf,
    dashboard,
  }) => {
    await test.step(`Pre-condition: Add collection into block Collection list`, async () => {
      const collectionName = conf.caseConf.collection_name;
      await addCollectionToBlock(dashboard, collectionName);
      await webBuilder.switchToMobile();
      await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: `[block-id='${newBlockId}']`,
        snapshotName: conf.caseConf.screenshot_name.wb_sidebar,
        iframe: webBuilder.iframe,
      });
      await webBuilder.switchToTab("Design");
    });

    for (const setItemsPerRow of conf.caseConf.set_items_per_row) {
      await test.step(`Trong web builder, switch device desktop sang mobile ->  Set 1 bộ data layout cho block collection list với ${setItemsPerRow.layout_mobile.size}`, async () => {
        await webBuilder.settingDesignAndContentWithSDK(setItemsPerRow);
        await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
        await webBuilder.clickSaveButton();
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: newBlockSelector,
          snapshotName: `grid_${setItemsPerRow.layout_mobile.size}_per_row_dashboard.png`,
          iframe: webBuilder.iframe,
        });
      });

      await test.step(`View SF trên mobile`, async () => {
        const homePage = new SFHome(pageMobile, domain);
        await homePage.goto();
        await waitForImageLoaded(pageMobile, newBlockSelector);
        await snapshotFixture.verifyWithAutoRetry({
          page: homePage.page,
          selector: newBlockSelector,
          snapshotName: `grid_${setItemsPerRow.layout_mobile.size}_per_row_storefront.png`,
        });
      });
    }
  });

  test(`@SB_WEB_BUILDER_LB_NCL_06 Collection list_Check block Collection list trên mobile với setting layout = Slide`, async ({
    conf,
    dashboard,
    pageMobile,
    snapshotFixture,
  }) => {
    let homePage;
    const data = conf.caseConf.data;
    const screenshot = conf.caseConf.screenshot_name;

    await test.step(`Trong web builder, switch device desktop sang mobile, switch tab Design`, async () => {
      const collectionName = conf.caseConf.collection_name;
      await addCollectionToBlock(dashboard, collectionName);
      await webBuilder.switchToMobile();
      await webBuilder.switchToTab("Design");
    });

    await test.step(`Trong web builder, switch device desktop sang mobile -> Set 1 bộ data layout cho block collection list  với item per row = 1`, async () => {
      await webBuilder.settingDesignAndContentWithSDK(data[0]);
      await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
      await webBuilder.clickSaveButton();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: newBlockSelector,
        snapshotName: screenshot.screenshot_dashboard_1,
        iframe: webBuilder.iframe,
      });
    });

    await test.step(`View SF trên mobile`, async () => {
      homePage = new SFHome(pageMobile, domain);
      await homePage.goto();
      await waitForImageLoaded(pageMobile, newBlockSelector);
      await snapshotFixture.verifyWithAutoRetry({
        page: homePage.page,
        selector: newBlockSelector,
        snapshotName: screenshot.screenshot_SF_1,
      });
    });

    await test.step(`Click navigation dot thứ 2`, async () => {
      await homePage.page.locator(block.carouselDot).nth(1).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: homePage.page,
        selector: newBlockSelector,
        snapshotName: screenshot.screen_SF_switch_slide_2,
      });
    });

    await test.step(`Click navigation dot đâù tiên`, async () => {
      await homePage.page.locator(block.carouselDot).nth(0).click();
      await snapshotFixture.verifyWithAutoRetry({
        page: homePage.page,
        selector: newBlockSelector,
        snapshotName: screenshot.screen_SF_switch_slide_1,
      });
    });

    await test.step(`Trong web builder set 1 bộ data layout cho block collection list item per row = 2`, async () => {
      await webBuilder.settingDesignAndContentWithSDK(data[1]);
      await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
      await webBuilder.clickSaveButton();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: newBlockSelector,
        snapshotName: screenshot.screenshot_dashboard_2,
        iframe: webBuilder.iframe,
      });
    });

    await test.step(`View SF trên mobile`, async () => {
      homePage = new SFHome(pageMobile, domain);
      await homePage.goto();
      await waitForImageLoaded(pageMobile, newBlockSelector);
      await snapshotFixture.verifyWithAutoRetry({
        page: homePage.page,
        selector: newBlockSelector,
        snapshotName: screenshot.screenshot_SF_2,
      });
    });

    await test.step(`Trong web builder set 1 bộ data layout cho block collection list item per row = 3`, async () => {
      await webBuilder.settingDesignAndContentWithSDK(data[2]);
      await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
      await webBuilder.clickSaveButton();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: newBlockSelector,
        snapshotName: screenshot.screenshot_dashboard_3,
        iframe: webBuilder.iframe,
      });
    });

    await test.step(`View SF trên mobile`, async () => {
      homePage = new SFHome(pageMobile, domain);
      await homePage.goto();
      await waitForImageLoaded(pageMobile, newBlockSelector);
      await snapshotFixture.verifyWithAutoRetry({
        page: homePage.page,
        selector: newBlockSelector,
        snapshotName: screenshot.screenshot_SF_3,
      });
    });

    await test.step(`Click navigation dot thứ 2`, async () => {
      await homePage.page.locator(block.carouselDot).first().click();
      await snapshotFixture.verifyWithAutoRetry({
        page: homePage.page,
        selector: newBlockSelector,
        snapshotName: screenshot.screen_SF_switch_slide_3,
      });
    });
  });

  test(`@SB_WEB_BUILDER_LB_NCL_09 Collection list_Check block Collection list trên mobile với setting layout = Content outside`, async ({
    pageMobile,
    snapshotFixture,
    conf,
    dashboard,
  }) => {
    const collectionName = conf.caseConf.collection_name;
    await test.step(`Pre-condition: Add collection into block Collection list`, async () => {
      await addCollectionToBlock(dashboard, collectionName);
      await webBuilder.switchToMobile();
      await webBuilder.switchToTab("Design");
    });

    for (const setItemsPerRow of conf.caseConf.set_items_per_row) {
      await test.step(`1. Trong web builder, switch device desktop sang mobile2. Set 1 bộ data layout cho block collection list với ${setItemsPerRow.layout_mobile.size}`, async () => {
        await webBuilder.settingDesignAndContentWithSDK(setItemsPerRow);
        await waitForImageLoaded(dashboard, newBlockSelector, webBuilder.iframe);
        await webBuilder.clickSaveButton();
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: newBlockSelector,
          snapshotName: `${setItemsPerRow.layout_mobile.size}_per_row_content_outside_dashboard.png`,
          iframe: webBuilder.iframe,
        });
      });

      await test.step(`View SF trên mobile`, async () => {
        const homePage = new SFHome(pageMobile, domain);
        await homePage.goto();
        await waitForImageLoaded(pageMobile, newBlockSelector);
        await snapshotFixture.verify({
          page: homePage.page,
          selector: newBlockSelector,
          snapshotName: `${setItemsPerRow.layout_mobile.size}_per_row_content_outside_storefront.png`,
        });
      });
    }
  });
});
