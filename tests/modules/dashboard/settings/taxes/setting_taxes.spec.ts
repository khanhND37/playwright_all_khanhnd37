import { test, expect } from "@core/fixtures";
import { TaxSetting } from "@pages/dashboard/taxes_setting";
import { DashboardPage } from "@pages/dashboard/dashboard";
import type { TaxInfor } from "../../../../../src/types/state/setting";

test.describe("Navigate to Setting > Taxes on Dashboard", async () => {
  let taxSetting: TaxSetting;
  let dashboardPage: DashboardPage;
  let usTax: TaxInfor;
  let usTaxEdited: TaxInfor;
  let californiaTax: TaxInfor;
  let alaskaTax: TaxInfor;
  let alaskaTaxOverride: TaxInfor;

  test.beforeEach(async ({ dashboard, conf }) => {
    taxSetting = new TaxSetting(dashboard, conf.suiteConf.domain);
    dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    usTax = conf.suiteConf.us_tax;
    usTaxEdited = conf.suiteConf.us_tax_edited;
    californiaTax = conf.suiteConf.california_tax;
    alaskaTax = conf.suiteConf.alaska_tax;
    alaskaTaxOverride = conf.suiteConf.alaska_tax_override;
    await dashboardPage.goto("admin/settings");
    await dashboardPage.navigateToSectionInSettingPage("Taxes");
    await taxSetting.deleteAllTaxCountry();
    expect(await taxSetting.countNumOfTaxRegion()).toBe(0);
    await dashboardPage.clickOnBtnWithLabel("Add a new country");
    await taxSetting.inputFormAddEditRegion(usTax);
  });

  test(`Check add country trường hợp nhập country có state/region @SB_SET_TM_TSB_409`, async () => {
    await test.step(`Trong màn hình list Tax, Kiểm tra thông tin tax`, async () => {
      expect(await taxSetting.isTaxExisted(usTax)).toBeTruthy();
      expect(await taxSetting.isTaxRateDisplayed(usTax)).toBeTruthy();
    });

    await test.step(`Click "Manage"`, async () => {
      await taxSetting.clickManageTaxDetail(usTax);
      expect(await taxSetting.isTaxDetailPageDisplayed()).toBeTruthy();
    });
  });

  test(`Check edit tax country @SB_SET_TM_TSB_413`, async () => {
    await test.step(`- Click "Manage" 1 tax country trong list- Sửa các thông tin 
    threshold, tax name, tax rate > 
    Click button "Save"`, async () => {
      await taxSetting.clickManageTaxDetail(usTax);
      await taxSetting.editTaxName(usTaxEdited);
      await taxSetting.editTaxRate(usTaxEdited);
      await taxSetting.clickOnBtnWithLabel("Save");
      expect(await taxSetting.isToastMsgVisible("Successfully updated taxes")).toBeTruthy();
    });

    await test.step(`Check thông tin tax vừa edit trong taxes listing`, async () => {
      await taxSetting.clickBreadScrumTaxes();
      expect(await taxSetting.isTaxExisted(usTaxEdited)).toBeTruthy();
    });
  });

  test(`Check chức năng Edit tax region @SB_SET_TM_TSB_418`, async () => {
    await test.step(`- Vào manage tax country
    - Chon "Collect {{taxname}}"`, async () => {
      await taxSetting.clickManageTaxDetail(usTax);
      await taxSetting.clickOnBtnWithLabel("Collect US-tax");
      expect(await taxSetting.isPopUpDisplayed("Collect US-tax")).toBeTruthy();
    });

    await test.step(`Edit các thông tin trong tax > Click button "Done"`, async () => {
      await taxSetting.inputFormAddEditRegion(californiaTax);
      expect(await taxSetting.isTaxStateExisted(californiaTax)).toBeTruthy();
    });

    await test.step(`Click button "Save" tax country`, async () => {
      await taxSetting.clickOnBtnWithLabel("Save");
      expect(await taxSetting.isToastMsgVisible("Successfully updated taxes")).toBeTruthy();
    });

    await test.step(`- Chọn tax region, click icon menu- Chọn "Remove"`, async () => {
      await taxSetting.chooseEditOrRemove(californiaTax.taxName, "Remove");
      expect(await taxSetting.isPopUpDisplayed("Remove CA-tax for California")).toBeTruthy();
    });

    await test.step(`Click button "Remove"`, async () => {
      await taxSetting.clickButtonOnPopUpWithLabel("Remove");
      expect(await taxSetting.isToastMsgVisible("Delete taxes rate successful")).toBeTruthy();
    });
  });

  test(`Check chức năng "Add product override" @SB_SET_TM_TSB_422`, async () => {
    await test.step(`- Vào "Manage" tax country
    - Trong phần Tax Overrides, Click vào link "Add product override"`, async () => {
      await taxSetting.clickManageTaxDetail(usTax);
      await taxSetting.clickOnBtnWithLabel("Add product override");
      expect(await taxSetting.isPopUpDisplayed("Add product override for United States")).toBeTruthy();
    });

    await test.step(`Click "Save" on popUp`, async () => {
      await taxSetting.clickButtonOnPopUpWithLabel("Save");
      expect(await taxSetting.isRequiredMessageDisplayed("Collection")).toBeTruthy();
      expect(await taxSetting.isRequiredMessageDisplayed("Location")).toBeTruthy();
      expect(await taxSetting.isRequiredMessageDisplayed("Tax rate")).toBeTruthy();
    });

    await test.step(`Điền thông tin vào form -> Click Button"Save"`, async () => {
      await taxSetting.inputInformationToOverrideForm(alaskaTax);
      await taxSetting.clickButtonOnPopUpWithLabel("Save");
      expect(await taxSetting.isToastMsgVisible("Successfully created taxes"));
    });

    await test.step(`Chọn tax product override, click "Menu" icon, chọn "Edit"`, async () => {
      await taxSetting.chooseEditOrRemove(alaskaTax.location, "Edit");
      expect(await taxSetting.isPopUpDisplayed("Edit product override for Alaska")).toBeTruthy();
    });

    await test.step(`Điền thông tin vào form => Click "Save"`, async () => {
      await taxSetting.inputInformationToOverrideForm(alaskaTaxOverride);
      await taxSetting.clickButtonOnPopUpWithLabel("Done");
      expect(await taxSetting.isToastMsgVisible("Successfully updated taxes")).toBeTruthy();
    });

    await test.step(`Chọn tax product override, click "Menu" icon, 
    chọn "Remove" => Chonj "Remove" treen. popup`, async () => {
      await taxSetting.chooseEditOrRemove(alaskaTax.location, "Remove");
      expect(await taxSetting.isPopUpDisplayed("Remove override for Tax_Col in Alaska")).toBeTruthy();
      await taxSetting.clickButtonOnPopUpWithLabel("Remove");
      expect(await taxSetting.isToastMsgVisible("Delete taxes rate successful")).toBeTruthy();
    });

    await test.step(`Click button "Save changes" trong tax manage`, async () => {
      await taxSetting.clickOnBtnWithLabel("Save");
      expect(await taxSetting.isToastMsgVisible("Successfully updated taxes")).toBeTruthy();
    });
  });
});
