/* eslint-disable indent */
import { AccessTokenHeaderName, DefaultUserAgent, UserAgentHeaderName } from "@core/constant";
import type { TestApiCase } from "@types";
import { expect, test } from "@core/fixtures";
import globalMarket from "./global_market.json";

let accessToken = "";

test.beforeAll(async ({ token, conf }) => {
  const user = await token.getUserToken({
    username: conf.suiteConf.username,
    password: conf.suiteConf.password,
  });
  const shop = await token.getShopToken({
    userId: user.id,
    token: user.access_token,
    domain: conf.suiteConf.shop_name,
  });
  accessToken = shop.access_token;
  //accessToken = 'b1d66d6fce08663da661affc34bc08fd202d3383e60ddc7a414e3e0fd023f932';
});

globalMarket.cases.TC_API_GLOBAL_MARKET_CREATE.data.forEach(testApiCase => {
  test(`Test case ${testApiCase.key} @TC_API_GLOBAL_MARKET_CREATE`, async ({ api, context }) => {
    await context.setExtraHTTPHeaders({
      [AccessTokenHeaderName]: accessToken,
      [UserAgentHeaderName]: DefaultUserAgent,
    });
    const response = await api.request(testApiCase as TestApiCase, {
      context: context.request,
    });
    expect(response.status).toEqual(testApiCase.response.status);
  });
});

globalMarket.cases.TC_API_GLOBAL_MARKET_CLOSE.data.forEach(testApiCase => {
  test(`Test case  ${testApiCase.key} @TC_API_GLOBAL_MARKET_CLOSE`, async ({ api, context }) => {
    await context.setExtraHTTPHeaders({
      [AccessTokenHeaderName]: accessToken,
      [UserAgentHeaderName]: DefaultUserAgent,
    });
    const response = await api.request(testApiCase as TestApiCase, {
      context: context.request,
    });
    expect(response.status).toEqual(testApiCase.response.status);
  });
});

globalMarket.cases["TC_API_GLOBAL_MARKET_UPDATE[1]"].data.forEach(testApiCase => {
  test(`Test case  ${testApiCase.key} @TC_API_GLOBAL_MARKET_UPDATE[1]`, async ({ api, context }) => {
    await context.setExtraHTTPHeaders({
      [AccessTokenHeaderName]: accessToken,
      [UserAgentHeaderName]: DefaultUserAgent,
    });
    const response = await api.request(testApiCase as TestApiCase, {
      context: context.request,
    });
    expect(response.status).toEqual(testApiCase.response.status);
  });
});

globalMarket.cases["TC_API_GLOBAL_MARKET_UPDATE[2]"].data.forEach(testApiCase => {
  test(`Test case  ${testApiCase.key} @TC_API_GLOBAL_MARKET_UPDATE[2]`, async ({ api, context }) => {
    await context.setExtraHTTPHeaders({
      [AccessTokenHeaderName]: accessToken,
      [UserAgentHeaderName]: DefaultUserAgent,
    });
    const response = await api.request(testApiCase as TestApiCase, {
      context: context.request,
    });
    expect(response.status).toEqual(testApiCase.response.status);
  });
});

globalMarket.cases["TC_API_GLOBAL_MARKET_UPDATE[3]"].data.forEach(testApiCase => {
  test(`Test case  ${testApiCase.key} @TC_API_GLOBAL_MARKET_UPDATE[3]`, async ({ api, context }) => {
    await context.setExtraHTTPHeaders({
      [AccessTokenHeaderName]: accessToken,
      [UserAgentHeaderName]: DefaultUserAgent,
    });
    const response = await api.request(testApiCase as TestApiCase, {
      context: context.request,
    });
    expect(response.status).toEqual(testApiCase.response.status);
  });
});

globalMarket.cases["TC_API_GLOBAL_MARKET_UPDATE[4]"].data.forEach(testApiCase => {
  test(`Test case  ${testApiCase.key} @TC_API_GLOBAL_MARKET_UPDATE[4]`, async ({ api, context }) => {
    await context.setExtraHTTPHeaders({
      [AccessTokenHeaderName]: accessToken,
      [UserAgentHeaderName]: DefaultUserAgent,
    });
    const response = await api.request(testApiCase as TestApiCase, {
      context: context.request,
    });
    expect(response.status).toEqual(testApiCase.response.status);
  });
});

globalMarket.cases["TC_API_GLOBAL_MARKET_UPDATE[5]"].data.forEach(testApiCase => {
  test(`Test case  ${testApiCase.key} @TC_API_GLOBAL_MARKET_UPDATE[5]`, async ({ api, context }) => {
    await context.setExtraHTTPHeaders({
      [AccessTokenHeaderName]: accessToken,
      [UserAgentHeaderName]: DefaultUserAgent,
    });
    const response = await api.request(testApiCase as TestApiCase, {
      context: context.request,
    });
    expect(response.status).toEqual(testApiCase.response.status);
  });
});
