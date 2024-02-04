import { test, expect } from "@core/fixtures";
import { CollectionAPI } from "@pages/api/dashboard/collection";
import { RedirectsAPI } from "@pages/api/dashboard/redirects";
import { ProductAPI } from "@pages/api/product";
import { CollectionPage } from "@pages/dashboard/collections";
import { OnlineStorePage } from "@pages/dashboard/online_store";
import { ProductPage } from "@pages/dashboard/products";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";
import { SFCollection } from "@pages/storefront/collection";
import { SFHome } from "@pages/storefront/homepage";
import { SFProduct } from "@pages/storefront/product";
import { Page } from "@playwright/test";
import { CreateCustomCollectionResponse, CreateNEProductResponse, PageResponse } from "@types";

const softAssertion = expect.configure({ soft: true, timeout: 5000 });
let prodAPI: ProductAPI;
let tabSF: Page;
let productPage: ProductPage;
let collectionPage: CollectionPage;
let redirectsPage: OnlineStorePage;
let collectionAPI: CollectionAPI;
let redirectsAPI: RedirectsAPI;
let pages: OtherPage;
let accessToken: string;
const productIds = [];
const collectionIds = [];
const redirectIds = [];

test.describe("Check redirect URL", () => {
  test.beforeAll(async ({ token, conf }) => {
    const { access_token: shopToken } = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = shopToken;
  });

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    prodAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    productPage = new ProductPage(dashboard, conf.suiteConf.domain);
    collectionPage = new CollectionPage(dashboard, conf.suiteConf.domain);
    redirectsPage = new OnlineStorePage(dashboard, conf.suiteConf.domain);
    collectionAPI = new CollectionAPI(conf.suiteConf.domain, authRequest);
    redirectsAPI = new RedirectsAPI(conf.suiteConf.domain, authRequest);
    pages = new OtherPage(dashboard, conf.suiteConf.domain);
    pages.setAccessToken(accessToken);

    await test.step("Check & delete unwanted products", async () => {
      const listProducts = await prodAPI.getAllProduct(conf.suiteConf.domain);
      listProducts.forEach(prod => {
        if (prod.title !== conf.suiteConf.last_product) {
          productIds.push(prod.id);
        }
      });
      if (productIds.length > 0) {
        await prodAPI.deleteProducts(productIds);
        productIds.length = 0;
      }
    });

    await test.step("Check & delete unwanted collections", async () => {
      const collResponse = await collectionAPI.getAll();
      const listCollections = collResponse.collections;
      listCollections.forEach(coll => {
        collectionIds.push(coll.id);
      });
      if (collectionIds.length > 0) {
        for (const id of collectionIds) {
          await collectionAPI.delete(id);
          collectionIds.shift();
        }
      }
    });

    await test.step("Check & delete unwanted redirects url", async () => {
      const redirectsList = await redirectsAPI.getListUrlRedirects();
      redirectsList.forEach(url => {
        redirectIds.push(url.id);
      });
      if (redirectIds.length > 0) {
        await redirectsAPI.deleteUrlRedirects(redirectIds);
        redirectIds.length = 0;
      }
    });
  });

  test(`@SB_OLS_RDU_15 Redirect Product_Check redirect product khi không tạo redirect đến url mới`, async ({
    cConf,
    conf,
    context,
  }) => {
    let prodA: CreateNEProductResponse;

    await test.step("Pre-condition: Tạo product test", async () => {
      prodA = await prodAPI.createNewProduct(cConf.product_info);
    });

    const prodAUrl = `https://${conf.suiteConf.domain}/products/${prodA.handle}`;
    const editedUrl = `https://${conf.suiteConf.domain}/products/${prodA.handle}1`;

    await test.step(`Mở product A trong dashboard có url là products/product-handle-a`, async () => {
      await productPage.goto(`admin/products/${prodA.id}`);
    });

    await test.step(`Tại Search Engine listing preview click Edit website SEO`, async () => {
      await productPage.editWebsiteSEOBtn.click();
    });

    await test.step("Verify hiển thị các phần mở rộng Page title, Meta description, URL and Handle", async () => {
      await softAssertion(productPage.pageTitle).toBeVisible();
      await softAssertion(productPage.metaDescription).toBeVisible();
      await softAssertion(productPage.urlAndHandle).toBeVisible();
    });

    await test.step(`Edit url của product thành products/product-handle-a1`, async () => {
      await productPage.urlAndHandleTextBox.click();
      await productPage.page.keyboard.press("End");
      await productPage.urlAndHandleTextBox.type("1");
    });

    await test.step("Verify checkbox Create a URL redirect from ... hiển thị và chưa tick", async () => {
      await softAssertion(productPage.createAUrlRedirectCheckbox).toBeVisible();
      await softAssertion(productPage.createAUrlRedirectCheckbox).not.toBeChecked();
    });

    await test.step(`Click Save button, ko tick check box`, async () => {
      await productPage.saveChangesBtn.click();
    });

    await test.step("Verify save thành công", async () => {
      const successToast = productPage
        .genLoc(productPage.xpathToastMessage)
        .filter({ hasText: "Product was successfully saved!" });
      await softAssertion(successToast).toBeVisible();
    });

    await test.step(`Vào URL redirects`, async () => {
      await productPage.goto(conf.suiteConf.redirects_page_url);
    });

    await test.step("Verify chưa tạo record redirect từ products/product-handle-a -> products/product-handle-a1", async () => {
      const redirectRow = redirectsPage.rowRedirectUrl.filter({
        hasText: `/products/${prodA.handle} /products/${prodA.handle}1`,
      });
      await softAssertion(redirectRow).toBeHidden();
    });

    await test.step(`Ngoài SF mở URL {domain}/products/product-handle-a`, async () => {
      tabSF = await context.newPage();
      await tabSF.goto(prodAUrl);
    });

    const storefront = new SFProduct(tabSF, conf.suiteConf.domain);
    await test.step("Verify open page 404 not found", async () => {
      await softAssertion(storefront.genLoc(storefront.xpathNotFound)).toBeVisible();
    });

    await test.step(`Ngoài SF mở URL {domain}/products/product-handle-a1`, async () => {
      await tabSF.goto(editedUrl);
    });

    await test.step("Verify redirect new url", async () => {
      await softAssertion(storefront.genLoc(storefront.xpathNotFound)).toBeHidden();
      await softAssertion(tabSF).toHaveURL(new RegExp(`products/${prodA.handle}`));
    });
  });

  test(`@SB_OLS_RDU_16 Redirect Product_Check redirect url product khi có tạo redirect đến url mới`, async ({
    context,
    cConf,
    conf,
  }) => {
    let prodA: CreateNEProductResponse;
    await test.step("Pre-condition: Tạo product test", async () => {
      prodA = await prodAPI.createNewProduct(cConf.product_info);
    });

    const prodAUrl = `https://${conf.suiteConf.domain}/products/${prodA.handle}`;
    const editedUrl = `https://${conf.suiteConf.domain}/products/${prodA.handle}1`;

    await test.step(`Mở product A trong dashboard có url là products/product-handle-a`, async () => {
      await productPage.goto(`admin/products/${prodA.id}`);
    });

    await test.step(`Tại Search Engine listing preview click Edit website SEO`, async () => {
      await productPage.editWebsiteSEOBtn.click();
    });

    await test.step("Verify hiển thị các phần mở rộng Page title, Meta description, URL and Handle", async () => {
      await softAssertion(productPage.pageTitle).toBeVisible();
      await softAssertion(productPage.metaDescription).toBeVisible();
      await softAssertion(productPage.urlAndHandle).toBeVisible();
    });

    await test.step(`Edit url của product thành products/product-handle-a1`, async () => {
      await productPage.urlAndHandleTextBox.click();
      await productPage.page.keyboard.press("End");
      await productPage.urlAndHandleTextBox.type("1");
    });

    await test.step("Verify checkbox Create a URL redirect from ... hiển thị và chưa tick", async () => {
      await softAssertion(productPage.createAUrlRedirectCheckbox).toBeVisible();
      await softAssertion(productPage.createAUrlRedirectCheckbox).not.toBeChecked();
    });

    await test.step(`Tick check box và Save button`, async () => {
      await productPage.createAUrlRedirectCheckbox.check();
      await productPage.saveChangesBtn.click();
    });

    await test.step("Verify save thành công", async () => {
      const successToast = productPage
        .genLoc(productPage.xpathToastMessage)
        .filter({ hasText: "Product was successfully saved!" });
      await softAssertion(successToast).toBeVisible();
    });

    await test.step(`Vào URL redirects`, async () => {
      await productPage.goto(conf.suiteConf.redirects_page_url);
    });

    await test.step("Verify đã có record redirect từ products/product-handle-a -> products/product-handle-a1", async () => {
      const redirectRow = redirectsPage.rowRedirectUrl.filter({
        hasText: `/products/${prodA.handle} /products/${prodA.handle}1`,
      });
      await softAssertion(redirectRow).toBeVisible();
    });

    await test.step(`Ngoài SF mở URL {domain}/products/product-handle-a`, async () => {
      tabSF = await context.newPage();
      await tabSF.goto(prodAUrl);
    });

    const storefront = new SFProduct(tabSF, conf.suiteConf.domain);
    await test.step("Verify redirect đến url mới", async () => {
      await softAssertion(storefront.genLoc(storefront.xpathNotFound)).toBeHidden();
      await softAssertion(tabSF).toHaveURL(new RegExp(`products/${prodA.handle}1`));
    });

    await test.step(`Ngoài SF mở URL {domain}/products/product-handle-a1`, async () => {
      await tabSF.goto(editedUrl);
    });

    await test.step("Verify mở đúng url", async () => {
      await softAssertion(storefront.genLoc(storefront.xpathNotFound)).toBeHidden();
      await softAssertion(tabSF).toHaveURL(new RegExp(`products/${prodA.handle}1`));
    });
  });

  test(`@SB_OLS_RDU_17 Redirect Collection_Check hiển thị redirect collection khi có tạo redirect đến url mới`, async ({
    cConf,
    context,
    conf,
  }) => {
    let colResponse: CreateCustomCollectionResponse;
    await test.step("Pre-condition: Create collection test", async () => {
      colResponse = await collectionAPI.create(cConf.collection_data);
    });

    const collectionInfo = colResponse.custom_collection;
    const collectionPath = `collections/${collectionInfo.handle}`;
    const editedPath = `collections/${collectionInfo.handle}1`;

    await test.step(`Trong dashboard mở collection 1 (có url là collections/collection1)`, async () => {
      await collectionPage.goto(`admin/collections/${collectionInfo.id}`);
    });

    await test.step(`Edit url của collection thành collections/collection2`, async () => {
      await collectionPage.editWebsiteSEOBtn.click();
      await collectionPage.urlAndHandleTextBox.click();
      await collectionPage.page.keyboard.press("End");
      await collectionPage.urlAndHandleTextBox.type("1");
    });

    await test.step("Verify hiển thị checkbox Create a URL redirect for ....", async () => {
      await softAssertion(collectionPage.createAUrlRedirectCheckbox).toBeVisible();
      await softAssertion(collectionPage.createAUrlRedirectCheckbox).not.toBeChecked();
    });

    await test.step(`Check vào check box "Create a URL ..."`, async () => {
      await collectionPage.createAUrlRedirectCheckbox.check();
    });

    await test.step(`Click Save button`, async () => {
      await collectionPage.saveChangesBtn.click();
    });

    await test.step("Verify save thành công", async () => {
      const toastSuccess = collectionPage
        .genLoc(collectionPage.xpathToastMessage)
        .filter({ hasText: "Saved collection!" });
      await softAssertion(toastSuccess).toBeVisible();
    });

    await test.step(`Mở URL redirects`, async () => {
      await collectionPage.goto(conf.suiteConf.redirects_page_url);
    });

    await test.step("Verify URL redirect is created", async () => {
      const redirectRow = redirectsPage.rowRedirectUrl.filter({
        hasText: `/collections/${collectionInfo.handle} /collections/${collectionInfo.handle}1`,
      });
      await softAssertion(redirectRow).toBeVisible();
    });

    tabSF = await context.newPage();
    const storefront = new SFCollection(tabSF, conf.suiteConf.domain);
    await test.step(`Ngoài Sf mở url {domain}/collections/collection1`, async () => {
      await storefront.goto(collectionPath);
    });

    await test.step("Verify redirect to new URL", async () => {
      await softAssertion(tabSF).toHaveURL(new RegExp(`${collectionInfo.handle}1`));
    });

    await test.step(`Ngoài Sf mở url {domain}/collections/collection2`, async () => {
      await storefront.goto(editedPath);
    });

    await test.step("Verify redirect to new URL", async () => {
      await softAssertion(tabSF).toHaveURL(new RegExp(`${collectionInfo.handle}1`));
      await softAssertion(storefront.genLoc(storefront.xpathNotFound)).toBeHidden();
    });
  });

  test(`@SB_OLS_RDU_18 Redirect Collection_Check hiển thị redirect collection khi không tạo redirect đến url mới`, async ({
    cConf,
    context,
    conf,
  }) => {
    let colResponse: CreateCustomCollectionResponse;
    await test.step("Pre-condition: Create collection test", async () => {
      colResponse = await collectionAPI.create(cConf.collection_data);
    });

    const collectionInfo = colResponse.custom_collection;
    const collectionPath = `collections/${collectionInfo.handle}`;
    const editedPath = `collections/${collectionInfo.handle}1`;

    await test.step(`Trong dashboard mở collection 1 (có url là collections/collection1)`, async () => {
      await collectionPage.goto(`admin/collections/${collectionInfo.id}`);
    });

    await test.step(`Edit url của collection thành collections/collection2`, async () => {
      await collectionPage.editWebsiteSEOBtn.click();
      await collectionPage.urlAndHandleTextBox.click();
      await collectionPage.page.keyboard.press("End");
      await collectionPage.urlAndHandleTextBox.type("1");
    });

    await test.step("Verify hiển thị checkbox Create a URL redirect for ....", async () => {
      await softAssertion(collectionPage.createAUrlRedirectCheckbox).toBeVisible();
      await softAssertion(collectionPage.createAUrlRedirectCheckbox).not.toBeChecked();
    });

    await test.step(`Click Save button không click checkbox "Create a URL ..."`, async () => {
      await collectionPage.saveChangesBtn.click();
    });

    await test.step("Verify save thành công", async () => {
      const toastSuccess = collectionPage
        .genLoc(collectionPage.xpathToastMessage)
        .filter({ hasText: "Saved collection!" });
      await softAssertion(toastSuccess).toBeVisible();
    });

    await test.step(`Mở URL redirects`, async () => {
      await collectionPage.goto(conf.suiteConf.redirects_page_url);
    });

    await test.step("Verify URL redirect chưa được tạo", async () => {
      const redirectRow = redirectsPage.rowRedirectUrl.filter({
        hasText: `/collections/${collectionInfo.handle} /collections/${collectionInfo.handle}1`,
      });
      await softAssertion(redirectRow).toBeHidden();
    });

    tabSF = await context.newPage();
    const storefront = new SFCollection(tabSF, conf.suiteConf.domain);
    await test.step(`Ngoài Sf mở url {domain}/collections/collection1`, async () => {
      await storefront.goto(collectionPath);
    });

    await test.step("Verify hiển thị page not found", async () => {
      await softAssertion(storefront.genLoc(storefront.xpathNotFound)).toBeVisible();
    });

    await test.step(`Ngoài Sf mở url {domain}/collections/collection2`, async () => {
      await storefront.goto(editedPath);
    });

    await test.step("Verify redirect to new URL", async () => {
      await softAssertion(tabSF).toHaveURL(new RegExp(`${collectionInfo.handle}1`));
      await softAssertion(storefront.genLoc(storefront.xpathNotFound)).toBeHidden();
    });
  });

  test(`@SB_OLS_RDU_20 Redirect Page_Check hiển thị redirect page khi có tạo redirect đến url mới`, async ({
    cConf,
    context,
    conf,
  }) => {
    let pagesInfo: PageResponse;
    await test.step("Pre-condition: Tạo pages test", async () => {
      pagesInfo = await pages.createPage(cConf.page_data);
    });

    await test.step(`Vào Dashboard =>Online Store => Pages Mở page 1 (url pages/page1)`, async () => {
      await pages.goto(`admin/pages/${pagesInfo.id}`);
    });

    await test.step(`Edit url của page thành pages/page2`, async () => {
      await pages.editWebsiteSEOBtn.click();
      await pages.urlAndHandleTextBox.click();
      await pages.urlAndHandleTextBox.press("End");
      await pages.urlAndHandleTextBox.type("1");
    });

    await test.step(`Verify checkbox "Create a URL redirect..."`, async () => {
      await softAssertion(pages.createAUrlRedirectCheckbox).toBeVisible();
      await softAssertion(pages.createAUrlRedirectCheckbox).not.toBeChecked();
    });

    await test.step(`Tick vào check box "Create a URL ..."`, async () => {
      await pages.createAUrlRedirectCheckbox.check();
    });

    await test.step(`Click button save`, async () => {
      await pages.saveChangesBtn.click();
    });

    await test.step(`Mở URL redirects`, async () => {
      await pages.goto(conf.suiteConf.redirects_page_url);
    });

    await test.step("Verify record redirect url mới đã được tạo", async () => {
      const expectedRedirectUrl = redirectsPage.rowRedirectUrl.filter({
        hasText: `/pages/${pagesInfo.handle} /pages/${pagesInfo.handle}1`,
      });
      await expect(expectedRedirectUrl).toBeVisible();
    });

    tabSF = await context.newPage();
    const storefront = new SFHome(tabSF, conf.suiteConf.domain);
    await test.step(`Ngoài Sf mở url {domain}/pages/page1`, async () => {
      await storefront.goto(`pages/${pagesInfo.handle}`);
    });

    await test.step("Verify redirect url", async () => {
      await softAssertion(tabSF).toHaveURL(new RegExp(`pages/${pagesInfo.handle}1`));
    });

    await test.step(`Ngoài Sf mở url {domain}/pages/page2`, async () => {
      await storefront.goto(`pages/${pagesInfo.handle}1`);
    });

    await test.step("Verify redirect url", async () => {
      await softAssertion(tabSF).toHaveURL(new RegExp(`pages/${pagesInfo.handle}1`));
    });

    await test.step("Delete data after test", async () => {
      await pages.deletePage(pagesInfo.id);
    });
  });

  test(`@SB_OLS_RDU_21 Redirect Page_Check hiển thị redirect page khi không tạo redirect đến url mới`, async ({
    cConf,
    context,
    conf,
  }) => {
    let pagesInfo: PageResponse;
    await test.step("Pre-condition: Tạo pages test", async () => {
      pagesInfo = await pages.createPage(cConf.page_data);
    });

    await test.step(`Vào Dashboard =>Online Store => PageMở page 1 => Edit SEO (url pages/page1)`, async () => {
      await pages.goto(`admin/pages/${pagesInfo.id}`);
    });

    await test.step(`Click Edit Website SEO
  Edit url của page thành pages/page2`, async () => {
      await pages.editWebsiteSEOBtn.click();
      await pages.urlAndHandleTextBox.click();
      await pages.urlAndHandleTextBox.press("End");
      await pages.urlAndHandleTextBox.type("1");
    });

    await test.step(`Không tick vào check box "Create a URL ..." & Click button save`, async () => {
      await pages.saveChangesBtn.click();
    });

    await test.step(`Mở URL redirects`, async () => {
      await redirectsPage.goto(conf.suiteConf.redirects_page_url);
    });

    tabSF = await context.newPage();
    const storefront = new SFHome(tabSF, conf.suiteConf.domain);
    await test.step(`Ngoài Sf mở url {domain}/pages/page1`, async () => {
      await storefront.goto(`pages/${pagesInfo.handle}`);
    });

    await test.step("Verify mở page not found", async () => {
      await softAssertion(storefront.genLoc(storefront.xpathNotFound)).toBeVisible();
      await softAssertion(tabSF).toHaveURL(new RegExp(`pages/${pagesInfo.handle}`));
    });

    await test.step(`Ngoài Sf mở url {domain}/pages/page2`, async () => {
      await storefront.goto(`pages/${pagesInfo.handle}1`);
    });

    await test.step("Verify mở redirect url", async () => {
      await softAssertion(storefront.genLoc(storefront.xpathNotFound)).toBeHidden();
      await softAssertion(tabSF).toHaveURL(new RegExp(`pages/${pagesInfo.handle}1`));
    });

    await test.step("Delete data after test", async () => {
      await pages.deletePage(pagesInfo.id);
    });
  });

  test(`@SB_OLS_RDU_25 Redirect URL_Check tạo redirect có format {/products/product_handle} với product_handle có tồn tại`, async ({
    cConf,
    context,
    conf,
  }) => {
    let prodTest: CreateNEProductResponse;
    await test.step("Pre-condition: Tạo product test & đi đến màn redirects", async () => {
      prodTest = await prodAPI.createNewProduct(cConf.product_info);
      await redirectsPage.goto(conf.suiteConf.redirects_page_url);
    });

    const redirectToUrl = `https://${conf.suiteConf.domain}/products/${prodTest.handle}`;
    await test.step(`- Nhập Redirect from - Nhập Redirect to product handle có tồn tại - Save`, async () => {
      await redirectsPage.createNewUrlRedirect({ from: cConf.redirect_from, to: redirectToUrl });
    });

    await test.step(`Ngoài SF, nhập link redirect from`, async () => {
      tabSF = await context.newPage();
      const storefront = new SFHome(tabSF, conf.suiteConf.domain);
      await storefront.goto(cConf.redirect_from);
    });

    await test.step("Verify redirect tới đúng URL ", async () => {
      await softAssertion(tabSF).toHaveURL(redirectToUrl);
    });
  });

  test(`@SB_OLS_RDU_26 Redirect URL_Check tạo redirect có format {domain/product_handle}  với product_handle không tồn tại`, async ({
    cConf,
    context,
    conf,
  }) => {
    await test.step("Pre-condition: Đi đến màn redirects", async () => {
      await redirectsPage.goto(conf.suiteConf.redirects_page_url);
    });

    await test.step(`- Nhập Redirect from - Nhập Redirect to product handle không tồn tại - Click Save`, async () => {
      const redirectTo = `https://${conf.suiteConf.domain}/${cConf.handle_not_exist}`;
      await redirectsPage.createNewUrlRedirect({
        from: cConf.redirect_from,
        to: redirectTo,
      });
    });

    await test.step(`Ngoài SF, nhập link redirect from`, async () => {
      tabSF = await context.newPage();
      const storefront = new SFHome(tabSF, conf.suiteConf.domain);
      await storefront.goto(cConf.redirect_from);
    });

    const storefront = new SFProduct(tabSF, conf.suiteConf.domain);
    await test.step("Verify redirect đến page not found", async () => {
      await softAssertion(tabSF).toHaveURL(new RegExp(cConf.handle_not_exist));
      await softAssertion(storefront.genLoc(storefront.xpathNotFound)).toBeVisible();
    });
  });

  test(`@SB_OLS_RDU_27 Redirect URL navigation_Tạo mới URL redirect có search 2 key`, async ({
    cConf,
    conf,
    context,
  }) => {
    test.fail(); //Bug redirect from có chứa ký tự đặc biệt ko redirect đc
    const redirectTo = `https://${conf.suiteConf.domain}/${cConf.redirect_to}`;

    await test.step("Pre-condition: mở màn URL redirect", async () => {
      await redirectsPage.goto(conf.suiteConf.redirects_page_url);
    });

    await test.step(` Nhập URL from - to và ấn save`, async () => {
      await redirectsPage.createNewUrlRedirect({
        from: cConf.redirect_from,
        to: redirectTo,
      });
    });

    await test.step(`Vào dashboard => Online Store => Navigation => URL redirects => Search text nhập ở step 2`, async () => {
      await redirectsPage.goto(conf.suiteConf.redirects_page_url);
      await redirectsPage.searchUrlRedirect(cConf.redirect_to);
    });

    await test.step("Verify hiển thị kết quả tìm kiếm", async () => {
      const expectedSearchResult = redirectsPage.rowRedirectUrl.filter({
        hasText: `/${cConf.redirect_from} ${redirectTo}`,
      });
      await softAssertion(expectedSearchResult).toBeVisible();
    });

    await test.step(` Ngoài sf, nhập link tìm kiếm theo text nhập ở step 1`, async () => {
      tabSF = await context.newPage();
      const storefront = new SFHome(tabSF, conf.suiteConf.domain);
      await storefront.goto(cConf.redirect_from);
    });

    await test.step("Verify redirect đến url mới", async () => {
      await softAssertion(tabSF).toHaveURL(redirectTo);
    });
  });

  test(`@SB_OLS_RDU_28 Redirect URL navigation_Edit URL redirect có search 2 key`, async ({ cConf, context, conf }) => {
    const redirectTo = `https://${conf.suiteConf.domain}/${cConf.redirect_to}`;

    await test.step("Pre-condition: create URL redirect", async () => {
      await redirectsPage.goto(conf.suiteConf.redirects_page_url);
      await redirectsPage.createNewUrlRedirect({
        from: cConf.redirect_from,
        to: redirectTo,
      });
      await redirectsPage.backBtn.click();
    });

    await test.step(` Edit URL from & to `, async () => {
      cConf.new_url.to = `https://${conf.suiteConf.domain}/${cConf.new_url.to}`;
      await redirectsPage.editUrlRedirect(cConf.old_url, cConf.new_url);
    });

    await test.step(`Vào dashboard => Online Store => Navigation => URL redirects => Search text nhập ở B3`, async () => {
      await redirectsPage.goto(conf.suiteConf.redirects_page_url);
      await redirectsPage.searchUrlRedirect(cConf.search_text);
    });

    await test.step("Verify kết quả search", async () => {
      const expectedSearchResult = redirectsPage.rowRedirectUrl.filter({ hasText: cConf.new_url.from });
      await softAssertion(expectedSearchResult).toBeVisible();
    });

    tabSF = await context.newPage();
    const storefront = new SFHome(tabSF, conf.suiteConf.domain);
    await test.step(` Ngoài sf, nhập link tìm kiếm theo text nhập ở b2`, async () => {
      await storefront.goto(cConf.new_url.to);
    });

    await test.step("Verify page url", async () => {
      await softAssertion(tabSF).toHaveURL(cConf.new_url.to);
    });

    await test.step(` Ngoài sf, nhập link tìm kiếm theo text nhập ở b2`, async () => {
      await storefront.goto(cConf.redirect_from);
      await tabSF.waitForLoadState("networkidle");
    });

    await test.step("Verify page url", async () => {
      const expectedUrl = `https://${conf.suiteConf.domain}/${cConf.redirect_from}`;
      await softAssertion(tabSF).toHaveURL(expectedUrl);
    });
  });

  test(`@SB_OLS_RDU_29 Redirect URL_Check tạo redirect tới 1 link`, async ({ cConf, context, conf }) => {
    const redirectTo = `https://${conf.suiteConf.domain}/${cConf.redirect_to}`;
    await test.step("Pre-condition: đến màn create redirect url", async () => {
      await redirectsPage.goto(conf.suiteConf.redirects_page_url);
    });

    await test.step(`
  Nhập Redirect from
  Nhập Redirect to tới link tới trang bất kì
  Click save
  `, async () => {
      await redirectsPage.createNewUrlRedirect({
        from: cConf.redirect_from,
        to: redirectTo,
      });
    });

    await test.step(`Ngoài SF, nhập link redirect from`, async () => {
      tabSF = await context.newPage();
      const storefront = new SFHome(tabSF, conf.suiteConf.domain);
      await storefront.goto(cConf.redirect_from);
    });

    await test.step("Verify redirect to new url", async () => {
      await softAssertion(tabSF).toHaveURL(redirectTo);
    });
  });
});
