import { expect, test } from "@core/fixtures";
import { MyCustomizationServicePage } from "@pages/shopbase_creator/storefront/my_customization_service";
import { SbWebBuilderLpCSP07 } from "./function-flow";

test.describe("Verify function của customization service page", () => {
  let productHandle = "";
  let caseConf: SbWebBuilderLpCSP07;
  test.beforeEach(async ({ cConf }) => {
    caseConf = cConf as SbWebBuilderLpCSP07;
    productHandle = caseConf.product_handle;
  });

  test(`@SB_WEB_BUILDER_LP_CSP_07 Verify function của page customization service`, async ({
    page,
    conf,
    snapshotFixture,
  }) => {
    const myCSPage = new MyCustomizationServicePage(page, conf.suiteConf.domain);

    await test.step(`Thực hiện checkout product: "Develop wordpress website"`, async () => {
      const checkoutEmail = `shopbase-${new Date().getTime()}@mailinator.com`;
      await myCSPage.checkoutProduct(productHandle, checkoutEmail);
      await expect(myCSPage.genLoc(myCSPage.xpathOrderConfirmed)).toBeVisible();
    });

    await test.step(`Click access my content tại thank you page, thực hiện trả lời câu hỏi theo các kịch bản:- Lần 1: Không trả lời câu hỏi nào, bấm submit- Lần 2: Trả lời thiếu - Lần 3: trả lời đủ`, async () => {
      await myCSPage.genLoc(myCSPage.xpathBtnAccessMyContent).click();

      // wait all css loaded
      await expect(myCSPage.genLoc(myCSPage.xpathButtonSubmitQuestion)).toHaveCSS(
        myCSPage.defaultCssButtonSubmitQuestion.name,
        myCSPage.defaultCssButtonSubmitQuestion.value,
      );

      // Verify display question
      await snapshotFixture.verifyWithIframe({
        page: page,
        selector: myCSPage.xpathSectionMyProductQuestion,
        snapshotName: "cs-page-question-sf-default.png",
      });

      // First time ~> not answer any question
      await myCSPage.genLoc(myCSPage.xpathBtnSubmitAnswer).click();

      await snapshotFixture.verifyWithIframe({
        page: page,
        selector: myCSPage.xpathSectionMyProductQuestion,
        snapshotName: "cs-page-question-sf-miss-all-question.png",
      });

      // Second time ~> answer miss 1 required question
      await myCSPage.genLoc(myCSPage.xpathBtnSubmitAnswer).click();
      await myCSPage.genLoc(myCSPage.getXpathSingleSelect("AWS")).click();
      await myCSPage.genLoc(myCSPage.getXpathMultipleSelect("Redis")).click();
      await myCSPage.genLoc(myCSPage.getXpathMultipleSelect("Memcache")).click();
      await myCSPage.genLoc(myCSPage.xpathBtnSubmitAnswer).click();
      await snapshotFixture.verifyWithIframe({
        page: page,
        selector: myCSPage.xpathSectionMyProductQuestion,
        snapshotName: "cs-page-question-sf-miss-one-question.png",
      });

      // Last time ~> answer all question
      await myCSPage.genLoc(myCSPage.xpathProductQuestionAnswerInput).fill("phongdo-01@mailinator.com");
      await myCSPage.genLoc(myCSPage.xpathBtnSubmitAnswer).click();
      await expect(myCSPage.genLoc(myCSPage.xpathThankAfterSubmit)).toBeVisible();
      await expect(myCSPage.genLoc(myCSPage.getXpathAnswerResult("phongdo-01@mailinator.com")).first()).toBeVisible();
      await snapshotFixture.verifyWithIframe({
        page: page,
        selector: myCSPage.xpathSectionMyProductQuestion,
        snapshotName: "cs-page-question-sf-answer-all-question.png",
      });
    });
  });
});
