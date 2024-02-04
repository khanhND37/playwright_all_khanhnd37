import { test } from "@fixtures/odoo";
import { OdooService } from "@services/odoo";
import type { TemplateAttribute, PlbProductVariant, OdooSaleOrderUpdateReq } from "@types";

test.describe("Create product catalog PlusBase @SB_PLB_PRO_CTL_1", () => {
  test("Create product catalog PlusBase @SB_PLB_PRO_CTL_1", async ({ conf, odoo }) => {
    const odooService = OdooService(odoo);
    const attributes: Array<TemplateAttribute> = [];
    const productAttributes = conf.suiteConf.default_attributes;
    for (let i = 0; i < productAttributes.length; i++) {
      if (productAttributes[i].on_product_create) {
        const attribute: TemplateAttribute = {
          id: productAttributes[i].id,
          number_of_values: productAttributes[i].number_of_values,
        };
        attributes.push(attribute);
      }
    }

    // nhập data tên product mong muốn
    const productNameExpected = `product catalog team plus`;
    const productName = `${conf.caseConf.product_name} ${productNameExpected}`;

    // nhập data delivery carrier id - Id shipping type trên odoo
    const deliveryCarrierId = conf.suiteConf.delivery_carrier_id;

    // nhập data product variant gồm có: Giá + cân nặng theo từng variant
    const dataProductVariant: Array<PlbProductVariant> = conf.caseConf.data_product_variants;

    // nhập data sale order để báo giá
    const dataSaleOrder: OdooSaleOrderUpdateReq = conf.caseConf.data_sale_order;
    const priceVariants = conf.caseConf.price_variants;

    // tạo product catalog plus base
    await odooService.createProductCatalogPlusBase(
      productName,
      deliveryCarrierId,
      attributes,
      dataProductVariant,
      dataSaleOrder,
      priceVariants,
    );
  });
});
