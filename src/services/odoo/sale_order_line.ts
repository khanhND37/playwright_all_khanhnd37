import type { FixtureOdoo, OdooSaleOrderLine } from "@types";

export class SaleOrderLine {
  private odoo: FixtureOdoo;
  private name: string;
  private defaultFields: Array<string>;

  constructor(odoo: FixtureOdoo) {
    this.odoo = odoo;
    this.name = "sale.order.line";
    this.defaultFields = ["id"];
  }

  /**
   * Get sale order lines by sale order id
   * @param id
   */
  async getSaleOrderLinesBySaleOrderId(id: number, fields?: Array<string>): Promise<Array<OdooSaleOrderLine>> {
    const reqFields = fields && fields.length ? fields : this.defaultFields;
    const orderLines: Array<OdooSaleOrderLine> = await this.odoo.searchRead({
      model: this.name,
      args: [["order_id", "=", id]],
      fields: reqFields,
    });

    return orderLines;
  }
}
