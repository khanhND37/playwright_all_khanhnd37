import { Page } from "@playwright/test";

export class ShopBaseLanding {
  page: Page;
  btnLoginSB = "a.white-button";
  btnFreeTrialSB = "a.button-navigation";
  btnGetForFreeSB = "//a[normalize-space()='Get started for free']";
  btn14DayFreeTrialSB = "//a[normalize-space()='Start 14 Day Free Trial']";
  btnFooter = "//a[normalize-space()='Get Started For Free']";
  homeTitle = ".home_title_block";
  btnLoginPLB = "//a[contains(@class,'w-nav-link') and normalize-space()='Login']";
  btnFreeTrialPLB = "//div[contains(@class,'navigation-right')]//a[normalize-space()='Start 14-Day Free Trial']";
  btnStartFreeTrialPB = "//div[contains(@class,'navigation-right')]//a[normalize-space()='Start Free Trial']";
}
