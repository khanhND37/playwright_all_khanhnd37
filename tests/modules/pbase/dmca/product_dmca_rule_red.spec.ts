import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { loadData } from "@core/conf/conf";
import { HiveDMCA, SearchPageDMCARequest } from "@pages/hive/hive_dmca";
import { OcgLogger } from "@core/logger";
import { BaseInput, DMCAScheduler } from "@pages/dashboard/dmca";
import { cloneDeep } from "@utils/object";
import { getMailinatorInstanceWithProxy } from "@utils/mail";

const logger = OcgLogger.get();
test.describe("Verify dmca printbase", () => {
  let printBasePage;
  let hiveDMCA;
  let mailinator;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildBaseInput = (baseData: any, conf: any): BaseInput => {
    const baseInput: BaseInput = {
      titles: [],
      key_search: "",
      handle_product_expect: [],
      folder_name: "",
      pre_deleted_email_subject: "",
    };

    baseInput.campaigns = baseData.campaigns;
    baseInput.key_search = baseInput.campaigns[0].pricing_info.title.split(" ")[0];
    baseInput.titles = baseInput.campaigns.map(x => x.pricing_info.title);
    baseInput.handle_product_expect = baseInput.campaigns.map(x => x.pricing_info.title.split(" ").join("-"));
    baseInput.pre_deleted_email_subject = conf.suiteConf.pre_deleted_email_subject;
    baseInput.folder_name = conf.suiteConf.folder_name;
    return baseInput;
  };

  test.beforeEach(async ({ dashboard, conf, hiveSBase, page }) => {
    test.setTimeout(conf.suiteConf.time_out);
    printBasePage = new PrintBasePage(dashboard, conf.suiteConf.domain);
    hiveDMCA = new HiveDMCA(hiveSBase, conf.suiteConf.hive_domain);
    mailinator = await getMailinatorInstanceWithProxy(page);
    await mailinator.accessMail(conf.suiteConf.mail_access);
  });

  const confData = loadData(__dirname, "DATA_DRIVEN_RED");
  confData.caseConf.data.forEach(baseData => {
    test(`@${baseData.case_id} ${baseData.description}`, async ({ conf, authRequest, scheduler }) => {
      const baseInput = buildBaseInput(baseData, conf);

      let scheduleData: DMCAScheduler;
      const rawDataJson = await scheduler.getData();
      if (rawDataJson) {
        scheduleData = rawDataJson as DMCAScheduler;
      } else {
        logger.info("Init default object");
        scheduleData = {
          is_waiting_send_mail: false,
          is_waiting_send_mail_scan: false,
          is_waiting_deleted: false,
          is_waiting_campaign_available: false,
          is_waiting_visible_hive: false,
          campaign_ids: [],
        };

        logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
      }

      await printBasePage.navigateToMenu("Campaigns");
      if (
        !scheduleData.is_waiting_deleted &&
        !scheduleData.is_waiting_campaign_available &&
        !scheduleData.is_waiting_send_mail_scan &&
        !scheduleData.is_waiting_send_mail &&
        !scheduleData.is_waiting_visible_hive
      ) {
        await printBasePage.searchWithKeyword(baseInput.key_search);
        await printBasePage.deleteAllCampaign(conf.suiteConf.password);
      }

      // request in hive
      const baseRequest: SearchPageDMCARequest = {
        title: baseInput.key_search,
        platforms: "printbase",
        page: "",
      };

      await test.step(`1.1. Click chọn base Unisex T-shirt > Click btn Add text > Click Continue > Input title > Click btn Launch1.2. Click chọn base Unisex Tank > Click btn Add text > Click Continue > Input title > Click btn Launch1.1. Click chọn base Laddie T-shirt > Click btn Add text > Click Continue > Input title > Click btn Launch`, async () => {
        if (
          scheduleData.is_waiting_deleted ||
          scheduleData.is_waiting_send_mail ||
          scheduleData.is_waiting_send_mail_scan ||
          scheduleData.is_waiting_visible_hive
        ) {
          return;
        }

        // create list campaign
        if (!scheduleData.is_waiting_campaign_available) {
          for (const baseCampaign of baseInput.campaigns) {
            await printBasePage.navigateToMenu("Catalog");
            const campaignId = await printBasePage.launchCamp(baseCampaign);
            scheduleData.campaign_ids.push(campaignId);
            await printBasePage.navigateToMenu("Campaigns");
          }
        }

        // check status list campaign
        const isAvailable = await printBasePage.verifyCampaignStatusByIds(
          authRequest,
          conf.suiteConf.domain,
          scheduleData.campaign_ids,
          "available",
        );
        if (!isAvailable) {
          if (scheduleData.is_waiting_campaign_available) {
            await scheduler.clear();
            await expect(isAvailable).toBeTruthy();
            return;
          }

          scheduleData.is_waiting_campaign_available = true;
          await scheduler.setData(scheduleData);
          await scheduler.schedule({ mode: "later", minutes: 5 });
          // eslint-disable-next-line playwright/no-skipped-test
          test.skip();
          return;
        }

        scheduleData.is_waiting_campaign_available = false;
        await scheduler.setData(scheduleData);
        await expect(isAvailable).toBeTruthy();
      });

      await test.step(`2. Vào hive sbase > Click vào tab TO violation review > Verify hiển thị campaigns  trong trang Search products`, async () => {
        if (
          scheduleData.is_waiting_deleted ||
          scheduleData.is_waiting_send_mail ||
          scheduleData.is_waiting_send_mail_scan
        ) {
          return;
        }

        const request = cloneDeep(baseRequest);
        request.page = "search";
        await hiveDMCA.navigateToPage(request);
        const isSuccess = await hiveDMCA.checkListProductExist(baseInput.titles, request.page);

        if (!isSuccess) {
          if (scheduleData.is_waiting_visible_hive) {
            await scheduler.clear();
            await expect(isSuccess).toBeTruthy();
            return;
          }

          scheduleData.is_waiting_visible_hive = true;
          await scheduler.setData(scheduleData);
          await scheduler.schedule({ mode: "later", minutes: 5 });
          // eslint-disable-next-line playwright/no-skipped-test
          test.skip();
          return;
        }

        scheduleData.is_waiting_visible_hive = false;
        await scheduler.setData(scheduleData);
        await expect(isSuccess).toBeTruthy();
      });

      await test.step(`3.Click vào tab Product moderation list verify product vi phạm dmca scan vào mod`, async () => {
        if (
          scheduleData.is_waiting_deleted ||
          scheduleData.is_waiting_send_mail ||
          scheduleData.is_waiting_send_mail_scan
        ) {
          return;
        }

        const request = cloneDeep(baseRequest);
        request.page = "moderation-list";
        await hiveDMCA.navigateToPage(request);
        const isSuccessPageModeration = await hiveDMCA.checkListProductExist(baseInput.titles, request.page);
        await expect(isSuccessPageModeration).toBeTruthy();
      });

      await test.step(`4. Verify gửi mail DMCA sau 15ph scan vào mod`, async () => {
        if (scheduleData.is_waiting_deleted || scheduleData.is_waiting_send_mail) {
          return;
        }

        // get subject email scan
        const request = cloneDeep(baseRequest);
        request.page = "moderation-list";
        request.title = baseInput.key_search;
        request.event_type = hiveDMCA.EventTypeVerification;
        const subjectMailScan = await hiveDMCA.getSubjectMail(
          request,
          baseInput.key_search,
          baseData.pre_scan_email_subject,
        );
        let isSentEmailScan = false;
        if (subjectMailScan) {
          isSentEmailScan = true;
        }

        // check sent email
        if (!isSentEmailScan) {
          if (scheduleData.is_waiting_send_mail_scan) {
            await scheduler.clear();
            await expect(isSentEmailScan).toBeTruthy();
            return;
          }

          scheduleData.is_waiting_send_mail_scan = true;
          await scheduler.setData(scheduleData);
          const minusScan = baseData.duration_scan_product * 60;
          await scheduler.schedule({ mode: "later", minutes: minusScan });
          // eslint-disable-next-line playwright/no-skipped-test
          test.skip();
          return;
        }

        scheduleData.is_waiting_send_mail_scan = false;
        await scheduler.setData(scheduleData);
        await expect(isSentEmailScan).toBeTruthy();

        // email sent , verify email
        const isCompletedScan = await hiveDMCA.verifyProductInsideMail(
          mailinator,
          subjectMailScan,
          baseInput.folder_name,
          baseInput.handle_product_expect,
        );
        expect(isCompletedScan).toBeTruthy();
      });

      await test.step(`5. Sau 12h hệ thống check lại các product vi phạm DMCA đã gửi mail trước đó`, async () => {
        // verify products deleted
        const isExistProduct = await printBasePage.isVisibleProductPb(baseInput.key_search);
        if (isExistProduct) {
          if (scheduleData.is_waiting_deleted) {
            await scheduler.clear();
            await expect(!isExistProduct).toBeTruthy();
            return;
          }

          scheduleData.is_waiting_deleted = true;
          await scheduler.setData(scheduleData);
          const minus = baseData.duration_delete_product * 60;
          await scheduler.schedule({ mode: "later", minutes: minus });
          // eslint-disable-next-line playwright/no-skipped-test
          test.skip();
          return;
        }

        scheduleData.is_waiting_deleted = false;
        await expect(!isExistProduct).toBeTruthy();

        // get subject email
        const request = cloneDeep(baseRequest);
        request.page = "moderation-list";
        request.mod_status = "done";
        const subjectMailDeleted = await hiveDMCA.getSubjectMail(
          request,
          baseInput.key_search,
          baseInput.pre_deleted_email_subject,
        );
        let isSentEmail = false;
        if (subjectMailDeleted) {
          isSentEmail = true;
        }

        // verify sent email
        if (!isSentEmail) {
          if (scheduleData.is_waiting_send_mail) {
            await scheduler.clear();
            await expect(isSentEmail).toBeTruthy();
            return;
          }

          scheduleData.is_waiting_send_mail = true;
          await scheduler.setData(scheduleData);
          await scheduler.schedule({ mode: "later", minutes: 5 });
          // eslint-disable-next-line playwright/no-skipped-test
          test.skip();
          return;
        }

        await scheduler.clear();
        await expect(isSentEmail).toBeTruthy();
        // email sent , verify email
        const isCompleted = await hiveDMCA.verifyProductInsideMail(
          mailinator,
          subjectMailDeleted,
          baseInput.folder_name,
          baseInput.handle_product_expect,
        );
        expect(isCompleted).toBeTruthy();
      });
    });
  });
});
