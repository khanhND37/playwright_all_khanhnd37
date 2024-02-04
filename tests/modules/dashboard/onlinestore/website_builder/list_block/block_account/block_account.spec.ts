import { snapshotDir } from "@core/utils/theme";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { expect, test } from "@fixtures/website_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { loadData } from "@core/conf/conf";

test.describe("Section interaction on web front", () => {
  let webBuilder: WebBuilder;
  let blocks: Blocks;

  test.beforeEach(async ({ dashboard, builder, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);

    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);

    await test.step("Set data for page & go to page", async () => {
      //set date for page
      const page = await builder.pageBuilder(conf.suiteConf.page_id);
      page.settings_data.pages.product[conf.suiteConf.variant].sections = conf.suiteConf.theme_data.sections;
      await builder.updatePageBuilder(conf.suiteConf.page_id, page.settings_data);
      //Go to web front by page ID
      await dashboard.evaluate(pageId => {
        // eslint-disable-next-line
        return (window as any).router.push(`/builder/page/${pageId}`);
      }, conf.suiteConf.page_id);
      await dashboard.waitForResponse(
        response => response.url().includes("/api/checkout/next/cart.json") && response.status() === 200,
      );
      //wait icon loading hidden
      await dashboard.locator(blocks.xpathPreviewSpinner).waitFor({ state: "hidden" });

      await test.step("Add Container block with position = auto", async () => {
        await webBuilder.dragAndDropInWebBuilder(conf.suiteConf.theme_data.block);
        expect(await blocks.getUnitOfField("position")).toEqual("Auto");
      });
    });
  });

  test("@SB_ACC_BLOCK_01 - [Style] Verify các giá trị default của tab Style Account block", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step("Verify value default of tab style", async () => {
      await snapshotFixture.verify({
        page: dashboard,
        selector: webBuilder.xpathTabStyle,
        snapshotName: conf.caseConf.expected.snapshot_default_style_account_block,
      });
    });

    await test.step("Verify layout = vertical on SF", async () => {
      const newTab = await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.saved,
          snapshotName: "",
          isNextStep: true,
        },
        snapshotFixture,
      );

      await snapshotFixture.verify({
        page: newTab,
        selector: webBuilder.selectMainSF,
        snapshotName: conf.caseConf.expected.snapshot_default_account_block,
      });
    });
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data_test.length; i++) {
    const caseData = conf.caseConf.data_test[i];
    test(`@${caseData.case_id} ${caseData.description}`, async ({ context, dashboard, snapshotFixture }) => {
      const data = caseData.data;
      for (let j = 0; j < data.length; j++) {
        if (j !== 0) {
          switch (caseData.case_id) {
            case "SB_ACC_BLOCK_2":
              await webBuilder.selectTypeOfAccountBar(data[j].index);
              break;
            case "SB_ACC_BLOCK_3":
              await webBuilder.selectTypeOfAccountBar(1);
              await dashboard.click(webBuilder.xpathTextColor);
              await webBuilder.settingColorsStyles(data[i].color);
              break;
            case "SB_ACC_BLOCK_4":
              await webBuilder.selectAlign("align_self", data[j].align);
              break;
            case "SB_ACC_BLOCK_5":
              await webBuilder.settingWidthHeight("width", data[j].width);
              await webBuilder.settingWidthHeight("height", data[j].height);
              break;
            case "SB_ACC_BLOCK_6":
              await webBuilder.setBackground("background", data[j].background);
              break;
            case "SB_ACC_BLOCK_7":
              await webBuilder.setBorder("border", data[j].border);
              break;
            case "SB_ACC_BLOCK_8":
              await webBuilder.editSliderBar("box_shadow", data[j].shadow);
              break;
            case "SB_ACC_BLOCK_9":
              await dashboard.fill(webBuilder.xpathInputSlideBar("opacity"), data[j].value_opacity);
              break;
            case "SB_ACC_BLOCK_10":
              await dashboard.fill(webBuilder.xpathInputSlideBar("border_radius"), data[j].value_radius);
              break;
            case "SB_ACC_BLOCK_11":
              await webBuilder.setMarginPadding("padding", data[j].padding);
              await webBuilder.setMarginPadding("margin", data[j].margin);
              break;
            default:
              break;
          }
          await dashboard.waitForTimeout(1000);
        }
        await test.step("Verify hiển thị account block ngoài sf", async () => {
          const newTab = await blocks.clickSaveAndVerifyPreview(
            {
              context,
              dashboard,
              savedMsg: caseData.message_save,
              snapshotName: "",
              isNextStep: true,
            },
            snapshotFixture,
          );

          await snapshotFixture.verify({
            page: newTab,
            selector: webBuilder.selectMainSF,
            snapshotName: data[j].snapshot_sf,
          });
        });
      }
    });
  }

  test("@SB_ACC_BLOCK_12 - [Setting] Verify các giá trị default của tab setting Account block", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    const snapshotName = conf.caseConf.expected;
    await test.step("Verify value default of tab style", async () => {
      await webBuilder.clickElementWithLabel("div", "Settings");
      await dashboard.waitForTimeout(1000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: webBuilder.xpathTabStyle,
        snapshotName: snapshotName.snapshot_default_setting_account_block_dashboard,
      });
    });

    await test.step("Verify layout = vertical on SF", async () => {
      const newTab = await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.expected.message_saved,
          snapshotName: "",
          isNextStep: true,
        },
        snapshotFixture,
      );

      await newTab.click(webBuilder.xpathAccountBarSF);
      await dashboard.waitForTimeout(1000);
      await snapshotFixture.verify({
        page: newTab,
        selector: webBuilder.selectMainSF,
        snapshotName: conf.caseConf.expected.snapshot_default_setting_account_block_sf,
      });
    });
  });

  test("@SB_ACC_BLOCK_13 - [Setting] Check các action trong tab setting của account block", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    const testData = conf.caseConf.test_data;
    for (let i = 0; i < testData.length; i++) {
      await test.step("Verify value default of tab style", async () => {
        await webBuilder.clickElementWithLabel("div", "Settings");
        if (testData[i].action === "drag") {
          await webBuilder.dragAndDrop({
            from: {
              selector: webBuilder.xpathDragDropInSetting(testData[i].drag.index_from),
            },
            to: {
              selector: webBuilder.xpathDragDropInSetting(testData[i].drag.index_to),
            },
          });
        } else if (testData[i].action === "remove") {
          await webBuilder.removeMemberPages(testData[i].pages);
        } else {
          await webBuilder.duplicateMemberPages(testData[i].pages);
        }
        await dashboard.waitForTimeout(1000);
        await snapshotFixture.verify({
          page: dashboard,
          selector: webBuilder.xpathTabStyle,
          snapshotName: testData[i].snapshot.dashboard,
        });
      });
      await test.step("Verify layout = vertical on SF", async () => {
        const newTab = await blocks.clickSaveAndVerifyPreview(
          {
            context,
            dashboard,
            savedMsg: conf.caseConf.message_saved,
            snapshotName: "",
            isNextStep: true,
          },
          snapshotFixture,
        );

        await newTab.click(webBuilder.xpathAccountBarSF);
        await dashboard.waitForTimeout(6000);
        await snapshotFixture.verify({
          page: newTab,
          selector: webBuilder.selectMainSF,
          snapshotName: testData[i].snapshot.store_front,
        });
      });
    }
  });

  test("@SB_ACC_BLOCK_14 - [Setting] Verify action Add new page", async ({
    conf,
    context,
    dashboard,
    snapshotFixture,
  }) => {
    await test.step("Add member pages", async () => {
      await webBuilder.clickElementWithLabel("div", "Settings");
      await webBuilder.addMemberPages(conf.caseConf.pages);
      await dashboard.waitForTimeout(1000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: webBuilder.xpathTabStyle,
        snapshotName: conf.caseConf.snapshot.dashboard,
      });
    });
    await test.step("Verify layout = vertical on SF", async () => {
      const newTab = await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.message_saved,
          snapshotName: "",
          isNextStep: true,
        },
        snapshotFixture,
      );

      await newTab.click(webBuilder.xpathAccountBarSF);
      await dashboard.waitForTimeout(1000);
      await snapshotFixture.verify({
        page: newTab,
        selector: webBuilder.selectMainSF,
        snapshotName: conf.caseConf.snapshot.store_front,
      });
    });
  });
  test("@SB_ACC_BLOCK_15 - Verify remove account block", async ({ conf, context, dashboard, snapshotFixture }) => {
    await test.step("Verify layout = vertical on SF", async () => {
      await webBuilder.clickOnBtnWithLabel("Remove block");
      const newTab = await blocks.clickSaveAndVerifyPreview(
        {
          context,
          dashboard,
          savedMsg: conf.caseConf.message_saved,
          snapshotName: "",
          isNextStep: true,
        },
        snapshotFixture,
      );

      await snapshotFixture.verify({
        page: newTab,
        selector: webBuilder.selectMainSF,
        snapshotName: conf.caseConf.snapshot,
      });
    });
  });
});
