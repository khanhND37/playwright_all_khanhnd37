import { dateFilter } from "@core/utils/datetime";
import { removeCurrencySymbol } from "@core/utils/string";
import { readFileCSV } from "@helper/file";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { Locator, Page } from "@playwright/test";
import type { OrderDetail, FilterOrder, SummaryRefund } from "@types";

export class OrderPage extends DashboardPage {
  xpathOrderName = "//div[@class='sb-description sb-flex-grow']//div[contains(@class,'title-ellipsis')]";
  xpathProduct = "//div[contains(@class,'order-child-block--line-items')]//div[contains(@class,'text-heading')]";
  xpathNameProduct = "//div[contains(@class,'order-child-block--line-items')]//a";
  xpathSummary = "//div[contains(@class,'order-child-block--summary sb-block-item')]//div[contains(@class,'heading')]";
  xpathTimeline = "//div[contains(@class,'hide-header')]//div[contains(@class,'sb-timeline__heading')]";
  xpathNotes =
    "(//div[contains(@class,'heading')]//div[@class='sb-flex sb-flex-justify-space-between align-items-center']//div)[1]";
  xpathMember = "//div[contains(@class,'sb-mt-large sb-w-100')]//div[contains(@class,'heading')]";
  xpathBtnCancel = "//div[contains(@class,'group-button')]//span[normalize-space()='Cancel order']";
  xpathBtnRefund = "//div[contains(@class,'group-button')]//span[normalize-space()='Refund']";
  xpathPopupCancelOrder = "//div[@class='sb-popup']//div[@class='s-title'][normalize-space()='Cancel order']";
  xpathRefundPage = "//div[@id='page-header']//div[contains(text(),'Refund')]";

  xpathSelectPricingType = "(//button[contains(@class,'sb-button--select')])[1]";
  xpathTimelineMsgConfirm = `(//div[contains(@class, 'sb-timeline__content--message sb-flex')])[3]`;
  xpathTransactionId = `(//div[contains(@class, 'sb-timeline__content--message sb-flex')])[1]`;
  xpathConfirmCardCheckout = `(//div[contains(@class, 'sb-timeline__content--message sb-flex')])[2]`;
  xpathStatusOrder = `//span[contains(@class, 'sb-badge__success')]`;
  xpathTimelineMsg = "//div[contains(@class, 'sb-timeline__content--message sb-flex')]";
  xpathTestOrder = "//div[contains(@class, 'sb-alert__title') and normalize-space() = 'Test order']";
  xpathTotalSalesNull = "//div[normalize-space()='Total sales']/parent::div//h2[normalize-space()='$0.00']";
  xpathTotalOrderNull = "//div[normalize-space()='Total orders']/parent::div//h2[normalize-space()='0']";
  xpathPaginationItems = "//li[contains(@class, 'sb-pagination__list-item')]";
  xpathPaginationList = "//ul[@class = 'sb-pagination__list sb-flex']";
  xpathArrowRight = "//a[contains(@class, 'arrow right')]";
  xpathToastBottom = "//div[@class='s-toast is-dark is-bottom']";
  orderStatus = "//div[contains(@class,'description')]//span";

  constructor(page: Page, domain: string) {
    super(page, domain);
  }

  getLocatorTimelineItem(timeline: string): Locator {
    return this.genLoc(`//div[contains(text(),'${timeline}')]`);
  }

  getLocatorProductName(productName: string): Locator {
    return this.genLoc(`//h5[normalize-space()='${productName}']`);
  }

  getLocatorStatus(status: string): Locator {
    return this.genLoc(`(//span[normalize-space()='${status}'])[1]`);
  }

  getLocatorEmail(email: string): Locator {
    return this.genLoc(`//a[normalize-space()='${email}']`);
  }

  getLocatorProductOrder(productName: string): Locator {
    return this.genLoc(
      `//div[contains(@class,'order-child-block--line-items')]//a[normalize-space()='${productName}']`,
    );
  }

  /**
   * Get payment status order
   * @returns
   */
  async isOrderPaid(): Promise<boolean> {
    const paymentStatus = await this.page.innerText(this.orderStatus);
    if (paymentStatus !== "Paid") {
      return false;
    } else {
      return true;
    }
  }

  // Wait for payment status of order from authorized to paid
  async waitForPaymentStatusIsPaid(): Promise<void> {
    let i = 0;
    while (!(await this.isOrderPaid()) && i < 50) {
      await this.page.waitForTimeout(3 * 1000);
      await this.page.reload();
      await this.page.waitForSelector(this.orderStatus);
      i++;
    }
  }

  /**
   * Get orderID from url in OrderDetail
   */
  getOrderIdInOrderDetail(): number {
    const campaignIds = this.page.url().match(/(\d+)/g);
    return parseInt(campaignIds[0]);
  }

  /**
   * Filter list order by value
   * @param typeFilter input condition filter như Status, Lineitem products, Order date
   * @param valueFilter input value condition filter
   * @param textFilter  input text search filter
   * @param dateValue input date cần filter
   */
  async filterOrderByValue(filterValue: FilterOrder) {
    await this.page.waitForTimeout(2 * 1000);
    const date = dateFilter(filterValue.filter_date, "YYYY/MM/DD");
    const xpathFilterType = `//div[@class='sb-collapse-item__left sb-flex']//div[normalize-space()='${filterValue.filter_type}']`;
    await this.page.click("//span[normalize-space()='More filters']");

    const isDatePickerPopoverVisible = await this.genLoc(
      `//div[contains(@class,'header') and normalize-space() = '${filterValue.filter_type}']//following-sibling::div//div[contains(@class, 'date-picker__input') and contains(@class, 'popover')]`,
    ).isVisible();
    if (!isDatePickerPopoverVisible) {
      await this.page.click(xpathFilterType);
    }
    const xpathBtnClear = this.genLoc(
      `//div[normalize-space()='${filterValue.filter_type}']//parent::div//a[normalize-space()='Clear']`,
    );
    const isClearBtnEnabled = await xpathBtnClear.isEnabled();
    if (isClearBtnEnabled) {
      await this.page.click(
        `//div[normalize-space()='${filterValue.filter_type}']//parent::div//a[normalize-space()='Clear']`,
      );
    }
    switch (filterValue.filter_type) {
      case "Status":
        await this.page.click(`//span[normalize-space()='${filterValue.filter_value}']`);
        break;
      case "Product":
        await this.page.click(`//span[normalize-space()='${filterValue.filter_value}']`);
        await this.genLoc("//div[contains(@class,'sb-mt-medium')]//input[contains(@type,'text')]").fill(
          filterValue.filter_text,
        );
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
        await this.genLoc(
          `(//div[@class='sb-date-picker__input-first sb-flex']//input[@placeholder='YYYY-MM-DD'])[2]`,
        ).fill(date.from);
        await this.genLoc(
          `(//div[@class='sb-date-picker__input-second sb-flex']//input[@placeholder='YYYY-MM-DD'])[1]`,
        ).fill(date.to);
        break;
      case "Test orders":
        await this.page.click(
          `//span[normalize-space()='${filterValue.filter_value}'] | //span[normalize-space()='${filterValue.filter_value}']`,
        );
    }
    await this.page.click(xpathFilterType);
    await this.page.click("//button//span[contains(text(),'Apply')]", { delay: 2 * 1000 });
  }

  /**
   * get the number of orders in the list with type
   * @param typeFilter status, product, test order,..
   * @param valueCount paid, refund, product name, email,...
   * @returns
   */
  async countOrderOnList(typeFilter?: string, valueCount?: string) {
    const isPaginationVisible = await this.genLoc(this.xpathPaginationList).isVisible();

    if (!isPaginationVisible) {
      if (typeFilter && valueCount) {
        return await this.countOrder(typeFilter, valueCount);
      } else {
        return await this.genLoc("//td[contains(@class,'sb-table-column--selection')]").count();
      }
    }

    const noOfPage = Number(await this.genLoc(this.xpathPaginationItems).last().textContent());
    let totalOrder = 0;

    for (let i = 1; i <= noOfPage; i++) {
      await this.page.click(`//li[contains(@class, 'sb-pagination__list-item') and normalize-space() = '${i}']`);
      await this.page.waitForSelector(this.getXpathHeaderColumn("Order"));
      if (typeFilter && valueCount) {
        totalOrder += await this.countOrder(typeFilter, valueCount);
      } else {
        totalOrder += await this.genLoc("//td[contains(@class,'sb-table-column--selection')]").count();
      }
    }
    return totalOrder;
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
   * Filter abandoned checkout theo Email Status hoặc Recovery status
   * @param typeFilter: chọn filter theo Email status hoặc Recovery status
   * @param valueStatus: chọn value cần filter
   */
  async filterByStatus(typeFilter: string, valueStatus: string) {
    await this.page.click(`(//span[contains(text(),'${typeFilter}')])[1]`);
    await this.page.waitForSelector(
      `//div[contains(@class, 'sb-text-body-medium sb-tooltip') and contains(text(),'${valueStatus}')]`,
    );
    await this.page.click(
      `//div[contains(@class, 'sb-text-body-medium sb-tooltip') and contains(text(),'${valueStatus}')]`,
    );
    await this.page.click(`(//span[contains(text(),'${typeFilter}')])[1]`);
    await this.page.waitForSelector(this.getXpathHeaderColumn("Checkout"));
  }

  /**
   * Filter abandoned checkout theo Email Status hoặc Recovery status
   * @param typeFilter: chọn filter theo Email status hoặc Recovery status
   * @param valueStatus: chọn value cần filter
   */
  async removeFilterByStatus(typeFilter: string, valueStatus: number) {
    await this.page.click(`(//span[contains(text(),'${typeFilter}')])[1]`);
    await this.page.waitForSelector(
      `//div[contains(@class, 'sb-text-body-medium sb-tooltip') and contains(text(),'${valueStatus}')]`,
    );
    await this.page.click(
      `//div[contains(@class, 'sb-text-body-medium sb-tooltip') and contains(text(),'${valueStatus}')]`,
    );
    await this.page.click(`(//span[contains(text(),'${typeFilter}')])[1]`);
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
      await this.genLoc(`(//div[@class='sb-date-picker__input-second sb-flex']//input)[1]`).fill(date.to);
      await this.genLoc("//div[contains(@class, 'sb-title-ellipsis')]").click();
      await this.waitUntilElementVisible(`//table[contains(@class,'sb-table__header sb-relative')]`);
      await this.page.waitForSelector(this.getXpathHeaderColumn("Checkout"));
    }
  }

  /**
   * get the number of orders in the Abandoned checkout list with type
   * @param valueCount Sent, Not sent, Scheduled, Recovered, Not recovered
   * @returns
   */
  async getNumberAbandonedCheckout(valueCount?: string) {
    const isPaginationVisible = await this.genLoc(this.xpathPaginationList).isVisible();

    if (!isPaginationVisible) {
      if (valueCount) {
        return await this.genLoc(`//span[normalize-space()='${valueCount}']`).count();
      } else {
        return await this.genLoc("//div[@class='text-black order-detail-link']").count();
      }
    }

    const noOfPage = Number(await this.genLoc(this.xpathPaginationItems).last().textContent());
    let totalOrder = 0;

    for (let i = 1; i <= noOfPage; i++) {
      await this.page.click(`//li[contains(@class, 'sb-pagination__list-item') and normalize-space() = '${i}']`);
      await this.page.waitForSelector(this.getXpathHeaderColumn("Checkout"));
      if (valueCount) {
        totalOrder += await this.genLoc(`//span[normalize-space()='${valueCount}']`).count();
      } else {
        totalOrder += await this.genLoc("//div[@class='text-black order-detail-link']").count();
      }
    }
    return totalOrder;
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
    await this.waitUntilElementInvisible("//span[@class='sb-button--loading-dots sb-flex sb-flex-justify-center']");
    await this.waitUtilSkeletonDisappear();
  }

  /**
   * get thông tin note trong order detail
   * @param getOrderNote: nội dung trong note
   * @return nội dung của note trong order detail
   */
  async getOrderNote(): Promise<string> {
    const note = await this.getTextContent(
      `//div[normalize-space()='Notes']//ancestor::div[contains(@class,'order-child-block')]//div[contains(@class,'content')]//div`,
    );
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
   * Get thông tin product trong order detail
   * @returns thông tin của product: product name, item, subtotal
   */
  async getProductsOnOrderDetail(): Promise<OrderDetail[]> {
    const products = [];
    await this.waitUntilElementInvisible("//div[@class='sb-skeleton sb-pt-100']");
    const productRowLocators = "//div[@class='sb-block order-child-block']//tr[contains(@class,'sb-table__row')]";
    const numberOfProduct = await this.page.locator(productRowLocators).count();
    for (let i = 1; i <= numberOfProduct; i++) {
      const linkImage = await this.page.getAttribute(
        `(//div[contains(@class,'sb-image sb-relative')])[${i}]//img`,
        "src",
      );
      const arrUrl = linkImage.split("/");
      const imageID = arrUrl[arrUrl.length - 1];
      const product = {
        image: imageID,
        productName: await this.getTextContent(`(//div[contains(@class,'sb-pb-medium')]//a)[${i}]`),
        items: await this.getTextContent(`(//td[contains(@class,'is-center')]//div)[${i}]`),
        subtotal: await this.getTextContent(`(//td[contains(@class,'is-right')]//div[@class='sb-text-bold'])[${i}]`),
      };
      products.push(product);
    }
    return products;
  }

  /**
   * Get thông tin summary của order trong order detail
   * @returns thông tin summary của order : subtotal, discount, items, paid
   */
  async getSummaryOrder(): Promise<OrderDetail> {
    const summary = {
      subtotal: await this.getTextContent(
        "//span[normalize-space()='subtotal']//ancestor::tr//td[contains(@class,'is-right')]//div",
      ),
      discount: await this.getTextContent(
        "//span[normalize-space()='discount']//ancestor::tr//td[contains(@class,'is-right')]//div",
      ),
      items: await this.getTextContent(
        "//span[normalize-space()='subtotal']//ancestor::tr//td[contains(@class,'is-left')]//span",
      ),
      paid: await this.getTextContent("//div[normalize-space()='Paid by customer']//following-sibling::div"),
    };
    return summary;
  }

  /**
   * @returns status của order
   */
  async getStatusOrder(): Promise<string> {
    const status = await this.getTextContent("//div[contains(@class,'sb-pt-small')]//span");
    return status;
  }

  async clickOnButon(buttonName: string) {
    await this.page.click(`//button[child::span[normalize-space()='${buttonName}']]`);
  }

  async getProductCancel(): Promise<OrderDetail[]> {
    const products = [];
    const productRowLocators =
      "//div[contains(@class,'sb-popup__container')]//div[@class='s-flex s-flex--spacing-tight line-item']";
    const numberOfProduct = await this.page.locator(productRowLocators).count();
    for (let i = 1; i <= numberOfProduct; i++) {
      const linkImage = await this.page.getAttribute(`(//span[@class='image__wrapper']//img)[${i}]`, "src");
      const arrUrl = linkImage.split("/");
      const imageID = arrUrl[arrUrl.length - 1];
      const product = {
        image: imageID,
        productName: await this.getTextContent(`(//div[@class='s-flex-item line-item__details']//p)[${i}]`),
        subtotalItem: await this.getTextContent(
          `(//div[contains(@class,'line-item__info')]//div[@class='s-flex-item']//span)[${i}]`,
        ),
      };
      products.push(product);
    }
    return products;
  }

  /**
   * @returns subtotal và Total available to refund của order
   */
  async getSubtotalInCancelOrderPopup(): Promise<SummaryRefund> {
    const payment = {
      subtotal: await this.getTextContent("//td[normalize-space()='Subtotal']//following-sibling::td"),
      refund: await this.getTextContent("//td[normalize-space()='Total available to refund']//following-sibling::td"),
    };
    return payment;
  }

  async cancelOrder(buttonText: string, refund?: string, reason?: string) {
    if (refund) {
      await this.page.locator("//div[@class='sb-flex sb-input__body']//input").fill(refund);
    }

    if (reason) {
      await this.page.selectOption("//div[contains(@class,'sb-select-menu')]//label", reason);
    }
    await this.page.click(`//div[contains(@class,'sb-popup')]//button[child::span[normalize-space()='${buttonText}']]`);
  }
  private xpathStatusFirstOrder = "(//tr[contains(@class, 'row-order')]//div[@class = 'cell'])[5]//span";

  /**
   * Search order on order list
   * @param orderName: name order cần search
   */
  async searchOrderDashboard(orderName: string) {
    await this.genLoc(`[placeholder="Search order"]`).fill(orderName);
    await this.genLoc(`[placeholder="Search order"]`).press("Enter");
    await this.page.waitForSelector("//table[contains(@class,'sb-table__header sb-relative')]");
    await this.page.waitForSelector(this.xpathPaginationList, { state: "hidden" });
  }

  /**
   * click to open newest order on order list
   */
  async openNewestOrder() {
    await this.page.click("(//a[@class = 'text-black order-detail-link'])[1]");
  }

  /**
   * thực hiên get thông tin product khi thực hiện refund order
   * @returns imageID, product name, subtotal của product cần refund
   */
  async getProductInRefundPage(): Promise<OrderDetail[]> {
    const products = [];
    const productLinesLocators = await this.page
      .locator("//div[@class='card__section']//div[@class='unfulfilled-card-container']")
      .elementHandles();
    for (const productLinesLocator of productLinesLocators) {
      // Image url: https://img.thesitebase.net/10049/10049974/products/0x360@1648835723f84aaf318e.jpeg
      const imageElement = await productLinesLocator.$("//img");
      const imageSrc = await imageElement.getAttribute("src");
      const arrUrl = imageSrc.split("@");
      const imageID = arrUrl[arrUrl.length - 1];
      // get product name
      const productElement = await productLinesLocator.$("//p[contains(@class,'router-text-blue')]");
      const productName = await productElement.textContent();
      // ge subtotal item
      const subtotalElement = await productLinesLocator.$("//div[contains(@class,'total-price')]//span");
      const subtotal = await subtotalElement.textContent();
      const product = {
        image: imageID,
        productName: productName.trim(),
        subtotalItem: subtotal.trim(),
      };
      products.push(product);
    }
    return products;
  }

  /**
   * thực hiên get thông tin product khi thực hiện cancel order
   * @returns imageID, product name, subtotal của product cần refund
   */
  async getProductInCancelPopup(): Promise<OrderDetail[]> {
    const products = [];
    const productLinesLocators = await this.page
      .locator("//div[@class= 'type-container']//div[@class='s-flex s-flex--spacing-tight line-item']")
      .elementHandles();
    for (const productLinesLocator of productLinesLocators) {
      // Image url: https://img.thesitebase.net/10049/10049974/products/0x360@1648835723f84aaf318e.jpeg
      const imageElement = await productLinesLocator.$("//img");
      const imageSrc = await imageElement.getAttribute("src");
      const arrUrl = imageSrc.split("@");
      const imageID = arrUrl[arrUrl.length - 1];
      // get product name
      const productElement = await productLinesLocator.$("//p[@class='line-item__title type--semi-bold']");
      const productName = await productElement.textContent();
      // ge subtotal item
      const subtotalElement = await productLinesLocator.$("//div[@class='s-flex-item']//span");
      const subtotal = await subtotalElement.textContent();
      const product = {
        image: imageID,
        productName: productName.trim(),
        subtotalItem: subtotal.trim(),
      };
      products.push(product);
    }
    return products;
  }

  /**
   * @returns subtotal và Total available to refund của order khi thực hiện refund
   */
  async getSubtotalInRefundOrderPage(): Promise<object> {
    const payment = {
      subtotal: await this.getTextContent(
        "//p[normalize-space()='Items subtotal']//parent::div//following-sibling::div//span",
      ),
      refund: await this.getTextContent(
        "//p[normalize-space()='Refund amount']//parent::div//following-sibling::div//span",
      ),
    };
    return payment;
  }

  async productNumberRefund(productName: string, items: string) {
    await this.page.fill(`//p[normalize-space()='${productName}']//parent::div//following-sibling::div//input`, items);
    await this.page.click("//div[@class='s-heading'][normalize-space()='Summary']");
    await this.waitUntilElementVisible("//p[normalize-space()='Items subtotal']");
  }

  /**
   * click button refund order trên page
   * @param reason là reason khi refund order
   * @param refundAmount là amount refund order
   */
  async refundItemsOrder(reason?: string, refundAmount?: string) {
    if (reason) {
      await this.page.fill("//div[@class='s-input']//input", reason);
    }
    if (refundAmount) {
      await this.page.fill(
        "//h3//ancestor::div[contains(@class,'type-container')]//input[@type='number']",
        refundAmount,
      );
    }
    await this.page.click("//span[contains(text(),'Refund')]");
  }

  /**
   * wait for order process from authorize to paid status
   * @param status: status of order: authorized, paid, failed
   */
  async waitForFirstOrderStatus(status: string) {
    await this.page.waitForSelector("(//tr[contains(@class, 'row-order')])[1]");
    for (let i = 0; i < 9; i++) {
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

  getXpathHeaderColumn(title: string): string {
    return `//table[contains(@class, 'sb-table__header')]//th[normalize-space() = '${title}']`;
  }

  async getValueOnCell(headerCol: string) {
    let textContent: string;
    switch (headerCol) {
      case "Order":
        textContent = await this.page.textContent("(//td[contains(@class, 'sb-table_1_column_2')])[1]");
        break;

      case "Email":
        textContent = await this.page.textContent("(//td[contains(@class, 'sb-table_1_column_3')])[1]");
        break;

      case "Date":
        textContent = await this.page.textContent("(//td[contains(@class, 'sb-table_1_column_4')])[1]");
        break;

      case "Payment status":
        textContent = await this.page.textContent(
          "(//tr[contains(@class, 'row-order')]//div[@class = 'cell'])[5]//span",
        );
        break;

      case "Total":
        textContent = await this.page.textContent("(//td[contains(@class, 'sb-table_1_column_6')])[1]");
        break;
    }
    return textContent;
  }

  async countOrder(typeFilter: string, valueCount: string) {
    let countOrder: number;
    let listOrder: number;
    switch (typeFilter) {
      case "Status":
        countOrder = await this.genLoc(`//span[normalize-space()='${valueCount}']`).count();
        break;
      case "Product":
        listOrder = await this.genLoc("//td[contains(@class,'sb-table-column--selection')]").count();
        countOrder = 0;
        for (let i = 1; i <= listOrder; i++) {
          await this.genLoc(`(//span[contains(@class,'sb-icon__default sb-ml-small')])[${i}]`).click();
          await this.waitUntilElementVisible(`(//a[contains(text(),'${valueCount}')])[${i}]`);
          countOrder++;
        }
        break;
      case "IdOrder":
        countOrder = await this.genLoc(`//div[contains(text(),'${valueCount}')]`).count();
        break;
      case "Test orders":
        countOrder = await this.genLoc("//td[contains(@class,'sb-table-column--selection')]").count();
        break;
    }
    return countOrder;
  }

  async exportOrderWithOption(option: string, dateType?: string): Promise<string> {
    await this.chooseOptionExport(option, dateType);
    await this.clickButtonOnPopUpWithLabel("Export to file");
    const download = await this.page.waitForEvent("download");
    return download.path();
  }

  async chooseOptionExport(option: string, dateType?: string) {
    const xpathOptionExport = `//div[contains(@class, 'sb-popup__body')]//span[normalize-space() = '${option}']`;
    const isCheck = await this.genLoc(xpathOptionExport).isChecked();
    if (isCheck === false) {
      await this.page.check(xpathOptionExport);
    }
    if (option === "Orders by date") {
      const date = dateFilter(dateType, "DD/MM/YYYY");
      await this.genLoc(
        "(//div[contains(@class, 'sb-date-picker__input-first')]//input[@placeholder = 'DD/MM/YYYY'])[2]",
      ).fill(date.from);
      await this.genLoc(
        "(//div[contains(@class, 'sb-date-picker__input-second')]//input[@placeholder = 'DD/MM/YYYY'])[1]",
      ).fill(date.to);
      await this.page.click("//div[@class = 'sb-popup__header']");
    }
  }

  async selectOrders(numberOfOrder: number) {
    for (let i = 0; i < numberOfOrder; i++) {
      //Select each order until the quantity = numberOfOrder
      if (i === 0) {
        await this.page.check(`(//span[@class = 'sb-check'])[${i + 2}]`);
      } else {
        await this.page.check(`(//span[@class = 'sb-check'])[${i + 3}]`);
      }
    }
  }

  async compareOrderIdWithCSV(file: string, ids: number[]): Promise<boolean> {
    const readFeedFile = await readFileCSV(file, "\n");
    for (let i = 0; i < readFeedFile.length; i++) {
      const row = readFeedFile[i][0].split(",");
      let prevRow: string[];
      if (i > 0) {
        prevRow = readFeedFile[i - 1][0].split(",");
        //if the ids of 2 consecutive row are equal, it is orders with multiple line items
        if (row[56] === prevRow[56]) {
          i++;
        }
      } else {
        //get id of order in csv
        const valueField = row[56];
        return valueField === ids[ids.length - 1 - i].toString();
      }
    }
  }

  // Go to order detail by order id
  async goToOrderByOrderId(orderId: number) {
    await this.page.goto(`https://${this.domain}/admin/creator/orders/${orderId}`);
    await this.page.waitForSelector("//div[contains(text(), 'Order')]");
  }

  /**
   * Sometime for some reason order captures or calculate profit slower than usual
   * Reload page to wait until order complete processing
   * @param orderStt
   */
  async reloadUntilOrdCapture(orderStt?: string, times = 6) {
    if (!orderStt) {
      orderStt = await this.getOrderStatus();
    }
    for (let i = 0; i < times; i++) {
      if (orderStt.includes("Authorized") || orderStt.includes("authorized")) {
        await this.page.reload();
        await this.page.waitForSelector(this.orderStatus);
        orderStt = await this.getOrderStatus();
        // Use wait timeout to avoid reload too fast
        await this.page.waitForTimeout(1000);
      } else {
        break;
      }
    }
    if (orderStt.includes("Authorized")) {
      throw new Error("Order still in Authorized status");
    }
    return orderStt;
  }

  async getOrderStatus() {
    return await this.getTextContent(`//div[contains(@class,'slot-title')]//span`);
  }

  /**
   * Get tax value on order detail page
   * @returns tax value
   */
  async getTaxValue() {
    let taxValue = "$0.00";
    const isTaxExist = await this.page
      .locator(`//tr[child::td[text()='Tax' or descendant::span='tax']]/td[last()]/div`)
      .isVisible();
    if (isTaxExist) {
      taxValue = await this.getTextContent(`//tr[child::td[text()='Tax' or descendant::span='tax']]/td[last()]/div`);
    }
    return removeCurrencySymbol(taxValue);
  }

  async getPaidByCustomer() {
    return await this.getTextContent("//div[text()[normalize-space()='Paid by customer']]/following-sibling::div");
  }

  /**
   * This function generates a locator for a specific order status on a web page.
   * @param {string} status - The status parameter is a string that represents the order status that we
   * want to locate on the page.
   * @returns A Locator object is being returned.
   */
  genOrderStatusLoc(status: string): Locator {
    return this.page.locator(`//div[contains(@class,'slot-title')]//span[normalize-space()='${status}']`);
  }
}
