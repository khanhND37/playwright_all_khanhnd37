import { expect, test } from "@core/fixtures";
import { convertDate } from "@core/utils/datetime";
import { MemberPage } from "@pages/digital_product/dashboard/member";
import { MemberByAPI } from "@pages/digital_product/dashboard/member_api";

test.describe("Verify update onboarding flow for merchant to create SB Creator @TC", async () => {
  let memberPage: MemberPage;
  let memberByAPI: MemberByAPI;
  let accessToken: string;

  test.beforeEach(async ({ dashboard, conf, authRequest, token }) => {
    const tokenObject = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = tokenObject.access_token;
    memberByAPI = new MemberByAPI(conf.suiteConf.domain, authRequest);
    memberPage = new MemberPage(dashboard, conf.suiteConf.domain);
    await memberPage.goto(`admin/members?x_key=${accessToken}`);
    await dashboard.waitForLoadState("load");
  });

  test(`Verify data trong màn Member detail @TC_SB_DP_DB_MB_8`, async ({ dashboard, conf, context }) => {
    await test.step(`Click vào email 1 member trong Member list (member chưa có order nào)`, async () => {
      const xpathSearch = dashboard.locator(`//input[@placeholder="Search members"]`);
      await xpathSearch.fill(conf.caseConf.member_no_order);
      await xpathSearch.press("Enter");
      await dashboard.locator(`//p[normalize-space()="${conf.caseConf.info_member_1.name}"]`).click();

      const data = await memberByAPI.getMemberDetailInfo(conf.caseConf.id_member_1, accessToken);
      expect(data).toEqual(
        expect.objectContaining({
          country: conf.caseConf.info_member_1.country,
          countryCode: conf.caseConf.info_member_1.country_code,
          email: conf.caseConf.info_member_1.email,
          firstName: conf.caseConf.info_member_1.first_name,
          lastName: conf.caseConf.info_member_1.last_name,
          note: conf.caseConf.info_member_1.notes,
          phone: conf.caseConf.info_member_1.phone,
          tag: conf.caseConf.info_member_1.tag,
          totalOrder: conf.caseConf.info_member_1.total_order,
          totalSale: conf.caseConf.info_member_1.total_sale,
        }),
      );
      //get Name
      const name = await dashboard.locator(`((//div[@class="sb-flex"])[2]//p)[1]`).innerText();
      const nameExpect = `${data.firstName} ${data.lastName}`;
      expect(name).toEqual(nameExpect);

      //get Sales
      await dashboard.waitForSelector(`//p[normalize-space()="${conf.caseConf.info_member_1.sales}"]`);
      const totalSale = await dashboard.locator(`//p[normalize-space()="Sales"]//following-sibling::p`).innerText();
      expect(totalSale).toContain(`${"$"}${data.totalSale}`);

      //get Orders
      const xpathOrders = `//p[normalize-space()="Orders"]//following-sibling::p`;
      const totalOrder = Number(await dashboard.locator(xpathOrders).innerText());
      expect(totalOrder).toEqual(data.totalOrder);

      //get Email
      const email = await dashboard.locator(`//p[contains(@class,'contact__info__detail--email')]`).innerText();
      expect(email).toEqual(data.email);

      //get Phone
      const xpathPhone = `(//p[contains(@class,'contact__info__detail--txt')])[1]`;
      const phone = await dashboard.locator(xpathPhone).innerText();
      expect(phone).toEqual(data.phone);

      //get Country
      const xpathCountry = `(//p[contains(@class,'contact__info__detail--txt')])[2]`;
      const country = await dashboard.locator(xpathCountry).innerText();
      expect(country).toEqual(data.country);

      //get Tags
      const tag = await dashboard
        .locator(`(//div[child::label[contains(text(),'Tags')]]//following-sibling::div)[1]`)
        .innerText();
      expect(tag).toEqual(data.tag);

      //Get information products access of member
      const dataProductMemberAccess = await memberByAPI.getProductMemberAccess(conf.caseConf.id_member_1, accessToken);
      expect(dataProductMemberAccess.data.products).toEqual(conf.caseConf.product_access_member_1);

      await test.step(`Back về màn Member list -> Click vào email 1 member trong
         Member list member đã có order`, async () => {
        await dashboard.locator(`//button[contains(@class,' sb-button--subtle--small')]`).click();
        const xpathSearch = dashboard.locator(`//input[@placeholder="Search members"]`);
        await xpathSearch.fill(conf.caseConf.member_have_order);
        await xpathSearch.press("Enter");
        await dashboard.locator(`//p[normalize-space()="${conf.caseConf.member_have_order}"]`).click();

        const data = await memberByAPI.getMemberDetailInfo(conf.caseConf.id_member_2, accessToken);
        expect(data).toEqual(
          expect.objectContaining({
            country: conf.caseConf.info_member_2.country,
            countryCode: conf.caseConf.info_member_2.country_code,
            email: conf.caseConf.info_member_2.email,
            firstName: conf.caseConf.info_member_2.first_name,
            lastName: conf.caseConf.info_member_2.last_name,
            note: conf.caseConf.info_member_2.notes,
            phone: conf.caseConf.info_member_2.phone,
            tag: conf.caseConf.info_member_2.tag,
            totalOrder: conf.caseConf.info_member_2.total_order,
            totalSale: conf.caseConf.info_member_2.total_sale,
          }),
        );
        //get Name
        const name = await dashboard.locator(`((//div[@class="sb-flex"])[2]//p)[1]`).innerText();
        const nameExpect = `${data.firstName} ${data.lastName}`;
        expect(name).toEqual(nameExpect);

        //get Sales
        await dashboard.locator(`//p[normalize-space()="${conf.caseConf.info_member_2.sales}"]`).isVisible();
        const totalSale = await dashboard
          .locator(`//p[normalize-space()="${conf.caseConf.info_member_2.sales}"]`)
          .innerText();
        expect(totalSale).toContain(`${"$"}${data.totalSale}`);

        //get Orders
        const xpathOrders = `//p[normalize-space()="Orders"]//following-sibling::p`;
        const totalOrder = Number(await dashboard.locator(xpathOrders).innerText());
        expect(totalOrder).toEqual(data.totalOrder);

        //get Email
        const email = await dashboard.locator(`//p[contains(@class,'contact__info__detail--email')]`).innerText();
        expect(email).toEqual(data.email);

        //get Phone
        const xpathPhone = `(//p[contains(@class,'contact__info__detail--txt')])[1]`;
        const phone = await dashboard.locator(xpathPhone).innerText();
        expect(phone).toEqual(data.phone);

        //get Country
        const xpathCountry = `(//p[contains(@class,'contact__info__detail--txt')])[2]`;
        const country = await dashboard.locator(xpathCountry).innerText();
        expect(country).toEqual(data.country);

        //get Tags
        const tag = await dashboard
          .locator(`(//div[child::label[contains(text(),'Tags')]]//following-sibling::div)[1]`)
          .innerText();
        expect(tag).toEqual(data.tag);

        //Get information products access of member
        const dataProductMemberAccess = await memberByAPI.getProductMemberAccess(
          conf.caseConf.id_member_2,
          accessToken,
        );

        //tổng product mà member asscess
        const totalProduct = dataProductMemberAccess.data.products.length;
        expect(totalProduct).toEqual(conf.caseConf.info_product_2.sum_product);

        //hiển thị btn Enroll member
        const xpathBtnEnroll = `//p[contains(@class,'member__profile__product__enroll-btn')]`;
        await expect(dashboard.locator(xpathBtnEnroll)).toBeEnabled();

        for (let i = 0; i < totalProduct; i++) {
          //verify enrolled in
          if (dataProductMemberAccess.data.products[i].thumbnail == null) {
            expect(dataProductMemberAccess.data.products[i].thumbnail).toEqual(
              conf.caseConf.info_product_2.enroll_in[i].src,
            );
          } else {
            expect(dataProductMemberAccess.data.products[i].thumbnail.src).toEqual(
              conf.caseConf.info_product_2.enroll_in[i].src,
            );
          }

          //verify process
          const progress = await dashboard.locator(`((//tr[@class="sb-table__row"])[${i + 1}]//td)[3]`).innerText();
          if (dataProductMemberAccess.data.products[i].type == "online_course") {
            expect(progress).toEqual(`${dataProductMemberAccess.data.products[i].percent_completed}${"%"}`);
          } else {
            expect(progress).toEqual(conf.caseConf.info_product_2.none_progress);
          }

          //verify date
          const date = await dashboard.locator(`((//tr[@class="sb-table__row"])[${i + 1}]//td)[4]`).innerText();
          const timeStamp = dataProductMemberAccess.data.products[i].created_at;
          expect(date).toEqual(convertDate(timeStamp * 1000));

          //verify hien thi icon xoa
          const iconDelete = `((//tr[@class="sb-table__row"])[${i + 1}]//td)[5]`;
          await expect(dashboard.locator(iconDelete)).toBeVisible();
        }

        //Get information orders of member
        const dataOrders = await memberByAPI.getOrdersMemberDetail(conf.caseConf.id_member_2, accessToken);

        // Tổng số orders mà member đã mua
        const totalOrders = dataOrders.orders.length;
        expect(totalOrders).toEqual(conf.caseConf.info_order_2.total_orders);

        for (let i = 0; i < totalOrder; i++) {
          //Order name
          const orderName = await dashboard
            .locator(`(//p[contains(@class,'order__item__title')])[${i + 1}]`)
            .innerText();
          expect(`${`Order - `}${dataOrders.orders[i].name}`).toEqual(orderName);

          //Order date
          const orderDate = await dashboard
            .locator(`(//p[contains(@class,'order__item__time')])[${i + 1}]`)
            .innerText();
          const timeStamp = dataOrders.orders[i].created_at;
          expect(orderDate).toContain(convertDate(timeStamp));
        }

        //Click vào tên product trong section Enrollments -> Đi đến trang product detail ở new tab
        const linkSelector = `(//p[normalize-space()="${conf.caseConf.product_name}"])[1]`;
        const [productDetailPage] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(linkSelector),
        ]);
        const titleProduct = await productDetailPage.locator(`(//div[@class='sb-font sb-flex']//div)[1]`).innerText();
        expect(titleProduct).toEqual(`${conf.caseConf.product_name}`);

        //Click order name -> Đi đến trang Order details, open new tab
        const linkOrderName = `(//p[normalize-space()="${conf.caseConf.order_name}"])[1]`;
        const [orderDetailPage] = await Promise.all([
          context.waitForEvent("page"),
          await dashboard.click(linkOrderName),
        ]);
        const order = await orderDetailPage.locator(`((//div[@class='d-flex'])[1]//h2)[1]`).innerText();
        const nameOrder = await orderDetailPage.locator(`((//div[@class='d-flex'])[1]//h2)[2]`).innerText();
        expect(`${order} - ${nameOrder}`).toContain(`${conf.caseConf.order_name}`);
      });
    });
  });
});
