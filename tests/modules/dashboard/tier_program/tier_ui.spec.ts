import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { TierProgramPage } from "@pages/dashboard/tier";
import { HiveTier } from "@pages/hive/hive_tier";
import type { MessageEarnMore, PercentageCompleted } from "@types";

test.describe("Tier program UI", async () => {
  const conf = loadData(__dirname, "DATA_DRIVEN");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const caseData = conf.caseConf.data[i];
    test(`Check UI màn Printbase tier với hạng ${caseData.level_name} @${caseData.testcase_id}`, async ({
      page,
      hiveSBase,
      context,
      token,
    }) => {
      let msgEarn: MessageEarnMore;
      let complete: PercentageCompleted;
      const tierPage = new TierProgramPage(page, caseData.domain);
      const hiveTier = new HiveTier(hiveSBase, conf.suiteConf.hive_domain);

      const tokenObject = await token.getWithCredentials({
        domain: caseData.domain,
        username: caseData.username,
        password: caseData.password,
      });
      const accessToken = tokenObject.access_token;

      await hiveTier.goto(`admin/tier/list`);
      //get config of current tier
      const configTier = await hiveTier.getTierInfoByLevelName(caseData.level_name);
      //get config of next tier
      const configNextTier = await hiveTier.getTierInfoByLevelName(caseData.next_level);
      //get config reward of current tier
      const hiveReward = await hiveTier.getRewardAllLevel();

      //go to tier program in Dashboard
      await tierPage.login({
        userId: caseData.user_id,
        shopId: caseData.shop_id,
        email: caseData.username,
        password: caseData.password,
      });
      await page.waitForSelector(".nav-sidebar");
      await tierPage.gotoTierPage();
      const result = await tierPage.getTierAPIByToken(accessToken);

      await test.step("Check hiển thị data Phần Tier banner", async () => {
        //verify current tier name
        expect(await tierPage.getTierName()).toEqual(caseData.level_name);
        //verify tier stars
        expect(await tierPage.getTierStars()).toEqual(result.data.user_tier.rank_coin ?? 0);
        //verify data of progress bar
        complete = {
          isLevelMax: caseData.is_level_max,
          curTier: await tierPage.getTierStars(),
          keepThreshold: configTier.keep_threshold,
          thresholdNext: configNextTier.threshold,
        };
        expect(await tierPage.getProgressBarInfo(caseData.is_level_max)).toEqual(
          expect.objectContaining({
            pecentageComplete: await tierPage.formualPercentageCompleted(complete),
            tooltip: await tierPage.createTooltipOnProgressBar(
              caseData.is_level_max,
              configTier.keep_threshold,
              await tierPage.differenceDay(configTier.cycle, result.data.user_tier.cycle_start_at),
            ),
            nextTier: caseData.next_level,
          }),
        );
        //verify message earn more to reach to next tier
        msgEarn = {
          isLevelMax: caseData.is_level_max,
          levelMax: caseData.level_name,
          curStar: await tierPage.getTierStars(),
          thresholdNext: configNextTier.threshold,
          keepThreshold: configTier.keep_threshold,
          differenceDay: await tierPage.differenceDay(configTier.cycle, result.data.user_tier.cycle_start_at),
        };
        expect(await tierPage.getMessageEarnMore()).toEqual(await tierPage.messageEarnMore(msgEarn));
      });

      await test.step("Check hiển thị data Phần Your Benefits", async () => {
        expect(await tierPage.getActiveBenefits()).toEqual(caseData.active_benefit);
      });

      await test.step("Check hiển thị data Phần Redeemable Stars", async () => {
        //verify redeem stars
        expect(await tierPage.getRedeemStars()).toEqual(result.data.user_tier.available_coin ?? 0);
        //verify reward list
        expect(await tierPage.getRewardInfo()).toEqual(hiveReward[i]);
      });

      await test.step("Check hiển thị data Phần How to work?", async () => {
        expect(await tierPage.getHowToWorkContent()).toEqual(caseData.how_to_work);
      });

      await test.step("Check hiển thị data Phần Explore other Tier Benefits ", async () => {
        //verify display text 'Current Tier'
        expect(await tierPage.verifyCurrentTierInExploreBenefit(caseData.level, caseData.level_name)).toEqual(true);
        //verify benefit by tier level
        expect(await tierPage.getBenefitAllLevel()).toEqual(caseData.other_benefit);
        //verify reward infos
        expect(await tierPage.getRewardAllLevel()).toEqual(hiveReward);
        //verify status active of reward's current level
        expect(await tierPage.verifyActivedReward(caseData.level, caseData.img_lock)).toEqual(true);
      });

      await test.step("Check hiển thị data Phần Learn more about", async () => {
        const [printbasePage] = await Promise.all([
          context.waitForEvent("page"),
          await page.locator(`//a[normalize-space()='PrintBase Tier Program']`).click(),
        ]);
        expect(printbasePage.url()).toContain(caseData.link_learn_more);
        await printbasePage.close();
      });
    });
  }
});
