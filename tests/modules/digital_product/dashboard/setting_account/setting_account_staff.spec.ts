import { expect, test } from "@core/fixtures";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { AccountSetting } from "@pages/dashboard/account_setting";
import { loadData } from "@core/conf/conf";
import { ProductAPI } from "@pages/shopbase_creator/dashboard/product_api";
import { MemberAPI } from "@pages/shopbase_creator/dashboard/member_api";
import { generateEmail } from "@core/utils/theme";
import { Mailinator } from "@helper/mailinator";
import { ProductPage } from "@pages/shopbase_creator/dashboard/product";
import { MemberPage } from "@pages/shopbase_creator/dashboard/member";
import { DefaultGetProductAPIParam } from "@constants/shopbase_creator/product/param";
import { MenuDashboard } from "@pages/shopbase_creator/dashboard/menu";
import { getMailinatorInstanceWithProxy } from "@utils/mail";

test.describe("Test permission", async () => {
  let accountSettingPage: AccountSetting;
  let productAPI: ProductAPI;
  let productIds: Array<number>;
  let memberAPI: MemberAPI;
  let mailinator: Mailinator;
  let menuPage: MenuDashboard;
  let url: string;

  test.beforeEach(async ({ dashboard, conf, authRequest, page }) => {
    if (conf.caseConf.timeout) {
      test.setTimeout(conf.caseConf.timeout);
    }
    const productListData = conf.suiteConf.product_list;
    productAPI = new ProductAPI(conf.suiteConf.domain, authRequest);
    productIds = [];
    for (let i = 0; i < productListData.length; i++) {
      const response = await productAPI.createProduct(productListData[i]);
      const productId = response.data.product.id;
      productIds.push(productId);
    }
    accountSettingPage = new AccountSetting(dashboard, conf.suiteConf.domain);
    await accountSettingPage.goToAccountSetting();
    await accountSettingPage.addStaffAccountFullPermissions(conf.suiteConf.staff.username);
    await accountSettingPage
      .genLoc(accountSettingPage.getXpathCheckboxCustomizePermission(conf.suiteConf.staff.name))
      .click();
    await accountSettingPage.clickButtonOnSaveBar("save");
    mailinator = await getMailinatorInstanceWithProxy(page);
    await mailinator.accessMail(conf.suiteConf.staff.staff_name);
    //wait to forward newest mail
    await mailinator.page.waitForTimeout(2 * 1000);
    await expect(mailinator.subjectFirstPath).toContainText(conf.suiteConf.subject_mail);
    await mailinator.readMail(conf.suiteConf.subject_mail);
    await mailinator.page.frameLocator(mailinator.iframe).locator(mailinator.xpathBtnCreateStaffAccount).click();
    mailinator.page.context().waitForEvent("page");
    if (conf.caseConf.is_member) {
      memberAPI = new MemberAPI(conf.suiteConf.domain, authRequest);
      const data = conf.suiteConf.data_create_member;
      for (let i = 0; i < data.length; i++) {
        const email = generateEmail();
        await memberAPI.createMember({
          ...data[i],
          email: email,
        });
      }
    }
  });

  test.afterEach(async ({ conf }) => {
    if (conf.caseConf.is_member) {
      const response = await memberAPI.getMembers(conf.suiteConf.paging_param);
      const member = response.data;
      for (let i = 0; i < member.length; i++) {
        const id = member[i].id;
        await memberAPI.deleteMember(id);
      }
    }
    await accountSettingPage.goToAccountSetting();
    await accountSettingPage.deleteAllStaffAccount(conf.suiteConf.password);
  });

  test.afterAll(async () => {
    const products = await productAPI.getProducts(DefaultGetProductAPIParam);
    const productIds = products.data.map(item => item.id);
    await productAPI.deleteProduct(productIds);
  });

  const permissionCaseConfigs = loadData(__dirname, "CHECK_PERMISSION_DATA_DRIVEN");
  permissionCaseConfigs.caseConf.cases.data.forEach(testCase => {
    test(`Verify khi thực hiện ${testCase.permission_type} permissions cho mudule bất kì @${testCase.case_id}`, async ({
      browser,
    }, testInfo) => {
      testInfo.slow();
      const modules = permissionCaseConfigs.caseConf.cases.modules;
      for (const moduleName of modules) {
        await accountSettingPage.checkedModule(moduleName.module_name, testCase.checked);

        await test.step(`Check hiện thị trên màn hình của "Store owner" khi  thành công`, async () => {
          const isChanged = await accountSettingPage
            .genLoc(accountSettingPage.getXpathWithLabel("Save changes"))
            .isVisible();
          if (isChanged) {
            await accountSettingPage.genLoc(accountSettingPage.getXpathWithLabel("Save changes")).click();
            await accountSettingPage.waitUntilElementVisible(accountSettingPage.xpathToastMessage);
          }

          await expect(
            accountSettingPage.genLoc(accountSettingPage.getXpathCheckboxWithModule(moduleName.module_name)),
          ).toBeChecked({
            checked: testCase.checked,
          });
        });

        await test.step("Kiểm tra hiện thị trên màn hình của staff account", async () => {
          const pageStaff = await browser.newPage();
          const accountPageStaff = new DashboardPage(pageStaff, conf.suiteConf.domain);
          menuPage = new MenuDashboard(pageStaff, conf.suiteConf.domain);
          await accountPageStaff.login({
            email: conf.suiteConf.staff.username,
            password: conf.suiteConf.staff.password,
          });

          await accountPageStaff.waitUtilNotificationIconAppear();

          if (testCase.checked === true) {
            if (moduleName.module_name === "Balance") {
              await accountPageStaff.openBalancePage();
              expect(await accountPageStaff.isDBPageDisplay("Balance")).toBeTruthy();
            } else {
              if (moduleName.module_name === "Members") {
                try {
                  url = await menuPage.getMenuHref("Members");
                } catch {
                  url = await menuPage.getMenuHref("Contacts");
                }
              } else {
                url = await menuPage.getMenuHref(moduleName.module_name);
              }
              expect(url).toContain(`${moduleName.url}`);
            }
          } else {
            if (moduleName.module_name === "Balance") {
              await accountPageStaff.genLoc(accountPageStaff.xpathShopDomain).click();
              await expect(
                accountPageStaff.genLoc(accountPageStaff.getLocatorItemMenuUserInfo("Balance")),
              ).toBeHidden();
            } else {
              if (moduleName.module_name === "Members") {
                try {
                  url = await menuPage.getMenuHref("Members");
                } catch {
                  url = await menuPage.getMenuHref("Contacts");
                }
              } else {
                url = await menuPage.getMenuHref(moduleName.module_name);
              }

              expect(url).toContain("/admin/no_access");
            }
          }
          await pageStaff.close();
        });
      }
    });
  });

  test(`Verify khi thực hiện grant|revoke permissions cho mudule Sales report @SB_SET_ACC_PMS_PMSC_8`, async ({
    browser,
    conf,
  }) => {
    const dataPermission = conf.caseConf.data_permission;
    for (const item of dataPermission) {
      const parentModule = item.parent_module;
      const subModule = item.sub_module;

      await test.step('Check hiện thị trên màn hình của "Store owner " khi check thành công', async () => {
        await accountSettingPage.checkedModule(parentModule.module_name, parentModule.value);
        await accountSettingPage.checkedModule(subModule.module_name, subModule.value);
        const xpathBtnSave = accountSettingPage.xpathBtnWithLabel("Save changes");
        const isChange = await accountSettingPage.page.locator(xpathBtnSave).isVisible();
        if (isChange) {
          await accountSettingPage.page.locator(xpathBtnSave).click();
        }
        await expect(
          accountSettingPage.page.locator(accountSettingPage.getXpathCheckboxWithModule(subModule.module_name)),
        ).toBeChecked({ checked: subModule.value });
      });

      await test.step('Navigate đến màn hình "Sales report" của của staff account', async () => {
        const pageStaff = await browser.newPage();
        const accountPageStaff = new ProductPage(pageStaff, conf.suiteConf.domain);
        await accountPageStaff.login({
          email: conf.suiteConf.staff.username,
          password: conf.suiteConf.staff.password,
        });
        await accountPageStaff.navigateToMenu("Analytics");
        const xpathSalesReports = `${accountPageStaff.getXpathWithLabel("Sales reports")}/../..`;
        if (subModule.value === true) {
          await expect(accountPageStaff.page).toHaveURL(/.*analytics/);
          await expect(accountPageStaff.page.locator(xpathSalesReports)).toBeVisible();
        } else {
          await expect(accountPageStaff.page.locator(xpathSalesReports)).toBeHidden();
        }
        await accountPageStaff.page.close();
      });
    }
  });

  test(`Verify khi thực hiện grant permissions cho mudule Payment providers @SB_SET_ACC_PMS_PMSC_6`, async ({
    conf,
    browser,
  }) => {
    const dataPermission = conf.caseConf.data_permission;
    for (const item of dataPermission) {
      const parentModule = item.parent_module;
      const subModule = item.sub_module;

      await test.step(`Check hiện thị trên màn hình của "Store owner " khi check thành công`, async () => {
        await accountSettingPage.checkedModule(parentModule.module_name, parentModule.value);
        await accountSettingPage.checkedModule(subModule.module_name, subModule.value);
        const xpathBtnSave = accountSettingPage.xpathBtnWithLabel("Save changes");
        const isChange = await accountSettingPage.page.locator(xpathBtnSave).isVisible();
        if (isChange) {
          await accountSettingPage.page.locator(xpathBtnSave).click();
        }
        await expect(
          accountSettingPage.page.locator(accountSettingPage.getXpathCheckboxWithModule(subModule.module_name)),
        ).toBeChecked({ checked: subModule.value });
      });

      await test.step('Navigate đến màn hình "Payment providers" của staff account', async () => {
        const pageStaff = await browser.newPage();
        const accountPageStaff = new ProductPage(pageStaff, conf.suiteConf.domain);
        await accountPageStaff.login({
          email: conf.suiteConf.staff.username,
          password: conf.suiteConf.staff.password,
        });
        await accountPageStaff.navigateToMenu("Settings");
        if (subModule.value === true) {
          await expect(
            accountPageStaff.page.locator(accountPageStaff.getXpathWithLabel("Payment providers")),
          ).toBeVisible();
        } else {
          await expect(accountPageStaff.page.locator(accountPageStaff.xpathPaymentDisable)).toBeVisible();
        }
        await accountPageStaff.page.close();
      });
    }
  });

  const conf = loadData(__dirname, "DATA_GRANT_PERMISSION_CASE_9_10");
  for (let i = 0; i < conf.caseConf.data.length; i++) {
    const dataSetting = conf.caseConf.data[i];
    test(`${dataSetting.case_description} @${dataSetting.case_id}`, async ({ conf, browser, authRequest }) => {
      if (dataSetting.is_member) {
        memberAPI = new MemberAPI(conf.suiteConf.domain, authRequest);
        const data = conf.suiteConf.data_create_member;
        for (let i = 0; i < data.length; i++) {
          const email = generateEmail();
          await memberAPI.createMember({
            ...data[i],
            email: email,
          });
        }
      }
      const dataPermission = dataSetting.data_permission;
      for (const item of dataPermission) {
        const firstModule = item.module_1;
        const secondModule = item.module_2;

        await test.step('Check hiện thị trên màn hình của "Store owner " khi check thành công', async () => {
          await accountSettingPage.checkedModule(firstModule.module_name, firstModule.value);
          await accountSettingPage.checkedModule(secondModule.module_name, secondModule.value);
          const xpathBtnSave = accountSettingPage.xpathBtnWithLabel("Save changes");
          const isChange = await accountSettingPage.page.locator(xpathBtnSave).isVisible();
          if (isChange) {
            await accountSettingPage.page.locator(xpathBtnSave).click();
          }
          await expect(
            accountSettingPage.page.locator(accountSettingPage.getXpathCheckboxWithModule(firstModule.module_name)),
          ).toBeChecked({ checked: firstModule.value });
        });

        await test.step('Navigate đến màn hình "Member" của staff account', async () => {
          const pageStaff = await browser.newPage();
          const accountPageStaff = new MemberPage(pageStaff, conf.suiteConf.domain);
          await accountPageStaff.login({
            email: conf.suiteConf.staff.username,
            password: conf.suiteConf.staff.password,
          });
          try {
            await accountPageStaff.navigateToMenu("Contacts");
          } catch {
            await accountPageStaff.navigateToMenu("Members");
          }
          const firstName = conf.suiteConf.data_create_member[0].first_name;
          const lastName = conf.suiteConf.data_create_member[0].last_name;
          const fullName = `${firstName} ${lastName}`;
          await accountPageStaff.openMemberDetailWithFullName(fullName);
          if (item.value === true) {
            await expect(accountPageStaff.getXpathBlockWithLabel(dataSetting.block_name)).toBeVisible();
          } else {
            await expect(accountPageStaff.getXpathBlockWithLabel(dataSetting.block_name)).toBeHidden();
          }
          await accountPageStaff.page.close();
        });
      }
    });
  }

  test(` Verify khi thực hiện grant permissions cho mudule "Grant access" @SB_SET_ACC_PMS_PMSC_11`, async ({
    conf,
    browser,
  }) => {
    const dataPermission = conf.caseConf.data_permission;
    for (const item of dataPermission) {
      const moduleProduct = item.module_product;
      const moduleMember = item.module_members;
      const subModuleMember = item.sub_module;

      await test.step('Check hiện thị trên màn hình của "Store owner " khi check thành công', async () => {
        await accountSettingPage.checkedModule(moduleProduct.module_name, moduleProduct.value);
        await accountSettingPage.checkedModule(moduleMember.module_name, moduleMember.value);
        await accountSettingPage.checkedModule(subModuleMember.module_name, subModuleMember.value);

        const xpathBtnSave = accountSettingPage.xpathBtnWithLabel("Save changes");
        const isChange = await accountSettingPage.page.locator(xpathBtnSave).isVisible();
        if (isChange) {
          await accountSettingPage.page.locator(xpathBtnSave).click();
        }

        await expect(
          accountSettingPage.page.locator(accountSettingPage.getXpathCheckboxWithModule(moduleMember.module_name)),
        ).toBeChecked({ checked: moduleMember.value });
      });

      await test.step('Navigate đến màn hình "Member" của staff account', async () => {
        const pageStaff = await browser.newPage();
        const accountPageStaff = new MemberPage(pageStaff, conf.suiteConf.domain);
        await accountPageStaff.login({
          email: conf.suiteConf.staff.username,
          password: conf.suiteConf.staff.password,
        });
        try {
          await accountPageStaff.navigateToMenu("Contacts");
        } catch {
          await accountPageStaff.navigateToMenu("Members");
        }
        const firstName = conf.suiteConf.data_create_member[0].first_name;
        const lastName = conf.suiteConf.data_create_member[0].last_name;
        const fullName = `${firstName} ${lastName}`;
        await accountPageStaff.openMemberDetailWithFullName(fullName);

        if (subModuleMember.value === true) {
          await expect(accountPageStaff.genLoc(accountPageStaff.xpathBtnWithLabel("Grant access"))).toBeVisible();
          await accountPageStaff.genLoc(accountPageStaff.xpathBtnWithLabel("Grant access")).click();
          await accountPageStaff.page.waitForSelector(accountPageStaff.xpathPopup);
          await accountPageStaff.page.locator(accountPageStaff.xpathSearchProductField).click();
          const listProduct = conf.suiteConf.product_list;
          for (let i = 0; i < listProduct.length; i++) {
            const productName = listProduct[i].product.title;
            await accountPageStaff.getXpathProductOnPopUp(productName).click();
          }
          await accountPageStaff.clickButtonOnPopUpWithLabel("Grant access");
          const xpathResult = '//table[@class="sb-table__body"]//tbody/tr';
          await expect(accountPageStaff.page.locator(xpathResult)).toHaveCount(listProduct.length);
        } else {
          await expect(accountPageStaff.genLoc(accountPageStaff.xpathBtnWithLabel("Grant access"))).toBeDisabled();
        }
        await accountPageStaff.page.close();
      });
    }
  });

  test(` Verify khi thực hiện grant permissions cho mudule "Delete access" @SB_SET_ACC_PMS_PMSC_12`, async ({
    conf,
    browser,
  }) => {
    const dataPermission = conf.caseConf.data_permission;
    for (const item of dataPermission) {
      const moduleProduct = item.module_product;
      const moduleMember = item.module_members;
      const subModuleMember = item.sub_module;

      await test.step('Check hiện thị trên màn hình của "Store owner " khi check thành công', async () => {
        await accountSettingPage.checkedModule(moduleProduct.module_name, moduleProduct.value);
        await accountSettingPage.checkedModule(moduleMember.module_name, moduleMember.value);
        await accountSettingPage.checkedModule("Grant access", true);
        await accountSettingPage.checkedModule(subModuleMember.module_name, subModuleMember.value);
        const xpathBtnSave = accountSettingPage.xpathBtnWithLabel("Save changes");
        const isChange = await accountSettingPage.page.locator(xpathBtnSave).isVisible();
        if (isChange) {
          await accountSettingPage.page.locator(xpathBtnSave).click();
        }
        await expect(
          accountSettingPage.page.locator(accountSettingPage.getXpathCheckboxWithModule(subModuleMember.module_name)),
        ).toBeChecked({ checked: subModuleMember.value });
      });

      await test.step('Navigate đến màn hình "Member" của staff account', async () => {
        const contextStaff = await browser.newContext();
        const pageStaff = await contextStaff.newPage();
        const accountPageStaff = new MemberPage(pageStaff, conf.suiteConf.domain);
        await accountPageStaff.login({
          email: conf.suiteConf.staff.username,
          password: conf.suiteConf.staff.password,
        });
        try {
          await accountPageStaff.navigateToMenu("Contacts");
        } catch {
          await accountPageStaff.navigateToMenu("Members");
        }
        const firstName = conf.suiteConf.data_create_member[0].first_name;
        const lastName = conf.suiteConf.data_create_member[0].last_name;
        const fullName = `${firstName} ${lastName}`;
        await accountPageStaff.openMemberDetailWithFullName(fullName);
        await expect(accountPageStaff.genLoc(accountPageStaff.xpathBtnWithLabel("Grant access"))).toBeVisible();
        await accountPageStaff.genLoc(accountPageStaff.xpathBtnWithLabel("Grant access")).click();
        await accountPageStaff.page.waitForSelector(accountPageStaff.xpathPopup);
        await accountPageStaff.page.locator(accountPageStaff.xpathSearchProductField).click();
        const listProduct = conf.suiteConf.product_list;
        for (let i = 0; i < listProduct.length; i++) {
          const productName = listProduct[i].product.title;
          await accountPageStaff.getXpathProductOnPopUp(productName).click();
        }
        await accountPageStaff.clickButtonOnPopUpWithLabel("Grant access");
        await expect(accountPageStaff.genLoc(accountPageStaff.xpathProductAccess)).toBeVisible();

        if (subModuleMember.value === true) {
          for (let i = 0; i < listProduct.length; i++) {
            const productName = listProduct[i].product.title;
            await expect(accountPageStaff.getXpathBtnDeleteAccess(productName)).toBeVisible();
            await accountPageStaff.getXpathBtnDeleteAccess(productName).click();
            await accountPageStaff.page.waitForSelector(accountPageStaff.xpathPopup);
            await accountPageStaff.clickButtonOnPopUpWithLabel("Remove access");
            await expect(accountPageStaff.genLoc(accountPageStaff.getXpathWithLabel(productName))).not.toBeVisible();
          }
        } else {
          for (let i = 0; i < listProduct.length; i++) {
            const productName = listProduct[i].product.title;
            await expect(accountPageStaff.getXpathBtnDeleteAccess(productName)).not.toBeVisible();
          }
        }
        await accountPageStaff.page.close();
      });
    }
  });
});
