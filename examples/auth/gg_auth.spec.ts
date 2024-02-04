import { expect, test } from "@core/fixtures";
import { SaleChannelAPI } from "@pages/api/dashboard/sale_channel";

test.describe("Login to ShopBase and select one shop to go @TS_AUTH_API_01", async () => {
  test("test api @TC_AUTH_GG", async ({ ggPage }) => {
    await ggPage.goto("https://merchants.google.com/mc/overview");
    await ggPage.waitForLoadState("networkidle");
    await expect(ggPage.url()).toContain("https://merchants.google.com/mc/overview");
  });

  test("test api @TC_AUTH_KLAVIYO", async ({ authRequest }) => {
    const saleChannelApi = new SaleChannelAPI("yonex9.myshopbase.net", authRequest);
    await test.step("Vào Klavyio > Audience > All contacts > Kiểm tra thông tin Customer được sync lên Audience", async () => {
      const membersID = await saleChannelApi.getKlavyioMemberIDByEmail({
        email: "myduong+1@beeketing.net",
        token: "pk_04d1895483d629944e9e8fba9b7fe19b72",
        revision: "2023-01-24",
      });

      // eslint-disable-next-line no-console
      console.log(membersID);
      const metricID = await saleChannelApi.getKlavyioMetricIDByEmail({
        token: "pk_04d1895483d629944e9e8fba9b7fe19b72",
      });
      // eslint-disable-next-line no-console
      console.log(metricID);

      const event = await saleChannelApi.getKlavyioEventByEmail({
        memberID: membersID,
        token: "pk_04d1895483d629944e9e8fba9b7fe19b72",
      });
      // eslint-disable-next-line no-console
      console.log(event);
    });
  });
});
