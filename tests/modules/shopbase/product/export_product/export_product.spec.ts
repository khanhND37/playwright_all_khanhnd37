import { test } from "@core/fixtures";
import { expect, Page } from "@playwright/test";
import { ProductPage } from "src/pages/dashboard/products";
import { deleteFile, readFileCSV } from "@helper/file";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { getMailboxInstanceWithProxy } from "@utils/mail";
import { ProductAPI } from "@pages/api/product";

test.describe("Export Product shopbase", async () => {
  test.slow();
  let prodPage: ProductPage;
  let domain;
  let exportInfo;
  let folderName;
  let listFile: string[];
  let productAPI: ProductAPI;
  let accessToken;

  test.beforeEach(async ({ conf, dashboard }) => {
    listFile = [];
    domain = conf.suiteConf.domain;
    prodPage = new ProductPage(dashboard, domain);
    folderName = conf.caseConf.forder_name;
    exportInfo = conf.caseConf.export_info;
  });
  test.afterEach(async ({ conf, authRequest }) => {
    const uniqueFiles: string[] = [];
    for (const filePath of listFile) {
      if (!uniqueFiles.includes(filePath)) {
        await deleteFile(filePath);
        uniqueFiles.push(filePath);
      }
    }

    await test.step(`Delete product all`, async () => {
      if (conf.caseName === "SB_PRO_EXP_10") {
        productAPI = new ProductAPI(conf.suiteConf.info_shop_second.domain, authRequest);
        await productAPI.deleteAllProduct(conf.suiteConf.info_shop_second.domain, accessToken);
      }
    });
  });

  // Go to mail page and returns the mail page for later use (if using proxy page we going to need it)
  const gotoMailToThis = async (page: Page): Promise<Page> => {
    const mailPage = await getMailboxInstanceWithProxy(page, domain);
    await mailPage.page.goto("https://www.mailinator.com/v4/public/inboxes.jsp?trialshow=true&to=export_product");
    await mailPage.page.waitForLoadState("networkidle");
    const xpathPopupRST = "(//div[normalize-space()='Request Subscription Trial'])[1]";
    if (await mailPage.page.locator(xpathPopupRST).isVisible()) {
      await mailPage.page.click(xpathPopupRST + "//button[@class='close']");
    }

    let isHasMail = await mailPage.page.locator("(//td[contains(text(),'Product export is ready!')])[1]").isVisible();
    let retries = 0;
    while (retries < 5 && !isHasMail) {
      await mailPage.page.waitForTimeout(5000);
      await mailPage.page.reload();
      isHasMail = await mailPage.page.locator("(//td[contains(text(),'Product export is ready!')])[1]").isVisible();
      retries++;
    }
    return mailPage.page;
  };

  const downloadFileCSVInMailTothis = async (page: Page, folder: string): Promise<string> => {
    const isPopupSub = await page.getByText("Request Subscription Trial").isVisible({ timeout: 7000 });
    //check popup subscription show thi click close https://capture.dropbox.com/qOsIjGnRtMQ3Q3gt
    if (isPopupSub) {
      await page.locator("#requestTrial .modal-content button.close").click();
    }
    await page.click("(//td[contains(text(),'Product export is ready!')])[1]");
    const downloadPromise = page.waitForEvent("download");
    await page.frameLocator("//iframe[@id='html_msg_body']").locator("//a[normalize-space()='Download']").click();
    const download = await downloadPromise;
    const path = await download.suggestedFilename();
    await download.saveAs(`./data/${folder}/${path}`);
    return `./data/${folder}/${path}`;
  };

  const verifyExportProduct = async (csvFile: Array<Array<string>>, database: Array<string>) => {
    const listTitle = csvFile.filter(data => data[3] !== "").map(data => data[3]);
    const checkData = listTitle.length === database.length && listTitle.some(item => database.includes(item));
    expect(checkData).toEqual(true);
  };

  const getDataColumnFileCsv = async (csvFile: Array<Array<string>>, column: number): Promise<Array<string>> => {
    const dataColumn = csvFile
      .filter(data => data[column] !== "")
      .map(data => data[column].split(","))
      .flat();
    return dataColumn;
  };

  test(`@SB_PRO_EXP_164 Verify thông tin product khi Export thành công product từ shop turn on Water Mark`, async ({
    conf,
  }) => {
    const exportProd = conf.caseConf.collection;
    const prodTitle = conf.caseConf.product_title;
    let filePath;

    await test.step(`Vào màn hình All products > Search product name > Select 2 products > Click Export `, async () => {
      await prodPage.navigateToMenu("Products");
      await prodPage.searchProdByCollection(exportProd);
      const quantityProdExp = await prodPage.countProductOnProductList();
      expect(quantityProdExp).toEqual(conf.caseConf.quantity_product);
    });

    await test.step(` Chọn Radio Selected products >  Click button Export `, async () => {
      filePath = await prodPage.exportProduct(exportInfo, folderName);
      listFile.push(filePath);
    });

    await test.step(`Mở file csv > Verify product export trong file csv`, async () => {
      const fileData = await readFileCSV(filePath);
      await verifyExportProduct(fileData, prodTitle);
    });
  });

  test(`@SB_PRO_EXP_163 Verify thông tin product khi Export thành công product với current page`, async ({
    authRequest,
    conf,
    page,
  }) => {
    let titleProdPage1;
    let titleProdPage2;
    const infoParamPage1 = conf.caseConf.info_param_1;
    const infoParamPage2 = conf.caseConf.info_param_2;
    const exportMess = conf.caseConf.export_message;

    await test.step(`Click Export button > Chọn radio [ Current page] > Click button Export`, async () => {
      await prodPage.navigateToMenu("Products");
      titleProdPage1 = await prodPage.getTitleProductCurrentPage(domain, infoParamPage1, authRequest);
      await prodPage.clickOnBtnWithLabel("Export");
      await prodPage.clickOnBtnWithLabel("Export", 2);
      expect(await prodPage.isToastMsgVisible(exportMess)).toBeTruthy();
    });

    await test.step(`Mở mail > Download file export > Verify product trong file export`, async () => {
      const mailPage = await gotoMailToThis(page);
      const filePath1 = await downloadFileCSVInMailTothis(mailPage, folderName);
      listFile.push(filePath1);
      const fileData = await readFileCSV(filePath1);
      await verifyExportProduct(fileData, titleProdPage1);
    });

    await test.step(`Tại trang products list > Click sang Next page >Export button > Chọn radio [ Current page] > Click button Export`, async () => {
      await prodPage.navigateToMenu("Products");
      titleProdPage2 = await prodPage.getTitleProductCurrentPage(domain, infoParamPage2, authRequest);
      await prodPage.clickBtnNextPage();
      const filePath2 = await prodPage.exportProduct(exportInfo, folderName);
      listFile.push(filePath2);
      const fileData = await readFileCSV(filePath2);
      await verifyExportProduct(fileData, titleProdPage2);
    });
  });

  test(`@SB_PRO_EXP_162 Verify Export thành công product khi Export all product trong shop`, async ({
    page,
    conf,
    authRequest,
  }) => {
    let titleProdAllPage;
    const infoParamPage = conf.caseConf.info_param;
    const exportMess = conf.caseConf.export_message;

    await test.step(`Click Export button > Chọn radio [ All products] > Click button Export`, async () => {
      await prodPage.navigateToMenu("Products");
      titleProdAllPage = await prodPage.getAllProductTitle(domain, infoParamPage, authRequest);
      await prodPage.clickOnBtnWithLabel("Export");
      await prodPage.selectOptionWithLabel("All products");
      await prodPage.clickOnBtnWithLabel("Export", 2);
      expect(await prodPage.isToastMsgVisible(exportMess)).toBeTruthy();
    });

    await test.step(`Mở mail > Download file export > Verify product trong file export`, async () => {
      const mailPage = await gotoMailToThis(page);
      const filePath = await downloadFileCSVInMailTothis(mailPage, folderName);
      listFile.push(filePath);
      const fileData = await readFileCSV(filePath);
      await verifyExportProduct(fileData, titleProdAllPage);
    });
  });

  test(`@SB_PRO_EXP_161 Verify thông tin product khi Export thành công với product theo filter`, async ({ conf }) => {
    const titleContent = conf.caseConf.title_content;
    const prodTitle = conf.caseConf.product_title;
    let filePath;
    await test.step(`Click More  > Filter theo Title > Chọn Contains> Input value> Click Done`, async () => {
      await prodPage.navigateToMenu("Products");
      await prodPage.searchProdByTitle(titleContent, "Contains");
      const quantityProdExp = await prodPage.countProductOnProductList();
      expect(quantityProdExp).toEqual(conf.caseConf.quantity_product);
    });

    await test.step(`Select all products theo filter > Click button Export  > Chọn Radio [Selected products] > Click button Export `, async () => {
      filePath = await prodPage.exportProduct(exportInfo, folderName);
      const fileData = await readFileCSV(filePath);
      await verifyExportProduct(fileData, prodTitle);
    });
  });

  test(`@SB_PRO_EXP_160 Check gửi file export khi export limit số luọng`, async ({ conf, page }) => {
    const exportProd = conf.caseConf.export_product;

    for (let i = 0; i < exportProd.length; i++) {
      let listProdTitle: string[] = [];
      let fileData: string[][] = [];

      await test.step(`Chọn số lượng product > Click button Export  > Chọn Radio [Selected products] > Click button Export`, async () => {
        await prodPage.navigateToMenu("Products");
        await prodPage.page.reload();
        await prodPage.searchProdByCollection(exportProd[i].collection);
        listProdTitle = await prodPage.getTitleProdOnDashboard();
        const quantityProdExp = await prodPage.countProductOnProductList();
        expect(quantityProdExp).toEqual(exportProd[i].quantity_product);
      });

      await test.step(`Open file export > Verify product trong file export`, async () => {
        switch (exportProd[i].step_export) {
          case "export 21 products": {
            await prodPage.selectAllProductOnListProduct();
            await prodPage.clickOnBtnWithLabel("Export");
            await prodPage.selectOptionWithLabel("Selected products");
            await prodPage.clickOnBtnWithLabel("Export", 2);
            await expect(await prodPage.isToastMsgVisible(exportProd[i].export_message)).toBeTruthy();
            // go to mail to download file csv
            const mailPage = await gotoMailToThis(page);
            const filePath = await downloadFileCSVInMailTothis(mailPage, exportProd[i].folderName);
            listFile.push(filePath);
            fileData = await readFileCSV(filePath);
            await verifyExportProduct(fileData, listProdTitle);
            break;
          }
          default: {
            const filePath = await prodPage.exportProduct(exportProd[i].export_info, exportProd[i].forder_name);
            listFile.push(filePath);
            fileData = await readFileCSV(filePath);
            await verifyExportProduct(fileData, listProdTitle);
            break;
          }
        }
      });
    }
  });

  test(`@SB_PRO_EXP_75 Check Export file CSV khi chọn "Use IDs from the exported products for ads optimization (Facebook Ads, GMC,...) on your other stores"`, async ({
    conf,
    authRequest,
  }) => {
    const prodTitle = conf.caseConf.product_title;
    const verifyFieldsCSV = conf.caseConf.verify_fields_file_csv;
    let filePath;
    let fileData;
    let listProdTitle;

    await test.step(`Search product name > Ticked on product name > Click button Export  > Chọn "Use IDs from the exported products for ads optimization (Facebook Ads, GMC,...) on your other stores"  > Chọn Radio [Selected products] > Click button Export`, async () => {
      await prodPage.navigateToMenu("Products");
      await prodPage.searchProdByTitle(prodTitle, "Contains");
      listProdTitle = await prodPage.getTitleProdOnDashboard();
      const quantityProdExp = await prodPage.countProductOnProductList();
      expect(quantityProdExp).toEqual(conf.caseConf.quantity_product);
      filePath = await prodPage.exportProduct(exportInfo, folderName);
      listFile.push(filePath);
      fileData = await readFileCSV(filePath);
      await verifyExportProduct(fileData, listProdTitle);

      let productId;
      let checkTags;
      let listTags: string[] = [];
      let checkListingPages;
      let listListingPages: string[] = [];
      let checkSitemapFiles;
      let listSitemapFiles: string[] = [];
      let listVariantTags: string[] = [];
      let listVariantId: string[] = [];
      let checkVariantTag;

      for (let i = 0; i < verifyFieldsCSV.length; i++) {
        switch (verifyFieldsCSV[i].colomn) {
          case "Tags":
            productId = await prodPage.getProductId(authRequest, prodTitle, domain);
            listTags = await getDataColumnFileCsv(fileData, 7);
            checkTags = async (): Promise<boolean> => {
              for (const tag of listTags) {
                if (tag === `${verifyFieldsCSV[i].tags}-${productId}`) {
                  return true;
                }
              }
            };
            expect(await checkTags()).toBeTruthy();
            break;
          case "Available On Listing Pages":
            listListingPages = await getDataColumnFileCsv(fileData, 51);
            checkListingPages = async (): Promise<boolean> => {
              for (const listingPages of listListingPages) {
                if (listingPages === verifyFieldsCSV[i].available_on_listing_pages) {
                  return true;
                }
              }
            };
            expect(await checkListingPages()).toBeTruthy();
            break;
          case "Available On Sitemap Files":
            listSitemapFiles = await getDataColumnFileCsv(fileData, 52);
            checkSitemapFiles = async (): Promise<boolean> => {
              for (const listingPages of listSitemapFiles) {
                if (listingPages === verifyFieldsCSV[i].available_on_sitemap_files) {
                  return true;
                }
              }
            };
            expect(await checkSitemapFiles()).toBeTruthy();
            break;
          case "Variant Tag":
            listVariantId = await getDataColumnFileCsv(fileData, 1);
            listVariantTags = await getDataColumnFileCsv(fileData, 55);
            checkVariantTag = {};
            for (const variantId of listVariantId) {
              checkVariantTag[variantId] = true;
            }
            for (const variantTags of listVariantTags) {
              const checkResult = checkVariantTag[variantTags];
              expect(checkResult).toEqual(true);
            }
            break;
          default:
            break;
        }
      }
    });
  });

  test(`@SB_PRO_EXP_10 Verify export product khi set product là \`Don't track inventory\``, async ({
    dashboard,
    conf,
    token,
    authRequest,
  }) => {
    const prodTitle = conf.caseConf.product_title;
    const domain2 = conf.suiteConf.info_shop_second.domain;
    const prodValidate = conf.caseConf.product_detail;
    let filePath;
    let fileData;
    let listProdTitle;

    await test.step(`Search product name > Ticked on checkbox product name > Click button Export > > Chọn Radio [Selected products] > Click button Export >Verify thông tin file export`, async () => {
      await prodPage.navigateToMenu("Products");
      await prodPage.searchProdByTitle(prodTitle, "Contains");
      listProdTitle = await prodPage.getTitleProdOnDashboard();
      const quantityProdExp = await prodPage.countProductOnProductList();
      expect(quantityProdExp).toEqual(conf.caseConf.quantity_product);
      filePath = await prodPage.exportProduct(exportInfo, folderName);
      listFile.push(filePath);
      fileData = await readFileCSV(filePath);
      await verifyExportProduct(fileData, listProdTitle);
      //verify file Variant Inventory
      const listVariantInventory = await getDataColumnFileCsv(fileData, 21);
      const checkVariantInventory = async (): Promise<boolean> => {
        for (const variantInventory of listVariantInventory) {
          if (variantInventory === conf.caseConf.verify_field_variant_inventory) {
            return true;
          }
        }
      };
      expect(await checkVariantInventory()).toBeTruthy();
    });

    await test.step(`Sử dụng file vừa export để import vào một shop khác`, async () => {
      const dashboardPageSecond = new DashboardPage(dashboard, domain2);
      const productPageSecond = new ProductPage(dashboardPageSecond.page, domain2);
      const shopToken = await token.getWithCredentials({
        domain: domain2,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      accessToken = shopToken.access_token;
      await dashboardPageSecond.loginWithToken(accessToken);
      await productPageSecond.navigateToMenu("Products");
      await productPageSecond.importProduct(filePath, productPageSecond.xpathImportFile, true, true);
      let countProd = await productPageSecond.page.locator("#products-results tr").count();
      let retries = 0;
      while (retries < 5 && countProd != 0) {
        await productPageSecond.page.waitForTimeout(5000);
        await productPageSecond.page.reload();
        countProd = await productPageSecond.page.locator("#products-results tr").count();
        retries++;
      }
      await productPageSecond.page.reload();
      const productID = await productPageSecond.getProductId(authRequest, prodTitle, domain2, accessToken);
      expect(
        await productPageSecond.getProductInfoDashboardByApi(
          authRequest,
          domain2,
          productID,
          prodValidate,
          accessToken,
        ),
      ).toEqual(prodValidate);
    });
  });
});
