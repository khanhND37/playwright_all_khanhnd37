import { test } from "@fixtures/website_builder";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { Blocks } from "@pages/shopbase_creator/dashboard/blocks";
import { ThemeEcom } from "@pages/new_ecom/dashboard/themes";
import { expect, FrameLocator } from "@playwright/test";
import { snapshotDir } from "@utils/theme";

let webBuilder: WebBuilder,
  blocks: Blocks,
  themeId: number,
  themes: ThemeEcom,
  accessToken: string,
  frameLocator: FrameLocator,
  data,
  green: string;

test.describe("Verify drag drop header, footer", () => {
  test.beforeEach(async ({ dashboard, theme, conf }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    data = conf.caseConf.data;
    webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);
    frameLocator = webBuilder.frameLocator;
    themes = new ThemeEcom(dashboard, conf.suiteConf.domain);
    blocks = new Blocks(dashboard, conf.suiteConf.domain);
    green = "rgb(4, 180, 133)";

    const id = await theme.getIdByNameTemplate(data.template_name, conf.suiteConf.lib_id);
    const response = await theme.applyTemplate(id[0]);
    themeId = response.id;
    await theme.publish(themeId);

    await test.step("Open web builder > Add blank section > Add block menu", async () => {
      await webBuilder.openWebBuilder({ type: "site", id: themeId, page: "home" });
      await frameLocator.locator(webBuilder.oldBlankPage).waitFor({ state: "hidden" });
    });
  });

  test.afterEach(async ({ conf, token }) => {
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken;
    await themes.deleteAllThemesUnPublish(accessToken);
  });

  test("@SB_WEB_BUILDER_DnD_11 Section_Check di chuyển các section trên Layer giữa Header/Body/Footer ", async ({
    dashboard,
  }) => {
    await test.step("Click vào icon layer trên thanh bar", async () => {
      await webBuilder.clickBtnNavigationBar("layer");
    });
    for (const dnd of data.dnd) {
      await test.step(dnd.description, async () => {
        await webBuilder.dndLayerInSidebar({
          from: dnd.from,
          to: dnd.to,
        });

        if (dnd.expect.toast) {
          await expect(await dashboard.locator(webBuilder.getXpathByText(dnd.expect.toast))).toBeVisible();
        } else await expect(await webBuilder.toastMessage).toBeHidden();

        for (const sectionName of dnd.expect.sections_area) {
          const strokeOrFill = (await (
            await webBuilder.getXpathIconGreenGrey("green", sectionName)
          ).getAttribute("stroke"))
            ? "stroke"
            : "fill";
          const strokeOrFillRow = (await (
            await webBuilder.getXpathIconGreenGrey("green", sectionName, true)
          ).getAttribute("stroke"))
            ? "stroke"
            : "fill";
          const strokeOrFillColumn = (await (
            await webBuilder.getXpathIconGreenGrey("green", sectionName, false, true)
          ).getAttribute("stroke"))
            ? "stroke"
            : "fill";
          if (dnd.expect.color === green) {
            await expect(await webBuilder.getXpathIconGreenGrey("green", sectionName)).toHaveCSS(
              strokeOrFill,
              dnd.expect.color,
            );
            await expect(await webBuilder.getXpathIconGreenGrey("green", sectionName, true)).toHaveCSS(
              strokeOrFillRow,
              dnd.expect.color,
            );
            await expect(await webBuilder.getXpathIconGreenGrey("green", sectionName, false, true)).toHaveCSS(
              strokeOrFillColumn,
              dnd.expect.color,
            );
          } else {
            await expect(await webBuilder.getXpathIconGreenGrey("green", sectionName)).not.toHaveCSS(
              strokeOrFill,
              dnd.expect.color,
            );
            await expect(await webBuilder.getXpathIconGreenGrey("green", sectionName, true)).not.toHaveCSS(
              strokeOrFillRow,
              dnd.expect.color,
            );
            await expect(await webBuilder.getXpathIconGreenGrey("green", sectionName, false, true)).not.toHaveCSS(
              strokeOrFillColumn,
              dnd.expect.color,
            );

            await expect(await webBuilder.getXpathIconGreenGrey("grey", sectionName)).toHaveCSS(
              "color",
              dnd.expect.color,
            );
            await expect(await webBuilder.getXpathIconGreenGrey("grey", sectionName, true)).toHaveCSS(
              "color",
              dnd.expect.color,
            );
            await expect(await webBuilder.getXpathIconGreenGrey("grey", sectionName, false, true)).toHaveCSS(
              "color",
              dnd.expect.color,
            );
          }
        }
      });
    }

    for (const item of data.webfront) {
      for (const section of item.sections) {
        await webBuilder.clickOnSection(section);
        if (item.body) {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline",
            `${item.color} solid 2px`,
          );
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).not.toHaveCSS("outline-color", green);
        } else {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline-color",
            item.color,
          );
        }
        await blocks.clickBackLayer();
      }
    }
  });

  test("@SB_WEB_BUILDER_DnD_12 Section_Kéo section từ bảng Insert panel vào WB + xóa section ở header/footer", async ({
    dashboard,
  }) => {
    for (const dnd of data.dnd) {
      await test.step(dnd.description, async () => {
        await webBuilder.dragAndDropInWebBuilder(dnd.position_section);

        if (dnd.expect.toast) {
          await expect(await dashboard.locator(webBuilder.getXpathByText(dnd.expect.toast))).toBeVisible();
        } else await expect(await webBuilder.toastMessage).toBeHidden();

        if (dnd.expect.body) {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline",
            `${dnd.expect.color} solid 2px`,
          );
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).not.toHaveCSS("outline-color", green);
        } else {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline-color",
            dnd.expect.color,
          );
        }
      });

      await test.step("Xóa section", async () => {
        await webBuilder.clickOnBtnWithLabel("Delete section");
        if (dnd.delete.toast) {
          await expect(await dashboard.locator(webBuilder.getXpathByText(dnd.delete.toast))).toBeVisible();
        } else await expect(await webBuilder.toastMessage).toBeHidden();
      });
    }
  });

  test("@SB_WEB_BUILDER_DnD_13 Add section ở viền top/bottom section trên webfront", async ({ dashboard }) => {
    for (const dnd of data.dnd) {
      await test.step(dnd.description, async () => {
        await webBuilder.clickBtnNavigationBar("layer");
        await webBuilder.clickOnSection(dnd.sectionName);
        if (dnd.top) {
          await frameLocator.locator(webBuilder.xpathIndicator).nth(0).click();
        } else {
          await frameLocator.locator(webBuilder.xpathIndicator).nth(1).click();
        }
        await webBuilder.waitForXpathState(webBuilder.xpathInsert, "stable");
        await dashboard.locator(webBuilder.getXpathByText("Single column", webBuilder.xpathInsert)).click();

        if (dnd.expect.toast) {
          await expect(await dashboard.locator(webBuilder.getXpathByText(dnd.expect.toast))).toBeVisible();
          await webBuilder.waitUntilElementInvisible(webBuilder.getXpathByText(dnd.expect.toast));
        } else await expect(await webBuilder.toastMessage).toBeHidden();

        if (dnd.expect.body) {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline",
            `${dnd.expect.color} solid 2px`,
          );
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).not.toHaveCSS("outline-color", green);
        } else {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline-color",
            dnd.expect.color,
          );
        }
      });
    }
  });

  test("@SB_WEB_BUILDER_DnD_15 Block_Kéo block từ bảng Insert panel vào WB + xóa block ở header/footer", async ({
    dashboard,
  }) => {
    for (const dnd of data.dnd) {
      await test.step(dnd.description, async () => {
        await webBuilder.dragAndDropInWebBuilder(dnd.position_block);

        if (dnd.expect.toast) {
          await expect(await dashboard.locator(webBuilder.getXpathByText(dnd.expect.toast))).toBeVisible();
          await webBuilder.waitUntilElementInvisible(webBuilder.getXpathByText(dnd.expect.toast));
        } else await expect(await webBuilder.toastMessage).toBeHidden();

        if (dnd.expect.body) {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline",
            `${dnd.expect.color} solid 2px`,
          );
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).not.toHaveCSS("outline-color", green);
        } else {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline-color",
            dnd.expect.color,
          );
        }
      });

      await test.step("Xóa block", async () => {
        await webBuilder.clickOnBtnWithLabel("Delete block");
        if (dnd.delete.toast) {
          await expect(await dashboard.locator(webBuilder.getXpathByText(dnd.delete.toast))).toBeVisible();
        } else await expect(await webBuilder.toastMessage).toBeHidden();
      });
    }
  });

  test("@SB_WEB_BUILDER_DnD_16 Block_Dịch chuyển block trên webfront", async ({ dashboard }) => {
    for (const dnd of data.dnd) {
      await test.step(dnd.description, async () => {
        await webBuilder.dndTemplateInPreview(dnd.position_block);

        if (dnd.expect.toast) {
          await expect(await dashboard.locator(webBuilder.getXpathByText(dnd.expect.toast))).toBeVisible();
        } else await expect(await webBuilder.toastMessage).toBeHidden();

        if (dnd.expect.body) {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline",
            `${dnd.expect.color} solid 2px`,
          );
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).not.toHaveCSS("outline-color", green);
        } else {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline-color",
            dnd.expect.color,
          );
        }
        await blocks.clickBackLayer();
      });
    }
  });

  test("@SB_WEB_BUILDER_DnD_17 Add row ở viền top/bottom row trên webfront", async ({}) => {
    for (const dnd of data.dnd) {
      await test.step(dnd.description, async () => {
        await webBuilder.clickBtnNavigationBar("layer");
        await webBuilder.clickOnRowColumn(dnd.sectionName);
        if (dnd.top) {
          await frameLocator.locator(webBuilder.xpathIndicator).nth(0).click();
        } else {
          await frameLocator.locator(webBuilder.xpathIndicator).nth(1).click();
        }
        await frameLocator.locator(webBuilder.columnLayout).nth(8).click();
        await expect(await webBuilder.toastMessage).toBeHidden();

        if (dnd.expect.body) {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline",
            `${dnd.expect.color} solid 2px`,
          );
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).not.toHaveCSS("outline-color", green);
        } else {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline-color",
            dnd.expect.color,
          );
        }
      });
    }
  });

  test("@SB_WEB_BUILDER_DnD_18 Add column ở viền left/right column trên webfront", async ({}) => {
    for (const dnd of data.dnd) {
      await test.step(dnd.description, async () => {
        await webBuilder.clickBtnNavigationBar("layer");
        await webBuilder.clickOnRowColumn(dnd.sectionName, false);
        if (dnd.left) {
          await frameLocator.locator(webBuilder.xpathIndicatorColumn).nth(0).click();
        } else {
          await frameLocator.locator(webBuilder.xpathIndicatorColumn).nth(1).click();
        }
        await expect(await webBuilder.toastMessage).toBeHidden();

        if (dnd.expect.body) {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline",
            `${dnd.expect.color} solid 2px`,
          );
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).not.toHaveCSS("outline-color", green);
        } else {
          await expect(await frameLocator.locator(webBuilder.xpathBorderSection)).toHaveCSS(
            "outline-color",
            dnd.expect.color,
          );
        }
      });
    }
  });
});
