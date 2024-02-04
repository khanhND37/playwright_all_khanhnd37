import { expect, test } from "@core/fixtures";
import { HighRiskPage } from "@pages/odoo/highrisk_message";

test.describe(`Verify update button High-risk messages trong Odoo`, async () => {
  test(`Verify update button High-risk messages trong Odoo @TC_SB_CHE_SC_HR_PL_1`, async ({ page, conf }) => {
    const highRiskPage = new HighRiskPage(page, conf.suiteConf.domain);
    await test.step(`Đăng nhập vào Odoo -> Chọn đến mục Sales -> Configuration -> High-risk messages "
    +"để đi đến màn High-risk message`, async () => {
      await highRiskPage.loginToOdoo({
        account: conf.suiteConf.account,
        password: conf.suiteConf.password,
      });
      await highRiskPage.goToHighRiskMessagesPage(page);
    });

    await test.step(`Click button Create -> nhập Internal Reference, Messagess -> "
    +"Save để verify tạo thành công High-risk message`, async () => {
      await highRiskPage.enterInfoHighRiskMessage(page, conf);
      await page.locator(`//button[normalize-space()="Save"]`).click();
      const internalRef = await highRiskPage.getInternalRef();
      await highRiskPage.backToHighRiskPage(page);
      const internalRefHRPage = await highRiskPage.getInternalRefHRPage();
      expect(internalRef).toEqual(internalRefHRPage);

      await test.step(`Click Create -> Nhập Internal Reference, Messagess hợp lệ -> Discard.
    +"-> Verify quay trở về màn High-risk messages pages`, async () => {
        await highRiskPage.enterInfoHighRiskMessage(page, conf);
        await page.locator(`//button[normalize-space()="Discard"]`).click();
        await page.locator(`//span[normalize-space()="Ok"]`).click();
        await expect(page).toHaveURL(`${conf.caseConf.url_highrisk_page}`);
      });

      await test.step(`Click button Create. Nhập Internal Reference, nhập Messagess chứa param {{ .store.name }},
    +" {{ .store.customer_email }} -> Save. Verify tạo thành công High-risk message`, async () => {
        await highRiskPage.enterInfoHighRiskMessageParam(page, conf);
        const internalRef = await highRiskPage.getInternalRef();
        await highRiskPage.backToHighRiskPage(page);
        const internalRefHRPage = await highRiskPage.getInternalRefHRPage();
        expect(internalRef).toEqual(internalRefHRPage);
      });

      await test.step(`Click chọn High-risk message thứ nhất để đến màn detail -> Click button Edit
      +"-> Nhập Internal Ref, Msg hợp lệ -> Confirm Save. Verify High-risk message thay đổi như đã sửa`, async () => {
        await page.locator(`(//td[@class="o_data_cell o_field_cell o_list_char o_required_modifier"])[1]`).click();
        await highRiskPage.editInfoHighRiskMessage(page, conf);
        await page.locator(`//button[normalize-space()="Save"]`).click();
        const internalRef = await highRiskPage.getInternalRef();
        const message = await highRiskPage.getMessage();
        await highRiskPage.backToHighRiskPage(page);
        const internalRefHRPage = await highRiskPage.getInternalRefHRPage();
        const messagesHRPage = await highRiskPage.getMessageHRPage();
        expect(internalRef).toEqual(internalRefHRPage);
        expect(message).toEqual(messagesHRPage);
      });

      await test.step(`Click chọn High-risk message thứ nhất để đến màn detail -> Click chọn button Edit
    +"-> Nhập Internal Ref, Messagess hợp lệ -> Confirm Discard. Verify High-risk message không thay đổi`, async () => {
        await page.locator(`(//td[@class="o_data_cell o_field_cell o_list_char o_required_modifier"])[1]`).click();
        const internalRefT1 = await highRiskPage.getInternalRef();
        const messageT1 = await highRiskPage.getMessage();
        await highRiskPage.editInfoHighRiskMessage(page, conf);
        await page.locator(`//button[normalize-space()="Discard"]`).click();
        await page.locator(`//span[normalize-space()="Ok"]`).click();
        expect(internalRefT1).toEqual(await highRiskPage.getInternalRef());
        expect(messageT1).toEqual(await highRiskPage.getMessage());
      });

      await test.step(`Quay trở lại trang High-risk message page -> Lấy giá trị Internal Ref thứ nhất
      +"-> Click chọn Action -> Chọn Delete -> Confirm Cancel -> Verify chưa xóa được High-risk msg đó`, async () => {
        await highRiskPage.backToHighRiskPage(page);
        const internalRefHRPage = await highRiskPage.getInternalRefHRPage();
        const MessageHRPage = await highRiskPage.getMessageHRPage();
        await highRiskPage.deleteHighRiskMessage(page);
        await page.locator(`//button[normalize-space()="Cancel"]`).click();
        const internalRef = await highRiskPage.getInternalRef();
        const message = await highRiskPage.getMessage();
        await expect(internalRef).toEqual(internalRefHRPage);
        await expect(message).toEqual(MessageHRPage);
      });

      await test.step(`Quay trở lại trang High-risk message page -> Lấy giá trị Internal Ref thứ nhất
      +"-> Click chọn Action -> Chọn Delete -> Confirm OK. Quay trở lại trang High-risk message page
      +"-> Verify đã xóa được High-risk thứ nhất `, async () => {
        await highRiskPage.backToHighRiskPage(page);
        const internalRefPage = await highRiskPage.getInternalRefHRPage();
        await highRiskPage.deleteHighRiskMessage(page);
        await page.locator(`//button[normalize-space()="Ok"]`).click();
        await highRiskPage.backToHighRiskPage(page);
        const internalRefPageNew = await highRiskPage.getInternalRefHRPage();
        await expect(internalRefPageNew).not.toEqual(internalRefPage);
      });

      await test.step(`Click vào thanh Search, nhập vào 1 reference tồn tại -> Enter.
      "+ Verify hiển thị High-risk messages đã tìm kiếm`, async () => {
        await highRiskPage.backToHighRiskPage(page);
        const internalRefSearch = await highRiskPage.getInternalRefHRPage();
        await page.locator(`//input[@placeholder="Search..."]`).click();
        await page.locator(`//input[@placeholder="Search..."]`).fill(internalRefSearch);
        await page.locator(`//input[@placeholder="Search..."]`).press("Enter");
        const internalRefSearchResult = await highRiskPage.getInternalRefSearchResult();
        await expect(internalRefSearch).toEqual(internalRefSearchResult);
      });
    });
  });
});
