import { expect, test } from "@core/fixtures";
import { DigitalProductPage } from "@pages/dashboard/digital_product";
import { SignInDigital } from "@pages/digital_product/storefront/sign_in";

test.describe("Verify buyer sign in My product screen @TC_SB_DP_SF_PROD_11", async () => {
  let digitalProductPage;
  let customerToken: string;
  test(`Kiểm tra thông tin trên một Digital download card ở trang My product @TC_SB_DP_SF_PROD_11`, async ({
    dashboard,
    conf,
    token,
    page,
  }) => {
    let dataProductDashboard;

    //Lấy thông tin của 1 digital download product trên dashboard
    await test.step(`Truy cập dashboard, lấy thông tin của product Digital download`, async () => {
      const domain = conf.suiteConf.domain;
      const shopToken = await token.getWithCredentials({
        domain: conf.suiteConf.shop_name,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });

      digitalProductPage = new DigitalProductPage(dashboard, domain);

      await dashboard.locator(`//span[normalize-space()='Products']`).click();
      await expect(dashboard.locator(`//p[normalize-space()='${conf.caseConf.product_name}']`)).toBeVisible();
      await digitalProductPage.clickTitleProduct(conf.caseConf.product_name);
      dataProductDashboard = await digitalProductPage.getDataProductDetailDashboard(
        conf.suiteConf.domain,
        conf.caseConf.product_id,
        shopToken.access_token,
      );
    });

    //Lấy thông tin của digital product trên store front
    await test.step(`Đăng nhập storefront bằng account member
      > mở trang My products
      > Chọn products Digital download`, async () => {
      const signInDigital = new SignInDigital(page, conf.suiteConf.domain);
      await signInDigital.login(conf.caseConf.member_email, conf.caseConf.member_password);
      customerToken = await digitalProductPage.page.evaluate(() => window.localStorage.getItem("customerToken"));
      const dataProductStoreFront = await digitalProductPage.getDataProductDetailStorefront(
        conf.suiteConf.domain,
        conf.caseConf.product_name,
        customerToken,
      );

      //So sánh data của product đúng như setting trong dashboard
      expect(dataProductDashboard).toEqual(
        expect.objectContaining({
          title: dataProductStoreFront.title,
          description: dataProductStoreFront.description,
          img: dataProductStoreFront.img,
          file: dataProductStoreFront.file,
        }),
      );
    });
  });
});
