import { Locator, Page } from "@playwright/test";
import type { BtnSettings, Contest, Metric, Metrics, Prize, TextSettings } from "@types";
import { expect } from "@core/fixtures";
import { HivePage } from "@pages/hive/core";

export class HiveContest extends HivePage {
  account: Locator;
  password: Locator;
  login: Locator;

  constructor(page: Page, domainHive: string) {
    super(page, domainHive);
  }

  /**
   * search Contest by contest name
   * @param: contestName
   */
  async searchContestByName(contestName: string) {
    await this.filter("Name", contestName, true);
  }

  /**
   * click Btn on "Action" column of the first contest
   * action:Show, Delete, Edit, Export Data, Add user
   * @param contest
   * @param action
   */
  async clickBtnOnContest(contest: string, action: "Edit" | "Delete" | "Show") {
    await this.genLoc(`(//tr[child::td[normalize-space()='${contest}']]//td//a[@title='${action}'])[1]`).click();
  }

  /**
   * enable contest by name:
   * - search Contest
   * - open Contest to edit
   * - check status checkbox to enable or disable Contest
   *
   * @param contestName
   * @param isEnable
   */
  async searchAndEnableContest(contestName: string, isEnable: boolean) {
    await this.searchContestByName(contestName);
    await this.clickBtnOnContest(contestName, "Edit");
    await this.enableContest(isEnable);
  }

  /**
   * delete contest by name
   *
   * @param contestName
   */
  async deleteContest(contestName) {
    await this.searchContestByName(contestName);
    if (await this.genLoc(`//tr[child::td[normalize-space()='${contestName}']]`).isVisible()) {
      await this.clickBtnOnContest(contestName, "Delete");
      await this.genLoc("//button[@type='submit']//i").click();
      await expect(this.genLoc("//div[@class='alert alert-success alert-dismissable']")).toContainText(
        "has been deleted successfully.",
      );
    }
  }

  /**
   *
   * - check status checkbox to enable or disable Contest
   *
   * @param isEnable
   */
  async enableContest(isEnable: boolean) {
    const chbEnable = "//div[@class='form-group']//div[@class='checkbox'][normalize-space()='Enable']";
    if (isEnable == true) {
      await this.page.check(`${chbEnable}//ins`);
    } else {
      await this.page.uncheck(`${chbEnable}//ins`);
    }
  }

  /**
   * get list of contest have status is enable:
   *
   */
  async getListContestEnable(): Promise<Array<string>> {
    await this.filter("Status", "yes", false);
    return await this.genLoc("//table//tr//td[3]").allTextContents();
  }

  /**
   *
   * input metric of contest
   *
   * @param metrics
   */
  async inputMetrics(metrics: Metrics, shopType: string) {
    await this.genLoc(`//div[@class='select2-container select_metric_types']`).click();
    await this.genLoc(`//div[@class='select2-result-label' and normalize-space()='${metrics.metric_type}']`).click();
    switch (metrics.metric_type) {
      case "Points":
        await this.addConditionOfMetricPoint(metrics.data, shopType);
        break;
      case "Total Sale Items":
        if (shopType.includes("PrintBase")) {
          await this.addConditionOfMetricTSIPb(metrics.data);
        } else {
          await this.addConditionOfMetricTSIPlb(metrics.data);
        }
        break;
      case "GMV":
        break;
    }
  }

  /**
   *
   * input condition of contest Total sale item  with shop type = PrinBase
   *
   * @param metrics
   */
  async addConditionOfMetricTSIPb(metrics: Metric[]) {
    for (let i = 0; i < metrics.length; i++) {
      await this.genLoc("(//div[@id='metric_total_item']//div[@id='s2id_select_sale_product_list']//input)[1]").fill(
        metrics[i].condition,
      );
      await this.genLoc(`//div[@class='select2-result-label' and normalize-space()='${metrics[i].condition}']`).click();
    }
  }

  /**
   *
   * input condition of contest Total sale item  with shop type = PlusBase
   *
   * @param metrics
   */
  async addConditionOfMetricTSIPlb(metrics: Metric[]) {
    const data = metrics[0];
    await this.genLoc(`//div[@id='metric_total_item']//span[@id='select2-chosen-8']`).click();
    await this.genLoc(`//div[@class='select2-result-label' and normalize-space()='${data.condition}']`).click();
    await this.genLoc("//input[@name='quantity_selling_price_compare']").fill(data.value.toString());
  }

  /**
   * add metrics for contest point
   *
   * @param metrics
   */
  async addConditionOfMetricPoint(metrics: Metric[], shopType: string) {
    for (let i = 0; i < metrics.length; i++) {
      if (i > 0) {
        await this.genLoc(`//button[@class='btn btn-primary add_new_points']`).click();
      }

      if (shopType.includes("PlusBase")) {
        await this.genLoc("(//div[@class='select2-container select_plusbase_point_product_list'])[last()]").click();
      } else {
        await this.genLoc("(//div[@class='select2-container select_point_product_list'])[last()]").click();
      }

      await this.page
        .locator(`//ul[@class="select2-results"]//li/div[normalize-space()="${metrics[i].condition}"]`)
        .click();
      await this.page
        .locator(`(//div[@class='col-md-3']//input[@name='pointValue[]'])[last()]`)
        .fill(metrics[i].value.toString());
    }
  }

  /**
   * input inputPrizes for contest
   *
   *
   * @param prizes
   */
  public async inputPrizes(prizes: Prize[]) {
    for (let i = 0; i < prizes.length; ++i) {
      //default have 1 row to fill prizes so from row>1 > click btn add
      if (i > 0) {
        await this.genLoc(`//button[@class="btn btn-primary add_new_prize"]`).click();
      }
      await this.page
        .locator(`(//input[@class="form-control prize_threshhold"])[last()]`)
        .fill(prizes[i].threshold.toString());
      await this.genLoc(`(//input[@class="form-control prize_money"])[last()]`).fill(prizes[i].prize);
    }
  }

  /**
   * select shop type
   *
   * @param shopType
   */
  async selectShopType(shopType: string) {
    await this.genLoc("#select2-chosen-1").click();
    await this.page.waitForLoadState("load");
    await this.genLoc(`//div[@class='select2-result-label' and normalize-space()='${shopType}']`).click();
  }

  /**
   *  input contest name
   *
   * @param contestName
   */
  async inputContestName(contestName: string) {
    await this.page
      .locator(`//label[normalize-space()='Contest Name']//following-sibling::div//input`)
      .fill(contestName);
  }

  /**
   *  select Region
   *
   * @param region
   */
  async selectRegion(region: string) {
    await this.genLoc('ul:has-text("Region")').click();
    await this.page.waitForLoadState("load");
    await this.genLoc(`//div[@class='select2-result-label' and normalize-space()="${region}"]`).click();
  }

  /**
   *  select start time to apply contest
   *
   * @param startTime
   */
  async selectStartTime(startTime: string) {
    await this.genLoc('input[name="startDate"]').click();
    await this.page.waitForLoadState("load");
    await this.genLoc('input[name="startDate"]').fill(startTime);
    await this.genLoc("//label[text()='End Time*']").click();
  }

  /**
   *  select end time to finish contest
   *
   * @param time
   */
  async selectEndTime(time: string) {
    await this.genLoc('input[name="endDate"]').click();
    await this.page.waitForLoadState("load");
    await this.genLoc('input[name="endDate"]').fill(time);
  }

  /**
   *   input msg header setting of pre-contest
   *
   * @param messageContent
   */
  async inputPreContestMsgHeader(messageContent: TextSettings) {
    await this.genLoc("//input[@id='pre_contest_header_content']").fill(messageContent.message);
    await this.genLoc(`//input[@id='pre_contest_header_size']`).fill(messageContent.size.toString());
    await this.genLoc(`//input[@id='pre_contest_header_color']`).fill(messageContent.color);
  }

  /**
   *  input sub-text setting of pre-contest
   *
   * @param messageContent
   */
  async inputPreContestSubText(messageContent: TextSettings) {
    await this.genLoc("//input[@id='pre_contest_sub_header_content']").fill(messageContent.message);
    await this.genLoc(`//input[@id='pre_contest_sub_header_size']`).fill(messageContent.size.toString());
    await this.genLoc(`//input[@id='pre_contest_sub_header_color']`).fill(messageContent.color);
  }

  /**
   *   input btn learn more setting - pre contest
   * @param btnSetting
   */
  async inputPreLearnMoreBtn(btnSetting: BtnSettings) {
    await this.genLoc(`//input[@id='pre_contest_more_button_size']`).fill(btnSetting.size.toString());
    await this.genLoc(`//input[@id='pre_contest_more_button_primary_color']`).fill(btnSetting.primary_color);
    await this.genLoc(`//input[@id='pre_contest_more_button_secondary_color']`).fill(btnSetting.secondary_color);
    await this.genLoc(`//input[@id='pre_contest_link']`).fill(btnSetting.link);
  }

  /**
   * Nhập dữ liệu hợp lệ vào các trường tab Config UI Pre-contest
   * @param contestData ContestUI data of contest
   */
  async configUIPreContest(contestData: Contest) {
    await this.inputPreContestMsgHeader(contestData.message_header);
    await this.inputPreContestSubText(contestData.message_subtext);
    await this.inputPreLearnMoreBtn(contestData.learn_more_btn);
  }

  /**
   *   input msg header setting of in-contest
   * @param: msgSettings: TextSettings
   *
   */
  private async inputInContestMsgHeader(msgSettings: TextSettings) {
    await this.genLoc(`//input[@id='in_contest_header_content']`).fill(msgSettings.message);
    await this.genLoc(`//input[@id='in_contest_header_size']`).fill(msgSettings.size.toString());
    await this.genLoc(`//input[@id='in_contest_header_color']`).fill(msgSettings.color);
  }

  /**
   * Nhập dữ liệu hợp lệ vào các trường tab Config UI In-contest
   * @param contestData
   */
  async configUIInContest(contestData: Contest) {
    await this.inputInContestMsgHeader(contestData.message_header);
    await this.genLoc(`//input[@id='in_contest_link']`).fill(contestData.learn_more_link);
  }

  /**
   *   config ui of after-contest
   * @param contest
   */
  async configUIAfterContest(contest: Record<string, Contest>) {
    await this.configUIAfterContestNoPrize(contest.no_prize);
    await this.configUIAfterContestHadPrize(contest.had_prize);
  }

  /**
   * Nhập dữ liệu hợp lệ vào các trường tab Config UI After-contest với những contest không có giải
   * @param data
   */
  async configUIAfterContestHadPrize(data: Contest) {
    await this.inputAfterContestHadPrizeMsgHeader(data.message_header);
    await this.inputAfterContestHadPrizeSubText(data.message_subtext);
    await this.inputAfterContestHadPrizeLink(data.link);
    await this.genLoc(`//input[@id='after_contest_had_price_box_color']`).fill(data.box_color);
  }

  /**
   *  input setting UI of No Prize Msg Header - After contest
   *
   * @param data
   */
  async inputAfterContestNoPrizeMsgHeader(data: TextSettings) {
    await this.genLoc(`//input[@id='after_contest_no_price_header_content']`).fill(data.message);
    await this.genLoc(`//input[@id='after_contest_no_price_header_size']`).fill(data.size.toString());
    await this.genLoc(`//input[@id='after_contest_no_price_header_color']`).fill(data.color);
  }

  /**
   *  input setting UI of No Prize sub-text - After contest
   * @param data
   */
  async inputAfterContestNoPrizeSubText(data: TextSettings) {
    await this.genLoc(`//input[@id='after_contest_no_price_sub_header_content']`).fill(data.message);
    await this.genLoc(`//input[@id='after_contest_no_price_sub_header_size']`).fill(data.size.toString());
    await this.genLoc(`//input[@id='after_contest_no_price_sub_header_color']`).fill(data.color);
  }

  /**
   * Nhập dữ liệu hợp lệ vào các trường tab Config UI After-contest với những contest không có giải
   * @param data
   */
  async configUIAfterContestNoPrize(data: Contest) {
    await this.inputAfterContestNoPrizeMsgHeader(data.message_header);
    await this.inputAfterContestNoPrizeSubText(data.message_subtext);
  }

  /**
   *  input setting UI of Had Prize Link - After contest
   *
   * @param data
   */
  async inputAfterContestHadPrizeLink(data: TextSettings) {
    await this.genLoc(`//input[@id='after_contest_had_price_link']`).fill(data.message);
    await this.genLoc(`//input[@id='after_contest_had_price_link_size']`).fill(data.size.toString());
    await this.genLoc(`//input[@id='after_contest_had_price_link_color']`).fill(data.color);
  }

  /**
   *  input setting UI of Had Prize msg header - After contest
   *
   * @param data
   */
  async inputAfterContestHadPrizeMsgHeader(data: TextSettings) {
    await this.genLoc(`//input[@id='after_contest_had_price_header_content']`).fill(data.message);
    await this.genLoc(`//input[@id='after_contest_had_price_header_size']`).fill(data.size.toString());
    await this.genLoc(`//input[@id='after_contest_had_price_header_color']`).fill(data.color);
  }

  /**
   *  input setting UI of Had Prize sub-text - After contest
   * @param data:TextSettings
   */
  async inputAfterContestHadPrizeSubText(data: TextSettings) {
    await this.genLoc(`//input[@id='after_contest_had_price_sub_header_content']`).fill(data.message);
    await this.genLoc(`//input[@id='after_contest_had_price_sub_header_size']`).fill(data.size.toString());
    await this.genLoc(`//input[@id='after_contest_had_price_sub_header_color']`).fill(data.color);
  }

  /**
   *  Disable all contest in list of contest
   *
   */
  async disableAllContest() {
    const listContestEnable = await this.getListContestEnable();
    if (listContestEnable.length > 0) {
      for (const contest of listContestEnable) {
        await this.searchAndEnableContest(contest.trim(), false);
        await this.clickOnBtnWithLabel("Update and close");
      }
    } else {
      // remove Form search status if no contest enable
      const btnDeleteFormSearch =
        "//div[contains(@class,'form-group')][child::label[normalize-space()='Status']]//div[@class='col-sm-1']//a";
      await this.genLoc(btnDeleteFormSearch).click();
    }
  }
}
