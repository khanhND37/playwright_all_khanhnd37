import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { loadData } from "@core/conf/conf";
test.describe("Clone campaign Printbase sang Plusbase, Plusbase sang Plusbase khi chọn Keep both product khi trùng handle", async () => {
  const caseName = "SB_PRO_CP_179";
  const conf = loadData(__dirname, caseName);
  conf.caseConf.data.forEach(
    (
      {
        case_id: caseId,
        description: caseDescription,
        info_shop_first: infoFirstShop,
        data_test: dataTest,
        shop_type: shopType,
      },
      i: number,
    ) => {
      test(`${caseDescription} @${caseId} with case ${i}`, async ({ authRequest, conf, page, dashboard, token }) => {
        const dashboardPageFirst = new DashboardPage(page, infoFirstShop.domain);
        const productPageFirst = new ProductPage(dashboardPageFirst.page, infoFirstShop.domain);
        const printbasePageFirst = new PrintBasePage(dashboardPageFirst.page, infoFirstShop.domain);
        const dashboardPageSecond = new DashboardPage(dashboard, conf.suiteConf.domain);
        const productPageSecond = new ProductPage(dashboardPageSecond.page, conf.suiteConf.domain);
        const printbasePageSecond = new PrintBasePage(dashboardPageSecond.page, conf.suiteConf.domain);
        const shopToken = await token.getWithCredentials({
          domain: infoFirstShop.domain,
          username: conf.suiteConf.username,
          password: conf.suiteConf.password,
        });
        const accessToken = shopToken.access_token;
        await dashboardPageFirst.loginWithToken(accessToken);
        switch (shopType) {
          case "Printbase":
            await dashboardPageFirst.navigateToMenu("Campaigns");
            break;
          default:
            await dashboardPageFirst.navigateToMenu("POD products");
            await dashboardPageFirst.navigateToSubMenu("POD products", "All campaigns");
            break;
        }

        test.setTimeout(conf.suiteConf.timeout);
        for (let i = 0; i < dataTest.length; i++) {
          await test.step(`Login vào first shop > Vào POD products > All campaigns > Search camp > Clone sang sencond shop`, async () => {
            await printbasePageFirst.searchWithKeyword(dataTest[i].campaign_name);
            await productPageFirst.cloneProductToStore(dataTest[i].clone_info);
            await productPageFirst.checkMsgAfterCreated({
              message: `${conf.suiteConf.message} ${[dataTest[i].clone_info.second_shop]}`,
            });
          });

          await test.step(`Login vào second shop sau đó verify hiển thị status và process ở progress bar`, async () => {
            await dashboardPageSecond.navigateToMenu("POD products");
            await dashboardPageSecond.navigateToSubMenu("POD products", "All campaigns");
            let textStatus: string;
            let textProcess: string;
            let j = 0;
            do {
              await productPageSecond.clickProgressBar();
              textStatus = await productPageSecond.getStatus();
              textProcess = await productPageSecond.getProcess();
              await productPageSecond.page.waitForTimeout(1000);
              await productPageSecond.page.click(productPageSecond.xpathHeaderName);

              j++;
            } while (textStatus != conf.suiteConf.status && j < 11);
            //Kiểm tra trạng thái quá trình clone
            expect(textProcess).toEqual(dataTest[i].process);
          });

          await test.step(`Click vào campaign detail tại second shop > Verify thông tin campaign trong màn campaign detail`, async () => {
            await printbasePageSecond.searchWithKeyword(dataTest[i].campaign_detail.campaign_name);
            await printbasePageSecond.openCampaignDetail(dataTest[i].campaign_detail.campaign_name);
            await printbasePageSecond.page.waitForLoadState("networkidle");
            const campaignID = await printbasePageSecond.getCampaignID();
            expect(
              await printbasePageSecond.getCampaignInfo(
                authRequest,
                conf.suiteConf.domain,
                campaignID,
                dataTest[i].campaign_detail,
              ),
            ).toEqual(dataTest[i].campaign_detail);
          });
        }
      });
    },
  );
});
