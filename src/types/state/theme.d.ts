import { BrowserContext, Locator, Page, PageScreenshotOptions } from "@playwright/test";
import type { FixtureThemeApi, ThemeSettingsData } from "@types";

export type Screenshot = {
  page: Page;
  selector?: string | Locator;
  iframe?: string;
  screenshotOptions?: PageScreenshotOptions;
  snapshotOptions?: SnapshotOptions;
  combineOptions?: ToHaveScreenshotOptions;
  sizeCheck?: boolean;
  snapshotName: string;
};

export type ToHaveScreenshotOptions = {
  animations?: "disabled" | "allow";
  caret?: "hide" | "initial";
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fullPage?: boolean;
  mask?: Array<Locator>;
  maxDiffPixelRatio?: number;
  maxDiffPixels?: number;
  omitBackground?: boolean;
  scale?: "css" | "device";
  threshold?: number;
  timeout?: number;
  expectToPass?: {
    timeout?: number;
    intervals?: number[];
  };
  hideElements?: Locator[];
};

export type NavigationPage = {
  page: Page;
  selector: string;
  redirectUrl?: string;
  waitForElement?: string;
  context?: BrowserContext;
  popupConfirm?: boolean;
};

export type LanguageCurrency = {
  page: Page;
  name?: string;
  selector?: string;
  selectorActive?: string;
  currLast?: string | boolean;
  currFirst?: string | boolean;
};

export type ButtonInPopup = {
  page: Page;
  save?: boolean;
  cancel?: boolean;
  close?: boolean;
  isDesktop?: boolean;
};

export type GetThemeBlock = {
  theme: FixtureThemeApi;
  id: number;
  page: string;
  section: string;
  block?: string;
  settingsData?: ThemeSettingsData;
};

export type ClickEyeIcon = { page: Page; currentStatus: boolean; section?: string; block?: string };

export type SnapshotOptions = {
  threshold?: number;
  maxDiffPixels?: number;
  maxDiffPixelRatio?: number;
};

export type actionsTheme = {
  action: string;
  section?: "current";
  themeName?: string;
  themeId?: number;
  rename?: string;
};

export type SettingMarketingConsent = {
  emailMkt?: {
    showCheckbox?: boolean;
    preCheck?: boolean;
  };
  smsMkt?: {
    showCheckbox?: boolean;
    preCheck?: boolean;
  };
};
