import { expect, test } from "@core/fixtures";
import { readFileCSV } from "@helper/file";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { HiveSocialProof } from "@pages/hive/shopbase/social_proof";
import { SFHome } from "@pages/storefront/homepage";

test.describe("Test screen socail proof list", async () => {
  let hiveNotification: HiveSocialProof;
  const idSocialProof: string[] = [];

  test.beforeEach(async ({ conf, hiveSBase }) => {
    hiveNotification = new HiveSocialProof(hiveSBase, conf.suiteConf.hive_domain);
    await hiveNotification.navigateSocialProof();
    if (conf.caseConf.social_proof_data) {
      const socialProofAddForm = conf.caseConf.social_proof_data;
      for (let i = 0; i < socialProofAddForm.length; i++) {
        await hiveNotification.genLoc(hiveNotification.xpathBtnAddNew).click();
        await hiveNotification.page.waitForSelector(hiveNotification.getXpathWithLabel("Create"));
        await hiveNotification.page.waitForTimeout(2 * 1000);
        await hiveNotification.fillSocialProofFormData(socialProofAddForm[i]);
        await hiveNotification.genLoc(hiveNotification.xpathBtnCreateAndClose).click();
        let id = await hiveNotification.getXpathIdSocialProof(socialProofAddForm[i].name).textContent();
        id = id.trim();
        idSocialProof.push(id);
      }
    }
  });

  test.afterEach(async ({ conf }) => {
    await hiveNotification.navigateSocialProof();
    const dataAddProof = conf.caseConf.social_proof_data;
    const dataDeleteProof = conf.caseConf.delete_proof_data;
    if (dataAddProof && !dataDeleteProof) {
      for (let i = 0; i < idSocialProof.length; i++) {
        const isExistId = await hiveNotification.getXpathCheckboxWithValue(idSocialProof[i]).isVisible();
        if (isExistId) {
          await hiveNotification.getXpathCheckboxWithValue(idSocialProof[i]).click();
        }
      }
      await hiveNotification.genLoc(hiveNotification.xpathBtnOK).click();
      await hiveNotification.clickOnBtnWithLabel("Yes, execute");
    }
  });

  test("Verify thông tin khi thực hiện thực năng filter @SB_HSB_SPIH_3", async ({ conf }) => {
    await test.step("Hiện thị popup chứa các checkbox", async () => {
      await hiveNotification.genLoc(hiveNotification.xpathBtnFilter).click();
      await hiveNotification.page.waitForSelector(hiveNotification.xpathFilterDropdown);
      const allFieldPopup = await hiveNotification.getAllText(hiveNotification.xpathFilterDropdown);
      expect(["Id", "Display Time", "Waiting Time", "Click", "Created At", "Updated At"]).toEqual(
        expect.arrayContaining(allFieldPopup),
      );
    });
    await test.step("Check giá trị fillter", async () => {
      const dataFilters = conf.caseConf.data_filters;
      for (const filterItem of dataFilters) {
        for (let j = 0; j < Object.keys(filterItem).length - 1; j++) {
          const nameField = Object.keys(filterItem)[j];
          const valueField = filterItem[`${nameField}`];
          await hiveNotification.fillDataForFilter(valueField["fieldName"], valueField["value"]);
          await hiveNotification.genLoc(hiveNotification.xpathBtnFilter).click();
          await hiveNotification.clickOnBtnWithLabel("Filter");
          if (filterItem.result == true) {
            for (let k = 0; k < Object.keys(filterItem).length - 1; k++) {
              const field = Object.keys(filterItem)[k];
              const value = filterItem[`${field}`];
              const indexField = await hiveNotification.getIndexField(value["fieldName"] + 1);
              const resultsReceived = await hiveNotification.getAllText(
                hiveNotification.getXpathCellWithIndex(indexField),
              );
              const resultsExpect = resultsReceived.every(e => {
                return e == value["value"];
              });
              expect(resultsExpect).toBeTruthy();
            }
          } else {
            await expect(hiveNotification.genLoc(hiveNotification.getXpathWithLabel("No result"))).toBeVisible();
          }
          await hiveNotification.genLoc(hiveNotification.getXpathWithLabel("Reset")).click();
        }
      }
    });
  });

  test("Delete 1 social proof su dụng Action delete trên từng line @SB_HSB_SPIH_4", async ({ conf }) => {
    const dataDeletes = conf.caseConf.delete_proof_data;
    for (const dataItemDelete of dataDeletes) {
      const xpathBtnDelete = `${hiveNotification.getXpathRowWithProofName(
        dataItemDelete,
      )}/..//*[normalize-space() = 'Delete']`;
      let idSocialProof = await hiveNotification.getXpathIdSocialProof(dataItemDelete).textContent();
      idSocialProof = idSocialProof.trim();

      await test.step('Select 1 social proof,Click button "Delete" của social proof đó', async () => {
        await hiveNotification.genLoc(xpathBtnDelete).click();
        await expect(hiveNotification.genLoc(hiveNotification.getXpathWithLabel("Confirm deletion"))).toBeVisible();
        expect(await hiveNotification.getTextContent(hiveNotification.xpathConfirmBody)).toContain(
          "Are you sure you want to delete the selected",
        );
        await hiveNotification.clickOnBtnWithLabel("Yes, delete");
      });

      await test.step("Kiểm tra bản ghi đã xóa không tồn tại trong list ", async () => {
        await hiveNotification.fillDataForFilter("Id", idSocialProof);
        await hiveNotification.genLoc(hiveNotification.xpathBtnFilter).click();
        await hiveNotification.clickOnBtnWithLabel("Filter");
        await expect(hiveNotification.genLoc(hiveNotification.getXpathWithLabel("No result"))).toBeVisible();
        await hiveNotification.genLoc(hiveNotification.getXpathWithLabel("Reset")).click();
      });
    }
  });

  test("Check delete nhiều social trong list social proof @SB_HSB_SPIH_5", async ({ conf }) => {
    const ids = [];
    await test.step("Chọn vào các social proof bất kì->Click vào button OK", async () => {
      const dataDeletes = conf.caseConf.delete_proof_data;
      for (const dataItemDelete of dataDeletes) {
        let id = await hiveNotification.getXpathIdSocialProof(dataItemDelete).textContent();
        id = id.trim();
        ids.push(id);
        await hiveNotification.getXpathCheckboxWithValue(dataItemDelete).click();
      }
      await hiveNotification.genLoc(hiveNotification.xpathBtnOK).click();
      await expect(
        hiveNotification.genLoc(hiveNotification.getXpathWithLabel('Confirm batch action "Delete"')),
      ).toBeVisible();
      expect(await hiveNotification.genLoc(hiveNotification.xpathConfirmBody).textContent()).toContain(
        `Are you sure you want to ` +
          `confirm this action and execute it for the ${dataDeletes.length} selected elements?`,
      );
    });

    await test.step("Kiểm tra bản ghi đã xóa không tồn tại trong list", async () => {
      await hiveNotification.clickOnBtnWithLabel("Yes, execute");
      for (let i = 0; i < ids.length; i++) {
        await hiveNotification.fillDataForFilter("Id", ids[i]);
        await hiveNotification.genLoc(hiveNotification.xpathBtnFilter).click();
        await hiveNotification.clickOnBtnWithLabel("Filter");
        await expect(hiveNotification.genLoc(hiveNotification.getXpathWithLabel("No result"))).toBeVisible();
        await hiveNotification.genLoc(hiveNotification.getXpathWithLabel("Reset")).click();
      }
    });
  });

  test("Check Update record thành công không sử dụng variable có sẵn @SB_HSB_SPIH_7", async ({
    page,
    conf,
    dashboard,
  }) => {
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    const sfPage = new SFHome(page, conf.suiteConf.domain);
    await test.step("test hiện thị record trên social proof", async () => {
      const dataSocialProof = conf.caseConf.social_proof_data;
      const id = await hiveNotification.getXpathIdSocialProof(dataSocialProof[0].name).textContent();
      await hiveNotification.getXpathLinkName(dataSocialProof[0].name).click();
      await hiveNotification.fillSocialProofFormData(conf.caseConf.social_proof_edit);
      await hiveNotification.clickAction(hiveNotification.xpathBtnUpdateAndClose);
      await expect(hiveNotification.genLoc(hiveNotification.xpathAlertSuccess)).toBeVisible();
      await hiveNotification.page.waitForSelector(hiveNotification.getXpathWithLabel("Copy script"));
      await hiveNotification.copyScript(id);
      await expect(hiveNotification.genLoc(hiveNotification.xpathAlertSuccess)).toBeVisible();
    });

    await test.step("test hiện thị trên landing", async () => {
      await dashboardPage.goto("/admin/preferences");
      await dashboardPage.genLoc(dashboardPage.xpathScriptPreferences).click();
      await dashboardPage.page.keyboard.press("Control+A");
      await dashboardPage.page.keyboard.press("Control+V");
      await dashboardPage.clickOnBtnWithLabel("Save");
      const socialProofExpect = conf.caseConf.social_proof_edit.data_content;
      await sfPage.page.goto(`https://${conf.suiteConf.domain}`);
      for (const socialProofItem of socialProofExpect) {
        const socialProofActual = await sfPage.getSocialProof();
        // Compare each key-value pair in config equal with content got from popup
        Object.entries(socialProofItem).forEach(entry => {
          const [key, value] = entry;
          expect(socialProofActual[key]).toContain(value);
        });
        let delayTime: number;
        const socialProofEdit = conf.caseConf.social_proof_edit;
        if (Object.keys(socialProofEdit).indexOf(`delayTime`) > -1) {
          delayTime = Number(socialProofEdit.delay_time) * 1000;
        } else {
          delayTime = Number(conf.caseConf.social_proof_data[0].delay_time) * 1000;
        }
        await dashboardPage.page.waitForTimeout(delayTime);
      }
    });
  });

  test("Update file csv không thành công @SB_HSB_SPIH_8", async ({ conf }) => {
    await hiveNotification.genLoc(hiveNotification.xpathBtnAddNew).click();
    await hiveNotification.clickAction(hiveNotification.getXpathWithLabel("Upload CSV"));
    const files = conf.caseConf.files;
    for (let i = 0; i < files.length; i++) {
      await hiveNotification.uploadFile("csv", files[i]);
      hiveNotification.page.on("dialog", async dialog => {
        expect(dialog.message()).toContain("Bạn chỉ được nhập file csv vào hệ thống");
        await dialog.dismiss();
      });
    }
  });

  test("Check Update record thành công sử dụng variable có sẵn @SB_HSB_SPIH_14", async ({ conf, page, dashboard }) => {
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    const sfPage = new SFHome(page, conf.suiteConf.domain);
    await test.step("Kiểm tra hiện thị variable khi upload 1 file csv", async () => {
      const id = await hiveNotification.getXpathIdSocialProof(conf.caseConf.social_proof_data[0].name).textContent();
      await hiveNotification.getXpathLinkName(conf.caseConf.social_proof_data[0].name).click();
      await hiveNotification.clickAction(hiveNotification.getXpathWithLabel("Upload CSV"));
      await hiveNotification.uploadFile("csv", conf.caseConf.file_edit);
      await hiveNotification.clickAction(hiveNotification.xpathBtnClose);
      await hiveNotification.clickAction(hiveNotification.getXpathWithLabel("Social Proof Infomation"));
      const variables = await hiveNotification.getAllText(hiveNotification.xpathBtnVariable);
      const dataFile = await readFileCSV(conf.caseConf.file_edit, "\t", 1);
      expect(JSON.stringify([variables.join()])).toEqual(JSON.stringify(dataFile[0]));
      await hiveNotification.fillSocialProofFormData(conf.caseConf.social_proof_edit);
      await hiveNotification.clickAction(hiveNotification.xpathBtnUpdateAndClose);
      await expect(hiveNotification.genLoc(hiveNotification.xpathAlertSuccess)).toBeVisible();
      await hiveNotification.page.waitForSelector(hiveNotification.getXpathWithLabel("Copy script"));
      await hiveNotification.copyScript(`${id}`);
      await expect(hiveNotification.genLoc(hiveNotification.xpathAlertSuccess)).toBeVisible();
    });

    await test.step("test hiện thị trên landing", async () => {
      await dashboardPage.goto("/admin/preferences");
      await dashboardPage.genLoc(dashboardPage.xpathScriptPreferences).click();
      await dashboardPage.page.keyboard.press("Control+A");
      await dashboardPage.page.keyboard.press("Control+V");
      await dashboardPage.clickOnBtnWithLabel("Save");
      await sfPage.page.goto(`https://${conf.suiteConf.domain}`);
      for (const socialProofItem of conf.caseConf.social_proof_edit.data_content) {
        const socialProofActual = await sfPage.getSocialProof();
        const data = await hiveNotification.convertDataInVariable(conf.caseConf.file_edit, [
          "title",
          "content",
          "time",
          "link",
        ]);

        // Compare each key-value pair in config equal with content got from popup
        Object.entries(socialProofItem).forEach(entry => {
          const [key] = entry;
          expect(data[key]).toContain(socialProofActual[key.trim()]);
        });

        let delayTime: number;
        const socialProofEdit = conf.caseConf.social_proof_edit;
        if (Object.keys(socialProofEdit).indexOf(`delayTime`) > -1) {
          delayTime = Number(socialProofEdit.delay_time) * 1000;
        } else {
          delayTime = Number(conf.caseConf.social_proof_data[0].delay_time) * 1000;
        }
        await dashboardPage.page.waitForTimeout(delayTime);
      }
    });
  });

  test("Check hiện thị khi người dùng tắt social proof rồi load lại @SB_HSB_SPIH_12", async ({
    page,
    conf,
    dashboard,
  }) => {
    const id = await hiveNotification.getXpathIdSocialProof(conf.caseConf.social_proof_data[0].name).textContent();
    await hiveNotification.copyScript(`${id}`);
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    const sfPage = new SFHome(page, conf.suiteConf.domain);
    await dashboardPage.page.goto(`https://${conf.suiteConf.domain}/admin/preferences`);
    await dashboardPage.genLoc(dashboardPage.xpathScriptPreferences).click();
    await dashboardPage.page.keyboard.press("Control+A");
    await dashboardPage.page.keyboard.press("Control+V");
    await dashboardPage.clickOnBtnWithLabel("Save");
    await dashboardPage.page.waitForSelector(dashboardPage.getXpathWithLabel("Saving success"), { state: "visible" });
    await sfPage.page.goto(`https://${conf.suiteConf.domain}`);

    let socialProofBefore: object;
    await test.step("Check tắt popup social proof", async () => {
      await sfPage.page.waitForSelector(sfPage.xpathSocialProofToast);
      socialProofBefore = await sfPage.getSocialProof();
      await sfPage.genLoc(sfPage.xpathCloseSocialProof).click();
      await expect(sfPage.genLoc(sfPage.xpathSocialProofToast)).toBeHidden();
    });

    await test.step("Check hiện thị popup khi load lại trang", async () => {
      await sfPage.page.reload();
      await sfPage.page.waitForSelector(sfPage.xpathSocialProofToast);
      const socialProofAfter = await sfPage.getSocialProof();
      expect(socialProofBefore).toEqual(socialProofAfter);
    });
  });

  test("Check tăng giá trị trường View,Click,CR của 1 social-proof @SB_HSB_SPIH_13", async ({
    conf,
    page,
    dashboard,
  }) => {
    const id = await hiveNotification.getXpathIdSocialProof(conf.caseConf.social_proof_data[0].name).textContent();
    const numberClickFirst = await hiveNotification.getDataFiedById(`${id}`, "Click");
    const numberViewFirst = await hiveNotification.getDataFiedById(`${id}`, "View");
    await hiveNotification.copyScript(`${id}`);
    const dashboardPage = new DashboardPage(dashboard, conf.suiteConf.domain);
    const sfPage = new SFHome(page, conf.suiteConf.domain);
    await dashboardPage.page.goto(`https://${conf.suiteConf.domain}/admin/preferences`);
    await dashboardPage.genLoc(dashboardPage.xpathScriptPreferences).click();
    await dashboardPage.page.keyboard.press("Control+A");
    await dashboardPage.page.keyboard.press("Control+V");
    await dashboardPage.clickOnBtnWithLabel("Save");
    const numberClicks = conf.caseConf.number;
    for (let i = 0; i < numberClicks; i++) {
      await sfPage.page.goto(`https://${conf.suiteConf.domain}`);

      await test.step('Tăng field "View" của 1 social proof', async () => {
        await sfPage.page.waitForSelector(sfPage.xpathSocialProofToast);
      });

      await test.step('Check tăng field "Click" của 1 social proof', async () => {
        await sfPage.genLoc(sfPage.xpathSocialProofToast).click();
      });
    }

    await hiveNotification.page.reload();
    await hiveNotification.page.waitForLoadState("domcontentloaded");
    const numberView = await hiveNotification.getDataFiedById(`${id}`, "View");
    const numberClick = await hiveNotification.getDataFiedById(`${id}`, "Click");
    expect(Number(numberViewFirst) + numberClicks).toEqual(Number(numberView));
    expect(Number(numberClickFirst) + numberClicks).toEqual(Number(numberClick));
  });

  test("Download,Upload file thành công @SB_HSB_SPIH_9", async ({ conf }) => {
    await test.step("Upload file", async () => {
      await hiveNotification.genLoc(hiveNotification.xpathBtnAddNew).click();
      await hiveNotification.clickAction(hiveNotification.getXpathWithLabel("Upload CSV"));
      await hiveNotification.uploadFile("csv", conf.caseConf.file);
      const header = await hiveNotification.getTextContent(hiveNotification.xpathModalTitle);
      const title = await hiveNotification.getTextContent(hiveNotification.xpathModalBody);
      expect(header.trim()).toEqual("Infomation");
      expect(title.trim()).toEqual("You file upload successfully!");
      await hiveNotification.genLoc(hiveNotification.xpathBtnClose).click();
    });

    await test.step("Check down load file thành công", async () => {
      const resultCSV = await hiveNotification.checkDataInDownloadFile(
        hiveNotification.getXpathWithLabel("Download csv"),
        2,
        conf.caseConf.file,
      );
      expect(resultCSV).toEqual(true);
    });
  });

  test("Check các TH update record không thành công @SB_HSB_SPIH_6", async ({ conf }) => {
    const dataEditContent = conf.caseConf.social_proof_edit;
    const dataAddContent = conf.caseConf.social_proof_data[0];
    const nameSocialProof = conf.caseConf.social_proof_data[0].name;
    await test.step("Click và button edit của social proof bất kì", async () => {
      await hiveNotification.getXpathLinkName(nameSocialProof).click();
      const contentExpect = dataAddContent.data_content;
      if (contentExpect) {
        for (let i = 0; i < dataAddContent.data_content; i++) {
          const dataResltFormEdit = await hiveNotification.getInputValueFromSocialContent(i);
          expect(dataResltFormEdit).toEqual(
            expect.objectContaining({
              title: contentExpect.title,
              content: contentExpect.content,
              time: contentExpect.time,
              link: contentExpect.link,
            }),
          );
        }
      }
    });

    await test.step("Nhập vào các trường tương ứng trong file data=>Click vào button Update", async () => {
      for (let i = 0; i < dataEditContent.length; i++) {
        for (let j = 0; j < Object.keys(dataEditContent[i]).length - 1; j++) {
          const filedNames = Object.keys(dataEditContent[i])[j];
          const valueField = dataEditContent[i][`${filedNames}`];
          await hiveNotification.fillFormDataEdit(valueField.name, valueField.value, valueField.index);
          await hiveNotification.clickOnBtnWithLabel("Update");
          if (dataEditContent[i]["display_message"] == true) {
            await expect(hiveNotification.genLoc(hiveNotification.xpathAlertDismiss)).toBeVisible();
          } else {
            await expect(hiveNotification.getXpathInputWithLabel(valueField.name)).toBeFocused();
          }
        }
      }
    });
  });
});
