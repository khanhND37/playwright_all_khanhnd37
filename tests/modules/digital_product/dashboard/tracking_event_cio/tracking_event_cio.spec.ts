import { expect, test } from "@core/fixtures";
import { DigitalProductPage } from "@pages/dashboard/digital_product";
import { EventCIO } from "@pages/customer_io/tracking_event_cio";
import { ProductDetailAPI } from "@pages/api/dpro/product_detail";

test.describe("Verify event trên customer io", async () => {
  let dproductPage: DigitalProductPage;
  let productId;
  let customerIOPage: EventCIO;
  let productInf;
  let sectionId;
  let lectureId;
  let pageTemplateId;

  test.beforeEach(async ({ dashboard, conf, page }) => {
    productInf = conf.caseConf.product;
    customerIOPage = new EventCIO(page, conf.suiteConf.domain);
    dproductPage = new DigitalProductPage(dashboard, conf.suiteConf.domain);
    await customerIOPage.loginCustomerIo(conf.suiteConf.email_customer, conf.suiteConf.pwd);
    await customerIOPage.selectWorkspaces(conf.suiteConf.cio_workspaces);
    await page.waitForSelector("//h1[normalize-space()='Dashboard']");
  });

  test(`Kiểm tra bắn các event: "create_online_course", "create_digital_download",
   "create_coaching_session" khi merchant tạo product digital @SB_CTE_SCE_2`, async ({ conf }) => {
    for (let i = 0; i < conf.caseConf.products.length; i++) {
      const item = conf.caseConf.products[i];

      await test.step(`Thực hiện tạo product digital`, async () => {
        await dproductPage.navigateToMenu("Products");
        await dproductPage.openAddProductScreen();
        await dproductPage.addNewProduct(item.title, item.handle, item.product_type);
        productId = await dproductPage.getDigitalProductID();
        await expect(dproductPage.genLoc("(//*[normalize-space() = 'General'])[1]")).toBeVisible();
      });

      await test.step(`Kiểm tra bắn event create product lên cio`, async () => {
        await customerIOPage.selectModule(conf.suiteConf.module);
        await customerIOPage.addFilterEvent(conf.suiteConf.activity_type, item.event_name);
        const attributeEventCIO = await customerIOPage.getAttributeEvent(conf.suiteConf.name, conf.suiteConf.email);
        expect(attributeEventCIO).toEqual(
          expect.objectContaining({
            productId: productId,
            productType: item.product_type,
            productName: item.title,
          }),
        );
        await customerIOPage.selectModule("Dashboard");
      });
    }
  });
  test(`Kiểm tra bắn bắn event "add_course_section" lên cio @SB_CTE_SCE_7`, async ({ dashboard, conf }) => {
    dproductPage = new DigitalProductPage(dashboard, conf.suiteConf.domain);
    await dashboard.goto(`https://${conf.suiteConf.domain}/admin/creator/products?page=1`);
    await dproductPage.openAddProductScreen();
    await dproductPage.addNewProduct(productInf.title, productInf.handle, productInf.product_type);
    productId = await dproductPage.getDigitalProductID();
    await dproductPage.switchTab("Content");
    for (let i = 0; i < conf.caseConf.sections.length; i++) {
      const item = conf.caseConf.sections[i];
      await test.step(`Thực hiện tạo section cho product online course`, async () => {
        await dproductPage.clickAddSection();
        await dproductPage.inputSectionOrLectureInfo(item.section_title, item.section_description, item.section_status);
        await dproductPage.clickSaveGeneral();
        await expect(dproductPage.genLoc(`//div[normalize-space()='${item.section_title}']`)).toBeVisible();
        const xpathEditSection = `(//div[normalize-space()='${item.section_title}'])[last()]`;
        await dashboard.locator(xpathEditSection).click();
        sectionId = await dproductPage.getDigitalChapterID();
        await dproductPage.clickBackScreen();
      });

      await test.step(`Kiểm tra bắn event "add_course_section" lên cio`, async () => {
        await customerIOPage.selectModule(conf.suiteConf.module);
        await customerIOPage.addFilterEvent(conf.suiteConf.activity_type, conf.caseConf.event_name);
        const attributeEventCIO = await customerIOPage.getAttributeEvent(conf.suiteConf.name, conf.suiteConf.email);
        expect(attributeEventCIO).toEqual(
          expect.objectContaining({
            productId: productId,
            productType: productInf.product_type,
            productName: productInf.title,
            productPricingType: productInf.product_pricing_type,
            sectionId: sectionId,
            sectionName: item.section_title,
          }),
        );
        await customerIOPage.selectModule("Dashboard");
      });
    }
  });

  test(`Kiểm tra bắn event và nội dung event "customize_sales_page" khi merchant customize sales page
  lần đầu tiên cho product @SB_CTE_SCE_6`, async ({ dashboard, conf, authRequest }) => {
    const productDetailAPI = new ProductDetailAPI(conf.suiteConf.domain, authRequest);
    for (let i = 0; i < conf.caseConf.products.length; i++) {
      const item = conf.caseConf.products[i];

      await test.step(`Thực hiện customize sales page cho một product ở shop creator`, async () => {
        await dashboard.goto(`https://${conf.suiteConf.domain}/admin/creator/products?page=1`);
        await dashboard.waitForSelector("//span[normalize-space()='Add product']");
        await dproductPage.openAddProductScreen();
        await dashboard.waitForSelector(
          "//*[normalize-space() = 'Title']/parent::div//input[@class = 'sb-input__input']",
        );
        await dproductPage.addNewProduct(item.title, item.handle, item.product_type);
        productId = await dproductPage.getDigitalProductID();
        if (item.product_pricing_type === "One-time payment") {
          await dproductPage.switchTab("Pricing");
          await dashboard.waitForSelector("(//button[contains(@class,'sb-button--select')])[1]");
          await dproductPage.settingPricingTab(item.product_pricing_type, item.pricing_title, item.amount);
        }
        await dproductPage.selectTemplateCustomizeSalePage();
        const pageTemplateAPI = await productDetailAPI.getTemplateCustomizeSalesPage(conf.suiteConf.domain);
        pageTemplateId = pageTemplateAPI.result.templates[0].id.toString();
        expect(dashboard.url()).toContain(conf.caseConf.product_path);
      });

      await test.step(`Kiểm tra attribute event "customize_sales_page" bắn lên CIO, module Activity Logs`, async () => {
        await customerIOPage.selectModule(conf.suiteConf.module);
        await customerIOPage.addFilterEvent(conf.suiteConf.activity_type, item.event_name);
        const attributeEventCIO = await customerIOPage.getAttributeEvent(conf.suiteConf.name, conf.suiteConf.email);
        expect(attributeEventCIO).toEqual(
          expect.objectContaining({
            productId: productId,
            productType: item.product_type,
            productName: item.title,
            productPricingType: item.product_pricing_type,
            pageTemplateId: pageTemplateId,
          }),
        );
        await customerIOPage.selectModule("Dashboard");
      });
    }
  });

  test(`Kiểm tra bắn event "add_course_lecture" khi merchant tạo lecture
   trong product type online course @SB_CTE_SCE_8`, async ({ dashboard, conf, page }) => {
    await dproductPage.navigateToMenu("Products");
    await dproductPage.openAddProductScreen();
    await dproductPage.addNewProduct(productInf.title, productInf.handle, productInf.product_type);
    productId = await dproductPage.getDigitalProductID();
    await dproductPage.switchTab("Content");
    await dproductPage.clickAddSection();
    await dproductPage.inputSectionOrLectureInfo(
      conf.caseConf.section.section_title,
      conf.caseConf.section.section_description,
      conf.caseConf.section.section_status,
    );
    await dproductPage.clickSaveGeneral();
    const xpathEditSection = `(//div[normalize-space()='${conf.caseConf.section.section_title}'])[last()]`;
    await dashboard.locator(xpathEditSection).click();
    sectionId = await dproductPage.getDigitalChapterID();
    await dproductPage.clickBackScreen();

    for (let i = 0; i < conf.caseConf.lectures.length; i++) {
      const item = conf.caseConf.lectures[i];
      await test.step(`Thực hiện tạo lecture trong section của một product type online course`, async () => {
        await dproductPage.clickAddLecture(conf.caseConf.section.section_title);
        await dproductPage.inputSectionOrLectureInfo(item.title, item.description, item.status);
        await dproductPage.clickSaveGeneral();
        expect(await dproductPage.getTextOfToast("success")).toEqual("Added lesson successfully!");
        lectureId = await dproductPage.getDigitalLessonID();
        await dproductPage.clickBackScreen();
      });

      await test.step(`Kiểm tra attribute event "add_course_lecture" bắn lên CIO, module Activity Logs`, async () => {
        await customerIOPage.selectModule(conf.suiteConf.module);
        await customerIOPage.addFilterEvent(conf.suiteConf.activity_type, conf.caseConf.event_name);
        await page.waitForSelector("(//tr[@class='tr--clickable '])[1]");
        const attributeEventCIO = await customerIOPage.getAttributeEvent(conf.suiteConf.name, conf.suiteConf.email);
        expect(attributeEventCIO).toEqual(
          expect.objectContaining({
            productId: productId,
            productType: productInf.product_type,
            productName: productInf.title,
            productPricingType: productInf.product_pricing_type,
            sectionName: conf.caseConf.section.section_title,
            sectionId: sectionId,
            lectureName: item.title,
            lectureId: lectureId,
          }),
        );
        await customerIOPage.selectModule("Dashboard");
      });
    }
  });
});
