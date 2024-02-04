import type { Page } from "@playwright/test";
import { expect, test } from "@fixtures/website_builder";
import { XpathBlock } from "@constants/web_builder";
import { ClickType, WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { UpSell } from "@pages/new_ecom/storefront/upsell";
import { WebPageStyle } from "@pages/shopbase_creator/dashboard/web_page_style";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { CaseConf } from "@types";
import { SFUpSellAPI } from "@pages/new_ecom/storefront/apps/upsell/cross-sell";
import { CrossSellAPI } from "@pages/api/apps/upsell/cross-sell";

async function verifyHiddenProduct(blocks: Blocks, upsell: UpSell, cConf: CaseConf, title: string) {
  let sectionId = "0";
  await test.step(`Tại section 3, check offer có 1 số product ${title}`, async () => {
    sectionId = await blocks.clickAddBlockBtn("body", 3);
    await blocks.getTemplatePreviewByName("Accessories").click();
    await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
    await blocks.frameLocator
      .locator(`section[id="${sectionId}"] ${upsell.accessoryFirstItemImgWithAttrs}`)
      .waitFor({ state: "visible" });
    await waitForImageLoaded(blocks.page, `section[id="${sectionId}"] ${upsell.accessoryFirstItemImg}`, blocks.iframe);
    const count = await blocks.frameLocator.locator(upsell.accessoryTitle).count();
    const titles = [];
    for (let i = 0; i < count; i++) {
      titles.push(
        await blocks.frameLocator
          .locator(`.accessory-product__item:nth-child(${i + 1}) ${upsell.accessoryTitle}`)
          .textContent(),
      );
    }
    expect(titles.every(t => t.indexOf(cConf.expected.product_title) === -1)).toBeTruthy();
    await expect(blocks.frameLocator.locator(upsell.accessoryMsg)).toHaveText(cConf.expected.product_message);
  });
  await test.step(`Tại section 3, check offer có tất cả product bị out of stock`, async () => {
    await expect(blocks.frameLocator.locator(`section[id="${sectionId}"] ${upsell.accessoryNavigation}`)).toBeHidden();
  });
}

test.describe("Accessories block @TS_SB_WEB_BUILDER_LBA_BACS", () => {
  test.slow();

  let blocks: Blocks;
  let upsell: UpSell;
  let upsellSF: SFUpSellAPI;
  let apps: CrossSellAPI;
  let webBuilder: WebBuilder;

  test.beforeEach(async ({ dashboard, theme, authRequest, api, conf, cConf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    upsell = new UpSell(dashboard, conf.suiteConf.domain);
    upsellSF = new SFUpSellAPI(conf.suiteConf.domain, api);
    apps = new CrossSellAPI(conf.suiteConf.domain);
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    await test.step("Pre conditions", async () => {
      const response = await theme.duplicate(conf.suiteConf.theme_id.criadora);
      await theme.publish(response.id);
      if (cConf.active_offer || cConf.more_offer_id) {
        let ids = [];
        if (cConf.active_offer) {
          ids.push(conf.suiteConf.offer_id);
        }
        if (cConf.more_offer_id) {
          ids = ids.concat(cConf.more_offer_id);
        }

        await apps.requestOnOffOffer({
          api: authRequest,
          domain: conf.suiteConf.domain,
          shop_id: conf.suiteConf.shop_id,
          offer_ids: ids,
          status: true,
        });

        // Thêm timeout để chờ update offer
        await dashboard.waitForTimeout(5000);

        if (ids.length > 0) {
          await upsellSF.waitOfferUpdated(ids);
        }
      }

      if (cConf.off_app) {
        await authRequest.put(`https://${conf.suiteConf.domain}/admin/setting/app-enable/usell.json`, {
          data: {
            enable: false,
          },
        });
      }

      await blocks.page.evaluate(pageId => {
        // eslint-disable-next-line
        return (window as any).router.push(`/builder/site/${pageId}?page=product`);
      }, response.id);
      await blocks.page.locator(blocks.xpathPreviewLoadingScreen).waitFor({ state: "hidden" });
      await blocks.reloadIfNotShow("/products/");
    });
  });

  test.afterEach(async ({ theme, authRequest, conf, cConf }) => {
    await test.step("After condition", async () => {
      if (cConf.active_offer || cConf.more_offer_id) {
        let ids = [];
        if (cConf.active_offer) {
          ids.push(conf.suiteConf.offer_id);
        }
        if (cConf.more_offer_id) {
          ids = ids.concat(cConf.more_offer_id);
        }

        await apps.requestOnOffOffer({
          api: authRequest,
          domain: conf.suiteConf.domain,
          shop_id: conf.suiteConf.shop_id,
          offer_ids: ids,
          status: false,
        });
      }

      if (cConf.off_app) {
        await authRequest.put(`https://${conf.suiteConf.domain}/admin/setting/app-enable/usell.json`, {
          data: {
            enable: true,
          },
        });
      }

      await theme.publish(conf.suiteConf.theme_id.inside);
      const themeList = await theme.list();
      for (let i = 0; i < themeList.length; i++) {
        if (!themeList[i].active && themeList[i].id !== conf.suiteConf.theme_id.criadora) {
          await theme.delete(themeList[i].id);
        }
      }
      if (conf.caseConf.sleep) {
        await webBuilder.waitAbit(conf.caseConf.sleep);
      }
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_01 Accessories_Check default data khi add block Accessories`, async ({
    conf,
    context,
    snapshotFixture,
  }) => {
    let sectionId = "";
    await test.step(`Tại section 2, click add block`, async () => {
      sectionId = await blocks.clickAddBlockBtn("body", 2);
    });
    await test.step(`Chọn block Accessories`, async () => {
      await blocks.getTemplatePreviewByName("Accessories").click();
      await blocks.waitResponseWithUrl("/api/offers/products_v2.json");
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
      await blocks.frameLocator.locator(upsell.accessoryFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(blocks.page, upsell.accessoryFirstItemImg, blocks.iframe);
    });
    await test.step(`Check default data của block Accessories`, async () => {
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.mainWb,
        snapshotName: conf.caseConf.expected.accessories_default_setting,
      });
    });
    await test.step(`Click button Save và click button Preview`, async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.accessories_default_setting_sfn,
          handleWaitFor: async (storefront: Page) => {
            await storefront.locator(upsell.accessoryFirstItemImgWithAttrs).waitFor({ state: "visible" });
            await waitForImageLoaded(storefront, upsell.accessoryFirstItemImg);
          },
          selector: blocks.sectionAccessories,
        },
        snapshotFixture,
      );
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_02 Accessories_Check setting data ở tab style của block Accessories`, async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    let sectionId = "";
    await test.step(`Tại section 2, click add block`, async () => {
      sectionId = await blocks.clickAddBlockBtn("body", 2);
    });
    await test.step(`Chọn block Accessories`, async () => {
      await blocks.getTemplatePreviewByName("Accessories").click();
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
    });
    await test.step(`Setting data cho block Accessories tại tab style và tab setting`, async () => {
      const accessoriesDesign = conf.caseConf.data.design;
      await blocks.switchToTab("Design");
      await blocks.selectAlign("content_align", accessoriesDesign.content_align);
      await blocks.changeDesign(accessoriesDesign);
      await blocks.switchToTab("Content");
      await blocks.switchToggle("show_heading", conf.caseConf.data.content.show_heading);
      // Web builder debounce action change settings so need to wait
      await blocks.waitAbit(200);
    });
    await test.step(`Click button Save & Click button Preview`, async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: conf.caseConf.expected.accessories_lba_bacs_02_sfn,
          handleWaitFor: async (storefront: Page) => {
            await storefront.locator(upsell.accessoryFirstItemImgWithAttrs).waitFor({ state: "visible" });
            await waitForImageLoaded(storefront, upsell.accessoryFirstItemImg);
          },
          selector: blocks.sectionAccessories,
        },
        snapshotFixture,
      );
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_03 Accessories_Check hiển thị heading và content của block Accessories khi setting content align và Heading`, async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    let sectionId = "";
    await test.step(`Tại section 2, click add block`, async () => {
      sectionId = await blocks.clickAddBlockBtn("body", 2);
    });
    await test.step(`Chọn block Accessories`, async () => {
      await blocks.getTemplatePreviewByName("Accessories").click();
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
    });
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const data = conf.caseConf.data[i];
      if (data.content) {
        await test.step(`Tại tab Setting, turn ${data.content.show_heading ? "on" : "off"} Heading`, async () => {
          await blocks.switchToTab("Content");
          await blocks.switchToggle("show_heading", data.content.show_heading);
          // Web builder debounce action change settings so need to wait
          await blocks.waitAbit(200);
          if (data.content.show_heading) {
            await blocks.frameLocator.locator(upsell.accessoryMsg).waitFor({ state: "visible" });
            await expect(blocks.frameLocator.locator(upsell.accessoryMsg)).toBeVisible();
          } else {
            await expect(blocks.frameLocator.locator(upsell.accessoryMsg)).toBeHidden();
          }
          await blocks.switchToTab("Design");
        });
      }
      await test.step(`Tại tab Style, set Content align = ${data.design.content_align}`, async () => {
        await blocks.selectAlign("content_align", data.design.content_align);
        // Web builder debounce action change settings so need to wait
        await blocks.waitAbit(200);
        await upsell.sortProductAccessories(blocks.frameLocator, sectionId);
        await snapshotFixture.verifyWithAutoRetry({
          page: blocks.page,
          selector: blocks.mainWb,
          snapshotName: data.expected.screenshot,
        });
      });
      if (data.verify_storefront) {
        await test.step(`Click button Save và click button Preview`, async () => {
          await blocks.clickSaveAndVerifyPreview(
            {
              context,
              dashboard: blocks.page,
              savedMsg: conf.caseConf.expected.saved,
              snapshotName: conf.caseConf.expected.screenshot_enable_heading,
              handleWaitFor: async (storefront: Page) => {
                await storefront.locator(upsell.accessoryFirstItemImgWithAttrs).waitFor({ state: "visible" });
                await waitForImageLoaded(storefront, upsell.accessoryFirstItemImg);
                await upsell.sortProductAccessories(storefront, sectionId);
              },
              selector: blocks.sectionAccessories,
            },
            snapshotFixture,
          );
        });
      }
    }
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_04 Accessories_Check hiển thị shape của block Accessories khi setting shape`, async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    let sectionId = "";
    await test.step(`Tại section 2, click add block`, async () => {
      sectionId = await blocks.clickAddBlockBtn("body", 2);
    });
    await test.step(`Chọn block Accessories`, async () => {
      await blocks.getTemplatePreviewByName("Accessories").click();
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
      await upsell.sortProductAccessories(blocks.frameLocator, sectionId);
    });
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const data = conf.caseConf.data[i];
      await blocks.switchToTab("Design");
      if (data.title.indexOf("width") === -1) {
        await test.step(`Tại tab Style, setting shape = ${data.title}`, async () => {
          await blocks.selectDropDown(data.design.shape.label, data.design.shape.type);
          // Web builder debounce action change settings so need to wait
          await blocks.waitAbit(200);
        });
      } else {
        await test.step(`Tại tab Style, setting shape = Pill và width của block < 260px`, async () => {
          await blocks.settingWidthHeight(data.design.width.label, data.design.width.value);
          await blocks.titleBar.click({ delay: 200 });
        });
      }
      await test.step(`Click button Save và click button Preview`, async () => {
        await blocks.clickSaveAndVerifyPreview(
          {
            context,
            dashboard: blocks.page,
            savedMsg: conf.caseConf.expected.saved,
            snapshotName: data.expected.screenshot,
            handleWaitFor: async (storefront: Page) => {
              await storefront.locator(upsell.accessoryFirstItemImgWithAttrs).waitFor({ state: "visible" });
              await waitForImageLoaded(storefront, upsell.accessoryFirstItemImg);
              await upsell.sortProductAccessories(storefront, sectionId);
            },
            selector: blocks.sectionAccessories,
          },
          snapshotFixture,
        );
      });
    }
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_05 Accessories_Check điều hướng khi click button Add product thuộc block Accessories`, async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    let sectionId = "";
    await test.step(`Tại section 2, click add block`, async () => {
      sectionId = await blocks.clickAddBlockBtn("body", 2);
    });
    await test.step(`Chọn block Accessories`, async () => {
      await blocks.getTemplatePreviewByName("Accessories").click();
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
    });
    await test.step(`Tại tab Setting, click Button Action`, async () => {
      await blocks.switchToTab("Content");
      await blocks.genLoc(`${blocks.getSelectorByLabel("button_action")}//button`).click();
      const countAction = await blocks.genLoc(blocks.popOverXPath).getByRole("list").count();
      for (let i = 0; i < countAction; i++) {
        await expect(blocks.genLoc(blocks.popOverXPath).getByRole("listitem").nth(i)).toHaveAttribute(
          "value",
          conf.caseConf.expected.action[i],
        );
      }
      await blocks.titleBar.click();
    });
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const data = conf.caseConf.data[i];
      await test.step(`- Setting Button Action = ${data.action} - Click Button Save`, async () => {
        await blocks.selectDropDown("button_action", data.action);
        // Web builder debounce action change settings so need to wait
        await blocks.waitAbit(200);
        await blocks.clickSaveAndVerifyPreview(
          {
            context,
            dashboard: blocks.page,
            savedMsg: conf.caseConf.expected.saved,
            snapshotName: "",
            onlyClickSave: true,
          },
          snapshotFixture,
        );
        await expect(
          blocks.genLoc(`${blocks.getSelectorByLabel("button_action")}//button//span[@class="sb-button--label"]`),
        ).toHaveText(data.action);
      });
      await test.step(`Click button Add của recommend product trên webfront`, async () => {
        await blocks.frameLocator.locator(upsell.accessoryFirstItemAddCart).evaluate((element: HTMLElement) => {
          element.click();
        });
        expect(await blocks.frameLocator.locator(upsell.accessoryFirstItemAddCart).getAttribute("disabled")).toBeNull();
      });
      await test.step(`Ngoài SF, tại block Accessories với Offer 1, add Product 2`, async () => {
        const storefront = await upsell.onAddProductFromQuickView(blocks, context, upsell);
        if (data.action === "Continue shopping") {
          await expect(storefront.locator(upsell.accessoryFirstItemAddCart)).toHaveText("Added");
        } else if (data.action.includes("cart page")) {
          await storefront.waitForSelector(XpathBlock.progressBar, { state: "detached" });
          expect(storefront.url()).toContain("/cart");
        } else {
          await storefront.waitForSelector(XpathBlock.progressBar, { state: "detached" });
          expect(storefront.url()).toContain("/checkout");
        }
        await storefront.close();
      });
    }
  });
  test(`@SB_WEB_BUILDER_LBA_BACS_06 Accessories_Check hiển thị block Accessories khi thực hiện resize block trên màn webfront`, async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    let sectionId = "";
    await test.step(`Tại section 2, click add block`, async () => {
      sectionId = await blocks.clickAddBlockBtn("body", 2);
    });
    await test.step(`Chọn block Accessories`, async () => {
      await blocks.getTemplatePreviewByName("Accessories").click();
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
      await blocks.frameLocator.locator(upsell.accessoryFirstItemImgWithAttrs).waitFor({ state: "visible" });
    });
    await test.step(`Resize block free`, async () => {
      const count = await blocks.frameLocator.locator(blocks.resizer).count();
      for (let i = 0; i < count; i++) {
        await expect(blocks.frameLocator.locator(blocks.resizer).nth(i)).toHaveAttribute("resize-mode", "width");
      }
    });
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const data = conf.caseConf.data[i];
      await blocks.switchToTab("Design");
      await test.step(`Resize block theo chiều ngang có ${data.title}`, async () => {
        if (i === 0) {
          await blocks.selectDropDown("width", "Px");
          // Web builder debounce action change settings so need to wait
          await blocks.waitAbit(200);
        } else {
          await blocks.settingWidthHeight("width", { value: 1120 });
          await blocks.titleBar.click({ delay: 200 });
        }

        await blocks.resize({ section: 2, block: 1 }, "right", data.resize);
      });
      await test.step(`Click button Save and click button Preview after click button Add product 2`, async () => {
        await blocks.clickSaveAndVerifyPreview(
          {
            context,
            dashboard: blocks.page,
            savedMsg: conf.caseConf.expected.saved,
            snapshotName: "",
            onlyClickSave: true,
            selector: blocks.sectionAccessories,
          },
          snapshotFixture,
        );
        const storefront = await upsell.onAddProductFromQuickView(blocks, context, upsell);
        await snapshotFixture.verifyWithAutoRetry({
          page: storefront,
          selector: blocks.sectionAccessories,
          snapshotName: data.expected,
        });
        await storefront.close();
      });
    }
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_08 Accessories_Check duplicate block Accessories`, async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    let sectionId;
    await test.step(`Click block Accessories`, async () => {
      sectionId = await blocks.clickAddBlockBtn("body", 2);
      await blocks.getTemplatePreviewByName("Accessories").click();
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
      await blocks.frameLocator.locator(upsell.accessoryFirstItemImgWithAttrs).waitFor({ state: "visible" });
      const blockId = await blocks.getAttrsDataId();
      await blocks.clickBackLayer();
      await blocks.clickElementById(blockId, ClickType.BLOCK);
    });
    await test.step(`Chọn duplicate`, async () => {
      await blocks.clickQuickSettingByLabel("Ctrl+D", "button");
    });
    await test.step(`Click button Save và click button Preview`, async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: "",
          onlyClickSave: true,
          selector: blocks.sectionAccessories,
        },
        snapshotFixture,
      );
      const storefront = await upsell.gotoProductPage(blocks, context);
      await storefront
        .locator(`${upsell.accessoryBlock}:nth-child(1) ${upsell.accessoryFirstItemImgWithAttrs}`)
        .waitFor({ state: "visible" });
      await waitForImageLoaded(storefront, `${upsell.accessoryBlock}:nth-child(1) ${upsell.accessoryFirstItemImg}`);
      await snapshotFixture.verifyWithAutoRetry({
        page: storefront,
        selector: `section[id="${sectionId}"]`,
        snapshotName: conf.caseConf.expected.screenshot,
      });
      await storefront.close();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_09 Accessories_Check remove block Accessories trên quickbar`, async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Click block Accessories`, async () => {
      const sectionId = await blocks.clickAddBlockBtn("body", 2);
      await blocks.getTemplatePreviewByName("Accessories").click();
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
      await blocks.frameLocator.locator(upsell.accessoryFirstItemImgWithAttrs).waitFor({ state: "visible" });
      const blockId = await blocks.getAttrsDataId();
      await blocks.clickBackLayer();
      await blocks.clickElementById(blockId, ClickType.BLOCK);
    });
    await test.step(`Chọn remove`, async () => {
      await blocks.clickQuickSettingByLabel("Delete", "button");
    });
    await test.step(`Click button Save và click button Preview`, async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: "",
          onlyClickSave: true,
        },
        snapshotFixture,
      );
      const storefront = await upsell.gotoProductPage(blocks, context);
      await storefront.waitForResponse(
        response => response.url().includes("/api/offers/list.json") && response.status() === 200,
      );
      await expect(storefront.locator(upsell.accessoryStorefront)).toHaveCount(0);
      await storefront.close();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_10 Accessories_Check remove block Accessories trên sidebar`, async ({
    context,
    conf,
    snapshotFixture,
  }) => {
    await test.step(`Click block Accessories`, async () => {
      const sectionId = await blocks.clickAddBlockBtn("body", 2);
      await blocks.getTemplatePreviewByName("Accessories").click();
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
      await expect(blocks.genLoc(blocks.sidebarTitle)).toHaveText(conf.caseConf.expected.title);
    });
    await test.step(`Click button Remove bên Sidebar`, async () => {
      await blocks.page.getByRole("button", { name: "Delete block" }).click();
      await expect(blocks.frameLocator.locator(upsell.accessoryStorefront)).toHaveCount(0);
    });
    await test.step(`Click button Save và click button Preview`, async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: "",
          onlyClickSave: true,
        },
        snapshotFixture,
      );
      const storefront = await upsell.gotoProductPage(blocks, context);
      await storefront.waitForResponse(
        response => response.url().includes("/api/offers/list.json") && response.status() === 200,
      );
      await expect(storefront.locator(upsell.accessoryStorefront)).toHaveCount(0);
      await storefront.close();
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_11 Accessories_Check show recommend products của block Accessories`, async ({
    conf,
    snapshotFixture,
  }) => {
    for (let i = 0; i < conf.caseConf.data.length; i++) {
      const data = conf.caseConf.data[i];
      await test.step(`Tại section ${data.section}, check hiển thị recommend của block Accessories`, async () => {
        const sectionId = await blocks.clickAddBlockBtn("body", data.section);
        await blocks.getTemplatePreviewByName("Accessories").click({ delay: 200 });
        await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
        if (data.section === 1) {
          await blocks.frameLocator.locator(upsell.accessoryFirstItemImgPlaceholder).waitFor({ state: "visible" });
        } else {
          await blocks.frameLocator
            .locator(`section[id="${sectionId}"] ${upsell.accessoryFirstItemImgWithAttrs}`)
            .waitFor({ state: "visible" });
          await blocks.page.locator(blocks.xpathDataId).hover();
          await waitForImageLoaded(
            blocks.page,
            `section[id="${sectionId}"] ${upsell.accessoryFirstItemImg}`,
            blocks.iframe,
          );
        }

        if (data.section === 3) {
          await upsell.sortProductAccessories(blocks.frameLocator, sectionId);
        }

        await blocks.page.locator(blocks.xpathDataId).hover();
        await snapshotFixture.verifyWithAutoRetry({
          page: blocks.page,
          selector: blocks.mainWb,
          snapshotName: data.expected,
        });
      });

      if (data.expected_less) {
        await test.step(`Click button View more products`, async () => {
          await blocks.frameLocator.locator(upsell.accessoryLoadMoreBtn).click();
          await blocks.page.locator(blocks.xpathDataId).hover();
          await snapshotFixture.verifyWithAutoRetry({
            page: blocks.page,
            selector: blocks.mainWb,
            snapshotName: data.expected_less,
            combineOptions: {
              animations: "disabled",
            },
          });
        });
        await test.step(`Click button View less products`, async () => {
          await blocks.frameLocator.locator(upsell.accessoryLoadMoreBtn).click();
          await blocks.page.locator(blocks.xpathDataId).hover();
          await snapshotFixture.verifyWithAutoRetry({
            page: blocks.page,
            selector: blocks.mainWb,
            snapshotName: data.expected,
            combineOptions: {
              animations: "disabled",
            },
          });
        });
      }

      await blocks.clickBackLayer();
    }
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_12 Accessories_Check active offer`, async ({ cConf }) => {
    await test.step(`Tại section 3, check target product có 1 offer`, async () => {
      const sectionId = await blocks.clickAddBlockBtn("body", 3);
      await blocks.getTemplatePreviewByName("Accessories").click();
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
      await expect(
        blocks.frameLocator.locator(`section[id="${sectionId}"] ${upsell.accessoryNavigation}`),
      ).toBeHidden();
      await expect(blocks.frameLocator.locator(`section[id="${sectionId}"] ${upsell.accessoryMsg}`)).toHaveText(
        cConf.expected.offer_title_test,
      );
      await blocks.clickBackLayer();
    });
    await test.step(`Tại section 2, check target product có > 1 offer`, async () => {
      const sectionId = await blocks.clickAddBlockBtn("body", 2);
      await blocks.getTemplatePreviewByName("Accessories").click({ delay: 200 });
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
      await expect(
        blocks.frameLocator.locator(`section[id="${sectionId}"] ${upsell.accessoryNavigation}`),
      ).toBeVisible();
      await expect(
        blocks.frameLocator.locator(`section[id="${sectionId}"] ${upsell.accessoryLoadMoreBtn}`),
      ).toBeHidden();
      await expect(blocks.frameLocator.locator(`section[id="${sectionId}"] ${upsell.accessoryMsg}`)).toHaveText(
        cConf.expected.offer_title_deal,
      );
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_13 Accessories_Check inactive offer`, async ({ cConf }) => {
    await test.step(`Tại section 3, check target product có 1 offer`, async () => {
      const sectionId = await blocks.clickAddBlockBtn("body", 3);
      await blocks.getTemplatePreviewByName("Accessories").click();
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
      await blocks.frameLocator
        .locator(`section[id="${sectionId}"] ${upsell.accessoryFirstItemImgPlaceholder}`)
        .waitFor({ state: "visible" });
      await expect(
        blocks.frameLocator.locator(`section[id="${sectionId}"] ${upsell.accessoryFirstItemImgPlaceholder}`),
      ).toBeVisible();
      await blocks.clickBackLayer();
    });
    await test.step(`Tại section 2, check target product có > 1 offer`, async () => {
      const sectionId = await blocks.clickAddBlockBtn("body", 2);
      await blocks.getTemplatePreviewByName("Accessories").click({ delay: 200 });
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
      await expect(
        blocks.frameLocator.locator(`section[id="${sectionId}"] ${upsell.accessoryNavigation}`),
      ).toBeHidden();
      await expect(
        blocks.frameLocator.locator(`section[id="${sectionId}"] ${upsell.accessoryLoadMoreBtn}`),
      ).toBeVisible();
      await expect(blocks.frameLocator.locator(`section[id="${sectionId}"] ${upsell.accessoryMsg}`)).toHaveText(
        cConf.expected.offer_title,
      );
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_14 Accessories_Check hiển thị offer có chứa product bị out of stock`, async ({
    cConf,
  }) => {
    await verifyHiddenProduct(blocks, upsell, cConf, "bị out of stock");
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_15 Accessories_Check hiển thị offer có chứa product bị xóa`, async ({ cConf }) => {
    await verifyHiddenProduct(blocks, upsell, cConf, "bị xóa");
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_16 Accessories_Check hiển thị offer có chứa product bị unlisting`, async ({
    cConf,
  }) => {
    await test.step(`Tại section 3, check offer có 1 số product bị unlisting`, async () => {
      const sectionId = await blocks.clickAddBlockBtn("body", 3);
      await blocks.getTemplatePreviewByName("Accessories").click();
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
      await blocks.frameLocator
        .locator(`section[id="${sectionId}"] ${upsell.accessoryNavigation}`)
        .waitFor({ state: "visible" });
      await expect(
        blocks.frameLocator.locator(`section[id="${sectionId}"] ${upsell.accessoryNavigation}`),
      ).toBeVisible();

      await expect(blocks.frameLocator.locator(upsell.accessoryMsg)).toHaveText(cConf.expected.product_message);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_19 Accessories_Check hiển thị block Accessories khi turn off App Upsell`, async () => {
    await test.step(`Tại section 2, click add block`, async () => {
      await blocks.clickAddBlockBtn("body", 3);
      await expect(blocks.getTemplatePreviewByName("Accessories")).toHaveClass(/is-disabled/);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_BACS_20 Accessories_Check hiển thị style của block Accessories khi thay đổi website style`, async ({
    context,
    conf,
    cConf,
    snapshotFixture,
  }) => {
    const webPageStyle = new WebPageStyle(blocks.page, conf.suiteConf.domain);
    await test.step(`Tại Website style, setting font và color cho page`, async () => {
      await blocks.switchTabWebPageStyle("Web");
      await webPageStyle.clickStylingType("Colors");
      await blocks.genLoc(await webPageStyle.getXpathColorLibraryByTitle("A Fresh Platter")).click();
      await blocks.page.waitForSelector(webPageStyle.colorToast, { state: "detached" });
      await blocks.clickBackLayer();
      await webPageStyle.clickStylingType("Fonts");
      await blocks.genLoc(webPageStyle.getXpathFontLibraryByIndex(7)).click();
      await blocks.page.waitForSelector(webPageStyle.fontToast, { state: "detached" });
      await blocks.clickBackLayer();
      await webPageStyle.clickStylingType("Buttons");
      await blocks.page.getByRole("button", { name: "Secondary" }).click();
      await blocks.genLoc(webPageStyle.buttonTextColor).click();
      await blocks.genLoc(blocks.getXpathPresetColor(4)).click();
      await blocks.clickCategorySetting("Buttons");
      await blocks.genLoc(webPageStyle.buttonShape).click();
      await blocks.genLoc(blocks.popOverXPath).locator("span[class*=select__item]").nth(2).click();
      await blocks.genLoc(`${blocks.thumnailImageVideo}/span`).click();
      await blocks.genLoc(blocks.getXpathPresetBgColor(3)).click();
      await blocks.clickCategorySetting("Buttons");
      const sectionId = await blocks.clickAddBlockBtn("body", 2);
      await blocks.getTemplatePreviewByName("Accessories").click();
      await blocks.waitResponseWithUrl("/api/offers/products_v2.json");
      await upsell.reloadFrameWhenOfferNotShow(blocks, `section[id="${sectionId}"] ${upsell.accessoryMsg}`);
      await blocks.frameLocator.locator(upsell.accessoryFirstItemImgWithAttrs).waitFor({ state: "visible" });
      await waitForImageLoaded(blocks.page, upsell.accessoryFirstItemImg, blocks.iframe);
      await snapshotFixture.verifyWithAutoRetry({
        page: blocks.page,
        selector: blocks.mainWb,
        snapshotName: cConf.expected.screenshot,
      });
    });
    await test.step(`Click button preview & click button Save`, async () => {
      await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard: blocks.page,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: cConf.expected.screenshot_sfn,
          handleWaitFor: async (storefront: Page) => {
            await storefront.locator(upsell.accessoryFirstItemImgWithAttrs).waitFor({ state: "visible" });
            await waitForImageLoaded(storefront, upsell.accessoryFirstItemImg);
          },
          selector: blocks.sectionAccessories,
        },
        snapshotFixture,
      );
    });
  });
});
