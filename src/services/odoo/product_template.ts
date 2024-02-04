import type { FixtureOdoo, OdooProductTemplate, OdooProductTemplateUpdateReq } from "@types";

export class ProductTemplate {
  private odoo: FixtureOdoo;
  private name: string;
  private defaultFields: Array<string>;

  constructor(odoo: FixtureOdoo) {
    this.odoo = odoo;
    this.name = "product.template";
    this.defaultFields = ["id", "name", "x_url", "x_is_plus_base", "x_is_custom_request"];
  }

  /**
   * Get single product template by id
   * @param id
   */
  async getProductTemplateById(id: number, fields?: Array<string>): Promise<OdooProductTemplate> {
    const reqFields = fields && fields.length ? fields : this.defaultFields;
    const products: Array<OdooProductTemplate> = await this.odoo.read(this.name, [id], reqFields);
    if (products.length === 0) {
      throw new Error("not found");
    }
    return products[0];
  }

  /**
   * Update single product template by id
   * @param id
   * @param data
   */
  async updateProductTemplateById(id: number, data: OdooProductTemplateUpdateReq): Promise<boolean> {
    if (id < 1) {
      throw new Error("invalid id");
    }

    return await this.odoo.update(this.name, id, data);
  }
}
