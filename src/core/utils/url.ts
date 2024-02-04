export const appendParameterToURL = (originUrl: string, paramName: string, paramValue: string): string => {
  const url = new URL(originUrl);
  url.searchParams.append(paramName, paramValue);
  return url.href;
};
