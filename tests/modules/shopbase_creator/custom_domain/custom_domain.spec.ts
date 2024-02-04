import { test } from "@core/fixtures";
import { expect } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { CustomDomainPage } from "@pages/shopbase_creator/dashboard/product/custom-domain";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";

test.describe("Verify domain", () => {
  let listProductIds: Array<number>;
  let productId: number;
  let productDetailAPI: ProductAPI;
  let listProduct;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    productDetailAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    listProduct = conf.caseConf.products;
    listProductIds = [];
    const customDomainPage = new CustomDomainPage(dashboard, conf.suiteConf.domain);
    //create product
    for (const product of listProduct) {
      const dataProduct = await productDetailAPI.createProduct({ product: product });
      productId = dataProduct.data.product.id;
      await productDetailAPI.publishProduct([`${productId}`], true);
      listProductIds.push(productId);
    }
    //check enable redirect = TRUE
    await dashboard.getByRole("link", { name: "Online Store" }).click();
    await dashboard.getByRole("link", { name: "Domain" }).click();
    const redirectText = await dashboard.locator(customDomainPage.xpathEnableRedirectText).textContent();
    if (redirectText.includes("Enable redirection")) {
      await dashboard.locator(customDomainPage.xpathEnableRedirectText).click();
      await dashboard.locator(customDomainPage.xpathEnableRedirectButton).click();
    }
    await dashboard.getByRole("link", { name: "Products" }).click();
  });

  test.afterEach(async ({ conf, authRequest }) => {
    productDetailAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    await test.step("Delete products after test", async () => {
      await productDetailAPI.deleteProduct(listProductIds);
    });
  });

  test(`@SB_SC_SCP_PCD_01 Verify trường Custom domain trong block Preferred link khi shop đã connect domain`, async ({
    dashboard,
    conf,
  }) => {
    const onlineCourseProduct = conf.caseConf.products[0].title;
    const firstDomain = conf.suiteConf.custom_domain[0];
    const secondDomain = conf.suiteConf.custom_domain[1];
    const enableMess = conf.caseConf.enable_redirect_mess.replace("${primary_domain}", conf.suiteConf.primary_domain);
    const customDomainPage = new CustomDomainPage(dashboard, conf.suiteConf.domain);
    const messAfterAssign = conf.caseConf.message_after_assign;
    await test.step(`Mở trang detail 1 product > đi đến tab General > click Custom domain > click vào droplist Select a domain`, async () => {
      await customDomainPage.clickTitleProduct(onlineCourseProduct);
      await dashboard.locator(customDomainPage.xpathDesignSalePageButton).isVisible();
      await customDomainPage.clickCheckBoxCustomDomain();
      await customDomainPage.clickDropDownMenu();
      await expect(dashboard.locator(customDomainPage.getCustomDomainListXpath(firstDomain))).toBeVisible();
      await expect(dashboard.locator(customDomainPage.getCustomDomainListXpath(secondDomain))).toBeVisible();
    });

    await test.step(`Chọn 1 domain`, async () => {
      await customDomainPage.selectCustomDomain(firstDomain);
      await expect(dashboard.locator(customDomainPage.getCustomDomainXpath(firstDomain))).toBeVisible();
      const enableMessage = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
      expect(enableMessage).toEqual(enableMess);
    });

    await test.step(`Click btn Cancel ở Save bar`, async () => {
      await customDomainPage.clickCancelButton();
      await expect(dashboard.locator(customDomainPage.xpathPrimaryDomainCheckBox)).toBeChecked();
      await expect(dashboard.locator(customDomainPage.xpathSelectADomain)).toBeDisabled();
    });

    await test.step(`Đi đến trang setting Domain, disable redirect domain > quay lại trang detail product `, async () => {
      //disable redirect = true
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/domain`);
      await dashboard.waitForLoadState("networkidle");
      await dashboard.locator(customDomainPage.xpathDisableRedirectText).click();
      await dashboard.locator(customDomainPage.xpathDisableRedirectButton).click();
      //vào dashboard -> product
      await customDomainPage.goToProductList();
      await dashboard.locator(customDomainPage.xpathAllProduct).isVisible();
      await customDomainPage.clickTitleProduct(onlineCourseProduct);
      //check block Preferlink
      await expect(dashboard.locator(customDomainPage.xpathPrimaryDomainCheckBox)).toBeChecked();
      await expect(dashboard.locator(customDomainPage.xpathSelectADomain)).toBeDisabled();
    });

    await test.step(`Click Custom domain`, async () => {
      await customDomainPage.clickCheckBoxCustomDomain();
      const message = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
      expect(message).toEqual(messAfterAssign);
    });

    await test.step(`Click droplist > chọn 1 domain`, async () => {
      await customDomainPage.clickDropDownMenu();
      await customDomainPage.selectCustomDomain(firstDomain);
      const message = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
      expect(message).toEqual(messAfterAssign);
      await expect(dashboard.locator(customDomainPage.getCustomDomainXpath(firstDomain))).toBeVisible();
    });

    await test.step(`Click btn Cancel ở Save bar `, async () => {
      await customDomainPage.clickCancelButton();
      await expect(dashboard.locator(customDomainPage.xpathPrimaryDomainCheckBox)).toBeChecked();
      await expect(dashboard.locator(customDomainPage.xpathSelectADomain)).toBeDisabled();
    });
  });

  test(`@SB_SC_SCP_PCD_04 Kiểm tra hiển thị block Preferred link khi switch enable redirec và disable redirect domain`, async ({
    conf,
    dashboard,
  }) => {
    const firstDomain = conf.suiteConf.custom_domain[0];
    const secondDomain = conf.suiteConf.custom_domain[1];
    const onlineCourseProduct = conf.caseConf.products[0].title;
    const primaryDomain = conf.suiteConf.primary_domain;
    const customDomainPage = new CustomDomainPage(dashboard, conf.caseConf.domain);
    const enableMess = conf.caseConf.enable_redirect_mess.replace("${primary_domain}", conf.suiteConf.primary_domain);

    await test.step(`Tại tab General, ở block Preferred link, click option > click droplist Select a domain > chọn domain  > click btn Save `, async () => {
      await customDomainPage.clickTitleProduct(onlineCourseProduct);
      await dashboard.locator(customDomainPage.xpathDesignSalePageButton).isVisible();
      await customDomainPage.clickCheckBoxCustomDomain();
      await customDomainPage.clickDropDownMenu();
      await customDomainPage.selectCustomDomain(firstDomain);
      await customDomainPage.clickSaveButton();
      const isConfirmButtonVisible = await dashboard.locator(customDomainPage.xpathConfirmButtonInPopUp).isVisible();
      if (isConfirmButtonVisible) {
        await customDomainPage.clickConfirmButton();
      }
      const message = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
      expect(message).toEqual(enableMess);
    });

    await test.step(`Truy cập domain vừa assign cho product`, async () => {
      await dashboard.goto(`https://${firstDomain}`);
      expect(dashboard.url()).toEqual(`https://${primaryDomain}/`);
    });

    await test.step(`Đi đến trang setting domain > disable redirect domain > quay về trang detail product trên > kiểm tra hiển thị block Preferred link`, async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/domain`);
      await customDomainPage.disableRedirect();
      await customDomainPage.goToProductList();
      await customDomainPage.clickTitleProduct(onlineCourseProduct);
      await dashboard.locator(customDomainPage.getCustomDomainXpath(firstDomain)).waitFor({ state: "visible" });
      await dashboard.waitForSelector(customDomainPage.getCustomDomainXpath(firstDomain));
      await expect(dashboard.locator(customDomainPage.xpathPreferLinkMess)).toBeVisible();
      const message = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
      expect(message).toEqual(conf.caseConf.disable_redirect_mess);
    });

    await test.step(`Truy cập domain vừa assign cho product`, async () => {
      await dashboard.goto(`https://${firstDomain}/`);
      await dashboard.waitForLoadState("networkidle");
      expect(dashboard.url()).toEqual(`https://${firstDomain}/`);
      //reset domain
      dashboard.goto(`https://${conf.suiteConf.domain}/admin/creator/products`);
      await dashboard.waitForEvent("load");
      await dashboard.locator(customDomainPage.xpathAllProduct).isVisible();
      await customDomainPage.clickTitleProduct(onlineCourseProduct);
      await dashboard.locator(customDomainPage.xpathDesignSalePageButton).isVisible();
      await customDomainPage.clickCheckBoxPrimaryDomain();
      await customDomainPage.clickSaveButton();
    });

    await test.step(`Trong dashboard, tạo product mới > assign domain cho product`, async () => {
      for (const item of listProduct) {
        //assign domain khi disable redirect = true
        await customDomainPage.goToProductList();
        await dashboard.locator(customDomainPage.xpathAllProduct).isVisible();
        await customDomainPage.clickTitleProduct(item.title);
        await dashboard.locator(customDomainPage.xpathDesignSalePageButton).isVisible();
        await customDomainPage.clickCheckBoxCustomDomain();
        await customDomainPage.clickDropDownMenu();
        await customDomainPage.selectCustomDomain(secondDomain);
        await customDomainPage.clickSaveButton();
        const isConfirmButtonVisible = await dashboard.locator(customDomainPage.xpathConfirmButtonInPopUp).isVisible();
        if (isConfirmButtonVisible) {
          await customDomainPage.clickConfirmButton();
        }
        const messageDisable = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
        expect(messageDisable).toEqual(`${conf.caseConf.message_after_assign}`);
        //reset domain
        await customDomainPage.goToProductList();
        await customDomainPage.clickTitleProduct(item.title);
        await dashboard.locator(customDomainPage.xpathDesignSalePageButton).isVisible();
        await customDomainPage.clickCheckBoxPrimaryDomain();
        await customDomainPage.clickSaveButton();
      }
    });

    await test.step(`Trong dashboard, đi đến trang setting domain > enable redirect domain > quay về trang detail product trên > kiểm tra hiển thị block Preferred link`, async () => {
      for (const item of listProduct) {
        //check enable redirect = TRUE
        await dashboard.getByRole("link", { name: "Online Store" }).click();
        await dashboard.getByRole("link", { name: "Domain" }).click();
        const redirectText = await dashboard.locator(customDomainPage.xpathEnableRedirectText).textContent();
        if (redirectText.includes("Enable redirection")) {
          await dashboard.locator(customDomainPage.xpathEnableRedirectText).click();
          await dashboard.locator(customDomainPage.xpathEnableRedirectButton).click();
        }
        //assign domain
        await customDomainPage.goToProductList();
        await dashboard.locator(customDomainPage.xpathAllProduct).isVisible();
        await customDomainPage.clickTitleProduct(item.title);
        await dashboard.locator(customDomainPage.xpathDesignSalePageButton).isVisible();
        await customDomainPage.clickCheckBoxCustomDomain();
        await customDomainPage.clickDropDownMenu();
        await customDomainPage.selectCustomDomain(secondDomain);
        await customDomainPage.clickSaveButton();
        const isConfirmButtonVisible = await dashboard.locator(customDomainPage.xpathConfirmButtonInPopUp).isVisible();
        if (isConfirmButtonVisible) {
          await customDomainPage.clickConfirmButton();
        }
        const messageEnable = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
        expect(messageEnable).toEqual(enableMess);
        //reset domain
        await customDomainPage.goToProductList();
        await customDomainPage.clickTitleProduct(item.title);
        await dashboard.locator(customDomainPage.xpathDesignSalePageButton).isVisible();
        await customDomainPage.clickCheckBoxPrimaryDomain();
        await customDomainPage.clickSaveButton();
      }
    });
    await test.step(`Truy cập domain vừa assign cho product`, async () => {
      await dashboard.goto(`https://${secondDomain}`);
      await dashboard.waitForLoadState("networkidle");
      expect(dashboard.url()).toEqual(`https://${primaryDomain}/`);
    });
  });

  test(`@SB_SC_SCP_PCD_09 Kiểm tra Custom domain khi shop đang enable redirect domain`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const customDomainPage = new CustomDomainPage(dashboard, conf.caseConf.domain);
    const firstDomain = conf.suiteConf.custom_domain[0];
    const secondDomain = conf.suiteConf.custom_domain[1];
    const onlineCourseProduct = conf.caseConf.products[0].title;
    const digitalDownloadProduct = conf.caseConf.products[1].title;
    const primaryDomain = conf.suiteConf.primary_domain;
    const enableMess = conf.caseConf.enable_redirect_mess.replace("${primary_domain}", conf.suiteConf.primary_domain);

    await test.step(`Click option Custom domain > chọn 1 domain chưa assign cho product nào > click Save`, async () => {
      await customDomainPage.clickTitleProduct(onlineCourseProduct);
      await dashboard.locator(customDomainPage.xpathDesignSalePageButton).isVisible();
      await customDomainPage.clickCheckBoxCustomDomain();
      await customDomainPage.chooseDomain(firstDomain);
      const isConfirmButtonVisible = await dashboard.locator(customDomainPage.xpathConfirmButtonInPopUp).isVisible();
      if (isConfirmButtonVisible) {
        await customDomainPage.clickConfirmButton();
      }
      const message = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
      expect(message).toEqual(enableMess);
      await expect(dashboard.locator(customDomainPage.getCustomDomainXpath(firstDomain))).toBeVisible();
    });

    await test.step(`Click vào droplist > kiểm tra hiển thị thêm text current ở cạnh domain vừa chọn`, async () => {
      dashboard.reload();
      await customDomainPage.clickDropDownMenu();
      await expect(dashboard.locator(customDomainPage.xpathCurrentText)).toBeVisible();
    });

    await test.step(`Click option Primary domain > click btn Cancel > kiểm tra trạng thái hiển thị block Preferred link`, async () => {
      await customDomainPage.clickCheckBoxPrimaryDomain();
      await customDomainPage.clickCancelButton();
      await expect(dashboard.locator(customDomainPage.xpathCustomDomainCheckBox)).toBeChecked();
      const message = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
      expect(message).toEqual(enableMess);
      await expect(dashboard.locator(customDomainPage.getCustomDomainXpath(firstDomain))).toBeVisible();
    });

    await test.step(`Click btn Preview ở header > kiểm tra mở tab mới`, async () => {
      await dashboard.locator(customDomainPage.xpathPreviewHeader).click();
      await dashboard.locator(customDomainPage.xpathPreviewSalePage).waitFor({ state: "visible" });
      const [domainTab] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator(customDomainPage.xpathPreviewSalePage).click(),
      ]);
      expect(domainTab.url()).toContain(primaryDomain);
    });

    await test.step(`Quay ra màn List product, click vào icon Preview của product vừa assign domain > chọn Preview sale page`, async () => {
      await customDomainPage.goToProductList();
      await customDomainPage.clickIconPreview(onlineCourseProduct);
      const [domainTab] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard
          .getByRole("tooltip", { name: "Preview sales page Preview content as member" })
          .getByText("Preview sales page")
          .click(),
      ]);
      expect(domainTab.url()).toContain(primaryDomain);
    });

    await test.step(`Truy cập domain vừa cấu hình {domain A}`, async () => {
      await dashboard.goto(`https://${firstDomain}`);
      expect(dashboard.url()).toEqual(`https://${primaryDomain}/`);
    });

    await test.step(`Tại màn List product > chọn Product 2 > chọn Custom domain > click droplist Select a domain `, async () => {
      dashboard.goto(`https://${conf.suiteConf.domain}/admin/creator/products`);
      await customDomainPage.clickTitleProduct(digitalDownloadProduct);
      await dashboard.locator(customDomainPage.xpathDesignSalePageButton).isVisible();
      await customDomainPage.clickCheckBoxCustomDomain();
      await customDomainPage.clickDropDownMenu();
      const assignedText = await dashboard
        .locator(customDomainPage.getXpathWasAssignedTo(conf.suiteConf.custom_domain[0]))
        .textContent();
      expect(assignedText).toEqual(`was assigned to: ${onlineCourseProduct}`);
    });

    await test.step(`Click chọn domain A`, async () => {
      await customDomainPage.selectCustomDomain(firstDomain);
      const assignedMess = await dashboard.locator(customDomainPage.xpathAssignedDomain).textContent();
      expect(assignedMess).toEqual(conf.caseConf.assigned_mess);
      const assignedProductTitle = await dashboard
        .locator(customDomainPage.getXpathAssignedProductTitle(onlineCourseProduct))
        .textContent();
      expect(assignedProductTitle).toEqual(onlineCourseProduct);
      const assignedProductType = await dashboard.locator(customDomainPage.xpathAssignedProductType).textContent();
      expect(assignedProductType).toEqual("Online course");
    });

    await test.step(`Click droplist > chọn domain B chưa assign cho product nào > click btn Save `, async () => {
      await customDomainPage.chooseDomain(secondDomain);
      const isConfirmButtonVisible = await dashboard.locator(customDomainPage.xpathConfirmButtonInPopUp).isVisible();
      if (isConfirmButtonVisible) {
        await customDomainPage.clickConfirmButton();
      }
      const message = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
      expect(message).toEqual(enableMess);
    });

    await test.step(`Click lại vào droplist > chọn domain A > click btn Cancel`, async () => {
      dashboard.reload();
      await customDomainPage.clickDropDownMenu();
      await customDomainPage.selectCustomDomain(firstDomain);
      await customDomainPage.clickCancelButton();
      await expect(dashboard.locator(customDomainPage.xpathCustomDomainCheckBox)).toBeChecked();
      const message = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
      expect(message).toEqual(enableMess);
    });

    await test.step(`1. Click droplist > chọn domain A > click btn Save  > trong popup confirm. Click btn Cancel/btn X`, async () => {
      await customDomainPage.chooseDomain(firstDomain);
      const popUpTitle = await dashboard.locator(customDomainPage.xpathPopUpTitle).textContent();
      expect(popUpTitle).toEqual(conf.caseConf.pop_up_title);
      const popUpDes = await dashboard.locator(customDomainPage.xpathPopUpDes).textContent();
      expect(popUpDes).toEqual(conf.caseConf.pop_up_des);
      await customDomainPage.clickCancelPopupButton();
    });

    await test.step(`Click lại btn Save > click Confirm trong popup`, async () => {
      await customDomainPage.clickSaveButton();
      await customDomainPage.clickConfirmButton();
      dashboard.locator(customDomainPage.xpathPreferLinkMess).waitFor({ state: "visible" });
      const message = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
      expect(message).toContain(enableMess);
    });

    await test.step(`Truy cập domain vừa cấu hình {domain A}`, async () => {
      await dashboard.goto(`https://${firstDomain}`);
      expect(dashboard.url()).toEqual(`https://${primaryDomain}/`);
    });

    await test.step(`Đi đến trang detail product của product trước đó đã assign cho domain A > kiểm tra hiển thị block Preferred link`, async () => {
      dashboard.goto(`https://${conf.suiteConf.domain}/admin/creator/products`);
      await customDomainPage.clickTitleProduct(onlineCourseProduct);
      await dashboard.locator(customDomainPage.xpathDesignSalePageButton).isVisible();
      await expect(dashboard.locator(customDomainPage.xpathPrimaryDomainCheckBox)).toBeChecked();
      await expect(dashboard.locator(customDomainPage.xpathSelectADomain)).toBeVisible();
      await customDomainPage.clickCheckBoxCustomDomain();
      await customDomainPage.clickDropDownMenu();
      await expect(dashboard.locator(customDomainPage.getCustomDomainListXpath(firstDomain))).toBeVisible();
      await expect(dashboard.locator(customDomainPage.getCustomDomainListXpath(secondDomain))).toBeVisible();
      const assignedText = await dashboard.locator(customDomainPage.getXpathWasAssignedTo(firstDomain)).textContent();
      expect(assignedText).toEqual(`was assigned to: ${digitalDownloadProduct}`);
    });

    await test.step(`Click preview sale page > kiểm tra mở trang preview sang tab mới`, async () => {
      await dashboard.locator(customDomainPage.xpathPreviewHeader).click();
      const [domainTab] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator(customDomainPage.xpathPreviewSalePage).click(),
      ]);
      expect(domainTab.url()).toContain(primaryDomain);
    });
  });

  test(`@SB_SC_SCP_PCD_03 Kiểm tra Custom domain khi shop đang disable redirect domain`, async ({
    dashboard,
    conf,
    context,
  }) => {
    const customDomainPage = new CustomDomainPage(dashboard, conf.suiteConf.domain);
    const firstDomain = conf.suiteConf.custom_domain[0];
    const onlineCourseProduct = conf.caseConf.products[0].title;
    const messAfterAssign = conf.caseConf.message_after_assign;
    const messDisable = conf.caseConf.disable_redirect_mess;

    await test.step(`Click option Custom domain > chọn 1 domain chưa assign cho product nào > kiểm tra hiển thị text và domain`, async () => {
      //disable redirect
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/domain`);
      await dashboard.waitForLoadState("networkidle");
      await dashboard.locator(customDomainPage.xpathDisableRedirectText).click();
      await dashboard.locator(customDomainPage.xpathDisableRedirectButton).click();
      await customDomainPage.goToProductList();
      await customDomainPage.clickTitleProduct(onlineCourseProduct);
      await dashboard.locator(customDomainPage.xpathDesignSalePageButton).isVisible();
      await customDomainPage.clickCheckBoxCustomDomain();
      await customDomainPage.clickDropDownMenu();
      await customDomainPage.selectCustomDomain(firstDomain);
      const message = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
      expect(message).toEqual(messAfterAssign);
      await expect(dashboard.locator(customDomainPage.getCustomDomainXpath(firstDomain))).toBeVisible();
    });

    await test.step(`Click Save bar `, async () => {
      await customDomainPage.clickSaveButton();
      const isConfirmButtonVisible = await dashboard.locator(customDomainPage.xpathConfirmButtonInPopUp).isVisible();
      if (isConfirmButtonVisible) {
        await customDomainPage.clickConfirmButton();
      }
      dashboard.reload();
      await dashboard.locator(customDomainPage.xpathPreferLinkMess).waitFor({ state: "visible" });
      await dashboard.waitForLoadState("networkidle");
      const message = await dashboard.locator(customDomainPage.xpathPreferLinkMess).textContent();
      expect(message).toEqual(messDisable);
      await expect(dashboard.locator(customDomainPage.getCustomDomainXpath(firstDomain))).toBeVisible();
    });

    await test.step(`Click btn Preview ở header `, async () => {
      await dashboard.locator(customDomainPage.xpathPreviewHeader).click();
      const [domainTab] = await Promise.all([
        context.waitForEvent("page"),
        dashboard.locator(customDomainPage.xpathPreviewSalePage).click(),
      ]);
      expect(domainTab.url()).toContain(firstDomain);
    });

    await test.step(`Quay ra màn List product, click vào icon Preview của product vừa assign domain > chọn Preview sale page`, async () => {
      await customDomainPage.goToProductList();
      await customDomainPage.clickIconPreview(onlineCourseProduct);
      const [domainTab] = await Promise.all([
        context.waitForEvent("page"),
        await dashboard
          .getByRole("tooltip", { name: "Preview sales page Preview content as member" })
          .getByText("Preview sales page")
          .click(),
      ]);
      expect(domainTab.url()).toContain(firstDomain);
    });

    await test.step(`Truy cập domain vừa cấu hình {domain B}`, async () => {
      await dashboard.goto(`https://${firstDomain}`);
      expect(dashboard.url()).toContain(firstDomain);
    });

    await test.step(`Thực hiện checkout product đó > kiểm tra domain ở trang Thank you page sau khi checkout thành công`, async () => {
      await dashboard.locator(customDomainPage.xpathInputEmail).fill(conf.caseConf.input_email);
      await dashboard.locator(customDomainPage.xpathPayNowButton).click();
      expect(dashboard.url()).toContain(firstDomain);
    });

    await test.step(`Trong dashboard, thay đổi status product đã assign domain thành unpublish > Truy cập domain vừa cấu hình {domain B}`, async () => {
      await dashboard.goto(`https://${conf.suiteConf.domain}/admin/creator/products/`);
      await customDomainPage.clickTitleProduct(onlineCourseProduct);
      await dashboard.locator(customDomainPage.xpathUnpublish).click();
      await dashboard.waitForLoadState("networkidle");
      await dashboard.goto(`https://${firstDomain}/`);
      expect(await dashboard.locator(customDomainPage.xpathPageNotFound).textContent()).toEqual(
        conf.caseConf.page_not_found,
      );
    });
  });
});

test.describe("Verify custom domain trong free plan và paid plan", () => {
  let dashboardPage: DashboardPage;
  let accessToken;

  test.beforeEach(async ({ page, conf, token }) => {
    dashboardPage = new DashboardPage(page, conf.suiteConf.shop_connect_domain.domain);
    accessToken = (
      await token.getWithCredentials({
        domain: conf.suiteConf.shop_connect_domain.shop_name,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      })
    ).access_token;
    await dashboardPage.loginWithToken(accessToken);

    //check enable redirect = TRUE
    await page.getByRole("link", { name: "Online Store" }).click();
    await page.getByRole("link", { name: "Domain" }).click();
    const redirectText = await page.locator("//a[@class='s-button is-text']//parent::span").textContent();
    if (redirectText.includes("Enable redirection")) {
      await page.locator("//a[normalize-space()='Enable redirection']").click();
      await page.locator("//button//span[contains(normalize-space(),'Enable redirection')]").click();
    }
    await page.getByRole("link", { name: "Products" }).click();
  });

  test(`@SB_SC_SCP_PCD_02 Verify trường Custom domain khi chưa connect domain`, async ({ page, conf, context }) => {
    await test.step(`Đăng nhập shop dùng free package> Thực hiện check vào checkbox Custom domain`, async () => {
      await page
        .locator(
          "//span[normalize-space()='Settings' and @class='unite-ui-dashboard__aside--text text-active text-capitalize']",
        )
        .click();
      await page.locator("//p[normalize-space()='Account']//ancestor::div[@class='settings-nav__action']").click();
      await page.locator("//a[normalize-space()='Compare plans']").click();
      await page.waitForLoadState("networkidle");
      await page.locator("//div[@class='period active']").click();
      await page.locator("//div[normalize-space()='Monthly']").click();
      const isPlanFreeButtonVisible = await page
        .locator(
          "//span[normalize-space()='Free']//ancestor::div[@class='pricing forCreator']//descendant::span[normalize-space()='Choose this plan']",
        )
        .isVisible();
      if (isPlanFreeButtonVisible) {
        await page
          .locator(
            "//span[normalize-space()='Free']//ancestor::div[@class='pricing forCreator']//descendant::span[normalize-space()='Choose this plan']",
          )
          .click();
        await page.locator("//span[normalize-space()='Confirm changes']//parent::button").click();
      }
      //vào dashboard -> product
      await page.getByRole("link", { name: "Products" }).click();
      await page.getByText(`${conf.caseConf.products[0].title}`).click();
      //check vào checkbox custom domain
      await expect(page.locator("//span[normalize-space()='Select a domain']//parent::button")).toBeDisabled();
    });

    await test.step(` Đăng nhập shop dùng paid package, shop chưa connect domain`, async () => {
      await page
        .locator(
          "//span[normalize-space()='Settings' and @class='unite-ui-dashboard__aside--text text-active text-capitalize']",
        )
        .click();
      await page.locator("//p[normalize-space()='Account']//ancestor::div[@class='settings-nav__action']").click();
      await page.locator("//a[normalize-space()='Compare plans']").click();
      await page
        .locator(
          `//div[normalize-space()='${conf.suiteConf.shop_connect_domain.paid_plan}']//ancestor::div[@class='pricing forCreator']//descendant::span[normalize-space()='Choose this plan']`,
        )
        .click();
      await page.locator("//span[normalize-space()='Confirm changes']//parent::button").click();
      await page.locator("//a[@class='router-link-active' and normalize-space()='Settings']").click();
      //vào dashboard -> product
      await page.getByRole("link", { name: "Products" }).click();
      await page
        .locator("//div[normalize-space()='All products']//parent::div[@class='sb-font sb-flex sb-flex-grow']")
        .isVisible();
      await page.getByText(`${conf.caseConf.products[0].title}`).click();
      //expect primary domain is check
      await expect(page.locator("//span[@for='primary_domain']")).toBeChecked();
    });

    await test.step(`Thực hiện check vào checkbox Custom domain - Click vào textbox Select a domain- Click textlink: disable the option`, async () => {
      await page.locator("//span[@for='custom_domain']").click();
      //kiểm tra hiển thị text
      const expectedMess = conf.caseConf.enable_redirect_mess.replace(
        "${primary_domain}",
        conf.suiteConf.shop_connect_domain.primary_domain,
      );
      const message = await page
        .locator("//div[@class='sb-mt-small sb-text-caption sb-text preferred-link__help']")
        .textContent();
      expect(message).toEqual(expectedMess);
      await expect(page.locator(".preferred-link__dropdown button")).toBeDisabled();
      //click vao text link
      const [domainTab] = await Promise.all([
        context.waitForEvent("page"),
        page.locator("//a[normalize-space()='disable the option']").click(),
      ]);
      expect(domainTab.url()).toContain(`/admin/domain`);
      await domainTab.close();
    });
  });
});
