// // example.spec.ts
// import { test } from "@playwright/test";
// import { snapshotDir, verify } from "@utils/theme";

// test.beforeEach(async ({}, testInfo) => {
//   testInfo.snapshotSuffix = "";
//   testInfo.snapshotDir = snapshotDir(__filename);
// });

// test("example test", async ({ page }) => {
//   await page.goto(
//     "https://au-conditional-logic-preview-sb.onshopbase.com/products/" +
//       "product-add-conditional-logic-voi-is-not-equal-and-is-equal",
//   );
//   await page.waitForSelector("//div[contains(@class,'product-custom-option')]", { timeout: 5000 });
//   await verify({
//     page: page,
//     selector: "//section[@class='container-page']//div[@class='row']",
//     snapshotName: "example.png",
//     snapshotOptions: {
//       maxDiffPixelRatio: 0.05,
//       threshold: 0.1,
//       maxDiffPixels: 2000,
//     },
//   });
// });
