import { test, expect } from "@core/fixtures";

/**
 * Code name: `TS_AUTH_API_01`
 * Description: Test suite này demo case login vào shopbase dashboard và chọn store có position 1
 * Test case `TC_AUTH_API_01`: 
      - Before/Setup:
        - open browser
        - read config
        - get access token
      - Steps: 
        - Get product's data from Product API
        - Verify if api return 200
        - Verify if the product's handle value is true (equals to value in the config)
      - After/Teardown:
        - close browser
* External links: https://docs.ocg.to/books/qa-training/page/3-ocg-autopilot-examples/11043#bkmrk-basic
 */
test.describe(
  "Login to ShopBase and select one shop to go @TS_AUTH_API_01",
  async () => {
    test("test api @TC_AUTH_API_01", async ({ authRequest, conf }) => {
      const response = await authRequest.get(
        `https://${conf.suiteConf.domain}/admin/products/${conf.caseConf.product_id}.json`
      );
      expect(response.ok()).toBeTruthy();
      const jsonResponse = await response.json();
      expect(jsonResponse).toEqual(
        expect.objectContaining({
          product: expect.objectContaining({
            handle: conf.caseConf.handle,
          }),
        })
      );
    });
  }
);
