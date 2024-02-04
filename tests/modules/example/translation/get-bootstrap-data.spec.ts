import { OcgLogger } from "@core/logger";
import { getTranslationDataFromBootstrap } from "@core/utils/translation";
import { test } from "@fixtures/website_builder";

const logger = OcgLogger.get();

test.describe("Verify API ", () => {
  test(`@SB_SET_TL_DEMO Demmo get translation data from bootstrap`, async ({ authRequest }) => {
    await test.step(`Demo step`, async () => {
      const data = await getTranslationDataFromBootstrap("hiendo-newecom.myshopbase.net", authRequest, {
        localeCode: "de",
      });

      logger.info(JSON.stringify(data, null, 2));
    });

    return;
  });
});
