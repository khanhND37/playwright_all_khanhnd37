import { test } from "@core/fixtures";
import { BrowserContext } from "@playwright/test";

/**
 * Code name: `TC_SB_MULTI_TAB_01`
 * Description: Test suite này demo case login vào shopbase dashboard và chọn store có position 1
 * Test cases:
      - Test case `TC_SB_MULTITAB`:
      - Before/Setup
        - read config
        - open a new browser
      - Steps
        - Create 2 tabs (2 pages)
        - tab 1 go to https://google.com
        - tab 2 go to https://bing.com
        - Wait for the 2 pages/tabs to load using waitForLoadState("load")
      - After/Teardown
        - close browser

* External links: https://docs.ocg.to/books/qa-training/page/3-ocg-autopilot-examples/11043#bkmrk-share-states
*/

test.describe("Share state between tests @DB_ANAL @TS_SB_MULTI_TAB_01", async () => {
  test("multi tab @TC_SB_MULTITAB", async ({ browser }) => {
    let ctx: BrowserContext;
    await test.step("initialize browser", async () => {
      ctx = await browser.newContext();
    });
    await test.step("open 2 tabs", async () => {
      const p1 = await ctx.newPage();
      const p2 = await ctx.newPage();
      await p1.goto("https://google.com");
      await p1.waitForLoadState("load");

      await p2.goto("https://bing.com");
      await p2.waitForLoadState("load");

      await p1.locator('[aria-label="Tìm kiếm"]').fill("test");
      // Press Enter
      await Promise.all([p1.waitForNavigation(), p1.locator('[aria-label="Tìm kiếm"]').press("Enter")]);

      await p2.locator('[aria-label="Enter your search term"]').fill("test");
      await Promise.all([
        p2.waitForNavigation(),
        await p2.locator('[aria-label="Enter your search term"]').press("Enter"),
      ]);
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  test("multi tab with fixture @TC_SB_SMULTITAB_FIXTURE", async ({ dashboard, account }) => {
    // eslint-disable-next-line no-console
    console.log("We are running multiple tabs right here with fixture supports");
  });
});
