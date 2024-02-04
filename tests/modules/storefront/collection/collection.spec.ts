import { test } from "@core/fixtures";
import { SFHome } from "@sf_pages/homepage";

test.describe("Visit collection page @TS_SB_SF_COL_01", () => {
  test("Visit Collection @TC_SB_SF_COL_01", async ({ page }) => {
    // const sfHome = new SFHome(page, "www.sominic.com");
    const sfHome = new SFHome(page, "monitor.onshopbase.com");
    const coll = await sfHome.gotoAllCollection();
    await coll.loadMore();
    const product = await coll.gotoProduct("Phone Case");
    // const product = await coll.gotoProduct(
    //   "SOMINIC Women Orthopedic Sandals Elastic Soft Sole Durable Odorless Summer Beach Slip-on"
    // );
    await product.addToCart();
    const cart = await product.gotoCart();
    const checkout = await cart.checkout();
    // eslint-disable-next-line no-console
    console.log(await checkout.isOnePageCheckout());
  });
});
