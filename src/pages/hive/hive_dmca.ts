import { HivePage } from "./core";
import { readFileCSV } from "@helper/file";
import { Mailinator } from "@helper/mailinator";

export type SearchPageDMCARequest = {
  created_at_min?: number;
  created_at_max?: number;
  title: string;
  platforms: string;
  page: string;
  mod_status?: string;
  event_type?: string;
};

export class HiveDMCA extends HivePage {
  // type email send for buyer , ex : send mail notification delete product or mail verification
  EventTypeVerification = "verification";
  EventTypeDeleted = "deleted";

  /**go to search page by url*/
  async navigateToPage(request: SearchPageDMCARequest) {
    const date = new Date();
    if (!request.created_at_min) {
      date.setDate(date.getDate() - 2);
      request.created_at_min = Math.floor(date.getTime() / 1000);
    }

    if (!request.created_at_max) {
      request.created_at_min = Math.floor(date.getTime() / 1000);
    }

    let titleSearch = "title";
    if (request.page === "collection-search") {
      titleSearch = "shop_domains";
    }

    let url = `admin/tos-violation-review/${request.page}?created_at_min=${request.created_at_min}&created_at_max=${request.created_at_max}
    &${titleSearch}=${request.title}&limit=72&platforms=${request.platforms}&sort_mode=DESC&sort_field=id`;
    if (request.mod_status) {
      url = url.concat(`&mod_status=${request.mod_status}`);
    }

    // search
    await this.goto(url);
    await this.page.waitForSelector(".loading-right-wrap", { state: "hidden" });
  }

  /**
   * get email subject notification DMCA
   * @param request
   * @param productTitle
   * @param preSubject
   */
  async getSubjectMail(request: SearchPageDMCARequest, productTitle: string, preSubject: string) {
    await this.navigateToPage(request);
    const xpathProduct = `(//div[@class='product-item-info row' and descendant::p[contains(text(),'${productTitle}')]])[1]//a[@class='btn btn-success']`;
    await this.genLoc(xpathProduct).click();
    await this.page.waitForSelector("//h4[contains(text(),'EVENT LOG')]", { state: "visible" });
    let xpathEventLog = `//div[@class='event-logs-item']//p[contains(text(),'Deleted product')]`;
    if (request.event_type === this.EventTypeVerification) {
      xpathEventLog = `//div[@class='event-logs-item']//p[contains(text(),'Sent verification')]`;
    }

    if (!(await this.genLoc(xpathEventLog).isVisible())) {
      return "";
    }

    const content = await this.genLoc(xpathEventLog).textContent();
    const splitContent = content.split(" ");
    const mailId = splitContent[splitContent.length - 2];
    return preSubject.concat(" ", mailId);
  }

  /**
   * check list product exists or not exists on page
   * @param titlesCheck
   * @param page
   */
  async checkListProductExist(titlesCheck: string[], page: string): Promise<boolean> {
    let xpath = "//div[@class='product-item-info']//div[2]/span";
    if (page === "moderation-list") {
      xpath = "//div[contains(@class, 'product-item-info')]//div[3]/p";
    }

    // check all product exists or not exists
    const titlesShow = await this.page.locator(xpath).allTextContents();
    if (!titlesShow || titlesShow.length === 0) {
      return false;
    }

    const listTitleExists = titlesCheck.filter(x => titlesShow.includes(x));
    // all product exists
    if (listTitleExists.length === titlesCheck.length) {
      return true;
    }

    return false;
  }

  /**
   * view product from collection
   */
  async clickViewProductInsideCollection(title: string) {
    const xpath = `(//div[@class='product-item collection-pointer' and descendant::p[contains(text(),'${title}')]]//button)`;
    await this.page.locator(xpath).click();
    await this.page.waitForSelector(".loading-right-wrap", { state: "hidden" });
  }

  /**
   * get list product inside email
   * @param linkFile
   * @param folder
   */
  async getProductsInsideEmail(linkFile: string, folder: string): Promise<string[]> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      await this.page.evaluate(linkCsv => {
        const link = document.createElement("a");
        link.href = linkCsv;
        link.click();
      }, linkFile),
    ]);

    await download.saveAs(`./data/${folder}`);
    const readFile = await readFileCSV(`./data/${folder}`, "\t", 1);
    const products = readFile.map(x => x[0].split("/")[2]);
    return products;
  }

  /**
   * verify product inside file csv map with product sample
   * @param mailinator
   * @param subjectEmail
   * @param folderName
   * @param productHandleCompare
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async verifyProductInsideMail(
    mailinator: Mailinator,
    subjectEmail: string,
    folderName: string,
    productHandleCompare: string[],
  ) {
    await mailinator.page.reload();
    await mailinator.readMail(subjectEmail);
    // verify file csv
    const xpath = mailinator.xpathFileCSVRemove;
    const linkCsv = await mailinator.page.frameLocator(mailinator.iframe).locator(xpath).textContent();
    const products = await this.getProductsInsideEmail(linkCsv, folderName);

    return products.filter(x => productHandleCompare.includes(x)).length === productHandleCompare.length;
  }
}
