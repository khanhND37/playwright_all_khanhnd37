/* eslint-disable playwright/no-skipped-test */
import { test, expect } from "@core/fixtures";
import { TcScheduled01, TcScheduled01Config } from "./scheduler";
import { OcgLogger } from "@core/logger";

const logger = OcgLogger.get();

// In this test case, step 1 and step 3 need to wait
test.describe.serial("Demo fixture scheduler", async () => {
  // Must have "email_scheduler" in SuiteConf for this fixture to work
  test("Demo scheduled data @TS_SB_DEMO_02", async ({ cConf, scheduler }) => {
    const configData = cConf as TcScheduled01Config;
    let scheduleData: TcScheduled01;
    const rawDataJson = await scheduler.getData();

    if (rawDataJson) {
      scheduleData = rawDataJson as TcScheduled01;
    } else {
      logger.info("Init default object");
      scheduleData = {
        isStep1Done: false,
        isStep2Done: false,
        isStep3Done: false,

        step1Data: "",
        step2Data: false,
        step3Data: 0,
      };

      logger.info(`Current scheduled data: ${JSON.stringify(scheduleData)}`);
    }

    await test.step("Prepare/check data step 1", async () => {
      // Do something to get data
      let stepData;
      if (scheduleData.isStep1Done) {
        stepData = scheduleData.step1Data;
      } else {
        scheduleData.step1Data = configData.step1_data;
        scheduleData.isStep1Done = true;
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 3 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }

      // Do something with stepData
      logger.info(`Step 1 data got: ${JSON.stringify(stepData)}`);
    });

    await test.step("Prepare/check data step 2", async () => {
      let stepData;
      if (scheduleData.isStep2Done) {
        stepData = scheduleData.step2Data;
      } else {
        scheduleData.step2Data = configData.step2_data;
        scheduleData.isStep2Done = true;
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 3 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }

      // Do something with stepData

      logger.info(`Step 2 data got: ${JSON.stringify(stepData)}`);
    });

    await test.step("Prepare/check data step 3", async () => {
      let stepData;
      if (scheduleData.isStep3Done) {
        stepData = scheduleData.step3Data;
      } else {
        scheduleData.step3Data = configData.step3_data;
        scheduleData.isStep3Done = true;
        await scheduler.setData(scheduleData);
        await scheduler.schedule({ mode: "later", minutes: 3 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }

      // Do something with stepData
      logger.info(`Step 3 data got: ${JSON.stringify(stepData)}`);
    });

    await test.step("Do something after prepared steps", async () => {
      const allStepData = [];
      allStepData.push(scheduleData.step1Data);
      allStepData.push(scheduleData.step2Data);
      allStepData.push(scheduleData.step3Data);

      const expectedResult = configData.all_step_data;
      await scheduler.clear();

      expect(allStepData.join(" ")).toEqual(expectedResult);
    });
  });
});
