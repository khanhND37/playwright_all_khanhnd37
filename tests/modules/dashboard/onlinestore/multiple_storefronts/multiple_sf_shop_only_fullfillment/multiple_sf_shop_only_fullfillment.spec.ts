import { test } from "@fixtures/website_builder";
import { expect } from "@playwright/test";

test.describe("Verify create multiple storefronts with shop only fullfillment", () => {
  test(`@SB_NEWECOM_MSF_MSFL_46 Check add new SF TH là Fulfillment Service Only`, async ({ dashboard, conf }) => {
    await test.step(`Open DB shop 1 > Online store > Storefronts`, async () => {
      await dashboard.goto(`https:${conf.suiteConf.domain}/admin/storefronts`);
      await expect(dashboard.getByRole("button", { name: "Create new storefront" })).toHaveAttribute(
        "class",
        new RegExp("is-disabled"),
      );
    });
  });
});
