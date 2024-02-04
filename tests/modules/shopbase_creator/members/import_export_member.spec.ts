import { expect, test } from "@core/fixtures";
import { convertDate } from "@core/utils/datetime";
import { MemberPage } from "@pages/shopbase_creator/dashboard/member";
import { MemberAPI } from "@pages/shopbase_creator/dashboard/member_api";
import { snapshotDir } from "@utils/theme";
import { generateEmail } from "@core/utils/theme";

test.beforeEach(({}, testInfo) => {
  testInfo.snapshotSuffix = "";
  testInfo.snapshotDir = snapshotDir(__filename);
});

test.describe("Import export member @TS_SB_DP_DB_MB", async () => {
  let memberPage: MemberPage;
  let memberAPI: MemberAPI;

  test.beforeEach(async ({ dashboard, conf, authRequest }) => {
    memberAPI = new MemberAPI(conf.suiteConf.domain, authRequest);
    memberPage = new MemberPage(dashboard, conf.suiteConf.domain);
    await memberPage.navigateToMemberPage();
  });

  test.afterEach(async ({ conf, authRequest }) => {
    memberAPI = new MemberAPI(conf.suiteConf.domain, authRequest);
    const response = await memberAPI.getMembers(conf.suiteConf.paging_param);
    const member = response.data;
    for (let i = 0; i < member.length; i++) {
      const id = member[i].id;
      await memberAPI.deleteMember(id);
    }
  });

  test("Verify luồng import members thành công @SB_SC_SCM_7", async ({ dashboard, conf, snapshotFixture }) => {
    const param = conf.caseConf.paging_param;
    const btnImport = conf.caseConf.btn_import;
    //get total member before import
    const response = await memberAPI.getMembers(param);
    let total: number;
    if (response._metadata.total_count) {
      total = response._metadata.total_count;
    } else {
      total = 0;
    }

    await test.step("Click btn Import -> Verify thông tin hiển thị -> click button cancel ", async () => {
      await memberPage.clickButtonOnMembersPage(btnImport);
      await snapshotFixture.verify({
        page: dashboard,
        selector: memberPage.xpathPopup,
        snapshotName: "import_popup.png",
        snapshotOptions: {
          maxDiffPixelRatio: 0.05,
          threshold: 0.1,
          maxDiffPixels: 2000,
        },
      });
      await memberPage.clickButtonOnPopup(conf.caseConf.button_cancel);
      await memberPage.genLoc(memberPage.xpathPopup).isHidden();
    });

    await test.step("Verify luồng import member thành công ", async () => {
      const data = conf.caseConf.data_import_member_success;
      await memberPage.clickButtonOnMembersPage(btnImport);
      await memberPage.inputFileImportMember(data.file_path, data.is_overwrite);
      await memberPage.clickButtonOnPopup(data.button_import);
      for (let i = 0; i < 6; i++) {
        const response = await memberAPI.getMembers(param);
        const result = response._metadata.total_count;
        if (result > 0) {
          expect(result).toEqual(total + 1);
          break;
        } else {
          await memberPage.page.waitForTimeout(3 * 1000);
        }
      }
    });

    await test.step("Verify thông tin member sau khi import thành công", async () => {
      await memberPage.page.reload();
      const memberInfo = conf.caseConf.member_info;
      const member = response.data;
      for (let i = 0; i < member.length; i++) {
        const info = {
          avatar: "",
          name: "",
          email: member[i].email,
          sale: "",
          addDate: convertDate(member[i].created_at),
          lastSignIn: "",
        };
        if (!member[i].avatar) {
          info.avatar = memberInfo.img;
        } else if (member[i].avatar) {
          info.avatar = member[i].avatar;
        }
        if (!member[i].first_name && !member[i].last_name) {
          info.name = memberInfo.last_signed_in;
        } else if (!member[i].first_name) {
          info.name = member[i].last_name;
        } else if (!member[i].last_name) {
          info.name = member[i].first_name;
        } else {
          info.name = `${member[i].first_name} ${member[i].last_name}`;
        }
        if (member[i].last_signed_in == null) {
          info.lastSignIn = memberInfo.last_signed_in;
        } else {
          const date = member[i].last_signed_in * 1000;
          info.lastSignIn = convertDate(date);
        }
        if (info.email) {
          info.email = info.email.trim();
        }
        if (!member[i].total_spent) {
          info.sale = "$0.00";
        } else {
          info.sale = `$${member[i].total_spent.toFixed(2)}`;
        }

        const getMember = await memberPage.getMemberDataInTable();
        expect(info).toEqual(
          expect.objectContaining({
            avatar: getMember[i].avatar,
            name: getMember[i].name,
            email: getMember[i].email,
            sale: getMember[i].sale,
            addDate: getMember[i].addDate,
            lastSignIn: getMember[i].lastSignIn,
          }),
        );
      }
    });

    for (const dataImportFalse of conf.caseConf.list_data_import_member_false) {
      await test.step(`${dataImportFalse.description}`, async () => {
        await memberPage.clickButtonOnMembersPage(btnImport);
        await memberPage.inputFileImportMember(dataImportFalse.file_path, dataImportFalse.is_overwrite);
        const buttonImport = await memberPage.genLoc(memberPage.xpathButtonImport).isEnabled();
        if (buttonImport) {
          await memberPage.clickButtonOnPopup(conf.caseConf.btn_import_member);
        }
        await expect(memberPage.genLoc(memberPage.xpathIconWaring)).toBeVisible();
        await memberPage.clickButtonOnPopup(conf.caseConf.button_cancel);
      });
    }
  });

  test(`member_list - Verify chức năng export members @SB_SC_SCM_8`, async ({ conf, dashboard, snapshotFixture }) => {
    const data = conf.caseConf.data_create_member;
    for (let i = 0; i < data.length; i++) {
      const email = generateEmail();
      await memberAPI.createMember({
        ...data[i],
        email: email,
      });
    }
    await memberPage.page.reload();

    await test.step(`Click button Export -> Verify Popup hiển thị -> Click Button Cancel trên Popup -> Verify popup`, async () => {
      await memberPage.clickButtonOnMembersPage(conf.caseConf.btn_export);
      await memberPage.page.waitForTimeout(1000);
      await snapshotFixture.verify({
        page: dashboard,
        selector: memberPage.xpathPopup,
        snapshotName: "export_popup.png",
        snapshotOptions: {
          maxDiffPixelRatio: 0.05,
          threshold: 0.1,
          maxDiffPixels: 2000,
        },
      });
      await memberPage.clickButtonOnPopup(conf.caseConf.button_cancel);
      await memberPage.genLoc(memberPage.xpathPopup).isHidden();
    });
    const dataExport = conf.caseConf.data_export_member;
    for (let i = 0; i < dataExport.length; i++) {
      await test.step(`${dataExport.description}`, async () => {
        await memberPage.clickButtonOnMembersPage(conf.caseConf.btn_export);
        await memberPage.inputExportMember(dataExport[i].exportType, dataExport[i].exportAs);
        await memberPage.clickButtonOnPopup(conf.caseConf.button_export_member);
        expect(await memberPage.getMessage()).toEqual(dataExport[i].message);
        await memberPage.genLoc(memberPage.xpathMessage).isHidden();
      });
    }

    await test.step(`Export data empty -> Verify message hiển thị `, async () => {
      await memberPage.genLoc(memberPage.xpathSearchMember).fill(conf.caseConf.keyword);
      await memberPage.page.waitForSelector(memberPage.xpathColumnMember);
      await memberPage.clickButtonOnMembersPage(conf.caseConf.btn_export);
      await memberPage.clickButtonOnPopup(conf.caseConf.button_export_member);
      await expect(memberPage.genLoc(memberPage.xpathMessageOnPopup)).toBeVisible();
      await expect(memberPage.genLoc(memberPage.xpathMessageOnPopup)).toHaveText(
        "You can't export an empty member list.",
      );
    });
  });
});
