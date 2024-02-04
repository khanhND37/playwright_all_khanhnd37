import { dateFilter } from "@core/utils/datetime";
import { SBPage } from "@pages/page";
import { Page } from "@playwright/test";

/**
 * @deprecated: use src/shopbase_creator/dashboard/ instead
 */
export class OrderPage extends SBPage {
  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  /**
   * Search order on order list
   * @param orderName: name order cần search
   */
  async searchOrderDashboard(orderName: string) {
    await this.genLoc(`[placeholder="Search order"]`).fill(orderName);
    await this.genLoc(`[placeholder="Search order"]`).press("Enter");
    await this.page.waitForSelector("//table[contains(@class,'sb-table__header sb-relative')]");
  }

  /**
   * Filter list order by value
   * @param typeFilter input condition filter như Status, Lineitem products, Order date
   * @param valueFilter input value condition filter
   * @param textFilter  input text search filter
   * @param dateValue input date cần filter
   */
  async filterOrderByValue(typeFilter: string, valueFilter?: string, textFilter?: string, dateValue?: string) {
    const date = dateFilter(dateValue);
    await this.page.click("//span[normalize-space()='More filters']");
    await this.page.click(`//div[@class='sb-collapse-item__left sb-flex']//div[normalize-space()='${typeFilter}']`);
    const xpathBtnClear = this.genLoc(
      `//div[normalize-space()='${typeFilter}']//parent::div//a[normalize-space()='Clear']`,
    );
    if (await xpathBtnClear.isEnabled()) {
      await this.page.click(`//div[normalize-space()='${typeFilter}']//parent::div//a[normalize-space()='Clear']`);
    }
    switch (typeFilter) {
      case "Status":
        await this.page.click(`//span[normalize-space()='${valueFilter}']`);
        break;
      case "Product":
        await this.page.click(`//span[normalize-space()='${valueFilter}']`);
        await this.genLoc("//div[contains(@class,'sb-mt-medium')]//input[contains(@type,'text')]").fill(textFilter);
        break;
      case "Order date":
        await this.genLoc(
          "(//div[@class='sb-date-picker__input-first sb-flex']//input[@placeholder='YYYY/MM/DD'])[2]",
        ).fill(date.from);
        await this.genLoc(
          "(//div[@class='sb-date-picker__input-second sb-flex']//input[@placeholder='YYYY/MM/DD'])[1]",
        ).fill(date.to);
        break;
      case "Refund date":
        await this.genLoc(`(//span[@is-collapse-active='true']//input)[3]`).fill(date.from);
        await this.genLoc(`(//div[@class='sb-date-picker__input-second sb-flex']//input)[1]`).fill(date.to);
        break;
      case "Test orders":
        await this.page.click(
          `//span[normalize-space()='${valueFilter}'] | //span[normalize-space()='${valueFilter}']`,
        );
    }
    await this.page.click(`//div[@class='sb-collapse-item__left sb-flex']//div[normalize-space()='${typeFilter}']`);
    await this.page.click("//button//span[contains(text(),'Apply')]");
  }

  /**
   * Get number order on list order
   * @return number order on list order
   */
  async getNumberOfOrder() {
    const noOfOrder = await this.genLoc("//tr[@class='sb-table__row order-expanded cursor-default row-order']").count();
    return noOfOrder;
  }

  /**
   * get the number of orders in the list with type
   * @param typeFilter status, product, test order,..
   * @param valueCount paid, refund, product name, email,...
   * @returns
   */
  async countOrderOnList(typeFilter: string, valueCount: string) {
    let countOrder;
    let listOrder;
    switch (typeFilter) {
      case "Status":
        countOrder = await this.genLoc(`//span[normalize-space()='${valueCount}']`).count();
        break;
      case "Product":
        listOrder = await this.genLoc("//tr[@class='sb-table__row order-expanded cursor-default row-order']").count();
        for (let i = 1; i <= listOrder; i++) {
          await this.genLoc(`(//span[contains(@class,'sb-icon__default sb-ml-small')])[${i}]`).click();
          await this.waitUntilElementVisible(`(//a[contains(text(),'${valueCount}')])[${i}]`);
        }
        countOrder = await this.genLoc(`//a[contains(text(),'${valueCount}')]`).count();
        break;
      case "IdOrder":
        countOrder = await this.genLoc(`//div[contains(text(),'${valueCount}')]`).count();
        break;
      case "Test orders":
        if (valueCount === "No") {
          countOrder = await this.genLoc("//a//div[@class='sb-flex']").count();
        }
        break;
    }
    return countOrder;
  }

  /**
   * Click Order name on list order
   * @param orderName: name order cần click
   */
  async clickOrderName(orderName: string) {
    await this.page.click(`(//div[contains(text(),'${orderName}')])[1]`);
    await this.page.waitForSelector("//img[@class='sb-w-100 sb-h-100']");
  }

  /**
   * Edit Customer in order detail
   * @param editEmail: email Customer cần edit
   * @return email Customer sau khi edit tại màn order detail
   */
  async editCustomerInOrderDetail(newEmail: string) {
    await this.page.click(
      `//div[contains(@class,'order-child-block order-child-block--customer')]//div//span[contains(text(),'Edit')]`,
    );
    await this.genLoc(`//input[@placeholder='Email']`).fill(newEmail);
    await this.page.click(`//span[normalize-space()='Save']`);
    await this.page.waitForSelector("//a[@class='order-body-text']");
    const email = await this.getTextContent(`//div[contains(@class,'order-child-block order-child-block--customer')]`);
    // Do class của email không có name nên getTextContent của class trên và dùng hàm substring để cắt chuỗi
    return email.substring(email.indexOf("\n") + 2, email.length).trim();
  }

  /**
   * Filter abandoned checkout theo Email Status hoặc Recovery status
   * @param typeFilter: chọn filter theo Email status hoặc Recovery status
   * @param valueStatus: chọn value cần filter
   */
  async filterByStatus(typeFilter: string, valueStatus: number) {
    await this.page.click(`(//span[contains(text(),'${typeFilter}')])[1]`);
    await this.page.waitForSelector(`(//span[@class='sb-check'])[${valueStatus}]`);
    await this.page.click(`(//span[@class='sb-check'])[${valueStatus}]`);
  }

  /**
   * Filter abandoned checkout theo checkout date
   * @param valueFilter: chọn value date để filter
   * @param dateValue input ngày bắt đầu và ngày kết thúc filter
   */
  async filterByDate(valueFilter: string, dateValue?: string) {
    const date = dateFilter(dateValue);
    await this.page.click(`//span[@class='sb-button--label']`);
    await this.page.click(`//li[normalize-space()='${valueFilter}']`);
    await this.waitUntilElementVisible(`//table[contains(@class,'sb-table__header sb-relative')]`);
    if (valueFilter === "Custom") {
      await this.genLoc(`(//div[@class='sb-date-picker__input-first sb-flex']//input)[2]`).fill(date.from);
      await this.genLoc(`(//input[@class='sb-text-center'])[2]`).fill(date.to);
      await this.waitUntilElementVisible(`//table[contains(@class,'sb-table__header sb-relative')]`);
    }
  }

  /**
   * Select Order country on filter list order
   * @param countryFilter: country cần click để filter
   */
  async selectOrderCountry(countryFilter: string) {
    await this.page.click(`//div[@class='sb-filter__body sb-py-medium']//button[last()]`);
    await this.page.click(`//li[normalize-space()='${countryFilter}']`);
    await this.page.waitForSelector("//table[contains(@class,'sb-table__header sb-relative')]");
  }

  /**
   * Click resend email cho customer trong order detail
   */
  async clickResendEmail() {
    await this.page.click(`(//span[contains(text(),'Resend email')])[last()]`);
    await this.page.waitForSelector("//img[@class='sb-w-100 sb-h-100']");
  }

  /**
   * Verify validate edit email Customer in order detail
   * @param newEmail: email Customer cần edit
   * @return message validate
   */
  async validateMailCustomer(newEmail: string) {
    await this.page.click(
      `//div[contains(@class,'order-child-block order-child-block--customer')]//div//span[contains(text(),'Edit')]`,
    );
    await this.genLoc(`//input[@placeholder='Email']`).fill(newEmail);
    await this.page.click(`//span[normalize-space()='Save']`);
    const message = await this.getTextContent(`//div[@class='sb-form-item__message sb-text-caption sb-mt-small']`);
    await this.page.click(`//span[normalize-space()='Cancel']`);
    return message;
  }

  /**
   * Edit note cho order detail
   * @param newNoteOrder: nội dung note cần edit
   * @return nội dung note lưu lại sau khi edit
   */
  async editOrderNote(newNoteOrder: string) {
    await this.page.click(`(//span[contains(text(),'Edit')])[1]`);
    await this.genLoc(`//textarea[@placeholder='Notes']`).fill(newNoteOrder);
    await this.page.click(`//span[normalize-space()='Save']`);
    await this.page.waitForSelector("//div[normalize-space()='Notes']");
    const note = await this.getTextContent(`//div[@class='text-break']`);
    return note;
  }

  /**
   * Edit note cho Abandoned Checkout detail
   * @param newNoteCheckout: nội dung note cần edit
   * @return nội dung note lưu lại sau khi edit
   */
  async editNoteAbandonedCheckout(newNoteCheckout: string) {
    await this.genLoc(`//textarea[@placeholder='Add a note to this checkout...']`).fill(newNoteCheckout);
    await this.page.click(`//span[normalize-space()='Save']`);
    await this.page.waitForSelector("//img[@class='sb-w-100 sb-h-100']");
    const noteCheckout = await this.getTextContent(`//textarea[@placeholder='Add a note to this checkout...']`);
    return noteCheckout;
  }

  /**
   * click to open newest order on order list
   */
  async openNewestOrder() {
    await this.page.click("(//a[@class = 'text-black order-detail-link'])[1]");
  }

  /**
   * wait for order process from authorize to paid status
   * @param status: status of order: authorized, paid, failed
   */
  async waitForFirstOrderStatus(status: string) {
    await this.page.waitForSelector("(//tr[contains(@class, 'row-order')])[1]");
    for (let i = 0; i < 5; i++) {
      const orderStatus = await this.page.textContent(
        "(//tr[contains(@class, 'row-order')]//div[@class = 'cell'])[5]//span",
      );
      if (orderStatus.trim() === status) {
        break;
      } else {
        await this.page.reload();
      }
    }
  }
}
