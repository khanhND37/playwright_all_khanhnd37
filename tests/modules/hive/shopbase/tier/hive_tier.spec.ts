import { expect, test } from "@core/fixtures";
import { addDays } from "@core/utils/datetime";
import { TierProgramPage } from "@pages/dashboard/tier";
import { TierByAPI } from "@pages/dashboard/tier_api";
import { HiveTier } from "@pages/hive/hive_tier";

test.describe("Verify tier in hive shopbase @TS_SB_PN_TP_UTIER_HIVE", async () => {
  let hiveTier: HiveTier;
  let tierPage: TierProgramPage;
  let tierAPI: TierByAPI;
  let accessToken: string;
  let tierStar: number;
  let needAddStar: number;
  let redeemStar: number;

  const formatDate = async (value: string | number | Date): Promise<string> => {
    const date = new Date(value).toLocaleDateString();
    return date;
  };

  test.beforeEach(async ({ hiveSBase, dashboard, conf, token, authRequest }) => {
    const tokenObject = await token.getWithCredentials({
      domain: conf.caseConf.shop_name,
      username: conf.caseConf.username,
      password: conf.caseConf.password,
    });
    accessToken = tokenObject.access_token;
    tierPage = new TierProgramPage(dashboard, conf.caseConf.domain);
    tierAPI = new TierByAPI(conf.caseConf.domain, authRequest);
    hiveTier = new HiveTier(hiveSBase, conf.suiteConf.hive_domain);
  });

  test("Verify edit tier successfully @SB_PN_TP_UTIER_HIVE_28", async ({ hiveSBase, conf }) => {
    await test.step(
      "Verify update tier level cho user " + "sau khi edit tier(edit threshold <= tier star của user) thành công",
      async () => {
        // create pre-condition: user đạt level 1(Newbie)
        const result = await tierAPI.getTierDetailByAPI();
        const configTier = await hiveTier.getAllConfig(conf.caseConf.user_id);

        await hiveTier.goToUserDetail(conf.caseConf.user_id);
        if (configTier.level > 1 || (await hiveTier.getTierStar()) > configTier.next_threshold) {
          await hiveTier.inputStar(-(await hiveTier.getTierStar()), conf.caseConf.label_tier);
          const date = new Date((parseInt(await formatDate(Date.now())) / 1000).toString());
          await hiveTier.apiEndCycle(
            conf.caseConf.domain,
            conf.caseConf.user_id,
            result.data.user_tier.cycle_start_at,
            date.getTime(),
            accessToken,
          );
          await hiveSBase.waitForTimeout(conf.caseConf.time_out);
          await hiveSBase.reload();
          const newLevel = await hiveTier.getTierLevel();
          expect(newLevel).toEqual(conf.caseConf.level_1);
        }

        const newConfig = await hiveTier.getAllConfig(conf.caseConf.user_id);
        await hiveTier.goToUserDetail(conf.caseConf.user_id);
        await hiveTier.inputStar(
          newConfig.next_threshold - ((await hiveTier.getTierStar()) + 1),
          conf.caseConf.label_tier,
        );
        await hiveSBase.reload();
        tierStar = await hiveTier.getTierStar();
        // Edit threshold <= tier star của user
        await hiveTier.gotoEditTierScreen(newConfig.level + 1);
        await hiveTier
          .genLoc("//div[child::label[normalize-space()='Threshold']]//input")
          .fill((tierStar - 1).toString());
        await hiveTier.genLoc("//button[@name='btn_update_and_edit']").click();

        await hiveSBase.waitForTimeout(conf.caseConf.time_out1);
        const result2 = await tierAPI.getTierDetailByAPI();
        // verify user tăng hạng tier
        expect(result2.data.user_tier.tier_level).toEqual(newConfig.level + 1);
        // verify tier star không đổi
        expect(result2.data.user_tier.rank_coin).toEqual(tierStar);
      },
    );

    await hiveTier.gotoEditTierScreen(conf.caseConf.level);
    // validate Tier
    for (let i = 0; i < conf.caseConf.tiers.length; i++) {
      await test.step("Nhập thông tin các trường với case như trong file data > click btn Update", async () => {
        await hiveTier.inputTier(conf.caseConf.tiers[i]);
        expect(await hiveTier.getMessage()).toContain("has been successfully updated.");
      });
    }

    //validate Tier Rewards
    for (let i = 0; i < conf.caseConf.tier_rewards.length; i++) {
      await test.step("Nhập thông tin các trường với case như trong file data > click btn Update", async () => {
        await hiveTier.inputReward(conf.caseConf.tier_rewards[i]);
        const actualMsg = await hiveTier.getMessage();
        expect(actualMsg).toContain("has been successfully updated.");
      });
    }
  });

  test("Verify edit tier unsuccessfully @SB_PN_TP_UTIER_HIVE_29", async ({ hiveSBase, conf }) => {
    await hiveTier.gotoEditTierScreen(conf.caseConf.level);

    // validate Tier
    for (let i = 0; i < conf.caseConf.tiers.length; i++) {
      await test.step("Nhập thông tin các trường với case như trong file data > click btn Update", async () => {
        await hiveTier.inputTier(conf.caseConf.tiers[i]);
        const actualMsg = await hiveTier.getMessage();
        expect(actualMsg).toEqual(conf.caseConf.tiers[i].message);
      });
    }

    //validate Tier Rewards
    for (let i = 0; i < conf.caseConf.tier_rewards.length - 1; i++) {
      await test.step("Nhập thông tin các trường với case như trong file data > click btn Update", async () => {
        await hiveTier.inputReward(conf.caseConf.tier_rewards[i]);
        const actualMsg = await hiveTier.getMessage();
        expect(actualMsg).toEqual(conf.caseConf.tier_rewards[i].message);
      });
    }

    await test.step("Click btn Add another reward", async () => {
      hiveSBase.on("dialog", async dialog => {
        expect(dialog.message()).toContain(conf.caseConf.tier_rewards[conf.caseConf.tier_rewards.length - 1].message);
        await dialog.dismiss();
      });
      await hiveSBase.locator("//button[@class='btn btn-primary add-new-reward-row']").click();
    });
  });

  test("Check user lên hạng tier thành công @SB_PN_TP_UTIER_HIVE_30", async ({ dashboard, conf }) => {
    await tierPage.gotoTierPage();
    //get level number by level name
    const configTier = await hiveTier.getAllConfig(conf.caseConf.user_id);
    await test.step("Nhập Tier star >= Threshold của next tier > Click Update", async () => {
      needAddStar = await hiveTier.getStarToChangeLevel(
        conf.caseConf.is_upgrade,
        conf.caseConf.is_keep,
        conf.caseConf.user_id,
      );
      //get tierstar, redeemstar before edit user
      await hiveTier.goToUserDetail(conf.caseConf.user_id);
      tierStar = await hiveTier.getTierStar();
      redeemStar = await hiveTier.getRedeemStar();
      //get tierstars to add
      await hiveTier.inputStar(needAddStar, conf.caseConf.label_tier);
      const newTier = await hiveTier.getTierStar();
      const newRedeem = await hiveTier.getRedeemStar();
      const newLevel = await hiveTier.getTierLevel();
      //verify tierstar,redeemstar, level name  after edit user
      expect(newTier).toEqual(tierStar + needAddStar);
      expect(newRedeem).toEqual(redeemStar);
      expect(newLevel).toEqual(configTier.next_name);
    });
    await dashboard.reload();
    if (configTier.level < conf.caseConf.level_max) {
      await test.step("Đăng nhập vào dashboard shop PB> Click menu Checkout Printbase tier program", async () => {
        //verify upgrade level popup
        expect(await tierPage.getUpgradeTierContent()).toEqual(
          expect.objectContaining({
            title: conf.caseConf.upgrade_popup.title,
            level: `You reached level ${configTier.level + 1}: ${configTier.next_name}`,
            btn_view: conf.caseConf.upgrade_popup.status_btn_view,
          }),
        );
      });

      await test.step("Click btn View Tier", async () => {
        await tierPage.clickBtnViewTier();
        const newLevel = await tierPage.getTierName();
        const newTier = await tierPage.getTierStars();
        const newRedeem = await tierPage.getRedeemStars();
        const result = await tierAPI.getTierDetailByAPI();
        //verify new tier level name, new tierstar, new redeemstar, new start cycle,new end cycle after upgrade level
        expect(newLevel).toEqual(configTier.next_name);
        expect(newTier).toEqual(tierStar + needAddStar);
        expect(newRedeem).toEqual(redeemStar);
        expect(await formatDate(result.data.user_tier.cycle_start_at * 1000)).toEqual(await formatDate(Date.now()));
        expect(await formatDate(result.data.user_tier.cycle_end_at * 1000)).toEqual(
          await formatDate(addDays(configTier.next_cycle + 1)),
        );
      });
    }
  });
  test("Check user giữ nguyên hạng tier thành công @SB_PN_TP_UTIER_HIVE_31", async ({ hiveSBase, dashboard, conf }) => {
    await tierPage.gotoTierPage();
    const result = await tierAPI.getTierDetailByAPI();
    //get level number by level name
    const configTier = await hiveTier.getAllConfig(conf.caseConf.user_id);
    await test.step("Kết thúc cycle, sửa Tier star > click Update", async () => {
      //get tierstars to add: Threshold giữ hạng (cùng tier) < tier < Threshold của next tier
      needAddStar = await hiveTier.getStarToChangeLevel(
        conf.caseConf.is_upgrade,
        conf.caseConf.is_keep,
        conf.caseConf.user_id,
      );
      await hiveTier.goToUserDetail(conf.caseConf.user_id);
      //get tierstar,redeemstar before edit user
      tierStar = await hiveTier.getTierStar();
      redeemStar = await hiveTier.getRedeemStar();
      if (needAddStar) {
        await hiveTier.inputStar(needAddStar, conf.caseConf.label_tier);
        expect(await hiveTier.getTierStar()).toEqual(tierStar + needAddStar);
      }

      const date = new Date((parseInt(await formatDate(Date.now())) / 1000).toString());
      await hiveTier.apiEndCycle(
        conf.caseConf.domain,
        conf.caseConf.user_id,
        result.data.user_tier.cycle_start_at,
        date.getTime(),
        accessToken,
      );
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await hiveSBase.waitForTimeout(conf.caseConf.time_out);
      await hiveSBase.reload();
      const newLevel = await hiveTier.getTierLevel();
      const newTier = await hiveTier.getTierStar();
      const newRedeem = await hiveTier.getRedeemStar();

      //verify tierstar,redeemstar,level name after edit user
      expect(newTier).toEqual(configTier.cur_threshold);
      expect(newRedeem).toEqual(redeemStar);
      expect(newLevel).toEqual(configTier.cur_name);
    });

    await test.step("Đăng nhập vào dashboard shop PB>Click menu Checkout Printbase tier program", async () => {
      await dashboard.reload();
      const newLevel = await tierPage.getTierName();
      const newTier = await tierPage.getTierStars();
      const newRedeem = await tierPage.getRedeemStars();
      const result = await tierAPI.getTierDetailByAPI();
      //verify new tier level name, new tierstar, new redeemstar,new start cycle,new end cycle after upgrade level
      expect(newLevel).toEqual(configTier.cur_name);
      expect(newTier).toEqual(configTier.cur_threshold);
      expect(newRedeem).toEqual(redeemStar);
      expect(await formatDate(result.data.user_tier.cycle_start_at * 1000)).toEqual(
        await formatDate((Date.now() / 1000) * 1000),
      );
      expect(await formatDate(result.data.user_tier.cycle_end_at * 1000)).toEqual(
        await formatDate(addDays(configTier.cur_cycle + 1)),
      );
    });
  });

  test("Check user bị xuống hạng tier thành công @SB_PN_TP_UTIER_HIVE_32", async ({ hiveSBase, dashboard, conf }) => {
    await tierPage.gotoTierPage();

    await test.step("Kết thúc cycle, nhập Tier star < Threshold giữ hạng (cùng tier)", async () => {
      await hiveTier.goToUserDetail(conf.caseConf.user_id);
      //get tierstar, redeemstar before edit user
      tierStar = await hiveTier.getTierStar();
      redeemStar = await hiveTier.getRedeemStar();
      //get tierstars to add
      await hiveTier.inputStar(-tierStar, conf.caseConf.label_tier);
      const result = await tierAPI.getTierDetailByAPI();
      const date = new Date((parseInt(await formatDate(Date.now())) / 1000).toString());
      await hiveTier.apiEndCycle(
        conf.caseConf.domain,
        conf.caseConf.user_id,
        result.data.user_tier.cycle_start_at,
        date.getTime(),
        accessToken,
      );
      await hiveSBase.waitForTimeout(conf.caseConf.time_out);
      await hiveSBase.reload();
      const newLevel = await hiveTier.getTierLevel();
      const newTier = await hiveTier.getTierStar();
      const newRedeem = await hiveTier.getRedeemStar();

      //verify tierstar,redeemstar ,level name after edit user
      expect(newTier).toEqual(0);
      expect(newRedeem).toEqual(redeemStar);
      expect(newLevel).toEqual(conf.caseConf.level);
    });

    await test.step("Đăng nhập vào dashboard shop PB>Click menu Checkout Printbase tier program", async () => {
      await dashboard.reload();
      const newLevel = await tierPage.getTierName();
      const newTier = await tierPage.getTierStars();
      const newRedeem = await tierPage.getRedeemStars();
      const result = await tierAPI.getTierDetailByAPI();
      //verify new tier level name, new tierstar, new redeemstar,new start cycle,new end cycle after upgrade level
      expect(newLevel).toEqual(conf.caseConf.level);
      expect(newTier).toEqual(0);
      expect(newRedeem).toEqual(redeemStar);
      expect(await formatDate(result.data.user_tier.cycle_start_at * 1000)).toEqual(
        await formatDate((Date.now() / 1000) * 1000),
      );
      expect(await formatDate(result.data.user_tier.cycle_end_at * 1000)).toEqual(
        await formatDate(addDays(result.data.updated_all_tier_data.list[0].cycle + 1)),
      );
    });
  });
});
