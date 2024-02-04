import { test, expect } from "@core/fixtures";
import { DiscountPage } from "@pages/dashboard/discounts";
import { DashboardPage } from "@pages/dashboard/dashboard";
import type { Discount } from "../../../../src/types/state/checkout";

test.describe("Navigate to dashboard > Discount", async () => {
  let discountPage: DiscountPage;
  let dashboardPage: DashboardPage;
  let auFreeShip1: Discount;
  let auFreeShip2: Discount;

  test.beforeEach(async ({ dashboard, conf }) => {
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    discountPage = new DiscountPage(dashboard, conf.suiteConf.domain);
    auFreeShip1 = conf.suiteConf.au_freeshipping1;
    auFreeShip2 = conf.suiteConf.au_freeshipping2;
    await dashboardPage.goto("admin/discounts");
  });

  test(`Check Create thành công automatic discount free shipping @SB_DC_1`, async () => {
    await test.step(`Click "Create automatic discount" button > Nhập các thông tin discount`, async () => {
      await dashboardPage.navigateToSubMenu("Discounts", "Automatic");
      await discountPage.delAllDiscount();
      expect(await discountPage.countNumDiscount()).toBe(0);
      await discountPage.clickOnBtnWithLabel("Create automatic discount");
      expect(await discountPage.isDBPageDisplay("Create automatic discount")).toBeTruthy();
      await discountPage.inputCrtDscPage(auFreeShip1);
      expect(await dashboardPage.isSaveBarVisible()).toBeTruthy();
    });

    await test.step(`Click button "Save changes"`, async () => {
      await dashboardPage.clickOnBtnWithLabel("Save changes");
      expect(await discountPage.isToastMsgVisible("Automatic discount was created successfully")).toBeTruthy();
    });

    await test.step(`Back lại màn hình list all Automatic Discount => Click "Create automatic discount" button > Nhập các thông tin discount`, async () => {
      await discountPage.clickOnBreadcrumb();
      await discountPage.isDBPageDisplay("Automatic discounts");
      await discountPage.clickOnBtnWithLabel("Create automatic discount");
      expect(await discountPage.isDBPageDisplay("Create automatic discount")).toBeTruthy();
      await discountPage.inputCrtDscPage(auFreeShip2);
      expect(await dashboardPage.isSaveBarVisible()).toBeTruthy();
    });

    await test.step(`Click button "Save changes"`, async () => {
      await discountPage.clickOnBtnWithLabel("Save changes");
      expect(await discountPage.isPopUpDisplayed("Active dates alert")).toBeTruthy();
    });

    await test.step(`chọn "Cancel"`, async () => {
      await discountPage.clickButtonOnPopUpWithLabel("Cancel");
      expect(await discountPage.isDBPageDisplay("Create automatic discount")).toBeTruthy();
    });

    await test.step(`Click button "Save changes" => Chọn Option "No" => Click "Save"`, async () => {
      await discountPage.clickOnBtnWithLabel("Save changes");
      expect(await discountPage.isPopUpDisplayed("Active dates alert")).toBeTruthy();
      await discountPage.chooseOptOnAlert("No");
      await discountPage.clickButtonOnPopUpWithLabel("Save");
      expect(await discountPage.isDBPageDisplay("Create automatic discount")).toBeTruthy();
    });

    await test.step(`Click button "Save changes" => Chọn Option "Yes" => Click "Save"`, async () => {
      await discountPage.clickOnBtnWithLabel("Save changes");
      expect(await discountPage.isPopUpDisplayed("Active dates alert")).toBeTruthy();
      await discountPage.chooseOptOnAlert("Yes");
      await discountPage.clickButtonOnPopUpWithLabel("Save");
      expect(await discountPage.isToastMsgVisible("Automatic discount was created successfully")).toBeTruthy();
    });

    await test.step(`Back lại màn hình list all Automatic Discount`, async () => {
      await discountPage.clickOnBreadcrumb();
      expect(await discountPage.getDscStatus(auFreeShip1)).toEqual("Expired");
      expect(await discountPage.getDscStatus(auFreeShip2)).toEqual("Active");
    });
  });
});
