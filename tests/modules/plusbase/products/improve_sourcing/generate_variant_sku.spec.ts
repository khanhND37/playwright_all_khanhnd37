import { expect } from "@playwright/test";
import { test } from "@fixtures/odoo";
import { OdooService, OdooServiceInterface } from "@services/odoo";
import { PlbProductVariant } from "@types";

test.describe("Generate variant sku - Plusbase", () => {
  let odooService: OdooServiceInterface;

  test.beforeEach(async ({ odoo }) => {
    odooService = OdooService(odoo);
  });

  test(`@SB_SBFF_IS_21 Verify auto gen SKU thành công khi điền thông tin category code trong product template`, async ({
    conf,
  }) => {
    let variants: PlbProductVariant[];

    await test.step(`Clear data before run test`, async () => {
      await clearData(conf.caseConf.product_template_id, conf.caseConf.product_product_ids);
    });

    await test.step(`Điền category code > Click Save > Click Gen SKU`, async () => {
      // Điền category code
      await odooService.updateProductTemplate([conf.caseConf.product_template_id], {
        x_category_code: conf.caseConf.category_code,
      });
      // Gen sku and check message
      const result = await odooService.callActionGenSku(conf.caseConf.product_template_id);
      expect(result.params.type).toEqual(conf.caseConf.action_gen_sku_status);
      expect(result.params.title).toContain(conf.caseConf.action_gen_sku_title);
    });
    await test.step(`Vào Product variant > Verify SKU được gen`, async () => {
      // Lấy thông tin variant
      variants = await odooService.getVariantInforByIds(conf.caseConf.product_product_ids, ["default_code"]);
      expect(variants.length).toEqual(conf.caseConf.product_product_ids.length);
      for (const variant of variants) {
        const skuExpect = conf.caseConf.product_product_sku_expect.find(i => i.id === variant.id);
        expect(skuExpect).not.toBeUndefined();
        // Cấu trúc sku phải đúng
        expect(
          verifySku(variant.default_code, conf.caseConf.category_code, skuExpect.option1, skuExpect.option2),
        ).toBeTruthy();
      }
    });
    await test.step(`Vào product variant detail > Verify log action gen SKU`, async () => {
      for (const variant of variants) {
        const mailMessages = await odooService.getMailMessagebyText(
          "product.product",
          variant.id,
          `${variant.default_code}`,
        );
        expect(mailMessages.length).toEqual(1);
      }
    });
  });

  test(`@SB_SBFF_IS_22 Verify gen SKU không thành công khi không điền category code trong product template`, async ({
    conf,
  }) => {
    await test.step(`Clear data before run test`, async () => {
      await clearData(conf.caseConf.product_template_id);
    });

    await test.step(`Chọn Sales > Product template detail > Điền shipping type, không điền category code > Click Save > Click Gen SKU`, async () => {
      // Việc clear category code đã thực hiện ở bước before each, ở bước này chỉ cần gen sku thôi
      let isErrorOccur = false;
      try {
        await odooService.callActionGenSku(conf.caseConf.product_template_id);
      } catch (error) {
        // Check message error có đúng không
        expect(error.faultString).toEqual(conf.caseConf.gen_sku_missing_category_error);
        isErrorOccur = true;
      }
      expect(isErrorOccur).toBeTruthy();
    });
  });

  test(`@SB_SBFF_IS_23 Verify gen SKU và alert khi các product có link sourcing và sourcing value trùng nhau`, async ({
    conf,
  }) => {
    const variantIds1 = conf.caseConf.product_product_ids;
    const productTplId2 = conf.caseConf.product_template_id_2;
    const variantIds2 = conf.caseConf.product_product_ids_2;

    await test.step(`Clear data before run test`, async () => {
      // Reset category code
      await odooService.updateProductTemplate([productTplId2], {
        x_category_code: "",
      });
      await odooService.deleteAllMailMessageByProductId(productTplId2);
      // Reset variant sku
      await odooService.updateProductVariant(variantIds2, {
        default_code: "",
      });
      await odooService.deleteMailMessageByVariantIds(variantIds2);
    });

    await test.step(`Vào product template detail của product 2 > Nhập category code > Click Save > Click gen SKU`, async () => {
      // Set category
      await odooService.updateProductTemplate([productTplId2], {
        x_category_code: conf.caseConf.category_code,
      });
      // Gen sku thành công check message thông báo
      const result = await odooService.callActionGenSku(productTplId2);
      expect(result.params.type).toEqual(conf.caseConf.action_gen_sku_status);
      expect(result.params.title).toContain(conf.caseConf.action_gen_sku_title);
    });

    await test.step(`Vào product variant của product 2 > Verify SKU được gen`, async () => {
      // Lấy thông tin variant của product 1
      const variants1 = await odooService.getVariantInforByIds(variantIds1, ["default_code"]);
      // Lấy thông tin variant của product 2
      const variants2 = await odooService.getVariantInforByIds(variantIds2, ["default_code"]);
      // Verify các variant có cùng sku khi có cùng sourcing link và sourcing value
      for (const variant2 of variants2) {
        const skuExpect = conf.caseConf.product_product_sku_expect_2.find(i => i.id === variant2.id);
        expect(skuExpect).not.toBeUndefined();
        const variantCompare = variants1.find(i => i.id === skuExpect.compare_id);
        expect(variantCompare).not.toBeUndefined();
        expect(variant2.default_code).toEqual(variantCompare.default_code);
      }
    });
  });

  test(`@SB_SBFF_IS_24 Verify gen SKU khi attribute value thay đổi`, async ({ conf }) => {
    let variants: PlbProductVariant[];

    await test.step(`Clear data before run test`, async () => {
      const productProductIds: number[] = [];
      productProductIds.push(...conf.caseConf.product_product_ids, ...conf.caseConf.clear_product_product_ids);
      await odooService.deleteViewProductTmplRecordByValues(conf.caseConf.product_template_id, [
        conf.caseConf.old_attribute_name,
        conf.caseConf.new_attribute_name,
      ]);
      await clearData(conf.caseConf.product_template_id, productProductIds);
    });

    await test.step(`Login vào odoo > Mở Product template detail > Click edit > Chọn tab Variant > Thay đổi attribute value > Click Save > Check data product trên dashboard`, async () => {
      // Prepare data (Đảm bảo tất cả variant đã được gen sku)
      await odooService.replaceProductAttributeValue(
        conf.caseConf.product_template_id,
        conf.caseConf.product_template_attribute_value_id,
        conf.caseConf.old_attribute_name,
      );
      await odooService.updateProductTemplate([conf.caseConf.product_template_id], {
        x_category_code: conf.caseConf.category_code,
      });
      const result = await odooService.callActionGenSku(conf.caseConf.product_template_id);
      expect(result.params.type).toEqual(conf.caseConf.action_gen_sku_status);
      // Get data before change attribute
      variants = await odooService.getVariantInforByIds(
        [...conf.caseConf.product_product_ids, ...conf.caseConf.clear_product_product_ids],
        ["default_code"],
      );
      expect(variants.length).toEqual(
        conf.caseConf.product_product_ids.length + conf.caseConf.clear_product_product_ids.length,
      );
      // Change attribute value
      await odooService.replaceProductAttributeValue(
        conf.caseConf.product_template_id,
        conf.caseConf.product_template_attribute_value_id,
        conf.caseConf.new_attribute_name,
      );
      // Clear sku để sau đó check case gen mới sku
      await odooService.updateProductVariant(conf.caseConf.clear_product_product_ids, {
        default_code: "",
      });
    });
    await test.step(`Click Gen SKU`, async () => {
      // Regen sku and check message
      const result = await odooService.callActionGenSku(conf.caseConf.product_template_id);
      expect(result.params.type).toEqual(conf.caseConf.action_gen_sku_status);
      expect(result.params.title).toContain(conf.caseConf.action_gen_sku_title);
    });
    await test.step(`Vào product variant > Verify SKU được gen`, async () => {
      // Check case nếu variant đã có sku thì không gen lại nữa (Xem variant có giữ nguyên sku không)
      const variantNotChangeSku = await odooService.getVariantInforByIds(conf.caseConf.product_product_ids, [
        "default_code",
      ]);
      expect(variantNotChangeSku.length).toEqual(conf.caseConf.product_product_ids.length);
      for (const variantNotChange of variantNotChangeSku) {
        const skuExpect = conf.caseConf.product_product_sku_expect.find(i => i.id === variantNotChange.id);
        expect(skuExpect).not.toBeUndefined();
        // Cấu trúc sku phải đúng
        expect(
          verifySku(variantNotChange.default_code, conf.caseConf.category_code, skuExpect.option1, skuExpect.option2),
        ).toBeTruthy();
        // Hai variant cần giống sku
        const variantCompare = variants.find(i => i.id === variantNotChange.id);
        expect(variantCompare).not.toBeUndefined();
        expect(variantNotChange.default_code).toEqual(variantCompare.default_code);
      }
      // Check case chưa có sku thì gen mới (Xem variant có được gen lại sku không)
      const variantChangeSku = await odooService.getVariantInforByIds(conf.caseConf.clear_product_product_ids, [
        "default_code",
      ]);
      expect(variantChangeSku.length).toEqual(conf.caseConf.clear_product_product_ids.length);
      for (const variantChange of variantChangeSku) {
        const skuExpect = conf.caseConf.clear_product_product_sku_expect.find(i => i.id === variantChange.id);
        expect(skuExpect).not.toBeUndefined();
        // Cấu trúc sku phải đúng
        expect(
          verifySku(variantChange.default_code, conf.caseConf.category_code, skuExpect.option1, skuExpect.option2),
        ).toBeTruthy();
        // Hai variant cần khác sku
        const variantCompare = variants.find(i => i.id === variantChange.id);
        expect(variantCompare).not.toBeUndefined();
        expect(variantChange.default_code).not.toEqual(variantCompare.default_code);
      }
    });
  });

  test(`@SB_SBFF_IS_26 Verify gen SKU khi các product có link sourcing và sourcing value không trùng nhau`, async ({
    conf,
  }) => {
    let variants: PlbProductVariant[]; // Variant của product 1

    await test.step(`Clear data before run test`, async () => {
      await clearData(conf.caseConf.product_template_id, conf.caseConf.product_product_ids);
      await clearData(conf.caseConf.product_template_id_2, conf.caseConf.product_product_ids_2);
    });

    await test.step(`Vào tab Sourcing infor > Nhập category code > Click Save`, async () => {
      // Thêm category code và sourcing link cho product 1
      await odooService.updateProductTemplate([conf.caseConf.product_template_id], {
        x_category_code: conf.caseConf.category_code,
        x_purchase_url: [[0, null, { x_url: conf.caseConf.sourcing_link }]],
      });
      // Thêm sourcing link cho product 2
      await odooService.updateProductTemplate([conf.caseConf.product_template_id_2], {
        x_purchase_url: [[0, null, { x_url: conf.caseConf.sourcing_link_2 }]],
      });
    });
    await test.step(`Click Gen SKU > Vào product variant > Verify SKU được gen`, async () => {
      // Gen sku cho product 1
      const result = await odooService.callActionGenSku(conf.caseConf.product_template_id);
      expect(result.params.type).toEqual(conf.caseConf.action_gen_sku_status);
      // Lấy thông tin variant (Variant của product 1)
      variants = await odooService.getVariantInforByIds(conf.caseConf.product_product_ids, ["default_code"]);
      expect(variants.length).toEqual(conf.caseConf.product_product_ids.length);
      // Verify sku của product 1
      for (const variant of variants) {
        const skuExpect = conf.caseConf.product_product_sku_expect.find(i => i.id === variant.id);
        expect(skuExpect).not.toBeUndefined();
        // Cấu trúc sku phải đúng
        expect(
          verifySku(variant.default_code, conf.caseConf.category_code, skuExpect.option1, skuExpect.option2),
        ).toBeTruthy();
      }
    });
    await test.step(`Vào Product template detail của product 2 > Click gen SKU`, async () => {
      // Do không trùng sourcing link nên khi gọi action gen sku sẽ báo lỗi
      let isErrorOccur = false;
      try {
        await odooService.callActionGenSku(conf.caseConf.product_template_id_2);
      } catch (error) {
        // Check message error có đúng không
        expect(error.faultString).toEqual(conf.caseConf.gen_sku_missing_category_error);
        isErrorOccur = true;
      }
      expect(isErrorOccur).toBeTruthy();
    });
    await test.step(`Click Edit > Nhập category code > Click Save > Click Gen SKU`, async () => {
      // Thêm category code để gen thành công
      await odooService.updateProductTemplate([conf.caseConf.product_template_id_2], {
        x_category_code: conf.caseConf.category_code_2,
      });
      // Gen sku và check message thông báo
      const result = await odooService.callActionGenSku(conf.caseConf.product_template_id_2);
      expect(result.params.type).toEqual(conf.caseConf.action_gen_sku_status);
      expect(result.params.title).toContain(conf.caseConf.action_gen_sku_title);
    });
    await test.step(`Vào product variant > Verify SKU được gen`, async () => {
      // Lấy thông tin variant (Variant của product 2)
      const variants2 = await odooService.getVariantInforByIds(conf.caseConf.product_product_ids_2, ["default_code"]);
      expect(variants2.length).toEqual(conf.caseConf.product_product_ids_2.length);
      // Compare sku
      expect(variants.length).toEqual(variants2.length);
      for (const variant2 of variants2) {
        const skuExpect = conf.caseConf.product_product_sku_expect_2.find(i => i.id === variant2.id);
        expect(skuExpect).not.toBeUndefined();
        // Cấu trúc sku phải đúng
        expect(
          verifySku(variant2.default_code, conf.caseConf.category_code_2, skuExpect.option1, skuExpect.option2),
        ).toBeTruthy();
        // Hai variant cần có sku khác nhau do khác sourcing link
        const variantCompare = variants.find(i => i.id === skuExpect.compare_id);
        expect(variantCompare).not.toBeUndefined();
        expect(variant2.default_code).not.toEqual(variantCompare.default_code);
      }
    });
  });

  /**
   * Use to clear data
   * @param productId product template id
   * @param variantIds product product ids
   * @returns void
   */
  const clearData = async (productId: number, variantIds?: number[]) => {
    if (productId > 0) {
      await odooService.updateProductTemplate([productId], {
        x_category_code: "",
      });
      await odooService.deleteAllPurchaseUrlByProductId(productId);
      await odooService.deleteAllMailMessageByProductId(productId);
    }
    // Clear sku and history log
    if (variantIds && variantIds.length > 0) {
      await odooService.updateProductVariant(variantIds, {
        default_code: "",
      });
      await odooService.deleteMailMessageByVariantIds(variantIds);
    }
  };

  /**
   * Use to verify sku
   * @param sku sku need verify
   * @param code category code
   * @param opt1 option 1
   * @param opt2 option 2
   * @param opt3 option 3
   * @returns boolean
   */
  const verifySku = (sku: string, code?: string, opt1?: string, opt2?: string, opt3?: string): boolean => {
    if (!sku.length) return false;
    const skuParts = sku.split("-"); // Các phần của SKU được cách nhau bởi kí tự - (Ex: HG0004-BLA-XS)
    if (skuParts.length < 2) return false;

    let isCodeValid = true;
    let isOpt1Valid = true;
    let isOpt2Valid = true;
    let isOpt3Valid = true;

    // First part (Ex: HGxxxx)
    if (code) {
      isCodeValid =
        code.length < skuParts[0].length && skuParts[0].slice(0, code.length).toUpperCase() === code.toUpperCase();
    }
    // Other part (Ex: BLA, XS)
    if (opt1) {
      isOpt1Valid = opt1.toUpperCase() === skuParts[1].toUpperCase();
    }
    if (opt2 && skuParts.length > 2) {
      isOpt2Valid = opt2.toUpperCase() === skuParts[2].toUpperCase();
    }
    if (opt3 && skuParts.length > 3) {
      isOpt3Valid = opt3.toUpperCase() === skuParts[3].toUpperCase();
    }

    return isCodeValid && isOpt1Valid && isOpt2Valid && isOpt3Valid;
  };
});
