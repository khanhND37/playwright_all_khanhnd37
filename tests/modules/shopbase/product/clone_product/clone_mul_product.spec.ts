import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { snapshotDir } from "@utils/theme";
import type { Shop } from "@types";
import { SchedulerCloneProduct } from "./clone_product_sbase_to_sbase";

test.describe("Clone product from shopbase to shopbase", () => {
  let dashboardSPageFirst: DashboardPage;
  let productPageFirst: ProductPage;
  let domainSFirst: string;
  let shopToken: Shop;
  let numberProductSbase;
  let numberProductPbase;
  test.beforeEach(async ({ conf, page, token }, testInfo) => {
    if (process.env.CI_ENV === "prodtest") {
      return;
    }
    domainSFirst = conf.suiteConf.info_sbase_des.domain;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    dashboardSPageFirst = new DashboardPage(page, domainSFirst);
    shopToken = await token.getWithCredentials({
      domain: domainSFirst,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    test.setTimeout(conf.suiteConf.timeout);
  });

  test("Verify product khi Clone nhiều product @SB_PRO_CP_408", async ({ conf, token, page, scheduler }) => {
    if (process.env.CI_ENV === "prodtest") {
      return;
    }
    let scheduleData: SchedulerCloneProduct;
    const rawDataJson = await scheduler.getData();
    const date = new Date();
    const day = date.getDay();
    if (rawDataJson) {
      scheduleData = rawDataJson as SchedulerCloneProduct;
    } else {
      scheduleData = {
        is_clone_product_success_pb: false,
        is_clone_product_success_sb: false,
        number_product_sbase: "",
        number_product_pbase: "",
        day: day,
      };
    }
    if (scheduleData.day < day) {
      await scheduler.clear();
    }
    if (!scheduleData.is_clone_product_success_sb) {
      await test.step("Tại màn list product store gốc clone 1000 product shopbase to shopbase", async () => {
        const accessToken = shopToken.access_token;
        await dashboardSPageFirst.loginWithToken(accessToken);
        await dashboardSPageFirst.navigateToMenu("Products");
        productPageFirst = new ProductPage(dashboardSPageFirst.page, domainSFirst);
        const productPage = new ProductPage(dashboardSPageFirst.page, conf.suiteConf.info_sbase_des.domain);
        numberProductSbase = await productPageFirst.getTotalProductAfterSearch(accessToken, domainSFirst);
        const cloneInfo = conf.caseConf.clone_info_shopbase;
        await productPage.page.click(productPage.xpathSelectAllProduct);
        await productPage.page.click(productPage.xpathBtnAllProduct);
        await productPage.cloneProductToStore(cloneInfo);
        await productPage.checkMsgAfterCreated({
          message: conf.caseConf.message_shopbase.replace("number", numberProductSbase),
        });
        scheduleData.is_clone_product_success_sb = true;
        scheduleData.number_product_sbase = numberProductSbase;
      });
    }
    if (!scheduleData.is_clone_product_success_pb) {
      await test.step("Tại màn list product store gốc clone 1000 product pbase to pbase", async () => {
        const cloneInfo = conf.caseConf.clone_info_pbase;
        const dashboardPage = new DashboardPage(page, conf.suiteConf.info_pbase_des.domain);
        shopToken = await token.getWithCredentials({
          domain: conf.suiteConf.info_pbase_des.domain,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
        const accessTokenSecond = shopToken.access_token;
        await dashboardPage.loginWithToken(accessTokenSecond);
        await dashboardPage.navigateToMenu("Campaigns");
        numberProductPbase = await productPageFirst.getTotalProductAfterSearch(
          accessTokenSecond,
          conf.suiteConf.info_pbase_des.domain,
        );
        const productPage = new ProductPage(dashboardPage.page, conf.suiteConf.info_pbase_des.domain);
        await productPage.page.click(productPage.xpathSelectAllProduct);
        await productPage.page.click(productPage.xpathBtnAllProduct);
        await productPage.cloneProductToStore(cloneInfo);
        await productPage.checkMsgAfterCreated({
          message: conf.caseConf.message_pbase.replace("number", numberProductPbase),
        });
        scheduleData.is_clone_product_success_pb = true;
        scheduleData.number_product_pbase = numberProductPbase;
      });
    }

    await test.step("Tại màn list product store shopbase dich check quantity product clone", async () => {
      scheduleData.day = day;
      await scheduler.setData(scheduleData);
      const dashboardPageSecond = new DashboardPage(page, conf.suiteConf.info_sbase_source.domain);
      const shopTokenSecond = await token.getWithCredentials({
        domain: conf.suiteConf.info_sbase_source.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      const accessTokenSecond = shopTokenSecond.access_token;
      const productPageSecond = new ProductPage(dashboardPageSecond.page, conf.suiteConf.info_sbase_source.domain);
      const timeCurrent = new Date().getTime() / 1000;
      const dataProgress = await productPageSecond.getProgressByAPI(
        conf.suiteConf.info_sbase_source.domain,
        accessTokenSecond,
      );
      const numberProductSbase = Number(scheduleData.number_product_sbase);
      const dataResult = dataProgress.progresses.find(data => {
        return data.total_record >= numberProductSbase && timeCurrent - data.created_at <= 3600 * 12;
      });
      if (dataResult.status === "done") {
        expect(dataResult.inserted_record).toEqual(numberProductSbase);
      } else {
        await scheduler.schedule({ mode: "later", minutes: 60 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
    });

    await test.step("Tại màn list product store printbase dich check quantity product clone", async () => {
      const dashboardPageSecond = new DashboardPage(page, conf.suiteConf.info_pbase_source.domain);
      const shopTokenSecond = await token.getWithCredentials({
        domain: conf.suiteConf.info_pbase_source.domain,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      const accessTokenSecond = shopTokenSecond.access_token;
      const productPageSecond = new ProductPage(dashboardPageSecond.page, conf.suiteConf.info_pbase_source.domain);
      const timeCurrent = new Date().getTime() / 1000;
      const dataProgress = await productPageSecond.getProgressByAPI(
        conf.suiteConf.info_pbase_source.domain,
        accessTokenSecond,
      );
      const numberProductPbase = Number(scheduleData.number_product_pbase);
      const dataResult = dataProgress.progresses.find(data => {
        return data.total_record >= numberProductPbase && timeCurrent - data.created_at <= 3600 * 12;
      });

      if (dataResult.status === "done") {
        expect(dataResult.inserted_record).toEqual(numberProductPbase);
      } else {
        await scheduler.schedule({ mode: "later", minutes: 60 });
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip();
        return;
      }
      await scheduler.clear();
    });
  });
});
