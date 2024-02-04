import { expect, test } from "@core/fixtures";
import { MenuDashboard } from "@pages/shopbase_creator/dashboard/menu";

test.describe(`Verify setting for shop Creator`, async () => {
  test(` Verify sidebar menu của shop @SB_SC_SCMN_1`, async ({ conf, dashboard }) => {
    const menuDashboard = new MenuDashboard(dashboard, conf.suiteConf.domain);
    await test.step(`verify các menu có menu và sub_menu tương ứng`, async () => {
      const getMenu = await menuDashboard.getMenu();
      const menu = conf.caseConf.list_menu;
      for (let i = 0; i < menu.length; i++) {
        expect(getMenu[i]).toEqual(
          expect.objectContaining({
            menu: menu[i].menu,
            url: menu[i].url,
          }),
        );
        const getChildMenu = await menuDashboard.getchildMenu(menu[i].menu);
        expect(getChildMenu).toEqual(menu[i].childs);
      }
    });

    await test.step(`Mở 1 url của 1 module tồn tại trong shop creator -> Verify error message hiển thị`, async () => {
      await menuDashboard.goto(`${conf.caseConf.menu_not_exist}`);
      const page404Locator = menuDashboard.genLoc(menuDashboard.xpathPage404);
      await expect(page404Locator).toBeVisible();
    });
  });
});
