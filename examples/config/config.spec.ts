import { test, expect } from "@core/fixtures";

test.describe("test cde @TS_SB_001", async () => {
  test("test abc @TC_CONF_001", async ({ conf }) => {
    expect(conf.suiteConf.domain).toBe("accounts.shopbase.net.cn");
    expect(conf.caseConf.shop_position).toBe(1);
  });

  test("test abc @TC_CONF_002", async ({ conf }) => {
    expect(conf.suiteConf.domain).toBe("accounts.stag.shopbase.net");
    expect(conf.caseConf.shop_position).toBe(22);
  });
});
