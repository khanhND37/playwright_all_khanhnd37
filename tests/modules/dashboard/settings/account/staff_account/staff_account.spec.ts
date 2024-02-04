import { expect, test } from "@core/fixtures";
import { AccountSetting } from "@pages/dashboard/account_setting";
// import { Mailinator } from "@helper/mailinator";
import { AccountPage } from "@pages/dashboard/accounts";
import { loadData } from "../../../../../../src/core/conf/conf";
// import { getMailinatorInstanceWithProxy } from "@utils/mail";
import { Guerilla } from "@helper/guerilla_mail";

let account: AccountSetting;
// let mailinator: Mailinator;
let mail: Guerilla;
let newAccount: AccountPage;
const logOut = "//a[@href='/admin/logout' and not(ancestor::header)]";
const logInTitle = "//div[@class='unite-ui-login__title']";
const xpathStaffAccount = "//a[contains(@href,'/admin/settings/account/') and @class='staff-link']";
const notiIcon = "//header[not(contains(@class,'header-mobile'))]//div[@class='in-app-notification']";

test.describe(`Test add account feature`, () => {
  test(`Add full staff accounts with basic plan @SB_SET_AAS_1`, async ({ dashboard, page, conf }) => {
    await test.step(`Truy cập Account section trong Settings`, async () => {
      account = new AccountSetting(dashboard, conf.suiteConf.domain);
      await account.goToAccountSetting();
      //delete all staff account if previous time run failed
      if ((await dashboard.locator(xpathStaffAccount).count()) > 0) {
        await account.deleteAllStaffAccount(conf.suiteConf.password);
        expect(await dashboard.locator(xpathStaffAccount).count()).toEqual(0);
      }
    });
    await test.step(`Add a staff account`, async () => {
      await account.addStaffAccountNotFullPermissions(conf.caseConf.staff_unpermissions, conf.caseConf.unpermissions);
      // Check mail qua Guerilla
      mail = new Guerilla(page);
      await mail.accessMail(conf.caseConf.staff_unpermissions_name);
      await mail.readMailWithContent(conf.suiteConf.shop_name, conf.suiteConf.invite_content, "");
      await expect(mail.page.locator(mail.createStaffAccLink)).toBeVisible();

      /** Đoạn này check mail qua Mailinator 
      mailinator = await getMailinatorInstanceWithProxy(page);
      await mailinator.accessMail(conf.caseConf.staff_unpermissions_name);
      while (await mailinator.page.locator('(//td[normalize-space()="just now"])[1]').isHidden()) {
        await mailinator.page.reload();
        await mailinator.page.waitForSelector(mailinator.xpathFirstEmail);
      }
      await expect(mailinator.page.locator(mailinator.xpathFirstSubject)).toContainText(conf.caseConf.subject_mail);
      */
    });
    await test.step(`Add 4 staff accounts`, async () => {
      const staffList: Array<string> = conf.caseConf.staff_list;
      for (let i = 0; i < staffList.length; i++) {
        await account.goToAccountSetting();
        await account.addStaffAccountFullPermissions(staffList[i]);
      }
      expect(await dashboard.locator("(//*[normalize-space()='Add staff account'])[last()]").count()).toEqual(0);
    });
  });

  test(`Xóa account staff @SB_SET_AAS_7`, async ({ dashboard, conf }) => {
    await test.step(`Truy cập Account section trong Settings`, async () => {
      account = new AccountSetting(dashboard, conf.suiteConf.domain);
      await account.goToAccountSetting();
    });
    await test.step(`Delete all account staff trong danh sách`, async () => {
      await account.deleteAllStaffAccount(conf.suiteConf.password);
      expect(await dashboard.locator(xpathStaffAccount).count()).toEqual(0);
    });
  });
});

test.describe(`Test permission of the account`, () => {
  const caseID = "PER_ACC";
  const conf = loadData(__dirname, caseID);

  conf.caseConf.forEach(
    ({
      case_id: caseID,
      case_name: caseName,
      staff: staff,
      staff_name: staffName,
      // subject_mail: subjectMail,
      username: username,
      password: password,
      unpermissions: unPermissions,
      menu_unpermissions: menuUnpermissions,
    }) => {
      test(`@${caseID} ${caseName}`, async ({ dashboard, page, conf }) => {
        await test.step(`Truy cập Account section trong Settings, add staff account`, async () => {
          account = new AccountSetting(dashboard, conf.suiteConf.domain);
          await account.goToAccountSetting();
          //delete all staff account if previous time run failed
          if ((await dashboard.locator(xpathStaffAccount).count()) > 0) {
            await account.deleteAllStaffAccount(conf.suiteConf.password);
            expect(await dashboard.locator(xpathStaffAccount).count()).toEqual(0);
          }
          if (caseID == "SB_SET_AAS_4") {
            await account.addStaffAccountFullPermissions(staff);
          } else if (caseID == "SB_SET_AAS_5") {
            await account.addStaffAccountNotFullPermissions(staff, unPermissions);
          }
          // Check mail qua Guerilla
          mail = new Guerilla(page);
          await mail.accessMail(staffName);
          await mail.readMailWithContent(conf.suiteConf.shop_name, conf.suiteConf.invite_content, "");
          await mail.page.click(mail.createStaffAccLink);

          /** Đoạn này check mail qua Mailinator 
          mailinator = await getMailinatorInstanceWithProxy(page);
          await mailinator.accessMail(staffName);
          while (await mailinator.page.locator('(//td[normalize-space()="just now"])[1]').isHidden()) {
            await mailinator.page.reload();
            await mailinator.page.waitForSelector(mailinator.xpathFirstEmail);
          }
          await expect(mailinator.page.locator(mailinator.xpathFirstSubject)).toContainText(subjectMail);
          await mailinator.readMail(subjectMail);
          await mailinator.page
            .frameLocator("//iframe[@id='html_msg_body']")
            .locator("//a[contains(text(),'Create staff')]")
            .click();
          await mailinator.page.click('//a[@onclick="deleteEmail();"]');
          */
        });
        await test.step(`Đăng nhập dashboard bằng staff account, và thử truy cập các quyền`, async () => {
          await dashboard.click(`//p[text()="${conf.suiteConf.domain}"]`);
          await dashboard.click(logOut);
          await dashboard.waitForSelector(logInTitle);
          newAccount = new AccountPage(dashboard, conf.suiteConf.domain);
          await newAccount.login({ email: username, password: password });
          await newAccount.page.waitForSelector(notiIcon, { timeout: 150000 });
          if (caseID == "SB_SET_AAS_4") {
            for (let i = 1; i < (await dashboard.locator("//li/a[@class='text-decoration-none']").count()) + 1; i++) {
              expect(
                await dashboard.locator(`(//li/a[@class="text-decoration-none"])[${i}]`).getAttribute("href"),
              ).not.toContain("/admin/no_access");
            }
          } else if (caseID == "SB_SET_AAS_5") {
            for (let i = 0; i < menuUnpermissions.length; i++) {
              expect(
                await dashboard
                  .locator(`//span[normalize-space()="${menuUnpermissions[i]}"]/../../parent::a`)
                  .getAttribute("href"),
              ).toContain("/admin/no_access");
            }
          }
        });
      });
    },
  );
});
