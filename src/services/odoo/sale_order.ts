import type { FixtureOdoo, OdooSaleOrderUpdateReq } from "@types";

export class SaleOrder {
  private odoo: FixtureOdoo;
  private name: string;
  private defaultFields: Array<string>;

  constructor(odoo: FixtureOdoo) {
    this.odoo = odoo;
    this.name = "sale.order";
    this.defaultFields = ["id"];
  }

  /**
   * Update single sale order by id
   * @param id
   * @param data
   */
  async updateSaleOrderById(id: number, data: OdooSaleOrderUpdateReq): Promise<boolean> {
    if (id < 1) {
      throw new Error("invalid id");
    }

    return await this.odoo.update(this.name, id, data);
  }
}
