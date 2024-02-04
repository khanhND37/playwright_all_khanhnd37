/**
 * Extract token from local storage data. Local storage data is stored as an JSON arrays
 * @param localStorage local storage object
 * @returns token or undefined
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractToken(localStorage: any): string | undefined {
  try {
    const token = localStorage
      .filter(obj => obj.name === "sbase_shop-access-token")
      .map(obj => obj.value)[0]
      .replace(/\\"/g, "")
      .replace(/"/g, "");

    return token;
  } catch (e) {
    throw new Error(`Cannot extract token with error ${e}`);
  }
}

/**
 * Extract codename from test's description. a code name will begin with @TS_ or @TC_
 * @param testDescriptions
 * @returns
 */
export function extractCodeName(testDescriptions: string) {
  const result = testDescriptions
    .split(/(\s+)/)
    .filter(str => /^@T[S|C]_|^@[S|P]B_|^@DP_|^@PLB_/.test(str))
    .map(str => str.replace(/@/, ""));
  return result;
}

/**
 * Remove currency symbol and correct format
 * For example: $57,35 become 57.35
 * @param val
 * @returns
 */
export function removeCurrencySymbol(val: string): string {
  const regex = /[^0-9\\.-]+/g;
  return val.replace(",", ".").replace(regex, "").replace(/\s/g, "");
}

export function roundingTwoDecimalPlaces(num: number): number {
  return Math.round(num * 100) / 100;
}

export function roundingDecimal(val: number, num: number): string {
  const d = Math.pow(10, num);
  return (Math.round((val + Number.EPSILON) * d) / d).toFixed(num);
}

export function updateShippingFee(val: number): number {
  const threshold = 0.05;
  const origin = Math.floor((val + Number.EPSILON) * 10) / 10;
  const diff = val - origin;
  if (diff > threshold) {
    return Number(roundingDecimal(origin + 0.09, 2));
  }
  return Number(roundingDecimal(origin + threshold, 2));
}

export function getCurrencySymbolBasedOnCurrencyName(currencyName: string): string {
  const currencySymbols = {
    USD: "$",
    EUR: "€",
    CRC: "₡",
    GBP: "£",
    ILS: "₪",
    INR: "₹",
    JPY: "¥",
    KRW: "₩",
    NGN: "₦",
    PHP: "₱",
    PLN: "zł",
    PYG: "₲",
    THB: "฿",
    UAH: "₴",
    VND: "₫",
  };

  if (currencySymbols[currencyName]) {
    return currencySymbols[currencyName];
  }
}

/**
 * Convert a currency to a number
 * @param currency example: $100.00
 * @returns
 */
export function currencyToNumber(currency: string) {
  return Number(Number(removeCurrencySymbol(currency)).toFixed(2));
}

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const charLength = characters.length;

export function rndString(length: number) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charLength));
  }
  return result;
}

/*
  Generate random characters string
  @param length: characters string length
 */
export const generateRandomCharacters = (length: number): string => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

/**
 * Remove extra space from a string.
 * \s: matches any whitespace symbol: spaces, tabs, and line breaks
 * +: match one or more of the preceding tokens (referencing \s)
 * g: the g at the end indicates iterative searching throughout the full string
 * @param string
 * @returns
 */
export function removeExtraSpace(string: string) {
  return string.replace(/\s+/g, " ").trim();
}

/**
 * Build query string url from options
 * @param request Object need to build query params
 * @param questionMark add a question mark '?' before query string
 */

export function buildQueryString(request: Record<string, unknown>, questionMark = true): string {
  let query = questionMark ? "?" : "";
  const params: string[] = [];
  for (const key in request) {
    if (request[key]) {
      params.push(`${key}=${request[key]}`);
    }
  }

  if (params.length > 0) {
    query += `${params.join("&")}`;
  }

  return query;
}

/**
 * Convert a string to slug (url)
 * @param str could be any string
 * @returns
 */
export const stringToSlug = (str: string) => {
  return str
    .trim()
    .toLowerCase()
    .replace(/[\W_]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
