import { loadData } from "@core/conf/conf";
import { expect, test } from "@core/fixtures";
import { ProductAPI } from "@pages/api/product";
import { BulkUpdate } from "@pages/dashboard/bulk-update-v3";
import { ProductPage } from "@pages/dashboard/products";
import { Locator } from "@playwright/test";

const softExpect = expect.configure({ soft: true });

test.describe("Improve bulk update v3", () => {
  let bulkUpdate: BulkUpdate;
  let bulkUpdateId1: Locator;
  let firstItemFilterColumn: Locator;
  let firstItemUpdateForColumn: Locator;
  let firstItemActionColumn: Locator;
  let firstItemNumberProdColumn: Locator;
  let firstItemUpdatedAtColumn: Locator;
  const uploadedImgs = [];

  test.beforeEach(async ({ dashboard, conf, cConf, authRequest, request, context }) => {
    test.setTimeout(conf.suiteConf.timeout_slow_test * 2);
    bulkUpdate = new BulkUpdate(dashboard, conf.suiteConf.domain, authRequest, context);
    bulkUpdateId1 = bulkUpdate.bulkUpdateItems.filter({
      has: bulkUpdate.getColumn("Id").getByText("1", { exact: true }),
    });
    firstItemFilterColumn = bulkUpdateId1.locator(bulkUpdate.getColumn("Filter"));
    firstItemUpdateForColumn = bulkUpdateId1.locator(bulkUpdate.getColumn("Update for"));
    firstItemActionColumn = bulkUpdateId1.locator(bulkUpdate.getColumn("Action"));
    firstItemNumberProdColumn = bulkUpdateId1.locator(bulkUpdate.getColumn("Number of updated products"));
    firstItemUpdatedAtColumn = bulkUpdateId1.locator(bulkUpdate.getColumn("Updated at"));

    if (cConf.import_product) {
      await test.step("Import product bằng file csv", async () => {
        const deleteIds = [];
        const productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
        const productPage = new ProductPage(bulkUpdate.page, conf.suiteConf.domain);
        const listProducts = await productAPI.getAllProduct(conf.suiteConf.domain);
        for (const product of cConf.expected.sample_matching_products) {
          listProducts.find(prod => {
            if (prod.title === product.name) {
              deleteIds.push(prod.id);
            }
          });
        }
        if (deleteIds.length > 0) {
          await productAPI.deleteProducts(deleteIds);
          deleteIds.length = 0;
        }
        await productPage.goto("admin/products");
        await productPage.waitForElementVisibleThenInvisible(productPage.xpathTableLoad);
        await productPage.importProduct(conf.suiteConf.csv_file, productPage.xpathImportFile, false, true);
        // wait for import success
        await productPage.waitImportProductSuccess(conf.suiteConf.csv_file);
      });

      await test.step("Check products cache ở SF", async () => {
        await expect(async () => {
          const res = await request.get(`https://${conf.suiteConf.domain}/api/catalog/next/products.json`);
          const productsSF = await res.json();
          const isProductsSampleUpdated: boolean = cConf.expected.sample_matching_products.every(expectedProd =>
            productsSF.result.items.some(productSF => productSF.title === expectedProd.name),
          );
          expect(isProductsSampleUpdated).toBeTruthy();
        }).toPass({ intervals: [1_000, 5_000, 10_000] });
      });
    }

    await test.step("Mở màn Bulk update", async () => {
      await bulkUpdate.goto("admin/bulk-updates-v3");
      await expect(bulkUpdate.loadingState).toBeHidden();
    });

    await test.step("Click button Create an update", async () => {
      await bulkUpdate.bulkUpdateHeader.getByRole("button", { name: "Create an Update" }).click();
      await expect(bulkUpdate.page).toHaveURL(/bulk-updates-v3\/new/);
    });
  });

  test(`@SB_PRO_BUD_527 [Create bulk update] Check default data màn create an update`, async ({ cConf, context }) => {
    const expected = cConf.expected;

    await test.step(`Check default state của màn create an update`, async () => {
      await softExpect(bulkUpdate.filterProductForm).toBeVisible();
      await softExpect(bulkUpdate.actionForm).toBeVisible();
      await softExpect(bulkUpdate.page.getByRole("button", { name: "Apply bulk update" })).toBeDisabled();
      await softExpect(bulkUpdate.productsMustMatch.locator(bulkUpdate.allConditions)).toBeChecked();
      await softExpect(bulkUpdate.productsMustMatch.locator(bulkUpdate.anyCondition)).not.toBeChecked();
      await softExpect(bulkUpdate.variantCheckbox).not.toBeChecked();
    });

    await test.step(`Hover tooltip Filter products`, async () => {
      await bulkUpdate.filterProductForm.locator(bulkUpdate.tooltipIcon).hover();
      await softExpect(bulkUpdate.page.getByRole("tooltip")).toHaveText(expected.filter_products.tooltip_content);
    });

    await test.step(`Click hyper link tooltip`, async () => {
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        bulkUpdate.page.getByRole("link", { name: "filter conditions" }).click(),
      ]);
      await softExpect(newTab).toHaveURL(new RegExp(expected.filter_products.help_docs_url));
      await newTab.close();
    });

    await test.step(`Hover tooltip Action`, async () => {
      await bulkUpdate.actionForm.locator(bulkUpdate.tooltipIcon).hover();
      await softExpect(bulkUpdate.page.getByRole("tooltip")).toHaveText(expected.actions.tooltip_content);
    });

    await test.step(`Click hyper link tooltip`, async () => {
      const [newTab] = await Promise.all([
        context.waitForEvent("page"),
        bulkUpdate.page.getByRole("link", { name: "supported actions" }).click(),
      ]);
      await softExpect(newTab).toHaveURL(new RegExp(expected.actions.help_docs_url));
    });
  });

  test(`@SB_PRO_BUD_528 [Create bulk update] Check các filter options Products/Variants match và add/xoá condition`, async ({
    cConf,
  }) => {
    const firstFilterProduct = bulkUpdate.productsMustMatch.locator(bulkUpdate.filterRows).first();
    const secondFilterProduct = bulkUpdate.productsMustMatch.locator(bulkUpdate.filterRows).nth(1);
    const firstFilterVariant = bulkUpdate.variantsMustMatch.locator(bulkUpdate.filterRows).first();
    const secondFilterVariant = bulkUpdate.variantsMustMatch.locator(bulkUpdate.filterRows).nth(1);
    const dropdownOptions = bulkUpdate.page.getByRole("tooltip").getByRole("listitem");
    const expected = cConf.expected;

    await test.step(`Click vào dropdown của filter options Products match`, async () => {
      await firstFilterProduct.locator(bulkUpdate.filterType).click();
      for (const [i, option] of (await dropdownOptions.all()).entries()) {
        await softExpect(option.filter({ hasText: expected.filter_products_options[i] })).toBeVisible();
      }
      await bulkUpdate.filterProductForm.locator(bulkUpdate.tooltipIcon).click();
    });

    for (const filterOption of expected.filter_products_options) {
      await test.step(`Click dropdown của option condition với filter ${filterOption}`, async () => {
        await firstFilterProduct.locator(bulkUpdate.filterType).click();
        await dropdownOptions.filter({ hasText: filterOption }).click();
      });

      await test.step(`Verify các conditions trong dropdown filter ${filterOption}`, async () => {
        const expectedConditions = expected.filter_products_conditions[filterOption];
        await firstFilterProduct.locator(bulkUpdate.filterCondition).click();
        for (const [i, option] of (await dropdownOptions.all()).entries()) {
          await softExpect(option.filter({ hasText: expectedConditions[i].name })).toBeVisible();
          // Check trạng thái option enable hoặc disabled đối với từng loại filter
          if (expectedConditions[i].disabled) {
            await softExpect(option.filter({ hasText: expectedConditions[i].name })).toHaveClass(
              new RegExp(expectedConditions[i].disabled),
            );
          } else {
            await softExpect(option.filter({ hasText: expectedConditions[i].name })).toBeEnabled();
          }
        }
      });
    }

    await test.step(`Click Add condition của Product filter`, async () => {
      await bulkUpdate.productsMustMatch.getByRole("button", { name: "Add condition" }).click();
      await softExpect(secondFilterProduct).toBeVisible();
      await softExpect(firstFilterProduct.locator(bulkUpdate.removeBtn)).toBeVisible();
      await softExpect(secondFilterProduct.locator(bulkUpdate.removeBtn)).toBeVisible();
    });

    await test.step(`Click icon thùng rác`, async () => {
      await bulkUpdate.removeCondition({ type: "product", index: 2 });
      await softExpect(secondFilterProduct).toBeHidden();
      await softExpect(firstFilterProduct.locator(bulkUpdate.removeBtn)).toBeHidden();
    });

    await test.step(`Bật toggle button Variant must match > Click vào dropdown của filter options Variants match`, async () => {
      await bulkUpdate.variantCheckbox.check();
      await softExpect(firstFilterVariant).toBeVisible();
      await firstFilterVariant.locator(bulkUpdate.filterType).click();
      for (const [i, option] of (await dropdownOptions.all()).entries()) {
        await softExpect(option.filter({ hasText: expected.filter_variant_options[i] })).toBeVisible();
      }
      await bulkUpdate.filterProductForm.locator(bulkUpdate.tooltipIcon).click();
    });

    for (const filterOption of expected.filter_variant_options) {
      await test.step(`Click dropdown của option condition với filter ${filterOption}`, async () => {
        await firstFilterVariant.locator(bulkUpdate.filterType).click();
        await dropdownOptions.filter({ hasText: filterOption }).click();
      });

      await test.step(`Verify các conditions trong dropdown filter ${filterOption}`, async () => {
        const expectedConditions = expected.filter_variant_conditions[filterOption];
        await firstFilterVariant.locator(bulkUpdate.filterCondition).click();
        for (const [i, option] of (await dropdownOptions.all()).entries()) {
          await softExpect(option.filter({ hasText: expectedConditions[i].name })).toBeVisible();
          // Check trạng thái option enable hoặc disabled đối với từng loại filter
          if (expectedConditions[i].disabled) {
            await softExpect(option.filter({ hasText: expectedConditions[i].name })).toHaveClass(
              new RegExp(expectedConditions[i].disabled),
            );
          } else {
            await softExpect(option.filter({ hasText: expectedConditions[i].name })).toBeEnabled();
          }
        }
      });
    }

    await test.step(`Click Add condition của Variants filter`, async () => {
      await bulkUpdate.variantsMustMatch.getByRole("button", { name: "Add condition" }).click();
      await softExpect(secondFilterVariant).toBeVisible();
      await softExpect(firstFilterVariant.locator(bulkUpdate.removeBtn)).toBeVisible();
      await softExpect(secondFilterVariant.locator(bulkUpdate.removeBtn)).toBeVisible();
    });

    await test.step(`Click icon thùng rác`, async () => {
      await bulkUpdate.removeCondition({ type: "variant", index: 2 });
      await softExpect(secondFilterVariant).toBeHidden();
      await softExpect(firstFilterVariant.locator(bulkUpdate.removeBtn)).toBeHidden();
    });
  });

  test(`@SB_PRO_BUD_529 [Create bulk update] Check add action cho bulk update`, async ({ cConf, snapshotFixture }) => {
    test.slow();
    const expected = cConf.expected;
    const replaceTagDuplicateBtn = bulkUpdate.actionItems
      .filter({ has: bulkUpdate.getActionHeader("Replace tag") })
      .locator(bulkUpdate.duplicateBtn);
    const replaceTagRemoveBtn = bulkUpdate.actionItems
      .filter({ has: bulkUpdate.getActionHeader("Replace tag") })
      .locator(bulkUpdate.removeBtn);

    await test.step("Precondition: Click add action", async () => {
      await bulkUpdate.actionForm.getByRole("button", { name: "Add action" }).click();
    });

    await test.step(`Click Discard/X`, async () => {
      await bulkUpdate.addActionPopup.getByRole("button", { name: "Discard" }).click();
      await expect(bulkUpdate.addActionPopup).toBeHidden();
      await bulkUpdate.actionForm.getByRole("button", { name: "Add action" }).click();
      await bulkUpdate.closePopupBtn.click();
      await expect(bulkUpdate.addActionPopup).toBeHidden();
    });

    await test.step(`Click add action`, async () => {
      await bulkUpdate.actionForm.getByRole("button", { name: "Add action" }).click();
      await expect(bulkUpdate.addActionPopup).toBeVisible();
      await softExpect(bulkUpdate.addActionPopup.getByRole("button", { name: "Discard" })).toBeEnabled();
      await softExpect(bulkUpdate.addActionPopup.getByRole("button", { name: "Add" })).toBeDisabled();
    });

    await test.step(`Click dropdown`, async () => {
      await bulkUpdate.dropdownSelectAction.click();
      await softExpect(bulkUpdate.addActionForm).toBeVisible();
      for (const action of cConf.new_actions) {
        await softExpect(bulkUpdate.getActionOption(action)).toBeVisible();
      }
    });

    for (const keyword of cConf.search_keywords) {
      await test.step(`Nhập keyword ${keyword.text} vào search bar`, async () => {
        const searchResults = await bulkUpdate.searchAction(keyword.text);
        for (const [i, result] of searchResults.entries()) {
          await softExpect(result.filter({ hasText: keyword.results[i] })).toBeVisible();
        }
      });
    }

    for (const action of cConf.new_actions) {
      await test.step(`Chọn action ${action} và ấn add`, async () => {
        await bulkUpdate.addNewAction(action);
        await softExpect(bulkUpdate.actionItems.filter({ has: bulkUpdate.getActionHeader(action) })).toBeVisible();
      });
    }

    await test.step("Verify UI of new actions", async () => {
      await bulkUpdate.productsMustMatch.evaluate(ele => ele.scrollIntoView({ behavior: "instant", block: "start" }));
      await snapshotFixture.verifyWithAutoRetry({
        page: bulkUpdate.page,
        selector: bulkUpdate.actionForm,
        snapshotName: expected.actions_ui_snapshot,
        sizeCheck: true,
      });
    });

    await test.step(`Hover icon Duplicate`, async () => {
      await replaceTagDuplicateBtn.hover();
      await softExpect(bulkUpdate.page.getByRole("tooltip")).toHaveText(expected.duplicate_tooltip);
    });

    await test.step(`Click icon Duplicate`, async () => {
      await replaceTagDuplicateBtn.click();
      await softExpect(bulkUpdate.actionItems.filter({ has: bulkUpdate.getActionHeader("Replace tag") })).toHaveCount(
        2,
      );
    });

    await test.step(`Hover icon thùng rác`, async () => {
      await replaceTagRemoveBtn.first().hover();
      await softExpect(bulkUpdate.page.getByRole("tooltip")).toHaveText(expected.remove_tooltip);
    });

    await test.step(`Click icon thùng rác`, async () => {
      await replaceTagRemoveBtn.first().click();
      await softExpect(bulkUpdate.actionItems.filter({ has: bulkUpdate.getActionHeader("Replace tag") })).toHaveCount(
        1,
      );
    });
  });

  test(`@SB_PRO_BUD_530 [Create bulk update] Check luồng tạo bulk update khi không điền value các trường product filters, actions`, async ({}) => {
    await test.step(`Add product filter, action nhưng bỏ trống ko điền value`, async () => {
      // 1 filter 1 action
      await bulkUpdate.variantCheckbox.check();
      await bulkUpdate.addNewAction("Replace tag");
      await softExpect(bulkUpdate.page.getByRole("button", { name: "Apply bulk update" })).toBeDisabled();

      // 1 filter nhiều action
      await bulkUpdate.addNewAction("Change product page design");
      await bulkUpdate.addNewAction("Show on channels");
      await bulkUpdate.addNewAction("Add to collection");
      await softExpect(bulkUpdate.actionItems).toHaveCount(4);
      await softExpect(bulkUpdate.page.getByRole("button", { name: "Apply bulk update" })).toBeDisabled();

      // nhiều filter nhiều action
      await bulkUpdate.productsMustMatch.getByRole("button", { name: "Add condition" }).click();
      await bulkUpdate.productsMustMatch.getByRole("button", { name: "Add condition" }).click();
      await bulkUpdate.variantsMustMatch.getByRole("button", { name: "Add condition" }).click();
      await bulkUpdate.variantsMustMatch.getByRole("button", { name: "Add condition" }).click();
      await softExpect(bulkUpdate.productsMustMatch.locator(bulkUpdate.filterRows)).toHaveCount(3);
      await softExpect(bulkUpdate.variantsMustMatch.locator(bulkUpdate.filterRows)).toHaveCount(3);
      await softExpect(bulkUpdate.page.getByRole("button", { name: "Apply bulk update" })).toBeDisabled();

      // nhiều filter 1 action
      await bulkUpdate.removeAction({ name: "Replace tag" });
      await bulkUpdate.removeAction({ name: "Change product page design" });
      await bulkUpdate.removeAction({ name: "Show on channels" });
      await softExpect(bulkUpdate.actionItems).toHaveCount(1);
      await softExpect(bulkUpdate.page.getByRole("button", { name: "Apply bulk update" })).toBeDisabled();
    });
  });

  test(`@SB_PRO_BUD_532 [Create bulk update] Check luồng tạo bulk update khi apply filter product - variants chi tiết có kết quả với action
   "Find and replace text in description"`, async ({ cConf, conf, context }) => {
    test.slow();
    let sampleProducts: { name: string; link: string }[];

    await test.step(`Chọn kết hợp product và variants filter có kết quả: 
      ${cConf.description}`, async () => {
      for (const filterProduct of cConf.product_data) {
        await bulkUpdate.setFilter("product", filterProduct);
      }
      await bulkUpdate.chooseMatchCondition("product", cConf.product_condition);
      for (const filterVariant of cConf.variant_data) {
        await bulkUpdate.setFilter("variant", filterVariant);
      }
      await bulkUpdate.chooseMatchCondition("variant", cConf.variant_condition);
    });

    await test.step(`Chọn action từ popup và add`, async () => {
      await bulkUpdate.addNewAction(cConf.action.name);
      await bulkUpdate.completeActionData(cConf.action.name, cConf.action.data);
    });

    await test.step(`Ấn Apply Bulk update`, async () => {
      await bulkUpdate.page.getByRole("button", { name: "Apply bulk update" }).click();
      await expect(bulkUpdate.previewBulkUpdatePopup).toBeVisible();
      for (const filterProductPreview of cConf.expected.filter_product_in_preview) {
        await expect(bulkUpdate.filterProductPreview.filter({ hasText: filterProductPreview })).toBeVisible();
      }
      for (const filterVariantPreview of cConf.expected.filter_variant_in_preview) {
        await expect(bulkUpdate.filterVariantPreview.filter({ hasText: filterVariantPreview })).toBeVisible();
      }
      await expect(bulkUpdate.actionPreview).toHaveText(new RegExp(cConf.expected.action_apply_order_text));
      for (const action of cConf.expected.actions_in_preview) {
        await expect(bulkUpdate.actionItemsPreview.filter({ hasText: action })).toBeVisible();
      }
      for (const product of cConf.expected.sample_matching_products) {
        await expect(
          bulkUpdate.sampleMatchingProducts.filter({ hasText: `${product.name} ${product.type} ${product.vendor}` }),
        ).toBeVisible();
      }
    });

    await test.step(`Click icon Link`, async () => {
      sampleProducts = await bulkUpdate.getSampleProductsLink();
      for (const product of cConf.expected.sample_matching_products) {
        const [newTab] = await Promise.all([
          context.waitForEvent("page"),
          bulkUpdate.sampleMatchingProducts.filter({ hasText: product.name }).getByRole("link").click(),
        ]);
        await expect(newTab.getByText(product.name).first()).toBeVisible();
        await newTab.close();
      }
    });

    await test.step(`Click Apply bulk update trong popup`, async () => {
      await bulkUpdate.previewBulkUpdatePopup.getByRole("button", { name: "Apply bulk update" }).click();
      await expect(bulkUpdate.page).toHaveURL(/admin\/bulk-updates-v3/);
      await bulkUpdate.loadingState.waitFor({ state: "hidden", timeout: 90_000 });
      await expect(bulkUpdateId1).toBeVisible();
      await softExpect(firstItemFilterColumn).toHaveText(cConf.expected.filter_column);
      await softExpect(firstItemUpdateForColumn).toHaveText(cConf.expected.update_for_column);
      await softExpect(firstItemActionColumn).toHaveText(cConf.expected.action_column);
      await softExpect(firstItemUpdatedAtColumn).toHaveText("Just now");
      await expect(bulkUpdateId1.locator(bulkUpdate.iconProcessing)).toBeVisible();
    });

    await test.step(`Status done check các product ảnh hưởng ở màn preview bulk update ở product detail và SF`, async () => {
      // Chờ status chuyển done
      await expect(async () => {
        const updateDone = await bulkUpdateId1.locator(bulkUpdate.iconDone).isVisible();
        if (!updateDone) {
          await bulkUpdate.page.reload();
        }
        await expect(bulkUpdateId1.locator(bulkUpdate.iconDone)).toBeVisible({ timeout: 50 });
      }).toPass({ intervals: [4_000, 5_000, 10_000] });
      //Sau khi bulk update chuyển done thì mới show số product ảnh hưởng
      await softExpect(firstItemNumberProdColumn).toHaveText(cConf.expected.number_of_updated_products_column);
      //Check các product ảnh hưởng
      for (const product of sampleProducts) {
        const newPage = await context.newPage();
        const productDetail = new ProductPage(newPage, conf.suiteConf.domain);
        const productDescription = productDetail.descriptionBody;

        await productDetail.goto(product.link);
        await softExpect(productDetail.page.getByText(product.name).first()).toBeVisible();
        await softExpect(productDescription).toHaveText(cConf.expected.new_description);
        await newPage.close();
      }
    });

    await test.step(`Lặp lại step 1,2,3,5 với action value khác`, async () => {
      //Step 1
      await bulkUpdate.bulkUpdateHeader.getByRole("button", { name: "Create an Update" }).click();
      for (const filterProduct of cConf.product_data) {
        await bulkUpdate.setFilter("product", filterProduct);
      }
      await bulkUpdate.chooseMatchCondition("product", cConf.product_condition);
      for (const filterVariant of cConf.variant_data) {
        await bulkUpdate.setFilter("variant", filterVariant);
      }
      await bulkUpdate.chooseMatchCondition("variant", cConf.variant_condition);

      //Step 2
      await bulkUpdate.addNewAction(cConf.action_repeat.name);
      await bulkUpdate.completeActionData(cConf.action_repeat.name, cConf.action_repeat.data);

      //Step 3
      await bulkUpdate.page.getByRole("button", { name: "Apply bulk update" }).click();
      await expect(bulkUpdate.previewBulkUpdatePopup).toBeVisible();

      //Step 5
      await bulkUpdate.previewBulkUpdatePopup.getByRole("button", { name: "Apply bulk update" }).click();
      await softExpect(bulkUpdate.page).toHaveURL(/admin\/bulk-updates-v3/);
      await softExpect(bulkUpdateId1).toBeVisible();
      await softExpect(firstItemActionColumn).toHaveText(cConf.expected.action_column_repeat);
      await softExpect(bulkUpdateId1.locator(bulkUpdate.iconProcessing)).toBeVisible();

      //Verify after done
      await expect(async () => {
        const updateDone = await bulkUpdateId1.locator(bulkUpdate.iconDone).isVisible();
        if (!updateDone) {
          await bulkUpdate.page.reload();
        }
        await expect(bulkUpdateId1.locator(bulkUpdate.iconDone)).toBeVisible({ timeout: 50 });
      }).toPass({ intervals: [4_000, 5_000, 10_000] });
      //Sau khi bulk update chuyển done thì mới show số product ảnh hưởng
      await softExpect(firstItemNumberProdColumn).toHaveText(cConf.expected.number_of_updated_products_column);
      //Check các product ảnh hưởng
      for (const product of sampleProducts) {
        const newPage = await context.newPage();
        const productDetail = new ProductPage(newPage, conf.suiteConf.domain);
        const productDescription = productDetail.descriptionBody;

        await productDetail.goto(product.link);
        await softExpect(productDetail.page.getByText(product.name).first()).toBeVisible();
        await softExpect(productDescription).toHaveText(cConf.expected.description_repeat);
        await newPage.close();
      }
    });
  });

  const config = loadData(__dirname, "NEW_ACTIONS");
  const caseConf = config.caseConf;
  for (const caseData of caseConf.data) {
    test(`@${caseData.case_id} [Create bulk update] Check luồng tạo bulk update khi apply filter product - variants chi tiết có kết quả với các action 
    ${caseData.description}`, async ({ cConf, context }) => {
      test.slow();
      const expected = cConf.expected;
      let sampleProducts: { name: string; link: string }[];
      const productInfo: {
        name: string;
        media_length: number;
        price: number | number[];
        variant_imgs: string[] | [];
      }[] = [];
      let price: number | number[];
      let variantPrice: string;
      const variantImgs = [];

      await test.step(`Chọn kết hợp product và variants filter có kết quả: 
      ${caseData.description}`, async () => {
        for (const filterProduct of caseData.product_data) {
          await bulkUpdate.setFilter("product", filterProduct);
        }
        await bulkUpdate.chooseMatchCondition("product", caseData.product_condition);
        for (const filterVariant of caseData.variant_data) {
          await bulkUpdate.setFilter("variant", filterVariant);
        }
        await bulkUpdate.chooseMatchCondition("variant", caseData.variant_condition);
      });

      await test.step(`Chọn action từ popup và add`, async () => {
        for (const action of caseData.actions) {
          await bulkUpdate.addNewAction(action.name);
          await bulkUpdate.completeActionData(action.name, action.data);
        }
      });

      await test.step(`Ấn Apply Bulk update`, async () => {
        const [requestPreview] = await Promise.all([
          bulkUpdate.page.waitForRequest(
            request => request.url().includes("mass-update/preview.json") && request.method() === "POST",
          ),
          bulkUpdate.page.getByRole("button", { name: "Apply bulk update" }).click(),
        ]);
        const previewPayload = requestPreview.postDataJSON();
        const actionsData = previewPayload.product_mass_update.actions;
        // Get link img (uploaded lên dashboard) trong preview api
        if (expected.actions_in_preview.includes("Add images to product media")) {
          const addImg = actionsData.find(action => action.label === "Add images to product media");
          const imgSrc = addImg.extra.add_image_to_product.sources;
          if (imgSrc.length > 0) {
            uploadedImgs.push(...imgSrc);
          }
        }
        if (expected.actions_in_preview.includes("Replace all product images by the uploaded ones")) {
          const addImg = actionsData.find(action => action.label === "Replace all product images by the uploaded ones");
          const imgSrc = addImg.extra.replace_all_images_in_product.sources;
          if (imgSrc.length > 0) {
            uploadedImgs.length = 0;
            uploadedImgs.push(...imgSrc);
          }
        }

        await expect(bulkUpdate.previewBulkUpdatePopup).toBeVisible();
        for (const action of expected.actions_in_preview) {
          await expect(bulkUpdate.actionItemsPreview.filter({ hasText: action })).toBeVisible();
        }
        for (const product of expected.sample_matching_products) {
          await expect(
            bulkUpdate.sampleMatchingProducts.filter({ hasText: `${product.name} ${product.type} ${product.vendor}` }),
          ).toBeVisible();
        }
        sampleProducts = await bulkUpdate.getSampleProductsLink();
        for (const product of expected.sample_matching_products) {
          const [newTab] = await Promise.all([
            context.waitForEvent("page"),
            bulkUpdate.sampleMatchingProducts.filter({ hasText: product.name }).getByRole("link").click(),
          ]);
          await newTab.waitForSelector(bulkUpdate.xpathProductTitleTxt);
          await expect(newTab.getByText(product.name).first()).toBeVisible();
          const productDetail = new ProductPage(newTab, config.suiteConf.domain);
          const mediaLength = await productDetail.productImgs.count();
          await productDetail.searchEngine.scrollIntoViewIfNeeded();
          const variants = await productDetail.variantsRow.first().isVisible();
          // Nếu product có variant -> get variant price
          if (variants) {
            const listPrice = [];
            for (const variant of await productDetail.variantsRow.all()) {
              variantPrice = await variant.locator(productDetail.columnPrice).innerText();
              listPrice.push(variantPrice);
              (price as number[]) = listPrice.map(parseFloat);
              const variantImg = await variant.locator(productDetail.variantImg).getAttribute("src");
              variantImgs.push(variantImg);
            }
          } else {
            price = parseFloat(await productDetail.priceProductDetail.inputValue());
          }
          productInfo.push({ name: product.name, media_length: mediaLength, price: price, variant_imgs: variantImgs });
          await newTab.close();
        }
      });

      await test.step(`Click Apply bulk update trong popup`, async () => {
        await bulkUpdate.previewBulkUpdatePopup.getByRole("button", { name: "Apply bulk update" }).click();
        await expect(bulkUpdate.page).toHaveURL(/admin\/bulk-updates-v3/);
        await bulkUpdate.loadingState.waitFor({ state: "hidden", timeout: 90_000 });
        await expect(bulkUpdateId1).toBeVisible();
        await softExpect(firstItemFilterColumn).toHaveText(expected.filter_column);
        await softExpect(firstItemUpdateForColumn).toHaveText(expected.update_for_column);
        await softExpect(firstItemActionColumn).toHaveText(expected.action_column);
        await softExpect(firstItemUpdatedAtColumn).toHaveText("Just now");
        await softExpect(bulkUpdateId1.locator(bulkUpdate.iconProcessing)).toBeVisible();
      });

      await test.step(`Status done check các product ảnh hưởng ở màn preview bulk update ở product detail và SF`, async () => {
        // Chờ status chuyển done
        await expect(async () => {
          await bulkUpdateId1.waitFor();
          const updateDone = await bulkUpdateId1.locator(bulkUpdate.iconDone).isVisible();
          if (!updateDone) {
            await bulkUpdate.page.reload();
            await bulkUpdateId1.waitFor();
          }
          await expect(bulkUpdateId1.locator(bulkUpdate.iconDone)).toBeVisible({ timeout: 50 });
        }).toPass({ intervals: [4_000, 5_000, 10_000] });
        await softExpect(firstItemNumberProdColumn).toHaveText(expected.number_of_updated_products_column);
        //Check các product ảnh hưởng
        for (const product of sampleProducts) {
          const newPage = await context.newPage();
          const productDetail = new ProductPage(newPage, config.suiteConf.domain);
          const productDescription = productDetail.descriptionBody;

          await productDetail.goto(product.link);
          await expect(productDetail.page.getByText(product.name).first()).toBeVisible();

          // [case BUD_535] Nếu có thay đổi description sẽ check content mới
          if (expected.new_description) {
            await softExpect(productDescription).toHaveText(expected.new_description);
          }

          // [case BUD_535 & 536] Nếu có upload ảnh mới sẽ check hiển thị ở product detail
          if (uploadedImgs.length > 0) {
            //Tìm số lượng media của product trước khi add theo tên
            const oldInfo = productInfo.find(prod => prod.name === product.name);

            //Verify số lương media sau khi apply bulk update
            // Nếu là option add thì media tăng thêm còn nếu replace all -> media chỉ có số ảnh = số mới upload
            const expectedMediaLength = expected.actions_in_preview.includes("Add images to product media")
              ? oldInfo.media_length + uploadedImgs.length
              : uploadedImgs.length;
            await softExpect(productDetail.genLoc(productDetail.xpathMedia)).toHaveCount(expectedMediaLength);
            for (const img of uploadedImgs) {
              const imgParts = img.split("/");
              const imgName = imgParts[imgParts.length - 1];
              await expect(
                productDetail.genLoc(productDetail.xpathMedia).and(productDetail.genLoc(`[src*='${imgName}']`)),
              ).toBeVisible();
            }
            uploadedImgs.length = 0;
            // Verify variant image không bị thay đổi sau khi apply bulk update
            if (variantImgs.length > 0) {
              for (const [i, variant] of (await productDetail.variantsRow.all()).entries()) {
                const variantImg = variant.locator(productDetail.variantImg);
                await expect(variantImg).toHaveAttribute("src", variantImgs[i]);
              }
              variantImgs.length = 0;
            }
          }

          // [case BUD_536] Nếu có thay đổi tags sẽ check tag mới của product
          if (expected.new_tags) {
            const expectedData = expected.new_tags.find(data => data.product === product.name);
            for (const tag of expectedData.tags) {
              await expect(
                productDetail.productTags.filter({
                  has: productDetail.page.getByText(tag, { exact: true }),
                }),
              ).toBeVisible();
            }
          }

          // [case BUD_537] Nếu có thay đổi type, vendor sẽ check value mới
          // [BUD_538] Để đk typeof vì có xoá type
          if (typeof expected.new_type !== "undefined") {
            await softExpect(productDetail.genLoc(productDetail.xpathProductTypeTxt)).toHaveValue(expected.new_type);
          }

          if (typeof expected.new_vendor !== "undefined") {
            await softExpect(productDetail.genLoc(productDetail.xpathVendorTxt)).toHaveValue(expected.new_vendor);
          }

          // [case BUD_538 & 539] Nếu có thay đổi price sẽ check value mới
          if (expected.new_price) {
            const newPrice = expected.new_price;
            const oldInfo = productInfo.find(prod => prod.name === product.name);
            await productDetail.searchEngine.scrollIntoViewIfNeeded();
            const variants = await productDetail.variantsRow.first().isVisible();
            if (variants) {
              for (const [i, variant] of (await productDetail.variantsRow.all()).entries()) {
                const expectedVariantPrice = newPrice.increase
                  ? (oldInfo.price[i] + newPrice.increase.amount) * newPrice.increase.percent
                  : (oldInfo.price[i] - newPrice.decrease.amount) * (1 - newPrice.decrease.percent);
                await softExpect(variant).toContainText(expectedVariantPrice.toString());
              }
            } else {
              const expectedPrice = newPrice.increase
                ? (oldInfo.price + newPrice.increase.amount) * newPrice.increase.percent
                : ((oldInfo.price as number) - newPrice.decrease.amount) * (1 - newPrice.decrease.percent);
              await softExpect(productDetail.priceProductDetail).toHaveValue(expectedPrice.toFixed(1).toString());
            }
          }

          // [case BUD_539 & 540] Nếu có thay đổi variants sẽ check
          if (typeof expected.new_variants !== "undefined") {
            for (const variant of expected.new_variants) {
              await softExpect(
                productDetail.variantItems.filter({ has: productDetail.page.getByText(variant, { exact: true }) }),
              ).toBeVisible();
            }
            const actionData = caseData.actions.find(action => action.name === "Delete variant's option value");
            if (actionData) {
              await softExpect(
                productDetail.variantItems.filter({ hasText: actionData.data["Delete variant's option value"].value }),
              ).toBeHidden();
            }
          }

          // [case BUD_540] Nếu có thay đổi custom option sẽ check
          if (expected.delete_custom_option) {
            await softExpect(
              productDetail.customOptionItems.filter({
                has: productDetail.page.getByText(expected.delete_custom_option, { exact: true }),
              }),
            ).toBeHidden();
          }

          // [case BUD_541] Nếu có thay đổi policy sẽ check
          if (expected.inventory_policy) {
            await softExpect(productDetail.genLoc(productDetail.xpathInventoryPolicySlt)).toHaveValue(
              expected.inventory_policy,
            );
          }

          // [case BUD_541] Check purchase out of stock
          if (expected.purchase_out_of_stock) {
            await softExpect(productDetail.purchaseOutOfStockCheckbox).toBeChecked();
          }

          // [case BUD_542] Check access token
          if (expected.new_access_token) {
            await softExpect(productDetail.fbAccessToken).toHaveValue(expected.new_access_token);
          }

          // [case BUD_542] Check pixel id
          if (expected.new_pixel_id) {
            await softExpect(productDetail.fbPixelId).toHaveValue(expected.new_pixel_id);
          }

          await newPage.close();
        }
      });
    });
  }

  test(`@SB_PRO_BUD_533 [Create bulk update] Check luồng tạo bulk update khi apply filter product - all variants có kết quả với các action mới`, async ({
    cConf,
    conf,
    context,
  }) => {
    test.slow();
    if (conf.suiteConf.domain.includes("myshopbase.net")) {
      // Dev đang có bug update rất chậm -> tạm thời skip chờ Acon fix
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip();
    }
    const uploadedImgs: "" | string[] = [];
    let sampleProducts: { name: string; link: string; description: string }[];

    await test.step("Precondition: Check scheduler data", async () => {
      await bulkUpdate.backBtn.click();
      await expect(bulkUpdate.page).toHaveURL(`https://${conf.suiteConf.domain}/admin/bulk-updates-v3`);
      await expect(bulkUpdate.bulkUpdateItems.first().or(bulkUpdate.emptyUpdates)).toBeVisible();
    });

    await test.step(`Tạo bulk update mới chỉ với filter product option`, async () => {
      await bulkUpdate.bulkUpdateHeader.getByRole("button", { name: "Create an Update" }).click();
      for (const filterProduct of cConf.product_data) {
        await bulkUpdate.setFilter("product", filterProduct);
      }
      await bulkUpdate.chooseMatchCondition("product", cConf.product_condition);
    });

    await test.step(`Chọn all action từ popup và add value`, async () => {
      for (const action of cConf.actions) {
        await bulkUpdate.addNewAction(action.name);
        await bulkUpdate.completeActionData(action.name, action.data);
      }
    });

    await test.step(`Click Preview bulk update`, async () => {
      const [requestPreview] = await Promise.all([
        bulkUpdate.page.waitForRequest(
          request => request.url().includes("mass-update/preview.json") && request.method() === "POST",
        ),
        bulkUpdate.page.getByRole("button", { name: "Apply bulk update" }).click(),
      ]);
      const previewPayload = requestPreview.postDataJSON();
      const actionsData = previewPayload.product_mass_update.actions;
      const addImg = actionsData.find(action => action.label === "Add images to product media");
      const replaceImg = actionsData.find(action => action.label === "Replace all product images by the uploaded ones");
      uploadedImgs.push(
        ...addImg.extra.add_image_to_product.sources,
        ...replaceImg.extra.replace_all_images_in_product.sources,
      );
      await expect(bulkUpdate.previewBulkUpdatePopup).toBeVisible();
      for (const filterProductPreview of cConf.expected.filter_product_in_preview) {
        await softExpect(bulkUpdate.filterProductPreview.filter({ hasText: filterProductPreview })).toBeVisible();
      }
      await softExpect(bulkUpdate.filterVariantPreview).toBeHidden();
      await softExpect(bulkUpdate.actionPreview).toHaveText(new RegExp(cConf.expected.action_apply_order_text));
      for (const action of cConf.expected.actions_in_preview) {
        await softExpect(bulkUpdate.actionItemsPreview.filter({ hasText: action })).toBeVisible();
      }
      for (const product of cConf.expected.sample_matching_products) {
        const expectedProdInfo = product.type
          ? `${product.name} ${product.type} ${product.vendor}`
          : `${product.name} ${product.vendor}`;
        await softExpect(bulkUpdate.sampleMatchingProducts.filter({ hasText: expectedProdInfo })).toBeVisible();
      }
      sampleProducts = await bulkUpdate.getSampleProductsLink();
    });

    await test.step(`Click Apply bulk update ở popup preview`, async () => {
      const createdUpdate = bulkUpdate.bulkUpdateItems
        .filter({ hasText: cConf.expected.action_column })
        .filter({ has: bulkUpdate.getColumn("Id").filter({ has: bulkUpdate.page.getByText("1", { exact: true }) }) });
      await Promise.all([
        bulkUpdate.page.waitForResponse(/mass-update.json/),
        bulkUpdate.previewBulkUpdatePopup.getByRole("button", { name: "Apply bulk update" }).click(),
      ]);
      await expect(bulkUpdate.page).toHaveURL(/admin\/bulk-updates-v3/);
      await bulkUpdate.loadingState.waitFor({ state: "hidden", timeout: 90_000 });
      await expect(createdUpdate).toBeVisible();
      await softExpect(createdUpdate.locator(bulkUpdate.getColumn("Filter"))).toHaveText(cConf.expected.filter_column);
      await softExpect(createdUpdate.locator(bulkUpdate.getColumn("Update for"))).toHaveText(
        cConf.expected.update_for_column,
      );
      await softExpect(createdUpdate.locator(bulkUpdate.getColumn("Action"))).toHaveText(cConf.expected.action_column);
      await softExpect(createdUpdate.locator(bulkUpdate.getColumn("Updated at"))).toHaveText("Just now");
      await softExpect(createdUpdate.locator(bulkUpdate.iconProcessing)).toBeVisible();
    });

    await test.step(`Status done check các product ảnh hưởng ở màn preview bulk update ở product detail và SF`, async () => {
      // Chờ status chuyển done
      await expect(async () => {
        await bulkUpdateId1.waitFor();
        const updateDone = await bulkUpdateId1.locator(bulkUpdate.iconDone).isVisible();
        if (!updateDone) {
          await bulkUpdate.page.reload();
          await bulkUpdateId1.waitFor();
        }
        await expect(bulkUpdateId1.locator(bulkUpdate.iconDone)).toBeVisible({ timeout: 50 });
      }).toPass({ intervals: [4_000, 5_000, 10_000] });
      // Check thay đổi
      for (const product of sampleProducts) {
        const newPage = await context.newPage();
        const productDetail = new ProductPage(newPage, conf.suiteConf.domain);
        const productDescription = productDetail.descriptionBody;

        await productDetail.goto(product.link);
        await softExpect(productDetail.page.getByText(product.name).first()).toBeVisible();
        await productDetail.searchEngine.scrollIntoViewIfNeeded();
        const variants = await productDetail.variantsRow.first().isVisible();
        //Check thay đổi description
        const expectedDescription = product.description.includes("this autumn")
          ? cConf.expected.new_description
          : product.description;
        await softExpect(productDescription).toHaveText(expectedDescription);
        //Check thay đổi media
        await softExpect(productDetail.genLoc(productDetail.xpathMedia)).toHaveCount(1);
        const stringParts = uploadedImgs[1].split("/");
        const expectedImg = stringParts[stringParts.length - 1];
        await softExpect(
          productDetail.genLoc(productDetail.xpathMedia).and(productDetail.genLoc(`[src*='${expectedImg}']`)),
        ).toBeVisible();
        //Check custom option
        await softExpect(productDetail.customOptionItems).toBeHidden();
        //Check inventory policy
        if (variants) {
          for (const variant of await productDetail.variantsRow.all()) {
            await variant.locator(productDetail.editVariantBtn).click();
            await softExpect(productDetail.genLoc(productDetail.xpathInventoryPolicySlt)).toHaveValue(
              cConf.expected.inventory_policy,
            );
            //Check purchase out of stock
            await softExpect(productDetail.purchaseOutOfStockCheckbox).toBeChecked();
            await productDetail.page.goBack();
          }
        } else {
          await softExpect(productDetail.genLoc(productDetail.xpathInventoryPolicySlt)).toHaveValue(
            cConf.expected.inventory_policy,
          );
          //Check purchase out of stock
          await softExpect(productDetail.purchaseOutOfStockCheckbox).toBeChecked();
        }

        //Check access token
        await softExpect(productDetail.fbAccessToken).toHaveValue(cConf.expected.new_access_token);
        //Check pixel id
        await softExpect(productDetail.fbPixelId).toHaveValue(cConf.expected.new_pixel_id);
        //Check product page design
        await softExpect(productDetail.appliedPageDesign).toHaveText(cConf.expected.custom_page_design);
        await newPage.close();
      }
    });
  });
});
