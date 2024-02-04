import { test } from "@fixtures/website_builder";
import { expect } from "@playwright/test";
import { MultipleSF } from "@sf_pages/multiple_storefronts";

let multipleSF: MultipleSF, settingData;

test.describe("Verify search multiple storefronts", () => {
  test.beforeEach(async ({ dashboard, conf }) => {
    multipleSF = new MultipleSF(dashboard);
    settingData = conf.caseConf.data;
    await test.step(`Pre-condition: Đi đến màn quản lý storefronts`, async () => {
      await dashboard.goto(`https:${conf.suiteConf.domain}/admin/storefronts`);
    });
  });

  test(`@SB_NEWECOM_MSF_MSFL_59 SF list_Check search SF có trả về kết quả`, async ({ dashboard }) => {
    for (const data of settingData) {
      await dashboard.getByPlaceholder("Search by name or domain").clear();
      await dashboard.getByPlaceholder("Search by name or domain").fill(data.data_search);
      await dashboard.keyboard.press("Enter");

      await dashboard.waitForResponse(
        response => response.url().includes("/shop/storefronts.json") && response.status() == 200,
      );
      const countSF = await dashboard.locator(multipleSF.xpathSFList).count();
      await expect(countSF).toEqual(data.result_count);

      if (data.pagination) {
        const countPagination = await dashboard.locator(multipleSF.xpathPagination).count();
        await expect(countPagination).toEqual(data.pagination);
        //Click page 2
        await dashboard.locator(multipleSF.getXpathPagination(2)).click();
        await dashboard.waitForResponse(
          response => response.url().includes("/shop/storefronts.json") && response.status() == 200,
        );
        const countSF = await dashboard.locator(multipleSF.xpathSFList).count();
        await expect(countSF).toEqual(data.result_count_page_2);
      }
    }
  });

  test(`@SB_NEWECOM_MSF_MSFL_60 SF list_Check search SF không trả về kết quả`, async ({ dashboard }) => {
    for (const data of settingData) {
      await dashboard.getByPlaceholder("Search by name or domain").clear();
      await dashboard.getByPlaceholder("Search by name or domain").fill(data.data_search);
      await dashboard.keyboard.press("Enter");

      await dashboard.waitForResponse(
        response => response.url().includes("/shop/storefronts.json") && response.status() == 200,
      );
      const countSF = await dashboard.locator(multipleSF.xpathSFList).count();
      await expect(countSF).toEqual(data.result_count);
    }
  });

  // Tạm thời cmt code do PM thay đổi specs
  // test(`@SB_NEWECOM_MSF_MSFL_61 SF list_Check filter theo status`, async ({ dashboard }) => {
  //   await test.step(`Click droplist status > Chọn status = Active`, async () => {
  //     await dashboard.locator(multipleSF.xpathFilter).click();
  //     await dashboard.locator(multipleSF.getXpathFilterStatus("Active")).click();
  //     await dashboard.waitForResponse(
  //       response => response.url().includes("/shop/storefronts.json") && response.status() == 200,
  //     );
  //     const countSF = await dashboard.locator(multipleSF.xpathSFList).count();
  //     await expect(countSF).toEqual(expectData.result_active);
  //   });
  //
  //   await test.step(`Click droplist status > Chọn status = InActive`, async () => {
  //     await dashboard.locator(multipleSF.xpathFilter).click();
  //     await dashboard.locator(multipleSF.getXpathFilterStatus("Closed")).click();
  //     await dashboard.waitForResponse(
  //       response => response.url().includes("/shop/storefronts.json") && response.status() == 200,
  //     );
  //     const countSF = await dashboard.locator(multipleSF.xpathSFList).count();
  //     await expect(countSF).toEqual(expectData.result_inactive);
  //   });
  // });
  //
  // test(`@SB_NEWECOM_MSF_MSFL_62 SF list_Check kết hợp search + filter theo status`, async ({ dashboard }) => {
  //   for (const data of settingData) {
  //     await dashboard.getByPlaceholder("Search by name or domain").clear();
  //     await dashboard.getByPlaceholder("Search by name or domain").fill(data.data_search);
  //     await dashboard.keyboard.press("Enter");
  //
  //     await dashboard.locator(multipleSF.xpathFilter).click();
  //     await dashboard.locator(multipleSF.getXpathFilterStatus(data.status)).click();
  //
  //     await dashboard.waitForResponse(
  //       response => response.url().includes("/shop/storefronts.json") && response.status() == 200,
  //     );
  //     const countSF = await dashboard.locator(multipleSF.xpathSFList).count();
  //     await expect(countSF).toEqual(data.result_count);
  //   }
  // });

  test(`@SB_NEWECOM_MSF_MSFL_63 SF list_Check rename SF`, async ({ dashboard, conf }) => {
    const multipleSF = new MultipleSF(dashboard);
    const settingData = conf.caseConf.data;
    const expectData = conf.caseConf.expect;
    await test.step(`Chuyển về storefront name ban đầu`, async () => {
      const currentName = (
        await dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}${multipleSF.xpathHeading}//h3`).textContent()
      ).trim();
      if (currentName !== settingData.shop_name) {
        await multipleSF.actionWithStorefront(currentName, "Rename");
        await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();

        await dashboard.locator(multipleSF.xpathPopupBody).clear();
        await dashboard.locator(multipleSF.xpathPopupBody).fill(settingData.shop_name);
        await dashboard.getByRole("button", { name: "Save", exact: true }).click();
        await expect(
          dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}${multipleSF.xpathHeading}//h3`),
        ).toHaveText(settingData.shop_name);
      }
    });

    await test.step(`Click Action > Chọn Rename`, async () => {
      await multipleSF.actionWithStorefront(settingData.shop_name, "Rename");
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      await expect(dashboard.locator(multipleSF.xpathPopupHeader)).toHaveText(expectData.heading_popup);
    });

    await test.step(`Nhập name hợp lệ (4 ký tự <= tên SF < 64 ký tự, tên SF không trùng,)`, async () => {
      await dashboard.locator(multipleSF.xpathPopupBody).clear();
      await dashboard.locator(multipleSF.xpathPopupBody).fill(settingData.name_valid);
      await dashboard.getByRole("button", { name: "Save", exact: true }).click();
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}${multipleSF.xpathHeading}//h3`),
      ).toHaveText(settingData.name_valid);
      const publicDomain = await dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}//p/a`).textContent();
      await expect(publicDomain).toContain(expectData.public_domain);
    });

    await test.step(`Click Action > Chọn Rename`, async () => {
      await multipleSF.actionWithStorefront(settingData.name_valid, "Rename");
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      await expect(dashboard.locator(multipleSF.xpathPopupHeader)).toHaveText(expectData.heading_popup);
    });

    await test.step(`Nhập name không hợp lệ (tên SF > 64 ký tự, tên SF < 4 ký tự)`, async () => {
      await dashboard.locator(multipleSF.xpathPopupBody).clear();
      await dashboard.locator(multipleSF.xpathPopupBody).fill(settingData.name_less_4_character);
      await dashboard.getByRole("button", { name: "Save", exact: true }).click();
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}${multipleSF.xpathHeading}//h3`),
      ).toHaveText(settingData.name_less_4_character);
    });

    await test.step(`Nhập name không hợp lệ (tên SF bị trùng)`, async () => {
      await multipleSF.actionWithStorefront(settingData.name_less_4_character, "Rename");
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      await expect(dashboard.locator(multipleSF.xpathPopupHeader)).toHaveText(expectData.heading_popup);

      await dashboard.locator(multipleSF.xpathPopupBody).clear();
      await dashboard.locator(multipleSF.xpathPopupBody).fill(settingData.name_existing);
      await dashboard.getByRole("button", { name: "Save", exact: true }).click();
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}${multipleSF.xpathHeading}//h3`),
      ).toHaveText(settingData.name_existing);
    });

    await test.step(`Nhập name trùng với name SF đã tồn tại`, async () => {
      await multipleSF.actionWithStorefront(settingData.name_existing, "Rename");
      await expect(dashboard.locator(multipleSF.xpathPopup)).toBeVisible();
      await expect(dashboard.locator(multipleSF.xpathPopupHeader)).toHaveText(expectData.heading_popup);

      await dashboard.locator(multipleSF.xpathPopupBody).clear();
      await dashboard.locator(multipleSF.xpathPopupBody).fill(settingData.shop_name);
      await dashboard.getByRole("button", { name: "Save", exact: true }).click();
      await expect(
        dashboard.locator(`${multipleSF.getXpathStorefrontList(2)}${multipleSF.xpathHeading}//h3`),
      ).toHaveText(settingData.shop_name);
    });
  });
});
