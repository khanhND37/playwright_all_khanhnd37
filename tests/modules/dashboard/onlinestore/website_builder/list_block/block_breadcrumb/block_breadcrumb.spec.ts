/* eslint-disable max-len */
import { expect, test } from "@fixtures/website_builder";
import { FrameLocator, Page } from "@playwright/test";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { snapshotDir } from "@utils/theme";
import { XpathBlock, XpathNavigationButtons } from "@constants/web_builder";
import { clickPreviewButton } from "../../variable/variable-util";
import { HomePage } from "@pages/dashboard/home_page";
import { ThemeSettingsData } from "@types";
import { waitTimeout } from "@core/utils/api";

const pageTitle = {
  product: "Product detail",
  collection: "Collection detail",
  blog: "Blog",
  blog_post: "Blog post",
  collections: "All collections",
  custom: "Breadcrumb",
};

const getBreadcrumbContent = async (frameLocator, blockSelector) => {
  const itemBreadcrumbSelector = `${blockSelector}//span[contains(@class, 'breadcrumb_link')]`;
  const items = await frameLocator.locator(itemBreadcrumbSelector).all();
  const links = [];
  const re = new RegExp(String.fromCharCode(160), "g");
  for (const item of items) {
    const content = await item.textContent();
    if (!content.toString()) {
      continue;
    }
    links.push(content.toString().replace(re, " "));
  }
  return links.join("/");
};

const getSeperatorSelector = value => {
  return `//div[@id='widget-popover' ]//div[contains(@class, 'widget-select__search')]//li[@value='${value}']`;
};

const saveChange = async dashboard => {
  await dashboard.locator(".w-builder__header-right span:has-text('Save')").first().click();
  await expect(dashboard.locator("text=i All changes are saved >> div")).toBeVisible();
};

const waitIframeLoaded = async (dashboard: Page) => {
  const frameElement = await dashboard.locator("#preview").elementHandle();
  const frame = await frameElement.contentFrame();
  await frame.locator(XpathBlock.progressBar).waitFor({ state: "detached" });
};

const changePage = async (dashboard: Page, page: string) => {
  await dashboard.locator("(//button[@name='Pages'])").first().click();
  await dashboard
    .locator(`(//div[contains(@class,'w-builder__page-groups--item') and contains(.//div, '${pageTitle[page]}')])`)
    .first()
    .click();
  await waitIframeLoaded(dashboard);
};

const getXpathElementByName = async (name: string) => {
  return `//h3[contains(@class, "title") and contains(text(), "${name}")]`;
};

test.describe("Verify block breadcrumb", () => {
  let webBuilder: WebBuilder,
    block: Blocks,
    frameLocator: FrameLocator,
    snapshot: { [key: string]: string },
    blockSelector: string,
    sectionSelector: string;
  let settingsData: ThemeSettingsData;
  let settingsDataPublish: ThemeSettingsData;
  let currentPage: Page;

  test.beforeAll(async ({ builder, conf }) => {
    await test.step("Get theme default", async () => {
      const response = await builder.pageSiteBuilder(conf.suiteConf.page_id);
      settingsData = response.settings_data as ThemeSettingsData;
    });
  });

  test.beforeEach(async ({ dashboard, conf, builder }, testInfo) => {
    const { domain } = conf.suiteConf;

    webBuilder = new WebBuilder(dashboard, domain);
    block = new Blocks(dashboard, domain);
    snapshot = conf.caseConf.expect?.snapshot || {};
    frameLocator = block.frameLocator;

    const sectionIdx = 1;
    const blockIdx = 1;
    sectionSelector = webBuilder.getSelectorByIndex({ section: sectionIdx });
    blockSelector = webBuilder.getSelectorByIndex({ section: sectionIdx, block: blockIdx });

    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    await test.step("Update theme", async () => {
      if (!settingsData) {
        const response = await builder.pageSiteBuilder(conf.suiteConf.page_id);
        settingsData = response.settings_data as ThemeSettingsData;
      }

      //get publish theme data
      const responsePublish = await builder.pageSiteBuilder(conf.suiteConf.site_id);
      settingsDataPublish = responsePublish.settings_data as ThemeSettingsData;

      //Update collection page data for publish theme
      settingsDataPublish.fixed.header = settingsData.fixed.header;
      await builder.updateSiteBuilder(conf.suiteConf.site_id, settingsDataPublish);
    });

    await test.step(`Precond - Open web builder`, async () => {
      const id = conf.suiteConf.site_id;
      await webBuilder.openWebBuilder({ type: "site", id });
      await dashboard.locator(block.overlay).waitFor({ state: "hidden" });
      await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
      await webBuilder.page.waitForLoadState("networkidle");
    });

    await test.step("Click add block BreadCrumb trong insert panel", async () => {
      await webBuilder.dragAndDropInWebBuilder({
        from: {
          category: "Basics",
          template: "Breadcrumb",
        },
        to: {
          position: {
            section: 1,
            column: 1,
          },
          isBottom: false,
        },
      });
      await frameLocator.locator(blockSelector).click();
    });
  });

  test(`@SB_WEB_BUILDER_PRD_01 Verify hiển thị UI default khi add block breadcrumb`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const { breadcrumb_content: breadcrumbContent } = conf.caseConf.expect;
    // pages are used to verify breadcrumb content
    const { pages } = conf.caseConf.data;

    await test.step("Verify hiển thị UI default", async () => {
      await block.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: block.xpathFirstBreadcrumbOnWB,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-${snapshot.preview}`,
      });
    });

    await test.step(`Tại sidebar, click tab Content`, async () => {
      await frameLocator.locator(blockSelector).click();
      await webBuilder.switchToTab("Content");
      await snapshotFixture.verify({
        page: dashboard,
        selector: block.xpathSidebar,
        snapshotName: `${process.env.ENV}-${snapshot.tab_settings}`,
      });
    });

    for (const page of pages) {
      await test.step(`Add breadcrumb trong page ${page}`, async () => {
        await changePage(dashboard, page);

        await expect(dashboard.locator(block.xpathEntityHeader)).toBeVisible();
        await frameLocator.locator("#v-progressbar").waitFor({ state: "detached" });
        await waitTimeout(3000); //wait breadcrumb change text

        const content = await getBreadcrumbContent(frameLocator, blockSelector);
        expect(content).toEqual(breadcrumbContent[page].toString());
      });
    }

    await test.step(`Check hiển thị breadcrumb trên mobile`, async () => {
      await changePage(dashboard, "product");
      await expect(dashboard.locator(block.xpathEntityHeader)).toBeVisible();

      await webBuilder.switchMobileBtn.click();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: block.xpathFirstBreadcrumbOnWB,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-${snapshot.preview_mobile}`,
      });
    });
  });

  test(`@SB_WEB_BUILDER_PRD_32 Verify chỉnh sửa setting common của block`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const blockId = await block.getAttrsDataId();
    await test.step(`Click vào block, click duplicate`, async () => {
      await frameLocator.locator(`[data-block-id='${blockId}']`).click();
      await block.clickQuickSettingByButtonPosition(3, "button");
      await block.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-${snapshot.two_block}`,
      });
    });

    await test.step(`Click vào block, click Hide`, async () => {
      await frameLocator.locator(`[data-block-id='${blockId}']`).click();
      await block.clickQuickSettingByButtonPosition(4, "button");
      await block.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-${snapshot.one_block}`,
      });
    });

    await test.step(`Action Bar -> Layer -> Section chứa block -> Click hiển thị lại block`, async () => {
      const page = dashboard;
      const blockLayerSelector = webBuilder.getSidebarSelectorByName({
        sectionName: conf.suiteConf.section_name.content,
        subLayerName: conf.suiteConf.add_block.template,
        subLayerIndex: 1,
      });
      await page
        .locator(
          `//p[contains(text(),'${conf.suiteConf.section_name.content}')]/ancestor::div[contains(@class, 'w-builder__layer-title')]/preceding-sibling::div//button`,
        )
        .click();
      await page.locator(blockLayerSelector).hover();
      await page
        .locator(`${blockLayerSelector}/following-sibling::div//button[contains(@data-block-action, "visible")][1]`)
        .click();
      await page.locator(blockLayerSelector).click();
      await block.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: snapshot.two_block,
      });
    });

    await test.step(`Click vào block, Delete`, async () => {
      const blockLayerSelector = webBuilder.getSidebarSelectorByName({
        sectionName: conf.suiteConf.section_name.content,
        subLayerName: conf.suiteConf.add_block.template,
        subLayerIndex: 2,
      });
      await dashboard.locator(blockLayerSelector).click();
      await dashboard.locator('//button[@data-action-remove="block"]').first().click();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: sectionSelector,
        iframe: webBuilder.iframe,
        snapshotName: `${process.env.ENV}-${snapshot.one_block}`,
      });
    });
  });

  test(`@SB_WEB_BUILDER_PRD_33 Verify chỉnh sửa tab content của block breadcrumb`, async ({ dashboard, conf }) => {
    const { breadcrumb_content: breadcrumbContent } = conf.caseConf.expect;
    const { widgets } = conf.caseConf.data;
    const switchValues = [true, false];

    await test.step(`Tại sidebar, click tab Content. `, async () => {
      await changePage(dashboard, "product");
      await frameLocator.locator(blockSelector).click();
      await webBuilder.switchToTab("Content");
    });

    for (const widget of widgets) {
      for (const value of switchValues) {
        await test.step(`${value ? "Bật" : "Tắt"} toggle switch ${widget.replace(/_/g, " ")}`, async () => {
          const widgetSelector = webBuilder.getSelectorByLabel(widget);
          const switchSelector = `${widgetSelector}//span[contains(@class, 'sb-switch__switch')]`;
          const inputSelector = `${widgetSelector}//input`;

          await dashboard.locator(switchSelector).click();
          await expect(dashboard.locator(inputSelector)).toHaveValue(value.toString());
          const content = await getBreadcrumbContent(frameLocator, blockSelector);
          const expectContent = value ? widget : "default";
          expect(content).toEqual(breadcrumbContent[expectContent]);
        });
      }
    }
  });

  test(`@SB_WEB_BUILDER_PRD_02 Verify thay đổi separator icon giữa các item trong breadcrumb`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const widgetSeperatorSelector = webBuilder.getSelectorByLabel("seperator_icon");
    const buttonSeperatorSelector = `${widgetSeperatorSelector}//button`;
    const { seperators } = conf.caseConf.data;
    await test.step(`Tại sidebar, click tab Design.`, async () => {
      // fill your code here
      await changePage(dashboard, "product");
      await frameLocator.locator(blockSelector).click();
      await webBuilder.switchToTab("Design");
    });

    for (const key in seperators) {
      await test.step(`Tại sidebar, click tab Design, tab Seperator, chọn option:  ${seperators[key]} -> Save `, async () => {
        // fill your code here
        await dashboard.locator(buttonSeperatorSelector).click();
        const seperatorItemSelector = getSeperatorSelector(key);
        await dashboard.locator(seperatorItemSelector).click();
        await expect(dashboard.locator(buttonSeperatorSelector)).toHaveText(seperators[key]);
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          iframe: webBuilder.iframe,
          snapshotName: snapshot[key],
          selector: blockSelector,
        });
      });
    }
  });

  test(`@SB_WEB_BUILDER_PRD_03 Verify chỉnh sửa tab design của block breadcrumb`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const blockId = await block.getAttrsDataId();
    await test.step(`Tại sidebar, click tab Design`, async () => {
      await changePage(dashboard, "product");
    });

    await test.step(`Hover vào 1 item not selected`, async () => {
      await frameLocator
        .locator(`${blockSelector}//span[contains(@class, 'breadcrumb_link') and contains(.//a, 'All')]`)
        .hover();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        selector: blockSelector,
        iframe: webBuilder.iframe,
        snapshotName: snapshot.hovered,
      });
    });

    await test.step(`Bỏ hover khỏi item đó`, async () => {
      await frameLocator.locator(`[data-block-id='${blockId}']`).click();
      await block.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        iframe: webBuilder.iframe,
        snapshotName: snapshot.default,
        selector: sectionSelector,
      });
    });

    await test.step(`Edit các common setting của 1 block theo input data  `, async () => {
      await frameLocator.locator(`[data-block-id='${blockId}']`).click();
      let index = 1;
      for (const style of conf.caseConf.data.styles) {
        await webBuilder.changeDesign(style);
        await snapshotFixture.verifyWithIframe({
          page: dashboard,
          selector: sectionSelector,
          iframe: webBuilder.iframe,
          snapshotName: `breadcrumb-design-${index}.png`,
        });
        index++;
      }
    });
  });

  test(`@SB_WEB_BUILDER_PRD_34 Verify resize width của block Breadcrumb`, async ({
    dashboard,
    conf,
    snapshotFixture,
  }) => {
    const { data } = conf.caseConf;
    await changePage(dashboard, "product");
    await test.step(`Resize giảm width của block `, async () => {
      await webBuilder.resize({ section: 1, block: 1 }, "right", 700);
      await block.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        iframe: webBuilder.iframe,
        snapshotName: snapshot.resized,
        selector: sectionSelector,
      });
    });

    await test.step(`Resize tăng width của block`, async () => {
      await webBuilder.resize({ section: 1, block: 1 }, "right", data.default);
      await block.clickBackLayer();
      await snapshotFixture.verifyWithIframe({
        page: dashboard,
        iframe: webBuilder.iframe,
        snapshotName: snapshot.default,
        selector: sectionSelector,
      });
    });
  });

  test(`@SB_WEB_BUILDER_PRD_5 Verify webfront interaction`, async ({ dashboard, conf, context }) => {
    let currentPage;
    const { breadcrumb_content: breadcrumbContent } = conf.caseConf.expect;
    const caseConf = conf.caseConf.data;
    const sfBlockId = await block.getAttrsDataId();
    const sfBlockSelector = `//*[@data-block-id='${sfBlockId}']`;

    const blogPostSelector = `//div[contains(@class, 'post-card')]//a[@href='/blogs/${conf.caseConf.data.blog_post}']`;
    const productCardSelector = `//div[contains(@class, 'product-card--container') and contains(.//a, '${caseConf.product}')]`;

    await test.step(`Vào trực tiếp detail của blog post từ Home`, async () => {
      await saveChange(dashboard);
      currentPage = await clickPreviewButton({ context, dashboard });
      await expect(currentPage.locator(blogPostSelector).first()).toBeVisible();
      await currentPage.locator(blogPostSelector).first().click();
      await currentPage.locator(XpathBlock.progressBar).waitFor({ state: "detached" });
      const content = await getBreadcrumbContent(currentPage, sfBlockSelector);
      expect(content).toEqual(breadcrumbContent["blog_post"]);
    });

    const pages = ["home", "all", "collection"];
    for (const page of pages) {
      await test.step(`Vào trực tiếp product detail của product từ ${page}`, async () => {
        const pageUrl = `https://${conf.suiteConf.domain}${caseConf.path[page]}`;
        await currentPage.goto(pageUrl);
        await currentPage.locator(XpathBlock.progressBar).waitFor({ state: "detached" });
        await currentPage.locator(productCardSelector).first().waitFor({ state: "visible" });
        await currentPage.locator(productCardSelector).first().click();

        await currentPage.locator(XpathBlock.progressBar).waitFor({ state: "detached" });
        const content = await getBreadcrumbContent(currentPage, sfBlockSelector);
        expect(content).toEqual(breadcrumbContent[`product_${page}`]);
      });
    }

    await test.step(`Click chuột phải vào 1 item chưa selected, mở 1 tab mới`, async () => {
      const collectionItemSelector = `${sfBlockSelector}//a[@class='breadcrumb_link--item' and contains (text(), '${caseConf.collection}')]`;
      await currentPage.locator(collectionItemSelector).click();
      await currentPage.locator(XpathBlock.progressBar).waitFor({ state: "detached" });
      const content = await getBreadcrumbContent(currentPage, sfBlockSelector);
      expect(content).toEqual(breadcrumbContent.collection);
    });
  });

  test(`@SB_WEB_BUILDER_PRD_35 Verify block Breadcrumb không có ở shop creator`, async ({
    dashboard,
    token,
    page,
    conf,
  }) => {
    const { shop_data: shopData } = conf.caseConf;
    const homePage = new HomePage(page, shopData.domain[conf.suiteConf.env]);
    const accessToken = (
      await token.getWithCredentials({
        domain: shopData.shop_name,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      })
    ).access_token;
    await homePage.loginWithToken(accessToken);

    await test.step(`Click "Add block" trong blank section`, async () => {
      await dashboard.locator(XpathNavigationButtons["insert"]).click();
      await expect(webBuilder.insertPreview).toBeVisible();
    });

    await test.step(`Search "quantity" trên drawer Insert block`, async () => {
      await webBuilder.searchbarTemplate.fill(conf.suiteConf.add_block.template);
      await expect(webBuilder.templateContainer).toContainText("");
    });
  });

  test(`@SB_WEB_BUILDER_PRD_70 Verify rule hiển thị breadcrumb ở các trang`, async ({ conf, dashboard, context }) => {
    let content;
    const sfBlockId = await block.getAttrsDataId();
    const sfBlockSelector = `//*[@data-block-id='${sfBlockId}']`;

    await test.step("Mở trang Home", async () => {
      await webBuilder.clickSave();
      currentPage = await clickPreviewButton({ context, dashboard });
      await currentPage.goto(`https://${conf.suiteConf.domain}`);
      await currentPage.waitForLoadState("load");

      const content = await getBreadcrumbContent(currentPage, sfBlockSelector);
      expect(content).toEqual(conf.caseConf.breadcrumb_content.home.toString());
    });

    await test.step("Vào trực tiếp product detail / blog post từ Home", async () => {
      //blog post
      await currentPage
        .locator(await getXpathElementByName(conf.caseConf.blog_post_name))
        .first()
        .click();
      await currentPage.waitForLoadState("load");
      await waitTimeout(3000); //wait breadcrumb change text

      content = await getBreadcrumbContent(currentPage, sfBlockSelector);
      expect(content).toEqual(conf.caseConf.breadcrumb_content.blog_post.toString());

      //product detail
      await currentPage.goto(`https://${conf.suiteConf.domain}`);
      await currentPage
        .locator(await getXpathElementByName(conf.caseConf.product_name))
        .first()
        .click();
      await currentPage.waitForLoadState("load");
      await waitTimeout(3000); //wait breadcrumb change text

      content = await getBreadcrumbContent(currentPage, sfBlockSelector);
      expect(content).toEqual(conf.caseConf.breadcrumb_content.product_detail.toString());
    });

    await test.step("Mở page Page breadcrumb, check hiển thị breadcrumb", async () => {
      await currentPage.goto(`https://${conf.suiteConf.domain}/pages/${conf.caseConf.page_handle}`);
      await currentPage.waitForLoadState("load");
      await waitTimeout(3000); //wait breadcrumb change text

      content = await getBreadcrumbContent(currentPage, sfBlockSelector);
      expect(content).toEqual(conf.caseConf.breadcrumb_content.custom.toString());
    });
  });
});
