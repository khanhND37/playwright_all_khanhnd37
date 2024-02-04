import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { snapshotDir } from "@utils/theme";
import path from "path";
import appRoot from "app-root-path";
import { ReviewPage } from "@pages/dashboard/product_reviews";
import { generateRandomMailToThisEmail, getMailboxInstanceWithProxy } from "@core/utils/mail";
import { CheckoutAPI } from "@pages/api/checkout";
import { SFCheckout } from "@pages/storefront/checkout";
import { MailBox } from "@pages/thirdparty/mailbox";
import { scrollUntilElementIsVisible } from "@core/utils/scroll";
import { loadData } from "@core/conf/conf";

test.describe("App reviews themes inside", async () => {
  let dashboardPage: DashboardPage;
  let reviewPage: ReviewPage;
  let domain: string;
  let mailBoxPage: MailBox;
  const softAssertion = expect.configure({ soft: true });

  test.beforeEach(async ({ dashboard, conf, authRequest }, testInfo) => {
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf["domain"]);
    domain = conf.suiteConf.domain;
    reviewPage = new ReviewPage(dashboard, domain, authRequest);

    await test.step(`Navigate to menu All reviews in Reviews app`, async () => {
      await dashboardPage.navigateToMenu("Apps");
      await reviewPage.menuReviews.click();
    });

    await test.step(`Publish all review`, async () => {
      await reviewPage.publicAndUnPublicAllReviews(true);
    });
  });

  test.afterEach(async ({ conf }) => {
    await test.step(`Delete all reviews in Reviews app Except product`, async () => {
      await reviewPage.deleteAllReviewExceptID(conf.suiteConf.product_no_delete_rv);
      await reviewPage.deleteCacheOnSF();
    });
  });

  test(`@SB_SF_RV_01 Test import review khi  product id và product handle rỗng`, async ({ conf, page }) => {
    await test.step(`Thực hiện review bằng file csv ở dashboard`, async () => {
      //count total review before import
      const totalReviewsBeforeImport = await reviewPage.countReviewsFilter();

      await reviewPage.xpathBtnImportReview.click();
      await reviewPage.genLoc(reviewPage.importCSVReviews).click();
      const pathFile = path.join(appRoot + conf.caseConf.path_file);
      await reviewPage.chooseFileCSV(pathFile);
      const mesageSuccessPopup = await reviewPage.genLoc(reviewPage.msgSuccessPopup).innerText();
      expect(mesageSuccessPopup).toContain(conf.caseConf.msg_success_popup);
      await reviewPage.genLoc(reviewPage.checkNowBtn).click();
      let totalReviewsAfterImport: number;
      const numberImportReview = conf.caseConf.total_reviews;
      await expect(async () => {
        totalReviewsAfterImport = await reviewPage.countReviewsFilter();
        expect(totalReviewsBeforeImport + numberImportReview).toEqual(totalReviewsAfterImport);
      }).toPass();
    });

    await test.step(`Check review(import ở step1) ngoài SF`, async () => {
      await page.goto(`https://${conf.suiteConf.domain}/pages/all-reviews`);
      await expect(page.locator(reviewPage.widgetReviews)).toBeVisible();
    });
  });

  test(`@SB_SF_RV_02 Test import review khi tất cả thông tin trong file đầy đủ và hợp lệ (product id/handle tồn tại)`, async ({
    conf,
    page,
  }) => {
    await test.step(`Thực hiện review bằng file csv ở dashboard`, async () => {
      //count total review before import
      const totalReviewsBeforeImport = await reviewPage.countReviewsFilter();

      await reviewPage.xpathBtnImportReview.click();
      await reviewPage.genLoc(reviewPage.importCSVReviews).click();
      const pathFile = path.join(appRoot + conf.caseConf.path_file);
      await reviewPage.chooseFileCSV(pathFile);
      const mesageSuccessPopup = await reviewPage.genLoc(reviewPage.msgSuccessPopup).innerText();
      expect(mesageSuccessPopup).toContain(conf.caseConf.msg_success_popup);
      await reviewPage.genLoc(reviewPage.checkNowBtn).click();
      let totalReviewsAfterImport: number;
      const numberImportReview = conf.caseConf.total_reviews;
      await expect(async () => {
        totalReviewsAfterImport = await reviewPage.countReviewsFilter();
        expect(totalReviewsBeforeImport + numberImportReview).toEqual(totalReviewsAfterImport);
      }).toPass();
    });

    await test.step(`Check review(import ở step1) ngoài SF`, async () => {
      await page.goto(`https://${conf.suiteConf.domain}/pages/all-reviews`);
      await expect(page.locator(reviewPage.widgetReviews)).toBeVisible();
    });
  });

  test(`@SB_SF_RV_04 Test import từ aliepxress`, async ({ page, conf }) => {
    test.slow();
    const caseConf = conf.caseConf;
    await test.step(`import từ aliexpress với link không hợp lệ`, async () => {
      await reviewPage.xpathBtnImportReview.click();
      await reviewPage.genLoc(reviewPage.importAliExpressReviews).click();
      await reviewPage.importAliexpressReview(caseConf.product, caseConf.link_product_err);
      const msgErrorLink = await reviewPage.genLoc(reviewPage.msgErrAliLink).last().innerText();
      expect(msgErrorLink).toContain(conf.caseConf.msg_error_link);
      await reviewPage.toastWithMessage(conf.caseConf.msg_invalid_link).waitFor();
      await reviewPage.toastWithMessage(conf.caseConf.msg_invalid_link).waitFor({ state: "hidden" });
    });

    await test.step(`Thực hiện import review bằng Aliexpress (https://aliexpress.com/item/1005002180785473.html)`, async () => {
      //count total review before import
      const totalReviewsBeforeImport = await reviewPage.countReviewsFilter();
      await reviewPage.clickOnBtnWithLabel("Cancel");
      await reviewPage.genLoc(reviewPage.importAliExpressReviews).click();
      await reviewPage.importAliexpressReview(caseConf.product, caseConf.link_product);
      await reviewPage.genLoc(reviewPage.getReviewImport).click();
      await expect(reviewPage.genLoc(reviewPage.msgSuccessPopup)).toBeVisible();
      await reviewPage.genLoc(reviewPage.checkNowBtn).click();
      let totalReviewsAfterImport: number;
      const numberImportReview = conf.caseConf.total_reviews;
      await expect(async () => {
        totalReviewsAfterImport = await reviewPage.countReviewsFilter();
        expect(totalReviewsBeforeImport + numberImportReview).toEqual(totalReviewsAfterImport);
      }).toPass();
    });

    await test.step(`Check reviews ngoài SF`, async () => {
      await page.goto(`https://${conf.suiteConf.domain}/pages/all-reviews`);
      await page.reload();
      await expect(page.locator(reviewPage.widgetReviews)).toBeVisible();
    });
  });

  test(`@SB_SF_RV_9 Check set Action Publish`, async ({ conf }) => {
    await test.step(`Chọn reviews`, async () => {
      await reviewPage.selectAllReviews.click();
      const textTotalReviewsSelected = await reviewPage.genLoc(reviewPage.totalReviewSelected).innerText();
      const totalReviewsSelected = Number(textTotalReviewsSelected.match(/\d+/)[0]);
      softAssertion(totalReviewsSelected).toEqual(conf.caseConf.total_reviews);
    });

    await test.step(`Thực hiện action Publish`, async () => {
      await reviewPage.genLoc(reviewPage.buttonAction).click();
      await reviewPage.chooseOpionAction("Publish");
      await expect(reviewPage.genLoc(reviewPage.msgUpdateSuccess)).toBeVisible();
    });

    await test.step(`Check hiển thị reviews trên dashboard`, async () => {
      await reviewPage.genLoc(reviewPage.filterReviewBtn).click();
      await reviewPage.filterReviewsUnpublish.click();
      await reviewPage.waitForElementVisibleThenInvisible(reviewPage.xpathLoadingTableRV);
      const countReview = await reviewPage.countReviewsFilter();
      softAssertion(countReview).toEqual(conf.caseConf.total_reviews);
    });
  });

  test(`@SB_SF_RV_10 Check set Action Unpublish`, async ({ conf }) => {
    await test.step(`Chọn reviews`, async () => {
      await reviewPage.selectAllReviews.click();
      const textTotalReviewsSelected = await reviewPage.genLoc(reviewPage.totalReviewSelected).innerText();
      const totalReviewsSelected = Number(textTotalReviewsSelected.match(/\d+/)[0]);
      softAssertion(totalReviewsSelected).toEqual(conf.caseConf.total_reviews);
    });

    await test.step(`Thực hiện action Unpublish`, async () => {
      await reviewPage.genLoc(reviewPage.buttonAction).click();
      await reviewPage.chooseOpionAction("Unpublish");
      await expect(reviewPage.genLoc(reviewPage.msgUpdateSuccess)).toBeVisible();
    });

    await test.step(`Check hiển thị reviews trên dashboard`, async () => {
      await reviewPage.genLoc(reviewPage.filterReviewBtn).click();
      await reviewPage.filterReviewsUnpublish.click();
      await reviewPage.waitForElementVisibleThenInvisible(reviewPage.xpathLoadingTableRV);
      const countReview = await reviewPage.countReviewsFilter();
      softAssertion(countReview).toEqual(conf.caseConf.total_reviews);
    });
  });

  test(`@SB_SF_RV_14 Check hiển thị review ngoài SF`, async ({ cConf }) => {
    await test.step(`Check hiển thị review ngoài SF (Product page, All review page)`, async () => {
      await reviewPage.goto(`https://${domain}/products/${cConf.handle_product}`);
      await reviewPage.page.waitForLoadState("networkidle");
      await expect(reviewPage.page.locator(reviewPage.widgetReviews)).toBeVisible();
    });

    await test.step(`Check filter reviews (With photos, Uncheck With Photos, Most reecent, Featured, Top reviews)`, async () => {
      const loadDataFilter = cConf.search_review_stf;
      for (let j = 0; j < loadDataFilter.length; j++) {
        const filterData = loadDataFilter[j];
        await test.step(`${filterData.type}`, async () => {
          const type = filterData.type;
          await reviewPage.page.reload({ waitUntil: "networkidle" });
          await expect(reviewPage.page.getByRole("button", { name: "Write a review" })).toBeVisible();
          if (type.includes("Uncheck")) {
            await reviewPage.page.getByRole("combobox").last().selectOption(filterData);
            await reviewPage.waitForElementVisibleThenInvisible(reviewPage.loadingTableReviewInSF);
          } else {
            await reviewPage.page.locator(reviewPage.checkboxWithPhoto).click();
            await reviewPage.waitForElementVisibleThenInvisible(reviewPage.loadingTableReviewInSF);
            await reviewPage.page.getByRole("combobox").last().selectOption(filterData);
            await reviewPage.waitForElementVisibleThenInvisible(reviewPage.loadingTableReviewInSF);
          }
          if (type.includes("Featured")) {
            await expect(reviewPage.genLoc(reviewPage.xpathReviewContentStf(cConf.content)).first()).toBeHidden();
          } else {
            await expect(reviewPage.genLoc(reviewPage.overallRating)).toBeVisible();
            expect(await reviewPage.countTotalReviewsStf()).toEqual(filterData.count);
          }
        });
      }
    });
  });

  test(`@SB_SF_RV_18 Check việc hiển thị khi customize review`, async ({ page, conf }) => {
    const customize = conf.caseConf.customize_review;
    try {
      await test.step(`Tại Customization trên dashborad, customize các các option`, async () => {
        await dashboardPage.navigateToMenu("Customization");
        await reviewPage.customizeReview(conf.caseConf.customize_review);
        expect(await reviewPage.isToastMsgVisible("All changes were successfully saved")).toBeTruthy();
      });

      await test.step(`Check hiển thị carousel ngoài SF (Home page, Checkout page)`, async () => {
        await page.goto(`https://${domain}`);
        await page.waitForLoadState("networkidle");
        const firstReview = page.locator(reviewPage.reviewLayoutMasonry).first();
        await expect(firstReview).toHaveCSS("--review-star-color", customize.rating_color);
        await expect(firstReview).toHaveCSS("--review-font", new RegExp(customize.font));
        await expect(firstReview).toHaveCSS("--review-widget-background-color", customize.widget_background);
      });

      await test.step(`Check hiển thị review widget ngoài SF (Product page)`, async () => {
        await page.goto(`https://${domain}/products/${conf.caseConf.handle_product}`);
        await page.waitForLoadState("networkidle");
        const firstReview = page.locator(reviewPage.reviewLayoutMasonry).first();
        await expect(firstReview).toHaveCSS("--review-star-color", customize.rating_color);
        await expect(firstReview).toHaveCSS("--review-font", new RegExp(customize.font));
        await expect(firstReview).toHaveCSS("--review-widget-background-color", customize.widget_background);
      });
    } finally {
      await test.step(`Before: customize các các option customize về như trc lúc chạy test`, async () => {
        await reviewPage.customizeReview(conf.caseConf.default_review);
        expect(await reviewPage.isToastMsgVisible("All changes were successfully saved")).toBeTruthy();
      });
    }
  });

  test(`@SB_SF_RV_21 Check viết review khi tất cả các trường hợp lệ`, async ({ conf }) => {
    const reviewConf = conf.caseConf.review;
    await test.step(`Thực hiện viết review`, async () => {
      await reviewPage.goto(`https://${domain}`);
      await reviewPage.page.waitForLoadState("networkidle");
      await expect(reviewPage.page.locator(reviewPage.xpathReviewStf)).toBeVisible();
      await reviewPage.writeReview(reviewConf);
    });

    await test.step(`Check hiển thị review trong dashboard`, async () => {
      await reviewPage.goto(`https://${domain}/admin`);
      await dashboardPage.navigateToMenu("Apps");
      await reviewPage.menuReviews.click();
      const firstReview = await reviewPage.genLoc(reviewPage.reviewInDashboard).nth(0).innerText();
      expect(firstReview).toEqual(reviewConf.review);
    });

    await test.step(`Check hiển thị review ngoài SF`, async () => {
      await reviewPage.goto(`https://${domain}/pages/${conf.caseConf.all_review_page}`);
      await expect(async () => {
        const totalReview = await await reviewPage.countReviewStf();
        expect(totalReview).not.toEqual(0);
      }).toPass();
      await reviewPage.page.reload();
      await reviewPage.page.waitForLoadState("networkidle");
      await expect(reviewPage.genLoc(reviewPage.getXpathTitleReview(reviewConf.title, 1))).toBeVisible();
      const firstReviewStf = await reviewPage.genLoc(reviewPage.reviewInStf).nth(0).innerText();
      expect(firstReviewStf).toEqual(reviewConf.review);
    });
  });

  test(`@SB_SF_RV_25 Check Auto-publish reviews turn on`, async ({ conf }) => {
    const reviewConf = conf.caseConf.review;
    await test.step(`Setting turn on Auto publish reviews (ví dụ setting min star =4*)`, async () => {
      await dashboardPage.goto(`https://${domain}/admin/apps/review/setting`);
      const selectOption = await dashboardPage.page.evaluate(() => window.document.querySelector("select").value);
      if (selectOption !== conf.caseConf.setting_auto_publish) {
        await reviewPage.settingAutoPublishReview(conf.caseConf.setting_auto_publish);
        await dashboardPage.clickButtonOnSaveBar("save");
        expect(await reviewPage.isToastMsgVisible("All changes were successfully saved")).toBeTruthy();
      }
    });

    await test.step(`Tạo reviews mới không phù hợp với setting (review 3*)`, async () => {
      await reviewPage.goto(`https://${domain}`);
      await reviewPage.page.waitForLoadState("networkidle");
      await expect(reviewPage.page.locator(reviewPage.xpathReviewStf)).toBeVisible();
      await reviewPage.writeReview(reviewConf);
    });

    await test.step(`Verify review vừa tạo trong dashboard`, async () => {
      await reviewPage.goto(`https://${domain}/admin`);
      await dashboardPage.navigateToMenu("Apps");
      await reviewPage.menuReviews.click();
      const firstReview = await reviewPage.genLoc(reviewPage.reviewInDashboard).nth(0).innerText();
      expect(firstReview).toEqual(reviewConf.review);
      const firstReviewStatus = await reviewPage.genLoc(reviewPage.statusReviewInDB).nth(0).innerText();
      expect(firstReviewStatus).toEqual("Unpublished");
    });

    await test.step(`Check hiển thị review vừa tạo ngoài SF`, async () => {
      await reviewPage.goto(`https://${domain}/pages/${conf.caseConf.all_review_page}`);
      await reviewPage.page.waitForLoadState("networkidle");
      const firstReviewStf = await reviewPage.genLoc(reviewPage.reviewInStf).nth(0).innerText();
      expect(firstReviewStf).not.toEqual(reviewConf.review);
    });
  });

  test(`@SB_SF_RV_27 Check Auto-block reviews`, async ({ conf }) => {
    await test.step(`Nhập keyword để filter reviews`, async () => {
      await dashboardPage.goto(`https://${domain}/admin/apps/review/setting`);
      await dashboardPage.genLoc(reviewPage.blockReviewText).fill(conf.caseConf.block_review_text);
      if (await dashboardPage.saveChangesBtn.isVisible()) {
        await dashboardPage.saveChangesBtn.click();
      }
    });

    await test.step(`Tạo reviews mới không phù hợp với setting (chứa text bị block)`, async () => {
      await reviewPage.goto(`https://${domain}`);
      await reviewPage.page.waitForLoadState("networkidle");
      await expect(reviewPage.page.locator(reviewPage.xpathReviewStf)).toBeVisible();
      await reviewPage.writeReview(conf.caseConf.review);
    });

    await test.step(`Verify review vừa tạo trong dashboard`, async () => {
      await reviewPage.goto(`https://${domain}/admin`);
      await dashboardPage.navigateToMenu("Apps");
      await reviewPage.menuReviews.click();
      const firstReview = await reviewPage.genLoc(reviewPage.reviewInDashboard).nth(0).innerText();
      expect(firstReview).toEqual(conf.caseConf.review.review);
      const firstReviewStatus = await reviewPage.genLoc(reviewPage.statusReviewInDB).nth(0).innerText();
      expect(firstReviewStatus).toEqual("Unpublished");
    });

    await test.step(`Check hiển thị reviews ngoài SF`, async () => {
      await reviewPage.goto(`https://${domain}/pages/${conf.caseConf.all_review_page}`);
      await reviewPage.loadDataProductReview();
      await expect(reviewPage.genLoc(reviewPage.reviewInStf)).toBeHidden();
    });
  });

  test(`@SB_SF_RV_28 Check việc nhận notification khi turn on section Notifications`, async ({ page, conf }) => {
    await test.step(`Turn on Notifications`, async () => {
      await dashboardPage.goto(`https://${domain}/admin/apps/review/setting`);
      await dashboardPage.genLoc(reviewPage.setNotiBadReviews).setChecked(true);
      await dashboardPage.genLoc(reviewPage.inputMailNoti).fill(conf.caseConf.email);
      if (await dashboardPage.saveChangesBtn.isVisible()) {
        await dashboardPage.saveChangesBtn.click();
      }
    });

    await test.step(`Tạo reviews mới phù hợp với setting (chứa bad review under 3 stars)`, async () => {
      await reviewPage.goto(`https://${domain}`);
      await reviewPage.page.waitForLoadState("networkidle");
      await expect(reviewPage.page.locator(reviewPage.xpathReviewStf)).toBeVisible();
      await reviewPage.writeReview(conf.caseConf.review);
    });

    await test.step(`Check nhận email noti`, async () => {
      const mailBoxPage = await getMailboxInstanceWithProxy(page, domain);
      await mailBoxPage.openMailBox(conf.caseConf.email);
      const titleMail = `${conf.caseConf.mail_title} ${conf.suiteConf.shop_name}`;
      expect(mailBoxPage.hasLastestMailWithTitle(titleMail)).toBeTruthy();
    });
  });

  const confProductGroups = loadData(__dirname, "REVIEW_WITH_PRODUCT_GROUPS");
  for (let caseIndex = 0; caseIndex < confProductGroups.caseConf.data.length; caseIndex++) {
    const dataSetting = confProductGroups.caseConf.data[caseIndex];
    test(`@${dataSetting.case_id} ${dataSetting.case_name}`, async ({ conf }) => {
      const reviewConf = dataSetting.review;
      await test.step(`Tạo reviews mới phù hợp với setting cho 1 product trong collections`, async () => {
        await reviewPage.goto(`https://${domain}/products/${dataSetting.product_1}`);
        await reviewPage.page.waitForLoadState("networkidle");
        const totalRatingBefore = await reviewPage.getTotalRating(conf.caseConf.id_product_1);
        await reviewPage.writeReview(reviewConf);
        await expect(async () => {
          const totalRating = await reviewPage.getTotalRating(conf.caseConf.id_product_1);
          expect(totalRating).toEqual(totalRatingBefore + 1);
        }).toPass();
        await reviewPage.page.reload();
        await reviewPage.page.waitForLoadState("networkidle");
        await expect(reviewPage.genLoc(reviewPage.getXpathTitleReview(reviewConf.title, 1))).toBeVisible();
        const firstReviewStf = await reviewPage.genLoc(reviewPage.reviewInStf).nth(0).innerText();
        expect(firstReviewStf).toEqual(reviewConf.review);
      });

      await test.step(`Check hiển thị reviews ngoài SF`, async () => {
        await reviewPage.goto(`https://${domain}/products/${dataSetting.product_2}`);
        await expect(async () => {
          await reviewPage.deleteCacheOnSF();
          const totalReview = await await reviewPage.countReviewStf();
          expect(totalReview).not.toEqual(0);
        }).toPass();
        await reviewPage.page.reload();
        await reviewPage.page.waitForLoadState("networkidle");
        await expect(reviewPage.genLoc(reviewPage.getXpathTitleReview(reviewConf.title, 1))).toBeVisible();
        const firstReviewStf = await reviewPage.genLoc(reviewPage.reviewInStf).nth(0).innerText();
        expect(firstReviewStf).toEqual(reviewConf.review);
      });
    });
  }

  test(`@SB_SF_RV_37 Check delete product groups`, async ({ conf }) => {
    const reviewConf = conf.caseConf.review;

    await test.step(`Tạo reviews mới phù hợp với setting cho 1 product trong collections`, async () => {
      await reviewPage.goto(`https://${conf.suiteConf.domain}/products/${conf.caseConf.product_1}`);
      await reviewPage.page.waitForLoadState("networkidle");
      const totalRatingBefore = await reviewPage.getTotalRating(conf.caseConf.id_product_1);
      await reviewPage.writeReview(reviewConf);
      await expect(async () => {
        const totalRating = await reviewPage.getTotalRating(conf.caseConf.id_product_1);
        expect(totalRating).toEqual(totalRatingBefore + 1);
      }).toPass();
      await reviewPage.page.reload();
      await reviewPage.page.waitForLoadState("networkidle");
      await expect(reviewPage.genLoc(reviewPage.getXpathTitleReview(reviewConf.title, 1))).toBeVisible();
      const firstReviewStf = await reviewPage.genLoc(reviewPage.reviewInStf).nth(0).innerText();
      expect(firstReviewStf).toEqual(conf.caseConf.review.review);
    });

    await test.step(`Check hiển thị reviews ngoài SF`, async () => {
      await reviewPage.goto(`https://${conf.suiteConf.domain}/products/${conf.caseConf.product_2}`);
      await reviewPage.page.waitForLoadState("networkidle");
      await expect(async () => {
        await expect(reviewPage.genLoc(reviewPage.reviewInStf).nth(0)).toBeHidden();
      }).toPass();
    });
  });

  test(`@SB_SF_RV_47 Review_Check review khi click từ product widget`, async ({ conf }) => {
    test.slow(); //tăng thời gian để load được hết review cho các môi trường
    // let totalReviewProduct1Before: number;
    await test.step(`Viết review cho 2 product A,B`, async () => {
      await dashboardPage.navigateToMenu("Apps");
      await reviewPage.menuReviews.click();
      await reviewPage.goto(`https://${conf.suiteConf.domain}/products/${conf.caseConf.product_1}`);
      await reviewPage.page.waitForLoadState("networkidle");
      const totalReviewProduct1Before = await reviewPage.getTotalRating(conf.caseConf.id_product_1);
      await reviewPage.writeReview(conf.caseConf.review_1);
      await expect(async () => {
        const totalReviewProduct1After = await reviewPage.getTotalRating(conf.caseConf.id_product_1);
        expect(totalReviewProduct1After).toEqual(totalReviewProduct1Before + 1);
      }).toPass();

      await reviewPage.goto(`https://${conf.suiteConf.domain}/products/${conf.caseConf.product_2}`);
      await reviewPage.page.waitForLoadState("networkidle");
      const totalReviewProduct2Before = await reviewPage.getTotalRating(conf.caseConf.id_product_2);
      await reviewPage.writeReview(conf.caseConf.review_2);
      await expect(async () => {
        const totalReviewProduct2After = await reviewPage.getTotalRating(conf.caseConf.id_product_2);
        expect(totalReviewProduct2After).toEqual(totalReviewProduct2Before + 1);
      }).toPass();
    });

    await test.step(`Open detail product A`, async () => {
      await reviewPage.goto(`https://${conf.suiteConf.domain}/products/${conf.caseConf.product_1}`);
      await reviewPage.page.waitForLoadState("networkidle");
      await reviewPage.waitForXpathState(reviewPage.reviewInStf, "stable");
      await expect(reviewPage.genLoc(reviewPage.getXpathTitleReview(conf.caseConf.review_1.title, 1))).toBeVisible();
      const firstReviewStf = await reviewPage.genLoc(reviewPage.reviewInStf).nth(0).innerText();
      expect(firstReviewStf).toEqual(conf.caseConf.review_1.review);
    });

    await test.step(`Từ widget -> click product B`, async () => {
      await scrollUntilElementIsVisible({
        page: reviewPage.page,
        viewEle: reviewPage.page.locator(reviewPage.xpathTitleMoreFromRV),
      });
      await reviewPage.genLoc(reviewPage.xpathProductInWidgetReview(conf.caseConf.product_name)).click();
      await reviewPage.loadDataProductReview();
      await expect(reviewPage.genLoc(reviewPage.getXpathTitleReview(conf.caseConf.review_2.title, 1))).toBeVisible();
      await reviewPage.waitForXpathState(reviewPage.reviewInStf, "stable");
      const firstReviewStf = await reviewPage.genLoc(reviewPage.reviewInStf).nth(0).innerText();
      expect(firstReviewStf).toEqual(conf.caseConf.review_2.review);
    });
  });

  test(`@SB_SF_RV_31 Check gửi Multi product review request`, async ({ page, conf, cConf, authRequest }) => {
    let emailBuyer: string;
    await test.step(`Before: 1. Customer checkout order (nhiều product) thành công`, async () => {
      const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
      const checkout = new SFCheckout(page, conf.suiteConf.domain);
      emailBuyer = generateRandomMailToThisEmail();
      //Tạo order
      await checkoutAPI.addProductThenSelectShippingMethod(
        conf.suiteConf.products_checkout,
        emailBuyer,
        cConf.shipping_address,
      );
      await checkoutAPI.addTipping(cConf.tipping_info);
      await checkoutAPI.openCheckoutPageByToken();
      await checkout.completeOrderWithMethod(cConf.payment_method);
    });

    await test.step(`Check gửi email sau 3-5p`, async () => {
      test.slow();
      mailBoxPage = await getMailboxInstanceWithProxy(page, conf.suiteConf.domain);
      await mailBoxPage.openMailBox(emailBuyer);
      const titleMail = `${cConf.mail_title} ${conf.suiteConf.shop_name}`;
      const timeout = 5 * 60 * 1000;
      const interval = 10000;
      const start = Date.now();
      const xpathTitleReviewEmail = mailBoxPage.hasLastestMailWithTitle(titleMail);
      while (Date.now() - start < timeout) {
        await mailBoxPage.page.reload();
        if ((await xpathTitleReviewEmail) == true) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, interval)); // Đợi 5 giây trước khi load
      }
      // Kiểm tra sau khi vòng lặp kết thúc
      expect(mailBoxPage.hasLastestMailWithTitle(titleMail)).toBeTruthy();
    });

    await test.step(`Submit review qua mail`, async () => {
      const review = cConf.review;
      await mailBoxPage.submitReview(review.title, review.content, review.type);
    });
  });

  test(`@SB_SF_RV_PRIPA_162 Integrate Product reviews into Product admin >> Ali express_Check việc hiển thị khi sau khi import`, async ({
    conf,
    cConf,
  }) => {
    await test.step(`Nhập các trường hợp lệ vào Import from Aliexpress popup`, async () => {
      await reviewPage.goto(`https://${domain}/admin/products/${conf.suiteConf.product_id}`);
      await reviewPage.page.waitForLoadState("networkidle");
      await reviewPage.buttonImportReview.click();
      await reviewPage.genLoc(reviewPage.importAliExpressReviews).click();
      await reviewPage.genLoc(reviewPage.inputLinkAliExpress).fill(cConf.link_product);
    });

    await test.step(`Click Continue`, async () => {
      await reviewPage.buttonContinue.click();
      await expect(reviewPage.headerPopupImportAli).toBeVisible();
    });

    await test.step(`Nhập hợp lệ các trường Aliexpress filter > Click Import button`, async () => {
      await reviewPage.genLoc(reviewPage.getReviewImport).click();
      await expect(reviewPage.genLoc(reviewPage.buttonLoading)).toBeHidden();
      await expect(reviewPage.genLoc(reviewPage.msgSuccessPopup)).toBeVisible();

      await reviewPage.genLoc(reviewPage.checkReviews).click();
      await expect(reviewPage.genLoc(reviewPage.reviewsTable)).toBeVisible();
      await reviewPage.verifyReviewAfterImport(conf.suiteConf.timeout);
    });
  });

  test(`@SB_SF_RV_8 Check filter review với droplist`, async ({ conf }) => {
    test.slow();
    const dataFilter = conf.caseConf.data_filters.data;
    for (let i = 0; i < dataFilter.length; i++) {
      await test.step(`${dataFilter[i].description}`, async () => {
        await reviewPage.removeFilterReview();
        await reviewPage.waitForLoadReviewsImport(conf.caseConf.total_reviews);
        await expect(reviewPage.genLoc(reviewPage.tagFilter)).toBeHidden();
        await reviewPage.genLoc(reviewPage.filterReviewBtn).click();
        await reviewPage.chooseOpionFilters(dataFilter[i].type, dataFilter[i].option);
        await expect(reviewPage.genLoc(reviewPage.tagFilter)).toBeVisible();
        await reviewPage.page.waitForLoadState("networkidle");
        softAssertion(await reviewPage.countTotalReviews()).toEqual(dataFilter[i].expected_review);
      });
    }
  });
  test(`@SB_SF_RV_30 Check turn on review request`, async ({ page, conf, cConf, authRequest }) => {
    let emailBuyer: string;
    await test.step(`Customer checkout product thành công`, async () => {
      const checkoutAPI = new CheckoutAPI(conf.suiteConf.domain, authRequest, page);
      const checkout = new SFCheckout(page, conf.suiteConf.domain);
      emailBuyer = generateRandomMailToThisEmail();
      //Tạo order
      await checkoutAPI.addProductThenSelectShippingMethod(
        conf.suiteConf.product_checkout,
        emailBuyer,
        cConf.shipping_address,
      );
      await checkoutAPI.addTipping(cConf.tipping_info);
      await checkoutAPI.openCheckoutPageByToken();
      await checkout.completeOrderWithMethod(cConf.payment_method);
    });

    await test.step(`Check gửi email sau 3-5p`, async () => {
      test.slow();
      mailBoxPage = await getMailboxInstanceWithProxy(page, conf.suiteConf.domain);
      await mailBoxPage.openMailBox(emailBuyer);
      const titleMail = `${cConf.mail_title} ${conf.suiteConf.shop_name}`;
      const timeout = 5 * 60 * 1000;
      const interval = 5000;
      const start = Date.now();
      const xpathTitleReviewEmail = mailBoxPage.hasLastestMailWithTitle(titleMail);
      while (Date.now() - start < timeout) {
        await mailBoxPage.page.reload();
        if ((await xpathTitleReviewEmail) == true) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, interval)); // Đợi 5 giây trước khi load
      }
      // Kiểm tra sau khi vòng lặp kết thúc
      expect(mailBoxPage.hasLastestMailWithTitle(titleMail)).toBeTruthy();
    });

    await test.step(`Submit review qua mail`, async () => {
      const review = cConf.review;
      await mailBoxPage.submitReview(review.title, review.content, review.type);
    });
  });

  test(`@SB_SF_RV_19 Check hiển thị link See all review`, async ({ conf, page }) => {
    await test.step(`Turn off Show link in Review Widget`, async () => {
      await reviewPage.goto(`https://${domain}/admin/apps/review/customize`);
      const statusToggle = await reviewPage.genLoc(reviewPage.xpathToggleReviews("Review Widget")).isChecked();

      if (statusToggle) {
        await reviewPage.genLoc(reviewPage.xpathToggleReviews("Review Widget")).setChecked(false);
        await dashboardPage.saveChangesBtn.click();
        expect(await reviewPage.isToastMsgVisible("All changes were successfully saved")).toBeTruthy();
      }
    });

    await test.step(`Check hiển thị link tại Product page`, async () => {
      await page.goto(`https://${domain}/products/${conf.caseConf.handle_product}`);
      await page.reload();
      await expect(page.locator(reviewPage.showLinkAllReview)).toBeHidden();
    });

    await test.step(`Turn on Show link in Review Widget`, async () => {
      await reviewPage.genLoc(reviewPage.xpathToggleReviews("Review Widget")).setChecked(true);
      await dashboardPage.saveChangesBtn.click();
      expect(await reviewPage.isToastMsgVisible("All changes were successfully saved")).toBeTruthy();
    });

    await test.step(`Check hiển thị link tại Product page`, async () => {
      await page.goto(`https://${domain}/products/${conf.caseConf.handle_product}`);
      await page.reload();
      await expect(page.locator(reviewPage.showLinkAllReview)).toBeVisible();
    });

    await test.step(`Turn on Show link in Review Carousel`, async () => {
      await reviewPage.genLoc(reviewPage.xpathToggleReviews("Review Carousel")).setChecked(true);
      await dashboardPage.saveChangesBtn.click();
      expect(await reviewPage.isToastMsgVisible("All changes were successfully saved")).toBeTruthy();
    });

    await test.step(`Check hiển thị link tại Home page`, async () => {
      await page.goto(`https://${domain}`);
      await page.locator(reviewPage.carouselReview).scrollIntoViewIfNeeded();
      await expect(page.locator(reviewPage.showLinkAllReviewCarousel)).toBeVisible();
    });

    await test.step(`Turn off Show link in Review Carousel`, async () => {
      await reviewPage.genLoc(reviewPage.xpathToggleReviews("Review Carousel")).setChecked(false);
      await dashboardPage.saveChangesBtn.click();
      expect(await reviewPage.isToastMsgVisible("All changes were successfully saved")).toBeTruthy();
    });

    await test.step(`Check hiển thị link tại Home page`, async () => {
      await page.goto(`https://${domain}`);
      await page.locator(reviewPage.carouselReview).scrollIntoViewIfNeeded();
      await expect(page.locator(reviewPage.showLinkAllReviewCarousel)).toBeHidden();
    });
  });
});
