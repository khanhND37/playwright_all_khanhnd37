import { test } from "@core/fixtures";

test.describe("Verify domain", () => {
  test("Check match snapshots @SB_SP_SP_001", async ({ page, snapshotFixture }) => {
    await page.goto("https://playwright.dev/");

    await snapshotFixture.verify({
      page: page,
      snapshotName: "preview.png",
    });
  });
});
