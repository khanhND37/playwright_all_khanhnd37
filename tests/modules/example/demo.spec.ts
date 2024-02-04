import { test } from "@core/fixtures";
import { expect } from "@playwright/test";
import { SBPage } from "@pages/page";

test.describe("@TS_SB_DEMO test suite for run demo purpose", async () => {
  test(`@SB_DEMO_PASS_1 demo test case pass`, async () => {
    expect(1).toEqual(1);
  });

  test(`@SB_DEMO_PASS_11 demo test case pass`, async () => {
    expect(1).toEqual(1);
  });

  test(` demo test case pass @SB_DEMO_PASS_2`, async () => {
    expect(1).toEqual(1);
  });

  test(`@SB_DEMO_PASS_21 demo test case pass`, async () => {
    expect(1).toEqual(1);
  });

  test(`@SB_DEMO_FAIL_01 demo test case fail`, async () => {
    expect(1).toEqual(2);
  });

  test(`@SB_DEMO_FAIL_02 demo test case fail`, async () => {
    expect(1).toEqual(2);
  });
  test(`@SB_DEMO_FAIL_03 demo go to url with en`, async ({ page }) => {
    const homepage = new SBPage(page, "au-auto-translate.myshopbase.net");
    await homepage.gotoENLang("");
    await homepage.gotoENLang("", "vi-vn");
  });
});
