import { test } from "@fixtures/odoo";
import { error } from "winston";
import { OdooService } from "@services/odoo";
import { formatDate } from "@core/utils/datetime";

test("test @TC_ODOO", async ({ odoo }) => {
  const args = [["name", "ilike", "UMI MAO Women Clothing Harajuku"]];

  await test.step("Case 001: read records filtered by fields", async () => {
    // Search read without limit
    await odoo.searchRead({ model: "product.template", args: args, fields: ["name", "id"] });

    // Search read with limit
    await odoo.searchRead({
      model: "product.template",
      args: args,
      fields: ["name", "id"],
      offset: 1,
      limit: 2,
    });

    // Search read and order records
    await odoo.searchRead({
      model: "product.public.category",
      args: [["name", "ilike", "a"]],
      fields: ["write_date", "write_uid"],
      order: "write_uid asc,  write_date desc",
    });
  });

  await test.step("Case 002: search record", async () => {
    await odoo.search({ model: "product.template", args: args, limit: 1, order: "id asc" });
  });

  await test.step("Case 003: count records", async () => {
    await odoo.count("product.template", args);
  });

  await test.step("Case 004: create record", async () => {
    const args = { name: "Ha test" };
    await odoo.create("product.template", args);
  });

  await test.step("Case 005: read records", async () => {
    const ids = [1997];
    await odoo.read("product.template", ids);
  });

  await test.step("Case 006: update record", async () => {
    const id = 1997;
    // eslint-disable-next-line camelcase
    const dataUpdate = { name: "Ha test 1", lst_price: 0 };
    const args = [["id", "=", id]];
    const totalRecord = await odoo.count("product.template", args);

    if (totalRecord) {
      await odoo.update("product.template", id, dataUpdate);
    } else {
      throw error("Not found id");
    }
  });

  await test.step("Case 007: delete records", async () => {
    const ids = [2377, 2380];
    await odoo.delete("product.template", ids);
  });
});

test.describe("Test call action", async () => {
  test("Test cancel quotation @TC_ODOO2", async ({ odoo }) => {
    const odooService = OdooService(odoo);
    await odooService.cancelQuotation(1010172, 3);
  });

  test("Test set to quotation @TC_ODOO2", async ({ odoo }) => {
    const odooService = OdooService(odoo);
    await odooService.setQuotationDraft(1010172);
  });

  test("Test enable flash sale @TC_ODOO2", async ({ odoo }) => {
    const odooService = OdooService(odoo);
    const date = formatDate(new Date(), "YYYY-MM-DD HH:mm:ss");
    await odooService.addProductToFlashSale(1005744, 35, date, 300);
  });

  test("Test unlink @TC_ODOO2", async ({ odoo }) => {
    const odooService = OdooService(odoo);
    await odooService.unlinkQuotation(1009659);
  });

  test("Test send quotation @TC_ODOO2", async ({ odoo }) => {
    const odooService = OdooService(odoo);
    await odooService.sendQuotation(1005792);
  });
});
