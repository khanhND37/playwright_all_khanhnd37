import { expect, test } from "@core/fixtures";
import { Dev, SbSECHive03 } from "./hive-permission-01";

test.describe(`Hive security test`, () => {
  test(`@SB_SEC_HIVE_01 Verify default ROLE_ADMIN role`, async ({ hiveSecurity }) => {
    await test.step(`Sau khi login, kiểm tra các menu default của role_staff`, async () => {
      // count number of menu
      const allMenus = await hiveSecurity.locator("//ul[@class='sidebar-menu']").all();

      // role_admin user will not include any items in sidebar-menu, so the length of allMenus is 0
      expect(allMenus.length).toEqual(0);
    });
  });

  test(`@SB_SEC_HIVE_02 Verify default ROLE_STAFF role`, async ({ hiveSecurity }) => {
    await test.step(`Sau khi login, kiểm tra các menu default của role_staff`, async () => {
      // Sau khi login, kiểm tra các menu default của role_staff

      const allMenus = await hiveSecurity.locator("//ul[@class='sidebar-menu']").all();
      expect(allMenus.length).toEqual(1);

      // kiem tra dung `Staff requests` menu name
      const staffRequestMenu = await hiveSecurity.locator("//span[contains(text(),'Staff requests')]").all();
      expect(staffRequestMenu.length).toEqual(1);

      // Count number of subMenu
      for (const menu of allMenus) {
        const allMenuItem = await menu.locator("//li[contains(@class, 'treeview')]").all();

        //role_staff only includes an item is `Staff requests` in sidebar-menu
        expect(allMenuItem.length).toEqual(1);

        const allSubMenuItem = await menu
          .locator("//ul[contains(@class, 'active') and contains(@class, 'menu_level_1')]")
          .all();

        //role_staff only includes one sub-item is `Staff assigned` in `Staff request` menu
        expect(allSubMenuItem.length).toEqual(1);
      }
    });
  });

  test(`@SB_SEC_HIVE_03 Verify tính toàn vẹn của các ROLE`, async ({ hiveSecurity, conf }) => {
    const suiteConf: Dev = conf.suiteConf as Dev;
    const caseConf = conf.caseConf as SbSECHive03;
    await test.step(`di chuyển tới màn edit của 1 user cụ thể, click vào tab security`, async () => {
      // di chuyen toi man security
      await hiveSecurity.goto(`https://${suiteConf.hive_domain}/admin/sonata/user/user/${caseConf.hive_user_id}/edit`);

      // click vao tab security
      await hiveSecurity.locator("//ul[contains(@class, 'nav-tabs')]//li[normalize-space()='Security']").click();

      // Expect for role_admin

      const spanExistsAdmin = await hiveSecurity.evaluate(caseConf => {
        const spans = Array.from(document.querySelectorAll("span"));
        return spans.some(span => span.textContent.trim() === `${caseConf.role_admin_string}`);
      }, caseConf);

      expect(spanExistsAdmin).toBeTruthy();

      // Expect role_staff
      const spanExistsStaff = await hiveSecurity.evaluate(caseConf => {
        const spans = Array.from(document.querySelectorAll("span"));
        return spans.some(span => span.textContent.trim() === caseConf.role_staff_string);
      }, caseConf);

      expect(spanExistsStaff).toBeTruthy();

      // Expect role_super
      const spanExistsSuperAdmin = await hiveSecurity.evaluate(caseConf => {
        const spans = Array.from(document.querySelectorAll("span"));
        return spans.some(span => span.textContent.trim() === caseConf.role_super_admin_string);
      }, caseConf);

      expect(spanExistsSuperAdmin).toBeTruthy();
    });
  });
});
