import { expect, test } from "@core/fixtures";
import { snapshotDir, verifyRedirectUrl } from "@core/utils/theme";
import { CheckoutAPI } from "@pages/api/checkout";
import { currentDate, getDateRange } from "@utils/datetime";
import { UpSell } from "@pages/new_ecom/storefront/upsell";
import { SFCheckout } from "@sf_pages/checkout";
import { SFHome } from "@sf_pages/homepage";
import { AppsAPI } from "@pages/api/apps";
import { DataAnalyticsScheduleData } from "./onboarding_dashboard";

test.describe("check upsell onboarding dashboard", () => {
  let upsell: UpSell, app: AppsAPI, data, expected, dataBeforeCheckout, suiteData, scheduleData, isSchedule: boolean;

  test.beforeEach(async ({ dashboard, conf, authRequest }, testInfo) => {
    suiteData = conf.suiteConf;
    data = conf.caseConf.data;
    expected = conf.caseConf.expect;
    upsell = new UpSell(dashboard, conf.suiteConf.domain);
    app = new AppsAPI(conf.suiteConf.domain, authRequest);
    testInfo.snapshotSuffix = "";
    testInfo.snapshotDir = snapshotDir(__filename);
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_02 Check tăng analytic của upsell khi checkout order không có product được add từ upsell`, async ({
    authRequest,
    conf,
    page,
    scheduler,
  }) => {
    test.slow();
    const checkoutAPI = new CheckoutAPI(suiteData.domain, authRequest, page);
    const SFPage = new SFHome(page, conf.suiteConf.domain);
    const checkout = new SFCheckout(page, conf.suiteConf.domain);

    const cardInfo = data.card_info;
    const productA = data.product_A;
    const productC = data.product_C;
    const productH = data.product_H;

    const rawDataJson = (await scheduler.getData()) as DataAnalyticsScheduleData;
    if (rawDataJson) {
      scheduleData = rawDataJson;
      isSchedule = true;
    } else {
      scheduleData = {
        isCheckout: false,
      };
    }

    if (!isSchedule) {
      await test.step(`Pre-condition: Get init data`, async () => {
        const [, analyticAPI] = await Promise.all([
          upsell.gotoUpsellDashboard(),
          upsell.page.waitForResponse(
            response => response.url().includes(`analytics.json`) && response.status() === 200,
          ),
        ]);

        dataBeforeCheckout = (await analyticAPI.json()).data.usell;
        if (dataBeforeCheckout == null) {
          dataBeforeCheckout = {
            total_sales: 0,
            total_orders: 0,
            total_items: 0,
          };
        }

        scheduleData.total_sales = dataBeforeCheckout.total_sales;
        scheduleData.total_orders = dataBeforeCheckout.total_orders;
        scheduleData.total_items = dataBeforeCheckout.total_items;
      });

      await test.step(`Ngoài SF, add product A, B, C từ online store vào cart và checkout success`, async () => {
        const productsCheckout = data.checkout_without_offer.products_checkout;
        await SFPage.gotoProduct(productA);
        await checkoutAPI.createAnOrderWithCreditCard({
          productsCheckout: productsCheckout,
          cardInfo: cardInfo,
        });
      });

      await test.step(`Ngoài SF, add offer pre-purchase vào cart và checkout`, async () => {
        //Add offer pre-purchase
        await SFPage.gotoProduct(productA);
        await SFPage.page.waitForLoadState("networkidle");
        await SFPage.page.locator(upsell.addCartBlock).first().click();

        await expect(SFPage.page.locator(upsell.prePurchaseDialog)).toBeVisible();
        await SFPage.page.locator(upsell.prePurchaseBtnAddCart).first().click();
        await expect(SFPage.page.locator(upsell.prePurchaseDialog)).toBeHidden();

        await expect(SFPage.page.getByText("Shipping address").first()).toBeVisible();
        await SFPage.page.waitForLoadState("networkidle");
        await checkout.completeOrderThemeV3(data.customer_info, data.card_info, data.tipping_info);
        await expect(SFPage.page.getByText("Thank you!").first()).toBeVisible();
      });

      await test.step(`Ngoài SF, add offer post-purchase vào cart và checkout`, async () => {
        await SFPage.gotoProduct(productA);
        await SFPage.page.waitForLoadState("networkidle");
        await checkoutAPI.createAnOrderWithCreditCard({
          productsCheckout: data.postpurchase.target_product,
          cardInfo: cardInfo,
          postPurchase: {
            productPpc: data.postpurchase.recommend_product[0],
            uSellId: data.postpurchase.upsell_id,
          },
        });
      });

      await test.step(`Ngoài SF, add 1 product B ở block Quantity vào cart để apply Quantity discount và checkout`, async () => {
        await SFPage.gotoProduct(productH);
        await SFPage.page.waitForLoadState("networkidle");
        await SFPage.page.locator(upsell.btnQuantityAdd).first().click();
        await expect(SFPage.page.getByText("Your cart").first()).toBeVisible();

        await SFPage.page.getByRole("link", { name: "Checkout" }).click();
        await checkout.completeOrderThemeV3(data.customer_info, data.card_info, data.tipping_info);
        await expect(SFPage.page.getByText("Thank you!").first()).toBeVisible();
      });

      await test.step(`Ngoài SF, add bundle vào cart và checkout`, async () => {
        await SFPage.gotoProduct(productA);
        await SFPage.page.waitForLoadState("networkidle");
        await SFPage.page.getByRole("button", { name: "Add all to cart" }).first().click();
        await checkout.completeOrderThemeV3(data.customer_info, data.card_info, data.tipping_info);
        await expect(page.getByText("Thank you!").first()).toBeVisible();
      });

      await test.step(`Ngoài SF, add Accessories vào cart và checkout`, async () => {
        await SFPage.gotoProduct(productC);
        await SFPage.page.locator(upsell.btnAccessories).click();
        await expect(SFPage.page.locator(upsell.quickViewDialog)).toBeVisible();

        await SFPage.page.locator(upsell.quickViewAddCartBtn).click();
        await checkout.completeOrderThemeV3(data.customer_info, data.card_info, data.tipping_info);
        await expect(page.getByText("Thank you!").first()).toBeVisible();
      });

      await test.step(`Ngoài SF, add Upsell widget vào cart và checkout`, async () => {
        await SFPage.gotoProduct(productC);
        await SFPage.page.getByText("Related Products").scrollIntoViewIfNeeded();
        await SFPage.page.locator(upsell.productCard).hover();
        await SFPage.page.getByText("Add to cart").nth(1).isVisible();

        await SFPage.page.getByText("Add to cart").nth(1).click();
        await expect(SFPage.page.locator(upsell.quickViewDialog)).toBeVisible();
        await SFPage.page.locator(upsell.quickViewAddCartBtn).click();
        await expect(SFPage.page.getByText("Your cart").first()).toBeVisible();

        await SFPage.page.getByRole("link", { name: "Checkout" }).click();
        await checkout.completeOrderThemeV3(data.customer_info, data.card_info, data.tipping_info);
        await expect(page.getByText("Thank you!").first()).toBeVisible();
      });
      scheduleData.isCheckout = true;

      await scheduler.setData(scheduleData);
      await scheduler.schedule({ mode: "later", minutes: 3 });
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
      return;
    } else {
      const dataBeforeCheckout = rawDataJson;
      await scheduler.clear();

      await test.step("Verify data analytics", async () => {
        const [, analyticAPI] = await Promise.all([
          upsell.gotoUpsellDashboard(),
          upsell.page.waitForResponse(
            response => response.url().includes(`analytics.json`) && response.status() === 200,
          ),
        ]);

        const dataAfterCheckout = (await analyticAPI.json()).data.usell;
        const totalSales =
          expected.prepurchase.sales +
          expected.postpurchase.sales +
          expected.quantity.sales +
          expected.accessories.sales +
          expected.bundle.sales +
          expected.upsell_widget.sales;

        const totalItems =
          expected.prepurchase.items +
          expected.postpurchase.items +
          expected.quantity.items +
          expected.accessories.items +
          expected.bundle.items +
          expected.upsell_widget.items;
        const totalAOI =
          Math.round(
            ((dataAfterCheckout.total_items + totalItems) / (dataAfterCheckout.total_orders + expected.orders)) * 100,
          ) / 100;
        expect(dataAfterCheckout.total_orders).toEqual(dataBeforeCheckout.total_orders + expected.orders);
        expect(dataAfterCheckout.total_sales).toEqual(dataBeforeCheckout.total_sales + totalSales);
        expect(dataAfterCheckout.total_aoi).toEqual(totalAOI);
      });
    }
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_03 Check filter analytic theo ngày`, async ({}) => {
    let dataAnalytics;
    await test.step(`Trong dashboard >> app >> Upsell`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.page.getByText("From", { exact: true }).click();
      await upsell.page.getByRole("button", { name: "Today" }).click();
      const { dateRangePickerFromValue, dateRangePickerToValue } = await getDateRange(upsell.page);
      expect(dateRangePickerFromValue && dateRangePickerToValue).toEqual(currentDate);
    });

    for (const dataTime of data) {
      await test.step(`Chọn filter theo ${dataTime}`, async () => {
        await upsell.page.getByText("From", { exact: true }).click();
        const [, analyticAPI] = await Promise.all([
          upsell.page.getByRole("button", { name: `${dataTime.time}` }).click(),
          upsell.page.waitForResponse(
            response => response.url().includes(`analytics.json`) && response.status() === 200,
          ),
        ]);

        dataAnalytics = (await analyticAPI.json()).data.usell;
        if (dataAnalytics == null) {
          dataAnalytics = {
            total_aoi: 0,
            total_orders: 0,
            total_sales: 0,
          };
        }

        await upsell.verifyAnaOfOnboardingUpsell("Total Sales from Upsells", dataAnalytics.total_sales);
        await upsell.verifyAnaOfOnboardingUpsell("Total Orders with Upsells", dataAnalytics.total_orders);
        await upsell.verifyAnaOfOnboardingUpsell("Average Order Items with Upsells", dataAnalytics.total_aoi);
      });
    }
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_05 Check search product/collection tại Search bar`, async ({ dashboard }) => {
    await test.step(`Nhập key search không match với product nào`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar(data.key_not_match);
      await expect(dashboard.getByText(expected.error_message)).toBeVisible();
    });

    await test.step(`Nhập key search có product match mà k match với collection nào`, async () => {
      await upsell.handleSearchBar(data.key_match);
      await expect(dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.key_match }).first()).toBeVisible();
    });

    await test.step(`Click mở tab Collections`, async () => {
      await dashboard.locator(upsell.collectionTabLink).filter({ hasText: "Collections" }).click();
      await expect(dashboard.getByText(expected.message_not_found)).toBeVisible();
    });

    await test.step(`Nhập key search match với các collections`, async () => {
      await upsell.handleSearchBar(data.collection_match);
      await expect(
        dashboard
          .locator(upsell.resultItemBlock)
          .filter({ hasText: new RegExp(data.collection_match) })
          .first(),
      ).toBeVisible();
    });

    await test.step(`Select 1 collection`, async () => {
      await dashboard.locator(upsell.resultProductItemArea).nth(1).click();
      const searchBar = await dashboard.getByPlaceholder("Search the Product or Collection").inputValue();
      expect(searchBar).toContain(expected.name_collection);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_07 Check hiển thị block Quantity discount với target product`, async ({
    dashboard,
  }) => {
    await test.step(`Tại Search bar, chọn product A`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar(data.product);
      await dashboard.locator(upsell.imageProduct).first().click();

      await expect(dashboard.getByText(data.text_quantity)).toHaveCount(expected.one_count_block);
      await dashboard.getByText(data.text_quantity).click();
      await expect(dashboard.locator(upsell.qtyItemBlock)).toHaveCount(expected.three_count_block);
    });

    await test.step(`Xoá 1 items`, async () => {
      await dashboard.locator(upsell.deleteIconQty).nth(1).click();
      await expect(dashboard.getByText(data.text_quantity)).toBeVisible();
    });

    await test.step(`Xoá hết các items`, async () => {
      await dashboard.locator(upsell.deleteIconSelector).first().click();
      await expect(dashboard.locator(upsell.deleteIcon)).toHaveCount(suiteData.min_block_count);
    });

    await test.step(`Click Add more button`, async () => {
      await dashboard.getByText(data.text_add).click();
      await expect(dashboard.locator(upsell.qtyItemBlock)).toHaveCount(expected.two_count_block);
      const minQtyInput = await dashboard.locator(upsell.qtyMinOneInput).inputValue();
      expect(minQtyInput).toEqual(String(expected.one_count_block));

      const discountInput = await dashboard.locator(upsell.qtyValueOneInput).inputValue();
      expect(discountInput).toEqual(String(expected.ten_count_block));
      const deleteIcons = await dashboard.locator(upsell.deleteIconSelector);
      await expect(deleteIcons).toHaveCount(expected.two_count_block);
    });

    await test.step(`Click Add more button lần nữa`, async () => {
      await dashboard.getByText(data.text_add).click();
      await expect(dashboard.locator(upsell.qtyItemBlock)).toHaveCount(expected.three_count_block);
      await expect(dashboard.getByText(data.error_message_quantity)).toHaveCount(expected.one_count_block);
    });

    await test.step(`Thay đổi Min quantity của item thứ 3 vừa add`, async () => {
      await dashboard.locator(upsell.qtyMinOneInput).fill(String(expected.ten_count_block));
      await expect(dashboard.getByText(data.error_message_quantity)).toHaveCount(expected.one_count_block);
    });

    await test.step(`Click Enable button`, async () => {
      await dashboard.getByRole("button", { name: "Enable" }).click();
      await expect(dashboard.getByText(data.text_create_successful)).toHaveCount(expected.zero_count_block);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_08 Check hiển thị block Quantity discount với target collection`, async ({
    dashboard,
  }) => {
    await test.step(`Tại Search bar, chọn collection A`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar(data.product);
      await dashboard.locator(upsell.imageProduct).first().click();
      const qtyBlock = await dashboard.getByText(data.text_quantity);
      await expect(qtyBlock).toHaveCount(expected.one_count_block);
      await qtyBlock.click();
      const itemBlock = await dashboard.locator(upsell.qtyItemBlock);
      await expect(itemBlock).toHaveCount(expected.three_count_block);
    });

    await test.step(`Xoá 1 items`, async () => {
      await dashboard.locator(upsell.deleteIconQty).nth(1).click();
      await expect(dashboard.getByText(data.text_add)).toBeVisible();
    });

    await test.step(`Xoá hết các items`, async () => {
      await dashboard.locator(upsell.deleteIconSelector).first().click();
      await expect(dashboard.locator(upsell.deleteIcon)).toHaveCount(expected.zero_count_block);
    });

    await test.step(`Click Add more button`, async () => {
      await dashboard.getByText(data.text_add).click();
      const itemBlock = await dashboard.locator(upsell.qtyItemBlock);
      await expect(itemBlock).toHaveCount(expected.two_count_block);
      const minQtyInput = await dashboard.locator(upsell.qtyMinOneInput).inputValue();
      expect(minQtyInput).toEqual(String(expected.one_count_block));

      const discountInput = await dashboard.locator(upsell.qtyValueOneInput).inputValue();
      expect(discountInput).toEqual(expected.ten_value_fill);
      const deleteIcons = await dashboard.locator(upsell.deleteIconSelector);
      await expect(deleteIcons).toHaveCount(expected.two_count_block);
    });

    await test.step(`Click Add more button lần nữa`, async () => {
      await dashboard.getByText(data.text_add).click();
      await expect(dashboard.locator(upsell.qtyItemBlock)).toHaveCount(expected.three_count_block);
    });

    await test.step(`Thay đổi Min quantity của item thứ 3 vừa add`, async () => {
      await dashboard.locator(upsell.qtyMinOneInput).fill(String(expected.three_count_block));
      await expect(dashboard.getByText(data.error_message_quantity)).toHaveCount(expected.zero_count_block);
    });

    await test.step(`Click Enable button`, async () => {
      await dashboard.getByRole("button", { name: "Enable" }).click();
      await expect(dashboard.getByText(data.text_create_successful)).toHaveCount(expected.one_count_block);
    });

    await test.step(`Delete offer after creating`, async () => {
      const listOffer = await app.getListUpsellOffers({ offer_types: "quantity", limit: 500, only_active: false });
      const quantityIds = listOffer.map(offerData => offerData.id);
      const deleteIds = quantityIds.filter(id => id !== data.offer_id);
      await app.deleteAllUpsellOffers(deleteIds);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_09 Check redirect trên block create offer Quantity discount`, async ({
    dashboard,
    context,
  }) => {
    await test.step(`Create offer Quantity discount tại màn Onboarding với target product (offer 1)`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.imageProduct).first().click();

      await expect(dashboard.getByText(data.text_quantity)).toHaveCount(expected.one_count_block);
      await dashboard.getByText(data.text_quantity).click();
      await dashboard.getByRole("button", { name: "Enable" }).click();
      await expect(dashboard.getByText(data.text_create_successful)).toBeVisible();
    });

    await test.step(`Click Continue customize this offer button`, async () => {
      const redirectEditOfferBtn = dashboard.getByRole("link", { name: "Continue customizing this offer" });
      // link will redirect to new dashboard in case attribute target="_blank" exist
      await expect(redirectEditOfferBtn).not.toHaveAttribute("target", /_blank|_self/g);
      await redirectEditOfferBtn.click();

      const titleBlock = await dashboard.getByRole("heading", { name: "Edit offer" });
      await expect(titleBlock).toBeVisible();
      const offerNameInputValue = await dashboard.getByPlaceholder("Choose an offer's name").inputValue();
      expect(offerNameInputValue).toContain(expected.offer_name_product);

      const minQtyInput = await dashboard.locator(upsell.qtyMinThreeInput).inputValue();
      expect(minQtyInput).toEqual(expected.ten_value_fill);
      const discountInput = await dashboard.locator(upsell.qtyValueThreeInput).inputValue();
      expect(discountInput).toEqual(expected.discount);
    });

    await test.step(`Create offer Quantity discount tại màn Onboarding với target product (offer 2)`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();

      await dashboard.locator(upsell.imageProduct).nth(1).click();
      await dashboard.getByText(data.text_quantity).click();
      await dashboard.getByRole("button", { name: "Enable" }).click();
    });

    await test.step(`Click Quickly create another offer button`, async () => {
      await dashboard.getByText("Quickly create another offer").click();
      await expect(dashboard.locator(upsell.qtyItemBlock)).toHaveCount(expected.three_count_block);
    });

    await test.step(`Create offer Quantity discount tại màn Onboarding với target product (offer 3)`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();

      await dashboard.locator(upsell.imageProduct).nth(2).click();
      await dashboard.getByText(data.text_quantity).click();
      await dashboard.getByRole("button", { name: "Enable" }).click();
    });

    await test.step(`Click Try on the storefront button`, async () => {
      await verifyRedirectUrl({
        page: dashboard,
        selector: upsell.navigateStorefontBtn,
        redirectUrl: expected.redirect_product,
        context,
      });
    });

    await test.step(`Create offer Quantity discount tại màn Onboarding với target collection (offer 4)`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.collectionTabLink).click();
      const collectionTabResult = await dashboard
        .locator(upsell.resultItemBlock)
        .filter({ hasText: new RegExp(data.key_collection) });

      await collectionTabResult.first().click();
      await dashboard.getByText(data.text_quantity).click();
      await dashboard.getByRole("button", { name: "Enable" }).click();
      await expect(dashboard.getByText(data.text_create_successful)).toBeVisible();
    });

    await test.step(`Click Continue customize this offer button`, async () => {
      const customizeBtn = dashboard.getByRole("link", { name: data.btn_customize });
      await customizeBtn.click();
      const detailOfferNameInput = await dashboard.getByPlaceholder("Choose an offer's name").inputValue();
      await expect(detailOfferNameInput).toContain(expected.offer_name_collection);
    });

    await test.step(`Create offer Quantity discount tại màn Onboarding với target collection (offer 5)`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.collectionTabLink).filter({ hasText: "Collections" }).click();

      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.collection_name }).first().click();
      await dashboard.getByText(data.text_quantity).click();
      await dashboard.getByRole("button", { name: "Enable" }).click();
    });

    await test.step(`Click Try on the storefront button`, async () => {
      await verifyRedirectUrl({
        page: dashboard,
        selector: upsell.navigateStorefontBtn,
        redirectUrl: expected.redirect_collection,
        context,
      });
    });
    await test.step(`Delete offer after creating`, async () => {
      const listOffer = await app.getListUpsellOffers({ offer_types: "quantity", limit: 500, only_active: false });
      const quantityIds = listOffer.map(offerData => offerData.id);
      const deleteIds = quantityIds.filter(id => id !== data.offer_id);
      await app.deleteAllUpsellOffers(deleteIds);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_10 Check hiển thị block Bundle`, async ({ dashboard }) => {
    await test.step(`Tại Search bar, chọn product A`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.product }).first().click();

      const bundleBlock = await dashboard.getByText("Encourage your customer to buy a Bundle of matching products");
      await expect(bundleBlock).toHaveCount(expected.one_count_block);
      await bundleBlock.click();
      await expect(dashboard.locator(upsell.bundleItemBlock)).toHaveCount(suiteData.max_block_count);
    });

    await test.step(`Click Enable button`, async () => {
      await dashboard.getByRole("button", { name: "Enable" }).click();
      await expect(dashboard.getByText(expected.error_message)).toBeVisible();
    });

    await test.step(`Select product B tại block Bundle`, async () => {
      const bundleItemBlock = await dashboard.locator(upsell.bundleItemBlock).filter({ hasText: data.product });
      await bundleItemBlock.first().click();
      await expect(dashboard.locator(upsell.getSelectedProduct(data.product))).toBeVisible();
    });

    await test.step(`Select 3 product tại block Bundle`, async () => {
      await dashboard.locator(upsell.bundleItemBlock).nth(1).click();
      await dashboard.locator(upsell.bundleItemBlock).nth(2).click();
      await expect(dashboard.locator(upsell.errorClass).filter({ hasText: expected.warning_message })).toBeVisible();
    });

    await test.step(`Unselect product tại list product block Bundle`, async () => {
      const bundleItemBlock = await dashboard.locator(upsell.selectedBundleBlock);
      await bundleItemBlock.nth(0).click();
      await expect(dashboard.locator(upsell.getSelectedProduct(data.product)).nth(1)).not.toBeVisible();
    });

    await test.step(`Unselect product tại list selected product block Bundle bằng cách click vào dấu X`, async () => {
      await dashboard.locator(upsell.closeSelectedBundleBlockIcon).click();
      await expect(dashboard.locator(upsell.getSelectedProduct(data.product))).not.toBeVisible();
    });

    await test.step(`Search product với key không match với product nào`, async () => {
      const searchProductInput = await dashboard.getByRole("textbox", {
        name: "Search for product name",
      });
      await searchProductInput.fill(data.key_search);
      await expect(dashboard.getByText(expected.text_not_found)).toBeVisible();
    });

    await test.step(`Search product với key có match với products`, async () => {
      const searchProductInput = await dashboard.getByRole("textbox", {
        name: "Search for product name",
      });
      await searchProductInput.fill(data.product);
      await expect(dashboard.getByText(expected.text_not_found_product)).not.toBeVisible();
    });

    await test.step(`Select products search được`, async () => {
      const bundleItemBlock = await dashboard.locator(upsell.bundleItemBlock);
      await bundleItemBlock.first().click();
      await expect(dashboard.locator(upsell.getSelectedProduct(data.product))).toBeVisible();
    });

    await test.step(`Click Enable button`, async () => {
      const enableBtn = dashboard.getByRole("button", { name: "Enable" });
      await enableBtn.click();
      await expect(dashboard.getByText(data.text_create_successful)).toBeVisible();
      const targetProduct = dashboard.locator(upsell.selectedTargetProduct).filter({ hasText: data.product });
      await expect(targetProduct).toHaveCount(expected.two_count_block);
    });

    await test.step(`Delete offer after creating`, async () => {
      const listOffer = await app.getListUpsellOffers({ offer_types: "bundle", limit: 500, only_active: false });
      const bundleIds = listOffer.map(offerData => offerData.id);
      const deleteIds = bundleIds.filter(id => id !== data.offer_id);
      await app.deleteAllUpsellOffers(deleteIds);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_11 Check tạo và redirect trên block create offer Bundle`, async ({
    dashboard,
    context,
  }) => {
    await test.step(`- Create offer Bundle tại màn Onboarding với target product A (offer 1)
  - Select product A tại block`, async () => {
      for (let i = 0; i < data.all_same_loop; i++) {
        await upsell.gotoUpsellDashboard();
        await upsell.handleSearchBar();
        await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.product }).first().click();
        await dashboard.getByText("Encourage your customer to buy a Bundle of matching products").click();

        await dashboard.locator(upsell.bundleItemBlock).nth(i).click();
        await dashboard
          .locator(upsell.bundleItemBlock)
          .nth(i + 1)
          .click();
        await dashboard.getByRole("button", { name: "Enable" }).click();

        if (i < data.all_same_loop - 1) {
          const customizeBtn = dashboard.getByRole("link", { name: data.btn_customize });
          await customizeBtn.click();

          const targetProduct = await dashboard.getByPlaceholder("Choose an offer's name").inputValue();
          expect(targetProduct).toContain(data.product);
          await expect(dashboard.locator(upsell.discountCheckbox)).not.toBeChecked();
        }
      }
    });
    await test.step(`Click Try on the storefront button`, async () => {
      await verifyRedirectUrl({
        page: dashboard,
        selector: upsell.navigateStorefontBtn,
        redirectUrl: expected.redirect_url,
        context,
      });
    });

    await test.step(`Delete offer after creating`, async () => {
      const listOffer = await app.getListUpsellOffers({ offer_types: "bundle", limit: 500, only_active: false });
      const bundleIds = listOffer.map(offerData => offerData.id);
      const deleteIds = bundleIds.filter(id => id !== data.offer_id);
      await app.deleteAllUpsellOffers(deleteIds);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_12 Check hiển thị block Accessories`, async ({ dashboard }) => {
    await test.step(`Tại Search bar, chọn product A`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.product }).first().click();

      await dashboard.getByText(expected.text_accessories).click();
      await expect(dashboard.locator(upsell.bundleItemBlock)).toHaveCount(suiteData.max_block_count);
    });

    await test.step(`Tại Search bar, chọn colleection 1`, async () => {
      await dashboard.locator(upsell.clearSearchbarIcon).click();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.collectionTabLink).click();

      await dashboard.locator(upsell.collectionTabLink).click();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.collection }).first().click();
      await expect(dashboard.locator(upsell.accessoriesItemBlock)).toHaveCount(suiteData.max_block_count);
    });

    await test.step(`Click Enable button`, async () => {
      await dashboard.getByText(expected.text_accessories).click();
      await dashboard.locator(upsell.accessoriesEnableBtn).locator("button span").filter({ hasText: "Enable" }).click();
      await dashboard.waitForSelector(upsell.errorToastMessage);
      await expect(dashboard.locator(upsell.errorToastMessage)).toBeVisible();
    });

    await test.step(`Select product B tại block Accessories `, async () => {
      await dashboard.locator(upsell.accessoriesItemBlock).first().click();
      await expect(dashboard.locator(upsell.getSelectedProduct(data.product))).toBeVisible();
    });

    await test.step(`Select 4 product tại block Accessories `, async () => {
      await dashboard.locator(upsell.accessoriesItemBlock).nth(1).click();
      await dashboard.locator(upsell.accessoriesItemBlock).nth(2).click();
      await dashboard.locator(upsell.accessoriesItemBlock).nth(3).click();

      await dashboard.waitForSelector("div.message-red");
      const errorMessage = await dashboard
        .locator(upsell.errorClass)
        .filter({ hasText: expected.warning_min_selected });
      await expect(errorMessage).toBeVisible();
    });
    await test.step(`Unselect product tại list product block Accessories `, async () => {
      await dashboard.locator(upsell.selectedAccessoriesProduct).nth(0).click();
      await expect(dashboard.locator(upsell.getSelectedProduct(data.product)).nth(1)).toBeVisible();
    });

    await test.step(`Unselect product tại list selected product block Bundle bằng cách click vào dấu X`, async () => {
      await dashboard.locator(upsell.unSelectedProduct).click();
      await expect(dashboard.locator(upsell.getSelectedProduct(data.product))).toHaveCount(expected.one_count_block);
    });

    await test.step(`Search product với key không match với product nào`, async () => {
      const searchProductInput = await dashboard.getByRole("textbox", {
        name: "Search for product name",
      });
      await searchProductInput.fill(data.key_search);
      await expect(dashboard.getByText(expected.text_not_found)).toBeVisible();
    });

    await test.step(`Search product với key có match với products`, async () => {
      const searchProductInput = await dashboard.getByRole("textbox", {
        name: "Search for product name",
      });
      await searchProductInput.fill(data.product);
      await expect(dashboard.getByText(expected.text_not_found_product)).not.toBeVisible();
    });

    await test.step(`Select products search được`, async () => {
      await dashboard.locator(upsell.accessoriesItemBlock).first().click();
      await expect(dashboard.locator(upsell.getSelectedProduct(data.product)).nth(1)).toBeVisible();
    });

    await test.step(`Click Enable button`, async () => {
      await dashboard.getByRole("button", { name: "Enable" }).click();
      await expect(dashboard.getByText(expected.text_create_successful)).toBeVisible();
      const targetProduct = dashboard.locator(upsell.selectedTargetProduct).filter({ hasText: data.product });
      await expect(targetProduct).toHaveCount(expected.two_count_block);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_13 Check tạo và redirect trên block create offer Accessories`, async ({
    dashboard,
    context,
  }) => {
    await test.step(`-Create offer accessories tại màn Onboarding với target collection 1 (offer 2)
  - Select product B, C tại block`, async () => {
      const { same_action_flow_loop: sameActionFlowLoop, all_loop: allLoop } = data;
      for (let i = 0; i < allLoop; i++) {
        await upsell.gotoUpsellDashboard();
        await upsell.handleSearchBar();
        await dashboard.locator(upsell.collectionTabLink).filter({ hasText: "Collections" }).click();
        await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.collection }).first().click();
        const accessoriesItemBlock = await dashboard.locator(upsell.accessoriesItemBlock);
        await expect(accessoriesItemBlock).toHaveCount(suiteData.max_block_count);

        const accessoriesBlock = await dashboard.getByText(expected.text_accessories);
        await accessoriesBlock.click();
        const bundleItemBlock = await dashboard.locator(upsell.accessoriesItemBlock);
        await bundleItemBlock.nth(i).click();
        await bundleItemBlock.nth(i + 1).click();

        const enableBtn = dashboard.getByRole("button", { name: "Enable" });
        await enableBtn.click();

        if (i < sameActionFlowLoop) {
          const customizeBtn = dashboard.getByRole("link", { name: data.btn_customize });
          await customizeBtn.click();
          const recommendProductBtn = dashboard.getByRole("button", { name: "Select product" });
          await recommendProductBtn.click();

          await dashboard.waitForSelector(upsell.modalBody);
          await dashboard.pause();
          const selectedRecommendProduct = await dashboard.locator(upsell.selectedProductAtModal);
          await expect(selectedRecommendProduct).toHaveCount(expected.two_count_block);
          for (let i = 0; i < sameActionFlowLoop - 1; i++) {
            const innerText = await selectedRecommendProduct.nth(i).innerText();
            expect(expected.recommend_product).toContain(innerText);
          }

          const closeRecommendModal = await dashboard
            .locator("div")
            .filter({ hasText: "Select product" })
            .locator(upsell.closeModalIcon);
          await closeRecommendModal.click();
          const recommendModal = await dashboard.locator(upsell.selectedProductModal);
          await expect(recommendModal).not.toBeVisible();
        }
        if (i === sameActionFlowLoop) {
          const viewStoreBtn = await dashboard.getByRole("button", { name: data.text_view_store });
          await viewStoreBtn.click();
          await verifyRedirectUrl({
            page: dashboard,
            selector: upsell.navigateStorefontBtn,
            redirectUrl: expected.redirect_url,
            context,
          });
        }
      }
    });

    await test.step(`Delete offer after creating`, async () => {
      const listOffer = await app.getListUpsellOffers({ offer_types: "accessory", limit: 500, only_active: false });
      const accessoriesIds = listOffer.map(offerData => offerData.id);
      const deleteIds = accessoriesIds.filter(id => id !== data.offer_id);
      await app.deleteAllUpsellOffers(deleteIds);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_16 Check tạo và redirect trên block create offer Pre-purchase`, async ({
    dashboard,
  }) => {
    await test.step(`Tại Search bar, chọn product A`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.product }).first().click();

      await dashboard.getByText(data.text_block_prepurchase).click();
      const postPurchaseItemBlock = await dashboard.locator(upsell.resultProductItem);
      await expect(postPurchaseItemBlock).toHaveCount(suiteData.max_block_count);

      const productContainerBlock = await postPurchaseItemBlock
        .filter({ hasText: data.collection })
        .first()
        .textContent();
      expect(productContainerBlock).toContain(expected.collection_name);
    });

    await test.step(`Tại Search bar, chọn collection 1`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.collectionTabLink).click();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.collection }).first().click();

      const postPurchaseBlock = await dashboard.getByText(data.text_block_prepurchase);
      await postPurchaseBlock.click();
      const postPurchaseItemBlock = await dashboard.locator(upsell.resultProductItem);
      await expect(postPurchaseItemBlock).toHaveCount(suiteData.max_block_count);
    });

    await test.step(`Click Enable button`, async () => {
      await dashboard.getByRole("button", { name: "Enable" }).click();
      await dashboard.waitForSelector(upsell.emptySelectedItemElement);
      await expect(dashboard.getByText(expected.warning_empty_message)).toBeVisible();
    });

    await test.step(`Select product B tại block Post-purchase`, async () => {
      await dashboard.locator(upsell.resultProductItem).first().click();
      await expect(dashboard.getByTitle(data.collection)).toBeVisible();
    });

    await test.step(`Select nhiều products tại block Post-purchase`, async () => {
      for (let i = 1; i < data.multiple_product_count; i++) {
        await dashboard.locator(upsell.resultProductItem).nth(i).click();
      }
      await expect(dashboard.getByText("+1")).toBeVisible();
    });

    await test.step(`Unselect product tại list product block Post-purchase`, async () => {
      await dashboard.locator(upsell.resultProductItem).first().click();
      await expect(dashboard.getByText("+1")).not.toBeVisible();
    });

    await test.step(`Unselect product tại list selected product block Post-purchase tại product đơn`, async () => {
      await dashboard.locator(upsell.resultProductItem).first().click();
      await dashboard.locator(upsell.closeSelectedItemBtn).click();
      await expect(dashboard.locator(upsell.postPurchaseProduct)).toHaveCount(expected.expected_four_block);
    });

    await test.step(`Unselect product tại list selected product block Post-purchase tại product cuối cùng chứa nhiều product`, async () => {
      await dashboard.locator(upsell.resultProductItem).nth(1).click();
      await dashboard.locator(upsell.resultProductItem).nth(5).click();
      await expect(dashboard.getByText("+2")).toBeVisible();
      await dashboard.locator(upsell.resultProductItem).first().click();
      await expect(dashboard.getByText("+2")).not.toBeVisible();
    });

    await test.step(`Click Enable button`, async () => {
      await dashboard.getByRole("button", { name: "Enable" }).click();
      await expect(dashboard.getByText(data.text_create_successful)).toHaveCount(expected.one_count_block);
    });

    await test.step(`Delete offer after creating`, async () => {
      const listOffer = await app.getListUpsellOffers({
        offer_types: "pre-purchase,post-purchase,in-cart",
        limit: 500,
        only_active: false,
      });
      const upsellIds = listOffer.map(offerData => offerData.id);
      const deleteIds = upsellIds.filter(id => id !== data.offer_id_prepurchase && id !== data.offer_id_postpurchase);
      await app.deleteAllUpsellOffers(deleteIds);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_14 Check tạo và redirect trên block create offer Post-purchase`, async ({
    dashboard,
  }) => {
    await test.step(`Tại Search bar, chọn product A`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.product }).first().click();

      await dashboard.getByText(data.text_postpurchase).click();
      await expect(dashboard.locator(upsell.resultProductItem)).toHaveCount(suiteData.max_block_count);
      const productContainerBlock = await dashboard
        .locator(upsell.resultProductItem)
        .filter({ hasText: data.collection })
        .textContent();
      expect(productContainerBlock).toContain(expected.collection_name);
    });

    await test.step(`Tại Search bar, chọn collection 1`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.collectionTabLink).click();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.collection }).first().click();

      await dashboard.getByText(data.text_postpurchase).click();
      await expect(dashboard.locator(upsell.resultProductItem)).toHaveCount(suiteData.max_block_count);
    });

    await test.step(`Click Enable button`, async () => {
      await dashboard.getByRole("button", { name: "Enable" }).click();
      await dashboard.waitForSelector(upsell.emptySelectedItemElement);
      await expect(dashboard.getByText(expected.warning_empty_message)).toBeVisible();
    });

    await test.step(`Select product B tại block Post-purchase`, async () => {
      await dashboard.locator(upsell.resultItemPostPurchase).first().click();
      await expect(dashboard.getByTitle(data.collection)).toBeVisible();
    });

    await test.step(`Select nhiều products tại block Post-purchase`, async () => {
      for (let i = 1; i < 5; i++) {
        await dashboard.locator(upsell.resultItemPostPurchase).nth(i).click();
      }
      await expect(dashboard.getByText("+1")).toBeVisible();
    });

    await test.step(`Unselect product tại list product block Post-purchase`, async () => {
      await dashboard.locator(upsell.resultItemPostPurchase).first().click();
      await expect(dashboard.getByText("+1")).not.toBeVisible();
    });

    await test.step(`Unselect product tại list selected product block Post-purchase tại product đơn`, async () => {
      await dashboard.locator(upsell.resultItemPostPurchase).first().click();
      await dashboard.locator(upsell.closeSelectedItemBtnPostPurchase).click();
      await expect(dashboard.locator(upsell.postPurchaseProduct)).toHaveCount(expected.expected_four_block);
    });

    await test.step(`Unselect product tại list selected product block Post-purchase tại product cuối cùng chứa nhiều product`, async () => {
      await dashboard.locator(upsell.resultItemPostPurchase).nth(1).click();
      await dashboard.locator(upsell.resultItemPostPurchase).nth(5).click();
      await expect(dashboard.getByText("+2")).toBeVisible();
      await dashboard.locator(upsell.resultItemPostPurchase).first().click();
      await expect(dashboard.getByText("+2")).not.toBeVisible();
    });

    await test.step(`Click Enable button`, async () => {
      await dashboard.getByRole("button", { name: "Enable" }).click();
      await expect(dashboard.getByText(data.text_create_successful)).toHaveCount(expected.one_count_block);
    });

    await test.step(`Delete offer after creating`, async () => {
      const listOffer = await app.getListUpsellOffers({
        offer_types: "pre-purchase,post-purchase,in-cart",
        limit: 500,
        only_active: false,
      });
      const upsellIds = listOffer.map(offerData => offerData.id);
      const deleteIds = upsellIds.filter(id => id !== data.offer_id_prepurchase && id !== data.offer_id_postpurchase);
      await app.deleteAllUpsellOffers(deleteIds);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_15 Check redirect trên block create offer Post-purchase`, async ({
    dashboard,
    context,
    snapshotFixture,
  }) => {
    await test.step(`- Create offer Post-purchase tại màn Onboarding với target collection 1 (offer 2)
  - Select colection B, C tại block`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.collectionTabLink).click();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.collection }).first().click();

      await dashboard.getByText(data.text_postpurchase).click();
      await dashboard.locator(upsell.resultItemPostPurchase).nth(0).click();
      await dashboard.locator(upsell.resultItemPostPurchase).nth(1).click();
      await dashboard.getByRole("button", { name: "Enable" }).click();
    });

    await test.step(`Click Continue customize this offer button`, async () => {
      await dashboard.getByRole("link", { name: data.btn_customize }).click();
      await dashboard.locator(upsell.targetProductModal).nth(0).click();

      await expect(dashboard.locator(upsell.discountSectionAtOfferDetail)).not.toBeChecked();
      await dashboard.waitForSelector(upsell.modalBody);
      await expect(dashboard.getByText(expected.recommend_product)).toBeVisible();

      await dashboard.locator(upsell.recommendModal).click();
      await expect(dashboard.locator(upsell.selectedProductModal)).not.toBeVisible();
    });

    await test.step(`- Create offer Post-purchase tại màn Onboarding với target product A (offer 3)
  - Select collection D, E, F, G, H tại block`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.collectionTabLink).click();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.collection }).first().click();

      await dashboard.getByText(data.text_postpurchase).click();

      for (let i = 0; i < data.collection_click; i++) {
        await dashboard.locator(upsell.resultItemPostPurchase).nth(i).click();
      }
      await dashboard.getByRole("button", { name: "Enable" }).click();
    });

    await test.step(`Click Continue customize this offer button`, async () => {
      await dashboard.getByRole("link", { name: data.btn_customize }).click();
      await expect(dashboard.locator(upsell.discountSectionAtOfferDetail)).not.toBeChecked();

      const recommendSelectProductBtn = await dashboard
        .locator(upsell.targetProductModal)
        .filter({ hasText: "Select collection" });
      await recommendSelectProductBtn.click();
      await dashboard.waitForSelector(upsell.modalBody);
      await expect(dashboard.getByText(expected.recommend_product)).toBeVisible();

      await dashboard.locator(upsell.recommendModal).click();
      await expect(dashboard.locator(upsell.selectedProductModal)).not.toBeVisible();
    });

    await test.step(`- Create offer Post-purchase tại màn Onboarding với target product A (offer 4)
  - Select collection B, C tại block`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.collectionTabLink).click();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.collection }).first().click();

      await dashboard.getByText(data.text_postpurchase).click();
      await dashboard.locator(upsell.resultItemPostPurchase).nth(0).click();
      await dashboard.locator(upsell.resultItemPostPurchase).nth(1).click();
      await dashboard.getByRole("button", { name: "Enable" }).click();
    });

    await test.step(`Click Quickly create another offer button`, async () => {
      (await dashboard.waitForSelector(upsell.quicklyBtnPostPurchase)).isVisible();
      await dashboard.locator(upsell.quicklyBtnPostPurchase).click();
      await snapshotFixture.verify({
        page: dashboard,
        selector: upsell.rightPostPurchaseBlock,
        snapshotName: expected.block_postpurchase,
      });
    });

    await test.step(`- Create offer Post-purchase tại màn Onboarding với target product A (offer 5)
  - Select product B, C tại block`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.collectionTabLink).click();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.collection }).first().click();

      await dashboard.getByText(data.text_postpurchase).click();
      await dashboard.locator(upsell.resultItemPostPurchase).nth(0).click();
      await dashboard.locator(upsell.resultItemPostPurchase).nth(1).click();
      await dashboard.getByRole("button", { name: "Enable" }).click();
    });

    await test.step(`Click Try on the storefront button`, async () => {
      const viewStoreBtn = await dashboard.getByRole("button", { name: data.text_view_store });
      await viewStoreBtn.click();
      await verifyRedirectUrl({
        page: dashboard,
        selector: upsell.navigateStorefontBtn,
        redirectUrl: expected.redirect_url,
        context,
      });
    });

    await test.step(`Delete offer after creating`, async () => {
      const listOffer = await app.getListUpsellOffers({
        offer_types: "pre-purchase,post-purchase,in-cart",
        limit: 500,
        only_active: false,
      });
      const upsellIds = listOffer.map(offerData => offerData.id);
      const deleteIds = upsellIds.filter(id => id !== data.offer_id_prepurchase && id !== data.offer_id_postpurchase);
      await app.deleteAllUpsellOffers(deleteIds);
    });
  });

  test(`@SB_WEB_BUILDER_LBA_OBU_17 Check redirect trên block create offer Pre-purchase`, async ({
    dashboard,
    context,
    snapshotFixture,
  }) => {
    await test.step(`- Create offer Pre-purchase tại màn Onboarding với target collection 1 (offer 2)
  - Select colection B, C tại block`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.collectionTabLink).click();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.collection }).first().click();

      await dashboard.getByText(data.text_block_prepurchase).click();
      await dashboard.locator(upsell.resultProductItem).nth(0).click();
      await dashboard.locator(upsell.resultProductItem).nth(1).click();
      await dashboard.getByRole("button", { name: "Enable" }).click();
    });

    await test.step(`Click Continue customize this offer button`, async () => {
      await dashboard.getByRole("link", { name: data.btn_customize }).click();
      const recommendSelectProductBtn = await dashboard
        .locator(upsell.targetProductModal)
        .filter({ hasText: "Select collection" });

      await recommendSelectProductBtn.click();
      await dashboard.waitForSelector(upsell.modalBody);
      await expect(dashboard.getByText(data.target_product_text)).toBeVisible();

      await expect(dashboard.locator(upsell.discountCheckbox)).not.toBeChecked();
      await dashboard.locator(upsell.recommendModal).click();
      await expect(dashboard.locator(upsell.selectedProductModal)).not.toBeVisible();
    });

    await test.step(`- Create offer Pre-purchase tại màn Onboarding với target product A (offer 3)
    - Select collection D, E, F, G, H tại block`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.collectionTabLink).click();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.collection }).first().click();

      await dashboard.getByText(data.text_block_prepurchase).click();
      for (let i = 0; i < data.collection_click; i++) {
        await dashboard.locator(upsell.resultProductItem).nth(i).click();
      }
      await dashboard.getByRole("button", { name: "Enable" }).click();
    });

    await test.step(`Click Continue customize this offer button`, async () => {
      await dashboard.getByRole("link", { name: data.btn_customize }).click();
      const recommendSelectProductBtn = await dashboard
        .locator(upsell.targetProductModal)
        .filter({ hasText: "Select collection" });

      await recommendSelectProductBtn.click();
      await dashboard.waitForSelector(upsell.modalBody);
      await expect(dashboard.getByText(expected.recommend_product)).toBeVisible();

      await expect(dashboard.locator(upsell.discountCheckbox)).not.toBeChecked();
      await dashboard.locator(upsell.recommendModal).click();
      await expect(dashboard.locator(upsell.selectedProductModal)).not.toBeVisible();
    });

    await test.step(`- Create offer Pre-purchase tại màn Onboarding với target product A (offer 4)
    - Select collection B, C tại block`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.collectionTabLink).click();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.collection }).first().click();

      await dashboard.getByText(data.text_block_prepurchase).click();
      await dashboard.locator(upsell.resultProductItem).nth(0).click();
      await dashboard.locator(upsell.resultProductItem).nth(1).click();
      await dashboard.getByRole("button", { name: "Enable" }).click();
    });

    await test.step(`Click Quickly create another offer button`, async () => {
      await dashboard.waitForSelector(upsell.quicklyBtnPrePurchase);
      await dashboard.waitForLoadState("domcontentloaded");
      await dashboard.click(upsell.quicklyBtnPrePurchase);
      await snapshotFixture.verify({
        page: dashboard,
        selector: upsell.rightPrePurchaseBlock,
        snapshotName: expected.block_prepurchase,
      });
    });

    await test.step(`- Create offer Pre-purchase tại màn Onboarding với target product A (offer 5)
    - Select product B, C tại block`, async () => {
      await upsell.gotoUpsellDashboard();
      await upsell.handleSearchBar();
      await dashboard.locator(upsell.collectionTabLink).click();
      await dashboard.locator(upsell.resultItemBlock).filter({ hasText: data.collection }).first().click();

      await dashboard.getByText(data.text_block_prepurchase).click();
      await dashboard.locator(upsell.resultProductItem).nth(0).click();
      await dashboard.locator(upsell.resultProductItem).nth(1).click();
      await dashboard.getByRole("button", { name: "Enable" }).click();
    });

    await test.step(`Click Try on the storefront button`, async () => {
      await dashboard.getByRole("button", { name: data.text_view_store }).click();
      await verifyRedirectUrl({
        page: dashboard,
        selector: upsell.navigateStorefontBtn,
        redirectUrl: expected.redirect_url,
        context,
      });
    });

    await test.step(`Delete offer after creating`, async () => {
      const listOffer = await app.getListUpsellOffers({
        offer_types: "pre-purchase,post-purchase,in-cart",
        limit: 500,
        only_active: false,
      });
      const upsellIds = listOffer.map(offerData => offerData.id);
      const deleteIds = upsellIds.filter(id => id !== data.offer_id_prepurchase && id !== data.offer_id_postpurchase);
      await app.deleteAllUpsellOffers(deleteIds);
    });
  });

  //// Auto mới đã fixed product nên ko run case tạo product này
  // test(`@SB_WEB_BUILDER_LBA_OBU_04 Check hiển thị list product/collection ở Search bar`, async ({
  //   dashboard,
  //   conf,
  // }) => {
  //   await test.step(`Xoá hết product và collection của shop`, async () => {
  //     const collection = new CollectionPage(dashboard, conf.suiteConf.domain);
  //     await productApi.deleteAllProduct(conf.suiteConf.domain, currentUser.access_token);
  //     await collection.gotoCollectionList();
  //     await collectionApi.deleteAllCollection();
  //   });
  //
  //   await test.step(`Trong dashboard >> app >> Upsell: Cick vào search bar`, async () => {
  //     await upsell.gotoUpsellDashboard();
  //     await upsell.handleSearchBar();
  //     const productRes = await dashboard.getByText(upsell.notHaveAnyProductText);
  //     await expect(productRes).toBeVisible();
  //   });
  //
  //   await test.step(`- Tạo 8 collection - Không tạo product`, async () => {
  //     const collectionSamples = conf.caseConf.collections;
  //     for (let i = 0; i < collectionSamples.length; i++) {
  //       await collectionApi.createCollectionFromList(collectionSamples[i]);
  //     }
  //   });
  //
  //   await test.step(`Trong dashboard >> app >> Upsell: Cick vào search bar`, async () => {
  //     await upsell.gotoUpsellDashboard();
  //     await upsell.handleSearchBar();
  //     const collectionTab = await dashboard.locator(upsell.collectionTabLink);
  //     await expect(collectionTab).toHaveAttribute("class", upsell.activeClass);
  //     const collectionTabResult = await dashboard
  //       .locator(upsell.resultItemBlock)
  //       .filter({ hasText: new RegExp(upsell.existCollectionName, upsell.globalRegexFlag) });
  //     await expect(collectionTabResult).toHaveCount(conf.suiteConf.max_block_count);
  //   });
  //
  //   await test.step(`- Tạo 8 products cho shop`, async () => {
  //     const productSamples = conf.caseConf.products;
  //     for (let i = 0; i < productSamples.length; i++) {
  //       await productApi.createNewProduct(productSamples[i]);
  //     }
  //   });
  //   await test.step(`Trong dashboard >> app >> Upsell: Cick vào search bar`, async () => {
  //     await upsell.gotoUpsellDashboard();
  //     await upsell.handleSearchBar();
  //     const productTab = await dashboard.locator(upsell.productTabLink);
  //     await expect(productTab).toHaveAttribute("class", upsell.activeClass);
  //     const productTabResult = await dashboard
  //       .locator(upsell.resultItemBlock)
  //       .filter({ hasText: new RegExp(upsell.existProductName, upsell.globalRegexFlag) });
  //     await expect(productTabResult).toHaveCount(conf.suiteConf.max_block_count);
  //     await dashboard.locator(upsell.collectionTabLink).click();
  //     const collectionTabResult = await dashboard
  //       .locator(upsell.resultItemBlock)
  //       .filter({ hasText: new RegExp(upsell.existCollectionName, upsell.globalRegexFlag) });
  //     await expect(collectionTabResult).toHaveCount(conf.suiteConf.max_block_count);
  //   });
  //   await test.step(`Update thông tin của product`, async () => {
  //     const productTitle = conf.caseConf.products[0].title;
  //     const productTitleEdit = conf.caseConf.product_title_edit;
  //     await productPage.goToProductList();
  //     await productPage.editProduct(productTitle, productTitleEdit);
  //     const detailInput = await dashboard.getByPlaceholder("Short Sleeve T-Shirt").inputValue();
  //     await expect(detailInput).toEqual("jacket_edited");
  //   });
  //
  //   await test.step(`- Trong dashboard >> app >> Upsell: Cick vào search bar`, async () => {
  //     await upsell.gotoUpsellDashboard();
  //     await upsell.handleSearchBar();
  //     const editedProduct = await dashboard
  //       .locator(upsell.resultItemBlock)
  //       .filter({ hasText: new RegExp(upsell.existEditedProductName, upsell.globalRegexFlag) });
  //     await expect(editedProduct).toHaveCount(conf.caseConf.one_count_block);
  //   });
  //
  //   await test.step(`Update thông tin của collection`, async () => {
  //     await productPage.goToProductList();
  //     await dashboard.getByRole("link", { name: "Collections" }).click();
  //     const titleInput = await dashboard.getByPlaceholder(upsell.collectionNameInputPlaceholder);
  //     await dashboard.locator(upsell.gotoCollectionDetailLink).first().click();
  //     await titleInput.click();
  //     await titleInput.fill(upsell.existEditedCollectionName);
  //     await dashboard.locator("label").filter({ hasText: upsell.conditionRadio }).locator("span").first().click();
  //     await dashboard.locator(upsell.saveCollectionDetailBtn).filter({ hasText: "Save" }).click();
  //   });
  //
  //   await test.step(`- Trong dashboard >> app >> Upsell: Cick vào search bar
  //   - Click sang tab Collection`, async () => {
  //     await upsell.gotoUpsellDashboard();
  //     await upsell.handleSearchBar();
  //     await dashboard.locator(upsell.collectionTabLink).click();
  //     const collectionTabResult = await dashboard
  //       .locator(upsell.resultItemBlock)
  //       .filter({ hasText: new RegExp(upsell.existEditedCollectionName, upsell.globalRegexFlag) });
  //     await expect(collectionTabResult).toHaveCount(conf.caseConf.one_count_block);
  //   });
  // });
});
