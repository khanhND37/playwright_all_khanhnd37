import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { ContentPageAPI } from "@pages/api/dpro/content_page";

test.describe("Check gọi api download file", () => {
  let contentPage;

  test.beforeEach(async ({ conf, authRequest }) => {
    contentPage = new ContentPageAPI(conf.suiteConf.domain, authRequest);
  });

  const conf = loadData(__dirname, "DATA_DRIVEN");
  test(`${conf.caseConf.data.description} @${conf.caseConf.data.case_name}`, async () => {
    for (let i = 0; i < conf.caseConf.data.dataDownload.length; i++) {
      const caseData = conf.caseConf.data.dataDownload[i];
      await test.step(`${caseData.step}`, async () => {
        let token = caseData.token;
        if (i > 1) {
          token = await contentPage.getCustomerToken(conf.caseConf.data.account);
        }
        const path = await contentPage.getPathFile(caseData.productId);
        const response = await contentPage.getMessagesDownloadFile(token, path);
        expect(response).toEqual(caseData.result);
      });
    }
  });
});
