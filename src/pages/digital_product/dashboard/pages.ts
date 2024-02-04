import { SBPage } from "@pages/page";
import { expect } from "@playwright/test";
import type { InfoPage, ListPageScreen, PopupCreatePage } from "@types";

/**
 * @deprecated: use src/shopbase_creator/dashboard/ instead
 */
export class CreatorAdmWebsitePages extends SBPage {
  /**
   * Get thông tin hiển thị ở màn list bao gồm title, text, tổng số page
   * @returns: hàm này return lại obj chứa title, text description và tổng số page ở màn list
   */
  async getListPageScreen(pageLimit: number, timeOut: number): Promise<ListPageScreen> {
    return {
      title: await this.getTextContent("//div[@class='sb-font sb-flex']/div"),
      text: await this.page.innerText("//p[@class='s-mt16 s-mb16']"),
      totalLandingPage: await this.countTotalLandingPage(pageLimit, timeOut),
    };
  }

  /**
   * Đếm tổng số page/landing page:
   * TH1: nếu hiển thị phân trang:
   * B1: đếm tổng số trang là n, mỗi trang tối đa 30 page -> có (n-1) trang là 30 page
   * -> tổng page của (n-1) trang là: totalPage = (n-1)*30;
   * B2: đếm số page của trang cuối cùng là totalLastPage;
   * B3: tính tổng page: sum = totalPage + totalLastPage;
   * TH2: nếu không có phân trang thì đếm số page của trang hiện tại;
   * @param pageLimit là số page tối đa của 1 trang
   * @param timeOut khi click vào trang cuối cùng thì cần đợi một khoảng thời gian để hiển thị list page ở trang cuối
   * @returns
   */
  async countTotalLandingPage(pageLimit: number, timeOut: number) {
    if (await this.genLoc("//ul[@class='sb-pagination__list sb-flex']").isVisible()) {
      const pageNumber = await this.page.innerText("(//ul[@class='sb-pagination__list sb-flex']//li)[last()-1]");
      const totalPage = Number(pageNumber) * pageLimit;
      await this.genLoc(
        "(//li[contains(@class,'sb-pagination__list-item sb-flex sb-flex-align-center')])[last()]",
      ).click();
      await this.page.waitForTimeout(timeOut);
      const totalLastPage = await this.genLoc("//tr[@class='sb-table__row']").count();
      return totalPage + totalLastPage;
    } else {
      return await this.genLoc("//tr[@class='sb-table__row']").count();
    }
  }

  /**
   * Get thông tin các page/landing page ở màn list bằng api
   * @param limit là giới hạn page/landing page hiển thị trên 1 trang
   * @param page là trang số
   * @param acceccToken
   * @returns
   */
  async getListLandingPageByApi(limit: string, page: string, accessToken: string) {
    const param = `limit=${limit}&page=${page}&visibility=&total=true&order_by=title&order_direction=asc`;
    const response = await this.page.request.get(
      `https://${this.domain}/admin/pages.json?${param}&access_token=${accessToken}`,
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Get thông tin của một page/landing page ở màn list
   * @returns hàm này return lại obj InfoPage chứa các thông tin: pageTitle, handle page, các button
   */
  async getInfoPage(): Promise<InfoPage> {
    return {
      title: await this.page.innerText("(//div[@class='s-flex-item'])[1]//a"),
      handle: (await this.getTextContent("(//td)[1]//span")).replace("/pages/", ""),
      btnCustomize: await this.genLoc(
        "(//tr[@class='sb-table__row'])[1]//span[normalize-space()='Customize']",
      ).isVisible(),
      iconEdit: await this.genLoc(
        "(//tr[@class='sb-table__row'])[1]//*[contains(@class,'mdi mdi-settings')]",
      ).isVisible(),
      iconDelete: await this.genLoc(
        "(//tr[@class='sb-table__row'])[1]//*[contains(@class,'mdi mdi-delete')]",
      ).isVisible(),
    };
  }

  /**
   * Get thông tin hiển thị ở popup add new page
   * @returns hàm này return lại obj PopupCreatePage chứa các thông tin: title popup, field, button trong 1 popup
   */
  async verifyPopupAddnewPage(): Promise<PopupCreatePage> {
    return {
      title: await this.getTextContent("//div[@class='sb-text sb-text-medium']/div"),
      fieldName: await this.getTextContent("//label[@for='title']"),
      buttonCreate: await this.genLoc("//button/span[normalize-space()='Create page']").isVisible(),
    };
  }

  /**
   * Tạo thành công page -> kiểm tra các trường thông tin được tự động fill và giá trị default ở màn edit page
   * @param pageTitle
   * @returns hàm này return lại obj InfoPage chứa các thông tin: message tạo thành công page, page title, seo title
   */
  async addNewPage(pageTitle: string): Promise<InfoPage> {
    await this.genLoc("//input[@placeholder='Page Title']").fill(pageTitle);
    await this.genLoc("//button/span[normalize-space()='Create page']").click();
    return {
      message: await this.getTextContent(
        "//div[@class='s-notices is-bottom']/div[normalize-space()='Your page was created']",
      ),
      title: await this.genLoc("(//input[@placeholder='Page Title'])[1]").inputValue(),
      pageTitleSeo: await this.genLoc("(//input[@placeholder='Page Title'])[2]").inputValue(),
    };
  }

  /**
   * Đây là hàm tạo mới 1 page
   * @param pageTitle
   * @returns
   */
  async addPageAndGoToEditPage(pageTitle: string) {
    const currentTime = Math.floor(Date.now() / 1000);
    await this.genLoc("//span[normalize-space()='Add new page']").click();
    await this.genLoc("//input[@placeholder='Page Title']").fill(pageTitle + currentTime);
    await this.genLoc("//span//span[normalize-space()='Create page']").click();
    await this.genLoc("//span[normalize-space()='Pages']").click();
    if (await this.genLoc("//ul[@class='s-pagination-list']").isVisible()) {
      await this.genLoc("(//a[@class='s-pagination-link'])[last()]").click();
    }
    await this.genLoc("(//i[@class='mdi mdi-settings mdi-24px s-flex justify-center'])[last()]").click();
    return await this.getTextContent("//h1[@class='title-bar__title']");
  }
}
