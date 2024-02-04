import { expect, test } from "@core/fixtures";
import { ReviewPage } from "@pages/dashboard/product_reviews";

/**
 * Code name: `@SB_APP_RV_RC_1`
 * Description: Test case này để verify được gắn đúng link của product vào từng review trên review page Sb storefront
 * Test case `@SB_APP_RV_RC_1`:
      - Steps:
        - Login SB dashboard -> Vào app Product reviews -> Click chọn đến mục Customization
        - Verify hiển thị đoạn text tại mục All review page text
        - Off toggle switch Show product link on each review
        - Verify taị storefront màn All review page không hiển thị product link tại mỗi review
        - Vào lại SB dashboard, bật toogle switch Show product link on each review
        - Verify hiển thị product link, click vào product link dẫn đến đúng product
         của review của shop test khi on toggle switch Show product link
       */

test.describe("Check product review @TC_SB_APP_RV_RC", async () => {
  test("Verify setting Show Product link on each review @TC_SB_APP_RV_RC_1", async ({ conf, dashboard }) => {
    const reviewPage = new ReviewPage(dashboard, conf.suiteConf.domain);
    await test.step(
      "Tại dashboard, click chọn menu App, chọn app Product Reviews" +
        " -> click chọn đến mục Customization để đi đến trang Customization",
      async () => {
        await dashboard.goto(`https://${conf.caseConf.domain}/admin/apps/review/customize`);
      },
    );

    // eslint-disable-next-line max-len
    //Tại SB dashboard verify hiển thị tại mục All review page text "Customize setting for All reviews page. Learn how to create All reviews page."
    await test.step(`Verify hiển thị tại mục All review page text "
    + "Customize setting for All reviews page. Learn how to create All reviews page."`, async () => {
      const textAllReview = await reviewPage.getTextAllReview();
      expect(textAllReview).toContain(conf.caseConf.text);
    });

    //Tại ShopBase dashboard verify off thành công toggle switch Show product link on each review
    await test.step("Verify off thành công toggle switch Show product link on each review", async () => {
      await dashboard
        .locator(
          `//div[normalize-space()='Show product link on each review'
        and contains(@class,'col')]//following-sibling::div//span[@class='s-check']`,
        )
        .click();
      await dashboard.waitForLoadState("load");
      await dashboard.locator('//button[normalize-space()="Save changes"]').click();
    });

    // eslint-disable-next-line max-len
    //Verify không hiển thị product link khi truy cập vào storefront của shop test khi đã off toggle switch Show product link
    await test.step(
      "Verify không hiển thị product link khi truy cập vào storefront của shop test" +
        "khi đã off toggle switch Show product link",
      async () => {
        await dashboard.goto(`https://${conf.caseConf.domain}/pages/${conf.caseConf.all_review_page}`);
        await expect(dashboard.locator(`(//div[@class="rv-widget__product-title"])[1]`)).not.toBeVisible();
      },
    );

    //Truy cập SB dashbpoard verify on thành công "toggle switch Show product link on each review tại Sb dashboard"
    await test.step(
      "Tại dashboard, click chọn menu App, chọn app Product Reviews" +
        " -> click chọn đến mục Customization để đi đến trang Customization",
      async () => {
        await dashboard.goto(`https://${conf.caseConf.domain}/admin/apps/review/customize`);
      },
    );
    await test.step("Verify on thành công toggle switch Show product link on each review", async () => {
      await dashboard
        .locator(
          `//div[normalize-space()='Show product link on each review'
          and contains(@class,'col')]//following-sibling::div//span[@class='s-check']`,
        )
        .click();
      await dashboard.waitForLoadState("load");
      await dashboard.locator('//button[normalize-space()="Save changes"]').click();
    });

    // eslint-disable-next-line max-len
    //Verify hiển thị product link, click vào product link dẫn đến đúng product của review của shop test khi on toggle switch Show product link
    await test.step(
      "Verify hiển thị product link, click vào product link dẫn đến đúng product" +
        " của review của shop test khi on toggle switch Show product link",
      async () => {
        await dashboard.goto(`https://${conf.caseConf.domain}/pages/${conf.caseConf.all_review_page}`);
        await expect(dashboard.locator(`(//div[@class="rv-widget__product-title"])[1]`)).toBeVisible();
        await dashboard.locator(`(//div[@class="rv-widget__product-title"])[1]//descendant::a`).click();
        await dashboard.waitForSelector(`//h1[@class="h3 product__name is-uppercase mt0 mb12"]`);
        const product = await reviewPage.getNameProduct();
        const result = await reviewPage.loadDataProductReview();
        expect(product).toEqual(result.reviews[0].product_title);
      },
    );
  });
});
