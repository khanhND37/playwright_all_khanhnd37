import { Locator, expect, test } from "@playwright/test";

export const getStyle = async (locator: Locator, property: string): Promise<string> => {
  return locator.evaluate((el, property) => window.getComputedStyle(el).getPropertyValue(property), property);
};

/**
 * So sánh width height trong khoảng để verify CSS trên server khác local
 * @param locator
 * @param type
 * @param param2
 */
export const verifyWidthHeightCSSInRange = async (
  locator: Locator,
  type: "width" | "height",
  { min, max },
): Promise<void> => {
  await test.step(
    `Verify ${type} CSS in range`,
    async () => {
      const valueInNumber = parseFloat((await getStyle(locator, type)).replace("px", ""));
      expect(valueInNumber).toBeLessThanOrEqual(max);
      expect(valueInNumber).toBeGreaterThanOrEqual(min);
    },
    { box: true },
  );
};

/**
 * Hàm modify lại url img được lấy từ dashboard để match với SF sau khi resize ảnh
 * @param url
 * @param resolution
 * @returns
 */
export const getImgUrlInSF = (url: string, resolution: string): string => {
  const imgName = url.split("/").pop();
  let sfUrl = url.substring(0, url.lastIndexOf("/") + 1) + `${resolution}@${imgName}`;
  const replaceDomain = (oldDomain: string, newDomain: string) => {
    const domainRegExp = /^(https?:\/\/[^/]+)/;
    const match = oldDomain.match(domainRegExp);
    if (match) {
      const currentDomain = match[0];
      const newString = oldDomain.replace(currentDomain, newDomain);
      return newString;
    }
    return oldDomain;
  };
  if (process.env.CI_ENV === "prodtest") {
    sfUrl = replaceDomain(sfUrl, "https://img-prodtest.thesitebase.net");
  } else if (process.env.CI_ENV === "prod") {
    sfUrl = replaceDomain(sfUrl, "https://img.thesitebase.net");
  }
  return sfUrl;
};
