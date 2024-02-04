import { createHttp } from "@core/services";
import type { FixtureApiRequestOptions, FixtureApiResponseHook, TestApiCase } from "@types";

export const http = createHttp();

/**
 * Sanitize options to request
 * @param testApiCase
 */
export const sanitizeRequestOptions = (testApiCase: TestApiCase): FixtureApiRequestOptions => {
  const requestOptions: FixtureApiRequestOptions = {
    url: testApiCase.url,
    method: testApiCase.method || "GET",
    headers: Object.assign({}, testApiCase.request?.headers || {}),
    params: Object.assign({}, testApiCase.request?.params || {}),
  };
  if (testApiCase.request?.data) {
    requestOptions.data = testApiCase.request.data;
  }

  return requestOptions;
};

/**
 * Sanitize response
 * @param response
 * @param hooks
 * @param responseType
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sanitizeResponse = async <T = any>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: any,
  hooks: Array<FixtureApiResponseHook>,
  responseType: "text" | "json",
): Promise<T> => {
  let result;
  if (responseType === "text") {
    result = await response.text();
  } else {
    result = await response.json();
  }

  if (hooks) {
    hooks.forEach(fn => {
      result = fn(result);
    });
  }

  return result;
};
