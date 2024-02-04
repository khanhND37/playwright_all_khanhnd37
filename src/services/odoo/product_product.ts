import type { FixtureOdoo, OdooProductProduct } from "@types";

export class ProductProduct {
  private odoo: FixtureOdoo;
  private name: string;
  private defaultFields: Array<string>;

  constructor(odoo: FixtureOdoo) {
    this.odoo = odoo;
    this.name = "product.product";
    this.defaultFields = ["id"];
  }

  /**
   * Get product product by product template id
   * @param id
   * @param fields
   * @param limit
   */
  async getProductProductsByProductTemplateId(
    id: number,
    fields?: Array<string>,
    limit?: number,
  ): Promise<Array<OdooProductProduct>> {
    const reqFields = fields && fields.length ? fields : this.defaultFields;
    const req = {
      model: this.name,
      args: [["product_tmpl_id", "=", id]],
      fields: reqFields,
    };
    if (limit) {
      req["limit"] = limit;
    }
    const products: Array<OdooProductProduct> = await this.odoo.searchRead(req);

    return products;
  }
}
