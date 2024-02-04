import { expect, test } from "@core/fixtures";
import { PrintHubPage } from "@pages/apps/printhub";
import { snapshotDir, waitForImageLoaded } from "@utils/theme";
import { loadData } from "@core/conf/conf";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import type { Dev } from "./import_order_phub";
import { SnapshotFixture } from "@core/fixtures/snapshot-fixture";

const convertDate = date => {
  const dateNew = new Date(date * 1000);
  // Create a date object for the current date
  const formattedDate =
    dateNew.getFullYear() +
    "-" +
    ("0" + (dateNew.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + dateNew.getDate()).slice(-2);
  return formattedDate;
};

const searchOrderAndVerifyOrderDetail = async (
  printHubPage: PrintHubPage,
  orderName: string,
  imageName: string,
  tabName: string,
  snapshotFixture: SnapshotFixture,
) => {
  let importSucess;
  do {
    await printHubPage.page.reload();
    if (tabName === "Failed") {
      await printHubPage.switchTabInAllOrders("Cancelled");
      await printHubPage.page.keyboard.press("Tab");
    }
    await printHubPage.switchTabInAllOrders(tabName);
    await printHubPage.searchOrder(orderName);
    importSucess = await printHubPage.page.locator(printHubPage.getXpathOrderName(orderName)).isVisible();
  } while (!importSucess);
  await printHubPage.page.locator(printHubPage.getXpathOrderName(orderName)).click();
  const countXpathImageLoad = await printHubPage.page.locator(printHubPage.xpathImageLoad).count();
  for (let i = 1; i <= countXpathImageLoad; i++) {
    let imageLoad = await printHubPage.page.locator(`(${printHubPage.xpathImageLoad})[${i}]`).isVisible();
    do {
      imageLoad = await printHubPage.page.locator(`(${printHubPage.xpathImageLoad})[${i}]`).isVisible();
      //wait timeout vì do ảnh có dung lượng lớn nên load khá lâu
      await printHubPage.page.waitForTimeout(5000);
    } while (imageLoad);
  }
  const countXpathImageItem = await printHubPage.page
    .locator("(//td[@class='sb-table__expanded-cell'])[1]//img")
    .count();
  for (let i = 1; i <= countXpathImageItem; i++) {
    await waitForImageLoaded(printHubPage.page, `((//td[@class='sb-table__expanded-cell'])[1]//img)[${i}]`);
  }
  await printHubPage.page.waitForSelector(printHubPage.xpathOrderDetail);
  //chờ ảnh load ổn định rồi chụp ảnh hạn chế lỗi
  await printHubPage.page.waitForTimeout(3000);
  await snapshotFixture.verify({
    page: printHubPage.page,
    selector: printHubPage.xpathOrderDetail,
    snapshotName: imageName,
    snapshotOptions: {
      maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
      threshold: defaultSnapshotOptions.threshold,
      maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
    },
  });
};
test.describe("Import oder detail", () => {
  let printHubPage: PrintHubPage;
  let suiteConf: Dev;
  test.beforeEach(async ({ dashboard, conf }, testInfo) => {
    suiteConf = conf.suiteConf as Dev;
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
    test.setTimeout(conf.suiteConf.timeout);
    printHubPage = new PrintHubPage(dashboard, suiteConf.domain);
  });

  test.afterEach(async () => {
    await printHubPage.page.reload();
    await printHubPage.deleteOrderInTab("Awaiting Payment");
    await printHubPage.deleteOrderInTab("Pending Buyer Information");
    await printHubPage.deleteOrderInTab("Pending Design");
    await printHubPage.deleteOrderInTab("Cancelled");
    await printHubPage.switchTabInAllOrders("Cancelled");
    await printHubPage.page.keyboard.press("Tab");
    await printHubPage.deleteOrderInTab("Failed");
  });

  const conf = loadData(__dirname, "DATA_DRIVEN_VERIFY_IMPORT_ORDER");

  conf.caseConf.data.forEach(testCase => {
    test(`@${testCase.case_id} ${testCase.description}`, async ({ conf, snapshotFixture }) => {
      const orderInfos = testCase.order_infos;
      const buttonImport = conf.suiteConf.element_display.button;
      const indexBtn = conf.suiteConf.element_display.index;
      for (const orderInfo of orderInfos) {
        await test.step("Truy cập Apps > PrintHub, tại màn Order Import click import order", async () => {
          await printHubPage.goto(printHubPage.urlImportPage);
          await printHubPage.clickOnBtnWithLabel("Import");
          await printHubPage.uploadFile(orderInfo.file_import);
          await printHubPage.page.waitForSelector(printHubPage.xpathBtnWithLabel(buttonImport, indexBtn), {
            state: "visible",
          });
          await printHubPage.clickButtonOnPopUpWithLabel(buttonImport);
        });
        if (!testCase.is_success) {
          await test.step("Chọn file csv bị trùng order name và click Upload File", async () => {
            await printHubPage.waitUntilElementVisible(printHubPage.xpathTitleImportOrderFail);
            await printHubPage.page.waitForTimeout(1000);
            await snapshotFixture.verify({
              page: printHubPage.page,
              selector: printHubPage.xpathModelContentOrder,
              snapshotName: orderInfo.image_popup,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          });
        } else {
          await test.step("Click xem order detail của 1 order vừa được import", async () => {
            await printHubPage.waitUntilElementVisible(printHubPage.xpathTitlePreview);
            await printHubPage.page.waitForTimeout(2000);
            await snapshotFixture.verify({
              page: printHubPage.page,
              selector: printHubPage.xpathModelContentOrder,
              snapshotName: orderInfo.image_popup,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
            await printHubPage.clickButtonOnPopUpWithLabel(buttonImport);
            await printHubPage.clickOnBtnWithLabel("OK");
            await printHubPage.page.waitForLoadState("networkidle");
            await printHubPage.waitForElementVisibleThenInvisible(printHubPage.xpathTableLoad);
            for (const tabName of orderInfo.tab_names) {
              await searchOrderAndVerifyOrderDetail(
                printHubPage,
                tabName.order_name,
                tabName.image_dashboard,
                tabName.tab_name,
                snapshotFixture,
              );
            }
          });
        }
      }
    });
  });
  test("@SB_PRH_IOPH_110 Verify khi thực hiện filter order import by date", async ({ conf, authRequest }) => {
    const startDate = conf.caseConf.start_date;
    const endDate = conf.caseConf.end_date;
    await printHubPage.goto(printHubPage.urlImportPage);
    await printHubPage.switchTabInAllOrders("All");
    await printHubPage.clickOnBtnWithLabel("Order date");
    await printHubPage.page.locator(printHubPage.xpathInputFirstDate).fill(conf.caseConf.start_date);
    await printHubPage.page.locator(printHubPage.xpathInputSecondDate).fill(conf.caseConf.end_date);
    await printHubPage.page.locator(printHubPage.xpathSearchOrder).click();
    const dataFilter = await printHubPage.getOrderFilterByDate(authRequest, startDate, endDate);
    for (let i = 0; i < dataFilter.length; i++) {
      const date = dataFilter[i].mpo.created_at;
      const dateName = dataFilter[i].mpo.order_name;
      const dateConvert = convertDate(date);
      const dateCheck = dateConvert >= startDate && dateConvert <= endDate;
      expect(dateCheck).toBeTruthy();
      await expect(printHubPage.page.locator(printHubPage.getXpathOrderName(dateName))).toBeVisible();
    }
  });
  const confEdit = loadData(__dirname, "EDIT_ORDER");
  confEdit.caseConf.data.forEach(testCase => {
    test(`@${testCase.case_id} ${testCase.description}`, async ({ conf, snapshotFixture }) => {
      const orderInfo = testCase.order_info;
      const envRun = process.env.ENV;
      const buttonImport = conf.suiteConf.element_display.button;
      const indexBtn = conf.suiteConf.element_display.index;
      const dataEdit = testCase.data_edit;
      await test.step("Truy cập Apps > PrintHub, tại màn Order Import click import order", async () => {
        await printHubPage.goto(printHubPage.urlImportPage);
        await printHubPage.clickOnBtnWithLabel("Import");
        await printHubPage.uploadFile(orderInfo.file_import);
        await printHubPage.page.waitForSelector(printHubPage.xpathBtnWithLabel(buttonImport, indexBtn), {
          state: "visible",
        });
        await printHubPage.clickButtonOnPopUpWithLabel(buttonImport);
      });
      await test.step("Click xem order detail của 1 order vừa được import", async () => {
        await printHubPage.clickButtonOnPopUpWithLabel(buttonImport);
        await printHubPage.clickOnBtnWithLabel("OK");
        await printHubPage.page.waitForLoadState("networkidle");
        await printHubPage.waitForElementVisibleThenInvisible(printHubPage.xpathTableLoad);
        await searchOrderAndVerifyOrderDetail(
          printHubPage,
          orderInfo.order_name,
          `${orderInfo.image}_${envRun}.png`,
          orderInfo.tab_name,
          snapshotFixture,
        );
      });

      await test.step("Sửa thông tin ->click vào button save", async () => {
        await printHubPage.page.locator(printHubPage.xpathSkUName).click();
        await printHubPage.editOrderPrintHub(dataEdit.info_edit, dataEdit.info_customer);
        await printHubPage.clickOnBtnWithLabel("Save");
        await expect(await printHubPage.toastWithMessage("Edit order success")).toBeVisible();
      });
      await test.step("Kiểm tra order hiển thị", async () => {
        await searchOrderAndVerifyOrderDetail(
          printHubPage,
          dataEdit.order_name,
          `${dataEdit.image_after_edit}_${envRun}.png`,
          dataEdit.tab_name,
          snapshotFixture,
        );
      });
    });
  });
});
