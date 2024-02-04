import { Page } from "@playwright/test";

export const pressControl = async (page: Page, key: string) => {
  let ctrlKey = "Control";
  if (process.platform === "darwin") {
    ctrlKey = "Meta";
  }
  await page.keyboard.press(`${ctrlKey}+${key}`);
};
