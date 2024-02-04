import { expect, test } from "@core/fixtures";
import { DigitalProductPage } from "@pages/dashboard/digital_product";
import { SignInDigital } from "@pages/digital_product/storefront/sign_in";

test.describe("Verify buyer sign in My product screen @TC_SB_DP_SF_PROD_11", async () => {
  let digitalProductPage;
  let customerToken: string;
  let dataProductDashboard;
  let dataProductStoreFront;

  test(`Kiểm tra thông tin trên một Coaching session product ở trang My product @TC_SB_DP_SF_PROD_11`, async ({
    dashboard,
    conf,
    page,
    authRequest,
  }) => {
    //Lấy thông tin của 1 digital download product trên dashboard
    await test.step(`Truy cập dashboard, lấy thông tin của product Coaching session product`, async () => {
      const domain = conf.suiteConf.domain;
      digitalProductPage = new DigitalProductPage(dashboard, domain);

      await dashboard.locator(`//span[normalize-space()='Products']`).click();
      await expect(dashboard.locator(`//p[normalize-space()='${conf.caseConf.product_name}']`)).toBeVisible();
      await digitalProductPage.clickTitleProduct(conf.caseConf.product_name);
      dataProductDashboard = await digitalProductPage.getDataProductDashboard(
        conf.suiteConf.domain,
        conf.caseConf.product_id,
        authRequest,
      );
    });

    //Lấy thông tin của digital product trên store front
    await test.step(`Đăng nhập storefront bằng account member
      > mở trang My products
      > Chọn products Coaching session`, async () => {
      const signInDigital = new SignInDigital(page, conf.suiteConf.domain);
      await signInDigital.login(conf.caseConf.member_email, conf.caseConf.member_password);
      customerToken = await digitalProductPage.page.evaluate(() => window.localStorage.getItem("customerToken"));
      dataProductStoreFront = await digitalProductPage.getDataProductStoreFront(
        conf.suiteConf.domain,
        conf.caseConf.product_name,
        customerToken,
      );

      //So sánh data của product đúng như setting trong dashboard
      await test.step(`So sánh data của product ở storefront đúng như setting trong dashboard`, async () => {
        const medias = dataProductDashboard.data.products[0].sections[0].lectures[0].medias;
        let file = "";
        if (medias.length > 0) {
          file = medias[0]?.path;
        }
        expect(dataProductDashboard.data.products[0].product.title).toEqual(dataProductStoreFront.result.title);
        expect(dataProductDashboard.data.products[0].product.body_html).toEqual(
          dataProductStoreFront.result.description,
        );
        expect(dataProductDashboard.data.products[0].product.image.src).toEqual(dataProductStoreFront.result.image);
        expect(file).toEqual(dataProductStoreFront.result.calendar.path);
      });
    });
  });
});
