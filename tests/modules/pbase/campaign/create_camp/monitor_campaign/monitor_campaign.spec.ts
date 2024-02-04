import { expect, test } from "@core/fixtures";
import { PrintBasePage } from "@pages/dashboard/printbase";
import { loadData } from "@core/conf/conf";
import { defaultSnapshotOptions } from "@constants/visual_compare";
import { SFProduct } from "@sf_pages/product";

test.describe("Create thành công nhiều campaign", () => {
  test(`@SB_PB_PLB_PH_BP_19 Delete all campaign`, async ({ dashboard, conf }) => {
    test.setTimeout(conf.suiteConf.timeout);
    const printbasePage = new PrintBasePage(dashboard, conf3d.suiteConf.domain);
    await printbasePage.navigateToMenu("Campaigns");
    await printbasePage.deleteAllCampaign(conf.suiteConf.password);
  });
  const conf3d = loadData(__dirname, "DATA_DRIVEN_3D");
  for (let i = 0; i < conf3d.caseConf.data.length; i++) {
    const caseData = conf3d.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard }) => {
      test.setTimeout(conf3d.suiteConf.timeout);
      const dataCampaign = caseData.data_test;
      const printbasePage = new PrintBasePage(dashboard, conf3d.suiteConf.domain);
      for (let j = 0; j < dataCampaign.length; j++) {
        const campaignsInfos = dataCampaign[j].campaign_info;
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.launchCamp(campaignsInfos);
        await dashboard.waitForTimeout(5000);
      }
    });
  }

  const conf2d = loadData(__dirname, "DATA_DRIVEN_2D");
  for (let i = 0; i < conf2d.caseConf.data.length; i++) {
    const caseData = conf2d.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard }) => {
      test.setTimeout(conf2d.suiteConf.timeout);
      const dataCampaign = caseData.data_test;
      const printbasePage = new PrintBasePage(dashboard, conf2d.suiteConf.domain);
      for (let j = 0; j < dataCampaign.length; j++) {
        const campaignsInfos = dataCampaign[j].campaign_info;
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.launchCamp(campaignsInfos);
        await dashboard.waitForTimeout(5000);
      }
    });
  }

  const confhome = loadData(__dirname, "DATA_DRIVEN_HOME");
  for (let i = 0; i < confhome.caseConf.data.length; i++) {
    const caseData = confhome.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard }) => {
      test.setTimeout(confhome.suiteConf.timeout);
      const dataCampaign = caseData.data_test;
      const printbasePage = new PrintBasePage(dashboard, confhome.suiteConf.domain);
      for (let j = 0; j < dataCampaign.length; j++) {
        const campaignsInfos = dataCampaign[j].campaign_info;
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.launchCamp(campaignsInfos);
        await dashboard.waitForTimeout(5000);
      }
    });
  }

  const confacc = loadData(__dirname, "DATA_DRIVEN_ACC");
  for (let i = 0; i < confacc.caseConf.data.length; i++) {
    const caseData = confacc.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard }) => {
      test.setTimeout(confacc.suiteConf.timeout);
      const dataCampaign = caseData.data_test;
      const printbasePage = new PrintBasePage(dashboard, confacc.suiteConf.domain);
      for (let j = 0; j < dataCampaign.length; j++) {
        const campaignsInfos = dataCampaign[j].campaign_info;
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.launchCamp(campaignsInfos);
        await dashboard.waitForTimeout(5000);
      }
    });
  }

  const conshoes = loadData(__dirname, "DATA_DRIVEN_SHOES");
  for (let i = 0; i < conshoes.caseConf.data.length; i++) {
    const caseData = conshoes.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard }) => {
      test.setTimeout(conshoes.suiteConf.timeout);
      const dataCampaign = caseData.data_test;
      const printbasePage = new PrintBasePage(dashboard, conshoes.suiteConf.domain);
      for (let j = 0; j < dataCampaign.length; j++) {
        const campaignsInfos = dataCampaign[j].campaign_info;
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.launchCamp(campaignsInfos);
        await dashboard.waitForTimeout(5000);
      }
    });
  }

  const confdw = loadData(__dirname, "DATA_DRIVEN_DW");
  for (let i = 0; i < confdw.caseConf.data.length; i++) {
    const caseData = confdw.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard }) => {
      test.setTimeout(confdw.suiteConf.timeout);
      const dataCampaign = caseData.data_test;
      const printbasePage = new PrintBasePage(dashboard, confdw.suiteConf.domain);
      for (let j = 0; j < dataCampaign.length; j++) {
        const campaignsInfos = dataCampaign[j].campaign_info;
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.launchCamp(campaignsInfos);
        await dashboard.waitForTimeout(5000);
      }
    });
  }

  const confphone = loadData(__dirname, "DATA_DRIVEN_PHONE");
  for (let i = 0; i < confphone.caseConf.data.length; i++) {
    const caseData = confphone.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard }) => {
      test.setTimeout(confphone.suiteConf.timeout);
      const dataCampaign = caseData.data_test;
      const printbasePage = new PrintBasePage(dashboard, confphone.suiteConf.domain);
      for (let j = 0; j < dataCampaign.length; j++) {
        const campaignsInfos = dataCampaign[j].campaign_info;
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.launchCamp(campaignsInfos);
        await dashboard.waitForTimeout(5000);
      }
    });
  }

  const confje = loadData(__dirname, "DATA_DRIVEN_JEWELRY");
  for (let i = 0; i < confje.caseConf.data.length; i++) {
    const caseData = confje.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard }) => {
      test.setTimeout(confje.suiteConf.timeout);
      const dataCampaign = caseData.data_test;
      const printbasePage = new PrintBasePage(dashboard, confje.suiteConf.domain);
      for (let j = 0; j < dataCampaign.length; j++) {
        const campaignsInfos = dataCampaign[j].campaign_info;
        await printbasePage.navigateToMenu("Catalog");
        await printbasePage.launchCamp(campaignsInfos);
        await dashboard.waitForTimeout(5000);
      }
    });
  }

  const confVerify3d = loadData(__dirname, "VERIFY_CAMPAIGN_3D");
  for (let i = 0; i < confVerify3d.caseConf.data.length; i++) {
    const caseData = confVerify3d.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, context, snapshotFixture }) => {
      test.setTimeout(confVerify3d.suiteConf.timeout);
      const printbasePage = new PrintBasePage(dashboard, confVerify3d.suiteConf.domain);
      const dataCampaign = caseData.data_test;
      for (let j = 0; j < dataCampaign.length; j++) {
        await test.step("Verify campaign detail", async () => {
          await printbasePage.navigateToMenu("Campaigns");
          const result = await printbasePage.waitDisplayMockupDetailCampaign(dataCampaign[j].campaign_name);
          expect(result).toBeTruthy();
          await dashboard.click(printbasePage.xpathTitleOrganization);
          await snapshotFixture.verify({
            page: printbasePage.page,
            selector: printbasePage.xpathSectionImageInDetail,
            snapshotName: dataCampaign[j].picture.image_list,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });
        await test.step("Verify campaign ngoài SF", async () => {
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
          const campaignSF = new SFProduct(SFPage, confVerify3d.suiteConf.domain);
          await campaignSF.page.waitForTimeout(10000);
          await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
          const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
          for (let k = 0; k < countImageMockup; k++) {
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: `(${campaignSF.xpathProductMockup})[${k + 1}]`,
              snapshotName: `${dataCampaign[j].picture.image_sf}-${k + 1}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          }
        });
      }
    });
  }

  const confVerify2d = loadData(__dirname, "VERIFY_CAMPAIGN_2D");
  for (let i = 0; i < confVerify2d.caseConf.data.length; i++) {
    const caseData = confVerify2d.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, context, snapshotFixture }) => {
      test.setTimeout(confVerify3d.suiteConf.timeout);
      const printbasePage = new PrintBasePage(dashboard, confVerify2d.suiteConf.domain);
      const dataCampaign = caseData.data_test;
      for (let j = 0; j < dataCampaign.length; j++) {
        await test.step("Verify campaign detail", async () => {
          await printbasePage.navigateToMenu("Campaigns");
          const result = await printbasePage.waitDisplayMockupDetailCampaign(dataCampaign[j].campaign_name);
          expect(result).toBeTruthy();
          await dashboard.click(printbasePage.xpathTitleOrganization);
          await snapshotFixture.verify({
            page: printbasePage.page,
            selector: printbasePage.xpathSectionImageInDetail,
            snapshotName: dataCampaign[j].picture.image_list,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });
        await test.step("Verify campaign ngoài SF", async () => {
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
          const campaignSF = new SFProduct(SFPage, confVerify2d.suiteConf.domain);
          await campaignSF.page.waitForTimeout(10000);
          await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
          const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
          for (let k = 0; k < countImageMockup; k++) {
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: `(${campaignSF.xpathProductMockup})[${k + 1}]`,
              snapshotName: `${dataCampaign[j].picture.image_sf}-${k + 1}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          }
        });
      }
    });
  }

  const confVerifyHome = loadData(__dirname, "VERIFY_CAMPAIGN_HOME");
  for (let i = 0; i < confVerifyHome.caseConf.data.length; i++) {
    const caseData = confVerifyHome.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, context, snapshotFixture }) => {
      test.setTimeout(confVerifyHome.suiteConf.timeout);
      const printbasePage = new PrintBasePage(dashboard, confVerifyHome.suiteConf.domain);
      const dataCampaign = caseData.data_test;
      for (let j = 0; j < dataCampaign.length; j++) {
        await test.step("Verify campaign detail", async () => {
          await printbasePage.navigateToMenu("Campaigns");
          const result = await printbasePage.waitDisplayMockupDetailCampaign(dataCampaign[j].campaign_name);
          expect(result).toBeTruthy();
          await dashboard.click(printbasePage.xpathTitleOrganization);
          await snapshotFixture.verify({
            page: printbasePage.page,
            selector: printbasePage.xpathSectionImageInDetail,
            snapshotName: dataCampaign[j].picture.image_list,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });
        await test.step("Verify campaign ngoài SF", async () => {
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
          const campaignSF = new SFProduct(SFPage, confVerifyHome.suiteConf.domain);
          await campaignSF.page.waitForTimeout(10000);
          await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
          const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
          for (let k = 0; k < countImageMockup; k++) {
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: `(${campaignSF.xpathProductMockup})[${k + 1}]`,
              snapshotName: `${dataCampaign[j].picture.image_sf}-${k + 1}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          }
        });
      }
    });
  }

  const confVerifyAcc = loadData(__dirname, "VERIFY_CAMPAIGN_ACC");
  for (let i = 0; i < confVerifyAcc.caseConf.data.length; i++) {
    const caseData = confVerifyAcc.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, context, snapshotFixture }) => {
      test.setTimeout(confVerifyAcc.suiteConf.timeout);
      const printbasePage = new PrintBasePage(dashboard, confVerifyAcc.suiteConf.domain);
      const dataCampaign = caseData.data_test;
      for (let j = 0; j < dataCampaign.length; j++) {
        await test.step("Verify campaign detail", async () => {
          await printbasePage.navigateToMenu("Campaigns");
          const result = await printbasePage.waitDisplayMockupDetailCampaign(dataCampaign[j].campaign_name);
          expect(result).toBeTruthy();
          await dashboard.click(printbasePage.xpathTitleOrganization);
          await snapshotFixture.verify({
            page: printbasePage.page,
            selector: printbasePage.xpathSectionImageInDetail,
            snapshotName: dataCampaign[j].picture.image_list,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });
        await test.step("Verify campaign ngoài SF", async () => {
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
          const campaignSF = new SFProduct(SFPage, confVerifyAcc.suiteConf.domain);
          await campaignSF.page.waitForTimeout(10000);
          await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
          const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
          for (let k = 0; k < countImageMockup; k++) {
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: `(${campaignSF.xpathProductMockup})[${k + 1}]`,
              snapshotName: `${dataCampaign[j].picture.image_sf}-${k + 1}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          }
        });
      }
    });
  }

  const confVerifyShoes = loadData(__dirname, "VERIFY_CAMPAIGN_SHOES");
  for (let i = 0; i < confVerifyShoes.caseConf.data.length; i++) {
    const caseData = confVerifyShoes.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, context, snapshotFixture }) => {
      test.setTimeout(confVerifyShoes.suiteConf.timeout);
      const printbasePage = new PrintBasePage(dashboard, confVerifyShoes.suiteConf.domain);
      const dataCampaign = caseData.data_test;
      for (let j = 0; j < dataCampaign.length; j++) {
        await test.step("Verify campaign detail", async () => {
          await printbasePage.navigateToMenu("Campaigns");
          const result = await printbasePage.waitDisplayMockupDetailCampaign(dataCampaign[j].campaign_name);
          expect(result).toBeTruthy();
          await dashboard.click(printbasePage.xpathTitleOrganization);
          await snapshotFixture.verify({
            page: printbasePage.page,
            selector: printbasePage.xpathSectionImageInDetail,
            snapshotName: dataCampaign[j].picture.image_list,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });
        await test.step("Verify campaign ngoài SF", async () => {
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
          const campaignSF = new SFProduct(SFPage, confVerifyShoes.suiteConf.domain);
          await campaignSF.page.waitForTimeout(10000);
          await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
          const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
          for (let k = 0; k < countImageMockup; k++) {
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: `(${campaignSF.xpathProductMockup})[${k + 1}]`,
              snapshotName: `${dataCampaign[j].picture.image_sf}-${k + 1}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          }
        });
      }
    });
  }

  const confVerifyDw = loadData(__dirname, "VERIFY_CAMPAIGN_DW");
  for (let i = 0; i < confVerifyDw.caseConf.data.length; i++) {
    const caseData = confVerifyDw.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, context, snapshotFixture }) => {
      test.setTimeout(confVerifyDw.suiteConf.timeout);
      const printbasePage = new PrintBasePage(dashboard, confVerifyDw.suiteConf.domain);
      const dataCampaign = caseData.data_test;
      for (let j = 0; j < dataCampaign.length; j++) {
        await test.step("Verify campaign detail", async () => {
          await printbasePage.navigateToMenu("Campaigns");
          const result = await printbasePage.waitDisplayMockupDetailCampaign(dataCampaign[j].campaign_name);
          expect(result).toBeTruthy();
          await dashboard.click(printbasePage.xpathTitleOrganization);
          await snapshotFixture.verify({
            page: printbasePage.page,
            selector: printbasePage.xpathSectionImageInDetail,
            snapshotName: dataCampaign[j].picture.image_list,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });
        await test.step("Verify campaign ngoài SF", async () => {
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
          const campaignSF = new SFProduct(SFPage, confVerifyDw.suiteConf.domain);
          await campaignSF.page.waitForTimeout(10000);
          await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
          const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
          for (let k = 0; k < countImageMockup; k++) {
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: `(${campaignSF.xpathProductMockup})[${k + 1}]`,
              snapshotName: `${dataCampaign[j].picture.image_sf}-${k + 1}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          }
        });
      }
    });
  }

  const confVerifyPhone = loadData(__dirname, "VERIFY_CAMPAIGN_PHONE");
  for (let i = 0; i < confVerifyPhone.caseConf.data.length; i++) {
    const caseData = confVerifyPhone.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, context, snapshotFixture }) => {
      test.setTimeout(confVerifyPhone.suiteConf.timeout);
      const printbasePage = new PrintBasePage(dashboard, confVerifyPhone.suiteConf.domain);
      const dataCampaign = caseData.data_test;
      for (let j = 0; j < dataCampaign.length; j++) {
        await test.step("Verify campaign detail", async () => {
          await printbasePage.navigateToMenu("Campaigns");
          const result = await printbasePage.waitDisplayMockupDetailCampaign(dataCampaign[j].campaign_name);
          expect(result).toBeTruthy();
          await dashboard.click(printbasePage.xpathTitleOrganization);
          await snapshotFixture.verify({
            page: printbasePage.page,
            selector: printbasePage.xpathSectionImageInDetail,
            snapshotName: dataCampaign[j].picture.image_list,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });
        await test.step("Verify campaign ngoài SF", async () => {
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
          const campaignSF = new SFProduct(SFPage, confVerifyPhone.suiteConf.domain);
          await campaignSF.page.waitForTimeout(10000);
          await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
          const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
          for (let k = 0; k < countImageMockup; k++) {
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: `(${campaignSF.xpathProductMockup})[${k + 1}]`,
              snapshotName: `${dataCampaign[j].picture.image_sf}-${k + 1}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          }
        });
      }
    });
  }

  const confVerifyJe = loadData(__dirname, "VERIFY_CAMPAIGN_JE");
  for (let i = 0; i < confVerifyJe.caseConf.data.length; i++) {
    const caseData = confVerifyJe.caseConf.data[i];

    test(`@${caseData.case_id} ${caseData.description}`, async ({ dashboard, context, snapshotFixture }) => {
      test.setTimeout(confVerifyJe.suiteConf.timeout);
      const printbasePage = new PrintBasePage(dashboard, confVerifyJe.suiteConf.domain);
      const dataCampaign = caseData.data_test;
      for (let j = 0; j < dataCampaign.length; j++) {
        await test.step("Verify campaign detail", async () => {
          await printbasePage.navigateToMenu("Campaigns");
          const result = await printbasePage.waitDisplayMockupDetailCampaign(dataCampaign[j].campaign_name);
          expect(result).toBeTruthy();
          await dashboard.click(printbasePage.xpathTitleOrganization);
          await snapshotFixture.verify({
            page: printbasePage.page,
            selector: printbasePage.xpathSectionImageInDetail,
            snapshotName: dataCampaign[j].picture.image_list,
            snapshotOptions: {
              maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
              threshold: defaultSnapshotOptions.threshold,
              maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
            },
          });
        });
        await test.step("Verify campaign ngoài SF", async () => {
          const [SFPage] = await Promise.all([context.waitForEvent("page"), await printbasePage.openCampaignSF()]);
          const campaignSF = new SFProduct(SFPage, confVerifyJe.suiteConf.domain);
          await campaignSF.page.waitForTimeout(10000);
          await campaignSF.waitUntilElementVisible(campaignSF.xpathProductMockupSlide);
          const countImageMockup = await campaignSF.waitForImagesMockupLoaded();
          for (let k = 0; k < countImageMockup; k++) {
            await snapshotFixture.verify({
              page: campaignSF.page,
              selector: `(${campaignSF.xpathProductMockup})[${k + 1}]`,
              snapshotName: `${dataCampaign[j].picture.image_sf}-${k + 1}.png`,
              snapshotOptions: {
                maxDiffPixelRatio: defaultSnapshotOptions.maxDiffPixelRatio,
                threshold: defaultSnapshotOptions.threshold,
                maxDiffPixels: defaultSnapshotOptions.maxDiffPixels,
              },
            });
          }
        });
      }
    });
  }
});
