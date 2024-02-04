import type {
  BenefitAllLevel,
  HowToWorkContents,
  MessageEarnMore,
  PercentageCompleted,
  ProductRefund,
  ProgressBarInfo,
  ShortProductCheckoutInfo,
  UpgradeTierContent,
} from "@types";
import { differenceInDays } from "@core/utils/datetime";
import { DashboardPage } from "./dashboard";
import { expect } from "@playwright/test";

export class TierProgramPage extends DashboardPage {
  /**
   * go to tier program by url
   */
  async gotoTierPage() {
    await this.page.goto(`https://${this.domain}/admin/tier-program`);
  }

  /**
   * go to tier program by manual click
   * @param domain is store name
   */
  async gotoDashboardTier(domain: string) {
    await this.page.locator(`//p[@class='text-truncate font-12' and normalize-space()='${domain}']`).click();
    await this.page
      .locator("//div[@class='s-dropdown-content']//div[normalize-space()='Check out PrintBase Tier program']")
      .click();
  }

  /**
   * get tier level name in dashboard
   * @return <string> tier level name
   */
  async getTierName(): Promise<string> {
    const levelName = await this.getTextContent("//span[contains(@class,'tier-name-update')]");
    return levelName;
  }

  /**
   * get tier stars in dashboard
   * @return <number> tier stars
   */
  async getTierStars(): Promise<number> {
    const tierStars = await this.getTextContent("//p[@class='current-rank-point current-rank-point-update']/b");
    return parseFloat(tierStars.replace(/,/g, ""));
  }

  /**
   * get redeem stars in dashboard
   * @return <number> redeem stars
   */
  async getRedeemStars(): Promise<number> {
    const redeemStars = await this.getTextContent("//p[@class='reward-remain-star-txt']");
    return parseFloat(redeemStars.replace(/,/g, ""));
  }

  /**
   * formual of New stars after check out
   * @param stars is user's stars before checkout
   * @param products is product info
   * @param rateSilver is rate when user buy a product Silverbase
   * @param rateGold is rate when user buy a product Goldbase
   * @return <number> new stars
   */
  async formualStarsAfterCheckout(
    stars: number,
    products: Array<ShortProductCheckoutInfo>,
    rateSilver: number,
    rateGold: number,
  ): Promise<number> {
    let newStars = stars;
    for (const product of products) {
      if (product.type == "silver") {
        newStars += parseFloat(product.quantity) * rateSilver;
      } else {
        newStars += parseFloat(product.quantity) * rateGold;
      }
    }
    return newStars;
  }

  /**
   * formual of New stars after refund
   * @param stars is user's stars before refund/ cancel
   * @param products is product info
   * @param rateSilver is rate when user refund/cancel a product Silverbase
   * @param rateGold is rate when user refund/cancel a product Goldbase
   * @return <number> new stars
   */
  async formualStarsAfterRefund(
    stars: number,
    productRefund: ProductRefund[],
    rateSilver: number,
    rateGold: number,
  ): Promise<number> {
    let newStars = stars;
    for (const product of productRefund) {
      if (product.type == "silver") {
        newStars -= parseFloat(product.quantity) * rateSilver;
      } else {
        newStars -= parseFloat(product.quantity) * rateGold;
      }
    }
    return newStars;
  }

  /**
   *get active reward list: reward price < redeem stars
   *@param redeemStar
   *@return <array<string>> reward list
   */
  async getRewardActive(redeemStar: number): Promise<string[]> {
    const rewardlist = await this.page.locator("//div[@class='row reward-row']/div").count();
    const statusBtnObject = [];
    for (let index = 0; index < rewardlist; index++) {
      const priceReward = await this.getTextContent(
        "(//div[@class='reward-column s-flex flex-row'])[" + (index + 1) + "]//p[@class='pricing-star-value']",
      );

      if (parseFloat(priceReward.replaceAll(",", "")) < redeemStar) {
        statusBtnObject.push(priceReward);
      }
    }
    return statusBtnObject;
  }

  /**
   * get reward price in dashboard
   * @return <string> star of a reward
   */
  async getRewardPrice(): Promise<string> {
    const rewardPrice = await this.getTextContent(
      "(//div[@class='reward-column s-flex flex-row'])[1]//p[@class='pricing-star-value']",
    );
    return rewardPrice.replaceAll(",", "");
  }

  /**
   * get reward name in dashboard
   * @return <string> value of a reward
   */
  async getRewardName(): Promise<string> {
    const rewardName = await this.getTextContent(
      "(//div[@class='reward-column s-flex flex-row'])[1]//p[@class='pricing-cash-value']",
    );
    const rewardNames = rewardName.split(" (USD)").toString();
    return rewardNames.replaceAll(",", "");
  }

  /**
   *get description in Popup Cofirm Redeem
   *@return <string> description
   */
  async getPopupCofirmRedeemInfo(): Promise<string> {
    const msgCost = await this.getTextContent("//div[@class='s-modal is-active']//div[@class='s-modal-body']//h4");
    return msgCost;
  }

  /**
   * click btn Confirm to redeem reward
   */
  async clickBtnConfirm() {
    await this.page.locator("//span[normalize-space()='Confirm']").click();
  }

  /**
   *get actual balance of redeemed invoice
   *@return <string> balance
   */
  async getBalanceAfterRedeem(): Promise<string> {
    await this.page.locator("//span[normalize-space()='See your balance']").click();
    const amount = (await this.getTextContent("//tbody//tr//td//span[contains(text(),'$')]")).replaceAll(",", "");
    return amount.split(".", 1).toString();
  }

  /**
  /*Get content of upgrade tier popup
   * @returns <UpgradeTierContent> = {title, level, btn_view}
   */
  async getUpgradeTierContent(): Promise<UpgradeTierContent> {
    return {
      title: await this.page.innerText("//h4[@class='s-modal-title']"),
      level: await this.page.innerText("//p[@class='new-tier-name s-mb16']"),
      btn_view: await this.genLoc("//div[@class='s-modal-footer']//button").isEnabled(),
    };
  }

  /**
   * Click btn View tier
   */
  async clickBtnViewTier() {
    await this.genLoc("//div[@class='s-modal-footer']//button").click();
  }

  /**
   * Get Progress bar info
   * @param isLevelMax true: current level = level max; false: current level < level max
   * @returns <ProgressBarInfo> Progressbar info = {pecentageComplete, tooltip, nextTier}
   */
  async getProgressBarInfo(isLevelMax: boolean): Promise<ProgressBarInfo> {
    const rawPercentage = (await this.page.getAttribute("//div[@class='processing-complete']", "style")).substring(
      7,
      14,
    );
    const percentage = parseFloat(rawPercentage).toFixed(2);
    let tooltip = "";
    if (!isLevelMax) {
      tooltip = await this.page.getAttribute("//span[contains(@class,'tooltip-benefit-info')]", "data-label");
    }
    const nextTier = await this.page.innerText("//span[@class='next-tier-name']");
    return {
      pecentageComplete: percentage,
      tooltip: tooltip,
      nextTier: nextTier,
    };
  }

  /**
   * Get user's active benefits (Your benefits)
   * @returns <string> active benefits
   */
  async getActiveBenefits(): Promise<string> {
    const benefits = [];
    const number = await this.genLoc("//div[@class='benefit-info']//div[contains(@class,'benefit-active')]").count();
    for (let i = 1; i <= number; i++) {
      const benefit = (
        await this.page.innerText(`//div[@class='benefit-info']//div[contains(@class,'benefit-active')][${i}]//p`)
      ).replaceAll("\n", ",");
      benefits.push(benefit);
    }
    return benefits.toString();
  }

  /**
   * Get message earn more X star to reach next Tier or keep level
   * @returns <string> message earn more X star
   */
  async getMessageEarnMore(): Promise<string> {
    return (await this.page.innerText("//p[contains(@class,'notice-text')]")).replaceAll("\n", " ");
  }

  /**
   * Get rewards info in block Redeemable stars
   * @returns <string> reward info
   */
  async getRewardInfo(): Promise<string> {
    const rewardInfos = [];
    const number = await this.genLoc("//div[@class='row reward-row']/div").count();
    for (let i = 1; i <= number; i++) {
      const rewardInfo = {
        star: await this.page.innerText(`(//p[@class='pricing-star-value'])[${i}]`),
        value: await this.page.innerText(`(//p[@class='pricing-cash-value'])[${i}]`),
      };
      rewardInfos.push(rewardInfo);
    }
    return JSON.stringify(rewardInfos);
  }

  /**
   * Get content of block "how to work"
   * @returns <HowToWorkContents> contents = [{title, content}, ...]
   */
  async getHowToWorkContent(): Promise<HowToWorkContents> {
    const contents = [];
    const number = await this.genLoc("//div[@class='how-it-work-item']").count();
    for (let i = 1; i <= number; i++) {
      const content = {
        title: await this.page.innerText(`(//h4[contains(@class,'title-txt')])[${i}]`),
        content: await this.page.innerText(`(//p[@class='content-txt'])[${i}]`),
      };
      contents.push(content);
    }
    return contents;
  }

  /**
   * Verify display text 'Current Tier' in block Explore tier benefit
   * @param level is the current level
   * @param curLevel is the current level name
   * @returns <boolean>
   */
  async verifyCurrentTierInExploreBenefit(level: number, curLevel: string): Promise<boolean> {
    let isCurTier = false;
    const value = await this.page.innerText(`//div[contains(@class,'benefit-updated')]//li[${level}]//p[1]`);
    if (value == curLevel) {
      isCurTier = await this.genLoc(`//p[normalize-space()='Current Tier']`).isVisible();
    }
    return isCurTier;
  }

  /**
   * Get level's active benefits
   * @param level is the tier level
   * @returns <string> active benefits
   */
  async getActiveBenefitInOtherBenefits(level: number): Promise<string> {
    const activeBenefits = [];
    const number = await this.genLoc(
      `(//div[@class='pagination-benefit'])[${level}]//div[contains(@class,'benefit-active')]//p`,
    ).count();
    for (let i = 1; i <= number; i++) {
      const activeBenefit = (
        await this.page.innerText(
          `((//div[@class='pagination-benefit'])[${level}]//div[contains(@class,'benefit-active')]//p)[${i}]`,
        )
      ).replaceAll("/n", ",");
      activeBenefits.push(activeBenefit);
    }
    return activeBenefits.toString();
  }

  /**
   * Get other benefits by tier level
   * @param level is the tier level
   * @returns <string> other benefits by tier level
   */
  async getOtherBenefits(level: number): Promise<string> {
    const benefits = [];
    const number = await this.genLoc(`(//div[@class='pagination-benefit'])[${level}]//p`).count();
    for (let i = 1; i <= number; i++) {
      const benefit = (
        await this.page.innerText(`((//div[@class='pagination-benefit'])[${level}]//p)[${i}]`)
      ).replaceAll("\n", ",");

      benefits.push(benefit);
    }
    return benefits.toString();
  }

  /**
   * Get all benefit and active benefit of all level
   * @returns <BenefitByLevel[]> benefit info = [{benefit:...,active:...}]
   */
  async getBenefitAllLevel(): Promise<BenefitAllLevel> {
    const benefitInfos = [];
    const number = await this.genLoc("//div[contains(@class,'benefit-updated')]//li").count();
    for (let i = 1; i <= number; i++) {
      const benefitInfo = {
        benefit: await this.getOtherBenefits(i),
        active: await this.getActiveBenefitInOtherBenefits(i),
      };
      benefitInfos.push(benefitInfo);
    }
    return benefitInfos;
  }

  /**
   * Verify status active of reward's current level
   * @param level is the current level
   * @param imgLock is the link of icon-lock
   * @returns <boolean> status active of reward's current level
   */
  async verifyActivedReward(level: number, imgLock: string): Promise<boolean> {
    const image = (
      await this.page.getAttribute(
        `((//div[@class='col-md-7 all-reward-list'])[${level}]//div[contains(@class,'item-star')]/img)[1]`,
        "src",
      )
    ).split("/img/", 2)[1];
    const isActive = image !== imgLock;
    return isActive;
  }

  /**
   * Get reward info of a tier level in block Explore benefits
   * @param level is the tier level
   * @returns <string> reward info
   */
  async getRewardOfLevel(level: number): Promise<string> {
    const rewards = [];
    const number = await this.genLoc(
      `(//div[@class='row all-reward-list-wrapper'])[${level}]/div[contains(@class,'reward-item')]`,
    ).count();
    for (let i = 1; i <= number; i++) {
      const rewardInfo = {
        star: await this.page.innerText(
          `((//div[@class='col-md-7 all-reward-list'])[${level}]//div[contains(@class,'item-star')]/p)[${i}]`,
        ),
        value: (
          await this.page.innerText(
            `((//div[@class='col-md-7 all-reward-list'])[${level}]//div[@class='reward-item-txt']/p)[${i}]`,
          )
        )
          .replaceAll("\n", "")
          .trim(),
      };
      rewards.push(rewardInfo);
    }
    return JSON.stringify(rewards);
  }

  /**
   * Get reward info of all tier levels in block Explore benefits
   * @returns <array<string>> reward info
   */
  async getRewardAllLevel(): Promise<string[]> {
    const rewardInfos = [];
    const number = await this.genLoc("//div[contains(@class,'benefit-updated')]//li").count();
    for (let i = 1; i <= number; i++) {
      const rewardInfo = await this.getRewardOfLevel(i);
      rewardInfos.push(rewardInfo);
    }
    return rewardInfos;
  }

  /**
   * Formula to calculate completion rate to increase rank
   * @param data <PercentageCompleted>
   * @returns <string> completion rate
   */
  async formualPercentageCompleted(data: PercentageCompleted): Promise<string> {
    const pecentageComplete = data.isLevelMax
      ? ((data.curTier / data.keepThreshold) * 100).toFixed(2)
      : ((data.curTier / data.thresholdNext) * 100).toFixed(2);

    if (parseFloat(pecentageComplete) > 100) {
      return "100.00";
    } else {
      return pecentageComplete;
    }
  }

  /**
   * Get the remaining days of the cycle from today
   * @param cycle is cycle of level
   * @param startDate is the started date level
   * @returns <number> remaining days
   */
  async differenceDay(cycle: number, startDate: number): Promise<number> {
    const today = new Date();
    const start = new Date(startDate * 1000);
    const differenceDay = cycle - differenceInDays(today.toLocaleDateString(), start.toLocaleDateString());
    return differenceDay;
  }

  /**
   * Create message earn more X stars to to reach next Tier/ to stay level max
   * @param data <MessageEarnMore>
   * @returns <string> message
   */
  async messageEarnMore(data: MessageEarnMore): Promise<string> {
    if (data.isLevelMax && data.curStar >= data.keepThreshold) {
      return (
        `Congratulations, you've reached the highest tier, ` +
        `keep stars larger than ${data.keepThreshold.toLocaleString()} to stay`
      );
    } else if (data.isLevelMax && data.curStar < data.keepThreshold) {
      return `Earn ${(data.keepThreshold - data.curStar).toLocaleString()} Stars more within ${
        data.differenceDay
      } days to stay ${data.levelMax}`;
    } else {
      return `Earn ${(data.thresholdNext - data.curStar).toLocaleString()} Stars more within ${
        data.differenceDay
      } days to reach next Tier`;
    }
  }

  /**
   * Create tooltip message earn more X stars to keep current level(if level < level max)
   * @param isLevelMax determine level which is max level
   * @param keepThreshold is keep threshold of current tier
   * @param differenceDay is remaining days of the current cycle
   * @returns <string> message
   */
  async createTooltipOnProgressBar(isLevelMax: boolean, keepThreshold: number, differenceDay: number): Promise<string> {
    const msg = isLevelMax
      ? ""
      : `Earn minimum ${keepThreshold.toLocaleString()} ` +
        `Stars within ${differenceDay} days to keep your current Tier benefits.`;
    return msg;
  }

  /**
   * get user tier info by API
   * @returns <json>
   */
  async getTierAPIByToken(accessToken: string) {
    const response = await this.page.request.get(
      `https://${this.domain}/admin/tiers/synthetic.json?access_token=${accessToken}`,
    );
    expect(response.status()).toBe(200);
    return await response.json();
  }
}
