import { expect, test } from "@core/fixtures";
import { DigitalProductPage } from "@pages/dashboard/digital_product";
import { SignInDigital } from "@pages/digital_product/storefront/sign_in";

test.describe(`Kiểm tra chức năng sort product trên trang My product @TC_SB_DP_SF_PROD_9`, async () => {
  let digitalProductPage;
  let customerToken: string;
  let sortProductStoreFront;
  let title: string;
  let selectedProduct: string;

  test.beforeEach(async ({ dashboard, page, conf }) => {
    //Tạo mới 1 product
    const currentTime = Math.floor(Date.now() / 1000);
    title = conf.caseConf.title + currentTime;
    digitalProductPage = new DigitalProductPage(dashboard, conf.suiteConf.domain);

    await test.step(`Thực hiện tạo mới 1 product`, async () => {
      await digitalProductPage.navigateToMenu("Products");
      await dashboard.locator(`//span[normalize-space()='Add product']`).click();
      await expect(dashboard.locator(`(//label[normalize-space()='Title']//parent::div)//input`)).toBeVisible();
      await dashboard.locator(`(//label[normalize-space()='Title']//parent::div)//input`).fill(title);
      await dashboard.locator(`(//*[text()='Digital download']//following::span)[1]`).click();
      await dashboard
        .locator(`//button[contains(@class,'sb-button-primary')]//*[normalize-space()='Add product']`)
        .click();
      await dashboard.waitForNavigation({ waitUntil: "networkidle" });
      await dashboard.locator(`//button[contains(@class,'sb-button-primary')]//*[normalize-space()='Publish']`).click();
    });

    //Checkout 1 product
    const signInDigital = new SignInDigital(page, conf.suiteConf.domain);
    digitalProductPage = new DigitalProductPage(page, conf.suiteConf.domain);
    await signInDigital.login(conf.caseConf.member_email, conf.caseConf.member_password);
    customerToken = await digitalProductPage.page.evaluate(() => window.localStorage.getItem("customerToken"));
    await digitalProductPage.checkout(title);

    //Truy cập vào 1 product
    selectedProduct = await page.innerText(`(//h5[@class='digital-product--name mb8'])[2]`);
    await page.locator(`(//h5[@class='digital-product--name mb8'])[2]`).click();
    await page.locator(`//span[text()='Back to My Products']`).click();
    await page.reload({ waitUntil: "networkidle" });
  });

  test(`Kiểm tra chức năng sort product trên trang My product @SB_DP_SF_PROD_9`, async ({ conf }) => {
    for (let i = 0; i < conf.caseConf.sort_by.length; i++) {
      sortProductStoreFront = await digitalProductPage.sortProductStoreFront(
        conf.suiteConf.domain,
        customerToken,
        conf.caseConf.sort_by[i].sort_by,
        conf.caseConf.sort_by[i].sort_mode,
      );
      const expectResult = sortProductStoreFront.result.list[0].title;

      if (conf.caseConf.sort_by[i].checkout) {
        expect(title).toEqual(expectResult);
      } else if (conf.caseConf.sort_by[i].accessed) {
        expect(selectedProduct).toEqual(expectResult);
      } else if (conf.caseConf.sort_by[i].a_z) {
        expect(conf.caseConf.first_product).toEqual(expectResult);
      } else {
        expect(conf.caseConf.last_product).toEqual(expectResult);
      }
    }
  });
});
