import { expect } from "@playwright/test";
import { test } from "@fixtures/odoo";
import { OdooService, OdooServiceInterface } from "@services/odoo";
import { csvToBase64, csvToJson, jsonToCsv } from "@helper/file";
import { ShippingRateResponse, PlbProductVariant } from "@types";

test.describe("Import cost for product template - Plusbase", () => {
  let odooService: OdooServiceInterface;

  test.beforeAll(async ({ odoo }) => {
    odooService = OdooService(odoo);
  });

  test.beforeEach(async ({ conf }) => {
    test.setTimeout(conf.suiteConf.time_out);
    const productTmplId = conf.caseConf.product_template_id || 0;
    if (productTmplId > 0) {
      // Clear data cũ cho nhẹ db
      await odooService.deleteViewProductTmplRecordByActionType(productTmplId, "import_sourcing_product");
      await odooService.deleteAllMailMessageByProductId(productTmplId);
    }
  });

  test(`@SB_SBFF_IS_14 Verify import cost calculation không đúng định dạng file XLSX trong tab sourcing infor`, async ({
    conf,
  }) => {
    for (const dataImport of conf.caseConf.data_imports) {
      await test.step(`Click Import cost calculation > Chọn File import có đuôi ${dataImport.type}`, async () => {
        // Upload File and Verify error message
        expect(
          await importFile(conf.caseConf.product_template_id, dataImport.import_file_src, dataImport.import_file_name),
        ).toEqual(dataImport.error_message);
      });
    }
  });

  test(`@SB_SBFF_IS_15 Verify import cost calculation có các line thiếu data trong tab sourcing infor`, async ({
    conf,
  }) => {
    for (const dataImport of conf.caseConf.data_imports) {
      await test.step(`Click Import cost calculation > Chọn File import để trống field ${dataImport.empty_field}`, async () => {
        await resetFileImport(conf.suiteConf.raw_import_file_src, conf.caseConf.import_file_src);
        // Change data to make file difference between cases
        await changeXLSXData(conf.caseConf.import_file_src, dataImport.update_csv_data);
        // Upload File and Verify error message
        expect(
          await importFile(
            conf.caseConf.product_template_id,
            conf.caseConf.import_file_src,
            conf.caseConf.import_file_name,
          ),
        ).toEqual(dataImport.error_message);
      });
    }
  });

  test(`@SB_SBFF_IS_16 Verify import cost calculation có data không đúng format trong tab sourcing infor`, async ({
    conf,
  }) => {
    for (const dataImport of conf.caseConf.data_imports) {
      await test.step(`Click Import cost calculation > Chọn File import có field ${dataImport.field} là text`, async () => {
        await resetFileImport(conf.suiteConf.raw_import_file_src, conf.caseConf.import_file_src);
        // Change data to make file difference between cases
        await changeXLSXData(conf.caseConf.import_file_src, dataImport.update_csv_data);
        // Upload File and Verify error message
        expect(
          await importFile(
            conf.caseConf.product_template_id,
            conf.caseConf.import_file_src,
            conf.caseConf.import_file_name,
          ),
        ).toEqual(dataImport.error_message);
      });
    }
  });

  test(`@SB_SBFF_IS_17 Verify import cost calculation có product id/variants id không đúng trong tab sourcing infor`, async ({
    conf,
  }) => {
    for (const dataImport of conf.caseConf.data_imports) {
      await test.step(`Click Import cost calculation > ${dataImport.step_name}`, async () => {
        await resetFileImport(conf.suiteConf.raw_import_file_src, conf.caseConf.import_file_src);
        // Change data to make file difference between cases
        await changeXLSXData(conf.caseConf.import_file_src, dataImport.update_csv_data);
        // Upload File and Verify error message (step 1, step 2)
        expect(
          await importFile(
            conf.caseConf.product_template_id,
            conf.caseConf.import_file_src,
            conf.caseConf.import_file_name,
          ),
        ).toEqual(dataImport.error_message);
        // Step 3, verify data not change when error occur
        const verifyVariantCost = dataImport.verify_variant_cost || [];
        if (verifyVariantCost.length > 0) {
          const ids = verifyVariantCost.map(i => i.variant_id);
          const variants = await odooService.getVariantInforByIds(ids, conf.caseConf.query_fields);
          expect(ids.length).toEqual(variants.length);
          for (const verifyData of verifyVariantCost) {
            const variant = variants.find(i => i.id == verifyData.variant_id);
            expect(variant).not.toBeUndefined();
            for (const field of verifyData.fields) {
              expect(roundTo(variant[field.name])).toEqual(field.value);
            }
          }
        }
      });
    }
  });

  test(`@SB_SBFF_IS_18 Verify import cost calculation trong tab sourcing infor thành công`, async ({
    conf,
    request,
  }) => {
    await test.step(`Click Import  cost calculation > Chọn File import đúng định dạng, đúng format, đủ data`, async () => {
      await resetFileImport(conf.suiteConf.raw_import_file_src, conf.caseConf.import_file_src);
      // Upload File
      expect(
        await importFile(
          conf.caseConf.product_template_id,
          conf.caseConf.import_file_src,
          conf.caseConf.import_file_name,
        ),
      ).toEqual("");
    });

    await test.step(`Verify data trong bảng cost calculation`, async () => {
      const verifyVariantCost = conf.caseConf.verify_variant_cost || [];
      if (verifyVariantCost.length > 0) {
        // Get rmb rate
        const rmbRate = await odooService.getRmbRate();
        const shippingRate = await odooService.getProductShippingRate(
          request,
          conf.suiteConf.api,
          conf.caseConf.product_template_id,
          conf.caseConf.shop_id,
          conf.caseConf.sb_country_id,
        );
        // Get variant data
        const ids = verifyVariantCost.map(i => i.variant_id);
        const variants = await odooService.getVariantInforByIds(ids, conf.caseConf.query_fields);
        expect(ids.length).toEqual(variants.length);
        // Start compare data
        for (const verifyData of verifyVariantCost) {
          const variant = variants.find(i => i.id == verifyData.variant_id);
          expect(variant).not.toBeUndefined();
          for (const field of verifyData.fields) {
            switch (field.name) {
              case "volume":
                expect(roundTo(variant.volume)).toEqual(calculateVolume(variant));
                break;
              case "x_variant_weight":
                expect(roundTo(variant.x_variant_weight)).toEqual(calculateWeight(variant, calculateVolume(variant)));
                break;
              case "dom_shipping_fee":
                expect(roundTo(variant.dom_shipping_fee)).toEqual(
                  getVariantDomShippingFee(shippingRate, verifyData.variant_id),
                );
                break;
              case "product_profit":
                expect(roundTo(variant.product_profit)).toEqual(
                  calculateProductProfit(
                    calculateTotalCostUSD(variant, rmbRate),
                    getVariantDomShippingFee(shippingRate, verifyData.variant_id),
                  ),
                );
                break;
              case "product_cost":
                // Base cost (USD) = Profit + Total cost USD
                expect(roundTo(variant.product_cost)).toEqual(
                  roundTo(
                    calculateProductProfit(
                      calculateTotalCostUSD(variant, rmbRate),
                      getVariantDomShippingFee(shippingRate, verifyData.variant_id),
                    ) + calculateTotalCostUSD(variant, rmbRate),
                  ),
                );
                break;
              default:
                expect(roundTo(variant[field.name])).toEqual(field.value);
            }
          }
        }
      }
    });
  });

  type updateXLSXDataReq = {
    column: string;
    rowNo: number;
    value: string;
  };

  /**
   * Reset data of file csv before change
   * @param src path of source file
   * @param dest path of destination file
   * @returns void
   */
  const resetFileImport = async (src: string, dest: string): Promise<void> => {
    const rawDataFileImport = await csvToJson(src);
    const req = new Array<updateXLSXDataReq>();
    for (let i = 0; i < rawDataFileImport.length; i++) {
      for (const key in rawDataFileImport[i]) {
        req.push({
          column: key,
          rowNo: i,
          value: rawDataFileImport[i][key],
        });
      }
    }
    await updateXLSXData(dest, req);
  };

  /**
   * Change CSV data before import
   * @param importFileSrc file src
   * @param changes
   * @returns void
   */
  const changeXLSXData = async (
    importFileSrc: string,
    changes: [{ column: string; row_no: number; value: string }],
  ): Promise<void> => {
    // Change data to make file difference between cases
    if (changes.length > 0) {
      const req = new Array<updateXLSXDataReq>();
      for (const data of changes) {
        req.push({
          column: data.column,
          rowNo: data.row_no,
          value: data.value,
        });
      }
      // Update XLSX data
      await updateXLSXData(importFileSrc, req);
    }
  };

  /**
   * Update XLSX data before import
   * @param filePath path of file
   * @param column column name of file
   * @param rowNo row no
   * @returns void
   */
  const updateXLSXData = async (filePath: string, req: updateXLSXDataReq[]): Promise<void> => {
    if (!filePath || !req.length) return;
    const data = await csvToJson(filePath);
    if (data.length > 0) {
      for (const item of req) {
        data[item.rowNo][item.column] = item.value;
      }

      for (const key in data) {
        ["variant_name", "sourcing_variant"].forEach(name => {
          const dataNeedFormat = data[key][name];
          if (dataNeedFormat.length > 0) {
            data[key][name] = `"${dataNeedFormat.replace(/"/g, '""')}"`;
          }
        });
      }
    }
    await jsonToCsv(data, "", filePath, true);
  };

  /**
   * Import file
   * @param productId product id
   * @param importFileSrc
   * @param importFileName
   * @returns error message if exists
   */
  const importFile = async (productId: number, importFileSrc: string, importFileName: string): Promise<string> => {
    // Upload File
    let errMessage = "";
    const fileUploadBase64 = await csvToBase64(importFileSrc);
    try {
      await odooService.importSourcingInfoCost(productId, importFileName, fileUploadBase64);
    } catch (error) {
      // Catch error
      errMessage = error.faultString || "";
    }

    return errMessage;
  };

  /**
   * Get variant dom shipping fee
   * @param rates ShippingRateResponse
   * @param variantId variant id
   * @returns dom shipping fee
   */
  const getVariantDomShippingFee = (rates: ShippingRateResponse, variantId: number): number => {
    let variantRates = rates.variant_shipping_methods[variantId.toString()];
    if (variantRates.length === 0) {
      throw new Error("Variant empty shipping rate");
    }

    // Find rate with group standard
    let rate = variantRates.find(i => i.shipping_group_code === "standard");
    if (!rate) {
      // if empty, try get smallest
      variantRates = variantRates.sort((a, b) => a.first_item_price - b.first_item_price);
      rate = variantRates[0];
    }

    return roundTo(rate.first_item_price);
  };

  /**
   * Round number
   * @param number
   * @returns rounded number
   */
  const roundTo = (number: number): number => {
    return Math.round((number + Number.EPSILON) * 100) / 100;
  };

  /**
   * Calculate volume | Volume (kg) = (H(cm) * W(cm) * L(cm))/9000
   * @param height
   * @param width
   * @param length
   * @returns number
   */
  const calculateVolume = (variant: PlbProductVariant): number => {
    return roundTo((variant.height * variant.width * variant.length) / 9000);
  };

  /**
   * Calculate weight
   * So sánh Volume (cân nặng thể tích) với (product weight(kg) + package weight(kg))
   * -> Cái nào lớn hơn thì lấy giá trị đó
   * @param volume
   * @param xVariantWeight
   * @param packageWeight
   * @returns number
   */
  const calculateWeight = (variant: PlbProductVariant, volume: number): number => {
    const tempWeight = roundTo(variant.variant_weight + variant.package_weight);
    return volume > tempWeight ? volume : tempWeight;
  };

  /**
   * Calculate total cost and conver to usd
   * Total cost (USD) = (Product cost (RMB) + Shipping cost (RMB)) / Rate
   * @param productCostRmb
   * @param shippingCostRmb
   * @param rate
   * @returns number
   */
  const calculateTotalCostUSD = (variant: PlbProductVariant, rate: number): number => {
    return roundTo((variant.product_cost_rmb + variant.shipping_cost_rmb) / rate);
  };

  /**
   * Calculate product profit
   * Profit (USD) = [Total cost (RMB)/exchange rate + Shipping cost (USD)]*15%  đạt tối đa là 1.3$
   * @param totalCostUSD
   * @param shippingCostUSD
   * @param percent default 15
   * @param max default 1.3
   * @returns number
   */
  const calculateProductProfit = (totalCostUSD: number, shippingCostUSD: number, percent = 15, max = 1.3): number => {
    const profit = roundTo((totalCostUSD + shippingCostUSD) / (percent / 100));
    return profit > max ? max : profit;
  };
});
