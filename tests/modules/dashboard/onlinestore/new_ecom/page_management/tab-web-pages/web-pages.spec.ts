import { TokenType } from "@core/utils/token";
import { expect, test } from "@fixtures/website_builder";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { ShopTheme } from "@types";
test.describe("Verify web pages", () => {
  let dashboardPage: DashboardPage,
    otherPage: OtherPage,
    blockPage: Blocks,
    duplicatedTheme: ShopTheme,
    themeId: number,
    numberItem: number;

  test(`@SB_NEWECOM_NEPM_01 Tab Web Pages_Kiểm tra giao diện trang Page management trong dashboard khi shop publish theme V3`, async ({
    conf,
    context,
    multipleStore,
    theme,
  }) => {
    test.slow();
    for (const shop of conf.suiteConf.shops) {
      const page = await multipleStore.getDashboardPage(
        conf.suiteConf.username,
        conf.suiteConf.password,
        shop.shop_domain,
        shop.shop_id,
        conf.suiteConf.user_id,
      );
      dashboardPage = new DashboardPage(page, shop.shop_domain);
      otherPage = new OtherPage(page, shop.shop_domain);
      blockPage = new Blocks(page, shop.shop_domain);
      const sectionSelector = blockPage.getSelectorByIndex({ section: 3 });
      await dashboardPage.goto("/admin");
      const block = conf.caseConf.block;
      const authConfigObj = {
        domain: shop.shop_domain,
        password: conf.suiteConf.password,
        username: conf.suiteConf.username,
        tokenType: TokenType.ShopToken,
        userId: conf.suiteConf.user_id,
      };

      await test.step("Precondition: Restore data theme", async () => {
        const listTemplate = [];
        const currentTheme = await theme.getPublishedTheme();
        if (currentTheme.id !== shop.theme_id) {
          await theme.publish(shop.theme_id, authConfigObj);
        }
        const listTheme = await theme.list(authConfigObj);
        listTheme.forEach(template => {
          if (!template.active) {
            listTemplate.push(template.id);
          }
        });
        if (listTemplate.length > 0) {
          for (const template of listTemplate) {
            if (template !== shop.theme_id) {
              await theme.delete(template, authConfigObj);
            }
          }
        }
      });

      await test.step("Precondition: Duplicate and publish theme", async () => {
        duplicatedTheme = await theme.duplicate(shop.theme_id, authConfigObj);
        themeId = duplicatedTheme.id;
        await theme.publish(themeId, authConfigObj);
      });

      await test.step(`Tại menu bar, chọn Online Store > Pages`, async () => {
        await otherPage.goToUrlPath();
        await otherPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);

        await expect(otherPage.genLoc(otherPage.getXpathByTabName("Web Pages"))).toBeVisible();
        await expect(otherPage.genLoc(otherPage.getXpathByTabName("Policy Pages"))).toBeVisible();
        expect(await otherPage.getTextDescriptionInPageTab()).toContain(conf.caseConf.text);
        await expect(otherPage.genLoc(otherPage.xpathTabNavFilter)).toBeVisible();
        await expect(otherPage.genLoc(otherPage.searchInPageList)).toBeVisible();
        await expect(otherPage.genLoc(otherPage.buttonAddNewPageSelector)).toBeVisible();

        const listPage = await otherPage.getAllPagesDisplayed();
        const filterArray = await otherPage.filterArray(conf.caseConf.pages, listPage);
        for (let i = 0; i < filterArray.length; i++) {
          const page = conf.caseConf.pages[i];
          expect(filterArray[i]).toEqual(
            expect.objectContaining({
              title: page.title,
              handle: page.handle,
              selectable: page.selectable,
              customizable: page.customize,
              duplicatable: page.duplicate,
              removable: page.delete,
              previewable: page.preview,
            }),
          );
        }
        for (const page of conf.caseConf.page_invisible_pb_plb) {
          await expect(dashboardPage.genLoc(otherPage.getXpathPageByTitle(page.title))).toBeHidden();
        }
      });

      await test.step(`Click text link Learn more`, async () => {
        await otherPage.genLoc(otherPage.getXpathByTabName("Web Pages")).scrollIntoViewIfNeeded();
        const [helpDoc] = await Promise.all([
          context.waitForEvent("page"),
          await otherPage.genLoc(otherPage.xpathLearnMore).click(),
        ]);
        await helpDoc.waitForLoadState("load");
        expect(helpDoc.url()).toContain(conf.caseConf.learn_more_link);
        await helpDoc.close();
      });

      await test.step(`Truy cập các page trên ở SF theo url`, async () => {
        const storefront = await context.newPage();
        if (shop.shop_type === "shopbase") {
          for (const page of conf.caseConf.page_invisible_shopbase) {
            await storefront.goto(`https://${shop.shop_domain}/pages/${page.handle}`);
            await storefront.waitForLoadState("load");
            await expect(storefront.locator(otherPage.xpathPageNotFound)).toBeHidden();
          }
        } else {
          for (const page of conf.caseConf.page_invisible_pb_plb) {
            await storefront.goto(`https://${shop.shop_domain}/pages/${page.handle}`);
            await storefront.waitForLoadState("load");
            await expect(storefront.locator(otherPage.xpathPageNotFound)).toBeHidden();
          }
        }
        await storefront.close();
      });

      await test.step(`- Open web builder shop, insert block button
    - Tại tab Content, chọn Action: Go to page
    - Click droplist mục Page, chọn Other pages`, async () => {
        await blockPage.openWebBuilder({ type: "site", id: themeId });
        await blockPage.genLoc(blockPage.overlay).waitFor({ state: "hidden" });
        await blockPage.genLoc("#v-progressbar").waitFor({ state: "detached" });
        await blockPage.page.waitForLoadState("networkidle");

        await blockPage.insertSectionBlock({
          parentPosition: { section: 3, column: 1 },
          template: "Button",
        });
        await blockPage.selectDropDown("link", block.action);
        await blockPage.selectPageActionGoToPage("link", block.page);

        if (shop.shop_type === "shopbase") {
          for (const page of conf.caseConf.page_invisible_shopbase) {
            await expect(blockPage.genLoc(blockPage.xpathSelectPageSidebar(page.title))).toBeVisible();
          }
        } else {
          for (const page of conf.caseConf.page_invisible_pb_plb) {
            await expect(blockPage.genLoc(blockPage.xpathSelectPageSidebar(page.title))).toBeVisible();
          }
        }
      });

      await test.step(`- Insert block image
      - Tại tab Content, chọn Action: Go to page
      - Click droplist mục Page, chọn Other pages`, async () => {
        await blockPage.genLoc(blockPage.getXpathByText("Delete block")).click();
        await blockPage.insertSectionBlock({
          parentPosition: { section: 3, column: 1 },
          template: "Image",
        });
        await blockPage.selectDropDown("link", block.action);
        await blockPage.selectPageActionGoToPage("link", block.page);

        if (shop.shop_type === "shopbase") {
          for (const page of conf.caseConf.page_invisible_shopbase) {
            await expect(blockPage.genLoc(blockPage.xpathSelectPageSidebar(page.title))).toBeVisible();
          }
        } else {
          for (const page of conf.caseConf.page_invisible_pb_plb) {
            await expect(blockPage.genLoc(blockPage.xpathSelectPageSidebar(page.title))).toBeVisible();
          }
        }
      });

      await test.step(`- Insert block Icon
      - Tại tab Content, chọn Action: Go to page
      - Click droplist mục Page, chọn Other pages`, async () => {
        await blockPage.genLoc(blockPage.getXpathByText("Delete block")).click();
        await blockPage.insertSectionBlock({
          parentPosition: { section: 3, column: 1 },
          template: "Icon",
        });
        await blockPage.selectDropDown("link", block.action);
        await blockPage.selectPageActionGoToPage("link", block.page);

        if (shop.shop_type === "shopbase") {
          for (const page of conf.caseConf.page_invisible_shopbase) {
            await expect(blockPage.genLoc(blockPage.xpathSelectPageSidebar(page.title))).toBeVisible();
          }
        } else {
          for (const page of conf.caseConf.page_invisible_pb_plb) {
            await expect(blockPage.genLoc(blockPage.xpathSelectPageSidebar(page.title))).toBeVisible();
          }
        }
      });

      await test.step(`- Insert block Slideshow
      - Tại tab Content, chọn Action: Go to page
      - Click droplist mục Page, chọn Other pages`, async () => {
        await blockPage.genLoc(blockPage.getXpathByText("Delete block")).click();
        await blockPage.insertSectionBlock({
          parentPosition: { section: 3, column: 1 },
          template: "Slideshow",
        });
        await blockPage.selectSlideSettings("settings");
        await blockPage.switchTabEditSlideSettings("Button");
        await blockPage.selectPageBtnSlideshow(block.action, 1, block.page);

        if (shop.shop_type === "shopbase") {
          for (const page of conf.caseConf.page_invisible_shopbase) {
            await expect(blockPage.genLoc(blockPage.xpathSelectPageSidebar(page.title))).toBeVisible();
          }
        } else {
          for (const page of conf.caseConf.page_invisible_pb_plb) {
            await expect(blockPage.genLoc(blockPage.xpathSelectPageSidebar(page.title))).toBeVisible();
          }
        }
      });

      await test.step(`- Insert block Menu
      - Tại tab Content, chọn Action: Go to page
      - Click droplist mục Page, chọn Other pages`, async () => {
        await blockPage.genLoc(blockPage.getXpathByText("Delete block")).click();
        await blockPage.insertSectionBlock({
          parentPosition: { section: 3, column: 1 },
          template: "Menu",
        });
        numberItem = await blockPage.countItemMenu();
        await blockPage.selectActionWithItem({ menu: numberItem }, "Item setting");
        await blockPage.inputTextBox(blockPage.getSelectorInWidgetMenu("Label"), block.label);
        await blockPage.selectActionWithItem({ menu: numberItem }, "Item setting");
        await blockPage.selectDropDown(blockPage.getSelectorInWidgetLink("Action"), block.action);
        await blockPage.selectPageInBlockMenu(block.page);

        if (shop.shop_type === "shopbase") {
          for (const page of conf.caseConf.page_invisible_shopbase) {
            await expect(blockPage.genLoc(blockPage.xpathSelectPageSidebar(page.title))).toBeVisible();
          }
        } else {
          for (const page of conf.caseConf.page_invisible_pb_plb) {
            await expect(blockPage.genLoc(blockPage.xpathSelectPageSidebar(page.title))).toBeVisible();
          }
        }
      });

      await test.step(`- Chọn page DMCA > click btn Save và view sf page
      - Trên sf, click vào menu link page DMCA`, async () => {
        await blockPage.genLoc(blockPage.xpathSelectPageSidebar("DMCA")).click();
        await blockPage.page.waitForTimeout(1000);
        const pageNameIsInvisible = await blockPage
          .genLoc(`//span[@class="sb-button--label" and normalize-space()='DMCA']`)
          .isHidden();
        if (pageNameIsInvisible) {
          await blockPage.genLoc(blockPage.xpathSelectPageSidebar("DMCA")).click();
          await blockPage.page.waitForSelector(`//span[@class="sb-button--label" and normalize-space()='DMCA']`);
        }
        await blockPage.clickBtnNavigationBar("save");
        await expect(blockPage.toastMessage).toContainText("All changes are saved");

        const storefront = await context.newPage();
        await storefront.goto(`https://${shop.shop_domain}`);
        await storefront.locator("#v-progressbar").waitFor({ state: "detached" });
        await storefront.waitForLoadState("networkidle");
        await storefront.locator(sectionSelector).waitFor({ state: "visible" });

        const [dmca] = await Promise.all([
          context.waitForEvent("page"),
          await storefront.waitForSelector(`${sectionSelector}//a[normalize-space()='DMCA']`),
          await storefront.locator(`${sectionSelector}//a[normalize-space()='DMCA']`).click(),
        ]);
        expect(dmca.url()).toContain(`https://${shop.shop_domain}/pages/dmca`);
        await storefront.close();
      });

      await test.step(`- Insert block Heading
      - Bôi đen đoạn text, chọn Link ở quick setting.
      - Click droplist và chọn Go to page
      - Click droplist Select và chọn Other pages`, async () => {
        await blockPage.genLoc(blockPage.getXpathByText("Delete block")).click();
        await blockPage.insertSectionBlock({
          parentPosition: { section: 3, column: 1 },
          template: "Heading",
        });
        await blockPage.selectOptionOnQuickBar("Edit text");
        await blockPage.page.keyboard.press("Control+KeyA");
        await blockPage.getQuickSettingsTextBtn("hyperlink").click();
        await blockPage.selectDroplistInBlockHeadingOrParagraph("Go to page");
        await blockPage.selectDroplistInBlockHeadingOrParagraph("Other Pages", 2);

        if (shop.shop_type === "shopbase") {
          for (const page of conf.caseConf.page_invisible_shopbase) {
            await expect(blockPage.frameLocator.locator(blockPage.xpathSelectPageInWebfront(page.title))).toBeVisible();
          }
        } else {
          for (const page of conf.caseConf.page_invisible_pb_plb) {
            await expect(blockPage.frameLocator.locator(blockPage.xpathSelectPageInWebfront(page.title))).toBeVisible();
          }
        }
      });

      await test.step(`- Insert block Paragraph
      - Bôi đen đoạn text, chọn Link ở quick setting.
      - Click droplist và chọn Go to page
      - Click droplist Select và chọn Other pages`, async () => {
        await blockPage.genLoc(blockPage.getXpathByText("Delete block")).click();
        await blockPage.insertSectionBlock({
          parentPosition: { section: 3, column: 1 },
          template: "Paragraph",
        });
        await blockPage.selectOptionOnQuickBar("Edit text");
        await blockPage.page.keyboard.press("Control+KeyA");
        await blockPage.page.keyboard.type(block.label);
        await blockPage.page.keyboard.press("Control+KeyA");
        await blockPage.getQuickSettingsTextBtn("hyperlink").click();
        await blockPage.selectDroplistInBlockHeadingOrParagraph("Go to page");
        await blockPage.selectDroplistInBlockHeadingOrParagraph("Other Pages", 2);

        if (shop.shop_type === "shopbase") {
          for (const page of conf.caseConf.page_invisible_shopbase) {
            await expect(blockPage.frameLocator.locator(blockPage.xpathSelectPageInWebfront(page.title))).toBeVisible();
          }
        } else {
          for (const page of conf.caseConf.page_invisible_pb_plb) {
            await expect(blockPage.frameLocator.locator(blockPage.xpathSelectPageInWebfront(page.title))).toBeVisible();
          }
        }
      });

      await test.step(`- Chọn page DMCA -> click btn Save và view sf page
      - Trên sf, click vào block paragraph`, async () => {
        const textEditor = blockPage.frameLocator.locator("[contenteditable=true]");
        await blockPage.frameLocator.locator(blockPage.xpathSelectPageInWebfront("DMCA")).click();
        await expect(blockPage.frameLocator.locator(blockPage.xpathPageSelectedInBlockHeadingOrParagraph)).toHaveText(
          "DMCA",
        );
        await blockPage.frameLocator.locator(blockPage.xpathBtnWithLabel("Apply")).click();
        await blockPage.waitAbit(1000);
        await blockPage.backBtn.click();
        await textEditor.waitFor({ state: "hidden" });
        await blockPage.clickBtnNavigationBar("save");
        await expect(blockPage.toastMessage).toContainText("All changes are saved");

        const storefront = await context.newPage();
        await storefront.goto(`https://${shop.shop_domain}`);
        await storefront.locator("#v-progressbar").waitFor({ state: "detached" });
        await storefront.waitForLoadState("networkidle");
        await storefront.locator(sectionSelector).waitFor({ state: "visible" });

        await storefront.locator(`${sectionSelector}//a`).click();
        await storefront.waitForSelector(otherPage.xpathContentDMCAPage);
        expect(storefront.url()).toContain(`https://${shop.shop_domain}/pages/dmca`);
      });
    }
  });
});
