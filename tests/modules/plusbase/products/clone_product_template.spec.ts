import { expect, test } from "@core/fixtures";
import { ProductPage } from "@pages/dashboard/products";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { AccountPage } from "@pages/dashboard/accounts";
import { SFCheckout } from "@pages/storefront/checkout";
import { OrdersPage } from "@pages/dashboard/orders";
import { CollectionPage } from "@pages/dashboard/collections";
import { Settings } from "@pages/dashboard/settings";

test.describe("Clone product and collection from store template plusbase", async () => {
  let shopDomain = "";
  test("Test clone product and collection @TC_PLB_PLB_CPC_1", async ({ account, conf, token }) => {
    const accountPage = new AccountPage(account, shopDomain);
    const dashboardPage = new DashboardPage(account, shopDomain);
    const productPage = new ProductPage(account, shopDomain);
    const colectionPage = new CollectionPage(account, shopDomain);
    const setting = new Settings(account, shopDomain);
    let orderPage: OrdersPage;
    let orderId: number;
    let totalOrderSF: string;

    // get token shop template
    const shopTemplateToken = await token.getWithCredentials({
      domain: conf.suiteConf.shop_template,
      username: conf.suiteConf.email,
      password: conf.suiteConf.pwd,
    });

    // get list product from template
    const result = await productPage.getListProduct(conf.suiteConf.shop_template, shopTemplateToken.access_token);

    // get list collection from shop template
    const collection = await colectionPage.getListCollection(
      conf.suiteConf.shop_template,
      conf.caseConf.param_api.limit_collection,
      shopTemplateToken.access_token,
    );

    // create shop plusbase
    await test.step("login account shopbase and create store plusbase", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      await accountPage.addNewShop(String(currentTime));
      await accountPage.addYourContact(
        conf.caseConf.data.store_coutry,
        conf.caseConf.data.per_location,
        conf.caseConf.data.phone_number,
      );
      await accountPage.chooseBusinessModel(conf.caseConf.data.business_model, conf.caseConf.data.platform);
      const shopDomainDb = await account.innerText("//p[@class='text-truncate font-12']");
      expect(shopDomainDb).toEqual(`${currentTime}.${conf.caseConf.data.env_domain}`);
      shopDomain = shopDomainDb;
      await account.goto(`https://${shopDomain}/admin/themes`);
      await account.locator("//button[normalize-space()='Disable password']").click();
    });

    // setting trang checkout
    await test.step("setting checkout page", async () => {
      await setting.enableTestMode();
      await setting.settingCheckoutPage(conf.caseConf.checkout_setting_layout.page_checkout);
      await expect(account.locator('text="All changes were successfully saved"')).toBeVisible();
    });

    // get access token with email, password anh domain
    const shopToken = await token.getWithCredentials({
      domain: shopDomain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });

    /**
     * get list product shop plusbase -> compare product ở shop template
     * verify màn hình All Product khi mới tạo shop plusbase
     */
    await test.step("verify dislay screen product list, collection list", async () => {
      await dashboardPage.navigateToMenu("Products");
      const text = await productPage.getTextSuggestScreen();
      expect(text).toEqual(conf.caseConf.data.text1);
      await account.locator("//span[normalize-space()='Use sample products']").click();
      await account.reload();
      const dataList = await productPage.getListProduct(shopDomain, shopToken.access_token);
      expect(dataList.products.length).toEqual(result.products.length);
    });

    //get list collection shop plusbase test -> compare list collection shop template
    await test.step("verify list collection", async () => {
      const listCollection = await colectionPage.getListCollection(
        shopDomain,
        conf.caseConf.param_api.limit_collection,
        shopToken.access_token,
      );
      expect(listCollection.collections.length).toEqual(collection.collections.length);
    });

    for (let i = 0; i < conf.caseConf.keys.length; i++) {
      const key = conf.caseConf.keys[i];
      key.product_data;
      key.collection_name;
      await test.step("verify product detail, collection detail", async () => {
        // get product id product shop template
        const productListTemplate = await productPage.getProductSearch(
          conf.suiteConf.shop_template,
          key.product_data,
          shopTemplateToken.access_token,
        );
        const productIdTemplate = productListTemplate.products[0].id;

        // get data product detail shop template
        const productTemplate = await productPage.getDataProduct(
          conf.suiteConf.shop_template,
          productIdTemplate,
          shopTemplateToken.access_token,
        );

        // get collection id shop template
        const collectionListTemplate = await colectionPage.getCollectionSearch(
          conf.suiteConf.shop_template,
          key.collection_name,
          key.limit_collection,
          key.page_collection,
          shopTemplateToken.access_token,
        );
        const collectionIdTemplate = collectionListTemplate.collections[0].id;

        // get data collection detail shop template
        const collectionTemplate = await colectionPage.getDataCollection(
          conf.suiteConf.shop_template,
          collectionIdTemplate,
          shopTemplateToken.access_token,
        );

        // get product id shop plusbase test
        const productListClone = await productPage.getProductSearch(
          shopDomain,
          key.product_data,
          shopToken.access_token,
        );
        const productIdClone = productListClone.products[0].id;

        // get data product detail shop plusbase test
        const productClone = await productPage.getDataProduct(shopDomain, productIdClone, shopToken.access_token);
        const productCloneDetail = {
          title: productClone.product.title,
          body_html: productClone.product.body_html,
          images: productClone.product.images.length,
          variants: productClone.product.variants.length,
          processing_rate: productClone.product.processing_rate,
          product_type: productClone.product.product_type,
          vendor: productClone.product.vendor,
          tags: productClone.product.tags,
        };

        expect(productCloneDetail).toEqual(
          expect.objectContaining({
            title: productTemplate.product.title,
            body_html: productTemplate.product.body_html,
            images: productTemplate.product.images.length,
            variants: productTemplate.product.variants.length,
            processing_rate: productTemplate.product.processing_rate,
            product_type: productTemplate.product.product_type,
            vendor: productTemplate.product.vendor,
            tags: productTemplate.product.tags,
          }),
        );

        // get collection id shop plusbase test
        const collectionListClone = await colectionPage.getCollectionSearch(
          shopDomain,
          key.collection_name,
          key.limit_collection,
          key.page_collection,
          shopToken.access_token,
        );
        const collectionIdClone = collectionListClone.collections[0].id;

        // get collection detail shop plusbase test
        const collectionClone = await colectionPage.getDataCollection(
          shopDomain,
          collectionIdClone,
          shopToken.access_token,
        );
        const collectionCloneDetai = {
          title: collectionClone.title,
          body_html: collectionClone.body_html,
          image: collectionClone.image,
        };

        expect(collectionCloneDetai).toEqual(
          expect.objectContaining({
            title: collectionTemplate.title,
            body_html: collectionTemplate.body_html,
            image: collectionTemplate.image,
          }),
        );
      });
    }

    //checkout order từ product được clone
    await test.step("go to storefront page and checkout order", async () => {
      const checkout = new SFCheckout(account, shopDomain);
      await checkout.addProductToCartThenInputShippingAddress(conf.caseConf.product, conf.caseConf.customer_info);
      await checkout.completeOrderWithCardInfo(conf.caseConf.card_info);
      totalOrderSF = await checkout.getTotalOnOrderSummary();
      orderId = await checkout.getOrderIdBySDK();
    });

    // verify order in dashboard
    await test.step("verify order detail in dashboard", async () => {
      const checkout = new SFCheckout(account, shopDomain);
      orderPage = await checkout.openOrderByAPI(orderId, shopToken.access_token);
      const actualTotalOrder = await orderPage.getTotalOrder();
      expect(actualTotalOrder).toEqual(totalOrderSF);
    });
  });
});
