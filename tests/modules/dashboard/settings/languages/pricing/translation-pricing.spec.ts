import { expect, test } from "@fixtures/website_builder";
import { LanguageList } from "@pages/new_ecom/dashboard/translation/language-list";
// import { verifyRedirectUrl } from "@core/utils/theme";
import { TranslationDetail } from "@pages/new_ecom/dashboard/translation//translation-detail";
import { BlogPostPageDB } from "@pages/dashboard/blog_post_url";
import { ProductAPI } from "@pages/api/product";
import { requestChargeTranslationAPI } from "@core/utils/translation";
import { BalancePage } from "@pages/dashboard/balance";
import { InvoicePage } from "@pages/dashboard/invoice";
import { InvoiceDetailPage } from "@pages/dashboard/invoice_detail";

test.describe("Check Translation Pricing ", async () => {
  let dashboardPage: TranslationDetail;
  let languageList: LanguageList;
  let blogPostPageDB: BlogPostPageDB;
  let prodAPI: ProductAPI;
  let balancePage: BalancePage;
  let invoicePage: InvoicePage;
  let invoiceDetailPage: InvoiceDetailPage;
  let data;
  let domain;

  const productIds = [];

  test.beforeEach(async ({ conf, dashboard, authRequest }) => {
    languageList = new LanguageList(dashboard, conf.suiteConf.domain);
    dashboardPage = new TranslationDetail(dashboard, conf.suiteConf.domain);
    blogPostPageDB = new BlogPostPageDB(dashboard, conf.suiteConf.domain);
    balancePage = new BalancePage(dashboard, conf.suiteConf.domain);
    invoicePage = new InvoicePage(dashboard, conf.suiteConf.domain);
    data = conf.caseConf.data;
    prodAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    domain = conf.suiteConf.domain;
    const preCondition = conf.suiteConf.pre_condition;

    if (conf.caseName === "SB_SET_LG_PL_03") {
      await requestChargeTranslationAPI(domain, authRequest);
    }

    await test.step("Pre-condition: Delete all products & add 1 product", async () => {
      const listProducts = await prodAPI.getAllProduct(domain);
      listProducts.forEach(prod => {
        productIds.push(prod.id);
      });
      if (productIds.length > 0) {
        for (const id of productIds) {
          await prodAPI.deleteProducts([id]);
        }
      }
      await prodAPI.createNewProduct(conf.suiteConf.pre_condition.product_info);
    });

    await test.step("Pre condition: Delete all blog posts & add 3 blog post ", async () => {
      await blogPostPageDB.goToBlogPostPage();
      if (!(await blogPostPageDB.checkButtonVisible("Create blog post"))) {
        await blogPostPageDB.deleteBlogOrBlogPost("");
      }
      for (const blogPostInfo of preCondition.blog_post_info) {
        await blogPostPageDB.createBlogPost(blogPostInfo);
        await blogPostPageDB.clickOnBreadcrumb();
      }
    });
  });

  test.afterEach(async ({ conf, authRequest }) => {
    await test.step(`Clear test data translation after each`, async () => {
      for (const languageCode of conf.suiteConf.after_condition) {
        await dashboardPage.goto(`admin/settings/language/${languageCode}`);
        await dashboardPage.page.waitForLoadState("networkidle");
        await dashboardPage.switchToggleAutoTranslate("Products", false);
        await dashboardPage.switchToggleAutoTranslate("Pages", false);
      }
      await requestChargeTranslationAPI(domain, authRequest);
    });
  });

  test(`@SB_SET_LG_PL_01 [DB - UI/UX] Check hiển UI popup confirm plan khi buy language - Translation Pricing`, async ({
    conf,
    dashboard,
    snapshotFixture,
    // context,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;

    await test.step(`- Đi đến menu settings >  Languages`, async () => {
      await languageList.goToLanguageList();
      await expect(languageList.genLoc(languageList.xpathLangList.blockFullsiteTranslation)).toBeVisible();
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: languageList.xpathLangList.blockFullsiteTranslation,
        snapshotName: `${process.env.ENV}-block-Full-site-translation.png`,
      });
    });

    await test.step(`Click See how we calculate your price`, async () => {
      // chờ pm bổ sung link See how we calculate your price
      // await verifyRedirectUrl({
      //   page: dashboard,
      //   selector: languageList.getXpathWithLabel(caseConf.text_link),
      //   redirectUrl: ``,
      //   context,
      // });
    });

    await test.step(`Click language French`, async () => {
      await languageList.openLanguageDetail("Published languages", caseConf.language);
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.iconUpgrade("Pages"))).toBeVisible();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.iconUpgrade("Products"))).toBeVisible();
    });

    await test.step(`Hover vào icon icon Upgrade entity Pages , Products`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathLD.iconUpgrade("Pages")).hover();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.activeTooltip)).toHaveText(caseConf.tooltip_text);
      await dashboardPage.genLoc(dashboardPage.xpathLD.iconUpgrade("Products")).hover();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.activeTooltip)).toHaveText(caseConf.tooltip_text);
    });

    await test.step(`Bật toggle Auto translate ở Products `, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("Products")).locator(`//label`).click({ delay: 300 });
      await dashboardPage.page.waitForSelector(dashboardPage.xpathLD.popupCfPricing, { timeout: 30000 });
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: dashboardPage.xpathLD.popupCfPricing,
        snapshotName: `${process.env.ENV}-popup-Full-site-translation.png`,
      });
    });

    await test.step(`Click See how we calculate your price`, async () => {
      // chờ pm bổ sung link See how we calculate your price
      // await verifyRedirectUrl({
      //   page: dashboard,
      //   selector: languageList.getXpathWithLabel(caseConf.text_link),
      //   redirectUrl: ``,
      //   context,
      // });
    });

    await test.step(`Click  Cost calculator`, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathLD.headerCostCalculator).click();
      await dashboardPage.page.waitForSelector(dashboardPage.xpathLD.contentCostCalculator);
      await snapshotFixture.verifyWithAutoRetry({
        page: dashboard,
        selector: dashboardPage.xpathLD.contentCostCalculator,
        snapshotName: `${process.env.ENV}-Number-of-contents.png`,
      });
    });
  });

  test(`@SB_SET_LG_PL_02 [DB - Function] Check hiển thị số lượng content , price và click confirm của popup Full-site translation - Translation Pricing`, async ({
    conf,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;

    await test.step(`- Đi đến menu settings >  Languages tiếng Đức > mở Language translation > Click bật toggle auto translate entity Pages > Click  Cost calculator`, async () => {
      await dashboardPage.goto(`admin/settings/language/${data.language_code}`);
      await dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("Products")).locator(`//label`).click({ delay: 300 });
      await dashboardPage.genLoc(dashboardPage.xpathLD.headerCostCalculator).click();
      await expect
        .soft(dashboardPage.genLoc(dashboardPage.xpathLD.pricing.currentStoreContent))
        .toContainText(caseConf.step1_expect.contents);
      await expect
        .soft(dashboardPage.genLoc(dashboardPage.xpathLD.pricing.totalPrice))
        .toContainText(caseConf.step1_expect.price);
    });

    await test.step(`- Thực hiện thay đổi số lượng products và blog posts của shop ( 2 blog post + 1)
  - Đi đến menu settings >  Languages tiếng Đức > mở Language translation > Click bật toggle auto translate entity Pages > Click  Cost calculator- `, async () => {
      await blogPostPageDB.goToBlogPostPage();
      for (const blogPostInfo of caseConf.blog_post_info) {
        await blogPostPageDB.createBlogPost(blogPostInfo);
        await blogPostPageDB.clickOnBreadcrumb();
      }
      await prodAPI.createNewProduct(caseConf.product_info);

      await dashboardPage.goto(`admin/settings/language/${data.language_code}`);
      await dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("Products")).locator(`//label`).click({ delay: 300 });
      await dashboardPage.genLoc(dashboardPage.xpathLD.headerCostCalculator).click();
      await expect
        .soft(dashboardPage.genLoc(dashboardPage.xpathLD.pricing.currentStoreContent))
        .toContainText(caseConf.step2_expect.contents);
      await expect
        .soft(dashboardPage.genLoc(dashboardPage.xpathLD.pricing.totalPrice))
        .toContainText(caseConf.step2_expect.price);
    });

    await test.step(`Thực hiện thay đổi số lượng content`, async () => {
      for (const data of caseConf.step3) {
        await dashboardPage.fillNumberOfContents(data.text);
        await expect
          .soft(dashboardPage.genLoc(dashboardPage.xpathLD.pricing.currentStoreContent))
          .toContainText(caseConf.step2_expect.contents);
        await expect.soft(dashboardPage.genLoc(dashboardPage.xpathLD.pricing.totalPrice)).toContainText(data.expect);
      }
    });

    await test.step(`Click btn cancel / btn X / vùng trống để tắt popup  > Click bật toggle auto translate entity Pages `, async () => {
      await dashboardPage.clickOnBtnWithLabel("Cancel");
      await dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("Pages")).locator(`//label`).click({ delay: 300 });
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.popupCfPricing)).toBeVisible();
    });

    await test.step(`Click  btn X để tắt popup  > Click bật toggle auto translate entity Products`, async () => {
      await dashboardPage.clickOnBtnWithLabel("Cancel");
      await dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("Products")).locator(`//label`).click({ delay: 300 });
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.popupCfPricing)).toBeVisible();
    });

    await test.step(`Click btn Confirm`, async () => {
      await dashboardPage.clickOnBtnWithLabel("Confirm");
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.popupCfPricing)).toBeHidden();
      await dashboardPage.genLoc(dashboardPage.xpathLD.saveBtn).waitFor({ state: "visible" });
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("Products")).locator(`//input`)).toBeChecked();
    });

    await test.step(`Click bật toggle auto translate entity Pages `, async () => {
      await dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("Pages")).locator(`//label`).click({ delay: 300 });
      await dashboardPage.genLoc(dashboardPage.xpathLD.saveBtn).waitFor({ state: "visible" });
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.popupCfPricing)).toBeHidden();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("Pages")).locator(`//input`)).toBeChecked();
    });

    await test.step(`Đi đến menu settings >  Languages tiếng Pháp > mở Language translation > Click bật toggle auto translate entity Pages`, async () => {
      await dashboardPage.goto(`admin/settings/language/${caseConf.language_code2}`);
      await dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("Pages")).locator(`//label`).click({ delay: 300 });
      await dashboardPage.genLoc(dashboardPage.xpathLD.saveBtn).waitFor({ state: "visible" });
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.popupCfPricing)).toBeHidden();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("Pages")).locator(`//input`)).toBeChecked();
    });
  });

  test(`@SB_SET_LG_PL_03 [DB - Function] Check charge thành công khi translate language sau 1 tháng sử dụng - Translation Pricing`, async ({
    authRequest,
    conf,
    context,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;

    await test.step(`- Đi đến menu settings >  Languages tiếng Đức > mở Language translation > bật toggle auto translate entity Pages, Products`, async () => {
      await dashboardPage.goto(`admin/settings/language/${data.language_code}`);
      await dashboardPage.page.waitForLoadState("networkidle");
      await dashboardPage.switchToggleAutoTranslate("Pages", true);
      await dashboardPage.switchToggleAutoTranslate("Products", true);
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("Pages")).locator(`//input`)).toBeChecked();
      await expect(dashboardPage.genLoc(dashboardPage.xpathLD.toggleBtn("Products")).locator(`//input`)).toBeChecked();
    });

    await test.step(`Đến cuối tháng 
  Đi đến menu Balance > View invoice > Transactions`, async () => {
      //bổ sung sau nếu fail : đợi đến khi thông báo in progress biến mất ( có thể dừng sớm hơn, vì bật là tính tiền )
      await dashboardPage.page.waitForTimeout(3000);
      await requestChargeTranslationAPI(domain, authRequest);
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      await invoicePage.filterInvoiceWithConditions(caseConf.invoice_filter);
      await expect.soft(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(caseConf.filter_tag_invoice);

      // verify Invoice at Invoice page
      expect.soft(await invoicePage.verifyInvoice(caseConf.invoice_info)).toBe(true);
    });

    await test.step(`Click vào invoice `, async () => {
      const [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
      invoiceDetailPage = new InvoiceDetailPage(newPage, "");
      await expect(invoiceDetailPage.isDBPageDisplay("Invoice detail")).toBeTruthy();
      expect.soft(await invoiceDetailPage.verifyInvoiceDetail(caseConf.invoice_info)).toBe(true);
    });
  });

  test(`@SB_SET_LG_PL_04 [DB - Function] Check charge khi thay đổi số lượng content cho các tháng sau đó khi sử dụng translate language - Translation Pricing`, async ({
    authRequest,
    conf,
    context,
  }) => {
    test.slow();
    const caseConf = conf.caseConf;

    await test.step(`pre condition Sau tháng 1 charge tiền`, async () => {
      for (const language of caseConf.data_languages) {
        await dashboardPage.goto(`admin/settings/language/${language.language_code}`);
        await dashboardPage.page.waitForLoadState("networkidle");
        await dashboardPage.switchToggleAutoTranslate(language.entityType, true);
      }
      //  đợi vài giây để chắc chắn đã tính tiền
      await dashboardPage.page.waitForTimeout(3000);
      await requestChargeTranslationAPI(domain, authRequest);
    });

    await test.step(`Thực hiện import thêm 2 products , xóa 1 blog post
  Sau tháng thứ 2  Đi đến menu Balance > View invoice > Transactions`, async () => {
      await blogPostPageDB.goToBlogPostPage();
      await blogPostPageDB.deleteBlogOrBlogPost(conf.suiteConf.pre_condition.blog_post_info[1].title);
      for (const productInfo of caseConf.product_infos) {
        await prodAPI.createNewProduct(productInfo);
      }
      //  đợi vài giây để chắc chắn đã tính tiền
      await dashboardPage.page.waitForTimeout(3000);
      await requestChargeTranslationAPI(domain, authRequest);

      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      await invoicePage.filterInvoiceWithConditions(caseConf.invoice_filter);
      await expect.soft(invoicePage.genLoc(invoicePage.xpathFilterTag)).toContainText(caseConf.filter_tag_invoice);

      // verify Invoice at Invoice page
      expect.soft(await invoicePage.verifyInvoice(caseConf.invoice_info2)).toBe(true);
    });

    await test.step(`Click vào invoice `, async () => {
      const [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
      invoiceDetailPage = new InvoiceDetailPage(newPage, domain);
      await expect(invoiceDetailPage.isDBPageDisplay("Invoice detail")).toBeTruthy();
      expect.soft(await invoiceDetailPage.verifyInvoiceDetail(caseConf.invoice_info2)).toBe(true);
      await invoiceDetailPage.page.close();
    });

    await test.step(`Thực hiện bật toggle auto translate với entity Pages , Products thêm 1 language nữa  Frisian , và cả german
  Sau tháng thứ 3   Đi đến menu Balance > View invoice > Transactions`, async () => {
      for (const language of caseConf.step3_language_code) {
        await dashboardPage.goto(`admin/settings/language/${language}`);
        await dashboardPage.page.waitForLoadState("networkidle");
        await dashboardPage.switchToggleAutoTranslate("Pages", true);
        await dashboardPage.switchToggleAutoTranslate("Products", true);
      }
      //  đợi vài giây để chắc chắn đã tính tiền
      await dashboardPage.page.waitForTimeout(3000);
      await requestChargeTranslationAPI(domain, authRequest);
      await balancePage.goToBalance();
      await balancePage.clickButtonViewInvoice();
      await balancePage.filterWithConditionDashboard("More filters", caseConf.filter_dutch);

      // verify Invoice at Invoice page
      expect.soft(await invoicePage.verifyInvoice(caseConf.invoice_info3_dutch)).toBe(true);
    });

    await test.step(`Click vào invoice đầu tiên ( Dutch ) `, async () => {
      const [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
      invoiceDetailPage = new InvoiceDetailPage(newPage, domain);
      await expect(invoiceDetailPage.isDBPageDisplay("Invoice detail")).toBeTruthy();
      expect.soft(await invoiceDetailPage.verifyInvoiceDetail(caseConf.invoice_info3_dutch)).toBe(true);
      await invoiceDetailPage.page.close();
    });

    await test.step(`Verify invoice thứ 2 > Click vào invoice  ger man `, async () => {
      await balancePage.filterWithConditionDashboard("More filters", caseConf.filter_german);
      // verify Invoice at Invoice page
      expect.soft(await invoicePage.verifyInvoice(caseConf.invoice_info3_german)).toBe(true);

      const [newPage] = await Promise.all([context.waitForEvent("page"), invoicePage.clickNewestInvoice()]);
      invoiceDetailPage = new InvoiceDetailPage(newPage, domain);
      await expect(invoiceDetailPage.isDBPageDisplay("Invoice detail")).toBeTruthy();
      expect.soft(await invoiceDetailPage.verifyInvoiceDetail(caseConf.invoice_info3_german)).toBe(true);
      await invoiceDetailPage.page.close();
    });
  });
});
