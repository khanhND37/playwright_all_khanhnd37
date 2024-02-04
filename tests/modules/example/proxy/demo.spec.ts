import { expect, test } from "@core/fixtures";
import { getProxyPageByCountry, supportedProxyCountry } from "@utils/proxy_page";

test.describe("@TS_SB_DEMO test suite for run demo purpose", async () => {
  test.slow();
  test(`@SB_DEMO_PROXY_01 demo proxy by country`, async ({ cConf }) => {
    const shopUrl = cConf.shop_url;
    const countryMap = {
      in: "India",
      us: "United States",
      gb: "United Kingdom",
      se: "Sweden",
      ca: "Canada",
      de: "Germany",
      br: "Brazil",
      fr: "France",
      au: "Australia",
      it: "Italy",
      tr: "Turkey",
      mx: "Mexico",
      es: "Spain",
      nl: "Netherlands",
      vn: "Vietnam",
      bd: "Bangladesh",
      id: "Indonesia",
      pl: "Poland",
      sg: "Singapore",
      kr: "South Korea",
    };

    for (const [countryCode, countryName] of Object.entries(countryMap)) {
      const proxyPage = await getProxyPageByCountry(countryCode as supportedProxyCountry);
      await proxyPage.goto(shopUrl);
      await proxyPage.waitForLoadState("networkidle");
      await proxyPage
        .locator("//div[contains(@class, 'currency-language_action')]//div")
        .first()
        .click({
          position: {
            x: 5,
            y: 5,
          },
        });
      await expect(proxyPage.locator("//div[contains(@class, 'currency-language-v2--wrapper')]")).toBeVisible();

      await expect(proxyPage.locator("//div[contains(@class, 'custom-select')]").first()).toContainText(countryName);
      await proxyPage.close();
    }
  });
});
