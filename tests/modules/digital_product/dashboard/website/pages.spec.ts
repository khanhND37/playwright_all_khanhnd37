import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { CreatorAdmWebsitePages } from "@pages/digital_product/dashboard/pages";

test.describe("Verify module Page in shop creator", async () => {
  let dashboardPage: DashboardPage;
  let accessToken: string;
  let pagesDigital: CreatorAdmWebsitePages;

  test.beforeEach(async ({ dashboard, conf, token }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    const shopToken = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken.access_token;

    await dashboardPage.goto(`admin/pages?x_key=${accessToken}`);
  });

  test(`Kiểm tra hiển thị các sub module Pages trong dashboard ở các shop thuộc feature switch
  update_flow_manage_and_create_pages @SB_DP_DB_Page_6`, async ({ dashboard, conf, token }) => {
    const pagesDigital = new CreatorAdmWebsitePages(dashboard, conf.suiteConf.domain);
    const result = await pagesDigital.getListLandingPageByApi(conf.caseConf.limit, conf.caseConf.page, accessToken);
    await test.step(`Đăng nhập vào dashboard shop creator thuộc user thuộc fsw "update_flow_manage_and_create_pages"
     >> "Website" >> "Page" -> kiểm tra màn hình List Page`, async () => {
      await dashboard.waitForSelector("(//tr[@class='sb-table__row'])[1]");
      const listPage = await pagesDigital.getListPageScreen(conf.caseConf.limit, conf.suiteConf.time_out);
      await expect(dashboard.locator("//span[normalize-space()='Add new page']")).toBeVisible();
      expect(listPage).toEqual(
        expect.objectContaining({
          title: conf.caseConf.title,
          text: conf.caseConf.text,
          totalLandingPage: result.total,
        }),
      );
    });

    await test.step(`Kiểm tra thông tin của một page`, async () => {
      await dashboard.reload();
      const pageData = await pagesDigital.getInfoPage();
      expect(pageData).toEqual(
        expect.objectContaining({
          title: result.pages[0].title,
          handle: result.pages[0].handle,
          btnCustomize: conf.caseConf.value,
          iconEdit: conf.caseConf.value,
          iconDelete: conf.caseConf.value,
        }),
      );
    });

    await test.step(`Quay về màn Select shop -> mở shop không phải shop creator
    -> đi đến module: "Online Store" >> "Pages -> kiểm tra màn hình List Page`, async () => {
      for (let i = 0; i < conf.caseConf.data.length; i++) {
        const key = conf.caseConf.data[i];
        const shopToken = await token.getWithCredentials({
          domain: key.domain,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
        accessToken = shopToken.access_token;
        await dashboard.goto(`https://${key.domain}/admin/pages?x_key=${accessToken}`);
        await expect(dashboard.locator("//div[@class='s-tabs']")).toBeVisible();
        await expect(dashboard.locator("button:has-text('Add page')")).toBeVisible();
      }
    });
  });
  test(`Kiểm tra chức năng tạo page mới @SB_DP_DB_Page_7`, async ({ dashboard, conf }) => {
    pagesDigital = new CreatorAdmWebsitePages(dashboard, conf.suiteConf.domain);
    const resultExp = await pagesDigital.getListLandingPageByApi(conf.caseConf.limit, conf.caseConf.page, accessToken);
    await test.step(`Tại màn hình Pages, click button Add new page -> kiểm tra hiển thị popup`, async () => {
      await dashboard.locator("//span[normalize-space()='Add new page']").click();
      const popupAddnew = await pagesDigital.verifyPopupAddnewPage();
      expect(popupAddnew).toEqual(
        expect.objectContaining({
          title: conf.caseConf.popup.title,
          fieldName: conf.caseConf.popup.field_name,
          buttonCreate: conf.caseConf.popup.button_create,
        }),
      );
    });

    await test.step(`Không nhập data vào textbox Page Title -> click button Create page`, async () => {
      await dashboard.locator("//button//span[normalize-space()='Create page']").click();
      expect(await dashboard.innerText("//div[@class='sb-form-item__message sb-text-caption sb-mt-small']")).toEqual(
        conf.caseConf.message_false,
      );
    });

    await test.step(`Nhập data bất kì vào textbox Page Title -> click button Create page`, async () => {
      const addNew = await pagesDigital.addNewPage(conf.caseConf.page_title);
      expect(addNew).toEqual(
        expect.objectContaining({
          message: conf.caseConf.message_success,
          title: conf.caseConf.page_title,
          pageTitleSeo: conf.caseConf.page_title,
        }),
      );
      await dashboard.locator("//span[normalize-space()='Pages']").click();
      const resultActual = await pagesDigital.getListLandingPageByApi(
        conf.caseConf.limit,
        conf.caseConf.page,
        accessToken,
      );
      expect(resultActual.total).toEqual(resultExp.total + 1);
    });
  });
  test(`Kiểm tra chức năng xóa page @SB_DP_DB_Page_10`, async ({ dashboard, conf }) => {
    const handlePage = await dashboard.innerText("((//tr)[last()]//span)[1]");
    const namePage = await dashboard.innerText("((//tr)[last()]//a)[1]");
    await test.step(`Tại màn hình Page, click icon thùng rác của một page đã tao trước đó`, async () => {
      await dashboard.locator("(//i[@class='mdi mdi-delete mdi-24px sb-flex justify-center'])[last()]").click();
      expect(await dashboard.innerText("//div[@class='sb-popup__body sb-scrollbar sb-text']/div")).toEqual(
        conf.caseConf.text,
      );
    });

    await test.step(`Click button Cancel`, async () => {
      await dashboard.locator("//span[normalize-space()='Cancel']").click();
      await expect(dashboard.locator("//div[@class='s-modal-body']//span")).toBeHidden();
      expect(await dashboard.innerText("((//tr)[last()]//span)[1]")).toEqual(handlePage);
    });

    await test.step(`Click lại vào icon thùng rác của một page -> click button Delete ở popup`, async () => {
      await dashboard.locator("(//i[@class='mdi mdi-delete mdi-24px sb-flex justify-center'])[last()]").click();
      await dashboard.locator("//span[normalize-space()='Delete']").click();
      await dashboard.waitForSelector("((//tr)[last()]//span)[1]");
      expect(await dashboard.innerText("//div[@class='s-toast is-dark is-bottom']/div")).toEqual(
        `Deleted ${namePage} page`,
      );
      expect(await dashboard.innerText("((//tr)[last()]//span)[1]")).not.toEqual(handlePage);
    });
  });
});
