import { expect, test } from "@core/fixtures";
import { convertDate } from "@core/utils/datetime";
import { readDownloadFileCSV } from "@helper/file";
import { MemberPage } from "@pages/digital_product/dashboard/member";
import { MemberByAPI } from "@pages/digital_product/dashboard/member_api";
import type { DetailInfo, Param } from "@types";

test.describe("Import export member @TS_SB_DP_DB_MB", async () => {
  let memberByAPI: MemberByAPI;
  let memberPage: MemberPage;
  let accessToken: string;
  let actualDetail: DetailInfo;

  const checkDataInDownloadFile = async (xpath: string, index: number, value: string[]): Promise<boolean> => {
    const file = await memberPage.downloadFile(xpath);
    const readFile = await readDownloadFileCSV(file, "\t", index);
    let checkDataOnCSV = false;
    for (let j = 0; j < readFile.length; j++) {
      checkDataOnCSV = readFile[j].some(data => data.replaceAll("\n", "").trim() == value[j].trim());
      if (checkDataOnCSV == true) {
        return checkDataOnCSV;
      }
    }
    return false;
  };

  const xpathMessage = async (
    accessToken: string,
    param: Param,
    productId: Array<number>,
    username: string,
  ): Promise<string> => {
    const result = await memberByAPI.getMemberList(accessToken, param, productId);
    const total = result._metadata.total_count;
    const message = `Exported ${total} members successfully. Please check email ${username} for CSV file.`;
    const xpathMessage = `//div[@class='s-notices is-bottom' and normalize-space()='${message}']`;
    return xpathMessage;
  };

  test.beforeEach(async ({ dashboard, conf, authRequest, token }) => {
    const tokenObject = await token.getWithCredentials({
      domain: conf.suiteConf.domain,
      username: conf.suiteConf.username,
      password: conf.suiteConf.password,
    });
    accessToken = tokenObject.access_token;
    memberByAPI = new MemberByAPI(conf.suiteConf.domain, authRequest);
    memberPage = new MemberPage(dashboard, conf.suiteConf.domain);
    await memberPage.goto(`admin/members?x_key=${accessToken}`);
    await dashboard.waitForLoadState("load");
  });

  test("Verify luồng import members thành công @TC_SB_DP_DB_MB_26", async ({ dashboard, conf }) => {
    const preParam = conf.caseConf.param_before;
    const data = conf.caseConf.data;
    const btnImport = conf.suiteConf.btn_import;
    const valueDefault = conf.suiteConf.value_default;

    //get total member before import
    const result = await memberByAPI.getMemberList(accessToken, preParam);
    const total = result._metadata.total_count;

    await test.step("Verify luồng import member thành công: ", async () => {
      await memberPage.importMember(data.file_path, data.is_overwrite, btnImport);
      await expect(dashboard.locator("//div[@class='s-modal-wrapper']")).toBeVisible();
      await dashboard.reload();
      const result = await memberByAPI.getMemberList(accessToken, preParam);
      expect(result._metadata.total_count).toEqual(total + 1);

      //verify member information on Member list after create successfully
      const date = Date.now();
      const addDate = convertDate(date);
      const actualInfo = await memberByAPI.getMemberInfo(accessToken, valueDefault, conf.caseConf.param_after);
      expect(actualInfo[0]).toEqual(
        expect.objectContaining({
          avatar: valueDefault.img,
          name: `${data.data_import.first_name} ${data.data_import.last_name}`,
          email: data.data_import.email,
          sale: valueDefault.sale,
          addDate: addDate,
          lastSignIn: valueDefault.value,
        }),
      );

      //verify member information in Member detail after create successfully
      actualDetail = await memberByAPI.getMemberDetailInfo(result.data[0].id, accessToken);
      expect(actualDetail).toEqual(
        expect.objectContaining({
          firstName: data.data_import.first_name,
          lastName: data.data_import.last_name,
          email: data.data_import.email,
          country: data.data_import.country,
          country_code: data.data_import.country_code,
          phone: data.data_import.value,
          tag: data.data_import.value,
          note: data.data_import.value,
        }),
      );
      // delete member by API
      await memberByAPI.deleteMemberByAPI(accessToken, result.data[0].id);
      const result1 = await memberByAPI.getMemberList(accessToken, preParam);
      expect(result1._metadata.total_count).toEqual(result._metadata.total_count - 1);
    });
  });

  test("Verify luồng import members không thành công  @TC_SB_DP_DB_MB_6", async ({ dashboard, conf }) => {
    const defaultData = conf.caseConf.default_data;
    const param = conf.caseConf.param;
    const fileUpload = conf.caseConf.file_upload;
    const xpathClose = "(//parent::div[normalize-space()='Import members']//span)[1]";
    //get total member before import
    const result = await memberByAPI.getMemberList(accessToken, param);
    const total = result._metadata.total_count;

    await test.step("Click btn Import", async () => {
      await memberPage.clickBtnImport();

      //verify default data in Import popup
      const actualData = await memberPage.getImportDefaultData();
      expect(actualData).toEqual(
        expect.objectContaining({
          title: defaultData.title,
          linkTempalate: defaultData.link_template,
          totalFileUploaded: defaultData.file_uploaded,
          btnCancel: defaultData.value,
          btnImport: defaultData.value,
        }),
      );
      await dashboard.locator(xpathClose).click();
    });

    await test.step("Click hyperlink CSV template", async () => {
      await memberPage.clickBtnImport();
      const checkDataInCSV = await checkDataInDownloadFile(
        "//a[normalize-space()='CSV template']",
        1,
        conf.caseConf.template,
      );
      expect(checkDataInCSV).toEqual(true);
      await dashboard.locator(xpathClose).click();
    });

    await test.step("Verify cancel Import file: ", async () => {
      await memberPage.importMember(fileUpload.file_path, fileUpload.is_overwrite, conf.suiteConf.btn_cancel);
      await expect(dashboard.locator("//div[@class='sb-popup__container sb-absolute sb-w-100']")).toBeHidden();
    });

    for (let i = 0; i < conf.caseConf.data.length; i++) {
      await test.step("Validate ivalid import member ", async () => {
        const data = conf.caseConf.data[i];
        await memberPage.importMember(data.file_path, data.is_overwrite, conf.suiteConf.btn_import);
        // verify total member after import
        const result = await memberByAPI.getMemberList(accessToken, param);
        expect(result._metadata.total_count).toEqual(total);

        if (data.is_import) {
          // verify content Import progress popup
          await expect(dashboard.locator("//div[@class='s-modal-wrapper']")).toBeVisible();
          expect(await memberPage.getImportProgressPopup()).toEqual(
            expect.objectContaining({
              title: conf.caseConf.progress_popup.title,
              content: conf.caseConf.progress_popup.content,
              btnClose: conf.caseConf.progress_popup.value,
            }),
          );
          await dashboard.locator("//button[normalize-space()='Close']").click();
        } else {
          expect(await dashboard.locator(`//p[normalize-space()='${data.message}']`).isVisible());
          await dashboard.locator(xpathClose).click();
        }
      });
    }
  });

  test("Verify chức năng export members @TC_SB_DP_DB_MB_7", async ({ dashboard, conf }) => {
    const xpathBtnExport = "//button[normalize-space()='Export members']";
    const maxRecord = conf.suiteConf.max_record;

    await test.step("Click btn Export", async () => {
      await memberPage.selectOptionExportMember(conf.caseConf.data[0].options);
    });

    await test.step("Click Cancel", async () => {
      await memberPage.clickBtnInExportPopup(false);
      expect(dashboard.locator("//div[@class='sb-popup__container sb-absolute sb-w-100']").isHidden());
    });

    await test.step("Verify luồng export member theo điều kiện", async () => {
      for (let i = 0; i < conf.caseConf.data.length; i++) {
        const data = conf.caseConf.data[i];
        const param = data.param;
        const productName = [];

        //get product to filter
        const products = await memberByAPI.getProductInfo(accessToken, data.total_selected);
        for (let j = 0; j < data.total_selected; j++) {
          productName.push(products[j].name);
        }
        const productId = await memberByAPI.getProductId(accessToken, data.total_selected);

        //get total member with param
        const result = await memberByAPI.getMemberList(accessToken, param, productId);
        const total = result._metadata.total_count;

        //get member info and format data
        const memberId = await memberByAPI.getMemberIdByAPI(accessToken, param, productId);
        const dataMember = await memberByAPI.formatDataMember(memberId, accessToken);

        await memberPage.exportMember(param, productName, data.total_selected, data.options);
        if (data.option === "Current page" || total <= maxRecord) {
          const checkDataInCSV = await checkDataInDownloadFile(xpathBtnExport, 2, dataMember);
          expect(checkDataInCSV).toEqual(true);
        } else {
          const xpath = await xpathMessage(accessToken, param, productId, conf.suiteConf.username);
          await dashboard.locator(xpathBtnExport).click();
          expect(dashboard.locator(xpath).isVisible());
        }
        // clear keyword in txt search
        const searchValue = await memberPage.clearKeyword();
        expect(searchValue).toEqual(0);
      }
    });
  });
});
