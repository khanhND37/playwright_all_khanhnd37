import { expect, test } from "@core/fixtures";
import { ProfilePage } from "@pages/dashboard/profile_partner";

/**
 * Code name: `@TC_SB_MP_CR_PP_4`
 * Description: Test case này để edit profile của parner thành công và preview được trên trang Shopbase Network
 * Test case `@TC_SB_MP_CR_PP_4`:
      - Steps:
        - Login partner dashboard
        - Truy cập trang Profile của ShopBase Network
        - Edit thông tin vào các trường
        - Click Save changes và verify toast thông báo edit profile thành công
        - Preview profile vừa sửa tại trang Shopbase Network
       */
test.describe("Check partner profile @TS_SB", async () => {
  const verifyTitleNewTab = async ({ page, context, linkSelector, titleSelector, titleExpect }) => {
    const [previewPage] = await Promise.all([context.waitForEvent("page"), await page.click(linkSelector)]);
    await previewPage.waitForLoadState("networkidle");
    await expect(await previewPage.innerText(titleSelector)).toEqual(titleExpect);
    await previewPage.close();
  };

  //Verify edit info profile successfully
  test("Verify edit profile successfully @TC_SB_MP_CR_PP_4", async ({ page, conf, context }) => {
    const profilePage = new ProfilePage(page, conf.suiteConf.domain);
    await test.step("Go to profile detail page and edit", async () => {
      await profilePage.goToSignInPage({
        email: conf.suiteConf.username,
        password: conf.suiteConf.password,
      });
      await profilePage.goToProfileDetailPage(page);
      await profilePage.editInfoProfile(page, conf.caseConf.profile_data);
    });

    //Preview profile
    await test.step("Preview profile", async () => {
      const title = profilePage.profileName;
      await page
        .locator(`//i[contains(@class,'icon-eye')]//following-sibling::span[normalize-space()='Preview']`)
        .click();
      page.waitForLoadState();

      await verifyTitleNewTab({
        page,
        context,
        linkSelector: `//i[contains(@class,'icon-eye')]//following-sibling::span[normalize-space()='Preview']`,
        titleSelector: `//div[contains(@class,'partner-profile__info')]//*[normalize-space()='${title}']`,
        titleExpect: title,
      });
    });
  });
});
