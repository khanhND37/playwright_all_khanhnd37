import { chromium, Page } from "@playwright/test";
import type { ProxyParams } from "@types";
import { OcgLogger } from "@core/logger";

const logger = OcgLogger.get();

export type supportedProxyCountry =
  | "in"
  | "us"
  | "gb"
  | "se"
  | "ca"
  | "de"
  | "br"
  | "fr"
  | "au"
  | "it"
  | "tr"
  | "mx"
  | "es"
  | "nl"
  | "vn"
  | "bd"
  | "id"
  | "pl"
  | "sg"
  | "kr";
/**
 *
 * @param proxyParams Default with proxy of IP US
 * @returns New page with proxy
 * docs: https://playwright.dev/docs/network
 */
export const getProxyPage = async (proxyParams?: ProxyParams): Promise<Page> => {
  if (!proxyParams) {
    proxyParams = {
      server: process.env.PROXY_US_SERVER,
      username: process.env.PROXY_US_USERNAME,
      password: process.env.PROXY_US_PWD,
    };
  }
  const browser = await chromium.launch({
    proxy: proxyParams,
  });
  return browser.newPage();
};

/**
 *
 * @param countryCode code of country you want to use proxy in
 * @returns New page with proxy
 * docs: https://playwright.dev/docs/network
 */
export const getProxyPageByCountry = async (countryCode: supportedProxyCountry): Promise<Page> => {
  if (!countryCode) {
    logger.info("Missing country code, using default browser now");
    const browser = await chromium.launch();
    return browser.newPage();
  }

  let proxies = process.env.TH_PROXIES;

  if (proxies) {
    proxies = JSON.parse(proxies);
  }

  if (!proxies) {
    logger.info("Missing proxies env config, using default browser now");
    const browser = await chromium.launch();
    return browser.newPage();
  }

  const countryProxy = proxies[countryCode];

  return getProxyPage({
    server: countryProxy.host_name,
    username: countryProxy.username,
    password: countryProxy.password,
  });
};
