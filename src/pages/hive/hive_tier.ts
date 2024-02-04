import type { AllConfig, ConfigTier, ModifiedTier, RedeemRequest, Reward } from "@types";
import { HiveSBaseOld } from "./hiveSBaseOld";

/**
 * @deprecated: Separate each page into POM in folder src/pages/hive/(printbase|shopbase)
 */
export class HiveTier extends HiveSBaseOld {
  /**
   * Go to edit tier screen
   * @param level is tier level number , ex: 1 = Newbie
   */
  async gotoEditTierScreen(level: number) {
    await this.goto(`admin/tier/${level}/edit`);
    await this.page.waitForLoadState("load");
  }

  /**
   * Input data to edit tier section Tier
   * Click btn Update
   * @param data <ModifiedTier>
   */
  async inputTier(data: ModifiedTier) {
    if (data.name) {
      await this.genLoc("//div[child::label[normalize-space()='Name']]//input").fill(data.name);
    }
    if (data.threshold) {
      await this.genLoc("//div[child::label[normalize-space()='Threshold']]//input").fill(data.threshold);
    }
    if (data.keep_threshold) {
      await this.genLoc("//div[child::label[normalize-space()='Threshold Giữ Hạng']]//input").fill(data.keep_threshold);
    }
    if (data.cycle) {
      await this.genLoc("//div[child::label[normalize-space()='Cycle']]//input").fill(data.cycle);
    }
    await this.genLoc("//button[@name='btn_update_and_edit']").click();
  }

  /**
   * Input data to edit tier section Tier rewards
   * @param data <Reward>
   */
  async inputReward(data: Reward) {
    // click btn Add
    if (data.isAdd) {
      await this.genLoc("(//button[@class='btn btn-danger delete-reward-btn'])[1]").click();
      await this.genLoc("//button[@class='btn btn-primary add-new-reward-row']").click();
    }
    // dien thong tin
    if (data.ex_star) {
      await this.genLoc(`//div[contains(@class,'redeem-reward')][last()]//input[contains(@name,'exchange_cost')]`).fill(
        data.ex_star,
      );
    }
    if (data.reward_type) {
      await this.genLoc(
        `//div[contains(@class,'redeem-reward')][last()]//div[contains(@class,'exchange-type-select')]`,
      ).click();
      await this.genLoc(`//li//div[normalize-space()='${data.reward_type}']`).click();
    }
    if (data.cash_value) {
      await this.genLoc(`//div[contains(@class,'redeem-reward')][last()]//input[contains(@name,'cash_value')]`).fill(
        data.cash_value,
      );
    }
    if (data.gift_value) {
      await this.genLoc(
        `//div[contains(@class,'redeem-reward')][last()]//input[contains(@name,'equivalent_cash')]`,
      ).fill(data.gift_value);
      await this.genLoc(`//div[contains(@class,'redeem-reward')][last()]//input[contains(@name,'gift_name')]`).fill(
        data.gift_name,
      );

      if (data.file_path) {
        await this.page.setInputFiles(
          `//div[contains(@class,'redeem-reward')][last()]//input[contains(@name,'gift_image') and @type='file']`,
          data.file_path,
        );
      }
    }
    await this.genLoc("//button[@name='btn_update_and_edit']").click();
  }

  /**
   * Get message after update tier
   * @returns <string> message
   */
  async getMessage(): Promise<string> {
    const msg = await this.page.innerText("//div[contains(@class,'alert-dismissable')]");
    return msg.slice(1).trim();
  }

  /**
   * Get tier level name in Edit user screen
   * @returns <string> tier level name
   */
  async getTierLevel(): Promise<string> {
    return await this.page.getAttribute(
      "//parent::div[label[normalize-space()='Tier']]//following-sibling::div//input",
      "value",
    );
  }

  /**
   * get redeem stars in Edit user screen
   * @return <number> redeem star
   */
  async getRedeemStar(): Promise<number> {
    const redeemStar = await this.page.getAttribute(
      "//div[@id='userTier']//div[@class='row']//div[@class='col-md-6']/input",
      "value",
    );
    return parseFloat(redeemStar);
  }

  /**
   *  get tier stars in Edit user screen
   * @return <number> tier star
   */
  async getTierStar(): Promise<number> {
    const tierStar = await this.page.getAttribute(
      "//div[@id='userTier']//div[@class='row mt-20'][1]//div[@class='col-md-6']/input",
      "value",
    );
    return parseFloat(tierStar);
  }

  /**
   * Editing redeem / tier stars in Edit user screen
   * @param star is the input quantity
   * @param label is the name of coin
   */
  async inputStar(star: number, label: string) {
    let syntax = "+";
    if (star < 0) {
      syntax = "-";
      star = -1 * star;
    }
    await this.page.locator(`//div[div[label[normalize-space()='${label}']]]//span[@class='select2-arrow']`).click();
    await this.genLoc(`//div[contains(@class,'select2-drop')]//div[normalize-space()='${syntax}']`).click();
    await this.genLoc(`//div[div[label[normalize-space()='${label}']]]//input[contains(@name, 'coin_value')]`).fill(
      star.toString(),
    );
    await this.genLoc("//button[normalize-space()='Update']").click();
    await this.page.waitForLoadState("load");
  }

  /**
   * get total redeem request of user in Redeem request screen
   * @param email
   * return <number> total redeem request of user
   */
  async getTotalRequestByEmail(email: string): Promise<number> {
    await this.genLoc("//a[@class='dropdown-toggle sonata-ba-action']//b").click();
    const value = await this.page.getAttribute("//input[@id='filter_user__email_value']", "value");
    if (value !== email) {
      await this.genLoc("//a[normalize-space()='Email']").click();
      await this.genLoc("//input[@id='filter_user__email_value']").fill(email);
      await this.page.press("input[id='filter_user__email_value']", "Enter");
    }
    const requestNumber = await this.page.locator("//a[normalize-space()='Id']//ancestor::table//tbody/tr").count();
    return requestNumber;
  }

  /**
   * get info of a request in Redeem request screen
   * @return <object> info of a request
   */
  async getRequestInfoByEmail(): Promise<RedeemRequest> {
    const requestInfo = {
      email: await this.page.innerText("//tbody/tr[1]//td[3]"),
      tierName: await this.page.innerText("//tbody//tr[1]//td[5]"),
      giftName: await this.page.innerText("//tbody//tr[1]//td[6]"),
      status: await this.page.innerText("//tbody//tr[1]//td[8]"),
    };
    return requestInfo;
  }

  /**
   * Get rewards info of a tier level in Edit tier screen
   * @returns <string> reward info
   */
  async getRewardInfo(): Promise<string> {
    const rewardInfos = [];
    const number = await this.genLoc("//div[@class='user-tier-redeem-info']/div").count();
    let value: string;
    for (let i = 1; i <= number; i++) {
      const type = await this.page.innerText(`(//div[@class='select2-container exchange-type-select'])[${i}]`);
      if (type === "Cash") {
        value = `$${parseInt(
          await this.page.getAttribute(`(//input[@name='redeem_reward[cash_value][]'])[${i}]`, "value"),
        ).toLocaleString()} (USD)`;
      } else {
        value = await this.page.getAttribute(`(//input[@name='redeem_reward[gift_name][]'])[${i}]`, "value");
      }
      const rewardInfo = {
        star: parseInt(
          await this.page.getAttribute(`(//input[@name='redeem_reward[exchange_cost][]'])[${i}]`, "value"),
        ).toLocaleString(),
        value: value,
      };
      rewardInfos.push(rewardInfo);
    }
    return JSON.stringify(rewardInfos);
  }

  /**
   * Get config info of a level by level name  in Tier list screen
   * @param level is level tier name
   * @returns <object> config info of a level
   */
  async getTierInfoByLevelName(level: string): Promise<ConfigTier> {
    return {
      threshold: parseInt(await this.page.innerText(`//tr[child::td[normalize-space()='${level}']]//td[4]`)),
      keep_threshold: parseInt(await this.page.innerText(`//tr[child::td[normalize-space()='${level}']]//td[5]`)),
      cycle: parseInt(await this.page.innerText(`//tr[child::td[normalize-space()='${level}']]//td[6]`)),
    };
  }

  /**
   * Get id of tier level in Tier list screen
   * @returns <array<string>> id of tier level
   */
  async getIdTierByLevelName(): Promise<number[]> {
    const ids = [];
    const number = await this.genLoc("//tbody/tr").count();
    for (let i = 1; i <= number; i++) {
      const id = parseInt(await this.page.innerText(`//tbody/tr[${i}]//td[1]`));
      ids.push(id);
    }
    return ids;
  }

  /**
   *  Get reward info of al tier levels in Edit tier screen
   * @returns <array<string>> reward info
   */
  async getRewardAllLevel(): Promise<string[]> {
    const hiveRewards = [];
    const ids = await this.getIdTierByLevelName();
    for (let i = 0; i < ids.length; i++) {
      await this.gotoEditTierScreen(ids[i]);
      const hiveReward = await this.getRewardInfo();
      hiveRewards.push(hiveReward);
    }
    return hiveRewards;
  }

  /**
   * Get level number in Tier list screen
   * @param level is level tier name
   * @returns <number> level number
   */
  async getLevelNumberByLevelName(level: string): Promise<number> {
    return parseInt(await this.page.innerText(`//tr[descendant::td[normalize-space()='${level}']]//td[2]`));
  }

  /**
   * Get config of a level in Tier list screen
   * @param level is the level number
   * @returns <object> config of a level
   */
  async getConfigByLevel(level: number): Promise<ConfigTier> {
    return {
      name: await this.page.innerText(`//tr[child::td[normalize-space()='${level}']]//td[3]`),
      threshold: parseInt(await this.page.innerText(`//tr[child::td[normalize-space()='${level}']]//td[4]`)),
      keep_threshold: parseInt(await this.page.innerText(`//tr[child::td[normalize-space()='${level}']]//td[5]`)),
      cycle: parseInt(await this.page.innerText(`//tr[child::td[normalize-space()='${level}']]//td[6]`)),
    };
  }

  /**
   * Get config of current level and next level in Tier list screen
   * @param userId is the user id
   * @returns <object> config of current level and next level
   */
  async getAllConfig(userId: string): Promise<AllConfig> {
    await this.goToUserDetail(userId);
    const levelName = await this.getTierLevel();
    await this.goto(`admin/tier/list`);
    const level = await this.getLevelNumberByLevelName(levelName);
    const curConfig = await this.getConfigByLevel(level);
    const number = await this.genLoc("//tr[td[contains(@class,'list-field')]]").count();
    const nextConfig = level == number ? await this.getConfigByLevel(level) : await this.getConfigByLevel(level + 1);
    return {
      level: level,
      cur_name: curConfig.name,
      cur_threshold: curConfig.threshold,
      cur_keep_threshold: curConfig.keep_threshold,
      cur_cycle: curConfig.cycle,
      next_name: nextConfig.name,
      next_threshold: nextConfig.threshold,
      next_keep_threshold: nextConfig.keep_threshold,
      next_cycle: nextConfig.cycle,
    };
  }

  /**
   * Get inputed value to change level (upgrade, keep or down current level)
   * @param isUpgrade has true = upgrade level
   * @param isKeep has true = keep current level
   * @param userId is the user id
   * @returns <number> star
   */
  async getStarToChangeLevel(isUpgrade: boolean, isKeep: boolean, userId: string) {
    let starInput = 0;
    await this.goToUserDetail(userId);
    const levelName = await this.getTierLevel();
    const tierStar = await this.getTierStar();
    await this.goto(`admin/tier/list`);
    const levelMax = await this.genLoc("//tr[td[contains(@class,'list-field')]]").count();
    const level = await this.getLevelNumberByLevelName(levelName);
    const configTier = await this.getAllConfig(userId);
    if (isUpgrade) {
      starInput =
        level < levelMax ? configTier.next_threshold - tierStar + 1 : configTier.next_keep_threshold - tierStar;
    } else if (isKeep) {
      if (level < levelMax && tierStar <= configTier.cur_keep_threshold) {
        starInput = Math.floor(Math.random() * 5 + (configTier.next_threshold - tierStar - 1));
      } else if (level == levelMax && tierStar > configTier.cur_keep_threshold) {
        starInput = Math.floor(Math.random() * 5 - (tierStar - configTier.cur_keep_threshold));
      }
    } else {
      starInput = tierStar;
    }
    return starInput;
  }

  /**
   * Call api to end current cycle
   * @param id is user id
   * @param start is the started time of cycle
   * @param end is the end time of cycle
   * @returns
   */
  async apiEndCycle(domain: string, id: number, start: number, end: number, accessToken: string) {
    const response = await this.page.request.get(
      `https://${domain}/admin/tiers/end-cycle.json` +
        `?user_id=${id}&from_time=${start}&to_time=${end}&access_token=${accessToken}`,
    );
    const jsonResponse = await response.json();
    return jsonResponse.success == true;
  }
}
