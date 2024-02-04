import { expect, test } from "@core/fixtures";
import { Locator } from "@playwright/test";
import { WebBuilder } from "@pages/dashboard/web_builder";
import { waitForImageLoaded } from "@utils/theme";

test.describe("Demo web builder", () => {
  test("demo @TC_DEMO", async ({ dashboard, conf }) => {
    const domain = conf.suiteConf.domain;
    const pageId = conf.caseConf.page;
    const webBuilder = new WebBuilder(dashboard, conf.suiteConf.domain);

    const locator = (selector: string): Locator => {
      return dashboard.frameLocator("#preview").locator(selector);
    };

    const verifyGhost = async () => {
      await expect(locator(".wb-dnd-ghost")).toBeVisible();
    };

    await test.step("Open page and create 3 blank sections", async () => {
      await dashboard.goto(`https:${domain}/admin/builder/page/${pageId}`);
      await dashboard.waitForLoadState("networkidle");
      await locator("section.section >> nth=0").click({ position: { x: 10, y: 10 } });
      await locator(".quick-settings__item >> nth=4").click();
      await locator(".quick-settings__item >> nth=4").click();
    });

    await test.step("Setting cho section 1", async () => {
      // Edit layout section 1
      await locator(".quick-settings__item >> nth=0").click();
      await locator(".quick-settings__item >> nth=1").click();
      await locator(".justify-space-between svg >> nth=3").click();
      await locator(".justify-space-between svg >> nth=0").click();
      await locator("section.section >> nth=0").click({ position: { x: 10, y: 10 } });
      // DnD Countdown block to column 2
      await dashboard.locator("[id$='Icons/Navigation/Plus-(line)']").click();
      await webBuilder.dragAndDrop({
        from: { selector: ".w-builder__insert-basic-preview p:has-text('Countdown')" },
        to: {
          iframe: "#preview",
          selector: ":nth-match(section.section, 1) .column .wb-dnd-container >> nth=1",
        },
      });
      await verifyGhost();

      // DnD Button block to column 3
      await dashboard.locator("[id$='Icons/Navigation/Plus-(line)']").click();
      await webBuilder.dragAndDrop({
        from: { selector: ".w-builder__insert-basic-preview p:has-text('Button')" },
        to: {
          iframe: "#preview",
          selector: ":nth-match(section.section, 1) .column .wb-dnd-container >> nth=2",
        },
      });
      // Edit label button block
      await dashboard.locator(".sb-tab-navigation__item div:has-text('Settings')").click();
      await dashboard.locator("[label='Button Title'] input").fill("Get started now");
      // Edit background
      await locator("section.section >> nth=0").click({ position: { x: 10, y: 10 } });
      await dashboard.locator("[data-widget-id='background'] .sb-pointer >> nth=1").click();
      await dashboard.locator("[style='background: rgb(60, 135, 221);'] >> nth=1").click();
      await dashboard.locator(".sb-sticky.w-builder__header").click();
    });

    await test.step("Setting section 2", async () => {
      // DnD image block to section 2
      await dashboard.locator("[id$='Icons/Navigation/Plus-(line)']").click();
      await webBuilder.dragAndDrop({
        from: { selector: ".w-builder__insert-basic-preview p:has-text('Image')" },
        to: {
          iframe: "#preview",
          selector: ":nth-match(section.section, 2) .column .wb-dnd-container >> nth=0",
        },
      });
      // Upload new image for section 2
      await dashboard.locator(".sb-tab-navigation__item div:has-text('Settings')").click();
      await dashboard.locator(".w-builder__settings-list img").first().hover();
      await dashboard.locator(".w-builder__settings-list [id$='Icons/Trash']").first().click();
      await dashboard.setInputFiles("input[type='file'] >> nth=0", "./data/shopbase/front/logo.png");
      await waitForImageLoaded(dashboard, ".w-builder__settings-list");
    });

    await test.step("Setting section 3", async () => {
      // Edit layout section 3
      await locator("section.section >> nth=2").click({ position: { x: 10, y: 10 } });
      await locator(".quick-settings__item >> nth=0").click();
      await locator(".quick-settings__item >> nth=1").click();
      await locator(".justify-space-between svg >> nth=2").click();
      await locator(".justify-space-between svg >> nth=0").click();
      await locator("section.section >> nth=2").click({ position: { x: 10, y: 10 } });

      // DnD paragraph block to column 1
      await dashboard.locator("[id$='Icons/Navigation/Plus-(line)']").click();
      await webBuilder.dragAndDrop({
        from: { selector: ".w-builder__insert-basic-preview p:has-text('Paragraph')" },
        to: {
          iframe: "#preview",
          selector: ":nth-match(section.section, 3) .column .wb-dnd-container >> nth=0",
        },
      });
      // Edit text paragraph
      await locator(":nth-match(section.section, 3) .wb-dnd-draggable-wrapper >> nth=0").dblclick();
      await dashboard.waitForTimeout(500);
      await locator(":nth-match(section.section, 3) .wb-dnd-draggable-wrapper >> nth=0").type(
        "End your emotional eating, binge eating, body shaming, restrictive dieting, " +
          "or any other lifelong food or weight struggle that has been holding you back…",
      );
      // DnD heading block to column 1
      await dashboard.locator("[id$='Icons/Navigation/Plus-(line)']").click();
      await webBuilder.dragAndDrop({
        from: { selector: ".w-builder__insert-basic-preview p:has-text('Heading')" },
        to: {
          iframe: "#preview",
          selector: ":nth-match(section.section, 3) .column .wb-dnd-container >> nth=0",
        },
      });
      // Edit text heading
      await locator(":nth-match(section.section, 3) h1 >> nth=0").dblclick();
      await locator(":nth-match(section.section, 3) h1 >> nth=0").type(
        "Practice At Home With the World’s Top Yoga Teachers",
      );
      await dashboard.waitForTimeout(500);
      // setting background
      await locator("section.section >> nth=2").click({ position: { x: 10, y: 10 } });
      await dashboard.locator("[data-widget-id='background'] .sb-pointer >> nth=1").click();
      await dashboard.locator("span.w-builder__chip--none >> nth=1").click();
      await dashboard.locator(".w-builder__image img").first().hover();
      await dashboard.locator(".w-builder__image [id$='Icons/Trash']").first().click();
      await dashboard.setInputFiles("input[type='file'] >> nth=0", "./data/shopbase/front/background.jpg");
      await waitForImageLoaded(dashboard, ".w-builder__settings-list");
    });
  });
});
