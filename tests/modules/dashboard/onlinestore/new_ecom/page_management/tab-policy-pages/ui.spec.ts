import { loadData } from "@core/conf/conf";
import { test, expect } from "@fixtures/website_builder";
import { DashboardPage } from "@pages/dashboard/dashboard";
import { OtherPage } from "@pages/new_ecom/dashboard/pages";

test.describe("Verify UI tab Policy", () => {
  let dashboardPage: DashboardPage;
  let otherPage: OtherPage;

  const caseData = loadData(__dirname, "DATA_DRIVEN");
  for (const caseDataItem of caseData.caseConf.data) {
    const policyPages = caseDataItem.policy_pages;
    test(`${caseDataItem.description} @${caseDataItem.case_id}`, async ({ dashboard, conf, snapshotFixture }) => {
      dashboardPage = new DashboardPage(dashboard, caseDataItem.domain);
      otherPage = new OtherPage(dashboard, caseDataItem.domain);
      const snapshotOptions = conf.suiteConf.snapshot_options;
      await test.step(`Tại trang Page management, click tab Policy page`, async () => {
        await dashboardPage.navigateToSubMenu("Online Store", "Pages");
        await otherPage.genLoc(otherPage.getXpathByTabName("Policy Pages")).click();
        await otherPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);

        expect(await otherPage.getTextDescriptionInPageTab("Policy")).toEqual(caseDataItem.text);
        if (caseDataItem.shop_type === "ShopBase") {
          await expect(otherPage.genLoc(otherPage.xpathTabNavFilter)).toBeVisible();
        } else {
          await expect(otherPage.genLoc(otherPage.xpathTabNavFilter)).toBeHidden();
        }

        await expect(otherPage.genLoc(otherPage.searchInPageList)).toBeHidden();
        await expect(otherPage.genLoc(otherPage.buttonAddNewPageSelector)).toBeHidden();

        const listPage = await otherPage.getAllPagePolicyDisplay();
        expect(listPage.length).toEqual(policyPages.length);
        for (let i = 0; i < listPage.length; i++) {
          expect(listPage[i]).toEqual(
            expect.objectContaining({
              title: policyPages[i].title,
              handle: policyPages[i].handle,
              selectable: policyPages[i].selectable,
              customizable: policyPages[i].customize,
            }),
          );
        }
      });

      await test.step(`Click text link disclaimer`, async () => {
        await otherPage.genLoc("//a[normalize-space()='disclaimer']").click();
        await snapshotFixture.verify({
          page: dashboard,
          selector: otherPage.xpathPopupDisclaimer,
          snapshotName: caseDataItem.popup_disclaimer,
          snapshotOptions,
        });
      });

      await test.step(`Click icon X / btn OK`, async () => {
        await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("OK")).click();
        await expect(otherPage.genLoc(otherPage.xpathPopupDisclaimer)).toBeHidden();
      });
    });
  }
});

test(`@SB_NEWECOM_NEPM_24 Tab Policy Pages_Kiểm tra giao diện detail page policy, shop SB`, async ({
  dashboard,
  conf,
  snapshotFixture,
  context,
}) => {
  const dashboardPage = new DashboardPage(dashboard, conf.caseConf.domain);
  const otherPage = new OtherPage(dashboard, conf.caseConf.domain);
  const snapshotOptions = conf.suiteConf.snapshot_options;
  await dashboardPage.navigateToSubMenu("Online Store", "Pages");
  await dashboardPage.genLoc(otherPage.getXpathByTabName("Policy Pages")).click();
  await otherPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);

  await test.step(`Mở trang detail một page trong dashboard`, async () => {
    await dashboardPage.genLoc(otherPage.getXpathPageByTitle(conf.caseConf.page_title)).click();
    await dashboardPage.page.waitForLoadState("networkidle");
    for (const field of conf.caseConf.fields) {
      await expect(
        dashboardPage.genLoc(otherPage.getXpathFieldNameOrDescriptionInDetailPage(field.field_name)),
      ).toBeVisible();

      if (field.field_name === "Content") {
        await expect(dashboardPage.page.getByText(field.text1)).toBeVisible();
        await expect(dashboardPage.page.getByText(field.text2)).toBeVisible();
      }
      await expect(
        dashboardPage.genLoc(otherPage.getXpathFieldNameOrDescriptionInDetailPage(field.description)),
      ).toBeVisible();
    }
    await expect(
      dashboardPage.genLoc(
        "//div[contains(@class,'sb-form-item') and descendant::label[normalize-space()='Page Status']]",
      ),
    ).toBeVisible();
    await expect(dashboardPage.genLoc("//input[@name='handle']")).toBeDisabled();
    await expect(dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Delete"))).toBeHidden();
    await expect(dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Duplicate"))).toBeHidden();

    for (const variable of conf.caseConf.variables) {
      await expect(dashboardPage.genLoc(otherPage.getXpathVariable(variable))).toBeVisible();
    }
  });

  await test.step(`Click textlink disclaimer > Click btn X hoặc OK`, async () => {
    await dashboardPage.genLoc("//a[normalize-space()='disclaimer']").click();
    await snapshotFixture.verify({
      page: dashboard,
      selector: otherPage.xpathPopupDisclaimer,
      snapshotName: conf.caseConf.popup_disclaimer,
      snapshotOptions,
    });

    await dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("OK")).click();
    await expect(otherPage.genLoc(otherPage.xpathPopupDisclaimer)).toBeHidden();
  });

  await test.step(`Click textlink Learn more`, async () => {
    const [helpDoc] = await Promise.all([
      context.waitForEvent("page"),
      await dashboardPage.genLoc("//div[@class='setting-page__block-desc']//a[normalize-space()='Learn more']").click(),
    ]);
    await helpDoc.waitForLoadState("load");
    expect(helpDoc.url()).toContain("https://help.shopbase.com/en/article/set-up-policy-pages-esa9d6/");
    await helpDoc.close();
  });

  await test.step(`Lần lượt hover vào variabe {{processing.time}} và {{shipping.time}}`, async () => {
    for (const variable of conf.caseConf.hover_variable) {
      const text = await dashboardPage.getTextOnTooltip(
        otherPage.getXpathVariable(variable),
        "(//div[@class='text-normal'])[last()]",
      );
      expect(text).toContain(conf.caseConf.tooltip);
    }
  });

  await test.step(`Click btn Back`, async () => {
    await dashboardPage.genLoc(otherPage.buttonBackToListPages).click();
    await dashboardPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);
    await expect(dashboardPage.genLoc(otherPage.getXpathTabActiveInList("Policy Pages"))).toBeVisible();
  });
});

test(`@SB_NEWECOM_NEPM_37 Tab Policy Pages_Kiểm tra giao diện detail page policy, shop PB, PLB`, async ({
  page,
  conf,
  token,
}) => {
  for (const shopData of conf.caseConf.data_shop) {
    const dashboardPage = new DashboardPage(page, shopData.domain);
    const otherPage = new OtherPage(page, shopData.domain);
    const accessToken = (
      await token.getWithCredentials({
        domain: shopData.shop_name,
        username: conf.suiteConf.username,
        password: conf.suiteConf.password,
      })
    ).access_token;
    await dashboardPage.loginWithToken(accessToken);
    await dashboardPage.navigateToSubMenu("Online Store", "Pages");
    await dashboardPage.genLoc(otherPage.getXpathByTabName("Policy Pages")).click();
    await otherPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);

    await test.step(`Mở trang detail một page trong dashboard`, async () => {
      await dashboardPage.genLoc(otherPage.getXpathPageByTitle(conf.caseConf.page_title)).click();
      await dashboardPage.page.waitForLoadState("networkidle");
      for (const field of conf.caseConf.fields) {
        await expect(
          dashboardPage.genLoc(otherPage.getXpathFieldNameOrDescriptionInDetailPage(field.field_name)),
        ).toBeVisible();
        await expect(
          dashboardPage.genLoc(otherPage.getXpathFieldNameOrDescriptionInDetailPage(field.description)),
        ).toBeVisible();
      }
      await expect(
        dashboardPage.genLoc(
          "//div[contains(@class,'sb-form-item') and descendant::label[normalize-space()='Page Status']]",
        ),
      ).toBeHidden();

      await expect(dashboardPage.genLoc("//input[@name='handle']")).toBeDisabled();
      await expect(dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Delete"))).toBeHidden();
      await expect(dashboardPage.genLoc(dashboardPage.xpathBtnWithLabel("Duplicate"))).toBeHidden();

      for (const variable of conf.caseConf.variables) {
        await expect(dashboardPage.genLoc(otherPage.getXpathVariable(variable))).toBeHidden();
      }
    });

    await test.step(`Click btn Back`, async () => {
      await dashboardPage.genLoc(otherPage.buttonBackToListPages).click();
      await dashboardPage.waitForElementVisibleThenInvisible(otherPage.xpathSkeletonTable);
      await expect(dashboardPage.genLoc(otherPage.getXpathTabActiveInList("Policy Pages"))).toBeVisible();
    });
  }
});
