import { expect, test } from "@core/fixtures";
import { AccountPage } from "@pages/dashboard/accounts";
import { PagesInOnlineStore } from "@pages/dashboard/pages";
import { OnlineStorePage } from "@pages/dashboard/online_store";
import { loadData } from "@core/conf/conf";

test.describe("Improve faqs page", async () => {
  const caseName = "TC_PLB_PLB_TP_5";
  const conf = loadData(__dirname, caseName);
  const firstQuestion = conf.suiteConf.data.firstQuestion;
  const firstAnswer = conf.suiteConf.data.firstAnswer;
  const secondQuestion = conf.suiteConf.data.secondQuestion;
  const secondAnswer = conf.suiteConf.data.secondAnswer;

  test(`Verify thêm question and answer ở trang FAQs trên shop template @TC_PLB_PLB_TP_5`, async ({ page, conf }) => {
    const accountPage = new AccountPage(page, conf.suiteConf["shopTemplate"]);
    const pages = new PagesInOnlineStore(page, conf.suiteConf["shopTemplate"]);
    const onlineStorePage = new OnlineStorePage(page, conf.suiteConf["shopTemplate"]);

    await test.step("Login to dashboard shop template", async () => {
      await accountPage.login({
        email: conf.suiteConf["ops.name"],
        password: conf.suiteConf["ops.pwd"],
      });
    });

    // eslint-disable-next-line max-len
    await test.step("Navigate đến Pages trong Online Store > FAQs page detail > Thêm Question and Answer > Save ", async () => {
      await onlineStorePage.gotoOnlineStore();
      await pages.navigateToFAQsdetail();
      await pages.addQuestionAndAnswer(firstQuestion, firstAnswer, true);
      await pages.addQuestionAndAnswer(secondQuestion, secondAnswer, false);
      await pages.savePage();
      await pages.waitUntilElementVisible("//div[@class='s-notices is-bottom']");
    });

    await test.step("verify faqs page on store front", async () => {
      await page.goto(`https://${conf.suiteConf.shopTemplate}/pages/faqs`);
      await expect(await pages.xpathQuestion(firstQuestion)).toBeVisible();
      await expect(await pages.xpathAnswer(firstAnswer)).toBeVisible();
      await expect(await pages.xpathQuestion(secondQuestion)).toBeVisible();
      await expect(await pages.xpathAnswer(secondAnswer)).toBeHidden();
    });
  });

  test(`Verify storefront FAQs page in store merchant @TC_PLB_PLB_TP_2`, async ({ page, conf }) => {
    const pages = new PagesInOnlineStore(page, conf.suiteConf["shopTemplate"]);
    await test.step("navigate to FAQs page storefront on shop merchant", async () => {
      await page.goto(`https://${conf.suiteConf.storePlusbase}/pages/faqs`);
    });

    await test.step("verify thông tin hiển thị trên storefront của shop merchant", async () => {
      await expect(await pages.xpathQuestion(firstQuestion)).toBeVisible();
      await expect(await pages.xpathAnswer(firstAnswer)).toBeVisible();
      await expect(await pages.xpathQuestion(secondQuestion)).toBeVisible();
      await expect(await pages.xpathAnswer(secondAnswer)).toBeHidden();
      await page.locator(`//div[text()='${secondQuestion}']//following-sibling::div`).click();
      await expect(await pages.xpathAnswer(secondAnswer)).toBeVisible();
    });
  });

  test("Verify action xóa thông tin trên FAQs page @TC_PLB_PLB_TP_6", async ({ page, conf }) => {
    const accountPage = new AccountPage(page, conf.suiteConf["shopTemplate"]);
    const pages = new PagesInOnlineStore(page, conf.suiteConf["shopTemplate"]);
    const onlineStorePage = new OnlineStorePage(page, conf.suiteConf["shopTemplate"]);

    await test.step("login to dashboard shop template", async () => {
      await accountPage.login({
        email: conf.suiteConf["ops.name"],
        password: conf.suiteConf["ops.pwd"],
      });
    });

    await test.step("navigate to FAQs page detail", async () => {
      await onlineStorePage.gotoOnlineStore();
      await pages.navigateToFAQsdetail();
      await expect(await page.locator(`//div[@class='s-heading' and normalize-space()='Page details']`)).toBeVisible();
    });

    await test.step("delete question and answer", async () => {
      await page.waitForLoadState("domcontentloaded");
      await pages.waitForEditorRender();
      await pages.deleteQuestion(secondQuestion);
      // editor re-render when content different from original content
      await pages.loseFocus();
      await pages.waitForEditorRender();
      await pages.deleteQuestion(firstQuestion);
      await pages.savePage();
      await pages.waitUntilElementVisible("//div[@class='s-notices is-bottom']");
    });
  });
});
